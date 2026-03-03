/**
 * ═══════════════════════════════════════════════════════════════════════
 * Multi-Model Gateway - 多模型智能网关
 * 
 * 核心能力：
 * - 多模型支持：Coze SDK、Ollama 本地模型、OpenAI 兼容 API
 * - 自动故障切换：主模型失败自动切换到备份模型
 * - 积分监控：追踪调用次数，预警积分耗尽
 * - 智能缓存：减少重复调用
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
  provider: string;
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

// 模型提供商类型
export type ModelProvider = 'coze' | 'ollama' | 'openai-compatible';

// 提供商配置
export interface ProviderConfig {
  enabled: boolean;
  priority: number; // 优先级，数字越小越优先
  model: string;
  baseUrl?: string;
  apiKey?: string;
  maxCalls?: number; // 最大调用次数限制（用于积分管理）
}

// 网关配置
export interface MultiModelGatewayConfig {
  providers: {
    coze: ProviderConfig;
    ollama: ProviderConfig;
    'openai-compatible'?: ProviderConfig;
  };
  enableCache: boolean;
  cacheTTL: number;
  callWarningThreshold: number; // 调用次数预警阈值
  autoSwitchOnFailure: boolean;
  logCalls: boolean;
}

// 调用统计
export interface CallStats {
  totalCalls: number;
  callsByProvider: Record<string, number>;
  errors: number;
  cacheHits: number;
  lastError?: string;
  lastErrorTime?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: MultiModelGatewayConfig = {
  providers: {
    coze: {
      enabled: true,
      priority: 1,
      model: 'doubao-seed-1-8-251228',
    },
    ollama: {
      enabled: true,
      priority: 2,
      model: 'llama3.2:latest',
      baseUrl: 'http://localhost:11434',
    },
  },
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5分钟
  callWarningThreshold: 100,
  autoSwitchOnFailure: true,
  logCalls: true,
};

// ═══════════════════════════════════════════════════════════════════════
// 适配器实现
// ═══════════════════════════════════════════════════════════════════════

/**
 * 模型适配器接口
 */
interface ModelAdapter {
  name: string;
  chat(messages: LLMMessage[], options: LLMOptions): Promise<string>;
  stream(messages: LLMMessage[], options: LLMOptions): AsyncGenerator<string>;
  isAvailable(): Promise<boolean>;
}

/**
 * Coze SDK 适配器
 */
class CozeAdapter implements ModelAdapter {
  name = 'coze';
  private client: LLMClient | null = null;
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  initialize(headers: Record<string, string>): void {
    if (this.client) return;
    const config = new Config();
    this.client = new LLMClient(config, headers);
  }

  async isAvailable(): Promise<boolean> {
    // 如果环境变量中有 API Key，则可用
    return !!process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    if (!this.client) {
      throw new Error('Coze client not initialized');
    }
    
    const response = await this.client.invoke(messages, {
      model: options.model || this.model,
    });
    
    return response.content;
  }

  async *stream(messages: LLMMessage[], options: LLMOptions): AsyncGenerator<string> {
    if (!this.client) {
      throw new Error('Coze client not initialized');
    }
    
    const streamIterator = this.client.stream(messages, {
      model: options.model || this.model,
    });
    
    for await (const chunk of streamIterator) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }
}

/**
 * Ollama 本地模型适配器（完全免费）
 */
class OllamaAdapter implements ModelAdapter {
  name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434';
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async *stream(messages: LLMMessage[], options: LLMOptions): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

/**
 * OpenAI 兼容 API 适配器（可接入 DeepSeek、Moonshot、通义千问等）
 */
class OpenAICompatibleAdapter implements ModelAdapter {
  name = 'openai-compatible';
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.baseUrl && this.apiKey);
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI-compatible error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async *stream(messages: LLMMessage[], options: LLMOptions): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 多模型网关
// ═══════════════════════════════════════════════════════════════════════

class MultiModelGateway {
  private static instance: MultiModelGateway | null = null;
  private config: MultiModelGatewayConfig;
  private adapters: Map<string, ModelAdapter> = new Map();
  private cache: Map<string, { content: string; timestamp: number }> = new Map();
  private stats: CallStats = {
    totalCalls: 0,
    callsByProvider: {},
    errors: 0,
    cacheHits: 0,
  };
  private warningCallback?: (stats: CallStats) => void;

  private constructor(config: Partial<MultiModelGatewayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAdapters();
  }

  static getInstance(config?: Partial<MultiModelGatewayConfig>): MultiModelGateway {
    if (!MultiModelGateway.instance) {
      MultiModelGateway.instance = new MultiModelGateway(config);
    }
    return MultiModelGateway.instance;
  }

  /**
   * 设置积分预警回调
   */
  onWarning(callback: (stats: CallStats) => void): void {
    this.warningCallback = callback;
  }

  /**
   * 初始化所有适配器
   */
  private initializeAdapters(): void {
    const { providers } = this.config;

    // Coze 适配器
    if (providers.coze.enabled) {
      this.adapters.set('coze', new CozeAdapter(providers.coze.model));
    }

    // Ollama 适配器
    if (providers.ollama.enabled) {
      this.adapters.set('ollama', new OllamaAdapter(
        providers.ollama.baseUrl || 'http://localhost:11434',
        providers.ollama.model
      ));
    }

    // OpenAI 兼容适配器
    if (providers['openai-compatible']?.enabled && providers['openai-compatible'].apiKey) {
      this.adapters.set('openai-compatible', new OpenAICompatibleAdapter(
        providers['openai-compatible'].baseUrl || '',
        providers['openai-compatible'].apiKey || '',
        providers['openai-compatible'].model
      ));
    }
  }

