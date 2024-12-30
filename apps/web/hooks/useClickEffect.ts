"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { config } from '@countdown3d/shared';
import type { Position } from '@countdown3d/shared';
import { io, Socket } from 'socket.io-client';

interface ClickPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

// 生成随机位置
function getRandomLocation() {
  return {
    lat: (Math.random() * 180 - 90) * 0.5, // -45 到 45，更合理的纬度范围
    lng: Math.random() * 360 - 180 // -180 到 180
  };
}

export function useClickEffect() {
  const [clickEffects, setClickEffects] = useState<ClickPosition[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const isTestEnv = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true';

  // 获取用户地理位置
  const getUserLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      // 如果是测试环境，返回随机位置
      if (isTestEnv) {
        const location = getRandomLocation();
        setUserLocation(location);
        resolve(location);
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('您的浏览器不支持地理位置功能'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          reject(new Error('获取位置失败: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  useEffect(() => {
    // 连接 Socket.IO
    const socket = io(config.server.wsUrl, {
      transports: ['websocket'],
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('Socket.IO 连接已建立');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO 连接已断开');
      setIsConnected(false);
    });

    socket.on('positions', (positions: Position[]) => {
      console.log('收到位置更新:', positions);
      setClickEffects(positions);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO 连接错误:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const recordCurrentLocation = async () => {
    try {
      const location = await getUserLocation();
      
      // 通过 Socket.IO 发送位置
      if (socketRef.current?.connected) {
        const position: Position = {
          ...location,
          timestamp: Date.now()
        };
        socketRef.current.emit('position', position);
        toast.success('位置已记录');
        return location; // 返回位置信息
      } else {
        throw new Error('Socket.IO 未连接');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '记录位置失败');
      throw error;
    }
  };

  return {
    clickEffects,
    recordCurrentLocation,
    isConnected,
    userLocation,
    isTestEnv
  };
} 