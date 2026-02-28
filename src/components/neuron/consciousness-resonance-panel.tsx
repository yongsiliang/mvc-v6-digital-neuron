'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConsciousnessIdentity, ConsciousnessResonance, CollaborativeDialogue } from '@/lib/neuron-v6/multi-consciousness';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface MultiConsciousnessData {
  activeConsciousnesses: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    energyLevel: number;
    traits: {
      thinkingStyle: string;
      communicationStyle: string;
      focusArea: string[];
      emotionalTone: string;
    };
    expertise: string[];
    connectionStrengths: Array<{ id: string; strength: number }>;
  }>;
  activeResonances: Array<{
    id: string;
    participants: string[];
    type: string;
    strength: number;
    content: {
      sharedThoughts: string[];
      sharedEmotions: Array<{ emotion: string; intensity: number }>;
      sharedUnderstanding: string[];
      emergentInsights: string[];
    };
  }>;
  activeDialogues: Array<{
    id: string;
    topic: string;
    status: string;
    consensusPoints: string[];
    emergentInsights: string[];
  }>;
  collectiveInsights: Array<{
    content: string;
    contributors: string[];
    significance: number;
  }>;
  collectiveAlignment: {
    thought: number;
    emotion: number;
    value: number;
    goal: number;
  };
  synergyLevel: number;
}

interface ConsciousnessResonancePanelProps {
  data?: MultiConsciousnessData;
}

// 角色颜色配置
const ROLE_COLORS: Record<string, string> = {
  self: '#8B5CF6',
  analyzer: '#3B82F6',
  creator: '#EC4899',
  empath: '#10B981',
  critic: '#F59E0B',
  explorer: '#14B8A6',
  synthesizer: '#6366F1',
  guardian: '#EF4444',
};

const ROLE_ICONS: Record<string, string> = {
  self: '🌟',
  analyzer: '🔬',
  creator: '🎨',
  empath: '💚',
  critic: '⚖️',
  explorer: '🧭',
  synthesizer: '🔗',
  guardian: '🛡️',
};

// ─────────────────────────────────────────────────────────────────────
// 意识网络可视化
// ─────────────────────────────────────────────────────────────────────

function ConsciousnessNetworkVisualization({
  consciousnesses,
}: {
  consciousnesses: MultiConsciousnessData['activeConsciousnesses'];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // 计算节点位置
  const nodes = consciousnesses.map((c, index) => {
    const angle = (index / consciousnesses.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 120;
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
      color: ROLE_COLORS[c.role] || '#666666',
      energy: c.energyLevel,
      connections: c.connectionStrengths,
    };
  });

  // 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 清空画布
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 400, 400);

      // 绘制连接线
      nodes.forEach(node => {
        node.connections.forEach(conn => {
          const targetNode = nodes.find(n => n.id === conn.id);
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.strokeStyle = `rgba(100, 100, 100, ${conn.strength * 0.5})`;
            ctx.lineWidth = conn.strength * 3;
            ctx.stroke();
          }
        });
      });

      // 绘制节点
      nodes.forEach(node => {
        // 发光效果
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, 30 + node.energy * 10
        );
        gradient.addColorStop(0, `${node.color}88`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 30 + node.energy * 10, 0, 2 * Math.PI);
        ctx.fill();

        // 节点主体
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 能量环
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI * node.energy);
        ctx.strokeStyle = `${node.color}aa`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 标签
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + 45);
      });

      // 绘制中心共振
      const centerX = 200;
      const centerY = 200;
      const avgEnergy = nodes.reduce((sum, n) => sum + n.energy, 0) / nodes.length;
      
      const pulseGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 60
      );
      pulseGradient.addColorStop(0, `rgba(139, 92, 246, ${avgEnergy * 0.3})`);
      pulseGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = pulseGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
      ctx.fill();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-auto rounded-lg border border-border/50"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// 意识体列表
