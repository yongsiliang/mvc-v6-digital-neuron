'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  KnowledgeDomain,
  ConceptNode,
  ConceptEdge,
} from '@/lib/neuron-v6/knowledge-graph';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface KnowledgeGraphData {
  domains: KnowledgeDomain[];
  concepts: ConceptNode[];
  edges: ConceptEdge[];
  stats: {
    totalConcepts: number;
    totalEdges: number;
    totalDomains: number;
    averageConnectivity: number;
    strongestConnection: number;
    mostConnectedConcept: string | null;
    domainDistribution: Record<string, number>;
  };
  lastUpdated: number;
}

interface KnowledgeGraphPanelProps {
  data?: KnowledgeGraphData;
}

// ─────────────────────────────────────────────────────────────────────
// 图谱可视化组件
// ─────────────────────────────────────────────────────────────────────

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  domain: string;
  domainColor: string;
  size: number;
  understanding: number;
  importance: number;
  activation: number;
  fixed?: boolean;
}

interface Link {
  id: string;
  source: string;
  target: string;
  strength: number;
  label: string;
}

function KnowledgeGraphVisualization({
  concepts,
  edges,
  domains,
}: {
  concepts: ConceptNode[];
  edges: ConceptEdge[];
  domains: KnowledgeDomain[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // 初始化节点和链接
  useEffect(() => {
    if (concepts.length === 0) return;

    const domainMap = new Map(domains.map(d => [d.id, d]));
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    const newNodes: Node[] = concepts.map((concept, index) => {
      const domain = domainMap.get(concept.domainId);
      const angle = (index / concepts.length) * 2 * Math.PI;
      
      return {
        id: concept.id,
        label: concept.name,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        domain: concept.domainId,
        domainColor: domain?.color || '#666666',
        size: 8 + concept.importance * 12 + concept.connectionCount * 1.5,
        understanding: concept.understanding,
        importance: concept.importance,
        activation: concept.activation,
      };
    });

    const newLinks: Link[] = edges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      strength: edge.strength,
      label: '',
    }));

    setNodes(newNodes);
    setLinks(newLinks);
  }, [concepts, edges, domains]);

  // 力导向布局模拟
  const simulate = useCallback(() => {
    if (nodes.length === 0) return;

    const alpha = 0.1;
    const centerX = 400;
    const centerY = 300;

    // 中心引力
    nodes.forEach(node => {
      if (!node.fixed) {
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;
      }
    });

    // 斥力（节点间）
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (50 * 50) / (distance * distance);
        
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // 引力（链接）
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - 100) * 0.01 * link.strength;
        
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        sourceNode.vx += fx;
        sourceNode.vy += fy;
        targetNode.vx -= fx;
        targetNode.vy -= fy;
      }
    });

    // 更新位置
    nodes.forEach(node => {
      if (!node.fixed) {
        node.vx *= 0.9; // 阻尼
        node.vy *= 0.9;
        node.x += node.vx * alpha;
        node.y += node.vy * alpha;
        
        // 边界约束
        node.x = Math.max(50, Math.min(750, node.x));
        node.y = Math.max(50, Math.min(550, node.y));
      }
    });
  }, [nodes, links]);

  // 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      simulate();
      
      // 清空画布
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 800, 600);

      // 绘制链接
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = `rgba(100, 100, 100, ${link.strength * 0.5})`;
          ctx.lineWidth = link.strength * 2;
          ctx.stroke();
        }
      });

      // 绘制节点
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        
        // 发光效果
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 8, 0, 2 * Math.PI);
          ctx.fillStyle = `${node.domainColor}33`;
          ctx.fill();
        }

        // 节点主体
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        
        // 渐变填充
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size
        );
        gradient.addColorStop(0, node.domainColor);
        gradient.addColorStop(1, `${node.domainColor}88`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = isSelected ? '#ffffff' : node.domainColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // 激活度指示器
        if (node.activation > 0.5) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 3, 0, 2 * Math.PI * node.activation);
          ctx.strokeStyle = `${node.domainColor}aa`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 标签（仅显示重要或悬停的节点）
        if (node.importance > 0.7 || isHovered || isSelected) {
          ctx.font = '12px system-ui';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + node.size + 16);
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, links, simulate, hoveredNode, selectedNode]);

  // 鼠标交互
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.size;
    });

    setHoveredNode(hovered || null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.size;
    });

    setSelectedNode(clicked || null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-auto rounded-lg border border-border/50"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      
      {/* 选中节点详情 */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 w-64">
          <h4 className="font-medium text-foreground mb-2">{selectedNode.label}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">理解程度</span>
              <Progress value={selectedNode.understanding * 100} className="w-20 h-2" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">重要性</span>
              <Progress value={selectedNode.importance * 100} className="w-20 h-2" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">激活度</span>
              <Progress value={selectedNode.activation * 100} className="w-20 h-2" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">领域</span>
              <Badge style={{ backgroundColor: selectedNode.domainColor }}>
                {selectedNode.domain}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
        <div className="text-xs text-muted-foreground mb-2">知识领域</div>
        <div className="flex flex-wrap gap-2">
          {domains.slice(0, 6).map(domain => (
            <div key={domain.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
              <span className="text-xs text-foreground">{domain.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 领域分布组件
// ─────────────────────────────────────────────────────────────────────

function DomainDistribution({ domains, stats }: { domains: KnowledgeDomain[]; stats: KnowledgeGraphData['stats'] }) {
  const sortedDomains = [...domains].sort((a, b) => b.conceptCount - a.conceptCount);

  return (
    <div className="space-y-3">
      {sortedDomains.map(domain => {
        const percentage = stats.totalConcepts > 0
          ? (domain.conceptCount / stats.totalConcepts) * 100
          : 0;

        return (
          <div key={domain.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{domain.icon}</span>
                <span className="text-foreground">{domain.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{domain.conceptCount}</span>
                <Badge variant="outline" className="text-xs">
                  {percentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
              style={{
                background: `${domain.color}22`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 活跃概念组件
// ─────────────────────────────────────────────────────────────────────

function ActiveConcepts({ concepts }: { concepts: ConceptNode[] }) {
  const sortedConcepts = [...concepts]
    .sort((a, b) => b.activation - a.activation)
    .slice(0, 10);

  if (sortedConcepts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        暂无概念数据
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedConcepts.map((concept, index) => (
        <div
          key={concept.id}
          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">#{index + 1}</span>
            <span className="text-foreground">{concept.name}</span>
            <Badge variant="outline" className="text-xs">
              {concept.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={concept.activation * 100} className="w-16 h-2" />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {(concept.activation * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 强关联组件
// ─────────────────────────────────────────────────────────────────────

function StrongConnections({
  edges,
  concepts,
}: {
  edges: ConceptEdge[];
  concepts: ConceptNode[];
}) {
  const conceptMap = new Map(concepts.map(c => [c.id, c]));
  const sortedEdges = [...edges]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10);

  if (sortedEdges.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        暂无关联数据
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedEdges.map(edge => {
        const source = conceptMap.get(edge.sourceId);
        const target = conceptMap.get(edge.targetId);

        if (!source || !target) return null;

        return (
          <div
            key={edge.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-foreground">{source.name}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">{target.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {edge.relation}
              </Badge>
              <Progress value={edge.strength * 100} className="w-16 h-2" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 统计概览组件
// ─────────────────────────────────────────────────────────────────────

function StatsOverview({ stats }: { stats: KnowledgeGraphData['stats'] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="text-2xl font-bold text-foreground">{stats.totalConcepts}</div>
        <div className="text-sm text-muted-foreground">概念总数</div>
      </div>
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="text-2xl font-bold text-foreground">{stats.totalEdges}</div>
        <div className="text-sm text-muted-foreground">关联总数</div>
      </div>
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="text-2xl font-bold text-foreground">
          {stats.averageConnectivity.toFixed(1)}
        </div>
        <div className="text-sm text-muted-foreground">平均连接度</div>
      </div>
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="text-2xl font-bold text-foreground">
          {(stats.strongestConnection * 100).toFixed(0)}%
        </div>
        <div className="text-sm text-muted-foreground">最强连接</div>
      </div>
      {stats.mostConnectedConcept && (
        <div className="col-span-2 bg-muted/30 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">最连接概念</div>
          <div className="font-medium text-foreground">{stats.mostConnectedConcept}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function KnowledgeGraphPanel({ data }: KnowledgeGraphPanelProps) {
  const [activeTab, setActiveTab] = useState('graph');

  // 默认空数据
  const graphData: KnowledgeGraphData = data || {
    domains: [],
    concepts: [],
    edges: [],
    stats: {
      totalConcepts: 0,
      totalEdges: 0,
      totalDomains: 0,
      averageConnectivity: 0,
      strongestConnection: 0,
      mostConnectedConcept: null,
      domainDistribution: {},
    },
    lastUpdated: Date.now(),
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>知识网络</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {graphData.stats.totalConcepts} 概念
            </Badge>
            <Badge variant="outline" className="text-xs">
              {graphData.stats.totalEdges} 关联
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="graph">图谱</TabsTrigger>
            <TabsTrigger value="domains">领域</TabsTrigger>
            <TabsTrigger value="active">活跃</TabsTrigger>
            <TabsTrigger value="stats">统计</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-4">
            {graphData.concepts.length > 0 ? (
              <KnowledgeGraphVisualization
                concepts={graphData.concepts}
                edges={graphData.edges}
                domains={graphData.domains}
              />
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <div className="text-4xl mb-4">🕸️</div>
                <div>知识图谱将通过对话逐渐构建</div>
                <div className="text-sm mt-2">概念和关联会自动从对话中提取</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="domains" className="mt-4">
            <ScrollArea className="h-[400px]">
              <DomainDistribution
                domains={graphData.domains}
                stats={graphData.stats}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <ScrollArea className="h-[400px]">
              <ActiveConcepts concepts={graphData.concepts} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <StatsOverview stats={graphData.stats} />
            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">强关联</h4>
              <ScrollArea className="h-[200px]">
                <StrongConnections
                  edges={graphData.edges}
                  concepts={graphData.concepts}
                />
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
