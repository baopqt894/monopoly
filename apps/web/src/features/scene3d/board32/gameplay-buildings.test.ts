import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '@typhu/game-engine';
import { ownedBuildingLevel } from './gameplay-buildings';
import { resolveCityBuilding } from './building-catalog';
import { tileLayout } from '../board-layout';
import { board32Layout } from './board-layout';
test('live meshes follow acquisition, upgrade, transfer and liquidation without demo houses', () => {
  let game = createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    propertyPricing: 'level-one-included',
    liquidationRules: 'full-value-v1',
  });
  assert.equal(ownedBuildingLevel(game, 17), 0);
  game.phase = 'purchase';
  game.players[0].position = 17;
  game.propertyVisit = {
    playerId: 'player-1',
    tileId: 17,
    ownerIdOnArrival: null,
    levelOnArrival: 0,
  };
  game = reduceGame(game, { type: 'BUY', level: 2 });
  assert.equal(game.error, null);
  assert.equal(ownedBuildingLevel(game, 17), 2);
  game = reduceGame(game, { type: 'BUILD', tileId: 17, level: 3 });
  assert.equal(ownedBuildingLevel(game, 17), 3);
  game.players[0].completedLaps = 1;
  game = reduceGame(game, { type: 'BUILD', tileId: 17, level: 4 });
  game.propertyVisit!.levelOnArrival = 4;
  game = reduceGame(game, { type: 'BUILD', tileId: 17, level: 5 });
  assert.equal(game.error, null);
  assert.equal(ownedBuildingLevel(game, 17), 5);
  const landmark = resolveCityBuilding('Đà Nẵng', 5);
  assert.equal(landmark?.kind, 'landmark');
  assert.ok(landmark && landmark.kind === 'landmark');
  assert.equal(landmark.model, 'dragon');
  game.properties[17].ownerId = 'player-2';
  assert.equal(ownedBuildingLevel(game, 17), 5);
  game.players[1].bankrupt = true;
  assert.equal(ownedBuildingLevel(game, 17), 0);
  delete game.properties[17];
  assert.equal(ownedBuildingLevel(game, 17), 0);
  assert.equal(ownedBuildingLevel(game, 4), 0);
});
test('all pawn/flight coordinates match the approved 32 tile positions and keep legacy corners', () => {
  for (let i = 0; i < 32; i++) {
    const live = tileLayout(i, 'vietnam-32'),
      preview = board32Layout(i);
    assert.equal(live.x, preview.x);
    assert.equal(live.z, preview.z);
    assert.ok(Number.isFinite(live.width) && Number.isFinite(live.depth));
  }
  assert.equal(tileLayout(10).x, -5.225);
  assert.equal(
    new Set(Array.from({ length: 40 }, (_, i) => `${tileLayout(i).x},${tileLayout(i).z}`)).size,
    40,
  );
});
