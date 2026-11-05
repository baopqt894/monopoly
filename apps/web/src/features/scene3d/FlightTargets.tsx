import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Line,
  LineDashedMaterial,
  MeshBasicMaterial,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';
import { boardFor } from '@typhu/game-content';
import { tileLayout } from './board-layout';

function TargetOutline({
  id,
  material,
  boardId,
}: {
  id: number;
  material: MeshBasicMaterial;
  boardId?: 'vietnam-32';
}) {
  const layout = tileLayout(id, boardId);
  const geometry = useMemo(() => {
    const w = layout.width / 2 - 0.015,
      h = layout.depth / 2 - 0.015,
      thickness = 0.055;
    const shape = new Shape();
    shape.moveTo(-w, -h);
    shape.lineTo(w, -h);
    shape.lineTo(w, h);
    shape.lineTo(-w, h);
    shape.closePath();
    const hole = new Path();
    hole.moveTo(-w + thickness, -h + thickness);
    hole.lineTo(-w + thickness, h - thickness);
    hole.lineTo(w - thickness, h - thickness);
    hole.lineTo(w - thickness, -h + thickness);
    hole.closePath();
    shape.holes.push(hole);
    return new ShapeGeometry(shape);
  }, [layout.width, layout.depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[layout.x, boardId ? 0.43 : 0.31, layout.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => {}}
      renderOrder={2}
    />
  );
}

/** World-space targets and a route preview. These never take input away from tile raycasts. */
export function FlightTargets({
  ids,
  fromId,
  targetId,
  boardId,
}: {
  ids?: number[];
  fromId: number;
  targetId: number;
  boardId?: 'vietnam-32';
}) {
  const materials = useMemo(
    () => ({
      available: new MeshBasicMaterial({
        color: '#42c7bc',
        transparent: true,
        opacity: 0.75,
        depthTest: false,
        toneMapped: false,
      }),
      selected: new MeshBasicMaterial({ color: '#ffbc3d', depthTest: false, toneMapped: false }),
    }),
    [],
  );
  const route = useMemo(() => {
    const count = boardFor({boardId}).length;
    const distance = (targetId - fromId + count) % count;
    const points = Array.from({length: distance + 1}, (_, i) => {
      const tile = tileLayout((fromId + i) % count, boardId);
      return new Vector3(tile.x, 0.5, tile.z);
    });
    const line = new Line(
      new BufferGeometry().setFromPoints(points),
      new LineDashedMaterial({ color: '#eeab30', dashSize: 0.16, gapSize: 0.1, toneMapped: false }),
    );
    line.computeLineDistances();
    line.raycast = () => {};
    return line;
  }, [fromId, targetId, boardId]);
  useEffect(
    () => () => {
      materials.available.dispose();
      materials.selected.dispose();
    },
    [materials],
  );
  useEffect(
    () => () => {
      route.geometry.dispose();
      (route.material as LineDashedMaterial).dispose();
    },
    [route],
  );
  useFrame(({ clock }) => {
    materials.available.opacity = 0.65 + Math.sin(clock.elapsedTime * 3) * 0.18;
  });
  const target = tileLayout(targetId, boardId);
  return (
    <group>
      {boardFor({ boardId }).filter(tile => !ids || ids.includes(tile.id)).map((tile) => (
        <TargetOutline
          key={tile.id}
          id={tile.id}
          boardId={boardId}
          material={tile.id === targetId ? materials.selected : materials.available}
        />
      ))}
      {fromId !== targetId && <primitive object={route} />}
      <mesh position={[target.x, 0.85, target.z]} rotation={[0, 0, Math.PI]} raycast={() => {}}>
        <coneGeometry args={[0.14, 0.28, 4]} />
        <meshBasicMaterial color="#ffbc3d" toneMapped={false} />
      </mesh>
    </group>
  );
}
