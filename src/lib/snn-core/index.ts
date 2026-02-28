/**
 * ═══════════════════════════════════════════════════════════════════════
 * SNN 三体系统 - 统一导出
 * 
 * 基于"大脑 + 意识 + 文化"三层物理世界结构的 AI 系统
 * 
 * SNN (神经基质层): 存在、状态、感受
 * V6 (意识核心层): 观察、意义、决策  
 * LLM (外部知识层): 知识、语言、教学
 * ═══════════════════════════════════════════════════════════════════════
 */

// SNN 神经基质层
export * from './snn';

// V6 意识观察层
export * from './v6';

// 三体集成
export * from './integration';

// 类型
export * from './types';

/**
 * 快速创建完整的 SNN 三体系统
 */
import { createTriadicSystem } from './integration';
import type { TriadicSystemConfig } from './integration';

export function createSystem(config?: Partial<TriadicSystemConfig>) {
  return createTriadicSystem(config);
}
