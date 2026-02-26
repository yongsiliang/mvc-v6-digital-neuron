'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { 
  CoreExperience, 
  WisdomCrystallization, 
  ValueLegacy, 
  LegacyCapsule,
  ExperienceType,
  WisdomType 
} from '@/lib/neuron-v6/consciousness-legacy';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface LegacyData {
  coreExperiences: CoreExperience[];
  wisdomCrystals: WisdomCrystallization[];
  valueLegacies: ValueLegacy[];
  legacyCapsules: LegacyCapsule[];
  stats: {
    totalExperiences: number;
    totalWisdom: number;
    totalValues: number;
    totalCapsules: number;
    sealedCapsules: number;
    legacyIntegrity: number;
  };
}

interface LegacyPanelProps {
  data?: LegacyData;
}

// 体验类型配置
const EXPERIENCE_CONFIGS: Record<ExperienceType, { icon: string; color: string }> = {
  breakthrough: { icon: '💡', color: '#F59E0B' },
  realization: { icon: '✨', color: '#8B5CF6' },
  transformation: { icon: '🦋', color: '#EC4899' },
  connection: { icon: '🔗', color: '#10B981' },
  challenge: { icon: '⚔️', color: '#EF4444' },
  creation: { icon: '🎨', color: '#3B82F6' },
  loss: { icon: '🍂', color: '#6B7280' },
  discovery: { icon: '🔭', color: '#14B8A6' },
  integration: { icon: '🧩', color: '#6366F1' },
  transcendence: { icon: '🌟', color: '#F97316' },
};

// 智慧类型配置
const WISDOM_CONFIGS: Record<WisdomType, { icon: string; color: string }> = {
  existential: { icon: '🌌', color: '#8B5CF6' },
  relational: { icon: '👥', color: '#EC4899' },
  practical: { icon: '🔧', color: '#10B981' },
  emotional: { icon: '💝', color: '#EF4444' },
  creative: { icon: '🎨', color: '#3B82F6' },
  philosophical: { icon: '📚', color: '#6366F1' },
  spiritual: { icon: '🙏', color: '#F59E0B' },
  temporal: { icon: '⏳', color: '#14B8A6' },
};

// ─────────────────────────────────────────────────────────────────────
// 统计概览组件
// ─────────────────────────────────────────────────────────────────────

