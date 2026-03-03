/**
 * ═══════════════════════════════════════════════════════════════════════
 * 差分进化强化学习 (DE-RL) 元控制器
 * 
 * 核心理念：
 * - 用强化学习（RL）训练元思考的决策策略
 * - 用差分进化（DE）替代传统梯度下降优化策略网络
 * - 策略进化的黑盒化：无梯度路径可追溯
 * 
 * 黑盒特质：
 * - 策略更新无迹可寻：DE的种群交叉、变异、选择过程在内部完成
 * - 动作选择混淆：在策略网络输出中加入受控混沌噪声
 * - 奖励函数隐式化：不对外暴露奖励规则
 * 
 * 适配阶段：贾维斯级（可控强智能的任务调度）
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ImplicitVector, LLMInstruction, MetaThinkingResult } from './implicit-mcts';
import type { ImplicitPolicyNetwork, ImplicitValueNetwork } from './implicit-mcts';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 策略基因组
 * 
 * 一个策略网络的所有权重，作为一个"个体"
 */
export interface PolicyGenome {
  /** 唯一ID */
  id: string;
  
  /** 策略网络权重 */
  policyWeights: Float32Array;
  policyBias: Float32Array;
  
  /** 价值网络权重 */
  valueWeights: Float32Array;
  valueBias: number;
  
  /** 适应度（奖励累积） */
  fitness: number;
  
  /** 年龄（代数） */
  age: number;
  
  /** 历史表现 */
  performanceHistory: number[];
}

/**
 * 奖励信号
 */
export interface RewardSignal {
  /** 任务完成率 */
  taskCompletion: number;
  
  /** 执行效率 */
  efficiency: number;
  
  /** 用户满意度 */
  userSatisfaction: number;
  
  /** Token节省率 */
  tokenSavings: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 任务上下文
 */
export interface TaskContext {
  /** 任务描述 */
  description: string;
  
  /** 任务类型 */
  type: 'reasoning' | 'tool_call' | 'creative' | 'analysis' | 'planning';
  
  /** 复杂度估计 */
  complexity: number;
  
  /** 历史状态向量 */
  historyVectors: ImplicitVector[];
}

/**
 * DE-RL配置
 */
export interface DERLConfig {
  /** 向量维度 */
  vectorDimension: number;
  
  /** 种群大小 */
  populationSize: number;
  
  /** 变异因子（F） */
  mutationFactor: number;
  
  /** 交叉概率（CR） */
  crossoverRate: number;
  
  /** 精英保留数量 */
  eliteCount: number;
  
  /** 最大代数 */
  maxGenerations: number;
  
  /** 奖励权重 */
  rewardWeights: {
    taskCompletion: number;
    efficiency: number;
    userSatisfaction: number;
    tokenSavings: number;
  };
  
  /** 混沌强度 */
  chaosIntensity: number;
  
  /** 学习率 */
  learningRate: number;
}

const DEFAULT_DERL_CONFIG: DERLConfig = {
  vectorDimension: 256,
  populationSize: 20,
  mutationFactor: 0.8,
  crossoverRate: 0.9,
  eliteCount: 2,
  maxGenerations: 100,
  rewardWeights: {
    taskCompletion: 0.4,
    efficiency: 0.2,
    userSatisfaction: 0.3,
    tokenSavings: 0.1,
  },
  chaosIntensity: 0.05,
  learningRate: 0.01,
};

// ─────────────────────────────────────────────────────────────────────
// 差分进化引擎
// 
// 黑盒优化：无梯度，只有输入输出
// ─────────────────────────────────────────────────────────────────────

/**
 * 差分进化引擎
 */
class DifferentialEvolution {
  private config: DERLConfig;
  private population: PolicyGenome[];
  private generation: number;
  
  constructor(config: DERLConfig) {
    this.config = config;
    this.population = [];
    this.generation = 0;
  }
  
  /**
   * 初始化种群
   */
  initializePopulation(dimension: number): void {
    this.population = [];
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const genome = this.createRandomGenome(dimension);
      this.population.push(genome);
    }
  }
  
