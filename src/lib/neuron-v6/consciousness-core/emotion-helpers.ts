/**
 * 情感处理辅助函数
 * 包含情感检测和体验相关的纯计算逻辑
 */

import type { EmotionEngine, EmotionExperience, EmotionState } from '../emotion-system';

/**
 * 处理情感检测结果
 */
export function processEmotionDetection(
  emotionEngine: EmotionEngine,
  input: string
): {
  emotionExperience: EmotionExperience | null;
  detectedEmotion: { emotion: string; intensity: number } | null;
} {
  const detectedEmotion = emotionEngine.detectFromText(input);
  let emotionExperience: EmotionExperience | null = null;
  
  if (detectedEmotion) {
    emotionExperience = emotionEngine.experience(
      detectedEmotion.emotion,
      {
        type: 'conversation',
        description: `对话中检测到${detectedEmotion.emotion}`,
        relatedConcepts: [],
      },
      detectedEmotion.intensity
    );
  }
  
  // 衰减活跃情感
  emotionEngine.decayActiveEmotions();
  
  return { emotionExperience, detectedEmotion };
}

/**
 * 获取情感状态报告
 */
export function getEmotionStateReport(
  emotionEngine: EmotionEngine
): {
  emotionState: EmotionState;
  emotionReport: string;
  drivenBehaviors: ReturnType<EmotionEngine['getEmotionDrivenBehaviors']>;
} {
  return {
    emotionState: emotionEngine.getState(),
    emotionReport: emotionEngine.getEmotionReport(),
    drivenBehaviors: emotionEngine.getEmotionDrivenBehaviors(),
  };
}

/**
 * 构建情感状态结果
 */
export function buildEmotionStateResult(
  emotionState: EmotionState,
  emotionExperience: EmotionExperience | null,
  drivenBehaviors: ReturnType<EmotionEngine['getEmotionDrivenBehaviors']>,
  emotionReport: string
): {
  activeEmotions: EmotionState['activeEmotions'];
  dominantEmotion: EmotionState['dominantEmotion'];
  currentExperience: EmotionExperience | null;
  drivenBehaviors: typeof drivenBehaviors;
  emotionReport: ReturnType<EmotionEngine['getEmotionReport']>;
} {
  return {
    activeEmotions: emotionState.activeEmotions,
    dominantEmotion: emotionState.dominantEmotion,
    currentExperience: emotionExperience,
    drivenBehaviors,
    emotionReport: emotionReport,
  };
}
