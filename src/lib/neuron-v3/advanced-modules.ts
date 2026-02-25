/**
 * ═══════════════════════════════════════════════════════════════════════
 * 认知模块 - 高级扩展
 * 
 * 包含：
 * - 计划模块（PlanningModule）：目标分解、任务规划
 * - 执行控制模块（ExecutiveModule）：注意力控制、任务切换
 * - 神经元集成模块（NeuronIntegratedModule）：与神经元网络深度集成
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GlobalWorkspace,
  ConsciousContent,
  ConsciousContentType,
  CognitiveModule,
  CandidateContent,
  getGlobalWorkspace,
} from './global-workspace';
import {
  PredictiveNeuron,
  NeuronRole,
} from './predictive-neuron';
import {
  PredictionLoop,
  getPredictionLoop,
} from './prediction-loop';
import {
  VSASemanticSpace,
  getVSASpace,
} from './vsa-space';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 目标
 */
export interface Goal {
  /** 目标ID */
  id: string;
  
  /** 目标描述 */
  description: string;
  
  /** 目标向量表示 */
  vector: number[];
  
  /** 优先级 [0, 1] */
  priority: number;
  
  /** 进度 [0, 1] */
  progress: number;
  
  /** 子目标 */
  subGoals: Goal[];
  
  /** 父目标ID */
  parentGoalId?: string;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 截止时间 */
  deadline?: number;
  
  /** 状态 */
  status: 'active' | 'completed' | 'abandoned' | 'blocked';
}

/**
 * 计划
 */
export interface Plan {
  /** 计划ID */
  id: string;
  
  /** 关联的目标 */
  goalId: string;
  
  /** 步骤 */
  steps: PlanStep[];
  
  /** 当前步骤索引 */
  currentStepIndex: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 预计完成时间 */
  estimatedCompletion?: number;
}

/**
 * 计划步骤
 */
export interface PlanStep {
  /** 步骤ID */
  id: string;
  
  /** 步骤描述 */
  description: string;
  
  /** 预期结果 */
  expectedOutcome: string;
  
  /** 实际结果 */
  actualOutcome?: string;
  
  /** 状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  /** 开始时间 */
  startedAt?: number;
  
  /** 完成时间 */
  completedAt?: number;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  /** 当前目标 */
  currentGoal?: Goal;
  
  /** 当前计划 */
  currentPlan?: Plan;
  
  /** 活跃任务 */
  activeTasks: Task[];
  
  /** 注意力焦点 */
  attentionFocus: string[];
  
  /** 工作记忆 */
  workingMemory: Map<string, unknown>;
  
  /** 时间压力 */
  timePressure: number;
}

/**
 * 任务
 */
export interface Task {
  /** 任务ID */
  id: string;
  
  /** 任务描述 */
  description: string;
  
  /** 优先级 */
  priority: number;
  
  /** 紧急程度 */
  urgency: number;
  
  /** 重要性 */
  importance: number;
  
  /** 状态 */
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 模块内容
 */
export interface ModuleContent {
  type: string;
  data: unknown;
  strength: number;
  relevance: number;
  novelty: number;
}

// ─────────────────────────────────────────────────────────────────────
// 计划模块
// ─────────────────────────────────────────────────────────────────────

/**
 * 计划模块
 * 
 * 负责：
 * 1. 目标分解：将大目标分解为子目标
 * 2. 计划生成：生成达成目标的计划
 * 3. 计划执行：监控计划执行
 * 4. 计划调整：根据反馈调整计划
 */
export class PlanningModule implements CognitiveModule {
  name = 'planning';
  
  private goals: Map<string, Goal>;
  private plans: Map<string, Plan>;
  private vsa: VSASemanticSpace;
  private globalWorkspace: GlobalWorkspace | null = null;
  
  constructor() {
    this.goals = new Map();
    this.plans = new Map();
    this.vsa = getVSASpace(10000);
  }

  /**
   * 设置全局工作空间引用
   */
  setGlobalWorkspace(workspace: GlobalWorkspace): void {
    this.globalWorkspace = workspace;
  }

