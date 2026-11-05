import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,reduceGame,liquidationPlan,liquidationValue,liquidationPotential,liquidationQuote,timeoutAction,chooseBotAction} from '../src';

function debt(amount=150,debtorId='player-1') {
  const state=createGame({names:['A','B','C'],boardId:'vietnam-32',propertyRules:'landing-v1',liquidationRules:'full-value-v1',propertyPricing:'level-one-included',seed:123});
  state.phase='end';state.players.find(p=>p.id===debtorId)!.cash=0;
  state.debt={id:10,debtorId,creditorId:debtorId==='player-1'?'player-2':'player-1',amount,reason:'rent',selectedTileIds:[]};
  for(const [id,level] of [[1,1],[4,0],[14,0]]) state.properties[id]={ownerId:debtorId,level,mortgaged:false,business:'residence'};
  return state;
}
const select=(state:ReturnType<typeof debt>,tileIds:number[])=>reduceGame(state,{type:'SET_LIQUIDATION_SELECTION',tileIds});

test('a confirmed batch credits every selected asset once, then pays the debt once, including existing cash',()=>{
  for(const type of ['LIQUIDATE_SELECTED','AUTO_LIQUIDATE'] as const){
    const state=select(debt(50),[1,4]);state.players[0].cash=15;
    const before=structuredClone(state);
    assert.deepEqual(liquidationQuote(state),{selectedIds:[1,4],selectedValue:260,remainingDebt:0,surplus:225});
    const paid=reduceGame(state,{type});
    assert.equal(paid.debt,null);assert.equal(paid.players[0].cash,225);assert.equal(paid.players[1].cash,1550);
    assert.equal(paid.properties[1],undefined);assert.equal(paid.properties[4],undefined);assert.ok(paid.properties[14]);
    assert.equal(paid.cashEvents!.length,2);
    assert.deepEqual(paid.cashEvents![0].changes,[{playerId:'player-1',amount:260,balance:275}]);
    assert.deepEqual(paid.cashEvents![1].changes,[{playerId:'player-1',amount:-50,balance:225},{playerId:'player-2',amount:50,balance:1550}]);
    assert.deepEqual(state,before);
  }
});

test('an insufficient batch also emits one sale and one payment and clears the sold selection',()=>{
  const state=select(debt(600),[1,4]);state.debt!.creditorId=null;
  const paid=reduceGame(state,{type:'LIQUIDATE_SELECTED'});
  assert.equal(paid.debt!.amount,340);assert.equal(paid.debt!.id,10);assert.deepEqual(paid.debt!.selectedTileIds,[]);
  assert.deepEqual(paid.cashEvents!.map(event=>event.changes[0].amount),[260,-260]);
  assert.equal(paid.players[1].cash,1500);
});

test('liquidation pays full land and construction value, including landmark, and new rules reject all mortgage/partial-sale actions',()=>{
  const state=debt();assert.equal(liquidationValue(state,1),60);state.properties[1].level=5;assert.equal(liquidationValue(state,1),260);
  assert.equal(liquidationPotential(state),660);
  for(const type of ['MORTGAGE','UNMORTGAGE','SELL_BUILDING'] as const) {
    assert.ok(reduceGame(state,{type,tileId:1}).error);
    const normal=structuredClone(state);normal.debt=null;
    assert.ok(reduceGame(normal,{type,tileId:1}).error);
  }
  assert.throws(()=>createGame({liquidationRules:'bad'} as never));
});

test('selection is validated, ordered, reversible and never sells or pays until confirmation',()=>{
  const state=debt();const picked=select(state,[14,1]);
  assert.deepEqual(picked.debt!.selectedTileIds,[14,1]);assert.equal(picked.debt!.amount,150);assert.deepEqual(picked.properties,state.properties);
  assert.deepEqual(state.debt!.selectedTileIds,[]);assert.deepEqual(select(picked,[]).debt!.selectedTileIds,[]);
  for(const ids of [[1,1],[31],[-1],[1.5],[NaN]]) {
    const rejected=select(state,ids);assert.ok(rejected.error);assert.deepEqual(rejected.debt,state.debt);
  }
  const legacy=debt();delete legacy.liquidationRules;assert.ok(select(legacy,[1]).error);
});

