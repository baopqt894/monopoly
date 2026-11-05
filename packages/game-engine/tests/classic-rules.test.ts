import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';

const game = () => createGame({ names: ['An', 'Bình'], seed: 123 });
function island(attempts = 0) {
  const state = game();
  Object.assign(state.players[0], { jailed: true, position: 10, jailTurns: attempts });
  return state;
}

test('classic creation validates money and pays configured salary on crossing or landing on GO', () => {
  for (const goSalary of [0, 350]) {
    const state = createGame({ names: ['An', 'Bình'], seed: 1, startingCash: 2400, goSalary });
    assert.equal(state.mode, 'classic'); assert.ok(state.players.every(p => p.cash === 2400));
    for (const position of [37, 39]) {
      state.players[0].position = position;
      const next = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
      assert.equal(next.error, null); assert.equal(next.players[0].cash, 2400 + goSalary);
    }
  }
  for (const invalid of [-1, 1.5, NaN, Infinity, 1000001]) {
    assert.throws(() => createGame({ startingCash: invalid }));
    assert.throws(() => createGame({ goSalary: invalid }));
  }
  assert.throws(() => createGame({ startingCash: 0 }));
});

test('old snapshots without money fields retain their cash and default GO salary', () => {
  const state = game(); delete state.goSalary; delete state.startingCash;
  state.players[0].cash = 80; state.players[0].position = 39;
  const next = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.equal(next.players[0].cash, 280);
});

test('third double bypasses movement, GO salary and destination; island cancels flight', () => {
  const state = game(); state.doubles = 2; state.players[0].position = 39; state.players[0].flight = 'waiting';
  const next = reduceGame(state, { type: 'ROLL', dice: [6, 6] });
  assert.equal(next.players[0].position, 10); assert.equal(next.players[0].cash, 1500);
  assert.equal(next.players[0].jailed, true); assert.equal(next.players[0].jailTurns, 0);
  assert.equal(next.extraRoll, false); assert.equal(next.doubles, 0); assert.equal(next.phase, 'end');
  assert.equal(next.players[0].flight, undefined); assert.deepEqual(next.movement?.path, [0,1,2,3,4,5,6,7,8,9,10]);
  assert.equal(state.players[0].position, 39);
});

test('a non-double clears the chain and the next player starts with zero doubles', () => {
  const state = game(); state.doubles = 2; state.players[0].position = 17;
  const next = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.equal(next.doubles, 0); assert.equal(next.extraRoll, false);
  const ended = reduceGame(next, { type: 'END_TURN' });
  assert.equal(ended.currentPlayer, 1); assert.equal(ended.doubles, 0);
});

test('first two failed island rolls stay; third releases for free, including doubles with extra roll', () => {
  for (const attempts of [0, 1]) {
    const next = reduceGame(island(attempts), { type: 'ROLL', dice: [1, 2] });
    assert.equal(next.players[0].jailed, true); assert.equal(next.players[0].jailTurns, attempts + 1);
    assert.equal(next.players[0].position, 10); assert.equal(next.phase, 'end');
  }
  for (const dice of [[1, 2], [1, 1]] as [number, number][]) {
    const state = island(2); state.players[0].cash = 0;
    const next = reduceGame(state, { type: 'ROLL', dice });
    assert.equal(next.players[0].jailed, false); assert.equal(next.players[0].jailTurns, 0);
    assert.equal(next.players[0].cash, 0); assert.equal(next.debt, null);
    assert.equal(next.players[0].position, 10 + dice[0] + dice[1]);
    // No cash to buy: skip and consume END_TURN, keeping doubles as a ready roll.
    assert.equal(next.phase, 'roll'); assert.equal(next.extraRoll, false);
    assert.equal(next.currentPlayer, dice[0] === dice[1] ? 0 : 1);
    assert.equal(next.doubles, dice[0] === dice[1] ? 1 : 0);
  }
});

test('paid or card escape is before rolling; only paid escape charges 200', () => {
  const poor = island(); poor.players[0].cash = 199;
  assert.ok(reduceGame(poor, { type: 'PAY_BAIL' }).error);
  const paid = island(); paid.players[0].cash = 200;
  const next = reduceGame(paid, { type: 'PAY_BAIL' });
  assert.equal(next.players[0].cash, 0); assert.equal(next.players[0].jailed, false); assert.equal(next.phase, 'roll');
  const rolled = reduceGame(next, { type: 'ROLL', dice: [1, 1] });
  assert.equal(rolled.phase, 'roll'); assert.equal(rolled.currentPlayer, 0); assert.equal(rolled.doubles, 1);
  const card = island(); card.players[0].cash = 0; card.players[0].jailCards = ['chance'];
  card.decks.chance = card.decks.chance.filter(id => id !== 'chance-09');
  const rescued = reduceGame(card, { type: 'USE_JAIL_CARD' });
  assert.equal(rescued.players[0].cash, 0); assert.equal(rescued.players[0].jailed, false);
  assert.equal(rescued.phase, 'roll'); assert.deepEqual(rescued.players[0].jailCards, []);
  assert.equal(rescued.decks.chance.at(-1), 'chance-09');
});
