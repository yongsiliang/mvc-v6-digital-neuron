/**
 * ═══════════════════════════════════════════════════════════════════════
 * 认知协调器 - Cognitive Coordinator
 * 
 * 核心功能：
 * 1. 协调所有认知模块的工作
 * 2. 管理模块与神经元网络的交互
 * 3. 处理跨模块的信息流
 * 4. 维护系统的整体一致性
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GlobalWorkspace,
  ConsciousContent,
  CognitiveModule,
  getGlobalWorkspace,
  resetGlobalWorkspace,
  PerceptualModule,
  LanguageModule,
  MemoryModule,
  EmotionalModule,
  MetacognitiveModule,
} from './global-workspace';
import {
  PlanningModule,
  ExecutiveModule,
  getPlanningModule,
  getExecutiveModule,
  Goal,
  Plan,
  Task,
} from './advanced-modules';
import {
  PredictiveNeuron,
  createPredictiveNeuron,
  NeuronRole,
} from './predictive-neuron';
import {
  PredictionLoop,
  getPredictionLoop,
} from './prediction-loop';
import {
  NeuronGenerator,
  getNeuronGenerator,
  GenerationTrigger,
} from './neuron-generator';
import {
  VSASemanticSpace,
  getVSASpace,
} from './vsa-space';
import {
  MeaningCalculator,
  getMeaningCalculator,
  SubjectiveMeaning,
} from './meaning-calculator';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 协调器配置
 */
export interface CoordinatorConfig {
  /** 用户ID */
  userId: string;
  
  /** 是否启用计划模块 */
  enablePlanning: boolean;
  
  /** 是否启用执行控制模块 */
  enableExecutive: boolean;
  
  /** 是否启用神经元自动生成 */
  enableAutoGeneration: boolean;
  
  /** 处理周期（毫秒） */
  processingCycleMs: number;
}

/**
 * 处理上下文
 */
export interface ProcessingContext {
  /** 会话ID */
  sessionId: string;
  
  /** 输入内容 */
  input: string;
  
  /** 输入向量 */
  inputVector: number[];
  
  /** 当前目标 */
  currentGoal?: Goal;
  
  /** 当前计划 */
  currentPlan?: Plan;
  
  /** 活跃任务 */
  activeTasks: Task[];
  
  /** 工作记忆 */
  workingMemory: Map<string, unknown>;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 协调处理结果
 */
export interface CoordinatedResult {
  /** 神经元激活 */
  neuronActivations: Map<string, number>;
  
  /** 主观意义 */
  meaning?: SubjectiveMeaning;
  
  /** 意识内容 */
  consciousness?: ConsciousContent;
  
  /** 目标更新 */
  goalUpdates: Array<{
    goalId: string;
    progress: number;
    status: string;
  }>;
  
  /** 任务更新 */
  taskUpdates: Array<{
    taskId: string;
    status: string;
  }>;
  
  /** 新生成的神经元 */
  newNeurons: PredictiveNeuron[];
  
