import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame, rentFor, chooseBotAction, MAX_EVENT_TILES, EVENT_ELIGIBLE_TILE_IDS } from '../src';
import { BOARD, BOARD_32 } from '@typhu/game-content';

const game = (eventTileCount = 3, seed = 123) => createGame({ names: ['An', 'Bình'], propertyRules: 'landing-v1', boardId: 'vietnam-32', eventTileCount, seed });

test('festival generation chooses exactly the configured count of distinct city IDs, deterministically by seed', () => {
  for (const count of [0, 1, 3, MAX_EVENT_TILES]) {
    const state = game(count);
    assert.equal(state.eventTileCount, count);
    assert.equal(state.eventTileIds!.length, count);
    assert.equal(new Set(state.eventTileIds).size, count);
    assert.ok(state.eventTileIds!.every(id => BOARD_32[id].kind === 'street' || BOARD_32[id].resort));
    assert.deepEqual(state.eventTileIds, game(count).eventTileIds);
  }
  assert.deepEqual(new Set(game(MAX_EVENT_TILES).eventTileIds), new Set(EVENT_ELIGIBLE_TILE_IDS));
  assert.ok(new Set(Array.from({length: 20}, (_, i) => JSON.stringify(game(3, i + 1).eventTileIds))).size > 1);
  assert.deepEqual(createGame().eventTileIds, []);
  for (const eventTileCount of [-1, 1.5, NaN, Infinity, MAX_EVENT_TILES + 1, null, '3'])
    assert.throws(() => createGame({ eventTileCount } as never));
});

test('festival rent stacks with groups at all levels, rounds once and respects mortgage/outage', () => {
  const state = createGame({ names: ['An', 'Bình'], propertyRules: 'landing-v1', seed: 123 }); state.eventTileIds = [1];
  for (const level of [0, 1, 4, 5]) {
    state.properties = { 1: { ownerId: 'player-2', level, business: 'residence', mortgaged: false } };
    assert.equal(rentFor(state, 1), Math.ceil(BOARD[1].rents![level] * 1.25));
    state.properties[3] = { ownerId: 'player-2', level: 0, business: 'residence', mortgaged: false };
    assert.equal(rentFor(state, 1), Math.ceil(BOARD[1].rents![level] * 2.5));
    state.properties[1].mortgaged = true; assert.equal(rentFor(state, 1), 0);
    state.properties[1].mortgaged = false; state.properties[1].disabledLaps = 3; assert.equal(rentFor(state, 1), 0);
  }
  state.properties[1].disabledLaps = 0; delete state.eventTileIds;
  assert.equal(rentFor(state, 1), BOARD[1].rents![5] * 2);
});

test('landing charges festival rent, takeover price stays unchanged and festival persists after transfer', () => {
  const state = createGame({ names: ['An', 'Bình'], propertyRules: 'landing-v1', seed: 123 }); state.eventTileIds = [3];
  state.properties[3] = { ownerId: 'player-2', level: 2, business: 'residence', mortgaged: false };
  state.players[0].position = 1;
  const landed = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
  assert.equal(landed.players[0].cash, 1425); assert.equal(landed.players[1].cash, 1575);
  const bought = reduceGame(landed, { type: 'BUY_BACK', tileId: 3 });
  assert.equal(bought.error, null); assert.equal(bought.players[0].cash, 1185);
  assert.equal(bought.players[1].cash, 1815); assert.deepEqual(bought.eventTileIds, [3]);
  assert.equal(bought.properties[3].ownerId, 'player-1'); assert.equal(rentFor(bought, 3), 75);
  assert.deepEqual(state.players.map(p => p.cash), [1500, 1500]);
  assert.deepEqual(reduceGame(bought, { type: 'END_TURN' }).eventTileIds, [3]);
});


test('32-board resorts receive festival rent while remaining non-buildable, and map events keep the festival', () => {
  const state = game(24);
  assert.equal(BOARD_32.length, 32);
  assert.equal(BOARD_32.filter(tile => tile.kind === 'street').length, 20);
  assert.deepEqual(BOARD_32.filter(tile => tile.resort).map(tile => tile.id), [4,14,18,25]);
  state.players[0].position = 1;
  state.properties[4] = { ownerId: 'player-2', level: 0, business: 'residence', mortgaged: false };
  assert.equal(rentFor(state, 4), 32);
  const landed = reduceGame(state, { type: 'ROLL', dice: [1,2] });
  assert.equal(landed.players[0].cash, 1468); assert.equal(landed.players[1].cash, 1532);
  assert.deepEqual(landed.eventTileIds, state.eventTileIds);
  state.properties[14] = { ...state.properties[4] };
  assert.equal(rentFor(state, 4), 63);
  state.properties[4].mortgaged = true; assert.equal(rentFor(state, 4), 0);
});

test('32-board movement wraps at 32 and uses island 8, airport 24 and all three chance spaces', () => {
  const state = game(0); state.players[0].position = 31;
  const next = reduceGame(state, { type: 'ROLL', dice: [1,2] });
  assert.equal(next.players[0].position, 2); assert.equal(next.players[0].completedLaps, 1);
  assert.deepEqual(next.movement!.path, [0,1,2]); assert.equal(next.players[0].cash, 1700);
  const doubles = game(0); doubles.doubles = 2;
  const jailed = reduceGame(doubles, { type: 'ROLL', dice: [1,1] });
  assert.equal(jailed.players[0].position, 8); assert.equal(jailed.players[0].jailed, true);
  for (const position of [12,20,28]) {
    const at = game(0); at.players[0].position = position - 3;
    const card = reduceGame(at, { type: 'ROLL', dice: [1,2] });
    assert.equal(card.phase, 'card'); assert.equal(card.drawnCard!.deck, 'chance');
  }
  const at = game(0); at.players[0].position = 21;
  assert.equal(reduceGame(at, { type: 'ROLL', dice: [1,2] }).players[0].flight, 'waiting');
});

test('32-board travel cards never use legacy 40-board destinations', () => {
  for (const [id, destination] of [['chance-02',31],['chance-03',17],['chance-04',15],['chance-14',4],['chance-06',16],['chance-07',24],['chance-22',30]] as const) {
    const state = game(0); state.phase = 'card'; state.drawnCard = { deck: 'chance', cardId: id, revealed: true };
    const next = reduceGame(state, { type: 'RESOLVE_CARD' });
    assert.equal(next.error, null); assert.equal(next.players[0].position, destination);
  }
});


test('nearest-resort card stacks double rent and festival before final rounding', () => {
  const state = game(24); state.phase = 'card'; state.drawnCard = { deck: 'chance', cardId: 'chance-05', revealed: true };
  state.properties[4] = { ownerId: 'player-2', level: 0, business: 'residence', mortgaged: false };
  const next = reduceGame(state, { type: 'RESOLVE_CARD' });
  assert.equal(next.players[0].cash, 1437); assert.equal(next.players[1].cash, 1563);
});

test('32-board bot simulation stays inside its board and preserves festival placement', () => {
  let state = game(7); const ids = [...state.eventTileIds!];
  for (let step = 0; step < 500 && state.phase !== 'finished'; step++) {
    const action = chooseBotAction(state); assert.ok(action);
    const next = reduceGame(state, action); assert.equal(next.error, null, JSON.stringify(action)); state = next;
    assert.ok(state.players.every(player => player.position >= 0 && player.position < 32));
    assert.ok(Object.keys(state.properties).every(id => +id >= 0 && +id < 32));
    assert.deepEqual(state.eventTileIds, ids);
  }
});
