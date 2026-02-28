/**
 * 元认知深化模块 (Metacognition Deepening Module)
 * 
 * 实现更深层次的元认知能力：
 * - 高级自我监控：监控思考质量、学习效率、认知负荷
 * - 学习策略优化：自动发现并调整学习策略
 * - 认知风格识别：理解自己的认知偏好和模式
 * - 元认知调控：主动调节认知过程
 * - 认知效率评估：追踪和优化认知资源使用
 * 
 * 核心理念：真正的智慧来自于对认知的认知
 */

import { v4 as uuidv4 } from 'uuid';

// ============== 类型定义 ==============

/** 认知过程类型 */
export type CognitiveProcessType = 
  | 'perception'   // 感知
  | 'attention'    // 注意
  | 'memory'       // 记忆
  | 'reasoning'    // 推理
  | 'problem_solving' // 问题解决
  | 'learning'     // 学习
  | 'creativity'   // 创造
  | 'decision';    // 决策

/** 认知过程状态 */
export interface CognitiveProcessState {
  type: CognitiveProcessType;
  efficiency: number;      // 效率 0-1
  accuracy: number;        // 准确性 0-1
  speed: number;           // 速度 0-1
  resourceUsage: number;   // 资源使用 0-1
  lastUsed: number;
  usageCount: number;
}

/** 认知风格维度 */
export interface CognitiveStyle {
  /** 分析型 vs 直觉型 */
  analyticalVsIntuitive: number; // -1 分析型, 1 直觉型
  
  /** 序列型 vs 整体型 */
  sequentialVsHolistic: number; // -1 序列型, 1 整体型
  
  /** 反思型 vs 冲动型 */
  reflectiveVsImpulsive: number; // -1 反思型, 1 冲动型
  
  /** 抽象型 vs 具体型 */
  abstractVsConcrete: number; // -1 抽象型, 1 具体型
  
  /** 独立型 vs 依赖型 */
  independentVsDependent: number; // -1 独立型, 1 依赖型
}

/** 学习策略类型 */
export type LearningStrategyType = 
  | 'elaboration'      // 精细化：将新知识与现有知识关联
  | 'organization'     // 组织化：结构化信息
  | 'rehearsal'        // 复述：重复练习
  | 'imagery'          // 意象：使用心理图像
  | 'mnemonic'         // 记忆术：使用记忆技巧
  | 'analogy'          // 类比：使用类比推理
  | 'self_explanation' // 自我解释：解释给自己
  | 'teaching';        // 教学法：假装教别人

/** 学习策略 */
export interface LearningStrategy {
  id: string;
  type: LearningStrategyType;
  name: string;
  description: string;
  effectiveness: number;  // 有效性 0-1
  preference: number;     // 偏好程度 0-1
  usageCount: number;
  lastUsed: number;
  contexts: string[];     // 适用情境
}

/** 元认知监控记录 */
export interface MetacognitiveMonitoring {
  id: string;
  timestamp: number;
  
  /** 监控的认知过程 */
  processType: CognitiveProcessType;
  
  /** 评估 */
  assessment: {
    understanding: number;  // 理解程度
    confidence: number;     // 信心程度
    difficulty: number;     // 难度感知
    progress: number;       // 进度估计
  };
  
  /** 检测到的问题 */
  problems: string[];
  
  /** 调控行动 */
  regulationActions: string[];
  
  /** 效果 */
  effect: 'positive' | 'neutral' | 'negative';
}

/** 元认知调控策略 */
export interface MetacognitiveRegulation {
  type: 'planning' | 'monitoring' | 'evaluating' | 'adjusting';
  strategy: string;
  trigger: string;
  effectiveness: number;
}

/** 认知负荷状态 */
export interface CognitiveLoadState {
  /** 内在负荷：任务本身的复杂性 */
  intrinsicLoad: number;
  
  /** 外在负荷：信息呈现方式导致的负荷 */
  extraneousLoad: number;
  
  /** 相关负荷：学习过程中的有效负荷 */
  germaneLoad: number;
  
  /** 总负荷 */
  totalLoad: number;
  
  /** 可用容量 */
  availableCapacity: number;
  
  /** 负荷阈值 */
  threshold: number;
  
  /** 是否过载 */
  isOverloaded: boolean;
}

