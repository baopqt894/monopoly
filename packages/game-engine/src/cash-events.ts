import type { CashEvent, GameState, Player } from '@typhu/contracts';

/** Snapshot money is settled synchronously; this bounded ledger only describes presentation. */
export function changeCash(
  state: GameState,
  changes: { player: Player; amount: number }[],
  reason: string,
  trigger?: CashEvent['trigger'] | null,
) {
  const entries: CashEvent['changes'] = [];
  for (const { player, amount } of changes) {
    if (!amount) continue;
    player.cash += amount;
    entries.push({ playerId: player.id, amount, balance: player.cash });
  }
  if (!entries.length) return;
  const timing =
    trigger === undefined && state.movement
      ? { movementId: state.movement.id, at: 'arrival' as const }
      : (trigger ?? undefined);
  const event: CashEvent = {
    id: (state.cashEvents?.at(-1)?.id ?? 0) + 1,
    reason,
    changes: entries,
    ...(timing ? { trigger: timing } : {}),
  };
  state.cashEvents = [...(state.cashEvents ?? []), event].slice(-64);
}

export function payCash(
  state: GameState,
  from: Player,
  toId: string | null,
  amount: number,
  reason: string,
) {
  changeCash(
    state,
    [
      { player: from, amount: -amount },
      ...(toId ? [{ player: state.players.find((p) => p.id === toId)!, amount }] : []),
    ],
    reason,
  );
}
