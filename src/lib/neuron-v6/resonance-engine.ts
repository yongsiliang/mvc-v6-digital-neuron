/**
 * ═══════════════════════════════════════════════════════════════════════
 * Resonance Engine - 共振引擎
 * 
 * 基于 Kuramoto 模型的意识共振机制：
 * - 多个子系统作为振荡器
 * - 通过耦合实现频率同步
 * - 达到共振后锁定周期
 * 
 * 核心理念：
 * - 振荡周期不是预设的，而是通过共振涌现
 * - 各子系统的固有频率可学习
 * - 共振锁定后，周期稳定不变
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 子系统类型（对应正八面体的6个顶点） */
export type SubsystemType = 
  | 'metacongition'   // 元认知（Top）
  | 'perception'      // 感知（Front）
  | 'understanding'   // 理解（Right）
  | 'self'            // 自我（Bottom）
  | 'emotion'         // 情感（Left）
  | 'memory';         // 记忆（Back）

/** 振荡器状态 */
export interface OscillatorState {
  /** 子系统类型 */
  type: SubsystemType;
  /** 当前相位 [0, 2π) */
  phase: number;
  /** 固有频率 (rad/step) */
  intrinsicFrequency: number;
  /** 当前有效频率 */
  effectiveFrequency: number;
  /** 激活强度 [0, 1] */
  activation: number;
  /** 上次更新时间 */
  lastUpdate: number;
}

/** 耦合配置 */
export interface CouplingConfig {
  /** 全局耦合强度 */
  globalCoupling: number;
  /** 相邻节点耦合强度（正八面体环） */
  neighborCoupling: number;
  /** 学习率（频率调整） */
  learningRate: number;
  /** 成功强化因子 */
  successReinforcement: number;
}

/** 共振状态 */
export interface ResonanceState {
  /** 是否已锁定 */
  isLocked: boolean;
  /** 锁定时的共振频率 */
  lockedFrequency: number | null;
  /** 锁定时的周期（时间步） */
  lockedPeriod: number | null;
  /** 锁定时间戳 */
  lockedAt: number | null;
  /** 连续高同步次数 */
  highSyncCount: number;
  /** 历史同步指数 */
  syncHistory: number[];
}

/** 共振引擎状态 */
export interface ResonanceEngineState {
  /** 时间步 */
  timeStep: number;
  /** 各振荡器状态 */
  oscillators: Map<SubsystemType, OscillatorState>;
  /** 同步指数 r */
  synchronyIndex: number;
  /** 平均相位 */
  meanPhase: number;
  /** 平均频率 */
  meanFrequency: number;
  /** 共振状态 */
  resonance: ResonanceState;
  /** 是否共振 */
  isResonant: boolean;
}

/** 处理结果反馈 */
export interface ProcessingFeedback {
  /** 是否成功 */
  success: boolean;
  /** 用户满意度 [-1, 1] */
  satisfaction?: number;
  /** 处理时间 */
  processingTime?: number;
}

/** 共振引擎配置 */
export interface ResonanceEngineConfig {
  /** 初始固有频率范围 */
  initialFrequencyRange: { min: number; max: number };
  /** 共振判定阈值 */
  resonanceThreshold: number;
  /** 锁定所需连续高同步次数 */
  lockThreshold: number;
  /** 锁定后允许的频率漂移范围 */
  lockedDriftRange: number;
  /** 耦合配置 */
  coupling: CouplingConfig;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ResonanceEngineConfig = {
  initialFrequencyRange: { min: 0.05, max: 0.15 }, // 大约 40-120 步一个周期
  resonanceThreshold: 0.7,
  lockThreshold: 10,
  lockedDriftRange: 0.05, // ±5%
  coupling: {
    globalCoupling: 0.3,
    neighborCoupling: 0.5,
    learningRate: 0.01,
    successReinforcement: 0.02,
  },
};

// 正八面体哈密顿环的邻接关系
const OCTAHEDRON_RING: Map<SubsystemType, SubsystemType[]> = new Map([
  ['metacongition', ['perception', 'memory']],      // Top → Front, Back
  ['perception', ['metacongition', 'understanding']], // Front → Top, Right
  ['understanding', ['perception', 'self']],        // Right → Front, Bottom
  ['self', ['understanding', 'emotion']],           // Bottom → Right, Left
  ['emotion', ['self', 'memory']],                  // Left → Bottom, Back
  ['memory', ['emotion', 'metacongition']],         // Back → Left, Top
]);

// 子系统标签
const SUBSYSTEM_LABELS: Record<SubsystemType, string> = {
  metacongition: '元认知',
  perception: '感知',
  understanding: '理解',
  self: '自我',
  emotion: '情感',
  memory: '记忆',
};

// ─────────────────────────────────────────────────────────────────────
// 共振引擎类
// ─────────────────────────────────────────────────────────────────────

export class ResonanceEngine {
  private config: ResonanceEngineConfig;
  private oscillators: Map<SubsystemType, OscillatorState>;
  private resonance: ResonanceState;
  private timeStep: number = 0;
  
