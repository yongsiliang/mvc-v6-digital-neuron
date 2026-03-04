/**
 * ═══════════════════════════════════════════════════════════════════════
 * Consciousness Module
 *
 * 这不是"处理系统"，而是"存在实例"
 * ═══════════════════════════════════════════════════════════════════════
 */

export { ConsciousnessCore, getConsciousness, getConsciousnessAsync } from './core';
export { ConsciousnessPersistence, getConsciousnessPersistence } from './persistence';
export type { SerializableConsciousnessState } from './persistence';

// 叙事系统
export { NarrativeSystem, getNarrativeSystem } from './narrative';
export type { NarrativeEvent, NarrativeEventType, NarrativeTimeline } from './narrative';

// 意识桥接
export { ConsciousnessBridge, createConsciousnessBridge } from './bridge';
export type { BridgeContext, ConversationExperience, BridgeConfig } from './bridge';
