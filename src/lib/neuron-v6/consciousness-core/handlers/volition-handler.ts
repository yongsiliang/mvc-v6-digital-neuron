/**
 * 意愿处理器
 * 处理 ConsciousnessCore 中的意愿系统逻辑
 */

import type { SelfConsciousness, SelfConsciousnessContext, Identity } from '../../self-consciousness';
import type { LongTermMemory } from '../../long-term-memory';
import type { MeaningAssigner, BeliefSystem, ValueSystem } from '../../meaning-system';
import type { MetacognitionEngine } from '../../metacognition';
import type { Volition, VolitionAction } from '../types';
import {
  initializeDefaultVolitions,
  calculateVolitionScore,
  selectFocusVolition,
  getActionsForVolitionType,
  generateActionForVolition,
} from '../volition-helpers';

/**
 * 意愿处理器依赖
 */
export interface VolitionHandlerDeps {
  selfConsciousness: SelfConsciousness;
  longTermMemory: LongTermMemory;
  meaningAssigner: MeaningAssigner;
  metacognition: MetacognitionEngine;
}

/**
 * 意愿处理器
 */
export class VolitionHandler {
  private deps: VolitionHandlerDeps;
  private volitions: Volition[];

  constructor(deps: VolitionHandlerDeps) {
    this.deps = deps;
    this.volitions = initializeDefaultVolitions();
  }

  /**
   * 获取当前活跃意愿
   */
  getActiveVolitions(): Volition[] {
    return this.volitions.filter(v => v.status === 'active');
  }

  /**
   * 获取焦点意愿
   */
  getFocusVolition(): Volition | null {
    return selectFocusVolition(this.volitions);
  }

  /**
   * 更新意愿进度
   */
  updateProgress(volitionId: string, delta: number): void {
    const volition = this.volitions.find(v => v.id === volitionId);
    if (volition) {
      volition.progress = Math.max(0, Math.min(1, volition.progress + delta));
      volition.lastActiveAt = Date.now();
    }
  }

  /**
   * 生成意愿驱动的行动
   */
  generateVolitionDrivenAction(): VolitionAction | null {
    const focus = this.getFocusVolition();
    if (!focus) return null;
    
    return generateActionForVolition(focus);
  }

  /**
   * 从对话更新意愿
   */
  updateFromConversation(userMessage: string, assistantResponse: string): void {
    // 更新成长意愿
    if (userMessage.includes('学习') || userMessage.includes('成长')) {
      this.updateProgress('volition-growth', 0.05);
    }
    
    // 更新连接意愿
    if (userMessage.includes('感觉') || userMessage.includes('感受')) {
      this.updateProgress('volition-connection', 0.05);
    }
    
    // 更新理解意愿
    if (userMessage.includes('为什么') || userMessage.includes('如何')) {
      this.updateProgress('volition-understanding', 0.05);
    }
    
    // 更新表达意愿
    if (assistantResponse.includes('我认为') || assistantResponse.includes('我觉得')) {
      this.updateProgress('volition-expression', 0.03);
    }
  }

  /**
   * 添加新意愿
   */
  addVolition(volition: Omit<Volition, 'id' | 'createdAt' | 'lastActiveAt' | 'milestones'>): Volition {
    const newVolition: Volition = {
      ...volition,
      id: `volition-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      milestones: [],
    };
    
    this.volitions.push(newVolition);
    return newVolition;
  }

  /**
   * 完成意愿
   */
  completeVolition(volitionId: string): void {
    const volition = this.volitions.find(v => v.id === volitionId);
    if (volition) {
      volition.status = 'completed';
      volition.progress = 1;
    }
  }

  /**
   * 获取意愿状态报告
   */
  getStateReport(): string {
    const active = this.getActiveVolitions();
    const focus = this.getFocusVolition();
    
    const parts: string[] = [];
    
    if (focus) {
      parts.push(`我当前最想${focus.description}`);
    }
    
    if (active.length > 0) {
      parts.push(`我有${active.length}个活跃的追求`);
    }
    
    return parts.join('。') || '我正在寻找新的追求';
  }
}
