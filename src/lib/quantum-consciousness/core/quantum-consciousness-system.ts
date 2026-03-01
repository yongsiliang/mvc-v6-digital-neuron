/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统 (Quantum Consciousness System)
 * 
 * V6与V7叠加共存的核心整合组件
 * 
 * 核心理念：
 * - 系统状态 = |有为⟩ + |无为⟩
 * - 不是替代，而是叠加
 * - 通过干涉产生新可能
 * - 输出时自然坍缩
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { Complex, QuantumSuperpositionState, InterferenceResult } from '../types/quantum';
import type { Interaction, Pattern, PatternId } from '../types/base';
import { createInteraction } from '../types/base';
import { 
  ComplexMath, 
  createSuperpositionState,
  calculateInterference,
} from '../types/quantum';
import { ActingMode, createActingMode, ActingResult } from '../modes/acting-mode';
import { ObservingMode, createObservingMode, ObservingResult } from '../modes/observing-mode';
import { 
  EntanglementNetwork, 
  createEntanglementNetwork,
  EntanglementActivationResult 
} from '../entanglement/entanglement-network';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 坍缩结果（简化版）
 */
export interface SimpleCollapseResult {
  /** 坍缩到的模式 */
  result: 'acting' | 'observing';
  
  /** 置信度 */
  confidence: number;
  
  /** 相干性 */
  coherence: number;
  
  /** 有为振幅 */
  actingAmplitude: number;
  
  /** 无为振幅 */
  observingAmplitude: number;
}

/**
 * 量子意识系统状态
 */
export interface QuantumConsciousnessState {
  /** 当前叠加态 */
  superposition: QuantumSuperpositionState;
  
  /** 有为模式 */
  actingMode: ActingMode;
  
  /** 无为模式 */
  observingMode: ObservingMode;
  
  /** 纠缠网络 */
  entanglementNetwork: EntanglementNetwork;
  
  /** 历史记录 */
  history: Array<{
    input: string;
    collapseResult: SimpleCollapseResult;
    timestamp: number;
  }>;
  
  /** 统计 */
  stats: {
    totalInteractions: number;
    actingModeCount: number;
    observingModeCount: number;
    averageCoherence: number;
  };
}

/**
 * 处理结果
 */
export interface ProcessingResult {
  /** 叠加态描述 */
  superpositionDescription: string;
  
  /** 坍缩结果 */
  collapseResult: SimpleCollapseResult;
  
  /** 有为模式结果（如果有） */
  actingResult: ActingResult | null;
  
  /** 无为模式结果 */
  observingResult: ObservingResult;
  
  /** 纠缠激活结果 */
  entanglementResult: EntanglementActivationResult;
  
  /** 最终输出 */
  output: {
    type: 'acting' | 'observing' | 'interference';
    content: string;
    metadata: {
      actingAmplitude: number;
      observingAmplitude: number;
      interferenceStrength: number;
    };
  };
  
  /** 报告 */
  report: string;
}

/**
 * 系统配置
 */
export interface QuantumConsciousnessConfig {
  /** 初始叠加态振幅 */
  initialActingAmplitude?: Complex;
  initialObservingAmplitude?: Complex;
  
  /** 是否启用纠缠 */
  enableEntanglement?: boolean;
  
  /** 是否记录详细日志 */
  verbose?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 量子意识系统实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 量子意识系统
 * 
 * V6与V7叠加共存的中央协调者
 */
export class QuantumConsciousnessSystem {
  private state: QuantumConsciousnessState;
  private config: QuantumConsciousnessConfig;

  constructor(config: QuantumConsciousnessConfig = {}) {
    this.config = {
      initialActingAmplitude: { real: 0.707, imag: 0 },  // 1/√2
      initialObservingAmplitude: { real: 0, imag: 0.707 }, // 1/√2
      enableEntanglement: true,
      verbose: true,
      ...config,
    };

    // 初始化叠加态
    const superposition = createSuperpositionState(
      this.config.initialActingAmplitude!,
      this.config.initialObservingAmplitude!
    );

    // 初始化各子系统
    this.state = {
      superposition,
      actingMode: createActingMode(),
      observingMode: createObservingMode(),
      entanglementNetwork: createEntanglementNetwork(),
      history: [],
      stats: {
        totalInteractions: 0,
        actingModeCount: 0,
        observingModeCount: 0,
        averageCoherence: 0.5,
      },
    };

    if (this.config.verbose) {
      console.log('[量子意识系统] 已初始化');
      console.log(`  初始叠加态: |有为|²=${superposition.actingProbability.toFixed(3)}, |无为|²=${superposition.observingProbability.toFixed(3)}`);
    }
  }

