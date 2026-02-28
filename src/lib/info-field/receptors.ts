/**
 * ═══════════════════════════════════════════════════════════════════════
 * 感受器 - 接收特定信息结构的黑盒子
 * 
 * 感受器本质：
 * - 接收特定结构的信息
 * - 产生某种效果（输出新的信息结构 / 改变状态）
 * - 内部如何工作 = 黑盒（我们不模拟）
 * 
 * 变换的目的：让信息能被感受器接收
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { InformationStructure } from './structures';
import {
  SparseVectorStructure,
  DenseVectorStructure,
  AttentionStructure,
  KeyValueStructure,
  SequenceStructure,
  GraphStructure
} from './structures';
import { encoderRegistry } from './encoders';

// ─────────────────────────────────────────────────────────────────────
// 感受器接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 感受器状态
 */
export interface ReceptorState {
  /** 感受器 ID */
  id: string;
  
  /** 感受器类型 */
  type: string;
  
  /** 当前活跃度 */
  activation: number;
  
  /** 接收的信息队列 */
  inputQueue: InformationStructure[];
  
  /** 最后一次输出 */
  lastOutput: InformationStructure | null;
  
  /** 接收次数统计 */
  receiveCount: number;
  
  /** 输出次数统计 */
  outputCount: number;
}

/**
 * 感受器配置
 */
export interface ReceptorConfig {
  /** 接受的信息结构类型 */
  acceptsTypes: string[];
  
  /** 灵敏度阈值 */
  sensitivityThreshold: number;
  
  /** 最大队列长度 */
  maxQueueLength: number;
  
  /** 输出什么类型的信息 */
  outputsType: string;
}

/**
 * 感受器接口
 * 
 * 黑盒子：接收信息 → ??? → 产生效果
 */
export interface Receptor {
  /** 感受器 ID */
  readonly id: string;
  
  /** 感受器类型 */
  readonly type: string;
  
  /** 配置 */
  readonly config: ReceptorConfig;
  
  /** 接收信息 */
  receive(info: InformationStructure): boolean;
  
  /** 处理（黑盒） */
  process(): Promise<InformationStructure | null>;
  
  /** 获取状态 */
  getState(): ReceptorState;
  
  /** 衰减活跃度 */
  decay(rate: number): void;
}

// ─────────────────────────────────────────────────────────────────────
// 基础感受器
// ─────────────────────────────────────────────────────────────────────

/**
 * 抽象基础感受器
 */
abstract class BaseReceptor implements Receptor {
  readonly id: string;
  readonly type: string;
  readonly config: ReceptorConfig;
  
  protected state: ReceptorState;
  
  constructor(type: string, config: Partial<ReceptorConfig> = {}) {
    this.type = type;
    this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      acceptsTypes: config.acceptsTypes || [],
      sensitivityThreshold: config.sensitivityThreshold || 0.1,
      maxQueueLength: config.maxQueueLength || 10,
      outputsType: config.outputsType || 'unknown'
    };
    
