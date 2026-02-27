'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network, Activity, Zap, Brain, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface VizNeuron {
  id: string;
  label: string;
  activation: number;
  type: 'percept' | 'concept' | 'emotion' | 'abstract' | 'trap';
}

interface VizSynapse {
  id: string;
  from: string;
  to: string;
  weight: number;
}

interface NetworkStats {
  neuronCount: number;
  synapseCount: number;
  avgActivation: number;
  highlyActiveCount: number;
  density: number;
  neuronsByType: Record<string, number>;
  entropy: number;
}

interface HebbianNetworkData {
  success: boolean;
  neurons: Array<{
    id: string;
    label: string;
    activation: number;
    type: string;
  }>;
  synapses: Array<{
    from: string;
    to: string;
    weight: number;
  }>;
  stats: NetworkStats;
  visualization: {
    neurons: VizNeuron[];
    synapses: VizSynapse[];
  };
  message: string;
}

// ─────────────────────────────────────────────────────────────────────
// 颜色映射
// ─────────────────────────────────────────────────────────────────────

const NEURON_TYPE_COLORS: Record<string, string> = {
  percept: '#3b82f6',   // 蓝色 - 感知
  concept: '#10b981',   // 绿色 - 概念
  emotion: '#ec4899',   // 粉色 - 情感
  abstract: '#8b5cf6',  // 紫色 - 抽象
  trap: '#ef4444',      // 红色 - 陷阱
};

const WEIGHT_COLORS = {
  positive: '#22c55e',  // 绿色 - 兴奋性连接
  negative: '#ef4444',  // 红色 - 抑制性连接
};

// ─────────────────────────────────────────────────────────────────────
// 网络可视化组件
// ─────────────────────────────────────────────────────────────────────

interface NetworkVizProps {
  neurons: VizNeuron[];
  synapses: VizSynapse[];
  width: number;
  height: number;
  onNodeClick?: (neuron: VizNeuron) => void;
  highlightedId?: string | null;
}

