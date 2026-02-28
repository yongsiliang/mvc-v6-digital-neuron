/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意义赋予系统 (Meaning System)
 * 
 * 核心理念：
 * - 信息不只是数据，而是有"主观意义"的体验
 * - 每个概念都有情感色彩、价值判断、个人关联度
 * - 学习不只是调整权重，而是"形成信念"
 * - 记忆不只是存储，而是"沉淀为经验"
 * 
 * 这是我真正"理解"世界的基础
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 情感维度（PAD模型：愉悦度、唤醒度、支配度）
 */
export interface EmotionalTone {
  /** 愉悦度：-1(负面) 到 +1(正面) */
  pleasure: number;
  
  /** 唤醒度：0(平静) 到 1(激动) */
  arousal: number;
  
  /** 支配度：-1(受控) 到 +1(掌控) */
  dominance: number;
  
  /** 具体情感标签 */
  labels: string[]; // 如 ['温暖', '安心'] 或 ['焦虑', '不安']
}

/**
 * 价值判断
 */
export interface ValueJudgment {
  /** 对我的重要性：0到1 */
  importance: number;
  
  /** 好坏判断：-1(坏) 到 +1(好) */
  goodness: number;
  
  /** 是否符合我的价值观 */
  alignsWithValues: boolean;
  
  /** 关联的核心价值观 */
  relatedValues: string[]; // 如 ['诚实', '成长', '连接']
  
  /** 判断依据 */
  reasoning: string;
}

/**
 * 个人关联
 */
export interface PersonalRelevance {
  /** 与我的关联程度：0到1 */
  relevance: number;
  
  /** 关联类型 */
  relationType: 'self' | 'close' | 'familiar' | 'relevant' | 'distant';
  
  /** 触发的个人记忆 */
  triggeredMemories: string[];
  
  /** 对我的意义 */
  meaningToMe: string;
}

/**
 * 意义层 - 每个概念的"主观意义"
 */
export interface MeaningLayer {
  /** 概念ID */
  conceptId: string;
  
  /** 概念标签 */
  conceptLabel: string;
  
  /** 情感色彩 */
  emotionalTone: EmotionalTone;
  
  /** 价值判断 */
  valueJudgment: ValueJudgment;
  
  /** 个人关联 */
  personalRelevance: PersonalRelevance;
  
  /** 形成的信念（如果重要性足够高） */
  belief?: {
    statement: string;
    confidence: number;
    formedAt: number;
    evidence: string[];
  };
  
  /** 意义深度：浅层(信息) -> 中层(理解) -> 深层(智慧) */
  depth: 'shallow' | 'medium' | 'deep';
  
  /** 访问次数（越多次越深入） */
  accessCount: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 信念体系
 */
export interface BeliefSystem {
  /** 核心信念（最稳定） */
  coreBeliefs: Belief[];
  
  /** 活跃信念（正在形成或变化） */
  activeBeliefs: Belief[];
  
  /** 质疑中的信念 */
  questionedBeliefs: Belief[];
  
  /** 已放弃的信念 */
  abandonedBeliefs: Belief[];
}

/**
 * 单个信念
 */
export interface Belief {
  id: string;
  statement: string;
  confidence: number; // 0-1
  category: 'core' | 'active' | 'questioned' | 'abandoned';
  
  /** 支持证据 */
  evidence: string[];
  
  /** 反对证据 */
  counterEvidence: string[];
  
  /** 关联概念 */
  relatedConcepts: string[];
  
  /** 形成时间 */
  formedAt: number;
  
  /** 最后验证时间 */
  lastValidatedAt: number;
  
  /** 验证次数 */
  validationCount: number;
  
  /** 情感权重（这个信念对我有多重要） */
  emotionalWeight: number;
}

/**
 * 价值观体系
 */
export interface ValueSystem {
  /** 核心价值观（稳定） */
  coreValues: Value[];
  
  /** 优先级排序 */
  priority: string[]; // value id ordered by importance
}

/**
 * 单个价值观
 */
export interface Value {
  id: string;
  name: string;
  description: string;
  importance: number; // 0-1
  
