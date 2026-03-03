/**
 * ═══════════════════════════════════════════════════════════════════════
 * 隐式MCTS + DE-RL 示例
 * 
 * 展示如何使用元思考集成器
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  createMetaThinkingIntegrator,
  createJarvisMetaThinkingIntegrator,
  type MetaThinkingOutput,
  type MetaThinkingFeedback,
} from './meta-thinking-integrator';

/**
 * 示例1：基础使用 - 阶段1（隐式MCTS）
 */
export async function example1_basicUsage() {
  console.log('=== 示例1：基础使用 ===\n');
  
  // 创建元思考集成器（阶段1：隐式MCTS）
  const metaThinker = createMetaThinkingIntegrator({
    stage: 'implicit_mcts',
    vectorDimension: 256,
  });
  
  // 用户输入
  const userInput = '请帮我分析一下人工智能对社会的影响';
  
  console.log('用户输入:', userInput);
  console.log('当前阶段:', metaThinker.getStage());
  console.log();
  
  // 执行元思考
  const result = await metaThinker.think(userInput, {
    taskType: 'analysis',
    complexity: 0.7,
  });
  
  console.log('元思考结果:');
  console.log('- 需要LLM:', result.needsLLM);
  console.log('- Token预算:', result.totalTokenBudget);
  console.log('- 置信度:', result.confidence.toFixed(3));
  console.log('- 决策耗时:', result.decisionTime, 'ms');
  console.log('- 指令数量:', result.instructions.length);
  
  if (result.instructions.length > 0) {
    console.log('\nLLM指令:');
    result.instructions.forEach((inst, i) => {
      console.log(`  ${i + 1}. ${inst.type}: ${inst.prompt.slice(0, 30)}...`);
      console.log(`     Token预算: ${inst.tokenBudget}, 优先级: ${inst.priority}`);
    });
  }
  
  console.log('\n统计信息:');
  const stats = metaThinker.getStats();
  console.log('- 总决策次数:', stats.totalDecisions);
  console.log('- 平均置信度:', stats.avgConfidence.toFixed(3));
  console.log('- 平均决策时间:', stats.avgDecisionTime.toFixed(1), 'ms');
  
  return result;
}

/**
 * 示例2：反馈学习 - 黑盒优化
 */
export async function example2_feedbackLearning() {
  console.log('\n=== 示例2：反馈学习 ===\n');
  
  const metaThinker = createMetaThinkingIntegrator({
    stage: 'implicit_mcts',
    enableDERL: true,
  });
  
  // 第一次思考
  const result1 = await metaThinker.think('什么是量子计算？');
  console.log('第一次思考置信度:', result1.confidence.toFixed(3));
  
  // 模拟反馈：执行成功，质量高
  const feedback1: MetaThinkingFeedback = {
    success: true,
    quality: 0.85,
    tokensUsed: 450,
    executionTime: 2000,
    userSatisfaction: 0.9,
  };
  
  metaThinker.feedback(feedback1);
  console.log('反馈：成功，质量0.85');
  
  // 第二次思考（应该有更高的置信度）
  const result2 = await metaThinker.think('量子计算如何应用在密码学？');
  console.log('第二次思考置信度:', result2.confidence.toFixed(3));
  
  // 模拟反馈：执行失败，质量低
  const feedback2: MetaThinkingFeedback = {
    success: false,
    quality: 0.3,
    tokensUsed: 800,
    executionTime: 5000,
    userSatisfaction: 0.2,
  };
  
  metaThinker.feedback(feedback2);
  console.log('反馈：失败，质量0.3');
  
  // 第三次思考
  const result3 = await metaThinker.think('量子计算机的发展历史是什么？');
  console.log('第三次思考置信度:', result3.confidence.toFixed(3));
  
  console.log('\n最终统计:');
  const stats = metaThinker.getStats();
  console.log('- 总Token节省:', stats.totalTokensSaved);
  console.log('- 隐式状态数量:', stats.stateStorageStats.totalRecords);
}

/**
 * 示例3：阶段升级 - 从MCTS到DE-RL
 */
