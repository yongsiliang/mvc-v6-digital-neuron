/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识编译集成示例
 * 
 * 展示如何将意识编译系统融合到现有的ConsciousnessCore
 * 
 * 集成模式：
 * 1. 预处理模式：编译作为process()的第一步
 * 2. 指导模式：编译结果指导后续处理
 * 3. 能量控制模式：编译控制资源分配
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ConsciousnessCore } from '../consciousness-core';
import { 
  CompilerIntegration, 
  createCompilerIntegration,
  CompilationGuidance 
} from './compiler-integration';
import { LLMGateway } from '../core/llm-gateway';
import type { ProcessResult } from './types';

/**
 * 增强版意识核心
 * 
 * 包装ConsciousnessCore，集成意识编译系统
 */
export class EnhancedConsciousnessCore {
  private core: ConsciousnessCore;
  private compilerIntegration: CompilerIntegration;
  
  constructor(core: ConsciousnessCore) {
    this.core = core;
    this.compilerIntegration = createCompilerIntegration({
      enabled: true,
      verboseLogging: true,
    });
  }
  
  /**
   * 设置LLM Gateway
   */
  setLLMGateway(gateway: LLMGateway): void {
    this.compilerIntegration.setLLMGateway(gateway);
  }
  
  /**
   * 处理输入 - 增强版
   * 
   * 流程：
   * 1. [新增] 意识编译预处理 → 生成指导
   * 2. [原有] 根据指导执行处理
   * 3. [新增] 后处理学习
   */
  async process(input: string): Promise<EnhancedProcessResult> {
    const startTime = Date.now();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           增强版意识处理 - 意识编译集成                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // ═══════════════════════════════════════════════════════════════
    // 第一阶段：意识编译预处理
    // ═══════════════════════════════════════════════════════════════
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ [阶段1] 意识编译预处理                   │');
    console.log('└─────────────────────────────────────────┘');
    
    const guidance = await this.compilerIntegration.preprocess(input);
    
    console.log(`  编译深度: ${guidance.compilation.depth}`);
    console.log(`  处理路径: ${guidance.suggestedPath}`);
    console.log(`  Token预算: ${guidance.llmConfig.maxTokens}`);
    console.log(`  能量预测: ${guidance.energyPrediction.total}`);
    console.log(`  理解结果: ${guidance.compilation.understanding.essence.slice(0, 50)}...`);
    
    // ═══════════════════════════════════════════════════════════════
    // 第二阶段：根据指导执行处理
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ [阶段2] 核心处理（指导模式）             │');
    console.log('└─────────────────────────────────────────┘');
    
    let result: ProcessResult;
    
    switch (guidance.suggestedPath) {
      case 'fast':
        // 快速路径：跳过复杂处理
        result = await this.processFast(input, guidance);
        break;
        
      case 'standard':
        // 标准路径：正常处理
        result = await this.core.process(input);
        break;
        
      case 'deep':
        // 深度路径：增强处理
        result = await this.processDeep(input, guidance);
        break;
        
      case 'full':
        // 完整路径：完整处理
        result = await this.core.process(input);
        break;
        
      default:
        result = await this.core.process(input);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 第三阶段：后处理学习
    // ═══════════════════════════════════════════════════════════════
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ [阶段3] 后处理学习                       │');
    console.log('└─────────────────────────────────────────┘');
    
    await this.compilerIntegration.postprocess(input, result, guidance);
    
    // 汇总
    const totalTime = Date.now() - startTime;
    const stats = this.compilerIntegration.getStats();
    
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ [汇总] 处理完成                          │');
    console.log('└─────────────────────────────────────────┘');
    console.log(`  处理时间: ${totalTime}ms`);
    console.log(`  Token消耗: ${guidance.compilation.tokensUsed}`);
    console.log(`  累计节省: ${stats.avgTokensSaved} tokens/次`);
    
    return {
      ...result,
      compilation: guidance.compilation,
      guidance,
      totalTime,
    };
  }
  
  /**
   * 快速路径
   */
  private async processFast(
    input: string, 
    guidance: CompilationGuidance
  ): Promise<ProcessResult> {
    console.log('  [快速路径] 跳过复杂处理');
    
    // 使用编译结果直接生成响应
    // 注意：这里返回最小化结果，实际使用时应该通过core.process()获取完整结果
    const result = await this.core.process(input);
    
    // 如果编译已经产生响应，可以使用编译结果
    if (guidance.compilation.response) {
      return {
        ...result,
        response: guidance.compilation.response,
      };
    }
    
    return result;
  }
  
  /**
   * 深度路径
   */
  private async processDeep(
    input: string, 
    guidance: CompilationGuidance
  ): Promise<ProcessResult> {
    console.log('  [深度路径] 增强处理');
    
    // 调用原始process，但使用编译的理解结果增强上下文
    const result = await this.core.process(input);
    
    return result;
  }
  
  /**
   * 获取编译统计
   */
  getCompilerStats() {
    return this.compilerIntegration.getStats();
  }
  
  /**
   * 获取原始核心
   */
  getCore(): ConsciousnessCore {
    return this.core;
  }
}

/**
 * 增强版处理结果
 */
export interface EnhancedProcessResult extends ProcessResult {
  /** 编译结果 */
  compilation: CompilationGuidance['compilation'];
  /** 处理指导 */
  guidance: CompilationGuidance;
  /** 总处理时间 */
  totalTime: number;
}

/**
 * 创建增强版意识核心
 */
export function createEnhancedConsciousnessCore(
  core: ConsciousnessCore
): EnhancedConsciousnessCore {
  return new EnhancedConsciousnessCore(core);
}

// ═══════════════════════════════════════════════════════════════════════
// 集成到现有系统的方案
// ═══════════════════════════════════════════════════════════════════════

/**
 * 方案1: 直接修改ConsciousnessCore.process()
 * 
 * 在consciousness-core.ts中添加：
 * 
 * ```typescript
 * // 在类成员中添加
 * private compilerIntegration: CompilerIntegration;
 * 
 * // 在构造函数中初始化
 * this.compilerIntegration = createCompilerIntegration();
 * 
 * // 修改process方法
 * async process(input: string): Promise<ProcessResult> {
 *   // 新增：编译预处理
 *   const guidance = await this.compilerIntegration.preprocess(input);
 *   
 *   // 根据 guidance.suggestedPath 执行不同处理
 *   if (guidance.suggestedPath === 'fast') {
 *     return this.processFast(input, guidance);
 *   }
 *   
 *   // 原有处理流程...
 *   // ...
 *   
 *   // 新增：后处理
 *   await this.compilerIntegration.postprocess(input, result, guidance);
 *   
 *   return result;
 * }
 * ```
 */

/**
 * 方案2: 包装模式（推荐，最小侵入）
 * 
 * 使用EnhancedConsciousnessCore包装现有核心：
 * 
 * ```typescript
 * // 原有代码
 * const core = new ConsciousnessCore();
 * 
 * // 增强包装
 * const enhancedCore = createEnhancedConsciousnessCore(core);
 * enhancedCore.setLLMGateway(llmGateway);
 * 
 * // 使用增强版
 * const result = await enhancedCore.process(input);
 * ```
 */

/**
 * 方案3: 中间件模式
 * 
 * 创建处理管道：
 * 
 * ```typescript
 * const pipeline = createProcessingPipeline({
 *   pre: [compilerMiddleware],      // 编译预处理
 *   core: core.process.bind(core),  // 核心处理
 *   post: [learningMiddleware],     // 后处理学习
 * });
 * 
 * const result = await pipeline(input);
 * ```
 */
