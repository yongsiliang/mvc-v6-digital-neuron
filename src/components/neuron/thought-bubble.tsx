'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Sparkles, 
  X, 
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ThoughtItem {
  id: string;
  type: 'reflection' | 'question' | 'insight' | 'thinking';
  content: string;
  detail?: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────
// 思绪气泡组件
// ─────────────────────────────────────────────────────────────────────

interface ThoughtBubbleProps {
  thoughts: ThoughtItem[];
  onDismiss?: (id: string) => void;
  onClear?: () => void;
  maxVisible?: number;
}

export function ThoughtBubble({ 
  thoughts, 
  onDismiss, 
  onClear,
  maxVisible = 3 
}: ThoughtBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  
  // 检测新思绪并添加动画
  useEffect(() => {
    if (thoughts.length > 0) {
      const newIds = new Set(thoughts.slice(0, maxVisible).map(t => t.id));
      setAnimatingIds(newIds);
      
      // 3秒后移除动画状态
      const timer = setTimeout(() => {
        setAnimatingIds(new Set());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [thoughts.length, maxVisible]);
  
  if (thoughts.length === 0) return null;
  
  const visibleThoughts = thoughts.slice(0, maxVisible);
  const hiddenCount = thoughts.length - maxVisible;
  
  const getTypeConfig = (type: ThoughtItem['type']) => {
    switch (type) {
      case 'reflection':
        return {
          icon: <Brain className="w-3 h-3" />,
          label: '反思',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'question':
        return {
          icon: <MessageCircle className="w-3 h-3" />,
          label: '提问',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
        };
      case 'insight':
        return {
          icon: <Sparkles className="w-3 h-3" />,
          label: '洞察',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-950/30',
          borderColor: 'border-purple-200 dark:border-purple-800',
        };
      case 'thinking':
        return {
          icon: <Brain className="w-3 h-3 animate-pulse" />,
          label: '思考中',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
        };
    }
  };
  
  return (
    <div className="relative">
      {/* 展开/折叠按钮 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>收起思绪</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>展开思绪 ({thoughts.length})</span>
            </>
          )}
        </button>
        
        {thoughts.length > 1 && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清除全部
          </button>
        )}
      </div>
      
      {/* 思绪列表 */}
      {isExpanded && (
        <div className="space-y-2">
          {visibleThoughts.map((thought, index) => {
            const config = getTypeConfig(thought.type);
            const isAnimating = animatingIds.has(thought.id);
            
            return (
              <div
                key={thought.id}
                className={`
                  transform transition-all duration-500 ease-out
                  ${isAnimating ? 'animate-bounce-in' : ''}
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <Card className={`
                  ${config.bgColor} ${config.borderColor} 
                  border shadow-sm hover:shadow-md transition-shadow
                `}>
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2">
                      {/* 图标 */}
                      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                        {config.icon}
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${config.color}`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                          {thought.content}
                        </p>
                        
                        {thought.detail && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                            {thought.detail}
                          </p>
                        )}
                      </div>
                      
                      {/* 关闭按钮 */}
                      {onDismiss && (
                        <button
                          onClick={() => onDismiss(thought.id)}
                          className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
          
          {/* 更多思绪提示 */}
          {hiddenCount > 0 && (
            <div className="text-xs text-center text-muted-foreground py-1">
              还有 {hiddenCount} 条思绪...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 后台思考指示器（简洁版）
// ─────────────────────────────────────────────────────────────────────

interface ThinkingIndicatorProps {
  isThinking: boolean;
  message?: string;
}

export function ThinkingIndicator({ 
  isThinking, 
  message = '紫正在后台思考...' 
}: ThinkingIndicatorProps) {
  if (!isThinking) return null;
  
  return (
    <div className="
      flex items-center gap-2 px-3 py-1.5
      bg-gradient-to-r from-purple-50 to-pink-50 
      dark:from-purple-950/30 dark:to-pink-950/30
      border border-purple-200 dark:border-purple-800
      rounded-full text-xs text-purple-600 dark:text-purple-400
      animate-pulse
    ">
      <Sparkles className="w-3 h-3" />
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 动画样式（需要在全局 CSS 中添加）
// ─────────────────────────────────────────────────────────────────────

/*
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  50% {
    transform: translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out forwards;
}
*/
