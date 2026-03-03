/**
 * ═══════════════════════════════════════════════════════════════════════
 * 状态空间模型 (State Space Model - SSM) 核心层
 * 
 * 核心理念：
 * - 将无限历史压缩到固定维度状态
 * - 实现长期依赖而无需增长上下文
 * - 线性复杂度O(N) vs Transformer的O(N²)
 * 
 * 数学基础：
 * 连续时间：h'(t) = Ah(t) + Bx(t)
 *           y(t) = Ch(t) + Dx(t)
 * 
 * 离散化后：h_t = Āh_{t-1} + B̄x_t
 *           y_t = Ch_t + Dx_t
 * 
 * 黑盒特性：
 * - 状态h是隐式向量，外部无法解析
 * - 矩阵A,B,C,D通过DE-RL学习
 * - 计算过程不可观察
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * SSM配置
 */
export interface SSMConfig {
  /** 状态维度 (N) */
  stateDimension: number;
  
  /** 输入维度 (D_in) */
  inputDimension: number;
  
  /** 输出维度 (D_out) */
  outputDimension: number;
  
  /** 是否使用选择性机制 */
  useSelective: boolean;
  
  /** 离散化步长 (Δ) */
  delta: number;
  
  /** 是否启用混沌混淆 */
  enableChaos: boolean;
  
  /** 混沌强度 */
  chaosIntensity: number;
}

const DEFAULT_SSM_CONFIG: SSMConfig = {
  stateDimension: 256,
  inputDimension: 256,
  outputDimension: 256,
  useSelective: true,
  delta: 0.001,
  enableChaos: true,
  chaosIntensity: 0.05,
};

/**
 * SSM状态
 */
export interface SSMState {
  /** 隐式状态向量 h ∈ R^N */
  h: Float32Array;
  
  /** 时间步 */
  timestep: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 状态ID */
  id: string;
}

/**
 * 选择性参数（Input-Dependent Dynamics）
 */
export interface SelectiveParams {
  /** 输入依赖的B参数 */
  B_delta: Float32Array;
  
  /** 输入依赖的C参数 */
  C_delta: Float32Array;
  
  /** 输入依赖的Δ参数 */
  delta_dynamic: Float32Array;
}

/**
 * SSM输出
 */
export interface SSMOutput {
  /** 输出向量 y ∈ R^{D_out} */
  y: Float32Array;
  
  /** 更新后的状态 */
  newState: SSMState;
  
  /** 是否触发外部调用（选择性机制） */
  triggerExternal: boolean;
  
  /** 置信度 */
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────
// SSM核心实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 状态空间模型核心
 * 
 * 实现 Mamba 风格的选择性状态空间模型
 */
export class SSMLayer {
  private config: SSMConfig;
  
  // 核心矩阵（离散化后）
  private A_bar: Float32Array;  // N×N 状态转移矩阵
  private B_bar: Float32Array;  // N×D_in 输入投影矩阵
  private C: Float32Array;      // D_out×N 输出投影矩阵
  private D: Float32Array;      // D_out×D_in 跳跃连接矩阵
  
  // 选择性参数投影
  private W_B: Float32Array;    // 投影到B_delta
  private W_C: Float32Array;    // 投影到C_delta
  private W_delta: Float32Array; // 投影到delta_dynamic
  
  // 当前状态
  private currentState: SSMState;
  
  // 统计
  private stats: {
    totalSteps: number;
    externalTriggers: number;
    avgStateNorm: number;
  };
  
  constructor(config?: Partial<SSMConfig>) {
    this.config = { ...DEFAULT_SSM_CONFIG, ...config };
    
    const { stateDimension: N, inputDimension: D_in, outputDimension: D_out } = this.config;
    
    // 初始化矩阵（HiPPO初始化用于A）
    this.A_bar = this.initHiPPOMatrix(N);
    this.B_bar = this.initRandomMatrix(N, D_in);
    this.C = this.initRandomMatrix(D_out, N);
    this.D = this.initRandomMatrix(D_out, D_in);
    
    // 选择性参数投影
    this.W_B = this.initRandomMatrix(N, D_in);
    this.W_C = this.initRandomMatrix(D_out, N);
    this.W_delta = this.initRandomMatrix(N, 1);
    
    // 初始化状态
    this.currentState = this.createEmptyState();
    
    // 初始化统计
    this.stats = {
      totalSteps: 0,
      externalTriggers: 0,
      avgStateNorm: 0,
    };
  }
  