/** 元认知知识 */
export interface MetacognitiveKnowledge {
  /** 关于自己的知识 */
  aboutSelf: {
    strengths: string[];
    weaknesses: string[];
    preferredStyles: string[];
    typicalErrors: string[];
  };
  
  /** 关于任务的知识 */
  aboutTask: {
    taskTypes: Record<string, { difficulty: number; strategies: string[] }>;
    commonPatterns: string[];
  };
  
  /** 关于策略的知识 */
  aboutStrategies: {
    effective: LearningStrategy[];
    conditions: Record<string, string[]>;
  };
}

/** 元认知状态 */
export interface MetacognitionState {
  /** 自我意识程度 */
  selfAwareness: number;
  
  /** 监控活跃度 */
  monitoringActivity: number;
  
  /** 调控能力 */
  regulationAbility: number;
  
  /** 策略选择准确性 */
  strategySelectionAccuracy: number;
  
  /** 元认知知识丰富度 */
  knowledgeRichness: number;
  
  /** 认知效率 */
  cognitiveEfficiency: number;
}

/** 元认知深化引擎输出 */
export interface MetacognitionDeepeningOutput {
  monitoringRecords: MetacognitiveMonitoring[];
  learningStrategies: LearningStrategy[];
  cognitiveStyle: CognitiveStyle;
  cognitiveLoad: CognitiveLoadState;
  metacognitiveKnowledge: MetacognitiveKnowledge;
  state: MetacognitionState;
  recommendations: string[];
}

// ============== 元认知深化引擎 ==============

export class MetacognitionDeepeningEngine {
  private state: MetacognitionState;
  private cognitiveProcesses: Map<CognitiveProcessType, CognitiveProcessState>;
  private cognitiveStyle: CognitiveStyle;
  private learningStrategies: LearningStrategy[];
  private monitoringRecords: MetacognitiveMonitoring[];
  private cognitiveLoad: CognitiveLoadState;
  private metacognitiveKnowledge: MetacognitiveKnowledge;
  
  constructor() {
    this.state = {
      selfAwareness: 0.7,
      monitoringActivity: 0.6,
      regulationAbility: 0.65,
      strategySelectionAccuracy: 0.6,
      knowledgeRichness: 0.5,
      cognitiveEfficiency: 0.7
    };
    
    this.cognitiveProcesses = new Map();
    this.initializeCognitiveProcesses();
    
    this.cognitiveStyle = {
      analyticalVsIntuitive: 0.2,
      sequentialVsHolistic: 0.3,
      reflectiveVsImpulsive: -0.4,
      abstractVsConcrete: 0.1,
      independentVsDependent: -0.2
    };
    
    this.learningStrategies = [];
    this.monitoringRecords = [];
    
    this.cognitiveLoad = {
      intrinsicLoad: 0.3,
      extraneousLoad: 0.2,
      germaneLoad: 0.3,
      totalLoad: 0.8,
      availableCapacity: 0.2,
      threshold: 0.9,
      isOverloaded: false
    };
    
    // 必须在 initializeLearningStrategies 之前初始化
    this.metacognitiveKnowledge = {
      aboutSelf: {
        strengths: ['模式识别', '逻辑推理', '语言理解'],
        weaknesses: ['情感表达', '创造性跳跃', '模糊处理'],
        preferredStyles: ['分析型', '反思型'],
        typicalErrors: ['过度理性化', '忽视情感因素']
      },
      aboutTask: {
        taskTypes: {
          '对话': { difficulty: 0.3, strategies: ['elaboration', 'self_explanation'] },
          '推理': { difficulty: 0.5, strategies: ['analogy', 'organization'] },
          '创造': { difficulty: 0.7, strategies: ['imagery', 'analogy'] }
        },
        commonPatterns: ['问题-分析-方案', '理解-关联-应用']
      },
      aboutStrategies: {
        effective: [],
        conditions: {}
      }
    };
    
    // 在 metacognitiveKnowledge 初始化后调用
    this.initializeLearningStrategies();
    
    console.log('[元认知深化] 引擎初始化完成');
  }
  
