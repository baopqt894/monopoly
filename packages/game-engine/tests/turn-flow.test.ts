import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GameState, Property } from '@typhu/contracts';
import { createGame, finishIdleTurn, hasEndTurnChoices } from '../src/index';

function idle(): GameState {
  const state = createGame({ mode: 'classic', names: ['An', 'Bình'], seed: 123 });
  state.phase = 'end';
  state.players.forEach((player) => {
    player.cash = 0;
  });
  return state;
}
function own(state: GameState, tile: number, patch: Partial<Property> = {}) {
  state.properties[tile] = {
    ownerId: state.players[0].id,
    level: 0,
    mortgaged: false,
    business: 'residence',
    ...patch,
  };
}
test('no legal choices auto-ends on the server, does not mutate input, and advances a final round', () => {
  const state = idle(),
    before = structuredClone(state);
  assert.equal(hasEndTurnChoices(state), false);
  assert.equal(finishIdleTurn(state).currentPlayer, 1);
  assert.equal(finishIdleTurn(state).phase, 'roll');
  assert.deepEqual(state, before);
  state.mode = 'city';
  state.currentPlayer = 1;
  state.round = state.maxRounds;
  assert.equal(finishIdleTurn(state).phase, 'finished');
});
test('cash gifts, requests for cash and property trades all preserve the turn', () => {
  let state = idle();
  state.players[0].cash = 1;
  assert.equal(finishIdleTurn(state), state);
  state = idle();
  state.players[1].cash = 1;
  assert.equal(finishIdleTurn(state), state);
  state = idle();
  own(state, 1, { mortgaged: true });
  state.properties[3] = {
    ownerId: state.players[1].id,
    level: 0,
    mortgaged: false,
    business: 'residence',
  };
  assert.equal(finishIdleTurn(state), state);
});
test('each available property action preserves the turn, even with no online trade partner', () => {
  for (const kind of ['mortgage', 'sell', 'redeem', 'build'] as const) {
    const state = idle();
    own(state, 1, { level: kind === 'sell' ? 1 : 0, mortgaged: kind === 'redeem' });
    if (kind === 'redeem') state.players[0].cash = 33;
    if (kind === 'build') {
      own(state, 3);
      state.players[0].cash = 50;
    }
    assert.equal(finishIdleTurn(state, []), state, kind);
  }
});
test('unaffordable redeem with no valid trade partner is not an available choice', () => {
  const state = idle();
  own(state, 1, { mortgaged: true });
  state.players[0].cash = 32;
  assert.equal(hasEndTurnChoices(state, []), false);
  assert.equal(finishIdleTurn(state, []).currentPlayer, 1);
});
test('debt, auction, card, purchase and extra dice rolls are never skipped', () => {
  for (const phase of ['roll', 'purchase', 'card', 'auction', 'finished'] as const) {
    const state = idle();
    state.phase = phase;
    assert.equal(finishIdleTurn(state), state, phase);
  }
  const debt = idle();
  debt.debt = { debtorId: debt.players[1].id, amount: 10, creditorId: null, reason: 'test' };
  assert.equal(finishIdleTurn(debt), debt);
  const doubles = idle();
  doubles.extraRoll = true;
  assert.equal(finishIdleTurn(doubles), doubles);
});
