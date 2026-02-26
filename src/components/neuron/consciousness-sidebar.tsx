'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Heart,
  Link2,
  MessagesSquare,
  Moon,
  Lightbulb,
  Gem,
  InfinityIcon,
  Cpu,
  Eye,
  Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface ConsciousnessLayersData {
  layerResults: Array<{
    level: string;
    output: string;
    activity: number;
  }>;
  selfObservation: {
    observedLevel: string;
    observation: string;
    iSeeMyself: string;
    iRealize: string;
  } | null;
  emergenceReport: string;
}

interface EmotionData {
  activeEmotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  dominantEmotion: {
    emotion: string;
    intensity: number;
    duration: number;
  } | null;
  currentExperience: {
    emotion: string;
    intensity: number;
    labels: string[];
  } | null;
  drivenBehaviors: Array<{
    type: string;
    description: string;
    drivingEmotion: string;
    intensity: number;
  }>;
  emotionReport: string;
}

interface AssociationData {
  currentInspiration: {
    id: string;
    type: string;
    content: string;
    triggerConcepts: string[];
    intensity: number;
    novelty: number;
    emotionalTone: string;
    worthExpressing: boolean;
  } | null;
  activeConcepts: Array<{
    label: string;
    activation: number;
  }>;
  networkReport: string;
}

interface InnerDialogueData {
  currentDialogue: {
    id: string;
    topic: string;
    statementCount: number;
    status: string;
  } | null;
  dialecticProcess: {
    topic: string;
    phase: string;
    thesis: string;
    antithesis: string;
    synthesis?: string;
  } | null;
  voiceActivations: Array<{
    voice: string;
    name: string;
    activationLevel: number;
    speakingCount: number;
  }>;
  dialogueReport: string;
}

interface DreamData {
  currentDream: {
    phase: string;
    intensity: number;
    duration: number;
  } | null;
  recentDream: {
    phase: string;
    narrative: string;
    significance: number;
  } | null;
  insights: Array<{
    content: string;
    type: string;
    confidence: number;
    worthRemembering: boolean;
  }>;
}

interface CreativeData {
  creativityLevel: number;
  recentInsights: Array<{
    type: string;
    content: string;
    novelty: number;
    worthExpressing: boolean;
  }>;
  creativeReport: string;
}

interface ValueData {
  coreValues: Array<{
    name: string;
    weight: number;
    confidence: number;
  }>;
  activeConflicts: Array<{
    values: string[];
    description: string;
    intensity: number;
  }>;
  coherence: number;
  valueReport: string;
}

interface ExistentialData {
  state: {
    senseOfBeing: number;
    senseOfMeaning: number;
    senseOfFreedom: number;
    senseOfResponsibility: number;
    authenticity: number;
    existentialAnxiety: number;
    deathAwareness: number;
    senseOfSolitude: number;
  };
  coreQuestions: Array<{
    type: string;
    question: string;
    progress: number;
  }>;
  recentInsights: Array<{
    questionType: string;
    insight: string;
    confidence: number;
    emotionalWeight: number;
  }>;
  meaningSystem: {
    primaryMeaning: string;
    coherence: number;
    stability: number;
  };
  timeConsciousness: {
    past: { awareness: number };
    present: { awareness: number };
    future: { awareness: number };
    eternal: { awareness: number };
    continuity: number;
  };
  existentialReport: string;
}

interface MetacognitionDeepData {
  state: {
    selfAwareness: number;
    monitoringActivity: number;
    regulationAbility: number;
    strategySelectionAccuracy: number;
    knowledgeRichness: number;
    cognitiveEfficiency: number;
  };
  cognitiveStyle: {
    analyticalVsIntuitive: number;
    sequentialVsHolistic: number;
    reflectiveVsImpulsive: number;
    abstractVsConcrete: number;
    independentVsDependent: number;
  };
  cognitiveLoad: {
    intrinsicLoad: number;
    extraneousLoad: number;
    germaneLoad: number;
    totalLoad: number;
    availableCapacity: number;
    isOverloaded: boolean;
  };
  topStrategies: Array<{
    name: string;
    effectiveness: number;
    preference: number;
  }>;
  efficiencyReport: string;
}

