/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信息编码器 - 将原始信息转换为不同结构
 * 
 * 信息结构 = 经不同算法编码的不同表示
 * 
 * 每种编码算法产生一种特定的信息结构
 * 不同的结构被不同的感受器接收
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 信息结构基类
// ─────────────────────────────────────────────────────────────────────

/**
 * 信息结构基类
 * 
 * 所有编码后的信息都继承此类
 */
export abstract class InformationStructure {
  /** 唯一标识 */
  abstract readonly id: string;
  
  /** 结构类型 */
  abstract readonly type: string;
  
  /** 原始信息 */
  abstract readonly source: string;
  
  /** 时间戳 */
  abstract readonly timestamp: number;
  
  /** 强度/重要性 */
  abstract intensity: number;
  
  /** 转换为可传输格式 */
  abstract serialize(): string;
}

// ─────────────────────────────────────────────────────────────────────
// 具体信息结构
// ─────────────────────────────────────────────────────────────────────

/**
 * 稀疏向量结构（如 TF-IDF）
 * 
 * 大部分位置是 0，少数位置有值
 * 适合：关键词检索、匹配
 */
export class SparseVectorStructure extends InformationStructure {
  readonly type = 'sparse-vector';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly indices: number[],      // 非零位置
    readonly values: number[],       // 对应值
    readonly dimension: number,      // 总维度
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.sqrt(this.values.reduce((sum, v) => sum + v * v, 0));
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      indices: this.indices,
      values: this.values,
      dimension: this.dimension
    });
  }
  
  /** 计算与另一个稀疏向量的余弦相似度 */
  cosineSimilarity(other: SparseVectorStructure): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    const aMap = new Map(this.indices.map((idx, i) => [idx, this.values[i]]));
    const bMap = new Map(other.indices.map((idx, i) => [idx, other.values[i]]));
    
    // 计算点积
    for (const [idx, val] of aMap) {
      if (bMap.has(idx)) {
        dotProduct += val * bMap.get(idx)!;
      }
      normA += val * val;
    }
    
    for (const val of other.values) {
      normB += val * val;
    }
    
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
}

/**
 * 稠密向量结构（如 Embedding）
 * 
 * 每个位置都有值
 * 适合：语义计算、相似度
 */
export class DenseVectorStructure extends InformationStructure {
  readonly type = 'dense-vector';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly vector: number[],
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.sqrt(this.vector.reduce((sum, v) => sum + v * v, 0));
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      vector: this.vector
    });
  }
  
  /** 计算与另一个稠密向量的余弦相似度 */
  cosineSimilarity(other: DenseVectorStructure): number {
    if (this.vector.length !== other.vector.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < this.vector.length; i++) {
      dotProduct += this.vector[i] * other.vector[i];
      normA += this.vector[i] * this.vector[i];
      normB += other.vector[i] * other.vector[i];
    }
    
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
  
  /** 向量加法 */
  add(other: DenseVectorStructure): DenseVectorStructure {
    const result = this.vector.map((v, i) => v + other.vector[i]);
    return new DenseVectorStructure(
      `${this.id}+${other.id}`,
      `${this.source} + ${other.source}`,
      result
    );
  }
  
  /** 标量乘法 */
  scale(scalar: number): DenseVectorStructure {
    const result = this.vector.map(v => v * scalar);
    return new DenseVectorStructure(
      `${this.id}*${scalar}`,
      this.source,
      result
    );
  }
}

/**
 * 注意力权重结构
 * 
 * 表示当前信息对其他信息的关注程度
 * 适合：关联、融合
 */
export class AttentionStructure extends InformationStructure {
  readonly type = 'attention';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly queryId: string,         // 查询来源
    readonly keyIds: string[],        // 键来源列表
    readonly weights: number[],       // 注意力权重（和为1）
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.max(...this.weights);
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      queryId: this.queryId,
      keyIds: this.keyIds,
      weights: this.weights
    });
  }
  
  /** 获取最受关注的信息 ID */
  getTopAttended(): { id: string; weight: number } {
    const maxIdx = this.weights.indexOf(Math.max(...this.weights));
    return {
      id: this.keyIds[maxIdx],
      weight: this.weights[maxIdx]
    };
  }
  
  /** 加权融合其他信息 */
  weightedSum<T>(values: Map<string, T>, combiner: (a: T, b: T, weight: number) => T): T | null {
    let result: T | null = null;
    
    for (let i = 0; i < this.keyIds.length; i++) {
      const value = values.get(this.keyIds[i]);
      if (value) {
        if (result === null) {
          result = value;
        } else {
          result = combiner(result, value, this.weights[i]);
        }
      }
    }
    
    return result;
  }
}

/**
 * 键值对结构
 * 
 * 简单的属性-值映射
 * 适合：结构化信息、元数据
 */
