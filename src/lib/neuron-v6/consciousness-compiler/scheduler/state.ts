/**
 * 系统状态管理
 * 
 * 职责：
 * - 管理系统能量、好奇心、疲劳度等状态
 * - 提供状态更新和恢复机制
 */

import type { SystemState } from '../types';
import { DEFAULT_SYSTEM_STATE } from '../types';
import { clamp } from '../utils/math';

/**
 * 状态管理器
 */
export class SystemStateManager {
  private state: SystemState;
  private history: SystemState[] = [];
  private maxHistoryLength: number = 100;
  
  constructor(initialState?: Partial<SystemState>) {
    this.state = {
      ...DEFAULT_SYSTEM_STATE,
      ...initialState,
    };
  }
  
  /**
   * 获取当前状态
   */
  getState(): SystemState {
    return { ...this.state };
  }
  
  /**
   * 更新状态
   */
  updateState(updates: Partial<SystemState>): void {
    // 记录历史
    this.history.push({ ...this.state });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
    
    // 应用更新
    this.state = {
      ...this.state,
      ...updates,
      lastActivity: Date.now(),
    };
  }
  
  /**
   * 消耗能量
   */
  consumeEnergy(amount: number): void {
    this.updateState({
      energy: clamp(this.state.energy - amount, 0, 100),
      fatigue: clamp(this.state.fatigue + amount / 2, 0, 100),
    });
  }
  
  /**
   * 增加疲劳
   */
  increaseFatigue(amount: number): void {
    this.updateState({
      fatigue: clamp(this.state.fatigue + amount, 0, 100),
    });
  }
  
  /**
   * 休息恢复
   */
  rest(recoveryRate: number = 0.3): void {
    this.updateState({
      energy: clamp(this.state.energy + 100 * recoveryRate, 0, 100),
      fatigue: clamp(this.state.fatigue - 100 * recoveryRate * 0.67, 0, 100),
    });
  }
  
  /**
   * 增加好奇心
   */
  increaseCuriosity(amount: number): void {
    this.updateState({
      curiosity: clamp(this.state.curiosity + amount, 0, 1),
    });
  }
  
  /**
   * 减少好奇心
   */
  decreaseCuriosity(amount: number): void {
    this.updateState({
      curiosity: clamp(this.state.curiosity - amount, 0, 1),
    });
  }
  
  /**
   * 更新深度记录
   */
  updateDepth(depth: number): void {
    this.updateState({
      recentDepth: depth,
      conversationTurns: this.state.conversationTurns + 1,
    });
  }
  
  /**
   * 检查是否需要休息
   */
  needsRest(): boolean {
    return this.state.energy < 20 || this.state.fatigue > 80;
  }
  
  /**
   * 检查是否有足够能量
   */
  hasEnergy(required: number): boolean {
    return this.state.energy >= required;
  }
  
  /**
   * 获取状态摘要
   */
  getSummary(): string {
    const energyLevel = this.state.energy > 70 ? '充沛' : 
                        this.state.energy > 40 ? '中等' : '不足';
    const fatigueLevel = this.state.fatigue > 70 ? '疲惫' : 
                         this.state.fatigue > 40 ? '有些累' : '清醒';
    const curiosityLevel = this.state.curiosity > 0.7 ? '强烈' : 
                           this.state.curiosity > 0.3 ? '一般' : '低迷';
    
    return `能量${energyLevel}(${this.state.energy.toFixed(0)}%), ` +
           `疲劳度${fatigueLevel}(${this.state.fatigue.toFixed(0)}%), ` +
           `好奇心${curiosityLevel}(${this.state.curiosity.toFixed(2)})`;
  }
  
  /**
   * 获取历史记录
   */
  getHistory(): SystemState[] {
    return [...this.history];
  }
  
  /**
   * 重置状态
   */
  reset(): void {
    this.state = { ...DEFAULT_SYSTEM_STATE };
    this.history = [];
  }
}
