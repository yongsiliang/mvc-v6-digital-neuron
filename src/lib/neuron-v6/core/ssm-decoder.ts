/**
 * ═══════════════════════════════════════════════════════════════════════
 * SSM 解码器 (SSM Decoder)
 * 
 * 核心理念：
 * - 将隐式向量解码为可执行指令/可读输出
 * - 黑盒边界：只有这一步才暴露内部状态
 * - 解码规则也是隐式学习的
 * 
 * 黑盒特性：
 * - 解码过程不可逆
 * - 解码规则通过DE-RL学习
 * - 只有必须时才解码
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SSMState, SSMOutput } from './ssm-layer';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 解码器配置
 */
export interface SSMDecoderConfig {
  /** 输入向量维度 */
  inputDimension: number;
  
  /** 是否启用隐式解码 */
  enableImplicitDecoding: boolean;
  
  /** 是否使用混沌混淆 */
  enableChaos: boolean;
  
  /** 混沌强度 */
  chaosIntensity: number;
  
  /** 最大解码尝试次数 */
  maxDecodingAttempts: number;
  
  /** 解码温度（影响随机性） */
  temperature: number;
}

const DEFAULT_DECODER_CONFIG: SSMDecoderConfig = {
  inputDimension: 2048,
  enableImplicitDecoding: true,
  enableChaos: true,
  chaosIntensity: 0.02,
  maxDecodingAttempts: 3,
  temperature: 0.7,
};

/**
 * 解码后的执行指令
 */
export interface DecodedInstruction {
  /** 指令类型 */
  type: 'local_action' | 'llm_call' | 'tool_call' | 'defer' | 'reflect';
  
  /** 优先级 0-1 */
  priority: number;
  
  /** Token预算（如果是LLM调用） */
  tokenBudget: number;
  
  /** 提示词（如果是LLM调用） */
  prompt?: string;
  
  /** 工具名称（如果是工具调用） */
  toolName?: string;
  
  /** 工具参数 */
  toolArgs?: Record<string, unknown>;
  
  /** 本地动作类型 */
  localAction?: 'cache' | 'skip' | 'summarize' | 'route';
  
  /** 置信度 */
  confidence: number;
  
  /** 解码时间戳 */
  timestamp: number;
}

/**
 * 解码后的响应
 */
export interface DecodedResponse {
  /** 响应文本 */
  text: string;
  
  /** 是否需要LLM */
  needsLLM: boolean;
  
  /** 指令列表 */
  instructions: DecodedInstruction[];
  
  /** 置信度 */
  confidence: number;
  
  /** 解码耗时（ms） */
  decodingTime: number;
}

/**
 * LLM调用参数
 */
export interface LLMCallParams {
  /** 提示词 */
  prompt: string;
  
  /** 最大Token */
  maxTokens: number;
  
  /** 温度 */
  temperature: number;
  
  /** 期望输出类型 */
  expectedOutput: 'text' | 'json' | 'code';
}

/**
 * 解码上下文
 */
export interface DecodingContext {
  /** 原始输入 */
  originalInput: string;
  
  /** 对话历史 */
  conversationHistory: Array<{ role: string; content: string }>;
  
  /** 当前任务 */
  currentTask?: string;
  
  /** 用户偏好 */
  userPreferences?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// SSM解码器
// ─────────────────────────────────────────────────────────────────────

/**
 * SSM解码器
 * 
 * 黑盒边界：将隐式向量转换为可执行指令
 */
export class SSMDecoder {
  private config: SSMDecoderConfig;
  
  // 解码矩阵（隐式学习得到）
  private typeDecoder: Float32Array;      // 类型解码器
  private priorityDecoder: Float32Array;  // 优先级解码器
  private budgetDecoder: Float32Array;    // 预算解码器
  private promptDecoder: Float32Array;    // 提示词解码器
  
  // 提示词模板库
  private promptTemplates: Map<string, string>;
  
  // 统计
  private stats: {
    totalDecodings: number;
    llmCalls: number;
    localActions: number;
    toolCalls: number;
    avgConfidence: number;
  };
  
  constructor(config?: Partial<SSMDecoderConfig>) {
    this.config = { ...DEFAULT_DECODER_CONFIG, ...config };
    
    // 初始化解码矩阵
    this.typeDecoder = this.initDecoderMatrix(5);      // 5种类型
    this.priorityDecoder = this.initDecoderMatrix(1);  // 优先级
    this.budgetDecoder = this.initDecoderMatrix(1);    // 预算
    this.promptDecoder = this.initDecoderMatrix(64);   // 提示词嵌入
    
    // 初始化提示词模板
    this.promptTemplates = this.initPromptTemplates();
    
    // 初始化统计
    this.stats = {
      totalDecodings: 0,
      llmCalls: 0,
      localActions: 0,
      toolCalls: 0,
      avgConfidence: 0,
    };
  }
  
