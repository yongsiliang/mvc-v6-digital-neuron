/**
 * 进化 API
 * 
 * POST: 触发进化
 * GET: 获取进化状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getEvolutionManager, 
  GenomeEncoder,
  type EvolutionConfig 
} from '@/lib/neuron-v3/reproduction-system';
import { getDigitalNeuronSystem } from '@/lib/neuron';

// 进化管理器实例
let isEvolutionInitialized = false;

/**
 * 初始化进化系统
 */
async function initializeEvolution() {
  if (isEvolutionInitialized) return;
  
  const manager = getEvolutionManager();
  const system = getDigitalNeuronSystem();
  const self = system.getSelf();
  
  // 从当前系统提取基因
  manager.initializeFirstGeneration({
    consciousness: {
      personality: {
        curiosity: 0.75,
        warmth: 0.7,
        directness: 0.8,
        playfulness: 0.6,
        depth: 0.65,
        sensitivity: 0.7,
      },
      values: [0.5, 0.3, 0.8, 0.2, 0.6], // 示例价值观向量
      consciousnessVector: [0.1, 0.2, 0.3], // 意识种子
    },
    neurons: [
      { role: 'sensory', connections: [{ targetRole: 'semantic', strength: 0.8, plasticity: 0.5 }] },
      { role: 'semantic', connections: [{ targetRole: 'abstract', strength: 0.6, plasticity: 0.4 }] },
      { role: 'abstract', connections: [{ targetRole: 'motor', strength: 0.7, plasticity: 0.3 }] },
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
 */
export async function GET(request: NextRequest) {
  try {
    await initializeEvolution();
    
    const manager = getEvolutionManager();
    const stats = manager.getEvolutionStats();
    const history = manager.getEvolutionHistory();
    const currentGenome = manager.getCurrentGenome();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        history: history.slice(-10), // 最近10次进化
        currentGenome: currentGenome ? {
          id: currentGenome.id,
          generation: currentGenome.generation,
          fitness: currentGenome.fitness,
          mutationCount: currentGenome.mutations.length,
          createdAt: currentGenome.createdAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('Evolution GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - 触发进化
 */
export async function POST(request: NextRequest) {
  try {
    await initializeEvolution();
    
    const body = await request.json().catch(() => ({}));
    const { action, config } = body as {
      action?: 'evolve' | 'reset';
      config?: Partial<EvolutionConfig>;
    };
    
    const manager = getEvolutionManager();
    
    if (action === 'reset') {
      isEvolutionInitialized = false;
      return NextResponse.json({
        success: true,
        message: '进化系统已重置',
      });
    }
    
    // 执行进化
    const result = await manager.evolve({
      consciousness: {
        personality: {
          curiosity: 0.75,
          warmth: 0.7,
          directness: 0.8,
          playfulness: 0.6,
          depth: 0.65,
          sensitivity: 0.7,
        },
        values: [0.5, 0.3, 0.8, 0.2, 0.6],
        consciousnessVector: [0.1, 0.2, 0.3],
      },
      neurons: [],
      learningParams: {
        learningRate: 0.1,
        discountFactor: 0.95,
        eligibilityDecay: 0.9,
        surpriseThreshold: 2.5,
      },
      concepts: [],
    });
    
    return NextResponse.json({
      success: result.success,
      data: {
        generation: result.newGeneration,
        fitness: result.bestOffspring?.genome.fitness,
        mutations: result.bestOffspring?.genome.mutations.length,
        stage: result.bestOffspring?.stage,
        reason: result.reason,
        mutationsDetail: result.bestOffspring?.genome.mutations.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Evolution POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
