/**
 * 元学习引擎 (L3)
 * 
 * 进化策略的进化器：
 * - 多任务贝叶斯优化
 * - 因果推断
 * - 迁移学习
 * - 策略自适应
 * - 性能预测
 */

import type {
  EvolutionStrategy,
  EvolutionHistory,
  Module,
} from '../types/core';

import type { CoordinatedEvolutionController, CoordinatorConfig } from '../evolution-engine/coordinated-controller';
import type { GPConfig } from '../evolution-engine/genetic-programming-engine';
import type { LLMEvolutionConfig } from '../evolution-engine/llm-evolution-engine';

// ═══════════════════════════════════════════════════════════════
// 元学习配置
// ═══════════════════════════════════════════════════════════════

export interface MetaLearningConfig {
  // 贝叶斯优化
  bayesianOptimization: {
    enabled: boolean;
    acquisitionFunction: 'ei' | 'ucb' | 'pi';
    explorationWeight: number;
    warmupTrials: number;
  };
  
  // 因果推断
  causalInference: {
    enabled: boolean;
    confidenceThreshold: number;
    interventionThreshold: number;
  };
  
  // 迁移学习
  transferLearning: {
    enabled: boolean;
    similarityThreshold: number;
    maxSourceTasks: number;
  };
  
  // 策略自适应
  adaptation: {
    learningRate: number;
    momentum: number;
    decayRate: number;
    windowSize: number;
  };
  
