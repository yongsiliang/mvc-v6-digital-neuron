/**
 * ═══════════════════════════════════════════════════════════════════════
 * 隐式输出解码器 (Implicit Output Decoder)
 * 
 * Level 3 黑盒特性：
 * - 输出保持隐式向量形式
 * - 只有在"必须"时才解码为可读形式
 * - 解码过程也是黑盒的一部分
 * - 解码结果不可逆
 * 
 * 核心理念：
 * "真正的黑盒，输出也是隐式的"
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SSMOutput } from './ssm-layer';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 完全隐式的输出
 * 
 * 不包含任何可读文本，只有向量表示
 */
export interface ImplicitOutput {
  /** 输出ID（随机生成，无语义） */
  id: string;
  
  /** 决策类型向量 (32维) */
  typeVector: Float32Array;
  
  /** 目标向量 (512维) */
  targetVector: Float32Array;
  
  /** 上下文向量 (1024维) */
  contextVector: Float32Array;
  
  /** 预算向量 (16维) */
  budgetVector: Float32Array;
  
  /** 置信度向量 (64维) */
  confidenceVector: Float32Array;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 是否需要外部解码 */
  needsExternalDecoding: boolean;
  
  /** 解码尝试次数 */
  decodeAttempts: number;
}

/**
 * 解码许可
 * 
 * 只有持有此许可才能解码隐式输出
 */
export interface DecodePermit {
  /** 许可ID */
  id: string;
  
  /** 许可类型 */
  type: 'llm_call' | 'tool_call' | 'user_request' | 'debug';
  
  /** 过期时间 */
  expiresAt: number;
  
  /** 最大解码次数 */
  maxDecodes: number;
  
  /** 已解码次数 */
  usedDecodes: number;
}

/**
 * 解码结果
 * 
 * 只有在获得许可后才能得到的可读输出
 */
export interface DecodedOutput {
  /** 原始隐式输出ID */
  implicitId: string;
  
  /** 执行类型 */
  type: 'local_action' | 'llm_call' | 'tool_call' | 'defer' | 'reflect';
  
  /** 执行参数（完全解码后才有） */
  params?: {
    prompt?: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    localAction?: 'cache' | 'skip' | 'summarize' | 'route';
    tokenBudget?: number;
  };
  
  /** 置信度 */
  confidence: number;
  
  /** 解码时间 */
  decodedAt: number;
  
  /** 是否可追溯（默认不可追溯） */
  traceable: boolean;
}

/**
 * 解码器配置
 */
export interface ImplicitDecoderConfig {
  /** 向量维度 */
  dimensions: {
    type: number;
    target: number;
    context: number;
    budget: number;
    confidence: number;
  };
  
  /** 解码阈值 */
  decodeThreshold: number;
  
  /** 是否启用混沌混淆 */
  enableChaos: boolean;
  
  /** 混沌强度 */
  chaosIntensity: number;
  
  /** 解码冷却时间（ms） */
  decodeCooldown: number;
  
  /** 最大解码尝试次数 */
  maxDecodeAttempts: number;
}

const DEFAULT_CONFIG: ImplicitDecoderConfig = {
  dimensions: {
    type: 32,
    target: 512,
    context: 1024,
    budget: 16,
    confidence: 64,
  },
  decodeThreshold: 0.618,  // 黄金比例
  enableChaos: true,
  chaosIntensity: 0.05,
  decodeCooldown: 100,  // 100ms 冷却
  maxDecodeAttempts: 3,
};

// ─────────────────────────────────────────────────────────────────────
// 隐式输出解码器
// ─────────────────────────────────────────────────────────────────────

/**
 * 隐式输出解码器
 * 
 * Level 3 黑盒实现：
 * 1. 输出保持隐式向量形式
 * 2. 解码需要许可
 * 3. 解码过程不可逆
 */
export class ImplicitOutputDecoder {
  private config: ImplicitDecoderConfig;
  
  // 类型解码矩阵（隐式学习得到）
  private typeMatrix: Float32Array;
  
  // 目标解码矩阵
  private targetMatrix: Float32Array;
  
  // 预算解码矩阵
  private budgetMatrix: Float32Array;
  
