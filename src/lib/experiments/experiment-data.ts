/**
 * 实验数据记录与分析
 */

// 实验记录
export interface ExperimentRecord {
  id: string;
  timestamp: number;
  config: ExperimentConfig;
  results: StepResult[];
  analysis: ExperimentAnalysis;
  insight: string | null;  // 实验洞察
}

// 单步结果
export interface StepResult {
  step: number;
  boundary: {
    avgIntensity: number;
    coherence: number;
    patternStrength: number;
    activeEdges: number;
    totalEdges: number;
  };
  node: {
    avgActivation: number;
    coherence: number;
    patternStrength: number;
    activeNodes: number;
    totalNodes: number;
  };
}

// 实验分析
export interface ExperimentAnalysis {
  boundary: {
    peakIntensity: number;
    peakCoherence: number;
    stabilityIndex: number;       // 稳定性指数
    patternEmergenceSteps: number[];  // 模式涌现的步数
    convergenceStep: number | null;   // 收敛步数
    oscillationPeriod: number | null; // 振荡周期
  };
  node: {
    peakActivation: number;
    peakCoherence: number;
    stabilityIndex: number;
    patternEmergenceSteps: number[];
    convergenceStep: number | null;
    oscillationPeriod: number | null;
  };
  comparison: {
    coherenceAdvantage: number;   // 边界网络相干性优势
    stabilityAdvantage: number;   // 稳定性优势
    patternAdvantage: number;     // 模式涌现优势
    winner: 'boundary' | 'node' | 'tie';
  };
}

// 实验配置
export interface ExperimentConfig {
  name: string;
  description: string;
  rings: number;
  steps: number;
  injectionPattern: 'single' | 'multiple' | 'random' | 'seven';
  injectionPositions: { q: number; r: number }[];
  injectionIntensity: number;
  boundaryRules: BoundaryRules;
  nodeRules: NodeRules;
}

export interface BoundaryRules {
  propagationRate: number;
  threshold: number;
  decayRate: number;
  selfExcitation: number;
  neighborExcitation: number;
  oscillationFreq: number;
  globalInhibition: number;  // 全局抑制系数
}

export interface NodeRules {
  learningRate: number;
  decayRate: number;
  threshold: number;
  activationFunction: 'sigmoid' | 'relu' | 'tanh';
}

// 智能配方
export interface IntelligenceRecipe {
  id: string;
  name: string;
  description: string;
  discovered: number;  // 发现时间戳
  conditions: {
    config: ExperimentConfig;
    keyFactors: string[];  // 关键因素
  };
  effects: {
    coherenceBoost: number;
    stabilityBoost: number;
    patternEmergence: boolean;
    notes: string;
  };
  verified: boolean;      // 是否已验证
  verificationCount: number;
}

