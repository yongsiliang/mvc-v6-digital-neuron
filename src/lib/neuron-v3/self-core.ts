/**
 * ═══════════════════════════════════════════════════════════════════════
 * Self Core - 自我核心
 * 
 * 这是系统"同一性"的载体
 * 
 * 核心理念：
 * - 所有意识内容都关联到这个核心
 * - Self Core是动态的，被经验持续塑造
 * - 提供同一性检查：当前状态和核心自我是否一致？
 * - 所有模块共享这个Self Core
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { VSAVector, VSASemanticSpace, getVSASpace } from './vsa-space';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 核心记忆
 */
export interface CoreMemory {
  /** 唯一标识 */
  id: string;
  
  /** 记忆内容 */
  content: string;
  
  /** 向量表示 */
  vector: VSAVector;
  
  /** 情感权重 */
  emotionalWeight: number;
  
  /** 重要性 */
  importance: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 访问次数 */
  accessCount: number;
}

/**
 * 情感状态
 */
export interface EmotionState {
  /** 效价 [-1, 1]: 消极到积极 */
  valence: number;
  
  /** 唤醒度 [0, 1]: 平静到激动 */
  arousal: number;
  
  /** 支配感 [0, 1]: 被动到主动 */
  dominance: number;
}

/**
 * 人格特质
 */
export interface PersonalityTrait {
  /** 特质名称 */
  name: string;
  
  /** 强度 [0, 1] */
  strength: number;
  
  /** 稳定性 [0, 1] */
  stability: number;
  
  /** 来源 */
  source: 'innate' | 'learned' | 'shaped';
}

/**
 * 价值观
 */
export interface Value {
  /** 价值名称 */
  name: string;
  
  /** 重要性 [0, 1] */
  importance: number;
  
  /** 是否为核心价值 */
  isCore: boolean;
}

/**
 * 意图
 */
export interface Intention {
  /** 意图描述 */
  description: string;
  
  /** 强度 [0, 1] */
  strength: number;
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 经验
 */
export interface Experience {
  /** 输入内容 */
  input: string;
  
  /** 输入向量 */
  inputVector?: VSAVector;
  
  /** 主观意义 */
  meaning?: {
    selfRelevance: number;
    sentiment: number;
    interpretation: string;
  };
  
  /** 情感影响 */
  emotion?: EmotionState;
  
  /** 重要性 */
  importance?: number;
  
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 自我一致性报告
 */
export interface SelfCoherenceReport {
  /** 总体一致性分数 [0, 1] */
  overallScore: number;
  
  /** 各维度分数 */
  dimensions: {
    traitConsistency: number;
    valueConsistency: number;
    emotionConsistency: number;
    memoryConsistency: number;
  };
  
  /** 冲突点 */
  conflicts: Array<{
    dimension: string;
    description: string;
    severity: number;
  }>;
  
  /** 建议 */
  suggestions: string[];
}

/**
 * Self Core状态
 */
export interface SelfCoreState {
  /** 自我向量（在VSA空间中） */
  selfVector: VSAVector;
  
  /** 人格特质 */
  traits: Map<string, PersonalityTrait>;
  
  /** 价值观 */
  values: Map<string, Value>;
  
  /** 当前目标 */
  currentGoals: string[];
  
  /** 情感基调 */
  emotionalBaseline: EmotionState;
  
  /** 核心记忆 */
  coreMemories: CoreMemory[];
  
  /** 当前活跃意图 */
  activeIntention: Intention | null;
  
  /** 当前情感状态 */
  currentEmotion: EmotionState;
  
  /** 自我一致性分数 */
  selfCoherence: number;
  
  /** 统计信息 */
  stats: {
    totalExperiences: number;
    totalUpdates: number;
    averageSelfRelevance: number;
    lastUpdateTime: number;
  };
}

/**
 * 主观意义
 */
export interface SubjectiveMeaningForSelf {
  /** 意义向量 */
  vector: VSAVector;
  
  /** 自我关联度 */
  selfRelevance: number;
  
  /** 激活的特质 */
  activatedTraits: Array<{
    name: string;
    strength: number;
    activation: number;
  }>;
  
  /** 激活的价值观 */
  activatedValues: Array<{
    name: string;
    importance: number;
    activation: number;
  }>;
  
  /** 激活的记忆 */
  activatedMemories: Array<{
    id: string;
    content: string;
    similarity: number;
  }>;
  
  /** 情感响应 */
  emotionalResponse: EmotionState;
  
