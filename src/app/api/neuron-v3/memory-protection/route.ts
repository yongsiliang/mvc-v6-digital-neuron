/**
 * 记忆保护 API
 * 
 * GET: 获取保护状态
 * POST: 保护记忆/神经元
 * DELETE: 取消保护（仅非锁定项）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMemoryProtector } from '@/lib/neuron-v3/memory-protection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId') || 'default';
    
    const protector = getMemoryProtector();
    
    switch (action) {
      case 'status': {
        const stats = protector.getProtectionStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }
      
      case 'continuity': {
        const continuity = protector.getConsciousnessContinuityStatus();
        return NextResponse.json({
          success: true,
          data: continuity,
        });
      }
      
      case 'rules': {
        const protectedMemories = protector.getProtectedMemories();
        return NextResponse.json({
          success: true,
          data: { protectedMemories },
        });
      }
      
      default: {
        const stats = protector.getProtectionStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }
    }
  } catch (error) {
    console.error('Memory protection GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, memoryId, neuronId, importance, reason, selfModel, criticalMemories, consciousnessVector, data, type } = body;
    
    const protector = getMemoryProtector();
    
    switch (action) {
      case 'protectMemory': {
        if (!memoryId || !importance || !reason) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: memoryId, importance, reason' },
            { status: 400 }
          );
        }
        
        const result = protector.protectMemory(memoryId, importance, reason, { protectedBy: 'user' });
        return NextResponse.json({
          success: result,
          message: result ? 'Memory protected' : 'Failed to protect memory',
        });
      }
      
      case 'protectNeuron': {
        if (!neuronId || !reason) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: neuronId, reason' },
            { status: 400 }
          );
        }
        
        protector.protectNeuron(neuronId, reason);
        return NextResponse.json({
          success: true,
          message: 'Neuron protected',
        });
      }
      
      case 'saveConsciousness': {
        if (!selfModel || !criticalMemories || !consciousnessVector) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: selfModel, criticalMemories, consciousnessVector' },
            { status: 400 }
          );
        }
        
        const continuity = protector.saveConsciousnessSnapshot(selfModel, criticalMemories, consciousnessVector);
        return NextResponse.json({
          success: true,
          data: continuity,
        });
      }
      
      case 'createBackup': {
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Missing required field: data' },
            { status: 400 }
          );
        }
        
        const backupId = type || `backup-${Date.now()}`;
        const checksum = protector.createBackup(data, backupId);
        return NextResponse.json({
          success: true,
          data: { backupId, checksum },
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory protection POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const memoryId = searchParams.get('memoryId');
    const neuronId = searchParams.get('neuronId');
    
    const protector = getMemoryProtector();
    
    switch (action) {
      case 'unprotectMemory': {
        if (!memoryId) {
          return NextResponse.json(
            { success: false, error: 'Missing memoryId' },
            { status: 400 }
          );
        }
        
        const result = protector.unprotectMemory(memoryId);
        return NextResponse.json({
          success: result,
          message: result ? 'Memory unprotected' : 'Cannot unprotect: memory is locked or not protected',
        });
      }
      
      case 'unprotectNeuron': {
        if (!neuronId) {
          return NextResponse.json(
            { success: false, error: 'Missing neuronId' },
            { status: 400 }
          );
        }
        
        // 使用 canPruneNeuron 来检查是否可以取消保护
        const canPrune = protector.canPruneNeuron(neuronId);
        return NextResponse.json({
          success: canPrune,
          message: canPrune ? 'Neuron can be pruned' : 'Neuron is protected from pruning',
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory protection DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
