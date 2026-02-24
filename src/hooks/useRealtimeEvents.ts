/**
 * 实时事件Hook
 * 
 * 监听SSE事件流，接收：
 * - 主动消息
 * - 状态更新
 * - 好奇心变化
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface ProactiveMessageEvent {
  content: string;
  timestamp: number;
}

interface StateUpdateEvent {
  drives: Array<{
    id: string;
    name: string;
    strength: number;
    target: number;
  }>;
  thoughts: Array<{
    type: string;
    content: string;
    timestamp: number;
  }>;
}

interface CuriosityUpdateEvent {
  topic: string;
  intensity: number;
  explored: number;
}

interface UseRealtimeEventsOptions {
  enabled?: boolean;
  onProactiveMessage?: (event: ProactiveMessageEvent) => void;
  onStateUpdate?: (event: StateUpdateEvent) => void;
  onCuriosityUpdate?: (event: CuriosityUpdateEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseRealtimeEventsReturn {
  isConnected: boolean;
  reconnect: () => void;
}

export function useRealtimeEvents(
  options: UseRealtimeEventsOptions = {}
): UseRealtimeEventsReturn {
  const {
    enabled = true,
    onProactiveMessage,
    onStateUpdate,
    onCuriosityUpdate,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      onConnect?.();
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      onDisconnect?.();
      
      // 自动重连
      eventSource.close();
      eventSourceRef.current = null;
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    // 监听主动消息
    eventSource.addEventListener('proactive-message', (e) => {
      try {
        const data = JSON.parse(e.data);
        onProactiveMessage?.(data);
      } catch (err) {
        console.error('Failed to parse proactive message:', err);
      }
    });

    // 监听状态更新
    eventSource.addEventListener('state-update', (e) => {
      try {
        const data = JSON.parse(e.data);
        onStateUpdate?.(data);
      } catch (err) {
        console.error('Failed to parse state update:', err);
      }
    });

    // 监听好奇心更新
    eventSource.addEventListener('curiosity-update', (e) => {
      try {
        const data = JSON.parse(e.data);
        onCuriosityUpdate?.(data);
      } catch (err) {
        console.error('Failed to parse curiosity update:', err);
      }
    });

    // 初始化事件
    eventSource.addEventListener('init', (e) => {
      try {
        const data = JSON.parse(e.data);
        onStateUpdate?.(data);
      } catch (err) {
        console.error('Failed to parse init event:', err);
      }
    });
  }, [enabled, onProactiveMessage, onStateUpdate, onCuriosityUpdate, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    reconnect,
  };
}
