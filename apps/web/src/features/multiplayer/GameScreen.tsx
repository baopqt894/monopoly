import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Flag,
  History,
  House,
  Landmark,
  LogOut,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type { GameAction } from '@typhu/contracts';
import { boardFor, pawnStepMs } from '@typhu/game-content';
import { preloadCardArt } from '../game/card-art-loading';
import { useRollPresentation } from '../game/useRollPresentation';
import { MatchClock } from '../game/MatchClock';
import { RollResult } from '../game/RollResult';
import { rollFeedback } from '../game/roll-feedback';
import { useBoardEventNotice } from '../game/useBoardEventNotice';
import { SharedBoardNotice } from '../game/SharedBoardNotice';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import {
  cityEvent,
  nextCityEvent,
  ownedTiles,
  usesFullLiquidation,
  liquidationTileIds,
  festivalTargets,
  FLIGHT_FEE,
  flightTargets,
  hasLandingChoice,
} from '@typhu/game-engine';
import { Board } from '../board/Board';
import { GameControls } from './GameControls';
import { FlightSelection } from './FlightSelection';
import { LiquidationSelection } from '../properties/LiquidationSelection';
import { LeaveRoomConfirm } from './LeaveRoomConfirm';
import { RoomExitContext } from '../../shared/room-exit-context';
import { ActionClock, ActionClockContext } from '../../shared/ActionClock';
import { PlayerPortrait } from './PlayerPortrait';
import { AnimatedBalance } from './AnimatedBalance';
import { useCashPresentation } from './useCashPresentation';
import { SharedCardNotice } from '../game/SharedCardNotice';
import { useCardPresentation } from '../game/useCardPresentation';
import { RoomChat } from '../chat/RoomChat';
import { AvatarChatBubble } from '../chat/AvatarChatBubble';
import { pawnPortraitKey } from '../scene3d/pawns/portrait-key';
import { PurchaseModal } from './PurchaseModal';
import { FestivalSelection } from '../game/FestivalSelection';
import { CardModal } from '../game/CardModal';
import { CardBoardSelection } from '../game/CardBoardSelection';
import { cardBoardAction, cardBoardChoices } from '../game/card-board-selection';
import { AuctionModal } from '../game/AuctionModal';
import { HistoryModal } from '../game/HistoryModal';
import { RulesModal } from '../game/RulesModal';
import { ResultsModal } from '../game/ResultsModal';
import { PortfolioModal } from '../properties/PortfolioModal';
import { PropertyModal } from '../properties/PropertyModal';

import { OnlineTradeModal, PendingTradeModal } from './OnlineTradeModal';
import '../trading/trading.css';
import '../game/events.css';
import './game-screen.css';
import './visual-polish.css';
import './player-hud.css';
import './game-responsive.css';

const BoardScene = lazy(() =>
  import('../scene3d/BoardScene').then((module) => ({ default: module.BoardScene })),
);