export class KeyValueStructure extends InformationStructure {
  readonly type = 'key-value';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly data: Map<string, unknown>,
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return this.data.size / 100; // 简单计算
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      data: Object.fromEntries(this.data)
    });
  }
  
  get(key: string): unknown {
    return this.data.get(key);
  }
  
  set(key: string, value: unknown): KeyValueStructure {
    const newData = new Map(this.data);
    newData.set(key, value);
    return new KeyValueStructure(this.id, this.source, newData, this.timestamp);
  }
}

/**
 * 序列结构
 * 
 * 有序的信息列表
 * 适合：时间序列、文本序列
 */
export class SequenceStructure extends InformationStructure {
  readonly type = 'sequence';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly elements: InformationStructure[],
    readonly order: number[],        // 元素的顺序索引
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    if (this.elements.length === 0) return 0;
    return this.elements.reduce((sum, e) => sum + e.intensity, 0) / this.elements.length;
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      elements: this.elements.map(e => e.serialize()),
      order: this.order
    });
  }
  
  /** 获取第 N 个元素 */
  getAt(index: number): InformationStructure | undefined {
    return this.elements[index];
  }
  
  /** 追加元素 */
  append(element: InformationStructure): SequenceStructure {
    return new SequenceStructure(
      this.id,
      this.source,
      [...this.elements, element],
      [...this.order, Math.max(...this.order) + 1]
    );
  }
}

/**
 * 图结构
 * 
 * 节点和边的网络
 * 适合：知识图谱、关联网络
 */
export class GraphStructure extends InformationStructure {
  readonly type = 'graph';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly nodes: Map<string, { label: string; data?: unknown }>,
    readonly edges: Array<{ from: string; to: string; weight: number; label?: string }>,
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.sqrt(this.nodes.size + this.edges.length);
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      nodes: Object.fromEntries(this.nodes),
      edges: this.edges
    });
  }
  
  /** 获取节点的邻居 */
  getNeighbors(nodeId: string): string[] {
    return this.edges
      .filter(e => e.from === nodeId)
      .map(e => e.to);
  }
  
  /** 添加边 */
  addEdge(from: string, to: string, weight: number, label?: string): GraphStructure {
    return new GraphStructure(
      this.id,
      this.source,
      this.nodes,
      [...this.edges, { from, to, weight, label }]
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 智能体专用信息结构
// ─────────────────────────────────────────────────────────────────────

/**
 * 意图结构
 * 
 * LLM 解析出的用户意图
 * 适合：任务理解、决策
 */
export class IntentStructure extends InformationStructure {
  readonly type = 'intent';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly primary: string,           // 主意图: "search" | "summarize" | "navigate" | "operate" | ...
    readonly parameters: Map<string, unknown>,  // 参数
    readonly constraints: Map<string, unknown>, // 约束条件
    readonly confidence: number,         // 可信度 0-1
    readonly context: Map<string, unknown>,     // 上下文
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return this.confidence;
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      primary: this.primary,
      parameters: Object.fromEntries(this.parameters),
      constraints: Object.fromEntries(this.constraints),
      confidence: this.confidence,
      context: Object.fromEntries(this.context)
    });
  }
  
  /** 获取参数 */
  getParam(key: string): unknown {
    return this.parameters.get(key);
  }
  
  /** 检查是否满足约束 */
  meetsConstraint(key: string, value: unknown): boolean {
    const constraint = this.constraints.get(key);
    if (constraint === undefined) return true;
    return constraint === value;
  }
  
  /** 创建新意图（添加参数） */
  withParam(key: string, value: unknown): IntentStructure {
    const newParams = new Map(this.parameters);
    newParams.set(key, value);
    return new IntentStructure(
      this.id,
      this.source,
      this.primary,
      newParams,
      this.constraints,
      this.confidence,
      this.context,
      this.timestamp
    );
  }
}

/**
 * 行动结构
 * 
 * 可执行的操作定义
 * 适合：任务执行、浏览器操作
 */
export class ActionStructure extends InformationStructure {
  readonly type = 'action';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly action: string,             // 行动类型: "click" | "type" | "navigate" | "extract" | "think" | ...
    readonly target: string,             // 目标: CSS选择器、URL、文件路径...
    readonly value?: string,             // 值: 输入内容、参数...
    readonly priority: number = 0,       // 优先级
    readonly dependencies: string[] = [],// 依赖的其他行动ID
    readonly timeout: number = 30000,    // 超时时间(ms)
    readonly expectedOutcome?: string,   // 预期结果
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return 1 / (this.priority + 1); // 优先级越高，强度越大
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      action: this.action,
      target: this.target,
      value: this.value,
      priority: this.priority,
      dependencies: this.dependencies,
      timeout: this.timeout,
      expectedOutcome: this.expectedOutcome
    });
  }
  
  /** 是否可以执行（依赖是否满足） */
  canExecute(completedActions: Set<string>): boolean {
    return this.dependencies.every(dep => completedActions.has(dep));
  }
  
  /** 创建带值的行动 */
  withValue(value: string): ActionStructure {
    return new ActionStructure(
      this.id,
      this.source,
      this.action,
      this.target,
      value,
      this.priority,
      this.dependencies,
      this.timeout,
      this.expectedOutcome,
      this.timestamp
    );
  }
}

