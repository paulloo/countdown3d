import { type NextRequest } from 'next/server';
import type { Position } from '@countdown3d/shared';

// 存储所有连接的客户端
const clients = new Set<WebSocket>();

// 存储最近的位置记录
const positions = new Map<number, Position>();

export async function GET(request: NextRequest) {
  if (!request.headers.get('upgrade')?.includes('websocket')) {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  try {
    const { socket, response } = await new Promise<{ socket: WebSocket; response: Response }>((resolve) => {
      const { 0: client, 1: server } = new WebSocketPair();

      server.onopen = () => {
        console.log('新的客户端连接');
        clients.add(server);

        // 发送当前所有位置给新连接的客户端
        const currentPositions = Array.from(positions.values());
        server.send(JSON.stringify({ type: 'positions', data: currentPositions }));
      };

      server.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('收到消息:', data);

          if (data.type === 'position') {
            const position: Position = data.data;
            positions.set(position.timestamp, position);

            // 清理超过 5 分钟的位置记录
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            Array.from(positions.entries()).forEach(([timestamp]) => {
              if (timestamp < fiveMinutesAgo) {
                positions.delete(timestamp);
              }
            });

            // 广播新位置给所有客户端
            const broadcast = JSON.stringify({
              type: 'positions',
              data: Array.from(positions.values())
            });

            Array.from(clients).forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcast);
              }
            });
          }
        } catch (error) {
          console.error('处理消息时出错:', error);
        }
      };

      server.onclose = () => {
        console.log('客户端断开连接');
        clients.delete(server);
      };

      server.onerror = (event: Event) => {
        console.error('WebSocket 错误:', event);
        clients.delete(server);
      };

      resolve({
        socket: client,
        response: new Response(null, {
          status: 101,
          webSocket: client
        })
      });
    });

    return response;
  } catch (err) {
    console.error('WebSocket 连接失败:', err);
    return new Response('WebSocket 连接失败', { status: 500 });
  }
} 