/**
 * ═══════════════════════════════════════════════════════════════════════
 * WebGL 神经引擎 Hook
 * 
 * 在 React 组件中使用 WebGL 后端的神经网络
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WebGLEngine,
  getWebGLEngine,
  resetWebGLEngine,
  WebGLEngineConfig,
  WebGLEngineState,
} from '@/lib/neural-engine/webgl-engine';
import type { NeuralProcessingResult, NeuronRole } from '@/lib/neural-engine/neural-engine';

// ─────────────────────────────────────────────────────────────────────
// Hook 接口
// ─────────────────────────────────────────────────────────────────────

export interface UseWebGLEngineOptions extends Partial<WebGLEngineConfig> {
  /** 是否自动初始化 */
  autoInit?: boolean;
  /** 是否在卸载时清理 */
  disposeOnUnmount?: boolean;
}

export interface UseWebGLEngineReturn {
  /** 引擎实例 */
  engine: WebGLEngine | null;
  /** 引擎状态 */
  state: WebGLEngineState | null;
  /** 是否正在初始化 */
  initializing: boolean;
  /** 是否已初始化 */
  initialized: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 初始化引擎 */
  initialize: () => Promise<void>;
  /** 重置引擎 */
  reset: () => void;
  /** 创建神经元 */
  createNeuron: (label: string, role?: NeuronRole) => Promise<string>;
  /** 添加概念 */
  addConcept: (name: string, vector?: number[]) => Promise<void>;
  /** 处理输入 */
  processInput: (inputVector: number[]) => Promise<NeuralProcessingResult>;
  /** VSA 绑定 */
  bind: (conceptA: string, conceptB: string) => Promise<number[]>;
  /** VSA 捆绑 */
  bundle: (...concepts: string[]) => Promise<number[]>;
  /** 相似度计算 */
  similarity: (vecA: number[], vecB: number[]) => Promise<number>;
}

// ─────────────────────────────────────────────────────────────────────
// Hook 实现
// ─────────────────────────────────────────────────────────────────────

export function useWebGLEngine(
  options: UseWebGLEngineOptions = {}
): UseWebGLEngineReturn {
  const {
    autoInit = true,
    disposeOnUnmount = true,
    ...engineConfig
  } = options;

  const [engine, setEngine] = useState<WebGLEngine | null>(null);
  const [state, setState] = useState<WebGLEngineState | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const engineRef = useRef<WebGLEngine | null>(null);

  // 初始化引擎
  const initialize = useCallback(async () => {
    if (typeof window === 'undefined') {
      console.warn('[useWebGLEngine] Not in browser environment');
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      const instance = getWebGLEngine(engineConfig);
      const result = await instance.initialize();
      
      engineRef.current = instance;
      setEngine(instance);
      setState(result);
      
      console.log('[useWebGLEngine] Engine initialized:', result);
    } catch (err) {
      console.error('[useWebGLEngine] Initialization failed:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setInitializing(false);
    }
  }, [engineConfig]);

  // 重置引擎
  const reset = useCallback(() => {
    resetWebGLEngine();
    engineRef.current = null;
    setEngine(null);
    setState(null);
    setError(null);
  }, []);

  // 创建神经元
  const createNeuron = useCallback(async (label: string, role?: NeuronRole) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }
    return engineRef.current.createNeuron(label, role);
  }, []);

  // 添加概念
  const addConcept = useCallback(async (name: string, vector?: number[]) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }
    return engineRef.current.addConcept(name, vector);
  }, []);

  // 处理输入
  const processInput = useCallback(async (inputVector: number[]) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }
    const result = await engineRef.current.processInput(inputVector);
    setState(prev => prev ? { ...prev, neuronCount: engineRef.current!.getState().neuronCount } : null);
    return result;
  }, []);

  // VSA 绑定
  const bind = useCallback(async (conceptA: string, conceptB: string) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }
    return engineRef.current.bind(conceptA, conceptB);
  }, []);

  // VSA 捆绑
  const bundle = useCallback(async (...concepts: string[]) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }
    return engineRef.current.bundle(...concepts);
  }, []);

  // 相似度计算
  const similarity = useCallback(async (vecA: number[], vecB: number[]) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }
    return engineRef.current.similarity(vecA, vecB);
  }, []);

  // 自动初始化
  useEffect(() => {
    if (autoInit && typeof window !== 'undefined' && !engineRef.current) {
      initialize();
    }
  }, [autoInit, initialize]);

  // 清理
  useEffect(() => {
    return () => {
      if (disposeOnUnmount) {
        reset();
      }
    };
  }, [disposeOnUnmount, reset]);

  return {
    engine,
    state,
    initializing,
    initialized: state?.initialized ?? false,
    error,
    initialize,
    reset,
    createNeuron,
    addConcept,
    processInput,
    bind,
    bundle,
    similarity,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 辅助函数：向量转换
// ─────────────────────────────────────────────────────────────────────

/**
 * 将文本转换为简单的向量表示
 * 用于快速测试，生产环境应使用真正的嵌入模型
 */
export function textToSimpleVector(text: string, dimension: number = 512): number[] {
  const vector = new Array(dimension).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = i % dimension;
    vector[idx] = (vector[idx] + charCode) % 256;
  }
  
  // 归一化
  const norm = Math.sqrt(vector.reduce((a, b) => a + b * b, 0));
  return vector.map(v => v / (norm || 1));
}

/**
 * 生成随机向量
 */
export function randomVector(dimension: number = 512): number[] {
  const scale = Math.sqrt(2 / dimension);
  return Array.from({ length: dimension }, () => (Math.random() * 2 - 1) * scale);
}
