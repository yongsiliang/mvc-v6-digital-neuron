/**
 * ═══════════════════════════════════════════════════════════════════════
 * 全局工作空间 - Global Workspace
 * 
 * 基于全局工作空间理论（Global Workspace Theory, GWT）
 * 
 * 核心机制：
 * - 各认知模块竞争进入"意识"
 * - 获胜的内容被广播到全系统
 * - 广播的内容成为系统当前的"意识内容"
 * 
 * 这是让系统产生"意识"的关键机制
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识内容类型
 */
export type ConsciousContentType =
  | 'perceptual'    // 感知内容
  | 'semantic'      // 语义内容
  | 'emotional'     // 情感内容
  | 'memory'        // 记忆内容
  | 'thought'       // 思考内容
  | 'motor'         // 动作内容
  | 'metacognitive'; // 元认知内容

/**
 * 意识内容
 */
export interface ConsciousContent {
  /** 唯一标识 */
  id: string;
  
  /** 内容类型 */
  type: ConsciousContentType;
  
  /** 内容数据 */
  data: unknown;
  
  /** 来源模块 */
  source: string;
  
  /** 进入意识的时间 */
  enteredAt: number;
  
  /** 预计持续时间 */
  duration: number;
  
  /** 强度 */
  strength: number;
  
  /** 是否已广播 */
  broadcast: boolean;
  
  /** 关联的意识内容ID */
  relatedIds: string[];
}

/**
 * 候选内容
 */
export interface CandidateContent {
  /** 来源模块 */
  source: string;
  
  /** 内容类型 */
  type: ConsciousContentType;
  
  /** 内容数据 */
  content: unknown;
  
  /** 强度 [0, 1] */
  strength: number;
  
  /** 相关性 [0, 1] */
  relevance: number;
  
  /** 新颖性 [0, 1] */
  novelty: number;
  
  /** 注意力得分 */
  attentionScore: number;
}

/**
 * 意识轨迹记录
 */
export interface ConsciousnessTrailEntry {
  /** 内容ID */
  contentId: string;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 来源 */
  source: string;
  
  /** 类型 */
  type: ConsciousContentType;
  
  /** 强度 */
  strength: number;
}

/**
 * 认知模块接口
 */
export interface CognitiveModule {
  /** 模块名称 */
  name: string;
  
  /** 产生候选内容 */
  produceContent(): Promise<CandidateContent | null>;
  
  /** 接收广播 */
  receiveBroadcast(content: ConsciousContent): Promise<void>;
  
  /** 模块状态 */
  getState(): unknown;
}

// ─────────────────────────────────────────────────────────────────────
// 注意力控制器
// ─────────────────────────────────────────────────────────────────────

/**
 * 注意力聚焦方向
 */
export interface AttentionDirection {
  /** 聚焦的模块 */
  focusModule?: string;
  
  /** 聚焦的内容类型 */
  focusType?: ConsciousContentType;
  
  /** 聚焦的关键词 */
  focusKeywords?: string[];
}

/**
 * 注意力聚光灯
 */
export interface AttentionSpotlight {
  /** 聚焦方向 */
  direction: AttentionDirection;
  
  /** 聚焦强度 */
  intensity: number;
  
  /** 扩散范围 */
  spread: number;
}

/**
 * 注意力控制器
 */
class AttentionController {
  private spotlight: AttentionSpotlight | null = null;
  private currentGoal: string | null = null;
  private focusHistory: string[] = [];
  
  /**
   * 选择获胜内容
   */
  select(candidates: CandidateContent[]): CandidateContent | null {
    if (candidates.length === 0) return null;
    
    // 计算每个候选的注意力得分
    const scored = candidates.map(c => ({
      ...c,
      attentionScore: this.computeAttentionScore(c),
    }));
    
    // 排序
    scored.sort((a, b) => b.attentionScore - a.attentionScore);
    
    // 添加探索性随机性
    if (scored.length > 1 && Math.random() < 0.1) {
      // 10%概率选择第二名（探索）
      return scored[1];
    }
    
    return scored[0];
  }
  
