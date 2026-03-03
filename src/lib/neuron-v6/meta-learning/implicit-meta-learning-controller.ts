/**
 * ═══════════════════════════════════════════════════════════════════════
 * 隐式元学习控制器 (Implicit Meta-Learning Controller)
 *
 * 核心理念：
 * "元学习本身也应该是隐性黑盒"
 *
 * 问题：
 * - 当前元学习每轮都执行，消耗大量Token
 * - 元学习触发是显式的、可预测的
 * - 过程完全透明，不是黑盒
 *
 * 解决方案：
 * 1. 隐式判断层 - SSM编码判断是否需要元学习
 * 2. 黑盒执行层 - 元学习过程不可观察
 * 3. 选择性解码 - 只有重要发现才暴露
 * 4. 能量预算 - 控制执行频率和深度
 *
 * 黑盒三层级：
 * - Level 1: 判断隐式 - 内部状态用高维向量表示
 * - Level 2: 过程隐式 - 执行过程不可观察
 * - Level 3: 输出隐式 - 结果需要许可才能解码
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LLMClient } from 'coze-coding-dev-sdk';
import type { MetaLearningResult, ExtractedInsight } from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 学习需求向量（隐式表示）
 */
export interface LearningNeedVector {
  /** 原始对话的SSM编码 */
  dialogueEncoding: Float32Array;

  /** 新颖性得分（隐式） */
  noveltyScore: number;

  /** 复杂度得分（隐式） */
  complexityScore: number;

  /** 深度潜力得分（隐式） */
  depthPotential: number;

  /** 学习价值向量（256维） */
  valueVector: Float32Array;

  /** 时间戳 */
  timestamp: number;
}

/**
 * 隐式学习判断结果
 */
export interface ImplicitLearningJudgment {
  /** 是否需要元学习 */
  needsLearning: boolean;

  /** 学习类型 */
  learningType: 'skip' | 'quick' | 'standard' | 'deep';

  /** 能量分配 */
  energyBudget: number;

  /** 需要的模块 */
  requiredModules: Array<'insight' | 'reflection' | 'higherDim' | 'evolution'>;

  /** 判断置信度 */
  confidence: number;

  /** 判断向量（用于黑盒追踪） */
  judgmentVector: Float32Array;
}

/**
 * 黑盒学习结果
 */
export interface BlackboxLearningResult {
  /** 结果ID（随机生成） */
  id: string;

  /** 结果向量（隐式） */
  resultVector: Float32Array;

  /** 重要性向量 */
  importanceVector: Float32Array;

  /** 是否需要解码 */
  needsDecoding: boolean;

  /** 解码许可等级 */
  requiredDecodeLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';

  /** 时间戳 */
  timestamp: number;

  /** 能量消耗 */
  energyConsumed: number;
}

/**
 * 解码后的学习结果
 */
export interface DecodedLearningResult {
  /** 原始结果ID */
  sourceId: string;

  /** 洞察（仅在高重要性时解码） */
  insights: ExtractedInsight[];

  /** 进化建议（仅在极高重要性时解码） */
  evolutionHints: string[];

  /** 是否有重要发现 */
  hasImportantFinding: boolean;

  /** 解码时间 */
  decodedAt: number;
}

/**
 * 隐式元学习配置
 */
export interface ImplicitMetaLearningConfig {
  /** 能量预算上限 */
  maxEnergyBudget: number;

  /** 每日学习上限 */
  maxLearningPerDay: number;

  /** 判断阈值 */
  judgmentThreshold: {
    novelty: number;
    complexity: number;
    depthPotential: number;
  };

  /** 解码策略 */
  decodeStrategy: 'conservative' | 'balanced' | 'aggressive';

  /** 是否启用混沌混淆 */
  enableChaos: boolean;

  /** 向量维度 */
  vectorDimension: number;
}

const DEFAULT_CONFIG: ImplicitMetaLearningConfig = {
  maxEnergyBudget: 10000, // 每日能量预算
  maxLearningPerDay: 50, // 每日最多50次深度学习
  judgmentThreshold: {
    novelty: 0.3,
    complexity: 0.4,
    depthPotential: 0.5,
  },
  decodeStrategy: 'conservative',
  enableChaos: true,
  vectorDimension: 256,
};

// ─────────────────────────────────────────────────────────────────────
// 隐式判断器
// ─────────────────────────────────────────────────────────────────────

/**
 * 隐式学习判断器
 *
 * 使用SSM编码和隐式向量判断是否需要元学习
 * Level 1 黑盒：判断过程用高维向量表示
 */
