import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  reduceGame,
  rentFor,
  festivalTargets,
  festivalRentMultiplier,
  nextFestivalMultiplier,
  randomEventTileIds,
  timeoutAction,
  chooseBotAction,
} from '../src';

const game = () =>
  createGame({
    names: ['A', 'B', 'C'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    eventTileCount: 0,
    seed: 123,
  });
function own(state: ReturnType<typeof game>, id: number, ownerId = 'player-1', level = 1) {
  state.properties[id] = { ownerId, level, mortgaged: false, business: 'residence' };
}
function host(state: ReturnType<typeof game>, id: number) {
  state.phase = 'festival';
  return reduceGame(state, { type: 'HOST_FESTIVAL', tileId: id });
}

test('random event lots are separate from the single hosted festival, with legacy aliases accepted but never interpreted as a festival', () => {
  const state = createGame({
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    eventTileCount: 24,
    seed: 1,
  });
  assert.equal(state.eventTileIds!.length, 24);
  assert.equal(state.festivalTileId, null);
  assert.equal(state.festivalLevel, 0);
  const old = createGame({ boardId: 'vietnam-32', festivalTileCount: 3, seed: 1 });
  assert.equal(old.eventTileCount, 3);
  const saved = game();
  delete saved.eventTileIds;
  saved.festivalTileIds = [1, 4];
  assert.deepEqual(randomEventTileIds(saved), [1, 4]);
  assert.equal(festivalRentMultiplier(saved, 1), 1);
  assert.throws(() => createGame({ eventTileCount: 2, festivalTileCount: 3 }));
});

test('festival hosting only accepts current player city lots, never rivals, resorts, corners or a call outside the hosting phase', () => {
  const state = game();
  own(state, 1);
  own(state, 2, 'player-2');
  own(state, 4, 'player-1', 0);
  assert.deepEqual(festivalTargets(state), [1]);
  assert.ok(reduceGame(state, { type: 'HOST_FESTIVAL', tileId: 1 }).error);
  state.phase = 'festival';
  for (const id of [2, 4, 16, -1, 1.5, 32]) {
    const invalid = reduceGame(state, { type: 'HOST_FESTIVAL', tileId: id });
    assert.ok(invalid.error);
    assert.equal(invalid.festivalTileId, null);
    assert.equal(invalid.festivalLevel, 0);
  }
  const picked = reduceGame(state, { type: 'HOST_FESTIVAL', tileId: 1 });
  assert.equal(picked.error, null);
  assert.equal(picked.phase, 'end');
  assert.equal(picked.festivalTileId, 1);
  assert.equal(picked.festivalLevel, 1);
  const repeat = reduceGame(picked, { type: 'HOST_FESTIVAL', tileId: 1 });
  assert.ok(repeat.error);
  assert.equal(repeat.festivalLevel, 1);
});

test('festival bonus grows globally by 0.5, moves to the newly chosen city, and stacks with event and color bonuses before rounding', () => {
  const state = game();
  own(state, 1);
  own(state, 2);
  own(state, 3);
  state.eventTileIds = [1];
  assert.equal(rentFor(state, 1), 5);
  const first = host(state, 1);
  assert.equal(first.festivalLevel, 1);
  assert.equal(festivalRentMultiplier(first, 1), 1.5);
  assert.equal(rentFor(first, 1), 8);
  const second = host(first, 3);
  assert.equal(second.festivalLevel, 2);
  assert.equal(second.festivalTileId, 3);
  assert.equal(rentFor(second, 1), 5);
  assert.equal(rentFor(second, 3), 8);
  const third = host(second, 1);
  assert.equal(third.festivalLevel, 3);
  assert.equal(festivalRentMultiplier(third, 1), 2.5);
  assert.equal(rentFor(third, 1), 13);
  assert.equal(rentFor(third, 3), 4);
  own(third, 7, 'player-2');
  third.currentPlayer = 1;
  const fourth = host(third, 7);
  assert.equal(fourth.festivalLevel, 4);
  assert.equal(fourth.festivalTileId, 7);
  assert.equal(festivalRentMultiplier(fourth, 7), 3);
  assert.equal(festivalRentMultiplier(fourth, 1), 1);
});

test('outage still disables festival profits and transfer of the venue does not reset the global festival history', () => {
  const state = game();
  own(state, 1);
  state.eventTileIds = [1];
  let selected = host(state, 1);
  selected.properties[1].disabledLaps = 2;
  assert.equal(rentFor(selected, 1), 0);
  delete selected.properties[1].disabledLaps;
  assert.equal(rentFor(selected, 1), 4);
  selected.phase = 'card';
  selected.drawnCard = { deck: 'chance', cardId: 'chance-23', revealed: true };
  selected = reduceGame(selected, {
    type: 'RESOLVE_CARD',
    targetTileId: 1,
    targetPlayerId: 'player-2',
  });
  assert.equal(selected.festivalTileId, 1);
  assert.equal(selected.festivalLevel, 1);
  assert.equal(selected.properties[1].ownerId, 'player-2');
  assert.equal(rentFor(selected, 1), 4);
});

test('the festival travel card resolves the current venue and pays that venue rent, not a random event tile', () => {
  const state = game();
  state.eventTileIds = [1];
  own(state, 3, 'player-2');
  state.festivalTileId = 3;
  state.festivalLevel = 3;
  state.players[0].position = 28;
  state.phase = 'card';
  state.drawnCard = { deck: 'chance', cardId: 'chance-21', revealed: true };
  const moved = reduceGame(state, { type: 'RESOLVE_CARD' });
  assert.equal(moved.players[0].position, 3);
  assert.equal(moved.players[0].cash, 1690);
  assert.equal(moved.players[1].cash, 1510);
});

test('skip leaves the venue/count unchanged; bot and timeout choose legal city venues and do not stall', () => {
  const state = game();
  own(state, 1);
  own(state, 3);
  state.phase = 'festival';
  assert.equal(reduceGame(state, timeoutAction(state)!).festivalLevel, 1);
  assert.equal(reduceGame(state, chooseBotAction(state)!).festivalLevel, 1);
  state.festivalTileId = 1;
  state.festivalLevel = 2;
  const skipped = reduceGame(state, { type: 'SKIP_FESTIVAL' });
  assert.equal(skipped.phase, 'end');
  assert.equal(skipped.festivalTileId, 1);
  assert.equal(skipped.festivalLevel, 2);
  state.properties = {};
  assert.deepEqual(timeoutAction(state), { type: 'SKIP_FESTIVAL' });
});

test('festival increment only accepts 0.25 or 0.5 and defaults to the existing 0.5', () => {
  assert.equal(createGame().festivalIncrement, 0.5);
  for (const festivalIncrement of [0.25, 0.5] as const)
    assert.equal(createGame({ festivalIncrement }).festivalIncrement, festivalIncrement);
  for (const festivalIncrement of [0, -0.25, 0.1, 1, NaN, Infinity, null, '0.25'])
    assert.throws(() => createGame({ festivalIncrement } as never));
});

test('both increment choices drive cumulative rent and the next-host preview; missing fields keep legacy multipliers', () => {
  for (const festivalIncrement of [0.25, 0.5] as const) {
    let state = createGame({ names: ['A', 'B'], boardId: 'vietnam-32', propertyRules: 'landing-v1', festivalIncrement });
    own(state, 1);
    for (let count = 1; count <= 4; count++) {
      assert.equal(nextFestivalMultiplier(state), 1 + count * festivalIncrement);
      state = host(state, 1);
      assert.equal(state.festivalLevel, count);
      assert.equal(festivalRentMultiplier(state, 1), 1 + count * festivalIncrement);
      assert.equal(rentFor(state, 1), Math.ceil(2 * (1 + count * festivalIncrement)));
    }
  }
  const saved = game(); own(saved, 1); saved.festivalTileId = 1; saved.festivalLevel = 2;
  delete saved.festivalIncrement;
  assert.equal(festivalRentMultiplier(saved, 1), 2);
  assert.equal(nextFestivalMultiplier(saved), 2.5);
});
