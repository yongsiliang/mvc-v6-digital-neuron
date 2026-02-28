/**
 * ═══════════════════════════════════════════════════════════════════════
 * LLM Gateway - 统一的大语言模型调用网关
 * 
 * 职责：
 * - 统一所有 LLM 调用入口
 * - 提供缓存、限流、监控能力
 * - 支持流式和非流式输出
 * - 统一错误处理和降级策略
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
  cached: boolean;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

export interface LLMGatewayConfig {
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  timeout: number;
  enableCache: boolean;
  cacheTTL: number;
  maxRetries: number;
  retryDelay: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: LLMGatewayConfig = {
  defaultModel: 'doubao-seed-1-8-251228',
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  timeout: 60000,
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5分钟
  maxRetries: 3,
  retryDelay: 1000,
};

// ─────────────────────────────────────────────────────────────────────
// LLM Gateway
// ─────────────────────────────────────────────────────────────────────

/**
 * LLM Gateway 单例
 */
class LLMGateway {
  private static instance: LLMGateway | null = null;
  private client: LLMClient | null = null;
  private config: LLMGatewayConfig;
  
  // 简单的内存缓存
  private cache: Map<string, { content: string; timestamp: number }> = new Map();
  
  // 统计
  private stats = {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    totalLatency: 0,
  };
  
  private constructor(config: Partial<LLMGatewayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[LLMGateway] 初始化完成');
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<LLMGatewayConfig>): LLMGateway {
    if (!LLMGateway.instance) {
      LLMGateway.instance = new LLMGateway(config);
    }
    return LLMGateway.instance;
  }
  
  /**
   * 初始化客户端（延迟初始化，需要 headers）
   */
  initialize(headers: Record<string, string>): void {
    if (this.client) return;
    
    try {
      const config = new Config();
      this.client = new LLMClient(config, headers);
      console.log('[LLMGateway] 客户端初始化成功');
    } catch (error) {
      console.error('[LLMGateway] 客户端初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 重置客户端（用于热更新）
   */
  reset(): void {
    this.client = null;
    this.cache.clear();
    console.log('[LLMGateway] 已重置');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 聊天 - 非流式
   */
  async chat(
    messages: LLMMessage[],
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    this.stats.totalCalls++;
    
    // 检查缓存
    const cacheKey = this.getCacheKey(messages, options);
    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        this.stats.cacheHits++;
        return {
          content: cached.content,
          model: options.model || this.config.defaultModel,
          latency: Date.now() - startTime,
          cached: true,
        };
      }
      this.stats.cacheMisses++;
    }
    
    // 确保客户端初始化
    if (!this.client) {
      throw new Error('[LLMGateway] 客户端未初始化，请先调用 initialize()');
    }
    
    // 调用 LLM（带重试）
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.callWithRetry(messages, options);
        const latency = Date.now() - startTime;
        this.stats.totalLatency += latency;
        
        // 缓存结果
        if (this.config.enableCache) {
          this.cache.set(cacheKey, {
            content: response,
            timestamp: Date.now(),
          });
        }
        
        return {
          content: response,
          model: options.model || this.config.defaultModel,
          latency,
          cached: false,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`[LLMGateway] 调用失败 (尝试 ${attempt + 1}/${this.config.maxRetries}):`, error);
        
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    
    this.stats.errors++;
    throw lastError || new Error('[LLMGateway] 调用失败');
  }
  
  /**
   * 聊天 - 流式
   */
  async *stream(
    messages: LLMMessage[],
    options: LLMOptions = {}
  ): AsyncGenerator<LLMStreamChunk> {
    this.stats.totalCalls++;
    
    if (!this.client) {
      throw new Error('[LLMGateway] 客户端未初始化，请先调用 initialize()');
    }
    
    const model = options.model || this.config.defaultModel;
    
    try {
      const streamIterator = this.client.stream(messages, { model });
      let fullContent = '';
      
      for await (const chunk of streamIterator) {
        if (chunk.content) {
          const content = chunk.content.toString();
          fullContent += content;
          yield { content, done: false };
        }
      }
      
      yield { content: '', done: true };
      
      // 缓存完整响应
      if (this.config.enableCache) {
        const cacheKey = this.getCacheKey(messages, options);
        this.cache.set(cacheKey, {
          content: fullContent,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      this.stats.errors++;
      console.error('[LLMGateway] 流式调用失败:', error);
      throw error;
    }
  }
  
  /**
   * 快速生成（简化接口）
   */
  async generate(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const messages: LLMMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    const response = await this.chat(messages);
    return response.content;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  private async callWithRetry(
    messages: LLMMessage[],
    options: LLMOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('[LLMGateway] 客户端未初始化');
    }
    
    const model = options.model || this.config.defaultModel;
    
    // 使用流式接口收集完整响应
    let response = '';
    const streamIterator = this.client.stream(messages, { model });
    
    for await (const chunk of streamIterator) {
      if (chunk.content) {
        response += chunk.content.toString();
      }
    }
    
    return response;
  }
  
  private getCacheKey(messages: LLMMessage[], options: LLMOptions): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    const opts = JSON.stringify({
      model: options.model,
      temperature: options.temperature,
    });
    return `${content}::${opts}`;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态与监控
  // ══════════════════════════════════════════════════════════════════
  
  getStats(): {
    totalCalls: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
    errors: number;
    avgLatency: number;
    cacheSize: number;
  } {
    return {
      totalCalls: this.stats.totalCalls,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: this.stats.totalCalls > 0 
        ? this.stats.cacheHits / this.stats.totalCalls 
        : 0,
      errors: this.stats.errors,
      avgLatency: this.stats.totalCalls > 0 
        ? this.stats.totalLatency / this.stats.totalCalls 
        : 0,
      cacheSize: this.cache.size,
    };
  }
  
  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[LLMGateway] 缓存已清理');
  }
  
  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[LLMGateway] 清理了 ${cleaned} 条过期缓存`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export { LLMGateway };
export const llmGateway = LLMGateway.getInstance();

export function getLLMGateway(): LLMGateway {
  return LLMGateway.getInstance();
}