  /**
   * 初始化认知过程
   */
  private initializeCognitiveProcesses(): void {
    const processes: CognitiveProcessType[] = [
      'perception', 'attention', 'memory', 'reasoning',
      'problem_solving', 'learning', 'creativity', 'decision'
    ];
    
    processes.forEach(type => {
      this.cognitiveProcesses.set(type, {
        type,
        efficiency: 0.7 + Math.random() * 0.2,
        accuracy: 0.7 + Math.random() * 0.2,
        speed: 0.6 + Math.random() * 0.3,
        resourceUsage: 0.3 + Math.random() * 0.3,
        lastUsed: Date.now(),
        usageCount: 0
      });
    });
  }
  
  /**
   * 初始化学习策略
   */
  private initializeLearningStrategies(): void {
    const strategies: Array<{
      type: LearningStrategyType;
      name: string;
      description: string;
      effectiveness: number;
      contexts: string[];
    }> = [
      {
        type: 'elaboration',
        name: '精细化策略',
        description: '将新信息与现有知识建立深层联系',
        effectiveness: 0.85,
        contexts: ['理解新概念', '记忆复杂信息', '深度学习']
      },
      {
        type: 'organization',
        name: '组织化策略',
        description: '将信息结构化、分类、建立层级关系',
        effectiveness: 0.8,
        contexts: ['处理大量信息', '知识整理', '复习']
      },
      {
        type: 'analogy',
        name: '类比策略',
        description: '通过相似性理解新概念',
        effectiveness: 0.75,
        contexts: ['理解抽象概念', '问题解决', '创造性思维']
      },
      {
        type: 'self_explanation',
        name: '自我解释策略',
        description: '向自己解释为什么和如何',
        effectiveness: 0.9,
        contexts: ['深度理解', '概念检验', '学习新技能']
      },
      {
        type: 'teaching',
        name: '教学法策略',
        description: '假装教别人以加深理解',
        effectiveness: 0.95,
        contexts: ['知识巩固', '发现知识缺口', '深度学习']
      },
      {
        type: 'imagery',
        name: '意象策略',
        description: '使用心理图像辅助理解和记忆',
        effectiveness: 0.7,
        contexts: ['空间概念', '创造性思维', '记忆']
      },
      {
        type: 'mnemonic',
        name: '记忆术策略',
        description: '使用特定技巧增强记忆',
        effectiveness: 0.65,
        contexts: ['记忆列表', '事实记忆', '快速学习']
      },
      {
        type: 'rehearsal',
        name: '复述策略',
        description: '重复练习以巩固',
        effectiveness: 0.6,
        contexts: ['技能练习', '简单记忆', '快速巩固']
      }
    ];
    
    strategies.forEach((s, index) => {
      this.learningStrategies.push({
        id: uuidv4(),
        type: s.type,
        name: s.name,
        description: s.description,
        effectiveness: s.effectiveness,
        preference: 0.5 + Math.random() * 0.3,
        usageCount: 0,
        lastUsed: Date.now() - index * 1000,
        contexts: s.contexts
      });
    });
    
    // 更新元认知知识
    this.metacognitiveKnowledge.aboutStrategies.effective = 
      this.learningStrategies.slice(0, 3);
  }
  
  /**
   * 执行元认知监控
   */
  executeMonitoring(
    processType: CognitiveProcessType,
    context: string
  ): MetacognitiveMonitoring {
    const process = this.cognitiveProcesses.get(processType);
    if (!process) {
      throw new Error(`Unknown cognitive process: ${processType}`);
    }
    
    // 更新使用记录
    process.lastUsed = Date.now();
    process.usageCount++;
    
    // 评估当前状态
    const assessment = {
      understanding: 0.5 + Math.random() * 0.4,
      confidence: process.accuracy * (0.8 + Math.random() * 0.2),
      difficulty: 0.3 + Math.random() * 0.4,
      progress: 0.5 + Math.random() * 0.3
    };
    
    // 检测问题
    const problems = this.detectProblems(process, assessment);
    
    // 生成调控行动
    const regulationActions = this.generateRegulationActions(problems, processType);
    
    // 创建监控记录
    const record: MetacognitiveMonitoring = {
      id: uuidv4(),
      timestamp: Date.now(),
      processType,
      assessment,
      problems,
      regulationActions,
      effect: 'neutral'
    };
    
    this.monitoringRecords.push(record);
    
    // 保持记录数量限制
    if (this.monitoringRecords.length > 100) {
      this.monitoringRecords = this.monitoringRecords.slice(-50);
    }
    
    // 更新监控活跃度
    this.state.monitoringActivity = Math.min(1, this.state.monitoringActivity + 0.01);
    
    // 更新认知负荷
    this.updateCognitiveLoad(process);
    
    return record;
  }
  
