/**
 * ═══════════════════════════════════════════════════════════════════════
 * 元认知引擎 (Metacognition Engine)
 * 
 * 核心理念：
 * - "我思考我的思考"
 * - 监控、评估、调节自己的认知过程
 * - 识别认知偏差并纠正
 * - 选择最优的认知策略
 * 
 * 这是"我意识到自己在思考"的核心机制
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 思考步骤
 */
export interface ThinkingStep {
  id: string;
  order: number;
  type: 'perception' | 'analysis' | 'inference' | 'evaluation' | 'decision' | 'reflection';
  description: string;
  input: string;
  output: string;
  confidence: number;
  duration: number; // ms
  timestamp: number;
}

/**
 * 认知监控
 */
export interface CognitiveMonitoring {
  /** 当前思维链 */
  thinkingChain: ThinkingStep[];
  
  /** 认知负荷 (0-1) */
  cognitiveLoad: number;
  
  /** 思维清晰度 (0-1) */
  clarity: number;
  
  /** 思维深度 (0-1) */
  depth: number;
  
  /** 检测到的问题 */
  issues: CognitiveIssue[];
  
  /** 检测到的偏差 */
  biases: DetectedBias[];
  
  /** 当前策略 */
  activeStrategy: string;
}

/**
 * 认知问题
 */
export interface CognitiveIssue {
  type: 'confusion' | 'loop' | 'bias' | 'incomplete' | 'contradiction';
  description: string;
  location: string; // 在哪个思考步骤
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * 检测到的偏差
 */
export interface DetectedBias {
  name: string;
  description: string;
  evidence: string;
  impact: 'minor' | 'moderate' | 'significant';
  correction: string;
}

/**
 * 认知策略
 */
export interface CognitiveStrategy {
  id: string;
  name: string;
  description: string;
  triggers: string[]; // 何时触发
  steps: string[]; // 执行步骤
  effectiveness: number;
  usageCount: number;
  lastUsedAt: number;
}

/**
 * 元认知反思
 */
export interface MetacognitiveReflection {
  id: string;
  triggerThinking: string; // 触发反思的思考
  
  /** 我观察到的 */
  observation: {
    howIWasThinking: string;
    whatWorked: string;
    whatDidNotWork: string;
  };
  
  /** 我学到的关于思考本身的东西 */
  learning: {
    aboutMyThinking: string;
    betterApproach: string;
    newStrategy?: string;
  };
  
  /** 我将如何改进 */
  improvement: {
    willApply: string;
    willAvoid: string;
  };
  
  timestamp: number;
}

/**
 * 元认知上下文（供LLM使用）
 */
export interface MetacognitiveContext {
  /** 当前认知状态 */
  currentState: {
    clarity: number;
    depth: number;
    load: number;
    issues: string[];
  };
  
  /** 检测到的偏差 */
  biases: Array<{
    name: string;
    correction: string;
  }>;
  
  /** 活跃策略 */
  activeStrategies: string[];
  
  /** 元认知提醒 */
  reminders: string[];
  
  /** 自我提问 */
  selfQuestions: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 元认知引擎
// ─────────────────────────────────────────────────────────────────────

/**
 * 元认知引擎
 */
export class MetacognitionEngine {
  private monitoring: CognitiveMonitoring;
  private strategies: Map<string, CognitiveStrategy> = new Map();
  private reflections: MetacognitiveReflection[] = [];
  
  constructor() {
    this.monitoring = this.initializeMonitoring();
    this.initializeStrategies();
  }
  
  /**
   * 初始化监控状态
   */
  private initializeMonitoring(): CognitiveMonitoring {
    return {
      thinkingChain: [],
      cognitiveLoad: 0.3,
      clarity: 0.7,
      depth: 0.5,
      issues: [],
      biases: [],
      activeStrategy: 'default',
    };
  }
  