  // 性能预测
  prediction: {
    enabled: boolean;
    horizon: number;
    confidenceLevel: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 策略参数空间
// ═══════════════════════════════════════════════════════════════

export interface StrategyParameters {
  // GP 参数
  populationSize: number;
  crossoverRate: number;
  mutationRate: number;
  tournamentSize: number;
  
  // LLM 参数
  llmTemperature: number;
  llmModel: string;
  
  // 协同参数
  gpWeight: number;
  selectionStrategy: 'adaptive' | 'round-robin' | 'weighted' | 'performance-based';
}

// ═══════════════════════════════════════════════════════════════
// 任务定义
// ═══════════════════════════════════════════════════════════════

export interface Task {
  id: string;
  type: string;
  features: number[];
  bestParameters?: StrategyParameters;
  bestPerformance?: number;
  history: Trial[];
}

export interface Trial {
  parameters: StrategyParameters;
  performance: number;
  duration: number;
  success: boolean;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// 因果关系
// ═══════════════════════════════════════════════════════════════

export interface CausalRelation {
  cause: string;
  effect: string;
  strength: number;
  confidence: number;
  interventions: Intervention[];
}

export interface Intervention {
  condition: string;
  effect: string;
  improvement: number;
}

// ═══════════════════════════════════════════════════════════════
// 元学习引擎
// ═══════════════════════════════════════════════════════════════

export class MetaLearningEngine {
  
  private config: MetaLearningConfig;
  private coordinator: CoordinatedEvolutionController;
  
  // 任务存储
  private tasks: Map<string, Task> = new Map();
  private currentTask: Task | null = null;
  
  // 贝叶斯优化状态
  private surrogateModel: GaussianProcessModel;
  private observedPoints: Array<{ params: StrategyParameters; performance: number }> = [];
  
  // 因果知识库
  private causalRelations: CausalRelation[] = [];
  
  // 自适应状态
  private parameterVelocity: Partial<StrategyParameters> = {};
  private parameterHistory: Array<{ params: StrategyParameters; gradient: Partial<StrategyParameters> }> = [];
  
  // 性能预测模型
  private predictionModel: PerformancePredictor;
  
  constructor(
    coordinator: CoordinatedEvolutionController,
    config?: Partial<MetaLearningConfig>
  ) {
    this.coordinator = coordinator;
    
    this.config = {
      bayesianOptimization: {
        enabled: true,
        acquisitionFunction: 'ei',
        explorationWeight: 0.1,
        warmupTrials: 5,
      },
      causalInference: {
        enabled: true,
        confidenceThreshold: 0.8,
        interventionThreshold: 0.1,
      },
      transferLearning: {
        enabled: true,
        similarityThreshold: 0.7,
        maxSourceTasks: 3,
      },
      adaptation: {
        learningRate: 0.01,
        momentum: 0.9,
        decayRate: 0.99,
        windowSize: 20,
      },
      prediction: {
        enabled: true,
        horizon: 5,
        confidenceLevel: 0.95,
      },
      ...config,
    };
    
    this.surrogateModel = new GaussianProcessModel();
    this.predictionModel = new PerformancePredictor();
  }
  
  // ════════════════════════════════════════════════════════════
  // 核心接口
  // ════════════════════════════════════════════════════════════
  
  /**
   * 开始新任务
   */
  startTask(taskId: string, taskType: string, features: number[]): void {
    this.currentTask = {
      id: taskId,
      type: taskType,
      features,
      history: [],
    };
    
    this.tasks.set(taskId, this.currentTask);
    
    // 尝试迁移学习
    if (this.config.transferLearning.enabled) {
      const transferredParams = this.transferFromSimilarTasks(this.currentTask);
      if (transferredParams) {
        this.currentTask.bestParameters = transferredParams;
      }
    }
  }
  
  /**
   * 优化策略参数
   */
  async optimizeStrategy(): Promise<StrategyParameters> {
    if (!this.currentTask) {
      return this.getDefaultParameters();
    }
    
    // 1. 贝叶斯优化获取候选参数
    const boParams = this.config.bayesianOptimization.enabled
      ? this.bayesianOptimization()
      : this.getDefaultParameters();
    
    // 2. 应用因果推断调整
    const causalAdjustedParams = this.config.causalInference.enabled
      ? this.applyCausalAdjustments(boParams)
      : boParams;
    
    // 3. 应用自适应调整
    const adaptedParams = this.applyAdaptation(causalAdjustedParams);
    
    return adaptedParams;
  }
  
  /**
   * 记录试验结果
   */
  recordTrial(
    parameters: StrategyParameters,
    performance: number,
    duration: number,
    success: boolean
  ): void {
    if (!this.currentTask) return;
    
    const trial: Trial = {
      parameters,
      performance,
      duration,
      success,
      timestamp: Date.now(),
    };
    
    this.currentTask.history.push(trial);
    
    // 更新最佳
    if (!this.currentTask.bestPerformance || performance > this.currentTask.bestPerformance) {
      this.currentTask.bestPerformance = performance;
      this.currentTask.bestParameters = parameters;
    }
    
    // 更新代理模型
    if (this.config.bayesianOptimization.enabled) {
      this.observedPoints.push({ params: parameters, performance });
      this.surrogateModel.update(parameters, performance);
    }
    
    // 更新预测模型
    if (this.config.prediction.enabled) {
      this.predictionModel.update(parameters, performance);
    }
    
    // 学习因果
    if (this.config.causalInference.enabled) {
      this.learnCausality(trial);
    }
    
    // 更新自适应
    this.updateAdaptation(trial);
  }
  
  /**
   * 预测性能
   */
  predictPerformance(parameters: StrategyParameters): { predicted: number; confidence: number } {
    if (!this.config.prediction.enabled) {
      return { predicted: 0.5, confidence: 0 };
    }
    
    return this.predictionModel.predict(parameters);
  }
  
  // ════════════════════════════════════════════════════════════
  // 贝叶斯优化
  // ════════════════════════════════════════════════════════════
  
  private bayesianOptimization(): StrategyParameters {
    // 如果观察点不足，随机采样
    if (this.observedPoints.length < this.config.bayesianOptimization.warmupTrials) {
      return this.randomParameters();
    }
    
    // 使用采集函数找到下一个评估点
    const candidates = this.generateCandidatePoints(100);
    
    let bestCandidate = candidates[0];
    let bestAcquisition = -Infinity;
    
    for (const candidate of candidates) {
      const acquisition = this.computeAcquisition(candidate);
      if (acquisition > bestAcquisition) {
        bestAcquisition = acquisition;
        bestCandidate = candidate;
      }
    }
    
    return bestCandidate;
  }
  
  private computeAcquisition(params: StrategyParameters): number {
    const prediction = this.surrogateModel.predict(params);
    
    switch (this.config.bayesianOptimization.acquisitionFunction) {
      case 'ei': // Expected Improvement
        return this.expectedImprovement(prediction, this.getBestObserved());
      case 'ucb': // Upper Confidence Bound
        return prediction.mean + this.config.bayesianOptimization.explorationWeight * prediction.std;
      case 'pi': // Probability of Improvement
        return this.probabilityOfImprovement(prediction, this.getBestObserved());
      default:
        return prediction.mean;
    }
  }
  
  private expectedImprovement(
    prediction: { mean: number; std: number },
    best: number
  ): number {
    if (prediction.std === 0) return 0;
    
    const z = (prediction.mean - best) / prediction.std;
    const phi = this.normalPDF(z);
    const Phi = this.normalCDF(z);
    
    return (prediction.mean - best) * Phi + prediction.std * phi;
  }
  
  private probabilityOfImprovement(
    prediction: { mean: number; std: number },
    best: number
  ): number {
    if (prediction.std === 0) return prediction.mean > best ? 1 : 0;
    
    const z = (prediction.mean - best) / prediction.std;
    return this.normalCDF(z);
  }
  
  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }
  
  private normalCDF(x: number): number {
    // 近似计算
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  }
  
  private getBestObserved(): number {
    if (this.observedPoints.length === 0) return 0;
    return Math.max(...this.observedPoints.map(p => p.performance));
  }
  
  // ════════════════════════════════════════════════════════════
  // 因果推断
  // ════════════════════════════════════════════════════════════
  
  private applyCausalAdjustments(params: StrategyParameters): StrategyParameters {
    const adjusted = { ...params };
    
    for (const relation of this.causalRelations) {
      if (relation.confidence < this.config.causalInference.confidenceThreshold) {
        continue;
      }
      
      // 应用因果干预
      for (const intervention of relation.interventions) {
        if (intervention.improvement > this.config.causalInference.interventionThreshold) {
          // 根据因果关系调整参数
          this.applyIntervention(adjusted, intervention);
        }
      }
    }
    
    return adjusted;
  }
  
  private applyIntervention(params: StrategyParameters, intervention: Intervention): void {
    // 简化：根据干预效果微调参数
    switch (intervention.condition) {
      case 'low_fitness':
        params.mutationRate = Math.min(params.mutationRate * 1.1, 0.5);
        break;
      case 'high_fitness':
        params.mutationRate = Math.max(params.mutationRate * 0.9, 0.05);
        break;
      case 'slow_convergence':
        params.populationSize = Math.floor(params.populationSize * 1.2);
        break;
      case 'fast_convergence':
        params.populationSize = Math.max(Math.floor(params.populationSize * 0.9), 20);
        break;
    }
  }
  
  private learnCausality(trial: Trial): void {
    // 分析参数变化与性能变化的关系
    const history = this.currentTask?.history ?? [];
    
    if (history.length < 3) return;
    
    // 检测参数变化模式
    const recentTrials = history.slice(-3);
    
    // 检测参数趋势
    const mutationTrend = this.detectTrend(recentTrials.map(t => t.parameters.mutationRate));
    const performanceTrend = this.detectTrend(recentTrials.map(t => t.performance));
    
    // 如果趋势相关，建立因果关系
    if (mutationTrend.direction !== 0 && performanceTrend.direction !== 0) {
      const correlation = mutationTrend.direction * performanceTrend.direction;
      
      if (Math.abs(correlation) > 0.5) {
        this.updateCausalRelation(
          'mutationRate',
          'performance',
          correlation,
          Math.min(recentTrials.length / 10, 1)
        );
      }
    }
  }
  
  private detectTrend(values: number[]): { direction: number; strength: number } {
    if (values.length < 2) return { direction: 0, strength: 0 };
    
    let up = 0;
    let down = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) up++;
      else if (values[i] < values[i - 1]) down++;
    }
    
    const total = up + down;
    if (total === 0) return { direction: 0, strength: 0 };
    
    return {
      direction: (up - down) / total,
      strength: Math.max(up, down) / total,
    };
  }
  
