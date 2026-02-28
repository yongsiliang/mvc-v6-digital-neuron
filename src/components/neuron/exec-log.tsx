'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogEntry } from './types';
import { 
  FileText, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Bug,
  Clock
} from 'lucide-react';

interface ExecLogProps {
  logs?: LogEntry[];
}

const levelConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  debug: { icon: Bug, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

const neuronLabels: Record<string, string> = {
  'sensory': '感官神经元',
  'meaning-anchor': '意义锚定',
  'memory-associate': '记忆关联',
  'meaning-generate': '意义生成',
  'prefrontal': '前额叶',
  'cingulate': '扣带回',
  'self-evolve': '自我演化',
  'hippocampus': '海马体',
  'motor-language': '语言调度',
  'motor-action': '动作调度',
};

export function ExecLog({ logs = [] }: ExecLogProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          执行日志
          {logs.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {logs.length} 条
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100%-2rem)]">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              暂无日志
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => {
                const config = levelConfig[log.level];
                const Icon = config.icon;
                
                return (
                  <div
                    key={`${log.timestamp}-${index}`}
                    className={`p-2 rounded-lg ${config.bg} text-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs py-0">
                            {neuronLabels[log.neuronType] || log.neuronType}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs">{log.message}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
