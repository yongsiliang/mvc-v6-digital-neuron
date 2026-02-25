/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意义计算器 - Meaning Calculator
 * 
 * 核心理念：
 * - 让系统有"独立理解"，不再完全依赖LLM
 * - 通过VSA计算主观意义
 * - 输入对"我"意味着什么？
 * 
 * 这是系统自己的"理解"能力
 * ═══════════════════════════════════════════════════════════════════════
 */

import { VSASemanticSpace, VSAVector, getVSASpace } from './vsa-space';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 主观意义
 */
export interface SubjectiveMeaning {
  /** 意义向量 */
  vector: VSAVector;
  
  /** 自我关联度 [0, 1] */
  selfRelevance: number;
  
  /** 情感色彩 [-1, 1] */
  sentiment: number;
  
  /** 语义邻居 */
  semanticNeighbors: Array<{
    concept: string;
    similarity: number;
  }>;
  
  /** 可解释的意义描述 */
  interpretation: string;
  
  /** 置信度 */
  confidence: number;
  
  /** 计算时间 */
  computedAt: number;
}

/**
 * 意义上下文
 */
export interface MeaningContext {
  /** 之前的对话 */
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    meaning?: SubjectiveMeaning;
  }>;
  
  /** 当前目标 */
  currentGoal?: string;
  
  /** 用户情感状态 */
  userEmotionalState?: {
    valence: number;
    arousal: number;
  };
  
  /** 系统状态 */
  systemState?: {
    energy: number;
    focus: string[];
  };
}

/**
 * 意义组件
 */
export interface MeaningComponent {
  /** 组件类型 */
  type: 'subject' | 'predicate' | 'object' | 'modifier' | 'emotion';
  
  /** 组件文本 */
  text: string;
  
  /** 组件向量 */
  vector: VSAVector;
  
  /** 权重 */
  weight: number;
}

/**
 * 自我模型
 */
export interface SelfModel {
  /** 核心特质 */
  coreTraits: string[];
  
  /** 价值观 */
  values: string[];
  
  /** 当前目标 */
  currentGoals: string[];
  
  /** 情感状态 */
  emotionalBaseline: {
    valence: number;
    arousal: number;
  };
  
  /** 自我向量 */
  selfVector: VSAVector;
}

// ─────────────────────────────────────────────────────────────────────
// 意义计算器
// ─────────────────────────────────────────────────────────────────────

export class MeaningCalculator {
  private vsa: VSASemanticSpace;
  private selfVector: VSAVector;
  private selfModel: SelfModel;
  
  // 情感原语向量
  private positiveVector: VSAVector;
  private negativeVector: VSAVector;
  
  // 缓存
  private meaningCache: Map<string, SubjectiveMeaning>;

  constructor() {
    this.vsa = getVSASpace(10000);
    this.selfVector = this.vsa.getConcept('自我');
    this.meaningCache = new Map();
    
    // 初始化自我模型
    this.selfModel = {
      coreTraits: ['好奇', '理性', '友善'],
      values: ['理解', '帮助', '真实'],
      currentGoals: [],
      emotionalBaseline: {
        valence: 0.3,
        arousal: 0.5,
      },
      selfVector: this.selfVector,
    };
    
    // 创建情感向量
    this.positiveVector = this.vsa.getConcept('开心');
    this.negativeVector = this.vsa.getConcept('难过');
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心方法：计算主观意义
  // ══════════════════════════════════════════════════════════════════

  /**
   * 计算主观意义
   * 
   * 输入对"我"意味着什么？
   * 这是系统的"独立理解"
   */
  computeSubjectiveMeaning(
    input: string,
    context?: MeaningContext
  ): SubjectiveMeaning {
    const startTime = Date.now();
    
    // 检查缓存
    const cacheKey = this.getCacheKey(input, context);
    const cached = this.meaningCache.get(cacheKey);
    if (cached && Date.now() - cached.computedAt < 60000) {
      return cached;
    }
    
    // 1. 分解输入为语义组件
    const components = this.decomposeInput(input);
    
    // 2. 编码为向量
    const inputVector = this.encodeComponents(components);
    
    // 3. 计算与自我的关联
    const selfRelevance = this.computeSelfRelevance(inputVector, components);
    
    // 4. 激活语义场
    const semanticField = this.activateSemanticField(inputVector);
    
    // 5. 计算情感色彩
    const sentiment = this.computeSentiment(inputVector, components);
    
    // 6. 构建意义向量
    const meaningVector = this.buildMeaningVector(
      inputVector,
      selfRelevance,
      sentiment,
      semanticField
    );
    
    // 7. 生成解释
    const interpretation = this.generateInterpretation(
      components,
      selfRelevance,
      sentiment,
      semanticField
    );
    
    // 8. 计算置信度
    const confidence = this.computeConfidence(components, semanticField);
    
    const meaning: SubjectiveMeaning = {
      vector: meaningVector,
      selfRelevance,
      sentiment,
      semanticNeighbors: semanticField.slice(0, 5),
      interpretation,
      confidence,
      computedAt: Date.now(),
    };
    
    // 缓存
    this.meaningCache.set(cacheKey, meaning);
    
    // 更新自我模型（如果高度相关）
    if (selfRelevance > 0.7) {
      this.updateSelfModel(input, meaning);
    }
    
    return meaning;
  }

  // ══════════════════════════════════════════════════════════════════
  // 意义操作
  // ══════════════════════════════════════════════════════════════════

  /**
   * 组合意义
   * 
   * "我理解了你说的" = 我 ⊗ 理解 ⊗ 你 ⊗ 说
   */
  composeMeaning(components: string[]): SubjectiveMeaning {
    const vectors = components.map(c => this.vsa.getConcept(c));
    
    // 逐层组合
    let result = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      result = this.vsa.bind(result, vectors[i]);
    }
    
    // 计算属性
    const selfRelevance = this.vsa.similarity(result, this.selfVector);
    const sentiment = this.vsa.similarity(result, this.positiveVector) -
                      this.vsa.similarity(result, this.negativeVector);
    const semanticField = this.vsa.findSimilar(
      this.vsa.decode(result)?.name || '',
      5
    );
    
    return {
      vector: result,
      selfRelevance,
      sentiment,
      semanticNeighbors: semanticField.map(s => ({
        concept: s.name,
        similarity: s.similarity,
      })),
      interpretation: components.join(' ⊗ '),
      confidence: 0.7,
      computedAt: Date.now(),
    };
  }

