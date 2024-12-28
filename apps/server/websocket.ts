import { WebSocketServer, WebSocket } from 'ws';
import { Position } from '@countdown3d/shared';
import { readPositions, addPosition } from './db/mongodb';

// 存储所有连接的客户端
const clients = new Set<WebSocket>();

// 广播位置更新给所有客户端
function broadcastPositions(positions: Position[]) {
  const message = JSON.stringify({
    type: 'positions',
    data: positions
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 创建 WebSocket 服务器
export function createWebSocketServer(port: number = 3001) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', async (ws) => {
    console.log('客户端已连接');
    clients.add(ws);

    try {
      // 发送初始位置数据
      const positions = await readPositions();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'positions',
          data: positions
        }));
      }
    } catch (error) {
      console.error('发送初始位置数据失败:', error);
    }

    // 处理客户端断开连接
    ws.on('close', () => {
      console.log('客户端已断开连接');
      clients.delete(ws);
    });

    // 处理错误
    ws.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      clients.delete(ws);
    });
  });

  console.log(`WebSocket 服务器运行在端口 ${port}`);
  return wss;
}

// 添加新位置并广播
export async function handleNewPosition(position: Position) {
  try {
    await addPosition(position);
    const positions = await readPositions();
    broadcastPositions(positions);
  } catch (error) {
    console.error('添加位置失败:', error);
    throw error;
  }
} 