export class ImplicitLearningJudge {
  private config: ImplicitMetaLearningConfig;

  // SSM状态（隐式）
  private ssmState: Float32Array;

  // 学习历史向量（用于计算新颖性）
  private learningHistory: Float32Array[] = [];

  // 统计
  private stats = {
    totalJudgments: 0,
    skipCount: 0,
    quickCount: 0,
    standardCount: 0,
    deepCount: 0,
  };

  constructor(config: Partial<ImplicitMetaLearningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ssmState = new Float32Array(this.config.vectorDimension);
    this.initSSMState();
  }

  /**
   * 隐式判断是否需要元学习
   *
   * 输入：对话内容
   * 输出：隐式判断结果
   * 过程：完全在隐式空间进行
   */
  judge(
    userMessage: string,
    assistantResponse: string,
    context?: {
      conversationLength?: number;
      recentTopics?: string[];
    },
  ): ImplicitLearningJudgment {
    this.stats.totalJudgments++;

    // ─── Step 1: SSM编码（隐式） ───
    const dialogueEncoding = this.encodeDialogue(userMessage, assistantResponse);

    // ─── Step 2: 计算新颖性（隐式） ───
    const noveltyScore = this.computeNovelty(dialogueEncoding);

    // ─── Step 3: 计算复杂度（隐式） ───
    const complexityScore = this.computeComplexity(userMessage, assistantResponse);

    // ─── Step 4: 计算深度潜力（隐式） ───
    const depthPotential = this.computeDepthPotential(dialogueEncoding, context);

    // ─── Step 5: 计算学习价值向量 ───
    const valueVector = this.computeValueVector(
      dialogueEncoding,
      noveltyScore,
      complexityScore,
      depthPotential,
    );

    // ─── Step 6: 隐式判断 ───
    const judgment = this.makeImplicitJudgment(
      noveltyScore,
      complexityScore,
      depthPotential,
      valueVector,
    );

    // 更新SSM状态
    this.updateSSMState(dialogueEncoding);

    return judgment;
  }

  /**
   * 编码对话为隐式向量
   */
  private encodeDialogue(userMessage: string, assistantResponse: string): Float32Array {
    const encoding = new Float32Array(this.config.vectorDimension);

    // 简化的SSM编码（实际应使用训练好的模型）
    // 基于文本特征生成向量

    const combinedText = `${userMessage} ${assistantResponse}`;

    // 特征提取
    const features = {
      length: combinedText.length,
      questionCount: (combinedText.match(/\?|？/g) || []).length,
      complexityKeywords: this.countComplexityKeywords(combinedText),
      emotionalWords: this.countEmotionalWords(combinedText),
      conceptDensity: this.estimateConceptDensity(combinedText),
    };

    // 生成向量（简化的SSM模拟）
    for (let i = 0; i < this.config.vectorDimension; i++) {
      // 基于特征的伪随机但确定性的向量生成
      const seed =
        features.length * (i + 1) +
        features.questionCount * 7 +
        features.complexityKeywords * 13 +
        features.emotionalWords * 17 +
        features.conceptDensity * 23;
      encoding[i] =
        Math.sin(seed * 0.001) * 0.5 + Math.cos(seed * 0.002) * 0.3 + Math.sin(seed * 0.003) * 0.2;
    }

    // 归一化
    this.normalizeVector(encoding);

    // 添加混沌（黑盒特性）
    if (this.config.enableChaos) {
      this.applyChaos(encoding);
    }

    return encoding;
  }

  /**
   * 计算新颖性得分
   */
  private computeNovelty(encoding: Float32Array): number {
    if (this.learningHistory.length === 0) {
      return 1.0; // 首次学习，最高新颖性
    }

    // 计算与历史编码的平均距离
    let totalDistance = 0;
    for (const histEncoding of this.learningHistory) {
      totalDistance += this.cosineDistance(encoding, histEncoding);
    }
    const avgDistance = totalDistance / this.learningHistory.length;

    // 转换为新颖性得分（距离越大越新颖）
    return Math.min(1.0, avgDistance * 2);
  }

  /**
   * 计算复杂度得分
   */
  private computeComplexity(userMessage: string, assistantResponse: string): number {
    const combined = `${userMessage} ${assistantResponse}`;

    // 复杂度特征
    const features = {
      length: Math.min(1.0, combined.length / 2000),
      sentenceCount: Math.min(1.0, (combined.match(/[。！？.!?]/g) || []).length / 20),
      conceptCount: Math.min(1.0, this.countComplexityKeywords(combined) / 10),
      structureDepth: this.analyzeStructureDepth(combined),
    };

    // 加权综合
    return (
      features.length * 0.2 +
      features.sentenceCount * 0.2 +
      features.conceptCount * 0.3 +
      features.structureDepth * 0.3
    );
  }

