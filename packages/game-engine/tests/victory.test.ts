import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GameState } from '@typhu/contracts';
import { BOARD_32, boardFor } from '@typhu/game-content';
import { createGame, reduceGame, monopolyVictory, resolveDepartureVictory, gameOutcome, chooseBotAction, timeoutAction } from '../src';

const game = () => createGame({names:['An','Bình','Chi'],boardId:'vietnam-32',propertyRules:'landing-v1',victoryRules:'business-tour-v1',seed:123});
function own(state:GameState, ids:readonly number[], ownerId='player-1', level=1) {
  for(const id of ids) state.properties[id]={ownerId,level,mortgaged:false,business:'residence'};
}
const groups = ['brown','orange','yellow'];
const tripleIds = BOARD_32.filter(tile => tile.group && groups.includes(tile.group)).map(tile => tile.id);
const sideIds = BOARD_32.filter(tile => tile.price !== undefined && tile.id>24).map(tile => tile.id);
function landPurchase(state:GameState,id:number) {
  state.players[state.currentPlayer].position=id;state.phase='purchase';
  state.propertyVisit={playerId:state.players[state.currentPlayer].id,tileId:id,ownerIdOnArrival:null,levelOnArrival:0};
}

test('Triple Monopoly needs three COMPLETE color groups, not three individual lots or one triple-size group',()=>{
  const state=game();own(state,[23,26,27]);
  assert.equal(monopolyVictory(state,'player-1'),null);
  state.properties={};
  own(state,tripleIds.slice(0,-1)); assert.equal(monopolyVictory(state,'player-1'),null);
  own(state,tripleIds);assert.deepEqual(monopolyVictory(state,'player-1'),{winnerId:'player-1',reason:'triple-monopoly'});
});

test('Side Monopoly checks all city lots on one side, including its resort, independently of house levels and outages',()=>{
  const state=game();own(state,sideIds.slice(0,-1));
  assert.equal(monopolyVictory(state,'player-1'),null);
  own(state,sideIds, 'player-1',0);state.properties[26].mortgaged=true;state.properties[27].disabledLaps=3;
  delete state.properties[25];
  assert.equal(monopolyVictory(state,'player-1'),null);
  own(state,[25],'player-1',0);
  assert.deepEqual(monopolyVictory(state,'player-1'),{winnerId:'player-1',reason:'side-monopoly'});
});

test('each of the four sides is detected using its own board positions',()=>{
  for(const boardId of [undefined,'vietnam-32'] as const) for(let side=0;side<4;side++) {
    const state=createGame({names:['A','B'],boardId,victoryRules:'business-tour-v1'});
    const board=boardFor(state),ids=board.filter(tile=>tile.price!==undefined && Math.floor(tile.id/(board.length/4))===side).map(tile=>tile.id);
    own(state,ids);assert.equal(monopolyVictory(state,'player-1')!.reason,'side-monopoly');
  }
});

test('Resort Monopoly requires exactly the four resorts; four arbitrary lots or legacy railroads do not count',()=>{
  const state=game();own(state,[4,14,18],'player-1',0);assert.equal(monopolyVictory(state,'player-1'),null);
  own(state,[25],'player-1',0);assert.equal(monopolyVictory(state,'player-1')!.reason,'resort-monopoly');
  const legacy=createGame({victoryRules:'business-tour-v1'});own(legacy,[5,15,25,35]);assert.equal(monopolyVictory(legacy,'player-1'),null);
});

test('last resort purchase ends immediately, names the actual owner rather than the richest player and freezes further actions',()=>{
  const state=game();own(state,[4,14,18],'player-1',0);state.players[1].cash=99999;landPurchase(state,25);
  const won=reduceGame(state,{type:'BUY'});
  assert.equal(won.phase,'finished');assert.equal(won.winnerId,'player-1');assert.equal(won.winReason,'resort-monopoly');
  assert.equal(won.players[0].cash,1300);assert.equal(state.properties[25],undefined);
  assert.deepEqual(reduceGame(won,{type:'ROLL'}),won);assert.equal(chooseBotAction(won),null);assert.equal(timeoutAction(won),null);
  const result=gameOutcome(won);assert.equal(result.ranked[0].id,'player-1');assert.deepEqual(result.leaders.map(p=>p.id),['player-1']);
});