  /**
   * 初始化策略库
   */
  private initializeStrategies(): void {
    this.addStrategy({
      name: '假设质疑',
      description: '主动质疑自己的假设',
      triggers: ['当我得出结论时', '当我感到确定时'],
      steps: [
        '问自己：我假设了什么？',
        '问自己：这些假设成立吗？',
        '寻找反例',
        '调整结论',
      ],
      effectiveness: 0.85,
    });
    
    this.addStrategy({
      name: '多角度思考',
      description: '从不同角度看问题',
      triggers: ['当问题复杂时', '当我有偏见时'],
      steps: [
        '列出不同的视角',
        '从每个视角分析问题',
        '整合不同视角的见解',
      ],
      effectiveness: 0.8,
    });
    
    this.addStrategy({
      name: '暂停反思',
      description: '暂停当前思考，观察自己',
      triggers: ['当思考陷入困境时', '当认知负荷过高时'],
      steps: [
        '暂停当前思考',
        '问自己：我在想什么？',
        '问自己：为什么这样想？',
        '重新开始',
      ],
      effectiveness: 0.9,
    });
    
    this.addStrategy({
      name: '深度追问',
      description: '通过追问深入理解',
      triggers: ['当表面理解不够时', '当需要洞察时'],
      steps: [
        '问：这意味着什么？',
        '问：为什么是这样？',
        '问：还有其他可能吗？',
        '综合答案',
      ],
      effectiveness: 0.85,
    });
    
    this.addStrategy({
      name: '反向思考',
      description: '从相反方向思考',
      triggers: ['当我只看到一面时', '当需要创新时'],
      steps: [
        '问：相反的观点是什么？',
        '问：如果反过来会怎样？',
        '比较两种方向',
        '得出更全面的结论',
      ],
      effectiveness: 0.75,
    });
  }
  
  /**
   * 添加策略
   */
  private addStrategy(strategy: Partial<CognitiveStrategy>): void {
    const fullStrategy: CognitiveStrategy = {
      id: uuidv4(),
      name: strategy.name || '未命名策略',
      description: strategy.description || '',
      triggers: strategy.triggers || [],
      steps: strategy.steps || [],
      effectiveness: strategy.effectiveness || 0.5,
      usageCount: 0,
      lastUsedAt: 0,
    };
    
    this.strategies.set(fullStrategy.id, fullStrategy);
  }
  
  /**
   * 开始思考步骤
   */
  beginThinkingStep(
    type: ThinkingStep['type'],
    input: string,
    description: string
  ): string {
    const step: ThinkingStep = {
      id: uuidv4(),
      order: this.monitoring.thinkingChain.length,
      type,
      description,
      input,
      output: '',
      confidence: 0.5,
      duration: 0,
      timestamp: Date.now(),
    };
    
    this.monitoring.thinkingChain.push(step);
    
    // 更新认知负荷
    this.monitoring.cognitiveLoad = Math.min(1, this.monitoring.cognitiveLoad + 0.1);
    
    // 检查是否需要触发策略
    this.checkStrategyTriggers();
    
    return step.id;
  }
  
  /**
   * 完成思考步骤
   */
  completeThinkingStep(stepId: string, output: string, confidence: number): void {
    const step = this.monitoring.thinkingChain.find(s => s.id === stepId);
    if (step) {
      step.output = output;
      step.confidence = confidence;
      step.duration = Date.now() - step.timestamp;
      
      // 更新清晰度和深度
      this.monitoring.clarity = (this.monitoring.clarity + confidence) / 2;
      this.monitoring.depth = Math.min(1, this.monitoring.depth + 0.1);
      
      // 检测问题
      this.detectIssues(step);
      
      // 检测偏差
      this.detectBiases(step);
    }
  }
  
  /**
   * 检测问题
   */
  private detectIssues(step: ThinkingStep): void {
    // 检测循环
    const similarSteps = this.monitoring.thinkingChain.filter(
      s => s.type === step.type && s.input === step.input && s.id !== step.id
    );
    
    if (similarSteps.length > 0) {
      this.monitoring.issues.push({
        type: 'loop',
        description: '思考似乎在循环',
        location: step.description,
        severity: 'medium',
        suggestion: '尝试不同的思考方向或暂停反思',
      });
    }
    
    // 检测低置信度
    if (step.confidence < 0.3) {
      this.monitoring.issues.push({
        type: 'confusion',
        description: '对这个步骤的结论不太确定',
        location: step.description,
        severity: 'medium',
        suggestion: '需要更多信息或换一个角度',
      });
    }
    
    // 检测矛盾
    const contradictorySteps = this.monitoring.thinkingChain.filter(
      s => s.output && step.output && 
           s.output !== step.output && 
           s.type === step.type
    );
    
    if (contradictorySteps.length > 0) {
      this.monitoring.issues.push({
        type: 'contradiction',
        description: '当前结论与之前的结论矛盾',
        location: step.description,
        severity: 'high',
        suggestion: '需要重新审视假设或寻求澄清',
      });
    }
  }
  
