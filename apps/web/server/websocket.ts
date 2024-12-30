import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { config } from '@countdown3d/shared';
import type { Position } from '@countdown3d/shared';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const dir = path.join(process.cwd(), 'apps/web');
const app = next({ dev, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: config.server.wsUrl,
      methods: ['GET', 'POST']
    }
  });

  // 存储最近的位置记录
  const positions = new Map<number, Position>();

  io.on('connection', (socket) => {
    console.log('新的客户端连接');

    // 发送当前所有位置给新连接的客户端
    const currentPositions = Array.from(positions.values());
    socket.emit('positions', currentPositions);

    socket.on('position', (position: Position) => {
      console.log('收到位置:', position);
      positions.set(position.timestamp, position);

      // 清理超过 5 分钟的位置记录
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      Array.from(positions.entries()).forEach(([timestamp]) => {
        if (timestamp < fiveMinutesAgo) {
          positions.delete(timestamp);
        }
      });

      // 广播新位置给所有客户端
      io.emit('positions', Array.from(positions.values()));
    });

    socket.on('disconnect', () => {
      console.log('客户端断开连接');
    });
  });

  const port = config.server.port;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 