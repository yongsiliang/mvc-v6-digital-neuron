/**
 * ═══════════════════════════════════════════════════════════════════════
 * 实验数据模块
 * Experiment Data Module
 * 
 * 提供智能实验所需的类型定义和基础函数
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 边界规则参数 */
export interface BoundaryRules {
  propagationRate: number;
  threshold: number;
  decayRate: number;
  selfExcitation: number;
  neighborExcitation: number;
  oscillationFreq: number;
  globalInhibition: number;
}

/** 节点规则参数 */
export interface NodeRules {
  learningRate: number;
  decayRate: number;
  threshold: number;
  activationFunction: 'sigmoid' | 'tanh' | 'relu';
}

/** 单步结果 - 边界数据 */
export interface BoundaryStepData {
  avgIntensity: number;
  coherence: number;
  patternStrength: number;
  activeEdges: number;
  totalEdges: number;
}

/** 单步结果 - 节点数据 */
export interface NodeStepData {
  avgActivation: number;
  coherence: number;
  patternStrength: number;
  activeNodes: number;
  totalNodes: number;
}

/** 步骤结果 */
export interface StepResult {
  step: number;
  boundary: BoundaryStepData;
  node: NodeStepData;
}

/** 实验配置 */
export interface ExperimentConfig {
  name: string;
  description: string;
  rings: number;
  steps: number;
  injectionPattern: string;
  injectionPositions: Array<{ q: number; r: number }>;
  injectionIntensity: number;
  boundaryRules: BoundaryRules;
  nodeRules: NodeRules;
}

/** 实验分析结果 */
export interface ExperimentAnalysis {
  avgCoherence: number;
  maxCoherence: number;
  stability: number;
  trend: 'improving' | 'declining' | 'stable';
  patternDetected?: string;
  recommendations?: string[];
  comparison?: {
    coherenceImprovement: number;
    stabilityImprovement: number;
    vsBaseline: number;
    winner: 'boundary' | 'node' | 'tie';
  };
}

/** 配方条件配置 */
export interface RecipeConditionConfig {
  rings: number;
  injectionPattern: string;
  injectionIntensity: number;
  boundaryRules: BoundaryRules;
  nodeRules: NodeRules;
}

/** 配方条件 */
export interface RecipeConditions {
  config: RecipeConditionConfig;
  keyFactors: string[];
}

/** 配方效果 */
export interface RecipeEffects {
  coherenceBoost: number;
  stabilityBoost: number;
  patternEmergence: boolean;
  notes?: string;
}

/** 配方效果因子 */
export interface RecipeEffectFactors {
  factor: string;
  weight: number;
}

/** 智能配方 */
export interface IntelligenceRecipe {
  id: string;
  name: string;
  description: string;
  conditions: RecipeConditions;
  effects: RecipeEffects;
  expectedOutcome: string;
  author?: string;
  verified?: boolean;
  createdAt: number;
}