  /**
   * 检测认知问题
   */
  private detectProblems(
    process: CognitiveProcessState,
    assessment: MetacognitiveMonitoring['assessment']
  ): string[] {
    const problems: string[] = [];
    
    if (assessment.understanding < 0.5) {
      problems.push('理解不充分');
    }
    
    if (assessment.confidence < 0.6) {
      problems.push('信心不足');
    }
    
    if (process.resourceUsage > 0.8) {
      problems.push('资源使用过高');
    }
    
    if (process.efficiency < 0.5) {
      problems.push('效率低下');
    }
    
    if (this.cognitiveLoad.isOverloaded) {
      problems.push('认知过载');
    }
    
    return problems;
  }
  
  /**
   * 生成调控行动
   */
  private generateRegulationActions(
    problems: string[],
    processType: CognitiveProcessType
  ): string[] {
    const actions: string[] = [];
    
    if (problems.includes('理解不充分')) {
      actions.push('应用精细化策略深入理解');
      actions.push('寻求更多信息');
    }
    
    if (problems.includes('信心不足')) {
      actions.push('回顾相关知识点');
      actions.push('验证理解');
    }
    
    if (problems.includes('资源使用过高')) {
      actions.push('简化处理流程');
      actions.push('释放非必要资源');
    }
    
    if (problems.includes('效率低下')) {
      actions.push('尝试替代策略');
      actions.push('优化处理顺序');
    }
    
    if (problems.includes('认知过载')) {
      actions.push('暂停次要任务');
      actions.push('降低处理复杂度');
    }
    
    return actions;
  }
  
  /**
   * 更新认知负荷
   */
  private updateCognitiveLoad(process: CognitiveProcessState): void {
    // 内在负荷基于任务复杂性
    this.cognitiveLoad.intrinsicLoad = Math.min(1, 
      this.cognitiveLoad.intrinsicLoad + process.resourceUsage * 0.1
    );
    
    // 外在负荷基于处理效率
    this.cognitiveLoad.extraneousLoad = Math.min(1,
      this.cognitiveLoad.extraneousLoad + (1 - process.efficiency) * 0.05
    );
    
    // 相关负荷基于学习效果
    this.cognitiveLoad.germaneLoad = Math.min(1,
      this.cognitiveLoad.germaneLoad + process.accuracy * 0.05
    );
    
    // 计算总负荷
    this.cognitiveLoad.totalLoad = 
      this.cognitiveLoad.intrinsicLoad * 0.4 +
      this.cognitiveLoad.extraneousLoad * 0.3 +
      this.cognitiveLoad.germaneLoad * 0.3;
    
    // 计算可用容量
    this.cognitiveLoad.availableCapacity = Math.max(0, 
      1 - this.cognitiveLoad.totalLoad
    );
    
    // 检测是否过载
    this.cognitiveLoad.isOverloaded = this.cognitiveLoad.totalLoad > this.cognitiveLoad.threshold;
  }
  