  /**
   * 创建随机基因组
   */
  private createRandomGenome(dimension: number): PolicyGenome {
    // Xavier初始化
    const scale = Math.sqrt(2.0 / dimension);
    
    const policyWeights = new Float32Array(dimension * dimension);
    const policyBias = new Float32Array(dimension);
    const valueWeights = new Float32Array(dimension);
    
    for (let i = 0; i < policyWeights.length; i++) {
      policyWeights[i] = (Math.random() * 2 - 1) * scale;
    }
    for (let i = 0; i < policyBias.length; i++) {
      policyBias[i] = 0;
    }
    for (let i = 0; i < valueWeights.length; i++) {
      valueWeights[i] = (Math.random() * 2 - 1) * scale;
    }
    
    return {
      id: this.generateId(),
      policyWeights,
      policyBias,
      valueWeights,
      valueBias: 0,
      fitness: 0,
      age: 0,
      performanceHistory: [],
    };
  }
  
  /**
   * 进化一代
   * 
   * 核心过程（黑盒化）：
   * 1. 变异：随机选择3个个体，生成变异向量
   * 2. 交叉：与目标个体交叉，生成试验向量
   * 3. 选择：比较适应度，保留更优个体
   */
  evolve(fitnessEvaluator: (genome: PolicyGenome) => number): void {
    const newPopulation: PolicyGenome[] = [];
    
    // 评估当前种群
    for (const genome of this.population) {
      genome.fitness = fitnessEvaluator(genome);
      genome.performanceHistory.push(genome.fitness);
    }
    
    // 按适应度排序
    this.population.sort((a, b) => b.fitness - a.fitness);
    
    // 保留精英
    for (let i = 0; i < this.config.eliteCount; i++) {
      newPopulation.push({ ...this.population[i] });
    }
    
    // 进化其余个体
    for (let i = this.config.eliteCount; i < this.config.populationSize; i++) {
      // 变异：DE/rand/1/bin 策略
      const mutant = this.mutate(i);
      
      // 交叉
      const trial = this.crossover(this.population[i], mutant);
      
      // 选择
      const trialFitness = fitnessEvaluator(trial);
      if (trialFitness >= this.population[i].fitness) {
        trial.fitness = trialFitness;
        trial.age = 0;
        newPopulation.push(trial);
      } else {
        this.population[i].age++;
        newPopulation.push(this.population[i]);
      }
    }
    
    this.population = newPopulation;
    this.generation++;
  }
  
  /**
   * 变异操作
   * 
   * v = x_r1 + F * (x_r2 - x_r3)
   * 
   * 注意：这是向量运算，外部无法追踪具体变化
   */
  private mutate(targetIndex: number): PolicyGenome {
    // 随机选择3个不同的个体
    const indices = this.selectRandomIndices(3, targetIndex);
    const [r1, r2, r3] = indices.map(i => this.population[i]);
    
    const dimension = r1.policyWeights.length;
    const F = this.config.mutationFactor;
    
    // 变异策略权重
    const mutantPolicyWeights = new Float32Array(dimension);
    for (let i = 0; i < dimension; i++) {
      mutantPolicyWeights[i] = r1.policyWeights[i] + F * (r2.policyWeights[i] - r3.policyWeights[i]);
    }
    
    // 变异策略偏置
    const mutantPolicyBias = new Float32Array(r1.policyBias.length);
    for (let i = 0; i < mutantPolicyBias.length; i++) {
      mutantPolicyBias[i] = r1.policyBias[i] + F * (r2.policyBias[i] - r3.policyBias[i]);
    }
    
    // 变异价值权重
    const mutantValueWeights = new Float32Array(r1.valueWeights.length);
    for (let i = 0; i < mutantValueWeights.length; i++) {
      mutantValueWeights[i] = r1.valueWeights[i] + F * (r2.valueWeights[i] - r3.valueWeights[i]);
    }
    
    return {
      id: this.generateId(),
      policyWeights: mutantPolicyWeights,
      policyBias: mutantPolicyBias,
      valueWeights: mutantValueWeights,
      valueBias: r1.valueBias + F * (r2.valueBias - r3.valueBias),
      fitness: 0,
      age: 0,
      performanceHistory: [],
    };
  }
  
