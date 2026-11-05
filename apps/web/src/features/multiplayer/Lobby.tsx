import { RoomChat } from '../chat/RoomChat';
import { AvatarChatBubble } from '../chat/AvatarChatBubble';
import { useEffect, useState } from 'react';
import { preloadCardArt } from '../game/card-art-loading';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  Crown,
  DoorOpen,
  Hash,
  House,
  Leaf,
  Link2,
  LoaderCircle,
  Plus,
  Radio,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import { MATCH_DURATIONS, MAX_EVENT_TILES } from '@typhu/game-engine';
import { PlayerPortrait } from './PlayerPortrait';
import { LeaveRoomConfirm } from './LeaveRoomConfirm';
import './multiplayer.css';
import './lobby-theme.css';

export function Lobby({
  room,
  seatId,
  status,
  error,
  busy,
  send,
}: {
  room: RoomSnapshot | null;
  seatId: string | null;
  status: string;
  error: string | null;
  busy: boolean;
  send: (message: ClientMessage) => void;
}) {
  useEffect(preloadCardArt, []);
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('typhu:player-name') ?? '';
    } catch {
      return '';
    }
  });
  const [step, setStep] = useState<'name' | 'choose' | 'create' | 'join'>('name');
  const [code, setCode] = useState(
    () => new URLSearchParams(location.search).get('room')?.toUpperCase() ?? '',
  );
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState<15 | 30 | 45 | 60>(60);
  const [startingCash, setStartingCash] = useState('1500');
  const [goSalary, setGoSalary] = useState('200');
  const [eventTileCount, setEventTileCount] = useState(0);
  const [festivalIncrement, setFestivalIncrement] = useState<0.25 | 0.5>(0.5);
  const validMoney = startingCash.trim() !== '' && goSalary.trim() !== '' &&
    Number.isSafeInteger(Number(startingCash)) && Number(startingCash) >= 1 && Number(startingCash) <= 1_000_000 &&
    Number.isSafeInteger(Number(goSalary)) && Number(goSalary) >= 0 && Number(goSalary) <= 1_000_000;
  const [copied, setCopied] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const connected = status === 'connected';
  function setProfile() {
    if (!name.trim()) return;
    try {
      localStorage.setItem('typhu:player-name', name.trim());
    } catch {
      /* The name remains in memory. */
    }
    setStep(code ? 'join' : 'choose');
  }
  function copyCode() {
    if (!room) return;
    void navigator.clipboard
      ?.writeText(room.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }
  const self = room?.seats.find((s) => s.id === seatId);
  const host = room?.hostSeatId === seatId;
  const readyToStart =
    !!room && room.seats.length >= 2 && room.seats.every((s) => s.connected && s.ready);
  return (
    <div className="lobby-screen">
      <div className="lobby-grain" />
      <header className="lobby-brand">
        <span>
          <House size={21} />
        </span>
        <strong>
          TỶ PHÚ<small>THÀNH PHỐ SỐNG</small>
        </strong>
      </header>
      <div className={`connection-badge ${connected ? 'online' : ''}`}>
        <span />
        {connected ? 'Máy chủ đã sẵn sàng' : 'Đang kết nối máy chủ'}
        <Wifi size={12} />
      </div>
      <div className="lobby-world" aria-hidden="true">
        <div className="world-island">
          <div className="world-road horizontal" />
          <div className="world-road vertical" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`world-building building-${i}`}>
              <span />
              <i />
              <i />
              <i />
              <i />
            </div>
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`world-tree tree-${i}`} />
          ))}
        </div>
        <div className="world-shadow" />
        <span className="world-spark spark-one">✦</span>
        <span className="world-spark spark-two">✧</span>
        <span className="world-orbit orbit-one" />
        <span className="world-orbit orbit-two" />
      </div>
      <main className={`lobby-content ${room ? 'in-room' : ''}`}>
        <div className="lobby-intro">
          <span className="lobby-kicker">
            <span /> MỘT VÁN CỜ. VÔ VÀN CƠ HỘI.
          </span>
          <h1>
            {room ? (
              <>
                Thành phố vui hơn
                <br />
                khi có <em>đồng đội.</em>
              </>
            ) : (
              <>
                Cả thành phố
                <br />
                đang chờ <em>bạn.</em>
              </>
            )}
          </h1>
          <p>
            Mua một góc phố. Xây một giấc mơ.
            <br />
            Cùng bạn bè trở thành nhà đầu tư tài ba nhất.
          </p>
          <div className="lobby-feature-chips">
            <span>
              <Users size={13} />
              2–4 người chơi
            </span>
            <span>
              <Radio size={13} />
              Online cùng bạn bè
            </span>
            <span>
              <Leaf size={13} />
              Bàn cờ 2.5D
            </span>
          </div>
        </div>
        <section className="lobby-card">
          {room ? (
            <>
              <div className="lobby-card-top">
                <span className="lobby-step">PHÒNG CHỜ</span>
                <button
                  className="lobby-icon-button"
                  aria-label="Rời phòng"
                  onClick={() => setLeaveOpen(true)}
                >
                  <X size={16} />
                </button>
              </div>
              <h2>Đủ bạn, bắt đầu thôi.</h2>
              <p className="lobby-card-description">
                Gửi mã phòng cho những người bạn muốn thách đấu.
              </p>
              <button className="room-code-card" onClick={copyCode}>
                <span>
                  MÃ PHÒNG<strong>{room.code}</strong>
                </span>
                {copied ? <CheckCheck size={22} /> : <Copy size={20} />}
              </button>
              <div className="room-settings-summary">
                <span>
                  <Leaf size={12} />
                  {room.mode === 'city' ? 'Thành phố sống' : 'Cổ điển'}
                </span>
                <span>
                  <Users size={12} />
                  {room.seats.length}/{room.maxPlayers}
                </span>
                {room.durationMinutes !== undefined && <span>Thời gian: {room.durationMinutes} phút</span>}
                <span>Khởi đầu ₫{(room.startingCash ?? 1500).toLocaleString('vi-VN')}</span>
                <span>Qua vạch ₫{(room.goSalary ?? 200).toLocaleString('vi-VN')}</span>
                <span>Sự kiện: {room.eventTileCount ?? room.festivalTileCount ?? 0} ô · Thuê ×1,25</span>
                <span>Lễ hội: +{(room.festivalIncrement ?? 0.5) * 100}%/lần</span>
              </div>
              <div className="room-seats">
                {Array.from({ length: room.maxPlayers }, (_, i) => {
                  const seat = room.seats[i];
                  return (
                    <div key={seat?.id ?? i} className={`room-seat ${seat ? 'occupied' : ''}`}>
                      <span className={`seat-avatar seat-${i}`}>
                        {seat ? <PlayerPortrait index={i} color="#b6deeb" /> : <Plus size={18} />}
                        {seat && <AvatarChatBubble messages={room.chat ?? []} seatId={seat.id} />}
                      </span>
                      <div>
                        <strong>
                          {seat
                            ? `${seat.name}${seat.id === seatId ? ' (Bạn)' : ''}`
                            : 'Đang chờ người chơi…'}
                        </strong>
                        <small>
                          {seat
                            ? seat.connected
                              ? seat.id === room.hostSeatId
                                ? 'Chủ phòng'
                                : seat.ready
                                  ? 'Đã sẵn sàng'
                                  : 'Chưa sẵn sàng'
                              : 'Đang mất kết nối'
                            : 'Chia sẻ mã phòng để mời bạn'}
                        </small>
                      </div>
                      {seat &&
                        (seat.id === room.hostSeatId ? (
                          <Crown className="host-crown" size={16} />
                        ) : seat.ready ? (
                          <span className="ready-check">
                            <Check size={13} />
                          </span>
                        ) : (
                          <span className="waiting-pulse" />
                        ))}
                    </div>
                  );
                })}
              </div>
              {host ? (
                <button
                  className="lobby-primary"
                  onClick={() => send({ type: 'START_GAME' })}
                  disabled={!readyToStart || busy || !connected}
                >
                  {busy ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}Bắt
                  đầu ván chơi
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className={`lobby-primary ${self?.ready ? 'is-ready' : ''}`}
                  onClick={() => send({ type: 'SET_READY', ready: !self?.ready })}
                  disabled={!connected}
                >
                  {self?.ready ? <CheckCheck size={18} /> : <Check size={18} />}{' '}
                  {self?.ready ? 'Đã sẵn sàng · Bấm để hủy' : 'Tôi đã sẵn sàng'}
                  <ArrowRight size={17} />
                </button>
              )}
              <p className="lobby-footnote">
                {host
                  ? 'Cần ít nhất 2 người, tất cả sẵn sàng để bắt đầu.'
                  : 'Chủ phòng sẽ bắt đầu khi tất cả đã sẵn sàng.'}
              </p>
            </>
          ) : step === 'name' ? (
            <>
              <div className="lobby-card-top">
                <span className="lobby-step">CHÀO NHÀ ĐẦU TƯ MỚI</span>
                <span className="lobby-step-number">01 / 02</span>
              </div>
              <div className="welcome-avatar">
                <PlayerPortrait index={0} color="#31545a" />
                <span>✦</span>
              </div>
              <h2>Chào nhà đầu tư.</h2>
              <p className="lobby-card-description">Chọn tên để bắt đầu một ván cùng bạn bè.</p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setProfile();
                }}
              >
                <label className="lobby-field">
                  TÊN NHÀ ĐẦU TƯ
                  <div className="lobby-input-wrap">
                    <span>
                      <Users size={17} />
                    </span>
                    <input
                      autoFocus
                      autoComplete="nickname"
                      aria-label="Tên người chơi"
                      maxLength={24}
                      placeholder="Nhập tên của bạn…"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                    <small>{name.length}/24</small>
                  </div>
                </label>
                <button className="lobby-primary" type="submit" disabled={!name.trim()}>
                  Vào thành phố
                  <ArrowRight size={18} />
                </button>
              </form>
              <p className="lobby-footnote">Tên sẽ hiển thị với những người chơi trong phòng.</p>
            </>
          ) : step === 'choose' ? (
            <>
              <div className="lobby-card-top">
                <button className="lobby-back" onClick={() => setStep('name')}>
                  <ArrowLeft size={13} />
                  Đổi tên
                </button>
                <span className="lobby-step-number">02 / 02</span>
              </div>
              <h2>
                Chào {name.trim()}
                <span className="hello-dot">.</span>
              </h2>
              <p className="lobby-card-description">
                Bạn sẽ mở cuộc chơi, hay tham gia cùng bạn bè?
              </p>
              <button className="room-choice" onClick={() => setStep('create')}>
                <span>
                  <Plus size={23} />
                </span>
                <div>
                  <strong>Tạo phòng mới</strong>
                  <small>Chọn luật chơi và mời bạn bè</small>
                </div>
                <ChevronRight size={19} />
              </button>
              <button className="room-choice" onClick={() => setStep('join')}>
                <span>
                  <DoorOpen size={23} />
                </span>
                <div>
                  <strong>Tham gia phòng</strong>
                  <small>Nhập mã phòng để vào cuộc chơi</small>
                </div>
                <ChevronRight size={19} />
              </button>
              <div className="lobby-safe-note">
                <Link2 size={14} />
                <span>Mỗi người một thiết bị. Chung một thành phố.</span>
              </div>
            </>
          ) : step === 'join' ? (
            <>
              <div className="lobby-card-top">
                <button className="lobby-back" onClick={() => setStep('choose')}>
                  <ArrowLeft size={13} />
                  Quay lại
                </button>
                <span className="lobby-step">THAM GIA PHÒNG</span>
              </div>
              <h2>Đã có hẹn cùng bạn bè?</h2>
              <p className="lobby-card-description">Nhập mã 6 ký tự được chủ phòng chia sẻ.</p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  send({ type: 'JOIN_ROOM', name: name.trim(), code });
                }}
              >
                <label className="lobby-field">
                  MÃ PHÒNG
                  <div className="lobby-input-wrap room-code-input">
                    <Hash size={19} />
                    <input
                      aria-label="Mã phòng"
                      autoFocus
                      value={code}
                      maxLength={6}
                      placeholder="A1B2C3"
                      autoComplete="off"
                      onChange={(event) =>
                        setCode(event.target.value.replace(/[^a-fA-F0-9]/g, '').toUpperCase())
                      }
                    />
                  </div>
                </label>
                <button
                  className="lobby-primary"
                  type="submit"
                  disabled={code.length !== 6 || busy || !connected}
                >
                  {busy ? <LoaderCircle size={18} className="spin" /> : <DoorOpen size={18} />}Vào
                  phòng
                  <ArrowRight size={17} />
                </button>
              </form>
              <p className="lobby-footnote">
                Vào phòng với tên <strong>{name.trim()}</strong>.
              </p>
            </>
          ) : (
            <>
              <div className="lobby-card-top">
                <button className="lobby-back" onClick={() => setStep('choose')}>
                  <ArrowLeft size={13} />
                  Quay lại
                </button>
                <span className="lobby-step">TẠO PHÒNG</span>
              </div>
              <h2>Cuộc chơi theo cách của bạn.</h2>
              <p className="lobby-card-description">Bạn là chủ phòng. Mời bạn bè sau khi tạo.</p>
              <div className="lobby-settings classic-room-settings">
                <label className="lobby-field">
                  SỐ NGƯỜI
                  <select aria-label="Số người tối đa" value={maxPlayers}
                    onChange={(event) => setMaxPlayers(Number(event.target.value))}>
                    <option value={2}>2 người</option>
                    <option value={3}>3 người</option>
                    <option value={4}>4 người</option>
                  </select>
                </label>
                <label className="lobby-field">
                  THỜI GIAN CHƠI
                  <select aria-label="Thời gian chơi" value={durationMinutes}
                    onChange={(event) => setDurationMinutes(Number(event.target.value) as typeof durationMinutes)}>
                    {MATCH_DURATIONS.map(minutes => <option key={minutes} value={minutes}>{minutes} phút</option>)}
                  </select>
                </label>
                <label className="lobby-field">
                  TIỀN QUA XUẤT PHÁT
                  <div className="lobby-input-wrap">
                    <span aria-hidden="true">₫</span>
                    <input type="number" aria-label="Tiền qua Xuất phát" min={0} max={1000000} step={1}
                      value={goSalary} onChange={(event) => setGoSalary(event.target.value)} />
                  </div>
                </label>
                <label className="lobby-field">
                  TIỀN KHỞI ĐẦU
                  <div className="lobby-input-wrap">
                    <span aria-hidden="true">₫</span>
                    <input type="number" aria-label="Tiền khởi đầu" min={1} max={1000000} step={1}
                      value={startingCash} onChange={(event) => setStartingCash(event.target.value)} />
                  </div>
                </label>
                <label className="lobby-field">
                  SỐ Ô SỰ KIỆN · THUÊ ×1,25
                  <select aria-label="Số ô sự kiện" value={eventTileCount}
                    onChange={(event) => setEventTileCount(Number(event.target.value))}>
                    {Array.from({ length: MAX_EVENT_TILES + 1 }, (_, count) => (
                      <option key={count} value={count}>{count === 0 ? 'Tắt ô sự kiện' : `${count} ô`}</option>
                    ))}
                  </select>
                </label>
                <label className="lobby-field">
                  MỨC TĂNG LỄ HỘI
                  <select aria-label="Mức tăng mỗi lần của Lễ hội" value={festivalIncrement}
                    onChange={(event) => setFestivalIncrement(event.target.value === '0.25' ? 0.25 : 0.5)}>
                    <option value={0.25}>25% (+0,25) mỗi lần</option>
                    <option value={0.5}>50% (+0,5) mỗi lần</option>
                  </select>
                </label>
              </div>
              <button
                className="lobby-primary"
                onClick={() =>
                  send({ type: 'CREATE_ROOM', name: name.trim(), maxPlayers, durationMinutes, startingCash: Number(startingCash), goSalary: Number(goSalary), eventTileCount, festivalIncrement, boardId: 'vietnam-32' })
                }
                disabled={busy || !connected || !validMoney}
              >
                {busy ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}Tạo phòng
                ngay
                <ArrowRight size={17} />
              </button>
            </>
          )}
          {error && (
            <p className="lobby-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
      <footer className="lobby-footer">
        <span>✦</span> MỘT CHÚT MAY MẮN. MỘT TẦM NHÌN LỚN.
        <span>{!room || room.boardId === 'vietnam-32' ? '32 ô · 20 ô đất + 4 resort' : '40 ô tiêu chuẩn · 2 bộ thẻ sự kiện'}</span>
      </footer>
      {room && seatId && <RoomChat room={room} seatId={seatId} connected={connected} send={send} />}
      {room && leaveOpen && <LeaveRoomConfirm playing={false} pending={busy}
        onCancel={() => setLeaveOpen(false)} onConfirm={() => { send({ type: 'LEAVE_ROOM' }); setLeaveOpen(false); }} />}
    </div>
  );
}
