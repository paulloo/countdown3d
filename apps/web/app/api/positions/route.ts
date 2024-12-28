import { NextResponse } from 'next/server';
import { handleNewPosition } from '@countdown3d/server/websocket';
import { Position } from '@countdown3d/shared';

// GET /api/positions
export async function GET() {
  try {
    const positions = await readPositions();
    return NextResponse.json(positions);
  } catch (error) {
    console.error('获取位置数据失败:', error);
    return NextResponse.json({ error: '获取位置数据失败' }, { status: 500 });
  }
}

// POST /api/positions
export async function POST(request: Request) {
  try {
    const position: Position = await request.json();
    await handleNewPosition(position);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('处理位置请求失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '添加位置失败' },
      { status: 500 }
    );
  }
} 