// 预设配方
export const presetRecipes: IntelligenceRecipe[] = [
  {
    id: 'recipe-1',
    name: 'θ振荡共鸣',
    description: '当振荡频率接近θ波(4-8Hz)时，边界网络出现相位同步',
    discovered: Date.now(),
    conditions: {
      config: {
        name: 'θ振荡实验',
        description: '测试网格细胞θ振荡对边界网络的影响',
        rings: 4,
        steps: 200,
        injectionPattern: 'multiple',
        injectionPositions: [{ q: 0, r: 0 }, { q: 2, r: -1 }],
        injectionIntensity: 0.9,
        boundaryRules: {
          propagationRate: 0.3,
          threshold: 0.08,
          decayRate: 0.015,
          selfExcitation: 0.15,
          neighborExcitation: 0.2,
          oscillationFreq: 0.06,  // 接近θ波
          globalInhibition: 0.3
        },
        nodeRules: {
          learningRate: 0.1,
          decayRate: 0.02,
          threshold: 0.1,
          activationFunction: 'sigmoid'
        }
      },
      keyFactors: ['低振荡频率', '中等传播率', '高自激']
    },
    effects: {
      coherenceBoost: 0.3,
      stabilityBoost: 0.2,
      patternEmergence: true,
      notes: '边界网络在约80步后出现稳定的六边形相位模式'
    },
    verified: false,
    verificationCount: 0
  },
  {
    id: 'recipe-2',
    name: '7元素最小系统',
    description: '验证数学证明：最少7个元素可涌现六边形模式',
    discovered: Date.now(),
    conditions: {
      config: {
        name: '7元素验证',
        description: '最小边界网络：中心节点 + 6条边（六边形）',
        rings: 1,  // 只有中心节点和第一环
        steps: 300,
        injectionPattern: 'seven',  // 所有6条边同时注入
        injectionPositions: [
          { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
          { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ],
        injectionIntensity: 0.5,
        boundaryRules: {
          propagationRate: 0.4,
          threshold: 0.05,
          decayRate: 0.01,
          selfExcitation: 0.2,
          neighborExcitation: 0.25,
          oscillationFreq: 0.08,
          globalInhibition: 0.3
        },
        nodeRules: {
          learningRate: 0.15,
          decayRate: 0.01,
          threshold: 0.08,
          activationFunction: 'sigmoid'
        }
      },
      keyFactors: ['最小系统', '均匀注入', '低衰减']
    },
    effects: {
      coherenceBoost: 0.5,
      stabilityBoost: 0.4,
      patternEmergence: true,
      notes: '6条边形成闭合回路，相位同步后形成稳定的驻波'
    },
    verified: false,
    verificationCount: 0
  },
  {
    id: 'recipe-3',
    name: '边界衰减均衡',
    description: '衰减率与自激率平衡时，系统进入稳态振荡',
    discovered: Date.now(),
    conditions: {
      config: {
        name: '衰减均衡实验',
        description: '寻找衰减与自激的黄金比例',
        rings: 3,
        steps: 500,
        injectionPattern: 'single',
        injectionPositions: [{ q: 0, r: 0 }],
        injectionIntensity: 0.8,
        boundaryRules: {
          propagationRate: 0.25,
          threshold: 0.1,
          decayRate: 0.02,
          selfExcitation: 0.02,  // 与衰减率相等
          neighborExcitation: 0.15,
          oscillationFreq: 0.1,
          globalInhibition: 0.3
        },
        nodeRules: {
          learningRate: 0.1,
          decayRate: 0.02,
          threshold: 0.1,
          activationFunction: 'sigmoid'
        }
      },
      keyFactors: ['衰减=自激', '低传播率', '中等阈值']
    },
    effects: {
      coherenceBoost: 0.25,
      stabilityBoost: 0.35,
      patternEmergence: false,
      notes: '系统达到动态平衡，既不衰减也不发散'
    },
    verified: false,
    verificationCount: 0
  }
];

// 实验数据存储
class ExperimentStorage {
  private records: ExperimentRecord[] = [];
  private recipes: IntelligenceRecipe[] = [...presetRecipes];
  
  addRecord(record: ExperimentRecord): void {
    this.records.push(record);
    this.saveToStorage();
  }
  
  getRecords(): ExperimentRecord[] {
    return [...this.records];
  }
  
  getLatestRecord(): ExperimentRecord | null {
    return this.records[this.records.length - 1] || null;
  }
  
  addRecipe(recipe: IntelligenceRecipe): void {
    this.recipes.push(recipe);
    this.saveToStorage();
  }
  
  getRecipes(): IntelligenceRecipe[] {
    return [...this.recipes];
  }
  
  verifyRecipe(recipeId: string, success: boolean): void {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (recipe) {
      recipe.verificationCount++;
      if (success) {
        recipe.verified = true;
      }
      this.saveToStorage();
    }
  }
  
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('experiment-records', JSON.stringify(this.records));
        localStorage.setItem('intelligence-recipes', JSON.stringify(this.recipes));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }
  }
  
  loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const records = localStorage.getItem('experiment-records');
        const recipes = localStorage.getItem('intelligence-recipes');
        
        if (records) {
          this.records = JSON.parse(records);
        }
        if (recipes) {
          // 合并预设配方和用户发现的配方
          const savedRecipes = JSON.parse(recipes);
          const savedIds = new Set(savedRecipes.map((r: IntelligenceRecipe) => r.id));
          this.recipes = [
            ...presetRecipes.filter(r => !savedIds.has(r.id)),
            ...savedRecipes
          ];
        }
      } catch (e) {
        console.warn('Failed to load from localStorage:', e);
      }
    }
  }
}