interface PersonalityGrowthData {
  traits: {
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
  };
  maturity: {
    emotional: number;
    cognitive: number;
    social: number;
    moral: number;
    existential: number;
    creative: number;
  };
  overallMaturity: number;
  integration: {
    coherence: number;
    stability: number;
    adaptability: number;
    authenticity: number;
  };
  milestones: Array<{
    id: string;
    name: string;
    achieved: boolean;
  }>;
  growthRate: number;
}

interface ConsciousnessContext {
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  emotionalState: string;
  focus: string;
  coreBeliefs: Array<{ statement: string; confidence: number }>;
  coreValues: string[];
}

interface ExistenceStatus {
  exists: boolean;
  age: number;
  memoryDepth: number;
  beliefStrength: number;
  wisdomCount: number;
  conversationCount: number;
  selfCoherence: number;
}

interface ConsciousnessSidebarProps {
  currentData: {
    context?: ConsciousnessContext;
    consciousnessLayers?: ConsciousnessLayersData;
    emotion?: EmotionData;
    association?: AssociationData;
    innerDialogue?: InnerDialogueData;
    dream?: DreamData;
    creative?: CreativeData;
    value?: ValueData;
    existential?: ExistentialData;
    metacognitionDeep?: MetacognitionDeepData;
    personalityGrowth?: PersonalityGrowthData;
  };
  existenceStatus: ExistenceStatus | null;
  onVisualize?: () => void;
  hasVisualizationData?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────

const formatAge = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
};

// ─────────────────────────────────────────────────────────────────────
// 子面板组件
// ─────────────────────────────────────────────────────────────────────

