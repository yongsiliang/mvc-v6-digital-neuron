/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent 可视化反馈组件
 *
 * 提供实时屏幕预览、操作标注和任务进度显示
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Monitor, 
  MousePointer2, 
  Keyboard, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  Square,
  Eye,
  Target,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface AgentState {
  isRunning: boolean;
  currentTask: {
    id: string;
    goal: string;
    status: 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
    currentStep: number;
    totalSteps: number;
    currentAction?: string;
  } | null;
  lastScreenshot?: string;
  mousePosition?: { x: number; y: number };
  highlightedElements?: Array<{
    type: string;
    bounds: { x: number; y: number; width: number; height: number };
    label?: string;
  }>;
  executionLog: Array<{
    timestamp: number;
    type: 'info' | 'action' | 'success' | 'error';
    message: string;
  }>;
}

interface AgentVisualizationProps {
  state: AgentState;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRefresh?: () => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function AgentVisualization({
  state,
  onStop,
  onPause,
  onResume,
  onRefresh,
  className = '',
}: AgentVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLog, setShowLog] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 在截图上绘制标注
  useEffect(() => {
    if (!canvasRef.current || !state.lastScreenshot) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      // 绘制截图
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // 绘制鼠标位置
      if (state.mousePosition) {
        ctx.beginPath();
        ctx.arc(state.mousePosition.x, state.mousePosition.y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 鼠标光标图标
        ctx.beginPath();
        ctx.moveTo(state.mousePosition.x, state.mousePosition.y);
        ctx.lineTo(state.mousePosition.x + 8, state.mousePosition.y + 12);
        ctx.lineTo(state.mousePosition.x + 4, state.mousePosition.y + 10);
        ctx.lineTo(state.mousePosition.x + 2, state.mousePosition.y + 16);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }
      
      // 绘制高亮元素
      if (state.highlightedElements) {
        state.highlightedElements.forEach((element, index) => {
          const { bounds, label } = element;
          
          // 绘制边框
          ctx.strokeStyle = index === 0 ? '#22c55e' : '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.setLineDash([]);
          
          // 绘制标签
          if (label) {
            ctx.fillStyle = index === 0 ? '#22c55e' : '#3b82f6';
            ctx.fillRect(bounds.x, bounds.y - 20, ctx.measureText(label).width + 10, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.fillText(label, bounds.x + 5, bounds.y - 6);
          }
        });
      }
    };
    img.src = state.lastScreenshot;
  }, [state.lastScreenshot, state.mousePosition, state.highlightedElements]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-500';
      case 'executing': return 'bg-blue-500';
      case 'paused': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="h-4 w-4" />;
      case 'executing': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const progress = state.currentTask 
    ? Math.round((state.currentTask.currentStep / Math.max(state.currentTask.totalSteps, 1)) * 100)
    : 0;

  return (
    <Card className={`bg-card/95 backdrop-blur-sm border-border shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            电脑代理
            {state.isRunning && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                运行中
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {state.isRunning && (
              <>
                {state.currentTask?.status === 'paused' ? (
                  <Button variant="ghost" size="icon" onClick={onResume}>
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={onPause}>
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onStop}>
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* 当前任务状态 */}
          {state.currentTask && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {state.currentTask.goal}
                </span>
                <Badge className={`${getStatusColor(state.currentTask.status)} text-white`}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(state.currentTask.status)}
                    {state.currentTask.status}
                  </span>
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>进度: {state.currentTask.currentStep}/{state.currentTask.totalSteps}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {state.currentTask.currentAction && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="truncate">{state.currentTask.currentAction}</span>
                </div>
              )}
            </div>
          )}
          
          {/* 屏幕预览 */}
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden border border-border">
            {state.lastScreenshot ? (
              <canvas 
                ref={canvasRef} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无屏幕截图</p>
                </div>
              </div>
            )}
            
            {/* 鼠标位置指示器 */}
            {state.mousePosition && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                <MousePointer2 className="h-3 w-3" />
                {state.mousePosition.x}, {state.mousePosition.y}
              </div>
            )}
          </div>
          
          {/* 执行日志 */}
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowLog(!showLog)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                执行日志
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showLog ? 'rotate-180' : ''}`} />
            </Button>
            
            {showLog && (
              <ScrollArea className="h-32 rounded-md border border-border bg-muted/30">
                <div className="p-2 space-y-1">
                  {state.executionLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      暂无执行记录
                    </p>
                  ) : (
                    state.executionLog.map((log, index) => (
                      <div 
                        key={index}
                        className={`flex items-start gap-2 text-xs p-1.5 rounded ${
                          log.type === 'error' ? 'bg-red-500/10 text-red-500' :
                          log.type === 'success' ? 'bg-green-500/10 text-green-500' :
                          log.type === 'action' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {log.type === 'action' && <MousePointer2 className="h-3 w-3 mt-0.5" />}
                        {log.type === 'success' && <CheckCircle2 className="h-3 w-3 mt-0.5" />}
                        {log.type === 'error' && <XCircle className="h-3 w-3 mt-0.5" />}
                        {log.type === 'info' && <Clock className="h-3 w-3 mt-0.5" />}
                        <span className="flex-1">{log.message}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 辅助组件：操作按钮组
// ─────────────────────────────────────────────────────────────────────

interface ActionButtonsProps {
  onScreenshot?: () => void;
  onAnalyze?: () => void;
  onExecute?: (goal: string) => void;
  disabled?: boolean;
}

export function ActionButtons({ onScreenshot, onAnalyze, onExecute, disabled }: ActionButtonsProps) {
  const [goal, setGoal] = useState('');
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onScreenshot}
        disabled={disabled}
      >
        <Monitor className="h-4 w-4 mr-2" />
        截屏
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAnalyze}
        disabled={disabled}
      >
        <Eye className="h-4 w-4 mr-2" />
        分析屏幕
      </Button>
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          placeholder="输入任务目标..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="flex-1 px-3 py-1 text-sm rounded-md border border-input bg-background"
        />
        <Button 
          size="sm" 
          onClick={() => goal && onExecute?.(goal)}
          disabled={disabled || !goal}
        >
          <Play className="h-4 w-4 mr-2" />
          执行
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export default AgentVisualization;
