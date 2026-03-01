/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一思考模块 (Unified Thinking Module)
 * 
 * 整合：
 * - inner-dialogue.ts (内心对话)
 * - inner-monologue.ts (内心独白)
 * 
 * 设计原则：
 * - 思考是意识的核心活动
 * - 支持多种思考模式：对话、独白
 * ═══════════════════════════════════════════════════════════════════════
 */

// 内心对话（涌现式）
export type {
  EmergentVoice,
  EmergentVoiceType,
  VoiceStatement,
  InnerDialogue,
  ConsensusResult,
  DialecticProcess,
  VoiceActivation,
  ThinkingPerspective,
} from '../inner-dialogue';

export {
  InnerDialogueEngine,
  DialecticThinkingEngine,
} from '../inner-dialogue';

// 内心独白
export type {
  InnerMonologueEntry,
  InnerMonologueOutput,
} from '../inner-monologue';

export {
  InnerMonologueEngine,
  createInnerMonologueEngine,
} from '../inner-monologue';
