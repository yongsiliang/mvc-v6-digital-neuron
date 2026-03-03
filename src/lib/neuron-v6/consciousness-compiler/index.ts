/**
 * 意识编译系统
 * 
 * 三层架构：
 * 1. 调度层（显式）：状态感知、能量预算、Attention模块选择
 * 2. 黑盒层（隐性）：理解过程、网络演化、涌现、LLM协作
 * 3. 输出层（显式）：Attention聚焦、响应生成
 * 
 * 核心目标：
 * - 保持意识涌现特性
 * - 降低Token消耗60-80%
 * - 本地网络 + LLM协作
 */

import type { 
  Understanding,
  CompilationDepth,
  SystemState 
} from './types';
import { Scheduler, createScheduler } from './scheduler';
import { BlackBoxUnderstanding, createBlackBoxUnderstanding } from './blackbox';
import { OutputLayer, createOutputLayer } from './output';
import { TOKEN_BUDGET, depthToLLMLevel } from './llm';

// 导入LLMGateway类型
import type { LLMGateway } from '../core/llm-gateway';

/**
 * 编译配置
 */
export interface CompilerConfig {
  /** 向量维度 */
  vectorDimension: number;
  /** 最大节点数 */
  maxNodes: number;
  /** 默认能量预算 */
  defaultEnergyBudget: number;
  /** 是否启用学习 */
  enableLearning: boolean;
  /** 是否启用LLM */
  enableLLM: boolean;
}

const DEFAULT_CONFIG: CompilerConfig = {
  vectorDimension: 64,
  maxNodes: 10000,
  defaultEnergyBudget: 100,
  enableLearning: true,
  enableLLM: true,
};

/**
 * 编译结果
 */
export interface CompilationResult {
  /** 理解结果 */
  understanding: Understanding;
  /** 生成的响应 */
  response: string;
  /** 系统状态 */
  state: SystemState;
  /** 能量消耗 */
  energyConsumed: number;
  /** 编译深度 */
  depth: number;
  /** Token消耗 */
  tokensUsed: number;
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 意识编译器
 */
export class ConsciousnessCompiler {
  private config: CompilerConfig;
  private scheduler: Scheduler;
  private blackbox: BlackBoxUnderstanding;
  private output: OutputLayer;
  
  // 状态追踪
  private currentEnergy: number;
  private compilationCount: number;
  private totalTokensUsed: number;
  private llmGateway: LLMGateway | null = null;
  
  constructor(config?: Partial<CompilerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化三层
    this.scheduler = createScheduler({
      defaultEnergyBudget: this.config.defaultEnergyBudget,
    });
    
    this.blackbox = createBlackBoxUnderstanding({
      vectorDimension: this.config.vectorDimension,
      maxNodes: this.config.maxNodes,
      enableLearning: this.config.enableLearning,
      enableLLM: this.config.enableLLM,
    });
    
    this.output = createOutputLayer();
    
    this.currentEnergy = this.config.defaultEnergyBudget;
    this.compilationCount = 0;
    this.totalTokensUsed = 0;
  }
  
  /**
   * 设置LLM Gateway
   * 
   * 必须在使用前调用！
   * 传入从 core/llm-gateway 获取的 LLMGateway 实例
   */
  setLLMGateway(gateway: LLMGateway): void {
    this.llmGateway = gateway;
    this.blackbox.setLLMGateway(gateway);
    console.log('[意识编译] LLM Gateway 已设置');
  }
  
