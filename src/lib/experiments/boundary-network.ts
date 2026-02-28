/**
 * 边界网络实验
 * 
 * 核心假设：信息存储在边界上，而不是节点中
 * 
 * 对比：
 * - 节点网络（传统）：每个节点有状态，边只是连接
 * - 边界网络（新）：每条边有状态，节点只是交汇点
 */

// 边界状态
interface EdgeState {
  id: string;
  intensity: number;      // 信息强度 (0-1)
  phase: number;          // 相位 (用于波动)
  age: number;            // 年龄（存活时间）
}

// 节点（只是交汇点，不存储信息）
interface Node {
  id: string;
  x: number;
  y: number;
  edges: string[];        // 连接的边ID
}

// 六边形网格
interface HexGrid {
  nodes: Map<string, Node>;
  edges: Map<string, EdgeState>;
  adjacency: Map<string, string[]>;  // 边之间的邻接关系
}

/**
 * 创建六边形网格
 */
export function createHexagonGrid(rings: number): HexGrid {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, EdgeState>();
  const adjacency = new Map<string, string[]>();
  
  // 六边形网格坐标系统（轴向坐标）
  // 每个六边形有6个邻居，方向：E, NE, NW, W, SW, SE
  
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
        // 转换为笛卡尔坐标（用于可视化）
        const x = q * 1.5;  // 六边形宽度
        const y = q * 0.866 + r * 1.732;  // 六边形高度
        nodes.set(nodeId, {
          id: nodeId,
          x,
          y,
          edges: []
        });
      }
    }
  }
  
  // 生成边
  const edgeSet = new Set<string>();
  
  nodes.forEach((node, nodeId) => {
    const [q, r] = nodeId.split(',').map(Number);
    
    directions.forEach((dir, dirIndex) => {
      const neighborQ = q + dir.q;
      const neighborR = r + dir.r;
      const neighborId = `${neighborQ},${neighborR}`;
      
      if (nodes.has(neighborId)) {
        // 创建边ID（确保唯一，用排序保证）
        const edgeId = [nodeId, neighborId].sort().join('-');
        
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          
          // 初始化边状态（随机微弱激活）
          edges.set(edgeId, {
            id: edgeId,
            intensity: Math.random() * 0.1,
            phase: Math.random() * Math.PI * 2,
            age: 0
          });
          
          // 记录节点连接的边
          nodes.get(nodeId)!.edges.push(edgeId);
          nodes.get(neighborId)!.edges.push(edgeId);
        }
      }
    });
  });
  
  // 建立边之间的邻接关系（共享节点的边是邻接的）
  edges.forEach((edge, edgeId) => {
    const [node1, node2] = edgeId.split('-');
    const neighbors: string[] = [];
    
    // 找到共享节点的所有其他边
    const node1Neighbors = nodes.get(node1)?.edges || [];
    const node2Neighbors = nodes.get(node2)?.edges || [];
    
    [...node1Neighbors, ...node2Neighbors].forEach(e => {
      if (e !== edgeId && !neighbors.includes(e)) {
        neighbors.push(e);
      }
    });
    
    adjacency.set(edgeId, neighbors);
  });
  
  return { nodes, edges, adjacency };
}

/**
 * 边界网络的动态规则
 */
export interface BoundaryNetworkRules {
  // 信息传播率
  propagationRate: number;
  // 阈值（低于此值的边不会传播）
  threshold: number;
  // 衰减率
  decayRate: number;
  // 自激系数
  selfExcitation: number;
  // 邻接激励系数
  neighborExcitation: number;
  // 波动频率
  oscillationFreq: number;
  // 全局抑制系数
  globalInhibition: number;
}

const defaultRules: BoundaryNetworkRules = {
  propagationRate: 0.3,
  threshold: 0.1,
  decayRate: 0.02,
  selfExcitation: 0.1,
  neighborExcitation: 0.15,
  oscillationFreq: 0.1,
  globalInhibition: 0.3
};

/**
 * 边界网络的一步演化
 */
