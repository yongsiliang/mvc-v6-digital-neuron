/**
 * 意识编译系统 - 单元测试
 */

import { createConsciousnessCompiler } from '../consciousness-compiler';
import { createScheduler } from '../consciousness-compiler/scheduler';
import { createBlackBoxUnderstanding } from '../consciousness-compiler/blackbox';
import { createOutputLayer } from '../consciousness-compiler/output';
import { createNode } from '../consciousness-compiler/blackbox/node';
import { softmax, sigmoid, clamp } from '../consciousness-compiler/utils/math';
import { randomVector, magnitude, dot, normalize } from '../consciousness-compiler/utils/vector';

// 测试工具函数
function test(name: string, fn: () => boolean | Promise<boolean>): void {
  Promise.resolve(fn())
    .then(result => {
      if (result) {
        console.log(`✅ ${name}`);
      } else {
        console.log(`❌ ${name} - 断言失败`);
      }
    })
    .catch(error => {
      console.log(`❌ ${name} - 错误: ${error}`);
    });
}

// 测试套件
export function runTests(): void {
  console.log('\n=== 意识编译系统单元测试 ===\n');
  
  // ========== 工具函数测试 ==========
  console.log('--- 工具函数测试 ---');
  
  test('softmax 输出和为1', () => {
    const values = [1, 2, 3, 4, 5];
    const result = softmax(values);
    const sum = result.reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1) < 0.0001;
  });
  
  test('sigmoid 输出在 0-1 之间', () => {
    return sigmoid(0) === 0.5 && sigmoid(-10) > 0 && sigmoid(10) < 1;
  });
  
  test('clamp 限制值范围', () => {
    return clamp(5, 0, 3) === 3 && clamp(-1, 0, 3) === 0 && clamp(2, 0, 3) === 2;
  });
  
  test('randomVector 生成指定维度', () => {
    const v = randomVector(64);
    return v.length === 64;
  });
  
  test('magnitude 计算向量长度', () => {
    const v = [3, 4];
    return Math.abs(magnitude(v) - 5) < 0.0001;
  });
  
  test('normalize 归一化向量', () => {
    const v = [3, 4];
    const n = normalize(v);
    return Math.abs(magnitude(n) - 1) < 0.0001;
  });
  
  test('dot 计算点积', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    return dot(a, b) === 32; // 1*4 + 2*5 + 3*6
  });
  
  // ========== 节点测试 ==========
  console.log('\n--- Attention节点测试 ---');
  
  test('创建节点', () => {
    const node = createNode('test', { vectorDimension: 64 });
    return node.id === 'test' && node.activation === 0;
  });
  
  test('节点激活', () => {
    const node = createNode('test', { vectorDimension: 64 });
    node.activate(0.5);
    return node.activation === 0.5;
  });
  
  test('节点衰减', () => {
    const node = createNode('test', { vectorDimension: 64 });
    node.activate(1.0);
    node.decay(0.5);
    return Math.abs(node.activation - 0.5) < 0.0001;
  });
  
  test('节点相似度计算', () => {
    const node1 = createNode('test1', { vectorDimension: 64 });
    const node2 = createNode('test2', { vectorDimension: 64 });
    const sim = node1.similarity(node2);
    return sim >= -1 && sim <= 1;
  });
  
  // ========== 调度器测试 ==========
  console.log('\n--- 调度器测试 ---');
  
  test('创建调度器', () => {
    const scheduler = createScheduler();
    return scheduler !== undefined;
  });
  
  test('感知系统状态', () => {
    const scheduler = createScheduler();
    const state = scheduler.senseState();
    return state.energy > 0 && state.curiosity >= 0 && state.curiosity <= 1;
  });
  
  test('决定编译深度', () => {
    const scheduler = createScheduler();
    const state = scheduler.senseState();
    const depth = scheduler.decideDepth(state);
    return depth.total >= 1 && depth.total <= 5;
  });
  
  test('能量预算', () => {
    const scheduler = createScheduler();
    const state = scheduler.senseState();
    const depth = scheduler.decideDepth(state);
    const budget = scheduler.budgetEnergy(depth);
    return budget > 0;
  });
  
  // ========== 黑盒层测试 ==========
  console.log('\n--- 黑盒层测试 ---');
  
  test('创建黑盒理解系统', () => {
    const blackbox = createBlackBoxUnderstanding();
    return blackbox !== undefined;
  });
  
  test('黑盒网络统计', () => {
    const blackbox = createBlackBoxUnderstanding();
    const stats = blackbox.getNetworkStats();
    return typeof stats.nodeCount === 'number' && typeof stats.connectionCount === 'number';
  });
  
  // ========== 输出层测试 ==========
  console.log('\n--- 输出层测试 ---');
  
  test('创建输出层', () => {
    const output = createOutputLayer();
    return output !== undefined;
  });
  
  test('输出层处理', () => {
    const output = createOutputLayer();
    const understanding = {
      essence: '测试理解',
      confidence: 0.8,
      derivation: ['概念1', '概念2'],
      timestamp: Date.now(),
    };
    const result = output.process(understanding);
    return result.response.length > 0 && result.confidence === 0.8;
  });
  
  // ========== 主系统测试 ==========
  console.log('\n--- 意识编译系统测试 ---');
  
  test('创建意识编译器', () => {
    const compiler = createConsciousnessCompiler();
    return compiler !== undefined;
  });
  
  test('获取系统状态', () => {
    const compiler = createConsciousnessCompiler();
    const status = compiler.getStatus();
    return status.energy > 0 && status.compilationCount >= 0;
  });
  
  test('能量恢复', () => {
    const compiler = createConsciousnessCompiler();
    const initialEnergy = compiler.getStatus().energy;
    compiler.recoverEnergy(10);
    const newEnergy = compiler.getStatus().energy;
    return newEnergy >= initialEnergy;
  });
  
  test('系统重置', () => {
    const compiler = createConsciousnessCompiler();
    compiler.recoverEnergy(10);
    compiler.reset();
    const status = compiler.getStatus();
    return status.compilationCount === 0;
  });
  
  console.log('\n=== 测试完成 ===\n');
}

// 异步测试
export async function runAsyncTests(): Promise<void> {
  console.log('\n--- 异步功能测试 ---\n');
  
  test('黑盒理解过程', async () => {
    const blackbox = createBlackBoxUnderstanding();
    const depth = { total: 2, modules: ['perception'], energyCost: 40, moduleWeights: new Map() };
    const understanding = await blackbox.understand('测试输入', depth);
    return understanding.essence !== undefined && understanding.confidence >= 0;
  });
  
  test('编译输入', async () => {
    const compiler = createConsciousnessCompiler();
    const result = await compiler.compile('这是一个测试输入');
    return result.understanding !== undefined && result.response.length > 0;
  });
  
  test('批量编译', async () => {
    const compiler = createConsciousnessCompiler();
    const results = await compiler.compileBatch(['输入1', '输入2', '输入3']);
    return results.length === 3;
  });
}

// 如果直接运行此文件
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
  runAsyncTests().catch(console.error);
}
