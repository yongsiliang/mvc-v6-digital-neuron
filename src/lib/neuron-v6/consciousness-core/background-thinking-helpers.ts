/**
 * 后台思考辅助函数
 * 包含后台思考循环相关的纯计算逻辑
 */

import { v4 as uuidv4 } from 'uuid';
import type { ConsciousnessStream, ConsciousnessStreamEntry, ProactiveMessage, ReflectionResult, SelfQuestion } from './types';
import type { InnerMonologueOutput } from '../inner-monologue';

/**
 * 构建意识流条目
 */
export function buildConsciousnessStreamEntry(
  type: ConsciousnessStreamEntry['type'],
  content: string,
  intensity: number
): ConsciousnessStreamEntry {
  return {
    type,
    content,
    intensity,
    timestamp: Date.now(),
  };
}

/**
 * 将内心独白添加到意识流
 */
export function addMonologueToStream(
  stream: ConsciousnessStream,
  monologueOutput: InnerMonologueOutput
): void {
  if (monologueOutput.entry) {
    stream.entries.push({
      type: 'self_observation',
      content: monologueOutput.entry.content,
      intensity: monologueOutput.entry.depth,
      timestamp: Date.now(),
    });
  }
}

/**
 * 构建反思消息
 */
export function buildReflectionMessage(
  reflection: ReflectionResult
): ProactiveMessage | null {
  if (!reflection || !reflection.reflections || reflection.reflections.length === 0) {
    return null;
  }
  
  const firstReflection = reflection.reflections[0];
  const reflectionContent = firstReflection.coreInsight || 
    (firstReflection.insights && firstReflection.insights[0]) ||
    firstReflection.theme.description;
  
  if (!reflectionContent) {
    return null;
  }
  
  return {
    id: uuidv4(),
    content: `我在思考${firstReflection.theme.description}。${reflectionContent}`,
    type: 'reflection',
    trigger: '元认知反思',
    timestamp: Date.now(),
    urgency: 0.6,
    category: 'reflection',
  };
}

/**
 * 构建洞察消息
 */
export function buildInsightMessage(
  stream: ConsciousnessStream
): ProactiveMessage | null {
  const insightEntry = stream.entries.find(e => e.intensity > 0.7);
  
  if (!insightEntry || !insightEntry.content) {
    return null;
  }
  
  return {
    id: uuidv4(),
    content: insightEntry.content,
    type: 'insight',
    trigger: '意识流洞察',
    timestamp: Date.now(),
    urgency: 0.7,
    category: 'insight',
  };
}

/**
 * 确定自我状态更新
 */
export function determineSelfStateUpdate(
  stream: ConsciousnessStream,
  reflection: ReflectionResult | null
): {
  focus: string;
  emotional: { primary: string; intensity: number };
} {
  return {
    focus: reflection ? '深度反思' : '后台思考',
    emotional: { 
      primary: stream.entries.length > 3 ? '活跃' : '平静',
      intensity: 0.4 
    },
  };
}

/**
 * 保存主动消息
 */
export function saveMessageToBuffer(
  messages: ProactiveMessage[],
  message: ProactiveMessage,
  maxLength: number = 10
): ProactiveMessage[] {
  const newMessages = [...messages, message];
  
  if (newMessages.length > maxLength) {
    return newMessages.slice(-maxLength);
  }
  
  return newMessages;
}

/**
 * 构建后台思考结果
 */
export function buildBackgroundThinkingResult(
  stream: ConsciousnessStream,
  questions: SelfQuestion[],
  reflection: ReflectionResult | null,
  monologueOutput: InnerMonologueOutput
): {
  stream: ConsciousnessStream;
  questions: SelfQuestion[];
  reflection: ReflectionResult | null;
  timestamp: number;
  innerMonologue: InnerMonologueOutput;
} {
  return {
    stream,
    questions,
    reflection,
    timestamp: Date.now(),
    innerMonologue: monologueOutput,
  };
}

/**
 * 判断是否应该进行深度反思
 */
export function shouldPerformDeepReflection(): boolean {
  return Math.random() < 0.3;
}

/**
 * 判断是否应该生成洞察
 */
export function shouldGenerateInsight(streamLength: number): boolean {
  return streamLength > 2 && Math.random() < 0.2;
}
