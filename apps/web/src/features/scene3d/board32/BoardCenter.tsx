import { useEffect, useMemo } from 'react';
import { BeveledBox } from '../BeveledBox';
import { TravelGarden } from './TravelGarden';
import { canvasMap, centerMap } from './board-paint';

function FlatMark({ text, color, size = 0.7 }: { text: string; color: string; size?: number }) {
  const map = useMemo(
    () =>
      canvasMap(
        (ctx, w, h) => {
          ctx.fillStyle = color;
          ctx.font = '800 170px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, w / 2, h / 2);
        },
        256,
        256,
      ),
    [text, color],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
export function BoardCenter({ showDice = true }: { showDice?: boolean }) {
  const map = useMemo(() => centerMap(), []);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <planeGeometry args={[7.57, 7.57]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <TravelGarden />
      <group position={[-1.7, 0.17, -0.95]} rotation={[0, 0.18, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <BeveledBox
            key={i}
            size={[0.94, 0.028, 1.28]}
            position={[i * 0.018, i * 0.031, 0]}
            color={i === 3 ? '#fff7de' : '#e5bd69'}
            radius={0.01}
          />
        ))}
        <group position={[0.054, 0.111, 0]}>
          <FlatMark text="?" color="#d79537" size={0.84} />
        </group>
      </group>
      {showDice &&
        [
          [-0.38, 1.5],
          [0.37, 1.7],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0.45, z]} rotation={[0, i ? 0.22 : -0.18, 0]}>
            <BeveledBox size={[0.56, 0.56, 0.56]} color="#d95c4c" radius={0.075} />
            {(i
              ? [
                  [-0.15, -0.15],
                  [0, 0],
                  [0.15, 0.15],
                ]
              : [
                  [-0.15, -0.15],
                  [0.15, -0.15],
                  [-0.15, 0.15],
                  [0.15, 0.15],
                ]
            ).map(([a, b], j) => (
              <mesh key={'top' + j} position={[a, 0.284, b]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.045, 16]} />
                <meshBasicMaterial color="#fff7df" />
              </mesh>
            ))}
            {[
              [-0.13, -0.13],
              [0.13, 0.13],
            ].map(([a, b], j) => (
              <mesh key={'front' + j} position={[a, b, 0.283]}>
                <circleGeometry args={[0.045, 16]} />
                <meshBasicMaterial color="#fff7df" />
              </mesh>
            ))}
          </group>
        ))}
    </>
  );
}
