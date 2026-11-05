import type { GameAction, GameMode, GameState, TradeOffer } from './index';

export interface RoomSeat { id: string; name: string; connected: boolean; ready: boolean; gamePlayerId: string | null; bot?: boolean }
export interface RoomChatMessage { id: string; seatId: string; name: string; text: string; createdAt: number }
export interface RoomSnapshot { durationMinutes?: 15 | 30 | 45 | 60; matchStartedAt?: number; matchDeadlineAt?: number; matchEndedAt?: number; code: string; hostSeatId: string; mode: GameMode; maxPlayers: number; maxRounds: number; startingCash?: number; goSalary?: number; festivalIncrement?: 0.25 | 0.5; eventTileCount?: number; festivalTileCount?: number; boardId?: 'vietnam-32'; phase: 'lobby' | 'playing' | 'finished'; seats: RoomSeat[]; game: GameState | null; chat?: RoomChatMessage[]; pendingTrade: { offer: TradeOffer; expiresAt: number } | null; revision?: number; botActionAt?: number; actionStartsAt?: number; actionDeadlineAt?: number }
export type ClientMessage =
  | { type: 'CHAT'; text: string }
  | { type: 'CREATE_ROOM'; durationMinutes?: 15 | 30 | 45 | 60; name: string; mode?: 'classic'; maxPlayers: number; maxRounds?: number; startingCash?: number; goSalary?: number; festivalIncrement?: 0.25 | 0.5; eventTileCount?: number; festivalTileCount?: number; boardId?: 'vietnam-32' }
  | { type: 'JOIN_ROOM'; name: string; code: string }
  | { type: 'RECONNECT'; token: string }
  | { type: 'SET_READY'; ready: boolean }
  | { type: 'START_GAME' }
  | { type: 'ACTION'; action: GameAction }
  | { type: 'PROPOSE_TRADE'; offer: TradeOffer }
  | { type: 'RESPOND_TRADE'; accept: boolean }
  | { type: 'CANCEL_TRADE' }
  | { type: 'LEAVE_ROOM' };
export type ServerMessage =
  | { type: 'SESSION'; token: string; seatId: string; room: RoomSnapshot }
  | { type: 'ROOM_STATE'; room: RoomSnapshot }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'LEFT_ROOM' };
