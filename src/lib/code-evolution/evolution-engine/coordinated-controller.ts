/**
 * 协同进化控制器
 * 
 * 协调遗传编程(GP)和LLM进化引擎：
 * - 动态选择最佳进化引擎
 * - 资源分配与负载均衡
 * - 结果融合与质量评估
 * - 自适应策略调整
 */

import type {
  Module,
  FitnessScore,
  FitnessContext,
  EvolutionHistory,
} from '../types/core';

import { GeneticProgrammingEngine, type GPConfig, type EvolutionResult as GPEvolutionResult } from './genetic-programming-engine';
import { LLMEvolutionEngine, type LLMEvolutionConfig, type LLMEvolutionResult } from './llm-evolution-engine';
import type { EvolutionCandidate } from '../sandbox/test-executor';

// ═══════════════════════════════════════════════════════════════
// 协同控制器配置
// ═══════════════════════════════════════════════════════════════

export interface CoordinatorConfig {
  // 引擎权重
  gpWeight: number;
  llmWeight: number;
  
  // 选择策略
  selectionStrategy: 'adaptive' | 'round-robin' | 'weighted' | 'performance-based';
  
  // 融合策略
  fusionStrategy: 'best' | 'combine' | 'ensemble';
  
  // 适应性参数
  adaptationRate: number;
  performanceWindow: number;
  
  // 资源限制
  maxConcurrentGP: number;
  maxConcurrentLLM: number;
  
  // 质量阈值
  minFitnessThreshold: number;
  highFitnessThreshold: number;
}

// ═══════════════════════════════════════════════════════════════
// 引擎性能统计
// ═══════════════════════════════════════════════════════════════

interface EngineStats {
  totalInvocations: number;
  successfulEvolutions: number;
  averageImprovement: number;
  averageTime: number;
  bestResult: number;
  recentPerformance: number[];
}

// ═══════════════════════════════════════════════════════════════
// 进化任务
// ═══════════════════════════════════════════════════════════════

interface EvolutionTask {
  id: string;
  candidate: EvolutionCandidate;
  context: FitnessContext;
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
}

// ═══════════════════════════════════════════════════════════════
// 协同进化结果
// ═══════════════════════════════════════════════════════════════

