/**
 * ═══════════════════════════════════════════════════════════════════════
 * 能量预算管理器 (Energy Budget Manager)
 * 
 * 来源：consciousness-compiler/scheduler/energy-budget.ts
 * 改进：融入深度元思考系统
 * 
 * 核心概念：
 * - 能量控制思考深度和 LLM 调用频率
 * - 疲劳度影响能量效率
 * - 自然恢复机制
 * - Token 预算映射
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 能量预算配置
 */
export interface EnergyBudgetConfig {
  /** 最大能量（默认 100） */
  maxEnergy: number;
  
  /** 每层思考消耗（默认 15） */
  costPerDepth: number;
  
  /** 模块消耗倍率（默认 1.5） */
  moduleCostMultiplier: number;
  
  /** 自然恢复率（每秒，默认 0.1） */
  naturalRecoveryRate: number;
  
  /** 休息恢复率（默认 30） */
  restRecoveryRate: number;
  
  /** 最小能量预算阈值（低于此值触发浅层思考） */
  minEnergyThreshold: number;
  
  /** 最大思考深度 */
  maxDepth: number;
}

/**
 * 能量状态
 */
export interface EnergyState {
  /** 当前能量 */
  current: number;
  
  /** 疲劳度 (0-100) */
  fatigue: number;
  
  /** 好奇心 (0-1) */
  curiosity: number;
  
  /** 上次更新时间 */
  lastUpdateTime: number;
}

/**
 * 能量预算结果
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
  
  /** 推荐模拟次数 */
  recommendedSimulations: number;
  
  /** 是否能量不足 */
  isLowEnergy: boolean;
  
  /** 状态描述 */
  statusDescription: string;
}

/**
 * LLM 调用级别
 */
export type LLMCallLevel = 
  | 'none'      // 不调用 LLM
  | 'minimal'   // 最小调用（~500 tokens）
  | 'standard'  // 标准调用（~1500 tokens）
  | 'deep'      // 深度调用（~3000 tokens）
  | 'full';     // 完整调用（~6000 tokens）

/**
 * Token 预算映射
 */
export const TOKEN_BUDGET: Record<LLMCallLevel, number> = {
  none: 0,
  minimal: 500,
  standard: 1500,
  deep: 3000,
  full: 6000,
};

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: EnergyBudgetConfig = {
  maxEnergy: 100,
  costPerDepth: 15,
  moduleCostMultiplier: 1.5,
  naturalRecoveryRate: 0.1,
  restRecoveryRate: 30,
  minEnergyThreshold: 20,
  maxDepth: 5,
};

// ─────────────────────────────────────────────────────────────────────
// 能量预算管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 能量预算管理器
 * 
 * 使用示例：
 * ```typescript
 * const budgetManager = new EnergyBudgetManager();
 * 
 * // 每次思考前计算预算
 * const budget = budgetManager.calculateBudget(state);
 * 
 * // 根据预算决定思考深度
 * const depth = budget.recommendedDepth;
 * const simulations = budget.recommendedSimulations;
 * 
 * // 思考完成后消耗能量
 * budgetManager.consumeEnergy(depth, modules);
 * ```
 */
export class EnergyBudgetManager {
  private config: EnergyBudgetConfig;
  private state: EnergyState;
  
