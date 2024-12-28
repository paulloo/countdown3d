import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'countdown3d',
    collection: process.env.MONGODB_COLLECTION || 'positions',
  },
  server: {
    port: parseInt(process.env.SERVER_PORT || '3001', 10),
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
  app: {
    isTestEnv: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true',
  }
} as const; 