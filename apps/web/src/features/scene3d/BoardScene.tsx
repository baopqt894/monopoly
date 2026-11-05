import { RaisedTile, Vietnam32Base } from './board32/BoardTiles';
import { tileAmount } from '../board/tile-amount';
import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Box, MousePointer2 } from 'lucide-react';
import { ACESFilmicToneMapping, PCFSoftShadowMap, Shape } from 'three';
import type { BoardTile, GameState } from '@typhu/contracts';
import { boardFor, mapTilesFor } from '@typhu/game-content';
import { tileLayout, tileTexture } from './board-layout';
import { LiquidationTargets, LiquidationLabels } from './LiquidationTargets';
import { CardTargets } from './CardTargets';
import { EventMarkers } from './EventMarkers';
import { CityModels } from './CityModels';
import { StudioLighting } from './StudioLighting';
import { PropertyBuildings } from './PropertyBuildings';
import { PlayerPawn } from './PlayerPawn';
import { PawnPortraitCapture } from './pawns/PawnPortraitCapture';
import { pawnPortraitKey } from './pawns/portrait-key';
import { BoardDice } from './BoardDice';
import { FlightTargets } from './FlightTargets';
import { RollDestination } from './RollDestination';
import type { RollFeedback } from '../game/roll-feedback';
import { BeveledBox } from './BeveledBox';
import './scene3d.css';
import { MatchClock } from '../game/MatchClock';
import { BoardClockAnchor } from './BoardClockAnchor';

class SceneBoundary extends Component<
  { children: ReactNode; onFallback: () => void; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <Box size={36} />
        <strong>Thiết bị chưa mở được đồ họa 3D</strong>
        <p>Bạn vẫn có thể chơi đầy đủ trên bàn cờ 2D.</p>
        <button className="primary-button" onClick={this.props.onFallback}>
          Mở bàn cờ 2D
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function FixedIsometricCamera({ modern }: { modern: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    // Fill more of the viewport while retaining the same viewing direction.
    const wide = size.width >= 1360 && size.width > size.height;
    const framingLift = wide ? -0.35 : 0;
    camera.position.set(13, (modern ? 13 : 17) + framingLift, 13);
    camera.lookAt(0, 0.55 + framingLift, 0);
    camera.zoom = Math.min(size.width / 17.8, size.height / (wide ? 12.5 : 13));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, modern]);
  return null;
}

