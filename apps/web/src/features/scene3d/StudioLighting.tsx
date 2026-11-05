import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Soft studio reflections, generated locally without an HDR download. */
export function StudioLighting() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const reflection = generator.fromScene(room, 0.04);
    const previous = scene.environment;
    const intensity = scene.environmentIntensity;
    scene.environment = reflection.texture;
    scene.environmentIntensity = 0.32;
    room.dispose();
    generator.dispose();
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = intensity;
      reflection.dispose();
    };
  }, [gl, scene]);
  return null;
}
