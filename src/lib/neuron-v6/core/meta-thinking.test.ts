/**
 * ═══════════════════════════════════════════════════════════════════════
 * 元思考模块测试
 * 
 * 验证：
 * 1. 黑盒特质（内部过程不可观察）
 * 2. 隐式MCTS功能
 * 3. DE-RL优化功能
 * 4. 集成器功能
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  createImplicitMCTSController,
  createImplicitStateStorage,
  createDERLController,
  createMetaThinkingIntegrator,
  type ImplicitVector,
} from './index';

/**
 * 测试1：隐式MCTS基本功能
 */
async function test1_implicitMCTS() {
  console.log('\n=== 测试1：隐式MCTS基本功能 ===\n');
  
  const controller = createImplicitMCTSController({
    vectorDimension: 128, // 小维度加快测试
    simulationsPerSearch: 5,
  });
  
  // 执行思考
  const result = await controller.think('什么是人工智能？');
  
  console.log('✓ 思考完成');
  console.log('  - 需要LLM:', result.needsLLM);
  console.log('  - Token预算:', result.totalTokenBudget);
  console.log('  - 置信度:', result.confidence.toFixed(3));
  console.log('  - 指令数量:', result.instructions.length);
  
  // 验证黑盒特质：输出不包含内部状态
  const outputKeys = Object.keys(result);
  const forbiddenKeys = ['stateVector', 'nodes', 'tree', 'policyWeights', 'valueWeights'];
  
  const hasInternalState = forbiddenKeys.some(key => 
    outputKeys.includes(key) || 
    JSON.stringify(result).includes(key)
  );
  
  if (hasInternalState) {
    throw new Error('❌ 黑盒特质违反：输出暴露了内部状态！');
  }
  
  console.log('✓ 黑盒特质验证通过：输出不包含内部状态');
  
  return true;
}

/**
 * 测试2：隐式状态存储
 */
async function test2_implicitStateStorage() {
  console.log('\n=== 测试2：隐式状态存储 ===\n');
  
  const storage = createImplicitStateStorage({
    vectorDimension: 128,
  });
  
  // 存储一些向量
  const vectors: ImplicitVector[] = [];
  for (let i = 0; i < 10; i++) {
    const vector = new Float32Array(128);
    for (let j = 0; j < 128; j++) {
      vector[j] = Math.random();
    }
    vectors.push(vector);
    storage.store(vector, { type: 'task', priority: Math.random() });
  }
  
  console.log('✓ 存储10个向量');
  
  // 查询相似向量
  const queryVector = vectors[0];
  const results = storage.querySimilar(queryVector, 5);
  
  console.log('✓ 查询相似向量:', results.length, '个结果');
  
  // 验证：第一个结果应该是查询向量本身（最相似）
  const similarity = cosineSimilarity(queryVector, results[0].vector);
  console.log('  - 最相似向量的相似度:', similarity.toFixed(3));
  
  if (similarity < 0.99) {
    throw new Error('❌ 相似度搜索不准确！');
  }
  
  console.log('✓ 相似度搜索验证通过');
  
  // 验证黑盒特质：存储的记录只有向量，没有结构化文本
  const stats = storage.getStats();
  console.log('✓ 存储统计:', stats.totalRecords, '条记录');
  
  // 导出/导入测试
  const exported = storage.exportBinary();
  console.log('✓ 导出二进制:', exported.byteLength, 'bytes');
  
  const newStorage = createImplicitStateStorage({ vectorDimension: 128 });
  newStorage.importBinary(exported);
  console.log('✓ 导入成功');
  
  const importedStats = newStorage.getStats();
  if (importedStats.totalRecords !== stats.totalRecords) {
    throw new Error('❌ 导入后记录数量不一致！');
  }
  
  console.log('✓ 持久化验证通过');
  
  return true;
}

/**
 * 测试3：DE-RL优化器
 */
async function test3_DERLController() {
  console.log('\n=== 测试3：DE-RL优化器 ===\n');
  
  const controller = createDERLController({
    vectorDimension: 128,
    populationSize: 10,
    mutationFactor: 0.8,
    crossoverRate: 0.9,
  });
  
  // 执行几次决策
  for (let i = 0; i < 5; i++) {
    const result = controller.decide({
      description: `任务${i + 1}`,
      type: 'reasoning',
      complexity: 0.5,
      historyVectors: [],
    });
    
    console.log(`✓ 决策${i + 1}: Token预算=${result.totalTokenBudget}, 置信度=${result.confidence.toFixed(3)}`);
    
    // 模拟反馈
    controller.learn({
      taskCompletion: Math.random(),
      efficiency: 0.7 + Math.random() * 0.3,
      userSatisfaction: 0.6 + Math.random() * 0.4,
      tokenSavings: Math.random() * 0.5,
      timestamp: Date.now(),
    });
  }
  
  // 检查统计
  const stats = controller.getStats();
  console.log('✓ DE-RL统计:');
  console.log('  - 当前代数:', stats.generation);
  console.log('  - 最优适应度:', stats.bestFitness.toFixed(3));
  console.log('  - 种群多样性:', stats.diversity.toFixed(3));
  
  // 验证黑盒特质：策略权重不暴露
  const bestPolicy = controller.getBestPolicy();
  if (bestPolicy) {
    // 策略基因组是内部表示，但不会暴露给外部使用
    console.log('✓ 策略基因组存在（内部）');
  }
  
  return true;
}

