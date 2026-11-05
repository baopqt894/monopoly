import type { ClientMessage, ServerMessage } from './multiplayer';

export interface RoomRequest {
  connectionId: string;
  requestId: string;
  roomCode?: string;
  token?: string;
  // null is an authenticated poll/heartbeat, not a game action.
  message: ClientMessage | null;
}
export interface RoomResponse {
  messages: ServerMessage[];
}
