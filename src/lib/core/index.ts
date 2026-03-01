/**
 * ═══════════════════════════════════════════════════════════════════════
 * 贾维斯核心系统 - 入口文件
 * Jarvis Core System - Entry Point
 * 
 * 从第一性原理设计的最小核心系统
 * 
 * 核心公式:
 * J = (U, W, π)
 * 
 * 其中:
 * - U = User State (用户状态)
 * - W = World State (世界状态)  
 * - π = Policy (策略函数)
 * 
 * 核心循环:
 * process(m) = respond(execute(plan(recall(understand(m)))))
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心类型
export type {
  UserState,
  PreferenceEntry,
  Goal,
  Experience,
  Relationship,
  EntityRelation,
  WorldState,
  WorldEntity,
  WorldRelation,
  ActionCapability,
  SystemPolicy,
  Intent,
  IntentType,
  MemoryContext,
  MemoryItem,
  Action,
  ActionType,
  ActionResult,
  Interaction,
  StateUpdate,
  PolicyParameters,
  ProcessResult,
  JarvisCore,
} from './types';

// 核心实现
export {
  createJarvis,
  createInitialUserState,
  createInitialWorldState,
} from './jarvis';

// ═══════════════════════════════════════════════════════════════════════
// 使用示例
// ═══════════════════════════════════════════════════════════════════════

/**
 * 使用示例:
 * 
 * ```typescript
 * import { createJarvis } from '@/lib/core';
 * import { LLMGateway } from '@/lib/neuron-v6/core/llm-gateway';
 * 
 * // 获取LLM Gateway实例
 * const llmGateway = LLMGateway.getInstance();
 * llmGateway.initialize(headers); // 需要初始化headers
 * 
 * // 创建贾维斯实例
 * const jarvis = createJarvis({
 *   userName: '张三',
 *   llmGateway,
 * });
 * 
 * // 处理消息
 * const result = await jarvis.process('你好，我想学习TypeScript');
 * console.log(result.response);
 * 
 * // 提供反馈
 * await jarvis.provideFeedback({
 *   interactionId: result.details.intent.id,
 *   type: 'positive',
 *   rating: 0.9,
 * });
 * 
 * // 获取状态
 * const state = jarvis.getState();
 * console.log(state.user);
 * 
 * // 导出/导入状态
 * const exported = await jarvis.exportState();
 * await jarvis.importState(exported);
 * ```
 * 
 * 架构对比:
 * 
 * 旧架构 (46个模块):
 * ├── consciousness-core.ts
 * ├── layered-memory.ts
 * ├── metacognition.ts
 * ├── emotion-system.ts
 * ├── ... (42个更多)
 * 
 * 新架构 (2个模块):
 * ├── types.ts (类型定义)
 * └── jarvis.ts (核心实现)
 * 
 * 核心理念:
 * 
 * 1. 用户状态 (User State) - 完整的用户建模
 *    - 偏好向量 P
 *    - 目标树 G
 *    - 经验轨迹 H
 *    - 关系网络 R
 * 
 * 2. 世界状态 (World State) - 世界建模
 *    - 实体 E
 *    - 关系 R
 *    - 可观察状态 O
 *    - 可用动作 A
 * 
 * 3. 策略函数 (Policy) - 决策系统
 *    - understandIntent: 意图理解
 *    - recallMemory: 记忆检索
 *    - planActions: 动作规划
 *    - executeAction: 动作执行
 *    - generateResponse: 响应生成
 *    - updateState: 状态更新
 *    - learn: 学习改进
 */
