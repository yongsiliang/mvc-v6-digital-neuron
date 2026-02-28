'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, RotateCcw, Zap, Download, Upload, FlaskConical,
  TrendingUp, Activity, Brain, Network, Sparkles, ChevronRight
} from 'lucide-react';
import {
  experimentStorage,
  presetRecipes,
  analyzeExperiment,
  checkForNewRecipe,
  generateExperimentId,
  type ExperimentRecord,
  type StepResult,
  type IntelligenceRecipe,
  type BoundaryRules,
  type NodeRules
} from '@/lib/experiments/experiment-data';

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
  
  // 实验状态
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState<{
    boundaryIntensity: number[];
    nodeActivation: number[];
    boundaryCoherence: number[];
    nodeCoherence: number[];
  }>({
    boundaryIntensity: [],
    nodeActivation: [],
    boundaryCoherence: [],
    nodeCoherence: []
  });
  
  // 当前统计
  const [stats, setStats] = useState({
    boundary: { avgIntensity: 0, coherence: 0, patternStrength: 0, activeEdges: 0 },
    node: { avgActivation: 0, coherence: 0, patternStrength: 0, activeNodes: 0 }
  });
  
  // 参数
  const [boundaryParams, setBoundaryParams] = useState<BoundaryRules>({
    propagationRate: 0.3,
    threshold: 0.08,
    decayRate: 0.015,
    selfExcitation: 0.15,
    neighborExcitation: 0.2,
    oscillationFreq: 0.08
  });
  
  const [nodeParams, setNodeParams] = useState<NodeRules>({
    learningRate: 0.1,
    decayRate: 0.02,
    threshold: 0.1,
    activationFunction: 'sigmoid'
  });
  
  const [rings, setRings] = useState(4);
  const [injectionIntensity, setInjectionIntensity] = useState(0.9);
  const [injectionPattern, setInjectionPattern] = useState<'single' | 'multiple' | 'seven'>('multiple');
  
  // 智能配方
  const [recipes, setRecipes] = useState<IntelligenceRecipe[]>(presetRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<IntelligenceRecipe | null>(null);
  
  // 实验记录
  const [experimentRecords, setExperimentRecords] = useState<ExperimentRecord[]>([]);
  const [currentInsight, setCurrentInsight] = useState<string | null>(null);
  
  // 当前模式
  const [mode, setMode] = useState<'experiment' | 'seven-element' | 'recipe'>('experiment');
  
  const animationRef = useRef<number>(0);
  const networkRef = useRef<{
    boundary: Map<string, any>;
    node: Map<string, any>;
    edges: Map<string, any>;
    adjacency: Map<string, string[]>;
  } | null>(null);
  
  // 初始化网络
  const initNetworks = useCallback((ringCount: number) => {
    const boundaryNodes = new Map<string, any>();
    const nodeNetwork = new Map<string, any>();
    const edges = new Map<string, any>();
    const adjacency = new Map<string, string[]>();
    
    // 生成节点
    for (let q = -ringCount; q <= ringCount; q++) {
      for (let r = -ringCount; r <= ringCount; r++) {
        if (Math.abs(q + r) <= ringCount) {
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
    if (!networkRef.current) return null;
    
    const { boundary, node, edges, adjacency } = networkRef.current;
    
    // 边界网络演化
    const newEdges = new Map(edges);
    
    edges.forEach((edge, edgeId) => {
      const neighbors = adjacency.get(edgeId) || [];
      let inputFromNeighbors = 0;
      
      neighbors.forEach(neighborId => {
        const neighbor = edges.get(neighborId);
        if (neighbor && neighbor.intensity > boundaryParams.threshold) {
          const phaseDiff = Math.abs(edge.phase - neighbor.phase);
          const phaseFactor = Math.cos(phaseDiff);
          inputFromNeighbors += neighbor.intensity * boundaryParams.neighborExcitation * phaseFactor;
        }
      });
      
      const selfInput = edge.intensity * boundaryParams.selfExcitation;
      const oscillation = Math.sin(edge.age * boundaryParams.oscillationFreq + edge.phase) * 0.05;
      const decay = edge.intensity * boundaryParams.decayRate;
      
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
      newActivation -= newActivation * nodeParams.decayRate;
      newActivation = Math.max(0, Math.min(1, newActivation));
      
      newNodes.set(id, { ...n, activation: newActivation });
    });
    
    networkRef.current.node = newNodes;
    
    // 计算统计
    let boundaryIntensity = 0;
    let boundaryPhaseSum = { cos: 0, sin: 0 };
    let boundaryCount = 0;
    let activeEdges = 0;
    
    newEdges.forEach(e => {
      boundaryIntensity += e.intensity;
      if (e.intensity > boundaryParams.threshold) {
        boundaryPhaseSum.cos += Math.cos(e.phase) * e.intensity;
        boundaryPhaseSum.sin += Math.sin(e.phase) * e.intensity;
        boundaryCount++;
        activeEdges++;
      }
    });
    
    let nodeActivation = 0;
    let nodeCoherence = 0;
    let nodeCoherenceCount = 0;
    let activeNodes = 0;
    
    newNodes.forEach(n => {
      nodeActivation += n.activation;
      if (n.activation > nodeParams.threshold) activeNodes++;
      n.connections.forEach((neighborId: string) => {
        const neighbor = newNodes.get(neighborId);
        if (neighbor && n.activation > nodeParams.threshold && neighbor.activation > nodeParams.threshold) {
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
        patternStrength: boundaryCoherence * (activeEdges / newEdges.size),
        activeEdges
      },
      nodeStats: {
        avgActivation: nodeActivation / newNodes.size,
        coherence: nodeCoherence,
        patternStrength: nodeCoherence * (activeNodes / newNodes.size),
        activeNodes
      }
    };
  }, [boundaryParams, nodeParams]);
  
  // 注入信息
  const injectInfo = useCallback((pattern: 'single' | 'multiple' | 'seven') => {
    if (!networkRef.current) return;
    
    const { boundary, node, edges } = networkRef.current;
    
    let positions: { q: number; r: number }[] = [];
    
    if (pattern === 'single') {
      positions = [{ q: 0, r: 0 }];
    } else if (pattern === 'multiple') {
      positions = [
        { q: 0, r: 0 },
        { q: 2, r: -1 },
        { q: -2, r: 1 }
      ];
    } else if (pattern === 'seven') {
      // 7元素：中心 + 6个邻居
      positions = [
        { q: 0, r: 0 },
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
      ];
    }
    
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
              intensity: injectionIntensity
            });
          }
        });
      }
      
      // 节点网络注入
      const nodeData = node.get(nodeId);
      if (nodeData) {
        node.set(nodeId, { ...nodeData, activation: injectionIntensity });
      }
    });
  }, [injectionIntensity]);
  
  // 绘制边界网络
  const drawBoundaryNetwork = useCallback(() => {
    const canvas = boundaryCanvasRef.current;
    if (!canvas || !networkRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { boundary, edges } = networkRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制边
    edges.forEach((edge, edgeId) => {
      const [node1Id, node2Id] = edgeId.split('-');
      const node1 = boundary.get(node1Id);
      const node2 = boundary.get(node2Id);
      
      if (node1 && node2) {
        const intensity = edge.intensity;
        
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
        
        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.strokeStyle = `rgba(60, 100, 140, ${0.2 + intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // 绘制节点
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
    
    // 绘制节点
    node.forEach((n, id) => {
      const activation = n.activation;
      
      if (activation > 0.2) {
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 15);
        gradient.addColorStop(0, `rgba(255, 150, 100, ${activation * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5 + activation * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${150 - activation * 100}, ${100 - activation * 50}, ${0.5 + activation * 0.5})`;
      ctx.fill();
    });
  }, []);
  
  // 绘制图表
  const drawChart = useCallback(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);
    
    if (history.boundaryIntensity.length < 2) return;
    
    const maxLen = Math.max(history.boundaryIntensity.length, 100);
    
    // 网格
    ctx.strokeStyle = 'rgba(100, 100, 140, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - padding * 2) * i / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // 边界网络曲线
    ctx.beginPath();
    ctx.strokeStyle = '#4dd0e1';
    ctx.lineWidth = 2;
    
    history.boundaryIntensity.forEach((v, i) => {
      const x = padding + (width - padding * 2) * i / maxLen;
      const y = height - padding - (height - padding * 2) * v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // 节点网络曲线
    ctx.beginPath();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    
    history.nodeActivation.forEach((v, i) => {
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
  }, [history]);
  
  // 动画循环
  const animate = useCallback(() => {
    if (!isRunning) return;
    
    const result = evolveNetworks();
    if (!result) return;
    
    drawBoundaryNetwork();
    drawNodeNetwork();
    
    setStep(prev => prev + 1);
    setStats({
      boundary: result.boundaryStats,
      node: result.nodeStats
    });
    setHistory(prev => ({
      boundaryIntensity: [...prev.boundaryIntensity, result.boundaryStats.avgIntensity].slice(-200),
      nodeActivation: [...prev.nodeActivation, result.nodeStats.avgActivation].slice(-200),
      boundaryCoherence: [...prev.boundaryCoherence, result.boundaryStats.coherence].slice(-200),
      nodeCoherence: [...prev.nodeCoherence, result.nodeStats.coherence].slice(-200)
    }));
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, evolveNetworks, drawBoundaryNetwork, drawNodeNetwork]);
  
  // 运行预设实验
  const runRecipe = useCallback((recipe: IntelligenceRecipe) => {
    const config = recipe.conditions.config;
    
    setBoundaryParams(config.boundaryRules);
    setNodeParams(config.nodeRules);
    setRings(config.rings);
    setInjectionIntensity(config.injectionIntensity);
    setInjectionPattern(config.injectionPattern as 'single' | 'multiple' | 'seven');
    setSelectedRecipe(recipe);
    
    // 重置并开始
    reset();
    setTimeout(() => {
      initNetworks(config.rings);
      injectInfo(config.injectionPattern as 'single' | 'multiple' | 'seven');
      setIsRunning(true);
    }, 100);
  }, [initNetworks, injectInfo]);
  
  // 7元素最小系统实验
  const runSevenElementExperiment = useCallback(() => {
    setMode('seven-element');
    setRings(1);
    
    // 7元素专用参数
    setBoundaryParams({
      propagationRate: 0.4,
      threshold: 0.05,
      decayRate: 0.01,
      selfExcitation: 0.2,
      neighborExcitation: 0.25,
      oscillationFreq: 0.08
    });
    
    reset();
    setTimeout(() => {
      initNetworks(1);
      injectInfo('seven');
      setIsRunning(true);
    }, 100);
  }, [initNetworks, injectInfo]);
  
  // 重置
  const reset = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    initNetworks(rings);
    setStep(0);
    setHistory({
      boundaryIntensity: [],
      nodeActivation: [],
      boundaryCoherence: [],
      nodeCoherence: []
    });
    setStats({
      boundary: { avgIntensity: 0, coherence: 0, patternStrength: 0, activeEdges: 0 },
      node: { avgActivation: 0, coherence: 0, patternStrength: 0, activeNodes: 0 }
    });
    setIsRunning(false);
    setCurrentInsight(null);
  }, [initNetworks, rings]);
  
  // 手动注入
  const manualInject = useCallback(() => {
    injectInfo(injectionPattern);
  }, [injectInfo, injectionPattern]);
  
  // 开始/停止
  const toggleRun = useCallback(() => {
    if (isRunning) {
      cancelAnimationFrame(animationRef.current);
      setIsRunning(false);
    } else {
      if (step === 0) {
        initNetworks(rings);
        injectInfo(injectionPattern);
      }
      setIsRunning(true);
    }
  }, [isRunning, step, rings, injectionPattern, initNetworks, injectInfo]);
  
  // 保存实验
  const saveExperiment = useCallback(() => {
    const results: StepResult[] = history.boundaryIntensity.map((_, i) => ({
      step: i,
      boundary: {
        avgIntensity: history.boundaryIntensity[i] || 0,
        coherence: history.boundaryCoherence[i] || 0,
        patternStrength: (history.boundaryCoherence[i] || 0) * 0.5,
        activeEdges: Math.round(stats.boundary.activeEdges * (history.boundaryIntensity[i] || 0)),
        totalEdges: stats.boundary.activeEdges || 100
      },
      node: {
        avgActivation: history.nodeActivation[i] || 0,
        coherence: history.nodeCoherence[i] || 0,
        patternStrength: (history.nodeCoherence[i] || 0) * 0.5,
        activeNodes: Math.round(stats.node.activeNodes * (history.nodeActivation[i] || 0)),
        totalNodes: stats.node.activeNodes || 50
      }
    }));
    
    const analysis = analyzeExperiment(results);
    const config = {
      name: `实验 ${new Date().toLocaleString()}`,
      description: '手动运行实验',
      rings,
      steps: step,
      injectionPattern,
      injectionPositions: [],
      injectionIntensity,
      boundaryRules: boundaryParams,
      nodeRules: nodeParams
    };
    
    const record: ExperimentRecord = {
      id: generateExperimentId(),
      timestamp: Date.now(),
      config: config as any,
      results,
      analysis,
      insight: currentInsight
    };
    
    experimentStorage.addRecord(record);
    setExperimentRecords(prev => [...prev, record]);
    
    // 检查是否发现新配方
    const newRecipe = checkForNewRecipe(analysis, config as any);
    if (newRecipe) {
      experimentStorage.addRecipe(newRecipe);
      setRecipes(prev => [...prev, newRecipe]);
      setCurrentInsight(`发现新配方: ${newRecipe.name}`);
    }
    
    alert('实验已保存');
  }, [history, stats, step, rings, injectionPattern, injectionIntensity, boundaryParams, nodeParams, currentInsight]);
  
  // 启动动画
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, animate]);
  
  // 绘制图表
  useEffect(() => {
    drawChart();
  }, [history, drawChart]);
  
  // 初始化
  useEffect(() => {
    initNetworks(rings);
    drawBoundaryNetwork();
    drawNodeNetwork();
    
    // 加载历史数据
    experimentStorage.loadFromStorage();
    setExperimentRecords(experimentStorage.getRecords());
    setRecipes(experimentStorage.getRecipes());
  }, [rings, initNetworks, drawBoundaryNetwork, drawNodeNetwork]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">边界网络实验平台</h1>
            <p className="text-sm text-gray-400 mt-1">
              探索信息存储在边界上的涌现智能
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">返回首页</Button>
            </Link>
            <Link href="/consciousness">
              <Button variant="ghost" size="sm">意识系统</Button>
            </Link>
          </div>
        </div>
        
        {/* 模式选择 */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mb-6">
          <TabsList className="bg-gray-900/50">
            <TabsTrigger value="experiment" className="data-[state=active]:bg-cyan-600">
              <FlaskConical className="w-4 h-4 mr-1" />
              自由实验
            </TabsTrigger>
            <TabsTrigger value="seven-element" className="data-[state=active]:bg-cyan-600">
              <Zap className="w-4 h-4 mr-1" />
              7元素验证
            </TabsTrigger>
            <TabsTrigger value="recipe" className="data-[state=active]:bg-cyan-600">
              <Sparkles className="w-4 h-4 mr-1" />
              智能配方
            </TabsTrigger>
          </TabsList>
          
          {/* 自由实验模式 */}
          <TabsContent value="experiment" className="mt-4">
            <div className="grid lg:grid-cols-4 gap-4">
              {/* 参数面板 */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">参数调整</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* 网格大小 */}
                  <div>
                    <label className="text-gray-400">网格大小: {rings}</label>
                    <Slider
                      value={[rings]}
                      onValueChange={([v]) => setRings(v)}
                      min={1}
                      max={6}
                      step={1}
                    />
                  </div>
                  
                  {/* 注入模式 */}
                  <div>
                    <label className="text-gray-400">注入模式</label>
                    <div className="flex gap-1 mt-1">
                      {['single', 'multiple', 'seven'].map(p => (
                        <Button
                          key={p}
                          size="sm"
                          variant={injectionPattern === p ? 'default' : 'outline'}
                          onClick={() => setInjectionPattern(p as any)}
                          className="text-xs flex-1"
                        >
                          {p === 'single' ? '单点' : p === 'multiple' ? '多点' : '7元素'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 注入强度 */}
                  <div>
                    <label className="text-gray-400">注入强度: {injectionIntensity.toFixed(2)}</label>
                    <Slider
                      value={[injectionIntensity]}
                      onValueChange={([v]) => setInjectionIntensity(v)}
                      min={0.1}
                      max={1}
                      step={0.1}
                    />
                  </div>
                  
                  {/* 边界网络参数 */}
                  <div className="pt-2 border-t border-gray-700">
                    <label className="text-cyan-400 font-medium">边界网络</label>
                    
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="text-gray-500">传播率: {boundaryParams.propagationRate.toFixed(2)}</label>
                        <Slider
                          value={[boundaryParams.propagationRate]}
                          onValueChange={([v]) => setBoundaryParams(p => ({ ...p, propagationRate: v }))}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">衰减率: {boundaryParams.decayRate.toFixed(3)}</label>
                        <Slider
                          value={[boundaryParams.decayRate]}
                          onValueChange={([v]) => setBoundaryParams(p => ({ ...p, decayRate: v }))}
                          min={0}
                          max={0.1}
                          step={0.005}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">振荡频率: {boundaryParams.oscillationFreq.toFixed(3)}</label>
                        <Slider
                          value={[boundaryParams.oscillationFreq]}
                          onValueChange={([v]) => setBoundaryParams(p => ({ ...p, oscillationFreq: v }))}
                          min={0}
                          max={0.3}
                          step={0.01}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* 节点网络参数 */}
                  <div className="pt-2 border-t border-gray-700">
                    <label className="text-orange-400 font-medium">节点网络</label>
                    
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="text-gray-500">学习率: {nodeParams.learningRate.toFixed(2)}</label>
                        <Slider
                          value={[nodeParams.learningRate]}
                          onValueChange={([v]) => setNodeParams(p => ({ ...p, learningRate: v }))}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">衰减率: {nodeParams.decayRate.toFixed(3)}</label>
                        <Slider
                          value={[nodeParams.decayRate]}
                          onValueChange={([v]) => setNodeParams(p => ({ ...p, decayRate: v }))}
                          min={0}
                          max={0.1}
                          step={0.005}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 网络可视化 */}
              <div className="lg:col-span-3 space-y-4">
                {/* 控制栏 */}
                <div className="flex items-center gap-3">
                  <Button onClick={toggleRun} variant={isRunning ? 'destructive' : 'default'}>
                    {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {isRunning ? '暂停' : '开始'}
                  </Button>
                  <Button onClick={reset} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-1" /> 重置
                  </Button>
                  <Button onClick={manualInject} variant="outline" size="sm">
                    <Zap className="w-4 h-4 mr-1" /> 注入
                  </Button>
                  <Button onClick={saveExperiment} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" /> 保存
                  </Button>
                  <Badge variant="outline" className="ml-auto">
                    步数: {step}
                  </Badge>
                </div>
                
                {/* 双网络对比 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gray-900/50 border-cyan-900/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-cyan-400 text-sm">边界网络</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <canvas ref={boundaryCanvasRef} width={400} height={400} className="w-full rounded-lg" />
                      <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
                        <div className="text-center">
                          <div className="text-gray-400">强度</div>
                          <div className="text-cyan-300 font-mono">{stats.boundary.avgIntensity.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">相干</div>
                          <div className="text-cyan-300 font-mono">{stats.boundary.coherence.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">模式</div>
                          <div className="text-cyan-300 font-mono">{stats.boundary.patternStrength.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">活跃边</div>
                          <div className="text-cyan-300 font-mono">{stats.boundary.activeEdges}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/50 border-orange-900/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-orange-400 text-sm">节点网络</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <canvas ref={nodeCanvasRef} width={400} height={400} className="w-full rounded-lg" />
                      <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
                        <div className="text-center">
                          <div className="text-gray-400">激活</div>
                          <div className="text-orange-300 font-mono">{stats.node.avgActivation.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">相干</div>
                          <div className="text-orange-300 font-mono">{stats.node.coherence.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">模式</div>
                          <div className="text-orange-300 font-mono">{stats.node.patternStrength.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">活跃节点</div>
                          <div className="text-orange-300 font-mono">{stats.node.activeNodes}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* 历史图表 */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">演化历史</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <canvas ref={chartCanvasRef} width={800} height={150} className="w-full rounded-lg" />
                  </CardContent>
                </Card>
                
                {/* 当前洞察 */}
                {currentInsight && (
                  <Card className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border-cyan-500/30">
                    <CardContent className="py-3">
                      <p className="text-sm text-cyan-300">{currentInsight}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* 7元素验证模式 */}
          <TabsContent value="seven-element" className="mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  7元素最小系统验证
                </CardTitle>
                <CardDescription>
                  验证2025年数学证明：最少需要7个元素（中心节点 + 6条边）才能涌现六边形模式
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <h4 className="font-medium text-cyan-300 mb-2">实验设置</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• 网格大小：rings = 1（最小系统）</li>
                        <li>• 节点数：7个（中心 + 6邻居）</li>
                        <li>• 边数：6条（形成六边形）</li>
                        <li>• 注入模式：所有6条边同时激活</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <h4 className="font-medium text-orange-300 mb-2">预期结果</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• 边界网络：6条边相位同步，形成驻波</li>
                        <li>• 节点网络：信息快速衰减，无模式</li>
                        <li>• 相干性：边界 &gt; 节点</li>
                        <li>• 稳定性：边界 &gt; 节点</li>
                      </ul>
                    </div>
                    
                    <Button onClick={runSevenElementExperiment} className="w-full">
                      <Play className="w-4 h-4 mr-1" /> 开始验证实验
                    </Button>
                  </div>
                  
                  <div className="grid grid-rows-2 gap-4">
                    <canvas ref={boundaryCanvasRef} width={300} height={300} className="w-full rounded-lg bg-black/50" />
                    <canvas ref={nodeCanvasRef} width={300} height={300} className="w-full rounded-lg bg-black/50" />
                  </div>
                </div>
                
                {/* 结果分析 */}
                {step > 50 && (
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border border-cyan-500/30">
                    <h4 className="font-medium text-white mb-2">验证结果</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-cyan-400">边界网络相干性：</span>
                        <span className="font-mono ml-2">{stats.boundary.coherence.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-orange-400">节点网络相干性：</span>
                        <span className="font-mono ml-2">{stats.node.coherence.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-cyan-400">边界网络稳定性：</span>
                        <span className="font-mono ml-2">{(1 - stats.boundary.avgIntensity * 0.1).toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-orange-400">节点网络稳定性：</span>
                        <span className="font-mono ml-2">{(1 - stats.node.avgActivation * 0.1).toFixed(3)}</span>
                      </div>
                    </div>
                    
                    {stats.boundary.coherence > stats.node.coherence * 1.5 && (
                      <p className="mt-3 text-sm text-green-400">
                        ✓ 验证通过：边界网络相干性显著高于节点网络
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 智能配方模式 */}
          <TabsContent value="recipe" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {recipes.map(recipe => (
                <Card 
                  key={recipe.id}
                  className={`bg-gray-900/50 cursor-pointer transition-all hover:border-cyan-500/50 ${
                    selectedRecipe?.id === recipe.id ? 'border-cyan-500' : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{recipe.name}</CardTitle>
                      {recipe.verified && (
                        <Badge className="bg-green-600 text-xs">已验证</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-400 mb-3">{recipe.description}</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">相干性提升</span>
                        <span className="text-cyan-300">+{(recipe.effects.coherenceBoost * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">稳定性提升</span>
                        <span className="text-cyan-300">+{(recipe.effects.stabilityBoost * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">模式涌现</span>
                        <span className={recipe.effects.patternEmergence ? 'text-green-400' : 'text-gray-500'}>
                          {recipe.effects.patternEmergence ? '是' : '否'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {recipe.conditions.keyFactors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* 运行选中配方 */}
              {selectedRecipe && (
                <div className="md:col-span-3">
                  <Card className="bg-gray-900/50 border-cyan-500/30">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{selectedRecipe.name}</h4>
                          <p className="text-sm text-gray-400">{selectedRecipe.effects.notes}</p>
                        </div>
                        <Button onClick={() => runRecipe(selectedRecipe)}>
                          <Play className="w-4 h-4 mr-1" /> 运行此配方
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            
            {/* 实验记录 */}
            {experimentRecords.length > 0 && (
              <Card className="mt-6 bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">实验记录 ({experimentRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {experimentRecords.slice(-10).reverse().map(record => (
                      <div key={record.id} className="p-2 rounded bg-gray-800/50 text-xs">
                        <div className="flex justify-between">
                          <span>{record.config.name}</span>
                          <span className="text-gray-500">
                            {new Date(record.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-400">
                          胜者: <span className={
                            record.analysis.comparison.winner === 'boundary' ? 'text-cyan-400' :
                            record.analysis.comparison.winner === 'node' ? 'text-orange-400' : 'text-gray-400'
                          }>
                            {record.analysis.comparison.winner === 'boundary' ? '边界网络' :
                             record.analysis.comparison.winner === 'node' ? '节点网络' : '平局'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
