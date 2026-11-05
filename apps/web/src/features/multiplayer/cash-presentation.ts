import type { CashEvent, GameState } from '@typhu/contracts';

export const CASH_EVENT_MS = 700;
export type CashPresentationView = {
  revision: number;
  balances: Record<string, number>;
  active: CashEvent | null;
  busy: boolean;
};
const balancesFor = (game: GameState) =>
  Object.fromEntries(game.players.map((p) => [p.id, p.cash]));

/** A visual queue of server-authored balances; never computes rent, salary or gameplay state. */
export class CashPresentationQueue {
  private balances: Record<string, number>;
  private expected: Record<string, number>;
  private cursor: number;
  private fallbackId = 0;
  private pending: CashEvent[] = [];
  private active: CashEvent | null = null;
  private until = 0;
  private movementId?: number;
  private milestones = new Map<number, { step: number; arrived: boolean }>();
  private revision = 0;

  constructor(game: GameState) {
    this.balances = balancesFor(game);
    this.expected = { ...this.balances };
    this.cursor = game.cashEvents?.at(-1)?.id ?? 0;
    this.movementId = game.movement?.id;
    if (this.movementId !== undefined) this.arrive(this.movementId);
  }
  view(): CashPresentationView {
    return {
      revision: this.revision,
      balances: this.balances,
      active: this.active,
      busy: !!this.active || !!this.pending.length,
    };
  }
  accept(game: GameState) {
    const latest = game.cashEvents?.at(-1)?.id ?? 0;
    const fresh = (game.cashEvents ?? []).filter((event) => event.id > this.cursor);
    // Reconnect/history gaps and new matches snap to truth, rather than replaying stale money.
    if (latest < this.cursor || (fresh.length && fresh[0].id !== this.cursor + 1)) {
      this.balances = balancesFor(game);
      this.expected = { ...this.balances };
      this.pending = [];
      this.active = null;
      this.cursor = latest;
      this.milestones.clear();
      this.movementId = game.movement?.id;
      if (this.movementId !== undefined) this.arrive(this.movementId);
      this.revision++;
      return;
    }
    this.movementId = game.movement?.id;
    this.pending.push(...fresh);
    for (const event of fresh)
      for (const change of event.changes) this.expected[change.playerId] = change.balance;
    this.cursor = latest;
    // Compatible with older snapshots that do not yet publish individual transactions.
    const fallback = game.players.flatMap((player) => {
      const before = this.expected[player.id] ?? player.cash;
      return player.cash === before
        ? []
        : [{ playerId: player.id, amount: player.cash - before, balance: player.cash }];
    });
    if (fallback.length)
      this.pending.push({
        id: --this.fallbackId,
        reason: 'Cập nhật số dư',
        changes: fallback,
        ...(game.movement ? { trigger: { movementId: game.movement.id, at: 'arrival' } } : {}),
      });
    this.expected = balancesFor(game);
    if (fresh.length || fallback.length) this.revision++;
    if (this.pending.length > 128) {
      this.balances = balancesFor(game);
      this.pending = [];
      this.active = null;
      this.revision++;
    }
  }
  step(movementId: number, index: number) {
    const prior = this.milestones.get(movementId);
    this.milestones.set(movementId, {
      step: Math.max(prior?.step ?? -1, index),
      arrived: prior?.arrived ?? false,
    });
    this.trimMilestones();
  }
  arrive(movementId: number) {
    this.milestones.set(movementId, { step: Infinity, arrived: true });
    this.trimMilestones();
  }
  private trimMilestones() {
    if (this.milestones.size > 16) this.milestones.delete(this.milestones.keys().next().value!);
  }
  private ready(event: CashEvent) {
    const trigger = event.trigger;
    if (!trigger || trigger.movementId !== this.movementId) return true;
    const reached = this.milestones.get(trigger.movementId);
    return (
      !!reached &&
      (trigger.at === 'arrival' ? reached.arrived : reached.step >= (trigger.stepIndex ?? 0))
    );
  }
  tick(now: number) {
    if (this.active && now >= this.until) {
      this.active = null;
      this.revision++;
    }
    if (this.active || !this.pending.length || !this.ready(this.pending[0])) return;
    this.active = this.pending.shift()!;
    this.balances = { ...this.balances };
    for (const change of this.active.changes) this.balances[change.playerId] = change.balance;
    this.until = now + CASH_EVENT_MS;
    this.revision++;
  }
}