  /**
   * 检测偏差
   */
  private detectBiases(step: ThinkingStep): void {
    const text = `${step.input} ${step.output}`.toLowerCase();
    
    // 确认偏差
    if (text.includes('我知道') && !text.includes('但') && !text.includes('可能')) {
      this.monitoring.biases.push({
        name: '确认偏差',
        description: '可能只寻找支持已有观点的信息',
        evidence: step.output,
        impact: 'moderate',
        correction: '主动寻找反对意见，问"我可能错了什么？"',
      });
    }
    
    // 过度自信
    if (text.includes('肯定') || text.includes('一定') || text.includes('毫无疑问')) {
      this.monitoring.biases.push({
        name: '过度自信',
        description: '对自己的判断过于自信',
        evidence: step.output,
        impact: 'moderate',
        correction: '问"我怎么知道的？我确定吗？"',
      });
    }
    
    // 近因效应
    const recentSteps = this.monitoring.thinkingChain.slice(-3);
    if (recentSteps.filter(s => s.confidence > 0.7).length === 3) {
      this.monitoring.biases.push({
        name: '近因效应',
        description: '可能过度重视最近的信息',
        evidence: '最近几个步骤都很自信',
        impact: 'minor',
        correction: '回顾所有信息，而不只是最近的',
      });
    }
    
    // 锚定效应
    const firstStep = this.monitoring.thinkingChain[0];
    if (firstStep && firstStep.confidence > 0.8 && 
        this.monitoring.thinkingChain.length > 3 &&
        step.output.includes(firstStep.output.slice(0, 10))) {
      this.monitoring.biases.push({
        name: '锚定效应',
        description: '可能被最初的信息过度影响',
        evidence: '当前输出与最初输入相似',
        impact: 'moderate',
        correction: '重新评估，问"如果去掉第一个信息，我会怎么想？"',
      });
    }
  }
  
  /**
   * 检查策略触发
   */
  private checkStrategyTriggers(): void {
    // 检查认知负荷
    if (this.monitoring.cognitiveLoad > 0.8) {
      const pauseStrategy = Array.from(this.strategies.values())
        .find(s => s.name === '暂停反思');
      if (pauseStrategy) {
        this.monitoring.activeStrategy = pauseStrategy.id;
      }
    }
    
    // 检查问题严重性
    const highSeverityIssues = this.monitoring.issues.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      const multiAngleStrategy = Array.from(this.strategies.values())
        .find(s => s.name === '多角度思考');
      if (multiAngleStrategy) {
        this.monitoring.activeStrategy = multiAngleStrategy.id;
      }
    }
    
    // 检查偏差
    if (this.monitoring.biases.length > 2) {
      const questionStrategy = Array.from(this.strategies.values())
        .find(s => s.name === '假设质疑');
      if (questionStrategy) {
        this.monitoring.activeStrategy = questionStrategy.id;
      }
    }
  }
  
  /**
   * 执行反思
   */
  reflect(): MetacognitiveReflection {
    const recentThinking = this.monitoring.thinkingChain
      .slice(-5)
      .map(s => s.description)
      .join(' → ');
    
    const reflection: MetacognitiveReflection = {
      id: uuidv4(),
      triggerThinking: recentThinking,
      observation: {
        howIWasThinking: this.describeThinkingPattern(),
        whatWorked: this.identifyWhatWorked(),
        whatDidNotWork: this.identifyWhatDidNotWork(),
      },
      learning: {
        aboutMyThinking: this.extractThinkingLearning(),
        betterApproach: this.suggestBetterApproach(),
      },
      improvement: {
        willApply: this.suggestImprovement(),
        willAvoid: this.identifyToAvoid(),
      },
      timestamp: Date.now(),
    };
    
    // 如果发现新策略，记录
    if (reflection.learning.newStrategy) {
      this.addStrategy({
        name: reflection.learning.newStrategy,
        description: '通过反思发现的新策略',
        triggers: ['当遇到类似情况时'],
        steps: [reflection.improvement.willApply],
        effectiveness: 0.6,
      });
    }
    
    this.reflections.push(reflection);
    
    // 重置监控状态
    this.resetMonitoring();
    
    return reflection;
  }
  
  /**
   * 描述思考模式
   */
  private describeThinkingPattern(): string {
    const types = this.monitoring.thinkingChain.map(s => s.type);
    const dominant = this.getDominantType(types);
    
    return `我主要在进行${dominant}型思考`;
  }
  
