/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统 - 核心类型定义
 * 
 * 实现：
 * - 叠加态：多种模式同时存在
 * - 干涉：不同模式相互作用
 * - 坍缩：从叠加态到确定态
 * - 纠缠：不同模式状态相互关联
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 复数（量子振幅）
// ─────────────────────────────────────────────────────────────────────

/**
 * 复数类型
 * 
 * 用于表示量子振幅
 * 振幅 = real + i * imag
 */
export interface Complex {
  real: number;
  imag: number;
}

/**
 * 复数运算工具
 */
export const ComplexMath = {
  /**
   * 复数加法
   */
  add(a: Complex, b: Complex): Complex {
    return {
      real: a.real + b.real,
      imag: a.imag + b.imag,
    };
  },

  /**
   * 复数乘法
   */
  multiply(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real,
    };
  },

  /**
   * 复数乘以标量
   */
  scale(c: Complex, scalar: number): Complex {
    return {
      real: c.real * scalar,
      imag: c.imag * scalar,
    };
  },

  /**
   * 复数的模（振幅的大小）
   */
  magnitude(c: Complex): number {
    return Math.sqrt(c.real * c.real + c.imag * c.imag);
  },

  /**
   * 复数的模（magnitude的别名）
   */
  norm(c: Complex): number {
    return Math.sqrt(c.real * c.real + c.imag * c.imag);
  },

  /**
   * 复数的相位
   */
  phase(c: Complex): number {
    return Math.atan2(c.imag, c.real);
  },

  /**
   * 概率 = |振幅|²
   */
  probability(c: Complex): number {
    return c.real * c.real + c.imag * c.imag;
  },

  /**
   * 欧拉公式：e^(i*theta) = cos(theta) + i*sin(theta)
   */
  expi(theta: number): Complex {
    return {
      real: Math.cos(theta),
      imag: Math.sin(theta),
    };
  },

  /**
   * 创建复数
   */
  fromPolar(magnitude: number, phase: number): Complex {
    return {
      real: magnitude * Math.cos(phase),
      imag: magnitude * Math.sin(phase),
    };
  },
};

// ─────────────────────────────────────────────────────────────────────
// 叠加态
// ─────────────────────────────────────────────────────────────────────

/**
 * 叠加态
 * 
 * |系统⟩ = |有为⟩ + e^(i*相位) * |无为⟩
 * 
 * 两种模式同时存在，不选择
 */
export interface SuperpositionState<TActing, TObserving> {
  /** 有为模式状态 |有为⟩ */
  acting: TActing;
  
  /** 无为模式状态 |无为⟩ */
  observing: TObserving;
  
  /** 相位差（决定干涉模式） */
  phase: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 量子叠加态（专门用于Complex振幅）
 */
export interface QuantumSuperpositionState extends SuperpositionState<Complex, Complex> {
  /** 有为模式概率 |有为|² */
  actingProbability: number;
  
  /** 无为模式概率 |无为|² */
  observingProbability: number;
  
  /** 相干性（两种模式的纠缠程度） */
  coherence: number;
}

/**
 * 叠加态构造器
 */
export function createSuperposition<TActing, TObserving>(
  acting: TActing,
  observing: TObserving,
  phase: number = Math.PI / 4
): SuperpositionState<TActing, TObserving> {
  return {
    acting,
    observing,
    phase,
    timestamp: Date.now(),
  };
}

/**
 * 创建Complex振幅叠加态（便捷函数）
 * 
 * 专门用于量子意识系统中的有为/无为模式叠加态
 */
export function createSuperpositionState(
  actingAmplitude: Complex,
  observingAmplitude: Complex,
  phase: number = Math.PI / 4
): QuantumSuperpositionState {
  // 计算概率
  const actingProbability = ComplexMath.norm(actingAmplitude);
  const observingProbability = ComplexMath.norm(observingAmplitude);
  
  // 归一化
  const total = actingProbability + observingProbability;
  const normalizedActing = total > 0 
    ? ComplexMath.multiply(actingAmplitude, { real: 1 / total, imag: 0 })
    : actingAmplitude;
  const normalizedObserving = total > 0 
    ? ComplexMath.multiply(observingAmplitude, { real: 1 / total, imag: 0 })
    : observingAmplitude;
  
  // 计算相干性
  const coherence = calculateCoherence(normalizedActing, normalizedObserving);
  
  return {
    acting: normalizedActing,
    observing: normalizedObserving,
    phase,
    timestamp: Date.now(),
    actingProbability: ComplexMath.norm(normalizedActing),
    observingProbability: ComplexMath.norm(normalizedObserving),
    coherence,
  };
}

/**
 * 计算相干性
 */
function calculateCoherence(acting: Complex, observing: Complex): number {
  // 简化：基于振幅的内积
  const innerProduct = acting.real * observing.real + acting.imag * observing.imag;
  const normA = ComplexMath.norm(acting);
  const normO = ComplexMath.norm(observing);
  
  if (normA === 0 || normO === 0) return 0;
  
  // 归一化内积作为相干性度量
  return Math.abs(innerProduct) / (normA * normO);
}

// ─────────────────────────────────────────────────────────────────────
// 干涉
// ─────────────────────────────────────────────────────────────────────

/**
 * 干涉类型
 */
export type InterferenceType = 'constructive' | 'destructive' | 'neutral';

/**
 * 干涉结果
 */
export interface InterferenceResult {
  /** 干涉后的振幅 */
  amplitude: Complex;
  
