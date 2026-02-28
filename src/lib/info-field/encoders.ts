/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信息编码器 - 不同算法将原始信息编码成不同结构
 * 
 * 变换的目的：让信息能被接收和处理
 * 
 * 每种编码算法产生一种特定的信息结构
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  InformationStructure,
  SparseVectorStructure,
  DenseVectorStructure,
  AttentionStructure,
  KeyValueStructure,
  SequenceStructure,
  GraphStructure
} from './structures';

// ─────────────────────────────────────────────────────────────────────
// 编码器接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码器接口
 * 
 * 将原始信息转换为特定结构
 */
export interface Encoder {
  /** 编码器名称 */
  readonly name: string;
  
  /** 编码器产生的结构类型 */
  readonly outputType: string;
  
  /** 编码 */
  encode(input: string, context?: EncodingContext): Promise<InformationStructure>;
}

/**
 * 编码上下文
 */
export interface EncodingContext {
  /** 已有的信息结构（用于关联） */
  existingStructures?: InformationStructure[];
  
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// 具体编码器
// ─────────────────────────────────────────────────────────────────────

/**
 * 词频编码器 (TF-IDF 风格)
 * 
 * 将文本编码为稀疏向量
 * 关键词 -> 高权重位置
 */
export class TermFrequencyEncoder implements Encoder {
  readonly name = 'term-frequency';
  readonly outputType = 'sparse-vector';
  
  private vocabulary: Map<string, number> = new Map();
  private documentFrequency: Map<string, number> = new Map();
  private totalDocuments = 0;
  
  /**
   * 构建词汇表
   */
  buildVocabulary(documents: string[]): void {
    this.vocabulary.clear();
    this.documentFrequency.clear();
    this.totalDocuments = documents.length;
    
    let index = 0;
    for (const doc of documents) {
      const terms = this.tokenize(doc);
      const uniqueTerms = new Set(terms);
      
      for (const term of uniqueTerms) {
        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, index++);
        }
        this.documentFrequency.set(term, (this.documentFrequency.get(term) || 0) + 1);
      }
    }
  }
  
  async encode(input: string): Promise<SparseVectorStructure> {
    const terms = this.tokenize(input);
    const termFreq = new Map<string, number>();
    
    // 计算词频
    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    }
    
    // 计算 TF-IDF
    const indices: number[] = [];
    const values: number[] = [];
    const maxFreq = Math.max(...termFreq.values());
    
    for (const [term, freq] of termFreq) {
      const idx = this.vocabulary.get(term);
      if (idx !== undefined) {
        // TF: 词频 / 最大词频
        const tf = freq / maxFreq;
        // IDF: log(总文档数 / 包含该词的文档数)
        const df = this.documentFrequency.get(term) || 1;
        const idf = Math.log(this.totalDocuments / df);
        // TF-IDF
        const tfidf = tf * idf;
        
        if (tfidf > 0.001) {  // 过滤极小值
          indices.push(idx);
          values.push(tfidf);
        }
      }
    }
    
    return new SparseVectorStructure(
      `tfidf_${Date.now()}`,
      input,
      indices,
      values,
      this.vocabulary.size
    );
  }
  
  /**
   * 分词
   */
  private tokenize(text: string): string[] {
    // 简化分词：按空格和标点分割
    return text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }
}

/**
 * 哈希编码器
 * 
 * 将文本映射为固定维度的稀疏向量
 * 使用哈希函数，无需预构建词汇表
 */
export class HashEncoder implements Encoder {
  readonly name = 'hash';
  readonly outputType = 'sparse-vector';
  
  constructor(
    private dimension: number = 1024
  ) {}
  
  async encode(input: string): Promise<SparseVectorStructure> {
    const terms = input.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
    
    const counts = new Map<number, number>();
    
    for (const term of terms) {
      const hash = this.hash(term);
      counts.set(hash, (counts.get(hash) || 0) + 1);
    }
    
    const indices: number[] = [];
    const values: number[] = [];
    
    for (const [idx, count] of counts) {
      indices.push(idx);
      values.push(count);
    }
    
    return new SparseVectorStructure(
      `hash_${Date.now()}`,
      input,
      indices,
      values,
      this.dimension
    );
  }
  
  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % this.dimension;
  }
}

/**
 * 注意力编码器
 * 
 * 计算输入与已有信息之间的注意力权重
 * 产生注意力结构
 */
export class AttentionEncoder implements Encoder {
  readonly name = 'attention';
  readonly outputType = 'attention';
  
