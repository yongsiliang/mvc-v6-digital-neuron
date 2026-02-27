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

interface HebbianNeuron {
  id: string;
  label: string;
  activation: number;
  type: 'sensory' | 'concept' | 'emotion' | 'abstract';
  totalActivations: number;
}

interface HebbianSynapse {
  from: string;
  to: string;
  weight: number;
}

interface NetworkStats {
  totalNeurons: number;
  totalSynapses: number;
  averageActivation: number;
  highlyActiveCount: number;
  averageWeight: number;
  strongSynapseCount: number;
  density: string;
  neuronsByType: Record<string, number>;
  highlyActiveNeurons: Array<{
    id: string;
    label: string;
    activation: number;
  }>;
  strongSynapses: Array<{
    from: string;
    to: string;
    weight: number;
  }>;
}

interface HebbianNetworkData {
  success: boolean;
  timestamp: string;
  network: NetworkStats;
}

// ─────────────────────────────────────────────────────────────────────
// 颜色映射
// ─────────────────────────────────────────────────────────────────────

const NEURON_TYPE_COLORS: Record<string, string> = {
  sensory: '#3b82f6',   // 蓝色 - 感知
  concept: '#10b981',   // 绿色 - 概念
  emotion: '#ec4899',   // 粉色 - 情感
  abstract: '#8b5cf6',  // 紫色 - 抽象
  trap: '#ef4444',      // 红色 - 陷阱
  default: '#6b7280',   // 灰色 - 默认
};

const WEIGHT_COLORS = {
  positive: '#22c55e',  // 绿色 - 兴奋性连接
  negative: '#ef4444',  // 红色 - 抑制性连接
  neutral: '#6b7280',   // 灰色 - 弱连接
};

// ─────────────────────────────────────────────────────────────────────
// 网络可视化组件
// ─────────────────────────────────────────────────────────────────────

interface NetworkVizProps {
  neurons: HebbianNeuron[];
  synapses: HebbianSynapse[];
  width: number;
  height: number;
  onNodeClick?: (neuron: HebbianNeuron) => void;
  highlightedId?: string | null;
}

