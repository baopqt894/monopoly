import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RoomSnapshot, ServerMessage } from '@typhu/contracts/multiplayer';
import { RoomService } from '../src/rooms';
import { reduceGame } from '@typhu/game-engine';

function client(service:RoomService){const messages:ServerMessage[]=[];const id=service.connect((message)=>messages.push(structuredClone(message)));return {id,messages,session:()=>messages.find((m):m is Extract<ServerMessage,{type:'SESSION'}>=>m.type==='SESSION')!,latest:()=>messages.at(-1)!};}
function setup(){const service=new RoomService(undefined,()=>0);const host=client(service),guest=client(service);service.handle(host.id,{type:'CREATE_ROOM',name:'An',mode:'classic',maxPlayers:4,maxRounds:8});const code=host.session().room.code;service.handle(guest.id,{type:'JOIN_ROOM',name:'Bình',code});return {service,host,guest,code};}
function started(){const result=setup();result.service.handle(result.guest.id,{type:'SET_READY',ready:true});result.service.handle(result.host.id,{type:'START_GAME'});return result;}
function snapshot(message:ServerMessage):RoomSnapshot {assert.ok(message.type==='ROOM_STATE'||message.type==='SESSION');return message.room;}

test('landing rules are server-selected, rent precedes takeover, and clients cannot override price or build remotely', () => {
  const { service, host, guest, code } = started();
  const room = service.rooms.get(code)!;
  assert.equal(room.game!.propertyRules, 'landing-v1');
  room.game!.players[0].position = 1;
  room.game!.properties[3] = { ownerId: 'player-2', level: 2, mortgaged: false, business: 'residence' };
  room.game = reduceGame(room.game!, { type: 'ROLL', dice: [1, 1] });
  assert.equal(room.game!.players[0].cash, 1440);
  service.handle(guest.id, { type: 'ACTION', action: { type: 'BUY_BACK', tileId: 3 } });
  assert.equal(guest.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'BUY_BACK', tileId: 3, amount: 1 } });
  assert.equal(room.game!.players[0].cash, 1275); assert.equal(room.game!.players[1].cash, 1725);
  assert.equal(room.game!.properties[3].ownerId, 'player-1');
  service.handle(host.id, { type: 'ACTION', action: { type: 'BUILD', tileId: 3, level: 3 } });
  assert.equal(room.game!.properties[3].level, 3); assert.equal(room.game!.players[0].cash, 1225);
  room.game!.properties[1] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  service.handle(host.id, { type: 'ACTION', action: { type: 'BUILD', tileId: 1 } });
  assert.equal(host.latest().type, 'ERROR'); assert.equal(room.game!.properties[1].level, 1);
  service.handle(host.id, { type: 'ACTION', action: { type: 'EARTHQUAKE', tileId: 3 } });
  assert.equal(host.latest().type, 'ERROR'); assert.equal(room.game!.properties[3].level, 3);
});

test('only a revealed server-held event can attack, with landmark protection and actor validation', () => {
  const { service, host, guest, code } = started();
  const room = service.rooms.get(code)!;
  room.game!.phase = 'card';
  room.game!.drawnCard = { deck: 'chance', cardId: 'chance-17', revealed: true };
  room.game!.properties[3] = { ownerId: 'player-2', level: 5, mortgaged: false, business: 'residence' };
  service.handle(guest.id, { type: 'ACTION', action: { type: 'RESOLVE_CARD', targetTileId: 3 } });
  assert.equal(guest.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'RESOLVE_CARD', targetTileId: 3 } });
  assert.equal(host.latest().type, 'ERROR'); assert.equal(room.game!.properties[3].level, 5);
  assert.equal(room.game!.drawnCard!.cardId, 'chance-17');
  room.game!.drawnCard = { deck: 'chance', cardId: 'chance-20', revealed: false };
  service.handle(host.id, { type: 'ACTION', action: { type: 'RESOLVE_CARD', targetTileId: 3 } });
  assert.equal(host.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'DRAW_CARD' } });
  service.handle(host.id, { type: 'ACTION', action: { type: 'RESOLVE_CARD', targetTileId: 3 } });
  assert.equal(room.game!.properties[3].disabledLaps, 3); assert.equal(room.game!.properties[3].level, 5);
});

