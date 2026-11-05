import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, BOARD_32 } from '@typhu/game-content';
import { createGame, reduceGame, rentFor } from '../src';

const expected = [
  [1, 2, 25, 50, 75, 150], [2, 2, 28, 55, 83, 165],
  [3, 4, 30, 60, 90, 180], [5, 6, 33, 65, 98, 195],
  [6, 6, 35, 75, 105, 210], [7, 8, 38, 75, 113, 225],
  [9, 10, 70, 140, 210, 385], [10, 10, 75, 150, 225, 413],
  [11, 12, 80, 160, 240, 440], [13, 14, 85, 170, 255, 468],
  [15, 16, 90, 180, 270, 495], [17, 18, 113, 225, 338, 619],
  [19, 20, 120, 240, 360, 660], [21, 22, 128, 255, 383, 701],
  [22, 22, 135, 270, 405, 743], [23, 24, 143, 285, 428, 784],
  [26, 26, 170, 340, 510, 935], [27, 28, 180, 360, 540, 990],
  [29, 35, 190, 380, 570, 1045], [31, 50, 200, 400, 600, 1100],
];

test('all 20 Vietnamese cities charge the approved five rent tiers in travel order', () => {
  const state = createGame({ boardId: 'vietnam-32', propertyRules: 'landing-v1', eventTileCount: 0 });
  assert.deepEqual(BOARD_32.filter(tile => tile.kind === 'street').map(tile => tile.id), expected.map(row => row[0]));
  for (const [id, ...rents] of expected) {
    state.properties = { [id]: { ownerId: 'player-2', level: 1, mortgaged: false, business: 'residence' } };
    for (let level = 1; level <= 5; level++) {
      state.properties[id].level = level;
      assert.equal(rentFor(state, id), rents[level - 1], `${BOARD_32[id].name} level ${level}`);
    }
  }
  assert.deepEqual(BOARD[1].rents, [2, 10, 30, 90, 160, 250]);
  assert.deepEqual(BOARD[39].rents, [50, 200, 600, 1400, 1700, 2000]);
});

test('landing transfers new rent once, while event/color/festival bonuses and outage still apply', () => {
  const state = createGame({ names: ['A', 'B'], boardId: 'vietnam-32', propertyRules: 'landing-v1', eventTileCount: 0 });
  state.properties[31] = { ownerId: 'player-2', level: 5, mortgaged: false, business: 'residence' };
  state.players[0].position = 28;
  const landed = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.equal(landed.error, null);
  assert.deepEqual(landed.players.map(player => player.cash), [400, 2600]);
  state.properties[29] = { ...state.properties[31] };
  state.eventTileIds = [31];
  state.festivalTileId = 31;
  state.festivalLevel = 1;
  state.festivalIncrement = 0.25;
  assert.equal(rentFor(state, 31), 3438); // ceil(1100 × 2 × 1.25 × 1.25).
  state.properties[31].disabledLaps = 3;
  assert.equal(rentFor(state, 31), 0);
});