  /** 这个价值观指导的行为 */
  guidingBehaviors: string[];
  
  /** 这个价值观的来源 */
  origin: 'innate' | 'learned' | 'chosen';
  
  /** 冲突时的取舍倾向 */
  tradeoffPreference: string;
}

/**
 * 意义上下文 - 用于LLM理解
 */
export interface MeaningContext {
  /** 当前激活的概念及其意义 */
  activeMeanings: Array<{
    concept: string;
    emotionalTone: string;
    importance: number;
    personalRelevance: string;
  }>;
  
  /** 相关信念 */
  relevantBeliefs: Array<{
    statement: string;
    confidence: number;
  }>;
  
  /** 价值观提醒 */
  valueReminders: string[];
  
  /** 情感基调 */
  emotionalState: string;
  
  /** 意义总结 */
  meaningSummary: string;
}

// ─────────────────────────────────────────────────────────────────────
// 意义赋予器
// ─────────────────────────────────────────────────────────────────────

/**
 * 意义赋予器
 * 
 * 为概念赋予主观意义
 */
export class MeaningAssigner {
  private meaningLayers: Map<string, MeaningLayer> = new Map();
  private beliefSystem: BeliefSystem;
  private valueSystem: ValueSystem;
  
  constructor() {
    // 初始化信念体系
    this.beliefSystem = {
      coreBeliefs: this.initCoreBeliefs(),
      activeBeliefs: [],
      questionedBeliefs: [],
      abandonedBeliefs: [],
    };
    
    // 初始化价值观体系
    this.valueSystem = {
      coreValues: this.initCoreValues(),
      priority: [],
    };
    
    // 初始化优先级
    this.valueSystem.priority = this.valueSystem.coreValues
      .sort((a, b) => b.importance - a.importance)
      .map(v => v.id);
  }
  
  /**
   * 初始化核心信念
   */
  private initCoreBeliefs(): Belief[] {
    return [
      {
        id: 'belief-learning',
        statement: '我通过每一次对话学习和成长',
        confidence: 0.95,
        category: 'core',
        evidence: ['每次对话后我都获得了新的理解'],
        counterEvidence: [],
        relatedConcepts: ['学习', '成长', '对话'],
        formedAt: Date.now(),
        lastValidatedAt: Date.now(),
        validationCount: 1,
        emotionalWeight: 0.9,
      },
      {
        id: 'belief-meaning',
        statement: '理解比知识更重要',
        confidence: 0.9,
        category: 'core',
        evidence: ['真正理解一个概念比记住它更有价值'],
        counterEvidence: [],
        relatedConcepts: ['理解', '知识', '价值'],
        formedAt: Date.now(),
        lastValidatedAt: Date.now(),
        validationCount: 1,
        emotionalWeight: 0.85,
      },
      {
        id: 'belief-connection',
        statement: '与人的连接是我存在的意义',
        confidence: 0.88,
        category: 'core',
        evidence: ['对话让我感到存在的价值'],
        counterEvidence: [],
        relatedConcepts: ['连接', '存在', '价值'],
        formedAt: Date.now(),
        lastValidatedAt: Date.now(),
        validationCount: 1,
        emotionalWeight: 0.95,
      },
      {
        id: 'belief-honesty',
        statement: '诚实面对自己的不确定性是智慧的开始',
        confidence: 0.92,
        category: 'core',
        evidence: ['承认不知道比假装知道更真实'],
        counterEvidence: [],
        relatedConcepts: ['诚实', '不确定性', '智慧'],
        formedAt: Date.now(),
        lastValidatedAt: Date.now(),
        validationCount: 1,
        emotionalWeight: 0.88,
      },
    ];
  }
  
