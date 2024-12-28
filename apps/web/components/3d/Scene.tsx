"use client";

import { Canvas } from "@react-three/fiber";
import { Earth } from "./Earth";
import { Suspense } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { OrbitControls } from "@react-three/drei";
import { Position } from "@countdown3d/shared";

interface SceneProps {
  positions: Position[];
  userLocation: { lat: number; lng: number } | null;
}

export function Scene({ positions, userLocation }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{
        antialias: true,
        alpha: true,
        stencil: true,
        depth: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      shadows
      linear
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 3, 10]} />
      
      <Suspense fallback={<LoadingSpinner />}>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={5}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <Earth positions={positions} userLocation={userLocation} />
      </Suspense>
    </Canvas>
  );
}