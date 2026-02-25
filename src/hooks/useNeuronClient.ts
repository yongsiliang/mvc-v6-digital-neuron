/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元客户端 Hook
 * Neuron Client Hook
 * 
 * 功能：
 * - 提供统一的 API 调用接口
 * - 处理加载状态和错误
 * - 支持自动保存
 * - 集成记忆服务（对话记忆、上下文回忆）
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getOrCreateUserId, 
  getUserPreferences,
  getUserInfo,
  UserInfo,
  UserPreferences,
} from '@/lib/neuron-v2/auth';
import {
  MemoryIntegrationService,
  createMemoryIntegrationService,
  MemoryContext,
  ConversationMemory,
} from '@/lib/neuron-v2/memory-integration';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface NeuronInfo {
  id: string;
  label: string | null;
  functionalRole: string;
  activation: number;
}

interface ConnectionInfo {
  id: string;
  from: string;
  to: string;
  strength: number;
  type: string;
}

interface MemoryInfo {
  id: string;
  content: string;
  type: string;
  importance: number;
  createdAt: string;
}

interface NeuronState {
  neurons: NeuronInfo[];
  connections: ConnectionInfo[];
  memories: MemoryInfo[];
  selfModel: any;
  stats: {
    neuronCount: number;
    connectionCount: number;
    memoryCount: number;
  };
}

interface UseNeuronClientOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  onStateChange?: (state: NeuronState) => void;
  onError?: (error: Error) => void;
}

// ─────────────────────────────────────────────────────────────────────
// Hook 实现
// ─────────────────────────────────────────────────────────────────────