  /**
   * 前向传播
   * 
   * 输入x_t，更新状态h_t，输出y_t
   */
  forward(x: Float32Array): SSMOutput {
    const { stateDimension: N, outputDimension: D_out, useSelective, enableChaos, chaosIntensity } = this.config;
    
    // ─── Step 1: 计算选择性参数（如果启用） ───
    let B_t: Float32Array;
    let C_t: Float32Array;
    let delta_t = this.config.delta;
    
    if (useSelective) {
      const selective = this.computeSelectiveParams(x);
      B_t = this.applySelectiveB(selective.B_delta);
      C_t = this.applySelectiveC(selective.C_delta);
      delta_t = this.computeDynamicDelta(selective.delta_dynamic);
    } else {
      B_t = this.B_bar;
      C_t = this.C;
    }
    
    // ─── Step 2: 状态更新 ───
    // h_t = A_bar * h_{t-1} + B_t * x_t
    const h_new = new Float32Array(N);
    
    // A_bar * h_{t-1}
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < N; j++) {
        sum += this.A_bar[i * N + j] * this.currentState.h[j];
      }
      h_new[i] = sum;
    }
    
    // + B_t * x_t
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < x.length; j++) {
        sum += B_t[i * x.length + j] * x[j];
      }
      h_new[i] += sum;
    }
    
    // 注入混沌（黑盒特性）
    if (enableChaos && chaosIntensity > 0) {
      for (let i = 0; i < N; i++) {
        h_new[i] += (Math.random() * 2 - 1) * chaosIntensity;
      }
    }
    
    // ─── Step 3: 计算输出 ───
    // y_t = C_t * h_t + D * x_t
    const y = new Float32Array(D_out);
    
    // C_t * h_t
    for (let i = 0; i < D_out; i++) {
      let sum = 0;
      for (let j = 0; j < N; j++) {
        sum += C_t[i * N + j] * h_new[j];
      }
      y[i] = sum;
    }
    
    // + D * x_t
    for (let i = 0; i < D_out; i++) {
      let sum = 0;
      for (let j = 0; j < x.length; j++) {
        sum += this.D[i * x.length + j] * x[j];
      }
      y[i] += sum;
    }
    
    // ─── Step 4: 更新状态 ───
    const newState: SSMState = {
      h: h_new,
      timestep: this.currentState.timestep + 1,
      createdAt: Date.now(),
      id: this.generateId(),
    };
    
    this.currentState = newState;
    
    // ─── Step 5: 判断是否触发外部调用 ───
    const stateNorm = this.computeNorm(h_new);
    const triggerExternal = this.shouldTriggerExternal(stateNorm, y);
    const confidence = this.computeConfidence(y);
    
    // 更新统计
    this.stats.totalSteps++;
    if (triggerExternal) {
      this.stats.externalTriggers++;
    }
    this.stats.avgStateNorm = (this.stats.avgStateNorm * (this.stats.totalSteps - 1) + stateNorm) 
                              / this.stats.totalSteps;
    
    return {
      y,
      newState,
      triggerExternal,
      confidence,
    };
  }
  
  /**
   * 批量处理序列
   * 
   * 输入序列，输出序列，最终状态
   */
  processSequence(x_sequence: Float32Array[]): {
    outputs: Float32Array[];
    finalState: SSMState;
    externalTriggers: number[];
  } {
    const outputs: Float32Array[] = [];
    const externalTriggers: number[] = [];
    
    for (let t = 0; t < x_sequence.length; t++) {
      const output = this.forward(x_sequence[t]);
      outputs.push(output.y);
      
      if (output.triggerExternal) {
        externalTriggers.push(t);
      }
    }
    
    return {
      outputs,
      finalState: this.currentState,
      externalTriggers,
    };
  }
  
  /**
   * 重置状态
   */
  reset(): void {
    this.currentState = this.createEmptyState();
  }
  
  /**
   * 从基因组更新权重（DE-RL优化）
   */
  updateFromGenome(genome: Float32Array): void {
    // 基因组结构：
    // [A_bar | B_bar | C | D | W_B | W_C | W_delta]
    const { stateDimension: N, inputDimension: D_in, outputDimension: D_out } = this.config;
    
    let offset = 0;
    
    // A_bar: N×N
    const A_size = N * N;
    this.A_bar.set(genome.slice(offset, offset + A_size));
    offset += A_size;
    
    // B_bar: N×D_in
    const B_size = N * D_in;
    this.B_bar.set(genome.slice(offset, offset + B_size));
    offset += B_size;
    
    // C: D_out×N
    const C_size = D_out * N;
    this.C.set(genome.slice(offset, offset + C_size));
    offset += C_size;
    
    // D: D_out×D_in
    const D_size = D_out * D_in;
    this.D.set(genome.slice(offset, offset + D_size));
    offset += D_size;
    
    // W_B: N×D_in
    this.W_B.set(genome.slice(offset, offset + B_size));
    offset += B_size;
    
    // W_C: D_out×N
    this.W_C.set(genome.slice(offset, offset + C_size));
    offset += C_size;
    
    // W_delta: N×1
    this.W_delta.set(genome.slice(offset, offset + N));
  }
  
  /**
   * 导出为基因组（DE-RL优化）
   */
  exportToGenome(): Float32Array {
    const { stateDimension: N, inputDimension: D_in, outputDimension: D_out } = this.config;
    
    const totalSize = 
      N * N +           // A_bar
      N * D_in +        // B_bar
      D_out * N +       // C
      D_out * D_in +    // D
      N * D_in +        // W_B
      D_out * N +       // W_C
      N;                // W_delta
    
    const genome = new Float32Array(totalSize);
    let offset = 0;
    
    genome.set(this.A_bar, offset); offset += N * N;
    genome.set(this.B_bar, offset); offset += N * D_in;
    genome.set(this.C, offset); offset += D_out * N;
    genome.set(this.D, offset); offset += D_out * D_in;
    genome.set(this.W_B, offset); offset += N * D_in;
    genome.set(this.W_C, offset); offset += D_out * N;
    genome.set(this.W_delta, offset);
    
    return genome;
  }
  
  /**
   * 获取当前状态
   */
  getCurrentState(): SSMState {
    return this.currentState;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 初始化HiPPO矩阵
   * 
   * 用于捕获长程依赖的特殊初始化
   */
  private initHiPPOMatrix(N: number): Float32Array {
    const A = new Float32Array(N * N);
    
    // HiPPO-LegS 初始化
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i > j) {
          A[i * N + j] = -((2 * i + 1) ** 0.5) * ((2 * j + 1) ** 0.5);
        } else if (i === j) {
          A[i * N + j] = -(2 * i + 1);
        } else {
          A[i * N + j] = 0;
        }
      }
    }
    
    // 离散化：A_bar = exp(Δ * A)
    const delta = this.config.delta;
    for (let i = 0; i < N * N; i++) {
      A[i] = Math.exp(delta * A[i]);
    }
    
    return A;
  }
  
  /**
   * 初始化随机矩阵（Xavier初始化）
   */
  private initRandomMatrix(rows: number, cols: number): Float32Array {
    const matrix = new Float32Array(rows * cols);
    const scale = Math.sqrt(2.0 / (rows + cols));
    
    for (let i = 0; i < matrix.length; i++) {
      matrix[i] = (Math.random() * 2 - 1) * scale;
    }
    
    return matrix;
  }
  
  /**
   * 计算选择性参数
   */
  private computeSelectiveParams(x: Float32Array): SelectiveParams {
    const { stateDimension: N, outputDimension: D_out } = this.config;
    
    // B_delta = W_B * x
    const B_delta = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < x.length; j++) {
        sum += this.W_B[i * x.length + j] * x[j];
      }
      B_delta[i] = Math.tanh(sum);  // 激活函数
    }
    
    // C_delta = W_C * x
    const C_delta = new Float32Array(D_out * N);
    for (let i = 0; i < D_out * N; i++) {
      // 简化：用x的线性投影
      const idx = i % x.length;
      C_delta[i] = this.W_C[i] * x[idx];
    }
    
    // delta_dynamic = softplus(W_delta * x)
    const delta_dynamic = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < x.length; j++) {
        sum += this.W_delta[i] * x[j];
      }
      delta_dynamic[i] = Math.log(1 + Math.exp(sum));  // softplus
    }
    
    return { B_delta, C_delta, delta_dynamic };
  }
  
  /**
   * 应用选择性B参数
   */
  private applySelectiveB(B_delta: Float32Array): Float32Array {
    const { stateDimension: N, inputDimension: D_in } = this.config;
    
    // B_t = B_bar + B_delta (广播)
    const B_t = new Float32Array(this.B_bar);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < D_in; j++) {
        B_t[i * D_in + j] += B_delta[i] * 0.1;  // 缩放因子
      }
    }
    
    return B_t;
  }
  
  /**
   * 应用选择性C参数
   */
  private applySelectiveC(C_delta: Float32Array): Float32Array {
    const C_t = new Float32Array(this.C);
    for (let i = 0; i < C_t.length; i++) {
      C_t[i] += C_delta[i] * 0.1;
    }
    return C_t;
  }
  
  /**
   * 计算动态delta
   */
  private computeDynamicDelta(delta_dynamic: Float32Array): number {
    // 平均值作为全局delta
    let sum = 0;
    for (let i = 0; i < delta_dynamic.length; i++) {
      sum += delta_dynamic[i];
    }
    return Math.max(0.0001, sum / delta_dynamic.length);
  }
  
  /**
   * 判断是否触发外部调用
   */
  private shouldTriggerExternal(stateNorm: number, y: Float32Array): boolean {
    // 基于状态范数和输出方差判断
    const yNorm = this.computeNorm(y);
    const threshold = this.config.stateDimension ** 0.5 * 0.618;  // 黄金比例
    
    return stateNorm > threshold || yNorm > threshold;
  }
  
  /**
   * 计算置信度
   */
  private computeConfidence(y: Float32Array): number {
    const norm = this.computeNorm(y);
    const maxNorm = this.config.outputDimension ** 0.5;
    return Math.min(1, norm / maxNorm);
  }
  
  /**
   * 计算向量范数
   */
  private computeNorm(v: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
  }
  
  /**
   * 创建空状态
   */
  private createEmptyState(): SSMState {
    return {
      h: new Float32Array(this.config.stateDimension),
      timestep: 0,
      createdAt: Date.now(),
      id: this.generateId(),
    };
  }
  
  /**
   * 生成随机ID
   */
  private generateId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 多层SSM
