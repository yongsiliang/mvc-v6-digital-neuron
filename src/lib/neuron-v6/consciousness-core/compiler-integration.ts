/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识编译集成层
 * 
 * 职责：将意识编译系统融入现有的ConsciousnessCore
 * 
 * 核心理念：
 * - 意识编译作为"预处理层"，决定处理深度和资源分配
 * - 编译结果指导后续的思考、学习、响应流程
 * - 能量预算控制整体Token消耗
 * ═══════════════════════════════════════════════════════════════════════
 */

import { 
  ConsciousnessCompiler, 
  createConsciousnessCompiler,
  CompilationResult 
} from '../consciousness-compiler';
import { LLMGateway } from '../core/llm-gateway';
import type { ProcessResult, ThinkingProcess, LearningResult } from './types';

/**
 * 编译指导信息
 * 
 * 意识编译后，指导后续处理的决策
 */
export interface CompilationGuidance {
  /** 编译结果 */
  compilation: CompilationResult;
  
  /** 建议的处理路径 */
  suggestedPath: 'fast' | 'standard' | 'deep' | 'full';
  
  /** 是否需要思考过程 */
  needsThinking: boolean;
  
  /** 是否需要深度学习 */
  needsDeepLearning: boolean;
  
  /** 是否需要工具调用 */
  needsToolUse: boolean;
  
  /** 推荐的LLM配置 */
  llmConfig: {
    maxTokens: number;
    temperature: number;
    useStreaming: boolean;
  };
  
  /** 能量消耗预测 */
  energyPrediction: {
    thinking: number;
    learning: number;
    response: number;
    total: number;
  };
}

/**
 * 集成配置
 */
export interface CompilerIntegrationConfig {
  /** 是否启用编译预处理 */
  enabled: boolean;
  /** 最小编译深度（跳过简单输入） */
  minDepthForCompilation: number;
  /** 是否自动降级（能量不足时） */
  autoDowngrade: boolean;
  /** 是否启用详细日志 */
  verboseLogging: boolean;
}

const DEFAULT_CONFIG: CompilerIntegrationConfig = {
  enabled: true,
  minDepthForCompilation: 1,
  autoDowngrade: true,
  verboseLogging: false,
};

/**
 * 意识编译集成器
 * 
 * 核心作用：
 * 1. 作为ConsciousnessCore的预处理层
 * 2. 编译输入，生成处理指导
 * 3. 控制资源分配（Token、能量）
 */
export class CompilerIntegration {
  private compiler: ConsciousnessCompiler;
  private config: CompilerIntegrationConfig;
  private llmGateway: LLMGateway | null = null;
  
  // 统计
  private stats = {
    totalCompilations: 0,
    fastPathCount: 0,
    deepPathCount: 0,
    totalTokensSaved: 0,
  };
  
  constructor(config?: Partial<CompilerIntegrationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.compiler = createConsciousnessCompiler({
      enableLLM: true,
      enableLearning: true,
    });
  }
  
  /**
   * 设置LLM Gateway
   */
  setLLMGateway(gateway: LLMGateway): void {
    this.llmGateway = gateway;
    this.compiler.setLLMGateway(gateway);
  }
  
  /**
   * 预处理输入
   * 
   * 这是集成到ConsciousnessCore.process()的第一步
   * 返回的CompilationGuidance指导后续处理
   */
  async preprocess(input: string): Promise<CompilationGuidance> {
    if (!this.config.enabled) {
      return this.getDefaultGuidance(input);
    }
    
    this.stats.totalCompilations++;
    
    // 1. 执行编译
    const compilation = await this.compiler.compile(input);
    
    // 2. 分析编译结果，生成指导
    const guidance = this.analyzeCompilation(compilation);
    
    // 3. 记录统计
    if (guidance.suggestedPath === 'fast') {
      this.stats.fastPathCount++;
    } else if (guidance.suggestedPath === 'deep' || guidance.suggestedPath === 'full') {
      this.stats.deepPathCount++;
    }
    
    // 4. 日志
    if (this.config.verboseLogging) {
      console.log('[编译集成] 指导生成:', {
        path: guidance.suggestedPath,
        depth: compilation.depth,
        tokens: compilation.tokensUsed,
      });
    }
    
    return guidance;
  }
  