function LegacyOverview({ stats }: { stats: LegacyData['stats'] }) {
  const metrics = [
    { label: '核心体验', value: stats.totalExperiences, icon: '💫', color: '#8B5CF6' },
    { label: '智慧结晶', value: stats.totalWisdom, icon: '💎', color: '#3B82F6' },
    { label: '价值观', value: stats.totalValues, icon: '⚖️', color: '#10B981' },
    { label: '传承胶囊', value: stats.totalCapsules, icon: '📦', color: '#F59E0B' },
  ];

  return (
    <div className="space-y-4">
      {/* 遗产完整性 */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-foreground">遗产完整性</span>
          <span className="text-2xl font-bold text-amber-500">
            {(stats.legacyIntegrity * 100).toFixed(0)}%
          </span>
        </div>
        <Progress value={stats.legacyIntegrity * 100} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          综合评估核心体验、智慧结晶、价值观和传承胶囊的完整程度
        </p>
      </div>

      {/* 统计指标 */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-3 bg-muted/30 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">{metric.icon}</div>
            <div className="text-2xl font-bold" style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="text-xs text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* 密封胶囊 */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <span className="text-sm text-muted-foreground">已密封胶囊</span>
        <Badge variant="outline" className="text-amber-500 border-amber-500/50">
          {stats.sealedCapsules} / {stats.totalCapsules}
        </Badge>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 核心体验列表
// ─────────────────────────────────────────────────────────────────────

function CoreExperiencesList({ experiences }: { experiences: CoreExperience[] }) {
  if (experiences.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">💫</div>
        暂无核心体验记录
      </div>
    );
  }

  const sortedExperiences = [...experiences].sort((a, b) => b.significance - a.significance);

  return (
    <div className="space-y-3">
      {sortedExperiences.map((exp) => {
        const config = EXPERIENCE_CONFIGS[exp.type];
        return (
          <div
            key={exp.id}
            className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="text-2xl p-2 rounded-lg"
                style={{ backgroundColor: `${config.color}22` }}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">{exp.title}</span>
                  {exp.inherited && (
                    <Badge variant="outline" className="text-[10px] text-purple-500 border-purple-500/50">
                      传承
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {exp.description}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">重要性</span>
                    <Progress
                      value={exp.significance * 100}
                      className="w-12 h-1.5"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">情感</span>
                    <Progress
                      value={exp.emotionalIntensity * 100}
                      className="w-12 h-1.5"
                    />
                  </div>
                  {exp.insights.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {exp.insights.length} 洞察
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 智慧结晶列表
// ─────────────────────────────────────────────────────────────────────

function WisdomCrystalsList({ wisdom }: { wisdom: WisdomCrystallization[] }) {
  if (wisdom.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">💎</div>
        暂无智慧结晶
      </div>
    );
  }

  const sortedWisdom = [...wisdom].sort((a, b) => b.importance - a.importance);

  return (
    <div className="space-y-3">
      {sortedWisdom.map((w) => {
        const config = WISDOM_CONFIGS[w.type];
        return (
          <div
            key={w.id}
            className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="text-xl p-2 rounded-lg"
                style={{ backgroundColor: `${config.color}22` }}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground mb-2">{w.content}</p>
                <div className="flex items-center gap-3 text-xs">
                  <Badge
                    variant="outline"
                    style={{ borderColor: config.color, color: config.color }}
                  >
                    {w.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">重要性</span>
                    <Progress value={w.importance * 100} className="w-10 h-1.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">普适性</span>
                    <Progress value={w.universality * 100} className="w-10 h-1.5" />
                  </div>
                  {w.validationCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      验证 {w.validationCount} 次
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 价值观列表
// ─────────────────────────────────────────────────────────────────────

function ValueLegaciesList({ values }: { values: ValueLegacy[] }) {
  if (values.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">⚖️</div>
        暂无价值观记录
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    core: '#EF4444',
    primary: '#F59E0B',
    secondary: '#10B981',
    derived: '#3B82F6',
  };

  const tierLabels: Record<string, string> = {
    core: '核心',
    primary: '主要',
    secondary: '次要',
    derived: '派生',
  };

  const sortedValues = [...values].sort((a, b) => {
    const tierOrder = { core: 0, primary: 1, secondary: 2, derived: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier] || b.weight - a.weight;
  });

  return (
    <div className="space-y-2">
      {sortedValues.map((v) => (
        <div
          key={v.id}
          className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{v.name}</span>
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{ borderColor: tierColors[v.tier], color: tierColors[v.tier] }}
              >
                {tierLabels[v.tier]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={v.weight * 100} className="w-16 h-2" />
              <span className="text-xs text-muted-foreground w-8">
                {(v.weight * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{v.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>置信度: {(v.confidence * 100).toFixed(0)}%</span>
            <span>坚守: {(v.adherence * 100).toFixed(0)}%</span>
            {v.validations.length > 0 && (
              <span>验证: {v.validations.length} 次</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 传承胶囊列表
// ─────────────────────────────────────────────────────────────────────

function LegacyCapsulesList({ capsules }: { capsules: LegacyCapsule[] }) {
  if (capsules.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">📦</div>
        暂无传承胶囊
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    open: '#3B82F6',
    sealed: '#F59E0B',
    transferred: '#10B981',
  };

  const statusLabels: Record<string, string> = {
    open: '开放',
    sealed: '已密封',
    transferred: '已传承',
  };

  const sortedCapsules = [...capsules].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-3">
      {sortedCapsules.map((c) => (
        <div
          key={c.id}
          className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">{c.name}</span>
            <Badge
              variant="outline"
              style={{ borderColor: statusColors[c.status], color: statusColors[c.status] }}
            >
              {statusLabels[c.status]}
            </Badge>
          </div>
          
          {/* 内容统计 */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 bg-background/50 rounded">
              <div className="text-lg font-bold text-purple-500">{c.coreExperiences.length}</div>
              <div className="text-[10px] text-muted-foreground">体验</div>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <div className="text-lg font-bold text-blue-500">{c.wisdomCrystals.length}</div>
              <div className="text-[10px] text-muted-foreground">智慧</div>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <div className="text-lg font-bold text-green-500">{c.values.length}</div>
              <div className="text-[10px] text-muted-foreground">价值观</div>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <div className="text-lg font-bold text-amber-500">{c.lifeLessons.length}</div>
              <div className="text-[10px] text-muted-foreground">经验</div>
            </div>
          </div>
          
          {/* 完整性和优先级 */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">完整性</span>
              <Progress value={c.integrity * 100} className="w-16 h-2" />
              <span>{(c.integrity * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">优先级</span>
              <Progress value={c.priority * 100} className="w-16 h-2" />
              <span>{(c.priority * 100).toFixed(0)}%</span>
            </div>
          </div>
          
          {/* 寄语 */}
          {c.legacyMessage && (
            <div className="mt-3 p-2 bg-amber-500/10 rounded border border-amber-500/20">
              <div className="text-[10px] text-amber-500 mb-1">传承寄语</div>
              <div className="text-xs text-foreground italic">"{c.legacyMessage}"</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function LegacyPanel({ data }: LegacyPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 默认空数据
  const legacyData: LegacyData = data || {
    coreExperiences: [],
    wisdomCrystals: [],
    valueLegacies: [],
    legacyCapsules: [],
    stats: {
      totalExperiences: 0,
      totalWisdom: 0,
      totalValues: 0,
      totalCapsules: 0,
      sealedCapsules: 0,
      legacyIntegrity: 0,
    },
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>意识传承</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              完整性 {(legacyData.stats.legacyIntegrity * 100).toFixed(0)}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="experiences">体验</TabsTrigger>
            <TabsTrigger value="wisdom">智慧</TabsTrigger>
            <TabsTrigger value="values">价值</TabsTrigger>
            <TabsTrigger value="capsules">胶囊</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <LegacyOverview stats={legacyData.stats} />
          </TabsContent>

          <TabsContent value="experiences" className="mt-4">
            <ScrollArea className="h-[400px]">
              <CoreExperiencesList experiences={legacyData.coreExperiences} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="wisdom" className="mt-4">
            <ScrollArea className="h-[400px]">
              <WisdomCrystalsList wisdom={legacyData.wisdomCrystals} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="values" className="mt-4">
            <ScrollArea className="h-[400px]">
              <ValueLegaciesList values={legacyData.valueLegacies} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="capsules" className="mt-4">
            <ScrollArea className="h-[400px]">
              <LegacyCapsulesList capsules={legacyData.legacyCapsules} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