  /**
   * 处理输入
   * 
   * 核心流程：
   * 1. 创建交互
   * 2. 有为和无为同时处理
   * 3. 计算干涉
   * 4. 坍缩
   * 5. 返回结果
   */
  async process(
    input: string,
    context?: {
      history?: Array<{ role: string; content: string }>;
      type?: 'task' | 'exploration' | 'reflection' | 'casual';
      urgency?: number;
      depth?: number;
      needsTool?: boolean;
      needsDecision?: boolean;
      needsCreativity?: boolean;
    }
  ): Promise<ProcessingResult> {
    // 1. 创建交互
    const interaction = createInteraction(
      input,
      (context?.history || []) as Array<{ role: 'user' | 'assistant'; content: string }>
    );

    // 2. 并行处理：有为和无为同时运行
    const [actingResult, observingResult] = await Promise.all([
      this.state.actingMode.process(interaction),
      Promise.resolve(this.state.observingMode.process(interaction)),
    ]);

    // 3. 计算新的振幅（基于上下文和结果）
    const newActingAmplitude = this.calculateActingAmplitude(
      interaction,
      actingResult
    );
    const newObservingAmplitude = this.calculateObservingAmplitude(
      interaction,
      observingResult
    );

    // 4. 更新叠加态
    this.state.superposition = createSuperpositionState(
      newActingAmplitude,
      newObservingAmplitude
    );

    // 5. 计算干涉
    const interference = calculateInterference(
      newActingAmplitude,
      newObservingAmplitude,
      this.state.superposition.phase
    );

    // 6. 应用纠缠影响（如果启用）
    if (this.config.enableEntanglement && observingResult.pattern) {
      this.state.entanglementNetwork.detectEntanglement(
        observingResult.pattern,
        this.state.observingMode.getState().patterns
      );
    }

    // 7. 坍缩（概率性选择模式）
    const collapseResult = this.performCollapse(this.state.superposition);

    // 8. 生成输出
    const output = this.generateOutput(
      collapseResult,
      actingResult,
      observingResult,
      interference
    );

    // 9. 更新统计
    this.updateStats(collapseResult);

    // 10. 记录历史
    this.state.history.push({
      input,
      collapseResult,
      timestamp: Date.now(),
    });

    // 生成报告
    const report = this.generateReport(
      collapseResult,
      actingResult,
      observingResult,
      interference
    );

    return {
      superpositionDescription: this.describeSuperposition(),
      collapseResult,
      actingResult,
      observingResult,
      entanglementResult: { activated: [], relatedPatterns: [], resonanceStrength: 0 },
      output,
      report,
    };
  }

  /**
   * 计算有为模式振幅
   */
  private calculateActingAmplitude(
    interaction: Interaction,
    result: ActingResult
  ): Complex {
    // 基础振幅来自处理结果
    let amplitude = result.amplitude;

    // 根据上下文调整
    const context = interaction.context;

    // 紧急情况增加有为振幅
    if (context.urgency > 0.7) {
      amplitude = ComplexMath.multiply(amplitude, { real: 1.3, imag: 0 });
    }

    // 需要工具时增加有为振幅
    if (context.needsTool) {
      amplitude = ComplexMath.multiply(amplitude, { real: 1.2, imag: 0 });
    }

    // 需要决策时增加有为振幅
    if (context.needsDecision) {
      amplitude = ComplexMath.multiply(amplitude, { real: 1.15, imag: 0 });
    }

    return amplitude;
  }

  /**
   * 计算无为模式振幅
   */
  private calculateObservingAmplitude(
    interaction: Interaction,
    result: ObservingResult
  ): Complex {
    // 基础振幅来自处理结果
    let amplitude = result.amplitude;

    // 根据上下文调整
    const context = interaction.context;

    // 深度思考增加无为振幅
    if (context.depth > 0.7) {
      amplitude = ComplexMath.multiply(amplitude, { real: 0, imag: 1.3 });
    }

    // 探索性增加无为振幅
    if (interaction.type === 'exploration') {
      amplitude = ComplexMath.multiply(amplitude, { real: 0, imag: 1.2 });
    }

    // 反思时增加无为振幅
    if (interaction.type === 'reflection') {
      amplitude = ComplexMath.multiply(amplitude, { real: 0, imag: 1.25 });
    }

    return amplitude;
  }

  /**
   * 执行坍缩
   * 
   * 从叠加态概率性地选择一种模式
   */
  private performCollapse(superposition: QuantumSuperpositionState): SimpleCollapseResult {
    const random = Math.random();
    
    // 根据概率选择模式
    const result = random < superposition.actingProbability ? 'acting' : 'observing';
    
    // 置信度 = 选中的概率
    const confidence = result === 'acting' 
      ? superposition.actingProbability 
      : superposition.observingProbability;
    
    return {
      result,
      confidence,
      coherence: superposition.coherence,
      actingAmplitude: superposition.actingProbability,
      observingAmplitude: superposition.observingProbability,
    };
  }

