import { useEffect, useMemo } from 'react';
import { canvasMap } from './board-paint';
import { IslandCorner } from './IslandCorner';
import { FestivalCorner } from './FestivalCorner';
import { AirportCorner } from './AirportCorner';

type CornerKind = 'go' | 'island' | 'festival' | 'airport';
const palettes: Record<CornerKind, [string, string]> = {
  go: ['#fff9e5', '#16a8b3'],
  island: ['#6dd5dc', '#e1b868'],
  festival: ['#fff0db', '#ee7952'],
  airport: ['#e9f6fc', '#43a9cf'],
};
function CornerFloor({ kind }: { kind: CornerKind }) {
  const map = useMemo(
    () =>
      canvasMap(
        (ctx, w, h) => {
          const [base, accent] = palettes[kind];
          ctx.fillStyle = base;
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.roundRect(15, 15, w - 30, h - 30, 35);
          ctx.stroke();
          if (kind === 'go') {
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.moveTo(120, 190);
            ctx.lineTo(280, 190);
            ctx.lineTo(280, 125);
            ctx.lineTo(405, 245);
            ctx.lineTo(280, 365);
            ctx.lineTo(280, 300);
            ctx.lineTo(120, 300);
            ctx.closePath();
            ctx.fill();
          } else if (kind === 'island') {
            ctx.strokeStyle = '#baf5ee';
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.ellipse(250, 255, 211, 181, -0.12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ffe5a4';
            ctx.beginPath();
            ctx.ellipse(250, 250, 190, 159, -0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff0c5';
            ctx.beginPath();
            ctx.ellipse(250, 240, 166, 135, -0.12, 0, Math.PI * 2);
            ctx.fill();
          } else if (kind === 'festival') {
            ctx.fillStyle = '#ffd6a3';
            ctx.beginPath();
            ctx.arc(260, 270, 117, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ed9c62';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(260, 270, 96, 0, Math.PI * 2);
            ctx.stroke();
            // A clear, flat plaza keeps the pawn's route unobstructed.
            ctx.fillStyle = '#fff7e8';
            for (let i = 0; i < 8; i++) {
              const a = (i * Math.PI) / 4;
              ctx.beginPath();
              ctx.arc(260 + Math.cos(a) * 139, 270 + Math.sin(a) * 139, 6, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = '#a6c4d0';
            ctx.beginPath();
            ctx.roundRect(160, 125, 192, 240, 20);
            ctx.fill();
            ctx.strokeStyle = '#f8ffff';
            ctx.lineWidth = 8;
            ctx.setLineDash([27, 21]);
            ctx.beginPath();
            ctx.moveTo(256, 145);
            ctx.lineTo(256, 345);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#f8ffff';
            for (const x of [183, 213, 273, 303]) ctx.fillRect(x, 147, 12, 30);
          }
        },
        512,
        512,
      ),
    [kind],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[1.735, 1.735]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}
export function AssetCorner({ kind }: { kind: string; rotation: number }) {
  if (!(kind in palettes)) return null;
  if (kind === 'island') return <IslandCorner />;
  if (kind === 'festival') return <FestivalCorner />;
  if (kind === 'airport') return <AirportCorner />;
  return (
    <>
      <CornerFloor kind={kind as CornerKind} />
    </>
  );
}
