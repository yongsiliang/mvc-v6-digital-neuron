/**
 * ═══════════════════════════════════════════════════════════════════════
 * Octahedron Hamiltonian Ring SNN
 * 正八面体哈密顿环脉冲神经网络
 * 
 * 核心思想：
 * - 正八面体的哈密顿环是一个6节点闭环
 * - 投影下来就是六根圆柱链接的六边形框架（梦境结构）
 * - 用于构建周期性振荡的SNN
 * 
 * 几何意义：
 * - 6个顶点 → 6个脉冲神经元
 * - 哈密顿环 → 脉冲传播路径
 * - 闭环结构 → 周期性振荡
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 三维向量 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** 正八面体顶点 */
export interface OctahedronVertex {
  id: string;
  position: Vector3;
  label: string;
}

/** 正八面体边 */
export interface OctahedronEdge {
  id: string;
  from: string;
  to: string;
  length: number;
}

/** 哈密顿环 */
export interface HamiltonianRing {
  id: string;
  vertices: string[];  // 顶点序列（首尾相同，形成闭环）
  edges: string[];     // 边序列
}

/** 脉冲神经元状态 */
export interface SpikingNeuronState {
  id: string;
  membranePotential: number;  // 膜电位
  threshold: number;          // 阈值
  refractoryTime: number;     // 不应期剩余时间
  phase: number;              // 相位 [0, 2π)
  lastSpikeTime: number;      // 上次发放时间
  spikeCount: number;         // 发放次数
}

/** 脉冲事件 */
export interface SpikeEvent {
  neuronId: string;
  timestamp: number;
  phase: number;
  strength: number;
}

/** 突触连接 */
export interface RingSynapse {
  from: string;
  to: string;
  weight: number;
  delay: number;  // 传播延迟（时间步）
}

/** 网络状态 */
export interface OctahedronSNNState {
  time: number;
  neurons: Map<string, SpikingNeuronState>;
  spikes: SpikeEvent[];
  oscillationPhase: number;
  synchronyIndex: number;  // 同步指数 [0, 1]
  frequency: number;       // 振荡频率
}

/** 网络配置 */
export interface OctahedronSNNConfig {
  /** 膜电位衰减率 */
  decayRate: number;
  
  /** 阈值 */
  threshold: number;
  
  /** 不应期长度（时间步） */
  refractoryPeriod: number;
  
  /** 突触权重 */
  synapseWeight: number;
  
  /** 突触延迟 */
  synapseDelay: number;
  
  /** 外部输入强度 */
  inputStrength: number;
  
  /** 噪声水平 */
  noiseLevel: number;
}

// ─────────────────────────────────────────────────────────────────────
// 正八面体几何
// ─────────────────────────────────────────────────────────────────────

/**
 * 正八面体几何结构
 * 
 * 顶点坐标（以中心为原点）：
 * - 上顶点 (0, 0, 1)
 * - 下顶点 (0, 0, -1)
 * - 前顶点 (0, 1, 0)
 * - 后顶点 (0, -1, 0)
 * - 右顶点 (1, 0, 0)
 * - 左顶点 (-1, 0, 0)
 */
export class OctahedronGeometry {
  readonly vertices: OctahedronVertex[];
  readonly edges: OctahedronEdge[];
  readonly faces: string[][];  // 每个面是3个顶点ID
  
