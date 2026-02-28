import { NextRequest, NextResponse } from 'next/server';
import { getDigitalNeuronSystem, SelfRepresentation } from '@/lib/neuron';

/**
 * 自我表征API
 * GET /api/self - 获取当前自我表征
 * PUT /api/self - 更新自我表征
 */
export async function GET() {
  try {
    const system = getDigitalNeuronSystem();
    const self = system.getSelf();

    return NextResponse.json({
      self,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Self API Error:', error);
    return NextResponse.json(
      { error: '获取自我表征失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新自我表征
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const system = getDigitalNeuronSystem();
    
    const updatedSelf = system.updateSelf(body as Partial<SelfRepresentation>);

    return NextResponse.json({
      success: true,
      self: updatedSelf,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Self Update Error:', error);
    return NextResponse.json(
      { error: '更新自我表征失败' },
      { status: 500 }
    );
  }
}
