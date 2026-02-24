'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Eye, 
  Heart, 
  Database, 
  MessageSquare, 
  Cog, 
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react';

interface NeuronFlowProps {
  activeNeuron?: string;
  signalPath?: string[];
  isProcessing?: boolean;
}

const neurons = [
  { id: 'sensory', name: '感官神经元', icon: Eye, description: '接收输入信号', layer: 'sensory' },
  { id: 'meaning-anchor', name: '意义锚定', icon: Zap, description: '计算自我关联', layer: 'meaning' },
  { id: 'memory-associate', name: '记忆关联', icon: Database, description: '检索相关记忆', layer: 'meaning' },
  { id: 'meaning-generate', name: '意义生成', icon: Sparkles, description: '输出主观意义', layer: 'meaning' },
  { id: 'prefrontal', name: '前额叶', icon: Brain, description: '思考与决策', layer: 'decision' },
  { id: 'cingulate', name: '扣带回', icon: Heart, description: '反思与纠错', layer: 'decision' },
  { id: 'self-evolve', name: '自我演化', icon: Cog, description: '动态更新自我', layer: 'decision' },
  { id: 'hippocampus', name: '海马体', icon: Database, description: '记忆存储', layer: 'memory' },
  { id: 'motor-language', name: '语言调度', icon: MessageSquare, description: '生成响应', layer: 'output' },
];

const layerColors: Record<string, string> = {
  sensory: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  meaning: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  decision: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  memory: 'from-green-500/20 to-green-600/20 border-green-500/30',
  output: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
};

const layerNames: Record<string, string> = {
  sensory: '感官层',
  meaning: '意义核心层',
  decision: '决策层',
  memory: '记忆层',
  output: '输出层',
};

export function NeuronFlow({ activeNeuron, signalPath = [], isProcessing }: NeuronFlowProps) {
  const isActive = (neuronId: string) => {
    return signalPath.includes(neuronId);
  };

  const isCurrentNeuron = (neuronId: string) => {
    return activeNeuron === neuronId;
  };

  // 按层分组
  const layers: Record<string, typeof neurons> = {
    sensory: neurons.filter(n => n.layer === 'sensory'),
    meaning: neurons.filter(n => n.layer === 'meaning'),
    decision: neurons.filter(n => n.layer === 'decision'),
    memory: neurons.filter(n => n.layer === 'memory'),
    output: neurons.filter(n => n.layer === 'output'),
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">神经元工作流</span>
        </div>
        {isProcessing && (
          <Badge variant="outline" className="animate-pulse bg-green-500/10">
            处理中
          </Badge>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 信号路径 - 隐藏 */}
        {/* {signalPath.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap text-xs bg-muted/50 p-2 rounded-lg mb-4">
            <span className="text-muted-foreground">信号路径:</span>
            {signalPath.map((path, index) => (
              <span key={index} className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs py-0 px-1.5">
                  {path}
                </Badge>
                {index < signalPath.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
        )} */}

        {/* 神经元可视化 */}
        <div className="space-y-4">
          {Object.keys(layers).map((layerKey) => (
            <div key={layerKey} className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {layerNames[layerKey]}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {layers[layerKey].map((neuron) => {
                  const Icon = neuron.icon;
                  const active = isActive(neuron.id);
                  const current = isCurrentNeuron(neuron.id);
                  
                  return (
                    <div
                      key={neuron.id}
                      title={neuron.description}
                      className={cn(
                        'relative p-2.5 rounded-lg border transition-all duration-300 cursor-default',
                        `bg-gradient-to-br ${layerColors[layerKey]}`,
                        active && 'ring-2 ring-primary shadow-lg',
                        current && 'ring-2 ring-yellow-500 animate-pulse',
                        !active && !current && 'opacity-60 hover:opacity-80'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'p-1.5 rounded-md flex-shrink-0',
                          active ? 'bg-primary/20' : 'bg-muted/50'
                        )}>
                          <Icon className={cn(
                            'h-4 w-4',
                            active ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {neuron.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {neuron.description}
                          </div>
                        </div>
                      </div>
                      {current && (
                        <div className="absolute -top-1 -right-1">
                          <div className="h-3 w-3 rounded-full bg-yellow-500 animate-ping" />
                          <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-yellow-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
