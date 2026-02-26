/**
 * ═══════════════════════════════════════════════════════════════════════
 * VSA 高级推理器 - Advanced VSA Reasoning Engine
 * 
 * 基于向量符号架构的高级语义推理能力
 * 
 * 核心能力：
 * 1. 类比推理 - A:B :: C:?
 * 2. 语义组合 - 复杂概念的组合表示
 * 3. 关系推理 - 多跳关系推导
 * 4. 概念泛化 - 从示例中学习概念
 * 5. 语义消歧 - 上下文消歧
 * ═══════════════════════════════════════════════════════════════════════
 */

import { VSASemanticSpace, VSAVector, ConceptEntry, getVSASpace } from './vsa-space';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 类比推理结果
 */
export interface AnalogyResult {
  /** 类比答案向量 */
  answerVector: VSAVector;
  
  /** 最可能的概念 */
  bestMatch: string;
  
  /** 候选列表 */
  candidates: Array<{
    concept: string;
    similarity: number;
  }>;
  
  /** 推理路径 */
  reasoningPath: string[];
  
  /** 置信度 */
  confidence: number;
}

/**
 * 关系推理结果
 */
export interface RelationReasoningResult {
  /** 起始概念 */
  from: string;
  
  /** 目标概念 */
  to: string;
  
  /** 推理路径 */
  path: Array<{
    concept: string;
    relation: string;
    strength: number;
  }>;
  
  /** 综合关系 */
  overallRelation: string;
  
  /** 置信度 */
  confidence: number;
}

/**
 * 概念组合结果
 */
export interface CompositionResult {
  /** 组合向量 */
  vector: VSAVector;
  
  /** 组合解释 */
  interpretation: string;
  
  /** 组成成分 */
  components: Array<{
    concept: string;
    role: string;
    weight: number;
  }>;
  
  /** 语义邻居 */
  neighbors: Array<{
    concept: string;
    similarity: number;
  }>;
}

/**
 * 消歧结果
 */
export interface DisambiguationResult {
  /** 消歧后的概念 */
  disambiguated: string;
  
  /** 消歧后的向量 */
  vector: VSAVector;
  
  /** 可能的含义 */
  meanings: Array<{
    meaning: string;
    probability: number;
    context: string[];
  }>;
  
  /** 使用的上下文线索 */
  contextClues: string[];
}

/**
 * 推理规则
 */
export interface ReasoningRule {
  /** 规则名称 */
  name: string;
  
  /** 规则描述 */
  description: string;
  
  /** 规则模式 */
  pattern: {
    /** 前提条件 */
    premises: string[];
    /** 结论 */
    conclusion: string;
  };
  
  /** 规则强度 */
  strength: number;
}

// ─────────────────────────────────────────────────────────────────────
// 高级推理器
// ─────────────────────────────────────────────────────────────────────

/**
 * VSA 高级推理器
 */
export class VSAAdvancedReasoner {
  private vsaSpace: VSASemanticSpace;
  private rules: ReasoningRule[] = [];
  private inferenceCache: Map<string, VSAVector> = new Map();
  
  // 预定义的关系向量
  private relationVectors: Map<string, VSAVector> = new Map();

  constructor(dimension: number = 10000) {
    this.vsaSpace = getVSASpace(dimension);
    this.initializeRules();
    this.initializeRelationVectors();
  }

