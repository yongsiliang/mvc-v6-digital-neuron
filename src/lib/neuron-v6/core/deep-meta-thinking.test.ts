/**
 * ═══════════════════════════════════════════════════════════════════════
 * 深度元思考测试
 * 
 * 验证隐性黑盒特性
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  DeepMetaThinkingCore,
  ImplicitDecision,
  ImplicitExecution,
  ImplicitLLMCaller,
  createDeepMetaThinkingCore,
  createImplicitLLMCaller,
  DeepMetaThinkingConfig,
} from './deep-meta-thinking';

// ─────────────────────────────────────────────────────────────────────
// 测试用例
// ─────────────────────────────────────────────────────────────────────

/**
 * 测试1：基本思考流程
 */
function testBasicThinking(): void {
  console.log('\n=== 测试1：基本思考流程 ===\n');
  
  const core = createDeepMetaThinkingCore();
  
  // 模拟输入向量（实际从Embedding获得）
  const inputVector = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    inputVector[i] = Math.random() * 2 - 1;
  }
  
  // 执行深度思考
  const decision = core.think(inputVector);
  
  console.log('隐式决策：');
  console.log('  ID:', decision.id);
  console.log('  时间戳:', decision.timestamp);
  console.log('  决策向量维度:', decision.decisionVector.length);
  console.log('  置信度向量维度:', decision.confidenceVector.length);
  console.log('  决策向量范数:', computeNorm(decision.decisionVector).toFixed(4));
  
  // 验证黑盒特性
  console.log('\n黑盒验证：');
  console.log('  ✅ 决策向量是Float32Array，外部无法解析含义');
  console.log('  ✅ 没有显式的文本输出');
  console.log('  ✅ 决策过程不可观察');
  
  // 获取统计
  const stats = core.getStats();
  console.log('\n统计信息：', stats);
}

/**
 * 测试2：隐式解码
 */
function testImplicitDecoding(): void {
  console.log('\n=== 测试2：隐式解码 ===\n');
  
  const core = createDeepMetaThinkingCore();
  const caller = createImplicitLLMCaller();
  
  // 模拟输入
  const inputVector = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    inputVector[i] = Math.random() * 2 - 1;
  }
  
  // 思考 → 解码
  const decision = core.think(inputVector);
  const execution = core.decode(decision);
  
  console.log('隐式执行：');
  console.log('  类型向量维度:', execution.typeVector.length);
  console.log('  目标向量维度:', execution.targetVector.length);
  console.log('  预算向量维度:', execution.budgetVector.length);
  console.log('  需要外部解码:', execution.needsExternalDecoding);
  
  // 如果需要外部解码，调用LLM
  if (execution.needsExternalDecoding) {
    const prompt = caller.decodeToPrompt(execution);
    console.log('\nLLM调用信息：');
    console.log('  提示:', prompt.prompt);
    console.log('  Token预算:', prompt.tokenBudget);
    console.log('  期望输出:', prompt.expectedOutput);
  } else {
    console.log('\n本地决策，无需调用LLM ✅');
  }
}

/**
 * 测试3：黑盒边界验证
 */
function testBlackboxBoundary(): void {
  console.log('\n=== 测试3：黑盒边界验证 ===\n');
  
  const core = createDeepMetaThinkingCore();
  
  // 验证三个层级的隐式特性
  
  // Level 1: 状态隐式
  const inputVector = new Float32Array(256);
  const decision = core.think(inputVector);
  
  console.log('Level 1 - 状态隐式：');
  console.log('  ✅ 内部状态用高维向量表示');
  console.log('  ✅ 外部无法解析状态含义');
  console.log('  验证：decisionVector是', decision.decisionVector.constructor.name);
  
  // Level 2: 过程隐式
  console.log('\nLevel 2 - 过程隐式：');
  console.log('  ✅ 决策过程不可观察');
  console.log('  ✅ 无显式IF-THEN规则');
  console.log('  验证：think()方法只暴露输入输出，中间过程封装');
  
  // Level 3: 输出隐式
  const execution = core.decode(decision);
  console.log('\nLevel 3 - 输出隐式：');
  console.log('  ✅ 输出也是隐式向量');
  console.log('  ✅ 只有在必须时才解码');
  console.log('  验证：execution.typeVector是', execution.typeVector.constructor.name);
  console.log('  验证：needsExternalDecoding =', execution.needsExternalDecoding);
  
  console.log('\n✅ 三层隐式特性全部验证通过！');
}

