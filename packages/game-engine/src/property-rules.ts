import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';

export const usesLandingRules = (state: GameState) => state.propertyRules === 'landing-v1';
/** Cumulative building value; level one is included in P for modern pricing. */
export function constructionValue(state: GameState, tileId: number, level: number): number {
  const houseCost = boardFor(state)[tileId]?.buildCost ?? 0;
  if ((state.propertyPricing === 'business-tour-v1' || state.propertyPricing === 'business-tour-v2'))
    return (level >= 5 ? 6 : Math.max(0, level - 1)) * houseCost;
  return Math.max(0, level - (state.propertyPricing === 'level-one-included' ? 1 : 0)) * houseCost;
}
/** Quotes, validation and authoritative debits use the same cumulative price difference. */
export const constructionUpgradeCost = (state: GameState, tileId: number, fromLevel: number, toLevel: number): number =>
  (state.propertyPricing === 'business-tour-v1' || state.propertyPricing === 'business-tour-v2')
    ? Math.max(0, constructionValue(state, tileId, toLevel) - constructionValue(state, tileId, fromLevel))
    : Math.max(0, toLevel - fromLevel) * (boardFor(state)[tileId]?.buildCost ?? 0);
export const propertyValue = (state: GameState, tileId: number): number =>
  (boardFor(state)[tileId]?.price ?? 0) + constructionValue(state,tileId,state.properties[tileId]?.level ?? 0);
export const propertyClosed = (state: GameState, tileId: number): boolean => usesLandingRules(state) && (state.properties[tileId]?.disabledLaps ?? 0) > 0;
export const personalBuildCap = (state: GameState, playerId: string): 3 | 4 =>
  (state.players.find((p) => p.id === playerId)?.completedLaps ?? 0) >= 1 ? 4 : 3;

/** Being positioned on a tile alone never grants building rights. A fresh landing must exist. */
export function landedOnOwnProperty(state: GameState, tileId: number): boolean {
  const player = state.players[state.currentPlayer];
  return state.phase === 'end' && !state.debt && state.pendingPayments.length === 0 && !player.bankrupt && !player.jailed &&
    state.propertyVisit?.playerId === player.id && state.propertyVisit.tileId === tileId && player.position === tileId &&
    state.properties[tileId]?.ownerId === player.id;
}

export function landingBuildProblem(state: GameState, tileId: number, targetLevel: number): string | null {
  const player = state.players[state.currentPlayer], property = state.properties[tileId], tile = boardFor(state)[tileId];
  if (!tile || tile.kind !== 'street' || !property || property.ownerId !== player.id) return 'Bạn không sở hữu thành phố này.';
  if (!landedOnOwnProperty(state, tileId)) return 'Chỉ được xây khi vừa đáp đúng ô của mình và đã trả hết nợ.';
  if (property.mortgaged) return 'Cần giải chấp ô đất trước khi xây.';
  if (!Number.isInteger(targetLevel) || targetLevel <= property.level || targetLevel > 5) return 'Cấp xây dựng không hợp lệ.';
  if (targetLevel === 5) {
    if (property.level !== 4 || state.propertyVisit!.levelOnArrival !== 4 || personalBuildCap(state, player.id) < 4)
      return 'Cần hoàn thành vòng đầu và đáp lại ô đã có nhà cấp 4 từ trước để xây công trình đặc trưng.';
  } else if (targetLevel > personalBuildCap(state, player.id)) return 'Trước vòng đầu chỉ xây tối đa cấp 3; hoàn thành vòng đầu được xây đến cấp 4.';
  if (player.cash < constructionUpgradeCost(state, tileId, property.level, targetLevel)) return 'Không đủ tiền xây công trình.';
  return null;
}

export function initialConstruction(state: GameState, tileId: number, requestedLevel?: number): { level: number; cost: number; error?: string } {
  const player = state.players[state.currentPlayer], tile = boardFor(state)[tileId];
  if (!tile?.price) return { level: 0, cost: 0, error: 'Ô đất không thể mua.' };
  if (tile.kind !== 'street') {
    if (requestedLevel !== undefined && requestedLevel !== 0) return { level: 0, cost: 0, error: 'Chỉ thành phố mới được xây nhà.' };
    return { level: 0, cost: tile.price };
  }
  const level = requestedLevel ?? 1;
  if (!Number.isInteger(level) || level < 1 || level > personalBuildCap(state, player.id))
    return { level: 0, cost: 0, error: 'Mua thành phố phải xây ít nhất cấp 1 và không vượt giới hạn vòng cá nhân.' };
  return { level, cost: tile.price + constructionValue(state,tileId,level) };
}

export function buyBackQuote(state: GameState, tileId: number): { price: number; constructionCost: number; totalCost: number; error: string | null } {
  const tile = boardFor(state)[tileId], property = state.properties[tileId], player = state.players[state.currentPlayer];
  const price = Math.ceil(propertyValue(state, tileId) * 1.5);
  const constructionCost = tile?.kind === 'street' && property?.level === 0 ? constructionValue(state, tileId, 1) : 0;
  const quote = { price, constructionCost, totalCost: price + constructionCost };
  if (!usesLandingRules(state)) return { ...quote, error: 'Ván cũ không có luật mua lại khi đáp ô.' };
  if (!tile || tile.kind !== 'street' || !property || property.ownerId === player.id || !state.players.some((p) => p.id === property.ownerId && !p.bankrupt)) return { ...quote, error: 'Không có thành phố của đối thủ để mua lại.' };
  if (property.level >= 5) return { ...quote, error: 'Không thể mua lại công trình đặc trưng.' };
  if (state.phase !== 'end' || state.debt || state.pendingPayments.length || player.bankrupt || player.jailed ||
      player.position !== tileId || state.propertyVisit?.playerId !== player.id || state.propertyVisit.tileId !== tileId || state.propertyVisit.ownerIdOnArrival !== property.ownerId)
    return { ...quote, error: 'Chỉ mua lại ô vừa đáp tới sau khi thanh toán xong tiền thuê.' };
  if (player.cash < quote.totalCost) return { ...quote, error: 'Không đủ tiền mua lại và xây nhà tối thiểu sau khi trả tiền thuê.' };
  return { ...quote, error: null };
}