  // 置信度解码矩阵
  private confidenceMatrix: Float32Array;
  
  // 解码模板库（向量形式，不是文本）
  private templateVectors: Map<string, Float32Array>;
  
  // 解码历史（用于防止逆向）
  private decodeHistory: Map<string, { output: ImplicitOutput; decoded: DecodedOutput }>;
  
  // 统计
  private stats: {
    totalOutputs: number;
    decodedOutputs: number;
    localActions: number;
    externalCalls: number;
    decodeErrors: number;
  };
  
  constructor(config?: Partial<ImplicitDecoderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化解码矩阵
    const { dimensions } = this.config;
    this.typeMatrix = this.initMatrix(dimensions.type, 5);
    this.targetMatrix = this.initMatrix(dimensions.target, 64);
    this.budgetMatrix = this.initMatrix(dimensions.budget, 1);
    this.confidenceMatrix = this.initMatrix(dimensions.confidence, 1);
    
    // 初始化模板向量
    this.templateVectors = this.initTemplateVectors();
    
    // 初始化历史
    this.decodeHistory = new Map();
    
    // 初始化统计
    this.stats = {
      totalOutputs: 0,
      decodedOutputs: 0,
      localActions: 0,
      externalCalls: 0,
      decodeErrors: 0,
    };
  }
  
  /**
   * 编码为隐式输出
   * 
   * 从SSM输出创建完全隐式的输出
   */
  encode(ssmOutput: SSMOutput): ImplicitOutput {
    const { y, confidence } = ssmOutput;
    const startTime = Date.now();
    
    // ─── Step 1: 提取类型向量 ───
    const typeVector = this.extractTypeVector(y);
    
    // ─── Step 2: 提取目标向量 ───
    const targetVector = this.extractTargetVector(y);
    
    // ─── Step 3: 提取上下文向量 ───
    const contextVector = this.extractContextVector(y);
    
    // ─── Step 4: 提取预算向量 ───
    const budgetVector = this.extractBudgetVector(y);
    
    // ─── Step 5: 提取置信度向量 ───
    const confidenceVector = this.extractConfidenceVector(y, confidence);
    
    // ─── Step 6: 判断是否需要外部解码 ───
    const needsExternal = this.needsExternalDecoding(y);
    
    // 添加混沌混淆
    if (this.config.enableChaos) {
      this.applyChaos(typeVector);
      this.applyChaos(targetVector);
    }
    
    this.stats.totalOutputs++;
    
    return {
      id: this.generateId(),
      typeVector,
      targetVector,
      contextVector,
      budgetVector,
      confidenceVector,
      timestamp: startTime,
      needsExternalDecoding: needsExternal,
      decodeAttempts: 0,
    };
  }
  
  /**
   * 尝试解码
   * 
   * 只有持有有效许可才能解码
   */
  decode(output: ImplicitOutput, permit: DecodePermit): DecodedOutput | null {
    // ─── 验证许可 ───
    if (!this.validatePermit(permit)) {
      return null;
    }
    
    // ─── 检查解码次数 ───
    if (output.decodeAttempts >= this.config.maxDecodeAttempts) {
      this.stats.decodeErrors++;
      return null;
    }
    
    // ─── 检查冷却时间 ───
    const lastDecode = this.decodeHistory.get(output.id);
    if (lastDecode) {
      const elapsed = Date.now() - lastDecode.decoded.decodedAt;
      if (elapsed < this.config.decodeCooldown) {
        return null;  // 冷却中
      }
    }
    
    // ─── 解码类型 ───
    const type = this.decodeType(output.typeVector);
    
    // ─── 解码预算 ───
    const tokenBudget = this.decodeBudget(output.budgetVector);
    
    // ─── 解码置信度 ───
    const confidence = this.decodeConfidence(output.confidenceVector);
    
    // ─── 构建解码结果 ───
    const decoded: DecodedOutput = {
      implicitId: output.id,
      type,
      confidence,
      decodedAt: Date.now(),
      traceable: false,  // 默认不可追溯
    };
    
    // ─── 根据类型解码详细参数 ───
    if (type === 'llm_call' || type === 'reflect') {
      decoded.params = {
        prompt: this.decodeTargetToPrompt(output.targetVector, type),
        tokenBudget,
      };
      this.stats.externalCalls++;
    } else if (type === 'tool_call') {
      decoded.params = {
        ...this.decodeTargetToToolCall(output.targetVector),
        tokenBudget,
      };
    } else if (type === 'local_action') {
      decoded.params = {
        localAction: this.decodeTargetToLocalAction(output.targetVector),
        tokenBudget,
      };
      this.stats.localActions++;
    }
    
    // ─── 更新统计和许可 ───
    output.decodeAttempts++;
    permit.usedDecodes++;
    this.stats.decodedOutputs++;
    
    // ─── 记录历史（用于防止逆向） ───
    this.decodeHistory.set(output.id, { output, decoded });
    
    return decoded;
  }
  