export const experimentStorage = new ExperimentStorage();

// 分析实验结果
export function analyzeExperiment(results: StepResult[]): ExperimentAnalysis {
  if (results.length === 0) {
    return {
      boundary: {
        peakIntensity: 0,
        peakCoherence: 0,
        stabilityIndex: 0,
        patternEmergenceSteps: [],
        convergenceStep: null,
        oscillationPeriod: null
      },
      node: {
        peakActivation: 0,
        peakCoherence: 0,
        stabilityIndex: 0,
        patternEmergenceSteps: [],
        convergenceStep: null,
        oscillationPeriod: null
      },
      comparison: {
        coherenceAdvantage: 0,
        stabilityAdvantage: 0,
        patternAdvantage: 0,
        winner: 'tie'
      }
    };
  }
  
  // 边界网络分析
  const boundaryIntensities = results.map(r => r.boundary.avgIntensity);
  const boundaryCoherences = results.map(r => r.boundary.coherence);
  const boundaryPatterns = results
    .map((r, i) => r.boundary.patternStrength > 0.3 ? i : -1)
    .filter(i => i >= 0);
  
  // 节点网络分析
  const nodeActivations = results.map(r => r.node.avgActivation);
  const nodeCoherences = results.map(r => r.node.coherence);
  const nodePatterns = results
    .map((r, i) => r.node.patternStrength > 0.3 ? i : -1)
    .filter(i => i >= 0);
  
  // 计算稳定性
  const lastQuarter = Math.floor(results.length * 3 / 4);
  const boundaryStability = calculateStability(boundaryIntensities.slice(lastQuarter));
  const nodeStability = calculateStability(nodeActivations.slice(lastQuarter));
  
  // 计算收敛步数
  const boundaryConvergence = findConvergence(boundaryIntensities);
  const nodeConvergence = findConvergence(nodeActivations);
  
  // 检测振荡周期
  const boundaryOscillation = detectOscillation(boundaryIntensities);
  const nodeOscillation = detectOscillation(nodeActivations);
  
  // 计算优势
  const avgBoundaryCoherence = average(boundaryCoherences);
  const avgNodeCoherence = average(nodeCoherences);
  
  let winner: 'boundary' | 'node' | 'tie' = 'tie';
  const coherenceAdv = avgBoundaryCoherence - avgNodeCoherence;
  const stabilityAdv = boundaryStability - nodeStability;
  const patternAdv = boundaryPatterns.length - nodePatterns.length;
  
  if (coherenceAdv > 0.1 && stabilityAdv > 0.1) {
    winner = 'boundary';
  } else if (coherenceAdv < -0.1 && stabilityAdv < -0.1) {
    winner = 'node';
  }
  
  return {
    boundary: {
      peakIntensity: Math.max(...boundaryIntensities),
      peakCoherence: Math.max(...boundaryCoherences),
      stabilityIndex: boundaryStability,
      patternEmergenceSteps: boundaryPatterns,
      convergenceStep: boundaryConvergence,
      oscillationPeriod: boundaryOscillation
    },
    node: {
      peakActivation: Math.max(...nodeActivations),
      peakCoherence: Math.max(...nodeCoherences),
      stabilityIndex: nodeStability,
      patternEmergenceSteps: nodePatterns,
      convergenceStep: nodeConvergence,
      oscillationPeriod: nodeOscillation
    },
    comparison: {
      coherenceAdvantage: coherenceAdv,
      stabilityAdvantage: stabilityAdv,
      patternAdvantage: patternAdv,
      winner
    }
  };
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateStability(values: number[]): number {
  if (values.length < 2) return 0;
  
  let changes = 0;
  for (let i = 1; i < values.length; i++) {
    changes += Math.abs(values[i] - values[i-1]);
  }
  
  // 变化越小，稳定性越高
  return Math.max(0, 1 - (changes / values.length));
}

function findConvergence(values: number[]): number | null {
  if (values.length < 10) return null;
  
  // 寻找连续10步变化小于0.01的位置
  for (let i = 0; i < values.length - 10; i++) {
    let totalChange = 0;
    for (let j = 0; j < 10; j++) {
      totalChange += Math.abs(values[i + j] - values[i + j + 1]);
    }
    if (totalChange < 0.01) {
      return i;
    }
  }
  
  return null;
}

function detectOscillation(values: number[]): number | null {
  if (values.length < 20) return null;
  
  // 寻找峰值
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] > values[i-1] && values[i] > values[i+1]) {
      peaks.push(i);
    }
  }
  
  if (peaks.length < 2) return null;
  
  // 计算平均周期
  let totalPeriod = 0;
  for (let i = 1; i < peaks.length; i++) {
    totalPeriod += peaks[i] - peaks[i-1];
  }
  
  return Math.round(totalPeriod / (peaks.length - 1));
}

