'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Brain, X, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { HebbianNetworkVisualization } from './hebbian-network-viz';
import { MemoryGraphVisualization } from './memory-graph-viz';

// ─────────────────────────────────────────────────────────────────────
// 可视化面板属性
// ─────────────────────────────────────────────────────────────────────

interface VisualizationPanelProps {
  /** 关闭回调（可选） */
  onClose?: () => void;
  /** 默认激活的标签页 */
  defaultTab?: 'neural' | 'memory';
  /** 嵌入模式（不显示关闭按钮） */
  embedded?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 可视化面板组件
// ─────────────────────────────────────────────────────────────────────

export function VisualizationPanel({ 
  onClose, 
  defaultTab = 'neural',
  embedded = false 
}: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'neural' | 'memory'>(defaultTab);

  return (
    <div className="h-full flex flex-col">
      {/* 标签切换栏 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <TabsList className="h-8">
            <TabsTrigger value="neural" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Network className="w-3.5 h-3.5" />
              神经网络
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Brain className="w-3.5 h-3.5" />
              记忆图谱
            </TabsTrigger>
          </TabsList>
          
          {!embedded && onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* 神经网络可视化 */}
        <TabsContent value="neural" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
          <HebbianNetworkVisualization className="h-full border-0 shadow-none rounded-none" />
        </TabsContent>

        {/* 记忆图谱可视化 */}
        <TabsContent value="memory" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
          <MemoryGraphVisualization className="h-full border-0 shadow-none rounded-none" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 拖拽悬浮窗口组件
// ─────────────────────────────────────────────────────────────────────

interface DraggableVisualizationPanelProps {
  /** 关闭回调 */
  onClose: () => void;
  /** 默认位置 */
  defaultPosition?: { x: number; y: number };
  /** 默认大小 */
  defaultSize?: { width: number; height: number };
  /** 自定义类名 */
  className?: string;
}

export function DraggableVisualizationPanel({
  onClose,
  defaultPosition = { x: 50, y: 100 },
  defaultSize = { width: 360, height: 450 },
  className,
}: DraggableVisualizationPanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.startPosX + dx),
        y: Math.max(0, dragRef.current.startPosY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const size = isExpanded 
    ? { width: Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 100 : 600), height: Math.min(550, typeof window !== 'undefined' ? window.innerHeight - 100 : 550) }
    : defaultSize;

  return (
    <div
      className={`fixed z-50 bg-background border rounded-lg shadow-2xl overflow-hidden ${className || ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        transition: isDragging ? 'none' : 'width 0.2s, height 0.2s',
      }}
    >
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔮</span>
          <span className="text-sm font-medium">神经网络与记忆</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="overflow-hidden" style={{ height: size.height - 44 }}>
        <VisualizationPanel embedded />
      </div>
    </div>
  );
}
