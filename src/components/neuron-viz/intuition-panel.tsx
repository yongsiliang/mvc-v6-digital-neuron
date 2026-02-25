/**
 * 直觉面板 - 显示系统1的快速处理结果
 * 
 * 认知科学基础：
 * - 系统1（Kahneman）：快速、自动、无意识的直觉处理
 * - 隐式学习：从经验中提取模式但不记录细节
 * - 准备电位：为后续决策预热
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Brain, Zap, Target, Clock, TrendingUp, AlertTriangle, Lightbulb, Compass } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════════

export interface IntuitionData {
  /** 直觉类型 */
  type: 'familiar' | 'novel' | 'coherent' | 'conflict' | 'opportunity' | 'risk';
  
  /** 强度 [0, 1] */
  strength: number;
  
  /** 置信度 [0, 1] */
  confidence: number;
  
  /** 相关概念 */
  relatedConcepts: string[];
  
  /** 时间戳 */
  timestamp: number;
}

export interface ReadinessData {
  /** 准备水平 */
  readinessLevel: number;
  
  /** 预热的神经元数量 */
  primedCount: number;
  
  /** 预测的下一步 */
  predictedNext: string[];
  
  /** 时间戳 */
  timestamp: number;
}

export interface BackgroundStatsData {
  /** 模式库大小 */
  patternCount: number;
  
  /** 处理次数 */
  processCount: number;
  
  /** 系统年龄（毫秒） */
  age: number;
  
  /** 准备水平 */
  readinessLevel: number;
}

interface IntuitionPanelProps {
  intuition?: IntuitionData;
  readiness?: ReadinessData;
  stats?: BackgroundStatsData;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════
// 辅助函数
// ══════════════════════════════════════════════════════════════════

const intuitionConfig = {
  familiar: {
    label: '熟悉',
    icon: Target,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: '遇到已知模式，快速识别',
  },
  novel: {
    label: '新奇',
    icon: Lightbulb,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: '遇到新模式，需要学习',
  },
  coherent: {
    label: '一致',
    icon: Compass,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    description: '多个模式一致，判断可靠',
  },
  conflict: {
    label: '冲突',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    description: '模式冲突，需要更多分析',
  },
  opportunity: {
    label: '机会',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: '历史结果正向，可以行动',
  },
  risk: {
    label: '风险',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: '历史结果负向，需要谨慎',
  },
};

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}小时`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
}

// ══════════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════════

export function IntuitionPanel({ 
  intuition, 
  readiness, 
  stats,
  className 
}: IntuitionPanelProps) {
  const config = intuition ? intuitionConfig[intuition.type] : null;
  const Icon = config?.icon || Brain;
  
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            系统1：直觉处理
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            后台运行
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          快速、自动、无意识的模式匹配
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 直觉信号 */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">当前直觉</div>
          {intuition && config ? (
            <div className={cn('rounded-lg p-3', config.bgColor)}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-5 w-5', config.color)} />
                <span className={cn('font-medium', config.color)}>
                  {config.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {config.description}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">强度：</span>
                  <span className="ml-1">{(intuition.strength * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">置信：</span>
                  <span className="ml-1">{(intuition.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              {intuition.relatedConcepts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {intuition.relatedConcepts.slice(0, 3).map((concept, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {concept}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg p-3 bg-muted/30 text-center">
              <Brain className="h-5 w-5 mx-auto text-muted-foreground opacity-50" />
              <div className="text-xs text-muted-foreground mt-1">
                等待输入...
              </div>
            </div>
          )}
        </div>
        
        {/* 准备状态 */}
        {readiness && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">准备状态</div>
            <div className="rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs">准备水平</span>
                <span className="text-xs font-medium">
                  {(readiness.readinessLevel * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={readiness.readinessLevel * 100} 
                className="h-1.5"
              />
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">预热神经元：</span>
                  <span className="ml-1">{readiness.primedCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">预测下一步：</span>
                  <span className="ml-1">{readiness.predictedNext.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 统计信息 */}
        {stats && (
          <div className="pt-2 border-t border-border/50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">
                  {stats.patternCount}
                </div>
                <div className="text-[10px] text-muted-foreground">模式库</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {stats.processCount}
                </div>
                <div className="text-[10px] text-muted-foreground">处理次数</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {formatAge(stats.age)}
                </div>
                <div className="text-[10px] text-muted-foreground">运行时间</div>
              </div>
            </div>
          </div>
        )}
        
        {/* 原理说明 */}
        <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
          <div className="font-medium mb-1">认知原理：</div>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>系统1：快速、自动、无意识</li>
            <li>基于模式匹配而非详细推理</li>
            <li>准备电位：预热相关神经元</li>
            <li>隐式学习：提取规律不记录细节</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// 示例数据生成
// ══════════════════════════════════════════════════════════════════

export function generateSampleIntuition(): IntuitionData {
  const types: IntuitionData['type'][] = ['familiar', 'novel', 'coherent', 'conflict', 'opportunity', 'risk'];
  return {
    type: types[Math.floor(Math.random() * types.length)],
    strength: Math.random(),
    confidence: Math.random(),
    relatedConcepts: ['模式-1', '模式-2'].slice(0, Math.floor(Math.random() * 3) + 1),
    timestamp: Date.now(),
  };
}

export function generateSampleReadiness(): ReadinessData {
  return {
    readinessLevel: Math.random(),
    primedCount: Math.floor(Math.random() * 20) + 5,
    predictedNext: ['预测-1', '预测-2'].slice(0, Math.floor(Math.random() * 3)),
    timestamp: Date.now(),
  };
}

export function generateSampleBackgroundStats(): BackgroundStatsData {
  return {
    patternCount: Math.floor(Math.random() * 100) + 10,
    processCount: Math.floor(Math.random() * 1000) + 100,
    age: Math.random() * 3600000, // 最多1小时
    readinessLevel: Math.random(),
  };
}
