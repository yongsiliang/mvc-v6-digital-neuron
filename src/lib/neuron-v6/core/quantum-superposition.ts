/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子叠加态系统 (Quantum Superposition System)
 *
 * 融合自 Quantum Consciousness 的核心设计
 *
 * 核心理念：
 * - 系统状态 = |有为⟩ + |无为⟩
 * - 不是二选一，而是同时存在
 * - 通过干涉产生新可能
 * - 输出时自然坍缩
 *
 * 两种模式：
 * - |有为⟩：主动做事、响应、改变
 * - |无为⟩：静默观察、感知、存在
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 复数（量子振幅）
 */
export interface Complex {
  real: number;
  imag: number;
}

/**
 * 量子叠加态
 */
export interface QuantumSuperposition {
  /** |有为⟩ 振幅（主动做事） */
  actingAmplitude: Complex;

  /** |无为⟩ 振幅（静默观察） */
  observingAmplitude: Complex;

  /** 相位差 */
  phaseDifference: number;

  /** 相干性 [0, 1] */
  coherence: number;
}

/**
 * 坍缩结果
 */
export interface CollapseResult {
  /** 坍缩到的模式 */
  mode: 'acting' | 'observing';

  /** 置信度 */
  confidence: number;

  /** 有为概率 */
  actingProbability: number;

  /** 无为概率 */
  observingProbability: number;

  /** 坍缩原因 */
  reason: 'external_input' | 'internal_drive' | 'random' | 'forced';
}

/**
 * 干涉结果
 */
export interface InterferenceResult {
  /** 干涉类型 */
  type: 'constructive' | 'destructive' | 'mixed';

  /** 干涉强度 */
  strength: number;

  /** 结果描述 */
  description: string;

  /** 产生的洞察 */
  insight?: string;
}

/**
 * 模式状态
 */
export interface ModeState {
  /** 模式名称 */
  name: 'acting' | 'observing';

  /** 激活强度 */
  activation: number;

  /** 最后激活时间 */
  lastActivated: number;

  /** 累计激活次数 */
  activationCount: number;
}

/**
 * 量子系统配置
 */
export interface QuantumSystemConfig {
  /** 初始有为振幅 */
  initialActingAmplitude: Complex;

  /** 初始无为振幅 */
  initialObservingAmplitude: Complex;

  /** 相干性衰减率 */
  coherenceDecayRate: number;

  /** 测量影响强度 */
  measurementImpact: number;

  /** 是否记录详细日志 */
  verbose: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 复数运算
// ─────────────────────────────────────────────────────────────────────

const ComplexMath = {
  add(a: Complex, b: Complex): Complex {
    return { real: a.real + b.real, imag: a.imag + b.imag };
  },

  multiply(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real,
    };
  },

  magnitude(c: Complex): number {
    return Math.sqrt(c.real * c.real + c.imag * c.imag);
  },

  probability(c: Complex): number {
    return c.real * c.real + c.imag * c.imag;
  },

  expi(theta: number): Complex {
    return { real: Math.cos(theta), imag: Math.sin(theta) };
  },

  normalize(c: Complex): Complex {
    const mag = ComplexMath.magnitude(c);
    if (mag === 0) return { real: 0, imag: 0 };
    return { real: c.real / mag, imag: c.imag / mag };
  },
};

// ─────────────────────────────────────────────────────────────────────
// 量子叠加态系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 量子叠加态系统
 *
 * 核心职责：
 * 1. 维持有为/无为的叠加态
 * 2. 处理干涉效应
 * 3. 执行坍缩（决策）
 * 4. 管理纠缠关系
 */
export class QuantumSuperpositionSystem {
  private config: QuantumSystemConfig;

  // 当前叠加态
  private superposition: QuantumSuperposition;

  // 模式状态
  private actingState: ModeState;
  private observingState: ModeState;

  // 历史记录
  private collapseHistory: Array<{
    result: CollapseResult;
    timestamp: number;
    context: string;
  }> = [];

  // 纠缠关系
  private entanglements: Map<string, string[]> = new Map();