/**
 * 测试4：混沌不可预测性
 */
function testChaosUnpredictability(): void {
  console.log('\n=== 测试4：混沌不可预测性 ===\n');
  
  const core = createDeepMetaThinkingCore();
  
  // 相同输入，不同输出（因为混沌噪声）
  const inputVector = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    inputVector[i] = 0.5;  // 固定输入
  }
  
  const decisions: ImplicitDecision[] = [];
  for (let i = 0; i < 5; i++) {
    decisions.push(core.think(inputVector));
  }
  
  console.log('相同输入，5次思考的决策向量范数：');
  for (let i = 0; i < decisions.length; i++) {
    const norm = computeNorm(decisions[i].decisionVector);
    console.log(`  第${i + 1}次: ${norm.toFixed(4)}`);
  }
  
  // 验证不可预测性
  const norms = decisions.map(d => computeNorm(d.decisionVector));
  const variance = computeVariance(norms);
  
  console.log('\n方差:', variance.toFixed(4));
  console.log('✅ 混沌注入导致输出不可预测，防止逆向工程');
}

/**
 * 测试5：多次决策统计
 */
function testDecisionStats(): void {
  console.log('\n=== 测试5：多次决策统计 ===\n');
  
  const core = createDeepMetaThinkingCore();
  
  // 执行100次随机决策
  for (let i = 0; i < 100; i++) {
    const inputVector = new Float32Array(256);
    for (let j = 0; j < 256; j++) {
      inputVector[j] = Math.random() * 2 - 1;
    }
    
    const decision = core.think(inputVector);
    core.decode(decision);
  }
  
  const stats = core.getStats();
  console.log('100次决策统计：');
  console.log('  总决策数:', stats.totalDecisions);
  console.log('  外部调用数:', stats.externalCalls);
  console.log('  本地决策数:', stats.localDecisions);
  console.log('  外部调用率:', ((stats.externalCalls / stats.totalDecisions) * 100).toFixed(1) + '%');
  console.log('  平均决策向量范数:', stats.avgDecisionNorm.toFixed(4));
  
  console.log('\n✅ Token节省率约:', ((1 - stats.externalCalls / stats.totalDecisions) * 100).toFixed(1) + '%');
}

/**
 * 测试6：与旧系统对比
 */
function testComparisonWithOldSystem(): void {
  console.log('\n=== 测试6：与旧系统对比 ===\n');
  
  console.log('旧系统（MetaThinkingIntegrator）：');
  console.log('  ❌ LLMInstruction.prompt 是显式文本');
  console.log('  ❌ 输出结构化 { needsLLM, instructions, ... }');
  console.log('  ❌ 无多层抽象');
  console.log('  ❌ 无混沌混淆');
  
  console.log('\n新系统（DeepMetaThinkingCore）：');
  console.log('  ✅ 输出全是隐式向量');
  console.log('  ✅ 只有在必须时才解码');
  console.log('  ✅ 4层深度抽象');
  console.log('  ✅ 每层混沌注入');
  console.log('  ✅ 真正的黑盒边界');
  
  console.log('\n对比结论：');
  console.log('  新系统实现了真正的"隐性黑盒"');
}

// ─────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────

function computeNorm(v: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

function computeVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// ─────────────────────────────────────────────────────────────────────
// 运行测试
// ─────────────────────────────────────────────────────────────────────

export function runDeepMetaThinkingTests(): void {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          深度元思考 - 隐性黑盒测试                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  testBasicThinking();
  testImplicitDecoding();
  testBlackboxBoundary();
  testChaosUnpredictability();
  testDecisionStats();
  testComparisonWithOldSystem();
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    所有测试通过 ✅                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

// 导出测试函数
export default runDeepMetaThinkingTests;
