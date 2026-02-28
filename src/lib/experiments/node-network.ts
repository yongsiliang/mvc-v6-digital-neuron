/**
 * 节点网络（传统模型）- 修复版
 * 
 * 对比实验：信息存储在节点中，边只是连接
 * 
 * 修复内容：
 * 1. 降低初始权重，避免快速饱和
 * 2. 添加全局抑制，引入竞争
 * 3. 使用Oja规则替代纯Hebbian，权重有增有减
 * 4. 调整激活函数敏感度
 */

// 节点状态
interface NodeState {
  id: string;
  x: number;
  y: number;
  activation: number;     // 激活值 (0-1)
  phase: number;          // 相位（用于波动，与边界网络一致）
  bias: number;           // 偏置
  connections: string[];  // 连接的其他节点ID
  weights: Map<string, number>;  // 连接权重
  age: number;            // 存活时间
}

// 节点网络
export interface NodeNetwork {
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
          phase: Math.random() * Math.PI * 2,
          bias: 0,
          connections: [],
          weights: new Map(),
          age: 0
        });
      }
    }
  }
  
  // 建立连接 - 使用较小的初始权重
  nodes.forEach((node, nodeId) => {
    const [q, r] = nodeId.split(',').map(Number);
    
    directions.forEach(dir => {
      const neighborId = `${q + dir.q},${r + dir.r}`;
      if (nodes.has(neighborId) && !node.connections.includes(neighborId)) {
        node.connections.push(neighborId);
        // 修复：初始权重降低到 0.1~0.2，避免快速饱和
        node.weights.set(neighborId, 0.1 + Math.random() * 0.1);
      }
    });
  });
  
  return { nodes };
}

/**
 * 节点网络的规则 - 与边界网络参数对应
 */
export interface NodeNetworkRules {
  learningRate: number;      // 对应 propagationRate
  decayRate: number;         // 对应 decayRate
  threshold: number;         // 激活阈值
  globalInhibition: number;  // 全局抑制（新增）
  selfExcitation: number;    // 自激系数（新增）
  neighborExcitation: number; // 邻居激励系数（新增）
  oscillationFreq: number;   // 波动频率（新增，与边界网络一致）
  activationFunction: 'sigmoid' | 'relu' | 'tanh';
}

const defaultNodeRules: NodeNetworkRules = {
  learningRate: 0.1,
  decayRate: 0.02,
  threshold: 0.1,
  globalInhibition: 0.25,
  selfExcitation: 0.15,
  neighborExcitation: 0.2,
  oscillationFreq: 0.08,
  activationFunction: 'sigmoid'
};

/**
 * 激活函数 - 降低敏感度
 */
function activate(x: number, type: string): number {
  switch (type) {
    case 'sigmoid':
      // 修复：降低敏感度，sigmoid(x) 而不是 sigmoid(x*5)
      return 1 / (1 + Math.exp(-x * 2));
    case 'relu':
      return Math.max(0, x);
    case 'tanh':
      return Math.tanh(x);
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
  
  // 计算全局抑制
  let totalActivation = 0;
  network.nodes.forEach(node => {
    totalActivation += node.activation;
  });
  const avgActivation = totalActivation / network.nodes.size;
  const globalInhibition = avgActivation * rules.globalInhibition;
  
  // 计算新激活值
  network.nodes.forEach((node, nodeId) => {
    // 收集来自邻居的输入 - 考虑相位同步
    let neighborInput = 0;
    
    node.connections.forEach(neighborId => {
      const neighbor = network.nodes.get(neighborId);
      if (neighbor) {
        const weight = node.weights.get(neighborId) || 0.1;
        // 添加相位因素，与边界网络一致
        const phaseDiff = Math.abs(node.phase - neighbor.phase);
        const phaseFactor = 0.5 + 0.5 * Math.cos(phaseDiff);
        neighborInput += neighbor.activation * weight * phaseFactor * rules.neighborExcitation;
      }
    });
    
    // 自激
    const selfInput = node.activation * rules.selfExcitation;
    
    // 波动（与边界网络一致）
    const oscillation = Math.sin(node.age * rules.oscillationFreq + node.phase) * 0.05;
    
    // 总输入
    const totalInput = node.bias + neighborInput + selfInput + oscillation - globalInhibition;
    
    // 应用激活函数
    let newActivation = activate(totalInput, rules.activationFunction);
    
    // 衰减
    newActivation -= newActivation * rules.decayRate;
    
    // 限制
    newActivation = Math.max(0, Math.min(1, newActivation));
    
    // 更新相位
    const newPhase = node.phase + newActivation * 0.1;
    
    newNodes.set(nodeId, {
      ...node,
      activation: newActivation,
      phase: newPhase,
      age: node.age + 1
    });
  });
  
  // Oja学习规则（替代纯Hebbian）：权重有增有减
  // Δw = η * y * (x - y * w)
  // 这样权重会自动归一化，不会无限增长
  newNodes.forEach((node, nodeId) => {
    node.connections.forEach(neighborId => {
      const neighbor = newNodes.get(neighborId);
      if (neighbor) {
        const oldWeight = node.weights.get(neighborId) || 0.1;
        // Oja规则：同时激活增强，但受当前权重抑制
        const deltaW = rules.learningRate * node.activation * 
          (neighbor.activation - node.activation * oldWeight);
        const newWeight = Math.max(0.01, Math.min(1, oldWeight + deltaW));
        node.weights.set(neighborId, newWeight);
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
        activation: intensity,
        phase: 0  // 注入时统一相位，与边界网络一致
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
 * 计算节点网络的相干性（与边界网络一致的计算方式）
 */
function calculateNodeCoherence(network: NodeNetwork): number {
  let sumCos = 0;
  let sumSin = 0;
  let count = 0;
  
  network.nodes.forEach(node => {
    if (node.activation > 0.1) {
      sumCos += Math.cos(node.phase) * node.activation;
      sumSin += Math.sin(node.phase) * node.activation;
      count++;
    }
  });
  
  if (count === 0) return 0;
  
  const R = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / count;
  return R;
}

/**
 * 检测模式
 */
export function detectNodePatterns(network: NodeNetwork): {
  hasPattern: boolean;
  patternStrength: number;
  clusters: string[][];
} {
  // 找高激活的节点
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
      
      if (cluster.length >= 3) {
        clusters.push(cluster);
      }
    }
  });
  
  // 计算模式强度
  let patternStrength = 0;
  clusters.forEach(cluster => {
    patternStrength += cluster.length;
  });
  patternStrength = Math.min(1, patternStrength / network.nodes.size * 2);
  
  return {
    hasPattern: clusters.length > 0,
    patternStrength,
    clusters
  };
}
