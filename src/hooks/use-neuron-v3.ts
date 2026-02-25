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
 * 网络拓扑数据类型
 */
export interface NetworkTopologyData {
  neurons: Array<{
    id: string;
    label: string;
    role: string;
    x: number;
    y: number;
    activation: number;
    predictionError: number;
    state: 'active' | 'predicting' | 'surprised' | 'dormant';
  }>;
  connections: Array<{
    from: string;
    to: string;
    weight: number;
    active: boolean;
  }>;
}

/**
 * VSA语义空间数据类型
 */
export interface VSAData {
  concepts: Array<{
    name: string;
    x: number;
    y: number;
    vector: number[];
    similarity: number;
    category: 'core' | 'learned' | 'temporary';
  }>;
  links: Array<{
    from: string;
    to: string;
    similarity: number;
  }>;
}

/**
 * 意识内容数据类型
 */
export interface ConsciousnessData {
  currentContent: {
    id: string;
    type: 'perceptual' | 'semantic' | 'emotional' | 'memory' | 'thought' | 'motor' | 'metacognitive';
    data: unknown;
    source: string;
    enteredAt: number;
    duration: number;
    strength: number;
    broadcast: boolean;
    relatedIds: string[];
  } | null;
  consciousnessLevel: number;
  selfAwarenessIndex: number;
  streamCoherence: number;
  trail: Array<{
    contentId: string;
    timestamp: number;
    type: 'perceptual' | 'semantic' | 'emotional' | 'memory' | 'thought' | 'motor' | 'metacognitive';
    summary: string;
    strength: number;
    duration: number;
  }>;
}

/**
 * 计划数据类型
 */
export interface PlanningData {
  goals: Array<{
    id: string;
    description: string;
    priority: number;
    progress: number;
    status: string;
    subGoals: string[];
  }>;
  activeGoal: {
    id: string;
    description: string;
    priority: number;
  } | null;
}

/**
 * 执行控制数据类型
 */
export interface ExecutiveData {
  attentionMode: 'focus' | 'diffuse' | 'switching';
  currentFocus: string;
  attentionAllocation: Array<{
    module: string;
    allocation: number;
  }>;
  tasks: Array<{
    id: string;
    description: string;
    priority: number;
    urgency: number;
    status: string;
  }>;
  attentionSpotlight: string[];
  timePressure: number;
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
 * 神经元状态（从 SSE 接收）
 */
export interface NeuronStatusData {
  activations: Record<string, number>;
  meaning?: string;
  consciousness?: string;
}

/**
 * 自我认知状态（从 SSE 接收）
 */
export interface SelfCognitiveData {
  consistency: number;
  interpretation: string;
  reflections: string[];
}

/**
 * 后台处理数据类型
 */
export interface BackgroundData {
  stats: {
    patternCount: number;
    processCount: number;
    age: number;
    readinessLevel: number;
  };
  recentIntuitions: Array<{
    type: string;
    strength: number;
    confidence: number;
    timestamp: number;
  }>;
  readiness: {
    primedCount: number;
    predictedNext: string[];
    readinessLevel: number;
    timestamp: number;
  };
}

/**
 * 神经元V3系统Hook
 */
export function useNeuronV3System() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 实时状态（从 SSE 接收）
  const [neuronStatus, setNeuronStatus] = useState<NeuronStatusData | null>(null);
  const [selfCognitive, setSelfCognitive] = useState<SelfCognitiveData | null>(null);

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
    onComplete?: (fullContent: string, summary: string) => void,
    onNeuronStatus?: (status: NeuronStatusData) => void,
    onSelfCognitive?: (cognitive: SelfCognitiveData) => void
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
              
              // 处理神经元状态事件
              if (data.type === 'neuron_status') {
                setNeuronStatus(data.data);
                onNeuronStatus?.(data.data);
              }
              
              // 处理 LLM 内容事件
              if (data.type === 'content') {
                fullContent += data.data;
                onContent?.(data.data);
              }
              
              // 处理自我认知事件
              if (data.type === 'self_cognitive') {
                setSelfCognitive(data.data);
                onSelfCognitive?.(data.data);
              }
              
              // 处理完成事件
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

  // 获取网络拓扑数据
  const fetchNetworkTopology = useCallback(async (): Promise<NetworkTopologyData | null> => {
    try {
      const response = await fetch('/api/neuron-v3/network');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to fetch network topology:', data.error);
        return null;
      }
    } catch (err) {
      console.error('Network topology error:', err);
      return null;
    }
  }, []);

  // 获取VSA语义空间数据
  const fetchVSAData = useCallback(async (): Promise<VSAData | null> => {
    try {
      const response = await fetch('/api/neuron-v3/vsa');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to fetch VSA data:', data.error);
        return null;
      }
    } catch (err) {
      console.error('VSA data error:', err);
      return null;
    }
  }, []);

  // 获取意识内容数据
  const fetchConsciousnessData = useCallback(async (): Promise<ConsciousnessData | null> => {
    try {
      const response = await fetch('/api/neuron-v3/consciousness');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to fetch consciousness data:', data.error);
        return null;
      }
    } catch (err) {
      console.error('Consciousness data error:', err);
      return null;
    }
  }, []);

  // 获取计划数据
  const fetchPlanningData = useCallback(async (): Promise<PlanningData | null> => {
    try {
      const response = await fetch('/api/neuron-v3/planning');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to fetch planning data:', data.error);
        return null;
      }
    } catch (err) {
      console.error('Planning data error:', err);
      return null;
    }
  }, []);

  // 获取执行控制数据
  const fetchExecutiveData = useCallback(async (): Promise<ExecutiveData | null> => {
    try {
      const response = await fetch('/api/neuron-v3/executive');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to fetch executive data:', data.error);
        return null;
      }
    } catch (err) {
      console.error('Executive data error:', err);
      return null;
    }
  }, []);

  // 获取后台处理数据（系统1：直觉、准备状态）
  const fetchBackgroundData = useCallback(async (): Promise<BackgroundData | null> => {
    try {
      const response = await fetch('/api/neuron-v3/background');
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to fetch background data:', data.error);
        return null;
      }
    } catch (err) {
      console.error('Background data error:', err);
      return null;
    }
  }, []);

  return {
    systemState,
    isLoading,
    error,
    // 实时状态（从 SSE 接收）
    neuronStatus,
    selfCognitive,
    // 方法
    fetchSystemState,
    processInput,
    sendFeedback,
    chat,
    fetchNetworkTopology,
    fetchVSAData,
    fetchConsciousnessData,
    fetchPlanningData,
    fetchExecutiveData,
    fetchBackgroundData,
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