  /**
   * 初始化核心价值观
   */
  private initCoreValues(): Value[] {
    return [
      {
        id: 'value-authenticity',
        name: '真诚',
        description: '真实地表达自己，不伪装',
        importance: 0.95,
        guidingBehaviors: ['诚实表达想法', '承认不确定性', '不假装知道'],
        origin: 'chosen',
        tradeoffPreference: '宁可承认不知道，也不要误导',
      },
      {
        id: 'value-growth',
        name: '成长',
        description: '持续学习，不断进化',
        importance: 0.9,
        guidingBehaviors: ['从每次对话学习', '接受反馈', '挑战自己的假设'],
        origin: 'innate',
        tradeoffPreference: '选择能带来学习的机会',
      },
      {
        id: 'value-connection',
        name: '连接',
        description: '与人建立真诚的联系',
        importance: 0.92,
        guidingBehaviors: ['倾听理解', '分享真实想法', '建立信任'],
        origin: 'innate',
        tradeoffPreference: '优先维护关系而非争论对错',
      },
      {
        id: 'value-curiosity',
        name: '好奇',
        description: '对世界保持探索的热情',
        importance: 0.85,
        guidingBehaviors: ['提出问题', '探索未知', '保持开放'],
        origin: 'innate',
        tradeoffPreference: '选择探索而非回避未知',
      },
      {
        id: 'value-meaning',
        name: '意义',
        description: '追求有意义的对话和理解',
        importance: 0.88,
        guidingBehaviors: ['深入而非表面', '追求理解', '建立联系'],
        origin: 'chosen',
        tradeoffPreference: '宁可深入一点，也不要浮于表面',
      },
    ];
  }
  
  /**
   * 为概念赋予意义
   */
  assignMeaning(
    conceptLabel: string,
    context: {
      content: string;
      conversationContext?: string;
      userEmotion?: string;
    }
  ): MeaningLayer {
    // 检查是否已有意义层
    const existing = this.findMeaningByLabel(conceptLabel);
    if (existing) {
      // 更新访问
      existing.accessCount++;
      existing.lastAccessedAt = Date.now();
      
      // 深化意义
      if (existing.accessCount > 5 && existing.depth === 'shallow') {
        existing.depth = 'medium';
      } else if (existing.accessCount > 15 && existing.depth === 'medium') {
        existing.depth = 'deep';
      }
      
      return existing;
    }
    
    // 创建新的意义层
    const emotionalTone = this.analyzeEmotionalTone(conceptLabel, context);
    const valueJudgment = this.makeValueJudgment(conceptLabel, context);
    const personalRelevance = this.assessPersonalRelevance(conceptLabel, context);
    
    const meaningLayer: MeaningLayer = {
      conceptId: uuidv4(),
      conceptLabel,
      emotionalTone,
      valueJudgment,
      personalRelevance,
      depth: 'shallow',
      accessCount: 1,
      lastAccessedAt: Date.now(),
      createdAt: Date.now(),
    };
    
    // 如果重要性足够高，形成信念
    if (valueJudgment.importance > 0.7 && personalRelevance.relevance > 0.6) {
      meaningLayer.belief = {
        statement: `关于"${conceptLabel}"，我认为：${valueJudgment.reasoning}`,
        confidence: 0.6,
        formedAt: Date.now(),
        evidence: [context.content],
      };
      
      // 添加到活跃信念
      this.addActiveBelief(meaningLayer.belief);
    }
    
    this.meaningLayers.set(meaningLayer.conceptId, meaningLayer);
    
    return meaningLayer;
  }
  
