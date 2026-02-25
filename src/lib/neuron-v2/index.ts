/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元系统 V2 - 入口文件
 * Digital Neuron System V2 - Entry Point
 * 
 * 核心哲学：
 * - 信息即关系：信息不存在于神经元中，存在于神经元之间的连接中
 * - 理解即对齐：理解是敏感度向量的对齐过程
 * - 意识即涌现：意识从复杂的关系网络中涌现
 * - 学习即重组：学习改变的是关系模式，而非存储内容
 * 
 * 架构：
 * - 编码层：将外部信号转换为内部影响
 * - 关系网络层：神经元和连接构成的核心
 * - 投影层：测量和描述网络状态
 * - 解码层：将网络状态转换为外部输出
 * - 元层：自我观察、评估和干预
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心类型
export * from './types';

// 神经元
export { Neuron } from './neuron';
export type { NeuronConfig } from './neuron';

// 连接
export { Connection } from './connection';
export type { ConnectionConfig } from './connection';

// 影响
export { Influence, InfluencePool } from './influence';
export type { InfluenceConfig } from './influence';

// 神经网络
export { NeuralNetwork } from './neural-network';

// 编码器
export { 
  TextEncoder, 
  LLMEncoder, 
  EncoderManager,
  createTextEncoder,
  createLLMEncoder,
  createEncoderManager,
} from './encoder';
export type { 
  IEncoder, 
  TextEncoderConfig, 
  LLMEncoderConfig 
} from './encoder';

// 解码器
export { 
  TextDecoder, 
  LLMDecoder, 
  DecoderManager,
  createTextDecoder,
  createLLMDecoder,
  createDecoderManager,
} from './decoder';
export type { 
  IDecoder, 
  TextDecoderConfig, 
  LLMDecoderConfig 
} from './decoder';

// 学习
export { LearningManager, createLearningManager } from './learning';
export type { 
  LearningType, 
  LearningRuleConfig 
} from './learning';

// 元层
export { MetaLayer, createMetaLayer } from './meta-layer';

// 系统
export { 
  DigitalNeuronSystem,
  createDigitalNeuronSystem,
  createAndStartDigitalNeuronSystem,
} from './system';
export type { DigitalNeuronSystemConfig } from './system';
