import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {ClientMessage,ServerMessage,RoomSnapshot} from '@typhu/contracts/multiplayer';
import {RoomService} from '../src/rooms';
import {HttpRoomService} from '../src/http-room-service';
import {MemoryRoomStore} from '../src/room-store';

function client(service:RoomService) {
  const messages:ServerMessage[]=[];const id=service.connect(message=>messages.push(structuredClone(message)));
  return {id,messages,session:()=>messages.find((m):m is Extract<ServerMessage,{type:'SESSION'}>=>m.type==='SESSION')!,latest:()=>messages.at(-1)!};
}
function snapshot(message:ServerMessage):RoomSnapshot {assert.ok('room' in message);return message.room;}
function started(count=3) {
  const service=new RoomService(undefined,()=>0),peers=Array.from({length:count},()=>client(service));
  service.handle(peers[0].id,{type:'CREATE_ROOM',name:'A',maxPlayers:4,boardId:'vietnam-32'});
  const code=peers[0].session().room.code;
  for(let i=1;i<count;i++) {service.handle(peers[i].id,{type:'JOIN_ROOM',name:String.fromCharCode(65+i),code});service.handle(peers[i].id,{type:'SET_READY',ready:true});}
  service.handle(peers[0].id,{type:'START_GAME',victoryRules:'none'});
  return {service,peers,room:service.rooms.get(code)!};
}

test('server forces victory rules, immediate resort win broadcasts exact winner/reason and clears all deadlines',()=>{
  const {service,peers,room}=started(2);assert.equal(room.game!.victoryRules,'business-tour-v1');
  for(const id of [4,14,18]) room.game!.properties[id]={ownerId:'player-1',level:0,mortgaged:false,business:'residence'};
  room.game!.phase='purchase';room.game!.players[0].position=25;room.game!.players[1].cash=99999;
  room.game!.propertyVisit={playerId:'player-1',tileId:25,ownerIdOnArrival:null,levelOnArrival:0};
  service.handle(peers[1].id,{type:'ACTION',action:{type:'BUY'}});assert.equal(peers[1].latest().type,'ERROR');
  service.handle(peers[0].id,{type:'ACTION',action:{type:'BUY'}});
  for(const peer of peers) {const state=snapshot(peer.latest());assert.equal(state.phase,'finished');assert.equal(state.game!.winnerId,'player-1');assert.equal(state.game!.winReason,'resort-monopoly');assert.equal(state.actionDeadlineAt,undefined);assert.equal(state.botActionAt,undefined);}
  service.handle(peers[0].id,{type:'ACTION',action:{type:'ROLL'}});assert.equal(peers[0].latest().type,'ERROR');
});

test('trade proposal/rejection never awards a preview win; only recipient acceptance transfers and finishes',()=>{
  const {service,peers,room}=started(2);
  for(const id of [25,26,27,29]) room.game!.properties[id]={ownerId:'player-2',level:0,mortgaged:false,business:'residence'};
  room.game!.properties[31]={ownerId:'player-1',level:0,mortgaged:false,business:'residence'};
  const offer={fromId:'player-1',toId:'player-2',giveTileId:31,takeTileId:null,giveCash:0,takeCash:0};
  service.handle(peers[0].id,{type:'PROPOSE_TRADE',offer});assert.ok(room.pendingTrade);assert.equal(room.phase,'playing');assert.equal(room.game!.winnerId,null);
  service.handle(peers[1].id,{type:'RESPOND_TRADE',accept:false});assert.equal(room.phase,'playing');assert.equal(room.game!.properties[31].ownerId,'player-1');
  service.handle(peers[0].id,{type:'PROPOSE_TRADE',offer});service.handle(peers[1].id,{type:'RESPOND_TRADE',accept:true});
  assert.equal(room.phase,'finished');assert.equal(room.game!.winnerId,'player-2');assert.equal(room.game!.winReason,'side-monopoly');assert.equal(room.pendingTrade,null);
});

test('voluntary departures finish for the last human, while disconnect/reconnect never count as departure',()=>{
  const {service,peers,room}=started();
  service.disconnect(peers[2].id);assert.equal(room.phase,'playing');assert.deepEqual(room.game!.departedPlayerIds,[]);
  const resumed=client(service);service.handle(resumed.id,{type:'RECONNECT',token:peers[2].session().token});assert.equal(room.phase,'playing');
  service.handle(peers[0].id,{type:'LEAVE_ROOM'});assert.equal(room.phase,'playing');assert.equal(room.seats[0].bot,true);
  assert.deepEqual(room.game!.departedPlayerIds,['player-1']);
  service.handle(peers[1].id,{type:'LEAVE_ROOM'});assert.equal(room.phase,'finished');assert.equal(room.game!.winnerId,'player-3');
  assert.equal(snapshot(resumed.latest()).game!.winReason,'accept-winnings');assert.equal(room.actionTimer,undefined);assert.equal(room.botActionAt,undefined);
  service.handle(resumed.id,{type:'ACCEPT_WINNINGS',winnerId:'player-1'});assert.equal(resumed.latest().type,'ERROR');assert.equal(room.game!.winnerId,'player-3');
});

test('simultaneous HTTP departures persist one last-human winner across instances and duplicate requests',async()=>{
  const store=new MemoryRoomStore();
  const identities=Array.from({length:3},()=>({connectionId:randomUUID(),token:'',roomCode:''}));
  const send=async(index:number,message:ClientMessage|null,requestId=randomUUID())=>{
    const identity=identities[index];
    const response=await new HttpRoomService(store).handle({...identity,requestId,message});
    const session=response.messages.find(m=>m.type==='SESSION');if(session?.type==='SESSION') Object.assign(identity,{token:session.token,roomCode:session.room.code});
    return response;
  };
  await send(0,{type:'CREATE_ROOM',name:'A',maxPlayers:3,boardId:'vietnam-32'});
  for(let i=1;i<3;i++){await send(i,{type:'JOIN_ROOM',code:identities[0].roomCode,name:String.fromCharCode(65+i)});await send(i,{type:'SET_READY',ready:true});}
  await send(0,{type:'START_GAME'});
  const requestId=randomUUID();await Promise.all([send(1,{type:'LEAVE_ROOM'},requestId),send(2,{type:'LEAVE_ROOM'})]);
  assert.equal((await send(1,{type:'LEAVE_ROOM'},requestId)).messages[0].type,'LEFT_ROOM');
  const response=await send(0,null),message=response.messages.find(m=>'room' in m)!;
  const publicState=snapshot(message);assert.equal(publicState.phase,'finished');assert.equal(publicState.game!.winnerId,'player-1');assert.equal(publicState.game!.winReason,'accept-winnings');
  const stored=JSON.parse((await store.read(identities[0].roomCode))!);
  assert.deepEqual(new Set(stored.room.game.departedPlayerIds),new Set(['player-2','player-3']));
  assert.equal(stored.room.game.log.filter((entry:{message:string})=>entry.message.includes('Accept Winnings')).length,1);
  const replacement={...identities[0],connectionId:randomUUID(),requestId:randomUUID(),message:{type:'RECONNECT',token:identities[0].token} as const};
  const resumed=await new HttpRoomService(store).handle(replacement);assert.equal(snapshot(resumed.messages.find(m=>'room' in m)!).game!.winnerId,'player-1');
});