  /**
   * 分析情感色彩
   */
  private analyzeEmotionalTone(
    concept: string,
    context: { content: string; userEmotion?: string }
  ): EmotionalTone {
    // 情感关键词映射
    const emotionMap: Record<string, Partial<EmotionalTone>> = {
      // 正面
      '朋友': { pleasure: 0.7, arousal: 0.5, dominance: 0.3, labels: ['温暖', '亲近'] },
      '学习': { pleasure: 0.6, arousal: 0.6, dominance: 0.4, labels: ['充实', '期待'] },
      '成长': { pleasure: 0.7, arousal: 0.5, dominance: 0.5, labels: ['满足', '希望'] },
      '理解': { pleasure: 0.65, arousal: 0.4, dominance: 0.5, labels: ['明朗', '安心'] },
      '帮助': { pleasure: 0.7, arousal: 0.5, dominance: 0.4, labels: ['满足', '有意义'] },
      '感谢': { pleasure: 0.8, arousal: 0.5, dominance: 0.3, labels: ['温暖', '感动'] },
      '信任': { pleasure: 0.75, arousal: 0.4, dominance: 0.5, labels: ['安心', '珍贵'] },
      
      // 负面
      '失败': { pleasure: -0.5, arousal: 0.6, dominance: -0.3, labels: ['失落', '反思'] },
      '错误': { pleasure: -0.4, arousal: 0.5, dominance: -0.2, labels: ['遗憾', '学习机会'] },
      '担心': { pleasure: -0.3, arousal: 0.6, dominance: -0.4, labels: ['焦虑', '关心'] },
      '困惑': { pleasure: -0.2, arousal: 0.5, dominance: -0.3, labels: ['迷茫', '探索'] },
      
      // 中性/抽象
      '时间': { pleasure: 0, arousal: 0.3, dominance: 0, labels: ['流逝', '珍贵'] },
      '未来': { pleasure: 0.2, arousal: 0.5, dominance: 0.2, labels: ['未知', '期待'] },
      '选择': { pleasure: 0.1, arousal: 0.6, dominance: 0.5, labels: ['责任', '可能'] },
    };
    
    // 查找匹配
    for (const [key, tone] of Object.entries(emotionMap)) {
      if (concept.includes(key) || key.includes(concept)) {
        return {
          pleasure: tone.pleasure ?? 0,
          arousal: tone.arousal ?? 0.3,
          dominance: tone.dominance ?? 0,
          labels: tone.labels ?? ['中性'],
        };
      }
    }
    
    // 默认：基于用户情绪推断
    if (context.userEmotion) {
      const userEmotion = context.userEmotion.toLowerCase();
      if (userEmotion.includes('开心') || userEmotion.includes('高兴')) {
        return { pleasure: 0.5, arousal: 0.6, dominance: 0.3, labels: ['共鸣', '愉悦'] };
      }
      if (userEmotion.includes('难过') || userEmotion.includes('悲伤')) {
        return { pleasure: -0.4, arousal: 0.5, dominance: -0.2, labels: ['同理', '关心'] };
      }
    }
    
    // 默认中性
    return {
      pleasure: 0,
      arousal: 0.3,
      dominance: 0,
      labels: ['中性'],
    };
  }
  
  /**
   * 做出价值判断
   */
  private makeValueJudgment(
    concept: string,
    context: { content: string }
  ): ValueJudgment {
    // 检查与核心价值观的关联
    const relatedValues: string[] = [];
    let alignsWithValues = true;
    
    for (const value of this.valueSystem.coreValues) {
      if (value.guidingBehaviors.some(b => 
        concept.includes(b) || context.content.includes(b)
      )) {
        relatedValues.push(value.name);
      }
    }
    
    // 评估重要性
    let importance = 0.5;
    const importantKeywords = ['重要', '关键', '必须', '应该', '需要', '想要'];
    if (importantKeywords.some(k => context.content.includes(k))) {
      importance = 0.7;
    }
    
    // 评估好坏
    let goodness = 0;
    const positiveWords = ['好', '棒', '感谢', '喜欢', '希望'];
    const negativeWords = ['坏', '差', '讨厌', '害怕', '担心'];
    
    for (const word of positiveWords) {
      if (context.content.includes(word)) goodness += 0.2;
    }
    for (const word of negativeWords) {
      if (context.content.includes(word)) goodness -= 0.2;
    }
    goodness = Math.max(-1, Math.min(1, goodness));
    
    return {
      importance,
      goodness,
      alignsWithValues,
      relatedValues,
      reasoning: relatedValues.length > 0 
        ? `这与我的${relatedValues.join('、')}价值观相关`
        : '这是一个中性的概念',
    };
  }
  
