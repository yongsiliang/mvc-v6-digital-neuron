/**
 * ═══════════════════════════════════════════════════════════════════════
 * SNN 网络 - 核心实现
 * 
 * 整合神经元和突触，实现：
 * 1. 脉冲传播
 * 2. STDP 学习
 * 3. 动态成长
 * 4. 稳态调节
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LIFNeuron, createNeuronPopulation } from './neuron';
import { Synapse, createRandomConnections } from './synapse';
import type {
  NeuronId,
  NeuronRegion,
  Spike,
  NetworkSnapshot,
  SNNConfig
} from '../types';
import { DEFAULT_SNN_CONFIG } from '../types';

/**
 * SNN 网络类
 */
export class SpikingNeuralNetwork {
  private neurons: Map<NeuronId, LIFNeuron> = new Map();
  private synapses: Map<string, Synapse> = new Map();
  
  // 按区域组织神经元
  private neuronsByRegion: Map<NeuronRegion, Set<NeuronId>> = new Map([
    ['input', new Set()],
    ['core', new Set()],
    ['output', new Set()]
  ]);
  
  // 突触索引 (后神经元 → 突触列表)
  private synapsesByPost: Map<NeuronId, Synapse[]> = new Map();
  
  // 时间步
  private globalTime: number = 0;
  
  // 配置
  private config: SNNConfig;
  
  // 统计
  private stats = {
    totalSpikes: 0,
    lastGrowthTime: 0,
    lastPruneTime: 0
  };

  constructor(config: Partial<SNNConfig> = {}) {
    this.config = { ...DEFAULT_SNN_CONFIG, ...config };
    this.initialize();
  }

  /**
   * 初始化网络
   */
  private initialize(): void {
    // 创建输入层神经元
    const inputNeurons = createNeuronPopulation(
      this.config.initialNeurons.input,
      'input'
    );
    inputNeurons.forEach(n => this.addNeuron(n));

    // 创建核心层神经元
    const coreNeurons = createNeuronPopulation(
      this.config.initialNeurons.core,
      'core'
    );
    coreNeurons.forEach(n => this.addNeuron(n));

    // 创建输出层神经元
    const outputNeurons = createNeuronPopulation(
      this.config.initialNeurons.output,
      'output'
    );
    outputNeurons.forEach(n => this.addNeuron(n));

    // 创建初始连接
    this.createInitialConnections();
  }

  /**
   * 创建初始连接
   */
  private createInitialConnections(): void {
    const inputIds = Array.from(this.neuronsByRegion.get('input') || []);
    const coreIds = Array.from(this.neuronsByRegion.get('core') || []);
    const outputIds = Array.from(this.neuronsByRegion.get('output') || []);

    // 输入层 → 核心层
    const inputToCore = createRandomConnections(
      inputIds, coreIds, 0.3
    );
    inputToCore.forEach(s => this.addSynapse(s));

    // 核心层内部 (循环连接)
    const coreInternal = createRandomConnections(
      coreIds, coreIds, 0.1
    );
    coreInternal.forEach(s => this.addSynapse(s));

    // 核心层 → 输出层
    const coreToOutput = createRandomConnections(
      coreIds, outputIds, 0.3
    );
    coreToOutput.forEach(s => this.addSynapse(s));
  }

  /**
   * 添加神经元
   */
  private addNeuron(neuron: LIFNeuron): void {
    this.neurons.set(neuron.id, neuron);
    this.neuronsByRegion.get(neuron.region)?.add(neuron.id);
  }

  /**
   * 添加突触
   */
  private addSynapse(synapse: Synapse): void {
    this.synapses.set(synapse.id, synapse);
    
    // 更新索引
    const postSynapses = this.synapsesByPost.get(synapse.postNeuronId) || [];
    postSynapses.push(synapse);
    this.synapsesByPost.set(synapse.postNeuronId, postSynapses);
  }