export function evolveBoundaryNetwork(
  grid: HexGrid,
  rules: BoundaryNetworkRules = defaultRules,
  dt: number = 0.016
): HexGrid {
  const newEdges = new Map<string, EdgeState>();
  
  grid.edges.forEach((edge, edgeId) => {
    // 计算来自邻接边的输入
    const neighbors = grid.adjacency.get(edgeId) || [];
    let inputFromNeighbors = 0;
    
    neighbors.forEach(neighborId => {
      const neighbor = grid.edges.get(neighborId);
      if (neighbor && neighbor.intensity > rules.threshold) {
        // 邻接边的影响（考虑相位差）
        const phaseDiff = Math.abs(edge.phase - neighbor.phase);
        const phaseFactor = Math.cos(phaseDiff);
        inputFromNeighbors += neighbor.intensity * rules.neighborExcitation * phaseFactor;
      }
    });
    
    // 自激（当前边的自我强化）
    const selfInput = edge.intensity * rules.selfExcitation;
    
    // 波动（模拟吸引子动力学的振荡）
    const oscillation = Math.sin(edge.age * rules.oscillationFreq + edge.phase) * 0.05;
    
    // 衰减
    const decay = edge.intensity * rules.decayRate;
    
    // 更新强度
    let newIntensity = edge.intensity 
      + inputFromNeighbors 
      + selfInput 
      + oscillation 
      - decay;
    
    // 限制在 [0, 1]
    newIntensity = Math.max(0, Math.min(1, newIntensity));
    
    // 更新相位（基于强度变化）
    const newPhase = edge.phase + newIntensity * 0.1;
    
    newEdges.set(edgeId, {
      id: edgeId,
      intensity: newIntensity,
      phase: newPhase,
      age: edge.age + dt
    });
  });
  
  return {
    ...grid,
    edges: newEdges
  };
}

/**
 * 注入信息到边界网络
 */
export function injectIntoBoundary(
  grid: HexGrid,
  positions: { q: number; r: number }[],
  intensity: number = 0.8
): HexGrid {
  const newEdges = new Map(grid.edges);
  
  positions.forEach(pos => {
    const nodeId = `${pos.q},${pos.r}`;
    const node = grid.nodes.get(nodeId);
    
    if (node) {
      // 激活该节点的所有边
      node.edges.forEach(edgeId => {
        const edge = newEdges.get(edgeId);
        if (edge) {
          newEdges.set(edgeId, {
            ...edge,
            intensity: Math.max(edge.intensity, intensity),
            phase: Math.random() * Math.PI * 2
          });
        }
      });
    }
  });
  
  return { ...grid, edges: newEdges };
}

/**
 * 计算边界网络的整体状态
 */
export function getBoundaryNetworkStats(grid: HexGrid) {
  let totalIntensity = 0;
  let activeEdges = 0;
  let maxIntensity = 0;
  let avgPhase = 0;
  
  grid.edges.forEach(edge => {
    totalIntensity += edge.intensity;
    if (edge.intensity > 0.1) activeEdges++;
    maxIntensity = Math.max(maxIntensity, edge.intensity);
    avgPhase += edge.phase;
  });
  
  const numEdges = grid.edges.size;
  
  return {
    totalIntensity,
    avgIntensity: totalIntensity / numEdges,
    activeEdges,
    activeRatio: activeEdges / numEdges,
    maxIntensity,
    avgPhase: avgPhase / numEdges,
    coherence: calculateCoherence(grid)
  };
}

/**
 * 计算相干性（边之间相位的一致程度）
 */
function calculateCoherence(grid: HexGrid): number {
  let sumCos = 0;
  let sumSin = 0;
  let count = 0;
  
  grid.edges.forEach(edge => {
    if (edge.intensity > 0.1) {
      sumCos += Math.cos(edge.phase) * edge.intensity;
      sumSin += Math.sin(edge.phase) * edge.intensity;
      count++;
    }
  });
  
  if (count === 0) return 0;
  
  const R = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / count;
  return R;
}

/**
 * 检测模式（周期性结构）
 */
export function detectPatterns(grid: HexGrid): {
  hasHexagonalPattern: boolean;
  patternStrength: number;
  clusters: string[][];
} {
  // 找高激活的边
  const activeEdgeIds: string[] = [];
  grid.edges.forEach((edge, id) => {
    if (edge.intensity > 0.3) {
      activeEdgeIds.push(id);
    }
  });
  
  // 简单的聚类：找到连通的高激活边组
  const visited = new Set<string>();
  const clusters: string[][] = [];
  
  activeEdgeIds.forEach(edgeId => {
    if (!visited.has(edgeId)) {
      const cluster: string[] = [];
      const queue = [edgeId];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        cluster.push(current);
        
        // 找邻接的活跃边
        const neighbors = grid.adjacency.get(current) || [];
        neighbors.forEach(n => {
          if (!visited.has(n) && activeEdgeIds.includes(n)) {
            queue.push(n);
          }
        });
      }
      
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });
  
  // 计算模式强度（基于聚类的大小和相干性）
  const avgClusterSize = clusters.length > 0 
    ? clusters.reduce((sum, c) => sum + c.length, 0) / clusters.length 
    : 0;
  
  const coherence = calculateCoherence(grid);
  const patternStrength = (avgClusterSize / 10) * coherence;
  
  return {
    hasHexagonalPattern: clusters.some(c => c.length >= 6),
    patternStrength,
    clusters
  };
}

export { defaultRules };
export type { HexGrid, EdgeState, Node };
