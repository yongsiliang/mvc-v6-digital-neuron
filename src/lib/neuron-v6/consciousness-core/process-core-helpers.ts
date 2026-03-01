/**
 * Process 核心辅助函数
 * 包含 process 方法中的核心流程逻辑
 */

import type { ProcessResult } from './types';
import type { EmotionExperience, EmotionState, EmotionDrivenBehavior } from '../emotion-system';
import type { InnerDialogue, DialecticProcess, VoiceActivation } from '../inner-dialogue';
import type { ResonanceEngineState } from '../resonance-engine';
import type { LayerProcessResult, SelfObservationResult } from '../consciousness-layers';
import type { ToolExecutionResult, ToolIntent } from './tool-helpers';

/**
 * 构建情感状态结果
 */
export function buildEmotionStateResult(
  emotionState: EmotionState,
  emotionExperience: EmotionExperience | null,
  drivenBehaviors: EmotionDrivenBehavior[],
  emotionReport: string
): ProcessResult['emotionState'] {
  return {
    activeEmotions: emotionState.activeEmotions,
    dominantEmotion: emotionState.dominantEmotion,
    currentExperience: emotionExperience,
    drivenBehaviors,
    emotionReport,
  };
}

/**
 * 构建内心对话状态结果
 */
export function buildInnerDialogueStateResult(
  currentDialogue: InnerDialogue | null,
  dialecticProcess: DialecticProcess | null,
  voiceActivations: VoiceActivation[],
  dialogueReport: string
): ProcessResult['innerDialogueState'] {
  return {
    currentDialogue,
    dialecticProcess,
    voiceActivations,
    dialogueReport,
  };
}

/**
 * 构建意识层级结果
 */
export function buildConsciousnessLayersResult(
  layerResults: LayerProcessResult[],
  selfObservation: SelfObservationResult | null,
  emergenceReport: string
): ProcessResult['consciousnessLayers'] {
  return {
    layerResults,
    selfObservation,
    emergenceReport,
  };
}

/**
 * 构建工具执行结果
 */
export function buildToolExecutionResult(
  toolIntent: ToolIntent | null,
  toolExecutionResult: ToolExecutionResult | null
): ProcessResult['toolExecution'] | undefined {
  if (!toolIntent) {
    return undefined;
  }
  
  return {
    needsTool: toolIntent.needsTool,
    intent: {
      confidence: 0.8,
      reasoning: toolIntent.toolCalls?.map(tc => tc.name).join(', ') || 'no tools',
    },
    result: toolExecutionResult ? {
      success: toolExecutionResult.results.some(r => r.success),
      summary: toolExecutionResult.summary,
      details: toolExecutionResult.results.map(r => ({
        toolName: r.toolName,
        success: r.success,
        output: r.result,
        error: r.error,
      })),
    } : undefined,
  };
}

/**
 * 构建共振状态结果
 */
export function buildResonanceStateResult(
  resonanceState: ResonanceEngineState
): ProcessResult['resonanceState'] {
  // 将 oscillators Map 转换为数组
  const subsystems = Array.from(resonanceState.oscillators.entries()).map(([name, osc]) => ({
    name: name as string,
    frequency: osc.effectiveFrequency,
    phase: osc.phase,
    isPulsing: osc.activation > 0.5, // 基于激活强度判断是否脉冲
    activation: osc.activation,
  }));
  
  return {
    subsystems,
    synchronyIndex: resonanceState.synchronyIndex,
    isResonant: resonanceState.isResonant,
    resonance: {
      isLocked: resonanceState.resonance.isLocked,
      lockedFrequency: resonanceState.resonance.lockedFrequency ?? undefined,
      lockedPeriod: resonanceState.resonance.lockedPeriod ?? undefined,
      highSyncCount: resonanceState.resonance.highSyncCount,
      syncHistoryLength: 0, // 默认值，如果原状态中没有此字段
    },
    meanFrequency: resonanceState.meanFrequency,
    timeStep: resonanceState.timeStep,
  };
}

/**
 * 更新对话历史
 */
export function updateConversationHistory(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
  assistantResponse: string,
  maxLength: number = 100
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const newHistory = [
    ...history,
    { role: 'user' as const, content: userMessage },
    { role: 'assistant' as const, content: assistantResponse },
  ];
  
  // 限制历史长度
  if (newHistory.length > maxLength) {
    return newHistory.slice(-maxLength);
  }
  
  return newHistory;
}
