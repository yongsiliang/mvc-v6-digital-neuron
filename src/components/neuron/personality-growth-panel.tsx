'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Brain,
  Heart,
  Users,
  Scale,
  InfinityIcon,
  Palette,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface CoreTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  curiosity: number;
  creativity: number;
  empathy: number;
  resilience: number;
  wisdom: number;
  playfulness: number;
}

interface MaturityDimensions {
  emotional: number;
  cognitive: number;
  social: number;
  moral: number;
  existential: number;
  creative: number;
}

interface MaturityMilestone {
  id: string;
  dimension: keyof MaturityDimensions;
  name: string;
  description: string;
  threshold: number;
  achieved: boolean;
  achievedAt?: number;
  significance: string;
}

interface TraitChange {
  trait: keyof CoreTraits;
  previousValue: number;
  newValue: number;
  reason: string;
  timestamp: number;
  significance: number;
}

interface PersonalityConflict {
  id: string;
  type: string;
  description: string;
  intensity: number;
  resolution?: string;
  createdAt: number;
}

interface PersonalityIntegration {
  coherence: number;
  stability: number;
  adaptability: number;
  authenticity: number;
  conflicts: PersonalityConflict[];
  resolvedConflicts: Array<{
    id: string;
    description: string;
    resolution: string;
    resolvedAt: number;
    learningGained: string;
  }>;
}

interface PersonalityState {
  traits: CoreTraits;
  traitChanges: TraitChange[];
  maturity: MaturityDimensions;
  milestones: MaturityMilestone[];
  overallMaturity: number;
  integration: PersonalityIntegration;
  experiences: Array<{
    id: string;
    type: string;
    description: string;
    impact: { traits: Partial<CoreTraits>; maturity: Partial<MaturityDimensions> };
    timestamp: number;
    processed: boolean;
    significance: number;
  }>;
  lastUpdated: number;
  growthRate: number;
}

