import { Position } from '@countdown3d/shared';

// 添加新位置
export async function addPosition(position: Position) {
  try {
    const response = await fetch('/api/positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(position),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '添加位置失败');
    }

    return await response.json();
  } catch (error) {
    console.error('添加位置失败:', error);
    throw error;
  }
} 