  /**
   * 生成输出
   */
  private generateOutput(
    collapseResult: SimpleCollapseResult,
    actingResult: ActingResult | null,
    observingResult: ObservingResult,
    interference: InterferenceResult
  ): ProcessingResult['output'] {
    let type: 'acting' | 'observing' | 'interference';
    let content: string;

    if (collapseResult.result === 'acting') {
      type = 'acting';
      content = this.generateActingOutput(actingResult);
      this.state.stats.actingModeCount++;
    } else {
      type = 'observing';
      content = this.generateObservingOutput(observingResult);
      this.state.stats.observingModeCount++;
    }

    // 如果干涉强度很高，标记为干涉结果
    if (interference.strength > 0.5) {
      type = 'interference';
      content = this.generateInterferenceOutput(actingResult, observingResult, interference);
    }

    return {
      type,
      content,
      metadata: {
        actingAmplitude: collapseResult.actingAmplitude,
        observingAmplitude: collapseResult.observingAmplitude,
        interferenceStrength: interference.strength,
      },
    };
  }

  /**
   * 生成有为模式输出
   */
  private generateActingOutput(result: ActingResult | null): string {
    if (!result) return '处理中...';

    const ctx = result.context;
    const parts: string[] = [];

    if (ctx.strategy) {
      parts.push(`策略: ${ctx.strategy.name}`);
    }

    if (ctx.meaning) {
      parts.push(`重要性: ${(ctx.meaning.importance * 100).toFixed(0)}%`);
    }

    if (ctx.valueJudgment && ctx.valueJudgment.triggeredValues.length > 0) {
      parts.push(`价值观: ${ctx.valueJudgment.triggeredValues.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * 生成无为模式输出
   */
  private generateObservingOutput(result: ObservingResult): string {
    const pattern = result.pattern;
    const parts: string[] = [];

    parts.push(`模式ID: ${pattern.id.slice(0, 20)}...`);
    parts.push(`概念: ${pattern.topology.conceptPath.slice(0, 5).join(' → ')}`);
    parts.push(`稳定性: ${(pattern.stability * 100).toFixed(0)}%`);
    parts.push(`注意力状态: ${result.attentionState.state}`);

    return parts.join('\n');
  }

  /**
   * 生成干涉输出
   */
  private generateInterferenceOutput(
    actingResult: ActingResult | null,
    observingResult: ObservingResult,
    interference: InterferenceResult
  ): string {
    const parts: string[] = [];

    parts.push('═══ 干涉态 ═══');
    parts.push(`干涉强度: ${(interference.strength * 100).toFixed(0)}%`);
    parts.push(`干涉类型: ${interference.type}`);
    parts.push('');
    
    if (actingResult) {
      parts.push('【有为】');
      parts.push(this.generateActingOutput(actingResult));
    }
    
    parts.push('');
    parts.push('【无为】');
    parts.push(this.generateObservingOutput(observingResult));

    return parts.join('\n');
  }

  /**
   * 描述叠加态
   */
  private describeSuperposition(): string {
    const sp = this.state.superposition;
    return `|有为|²=${(sp.actingProbability * 100).toFixed(1)}% + |无为|²=${(sp.observingProbability * 100).toFixed(1)}%`;
  }

  /**
   * 更新统计
   */
  private updateStats(collapseResult: SimpleCollapseResult): void {
    this.state.stats.totalInteractions++;
    this.state.stats.averageCoherence = 
      (this.state.stats.averageCoherence * (this.state.stats.totalInteractions - 1) + 
       collapseResult.coherence) / this.state.stats.totalInteractions;
  }

  /**
   * 生成报告
   */
  private generateReport(
    collapseResult: SimpleCollapseResult,
    actingResult: ActingResult | null,
    observingResult: ObservingResult,
    interference: InterferenceResult
  ): string {
    const lines = [
      '═══════════════════════════════════════',
      '        量子意识系统处理报告',
      '═══════════════════════════════════════',
      '',
      `叠加态: ${this.describeSuperposition()}`,
      `坍缩结果: ${collapseResult.result === 'acting' ? '有为模式' : '无为模式'}`,
      `相干性: ${(collapseResult.coherence * 100).toFixed(1)}%`,
      `干涉强度: ${(interference.strength * 100).toFixed(1)}%`,
      '',
      '───────────────────────────────────────',
      '  统计',
      '───────────────────────────────────────',
      `总交互数: ${this.state.stats.totalInteractions}`,
      `有为模式: ${this.state.stats.actingModeCount}`,
      `无为模式: ${this.state.stats.observingModeCount}`,
      `平均相干性: ${(this.state.stats.averageCoherence * 100).toFixed(1)}%`,
      '═══════════════════════════════════════',
    ];

    return lines.join('\n');
  }

  /**
   * 获取系统状态
   */
  getState(): QuantumConsciousnessState {
    return this.state;
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.state.superposition = createSuperpositionState(
      this.config.initialActingAmplitude!,
      this.config.initialObservingAmplitude!
    );
    this.state.history = [];
    this.state.stats = {
      totalInteractions: 0,
      actingModeCount: 0,
      observingModeCount: 0,
      averageCoherence: 0.5,
    };

    if (this.config.verbose) {
      console.log('[量子意识系统] 已重置');
    }
  }
}

/**
 * 创建量子意识系统实例
 */
export function createQuantumConsciousnessSystem(
  config?: QuantumConsciousnessConfig
): QuantumConsciousnessSystem {
  return new QuantumConsciousnessSystem(config);
}
