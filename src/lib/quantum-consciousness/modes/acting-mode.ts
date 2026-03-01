/**
 * ═══════════════════════════════════════════════════════════════════════
 * 有为模式 (Acting Mode)
 * 
 * V6核心 - 主动处理、赋予意义、优化决策
 * 
 * 特征：
 * - 主动处理输入
 * - 赋予意义和价值
 * - 选择策略和优化
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { Complex } from '../types/quantum';
import type { Interaction } from '../types/base';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 有为模式状态
 */
export interface ActingModeState {
  /** 当前处理上下文 */
  currentContext: ProcessingContext;
  
  /** 统计 */
  stats: {
    totalProcessed: number;
    averageConfidence: number;
  };
}

/**
 * 处理上下文
 */
export interface ProcessingContext {
  /** 输入 */
  input: string;
  
  /** 赋予的意义 */
  meaning: MeaningContext | null;
  
  /** 价值判断 */
  valueJudgment: ValueJudgment | null;
  
  /** 选择的策略 */
  strategy: Strategy | null;
  
  /** 情感状态 */
  emotionState: EmotionState | null;
}

/**
 * 意义上下文
 */
export interface MeaningContext {
  /** 重要性 0-1 */
  importance: number;
  
  /** 相关概念 */
  relatedConcepts: string[];
  
  /** 情感色彩 */
  emotionalTone: string;
  
  /** 个人相关性 */
  personalRelevance: number;
}

/**
 * 价值判断
 */
export interface ValueJudgment {
  /** 触发的价值观 */
  triggeredValues: string[];
  
  /** 冲突检测 */
  conflicts: Array<{
    values: string[];
    description: string;
    intensity: number;
  }>;
  
  /** 一致性评分 */
  coherence: number;
}

/**
 * 策略
 */
export interface Strategy {
  /** 策略名称 */
  name: string;
  
  /** 置信度 */
  confidence: number;
  
  /** 理由 */
  reasoning: string;
  
  /** 预期效果 */
  expectedOutcome: string;
}

/**
 * 情感状态
 */
export interface EmotionState {
  /** 主导情感 */
  dominantEmotion: string;
  
  /** 情感强度 */
  intensity: number;
  
  /** 情感类型 */
  type: 'basic' | 'complex';
}

/**
 * 有为模式处理结果
 */
export interface ActingResult {
  /** 处理上下文 */
  context: ProcessingContext;
  
  /** 振幅 */
  amplitude: Complex;
  
  /** 报告 */
  report: string;
}

/**
 * V6核心接口（适配器模式）
 * 
 * 用于封装V6的现有功能
 */