  private vectorEncoder: RandomProjectionEncoder;
  
  constructor() {
    this.vectorEncoder = new RandomProjectionEncoder(128);
  }
  
  async encode(input: string, context?: EncodingContext): Promise<AttentionStructure> {
    // 将输入编码为向量
    const queryVector = await this.vectorEncoder.encode(input);
    
    // 获取已有信息
    const existing = context?.existingStructures || [];
    
    if (existing.length === 0) {
      // 没有已有信息，返回自注意力
      return new AttentionStructure(
        `attn_${Date.now()}`,
        input,
        `self_${Date.now()}`,
        [`self_${Date.now()}`],
        [1.0]
      );
    }
    
    // 计算与每个已有信息的相似度
    const similarities: number[] = [];
    const keyIds: string[] = [];
    
    for (const struct of existing) {
      // 获取或创建该结构的向量表示
      const keyVector = await this.vectorEncoder.encode(struct.source);
      
      if (queryVector instanceof DenseVectorStructure && 
          keyVector instanceof DenseVectorStructure) {
        similarities.push(queryVector.cosineSimilarity(keyVector));
        keyIds.push(struct.id);
      }
    }
    
    // Softmax 归一化
    const weights = this.softmax(similarities);
    
    return new AttentionStructure(
      `attn_${Date.now()}`,
      input,
      queryVector.id,
      keyIds,
      weights
    );
  }
  
  private softmax(values: number[]): number[] {
    const maxVal = Math.max(...values);
    const expValues = values.map(v => Math.exp(v - maxVal));
    const sum = expValues.reduce((a, b) => a + b, 0);
    return expValues.map(v => v / sum);
  }
}

/**
 * 随机投影编码器
 * 
 * 使用随机投影将文本映射为稠密向量
 * 简化版的 Embedding
 */
export class RandomProjectionEncoder implements Encoder {
  readonly name = 'random-projection';
  readonly outputType = 'dense-vector';
  
  private projectionMatrix: number[][];
  
  constructor(
    private dimension: number = 128,
    private seed: number = 42
  ) {
    // 初始化随机投影矩阵
    // 每行对应一个字符的投影
    this.projectionMatrix = this.initProjectionMatrix();
  }
  
  private initProjectionMatrix(): number[][] {
    // 简化：只使用 256 个基础字符的投影
    const matrix: number[][] = [];
    const rng = this.seededRandom(this.seed);
    
    for (let i = 0; i < 256; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.dimension; j++) {
        // 随机 +1 或 -1
        row.push(rng() > 0.5 ? 1 : -1);
      }
      matrix.push(row);
    }
    
