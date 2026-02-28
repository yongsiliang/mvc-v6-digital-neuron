/**
 * 节点网络（传统模型）
 * 
 * 对比实验：信息存储在节点中，边只是连接
 */

// 节点状态
interface NodeState {
  id: string;
  x: number;
  y: number;
  activation: number;     // 激活值 (0-1)
  bias: number;           // 偏置
  connections: string[];  // 连接的其他节点ID
  weights: Map<string, number>;  // 连接权重
}

// 节点网络
interface NodeNetwork {
  nodes: Map<string, NodeState>;
}

/**
 * 创建六边形网格的节点网络
 */
export function createNodeNetwork(rings: number): NodeNetwork {
  const nodes = new Map<string, NodeState>();
  
  const directions = [
    { q: 1, r: 0 },   // E
    { q: 1, r: -1 },  // NE
    { q: 0, r: -1 },  // NW
    { q: -1, r: 0 },  // W
    { q: -1, r: 1 },  // SW
    { q: 0, r: 1 },   // SE
  ];
  
  // 生成节点
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      if (Math.abs(q + r) <= rings) {
        const nodeId = `${q},${r}`;
        const x = q * 1.5;
        const y = q * 0.866 + r * 1.732;
        
        nodes.set(nodeId, {
          id: nodeId,
          x,
          y,
          activation: Math.random() * 0.1,
          bias: 0,
          connections: [],
          weights: new Map()
        });
      }
    }
  }
  
  // 建立连接
  nodes.forEach((node, nodeId) => {
    const [q, r] = nodeId.split(',').map(Number);
    
    directions.forEach(dir => {
      const neighborId = `${q + dir.q},${r + dir.r}`;
      if (nodes.has(neighborId) && !node.connections.includes(neighborId)) {
        node.connections.push(neighborId);
        node.weights.set(neighborId, 0.5 + Math.random() * 0.5);  // 初始权重
      }
    });
  });
  
  return { nodes };
}

/**
 * 节点网络的规则
 */
export interface NodeNetworkRules {
  learningRate: number;
  decayRate: number;
  threshold: number;
  activationFunction: 'sigmoid' | 'relu' | 'tanh';
}

const defaultNodeRules: NodeNetworkRules = {
  learningRate: 0.1,
  decayRate: 0.02,
  threshold: 0.1,
  activationFunction: 'sigmoid'
};

/**
 * 激活函数
 */
function activate(x: number, type: string): number {
  switch (type) {
    case 'sigmoid':
      return 1 / (1 + Math.exp(-x * 5));
    case 'relu':
      return Math.max(0, x);
    case 'tanh':
      return Math.tanh(x * 2);
    default:
      return x;
  }
}

/**
 * 节点网络的一步演化
 */
export function evolveNodeNetwork(
  network: NodeNetwork,
  rules: NodeNetworkRules = defaultNodeRules
): NodeNetwork {
  const newNodes = new Map<string, NodeState>();
  
  // 计算新激活值
  network.nodes.forEach((node, nodeId) => {
    // 收集来自邻居的输入
    let input = node.bias;
    
    node.connections.forEach(neighborId => {
      const neighbor = network.nodes.get(neighborId);
      if (neighbor) {
        const weight = node.weights.get(neighborId) || 0.5;
        input += neighbor.activation * weight;
      }
    });
    
    // 应用激活函数
    let newActivation = activate(input, rules.activationFunction);
    
    // 衰减
    newActivation -= newActivation * rules.decayRate;
    
    // 限制
    newActivation = Math.max(0, Math.min(1, newActivation));
    
    newNodes.set(nodeId, {
      ...node,
      activation: newActivation
    });
  });
  
  // Hebbian学习：同时激活的连接增强
  newNodes.forEach((node, nodeId) => {
    node.connections.forEach(neighborId => {
      const neighbor = newNodes.get(neighborId);
      if (neighbor) {
        // Hebb规则：一起激活，连接增强
        const deltaW = rules.learningRate * node.activation * neighbor.activation;
        const oldWeight = node.weights.get(neighborId) || 0.5;
        node.weights.set(neighborId, Math.max(0, Math.min(1, oldWeight + deltaW)));
      }
    });
  });
  
  return { nodes: newNodes };
}

/**
 * 注入信息到节点网络
 */
export function injectIntoNodeNetwork(
  network: NodeNetwork,
  positions: { q: number; r: number }[],
  intensity: number = 0.8
): NodeNetwork {
  const newNodes = new Map(network.nodes);
  
  positions.forEach(pos => {
    const nodeId = `${pos.q},${pos.r}`;
    const node = newNodes.get(nodeId);
    
    if (node) {
      newNodes.set(nodeId, {
        ...node,
        activation: intensity
      });
    }
  });
  
  return { nodes: newNodes };
}

/**
 * 计算节点网络的整体状态
 */
export function getNodeNetworkStats(network: NodeNetwork) {
  let totalActivation = 0;
  let activeNodes = 0;
  let maxActivation = 0;
  let totalWeight = 0;
  let weightCount = 0;
  
  network.nodes.forEach(node => {
    totalActivation += node.activation;
    if (node.activation > 0.1) activeNodes++;
    maxActivation = Math.max(maxActivation, node.activation);
    
    node.weights.forEach(w => {
      totalWeight += w;
      weightCount++;
    });
  });
  
  const numNodes = network.nodes.size;
  
  return {
    totalActivation,
    avgActivation: totalActivation / numNodes,
    activeNodes,
    activeRatio: activeNodes / numNodes,
    maxActivation,
    avgWeight: weightCount > 0 ? totalWeight / weightCount : 0,
    coherence: calculateNodeCoherence(network)
  };
}

/**
 * 计算节点网络的相干性
 */
function calculateNodeCoherence(network: NodeNetwork): number {
  // 计算邻居之间激活值的相似度
  let similarity = 0;
  let count = 0;
  
  network.nodes.forEach(node => {
    if (node.activation > 0.1) {
      node.connections.forEach(neighborId => {
        const neighbor = network.nodes.get(neighborId);
        if (neighbor && neighbor.activation > 0.1) {
          similarity += 1 - Math.abs(node.activation - neighbor.activation);
          count++;
        }
      });
    }
  });
  
  return count > 0 ? similarity / count : 0;
}

/**
 * 检测模式
 */
export function detectNodePatterns(network: NodeNetwork): {
  hasPattern: boolean;
  patternStrength: number;
  clusters: string[][];
} {
  const activeNodeIds: string[] = [];
  network.nodes.forEach((node, id) => {
    if (node.activation > 0.3) {
      activeNodeIds.push(id);
    }
  });
  
  // 聚类
  const visited = new Set<string>();
  const clusters: string[][] = [];
  
  activeNodeIds.forEach(nodeId => {
    if (!visited.has(nodeId)) {
      const cluster: string[] = [];
      const queue = [nodeId];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        cluster.push(current);
        
        const node = network.nodes.get(current);
        if (node) {
          node.connections.forEach(n => {
            if (!visited.has(n) && activeNodeIds.includes(n)) {
              queue.push(n);
            }
          });
        }
      }
      
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });
  
  const avgClusterSize = clusters.length > 0
    ? clusters.reduce((sum, c) => sum + c.length, 0) / clusters.length
    : 0;
  
  const coherence = calculateNodeCoherence(network);
  const patternStrength = (avgClusterSize / 10) * coherence;
  
  return {
    hasPattern: clusters.some(c => c.length >= 6),
    patternStrength,
    clusters
  };
}

export { defaultNodeRules };
export type { NodeNetwork, NodeState };
