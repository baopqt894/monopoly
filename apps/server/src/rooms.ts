import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import type { GameAction, GameMode, GameState, TradeOffer } from '@typhu/contracts';
import type { ClientMessage, RoomSeat, RoomSnapshot, ServerMessage, RoomChatMessage } from '@typhu/contracts/multiplayer';
import { createGame, reduceGame, finishIdleTurn, resolveMoneySettings, resolveEventSettings, resolveFestivalIncrement, resolveDepartureVictory, resolveMatchDuration } from '@typhu/game-engine';
import { advanceRoomBot } from './room-bots';
import { ACTION_TIME_MS, syncRoomTimer } from './room-timing';
import { drawPawnTokens } from './room-pawns';
import { syncMatchClock } from './room-match-clock';

interface Peer { id: string; send: (message: ServerMessage) => void; roomCode: string | null; seatId: string | null }
interface Seat extends RoomSeat { token: string; peerId: string | null; lastChatAt?: number }
export interface Room { lastMonopolyNoticeId?: number; durationMinutes?: 15 | 30 | 45 | 60; matchStartedAt?: number; matchDeadlineAt?: number; matchEndedAt?: number; chat?: RoomChatMessage[]; code: string; hostSeatId: string; mode: GameMode; maxPlayers: number; maxRounds: number; startingCash?: number; goSalary?: number; festivalIncrement?: 0.25 | 0.5; eventTileCount?: number; festivalTileCount?: number; boardId?: 'vietnam-32'; phase: RoomSnapshot['phase']; seats: Seat[]; game: GameState | null; pendingTrade: RoomSnapshot['pendingTrade']; updatedAt: number; botActionAt?: number; actionTimer?: { key: string; startsAt: number; expiresAt: number; movementId?: number; rollId?: number; revealId?: number; boardEventId?: number } }
const allowedActions = new Set(['ROLL','BUY','BUY_BACK','SKIP_PURCHASE','FLY','START_AUCTION','BID','PASS_BID','HOST_FESTIVAL','SKIP_FESTIVAL','DRAW_CARD','RESOLVE_CARD','END_TURN','BUILD','SET_LIQUIDATION_SELECTION','LIQUIDATE_SELECTED','SELL_BUILDING','MORTGAGE','UNMORTGAGE','PAY_BAIL','USE_JAIL_CARD','DECLARE_BANKRUPTCY']);

export function publicRoomSnapshot(room: Room): RoomSnapshot {
  const game = room.game ? structuredClone(room.game) : null;
  if (game) { game.seed=0;game.decks.chance=game.decks.chance.map(()=> 'hidden');game.decks.chest=game.decks.chest.map(()=> 'hidden');game.error=null; }
  if(game?.eventTileIds!==undefined) {game.festivalTileIds=[...game.eventTileIds];game.festivalTileCount=game.eventTileCount;}
  if (game?.drawnCard && !game.drawnCard.revealed) game.drawnCard.cardId = 'hidden';
  return { ...(room.durationMinutes !== undefined ? {durationMinutes:room.durationMinutes} : {}), ...(room.matchStartedAt !== undefined ? {matchStartedAt:room.matchStartedAt} : {}), ...(room.matchDeadlineAt !== undefined ? {matchDeadlineAt:room.matchDeadlineAt} : {}), ...(room.matchEndedAt !== undefined ? {matchEndedAt:room.matchEndedAt} : {}), code:room.code, hostSeatId:room.hostSeatId, mode:room.mode,maxPlayers:room.maxPlayers,maxRounds:room.maxRounds,startingCash:room.startingCash ?? 1500,goSalary:room.goSalary ?? 200,festivalIncrement:room.festivalIncrement ?? 0.5,eventTileCount:room.eventTileCount ?? room.festivalTileCount ?? 0,festivalTileCount:room.eventTileCount ?? room.festivalTileCount ?? 0,...(room.boardId ? {boardId:room.boardId} : {}),phase:room.phase,seats:room.seats.map(({id,name,connected,ready,gamePlayerId,bot})=>({id,name,connected,ready,gamePlayerId,...(bot?{bot:true}:{})})),game,pendingTrade:room.pendingTrade,...(room.chat ? {chat:structuredClone(room.chat)} : {}),...(room.botActionAt !== undefined ? {botActionAt:room.botActionAt} : {}),...(room.actionTimer ? {actionStartsAt:room.actionTimer.startsAt,actionDeadlineAt:room.actionTimer.expiresAt} : {}) };
}

