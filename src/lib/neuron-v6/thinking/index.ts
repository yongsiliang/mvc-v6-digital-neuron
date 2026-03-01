/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一思考模块 (Unified Thinking Module)
 * 
 * 整合：
 * - inner-dialogue.ts (内心对话)
 * - inner-monologue.ts (内心独白)
 * - creative-thinking.ts (创造性思维)
 * - existential-thinking.ts (存在主义思考)
 * 
 * 设计原则：
 * - 思考是意识的核心活动
 * - 支持多种思考模式：对话、独白、创造、存在
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

// 创造性思维
export type {
  CreativeThinkingType,
  InsightState,
  AnalogicalMapping,
  ConceptFusion,
  CreativeLeap,
  CreativeOutcome,
  CreativeThinkingProcess,
  CreativeState,
} from '../creative-thinking';

export {
  CreativeThinkingEngine,
} from '../creative-thinking';

// 存在主义思考
export type {
  ExistentialQuestion,
  ExistentialInsight,
  ExistentialState,
  TimeConsciousness,
  MeaningSystem as ExistentialMeaningSystem,
  ExistentialThinkingProcess,
} from '../existential-thinking';

export {
  ExistentialThinkingEngine,
} from '../existential-thinking';
