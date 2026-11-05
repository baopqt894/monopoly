import { test } from 'node:test';
import assert from 'node:assert/strict';
import {createGame, reduceGame, rentFor, propertyValue, initialConstruction} from '../src';
import {tileAmount} from '../../../apps/web/src/features/board/tile-amount';

function game(tileId = 31) {
  const state = createGame({names:['A','B'], boardId:'vietnam-32', propertyRules:'landing-v1', propertyPricing:'business-tour-v2', eventTileCount:0});
  state.properties[tileId] = {ownerId:'player-2',level:2,mortgaged:false,business:'residence'};
  state.players[0].position = tileId - 3;
  return state;
}

test('event +25% is applied before cumulative festival; labels and payments use the final amount', () => {
  const cases = [
    // step, global hosting count, event, expected on base rent 200
    [0.5,0,false,200], [0.5,0,true,250],
    [0.5,1,false,300], [0.5,1,true,375],
    [0.5,2,true,500], [0.5,3,true,625],
    [0.25,1,false,250], [0.25,1,true,312.5],
    [0.25,2,true,375], [0.25,3,true,437.5],
  ] as const;
  for (const [step,count,event,amount] of cases) {
    const state = game(); state.festivalIncrement = step; state.festivalLevel = count;
    state.festivalTileId = count ? 31 : null; state.eventTileIds = event ? [31] : [];
    const value = propertyValue(state,31), purchase = initialConstruction(state,31,2).cost;
    const expected = Math.ceil(amount);
    assert.equal(rentFor(state,31), expected); assert.equal(tileAmount(state,31), expected);
    const paid = reduceGame(state,{type:'ROLL',dice:[1,2]});
    assert.equal(paid.error,null);
    assert.equal(state.players[0].cash-paid.players[0].cash,expected);
    assert.equal(paid.players[1].cash-state.players[1].cash,expected);
    assert.equal(propertyValue(paid,31),value);
    assert.equal(initialConstruction(paid,31,2).cost,purchase);
  }
});

test('event/festival fractions are retained until the final rounding, and outage blocks all bonuses', () => {
  const state = game(17); // base rent 113, no complete color group
  state.eventTileIds = [17]; state.festivalTileId = 17; state.festivalLevel = 1;
  state.festivalIncrement = 0.5;
  assert.equal(rentFor(state,17),212); // ceil(113 × 1.25 × 1.5), not ceil(142 × 1.5)=213
  state.festivalIncrement = 0.25;
  assert.equal(rentFor(state,17),177); // ceil(113 × 1.25 × 1.25)
  state.properties[17].disabledLaps = 3;
  assert.equal(rentFor(state,17),0); assert.equal(tileAmount(state,17),0);
});