test('server draws one starting seat, keeps the roster stable, then follows clockwise order across reconnect', () => {
  let draws = 0;
  const service = new RoomService(() => 1000, (count) => { assert.equal(count, 4); draws++; return 2; });
  const peers = Array.from({ length: 4 }, () => client(service));
  const names = ['An', 'Bình', 'Chi', 'Dũng'];
  service.handle(peers[0].id, { type: 'CREATE_ROOM', name: names[0], maxPlayers: 4 });
  const code = peers[0].session().room.code;
  for (let i = 1; i < peers.length; i++) {
    service.handle(peers[i].id, { type: 'JOIN_ROOM', name: names[i], code });
    service.handle(peers[i].id, { type: 'SET_READY', ready: true });
  }
  // An extra client field must never choose the starting player.
  service.handle(peers[0].id, { type: 'START_GAME', startingPlayer: 0 });
  const first = snapshot(peers[0].latest()).game!;
  assert.equal(first.currentPlayer, 2); assert.equal(first.startingPlayer, 2);
  assert.deepEqual(first.players.map((p) => p.name), names);
  assert.deepEqual(peers.map((p) => p.session().seatId), snapshot(peers[0].latest()).seats.map((s) => s.id));
  assert.ok(peers.every((p) => snapshot(p.latest()).game!.currentPlayer === 2));
  service.handle(peers[0].id, { type: 'ACTION', action: { type: 'ROLL' } });
  assert.equal(peers[0].latest().type, 'ERROR');
  for (const next of [3, 0, 1, 2]) {
    const game = service.rooms.get(code)!.game!;
    game.phase = 'end';
    service.handle(peers[game.currentPlayer].id, { type: 'ACTION', action: { type: 'END_TURN' } });
    assert.equal(snapshot(peers[next].latest()).game!.currentPlayer, next);
  }
  assert.equal(service.rooms.get(code)!.game!.round, 2);
  const resumed = client(service);
  service.handle(resumed.id, { type: 'RECONNECT', token: peers[2].session().token });
  assert.equal(snapshot(resumed.latest()).game!.currentPlayer, 2);
  assert.equal(snapshot(resumed.latest()).game!.startingPlayer, 2);
  service.handle(peers[0].id, { type: 'START_GAME' });
  assert.equal(peers[0].latest().type, 'ERROR');
  assert.equal(draws, 1);
});

test('new travel actions are actor-validated, card reveal is shared and unrevealed cards stay private', () => {
  const { service, host, guest, code } = started();
  const room = service.rooms.get(code)!;
  room.game!.phase = 'card'; room.game!.drawnCard = { deck: 'chance', cardId: 'chance-08', revealed: false };
  service.handle(host.id, { type: 'RECONNECT', token: host.session().token });
  assert.equal(snapshot(host.latest()).game!.drawnCard!.cardId, 'hidden');
  service.handle(guest.id, { type: 'ACTION', action: { type: 'DRAW_CARD' } });
  assert.equal(guest.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'RESOLVE_CARD' } });
  assert.equal(host.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'DRAW_CARD' } });
  assert.equal(snapshot(guest.latest()).game!.drawnCard!.cardId, 'chance-08');
  assert.equal(snapshot(guest.latest()).game!.players[0].cash, 1500);
  service.handle(host.id, { type: 'ACTION', action: { type: 'RESOLVE_CARD' } });
  assert.equal(snapshot(guest.latest()).game!.players[0].cash, 1550);
  room.game!.phase = 'roll'; room.game!.players[0].flight = 'ready';
  service.handle(guest.id, { type: 'ACTION', action: { type: 'FLY', tileId: 3 } });
  assert.equal(guest.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'FLY', tileId: 3 } });
  assert.equal(snapshot(guest.latest()).game!.phase, 'purchase');
  assert.deepEqual(snapshot(guest.latest()).game!.movement!.path, [1,2,3]);
  service.handle(guest.id, { type: 'ACTION', action: { type: 'SKIP_PURCHASE' } });
  assert.equal(guest.latest().type, 'ERROR');
  service.handle(host.id, { type: 'ACTION', action: { type: 'SKIP_PURCHASE' } });
  assert.equal(snapshot(guest.latest()).game!.phase, 'roll');
  assert.equal(snapshot(guest.latest()).game!.currentPlayer, 0);
  assert.equal(snapshot(guest.latest()).game!.properties[3], undefined);
});

