/**
 * 神经网络管理器
 * Neural Network Manager
 * 
 * 核心组件：整合神经元、突触、神经递质
 * 
 * 职责：
 * 1. 管理所有神经元
 * 2. 协调神经递质流动
 * 3. 执行网络演化
 * 4. 学习与生长
 * 
 * 工作流程：
 * 输入 → 神经递质 → 感觉神经元 → 概念/功能神经元 → 运动神经元 → 输出
 */

import {
  Neurotransmitter,
  NeurotransmitterType,
  NeurotransmitterFactory,
  getNeurotransmitterPool,
  getNeurotransmitterFactory,
} from './neurotransmitter';

import {
  Neuron,
  NeuronType,
  NeuronState,
  NeuronBehavior,
  NeuronFactory,
  getNeuronFactory,
} from './neuron-system';

import {
  Synapse,
  SynapseManager,
  SynapseState,
  getSynapseManager,
} from './synapse-manager';

import { getEmbeddingManager } from './embedding-manager';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 网络统计信息
 */
export interface NetworkStats {
  /** 神经元数量 */
  neuronCount: number;
  /** 突触数量 */
  synapseCount: number;
  /** 活跃递质数量 */
  activeTransmitters: number;
  /** 按类型统计神经元 */
  neuronsByType: Record<NeuronType, number>;
  /** 平均激活值 */
  avgActivation: number;
  /** 最近发放的神经元 */
  recentlyFired: string[];
  /** 网络健康度 */
  health: number;
}

/**
 * 演化结果
 */
export interface EvolutionResult {
  /** 发放的神经元 */
  firedNeurons: string[];
  /** 产生的神经递质 */
  newTransmitters: Neurotransmitter[];
  /** 更新的突触 */
  updatedSynapses: string[];
  /** 是否产生输出 */
  hasOutput: boolean;
  /** 输出内容 */
  output?: Neurotransmitter;
}

/**
 * 学习结果
 */
export interface LearningResult {
  /** 新创建的神经元 */
  newNeurons: Neuron[];
  /** 新创建的突触 */
  newSynapses: Synapse[];
  /** 更新的突触 */
  updatedSynapses: Synapse[];
  /** 学习描述 */
  description: string;
}

/**
 * 网络配置
 */
interface NetworkConfig {
  /** 最大神经元数量 */
  maxNeurons: number;
  
  /** 最大突触数量 */
  maxSynapses: number;
  
  /** 演化间隔（毫秒） */
  evolutionInterval: number;
  
  /** 自动学习 */
  autoLearning: boolean;
  
  /** 学习阈值：重要性超过此值才会创建新神经元 */
  learningThreshold: number;
  
  /** 默认连接数：新神经元自动连接多少个相关神经元 */
  defaultConnections: number;
}

const DEFAULT_CONFIG: NetworkConfig = {
  maxNeurons: 100000,
  maxSynapses: 1000000,
  evolutionInterval: 50, // 50ms
  autoLearning: true,
  learningThreshold: 0.6,
  defaultConnections: 5,
};

/**
 * 神经网络
 */
export class NeuralNetwork {
  /** 所有神经元 */
  private neurons: Map<string, Neuron> = new Map();
  
  /** 按类型索引 */
  private neuronsByType: Map<NeuronType, Set<string>> = new Map();
  
  /** 空间索引（用于快速查找相关神经元） */
  private spatialIndex: Map<string, number[]> = new Map(); // neuronId -> vector hash
  
  /** 突触管理器 */
  private synapseManager: SynapseManager;
  
  /** 神经递质工厂 */
  private transmitterFactory: NeurotransmitterFactory;
  
  /** 神经递质池 */
  private transmitterPool = getNeurotransmitterPool();
  
  /** 神经元工厂 */
  private neuronFactory: NeuronFactory;
  
  /** 神经元行为 */
  private neuronBehavior: NeuronBehavior;
  
  /** 配置 */
  private config: NetworkConfig;
  
  /** 数据库客户端 */
  private supabase = getSupabaseClient();
  
  /** 嵌入管理器 */
  private embeddingManager = getEmbeddingManager();
  