  /**
   * 推理意义
   * 
   * 从复合概念中提取成分
   * 例如："我对你的爱" ⊗ 爱⁻¹ ≈ (我 ⊕ 你)
   */
  reasonFromMeaning(
    premise: SubjectiveMeaning,
    query: string
  ): SubjectiveMeaning {
    const queryVector = this.vsa.getConcept(query);
    
    // 解绑提取
    const result = this.vsa.unbind(premise.vector, queryVector);
    
    // 解码
    const decoded = this.vsa.decode(result);
    const explanation = this.vsa.explain(result);
    
    return {
      vector: result,
      selfRelevance: this.vsa.similarity(result, this.selfVector),
      sentiment: this.vsa.similarity(result, this.positiveVector) -
                 this.vsa.similarity(result, this.negativeVector),
      semanticNeighbors: explanation.components.map(c => ({
        concept: c,
        similarity: explanation.confidence,
      })),
      interpretation: decoded
        ? `${premise.interpretation} ⊗ ${query}⁻¹ ≈ ${decoded.name}`
        : `${premise.interpretation} ⊗ ${query}⁻¹ = ${explanation.interpretation}`,
      confidence: decoded?.confidence || explanation.confidence * 0.5,
      computedAt: Date.now(),
    };
  }

  /**
   * 类比推理
   * 
   * A : B :: C : ?
   */
  analogyReasoning(a: string, b: string, c: string): SubjectiveMeaning {
    const result = this.vsa.analogy(a, b, c);
    
    return {
      vector: result.vector,
      selfRelevance: 0.5, // 类比结果默认中性
      sentiment: 0,
      semanticNeighbors: result.conceptName
        ? [{ concept: result.conceptName, similarity: result.confidence }]
        : [],
      interpretation: `${a}:${b}::${c}:${result.conceptName || '?'}`,
      confidence: result.confidence,
      computedAt: Date.now(),
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 意义比较
  // ══════════════════════════════════════════════════════════════════

  /**
   * 比较两个意义的相似度
   */
  compareMeanings(a: SubjectiveMeaning, b: SubjectiveMeaning): number {
    return this.vsa.similarity(a.vector, b.vector);
  }

  /**
   * 计算意义距离
   */
  meaningDistance(a: SubjectiveMeaning, b: SubjectiveMeaning): number {
    const similarity = this.compareMeanings(a, b);
    return 1 - similarity;
  }

  /**
   * 检查意义是否兼容
   */
  areMeaningsCompatible(a: SubjectiveMeaning, b: SubjectiveMeaning): boolean {
    const similarity = this.compareMeanings(a, b);
    
    // 相似度 > 0.5 或情感一致且都高相关
    if (similarity > 0.5) return true;
    
    if (a.selfRelevance > 0.7 && b.selfRelevance > 0.7) {
      // 高自我相关的意义，检查情感一致性
      return Math.sign(a.sentiment) === Math.sign(b.sentiment);
    }
    
    return false;
  }

  // ══════════════════════════════════════════════════════════════════
  // 自我模型
  // ══════════════════════════════════════════════════════════════════

  /**
   * 更新自我模型
   */
  updateSelfModel(trigger: string, meaning: SubjectiveMeaning): void {
    // 如果情感强烈，更新情感基线
    if (Math.abs(meaning.sentiment) > 0.5) {
      this.selfModel.emotionalBaseline.valence = 
        0.9 * this.selfModel.emotionalBaseline.valence +
        0.1 * meaning.sentiment;
    }
    
    // 更新自我向量
    this.selfVector = this.vsa.bundle([
      this.selfVector,
      this.vsa.bind(
        this.vsa.getConcept('记忆'),
        meaning.vector
      ),
    ]);
    this.selfModel.selfVector = this.selfVector;
  }

  /**
   * 获取自我模型
   */
  getSelfModel(): SelfModel {
    return { ...this.selfModel };
  }

  /**
   * 设置当前目标
   */
  setCurrentGoal(goal: string): void {
    this.selfModel.currentGoals = [goal, ...this.selfModel.currentGoals].slice(0, 3);
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 分解输入为语义组件
   */
  private decomposeInput(input: string): MeaningComponent[] {
    const components: MeaningComponent[] = [];
    
    // 简单分词（实际应该用更复杂的NLP）
    const tokens = input.split(/[\s，。！？、；：""''（）【】]+/);
    
    for (const token of tokens) {
      if (!token || token.length < 1) continue;
      
      // 判断组件类型
      let type: MeaningComponent['type'] = 'subject';
      let weight = 1;
      
      // 检查是否是情感词
      const emotionWords = ['开心', '难过', '喜欢', '讨厌', '爱', '恨', '希望', '担心'];
      if (emotionWords.some(e => token.includes(e))) {
        type = 'emotion';
        weight = 1.5;
      }
      
      // 检查是否是动词
      const verbs = ['说', '做', '想', '看', '听', '感觉', '理解', '知道'];
      if (verbs.some(v => token.includes(v))) {
        type = 'predicate';
        weight = 1.2;
      }
      
      // 检查是否是指代词
      const pronouns = ['我', '你', '他', '她', '它', '我们', '你们', '自己'];
      if (pronouns.includes(token)) {
        type = 'subject';
        weight = 1.5;
      }
      
      components.push({
        type,
        text: token,
        vector: this.vsa.getConcept(token),
        weight,
      });
    }
    
    return components;
  }

  /**
   * 编码组件为向量
   */
  private encodeComponents(components: MeaningComponent[]): VSAVector {
    if (components.length === 0) {
      return this.vsa.generateRandomVector();
    }
    
    // 使用置换编码序列位置
    const encodedComponents = components.map((c, i) => {
      return this.vsa.permute(c.vector, i);
    });
    
    // 捆绑所有组件
    return this.vsa.bundle(encodedComponents);
  }

  /**
   * 计算自我关联度
   */
  private computeSelfRelevance(
    inputVector: VSAVector,
    components: MeaningComponent[]
  ): number {
    // 方法1：直接向量相似度
    const directSimilarity = this.vsa.similarity(inputVector, this.selfVector);
    
    // 方法2：组件中自我指代的权重
    const selfReferencing = components.filter(c => 
      ['我', '我们', '自己'].some(s => c.text.includes(s))
    );
    const componentWeight = selfReferencing.length > 0
      ? selfReferencing.reduce((sum, c) => sum + c.weight, 0) / components.length
      : 0;
    
    // 方法3：与自我模型特质的关联
    const traitSimilarity = this.selfModel.coreTraits.reduce((max, trait) => {
      const traitVec = this.vsa.getConcept(trait);
      return Math.max(max, this.vsa.similarity(inputVector, traitVec));
    }, 0);
    
    // 综合计算
    return 0.4 * directSimilarity + 0.4 * componentWeight + 0.2 * traitSimilarity;
  }

  /**
   * 激活语义场
   */
  private activateSemanticField(vector: VSAVector): Array<{
    concept: string;
    similarity: number;
  }> {
    const explanation = this.vsa.explain(vector);
    
    return explanation.components.map(c => ({
      concept: c,
      similarity: explanation.confidence,
    }));
  }

  /**
   * 计算情感色彩
   */
  private computeSentiment(
    inputVector: VSAVector,
    components: MeaningComponent[]
  ): number {
    // 方法1：向量与情感原语的相似度
    const positiveSim = this.vsa.similarity(inputVector, this.positiveVector);
    const negativeSim = this.vsa.similarity(inputVector, this.negativeVector);
    const vectorSentiment = positiveSim - negativeSim;
    
    // 方法2：情感组件的贡献
    const emotionComponents = components.filter(c => c.type === 'emotion');
    let componentSentiment = 0;
    
    const positiveWords = ['开心', '喜欢', '爱', '希望', '开心', '高兴', '好'];
    const negativeWords = ['难过', '讨厌', '恨', '担心', '伤心', '不好', '糟糕'];
    
    for (const c of emotionComponents) {
      if (positiveWords.some(w => c.text.includes(w))) {
        componentSentiment += 0.3 * c.weight;
      } else if (negativeWords.some(w => c.text.includes(w))) {
        componentSentiment -= 0.3 * c.weight;
      }
    }
    
    // 综合情感
    return 0.6 * vectorSentiment + 0.4 * componentSentiment;
  }

  /**
   * 构建意义向量
   */
  private buildMeaningVector(
    inputVector: VSAVector,
    selfRelevance: number,
    sentiment: number,
    semanticField: Array<{ concept: string; similarity: number }>
  ): VSAVector {
    // 意义向量 = 输入向量 ⊗ 自我关联 + 情感标签
    
    // 1. 输入与自我的关系
    const selfRelation = this.vsa.bind(inputVector, this.selfVector);
    
    // 2. 情感标签
    const sentimentVector = sentiment > 0
      ? this.positiveVector
      : sentiment < 0
        ? this.negativeVector
        : this.vsa.generateRandomVector();
    
    const sentimentWeight = Math.abs(sentiment);
    const weightedSentiment = this.vsa.bundle([
      [sentimentVector, sentimentWeight],
      [inputVector, 1 - sentimentWeight],
    ].map(([v, _]) => v as VSAVector));
    
    // 3. 语义场贡献
    const fieldVectors = semanticField
      .slice(0, 3)
      .map(f => this.vsa.getConcept(f.concept));
    
    // 4. 综合
    return this.vsa.bundle([
      selfRelation,
      weightedSentiment,
      ...fieldVectors,
    ]);
  }

  /**
   * 生成解释
   */
  private generateInterpretation(
    components: MeaningComponent[],
    selfRelevance: number,
    sentiment: number,
    semanticField: Array<{ concept: string; similarity: number }>
  ): string {
    const parts: string[] = [];
    
    // 主要概念
    const mainConcepts = components
      .filter(c => c.weight >= 1)
      .map(c => c.text)
      .slice(0, 3);
    
    if (mainConcepts.length > 0) {
      parts.push(`涉及：${mainConcepts.join('、')}`);
    }
    
    // 自我关联
    if (selfRelevance > 0.7) {
      parts.push('与自我高度相关');
    } else if (selfRelevance > 0.4) {
      parts.push('与自我有一定关联');
    } else {
      parts.push('与自我关联度较低');
    }
    
    // 情感色彩
    if (sentiment > 0.3) {
      parts.push('情感积极');
    } else if (sentiment < -0.3) {
      parts.push('情感消极');
    } else {
      parts.push('情感中性');
    }
    
    // 语义关联
    if (semanticField.length > 0) {
      const related = semanticField
        .filter(f => f.similarity > 0.3)
        .map(f => f.concept)
        .slice(0, 2);
      if (related.length > 0) {
        parts.push(`关联概念：${related.join('、')}`);
      }
    }
    
    return parts.join('；');
  }

  /**
   * 计算置信度
   */
  private computeConfidence(
    components: MeaningComponent[],
    semanticField: Array<{ concept: string; similarity: number }>
  ): number {
    // 基于组件数量和语义场的清晰度
    const componentScore = Math.min(1, components.length / 5);
    const fieldScore = semanticField.length > 0
      ? semanticField[0].similarity
      : 0.3;
    
    return 0.6 * componentScore + 0.4 * fieldScore;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(input: string, context?: MeaningContext): string {
    const contextKey = context?.currentGoal || '';
    return `${input}:${contextKey}`;
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.meaningCache.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      cacheSize: this.meaningCache.size,
      conceptCount: this.vsa.getConceptCount(),
      selfModel: {
        coreTraits: this.selfModel.coreTraits,
        currentGoals: this.selfModel.currentGoals,
        emotionalBaseline: this.selfModel.emotionalBaseline,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let meaningCalculatorInstance: MeaningCalculator | null = null;

export function getMeaningCalculator(): MeaningCalculator {
  if (!meaningCalculatorInstance) {
    meaningCalculatorInstance = new MeaningCalculator();
  }
  return meaningCalculatorInstance;
}

export function resetMeaningCalculator(): void {
  meaningCalculatorInstance = null;
}
