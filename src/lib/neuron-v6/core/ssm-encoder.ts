/**
 * ═══════════════════════════════════════════════════════════════════════
 * SSM 编码器 (SSM Encoder)
 * 
 * 核心理念：
 * - 将输入（文本/多模态）编码为隐式向量
 * - 与Embedding服务协作
 * - 输出标准化向量供SSM层处理
 * 
 * 黑盒特性：
 * - 编码过程不可逆
 * - 加入混沌混淆
 * - 输出无法直接解析
 * ═══════════════════════════════════════════════════════════════════════
 */

import { EmbeddingClient } from 'coze-coding-dev-sdk';
import type { SSMState } from './ssm-layer';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码器配置
 */
export interface SSMEncoderConfig {
  /** 输出向量维度 */
  outputDimension: number;
  
  /** 是否使用外部Embedding服务 */
  useExternalEmbedding: boolean;
  
  /** 是否启用混沌混淆 */
  enableChaos: boolean;
  
  /** 混沌强度 */
  chaosIntensity: number;
  
  /** 是否标准化输出 */
  normalizeOutput: boolean;
  
  /** 是否注入上下文 */
  injectContext: boolean;
}

const DEFAULT_ENCODER_CONFIG: SSMEncoderConfig = {
  outputDimension: 256,
  useExternalEmbedding: true,
  enableChaos: true,
  chaosIntensity: 0.05,
  normalizeOutput: true,
  injectContext: true,
};

/**
 * 编码输入
 */
export interface EncoderInput {
  /** 文本内容 */
  text: string;
  
  /** 历史状态（可选） */
  historyState?: SSMState;
  
  /** 上下文（可选） */
  context?: string[];
  
  /** 元数据（可选） */
  metadata?: Record<string, unknown>;
}

/**
 * 编码输出
 */
export interface EncoderOutput {
  /** 隐式向量 */
  vector: Float32Array;
  
  /** 向量ID */
  id: string;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 是否来自缓存 */
  fromCache: boolean;
  
  /** 编码耗时（ms） */
  encodingTime: number;
}

/**
 * 多模态编码输入
 */
export interface MultiModalEncoderInput extends EncoderInput {
  /** 图像URL列表 */
  images?: string[];
  
  /** 音频数据 */
  audio?: ArrayBuffer;
  
  /** 视频帧 */
  videoFrames?: ArrayBuffer[];
}

// ─────────────────────────────────────────────────────────────────────
// SSM编码器
// ─────────────────────────────────────────────────────────────────────

/**
 * SSM编码器
 * 
 * 将各种输入编码为隐式向量
 */
export class SSMEncoder {
  private config: SSMEncoderConfig;
  private embeddingClient: EmbeddingClient | null = null;
  
  // 缓存
  private cache: Map<string, Float32Array>;
  private maxCacheSize: number;
  
  // 投影矩阵（当不使用外部Embedding时）
  private projectionMatrix: Float32Array;
  private bias: Float32Array;
  
  // 上下文编码器
  private contextEncoder: Float32Array;
  
  // 统计
  private stats: {
    totalEncodings: number;
    cacheHits: number;
    avgEncodingTime: number;
    totalTokensProcessed: number;
  };
  
  constructor(config?: Partial<SSMEncoderConfig>) {
    this.config = { ...DEFAULT_ENCODER_CONFIG, ...config };
    
    // 初始化缓存
    this.cache = new Map();
    this.maxCacheSize = 1000;
    
    // 初始化投影矩阵
    this.projectionMatrix = this.initProjectionMatrix();
    this.bias = new Float32Array(this.config.outputDimension);
    
    // 初始化上下文编码器
    this.contextEncoder = this.initContextEncoder();
    
    // 初始化统计
    this.stats = {
      totalEncodings: 0,
      cacheHits: 0,
      avgEncodingTime: 0,
      totalTokensProcessed: 0,
    };
  }
  
  /**
   * 设置Embedding客户端
   */
  setEmbeddingClient(client: EmbeddingClient): void {
    this.embeddingClient = client;
  }
  
  /**
   * 编码文本输入
   */
  async encode(input: EncoderInput): Promise<EncoderOutput> {
    const startTime = Date.now();
    
    // 检查缓存
    const cacheKey = this.getCacheKey(input.text, input.context);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.stats.cacheHits++;
      return {
        vector: cached,
        id: this.generateId(),
        timestamp: startTime,
        fromCache: true,
        encodingTime: 0,
      };
    }
    
    // 编码
    let vector: Float32Array;
    
    if (this.config.useExternalEmbedding && this.embeddingClient) {
      vector = await this.encodeWithExternal(input);
    } else {
      vector = this.encodeLocally(input);
    }
    
    // 注入上下文
    if (this.config.injectContext && input.context && input.context.length > 0) {
      vector = this.injectContextInfo(vector, input.context);
    }
    
    // 注入历史状态
    if (input.historyState) {
      vector = this.injectHistoryState(vector, input.historyState);
    }
    
