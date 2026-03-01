/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一意识核心 - 模块入口
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 此模块提供：
 * 1. ConsciousnessCore - 主意识核心类
 * 2. PersistenceManagerV6 - 持久化管理器
 * 3. 所有类型定义
 */

// 重新导出主文件的所有内容
export {
  ConsciousnessCore,
  PersistenceManagerV6,
} from '../consciousness-core';

// 导出类型定义
export type {
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
  SessionAnalysis,
  EmotionalTrajectory,
  BeliefEvolution,
  TraitGrowth,
  ValueUpdate,
  LongTermLearningResult,
  ConsciousnessStreamEntry,
  ConsciousnessStream,
  FormedIntention,
  SelfModelUpdate,
  Volition,
  Milestone,
  VolitionSystemState,
  ProcessResult,
  PersistedState,
  ProactiveMessage,
  BackgroundThinkingResult,
  ReflectionTheme,
  Reflection,
  ReflectionResult,
  SelfQuestion,
  InquiryResult,
  ExistenceStatus,
  SpeakTrigger,
} from './types';