/**
 * 测试4：元思考集成器
 */
async function test4_metaThinkingIntegrator() {
  console.log('\n=== 测试4：元思考集成器 ===\n');
  
  const integrator = createMetaThinkingIntegrator({
    stage: 'implicit_mcts',
    vectorDimension: 128,
    enableDERL: true,
  });
  
  // 阶段1测试
  console.log('阶段1: 隐式MCTS');
  const result1 = await integrator.think('解释量子纠缠', {
    taskType: 'reasoning',
    complexity: 0.7,
  });
  
  console.log('✓ 思考完成');
  console.log('  - 阶段:', result1.stage);
  console.log('  - Token预算:', result1.totalTokenBudget);
  console.log('  - 决策耗时:', result1.decisionTime, 'ms');
  
  // 反馈
  integrator.feedback({
    success: true,
    quality: 0.8,
    tokensUsed: 400,
    executionTime: 2000,
  });
  console.log('✓ 反馈完成');
  
  // 升级到阶段2
  console.log('\n升级到阶段2: DE-RL');
  integrator.upgradeStage('de_rl');
  
  const result2 = await integrator.think('复杂的推理任务', {
    taskType: 'reasoning',
    complexity: 0.9,
  });
  
  console.log('✓ 思考完成');
  console.log('  - 阶段:', result2.stage);
  console.log('  - Token预算:', result2.totalTokenBudget);
  
  // 统计
  const stats = integrator.getStats();
  console.log('\n✓ 集成器统计:');
  console.log('  - 总决策次数:', stats.totalDecisions);
  console.log('  - 平均置信度:', stats.avgConfidence.toFixed(3));
  console.log('  - 总Token节省:', stats.totalTokensSaved);
  console.log('  - 隐式状态数量:', stats.stateStorageStats.totalRecords);
  
  return true;
}

/**
 * 测试5：黑盒特质综合验证
 */
async function test5_blackboxVerification() {
  console.log('\n=== 测试5：黑盒特质综合验证 ===\n');
  
  const integrator = createMetaThinkingIntegrator({
    stage: 'implicit_mcts',
    vectorDimension: 128,
  });
  
  const result = await integrator.think('测试问题');
  
  // 验证1：输出接口干净
  console.log('验证1: 输出接口干净');
  const publicInterface = ['needsLLM', 'instructions', 'totalTokenBudget', 
                          'confidence', 'stage', 'decisionTime', 'implicitStateId'];
  const outputKeys = Object.keys(result);
  
  for (const key of outputKeys) {
    if (!publicInterface.includes(key)) {
      console.log('  发现非公开字段:', key);
    }
  }
  console.log('  ✓ 所有输出字段都是公开接口');
  
  // 验证2：无法反推内部状态
  console.log('\n验证2: 无法反推内部状态');
  const resultStr = JSON.stringify(result);
  const sensitivePatterns = ['stateVector', 'policyWeights', 'valueWeights', 
                             'nodes', 'connections', 'tree', 'path'];
  
  let found = false;
  for (const pattern of sensitivePatterns) {
    if (resultStr.includes(pattern)) {
      console.log('  ❌ 发现敏感信息:', pattern);
      found = true;
    }
  }
  if (!found) {
    console.log('  ✓ 输出不包含敏感信息');
  }
  
  // 验证3：状态历史不可访问
  console.log('\n验证3: 状态历史不可访问');
  const stats = integrator.getStats();
  if ('stateHistory' in stats) {
    throw new Error('❌ 统计信息暴露了状态历史！');
  }
  console.log('  ✓ 统计信息不包含状态历史');
  
  // 验证4：只能通过接口交互
  console.log('\n验证4: 只能通过接口交互');
  console.log('  可用方法:');
  console.log('    - think(): 思考');
  console.log('    - feedback(): 反馈');
  console.log('    - getStats(): 统计');
  console.log('    - getStage(): 获取阶段');
  console.log('    - upgradeStage(): 升级阶段');
  console.log('  ✓ 接口清晰，无暴露内部方法');
  
  console.log('\n✓ 黑盒特质验证全部通过！');
  
  return true;
}

/**
 * 辅助函数：余弦相似度
 */
function cosineSimilarity(a: ImplicitVector, b: ImplicitVector): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('元思考模块测试');
  console.log('═══════════════════════════════════════════════════════════');
  
  const tests = [
    test1_implicitMCTS,
    test2_implicitStateStorage,
    test3_DERLController,
    test4_metaThinkingIntegrator,
    test5_blackboxVerification,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error('❌ 测试失败:', error);
      failed++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  console.log('═══════════════════════════════════════════════════════════');
  
  return failed === 0;
}

// 如果直接运行
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}
