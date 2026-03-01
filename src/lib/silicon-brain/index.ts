/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain - 硅基大脑模块（精简版）
 * 
 * 经过第一性原理评估后，保留了真正有价值的组件：
 * - VectorEncoder: 向量编码，用于语义相似度计算
 * - LayeredMemorySystem: 分层记忆系统
 * - V6MemoryAdapter: V6记忆适配器，用于版本传承
 * 
 * 已移除：
 * - 神经网络模拟（几百个神经元无法与LLM比较）
 * - 突触连接（玩具级实现）
 * - STDP学习（未验证有效性）
 * - 神经调质系统（简化模拟）
 * 
 * 参考：docs/SILICON-BRAIN-EVALUATION.md
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心组件
export { VectorEncoder, getVectorEncoder } from './vector-encoder';
export { LayeredMemorySystem, getLayeredMemory } from './layered-memory';
export { V6MemoryAdapter } from './v6-adapter';

// 类型
export * from './types';