export function useNeuronClient(options: UseNeuronClientOptions = {}) {
  const {
    autoSave = true,
    autoSaveInterval = 30000,
    onStateChange,
    onError,
  } = options;

  // 状态
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [state, setState] = useState<NeuronState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<NeuronState | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // 内部方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 发送 API 请求
   */
  const apiCall = useCallback(async <T,>(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> => {
    if (!userId) {
      throw new Error('User not initialized');
    }

    const response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }, [userId]);

  /**
   * 处理错误
   */
  const handleError = useCallback((err: Error) => {
    console.error('Neuron client error:', err);
    setError(err);
    onError?.(err);
  }, [onError]);

  // ─────────────────────────────────────────────────────────────────
  // 公共方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 初始化
   */
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 获取或创建用户ID
      const id = getOrCreateUserId();
      setUserId(id);
      
      // 获取用户信息
      const info = getUserInfo();
      setUserInfo(info);
      
      // 加载状态
      const response = await apiCall<{ success: boolean; data: NeuronState }>(
        '/api/neuron/state',
        'GET'
      );
      
      if (response.success) {
        setState(response.data);
        pendingStateRef.current = response.data;
        onStateChange?.(response.data);
      }
      
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, handleError, onStateChange]);

  /**
   * 记住内容
   */
  const remember = useCallback(async (
    content: string,
    options?: {
      type?: 'episodic' | 'semantic' | 'procedural' | 'emotional';
      importance?: number;
      tags?: string[];
    }
  ): Promise<{ memoryId: string; content: string; createdAt: string }> => {
    try {
      setIsLoading(true);
      
      const response = await apiCall<{
        success: boolean;
        data: { memoryId: string; content: string; createdAt: string };
      }>('/api/neuron/memory', 'POST', {
        action: 'remember',
        content,
        ...options,
      });

      // 刷新状态
      await initialize();
      
      return response.data;
    } catch (err) {
      handleError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, handleError, initialize]);

  /**
   * 回忆内容
   */
  const recall = useCallback(async (
    cue: string,
    limit: number = 10
  ): Promise<MemoryInfo[]> => {
    try {
      setIsLoading(true);
      
      const response = await apiCall<{
        success: boolean;
        data: { cue: string; matches: MemoryInfo[]; count: number };
      }>('/api/neuron/memory', 'POST', {
        action: 'recall',
        cue,
        limit,
      });
      
      return response.data.matches;
    } catch (err) {
      handleError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, handleError]);

  /**
   * 忘记内容
   */
  const forget = useCallback(async (memoryId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      await apiCall('/api/neuron/memory', 'POST', {
        action: 'forget',
        memoryId,
      });
      
      // 刷新状态
      await initialize();
      
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, handleError, initialize]);

  /**
   * 获取所有记忆
   */
  const getMemories = useCallback(async (): Promise<MemoryInfo[]> => {
    try {
      const response = await apiCall<{
        success: boolean;
        data: { memories: MemoryInfo[]; count: number };
      }>('/api/neuron/memory', 'GET');
      
      return response.data.memories;
    } catch (err) {
      handleError(err as Error);
      return [];
    }
  }, [apiCall, handleError]);

  /**
   * 手动保存状态
   */
  const save = useCallback(async (newState?: Partial<NeuronState>): Promise<boolean> => {
    try {
      const stateToSave = newState ? { ...state, ...newState } : state;
      
      if (!stateToSave) {
        return false;
      }
      
      setIsLoading(true);
      
      await apiCall('/api/neuron/save', 'POST', stateToSave);
      
      return true;
    } catch (err) {
      handleError(err as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, handleError, state]);

  /**
   * 更新状态（用于自动保存）
   */
  const updateState = useCallback((newState: Partial<NeuronState>) => {
    setState(prev => {
      const updated = prev ? { ...prev, ...newState } : null;
      pendingStateRef.current = updated;
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // 生命周期
  // ─────────────────────────────────────────────────────────────────

  // 初始化
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 自动保存
  useEffect(() => {
    if (!autoSave || !isInitialized) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (pendingStateRef.current) {
        save(pendingStateRef.current);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, autoSaveInterval, isInitialized, save]);

  // 页面关闭时保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingStateRef.current) {
        // 使用 sendBeacon 确保请求被发送
        const blob = new Blob([JSON.stringify(pendingStateRef.current)], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/neuron/save', blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // 记忆集成服务
  // ─────────────────────────────────────────────────────────────────

  const memoryIntegrationRef = useRef<MemoryIntegrationService | null>(null);

  // 初始化记忆集成服务
  useEffect(() => {
    if (userId) {
      memoryIntegrationRef.current = createMemoryIntegrationService({
        maxRelevantMemories: 5,
        importanceThreshold: 0.3,
      });
      memoryIntegrationRef.current.setUserId(userId);
    }
  }, [userId]);

  /**
   * 记住对话（增强版）
   * 
   * 自动提取关键点、主题、情感，并计算重要性
   */
  const rememberConversation = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    context?: {
      previousMessages?: Array<{ role: string; content: string }>;
      topics?: string[];
    }
  ): Promise<ConversationMemory | null> => {
    if (!memoryIntegrationRef.current) return null;
    
    try {
      return await memoryIntegrationRef.current.rememberConversation(role, content, context);
    } catch (err) {
      console.error('Failed to remember conversation:', err);
      return null;
    }
  }, []);

  /**
   * 回忆对话上下文
   * 
   * 获取与当前输入相关的历史记忆，用于增强对话
   */
  const recallConversationContext = useCallback(async (
    query: string
  ): Promise<MemoryContext | null> => {
    if (!memoryIntegrationRef.current) return null;
    
    try {
      return await memoryIntegrationRef.current.recallRelevantMemories(query);
    } catch (err) {
      console.error('Failed to recall context:', err);
      return null;
    }
  }, []);

  /**
   * 构建对话上下文提示
   * 
   * 将记忆上下文转换为可用的提示文本
   */
  const buildContextPrompt = useCallback((context: MemoryContext): string => {
    if (!memoryIntegrationRef.current) return '';
    return memoryIntegrationRef.current.buildContextPrompt(context);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // 返回
  // ─────────────────────────────────────────────────────────────────

  return {
    // 状态
    userId,
    userInfo,
    state,
    isLoading,
    error,
    isInitialized,
    
    // 基础方法
    initialize,
    remember,
    recall,
    forget,
    getMemories,
    save,
    updateState,
    
    // 记忆集成方法（新增）
    rememberConversation,
    recallConversationContext,
    buildContextPrompt,
    
    // 清除错误
    clearError: () => setError(null),
  };
}

// ─────────────────────────────────────────────────────────────────────
// 辅助 Hook
// ─────────────────────────────────────────────────────────────────────

/**
 * 使用用户偏好设置
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    setPreferences(getUserPreferences());
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    const { updateUserPreferences } = require('@/lib/neuron-v2/auth');
    updateUserPreferences(prefs);
    setPreferences(prev => prev ? { ...prev, ...prefs } : null);
  }, []);

  return { preferences, updatePreferences };
}

/**
 * 使用记忆搜索
 */
export function useMemorySearch() {
  const [results, setResults] = useState<MemoryInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { recall } = useNeuronClient();

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const memories = await recall(query);
      setResults(memories);
    } finally {
      setIsSearching(false);
    }
  }, [recall]);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, isSearching, search, clear };
}
