import type { GameState, PawnMovement } from '@typhu/contracts';

/** Shared presentation budget; never changes dice, money or movement rules. */
export const DICE_SPIN_MS = 1_200;
export const DICE_RESULT_MS = 1_000;
export const DICE_PRESENTATION_MS = DICE_SPIN_MS + DICE_RESULT_MS;
export const PAWN_STEP_MS = 420;
export const PAWN_SINGLE_MOVE_MS = 900;
export const PRESENTATION_BUFFER_MS = 300;
export const CARD_DRAW_MS = 900;
export const CARD_READING_MS = 0;
/** Revealed cards remain visible briefly before forced effects or target selection. */
export const CARD_AUTO_RESOLVE_MS = 1_200;
export const BOARD_EVENT_NOTICE_MS = 2_400;
export const CARD_STEP_MS = 150;
export const FLIGHT_STEP_MS = 100;

export const pawnStepMs = (movement: PawnMovement): number =>
  movement.mode === 'flight' ? FLIGHT_STEP_MS : movement.mode === 'card' ? CARD_STEP_MS : movement.path.length === 1 ? PAWN_SINGLE_MOVE_MS : PAWN_STEP_MS;
export const pawnTravelMs = (movement: PawnMovement | undefined): number =>
  movement ? movement.path.length * pawnStepMs(movement) : 0;

/** Only newly published events reserve time. Later choices must not replay old animations. */
export function turnPresentationMs(
  game: GameState,
  previous: { movementId?: number; rollId?: number; revealId?: number; boardEventId?: number },
): number {
  const rolled = game.lastRoll !== undefined && game.lastRoll.id !== previous.rollId;
  const moved = game.movement !== undefined && game.movement.id !== previous.movementId;
  const revealed = game.phase === 'card' && game.drawnCard?.revealed &&
    game.lastRevealedCard !== undefined && game.lastRevealedCard.id !== previous.revealId;
  const announced = !!game.lastBoardEvent && game.lastBoardEvent.id !== previous.boardEventId && (
    game.lastBoardEvent.kind === 'monopoly' || (game.phase === 'end' && game.players[game.currentPlayer].flight === 'waiting' && game.lastBoardEvent.playerId === game.players[game.currentPlayer].id));
  if (!rolled && !moved && !revealed && !announced) return 0;
  return (
    (rolled ? DICE_PRESENTATION_MS : 0) +
    (moved ? pawnTravelMs(game.movement) : 0) +
    (revealed ? CARD_READING_MS : 0) +
    (announced ? BOARD_EVENT_NOTICE_MS : 0) +
    PRESENTATION_BUFFER_MS
  );
}
