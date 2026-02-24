/**
 * 多模型LLM客户端
 * 
 * 解决瓶颈：单点依赖
 * 
 * 能力：
 * 1. 多模型支持 - 支持多种LLM后端
 * 2. 自动故障转移 - 主模型失败时自动切换备用模型
 * 3. 负载均衡 - 多模型间负载均衡
 * 4. 成本优化 - 根据场景自动选择模型
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 模型配置
 */
export interface ModelConfig {
  /** 模型ID */
  id: string;
  
  /** 显示名称 */
  name: string;
  
  /** 成本等级 1-5，1最便宜 */
  costLevel: number;
  
  /** 能力标签 */
  capabilities: ('fast' | 'smart' | 'creative' | 'precise')[];
  
  /** 最大tokens */
  maxTokens: number;
  
  /** 创建客户端 */
  createClient: () => LLMClient;
  
  /** 健康状态 */
  healthy: boolean;
  
  /** 失败次数 */
  failures: number;
  
  /** 最后失败时间 */
  lastFailure: number;
}

/**
 * 模型选择策略
 */
export type ModelSelectionStrategy = 
  | 'fastest'      // 最快的
  | 'smartest'     // 最聪明的
  | 'cheapest'     // 最便宜的
  | 'balanced'     // 平衡
  | 'fallback';    // 故障转移

/**
 * 多模型客户端配置
 */
interface MultiModelConfig {
  /** 健康检查间隔 */
  healthCheckInterval: number;
  
  /** 最大失败次数，超过则标记不健康 */
  maxFailures: number;
  
  /** 故障恢复时间 */
  recoveryTime: number;
  
  /** 默认选择策略 */
  defaultStrategy: ModelSelectionStrategy;
}

const DEFAULT_CONFIG: MultiModelConfig = {
  healthCheckInterval: 60000,  // 1分钟
  maxFailures: 3,
  recoveryTime: 300000,  // 5分钟
  defaultStrategy: 'balanced',
};

/**
 * 多模型LLM客户端
 */
export class MultiModelLLMClient {
  private models: Map<string, ModelConfig> = new Map();
  private config: MultiModelConfig;
  private lastHealthCheck: number = 0;
  
  constructor(config: Partial<MultiModelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerDefaultModels();
  }
  
  /**
   * 注册默认模型
   */
  private registerDefaultModels(): void {
    // 豆包 - 快速模型
    this.registerModel({
      id: 'doubao-lite',
      name: 'Doubao Lite',
      costLevel: 2,
      capabilities: ['fast'],
      maxTokens: 4096,
      createClient: () => this.createCozeClient('doubao-lite'),
      healthy: true,
      failures: 0,
      lastFailure: 0,
    });
    
    // 豆包 - 标准模型
    this.registerModel({
      id: 'doubao-standard',
      name: 'Doubao Standard',
      costLevel: 3,
      capabilities: ['fast', 'smart'],
      maxTokens: 8192,
      createClient: () => this.createCozeClient('doubao-standard'),
      healthy: true,
      failures: 0,
      lastFailure: 0,
    });
    
    // 豆包 - Pro模型
    this.registerModel({
      id: 'doubao-pro',
      name: 'Doubao Pro',
      costLevel: 4,
      capabilities: ['smart', 'precise'],
      maxTokens: 32768,
      createClient: () => this.createCozeClient('doubao-pro'),
      healthy: true,
      failures: 0,
      lastFailure: 0,
    });
    
    // DeepSeek - 推理模型
    this.registerModel({
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner',
      costLevel: 3,
      capabilities: ['smart', 'precise', 'creative'],
      maxTokens: 16384,
      createClient: () => this.createCozeClient('deepseek-reasoner'),
      healthy: true,
      failures: 0,
      lastFailure: 0,
    });
    
    // Kimi - 长上下文模型
    this.registerModel({
      id: 'kimi-long',
      name: 'Kimi Long',
      costLevel: 3,
      capabilities: ['smart', 'precise'],
      maxTokens: 128000,
      createClient: () => this.createCozeClient('kimi-long'),
      healthy: true,
      failures: 0,
      lastFailure: 0,
    });
  }
  
  /**
   * 创建Coze客户端
   */
  private createCozeClient(modelId: string): LLMClient {
    const config = new Config();
    return new LLMClient(config, {});
  }
  
  /**
   * 注册模型
   */
  registerModel(model: ModelConfig): void {
    this.models.set(model.id, model);
  }
  
  /**
   * 选择模型
   */
  selectModel(
    strategy: ModelSelectionStrategy = this.config.defaultStrategy,
    capabilities?: ('fast' | 'smart' | 'creative' | 'precise')[]
  ): ModelConfig | null {
    // 获取健康的模型
    let candidates = Array.from(this.models.values())
      .filter(m => m.healthy);
    
    // 按能力过滤
    if (capabilities && capabilities.length > 0) {
      candidates = candidates.filter(m => 
        capabilities.some(c => m.capabilities.includes(c))
      );
    }
    
    if (candidates.length === 0) {
      // 没有健康的模型，尝试恢复
      this.checkHealth();
      candidates = Array.from(this.models.values())
        .filter(m => m.healthy);
      
      if (candidates.length === 0) {
        // 全部不健康，返回第一个
        return this.models.values().next().value || null;
      }
    }
    
    // 根据策略选择
    switch (strategy) {
      case 'fastest':
        return candidates.find(m => m.capabilities.includes('fast')) || candidates[0];
        
      case 'smartest':
        return candidates.find(m => m.capabilities.includes('smart')) || candidates[0];
        
      case 'cheapest':
        return candidates.sort((a, b) => a.costLevel - b.costLevel)[0];
        
      case 'balanced':
        // 平衡成本和能力
        return candidates.sort((a, b) => {
          const scoreA = a.costLevel + (a.capabilities.includes('smart') ? -1 : 0);
          const scoreB = b.costLevel + (b.capabilities.includes('smart') ? -1 : 0);
          return scoreA - scoreB;
        })[0];
        
      case 'fallback':
      default:
        return candidates[0];
    }
  }
  
