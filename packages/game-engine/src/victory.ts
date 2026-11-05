import type { GameState, Player, WinReason } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { netWorth } from './selectors';

export interface Victory { winnerId: string; reason: WinReason }
export const usesBusinessTourVictory = (state: GameState) => state.victoryRules === 'business-tour-v1';

/** Ownership decides monopoly wins; house levels, mortgages and outages do not change ownership. */
export function monopolyVictory(state: GameState, playerId: string): Victory | null {
  const player = state.players.find(player => player.id === playerId);
  if (!usesBusinessTourVictory(state) || !player || player.bankrupt) return null;
  const board = boardFor(state);
  const owns = (id: number) => state.properties[id]?.ownerId === playerId;
  const resorts = board.filter(tile => tile.resort);
  if (resorts.length === 4 && resorts.every(tile => owns(tile.id))) return { winnerId: playerId, reason: 'resort-monopoly' };
  const sideLength = board.length / 4;
  for (let side = 0; side < 4; side++) {
    // Every ownable lot on the side counts, including its resort.
    const cities = board.filter(tile => tile.price !== undefined && Math.floor(tile.id / sideLength) === side);
    if (cities.length && cities.every(tile => owns(tile.id))) return { winnerId: playerId, reason: 'side-monopoly' };
  }
  const groups = [...new Set(board.filter(tile => tile.kind === 'street' && tile.group).map(tile => tile.group!))];
  const completeGroups = groups.filter(group => board.filter(tile => tile.kind === 'street' && tile.group === group).every(tile => owns(tile.id)));
  return completeGroups.length >= 3 ? { winnerId: playerId, reason: 'triple-monopoly' } : null;
}

/** Internal finalization; only validated engine/server transitions call this mutator. */
export function completeVictory(state: GameState, victory: Victory): void {
  if (state.phase === 'finished') return;
  state.phase = 'finished'; state.winnerId = victory.winnerId; state.winReason = victory.reason;
  state.extraRoll = false; state.doubles = 0;
  state.drawnCard = null; state.auction = null; state.debt = null; state.pendingPayments = [];
  delete state.propertyVisit;
  const name = state.players.find(player => player.id === victory.winnerId)!.name;
  const labels: Record<WinReason, string> = {
    'side-monopoly': 'Side Monopoly — sở hữu toàn bộ đất và resort trên một cạnh',
    'triple-monopoly': 'Triple Monopoly — sở hữu trọn 3 nhóm màu',
    'resort-monopoly': 'Resort Monopoly — sở hữu cả 4 resort',
    bankruptcy: 'mọi đối thủ đã phá sản',
    'accept-winnings': 'Accept Winnings — mọi đối thủ đã rời bàn',
    capital: 'dẫn đầu tài sản khi hết giới hạn ván',
    'time-limit': 'dẫn đầu tài sản khi hết thời gian chơi',
  };
  state.log.unshift({id:state.nextLogId++,round:state.round,kind:'event',message:`${name} thắng: ${labels[victory.reason]}.`});
  state.log = state.log.slice(0,120);
}

/** Check after a successful action, including transfers to a non-current player. */
export function resolveInstantVictory(state: GameState): void {
  if (!usesBusinessTourVictory(state) || state.phase === 'finished') return;
  const alive = state.players.filter(player => !player.bankrupt);
  if (alive.length === 1) { completeVictory(state, {winnerId:alive[0].id,reason:'bankruptcy'}); return; }
  const remainingHumans = alive.filter(player => !(state.departedPlayerIds ?? []).includes(player.id));
  if (state.departedPlayerIds?.length && remainingHumans.length === 1) {
    completeVictory(state, {winnerId:remainingHumans[0].id,reason:'accept-winnings'}); return;
  }
  // A simultaneous trade can complete both players' goals; the initiating/current player has priority.
  for (let offset = 0; offset < state.players.length; offset++) {
    const player = state.players[(state.currentPlayer + offset) % state.players.length];
    const victory = monopolyVictory(state, player.id);
    if (victory) { completeVictory(state, victory); return; }
  }
}

/** Called only for an authenticated, voluntary LEAVE_ROOM, never disconnect/heartbeat expiry. */
export function resolveDepartureVictory(previous: GameState, departedPlayerId: string): GameState {
  if (!usesBusinessTourVictory(previous) || previous.phase === 'finished' || !previous.players.some(player => player.id === departedPlayerId)) return previous;
  const state = structuredClone(previous);
  state.departedPlayerIds = [...new Set([...(state.departedPlayerIds ?? []),departedPlayerId])];
  const remaining = state.players.filter(player => !player.bankrupt && !state.departedPlayerIds!.includes(player.id));
  if (remaining.length === 1) completeVictory(state, {winnerId:remaining[0].id,reason:'accept-winnings'});
  else if (remaining.length === 0) {
    state.phase = 'finished'; state.winnerId = null;
    delete state.winReason;
  }
  return state;
}


/** Results must respect the authoritative winner even when another player has more capital. */
export function gameOutcome(state: GameState): { ranked: Player[]; leaders: Player[] } {
  const decisive = !!state.winReason && !['capital', 'time-limit'].includes(state.winReason);
  const ranked = [...state.players].sort((a,b) =>
    (decisive ? Number(b.id === state.winnerId) - Number(a.id === state.winnerId) : 0) ||
    Number(a.bankrupt) - Number(b.bankrupt) || netWorth(state,b.id) - netWorth(state,a.id) || b.cash - a.cash);
  const leaders = decisive ? ranked.filter(player => player.id === state.winnerId) :
    state.phase === 'finished' && usesBusinessTourVictory(state) && !state.winnerId ? [] :
    ranked.filter(player => !player.bankrupt && netWorth(state,player.id) === netWorth(state,ranked[0].id) && player.cash === ranked[0].cash);
  return {ranked,leaders};
}

/** Server invokes at its persisted match deadline. No client clock can finish a game. */
export function finishGameOnTime(previous: GameState): GameState {
  if (previous.phase === 'finished') return previous;
  const state = structuredClone(previous);
  const ranked = gameOutcome(state).ranked.filter(player => !player.bankrupt);
  state.phase = 'finished';
  state.winnerId = ranked[0]?.id ?? null;
  state.winReason = 'time-limit';
  state.extraRoll = false;
  state.doubles = 0;
  state.error = null;
  state.drawnCard = null;
  state.auction = null;
  delete state.propertyVisit;
  delete state.automaticRoll;
  delete state.flightRollPending;
  // Keep outstanding debt frozen: netWorth and the results table must still deduct it.
  state.log.unshift({ id: state.nextLogId++, round: state.round, kind: 'event',
    message: 'Hết thời gian chơi. Xếp hạng theo tổng tài sản; nếu bằng nhau, so tiền mặt.' });
  state.log = state.log.slice(0, 120);
  return state;
}