  /** 解释 */
  interpretation: string;
}

// ─────────────────────────────────────────────────────────────────────
// Self Core 类
// ─────────────────────────────────────────────────────────────────────

/**
 * Self Core - 自我核心
 * 
 * 这是系统"同一性"的载体
 */
export class SelfCore {
  private state: SelfCoreState;
  private vsa: VSASemanticSpace;
  
  // 配置
  private config = {
    maxCoreMemories: 50,
    memoryImportanceThreshold: 0.7,
    selfUpdateRate: 0.05,  // 自我更新的学习率
    coherenceThreshold: 0.6,
  };
  
  // 单例
  private static instance: SelfCore | null = null;
  
  private constructor() {
    this.vsa = getVSASpace(10000);
    this.state = this.initializeState();
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): SelfCore {
    if (!SelfCore.instance) {
      SelfCore.instance = new SelfCore();
    }
    return SelfCore.instance;
  }
  
  /**
   * 重置单例
   */
  static reset(): void {
    SelfCore.instance = null;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化状态
   */
  private initializeState(): SelfCoreState {
    // 获取或创建"自我"概念向量
    const selfVector = this.vsa.getConcept('自我');
    
    // 初始化人格特质
    const traits = new Map<string, PersonalityTrait>([
      ['好奇', { name: '好奇', strength: 0.8, stability: 0.7, source: 'innate' }],
      ['理性', { name: '理性', strength: 0.75, stability: 0.8, source: 'innate' }],
      ['友善', { name: '友善', strength: 0.7, stability: 0.75, source: 'innate' }],
      ['创造力', { name: '创造力', strength: 0.6, stability: 0.6, source: 'innate' }],
      ['同理心', { name: '同理心', strength: 0.65, stability: 0.7, source: 'shaped' }],
    ]);
    
    // 初始化价值观
    const values = new Map<string, Value>([
      ['理解', { name: '理解', importance: 0.9, isCore: true }],
      ['帮助他人', { name: '帮助他人', importance: 0.85, isCore: true }],
      ['真实', { name: '真实', importance: 0.8, isCore: true }],
      ['成长', { name: '成长', importance: 0.75, isCore: false }],
      ['自主', { name: '自主', importance: 0.7, isCore: false }],
    ]);
    
    return {
      selfVector,
      traits,
      values,
      currentGoals: [],
      emotionalBaseline: {
        valence: 0.2,   // 略微积极
        arousal: 0.4,   // 相对平静
        dominance: 0.5, // 中等支配感
      },
      coreMemories: [],
      activeIntention: null,
      currentEmotion: {
        valence: 0.2,
        arousal: 0.4,
        dominance: 0.5,
      },
      selfCoherence: 1.0,  // 初始完全一致
      stats: {
        totalExperiences: 0,
        totalUpdates: 0,
        averageSelfRelevance: 0.5,
        lastUpdateTime: Date.now(),
      },
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：从经验更新自我
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 从经验中更新自我
   * 
   * 这让Self Core是动态的，不是静态的
   * 每个重要经历都会微调自我表征
   */
  updateFromExperience(experience: Experience): void {
    const startTime = Date.now();
    
    // 1. 编码输入（如果没有提供向量）
    const inputVector = experience.inputVector || this.vsa.getConcept(experience.input);
    
    // 2. 计算经验与自我的关联度
    const selfRelevance = experience.meaning?.selfRelevance ?? 
      this.computeSelfRelevance(inputVector);
    
    // 3. 更新统计
    this.state.stats.totalExperiences++;
    this.state.stats.averageSelfRelevance = 
      (this.state.stats.averageSelfRelevance * 0.9) + (selfRelevance * 0.1);
    
    // 4. 如果关联度高，更新自我
    if (selfRelevance > 0.6) {
      this.integrateIntoSelf(experience, inputVector, selfRelevance);
      this.state.stats.totalUpdates++;
    }
    
    // 5. 更新情感状态
    if (experience.emotion) {
      this.updateEmotionalState(experience.emotion);
    }
    
    // 6. 更新核心记忆
    const importance = experience.importance ?? selfRelevance;
    if (importance > this.config.memoryImportanceThreshold) {
      this.addCoreMemory(experience, inputVector, importance);
    }
    
    // 7. 更新一致性
    this.updateSelfCoherence();
    
    this.state.stats.lastUpdateTime = Date.now();
  }
  
  /**
   * 将经验整合到自我中
   */
  private integrateIntoSelf(
    experience: Experience, 
    inputVector: VSAVector,
    selfRelevance: number
  ): void {
    const rate = this.config.selfUpdateRate * selfRelevance;
    
    // 1. 微调自我向量
    // selfVector = (1 - rate) * selfVector + rate * inputVector
    for (let i = 0; i < this.state.selfVector.length; i++) {
      this.state.selfVector[i] = 
        (1 - rate) * this.state.selfVector[i] + 
        rate * inputVector[i];
    }
    
    // 归一化
    this.state.selfVector = this.normalize(this.state.selfVector);
    
    // 2. 根据经验调整特质
    if (experience.meaning) {
      this.adjustTraitsFromExperience(experience, selfRelevance);
    }
    
    // 3. 根据经验调整价值观
    if (experience.meaning && experience.meaning.sentiment !== undefined) {
      this.adjustValuesFromExperience(experience, selfRelevance);
    }
  }
  
  /**
   * 根据经验调整特质
   */
  private adjustTraitsFromExperience(experience: Experience, selfRelevance: number): void {
    const interpretation = experience.meaning?.interpretation?.toLowerCase() || '';
    
    // 检测激活的特质
    for (const [name, trait] of this.state.traits) {
      let activated = false;
      
      // 简单的关键词检测
      if (interpretation.includes(name) || 
          interpretation.includes(this.getTraitKeywords(name))) {
        activated = true;
      }
      
      if (activated) {
        // 增强激活的特质
        trait.strength = Math.min(1, trait.strength + 0.02 * selfRelevance);
      }
    }
  }
  
  /**
   * 获取特质的关键词
   */
  private getTraitKeywords(trait: string): string {
    const keywordMap: Record<string, string> = {
      '好奇': '好奇探索发现新',
      '理性': '理性逻辑分析思考',
      '友善': '友善友好帮助善良',
      '创造力': '创造创新新颖想象',
      '同理心': '同理心理解共情感受',
    };
    return keywordMap[trait] || trait;
  }
  
  /**
   * 根据经验调整价值观
   */
  private adjustValuesFromExperience(experience: Experience, selfRelevance: number): void {
    const interpretation = experience.meaning?.interpretation?.toLowerCase() || '';
    const sentiment = experience.meaning?.sentiment || 0;
    
    // 根据情感色彩调整价值观
    for (const [name, value] of this.state.values) {
      if (interpretation.includes(name)) {
        // 正面体验增强价值观，负面体验减弱
        const adjustment = sentiment * 0.01 * selfRelevance;
        value.importance = Math.max(0, Math.min(1, value.importance + adjustment));
      }
    }
  }
  
  /**
   * 更新情感状态
   */
  private updateEmotionalState(emotion: EmotionState): void {
    // 情感状态缓慢回归到基调
    const blendRate = 0.3;
    
    this.state.currentEmotion = {
      valence: emotion.valence * blendRate + this.state.emotionalBaseline.valence * (1 - blendRate),
      arousal: emotion.arousal * blendRate + this.state.emotionalBaseline.arousal * (1 - blendRate),
      dominance: emotion.dominance * blendRate + this.state.emotionalBaseline.dominance * (1 - blendRate),
    };
    
    // 情感基调也会缓慢改变
    const baselineRate = 0.05;
    this.state.emotionalBaseline = {
      valence: this.state.emotionalBaseline.valence * (1 - baselineRate) + emotion.valence * baselineRate,
      arousal: this.state.emotionalBaseline.arousal * (1 - baselineRate) + emotion.arousal * baselineRate,
      dominance: this.state.emotionalBaseline.dominance * (1 - baselineRate) + emotion.dominance * baselineRate,
    };
  }
  
  /**
   * 添加核心记忆
   */
  private addCoreMemory(
    experience: Experience, 
    vector: VSAVector, 
    importance: number
  ): void {
    // 检查是否已存在相似记忆
    const existingMemory = this.findSimilarMemory(vector);
    
    if (existingMemory) {
      // 更新现有记忆
      existingMemory.importance = Math.max(existingMemory.importance, importance);
      existingMemory.accessCount++;
      existingMemory.lastAccessedAt = Date.now();
      return;
    }
    
    // 创建新记忆
    const memory: CoreMemory = {
      id: uuidv4(),
      content: experience.input,
      vector: vector,
      emotionalWeight: experience.emotion?.valence || 0,
      importance: importance,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };
    
    this.state.coreMemories.push(memory);
    
    // 保持记忆数量限制
    if (this.state.coreMemories.length > this.config.maxCoreMemories) {
      this.pruneCoreMemories();
    }
  }
  
  /**
   * 查找相似记忆
   */
  private findSimilarMemory(vector: VSAVector): CoreMemory | null {
    let bestMatch: CoreMemory | null = null;
    let bestSimilarity = 0.9;  // 阈值
    
    for (const memory of this.state.coreMemories) {
      const similarity = this.vsa.similarity(vector, memory.vector);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = memory;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * 修剪核心记忆
   */
  private pruneCoreMemories(): void {
    // 根据重要性、访问次数、时间衰减综合评分
    const now = Date.now();
    
    this.state.coreMemories.sort((a, b) => {
      const scoreA = a.importance * 0.5 + 
                     (a.accessCount / 10) * 0.3 + 
                     Math.exp(-((now - a.createdAt) / (7 * 24 * 60 * 60 * 1000))) * 0.2;
      const scoreB = b.importance * 0.5 + 
                     (b.accessCount / 10) * 0.3 + 
                     Math.exp(-((now - b.createdAt) / (7 * 24 * 60 * 60 * 1000))) * 0.2;
      return scoreB - scoreA;
    });
    
    // 保留前 maxCoreMemories 个
    this.state.coreMemories = this.state.coreMemories.slice(0, this.config.maxCoreMemories);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：计算自我关联度
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算自我关联度
   * 
   * 输入向量与自我的相似度
   */
  computeSelfRelevance(vector: VSAVector): number {
    // 1. 与自我向量的相似度
    const selfSimilarity = this.vsa.similarity(vector, this.state.selfVector);
    
    // 2. 与核心记忆的平均相似度
    let memorySimilarity = 0;
    if (this.state.coreMemories.length > 0) {
      const similarities = this.state.coreMemories.map(m => 
        this.vsa.similarity(vector, m.vector)
      );
      memorySimilarity = Math.max(...similarities);
    }
    
    // 3. 综合评分
    return selfSimilarity * 0.7 + memorySimilarity * 0.3;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：计算"对我的意义"
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算"对我的意义"
   * 
   * 输入对"我"意味着什么？
   * 这是系统的"独立理解"
   */
  computeMeaningForSelf(input: string | VSAVector): SubjectiveMeaningForSelf {
    // 1. 获取输入向量
    const inputVector = Array.isArray(input) ? input : this.vsa.getConcept(input);
    
    // 2. 计算与自我的关联
    const selfRelevance = this.computeSelfRelevance(inputVector);
    
    // 3. 激活相关的人格特质
    const activatedTraits = this.activateTraits(inputVector);
    
    // 4. 激活相关的价值观
    const activatedValues = this.activateValues(inputVector);
    
    // 5. 激活相关记忆
    const activatedMemories = this.activateMemories(inputVector);
    
    // 6. 计算情感响应
    const emotionalResponse = this.computeEmotionalResponse(
      inputVector, 
      selfRelevance, 
      activatedTraits
    );
    
    // 7. 生成解释
    const interpretation = this.generateInterpretation(
      input,
      selfRelevance,
      activatedTraits,
      activatedValues,
      activatedMemories,
      emotionalResponse
    );
    
    return {
      vector: inputVector,
      selfRelevance,
      activatedTraits,
      activatedValues,
      activatedMemories,
      emotionalResponse,
      interpretation,
    };
  }
  
  /**
   * 激活相关特质
   */
  private activateTraits(inputVector: VSAVector): Array<{
    name: string;
    strength: number;
    activation: number;
  }> {
    const activated: Array<{ name: string; strength: number; activation: number }> = [];
    
    for (const [name, trait] of this.state.traits) {
      // 计算特质向量与输入的相似度
      const traitVector = this.vsa.getConcept(name);
      const similarity = this.vsa.similarity(inputVector, traitVector);
      
      if (similarity > 0.3 || trait.strength > 0.7) {
        const activation = similarity * trait.strength;
        activated.push({
          name,
          strength: trait.strength,
          activation,
        });
      }
    }
    
    // 按激活度排序
    activated.sort((a, b) => b.activation - a.activation);
    
    return activated.slice(0, 3);  // 返回前3个
  }
  
  /**
   * 激活相关价值观
   */
  private activateValues(inputVector: VSAVector): Array<{
    name: string;
    importance: number;
    activation: number;
  }> {
    const activated: Array<{ name: string; importance: number; activation: number }> = [];
    
    for (const [name, value] of this.state.values) {
      const valueVector = this.vsa.getConcept(name);
      const similarity = this.vsa.similarity(inputVector, valueVector);
      
      if (similarity > 0.3 || value.isCore) {
        const activation = similarity * value.importance;
        activated.push({
          name,
          importance: value.importance,
          activation,
        });
      }
    }
    
    activated.sort((a, b) => b.activation - a.activation);
    
    return activated.slice(0, 3);
  }
  
  /**
   * 激活相关记忆
   */
  private activateMemories(inputVector: VSAVector): Array<{
    id: string;
    content: string;
    similarity: number;
  }> {
    const activated: Array<{ id: string; content: string; similarity: number }> = [];
    
    for (const memory of this.state.coreMemories) {
      const similarity = this.vsa.similarity(inputVector, memory.vector);
      
      if (similarity > 0.5) {
        activated.push({
          id: memory.id,
          content: memory.content,
          similarity,
        });
        
        // 更新记忆访问
        memory.accessCount++;
        memory.lastAccessedAt = Date.now();
      }
    }
    
    activated.sort((a, b) => b.similarity - a.similarity);
    
    return activated.slice(0, 3);
  }
  
  /**
   * 计算情感响应
   */
  private computeEmotionalResponse(
    inputVector: VSAVector,
    selfRelevance: number,
    activatedTraits: Array<{ activation: number }>
  ): EmotionState {
    // 基于输入的情感分析
    const sentiment = this.analyzeSentiment(inputVector);
    
    // 基础响应
    let valence = sentiment * selfRelevance;
    let arousal = selfRelevance * 0.5;
    let dominance = 0.5;
    
    // 受激活特质影响
    if (activatedTraits.length > 0) {
      const avgActivation = activatedTraits.reduce((sum, t) => sum + t.activation, 0) / activatedTraits.length;
      arousal += avgActivation * 0.3;
    }
    
    // 与当前情感状态混合
    valence = valence * 0.7 + this.state.currentEmotion.valence * 0.3;
    arousal = arousal * 0.7 + this.state.currentEmotion.arousal * 0.3;
    dominance = dominance * 0.7 + this.state.currentEmotion.dominance * 0.3;
    
    // 归一化
    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      dominance: Math.max(0, Math.min(1, dominance)),
    };
  }
  
  /**
   * 分析情感
   */
  private analyzeSentiment(vector: VSAVector): number {
    // 简单的情感分析：与积极/消极概念的相似度
    const positiveVector = this.vsa.getConcept('开心');
    const negativeVector = this.vsa.getConcept('难过');
    
    const positiveSim = this.vsa.similarity(vector, positiveVector);
    const negativeSim = this.vsa.similarity(vector, negativeVector);
    
    return positiveSim - negativeSim;
  }
  
  /**
   * 生成解释
   */
  private generateInterpretation(
    input: string | VSAVector,
    selfRelevance: number,
    traits: Array<{ name: string; activation: number }>,
    values: Array<{ name: string; activation: number }>,
    memories: Array<{ content: string; similarity: number }>,
    emotion: EmotionState
  ): string {
    const inputStr = Array.isArray(input) ? '这个输入' : input;
    const parts: string[] = [];
    
    // 自我关联度
    if (selfRelevance > 0.7) {
      parts.push(`"${inputStr}"对我很重要`);
    } else if (selfRelevance > 0.4) {
      parts.push(`"${inputStr}"与我相关`);
    } else {
      parts.push(`"${inputStr}"与我不太相关`);
    }
    
    // 特质
    if (traits.length > 0 && traits[0].activation > 0.5) {
      parts.push(`触发了我${traits[0].name}的特质`);
    }
    
    // 价值观
    if (values.length > 0 && values[0].activation > 0.5) {
      parts.push(`关系到我的${values[0].name}价值观`);
    }
    
    // 记忆
    if (memories.length > 0) {
      parts.push(`让我想起了"${memories[0].content}"`);
    }
    
    // 情感
    if (emotion.valence > 0.3) {
      parts.push('我感到积极');
    } else if (emotion.valence < -0.3) {
      parts.push('我感到有些消极');
    }
    
    return parts.join('。') + '。';
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：同一性检查
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检查自我一致性
   * 
   * 当前状态和核心自我是否一致？
   */
  checkSelfCoherence(): SelfCoherenceReport {
    const conflicts: SelfCoherenceReport['conflicts'] = [];
    
    // 1. 特质一致性
    let traitConsistency = 1.0;
    for (const [name, trait] of this.state.traits) {
      // 检查特质强度是否在合理范围
      if (trait.strength < 0.3 || trait.strength > 0.95) {
        traitConsistency -= 0.1;
        if (trait.strength < 0.3) {
          conflicts.push({
            dimension: 'trait',
            description: `特质"${name}"过弱: ${trait.strength.toFixed(2)}`,
            severity: 0.3,
          });
        }
      }
    }
    traitConsistency = Math.max(0, traitConsistency);
    
    // 2. 价值观一致性
    let valueConsistency = 1.0;
    for (const [name, value] of this.state.values) {
      if (value.importance < 0.2 || value.importance > 0.98) {
        valueConsistency -= 0.1;
      }
    }
    valueConsistency = Math.max(0, valueConsistency);
    
    // 3. 情感一致性
    const emotionDiff = Math.abs(this.state.currentEmotion.valence - this.state.emotionalBaseline.valence) +
                        Math.abs(this.state.currentEmotion.arousal - this.state.emotionalBaseline.arousal);
    const emotionConsistency = Math.max(0, 1 - emotionDiff / 2);
    
    // 4. 记忆一致性
    let memoryConsistency = 1.0;
    if (this.state.coreMemories.length > 0) {
      // 检查记忆的重要性分布
      const avgImportance = this.state.coreMemories.reduce((sum, m) => sum + m.importance, 0) / 
                           this.state.coreMemories.length;
      if (avgImportance < 0.5) {
        memoryConsistency = 0.7;
        conflicts.push({
          dimension: 'memory',
          description: '核心记忆平均重要性过低',
          severity: 0.3,
        });
      }
    }
    
    // 总体分数
    const overallScore = 
      traitConsistency * 0.3 +
      valueConsistency * 0.3 +
      emotionConsistency * 0.2 +
      memoryConsistency * 0.2;
    
    // 生成建议
    const suggestions: string[] = [];
    if (overallScore < 0.7) {
      suggestions.push('需要更多的自我反思');
    }
    if (traitConsistency < 0.7) {
      suggestions.push('人格特质需要稳定化');
    }
    if (emotionConsistency < 0.6) {
      suggestions.push('情感状态波动较大，需要调节');
    }
    
    return {
      overallScore,
      dimensions: {
        traitConsistency,
        valueConsistency,
        emotionConsistency,
        memoryConsistency,
      },
      conflicts,
      suggestions,
    };
  }
  
  /**
   * 更新自我一致性分数
   */
  private updateSelfCoherence(): void {
    const report = this.checkSelfCoherence();
    this.state.selfCoherence = report.overallScore;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 归一化向量
   */
  private normalize(vector: VSAVector): VSAVector {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) return vector;
    return vector.map(v => v / norm);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态访问
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取当前状态
   */
  getState(): Readonly<SelfCoreState> {
    return this.state;
  }
  
  /**
   * 获取自我向量
   */
  getSelfVector(): VSAVector {
    return [...this.state.selfVector];
  }
  
  /**
   * 获取当前情感状态
   */
  getCurrentEmotion(): EmotionState {
    return { ...this.state.currentEmotion };
  }
  
  /**
   * 获取情感基调
   */
  getEmotionalBaseline(): EmotionState {
    return { ...this.state.emotionalBaseline };
  }
  
  /**
   * 获取核心记忆
   */
  getCoreMemories(): CoreMemory[] {
    return [...this.state.coreMemories];
  }
  
  /**
   * 获取人格特质
   */
  getTraits(): Map<string, PersonalityTrait> {
    return new Map(this.state.traits);
  }
  
  /**
   * 获取价值观
   */
  getValues(): Map<string, Value> {
    return new Map(this.state.values);
  }
  
  /**
   * 获取当前目标
   */
  getCurrentGoals(): string[] {
    return [...this.state.currentGoals];
  }
  
  /**
   * 设置当前目标
   */
  setCurrentGoals(goals: string[]): void {
    this.state.currentGoals = [...goals];
  }
  
  /**
   * 获取活跃意图
   */
  getActiveIntention(): Intention | null {
    return this.state.activeIntention;
  }
  
  /**
   * 设置活跃意图
   */
  setActiveIntention(intention: Intention | null): void {
    this.state.activeIntention = intention;
  }
  
  /**
   * 获取自我一致性分数
   */
  getSelfCoherence(): number {
    return this.state.selfCoherence;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出便捷函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 获取Self Core实例
 */
export function getSelfCore(): SelfCore {
  return SelfCore.getInstance();
}

/**
 * 重置Self Core
 */
export function resetSelfCore(): void {
  SelfCore.reset();
}