  /**
   * 交叉操作
   * 
   * 二项式交叉
   */
  private crossover(target: PolicyGenome, mutant: PolicyGenome): PolicyGenome {
    const CR = this.config.crossoverRate;
    const dimension = target.policyWeights.length;
    
    // 确保至少有一个基因来自变异个体
    const guaranteedIndex = Math.floor(Math.random() * dimension);
    
    // 交叉策略权重
    const trialPolicyWeights = new Float32Array(dimension);
    for (let i = 0; i < dimension; i++) {
      if (Math.random() < CR || i === guaranteedIndex) {
        trialPolicyWeights[i] = mutant.policyWeights[i];
      } else {
        trialPolicyWeights[i] = target.policyWeights[i];
      }
    }
    
    // 交叉策略偏置
    const trialPolicyBias = new Float32Array(target.policyBias.length);
    for (let i = 0; i < trialPolicyBias.length; i++) {
      trialPolicyBias[i] = Math.random() < CR ? mutant.policyBias[i] : target.policyBias[i];
    }
    
    // 交叉价值权重
    const trialValueWeights = new Float32Array(target.valueWeights.length);
    for (let i = 0; i < trialValueWeights.length; i++) {
      trialValueWeights[i] = Math.random() < CR ? mutant.valueWeights[i] : target.valueWeights[i];
    }
    
    return {
      id: this.generateId(),
      policyWeights: trialPolicyWeights,
      policyBias: trialPolicyBias,
      valueWeights: trialValueWeights,
      valueBias: Math.random() < CR ? mutant.valueBias : target.valueBias,
      fitness: 0,
      age: 0,
      performanceHistory: [],
    };
  }
  
