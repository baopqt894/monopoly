import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOARD, BOARD_32, DISTRICT_BOARD_32, MAP_TILES, DISTRICT_MAP_TILES, boardFor, getCard, buildingName, mapTilesFor} from '@typhu/game-content';
import {createGame, reduceGame, rentFor, ownsGroup, monopolyVictory} from '../src';

const fixture=()=>createGame({names:['A','B'],boardId:'vietnam-32',boardLayout:'districts-v1',propertyRules:'landing-v1',propertyPricing:'business-tour-v2',victoryRules:'business-tour-v1',eventTileCount:0,seed:7});
const halves=[['Huế','Đà Nẵng','Hội An'],['Sóc Trăng','Bạc Liêu','Cà Mau'],['Quy Nhơn','Nha Trang','Phan Thiết'],['Buôn Ma Thuột','Kon Tum'],['Châu Đốc','Cần Thơ'],['Ninh Bình','Hạ Long','Hải Phòng'],['Vinh','Đồng Hới'],['Hà Nội','TP. Hồ Chí Minh']];

test('whole districts fit 3-3 / 3-2 / 2-3 / 2-2 without crossing midpoint or corner',()=>{
 for(let half=0;half<8;half++) {
  const side=Math.floor(half/2), start=side*8+(half%2?5:1), stop=side*8+(half%2?8:4);
  const cities=DISTRICT_BOARD_32.slice(start,stop).filter(t=>t.kind==='street');
  assert.deepEqual(cities.map(t=>t.name),halves[half]);
  assert.equal(new Set(cities.map(t=>t.group)).size,1);
 }
 assert.equal(new Set(DISTRICT_BOARD_32.filter(t=>t.kind==='street').map(t=>t.group)).size,8);
 for(let id=0;id<32;id++)if(MAP_TILES[id].kind!=='city')assert.deepEqual(DISTRICT_MAP_TILES[id],MAP_TILES[id]);
});

test('group membership, model and landmark stay with their city while prices follow new travel order',()=>{
 for(const previous of BOARD_32.filter(t=>t.kind==='street')) {
  const moved=DISTRICT_BOARD_32.find(t=>t.name===previous.name)!;
  assert.equal(moved.group,previous.group);
  const art=DISTRICT_MAP_TILES[moved.id], oldArt=MAP_TILES[previous.id];
  assert.deepEqual({...art,price:oldArt.price},oldArt);
 }
 const state=fixture();assert.equal(boardFor(state),DISTRICT_BOARD_32);
 const restored=JSON.parse(JSON.stringify(state));assert.deepEqual(boardFor(restored),DISTRICT_BOARD_32);
 delete restored.boardLayout;assert.equal(boardFor(restored),BOARD_32);
 assert.equal(mapTilesFor(restored),MAP_TILES);
 assert.equal(boardFor(createGame()),BOARD);
 assert.throws(()=>createGame({boardLayout:'bad'} as never));
});

test('named travel cards and landmark labels resolve relocated destinations while old rooms keep their identities',()=>{
 for(const [id,name] of [['chance-03','Đà Nẵng'],['chance-04','Huế'],['chance-02','TP. Hồ Chí Minh'],['chance-14','Phú Quốc']] as const) {
  const state=fixture();state.phase='card';state.drawnCard={deck:'chance',cardId:id,revealed:true};
  const moved=reduceGame(state,{type:'RESOLVE_CARD'});
  assert.equal(moved.error,null);assert.equal(boardFor(moved)[moved.players[0].position].name,name);
 }
 assert.equal(buildingName(2,5,'vietnam-32','districts-v1'),'Cầu Rồng');
 assert.equal(buildingName(2,5,'vietnam-32'),'Nhà cổ Bình Thủy');
 assert.deepEqual(getCard('chance','chance-03','vietnam-32').effect,{type:'move',destination:17});
 assert.deepEqual(getCard('chance','chance-03','vietnam-32','districts-v1').effect,{type:'move',destination:2});
});

test('rent doubles only for complete original districts at their new locations, and monopoly wins use the new board',()=>{
 const state=fixture(), board=boardFor(state);
 for(const group of new Set(board.filter(t=>t.kind==='street').map(t=>t.group))) {
  const cities=board.filter(t=>t.group===group);
  state.properties={};
  for(const t of cities.slice(0,-1))state.properties[t.id]={ownerId:'player-2',level:2,mortgaged:false,business:'residence'};
  assert.equal(ownsGroup(state,cities[0],'player-2'),false);
  const last=cities.at(-1)!;state.properties[last.id]={ownerId:'player-2',level:2,mortgaged:false,business:'residence'};
  assert.equal(ownsGroup(state,last,'player-2'),true);
  for(const t of cities)assert.equal(rentFor(state,t.id),t.rents![2]*2);
 }
 state.properties={};
 for(const t of board.filter(t=>['red','pink','green'].includes(t.group??'')))state.properties[t.id]={ownerId:'player-2',level:1,mortgaged:false,business:'residence'};
 assert.equal(monopolyVictory(state,'player-2')?.reason,'triple-monopoly');
});
