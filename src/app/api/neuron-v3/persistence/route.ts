import { NextRequest, NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/persistence
 * 获取持久化状态统计
 */
export async function GET() {
  try {
    const neuronSystem = getNeuronSystemV3();
    const stats = await neuronSystem.getPersistenceStats();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        stateLoaded: neuronSystem.isStateLoaded(),
      },
    });
  } catch (error) {
    console.error('Failed to get persistence stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get persistence stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neuron-v3/persistence
 * 管理持久化状态
 * 
 * Body:
 * - action: 'save' | 'clear'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    const neuronSystem = getNeuronSystemV3();
    
    switch (action) {
      case 'save': {
        const success = await neuronSystem.forceSave();
        return NextResponse.json({
          success,
          message: success ? 'State saved successfully' : 'Failed to save state',
        });
      }
      
      case 'clear': {
        const success = await neuronSystem.clearPersistedState();
        return NextResponse.json({
          success,
          message: success ? 'State cleared successfully' : 'Failed to clear state',
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "save" or "clear"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Persistence operation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Persistence operation failed' },
      { status: 500 }
    );
  }
}