  /**
   * 初始化需要 headers 的适配器（如 Coze）
   */
  initializeCoze(headers: Record<string, string>): void {
    const adapter = this.adapters.get('coze') as CozeAdapter;
    if (adapter) {
      adapter.initialize(headers);
    }
  }

  /**
   * 获取可用的适配器列表（按优先级排序）
   */
  private async getAvailableAdapters(): Promise<ModelAdapter[]> {
    const available: { adapter: ModelAdapter; priority: number }[] = [];

    for (const [name, adapter] of this.adapters) {
      const providerConfig = this.config.providers[name as ModelProvider];
      if (!providerConfig?.enabled) continue;

      // 检查调用次数限制
      const callCount = this.stats.callsByProvider[name] || 0;
      if (providerConfig.maxCalls && callCount >= providerConfig.maxCalls) {
        console.log(`[MultiModelGateway] ${name} 已达调用上限，跳过`);
        continue;
      }

      // 检查可用性
      try {
        const isAvailable = await adapter.isAvailable();
        if (isAvailable) {
          available.push({ adapter, priority: providerConfig.priority });
        }
      } catch (error) {
        console.warn(`[MultiModelGateway] ${name} 不可用:`, error);
      }
    }

    // 按优先级排序
    return available
      .sort((a, b) => a.priority - b.priority)
      .map(item => item.adapter);
  }

  /**
   * 聊天 - 自动选择可用模型
   */
  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
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
          model: 'cached',
          provider: 'cache',
          latency: Date.now() - startTime,
          cached: true,
        };
      }
    }

    // 获取可用适配器
    const adapters = await this.getAvailableAdapters();
    if (adapters.length === 0) {
      throw new Error('没有可用的模型提供商，请检查配置或启动本地模型');
    }

    // 尝试调用
    let lastError: Error | null = null;
    for (const adapter of adapters) {
      try {
        if (this.config.logCalls) {
          console.log(`[MultiModelGateway] 使用 ${adapter.name} 模型`);
        }

        const content = await adapter.chat(messages, options);
        
        // 更新统计
        this.stats.callsByProvider[adapter.name] = 
          (this.stats.callsByProvider[adapter.name] || 0) + 1;

        // 检查预警
        this.checkWarning();

        // 缓存结果
        if (this.config.enableCache) {
          this.cache.set(cacheKey, { content, timestamp: Date.now() });
        }

        return {
          content,
          model: options.model || this.config.providers[adapter.name as ModelProvider]?.model || 'unknown',
          provider: adapter.name,
          latency: Date.now() - startTime,
          cached: false,
        };
      } catch (error) {
        lastError = error as Error;
        this.stats.errors++;
        console.warn(`[MultiModelGateway] ${adapter.name} 调用失败:`, error);

        if (!this.config.autoSwitchOnFailure) {
          throw error;
        }
        // 继续尝试下一个适配器
      }
    }

    this.stats.lastError = lastError?.message;
    this.stats.lastErrorTime = Date.now();
    throw lastError || new Error('所有模型调用失败');
  }

  /**
   * 流式聊天
   */
  async *stream(
    messages: LLMMessage[],
    options: LLMOptions = {}
  ): AsyncGenerator<LLMStreamChunk> {
    this.stats.totalCalls++;

    // 获取可用适配器
    const adapters = await this.getAvailableAdapters();
    if (adapters.length === 0) {
      throw new Error('没有可用的模型提供商');
    }

    const adapter = adapters[0];
    if (this.config.logCalls) {
      console.log(`[MultiModelGateway] 使用 ${adapter.name} 模型 (流式)`);
    }

    let fullContent = '';
    try {
      for await (const chunk of adapter.stream(messages, options)) {
        fullContent += chunk;
        yield { content: chunk, done: false };
      }
      yield { content: '', done: true };

      // 更新统计
      this.stats.callsByProvider[adapter.name] = 
        (this.stats.callsByProvider[adapter.name] || 0) + 1;

      // 缓存
      if (this.config.enableCache) {
        const cacheKey = this.getCacheKey(messages, options);
        this.cache.set(cacheKey, { content: fullContent, timestamp: Date.now() });
      }

      this.checkWarning();
    } catch (error) {
      this.stats.errors++;
      this.stats.lastError = (error as Error).message;
      this.stats.lastErrorTime = Date.now();
      throw error;
    }
  }

  /**
   * 获取调用统计
   */
  getStats(): CallStats {
    return { ...this.stats };
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalCalls: 0,
      callsByProvider: {},
      errors: 0,
      cacheHits: 0,
    };
    console.log('[MultiModelGateway] 统计已重置');
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[MultiModelGateway] 缓存已清除');
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(messages: LLMMessage[], options: LLMOptions): string {
    const content = JSON.stringify({ messages, options });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * 检查预警阈值
   */
  private checkWarning(): void {
    if (this.stats.totalCalls >= this.config.callWarningThreshold) {
      console.warn(`[MultiModelGateway] ⚠️ 调用次数已达 ${this.stats.totalCalls} 次`);
      this.warningCallback?.(this.stats);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export { MultiModelGateway, DEFAULT_CONFIG };
export type { ModelAdapter };
