import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import type { GameState } from '@typhu/contracts';
import {
  randomEventTileIds,
  festivalRentMultiplier,
  EVENT_RENT_MULTIPLIER,
} from '@typhu/game-engine';
import { EventGate } from './EventGate';
import { tileLayout } from './board-layout';

function Marker({
  game,
  id,
  festival,
  event,
}: {
  game: GameState;
  id: number;
  festival: boolean;
  event: boolean;
}) {
  const tile = tileLayout(id, game.boardId),
    side = Math.floor(id / (game.boardId ? 8 : 10));
  const color = festival ? '#ed648e' : '#f0b52e';
  const multiplier = festival ? festivalRentMultiplier(game, id) : EVENT_RENT_MULTIPLIER;
  const glow = useRef<Mesh>(null),
    flag = useRef<Group>(null),
    age = useRef(0);
  const particles = useRef<(Mesh | null)[]>([]);
  useFrame((state, delta) => {
    age.current += delta;
    if (glow.current)
      (glow.current.material as MeshBasicMaterial).opacity =
        0.12 + Math.sin(state.clock.elapsedTime * 2.5) * 0.055;
    if (flag.current) flag.current.scale.setScalar(Math.min(1, 0.6 + age.current * 0.8));
    particles.current.forEach((particle, index) => {
      if (!particle) return;
      const t = Math.min(1, age.current / 2);
      particle.visible = festival && t < 1;
      particle.position.y = 0.5 + t * 1.5;
      particle.position.x = Math.cos((index * Math.PI) / 3) * t * 0.7;
      particle.position.z = Math.sin((index * Math.PI) / 3) * t * 0.7;
      (particle.material as MeshBasicMaterial).opacity = 1 - t;
    });
  });
  const base = game.boardId ? 0.44 : 0.29;
  const gateOffset = game.boardId ? 0.77 : 0.6;
  return (
    <group position={[tile.x, base, tile.z]}>
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
        <planeGeometry args={[tile.width - 0.08, tile.depth - 0.08]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group rotation={[0, (-side * Math.PI) / 2, 0]}>
        <group ref={flag} position={[0, 0, side === 0 || side === 3 ? -gateOffset : gateOffset]}>
          <EventGate
            width={side % 2 ? tile.depth : tile.width}
            festival={festival}
            multiplier={multiplier}
            event={event}
            reverse={side === 1 || side === 2}
          />
        </group>
      </group>
      {festival &&
        Array.from({ length: 6 }, (_, index) => (
          <mesh
            key={index}
            ref={(value) => {
              particles.current[index] = value;
            }}
            raycast={() => {}}
          >
            <boxGeometry args={[0.07, 0.07, 0.07]} />
            <meshBasicMaterial
              color={index % 2 ? '#ffd25e' : '#ef719e'}
              transparent
              toneMapped={false}
            />
          </mesh>
        ))}
    </group>
  );
}

export function EventMarkers({ game }: { game: GameState }) {
  const events = randomEventTileIds(game);
  const ids = [
    ...new Set([...events, ...(game.festivalTileId == null ? [] : [game.festivalTileId])]),
  ];
  return (
    <>
      {ids.map((id) => (
        <Marker
          key={`${id}:${id === game.festivalTileId ? game.festivalLevel : 'event'}`}
          game={game}
          id={id}
          festival={id === game.festivalTileId}
          event={events.includes(id)}
        />
      ))}
    </>
  );
}