  constructor() {
    // 定义6个顶点
    this.vertices = [
      { id: 'V_TOP', position: { x: 0, y: 0, z: 1 }, label: 'Top' },
      { id: 'V_BOTTOM', position: { x: 0, y: 0, z: -1 }, label: 'Bottom' },
      { id: 'V_FRONT', position: { x: 0, y: 1, z: 0 }, label: 'Front' },
      { id: 'V_BACK', position: { x: 0, y: -1, z: 0 }, label: 'Back' },
      { id: 'V_RIGHT', position: { x: 1, y: 0, z: 0 }, label: 'Right' },
      { id: 'V_LEFT', position: { x: -1, y: 0, z: 0 }, label: 'Left' },
    ];
    
    // 定义12条边（相邻顶点相连）
    // 每个顶点连接4条边
    this.edges = [
      // 上顶点连接
      { id: 'E_TOP_FRONT', from: 'V_TOP', to: 'V_FRONT', length: Math.sqrt(2) },
      { id: 'E_TOP_BACK', from: 'V_TOP', to: 'V_BACK', length: Math.sqrt(2) },
      { id: 'E_TOP_RIGHT', from: 'V_TOP', to: 'V_RIGHT', length: Math.sqrt(2) },
      { id: 'E_TOP_LEFT', from: 'V_TOP', to: 'V_LEFT', length: Math.sqrt(2) },
      
      // 下顶点连接
      { id: 'E_BOTTOM_FRONT', from: 'V_BOTTOM', to: 'V_FRONT', length: Math.sqrt(2) },
      { id: 'E_BOTTOM_BACK', from: 'V_BOTTOM', to: 'V_BACK', length: Math.sqrt(2) },
      { id: 'E_BOTTOM_RIGHT', from: 'V_BOTTOM', to: 'V_RIGHT', length: Math.sqrt(2) },
      { id: 'E_BOTTOM_LEFT', from: 'V_BOTTOM', to: 'V_LEFT', length: Math.sqrt(2) },
      
      // 赤道环
      { id: 'E_FRONT_RIGHT', from: 'V_FRONT', to: 'V_RIGHT', length: Math.sqrt(2) },
      { id: 'E_RIGHT_BACK', from: 'V_RIGHT', to: 'V_BACK', length: Math.sqrt(2) },
      { id: 'E_BACK_LEFT', from: 'V_BACK', to: 'V_LEFT', length: Math.sqrt(2) },
      { id: 'E_LEFT_FRONT', from: 'V_LEFT', to: 'V_FRONT', length: Math.sqrt(2) },
    ];
    
    // 定义8个面（三角形）
    this.faces = [
      ['V_TOP', 'V_FRONT', 'V_RIGHT'],
      ['V_TOP', 'V_RIGHT', 'V_BACK'],
      ['V_TOP', 'V_BACK', 'V_LEFT'],
      ['V_TOP', 'V_LEFT', 'V_FRONT'],
      ['V_BOTTOM', 'V_RIGHT', 'V_FRONT'],
      ['V_BOTTOM', 'V_BACK', 'V_RIGHT'],
      ['V_BOTTOM', 'V_LEFT', 'V_BACK'],
      ['V_BOTTOM', 'V_FRONT', 'V_LEFT'],
    ];
  }
  
  /**
   * 获取顶点的相邻顶点
   */
  getNeighbors(vertexId: string): string[] {
    const neighbors: string[] = [];
    for (const edge of this.edges) {
      if (edge.from === vertexId) neighbors.push(edge.to);
      if (edge.to === vertexId) neighbors.push(edge.from);
    }
    return neighbors;
  }
  
  /**
   * 获取顶点位置
   */
  getVertexPosition(vertexId: string): Vector3 | undefined {
    return this.vertices.find(v => v.id === vertexId)?.position;
  }
  