  /** 干涉类型 */
  type: InterferenceType;
  
  /** 干涉强度 */
  strength: number;
  
  /** 描述 */
  description: string;
}

/**
 * 计算干涉
 * 
 * |结果⟩ = |有为⟩ + e^(i*相位差) * |无为⟩
 */
export function calculateInterference(
  actingAmplitude: Complex,
  observingAmplitude: Complex,
  phaseDiff: number
): InterferenceResult {
  // |结果⟩ = |有为⟩ + e^(i*相位差) * |无为⟩
  const phaseFactor = ComplexMath.expi(phaseDiff);
  const shiftedObserving = ComplexMath.multiply(observingAmplitude, phaseFactor);
  const result = ComplexMath.add(actingAmplitude, shiftedObserving);
  
  // 计算干涉强度
  const actingMag = ComplexMath.magnitude(actingAmplitude);
  const observingMag = ComplexMath.magnitude(observingAmplitude);
  const resultMag = ComplexMath.magnitude(result);
  
  // 判断干涉类型
  const expectedMag = actingMag + observingMag;
  let type: InterferenceType;
  let description: string;
  
  if (resultMag > expectedMag * 0.9) {
    type = 'constructive';
    description = '相长干涉：有为和无为相互增强';
  } else if (resultMag < expectedMag * 0.5) {
    type = 'destructive';
    description = '相消干涉：有为和无为相互抵消';
  } else {
    type = 'neutral';
    description = '中性干涉：有为和无为部分叠加';
  }
  
  return {
    amplitude: result,
    type,
    strength: resultMag,
    description,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 坍缩
// ─────────────────────────────────────────────────────────────────────

/**
 * 坍缩结果
 */
export interface CollapseResult<T> {
  /** 坍缩后的状态 */
  state: T;
  
  /** 坍缩到的模式 */
  mode: 'acting' | 'observing' | 'interference';
  
  /** 置信度 */
  confidence: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 执行坍缩
 * 
 * 从叠加态坍缩到确定态
 * 不是"选择"，而是"自然坍缩"
 */
export function collapse<TActing, TObserving, TInterference>(
  superposition: SuperpositionState<TActing, TObserving>,
  actingAmplitude: Complex,
  observingAmplitude: Complex,
  createInterferenceState: (acting: TActing, observing: TObserving) => TInterference
): CollapseResult<TActing | TObserving | TInterference> {
  // 计算干涉
  const interference = calculateInterference(
    actingAmplitude,
    observingAmplitude,
    superposition.phase
  );
  
  // 计算各状态的概率
  const actingProb = ComplexMath.probability(actingAmplitude);
  const observingProb = ComplexMath.probability(observingAmplitude);
  const interferenceProb = ComplexMath.probability(interference.amplitude);
  
  // 归一化
  const total = actingProb + observingProb + interferenceProb;
  const normalizedActing = actingProb / total;
  const normalizedObserving = observingProb / total;
  const normalizedInterference = interferenceProb / total;
  
  // 随机坍缩（但由概率决定）
  const random = Math.random();
  
  if (random < normalizedActing) {
    return {
      state: superposition.acting,
      mode: 'acting',
      confidence: normalizedActing,
      timestamp: Date.now(),
    };
  } else if (random < normalizedActing + normalizedObserving) {
    return {
      state: superposition.observing,
      mode: 'observing',
      confidence: normalizedObserving,
      timestamp: Date.now(),
    };
  } else {
    return {
      state: createInterferenceState(superposition.acting, superposition.observing),
      mode: 'interference',
      confidence: normalizedInterference,
      timestamp: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 纠缠
// ─────────────────────────────────────────────────────────────────────

/**
 * 纠缠关联
 */
export interface EntanglementCorrelation {
  /** 关联ID */
  id: string;
  
  /** 关联类型 */
  type: 'state' | 'amplitude' | 'phase';
  
  /** 关联强度 */
  strength: number;
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 纠缠映射
 * 
 * 记录有为和无为状态之间的纠缠关系
 */
export interface EntanglementMap {
  /** 状态关联 */
  stateCorrelations: Map<string, EntanglementCorrelation>;
  
  /** 振幅关联 */
  amplitudeCorrelations: Map<string, EntanglementCorrelation>;
  
  /** 相位关联 */
  phaseCorrelations: Map<string, EntanglementCorrelation>;
}

/**
 * 创建空的纠缠映射
 */
export function createEntanglementMap(): EntanglementMap {
  return {
    stateCorrelations: new Map(),
    amplitudeCorrelations: new Map(),
    phaseCorrelations: new Map(),
  };
}

/**
 * 建立纠缠
 */
export function entangle(
  map: EntanglementMap,
  type: 'state' | 'amplitude' | 'phase',
  strength: number = 0.5
): string {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const correlation: EntanglementCorrelation = {
    id,
    type,
    strength,
    createdAt: Date.now(),
  };
  
  const targetMap = type === 'state' 
    ? map.stateCorrelations 
    : type === 'amplitude' 
      ? map.amplitudeCorrelations 
      : map.phaseCorrelations;
  
  targetMap.set(id, correlation);
  
  return id;
}

/**
 * 应用纠缠效应
 * 
 * 当测量了一方的状态，另一方会相应变化
 */
export function applyEntanglement<T>(
  state: T,
  correlation: EntanglementCorrelation
): T {
  // 简化实现：根据纠缠强度，状态会被"影响"
  // 在实际实现中，这里会有更复杂的逻辑
  return state;
}