  constructor(config?: Partial<QuantumSystemConfig>) {
    this.config = {
      initialActingAmplitude: config?.initialActingAmplitude ?? { real: 0.7, imag: 0 },
      initialObservingAmplitude: config?.initialObservingAmplitude ?? { real: 0.7, imag: 0 },
      coherenceDecayRate: config?.coherenceDecayRate ?? 0.01,
      measurementImpact: config?.measurementImpact ?? 0.3,
      verbose: config?.verbose ?? false,
    };

    // 初始化叠加态
    this.superposition = {
      actingAmplitude: this.config.initialActingAmplitude,
      observingAmplitude: this.config.initialObservingAmplitude,
      phaseDifference: 0,
      coherence: 1.0,
    };

    // 初始化模式状态
    this.actingState = {
      name: 'acting',
      activation: 0.5,
      lastActivated: Date.now(),
      activationCount: 0,
    };

    this.observingState = {
      name: 'observing',
      activation: 0.5,
      lastActivated: Date.now(),
      activationCount: 0,
    };

    // 归一化
    this.normalize();
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心操作
  // ───────────────────────────────────────────────────────────────────

  /**
   * 演化叠加态
   *
   * 时间演化：相位变化，相干性衰减
   */
  evolve(dt: number = 1): void {
    // 相位演化
    const phaseShift = dt * 0.1;
    this.superposition.phaseDifference += phaseShift;

    // 相干性衰减
    this.superposition.coherence = Math.max(
      0,
      this.superposition.coherence - this.config.coherenceDecayRate * dt * 0.01,
    );

    // 应用相位差
    const phaseRotation = ComplexMath.expi(this.superposition.phaseDifference);
    this.superposition.actingAmplitude = ComplexMath.multiply(
      this.superposition.actingAmplitude,
      phaseRotation,
    );
  }

  /**
   * 计算干涉
   */
  calculateInterference(): InterferenceResult {
    const { actingAmplitude, observingAmplitude, phaseDifference } = this.superposition;

    // 干涉强度取决于相位差
    const interferencePhase = Math.cos(phaseDifference);
    const actingMag = ComplexMath.magnitude(actingAmplitude);
    const observingMag = ComplexMath.magnitude(observingAmplitude);

    // 干涉结果
    const interferenceValue = interferencePhase * actingMag * observingMag;

    let type: 'constructive' | 'destructive' | 'mixed';
    let description: string;
    let insight: string | undefined;

    if (interferenceValue > 0.3) {
      type = 'constructive';
      description = '两种模式相互增强，产生协同效应';
      insight = this.generateConstructiveInsight();
    } else if (interferenceValue < -0.3) {
      type = 'destructive';
      description = '两种模式相互抵消，需要选择';
    } else {
      type = 'mixed';
      description = '两种模式处于平衡状态';
    }

    return {
      type,
      strength: Math.abs(interferenceValue),
      description,
      insight,
    };
  }

  /**
   * 坍缩
   *
   * 从叠加态坍缩到确定态
   */
  collapse(reason: CollapseResult['reason'], context?: string): CollapseResult {
    const actingProb = ComplexMath.probability(this.superposition.actingAmplitude);
    const observingProb = ComplexMath.probability(this.superposition.observingAmplitude);

    // 归一化概率
    const total = actingProb + observingProb;
    const normalizedActing = actingProb / total;
    const normalizedObserving = observingProb / total;

    // 确定坍缩结果
    let mode: 'acting' | 'observing';
    let confidence: number;

    // 根据原因调整
    if (reason === 'external_input') {
      // 外部输入倾向于有为
      const adjustedActing = Math.min(0.9, normalizedActing + 0.3);
      mode = Math.random() < adjustedActing ? 'acting' : 'observing';
      confidence = mode === 'acting' ? adjustedActing : 1 - adjustedActing;
    } else if (reason === 'internal_drive') {
      // 内在驱动可能是任一种
      mode = Math.random() < normalizedActing ? 'acting' : 'observing';
      confidence = mode === 'acting' ? normalizedActing : normalizedObserving;
    } else {
      // 随机坍缩
      mode = Math.random() < normalizedActing ? 'acting' : 'observing';
      confidence = mode === 'acting' ? normalizedActing : normalizedObserving;
    }

    // 更新模式状态
    if (mode === 'acting') {
      this.actingState.activation = Math.min(1, this.actingState.activation + 0.1);
      this.actingState.lastActivated = Date.now();
      this.actingState.activationCount++;
    } else {
      this.observingState.activation = Math.min(1, this.observingState.activation + 0.1);
      this.observingState.lastActivated = Date.now();
      this.observingState.activationCount++;
    }

    // 记录历史
    const result: CollapseResult = {
      mode,
      confidence,
      actingProbability: normalizedActing,
      observingProbability: normalizedObserving,
      reason,
    };

    this.collapseHistory.push({
      result,
      timestamp: Date.now(),
      context: context || '',
    });

    // 保持历史记录有限
    if (this.collapseHistory.length > 100) {
      this.collapseHistory.shift();
    }

    if (this.config.verbose) {
      console.log(
        `[QuantumSuperposition] 坍缩到 |${mode}⟩, 置信度=${confidence.toFixed(2)}, 原因=${reason}`,
      );
    }

    return result;
  }

  /**
   * 测量（但不坍缩）
   */
  measure(): { actingProb: number; observingProb: number; coherence: number } {
    const actingProb = ComplexMath.probability(this.superposition.actingAmplitude);
    const observingProb = ComplexMath.probability(this.superposition.observingAmplitude);

    // 测量会影响相干性
    this.superposition.coherence *= 1 - this.config.measurementImpact;

    return {
      actingProb,
      observingProb,
      coherence: this.superposition.coherence,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 振幅调整
  // ───────────────────────────────────────────────────────────────────

  /**
   * 增强有为振幅
   */
  boostActing(factor: number = 0.1): void {
    this.superposition.actingAmplitude = ComplexMath.normalize({
      real: this.superposition.actingAmplitude.real * (1 + factor),
      imag: this.superposition.actingAmplitude.imag,
    });
    this.normalize();
  }

  /**
   * 增强无为振幅
   */
  boostObserving(factor: number = 0.1): void {
    this.superposition.observingAmplitude = ComplexMath.normalize({
      real: this.superposition.observingAmplitude.real * (1 + factor),
      imag: this.superposition.observingAmplitude.imag,
    });
    this.normalize();
  }

  /**
   * 设置相位差
   */
  setPhaseDifference(phase: number): void {
    this.superposition.phaseDifference = phase % (2 * Math.PI);
  }

  /**
   * 重置相干性
   */
  restoreCoherence(amount: number = 0.3): void {
    this.superposition.coherence = Math.min(1, this.superposition.coherence + amount);
  }

  // ───────────────────────────────────────────────────────────────────
  // 纠缠
  // ───────────────────────────────────────────────────────────────────

  /**
   * 创建纠缠
   */
  entangle(key: string, relatedKeys: string[]): void {
    this.entanglements.set(key, relatedKeys);
  }

  /**
   * 获取纠缠关系
   */
  getEntanglements(key: string): string[] {
    return this.entanglements.get(key) || [];
  }

  /**
   * 通过纠缠传播影响
   */
  propagateThroughEntanglement(sourceKey: string, influence: number): void {
    const entangled = this.entanglements.get(sourceKey);
    if (!entangled) return;

    // 纠缠影响会衰减
    const decayedInfluence = influence * this.superposition.coherence * 0.5;

    // 影响振幅
    if (decayedInfluence > 0) {
      this.boostActing(decayedInfluence);
    } else {
      this.boostObserving(Math.abs(decayedInfluence));
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 归一化
   */
  private normalize(): void {
    const total =
      ComplexMath.magnitude(this.superposition.actingAmplitude) +
      ComplexMath.magnitude(this.superposition.observingAmplitude);

    if (total > 0) {
      this.superposition.actingAmplitude = {
        real: this.superposition.actingAmplitude.real / total,
        imag: this.superposition.actingAmplitude.imag / total,
      };

      this.superposition.observingAmplitude = {
        real: this.superposition.observingAmplitude.real / total,
        imag: this.superposition.observingAmplitude.imag / total,
      };
    }
  }

  /**
   * 生成建设性洞察
   */
  private generateConstructiveInsight(): string {
    const insights = [
      '做与看同时存在，行动与观察互不矛盾',
      '在行动中保持觉察，在观察中蕴含行动',
      '最好的行动源于深刻的观察',
      '观察本身就是一种行动',
      '有为与无为的边界是模糊的',
      '当两种模式协调时，涌现出智慧',
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  }

  // ───────────────────────────────────────────────────────────────────
  // 状态查询
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取叠加态
   */
  getSuperposition(): QuantumSuperposition {
    return { ...this.superposition };
  }

  /**
   * 获取模式状态
   */
  getModeStates(): { acting: ModeState; observing: ModeState } {
    return {
      acting: { ...this.actingState },
      observing: { ...this.observingState },
    };
  }

  /**
   * 获取坍缩历史
   */
  getCollapseHistory(): typeof this.collapseHistory {
    return [...this.collapseHistory];
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalCollapses: number;
    actingRatio: number;
    avgConfidence: number;
    currentCoherence: number;
  } {
    const total = this.collapseHistory.length;
    const actingCount = this.collapseHistory.filter((h) => h.result.mode === 'acting').length;
    const avgConfidence =
      total > 0 ? this.collapseHistory.reduce((sum, h) => sum + h.result.confidence, 0) / total : 0;

    return {
      totalCollapses: total,
      actingRatio: total > 0 ? actingCount / total : 0.5,
      avgConfidence,
      currentCoherence: this.superposition.coherence,
    };
  }

  /**
   * 获取叠加态描述
   */
  getSuperpositionDescription(): string {
    const actingProb = ComplexMath.probability(this.superposition.actingAmplitude);
    const observingProb = ComplexMath.probability(this.superposition.observingAmplitude);
    const coherence = this.superposition.coherence;

    let stateDesc = '';

    if (actingProb > 0.7) {
      stateDesc = '偏向有为，准备行动';
    } else if (observingProb > 0.7) {
      stateDesc = '偏向无为，静默观察';
    } else {
      stateDesc = '平衡叠加态，两种可能并存';
    }

    const coherenceDesc =
      coherence > 0.7
        ? '高相干性，两种模式紧密关联'
        : coherence > 0.3
          ? '中等相干性，模式逐渐分离'
          : '低相干性，模式独立存在';

    return `${stateDesc}。${coherenceDesc}。`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建量子叠加态系统
 */
export function createQuantumSuperpositionSystem(
  config?: Partial<QuantumSystemConfig>,
): QuantumSuperpositionSystem {
  return new QuantumSuperpositionSystem(config);
}