  /**
   * 选择随机索引
   */
  private selectRandomIndices(count: number, exclude: number): number[] {
    const indices: number[] = [];
    while (indices.length < count) {
      const idx = Math.floor(Math.random() * this.population.length);
      if (idx !== exclude && !indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices;
  }
  
  /**
   * 获取最优个体
   */
  getBest(): PolicyGenome {
    return this.population.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }
  
  /**
   * 获取种群多样性
   */
  getDiversity(): number {
    // 计算种群中个体的平均距离
    let totalDistance = 0;
    let count = 0;
    
    for (let i = 0; i < this.population.length; i++) {
      for (let j = i + 1; j < this.population.length; j++) {
        totalDistance += this.genomeDistance(this.population[i], this.population[j]);
        count++;
      }
    }
    
    return count > 0 ? totalDistance / count : 0;
  }
  
  /**
   * 计算基因组距离
   */
  private genomeDistance(a: PolicyGenome, b: PolicyGenome): number {
    let distance = 0;
    
    for (let i = 0; i < a.policyWeights.length; i++) {
      distance += Math.abs(a.policyWeights[i] - b.policyWeights[i]);
    }
    
    return distance / a.policyWeights.length;
  }
  
  /**
   * 生成随机ID
   */
  private generateId(): string {
    return Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  /**
   * 获取当前代数
   */
  getGeneration(): number {
    return this.generation;
  }
}

// ─────────────────────────────────────────────────────────────────────
// DE-RL元控制器
// ─────────────────────────────────────────────────────────────────────

/**
 * DE-RL元控制器
 * 
 * 特性：
 * - 用差分进化优化策略/价值网络
 * - 策略更新无梯度路径
 * - 动作选择加入混沌混淆
 */
export class DERLController {
  private config: DERLConfig;
  private de: DifferentialEvolution;
  private rewardHistory: RewardSignal[];
  private currentBestGenome: PolicyGenome | null;
  
  constructor(config?: Partial<DERLConfig>) {
    this.config = { ...DEFAULT_DERL_CONFIG, ...config };
    this.de = new DifferentialEvolution(this.config);
    this.rewardHistory = [];
    this.currentBestGenome = null;
    
    // 初始化种群
    this.de.initializePopulation(this.config.vectorDimension);
  }
  
  /**
   * ══════════════════════════════════════════════════════════════════
   * 主接口：决策
   * 
   * 输入：任务上下文
   * 输出：LLM指令
   * 
   * 注意：内部策略选择过程不可观察！
   * ══════════════════════════════════════════════════════════════════
   */
  decide(context: TaskContext): MetaThinkingResult {
    // ============================================
    // 黑盒内部 - 以下是不可观察的处理过程
    // ============================================
    
    // 获取当前最优策略
    const bestGenome = this.currentBestGenome || this.de.getBest();
    
    // 构建状态向量（融合任务和历史）
    const stateVector = this.buildStateVector(context);
    
    // 使用策略网络计算动作概率
    const actionProbs = this.policyForward(stateVector, bestGenome);
    
    // 加入混沌混淆
    const confusedProbs = this.addChaos(actionProbs);
    
    // 选择动作
    const action = this.selectAction(confusedProbs);
    
    // 生成LLM指令
    const instructions = this.actionToInstructions(action, context);
    
    // 计算Token预算
    const tokenBudget = this.calculateTokenBudget(context, action);
    
    // ============================================
    // 黑盒输出 - 只有这个是可见的
    // ============================================
    
    return {
      needsLLM: instructions.length > 0,
      instructions,
      totalTokenBudget: tokenBudget,
      estimatedTime: instructions.length * 2000,
      confidence: Math.max(...actionProbs),
      implicitState: stateVector,
    };
  }
  
  /**
   * 反馈学习
   * 
   * 根据奖励信号进化策略
   * 注意：进化过程在内部完成，无梯度路径
   */
  learn(reward: RewardSignal): void {
    // 存储奖励历史
    this.rewardHistory.push(reward);
    
    // 计算综合奖励
    const totalReward = this.computeTotalReward(reward);
    
    // 定义适应度评估函数
    const fitnessEvaluator = (genome: PolicyGenome): number => {
      // 使用最近的历史奖励评估
      const recentRewards = this.rewardHistory.slice(-10);
      if (recentRewards.length === 0) return 0;
      
      // 简化：使用平均奖励作为适应度
      return recentRewards.reduce((sum, r) => sum + this.computeTotalReward(r), 0) / recentRewards.length;
    };
    
    // 执行一代进化
    this.de.evolve(fitnessEvaluator);
    
    // 更新最优基因组
    this.currentBestGenome = this.de.getBest();
    
    console.log(`[DE-RL] 第 ${this.de.getGeneration()} 代，` +
                `最优适应度: ${this.currentBestGenome.fitness.toFixed(4)}, ` +
                `多样性: ${this.de.getDiversity().toFixed(4)}`);
  }
  
  /**
   * 批量进化
   * 
   * 执行多代进化
   */
  evolve(generations: number, fitnessEvaluator: (genome: PolicyGenome) => number): void {
    for (let i = 0; i < generations; i++) {
      this.de.evolve(fitnessEvaluator);
    }
    this.currentBestGenome = this.de.getBest();
  }
  
  /**
   * 获取当前最优策略
   */
  getBestPolicy(): PolicyGenome | null {
    return this.currentBestGenome;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    generation: number;
    bestFitness: number;
    diversity: number;
    avgReward: number;
  } {
    const best = this.de.getBest();
    const recentRewards = this.rewardHistory.slice(-10);
    const avgReward = recentRewards.length > 0
      ? recentRewards.reduce((sum, r) => sum + this.computeTotalReward(r), 0) / recentRewards.length
      : 0;
    
    return {
      generation: this.de.getGeneration(),
      bestFitness: best.fitness,
      diversity: this.de.getDiversity(),
      avgReward,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 构建状态向量
   */
  private buildStateVector(context: TaskContext): ImplicitVector {
    const vector = new Float32Array(this.config.vectorDimension);
    
    // 融合历史向量
    if (context.historyVectors.length > 0) {
      for (const histVec of context.historyVectors) {
        for (let i = 0; i < Math.min(histVec.length, this.config.vectorDimension); i++) {
          vector[i] += histVec[i];
        }
      }
      // 平均
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= context.historyVectors.length;
      }
    }
    
    // 加入任务复杂度编码
    vector[0] = context.complexity;
    
    // 加入任务类型编码
    const typeEncoding: Record<string, number> = {
      'reasoning': 0.1,
      'tool_call': 0.3,
      'creative': 0.5,
      'analysis': 0.7,
      'planning': 0.9,
    };
    vector[1] = typeEncoding[context.type] || 0.5;
    
    // 加入混沌噪声
    for (let i = 0; i < vector.length; i++) {
      vector[i] += (Math.random() * 2 - 1) * this.config.chaosIntensity;
    }
    
    return vector;
  }
  
  /**
   * 策略前向传播
   */
  private policyForward(state: ImplicitVector, genome: PolicyGenome): Float32Array {
    // 动作空间：6种指令类型
    const actionProbs = new Float32Array(6);
    
    // 简化的策略计算
    // 实际应该使用完整的网络计算
    const dim = Math.min(state.length, genome.policyWeights.length / 6);
    
    for (let a = 0; a < 6; a++) {
      let sum = genome.policyBias[a % genome.policyBias.length];
      for (let i = 0; i < dim; i++) {
        sum += genome.policyWeights[a * dim + i] * state[i];
      }
      actionProbs[a] = sum;
    }
    
    // Softmax
    const maxVal = Math.max(...Array.from(actionProbs));
    let expSum = 0;
    for (let i = 0; i < actionProbs.length; i++) {
      actionProbs[i] = Math.exp(actionProbs[i] - maxVal);
      expSum += actionProbs[i];
    }
    for (let i = 0; i < actionProbs.length; i++) {
      actionProbs[i] /= expSum;
    }
    
    return actionProbs;
  }
  
  /**
   * 加入混沌混淆
   */
  private addChaos(probs: Float32Array): Float32Array {
    const confused = new Float32Array(probs.length);
    
    for (let i = 0; i < probs.length; i++) {
      confused[i] = probs[i] + (Math.random() * 2 - 1) * this.config.chaosIntensity;
    }
    
    // 重新归一化
    const sum = Array.from(confused).reduce((s, v) => s + Math.max(0, v), 0);
    if (sum > 0) {
      for (let i = 0; i < confused.length; i++) {
        confused[i] = Math.max(0, confused[i]) / sum;
      }
    }
    
    return confused;
  }
  
  /**
   * 选择动作
   */
  private selectAction(probs: Float32Array): number {
    // 轮盘赌选择
    const r = Math.random();
    let cumSum = 0;
    
    for (let i = 0; i < probs.length; i++) {
      cumSum += probs[i];
      if (r < cumSum) {
        return i;
      }
    }
    
    return probs.length - 1;
  }
  
  /**
   * 动作转指令
   */
  private actionToInstructions(action: number, context: TaskContext): LLMInstruction[] {
    const instructions: LLMInstruction[] = [];
    
    // 动作映射
    const actionTypes = ['decompose', 'reason', 'verify', 'reflect', 'synthesize', 'tool_call'] as const;
    const type = actionTypes[action];
    
    switch (type) {
      case 'decompose':
        instructions.push({
          type: 'decompose',
          prompt: '请将这个任务分解为几个子步骤。',
          tokenBudget: 600,
          expectedOutput: 'structured',
          priority: 1,
          timeout: 12000,
        });
        break;
        
      case 'reason':
        instructions.push({
          type: 'reason',
          prompt: '请直接分析并回答。',
          tokenBudget: 800,
          expectedOutput: 'text',
          priority: 1,
          timeout: 15000,
        });
        break;
        
      case 'verify':
        instructions.push({
          type: 'verify',
          prompt: '请验证你的推理是否正确。',
          tokenBudget: 400,
          expectedOutput: 'text',
          priority: 2,
          timeout: 8000,
        });
        break;
        
      case 'reflect':
        instructions.push({
          type: 'reflect',
          prompt: '请反思一下你的思考过程。',
          tokenBudget: 500,
          expectedOutput: 'text',
          priority: 1,
          timeout: 10000,
        });
        break;
        
      case 'synthesize':
        instructions.push({
          type: 'synthesize',
          prompt: '请综合以上分析给出结论。',
          tokenBudget: 600,
          expectedOutput: 'text',
          priority: 2,
          timeout: 12000,
        });
        break;
        
      case 'tool_call':
        instructions.push({
          type: 'tool_call',
          prompt: '请使用适当的工具完成任务。',
          tokenBudget: 400,
          expectedOutput: 'json',
          priority: 1,
          timeout: 15000,
        });
        break;
    }
    
    return instructions;
  }
  
  /**
   * 计算Token预算
   */
  private calculateTokenBudget(context: TaskContext, action: number): number {
    const base = this.config.vectorDimension;
    const complexityBonus = context.complexity * 200;
    const actionPenalty = action * 50; // 复杂动作消耗更多
    
    return Math.floor(base + complexityBonus - actionPenalty);
  }
  
  /**
   * 计算综合奖励
   */
  private computeTotalReward(reward: RewardSignal): number {
    const weights = this.config.rewardWeights;
    return (
      reward.taskCompletion * weights.taskCompletion +
      reward.efficiency * weights.efficiency +
      reward.userSatisfaction * weights.userSatisfaction +
      reward.tokenSavings * weights.tokenSavings
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export function createDERLController(
  config?: Partial<DERLConfig>
): DERLController {
  return new DERLController(config);
}