  /**
   * 获取神经元
   */
  getNeuron(id: NeuronId): LIFNeuron | undefined {
    return this.neurons.get(id);
  }

  /**
   * 获取神经元的输入突触
   */
  getInputSynapses(neuronId: NeuronId): Synapse[] {
    return this.synapsesByPost.get(neuronId) || [];
  }

  /**
   * 处理一个时间步
   * @param inputSpikes 输入脉冲 (神经元ID → 是否发射)
   * @returns 输出脉冲
   */
  step(inputSpikes: Map<NeuronId, number> = new Map()): Spike[] {
    this.globalTime++;
    const outputSpikes: Spike[] = [];
    
    // 1. 处理输入层
    const inputFiring = new Map<NeuronId, boolean>();
    for (const [neuronId, inputCurrent] of inputSpikes) {
      const neuron = this.neurons.get(neuronId);
      if (neuron && neuron.region === 'input') {
        neuron.setGlobalTime(this.globalTime);
        const fired = neuron.integrate(inputCurrent);
        inputFiring.set(neuronId, fired);
        if (fired) {
          outputSpikes.push({ neuronId, timestamp: this.globalTime });
          this.stats.totalSpikes++;
        }
      }
    }

    // 2. 传播到核心层
    const coreFiring = this.propagateToRegion('core', inputFiring);
    coreFiring.forEach((fired, id) => {
      if (fired) {
        outputSpikes.push({ neuronId: id, timestamp: this.globalTime });
      }
    });

    // 3. 传播到输出层
    const outputFiring = this.propagateToRegion('output', coreFiring);
    outputFiring.forEach((fired, id) => {
      if (fired) {
        outputSpikes.push({ neuronId: id, timestamp: this.globalTime });
      }
    });

    // 4. STDP 学习
    this.applySTDP(inputFiring, coreFiring, outputFiring);

    // 5. 稳态调节 (偶尔)
    if (this.globalTime % 100 === 0) {
      this.applyHomeostasis();
    }

    // 6. 动态成长检查 (偶尔)
    if (this.config.growth.enabled && this.globalTime % 1000 === 0) {
      this.checkGrowth();
    }

    return outputSpikes;
  }

  /**
   * 传播到指定区域
   */
  private propagateToRegion(
    region: NeuronRegion,
    previousFiring: Map<NeuronId, boolean>
  ): Map<NeuronId, boolean> {
    const currentFiring = new Map<NeuronId, boolean>();
    const neuronIds = this.neuronsByRegion.get(region);
    
    if (!neuronIds) return currentFiring;

    for (const neuronId of neuronIds) {
      const neuron = this.neurons.get(neuronId);
      if (!neuron) continue;

      neuron.setGlobalTime(this.globalTime);

      // 计算输入总和
      const inputSynapses = this.getInputSynapses(neuronId);
      let inputSum = 0;

      for (const synapse of inputSynapses) {
        const preFiring = previousFiring.get(synapse.preNeuronId) || false;
        inputSum += synapse.getOutput(preFiring ? 1 : 0);
      }

      // 神经元积分并检查是否发射
      const fired = neuron.integrate(inputSum);
      currentFiring.set(neuronId, fired);
    }

    return currentFiring;
  }

  /**
   * 应用 STDP 学习
   */
  private applySTDP(
    inputFiring: Map<NeuronId, boolean>,
    coreFiring: Map<NeuronId, boolean>,
    outputFiring: Map<NeuronId, boolean>
  ): void {
    const allFiring = new Map([
      ...inputFiring,
      ...coreFiring,
      ...outputFiring
    ]);

    for (const [, synapse] of this.synapses) {
      const preFired = allFiring.get(synapse.preNeuronId) || false;
      const postFired = allFiring.get(synapse.postNeuronId) || false;
      synapse.updateSTDP(preFired, postFired);
    }
  }