export async function example3_stageUpgrade() {
  console.log('\n=== 示例3：阶段升级 ===\n');
  
  // 从阶段1开始
  const metaThinker = createMetaThinkingIntegrator({
    stage: 'implicit_mcts',
    enableDERL: true,
  });
  
  console.log('初始阶段:', metaThinker.getStage());
  
  // 执行一些任务，积累经验
  for (let i = 0; i < 5; i++) {
    const result = await metaThinker.think(`任务${i + 1}: 请解释概念`);
    metaThinker.feedback({
      success: true,
      quality: 0.7 + Math.random() * 0.2,
      tokensUsed: 300 + Math.floor(Math.random() * 200),
      executionTime: 1500 + Math.floor(Math.random() * 1000),
    });
  }
  
  // 升级到阶段2
  console.log('升级到阶段2: de_rl');
  metaThinker.upgradeStage('de_rl');
  console.log('当前阶段:', metaThinker.getStage());
  
  // 使用DE-RL进行决策
  const result = await metaThinker.think('复杂的推理任务');
  console.log('DE-RL决策置信度:', result.confidence.toFixed(3));
  
  // 查看DE-RL统计
  const stats = metaThinker.getStats();
  if (stats.derlStats) {
    console.log('DE-RL统计:');
    console.log('- 当前代数:', stats.derlStats.generation);
    console.log('- 最优适应度:', stats.derlStats.bestFitness.toFixed(3));
    console.log('- 种群多样性:', stats.derlStats.diversity.toFixed(3));
    console.log('- 平均奖励:', stats.derlStats.avgReward.toFixed(3));
  }
}

/**
 * 示例4：贾维斯级元思考
 */
export async function example4_jarvisLevel() {
  console.log('\n=== 示例4：贾维斯级元思考 ===\n');
  
  // 直接创建贾维斯级集成器
  const metaThinker = createJarvisMetaThinkingIntegrator();
  
  console.log('阶段:', metaThinker.getStage());
  
  // 复杂任务：工具调用 + 多步推理
  const complexTasks = [
    { input: '帮我搜索最新的AI新闻并总结', type: 'tool_call' as const },
    { input: '分析这段代码的性能问题', type: 'analysis' as const },
    { input: '设计一个用户认证系统', type: 'planning' as const },
    { input: '创作一首关于春天的诗', type: 'creative' as const },
    { input: '如果地球没有月球会怎样？', type: 'reasoning' as const },
  ];
  
  for (const task of complexTasks) {
    const result = await metaThinker.think(task.input, {
      taskType: task.type,
      complexity: 0.6,
    });
    
    console.log(`\n任务: ${task.input.slice(0, 20)}...`);
    console.log(`类型: ${task.type}`);
    console.log(`决策耗时: ${result.decisionTime}ms`);
    console.log(`Token预算: ${result.totalTokenBudget}`);
    console.log(`指令类型: ${result.instructions.map(i => i.type).join(', ')}`);
    
    // 模拟反馈
    metaThinker.feedback({
      success: true,
      quality: 0.7 + Math.random() * 0.25,
      tokensUsed: result.totalTokenBudget * (0.6 + Math.random() * 0.3),
      executionTime: result.decisionTime * 2,
    });
  }
  
  // 最终统计
  console.log('\n最终统计:');
  const stats = metaThinker.getStats();
  console.log('- 总决策次数:', stats.totalDecisions);
  console.log('- 平均置信度:', stats.avgConfidence.toFixed(3));
  console.log('- 总Token节省:', stats.totalTokensSaved);
}

/**
 * 示例5：黑盒特性演示
 */
export async function example5_blackboxDemo() {
  console.log('\n=== 示例5：黑盒特性演示 ===\n');
  
  const metaThinker = createMetaThinkingIntegrator();
  
  // 执行思考
  const result = await metaThinker.think('为什么天空是蓝色的？');
  
  console.log('黑盒输出（可见）:');
  console.log('- Token预算:', result.totalTokenBudget);
  console.log('- 置信度:', result.confidence.toFixed(3));
  console.log('- 指令:', result.instructions.length > 0 ? '有' : '无');
  
  console.log('\n黑盒内部（不可见）:');
  console.log('- ✗ 推理路径: 不暴露');
  console.log('- ✗ 状态向量: 不暴露');
  console.log('- ✗ 策略权重: 不暴露');
  console.log('- ✗ 价值网络: 不暴露');
  
  console.log('\n只能通过接口交互:');
  console.log('- ✓ think(): 输入问题 → 输出指令');
  console.log('- ✓ feedback(): 输入结果 → 内部优化');
  console.log('- ✓ getStats(): 获取统计（不含内部状态）');
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  await example1_basicUsage();
  await example2_feedbackLearning();
  await example3_stageUpgrade();
  await example4_jarvisLevel();
  await example5_blackboxDemo();
  
  console.log('\n=== 所有示例完成 ===');
}

// 如果直接运行此文件
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error);
}
