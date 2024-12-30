"use client";

import { useCallback, useRef, useState, useEffect } from 'react';
import { Camera, Euler, Group, Mesh, Quaternion, Vector3, MathUtils, Matrix4 } from 'three';
import type { OrbitControls as DreiOrbitControls } from '@react-three/drei';

interface UseEarthPositionProps {
  earthRef: React.RefObject<Mesh>;
  groupRef: React.RefObject<Group>;
  markersGroupRef: React.RefObject<Group>;
  camera: Camera;
  controlsRef: React.RefObject<DreiOrbitControls> | undefined;
}

interface EarthPosition {
  lat: number;
  lng: number;
  rotation: Quaternion;
  timestamp: number;
}

const EARTH_RADIUS = 1;
const EARTH_TILT = 23.5;

export function useEarthPosition({
  earthRef,
  groupRef,
  markersGroupRef,
}: UseEarthPositionProps) {
  const [isRotating, setIsRotating] = useState(false);
  const lastPositionRef = useRef<EarthPosition | null>(null);
  const targetRotationRef = useRef<Quaternion | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // 记录当前地球位置和旋转状态
  const currentPositionRef = useRef<EarthPosition>({
    lat: 0,
    lng: 0,
    rotation: new Quaternion().setFromEuler(new Euler(MathUtils.degToRad(EARTH_TILT), 0, 0, 'XYZ')),
    timestamp: Date.now()
  });

  // 验证和规范化经纬度
  const normalizeCoordinates = useCallback((lat: number, lng: number) => {
    // 确保纬度在 -90 到 90 度之间
    const normalizedLat = Math.max(-90, Math.min(90, lat));
    
    // 确保经度在 -180 到 180 度之间
    let normalizedLng = lng % 360;
    if (normalizedLng > 180) {
      normalizedLng -= 360;
    } else if (normalizedLng < -180) {
      normalizedLng += 360;
    }
    
    return { lat: normalizedLat, lng: normalizedLng };
  }, []);

  // 将经纬度转换为3D坐标
  const latLongToVector3 = useCallback((lat: number, lng: number): Vector3 => {
    // 将经纬度转换为弧度
    const latRad = MathUtils.degToRad(90 - lat); // 转换为极角 θ (0° at pole, 90° at equator)
    const lngRad = MathUtils.degToRad(lng);      // 方位角 φ
    
    // 使用标准球坐标系公式
    // x = R * sin(θ) * cos(φ)
    // y = R * cos(θ)
    // z = R * sin(θ) * sin(φ)
    const x = EARTH_RADIUS * Math.sin(latRad) * Math.cos(lngRad);
    const y = EARTH_RADIUS * Math.cos(latRad);
    const z = EARTH_RADIUS * Math.sin(latRad) * Math.sin(lngRad);
    
    return new Vector3(x, y, z);
  }, []);

  // 计算旋转
  const calculateRotation = useCallback((lat: number, lng: number): Quaternion => {
    // 规范化坐标
    const { lat: normalizedLat, lng: normalizedLng } = normalizeCoordinates(lat, lng);
    
    // 创建四元数
    const quaternion = new Quaternion();
    
    // 1. 首先应用地球倾斜角度
    quaternion.setFromEuler(new Euler(MathUtils.degToRad(EARTH_TILT), 0, 0));
    
    // 2. 应用经度旋转（绕Y轴）
    const lngQuaternion = new Quaternion();
    lngQuaternion.setFromEuler(new Euler(0, MathUtils.degToRad(normalizedLng), 0));
    quaternion.multiply(lngQuaternion);
    
    // 3. 应用纬度旋转（绕X轴）
    const latQuaternion = new Quaternion();
    latQuaternion.setFromEuler(new Euler(MathUtils.degToRad(-normalizedLat), 0, 0));
    quaternion.multiply(latQuaternion);
    
    // 4. 添加180度Y轴旋转以调整方向
    const adjustQuaternion = new Quaternion();
    adjustQuaternion.setFromEuler(new Euler(0, Math.PI, 0));
    quaternion.multiply(adjustQuaternion);
    
    return quaternion;
  }, [normalizeCoordinates]);

  // 更新旋转动画
  const updateRotation = useCallback((delta: number = 0.016) => {
    if (!earthRef.current || !targetRotationRef.current) return false;

    const rotationSpeed = 0.5 * delta; // 进一步降低旋转速度
    const currentRotation = earthRef.current.quaternion;
    
    // 使用slerp进行平滑插值
    currentRotation.slerp(targetRotationRef.current, rotationSpeed);
    
    // 同步更新组和标记的旋转
    if (groupRef.current) {
      groupRef.current.quaternion.copy(currentRotation);
    }
    if (markersGroupRef.current) {
      markersGroupRef.current.quaternion.copy(currentRotation);
    }

    // 检查是否接近目标旋转
    const isComplete = currentRotation.angleTo(targetRotationRef.current) < 0.0001; // 进一步提高精度
    if (isComplete) {
      setIsRotating(false);
      targetRotationRef.current = null;
    }
    
    return !isComplete;
  }, [earthRef, groupRef, markersGroupRef]);

  // 动画循环
  const animate = useCallback(() => {
    if (updateRotation()) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameRef.current = null;
    }
  }, [updateRotation]);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 设置地球旋转以显示目标位置
  const focusPosition = useCallback((lat: number, lng: number) => {
    if (!earthRef.current || !groupRef.current) {
      console.warn('地球模型或组引用未准备好:', {
        earthRef: !!earthRef.current,
        groupRef: !!groupRef.current
      });
      return;
    }

    // 规范化坐标
    const { lat: normalizedLat, lng: normalizedLng } = normalizeCoordinates(lat, lng);
    
    // 如果位置未改变，则不更新
    if (currentPositionRef.current.lat === normalizedLat && 
        currentPositionRef.current.lng === normalizedLng) {
      console.log('位置未改变，跳过更新');
      return;
    }

    console.log('目标位置:', { lat: normalizedLat, lng: normalizedLng });

    // 计算目标旋转四元数
    const targetRotation = calculateRotation(normalizedLat, normalizedLng);
    targetRotationRef.current = targetRotation;

    // 确保四元数是有效的
    if (isNaN(targetRotation.x) || isNaN(targetRotation.y) || 
        isNaN(targetRotation.z) || isNaN(targetRotation.w)) {
      console.error('计算出的四元数无效:', targetRotation);
      return;
    }

    setIsRotating(true);

    // 立即应用一个小的旋转以确保动画开始
    earthRef.current.quaternion.slerp(targetRotation, 0.05);

    // 开始动画
    if (animationFrameRef.current === null) {
      animate();
    }

    // 更新当前位置记录
    const newPosition = {
      lat: normalizedLat,
      lng: normalizedLng,
      rotation: targetRotation,
      timestamp: Date.now()
    };
    
    lastPositionRef.current = newPosition;
    currentPositionRef.current = newPosition;

    // 输出调试信息
    const euler = new Euler().setFromQuaternion(targetRotation);
    console.log('旋转信息:', {
      lat: normalizedLat,
      lng: normalizedLng,
      euler: {
        x: MathUtils.radToDeg(euler.x),
        y: MathUtils.radToDeg(euler.y),
        z: MathUtils.radToDeg(euler.z)
      },
      quaternion: {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        w: targetRotation.w
      }
    });
  }, [earthRef, groupRef, calculateRotation, normalizeCoordinates, animate]);

  // 重置位置
  const resetPosition = useCallback(() => {
    if (!earthRef.current || !groupRef.current) return;

    // 重置到初始位置
    const initialRotation = new Quaternion().setFromEuler(
      new Euler(MathUtils.degToRad(EARTH_TILT), 0, 0, 'XYZ')
    );
    
    targetRotationRef.current = initialRotation;
    setIsRotating(true);

    // 开始动画
    if (animationFrameRef.current === null) {
      animate();
    }

    // 重置当前位置记录
    const newPosition = {
      lat: 0,
      lng: 0,
      rotation: initialRotation,
      timestamp: Date.now()
    };
    
    lastPositionRef.current = newPosition;
    currentPositionRef.current = newPosition;
  }, [earthRef, groupRef, animate]);

  return {
    focusPosition,
    resetPosition,
    latLongToVector3,
    updateRotation,
    isRotating,
    lastPosition: lastPositionRef.current,
    currentPosition: currentPositionRef.current
  };
}