  /**
   * 解码SSM输出
   */
  decode(ssmOutput: SSMOutput, context?: DecodingContext): DecodedResponse {
    const startTime = Date.now();
    
    // ─── Step 1: 解码类型 ───
    const type = this.decodeType(ssmOutput.y);
    
    // ─── Step 2: 解码优先级 ───
    const priority = this.decodePriority(ssmOutput.y);
    
    // ─── Step 3: 解码预算 ───
    const tokenBudget = this.decodeBudget(ssmOutput.y);
    
    // ─── Step 4: 构建指令 ───
    const instruction: DecodedInstruction = {
      type,
      priority,
      tokenBudget,
      confidence: ssmOutput.confidence,
      timestamp: startTime,
    };
    
    // 根据类型填充详细内容
    switch (type) {
      case 'llm_call':
        instruction.prompt = this.decodePrompt(ssmOutput.y, context);
        this.stats.llmCalls++;
        break;
        
      case 'tool_call':
        const toolInfo = this.decodeToolCall(ssmOutput.y);
        instruction.toolName = toolInfo.name;
        instruction.toolArgs = toolInfo.args;
        this.stats.toolCalls++;
        break;
        
      case 'local_action':
        instruction.localAction = this.decodeLocalAction(ssmOutput.y);
        this.stats.localActions++;
        break;
        
      case 'reflect':
        instruction.prompt = '请反思当前的思考过程';
        this.stats.llmCalls++;
        break;
        
      case 'defer':
        // 延迟决策，不做任何操作
        break;
    }
    
    // 更新统计
    this.stats.totalDecodings++;
    this.stats.avgConfidence = 
      (this.stats.avgConfidence * (this.stats.totalDecodings - 1) + ssmOutput.confidence)
      / this.stats.totalDecodings;
    
    return {
      text: '',  // 实际文本需要LLM生成
      needsLLM: type === 'llm_call' || type === 'reflect',
      instructions: [instruction],
      confidence: ssmOutput.confidence,
      decodingTime: Date.now() - startTime,
    };
  }
  
  /**
   * 解码为LLM调用参数
   */
  decodeToLLMParams(ssmOutput: SSMOutput, context?: DecodingContext): LLMCallParams {
    const decoded = this.decode(ssmOutput, context);
    
    return {
      prompt: decoded.instructions[0]?.prompt || '',
      maxTokens: decoded.instructions[0]?.tokenBudget || 500,
      temperature: this.config.temperature,
      expectedOutput: 'text',
    };
  }
  
  /**
   * 解码为工具调用参数
   */
  decodeToToolParams(ssmOutput: SSMOutput): { name: string; args: Record<string, unknown> } | null {
    const decoded = this.decode(ssmOutput);
    
    if (decoded.instructions[0]?.type !== 'tool_call') {
      return null;
    }
    
    return {
      name: decoded.instructions[0].toolName || '',
      args: decoded.instructions[0].toolArgs || {},
    };
  }
  
  /**
   * 快速判断是否需要外部调用
   */
  needsExternalCall(ssmOutput: SSMOutput): boolean {
    // 基于输出向量的简单判断
    const norm = this.computeNorm(ssmOutput.y);
    const threshold = this.config.inputDimension ** 0.5 * 0.618;
    
    return norm > threshold || ssmOutput.triggerExternal;
  }
  
  /**
   * 从基因组更新权重（DE-RL优化）
   */
  updateFromGenome(genome: Float32Array): void {
    const dim = this.config.inputDimension;
    let offset = 0;
    
    // typeDecoder: dim * 5
    this.typeDecoder.set(genome.slice(offset, offset + dim * 5));
    offset += dim * 5;
    
    // priorityDecoder: dim * 1
    this.priorityDecoder.set(genome.slice(offset, offset + dim));
    offset += dim;
    
    // budgetDecoder: dim * 1
    this.budgetDecoder.set(genome.slice(offset, offset + dim));
    offset += dim;
    
    // promptDecoder: dim * 64
    this.promptDecoder.set(genome.slice(offset, offset + dim * 64));
  }
  
  /**
   * 导出为基因组
   */
  exportToGenome(): Float32Array {
    const dim = this.config.inputDimension;
    const totalSize = dim * 5 + dim + dim + dim * 64;
    
    const genome = new Float32Array(totalSize);
    let offset = 0;
    
    genome.set(this.typeDecoder, offset); offset += dim * 5;
    genome.set(this.priorityDecoder, offset); offset += dim;
    genome.set(this.budgetDecoder, offset); offset += dim;
    genome.set(this.promptDecoder, offset);
    
    return genome;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 解码类型
   */
  private decodeType(vector: Float32Array): DecodedInstruction['type'] {
    const types: DecodedInstruction['type'][] = ['local_action', 'llm_call', 'tool_call', 'defer', 'reflect'];
    const dim = this.config.inputDimension;
    
    // 计算每种类型的得分
    const scores: number[] = [];
    for (let t = 0; t < 5; t++) {
      let score = 0;
      for (let i = 0; i < dim && i < vector.length; i++) {
        score += vector[i] * this.typeDecoder[t * dim + i];
      }
      scores.push(score);
    }
    
    // 加上温度控制的随机性
    if (this.config.enableChaos) {
      for (let i = 0; i < scores.length; i++) {
        scores[i] += (Math.random() * 2 - 1) * this.config.chaosIntensity;
      }
    }
    
    // 取最大值
    let maxIdx = 0;
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[maxIdx]) {
        maxIdx = i;
      }
    }
    
