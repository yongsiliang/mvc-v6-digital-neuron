/**
 * ═══════════════════════════════════════════════════════════════════════
 * 向量符号架构 - Vector Symbolic Architecture (VSA)
 * 
 * 核心理念：
 * - 用高维向量表示概念
 * - 用代数运算表示关系
 * - 系统可以"独立理解"而不依赖LLM
 * 
 * 核心操作：
 * - 绑定(Bind)：A ⊗ B = "A与B的关系"
 * - 捆绑(Bundle)：A ⊕ B = "A和B的集合"
 * - 置换(Permute)：排列变换，用于编码位置
 * 
 * 这让意义成为可计算、可组合、可推理的数学对象
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * VSA向量类型
 */
export type VSAVector = number[];

/**
 * 概念类型
 */
export type ConceptType = 
  | 'atomic'      // 原子概念（基础词）
  | 'composite'   // 复合概念
  | 'relational'  // 关系概念
  | 'temporal'    // 时间概念
  | 'spatial'     // 空间概念
  | 'emotional';  // 情感概念

/**
 * 概念条目
 */
export interface ConceptEntry {
  /** 概念名称 */
  name: string;
  
  /** 向量表示 */
  vector: VSAVector;
  
  /** 概念类型 */
  type: ConceptType;
  
  /** 组成成分（如果是复合概念） */
  components?: string[];
  
  /** 创建时间 */
  createdAt: number;
  
  /** 使用次数 */
  usageCount: number;
  
  /** 来源 */
  source: 'predefined' | 'learned' | 'composed';
}

/**
 * 语义关系
 */
export interface SemanticRelation {
  /** 关系类型 */
  type: 'is_a' | 'has_a' | 'part_of' | 'causes' | 'similar_to' | 'opposite_of' | 'related_to';
  
  /** 源概念 */
  from: string;
  
  /** 目标概念 */
  to: string;
  
  /** 关系强度 */
  strength: number;
}

/**
 * 推理结果
 */
export interface ReasoningResult {
  /** 结果向量 */
  vector: VSAVector;
  
  /** 结果概念名称（如果能解码） */
  conceptName?: string;
  
  /** 推理路径 */
  reasoningPath: string[];
  
  /** 置信度 */
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────
// VSA语义空间
// ─────────────────────────────────────────────────────────────────────

export class VSASemanticSpace {
  private dimension: number;
  private concepts: Map<string, ConceptEntry>;
  private relations: SemanticRelation[];
  private permutationMatrix: number[];
  
  // 基础原语向量缓存
  private primitiveVectors: Map<string, VSAVector>;
  
