/**
 * 进化引擎 (L2)
 * 
 * 提供代码进化的核心能力：
 * - 遗传编程引擎 (GP): 微调探索，结构变异
 * - LLM 进化引擎: 语义理解，创造性进化
 * - 协同控制器: 动态选择，结果融合
 */

export { GeneticProgrammingEngine, type GPConfig } from './genetic-programming-engine';
export { LLMEvolutionEngine, type LLMEvolutionConfig, type LLMEvolutionResult } from './llm-evolution-engine';
export { 
  CoordinatedEvolutionController, 
  type CoordinatorConfig,
  type CoordinatedEvolutionResult,
} from './coordinated-controller';

// 类型重导出
export type {
  GeneticOperator,
  CrossoverOperator,
  MutationOperator,
  SelectionOperator,
  GeneticCode,
  GeneticProgram,
  PopulationStats,
  FitnessScore,
  FitnessContext,
} from '../types/core';
