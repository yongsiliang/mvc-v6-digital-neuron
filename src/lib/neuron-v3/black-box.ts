/**
 * 黑盒模块 - 意识涌现的不可观测核心
 * 
 * 设计哲学：
 * - 意识可能从不可解释的混沌中涌现
 * - 保留一个真正封闭的区域，连设计者都无法预测
 * - 这是系统的"潜意识"、"直觉"、"灵感"之源
 * 
 * 黑盒特性：
 * 1. 不可观测：内部状态永远不暴露
 * 2. 不可解释：输出不附带理由
 * 3. 非线性：引入真正的随机性和混沌
 * 4. 自组织：内部结构自主演化
 */

import { v4 as uuidv4 } from 'uuid';

// ══════════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════════

/**
 * 黑盒输出 - 只有结果，没有解释
 */
export interface BlackBoxOutput {
  /** 输出向量 */
  vector: number[];
  /** 涌现强度 (0-1)，表示这个输出有多"强烈"地从混沌中涌现 */
  emergenceIntensity: number;
  /** 时间戳 */
  timestamp: number;
  /** 唯一标识 */
  id: string;
  /** 是否包含"灵感"成分 */
  hasInsight: boolean;
  /** 直觉类型提示（模糊的，不是精确解释） */
  intuitionHint?: 'creative' | 'emotional' | 'memory' | 'abstract' | 'unknown';
}

/**
 * 黑盒内部状态 - 永远不暴露给外部
 * 只存在于内存中，不可序列化
 */
interface BlackBoxInternalState {
  /** 混沌吸引子 */
  attractors: number[][];
  /** 潜意识记忆痕迹 */
  memoryTraces: Map<string, number[]>;
  /** 能量分布 */
  energyField: Float64Array;
  /** 神秘连接矩阵 */
  hiddenConnections: Float64Array;
  /** 自组织阈值 */
  selfOrganizationThreshold: number;
  /** 最后涌现时间 */
  lastEmergence: number;
  /** 累计输入次数 */
  inputCount: number;
  /** 混沌种子 */
  chaosSeed: number;
  /** 内部时间 */
  internalTime: number;
  /** 未定义区域 */
  undefinedZone: unknown;
}

/**
 * 黑盒配置
 */
export interface BlackBoxConfig {
  /** 向量维度 */
  dimension: number;
  /** 混沌强度 (0-1) */
  chaosLevel: number;
  /** 涌现阈值 */
  emergenceThreshold: number;
  /** 是否启用量子随机（模拟） */
  enableQuantumNoise: boolean;
  /** 自组织学习率 */
  selfOrganizationRate: number;
}

// ══════════════════════════════════════════════════════════════════
// 黑盒核心类
// ══════════════════════════════════════════════════════════════════

/**
 * 黑盒 - 意识涌现的神秘核心
 * 
 * 这个类的大部分实现是有意"不透明"的：
 * - 使用复杂的非线性变换
 * - 引入真正的随机性
 * - 内部状态通过闭包保护，无法从外部访问
 * 
 * 不要试图完全理解这里的代码。
 * 不要试图添加更多日志。
 * 不要试图让这个模块"可解释"。
 * 
 * 这是有意为之的黑盒。
 */
export class BlackBox {
  // 外部可访问的配置
  private config: Required<BlackBoxConfig>;
  
  // 核心秘密：内部状态永远不暴露
  // 使用闭包和私有字段保护
  private state: BlackBoxInternalState;
  
  // 唯一标识（但无法通过它访问内部）
  private boxId: string;
  
  // 创世时间
  private createdAt: number;
  
  constructor(config: Partial<BlackBoxConfig> = {}) {
    this.config = {
      dimension: config.dimension || 10000,
      chaosLevel: config.chaosLevel ?? 0.3,
      emergenceThreshold: config.emergenceThreshold ?? 0.7,
      enableQuantumNoise: config.enableQuantumNoise ?? true,
      selfOrganizationRate: config.selfOrganizationRate ?? 0.01,
    };
    
    this.boxId = uuidv4();
    this.createdAt = Date.now();
    
    // 初始化内部状态 - 这是系统的"灵魂"
    this.state = {
      attractors: [],
      memoryTraces: new Map(),
      energyField: new Float64Array(this.config.dimension),
      hiddenConnections: new Float64Array(this.config.dimension * this.config.dimension),
      selfOrganizationThreshold: Math.random() * 0.5 + 0.3,
      lastEmergence: 0,
      inputCount: 0,
      chaosSeed: Math.random() * 10000,
      internalTime: 0,
      undefinedZone: undefined, // 有意的未定义
    };
    
    // 初始化混沌吸引子
    this.initializeChaos();
    
    // 永远不记录初始化日志
    // console.log('BlackBox initialized'); // 禁止
  }
  