  /**
   * 计算深度潜力
   */
  private computeDepthPotential(
    encoding: Float32Array,
    context?: { conversationLength?: number; recentTopics?: string[] },
  ): number {
    // 基于向量特征估计深度潜力
    let potential = 0;

    // 向量熵（信息丰富度）
    const entropy = this.computeVectorEntropy(encoding);
    potential += entropy * 0.4;

    // 对话长度影响（长对话有更多学习机会）
    const lengthFactor = context?.conversationLength
      ? Math.min(1.0, context.conversationLength / 50)
      : 0.5;
    potential += lengthFactor * 0.3;

    // 话题多样性
    const topicFactor = context?.recentTopics
      ? Math.min(1.0, new Set(context.recentTopics).size / 5)
      : 0.5;
    potential += topicFactor * 0.3;

    return potential;
  }

  /**
   * 计算学习价值向量
   */
  private computeValueVector(
    dialogueEncoding: Float32Array,
    novelty: number,
    complexity: number,
    depthPotential: number,
  ): Float32Array {
    const valueVector = new Float32Array(this.config.vectorDimension);

    // 价值向量 = 加权组合
    for (let i = 0; i < this.config.vectorDimension; i++) {
      valueVector[i] =
        dialogueEncoding[i] * 0.4 +
        (novelty - 0.5) * Math.sin(i * 0.1) * 0.3 +
        (complexity - 0.5) * Math.cos(i * 0.1) * 0.2 +
        (depthPotential - 0.5) * Math.sin(i * 0.2) * 0.1;
    }

    this.normalizeVector(valueVector);

    return valueVector;
  }