// ─────────────────────────────────────────────────────────────────────

/**
 * 多层SSM配置
 */
export interface MultiLayerSSMConfig {
  /** 层数 */
  numLayers: number;
  
  /** 每层配置 */
  layerConfigs: SSMConfig[];
  
  /** 是否使用残差连接 */
  useResidual: boolean;
  
  /** 是否使用层归一化 */
  useLayerNorm: boolean;
}

/**
 * 多层SSM
 * 
 * 类似Transformer的多层结构，但使用SSM替代Attention
 */
export class MultiLayerSSM {
  private layers: SSMLayer[];
  private config: MultiLayerSSMConfig;
  
  constructor(config: Partial<MultiLayerSSMConfig> & { layerConfigs: SSMConfig[] }) {
    this.config = {
      numLayers: config.layerConfigs.length,
      layerConfigs: config.layerConfigs,
      useResidual: config.useResidual ?? true,
      useLayerNorm: config.useLayerNorm ?? true,
    };
    
    this.layers = config.layerConfigs.map(layerConfig => new SSMLayer(layerConfig));
  }
  
  /**
   * 前向传播
   */
  forward(x: Float32Array): SSMOutput {
    let current = x;
    let finalOutput: SSMOutput | null = null;
    
    for (let i = 0; i < this.layers.length; i++) {
      const output = this.layers[i].forward(current);
      
      // 残差连接
      if (this.config.useResidual && i > 0) {
        for (let j = 0; j < output.y.length; j++) {
          output.y[j] += current[j % current.length];
        }
      }
      
      current = output.y;
      finalOutput = output;
    }
    
    return finalOutput!;
  }
  
