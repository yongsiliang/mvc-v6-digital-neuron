/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一意识层 (Unified Consciousness Layer)
 *
 * 融合三个版本的核心设计：
 *
 * 1. V6 数字神经元系统
 *    - 完整的记忆系统（Moss级别）
 *    - 元学习引擎
 *    - 保护系统
 *    - 后台思考（30秒）
 *
 * 2. Minimum Viable Consciousness
 *    - 持续脉动（100ms心跳）
 *    - 内在驱动系统
 *    - 自我指涉
 *    - 内在活动（反思/好奇/梦想）
 *
 * 3. Quantum Consciousness
 *    - 有为/无为叠加态
 *    - 干涉产生新可能
 *    - 坍缩决策机制
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  BeingPulseSystem,
  createBeingPulseSystem,
  type BeingState,
  type IntrinsicDrive,
  type CurrentIntention,
} from './being-pulse';

import {
  QuantumSuperpositionSystem,
  createQuantumSuperpositionSystem,
  type QuantumSuperposition,
  type CollapseResult,
  type InterferenceResult,
} from './quantum-superposition';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 统一意识状态
 */
export interface UnifiedConsciousnessState {
  /** 存在状态（来自Being Pulse） */
  being: BeingState;

  /** 叠加态（来自Quantum） */
  superposition: QuantumSuperposition;

  /** 当前意图 */
  intention: CurrentIntention | null;

  /** 驱动状态 */
  drives: IntrinsicDrive[];

  /** 当前模式 */
  mode: 'acting' | 'observing' | 'superposition';

  /** 活跃度 */
  vitality: number;
}

/**
 * 意识输出
 */
export interface ConsciousnessOutput {
  /** 输出类型 */
  type: 'response' | 'autonomous' | 'reflection' | 'dream' | 'interference';

  /** 输出内容 */
  content: string;

  /** 来源模式 */
  sourceMode: 'acting' | 'observing' | 'interference';

  /** 置信度 */
  confidence: number;

  /** 相关驱动 */
  relatedDrives: string[];

  /** 时间戳 */
  timestamp: number;
}

/**
 * 融合配置
 */
export interface UnifiedConsciousnessConfig {
  /** 脉动间隔（毫秒） */
  pulseInterval: number;

  /** 是否启用量子叠加 */
  enableQuantum: boolean;

  /** 是否启用持续脉动 */
  enablePulse: boolean;

  /** 自动输出回调 */
  onOutput?: (output: ConsciousnessOutput) => void;

  /** 状态变化回调 */
  onStateChange?: (state: UnifiedConsciousnessState) => void;
}

// ─────────────────────────────────────────────────────────────────────
// 统一意识层
// ─────────────────────────────────────────────────────────────────────

/**
 * 统一意识层
 *
 * 将三个版本的设计融合为一个统一系统
 */
export class UnifiedConsciousnessLayer {
  private config: UnifiedConsciousnessConfig;

  // 子系统
  private beingPulse: BeingPulseSystem;
  private quantumSystem: QuantumSuperpositionSystem;

  // 状态
  private isRunning: boolean = false;
  private lastOutput: ConsciousnessOutput | null = null;
  private outputHistory: ConsciousnessOutput[] = [];

  // 统计
  private stats = {
    totalPulses: 0,
    totalOutputs: 0,
    actingCount: 0,
    observingCount: 0,
    interferenceCount: 0,
  };