function NetworkCanvas({ neurons, synapses, width, height, onNodeClick, highlightedId }: NetworkVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Array<VizNeuron & { x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const [hoveredNode, setHoveredNode] = useState<VizNeuron | null>(null);
  const initializedRef = useRef(false);

  // 初始化节点位置
  const initializeNodes = useCallback(() => {
    if (neurons.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    // 按类型分组
    const trapNodes = neurons.filter(n => n.type === 'trap');
    const otherNodes = neurons.filter(n => n.type !== 'trap');

    nodesRef.current = neurons.map((neuron, index) => {
      let angle: number;
      let radius: number;

      // 陷阱节点在外圈，其他在中心
      if (neuron.type === 'trap') {
        const idx = trapNodes.indexOf(neuron);
        angle = (idx / Math.max(trapNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
        radius = Math.min(width, height) * 0.42;
      } else {
        const idx = otherNodes.indexOf(neuron);
        angle = (idx / Math.max(otherNodes.length, 1)) * Math.PI * 2;
        radius = Math.min(width, height) * (0.15 + Math.random() * 0.2);
      }

      return {
        ...neuron,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: neuron.type === 'trap' ? 6 : 8 + neuron.activation * 4,
      };
    });
    
    initializedRef.current = true;
  }, [neurons, width, height]);

  // 力导向布局
  const applyForces = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    // 节点间斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 300 / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // 连接引力
    for (const synapse of synapses) {
      const source = nodes.find(n => n.id === synapse.from);
      const target = nodes.find(n => n.id === synapse.to);

      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 60) * 0.003 * Math.abs(synapse.weight);

        source.vx += (dx / dist) * force;
        source.vy += (dy / dist) * force;
        target.vx -= (dx / dist) * force;
        target.vy -= (dy / dist) * force;
      }
    }

    // 中心引力
    const padding = 20;
    for (const node of nodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      let centerForce = 0.0005;
      if (node.type === 'trap') centerForce = -0.0001; // 陷阱向外推

      node.vx += (dx / dist) * centerForce * dist;
      node.vy += (dy / dist) * centerForce * dist;

      node.vx *= 0.85;
      node.vy *= 0.85;

      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }, [synapses, width, height]);

  // 绘制
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = nodesRef.current;

    ctx.clearRect(0, 0, width, height);

    // 背景
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    bgGradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制突触
    for (const synapse of synapses) {
      const source = nodes.find(n => n.id === synapse.from);
      const target = nodes.find(n => n.id === synapse.to);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        const color = synapse.weight > 0 ? WEIGHT_COLORS.positive : WEIGHT_COLORS.negative;
        ctx.strokeStyle = color + Math.floor(Math.min(Math.abs(synapse.weight), 1) * 80 + 20).toString(16).padStart(2, '0');
        ctx.lineWidth = Math.abs(synapse.weight) * 1.5;
        ctx.stroke();
      }
    }

    // 绘制节点
    for (const node of nodes) {
      const color = NEURON_TYPE_COLORS[node.type] || NEURON_TYPE_COLORS.concept;
      const radius = Math.max(node.radius, 5);
      const isHighlighted = highlightedId === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // 光晕
      const glowRadius = radius * (isHighlighted || isHovered ? 2.5 : 2);
      const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
      glowGradient.addColorStop(0, color + '40');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 节点主体
      const nodeGradient = ctx.createRadialGradient(
        node.x - radius * 0.3, node.y - radius * 0.3, 0,
        node.x, node.y, radius
      );
      nodeGradient.addColorStop(0, color);
      nodeGradient.addColorStop(1, color + 'bb');

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      ctx.strokeStyle = isHighlighted ? '#ffffff' : color;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();

      // 陷阱标记
      if (node.type === 'trap') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color + '60';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 高亮时显示标签
      if (isHighlighted || isHovered) {
        ctx.font = 'bold 10px system-ui';
        const labelWidth = ctx.measureText(node.label).width + 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(node.x - labelWidth / 2, node.y + radius + 3, labelWidth, 13);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y + radius + 10);
      }
    }

    // 图例
    const legendY = 12;
    let legendX = 10;
    ctx.font = '9px system-ui';

    for (const [type, color] of Object.entries(NEURON_TYPE_COLORS)) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'left';
      const typeLabels: Record<string, string> = {
        percept: '感知',
        concept: '概念',
        emotion: '情感',
        abstract: '抽象',
        trap: '陷阱',
      };
      ctx.fillText(typeLabels[type] || type, legendX + 6, legendY + 3);

      legendX += 50;
    }
  }, [synapses, width, height, highlightedId, hoveredNode]);

  // 动画循环
  useEffect(() => {
    if (!initializedRef.current) {
      initializeNodes();
    }

    const animate = () => {
      applyForces();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [initializeNodes, applyForces, draw]);

  // 重新初始化当神经元变化
  useEffect(() => {
    initializedRef.current = false;
    initializeNodes();
  }, [neurons, initializeNodes]);

  // 鼠标交互
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodes = nodesRef.current;
    let found: VizNeuron | null = null;

    for (const node of nodes) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist < node.radius + 5) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
    canvas.style.cursor = found ? 'pointer' : 'default';
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode && onNodeClick) {
      onNodeClick(hoveredNode);
    }
  }, [hoveredNode, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className="rounded-lg"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

interface HebbianNetworkVisualizationProps {
  className?: string;
}

export function HebbianNetworkVisualization({ className }: HebbianNetworkVisualizationProps) {
  const [data, setData] = useState<HebbianNetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<VizNeuron | null>(null);
  const [activeTab, setActiveTab] = useState<'network' | 'stats' | 'activity'>('network');

  // 获取网络数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/neuron-v6/neural-status');
      const json = await res.json();

      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 从API数据提取可视化的神经元和突触
  const vizNeurons: VizNeuron[] = data?.visualization?.neurons || [];
  const vizSynapses: VizSynapse[] = data?.visualization?.synapses || [];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Network className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">神经网络正在加载...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">
            <p>加载失败: {error}</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Hebbian 神经网络
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchData} className="h-7 w-7">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="network" className="text-xs">网络</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">统计</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">活跃</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-2">
            {vizNeurons.length > 0 ? (
              <div className="space-y-2">
                <NetworkCanvas
                  neurons={vizNeurons}
                  synapses={vizSynapses}
                  width={280}
                  height={200}
                  onNodeClick={setSelectedNeuron}
                  highlightedId={selectedNeuron?.id}
                />
                {selectedNeuron && (
                  <div className="text-xs p-2 bg-muted rounded-md">
                    <div className="font-medium">{selectedNeuron.label}</div>
                    <div className="text-muted-foreground flex gap-3">
                      <span>激活: {(selectedNeuron.activation * 100).toFixed(0)}%</span>
                      <span>类型: {selectedNeuron.type}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">
                暂无网络数据
                <p className="text-xs mt-1">开始对话后将自动形成神经元连接</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-2">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">神经元</div>
                  <div className="font-bold text-lg">{stats?.neuronCount || 0}</div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">突触</div>
                  <div className="font-bold text-lg">{stats?.synapseCount || 0}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均激活</span>
                  <span className="font-medium">{((stats?.avgActivation || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">网络密度</span>
                  <span className="font-medium">{((stats?.density || 0) * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">高激活神经元</span>
                  <span className="font-medium">{stats?.highlyActiveCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">网络熵</span>
                  <span className="font-medium">{stats?.entropy?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {stats?.neuronsByType && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium mb-2">类型分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(stats.neuronsByType).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type === 'trap' ? '陷阱' : type === 'concept' ? '概念' : type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-2">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {data?.neurons && data.neurons.length > 0 ? (
                  data.neurons.slice(0, 20).map((neuron) => (
                    <div
                      key={neuron.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: NEURON_TYPE_COLORS[neuron.type] || NEURON_TYPE_COLORS.concept }}
                      />
                      <div className="flex-1">
                        <div className="text-sm truncate">{neuron.label}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(neuron.activation * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    暂无活跃神经元
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