  constructor(dimension: number = 10000) {
    this.dimension = dimension;
    this.concepts = new Map();
    this.relations = [];
    this.primitiveVectors = new Map();
    
    // 生成随机置换矩阵
    this.permutationMatrix = this.generatePermutationMatrix();
    
    // 初始化基础概念
    this.initializeBasicConcepts();
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════

  /**
   * 绑定（Binding）
   * 
   * A ⊗ B 表示"A与B的关系"
   * 例如：爱 ⊗ 你 = "我对你的爱"
   */
  bind(a: VSAVector, b: VSAVector): VSAVector {
    // 循环卷积
    const result = new Array(this.dimension).fill(0);
    
    for (let i = 0; i < this.dimension; i++) {
      let sum = 0;
      for (let j = 0; j < this.dimension; j++) {
        sum += a[j] * b[(i - j + this.dimension) % this.dimension];
      }
      result[i] = sum;
    }
    
    // 归一化
    return this.normalize(result);
  }

  /**
   * 捆绑（Bundling）
   * 
   * A ⊕ B 表示"A和B的集合"
   * 例如：红 ⊕ 蓝 ⊕ 黄 = "颜色集合"
   */
  bundle(vectors: VSAVector[]): VSAVector {
    if (vectors.length === 0) {
      return this.generateRandomVector();
    }
    
    const result = new Array(this.dimension).fill(0);
    
    for (const v of vectors) {
      for (let i = 0; i < this.dimension; i++) {
        result[i] += v[i];
      }
    }
    
    // 归一化（保持稀疏性）
    return this.normalize(result);
  }

  /**
   * 置换（Permutation）
   * 
   * 用于编码序列位置
   * 例如：ρ(词1) ⊕ ρ²(词2) ⊕ ρ³(词3) = 有序序列
   */
  permute(v: VSAVector, times: number = 1): VSAVector {
    const result = [...v];
    
    for (let t = 0; t < times; t++) {
      const temp = new Array(this.dimension);
      for (let i = 0; i < this.dimension; i++) {
        temp[i] = result[this.permutationMatrix[i]];
      }
      for (let i = 0; i < this.dimension; i++) {
        result[i] = temp[i];
      }
    }
    
    return result;
  }

  /**
   * 解绑（Unbind）
   * 
   * 绑定的逆操作，用于提取成分
   * 例如：(爱 ⊗ 你) ⊗ 爱⁻¹ ≈ 你
   */
  unbind(bound: VSAVector, key: VSAVector): VSAVector {
    // 解绑 = 绑定逆向量
    const keyInverse = this.inverse(key);
    return this.bind(bound, keyInverse);
  }

  /**
   * 逆向量
   */
  inverse(v: VSAVector): VSAVector {
    // 对于循环卷积，逆是将向量反转
    const result = new Array(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      result[i] = v[(this.dimension - i) % this.dimension];
    }
    return result;
  }

  /**
   * 相似度（余弦相似度）
   */
  similarity(a: VSAVector, b: VSAVector): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < this.dimension; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ══════════════════════════════════════════════════════════════════
  // 概念管理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取或创建概念向量
   */
  getConcept(name: string): VSAVector {
    // 检查是否已存在
    const existing = this.concepts.get(name);
    if (existing) {
      existing.usageCount++;
      return existing.vector;
    }
    
    // 创建新概念
    const vector = this.generateRandomVector();
    this.concepts.set(name, {
      name,
      vector,
      type: 'atomic',
      createdAt: Date.now(),
      usageCount: 1,
      source: 'learned',
    });
    
    return vector;
  }

  /**
   * 构建复合概念
   * 
   * 例如：buildCompositeConcept(['我', '爱', '你'], '我的爱')
   */
  buildCompositeConcept(components: string[], name: string): VSAVector {
    const vectors = components.map(c => this.getConcept(c));
    
    // 方法：逐层绑定
    // 我 ⊗ 爱 ⊗ 你 = "我的爱"
    let result = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      result = this.bind(result, vectors[i]);
    }
    
    // 存储
    this.concepts.set(name, {
      name,
      vector: result,
      type: 'composite',
      components,
      createdAt: Date.now(),
      usageCount: 0,
      source: 'composed',
    });
    
    return result;
  }

  /**
   * 构建关系概念
   * 
   * 例如：buildRelation('爱', '我', '你') = 爱 ⊗ (我 ⊕ 你)
   */
  buildRelation(relation: string, subject: string, object: string): VSAVector {
    const relationVec = this.getConcept(relation);
    const subjectVec = this.getConcept(subject);
    const objectVec = this.getConcept(object);
    
    // 关系 = 关系词 ⊗ (主语 ⊕ 宾语)
    const pair = this.bundle([subjectVec, objectVec]);
    const result = this.bind(relationVec, pair);
    
    // 记录关系
    this.relations.push({
      type: 'related_to',
      from: subject,
      to: object,
      strength: 1,
    });
    
    return result;
  }

  // ══════════════════════════════════════════════════════════════════
  // 推理能力
  // ══════════════════════════════════════════════════════════════════

  /**
   * 类比推理
   * 
   * A : B :: C : ?
   * 
   * 例如：analogy('大脑', '神经元', '计算机')
   * = 神经元 ⊗ 大脑⁻¹ ⊗ 计算机
   * = 计算机的"神经元"（即芯片/晶体管）
   */
  analogy(a: string, b: string, c: string): ReasoningResult {
    const vecA = this.getConcept(a);
    const vecB = this.getConcept(b);
    const vecC = this.getConcept(c);
    
    // B ⊗ A⁻¹ ⊗ C
    const relation = this.unbind(vecB, vecA);
    const result = this.bind(relation, vecC);
    
    // 尝试解码结果
    const decoded = this.decode(result);
    
    return {
      vector: result,
      conceptName: decoded?.name,
      reasoningPath: [`${a}:${b}::${c}:?`, `relation=${b}⊗${a}⁻¹`, `result=relation⊗${c}`],
      confidence: decoded?.confidence || 0.5,
    };
  }