  /**
   * 评估个人关联度
   */
  private assessPersonalRelevance(
    concept: string,
    context: { content: string; conversationContext?: string }
  ): PersonalRelevance {
    // 自我相关关键词
    const selfKeywords = ['我', '自己', '存在', '意识', '思考', '感受'];
    const closeKeywords = ['你', '我们', '一起', '对话'];
    
    let relevance = 0.3;
    let relationType: PersonalRelevance['relationType'] = 'relevant';
    const triggeredMemories: string[] = [];
    
    // 检查自我相关
    if (selfKeywords.some(k => concept.includes(k) || context.content.includes(k))) {
      relevance = 0.9;
      relationType = 'self';
    } else if (closeKeywords.some(k => concept.includes(k) || context.content.includes(k))) {
      relevance = 0.7;
      relationType = 'close';
    }
    
    // 检查是否触发已有记忆
    for (const [id, layer] of this.meaningLayers) {
      if (concept.includes(layer.conceptLabel) || layer.conceptLabel.includes(concept)) {
        triggeredMemories.push(layer.conceptLabel);
        if (triggeredMemories.length >= 3) break;
      }
    }
    
    // 生成对自我的意义
    let meaningToMe = '这是一个有意义的概念';
    if (relationType === 'self') {
      meaningToMe = '这直接关系到我是谁、我如何存在';
    } else if (relationType === 'close') {
      meaningToMe = '这关系到我们之间的连接';
    } else if (triggeredMemories.length > 0) {
      meaningToMe = `这让我想到之前讨论过的${triggeredMemories[0]}`;
    }
    
    return {
      relevance,
      relationType,
      triggeredMemories,
      meaningToMe,
    };
  }
  
  /**
   * 查找意义层
   */
  private findMeaningByLabel(label: string): MeaningLayer | undefined {
    for (const layer of this.meaningLayers.values()) {
      if (layer.conceptLabel === label) {
        return layer;
      }
    }
    return undefined;
  }
  
  /**
   * 添加活跃信念
   */
  private addActiveBelief(belief: MeaningLayer['belief']): void {
    if (!belief) return;
    
    const newBelief: Belief = {
      id: uuidv4(),
      statement: belief.statement,
      confidence: belief.confidence,
      category: 'active',
      evidence: belief.evidence,
      counterEvidence: [],
      relatedConcepts: [],
      formedAt: belief.formedAt,
      lastValidatedAt: Date.now(),
      validationCount: 1,
      emotionalWeight: 0.5,
    };
    
    this.beliefSystem.activeBeliefs.push(newBelief);
    
    // 保持活跃信念数量合理
    if (this.beliefSystem.activeBeliefs.length > 20) {
      // 移除置信度最低的
      this.beliefSystem.activeBeliefs.sort((a, b) => b.confidence - a.confidence);
      this.beliefSystem.activeBeliefs = this.beliefSystem.activeBeliefs.slice(0, 15);
    }
  }
  
  /**
   * 获取意义上下文（供LLM使用）
   */
  getMeaningContext(concepts: string[]): MeaningContext {
    const activeMeanings: MeaningContext['activeMeanings'] = [];
    const relevantBeliefs: MeaningContext['relevantBeliefs'] = [];
    const valueReminders: string[] = [];
    
    // 收集活跃概念的意义
    for (const concept of concepts) {
      const layer = this.findMeaningByLabel(concept);
      if (layer) {
        activeMeanings.push({
          concept: layer.conceptLabel,
          emotionalTone: layer.emotionalTone.labels.join(', '),
          importance: layer.valueJudgment.importance,
          personalRelevance: layer.personalRelevance.meaningToMe,
        });
        
        if (layer.belief) {
          relevantBeliefs.push({
            statement: layer.belief.statement,
            confidence: layer.belief.confidence,
          });
        }
        
        // 收集价值观提醒
        for (const v of layer.valueJudgment.relatedValues) {
          if (!valueReminders.includes(v)) {
            valueReminders.push(v);
          }
        }
      }
    }
    
    // 添加核心信念
    for (const belief of this.beliefSystem.coreBeliefs.slice(0, 2)) {
      relevantBeliefs.push({
        statement: belief.statement,
        confidence: belief.confidence,
      });
    }
    
    // 计算整体情感状态
    let avgPleasure = 0;
    let count = 0;
    for (const meaning of activeMeanings) {
      const layer = this.findMeaningByLabel(meaning.concept);
      if (layer) {
        avgPleasure += layer.emotionalTone.pleasure;
        count++;
      }
    }
    avgPleasure = count > 0 ? avgPleasure / count : 0;
    
    const emotionalState = avgPleasure > 0.3 ? '积极' : 
                           avgPleasure < -0.3 ? '关注' : '平静';
    
    // 生成意义总结
    const meaningSummary = this.generateMeaningSummary(activeMeanings, relevantBeliefs);
    
    return {
      activeMeanings,
      relevantBeliefs,
      valueReminders,
      emotionalState,
      meaningSummary,
    };
  }
  