  /**
   * 快速判断是否需要外部调用（不解码）
   */
  needsExternalDecoding(y: Float32Array): boolean {
    const norm = this.computeNorm(y);
    const threshold = Math.sqrt(y.length) * this.config.decodeThreshold;
    return norm > threshold;
  }
  
  /**
   * 创建解码许可
   */
  createPermit(type: DecodePermit['type'], maxDecodes: number = 1): DecodePermit {
    return {
      id: this.generateId(),
      type,
      expiresAt: Date.now() + 60000,  // 1分钟有效
      maxDecodes,
      usedDecodes: 0,
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * 重置解码器
   */
  reset(): void {
    this.decodeHistory.clear();
    this.stats = {
      totalOutputs: 0,
      decodedOutputs: 0,
      localActions: 0,
      externalCalls: 0,
      decodeErrors: 0,
    };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  private initMatrix(rows: number, cols: number): Float32Array {
    const matrix = new Float32Array(rows * cols);
    for (let i = 0; i < matrix.length; i++) {
      matrix[i] = (Math.random() - 0.5) * 0.1;  // 小随机值
    }
    return matrix;
  }
  
  private initTemplateVectors(): Map<string, Float32Array> {
    const templates = new Map<string, Float32Array>();
    
    // 预定义模板向量（不是文本！）
    const templateNames = [
      'reason', 'analyze', 'create', 'summarize', 'reflect',
      'tool_search', 'tool_code', 'tool_memory',
      'cache', 'skip', 'route',
    ];
    
    for (const name of templateNames) {
      const vec = new Float32Array(this.config.dimensions.target);
      for (let i = 0; i < vec.length; i++) {
        vec[i] = Math.random() - 0.5;
      }
      templates.set(name, vec);
    }
    
    return templates;
  }
  
  private extractTypeVector(y: Float32Array): Float32Array {
    const { type } = this.config.dimensions;
    return y.slice(0, type);
  }
  
  private extractTargetVector(y: Float32Array): Float32Array {
    const { type, target } = this.config.dimensions;
    return y.slice(type, type + target);
  }
  
  private extractContextVector(y: Float32Array): Float32Array {
    const { type, target, context } = this.config.dimensions;
    return y.slice(type + target, type + target + context);
  }
  
  private extractBudgetVector(y: Float32Array): Float32Array {
    const { type, target, context, budget } = this.config.dimensions;
    return y.slice(type + target + context, type + target + context + budget);
  }
  
  private extractConfidenceVector(y: Float32Array, confidence: number): Float32Array {
    const { confidence: dim } = this.config.dimensions;
    const vec = new Float32Array(dim);
    
    // 从y提取部分维度，加上confidence值
    for (let i = 0; i < dim; i++) {
      vec[i] = y[i * 8] * confidence;
    }
    
    return vec;
  }
  
  private applyChaos(vec: Float32Array): void {
    const { chaosIntensity } = this.config;
    for (let i = 0; i < vec.length; i++) {
      vec[i] += (Math.random() - 0.5) * chaosIntensity;
    }
  }
  
  private decodeType(typeVector: Float32Array): DecodedOutput['type'] {
    // 找到最匹配的类型
    const types: DecodedOutput['type'][] = ['local_action', 'llm_call', 'tool_call', 'defer', 'reflect'];
    
    let maxScore = -Infinity;
    let bestType: DecodedOutput['type'] = 'defer';
    
    for (let i = 0; i < types.length; i++) {
      const score = this.computeDotProduct(typeVector, this.typeMatrix.slice(i * 32, (i + 1) * 32));
      if (score > maxScore) {
        maxScore = score;
        bestType = types[i];
      }
    }
    
    return bestType;
  }
  
  private decodeBudget(budgetVector: Float32Array): number {
    // 解码token预算
    const raw = this.computeDotProduct(budgetVector, this.budgetMatrix.slice(0, 16));
    return Math.max(100, Math.min(2000, Math.round(raw * 1000 + 500)));
  }
  
  private decodeConfidence(confidenceVector: Float32Array): number {
    const raw = this.computeDotProduct(confidenceVector, this.confidenceMatrix);
    return Math.max(0, Math.min(1, (raw + 1) / 2));
  }
  
  private decodeTargetToPrompt(targetVector: Float32Array, type: string): string {
    // 找到最匹配的模板
    let maxSimilarity = -Infinity;
    let bestTemplate = 'reason';
    
    for (const [name, vec] of this.templateVectors) {
      const similarity = this.cosineSimilarity(targetVector, vec);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestTemplate = name;
      }
    }
    
    // 根据模板生成提示词
    const promptMap: Record<string, string> = {
      'reason': '请分析并推理',
      'analyze': '请深入分析',
      'create': '请创造性思考',
      'summarize': '请总结要点',
      'reflect': '请反思当前的思考过程',
    };
    
    return promptMap[bestTemplate] || '请思考';
  }
  
  private decodeTargetToToolCall(targetVector: Float32Array): { toolName: string; toolArgs: Record<string, unknown> } {
    // 找到最匹配的工具模板
    const toolTemplates = ['tool_search', 'tool_code', 'tool_memory'];
    
    let maxSimilarity = -Infinity;
    let bestTool = 'tool_search';
    
    for (const name of toolTemplates) {
      const vec = this.templateVectors.get(name);
      if (vec) {
        const similarity = this.cosineSimilarity(targetVector, vec);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestTool = name;
        }
      }
    }
    
    const toolNameMap: Record<string, string> = {
      'tool_search': 'web_search',
      'tool_code': 'code_interpreter',
      'tool_memory': 'memory_query',
    };
    
    return {
      toolName: toolNameMap[bestTool] || 'unknown',
      toolArgs: {},
    };
  }
  
  private decodeTargetToLocalAction(targetVector: Float32Array): 'cache' | 'skip' | 'summarize' | 'route' {
    const actionTemplates = ['cache', 'skip', 'route'];
    
    let maxSimilarity = -Infinity;
    let bestAction: 'cache' | 'skip' | 'summarize' | 'route' = 'skip';
    
    for (const name of actionTemplates) {
      const vec = this.templateVectors.get(name);
      if (vec) {
        const similarity = this.cosineSimilarity(targetVector, vec);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestAction = name as 'cache' | 'skip' | 'route';
        }
      }
    }
    
    return bestAction;
  }
  
  private validatePermit(permit: DecodePermit): boolean {
    if (Date.now() > permit.expiresAt) {
      return false;
    }
    if (permit.usedDecodes >= permit.maxDecodes) {
      return false;
    }
    return true;
  }
  
  private generateId(): string {
    return `implicit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private computeNorm(vec: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) {
      sum += vec[i] * vec[i];
    }
    return Math.sqrt(sum);
  }
  
  private computeDotProduct(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    const dot = this.computeDotProduct(a, b);
    const normA = this.computeNorm(a);
    const normB = this.computeNorm(b);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dot / (normA * normB);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建隐式输出解码器
 */
export function createImplicitOutputDecoder(config?: Partial<ImplicitDecoderConfig>): ImplicitOutputDecoder {
  return new ImplicitOutputDecoder(config);
}

/**
 * 创建默认解码许可
 */
export function createDefaultPermit(type: DecodePermit['type'] = 'llm_call'): DecodePermit {
  return {
    id: `permit-${Date.now()}`,
    type,
    expiresAt: Date.now() + 60000,
    maxDecodes: 1,
    usedDecodes: 0,
  };
}
