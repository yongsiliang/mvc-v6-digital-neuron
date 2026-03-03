/**
 * 黑盒层
 * 
 * 职责：
 * - 内部网络管理
 * - 理解过程（不可观察）
 * - 学习机制
 * - LLM协作（按需调用）
 * 
 * 特性：
 * - 内部过程隐性
 * - 只有输入和输出可见
 * - 涌现式理解
 * - 本地网络 + LLM协作
 * 
 * 注意：不提供观察内部的方法，因为意识观察不到自己的内部过程
 */

import type { 
  Understanding, 
  CompilationDepth,
  BlackBoxConfig 
} from '../types';
import { AttentionNetwork, createAttentionNetwork } from './network';
import { HebbianLearning, createHebbianLearning } from '../learning';
import { LLMCompiler, createLLMCompiler, depthToLLMLevel, TOKEN_BUDGET } from '../llm';
import type { LLMGateway } from '../../core/llm-gateway';

/**
 * 黑盒理解系统配置
 */
export interface BlackBoxUnderstandingConfig extends BlackBoxConfig {
  /** 是否启用学习 */
  enableLearning: boolean;
  /** 是否启用LLM */
  enableLLM: boolean;
}

const DEFAULT_CONFIG: BlackBoxUnderstandingConfig = {
  vectorDimension: 64,
  decayRate: 0.99,
  maxNodes: 10000,
  activationThreshold: 0.1,
  enableLearning: true,
  enableLLM: true,
};

/**
 * 黑盒理解系统
 * 
 * 核心特性：内部过程不可观察
 * 
 * 工作流程：
 * 1. 输入注入本地网络 → Attention传播 → 提取上下文
 * 2. 根据编译深度决定是否调用LLM
 * 3. LLM调用时使用本地上下文增强理解
 * 4. 学习机制更新网络
 */
export class BlackBoxUnderstanding {
  private network: AttentionNetwork;
  private learning: HebbianLearning;
  private llmCompiler: LLMCompiler;
  private config: BlackBoxUnderstandingConfig;
  
  constructor(config?: Partial<BlackBoxUnderstandingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.network = createAttentionNetwork(config);
    this.learning = createHebbianLearning();
    this.llmCompiler = createLLMCompiler();
  }
  
  /**
   * 设置LLM Gateway
   * 
   * 必须在使用前调用，传入初始化后的LLMGateway
   */
  setLLMGateway(gateway: LLMGateway): void {
    this.llmCompiler.setGateway(gateway);
    console.log('[黑盒] LLM Gateway 已设置');
  }
  
  /**
   * 理解过程
   * 
   * 核心流程：
   * 1. 输入注入网络
   * 2. 网络演化（黑盒）→ 提取上下文
   * 3. 根据深度调用LLM（可选）
   * 4. 读取理解结果
   * 
   * 注意：中间过程不可观察
   */
  async understand(
    input: string, 
    depth: CompilationDepth
  ): Promise<Understanding> {
    console.log(`[黑盒] 开始理解，深度 ${depth.total}`);
    
    // 1. 注入输入到本地网络
    this.network.inject(input);
    
    // 2. 网络演化（本地Attention传播）
    await this.network.evolve(depth);
    
    // 3. 读取本地网络状态
    const localUnderstanding = this.network.read();
    
    // 4. 决定LLM调用级别
    const llmLevel = depthToLLMLevel(depth.total);
    const tokenBudget = TOKEN_BUDGET[llmLevel];
    
    console.log(`[黑盒] LLM级别: ${llmLevel}, Token预算: ${tokenBudget}`);
    
    // 5. 如果需要LLM协作
    let finalUnderstanding = localUnderstanding;
    
    if (this.config.enableLLM && llmLevel !== 'none') {
      // 从本地网络提取上下文
      const context = localUnderstanding.derivation;
      
      // 调用LLM进行深度理解
      const llmResult = await this.llmCompiler.compileUnderstanding(
        input,
        context,
        llmLevel
      );
      
      // 融合本地和LLM理解
      finalUnderstanding = {
        essence: llmResult.understanding,
        confidence: Math.max(localUnderstanding.confidence, llmResult.confidence),
        derivation: context,
        timestamp: Date.now(),
      };
      
      console.log(`[黑盒] LLM协作完成，Token消耗: ${llmResult.tokensUsed}`);
    } else {
      console.log(`[黑盒] 使用本地理解（无LLM调用）`);
    }
    
    // 6. 学习（如果启用）
    if (this.config.enableLearning) {
      this.network.learn(input, finalUnderstanding);
    }
    
    console.log(`[黑盒] 理解完成：${finalUnderstanding.essence}`);
    
    return finalUnderstanding;
  }
  
  /**
   * 获取网络状态信息
   * 
   * 注意：只返回统计信息，不暴露内部细节
   */
  getNetworkStats(): {
    nodeCount: number;
    connectionCount: number;
    activeNodeCount: number;
  } {
    return {
      nodeCount: this.network.getNodeCount(),
      connectionCount: this.network.getConnectionCount(),
      activeNodeCount: this.network.getActiveNodeCount(),
    };
  }
  
  /**
   * 清空网络
   */
  clear(): void {
    this.network.clear();
    console.log('[黑盒] 网络已清空');
  }
  
  // 不提供以下方法：
  // - inspect() - 不能观察内部
  // - debug() - 不能调试内部
  // - getNodes() - 不能获取节点
  // - getConnections() - 不能获取连接
  // 
  // 因为黑盒内部不可观察
}

/**
 * 创建黑盒理解系统
 */
export function createBlackBoxUnderstanding(
  config?: Partial<BlackBoxUnderstandingConfig>
): BlackBoxUnderstanding {
  return new BlackBoxUnderstanding(config);
}