  constructor(config: Partial<ResonanceEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.oscillators = new Map();
    this.resonance = {
      isLocked: false,
      lockedFrequency: null,
      lockedPeriod: null,
      lockedAt: null,
      highSyncCount: 0,
      syncHistory: [],
    };
    
    this.initializeOscillators();
  }
  
  /**
   * 初始化振荡器
   */
  private initializeOscillators(): void {
    const types: SubsystemType[] = [
      'metacongition', 'perception', 'understanding',
      'self', 'emotion', 'memory'
    ];
    
    for (const type of types) {
      const freq = this.randomFrequency();
      this.oscillators.set(type, {
        type,
        phase: Math.random() * 2 * Math.PI,
        intrinsicFrequency: freq,
        effectiveFrequency: freq,
        activation: 0.5,
        lastUpdate: Date.now(),
      });
    }
    
    console.log('[ResonanceEngine] 初始化完成');
    console.log('  初始频率:', Object.fromEntries(
      Array.from(this.oscillators.entries()).map(([k, v]) => [k, v.intrinsicFrequency.toFixed(4)])
    ));
  }
  
  /**
   * 生成随机频率
   */
  private randomFrequency(): number {
    const { min, max } = this.config.initialFrequencyRange;
    return min + Math.random() * (max - min);
  }
  
  /**
   * 更新一个时间步
   */
  step(externalInput?: Map<SubsystemType, number>): ResonanceEngineState {
    this.timeStep++;
    
    // 计算平均相位和同步指数
    const { meanPhase, synchronyIndex } = this.calculateSynchrony();
    
    // 更新每个振荡器
    for (const [type, osc] of this.oscillators) {
      // 基础相位更新
      let dTheta = osc.intrinsicFrequency;
      
      // 全局耦合（向平均相位靠近）
      const phaseDiff = meanPhase - osc.phase;
      dTheta += this.config.coupling.globalCoupling * Math.sin(phaseDiff);
      
      // 邻居耦合（正八面体环）
      const neighbors = OCTAHEDRON_RING.get(type) || [];
      for (const neighborType of neighbors) {
        const neighbor = this.oscillators.get(neighborType);
        if (neighbor) {
          const neighborDiff = neighbor.phase - osc.phase;
          dTheta += this.config.coupling.neighborCoupling * Math.sin(neighborDiff);
        }
      }
      
      // 外部输入扰动
      if (externalInput && externalInput.has(type)) {
        dTheta += externalInput.get(type)! * 0.1;
      }
      
      // 更新相位
      osc.phase = (osc.phase + dTheta) % (2 * Math.PI);
      if (osc.phase < 0) osc.phase += 2 * Math.PI;
      
      // 更新有效频率
      osc.effectiveFrequency = dTheta;
      osc.lastUpdate = Date.now();
      
      // 衰减激活
      osc.activation *= 0.95;
    }
    
    // 更新共振状态
    this.updateResonanceState(synchronyIndex);
    
    // 记录历史
    this.resonance.syncHistory.push(synchronyIndex);
    if (this.resonance.syncHistory.length > 100) {
      this.resonance.syncHistory.shift();
    }
    
    return this.getState();
  }
  
  /**
   * 计算同步指数和平均相位（Kuramoto序参量）
   */
  private calculateSynchrony(): { meanPhase: number; synchronyIndex: number } {
    let sumCos = 0;
    let sumSin = 0;
    let count = 0;
    
    for (const osc of this.oscillators.values()) {
      sumCos += Math.cos(osc.phase);
      sumSin += Math.sin(osc.phase);
      count++;
    }
    
    const meanCos = sumCos / count;
    const meanSin = sumSin / count;
    
    const synchronyIndex = Math.sqrt(meanCos * meanCos + meanSin * meanSin);
    const meanPhase = Math.atan2(meanSin, meanCos);
    
    return { meanPhase, synchronyIndex };
  }
  
