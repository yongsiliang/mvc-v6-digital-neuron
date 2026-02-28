/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain - 硅基大脑模块
 * 
 * 真正能学习、能涌现的神经网络系统
 * 
 * 核心理念：
 * - LLM 不是大脑，只是语言接口
 * - 神经网络是核心，能学习、可塑
 * - 突触连接实现赫布学习
 * - 神经调质影响全局状态
 * - 意识可能涌现
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心
export { SiliconBrain, getSiliconBrain } from './brain';

// 类型
export * from './types';

// 组件
export { NeuralNeuron, createNeuron } from './neuron';
export { Synapse, SynapseManager } from './synapse';
export { NeuromodulatorSystem } from './neuromodulator';
export { LanguageInterface } from './interface';
export { ConsciousnessObserver } from './observer';