  /**
   * 产生候选内容
   */
  async produceContent(): Promise<CandidateContent | null> {
    // 获取当前活跃目标
    const activeGoal = this.getActiveGoal();
    if (!activeGoal) return null;
    
    // 检查是否需要生成计划
    const plan = this.plans.get(activeGoal.id);
    if (!plan) {
      // 需要生成计划
      return {
        source: this.name,
        type: 'thought',
        content: {
          action: 'generate_plan',
          goal: activeGoal,
        },
        strength: 0.7,
        relevance: 0.9,
        novelty: 0.3,
        attentionScore: 0.7,
      };
    }
    
    // 检查当前步骤进度
    const currentStep = plan.steps[plan.currentStepIndex];
    if (currentStep && currentStep.status === 'completed') {
      // 步骤完成，推进到下一步
      return {
        source: this.name,
        type: 'thought',
        content: {
          action: 'advance_step',
          plan: plan,
        },
        strength: 0.6,
        relevance: 0.8,
        novelty: 0.2,
        attentionScore: 0.6,
      };
    }
    
    // 当前步骤进行中
    return {
      source: this.name,
      type: 'thought',
      content: {
        action: 'execute_step',
        step: currentStep,
        plan: plan,
      },
      strength: 0.5,
      relevance: 0.7,
      novelty: 0.1,
      attentionScore: 0.5,
    };
  }

  /**
   * 接收广播
   */
  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 处理意识内容，可能影响计划
    if (content.type === 'semantic') {
      // 语义内容可能包含新信息，影响目标
      await this.processSemanticContent(content);
    } else if (content.type === 'metacognitive') {
      // 元认知内容可能触发计划调整
      await this.processMetacognitiveContent(content);
    }
  }

