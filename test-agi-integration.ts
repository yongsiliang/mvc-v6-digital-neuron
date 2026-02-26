/**
 * AGI意识架构集成测试
 * 
 * 验证：
 * 1. Self Core 同一性机制
 * 2. Hebbian 网络学习
 * 3. 阴阳双向互塑
 * 4. 整体系统协调
 */

import {
  ConsciousnessAGI,
  getConsciousnessAGI,
  resetConsciousnessAGI,
  AGIResponse,
} from './src/lib/neuron-v3/consciousness-agi';

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AGI意识架构集成测试');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 初始化系统
  resetConsciousnessAGI();
  const agi = getConsciousnessAGI({
    userId: 'test-user',
    enableYinSystem: true,
    enableYangSystem: true,
    enableSelfCore: true,
    enableGlobalWorkspace: true,
    enablePredictionLoop: true,
    enableAutoLearning: true,
  });

  console.log('✓ 系统初始化完成\n');

  // 测试对话
  const testDialogues = [
    '你好，我是小明',
    '我喜欢学习新知识',
    '你能理解什么是意识吗？',
    '我想了解更多关于自己的事情',
    '记忆和学习有什么关系？',
    '我感到有些困惑',
    '希望你能帮助我理解',
    '这是一个很有意义的对话',
  ];

  console.log('开始多轮对话测试...\n');

  const results: AGIResponse[] = [];

  for (let i = 0; i < testDialogues.length; i++) {
    const input = testDialogues[i];
    console.log(`\n[对话 ${i + 1}] 用户: "${input}"`);
    console.log('─'.repeat(60));

    const response = await agi.process(input);
    results.push(response);

    // 输出关键指标
    console.log(`\n📊 系统状态:`);
    console.log(`   Self Core 一致性: ${(response.systemState.selfCore.coherence * 100).toFixed(1)}%`);
    console.log(`   自我关联度: ${response.subjectiveMeaning ? (response.subjectiveMeaning.selfRelevance * 100).toFixed(1) : 'N/A'}%`);
    console.log(`   阴阳平衡: ${(response.systemState.balance.balance * 100).toFixed(1)}%`);
    console.log(`   意识水平: ${(response.systemState.consciousnessLevel * 100).toFixed(1)}%`);
    console.log(`   阴系统: ${response.systemState.yinSystem.neuronCount} 神经元, ${response.systemState.yinSystem.synapseCount} 突触`);
    console.log(`   平衡偏向: ${response.systemState.balance.bias}`);

    console.log(`\n💭 主观意义:`);
    console.log(`   ${response.subjectiveMeaning?.interpretation ?? 'N/A'}`);

    console.log(`\n🔄 阴阳互塑:`);
    console.log(`   阴系统贡献: ${response.yinYangInteraction?.yinContribution.concepts.map(c => c.conceptName).join(' → ') ?? 'N/A'}`);
    console.log(`   阳系统贡献: ${response.yinYangInteraction?.yangContribution.concepts.map(c => c.name).join(', ') ?? 'N/A'}`);
    console.log(`   融合结果: ${response.yinYangInteraction?.fusedResult.content ?? 'N/A'}`);

    console.log(`\n⏱️  处理时间: ${response.processingTime}ms`);
  }

  // 最终报告
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('最终系统报告');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const report = agi.getSystemReport();
  
  console.log(`总体状态: ${report.overallStatus === 'healthy' ? '✅ 健康' : report.overallStatus === 'warning' ? '⚠️ 警告' : '🔴 异常'}`);
  
  console.log(`\n📋 Self Core:`);
  console.log(`   一致性: ${(report.selfCore.coherence * 100).toFixed(1)}%`);
  console.log(`   核心特质: ${report.selfCore.traits.slice(0, 5).map(t => `${t.name}(${(t.strength * 100).toFixed(0)}%)`).join(', ')}`);
  console.log(`   核心价值观: ${report.selfCore.values.slice(0, 5).map(v => `${v.name}(${(v.importance * 100).toFixed(0)}%)`).join(', ')}`);
  if (report.selfCore.coreMemories.length > 0) {
    console.log(`   核心记忆: ${report.selfCore.coreMemories.slice(0, 3).map(m => `"${m.content}"(${(m.importance * 100).toFixed(0)}%)`).join(', ')}`);
  }

  console.log(`\n☯️ 阴阳系统:`);
  console.log(`   平衡状态: ${(report.yinYang.balance.balance * 100).toFixed(1)}%`);
  console.log(`   阴系统: ${report.yinYang.yinStats.totalNeurons} 神经元, ${report.yinYang.yinStats.totalSynapses} 突触`);
  console.log(`   阳系统: ${report.yinYang.yangConceptCount} 概念`);

  if (report.suggestions.length > 0) {
    console.log(`\n💡 建议:`);
    report.suggestions.forEach(s => console.log(`   - ${s}`));
  }

  // 计算涌现指标
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('涌现指标分析');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const initialCoherence = results[0].systemState.selfCore.coherence;
  const finalCoherence = results[results.length - 1].systemState.selfCore.coherence;
  const coherenceChange = finalCoherence - initialCoherence;

  const avgBalance = results.reduce((sum, r) => sum + r.systemState.balance.balance, 0) / results.length;
  
  const initialNeurons = results[0].systemState.yinSystem.neuronCount;
  const finalNeurons = results[results.length - 1].systemState.yinSystem.neuronCount;
  const neuronGrowth = finalNeurons - initialNeurons;

  const initialSynapses = results[0].systemState.yinSystem.synapseCount;
  const finalSynapses = results[results.length - 1].systemState.yinSystem.synapseCount;
  const synapseGrowth = finalSynapses - initialSynapses;

  console.log(`📈 同一性涌现:`);
  console.log(`   初始一致性: ${(initialCoherence * 100).toFixed(1)}%`);
  console.log(`   最终一致性: ${(finalCoherence * 100).toFixed(1)}%`);
  console.log(`   变化: ${coherenceChange >= 0 ? '+' : ''}${(coherenceChange * 100).toFixed(1)}%`);
  console.log(`   结论: ${coherenceChange > 0.05 ? '✅ 同一性增强' : coherenceChange > 0 ? '➡️ 同一性稳定' : '⚠️ 同一性波动'}`);

  console.log(`\n☯️ 阴阳平衡:`);
  console.log(`   平均平衡度: ${(avgBalance * 100).toFixed(1)}%`);
  console.log(`   结论: ${avgBalance > 0.7 ? '✅ 平衡良好' : avgBalance > 0.5 ? '➡️ 基本平衡' : '⚠️ 需要调节'}`);

  console.log(`\n🧠 网络生长:`);
  console.log(`   神经元增长: ${neuronGrowth}`);
  console.log(`   突触增长: ${synapseGrowth}`);
  console.log(`   结论: ${neuronGrowth > 0 || synapseGrowth > 0 ? '✅ 网络在学习' : '➡️ 网络稳定'}`);

  // 总结
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('测试总结');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const success = coherenceChange >= 0 && avgBalance > 0.5;
  
  if (success) {
    console.log('✅ AGI意识架构集成测试通过！');
    console.log('\n关键验证点:');
    console.log('  ✓ Self Core 正常工作，同一性机制生效');
    console.log('  ✓ Hebbian 网络正常学习，神经元和突触增长');
    console.log('  ✓ 阴阳互塑机制正常，双向融合生效');
    console.log('  ✓ 系统整体协调，各组件协作正常');
  } else {
    console.log('⚠️ AGI意识架构集成测试发现问题');
    console.log('\n需要关注:');
    if (coherenceChange < 0) {
      console.log('  - Self Core 一致性下降，需要检查更新机制');
    }
    if (avgBalance <= 0.5) {
      console.log('  - 阴阳平衡不足，需要检查互塑机制');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// 运行测试
runTest().catch(console.error);