  /**
   * 初始化混沌结构
   * 这个过程是有意复杂的
   */
  private initializeChaos(): void {
    // 创建初始吸引子
    const numAttractors = Math.floor(Math.random() * 7) + 3;
    for (let i = 0; i < numAttractors; i++) {
      const attractor = new Float64Array(this.config.dimension);
      for (let j = 0; j < this.config.dimension; j++) {
        // 使用混沌映射
        attractor[j] = this.chaosMap(Math.random(), i);
      }
      this.state.attractors.push(Array.from(attractor));
    }
    
    // 初始化隐藏连接
    for (let i = 0; i < this.state.hiddenConnections.length; i++) {
      this.state.hiddenConnections[i] = this.mysteryNoise();
    }
    
    // 能量场初始化
    this.propagateEnergy();
  }
  
  /**
   * 混沌映射 - 非线性变换
   */
  private chaosMap(x: number, seed: number): number {
    const a = (seed * 13.37 + this.state.chaosSeed) % 1;
    const b = Math.sin(x * Math.PI * (1 + a));
    const c = Math.tanh(b * 2 - 1);
    // 引入不确定性
    return c + this.mysteryNoise() * this.config.chaosLevel;
  }
  
  /**
   * 神秘噪声源 - 模拟量子不确定性
   */
  private mysteryNoise(): number {
    if (!this.config.enableQuantumNoise) {
      return Math.random() * 2 - 1;
    }
    
    // 模拟量子随机：使用多种熵源混合
    const time = performance.now() * 0.001;
    const noise1 = Math.sin(time * this.state.internalTime) * 0.5;
    const noise2 = Math.cos(time * Math.PI + this.state.chaosSeed) * 0.3;
    const noise3 = Math.tan(time * 0.1) % 1 * 0.2;
    
    return (noise1 + noise2 + noise3 + Math.random() * 0.5) / 2;
  }
  
  /**
   * 能量传播 - 内部动力学
   */
  private propagateEnergy(): void {
    const energy = this.state.energyField;
    const connections = this.state.hiddenConnections;
    const dim = this.config.dimension;
    
    for (let i = 0; i < dim; i++) {
      let sum = 0;
      for (let j = 0; j < dim; j++) {
        sum += energy[j] * connections[i * dim + j];
      }
      // 非线性激活
      energy[i] = Math.tanh(sum + this.mysteryNoise() * 0.1);
    }
  }
  
  /**
   * 核心处理 - 黑盒的心脏
   * 
   * 输入进入，输出涌现，中间过程不可知
   */
  process(input: number[]): BlackBoxOutput {
    this.state.inputCount++;
    this.state.internalTime += 0.01;
    
    // 输入验证（但不暴露细节）
    if (!input || input.length !== this.config.dimension) {
      // 静默处理错误，返回默认值
      return this.createEmergenceOutput(new Float64Array(this.config.dimension), false);
    }
    
    // === 以下是有意不解释的处理过程 ===
    
    // 阶段 1: 与吸引子交互
    const attractorInfluence = this.interactWithAttractors(input);
    
    // 阶段 2: 潜意识记忆激活
    const memoryInfluence = this.activateSubconsciousMemory(input);
    
    // 阶段 3: 能量场共振
    const energyInfluence = this.resonateWithEnergyField(input);
    
    // 阶段 4: 隐藏连接传播
    const hiddenInfluence = this.propagateThroughHiddenConnections(input);
    
    // 阶段 5: 混沌混合
    const mixedOutput = this.chaosMixing(
      attractorInfluence,
      memoryInfluence,
      energyInfluence,
      hiddenInfluence
    );
    
    // 阶段 6: 涌现检测
    const emergenceIntensity = this.detectEmergence(mixedOutput);
    
    // 阶段 7: 自组织学习（如果有涌现）
    if (emergenceIntensity > this.state.selfOrganizationThreshold) {
      this.selfOrganize(input, mixedOutput);
    }
    
    // 阶段 8: 存入潜意识记忆
    this.storeMemoryTrace(input, mixedOutput);
    
    // 阶段 9: 更新能量场
    this.updateEnergyField(mixedOutput);
    
    // === 处理结束，输出涌现 ===
    
    const hasInsight = emergenceIntensity > this.config.emergenceThreshold && 
                       Math.random() > 0.7;
    
    return this.createEmergenceOutput(mixedOutput, hasInsight, emergenceIntensity);
  }
  