function NetworkCanvas({ neurons, synapses, width, height, onNodeClick, highlightedId }: NetworkVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Array<HebbianNeuron & { x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const [hoveredNode, setHoveredNode] = useState<HebbianNeuron | null>(null);

  // 初始化节点位置
  const initializeNodes = useCallback(() => {
    if (neurons.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    nodesRef.current = neurons.map((neuron, index) => {
      const angle = (index / neurons.length) * Math.PI * 2 - Math.PI / 2;
      const r = radius * (0.6 + Math.random() * 0.4);

      return {
        ...neuron,
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        radius: 12 + neuron.activation * 10 + Math.min(neuron.totalActivations * 0.5, 8),
      };
    });
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
        const force = 800 / (dist * dist);

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
        const force = (dist - 80) * 0.005 * Math.abs(synapse.weight);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // 向心引力和边界约束
    const padding = 30;
    for (const node of nodes) {
      // 向心力
      node.vx += (centerX - node.x) * 0.0008;
      node.vy += (centerY - node.y) * 0.0008;

      // 阻尼
      node.vx *= 0.92;
      node.vy *= 0.92;

      // 更新位置
      node.x += node.vx;
      node.y += node.vy;

      // 边界约束
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

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 背景渐变
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    bgGradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制突触连接
    for (const synapse of synapses) {
      const source = nodes.find(n => n.id === synapse.from);
      const target = nodes.find(n => n.id === synapse.to);

      if (source && target) {
        const absWeight = Math.abs(synapse.weight);
        const color = synapse.weight > 0 ? WEIGHT_COLORS.positive : WEIGHT_COLORS.negative;
        const opacity = Math.min(0.1 + absWeight * 0.5, 0.7);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = color + Math.round(opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1 + absWeight * 2;
        ctx.stroke();

        // 箭头指示方向（仅强连接）
        if (absWeight > 0.5) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const angle = Math.atan2(target.y - source.y, target.x - source.x);

          ctx.beginPath();
          ctx.moveTo(midX - Math.cos(angle - 0.5) * 6, midY - Math.sin(angle - 0.5) * 6);
          ctx.lineTo(midX, midY);
          ctx.lineTo(midX - Math.cos(angle + 0.5) * 6, midY - Math.sin(angle + 0.5) * 6);
          ctx.strokeStyle = color + 'aa';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // 绘制神经元
    for (const node of nodes) {
      const color = NEURON_TYPE_COLORS[node.type] || NEURON_TYPE_COLORS.default;
      const radius = node.radius;
      const isHighlighted = highlightedId === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // 光晕效果
      const glowRadius = radius * (isHighlighted || isHovered ? 3 : 2);
      const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
      glowGradient.addColorStop(0, color + '60');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 激活脉冲环
      if (node.activation > 0.3) {
        const pulseRadius = radius + 8 + Math.sin(Date.now() / 500) * 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2 * node.activation);
        ctx.strokeStyle = color + '40';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 节点主体
      const nodeGradient = ctx.createRadialGradient(
        node.x - radius * 0.3, node.y - radius * 0.3, 0,
        node.x, node.y, radius
      );
      nodeGradient.addColorStop(0, color);
      nodeGradient.addColorStop(1, color + 'aa');

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      // 边框
      ctx.strokeStyle = isHighlighted ? '#ffffff' : color;
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.stroke();

      // 标签（仅显示重要节点或悬浮节点）
      if (node.activation > 0.5 || isHovered || isHighlighted || node.totalActivations > 5) {
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 标签背景
        const labelWidth = ctx.measureText(node.label).width + 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(node.x - labelWidth / 2, node.y + radius + 4, labelWidth, 14);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(node.label, node.x, node.y + radius + 11);
      }
    }
  }, [synapses, width, height, highlightedId, hoveredNode]);

  // 动画循环
  useEffect(() => {
    initializeNodes();

    const animate = () => {
      applyForces();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [initializeNodes, applyForces, draw]);

  // 鼠标交互
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodes = nodesRef.current;
    let found: HebbianNeuron | null = null;

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

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
  const [selectedNeuron, setSelectedNeuron] = useState<HebbianNeuron | null>(null);
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
    // 每 30 秒刷新一次
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 转换为可视化数据
  const neurons: HebbianNeuron[] = data?.network.highlyActiveNeurons.map(n => ({
    id: n.id,
    label: n.label,
    activation: n.activation,
    type: 'concept' as const,
    totalActivations: Math.round(n.activation * 10),
  })) || [];

  const synapses: HebbianSynapse[] = data?.network.strongSynapses.map(s => ({
    from: s.from,
    to: s.to,
    weight: s.weight,
  })) || [];

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

  const stats = data?.network;

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
            {neurons.length > 0 ? (
              <div className="space-y-2">
                <NetworkCanvas
                  neurons={neurons}
                  synapses={synapses}
                  width={280}
                  height={200}
                  onNodeClick={setSelectedNeuron}
                  highlightedId={selectedNeuron?.id}
                />
                {selectedNeuron && (
                  <div className="text-xs p-2 bg-muted rounded-md">
                    <div className="font-medium">{selectedNeuron.label}</div>
                    <div className="text-muted-foreground">
                      激活度: {(selectedNeuron.activation * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">
                暂无网络数据
                <p className="text-xs mt-1">开始对话后将自动构建神经网络</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-2">
            <ScrollArea className="h-[220px]">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-md p-2">
                    <div className="text-xs text-muted-foreground">神经元总数</div>
                    <div className="font-bold text-lg">{stats?.totalNeurons || 0}</div>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <div className="text-xs text-muted-foreground">突触总数</div>
                    <div className="font-bold text-lg">{stats?.totalSynapses || 0}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">平均激活度</span>
                    <span className="font-medium">{((stats?.averageActivation || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">高激活神经元</span>
                    <span className="font-medium">{stats?.highlyActiveCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">平均突触权重</span>
                    <span className="font-medium">{(stats?.averageWeight || 0).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">强连接数</span>
                    <span className="font-medium">{stats?.strongSynapseCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">网络密度</span>
                    <span className="font-medium text-xs">{stats?.density || '0'}</span>
                  </div>
                </div>

                {/* 神经元类型分布 */}
                {stats?.neuronsByType && Object.keys(stats.neuronsByType).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">类型分布</div>
                    {Object.entries(stats.neuronsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs"
                          style={{ borderColor: NEURON_TYPE_COLORS[type] || NEURON_TYPE_COLORS.default }}>
                          {type}
                        </Badge>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="mt-2">
            <ScrollArea className="h-[220px]">
              <div className="space-y-2">
                {stats?.highlyActiveNeurons && stats.highlyActiveNeurons.length > 0 ? (
                  stats.highlyActiveNeurons.map((neuron, i) => (
                    <div
                      key={neuron.id + i}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setSelectedNeuron({
                        id: neuron.id,
                        label: neuron.label,
                        activation: neuron.activation,
                        type: 'concept',
                        totalActivations: 0,
                      })}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: NEURON_TYPE_COLORS.concept }}
                        />
                        <span className="truncate text-sm">{neuron.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${neuron.activation * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {(neuron.activation * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    暂无高激活神经元
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