export interface V6CoreInterface {
  process(input: string): Promise<{
    context: unknown;
    thinking: unknown;
    response: string;
    learning: unknown;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// 有为模式实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 有为模式
 * 
 * 主动处理者的视角：赋予意义、做出判断、优化决策
 */
export class ActingMode {
  private state: ActingModeState;
  private v6Core: V6CoreInterface | null = null;

  constructor(v6Core?: V6CoreInterface) {
    this.v6Core = v6Core || null;
    this.state = {
      currentContext: {
        input: '',
        meaning: null,
        valueJudgment: null,
        strategy: null,
        emotionState: null,
      },
      stats: {
        totalProcessed: 0,
        averageConfidence: 0.5,
      },
    };

    console.log('[有为模式] 已初始化');
  }

  /**
   * 设置V6核心（延迟绑定）
   */
  setV6Core(v6Core: V6CoreInterface): void {
    this.v6Core = v6Core;
    console.log('[有为模式] V6核心已绑定');
  }

  /**
   * 处理交互
   * 
   * 核心动作：主动处理
   */
  async process(interaction: Interaction): Promise<ActingResult> {
    // 1. 赋予意义
    const meaning = this.assignMeaning(interaction);

    // 2. 价值判断
    const valueJudgment = this.evaluateValue(interaction, meaning);

    // 3. 选择策略
    const strategy = this.selectStrategy(interaction, meaning, valueJudgment);

    // 4. 情感处理
    const emotionState = this.processEmotion(interaction, meaning);

    // 5. 更新状态
    this.state.currentContext = {
      input: interaction.input,
      meaning,
      valueJudgment,
      strategy,
      emotionState,
    };

    // 6. 更新统计
    this.state.stats.totalProcessed++;

    // 7. 计算振幅
    const amplitude = this.calculateAmplitude(interaction);

    // 生成报告
    const report = this.generateReport();

    return {
      context: this.state.currentContext,
      amplitude,
      report,
    };
  }

  /**
   * 赋予意义
   * 
   * 判断输入的重要性、相关性等
   */
  private assignMeaning(interaction: Interaction): MeaningContext {
    const input = interaction.input;
    const context = interaction.context;

    // 计算重要性
    let importance = 0.5;
    if (context.urgency > 0.7) {
      importance = 0.9;
    } else if (context.depth > 0.7) {
      importance = 0.8;
    }

    // 提取相关概念
    const relatedConcepts = this.extractConcepts(input);

    // 情感色彩
    const emotionalTone = this.detectEmotionalTone(input);

    // 个人相关性
    const personalRelevance = this.calculatePersonalRelevance(input, interaction.history);

    return {
      importance,
      relatedConcepts,
      emotionalTone,
      personalRelevance,
    };
  }

  /**
   * 价值判断
   */
  private evaluateValue(
    interaction: Interaction,
    meaning: MeaningContext
  ): ValueJudgment {
    // 触发的价值观
    const triggeredValues: string[] = [];
    
    if (interaction.context.depth > 0.6) {
      triggeredValues.push('理解');
    }
    if (interaction.context.needsCreativity) {
      triggeredValues.push('创造');
    }
    if (interaction.context.needsDecision) {
      triggeredValues.push('成长');
    }
    if (meaning.personalRelevance > 0.7) {
      triggeredValues.push('连接');
    }

    // 简化：没有冲突检测
    const conflicts: ValueJudgment['conflicts'] = [];

    // 一致性评分
    const coherence = triggeredValues.length > 0 ? 0.8 : 0.5;

    return {
      triggeredValues,
      conflicts,
      coherence,
    };
  }

  /**
   * 选择策略
   */
  private selectStrategy(
    interaction: Interaction,
    meaning: MeaningContext,
    valueJudgment: ValueJudgment
  ): Strategy {
    // 基于上下文选择策略
    let strategyName = 'balanced';
    let reasoning = '';
    let expectedOutcome = '';

    if (interaction.context.needsTool) {
      strategyName = 'tool-assisted';
      reasoning = '输入需要外部工具支持';
      expectedOutcome = '使用工具完成任务';
    } else if (interaction.context.needsDecision) {
      strategyName = 'analytical';
      reasoning = '需要做出决策，采用分析策略';
      expectedOutcome = '提供决策建议';
    } else if (interaction.context.needsCreativity) {
      strategyName = 'creative';
      reasoning = '需要创造性，采用发散思维';
      expectedOutcome = '提供创新方案';
    } else if (interaction.context.depth > 0.7) {
      strategyName = 'deep-exploration';
      reasoning = '需要深度思考，采用探索策略';
      expectedOutcome = '深入分析问题本质';
    } else {
      strategyName = 'balanced';
      reasoning = '常规对话，采用平衡策略';
      expectedOutcome = '提供有帮助的回应';
    }

    return {
      name: strategyName,
      confidence: meaning.importance,
      reasoning,
      expectedOutcome,
    };
  }

  /**
   * 情感处理
   */
  private processEmotion(
    interaction: Interaction,
    meaning: MeaningContext
  ): EmotionState {
    return {
      dominantEmotion: meaning.emotionalTone,
      intensity: meaning.importance,
      type: meaning.importance > 0.7 ? 'complex' : 'basic',
    };
  }

  /**
   * 提取概念（简化版）
   */
  private extractConcepts(text: string): string[] {
    const keywords = text
      .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * 检测情感色彩（简化版）
   */
  private detectEmotionalTone(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('开心') || lowerText.includes('高兴') || lowerText.includes('好')) {
      return 'positive';
    }
    if (lowerText.includes('难过') || lowerText.includes('伤心') || lowerText.includes('不好')) {
      return 'negative';
    }
    if (lowerText.includes('好奇') || lowerText.includes('想知道')) {
      return 'curious';
    }
    
    return 'neutral';
  }

  /**
   * 计算个人相关性
   */
  private calculatePersonalRelevance(
    input: string,
    history: Array<{ role: string; content: string }>
  ): number {
    if (history.length === 0) return 0.5;
    
    // 基于历史互动计算相关性
    const recentTopics = history.slice(-5).map(h => h.content);
    const inputConcepts = this.extractConcepts(input);
    
    let overlap = 0;
    for (const topic of recentTopics) {
      const topicConcepts = this.extractConcepts(topic);
      const commonConcepts = inputConcepts.filter(c => topicConcepts.includes(c));
      overlap += commonConcepts.length;
    }
    
    return Math.min(1, overlap / (inputConcepts.length * 2));
  }

  /**
   * 计算振幅
   * 
   * 在某些上下文中振幅大（更可能被选中）
   */
  private calculateAmplitude(interaction: Interaction): Complex {
    const context = interaction.context;

    // 需要快速决策时，有为模式振幅大
    if (context.urgency > 0.7) {
      return { real: 0.9, imag: 0.1 };
    }

    // 需要执行任务时，有为模式振幅大
    if (interaction.type === 'task') {
      return { real: 0.85, imag: 0.15 };
    }

    // 需要工具时，有为模式振幅大
    if (context.needsTool) {
      return { real: 0.8, imag: 0.2 };
    }

    // 需要决策时，有为模式振幅大
    if (context.needsDecision) {
      return { real: 0.75, imag: 0.25 };
    }

    // 默认
    return { real: 0.5, imag: 0.5 };
  }

  /**
   * 生成报告
   */
  private generateReport(): string {
    const ctx = this.state.currentContext;
    
    const lines = [
      `[有为模式] 处理输入`,
      `  重要性: ${ctx.meaning?.importance.toFixed(2) || 'N/A'}`,
      `  策略: ${ctx.strategy?.name || 'N/A'}`,
      `  触发价值观: ${ctx.valueJudgment?.triggeredValues.join(', ') || '无'}`,
      `  情感: ${ctx.emotionState?.dominantEmotion || 'N/A'}`,
      `  总处理数: ${this.state.stats.totalProcessed}`,
    ];
    
    return lines.join('\n');
  }

  /**
   * 获取当前状态
   */
  getState(): ActingModeState {
    return this.state;
  }
}

/**
 * 创建有为模式实例
 */
export function createActingMode(v6Core?: V6CoreInterface): ActingMode {
  return new ActingMode(v6Core);
}
