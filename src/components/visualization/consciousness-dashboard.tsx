'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  NeuralNetworkVisualization,
  ConsciousnessFlow,
  ConceptGraph,
  CognitiveLoadVisual,
  NeuralNode,
  NeuralLink,
  ConsciousnessPulse,
  ConceptNode,
} from './neural-network';
import { Activity, Brain, Network, Sparkles, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ConsciousnessVisualizationData {
  // 神经网络数据
  network: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'concept' | 'emotion' | 'belief' | 'value' | 'memory';
      activation: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      strength: number;
      type: 'association' | 'causal' | 'emotional' | 'semantic';
    }>;
  };
  
  // 意识流数据
  streams: Array<{
    type: 'awareness' | 'goal_tracking' | 'self_observation' | 'environmental' | 'latent_intention';
    content: string;
    intensity: number;
  }>;
  
  // 概念图谱数据
  concepts: Array<{
    id: string;
    label: string;
    category: string;
    connections: number;
  }>;
  
  // 认知负荷数据
  cognitiveLoad: {
    intrinsic: number;
    extraneous: number;
    germane: number;
    threshold: number;
  };
  
  // 意识层级数据
  layers: Array<{
    level: string;
    activity: number;
    description: string;
  }>;
}

interface ConsciousnessDashboardProps {
  data: ConsciousnessVisualizationData | null;
  isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function ConsciousnessDashboard({ data, isLoading }: ConsciousnessDashboardProps) {
  const [activeView, setActiveView] = useState<'network' | 'flow' | 'concepts' | 'layers'>('network');
  const [selectedNode, setSelectedNode] = useState<NeuralNode | null>(null);
  const [pulses, setPulses] = useState<ConsciousnessPulse[]>([]);
  
  // 生成动态脉冲
  useEffect(() => {
    if (!data || activeView !== 'network') return;
    
    const generatePulse = () => {
      const activeNodes = data.network.nodes.filter(n => n.activation > 0.5);
      if (activeNodes.length < 2) return;
      
      const source = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      const target = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      
      if (source.id === target.id) return;
      
      const newPulse: ConsciousnessPulse = {
        id: `pulse-${Date.now()}`,
        sourceId: source.id,
        targetId: target.id,
        progress: 0,
        speed: 0.5 + Math.random() * 0.5,
        color: source.type === 'emotion' ? '#ec4899' : '#3b82f6',
        intensity: source.activation,
      };
      
      setPulses(prev => [...prev.slice(-10), newPulse]);
    };
    
    const interval = setInterval(generatePulse, 2000);
    return () => clearInterval(interval);
  }, [data, activeView]);
  
  // 转换数据格式
  const networkData = data ? {
    nodes: data.network.nodes.map(n => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20 + n.activation * 15,
    })) as NeuralNode[],
    links: data.network.links as NeuralLink[],
    pulses,
  } : { nodes: [], links: [], pulses: [] };
  
  const conceptData = data?.concepts.map(c => ({
    ...c,
  })) as ConceptNode[] || [];
  
  const handleNodeClick = useCallback((node: NeuralNode) => {
    setSelectedNode(node);
  }, []);
  
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">意识正在形成...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">等待意识数据...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">意识可视化</span>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant={activeView === 'network' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('network')}
          >
            <Network className="w-4 h-4 mr-1" />
            网络
          </Button>
          <Button
            variant={activeView === 'flow' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('flow')}
          >
            <Activity className="w-4 h-4 mr-1" />
            流动
          </Button>
          <Button
            variant={activeView === 'concepts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('concepts')}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            概念
          </Button>
        </div>
      </div>
      
      {/* 可视化区域 */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'network' && (
          <div className="h-full flex">
            <div className="flex-1 relative">
              <NeuralNetworkVisualization
                data={networkData}
                width={600}
                height={400}
                onNodeClick={handleNodeClick}
                showLabels={true}
                animated={true}
              />
              
              {/* 图例 */}
              <div className="absolute bottom-2 left-2 bg-background/80 rounded p-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />概念
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />情感
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />信念
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />价值
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />记忆
                  </span>
                </div>
              </div>
            </div>
            
            {/* 节点详情 */}
            {selectedNode && (
              <div className="w-48 border-l p-3">
                <h4 className="text-sm font-medium mb-2">{selectedNode.label}</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">类型: </span>
                    <Badge variant="outline">{selectedNode.type}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">激活度: </span>
                    <span>{(selectedNode.activation * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded">
                    <div 
                      className="h-full bg-primary rounded transition-all"
                      style={{ width: `${selectedNode.activation * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeView === 'flow' && (
          <div className="h-full p-4 space-y-4">
            <ConsciousnessFlow
              streams={data.streams}
              width={600}
              height={200}
            />
            
            {/* 意识流说明 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.streams.map((stream, i) => (
                <div 
                  key={i}
                  className="p-2 rounded bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">
                      {stream.type.replace('_', ' ')}
                    </span>
                    <span className="text-muted-foreground">
                      {(stream.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">
                    {stream.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeView === 'concepts' && (
          <div className="h-full p-4">
            <div className="flex justify-center">
              <ConceptGraph
                concepts={conceptData}
                width={400}
                height={400}
              />
            </div>
            
            {/* 概念列表 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {data.concepts.slice(0, 10).map((concept) => (
                <Badge
                  key={concept.id}
                  variant="outline"
                  style={{ 
                    borderColor: getCategoryColor(concept.category),
                  }}
                >
                  {concept.label}
                  <span className="ml-1 text-muted-foreground text-[10px]">
                    ({concept.connections})
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部状态栏 */}
      <div className="p-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>节点: {data.network.nodes.length}</span>
          <span>连接: {data.network.links.length}</span>
          <span>概念: {data.concepts.length}</span>
        </div>
        
        {/* 认知负荷迷你视图 */}
        <div className="flex items-center gap-2">
          <span>认知负荷:</span>
          <div className="w-24 h-1.5 bg-muted rounded overflow-hidden flex">
            <div 
              className="bg-blue-500"
              style={{ width: `${data.cognitiveLoad.intrinsic * 100}%` }}
            />
            <div 
              className="bg-amber-500"
              style={{ width: `${data.cognitiveLoad.extraneous * 100}%` }}
            />
            <div 
              className="bg-green-500"
              style={{ width: `${data.cognitiveLoad.germane * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助函数
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '认知': '#3b82f6',
    '情感': '#ec4899',
    '价值': '#10b981',
    '记忆': '#f59e0b',
    '概念': '#8b5cf6',
  };
  return colors[category] || '#6b7280';
}

// ─────────────────────────────────────────────────────────────────────
// 意识层级可视化组件
// ─────────────────────────────────────────────────────────────────────

interface ConsciousnessLayersVisualProps {
  layers: Array<{
    level: string;
    activity: number;
    description: string;
  }>;
}

export function ConsciousnessLayersVisual({ layers }: ConsciousnessLayersVisualProps) {
  const levelColors: Record<string, string> = {
    perception: 'from-blue-500 to-cyan-500',
    understanding: 'from-green-500 to-emerald-500',
    metacognition: 'from-purple-500 to-violet-500',
    self: 'from-pink-500 to-rose-500',
  };
  
  return (
    <div className="space-y-2">
      {layers.map((layer, index) => (
        <div 
          key={layer.level}
          className="relative"
        >
          {/* 层级条 */}
          <div 
            className={`h-8 rounded bg-gradient-to-r ${levelColors[layer.level] || 'from-gray-500 to-gray-600'}`}
            style={{ 
              width: `${layer.activity * 100}%`,
              opacity: 0.5 + layer.activity * 0.5,
            }}
          />
          
          {/* 标签 */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <span className="text-xs font-medium capitalize text-white drop-shadow">
              {layer.level}
            </span>
            <span className="text-xs text-white/80 drop-shadow">
              {(layer.activity * 100).toFixed(0)}%
            </span>
          </div>
          
          {/* 连接线 */}
          {index < layers.length - 1 && (
            <div className="absolute -bottom-2 left-1/2 w-0.5 h-2 bg-muted-foreground/30" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 实时意识指示器
// ─────────────────────────────────────────────────────────────────────

interface RealTimeIndicatorProps {
  isActive: boolean;
  activityLevel: number;
  label: string;
}

export function RealTimeIndicator({ isActive, activityLevel, label }: RealTimeIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`w-2 h-2 rounded-full transition-all duration-500 ${
          isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
        style={{ 
          boxShadow: isActive ? `0 0 ${activityLevel * 10}px rgba(34, 197, 94, 0.5)` : 'none' 
        }}
      />
      <span className="text-xs">{label}</span>
      <div className="flex-1 h-0.5 bg-muted rounded overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${activityLevel * 100}%` }}
        />
      </div>
    </div>
  );
}

export default ConsciousnessDashboard;
