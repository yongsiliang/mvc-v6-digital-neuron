/**
 * 嵌入模型管理器
 * 
 * 解决瓶颈：向量维度限制
 * 
 * 支持多种嵌入模型：
 * - 不同维度（16维风格向量、256维轻量、1024维标准、1536维高精度）
 * - 不同类型（文本、图片、音频）
 * - 按需选择，成本优化
 */

import { distance } from './space';

/**
 * 嵌入模型配置
 */
export interface EmbeddingModel {
  /** 模型ID */
  id: string;
  /** 维度 */
  dimensions: number;
  /** 类型 */
  type: 'text' | 'image' | 'audio' | 'multi-modal';
  /** 成本等级 1-5，1最便宜 */
  costLevel: number;
  /** 嵌入函数 */
  embed: (input: string | Buffer) => Promise<number[]>;
}

/**
 * 预设模型
 */
const PRESET_MODELS: Record<string, EmbeddingModel> = {
  // 风格向量 - 16维，极低成本
  'style-lite': {
    id: 'style-lite',
    dimensions: 16,
    type: 'text',
    costLevel: 1,
    embed: async (input: string | Buffer) => {
      const text = typeof input === 'string' ? input : input.toString('utf-8');
      return extractLiteStyleVector(text);
    },
  },
  
  // 轻量文本嵌入 - 256维
  'text-lite': {
    id: 'text-lite',
    dimensions: 256,
    type: 'text',
    costLevel: 2,
    embed: async (input: string | Buffer) => {
      const text = typeof input === 'string' ? input : input.toString('utf-8');
      // 简化版：使用哈希 + 投影
      return hashAndProject(text, 256);
    },
  },
  
  // 标准文本嵌入 - 1024维（推荐）
  'text-standard': {
    id: 'text-standard',
    dimensions: 1024,
    type: 'text',
    costLevel: 3,
    embed: async (input: string | Buffer) => {
      const text = typeof input === 'string' ? input : input.toString('utf-8');
      // 使用SDK获取嵌入
      return getEmbeddingFromSDK(text, 1024);
    },
  },
  
  // 高精度嵌入 - 1536维
  'text-hd': {
    id: 'text-hd',
    dimensions: 1536,
    type: 'text',
    costLevel: 4,
    embed: async (input: string | Buffer) => {
      const text = typeof input === 'string' ? input : input.toString('utf-8');
      return getEmbeddingFromSDK(text, 1536);
    },
  },
};

/**
 * 嵌入管理器
 */
export class EmbeddingManager {
  private models: Map<string, EmbeddingModel> = new Map();
  private cache: Map<string, { vector: number[]; timestamp: number }> = new Map();
  private cacheTTL = 1000 * 60 * 60; // 1小时
  
  constructor() {
    // 注册预设模型
    Object.values(PRESET_MODELS).forEach(model => {
      this.models.set(model.id, model);
    });
  }
  
  /**
   * 注册自定义模型
   */
  registerModel(model: EmbeddingModel): void {
    this.models.set(model.id, model);
  }
  
  /**
   * 获取嵌入
   */
  async embed(
    input: string | Buffer,
    modelId: string = 'text-standard'
  ): Promise<number[]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    // 缓存key
    const cacheKey = `${modelId}:${typeof input === 'string' ? input : input.toString('base64').slice(0, 100)}`;
    
    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.vector;
    }
    
    // 获取嵌入
    const vector = await model.embed(input);
    
    // 缓存
    this.cache.set(cacheKey, { vector, timestamp: Date.now() });
    
    // 清理过期缓存
    if (this.cache.size > 1000) {
      this.cleanCache();
    }
    
    return vector;
  }
  
  /**
   * 批量嵌入
   */
  async embedBatch(
    inputs: (string | Buffer)[],
    modelId: string = 'text-standard'
  ): Promise<number[][]> {
    return Promise.all(inputs.map(input => this.embed(input, modelId)));
  }
  
  /**
   * 自动选择模型
   * 
   * 根据场景自动选择最合适的模型
   */
  autoSelectModel(
    scene: 'style' | 'memory' | 'search' | 'precise'
  ): string {
    switch (scene) {
      case 'style':
        return 'style-lite';  // 风格识别用轻量
      case 'memory':
        return 'text-standard';  // 记忆存储用标准
      case 'search':
        return 'text-lite';  // 搜索用轻量优先速度
      case 'precise':
        return 'text-hd';  // 精确匹配用高精度
      default:
        return 'text-standard';
    }
  }
  
  /**
   * 获取模型信息
   */
  getModelInfo(modelId: string): EmbeddingModel | undefined {
    return this.models.get(modelId);
  }
  
  /**
   * 列出所有模型
   */
  listModels(): EmbeddingModel[] {
    return Array.from(this.models.values());
  }
  
  /**
   * 清理缓存
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 提取轻量风格向量
 */
