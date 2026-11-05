import type { DeckKind, GameAction, GameState, Player, LogEntry } from '@typhu/contracts';
import { boardFor, groupsFor, CITY_EVENTS, getCard } from '@typhu/game-content';
import { random } from './random';
import { changeCash, payCash } from './cash-events';
import { newlyCompletedMonopolies } from './monopoly-notice';
import { bankSupply, buildProblem, currentPlayer, groupTiles, managingPlayer, netWorth, ownedTiles, rentFor, taxFor, FLIGHT_FEE, flightTargets } from './selectors';
import { buyBackQuote, constructionUpgradeCost, initialConstruction, propertyClosed, usesLandingRules } from './property-rules';
import { cardSelectionProblem, specialCardDestination } from './card-targets';
import { festivalTargets, nextFestivalMultiplier } from './festivals';
import { applyPropertyEvent } from './property-events';
import { liquidationPlan, liquidationPotential, liquidationTileIds, liquidationValue, usesFullLiquidation } from './liquidation';
import { completeVictory, resolveInstantVictory, usesBusinessTourVictory } from './victory';

function log(state: GameState, message: string, kind: 'info' | 'money' | 'property' | 'event' = 'info', propertyChange?: LogEntry['propertyChange']) {
  state.log.unshift({ id: state.nextLogId++, round: state.round, message, kind, ...(propertyChange ? {propertyChange} : {}) });
  state.log = state.log.slice(0, 120);
}
function reject(state: GameState, error: string) { state.error = error; }
const islandName = (state: GameState) => boardFor(state).find(tile => tile.kind === 'jail')!.name;
const money = (value: number) => `₫${value.toLocaleString('vi-VN')}`;

