"use client";

import { useCallback, useState } from "react";
import * as THREE from "three";

interface ClickPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

export function useEarthInteraction() {
  const [clickPositions, setClickPositions] = useState<ClickPosition[]>([]);

  const handleClick = useCallback((intersection: THREE.Intersection) => {
    console.log('处理点击事件:', intersection);
    
    if (!intersection.point) {
      console.error('点击位置无效');
      return;
    }
    
    // 将点击位置转换为球面坐标
    const point = intersection.point.clone().normalize();
    const lat = Math.asin(point.y) * (180 / Math.PI);
    const lng = Math.atan2(point.x, point.z) * (180 / Math.PI);

    const newPosition = {
      lat,
      lng,
      timestamp: Date.now(),
    };

    console.log('计算位置:', newPosition);
    setClickPositions(prev => [...prev, newPosition]);
    
    // 输出点击位置信息
    console.log(`点击位置: 纬度 ${lat.toFixed(2)}°, 经度 ${lng.toFixed(2)}°`);
    
    return { lat, lng };
  }, []);

  return {
    clickPositions,
    handleClick,
  };
} 