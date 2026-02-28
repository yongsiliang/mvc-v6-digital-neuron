'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * 边界网络 vs 节点网络 对比实验可视化
 */

interface ExperimentState {
  isRunning: boolean;
  step: number;
  boundaryData: { nodes: any[]; edges: any[] };
  nodeData: { nodes: any[]; connections: any[] };
  stats: {
    boundary: { avgIntensity: number; coherence: number; patternStrength: number };
    node: { avgActivation: number; coherence: number; patternStrength: number };
  };
  history: {
    boundaryIntensity: number[];
    nodeActivation: number[];
    boundaryCoherence: number[];
    nodeCoherence: number[];
  };
}

// 六边形方向
const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export default function ExperimentPage() {
  const boundaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const nodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [state, setState] = useState<ExperimentState>({
    isRunning: false,
    step: 0,
    boundaryData: { nodes: [], edges: [] },
    nodeData: { nodes: [], connections: [] },
    stats: {
      boundary: { avgIntensity: 0, coherence: 0, patternStrength: 0 },
      node: { avgActivation: 0, coherence: 0, patternStrength: 0 }
    },
    history: {
      boundaryIntensity: [],
      nodeActivation: [],
      boundaryCoherence: [],
      nodeCoherence: []
    }
  });
  
  const animationRef = useRef<number>(0);
  const networkRef = useRef<{
    boundary: Map<string, any>;
    node: Map<string, any>;
    edges: Map<string, any>;
    adjacency: Map<string, string[]>;
  } | null>(null);
  
  // 初始化网络
  const initNetworks = useCallback(() => {
    const rings = 4;
    const boundaryNodes = new Map<string, any>();
    const nodeNetwork = new Map<string, any>();
    const edges = new Map<string, any>();
    const adjacency = new Map<string, string[]>();
    
    // 生成节点
    for (let q = -rings; q <= rings; q++) {
      for (let r = -rings; r <= rings; r++) {
        if (Math.abs(q + r) <= rings) {
          const id = `${q},${r}`;
          const x = 200 + q * 1.5 * 25;
          const y = 200 + (q * 0.866 + r * 1.732) * 25;
          
          boundaryNodes.set(id, { id, x, y, edges: [] });
          nodeNetwork.set(id, { 
            id, x, y, 
            activation: Math.random() * 0.1,
            connections: []
          });
        }
      }
    }
    
    // 生成边
    const edgeSet = new Set<string>();
    
    boundaryNodes.forEach((node, id) => {
      const [q, r] = id.split(',').map(Number);
      
      HEX_DIRECTIONS.forEach((dir, dirIndex) => {
        const neighborId = `${q + dir.q},${r + dir.r}`;
        
        if (boundaryNodes.has(neighborId)) {
          const edgeId = [id, neighborId].sort().join('-');
          
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            
            edges.set(edgeId, {
              id: edgeId,
              intensity: Math.random() * 0.1,
              phase: Math.random() * Math.PI * 2,
              age: 0
            });
            
            boundaryNodes.get(id).edges.push(edgeId);
            boundaryNodes.get(neighborId).edges.push(edgeId);
          }
          
          nodeNetwork.get(id).connections.push(neighborId);
        }
      });
    });
    
    // 边邻接关系
    edges.forEach((edge, edgeId) => {
      const [node1, node2] = edgeId.split('-');
      const neighbors: string[] = [];
      
      const node1Edges = boundaryNodes.get(node1)?.edges || [];
      const node2Edges = boundaryNodes.get(node2)?.edges || [];
      
      [...node1Edges, ...node2Edges].forEach(e => {
        if (e !== edgeId && !neighbors.includes(e)) {
          neighbors.push(e);
        }
      });
      
      adjacency.set(edgeId, neighbors);
    });
    
    networkRef.current = {
      boundary: boundaryNodes,
      node: nodeNetwork,
      edges,
      adjacency
    };
    
    return { boundaryNodes, nodeNetwork, edges, adjacency };
  }, []);
  
  // 演化网络
  const evolveNetworks = useCallback(() => {
    if (!networkRef.current) return;
    
    const { boundary, node, edges, adjacency } = networkRef.current;
    
    // 边界网络演化
    const newEdges = new Map(edges);
    
    edges.forEach((edge, edgeId) => {
      const neighbors = adjacency.get(edgeId) || [];
      let inputFromNeighbors = 0;
      
      neighbors.forEach(neighborId => {
        const neighbor = edges.get(neighborId);
        if (neighbor && neighbor.intensity > 0.08) {
          const phaseDiff = Math.abs(edge.phase - neighbor.phase);
          const phaseFactor = Math.cos(phaseDiff);
          inputFromNeighbors += neighbor.intensity * 0.2 * phaseFactor;
        }
      });
      
      const selfInput = edge.intensity * 0.15;
      const oscillation = Math.sin(edge.age * 0.08 + edge.phase) * 0.05;
      const decay = edge.intensity * 0.015;
      
      let newIntensity = edge.intensity + inputFromNeighbors + selfInput + oscillation - decay;
      newIntensity = Math.max(0, Math.min(1, newIntensity));
      
      newEdges.set(edgeId, {
        id: edgeId,
        intensity: newIntensity,
        phase: edge.phase + newIntensity * 0.1,
        age: edge.age + 0.016
      });
    });
    
    networkRef.current.edges = newEdges;
    
    // 节点网络演化
    const newNodes = new Map(node);
    
    node.forEach((n, id) => {
      let input = 0;
      
      n.connections.forEach((neighborId: string) => {
        const neighbor = node.get(neighborId);
        if (neighbor) {
          input += neighbor.activation * 0.5;
        }
      });
      
      let newActivation = 1 / (1 + Math.exp(-(input * 5)));
      newActivation -= newActivation * 0.02;
      newActivation = Math.max(0, Math.min(1, newActivation));
      
      newNodes.set(id, { ...n, activation: newActivation });
    });
    
    networkRef.current.node = newNodes;
    
    // 计算统计
    let boundaryIntensity = 0;
    let boundaryPhaseSum = { cos: 0, sin: 0 };
    let boundaryCount = 0;
    
    newEdges.forEach(e => {
      boundaryIntensity += e.intensity;
      if (e.intensity > 0.1) {
        boundaryPhaseSum.cos += Math.cos(e.phase) * e.intensity;
        boundaryPhaseSum.sin += Math.sin(e.phase) * e.intensity;
        boundaryCount++;
      }
    });
    
    let nodeActivation = 0;
    let nodeCoherence = 0;
    let nodeCoherenceCount = 0;
    
    newNodes.forEach(n => {
      nodeActivation += n.activation;
      n.connections.forEach((neighborId: string) => {
        const neighbor = newNodes.get(neighborId);
        if (neighbor && n.activation > 0.1 && neighbor.activation > 0.1) {
          nodeCoherence += 1 - Math.abs(n.activation - neighbor.activation);
          nodeCoherenceCount++;
        }
      });
    });
    
    const boundaryCoherence = boundaryCount > 0
      ? Math.sqrt(boundaryPhaseSum.cos ** 2 + boundaryPhaseSum.sin ** 2) / boundaryCount
      : 0;
    
    nodeCoherence = nodeCoherenceCount > 0 ? nodeCoherence / nodeCoherenceCount : 0;
    
    return {
      boundaryStats: {
        avgIntensity: boundaryIntensity / newEdges.size,
        coherence: boundaryCoherence,
        patternStrength: boundaryCoherence * (boundaryCount / newEdges.size)
      },
      nodeStats: {
        avgActivation: nodeActivation / newNodes.size,
        coherence: nodeCoherence,
        patternStrength: nodeCoherence * (nodeActivation / newNodes.size)
      }
    };
  }, []);
  
  // 注入信息
  const injectInfo = useCallback((positions: { q: number; r: number }[]) => {
    if (!networkRef.current) return;
    
    const { boundary, node, edges } = networkRef.current;
    
    positions.forEach(pos => {
      const nodeId = `${pos.q},${pos.r}`;
      
      // 边界网络注入
      const boundaryNode = boundary.get(nodeId);
      if (boundaryNode) {
        boundaryNode.edges.forEach((edgeId: string) => {
          const edge = edges.get(edgeId);
          if (edge) {
            edges.set(edgeId, {
              ...edge,
              intensity: 0.9
            });
          }
        });
      }
      
      // 节点网络注入
      const nodeData = node.get(nodeId);
      if (nodeData) {
        node.set(nodeId, { ...nodeData, activation: 0.9 });
      }
    });
  }, []);
  
  // 绘制边界网络
  const drawBoundaryNetwork = useCallback(() => {
    const canvas = boundaryCanvasRef.current;
    if (!canvas || !networkRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { boundary, edges } = networkRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制边（信息载体）
    edges.forEach((edge, edgeId) => {
      const [node1Id, node2Id] = edgeId.split('-');
      const node1 = boundary.get(node1Id);
      const node2 = boundary.get(node2Id);
      
      if (node1 && node2) {
        const intensity = edge.intensity;
        
        // 发光效果
        if (intensity > 0.1) {
          const gradient = ctx.createLinearGradient(node1.x, node1.y, node2.x, node2.y);
          gradient.addColorStop(0, `rgba(100, 200, 255, ${intensity * 0.3})`);
          gradient.addColorStop(0.5, `rgba(150, 230, 255, ${intensity * 0.5})`);
          gradient.addColorStop(1, `rgba(100, 200, 255, ${intensity * 0.3})`);
          
          ctx.beginPath();
          ctx.moveTo(node1.x, node1.y);
          ctx.lineTo(node2.x, node2.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4 + intensity * 4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        
        // 基础线
        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.strokeStyle = `rgba(60, 100, 140, ${0.2 + intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // 绘制节点（交汇点）
    boundary.forEach((node, id) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, []);
  
  // 绘制节点网络
  const drawNodeNetwork = useCallback(() => {
    const canvas = nodeCanvasRef.current;
    if (!canvas || !networkRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { node } = networkRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制连接
    const drawn = new Set<string>();
    
    node.forEach((n, id) => {
      n.connections.forEach((neighborId: string) => {
        const edgeId = [id, neighborId].sort().join('-');
        if (drawn.has(edgeId)) return;
        drawn.add(edgeId);
        
        const neighbor = node.get(neighborId);
        if (neighbor) {
          const avgActivation = (n.activation + neighbor.activation) / 2;
          
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(neighbor.x, neighbor.y);
          ctx.strokeStyle = `rgba(100, 100, 140, ${0.2 + avgActivation * 0.3})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    });
    
    // 绘制节点（信息载体）
    node.forEach((n, id) => {
      const activation = n.activation;
      
      // 发光
      if (activation > 0.2) {
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 15);
        gradient.addColorStop(0, `rgba(255, 150, 100, ${activation * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      // 节点
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5 + activation * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${150 - activation * 100}, ${100 - activation * 50}, ${0.5 + activation * 0.5})`;
      ctx.fill();
    });
  }, []);
  
  // 绘制历史图表
  const drawChart = useCallback(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    // 清空
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);
    
    const { boundaryIntensity, nodeActivation, boundaryCoherence, nodeCoherence } = state.history;
    
    if (boundaryIntensity.length < 2) return;
    
    const maxLen = Math.max(boundaryIntensity.length, 100);
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(100, 100, 140, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - padding * 2) * i / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // 绘制边界网络曲线
    ctx.beginPath();
    ctx.strokeStyle = '#4dd0e1';
    ctx.lineWidth = 2;
    
    boundaryIntensity.forEach((v, i) => {
      const x = padding + (width - padding * 2) * i / maxLen;
      const y = height - padding - (height - padding * 2) * v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // 绘制节点网络曲线
    ctx.beginPath();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    
    nodeActivation.forEach((v, i) => {
      const x = padding + (width - padding * 2) * i / maxLen;
      const y = height - padding - (height - padding * 2) * v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // 图例
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#4dd0e1';
    ctx.fillText('边界网络', padding, 20);
    ctx.fillStyle = '#ff9800';
    ctx.fillText('节点网络', padding + 80, 20);
  }, [state.history]);
  
  // 动画循环
  const animate = useCallback(() => {
    if (!state.isRunning) return;
    
    const result = evolveNetworks();
    if (!result) return;
    
    drawBoundaryNetwork();
    drawNodeNetwork();
    
    setState(prev => ({
      ...prev,
      step: prev.step + 1,
      stats: {
        boundary: result.boundaryStats,
        node: result.nodeStats
      },
      history: {
        boundaryIntensity: [...prev.history.boundaryIntensity, result.boundaryStats.avgIntensity].slice(-100),
        nodeActivation: [...prev.history.nodeActivation, result.nodeStats.avgActivation].slice(-100),
        boundaryCoherence: [...prev.history.boundaryCoherence, result.boundaryStats.coherence].slice(-100),
        nodeCoherence: [...prev.history.nodeCoherence, result.nodeStats.coherence].slice(-100)
      }
    }));
    
    animationRef.current = requestAnimationFrame(animate);
  }, [state.isRunning, evolveNetworks, drawBoundaryNetwork, drawNodeNetwork]);
  
  // 开始/停止实验
  const toggleRun = useCallback(() => {
    if (state.isRunning) {
      cancelAnimationFrame(animationRef.current);
      setState(prev => ({ ...prev, isRunning: false }));
    } else {
      if (state.step === 0) {
        initNetworks();
        injectInfo([{ q: 0, r: 0 }, { q: 2, r: -1 }, { q: -2, r: 1 }]);
      }
      setState(prev => ({ ...prev, isRunning: true }));
    }
  }, [state.isRunning, state.step, initNetworks, injectInfo]);
  
  // 重置
  const reset = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    initNetworks();
    setState({
      isRunning: false,
      step: 0,
      boundaryData: { nodes: [], edges: [] },
      nodeData: { nodes: [], connections: [] },
      stats: {
        boundary: { avgIntensity: 0, coherence: 0, patternStrength: 0 },
        node: { avgActivation: 0, coherence: 0, patternStrength: 0 }
      },
      history: {
        boundaryIntensity: [],
        nodeActivation: [],
        boundaryCoherence: [],
        nodeCoherence: []
      }
    });
  }, [initNetworks]);
  
  // 注入
  const inject = useCallback(() => {
    const positions = [
      { q: Math.floor(Math.random() * 5) - 2, r: Math.floor(Math.random() * 5) - 2 },
      { q: Math.floor(Math.random() * 5) - 2, r: Math.floor(Math.random() * 5) - 2 }
    ];
    injectInfo(positions);
  }, [injectInfo]);
  
  // 启动动画
  useEffect(() => {
    if (state.isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [state.isRunning, animate]);
  
  // 绘制图表
  useEffect(() => {
    drawChart();
  }, [state.history, drawChart]);
  
  // 初始化
  useEffect(() => {
    initNetworks();
    drawBoundaryNetwork();
    drawNodeNetwork();
  }, [initNetworks, drawBoundaryNetwork, drawNodeNetwork]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-400 mb-6">
          边界网络 vs 节点网络 对比实验
        </h1>
        
        {/* 控制面板 */}
        <div className="flex gap-4 mb-6">
          <Button onClick={toggleRun} variant={state.isRunning ? 'destructive' : 'default'}>
            {state.isRunning ? '停止' : '开始'}
          </Button>
          <Button onClick={reset} variant="outline">重置</Button>
          <Button onClick={inject} variant="outline">注入信息</Button>
          <Badge variant="outline" className="flex items-center px-3">
            步数: {state.step}
          </Badge>
        </div>
        
        {/* 网络可视化 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 边界网络 */}
          <Card className="bg-gray-900/50 border-cyan-900/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">边界网络</CardTitle>
              <CardDescription className="text-gray-400">
                信息存储在边界上，节点只是交汇点
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={boundaryCanvasRef}
                width={400}
                height={400}
                className="w-full bg-black/50 rounded-lg"
              />
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">平均强度</div>
                  <div className="text-cyan-300 font-mono">
                    {state.stats.boundary.avgIntensity.toFixed(3)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">相干性</div>
                  <div className="text-cyan-300 font-mono">
                    {state.stats.boundary.coherence.toFixed(3)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">模式强度</div>
                  <div className="text-cyan-300 font-mono">
                    {state.stats.boundary.patternStrength.toFixed(3)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 节点网络 */}
          <Card className="bg-gray-900/50 border-orange-900/30">
            <CardHeader>
              <CardTitle className="text-orange-400">节点网络</CardTitle>
              <CardDescription className="text-gray-400">
                信息存储在节点中，边只是连接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={nodeCanvasRef}
                width={400}
                height={400}
                className="w-full bg-black/50 rounded-lg"
              />
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">平均激活</div>
                  <div className="text-orange-300 font-mono">
                    {state.stats.node.avgActivation.toFixed(3)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">相干性</div>
                  <div className="text-orange-300 font-mono">
                    {state.stats.node.coherence.toFixed(3)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">模式强度</div>
                  <div className="text-orange-300 font-mono">
                    {state.stats.node.patternStrength.toFixed(3)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 历史图表 */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">强度变化历史</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={chartCanvasRef}
              width={800}
              height={200}
              className="w-full rounded-lg"
            />
          </CardContent>
        </Card>
        
        {/* 假设说明 */}
        <Card className="mt-6 bg-gray-900/50 border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">实验假设</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
                <h4 className="font-medium text-cyan-300 mb-2">边界网络预测</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 更高的相干性（相位同步）</li>
                  <li>• 信息流动更稳定</li>
                  <li>• 可能涌现周期性模式</li>
                  <li>• 类似网格细胞的六边形激活</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-950/30 border border-orange-800/30">
                <h4 className="font-medium text-orange-300 mb-2">节点网络预测</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 信息快速衰减</li>
                  <li>• 较难形成同步模式</li>
                  <li>• 需要频繁重新注入</li>
                  <li>• 传统神经网络的行为</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-gray-300 text-sm">
                <strong>核心问题：</strong>
                信息应该存储在哪里？在节点中（传统），还是在边界上（你的梦）？
                这个实验试图验证：边界网络是否能涌现出更"智能"的行为模式。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