  constructor(config?: Partial<EnergyBudgetConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      current: this.config.maxEnergy,
      fatigue: 0,
      curiosity: 0.5,
      lastUpdateTime: Date.now(),
    };
  }
  
  /**
   * 计算能量预算
   * 
   * 自动应用自然恢复
   */
  calculateBudget(): EnergyBudget {
    // 自然恢复
    this.applyNaturalRecovery();
    
    // 计算可用深度
    const maxByEnergy = Math.floor(this.state.current / this.config.costPerDepth);
    
    // 疲劳度惩罚
    const fatigueFactor = 1 - this.state.fatigue / 200;
    
    // 好奇心加成
    const curiosityBonus = 1 + this.state.curiosity * 0.2;
    
    // 综合计算推荐深度
    const rawDepth = maxByEnergy * fatigueFactor * curiosityBonus;
    const recommendedDepth = Math.max(1, Math.min(
      Math.floor(rawDepth),
      this.config.maxDepth
    ));
    
    // 推荐模拟次数（深度越高，模拟越多）
    const baseSimulations = 10;
    const recommendedSimulations = baseSimulations * recommendedDepth;
    
    // 是否能量不足
    const isLowEnergy = this.state.current < this.config.minEnergyThreshold;
    
    // 状态描述
    const statusDescription = this.getStatusDescription();
    
    return {
      available: this.state.current,
      allocated: 0,
      remaining: this.state.current,
      recommendedDepth,
      recommendedSimulations,
      isLowEnergy,
      statusDescription,
    };
  }
  
  /**
   * 消耗能量
   */
  consumeEnergy(depth: number, modules: string[] = []): void {
    // 基础消耗
    let cost = depth * this.config.costPerDepth;
    
    // 模块额外消耗
    cost += modules.length * this.config.moduleCostMultiplier;
    
    // 应用消耗
    this.state.current = Math.max(0, this.state.current - cost);
    
    // 增加疲劳
    this.state.fatigue = Math.min(100, this.state.fatigue + depth * 2);
    
    this.state.lastUpdateTime = Date.now();
  }
  
  /**
   * 恢复能量（休息）
   */
  rest(duration: number = 1): void {
    const energyGain = this.config.restRecoveryRate * duration;
    const fatigueReduction = this.config.restRecoveryRate * 0.67 * duration;
    
    this.state.current = Math.min(
      this.config.maxEnergy,
      this.state.current + energyGain
    );
    
    this.state.fatigue = Math.max(0, this.state.fatigue - fatigueReduction);
    this.state.lastUpdateTime = Date.now();
  }
  
  /**
   * 设置好奇心
   */
  setCuriosity(value: number): void {
    this.state.curiosity = Math.max(0, Math.min(1, value));
  }
  
  /**
   * 获取当前状态
   */
  getState(): EnergyState {
    return { ...this.state };
  }
  
  /**
   * 设置状态（用于恢复）
   */
  setState(state: Partial<EnergyState>): void {
    this.state = { ...this.state, ...state };
    this.state.lastUpdateTime = Date.now();
  }
  
  /**
   * 深度到 LLM 级别映射
   */
  depthToLLMLevel(depth: number): LLMCallLevel {
    if (depth <= 1) return 'none';
    if (depth === 2) return 'minimal';
    if (depth === 3) return 'standard';
    if (depth === 4) return 'deep';
    return 'full';
  }
  
  /**
   * 获取 LLM Token 预算
   */
  getLLMTokenBudget(depth: number): number {
    const level = this.depthToLLMLevel(depth);
    return TOKEN_BUDGET[level];
  }
  
  /**
   * 检查是否有足够能量
   */
  canAfford(depth: number, modules: string[] = []): boolean {
    const cost = this.calculateCost(depth, modules);
    return this.state.current >= cost;
  }
  
  /**
   * 计算消耗
   */
  calculateCost(depth: number, modules: string[] = []): number {
    let cost = depth * this.config.costPerDepth;
    cost += modules.length * this.config.moduleCostMultiplier;
    return cost;
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
  
  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      current: this.config.maxEnergy,
      fatigue: 0,
      curiosity: 0.5,
      lastUpdateTime: Date.now(),
    };
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 私有方法
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 应用自然恢复
   */
  private applyNaturalRecovery(): void {
    const now = Date.now();
    const elapsed = (now - this.state.lastUpdateTime) / 1000; // 秒
    
    // 能量自然恢复
    const recovery = this.config.naturalRecoveryRate * elapsed;
    this.state.current = Math.min(
      this.config.maxEnergy,
      this.state.current + recovery
    );
    
    // 疲劳自然消退（较慢）
    this.state.fatigue = Math.max(
      0,
      this.state.fatigue - elapsed * 0.01
    );
    
    this.state.lastUpdateTime = now;
  }
  
  /**
   * 获取状态描述
   */
  private getStatusDescription(): string {
    const energy = this.state.current;
    const fatigue = this.state.fatigue;
    const budget = this.calculateBudgetWithoutRecovery();
    
    if (energy > 80 && fatigue < 30) {
      return `能量充沛，可以深度思考（推荐${budget.recommendedDepth}层）`;
    } else if (energy > 50 && fatigue < 60) {
      return `能量充足，可以进行中等深度思考（推荐${budget.recommendedDepth}层）`;
    } else if (energy > 20) {
      return `能量紧张，建议浅层思考（推荐${budget.recommendedDepth}层）`;
    } else {
      return `能量不足，建议休息恢复`;
    }
  }
  
  /**
   * 计算预算（不含恢复，避免递归）
   */
  private calculateBudgetWithoutRecovery(): Omit<EnergyBudget, 'statusDescription'> {
    const maxByEnergy = Math.floor(this.state.current / this.config.costPerDepth);
    const fatigueFactor = 1 - this.state.fatigue / 200;
    const curiosityBonus = 1 + this.state.curiosity * 0.2;
    
    const rawDepth = maxByEnergy * fatigueFactor * curiosityBonus;
    const recommendedDepth = Math.max(1, Math.min(Math.floor(rawDepth), this.config.maxDepth));
    const recommendedSimulations = 10 * recommendedDepth;
    const isLowEnergy = this.state.current < this.config.minEnergyThreshold;
    
    return {
      available: this.state.current,
      allocated: 0,
      remaining: this.state.current,
      recommendedDepth,
      recommendedSimulations,
      isLowEnergy,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createEnergyBudgetManager(config?: Partial<EnergyBudgetConfig>): EnergyBudgetManager {
  return new EnergyBudgetManager(config);
}

/**
 * 创建默认能量预算管理器
 */
export function createDefaultEnergyBudgetManager(): EnergyBudgetManager {
  return new EnergyBudgetManager(DEFAULT_CONFIG);
}

export default EnergyBudgetManager;
