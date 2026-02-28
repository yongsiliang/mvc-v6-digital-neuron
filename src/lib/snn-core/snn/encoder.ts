/**
 * ═══════════════════════════════════════════════════════════════════════
 * 脉冲编码器 - 文本到脉冲的转换
 * 
 * 将文本/数值输入转换为脉冲序列
 * 
 * 编码方式：
 * 1. 频率编码：脉冲频率表示强度
 * 2. 时间编码：脉冲时间表示顺序/优先级
 * 3. 群体编码：神经元群体表示信息
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  NeuronId,
  EncodingType,
  EncodingConfig,
  TextToSpikeResult,
  SpikeTrain
} from '../types';

/**
 * 脉冲编码器
 */
export class SpikeEncoder {
  private config: EncodingConfig;
  
  // 神经元到概念/词的映射
  private neuronToConcept: Map<NeuronId, string> = new Map();
  private conceptToNeuron: Map<string, NeuronId[]> = new Map();
  
  // 下一个神经元 ID
  private nextNeuronId: number = 0;

  constructor(config: Partial<EncodingConfig> = {}) {
    this.config = {
      type: config.type ?? 'rate',
      rateEncoding: {
        maxRate: 100,
        duration: 50,
        ...config.rateEncoding
      },
      temporalEncoding: {
        windowSize: 50,
        precision: 1,
        ...config.temporalEncoding
      },
      populationEncoding: {
        populationSize: 10,
        overlap: 0.3,
        ...config.populationEncoding
      }
    };
  }

  /**
   * 注册概念到神经元的映射
   */
  registerConcept(concept: string, neuronIds: NeuronId[]): void {
    this.conceptToNeuron.set(concept, neuronIds);
    for (const id of neuronIds) {
      this.neuronToConcept.set(id, concept);
    }
  }

  /**
   * 为概念分配神经元
   */
  allocateNeuronsForConcept(concept: string, count: number = 1): NeuronId[] {
    const ids: NeuronId[] = [];
    for (let i = 0; i < count; i++) {
      const id = `enc_${this.nextNeuronId++}`;
      ids.push(id);
    }
    this.registerConcept(concept, ids);
    return ids;
  }

  /**
   * 将数值编码为脉冲序列
   */
  encodeValue(value: number, neuronIds: NeuronId[]): Map<NeuronId, SpikeTrain> {
    switch (this.config.type) {
      case 'rate':
        return this.encodeByRate(value, neuronIds);
      case 'temporal':
        return this.encodeByTemporal(value, neuronIds);
      case 'population':
        return this.encodeByPopulation(value, neuronIds);
      default:
        return this.encodeByRate(value, neuronIds);
    }
  }

  /**
   * 频率编码
   * 值越大，脉冲频率越高
   */
  private encodeByRate(value: number, neuronIds: NeuronId[]): Map<NeuronId, SpikeTrain> {
    const result = new Map<NeuronId, SpikeTrain>();
    
    // 归一化值到 [0, 1]
    const normalizedValue = Math.max(0, Math.min(1, value));
    const maxRate = this.config.rateEncoding!.maxRate;
    const duration = this.config.rateEncoding!.duration;
    
    // 计算目标脉冲数
    const targetSpikes = Math.round(normalizedValue * maxRate);
    
    for (const neuronId of neuronIds) {
      const spikes: number[] = [];
      
      // 在时间窗口内均匀分布脉冲
      if (targetSpikes > 0) {
        const interval = duration / targetSpikes;
        for (let i = 0; i < targetSpikes; i++) {
          // 添加一些随机性
          const jitter = (Math.random() - 0.5) * interval * 0.3;
          spikes.push(Math.round(i * interval + jitter));
        }
      }
      
      result.set(neuronId, { neuronId, spikes });
    }
    
    return result;
  }

  /**
   * 时间编码
   * 值越大，脉冲越早出现
   */
  private encodeByTemporal(value: number, neuronIds: NeuronId[]): Map<NeuronId, SpikeTrain> {
    const result = new Map<NeuronId, SpikeTrain>();
    
    const normalizedValue = Math.max(0, Math.min(1, value));
    const windowSize = this.config.temporalEncoding!.windowSize;
    
    for (const neuronId of neuronIds) {
      const spikes: number[] = [];
      
      // 值越大，脉冲时间越早
      const spikeTime = Math.round((1 - normalizedValue) * windowSize);
      spikes.push(spikeTime);
      
      result.set(neuronId, { neuronId, spikes });
    }
    
    return result;
  }

  /**
   * 群体编码
   * 使用神经元群体表示值，不同神经元有不同的感受野
   */
  private encodeByPopulation(value: number, neuronIds: NeuronId[]): Map<NeuronId, SpikeTrain> {
    const result = new Map<NeuronId, SpikeTrain>();
    
    const normalizedValue = Math.max(0, Math.min(1, value));
    const populationSize = this.config.populationEncoding!.populationSize;
    const overlap = this.config.populationEncoding!.overlap;
    
    // 为每个神经元分配感受野中心
    const sigma = overlap * populationSize / Math.PI;
    
    for (let i = 0; i < neuronIds.length && i < populationSize; i++) {
      const neuronId = neuronIds[i];
      const spikes: number[] = [];
      
      // 神经元的感受野中心
      const center = i / (populationSize - 1);
      
      // 高斯感受野
      const activation = Math.exp(-Math.pow(normalizedValue - center, 2) / (2 * sigma * sigma));
      
      // 根据激活强度生成脉冲
      if (activation > 0.1) {
        const spikeCount = Math.round(activation * 10);
        for (let j = 0; j < spikeCount; j++) {
          spikes.push(j * 5 + Math.round(Math.random() * 2));
        }
      }
      
      result.set(neuronId, { neuronId, spikes });
    }
    
    return result;
  }