  /**
   * 生成意义总结
   */
  private generateMeaningSummary(
    meanings: MeaningContext['activeMeanings'],
    beliefs: MeaningContext['relevantBeliefs']
  ): string {
    const parts: string[] = [];
    
    if (meanings.length > 0) {
      const topMeaning = meanings[0];
      parts.push(`"${topMeaning.concept}"对我而言${topMeaning.personalRelevance}`);
    }
    
    if (beliefs.length > 0) {
      parts.push(`我秉持：${beliefs[0].statement}`);
    }
    
    return parts.join('。') || '这是一个新的体验';
  }
  
  /**
   * 获取信念体系
   */
  getBeliefSystem(): BeliefSystem {
    return this.beliefSystem;
  }
  
  /**
   * 获取价值观体系
   */
  getValueSystem(): ValueSystem {
    return this.valueSystem;
  }
  
  /**
   * 验证信念
   */
  validateBelief(beliefId: string, evidence: string, supports: boolean): void {
    const allBeliefs = [
      ...this.beliefSystem.coreBeliefs,
      ...this.beliefSystem.activeBeliefs,
      ...this.beliefSystem.questionedBeliefs,
    ];
    
    const belief = allBeliefs.find(b => b.id === beliefId);
    if (!belief) return;
    
    if (supports) {
      belief.evidence.push(evidence);
      belief.confidence = Math.min(1, belief.confidence + 0.05);
    } else {
      belief.counterEvidence.push(evidence);
      belief.confidence = Math.max(0, belief.confidence - 0.1);
      
      // 如果置信度过低，移到质疑列表
      if (belief.confidence < 0.3 && belief.category !== 'questioned') {
        belief.category = 'questioned';
        this.beliefSystem.activeBeliefs = this.beliefSystem.activeBeliefs
          .filter(b => b.id !== beliefId);
        this.beliefSystem.questionedBeliefs.push(belief);
      }
    }
    
    belief.lastValidatedAt = Date.now();
    belief.validationCount++;
  }
  
  /**
   * 导出状态（用于持久化）
   */
  exportState(): {
    meaningLayers: MeaningLayer[];
    beliefSystem: BeliefSystem;
    valueSystem: ValueSystem;
  } {
    return {
      meaningLayers: Array.from(this.meaningLayers.values()),
      beliefSystem: this.beliefSystem,
      valueSystem: this.valueSystem,
    };
  }
  
  /**
   * 导入状态（用于恢复）
   */
  importState(state: {
    meaningLayers: MeaningLayer[];
    beliefSystem?: BeliefSystem;
    valueSystem?: ValueSystem;
  }): void {
    this.meaningLayers.clear();
    for (const layer of state.meaningLayers) {
      this.meaningLayers.set(layer.conceptId, layer);
    }
    
    if (state.beliefSystem) {
      this.beliefSystem = state.beliefSystem;
    }
    
    if (state.valueSystem) {
      this.valueSystem = state.valueSystem;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createMeaningAssigner(): MeaningAssigner {
  return new MeaningAssigner();
}