    this.state = {
      id: this.id,
      type: this.type,
      activation: 0,
      inputQueue: [],
      lastOutput: null,
      receiveCount: 0,
      outputCount: 0
    };
  }
  
  receive(info: InformationStructure): boolean {
    // 检查类型是否匹配
    if (this.config.acceptsTypes.length > 0 && 
        !this.config.acceptsTypes.includes(info.type)) {
      return false;
    }
    
    // 检查强度是否足够
    if (info.intensity < this.config.sensitivityThreshold) {
      return false;
    }
    
    // 加入队列
    this.state.inputQueue.push(info);
    if (this.state.inputQueue.length > this.config.maxQueueLength) {
      this.state.inputQueue.shift();
    }
    
    // 更新活跃度
    this.state.activation = Math.min(1, this.state.activation + info.intensity);
    this.state.receiveCount++;
    
    return true;
  }
  
  abstract process(): Promise<InformationStructure | null>;
  
  getState(): ReceptorState {
    return { ...this.state };
  }
  
  decay(rate: number): void {
    this.state.activation *= (1 - rate);
    if (this.state.activation < 0.01) {
      this.state.activation = 0;
    }
  }
  
  protected setOutput(output: InformationStructure): void {
    this.state.lastOutput = output;
    this.state.outputCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 具体感受器
// ─────────────────────────────────────────────────────────────────────

/**
 * 检索感受器
 * 
 * 接收稀疏向量结构，进行相似度匹配
 * 
 * 变换目的：稀疏向量便于快速匹配
 */
export class RetrievalReceptor extends BaseReceptor {
  private memory: SparseVectorStructure[] = [];
  
  constructor() {
    super('retrieval', {
      acceptsTypes: ['sparse-vector'],
      sensitivityThreshold: 0.01,
      outputsType: 'sparse-vector'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop() as SparseVectorStructure;
    
    // 检索：找最相似的已存储信息
    let bestMatch: SparseVectorStructure | null = null;
    let bestSimilarity = 0;
    
    for (const stored of this.memory) {
      if (stored instanceof SparseVectorStructure) {
        const similarity = input.cosineSimilarity(stored);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = stored;
        }
      }
    }
    
    // 存储当前输入
    this.memory.push(input);
    if (this.memory.length > 1000) {
      this.memory.shift();
    }
    
    // 输出最相似的（如果找到）
    if (bestMatch && bestSimilarity > 0.5) {
      this.setOutput(bestMatch);
      return bestMatch;
    }
    
    // 没有找到，返回输入本身
    this.setOutput(input);
    return input;
  }
  
  /**
   * 添加到记忆
   */
  memorize(info: SparseVectorStructure): void {
    this.memory.push(info);
  }
}

/**
 * 语义感受器
 * 
 * 接收稠密向量结构，进行语义计算
 * 
 * 变换目的：稠密向量捕获语义相似性
 */
export class SemanticReceptor extends BaseReceptor {
  private embeddings: Map<string, DenseVectorStructure> = new Map();
  
  constructor() {
    super('semantic', {
      acceptsTypes: ['dense-vector'],
      sensitivityThreshold: 0.1,
      outputsType: 'dense-vector'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop() as DenseVectorStructure;
    
    // 存储向量
    this.embeddings.set(input.id, input);
    
    // 找语义相似的
    const similar: Array<{ id: string; similarity: number }> = [];
    
    for (const [id, vec] of this.embeddings) {
      if (id !== input.id) {
        const similarity = input.cosineSimilarity(vec);
        if (similarity > 0.7) {
          similar.push({ id, similarity });
        }
      }
    }
    
    // 如果有相似的，融合它们
    if (similar.length > 0) {
      similar.sort((a, b) => b.similarity - a.similarity);
      
      // 取最相似的几个融合
      const topSimilar = similar.slice(0, 3);
      let fused = input;
      
      for (const { id, similarity } of topSimilar) {
        const vec = this.embeddings.get(id)!;
        fused = fused.add(vec.scale(similarity * 0.3));
      }
      
      this.setOutput(fused);
      return fused;
    }
    
    this.setOutput(input);
    return input;
  }
}

/**
 * 关联感受器
 * 
 * 接收注意力结构，进行关联融合
 * 
 * 变换目的：注意力结构表示信息间的关联
 */
export class AssociationReceptor extends BaseReceptor {
  private associatedInfo: Map<string, InformationStructure> = new Map();
  
  constructor() {
    super('association', {
      acceptsTypes: ['attention'],
      sensitivityThreshold: 0.1,
      outputsType: 'attention'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop() as AttentionStructure;
    
    // 获取最受关注的信息
    const topAttended = input.getTopAttended();
    
    // 存储关联
    this.associatedInfo.set(input.queryId, input);
    
    // 如果有关联信息，强化关联
    if (topAttended.weight > 0.3) {
      console.log(`[Association] ${input.queryId} → ${topAttended.id} (${(topAttended.weight * 100).toFixed(0)}%)`);
    }
    
    this.setOutput(input);
    return input;
  }
  
  /**
   * 获取与某信息关联的所有信息
   */
  getAssociated(id: string): string[] {
    const attention = this.associatedInfo.get(id);
    if (attention && attention instanceof AttentionStructure) {
      return attention.keyIds;
    }
    return [];
  }
}

/**
 * 结构感受器
 * 
 * 接收键值对结构，提取结构化信息
 * 
 * 变换目的：键值对便于提取属性
 */
export class StructureReceptor extends BaseReceptor {
  private schemas: Map<string, Set<string>> = new Map();
  
  constructor() {
    super('structure', {
      acceptsTypes: ['key-value'],
      sensitivityThreshold: 0.1,
      outputsType: 'key-value'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop() as KeyValueStructure;
    
    // 学习 schema（哪些键经常出现）
    const keys = Array.from(input.data.keys());
    const schemaKey = keys.sort().join(',');
    
    if (!this.schemas.has(schemaKey)) {
      this.schemas.set(schemaKey, new Set(keys));
      console.log(`[Structure] 新 schema: ${keys.join(', ')}`);
    }
    
    this.setOutput(input);
    return input;
  }
  
  /**
   * 获取已学习的 schemas
   */
  getSchemas(): string[][] {
    return Array.from(this.schemas.values()).map(s => Array.from(s));
  }
}

/**
 * 序列感受器
 * 
 * 接收序列结构，处理有序信息
 * 
 * 变换目的：序列结构保留顺序信息
 */
export class SequenceReceptor extends BaseReceptor {
  private sequences: SequenceStructure[] = [];
  
  constructor() {
    super('sequence', {
      acceptsTypes: ['sequence'],
      sensitivityThreshold: 0.1,
      outputsType: 'sequence'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop() as SequenceStructure;
    
    // 存储序列
    this.sequences.push(input);
    if (this.sequences.length > 100) {
      this.sequences.shift();
    }
    
    // 分析序列模式（简化：统计元素数量分布）
    const lengths = this.sequences.map(s => s.elements.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    console.log(`[Sequence] 序列长度: ${input.elements.length}, 平均: ${avgLength.toFixed(1)}`);
    
    this.setOutput(input);
    return input;
  }
  
  /**
   * 获取最近的序列
   */
  getRecentSequences(count: number = 10): SequenceStructure[] {
    return this.sequences.slice(-count);
  }
}

/**
 * 图感受器
 * 
 * 接收图结构，处理网络信息
 * 
 * 变换目的：图结构表示复杂关联
 */
export class GraphReceptor extends BaseReceptor {
  private globalGraph: GraphStructure | null = null;
  
  constructor() {
    super('graph', {
      acceptsTypes: ['graph'],
      sensitivityThreshold: 0.1,
      outputsType: 'graph'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop() as GraphStructure;
    
    // 合并到全局图
    if (!this.globalGraph) {
      this.globalGraph = input;
    } else {
      this.globalGraph = this.mergeGraphs(this.globalGraph, input);
    }
    
    console.log(`[Graph] 节点: ${input.nodes.size}, 边: ${input.edges.length}`);
    
    this.setOutput(input);
    return input;
  }
  
  /**
   * 合并两个图
   */
  private mergeGraphs(a: GraphStructure, b: GraphStructure): GraphStructure {
    const mergedNodes = new Map(a.nodes);
    for (const [id, node] of b.nodes) {
      mergedNodes.set(id, node);
    }
    
    const mergedEdges = [...a.edges, ...b.edges];
    
    return new GraphStructure(
      `graph_merged_${Date.now()}`,
      'merged',
      mergedNodes,
      mergedEdges
    );
  }
  
  /**
   * 获取全局图
   */
  getGlobalGraph(): GraphStructure | null {
    return this.globalGraph;
  }
}

/**
 * 多模态感受器
 * 
 * 接收多种类型的信息结构
 */
export class MultimodalReceptor extends BaseReceptor {
  private receivedTypes: Map<string, number> = new Map();
  
  constructor() {
    super('multimodal', {
      acceptsTypes: [], // 接受所有类型
      sensitivityThreshold: 0.05,
      outputsType: 'key-value'
    });
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop()!;
    
    // 统计接收的类型
    this.receivedTypes.set(input.type, (this.receivedTypes.get(input.type) || 0) + 1);
    
    // 转换为键值对结构
    const data = new Map<string, unknown>();
    data.set('originalType', input.type);
    data.set('source', input.source);
    data.set('intensity', input.intensity);
    data.set('timestamp', input.timestamp);
    
    const output = new KeyValueStructure(
      `multimodal_${Date.now()}`,
      input.source,
      data
    );
    
    this.setOutput(output);
    return output;
  }
  
  /**
   * 获取接收统计
   */
  getTypeStats(): Map<string, number> {
    return new Map(this.receivedTypes);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 感受器注册表
// ─────────────────────────────────────────────────────────────────────

/**
 * 感受器注册表
 */
export class ReceptorRegistry {
  private receptors: Map<string, Receptor> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  
  constructor() {
    // 注册默认感受器
    this.register(new RetrievalReceptor());
    this.register(new SemanticReceptor());
    this.register(new AssociationReceptor());
    this.register(new StructureReceptor());
    this.register(new SequenceReceptor());
    this.register(new GraphReceptor());
    this.register(new MultimodalReceptor());
  }
  
  register(receptor: Receptor): void {
    this.receptors.set(receptor.id, receptor);
    
    // 建立类型索引
    for (const type of receptor.config.acceptsTypes) {
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, new Set());
      }
      this.typeIndex.get(type)!.add(receptor.id);
    }
  }
  
  get(id: string): Receptor | undefined {
    return this.receptors.get(id);
  }
  
  /**
   * 获取能接收指定类型的感受器
   */
  getByAcceptedType(type: string): Receptor[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.receptors.get(id)!).filter(Boolean);
  }
  
  /**
   * 获取所有感受器
   */
  getAll(): Receptor[] {
    return Array.from(this.receptors.values());
  }
  
  /**
   * 将信息分发给合适的感受器
   */
  dispatch(info: InformationStructure): Receptor[] {
    const matching = this.getByAcceptedType(info.type);
    const accepted: Receptor[] = [];
    
    for (const receptor of matching) {
      if (receptor.receive(info)) {
        accepted.push(receptor);
      }
    }
    
    // 也分发给多模态感受器（接受所有类型）
    const multimodal = this.getAll().filter(r => 
      r.type === 'multimodal' && r.config.acceptsTypes.length === 0
    );
    
    for (const receptor of multimodal) {
      if (receptor.receive(info)) {
        accepted.push(receptor);
      }
    }
    
    return accepted;
  }
}

// 默认注册表实例
export const receptorRegistry = new ReceptorRegistry();
