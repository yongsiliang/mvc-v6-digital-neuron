'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SelfRepresentation } from '@/lib/neuron';
import { 
  Cog, 
  User, 
  Target, 
  Heart, 
  Lightbulb,
  Users,
  History,
  Activity,
  RefreshCw
} from 'lucide-react';

interface SelfConsoleProps {
  self?: SelfRepresentation;
  onReset?: () => void;
}

export function SelfConsole({ self, onReset }: SelfConsoleProps) {
  if (!self) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cog className="h-5 w-5" />
            自我演化控制台
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cog className="h-5 w-5" />
            自我演化控制台
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">v{self.evolution.version.toFixed(2)}</Badge>
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* 核心身份 */}
        <div className="space-y-2">
          <div className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            核心身份
          </div>
          <div className="bg-muted/50 p-2 rounded-lg space-y-1">
            <div><span className="text-muted-foreground">名称：</span>{self.identity.name}</div>
            <div><span className="text-muted-foreground">使命：</span>{self.identity.purpose}</div>
          </div>
        </div>

        {/* 价值观与特质 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              价值观
            </div>
            <div className="flex flex-wrap gap-1">
              {self.identity.values.map((value, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{value}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              特质
            </div>
            <div className="flex flex-wrap gap-1">
              {self.identity.traits.map((trait, i) => (
                <Badge key={i} variant="outline" className="text-xs">{trait}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 当前状态 */}
        <div className="space-y-2">
          <div className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            当前状态
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/50 p-2 rounded-lg">
              <span className="text-muted-foreground">心情：</span>
              <span className="font-medium">{self.currentState.mood}</span>
            </div>
            <div className="bg-muted/50 p-2 rounded-lg">
              <span className="text-muted-foreground">焦点：</span>
              <span className="font-medium">{self.currentState.focus}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">能量</span>
                <span>{Math.round(self.currentState.energy * 100)}%</span>
              </div>
              <Progress value={self.currentState.energy * 100} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">开放度</span>
                <span>{Math.round(self.currentState.openness * 100)}%</span>
              </div>
              <Progress value={self.currentState.openness * 100} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* 能力认知 */}
        <div className="space-y-2">
          <div className="font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            能力认知
          </div>
          <div className="bg-muted/50 p-2 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">技能</div>
            <div className="flex flex-wrap gap-1">
              {self.capabilities.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 成长历史 */}
        <div className="space-y-2">
          <div className="font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-purple-500" />
            成长轨迹
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {self.evolution.learnings.slice(-3).map((learning, i) => (
              <div key={i} className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 p-1.5 rounded">
                {learning}
              </div>
            ))}
            {self.evolution.adaptations.slice(-2).map((adaptation, i) => (
              <div key={i} className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 p-1.5 rounded">
                {adaptation}
              </div>
            ))}
          </div>
        </div>

        {/* 关系网络 */}
        <div className="space-y-2">
          <div className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            关系网络
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/50 p-1.5 rounded text-center">
              <div className="text-lg font-bold">{self.relationships.users.length}</div>
              <div className="text-muted-foreground">用户</div>
            </div>
            <div className="bg-muted/50 p-1.5 rounded text-center">
              <div className="text-lg font-bold">{self.relationships.entities.length}</div>
              <div className="text-muted-foreground">实体</div>
            </div>
            <div className="bg-muted/50 p-1.5 rounded text-center">
              <div className="text-lg font-bold">{self.relationships.contexts.length}</div>
              <div className="text-muted-foreground">话题</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