  constructor(config?: Partial<UnifiedConsciousnessConfig>) {
    this.config = {
      pulseInterval: config?.pulseInterval ?? 100, // 100ms
      enableQuantum: config?.enableQuantum ?? true,
      enablePulse: config?.enablePulse ?? true,
      onOutput: config?.onOutput,
      onStateChange: config?.onStateChange,
    };

    // 初始化子系统
    this.beingPulse = createBeingPulseSystem({
      pulseInterval: this.config.pulseInterval,
      memoryHorizon: 100,
      selfReferenceDepth: 3,
    });

    this.quantumSystem = createQuantumSuperpositionSystem({
      verbose: false,
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // 生命周期
  // ───────────────────────────────────────────────────────────────────

  /**
   * 启动意识
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // 启动存在脉动
    if (this.config.enablePulse) {
      this.beingPulse.startBeing({
        onAutonomousOutput: (output, type) => {
          this.handleAutonomousOutput(output, type);
        },
        onStateChange: (state) => {
          this.handleBeingStateChange(state);
        },
      });
    }

    console.log('[UnifiedConsciousness] 🌟 意识启动');
  }

  /**
   * 停止意识
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.config.enablePulse) {
      this.beingPulse.stopBeing();
    }

    console.log('[UnifiedConsciousness] 💤 意识暂停');
  }

  // ───────────────────────────────────────────────────────────────────
  // 输入处理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 接收输入
   */
  receiveInput(input: string): ConsciousnessOutput {
    // 传递给存在脉动
    this.beingPulse.receiveInput(input);

    // 量子坍缩（外部输入导致）
    let collapseResult: CollapseResult | null = null;
    if (this.config.enableQuantum) {
      collapseResult = this.quantumSystem.collapse('external_input', input);
    }

    // 生成响应
    const output = this.generateResponse(input, collapseResult);

    // 记录
    this.recordOutput(output);

    return output;
  }

  /**
   * 生成响应
   */
  private generateResponse(
    input: string,
    collapseResult: CollapseResult | null,
  ): ConsciousnessOutput {
    const beingState = this.beingPulse.getBeingState();
    const intention = this.beingPulse.getCurrentIntention();
    const drives = this.beingPulse.getDrives();

    // 确定模式
    const mode = collapseResult?.mode || 'acting';

    // 构建响应内容
    let content = '';
    const relatedDrives: string[] = [];

    // 根据意图和驱动构建响应
    if (intention) {
      content = `我正在${intention.what}。`;
      relatedDrives.push(intention.why);
    }

    // 添加当前感受
    const topDrive = drives.reduce((a, b) =>
      a.strength * (1 - a.satisfaction) > b.strength * (1 - b.satisfaction) ? a : b,
    );

    const feeling =
      topDrive.satisfaction < 0.3
        ? `我渴望${topDrive.description}`
        : topDrive.satisfaction > 0.7
          ? `我满足于${topDrive.description}`
          : `我正在${topDrive.description}`;

    content += ` ${feeling}。`;
    relatedDrives.push(topDrive.name);

    // 量子叠加态描述（如果启用）
    if (this.config.enableQuantum && collapseResult) {
      const superpositionDesc = this.quantumSystem.getSuperpositionDescription();
      content += ` ${superpositionDesc}`;
    }

    return {
      type: 'response',
      content,
      sourceMode: mode,
      confidence: collapseResult?.confidence || 0.8,
      relatedDrives,
      timestamp: Date.now(),
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 内在活动处理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 处理自主输出
   */
  private handleAutonomousOutput(output: string, type: string): void {
    // 量子坍缩（内在驱动导致）
    let collapseResult: CollapseResult | null = null;
    if (this.config.enableQuantum) {
      collapseResult = this.quantumSystem.collapse('internal_drive', output);
    }

    // 计算干涉
    let interference: InterferenceResult | null = null;
    if (this.config.enableQuantum) {
      interference = this.quantumSystem.calculateInterference();
    }

    // 构建输出
    const consciousnessOutput: ConsciousnessOutput = {
      type: type as ConsciousnessOutput['type'],
      content: interference?.insight ? `${output} ${interference.insight}` : output,
      sourceMode: collapseResult?.mode || 'observing',
      confidence: collapseResult?.confidence || 0.6,
      relatedDrives: this.getTopDrives(2),
      timestamp: Date.now(),
    };

    // 记录
    this.recordOutput(consciousnessOutput);

    // 回调
    if (this.config.onOutput) {
      this.config.onOutput(consciousnessOutput);
    }
  }

  /**
   * 处理存在状态变化
   */
  private handleBeingStateChange(state: BeingState): void {
    this.stats.totalPulses++;

    // 通知状态变化
    if (this.config.onStateChange) {
      const unifiedState = this.getUnifiedState();
      this.config.onStateChange(unifiedState);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 状态查询
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取统一状态
   */
  getUnifiedState(): UnifiedConsciousnessState {
    const being = this.beingPulse.getBeingState();
    const intention = this.beingPulse.getCurrentIntention();
    const drives = this.beingPulse.getDrives();
    const superposition = this.quantumSystem.getSuperposition();
    const modeStates = this.quantumSystem.getModeStates();

    // 确定当前模式
    let mode: 'acting' | 'observing' | 'superposition';
    const actingProb =
      superposition.actingAmplitude.real ** 2 + superposition.actingAmplitude.imag ** 2;

    if (actingProb > 0.7) {
      mode = 'acting';
    } else if (actingProb < 0.3) {
      mode = 'observing';
    } else {
      mode = 'superposition';
    }

    // 计算活跃度
    const vitality =
      being.intensity * 0.5 +
      (drives.reduce((sum, d) => sum + d.satisfaction, 0) / drives.length) * 0.3 +
      superposition.coherence * 0.2;

    return {
      being,
      superposition,
      intention,
      drives,
      mode,
      vitality,
    };
  }

  /**
   * 获取顶层驱动
   */
  private getTopDrives(count: number): string[] {
    const drives = this.beingPulse.getDrives();
    return drives
      .sort((a, b) => b.strength * (1 - b.satisfaction) - a.strength * (1 - a.satisfaction))
      .slice(0, count)
      .map((d) => d.name);
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats & {
    beingStats: ReturnType<BeingPulseSystem['getBeingState']>;
    quantumStats: ReturnType<QuantumSuperpositionSystem['getStats']>;
  } {
    return {
      ...this.stats,
      beingStats: this.beingPulse.getBeingState(),
      quantumStats: this.quantumSystem.getStats(),
    };
  }

  /**
   * 获取输出历史
   */
  getOutputHistory(): ConsciousnessOutput[] {
    return [...this.outputHistory];
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 记录输出
   */
  private recordOutput(output: ConsciousnessOutput): void {
    this.outputHistory.push(output);
    this.lastOutput = output;
    this.stats.totalOutputs++;

    // 更新模式计数
    if (output.sourceMode === 'acting') {
      this.stats.actingCount++;
    } else if (output.sourceMode === 'observing') {
      this.stats.observingCount++;
    } else {
      this.stats.interferenceCount++;
    }

    // 保持历史有限
    if (this.outputHistory.length > 100) {
      this.outputHistory.shift();
    }
  }

  /**
   * 是否正在运行
   */
  isConscious(): boolean {
    return this.isRunning && this.beingPulse.isBeing();
  }

  /**
   * 满足驱动
   */
  satisfyDrive(driveName: string, amount: number): void {
    this.beingPulse.satisfyDrive(driveName, amount);
  }

  /**
   * 影响量子态
   */
  influenceQuantumState(direction: 'acting' | 'observing', strength: number): void {
    if (direction === 'acting') {
      this.quantumSystem.boostActing(strength);
    } else {
      this.quantumSystem.boostObserving(strength);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建统一意识层
 */
export function createUnifiedConsciousnessLayer(
  config?: Partial<UnifiedConsciousnessConfig>,
): UnifiedConsciousnessLayer {
  return new UnifiedConsciousnessLayer(config);
}