test('creates a six-character room and joins with distinct private identities',()=>{const {host,guest,code}=setup();assert.match(code,/^[0-9A-F]{6}$/);assert.notEqual(host.session().token,guest.session().token);const room=snapshot(host.latest());assert.equal(room.seats.length,2);assert.equal(room.seats[0].ready,true);assert.equal(room.seats[1].ready,false);});
test('unknown codes, duplicate names, invalid room settings and excess guests are rejected',()=>{
  const {service,host,code}=setup();const third=client(service);service.handle(third.id,{type:'JOIN_ROOM',name:'An',code});assert.equal(third.latest().type,'ERROR');service.handle(third.id,{type:'JOIN_ROOM',name:'Cường',code:'FFFFFFX'});assert.equal(third.latest().type,'ERROR');
  const invalid=client(service);service.handle(invalid.id,{type:'CREATE_ROOM',name:'Mai',mode:'wrong',maxPlayers:9,maxRounds:0});assert.equal(invalid.latest().type,'ERROR');
  const tiny=client(service);service.handle(tiny.id,{type:'CREATE_ROOM',name:'Linh',mode:'classic',maxPlayers:2,maxRounds:12});const tinyCode=tiny.session().room.code;const second=client(service);service.handle(second.id,{type:'JOIN_ROOM',name:'Nam',code:tinyCode});service.handle(third.id,{type:'JOIN_ROOM',name:'Cường',code:tinyCode});assert.equal(third.latest().type,'ERROR');assert.equal(snapshot(host.latest()).seats.length,2);
});
test('only the host can start and all guests must be ready and connected',()=>{const {service,host,guest}=setup();service.handle(guest.id,{type:'START_GAME'});assert.equal(guest.latest().type,'ERROR');service.handle(host.id,{type:'START_GAME'});assert.equal(host.latest().type,'ERROR');service.handle(guest.id,{type:'SET_READY',ready:true});service.handle(host.id,{type:'START_GAME'});assert.equal(snapshot(host.latest()).phase,'playing');assert.equal(snapshot(guest.latest()).game!.players.length,2);});
test('server blocks another seat acting out of turn and rejects client-specified dice',()=>{const {service,host,guest}=started();service.handle(guest.id,{type:'ACTION',action:{type:'ROLL'}});assert.equal(guest.latest().type,'ERROR');service.handle(host.id,{type:'ACTION',action:{type:'ROLL',dice:[6,6]}});assert.equal(host.latest().type,'ERROR');service.handle(host.id,{type:'ACTION',action:{type:'ROLL'}});const room=snapshot(host.latest());assert.ok(room.game!.dice.every((die)=>die>=1&&die<=6));assert.deepEqual(room,snapshot(guest.latest()));});
test('public snapshots conceal PRNG seed, deck order, reconnect tokens and peer IDs',()=>{const {host}=started();const room=snapshot(host.latest());assert.equal(room.game!.seed,0);assert.ok(room.game!.decks.chance.every((id)=>id==='hidden'));assert.ok(room.game!.decks.chest.every((id)=>id==='hidden'));const serialized=JSON.stringify(room);assert.ok(!serialized.includes(host.session().token));assert.ok(!serialized.includes('peerId'));assert.ok(room.seats.every((seat)=>!('token' in seat)));});
test('reconnect restores the same seat and state without creating a duplicate player',()=>{const {service,host,guest}=started();const token=guest.session().token;service.disconnect(guest.id);assert.equal(snapshot(host.latest()).seats[1].connected,false);const resumed=client(service);service.handle(resumed.id,{type:'RECONNECT',token});const room=snapshot(resumed.latest());assert.equal(room.seats.length,2);assert.equal(room.seats[1].id,guest.session().seatId);assert.equal(room.seats[1].connected,true);assert.equal(room.phase,'playing');assert.deepEqual(room.game,snapshot(host.latest()).game);});
test('replacing a connection revokes its old ability to act and old disconnect cannot evict the new connection',()=>{const {service,host}=started();const replacement=client(service);service.handle(replacement.id,{type:'RECONNECT',token:host.session().token});assert.equal(host.latest().type,'ERROR');service.handle(host.id,{type:'ACTION',action:{type:'ROLL'}});assert.equal(host.latest().type,'ERROR');service.disconnect(host.id);assert.equal(snapshot(replacement.latest()).seats[0].connected,true);});
test('online trades require approval from the recipient and block turn advancement while pending',()=>{const {service,host,guest,code}=started();const offer={fromId:'player-1',toId:'player-2',giveTileId:null,takeTileId:null,giveCash:100,takeCash:0};service.handle(host.id,{type:'PROPOSE_TRADE',offer});assert.ok(snapshot(host.latest()).pendingTrade);assert.equal(snapshot(host.latest()).game!.players[0].cash,1500);service.handle(host.id,{type:'RESPOND_TRADE',accept:true});assert.equal(host.latest().type,'ERROR');service.handle(host.id,{type:'ACTION',action:{type:'ROLL'}});assert.equal(host.latest().type,'ERROR');service.handle(guest.id,{type:'RESPOND_TRADE',accept:true});const room=snapshot(guest.latest());assert.equal(room.pendingTrade,null);assert.equal(room.game!.players[0].cash,1400);assert.equal(room.game!.players[1].cash,1600);assert.equal(service.rooms.get(code)!.game!.players[0].cash,1400);});
test('trade rejection and expiry preserve all balances; unsolicited TRADE action cannot bypass approval',()=>{const {service,host,guest}=started();const offer={fromId:'player-1',toId:'player-2',giveTileId:null,takeTileId:null,giveCash:100,takeCash:0};service.handle(host.id,{type:'ACTION',action:{type:'TRADE',offer}});assert.equal(host.latest().type,'ERROR');service.handle(host.id,{type:'PROPOSE_TRADE',offer});service.handle(guest.id,{type:'RESPOND_TRADE',accept:false});assert.equal(snapshot(host.latest()).game!.players[0].cash,1500);service.handle(host.id,{type:'PROPOSE_TRADE',offer});service.sweep(Date.now()+46000);assert.equal(snapshot(host.latest()).pendingTrade,null);assert.equal(snapshot(host.latest()).game!.players[1].cash,1500);});
test('leaving the waiting room frees the seat and passes host ownership',()=>{const {service,host,guest}=setup();service.handle(host.id,{type:'LEAVE_ROOM'});assert.equal(host.latest().type,'LEFT_ROOM');const room=snapshot(guest.latest());assert.equal(room.seats.length,1);assert.equal(room.hostSeatId,guest.session().seatId);assert.equal(room.seats[0].ready,true);});
test('offline rooms expire after 30 minutes and old reconnect tokens fail cleanly',()=>{const {service,host,guest}=setup();service.disconnect(host.id);service.disconnect(guest.id);service.sweep(Date.now()+31*60*1000);assert.equal(service.rooms.size,0);const late=client(service);service.handle(late.id,{type:'RECONNECT',token:host.session().token});assert.equal(late.latest().type,'ERROR');});