test('manual full-tile sale repays rent, removes ownership/buildings, frees bank inventory, and keeps surplus cash',()=>{
  const state=select(debt(),[4]);state.eventTileIds=[4];
  const paid=reduceGame(state,{type:'LIQUIDATE_SELECTED'});
  assert.equal(paid.error,null);assert.equal(paid.debt,null);assert.equal(paid.properties[4],undefined);
  assert.equal(paid.players[0].cash,50);assert.equal(paid.players[1].cash,1650);
  assert.deepEqual(paid.eventTileIds,[4]);assert.equal(paid.properties[14].ownerId,'player-1');
  assert.equal(state.properties[4].ownerId,'player-1');
  const again=reduceGame(paid,{type:'LIQUIDATE_SELECTED'});assert.ok(again.error);assert.equal(again.players[1].cash,1650);
});

test('manual insufficient selection sells only selected lots and keeps the same debt identity for the remaining balance',()=>{
  const state=select(debt(300),[1]);const partial=reduceGame(state,{type:'LIQUIDATE_SELECTED'});
  assert.equal(partial.debt!.id,10);assert.equal(partial.debt!.amount,240);assert.deepEqual(partial.debt!.selectedTileIds,[]);
  assert.equal(partial.properties[1],undefined);assert.ok(partial.properties[4]);assert.ok(partial.properties[14]);
});

test('timeout sells selected lots first, adds just enough fallback lots, stops once paid and never touches opponent property',()=>{
  const state=select(debt(150),[1]);state.properties[2]={ownerId:'player-3',level:5,mortgaged:false,business:'residence'};
  assert.deepEqual(liquidationPlan(state,true),[1,4]);assert.deepEqual(timeoutAction(state),{type:'AUTO_LIQUIDATE'});
  assert.deepEqual(chooseBotAction(state),{type:'AUTO_LIQUIDATE'});
  const paid=reduceGame(state,timeoutAction(state)!);
  assert.equal(paid.debt,null);assert.equal(paid.players[0].cash,110);assert.equal(paid.players[1].cash,1650);
  assert.equal(paid.properties[1],undefined);assert.equal(paid.properties[4],undefined);assert.ok(paid.properties[14]);assert.equal(paid.properties[2].ownerId,'player-3');
  assert.deepEqual(liquidationPlan(select(debt(150),[14,1]),true),[14,1]);
});

test('manual sale sells the entire confirmed selection; no selection uses deterministic cheapest sufficient lot',()=>{
  const chosen=reduceGame(select(debt(50),[1,4]),{type:'LIQUIDATE_SELECTED'});
  assert.equal(chosen.players[0].cash,210);assert.equal(chosen.properties[4],undefined);
  assert.deepEqual(liquidationPlan(debt(150),true),[4]);
  assert.deepEqual(liquidationPlan(debt(250),true),[14,1]);
  assert.ok(reduceGame(debt(),{type:'LIQUIDATE_SELECTED'}).error);
});

test('insolvency sells every asset at full value, pays the creditor what is available, then bankrupts without transferring free land',()=>{
  const state=debt(800);const done=reduceGame(state,{type:'AUTO_LIQUIDATE'});
  assert.equal(done.debt,null);assert.equal(done.players[0].bankrupt,true);assert.equal(done.players[0].cash,0);
  assert.equal(done.players[1].cash,1960);assert.deepEqual(done.properties,{});
  const manual=reduceGame(debt(800),{type:'DECLARE_BANKRUPTCY'});
  assert.equal(manual.players[1].cash,1960);assert.equal(manual.players[0].bankrupt,true);
  assert.ok(reduceGame(debt(100),{type:'DECLARE_BANKRUPTCY'}).error);
});