function settlePayments(state: GameState) {
  if (state.debt) {
    const debtor = state.players.find((p) => p.id === state.debt!.debtorId)!;
    const paid = Math.min(debtor.cash, state.debt.amount);
    payCash(state, debtor, state.debt.creditorId, paid, state.debt.reason);
    if (state.debt.creditorId) {
      const creditor = state.players.find((p) => p.id === state.debt!.creditorId)!;
      if (paid > 0) log(state, `${debtor.name} trả ${money(paid)} cho ${creditor.name}: ${state.debt.reason}.`, 'money');
    }
    state.debt.amount -= paid;
    if (state.debt.amount > 0) return;
    log(state, `${debtor.name} đã thanh toán xong khoản nợ.`, 'money');
    state.debt = null;
  }
  while (state.pendingPayments.length && !state.debt) {
    const payment = state.pendingPayments.shift()!;
    const from = state.players.find((p) => p.id === payment.fromId)!;
    if (from.bankrupt) continue;
    const paid = Math.min(from.cash, payment.amount);
    payCash(state, from, payment.toId, paid, payment.reason);
    if (payment.toId) {
      const creditor = state.players.find((p) => p.id === payment.toId)!;
      if (paid > 0) log(state, `${from.name} trả ${money(paid)} cho ${creditor.name}: ${payment.reason}.`, 'money');
    }
    if (paid < payment.amount) {
      state.debt = { ...(usesFullLiquidation(state) ? {id:state.nextLogId,selectedTileIds:[]} : {}), debtorId: from.id, creditorId: payment.toId, amount: payment.amount - paid, reason: payment.reason };
      log(state, `${from.name} thiếu ${money(payment.amount - paid)}. ${usesFullLiquidation(state) ? 'Cần thanh lý đất để trả nợ.' : 'Cần bán công trình hoặc thế chấp.'}`, 'money');
    }
  }
}
function charge(state: GameState, player: Player, amount: number, creditorId: string | null, reason: string) {
  if (amount <= 0) return;
  state.pendingPayments.push({ fromId: player.id, toId: creditorId, amount, reason });
  log(state, `${player.name}: ${reason} ${money(amount)}.`, 'money');
  settlePayments(state);
}
function sellDebtAssets(state: GameState, includeFallback: boolean) {
  const debt = state.debt!;
  const debtor = state.players.find(player => player.id === debt.debtorId)!;
  const plan = liquidationPlan(state,includeFallback);
  let total = 0;
  for (const id of plan) {
    const amount = liquidationValue(state,id);
    total += amount;
    delete state.properties[id];
    debt.selectedTileIds = (debt.selectedTileIds ?? []).filter(selected => selected !== id);
    log(state,`${debtor.name} thanh lý ${boardFor(state)[id].name} với ${money(amount)} để trả nợ.`,'property',{tileId:id,kind:'sell'});
  }
  changeCash(state, [{ player: debtor, amount: total }], `Thanh lý ${plan.length} bất động sản`);
  settlePayments(state);
}
function jail(state: GameState, transfer = true) {
  const player = currentPlayer(state);
  delete state.propertyVisit;
  if (transfer) move(state, boardFor(state).find(tile => tile.kind === 'jail')!.id, false, 'direct');
  player.jailed = true; player.jailTurns = 0; delete player.flight;
  delete state.flightRollPending;
  state.extraRoll = false; state.doubles = 0; state.phase = 'end';
  log(state, `${player.name} mắc kẹt ở ${islandName(state)}. Trả ₫200, dùng thẻ thoát đảo hoặc thử tung đôi; lần thử thứ 3 ra miễn phí.`, 'event');
}
function move(state: GameState, destination: number, salary = true, direction: 'forward' | 'back' | 'direct' | 'flight' = 'forward') {
  const player = currentPlayer(state);
  delete state.propertyVisit;
  const distance = direction === 'back' ? (player.position - destination + boardFor(state).length) % boardFor(state).length : (destination - player.position + boardFor(state).length) % boardFor(state).length;
  // Presentation follows every board edge, including long card moves and flights.
  // Salary/landing still resolve only once at the destination below.
  const path = Array.from({ length: distance }, (_, i) => (player.position + (direction === 'back' ? -1 : 1) * (i + 1) + boardFor(state).length) % boardFor(state).length);
  state.movement = { id: state.nextLogId, playerId: player.id, path };
  if (salary && (direction === 'forward' || direction === 'flight') && destination < player.position) {
    const amount = state.goSalary ?? 200; changeCash(state, [{ player, amount }], 'Qua Xuất phát', { movementId: state.movement.id, at: 'step', stepIndex: path.indexOf(0) }); log(state, `${player.name} đi qua Xuất phát, nhận ${money(amount)}.`, 'money');
    if (usesLandingRules(state)) {
      player.completedLaps = (player.completedLaps ?? 0) + 1;
      for (const [id, property] of Object.entries(state.properties)) {
        if (property.ownerId !== player.id || !property.disabledLaps) continue;
        property.disabledLaps--;
        if (!property.disabledLaps) { delete property.disabledLaps; log(state, `${boardFor(state)[Number(id)].name} hoạt động trở lại sau cúp điện.`, 'event'); }
      }
    }
  }
  player.position = destination;
}
function land(state: GameState, rentMultiplier = 1, utilityMultiplier?: number) {
  const player = currentPlayer(state);
  const tile = boardFor(state)[player.position];
  if (usesLandingRules(state) && tile.price) {
    const property = state.properties[tile.id];
    state.propertyVisit = { playerId: player.id, tileId: tile.id, ownerIdOnArrival: property?.ownerId ?? null, levelOnArrival: property?.level ?? 0 };
  }
  state.phase = 'end';
  log(state, `${player.name} dừng tại ${tile.name}.`);
  if (tile.kind === 'jail') { jail(state, false); return; }
  if (tile.kind === 'parking' && usesLandingRules(state)) {
    if(festivalTargets(state).length) {state.phase='festival';log(state,`${player.name} được chọn thành phố của mình để tổ chức Lễ hội.`,'event');}
    else log(state,'Chưa có thành phố sở hữu để tổ chức Lễ hội.','event');
    return;
  }
  if (tile.kind === 'airport') {
    player.flight = 'waiting';
    state.extraRoll = false; state.doubles = 0; delete state.flightRollPending;
    state.lastBoardEvent = { id: state.nextLogId, playerId: player.id, tileId: tile.id, kind: 'airport-arrival' };
    log(state, `${player.name} dừng ở Sân bay và kết thúc lượt. Lượt kế tiếp phải trả ₫50 chọn điểm bay nếu đủ tiền; xử lý ô đến xong vẫn được tung xúc xắc.`, 'event');
    return;
  }
  if (tile.kind === 'chance' || tile.kind === 'chest') {
    const deck: DeckKind = tile.kind;
    const cardId = state.decks[deck].shift()!;
    state.drawnCard = { deck, cardId, revealed: false };
    state.phase = 'card';
    return;
  }
  if (tile.kind === 'tax') { charge(state, player, taxFor(state, player.id), null, `${tile.name} (10% tổng tài sản)`); return; }
  if (tile.price) {
    const property = state.properties[tile.id];
    if (!property) { state.phase = 'purchase'; return; }
    if (property.ownerId !== player.id && !property.mortgaged) {
      const rent = tile.kind === 'utility' && utilityMultiplier ? (state.dice[0] + state.dice[1]) * utilityMultiplier : rentFor(state, tile.id, state.dice[0] + state.dice[1], rentMultiplier);
      charge(state, player, rent, property.ownerId, `trả tiền thuê ${tile.name}`);
    }
  }
}
function finish(state: GameState) {
  const ranked = state.players.filter((p) => !p.bankrupt).sort((a, b) => netWorth(state, b.id) - netWorth(state, a.id) || b.cash - a.cash);
  if (usesBusinessTourVictory(state) && ranked[0]) {
    completeVictory(state, {winnerId:ranked[0].id,reason:ranked.length === 1 ? 'bankruptcy' : 'capital'}); return;
  }
  state.phase = 'finished'; state.winnerId = ranked[0]?.id ?? null;
  log(state, `${ranked[0]?.name ?? 'Không ai'} dẫn đầu với tài sản ròng ${money(ranked[0] ? netWorth(state, ranked[0].id) : 0)}.`, 'event');
}
function finishAuction(state: GameState) {
  const auction = state.auction!;
  if (auction.highestBidderId) {
    const winner = state.players.find((p) => p.id === auction.highestBidderId)!;
    changeCash(state, [{ player: winner, amount: -auction.highestBid }], 'Đấu giá đất');
    state.properties[auction.tileId] = { ownerId: winner.id, level: 0, mortgaged: false, business: 'residence' };
    log(state, `${winner.name} thắng đấu giá ${boardFor(state)[auction.tileId].name} với ${money(auction.highestBid)}.`, 'property');
  } else log(state, `Không có người mua ${boardFor(state)[auction.tileId].name}.`);
  state.auction = null; state.phase = 'end';
}
function nextBidder(state: GameState) {
  const auction = state.auction!;
  for (let offset = 1; offset <= state.players.length; offset++) {
    const index = (auction.bidderIndex + offset) % state.players.length;
    const player = state.players[index];
    if (!player.bankrupt && !auction.passed.includes(player.id) && player.id !== auction.highestBidderId) { auction.bidderIndex = index; return; }
  }
  finishAuction(state);
}
function resolveCard(state: GameState, targetTileId?: number, targetPlayerId?: string) {
  const drawn = state.drawnCard!;
  const card = getCard(drawn.deck, drawn.cardId, state.boardId, state.boardLayout);
  const player = currentPlayer(state);
  state.drawnCard = null; state.phase = 'end';
  if (card.effect.type !== 'jail-free') state.decks[drawn.deck].push(card.id);
  log(state, `${player.name} rút ${drawn.deck === 'chance' ? 'Cơ hội' : 'Quỹ cộng đồng'}: ${card.title}.`, 'event');
  const movementBefore = state.movement?.id;
  const effect = card.effect;
  switch (effect.type) {
    case 'money':
      if (effect.amount >= 0) { changeCash(state, [{ player, amount: effect.amount }], card.title); log(state, `${player.name} nhận ${money(effect.amount)}.`, 'money'); }
      else charge(state, player, -effect.amount, null, card.title);
      break;
    case 'each':
      for (const other of state.players.filter((p) => p.id !== player.id && !p.bankrupt)) {
        if (effect.amount > 0) charge(state, other, effect.amount, player.id, card.title);
        else charge(state, player, -effect.amount, other.id, card.title);
      }
      break;
    case 'move': move(state, effect.destination); land(state); break;
    case 'move-special': {
      const destination=specialCardDestination(state,effect);
      if(destination===undefined) { log(state,'Chưa có địa điểm hợp lệ cho thẻ; thẻ không gây tác động.','event'); break; }
      move(state,destination);land(state);break;
    }
    case 'gift-property': {
      random(state);random(state);
      if(targetTileId===undefined || targetPlayerId===undefined) { log(state,'Không có tài sản hoặc người nhận hợp lệ để tặng.','event'); break; }
      state.properties[targetTileId].ownerId=targetPlayerId;
      log(state,`${player.name} tặng ${boardFor(state)[targetTileId].name} cho ${state.players.find(player=>player.id===targetPlayerId)!.name}.`,'property');break;
    }
    case 'back': move(state, (player.position - effect.steps + boardFor(state).length) % boardFor(state).length, false, 'back'); land(state); break;
    case 'nearest': {
      const next = [...boardFor(state), ...boardFor(state)].find((tile, index) => index > player.position && tile.kind === effect.kind)!;
      move(state, next.id);
      if (effect.kind === 'utility') state.dice = [Math.floor(random(state) * 6) + 1, Math.floor(random(state) * 6) + 1];
      land(state, effect.kind === 'railroad' ? 2 : 1, effect.kind === 'utility' ? 10 : undefined);
      break;
    }
    case 'jail': if (drawn.deck === 'chance') jail(state); break;
    case 'jail-free': player.jailCards.push(drawn.deck); break;
    case 'repairs': {
      const cost = ownedTiles(state, player.id).reduce((sum, tile) => { const level = state.properties[tile.id].level; return sum + (level === 5 ? effect.hotel : level * effect.house); }, 0);
      charge(state, player, cost, null, card.title); break;
    }
    case 'property-event': {
      random(state);
      if (targetTileId === undefined) { log(state, 'Không có thành phố đối thủ hợp lệ để áp dụng thẻ.', 'event'); break; }
      applyPropertyEvent(state, effect.event, targetTileId);
      log(state, `${card.title} được áp dụng tại ${boardFor(state)[targetTileId].name}.`, 'event', effect.event === 'earthquake' || effect.event === 'fire' ? {tileId:targetTileId,kind:'destroy'} : effect.event === 'forced-sale' ? {tileId:targetTileId,kind:'sell'} : undefined); break;
    }
  }
  if (state.movement && state.movement.id !== movementBefore) state.movement.mode = 'card';
}

