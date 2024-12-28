"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";

interface LocationInfoProps {
  lat: number;
  lng: number;
  timestamp: number;
  position: THREE.Vector3;
}

export function LocationInfo({ lat, lng, timestamp, position }: LocationInfoProps) {
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleString();

  return (
    <Html position={position}>
      <div className="bg-black/80 text-white p-2 rounded-lg text-sm min-w-[200px] backdrop-blur-sm">
        <div className="font-bold mb-1">位置信息</div>
        <div>纬度: {lat.toFixed(2)}°</div>
        <div>经度: {lng.toFixed(2)}°</div>
        <div>时间: {formattedDate}</div>
      </div>
    </Html>
  );
} 