  private updateCausalRelation(
    cause: string,
    effect: string,
    strength: number,
    confidence: number
  ): void {
    const existing = this.causalRelations.find(
      r => r.cause === cause && r.effect === effect
    );
    
    if (existing) {
      // 更新现有关系
      existing.strength = existing.strength * 0.8 + strength * 0.2;
      existing.confidence = Math.min(existing.confidence + 0.05, 1);
    } else {
      // 创建新关系
      this.causalRelations.push({
        cause,
        effect,
        strength,
        confidence,
        interventions: [],
      });
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 迁移学习
  // ════════════════════════════════════════════════════════════
  
  private transferFromSimilarTasks(task: Task): StrategyParameters | null {
    const similarTasks = this.findSimilarTasks(task);
    
    if (similarTasks.length === 0) return null;
    
    // 加权平均最佳参数
    const weights = similarTasks.map(t => t.similarity);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    if (totalWeight === 0) return null;
    
    const transferredParams: StrategyParameters = {
      populationSize: 0,
      crossoverRate: 0,
      mutationRate: 0,
      tournamentSize: 0,
      llmTemperature: 0,
      llmModel: 'doubao-seed-1-8-251228',
      gpWeight: 0,
      selectionStrategy: 'adaptive',
    };
    
    for (let i = 0; i < similarTasks.length; i++) {
      const params = similarTasks[i].task.bestParameters;
      if (!params) continue;
      
      const weight = weights[i] / totalWeight;
      
      transferredParams.populationSize += (params.populationSize * weight);
      transferredParams.crossoverRate += (params.crossoverRate * weight);
      transferredParams.mutationRate += (params.mutationRate * weight);
      transferredParams.tournamentSize += (params.tournamentSize * weight);
      transferredParams.llmTemperature += (params.llmTemperature * weight);
      transferredParams.gpWeight += (params.gpWeight * weight);
    }
    
    // 确保整数参数
    transferredParams.populationSize = Math.round(transferredParams.populationSize);
    transferredParams.tournamentSize = Math.round(transferredParams.tournamentSize);
    
    return transferredParams;
  }
  
  private findSimilarTasks(task: Task): Array<{ task: Task; similarity: number }> {
    const similarities: Array<{ task: Task; similarity: number }> = [];
    
    for (const [id, t] of this.tasks) {
      if (id === task.id) continue;
      if (!t.bestParameters) continue;
      
      const similarity = this.computeTaskSimilarity(task, t);
      
      if (similarity >= this.config.transferLearning.similarityThreshold) {
        similarities.push({ task: t, similarity });
      }
    }
    
    // 按相似度排序，取前 N 个
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.transferLearning.maxSourceTasks);
  }
  
  private computeTaskSimilarity(task1: Task, task2: Task): number {
    // 基于特征向量的余弦相似度
    const f1 = task1.features;
    const f2 = task2.features;
    
    if (f1.length !== f2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < f1.length; i++) {
      dotProduct += f1[i] * f2[i];
      norm1 += f1[i] * f1[i];
      norm2 += f2[i] * f2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  // ════════════════════════════════════════════════════════════
  // 自适应调整
  // ════════════════════════════════════════════════════════════
  
  private applyAdaptation(params: StrategyParameters): StrategyParameters {
    const adapted = { ...params };
    
    // 应用动量
    const { learningRate, momentum } = this.config.adaptation;
    
    for (const key of Object.keys(this.parameterVelocity) as (keyof StrategyParameters)[]) {
      if (typeof this.parameterVelocity[key] === 'number') {
        (adapted as any)[key] += this.parameterVelocity[key]! * momentum;
      }
    }
    
    return this.clampParameters(adapted);
  }
  
  private updateAdaptation(trial: Trial): void {
    const history = this.parameterHistory;
    
    if (history.length > 0) {
      const lastEntry = history[history.length - 1];
      const gradient = this.computeGradient(lastEntry.params, trial.parameters, trial.performance);
      
      // 更新速度
      const { learningRate, momentum } = this.config.adaptation;
      
      for (const key of Object.keys(gradient) as (keyof StrategyParameters)[]) {
        const g = gradient[key];
        if (typeof g === 'number') {
          const currentValue = this.parameterVelocity[key];
          (this.parameterVelocity as Record<string, number | undefined>)[key] = 
            momentum * (typeof currentValue === 'number' ? currentValue : 0) + learningRate * g;
        }
      }
    }
    
    // 记录历史
    history.push({
      params: trial.parameters,
      gradient: {},
    });
    
    // 保持窗口大小
    if (history.length > this.config.adaptation.windowSize) {
      history.shift();
    }
  }
  
  private computeGradient(
    oldParams: StrategyParameters,
    newParams: StrategyParameters,
    performance: number
  ): Partial<StrategyParameters> {
    const gradient: Partial<StrategyParameters> = {};
    
    for (const key of Object.keys(newParams) as (keyof StrategyParameters)[]) {
      const oldValue = oldParams[key];
      const newValue = newParams[key];
      
      if (typeof oldValue === 'number' && typeof newValue === 'number') {
        const diff = newValue - oldValue;
        if (diff !== 0) {
          (gradient as Record<string, number | undefined>)[key] = performance * Math.sign(diff);
        }
      }
    }
    
    return gradient;
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  private getDefaultParameters(): StrategyParameters {
    return {
      populationSize: 100,
      crossoverRate: 0.8,
      mutationRate: 0.2,
      tournamentSize: 5,
      llmTemperature: 0.7,
      llmModel: 'doubao-seed-1-8-251228',
      gpWeight: 0.5,
      selectionStrategy: 'adaptive',
    };
  }
  
  private randomParameters(): StrategyParameters {
    return {
      populationSize: Math.floor(Math.random() * 200) + 20,
      crossoverRate: Math.random() * 0.5 + 0.5,
      mutationRate: Math.random() * 0.3 + 0.05,
      tournamentSize: Math.floor(Math.random() * 10) + 2,
      llmTemperature: Math.random() * 1.5 + 0.3,
      llmModel: 'doubao-seed-1-8-251228',
      gpWeight: Math.random(),
      selectionStrategy: ['adaptive', 'round-robin', 'weighted', 'performance-based'][Math.floor(Math.random() * 4)] as any,
    };
  }
  
  private generateCandidatePoints(count: number): StrategyParameters[] {
    const candidates: StrategyParameters[] = [];
    
    for (let i = 0; i < count; i++) {
      // 混合随机和基于最佳点的扰动
      if (Math.random() < 0.5 && this.observedPoints.length > 0) {
        const best = this.observedPoints.reduce((a, b) => 
          b.performance > a.performance ? b : a
        );
        candidates.push(this.perturbParameters(best.params));
      } else {
        candidates.push(this.randomParameters());
      }
    }
    
    return candidates;
  }
  
  private perturbParameters(params: StrategyParameters): StrategyParameters {
    const perturbed = { ...params };
    const strength = 0.2;
    
    perturbed.populationSize = Math.floor(perturbed.populationSize * (1 + (Math.random() - 0.5) * strength));
    perturbed.crossoverRate = perturbed.crossoverRate * (1 + (Math.random() - 0.5) * strength);
    perturbed.mutationRate = perturbed.mutationRate * (1 + (Math.random() - 0.5) * strength);
    perturbed.tournamentSize = Math.floor(perturbed.tournamentSize * (1 + (Math.random() - 0.5) * strength));
    perturbed.llmTemperature = perturbed.llmTemperature * (1 + (Math.random() - 0.5) * strength);
    perturbed.gpWeight = perturbed.gpWeight * (1 + (Math.random() - 0.5) * strength);
    
    return this.clampParameters(perturbed);
  }
  
  private clampParameters(params: StrategyParameters): StrategyParameters {
    return {
      populationSize: Math.max(10, Math.min(500, params.populationSize)),
      crossoverRate: Math.max(0.1, Math.min(1, params.crossoverRate)),
      mutationRate: Math.max(0.01, Math.min(0.5, params.mutationRate)),
      tournamentSize: Math.max(2, Math.min(20, params.tournamentSize)),
      llmTemperature: Math.max(0, Math.min(2, params.llmTemperature)),
      llmModel: params.llmModel,
      gpWeight: Math.max(0, Math.min(1, params.gpWeight)),
      selectionStrategy: params.selectionStrategy,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 公共查询
  // ════════════════════════════════════════════════════════════
  
  /**
   * 获取因果关系
   */
  getCausalRelations(): CausalRelation[] {
    return [...this.causalRelations];
  }
  
  /**
   * 获取任务历史
   */
  getTaskHistory(taskId: string): Trial[] | undefined {
    return this.tasks.get(taskId)?.history;
  }
  
  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}

// ═══════════════════════════════════════════════════════════════
// 高斯过程模型 (简化实现)
// ═══════════════════════════════════════════════════════════════

class GaussianProcessModel {
  private observations: Array<{ params: StrategyParameters; performance: number }> = [];
  private mean: number = 0;
  private variance: number = 1;
  
  update(params: StrategyParameters, performance: number): void {
    this.observations.push({ params, performance });
    
    // 更新统计
    const performances = this.observations.map(o => o.performance);
    this.mean = performances.reduce((a, b) => a + b, 0) / performances.length;
    
    const squaredDiffs = performances.map(p => Math.pow(p - this.mean, 2));
    this.variance = squaredDiffs.reduce((a, b) => a + b, 0) / performances.length;
  }
  
  predict(params: StrategyParameters): { mean: number; std: number } {
    if (this.observations.length === 0) {
      return { mean: 0.5, std: 1 };
    }
    
    // 简化：基于最近邻的预测
    let nearestDist = Infinity;
    let nearestPerf = this.mean;
    
    for (const obs of this.observations) {
      const dist = this.paramsDistance(params, obs.params);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPerf = obs.performance;
      }
    }
    
    // 均值是最近邻的性能，标准差与距离成正比
    const std = Math.sqrt(this.variance) * (1 + nearestDist);
    
    return {
      mean: nearestPerf,
      std: Math.max(std, 0.01),
    };
  }
  
  private paramsDistance(p1: StrategyParameters, p2: StrategyParameters): number {
    const d1 = (p1.populationSize - p2.populationSize) / 500;
    const d2 = (p1.crossoverRate - p2.crossoverRate) / 0.9;
    const d3 = (p1.mutationRate - p2.mutationRate) / 0.49;
    const d4 = (p1.tournamentSize - p2.tournamentSize) / 18;
    const d5 = (p1.llmTemperature - p2.llmTemperature) / 2;
    const d6 = (p1.gpWeight - p2.gpWeight);
    
    return Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3 + d4 * d4 + d5 * d5 + d6 * d6);
  }
}

// ═══════════════════════════════════════════════════════════════
// 性能预测器
// ═══════════════════════════════════════════════════════════════

class PerformancePredictor {
  private history: Array<{ params: StrategyParameters; performance: number }> = [];
  
  update(params: StrategyParameters, performance: number): void {
    this.history.push({ params, performance });
    
    // 保持合理大小
    if (this.history.length > 100) {
      this.history.shift();
    }
  }
  
  predict(params: StrategyParameters): { predicted: number; confidence: number } {
    if (this.history.length < 5) {
      return { predicted: 0.5, confidence: 0 };
    }
    
    // 加权平均（基于相似度）
    const similarities = this.history.map(h => ({
      performance: h.performance,
      similarity: this.computeSimilarity(params, h.params),
    }));
    
    const totalSim = similarities.reduce((sum, s) => sum + s.similarity, 0);
    
    if (totalSim === 0) {
      return { predicted: 0.5, confidence: 0 };
    }
    
    const predicted = similarities.reduce(
      (sum, s) => sum + s.performance * s.similarity / totalSim,
      0
    );
    
    const confidence = Math.min(totalSim / this.history.length, 1);
    
    return { predicted, confidence };
  }
  
  private computeSimilarity(p1: StrategyParameters, p2: StrategyParameters): number {
    // 简单的相似度计算
    let sim = 0;
    let count = 0;
    
    const numericKeys: (keyof StrategyParameters)[] = [
      'populationSize', 'crossoverRate', 'mutationRate',
      'tournamentSize', 'llmTemperature', 'gpWeight'
    ];
    
    for (const key of numericKeys) {
      const v1 = p1[key] as number;
      const v2 = p2[key] as number;
      
      if (v1 !== undefined && v2 !== undefined) {
        const max = Math.max(Math.abs(v1), Math.abs(v2), 0.001);
        sim += 1 - Math.abs(v1 - v2) / max;
        count++;
      }
    }
    
    return count > 0 ? sim / count : 0;
  }
}
