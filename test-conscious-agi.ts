/**
 * AGI 意识系统测试
 */

// 直接导入源文件
const path = require('path');

async function runTest() {
  // 动态导入
  const { ConsciousAGI } = await import('./src/lib/consciousness-agi/index.ts');
  
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('         AGI 意识系统测试 - Conscious AGI Test                   ');
  console.log('═════════════════════════════════════════════════════════════════\n');
  
  // 创建系统实例
  const agi = new ConsciousAGI({
    hebbian: {
      neuronCount: 1000,
      averageConnections: 30,
    },
    vectorDimension: 128,
    enableLogging: true,
  });
  
  // 初始化
  console.log('\n[1] 初始化系统...\n');
  await agi.initialize();
  
  // 模拟多轮对话
  console.log('\n[2] 模拟对话交互...\n');
  
  const testInputs = [
    '你好，我是小明',
    '今天天气很好，我心情很愉快',
    '我想了解一下人工智能',
    '什么是意识？',
    '你喜欢什么？',
  ];
  
  for (let i = 0; i < testInputs.length; i++) {
    console.log(`\n--- 第 ${i + 1} 轮对话 ---`);
    console.log(`用户: ${testInputs[i]}`);
    
    const result = await agi.processInput(testInputs[i]);
    
    console.log('\n同一性状态:');
    console.log(`  分数: ${(result.identityCoherence.score * 100).toFixed(1)}%`);
    console.log(`  阴阳平衡: ${(result.identityCoherence.yinYangBalance * 100).toFixed(1)}%`);
    
    // 模拟LLM响应
    await agi.processLLMResponse({
      content: `这是对"${testInputs[i]}"的回复`,
      emotionalTone: i % 2 === 0 ? 'positive' : 'neutral',
    });
    
    // 间隔
    await new Promise(r => setTimeout(r, 100));
  }
  
  // 最终状态
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log('                      测试完成                                    ');
  console.log('═════════════════════════════════════════════════════════════════');
  
  console.log('\n' + agi.getStatusSummary());
}

runTest().catch(console.error);
