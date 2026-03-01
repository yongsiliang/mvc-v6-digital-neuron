/**
 * 意愿处理器
 * 处理 ConsciousnessCore 中的意愿系统逻辑
 */

import type { SelfConsciousness } from '../../self-consciousness';
import type { LongTermMemory } from '../../long-term-memory';
import type { MeaningAssigner } from '../../meaning-system';
import type { MetacognitionEngine } from '../../metacognition';
import type { Volition, VolitionAction, VolitionSystemState } from '../types';
import {
  initializeDefaultVolitions,
  selectFocusVolition,
  generateActionForVolition,
  getVolitionProgressUpdates,
  buildVolitionState,
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
  private currentFocus: Volition | null = null;
  private recentAchievements: string[] = [];

  constructor(deps: VolitionHandlerDeps) {
    this.deps = deps;
    this.volitions = initializeDefaultVolitions();
    this.currentFocus = this.volitions[0];
  }

  /**
   * 获取所有意愿
   */
  getVolitions(): Volition[] {
    return this.volitions;
  }

  /**
   * 获取当前焦点
   */
  getCurrentFocus(): Volition | null {
    return this.currentFocus;
  }

  /**
   * 获取最近成就
   */
  getRecentAchievements(): string[] {
    return this.recentAchievements;
  }

  /**
   * 获取意愿系统状态
   */
  getVolitionState(): VolitionSystemState {
    return buildVolitionState(this.volitions, this.currentFocus, this.recentAchievements);
  }

  /**
   * 更新意愿进度
   */
  updateVolitionProgress(volitionType: Volition['type'], progressDelta: number): void {
    const volition = this.volitions.find(v => v.type === volitionType);
    
    if (volition) {
      const oldProgress = volition.progress;
      volition.progress = Math.min(1, Math.max(0, volition.progress + progressDelta));
      volition.lastActiveAt = Date.now();
      
      if (volition.progress >= 1 && volition.status === 'active') {
        volition.status = 'completed';
        this.recentAchievements.push(`完成目标：${volition.description}`);
        console.log(`[意愿系统] 完成意愿: ${volition.description}`);
        
        setTimeout(() => {
          volition.progress = 0;
          volition.status = 'active';
        }, 3600000);
      }
      
      if (Math.abs(volition.progress - oldProgress) > 0.1) {
        console.log(`[意愿系统] ${volition.type}进度: ${(volition.progress * 100).toFixed(0)}%`);
      }
    }
  }

  /**
   * 选择当前焦点意愿
   */
  selectFocusVolition(): Volition | null {
    const selected = selectFocusVolition(this.volitions);
    this.currentFocus = selected;
    return selected;
  }

  /**
   * 基于意愿生成行动建议
   */
  generateVolitionDrivenAction(): VolitionAction | null {
    if (!this.currentFocus) {
      this.selectFocusVolition();
    }
    
    if (!this.currentFocus) return null;
    this.currentFocus.lastActiveAt = Date.now();
    
    return generateActionForVolition(this.currentFocus);
  }

  /**
   * 从对话中更新意愿进度
   */
  updateVolitionsFromConversation(userMessage: string, assistantResponse: string): void {
    const updates = getVolitionProgressUpdates(userMessage, assistantResponse);
    
    for (const update of updates) {
      this.updateVolitionProgress(update.type, update.delta);
    }
    
    const memoryStats = this.deps.longTermMemory.getStats();
    if (memoryStats.nodeCount > 0) {
      const recentNodes = this.deps.longTermMemory.retrieve(userMessage.slice(0, 10));
      if (recentNodes.directMatches.length === 0) {
        this.updateVolitionProgress('exploration', 0.03);
      }
    }
  }

  /**
   * 获取当前活跃意愿
   */
  getActiveVolitions(): Volition[] {
    return this.volitions.filter(v => v.status === 'active');
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
    const focus = this.currentFocus;
    
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