    return types[maxIdx];
  }
  
  /**
   * 解码优先级
   */
  private decodePriority(vector: Float32Array): number {
    const dim = this.config.inputDimension;
    
    let score = 0;
    for (let i = 0; i < dim && i < vector.length; i++) {
      score += vector[i] * this.priorityDecoder[i];
    }
    
    // 映射到0-1范围
    const priority = Math.tanh(score) * 0.5 + 0.5;
    
    return Math.max(0, Math.min(1, priority));
  }
  
  /**
   * 解码Token预算
   */
  private decodeBudget(vector: Float32Array): number {
    const dim = this.config.inputDimension;
    
    let score = 0;
    for (let i = 0; i < dim && i < vector.length; i++) {
      score += vector[i] * this.budgetDecoder[i];
    }
    
    // 映射到合理范围：100-4000
    const budget = Math.abs(score) * 2000 + 100;
    
    return Math.min(4000, Math.max(100, budget));
  }
  
  /**
   * 解码提示词
   */
  private decodePrompt(vector: Float32Array, context?: DecodingContext): string {
    const dim = this.config.inputDimension;
    
    // 计算提示词嵌入向量
    const promptEmbedding = new Float32Array(64);
    for (let i = 0; i < 64; i++) {
      let sum = 0;
      for (let j = 0; j < dim && j < vector.length; j++) {
        sum += vector[j] * this.promptDecoder[i * dim + j];
      }
      promptEmbedding[i] = sum;
    }
    
    // 从模板库匹配最相似的提示词
    const bestMatch = this.findBestPromptTemplate(promptEmbedding);
    
    // 如果有上下文，进行插值
    if (context?.originalInput) {
      return `${bestMatch}\n\n用户输入：${context.originalInput.slice(0, 200)}`;
    }
    
    return bestMatch;
  }
  
  /**
   * 解码工具调用
   */
  private decodeToolCall(vector: Float32Array): { name: string; args: Record<string, unknown> } {
    // 简化实现：基于向量哈希选择工具
    const hash = this.vectorHash(vector);
    
    const tools = ['search', 'calculator', 'code_executor', 'file_reader', 'api_caller'];
    const toolName = tools[hash % tools.length];
    
    // 工具参数（简化）
    const args: Record<string, unknown> = {};
    if (toolName === 'search') {
      args.query = '从向量解码的查询';
    }
    
    return { name: toolName, args };
  }
  
  /**
   * 解码本地动作
   */
  private decodeLocalAction(vector: Float32Array): 'cache' | 'skip' | 'summarize' | 'route' {
    const actions: ('cache' | 'skip' | 'summarize' | 'route')[] = ['cache', 'skip', 'summarize', 'route'];
    const hash = this.vectorHash(vector);
    return actions[hash % 4];
  }
  
  /**
   * 查找最佳提示词模板
   */
  private findBestPromptTemplate(embedding: Float32Array): string {
    // 简化实现：基于嵌入哈希选择模板
    let sum = 0;
    for (let i = 0; i < embedding.length; i++) {
      sum += Math.abs(embedding[i]);
    }
    
    const idx = Math.floor(sum * 10) % this.promptTemplates.size;
    const keys = Array.from(this.promptTemplates.keys());
    
    return this.promptTemplates.get(keys[idx]) || '请分析以下内容：';
  }
  
  /**
   * 初始化解码矩阵
   */
  private initDecoderMatrix(outputDim: number): Float32Array {
    const dim = this.config.inputDimension;
    const matrix = new Float32Array(dim * outputDim);
    const scale = Math.sqrt(2.0 / dim);
    
    for (let i = 0; i < matrix.length; i++) {
      matrix[i] = (Math.random() * 2 - 1) * scale;
    }
    
    return matrix;
  }
  
  /**
   * 初始化提示词模板
   */
  private initPromptTemplates(): Map<string, string> {
    const templates = new Map<string, string>();
    
    templates.set('analyze', '请深入分析以下内容，提取关键信息：');
    templates.set('reason', '请对以下问题进行逻辑推理：');
    templates.set('creative', '请发挥创意，思考以下主题：');
    templates.set('summarize', '请简洁总结以下内容：');
    templates.set('compare', '请比较以下内容的异同：');
    templates.set('explain', '请解释以下概念：');
    templates.set('suggest', '请针对以下情况提供建议：');
    templates.set('verify', '请验证以下结论是否正确：');
    
    return templates;
  }
  
  /**
   * 向量哈希
   */
  private vectorHash(vector: Float32Array): number {
    let hash = 0;
    for (let i = 0; i < vector.length; i++) {
      hash = ((hash << 5) - hash) + Math.floor(vector[i] * 1000);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * 计算向量范数
   */
  private computeNorm(vector: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vector.length; i++) {
      sum += vector[i] * vector[i];
    }
    return Math.sqrt(sum);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSSMDecoder(config?: Partial<SSMDecoderConfig>): SSMDecoder {
  return new SSMDecoder(config);
}

export default SSMDecoder;
