/**
 * ═══════════════════════════════════════════════════════════════════════
 * Resonance Engine API
 * 
 * 提供共振引擎的交互接口：
 * - 获取当前状态
 * - 步进更新
 * - 学习反馈
 * - 子系统激活
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getSharedResonanceEngine,
  resetSharedResonanceEngine,
  SubsystemType,
  ProcessingFeedback
} from '@/lib/neuron-v6/resonance-engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  const engine = getSharedResonanceEngine();
  
  switch (action) {
    case 'state':
      return NextResponse.json({
        success: true,
        data: engine.getState(),
      });
      
    case 'visualization':
      return NextResponse.json({
        success: true,
        data: engine.getVisualizationData(),
      });
      
    case 'reset':
      resetSharedResonanceEngine();
      return NextResponse.json({
        success: true,
        message: '共振引擎已重置',
      });
      
    default:
      return NextResponse.json({
        success: true,
        data: engine.getVisualizationData(),
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    const engine = getSharedResonanceEngine();
    
    switch (action) {
      case 'step': {
        // 执行一步更新
        const externalInput = data?.externalInput 
          ? new Map(Object.entries(data.externalInput) as [SubsystemType, number][])
          : undefined;
        
        const state = engine.injectInput(externalInput || new Map());
        
        return NextResponse.json({
          success: true,
          data: state,
        });
      }
      
      case 'steps': {
        // 执行多步更新
        const count = data?.count || 10;
        const results = [];
        
        for (let i = 0; i < count; i++) {
          const state = engine.step();
          results.push({
            timeStep: state.timeStep,
            synchronyIndex: state.synchronyIndex,
            isResonant: state.isResonant,
            isLocked: state.resonance.isLocked,
          });
        }
        
        const finalState = engine.getState();
        
        return NextResponse.json({
          success: true,
          data: {
            results,
            finalState,
            visualization: engine.getVisualizationData(),
          },
        });
      }
      
      case 'learn': {
        // 学习反馈
        const feedback: ProcessingFeedback = {
          success: data?.success ?? true,
          satisfaction: data?.satisfaction ?? 0,
          processingTime: data?.processingTime,
        };
        
        engine.learn(feedback);
        
        return NextResponse.json({
          success: true,
          message: '学习更新完成',
          data: engine.getState(),
        });
      }
      
      case 'activate': {
        // 激活子系统
        const { subsystem, intensity } = data;
        
        if (!subsystem) {
          return NextResponse.json({
            success: false,
            error: '缺少子系统类型',
          }, { status: 400 });
        }
        
        engine.activateSubsystem(subsystem as SubsystemType, intensity || 1.0);
        
        return NextResponse.json({
          success: true,
          message: `已激活子系统: ${subsystem}`,
          data: engine.getState(),
        });
      }
      
      case 'run-until-resonance': {
        // 运行直到共振锁定
        const maxSteps = data?.maxSteps || 1000;
        const steps: Array<{
          timeStep: number;
          synchronyIndex: number;
          isLocked: boolean;
        }> = [];
        
        for (let i = 0; i < maxSteps; i++) {
          const state = engine.step();
          
          steps.push({
            timeStep: state.timeStep,
            synchronyIndex: state.synchronyIndex,
            isLocked: state.resonance.isLocked,
          });
          
          if (state.resonance.isLocked) {
            break;
          }
        }
        
        const finalState = engine.getState();
        
        return NextResponse.json({
          success: true,
          data: {
            steps,
            totalSteps: steps.length,
            locked: finalState.resonance.isLocked,
            lockedPeriod: finalState.resonance.lockedPeriod,
            lockedFrequency: finalState.resonance.lockedFrequency,
            visualization: engine.getVisualizationData(),
          },
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: '未知操作',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Resonance API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