  /** 系统状态 */
  systemState: {
    consciousnessLevel: number;
    selfAwarenessIndex: number;
    neuronCount: number;
    activeGoalCount: number;
    activeTaskCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 认知协调器
// ─────────────────────────────────────────────────────────────────────

export class CognitiveCoordinator {
  private config: CoordinatorConfig;
  
  // 核心组件
  private globalWorkspace: GlobalWorkspace;
  private predictionLoop: PredictionLoop;
  private neuronGenerator: NeuronGenerator;
  private vsaSpace: VSASemanticSpace;
  private meaningCalculator: MeaningCalculator;
  
  // 高级模块
  private planningModule: PlanningModule;
  private executiveModule: ExecutiveModule;
  
  // 基础模块
  private perceptualModule: PerceptualModule;
  private languageModule: LanguageModule;
  private memoryModule: MemoryModule;
  private emotionalModule: EmotionalModule;
  private metacognitiveModule: MetacognitiveModule;
  
  // 状态
  private isInitialized = false;
  private recentInputs: Array<{ vector: number[]; content: string; timestamp: number }> = [];

  constructor(config: Partial<CoordinatorConfig> = {}) {
    this.config = {
      userId: 'default-user',
      enablePlanning: true,
      enableExecutive: true,
      enableAutoGeneration: true,
      processingCycleMs: 100,
      ...config,
    };
    
    // 初始化核心组件
    this.globalWorkspace = getGlobalWorkspace();
    this.predictionLoop = getPredictionLoop(this.config.userId);
    this.neuronGenerator = getNeuronGenerator(this.config.userId);
    this.vsaSpace = getVSASpace(10000);
    this.meaningCalculator = getMeaningCalculator();
    
    // 初始化高级模块
    this.planningModule = getPlanningModule();
    this.executiveModule = getExecutiveModule();
    
    // 初始化基础模块
    this.perceptualModule = new PerceptualModule();
    this.languageModule = new LanguageModule();
    this.memoryModule = new MemoryModule();
    this.emotionalModule = new EmotionalModule();
    this.metacognitiveModule = new MetacognitiveModule();
    
    // 注册所有模块到全局工作空间
    this.registerModules();
    
    this.isInitialized = true;
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心处理方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理输入 - 完整的认知循环
   */
  async processInput(input: string): Promise<CoordinatedResult> {
    const sessionId = uuidv4();
    const timestamp = Date.now();
    
    // 1. 编码输入
    const inputVector = this.vsaSpace.getConcept(input);
    
    // 2. 构建处理上下文
    const context: ProcessingContext = {
      sessionId,
      input,
      inputVector: inputVector,
      activeTasks: [],
      workingMemory: new Map(),
      timestamp,
    };
    
    // 3. 感知模块处理
    this.perceptualModule.setInput({
      id: sessionId,
      content: input,
      vector: inputVector,
      timestamp,
    });
    
    // 4. 激活神经元网络
    const neuronActivations = await this.activateNeurons(input, context);
    
    // 5. 计算主观意义
    const meaning = this.meaningCalculator.computeSubjectiveMeaning(input);
    
    // 6. 竞争进入意识
    const consciousness = await this.globalWorkspace.compete();
    
    // 7. 处理高级模块
    const goalUpdates = await this.processGoals(input, consciousness);
    const taskUpdates = await this.processTasks(input, consciousness);
    
    // 8. 自动生成神经元
    let newNeurons: PredictiveNeuron[] = [];
    if (this.config.enableAutoGeneration) {
      newNeurons = await this.autoGenerateNeurons();
    }
    
    // 9. 记录输入历史
    this.recentInputs.push({
      vector: inputVector,
      content: input,
      timestamp,
    });
    if (this.recentInputs.length > 100) {
      this.recentInputs.shift();
    }
    
    // 10. 构建结果
    const planningState = this.planningModule.getState() as { goalCount?: number } | null;
    const executiveState = this.executiveModule.getState() as { activeTaskCount?: number } | null;
    
    const result: CoordinatedResult = {
      neuronActivations,
      meaning,
      consciousness: consciousness || undefined,
      goalUpdates,
      taskUpdates,
      newNeurons,
      systemState: {
        consciousnessLevel: this.globalWorkspace.computeConsciousnessLevel(),
        selfAwarenessIndex: this.globalWorkspace.computeSelfAwarenessIndex(),
        neuronCount: this.predictionLoop.getStats().neuronCount,
        activeGoalCount: planningState?.goalCount || 0,
        activeTaskCount: executiveState?.activeTaskCount || 0,
      },
    };
    
    return result;
  }

  /**
   * 设置目标
   */
  setGoal(description: string, priority: number = 0.5): Goal {
    const goal = this.planningModule.setGoal(description, priority);
    
    // 创建对应的神经元
    const goalNeuron = this.createGoalNeuron(goal);
    
    // 告知执行控制模块
    this.executiveModule.addTask(`处理目标：${description}`, priority, 0.5);
    
    return goal;
  }

  /**
   * 分解目标
   */
  decomposeGoal(goalId: string): Goal[] {
    const subGoals = this.planningModule.decomposeGoal(goalId);
    
    // 为每个子目标创建神经元
    for (const subGoal of subGoals) {
      this.createGoalNeuron(subGoal);
    }
    
    return subGoals;
  }

  /**
   * 添加任务
   */
  addTask(description: string, priority: number = 0.5, urgency: number = 0.5): Task {
    return this.executiveModule.addTask(description, priority, urgency);
  }

  /**
   * 设置注意力焦点
   */
  setAttentionFocus(focus: string): void {
    this.executiveModule.setAttentionFocus(focus);
    this.globalWorkspace.focusAttention({
      focusKeywords: focus.split(' '),
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 神经元操作
  // ══════════════════════════════════════════════════════════════════

  /**
   * 激活神经元网络
   */
  private async activateNeurons(
    input: string,
    context: ProcessingContext
  ): Promise<Map<string, number>> {
    const activations = new Map<string, number>();
    
    // 获取所有神经元
    const stats = this.predictionLoop.getStats();
    
    // 简化实现：基于输入激活相关神经元
    // 实际应该通过 predictionLoop 的完整流程
    
    return activations;
  }

  /**
   * 为目标创建神经元
   */
  private createGoalNeuron(goal: Goal): PredictiveNeuron {
    const neuron = createPredictiveNeuron(this.config.userId, {
      label: `目标:${goal.description}`,
      role: 'abstract',
      sensitivityVector: goal.vector,
      receptiveField: `目标表示：${goal.description}`,
      creationReason: `为目标 "${goal.description}" 创建表示神经元`,
      level: 2,
    });
    
    return neuron;
  }

  /**
   * 自动生成神经元
   */
  private async autoGenerateNeurons(): Promise<PredictiveNeuron[]> {
    // 通过神经元生成器分析并生成
    const neurons = new Map<string, PredictiveNeuron>();
    // 简化：返回空数组，实际应该与 predictionLoop 集成
    return [];
  }

  // ══════════════════════════════════════════════════════════════════
  // 目标和任务处理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理目标
   */
  private async processGoals(
    input: string,
    consciousness: ConsciousContent | null
  ): Promise<Array<{ goalId: string; progress: number; status: string }>> {
    const updates: Array<{ goalId: string; progress: number; status: string }> = [];
    
    // 获取活跃目标
    const activeGoal = this.planningModule.getActiveGoal();
    if (!activeGoal) return updates;
    
    // 简化：基于输入更新进度
    // 实际应该更智能地评估
    const progress = this.estimateGoalProgress(input, activeGoal);
    
    updates.push({
      goalId: activeGoal.id,
      progress,
      status: progress >= 1 ? 'completed' : 'active',
    });
    
    return updates;
  }

  /**
   * 估算目标进度
   */
  private estimateGoalProgress(input: string, goal: Goal): number {
    // 简化实现：基于输入与目标的语义相似度
    const inputVector = this.vsaSpace.getConcept(input);
    const similarity = this.computeSimilarity(inputVector, goal.vector);
    
    return Math.min(1, goal.progress + similarity * 0.1);
  }

  /**
   * 处理任务
   */
  private async processTasks(
    input: string,
    consciousness: ConsciousContent | null
  ): Promise<Array<{ taskId: string; status: string }>> {
    const updates: Array<{ taskId: string; status: string }> = [];
    
    // 检查是否需要任务切换
    const executiveState = this.executiveModule.getState() as { activeTaskCount?: number } | null;
    const shouldSwitch = executiveState?.activeTaskCount === 0;
    if (shouldSwitch) {
      const nextTask = this.executiveModule.switchTask();
      if (nextTask) {
        updates.push({
          taskId: nextTask.id,
          status: 'running',
        });
      }
    }
    
    return updates;
  }

  // ══════════════════════════════════════════════════════════════════
  // 模块注册
  // ══════════════════════════════════════════════════════════════════

  /**
   * 注册所有模块
   */
  private registerModules(): void {
    // 注册基础模块
    this.globalWorkspace.registerModule(this.perceptualModule);
    this.globalWorkspace.registerModule(this.languageModule);
    this.globalWorkspace.registerModule(this.memoryModule);
    this.globalWorkspace.registerModule(this.emotionalModule);
    this.globalWorkspace.registerModule(this.metacognitiveModule);
    
    // 注册高级模块
    if (this.config.enablePlanning) {
      this.planningModule.setGlobalWorkspace(this.globalWorkspace);
      this.globalWorkspace.registerModule(this.planningModule);
    }
    
    if (this.config.enableExecutive) {
      this.executiveModule.setGlobalWorkspace(this.globalWorkspace);
      this.globalWorkspace.registerModule(this.executiveModule);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 计算向量相似度
   */
  private computeSimilarity(a: number[], b: number[]): number {
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

  /**
   * 获取系统状态
   */
  getSystemState() {
    return {
      consciousness: {
        level: this.globalWorkspace.computeConsciousnessLevel(),
        selfAwarenessIndex: this.globalWorkspace.computeSelfAwarenessIndex(),
        streamCoherence: this.globalWorkspace.computeStreamCoherence(),
      },
      neurons: this.predictionLoop.getStats(),
      planning: this.planningModule.getState(),
      executive: this.executiveModule.getState(),
      generator: this.neuronGenerator.getStats(),
    };
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.recentInputs = [];
    // 其他重置逻辑
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let coordinatorInstance: CognitiveCoordinator | null = null;

export function getCognitiveCoordinator(config?: Partial<CoordinatorConfig>): CognitiveCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new CognitiveCoordinator(config);
  }
  return coordinatorInstance;
}

export function resetCognitiveCoordinator(): void {
  coordinatorInstance = null;
  resetGlobalWorkspace();
}
