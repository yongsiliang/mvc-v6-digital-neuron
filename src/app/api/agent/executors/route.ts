/**
 * 执行器信息 API
 * 
 * 返回所有可用执行器的信息
 */

import { NextResponse } from 'next/server';
import { getExecutorManager } from '@/lib/action/executor-manager';

export async function GET() {
  try {
    const manager = getExecutorManager();
    const executors = manager.getExecutors();
    
    return NextResponse.json({
      success: true,
      executors: executors.map(e => ({
        type: e.type,
        name: e.capabilities.name,
        description: e.capabilities.description,
        supportedActions: e.capabilities.supportedActions
      }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executors: []
    }, { status: 500 });
  }
}