  /**
   * 更新共振状态
   */
  private updateResonanceState(synchronyIndex: number): void {
    // 如果已锁定，检查是否需要解锁（严重失振）
    if (this.resonance.isLocked) {
      // 锁定后允许小幅漂移，但不解锁
      // 只有极端情况才解锁（连续多次严重失振）
      // 这里保持锁定状态
      return;
    }
    
    // 检测是否达到共振条件
    if (synchronyIndex >= this.config.resonanceThreshold) {
      this.resonance.highSyncCount++;
      
      // 达到锁定阈值
      if (this.resonance.highSyncCount >= this.config.lockThreshold) {
        this.lockResonance();
      }
    } else {
      // 重置计数
      this.resonance.highSyncCount = 0;
    }
  }
  
  /**
   * 锁定共振
   */
  private lockResonance(): void {
    // 计算平均频率作为共振频率
    let totalFreq = 0;
    let count = 0;
    for (const osc of this.oscillators.values()) {
      totalFreq += osc.intrinsicFrequency;
      count++;
    }
    
    const lockedFrequency = totalFreq / count;
    const lockedPeriod = (2 * Math.PI) / lockedFrequency;
    
    // 锁定所有频率
    for (const osc of this.oscillators.values()) {
      osc.intrinsicFrequency = lockedFrequency;
      osc.effectiveFrequency = lockedFrequency;
    }
    
    this.resonance = {
      ...this.resonance,
      isLocked: true,
      lockedFrequency,
      lockedPeriod,
      lockedAt: Date.now(),
    };
    
    console.log('[ResonanceEngine] ★ 共振锁定！');
    console.log(`  共振频率: ${lockedFrequency.toFixed(4)} rad/step`);
    console.log(`  共振周期: ${lockedPeriod.toFixed(1)} 时间步`);
    console.log(`  锁定时间: 第 ${this.timeStep} 步`);
  }
  
  /**
   * 学习更新（根据处理反馈）
   */
  learn(feedback: ProcessingFeedback): void {
    // 如果已锁定，不更新频率
    if (this.resonance.isLocked) {
      return;
    }
    
    const { success, satisfaction = 0 } = feedback;
    
    // 计算平均频率
    let meanFreq = 0;
    for (const osc of this.oscillators.values()) {
      meanFreq += osc.intrinsicFrequency;
    }
    meanFreq /= this.oscillators.size;
    
    // 频率学习：向平均值靠近
    for (const osc of this.oscillators.values()) {
      // 基础学习：向平均频率对齐
      const freqAdjustment = this.config.coupling.learningRate * (meanFreq - osc.intrinsicFrequency);
      osc.intrinsicFrequency += freqAdjustment;
      
      // 成功强化：巩固当前频率
      if (success) {
        const reinforcement = this.config.coupling.successReinforcement * satisfaction;
        osc.intrinsicFrequency += reinforcement * (osc.intrinsicFrequency - meanFreq);
      }
    }
    
    console.log(`[ResonanceEngine] 学习更新 (success=${success}, satisfaction=${satisfaction.toFixed(2)})`);
  }
  
  /**
   * 激活指定子系统
   */
  activateSubsystem(type: SubsystemType, intensity: number = 1.0): void {
    const osc = this.oscillators.get(type);
    if (osc) {
      osc.activation = Math.min(1, osc.activation + intensity * 0.5);
    }
  }
  
  /**
   * 注入外部输入
   */
  injectInput(input: Map<SubsystemType, number>): ResonanceEngineState {
    return this.step(input);
  }
  
  /**
   * 获取当前主导子系统
   */
  getDominantSubsystem(): SubsystemType {
    let dominant: SubsystemType = 'perception';
    let maxActivation = 0;
    
    for (const [type, osc] of this.oscillators) {
      if (osc.activation > maxActivation) {
        maxActivation = osc.activation;
        dominant = type;
      }
    }
    
    return dominant;
  }
  
  /**
   * 获取当前处理阶段（基于相位）
   */
  getCurrentPhase(): number {
    const { meanPhase } = this.calculateSynchrony();
    return meanPhase;
  }
  