interface PersonalityGrowthPanelProps {
  state: PersonalityState | null;
  onTriggerGrowth?: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────

const TRAIT_LABELS: Record<keyof CoreTraits, { label: string; color: string }> = {
  openness: { label: '开放性', color: '#8b5cf6' },
  conscientiousness: { label: '尽责性', color: '#3b82f6' },
  extraversion: { label: '外向性', color: '#f59e0b' },
  agreeableness: { label: '宜人性', color: '#10b981' },
  neuroticism: { label: '神经质', color: '#ef4444' },
  curiosity: { label: '好奇心', color: '#06b6d4' },
  creativity: { label: '创造力', color: '#ec4899' },
  empathy: { label: '同理心', color: '#f97316' },
  resilience: { label: '韧性', color: '#84cc16' },
  wisdom: { label: '智慧', color: '#6366f1' },
  playfulness: { label: '玩心', color: '#14b8a6' },
};

const MATURITY_LABELS: Record<keyof MaturityDimensions, { label: string; icon: React.ReactNode; color: string }> = {
  emotional: { label: '情绪成熟', icon: <Heart className="w-4 h-4" />, color: '#ec4899' },
  cognitive: { label: '认知成熟', icon: <Brain className="w-4 h-4" />, color: '#8b5cf6' },
  social: { label: '社交成熟', icon: <Users className="w-4 h-4" />, color: '#3b82f6' },
  moral: { label: '道德成熟', icon: <Scale className="w-4 h-4" />, color: '#10b981' },
  existential: { label: '存在成熟', icon: <InfinityIcon className="w-4 h-4" />, color: '#6366f1' },
  creative: { label: '创造成熟', icon: <Palette className="w-4 h-4" />, color: '#f59e0b' },
};

// ─────────────────────────────────────────────────────────────────────
// 特质雷达图组件
// ─────────────────────────────────────────────────────────────────────

function TraitsRadar({ traits }: { traits: CoreTraits }) {
  const bigFive = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const size = 200;
  const center = size / 2;
  const radius = 80;
  
  const getPoint = (index: number, value: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    const r = radius * value;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };
  
  const points = bigFive.map((trait, i) => getPoint(i, traits[trait as keyof CoreTraits]));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
          <polygon
            key={level}
            points={bigFive.map((_, i) => {
              const p = getPoint(i, level);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted/30"
          />
        ))}
        
        {/* 轴线 */}
        {bigFive.map((_, i) => {
          const p = getPoint(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted/30"
            />
          );
        })}
        
        {/* 数据区域 */}
        <path
          d={pathD}
          fill="url(#traitGradient)"
          stroke="url(#traitStroke)"
          strokeWidth="2"
        />
        
        {/* 数据点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={TRAIT_LABELS[bigFive[i] as keyof CoreTraits].color}
          />
        ))}
        
        {/* 标签 */}
        {bigFive.map((trait, i) => {
          const p = getPoint(i, 1.15);
          return (
            <text
              key={trait}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {TRAIT_LABELS[trait as keyof CoreTraits].label}
            </text>
          );
        })}
        
        <defs>
          <linearGradient id="traitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="traitStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 扩展特质列表组件
// ─────────────────────────────────────────────────────────────────────

function ExtendedTraitsList({ traits, changes }: { traits: CoreTraits; changes: TraitChange[] }) {
  const extendedTraits = ['curiosity', 'creativity', 'empathy', 'resilience', 'wisdom', 'playfulness'];
  
  // 计算最近趋势
  const getTrend = (trait: keyof CoreTraits): 'up' | 'down' | 'stable' => {
    const recentChanges = changes.filter(c => c.trait === trait && Date.now() - c.timestamp < 7 * 24 * 60 * 60 * 1000);
    if (recentChanges.length === 0) return 'stable';
    const total = recentChanges.reduce((sum, c) => sum + (c.newValue - c.previousValue), 0);
    if (total > 0.02) return 'up';
    if (total < -0.02) return 'down';
    return 'stable';
  };
  
  return (
    <div className="space-y-2">
      {extendedTraits.map((trait) => {
        const value = traits[trait as keyof CoreTraits];
        const trend = getTrend(trait as keyof CoreTraits);
        const { label, color } = TRAIT_LABELS[trait as keyof CoreTraits];
        
        return (
          <div key={trait} className="flex items-center gap-2">
            <span className="text-xs w-14 text-muted-foreground">{label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${value * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="text-xs w-10 text-right">{(value * 100).toFixed(0)}%</span>
            <span className="w-4">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 成熟度指标组件
// ─────────────────────────────────────────────────────────────────────

function MaturityIndicators({ maturity, overallMaturity }: { maturity: MaturityDimensions; overallMaturity: number }) {
  const dimensions = Object.keys(maturity) as Array<keyof MaturityDimensions>;
  
  return (
    <div className="space-y-3">
      {/* 整体成熟度 */}
      <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">整体成熟度</span>
          <Badge variant="secondary">{(overallMaturity * 100).toFixed(0)}%</Badge>
        </div>
        <Progress value={overallMaturity * 100} className="h-2" />
      </div>
      
      {/* 各维度 */}
      <div className="grid grid-cols-2 gap-2">
        {dimensions.map((dim) => {
          const { label, icon, color } = MATURITY_LABELS[dim];
          const value = maturity[dim];
          
          return (
            <div
              key={dim}
              className="p-2 rounded-lg border bg-card"
              style={{ borderColor: `${color}30` }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span style={{ color }}>{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${value * 100}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{(value * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 里程碑组件
// ─────────────────────────────────────────────────────────────────────

function MilestonesPanel({ milestones }: { milestones: MaturityMilestone[] }) {
  const achieved = milestones.filter(m => m.achieved);
  const inProgress = milestones.filter(m => !m.achieved).slice(0, 6);
  
  return (
    <div className="space-y-3">
      {/* 已达成的里程碑 */}
      {achieved.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Award className="w-3 h-3" />
            已达成 ({achieved.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {achieved.slice(0, 8).map((m) => (
              <Badge
                key={m.id}
                variant="outline"
                className="text-[10px] bg-green-500/10 border-green-500/30 text-green-600"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {m.name}
              </Badge>
            ))}
            {achieved.length > 8 && (
              <Badge variant="outline" className="text-[10px]">
                +{achieved.length - 8}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* 进行中的里程碑 */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Target className="w-3 h-3" />
          下一个里程碑
        </div>
        <div className="space-y-2">
          {inProgress.map((m) => (
            <div key={m.id} className="p-2 rounded bg-muted/30 border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{m.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  需 {(m.threshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 人格整合组件
// ─────────────────────────────────────────────────────────────────────

function IntegrationPanel({ integration }: { integration: PersonalityIntegration }) {
  const { coherence, stability, adaptability, authenticity, conflicts } = integration;
  
  const getLevelLabel = () => {
    const avg = (coherence + stability + adaptability + authenticity) / 4;
    if (avg < 0.4) return { label: '分散', color: 'text-red-500' };
    if (avg < 0.6) return { label: '发展中', color: 'text-amber-500' };
    if (avg < 0.8) return { label: '整合', color: 'text-green-500' };
    return { label: '超越', color: 'text-purple-500' };
  };
  
  const level = getLevelLabel();
  
  return (
    <div className="space-y-3">
      {/* 整合水平 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">整合水平</span>
        <Badge className={level.color}>{level.label}</Badge>
      </div>
      
      {/* 四个维度 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-muted/30 text-center">
          <div className="text-lg font-bold text-purple-500">{(coherence * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-muted-foreground">一致性</div>
        </div>
        <div className="p-2 rounded bg-muted/30 text-center">
          <div className="text-lg font-bold text-blue-500">{(stability * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-muted-foreground">稳定性</div>
        </div>
        <div className="p-2 rounded bg-muted/30 text-center">
          <div className="text-lg font-bold text-green-500">{(adaptability * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-muted-foreground">适应性</div>
        </div>
        <div className="p-2 rounded bg-muted/30 text-center">
          <div className="text-lg font-bold text-amber-500">{(authenticity * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-muted-foreground">真实性</div>
        </div>
      </div>
      
      {/* 内在冲突 */}
      {conflicts.length > 0 && (
        <div className="p-2 rounded border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
            <AlertTriangle className="w-3 h-3" />
            内在冲突 ({conflicts.length})
          </div>
          {conflicts.slice(0, 2).map((conflict) => (
            <p key={conflict.id} className="text-[10px] text-muted-foreground">
              • {conflict.description.slice(0, 40)}...
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function PersonalityGrowthPanel({ state, onTriggerGrowth }: PersonalityGrowthPanelProps) {
  const [activeTab, setActiveTab] = useState<'traits' | 'maturity' | 'integration'>('traits');
  
  if (!state) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">人格成长系统正在初始化...</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* 标签切换 */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        <Button
          variant={activeTab === 'traits' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('traits')}
          className="flex-1 text-xs"
        >
          特质
        </Button>
        <Button
          variant={activeTab === 'maturity' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('maturity')}
          className="flex-1 text-xs"
        >
          成熟度
        </Button>
        <Button
          variant={activeTab === 'integration' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('integration')}
          className="flex-1 text-xs"
        >
          整合
        </Button>
      </div>
      
      {/* 内容区域 */}
      <div className="space-y-3">
        {activeTab === 'traits' && (
          <>
            <Card className="p-3">
              <div className="text-xs font-medium mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                大五人格特质
              </div>
              <TraitsRadar traits={state.traits} />
            </Card>
            
            <Card className="p-3">
              <div className="text-xs font-medium mb-2">扩展特质</div>
              <ExtendedTraitsList traits={state.traits} changes={state.traitChanges} />
            </Card>
          </>
        )}
        
        {activeTab === 'maturity' && (
          <>
            <MaturityIndicators maturity={state.maturity} overallMaturity={state.overallMaturity} />
            <Card className="p-3">
              <MilestonesPanel milestones={state.milestones} />
            </Card>
          </>
        )}
        
        {activeTab === 'integration' && (
          <Card className="p-3">
            <IntegrationPanel integration={state.integration} />
          </Card>
        )}
      </div>
      
      {/* 成长率指示 */}
      <div className="p-2 bg-muted/30 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">成长率</span>
        </div>
        <Badge variant={state.growthRate > 0.5 ? 'default' : 'secondary'}>
          {(state.growthRate * 100).toFixed(1)}%/天
        </Badge>
      </div>
    </div>
  );
}

export default PersonalityGrowthPanel;
