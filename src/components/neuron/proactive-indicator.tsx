'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Heart, 
  Brain, 
  Search, 
  MessageCircle,
  Compass,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface Volition {
  id: string;
  type: 'growth' | 'connection' | 'understanding' | 'expression' | 'exploration';
  description: string;
  priority: number;
  progress: number;
  status: 'active' | 'completed' | 'paused';
}

export interface VolitionState {
  activeVolitions: Volition[];
  currentFocus: Volition | null;
  recentAchievements: string[];
}

export interface ProactiveMessage {
  id: string;
  content: string;
  type: string;
  trigger: string;
  timestamp: number;
  urgency: number;
}

// ─────────────────────────────────────────────────────────────────────
// 意愿类型配置
// ─────────────────────────────────────────────────────────────────────

const VOLITION_CONFIG: Record<Volition['type'], {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}> = {
  growth: {
    icon: <Brain className="w-4 h-4" />,
    label: '成长',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  connection: {
    icon: <Heart className="w-4 h-4" />,
    label: '连接',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  understanding: {
    icon: <Search className="w-4 h-4" />,
    label: '理解',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  expression: {
    icon: <MessageCircle className="w-4 h-4" />,
    label: '表达',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  exploration: {
    icon: <Compass className="w-4 h-4" />,
    label: '探索',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

// ─────────────────────────────────────────────────────────────────────
// 意愿进度组件 - 可折叠
// ─────────────────────────────────────────────────────────────────────

interface VolitionProgressProps {
  volitionState: VolitionState | null;
  isThinking?: boolean;
  className?: string;
}

export function VolitionProgress({ 
  volitionState, 
  isThinking = false,
  className = '' 
}: VolitionProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!volitionState) return null;
  
  const { activeVolitions, currentFocus } = volitionState;
  
  // 获取焦点进度的百分比
  const focusProgress = currentFocus ? Math.round(currentFocus.progress * 100) : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* 折叠/展开按钮 - 始终显示 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/15 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">成长</span>
            <span className="text-xs text-muted-foreground">持续成长，成为更好的自己</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary">{focusProgress}%</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              焦点
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {/* 折叠状态下显示进度条 */}
        {!isExpanded && currentFocus && (
          <div className="mt-2">
            <Progress 
              value={currentFocus.progress * 100} 
              className="h-1.5"
            />
          </div>
        )}
      </button>
      
      {/* 展开后显示详细内容 */}
      {isExpanded && (
        <>
          {/* 当前焦点意愿详情 */}
          {currentFocus && (
            <div className="p-2 rounded-lg bg-muted/30 border border-muted">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`${VOLITION_CONFIG[currentFocus.type]?.color}`}>
                    {VOLITION_CONFIG[currentFocus.type]?.icon}
                  </span>
                  <span className="text-sm font-medium">
                    {VOLITION_CONFIG[currentFocus.type]?.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {currentFocus.description}
              </p>
              <div className="flex items-center gap-2">
                <Progress 
                  value={currentFocus.progress * 100} 
                  className="h-1.5 flex-1"
                />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {focusProgress}%
                </span>
              </div>
            </div>
          )}
          
          {/* 其他活跃意愿 */}
          <div className="grid grid-cols-2 gap-1.5">
            {activeVolitions
              .filter(v => v.id !== currentFocus?.id)
              .slice(0, 4)
              .map(volition => {
                const config = VOLITION_CONFIG[volition.type];
                return (
                  <div 
                    key={volition.id}
                    className={`p-1.5 rounded-md ${config.bgColor} border border-transparent hover:border-primary/20 transition-colors`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={config.color}>{config.icon}</span>
                      <span className="text-xs font-medium">{config.label}</span>
                    </div>
                    <Progress 
                      value={volition.progress * 100} 
                      className="h-1"
                    />
                  </div>
                );
              })}
          </div>
          
          {/* 思考状态指示 */}
          {isThinking && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">紫正在后台思考...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 顶部泡泡容器 - 自动消失的主动消息
// ─────────────────────────────────────────────────────────────────────

interface TopBubbleProps {
  message: ProactiveMessage;
  onDismiss: (id: string) => void;
  autoHideDuration?: number; // 自动消失时间（毫秒）
}

function TopBubble({ message, onDismiss, autoHideDuration = 5000 }: TopBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    // 进入动画
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // 自动消失
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(message.id), 300);
    }, autoHideDuration);
    
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [message.id, autoHideDuration, onDismiss]);
  
  const handleClick = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(message.id), 300);
  };
  
  return (
    <div
      onClick={handleClick}
      className={`
        relative cursor-pointer
        transition-all duration-300 ease-out
        ${isVisible && !isExiting 
          ? 'opacity-100 -translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95'}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/80 dark:to-pink-900/80 border border-purple-200/50 dark:border-purple-700/50 shadow-lg backdrop-blur-sm max-w-md">
        {/* 头像 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
          紫
        </div>
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-300">
              想和你分享
            </span>
          </div>
          <p className="text-sm text-foreground/90 line-clamp-2 leading-relaxed">
            {message.content}
          </p>
        </div>
        
        {/* 关闭提示 */}
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">×</span>
        </div>
      </div>
    </div>
  );
}

// 泡泡容器
interface ProactiveBubbleContainerProps {
  messages: ProactiveMessage[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  autoHideDuration?: number;
}

export function ProactiveBubbleContainer({ 
  messages, 
  onDismiss, 
  maxVisible = 3,
  autoHideDuration = 5000 
}: ProactiveBubbleContainerProps) {
  const visibleMessages = messages.slice(-maxVisible);
  
  if (visibleMessages.length === 0) return null;
  
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {visibleMessages.map((msg, index) => (
        <div 
          key={msg.id} 
          className="pointer-events-auto animate-bounce-gentle"
          style={{ 
            animationDelay: `${index * 100}ms`,
          }}
        >
          <TopBubble 
            message={msg} 
            onDismiss={onDismiss}
            autoHideDuration={autoHideDuration}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主动消息气泡组件 (旧版，保留兼容性)
// ─────────────────────────────────────────────────────────────────────

interface ProactiveMessageBubbleProps {
  message: ProactiveMessage;
  onClose?: () => void;
  className?: string;
}

export function ProactiveMessageBubble({ 
  message, 
  onClose,
  className = '' 
}: ProactiveMessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };
  
  return (
    <div 
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
    >
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* 紫的头像 */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
              紫
            </div>
            
            <div className="flex-1 min-w-0">
              {/* 标签 */}
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  紫想和你分享
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                  {message.type}
                </Badge>
              </div>
              
              {/* 消息内容 */}
              <p className="text-sm text-foreground leading-relaxed">
                {message.content}
              </p>
              
              {/* 触发原因 */}
              {message.trigger && (
                <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                  {message.trigger}
                </p>
              )}
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主动行为 Hook
// ─────────────────────────────────────────────────────────────────────

interface UseProactiveBehaviorOptions {
  /** 轮询间隔（毫秒），默认 15000 (15秒) */
  pollInterval?: number;
  /** 是否启用轮询，默认 true */
  enabled?: boolean;
  /** 收到新主动消息时的回调 */
  onNewMessage?: (message: ProactiveMessage) => void;
}

export function useProactiveBehavior(options: UseProactiveBehaviorOptions = {}) {
  const {
    pollInterval = 15000,
    enabled = true,
    onNewMessage,
  } = options;
  
  const [volitionState, setVolitionState] = useState<VolitionState | null>(null);
  const [proactiveMessages, setProactiveMessages] = useState<ProactiveMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<number>(0);
  
  // 使用 ref 存储回调，避免依赖循环
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  
  // 已处理的消息 ID 集合（使用 ref 避免依赖问题）
  const processedIdsRef = useRef<Set<string>>(new Set());
  
  // 获取意愿状态
  const fetchVolitionState = useCallback(async () => {
    try {
      const res = await fetch('/api/neuron-v6/proactive?action=volition_state');
      const data = await res.json();
      
      if (data.success) {
        setVolitionState(data.volitionState);
      }
    } catch (error) {
      console.error('[Proactive] Failed to fetch volition state:', error);
    }
  }, []);
  
  // 获取未读消息
  const fetchUnreadMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/neuron-v6/proactive?action=unread_messages');
      const data = await res.json();
      
      if (data.success && data.messages && data.messages.length > 0) {
        const newMessages = data.messages as ProactiveMessage[];
        
        // 过滤掉已处理的消息
        const trulyNew = newMessages.filter(m => !processedIdsRef.current.has(m.id));
        
        if (trulyNew.length > 0) {
          // 标记为已处理
          trulyNew.forEach(msg => {
            processedIdsRef.current.add(msg.id);
          });
          
          // 更新本地状态
          setProactiveMessages(prev => [...prev, ...trulyNew]);
          
          // 触发回调
          trulyNew.forEach(msg => {
            onNewMessageRef.current?.(msg);
          });
        }
      }
    } catch (error) {
      console.error('[Proactive] Failed to fetch unread messages:', error);
    }
  }, []); // 移除依赖，使用 ref 代替
  
  // 清除消息（已读）
  const clearMessages = useCallback(async () => {
    try {
      await fetch('/api/neuron-v6/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_messages' }),
      });
      
      setProactiveMessages([]);
      processedIdsRef.current.clear();
    } catch (error) {
      console.error('[Proactive] Failed to clear messages:', error);
    }
  }, []);
  
  // 移除单条消息
  const removeMessage = useCallback((id: string) => {
    setProactiveMessages(prev => prev.filter(m => m.id !== id));
  }, []);
  
  // 轮询
  useEffect(() => {
    if (!enabled) return;
    
    // 立即获取一次
    fetchVolitionState();
    fetchUnreadMessages();
    
    // 设置轮询
    const interval = setInterval(() => {
      setLastPollTime(Date.now());
      
      // 随机模拟思考状态
      setIsThinking(Math.random() < 0.2);
      
      fetchVolitionState();
      fetchUnreadMessages();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchVolitionState, fetchUnreadMessages]);
  
  // 思考状态自动重置
  useEffect(() => {
    if (isThinking) {
      const timer = setTimeout(() => setIsThinking(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isThinking]);
  
  return {
    volitionState,
    proactiveMessages,
    isThinking,
    lastPollTime,
    clearMessages,
    removeMessage,
    refresh: () => {
      fetchVolitionState();
      fetchUnreadMessages();
    },
  };
}