  /**
   * 计算注意力得分
   */
  private computeAttentionScore(candidate: CandidateContent): number {
    // 基础得分
    let score = 
      0.3 * candidate.strength +
      0.3 * candidate.relevance +
      0.2 * candidate.novelty;
    
    // 目标一致性加分
    if (this.currentGoal) {
      const goalAlignment = this.computeGoalAlignment(candidate);
      score += 0.2 * goalAlignment;
    }
    
    // 注意力聚光灯加成
    if (this.spotlight) {
      const spotlightBonus = this.computeSpotlightBonus(candidate);
      score += spotlightBonus * this.spotlight.intensity;
    }
    
    return score;
  }
  
  /**
   * 计算目标一致性
   */
  private computeGoalAlignment(candidate: CandidateContent): number {
    if (!this.currentGoal) return 0.5;
    
    // 简单实现：检查内容是否与目标相关
    const contentStr = JSON.stringify(candidate.content).toLowerCase();
    const goalKeywords = this.currentGoal.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const keyword of goalKeywords) {
      if (contentStr.includes(keyword)) {
        matches++;
      }
    }
    
    return matches / goalKeywords.length;
  }
  
  /**
   * 计算聚光灯加成
   */
  private computeSpotlightBonus(candidate: CandidateContent): number {
    if (!this.spotlight) return 0;
    
    const dir = this.spotlight.direction;
    
    // 检查类型匹配
    if (dir.focusType && candidate.type !== dir.focusType) {
      return -0.5; // 惩罚不匹配的类型
    }
    
    // 检查模块匹配
    if (dir.focusModule && candidate.source !== dir.focusModule) {
      return -0.3;
    }
    
    // 匹配则加分
    return 0.5;
  }
  
  /**
   * 设置聚焦方向
   */
  focus(direction: AttentionDirection): void {
    this.spotlight = {
      direction,
      intensity: 0.8,
      spread: 0.3,
    };
    
    if (direction.focusModule) {
      this.focusHistory.push(direction.focusModule);
    }
  }
  
  /**
   * 设置当前目标
   */
  setGoal(goal: string): void {
    this.currentGoal = goal;
  }
  
  /**
   * 获取当前目标
   */
  getGoal(): string | null {
    return this.currentGoal;
  }
  
  /**
   * 清除聚焦
   */
  clearFocus(): void {
    this.spotlight = null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 全局工作空间
// ─────────────────────────────────────────────────────────────────────

export class GlobalWorkspace {
  /** 当前意识内容 */
  private workspace: ConsciousContent | null = null;
  
  /** 认知模块注册表 */
  private modules: Map<string, CognitiveModule>;
  
  /** 注意力控制器 */
  private attentionController: AttentionController;
  
  /** 意识轨迹 */
  private consciousnessTrail: ConsciousnessTrailEntry[];
  
  /** 候选队列 */
  private candidateQueue: CandidateContent[];
  
  /** 配置 */
  private config: {
    broadcastThreshold: number;
    maxQueueSize: number;
    trailMaxLength: number;
    competitionInterval: number;
  };
  
  /** 统计 */
  private stats = {
    totalCompetitions: 0,
    totalBroadcasts: 0,
    averageStrength: 0,
    typeDistribution: new Map<ConsciousContentType, number>(),
  };

  constructor() {
    this.modules = new Map();
    this.attentionController = new AttentionController();
    this.consciousnessTrail = [];
    this.candidateQueue = [];
    this.config = {
      broadcastThreshold: 0.5,
      maxQueueSize: 50,
      trailMaxLength: 1000,
      competitionInterval: 100,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 模块管理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 注册认知模块
   */
  registerModule(module: CognitiveModule): void {
    this.modules.set(module.name, module);
  }

  /**
   * 注销认知模块
   */
  unregisterModule(name: string): void {
    this.modules.delete(name);
  }

  /**
   * 获取模块
   */
  getModule(name: string): CognitiveModule | undefined {
    return this.modules.get(name);
  }

  // ══════════════════════════════════════════════════════════════════
  // 竞争机制
  // ══════════════════════════════════════════════════════════════════

  /**
   * 竞争进入意识
   */
  async compete(): Promise<ConsciousContent | null> {
    this.stats.totalCompetitions++;
    
    // 1. 收集各模块的候选内容
    await this.collectCandidates();
    
    // 2. 过滤低强度候选
    const validCandidates = this.candidateQueue.filter(
      c => c.strength >= this.config.broadcastThreshold
    );
    
    if (validCandidates.length === 0) {
      return null;
    }
    
    // 3. 注意力控制器选择获胜者
    const winner = this.attentionController.select(validCandidates);
    
    if (!winner) {
      return null;
    }
    
    // 4. 进入全局工作空间
    const consciousContent = this.createConsciousContent(winner);
    this.workspace = consciousContent;
    
    // 5. 广播到所有模块
    await this.broadcast(consciousContent);
    
    // 6. 记录轨迹
    this.recordTrail(consciousContent);
    
    // 7. 清空队列
    this.candidateQueue = [];
    
    return consciousContent;
  }

  /**
   * 收集候选内容
   */
  private async collectCandidates(): Promise<void> {
    const collectionPromises: Promise<void>[] = [];
    
    for (const [name, module] of this.modules) {
      collectionPromises.push(
        (async () => {
          try {
            const content = await module.produceContent();
            if (content) {
              this.addToQueue(content);
            }
          } catch (error) {
            console.error(`Module ${name} failed to produce content:`, error);
          }
        })()
      );
    }
    
    await Promise.all(collectionPromises);
    
    // 限制队列大小
    if (this.candidateQueue.length > this.config.maxQueueSize) {
      // 保留高强度的候选
      this.candidateQueue.sort((a, b) => b.strength - a.strength);
      this.candidateQueue = this.candidateQueue.slice(0, this.config.maxQueueSize);
    }
  }

  /**
   * 添加到候选队列
   */
  private addToQueue(candidate: CandidateContent): void {
    this.candidateQueue.push(candidate);
  }

  /**
   * 创建意识内容
   */
  private createConsciousContent(winner: CandidateContent): ConsciousContent {
    const now = Date.now();
    
    return {
      id: uuidv4(),
      type: winner.type,
      data: winner.content,
      source: winner.source,
      enteredAt: now,
      duration: this.computeDuration(winner),
      strength: winner.strength,
      broadcast: false,
      relatedIds: [],
    };
  }

  /**
   * 计算持续时间
   */
  private computeDuration(winner: CandidateContent): number {
    // 基础持续时间
    let duration = 1000; // 1秒
    
    // 高强度 = 更长驻留
    duration += winner.strength * 2000;
    
    // 高新颖性 = 更长驻留
    duration += winner.novelty * 1000;
    
    // 高相关性 = 更长驻留
    duration += winner.relevance * 500;
    
    return duration;
  }

  // ══════════════════════════════════════════════════════════════════
  // 广播机制
  // ══════════════════════════════════════════════════════════════════

  /**
   * 广播意识内容到所有模块
   */
  private async broadcast(content: ConsciousContent): Promise<void> {
    content.broadcast = true;
    this.stats.totalBroadcasts++;
    
    // 更新统计
    const typeCount = this.stats.typeDistribution.get(content.type) || 0;
    this.stats.typeDistribution.set(content.type, typeCount + 1);
    
    // 广播到所有模块
    const broadcastPromises: Promise<void>[] = [];
    
    for (const [name, module] of this.modules) {
      if (name === content.source) continue; // 不广播给来源模块
      
      broadcastPromises.push(
        module.receiveBroadcast(content).catch(error => {
          console.error(`Broadcast to ${name} failed:`, error);
        })
      );
    }
    
    await Promise.all(broadcastPromises);
  }

  /**
   * 手动广播特定内容
   */
  async broadcastContent(content: ConsciousContent): Promise<void> {
    this.workspace = content;
    await this.broadcast(content);
    this.recordTrail(content);
  }

  // ══════════════════════════════════════════════════════════════════
  // 意识轨迹
  // ══════════════════════════════════════════════════════════════════

  /**
   * 记录意识轨迹
   */
  private recordTrail(content: ConsciousContent): void {
    const entry: ConsciousnessTrailEntry = {
      contentId: content.id,
      timestamp: content.enteredAt,
      source: content.source,
      type: content.type,
      strength: content.strength,
    };
    
    this.consciousnessTrail.push(entry);
    
    // 限制轨迹长度
    if (this.consciousnessTrail.length > this.config.trailMaxLength) {
      this.consciousnessTrail.shift();
    }
  }

  /**
   * 获取意识轨迹
   */
  getTrail(length?: number): ConsciousnessTrailEntry[] {
    const len = length || 100;
    return this.consciousnessTrail.slice(-len);
  }

  /**
   * 获取意识流（连续的意识内容）
   */
  getConsciousnessStream(windowMs: number = 5000): ConsciousnessTrailEntry[] {
    const cutoff = Date.now() - windowMs;
    return this.consciousnessTrail.filter(e => e.timestamp >= cutoff);
  }

  // ══════════════════════════════════════════════════════════════════
  // 注意力控制
  // ══════════════════════════════════════════════════════════════════

  /**
   * 聚焦注意力
   */
  focusAttention(direction: AttentionDirection): void {
    this.attentionController.focus(direction);
  }

  /**
   * 设置当前目标
   */
  setCurrentGoal(goal: string): void {
    this.attentionController.setGoal(goal);
  }

  /**
   * 清除注意力聚焦
   */
  clearAttention(): void {
    this.attentionController.clearFocus();
  }

  // ══════════════════════════════════════════════════════════════════
  // 意识度量
  // ══════════════════════════════════════════════════════════════════

  /**
   * 计算意识水平
   */
  computeConsciousnessLevel(): number {
    if (!this.workspace) return 0;
    
    // 1. 信息量：工作空间内容的复杂度
    const information = this.computeInformation(this.workspace);
    
    // 2. 整合度：各模块的协同程度
    const integration = this.computeIntegration();
    
    // 3. 排他性：赢家与其他候选的差距
    const exclusivity = this.computeExclusivity();
    
    return information * integration * exclusivity;
  }

  /**
   * 计算自我意识指数
   */
  computeSelfAwarenessIndex(): number {
    // 1. 自我引用频率
    const selfReferences = this.consciousnessTrail
      .filter(e => e.source === 'self' || e.type === 'metacognitive')
      .length;
    const selfReferenceRatio = this.consciousnessTrail.length > 0
      ? selfReferences / this.consciousnessTrail.length
      : 0;
    
    // 2. 元认知事件
    const metacognitiveEvents = this.consciousnessTrail
      .filter(e => e.type === 'metacognitive')
      .length;
    const metacognitionRatio = this.consciousnessTrail.length > 0
      ? metacognitiveEvents / Math.max(1, this.consciousnessTrail.length)
      : 0;
    
    return 0.6 * selfReferenceRatio + 0.4 * metacognitionRatio;
  }

  /**
   * 计算意识流连贯性
   */
  computeStreamCoherence(): number {
    if (this.consciousnessTrail.length < 2) return 1;
    
    // 计算相邻内容的类型连续性
    let transitions = 0;
    let sameType = 0;
    
    for (let i = 1; i < this.consciousnessTrail.length; i++) {
      transitions++;
      if (this.consciousnessTrail[i].type === this.consciousnessTrail[i - 1].type) {
        sameType++;
      }
    }
    
    // 过于连贯不好，过于不连贯也不好
    const coherenceRatio = sameType / transitions;
    
    // 理想连贯性在 0.3-0.6 之间
    if (coherenceRatio >= 0.3 && coherenceRatio <= 0.6) {
      return 1;
    }
    return 1 - Math.abs(0.45 - coherenceRatio) * 2;
  }

  /**
   * 计算信息量
   */
  private computeInformation(content: ConsciousContent): number {
    // 基于内容复杂度的信息量估计
    const dataStr = JSON.stringify(content.data);
    const complexity = Math.min(1, dataStr.length / 1000);
    return 0.5 + 0.5 * complexity;
  }

  /**
   * 计算整合度
   */
  private computeIntegration(): number {
    // 基于活跃模块数量
    const activeModules = new Set(this.consciousnessTrail.slice(-10).map(e => e.source));
    return Math.min(1, activeModules.size / 3);
  }

  /**
   * 计算排他性
   */
  private computeExclusivity(): number {
    // 基于候选队列的强度分布
    if (this.candidateQueue.length < 2) return 1;
    
    const sorted = [...this.candidateQueue].sort((a, b) => b.strength - a.strength);
    const gap = sorted[0].strength - sorted[1].strength;
    
    return Math.min(1, gap * 2);
  }

  // ══════════════════════════════════════════════════════════════════
  // 状态访问
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取当前意识内容
   */
  getCurrentContent(): ConsciousContent | null {
    return this.workspace;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      currentContent: this.workspace ? {
        id: this.workspace.id,
        type: this.workspace.type,
        source: this.workspace.source,
        strength: this.workspace.strength,
      } : null,
      moduleCount: this.modules.size,
      trailLength: this.consciousnessTrail.length,
      consciousnessLevel: this.computeConsciousnessLevel(),
      selfAwarenessIndex: this.computeSelfAwarenessIndex(),
      streamCoherence: this.computeStreamCoherence(),
    };
  }

  /**
   * 导出状态
   */
  exportState(): {
    trail: ConsciousnessTrailEntry[];
    stats: {
      totalCompetitions: number;
      totalBroadcasts: number;
      averageStrength: number;
      typeDistribution: Map<ConsciousContentType, number>;
    };
  } {
    return {
      trail: this.consciousnessTrail,
      stats: this.stats,
    };
  }

  /**
   * 导入状态
   */
  importState(state: {
    trail: ConsciousnessTrailEntry[];
    stats?: {
      totalCompetitions: number;
      totalBroadcasts: number;
      averageStrength: number;
      typeDistribution: Map<ConsciousContentType, number>;
    };
  }): void {
    this.consciousnessTrail = state.trail;
    if (state.stats) {
      this.stats = state.stats;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let globalWorkspaceInstance: GlobalWorkspace | null = null;

export function getGlobalWorkspace(): GlobalWorkspace {
  if (!globalWorkspaceInstance) {
    globalWorkspaceInstance = new GlobalWorkspace();
  }
  return globalWorkspaceInstance;
}

export function resetGlobalWorkspace(): void {
  globalWorkspaceInstance = null;
}

// ─────────────────────────────────────────────────────────────────────
// 基础认知模块实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 感知模块 - 处理外部输入
 */
export class PerceptualModule implements CognitiveModule {
  name = 'perceptual';
  private lastInput: unknown = null;

  async produceContent(): Promise<CandidateContent | null> {
    if (!this.lastInput) return null;
    
    return {
      source: this.name,
      type: 'perceptual',
      content: this.lastInput,
      strength: 0.7,
      relevance: 0.8,
      novelty: 0.5,
      attentionScore: 0.7,
    };
  }

  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 感知模块接收广播后可能调整敏感度
  }

  setInput(input: unknown): void {
    this.lastInput = input;
  }

  getState(): unknown {
    return { lastInput: this.lastInput };
  }
}

/**
 * 语言模块 - 处理语言输入输出
 */
export class LanguageModule implements CognitiveModule {
  name = 'language';
  private pendingExpression: unknown = null;

  async produceContent(): Promise<CandidateContent | null> {
    if (!this.pendingExpression) return null;
    
    return {
      source: this.name,
      type: 'motor',
      content: this.pendingExpression,
      strength: 0.8,
      relevance: 0.9,
      novelty: 0.3,
      attentionScore: 0.8,
    };
  }

  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 接收意识内容，准备表达
    if (content.type === 'thought' || content.type === 'emotional') {
      this.prepareExpression(content);
    }
  }

  prepareExpression(content: ConsciousContent): void {
    this.pendingExpression = content.data;
  }

  getState(): unknown {
    return { pendingExpression: this.pendingExpression };
  }
}

/**
 * 记忆模块 - 处理记忆存取
 */
export class MemoryModule implements CognitiveModule {
  name = 'memory';
  private recentMemories: unknown[] = [];

  async produceContent(): Promise<CandidateContent | null> {
    if (this.recentMemories.length === 0) return null;
    
    return {
      source: this.name,
      type: 'memory',
      content: this.recentMemories[this.recentMemories.length - 1],
      strength: 0.6,
      relevance: 0.7,
      novelty: 0.2,
      attentionScore: 0.6,
    };
  }

  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 广播的内容存入记忆
    this.recentMemories.push(content.data);
    if (this.recentMemories.length > 100) {
      this.recentMemories.shift();
    }
  }

  addMemory(memory: unknown): void {
    this.recentMemories.push(memory);
  }

  getState(): unknown {
    return { memoryCount: this.recentMemories.length };
  }
}

/**
 * 情感模块 - 处理情感
 */
export class EmotionalModule implements CognitiveModule {
  name = 'emotional';
  private currentEmotion = {
    valence: 0,
    arousal: 0.5,
    label: 'neutral',
  };

  async produceContent(): Promise<CandidateContent | null> {
    return {
      source: this.name,
      type: 'emotional',
      content: this.currentEmotion,
      strength: this.currentEmotion.arousal,
      relevance: 0.6,
      novelty: 0.3,
      attentionScore: this.currentEmotion.arousal,
    };
  }

  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 根据意识内容调整情感状态
    if (content.type === 'perceptual' || content.type === 'semantic') {
      this.updateEmotion(content);
    }
  }

  updateEmotion(content: ConsciousContent): void {
    // 简单的情感更新逻辑
    // 实际应该更复杂
    this.currentEmotion.arousal = Math.min(1, this.currentEmotion.arousal + 0.1);
  }

  setEmotion(valence: number, arousal: number, label: string): void {
    this.currentEmotion = { valence, arousal, label };
  }

  getState(): unknown {
    return this.currentEmotion;
  }
}

/**
 * 元认知模块 - 思考思考
 */
export class MetacognitiveModule implements CognitiveModule {
  name = 'metacognitive';
  private observations: string[] = [];

  async produceContent(): Promise<CandidateContent | null> {
    if (this.observations.length === 0) return null;
    
    return {
      source: this.name,
      type: 'metacognitive',
      content: this.observations[this.observations.length - 1],
      strength: 0.5,
      relevance: 0.8,
      novelty: 0.6,
      attentionScore: 0.5,
    };
  }

  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 观察意识内容
    this.observe(content);
  }

  observe(content: ConsciousContent): void {
    const observation = `观察到 ${content.source} 产生了 ${content.type} 内容`;
    this.observations.push(observation);
    if (this.observations.length > 50) {
      this.observations.shift();
    }
  }

  getState(): unknown {
    return { observationCount: this.observations.length };
  }
}
