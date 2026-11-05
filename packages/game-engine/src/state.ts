import type { GameState, NewGameOptions } from '@typhu/contracts';
import { DECKS, PROPERTY_EVENT_CARDS, TRAVEL_GIFT_CARDS } from '@typhu/game-content';
import { shuffle } from './random';
import { resolveMoneySettings } from './settings';
import { eventEligibleTileIds, resolveEventSettings, resolveFestivalIncrement } from './festivals';

export function createGame(options: NewGameOptions = {}): GameState {
  if (options.victoryRules !== undefined && options.victoryRules !== 'business-tour-v1') throw new Error('Bộ điều kiện thắng không hợp lệ.');
  if (options.liquidationRules !== undefined && options.liquidationRules !== 'full-value-v1') throw new Error('Bộ luật thanh lý không hợp lệ.');
  if (options.propertyPricing !== undefined && !['level-one-included', 'business-tour-v1', 'business-tour-v2'].includes(options.propertyPricing)) throw new Error('Cách tính giá đất không hợp lệ.');
  if (options.boardLayout !== undefined && (options.boardLayout !== 'districts-v1' || options.boardId !== 'vietnam-32')) throw new Error('Bố cục bàn cờ không hợp lệ.');
  const names = options.names ?? ['Bạn', 'Minh Anh', 'Hoàng Nam', 'Linh Chi'];
  if (names.length < 2 || names.length > 4) throw new Error('Ván chơi cần từ 2 đến 4 người.');
  const { startingCash, goSalary } = resolveMoneySettings(options);
  const { eventTileCount } = resolveEventSettings(options);
  const { festivalIncrement } = resolveFestivalIncrement(options);
  // The authoritative server supplies its random draw; deterministic callers may set an index.
  const startingPlayer = options.startingPlayer ?? 0;
  if (!Number.isInteger(startingPlayer) || startingPlayer < 0 || startingPlayer >= names.length)
    throw new Error('Người đi đầu không hợp lệ.');
  const colors = ['#276951', '#d49b50', '#a379b6', '#6f9ab8'];
  const tokens = ['leaf', 'sun', 'diamond', 'sailboat'];
  const maxRounds = options.maxRounds ?? 12;
  if (!Number.isInteger(maxRounds) || maxRounds < 4 || maxRounds > 40) throw new Error('Số vòng phải từ 4 đến 40.');
  const state: GameState = {
    version: 1, ...(options.boardLayout ? {boardLayout:options.boardLayout} : {}), ...(options.boardId ? { boardId: options.boardId } : {}), mode: options.mode ?? 'classic', startingCash, goSalary,
    players: names.map((name, index) => ({ id: `player-${index + 1}`, name: name.trim().slice(0, 24) || `Người chơi ${index + 1}`, color: colors[index], token: tokens[index], cash: startingCash, position: 0, jailed: false, jailTurns: 0, jailCards: [], bankrupt: false })),
    currentPlayer: startingPlayer, startingPlayer, properties: {}, phase: 'roll', dice: [1, 1], doubles: 0, extraRoll: false,
    round: 1, maxRounds, turnsInRound: 0, seed: (options.seed ?? Date.now()) >>> 0 || 1,
    decks: { chance: [], chest: [] }, drawnCard: null, auction: null, debt: null, pendingPayments: [],
    log: [{ id: 1, round: 1, message: `Ván chơi bắt đầu. Mỗi người có ₫${startingCash.toLocaleString('vi-VN')}; qua Xuất phát nhận ₫${goSalary.toLocaleString('vi-VN')}.`, kind: 'info' }],
    ...(options.victoryRules ? {victoryRules:options.victoryRules,departedPlayerIds:[]} : {}),
    ...(options.liquidationRules ? {liquidationRules:options.liquidationRules} : {}),
    ...(options.propertyPricing ? {propertyPricing:options.propertyPricing} : {}),
    nextLogId: 2, cityEventIndex: 0, winnerId: null, error: null,
  };
  state.decks.chance = shuffle(state, [...DECKS.chance, ...(options.propertyRules === 'landing-v1' ? [...PROPERTY_EVENT_CARDS,...TRAVEL_GIFT_CARDS] : [])].map((card) => card.id));
  if (options.propertyRules !== undefined) {
    if (options.propertyRules !== 'landing-v1') throw new Error('Bộ luật bất động sản không hợp lệ.');
    state.propertyRules = options.propertyRules;
    state.players.forEach((player) => { player.completedLaps = 0; });
  }
  state.decks.chest = shuffle(state, DECKS.chest.map((card) => card.id));
  state.festivalIncrement = festivalIncrement;
  state.eventTileCount = eventTileCount;
  state.eventTileIds = eventTileCount > 0 ? shuffle(state, eventEligibleTileIds(state)).slice(0, eventTileCount) : [];
  if(options.propertyRules === 'landing-v1') {state.festivalTileId=null;state.festivalLevel=0;}
  state.log[0].message += ` ${state.players[startingPlayer].name} đi đầu; lượt tiếp theo theo thứ tự danh sách người chơi.`;
  return state;
}