export interface CoordinatedEvolutionResult {
  success: boolean;
  bestCandidate?: EvolutionCandidate;
  allCandidates?: EvolutionCandidate[];
  engineUsed: 'gp' | 'llm' | 'both';
  gpResult?: GPEvolutionResult;
  llmResult?: LLMEvolutionResult;
  reasoning: string;
  metrics: {
    totalTime: number;
    gpTime?: number;
    llmTime?: number;
    improvement: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 协同进化控制器
// ═══════════════════════════════════════════════════════════════

export class CoordinatedEvolutionController {
  
  private config: CoordinatorConfig;
  private gpEngine: GeneticProgrammingEngine;
  private llmEngine: LLMEvolutionEngine;
  
  // 统计信息
  private gpStats: EngineStats;
  private llmStats: EngineStats;
  
  // 历史记录
  private history: Array<{
    timestamp: number;
    engine: 'gp' | 'llm';
    improvement: number;
    success: boolean;
  }>;
  
  // 适应度评估器
  private fitnessEvaluator: (candidate: EvolutionCandidate, context: FitnessContext) => Promise<FitnessScore>;
  
  constructor(
    gpConfig: Partial<GPConfig>,
    llmConfig: Partial<LLMEvolutionConfig>,
    coordinatorConfig: Partial<CoordinatorConfig>,
    fitnessEvaluator: (candidate: EvolutionCandidate, context: FitnessContext) => Promise<FitnessScore>
  ) {
    this.config = {
      gpWeight: 0.5,
      llmWeight: 0.5,
      selectionStrategy: 'adaptive',
      fusionStrategy: 'best',
      adaptationRate: 0.1,
      performanceWindow: 20,
      maxConcurrentGP: 2,
      maxConcurrentLLM: 4,
      minFitnessThreshold: 0.3,
      highFitnessThreshold: 0.8,
      ...coordinatorConfig,
    };
    
    this.fitnessEvaluator = fitnessEvaluator;
    
    // 初始化引擎
    this.gpEngine = new GeneticProgrammingEngine(gpConfig, fitnessEvaluator);
    this.llmEngine = new LLMEvolutionEngine(llmConfig);
    
    // 初始化统计
    this.gpStats = this.createEmptyStats();
    this.llmStats = this.createEmptyStats();
    
    this.history = [];
  }
  
  // ════════════════════════════════════════════════════════════
  // 核心进化接口
  // ════════════════════════════════════════════════════════════
  
  /**
   * 协同进化
   */
  async evolve(
    candidate: EvolutionCandidate,
    context: FitnessContext
  ): Promise<CoordinatedEvolutionResult> {
    
    const startTime = Date.now();
    const originalFitness = candidate.fitness ?? 0;
    
    // 选择引擎
    const engineSelection = this.selectEngine(candidate, context);
    
    let result: CoordinatedEvolutionResult;
    
    switch (engineSelection.strategy) {
      case 'gp':
        result = await this.evolveWithGP(candidate, context, startTime);
        break;
        
      case 'llm':
        result = await this.evolveWithLLM(candidate, context, startTime);
        break;
        
      case 'both':
        result = await this.evolveWithBoth(candidate, context, startTime);
        break;
        
      default:
        result = await this.evolveWithBoth(candidate, context, startTime);
    }
    
    // 更新统计
    this.updateStats(result);
    
    return result;
  }
  
  /**
   * 批量协同进化
   */
  async evolveBatch(
    candidates: EvolutionCandidate[],
    context: FitnessContext
  ): Promise<CoordinatedEvolutionResult[]> {
    
    const results: CoordinatedEvolutionResult[] = [];
    
    for (const candidate of candidates) {
      const result = await this.evolve(candidate, context);
      results.push(result);
    }
    
    return results;
  }
  
  // ════════════════════════════════════════════════════════════
  // 引擎选择策略
  // ════════════════════════════════════════════════════════════
  
  /**
   * 选择最佳引擎
   */
  private selectEngine(
    candidate: EvolutionCandidate,
    context: FitnessContext
  ): { strategy: 'gp' | 'llm' | 'both'; reasoning: string } {
    
    switch (this.config.selectionStrategy) {
      case 'adaptive':
        return this.adaptiveSelection(candidate, context);
        
      case 'round-robin':
        return this.roundRobinSelection();
        
      case 'weighted':
        return this.weightedSelection();
        
      case 'performance-based':
        return this.performanceBasedSelection();
        
      default:
        return this.adaptiveSelection(candidate, context);
    }
  }
  
  /**
   * 自适应选择
   */
  private adaptiveSelection(
    candidate: EvolutionCandidate,
    context: FitnessContext
  ): { strategy: 'gp' | 'llm' | 'both'; reasoning: string } {
    
    const fitness = candidate.fitness ?? 0;
    
    // 低适应度：先用GP探索，再用LLM修复
    if (fitness < this.config.minFitnessThreshold) {
      return {
        strategy: 'both',
        reasoning: '低适应度：GP探索 + LLM修复',
      };
    }
    
    // 中等适应度：根据引擎历史表现选择
    if (fitness < this.config.highFitnessThreshold) {
      const gpScore = this.calculateEngineScore(this.gpStats);
      const llmScore = this.calculateEngineScore(this.llmStats);
      
      if (Math.abs(gpScore - llmScore) < 0.1) {
        return {
          strategy: 'both',
          reasoning: '表现相近：双引擎协同',
        };
      }
      
      return {
        strategy: gpScore > llmScore ? 'gp' : 'llm',
        reasoning: `基于历史表现选择 ${gpScore > llmScore ? 'GP' : 'LLM'}`,
      };
    }
    
    // 高适应度：用LLM进行精细优化
    return {
      strategy: 'llm',
      reasoning: '高适应度：LLM精细优化',
    };
  }
  
  /**
   * 轮询选择
   */
  private roundRobinSelection(): { strategy: 'gp' | 'llm'; reasoning: string } {
    const lastEngine = this.history[this.history.length - 1]?.engine;
    const next = lastEngine === 'gp' ? 'llm' : 'gp';
    
    return {
      strategy: next,
      reasoning: '轮询选择',
    };
  }
  
  /**
   * 加权随机选择
   */
  private weightedSelection(): { strategy: 'gp' | 'llm'; reasoning: string } {
    const r = Math.random();
    const gpThreshold = this.config.gpWeight / (this.config.gpWeight + this.config.llmWeight);
    
    return {
      strategy: r < gpThreshold ? 'gp' : 'llm',
      reasoning: `加权选择 (GP: ${this.config.gpWeight}, LLM: ${this.config.llmWeight})`,
    };
  }
  
  /**
   * 基于表现选择
   */
  private performanceBasedSelection(): { strategy: 'gp' | 'llm' | 'both'; reasoning: string } {
    const gpScore = this.calculateEngineScore(this.gpStats);
    const llmScore = this.calculateEngineScore(this.llmStats);
    
    // 表现差异大时选择表现好的
    if (Math.abs(gpScore - llmScore) > 0.2) {
      return {
        strategy: gpScore > llmScore ? 'gp' : 'llm',
        reasoning: `表现选择: ${gpScore > llmScore ? 'GP' : 'LLM'} (${gpScore.toFixed(2)} vs ${llmScore.toFixed(2)})`,
      };
    }
    
    // 表现接近时使用双引擎
    return {
      strategy: 'both',
      reasoning: '表现接近: 双引擎协同',
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 引擎执行
  // ════════════════════════════════════════════════════════════
  
  /**
   * 使用 GP 进化
   */
  private async evolveWithGP(
    candidate: EvolutionCandidate,
    context: FitnessContext,
    startTime: number
  ): Promise<CoordinatedEvolutionResult> {
    
    const gpStart = Date.now();
    
    try {
      // 运行 GP 进化
      const gpResult = await this.gpEngine.evolve([candidate], context);
      const gpEnd = Date.now();
      
      const bestCandidate = this.individualToCandidate(gpResult.best);
      const newFitness = bestCandidate.fitness ?? 0;
      const improvement = newFitness - (candidate.fitness ?? 0);
      
      return {
        success: gpResult.converged,
        bestCandidate,
        engineUsed: 'gp',
        gpResult,
        reasoning: gpResult.reason,
        metrics: {
          totalTime: gpEnd - startTime,
          gpTime: gpEnd - gpStart,
          improvement,
        },
      };
      
    } catch (error) {
      return {
        success: false,
        engineUsed: 'gp',
        reasoning: `GP 失败: ${error instanceof Error ? error.message : String(error)}`,
        metrics: {
          totalTime: Date.now() - startTime,
          improvement: 0,
        },
      };
    }
  }
  
  /**
   * 使用 LLM 进化
   */
  private async evolveWithLLM(
    candidate: EvolutionCandidate,
    context: FitnessContext,
    startTime: number
  ): Promise<CoordinatedEvolutionResult> {
    
    const llmStart = Date.now();
    
    try {
      const llmResult = await this.llmEngine.evolve(candidate, context);
      const llmEnd = Date.now();
      
      if (!llmResult.success || !llmResult.candidate) {
        return {
          success: false,
          engineUsed: 'llm',
          llmResult,
          reasoning: llmResult.reasoning ?? 'LLM 进化失败',
          metrics: {
            totalTime: llmEnd - startTime,
            llmTime: llmEnd - llmStart,
            improvement: 0,
          },
        };
      }
      
      // 评估新候选
      const newFitness = await this.fitnessEvaluator(llmResult.candidate, context);
      llmResult.candidate.fitness = newFitness.overall;
      
      const improvement = newFitness.overall - (candidate.fitness ?? 0);
      
      return {
        success: true,
        bestCandidate: llmResult.candidate,
        engineUsed: 'llm',
        llmResult,
        reasoning: llmResult.reasoning ?? 'LLM 进化完成',
        metrics: {
          totalTime: llmEnd - startTime,
          llmTime: llmEnd - llmStart,
          improvement,
        },
      };
      
    } catch (error) {
      return {
        success: false,
        engineUsed: 'llm',
        reasoning: `LLM 失败: ${error instanceof Error ? error.message : String(error)}`,
        metrics: {
          totalTime: Date.now() - startTime,
          improvement: 0,
        },
      };
    }
  }
  
  /**
   * 双引擎协同进化
   */
  private async evolveWithBoth(
    candidate: EvolutionCandidate,
    context: FitnessContext,
    startTime: number
  ): Promise<CoordinatedEvolutionResult> {
    
    const gpStart = Date.now();
    const llmStart = Date.now();
    
    // 并行运行两个引擎
    const [gpResult, llmResult] = await Promise.allSettled([
      this.gpEngine.evolve([candidate], context),
      this.llmEngine.evolve(candidate, context),
    ]);
    
    const gpEnd = Date.now();
    const llmEnd = Date.now();
    
    // 处理结果
    const results: Array<{
      engine: 'gp' | 'llm';
      candidate?: EvolutionCandidate;
      success: boolean;
    }> = [];
    
    if (gpResult.status === 'fulfilled') {
      results.push({
        engine: 'gp',
        candidate: this.individualToCandidate(gpResult.value.best),
        success: gpResult.value.converged,
      });
    }
    
    if (llmResult.status === 'fulfilled' && llmResult.value.success) {
      results.push({
        engine: 'llm',
        candidate: llmResult.value.candidate,
        success: true,
      });
    }
    
    // 融合结果
    const fusionResult = this.fuseResults(results, candidate);
    
    return {
      success: fusionResult.success,
      bestCandidate: fusionResult.bestCandidate,
      allCandidates: results.map(r => r.candidate).filter(Boolean) as EvolutionCandidate[],
      engineUsed: 'both',
      gpResult: gpResult.status === 'fulfilled' ? gpResult.value : undefined,
      llmResult: llmResult.status === 'fulfilled' ? llmResult.value : undefined,
      reasoning: fusionResult.reasoning,
      metrics: {
        totalTime: Math.max(gpEnd, llmEnd) - startTime,
        gpTime: gpEnd - gpStart,
        llmTime: llmEnd - llmStart,
        improvement: fusionResult.improvement,
      },
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 结果融合
  // ════════════════════════════════════════════════════════════
  
  /**
   * 融合多引擎结果
   */
  private fuseResults(
    results: Array<{
      engine: 'gp' | 'llm';
      candidate?: EvolutionCandidate;
      success: boolean;
    }>,
    original: EvolutionCandidate
  ): {
    success: boolean;
    bestCandidate?: EvolutionCandidate;
    reasoning: string;
    improvement: number;
  } {
    
    const successfulResults = results.filter(r => r.success && r.candidate);
    
    if (successfulResults.length === 0) {
      return {
        success: false,
        reasoning: '所有引擎均失败',
        improvement: 0,
      };
    }
    
    switch (this.config.fusionStrategy) {
      case 'best':
        return this.selectBest(successfulResults, original);
        
      case 'combine':
        return this.combineResults(successfulResults, original);
        
      case 'ensemble':
        return this.ensembleResults(successfulResults, original);
        
      default:
        return this.selectBest(successfulResults, original);
    }
  }
  
  /**
   * 选择最佳结果
   */
  private selectBest(
    results: Array<{
      engine: 'gp' | 'llm';
      candidate?: EvolutionCandidate;
    }>,
    original: EvolutionCandidate
  ) {
    const sorted = results
      .filter(r => r.candidate)
      .sort((a, b) => 
        (b.candidate!.fitness ?? 0) - (a.candidate!.fitness ?? 0)
      );
    
    const best = sorted[0];
    
    return {
      success: true,
      bestCandidate: best?.candidate,
      reasoning: `选择最佳: ${best?.engine} (fitness: ${best?.candidate?.fitness?.toFixed(3)})`,
      improvement: (best?.candidate?.fitness ?? 0) - (original.fitness ?? 0),
    };
  }
  
  /**
   * 组合结果
   */
  private combineResults(
    results: Array<{
      engine: 'gp' | 'llm';
      candidate?: EvolutionCandidate;
    }>,
    original: EvolutionCandidate
  ) {
    // 简化：选择最佳
    return this.selectBest(results, original);
  }
  
  /**
   * 集成结果
   */
  private ensembleResults(
    results: Array<{
      engine: 'gp' | 'llm';
      candidate?: EvolutionCandidate;
    }>,
    original: EvolutionCandidate
  ) {
    // 简化：选择最佳
    return this.selectBest(results, original);
  }
  
  // ════════════════════════════════════════════════════════════
  // 统计与自适应
  // ════════════════════════════════════════════════════════════
  
  /**
   * 更新统计
   */
  private updateStats(result: CoordinatedEvolutionResult): void {
    const engine = result.engineUsed;
    const improvement = result.metrics.improvement;
    const success = result.success;
    
    if (engine === 'gp' || engine === 'both') {
      this.gpStats.totalInvocations++;
      if (success) {
        this.gpStats.successfulEvolutions++;
        this.gpStats.averageImprovement = 
          (this.gpStats.averageImprovement * (this.gpStats.successfulEvolutions - 1) + improvement) / 
          this.gpStats.successfulEvolutions;
      }
      this.gpStats.recentPerformance.push(improvement);
      if (this.gpStats.recentPerformance.length > this.config.performanceWindow) {
        this.gpStats.recentPerformance.shift();
      }
    }
    
    if (engine === 'llm' || engine === 'both') {
      this.llmStats.totalInvocations++;
      if (success) {
        this.llmStats.successfulEvolutions++;
        this.llmStats.averageImprovement = 
          (this.llmStats.averageImprovement * (this.llmStats.successfulEvolutions - 1) + improvement) / 
          this.llmStats.successfulEvolutions;
      }
      this.llmStats.recentPerformance.push(improvement);
      if (this.llmStats.recentPerformance.length > this.config.performanceWindow) {
        this.llmStats.recentPerformance.shift();
      }
    }
    
    // 记录历史
    this.history.push({
      timestamp: Date.now(),
      engine: engine === 'both' ? (improvement > 0 ? 'gp' : 'llm') : engine,
      improvement,
      success,
    });
    
    // 自适应调整权重
    this.adaptWeights();
  }
  
  /**
   * 自适应调整权重
   */
  private adaptWeights(): void {
    if (this.history.length < 10) return;
    
    const recentHistory = this.history.slice(-this.config.performanceWindow);
    
    const gpAvg = recentHistory
      .filter(h => h.engine === 'gp')
      .reduce((sum, h) => sum + h.improvement, 0) / 
      Math.max(recentHistory.filter(h => h.engine === 'gp').length, 1);
    
    const llmAvg = recentHistory
      .filter(h => h.engine === 'llm')
      .reduce((sum, h) => sum + h.improvement, 0) / 
      Math.max(recentHistory.filter(h => h.engine === 'llm').length, 1);
    
    // 更新权重
    const total = Math.max(gpAvg + llmAvg, 0.001);
    const newGpWeight = (gpAvg / total + this.config.gpWeight) / 2;
    const newLlmWeight = (llmAvg / total + this.config.llmWeight) / 2;
    
    // 平滑更新
    this.config.gpWeight = this.config.gpWeight * (1 - this.config.adaptationRate) + 
                           newGpWeight * this.config.adaptationRate;
    this.config.llmWeight = this.config.llmWeight * (1 - this.config.adaptationRate) + 
                            newLlmWeight * this.config.adaptationRate;
    
    // 归一化
    const sum = this.config.gpWeight + this.config.llmWeight;
    this.config.gpWeight /= sum;
    this.config.llmWeight /= sum;
  }
  
  /**
   * 计算引擎得分
   */
  private calculateEngineScore(stats: EngineStats): number {
    if (stats.totalInvocations === 0) return 0.5;
    
    const successRate = stats.successfulEvolutions / stats.totalInvocations;
    const avgImprovement = stats.averageImprovement;
    const recentAvg = stats.recentPerformance.length > 0
      ? stats.recentPerformance.reduce((a, b) => a + b, 0) / stats.recentPerformance.length
      : 0;
    
    // 综合得分
    return successRate * 0.3 + 
           Math.max(0, avgImprovement) * 0.4 + 
           Math.max(0, recentAvg) * 0.3;
  }
  
  /**
   * 创建空统计
   */
  private createEmptyStats(): EngineStats {
    return {
      totalInvocations: 0,
      successfulEvolutions: 0,
      averageImprovement: 0,
      averageTime: 0,
      bestResult: 0,
      recentPerformance: [],
    };
  }
  
  /**
   * 个体转候选
   */
  private individualToCandidate(individual: { id: string; genotype: string; fitness?: number }): EvolutionCandidate {
    return {
      id: individual.id,
      module: {
        id: `module-${individual.id}`,
        name: `evolved-${individual.id}`,
        version: '0.0.1',
        code: individual.genotype,
        dependencies: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
          evolutionHistory: [],
        },
      },
      code: individual.genotype,
      fitness: individual.fitness,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 公共查询方法
  // ════════════════════════════════════════════════════════════
  
  /**
   * 获取引擎统计
   */
  getStats(): { gp: EngineStats; llm: EngineStats } {
    return {
      gp: { ...this.gpStats },
      llm: { ...this.llmStats },
    };
  }
  
  /**
   * 获取当前权重
   */
  getWeights(): { gp: number; llm: number } {
    return {
      gp: this.config.gpWeight,
      llm: this.config.llmWeight,
    };
  }
  
  /**
   * 获取历史记录
   */
  getHistory(): Array<{ timestamp: number; engine: 'gp' | 'llm'; improvement: number; success: boolean }> {
    return [...this.history];
  }
}
