/**
 * 主动性消息Hook
 * 
 * 轮询获取系统的主动消息
 * 当有主动消息时，触发回调
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ProactiveMessage {
  content: string;
  timestamp: number;
}

interface UseProactiveMessagesOptions {
  /** 轮询间隔（毫秒），默认60秒 */
  interval?: number;
  /** 是否启用，默认true */
  enabled?: boolean;
  /** 用户活跃状态（用于决定是否触发） */
  userActive?: boolean;
  /** 用户不活跃时间（毫秒） */
  inactiveThreshold?: number;
}

interface UseProactiveMessagesReturn {
  /** 手动检查 */
  check: () => Promise<void>;
  /** 重置计时器 */
  resetTimer: () => void;
}

export function useProactiveMessages(
  onMessage: (message: ProactiveMessage) => void,
  options: UseProactiveMessagesOptions = {}
): UseProactiveMessagesReturn {
  const {
    interval = 60000,
    enabled = true,
    userActive = true,
    inactiveThreshold = 120000, // 2分钟不活跃
  } = options;

  const lastActivityRef = useRef(Date.now());
  const lastCheckRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 记录用户活动
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // 检查主动消息
  const check = useCallback(async () => {
    if (!enabled || !userActive) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // 只有用户不活跃超过阈值时才检查主动消息
    if (timeSinceLastActivity < inactiveThreshold) {
      return;
    }

    try {
      const res = await fetch('/api/proactivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_messages' }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.messages && data.messages.length > 0) {
          for (const msg of data.messages) {
            onMessage({
              content: msg,
              timestamp: now,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check proactive messages:', error);
    }

    lastCheckRef.current = now;
  }, [enabled, userActive, inactiveThreshold, onMessage]);

  // 设置轮询
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(check, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, check]);

  // 监听用户活动
  useEffect(() => {
    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [resetTimer]);

  return {
    check,
    resetTimer,
  };
}
