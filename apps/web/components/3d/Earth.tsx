"use client";

import { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { 
  Mesh, 
  Vector3, 
  BackSide, 
  AdditiveBlending, 
  Group,
  Color,
  FrontSide,
  DoubleSide,
  ShaderMaterial
} from "three";
import { Position } from "@countdown3d/shared";
import { useEarthTextures } from "./hooks/useEarthTextures";
import { useEarthPosition } from './hooks/useEarthPosition';
import { LoadingSpinner } from "./LoadingSpinner";

interface EarthProps {
  positions: Position[];
  userLocation: { lat: number; lng: number } | null;
  autoRotate?: boolean;
  controlsRef?: React.RefObject<any>;
}

export interface EarthRef {
  focusPosition: (lat: number, lng: number) => void;
  resetPosition: () => void;
}

export const Earth = forwardRef<EarthRef, EarthProps>(({ positions, userLocation, autoRotate = true, controlsRef }, ref) => {
  const earthRef = useRef<Mesh>(null);
  const nightRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const markersGroupRef = useRef<Group>(null);
  
  const [flashingPositions, setFlashingPositions] = useState<Map<number, number>>(new Map());
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  
  const { gl, camera } = useThree();
  const { dayMap, nightMap, cloudsMap, normalMap, specularMap, isLoading, progress, updateResolution } = useEarthTextures();

  // 使用新的 useEarthPosition hook
  const {
    focusPosition,
    resetPosition,
    updateRotation,
    isRotating,
    lastPosition,
    latLongToVector3
  } = useEarthPosition({
    earthRef,
    groupRef,
    markersGroupRef,
    camera,
    controlsRef
  });

  // 监听相机距离变化
  useEffect(() => {
    const handleCameraChange = () => {
      if (camera) {
        const distance = camera.position.length();
        updateResolution(distance);
      }
    };

    if (controlsRef?.current) {
      controlsRef.current.addEventListener('change', handleCameraChange);
    }

    return () => {
      if (controlsRef?.current) {
        controlsRef.current.removeEventListener('change', handleCameraChange);
      }
    };
  }, [camera, controlsRef, updateResolution]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focusPosition: (lat: number, lng: number) => {
      setIsAutoRotating(false);
      focusPosition(lat, lng);
    },
    resetPosition: () => {
      resetPosition();
      setIsAutoRotating(autoRotate);
    }
  }), [autoRotate, focusPosition, resetPosition]);

  // 根据设备性能动态调整几何体分段数
  const segments = useMemo(() => {
    const performance = gl.capabilities.maxTextureSize >= 4096 ? 'high' : 'low';
    return performance === 'high' ? 64 : 32;
  }, [gl.capabilities.maxTextureSize]);

  // 创建自定义着色器材质
  const dayNightMaterial = useMemo(() => {
    if (!dayMap || !nightMap) return null;
    
    return new ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        sunDirection: { value: new Vector3(5, 0, 0).normalize() }
      },
      vertexShader: `
        varying vec3 vNormal;
            varying vec2 vUv;
            
            void main() {
          vNormal = normalize(normalMatrix * normal);
              vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
            uniform vec3 sunDirection;
        varying vec3 vNormal;
            varying vec2 vUv;
            
            void main() {
          // 计算每个点接收到的光照强度
          float intensity = dot(normalize(vNormal), normalize(sunDirection));
          
          // 使用平滑过渡
          float dayMix = smoothstep(-0.2, 0.4, intensity);
          
          // 采样日夜纹理
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          
          // 混合日夜颜色
          vec4 color = mix(nightColor, dayColor, dayMix);
              
              gl_FragColor = color;
            }
      `,
      transparent: true
    });
  }, [dayMap, nightMap]);

  // 动画循环
  useFrame((state, delta) => {
    if (!earthRef.current || !groupRef.current) return;

    // 处理旋转动画
    if (isRotating) {
      updateRotation(delta);
    }

    // 自动旋转
    if (isAutoRotating && !isRotating) {
      const rotationSpeed = 0.1 * delta;
      earthRef.current.rotation.y += rotationSpeed;
      
      // 同步更新组和标记的旋转
      if (groupRef.current) {
        groupRef.current.rotation.y += rotationSpeed;
      }
      if (markersGroupRef.current) {
        markersGroupRef.current.rotation.y += rotationSpeed;
      }
    }

    // 更新闪烁效果
    if (lastPosition) {
      setFlashingPositions(prev => {
        const newMap = new Map(prev);
        const age = (Date.now() - lastPosition.timestamp) / 1000;
        const fadeOutDuration = 2;
        
        if (age <= fadeOutDuration) {
          const fadeOut = 1 - (age / fadeOutDuration);
          const pulse = Math.sin(age * Math.PI * 3) * 0.2 + 0.8;
          newMap.set(lastPosition.timestamp, fadeOut * pulse);
          return newMap;
        } else {
          newMap.delete(lastPosition.timestamp);
          return newMap;
        }
      });
    }
  });

  if (isLoading || !dayMap || !nightMap || !cloudsMap || !normalMap || !specularMap || !dayNightMaterial) {
    return <LoadingSpinner progress={progress} />;
  }

  return (
    <group ref={groupRef}>
      {/* 环境光 */}
      <ambientLight intensity={0.2} />
      
      {/* 主光源（太阳光）- 从右侧照射 */}
      <directionalLight 
        position={[5, 0, 0]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* 补光 */}
      <hemisphereLight
        args={[new Color("#ffffff"), new Color("#222222"), 0.3]}
      />

      {/* 大气层 */}
      <mesh ref={atmosphereRef} scale={1.025}>
        <sphereGeometry args={[1, segments, segments]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.2}
          color={new Color("#88ccff")}
          side={BackSide}
          blending={AdditiveBlending}
          roughness={1}
          metalness={0}
          clearcoat={0.5}
          clearcoatRoughness={0}
          transmission={0.6}
          thickness={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* 地球本体（使用自定义着色器材质） */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, segments, segments]} />
        <primitive object={dayNightMaterial} attach="material" />
      </mesh>

      {/* 云层 */}
      <mesh ref={cloudsRef} scale={1.003}>
        <sphereGeometry args={[1, segments, segments]} />
        <meshPhysicalMaterial
          map={cloudsMap}
          transparent
          opacity={0.4}
          depthWrite={false}
          side={DoubleSide}
          roughness={1}
          metalness={0}
          clearcoat={0.1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* 位置标记组 */}
      <group ref={markersGroupRef}>
        {positions.map((pos) => {
          const position = latLongToVector3(pos.lat, pos.lng, 1.02);
          const flashOpacity = flashingPositions.get(pos.timestamp) || 0;
          const isFlashing = flashOpacity > 0;
          
        return (
            <group key={pos.timestamp} position={position}>
              <mesh>
                <sphereGeometry args={[0.01, 16, 16]} />
                <meshBasicMaterial
                  color={isFlashing ? "#ffff00" : "#ff3300"}
                  opacity={isFlashing ? flashOpacity : 0.8}
                  transparent
                  depthWrite={false}
                />
              </mesh>
              {isFlashing && (
                <>
                  <mesh>
                    <ringGeometry args={[0.02 + (1 - flashOpacity) * 0.03, 0.025 + (1 - flashOpacity) * 0.03, 32]} />
                    <meshBasicMaterial
                      color="#ffff00"
                      transparent
                      opacity={flashOpacity * 0.5}
                      blending={AdditiveBlending}
                      side={DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                  <mesh>
                    <ringGeometry args={[0.015 + (1 - flashOpacity) * 0.02, 0.02 + (1 - flashOpacity) * 0.02, 32]} />
                    <meshBasicMaterial
                      color="#ffffff"
                      transparent
                      opacity={flashOpacity * 0.3}
                      blending={AdditiveBlending}
                      side={DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                </>
            )}
          </group>
        );
      })}

        {/* 用户位置标记 */}
        {userLocation && (
          <group position={latLongToVector3(userLocation.lat, userLocation.lng, 1.02)}>
            <mesh>
              <sphereGeometry args={[0.012, 16, 16]} />
              <meshBasicMaterial
                color="#00ff88"
                transparent
                opacity={0.8}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.02, 0.025, 32]} />
              <meshBasicMaterial
                color="#00ff88"
                transparent
                opacity={0.4}
                blending={AdditiveBlending}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.03, 0.035, 32]} />
              <meshBasicMaterial
                color="#00ff88"
                transparent
                opacity={0.2 + Math.sin(Date.now() * 0.003) * 0.1}
                blending={AdditiveBlending}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
});