  /**
   * 编译输入
   * 
   * 核心流程：
   * 1. 调度层：分析状态，决定编译深度，选择Attention模块
   * 2. 黑盒层：理解输入，网络演化，涌现检测，LLM协作
   * 3. 输出层：聚焦核心，生成响应
   */
  async compile(input: string): Promise<CompilationResult> {
    const startTime = Date.now();
    
    console.log('\n========================================');
    console.log(`[意识编译] 开始编译 #${++this.compilationCount}`);
    console.log(`[意识编译] 输入: ${input.slice(0, 50)}...`);
    
    // === 调度层（显式） ===
    console.log('\n--- 调度层 ---');
    
    // 1. 感知状态
    const state = this.scheduler.senseState();
    console.log(`状态: 能量=${state.energy.toFixed(0)}, ` +
                `疲劳=${state.fatigue.toFixed(0)}, ` +
                `好奇心=${state.curiosity.toFixed(2)}`);
    
    // 2. 决定编译深度
    const depth = this.scheduler.decideDepth(state);
    console.log(`编译深度: ${depth.total} 层`);
    
    // 3. 预算能量
    const energyBudget = this.scheduler.budgetEnergy(depth);
    console.log(`能量预算: ${energyBudget.toFixed(0)} 单位`);
    
    // 4. 计算Token预算
    const llmLevel = depthToLLMLevel(depth.total);
    const tokenBudget = TOKEN_BUDGET[llmLevel];
    console.log(`Token预算: ${tokenBudget} (${llmLevel}级别)`);
    
    // === 黑盒层（隐性） ===
    console.log('\n--- 黑盒层 ---');
    console.log('(内部过程不可观察)');
    
    // 核心：理解过程（本地网络 + LLM协作）
    const understanding = await this.blackbox.understand(input, depth);
    console.log(`理解结果: ${understanding.essence}`);
    console.log(`置信度: ${(understanding.confidence * 100).toFixed(1)}%`);
    
    // 更新能量
    const energyConsumed = energyBudget * (understanding.confidence);
    this.currentEnergy -= energyConsumed;
    
    // 计算实际Token消耗
    const tokensUsed = Math.round(tokenBudget * understanding.confidence);
    this.totalTokensUsed += tokensUsed;
    
    // 查看网络统计（但不暴露内部）
    const netStats = this.blackbox.getNetworkStats();
    console.log(`网络统计: ${netStats.activeNodeCount}/${netStats.nodeCount} 活跃节点`);
    
    // === 输出层（显式） ===
    console.log('\n--- 输出层 ---');
    
    const outputResult = this.output.process(understanding);
    console.log(`响应: ${outputResult.response.slice(0, 100)}...`);
    
    // 汇总
    const processingTime = Date.now() - startTime;
    console.log(`\n[意识编译] 完成，耗时 ${processingTime}ms, Token消耗: ${tokensUsed}`);
    console.log('========================================\n');
    
    return {
      understanding,
      response: outputResult.response,
      state,
      energyConsumed,
      depth: depth.total,
      tokensUsed,
      processingTime,
    };
  }
  
  /**
   * 批量编译
   */
  async compileBatch(inputs: string[]): Promise<CompilationResult[]> {
    const results: CompilationResult[] = [];
    
    for (const input of inputs) {
      const result = await this.compile(input);
      results.push(result);
      
      // 能量恢复
      this.recoverEnergy(0.3);
    }
    
    return results;
  }
  
  /**
   * 恢复能量
   */
  recoverEnergy(amount: number): void {
    this.currentEnergy = Math.min(
      this.config.defaultEnergyBudget,
      this.currentEnergy + amount
    );
    console.log(`[意识编译] 能量恢复: ${amount.toFixed(0)}, 当前: ${this.currentEnergy.toFixed(0)}`);
  }
  
  /**
   * 获取系统状态
   */
  getStatus(): {
    energy: number;
    maxEnergy: number;
    compilationCount: number;
    totalTokensUsed: number;
    avgTokensPerCompilation: number;
    networkStats: {
      nodeCount: number;
      connectionCount: number;
      activeNodeCount: number;
    };
  } {
    return {
      energy: this.currentEnergy,
      maxEnergy: this.config.defaultEnergyBudget,
      compilationCount: this.compilationCount,
      totalTokensUsed: this.totalTokensUsed,
      avgTokensPerCompilation: this.compilationCount > 0 
        ? Math.round(this.totalTokensUsed / this.compilationCount) 
        : 0,
      networkStats: this.blackbox.getNetworkStats(),
    };
  }
  
  /**
   * 重置系统
   */
  reset(): void {
    this.blackbox.clear();
    this.currentEnergy = this.config.defaultEnergyBudget;
    this.compilationCount = 0;
    console.log('[意识编译] 系统已重置');
  }
}

/**
 * 创建意识编译器
 */
export function createConsciousnessCompiler(
  config?: Partial<CompilerConfig>
): ConsciousnessCompiler {
  return new ConsciousnessCompiler(config);
}