function BoardBase() {
  const shape = useMemo(() => {
    const s = new Shape();
    const size = 12.25,
      r = 0.24,
      half = size / 2;
    s.moveTo(-half + r, -half);
    s.lineTo(half - r, -half);
    s.quadraticCurveTo(half, -half, half, -half + r);
    s.lineTo(half, half - r);
    s.quadraticCurveTo(half, half, half - r, half);
    s.lineTo(-half + r, half);
    s.quadraticCurveTo(-half, half, -half, half - r);
    s.lineTo(-half, -half + r);
    s.quadraticCurveTo(-half, -half, -half + r, -half);
    return s;
  }, []);
  return (
    <group>
      <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.27, 0]}>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.4,
              bevelEnabled: true,
              bevelThickness: 0.04,
              bevelSize: 0.045,
              bevelSegments: 3,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial color="#367f86" roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh receiveShadow position={[0, 0.155, 0]}>
        <boxGeometry args={[12.08, 0.06, 12.08]} />
        <meshStandardMaterial color="#edc88d" metalness={0.25} roughness={0.42} />
      </mesh>
      <mesh receiveShadow position={[0, 0.19, 0]}>
        <boxGeometry args={[11.96, 0.06, 11.96]} />
        <meshStandardMaterial color="#f4ead1" roughness={0.82} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <BeveledBox
            size={[11.9, 0.035, 0.018]}
            position={[0, -0.08, side * 6.13]}
            color="#a5d4cb"
            radius={0.008}
          />
          <BeveledBox
            size={[0.018, 0.035, 11.9]}
            position={[side * 6.13, -0.08, 0]}
            color="#a5d4cb"
            radius={0.008}
          />
          {[-1, 1].map((other) => (
            <group key={other}>
              <mesh castShadow position={[side * 4.8, -0.4, other * 4.8]}>
                <cylinderGeometry args={[0.32, 0.38, 0.22, 20]} />
                <meshStandardMaterial color="#428489" roughness={0.6} />
              </mesh>
              <mesh position={[side * 5.98, 0.21, other * 5.98]}>
                <sphereGeometry args={[0.045, 12, 8]} />
                <meshStandardMaterial color="#eac37e" roughness={0.35} metalness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.53, 0]}>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial color="#3b7b90" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function Tile3D({
  tile,
  game,
  onSelect,
  onHover,
  flightTarget,
}: {
  tile: BoardTile;
  game: GameState;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
  flightTarget: boolean;
}) {
  const amount = tileAmount(game, tile.id);
  const layout = tileLayout(tile.id);
  const [hovered, setHovered] = useState(false);
  const property = game.properties[tile.id];
  const owner = game.players.find((p) => p.id === property?.ownerId);
  const texture = useMemo(() => tileTexture(tile, amount, owner?.color), [tile, amount, owner?.color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group
      position={[layout.x, 0.22, layout.z]}
      onClick={(event) => {
        event.stopPropagation();
        if (event.delta < 5) onSelect(tile.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        onHover(tile.id);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
      }}
    >
      <BeveledBox
        size={[layout.width - 0.025, 0.09, layout.depth - 0.025]}
        position={[0, 0.005, 0]}
        color={flightTarget ? '#f4be50' : owner?.color ?? (hovered ? '#9fcac3' : '#f4eddb')}
        radius={0.018}
      />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]}>
        <planeGeometry args={[layout.width - 0.04, layout.depth - 0.04]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          color={
            flightTarget
              ? '#fff0ba'
              : property?.mortgaged
                ? '#a9b0a0'
                : hovered
                  ? '#f4e4bb'
                  : '#ffffff'
          }
        />
      </mesh>
      {owner && (
        <mesh position={[0, 0.061, layout.depth / 2 - 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[layout.width - .06, .11]} />
          <meshBasicMaterial color={owner.color} toneMapped={false} />
        </mesh>
      )}
      {property && property.level > 0 && (
        <PropertyBuildings
          id={tile.id}
          modelId={tile.id}
          level={property.level}
          color={owner?.color ?? '#87a378'}
          business={property.business}
        />
      )}
    </group>
  );
}

export function BoardScene({
  game,
  matchDeadlineAt,
  matchEndedAt,
  dice = game.dice,
  rolling = false,
  rollResult,
  movementPaused = false,
  onSelect,
  onFallback,
  onArrive,
  onStep,
  flightTargetId = null,
  onFlightTarget,
  cardTargetIds,
  cardTargetId = null,
  liquidating = false,
  selectionDisabled = false,
  portraits = {},
  onPortraitReady,
}: {
  game: GameState;
  matchDeadlineAt?: number;
  matchEndedAt?: number;
  cardTargetIds?: number[];
  cardTargetId?: number | null;
  liquidating?: boolean;
  selectionDisabled?: boolean;
  portraits?: Record<string, string>;
  onPortraitReady?: (key: string, image: string) => void;
  dice?: [number, number];
  rolling?: boolean;
  rollResult?: RollFeedback | null;
  movementPaused?: boolean;
  onSelect: (id: number) => void;
  onFallback: () => void;
  onArrive: (id: number) => void;
  onStep?: (id: number, index: number) => void;
  flightTargetId?: number | null;
  onFlightTarget: (id: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [clockElement, setClockElement] = useState<HTMLDivElement | null>(null);
  const [targetLayer, setTargetLayer] = useState<HTMLDivElement | null>(null);
  const [sceneFailed, setSceneFailed] = useState(false);
  const board = boardFor(game),
    modern = game.boardId === 'vietnam-32';
  return (
    <div className="scene3d-frame" aria-label={`Bàn cờ 2.5D góc nhìn cố định, ${board.length} ô`}>
      <SceneBoundary onFallback={onFallback} onError={() => setSceneFailed(true)}>
        <Suspense fallback={<div className="scene-loading">Đang dựng thành phố của bạn…</div>}>
          <Canvas
            orthographic
            shadows
            dpr={[1, 1.75]}
            camera={{ position: [13, 17, 13], zoom: 30, near: 0.1, far: 250 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#bce5f5', 0);
              gl.toneMappingExposure = 1;
              gl.shadowMap.type = PCFSoftShadowMap;
            }}
          >
            <StudioLighting />
            {onPortraitReady && game.players.filter(player => !portraits[pawnPortraitKey(player.token, player.color)]).map(player => (
              <PawnPortraitCapture key={pawnPortraitKey(player.token, player.color)} token={player.token} color={player.color} onReady={onPortraitReady} />
            ))}
            <ambientLight intensity={0.4} />
            <hemisphereLight args={['#f4fbff', '#9bbd9e', 0.85]} />
            <directionalLight
              position={[-8, 16, 8]}
              intensity={1.8}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-11}
              shadow-camera-right={11}
              shadow-camera-top={11}
              shadow-camera-bottom={-11}
              shadow-normalBias={0.035}
              shadow-bias={-0.0002}
              shadow-radius={3}
            />
            <FixedIsometricCamera modern={modern} />
            {clockElement && <BoardClockAnchor element={clockElement} />}
            {modern ? (
              <Vietnam32Base gameplay />
            ) : (
              <>
                <BoardBase />
                <CityModels />
              </>
            )}
            {(!game.players[game.currentPlayer].jailed || game.phase !== 'roll' || rolling) && (
              <BoardDice dice={dice} rolling={rolling} />
            )}
            {rollResult?.destinationId !== null && rollResult?.destinationId !== undefined && (
              <RollDestination tileId={rollResult.destinationId} total={rollResult.total} boardId={game.boardId} />
            )}
            {board.map((tile) =>
              modern ? (
                <RaisedTile
                  key={tile.id}
                  tile={mapTilesFor(game)[tile.id]}
                  index={tile.id}
                  game={game}
                  selected={flightTargetId === tile.id}
                  onSelect={onSelect}
                  onHover={(id) => {
                    setHovered(id);
                    if (flightTargetId !== null && id !== null) onFlightTarget(id);
                  }}
                />
              ) : (
                <Tile3D
                  key={tile.id}
                  tile={tile}
                  game={game}
                  onSelect={onSelect}
                  onHover={(id) => {
                    setHovered(id);
                    if (id !== null && flightTargetId !== null) onFlightTarget(id);
                  }}
                  flightTarget={flightTargetId === tile.id}
                />
              ),
            )}
            {cardTargetIds && (
              <CardTargets game={game} ids={cardTargetIds} selectedId={cardTargetId} />
            )}
            <EventMarkers game={game} />
            {liquidating && targetLayer && (
              <LiquidationTargets game={game} container={targetLayer} />
            )}
            {flightTargetId !== null && (
              <FlightTargets
                ids={cardTargetIds}
                boardId={game.boardId}
                fromId={game.players[game.currentPlayer].position}
                targetId={flightTargetId}
              />
            )}
            {game.players.map((player, index) => (
              <PlayerPawn
                key={player.id}
                boardId={game.boardId}
                player={player}
                paused={movementPaused}
                index={index}
                active={index === game.currentPlayer}
                movement={game.movement?.playerId === player.id ? game.movement : undefined}
                onArrive={onArrive}
                onStep={onStep}
              />
            ))}
          </Canvas>
        </Suspense>
      </SceneBoundary>
      {matchDeadlineAt !== undefined && <MatchClock deadlineAt={matchDeadlineAt} endedAt={matchEndedAt} elementRef={setClockElement} />}
      <div
        ref={setTargetLayer}
        className="liquidation-target-layer"
        aria-label="Giá thanh lý trên từng ô"
      >
        {liquidating && !sceneFailed && (
          <LiquidationLabels game={game} disabled={selectionDisabled} onSelect={onSelect} />
        )}
      </div>
      {!cardTargetIds && !liquidating && hovered !== null && flightTargetId === null && (
        <div className="scene3d-tooltip">
          {board[hovered].name}
          {board[hovered].price && <span>₫{board[hovered].price}</span>}
        </div>
      )}
      {!liquidating && (
        <div className="sr-only" aria-label={`Danh sách ${board.length} ô trên bàn cờ`}>
          {board
            .filter((tile) => !cardTargetIds || cardTargetIds.includes(tile.id))
            .map((tile) => (
              <button
                key={tile.id}
                disabled={!!cardTargetIds && selectionDisabled}
                aria-pressed={cardTargetIds ? cardTargetId === tile.id : undefined}
                onClick={() => onSelect(tile.id)}
                onFocus={() => {
                  if (flightTargetId !== null) onFlightTarget(tile.id);
                }}
              >{`${cardTargetIds ? 'Chọn ô' : flightTargetId !== null ? 'Bay đến ô' : 'Ô'} ${tile.id}: ${tile.name}`}</button>
            ))}
        </div>
      )}
    </div>
  );
}
