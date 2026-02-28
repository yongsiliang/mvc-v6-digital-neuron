/**
 * 对比实验：边界网络 vs 节点网络
 */

import {
  createHexagonGrid,
  evolveBoundaryNetwork,
  injectIntoBoundary,
  getBoundaryNetworkStats,
  detectPatterns,
  type HexGrid,
  type BoundaryNetworkRules
} from './boundary-network';

import {
  createNodeNetwork,
  evolveNodeNetwork,
  injectIntoNodeNetwork,
  getNodeNetworkStats,
  detectNodePatterns,
  type NodeNetwork,
  type NodeNetworkRules
} from './node-network';

// 实验结果
export interface ExperimentResult {
  step: number;
  boundary: {
    stats: ReturnType<typeof getBoundaryNetworkStats>;
    patterns: ReturnType<typeof detectPatterns>;
  };
  node: {
    stats: ReturnType<typeof getNodeNetworkStats>;
    patterns: ReturnType<typeof detectNodePatterns>;
  };
}

// 实验配置
export interface ExperimentConfig {
  rings: number;           // 网格大小
  steps: number;           // 运行步数
  injectionSteps: number[]; // 在哪些步注入信息
  injectionPositions: { q: number; r: number }[];
  boundaryRules: BoundaryNetworkRules;
  nodeRules: NodeNetworkRules;
}

const defaultConfig: ExperimentConfig = {
  rings: 5,
  steps: 200,
  injectionSteps: [0, 50, 100, 150],
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
    globalInhibition: 0.3
  },
  nodeRules: {
    learningRate: 0.3,
    decayRate: 0.015,
    threshold: 0.08,
    globalInhibition: 0.3,
    selfExcitation: 0.15,
    neighborExcitation: 0.2,
    oscillationFreq: 0.08,
    activationFunction: 'sigmoid'
  }
};

/**
 * 运行对比实验
 */
export function runComparisonExperiment(
  config: ExperimentConfig = defaultConfig
): {
  boundaryGrid: HexGrid;
  nodeNetwork: NodeNetwork;
  results: ExperimentResult[];
} {
  // 初始化两个网络
  let boundaryGrid = createHexagonGrid(config.rings);
  let nodeNetwork = createNodeNetwork(config.rings);
  
  const results: ExperimentResult[] = [];
  
  // 运行实验
  for (let step = 0; step < config.steps; step++) {
    // 注入信息
    if (config.injectionSteps.includes(step)) {
      boundaryGrid = injectIntoBoundary(
        boundaryGrid,
        config.injectionPositions,
        0.9
      );
      nodeNetwork = injectIntoNodeNetwork(
        nodeNetwork,
        config.injectionPositions,
        0.9
      );
    }
    
    // 演化
    boundaryGrid = evolveBoundaryNetwork(boundaryGrid, config.boundaryRules);
    nodeNetwork = evolveNodeNetwork(nodeNetwork, config.nodeRules);
    
    // 记录结果
    results.push({
      step,
      boundary: {
        stats: getBoundaryNetworkStats(boundaryGrid),
        patterns: detectPatterns(boundaryGrid)
      },
      node: {
        stats: getNodeNetworkStats(nodeNetwork),
        patterns: detectNodePatterns(nodeNetwork)
      }
    });
  }
  
  return {
    boundaryGrid,
    nodeNetwork,
    results
  };
}

/**
 * 分析实验结果
 */
export function analyzeResults(results: ExperimentResult[]): {
  boundary: {
    avgIntensity: number;
    maxIntensity: number;
    avgCoherence: number;
    patternEmergence: number[];  // 模式出现的步数
    stabilityIndex: number;      // 稳定性指数
  };
  node: {
    avgActivation: number;
    maxActivation: number;
    avgCoherence: number;
    patternEmergence: number[];
    stabilityIndex: number;
  };
  comparison: {
    coherenceAdvantage: number;  // 边界网络相干性优势
    stabilityAdvantage: number;  // 稳定性优势
    patternAdvantage: number;    // 模式涌现优势
  };
} {
  // 边界网络统计
  const boundaryIntensities = results.map(r => r.boundary.stats.avgIntensity);
  const boundaryCoherences = results.map(r => r.boundary.stats.coherence);
  const boundaryPatterns = results
    .map((r, i) => r.boundary.patterns.hasHexagonalPattern ? i : -1)
    .filter(i => i >= 0);
  
  // 节点网络统计
  const nodeActivations = results.map(r => r.node.stats.avgActivation);
  const nodeCoherences = results.map(r => r.node.stats.coherence);
  const nodePatterns = results
    .map((r, i) => r.node.patterns.hasPattern ? i : -1)
    .filter(i => i >= 0);
  
  // 计算稳定性（后期变化率）
  const lastQuarter = Math.floor(results.length * 3 / 4);
  const boundaryStability = calculateStability(
    boundaryIntensities.slice(lastQuarter)
  );
  const nodeStability = calculateStability(
    nodeActivations.slice(lastQuarter)
  );
  
  return {
    boundary: {
      avgIntensity: average(boundaryIntensities),
      maxIntensity: Math.max(...boundaryIntensities),
      avgCoherence: average(boundaryCoherences),
      patternEmergence: boundaryPatterns,
      stabilityIndex: boundaryStability
    },
    node: {
      avgActivation: average(nodeActivations),
      maxActivation: Math.max(...nodeActivations),
      avgCoherence: average(nodeCoherences),
      patternEmergence: nodePatterns,
      stabilityIndex: nodeStability
    },
    comparison: {
      coherenceAdvantage: average(boundaryCoherences) - average(nodeCoherences),
      stabilityAdvantage: boundaryStability - nodeStability,
      patternAdvantage: boundaryPatterns.length - nodePatterns.length
    }
  };
}

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateStability(values: number[]): number {
  if (values.length < 2) return 0;
  
  let changes = 0;
  for (let i = 1; i < values.length; i++) {
    changes += Math.abs(values[i] - values[i-1]);
  }
  
  // 变化越小，稳定性越高
  return 1 - (changes / values.length);
}

export { defaultConfig };
export type { HexGrid, NodeNetwork };