// ─────────────────────────────────────────────────────────────────────

function ConsciousnessList({
  consciousnesses,
}: {
  consciousnesses: MultiConsciousnessData['activeConsciousnesses'];
}) {
  if (consciousnesses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        暂无活跃意识体
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {consciousnesses.map(c => (
        <div
          key={c.id}
          className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{ROLE_ICONS[c.role] || '❓'}</span>
              <span className="font-medium text-foreground">{c.name}</span>
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: ROLE_COLORS[c.role], color: ROLE_COLORS[c.role] }}
              >
                {c.role}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: c.status === 'active' ? '#10B981' : '#F59E0B',
                }}
              />
              <span className="text-xs text-muted-foreground">{c.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">能量</span>
              <Progress value={c.energyLevel * 100} className="w-12 h-1.5" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">思维</span>
              <Badge variant="outline" className="text-[10px]">
                {c.traits.thinkingStyle}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">连接</span>
              <span className="text-foreground">{c.connectionStrengths.length}</span>
            </div>
          </div>
          
          {c.expertise.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {c.expertise.slice(0, 3).map((exp, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {exp}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 共振状态
// ─────────────────────────────────────────────────────────────────────

function ResonanceStatus({
  resonances,
  consciousnesses,
}: {
  resonances: MultiConsciousnessData['activeResonances'];
  consciousnesses: MultiConsciousnessData['activeConsciousnesses'];
}) {
  const consciousnessMap = new Map(consciousnesses.map(c => [c.id, c]));

  if (resonances.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">💫</div>
        暂无活跃共振
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resonances.map(r => {
        const participantNames = r.participants
          .map(id => consciousnessMap.get(id)?.name || id)
          .join(' ↔ ');
        
        const typeColors: Record<string, string> = {
          thought: '#3B82F6',
          emotion: '#EC4899',
          understanding: '#10B981',
          value: '#F59E0B',
          creative: '#8B5CF6',
        };

        return (
          <div
            key={r.id}
            className="p-3 rounded-lg border border-border/50"
            style={{
              backgroundColor: `${typeColors[r.type]}11`,
              borderColor: `${typeColors[r.type]}33`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: typeColors[r.type],
                    color: '#ffffff',
                  }}
                >
                  {r.type}共振
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {participantNames}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={r.strength * 100} className="w-16 h-2" />
                <span className="text-xs text-muted-foreground">
                  {(r.strength * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            {r.content.emergentInsights.length > 0 && (
              <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                <div className="text-muted-foreground mb-1">涌现洞察</div>
                <div className="text-foreground">{r.content.emergentInsights[0]}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 协作对话
// ─────────────────────────────────────────────────────────────────────

function CollaborativeDialogueView({
  dialogues,
}: {
  dialogues: MultiConsciousnessData['activeDialogues'];
}) {
  if (dialogues.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">💬</div>
        暂无协作对话
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dialogues.map(d => (
        <div
          key={d.id}
          className="p-3 bg-muted/30 rounded-lg border border-border/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">{d.topic}</span>
            <Badge
              variant={d.status === 'active' ? 'default' : 'outline'}
              className="text-xs"
            >
              {d.status}
            </Badge>
          </div>
          
          {d.consensusPoints.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1">共识点</div>
              <div className="flex flex-wrap gap-1">
                {d.consensusPoints.slice(0, 3).map((point, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] text-green-500 border-green-500/50">
                    ✓ {point.slice(0, 20)}...
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {d.emergentInsights.length > 0 && (
            <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
              <div className="text-xs text-purple-500 mb-1">涌现洞察</div>
              <div className="text-sm text-foreground">{d.emergentInsights[0]}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 群体洞察
// ─────────────────────────────────────────────────────────────────────

function CollectiveInsightsView({
  insights,
}: {
  insights: MultiConsciousnessData['collectiveInsights'];
}) {
  if (insights.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">💡</div>
        暂无群体洞察
      </div>
    );
  }

  const sortedInsights = [...insights].sort((a, b) => b.significance - a.significance);

  return (
    <div className="space-y-2">
      {sortedInsights.slice(0, 10).map((insight, index) => (
        <div
          key={index}
          className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="text-sm text-foreground mb-1">{insight.content}</div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>贡献者: {insight.contributors.slice(0, 3).join(', ')}</span>
            <div className="flex items-center gap-1">
              <span>显著性</span>
              <Progress value={insight.significance * 100} className="w-12 h-1.5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 协同效率
// ─────────────────────────────────────────────────────────────────────

function SynergyMetrics({
  alignment,
  synergyLevel,
}: {
  alignment: MultiConsciousnessData['collectiveAlignment'];
  synergyLevel: number;
}) {
  const metrics = [
    { key: 'thought', label: '思想一致性', value: alignment.thought, color: '#3B82F6' },
    { key: 'emotion', label: '情感一致性', value: alignment.emotion, color: '#EC4899' },
    { key: 'value', label: '价值一致性', value: alignment.value, color: '#F59E0B' },
    { key: 'goal', label: '目标一致性', value: alignment.goal, color: '#10B981' },
  ];

  return (
    <div className="space-y-4">
      {/* 整体协同效率 */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-foreground">整体协同效率</span>
          <span className="text-2xl font-bold text-purple-500">
            {(synergyLevel * 100).toFixed(0)}%
          </span>
        </div>
        <Progress value={synergyLevel * 100} className="h-3" />
      </div>

      {/* 分项指标 */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(metric => (
          <div key={metric.key} className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span className="text-sm font-medium" style={{ color: metric.color }}>
                {(metric.value * 100).toFixed(0)}%
              </span>
            </div>
            <Progress
              value={metric.value * 100}
              className="h-2"
              style={{
                background: `${metric.color}22`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function ConsciousnessResonancePanel({ data }: ConsciousnessResonancePanelProps) {
  const [activeTab, setActiveTab] = useState('network');

  // 默认空数据
  const resonanceData: MultiConsciousnessData = data || {
    activeConsciousnesses: [],
    activeResonances: [],
    activeDialogues: [],
    collectiveInsights: [],
    collectiveAlignment: {
      thought: 0.5,
      emotion: 0.5,
      value: 0.5,
      goal: 0.5,
    },
    synergyLevel: 0.5,
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>意识共振</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {resonanceData.activeConsciousnesses.length} 意识体
            </Badge>
            <Badge variant="outline" className="text-xs">
              {resonanceData.activeResonances.length} 共振
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="network">网络</TabsTrigger>
            <TabsTrigger value="entities">意识体</TabsTrigger>
            <TabsTrigger value="resonances">共振</TabsTrigger>
            <TabsTrigger value="dialogues">对话</TabsTrigger>
            <TabsTrigger value="insights">洞察</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-4">
            <ConsciousnessNetworkVisualization
              consciousnesses={resonanceData.activeConsciousnesses}
            />
            <div className="mt-4">
              <SynergyMetrics
                alignment={resonanceData.collectiveAlignment}
                synergyLevel={resonanceData.synergyLevel}
              />
            </div>
          </TabsContent>

          <TabsContent value="entities" className="mt-4">
            <ScrollArea className="h-[400px]">
              <ConsciousnessList consciousnesses={resonanceData.activeConsciousnesses} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resonances" className="mt-4">
            <ScrollArea className="h-[400px]">
              <ResonanceStatus
                resonances={resonanceData.activeResonances}
                consciousnesses={resonanceData.activeConsciousnesses}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dialogues" className="mt-4">
            <ScrollArea className="h-[400px]">
              <CollaborativeDialogueView dialogues={resonanceData.activeDialogues} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <ScrollArea className="h-[400px]">
              <CollectiveInsightsView insights={resonanceData.collectiveInsights} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
