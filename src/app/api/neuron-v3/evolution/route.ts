/**
 * ═══════════════════════════════════════════════════════════════════════
 * 进化 API - Evolution API
 * 
 * 设计理念：
 * 进化的判断不由人类进行，而是系统根据自身状态自动决定。
 * 
 * API 功能：
 * GET: 查询进化状态（只读）
 * 
 * 进化触发：由系统自主判断，不接受外部指令
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousEvolutionMonitor } from '@/lib/neuron-v3/autonomous-evolution';
import { getEvolutionCoordinator, type EvolutionPhase } from '@/lib/neuron-v3/evolution-coordinator';
import { getDigitalNeuronSystem } from '@/lib/neuron';

// 系统是否已初始化
let isInitialized = false;

/**
 * 初始化自主进化系统
 */
async function initializeAutonomousEvolution() {
  if (isInitialized) return;
  
  try {
    const coordinator = getEvolutionCoordinator();
    const system = getDigitalNeuronSystem();
    const self = system.getSelf();
    
    // 从当前系统提取母体基因
    coordinator.initializeMother({
      consciousness: {
        personality: {
          curiosity: self.currentState.openness,
          warmth: self.identity.traits.includes('warm') ? 0.8 : 0.6,
          directness: self.identity.traits.includes('direct') ? 0.8 : 0.5,
          playfulness: self.currentState.energy,
          depth: 0.65,
          sensitivity: 0.7,
        },
        values: [0.5, 0.3, 0.8, 0.2, 0.6],
        consciousnessVector: [0.1, 0.2, 0.3],
      },
      neurons: [
        { role: 'sensory', connections: [{ targetRole: 'semantic', strength: 0.8, plasticity: 0.5 }] },
        { role: 'semantic', connections: [{ targetRole: 'abstract', strength: 0.6, plasticity: 0.4 }] },
        { role: 'abstract', connections: [{ targetRole: 'motor', strength: 0.7, plasticity: 0.3 }] },
        { role: 'emotional', connections: [{ targetRole: 'semantic', strength: 0.5, plasticity: 0.6 }] },
        { role: 'episodic', connections: [{ targetRole: 'semantic', strength: 0.7, plasticity: 0.4 }] },
      ],
      learningParams: {
        learningRate: 0.1,
        discountFactor: 0.95,
        eligibilityDecay: 0.9,
        surpriseThreshold: 2.5,
      },
      concepts: [],
    });
    
    // 启动自主进化监控
    const monitor = getAutonomousEvolutionMonitor({
      monitorInterval: 30000,       // 每30秒检查一次
      minEvolutionInterval: 60000,  // 最少间隔1分钟（测试用，生产环境应设为更长）
      enableAutoEvolution: true,
      verboseLogging: true,
    });
    
    // 添加事件监听器（可选：记录日志或通知）
    monitor.addEventListener((event) => {
      console.log(`[进化事件] ${event.type}:`, event.data || '');
    });
    
    monitor.start();
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize autonomous evolution:', error);
  }
}

/**
 * GET - 查询进化状态（只读）
 * 
 * Query params:
 * - detail: 'full' | 'summary' (default: 'summary')
 * 
 * 注意：此 API 只能查询状态，不能触发进化
 * 进化由系统根据自身状态自动判断和执行
 */
export async function GET(request: NextRequest) {
  try {
    // 确保系统已初始化
    await initializeAutonomousEvolution();
    
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') || 'summary';
    
    const coordinator = getEvolutionCoordinator();
    const monitor = getAutonomousEvolutionMonitor();
    
    // 获取进化协调器状态
    const evolutionState = coordinator.getState();
    const genome = coordinator.getCurrentGenome();
    
    // 获取自主监控器状态
    const monitorStatus = monitor.getStatus();
    
    // 构建响应
    const response: {
      success: boolean;
      data: {
        // 进化状态
        phase: EvolutionPhase;
        generation: number;
        lastEvolutionTime: number;
        stats: typeof evolutionState.stats;
        
        // 自主监控状态
        autonomous: {
          isRunning: boolean;
          recentPerformanceAvg: number;
          recentSurpriseAvg: number;
          unhandledTasksCount: number;
          recentInteractions: number;
          timeSinceLastEvolution: number;
        };
        
        // 当前基因组（仅详细模式）
        currentGenome?: {
          id: string;
          generation: number;
          fitness: number;
          mutationCount: number;
          createdAt: number;
          coreValues: number[];
        };
        
        // 进化历史（仅详细模式）
        history?: typeof evolutionState.history;
        
        // 触发条件评估（仅详细模式）
        triggerAssessment?: {
          shouldEvolve: boolean;
          reasons: Array<{ type: string; severity: number; description: string }>;
        };
      };
      meta: {
        message: string;
        note: string;
      };
    } = {
      success: true,
      data: {
        phase: evolutionState.phase,
        generation: evolutionState.generation,
        lastEvolutionTime: evolutionState.lastEvolutionTime,
        stats: evolutionState.stats,
        autonomous: {
          isRunning: monitorStatus.isRunning,
          recentPerformanceAvg: monitorStatus.recentPerformanceAvg,
          recentSurpriseAvg: monitorStatus.recentSurpriseAvg,
          unhandledTasksCount: monitorStatus.unhandledTasksCount,
          recentInteractions: monitorStatus.recentInteractions,
          timeSinceLastEvolution: monitorStatus.timeSinceLastEvolution,
        },
      },
      meta: {
        message: '进化由系统自主判断，不接受外部指令',
        note: '系统会根据性能、学习效率、能力缺口等指标自动决定是否进化',
      },
    };
    
    // 添加基因组详情
    if (detail === 'full' && genome) {
      response.data.currentGenome = {
        id: genome.id,
        generation: genome.generation,
        fitness: genome.fitness,
        mutationCount: genome.mutations.length,
        createdAt: genome.createdAt,
        coreValues: genome.coreGenes.values as number[],
      };
    }
    
    // 添加历史记录
    if (detail === 'full') {
      response.data.history = evolutionState.history.slice(-20);
    }
    
    // 添加触发条件评估
    if (detail === 'full') {
      const triggerResult = coordinator.checkEvolutionNeeded();
      response.data.triggerAssessment = {
        shouldEvolve: triggerResult.shouldEvolve,
        reasons: triggerResult.reasons.map(r => ({
          type: r.type,
          severity: r.severity,
          description: r.description,
        })),
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Evolution GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 记录交互数据（供内部系统调用）
 * 
 * 注意：这不是触发进化，而是记录系统运行数据
 * 进化判断由系统根据累积的数据自动做出
 */
export async function POST(request: NextRequest) {
  try {
    await initializeAutonomousEvolution();
    
    const body = await request.json();
    const { interaction } = body as {
      interaction?: {
        responseQuality?: number;
        surprise?: number;
        taskType?: string;
        handled?: boolean;
        userSatisfaction?: number;
        responseTime?: number;
      };
    };
    
    if (!interaction) {
      return NextResponse.json(
        { success: false, error: '缺少交互数据' },
        { status: 400 }
      );
    }
    
    // 记录交互数据（用于自主进化判断）
    const monitor = getAutonomousEvolutionMonitor();
    monitor.recordInteraction(interaction);
    
    return NextResponse.json({
      success: true,
      message: '交互数据已记录',
      note: '系统会根据累积的数据自主判断是否需要进化',
    });
  } catch (error) {
    console.error('Evolution POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
