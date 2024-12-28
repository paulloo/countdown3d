import { createWebSocketServer } from './websocket';
import { config } from '@countdown3d/shared';

// 启动 WebSocket 服务器
createWebSocketServer(config.server.port); 