test('server rejects tax flights, charges its own fare and rejects foreign actors and duplicate flight', () => {
  const {service,host,guest,code} = started(); const room = service.rooms.get(code)!;
  room.game!.players[0].position = 30; room.game!.players[0].flight = 'ready';
  room.game!.properties[39] = {ownerId:'player-1',level:0,mortgaged:true,business:'residence'};
  service.handle(guest.id,{type:'ACTION',action:{type:'FLY',tileId:4}});
  assert.equal(guest.latest().type,'ERROR'); assert.equal(room.game!.players[0].cash,1500);
  service.handle(host.id,{type:'ACTION',action:{type:'FLY',tileId:4,fee:0,tax:0,goSalary:99999}});
  assert.equal(host.latest().type,'ERROR'); assert.equal(room.game!.players[0].cash,1500);
  assert.equal(room.game!.players[0].flight,'ready'); assert.equal(room.game!.players[0].position,30);
  service.handle(host.id,{type:'ACTION',action:{type:'FLY',tileId:3,fee:0,tax:0,goSalary:99999}});
  assert.equal(room.game!.players[0].cash,1650); // 1500 - authoritative 50 fare + authoritative 200 GO
  assert.equal(room.game!.players[0].completedLaps,1);
  service.handle(host.id,{type:'ACTION',action:{type:'FLY',tileId:3}});
  assert.equal(host.latest().type,'ERROR'); assert.equal(room.game!.players[0].cash,1650);
});

test('clients cannot forge the internal airport timeout to bypass mandatory flight', () => {
  const {service,host,code} = started();
  const room = service.rooms.get(code)!;
  room.game!.players[0].flight = 'ready';
  room.game!.players[0].position = 30;
  const before = structuredClone(room.game);
  service.handle(host.id, {type:'ACTION', action:{type:'SKIP_FLIGHT'}});
  assert.equal(host.latest().type, 'ERROR');
  assert.deepEqual(room.game, before);
});
