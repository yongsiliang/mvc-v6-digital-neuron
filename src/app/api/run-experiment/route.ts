import { NextResponse } from 'next/server';
import {
  createHexagonGrid,
  evolveBoundaryNetwork,
  injectIntoBoundary,
  getBoundaryNetworkStats,
  detectPatterns,
  type BoundaryNetworkRules
} from '@/lib/experiments/boundary-network';
import {
  createNodeNetwork,
  evolveNodeNetwork,
  injectIntoNodeNetwork,
  getNodeNetworkStats,
  detectNodePatterns,
  type NodeNetworkRules
} from '@/lib/experiments/node-network';

// 关键指标计算
function entropy(values: number[]): number {
  if (values.length === 0) return 0;
  
  // 将值离散化为10个区间
  const buckets = new Array(10).fill(0);
  values.forEach(v => {
    const idx = Math.min(9, Math.floor(v * 10));
    buckets[idx]++;
  });
  
  // 计算信息熵
  const total = values.length;
  let e = 0;
  buckets.forEach(b => {
    if (b > 0) {
      const p = b / total;
      e -= p * Math.log2(p);
    }
  });
  
  return e;
}

function diversity(values: number[]): number {
  // 计算标准差，衡量动态多样性
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function temporalVariation(timeSeries: number[]): number {
  // 计算时间序列的变化率
  if (timeSeries.length < 2) return 0;
  let totalChange = 0;
  for (let i = 1; i < timeSeries.length; i++) {
    totalChange += Math.abs(timeSeries[i] - timeSeries[i - 1]);
  }
  return totalChange / (timeSeries.length - 1);
}

export async function GET() {
  const config = {
    rings: 5,
    steps: 400,
    injectionSteps: [0, 100, 200, 300],
    injectionPositions: [
      { q: 0, r: 0 },
      { q: 2, r: -1 },
      { q: -2, r: 1 }
    ]
  };

  // 使用优化后的参数
  const boundaryRules: BoundaryNetworkRules = {
    propagationRate: 0.4,
    threshold: 0.05,
    decayRate: 0.01,
    selfExcitation: 0.2,
    neighborExcitation: 0.3,
    oscillationFreq: 0.05,
    globalInhibition: 0.2
  };

  const nodeRules: NodeNetworkRules = {
    learningRate: 0.05,
    decayRate: 0.03,
    threshold: 0.1,
    activationFunction: 'sigmoid'
  };

  // 初始化网络
  let boundaryGrid = createHexagonGrid(config.rings);
  let nodeNetwork = createNodeNetwork(config.rings);

  // 收集详细数据
  const boundaryTimeSeries: number[] = [];
  const nodeTimeSeries: number[] = [];
  const boundaryEntropySeries: number[] = [];
  const nodeEntropySeries: number[] = [];
  const boundaryDiversitySeries: number[] = [];
  const nodeDiversitySeries: number[] = [];

  const snapshots: Array<{
    step: number;
    boundary: { 
      avgIntensity: number; 
      coherence: number;
      entropy: number;
      diversity: number;
      activeRatio: number;
      patternStrength: number;
    };
    node: { 
      avgActivation: number;
      coherence: number;
      entropy: number;
      diversity: number;
      activeRatio: number;
    };
  }> = [];

  console.log('开始演化实验...');

  for (let step = 0; step < config.steps; step++) {
    // 注入信息
    if (config.injectionSteps.includes(step)) {
      boundaryGrid = injectIntoBoundary(boundaryGrid, config.injectionPositions, 0.9);
      nodeNetwork = injectIntoNodeNetwork(nodeNetwork, config.injectionPositions, 0.9);
    }
    
    // 演化
    boundaryGrid = evolveBoundaryNetwork(boundaryGrid, boundaryRules);
    nodeNetwork = evolveNodeNetwork(nodeNetwork, nodeRules);
    
    // 收集边界网络数据
    const boundaryStats = getBoundaryNetworkStats(boundaryGrid);
    const boundaryPatterns = detectPatterns(boundaryGrid);
    const boundaryIntensities = Array.from(boundaryGrid.edges.values()).map(e => e.intensity);
    
    // 收集节点网络数据
    const nodeStats = getNodeNetworkStats(nodeNetwork);
    const nodePatterns = detectNodePatterns(nodeNetwork);
    const nodeActivations = Array.from(nodeNetwork.nodes.values()).map(n => n.activation);
    
    // 计算指标
    const bEntropy = entropy(boundaryIntensities);
    const nEntropy = entropy(nodeActivations);
    const bDiversity = diversity(boundaryIntensities);
    const nDiversity = diversity(nodeActivations);
    
    boundaryTimeSeries.push(boundaryStats.avgIntensity);
    nodeTimeSeries.push(nodeStats.avgActivation);
    boundaryEntropySeries.push(bEntropy);
    nodeEntropySeries.push(nEntropy);
    boundaryDiversitySeries.push(bDiversity);
    nodeDiversitySeries.push(nDiversity);
    
    // 每20步记录快照
    if (step % 20 === 19) {
      snapshots.push({
        step,
        boundary: {
          avgIntensity: boundaryStats.avgIntensity,
          coherence: boundaryStats.coherence,
          entropy: bEntropy,
          diversity: bDiversity,
          activeRatio: boundaryStats.activeRatio,
          patternStrength: boundaryPatterns.patternStrength
        },
        node: {
          avgActivation: nodeStats.avgActivation,
          coherence: nodeStats.coherence,
          entropy: nEntropy,
          diversity: nDiversity,
          activeRatio: nodeStats.activeRatio
        }
      });
    }
  }

  // 计算综合指标
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  
  const analysis = {
    boundary: {
      // 基础指标
      avgIntensity: avg(boundaryTimeSeries),
      avgCoherence: avg(snapshots.map(s => s.boundary.coherence)),
      
      // 关键新指标
      avgEntropy: avg(boundaryEntropySeries),
      avgDiversity: avg(boundaryDiversitySeries),
      temporalVariation: temporalVariation(boundaryTimeSeries),
      
      // 稳定性（后期变化小）
      lateStability: 1 - temporalVariation(boundaryTimeSeries.slice(-100)),
      
      // 模式涌现
      avgPatternStrength: avg(snapshots.map(s => s.boundary.patternStrength))
    },
    node: {
      avgActivation: avg(nodeTimeSeries),
      avgCoherence: avg(snapshots.map(s => s.node.coherence)),
      avgEntropy: avg(nodeEntropySeries),
      avgDiversity: avg(nodeDiversitySeries),
      temporalVariation: temporalVariation(nodeTimeSeries),
      lateStability: 1 - temporalVariation(nodeTimeSeries.slice(-100))
    },
    comparison: {
      // 信息编码能力（熵越高越好）
      entropyAdvantage: avg(boundaryEntropySeries) - avg(nodeEntropySeries),
      
      // 动态多样性（多样性越高越好）
      diversityAdvantage: avg(boundaryDiversitySeries) - avg(nodeDiversitySeries),
      
      // 时间变化（适度的变化是好的）
      variationAdvantage: temporalVariation(boundaryTimeSeries) - temporalVariation(nodeTimeSeries),
      
      // 最终判断
      boundaryBetter: 
        avg(boundaryEntropySeries) > avg(nodeEntropySeries) &&
        avg(boundaryDiversitySeries) > avg(nodeDiversitySeries)
    }
  };

  // 生成结论
  const conclusions: string[] = [];
  
  if (analysis.comparison.entropyAdvantage > 0) {
    conclusions.push(`✅ 边界网络信息熵更高 (+${(analysis.comparison.entropyAdvantage * 100).toFixed(1)}%)，编码能力更强`);
  } else {
    conclusions.push(`❌ 节点网络信息熵更高 (${(analysis.comparison.entropyAdvantage * 100).toFixed(1)}%)`);
  }
  
  if (analysis.comparison.diversityAdvantage > 0) {
    conclusions.push(`✅ 边界网络多样性更高 (+${(analysis.comparison.diversityAdvantage * 100).toFixed(1)}%)，动态性更好`);
  } else {
    conclusions.push(`❌ 节点网络多样性更高 (${(analysis.comparison.diversityAdvantage * 100).toFixed(1)}%)`);
  }
  
  if (analysis.boundary.temporalVariation > analysis.node.temporalVariation) {
    conclusions.push(`✅ 边界网络保持更强的动态演化，避免过早收敛`);
  } else {
    conclusions.push(`⚠️ 边界网络动态性较低`);
  }

  return NextResponse.json({
    config,
    snapshots,
    analysis,
    conclusions,
    finalVerdict: {
      hypothesis: '信息存储在边界上比存储在节点中更能涌现智能',
      result: analysis.comparison.boundaryBetter ? '支持假设' : '需要更多研究',
      keyMetrics: {
        boundaryEntropy: analysis.boundary.avgEntropy.toFixed(3),
        nodeEntropy: analysis.node.avgEntropy.toFixed(3),
        boundaryDiversity: analysis.boundary.avgDiversity.toFixed(3),
        nodeDiversity: analysis.node.avgDiversity.toFixed(3)
      }
    }
  });
}