test('a non-current debtor sells their own assets and returns control without changing the current turn',()=>{
  const state=select(debt(150,'player-2'),[4]);const paid=reduceGame(state,{type:'LIQUIDATE_SELECTED'});
  assert.equal(paid.currentPlayer,0);assert.equal(paid.players[1].cash,50);assert.equal(paid.players[0].cash,1650);
  assert.equal(paid.properties[4],undefined);assert.equal(paid.debt,null);
});

test('settling one debt never automatically sells the next debtor assets from the queued payments',()=>{
  const state=select(debt(50),[1]);state.players[2].cash=0;
  state.properties[2]={ownerId:'player-3',level:1,mortgaged:false,business:'residence'};
  state.pendingPayments=[{fromId:'player-3',toId:null,amount:20,reason:'tax'}];
  const next=reduceGame(state,{type:'AUTO_LIQUIDATE'});
  assert.equal(next.debt!.debtorId,'player-3');assert.equal(next.debt!.amount,20);assert.notEqual(next.debt!.id,10);
  assert.deepEqual(next.debt!.selectedTileIds,[]);assert.equal(next.properties[2].ownerId,'player-3');
});

test('landing-rules snapshots without a liquidation marker still pay all remaining value before bankruptcy',()=>{
  const state=debt(1000);delete state.liquidationRules;
  state.players[0].cash=35;
  const total=liquidationPotential(state);
  const done=reduceGame(state,{type:'DECLARE_BANKRUPTCY'});
  assert.equal(done.error,null);
  assert.equal(done.players[1].cash,state.players[1].cash+total);
  assert.equal(done.players[0].cash,0);
  assert.equal(done.players[0].bankrupt,true);
  assert.deepEqual(done.properties,{});
  assert.equal(done.debt,null);
  assert.ok(done.log.some(entry=>entry.kind==='money'&&entry.message.includes(`trả ₫${total} cho B`)));
});

test('rent landing followed by insolvency pays initial cash and every remaining asset exactly once',()=>{
  for(const action of ['DECLARE_BANKRUPTCY','AUTO_LIQUIDATE'] as const){
    const state=debt();state.debt=null;state.phase='roll';
    state.propertyPricing='business-tour-v2';state.boardLayout='districts-v1';
    state.players[0].position=29;state.players[0].cash=10;
    state.properties[31]={ownerId:'player-2',level:5,mortgaged:false,business:'residence'};
    const assets=liquidationPotential({...state,debt:{debtorId:'player-1',creditorId:'player-2',amount:100000,reason:'rent'}});
    const landed=reduceGame(state,{type:'ROLL',dice:[1,1]});
    assert.equal(landed.debt?.creditorId,'player-2');
    assert.equal(landed.players[1].cash,1510);
    const paid=reduceGame(landed,{type:action});
    assert.equal(paid.error,null);
    assert.equal(paid.players[0].bankrupt,true);
    assert.equal(paid.players[1].cash,1500+assets);
    assert.equal(paid.players[2].cash,1500);
    assert.equal(paid.players[0].cash,0);
    assert.equal(paid.debt,null);
    assert.deepEqual(Object.keys(paid.properties),['31']);
    const repeated=reduceGame(paid,{type:'DECLARE_BANKRUPTCY'});
    assert.equal(repeated.players[1].cash,paid.players[1].cash);
  }
});

test('legacy bankruptcy pays remaining cash before clearing the debtor balance',()=>{
  const state=debt(1000);delete state.liquidationRules;delete state.propertyRules;
  state.properties={};state.players[0].cash=35;
  const done=reduceGame(state,{type:'DECLARE_BANKRUPTCY'});
  assert.equal(done.players[1].cash,1535);
  assert.equal(done.players[0].cash,0);
  assert.equal(done.players[0].bankrupt,true);
});