  /**
   * 获取状态
   */
  getState(): unknown {
    return {
      goalCount: this.goals.size,
      planCount: this.plans.size,
      activeGoal: this.getActiveGoal(),
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 目标管理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 设置目标
   */
  setGoal(description: string, priority: number = 0.5): Goal {
    const vector = this.vsa.getConcept(description);
    
    const goal: Goal = {
      id: uuidv4(),
      description,
      vector: vector,
      priority,
      progress: 0,
      subGoals: [],
      createdAt: Date.now(),
      status: 'active',
    };
    
    this.goals.set(goal.id, goal);
    
    return goal;
  }

  /**
   * 分解目标
   */
  decomposeGoal(goalId: string): Goal[] {
    const goal = this.goals.get(goalId);
    if (!goal) return [];
    
    // 简化实现：创建通用子目标
    // 实际应该使用更智能的分解策略
    const subGoalDescriptions = [
      `理解：${goal.description}`,
      `规划：${goal.description}`,
      `执行：${goal.description}`,
      `验证：${goal.description}`,
    ];
    
    const subGoals: Goal[] = [];
    
    for (const desc of subGoalDescriptions) {
      const subGoal = this.setGoal(desc, goal.priority * 0.8);
      subGoal.parentGoalId = goalId;
      goal.subGoals.push(subGoal);
      subGoals.push(subGoal);
    }
    
    return subGoals;
  }

  /**
   * 获取活跃目标
   */
  getActiveGoal(): Goal | null {
    for (const goal of this.goals.values()) {
      if (goal.status === 'active' && goal.progress < 1) {
        return goal;
      }
    }
    return null;
  }

  /**
   * 更新目标进度
   */
  updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    
    goal.progress = Math.min(1, Math.max(0, progress));
    
    if (goal.progress >= 1) {
      goal.status = 'completed';
    }
    
    // 更新父目标进度
    if (goal.parentGoalId) {
      const parent = this.goals.get(goal.parentGoalId);
      if (parent) {
        const subProgress = parent.subGoals.reduce((sum, sg) => sum + sg.progress, 0) / parent.subGoals.length;
        this.updateGoalProgress(parent.id, subProgress);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 计划管理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 生成计划
   */
  generatePlan(goalId: string): Plan | null {
    const goal = this.goals.get(goalId);
    if (!goal) return null;
    
    // 简化实现：创建基础步骤
    // 实际应该根据目标类型生成更具体的步骤
    const steps: PlanStep[] = [
      {
        id: uuidv4(),
        description: `分析目标：${goal.description}`,
        expectedOutcome: '理解目标要求',
        status: 'pending',
      },
      {
        id: uuidv4(),
        description: `收集信息`,
        expectedOutcome: '获取必要的背景信息',
        status: 'pending',
      },
      {
        id: uuidv4(),
        description: `执行核心任务`,
        expectedOutcome: '完成主要工作',
        status: 'pending',
      },
      {
        id: uuidv4(),
        description: `验证结果`,
        expectedOutcome: '确认目标达成',
        status: 'pending',
      },
    ];
    
    const plan: Plan = {
      id: uuidv4(),
      goalId,
      steps,
      currentStepIndex: 0,
      createdAt: Date.now(),
    };
    
    this.plans.set(plan.id, plan);
    
    return plan;
  }

  /**
   * 推进计划步骤
   */
  advancePlan(planId: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;
    
    // 标记当前步骤完成
    if (plan.currentStepIndex < plan.steps.length) {
      plan.steps[plan.currentStepIndex].status = 'completed';
      plan.steps[plan.currentStepIndex].completedAt = Date.now();
    }
    
    // 推进到下一步
    plan.currentStepIndex++;
    
    // 更新目标进度
    const progress = plan.currentStepIndex / plan.steps.length;
    this.updateGoalProgress(plan.goalId, progress);
  }

  /**
   * 调整计划
   */
  adjustPlan(planId: string, reason: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;
    
    // 简化实现：添加新步骤
    plan.steps.push({
      id: uuidv4(),
      description: `调整步骤：${reason}`,
      expectedOutcome: '处理计划偏差',
      status: 'pending',
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════

  private async processSemanticContent(content: ConsciousContent): Promise<void> {
    // 检查是否与当前目标相关
    const activeGoal = this.getActiveGoal();
    if (!activeGoal) return;
    
    // 简化：总是更新进度
    // 实际应该分析内容与目标的关系
  }

  private async processMetacognitiveContent(content: ConsciousContent): Promise<void> {
    // 元认知内容可能触发计划调整
    const data = content.data as { observation?: string };
    if (data.observation?.includes('困难') || data.observation?.includes('失败')) {
      const activeGoal = this.getActiveGoal();
      if (activeGoal) {
        const plan = Array.from(this.plans.values()).find(p => p.goalId === activeGoal.id);
        if (plan) {
          this.adjustPlan(plan.id, data.observation);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 执行控制模块
// ─────────────────────────────────────────────────────────────────────

/**
 * 执行控制模块
 * 
 * 负责：
 * 1. 注意力控制：决定关注什么
 * 2. 任务切换：在多任务间切换
 * 3. 冲突解决：处理目标冲突
 * 4. 资源分配：分配认知资源
 */
export class ExecutiveModule implements CognitiveModule {
  name = 'executive';
  
  private context: ExecutionContext;
  private taskQueue: Task[];
  private vsa: VSASemanticSpace;
  private globalWorkspace: GlobalWorkspace | null = null;
  
  /** 注意力聚光灯 */
  private attentionSpotlight = {
    focus: '',
    intensity: 0.5,
    spread: 0.3,
  };
  
  /** 切换成本 */
  private switchCost = 0.1;
  
  constructor() {
    this.vsa = getVSASpace(10000);
    this.taskQueue = [];
    this.context = {
      activeTasks: [],
      attentionFocus: [],
      workingMemory: new Map(),
      timePressure: 0,
    };
  }

  /**
   * 设置全局工作空间引用
   */
  setGlobalWorkspace(workspace: GlobalWorkspace): void {
    this.globalWorkspace = workspace;
  }

  /**
   * 产生候选内容
   */
  async produceContent(): Promise<CandidateContent | null> {
    // 检查是否有紧急任务
    const urgentTask = this.getMostUrgentTask();
    if (urgentTask && urgentTask.urgency > 0.8) {
      return {
        source: this.name,
        type: 'thought',
        content: {
          action: 'handle_urgent_task',
          task: urgentTask,
        },
        strength: urgentTask.urgency,
        relevance: 1.0,
        novelty: 0.1,
        attentionScore: urgentTask.urgency,
      };
    }
    
    // 检查是否需要任务切换
    if (this.shouldSwitchTask()) {
      const nextTask = this.selectNextTask();
      if (nextTask) {
        return {
          source: this.name,
          type: 'thought',
          content: {
            action: 'switch_task',
            from: this.context.activeTasks[0],
            to: nextTask,
          },
          strength: 0.6,
          relevance: 0.8,
          novelty: 0.4,
          attentionScore: 0.6,
        };
      }
    }
    
    // 维持当前任务
    const currentTask = this.context.activeTasks[0];
    if (currentTask) {
      return {
        source: this.name,
        type: 'thought',
        content: {
          action: 'continue_task',
          task: currentTask,
        },
        strength: 0.4,
        relevance: 0.6,
        novelty: 0.0,
        attentionScore: 0.4,
      };
    }
    
    return null;
  }

  /**
   * 接收广播
   */
  async receiveBroadcast(content: ConsciousContent): Promise<void> {
    // 意识内容可能影响注意力分配
    if (content.type === 'perceptual' || content.type === 'emotional') {
      // 感知和情感内容可能需要调整注意力
      this.adjustAttention(content);
    } else if (content.type === 'metacognitive') {
      // 元认知内容可能需要重新评估任务
      this.reevaluateTasks();
    }
  }

  /**
   * 获取状态
   */
  getState(): unknown {
    return {
      activeTaskCount: this.context.activeTasks.length,
      queuedTaskCount: this.taskQueue.length,
      attentionSpotlight: this.attentionSpotlight,
      timePressure: this.context.timePressure,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 任务管理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 添加任务
   */
  addTask(description: string, priority: number = 0.5, urgency: number = 0.5): Task {
    const task: Task = {
      id: uuidv4(),
      description,
      priority,
      urgency,
      importance: priority,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    this.taskQueue.push(task);
    
    return task;
  }

  /**
   * 获取最紧急的任务
   */
  getMostUrgentTask(): Task | null {
    const pendingTasks = this.taskQueue.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) return null;
    
    pendingTasks.sort((a, b) => {
      // 综合紧急度和重要性
      const scoreA = a.urgency * 0.6 + a.importance * 0.4;
      const scoreB = b.urgency * 0.6 + b.importance * 0.4;
      return scoreB - scoreA;
    });
    
    return pendingTasks[0];
  }

  /**
   * 选择下一个任务
   */
  selectNextTask(): Task | null {
    return this.getMostUrgentTask();
  }

  /**
   * 判断是否应该切换任务
   */
  private shouldSwitchTask(): boolean {
    const currentTask = this.context.activeTasks[0];
    if (!currentTask) return this.taskQueue.length > 0;
    
    // 检查是否有更紧急的任务
    const mostUrgent = this.getMostUrgentTask();
    if (!mostUrgent) return false;
    
    // 切换成本考虑
    const urgencyGain = mostUrgent.urgency - currentTask.urgency;
    return urgencyGain > this.switchCost;
  }

  /**
   * 切换任务
   */
  switchTask(): Task | null {
    const nextTask = this.selectNextTask();
    if (!nextTask) return null;
    
    // 暂停当前任务
    const currentTask = this.context.activeTasks.shift();
    if (currentTask) {
      currentTask.status = 'pending';
      this.taskQueue.push(currentTask);
    }
    
    // 激活新任务
    nextTask.status = 'running';
    this.context.activeTasks.unshift(nextTask);
    
    // 从队列移除
    const index = this.taskQueue.findIndex(t => t.id === nextTask.id);
    if (index >= 0) {
      this.taskQueue.splice(index, 1);
    }
    
    // 更新注意力焦点
    this.attentionSpotlight.focus = nextTask.description;
    this.attentionSpotlight.intensity = 0.8;
    
    return nextTask;
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string): void {
    const task = this.context.activeTasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      this.context.activeTasks = this.context.activeTasks.filter(t => t.id !== taskId);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 注意力控制
  // ══════════════════════════════════════════════════════════════════

  /**
   * 设置注意力焦点
   */
  setAttentionFocus(focus: string, intensity: number = 0.8): void {
    this.attentionSpotlight.focus = focus;
    this.attentionSpotlight.intensity = intensity;
    this.context.attentionFocus = [focus];
    
    // 同步到全局工作空间
    if (this.globalWorkspace) {
      this.globalWorkspace.focusAttention({
        focusKeywords: focus.split(' '),
      });
    }
  }

  /**
   * 调整注意力
   */
  private adjustAttention(content: ConsciousContent): void {
    // 根据内容强度调整注意力
    if (content.strength > 0.7) {
      // 高强度内容获取注意力
      this.attentionSpotlight.intensity = Math.min(1, this.attentionSpotlight.intensity + 0.1);
    }
  }

  /**
   * 分散注意力
   */
  disperseAttention(): void {
    this.attentionSpotlight.intensity *= 0.8;
    this.attentionSpotlight.spread = Math.min(1, this.attentionSpotlight.spread + 0.1);
    this.context.attentionFocus = [];
  }

  // ══════════════════════════════════════════════════════════════════
  // 工作记忆
  // ══════════════════════════════════════════════════════════════════

  /**
   * 存入工作记忆
   */
  addToWorkingMemory(key: string, value: unknown): void {
    this.context.workingMemory.set(key, value);
    
    // 限制工作记忆大小
    if (this.context.workingMemory.size > 7) {
      // 移除最旧的项
      const firstKey = this.context.workingMemory.keys().next().value as string | undefined;
      if (firstKey) {
        this.context.workingMemory.delete(firstKey);
      }
    }
  }

  /**
   * 从工作记忆读取
   */
  getFromWorkingMemory(key: string): unknown | undefined {
    return this.context.workingMemory.get(key);
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════

  private reevaluateTasks(): void {
    // 重新评估所有任务的优先级
    const now = Date.now();
    
    for (const task of this.taskQueue) {
      // 时间压力增加紧急度
      const age = (now - task.createdAt) / 1000 / 60; // 分钟
      task.urgency = Math.min(1, task.urgency + age * 0.01);
    }
    
    // 重新排序
    this.taskQueue.sort((a, b) => {
      const scoreA = a.urgency * 0.6 + a.importance * 0.4;
      const scoreB = b.urgency * 0.6 + b.importance * 0.4;
      return scoreB - scoreA;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// 神经元集成模块基类
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元集成模块基类
 * 
 * 提供认知模块与神经元网络的深度集成
 */
export abstract class NeuronIntegratedModule implements CognitiveModule {
  abstract name: string;
  
  protected userId: string;
  protected predictionLoop: PredictionLoop;
  protected vsa: VSASemanticSpace;
  protected globalWorkspace: GlobalWorkspace | null = null;
  
  /** 关联的神经元 */
  protected associatedNeurons: Map<string, PredictiveNeuron> = new Map();
  
  constructor(userId: string) {
    this.userId = userId;
    this.predictionLoop = getPredictionLoop(userId);
    this.vsa = getVSASpace(10000);
  }

  /**
   * 设置全局工作空间引用
   */
  setGlobalWorkspace(workspace: GlobalWorkspace): void {
    this.globalWorkspace = workspace;
  }

  /**
   * 抽象方法：产生候选内容
   */
  abstract produceContent(): Promise<CandidateContent | null>;
  
  /**
   * 抽象方法：接收广播
   */
  abstract receiveBroadcast(content: ConsciousContent): Promise<void>;
  
  /**
   * 获取状态
   */
  getState(): unknown {
    return {
      associatedNeuronCount: this.associatedNeurons.size,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 神经元集成方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 激活关联神经元
   */
  protected async activateAssociatedNeurons(stimulus: string): Promise<Map<string, number>> {
    const activations = new Map<string, number>();
    const stimulusVector = this.vsa.getConcept(stimulus);
    
    for (const [id, neuron] of this.associatedNeurons) {
      // 计算刺激与神经元的匹配度
      const similarity = this.computeSimilarity(
        stimulusVector,
        neuron.sensitivityVector
      );
      
      if (similarity > 0.3) {
        activations.set(id, similarity);
        neuron.actual.activation = similarity;
        neuron.actual.lastActivatedAt = Date.now();
      }
    }
    
    return activations;
  }

  /**
   * 学习：调整关联神经元的敏感度
   */
  protected async learnFromFeedback(
    feedback: number,
    activeNeuronIds: string[]
  ): Promise<void> {
    for (const id of activeNeuronIds) {
      const neuron = this.associatedNeurons.get(id);
      if (!neuron) continue;
      
      // 调整效用
      neuron.meta.usefulness += 0.1 * feedback;
      neuron.meta.usefulness = Math.max(0, Math.min(1, neuron.meta.usefulness));
      
      // 调整学习率
      neuron.learning.learningRate *= feedback > 0 ? 1.1 : 0.9;
    }
  }

  /**
   * 关联神经元
   */
  protected associateNeuron(neuron: PredictiveNeuron): void {
    this.associatedNeurons.set(neuron.id, neuron);
  }

  /**
   * 取消关联神经元
   */
  protected disassociateNeuron(neuronId: string): void {
    this.associatedNeurons.delete(neuronId);
  }

  /**
   * 计算向量相似度
   */
  protected computeSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const norm = Math.sqrt(normA) * Math.sqrt(normB);
    return norm > 0 ? dotProduct / norm : 0;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let planningModuleInstance: PlanningModule | null = null;
let executiveModuleInstance: ExecutiveModule | null = null;

export function getPlanningModule(): PlanningModule {
  if (!planningModuleInstance) {
    planningModuleInstance = new PlanningModule();
  }
  return planningModuleInstance;
}

export function getExecutiveModule(): ExecutiveModule {
  if (!executiveModuleInstance) {
    executiveModuleInstance = new ExecutiveModule();
  }
  return executiveModuleInstance;
}

export function resetAdvancedModules(): void {
  planningModuleInstance = null;
  executiveModuleInstance = null;
}
