import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Box3, Color, Group, Scene, SRGBColorSpace, Vector4, WebGLRenderTarget } from 'three';
import { PieceModel } from '../PieceModel';
import { pawnPortraitBounds, pawnPortraitCamera, portraitPixels } from './portrait-raster';
import { pawnPortraitKey } from './portrait-key';

const portraits = new Map<string, string>();
const SIZE = 256;

/** Uses the board's existing WebGL context, never one canvas/context per avatar. */
export function PawnPortraitCapture({
  token,
  color,
  onReady,
}: {
  token: string;
  color: string;
  onReady: (key: string, image: string) => void;
}) {
  const { gl, scene: boardScene } = useThree();
  const scene = useMemo(() => new Scene(), []);
  const model = useRef<Group>(null);
  const done = useRef(false);
  const key = pawnPortraitKey(token, color);
  const target = useMemo(() => {
    const buffer = new WebGLRenderTarget(SIZE, SIZE, { depthBuffer: true, stencilBuffer: false });
    buffer.texture.colorSpace = SRGBColorSpace;
    return buffer;
  }, []);
  useEffect(() => () => target.dispose(), [target]);
  useFrame(() => {
    if (done.current || !model.current) return;
    const cached = portraits.get(key);
    if (cached) {
      done.current = true;
      onReady(key, cached);
      return;
    }
    model.current.updateWorldMatrix(true, true);
    const camera = pawnPortraitCamera(
      pawnPortraitBounds(token, new Box3().setFromObject(model.current)),
    );
    const previousTarget = gl.getRenderTarget();
    const previousColor = gl.getClearColor(new Color()).clone();
    const previousAlpha = gl.getClearAlpha();
    const previousViewport = gl.getViewport(new Vector4());
    const previousScissor = gl.getScissor(new Vector4());
    const previousScissorTest = gl.getScissorTest();
    const pixels = new Uint8Array(SIZE * SIZE * 4);
    try {
      scene.environment = boardScene.environment;
      scene.environmentIntensity = 0.32;
      gl.setRenderTarget(target);
      gl.setViewport(0, 0, SIZE, SIZE);
      gl.setScissorTest(false);
      gl.setClearColor('#edf2df', 1);
      gl.clear();
      gl.render(scene, camera);
      gl.readRenderTargetPixels(target, 0, 0, SIZE, SIZE, pixels);
    } finally {
      gl.setRenderTarget(previousTarget);
      gl.setViewport(previousViewport);
      gl.setScissor(previousScissor);
      gl.setScissorTest(previousScissorTest);
      gl.setClearColor(previousColor, previousAlpha);
    }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      done.current = true;
      return;
    }
    context.putImageData(new ImageData(portraitPixels(pixels, SIZE, SIZE), SIZE, SIZE), 0, 0);
    const image = canvas.toDataURL('image/png');
    portraits.set(key, image);
    if (portraits.size > 64) portraits.delete(portraits.keys().next().value!);
    done.current = true;
    onReady(key, image);
  });
  return createPortal(
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#fff7df', '#adbea8', 1]} />
      <directionalLight position={[-3, 6, 5]} intensity={2.5} />
      <group ref={model}>
        <PieceModel kind={token} color={color} showBase={false} />
      </group>
    </>,
    scene,
  );
}
