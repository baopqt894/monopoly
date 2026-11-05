import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import { createGame, propertyRentPreview, reduceGame, rentFor, resortRentProgress } from '../src';

const fresh = () =>
  createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    boardLayout: 'districts-v1',
    propertyRules: 'landing-v1',
    propertyPricing: 'business-tour-v2',
    liquidationRules: 'full-value-v1',
    seed: 123,
    eventTileCount: 0,
  });
test('purchase rent preview agrees with settled purchase including a newly completed district', () => {
  const state = fresh(),
    player = state.players[0];
  player.position = 1;
  player.completedLaps = 2;
  state.phase = 'purchase';
  state.propertyVisit = {
    playerId: player.id,
    tileId: 1,
    ownerIdOnArrival: null,
    levelOnArrival: 0,
  };
  for (const tile of boardFor(state).filter(
    (tile) => tile.group === boardFor(state)[1].group && tile.id !== 1,
  ))
    state.properties[tile.id] = {
      ownerId: player.id,
      level: 1,
      mortgaged: false,
      business: 'residence',
    };
  const before = structuredClone(state),
    rent = propertyRentPreview(state, 1, player.id, 3),
    next = reduceGame(state, { type: 'BUY', level: 3 });
  assert.equal(next.error, null);
  assert.equal(rent, rentFor(next, 1));
  assert.deepEqual(state, before);
});
test('every current-board landmark upgrade quote matches the resulting rent without mutating its input', () => {
  for (const tile of boardFor(fresh()).filter((tile) => tile.kind === 'street')) {
    const state = fresh(),
      player = state.players[0];
    player.completedLaps = 2;
    player.position = tile.id;
    state.phase = 'end';
    state.properties[tile.id] = {
      ownerId: player.id,
      level: 4,
      mortgaged: false,
      business: 'residence',
    };
    state.propertyVisit = {
      playerId: player.id,
      tileId: tile.id,
      ownerIdOnArrival: player.id,
      levelOnArrival: 4,
    };
    const before = structuredClone(state),
      rent = propertyRentPreview(state, tile.id, player.id, 5),
      next = reduceGame(state, { type: 'BUILD', tileId: tile.id, level: 5 });
    assert.equal(next.error, null, tile.name);
    assert.equal(rent, rentFor(next, tile.id), tile.name);
    assert.deepEqual(state, before);
  }
});
test('resort progression follows actual purchases for each collection size and event multiplier', () => {
  for (const event of [false, true])
    for (let owned = 0; owned < 4; owned++) {
      const state = fresh(),
        player = state.players[0],
        resorts = boardFor(state).filter((tile) => tile.kind === 'railroad'),
        target = resorts[0];
      player.position = target.id;
      state.phase = 'purchase';
      state.propertyVisit = {
        playerId: player.id,
        tileId: target.id,
        ownerIdOnArrival: null,
        levelOnArrival: 0,
      };
      if (event) state.eventTileIds = [target.id];
      for (const tile of resorts.slice(1, owned + 1))
        state.properties[tile.id] = {
          ownerId: player.id,
          level: 0,
          mortgaged: false,
          business: 'residence',
        };
      const before = structuredClone(state),
        progress = resortRentProgress(state, target.id, player.id),
        next = reduceGame(state, { type: 'BUY' });
      assert.equal(next.error, null);
      assert.equal(progress[owned].rent, rentFor(next, target.id));
      assert.deepEqual(state, before);
    }
});
test('rent previews preserve a closed or mortgaged property', () => {
  const state = fresh();
  state.properties[1] = {
    ownerId: 'player-1',
    level: 2,
    mortgaged: false,
    business: 'residence',
    disabledLaps: 2,
  };
  assert.equal(propertyRentPreview(state, 1, 'player-1', 3), 0);
  state.properties[1].disabledLaps = 0;
  state.properties[1].mortgaged = true;
  assert.equal(propertyRentPreview(state, 1, 'player-1', 3), 0);
});
