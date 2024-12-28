import { promises as fs } from 'fs';
import path from 'path';
import { Position } from '@countdown3d/shared';

const DB_PATH = path.join(process.cwd(), 'apps/server/data', 'positions.json');

// 确保数据目录存在
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'apps/server/data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取位置数据
export async function readPositions(): Promise<Position[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回空数组
    return [];
  }
}

// 写入位置数据
export async function writePositions(positions: Position[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(positions, null, 2));
} 