  /**
   * 计算两个顶点之间的距离
   */
  getDistance(v1: string, v2: string): number {
    const p1 = this.getVertexPosition(v1);
    const p2 = this.getVertexPosition(v2);
    if (!p1 || !p2) return Infinity;
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2)
    );
  }
  
  /**
   * 查找所有哈密顿环
   */
  findAllHamiltonianRings(): HamiltonianRing[] {
    const rings: HamiltonianRing[] = [];
    const startVertex = this.vertices[0].id;
    
    // DFS查找所有哈密顿环
    const visited = new Set<string>();
    const path: string[] = [startVertex];
    visited.add(startVertex);
    
    this.dfsHamiltonian(startVertex, visited, path, rings);
    
    return rings;
  }
  
  /**
   * DFS查找哈密顿环
   */
  private dfsHamiltonian(
    current: string,
    visited: Set<string>,
    path: string[],
    rings: HamiltonianRing[]
  ): void {
    // 如果路径包含所有顶点，检查是否能回到起点
    if (path.length === this.vertices.length) {
      const neighbors = this.getNeighbors(current);
      if (neighbors.includes(path[0])) {
        // 找到一个哈密顿环
        const ring = this.createRing(path);
        rings.push(ring);
      }
      return;
    }
    
    // 继续搜索
    for (const neighbor of this.getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);
        
        this.dfsHamiltonian(neighbor, visited, path, rings);
        
        path.pop();
        visited.delete(neighbor);
      }
    }
  }
  
  /**
   * 从路径创建哈密顿环
   */
  private createRing(path: string[]): HamiltonianRing {
    const vertices = [...path, path[0]];  // 闭环
    const edges: string[] = [];
    
    for (let i = 0; i < vertices.length - 1; i++) {
      const from = vertices[i];
      const to = vertices[i + 1];
      const edge = this.edges.find(
        e => (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      if (edge) edges.push(edge.id);
    }
    
    return {
      id: `ring_${path.join('_')}`,
      vertices,
      edges,
    };
  }
  
  /**
   * 获取主要哈密顿环（用于SNN）
   * 
   * 选择一个标准环：Top → Front → Bottom → Back → Left → Right → Top
   * 这个环经过所有6个顶点，形成六边形
   */
  getPrimaryHamiltonianRing(): HamiltonianRing {
    // 手动构造一个优雅的哈密顿环
    // Top → Front → Right → Bottom → Left → Back → Top
    // 这个环投影下来就是六根圆柱链接的六边形
    const vertices = [
      'V_TOP',     // 上
      'V_FRONT',   // 前
      'V_RIGHT',   // 右
      'V_BOTTOM',  // 下
      'V_LEFT',    // 左
      'V_BACK',    // 后
      'V_TOP',     // 回到上（闭环）
    ];
    
    const edges: string[] = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      const from = vertices[i];
      const to = vertices[i + 1];
      const edge = this.edges.find(
        e => (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      if (edge) edges.push(edge.id);
    }
    
    return {
      id: 'primary_ring',
      vertices,
      edges,
    };
  }
  
  /**
   * 将哈密顿环投影到2D平面
   * 用于可视化
   */
  projectRingTo2D(ring: HamiltonianRing): { x: number; y: number }[] {
    const angle = (2 * Math.PI) / 6;  // 六边形，每个顶点间隔60°
    const tiltAngle = Math.PI / 6;    // 30°倾斜（梦境中的特征）
    
    return ring.vertices.slice(0, -1).map((vertexId, index) => {
      // 基础六边形位置
      const baseAngle = angle * index + tiltAngle;
      const radius = 1;
      
      // 根据顶点高度调整半径（上顶点和下顶点向内收缩）
      const pos = this.getVertexPosition(vertexId);
      const zFactor = pos ? Math.abs(pos.z) * 0.3 : 0;
      
      return {
        x: (radius - zFactor) * Math.cos(baseAngle),
        y: (radius - zFactor) * Math.sin(baseAngle),
      };
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// 脉冲神经元
// ─────────────────────────────────────────────────────────────────────

/**
 * LIF (Leaky Integrate-and-Fire) 脉冲神经元
 */
export class SpikingNeuron {
  readonly id: string;
  
  private membranePotential: number = 0;
  private threshold: number;
  private refractoryTime: number = 0;
  private refractoryPeriod: number;
  private decayRate: number;
  private phase: number = 0;
  private lastSpikeTime: number = 0;
  private spikeCount: number = 0;
  
  // 输入缓冲
  private inputBuffer: number = 0;
  
  constructor(id: string, config: Partial<OctahedronSNNConfig> = {}) {
    this.id = id;
    this.threshold = config.threshold ?? 1.0;
    this.refractoryPeriod = config.refractoryPeriod ?? 2;
    this.decayRate = config.decayRate ?? 0.9;
  }
  
  /**
   * 接收输入
   */
  receiveInput(input: number): void {
    this.inputBuffer += input;
  }
  
  /**
   * 更新神经元状态
   * @returns 是否发放脉冲
   */
  update(time: number): boolean {
    // 不应期
    if (this.refractoryTime > 0) {
      this.refractoryTime--;
      this.membranePotential *= this.decayRate;
      this.phase += 0.1;  // 相位继续前进
      return false;
    }
    
    // 膜电位衰减
    this.membranePotential *= this.decayRate;
    
    // 累加输入
    this.membranePotential += this.inputBuffer;
    this.inputBuffer = 0;
    
    // 更新相位（基于膜电位）
    this.phase = (this.phase + 0.1 + this.membranePotential * 0.1) % (2 * Math.PI);
    
    // 检查是否发放
    if (this.membranePotential >= this.threshold) {
      this.membranePotential = 0;  // 重置
      this.refractoryTime = this.refractoryPeriod;
      this.lastSpikeTime = time;
      this.spikeCount++;
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取状态
   */
  getState(): SpikingNeuronState {
    return {
      id: this.id,
      membranePotential: this.membranePotential,
      threshold: this.threshold,
      refractoryTime: this.refractoryTime,
      phase: this.phase,
      lastSpikeTime: this.lastSpikeTime,
      spikeCount: this.spikeCount,
    };
  }
  
  /**
   * 设置相位（用于同步）
   */
  setPhase(phase: number): void {
    this.phase = phase % (2 * Math.PI);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 正八面体哈密顿环SNN网络
// ─────────────────────────────────────────────────────────────────────

/**
 * 正八面体哈密顿环脉冲神经网络
 * 
 * 核心特性：
 * - 6个神经元对应正八面体的6个顶点
 * - 按哈密顿环顺序连接，形成闭环
 * - 脉冲在环上传播，产生周期性振荡
 * - 支持多个环的同步和耦合
 */
export class OctahedronSNN {
  readonly geometry: OctahedronGeometry;
  readonly ring: HamiltonianRing;
  readonly neurons: Map<string, SpikingNeuron>;
  readonly synapses: RingSynapse[];
  
  private config: OctahedronSNNConfig;
  private time: number = 0;
  private spikeHistory: SpikeEvent[] = [];
  private readonly maxHistoryLength = 1000;
  
  // 振荡统计
  private oscillationPhase: number = 0;
  private synchronyIndex: number = 0;
  
  constructor(config: Partial<OctahedronSNNConfig> = {}) {
    this.config = {
      decayRate: config.decayRate ?? 0.9,
      threshold: config.threshold ?? 1.0,
      refractoryPeriod: config.refractoryPeriod ?? 2,
      synapseWeight: config.synapseWeight ?? 0.8,
      synapseDelay: config.synapseDelay ?? 1,
      inputStrength: config.inputStrength ?? 0.5,
      noiseLevel: config.noiseLevel ?? 0.05,
    };
    
    // 初始化几何结构
    this.geometry = new OctahedronGeometry();
    this.ring = this.geometry.getPrimaryHamiltonianRing();
    
    // 创建神经元
    this.neurons = new Map();
    for (const vertex of this.geometry.vertices) {
      this.neurons.set(vertex.id, new SpikingNeuron(vertex.id, this.config));
    }
    
    // 创建突触（沿哈密顿环方向）
    this.synapses = [];
    for (let i = 0; i < this.ring.vertices.length - 1; i++) {
      const from = this.ring.vertices[i];
      const to = this.ring.vertices[i + 1];
      
      // 双向突触（正反两个方向）
      this.synapses.push({
        from,
        to,
        weight: this.config.synapseWeight,
        delay: this.config.synapseDelay,
      });
      
      this.synapses.push({
        from: to,
        to: from,
        weight: this.config.synapseWeight * 0.5,  // 反向稍弱
        delay: this.config.synapseDelay,
      });
    }
    
    console.log(`[OctahedronSNN] 初始化完成`);
    console.log(`  - 顶点: ${this.geometry.vertices.length}`);
    console.log(`  - 哈密顿环: ${this.ring.vertices.join(' → ')}`);
    console.log(`  - 突触: ${this.synapses.length}`);
  }
  
  /**
   * 注入脉冲到指定神经元
   */
  injectSpike(neuronId: string, strength?: number): void {
    const neuron = this.neurons.get(neuronId);
    if (neuron) {
      neuron.receiveInput(strength ?? this.config.inputStrength);
    }
  }
  
  /**
   * 注入模式化输入
   * 沿着哈密顿环依次激活神经元
   */
  injectPatternedInput(startNeuron?: string): void {
    const start = startNeuron ?? this.ring.vertices[0];
    const startIndex = this.ring.vertices.indexOf(start);
    
    if (startIndex === -1) return;
    
    // 只激活起始神经元，让它触发连锁反应
    this.injectSpike(start);
  }
  
  /**
   * 更新网络状态（一个时间步）
   */
  step(): SpikeEvent[] {
    const currentSpikes: SpikeEvent[] = [];
    this.time++;
    
    // 收集所有发放的脉冲
    for (const [id, neuron] of this.neurons) {
      const spiked = neuron.update(this.time);
      
      if (spiked) {
        const state = neuron.getState();
        currentSpikes.push({
          neuronId: id,
          timestamp: this.time,
          phase: state.phase,
          strength: 1.0,
        });
      }
    }
    
    // 传播脉冲
    for (const spike of currentSpikes) {
      // 找到所有从这个神经元出发的突触
      for (const synapse of this.synapses) {
        if (synapse.from === spike.neuronId) {
          const target = this.neurons.get(synapse.to);
          if (target) {
            target.receiveInput(synapse.weight * spike.strength);
          }
        }
      }
    }
    
    // 添加噪声（模拟生物噪声）
    if (Math.random() < this.config.noiseLevel) {
      const randomNeuron = Array.from(this.neurons.values())[
        Math.floor(Math.random() * this.neurons.size)
      ];
      randomNeuron.receiveInput(0.1);
    }
    
    // 记录脉冲历史
    this.spikeHistory.push(...currentSpikes);
    if (this.spikeHistory.length > this.maxHistoryLength) {
      this.spikeHistory.shift();
    }
    
    // 更新振荡相位
    this.updateOscillation();
    
    return currentSpikes;
  }
  
  /**
   * 运行多个时间步
   */
  run(steps: number): SpikeEvent[][] {
    const allSpikes: SpikeEvent[][] = [];
    
    for (let i = 0; i < steps; i++) {
      const spikes = this.step();
      allSpikes.push(spikes);
    }
    
    return allSpikes;
  }
  
  /**
   * 更新振荡相位
   */
  private updateOscillation(): void {
    // 计算平均相位
    let totalPhase = 0;
    let count = 0;
    
    for (const neuron of this.neurons.values()) {
      const state = neuron.getState();
      totalPhase += state.phase;
      count++;
    }
    
    if (count > 0) {
      this.oscillationPhase = (totalPhase / count) % (2 * Math.PI);
    }
    
    // 计算同步指数（Kuramoto序参量）
    this.synchronyIndex = this.calculateSynchronyIndex();
  }
  
  /**
   * 计算同步指数（Kuramoto序参量）
   * 
   * r = |1/N * Σ e^(iθ_j)|
   * r = 1 表示完全同步，r = 0 表示完全不同步
   */
  private calculateSynchronyIndex(): number {
    let sumCos = 0;
    let sumSin = 0;
    let count = 0;
    
    for (const neuron of this.neurons.values()) {
      const state = neuron.getState();
      sumCos += Math.cos(state.phase);
      sumSin += Math.sin(state.phase);
      count++;
    }
    
    if (count === 0) return 0;
    
    const r = Math.sqrt(
      Math.pow(sumCos / count, 2) + Math.pow(sumSin / count, 2)
    );
    
    return r;
  }
  
  /**
   * 同步所有神经元
   * 将所有神经元的相位重置为相同值
   */
  synchronize(): void {
    const targetPhase = 0;
    for (const neuron of this.neurons.values()) {
      neuron.setPhase(targetPhase);
    }
  }
  
  /**
   * 获取网络状态
   */
  getState(): OctahedronSNNState {
    const neurons = new Map<string, SpikingNeuronState>();
    for (const [id, neuron] of this.neurons) {
      neurons.set(id, neuron.getState());
    }
    
    // 计算频率（基于最近的脉冲间隔）
    const recentSpikes = this.spikeHistory.slice(-100);
    let frequency = 0;
    if (recentSpikes.length >= 2) {
      const intervals: number[] = [];
      const neuronSpikes = new Map<string, number[]>();
      
      for (const spike of recentSpikes) {
        if (!neuronSpikes.has(spike.neuronId)) {
          neuronSpikes.set(spike.neuronId, []);
        }
        neuronSpikes.get(spike.neuronId)!.push(spike.timestamp);
      }
      
      // 计算平均间隔
      for (const spikes of neuronSpikes.values()) {
        if (spikes.length >= 2) {
          for (let i = 1; i < spikes.length; i++) {
            intervals.push(spikes[i] - spikes[i - 1]);
          }
        }
      }
      
      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        frequency = 1000 / avgInterval;  // Hz
      }
    }
    
    return {
      time: this.time,
      neurons,
      spikes: this.spikeHistory.slice(-100),
      oscillationPhase: this.oscillationPhase,
      synchronyIndex: this.synchronyIndex,
      frequency,
    };
  }
  
  /**
   * 获取脉冲历史
   */
  getSpikeHistory(lastN?: number): SpikeEvent[] {
    if (lastN) {
      return this.spikeHistory.slice(-lastN);
    }
    return [...this.spikeHistory];
  }
  
  /**
   * 重置网络
   */
  reset(): void {
    this.time = 0;
    this.spikeHistory = [];
    this.oscillationPhase = 0;
    this.synchronyIndex = 0;
    
    // 重新创建神经元
    this.neurons.clear();
    for (const vertex of this.geometry.vertices) {
      this.neurons.set(vertex.id, new SpikingNeuron(vertex.id, this.config));
    }
  }
  
  /**
   * 获取投影到2D的神经元位置
   */
  get2DProjection(): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const projected = this.geometry.projectRingTo2D(this.ring);
    
    for (let i = 0; i < this.ring.vertices.length - 1; i++) {
      positions.set(this.ring.vertices[i], projected[i]);
    }
    
    return positions;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 多环耦合网络
// ─────────────────────────────────────────────────────────────────────

/**
 * 多个哈密顿环耦合网络
 * 
 * 用于实现更复杂的振荡模式
 * 多个环之间可以通过共享顶点耦合
 */
export class CoupledRingNetwork {
  readonly rings: OctahedronSNN[];
  readonly geometry: OctahedronGeometry;
  
  private couplingStrength: number = 0.3;
  
  constructor(numRings: number = 1, config?: Partial<OctahedronSNNConfig>) {
    this.geometry = new OctahedronGeometry();
    
    this.rings = [];
    for (let i = 0; i < numRings; i++) {
      this.rings.push(new OctahedronSNN(config));
    }
  }
  
  /**
   * 耦合更新
   * 共享顶点的神经元会相互影响
   */
  coupledStep(): void {
    // 先各自更新
    for (const ring of this.rings) {
      ring.step();
    }
    
    // 然后进行耦合
    // 共享顶点的神经元之间传递部分激活
    for (let i = 0; i < this.rings.length; i++) {
      for (let j = i + 1; j < this.rings.length; j++) {
        this.coupleRings(this.rings[i], this.rings[j]);
      }
    }
  }
  
  /**
   * 耦合两个环
   */
  private coupleRings(ring1: OctahedronSNN, ring2: OctahedronSNN): void {
    // 共享顶点（正八面体）
    const sharedVertices = ['V_TOP', 'V_BOTTOM'];
    
    for (const vertexId of sharedVertices) {
      const n1 = ring1.neurons.get(vertexId);
      const n2 = ring2.neurons.get(vertexId);
      
      if (n1 && n2) {
        const s1 = n1.getState();
        const s2 = n2.getState();
        
        // 相互传递激活
        if (s1.membranePotential > 0.5) {
          n2.receiveInput(s1.membranePotential * this.couplingStrength);
        }
        if (s2.membranePotential > 0.5) {
          n1.receiveInput(s2.membranePotential * this.couplingStrength);
        }
      }
    }
  }
  
  /**
   * 获取所有环的状态
   */
  getAllStates(): OctahedronSNNState[] {
    return this.rings.map(r => r.getState());
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export default OctahedronSNN;
