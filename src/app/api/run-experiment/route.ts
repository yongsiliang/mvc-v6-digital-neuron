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

// 信息熵计算
function entropy(values: number[]): number {
  if (values.length === 0) return 0;
  const buckets = new Array(10).fill(0);
  values.forEach(v => {
    const idx = Math.min(9, Math.floor(v * 10));
    buckets[idx]++;
  });
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

// 多样性计算
function diversity(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// 时间变化率
function temporalVariation(timeSeries: number[]): number {
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

  // 公平对比：使用相同/对应的参数
  const boundaryRules: BoundaryNetworkRules = {
    propagationRate: 0.3,
    threshold: 0.08,
    decayRate: 0.02,
    selfExcitation: 0.15,
    neighborExcitation: 0.2,
    oscillationFreq: 0.08,
    globalInhibition: 0.25
  };

  // 节点网络使用对应的参数
  const nodeRules: NodeNetworkRules = {
    learningRate: 0.3,           // 对应 propagationRate
    decayRate: 0.02,             // 相同
    threshold: 0.08,             // 相同
    globalInhibition: 0.25,      // 相同
    selfExcitation: 0.15,        // 相同
    neighborExcitation: 0.2,     // 相同
    oscillationFreq: 0.08,       // 相同
    activationFunction: 'sigmoid'
  };

  // 初始化网络
  let boundaryGrid = createHexagonGrid(config.rings);
  let nodeNetwork = createNodeNetwork(config.rings);

  console.log(`边界网络: ${boundaryGrid.nodes.size} 节点, ${boundaryGrid.edges.size} 边`);
  console.log(`节点网络: ${nodeNetwork.nodes.size} 节点`);

  // 数据收集
  const boundaryIntensities: number[] = [];
  const nodeActivations: number[] = [];
  const boundaryEntropies: number[] = [];
  const nodeEntropies: number[] = [];
  const boundaryDiversities: number[] = [];
  const nodeDiversities: number[] = [];
  const boundaryCoherences: number[] = [];
  const nodeCoherences: number[] = [];
  const boundaryPatterns: number[] = [];
  const nodePatterns: number[] = [];

  const snapshots: Array<{
    step: number;
    boundary: { intensity: number; entropy: number; diversity: number; coherence: number; pattern: number };
    node: { activation: number; entropy: number; diversity: number; coherence: number; pattern: number };
  }> = [];

  // 运行实验
  for (let step = 0; step < config.steps; step++) {
    // 注入信息
    if (config.injectionSteps.includes(step)) {
      boundaryGrid = injectIntoBoundary(boundaryGrid, config.injectionPositions, 0.9);
      nodeNetwork = injectIntoNodeNetwork(nodeNetwork, config.injectionPositions, 0.9);
    }
    
    // 演化
    boundaryGrid = evolveBoundaryNetwork(boundaryGrid, boundaryRules);
    nodeNetwork = evolveNodeNetwork(nodeNetwork, nodeRules);
    
    // 边界网络统计
    const bStats = getBoundaryNetworkStats(boundaryGrid);
    const bPattern = detectPatterns(boundaryGrid);
    const bValues = Array.from(boundaryGrid.edges.values()).map(e => e.intensity);
    
    // 节点网络统计
    const nStats = getNodeNetworkStats(nodeNetwork);
    const nPattern = detectNodePatterns(nodeNetwork);
    const nValues = Array.from(nodeNetwork.nodes.values()).map(n => n.activation);
    
    // 收集数据
    boundaryIntensities.push(bStats.avgIntensity);
    nodeActivations.push(nStats.avgActivation);
    boundaryEntropies.push(entropy(bValues));
    nodeEntropies.push(entropy(nValues));
    boundaryDiversities.push(diversity(bValues));
    nodeDiversities.push(diversity(nValues));
    boundaryCoherences.push(bStats.coherence);
    nodeCoherences.push(nStats.coherence);
    boundaryPatterns.push(bPattern.patternStrength);
    nodePatterns.push(nPattern.patternStrength);
    
    // 快照
    if (step % 40 === 39) {
      snapshots.push({
        step,
        boundary: {
          intensity: bStats.avgIntensity,
          entropy: entropy(bValues),
          diversity: diversity(bValues),
          coherence: bStats.coherence,
          pattern: bPattern.patternStrength
        },
        node: {
          activation: nStats.avgActivation,
          entropy: entropy(nValues),
          diversity: diversity(nValues),
          coherence: nStats.coherence,
          pattern: nPattern.patternStrength
        }
      });
    }
  }

  // 计算平均值
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const max = (arr: number[]) => Math.max(...arr);
  const min = (arr: number[]) => Math.min(...arr);

  // 客观分析
  const analysis = {
    boundary: {
      avgIntensity: avg(boundaryIntensities),
      avgEntropy: avg(boundaryEntropies),
      avgDiversity: avg(boundaryDiversities),
      avgCoherence: avg(boundaryCoherences),
      avgPattern: avg(boundaryPatterns),
      temporalVariation: temporalVariation(boundaryIntensities)
    },
    node: {
      avgActivation: avg(nodeActivations),
      avgEntropy: avg(nodeEntropies),
      avgDiversity: avg(nodeDiversities),
      avgCoherence: avg(nodeCoherences),
      avgPattern: avg(nodePatterns),
      temporalVariation: temporalVariation(nodeActivations)
    },
    comparison: {
      entropyDiff: avg(boundaryEntropies) - avg(nodeEntropies),
      diversityDiff: avg(boundaryDiversities) - avg(nodeDiversities),
      coherenceDiff: avg(boundaryCoherences) - avg(nodeCoherences),
      patternDiff: avg(boundaryPatterns) - avg(nodePatterns),
      variationDiff: temporalVariation(boundaryIntensities) - temporalVariation(nodeActivations)
    }
  };

  // 客观结论（不偏向任何一方）
  const conclusions: string[] = [];
  
  if (analysis.comparison.entropyDiff > 0.1) {
    conclusions.push(`边界网络信息熵更高 (+${(analysis.comparison.entropyDiff).toFixed(3)})`);
  } else if (analysis.comparison.entropyDiff < -0.1) {
    conclusions.push(`节点网络信息熵更高 (+${Math.abs(analysis.comparison.entropyDiff).toFixed(3)})`);
  } else {
    conclusions.push(`两者信息熵接近 (差值: ${analysis.comparison.entropyDiff.toFixed(3)})`);
  }
  
  if (analysis.comparison.diversityDiff > 0.05) {
    conclusions.push(`边界网络多样性更高 (+${(analysis.comparison.diversityDiff).toFixed(3)})`);
  } else if (analysis.comparison.diversityDiff < -0.05) {
    conclusions.push(`节点网络多样性更高 (+${Math.abs(analysis.comparison.diversityDiff).toFixed(3)})`);
  } else {
    conclusions.push(`两者多样性接近 (差值: ${analysis.comparison.diversityDiff.toFixed(3)})`);
  }
  
  if (analysis.comparison.coherenceDiff > 0.1) {
    conclusions.push(`边界网络相干性更高 (+${(analysis.comparison.coherenceDiff).toFixed(3)})`);
  } else if (analysis.comparison.coherenceDiff < -0.1) {
    conclusions.push(`节点网络相干性更高 (+${Math.abs(analysis.comparison.coherenceDiff).toFixed(3)})`);
  } else {
    conclusions.push(`两者相干性接近 (差值: ${analysis.comparison.coherenceDiff.toFixed(3)})`);
  }

  return NextResponse.json({
    config,
    parameters: {
      boundary: boundaryRules,
      node: nodeRules
    },
    snapshots,
    analysis,
    conclusions,
    rawStats: {
      boundary: {
        minIntensity: min(boundaryIntensities),
        maxIntensity: max(boundaryIntensities)
      },
      node: {
        minActivation: min(nodeActivations),
        maxActivation: max(nodeActivations)
      }
    }
  });
}