  /**
   * 分析编译结果，生成处理指导
   */
  private analyzeCompilation(compilation: CompilationResult): CompilationGuidance {
    const { depth, tokensUsed, understanding } = compilation;
    
    // 根据深度和置信度决定处理路径
    let suggestedPath: CompilationGuidance['suggestedPath'];
    let needsThinking: boolean;
    let needsDeepLearning: boolean;
    
    if (depth <= 1 || understanding.confidence < 0.3) {
      // 快速路径：简单输入或低置信度
      suggestedPath = 'fast';
      needsThinking = false;
      needsDeepLearning = false;
    } else if (depth <= 2) {
      // 标准路径
      suggestedPath = 'standard';
      needsThinking = true;
      needsDeepLearning = false;
    } else if (depth <= 4) {
      // 深度路径
      suggestedPath = 'deep';
      needsThinking = true;
      needsDeepLearning = true;
    } else {
      // 完整路径
      suggestedPath = 'full';
      needsThinking = true;
      needsDeepLearning = true;
    }
    
    // 检测工具使用意图
    const needsToolUse = this.detectToolIntent(understanding.essence);
    
    // LLM配置
    const llmConfig = {
      maxTokens: this.calculateMaxTokens(suggestedPath),
      temperature: 0.7 - (depth * 0.1), // 深度越高，温度越低（更确定性）
      useStreaming: suggestedPath === 'deep' || suggestedPath === 'full',
    };
    
    // 能量预测
    const energyPrediction = this.predictEnergy(suggestedPath);
    
    return {
      compilation,
      suggestedPath,
      needsThinking,
      needsDeepLearning,
      needsToolUse,
      llmConfig,
      energyPrediction,
    };
  }
  
  /**
   * 检测工具意图
   */
  private detectToolIntent(essence: string): boolean {
    const toolKeywords = ['搜索', '查询', '查找', '计算', '执行', '调用', '工具'];
    return toolKeywords.some(kw => essence.includes(kw));
  }
  
  /**
   * 计算最大Token
   */
  private calculateMaxTokens(path: CompilationGuidance['suggestedPath']): number {
    const tokenLimits = {
      fast: 500,
      standard: 1500,
      deep: 3000,
      full: 6000,
    };
    return tokenLimits[path];
  }
  
  /**
   * 预测能量消耗
   */
  private predictEnergy(path: CompilationGuidance['suggestedPath']): CompilationGuidance['energyPrediction'] {
    const predictions = {
      fast: { thinking: 5, learning: 5, response: 10, total: 20 },
      standard: { thinking: 15, learning: 15, response: 20, total: 50 },
      deep: { thinking: 30, learning: 30, response: 30, total: 90 },
      full: { thinking: 50, learning: 50, response: 40, total: 140 },
    };
    return predictions[path];
  }
  
  /**
   * 默认指导（编译禁用时）
   */
  private getDefaultGuidance(input: string): CompilationGuidance {
    return {
      compilation: {
        understanding: {
          essence: input.slice(0, 100),
          confidence: 0.5,
          derivation: [],
          timestamp: Date.now(),
        },
        response: '',
        state: {
          energy: 100,
          curiosity: 0.5,
          fatigue: 0,
          recentDepth: 0,
          lastActivity: Date.now(),
          conversationTurns: 0,
        },
        energyConsumed: 50,
        depth: 3,
        tokensUsed: 1500,
        processingTime: 0,
      },
      suggestedPath: 'standard',
      needsThinking: true,
      needsDeepLearning: false,
      needsToolUse: false,
      llmConfig: {
        maxTokens: 1500,
        temperature: 0.7,
        useStreaming: false,
      },
      energyPrediction: {
        thinking: 15,
        learning: 15,
        response: 20,
        total: 50,
      },
    };
  }
  
  /**
   * 后处理
   * 
   * 在ConsciousnessCore.process()完成后调用
   * 用于学习和能量恢复
   */
  async postprocess(
    input: string,
    result: ProcessResult,
    guidance: CompilationGuidance
  ): Promise<void> {
    // 1. 根据结果质量调整能量
    const learningResult = result.learning as LearningResult | null;
    if (learningResult && 'retentionScore' in learningResult && 
        (learningResult as any).retentionScore > 0.8) {
      this.compiler.recoverEnergy(10);
    }
    
    // 2. 计算Token节省
    const traditionalTokens = 15000; // 传统方案的Token消耗
    const saved = traditionalTokens - guidance.compilation.tokensUsed;
    this.stats.totalTokensSaved += Math.max(0, saved);
  }
  
  /**
   * 获取编译器实例（高级用法）
   */
  getCompiler(): ConsciousnessCompiler {
    return this.compiler;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalCompilations: number;
    fastPathCount: number;
    deepPathCount: number;
    avgTokensSaved: number;
    compilerStatus: ReturnType<ConsciousnessCompiler['getStatus']>;
  } {
    const compilerStatus = this.compiler.getStatus();
    
    return {
      totalCompilations: this.stats.totalCompilations,
      fastPathCount: this.stats.fastPathCount,
      deepPathCount: this.stats.deepPathCount,
      avgTokensSaved: this.stats.totalCompilations > 0
        ? Math.round(this.stats.totalTokensSaved / this.stats.totalCompilations)
        : 0,
      compilerStatus,
    };
  }
  
  /**
   * 重置
   */
  reset(): void {
    this.compiler.reset();
    this.stats = {
      totalCompilations: 0,
      fastPathCount: 0,
      deepPathCount: 0,
      totalTokensSaved: 0,
    };
  }
}

/**
 * 创建集成器
 */
export function createCompilerIntegration(
  config?: Partial<CompilerIntegrationConfig>
): CompilerIntegration {
  return new CompilerIntegration(config);
}