    // 混淆
    if (this.config.enableChaos) {
      vector = this.applyChaos(vector);
    }
    
    // 标准化
    if (this.config.normalizeOutput) {
      vector = this.normalize(vector);
    }
    
    // 缓存
    this.addToCache(cacheKey, vector);
    
    // 更新统计
    const encodingTime = Date.now() - startTime;
    this.stats.totalEncodings++;
    this.stats.avgEncodingTime = 
      (this.stats.avgEncodingTime * (this.stats.totalEncodings - 1) + encodingTime) 
      / this.stats.totalEncodings;
    
    return {
      vector,
      id: this.generateId(),
      timestamp: startTime,
      fromCache: false,
      encodingTime,
    };
  }
  
  /**
   * 编码多模态输入
   */
  async encodeMultiModal(input: MultiModalEncoderInput): Promise<EncoderOutput> {
    const startTime = Date.now();
    
    // 文本编码
    const textOutput = await this.encode({
      text: input.text,
      historyState: input.historyState,
      context: input.context,
      metadata: input.metadata,
    });
    
    let vector = textOutput.vector;
    
    // 图像编码
    if (input.images && input.images.length > 0) {
      const imageVectors = await Promise.all(
        input.images.map(img => this.encodeImage(img))
      );
      vector = this.mergeVectors([vector, ...imageVectors]);
    }
    
    // 音频编码
    if (input.audio) {
      const audioVector = await this.encodeAudio(input.audio);
      vector = this.mergeVectors([vector, audioVector]);
    }
    
    // 视频编码
    if (input.videoFrames && input.videoFrames.length > 0) {
      const videoVector = await this.encodeVideo(input.videoFrames);
      vector = this.mergeVectors([vector, videoVector]);
    }
    
    return {
      vector,
      id: this.generateId(),
      timestamp: startTime,
      fromCache: false,
      encodingTime: Date.now() - startTime,
    };
  }
  
  /**
   * 批量编码
   */
  async encodeBatch(inputs: EncoderInput[]): Promise<EncoderOutput[]> {
    return Promise.all(inputs.map(input => this.encode(input)));
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats & { cacheSize: number } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
    };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 使用外部Embedding服务编码
   */
  private async encodeWithExternal(input: EncoderInput): Promise<Float32Array> {
    if (!this.embeddingClient) {
      throw new Error('Embedding客户端未设置');
    }
    
    try {
      // 调用Embedding API
      const response = await this.embeddingClient.embed([input.text]);
      
      // 处理响应 - 可能是数组或其他格式
      const embeddingArray = Array.isArray(response) ? response : [response];
      
      if (embeddingArray && embeddingArray.length > 0 && embeddingArray[0]) {
        const embedding = embeddingArray[0] as { values?: number[]; [key: string]: unknown };
        
        // 转换为Float32Array
        const vector = new Float32Array(this.config.outputDimension);
        const sourceVector = embedding.values || (embedding as unknown as number[]);
        
        // 如果维度不匹配，投影到目标维度
        const srcLen = Array.isArray(sourceVector) ? sourceVector.length : 0;
        if (srcLen === this.config.outputDimension) {
          for (let i = 0; i < srcLen; i++) {
            vector[i] = sourceVector[i];
          }
        } else {
          // 简单投影
          const ratio = sourceVector.length / this.config.outputDimension;
          for (let i = 0; i < this.config.outputDimension; i++) {
            const srcIdx = Math.floor(i * ratio);
            vector[i] = sourceVector[srcIdx] || 0;
          }
        }
        
        this.stats.totalTokensProcessed += input.text.length;
        
        return vector;
      }
    } catch (error) {
      console.error('[SSMEncoder] 外部Embedding失败，降级到本地:', error);
    }
    
    // 降级到本地编码
    return this.encodeLocally(input);
  }
  
  /**
   * 本地编码（不依赖外部服务）
   */
  private encodeLocally(input: EncoderInput): Float32Array {
    const { text } = input;
    const dim = this.config.outputDimension;
    
    // 简单的字符级编码
    const vector = new Float32Array(dim);
    
    // 字符统计
    const charCounts = new Map<string, number>();
    for (const char of text) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }
    
    // 基于字符生成向量
    for (const [char, count] of charCounts) {
      const idx = (char.charCodeAt(0) % dim);
      vector[idx] += count / text.length;
    }
    
    // 应用投影
    const projected = new Float32Array(dim);
    for (let i = 0; i < dim; i++) {
      let sum = this.bias[i];
      for (let j = 0; j < dim; j++) {
        sum += this.projectionMatrix[i * dim + j] * vector[j];
      }
      projected[i] = Math.tanh(sum);
    }
    
    return projected;
  }
  
  /**
   * 编码图像
   */
  private async encodeImage(imageUrl: string): Promise<Float32Array> {
    // 简化实现：生成基于URL的确定性向量
    const dim = this.config.outputDimension;
    const vector = new Float32Array(dim);
    
    // 使用URL哈希
    let hash = 0;
    for (let i = 0; i < imageUrl.length; i++) {
      hash = ((hash << 5) - hash) + imageUrl.charCodeAt(i);
      hash = hash & hash;
    }
    
    // 基于哈希生成向量
    const seed = Math.abs(hash);
    for (let i = 0; i < dim; i++) {
      vector[i] = Math.sin(seed * (i + 1) * 0.001) * 0.5;
    }
    
    return vector;
  }
  
  /**
   * 编码音频
   */
  private async encodeAudio(audioData: ArrayBuffer): Promise<Float32Array> {
    const dim = this.config.outputDimension;
    const vector = new Float32Array(dim);
    
    // 简化实现：从音频数据提取特征
    const view = new DataView(audioData);
    const step = Math.max(1, Math.floor(audioData.byteLength / dim));
    
    for (let i = 0; i < dim && i * step < audioData.byteLength; i++) {
      vector[i] = view.getInt8(i * step) / 128;
    }
    
    return vector;
  }
  
  /**
   * 编码视频
   */
  private async encodeVideo(frames: ArrayBuffer[]): Promise<Float32Array> {
    const dim = this.config.outputDimension;
    const vector = new Float32Array(dim);
    
    // 简化实现：合并帧特征
    for (const frame of frames) {
      const frameVector = await this.encodeAudio(frame);
      for (let i = 0; i < dim; i++) {
        vector[i] += frameVector[i] / frames.length;
      }
    }
    
    return vector;
  }
  
  /**
   * 合并向量
   */
  private mergeVectors(vectors: Float32Array[]): Float32Array {
    const dim = this.config.outputDimension;
    const result = new Float32Array(dim);
    
    for (const v of vectors) {
      for (let i = 0; i < dim && i < v.length; i++) {
        result[i] += v[i];
      }
    }
    
    // 平均
    for (let i = 0; i < dim; i++) {
      result[i] /= vectors.length;
    }
    
    return result;
  }
  
  /**
   * 注入上下文信息
   */
  private injectContextInfo(vector: Float32Array, context: string[]): Float32Array {
    const dim = this.config.outputDimension;
    const result = new Float32Array(vector);
    
    // 编码上下文
    for (let i = 0; i < context.length && i < 10; i++) {
      const ctxHash = this.simpleHash(context[i]);
      const offset = (ctxHash % (dim / 2)) + dim / 2;
      result[offset] += 0.1 * (i + 1);
    }
    
    return result;
  }
  
  /**
   * 注入历史状态
   */
  private injectHistoryState(vector: Float32Array, historyState: SSMState): Float32Array {
    const dim = this.config.outputDimension;
    const result = new Float32Array(vector);
    
    // 混合历史状态
    const historyVec = historyState.h;
    const mixRatio = 0.2;  // 历史权重
    
    for (let i = 0; i < dim && i < historyVec.length; i++) {
      result[i] = result[i] * (1 - mixRatio) + historyVec[i] * mixRatio;
    }
    
    return result;
  }
  
  /**
   * 应用混沌混淆
   */
  private applyChaos(vector: Float32Array): Float32Array {
    const { chaosIntensity } = this.config;
    const result = new Float32Array(vector);
    
    for (let i = 0; i < result.length; i++) {
      result[i] += (Math.random() * 2 - 1) * chaosIntensity;
    }
    
    return result;
  }
  
  /**
   * 标准化向量
   */
  private normalize(vector: Float32Array): Float32Array {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    
    if (norm === 0) return vector;
    
    const result = new Float32Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
      result[i] = vector[i] / norm;
    }
    
    return result;
  }
  
  /**
   * 初始化投影矩阵
   */
  private initProjectionMatrix(): Float32Array {
    const dim = this.config.outputDimension;
    const matrix = new Float32Array(dim * dim);
    const scale = Math.sqrt(2.0 / dim);
    
    for (let i = 0; i < matrix.length; i++) {
      matrix[i] = (Math.random() * 2 - 1) * scale;
    }
    
    return matrix;
  }
  
  /**
   * 初始化上下文编码器
   */
  private initContextEncoder(): Float32Array {
    const dim = this.config.outputDimension;
    const encoder = new Float32Array(dim * 100);  // 最多100个上下文槽
    
    for (let i = 0; i < encoder.length; i++) {
      encoder[i] = Math.random() * 2 - 1;
    }
    
    return encoder;
  }
  
  /**
   * 生成缓存键
   */
  private getCacheKey(text: string, context?: string[]): string {
    const ctxStr = context ? context.join('|') : '';
    return `${text}:${ctxStr}`;
  }
  
  /**
   * 添加到缓存
   */
  private addToCache(key: string, vector: Float32Array): void {
    if (this.cache.size >= this.maxCacheSize) {
      // 移除最早的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, vector);
  }
  
  /**
   * 简单哈希
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * 生成ID
   */
  private generateId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSSMEncoder(config?: Partial<SSMEncoderConfig>): SSMEncoder {
  return new SSMEncoder(config);
}

export default SSMEncoder;
