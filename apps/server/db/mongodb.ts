import { MongoClient, Collection } from 'mongodb';
import { Position, config } from '@countdown3d/shared';

let client: MongoClient | null = null;
let positionsCollection: Collection<Position> | null = null;
let isConnecting = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 连接到 MongoDB
export async function connectToDatabase(retryCount = 0): Promise<{ client: MongoClient; positionsCollection: Collection<Position> }> {
  if (client && positionsCollection) {
    return { client, positionsCollection };
  }

  if (isConnecting) {
    await delay(100); // 等待其他连接尝试
    return connectToDatabase(retryCount);
  }

  try {
    isConnecting = true;
    console.log('正在连接到MongoDB...', config.mongodb.uri);
    
    client = new MongoClient(config.mongodb.uri);
    await client.connect();
    
    const db = client.db(config.mongodb.dbName);
    positionsCollection = db.collection<Position>(config.mongodb.collection);
    
    console.log('MongoDB连接成功！');
    return { client, positionsCollection };
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`尝试重新连接 (${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY);
      return connectToDatabase(retryCount + 1);
    }
    
    throw new Error(`无法连接到MongoDB: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    isConnecting = false;
  }
}

// 读取所有位置
export async function readPositions(): Promise<Position[]> {
  try {
    const { positionsCollection } = await connectToDatabase();
    return await positionsCollection.find().sort({ timestamp: -1 }).toArray();
  } catch (error) {
    console.error('读取位置失败:', error);
    throw new Error('读取位置失败');
  }
}

// 添加新位置
export async function addPosition(position: Position): Promise<void> {
  try {
    const { positionsCollection } = await connectToDatabase();
    await positionsCollection.insertOne(position);
  } catch (error) {
    console.error('添加位置失败:', error);
    throw new Error('添加位置失败');
  }
}

// 检查位置是否太近
export function isPositionTooClose(pos1: Position, pos2: Position, minDistanceKm: number = 50): boolean {
  const R = 6371; // 地球半径（公里）
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance < minDistanceKm;
}

// 确保在进程退出时关闭连接
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB连接已关闭');
  }
  process.exit(0);
}); 