  /**
   * 稳态调节
   */
  private applyHomeostasis(): void {
    const targetRate = this.config.homeostasis.targetFiringRate;
    const adaptationRate = this.config.homeostasis.adaptationRate;

    for (const [, neuron] of this.neurons) {
      const currentRate = neuron.getFiringRate(100);
      const error = currentRate - targetRate;
      
      // 如果发放率太高，提高阈值；太低，降低阈值
      neuron.adjustThreshold(error * adaptationRate);
    }
  }

  /**
   * 检查并执行动态成长
   */
  private checkGrowth(): void {
    const growthConfig = this.config.growth;

    // 1. 检查是否需要生长新神经元
    if (this.neurons.size < growthConfig.maxNeurons) {
      const avgActivity = this.calculateAverageActivity();
      
      if (avgActivity > growthConfig.activityThreshold) {
        this.growNeurons(growthConfig.growthRate);
        this.stats.lastGrowthTime = this.globalTime;
      }
    }

    // 2. 检查是否需要创建新连接
    this.growSynapses(growthConfig.correlationThreshold);

    // 3. 检查是否需要修剪
    this.pruneSynapses(growthConfig.pruneThreshold);
    
    // 4. 检查是否需要移除死亡神经元
    if (this.neurons.size > growthConfig.minNeurons) {
      this.pruneNeurons(growthConfig.silenceThreshold);
    }
  }

  /**
   * 计算平均活跃度
   */
  private calculateAverageActivity(): number {
    let totalActivity = 0;
    let count = 0;

    for (const [, neuron] of this.neurons) {
      totalActivity += neuron.getFiringRate(100);
      count++;
    }

    return count > 0 ? totalActivity / count : 0;
  }

  /**
   * 生长新神经元
   */
  private growNeurons(count: number): void {
    const newNeurons = createNeuronPopulation(
      count,
      'core',
      this.neurons.size
    );

    for (const neuron of newNeurons) {
      this.addNeuron(neuron);
      
      // 连接到现有网络
      const coreIds = Array.from(this.neuronsByRegion.get('core') || []);
      const randomPeers = coreIds
        .filter(id => id !== neuron.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      for (const peerId of randomPeers) {
        const synapse = new Synapse(neuron.id, peerId);
        this.addSynapse(synapse);
      }
    }
  }

  /**
   * 生长新突触
   */
  private growSynapses(correlationThreshold: number): void {
    // 检测高度相关的神经元对
    const correlations = this.calculateNeuronCorrelations();
    
    for (const [preId, postId, corr] of correlations) {
      if (corr > correlationThreshold) {
        const existingSynapse = Array.from(this.synapses.values())
          .find(s => s.preNeuronId === preId && s.postNeuronId === postId);
        
        if (!existingSynapse) {
          const newSynapse = new Synapse(preId, postId, { weight: corr });
          this.addSynapse(newSynapse);
        }
      }
    }
  }

  /**
   * 计算神经元相关性
   */
  private calculateNeuronCorrelations(): Array<[NeuronId, NeuronId, number]> {
    // 简化版：基于同时发放
    const correlations: Array<[NeuronId, NeuronId, number]> = [];
    const neurons = Array.from(this.neurons.values());

    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        const n1 = neurons[i];
        const n2 = neurons[j];
        
        // 简化的相关性：基于发放时间接近度
        const timeDiff = Math.abs(
          n1.getState().lastSpikeTime - n2.getState().lastSpikeTime
        );
        const correlation = Math.exp(-timeDiff / 10);
        
        if (correlation > 0.3) {
          correlations.push([n1.id, n2.id, correlation]);
        }
      }
    }

