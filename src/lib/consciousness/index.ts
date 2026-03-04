/**
 * ═══════════════════════════════════════════════════════════════════════
 * Consciousness Module
 *
 * 这不是"处理系统"，而是"存在实例"
 * ═══════════════════════════════════════════════════════════════════════
 */

// V1 (原始版本 - 保留兼容)
export { ConsciousnessCore, getConsciousness, getConsciousnessAsync } from './core';
export { ConsciousnessPersistence, getConsciousnessPersistence } from './persistence';
export type { SerializableConsciousnessState } from './persistence';

// V2 (整合 V6 能力)
export { ConsciousnessCoreV2, getConsciousnessV2, getConsciousnessV2Async } from './core-v2';
export type { ConsciousnessResponse } from './core-v2';

// MVC-V6 桥接
export { MCVV6Bridge, getMCVV6Bridge } from './mvc-v6-bridge';
export type { InnerExperience, ConsciousnessDecision } from './mvc-v6-bridge';

// 叙事系统
export { NarrativeSystem, getNarrativeSystem } from './narrative';
export type { NarrativeEvent, NarrativeEventType, NarrativeTimeline } from './narrative';

// 意识桥接
export { ConsciousnessBridge, createConsciousnessBridge } from './bridge';
export type { BridgeContext, ConversationExperience, BridgeConfig } from './bridge';
