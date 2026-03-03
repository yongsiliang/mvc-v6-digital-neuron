/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自动进化调度器 (Auto Evolution Scheduler)
 * 
 * 核心理念：
 * - 累积足够的反思和学习后自动触发进化
 * - 渐进式进化：先小改，验证后再大改
 * - 安全第一：所有进化可回滚
 * 
 * 进化触发条件：
 * 1. 累积反思次数达到阈值
 * 2. 发现高优先级问题
 * 3. 性能持续下降
 * 4. 用户主动触发
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { 
  SelfEvolutionPlan, 
  AlgorithmReflection,
  HigherDimensionThought,
  ExtractedInsight,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化触发器
 */
export interface EvolutionTrigger {
  type: 'accumulation' | 'priority' | 'performance' | 'user' | 'scheduled';
  threshold: number;
  current: number;
  triggered: boolean;
  reason: string;
}

/**
 * 进化状态
 */
export interface EvolutionState {
  /** 累积的反思 */
  accumulatedReflections: AlgorithmReflection[];
  
  /** 累积的洞察 */
  accumulatedInsights: ExtractedInsight[];
  
  /** 累积的高维思维 */
  accumulatedThoughts: HigherDimensionThought[];
  
  /** 待执行的进化计划 */
  pendingPlans: SelfEvolutionPlan[];
  
  /** 正在执行的进化 */
  activePlan: SelfEvolutionPlan | null;
  
  /** 已完成的进化 */
  completedPlans: SelfEvolutionPlan[];
  
  /** 失败的进化 */
  failedPlans: SelfEvolutionPlan[];
  
  /** 触发器状态 */
  triggers: EvolutionTrigger[];
  
  /** 上次进化时间 */
  lastEvolutionTime: number;
  
  /** 进化次数统计 */
  stats: {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    rollbackCount: number;
  };
}

/**
 * 自动进化配置
 */
export interface AutoEvolutionConfig {
  /** 是否启用自动进化 */
  enabled: boolean;
  
  /** 累积触发阈值 */
  accumulationThreshold: number;
  
  /** 最小进化间隔（ms） */
  minEvolutionInterval: number;
  
  /** 最大并发进化数 */
  maxConcurrentEvolutions: number;
  
  /** 是否需要验证 */
  requireValidation: boolean;
  
  /** 是否允许回滚 */
  allowRollback: boolean;
  
  /** 进化优先级阈值 */
  priorityThreshold: 'critical' | 'high' | 'medium' | 'low';
  
  /** 性能下降触发阈值 */
  performanceDropThreshold: number;
  
  /** 是否启用渐进式进化 */
  enableGradualEvolution: boolean;
}

const DEFAULT_CONFIG: AutoEvolutionConfig = {
  enabled: true,
  accumulationThreshold: 5,  // 累积5次反思后触发
  minEvolutionInterval: 60000,  // 最少间隔1分钟
  maxConcurrentEvolutions: 1,
  requireValidation: true,
  allowRollback: true,
  priorityThreshold: 'high',
  performanceDropThreshold: 0.2,  // 性能下降20%触发
  enableGradualEvolution: true,
};

// ─────────────────────────────────────────────────────────────────────
// 自动进化调度器
// ─────────────────────────────────────────────────────────────────────

/**
 * 自动进化调度器
 * 
 * 核心职责：
 * 1. 监控反思和学习积累
 * 2. 判断是否触发进化
 * 3. 生成进化计划
 * 4. 执行和验证进化
 */
export class AutoEvolutionScheduler {
  private config: AutoEvolutionConfig;
  private state: EvolutionState;
  
  // 回调函数
  private onEvolutionStart?: (plan: SelfEvolutionPlan) => void;
  private onEvolutionComplete?: (plan: SelfEvolutionPlan, success: boolean) => void;
  private onRollback?: (plan: SelfEvolutionPlan) => void;
  
  constructor(config?: Partial<AutoEvolutionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化状态
    this.state = {
      accumulatedReflections: [],
      accumulatedInsights: [],
      accumulatedThoughts: [],
      pendingPlans: [],
      activePlan: null,
      completedPlans: [],
      failedPlans: [],
      triggers: [
        {
          type: 'accumulation',
          threshold: this.config.accumulationThreshold,
          current: 0,
          triggered: false,
          reason: '累积反思次数达到阈值',
        },
        {
          type: 'priority',
          threshold: 1,
          current: 0,
          triggered: false,
          reason: '发现高优先级问题',
        },
        {
          type: 'performance',
          threshold: this.config.performanceDropThreshold,
          current: 0,
          triggered: false,
          reason: '性能持续下降',
        },
        {
          type: 'scheduled',
          threshold: 1,
          current: 0,
          triggered: false,
          reason: '定时进化检查',
        },
      ],
      lastEvolutionTime: 0,
      stats: {
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        rollbackCount: 0,
      },
    };
  }
  
  /**
   * 添加反思
   */
  addReflection(reflection: AlgorithmReflection): void {
    this.state.accumulatedReflections.push(reflection);
    
    // 更新累积触发器
    const accumulationTrigger = this.state.triggers.find(t => t.type === 'accumulation');
    if (accumulationTrigger) {
      accumulationTrigger.current = this.state.accumulatedReflections.length;
      accumulationTrigger.triggered = accumulationTrigger.current >= accumulationTrigger.threshold;
    }
    
    // 检查优先级触发器
    if (reflection.priority === 'critical' || reflection.priority === 'high') {
      const priorityTrigger = this.state.triggers.find(t => t.type === 'priority');
      if (priorityTrigger) {
        priorityTrigger.current++;
        priorityTrigger.triggered = true;
      }
    }
    
    // 尝试触发进化
    this.tryTriggerEvolution();
  }
  
  /**
   * 添加洞察
   */
  addInsight(insight: ExtractedInsight): void {
    this.state.accumulatedInsights.push(insight);
  }
  
  /**
   * 添加高维思维
   */
  addThought(thought: HigherDimensionThought): void {
    this.state.accumulatedThoughts.push(thought);
  }
  
  /**
   * 报告性能变化
   */
  reportPerformance(currentPerformance: number, baselinePerformance: number): void {
    const drop = (baselinePerformance - currentPerformance) / baselinePerformance;
    
    const performanceTrigger = this.state.triggers.find(t => t.type === 'performance');
    if (performanceTrigger) {
      performanceTrigger.current = drop;
      performanceTrigger.triggered = drop >= performanceTrigger.threshold;
    }
    
    if (performanceTrigger?.triggered) {
      this.tryTriggerEvolution();
    }
  }
  
  /**
   * 用户触发进化
   */
  userTrigger(): void {
    const userTrigger: EvolutionTrigger = {
      type: 'user',
      threshold: 1,
      current: 1,
      triggered: true,
      reason: '用户主动触发',
    };
    
    this.state.triggers.push(userTrigger);
    this.tryTriggerEvolution();
  }
  
  /**
   * 定时检查
   */
  scheduledCheck(): void {
    const scheduledTrigger = this.state.triggers.find(t => t.type === 'scheduled');
    if (scheduledTrigger) {
      scheduledTrigger.current++;
      scheduledTrigger.triggered = true;
    }
    
    this.tryTriggerEvolution();
  }
  
  /**
   * 尝试触发进化
   */
  private tryTriggerEvolution(): void {
    // 检查是否启用自动进化
    if (!this.config.enabled) {
      return;
    }
    
    // 检查是否有正在进行的进化
    if (this.state.activePlan !== null) {
      return;
    }
    
    // 检查最小间隔
    const elapsed = Date.now() - this.state.lastEvolutionTime;
    if (elapsed < this.config.minEvolutionInterval) {
      return;
    }
    
    // 检查触发器
    const triggeredTriggers = this.state.triggers.filter(t => t.triggered);
    if (triggeredTriggers.length === 0) {
      return;
    }
    
    // 生成进化计划
    const plan = this.generateEvolutionPlan(triggeredTriggers);
    if (plan) {
      this.executeEvolution(plan);
    }
  }
  
  /**
   * 生成进化计划
   */
  private generateEvolutionPlan(triggers: EvolutionTrigger[]): SelfEvolutionPlan | null {
    // 合并反思和思维
    const reflections = this.state.accumulatedReflections;
    const thoughts = this.state.accumulatedThoughts;
    
    if (reflections.length === 0 && thoughts.length === 0) {
      return null;
    }
    
    // 确定改变内容
    const changes = this.determineChanges(reflections, thoughts);
    
    if (changes.length === 0) {
      return null;
    }
    
    // 渐进式进化：只取最高优先级的改变
    if (this.config.enableGradualEvolution && changes.length > 1) {
      changes.sort((a, b) => {
        const priorityOrder = { add: 1, modify: 2, optimize: 3, remove: 4 };
        return priorityOrder[a.action] - priorityOrder[b.action];
      });
      changes.length = 1;  // 只保留一个改变
    }
    
    const plan: SelfEvolutionPlan = {
      id: `evolution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      triggeredBy: triggers.map(t => t.reason).join('; '),
      changes,
      validationPlan: this.createValidationPlan(changes),
      rollbackPlan: this.createRollbackPlan(changes),
      status: 'proposed',
    };
    
    return plan;
  }
  
  /**
   * 执行进化
   */
  private async executeEvolution(plan: SelfEvolutionPlan): Promise<void> {
    this.state.activePlan = plan;
    plan.status = 'testing';
    
    this.state.stats.totalAttempts++;
    this.state.lastEvolutionTime = Date.now();
    
    // 回调
    this.onEvolutionStart?.(plan);
    
    try {
      // 模拟执行（实际执行需要具体实现）
      const success = await this.applyChanges(plan.changes);
      
      if (success) {
        // 验证
        if (this.config.requireValidation) {
          const validationPassed = await this.validateEvolution(plan);
          
          if (validationPassed) {
            plan.status = 'applied';
            this.state.completedPlans.push(plan);
            this.state.stats.successCount++;
          } else {
            // 回滚
            if (this.config.allowRollback) {
              await this.rollbackEvolution(plan);
              this.state.stats.rollbackCount++;
            }
            plan.status = 'rejected';
            this.state.failedPlans.push(plan);
            this.state.stats.failureCount++;
          }
        } else {
          plan.status = 'applied';
          this.state.completedPlans.push(plan);
          this.state.stats.successCount++;
        }
      } else {
        plan.status = 'rejected';
        this.state.failedPlans.push(plan);
        this.state.stats.failureCount++;
      }
      
      // 清空累积
      this.clearAccumulation();
      
      // 重置触发器
      this.resetTriggers();
      
      // 回调
      this.onEvolutionComplete?.(plan, plan.status === 'applied');
      
    } catch (error) {
      plan.status = 'rejected';
      this.state.failedPlans.push(plan);
      this.state.stats.failureCount++;
      
      this.onEvolutionComplete?.(plan, false);
    } finally {
      this.state.activePlan = null;
    }
  }
  
  /**
   * 应用改变
   */
  private async applyChanges(changes: SelfEvolutionPlan['changes']): Promise<boolean> {
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 实际执行需要具体实现
    // 这里只返回成功
    console.log(`[自动进化] 应用改变: ${changes.map(c => c.description).join(', ')}`);
    
    return true;
  }
  
  /**
   * 验证进化
   */
  private async validateEvolution(plan: SelfEvolutionPlan): Promise<boolean> {
    // 模拟验证延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 实际验证需要具体实现
    console.log(`[自动进化] 验证进化: ${plan.id}`);
    
    return true;
  }
  
  /**
   * 回滚进化
   */
  private async rollbackEvolution(plan: SelfEvolutionPlan): Promise<void> {
    // 模拟回滚延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[自动进化] 回滚进化: ${plan.id}`);
    
    this.onRollback?.(plan);
  }
  
  /**
   * 确定改变内容
   */
  private determineChanges(
    reflections: AlgorithmReflection[],
    thoughts: HigherDimensionThought[]
  ): SelfEvolutionPlan['changes'] {
    const changes: SelfEvolutionPlan['changes'] = [];
    
    // 从反思中提取改变
    for (const reflection of reflections) {
      // 只处理高优先级
      if (reflection.priority === 'low') continue;
      
      for (const improvement of reflection.potentialImprovements) {
        changes.push({
          system: reflection.targetSystem,
          action: 'modify',
          description: improvement,
          expectedImpact: `解决${reflection.targetSystem}的局限性`,
        });
      }
    }
    
    // 从高维思维中提取改变
    for (const thought of thoughts) {
      if (thought.dimension === 'paradigm-shift' || thought.dimension === 'emergence') {
        for (const insight of thought.actionableInsights) {
          changes.push({
            system: 'core',
            action: 'add',
            description: insight,
            expectedImpact: thought.higherDimensionView,
          });
        }
      }
    }
    
    return changes;
  }
  
  /**
   * 创建验证计划
   */
  private createValidationPlan(changes: SelfEvolutionPlan['changes']): string {
    return `验证以下改变的效果: ${changes.map(c => c.system).join(', ')}`;
  }
  
  /**
   * 创建回滚计划
   */
  private createRollbackPlan(changes: SelfEvolutionPlan['changes']): string {
    return `回滚以下改变: ${changes.map(c => c.description).join(', ')}`;
  }
  
  /**
   * 清空累积
   */
  private clearAccumulation(): void {
    this.state.accumulatedReflections = [];
    this.state.accumulatedInsights = [];
    this.state.accumulatedThoughts = [];
  }
  
  /**
   * 重置触发器
   */
  private resetTriggers(): void {
    for (const trigger of this.state.triggers) {
      trigger.current = 0;
      trigger.triggered = false;
    }
  }
  
  /**
   * 设置回调
   */
  setCallbacks(callbacks: {
    onEvolutionStart?: (plan: SelfEvolutionPlan) => void;
    onEvolutionComplete?: (plan: SelfEvolutionPlan, success: boolean) => void;
    onRollback?: (plan: SelfEvolutionPlan) => void;
  }): void {
    this.onEvolutionStart = callbacks.onEvolutionStart;
    this.onEvolutionComplete = callbacks.onEvolutionComplete;
    this.onRollback = callbacks.onRollback;
  }
  
  /**
   * 获取状态
   */
  getState(): EvolutionState {
    return { ...this.state };
  }
  
  /**
   * 获取统计
   */
  getStats(): EvolutionState['stats'] {
    return { ...this.state.stats };
  }
  
  /**
   * 启用/禁用自动进化
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
  
  /**
   * 手动触发进化
   */
  forceEvolution(): SelfEvolutionPlan | null {
    this.userTrigger();
    return this.state.activePlan;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建自动进化调度器
 */
export function createAutoEvolutionScheduler(config?: Partial<AutoEvolutionConfig>): AutoEvolutionScheduler {
  return new AutoEvolutionScheduler(config);
}
