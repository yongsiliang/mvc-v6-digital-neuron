/**
 * 边界网络 vs 节点网络 对比实验脚本
 * 在沙盒中自动运行并输出结果
 */

import {
  createHexagonGrid,
  evolveBoundaryNetwork,
  injectIntoBoundary,
  getBoundaryNetworkStats,
  detectPatterns,
  type BoundaryNetworkRules
} from '../src/lib/experiments/boundary-network';

import {
  createNodeNetwork,
  evolveNodeNetwork,
  injectIntoNodeNetwork,
  getNodeNetworkStats,
  detectNodePatterns,
  type NodeNetworkRules
} from '../src/lib/experiments/node-network';

// 实验配置
const config = {
  rings: 5,
  steps: 300,
  injectionSteps: [0, 100, 200],
  injectionPositions: [
    { q: 0, r: 0 },
    { q: 2, r: -1 },
    { q: -2, r: 1 }
  ],
  boundaryRules: {
    propagationRate: 0.3,
    threshold: 0.08,
    decayRate: 0.015,
    selfExcitation: 0.15,
    neighborExcitation: 0.2,
    oscillationFreq: 0.08,
    globalInhibition: 0.25
  } as BoundaryNetworkRules,
  nodeRules: {
    learningRate: 0.1,
    decayRate: 0.02,
    threshold: 0.1,
    activationFunction: 'sigmoid'
  } as NodeNetworkRules
};

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  边界网络 vs 节点网络 对比实验');
console.log('  核心假设: 信息存储在边界上，而非节点中');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📊 实验配置:');
console.log(`   网格大小: ${config.rings} 环`);
console.log(`   演化步数: ${config.steps}`);
console.log(`   注入时机: 第 ${config.injectionSteps.join(', ')} 步`);
console.log(`   注入位置: ${config.injectionPositions.length} 个点\n`);

// 初始化网络
let boundaryGrid = createHexagonGrid(config.rings);
let nodeNetwork = createNodeNetwork(config.rings);

console.log(`🔷 边界网络: ${boundaryGrid.nodes.size} 节点, ${boundaryGrid.edges.size} 条边`);
console.log(`🔶 节点网络: ${nodeNetwork.nodes.size} 节点, ${nodeNetwork.edges.size} 条边\n`);

// 结果收集
interface StepResult {
  step: number;
  boundary: {
    avgIntensity: number;
    coherence: number;
    activeRatio: number;
    hasPattern: boolean;
    patternStrength: number;
  };
  node: {
    avgActivation: number;
    coherence: number;
    activeRatio: number;
    hasPattern: boolean;
  };
}

const results: StepResult[] = [];
const snapshots: StepResult[] = [];

console.log('🚀 开始演化...\n');