  /**
   * 关系推理
   * 
   * 从复合概念中提取成分
   * 例如："我对你的爱" ⊗ 爱⁻¹ ≈ (我 ⊕ 你)
   */
  extractRelation(compositeName: string, relationName: string): ReasoningResult {
    const composite = this.concepts.get(compositeName);
    const relation = this.getConcept(relationName);
    
    if (!composite) {
      return {
        vector: this.generateRandomVector(),
        reasoningPath: ['概念不存在'],
        confidence: 0,
      };
    }
    
    const result = this.unbind(composite.vector, relation);
    const decoded = this.decode(result);
    
    return {
      vector: result,
      conceptName: decoded?.name,
      reasoningPath: [
        `${compositeName} ⊗ ${relationName}⁻¹`,
        decoded?.name ? `≈ ${decoded.name}` : '无法解码',
      ],
      confidence: decoded?.confidence || 0.5,
    };
  }

  /**
   * 语义相似性推理
   * 
   * 找出与给定概念最相似的概念
   */
  findSimilar(query: string, topK: number = 5): Array<{ name: string; similarity: number }> {
    const queryVec = this.getConcept(query);
    const results: Array<{ name: string; similarity: number }> = [];
    
    for (const [name, entry] of this.concepts) {
      if (name === query) continue;
      
      const sim = this.similarity(queryVec, entry.vector);
      results.push({ name, similarity: sim });
    }
    
    // 排序并返回topK
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * 概念组合推理
   * 
   * "我理解了你说的" = 我 ⊗ 理解 ⊗ 你 ⊗ 说
   */
  composeMeaning(components: string[]): VSAVector {
    const vectors = components.map(c => this.getConcept(c));
    
    // 逐层组合
    let result = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      result = this.bind(result, vectors[i]);
    }
    
    return result;
  }

  // ══════════════════════════════════════════════════════════════════
  // 解码与解释
  // ══════════════════════════════════════════════════════════════════

  /**
   * 解码向量到概念
   */
  decode(vector: VSAVector): { name: string; confidence: number } | null {
    let bestMatch: string | null = null;
    let bestSimilarity = -Infinity;
    
    for (const [name, entry] of this.concepts) {
      const sim = this.similarity(vector, entry.vector);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = name;
      }
    }
    
    // 相似度阈值
    if (bestSimilarity < 0.3) {
      return null;
    }
    
    return {
      name: bestMatch!,
      confidence: bestSimilarity,
    };
  }