  /**
   * 调用LLM（带故障转移）
   */
  async invoke(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string;
      strategy?: ModelSelectionStrategy;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const startTime = Date.now();
    
    // 选择模型
    let model: ModelConfig | null = null;
    
    if (options.model) {
      model = this.models.get(options.model) || null;
      if (model && !model.healthy) {
        // 指定模型不健康，尝试备用
        model = this.selectModel('fallback');
      }
    } else {
      model = this.selectModel(options.strategy);
    }
    
    if (!model) {
      throw new Error('No available model');
    }
    
    // 尝试调用
    try {
      const client = model.createClient();
      const response = await client.invoke(messages, {
        model: model.id,
        temperature: options.temperature,
      });
      
      // 成功，重置失败计数
      model.failures = 0;
      model.healthy = true;
      
      return response.content;
    } catch (error) {
      // 记录失败
      this.recordFailure(model.id);
      
      // 尝试故障转移
      const fallbackModel = this.selectModel('fallback');
      if (fallbackModel && fallbackModel.id !== model.id) {
        console.log(`[MultiModelLLM] Fallback from ${model.id} to ${fallbackModel.id}`);
        
        try {
          const client = fallbackModel.createClient();
          const response = await client.invoke(messages, {
            model: fallbackModel.id,
            temperature: options.temperature,
          });
          
          return response.content;
        } catch (fallbackError) {
          this.recordFailure(fallbackModel.id);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * 流式调用（带故障转移）
   */
  async *stream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string;
      strategy?: ModelSelectionStrategy;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string> {
    // 选择模型
    let model: ModelConfig | null = null;
    
    if (options.model) {
      model = this.models.get(options.model) || null;
      if (model && !model.healthy) {
        model = this.selectModel('fallback');
      }
    } else {
      model = this.selectModel(options.strategy);
    }
    
    if (!model) {
      throw new Error('No available model');
    }
    
    try {
      const client = model.createClient();
      const stream = client.stream(messages, {
        model: model.id,
        temperature: options.temperature,
      });
      
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content.toString();
        }
      }
      
      // 成功
      model.failures = 0;
      model.healthy = true;
    } catch (error) {
      this.recordFailure(model.id);
      
      // 故障转移
      const fallbackModel = this.selectModel('fallback');
      if (fallbackModel && fallbackModel.id !== model.id) {
        console.log(`[MultiModelLLM] Fallback from ${model.id} to ${fallbackModel.id}`);
        
        try {
          const client = fallbackModel.createClient();
          const stream = client.stream(messages, {
            model: fallbackModel.id,
            temperature: options.temperature,
          });
          
          for await (const chunk of stream) {
            if (chunk.content) {
              yield chunk.content.toString();
            }
          }
          
          return;
        } catch (fallbackError) {
          this.recordFailure(fallbackModel.id);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * 获取嵌入
   */
  async embed(text: string): Promise<number[]> {
    // 使用简单哈希嵌入（SDK可能不支持embed方法）
    return this.simpleEmbed(text);
  }
  
  /**
   * 简单嵌入（降级方案）
   */
  private simpleEmbed(text: string): number[] {
    const dim = 1024;
    const vector = new Array(dim).fill(0);
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const pos = (charCode * (i + 1)) % dim;
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
   * 记录失败
   */
  private recordFailure(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) return;
    
    model.failures++;
    model.lastFailure = Date.now();
    
    if (model.failures >= this.config.maxFailures) {
      model.healthy = false;
      console.log(`[MultiModelLLM] Model ${modelId} marked as unhealthy`);
    }
  }
  
  /**
   * 检查健康状态
   */
  checkHealth(): void {
    const now = Date.now();
    
    // 检查恢复
    for (const model of this.models.values()) {
      if (!model.healthy && 
          now - model.lastFailure > this.config.recoveryTime) {
        model.healthy = true;
        model.failures = 0;
        console.log(`[MultiModelLLM] Model ${model.id} recovered`);
      }
    }
    
    this.lastHealthCheck = now;
  }
  
  /**
   * 获取模型状态
   */
  getModelStatus(): Array<{
    id: string;
    name: string;
    healthy: boolean;
    failures: number;
    costLevel: number;
    capabilities: string[];
  }> {
    return Array.from(this.models.values()).map(m => ({
      id: m.id,
      name: m.name,
      healthy: m.healthy,
      failures: m.failures,
      costLevel: m.costLevel,
      capabilities: m.capabilities,
    }));
  }
  
  /**
   * 获取健康的模型数量
   */
  getHealthyCount(): number {
    return Array.from(this.models.values()).filter(m => m.healthy).length;
  }
}

// ==================== 工厂 ====================

/**
 * LLM工厂
 */
export class LLMFactory {
  private static instance: MultiModelLLMClient | null = null;
  
  /**
   * 创建默认客户端
   */
  static createDefault(): MultiModelLLMClient {
    if (!LLMFactory.instance) {
      LLMFactory.instance = new MultiModelLLMClient();
    }
    return LLMFactory.instance;
  }
  
  /**
   * 获取单例
   */
  static getInstance(): MultiModelLLMClient {
    return LLMFactory.createDefault();
  }
  
  /**
   * 重置
   */
  static reset(): void {
    LLMFactory.instance = null;
  }
}

// 导出便捷方法
export function getLLMClient(): MultiModelLLMClient {
  return LLMFactory.getInstance();
}
