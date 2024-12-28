"use client";

import { useEffect, useRef, useState } from "react";

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

export function useRealtimeSync() {
  const [positions, setPositions] = useState<Position[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    console.log('尝试连接 WebSocket:', wsUrl);

    if (!wsUrl) {
      console.error('WebSocket URL 未定义');
      return;
    }

    // 创建 WebSocket 连接
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
          console.log('更新位置列表:', data.positions);
          setPositions(data.positions);
        } else if (data.type === 'newPosition') {
          console.log('添加新位置:', data.position);
          setPositions(prev => [...prev, data.position]);
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
      console.log('WebSocket 连接已关闭');
      setIsConnected(false);
    };

    // 清理函数
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const addPosition = (position: Position) => {
    console.log('准备发送新位置:', position);
    console.log('WebSocket 状态:', wsRef.current?.readyState);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'addPosition',
        position
      };
      console.log('发送消息:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket 未连接，无法发送位置');
    }
  };

  return {
    positions,
    addPosition,
    isConnected
  };
} 