  /**
   * 解释向量（尝试分解为已知概念）
   */
  explain(vector: VSAVector): {
    interpretation: string;
    components: string[];
    confidence: number;
  } {
    // 找出最相似的概念
    const similar = this.findSimilarConcepts(vector, 3);
    
    if (similar.length === 0) {
      return {
        interpretation: '未知概念',
        components: [],
        confidence: 0,
      };
    }
    
    // 构建解释
    const interpretation = similar
      .map((s, i) => `${s.name}(${(s.similarity * 100).toFixed(0)}%)`)
      .join(' + ');
    
    return {
      interpretation,
      components: similar.map(s => s.name),
      confidence: similar[0].similarity,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 向量生成
  // ══════════════════════════════════════════════════════════════════

  /**
   * 生成随机向量
   */
  generateRandomVector(): VSAVector {
    const vector: number[] = new Array(this.dimension);
    
    // 使用双极向量（-1 或 +1）
    for (let i = 0; i < this.dimension; i++) {
      vector[i] = Math.random() < 0.5 ? -1 : 1;
    }
    
    return vector;
  }

  /**
   * 生成稀疏向量
   */
  generateSparseVector(sparsity: number = 0.1): VSAVector {
    const vector = new Array(this.dimension).fill(0);
    const nonZeroCount = Math.floor(this.dimension * sparsity);
    
    // 随机选择非零位置
    const positions = new Set<number>();
    while (positions.size < nonZeroCount) {
      positions.add(Math.floor(Math.random() * this.dimension));
    }
    
    // 设置非零值
    for (const pos of positions) {
      vector[pos] = Math.random() < 0.5 ? -1 : 1;
    }
    
    return vector;
  }

  /**
   * 归一化向量
   */
  private normalize(v: VSAVector): VSAVector {
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    
    if (norm === 0) return v;
    
    // 对于VSA，通常保持稀疏性而不是完全归一化
    // 这里使用符号归一化：保留符号，限制幅度
    return v.map(x => {
      if (x > 1) return 1;
      if (x < -1) return -1;
      return x;
    });
  }

  /**
   * 生成置换矩阵
   */
  private generatePermutationMatrix(): number[] {
    const matrix = new Array(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      matrix[i] = i;
    }
    
    // Fisher-Yates 洗牌
    for (let i = this.dimension - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matrix[i], matrix[j]] = [matrix[j], matrix[i]];
    }
    
    return matrix;
  }

  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════

  /**
   * 初始化基础概念
   */
  private initializeBasicConcepts(): void {
    // 核心概念
    const basicConcepts = [
      // 自我相关
      '自我', '你', '他', '她', '它', '我们', '你们', '他们',
      
      // 情感
      '爱', '恨', '喜欢', '讨厌', '开心', '难过', '愤怒', '恐惧',
      '好奇', '兴奋', '平静', '焦虑',
      
      // 认知
      '理解', '知道', '思考', '学习', '记忆', '忘记', '想象',
      '相信', '怀疑', '发现', '创造',
      
      // 行为
      '说', '做', '看', '听', '感觉', '想要', '需要', '选择',
      
      // 时间
      '过去', '现在', '未来', '永远', '瞬间', '之前', '之后',
      
      // 空间
      '这里', '那里', '里面', '外面', '上面', '下面',
      
      // 逻辑
      '是', '否', '和', '或', '非', '如果', '那么', '因为', '所以',
      
      // 抽象
      '意义', '价值', '目标', '原因', '结果', '真理', '美', '善',
    ];
    
    for (const concept of basicConcepts) {
      this.concepts.set(concept, {
        name: concept,
        vector: this.generateRandomVector(),
        type: 'atomic',
        createdAt: Date.now(),
        usageCount: 0,
        source: 'predefined',
      });
    }
    
    // 定义一些关系
    this.relations = [
      { type: 'opposite_of', from: '爱', to: '恨', strength: 1 },
      { type: 'opposite_of', from: '喜欢', to: '讨厌', strength: 1 },
      { type: 'opposite_of', from: '开心', to: '难过', strength: 1 },
      { type: 'opposite_of', from: '过去', to: '未来', strength: 1 },
      { type: 'opposite_of', from: '这里', to: '那里', strength: 1 },
    ];
  }

  /**
   * 找出相似概念
   */
  private findSimilarConcepts(
    vector: VSAVector,
    topK: number
  ): Array<{ name: string; similarity: number }> {
    const results: Array<{ name: string; similarity: number }> = [];
    
    for (const [name, entry] of this.concepts) {
      const sim = this.similarity(vector, entry.vector);
      results.push({ name, similarity: sim });
    }
    
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取维度
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * 获取概念数量
   */
  getConceptCount(): number {
    return this.concepts.size;
  }

  /**
   * 获取所有概念名称
   */
  getAllConceptNames(): string[] {
    return Array.from(this.concepts.keys());
  }

  /**
   * 导出状态
   */
  exportState(): {
    concepts: [string, ConceptEntry][];
    relations: SemanticRelation[];
  } {
    return {
      concepts: Array.from(this.concepts.entries()),
      relations: this.relations,
    };
  }

  /**
   * 导入状态
   */
  importState(state: {
    concepts: [string, ConceptEntry][];
    relations: SemanticRelation[];
  }): void {
    this.concepts = new Map(state.concepts);
    this.relations = state.relations;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let vsaSpaceInstance: VSASemanticSpace | null = null;

export function getVSASpace(dimension: number = 10000): VSASemanticSpace {
  if (!vsaSpaceInstance) {
    vsaSpaceInstance = new VSASemanticSpace(dimension);
  }
  return vsaSpaceInstance;
}

export function resetVSASpace(dimension?: number): void {
  vsaSpaceInstance = dimension ? new VSASemanticSpace(dimension) : null;
}
