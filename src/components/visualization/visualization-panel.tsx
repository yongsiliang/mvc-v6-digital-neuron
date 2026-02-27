'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MemoryStick, Network, X, Maximize2, Minimize2 } from 'lucide-react';
import { HebbianNetworkVisualization } from './hebbian-network-viz';
import { MemoryGraphVisualization } from './memory-graph-viz';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface VisualizationPanelProps {
  onClose?: () => void;
  defaultTab?: 'neural' | 'memory';
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 可视化面板组件
// ─────────────────────────────────────────────────────────────────────

export function VisualizationPanel({ 
  onClose, 
  defaultTab = 'neural',
  className 
}: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'neural' | 'memory'>(defaultTab);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`shadow-xl ${isExpanded ? 'w-full h-full' : 'w-[340px]'} ${className}`}>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            意识可视化
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6"
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'neural' | 'memory')}>
          <TabsList className="grid w-full grid-cols-2 h-8 mb-2">
            <TabsTrigger value="neural" className="text-xs gap-1">
              <Brain className="w-3.5 h-3.5" />
              神经网络
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs gap-1">
              <MemoryStick className="w-3.5 h-3.5" />
              记忆图谱
            </TabsTrigger>
          </TabsList>

          <TabsContent value="neural" className="mt-0">
            <HebbianNetworkVisualization />
          </TabsContent>

          <TabsContent value="memory" className="mt-0">
            <MemoryGraphVisualization />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// 导出子组件以便单独使用
export { HebbianNetworkVisualization } from './hebbian-network-viz';
export { MemoryGraphVisualization } from './memory-graph-viz';
