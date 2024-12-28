"use client";

import { useState, useEffect, useCallback } from 'react';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    // 连接 WebSocket
    function connect() {
      ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        console.log('WebSocket 已连接');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'positions') {
            setPositions(message.data);
          }
        } catch (err) {
          console.error('解析消息失败:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket 已断开');
        setIsConnected(false);
        // 尝试重新连接
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        setError('连接服务器失败');
      };
    }

    // 初始连接
    connect();

    // 清理函数
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return {
    positions,
    error,
    isConnected
  };
} 