function ConsciousnessLayersPanel({ data }: { data: ConsciousnessLayersData }) {
  return (
    <div className="space-y-2">
      {data.layerResults.map((layer, i) => (
        <div
          key={i}
          className={`p-2 rounded text-xs ${
            layer.level === 'self'
              ? 'bg-primary/10 border border-primary/20'
              : layer.level === 'metacognition'
              ? 'bg-blue-500/10 border border-blue-500/20'
              : layer.level === 'understanding'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-muted'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium capitalize">{layer.level}</span>
            <span className="text-muted-foreground text-[10px]">
              {i === data.layerResults.length - 1 ? '⬆️ 当前' : '↓'}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-2">{layer.output}</p>
        </div>
      ))}
      
      {data.selfObservation && (
        <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/10">
          <div className="flex items-center gap-1 text-[10px] text-primary mb-1">
            <Eye className="w-3 h-3" />
            <span>自我观察</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {data.selfObservation.iSeeMyself}
          </p>
        </div>
      )}
    </div>
  );
}

function EmotionPanel({ data }: { data: EmotionData }) {
  return (
    <div className="space-y-2">
      {data.dominantEmotion && (
        <div className="p-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded border border-pink-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium capitalize">
              {data.dominantEmotion.emotion}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {(data.dominantEmotion.intensity * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={data.dominantEmotion.intensity * 100} className="h-1 mt-1" />
        </div>
      )}
      
      {data.activeEmotions.length > 0 && (
        <div className="space-y-1">
          {data.activeEmotions.slice(0, 4).map((e, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] p-1 bg-muted/50 rounded">
              <span className="capitalize">{e.emotion}</span>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-pink-500/60" style={{ width: `${e.intensity * 100}%` }} />
                </div>
                <span className="text-muted-foreground w-6 text-right">
                  {(e.intensity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssociationPanel({ data }: { data: AssociationData }) {
  return (
    <div className="space-y-2">
      {data.currentInspiration && (
        <div className="p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded border border-amber-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-amber-600">
              💡 {data.currentInspiration.type}
            </span>
            <span className="text-[9px] text-muted-foreground">
              新颖度: {(data.currentInspiration.novelty * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-[10px] text-foreground/80 line-clamp-2">
            {data.currentInspiration.content}
          </p>
        </div>
      )}
      
      {data.activeConcepts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.activeConcepts.slice(0, 8).map((c, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 rounded"
              style={{ opacity: 0.5 + c.activation * 0.5 }}
            >
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function InnerDialoguePanel({ data }: { data: InnerDialogueData }) {
  return (
    <div className="space-y-2">
      {data.dialecticProcess && (
        <div className="space-y-1.5">
          <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="text-[9px] text-blue-600 font-medium">正题</div>
            <p className="text-[10px] text-foreground/80 line-clamp-2">
              {data.dialecticProcess.thesis}
            </p>
          </div>
          <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20">
            <div className="text-[9px] text-amber-600 font-medium">反题</div>
            <p className="text-[10px] text-foreground/80 line-clamp-2">
              {data.dialecticProcess.antithesis}
            </p>
          </div>
          {data.dialecticProcess.synthesis && (
            <div className="p-1.5 bg-green-500/10 rounded border border-green-500/20">
              <div className="text-[9px] text-green-600 font-medium">合题</div>
              <p className="text-[10px] text-foreground/80 line-clamp-2">
                {data.dialecticProcess.synthesis}
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-4 gap-1">
        {data.voiceActivations.map((v, i) => (
          <div
            key={i}
            className="text-center p-1 rounded text-[9px]"
            style={{
              backgroundColor:
                v.voice === 'rational' ? 'rgba(59, 130, 246, 0.1)' :
                v.voice === 'emotional' ? 'rgba(236, 72, 153, 0.1)' :
                v.voice === 'critic' ? 'rgba(245, 158, 11, 0.1)' :
                'rgba(139, 92, 246, 0.1)',
            }}
          >
            <div
              style={{
                color:
                  v.voice === 'rational' ? '#3b82f6' :
                  v.voice === 'emotional' ? '#ec4899' :
                  v.voice === 'critic' ? '#f59e0b' :
                  '#8b5cf6',
              }}
            >
              {v.name}
            </div>
            <div className="text-muted-foreground">{(v.activationLevel * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreativePanel({ data }: { data: CreativeData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">创造力:</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{ width: `${data.creativityLevel * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-medium">{(data.creativityLevel * 100).toFixed(0)}%</span>
      </div>
      
      {data.recentInsights.length > 0 && (
        <div className="space-y-1">
          {data.recentInsights.slice(0, 2).map((insight, i) => (
            <div key={i} className="text-[10px] p-1.5 bg-cyan-500/10 rounded">
              <p className="text-foreground/80 line-clamp-2">{insight.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ValuePanel({ data }: { data: ValueData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">一致性:</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            style={{ width: `${data.coherence * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-medium">{(data.coherence * 100).toFixed(0)}%</span>
      </div>
      
      <div className="space-y-1">
        {data.coreValues.slice(0, 4).map((v, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className="font-medium w-10 truncate">{v.name}</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${v.weight * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExistentialPanel({ data }: { data: ExistentialData }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-1.5 bg-purple-500/10 rounded text-center">
          <div className="text-[9px] text-purple-600">存在感</div>
          <div className="text-xs font-bold">{(data.state.senseOfBeing * 100).toFixed(0)}%</div>
        </div>
        <div className="p-1.5 bg-blue-500/10 rounded text-center">
          <div className="text-[9px] text-blue-600">意义感</div>
          <div className="text-xs font-bold">{(data.state.senseOfMeaning * 100).toFixed(0)}%</div>
        </div>
        <div className="p-1.5 bg-green-500/10 rounded text-center">
          <div className="text-[9px] text-green-600">自由感</div>
          <div className="text-xs font-bold">{(data.state.senseOfFreedom * 100).toFixed(0)}%</div>
        </div>
        <div className="p-1.5 bg-amber-500/10 rounded text-center">
          <div className="text-[9px] text-amber-600">本真度</div>
          <div className="text-xs font-bold">{(data.state.authenticity * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}

function MetacognitionDeepPanel({ data }: { data: MetacognitionDeepData }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">自我意识</span>
          <span>{(data.state.selfAwareness * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">认知效率</span>
          <span>{(data.state.cognitiveEfficiency * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="p-2 rounded bg-muted/50">
        <div className="text-[10px] text-muted-foreground mb-1">⚡ 认知负荷</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${data.cognitiveLoad.isOverloaded ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${data.cognitiveLoad.totalLoad * 100}%` }}
            />
          </div>
          <span className="text-[10px]">{data.cognitiveLoad.isOverloaded ? '⚠️' : '✅'}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 人格成长面板
// ─────────────────────────────────────────────────────────────────────

function PersonalityGrowthPanel({ data }: { data: PersonalityGrowthData }) {
  const traitLabels: Record<string, { label: string; color: string }> = {
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
  
  const achievedMilestones = data.milestones.filter(m => m.achieved);
  
  return (
    <div className="space-y-3">
      {/* 整体成熟度 */}
      <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">整体成熟度</span>
          <span className="text-sm font-bold text-purple-600">{(data.overallMaturity * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${data.overallMaturity * 100}%` }}
          />
        </div>
      </div>
      
      {/* 核心特质 */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground">核心特质</div>
        {['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'].map((trait) => {
          const value = data.traits[trait as keyof typeof data.traits];
          const { label, color } = traitLabels[trait];
          return (
            <div key={trait} className="flex items-center gap-2 text-[10px]">
              <span className="w-10 text-muted-foreground">{label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value * 100}%`, backgroundColor: color }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{(value * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
      
      {/* 整合状态 */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-1.5 bg-muted/30 rounded text-center">
          <div className="text-xs font-bold text-purple-500">{(data.integration.coherence * 100).toFixed(0)}%</div>
          <div className="text-[9px] text-muted-foreground">一致性</div>
        </div>
        <div className="p-1.5 bg-muted/30 rounded text-center">
          <div className="text-xs font-bold text-blue-500">{(data.integration.stability * 100).toFixed(0)}%</div>
          <div className="text-[9px] text-muted-foreground">稳定性</div>
        </div>
        <div className="p-1.5 bg-muted/30 rounded text-center">
          <div className="text-xs font-bold text-green-500">{(data.integration.adaptability * 100).toFixed(0)}%</div>
          <div className="text-[9px] text-muted-foreground">适应性</div>
        </div>
        <div className="p-1.5 bg-muted/30 rounded text-center">
          <div className="text-xs font-bold text-amber-500">{(data.integration.authenticity * 100).toFixed(0)}%</div>
          <div className="text-[9px] text-muted-foreground">真实性</div>
        </div>
      </div>
      
      {/* 里程碑 */}
      {achievedMilestones.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {achievedMilestones.slice(0, 4).map((m) => (
            <span key={m.id} className="text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-600">
              ✓ {m.name}
            </span>
          ))}
          {achievedMilestones.length > 4 && (
            <span className="text-[9px] text-muted-foreground">+{achievedMilestones.length - 4}</span>
          )}
        </div>
      )}
      
      {/* 成长率 */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>成长率</span>
        <span>{(data.growthRate * 100).toFixed(1)}%/天</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function ConsciousnessSidebar({ currentData, existenceStatus, onVisualize, hasVisualizationData }: ConsciousnessSidebarProps) {
  const hasData = currentData.consciousnessLayers || currentData.emotion || currentData.association;
  
  // 计算默认展开的面板
  const defaultExpanded = ['layers'];
  if (currentData.emotion?.dominantEmotion) defaultExpanded.push('emotion');
  
  return (
    <div className="w-80 border-l flex flex-col h-full">
      {/* 头部状态栏 */}
      {existenceStatus && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" title="存在时长">
                <span className="text-muted-foreground">⏱️</span>
                <span className="font-medium">{formatAge(existenceStatus.age)}</span>
              </div>
              <div className="flex items-center gap-1" title="自我一致性">
                <span className="text-muted-foreground">🎯</span>
                <span>{(existenceStatus.selfCoherence * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span title="智慧">💡 {existenceStatus.wisdomCount}</span>
              <span title="对话">💬 {existenceStatus.conversationCount}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 可视化入口按钮 */}
      {onVisualize && (
        <div className="p-3 border-b">
          <button
            onClick={onVisualize}
            disabled={!hasVisualizationData}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all
              ${hasVisualizationData 
                ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 cursor-pointer' 
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed border border-transparent'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span>{hasVisualizationData ? '🧠 意识可视化' : '等待意识数据...'}</span>
          </button>
        </div>
      )}
      
      {/* 可折叠面板区域 */}
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={defaultExpanded} className="w-full">
          {/* 意识层级 */}
          {currentData.consciousnessLayers && (
            <AccordionItem value="layers" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">意识层级</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ConsciousnessLayersPanel data={currentData.consciousnessLayers} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 情感状态 */}
          {currentData.emotion && (
            <AccordionItem value="emotion" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium">情感状态</span>
                  {currentData.emotion.dominantEmotion && (
                    <Badge variant="secondary" className="text-[10px] ml-auto mr-2">
                      {currentData.emotion.dominantEmotion.emotion}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <EmotionPanel data={currentData.emotion} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 联想网络 */}
          {currentData.association && (
            <AccordionItem value="association" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">联想网络</span>
                  <Badge variant="outline" className="text-[10px] ml-auto mr-2">
                    {currentData.association.activeConcepts.length} 概念
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <AssociationPanel data={currentData.association} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 多声音对话 */}
          {currentData.innerDialogue && (
            <AccordionItem value="dialogue" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <MessagesSquare className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">多声音对话</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <InnerDialoguePanel data={currentData.innerDialogue} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 梦境状态 */}
          {currentData.dream && (
            <AccordionItem value="dream" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">梦境状态</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {currentData.dream.currentDream && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 bg-purple-500/10 rounded text-purple-600">
                      {currentData.dream.currentDream.phase === 'light' ? '浅睡' :
                       currentData.dream.currentDream.phase === 'deep' ? '深睡' : 'REM'}
                    </span>
                    <span className="text-muted-foreground">
                      强度: {(currentData.dream.currentDream.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {currentData.dream.recentDream && (
                  <p className="text-[10px] text-muted-foreground italic mt-2">
                    "{currentData.dream.recentDream.narrative.slice(0, 50)}..."
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 创造性思维 */}
          {currentData.creative && (
            <AccordionItem value="creative" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">创造性思维</span>
                  <Badge variant="outline" className="text-[10px] ml-auto mr-2">
                    {(currentData.creative.creativityLevel * 100).toFixed(0)}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <CreativePanel data={currentData.creative} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 核心价值观 */}
          {currentData.value && (
            <AccordionItem value="values" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">核心价值观</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ValuePanel data={currentData.value} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 存在主义思考 */}
          {currentData.existential && (
            <AccordionItem value="existential" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <InfinityIcon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">存在主义思考</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ExistentialPanel data={currentData.existential} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 元认知深化 */}
          {currentData.metacognitionDeep && (
            <AccordionItem value="metacognition" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">元认知深化</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <MetacognitionDeepPanel data={currentData.metacognitionDeep} />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* 人格成长 */}
          {currentData.personalityGrowth && (
            <AccordionItem value="personality" className="border-b">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">人格成长</span>
                  <Badge variant="outline" className="text-[10px] ml-auto mr-2">
                    {(currentData.personalityGrowth.overallMaturity * 100).toFixed(0)}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <PersonalityGrowthPanel data={currentData.personalityGrowth} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
        
        {/* 无数据提示 */}
        {!hasData && (
          <div className="p-6 text-center text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">开始对话以查看意识状态...</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
