"use client";

import { useCallback, useRef, useState } from 'react';
import { Camera, Euler, Group, Mesh, Quaternion, Vector3, MathUtils, Matrix4 } from 'three';
import type { OrbitControls } from '@react-three/drei';

interface UseEarthPositionProps {
  earthRef: React.RefObject<Mesh>;
  groupRef: React.RefObject<Group>;
  markersGroupRef: React.RefObject<Group>;
  camera: Camera;
  controlsRef: React.RefObject<OrbitControls> | undefined;
}

interface EarthPosition {
  lat: number;
  lng: number;
  rotation: Quaternion;
  timestamp: number;
}

export function useEarthPosition({
  earthRef,
  groupRef,
  markersGroupRef,
}: UseEarthPositionProps) {
  const [isRotating, setIsRotating] = useState(false);
  const lastPositionRef = useRef<EarthPosition | null>(null);
  const targetRotationRef = useRef<Quaternion | null>(null);
  
  // 记录当前地球位置和旋转状态
  const currentPositionRef = useRef<EarthPosition>({
    lat: 0,
    lng: 0,
    rotation: new Quaternion().setFromEuler(new Euler(MathUtils.degToRad(23.5), 0, 0, 'YXZ')),
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
  const latLongToVector3 = useCallback((lat: number, lng: number, radius: number = 1): Vector3 => {
    const phi = MathUtils.degToRad(90 - lat);
    const theta = MathUtils.degToRad(lng);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new Vector3(x, y, z);
  }, []);

  // 计算旋转
  const calculateRotation = useCallback((lat: number, lng: number): Quaternion => {
    // 规范化坐标
    const { lat: normalizedLat, lng: normalizedLng } = normalizeCoordinates(lat, lng);
    
    // 创建目标点的向量
    const targetPoint = latLongToVector3(normalizedLat, normalizedLng);
    
    // 创建旋转矩阵，使Z轴指向目标点
    const matrix = new Matrix4();
    matrix.lookAt(
      new Vector3(0, 0, 0), // 从原点
      targetPoint,          // 看向目标点
      new Vector3(0, 1, 0)  // 上方向
    );
    
    // 应用地球倾斜角度（23.5度）
    const tiltMatrix = new Matrix4().makeRotationX(MathUtils.degToRad(23.5));
    matrix.multiply(tiltMatrix);
    
    // 从矩阵创建四元数
    const quaternion = new Quaternion();
    quaternion.setFromRotationMatrix(matrix);
    
    return quaternion;
  }, [normalizeCoordinates, latLongToVector3]);

  // 更新旋转动画
  const updateRotation = useCallback((delta: number) => {
    if (!earthRef.current || !targetRotationRef.current) return;

    const rotationSpeed = 2.0 * delta;
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
    if (currentRotation.angleTo(targetRotationRef.current) < 0.01) {
      setIsRotating(false);
      targetRotationRef.current = null;
    }
  }, [earthRef, groupRef, markersGroupRef]);

  // 设置地球旋转以显示目标位置
  const focusPosition = useCallback((lat: number, lng: number) => {
    if (!earthRef.current || !groupRef.current) return;

    // 规范化坐标
    const { lat: normalizedLat, lng: normalizedLng } = normalizeCoordinates(lat, lng);
    
    // 如果位置未改变，则不更新
    if (currentPositionRef.current.lat === normalizedLat && 
        currentPositionRef.current.lng === normalizedLng) {
      return;
    }

    console.log('目标位置:', { lat: normalizedLat, lng: normalizedLng });

    // 计算目标旋转四元数
    const targetRotation = calculateRotation(normalizedLat, normalizedLng);
    targetRotationRef.current = targetRotation;
    setIsRotating(true);

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
    const euler = new Euler().setFromQuaternion(targetRotation, 'YXZ');
    console.log('旋转角度:', {
      lat: normalizedLat,
      lng: normalizedLng,
      x: MathUtils.radToDeg(euler.x) % 360,
      y: MathUtils.radToDeg(euler.y) % 360,
      z: MathUtils.radToDeg(euler.z) % 360,
      order: euler.order
    });
  }, [earthRef, groupRef, calculateRotation, normalizeCoordinates]);

  // 重置位置
  const resetPosition = useCallback(() => {
    if (!earthRef.current || !groupRef.current) return;

    // 重置到初始位置
    const initialRotation = new Quaternion().setFromEuler(
      new Euler(MathUtils.degToRad(23.5), 0, 0, 'YXZ')
    );
    
    targetRotationRef.current = initialRotation;
    setIsRotating(true);

    // 重置当前位置记录
    const newPosition = {
      lat: 0,
      lng: 0,
      rotation: initialRotation,
      timestamp: Date.now()
    };
    
    lastPositionRef.current = newPosition;
    currentPositionRef.current = newPosition;
  }, [earthRef, groupRef]);

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