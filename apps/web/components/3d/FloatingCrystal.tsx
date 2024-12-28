"use client";

import { useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useFloatingAnimation } from "@/hooks/useFloatingAnimation";

export function FloatingCrystal() {
  const [hovered, setHovered] = useState(false);
  const meshRef = useFloatingAnimation();

  const { scale, emissive } = useSpring({
    scale: hovered ? 1.2 : 1,
    emissive: hovered ? "#ff4d4d" : "#000000",
    config: { mass: 1, tension: 280, friction: 60 }
  });

  return (
    <animated.mesh
      ref={meshRef}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <octahedronGeometry args={[1, 2]} />
      <animated.meshPhysicalMaterial
        color="#ffffff"
        emissive={emissive}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1}
        transmission={0.5}
        thickness={1.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </animated.mesh>
  );
}