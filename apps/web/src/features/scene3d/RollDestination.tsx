import { useEffect, useMemo } from 'react';
import { tileLayout } from './board-layout';
import { canvasMap } from './board32/board-paint';

/** Pure presentation of the server route; it never intercepts tile input. */
export function RollDestination({ tileId, total, boardId }: { tileId: number; total: number; boardId?: 'vietnam-32' }) {
  const tile = tileLayout(tileId, boardId);
  const base = boardId ? .45 : .32;
  const side = Math.floor(tileId / (boardId ? 8 : 10));
  const badgeX = tile.x + (side === 1 ? -.38 : side === 3 ? .38 : 0);
  const badgeZ = tile.z + (side === 0 ? .38 : side === 2 ? -.38 : 0);
  const texture = useMemo(() => canvasMap((ctx, w, h) => {
    ctx.fillStyle = '#fffdf2';
    ctx.strokeStyle = '#5eaa95';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#365f4c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 70px sans-serif'; ctx.fillText(String(total), w / 2, h / 2 + 3);
  }, 128, 128), [total]);
  useEffect(() => () => texture.dispose(), [texture]);
  const width = tile.width - .05, depth = tile.depth - .05;
  return (
    <group>
      <group position={[tile.x, base, tile.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh raycast={() => {}} renderOrder={7}>
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial color="#a1e2cb" transparent opacity={.24} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
        {[[0, depth / 2, width, .055], [0, -depth / 2, width, .055], [-width / 2, 0, .055, depth], [width / 2, 0, .055, depth]].map(([x, y, w, h], index) => (
          <mesh key={index} position={[x, y, .006]} raycast={() => {}} renderOrder={8}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color="#65b9a2" depthTest={false} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <sprite position={[badgeX, base + .58, badgeZ]} scale={[.52, .52, 1]} raycast={() => {}} renderOrder={10}>
        <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh position={[badgeX, base + .24, badgeZ]} rotation={[0, 0, Math.PI]} raycast={() => {}} renderOrder={9}>
        <coneGeometry args={[.09, .15, 4]} />
        <meshBasicMaterial color="#65b9a2" depthTest={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
