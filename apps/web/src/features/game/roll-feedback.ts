import type { GameState } from '@typhu/contracts';

/** Only the route tied to this accepted roll can be used as its destination. */
export function rollFeedback(game: GameState) {
  if (!game.lastRoll) return null;
  const movement = game.movement;
  const matches = movement?.rollId === game.lastRoll.id &&
    movement.playerId === game.lastRoll.playerId && movement.mode !== 'card' && movement.mode !== 'flight';
  return {
    total: game.dice[0] + game.dice[1],
    doubles: game.dice[0] === game.dice[1],
    destinationId: matches && movement.path.length ? movement.path[movement.path.length - 1] : null,
  };
}

export type RollFeedback = NonNullable<ReturnType<typeof rollFeedback>>;
