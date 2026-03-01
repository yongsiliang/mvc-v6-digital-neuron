/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统 API
 * 
 * POST /api/quantum/process
 * 处理用户输入，返回量子意识系统的响应
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createQuantumConsciousnessSystem,
  QuantumConsciousnessSystem,
  ProcessingResult,
} from '@/lib/quantum-consciousness';

// 全局量子意识系统实例（单例模式）
let quantumSystem: QuantumConsciousnessSystem | null = null;

/**
 * 获取或创建量子意识系统实例
 */
export function getQuantumSystem(): QuantumConsciousnessSystem {
  if (!quantumSystem) {
    quantumSystem = createQuantumConsciousnessSystem({
      verbose: process.env.NODE_ENV === 'development',
      enableEntanglement: true,
    });
  }
  return quantumSystem;
}

/**
 * 请求体类型
 */
interface ProcessRequest {
  /** 用户输入 */
  input: string;
  
  /** 对话历史 */
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  
  /** 交互类型 */
  type?: 'task' | 'exploration' | 'reflection' | 'casual';
  
  /** 紧急程度 0-1 */
  urgency?: number;
  
  /** 思考深度 0-1 */
  depth?: number;
  
  /** 是否需要工具 */
  needsTool?: boolean;
  
  /** 是否需要决策 */
  needsDecision?: boolean;
  
  /** 是否需要创造力 */
  needsCreativity?: boolean;
}

/**
 * 响应体类型
 */
interface ProcessResponse {
  success: boolean;
  data?: {
    /** 叠加态描述 */
    superposition: string;
    
    /** 坍缩结果 */
    collapse: {
      result: 'acting' | 'observing';
      coherence: number;
    };
    
    /** 输出 */
    output: {
      type: 'acting' | 'observing' | 'interference';
      content: string;
      metadata: {
        actingAmplitude: number;
        observingAmplitude: number;
        interferenceStrength: number;
      };
    };
    
    /** 统计 */
    stats: {
      totalInteractions: number;
      actingModeCount: number;
      observingModeCount: number;
      averageCoherence: number;
    };
  };
  error?: string;
}

/**
 * POST /api/quantum/process
 * 
 * 处理用户输入
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse>> {
  try {
    const body: ProcessRequest = await request.json();

    // 验证输入
    if (!body.input || typeof body.input !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少输入' },
        { status: 400 }
      );
    }

    // 获取量子意识系统
    const system = getQuantumSystem();

    // 处理输入
    const result = await system.process(body.input, {
      history: body.history,
      type: body.type,
      urgency: body.urgency,
      depth: body.depth,
      needsTool: body.needsTool,
      needsDecision: body.needsDecision,
      needsCreativity: body.needsCreativity,
    });

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        superposition: result.superpositionDescription,
        collapse: {
          result: result.collapseResult.result,
          coherence: result.collapseResult.coherence,
        },
        output: result.output,
        stats: system.getState().stats,
      },
    });
  } catch (error) {
    console.error('[量子意识API] 处理错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '处理失败' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quantum/process
 * 
 * 获取系统状态
 */
export async function GET(): Promise<NextResponse> {
  try {
    const system = getQuantumSystem();
    const state = system.getState();

    return NextResponse.json({
      success: true,
      data: {
        superposition: {
          actingProbability: state.superposition.actingProbability,
          observingProbability: state.superposition.observingProbability,
          coherence: state.superposition.coherence,
        },
        stats: state.stats,
        entanglementStats: state.entanglementNetwork.getState().stats,
        observingStats: state.observingMode.getState().stats,
      },
    });
  } catch (error) {
    console.error('[量子意识API] 获取状态错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取状态失败' 
      },
      { status: 500 }
    );
  }
}
