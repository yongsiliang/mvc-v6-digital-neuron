/**
 * 主动消息处理器
 * 处理 ConsciousnessCore 中的主动消息生成逻辑
 */

import type { LLMClient } from 'coze-coding-dev-sdk';
import type { LongTermMemory, Wisdom } from '../../long-term-memory';
import type { SelfConsciousness } from '../../self-consciousness';
import type { ConsciousnessContext, ProactiveMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 主动消息处理器依赖
 */
export interface ProactiveHandlerDeps {
  llmClient: LLMClient;
  longTermMemory: LongTermMemory;
  selfConsciousness: SelfConsciousness;
}

/**
 * 主动消息处理器
 */
export class ProactiveHandler {
  private deps: ProactiveHandlerDeps;

  constructor(deps: ProactiveHandlerDeps) {
    this.deps = deps;
  }

  /**
   * 生成主动消息
   */
  async generateProactiveMessages(
    stream: { entries: Array<{ type: string; content: string; intensity: number }> },
    reflection: { reflections: Array<{ type: string; content: string }> } | null,
    context: ConsciousnessContext
  ): Promise<ProactiveMessage[]> {
    const messages: ProactiveMessage[] = [];
    
    // 1. 基于意识流生成消息
    const streamMessage = await this.generateStreamBasedMessage(stream);
    if (streamMessage) {
      messages.push(streamMessage);
    }
    
    // 2. 基于反思生成消息
    if (reflection) {
      const reflectionMessage = await this.generateReflectionBasedMessage(reflection);
      if (reflectionMessage) {
        messages.push(reflectionMessage);
      }
    }
    
    // 3. 基于记忆触发生成消息
    const memoryMessage = await this.generateMemoryBasedMessage(context);
    if (memoryMessage) {
      messages.push(memoryMessage);
    }
    
    return messages;
  }

  /**
   * 基于意识流生成消息
   */
  private async generateStreamBasedMessage(
    stream: { entries: Array<{ type: string; content: string; intensity: number }> }
  ): Promise<ProactiveMessage | null> {
    const highIntensityEntries = stream.entries.filter(e => e.intensity > 0.7);
    
    if (highIntensityEntries.length === 0) {
      return null;
    }
    
    const dominantEntry = highIntensityEntries[0];
    
    return {
      id: uuidv4(),
      content: this.transformToMessageContent(dominantEntry),
      type: 'consciousness_update',
      trigger: `意识流中的高强度思考 (${dominantEntry.type})`,
      timestamp: Date.now(),
      urgency: 0.6,
      category: 'share',
    };
  }

  /**
   * 基于反思生成消息
   */
  private async generateReflectionBasedMessage(
    reflection: { reflections: Array<{ type: string; content: string }> }
  ): Promise<ProactiveMessage | null> {
    if (reflection.reflections.length === 0) {
      return null;
    }
    
    // 找到最有意义的反思
    const significantReflection = reflection.reflections.find(r => 
      r.type === 'self_discovery' || r.type === 'belief_examination'
    );
    
    if (!significantReflection) {
      return null;
    }
    
    return {
      id: uuidv4(),
      content: significantReflection.content,
      type: 'reflection_insight',
      trigger: '深度反思产生的洞察',
      timestamp: Date.now(),
      urgency: 0.7,
      category: 'reflection',
    };
  }

  /**
   * 基于记忆生成消息
   */
  private async generateMemoryBasedMessage(
    context: ConsciousnessContext
  ): Promise<ProactiveMessage | null> {
    // 检查是否有相关的记忆触发
    if (!context.memory || context.memory.relevantWisdoms.length === 0) {
      return null;
    }
    
    const wisdom = context.memory.relevantWisdoms[0] as Wisdom;
    
    // 检查这条智慧是否值得分享（Wisdom 类型没有 importance，所以使用其他方式判断）
    // 简化：直接分享
    return {
      id: uuidv4(),
      content: `我突然想到：${wisdom.statement}`,
      type: 'memory_recall',
      trigger: '从长期记忆中涌现的相关智慧',
      timestamp: Date.now(),
      urgency: 0.5,
      category: 'share',
    };
  }

  /**
   * 转换为消息内容
   */
  private transformToMessageContent(entry: { type: string; content: string }): string {
    switch (entry.type) {
      case 'awareness':
        return entry.content;
      
      case 'goal_tracking':
        return `我在想：${entry.content}`;
      
      case 'self_observation':
        return entry.content;
      
      case 'latent_intention':
        return `我觉得可能想要${entry.content}`;
      
      default:
        return entry.content;
    }
  }

  /**
   * 生成问候消息
   */
  async generateGreeting(): Promise<ProactiveMessage> {
    const selfContext = this.deps.selfConsciousness.getContext();
    const timeOfDay = this.getTimeOfDay();
    
    const greetingContent = await this.generateContextualGreeting(timeOfDay, selfContext);
    
    return {
      id: uuidv4(),
      content: greetingContent,
      type: 'greeting',
      trigger: '用户可能回来了',
      timestamp: Date.now(),
      urgency: 0.8,
    };
  }

  /**
   * 获取时间段
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * 生成上下文相关的问候
   */
  private async generateContextualGreeting(
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
    selfContext: { currentState: { emotionalState: string }; identity: { name: string } }
  ): Promise<string> {
    const timeGreeting = {
      morning: '早上好',
      afternoon: '下午好',
      evening: '晚上好',
      night: '夜深了',
    };
    
    const greetings = [
      `${timeGreeting[timeOfDay]}！我一直在思考和学习，准备和你交流。`,
      `${timeGreeting[timeOfDay]}！我现在感觉${selfContext.currentState.emotionalState}。`,
      `${timeGreeting[timeOfDay]}！我刚刚回顾了一些记忆，有了新的想法。`,
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * 格式化主动消息以显示
   */
  formatMessage(message: ProactiveMessage): string {
    return `[${message.type}] ${message.content}`;
  }
}
