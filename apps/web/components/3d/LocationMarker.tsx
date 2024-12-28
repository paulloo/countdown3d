"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LocationMarkerProps {
  position: THREE.Vector3;
  timestamp?: number;
  color?: string;
  scale?: number;
}

export function LocationMarker({ position, timestamp, color = "red", scale = 1 }: LocationMarkerProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (markerRef.current && glowRef.current) {
      // 脉冲效果
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 2) * 0.1 + 1;
      markerRef.current.scale.setScalar(0.02 * scale * pulse);
      glowRef.current.scale.setScalar(0.03 * scale * pulse);

      // 旋转效果
      markerRef.current.rotation.y += 0.02;
      glowRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={position}>
      {/* 标记点 */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* 发光效果 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
} 