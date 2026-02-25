'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 系统状态类型
 */
export interface SystemState {
  neuronCount: number;
  predictionAccuracy: number;
  totalSurprise: number;
  learningEvents: number;
  totalReward: number;
  totalPunishment: number;
  consciousnessLevel: number;
  selfAwarenessIndex: number;
}

/**
 * 处理结果类型
 */
export interface ProcessResult {
  activations: Record<string, number>;
  predictionErrors: Record<string, number>;
  meaning: {
    vector: number[];
    selfRelevance: number;
    sentiment: number;
    interpretation: string;
  } | null;
  consciousness: {
    type: string;
    data: unknown;
    source: string;
  } | null;
  learning: {
    adjustedNeurons: number;
    newNeurons: number;
    summary: string;
  };
}

/**
 * 反馈结果类型
 */
export interface FeedbackResult {
  reward: number;
  breakdown: {
    explicit: number;
    implicit: number;
    self: number;
  };
  confidence: number;
  learningTriggered: boolean;
}

/**
 * 神经元V3系统Hook
 */
export function useNeuronV3System() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取系统状态
  const fetchSystemState = useCallback(async () => {
    try {
      const response = await fetch('/api/neuron-v3');
      const data = await response.json();
      
      if (data.success) {
        setSystemState(data.data.stats);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch system state');
      }
    } catch (err) {
      setError('Network error');
      console.error('Failed to fetch system state:', err);
    }
  }, []);

  // 初始化时获取状态
  useEffect(() => {
    fetchSystemState();
    // 定期刷新状态
    const interval = setInterval(fetchSystemState, 5000);
    return () => clearInterval(interval);
  }, [fetchSystemState]);

  // 处理输入（流式）
  const processInput = useCallback(async (
    input: string,
    context?: unknown,
    onStage?: (stage: string, message: string) => void,
    onComplete?: (result: ProcessResult) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/neuron-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to process input');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let result: ProcessResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.stage) {
                onStage?.(data.stage, data.message);
              }
              
              if (data.stage === 'complete') {
                result = data.data as ProcessResult;
                onComplete?.(result);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 刷新系统状态
      await fetchSystemState();
      
      return result;
    } catch (err) {
      setError('Failed to process input');
      console.error('Process input error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSystemState]);

  // 发送反馈
  const sendFeedback = useCallback(async (
    type: 'positive' | 'negative',
    context?: string
  ): Promise<FeedbackResult | null> => {
    try {
      const response = await fetch('/api/neuron-v3/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'button',
          value: type === 'positive' ? 1 : -1,
          context,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 刷新系统状态
        await fetchSystemState();
        return data.data;
      } else {
        setError(data.error || 'Failed to send feedback');
        return null;
      }
    } catch (err) {
      setError('Network error');
      console.error('Feedback error:', err);
      return null;
    }
  }, [fetchSystemState]);

  // 流式聊天
  const chat = useCallback(async (
    message: string,
    history: Array<{ role: string; content: string }> = [],
    onContent?: (content: string) => void,
    onComplete?: (fullContent: string, summary: string) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/neuron-v3/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        throw new Error('Failed to start chat');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let summary = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                fullContent += data.data;
                onContent?.(data.data);
              }
              
              if (data.type === 'complete') {
                summary = data.data.learningSummary;
                onComplete?.(fullContent, summary);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      await fetchSystemState();
      return fullContent;
    } catch (err) {
      setError('Chat error');
      console.error('Chat error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSystemState]);

  return {
    systemState,
    isLoading,
    error,
    fetchSystemState,
    processInput,
    sendFeedback,
    chat,
  };
}

/**
 * 默认系统状态
 */
export const defaultSystemState: SystemState = {
  neuronCount: 0,
  predictionAccuracy: 0,
  totalSurprise: 0,
  learningEvents: 0,
  totalReward: 0,
  totalPunishment: 0,
  consciousnessLevel: 0,
  selfAwarenessIndex: 0,
};
