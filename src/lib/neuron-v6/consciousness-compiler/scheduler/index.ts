/**
 * 调度层
 * 
 * 职责：
 * - 状态感知
 * - 能量预算
 * - 深度决策
 * - 模块选择
 * 
 * 特性：显式、可观察
 */

import type { 
  SystemState, 
  CompilationDepth,
  SchedulerConfig,
  CompilationResult,
} from '../types';
import { DEFAULT_SYSTEM_STATE } from '../types';
import { SystemStateManager } from './state';
import { DepthDecider } from './depth-decider';
import { AttentionSelector } from './attention-selector';
import { EnergyBudgetManager } from './energy-budget';

/**
 * 调度器配置（用于createScheduler）
 */
export interface CreateSchedulerConfig {
  defaultEnergyBudget?: number;
  maxDepth?: number;
  initialEnergy?: number;
  initialCuriosity?: number;
  energyRecoveryRate?: number;
}

/**
 * 调度器
 */
export class Scheduler {
  private stateManager: SystemStateManager;
  private depthDecider: DepthDecider;
  private attentionSelector: AttentionSelector;
  private energyBudgetManager: EnergyBudgetManager;
  
  constructor(config?: SchedulerConfig) {
    this.stateManager = new SystemStateManager({
      energy: config?.initialEnergy ?? DEFAULT_SYSTEM_STATE.energy,
      curiosity: config?.initialCuriosity ?? DEFAULT_SYSTEM_STATE.curiosity,
    });
    
    this.depthDecider = new DepthDecider({
      energyPerDepth: 20,
      maxDepth: config?.maxDepth ?? 5,
    });
    
    this.attentionSelector = new AttentionSelector();
    this.energyBudgetManager = new EnergyBudgetManager({
      restRecoveryRate: config?.energyRecoveryRate ?? 30,
    });
  }
  
  /**
   * 感知系统状态
   */
  senseState(): SystemState {
    return this.stateManager.getState();
  }
  
  /**
   * 决定编译深度
   */
  decideDepth(state: SystemState): CompilationDepth {
    const depthLevel = this.depthDecider.decide('', state);
    const energyCost = depthLevel * 20; // 每层20单位能量
    
    return {
      total: depthLevel,
      modules: ['perception'],
      energyCost,
      moduleWeights: new Map([['perception', 1]]),
    };
  }
  
  /**
   * 预算能量
   */
  budgetEnergy(depth: CompilationDepth): number {
    return depth.energyCost;
  }
  
  /**
   * 决定编译深度和模块
   * 
   * 核心流程：
   * 1. 检查系统状态
   * 2. 计算能量预算
   * 3. 决定编译深度
   * 4. 选择激活模块
   */
  decide(input: string): CompilationDepth {
    const state = this.stateManager.getState();
    
    // 1. 检查是否需要休息
    if (this.stateManager.needsRest()) {
      console.log('[调度器] 系统需要休息');
      return {
        total: 1,
        modules: ['perception'],
        energyCost: 15,
        moduleWeights: new Map([['perception', 1]]),
      };
    }
    
    // 2. 计算能量预算
    const budget = this.energyBudgetManager.calculateBudget(state);
    
    // 3. 决定深度
    const depth = this.depthDecider.decide(input, state);
    
    // 4. 选择模块
    const moduleSelection = this.attentionSelector.select(input, budget.available / 3);
    
    // 5. 计算总能量消耗
    const totalCost = this.energyBudgetManager.calculateCost(
      depth, 
      moduleSelection.selected
    );
    
    // 6. 如果能量不足，降级
    let finalDepth = depth;
    let finalModules = moduleSelection.selected;
    let finalCost = totalCost;
    
    if (!this.energyBudgetManager.canAfford(state, depth, moduleSelection.selected)) {
      // 降级处理
      finalDepth = Math.max(1, Math.floor(state.energy / 20));
      finalModules = ['perception'];
      finalCost = this.energyBudgetManager.calculateCost(finalDepth, finalModules);
      console.log(`[调度器] 能量不足，降级到深度${finalDepth}`);
    }
    
    // 7. 消耗能量
    this.stateManager.consumeEnergy(finalCost);
    this.stateManager.updateDepth(finalDepth);
    
    return {
      total: finalDepth,
      modules: finalModules,
      energyCost: finalCost,
      moduleWeights: moduleSelection.weights,
    };
  }
  
  /**
   * 获取当前状态
   */
  getState(): SystemState {
    return this.stateManager.getState();
  }
  
  /**
   * 获取状态摘要
   */
  getStatusSummary(): string {
    return this.stateManager.getSummary();
  }
  
  /**
   * 更新状态（编译后）
   */
  updateState(result: CompilationResult): void {
    const { stats, understanding } = result;
    
    // 根据结果调整好奇心
    if (understanding.confidence > 0.8) {
      this.stateManager.increaseCuriosity(0.05);
    } else if (understanding.confidence < 0.5) {
      this.stateManager.decreaseCuriosity(0.03);
    }
    
    // 增加疲劳
    this.stateManager.increaseFatigue(stats.depth * 3);
  }
  
  /**
   * 休息恢复
   */
  rest(): void {
    const state = this.stateManager.getState();
    const { newEnergy, newFatigue } = this.energyBudgetManager.calculateRestRecovery(
      state.energy,
      state.fatigue
    );
    
    this.stateManager.updateState({
      energy: newEnergy,
      fatigue: newFatigue,
    });
    
    console.log(`[调度器] 休息恢复：能量${newEnergy.toFixed(0)}%，疲劳${newFatigue.toFixed(0)}%`);
  }
  
  /**
   * 检查是否需要休息
   */
  needsRest(): boolean {
    return this.stateManager.needsRest();
  }
  
  /**
   * 获取能量预算信息
   */
  getBudgetInfo(): string {
    const state = this.stateManager.getState();
    return this.energyBudgetManager.getStatus(state);
  }
  
  /**
   * 获取深度决策器（用于调试）
   */
  getDepthDecider(): DepthDecider {
    return this.depthDecider;
  }
  
  /**
   * 获取模块选择器（用于调试）
   */
  getAttentionSelector(): AttentionSelector {
    return this.attentionSelector;
  }
  
  /**
   * 重置调度器
   */
  reset(): void {
    this.stateManager.reset();
  }
}

/**
 * 创建调度器
 */
export function createScheduler(config?: CreateSchedulerConfig): Scheduler {
  return new Scheduler({
    initialEnergy: config?.defaultEnergyBudget ?? config?.initialEnergy ?? 100,
    initialCuriosity: 0.5,
    maxDepth: config?.maxDepth ?? 5,
    energyRecoveryRate: config?.energyRecoveryRate ?? 30,
  });
}
