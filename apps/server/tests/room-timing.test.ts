import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '@typhu/game-engine';
import { RoomService, type Room } from '../src/rooms';
import { advanceRoomBot } from '../src/room-bots';
import { ACTION_TIME_MS, syncRoomTimer } from '../src/room-timing';
import { BOARD_EVENT_NOTICE_MS, CARD_AUTO_RESOLVE_MS, DICE_PRESENTATION_MS, pawnTravelMs, PRESENTATION_BUFFER_MS } from '@typhu/game-content';

function room(): Room {
  return { code: 'ABC123', hostSeatId: 'host', mode: 'city', maxPlayers: 2, maxRounds: 8, phase: 'playing',
    seats: ['host', 'guest'].map((id, i) => ({ id, name: id, token: id, peerId: null, connected: true, ready: true, gamePlayerId: `player-${i + 1}` })),
    game: createGame({ names: ['Host', 'Guest'], mode: 'city', seed: 123, maxRounds: 8 }), pendingTrade: null, updatedAt: 0 };
}

test('15 seconds auto-rolls once and gives the landing choice a fresh timer after movement', () => {
  const state = room(); syncRoomTimer(state, 1000);
  assert.equal(state.actionTimer!.expiresAt, 16_000);
  syncRoomTimer(state, 15_999); assert.equal(state.game!.phase, 'roll');
  syncRoomTimer(state, 16_000); assert.notEqual(state.game!.phase, 'roll');
  assert.equal(state.game!.log.filter((entry) => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
  assert.ok(state.actionTimer!.startsAt > 16_000);
  assert.equal(state.actionTimer!.expiresAt - state.actionTimer!.startsAt, ACTION_TIME_MS);
  syncRoomTimer(state, 16_000); assert.equal(state.game!.log.filter((entry) => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
});

test('purchase skips on timeout; card auto-draws then gives a 15-second choice without forced reading time', () => {
  const state = room(); state.game!.phase = 'purchase'; state.game!.players[0].position = 3;
  syncRoomTimer(state, 0); syncRoomTimer(state, 15_000);
  assert.equal(state.game!.phase, 'roll'); assert.equal(state.game!.currentPlayer, 1); assert.equal(state.game!.players[0].cash, 1500); assert.equal(state.game!.properties[3], undefined);
  const card = room(); card.game!.phase = 'card'; card.game!.drawnCard = { deck: 'chance', cardId: 'chance-08', revealed: false };
  syncRoomTimer(card, 0);
  const drawAt = card.actionTimer!.startsAt;
  syncRoomTimer(card, drawAt - 1); assert.equal(card.game!.drawnCard!.revealed, false);
  syncRoomTimer(card, drawAt);
  assert.equal(card.game!.drawnCard!.revealed, true); assert.equal(card.game!.players[0].cash, 1500);
  assert.equal(card.actionTimer!.startsAt, drawAt + 300);
  assert.equal(card.actionTimer!.expiresAt - card.actionTimer!.startsAt, ACTION_TIME_MS);
  syncRoomTimer(card, card.actionTimer!.expiresAt); assert.equal(card.game!.drawnCard, null); assert.equal(card.game!.players[0].cash, 1550);
});

test('end, auction and debtor deadlines choose safe defaults and follow the actual actor', () => {
  const ended = room(); ended.game!.phase = 'end'; syncRoomTimer(ended, 0); syncRoomTimer(ended, 15_000);
  assert.equal(ended.game!.currentPlayer, 1);
  const auction = room(); auction.game!.phase = 'auction';
  auction.game!.auction = { tileId: 3, bidderIndex: 1, highestBid: 0, highestBidderId: null, passed: [] };
  syncRoomTimer(auction, 0); syncRoomTimer(auction, 15_000);
  assert.deepEqual(auction.game!.auction!.passed, ['player-2']);
  const debt = room(); debt.game!.players[1].cash = 0;
  debt.game!.debt = { debtorId: 'player-2', creditorId: 'player-1', amount: 20, reason: 'rent' };
  debt.game!.properties[1] = { ownerId: 'player-2', level: 0, mortgaged: false, business: 'residence' };
  syncRoomTimer(debt, 0); syncRoomTimer(debt, 15_000);
  assert.equal(debt.game!.debt, null); assert.equal(debt.game!.properties[1].mortgaged, true);
  assert.equal(debt.game!.players[0].cash, 1520);
});

test('flight continuation waits for manual roll until the normal 15-second timeout', () => {
  const state = room(); state.game!.phase = 'end'; state.game!.flightRollPending = true;
  syncRoomTimer(state, 1000);
  syncRoomTimer(state, 1000);
  assert.equal(state.game!.phase, 'roll'); assert.equal(state.game!.automaticRoll, undefined);
  assert.equal(state.game!.currentPlayer, 0);
  syncRoomTimer(state, 1000); syncRoomTimer(state, 15_999);
  assert.equal(state.game!.lastRoll, undefined);
  assert.equal(state.actionTimer!.expiresAt, 16_000);
  syncRoomTimer(state, 16_000);
  assert.ok(state.game!.lastRoll);
});

test('doubles return to a manual roll with a fresh deadline instead of immediately rolling again', () => {
  const state = room(); state.game!.phase = 'end'; state.game!.extraRoll = true; state.game!.doubles = 1;
  syncRoomTimer(state, 1000); syncRoomTimer(state, 1000);
  assert.equal(state.game!.phase, 'roll'); assert.equal(state.game!.currentPlayer, 0);
  assert.equal(state.game!.automaticRoll, undefined);
  syncRoomTimer(state, 1000); syncRoomTimer(state, 15_999);
  assert.equal(state.game!.lastRoll, undefined);
  assert.equal(state.actionTimer!.expiresAt, 16_000);
});

test('airport announcement gets its reading beat after arrival before the next player, and does not delay later turns', () => {
  const state = room(); state.game!.players[0].position = 27;
  state.game = reduceGame(state.game!, { type: 'ROLL', dice: [1, 2] });
  syncRoomTimer(state, 1000);
  const nextAt = 1000 + DICE_PRESENTATION_MS + pawnTravelMs(state.game!.movement) + BOARD_EVENT_NOTICE_MS + PRESENTATION_BUFFER_MS;
  assert.equal(state.actionTimer!.startsAt, nextAt);
  syncRoomTimer(state, nextAt - 1); assert.equal(state.game!.currentPlayer, 0);
  syncRoomTimer(state, nextAt); assert.equal(state.game!.currentPlayer, 1);
  assert.equal(state.actionTimer!.startsAt, nextAt);
  assert.equal(state.actionTimer!.boardEventId, state.game!.lastBoardEvent!.id);
});

test('card applies itself once after the reveal beat; pending trade blocks automatic progression', () => {
  const state = room(); state.game!.phase = 'card';
  state.game!.drawnCard = { deck: 'chance', cardId: 'chance-08', revealed: true };
  syncRoomTimer(state, 1000);
  syncRoomTimer(state, 1000 + CARD_AUTO_RESOLVE_MS - 1);
  assert.equal(state.game!.players[0].cash, 1500);
  syncRoomTimer(state, 1000 + CARD_AUTO_RESOLVE_MS);
  assert.equal(state.game!.players[0].cash, 1550);
  assert.equal(state.game!.drawnCard, null);
  syncRoomTimer(state, 1000 + CARD_AUTO_RESOLVE_MS);
  assert.equal(state.game!.players[0].cash, 1550);
  const waiting = room(); waiting.game!.phase = 'end';
  waiting.pendingTrade = { expiresAt: 20_000, offer: { fromId: 'player-1', toId: 'player-2', giveCash: 1, takeCash: 0, giveTileId: null, takeTileId: null } };
  syncRoomTimer(waiting, 1000); syncRoomTimer(waiting, 20_000);
  assert.equal(waiting.game!.currentPlayer, 0);
});

test('reads never extend deadlines, pending trades and finished games clear action timers', () => {
  const state = room(); syncRoomTimer(state, 0);
  for (let i = 1; i < 15; i++) syncRoomTimer(state, i * 1000);
  assert.equal(state.actionTimer!.expiresAt, 15_000);
  state.pendingTrade = { expiresAt: 15_000, offer: { fromId: 'player-1', toId: 'player-2', giveCash: 1, takeCash: 0, giveTileId: null, takeTileId: null } };
  syncRoomTimer(state, 14_000); assert.equal(state.actionTimer, undefined);
  state.pendingTrade = null; syncRoomTimer(state, 15_000); assert.equal(state.actionTimer!.expiresAt, 30_000);
  state.phase = 'finished'; syncRoomTimer(state, 16_000); assert.equal(state.actionTimer, undefined);
});

test('liquidation gives 30 seconds; selection and partial sale do not reset the deadline; expiry pays the entire balance once',()=>{
  const state=room();state.game!.liquidationRules='full-value-v1';state.game!.phase='end';state.game!.players[0].cash=0;
  state.game!.debt={id:42,debtorId:'player-1',creditorId:'player-2',amount:150,reason:'rent',selectedTileIds:[]};
  state.game!.properties[1]={ownerId:'player-1',level:1,mortgaged:false,business:'residence'};
  state.game!.properties[3]={ownerId:'player-1',level:1,mortgaged:false,business:'residence'};
  syncRoomTimer(state,1000);assert.equal(state.actionTimer!.expiresAt,31000);
  state.game=reduceGame(state.game!,{type:'SET_LIQUIDATION_SELECTION',tileIds:[1]});
  syncRoomTimer(state,10000);assert.equal(state.actionTimer!.expiresAt,31000);
  state.game=reduceGame(state.game!,{type:'LIQUIDATE_SELECTED'});assert.equal(state.game!.debt!.amount,40);
  syncRoomTimer(state,20000);assert.equal(state.actionTimer!.expiresAt,31000);
  syncRoomTimer(state,30999);assert.ok(state.game!.properties[3]);
  syncRoomTimer(state,31000);assert.equal(state.game!.debt,null);assert.equal(state.game!.properties[3],undefined);
  assert.equal(state.game!.players[0].cash,70);assert.equal(state.game!.players[1].cash,1650);
  syncRoomTimer(state,31000);assert.equal(state.game!.players[1].cash,1650);
});

test('the action clock starts only after roll reveal and the full slower pawn route, and does not reset on reads',()=>{
  const state=room();
  state.game=reduceGame(state.game!,{type:'ROLL',dice:[3,4]});
  syncRoomTimer(state,1000);
  const start=state.actionTimer!.startsAt,deadline=state.actionTimer!.expiresAt;
  assert.equal(start,1000+2200+7*420+300+900); // the landing is Chance: reserve the draw beat too
  assert.equal(deadline-start,ACTION_TIME_MS);
  syncRoomTimer(state,start-1);assert.equal(state.actionTimer!.expiresAt,deadline);
  // A later landing choice gets its normal clock without replaying old dice/movement.
  state.game!.phase='purchase';
  state.game=reduceGame(state.game!,{type:'SKIP_PURCHASE'});
  syncRoomTimer(state,start);
  assert.equal(state.actionTimer!.startsAt,start);
});


test('idle turns cannot advance while everyone is still watching dice or the pawn',()=>{
  let now=1000;
  const state=room();state.game!.players.forEach(player=>player.cash=0);state.game!.players[0].position=17;
  state.game=reduceGame(state.game!,{type:'ROLL',dice:[1,2]});
  assert.equal(state.game!.phase,'end');
  const service=new RoomService(()=>now);service.rooms.set(state.code,state);
  const peer=service.connect(()=>{});
  service.handle(peer,{type:'RECONNECT',token:'host'});
  const startsAt=state.actionTimer!.startsAt;
  assert.equal(state.game!.currentPlayer,0);
  now=startsAt-1;service.handle(peer,{type:'RECONNECT',token:'host'});
  assert.equal(state.game!.currentPlayer,0);
  now=startsAt;service.handle(peer,{type:'RECONNECT',token:'host'});
  assert.equal(state.game!.currentPlayer,1);
});

test('a bot that fails an island escape waits for the complete dice reveal before ending its turn',()=>{
  const state=room();state.seats[0].bot=true;state.game!.players[0].cash=0;
  state.game!.players[0].jailed=true;state.game!.players[0].position=10;state.game!.seed=123;
  advanceRoomBot(state,0);advanceRoomBot(state,600);
  assert.ok(state.game!.lastRoll);assert.equal(state.game!.players[0].jailed,true);
  assert.equal(state.botActionAt,3100);
  advanceRoomBot(state,3099);assert.equal(state.game!.currentPlayer,0);
  advanceRoomBot(state,3100);assert.equal(state.game!.currentPlayer,1);
});

test('airport expiry rolls once without buying a flight or extending the old deadline', () => {
  const state = room();
  state.game!.players[0].flight = 'ready';
  state.game!.players[0].position = 30;
  syncRoomTimer(state, 1000);
  syncRoomTimer(state, 15999);
  assert.equal(state.game!.players[0].flight, 'ready');
  syncRoomTimer(state, 16000);
  const game = structuredClone(state.game);
  assert.equal(game!.log.filter(entry => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
  assert.ok(!game!.log.some(entry => entry.message.includes('trả ₫50 đi Máy bay')));
  syncRoomTimer(state, 16000);
  assert.deepEqual(state.game, game);
});
