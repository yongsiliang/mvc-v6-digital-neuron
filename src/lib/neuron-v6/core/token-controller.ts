/**
 * ═══════════════════════════════════════════════════════════════════════
 * Token控制器 - 务实版
 * 
 * 核心理念：直接控制LLM调用，而不是建复杂系统
 * 
 * 工作方式：
 * 1. 分析输入复杂度
 * 2. 决定调用策略（是否调用、用多少Token）
 * 3. 强制执行Token限制
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LLMGateway, LLMOptions, LLMMessage } from '../core/llm-gateway';

/**
 * 输入复杂度
 */
export type InputComplexity = 'simple' | 'normal' | 'complex' | 'critical';

/**
 * Token策略
 */
export interface TokenStrategy {
  /** 复杂度级别 */
  complexity: InputComplexity;
  /** 最大输入Token */
  maxInputTokens: number;
  /** 最大输出Token */
  maxOutputTokens: number;
  /** 是否需要思考链 */
  needsChainOfThought: boolean;
  /** 是否使用流式 */
  useStreaming: boolean;
  /** 描述 */
  description: string;
}

/**
 * Token策略表
 */
const TOKEN_STRATEGIES: Record<InputComplexity, TokenStrategy> = {
  simple: {
    complexity: 'simple',
    maxInputTokens: 500,
    maxOutputTokens: 200,
    needsChainOfThought: false,
    useStreaming: false,
    description: '简单问候、确认类，不需要复杂处理',
  },
  normal: {
    complexity: 'normal',
    maxInputTokens: 1500,
    maxOutputTokens: 500,
    needsChainOfThought: false,
    useStreaming: false,
    description: '常规对话，标准处理',
  },
  complex: {
    complexity: 'complex',
    maxInputTokens: 3000,
    maxOutputTokens: 1000,
    needsChainOfThought: true,
    useStreaming: true,
    description: '需要分析、推理的问题',
  },
  critical: {
    complexity: 'critical',
    maxInputTokens: 6000,
    maxOutputTokens: 2000,
    needsChainOfThought: true,
    useStreaming: true,
    description: '重要、复杂的问题，需要完整处理',
  },
};

/**
 * 分析输入复杂度
 */
export function analyzeComplexity(input: string, context?: string[]): InputComplexity {
  // 1. 长度判断
  if (input.length < 20) {
    // 检查是否是问候语
    const greetings = ['你好', 'hi', 'hello', '在吗', '谢谢', '好的', '嗯', '哦'];
    if (greetings.some(g => input.toLowerCase().includes(g))) {
      return 'simple';
    }
  }
  
  // 2. 关键词判断
  const complexKeywords = [
    '为什么', '原理', '本质', '分析', '比较', '评价',
    '如何理解', '深入', '详细', '推理', '逻辑',
  ];
  const criticalKeywords = [
    '生命', '意识', '存在', '哲学', '终极',
    '复杂系统', '多维度', '全面分析',
  ];
  
  const hasComplex = complexKeywords.some(k => input.includes(k));
  const hasCritical = criticalKeywords.some(k => input.includes(k));
  
  if (hasCritical) return 'critical';
  if (hasComplex) return 'complex';
  
  // 3. 上下文判断
  if (context && context.length > 5) {
    return 'complex';
  }
  
  // 4. 默认
  return input.length > 100 ? 'complex' : 'normal';
}

/**
 * Token控制器
 * 
 * 直接嵌入到现有系统，而不是独立模块
 */
export class TokenController {
  private gateway: LLMGateway;
  private stats = {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    savedTokens: 0,
  };
  
  constructor(gateway: LLMGateway) {
    this.gateway = gateway;
  }
  
  /**
   * 智能调用 - 根据输入自动选择策略
   */
  async smartChat(
    input: string,
    systemPrompt: string,
    context?: string[]
  ): Promise<{
    content: string;
    tokensUsed: number;
    strategy: TokenStrategy;
  }> {
    // 1. 分析复杂度
    const complexity = analyzeComplexity(input, context);
    const strategy = TOKEN_STRATEGIES[complexity];
    
    // 2. 构建消息（截断到限制内）
    const messages: LLMMessage[] = [
      { role: 'system', content: this.truncate(systemPrompt, strategy.maxInputTokens * 0.3) },
      { role: 'user', content: this.truncate(input, strategy.maxInputTokens * 0.7) },
    ];
    
    // 3. 调用LLM（带Token限制）
    const options: LLMOptions = {
      maxTokens: strategy.maxOutputTokens,
      temperature: strategy.complexity === 'simple' ? 0.9 : 0.7,
      stream: strategy.useStreaming,
    };
    
    const response = await this.gateway.chat(messages, options);
    
    // 4. 统计
    this.stats.totalCalls++;
    this.stats.totalInputTokens += this.estimateTokens(input + systemPrompt);
    this.stats.totalOutputTokens += response.usage?.completionTokens || 0;
    
    // 5. 计算节省（对比传统15000 tokens）
    const traditional = 15000;
    const actual = (response.usage?.totalTokens || 0);
    this.stats.savedTokens += Math.max(0, traditional - actual);
    
    return {
      content: response.content,
      tokensUsed: actual,
      strategy,
    };
  }
  
  /**
   * 快速响应 - 跳过LLM调用
   */
  fastResponse(input: string): string | null {
    // 简单问候直接返回
    const greetings: Record<string, string> = {
      '你好': '你好！有什么我可以帮助你的吗？',
      'hi': 'Hi! How can I help you?',
      'hello': 'Hello! How can I assist you today?',
      '在吗': '在的，有什么需要帮助的吗？',
      '谢谢': '不客气！',
    };
    
    const normalized = input.toLowerCase().trim();
    return greetings[normalized] || null;
  }
  
  /**
   * 截断文本到指定Token数
   */
  private truncate(text: string, maxTokens: number): string {
    // 简单估计：中文1字≈1.5token，英文1词≈1token
    const estimatedTokens = text.length * 0.7;
    if (estimatedTokens <= maxTokens) return text;
    
    // 截断
    const maxChars = Math.floor(maxTokens / 0.7);
    return text.slice(0, maxChars) + '...';
  }
  
  /**
   * 估计Token数
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length * 0.7);
  }
  
  /**
   * 获取统计
   */
  getStats() {
    return {
      ...this.stats,
      avgTokensPerCall: this.stats.totalCalls > 0 
        ? Math.round((this.stats.totalInputTokens + this.stats.totalOutputTokens) / this.stats.totalCalls)
        : 0,
      avgSaved: this.stats.totalCalls > 0
        ? Math.round(this.stats.savedTokens / this.stats.totalCalls)
        : 0,
    };
  }
}

/**
 * 创建Token控制器
 */
export function createTokenController(gateway: LLMGateway): TokenController {
  return new TokenController(gateway);
}
