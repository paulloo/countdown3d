"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const wsRef = useRef<WebSocket | null>(null);
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
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    console.log('尝试连接 WebSocket:', wsUrl);

    let reconnectTimeout: NodeJS.Timeout;
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket 连接已建立');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('收到消息:', data);

            if (data.type === 'positions') {
              const positions = data.data as ClickPosition[];
              setClickEffects(positions);
            }
          } catch (error) {
            console.error('处理消息时出错:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket 错误:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket 连接已关闭，5秒后重试');
          setIsConnected(false);
          // 设置重连
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('创建 WebSocket 连接失败:', error);
        // 设置重连
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const recordCurrentLocation = async () => {
    try {
      const location = await getUserLocation();
      await sendClickEffect(location);
      toast.success('位置已记录');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '记录位置失败');
      throw error; // 重新抛出错误，让调用者知道操作失败
    }
  };

  const sendClickEffect = async (position: { lat: number; lng: number }) => {
    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...position,
          timestamp: Date.now()
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '添加位置失败');
      }

      console.log('位置已添加:', data);
      return data;
    } catch (error) {
      console.error('发送点击效果失败:', error);
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