/** 实验记录 */
export interface ExperimentRecord {
  id: string;
  timestamp: number;
  config: ExperimentConfig;
  results: StepResult[];
  analysis: ExperimentAnalysis;
  insight?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// 预设配方
// ═══════════════════════════════════════════════════════════════════════

export const presetRecipes: IntelligenceRecipe[] = [
  {
    id: 'stable-oscillation',
    name: '稳定振荡',
    description: '产生稳定的边界振荡模式',
    conditions: {
      config: {
        rings: 4,
        injectionPattern: 'multiple',
        injectionIntensity: 0.9,
        boundaryRules: {
          propagationRate: 0.3,
          threshold: 0.08,
          decayRate: 0.015,
          selfExcitation: 0.15,
          neighborExcitation: 0.2,
          oscillationFreq: 0.08,
          globalInhibition: 0.3
        },
        nodeRules: {
          learningRate: 0.1,
          decayRate: 0.02,
          threshold: 0.1,
          activationFunction: 'sigmoid'
        }
      },
      keyFactors: ['低传播率', '中等激励', '周期振荡']
    },
    effects: {
      coherenceBoost: 0.25,
      stabilityBoost: 0.35,
      patternEmergence: true,
      notes: '适合观察稳定周期性振荡'
    },
    expectedOutcome: '边界产生稳定的周期性振荡',
    author: 'System',
    verified: true,
    createdAt: Date.now()
  },
  {
    id: 'wave-propagation',
    name: '波传播',
    description: '观察激活波在网络中的传播',
    conditions: {
      config: {
        rings: 5,
        injectionPattern: 'single',
        injectionIntensity: 1.0,
        boundaryRules: {
          propagationRate: 0.5,
          threshold: 0.05,
          decayRate: 0.01,
          selfExcitation: 0.1,
          neighborExcitation: 0.4,
          oscillationFreq: 0.05,
          globalInhibition: 0.2
        },
        nodeRules: {
          learningRate: 0.2,
          decayRate: 0.01,
          threshold: 0.05,
          activationFunction: 'sigmoid'
        }
      },
      keyFactors: ['高传播率', '单点注入', '低阈值']
    },
    effects: {
      coherenceBoost: 0.15,
      stabilityBoost: 0.20,
      patternEmergence: true,
      notes: '观察激活波的传播过程'
    },
    expectedOutcome: '激活从中心向外传播形成波纹',
    author: 'System',
    verified: true,
    createdAt: Date.now()
  },
  {
    id: 'emergent-pattern',
    name: '涌现模式',
    description: '探索复杂涌现行为的参数空间',
    conditions: {
      config: {
        rings: 4,
        injectionPattern: 'multiple',
        injectionIntensity: 0.8,
        boundaryRules: {
          propagationRate: 0.4,
          threshold: 0.1,
          decayRate: 0.02,
          selfExcitation: 0.2,
          neighborExcitation: 0.3,
          oscillationFreq: 0.1,
          globalInhibition: 0.25
        },
        nodeRules: {
          learningRate: 0.15,
          decayRate: 0.015,
          threshold: 0.08,
          activationFunction: 'tanh'
        }
      },
      keyFactors: ['平衡参数', '多点注入', 'tanh激活']
    },
    effects: {
      coherenceBoost: 0.20,
      stabilityBoost: 0.15,
      patternEmergence: true,
      notes: '探索复杂涌现行为'
    },
    expectedOutcome: '产生复杂的自发涌现模式',
    author: 'System',
    verified: false,
    createdAt: Date.now()
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════════════

/** 生成实验ID */
export function generateExperimentId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** 实验存储类 */
class ExperimentStorage {
  private records: ExperimentRecord[] = [];
  private recipes: IntelligenceRecipe[] = [...presetRecipes];

  addRecord(record: ExperimentRecord): void {
    this.records.push(record);
    this.saveToStorage();
  }

  addRecipe(recipe: IntelligenceRecipe): void {
    this.recipes.push(recipe);
    this.saveToStorage();
  }

  getAll(): ExperimentRecord[] {
    return [...this.records];
  }

  getById(id: string): ExperimentRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  getRecords(): ExperimentRecord[] {
    return [...this.records];
  }

  getRecipes(): IntelligenceRecipe[] {
    return [...this.recipes];
  }

  delete(id: string): boolean {
    const index = this.records.findIndex(r => r.id === id);
    if (index !== -1) {
      this.records.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  clear(): void {
    this.records = [];
    this.recipes = [...presetRecipes];
    this.saveToStorage();
  }

  loadFromStorage(): void {
    // 在浏览器环境中尝试从localStorage加载
    if (typeof window !== 'undefined') {
      try {
        const savedRecords = localStorage.getItem('experiment_records');
        const savedRecipes = localStorage.getItem('experiment_recipes');
        
        if (savedRecords) {
          this.records = JSON.parse(savedRecords);
        }
        if (savedRecipes) {
          const customRecipes = JSON.parse(savedRecipes);
          this.recipes = [...presetRecipes, ...customRecipes];
        }
      } catch (e) {
        console.warn('Failed to load from storage:', e);
      }
    }
  }

  private saveToStorage(): void {
    // 在浏览器环境中保存到localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('experiment_records', JSON.stringify(this.records));
        // 只保存非预设的配方
        const customRecipes = this.recipes.filter(
          r => !presetRecipes.some(p => p.id === r.id)
        );
        localStorage.setItem('experiment_recipes', JSON.stringify(customRecipes));
      } catch (e) {
        console.warn('Failed to save to storage:', e);
      }
    }
  }
}

export const experimentStorage = new ExperimentStorage();

/** 分析实验结果 */
export function analyzeExperiment(steps: StepResult[]): ExperimentAnalysis {
  if (steps.length === 0) {
    return { 
      avgCoherence: 0, 
      maxCoherence: 0, 
      stability: 0, 
      trend: 'stable',
      comparison: {
        coherenceImprovement: 0,
        stabilityImprovement: 0,
        vsBaseline: 0,
        winner: 'tie'
      }
    };
  }

  const coherences = steps.map(s => (s.boundary.coherence + s.node.coherence) / 2);
  const avgCoherence = coherences.reduce((a, b) => a + b, 0) / coherences.length;
  const maxCoherence = Math.max(...coherences);

  // 计算稳定性（标准差的倒数）
  const variance = coherences.reduce((sum, c) => sum + Math.pow(c - avgCoherence, 2), 0) / coherences.length;
  const stability = variance > 0 ? 1 / (1 + Math.sqrt(variance) * 10) : 1;

  // 判断趋势
  const recentCoherences = coherences.slice(-10);
  const earlierCoherences = coherences.slice(0, -10);
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let coherenceImprovement = 0;
  let stabilityImprovement = 0;
  
  if (earlierCoherences.length > 0) {
    const recentAvg = recentCoherences.reduce((a, b) => a + b, 0) / recentCoherences.length;
    const earlierAvg = earlierCoherences.reduce((a, b) => a + b, 0) / earlierCoherences.length;
    
    coherenceImprovement = recentAvg - earlierAvg;
    
    if (recentAvg > earlierAvg * 1.1) trend = 'improving';
    else if (recentAvg < earlierAvg * 0.9) trend = 'declining';
  }

  // 检测模式
  let patternDetected: string | undefined;
  if (stability > 0.8 && avgCoherence > 0.7) {
    patternDetected = '稳定高一致性模式';
  } else if (trend === 'improving') {
    patternDetected = '渐进增强模式';
  } else if (variance < 0.01) {
    patternDetected = '平稳传播模式';
  }

  return { 
    avgCoherence, 
    maxCoherence, 
    stability, 
    trend,
    patternDetected,
    recommendations: generateRecommendations(avgCoherence, stability, trend),
    comparison: {
      coherenceImprovement,
      stabilityImprovement,
      vsBaseline: avgCoherence - 0.5, // 假设基线为0.5
      winner: 'tie' // 默认为平局
    }
  };
}

/** 生成优化建议 */
function generateRecommendations(
  coherence: number, 
  stability: number, 
  trend: string
): string[] {
  const recommendations: string[] = [];
  
  if (coherence < 0.5) {
    recommendations.push('尝试增加传播率(Propagation Rate)以提高一致性');
  }
  if (stability < 0.5) {
    recommendations.push('降低自激励(Self Excitation)可能提高稳定性');
  }
  if (trend === 'declining') {
    recommendations.push('考虑调整全局抑制(Global Inhibition)参数');
  }
  
  return recommendations;
}

/** 检查是否发现新配方 */
export function checkForNewRecipe(
  analysis: ExperimentAnalysis,
  config: ExperimentConfig
): IntelligenceRecipe | null {
  // 如果一致性高且稳定，认为发现了新配方
  if (analysis.avgCoherence > 0.7 && analysis.stability > 0.8) {
    return {
      id: `discovered_${generateExperimentId()}`,
      name: `发现配方 #${presetRecipes.length + 1}`,
      description: `一致性: ${(analysis.avgCoherence * 100).toFixed(1)}%, 稳定性: ${(analysis.stability * 100).toFixed(1)}%`,
      conditions: {
        config: {
          rings: config.rings,
          injectionPattern: config.injectionPattern,
          injectionIntensity: config.injectionIntensity,
          boundaryRules: config.boundaryRules,
          nodeRules: config.nodeRules
        },
        keyFactors: ['用户发现', '高稳定性', '高一致性']
      },
      effects: {
        coherenceBoost: analysis.comparison?.coherenceImprovement || 0,
        stabilityBoost: analysis.stability * 0.1,
        patternEmergence: true,
        notes: '用户发现的稳定参数组合'
      },
      expectedOutcome: '用户发现的稳定参数组合',
      author: 'Discovery',
      verified: false,
      createdAt: Date.now()
    };
  }

  return null;
}