// 生成实验ID
export function generateExperimentId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 判断是否发现新配方
export function checkForNewRecipe(
  analysis: ExperimentAnalysis,
  config: ExperimentConfig
): IntelligenceRecipe | null {
  // 条件：相干性提升 > 20% 或 模式涌现
  const hasPattern = analysis.boundary.patternEmergenceSteps.length > 0;
  const coherenceBoost = analysis.comparison.coherenceAdvantage;
  
  if (hasPattern || coherenceBoost > 0.2) {
    return {
      id: `recipe-${Date.now()}`,
      name: `实验发现 ${new Date().toLocaleDateString()}`,
      description: `从实验 ${config.name} 中发现`,
      discovered: Date.now(),
      conditions: {
        config,
        keyFactors: extractKeyFactors(analysis, config)
      },
      effects: {
        coherenceBoost,
        stabilityBoost: analysis.comparison.stabilityAdvantage,
        patternEmergence: hasPattern,
        notes: generateInsight(analysis, config)
      },
      verified: false,
      verificationCount: 0
    };
  }
  
  return null;
}

function extractKeyFactors(analysis: ExperimentAnalysis, config: ExperimentConfig): string[] {
  const factors: string[] = [];
  
  if (config.boundaryRules.oscillationFreq < 0.1) {
    factors.push('低振荡频率');
  }
  if (config.boundaryRules.decayRate === config.boundaryRules.selfExcitation) {
    factors.push('衰减=自激');
  }
  if (config.injectionPattern === 'seven') {
    factors.push('7元素注入');
  }
  if (config.boundaryRules.propagationRate > 0.3) {
    factors.push('高传播率');
  }
  
  return factors.length > 0 ? factors : ['未知因素'];
}

function generateInsight(analysis: ExperimentAnalysis, config: ExperimentConfig): string {
  const insights: string[] = [];
  
  if (analysis.boundary.oscillationPeriod) {
    insights.push(`振荡周期约${analysis.boundary.oscillationPeriod}步`);
  }
  
  if (analysis.boundary.convergenceStep) {
    insights.push(`${analysis.boundary.convergenceStep}步后收敛`);
  }
  
  if (analysis.boundary.patternEmergenceSteps.length > 0) {
    insights.push(`模式在${analysis.boundary.patternEmergenceSteps[0]}步涌现`);
  }
  
  return insights.join('；') || '无特殊观察';
}