function extractLiteStyleVector(text: string): number[] {
  const features: number[] = [];
  
  // 1. 句子平均长度
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
  const avgLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length / 100
    : 0.5;
  features.push(Math.min(1, avgLength));
  
  // 2. 标点密度
  const punctCount = (text.match(/[，。！？、；：""''（）]/g) || []).length;
  features.push(Math.min(1, punctCount / Math.max(1, text.length) * 10));
  
  // 3. 问号比例
  const questionRatio = (text.match(/[？?]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, questionRatio));
  
  // 4. 感叹号比例
  const exclamRatio = (text.match(/[！!]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, exclamRatio));
  
  // 5. 代词使用
  const pronounRatio = (text.match(/[我你他她它]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, pronounRatio));
  
  // 6. 数字使用
  const numberRatio = (text.match(/\d/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, numberRatio));
  
  // 7. 英文比例
  const englishRatio = (text.match(/[a-zA-Z]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, englishRatio));
  
  // 8. 平均词长
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordLen = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length / 20
    : 0.5;
  features.push(Math.min(1, avgWordLen));
  
  // 9-16. 字符频率特征
  const charFreq = new Map<string, number>();
  for (const char of text) {
    charFreq.set(char, (charFreq.get(char) || 0) + 1);
  }
  const topChars = Array.from(charFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  for (let i = 0; i < 8; i++) {
    features.push(topChars[i] ? topChars[i][1] / text.length * 100 : 0);
  }
  
  return features.slice(0, 16);
}

/**
 * 哈希投影
 * 
 * 简单但有效的降维方法
 */
function hashAndProject(text: string, dimensions: number): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  
  // 使用简单的哈希投影
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const pos = (charCode * (i + 1)) % dimensions;
    vector[pos] += Math.sin(charCode * (i + 1)) * 0.1;
  }
  
  // 归一化
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }
  
  return vector;
}

/**
 * 从SDK获取嵌入
 */
async function getEmbeddingFromSDK(text: string, dimensions: number): Promise<number[]> {
  try {
    // 尝试使用多模型客户端的嵌入接口
    const { getLLMClient } = await import('./multi-model-llm');
    const client = getLLMClient();
    const embedding = await client.embed(text);
    
    // 如果维度不匹配，进行投影
    if (embedding.length !== dimensions) {
      return projectVector(embedding, dimensions);
    }
    
    return embedding;
  } catch {
    // 降级为哈希投影
    return hashAndProject(text, dimensions);
  }
}

/**
 * 向量投影
 * 
 * 将向量投影到目标维度
 */
function projectVector(vector: number[], targetDim: number): number[] {
  const sourceDim = vector.length;
  
  if (targetDim === sourceDim) return vector;
  
  if (targetDim < sourceDim) {
    // 降维：分段平均
    const result: number[] = [];
    const chunkSize = Math.ceil(sourceDim / targetDim);
    
    for (let i = 0; i < targetDim; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i * chunkSize; j < Math.min((i + 1) * chunkSize, sourceDim); j++) {
        sum += vector[j];
        count++;
      }
      result.push(sum / Math.max(1, count));
    }
    
    return result;
  } else {
    // 升维：填充零
    return [...vector, ...new Array(targetDim - sourceDim).fill(0)];
  }
}

// 单例
let embeddingManagerInstance: EmbeddingManager | null = null;

export function getEmbeddingManager(): EmbeddingManager {
  if (!embeddingManagerInstance) {
    embeddingManagerInstance = new EmbeddingManager();
  }
  return embeddingManagerInstance;
}