export function reduceGame(previous: GameState, action: GameAction): GameState {
  const state = structuredClone(previous);
  state.error = null;
  if (state.phase === 'finished') return state;
  const player = currentPlayer(state);
  const manager = managingPlayer(state);
  const debtActions = usesFullLiquidation(state) ? ['SET_LIQUIDATION_SELECTION','LIQUIDATE_SELECTED','AUTO_LIQUIDATE','DECLARE_BANKRUPTCY'] : ['MORTGAGE','SELL_BUILDING','DECLARE_BANKRUPTCY'];
  if (state.debt && !debtActions.includes(action.type)) { reject(state, 'Cần thanh toán khoản nợ trước khi tiếp tục.'); return state; }
  if (state.phase === 'end' && player.flight === 'waiting' && action.type !== 'END_TURN') { reject(state, 'Sân bay kết thúc lượt hiện tại.'); return state; }
  switch (action.type) {
    case 'SKIP_FLIGHT':
      if (state.phase !== 'roll' || player.flight !== 'ready' || player.jailed) { reject(state, 'Không có chuyến bay chờ để bỏ qua.'); break; }
      delete player.flight;
      log(state, `${player.name} hết giờ chọn điểm bay, bỏ vé và tung xúc xắc.`, 'event');
      return reduceGame(state, { type: 'ROLL' });
    case 'ROLL': {
      if (state.phase !== 'roll') { reject(state, 'Chưa thể tung xúc xắc.'); break; }
      if (player.flight === 'ready' && player.cash >= FLIGHT_FEE && !player.jailed) { reject(state, 'Hãy chọn ô để bay trước khi tung xúc xắc.'); break; }
      const dice: [number, number] = action.dice ?? [Math.floor(random(state) * 6) + 1, Math.floor(random(state) * 6) + 1];
      if (dice.some((value) => !Number.isInteger(value) || value < 1 || value > 6)) { reject(state, 'Xúc xắc không hợp lệ.'); break; }
      delete state.automaticRoll;
      if (player.flight === 'ready') delete player.flight;
      delete state.flightRollPending;
      state.dice = dice;
      state.lastRoll = { id: state.nextLogId, playerId: player.id };
      const doubles = dice[0] === dice[1];
      log(state, `${player.name} tung ${dice[0]} và ${dice[1]}${doubles ? ' — một đôi!' : '.'}`);
      if (player.jailed) {
        player.jailTurns++;
        if (doubles) { player.jailed = false; player.jailTurns = 0; state.extraRoll = true; state.doubles = 1; }
        else if (player.jailTurns >= 3) {
          player.jailed = false; player.jailTurns = 0; state.extraRoll = false;
          log(state, `${player.name} được rời ${islandName(state)} miễn phí ở lần thử thứ 3.`, 'event');
        } else { state.phase = 'end'; log(state, `${player.name} chưa tung được đôi, ở lại ${islandName(state)}.`); break; }
      } else {
        state.doubles = doubles ? state.doubles + 1 : 0;
        if (state.doubles >= 3) { jail(state); break; }
        state.extraRoll = doubles;
      }
      move(state, (player.position + dice[0] + dice[1]) % boardFor(state).length);
      land(state); break;
    }
    case 'BUY': {
      if (state.phase !== 'purchase') { reject(state, 'Không có bất động sản để mua.'); break; }
      const tile = boardFor(state)[player.position];
      const landingRules = usesLandingRules(state);
      const quote = landingRules ? initialConstruction(state, tile.id, action.level) : { level: 0, cost: tile.price! };
      if (quote.error) { reject(state, quote.error); break; }
      if (landingRules && (state.propertyVisit?.playerId !== player.id || state.propertyVisit.tileId !== tile.id)) { reject(state, 'Chỉ mua được ô vừa đáp tới.'); break; }
      if (!landingRules && action.level !== undefined) { reject(state, 'Ván cũ mua đất theo bộ luật trước, xây bằng thao tác riêng.'); break; }
      if (state.properties[tile.id] || player.cash < quote.cost) { reject(state, 'Không đủ tiền mua đất và xây nhà tối thiểu. Bạn có thể bỏ qua lô đất này.'); break; }
      changeCash(state, [{ player, amount: -quote.cost }], `Mua ${tile.name}`);
      state.properties[tile.id] = { ownerId: player.id, level: quote.level, mortgaged: false, business: 'residence' };
      if (state.propertyVisit) state.propertyVisit.decisionTaken = true;
      state.phase = 'end';
      log(state, `${player.name} mua ${tile.name}${quote.level ? ` và xây cấp ${quote.level}` : ''} với ${money(quote.cost)}.`, 'property'); break;
    }
    case 'SKIP_PURCHASE':
      if (state.phase !== 'purchase') { reject(state, 'Không có bất động sản để bỏ qua.'); break; }
      state.phase = 'end';
      log(state, `${player.name} bỏ qua ${boardFor(state)[player.position].name}. Lô đất vẫn chưa có chủ.`, 'property');
      return reduceGame(state, { type: 'END_TURN' });
    case 'BUY_BACK': {
      const quote = buyBackQuote(state, action.tileId);
      if (quote.error) { reject(state, quote.error); break; }
      const property = state.properties[action.tileId];
      const seller = state.players.find((p) => p.id === property.ownerId)!;
      changeCash(state, [{ player, amount: -quote.totalCost }, { player: seller, amount: quote.price }], `Mua lại ${boardFor(state)[action.tileId].name}`); property.ownerId = player.id;
      if (property.level === 0) property.level = 1;
      log(state, `${player.name} mua lại ${boardFor(state)[action.tileId].name} từ ${seller.name} với ${money(quote.price)} sau khi trả tiền thuê${quote.constructionCost ? `, xây nhà cấp 1 với ${money(quote.constructionCost)}` : ''}.`, 'property'); break;
    }
    case 'FLY':
      if (state.phase !== 'roll' || player.flight !== 'ready' || player.jailed) { reject(state, 'Chỉ được dùng Máy bay ở lượt kế tiếp sau khi nhận vé.'); break; }
      if (!Number.isInteger(action.tileId) || action.tileId < 0 || action.tileId >= boardFor(state).length) { reject(state, 'Ô đến không hợp lệ.'); break; }
      if (!flightTargets(state).includes(action.tileId)) { reject(state, 'Không thể bay đến đất đối thủ, ô rút thẻ, Thuế, Lễ hội hoặc Đảo hoang.'); break; }
      if (player.cash < FLIGHT_FEE) { reject(state, 'Cần đủ ₫50 để đi Máy bay.'); break; }
      changeCash(state, [{ player, amount: -FLIGHT_FEE }], 'Phí máy bay', null);
      delete player.flight;
      state.extraRoll = false; state.doubles = 0;
      state.flightRollPending = true;
      log(state, `${player.name} trả ${money(FLIGHT_FEE)} đi Máy bay đến ${boardFor(state)[action.tileId].name}.`, 'event');
      move(state, action.tileId, true, 'flight'); state.movement!.mode = 'flight'; land(state); break;
    case 'START_AUCTION':
      if (usesLandingRules(state)) { reject(state, 'Bộ luật xây theo ô đến không dùng đấu giá.'); break; }
      if (state.phase !== 'purchase') { reject(state, 'Chỉ đấu giá lô đất chưa có chủ vừa đến.'); break; }
      state.phase = 'auction';
      state.auction = { tileId: player.position, bidderIndex: state.currentPlayer, highestBid: 0, highestBidderId: null, passed: [] };
      log(state, `${boardFor(state)[player.position].name} được đưa ra đấu giá. Mọi người đều có thể tham gia.`, 'property'); break;
    case 'BID': {
      if (!state.auction || state.phase !== 'auction') { reject(state, 'Chưa có phiên đấu giá.'); break; }
      const bidder = state.players[state.auction.bidderIndex];
      if (!Number.isInteger(action.amount) || action.amount <= state.auction.highestBid || action.amount > bidder.cash) { reject(state, 'Giá phải cao hơn giá hiện tại và không vượt số tiền bạn có.'); break; }
      state.auction.highestBid = action.amount; state.auction.highestBidderId = bidder.id;
      log(state, `${bidder.name} trả giá ${money(action.amount)}.`, 'property'); nextBidder(state); break;
    }
    case 'PASS_BID':
      if (!state.auction || state.phase !== 'auction') { reject(state, 'Chưa có phiên đấu giá.'); break; }
      state.auction.passed.push(state.players[state.auction.bidderIndex].id); nextBidder(state); break;
    case 'HOST_FESTIVAL': {
      if(state.phase!=='festival' || !usesLandingRules(state) || !Number.isInteger(action.tileId) || !festivalTargets(state).includes(action.tileId)) {reject(state,'Chỉ chọn thành phố của mình khi đến ô Lễ hội.');break;}
      const multiplier=nextFestivalMultiplier(state);
      state.festivalTileId=action.tileId;state.festivalLevel=(state.festivalLevel??0)+1;state.phase='end';
      log(state,`${player.name} tổ chức Lễ hội tại ${boardFor(state)[action.tileId].name}, mức thuê ×${multiplier.toLocaleString('vi-VN')}.`,'event');break;
    }
    case 'SKIP_FESTIVAL':
      if(state.phase!=='festival') {reject(state,'Không có bước chọn nơi tổ chức Lễ hội.');break;}
      state.phase='end';log(state,`${player.name} giữ nguyên địa điểm Lễ hội hiện tại.`,'event');break;
    case 'DRAW_CARD':
      if (state.phase !== 'card' || !state.drawnCard || state.drawnCard.revealed) { reject(state, 'Không có thẻ mới để rút.'); break; }
      state.drawnCard.revealed = true;
      state.lastRevealedCard = { id: state.nextLogId, playerId: player.id, deck: state.drawnCard.deck, cardId: state.drawnCard.cardId };
      log(state, `${player.name} bóc thẻ: ${getCard(state.drawnCard.deck, state.drawnCard.cardId, state.boardId, state.boardLayout).title}.`, 'event'); break;
    case 'RESOLVE_CARD': {
      if (state.phase !== 'card' || !state.drawnCard) { reject(state, 'Không có thẻ để rút.'); break; }
      if (!state.drawnCard.revealed) { reject(state, 'Hãy bóc thẻ trước khi sử dụng.'); break; }
      const problem=cardSelectionProblem(state,action);
      if(problem) {reject(state,problem);break;}
      resolveCard(state,action.targetTileId,action.targetPlayerId);break;
    }
    case 'END_TURN': {
      if (state.phase !== 'end') { reject(state, 'Hãy xử lý xong ô hiện tại.'); break; }
      if (state.players.filter((p) => !p.bankrupt).length <= 1) { finish(state); break; }
      if (player.flight === 'waiting') { state.extraRoll = false; delete state.flightRollPending; }
      if ((state.extraRoll || state.flightRollPending) && !player.bankrupt) {
        const afterFlight = !!state.flightRollPending;
        delete state.propertyVisit; delete state.flightRollPending;
        state.extraRoll = false; state.phase = 'roll';
        delete state.automaticRoll;
        log(state, afterFlight ? `${player.name} tiếp tục tung xúc xắc sau chuyến bay.` : `${player.name} được tung thêm vì có đôi.`); break;
      }
      delete state.flightRollPending;
      delete state.propertyVisit;
      state.doubles = 0; state.extraRoll = false;
      delete state.automaticRoll;
      let next = state.currentPlayer;
      do { next = (next + 1) % state.players.length; } while (state.players[next].bankrupt);
      const origin = state.startingPlayer ?? 0;
      const order = (index: number) => (index - origin + state.players.length) % state.players.length;
      const newRound = order(next) <= order(state.currentPlayer);
      state.currentPlayer = next; state.phase = 'roll'; state.turnsInRound++;
      if (state.players[next].flight === 'waiting') state.players[next].flight = 'ready';
      if (newRound) {
        if (state.mode === 'city' && state.round >= state.maxRounds) { finish(state); break; }
        state.round++; state.turnsInRound = 0;
        if (state.mode === 'city') {
          state.cityEventIndex = Math.floor((state.round - 1) / 2) % CITY_EVENTS.length;
          log(state, `Vòng ${state.round}: ${CITY_EVENTS[state.cityEventIndex].name}.`, 'event');
          for (const owner of state.players.filter((p) => !p.bankrupt)) {
            const tiles = ownedTiles(state, owner.id).filter((tile) => state.properties[tile.id].level && !state.properties[tile.id].mortgaged);
            const income = tiles.reduce((sum, tile) => sum + (!propertyClosed(state, tile.id) && state.properties[tile.id].business === 'residence' ? state.properties[tile.id].level * 8 : 0), 0);
            const upkeep = tiles.reduce((sum, tile) => sum + (state.properties[tile.id].business === 'hotel' ? state.properties[tile.id].level * 6 : 0), 0);
            if (income) { changeCash(state, [{ player: owner, amount: income }], 'Thu nhập nhà trọ'); log(state, `${owner.name} nhận ${money(income)} thu nhập nhà trọ.`, 'money'); }
            if (upkeep) charge(state, owner, upkeep, null, 'phí vận hành lưu trú');
          }
        }
      }
      break;
    }
    case 'BUILD': {
      const problem = buildProblem(state, action.tileId, action.level);
      if (problem) { reject(state, problem); break; }
      const tile = boardFor(state)[action.tileId];
      const property = state.properties[action.tileId];
      if (!usesLandingRules(state) && action.level !== undefined && action.level !== property.level + 1) { reject(state, 'Ván cũ chỉ xây từng cấp theo bộ luật trước.'); break; }
      if (property.level === 0 && action.business) {
        if (!['residence', 'cafe', 'hotel'].includes(action.business)) { reject(state, 'Loại hình công trình không hợp lệ.'); break; }
        property.business = state.mode === 'city' ? action.business : 'residence';
      }
      const targetLevel = usesLandingRules(state) ? action.level ?? property.level + 1 : property.level + 1;
      changeCash(state, [{ player, amount: -constructionUpgradeCost(state, action.tileId, property.level, targetLevel) }], `Nâng cấp ${tile.name}`); property.level = targetLevel;
      if (state.propertyVisit) state.propertyVisit.decisionTaken = true;
      log(state, `${player.name} nâng ${tile.name} lên ${property.level === 5 ? usesLandingRules(state) ? 'công trình đặc trưng' : 'khách sạn' : `cấp ${property.level}`}.`, 'property'); break;
    }
    case 'SET_LIQUIDATION_SELECTION': {
      if (!usesFullLiquidation(state) || !state.debt) { reject(state,'Chưa có khoản nợ cần thanh lý.'); break; }
      const owned = liquidationTileIds(state);
      if (!Array.isArray(action.tileIds) || action.tileIds.length > owned.length || new Set(action.tileIds).size !== action.tileIds.length ||
          action.tileIds.some(id => !Number.isInteger(id) || !owned.includes(id))) { reject(state,'Chỉ được chọn các ô đất của người đang nợ, không chọn trùng.'); break; }
      state.debt.selectedTileIds = [...action.tileIds]; break;
    }
    case 'LIQUIDATE_SELECTED':
    case 'AUTO_LIQUIDATE': {
      if (!usesFullLiquidation(state) || !state.debt) { reject(state,'Chưa có khoản nợ cần thanh lý.'); break; }
      if (action.type === 'LIQUIDATE_SELECTED' && !state.debt.selectedTileIds?.length) { reject(state,'Hãy chọn ô đất để bán.'); break; }
      const debt = state.debt;
      sellDebtAssets(state, action.type === 'AUTO_LIQUIDATE');
      if (state.debt === debt && !liquidationTileIds(state).length) return reduceGame(state,{type:'DECLARE_BANKRUPTCY'});
      break;
    }
    case 'SELL_BUILDING': {
      if (usesFullLiquidation(state)) { reject(state,'Luật mới chỉ bán nguyên ô đất để trả nợ, không bán từng cấp nhà.'); break; }
      const tile = boardFor(state)[action.tileId]; const property = state.properties[action.tileId];
      if (!tile || !property || property.ownerId !== manager.id || !property.level || ((!state.debt) && (state.phase === 'auction' || state.phase === 'card'))) { reject(state, 'Không thể bán công trình này lúc này.'); break; }
      if (!usesLandingRules(state) && groupTiles(tile, state).some((entry) => state.properties[entry.id]?.ownerId === manager.id && (state.properties[entry.id]?.level ?? 0) > property.level)) { reject(state, 'Cần bán đều công trình trong nhóm màu.'); break; }
      if (property.level === 5 && bankSupply(state).houses < 4) { reject(state, 'Ngân hàng cần đủ 4 nhà để đổi khách sạn.'); break; }
      property.level--; changeCash(state, [{ player: manager, amount: tile.buildCost! / 2 }], `Bán nhà ${tile.name}`);
      log(state, `${manager.name} bán một cấp công trình tại ${tile.name}.`, 'property', {tileId:tile.id,kind:'sell'}); settlePayments(state); break;
    }
    case 'MORTGAGE': {
      if (usesFullLiquidation(state)) { reject(state,'Luật mới không dùng thế chấp.'); break; }
      const tile = boardFor(state)[action.tileId]; const property = state.properties[action.tileId];
      if (!tile || !property || property.ownerId !== manager.id || property.mortgaged || ((!state.debt) && (state.phase === 'auction' || state.phase === 'card'))) { reject(state, 'Không thể thế chấp tài sản này lúc này.'); break; }
      if (property.level || groupTiles(tile, state).some((entry) => state.properties[entry.id]?.ownerId === manager.id && (state.properties[entry.id]?.level ?? 0) > 0)) { reject(state, 'Bán hết công trình của bạn trong nhóm màu trước khi thế chấp.'); break; }
      property.mortgaged = true; changeCash(state, [{ player: manager, amount: tile.price! / 2 }], `Thế chấp ${tile.name}`);
      log(state, `${manager.name} thế chấp ${tile.name}, nhận ${money(tile.price! / 2)}.`, 'property'); settlePayments(state); break;
    }
    case 'UNMORTGAGE': {
      if (usesFullLiquidation(state)) { reject(state,'Luật mới không dùng thế chấp.'); break; }
      const tile = boardFor(state)[action.tileId]; const property = state.properties[action.tileId];
      if (!tile || !property || property.ownerId !== player.id || !property.mortgaged || !['roll', 'end', 'purchase'].includes(state.phase)) { reject(state, 'Không thể giải chấp lúc này.'); break; }
      const cost = Math.ceil(tile.price! / 2 * 1.1);
      if (player.cash < cost) { reject(state, 'Không đủ tiền giải chấp.'); break; }
      changeCash(state, [{ player, amount: -cost }], `Giải chấp ${tile.name}`); property.mortgaged = false;
      log(state, `${player.name} giải chấp ${tile.name} với ${money(cost)}.`, 'property'); break;
    }
    case 'PAY_BAIL':
    case 'USE_JAIL_CARD': {
      if (!player.jailed || state.phase !== 'roll') { reject(state, `Bạn không ở ${islandName(state)} hoặc đã tung xúc xắc.`); break; }
      if (action.type === 'PAY_BAIL') {
        if (player.cash < 200) { reject(state, `Cần ₫200 để rời ${islandName(state)}.`); break; }
        changeCash(state, [{ player, amount: -200 }], 'Phí ra đảo');
      } else {
        const deck = player.jailCards.shift();
        if (!deck) { reject(state, 'Bạn chưa có thẻ thoát đảo.'); break; }
        state.decks[deck].push(`${deck}-${deck === 'chance' ? '09' : '05'}`);
      }
      player.jailed = false; player.jailTurns = 0;
      log(state, `${player.name} đã rời ${islandName(state)}. Hãy tung xúc xắc.`); break;
    }
    case 'DECLARE_BANKRUPTCY': {
      if (!state.debt) { reject(state, 'Chỉ tuyên bố phá sản khi đang không thể thanh toán.'); break; }
      const debt = state.debt;
      const fullSettlement = usesFullLiquidation(state) || usesLandingRules(state);
      const potential = fullSettlement ? liquidationPotential(state) : ownedTiles(state, manager.id).reduce((sum, tile) => { const property = state.properties[tile.id]; return sum + property.level * (tile.buildCost ?? 0) / 2 + (!property.mortgaged ? (tile.price ?? 0) / 2 : 0); }, manager.cash);
      if (potential >= debt.amount) { reject(state, 'Bạn còn đủ tài sản để trả nợ. Hãy bán công trình hoặc thế chấp trước.'); break; }
      if (fullSettlement) sellDebtAssets(state,true);
      else settlePayments(state);
      const creditor = state.players.find((p) => p.id === debt.creditorId);
      for (const tile of ownedTiles(state, manager.id)) {
        const property = state.properties[tile.id];
        if (creditor) { changeCash(state, [{ player: creditor, amount: property.level * (tile.buildCost ?? 0) / 2 }], 'Thanh toán tài sản khi phá sản'); property.ownerId = creditor.id; property.level = 0; }
        else delete state.properties[tile.id];
      }
      for (const deck of manager.jailCards) {
        if (creditor) creditor.jailCards.push(deck);
        else state.decks[deck].push(`${deck}-${deck === 'chance' ? '09' : '05'}`);
      }
      manager.jailCards = []; manager.bankrupt = true; changeCash(state, [{ player: manager, amount: -manager.cash }], 'Kết thúc thanh toán phá sản');
      log(state, `${manager.name} tuyên bố phá sản.`, 'event');
      state.debt = null; settlePayments(state);
      if (state.players.filter((p) => !p.bankrupt).length <= 1) finish(state);
      else if (manager.id === player.id) {
        if (state.drawnCard) { state.decks[state.drawnCard.deck].push(state.drawnCard.cardId); state.drawnCard = null; }
        state.phase = 'end'; state.extraRoll = false;
      }
      break;
    }
    case 'TRADE': {
      if (!['roll', 'end'].includes(state.phase)) { reject(state, 'Chỉ giao dịch trước hoặc sau khi di chuyển.'); break; }
      const offer = action.offer;
      const from = state.players.find((p) => p.id === offer.fromId);
      const to = state.players.find((p) => p.id === offer.toId);
      if (!from || !to || from.id !== player.id || from.id === to.id || to.bankrupt || !Number.isInteger(offer.giveCash) || !Number.isInteger(offer.takeCash) || offer.giveCash < 0 || offer.takeCash < 0 || offer.giveCash > from.cash || offer.takeCash > to.cash) { reject(state, 'Đề nghị giao dịch không hợp lệ.'); break; }
      let invalid = false;
      for (const [tileId, owner] of [[offer.giveTileId, from], [offer.takeTileId, to]] as const) {
        if (tileId === null) continue;
        const tile = boardFor(state)[tileId]; const property = state.properties[tileId];
        if (!tile || !property || property.ownerId !== owner.id || property.mortgaged || property.level || groupTiles(tile, state).some((entry) => (state.properties[entry.id]?.level ?? 0) > 0)) invalid = true;
      }
      if (invalid || (!offer.giveTileId && !offer.takeTileId && !offer.giveCash && !offer.takeCash)) { reject(state, 'Chỉ trao đổi tài sản chưa xây và chưa thế chấp.'); break; }
      changeCash(state, [{ player: from, amount: offer.takeCash - offer.giveCash }, { player: to, amount: offer.giveCash - offer.takeCash }], 'Giao dịch');
      if (offer.giveTileId !== null) state.properties[offer.giveTileId].ownerId = to.id;
      if (offer.takeTileId !== null) state.properties[offer.takeTileId].ownerId = from.id;
      log(state, `${from.name} và ${to.name} hoàn tất giao dịch đã được hai bên xác nhận.`, 'property'); break;
    }
  }
  if (!state.error && action.type === 'ROLL' && state.lastRoll && state.movement && state.movement.id !== previous.movement?.id) {
    state.movement.rollId = state.lastRoll.id;
  }
  if (!state.error) {
    const monopolies = newlyCompletedMonopolies(previous,state);
    if(monopolies.length){
      state.lastBoardEvent={id:state.nextLogId,kind:'monopoly',playerId:monopolies[0].playerId,tileId:monopolies[0].tileIds[0],monopolies};
      log(state,monopolies.map(m=>`${state.players.find(p=>p.id===m.playerId)!.name} hoàn thành MONOPOLY ${groupsFor(state)[m.group].name}`).join('; '),'property');
    }
    resolveInstantVictory(state);
  }
  if (!state.error && state.phase === 'purchase' && !state.debt) {
    const tile = boardFor(state)[currentPlayer(state).position];
    const minimum = usesLandingRules(state) ? initialConstruction(state, tile.id).cost : tile.price!;
    if (currentPlayer(state).cash < minimum) return reduceGame(state, { type: 'SKIP_PURCHASE' });
  }
  return state;
}
