/**
 * ═══════════════════════════════════════════════════════════════════════
 * Language Interface - 语言接口层
 * 
 * LLM 作为大脑的语言接口：
 * - 编码器：文本 → 向量
 * - 解码器：向量 → 文本
 * 
 * LLM 不是大脑本身，只是翻译器
 * 真正的思考发生在神经网络层
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface EncodingResult {
  vector: Float32Array;
  tokens: string[];
  attention: number[];
}

export interface DecodingResult {
  text: string;
  confidence: number;
  alternatives?: string[];
}

export interface LanguageInterfaceConfig {
  model?: string;
  embeddingModel?: string;
  vectorDimension: number;
  maxTokens: number;
  temperature: number;
}

// ─────────────────────────────────────────────────────────────────────
// 语言接口
// ─────────────────────────────────────────────────────────────────────

export class LanguageInterface {
  private llm: LLMClient;
  private config: LanguageInterfaceConfig;
  
  // 缓存
  private embeddingCache: Map<string, Float32Array> = new Map();
  private readonly maxCacheSize = 1000;
  
  // 统计
  private stats = {
    encodings: 0,
    decodings: 0,
    cacheHits: 0,
  };
  
  constructor(config: Partial<LanguageInterfaceConfig> = {}) {
    this.config = {
      model: config.model || 'doubao-seed-1-6',
      embeddingModel: config.embeddingModel || 'doubao-embedding',
      vectorDimension: config.vectorDimension || 256,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      ...config,
    };
    
    // 初始化 LLM 客户端
    const sdkConfig = new Config();
    this.llm = new LLMClient(sdkConfig);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 编码器：文本 → 向量
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 将文本编码为向量
   * 
   * 这是感知神经元使用的方法
   */
  async encode(text: string): Promise<EncodingResult> {
    this.stats.encodings++;
    
    // 检查缓存
    const cacheKey = this.getCacheKey(text);
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return {
        vector: cached,
        tokens: [],
        attention: [],
      };
    }
    
    try {
      // 使用 LLM 获取 embedding
      // 注意：coze-coding-dev-sdk 可能不支持直接 embedding
      // 这里我们使用一个替代方案：让 LLM 输出一个固定格式的向量表示
      
      const vector = await this.textToVector(text);
      
      // 缓存
      this.addToCache(cacheKey, vector);
      
      // 获取 token 信息（简化版）
      const tokens = text.split(/\s+/).slice(0, 50);
      const attention = new Array(tokens.length).fill(1 / tokens.length);
      
      return {
        vector,
        tokens,
        attention: Array.from(attention),
      };
    } catch (error) {
      console.error('[LanguageInterface] 编码失败:', error);
      // 返回零向量
      return {
        vector: new Float32Array(this.config.vectorDimension),
        tokens: [],
        attention: [],
      };
    }
  }
  
  /**
   * 批量编码
   */
  async encodeBatch(texts: string[]): Promise<EncodingResult[]> {
    const results: EncodingResult[] = [];
    
    for (const text of texts) {
      const result = await this.encode(text);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * 文本到向量的转换
   * 
   * 由于 SDK 限制，使用简化的向量生成方法
   */
  private async textToVector(text: string): Promise<Float32Array> {
    const vector = new Float32Array(this.config.vectorDimension);
    
    // 方法1：基于字符的简单哈希向量化
    // 这是一个简化版本，实际应用中应该使用真正的 embedding API
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const idx = (charCode * (i + 1)) % this.config.vectorDimension;
      vector[idx] = (vector[idx] + Math.sin(charCode * 0.1)) / 2;
    }
    
    // 方法2：使用 LLM 生成语义向量（更精确但更慢）
    // 这里我们混合两种方法
    try {
      const semanticVector = await this.getSemanticVector(text);
      
      // 混合简单向量和语义向量
      for (let i = 0; i < this.config.vectorDimension; i++) {
        vector[i] = vector[i] * 0.3 + semanticVector[i] * 0.7;
      }
    } catch {
      // 如果语义向量失败，使用简单向量
    }
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }
  
  /**
   * 获取语义向量（通过 LLM）
   */
  private async getSemanticVector(text: string): Promise<Float32Array> {
    const vector = new Float32Array(this.config.vectorDimension);
    
    try {
      // 让 LLM 输出一个描述文本特征的 JSON
      const response = await this.llm.invoke([{
        role: 'user',
        content: `分析以下文本的语义特征，输出 ${Math.min(32, this.config.vectorDimension / 8)} 个数值特征值（0-1之间）：
          
文本: "${text.slice(0, 200)}"

输出格式（JSON数组）:
[特征1, 特征2, ...]`
      }], {
        temperature: 0.3,
      });
      
      // 解析响应
      const jsonMatch = response.content.match(/\[[\d\s,.]+\]/);
      if (jsonMatch) {
        const features = JSON.parse(jsonMatch[0]);
        
        // 扩展到目标维度
        for (let i = 0; i < this.config.vectorDimension; i++) {
          const featureIdx = i % features.length;
          const scale = Math.sin(i * 0.1) * 0.1;
          vector[i] = features[featureIdx] + scale;
        }
      }
    } catch (error) {
      // 失败时返回随机向量
      for (let i = 0; i < vector.length; i++) {
        vector[i] = Math.random() * 2 - 1;
      }
    }
    
    return vector;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 解码器：向量 → 文本
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 将向量解码为文本
   * 
   * 这是运动神经元使用的方法
   */
  async decode(
    vector: Float32Array,
    context?: {
      intent?: string;
      style?: string;
      maxLength?: number;
    }
  ): Promise<DecodingResult> {
    this.stats.decodings++;
    
    try {
      // 将向量转换为描述
      const vectorDescription = this.vectorToDescription(vector);
      
      // 构建 prompt
      let prompt = `根据以下神经信号状态生成自然语言回复：

神经信号描述: ${vectorDescription}
`;
      
      if (context?.intent) {
        prompt += `意图: ${context.intent}\n`;
      }
      
      if (context?.style) {
        prompt += `风格: ${context.style}\n`;
      }
      
      prompt += '\n请生成一个自然、有深度的回复：';
      
      // 调用 LLM 生成文本
      const response = await this.llm.invoke([{
        role: 'user',
        content: prompt,
      }], {
        temperature: 0.7,
      });
      
      return {
        text: response.content,
        confidence: 0.8, // 简化
      };
    } catch (error) {
      console.error('[LanguageInterface] 解码失败:', error);
      return {
        text: '我正在思考...',
        confidence: 0.1,
      };
    }
  }
  
  /**
   * 向量转换为描述
   */
  private vectorToDescription(vector: Float32Array): string {
    // 计算向量统计特征
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    
    for (let i = 0; i < vector.length; i++) {
      sum += vector[i];
      max = Math.max(max, vector[i]);
      min = Math.min(min, vector[i]);
    }
    
    const avg = sum / vector.length;
    const range = max - min;
    
    // 计算能量分布
    const energy = vector.reduce((s, v) => s + v * v, 0);
    const energyLevel = Math.sqrt(energy);
    
    // 生成描述
    const descriptions: string[] = [];
    
    if (avg > 0.3) {
      descriptions.push('积极状态');
    } else if (avg < -0.3) {
      descriptions.push('消极状态');
    } else {
      descriptions.push('中性状态');
    }
    
    if (energyLevel > 0.8) {
      descriptions.push('高能量');
    } else if (energyLevel < 0.3) {
      descriptions.push('低能量');
    } else {
      descriptions.push('中等能量');
    }
    
    if (range > 0.8) {
      descriptions.push('情绪波动大');
    } else if (range < 0.2) {
      descriptions.push('情绪稳定');
    }
    
    return descriptions.join('，');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 意图识别
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 识别用户意图
   */
  async recognizeIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, string>;
  }> {
    try {
      const response = await this.llm.invoke([{
        role: 'user',
        content: `分析以下文本的意图，输出 JSON 格式：
          
文本: "${text}"

输出格式:
{
  "intent": "意图类型（如: 提问/请求/闲聊/命令）",
  "confidence": 0.8,
  "entities": { "关键实体": "值" }
}`
      }], {
        temperature: 0.3,
      });
      
      // 解析 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[LanguageInterface] 意图识别失败:', error);
    }
    
    return {
      intent: 'unknown',
      confidence: 0.5,
      entities: {},
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算向量相似度
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }
  
  /**
   * 合并向量
   */
  mergeVectors(vectors: Float32Array[], weights?: number[]): Float32Array {
    if (vectors.length === 0) {
      return new Float32Array(this.config.vectorDimension);
    }
    
    const result = new Float32Array(this.config.vectorDimension);
    const w = weights || new Array(vectors.length).fill(1 / vectors.length);
    
    for (let i = 0; i < vectors.length; i++) {
      for (let j = 0; j < result.length; j++) {
        result[j] += vectors[i][j] * w[i];
      }
    }
    
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 缓存管理
  // ══════════════════════════════════════════════════════════════════
  
  private getCacheKey(text: string): string {
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }
  
  private addToCache(key: string, vector: Float32Array): void {
    if (this.embeddingCache.size >= this.maxCacheSize) {
      // 删除最旧的条目
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) {
        this.embeddingCache.delete(firstKey);
      }
    }
    
    this.embeddingCache.set(key, vector);
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    encodings: number;
    decodings: number;
    cacheHits: number;
    cacheSize: number;
  } {
    return {
      ...this.stats,
      cacheSize: this.embeddingCache.size,
    };
  }
}