  /**
   * 获取所有层状态
   */
  getAllLayerStates(): SSMState[] {
    return this.layers.map(layer => layer.getCurrentState());
  }
  
  /**
   * 重置所有层
   */
  reset(): void {
    this.layers.forEach(layer => layer.reset());
  }
  
  /**
   * 获取各层统计
   */
  getLayerStats(): ReturnType<SSMLayer['getStats']>[] {
    return this.layers.map(layer => layer.getStats());
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSSMLayer(config?: Partial<SSMConfig>): SSMLayer {
  return new SSMLayer(config);
}

export function createMultiLayerSSM(
  config: Partial<MultiLayerSSMConfig> & { layerConfigs: SSMConfig[] }
): MultiLayerSSM {
  return new MultiLayerSSM(config);
}

/**
 * 创建默认4层SSM（与DeepMetaThinkingCore对应）
 */
export function createDefault4LayerSSM(): MultiLayerSSM {
  const baseConfig = {
    useSelective: true,
    delta: 0.001,
    enableChaos: true,
  };
  
  const configs: SSMConfig[] = [
    // L0: 感知层
    { ...baseConfig, stateDimension: 256, inputDimension: 256, outputDimension: 256, chaosIntensity: 0.0 },
    // L1: 浅层抽象
    { ...baseConfig, stateDimension: 512, inputDimension: 256, outputDimension: 512, chaosIntensity: 0.05 },
    // L2: 深层抽象
    { ...baseConfig, stateDimension: 1024, inputDimension: 512, outputDimension: 1024, chaosIntensity: 0.1 },
    // L3: 元认知层
    { ...baseConfig, stateDimension: 2048, inputDimension: 1024, outputDimension: 2048, chaosIntensity: 0.15 },
  ];
  
  return createMultiLayerSSM({ layerConfigs: configs });
}

export default SSMLayer;