    return correlations;
  }

  /**
   * 修剪弱突触
   */
  private pruneSynapses(threshold: number): void {
    const toRemove: string[] = [];

    for (const [id, synapse] of this.synapses) {
      if (synapse.shouldPrune(threshold)) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeSynapse(id);
    }

    if (toRemove.length > 0) {
      this.stats.lastPruneTime = this.globalTime;
    }
  }

  /**
   * 移除突触
   */
  private removeSynapse(id: string): void {
    const synapse = this.synapses.get(id);
    if (!synapse) return;

    // 从索引中移除
    const postSynapses = this.synapsesByPost.get(synapse.postNeuronId) || [];
    const index = postSynapses.findIndex(s => s.id === id);
    if (index >= 0) {
      postSynapses.splice(index, 1);
    }

    this.synapses.delete(id);
  }

  /**
   * 移除死亡神经元
   */
  private pruneNeurons(silenceThreshold: number): void {
    const toRemove: NeuronId[] = [];

    for (const [id, neuron] of this.neurons) {
      if (
        neuron.region !== 'input' &&
        neuron.region !== 'output' &&
        neuron.getState().silenceDuration > silenceThreshold
      ) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeNeuron(id);
    }
  }

  /**
   * 移除神经元
   */
  private removeNeuron(id: NeuronId): void {
    const neuron = this.neurons.get(id);
    if (!neuron) return;

    // 移除相关突触
    const synapsesToRemove = Array.from(this.synapses.values())
      .filter(s => s.preNeuronId === id || s.postNeuronId === id);
    
    for (const s of synapsesToRemove) {
      this.removeSynapse(s.id);
    }

    // 从区域集合中移除
    this.neuronsByRegion.get(neuron.region)?.delete(id);
    
    // 移除神经元
    this.neurons.delete(id);
  }

  /**
   * 获取网络快照
   */
  getSnapshot(): NetworkSnapshot {
    const potentials: number[] = [];
    const activeNeurons: NeuronId[] = [];

    for (const [id, neuron] of this.neurons) {
      potentials.push(neuron.potential);
      if (neuron.potential > 0.5) {
        activeNeurons.push(id);
      }
    }

    const mean = potentials.length > 0 
      ? potentials.reduce((a, b) => a + b, 0) / potentials.length 
      : 0;
    const variance = potentials.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / potentials.length;
    const std = Math.sqrt(variance);

    return {
      timestamp: this.globalTime,
      neurons: new Map(Array.from(this.neurons.entries()).map(([id, n]) => [id, n.getState()])),
      synapses: Array.from(this.synapses.values()).map(s => s.getState()),
      activeNeurons,
      potentialDistribution: {
        mean,
        std,
        max: Math.max(...potentials, 0),
        min: Math.min(...potentials, 0)
      },
      stats: {
        totalNeurons: this.neurons.size,
        totalSynapses: this.synapses.size,
        activeSynapses: Array.from(this.synapses.values()).filter(s => s.isActive).length,
        firingRate: this.stats.totalSpikes / Math.max(1, this.globalTime),
        avgPotential: mean
      }
    };
  }

  /**
   * 获取输入层神经元 IDs
   */
  getInputNeuronIds(): NeuronId[] {
    return Array.from(this.neuronsByRegion.get('input') || []);
  }

  /**
   * 获取输出层神经元 IDs
   */
  getOutputNeuronIds(): NeuronId[] {
    return Array.from(this.neuronsByRegion.get('output') || []);
  }

  /**
   * 获取全局时间
   */
  getTime(): number {
    return this.globalTime;
  }

  /**
   * 获取配置
   */
  getConfig(): SNNConfig {
    return { ...this.config };
  }

  /**
   * 序列化网络
   */
  toJSON(): object {
    return {
      neurons: Array.from(this.neurons.values()).map(n => n.toJSON()),
      synapses: Array.from(this.synapses.values()).map(s => s.toJSON()),
      globalTime: this.globalTime,
      stats: this.stats,
      config: this.config
    };
  }
}

/**
 * 创建 SNN 网络
 */
export function createSNN(config?: Partial<SNNConfig>): SpikingNeuralNetwork {
  return new SpikingNeuralNetwork(config);
}
