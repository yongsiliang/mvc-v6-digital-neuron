/**
 * 元学习引擎 (Meta Learning Engine)
 * 
 * 核心理念：
 * "对话不是目的，学习和进化才是"
 * 
 * 功能：
 * 1. 从每次对话中主动学习
 * 2. 思考更高维度的解决方案
 * 3. 反思当前算法的局限性
 * 4. 生成学习动机和进化计划
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { InsightMiner, createInsightMiner } from './insight-miner';
import { AlgorithmReflector, createAlgorithmReflector } from './algorithm-reflector';
import { HigherDimensionThinker, createHigherDimensionThinker } from './higher-dimension';
import { DimensionalUnderstandingEngine, createDimensionalUnderstandingEngine } from './dimensional-understanding';
import { LearningMotivationGenerator, createLearningMotivationGenerator } from './motivation-generator';
import { SelfEvolver, createSelfEvolver } from './self-evolver';
import type {
  MetaLearningResult,
  MetaLearningConfig,
  MetaLearningState,
  ExtractedInsight,
  AlgorithmReflection,
  HigherDimensionThought,
  LearningMotivation,
  KnowledgeGap,
  SelfEvolutionPlan,
  CrossDomainConnection,
  DimensionalElevation,
} from './types';
import type { DimensionalInsight } from './dimensional-understanding';

export class MetaLearningEngine {
  private llmClient: LLMClient;
  private config: MetaLearningConfig;
  
  // 子模块
  private insightMiner: InsightMiner;
  private algorithmReflector: AlgorithmReflector;
  private higherDimensionThinker: HigherDimensionThinker;
  private dimensionalEngine: DimensionalUnderstandingEngine;  // 🚀 升维理解引擎
  private motivationGenerator: LearningMotivationGenerator;
  private selfEvolver: SelfEvolver;
  
  // 状态
  private state: MetaLearningState;
  
  // 历史记录
  private recentInsights: ExtractedInsight[] = [];
  private recentReflections: AlgorithmReflection[] = [];
  private recentThoughts: HigherDimensionThought[] = [];
  private recentElevations: DimensionalElevation[] = [];  // 🚀 升维历史
  
  constructor(llmClient: LLMClient, config?: Partial<MetaLearningConfig>) {
    this.llmClient = llmClient;
    
    // 默认配置
    this.config = {
      enableInsightMining: true,
      enableAlgorithmReflection: true,
      enableHigherDimensionThinking: true,
      enableLearningMotivation: true,
      enableSelfEvolution: true,
      insightThreshold: 0.5,
      reflectionDepth: 'medium',
      thinkingScope: 'broad',
      maxMotivations: 10,
      curiosityWeight: 0.3,
      autoEvolve: false,
      evolutionThreshold: 0.7,
      ...config,
    };
    
    // 初始化子模块
    this.insightMiner = createInsightMiner(llmClient);
    this.algorithmReflector = createAlgorithmReflector(llmClient);
    this.higherDimensionThinker = createHigherDimensionThinker(llmClient);
    this.dimensionalEngine = createDimensionalUnderstandingEngine(llmClient);  // 🚀 升维理解引擎
    this.motivationGenerator = createLearningMotivationGenerator(llmClient);
    this.selfEvolver = createSelfEvolver({
      autoEvolve: this.config.autoEvolve,
      requireValidation: true,
    });
    
    // 初始化状态
    this.state = {
      totalInsights: 0,
      totalReflections: 0,
      totalThoughts: 0,
      totalEvolutions: 0,
      recentInsights: [],
      activeMotivations: [],
      pendingEvolutions: [],
      lastLearningTime: Date.now(),
      learningVelocity: 0,
    };
  }
  
  /**
   * 执行元学习
   * 每次对话后调用，主动思考和学习
   */
  async learn(
    userMessage: string,
    assistantResponse: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    context?: {
      recentLearnings?: string[];
      activeGoals?: string[];
      knownConcepts?: string[];
    }
  ): Promise<MetaLearningResult> {
    console.log('[元学习] 开始从对话中学习...');
    
    const startTime = Date.now();
    
    // 分步执行学习任务（某些任务依赖前面的结果）
    
    // 1. 洞察挖掘
    const insightResult = this.config.enableInsightMining
      ? await this.insightMiner.mine(userMessage, assistantResponse, conversationHistory, {
          recentLearnings: context?.recentLearnings,
          activeGoals: context?.activeGoals,
        })
      : this.emptyInsightResult();
    
    // 2. 算法反思
    const reflections = this.config.enableAlgorithmReflection
      ? await this.algorithmReflector.reflect(
          userMessage,
          assistantResponse,
          this.recentInsights.map(i => i.content),
          []
        )
      : [];
    
    // 3. 高维思维
    const higherDimResult = this.config.enableHigherDimensionThinking
      ? await this.higherDimensionThinker.think(
          userMessage,
          assistantResponse,
          {
            activeQuestions: context?.activeGoals,
            recentInsights: this.recentInsights.map(i => i.content),
          }
        )
      : { thoughts: [], crossDomainConnections: [] };
    
    // 🚀 4. 升维理解（核心：理解是升维而非分析）
    // 找到当前维度的边界，跃迁到更高维度
    let dimensionalElevations: DimensionalElevation[] = [];
    if (insightResult.insights.length > 0) {
      const topInsight = insightResult.insights[0];
      const elevation = await this.dimensionalEngine.elevate(
        topInsight.content,
        `在对话中发现的${topInsight.type}：${topInsight.content}`,
        `${userMessage}\n\n${assistantResponse}`
      );
      if (elevation) {
        // 转换 DimensionalInsight → DimensionalElevation
        const elevationResult: DimensionalElevation = {
          id: elevation.id,
          fromDimension: {
            level: elevation.currentDimension.level,
            name: elevation.currentDimension.name,
            description: elevation.currentDimension.description,
          },
          toDimension: {
            level: elevation.higherDimension.level,
            name: elevation.higherDimension.name,
            description: elevation.higherDimension.description,
          },
          understanding: {
            essence: elevation.understanding.essence,
            newVisibility: elevation.higherDimension.newVisibility,
            connections: elevation.understanding.connections,
            groundedExpression: elevation.groundedExpression,
          },
          source: elevation.source,
          timestamp: elevation.timestamp,
        };
        dimensionalElevations = [elevationResult];
        console.log(`[升维理解] ${elevation.currentDimension.name} → ${elevation.higherDimension.name}`);
        console.log(`[升维理解] 本质：${elevation.understanding.essence}`);
      }
    }
    
    // 5. 学习动机生成（依赖 reflections）
    const motivationResult = this.config.enableLearningMotivation
      ? await this.motivationGenerator.generate(
          userMessage,
          assistantResponse,
          this.recentInsights.map(i => i.content),
          reflections.map((r: AlgorithmReflection) => r.potentialImprovements).flat(),
          {
            recentTopics: [],
            knownConcepts: context?.knownConcepts || [],
            recentQuestions: [],
            userInterests: [],
          }
        )
      : { motivations: [], gaps: [] };
    
    // 5. 生成进化计划
    const evolutionPlans: SelfEvolutionPlan[] = [];
    if (this.config.enableSelfEvolution && reflections.length > 0) {
      const plan = this.selfEvolver.generateEvolutionPlan(
        reflections[0],
        higherDimResult.thoughts
      );
      if (plan) {
        evolutionPlans.push(plan);
      }
    }
    
    // 更新状态
    this.updateState(
      insightResult.insights,
      reflections,
      higherDimResult.thoughts,
      dimensionalElevations,
      motivationResult.motivations
    );
    
    // 生成总结
    const summary = this.generateSummary(
      insightResult.insights,
      reflections,
      higherDimResult.thoughts,
      dimensionalElevations,
      motivationResult.motivations
    );
    
    const elapsed = Date.now() - startTime;
    console.log(`[元学习] 完成，耗时 ${elapsed}ms`);
    console.log(`[元学习] 洞察: ${insightResult.insights.length}, 反思: ${reflections.length}, 高维思考: ${higherDimResult.thoughts.length}, 升维: ${dimensionalElevations.length}`);
    
    return {
      insights: insightResult.insights,
      algorithmReflections: reflections,
      higherDimensionThoughts: higherDimResult.thoughts,
      dimensionalElevations,
      crossDomainConnections: higherDimResult.crossDomainConnections,
      learningMotivations: motivationResult.motivations,
      knowledgeGaps: motivationResult.gaps,
      evolutionPlans,
      summary,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 快速学习（不使用 LLM）
   */
  quickLearn(
    userMessage: string,
    assistantResponse: string
  ): MetaLearningResult {
    // 快速版本，不调用 LLM
    const insightResult = this.insightMiner.quickMine(userMessage, assistantResponse);
    const reflections = this.algorithmReflector.quickReflect(userMessage, assistantResponse);
    const higherDimResult = this.higherDimensionThinker.quickThink(userMessage, assistantResponse);
    const motivationResult = this.motivationGenerator.quickGenerate(userMessage, assistantResponse);
    
    // 更新状态
    this.updateState(
      insightResult.insights,
      reflections,
      higherDimResult.thoughts,
      [],  // quickLearn 不进行升维
      motivationResult.motivations
    );
    
    const summary = this.generateSummary(
      insightResult.insights,
      reflections,
      higherDimResult.thoughts,
      [],  // quickLearn 不进行升维
      motivationResult.motivations
    );
    
    return {
      insights: insightResult.insights,
      algorithmReflections: reflections,
      higherDimensionThoughts: higherDimResult.thoughts,
      dimensionalElevations: [],
      crossDomainConnections: higherDimResult.crossDomainConnections,
      learningMotivations: motivationResult.motivations,
      knowledgeGaps: motivationResult.gaps,
      evolutionPlans: [],
      summary,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 更新状态
   */
  private updateState(
    insights: ExtractedInsight[],
    reflections: AlgorithmReflection[],
    thoughts: HigherDimensionThought[],
    elevations: DimensionalElevation[],
    motivations: LearningMotivation[]
  ): void {
    // 更新计数
    this.state.totalInsights += insights.length;
    this.state.totalReflections += reflections.length;
    this.state.totalThoughts += thoughts.length;
    
    // 更新历史
    this.recentInsights.push(...insights);
    this.recentReflections.push(...reflections);
    this.recentThoughts.push(...thoughts);
    this.recentElevations.push(...elevations);
    
    // 保持历史合理大小
    if (this.recentInsights.length > 50) {
      this.recentInsights = this.recentInsights.slice(-30);
    }
    if (this.recentReflections.length > 20) {
      this.recentReflections = this.recentReflections.slice(-15);
    }
    if (this.recentThoughts.length > 20) {
      this.recentThoughts = this.recentThoughts.slice(-10);
    }
    if (this.recentElevations.length > 20) {
      this.recentElevations = this.recentElevations.slice(-10);
    }
    
    // 更新状态中的近期洞察
    this.state.recentInsights = this.recentInsights.slice(-10);
    this.state.activeMotivations = this.motivationGenerator.getActiveMotivations();
    this.state.pendingEvolutions = this.selfEvolver.getPendingEvolutions();
    this.state.lastLearningTime = Date.now();
    
    // 计算学习速度
    const timeSinceLastLearning = Date.now() - this.state.lastLearningTime;
    if (timeSinceLastLearning > 0) {
      const newKnowledge = insights.length + reflections.length + thoughts.length + elevations.length;
      this.state.learningVelocity = newKnowledge / (timeSinceLastLearning / 3600000); // 每小时
    }
  }
  
  /**
   * 生成总结
   */
  private generateSummary(
    insights: ExtractedInsight[],
    reflections: AlgorithmReflection[],
    thoughts: HigherDimensionThought[],
    elevations: DimensionalElevation[],
    motivations: LearningMotivation[]
  ): MetaLearningResult['summary'] {
    // 提取核心洞察
    const keyInsight = insights.length > 0
      ? insights.sort((a, b) => b.confidence - a.confidence)[0].content
      : '本次对话未发现显著洞察';
    
    // 提取主要学习
    const mainLearning = reflections.length > 0
      ? `${reflections[0].targetSystem}: ${reflections[0].potentialImprovements[0] || '需要改进'}`
      : thoughts.length > 0
        ? thoughts[0].higherDimensionView
        : '继续探索';
    
    // 🚀 提取升维理解（核心：理解是升维而非分析）
    const dimensionalShift = elevations.length > 0
      ? `${elevations[0].fromDimension.name} → ${elevations[0].toDimension.name}: ${elevations[0].understanding.essence}`
      : thoughts.length > 0
        ? thoughts[0].higherDimensionView
        : '停留在当前维度';
    
    // 提取建议行动
    const suggestedAction = motivations.length > 0
      ? motivations[0].question
      : '无具体行动建议';
    
    // 提取引发的问题
    const questionsRaised = [
      ...insights.filter(i => i.type === 'contradiction').map(i => i.content),
      ...thoughts.map(t => t.question),
      ...elevations.map(e => e.understanding.newVisibility),
    ].slice(0, 3);
    
    return {
      keyInsight,
      mainLearning,
      dimensionalShift,
      suggestedAction,
      questionsRaised,
    };
  }
  
  /**
   * 获取当前状态
   */
  getState(): MetaLearningState {
    return { ...this.state };
  }
  
  /**
   * 获取活跃的学习动机
   */
  getActiveMotivations(): LearningMotivation[] {
    return this.motivationGenerator.getActiveMotivations();
  }
  
  /**
   * 获取发现的知识盲区
   */
  getKnowledgeGaps(): KnowledgeGap[] {
    return this.motivationGenerator.getDiscoveredGaps();
  }
  
  /**
   * 获取待处理的进化计划
   */
  getPendingEvolutions(): SelfEvolutionPlan[] {
    return this.selfEvolver.getPendingEvolutions();
  }
  
  /**
   * 获取最近的洞察
   */
  getRecentInsights(): ExtractedInsight[] {
    return [...this.recentInsights];
  }
  
  /**
   * 获取进化报告
   */
  getEvolutionReport(): string {
    return this.selfEvolver.generateEvolutionReport();
  }
  
  /**
   * 探索"比人类更好的算法"
   */
  async exploreBetterAlgorithms(
    currentApproach: string,
    humanLimitations: string[]
  ): Promise<HigherDimensionThought[]> {
    return this.higherDimensionThinker.exploreBetterAlgorithms(
      currentApproach,
      humanLimitations
    );
  }
  
  private emptyInsightResult() {
    return {
      insights: [],
      patterns: [],
      principles: [],
      contradictions: [],
      opportunities: [],
    };
  }
}

/**
 * 创建元学习引擎
 */
export function createMetaLearningEngine(
  llmClient: LLMClient,
  config?: Partial<MetaLearningConfig>
): MetaLearningEngine {
  return new MetaLearningEngine(llmClient, config);
}
