"use client";

import { Html } from "@react-three/drei";

interface LoadingSpinnerProps {
  progress?: number;
}

export function LoadingSpinner({ progress }: LoadingSpinnerProps) {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial color="#ffffff" wireframe />
      {progress !== undefined && (
        <group position={[0, 0.7, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[-0.5 + (progress / 100) * 0.5, 0, 0.01]}>
            <planeGeometry args={[progress / 100, 0.08]} />
            <meshBasicMaterial color="#00ff88" />
          </mesh>
        </group>
      )}
    </mesh>
  );
}