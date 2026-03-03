/**
 * 能量预算管理器
 * 
 * 职责：
 * - 管理能量分配
 * - 计算可用能量
 * - 提供能量恢复机制
 */

import type { SystemState } from '../types';
import { clamp } from '../utils/math';

/**
 * 能量预算配置
 */
export interface EnergyBudgetConfig {
  /** 最大能量 */
  maxEnergy: number;
  /** 每层编译消耗 */
  costPerDepth: number;
  /** 模块消耗倍率 */
  moduleCostMultiplier: number;
  /** 自然恢复率（每秒） */
  naturalRecoveryRate: number;
  /** 休息恢复率 */
  restRecoveryRate: number;
}

const DEFAULT_CONFIG: EnergyBudgetConfig = {
  maxEnergy: 100,
  costPerDepth: 15,
  moduleCostMultiplier: 1.5,
  naturalRecoveryRate: 0.1,
  restRecoveryRate: 30,
};

/**
 * 能量预算
 */
export interface EnergyBudget {
  /** 可用能量 */
  available: number;
  /** 已分配能量 */
  allocated: number;
  /** 剩余能量 */
  remaining: number;
  /** 推荐深度 */
  recommendedDepth: number;
}

/**
 * 能量预算管理器
 */
export class EnergyBudgetManager {
  private config: EnergyBudgetConfig;
  private lastUpdateTime: number;
  
  constructor(config?: Partial<EnergyBudgetConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * 计算能量预算
   */
  calculateBudget(state: SystemState): EnergyBudget {
    // 自然恢复
    const now = Date.now();
    const elapsed = (now - this.lastUpdateTime) / 1000; // 秒
    const recovery = this.config.naturalRecoveryRate * elapsed;
    this.lastUpdateTime = now;
    
    // 更新后的能量
    const currentEnergy = clamp(
      state.energy + recovery - state.fatigue * 0.1,
      0,
      this.config.maxEnergy
    );
    
    // 计算可用深度
    const maxDepth = Math.floor(currentEnergy / this.config.costPerDepth);
    
    // 推荐深度（考虑疲劳度）
    const fatiguePenalty = state.fatigue / 100;
    const recommendedDepth = Math.max(1, Math.floor(maxDepth * (1 - fatiguePenalty * 0.5)));
    
    return {
      available: currentEnergy,
      allocated: 0,
      remaining: currentEnergy,
      recommendedDepth,
    };
  }
  
  /**
   * 计算编译消耗
   */
  calculateCost(depth: number, modules: string[]): number {
    // 基础消耗 = 深度 × 每层消耗
    let cost = depth * this.config.costPerDepth;
    
    // 模块额外消耗
    cost += modules.length * this.config.moduleCostMultiplier;
    
    return cost;
  }
  
  /**
   * 分配能量
   */
  allocate(state: SystemState, amount: number): boolean {
    if (state.energy >= amount) {
      return true;
    }
    return false;
  }
  
  /**
   * 计算休息恢复
   */
  calculateRestRecovery(currentEnergy: number, fatigue: number): {
    newEnergy: number;
    newFatigue: number;
  } {
    const energyGain = this.config.restRecoveryRate;
    const fatigueReduction = this.config.restRecoveryRate * 0.67;
    
    return {
      newEnergy: clamp(currentEnergy + energyGain, 0, this.config.maxEnergy),
      newFatigue: clamp(fatigue - fatigueReduction, 0, 100),
    };
  }
  
  /**
   * 检查是否有足够能量
   */
  canAfford(state: SystemState, depth: number, modules: string[]): boolean {
    const cost = this.calculateCost(depth, modules);
    return state.energy >= cost;
  }
  
  /**
   * 获取能量状态描述
   */
  getStatus(state: SystemState): string {
    const budget = this.calculateBudget(state);
    
    if (budget.available > 80) {
      return `能量充沛，可以深度编译（推荐${budget.recommendedDepth}层）`;
    } else if (budget.available > 50) {
      return `能量充足，可以进行中等深度编译（推荐${budget.recommendedDepth}层）`;
    } else if (budget.available > 20) {
      return `能量紧张，建议浅层编译（推荐${budget.recommendedDepth}层）`;
    } else {
      return `能量不足，建议休息恢复`;
    }
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<EnergyBudgetConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   */
  getConfig(): EnergyBudgetConfig {
    return { ...this.config };
  }
}