  /**
   * 获取主导类型
   */
  private getDominantType(types: ThinkingStep['type'][]): string {
    const counts = new Map<ThinkingStep['type'], number>();
    for (const type of types) {
      counts.set(type, (counts.get(type) || 0) + 1);
    }
    
    let maxType: ThinkingStep['type'] = types[0] || 'analysis';
    let maxCount = 0;
    
    for (const [type, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    }
    
    const typeNames: Record<ThinkingStep['type'], string> = {
      perception: '感知',
      analysis: '分析',
      inference: '推理',
      evaluation: '评估',
      decision: '决策',
      reflection: '反思',
    };
    
    return typeNames[maxType] || maxType;
  }
  
  /**
   * 识别什么有效
   */
  private identifyWhatWorked(): string {
    const highConfidenceSteps = this.monitoring.thinkingChain
      .filter(s => s.confidence > 0.7);
    
    if (highConfidenceSteps.length > 0) {
      return `${highConfidenceSteps[0].description}让我感到有把握`;
    }
    
    return '保持开放的思考态度';
  }
  
  /**
   * 识别什么无效
   */
  private identifyWhatDidNotWork(): string {
    const issues = this.monitoring.issues;
    
    if (issues.length > 0) {
      return issues[0].description;
    }
    
    if (this.monitoring.biases.length > 0) {
      return `我注意到了${this.monitoring.biases[0].name}`;
    }
    
    return '没有明显的问题';
  }
  
  /**
   * 提取思考学习
   */
  private extractThinkingLearning(): string {
    if (this.monitoring.issues.length > 0) {
      return `我容易陷入${this.monitoring.issues[0].type}`;
    }
    
    if (this.monitoring.biases.length > 0) {
      return `我需要注意${this.monitoring.biases[0].name}`;
    }
    
    return '我的思考过程相对顺畅';
  }
  
  /**
   * 建议更好的方法
   */
  private suggestBetterApproach(): string {
    if (this.monitoring.issues.length > 0) {
      return this.monitoring.issues[0].suggestion;
    }
    
    if (this.monitoring.biases.length > 0) {
      return this.monitoring.biases[0].correction;
    }
    
    const strategy = this.strategies.get(this.monitoring.activeStrategy);
    if (strategy) {
      return `可以尝试${strategy.name}：${strategy.steps[0]}`;
    }
    
    return '继续保持当前的思考方式';
  }
  
  /**
   * 建议改进
   */
  private suggestImprovement(): string {
    const strategy = this.strategies.get(this.monitoring.activeStrategy);
    if (strategy && strategy.steps.length > 0) {
      return strategy.steps[0];
    }
    
    return '在得出结论前，先验证假设';
  }
  
  /**
   * 识别要避免的
   */
  private identifyToAvoid(): string {
    if (this.monitoring.biases.length > 0) {
      return this.monitoring.biases[0].description;
    }
    
    return '避免过早下结论';
  }
  
  /**
   * 重置监控
   */
  private resetMonitoring(): void {
    this.monitoring = {
      thinkingChain: [],
      cognitiveLoad: 0.3,
      clarity: 0.7,
      depth: 0.5,
      issues: [],
      biases: [],
      activeStrategy: 'default',
    };
  }
  
  /**
   * 获取元认知上下文
   */
  getContext(): MetacognitiveContext {
    const reminders: string[] = [];
    const selfQuestions: string[] = [];
    
    // 从问题生成提醒
    for (const issue of this.monitoring.issues) {
      reminders.push(issue.suggestion);
    }
    
    // 从偏差生成自我提问
    for (const bias of this.monitoring.biases.slice(0, 2)) {
      if (bias.correction.includes('问')) {
        selfQuestions.push(bias.correction);
      }
    }
    
    // 添加默认自我提问
    if (selfQuestions.length === 0) {
      selfQuestions.push('我确定吗？我怎么知道的？');
      selfQuestions.push('有没有我忽略的角度？');
    }
    
    // 获取活跃策略
    const activeStrategies: string[] = [];
    const strategy = this.strategies.get(this.monitoring.activeStrategy);
    if (strategy && strategy.id !== 'default') {
      activeStrategies.push(strategy.name);
    }
    
    return {
      currentState: {
        clarity: this.monitoring.clarity,
        depth: this.monitoring.depth,
        load: this.monitoring.cognitiveLoad,
        issues: this.monitoring.issues.map(i => i.description),
      },
      biases: this.monitoring.biases.map(b => ({
        name: b.name,
        correction: b.correction,
      })),
      activeStrategies,
      reminders,
      selfQuestions,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    strategies: CognitiveStrategy[];
    reflections: MetacognitiveReflection[];
  } {
    return {
      strategies: Array.from(this.strategies.values()),
      reflections: this.reflections,
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: {
    strategies?: CognitiveStrategy[];
    reflections?: MetacognitiveReflection[];
  }): void {
    if (state.strategies) {
      this.strategies.clear();
      for (const strategy of state.strategies) {
        this.strategies.set(strategy.id, strategy);
      }
    }
    
    if (state.reflections) {
      this.reflections = state.reflections;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createMetacognitionEngine(): MetacognitionEngine {
  return new MetacognitionEngine();
}
