import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,reduceGame,initialConstruction,propertyValue,buyBackQuote,liquidationValue} from '../src';
const game=()=>createGame({names:['A','B'],boardId:'vietnam-32',propertyRules:'landing-v1',propertyPricing:'level-one-included',liquidationRules:'full-value-v1',seed:123});

test('printed land price includes level one; only upgrades from level two onward add construction value',()=>{
  const state=game();
  assert.equal(initialConstruction(state,1).cost,60);
  assert.equal(initialConstruction(state,1,3).cost,160);
  state.players[0].completedLaps=1;assert.equal(initialConstruction(state,1,4).cost,210);
  for(const [level,value] of [[0,60],[1,60],[2,110],[3,160],[4,210],[5,260]]) {
    state.properties[1]={ownerId:'player-1',level,mortgaged:false,business:'residence'};
    assert.equal(propertyValue(state,1),value);assert.equal(liquidationValue(state,1),value);
  }
  assert.equal(initialConstruction(state,4).cost,200);
});

test('buying grants level one for the printed price, then upgrading charges only the extra levels',()=>{
  const state=game();state.players[0].position=1;state.phase='purchase';
  state.propertyVisit={playerId:'player-1',tileId:1,ownerIdOnArrival:null,levelOnArrival:0};
  const bought=reduceGame(state,{type:'BUY'});assert.equal(bought.players[0].cash,1440);assert.equal(bought.properties[1].level,1);
  const built=reduceGame(bought,{type:'BUILD',tileId:1,level:3});assert.equal(built.players[0].cash,1340);assert.equal(propertyValue(built,1),160);
});

test('buyback uses the included-level-one value and clearing level zero needs no duplicate first-house charge',()=>{
  for(const [level,price] of [[0,90],[1,90],[3,240]]) {
    const state=game();state.properties[1]={ownerId:'player-2',level,mortgaged:false,business:'residence'};
    state.players[0].position=1;state.phase='end';state.propertyVisit={playerId:'player-1',tileId:1,ownerIdOnArrival:'player-2',levelOnArrival:level};
    const quote=buyBackQuote(state,1);assert.equal(quote.price,price);assert.equal(quote.constructionCost,0);assert.equal(quote.totalCost,price);
    const bought=reduceGame(state,{type:'BUY_BACK',tileId:1});assert.equal(bought.error,null);assert.equal(bought.players[0].cash,1500-price);assert.equal(bought.properties[1].level,Math.max(1,level));
  }
});

test('old snapshots without propertyPricing retain old cost totals and refunds',()=>{
  const state=game();delete state.propertyPricing;
  assert.equal(initialConstruction(state,1).cost,110);
  state.properties[1]={ownerId:'player-1',level:3,mortgaged:false,business:'residence'};assert.equal(propertyValue(state,1),210);
  assert.throws(()=>createGame({propertyPricing:'bad'} as never));
});


test('forced-sale event refunds the same full current value without counting level one twice',()=>{
  const state=game();state.properties[1]={ownerId:'player-2',level:3,mortgaged:false,business:'residence'};
  state.phase='card';state.drawnCard={deck:'chance',cardId:'chance-19',revealed:true};
  const sold=reduceGame(state,{type:'RESOLVE_CARD',targetTileId:1});
  assert.equal(sold.error,null);assert.equal(sold.properties[1],undefined);assert.equal(sold.players[1].cash,1660);
});
