import type { RoomSnapshot, ServerMessage } from '@typhu/contracts/multiplayer';

export class RoomRevisionGate {
  private code: string | null = null;
  private revision = -1;
  reset() {
    this.code = null;
    this.revision = -1;
  }
  accept(room: RoomSnapshot): boolean {
    if (this.code !== room.code) {
      this.code = room.code;
      this.revision = -1;
    }
    const revision = room.revision ?? 0;
    if (revision <= this.revision) return false;
    this.revision = revision;
    return true;
  }
}

/** Incremental SSE decoder: network chunks need not align with UTF-8 or event boundaries. */
export function roomEventDecoder(receive: (message: ServerMessage) => void) {
  const decoder = new TextDecoder();
  let buffer = '';
  return (bytes: Uint8Array) => {
    buffer += decoder.decode(bytes, { stream: true });
    if (buffer.length > 1_048_576) throw new Error('Room event exceeds limit');
    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const event = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of event.split('\n')) {
        if (line.startsWith('data:')) receive(JSON.parse(line.slice(5)) as ServerMessage);
      }
    }
  };
}