  /**
   * 将文本编码为脉冲序列
   */
  encodeText(
    text: string,
    inputNeuronIds: NeuronId[],
    embedding?: number[]
  ): TextToSpikeResult {
    // 分词
    const tokens = this.tokenize(text);
    
    // 如果有嵌入向量，使用嵌入
    if (embedding && embedding.length > 0) {
      return this.encodeFromEmbedding(embedding, inputNeuronIds, text, tokens);
    }
    
    // 否则使用词频编码
    return this.encodeFromTokens(tokens, inputNeuronIds, text);
  }

  /**
   * 分词
   */
  private tokenize(text: string): string[] {
    // 简单分词：按空格和标点分割
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
    
    return tokens;
  }

  /**
   * 从嵌入向量编码
   */
  private encodeFromEmbedding(
    embedding: number[],
    inputNeuronIds: NeuronId[],
    text: string,
    tokens: string[]
  ): TextToSpikeResult {
    const inputSpikes = new Map<NeuronId, SpikeTrain>();
    let totalSpikes = 0;
    
    // 将嵌入维度映射到神经元
    const neuronsPerDim = Math.ceil(inputNeuronIds.length / embedding.length);
    
    for (let i = 0; i < embedding.length && i * neuronsPerDim < inputNeuronIds.length; i++) {
      const value = Math.abs(embedding[i]);
      const startIdx = i * neuronsPerDim;
      const endIdx = Math.min(startIdx + neuronsPerDim, inputNeuronIds.length);
      const neuronSlice = inputNeuronIds.slice(startIdx, endIdx);
      
      const spikeTrains = this.encodeValue(value, neuronSlice);
      
      for (const [neuronId, train] of spikeTrains) {
        inputSpikes.set(neuronId, train);
        totalSpikes += train.spikes.length;
      }
    }
    
    return {
      inputSpikes,
      encoding: {
        type: this.config.type,
        duration: this.config.rateEncoding!.duration,
        neuronCount: inputSpikes.size,
        totalSpikes
      },
      original: {
        text,
        tokens,
        embedding
      }
    };
  }

  /**
   * 从词 token 编码
   */
  private encodeFromTokens(
    tokens: string[],
    inputNeuronIds: NeuronId[],
    text: string
  ): TextToSpikeResult {
    const inputSpikes = new Map<NeuronId, SpikeTrain>();
    let totalSpikes = 0;
    
    // 为每个 token 分配神经元并编码
    const neuronsPerToken = Math.max(1, Math.floor(inputNeuronIds.length / Math.max(1, tokens.length)));
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const startIdx = i * neuronsPerToken;
      const endIdx = Math.min(startIdx + neuronsPerToken, inputNeuronIds.length);
      const neuronSlice = inputNeuronIds.slice(startIdx, endIdx);
      
      if (neuronSlice.length === 0) break;
      
      // 使用 token 的哈希值作为强度
      const hash = this.hashToken(token);
      const value = (hash % 100) / 100;
      
      const spikeTrains = this.encodeValue(value, neuronSlice);
      
      for (const [neuronId, train] of spikeTrains) {
        inputSpikes.set(neuronId, train);
        totalSpikes += train.spikes.length;
      }
    }
    
    return {
      inputSpikes,
      encoding: {
        type: this.config.type,
        duration: this.config.rateEncoding!.duration,
        neuronCount: inputSpikes.size,
        totalSpikes
      },
      original: {
        text,
        tokens
      }
    };
  }

  /**
   * 简单的 token 哈希
   */
  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 将脉冲序列转换为 SNN 输入格式
   * 返回每个时间步的输入电流
   */
  toTimeSeries(
    spikeTrains: Map<NeuronId, SpikeTrain>,
    duration: number
  ): Array<Map<NeuronId, number>> {
    const timeSeries: Array<Map<NeuronId, number>> = [];
    
    for (let t = 0; t < duration; t++) {
      const input = new Map<NeuronId, number>();
      
      for (const [neuronId, train] of spikeTrains) {
        if (train.spikes.includes(t)) {
          input.set(neuronId, 1.0);  // 发射电流
        } else {
          input.set(neuronId, 0);
        }
      }
      
      timeSeries.push(input);
    }
    
    return timeSeries;
  }

  /**
   * 获取编码类型
   */
  getEncodingType(): EncodingType {
    return this.config.type;
  }

  /**
   * 设置编码类型
   */
  setEncodingType(type: EncodingType): void {
    this.config.type = type;
  }
}

/**
 * 创建脉冲编码器
 */
export function createSpikeEncoder(config?: Partial<EncodingConfig>): SpikeEncoder {
  return new SpikeEncoder(config);
}
