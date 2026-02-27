'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MemoryStick, Network, Sparkles, Clock, Tag, RefreshCw, Search, TrendingUp } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface MemoryNode {
  id: string;
  label: string;
  content: string;
  type: 'core' | 'consolidated' | 'episodic';
  importance: number;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
  tags: string[];
  connections: string[];
}

interface MemoryStats {
  core: {
    relationshipCount: number;
    lastUpdated: number;
  };
  consolidated: number;
  episodic: number;
}

interface MemoryStatusData {
  success: boolean;
  fullState?: {
    layeredMemory?: MemoryStats;
    conversationHistory?: Array<{
      role: string;
      content: string;
      timestamp?: number;
    }>;
  };
  memoryState?: {
    nodes: Array<{
      label: string;
      content: string;
      type: string;
      importance: number;
      accessCount: number;
      tags: string[];
    }>;
    experiences: Array<{
      content: string;
      emotion: string;
      importance: number;
      timestamp: number;
    }>;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 颜色映射
// ─────────────────────────────────────────────────────────────────────

const MEMORY_TYPE_COLORS = {
  core: '#f59e0b',      // 琥珀色 - 核心记忆
  consolidated: '#3b82f6', // 蓝色 - 巩固记忆
  episodic: '#10b981',  // 绿色 - 情景记忆
};

const MEMORY_TYPE_LABELS = {
  core: '核心记忆',
  consolidated: '巩固记忆',
  episodic: '情景记忆',
};

// ─────────────────────────────────────────────────────────────────────
// 记忆图谱画布组件
// ─────────────────────────────────────────────────────────────────────

interface MemoryGraphCanvasProps {
  nodes: MemoryNode[];
  width: number;
  height: number;
  onNodeClick?: (node: MemoryNode) => void;
  highlightedId?: string | null;
}

function MemoryGraphCanvas({ nodes, width, height, onNodeClick, highlightedId }: MemoryGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Array<MemoryNode & { x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const [hoveredNode, setHoveredNode] = useState<MemoryNode | null>(null);

  // 初始化节点位置
  const initializeNodes = useCallback(() => {
    if (nodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    // 按类型分组
    const coreNodes = nodes.filter(n => n.type === 'core');
    const consolidatedNodes = nodes.filter(n => n.type === 'consolidated');
    const episodicNodes = nodes.filter(n => n.type === 'episodic');

    nodesRef.current = nodes.map((node) => {
      let angle: number;
      let radius: number;

      // 核心记忆在中心，其他类型在外围
      if (node.type === 'core') {
        angle = (coreNodes.indexOf(node) / coreNodes.length) * Math.PI * 2 - Math.PI / 2;
        radius = Math.min(width, height) * 0.15;
      } else if (node.type === 'consolidated') {
        angle = (consolidatedNodes.indexOf(node) / consolidatedNodes.length) * Math.PI * 2;
        radius = Math.min(width, height) * 0.28;
      } else {
        angle = (episodicNodes.indexOf(node) / episodicNodes.length) * Math.PI * 2 + Math.PI / 4;
        radius = Math.min(width, height) * 0.38;
      }

      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: node.type === 'core' ? 18 : 14 + node.importance * 6,
      };
    });
  }, [nodes, width, height]);

  // 力导向布局
  const applyForces = useCallback(() => {
    const canvasNodes = nodesRef.current;
    if (canvasNodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    // 节点间斥力
    for (let i = 0; i < canvasNodes.length; i++) {
      for (let j = i + 1; j < canvasNodes.length; j++) {
        const dx = canvasNodes[j].x - canvasNodes[i].x;
        const dy = canvasNodes[j].y - canvasNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 600 / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        canvasNodes[i].vx -= fx;
        canvasNodes[i].vy -= fy;
        canvasNodes[j].vx += fx;
        canvasNodes[j].vy += fy;
      }
    }

    // 连接引力
    for (const node of canvasNodes) {
      for (const connId of node.connections) {
        const target = canvasNodes.find(n => n.id === connId);
        if (target) {
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 60) * 0.003;

          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }
      }
    }

    // 类型分层约束（核心记忆向心，情景记忆离心）
    for (const node of canvasNodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      let centerForce = 0.0005;
      if (node.type === 'core') {
        centerForce = 0.002;
      } else if (node.type === 'episodic') {
        centerForce = -0.0003;
      }

      node.vx += (dx / dist) * centerForce * dist;
      node.vy += (dy / dist) * centerForce * dist;

      // 阻尼
      node.vx *= 0.9;
      node.vy *= 0.9;

      // 更新位置
      node.x += node.vx;
      node.y += node.vy;

      // 边界约束
      const padding = 25;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }, [width, height]);

  // 绘制
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasNodes = nodesRef.current;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 背景渐变
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    bgGradient.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
    bgGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制连接线
    for (const node of canvasNodes) {
      for (const connId of node.connections) {
        const target = canvasNodes.find(n => n.id === connId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // 绘制节点
    for (const node of canvasNodes) {
      const color = MEMORY_TYPE_COLORS[node.type];
      const radius = node.radius;
      const isHighlighted = highlightedId === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // 光晕效果
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
      nodeGradient.addColorStop(1, color + 'aa');

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      // 边框
      ctx.strokeStyle = isHighlighted ? '#ffffff' : color;
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.stroke();

      // 核心记忆标记
      if (node.type === 'core') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color + '60';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 标签
      if (node.type === 'core' || isHovered || isHighlighted) {
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelWidth = ctx.measureText(node.label).width + 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(node.x - labelWidth / 2, node.y + radius + 4, labelWidth, 14);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(node.label, node.x, node.y + radius + 11);
      }
    }

    // 图例
    const legendY = 15;
    let legendX = 15;
    ctx.font = '10px system-ui';

    for (const [type, color] of Object.entries(MEMORY_TYPE_COLORS)) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'left';
      ctx.fillText(MEMORY_TYPE_LABELS[type as keyof typeof MEMORY_TYPE_LABELS], legendX + 8, legendY + 3);

      legendX += 75;
    }
  }, [width, height, highlightedId, hoveredNode]);

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

    const canvasNodes = nodesRef.current;
    let found: MemoryNode | null = null;

    for (const node of canvasNodes) {
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

interface MemoryGraphVisualizationProps {
  className?: string;
}

export function MemoryGraphVisualization({ className }: MemoryGraphVisualizationProps) {
  const [data, setData] = useState<MemoryStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'list' | 'stats'>('graph');
  const [searchQuery, setSearchQuery] = useState('');

  // 获取记忆数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/neuron-v6/memory-status');
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

  // 转换为可视化节点数据
  const memoryNodes: MemoryNode[] = [];

  // 从 memoryState.nodes 提取
  if (data?.memoryState?.nodes) {
    data.memoryState.nodes.forEach((node, i) => {
      memoryNodes.push({
        id: `node-${i}`,
        label: node.label,
        content: node.content,
        type: node.importance > 0.8 ? 'core' : node.importance > 0.5 ? 'consolidated' : 'episodic',
        importance: node.importance,
        accessCount: node.accessCount,
        lastAccessed: Date.now(),
        createdAt: Date.now() - i * 10000,
        tags: node.tags || [],
        connections: [],
      });
    });
  }

  // 从 memoryState.experiences 提取
  if (data?.memoryState?.experiences) {
    data.memoryState.experiences.forEach((exp, i) => {
      memoryNodes.push({
        id: `exp-${i}`,
        label: exp.content.slice(0, 20) + (exp.content.length > 20 ? '...' : ''),
        content: exp.content,
        type: 'episodic',
        importance: exp.importance,
        accessCount: 1,
        lastAccessed: exp.timestamp,
        createdAt: exp.timestamp,
        tags: [exp.emotion],
        connections: [],
      });
    });
  }

  // 统计信息
  const stats = {
    core: memoryNodes.filter(n => n.type === 'core').length,
    consolidated: memoryNodes.filter(n => n.type === 'consolidated').length,
    episodic: memoryNodes.filter(n => n.type === 'episodic').length,
    total: memoryNodes.length,
    avgImportance: memoryNodes.length > 0
      ? memoryNodes.reduce((sum, n) => sum + n.importance, 0) / memoryNodes.length
      : 0,
  };

  // 过滤记忆
  const filteredNodes = searchQuery
    ? memoryNodes.filter(n =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : memoryNodes;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MemoryStick className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">记忆图谱正在加载...</p>
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

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MemoryStick className="w-4 h-4 text-primary" />
            记忆图谱
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchData} className="h-7 w-7">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="graph" className="text-xs">图谱</TabsTrigger>
            <TabsTrigger value="list" className="text-xs">列表</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">统计</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-2">
            {memoryNodes.length > 0 ? (
              <div className="space-y-2">
                <MemoryGraphCanvas
                  nodes={memoryNodes}
                  width={280}
                  height={200}
                  onNodeClick={setSelectedMemory}
                  highlightedId={selectedMemory?.id}
                />
                {selectedMemory && (
                  <div className="text-xs p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: MEMORY_TYPE_COLORS[selectedMemory.type] }}
                      >
                        {MEMORY_TYPE_LABELS[selectedMemory.type]}
                      </Badge>
                      <span className="font-medium">{selectedMemory.label}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {selectedMemory.content}
                    </p>
                    {selectedMemory.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {selectedMemory.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">
                暂无记忆数据
                <p className="text-xs mt-1">开始对话后将自动形成记忆</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-2">
            <div className="space-y-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索记忆..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-muted rounded-md border-0 focus:ring-1 focus:ring-primary"
                />
              </div>

              <ScrollArea className="h-[190px]">
                <div className="space-y-1.5">
                  {filteredNodes.length > 0 ? (
                    filteredNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setSelectedMemory(node)}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: MEMORY_TYPE_COLORS[node.type] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{node.label}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {node.content.slice(0, 40)}...
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {node.importance.toFixed(1)}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      {searchQuery ? '未找到匹配的记忆' : '暂无记忆数据'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-2">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">核心</div>
                  <div className="font-bold text-lg" style={{ color: MEMORY_TYPE_COLORS.core }}>
                    {stats.core}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">巩固</div>
                  <div className="font-bold text-lg" style={{ color: MEMORY_TYPE_COLORS.consolidated }}>
                    {stats.consolidated}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">情景</div>
                  <div className="font-bold text-lg" style={{ color: MEMORY_TYPE_COLORS.episodic }}>
                    {stats.episodic}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总记忆数</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均重要性</span>
                  <span className="font-medium">{(stats.avgImportance * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* 分层记忆状态 */}
              {data?.fullState?.layeredMemory && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-xs font-medium">分层记忆系统</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">核心关系</span>
                    <span className="font-medium">{data.fullState.layeredMemory.core?.relationshipCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">巩固记忆</span>
                    <span className="font-medium">{data.fullState.layeredMemory.consolidated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">情景记忆</span>
                    <span className="font-medium">{data.fullState.layeredMemory.episodic || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
