'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MemoryStick, RefreshCw, Search, User, MessageSquare, Brain } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface VizMemoryNode {
  id: string;
  label: string;
  content: string;
  type: 'core' | 'consolidated' | 'episodic';
  importance: number;
  tags: string[];
}

interface VizMemoryEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
}

interface MemoryVisualizationData {
  nodes: VizMemoryNode[];
  edges: VizMemoryEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    coreCount: number;
    consolidatedCount: number;
    episodicCount: number;
  };
}

interface MemoryStatusData {
  success: boolean;
  identity: {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
  };
  layeredMemory: {
    stats: {
      core: { hasCreator: boolean; relationshipCount: number };
      consolidated: number;
      episodic: number;
    };
    coreMemories: Array<{ key: string; value: string }>;
    consolidatedCount: number;
    episodicCount: number;
  };
  visualization: MemoryVisualizationData;
}

// ─────────────────────────────────────────────────────────────────────
// 颜色映射
// ─────────────────────────────────────────────────────────────────────

const MEMORY_TYPE_COLORS = {
  core: '#f59e0b',       // 琥珀色 - 核心记忆
  consolidated: '#3b82f6', // 蓝色 - 巩固记忆
  episodic: '#10b981',   // 绿色 - 情景记忆
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
  nodes: VizMemoryNode[];
  edges: VizMemoryEdge[];
  width: number;
  height: number;
  onNodeClick?: (node: VizMemoryNode) => void;
  highlightedId?: string | null;
}

function MemoryGraphCanvas({ nodes, edges, width, height, onNodeClick, highlightedId }: MemoryGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Array<VizMemoryNode & { x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const [hoveredNode, setHoveredNode] = useState<VizMemoryNode | null>(null);
  const initializedRef = useRef(false);

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
        const idx = coreNodes.indexOf(node);
        angle = (idx / Math.max(coreNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
        radius = Math.min(width, height) * 0.12;
      } else if (node.type === 'consolidated') {
        const idx = consolidatedNodes.indexOf(node);
        angle = (idx / Math.max(consolidatedNodes.length, 1)) * Math.PI * 2;
        radius = Math.min(width, height) * 0.25;
      } else {
        const idx = episodicNodes.indexOf(node);
        angle = (idx / Math.max(episodicNodes.length, 1)) * Math.PI * 2 + Math.PI / 4;
        radius = Math.min(width, height) * 0.38;
      }

      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 15,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 15,
        vx: 0,
        vy: 0,
        radius: node.type === 'core' ? 16 : 12 + node.importance * 4,
      };
    });
    
    initializedRef.current = true;
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
        const force = 400 / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        canvasNodes[i].vx -= fx;
        canvasNodes[i].vy -= fy;
        canvasNodes[j].vx += fx;
        canvasNodes[j].vy += fy;
      }
    }

    // 连接引力
    for (const edge of edges) {
      const source = canvasNodes.find(n => n.id === edge.source);
      const target = canvasNodes.find(n => n.id === edge.target);

      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 50) * 0.002 * edge.strength;

        source.vx += (dx / dist) * force;
        source.vy += (dy / dist) * force;
        target.vx -= (dx / dist) * force;
        target.vy -= (dy / dist) * force;
      }
    }

    // 类型分层约束
    const padding = 20;
    for (const node of canvasNodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      let centerForce = 0.0003;
      if (node.type === 'core') centerForce = 0.001;
      else if (node.type === 'episodic') centerForce = -0.0002;

      node.vx += (dx / dist) * centerForce * dist;
      node.vy += (dy / dist) * centerForce * dist;

      node.vx *= 0.88;
      node.vy *= 0.88;

      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }, [edges, width, height]);

  // 绘制
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasNodes = nodesRef.current;

    ctx.clearRect(0, 0, width, height);

    // 背景
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    bgGradient.addColorStop(0, 'rgba(245, 158, 11, 0.06)');
    bgGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制边
    for (const edge of edges) {
      const source = canvasNodes.find(n => n.id === edge.source);
      const target = canvasNodes.find(n => n.id === edge.target);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(156, 163, 175, ${0.2 + edge.strength * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 绘制节点
    for (const node of canvasNodes) {
      const color = MEMORY_TYPE_COLORS[node.type];
      const radius = Math.max(node.radius, 8);
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
      ctx.lineWidth = isHighlighted ? 3 : 1.5;
      ctx.stroke();

      // 核心记忆标记
      if (node.type === 'core') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color + '50';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 标签
      if (node.type === 'core' || isHovered || isHighlighted) {
        ctx.font = 'bold 10px system-ui';
        const labelWidth = ctx.measureText(node.label).width + 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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

    for (const [type, color] of Object.entries(MEMORY_TYPE_COLORS)) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'left';
      ctx.fillText(MEMORY_TYPE_LABELS[type as keyof typeof MEMORY_TYPE_LABELS], legendX + 6, legendY + 3);

      legendX += 68;
    }
  }, [edges, width, height, highlightedId, hoveredNode]);

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

  useEffect(() => {
    initializedRef.current = false;
    initializeNodes();
  }, [nodes, initializeNodes]);

  // 鼠标交互
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvasNodes = nodesRef.current;
    let found: VizMemoryNode | null = null;

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
  const [selectedMemory, setSelectedMemory] = useState<VizMemoryNode | null>(null);
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 从API数据提取
  const memoryNodes: VizMemoryNode[] = data?.visualization?.nodes || [];
  const memoryEdges: VizMemoryEdge[] = data?.visualization?.edges || [];

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

  const vizStats = data?.visualization?.stats || {
    totalNodes: 0,
    totalEdges: 0,
    coreCount: 0,
    consolidatedCount: 0,
    episodicCount: 0,
  };

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
                  edges={memoryEdges}
                  width={280}
                  height={180}
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

              <ScrollArea className="h-[170px]">
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
                            {node.content.slice(0, 35)}...
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
                    {vizStats.coreCount}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">巩固</div>
                  <div className="font-bold text-lg" style={{ color: MEMORY_TYPE_COLORS.consolidated }}>
                    {vizStats.consolidatedCount}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">情景</div>
                  <div className="font-bold text-lg" style={{ color: MEMORY_TYPE_COLORS.episodic }}>
                    {vizStats.episodicCount}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总记忆节点</span>
                  <span className="font-medium">{vizStats.totalNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">记忆连接</span>
                  <span className="font-medium">{vizStats.totalEdges}</span>
                </div>
              </div>

              {data?.layeredMemory && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-xs font-medium">分层记忆系统</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">核心关系</span>
                    <span className="font-medium">{data.layeredMemory.stats?.core?.relationshipCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">巩固记忆</span>
                    <span className="font-medium">{data.layeredMemory.consolidatedCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">情景记忆</span>
                    <span className="font-medium">{data.layeredMemory.episodicCount || 0}</span>
                  </div>
                </div>
              )}

              {data?.identity && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-xs font-medium flex items-center gap-1">
                    <User className="w-3 h-3" />
                    身份特质
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.identity.traits.slice(0, 6).map((trait, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {trait.name} ({(trait.strength * 100).toFixed(0)}%)
                      </Badge>
                    ))}
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
