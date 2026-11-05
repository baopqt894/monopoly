import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import type { PawnMovement, Player } from '@typhu/contracts';
import { tileLayout } from './board-layout';
import { pawnMotionFrame, pawnReachedStep } from './pawn-motion';
import { PieceModel } from './PieceModel';
import { isVietnamPawn } from '@typhu/game-content';

export function PlayerPawn({
  boardId,
  player,
  index,
  active,
  movement,
  paused = false,
  onArrive,
  onStep,
}: {
  boardId?: 'vietnam-32';
  player: Player;
  index: number;
  active: boolean;
  movement?: PawnMovement;
  paused?: boolean;
  onArrive: (id: number) => void;
  onStep?: (id: number, index: number) => void;
}) {
  const ref = useRef<Group>(null);
  const previous = useRef(player.position);
  const initial = useRef(tileLayout(player.position, boardId)).current;
  const lastMovement = useRef(movement?.id);
  const motion = useRef<{
    movement: PawnMovement;
    origin: number;
    elapsed: number;
    completionId?: number;
    reportedStep?: number;
  } | null>(null);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  const reportStep = useRef(onStep);
  reportStep.current = onStep;
  const offsetX = index % 2 ? 0.255 : -0.255;
  const offsetZ = index < 2 ? -0.255 : 0.255;
  const baseY = boardId === 'vietnam-32' ? 0.44 : 0.3;
  useEffect(() => {
    if (player.bankrupt) {
      motion.current = null;
      if (movement?.playerId === player.id) arrive.current(movement.id);
      return;
    }
    if (movement && movement.playerId === player.id) {
      if (lastMovement.current !== movement.id) {
        motion.current = {
          movement,
          origin: previous.current,
          elapsed: 0,
          completionId: movement.id,
        };
        lastMovement.current = movement.id;
        previous.current = player.position;
        if (!movement.path.length) {
          motion.current = null;
          arrive.current(movement.id);
        }
      } else if (!motion.current) {
        // Existing snapshots on mount are already positioned; never acknowledge a route still playing.
        arrive.current(movement.id);
      }
      return;
    }
    const from = previous.current,
      to = player.position;
    if (from === to) return;
    const count = boardId === 'vietnam-32' ? 32 : 40,
      distance = (to - from + count) % count;
    const path =
      player.jailed || (distance > 12 && distance < count - 3)
        ? [to]
        : distance >= count - 3
          ? Array.from({ length: count - distance }, (_, i) => (from - i - 1 + count) % count)
          : Array.from({ length: distance }, (_, i) => (from + i + 1) % count);
    motion.current = { movement: { id: -1, playerId: player.id, path }, origin: from, elapsed: 0 };
    previous.current = to;
  }, [player.position, player.jailed, player.bankrupt, player.id, movement?.id, boardId]);
  useFrame((state, delta) => {
    if (!ref.current || paused) return;
    const current = motion.current;
    if (current) {
      current.elapsed += delta * 1000;
      const frame = pawnMotionFrame(current.movement, current.origin, current.elapsed);
      const reached = pawnReachedStep(current.movement, current.elapsed);
      if (current.completionId !== undefined && reached > (current.reportedStep ?? -1)) {
        current.reportedStep = reached;
        reportStep.current?.(current.completionId, reached);
      }
      const from = tileLayout(frame.from, boardId),
        to = tileLayout(frame.to, boardId);
      ref.current.position.set(
        MathUtils.lerp(from.x, to.x, frame.progress) + offsetX,
        baseY + frame.hop,
        MathUtils.lerp(from.z, to.z, frame.progress) + offsetZ,
      );
      if (frame.done) {
        motion.current = null;
        if (current.completionId !== undefined) arrive.current(current.completionId);
      }
    } else
      ref.current.position.y = baseY + (active ? Math.sin(state.clock.elapsedTime * 3) * 0.025 : 0);
    ref.current.rotation.y = active ? Math.sin(state.clock.elapsedTime * 0.8) * 0.2 : 0;
  });
  if (player.bankrupt) return null;
  return (
    <group ref={ref} position={[initial.x + offsetX, baseY, initial.z + offsetZ]}>
      <PieceModel kind={player.token} color={player.color} />
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <torusGeometry args={[isVietnamPawn(player.token) ? 0.27 : 0.23, 0.018, 8, 40]} />
          <meshStandardMaterial color="#cfaa60" emissive="#9d7a30" emissiveIntensity={0.35} />
        </mesh>
      )}
    </group>
  );
}