// 运行实验
for (let step = 0; step < config.steps; step++) {
  // 注入信息
  if (config.injectionSteps.includes(step)) {
    boundaryGrid = injectIntoBoundary(boundaryGrid, config.injectionPositions, 0.9);
    nodeNetwork = injectIntoNodeNetwork(nodeNetwork, config.injectionPositions, 0.9);
    console.log(`   ⚡ 第 ${step} 步: 注入信息`);
  }
  
  // 演化
  boundaryGrid = evolveBoundaryNetwork(boundaryGrid, config.boundaryRules);
  nodeNetwork = evolveNodeNetwork(nodeNetwork, config.nodeRules);
  
  // 收集统计
  const boundaryStats = getBoundaryNetworkStats(boundaryGrid);
  const boundaryPatterns = detectPatterns(boundaryGrid);
  const nodeStats = getNodeNetworkStats(nodeNetwork);
  const nodePatterns = detectNodePatterns(nodeNetwork);
  
  const result: StepResult = {
    step,
    boundary: {
      avgIntensity: boundaryStats.avgIntensity,
      coherence: boundaryStats.coherence,
      activeRatio: boundaryStats.activeRatio,
      hasPattern: boundaryPatterns.hasHexagonalPattern,
      patternStrength: boundaryPatterns.patternStrength
    },
    node: {
      avgActivation: nodeStats.avgActivation,
      coherence: nodeStats.coherence,
      activeRatio: nodeStats.activeRatio,
      hasPattern: nodePatterns.hasPattern
    }
  };
  
  results.push(result);
  
  // 每50步记录快照
  if (step % 50 === 49) {
    snapshots.push(result);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  实验结果');
console.log('═══════════════════════════════════════════════════════════════\n');

// 分析结果
function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stability(arr: number[]): number {
  if (arr.length < 2) return 1;
  let variance = 0;
  const mean = average(arr);
  for (const v of arr) {
    variance += (v - mean) ** 2;
  }
  return 1 / (1 + Math.sqrt(variance / arr.length)); // 越接近1越稳定
}

const boundaryIntensities = results.map(r => r.boundary.avgIntensity);
const boundaryCoherences = results.map(r => r.boundary.coherence);
const nodeActivations = results.map(r => r.node.avgActivation);
const nodeCoherences = results.map(r => r.node.coherence);

const boundaryPatternSteps = results.filter(r => r.boundary.hasPattern).map(r => r.step);
const nodePatternSteps = results.filter(r => r.node.hasPattern).map(r => r.step);

// 边界网络统计
console.log('🔷 边界网络 (信息在边界上):');
console.log(`   平均强度: ${(average(boundaryIntensities) * 100).toFixed(2)}%`);
console.log(`   最大强度: ${(Math.max(...boundaryIntensities) * 100).toFixed(2)}%`);
console.log(`   平均相干性: ${(average(boundaryCoherences) * 100).toFixed(2)}%`);
console.log(`   稳定性指数: ${(stability(boundaryIntensities.slice(-50)) * 100).toFixed(2)}%`);
console.log(`   模式涌现: ${boundaryPatternSteps.length} 次 (步数: ${boundaryPatternSteps.slice(0, 5).join(', ')}${boundaryPatternSteps.length > 5 ? '...' : ''})`);

// 节点网络统计
console.log('\n🔶 节点网络 (传统方式):');
console.log(`   平均激活: ${(average(nodeActivations) * 100).toFixed(2)}%`);
console.log(`   最大激活: ${(Math.max(...nodeActivations) * 100).toFixed(2)}%`);
console.log(`   平均相干性: ${(average(nodeCoherences) * 100).toFixed(2)}%`);
console.log(`   稳定性指数: ${(stability(nodeActivations.slice(-50)) * 100).toFixed(2)}%`);
console.log(`   模式涌现: ${nodePatternSteps.length} 次`);

// 对比分析
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  对比分析');
console.log('═══════════════════════════════════════════════════════════════\n');

const coherenceAdv = average(boundaryCoherences) - average(nodeCoherences);
const stabilityAdv = stability(boundaryIntensities.slice(-50)) - stability(nodeActivations.slice(-50));
const patternAdv = boundaryPatternSteps.length - nodePatternSteps.length;

console.log(`📈 相干性优势: ${coherenceAdv > 0 ? '边界网络 +' : '节点网络 '}${(Math.abs(coherenceAdv) * 100).toFixed(2)}%`);
console.log(`📈 稳定性优势: ${stabilityAdv > 0 ? '边界网络 +' : '节点网络 '}${(Math.abs(stabilityAdv) * 100).toFixed(2)}%`);
console.log(`📈 模式涌现优势: ${patternAdv > 0 ? '边界网络 +' : patternAdv < 0 ? '节点网络 ' : '无差异 '}${Math.abs(patternAdv)} 次\n`);

// 关键发现
console.log('═══════════════════════════════════════════════════════════════');
console.log('  关键发现');
console.log('═══════════════════════════════════════════════════════════════\n');

if (coherenceAdv > 0.1) {
  console.log('✅ 边界网络表现出更高的相干性，支持"边界承载信息"假设');
} else if (coherenceAdv < -0.1) {
  console.log('❌ 节点网络表现出更高的相干性，与假设相反');
} else {
  console.log('⚠️ 两者相干性接近，需要更多实验');
}

if (patternAdv > 10) {
  console.log('✅ 边界网络涌现模式更频繁，显示更强的自组织能力');
}

if (stabilityAdv > 0.1) {
  console.log('✅ 边界网络更稳定，信息保持能力更强');
}

// 演化过程快照
console.log('\n📊 演化过程快照:\n');
console.log('  步数   | 边界网络(强度/相干) | 节点网络(激活/相干) | 模式(边/节)');
console.log('  -------|---------------------|---------------------|------------');
for (const s of snapshots) {
  console.log(`  ${String(s.step + 1).padStart(5)} | ${(s.boundary.avgIntensity * 100).toFixed(1)}% / ${(s.boundary.coherence * 100).toFixed(1)}%     | ${(s.node.avgActivation * 100).toFixed(1)}% / ${(s.node.coherence * 100).toFixed(1)}%     | ${s.boundary.hasPattern ? '✓' : '✗'} / ${s.node.hasPattern ? '✓' : '✗'}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  实验完成');
console.log('═══════════════════════════════════════════════════════════════\n');