export class RoomService {
  constructor(private now = () => Date.now(), private chooseStartingPlayer = (count: number) => randomInt(count)) {}
  readonly rooms = new Map<string, Room>();
  private readonly peers = new Map<string, Peer>();
  connect(send: Peer['send']): string { const id = randomUUID(); this.peers.set(id,{ id,send,roomCode:null,seatId:null }); return id; }
  disconnect(id: string) {
    const peer = this.peers.get(id); if (!peer) return;
    const room = this.rooms.get(peer.roomCode ?? ''); const seat = room?.seats.find((s)=>s.id===peer.seatId);
    if (room && seat && seat.peerId===id) { seat.peerId=null;seat.connected=false;room.updatedAt=Date.now();this.broadcast(room); }
    this.peers.delete(id);
  }
  private error(peer: Peer, message: string, code='INVALID_ACTION') { peer.send({type:'ERROR',code,message}); }
  private snapshot(room: Room): RoomSnapshot {
    syncMatchClock(room, this.now());
    syncRoomTimer(room, this.now());
    advanceRoomBot(room, this.now());
    syncRoomTimer(room, this.now(), false);
    if(room.game && !room.pendingTrade && (!room.actionTimer || this.now() >= room.actionTimer.startsAt)) {
      room.game=finishIdleTurn(room.game, room.seats.filter((seat)=>seat.connected && seat.gamePlayerId).map((seat)=>seat.gamePlayerId!));
      if(room.game.phase==='finished') room.phase='finished';
    }
    // Auto-ending an idle human can make a bot the next actor.
    if (room.botActionAt === undefined) advanceRoomBot(room, this.now());
    syncRoomTimer(room, this.now(), false);
    syncMatchClock(room, this.now());
    return publicRoomSnapshot(room);
  }
  private broadcast(room: Room) {
    room.updatedAt=Date.now(); const message:ServerMessage={type:'ROOM_STATE',room:this.snapshot(room)};for(const seat of room.seats){if(seat.peerId)this.peers.get(seat.peerId)?.send(message);}
  }
  private attach(peer: Peer, room: Room, seat: Seat) {
    if(seat.peerId && seat.peerId!==peer.id){const old=this.peers.get(seat.peerId);if(old){old.roomCode=null;old.seatId=null;this.error(old,'Phiên chơi đã được mở ở cửa sổ khác.','SESSION_REPLACED');}}
    peer.roomCode=room.code;peer.seatId=seat.id;seat.peerId=peer.id;seat.connected=true;
    peer.send({type:'SESSION',token:seat.token,seatId:seat.id,room:this.snapshot(room)});this.broadcast(room);
  }
  private name(value: unknown): string | null { return typeof value==='string' && value.trim().length>=1 && value.trim().length<=24 ? value.trim() : null; }
  handle(peerId: string, input: unknown) {
    const peer=this.peers.get(peerId);if(!peer)return;
    if(!input || typeof input!=='object' || !('type' in input)) {this.error(peer,'Yêu cầu không hợp lệ.');return;}
    const message=input as ClientMessage;
    if(message.type==='RECONNECT') {
      if(typeof message.token!=='string')return this.error(peer,'Phiên không hợp lệ.','SESSION_EXPIRED');
      for(const room of this.rooms.values()){const seat=room.seats.find((s)=>!s.bot&&s.token===message.token);if(seat){this.attach(peer,room,seat);return;}}
      return this.error(peer,'Phòng đã hết hạn hoặc máy chủ đã khởi động lại. Hãy tạo hoặc tham gia phòng mới.','SESSION_EXPIRED');
    }
    if(message.type==='CREATE_ROOM' || message.type==='JOIN_ROOM') {
      if(peer.roomCode)return this.error(peer,'Hãy rời phòng hiện tại trước.');
      const name=this.name(message.name);if(!name)return this.error(peer,'Tên cần có từ 1 đến 24 ký tự.');
      if(message.type==='CREATE_ROOM'){
        if(this.rooms.size>=100)return this.error(peer,'Máy chủ đang đầy phòng. Vui lòng thử lại sau.');
        if((message.mode !== undefined && message.mode !== 'classic')||![2,3,4].includes(message.maxPlayers))return this.error(peer,'Cài đặt phòng không hợp lệ.');
        let moneySettings: ReturnType<typeof resolveMoneySettings> & ReturnType<typeof resolveEventSettings> & ReturnType<typeof resolveFestivalIncrement> & ReturnType<typeof resolveMatchDuration>;
        try { moneySettings={...resolveMoneySettings(message),...resolveEventSettings(message),...resolveFestivalIncrement(message),...resolveMatchDuration(message)}; } catch (error) { return this.error(peer,error instanceof Error ? error.message : 'Cài đặt tiền không hợp lệ.'); }
        let code:string;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(this.rooms.has(code));
        const seat:Seat={id:randomUUID(),name,connected:true,ready:true,gamePlayerId:null,token:randomUUID(),peerId:peer.id};
        const room:Room={code,hostSeatId:seat.id,mode:'classic',maxPlayers:message.maxPlayers,maxRounds:12,...(message.boardId ? {boardId:message.boardId} : {}),...moneySettings,phase:'lobby',seats:[seat],game:null,pendingTrade:null,updatedAt:Date.now()};
        this.rooms.set(code,room);this.attach(peer,room,seat);return;
      }
      const room=this.rooms.get(typeof message.code==='string'?message.code.trim().toUpperCase():'');
      if(!room)return this.error(peer,'Không tìm thấy phòng. Kiểm tra lại mã 6 ký tự.','ROOM_NOT_FOUND');
      if(room.phase!=='lobby')return this.error(peer,'Ván đã bắt đầu. Bạn cần phiên cũ để kết nối lại.');
      if(room.seats.length>=room.maxPlayers)return this.error(peer,'Phòng đã đủ người.');
      if(room.seats.some((s)=>s.name.toLocaleLowerCase('vi')===name.toLocaleLowerCase('vi')))return this.error(peer,'Tên đã có trong phòng. Hãy chọn tên khác.');
      const seat:Seat={id:randomUUID(),name,connected:true,ready:false,gamePlayerId:null,token:randomUUID(),peerId:peer.id};
      room.seats.push(seat);this.attach(peer,room,seat);return;
    }
    const room=this.rooms.get(peer.roomCode??'');const seat=room?.seats.find((s)=>s.id===peer.seatId);
    if(!room||!seat||seat.peerId!==peer.id)return this.error(peer,'Bạn chưa ở trong phòng.');
    syncMatchClock(room, this.now());
    if(message.type==='CHAT'){
      if(seat.bot || typeof message.text !== 'string')return this.error(peer,'Tin nhắn không hợp lệ.','INVALID_CHAT');
      const text=message.text.trim().replace(/\s+/g,' ');
      if(!text || text.length>240 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))return this.error(peer,'Tin nhắn cần từ 1 đến 240 ký tự.','INVALID_CHAT');
      const now=this.now();
      if(seat.lastChatAt!==undefined && now-seat.lastChatAt<750)return this.error(peer,'Vui lòng chờ một chút trước khi gửi tiếp.','CHAT_RATE_LIMIT');
      seat.lastChatAt=now;
      room.chat=[...(room.chat??[]),{id:randomUUID(),seatId:seat.id,name:seat.name,text,createdAt:now}].slice(-50);
      this.broadcast(room);return;
    }
    if(message.type==='LEAVE_ROOM'){
      if(room.phase==='lobby'){
        room.seats=room.seats.filter((s)=>s.id!==seat.id);if(room.hostSeatId===seat.id&&room.seats.length){room.hostSeatId=room.seats[0].id;room.seats[0].ready=true;}
      }else{
        seat.connected=false;seat.peerId=null;seat.bot=true;seat.token=randomUUID();
        if(room.pendingTrade && [room.pendingTrade.offer.fromId,room.pendingTrade.offer.toId].includes(seat.gamePlayerId!))room.pendingTrade=null;
        if(room.hostSeatId===seat.id){const next=room.seats.find((s)=>!s.bot);if(next)room.hostSeatId=next.id;}
        if(room.game){
          room.game=resolveDepartureVictory(room.game,seat.gamePlayerId!);
          if(room.game.phase==='finished'){room.phase='finished';room.pendingTrade=null;delete room.botActionAt;delete room.actionTimer;}
          else {room.game.log.unshift({id:room.game.nextLogId++,round:room.game.round,message:`${seat.name} đã thoát phòng. Bot tiếp quản và chơi tiếp.`,kind:'info'});room.game.log=room.game.log.slice(0,120);}
        }
      }
      peer.roomCode=null;peer.seatId=null;peer.send({type:'LEFT_ROOM'});if(!room.seats.some((member)=>!member.bot)){room.pendingTrade=null;delete room.botActionAt;delete room.actionTimer;this.rooms.delete(room.code);}else this.broadcast(room);return;
    }
    if(message.type==='SET_READY'){
      if(room.phase!=='lobby'||typeof message.ready!=='boolean')return this.error(peer,'Không thể đổi trạng thái lúc này.');
      seat.ready=seat.id===room.hostSeatId?true:message.ready;this.broadcast(room);return;
    }
    if(message.type==='START_GAME'){
      if(room.hostSeatId!==seat.id)return this.error(peer,'Chỉ chủ phòng được bắt đầu ván.');
      if(room.phase!=='lobby'||room.seats.length<2||room.seats.some((s)=>!s.ready||!s.connected))return this.error(peer,'Cần ít nhất 2 người, tất cả đã kết nối và sẵn sàng.');
      room.game=createGame({boardId:room.boardId,...(room.boardId === 'vietnam-32' ? {boardLayout:'districts-v1' as const} : {}),names:room.seats.map((s)=>s.name),mode:room.mode,maxRounds:room.maxRounds,startingCash:room.startingCash,goSalary:room.goSalary,festivalIncrement:room.festivalIncrement,eventTileCount:room.eventTileCount ?? room.festivalTileCount,startingPlayer:this.chooseStartingPlayer(room.seats.length),propertyRules:'landing-v1',victoryRules:'business-tour-v1',liquidationRules:'full-value-v1',propertyPricing:room.boardId === 'vietnam-32' ? 'business-tour-v2' : 'level-one-included',seed:randomBytes(4).readUInt32BE()});
      const pawnTokens=drawPawnTokens(room.seats.length);
      room.seats.forEach((s,i)=>{s.gamePlayerId=room.game!.players[i].id;room.game!.players[i].token=pawnTokens[i];});room.phase='playing';
      if(room.durationMinutes !== undefined) { room.matchStartedAt=this.now();room.matchDeadlineAt=room.matchStartedAt+room.durationMinutes*60_000; }
      this.broadcast(room);return;
    }
    const state=room.game;if(!state||room.phase!=='playing')return this.error(peer,'Ván chơi chưa bắt đầu hoặc đã kết thúc.');
    if((message.type==='ACTION'||message.type==='PROPOSE_TRADE') && state.lastBoardEvent?.kind==='monopoly' && room.actionTimer?.boardEventId===state.lastBoardEvent.id && this.now()<room.actionTimer.startsAt) return this.error(peer,'Đợi thông báo MONOPOLY kết thúc.','PRESENTATION_PENDING');
    if(message.type==='PROPOSE_TRADE'){
      if(room.pendingTrade)return this.error(peer,'Đang có một đề nghị chưa được trả lời.');
      const offer=message.offer;
      if(!offer||offer.fromId!==seat.gamePlayerId||offer.fromId!==state.players[state.currentPlayer].id||!room.seats.some((s)=>s.gamePlayerId===offer.toId&&s.connected))return this.error(peer,'Đối tác không trực tuyến hoặc chưa đến lượt bạn.');
      const preview=reduceGame(state,{type:'TRADE',offer});if(preview.error)return this.error(peer,preview.error);
      room.pendingTrade={offer,expiresAt:this.now()+ACTION_TIME_MS};this.broadcast(room);return;
    }
    if(message.type==='RESPOND_TRADE'){
      const trade=room.pendingTrade;if(!trade||trade.offer.toId!==seat.gamePlayerId||typeof message.accept!=='boolean')return this.error(peer,'Đề nghị không dành cho bạn hoặc đã hết hạn.');
      if(message.accept){const result=reduceGame(state,{type:'TRADE',offer:trade.offer});if(result.error){room.pendingTrade=null;this.broadcast(room);return this.error(peer,result.error);}room.game=result;}
      room.pendingTrade=null;this.broadcast(room);return;
    }
    if(message.type==='CANCEL_TRADE'){
      if(room.pendingTrade?.offer.fromId!==seat.gamePlayerId)return this.error(peer,'Bạn không tạo đề nghị này.');
      room.pendingTrade=null;this.broadcast(room);return;
    }
    if(message.type==='ACTION'){
      const action=message.action;
      if(!action||typeof action!=='object'||!allowedActions.has(action.type))return this.error(peer,'Thao tác không được hỗ trợ.');
      if(room.pendingTrade)return this.error(peer,'Đợi đối tác trả lời hoặc hủy đề nghị trước.');
      if(action.type==='ROLL'&&'dice' in action)return this.error(peer,'Xúc xắc phải do máy chủ quyết định.');
      if('tileId' in action&&(!Number.isInteger(action.tileId)||action.tileId<0||action.tileId>=(state.boardId === 'vietnam-32' ? 32 : 40)))return this.error(peer,'Ô đất không hợp lệ.');
      const actorId=state.debt?.debtorId??(state.phase==='auction'&&state.auction?state.players[state.auction.bidderIndex].id:state.players[state.currentPlayer].id);
      if(seat.gamePlayerId!==actorId)return this.error(peer,'Chưa đến lượt thao tác của bạn.','NOT_YOUR_TURN');
      const result=reduceGame(state,action as GameAction);if(result.error)return this.error(peer,result.error);
      room.game=result;if(result.phase==='finished')room.phase='finished';this.broadcast(room);return;
    }
    this.error(peer,'Yêu cầu không được hỗ trợ.');
  }
  sweep(now=Date.now()) {
    for(const room of this.rooms.values()){
      if(!room.seats.some((seat)=>!seat.bot)){this.rooms.delete(room.code);continue;}
      const wasPlaying=room.phase==='playing';syncMatchClock(room,now);
      if(wasPlaying && room.phase==='finished')this.broadcast(room);
      if(!room.seats.some((s)=>s.connected)&&now-room.updatedAt>30*60*1000){this.rooms.delete(room.code);continue;}
      if(room.pendingTrade&&room.pendingTrade.expiresAt<=now){room.pendingTrade=null;this.broadcast(room);}
    }
  }
}