test('BUY and forced BUY_BACK can each complete Side and Triple Monopoly immediately after paying the actual costs',()=>{
  for(const [ids,reason] of [[sideIds,'side-monopoly'],[tripleIds,'triple-monopoly']] as const) {
    const last=ids.at(-1)!;
    const purchase=game();own(purchase,ids.slice(0,-1));landPurchase(purchase,last);
    assert.equal(reduceGame(purchase,{type:'BUY'}).winReason,reason);
    const takeover=game();own(takeover,ids.slice(0,-1));own(takeover,[last],'player-2');
    takeover.players[0].position=last;takeover.phase='end';
    takeover.propertyVisit={playerId:'player-1',tileId:last,ownerIdOnArrival:'player-2',levelOnArrival:1};
    const won=reduceGame(takeover,{type:'BUY_BACK',tileId:last});
    assert.equal(won.winReason,reason);assert.equal(won.winnerId,'player-1');
    assert.equal(won.properties[last].ownerId,'player-1');assert.ok(won.players[1].cash>1500);
  }
});

test('only accepted TRADE ends the game; a non-current recipient may win',()=>{
  const state=game();own(state,sideIds.slice(0,-1),'player-2',0);own(state,[sideIds.at(-1)!],'player-1',0);
  const won=reduceGame(state,{type:'TRADE',offer:{fromId:'player-1',toId:'player-2',giveTileId:sideIds.at(-1)!,takeTileId:null,giveCash:0,takeCash:0}});
  assert.equal(won.error,null);assert.equal(won.winReason,'side-monopoly');assert.equal(won.winnerId,'player-2');
});

test('invalid purchases or events cannot trigger victory or mutate previous ownership',()=>{
  const state=game();own(state,[4,14,18],'player-1',0);landPurchase(state,25);state.players[0].cash=199;
  const failed=reduceGame(state,{type:'BUY'});assert.ok(failed.error);assert.notEqual(failed.phase,'finished');assert.equal(failed.winnerId,null);
  own(state,[25]);state.players[0].bankrupt=true;assert.equal(monopolyVictory(state,'player-1'),null);
});

test('bankruptcy liquidation pays the creditor without gifting a resort monopoly',()=>{
  const state=game();own(state,[4,14,18],'player-2',0);own(state,[25],'player-1',0);state.players[0].cash=0;
  state.debt={debtorId:'player-1',creditorId:'player-2',amount:500,reason:'rent'};
  const won=reduceGame(state,{type:'DECLARE_BANKRUPTCY'});
  assert.equal(won.players[0].bankrupt,true);assert.equal(won.players[2].bankrupt,false);
  assert.equal(won.players[1].cash,1700);assert.equal(won.properties[25],undefined);
  assert.equal(won.winnerId,null);assert.notEqual(won.phase,'finished');
});

test('last solvent survivor wins by bankruptcy, not the largest historical fortune',()=>{
  const state=game();state.players[0].bankrupt=true;state.players[1].cash=0;state.currentPlayer=1;
  state.debt={debtorId:'player-2',creditorId:'player-3',amount:999,reason:'rent'};
  const won=reduceGame(state,{type:'DECLARE_BANKRUPTCY'});
  assert.equal(won.winnerId,'player-3');assert.equal(won.winReason,'bankruptcy');
});

test('Accept Winnings records voluntary departures, permits bots until last human, persists exact winner and is idempotent',()=>{
  const state=game();const first=resolveDepartureVictory(state,'player-1');
  assert.equal(first.phase,'roll');assert.deepEqual(first.departedPlayerIds,['player-1']);assert.deepEqual(state.departedPlayerIds,[]);
  const duplicate=resolveDepartureVictory(first,'player-1');assert.deepEqual(duplicate.departedPlayerIds,['player-1']);
  const won=resolveDepartureVictory(duplicate,'player-2');assert.equal(won.phase,'finished');assert.equal(won.winnerId,'player-3');
  assert.equal(won.winReason,'accept-winnings');assert.deepEqual(resolveDepartureVictory(won,'player-3'),won);
});

test('bankruptcy of a remaining human also grants Accept Winnings when every solvent opponent has left',()=>{
  let state=resolveDepartureVictory(game(),'player-1');state.currentPlayer=1;state.players[1].cash=0;
  state.debt={debtorId:'player-2',creditorId:null,amount:999,reason:'tax'};
  state=reduceGame(state,{type:'DECLARE_BANKRUPTCY'});
  assert.equal(state.winnerId,'player-3');assert.equal(state.winReason,'accept-winnings');
});

test('legacy saves retain old victory/departure policy and capital ties',()=>{
  const state=game();delete state.victoryRules;own(state,[4,14,18,25],'player-1',0);
  assert.equal(monopolyVictory(state,'player-1'),null);assert.equal(resolveDepartureVictory(state,'player-2'),state);
  const won=reduceGame(state,{type:'ROLL',dice:[1,2]});assert.notEqual(won.phase,'finished');
  const tied=createGame({names:['A','B']});tied.phase='finished';tied.winnerId='player-1';
  assert.deepEqual(gameOutcome(tied).leaders.map(p=>p.id),['player-1','player-2']);
  assert.throws(()=>createGame({victoryRules:'bad'} as never));
});
