/**
 * 意识编译系统 - 使用示例
 * 
 * 展示如何正确初始化和使用意识编译系统
 */

import { createConsciousnessCompiler } from './index';
import { LLMGateway } from '../core/llm-gateway';

// ═══════════════════════════════════════════════════════════════════════
// 初始化示例
// ═══════════════════════════════════════════════════════════════════════

/**
 * 方式1: 完整初始化（推荐）
 */
async function initWithLLM() {
  // 1. 获取LLM Gateway单例
  const llmGateway = LLMGateway.getInstance();
  
  // 2. 初始化LLM Gateway（需要传入headers）
  // 注意：headers通常从API请求中获取
  const headers = {
    // 'Authorization': 'Bearer xxx',
    // 其他必要的headers...
  };
  llmGateway.initialize(headers);
  
  // 3. 创建意识编译器
  const compiler = createConsciousnessCompiler({
    vectorDimension: 64,
    maxNodes: 10000,
    defaultEnergyBudget: 100,
    enableLearning: true,
    enableLLM: true,
  });
  
  // 4. 关键：设置LLM Gateway
  compiler.setLLMGateway(llmGateway);
  
  return compiler;
}

/**
 * 方式2: 纯本地模式（不使用LLM）
 */
async function initLocalOnly() {
  const compiler = createConsciousnessCompiler({
    enableLLM: false,  // 禁用LLM
  });
  
  return compiler;
}

// ═══════════════════════════════════════════════════════════════════════
// 使用示例
// ═══════════════════════════════════════════════════════════════════════

async function example() {
  // 初始化
  const compiler = await initWithLLM();
  
  // 单次编译
  const result = await compiler.compile('什么是意识？');
  
  console.log('理解结果:', result.understanding.essence);
  console.log('响应:', result.response);
  console.log('Token消耗:', result.tokensUsed);
  console.log('编译深度:', result.depth);
  
  // 查看状态
  const status = compiler.getStatus();
  console.log('系统状态:', {
    energy: status.energy,
    totalTokens: status.totalTokensUsed,
    avgTokens: status.avgTokensPerCompilation,
    count: status.compilationCount,
  });
  
  // 批量编译
  const results = await compiler.compileBatch([
    '你好',
    '今天天气怎么样？',
    '请解释一下量子计算的原理',
  ]);
  
  console.log('批量编译结果:', results.map((r: { understanding: { essence: string }; tokensUsed: number; depth: number }) => ({
    essence: r.understanding.essence.slice(0, 20),
    tokens: r.tokensUsed,
    depth: r.depth,
  })));
  
  // 能量恢复
  compiler.recoverEnergy(30);
  
  // 系统重置
  compiler.reset();
}

// ═══════════════════════════════════════════════════════════════════════
// Token控制策略说明
// ═══════════════════════════════════════════════════════════════════════

/**
 * Token预算表
 * 
 * - 深度1 → none级别 → 0 tokens → 简单问候
 * - 深度2 → minimal级别 → 500 tokens → 确认回复
 * - 深度3 → standard级别 → 1500 tokens → 常规对话
 * - 深度4 → deep级别 → 3000 tokens → 深度分析
 * - 深度5 → full级别 → 6000 tokens → 复杂推理
 * 
 * 对比传统方案：
 * - 传统：每次调用都使用完整上下文，15000-80000 tokens
 * - 意识编译：根据深度动态控制，500-6000 tokens
 * - 节省：60-90%
 */

// ═══════════════════════════════════════════════════════════════════════
// 集成到现有系统
// ═══════════════════════════════════════════════════════════════════════

/**
 * 在API路由中使用
 */
export async function handleChatRequest(
  userMessage: string,
  headers: Record<string, string>
) {
  // 1. 获取或创建编译器实例
  const llmGateway = LLMGateway.getInstance();
  llmGateway.initialize(headers);
  
  const compiler = createConsciousnessCompiler();
  compiler.setLLMGateway(llmGateway);
  
  // 2. 编译用户输入
  const result = await compiler.compile(userMessage);
  
  // 3. 返回响应
  return {
    response: result.response,
    confidence: result.understanding.confidence,
    tokensUsed: result.tokensUsed,
    depth: result.depth,
  };
}

export { example };