/**
 * 观察结构
 * 
 * 执行行动后的观察结果
 * 适合：反馈、学习
 */
export class ObservationStructure extends InformationStructure {
  readonly type = 'observation';
  
  constructor(
    readonly id: string,
    readonly source: string,             // 来源行动ID
    readonly content: string,            // 观察到的内容
    readonly status: 'success' | 'failed' | 'timeout' | 'partial',
    readonly error?: string,             // 错误信息
    readonly extracted: Map<string, unknown> = new Map(), // 提取的结构化信息
    readonly screenshot?: string,        // 截图（base64）
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return this.status === 'success' ? 1 : this.status === 'partial' ? 0.5 : 0;
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      source: this.source,
      content: this.content,
      status: this.status,
      error: this.error,
      extracted: Object.fromEntries(this.extracted),
      hasScreenshot: !!this.screenshot
    });
  }
  
  /** 是否成功 */
  isSuccess(): boolean {
    return this.status === 'success';
  }
  
  /** 获取提取的信息 */
  getExtracted(key: string): unknown {
    return this.extracted.get(key);
  }
  
  /** 创建失败的观察 */
  static failed(actionId: string, error: string): ObservationStructure {
    return new ObservationStructure(
      `obs-${Date.now()}`,
      actionId,
      '',
      'failed',
      error
    );
  }
  
  /** 创建成功的观察 */
  static success(actionId: string, content: string, extracted?: Map<string, unknown>): ObservationStructure {
    return new ObservationStructure(
      `obs-${Date.now()}`,
      actionId,
      content,
      'success',
      undefined,
      extracted
    );
  }
}

/**
 * 记忆结构
 * 
 * 存储在记忆库中的信息
 * 适合：长期存储、检索
 */
export class MemoryStructure extends InformationStructure {
  readonly type = 'memory';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly content: string,            // 记忆内容
    readonly importance: number,         // 重要性 0-1
    readonly lastAccessed: number,       // 最后访问时间
    readonly accessCount: number,        // 访问次数
    readonly embedding?: number[],       // 语义向量（可选）
    readonly associations: string[] = [],// 关联的其他记忆ID
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    const recency = Math.exp(-((Date.now() - this.lastAccessed) / (1000 * 60 * 60 * 24))); // 一天衰减
    return this.importance * recency * Math.log(this.accessCount + 1);
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      content: this.content,
      importance: this.importance,
      lastAccessed: this.lastAccessed,
      accessCount: this.accessCount,
      associations: this.associations
    });
  }
  
  /** 访问记忆（更新访问记录） */
  access(): MemoryStructure {
    return new MemoryStructure(
      this.id,
      this.source,
      this.content,
      this.importance,
      Date.now(),
      this.accessCount + 1,
      this.embedding,
      this.associations,
      this.timestamp
    );
  }
  
  /** 添加关联 */
  addAssociation(memoryId: string): MemoryStructure {
    if (this.associations.includes(memoryId)) return this;
    return new MemoryStructure(
      this.id,
      this.source,
      this.content,
      this.importance,
      this.lastAccessed,
      this.accessCount,
      this.embedding,
      [...this.associations, memoryId],
      this.timestamp
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 类型别名和工具函数
// ─────────────────────────────────────────────────────────────────────

/** 任意信息结构的联合类型 */
export type AnyInformationStructure = 
  | SparseVectorStructure 
  | DenseVectorStructure 
  | AttentionStructure 
  | KeyValueStructure 
  | SequenceStructure 
  | GraphStructure
  | IntentStructure
  | ActionStructure
  | ObservationStructure
  | MemoryStructure;

/** 信息结构类型守卫 */
export const isSparseVector = (s: InformationStructure): s is SparseVectorStructure => 
  s.type === 'sparse-vector';

export const isDenseVector = (s: InformationStructure): s is DenseVectorStructure => 
  s.type === 'dense-vector';

export const isAttention = (s: InformationStructure): s is AttentionStructure => 
  s.type === 'attention';

export const isKeyValue = (s: InformationStructure): s is KeyValueStructure => 
  s.type === 'key-value';

export const isSequence = (s: InformationStructure): s is SequenceStructure => 
  s.type === 'sequence';

export const isGraph = (s: InformationStructure): s is GraphStructure => 
  s.type === 'graph';

export const isIntent = (s: InformationStructure): s is IntentStructure => 
  s.type === 'intent';

export const isAction = (s: InformationStructure): s is ActionStructure => 
  s.type === 'action';

export const isObservation = (s: InformationStructure): s is ObservationStructure => 
  s.type === 'observation';

export const isMemory = (s: InformationStructure): s is MemoryStructure => 
  s.type === 'memory';

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

// 类定义已经自动导出
