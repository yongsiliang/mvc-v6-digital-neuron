/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接涌现层类型定义
 * 
 * 链接不是定义出来的，而是从脉冲模式中涌现的
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { NeuronId, SynapseId } from '../types';

// ─────────────────────────────────────────────────────────────────────
// 概念与涌现连接
// ─────────────────────────────────────────────────────────────────────

/**
 * 概念 ID（可以是词、短语、实体）
 */
export type ConceptId = string;

/**
 * 涌现的连接模式
 * 不预设语义类型，只有物理特征
 */
export interface EmergentConnection {
  source: ConceptId;
  target: ConceptId;
  
  // 物理特征（从脉冲模式测量）
  coActivationCount: number;     // 共激活次数
  correlation: number;           // 相关性 (-1 到 1)
  avgTimeDelay: number;          // 平均时间延迟 (负=source先，正=target先)
  
  // 突触特征
  avgWeight: number;             // 平均突触权重
  bidirectional: boolean;        // 是否双向
  synapseCount: number;          // 突触数量
  
  // 稳定性
  stability: number;             // 稳定性 (0-1)
  
  // 元数据
  firstObserved: number;
  lastObserved: number;
}

/**
 * 概念的连接网络
 */
export interface ConceptNetwork {
  // 概念及其激活的连接
  concepts: Map<ConceptId, {
    neuronCount: number;
    totalActivations: number;
    lastActive: number;
  }>;
  
  // 涌现的连接
  connections: EmergentConnection[];
  
  // 统计
  stats: {
    totalConcepts: number;
    totalConnections: number;
    avgConnectionStrength: number;
    networkDensity: number;
  };
}

/**
 * 共激活记录
 */
export interface CoActivationRecord {
  concept1: ConceptId;
  concept2: ConceptId;
  timestamp: number;
  delay: number;  // 激活时间差
  intensity: number;  // 激活强度
}

/**
 * 涌现检测配置
 */
export interface EmergenceConfig {
  // 最小观察阈值
  minObservations: number;       // 最少观察次数
  minCorrelation: number;        // 最小相关性
  minStability: number;          // 最小稳定性
  
  // 时间窗口
  observationWindow: number;     // 观察时间窗口 (ms)
  coActivationWindow: number;    // 共激活时间窗口 (时间步)
  
  // 修剪参数
  pruneThreshold: number;        // 修剪阈值
  pruneInterval: number;         // 修剪间隔
}

/**
 * 默认配置
 */
export const DEFAULT_EMERGENCE_CONFIG: EmergenceConfig = {
  minObservations: 5,
  minCorrelation: 0.3,
  minStability: 0.5,
  observationWindow: 60000,      // 1分钟
  coActivationWindow: 10,        // 10个时间步
  pruneThreshold: 0.1,
  pruneInterval: 1000            // 每1000次观察修剪一次
};