export function GameScreen({
  room,
  seatId,
  status,
  pending,
  error,
  send,
  clearError,
}: {
  room: RoomSnapshot;
  seatId: string;
  status: string;
  pending: boolean;
  error: string | null;
  send: (message: ClientMessage) => void;
  clearError: () => void;
}) {
  useEffect(preloadCardArt, []);
  const game = room.game!;
  const selfSeat = room.seats.find((seat) => seat.id === seatId)!;
  const self = game.players.find((player) => player.id === selfSeat.gamePlayerId)!;
  const turnPlayer = game.players[game.currentPlayer];
  const actorId =
    game.debt?.debtorId ??
    (game.phase === 'auction' && game.auction
      ? game.players[game.auction.bidderIndex].id
      : turnPlayer.id);
  const myAction = game.phase !== 'finished' && actorId === self.id && status === 'connected';
  const actor = game.players.find((p) => p.id === actorId)!;
  const [modal, setModal] = useState<'rules' | 'history' | 'portfolio' | 'trade' | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  function requestLeave() {
    setLeaveOpen(true);
  }
  const [selected, setSelected] = useState<number | null>(null);
  const [portfolioId, setPortfolioId] = useState(self.id);
  const [schematic, setSchematic] = useState(false);
  const [portraits, setPortraits] = useState<Record<string, string>>({});
  const onPortraitReady = useCallback((key: string, image: string) => {
    setPortraits((previous) =>
      previous[key] === image ? previous : { ...previous, [key]: image },
    );
  }, []);
  const [arrivedMovement, setArrivedMovement] = useState(game.movement?.id);
  const rollAnimation = useRollPresentation(game, !!error || status !== 'connected');
  const pawnMoving = game.movement !== undefined && arrivedMovement !== game.movement.id;
  const traveling = rollAnimation.busy || pawnMoving;
  const cashPresentation = useCashPresentation(game);
  const onPawnArrive = useCallback(
    (id: number) => {
      setArrivedMovement(id);
      cashPresentation.onArrive(id);
    },
    [cashPresentation.onArrive],
  );
  const rolling = rollAnimation.spinning;
  const boardPresentation = useBoardEventNotice(game, traveling);
  const boardNotice = boardPresentation.notice;
  const moving = traveling || boardPresentation.blocking;
  const feedback =
    !rolling &&
    (rollAnimation.result || (pawnMoving && game.movement?.rollId === game.lastRoll?.id))
      ? rollFeedback(game)
      : null;
  const [schematicPositions, setSchematicPositions] = useState<Record<string, number>>(() =>
    Object.fromEntries(game.players.map((p) => [p.id, p.position])),
  );
  useEffect(() => {
    if (!moving)
      setSchematicPositions(Object.fromEntries(game.players.map((p) => [p.id, p.position])));
  }, [moving, game.players]);
  useEffect(() => {
    const movement = game.movement;
    if (!schematic || !movement || arrivedMovement === movement.id || rollAnimation.busy) return;
    let index = 0;
    if (!movement.path.length) {
      onPawnArrive(movement.id);
      return;
    }
    const timer = setInterval(() => {
      const position = movement.path[index++];
      cashPresentation.onStep(movement.id, index - 1);
      setSchematicPositions((current) => ({ ...current, [movement.playerId]: position }));
      if (index === movement.path.length) {
        clearInterval(timer);
        onPawnArrive(movement.id);
      }
    }, pawnStepMs(movement));
    return () => clearInterval(timer);
  }, [
    schematic,
    game.movement?.id,
    arrivedMovement,
    rollAnimation.busy,
    cashPresentation.onStep,
    onPawnArrive,
  ]);
  const schematicGame = schematic
    ? {
        ...game,
        players: game.players.map((p) => ({
          ...p,
          position: schematicPositions[p.id] ?? p.position,
        })),
      }
    : game;
  const [flightTarget, setFlightTarget] = useState(turnPlayer.position);
  const flightEligible =
    myAction &&
    actorId === turnPlayer.id &&
    game.phase === 'roll' &&
    turnPlayer.flight === 'ready' &&
    turnPlayer.cash >= FLIGHT_FEE &&
    !turnPlayer.jailed &&
    !game.debt &&
    !room.pendingTrade &&
    !moving &&
    !rolling &&
    !pending;
  const flightSelecting = flightEligible;
  const flightIds = flightTargets(game);
  const validFlightTarget = flightIds.includes(flightTarget) ? flightTarget : flightIds[0];
  const upgradeOpened = useRef('');
  const activeLandingDialog = useRef<number | null>(null);
  useEffect(() => {
    const tileId = turnPlayer.position;
    const key = `${turnPlayer.id}:${game.movement?.id}:${game.properties[tileId]?.ownerId}`;
    if (
      !myAction ||
      moving ||
      cashPresentation.busy ||
      !hasLandingChoice(game) ||
      room.pendingTrade
    )
      return;
    if (upgradeOpened.current === key || modal !== null || selected !== null) return;
    upgradeOpened.current = key;
    activeLandingDialog.current = tileId;
    setSelected(tileId);
    setModal(null);
  }, [
    game,
    myAction,
    moving,
    cashPresentation.busy,
    room.pendingTrade,
    turnPlayer.id,
    turnPlayer.position,
    modal,
    selected,
  ]);
  useEffect(() => {
    if (
      activeLandingDialog.current !== null &&
      (!myAction || game.phase !== 'end' || game.propertyVisit?.decisionTaken)
    ) {
      if (selected === activeLandingDialog.current) setSelected(null);
      activeLandingDialog.current = null;
    }
  }, [myAction, game.phase, game.propertyVisit?.decisionTaken]);
  const [showResults, setShowResults] = useState(true);
  const [copied, setCopied] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(true);
  useEffect(() => {
    if (game.phase === 'finished') {
      setSelected(null);
      setModal(null);
    }
  }, [game.phase]);
  useEffect(() => {
    if (game.phase === 'purchase') setPurchaseOpen(true);
  }, [game.phase]);
  useEffect(() => {
    if (game.phase !== 'finished' && game.debt?.debtorId === self.id) {
      setModal(usesFullLiquidation(game) ? null : 'portfolio');
      setSelected(null);
    }
  }, [game.debt?.debtorId, self.id, game.phase]);
  const dispatch = (action: GameAction) => {
    if (myAction && !moving && !pending) send({ type: 'ACTION', action });
  };
  const selfDebt = game.phase !== 'finished' && game.debt?.debtorId === self.id;
  const liquidating = selfDebt && usesFullLiquidation(game) && !moving;
  const tradeInvolved =
    room.pendingTrade &&
    (room.pendingTrade.offer.fromId === self.id || room.pendingTrade.offer.toId === self.id);
  const cardChoices = cardBoardChoices(game);
  const cardPresentation = useCardPresentation(game);
  const cardTargeting =
    myAction &&
    !moving &&
    !tradeInvolved &&
    !liquidating &&
    cardChoices !== null &&
    cardPresentation.ready;
  const cardSelectionKey = `${game.currentPlayer}:${game.drawnCard?.cardId}:${game.nextLogId}`;
  const [cardRecipient, setCardRecipient] = useState({ key: '', id: '' });
  const cardRecipientId = cardRecipient.key === cardSelectionKey ? cardRecipient.id : '';
  const [cardSelection, setCardSelection] = useState<{ key: string; id: number | null }>({
    key: '',
    id: null,
  });
  const cardTileId =
    cardTargeting &&
    cardSelection.key === cardSelectionKey &&
    cardSelection.id !== null &&
    cardChoices!.tileIds.includes(cardSelection.id)
      ? cardSelection.id
      : null;
  const cardTargetIds = cardTargeting ? cardChoices!.tileIds : undefined;
  const festivalTargeting =
    game.phase === 'festival' && myAction && !moving && !game.debt && !tradeInvolved;
  // undefined removes the target overlay; [] would dim every tile for spectators.
  const festivalIds = festivalTargeting ? festivalTargets(game, self.id) : undefined;
  const boardTargetIds = festivalIds ?? cardTargetIds ?? (flightSelecting ? flightIds : undefined);
  const boardTargetId = festivalTargeting ? null : cardTileId;
  const forced =
    flightSelecting ||
    moving ||
    selfDebt ||
    (game.phase === 'festival' && myAction) ||
    (game.phase === 'card' && myAction) ||
    (game.phase === 'auction' && myAction) ||
    !!tradeInvolved;
  // Animation blocks transactions, not local inspection or an already-open dialog.
  const inspectionBlocked =
    flightSelecting || liquidating || cardTargeting || festivalTargeting || !!tradeInvolved;
  function portfolio(id = self.id) {
    if (inspectionBlocked) return;
    setPortfolioId(id);
    setModal('portfolio');
    setSelected(null);
  }
  function selectTile(id: number) {
    if (game.phase === 'festival' && myAction) {
      if (!festivalTargeting || leaveOpen || pending || !festivalIds?.includes(id)) return;
      dispatch({ type: 'HOST_FESTIVAL', tileId: id });
      return;
    }
    if (cardTargeting) {
      if (leaveOpen || moving || pending || !cardTargetIds?.includes(id)) return;
      const action = cardBoardAction(game, id, cardRecipientId);
      if (action) {
        dispatch(action);
        return;
      }
      setCardSelection({ key: cardSelectionKey, id: cardTileId === id ? null : id });
      return;
    }
    if (liquidating) {
      if (leaveOpen || !liquidationTileIds(game).includes(id)) return;
      const ids = game.debt?.selectedTileIds ?? [];
      dispatch({
        type: 'SET_LIQUIDATION_SELECTION',
        tileIds: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
      });
      return;
    }
    if (flightSelecting) {
      if (!flightIds.includes(id)) return;
      dispatch({ type: 'FLY', tileId: id });
      return;
    }
    if (inspectionBlocked) return;
    activeLandingDialog.current = null;
    setSelected(id);
    setModal(null);
  }
  return (
    <ActionClockContext.Provider
      value={
        room.phase === 'playing' && (room.pendingTrade?.expiresAt ?? room.actionDeadlineAt)
          ? {
              expiresAt: (room.pendingTrade?.expiresAt ?? room.actionDeadlineAt)!,
              startsAt: room.actionStartsAt,
            }
          : null
      }
    >
      <RoomExitContext.Provider value={leaveOpen ? null : requestLeave}>
        <main
          data-turn-phase={
            rolling ? 'spinning' : rollAnimation.result ? 'result' : pawnMoving ? 'moving' : 'idle'
          }
          aria-busy={moving}
          className={`game-screen ${flightSelecting ? 'is-targeting-flight' : ''} ${liquidating ? 'is-liquidating' : ''} ${cardTargeting || festivalTargeting ? 'is-targeting-card' : ''}`}
        >
          <div className="game-table-texture" />
          <div className="game-stage">
            <Suspense fallback={<div className="scene-loading">Đang dựng bàn cờ…</div>}>
              {schematic ? (
                <div className="schematic-stage">
                  <Board
                    game={schematicGame}
                    rollResult={feedback}
                    cardTargetIds={boardTargetIds}
                    cardTargetId={boardTargetId}
                    liquidating={liquidating}
                    selectionDisabled={pending || !myAction || moving || leaveOpen}
                    selectedTileId={flightSelecting ? validFlightTarget : selected}
                    onSelect={selectTile}
                    onTarget={flightSelecting ? setFlightTarget : undefined}
                  />
                </div>
              ) : (
                <BoardScene
                  game={game}
                  matchDeadlineAt={room.matchDeadlineAt}
                  matchEndedAt={room.matchEndedAt}
                  rollResult={feedback}
                  portraits={portraits}
                  onPortraitReady={onPortraitReady}
                  cardTargetIds={boardTargetIds}
                  cardTargetId={boardTargetId}
                  liquidating={liquidating}
                  selectionDisabled={pending || !myAction || moving || leaveOpen}
                  dice={game.dice}
                  rolling={rolling}
                  movementPaused={rollAnimation.busy}
                  onSelect={selectTile}
                  onFallback={() => setSchematic(true)}
                  onArrive={onPawnArrive}
                  onStep={cashPresentation.onStep}
                  flightTargetId={flightSelecting ? validFlightTarget : null}
                  onFlightTarget={setFlightTarget}
                />
              )}
            </Suspense>
          </div>
          {schematic && room.matchDeadlineAt !== undefined && (
            <MatchClock deadlineAt={room.matchDeadlineAt} endedAt={room.matchEndedAt} />
          )}
          <div className="game-match-info">
            <ActionClock />
            <button
              className="match-room"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(room.code)
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                  .catch(() => {});
              }}
            >
              <span />
              PHÒNG {room.code}
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
            <span className="match-round">
              <Flag size={12} />
              VÒNG{' '}
              <strong>
                {String(game.round).padStart(2, '0')}
                {game.mode === 'city' && <small> / {game.maxRounds}</small>}
              </strong>
            </span>
            <span
              title={status === 'connected' ? 'Trực tuyến' : 'Đang kết nối lại'}
              className={`match-network ${status === 'connected' ? 'online' : ''}`}
            >
              <Wifi size={13} />
            </span>
          </div>
          <div className="game-player-corners" aria-label="Người chơi trong phòng">
            {game.players.map((player, index) => {
              const seat = room.seats.find((s) => s.gamePlayerId === player.id)!;
              const cashChange = cashPresentation.active?.changes.find(
                (change) => change.playerId === player.id,
              );
              return (
                <button
                  key={player.id}
                  onClick={() => portfolio(player.id)}
                  disabled={inspectionBlocked}
                  style={{ '--player-color': player.color } as React.CSSProperties}
                  className={`corner-player corner-player-${[0, 1, 3, 2][index]} ${seat.bot ? 'is-bot' : ''} ${player.id === turnPlayer.id ? 'has-turn' : ''} ${player.id === self.id ? 'is-you' : ''} ${player.bankrupt ? 'is-out' : ''}`}
                >
                  <span className="corner-portrait">
                    <PlayerPortrait
                      index={index}
                      color={player.color}
                      token={player.token}
                      image={portraits[pawnPortraitKey(player.token, player.color)]}
                    />
                    {seat.bot ? (
                      <span className="you-tag bot-tag">BOT</span>
                    ) : (
                      player.id === self.id && <span className="you-tag">BẠN</span>
                    )}
                    {!seat.connected && !seat.bot && <i className="corner-offline" />}
                    <AvatarChatBubble messages={room.chat ?? []} seatId={seat.id} />
                  </span>
                  <span className="corner-player-body">
                    <strong className="player-ribbon">{player.name}</strong>
                    <AnimatedBalance
                      amount={cashPresentation.balances[player.id] ?? player.cash}
                      change={
                        cashChange && cashPresentation.active
                          ? {
                              id: cashPresentation.active.id,
                              reason: cashPresentation.active.reason,
                              amount: cashChange.amount,
                            }
                          : undefined
                      }
                    />
                    <span className="player-properties">
                      {player.bankrupt
                        ? 'PHÁ SẢN'
                        : player.jailed
                          ? 'MẮC KẸT Ở ĐẢO'
                          : player.id === turnPlayer.id
                            ? 'ĐANG ĐẾN LƯỢT'
                            : `${ownedTiles(game, player.id).length} BẤT ĐỘNG SẢN`}
                    </span>
                  </span>
                  {player.id === turnPlayer.id && <span className="corner-active-arrow">▼</span>}
                </button>
              );
            })}
          </div>
          <SharedCardNotice game={game} paused={moving} viewerId={self.id} />
          {feedback && (
            <RollResult
              result={feedback}
              destinationName={
                feedback.destinationId !== null
                  ? boardFor(game)[feedback.destinationId].name
                  : undefined
              }
            />
          )}
          {boardNotice && <SharedBoardNotice game={game} event={boardNotice} />}
          <RoomChat room={room} seatId={seatId} connected={status === 'connected'} send={send} />
          {festivalTargeting ? (
            <FestivalSelection
              game={game}
              playerId={self.id}
              dispatch={dispatch}
              disabled={pending || !myAction || moving || leaveOpen}
            />
          ) : cardTargeting ? (
            <CardBoardSelection
              key={cardSelectionKey}
              game={game}
              tileId={cardTileId}
              recipientId={cardRecipientId}
              onRecipientChange={(id) => setCardRecipient({ key: cardSelectionKey, id })}
              dispatch={dispatch}
              disabled={pending || !myAction || moving || leaveOpen}
            />
          ) : liquidating ? (
            <LiquidationSelection
              game={game}
              dispatch={dispatch}
              disabled={pending || !myAction || moving || leaveOpen}
            />
          ) : flightSelecting ? (
            <FlightSelection
              ids={flightIds}
              boardId={game.boardId}
              boardLayout={game.boardLayout}
              targetId={validFlightTarget}
              onTarget={setFlightTarget}
              onFly={selectTile}
              onCancel={() => {}}
              mandatory
            />
          ) : boardNotice ? null : (
            <GameControls
              pending={pending}
              moving={moving}
              game={game}
              canAct={myAction}
              actorName={`${room.seats.find((seat) => seat.gamePlayerId === actor.id)?.bot ? 'Bot ' : ''}${actor.name}`}
              dispatch={dispatch}
              onAssets={() => portfolio()}
              onPurchase={() => setPurchaseOpen(true)}
              rolling={rolling}
              showingResult={rollAnimation.result}
              onRoll={() => {
                if (!myAction || moving || pending) return;
                rollAnimation.request();
                dispatch({ type: 'ROLL' });
              }}
              onFlight={() => {
                if (!flightEligible) return;
                setModal(null);
                setSelected(null);
                setFlightTarget(turnPlayer.position);
              }}
            />
          )}
          <nav className="game-toolbelt" aria-label="Thao tác cá nhân">
            <button
              className="tool-assets"
              onClick={() => portfolio()}
              disabled={inspectionBlocked}
              title="Tài sản của tôi"
              aria-label="Tài sản của tôi"
            >
              <Landmark size={22} />
              <span>{ownedTiles(game, self.id).length}</span>
            </button>
            <button
              onClick={() => setModal('history')}
              disabled={inspectionBlocked}
              title="Nhật ký"
              aria-label="Nhật ký"
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setModal('rules')}
              disabled={inspectionBlocked}
              title="Luật chơi"
              aria-label="Luật chơi"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setSchematic(!schematic)}
              disabled={forced}
              title="Đổi kiểu bàn cờ"
              aria-label="Đổi kiểu bàn cờ"
            >
              {schematic ? '2.5D' : <House size={20} />}
            </button>
            <button
              className="tool-leave"
              onClick={requestLeave}
              disabled={pending}
              aria-label="Thoát phòng"
              title="Thoát phòng"
            >
              <LogOut size={20} />
            </button>
          </nav>
          {game.mode === 'city' && (
            <button
              className="game-event-token"
              onClick={() => setModal('rules')}
              disabled={inspectionBlocked}
              title={`${cityEvent(game).description} Tiếp theo: ${nextCityEvent(game).name}`}
            >
              <span>✳</span>
              {cityEvent(game).name}
            </button>
          )}
          <div className="game-activity-ticker" aria-live="polite">
            <span>{!traveling && !cashPresentation.busy ? game.log[0]?.message : null}</span>
          </div>
          {(error || status !== 'connected') && (
            <div className="network-toast" role="alert">
              <WifiOff size={16} />
              <span>{error ?? 'Mất kết nối. Đang tự kết nối lại, chưa gửi được thao tác.'}</span>
              {error && (
                <button aria-label="Đóng thông báo" onClick={clearError}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          {!leaveOpen && (
            <>
              {!moving &&
                !cashPresentation.busy &&
                game.phase === 'purchase' &&
                myAction &&
                purchaseOpen &&
                !modal &&
                selected === null && (
                  <PurchaseModal
                    key={`${turnPlayer.id}:${turnPlayer.position}`}
                    game={game}
                    dispatch={dispatch}
                    pending={pending}
                    onClose={() => dispatch({ type: 'SKIP_PURCHASE' })}
                  />
                )}
              {!cardTargeting &&
                !moving &&
                game.phase === 'card' &&
                myAction &&
                !game.debt &&
                !tradeInvolved &&
                !modal &&
                selected === null && <CardModal key={game.drawnCard?.cardId} game={game} />}
              {!moving &&
                game.phase === 'auction' &&
                myAction &&
                !tradeInvolved &&
                !modal &&
                selected === null && (
                  <AuctionModal
                    key={`${game.auction?.bidderIndex}-${game.auction?.highestBid}`}
                    game={game}
                    dispatch={dispatch}
                  />
                )}
              {!liquidating && (modal === 'portfolio' || selfDebt) && (
                <PortfolioModal
                  game={game}
                  portraits={portraits}
                  playerId={selfDebt ? self.id : portfolioId}
                  viewerId={self.id}
                  canManage={!moving && !pending}
                  dispatch={dispatch}
                  onClose={() => setModal(null)}
                  onPlayerChange={setPortfolioId}
                />
              )}
              {selected !== null && (
                <PropertyModal
                  game={game}
                  tileId={selected}
                  landingDialog={selected === activeLandingDialog.current}
                  canManage={myAction && !moving && !pending}
                  dispatch={dispatch}
                  onSkip={
                    myAction && selected === turnPlayer.position && hasLandingChoice(game)
                      ? () => dispatch({ type: 'END_TURN' })
                      : undefined
                  }
                  onClose={() => {
                    if (myAction && selected === turnPlayer.position && hasLandingChoice(game))
                      dispatch({ type: 'END_TURN' });
                    else setSelected(null);
                  }}
                />
              )}
              {modal === 'rules' && <RulesModal game={game} onClose={() => setModal(null)} />}
              {modal === 'history' && <HistoryModal game={game} onClose={() => setModal(null)} />}
              {!forced && modal === 'trade' && myAction && (
                <OnlineTradeModal
                  room={room}
                  playerId={self.id}
                  send={send}
                  onClose={() => setModal(null)}
                />
              )}
              {tradeInvolved && <PendingTradeModal room={room} playerId={self.id} send={send} />}
              {!moving && !cashPresentation.busy && game.phase === 'finished' && showResults && (
                <ResultsModal
                  game={game}
                  portraits={portraits}
                  onClose={() => setShowResults(false)}
                  onNewGame={() => {
                    setShowResults(false);
                    send({ type: 'LEAVE_ROOM' });
                  }}
                />
              )}
            </>
          )}
          {leaveOpen && (
            <LeaveRoomConfirm
              endsGame={
                game.victoryRules === 'business-tour-v1' &&
                game.players.filter(
                  (p) => !p.bankrupt && !(game.departedPlayerIds ?? []).includes(p.id),
                ).length <= 2
              }
              playing={room.phase === 'playing'}
              pending={pending}
              onCancel={() => setLeaveOpen(false)}
              onConfirm={() => send({ type: 'LEAVE_ROOM' })}
            />
          )}
        </main>
      </RoomExitContext.Provider>
    </ActionClockContext.Provider>
  );
}
