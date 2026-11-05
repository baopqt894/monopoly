'use client';

import dynamic from 'next/dynamic';

// The game uses sessionStorage, location and WebGL; mount it in the browser only.
const Game = dynamic(() => import('../apps/web/src/app/App').then((mod) => mod.App), {
  ssr: false,
});

export default function Page() {
  return <Game />;
}
