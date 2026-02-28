/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 神经网络初始化 API
 * V6 Neural Network Init API
 * 
 * 重置并重新初始化网络
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetAndInitialize, getInitializedNetwork } from '@/lib/neuron-v6/innate-knowledge';

/**
 * POST /api/neuron-v6/neural-init
 * 重置并重新初始化网络
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force ?? true;
    
    if (force) {
      // 强制重新初始化
      const result = resetAndInitialize();
      
      const network = getInitializedNetwork();
      const stats = network.getStats();
      
      return NextResponse.json({
        success: true,
        action: 'reset_and_initialize',
        result: {
          neuronsCreated: result.neuronsCreated,
          connectionsCreated: result.connectionsCreated,
          trapsRegistered: result.trapsRegistered,
        },
        currentStats: stats,
      });
    } else {
      // 获取当前状态
      const network = getInitializedNetwork();
      const stats = network.getStats();
      
      return NextResponse.json({
        success: true,
        action: 'get_status',
        currentStats: stats,
      });
    }
  } catch (error) {
    console.error('[API] 初始化网络失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neuron-v6/neural-init
 * 获取初始化状态
 */
export async function GET(request: NextRequest) {
  try {
    const network = getInitializedNetwork();
    const stats = network.getStats();
    
    return NextResponse.json({
      success: true,
      currentStats: stats,
    });
  } catch (error) {
    console.error('[API] 获取网络状态失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