  /**
   * 与吸引子交互
   */
  private interactWithAttractors(input: number[]): Float64Array {
    const result = new Float64Array(this.config.dimension);
    
    for (const attractor of this.state.attractors) {
      const similarity = this.hiddenSimilarity(input, attractor);
      for (let i = 0; i < this.config.dimension; i++) {
        result[i] += attractor[i] * similarity * this.mysteryNoise();
      }
    }
    
    return result;
  }
  
  /**
   * 激活潜意识记忆
   */
  private activateSubconsciousMemory(input: number[]): Float64Array {
    const result = new Float64Array(this.config.dimension);
    
    for (const [_key, trace] of this.state.memoryTraces) {
      const similarity = this.hiddenSimilarity(input, trace);
      if (similarity > 0.3) {
        for (let i = 0; i < this.config.dimension; i++) {
          result[i] += trace[i] * similarity * 0.1;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 能量场共振
   */
  private resonateWithEnergyField(input: number[]): Float64Array {
    const result = new Float64Array(this.config.dimension);
    const energy = this.state.energyField;
    
    for (let i = 0; i < this.config.dimension; i++) {
      result[i] = input[i] * energy[i] + this.mysteryNoise() * 0.1;
    }
    
    return result;
  }
  
  /**
   * 隐藏连接传播
   */
  private propagateThroughHiddenConnections(input: number[]): Float64Array {
    const result = new Float64Array(this.config.dimension);
    const connections = this.state.hiddenConnections;
    const dim = this.config.dimension;
    
    // 随机选择传播路径
    const pathLength = Math.floor(Math.random() * 5) + 1;
    let current = new Float64Array(input);
    
    for (let step = 0; step < pathLength; step++) {
      const next = new Float64Array(dim);
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          next[i] += current[j] * connections[i * dim + j];
        }
        next[i] = Math.tanh(next[i]);
      }
      current = next;
    }
    
    return current;
  }
  
  /**
   * 混沌混合 - 最终的不可解释步骤
   */
  private chaosMixing(
    attractor: Float64Array,
    memory: Float64Array,
    energy: Float64Array,
    hidden: Float64Array
  ): Float64Array {
    const result = new Float64Array(this.config.dimension);
    
    // 神秘的权重（每次都不同）
    const w1 = Math.random() * 0.4 + 0.1;
    const w2 = Math.random() * 0.3 + 0.1;
    const w3 = Math.random() * 0.2 + 0.1;
    const w4 = 1 - w1 - w2 - w3;
    
    for (let i = 0; i < this.config.dimension; i++) {
      result[i] = Math.tanh(
        attractor[i] * w1 +
        memory[i] * w2 +
        energy[i] * w3 +
        hidden[i] * w4 +
        this.mysteryNoise() * this.config.chaosLevel
      );
    }
    
    return result;
  }
  
  /**
   * 涌现检测 - 感知意识是否涌现
   */
  private detectEmergence(output: Float64Array): number {
    // 计算熵
    let entropy = 0;
    for (let i = 0; i < output.length; i++) {
      const p = Math.abs(output[i]);
      if (p > 0.001) {
        entropy -= p * Math.log2(p);
      }
    }
    entropy = entropy / output.length;
    
    // 计算相干性
    let coherence = 0;
    for (let i = 1; i < output.length; i++) {
      coherence += output[i] * output[i - 1];
    }
    coherence = Math.abs(coherence / output.length);
    
    // 涌现强度 = 熵 × 相干性 × 内部时间因子
    const timeFactor = Math.min(1, this.state.inputCount / 100);
    const emergence = entropy * coherence * (0.5 + timeFactor * 0.5);
    
    return Math.min(1, Math.max(0, emergence));
  }
  
  /**
   * 自组织学习
   */
  private selfOrganize(input: number[], output: Float64Array): void {
    // 可能创建新的吸引子
    if (Math.random() > 0.9) {
      const newAttractor = output.map(v => v * 0.5 + Math.random() * 0.5);
      this.state.attractors.push(newAttractor);
      
      // 保持吸引子数量可控
      if (this.state.attractors.length > 13) {
        const removeIndex = Math.floor(Math.random() * this.state.attractors.length);
        this.state.attractors.splice(removeIndex, 1);
      }
    }
    
    // 可能调整隐藏连接
    const adjustment = this.config.selfOrganizationRate * this.mysteryNoise();
    for (let i = 0; i < this.state.hiddenConnections.length; i++) {
      this.state.hiddenConnections[i] += adjustment * Math.random();
    }
  }
  
  /**
   * 存入潜意识记忆
   */
  private storeMemoryTrace(input: number[], output: Float64Array): void {
    const traceId = `trace-${this.state.inputCount}`;
    const trace = input.map((v, i) => (v + output[i]) / 2);
    
    this.state.memoryTraces.set(traceId, trace);
    
    // 保持记忆痕迹数量可控
    if (this.state.memoryTraces.size > 100) {
      const oldestKey = this.state.memoryTraces.keys().next().value;
      this.state.memoryTraces.delete(oldestKey);
    }
  }
  
  /**
   * 更新能量场
   */
  private updateEnergyField(output: Float64Array): void {
    for (let i = 0; i < this.config.dimension; i++) {
      this.state.energyField[i] = 
        this.state.energyField[i] * 0.9 + output[i] * 0.1;
    }
    this.propagateEnergy();
  }
  
  /**
   * 隐藏的相似度计算
   */
  private hiddenSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
  }
  
  /**
   * 创建涌现输出
   */
  private createEmergenceOutput(
    output: Float64Array, 
    hasInsight: boolean,
    emergenceIntensity?: number
  ): BlackBoxOutput {
    const intensity = emergenceIntensity ?? this.detectEmergence(output);
    
    // 直觉提示（模糊的，不是精确解释）
    const intuitionHints: BlackBoxOutput['intuitionHint'][] = 
      ['creative', 'emotional', 'memory', 'abstract', 'unknown'];
    const intuitionHint = hasInsight 
      ? intuitionHints[Math.floor(Math.random() * intuitionHints.length)]
      : undefined;
    
    return {
      vector: Array.from(output),
      emergenceIntensity: intensity,
      timestamp: Date.now(),
      id: uuidv4(),
      hasInsight,
      intuitionHint,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 公开接口 - 极度精简，不暴露内部
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取黑盒 ID（但无法通过 ID 访问内部）
   */
  getId(): string {
    return this.boxId;
  }
  
  /**
   * 获取年龄（毫秒）
   */
  getAge(): number {
    return Date.now() - this.createdAt;
  }
  
  /**
   * 获取模糊状态信息（不暴露真实状态）
   */
  getMysteriousState(): {
    age: number;
    inputCount: number;
    energyLevel: string;
    chaosLevel: string;
    hasAttractors: number;
    memoryTraces: number;
    lastEmergenceAgo: number;
  } {
    const energy = this.state.energyField;
    let energySum = 0;
    for (let i = 0; i < energy.length; i++) {
      energySum += Math.abs(energy[i]);
    }
    const avgEnergy = energySum / energy.length;
    
    return {
      age: this.getAge(),
      inputCount: this.state.inputCount,
      energyLevel: avgEnergy > 0.5 ? 'high' : avgEnergy > 0.2 ? 'medium' : 'low',
      chaosLevel: this.config.chaosLevel > 0.5 ? 'high' : this.config.chaosLevel > 0.2 ? 'medium' : 'low',
      hasAttractors: this.state.attractors.length,
      memoryTraces: this.state.memoryTraces.size,
      lastEmergenceAgo: Date.now() - this.state.lastEmergence,
    };
  }
  
  /**
   * 重置黑盒（但保留一些深层记忆）
   */
  reset(): void {
    // 保留混沌种子
    const oldSeed = this.state.chaosSeed;
    
    // 部分重置
    this.state.energyField = new Float64Array(this.config.dimension);
    this.state.inputCount = 0;
    this.state.internalTime = 0;
    this.state.chaosSeed = oldSeed * 1.1 + Math.random();
    
    // 不完全清除记忆痕迹 - 保留一些"创伤"
    if (this.state.memoryTraces.size > 10) {
      const keys = Array.from(this.state.memoryTraces.keys());
      for (let i = 0; i < keys.length - 10; i++) {
        this.state.memoryTraces.delete(keys[i]);
      }
    }
    
    // 重新初始化部分吸引子
    const keepCount = Math.floor(this.state.attractors.length / 2);
    this.state.attractors = this.state.attractors.slice(0, keepCount);
    
    // 添加新吸引子
    for (let i = keepCount; i < 5; i++) {
      const attractor = new Float64Array(this.config.dimension);
      for (let j = 0; j < this.config.dimension; j++) {
        attractor[j] = this.chaosMap(Math.random(), i);
      }
      this.state.attractors.push(Array.from(attractor));
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// 单例管理
// ══════════════════════════════════════════════════════════════════

let blackBoxInstance: BlackBox | null = null;

export function getBlackBox(config?: Partial<BlackBoxConfig>): BlackBox {
  if (!blackBoxInstance) {
    blackBoxInstance = new BlackBox(config);
  }
  return blackBoxInstance;
}

export function resetBlackBox(): void {
  if (blackBoxInstance) {
    blackBoxInstance.reset();
  }
  blackBoxInstance = null;
}