  // ══════════════════════════════════════════════════════════════════
  // 类比推理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 类比推理：A:B :: C:?
   * 
   * 例如：国王:王后 :: 男人:?
   * 推理：王后 = 国王 ⊗ 性别关系 + 女性
   *       ? = 男人 ⊗ 性别关系 + 女性 = 女人
   */
  async analogicalReasoning(
    a: string,
    b: string,
    c: string,
    options: {
      maxCandidates?: number;
      minConfidence?: number;
    } = {}
  ): Promise<AnalogyResult> {
    const { maxCandidates = 5, minConfidence = 0.3 } = options;
    
    // 获取概念向量
    const vecA = this.getConceptVector(a);
    const vecB = this.getConceptVector(b);
    const vecC = this.getConceptVector(c);
    
    if (!vecA || !vecB || !vecC) {
      return {
        answerVector: [],
        bestMatch: '',
        candidates: [],
        reasoningPath: [],
        confidence: 0,
      };
    }
    
    // 计算关系向量：R = B ⊗ A⁻¹
    const relationVector = this.vsaSpace.bind(vecB, this.inverse(vecA));
    
    // 应用关系：D = C ⊗ R
    const answerVector = this.vsaSpace.bind(vecC, relationVector);
    
    // 在概念空间中搜索最匹配的概念
    const candidates = this.findNearestConcepts(answerVector, maxCandidates);
    
    // 构建推理路径
    const reasoningPath = [
      `${a} : ${b}`,
      `${c} : ?`,
      `关系提取: ${b} - ${a} → [关系向量]`,
      `应用关系: ${c} + [关系向量] → ${candidates[0]?.concept ?? '?'}`,
    ];
    
    return {
      answerVector,
      bestMatch: candidates[0]?.concept ?? '',
      candidates: candidates.filter(c => c.similarity >= minConfidence),
      reasoningPath,
      confidence: candidates[0]?.similarity ?? 0,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 关系推理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 多跳关系推理
   * 
   * 例如：从"猫"到"老虎"的关系
   * 猫 → (是) → 哺乳动物 → (是) → 动物 → (包括) → 老虎
   */
  async reasonRelation(
    from: string,
    to: string,
    options: {
      maxHops?: number;
      minStrength?: number;
    } = {}
  ): Promise<RelationReasoningResult> {
    const { maxHops = 3, minStrength = 0.2 } = options;
    
    // 获取概念向量
    const vecFrom = this.getConceptVector(from);
    const vecTo = this.getConceptVector(to);
    
    if (!vecFrom || !vecTo) {
      return {
        from,
        to,
        path: [],
        overallRelation: 'unknown',
        confidence: 0,
      };
    }
    
    // 计算直接相似度
    const directSimilarity = this.vsaSpace.similarity(vecFrom, vecTo);
    
    // 如果高度相似，直接返回
    if (directSimilarity > 0.8) {
      return {
        from,
        to,
        path: [{
          concept: to,
          relation: 'similar',
          strength: directSimilarity,
        }],
        overallRelation: 'similar',
        confidence: directSimilarity,
      };
    }
    
    // 多跳推理
    const path = this.findReasoningPath(from, to, maxHops, minStrength);
    
    // 综合关系描述
    const overallRelation = this.describeOverallRelation(path);
    
    return {
      from,
      to,
      path,
      overallRelation,
      confidence: path.length > 0 ? path[path.length - 1].strength : 0,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 概念组合
  // ══════════════════════════════════════════════════════════════════

  /**
   * 概念组合推理
   * 
   * 将多个概念组合成复杂概念
   * 例如：红色 + 苹果 = 红苹果
   */
  async composeConcepts(
    concepts: Array<{
      concept: string;
      role?: string;
      weight?: number;
    }>
  ): Promise<CompositionResult> {
    const components = concepts.map(c => ({
      concept: c.concept,
      role: c.role ?? 'component',
      weight: c.weight ?? 1,
    }));
    
    // 获取所有概念向量
    const vectors: Array<{ vector: VSAVector; weight: number }> = [];
    
    for (const comp of components) {
      const vec = this.getConceptVector(comp.concept);
      if (vec) {
        vectors.push({ vector: vec, weight: comp.weight });
      }
    }
    
    if (vectors.length === 0) {
      return {
        vector: [],
        interpretation: '无法组合：没有有效的概念',
        components: [],
        neighbors: [],
      };
    }
    
    // 加权捆绑
    const composedVector = this.weightedBundle(vectors);
    
    // 查找语义邻居
    const neighbors = this.findNearestConcepts(composedVector, 5);
    
    // 生成解释
    const interpretation = this.interpretComposition(components, neighbors);
    
    return {
      vector: composedVector,
      interpretation,
      components,
      neighbors,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 语义消歧
  // ══════════════════════════════════════════════════════════════════

  /**
   * 上下文消歧
   * 
   * 根据上下文确定多义词的具体含义
   * 例如："银行" 在 "我去银行存钱" 中 = 金融机构
   */
  async disambiguate(
    word: string,
    context: string[],
    options: {
      possibleMeanings?: string[];
    } = {}
  ): Promise<DisambiguationResult> {
    // 获取上下文向量
    const contextVectors = context
      .map(c => this.getConceptVector(c))
      .filter((v): v is VSAVector => v !== null);
    
    if (contextVectors.length === 0) {
      return {
        disambiguated: word,
        vector: this.getConceptVector(word) ?? [],
        meanings: [{ meaning: word, probability: 1, context: [] }],
        contextClues: [],
      };
    }
    
    // 计算上下文聚合向量
    const contextVector = this.vsaSpace.bundle(contextVectors);
    
    // 获取可能的含义
    const meanings = options.possibleMeanings ?? this.inferPossibleMeanings(word);
    
    // 计算每种含义与上下文的匹配度
    const meaningScores: Array<{
      meaning: string;
      probability: number;
      context: string[];
    }> = [];
    
    for (const meaning of meanings) {
      const meaningVec = this.getConceptVector(meaning);
      if (meaningVec) {
        const similarity = this.vsaSpace.similarity(meaningVec, contextVector);
        meaningScores.push({
          meaning,
          probability: similarity,
          context: this.findRelevantContext(meaning, context),
        });
      }
    }
    
    // 排序并归一化
    meaningScores.sort((a, b) => b.probability - a.probability);
    const total = meaningScores.reduce((sum, m) => sum + m.probability, 0);
    meaningScores.forEach(m => m.probability /= (total + 0.001));
    
    // 选择最佳含义
    const best = meaningScores[0];
    
    return {
      disambiguated: best?.meaning ?? word,
      vector: this.getConceptVector(best?.meaning ?? word) ?? [],
      meanings: meaningScores,
      contextClues: best?.context ?? [],
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 概念泛化
  // ══════════════════════════════════════════════════════════════════

  /**
   * 从示例中学习概念
   * 
   * 例如：从 [苹果, 香蕉, 橘子] 学习 "水果" 概念
   */
  async generalizeFromExamples(
    examples: string[],
    options: {
      generalizeToConcept?: string;
    } = {}
  ): Promise<{
    generalizedVector: VSAVector;
    generalizedConcept: string;
    coverage: number;
    examples: string[];
  }> {
    // 获取示例向量
    const exampleVectors = examples
      .map(e => this.getConceptVector(e))
      .filter((v): v is VSAVector => v !== null);
    
    if (exampleVectors.length === 0) {
      return {
        generalizedVector: [],
        generalizedConcept: '',
        coverage: 0,
        examples,
      };
    }
    
    // 捆绑所有示例
    const generalizedVector = this.vsaSpace.bundle(exampleVectors);
    
    // 查找最匹配的概念
    const nearestConcepts = this.findNearestConcepts(generalizedVector, 3);
    const generalizedConcept = options.generalizeToConcept ?? nearestConcepts[0]?.concept ?? '';
    
    // 计算覆盖率
    let coverage = 0;
    for (const vec of exampleVectors) {
      coverage += this.vsaSpace.similarity(vec, generalizedVector);
    }
    coverage /= exampleVectors.length;
    
    return {
      generalizedVector,
      generalizedConcept,
      coverage,
      examples,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════

  private getConceptVector(concept: string): VSAVector | null {
    const vector = this.vsaSpace.getConcept(concept);
    return vector ?? null;
  }

  private inverse(vector: VSAVector): VSAVector {
    // VSA 中逆通常通过反向排列实现
    const dim = vector.length;
    const result = new Array(dim);
    for (let i = 0; i < dim; i++) {
      result[dim - 1 - i] = vector[i];
    }
    return result;
  }

  private weightedBundle(
    vectors: Array<{ vector: VSAVector; weight: number }>
  ): VSAVector {
    const dim = vectors[0]?.vector.length ?? 0;
    if (dim === 0) return [];
    
    const result = new Array(dim).fill(0);
    
    for (const { vector, weight } of vectors) {
      for (let i = 0; i < dim; i++) {
        result[i] += vector[i] * weight;
      }
    }
    
    // 归一化：取符号
    return result.map(v => Math.sign(v));
  }

  private findNearestConcepts(
    vector: VSAVector,
    maxCount: number
  ): Array<{ concept: string; similarity: number }> {
    const candidates: Array<{ concept: string; similarity: number }> = [];
    
    // 遍历所有概念计算相似度
    for (const [name, entry] of this.vsaSpace.getAllConcepts()) {
      const similarity = this.vsaSpace.similarity(vector, entry.vector);
      candidates.push({ concept: name, similarity });
    }
    
    // 排序并返回前 N 个
    candidates.sort((a, b) => b.similarity - a.similarity);
    return candidates.slice(0, maxCount);
  }

  private findReasoningPath(
    from: string,
    to: string,
    maxHops: number,
    minStrength: number
  ): Array<{ concept: string; relation: string; strength: number }> {
    // 简化实现：使用概念相似度进行推理
    const vecFrom = this.getConceptVector(from);
    const vecTo = this.getConceptVector(to);
    
    if (!vecFrom || !vecTo) return [];
    
    const path: Array<{ concept: string; relation: string; strength: number }> = [];
    
    // 查找中间概念
    const combined = this.vsaSpace.bundle([vecFrom, vecTo]);
    const intermediates = this.findNearestConcepts(combined, 5)
      .filter(c => c.concept !== from && c.concept !== to);
    
    if (intermediates.length > 0) {
      const mid = intermediates[0];
      path.push({
        concept: mid.concept,
        relation: 'related_to',
        strength: mid.similarity,
      });
    }
    
    path.push({
      concept: to,
      relation: 'target',
      strength: this.vsaSpace.similarity(vecFrom, vecTo),
    });
    
    return path;
  }

  private describeOverallRelation(
    path: Array<{ concept: string; relation: string; strength: number }>
  ): string {
    if (path.length === 0) return 'unknown';
    if (path.length === 1) {
      return path[0].relation === 'similar' ? 'similar' : 'related';
    }
    return `indirectly_related_via_${path[0].concept}`;
  }

  private interpretComposition(
    components: Array<{ concept: string; role: string; weight: number }>,
    neighbors: Array<{ concept: string; similarity: number }>
  ): string {
    const conceptNames = components.map(c => c.concept).join(' + ');
    const nearest = neighbors[0];
    
    if (nearest && nearest.similarity > 0.7) {
      return `${conceptNames} ≈ ${nearest.concept}`;
    }
    
    return `组合概念: [${conceptNames}]`;
  }

  private inferPossibleMeanings(word: string): string[] {
    // 简化实现：返回常见的多义词处理
    // 实际应用中可以使用词典或上下文推理
    const polysemyMap: Record<string, string[]> = {
      '银行': ['金融机构', '河岸'],
      '苹果': ['水果', '科技公司'],
      '鼠标': ['电脑设备', '动物'],
      '打': ['击打', '购买', '计算'],
    };
    
    return polysemyMap[word] ?? [word];
  }

  private findRelevantContext(meaning: string, context: string[]): string[] {
    // 返回与含义最相关的上下文词
    const meaningVec = this.getConceptVector(meaning);
    if (!meaningVec) return [];
    
    const relevant: Array<{ word: string; score: number }> = [];
    
    for (const word of context) {
      const wordVec = this.getConceptVector(word);
      if (wordVec) {
        const score = this.vsaSpace.similarity(meaningVec, wordVec);
        relevant.push({ word, score });
      }
    }
    
    relevant.sort((a, b) => b.score - a.score);
    return relevant.slice(0, 3).map(r => r.word);
  }

  private initializeRules(): void {
    this.rules = [
      {
        name: 'transitivity',
        description: 'A → B, B → C ⟹ A → C',
        pattern: {
          premises: ['A → B', 'B → C'],
          conclusion: 'A → C',
        },
        strength: 0.8,
      },
      {
        name: 'symmetry',
        description: 'A ↔ B ⟹ B ↔ A',
        pattern: {
          premises: ['A ↔ B'],
          conclusion: 'B ↔ A',
        },
        strength: 0.9,
      },
      {
        name: 'inheritance',
        description: 'A is B, B has P ⟹ A has P',
        pattern: {
          premises: ['A is B', 'B has P'],
          conclusion: 'A has P',
        },
        strength: 0.7,
      },
    ];
  }

  private initializeRelationVectors(): void {
    // 预定义常见关系向量
    const relations = ['is_a', 'has_a', 'part_of', 'causes', 'similar_to'];
    
    for (const rel of relations) {
      this.relationVectors.set(rel, this.vsaSpace.generateRandomVector());
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let advancedReasonerInstance: VSAAdvancedReasoner | null = null;

export function getVSAAdvancedReasoner(dimension: number = 10000): VSAAdvancedReasoner {
  if (!advancedReasonerInstance) {
    advancedReasonerInstance = new VSAAdvancedReasoner(dimension);
  }
  return advancedReasonerInstance;
}

export function resetVSAAdvancedReasoner(): void {
  advancedReasonerInstance = null;
}