    return matrix;
  }
  
  async encode(input: string): Promise<DenseVectorStructure> {
    const vector = new Array(this.dimension).fill(0);
    
    // 对每个字符进行投影并累加
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i) % 256;
      const projection = this.projectionMatrix[charCode];
      
      for (let j = 0; j < this.dimension; j++) {
        vector[j] += projection[j];
      }
    }
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    const normalized = vector.map(v => v / (norm || 1));
    
    return new DenseVectorStructure(
      `dense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      input,
      normalized
    );
  }
  
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }
}

/**
 * 键值对编码器
 * 
 * 提取文本中的结构化信息
 */
export class KeyValueEncoder implements Encoder {
  readonly name = 'key-value';
  readonly outputType = 'key-value';
  
  async encode(input: string): Promise<KeyValueStructure> {
    const data = new Map<string, unknown>();
    
    // 提取基本信息
    data.set('text', input);
    data.set('length', input.length);
    data.set('wordCount', input.split(/\s+/).filter(w => w.length > 0).length);
    
    // 提取可能的键值对（格式: key: value）
    const kvPattern = /(\w+)\s*[:：]\s*([^\n,，;；]+)/g;
    let match;
    while ((match = kvPattern.exec(input)) !== null) {
      data.set(match[1].trim(), match[2].trim());
    }
    
    // 提取数字
    const numbers = input.match(/[-+]?\d*\.?\d+/g);
    if (numbers) {
      data.set('numbers', numbers.map(Number));
    }
    
    // 提取情绪词（简化版）
    const positiveWords = ['好', '喜欢', '开心', '快乐', '优秀', '棒', '赞'];
    const negativeWords = ['坏', '讨厌', '难过', '悲伤', '糟糕', '差', '恨'];
    
    let sentiment = 0;
    for (const word of positiveWords) {
      if (input.includes(word)) sentiment += 1;
    }
    for (const word of negativeWords) {
      if (input.includes(word)) sentiment -= 1;
    }
    data.set('sentiment', sentiment);
    
    return new KeyValueStructure(
      `kv_${Date.now()}`,
      input,
      data
    );
  }
}

/**
 * 序列编码器
 * 
 * 将文本分割成有序的片段序列
 */
export class SequenceEncoder implements Encoder {
  readonly name = 'sequence';
  readonly outputType = 'sequence';
  
  private subEncoder: RandomProjectionEncoder;
  
  constructor() {
    this.subEncoder = new RandomProjectionEncoder(64);
  }
  
  async encode(input: string): Promise<SequenceStructure> {
    // 分句
    const sentences = input.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 0);
    
    // 为每个句子生成结构
    const elements: InformationStructure[] = [];
    const order: number[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const struct = await this.subEncoder.encode(sentence);
      elements.push(struct);
      order.push(i);
    }
    
    return new SequenceStructure(
      `seq_${Date.now()}`,
      input,
      elements,
      order
    );
  }
}

/**
 * 图编码器
 * 
 * 从文本中提取实体和关系，构建图结构
 */
export class GraphEncoder implements Encoder {
  readonly name = 'graph';
  readonly outputType = 'graph';
  
  async encode(input: string): Promise<GraphStructure> {
    const nodes = new Map<string, { label: string; data?: unknown }>();
    const edges: Array<{ from: string; to: string; weight: number; label?: string }> = [];
    
    // 简化版实体提取：提取名词性短语
    const entityPattern = /[\u4e00-\u9fa5]{2,8}/g;
    const entities = input.match(entityPattern) || [];
    
    // 添加节点
    for (const entity of entities) {
      const nodeId = `node_${nodes.size}`;
      nodes.set(nodeId, { label: entity });
    }
    
    // 提取关系（格式: A 和 B，A 的 B，A 是 B）
    const relationPatterns = [
      /([\u4e00-\u9fa5]+)\s*和\s*([\u4e00-\u9fa5]+)/g,
      /([\u4e00-\u9fa5]+)\s*的\s*([\u4e00-\u9fa5]+)/g,
      /([\u4e00-\u9fa5]+)\s*(?:是|为|等于)\s*([\u4e00-\u9fa5]+)/g,
    ];
    
    const nodeLabels = Array.from(nodes.values()).map(n => n.label);
    
    for (const pattern of relationPatterns) {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        const [, from, to] = match;
        
        // 找到对应的节点 ID
        const fromNode = Array.from(nodes.entries()).find(([, v]) => v.label === from);
        const toNode = Array.from(nodes.entries()).find(([, v]) => v.label === to);
        
        if (fromNode && toNode) {
          edges.push({
            from: fromNode[0],
            to: toNode[0],
            weight: 1.0,
            label: 'related'
          });
        }
      }
    }
    
    // 如果没有找到关系，建立相邻实体的连接
    if (edges.length === 0 && nodeLabels.length > 1) {
      const nodeIds = Array.from(nodes.keys());
      for (let i = 0; i < nodeIds.length - 1; i++) {
        edges.push({
          from: nodeIds[i],
          to: nodeIds[i + 1],
          weight: 0.5,
          label: 'adjacent'
        });
      }
    }
    
    return new GraphStructure(
      `graph_${Date.now()}`,
      input,
      nodes,
      edges
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 编码器注册表
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码器注册表
 * 
 * 管理所有可用的编码器
 */
export class EncoderRegistry {
  private encoders: Map<string, Encoder> = new Map();
  
  constructor() {
    // 注册默认编码器
    this.register(new TermFrequencyEncoder());
    this.register(new HashEncoder());
    this.register(new RandomProjectionEncoder());
    this.register(new AttentionEncoder());
    this.register(new KeyValueEncoder());
    this.register(new SequenceEncoder());
    this.register(new GraphEncoder());
  }
  
  register(encoder: Encoder): void {
    this.encoders.set(encoder.name, encoder);
  }
  
  get(name: string): Encoder | undefined {
    return this.encoders.get(name);
  }
  
  getByOutputType(type: string): Encoder[] {
    return Array.from(this.encoders.values())
      .filter(e => e.outputType === type);
  }
  
  list(): string[] {
    return Array.from(this.encoders.keys());
  }
}

// 默认注册表实例
export const encoderRegistry = new EncoderRegistry();
