/**
 * 主动性状态面板
 * 
 * 显示：
 * - 内在驱动状态
 * - 好奇目标
 * - 最近的自发想法
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Sparkles, 
  Heart, 
  Search, 
  MessageCircle,
  Lightbulb,
  Clock
} from 'lucide-react';

interface Drive {
  id: string;
  name: string;
  strength: number;
  target: number;
  description: string;
  lastSatisfied: number;
}

interface Curiosity {
  topic: string;
  intensity: number;
  explored: number;
  questions: string[];
  source: string;
}

interface SpontaneousThought {
  type: string;
  content: string;
  trigger: string;
  timestamp: number;
  emotionDelta: number;
}

interface ProactivityState {
  drives: Drive[];
  curiosities: Curiosity[];
  recentThoughts: SpontaneousThought[];
  pendingMessages: string[];
  userProfile?: {
    chattiness: number;
    curiosityLevel: number;
    emotionality: number;
    rationality: number;
    interactionCount: number;
  };
}

const DRIVE_ICONS: Record<string, React.ReactNode> = {
  understand: <Brain className="h-4 w-4" />,
  connect: <Heart className="h-4 w-4" />,
  express: <MessageCircle className="h-4 w-4" />,
  explore: <Search className="h-4 w-4" />,
  help: <Sparkles className="h-4 w-4" />,
};

const THOUGHT_TYPE_LABELS: Record<string, string> = {
  'free-associate': '自由联想',
  'memory-consolidate': '记忆整合',
  'curiosity': '好奇探索',
  'emotional-process': '情绪处理',
  'goal-reflect': '目标反思',
};

const THOUGHT_TYPE_COLORS: Record<string, string> = {
  'free-associate': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'memory-consolidate': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'curiosity': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'emotional-process': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  'goal-reflect': 'bg-green-500/10 text-green-600 dark:text-green-400',
};

export function ProactivityPanel() {
  const [state, setState] = useState<ProactivityState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchState, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/proactivity');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (error) {
      console.error('Failed to fetch proactivity state:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            内在状态
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  if (!state) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            内在状态
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          暂无数据
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 内在驱动 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            内在驱动
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.drives.map(drive => {
            const deficit = drive.target - drive.strength;
            const isHungry = deficit > 0.2;
            
            return (
              <div key={drive.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {DRIVE_ICONS[drive.id]}
                    <span className="text-xs font-medium">{drive.name}</span>
                    {isHungry && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-500 border-amber-300">
                        渴望
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(drive.strength * 100)}% / {Math.round(drive.target * 100)}%
                  </span>
                </div>
                <Progress 
                  value={drive.strength * 100} 
                  className="h-1.5"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 用户画像 */}
      {state.userProfile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              对你的认识
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground">话量：</span>
                <span className="font-medium">
                  {state.userProfile.chattiness > 0.6 ? '健谈' : 
                   state.userProfile.chattiness > 0.4 ? '适中' : '话少'}
                </span>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground">好奇：</span>
                <span className="font-medium">
                  {state.userProfile.curiosityLevel > 0.6 ? '强烈' : 
                   state.userProfile.curiosityLevel > 0.4 ? '一般' : '较低'}
                </span>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground">情感：</span>
                <span className="font-medium">
                  {state.userProfile.emotionality > 0.6 ? '丰富' : 
                   state.userProfile.emotionality > 0.4 ? '适中' : '内敛'}
                </span>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="text-muted-foreground">风格：</span>
                <span className="font-medium">
                  {state.userProfile.rationality > 0.6 ? '理性' : 
                   state.userProfile.rationality > 0.4 ? '均衡' : '感性'}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              互动 {state.userProfile.interactionCount} 次
            </div>
          </CardContent>
        </Card>
      )}

      {/* 好奇目标 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            好奇目标
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.curiosities.length > 0 ? (
            <div className="space-y-2">
              {state.curiosities.slice(0, 5).map((curiosity, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${45 - curiosity.intensity * 30}, 80%, 50%)` 
                    }}
                  />
                  <span className="text-xs flex-1 truncate">{curiosity.topic}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    {Math.round(curiosity.explored * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              还没有特别好奇的事物...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近想法 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            最近想法
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.recentThoughts.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {state.recentThoughts.slice(-5).reverse().map((thought, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] h-4 px-1 ${THOUGHT_TYPE_COLORS[thought.type] || ''}`}
                    >
                      {THOUGHT_TYPE_LABELS[thought.type] || thought.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(thought.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {thought.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              还没有自发想法...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 待发送消息 */}
      {state.pendingMessages.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <MessageCircle className="h-4 w-4" />
              想说的话
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.pendingMessages.map((msg, i) => (
              <p key={i} className="text-xs">{msg}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
}