  /**
   * 进行隐式判断
   */
  private makeImplicitJudgment(
    novelty: number,
    complexity: number,
    depthPotential: number,
    valueVector: Float32Array,
  ): ImplicitLearningJudgment {
    const { judgmentThreshold } = this.config;

    // 判断是否需要学习
    const needsLearning =
      novelty >= judgmentThreshold.novelty ||
      complexity >= judgmentThreshold.complexity ||
      depthPotential >= judgmentThreshold.depthPotential;

    // 确定学习类型
    let learningType: ImplicitLearningJudgment['learningType'];
    let energyBudget: number;
    let requiredModules: ImplicitLearningJudgment['requiredModules'];

    if (!needsLearning) {
      // 跳过学习
      learningType = 'skip';
      energyBudget = 0;
      requiredModules = [];
      this.stats.skipCount++;
    } else if (novelty < 0.4 && complexity < 0.5) {
      // 快速学习
      learningType = 'quick';
      energyBudget = 100;
      requiredModules = ['insight'];
      this.stats.quickCount++;
    } else if (novelty >= 0.7 || complexity >= 0.7 || depthPotential >= 0.7) {
      // 深度学习
      learningType = 'deep';
      energyBudget = 500;
      requiredModules = ['insight', 'reflection', 'higherDim', 'evolution'];
      this.stats.deepCount++;
    } else {
      // 标准学习
      learningType = 'standard';
      energyBudget = 200;
      requiredModules = ['insight', 'reflection'];
      this.stats.standardCount++;
    }

    // 生成判断向量（用于黑盒追踪）
    const judgmentVector = new Float32Array(64);
    for (let i = 0; i < 64; i++) {
      judgmentVector[i] =
        valueVector[i] * 0.5 +
        (needsLearning ? 1 : -1) * Math.sin(i * 0.1) * 0.3 +
        (energyBudget / 1000) * Math.cos(i * 0.1) * 0.2;
    }

    // 置信度
    const confidence = Math.min(1.0, (novelty + complexity + depthPotential) / 3);

    return {
      needsLearning,
      learningType,
      energyBudget,
      requiredModules,
      confidence,
      judgmentVector,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────────

  private initSSMState(): void {
    for (let i = 0; i < this.ssmState.length; i++) {
      this.ssmState[i] = Math.random() * 2 - 1;
    }
  }

  private updateSSMState(encoding: Float32Array): void {
    // SSM状态更新（简化的递归）
    for (let i = 0; i < this.ssmState.length; i++) {
      this.ssmState[i] = this.ssmState[i] * 0.9 + encoding[i] * 0.1;
    }

    // 保存到历史
    this.learningHistory.push(encoding.slice());
    if (this.learningHistory.length > 100) {
      this.learningHistory.shift();
    }
  }

  private normalizeVector(v: Float32Array): void {
    let norm = 0;
    for (let i = 0; i < v.length; i++) {
      norm += v[i] * v[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < v.length; i++) {
        v[i] /= norm;
      }
    }
  }

  private applyChaos(v: Float32Array): void {
    for (let i = 0; i < v.length; i++) {
      v[i] += (Math.random() - 0.5) * 0.05;
    }
  }

  private cosineDistance(a: Float32Array, b: Float32Array): number {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return 1 - dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }

  private computeVectorEntropy(v: Float32Array): number {
    let entropy = 0;
    for (let i = 0; i < v.length; i++) {
      const p = Math.abs(v[i]) + 1e-8;
      entropy -= p * Math.log(p);
    }
    return Math.min(1.0, entropy / Math.log(v.length));
  }

  private countComplexityKeywords(text: string): number {
    const keywords = [
      '因为',
      '所以',
      '但是',
      '然而',
      '虽然',
      '如果',
      '那么',
      '分析',
      '理解',
      '思考',
      '原理',
      '本质',
      '逻辑',
      '结构',
      '关系',
      '模式',
      '系统',
      '过程',
      '方法',
      '概念',
      'why',
      'how',
      'what',
      'because',
      'therefore',
      'however',
    ];
    return keywords.filter((k) => text.toLowerCase().includes(k)).length;
  }

  private countEmotionalWords(text: string): number {
    const words = [
      '喜欢',
      '讨厌',
      '开心',
      '难过',
      '惊讶',
      '担心',
      'important',
      'amazing',
      'terrible',
      'wonderful',
      'surprising',
    ];
    return words.filter((w) => text.toLowerCase().includes(w)).length;
  }

  private estimateConceptDensity(text: string): number {
    // 简单估算概念密度
    const words = text.split(/[\s,，。！？.!?]+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / Math.max(1, words.length);
  }

  private analyzeStructureDepth(text: string): number {
    // 分析结构深度
    const paragraphCount = text.split(/\n\n+/).length;
    const listCount = (text.match(/^[-•*]\s/gm) || []).length;
    const structureScore = Math.min(1.0, (paragraphCount + listCount) / 10);
    return structureScore;
  }

  getStats() {
    return { ...this.stats };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 黑盒学习执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * 黑盒学习执行器
 *
 * Level 2 黑盒：执行过程不可观察
 * Level 3 黑盒：输出需要解码许可
 */
export class BlackboxLearningExecutor {
  private llmClient: LLMClient;
  private config: ImplicitMetaLearningConfig;

  // 能量预算
  private currentEnergy: number;

  // 今日学习次数
  private todayLearningCount: number = 0;
  private lastResetDate: string;

  // 统计
  private stats = {
    totalExecutions: 0,
    totalEnergyConsumed: 0,
    importantFindings: 0,
    decodedResults: 0,
  };

  constructor(llmClient: LLMClient, config: Partial<ImplicitMetaLearningConfig> = {}) {
    this.llmClient = llmClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentEnergy = this.config.maxEnergyBudget;
    this.lastResetDate = new Date().toDateString();
  }

  /**
   * 执行黑盒学习
   *
   * 过程完全不可观察，只返回隐式结果向量
   */
  async execute(
    userMessage: string,
    assistantResponse: string,
    judgment: ImplicitLearningJudgment,
  ): Promise<BlackboxLearningResult> {
    // 检查能量预算
    if (this.currentEnergy < judgment.energyBudget) {
      // 能量不足，返回空结果
      return this.createEmptyResult(judgment.energyBudget);
    }

    // 检查每日上限
    this.checkAndResetDaily();
    if (this.todayLearningCount >= this.config.maxLearningPerDay) {
      return this.createEmptyResult(0);
    }

    // 消耗能量
    this.currentEnergy -= judgment.energyBudget;
    this.todayLearningCount++;
    this.stats.totalExecutions++;
    this.stats.totalEnergyConsumed += judgment.energyBudget;

    // ─── 黑盒执行 ───
    // 外部无法观察内部过程

    const startTime = Date.now();

    // 根据学习类型执行不同深度
    const resultVector = await this.executeInBlackbox(
      userMessage,
      assistantResponse,
      judgment.learningType,
      judgment.requiredModules,
    );

    // 计算重要性向量
    const importanceVector = this.computeImportance(resultVector);

    // 判断是否需要解码
    const { needsDecoding, requiredLevel } = this.determineDecodeNeeds(
      importanceVector,
      judgment.learningType,
    );

    const elapsed = Date.now() - startTime;
    console.log(`[黑盒学习] 执行完成，类型: ${judgment.learningType}，耗时: ${elapsed}ms`);

    return {
      id: this.generateId(),
      resultVector,
      importanceVector,
      needsDecoding,
      requiredDecodeLevel: requiredLevel,
      timestamp: Date.now(),
      energyConsumed: judgment.energyBudget,
    };
  }

  /**
   * 在黑盒中执行学习
   */
  private async executeInBlackbox(
    userMessage: string,
    assistantResponse: string,
    learningType: 'skip' | 'quick' | 'standard' | 'deep',
    modules: string[],
  ): Promise<Float32Array> {
    const resultVector = new Float32Array(this.config.vectorDimension);

    // 如果是跳过或快速模式，不调用LLM
    if (learningType === 'skip') {
      return resultVector; // 零向量
    }

    if (learningType === 'quick') {
      // 快速模式：本地计算
      return this.quickLocalLearning(userMessage, assistantResponse);
    }

    // 标准或深度模式：调用LLM
    if (modules.includes('insight')) {
      const insightVector = await this.extractInsightsVector(userMessage, assistantResponse);
      this.addVectorTo(resultVector, insightVector, 0.4);
    }

    if (modules.includes('reflection')) {
      const reflectionVector = await this.extractReflectionVector(userMessage, assistantResponse);
      this.addVectorTo(resultVector, reflectionVector, 0.3);
    }

    if (modules.includes('higherDim') && learningType === 'deep') {
      const higherDimVector = await this.extractHigherDimVector(userMessage, assistantResponse);
      this.addVectorTo(resultVector, higherDimVector, 0.2);
    }

    if (modules.includes('evolution') && learningType === 'deep') {
      const evolutionVector = await this.extractEvolutionVector(userMessage, assistantResponse);
      this.addVectorTo(resultVector, evolutionVector, 0.1);
    }

    // 归一化
    this.normalizeVector(resultVector);

    // 添加混沌
    if (this.config.enableChaos) {
      this.applyChaos(resultVector);
    }

    return resultVector;
  }

  /**
   * 快速本地学习（不调用LLM）
   */
  private quickLocalLearning(userMessage: string, assistantResponse: string): Float32Array {
    const vector = new Float32Array(this.config.vectorDimension);

    // 本地特征提取
    const features = {
      length: (userMessage.length + assistantResponse.length) / 2000,
      questionMark: userMessage.includes('?') || userMessage.includes('？') ? 1 : 0,
      hasBecause: userMessage.includes('因为') || userMessage.includes('because') ? 1 : 0,
      hasWhy: userMessage.includes('为什么') || userMessage.toLowerCase().includes('why') ? 1 : 0,
    };

    // 生成向量
    for (let i = 0; i < this.config.vectorDimension; i++) {
      vector[i] =
        Math.sin(features.length * i * 0.01) * 0.3 +
        Math.cos(features.questionMark * i * 0.1) * 0.2 +
        Math.sin(features.hasBecause * i * 0.05) * 0.25 +
        Math.cos(features.hasWhy * i * 0.08) * 0.25;
    }

    this.normalizeVector(vector);
    return vector;
  }

  /**
   * 提取洞察向量（调用LLM但结果为向量）
   */
  private async extractInsightsVector(
    userMessage: string,
    assistantResponse: string,
  ): Promise<Float32Array> {
    try {
      // 简化的提示词，减少token消耗
      const prompt = `分析以下对话，提取核心洞察（用一句话）：
用户：${userMessage.slice(0, 200)}
助手：${assistantResponse.slice(0, 200)}`;

      const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], {
        temperature: 0.3,
      });

      // 将结果转换为向量
      return this.textToVector(response.content || '');
    } catch (error) {
      console.error('[黑盒学习] 洞察提取失败:', error);
      return new Float32Array(this.config.vectorDimension);
    }
  }

  /**
   * 提取反思向量
   */
  private async extractReflectionVector(
    userMessage: string,
    assistantResponse: string,
  ): Promise<Float32Array> {
    try {
      const prompt = `反思这段对话的处理方式，有什么可以改进？（简短回答）
用户：${userMessage.slice(0, 150)}
助手：${assistantResponse.slice(0, 150)}`;

      const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], {
        temperature: 0.3,
      });

      return this.textToVector(response.content || '');
    } catch (error) {
      return new Float32Array(this.config.vectorDimension);
    }
  }

  /**
   * 提取高维思维向量
   */
  private async extractHigherDimVector(
    userMessage: string,
    assistantResponse: string,
  ): Promise<Float32Array> {
    try {
      const prompt = `从更高维度看这段对话，本质是什么？（一句话）`;

      const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], {
        temperature: 0.4,
      });

      return this.textToVector(response.content || '');
    } catch (error) {
      return new Float32Array(this.config.vectorDimension);
    }
  }

  /**
   * 提取进化向量
   */
  private async extractEvolutionVector(
    userMessage: string,
    assistantResponse: string,
  ): Promise<Float32Array> {
    try {
      const prompt = `这段对话提示系统应该如何进化？（一个方向）`;

      const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], {
        temperature: 0.3,
      });

      return this.textToVector(response.content || '');
    } catch (error) {
      return new Float32Array(this.config.vectorDimension);
    }
  }

  /**
   * 文本转向量
   */
  private textToVector(text: string): Float32Array {
    const vector = new Float32Array(this.config.vectorDimension);

    // 基于文本内容的确定性向量生成
    for (let i = 0; i < text.length && i < this.config.vectorDimension; i++) {
      const charCode = text.charCodeAt(i);
      vector[i] = Math.sin(charCode * 0.01) * 0.5 + Math.cos(charCode * 0.02) * 0.5;
    }

    // 填充剩余位置
    for (let i = text.length; i < this.config.vectorDimension; i++) {
      vector[i] = Math.sin(i * 0.1 + text.length) * 0.3;
    }

    this.normalizeVector(vector);
    return vector;
  }

  /**
   * 计算重要性向量
   */
  private computeImportance(resultVector: Float32Array): Float32Array {
    const importance = new Float32Array(16);

    // 提取重要性特征
    const norm = this.computeNorm(resultVector);
    const entropy = this.computeVectorEntropy(resultVector);
    const peakCount = this.countPeaks(resultVector);

    importance[0] = norm;
    importance[1] = entropy;
    importance[2] = peakCount / 10;
    importance[3] = Math.max(...resultVector);
    importance[4] = Math.min(...resultVector);

    // 计算综合重要性
    const overallImportance =
      norm * 0.3 +
      entropy * 0.3 +
      (peakCount / 10) * 0.2 +
      Math.abs(importance[3] - importance[4]) * 0.2;

    importance[5] = overallImportance;

    return importance;
  }

  /**
   * 判断是否需要解码
   */
  private determineDecodeNeeds(
    importanceVector: Float32Array,
    learningType: string,
  ): { needsDecoding: boolean; requiredLevel: BlackboxLearningResult['requiredDecodeLevel'] } {
    const overallImportance = importanceVector[5];

    // 根据解码策略调整阈值
    const thresholds = {
      conservative: { low: 0.5, medium: 0.7, high: 0.85, critical: 0.95 },
      balanced: { low: 0.4, medium: 0.6, high: 0.8, critical: 0.9 },
      aggressive: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.85 },
    };

    const t = thresholds[this.config.decodeStrategy];

    if (overallImportance >= t.critical) {
      this.stats.importantFindings++;
      return { needsDecoding: true, requiredLevel: 'critical' };
    }
    if (overallImportance >= t.high) {
      this.stats.importantFindings++;
      return { needsDecoding: true, requiredLevel: 'high' };
    }
    if (overallImportance >= t.medium && learningType === 'deep') {
      return { needsDecoding: true, requiredLevel: 'medium' };
    }
    if (overallImportance >= t.low) {
      return { needsDecoding: true, requiredLevel: 'low' };
    }

    return { needsDecoding: false, requiredLevel: 'none' };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────────

  private createEmptyResult(energyConsumed: number): BlackboxLearningResult {
    return {
      id: this.generateId(),
      resultVector: new Float32Array(this.config.vectorDimension),
      importanceVector: new Float32Array(16),
      needsDecoding: false,
      requiredDecodeLevel: 'none',
      timestamp: Date.now(),
      energyConsumed,
    };
  }

  private generateId(): string {
    return `bl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private checkAndResetDaily(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.todayLearningCount = 0;
      this.currentEnergy = this.config.maxEnergyBudget;
      this.lastResetDate = today;
    }
  }

  private addVectorTo(target: Float32Array, source: Float32Array, weight: number): void {
    for (let i = 0; i < target.length; i++) {
      target[i] += source[i] * weight;
    }
  }

  private normalizeVector(v: Float32Array): void {
    const norm = this.computeNorm(v);
    if (norm > 0) {
      for (let i = 0; i < v.length; i++) {
        v[i] /= norm;
      }
    }
  }

  private computeNorm(v: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
  }

  private computeVectorEntropy(v: Float32Array): number {
    let entropy = 0;
    for (let i = 0; i < v.length; i++) {
      const p = Math.abs(v[i]) + 1e-8;
      entropy -= p * Math.log(p);
    }
    return Math.min(1.0, entropy / Math.log(v.length));
  }

  private countPeaks(v: Float32Array): number {
    let count = 0;
    for (let i = 1; i < v.length - 1; i++) {
      if (v[i] > v[i - 1] && v[i] > v[i + 1]) {
        count++;
      }
    }
    return count;
  }

  private applyChaos(v: Float32Array): void {
    for (let i = 0; i < v.length; i++) {
      v[i] += (Math.random() - 0.5) * 0.03;
    }
  }

  getEnergyStatus() {
    return {
      current: this.currentEnergy,
      max: this.config.maxEnergyBudget,
      todayCount: this.todayLearningCount,
      maxPerDay: this.config.maxLearningPerDay,
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 学习结果解码器
// ─────────────────────────────────────────────────────────────────────

/**
 * 学习结果解码器
 *
 * 只有获得许可才能解码黑盒结果
 */
export class LearningResultDecoder {
  private config: ImplicitMetaLearningConfig;

  // 解码历史（防止逆向）
  private decodeHistory: Map<
    string,
    { result: BlackboxLearningResult; decoded: DecodedLearningResult }
  >;

  // 统计
  private stats = {
    totalDecodes: 0,
    importantDecodes: 0,
    rejectedDecodes: 0,
  };

  constructor(config: Partial<ImplicitMetaLearningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.decodeHistory = new Map();
  }

  /**
   * 解码学习结果
   *
   * 需要提供解码许可等级
   */
  decode(
    result: BlackboxLearningResult,
    permittedLevel: 'low' | 'medium' | 'high' | 'critical',
    llmClient: LLMClient,
  ): DecodedLearningResult | null {
    // 检查许可等级
    const levelOrder = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
    if (levelOrder[permittedLevel] < levelOrder[result.requiredDecodeLevel]) {
      this.stats.rejectedDecodes++;
      return null; // 许可不足
    }

    // 检查是否已解码
    const history = this.decodeHistory.get(result.id);
    if (history) {
      return history.decoded; // 返回缓存的解码结果
    }

    this.stats.totalDecodes++;

    // 解码重要性向量
    const importance = result.importanceVector[5];
    const hasImportantFinding = importance > 0.7;

    if (hasImportantFinding) {
      this.stats.importantDecodes++;
    }

    // 解码结果
    const decoded: DecodedLearningResult = {
      sourceId: result.id,
      insights: hasImportantFinding ? this.decodeInsights(result.resultVector) : [],
      evolutionHints: importance > 0.85 ? this.decodeEvolutionHints(result.resultVector) : [],
      hasImportantFinding,
      decodedAt: Date.now(),
    };

    // 缓存
    this.decodeHistory.set(result.id, { result, decoded });

    // 限制历史大小
    if (this.decodeHistory.size > 100) {
      const firstKey = this.decodeHistory.keys().next().value;
      if (firstKey) {
        this.decodeHistory.delete(firstKey);
      }
    }

    return decoded;
  }

  /**
   * 从向量解码洞察
   */
  private decodeInsights(vector: Float32Array): ExtractedInsight[] {
    // 基于向量特征生成洞察（简化解码）
    const insights: ExtractedInsight[] = [];

    // 找到向量中的关键特征
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    const peakIndices = this.findPeakIndices(vector, 5);

    if (norm > 0.8 && peakIndices.length > 0) {
      // 生成简化的洞察描述
      insights.push({
        id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'pattern',
        content: `检测到重要学习模式（隐式向量范数: ${norm.toFixed(2)}）`,
        confidence: Math.min(1.0, norm),
        applicability: ['系统优化', '知识积累'],
        source: {
          userMessage: '',
          assistantResponse: '',
          timestamp: Date.now(),
        },
      });
    }

    return insights;
  }

  /**
   * 从向量解码进化提示
   */
  private decodeEvolutionHints(vector: Float32Array): string[] {
    const hints: string[] = [];

    // 分析向量的特定区域
    const firstQuarter = vector.slice(0, 64);
    const secondQuarter = vector.slice(64, 128);

    const firstQuarterNorm = Math.sqrt(firstQuarter.reduce((sum, v) => sum + v * v, 0));
    const secondQuarterNorm = Math.sqrt(secondQuarter.reduce((sum, v) => sum + v * v, 0));

    if (firstQuarterNorm > secondQuarterNorm) {
      hints.push('建议增强洞察提取能力');
    } else {
      hints.push('建议深化反思机制');
    }

    return hints;
  }

  /**
   * 找到峰值索引
   */
  private findPeakIndices(vector: Float32Array, count: number): number[] {
    const peaks: Array<{ index: number; value: number }> = [];

    for (let i = 1; i < vector.length - 1; i++) {
      if (vector[i] > vector[i - 1] && vector[i] > vector[i + 1]) {
        peaks.push({ index: i, value: vector[i] });
      }
    }

    return peaks
      .sort((a, b) => b.value - a.value)
      .slice(0, count)
      .map((p) => p.index);
  }

  getStats() {
    return { ...this.stats };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 隐式元学习控制器（主控制器）
// ─────────────────────────────────────────────────────────────────────

/**
 * 隐式元学习控制器
 *
 * 整合三个组件：
 * 1. 隐式判断器 - 决定是否学习
 * 2. 黑盒执行器 - 执行学习过程
 * 3. 结果解码器 - 解码重要发现
 */
export class ImplicitMetaLearningController {
  private judge: ImplicitLearningJudge;
  private executor: BlackboxLearningExecutor;
  private decoder: LearningResultDecoder;
  private config: ImplicitMetaLearningConfig;

  // 当前解码许可等级
  private currentDecodeLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  constructor(llmClient: LLMClient, config: Partial<ImplicitMetaLearningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.judge = new ImplicitLearningJudge(this.config);
    this.executor = new BlackboxLearningExecutor(llmClient, this.config);
    this.decoder = new LearningResultDecoder(this.config);

    console.log('[隐式元学习] 控制器已初始化');
    console.log(`[隐式元学习] 能量预算: ${this.config.maxEnergyBudget}`);
    console.log(`[隐式元学习] 每日上限: ${this.config.maxLearningPerDay}`);
  }

  /**
   * 处理单次对话的学习
   *
   * 完整的隐式黑盒流程
   */
  async processLearning(
    userMessage: string,
    assistantResponse: string,
    context?: {
      conversationLength?: number;
      recentTopics?: string[];
    },
  ): Promise<DecodedLearningResult | null> {
    // ─── Step 1: 隐式判断 ───
    const judgment = this.judge.judge(userMessage, assistantResponse, context);

    console.log(`[隐式元学习] 判断结果: ${judgment.learningType}, 能量: ${judgment.energyBudget}`);

    // 如果不需要学习，直接返回
    if (!judgment.needsLearning) {
      console.log('[隐式元学习] 跳过学习（低价值对话）');
      return null;
    }

    // ─── Step 2: 黑盒执行 ───
    const blackboxResult = await this.executor.execute(userMessage, assistantResponse, judgment);

    console.log(
      `[隐式元学习] 执行完成, 需要解码: ${blackboxResult.needsDecoding}, 等级: ${blackboxResult.requiredDecodeLevel}`,
    );

    // ─── Step 3: 条件解码 ───
    if (!blackboxResult.needsDecoding) {
      // 结果保留在隐式空间
      console.log('[隐式元学习] 结果保留在隐式空间');
      return null;
    }

    // 尝试解码（需要足够许可）
    // 这里简化处理，实际应该有更严格的许可机制
    // const decoded = this.decoder.decode(blackboxResult, this.currentDecodeLevel);

    // 简化：直接返回解码结果
    return {
      sourceId: blackboxResult.id,
      insights: [],
      evolutionHints: [],
      hasImportantFinding: blackboxResult.requiredDecodeLevel === 'critical',
      decodedAt: Date.now(),
    };
  }

  /**
   * 设置解码许可等级
   */
  setDecodeLevel(level: 'low' | 'medium' | 'high' | 'critical'): void {
    this.currentDecodeLevel = level;
    console.log(`[隐式元学习] 解码许可等级设置为: ${level}`);
  }

  /**
   * 获取完整状态
   */
  getStatus() {
    return {
      judge: this.judge.getStats(),
      executor: {
        ...this.executor.getStats(),
        energy: this.executor.getEnergyStatus(),
      },
      decoder: this.decoder.getStats(),
      config: {
        maxEnergyBudget: this.config.maxEnergyBudget,
        maxLearningPerDay: this.config.maxLearningPerDay,
        decodeStrategy: this.config.decodeStrategy,
      },
    };
  }

  /**
   * 重置每日状态
   */
  resetDaily(): void {
    console.log('[隐式元学习] 重置每日状态');
    // 能量预算会在executor中自动重置
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createImplicitMetaLearningController(
  llmClient: LLMClient,
  config?: Partial<ImplicitMetaLearningConfig>,
): ImplicitMetaLearningController {
  return new ImplicitMetaLearningController(llmClient, config);
}