  /** 是否已初始化 */
  private initialized: boolean = false;
  
  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.synapseManager = getSynapseManager();
    this.transmitterFactory = getNeurotransmitterFactory();
    this.neuronFactory = getNeuronFactory();
    this.neuronBehavior = this.neuronFactory.getBehavior();
  }
  
  /**
   * 初始化网络
   * 
   * 创建基础神经元结构
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[NeuralNetwork] Initializing...');
    
    // 1. 尝试从数据库加载
    const loaded = await this.loadFromDatabase();
    
    if (!loaded || this.neurons.size === 0) {
      // 2. 创建基础神经元
      await this.createSeedNeurons();
    }
    
    this.initialized = true;
    console.log(`[NeuralNetwork] Initialized with ${this.neurons.size} neurons, ${this.synapseManager.getStats().total} synapses`);
  }
  
  /**
   * 创建种子神经元
   */
  private async createSeedNeurons(): Promise<void> {
    // 1. 创建感觉神经元
    await this.createSensoryNeurons();
    
    // 2. 创建功能神经元
    await this.createFunctionNeurons();
    
    // 3. 创建运动神经元
    await this.createMotorNeurons();
    
    // 4. 创建基础概念神经元
    await this.createBasicConcepts();
  }
  
  /**
   * 创建感觉神经元
   */
  private async createSensoryNeurons(): Promise<void> {
    const sensoryTypes: Array<'text' | 'emotion' | 'intent'> = ['text', 'emotion', 'intent'];
    
    for (const type of sensoryTypes) {
      // 创建多个感受野不同的感觉神经元
      for (let i = 0; i < 3; i++) {
        const vector = await this.generateRandomVector(1024);
        const neuron = this.neuronFactory.createSensoryNeuron(type, vector, `${type}_sensor_${i}`);
        this.addNeuron(neuron);
      }
    }
  }
  
  /**
   * 创建功能神经元
   */
  private async createFunctionNeurons(): Promise<void> {
    const functionTypes: Array<'reasoning' | 'association' | 'attention' | 'emotion'> = 
      ['reasoning', 'association', 'attention', 'emotion'];
    
    for (const type of functionTypes) {
      for (let i = 0; i < 2; i++) {
        const vector = await this.generateRandomVector(1024);
        const neuron = this.neuronFactory.createFunctionNeuron(type, vector);
        this.addNeuron(neuron);
      }
    }
  }
  
  /**
   * 创建运动神经元
   */
  private async createMotorNeurons(): Promise<void> {
    for (const type of ['response', 'action'] as const) {
      for (let i = 0; i < 2; i++) {
        const vector = await this.generateRandomVector(1024);
        const neuron = this.neuronFactory.createMotorNeuron(type, vector);
        this.addNeuron(neuron);
      }
    }
  }
  
  /**
   * 创建基础概念神经元
   */
  private async createBasicConcepts(): Promise<void> {
    const basicConcepts = [
      '问候', '感谢', '道歉', '请求', '问题',
      '快乐', '悲伤', '愤怒', '恐惧', '惊讶',
      '工作', '生活', '学习', '健康', '关系',
    ];
    
    for (const concept of basicConcepts) {
      const vector = await this.embeddingManager.embed(concept, 'text-standard');
      const neuron = this.neuronFactory.createConceptNeuron(concept, vector, 0.7);
      this.addNeuron(neuron);
    }
  }
  
  /**
   * 添加神经元到网络
   */
  private addNeuron(neuron: Neuron): void {
    this.neurons.set(neuron.id, neuron);
    
    // 类型索引
    if (!this.neuronsByType.has(neuron.type)) {
      this.neuronsByType.set(neuron.type, new Set());
    }
    this.neuronsByType.get(neuron.type)!.add(neuron.id);
    
    // 空间索引（简化版：使用向量前几维作为hash）
    this.spatialIndex.set(neuron.id, neuron.receptiveField.slice(0, 16));
  }
  
  /**
   * 处理输入
   * 
   * 将文本输入转换为神经活动
   */
  async processInput(text: string): Promise<void> {
    // 1. 创建输入神经递质
    const transmitter = await this.transmitterFactory.fromText(text, {
      sourceNeuron: 'INPUT',
      intensity: 0.9,
    });
    
    // 2. 找到敏感的感觉神经元
    const sensoryNeurons = this.getNeuronsByTypes([
      NeuronType.SENSORY_TEXT,
      NeuronType.SENSORY_EMOTION,
      NeuronType.SENSORY_INTENT,
    ]);
    
    // 3. 递质到达感觉神经元
    for (const neuron of sensoryNeurons) {
      const result = this.neuronBehavior.receiveTransmitter(neuron, transmitter);
      if (result.accepted) {
        console.log(`[NeuralNetwork] ${neuron.label} accepted transmitter (match: ${result.matchScore.toFixed(2)})`);
      }
    }
  }
  
  /**
   * 网络演化
   * 
   * 执行一次完整的神经活动周期
   */
  evolve(): EvolutionResult {
    const result: EvolutionResult = {
      firedNeurons: [],
      newTransmitters: [],
      updatedSynapses: [],
      hasOutput: false,
    };
    
    // 1. 整合阶段：所有神经元整合输入
    for (const neuron of this.neurons.values()) {
      this.neuronBehavior.integrate(neuron);
    }
    
    // 2. 发放阶段：检查哪些神经元应该发放
    const firingCandidates: Neuron[] = [];
    for (const neuron of this.neurons.values()) {
      if (this.neuronBehavior.shouldFire(neuron)) {
        firingCandidates.push(neuron);
      }
    }
    
    // 3. 按激活强度排序（最强的先发放）
    firingCandidates.sort((a, b) => b.activation - a.activation);
    
    // 4. 发放并传递
    for (const neuron of firingCandidates) {
      const outputType = this.determineOutputType(neuron.type);
      const fireResult = this.neuronBehavior.fire(neuron, outputType);
      
      if (fireResult) {
        result.firedNeurons.push(neuron.id);
        result.newTransmitters.push(fireResult.transmitter);
        
        // 通过突触传递
        const outgoingSynapses = this.synapseManager.getOutgoing(neuron.id);
        for (const synapse of outgoingSynapses) {
          if (synapse.state === SynapseState.ACTIVE || synapse.state === SynapseState.STRENGTHENED) {
            const target = this.neurons.get(synapse.targetId);
            if (target) {
              const transmitResult = this.synapseManager.transmit(synapse, fireResult.transmitter);
              
              if (transmitResult.transmitted) {
                // 创建加权后的递质副本
                const weightedTransmitter: Neurotransmitter = {
                  ...fireResult.transmitter,
                  id: `${fireResult.transmitter.id}-${synapse.id}`,
                  intensity: transmitResult.weightedIntensity,
                  targetNeuron: target.id,
                };
                
                result.newTransmitters.push(weightedTransmitter);
                
                // 目标神经元接收
                this.neuronBehavior.receiveTransmitter(target, weightedTransmitter);
                
                // Hebbian学习
                this.synapseManager.hebbianLearning(
                  synapse,
                  true,
                  this.neuronBehavior.shouldFire(target),
                  0 // 同一轮，时间差为0
                );
                
                result.updatedSynapses.push(synapse.id);
              }
            }
          }
        }
        
        // 检查是否是运动神经元输出
        if (neuron.type === NeuronType.MOTOR_RESPONSE) {
          result.hasOutput = true;
          result.output = fireResult.transmitter;
        }
      }
    }
    
    // 5. 神经元进入静息态
    for (const neuron of this.neurons.values()) {
      this.neuronBehavior.rest(neuron);
    }
    
    return result;
  }
  
  /**
   * 多轮演化直到产生输出
   */
  async evolveUntilOutput(maxRounds: number = 10): Promise<EvolutionResult[]> {
    const results: EvolutionResult[] = [];
    
    for (let i = 0; i < maxRounds; i++) {
      const result = this.evolve();
      results.push(result);
      
      if (result.hasOutput) {
        break;
      }
      
      // 等待一个演化间隔
      await new Promise(resolve => setTimeout(resolve, this.config.evolutionInterval));
    }
    
    return results;
  }
  
  /**
   * 从对话中学习
   */
  async learnFromConversation(
    input: string,
    response: string,
    feedback?: { positive: boolean; reason?: string }
  ): Promise<LearningResult> {
    const result: LearningResult = {
      newNeurons: [],
      newSynapses: [],
      updatedSynapses: [],
      description: '',
    };
    
    // 1. 提取重要概念
    const concepts = await this.extractConcepts(input, response);
    
    for (const concept of concepts) {
      // 检查是否已存在相似概念
      const similar = await this.findSimilarNeurons(concept.vector, [NeuronType.CONCEPT], 0.85);
      
      if (similar.length === 0) {
        // 创建新概念神经元
        const neuron = this.neuronFactory.createConceptNeuron(concept.label, concept.vector, concept.importance);
        this.addNeuron(neuron);
        result.newNeurons.push(neuron);
        
        // 自动连接到相关神经元
        const connections = await this.autoConnect(neuron);
        result.newSynapses.push(...connections);
      } else {
        // 更新已有概念的重要性
        for (const existing of similar.slice(0, 1)) {
          existing.metadata.importance = Math.min(1, existing.metadata.importance + 0.1);
        }
      }
    }
    
    // 2. 创建经历神经元（如果是重要交互）
    if (this.isImportantInteraction(input, response)) {
      const episodeVector = await this.embeddingManager.embed(`${input} → ${response}`, 'text-standard');
      const episodeNeuron = this.neuronFactory.createMemoryNeuron(
        `${input.slice(0, 30)}...`,
        episodeVector,
        feedback?.positive ? 0.5 : 0
      );
      this.addNeuron(episodeNeuron);
      result.newNeurons.push(episodeNeuron);
      
      // 连接
      const connections = await this.autoConnect(episodeNeuron);
      result.newSynapses.push(...connections);
    }
    
    // 3. 应用反馈（如果有）
    if (feedback) {
      const rewardValue = feedback.positive ? 0.3 : -0.2;
      this.transmitterFactory.createReward('LEARNING', rewardValue, feedback.reason || 'user feedback');
      
      // 强化或削弱相关突触
      // TODO: 实现基于奖励的学习
    }
    
    result.description = `Learned ${result.newNeurons.length} new neurons, ${result.newSynapses.length} new synapses`;
    
    return result;
  }
  
  /**
   * 自动连接新神经元
   */
  private async autoConnect(neuron: Neuron): Promise<Synapse[]> {
    const newSynapses: Synapse[] = [];
    
    // 找到相关神经元
    const related = await this.findSimilarNeurons(
      neuron.receptiveField,
      undefined,
      0.5
    );
    
    // 选择最强的几个连接
    const topRelated = related
      .filter(n => n.id !== neuron.id)
      .slice(0, this.config.defaultConnections);
    
    for (const target of topRelated) {
      // 创建双向连接
      const synapse1 = this.synapseManager.create(neuron.id, target.id, {
        weight: 0.5,
        reason: 'auto-connect',
      });
      newSynapses.push(synapse1);
      
      const synapse2 = this.synapseManager.create(target.id, neuron.id, {
        weight: 0.3,
        reason: 'auto-connect-back',
      });
      newSynapses.push(synapse2);
      
      // 更新神经元的突触引用
      neuron.outputs.push({ id: synapse1.id, targetId: target.id, weight: synapse1.weight });
      target.inputs.push({ id: synapse1.id, targetId: neuron.id, weight: synapse1.weight });
      target.outputs.push({ id: synapse2.id, targetId: neuron.id, weight: synapse2.weight });
      neuron.inputs.push({ id: synapse2.id, targetId: target.id, weight: synapse2.weight });
    }
    
    return newSynapses;
  }
  
  /**
   * 查找相似神经元
   */
  private async findSimilarNeurons(
    vector: number[],
    types?: NeuronType[],
    threshold: number = 0.7
  ): Promise<Neuron[]> {
    const candidates = types
      ? this.getNeuronsByTypes(types)
      : Array.from(this.neurons.values());
    
    const similar: Array<{ neuron: Neuron; similarity: number }> = [];
    
    for (const neuron of candidates) {
      const similarity = this.cosineSimilarity(vector, neuron.receptiveField);
      if (similarity >= threshold) {
        similar.push({ neuron, similarity });
      }
    }
    
    // 按相似度排序
    similar.sort((a, b) => b.similarity - a.similarity);
    
    return similar.map(s => s.neuron);
  }
  
  /**
   * 获取特定类型的神经元
   */
  private getNeuronsByTypes(types: NeuronType[]): Neuron[] {
    const result: Neuron[] = [];
    for (const type of types) {
      const ids = this.neuronsByType.get(type);
      if (ids) {
        for (const id of ids) {
          const neuron = this.neurons.get(id);
          if (neuron) result.push(neuron);
        }
      }
    }
    return result;
  }
  
  /**
   * 确定神经元输出递质类型
   */
  private determineOutputType(neuronType: NeuronType): NeurotransmitterType {
    const mapping: Record<NeuronType, NeurotransmitterType> = {
      [NeuronType.SENSORY_TEXT]: NeurotransmitterType.TEXT,
      [NeuronType.SENSORY_EMOTION]: NeurotransmitterType.EMOTION,
      [NeuronType.SENSORY_INTENT]: NeurotransmitterType.INTENT,
      [NeuronType.CONCEPT]: NeurotransmitterType.CONCEPT,
      [NeuronType.ENTITY]: NeurotransmitterType.CONCEPT,
      [NeuronType.EPISODE]: NeurotransmitterType.MEMORY,
      [NeuronType.PATTERN]: NeurotransmitterType.ASSOCIATION,
      [NeuronType.REASONING]: NeurotransmitterType.ASSOCIATION,
      [NeuronType.ASSOCIATION]: NeurotransmitterType.ASSOCIATION,
      [NeuronType.ATTENTION]: NeurotransmitterType.ATTENTION,
      [NeuronType.EMOTION_PROCESS]: NeurotransmitterType.EMOTION,
      [NeuronType.MOTOR_RESPONSE]: NeurotransmitterType.RESPONSE,
      [NeuronType.MOTOR_ACTION]: NeurotransmitterType.ACTION,
      [NeuronType.MODULATOR]: NeurotransmitterType.ATTENTION,
      [NeuronType.CONSCIOUSNESS]: NeurotransmitterType.ATTENTION,
      [NeuronType.SELF]: NeurotransmitterType.ATTENTION,
    };
    return mapping[neuronType] || NeurotransmitterType.ASSOCIATION;
  }
  
  /**
   * 提取概念
   */
  private async extractConcepts(
    input: string,
    response: string
  ): Promise<Array<{ label: string; vector: number[]; importance: number }>> {
    // 简单实现：提取关键词
    // TODO: 使用LLM提取概念
    const concepts: Array<{ label: string; vector: number[]; importance: number }> = [];
    
    const keywords = this.extractKeywords(`${input} ${response}`);
    
    for (const keyword of keywords.slice(0, 5)) {
      const vector = await this.embeddingManager.embed(keyword, 'text-standard');
      concepts.push({
        label: keyword,
        vector,
        importance: 0.5,
      });
    }
    
    return concepts;
  }
  
  /**
   * 提取关键词（简单实现）
   */
  private extractKeywords(text: string): string[] {
    // 移除常见停用词
    const stopWords = new Set(['的', '是', '在', '了', '和', '与', '或', '这', '那', '我', '你', '他', '她', '它']);
    
    const words = text.split(/[\s,，。！？!?.]+/).filter(w => {
      return w.length >= 2 && !stopWords.has(w);
    });
    
    // 去重
    return [...new Set(words)];
  }
  
  /**
   * 判断是否重要交互
   */
  private isImportantInteraction(input: string, response: string): boolean {
    // 简单判断：长度或情感强度
    const hasEmotion = /开心|难过|生气|担心|感谢|抱歉/.test(input);
    const isLong = input.length > 50 || response.length > 100;
    
    return hasEmotion || isLong;
  }
  
  /**
   * 获取网络统计
   */
  getStats(): NetworkStats {
    const synapseStats = this.synapseManager.getStats();
    const transmitterStats = this.transmitterPool.getStats();
    
    const neuronsByType: Record<NeuronType, number> = {} as Record<NeuronType, number>;
    for (const [type, ids] of this.neuronsByType) {
      neuronsByType[type] = ids.size;
    }
    
    let totalActivation = 0;
    const recentlyFired: string[] = [];
    const now = Date.now();
    
    for (const neuron of this.neurons.values()) {
      totalActivation += neuron.activation;
      if (now - neuron.lastFired < 1000) {
        recentlyFired.push(neuron.id);
      }
    }
    
    const avgActivation = this.neurons.size > 0 ? totalActivation / this.neurons.size : 0;
    
    // 健康度：基于活跃神经元比例
    const activeCount = Array.from(this.neurons.values())
      .filter(n => n.state !== NeuronState.IDLE).length;
    const health = this.neurons.size > 0 ? activeCount / this.neurons.size : 0;
    
    return {
      neuronCount: this.neurons.size,
      synapseCount: synapseStats.total,
      activeTransmitters: transmitterStats.total,
      neuronsByType,
      avgActivation,
      recentlyFired,
      health,
    };
  }
  
  /**
   * 保存到数据库
   */
  async saveToDatabase(): Promise<void> {
    // 保存神经元
    const neuronRecords = Array.from(this.neurons.values()).map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      receptive_field: n.receptiveField,
      receptive_radius: n.receptiveRadius,
      state: n.state,
      activation: n.activation,
      threshold: n.threshold,
      refractory_period: n.refractoryPeriod,
      last_fired: n.lastFired,
      fire_count: n.metadata.fireCount,
      total_activation: n.metadata.totalActivation,
      importance: n.metadata.importance,
      last_activated: n.metadata.lastActivated,
      source: n.metadata.source,
      tags: n.metadata.tags,
      created_at: n.metadata.createdAt,
    }));
    
    if (neuronRecords.length > 0) {
      const { error } = await this.supabase
        .from('neurons')
        .upsert(neuronRecords, { onConflict: 'id' });
      
      if (error) {
        console.error('[NeuralNetwork] Save neurons error:', error);
      }
    }
    
    // 保存突触
    await this.synapseManager.saveToDatabase();
  }
  
  /**
   * 从数据库加载
   */
  async loadFromDatabase(): Promise<boolean> {
    // 加载神经元
    const { data: neuronData, error: neuronError } = await this.supabase
      .from('neurons')
      .select('*')
      .limit(10000);
    
    if (neuronError || !neuronData) {
      console.error('[NeuralNetwork] Load neurons error:', neuronError);
      return false;
    }
    
    for (const record of neuronData) {
      const neuron: Neuron = {
        id: record.id,
        type: record.type as NeuronType,
        label: record.label,
        receptiveField: record.receptive_field,
        receptiveRadius: record.receptive_radius,
        state: record.state as NeuronState,
        activation: record.activation,
        threshold: record.threshold,
        refractoryPeriod: record.refractory_period,
        lastFired: record.last_fired,
        pendingTransmitters: [],
        outputs: [],
        inputs: [],
        metadata: {
          createdAt: record.created_at,
          fireCount: record.fire_count,
          totalActivation: record.total_activation,
          importance: record.importance,
          lastActivated: record.last_activated,
          source: record.source,
          tags: record.tags || [],
        },
      };
      
      this.neurons.set(neuron.id, neuron);
      
      if (!this.neuronsByType.has(neuron.type)) {
        this.neuronsByType.set(neuron.type, new Set());
      }
      this.neuronsByType.get(neuron.type)!.add(neuron.id);
    }
    
    // 加载突触
    await this.synapseManager.loadFromDatabase();
    
    console.log(`[NeuralNetwork] Loaded ${this.neurons.size} neurons from database`);
    return true;
  }
  
  /**
   * 生成随机向量
   */
  private async generateRandomVector(dimension: number): Promise<number[]> {
    const vector: number[] = [];
    for (let i = 0; i < dimension; i++) {
      vector.push(Math.random() * 2 - 1);
    }
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    if (minLen === 0) return 0;
    
    let dot = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < minLen; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ==================== 单例管理 ====================

let globalNetwork: NeuralNetwork | null = null;

/**
 * 获取全局神经网络
 */
export function getNeuralNetwork(): NeuralNetwork {
  if (!globalNetwork) {
    globalNetwork = new NeuralNetwork();
  }
  return globalNetwork;
}

/**
 * 初始化神经网络
 */
export async function initializeNeuralNetwork(): Promise<NeuralNetwork> {
  const network = getNeuralNetwork();
  await network.initialize();
  return network;
}
