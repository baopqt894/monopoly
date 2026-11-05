import type { ColorGroup, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';

/** Ownership transitions only: never announce an existing group after a roll or upgrade. */
export function newlyCompletedMonopolies(previous: GameState, next: GameState) {
  const board = boardFor(next);
  const groups = [
    ...new Set(board.filter((t) => t.kind === 'street' && t.group).map((t) => t.group!)),
  ];
  const completed: { playerId: string; group: ColorGroup; tileIds: number[] }[] = [];
  for (const player of next.players) {
    if (player.bankrupt) continue;
    for (const group of groups) {
      const tileIds = board
        .filter((t) => t.kind === 'street' && t.group === group)
        .map((t) => t.id);
      if (
        tileIds.every((id) => next.properties[id]?.ownerId === player.id) &&
        !tileIds.every((id) => previous.properties[id]?.ownerId === player.id)
      )
        completed.push({ playerId: player.id, group, tileIds });
    }
  }
  return completed;
}
