/**
 * ═══════════════════════════════════════════════════════════════════════
 * 进化 API - Evolution API
 * 
 * GET: 获取进化状态
 * POST: 触发进化
 * 
 * 支持功能：
 * 1. 进化状态监控
 * 2. 进化触发（手动/自动）
 * 3. 基因组查看
 * 4. 历史记录
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getEvolutionCoordinator,
  type EvolutionPhase,
} from '@/lib/neuron-v3/evolution-coordinator';
import { getDigitalNeuronSystem } from '@/lib/neuron';

// 进化协调器初始化标志
let isEvolutionInitialized = false;

/**
 * 初始化进化系统
 */
async function initializeEvolution() {
  if (isEvolutionInitialized) return;
  
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
      values: [0.5, 0.3, 0.8, 0.2, 0.6], // 核心价值向量
      consciousnessVector: [0.1, 0.2, 0.3], // 意识种子
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
  
  isEvolutionInitialized = true;
}

/**
 * GET - 获取进化状态
 * 
 * Query params:
 * - detail: 'full' | 'summary' (default: 'summary')
 * - history: 'true' to include history
 */
export async function GET(request: NextRequest) {
  try {
    await initializeEvolution();
    
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') || 'summary';
    const includeHistory = searchParams.get('history') === 'true';
    
    const coordinator = getEvolutionCoordinator();
    const state = coordinator.getState();
    const genome = coordinator.getCurrentGenome();
    
    // 构建响应
    const response: {
      success: boolean;
      data: {
        phase: EvolutionPhase;
        generation: number;
        lastEvolutionTime: number;
        activeOffspringCount: number;
        stats: typeof state.stats;
        currentGenome?: {
          id: string;
          generation: number;
          fitness: number;
          mutationCount: number;
          createdAt: number;
          coreValues: number[];
        };
        history?: typeof state.history;
        triggerStatus?: {
          shouldEvolve: boolean;
          reasons: Array<{ type: string; severity: number; description: string }>;
        };
      };
    } = {
      success: true,
      data: {
        phase: state.phase,
        generation: state.generation,
        lastEvolutionTime: state.lastEvolutionTime,
        activeOffspringCount: state.activeOffspring.length,
        stats: state.stats,
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
    if (includeHistory) {
      response.data.history = state.history.slice(-20); // 最近20次
    }
    
    // 添加触发状态
    if (detail === 'full') {
      const triggerResult = coordinator.checkEvolutionNeeded();
      response.data.triggerStatus = {
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
        phase: 'failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 触发进化
 * 
 * Body:
 * - action: 'evolve' | 'check' | 'reset'
 * - force: boolean (强制进化，忽略触发条件)
 */
export async function POST(request: NextRequest) {
  try {
    await initializeEvolution();
    
    const body = await request.json().catch(() => ({}));
    const { action = 'evolve', force = false } = body as {
      action?: 'evolve' | 'check' | 'reset';
      force?: boolean;
    };
    
    const coordinator = getEvolutionCoordinator();
    
    // 重置
    if (action === 'reset') {
      isEvolutionInitialized = false;
      return NextResponse.json({
        success: true,
        message: '进化系统已重置',
      });
    }
    
    // 检查
    if (action === 'check') {
      const triggerResult = coordinator.checkEvolutionNeeded();
      return NextResponse.json({
        success: true,
        data: {
          shouldEvolve: triggerResult.shouldEvolve,
          reasons: triggerResult.reasons,
        },
      });
    }
    
    // 进化
    // 先检查触发条件（除非强制）
    if (!force) {
      const triggerResult = coordinator.checkEvolutionNeeded();
      if (!triggerResult.shouldEvolve) {
        return NextResponse.json({
          success: false,
          data: {
            evolved: false,
            reasons: triggerResult.reasons,
            message: '当前不满足进化条件',
          },
        });
      }
    }
    
    // 执行进化
    const result = await coordinator.evolve();
    
    return NextResponse.json({
      success: result.success,
      data: {
        evolved: result.success,
        newGeneration: result.newGeneration,
        reasons: result.reasons.map(r => ({
          type: r.type,
          severity: r.severity,
          description: r.description,
        })),
        selectedOffspring: result.selectedOffspring ? {
          id: result.selectedOffspring.id,
          fitness: result.selectedOffspring.genome.fitness,
          mutationCount: result.selectedOffspring.genome.mutations.length,
          testResults: result.selectedOffspring.testResults,
          growthStage: result.selectedOffspring.growthStage,
        } : null,
        allOffspringCount: result.allOffspring.length,
        matureOffspringCount: result.allOffspring.filter(o => o.growthStage === 'mature').length,
        errors: result.errors,
        summary: result.summary,
      },
    });
  } catch (error) {
    console.error('Evolution POST error:', error);
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
 * PUT - 记录系统状态
 * 
 * Body:
 * - state: Partial<SystemStateSnapshot>
 */
export async function PUT(request: NextRequest) {
  try {
    await initializeEvolution();
    
    const body = await request.json();
    const { state } = body;
    
    if (!state) {
      return NextResponse.json(
        { success: false, error: '缺少状态数据' },
        { status: 400 }
      );
    }
    
    const coordinator = getEvolutionCoordinator();
    coordinator.recordSystemState({
      timestamp: Date.now(),
      performance: state.performance || {
        avgResponseTime: 0,
        responseQuality: 0.5,
        satisfactionTrend: 0,
        errorRate: 0,
      },
      learning: state.learning || {
        avgSurprise: 0,
        neuronGenerationRate: 0,
        conceptLearningRate: 0,
        stagnationCount: 0,
      },
      activation: state.activation || {
        avgActivationRate: 0.5,
        connectionUtilization: 0.5,
        deadNeuronRatio: state.deadNeurons ? state.deadNeurons / 100 : 0,
      },
      capabilities: state.capabilities || {
        unhandledTaskTypes: [],
        coverageRate: 0.8,
        newCapabilityRequests: [],
      },
      user: state.user || {
        patternChangeScore: 0,
        newTopicRate: 0,
        engagementChange: 0,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: '状态已记录',
    });
  } catch (error) {
    console.error('Evolution PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
