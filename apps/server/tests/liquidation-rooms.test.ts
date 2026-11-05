import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {ClientMessage,RoomSnapshot} from '@typhu/contracts/multiplayer';
import type {RoomResponse} from '@typhu/contracts/http';
import {reduceGame} from '@typhu/game-engine';
import {HttpRoomService} from '../src/http-room-service';
import {MemoryRoomStore} from '../src/room-store';

function snapshot(response:RoomResponse):RoomSnapshot {
  const message=response.messages.find(message=>'room' in message);assert.ok(message && 'room' in message);return message.room;
}
async function setup() {
  let time=Date.now();const store=new MemoryRoomStore();
  const identities=Array.from({length:3},()=>({connectionId:randomUUID(),token:'',roomCode:''}));
  const send=async(index:number,message:ClientMessage|null,requestId=randomUUID())=>{
    const result=await new HttpRoomService(store,()=>time).handle({...identities[index],requestId,message});
    const session=result.messages.find(message=>message.type==='SESSION');
    if(session?.type==='SESSION') Object.assign(identities[index],{token:session.token,roomCode:session.room.code});
    return result;
  };
  await send(0,{type:'CREATE_ROOM',name:'A',maxPlayers:3,boardId:'vietnam-32'});
  for(let i=1;i<3;i++) {await send(i,{type:'JOIN_ROOM',name:String.fromCharCode(65+i),code:identities[0].roomCode});await send(i,{type:'SET_READY',ready:true});}
  await send(0,{type:'START_GAME'});
  const code=identities[0].roomCode,previous=(await store.read(code))!,saved=JSON.parse(previous),game=saved.room.game;
  assert.equal(game.liquidationRules,'full-value-v1');
  game.currentPlayer=0;game.startingPlayer=0;game.players[0].position=28;game.players[0].cash=50;
  for(const [id,level] of [[1,1],[4,0],[14,0]]) game.properties[id]={ownerId:'player-1',level,mortgaged:false,business:'residence'};
  // The first city (Huế) uses the cheap 60-value slot in the new price ladder.
  // Level 2 now rents for 200; preserve the 150 shortfall this scenario tests.
  game.properties[31]={ownerId:'player-2',level:2,mortgaged:false,business:'residence'};
  saved.room.game=reduceGame(game,{type:'ROLL',dice:[1,2]});delete saved.room.actionTimer;
  assert.equal(await store.compareAndSet(code,previous,JSON.stringify(saved)),true);
  const first=snapshot(await send(0,null));assert.equal(first.game!.debt!.amount,150);
  assert.equal(first.actionDeadlineAt!-first.actionStartsAt!,30000);
  return {store,send,code,identities,first,setTime:(value:number)=>{time=value;}};
}

test('only debtor selects their own lots; public clients cannot request auto-liquidation or mortgage and selections survive reconnect',async()=>{
  const {send,first,identities,setTime}=await setup();
  const rejected=await send(1,{type:'ACTION',action:{type:'SET_LIQUIDATION_SELECTION',tileIds:[1]}});
  assert.equal(rejected.messages[0].type,'ERROR');
  for(const action of [{type:'SET_LIQUIDATION_SELECTION',tileIds:[31]},{type:'AUTO_LIQUIDATE'},{type:'MORTGAGE',tileId:4}] as const) {
    const response=await send(0,{type:'ACTION',action} as unknown as ClientMessage);assert.equal(response.messages[0].type,'ERROR');
  }
  setTime(first.actionStartsAt!+10000);
  const selected=snapshot(await send(0,{type:'ACTION',action:{type:'SET_LIQUIDATION_SELECTION',tileIds:[1,14]}}));
  assert.deepEqual(selected.game!.debt!.selectedTileIds,[1,14]);assert.equal(selected.actionDeadlineAt,first.actionDeadlineAt);
  assert.deepEqual(snapshot(await send(1,null)).game!.debt!.selectedTileIds,[1,14]);
  identities[0].connectionId=randomUUID();
  const resumed=snapshot(await send(0,{type:'RECONNECT',token:identities[0].token}));
  assert.deepEqual(resumed.game!.debt!.selectedTileIds,[1,14]);assert.equal(resumed.actionDeadlineAt,first.actionDeadlineAt);
});

test('confirmed batch sells all selected lots and duplicate requests do not sell or pay twice',async()=>{
  const {send,first}=await setup();
  await send(0,{type:'ACTION',action:{type:'SET_LIQUIDATION_SELECTION',tileIds:[1,4]}});
  const requestId=randomUUID();
  const paid=snapshot(await send(0,{type:'ACTION',action:{type:'LIQUIDATE_SELECTED'}},requestId));
  const again=snapshot(await send(0,{type:'ACTION',action:{type:'LIQUIDATE_SELECTED'}},requestId));
  assert.equal(paid.game!.debt,null);assert.equal(paid.game!.players[0].cash,110);
  assert.equal(paid.game!.properties[1],undefined);assert.equal(paid.game!.properties[4],undefined);assert.ok(paid.game!.properties[14]);
  assert.equal(paid.game!.players[1].cash,first.game!.players[1].cash+150);
  assert.deepEqual(again.game!.players,paid.game!.players);
});

test('manual partial sale keeps the same 30-second deadline; racing timeout observers sell remaining lots once and keep surplus',async()=>{
  const {send,first,setTime,store,code}=await setup();
  await send(0,{type:'ACTION',action:{type:'SET_LIQUIDATION_SELECTION',tileIds:[1]}});
  setTime(first.actionStartsAt!+20000);
  const requestId=randomUUID();const partial=snapshot(await send(0,{type:'ACTION',action:{type:'LIQUIDATE_SELECTED'}},requestId));
  assert.equal(partial.game!.debt!.amount,90);assert.equal(partial.actionDeadlineAt,first.actionDeadlineAt);
  await send(0,{type:'ACTION',action:{type:'LIQUIDATE_SELECTED'}},requestId);
  setTime(first.actionDeadlineAt!);
  await Promise.all([send(0,null),send(1,null),send(2,null)]);
  const result=snapshot(await send(0,null));
  assert.equal(result.game!.debt,null);assert.equal(result.game!.properties[1],undefined);assert.equal(result.game!.properties[4],undefined);assert.ok(result.game!.properties[14]);
  assert.equal(result.game!.players[0].cash,110);assert.equal(result.game!.players[1].cash,1700);
  const saved=JSON.parse((await store.read(code))!);
  assert.equal(saved.room.game.log.filter((entry:{message:string;kind:string})=>entry.kind === 'property' && entry.message.includes('thanh lý')).length,2);
});

test('timeout honors selected priority before automatic fallback; a late selection cannot beat the deadline',async()=>{
  const {send,first,setTime}=await setup();
  await send(0,{type:'ACTION',action:{type:'SET_LIQUIDATION_SELECTION',tileIds:[1]}});
  setTime(first.actionDeadlineAt!);
  const late=await send(0,{type:'ACTION',action:{type:'SET_LIQUIDATION_SELECTION',tileIds:[14]}});
  assert.equal(late.messages[0].type,'ERROR');
  const result=snapshot(await send(1,null));
  assert.equal(result.game!.debt,null);assert.equal(result.game!.properties[1],undefined);assert.equal(result.game!.properties[4],undefined);assert.ok(result.game!.properties[14]);
  const sales=result.game!.log.filter(entry=>entry.kind === 'property' && entry.message.includes('thanh lý')).reverse();
  assert.match(sales[0].message,/Huế/);assert.match(sales[1].message,/Phú Quốc/);
});
