'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Lightbulb, Heart, Brain, MessageCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface DanmakuMessage {
  id: string;
  content: string;
  type: 'insight' | 'emotion' | 'thought' | 'question' | 'sharing';
  timestamp: number;
}

interface DanmakuItemProps {
  message: DanmakuMessage;
  onComplete: (id: string) => void;
  topPosition: number;
  duration: number;
}

// ─────────────────────────────────────────────────────────────────────
// 弹幕单项组件
// ─────────────────────────────────────────────────────────────────────

function DanmakuItem({ message, onComplete, topPosition, duration }: DanmakuItemProps) {
  const [position, setPosition] = useState(-20); // 从右边屏幕外开始
  
  // 获取图标
  const getIcon = () => {
    switch (message.type) {
      case 'insight':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'emotion':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'thought':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'question':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };
  
  // 获取背景色
  const getBgStyle = () => {
    switch (message.type) {
      case 'insight':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30';
      case 'emotion':
        return 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/30';
      case 'thought':
        return 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-500/30';
      case 'question':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default:
        return 'bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30';
    }
  };
  
  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      // 从-20%（右边屏幕外）移动到120%（左边屏幕外）
      const newPosition = -20 + progress * (120 + 20);
      
      if (newPosition > 120) {
        onComplete(message.id);
      } else {
        setPosition(newPosition);
        requestAnimationFrame(animate);
      }
    };
    
    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [message.id, duration, onComplete]);
  
  return (
    <div
      className={`fixed z-[100] flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm shadow-lg transition-opacity pointer-events-none ${getBgStyle()}`}
      style={{
        top: `${topPosition}px`,
        left: `${position}%`,
      }}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {message.content}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 弹幕容器组件
// ─────────────────────────────────────────────────────────────────────

interface DanmakuContainerProps {
  messages: DanmakuMessage[];
  onMessageComplete?: (id: string) => void;
  maxVisible?: number;
  duration?: number; // 毫秒
  topOffset?: number; // 顶部偏移
  spacing?: number; // 弹幕间距
}

export function DanmakuContainer({
  messages,
  onMessageComplete,
  maxVisible = 5,
  duration = 12000, // 12秒穿过屏幕
  topOffset = 80, // 头部下方
  spacing = 50, // 弹幕间距
}: DanmakuContainerProps) {
  const [visibleMessages, setVisibleMessages] = useState<DanmakuMessage[]>([]);
  const [positionMap, setPositionMap] = useState<Map<string, number>>(new Map());
  const usedPositionsRef = useRef<Set<number>>(new Set());
  
  // 添加新消息到可见列表
  useEffect(() => {
    if (messages.length === 0) return;
    
    // 找出还没显示的消息
    const newMessages = messages.filter(
      m => !visibleMessages.find(vm => vm.id === m.id)
    );
    
    if (newMessages.length > 0 && visibleMessages.length < maxVisible) {
      const toAdd = newMessages[0];
      
      // 找一个可用的位置
      let position = topOffset;
      for (let i = 0; i < maxVisible; i++) {
        const testPos = topOffset + i * spacing;
        if (!usedPositionsRef.current.has(testPos)) {
          position = testPos;
          break;
        }
      }
      
      usedPositionsRef.current.add(position);
      setPositionMap(prev => new Map(prev).set(toAdd.id, position));
      setVisibleMessages(prev => [...prev, toAdd]);
    }
  }, [messages, visibleMessages, maxVisible, topOffset, spacing]);
  
  // 消息完成回调
  const handleComplete = useCallback((id: string) => {
    setVisibleMessages(prev => prev.filter(m => m.id !== id));
    setPositionMap(prev => {
      const pos = prev.get(id);
      if (pos !== undefined) {
        usedPositionsRef.current.delete(pos);
      }
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    onMessageComplete?.(id);
  }, [onMessageComplete]);
  
  return (
    <div className="pointer-events-none">
      {visibleMessages.map(message => (
        <DanmakuItem
          key={message.id}
          message={message}
          onComplete={handleComplete}
          topPosition={positionMap.get(message.id) || topOffset}
          duration={duration}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 简化版弹幕组件（直接使用CSS动画）
// ─────────────────────────────────────────────────────────────────────

interface SimpleDanmakuProps {
  messages: DanmakuMessage[];
  onMessageExpire?: (id: string) => void;
}

export function SimpleDanmaku({ messages, onMessageExpire }: SimpleDanmakuProps) {
  const [displayMessages, setDisplayMessages] = useState<DanmakuMessage[]>([]);
  
  useEffect(() => {
    // 添加新消息
    const newMessages = messages.filter(
      m => !displayMessages.find(dm => dm.id === m.id)
    );
    
    if (newMessages.length > 0) {
      setDisplayMessages(prev => [...prev, ...newMessages.slice(0, 2)]); // 最多同时添加2条
    }
  }, [messages, displayMessages]);
  
  // 移除过期消息
  const removeMessage = useCallback((id: string) => {
    setDisplayMessages(prev => prev.filter(m => m.id !== id));
    onMessageExpire?.(id);
  }, [onMessageExpire]);
  
  const getIcon = (type: DanmakuMessage['type']) => {
    switch (type) {
      case 'insight':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
      case 'emotion':
        return <Heart className="w-3.5 h-3.5 text-pink-500" />;
      case 'thought':
        return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'question':
        return <MessageCircle className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-primary" />;
    }
  };
  
  const getStyle = (type: DanmakuMessage['type']) => {
    switch (type) {
      case 'insight':
        return 'bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-300';
      case 'emotion':
        return 'bg-pink-500/15 border-pink-500/25 text-pink-700 dark:text-pink-300';
      case 'thought':
        return 'bg-purple-500/15 border-purple-500/25 text-purple-700 dark:text-purple-300';
      case 'question':
        return 'bg-blue-500/15 border-blue-500/25 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-primary/15 border-primary/25 text-foreground';
    }
  };
  
  return (
    <div className="fixed top-16 left-0 right-0 z-40 pointer-events-none overflow-hidden h-32">
      <div className="relative w-full h-full">
        {displayMessages.map((msg, index) => (
          <div
            key={msg.id}
            className={`absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm shadow-md whitespace-nowrap animate-danmaku-${index % 3}`}
            style={{
              top: `${16 + (index % 3) * 36}px`,
              animation: `danmaku-slide-${index % 3} ${10 + index * 2}s linear forwards`,
            }}
            onAnimationEnd={() => removeMessage(msg.id)}
          >
            {getIcon(msg.type)}
            <span className={`text-sm font-medium ${getStyle(msg.type)}`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes danmaku-slide-0 {
          from { transform: translateX(100vw); }
          to { transform: translateX(-100%); }
        }
        @keyframes danmaku-slide-1 {
          from { transform: translateX(100vw); }
          to { transform: translateX(-100%); }
        }
        @keyframes danmaku-slide-2 {
          from { transform: translateX(100vw); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

export default DanmakuContainer;
