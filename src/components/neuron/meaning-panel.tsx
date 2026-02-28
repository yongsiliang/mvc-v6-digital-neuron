'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SubjectiveMeaning } from './types';
import { 
  Sparkles, 
  Heart, 
  Brain, 
  Tag,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface MeaningPanelProps {
  meaning?: SubjectiveMeaning;
}

const sentimentConfig = {
  positive: { label: '积极', color: 'bg-green-500', icon: TrendingUp },
  negative: { label: '消极', color: 'bg-red-500', icon: TrendingDown },
  neutral: { label: '中性', color: 'bg-gray-500', icon: Minus },
  mixed: { label: '复杂', color: 'bg-amber-500', icon: Heart },
};

export function MeaningPanel({ meaning }: MeaningPanelProps) {
  if (!meaning) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            意义调试面板
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground">
          等待输入...
        </CardContent>
      </Card>
    );
  }

  const sentiment = sentimentConfig[meaning.sentiment];
  const SentimentIcon = sentiment.icon;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          意义调试面板
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 意义解释 */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            主观意义
          </div>
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            {meaning.interpretation}
          </div>
        </div>

        {/* 指标网格 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 自我关联度 */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>自我关联度</span>
              <span className="font-medium">{Math.round(meaning.selfRelevance * 100)}%</span>
            </div>
            <Progress value={meaning.selfRelevance * 100} className="h-2" />
          </div>

          {/* 价值评估 */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>价值评估</span>
              <span className="font-medium">{meaning.value > 0 ? '+' : ''}{Math.round(meaning.value * 100)}</span>
            </div>
            <Progress 
              value={(meaning.value + 1) * 50} 
              className={cn(
                "h-2",
                meaning.value > 0 ? '[&>div]:bg-green-500' : 
                meaning.value < 0 ? '[&>div]:bg-red-500' : '[&>div]:bg-gray-500'
              )}
            />
          </div>

          {/* 置信度 */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>置信度</span>
              <span className="font-medium">{Math.round(meaning.confidence * 100)}%</span>
            </div>
            <Progress value={meaning.confidence * 100} className="h-2" />
          </div>

          {/* 情感倾向 */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground mb-1.5">情感倾向</div>
            <Badge 
              variant="outline" 
              className={cn('w-full justify-center', sentiment.color, 'text-white border-0')}
            >
              <SentimentIcon className="h-3 w-3 mr-1" />
              {sentiment.label}
            </Badge>
          </div>
        </div>

        {/* 记忆标签 */}
        {meaning.memoryTags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              记忆标签
            </div>
            <div className="flex flex-wrap gap-1">
              {meaning.memoryTags.slice(0, 10).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {meaning.memoryTags.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{meaning.memoryTags.length - 10}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { cn } from '@/lib/utils';