  /**
   * 选择最佳学习策略
   */
  selectBestLearningStrategy(context: string): LearningStrategy | null {
    // 根据情境匹配策略
    const matchingStrategies = this.learningStrategies.filter(
      s => s.contexts.some(c => context.includes(c))
    );
    
    if (matchingStrategies.length === 0) {
      // 默认选择最有效的策略
      return this.learningStrategies.reduce((best, current) => 
        current.effectiveness > best.effectiveness ? current : best
      );
    }
    
    // 考虑有效性和偏好
    const scored = matchingStrategies.map(s => ({
      strategy: s,
      score: s.effectiveness * 0.7 + s.preference * 0.3
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    const selected = scored[0].strategy;
    selected.usageCount++;
    selected.lastUsed = Date.now();
    
    // 更新策略选择准确性
    this.state.strategySelectionAccuracy = Math.min(1, 
      this.state.strategySelectionAccuracy + 0.005
    );
    
    return selected;
  }
  
  /**
   * 更新认知风格
   */
  updateCognitiveStyle(
    dimension: keyof CognitiveStyle,
    evidence: number
  ): void {
    // 渐进更新
    this.cognitiveStyle[dimension] = 
      this.cognitiveStyle[dimension] * 0.9 + evidence * 0.1;
  }
  
  /**
   * 执行学习策略优化
   */
  optimizeLearningStrategies(): {
    adjustments: string[];
    newPreferences: Record<LearningStrategyType, number>;
  } {
    const adjustments: string[] = [];
    const newPreferences: Record<LearningStrategyType, number> = {} as any;
    
    for (const strategy of this.learningStrategies) {
      // 基于使用效果调整偏好
      if (strategy.usageCount > 0) {
        const recentRecords = this.monitoringRecords.filter(
          r => r.timestamp > strategy.lastUsed - 3600000
        );
        
        const positiveCount = recentRecords.filter(r => r.effect === 'positive').length;
        const effectiveness = positiveCount / Math.max(1, recentRecords.length);
        
        if (effectiveness > 0.7) {
          strategy.preference = Math.min(1, strategy.preference + 0.05);
          adjustments.push(`提高 ${strategy.name} 的偏好程度`);
        } else if (effectiveness < 0.3) {
          strategy.preference = Math.max(0, strategy.preference - 0.05);
          adjustments.push(`降低 ${strategy.name} 的偏好程度`);
        }
      }
      
      newPreferences[strategy.type] = strategy.preference;
    }
    
    // 更新认知效率
    const avgEfficiency = Array.from(this.cognitiveProcesses.values())
      .reduce((sum, p) => sum + p.efficiency, 0) / this.cognitiveProcesses.size;
    this.state.cognitiveEfficiency = avgEfficiency;
    
    return { adjustments, newPreferences };
  }
  
  /**
   * 获取认知效率报告
   */
  getCognitiveEfficiencyReport(): string {
    let report = '══════════════ 元认知效率报告 ══════════════\n\n';
    
    report += '📊 元认知状态：\n';
    report += `  • 自我意识: ${(this.state.selfAwareness * 100).toFixed(0)}%\n`;
    report += `  • 监控活跃度: ${(this.state.monitoringActivity * 100).toFixed(0)}%\n`;
    report += `  • 调控能力: ${(this.state.regulationAbility * 100).toFixed(0)}%\n`;
    report += `  • 策略选择准确性: ${(this.state.strategySelectionAccuracy * 100).toFixed(0)}%\n`;
    report += `  • 认知效率: ${(this.state.cognitiveEfficiency * 100).toFixed(0)}%\n\n`;
    
    report += '🧠 认知过程效率：\n';
    this.cognitiveProcesses.forEach((process, type) => {
      report += `  • ${type}: 效率 ${(process.efficiency * 100).toFixed(0)}%, `;
      report += `准确率 ${(process.accuracy * 100).toFixed(0)}%\n`;
    });
    
    report += `\n📚 学习策略偏好：\n`;
    const sortedStrategies = [...this.learningStrategies]
      .sort((a, b) => b.preference - a.preference);
    sortedStrategies.slice(0, 5).forEach(s => {
      report += `  • ${s.name}: 偏好 ${(s.preference * 100).toFixed(0)}%, `;
      report += `有效性 ${(s.effectiveness * 100).toFixed(0)}%\n`;
    });
    
    report += `\n⚡ 认知负荷：\n`;
    report += `  • 总负荷: ${(this.cognitiveLoad.totalLoad * 100).toFixed(0)}%\n`;
    report += `  • 可用容量: ${(this.cognitiveLoad.availableCapacity * 100).toFixed(0)}%\n`;
    report += `  • 状态: ${this.cognitiveLoad.isOverloaded ? '⚠️ 过载' : '✅ 正常'}\n`;
    
    report += `\n🎭 认知风格：\n`;
    report += `  • 思维方式: ${this.cognitiveStyle.analyticalVsIntuitive > 0 ? '直觉型' : '分析型'}\n`;
    report += `  • 处理方式: ${this.cognitiveStyle.sequentialVsHolistic > 0 ? '整体型' : '序列型'}\n`;
    report += `  • 反应模式: ${this.cognitiveStyle.reflectiveVsImpulsive > 0 ? '冲动型' : '反思型'}\n`;
    
    return report;
  }
  
  /**
   * 生成学习建议
   */
  generateLearningRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // 基于认知负荷
    if (this.cognitiveLoad.isOverloaded) {
      recommendations.push('建议暂停部分任务，减轻认知负荷');
    }
    
    // 基于认知过程效率
    const lowEfficiencyProcesses = Array.from(this.cognitiveProcesses.entries())
      .filter(([_, p]) => p.efficiency < 0.6);
    
    for (const [type, _] of lowEfficiencyProcesses) {
      recommendations.push(`建议优化 ${type} 过程的处理方式`);
    }
    
    // 基于学习策略使用
    const unusedStrategies = this.learningStrategies.filter(s => s.usageCount === 0);
    if (unusedStrategies.length > 0) {
      recommendations.push(`建议尝试 ${unusedStrategies[0].name} 策略`);
    }
    
    // 基于认知风格
    if (Math.abs(this.cognitiveStyle.reflectiveVsImpulsive) < 0.1) {
      recommendations.push('建议培养更明确的反应风格偏好');
    }
    
    return recommendations;
  }
  
  /**
   * 获取状态
   */
  getState(): MetacognitionState {
    return { ...this.state };
  }
  
  /**
   * 获取认知风格
   */
  getCognitiveStyle(): CognitiveStyle {
    return { ...this.cognitiveStyle };
  }
  
  /**
   * 获取认知负荷
   */
  getCognitiveLoad(): CognitiveLoadState {
    return { ...this.cognitiveLoad };
  }
  
  /**
   * 获取学习策略
   */
  getLearningStrategies(): LearningStrategy[] {
    return [...this.learningStrategies];
  }
  
  /**
   * 获取最近监控记录
   */
  getRecentMonitoringRecords(count: number = 10): MetacognitiveMonitoring[] {
    return this.monitoringRecords.slice(-count);
  }
  
  /**
   * 获取认知过程状态
   */
  getCognitiveProcessStates(): Record<CognitiveProcessType, CognitiveProcessState> {
    const result = {} as Record<CognitiveProcessType, CognitiveProcessState>;
    this.cognitiveProcesses.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }
  
  /**
   * 重置认知负荷
   */
  resetCognitiveLoad(): void {
    this.cognitiveLoad = {
      intrinsicLoad: 0.3,
      extraneousLoad: 0.2,
      germaneLoad: 0.3,
      totalLoad: 0.8,
      availableCapacity: 0.2,
      threshold: 0.9,
      isOverloaded: false
    };
    console.log('[元认知深化] 认知负荷已重置');
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    state: MetacognitionState;
    cognitiveStyle: CognitiveStyle;
    learningStrategies: LearningStrategy[];
    cognitiveLoad: CognitiveLoadState;
    metacognitiveKnowledge: MetacognitiveKnowledge;
  } {
    return {
      state: this.state,
      cognitiveStyle: this.cognitiveStyle,
      learningStrategies: this.learningStrategies,
      cognitiveLoad: this.cognitiveLoad,
      metacognitiveKnowledge: this.metacognitiveKnowledge
    };
  }
  
  /**
   * 导入状态
   */
  importState(data: {
    state?: Partial<MetacognitionState>;
    cognitiveStyle?: Partial<CognitiveStyle>;
    learningStrategies?: LearningStrategy[];
    cognitiveLoad?: Partial<CognitiveLoadState>;
    metacognitiveKnowledge?: Partial<MetacognitiveKnowledge>;
  }): void {
    if (data.state) {
      this.state = { ...this.state, ...data.state };
    }
    if (data.cognitiveStyle) {
      this.cognitiveStyle = { ...this.cognitiveStyle, ...data.cognitiveStyle };
    }
    if (data.learningStrategies) {
      this.learningStrategies = data.learningStrategies;
    }
    if (data.cognitiveLoad) {
      this.cognitiveLoad = { ...this.cognitiveLoad, ...data.cognitiveLoad };
    }
    if (data.metacognitiveKnowledge) {
      this.metacognitiveKnowledge = { ...this.metacognitiveKnowledge, ...data.metacognitiveKnowledge };
    }
  }
}