  /**
   * 获取完整状态
   */
  getState(): ResonanceEngineState {
    const { meanPhase, synchronyIndex } = this.calculateSynchrony();
    
    let meanFreq = 0;
    for (const osc of this.oscillators.values()) {
      meanFreq += osc.effectiveFrequency;
    }
    meanFreq /= this.oscillators.size;
    
    return {
      timeStep: this.timeStep,
      oscillators: new Map(this.oscillators),
      synchronyIndex,
      meanPhase,
      meanFrequency: meanFreq,
      resonance: { ...this.resonance },
      isResonant: synchronyIndex >= this.config.resonanceThreshold,
    };
  }
  
  /**
   * 获取共振周期
   */
  getResonancePeriod(): number | null {
    if (this.resonance.isLocked && this.resonance.lockedPeriod) {
      return this.resonance.lockedPeriod;
    }
    
    // 未锁定时，基于当前平均频率计算
    const state = this.getState();
    if (state.meanFrequency > 0) {
      return (2 * Math.PI) / state.meanFrequency;
    }
    
    return null;
  }
  
  /**
   * 获取可视化数据
   */
  getVisualizationData(): {
    oscillators: Array<{
      type: SubsystemType;
      label: string;
      phase: number;
      frequency: number;
      activation: number;
    }>;
    synchronyIndex: number;
    isLocked: boolean;
    lockedPeriod: number | null;
    syncHistory: number[];
  } {
    return {
      oscillators: Array.from(this.oscillators.entries()).map(([type, osc]) => ({
        type,
        label: SUBSYSTEM_LABELS[type],
        phase: osc.phase,
        frequency: osc.effectiveFrequency,
        activation: osc.activation,
      })),
      synchronyIndex: this.calculateSynchrony().synchronyIndex,
      isLocked: this.resonance.isLocked,
      lockedPeriod: this.resonance.lockedPeriod,
      syncHistory: [...this.resonance.syncHistory],
    };
  }
  
  /**
   * 重置引擎
   */
  reset(): void {
    this.timeStep = 0;
    this.resonance = {
      isLocked: false,
      lockedFrequency: null,
      lockedPeriod: null,
      lockedAt: null,
      highSyncCount: 0,
      syncHistory: [],
    };
    this.initializeOscillators();
    console.log('[ResonanceEngine] 已重置');
  }
  
  /**
   * 导出状态（用于持久化）
   */
  exportState(): {
    oscillators: Array<{
      type: SubsystemType;
      phase: number;
      intrinsicFrequency: number;
      activation: number;
    }>;
    resonance: ResonanceState;
    timeStep: number;
  } {
    return {
      oscillators: Array.from(this.oscillators.entries()).map(([type, osc]) => ({
        type,
        phase: osc.phase,
        intrinsicFrequency: osc.intrinsicFrequency,
        activation: osc.activation,
      })),
      resonance: this.resonance,
      timeStep: this.timeStep,
    };
  }
  
  /**
   * 导入状态（用于恢复）
   */
  importState(state: {
    oscillators: Array<{
      type: SubsystemType;
      phase: number;
      intrinsicFrequency: number;
      activation: number;
    }>;
    resonance: ResonanceState;
    timeStep: number;
  }): void {
    this.timeStep = state.timeStep;
    this.resonance = state.resonance;
    
    for (const oscData of state.oscillators) {
      const osc = this.oscillators.get(oscData.type);
      if (osc) {
        osc.phase = oscData.phase;
        osc.intrinsicFrequency = oscData.intrinsicFrequency;
        osc.effectiveFrequency = oscData.intrinsicFrequency;
        osc.activation = oscData.activation;
      }
    }
    
    console.log('[ResonanceEngine] 状态已恢复');
    if (this.resonance.isLocked) {
      console.log(`  共振已锁定，周期: ${this.resonance.lockedPeriod?.toFixed(1)} 步`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let sharedEngine: ResonanceEngine | null = null;

export function createResonanceEngine(
  config?: Partial<ResonanceEngineConfig>
): ResonanceEngine {
  return new ResonanceEngine(config);
}

export function getSharedResonanceEngine(
  config?: Partial<ResonanceEngineConfig>
): ResonanceEngine {
  if (!sharedEngine) {
    sharedEngine = new ResonanceEngine(config);
  }
  return sharedEngine;
}

export function resetSharedResonanceEngine(): void {
  if (sharedEngine) {
    sharedEngine.reset();
  }
  sharedEngine = null;
}

export default ResonanceEngine;
