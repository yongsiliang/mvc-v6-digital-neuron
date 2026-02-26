/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎 - Neural Computation Engine
 * 
 * 基于 TensorFlow.js 的真正神经网络实现
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';
import { TensorVSA, TensorConcept, ConceptType } from './tensor-vsa';
import { MultiHeadAttention, AttentionOutput } from './attention';
import { HebbianLayer, RewardModulatedLayer, LearningConfig } from './learning-layers';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export type NeuronRole = 
  | 'sensory'
  | 'semantic'
  | 'episodic'
  | 'emotional'
  | 'abstract'
  | 'motor'
  | 'metacognitive';

export interface TensorNeuron {
  id: string;
  label: string;
  role: NeuronRole;
  weights: tf.Tensor2D;
  bias: tf.Tensor1D;
  predictionWeights: tf.Tensor2D;
  sensitivityVector: tf.Tensor1D;
  predictedActivation: tf.Tensor1D;
  actualActivation: tf.Tensor1D;
  predictionError: tf.Tensor1D;
  learningState: {
    accumulatedSurprise: number;
    learningRate: number;
    totalLearningEvents: number;
    lastLearningAt: number | null;
  };
  meta: {
    createdAt: number;
    usefulness: number;
    totalActivations: number;
    level: number;
  };
}

export interface NeuralLayerConfig {
  name: string;
  neuronCount: number;
  inputDimension: number;
  activation: 'sigmoid' | 'tanh' | 'relu' | 'linear' | 'softmax';
  trainable: boolean;
}

export interface NeuralNetworkState {
  activations: tf.Tensor1D;
  predictionErrors: tf.Tensor1D;
  attentionWeights: tf.Tensor2D | null;
  surpriseLevels: tf.Tensor1D;
  consciousWinners: string[];
}

export interface NeuralProcessingResult {
  activations: Map<string, number>;
  predictionErrors: Map<string, number>;
  surprises: Array<{ neuronId: string; error: number; surprise: number }>;
  attention: Map<string, number>;
  consciousContent: { winners: string[]; broadcastStrength: number };
  learningResult: { adjustedNeurons: string[]; totalWeightChange: number };
  processingTime: number;
}

export interface NeuralEngineConfig {
  vsaDimension: number;
  maxNeurons: number;
  learningConfig: LearningConfig;
  attentionHeads: number;
  useGPU: boolean;
  enablePrediction: boolean;
  enableConsciousness: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 神经计算引擎
// ─────────────────────────────────────────────────────────────────────

export class NeuralEngine {
  private config: NeuralEngineConfig;
  private neurons: Map<string, TensorNeuron>;
  private vsa: TensorVSA;
  private attention: MultiHeadAttention;
  private hebbianLayer: HebbianLayer;
  private rewardLayer: RewardModulatedLayer;
  private initialized: boolean = false;
  
  private stats = {
    totalProcessing: 0,
    totalLearningEvents: 0,
    averagePredictionError: 0,
    totalSurprise: 0,
    gpuMemoryUsed: 0,
  };

  constructor(config: Partial<NeuralEngineConfig> = {}) {
    this.config = {
      vsaDimension: config.vsaDimension ?? 10000,
      maxNeurons: config.maxNeurons ?? 1000,
      learningConfig: config.learningConfig ?? {
        hebbianRate: 0.01,
        predictionLearningRate: 0.1,
        rewardDecay: 0.99,
        tdLambda: 0.9,
      },
      attentionHeads: config.attentionHeads ?? 8,
      useGPU: config.useGPU ?? false,
      enablePrediction: config.enablePrediction ?? true,
      enableConsciousness: config.enableConsciousness ?? true,
    };

    this.neurons = new Map();
    this.vsa = new TensorVSA(this.config.vsaDimension);
    this.attention = new MultiHeadAttention({
      modelDimension: this.config.vsaDimension,
      headCount: this.config.attentionHeads,
    });
    this.hebbianLayer = new HebbianLayer(this.config.learningConfig);
    this.rewardLayer = new RewardModulatedLayer(this.config.learningConfig);

    this.setupBackend();
  }

  private async setupBackend(): Promise<void> {
    try {
      await tf.setBackend(this.config.useGPU ? 'tensorflow' : 'cpu');
      await tf.ready();
      this.initialized = true;
      console.log(`[NeuralEngine] Backend initialized: ${this.config.useGPU ? 'GPU' : 'CPU'}`);
    } catch (error) {
      console.warn('[NeuralEngine] Backend setup failed, using CPU:', error);
      await tf.setBackend('cpu');
      await tf.ready();
      this.initialized = true;
    }
  }

  async initializeNeurons(concepts: Array<{ name: string; role: NeuronRole }>): Promise<void> {
    for (const { name, role } of concepts) {
      await this.createNeuron(name, role);
    }
  }

  async createNeuron(label: string, role: NeuronRole, level: number = 0): Promise<TensorNeuron> {
    const id = `neuron-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dim = this.config.vsaDimension;

    const scale = Math.sqrt(2 / dim);
    const weights = tf.tensor2d(
      Array.from({ length: dim }, () => [(Math.random() * 2 - 1) * scale])
    );
    const bias = tf.zeros([1]) as tf.Tensor1D;
    const predictionWeights = tf.tensor2d(
      Array.from({ length: dim }, () => [(Math.random() * 2 - 1) * scale])
    );
    const sensitivityVector = await this.vsa.getConceptVector(label);
    const predictedActivation = tf.zeros([1]) as tf.Tensor1D;
    const actualActivation = tf.zeros([1]) as tf.Tensor1D;
    const predictionError = tf.zeros([1]) as tf.Tensor1D;

    const neuron: TensorNeuron = {
      id,
      label,
      role,
      weights,
      bias,
      predictionWeights,
      sensitivityVector,
      predictedActivation,
      actualActivation,
      predictionError,
      learningState: {
        accumulatedSurprise: 0,
        learningRate: this.config.learningConfig.hebbianRate,
        totalLearningEvents: 0,
        lastLearningAt: null,
      },
      meta: {
        createdAt: Date.now(),
        usefulness: 0.5,
        totalActivations: 0,
        level,
      },
    };

    this.neurons.set(id, neuron);
    return neuron;
  }

  removeNeuron(neuronId: string): boolean {
    const neuron = this.neurons.get(neuronId);
    if (!neuron) return false;

    neuron.weights.dispose();
    neuron.bias.dispose();
    neuron.predictionWeights.dispose();
    neuron.sensitivityVector.dispose();
    neuron.predictedActivation.dispose();
    neuron.actualActivation.dispose();
    neuron.predictionError.dispose();

    this.neurons.delete(neuronId);
    return true;
  }

  async processInput(
    inputVector: number[],
    _context?: {
      recentActivations?: Map<string, number>;
      currentGoal?: string;
    }
  ): Promise<NeuralProcessingResult> {
    const startTime = Date.now();
    const inputTensor = tf.tensor1d(inputVector);

    // 阶段 1：预测
    const predictions = await this.generatePredictions();

    // 阶段 2：激活
    const activations = await this.computeActivations(inputTensor);

    // 阶段 3：注意力
    const attentionResult = await this.computeAttention(inputTensor, activations);

    // 阶段 4：误差计算
    const { errors, surprises } = await this.computePredictionErrors(predictions, activations);

    // 阶段 5：意识竞争
    const consciousContent = this.config.enableConsciousness
      ? this.runConsciousnessCompetition(activations, attentionResult)
      : { winners: [], broadcastStrength: 0 };

    // 阶段 6：学习
    const learningResult = await this.applyLearning(inputTensor, activations, errors, surprises);

    this.stats.totalProcessing++;
    inputTensor.dispose();

    const activationsMap = new Map<string, number>();
    const errorsMap = new Map<string, number>();
    const attentionMap = new Map<string, number>();

    activations.forEach((value, id) => activationsMap.set(id, value));
    errors.forEach((value, id) => errorsMap.set(id, value));
    attentionResult.weights.forEach((value, id) => attentionMap.set(id, value));

    return {
      activations: activationsMap,
      predictionErrors: errorsMap,
      surprises: surprises.map(s => ({ neuronId: s.id, error: s.error, surprise: s.surprise })),
      attention: attentionMap,
      consciousContent,
      learningResult,
      processingTime: Date.now() - startTime,
    };
  }

  private async generatePredictions(): Promise<Map<string, number>> {
    const predictions = new Map<string, number>();

    for (const [id, neuron] of this.neurons) {
      const predWeightsT = neuron.predictionWeights.transpose();
      const actualT = neuron.actualActivation.expandDims(1);
      const predicted = tf.matMul(predWeightsT, actualT);
      const value = (await predicted.data())[0];
      predictions.set(id, value);

      neuron.predictedActivation.dispose();
      neuron.predictedActivation = tf.tensor1d([value]);

      predWeightsT.dispose();
      actualT.dispose();
      predicted.dispose();
    }

    return predictions;
  }

  private async computeActivations(inputTensor: tf.Tensor1D): Promise<Map<string, number>> {
    const activations = new Map<string, number>();

    for (const [id, neuron] of this.neurons) {
      const dot = tf.dot(inputTensor, neuron.sensitivityVector);
      const biased = tf.add(dot, neuron.bias);
      const activated = tf.sigmoid(biased);

      const value = (await activated.data())[0];
      activations.set(id, value);

      neuron.actualActivation.dispose();
      neuron.actualActivation = tf.tensor1d([value]);
      neuron.meta.totalActivations++;

      dot.dispose();
      biased.dispose();
      activated.dispose();
    }

    return activations;
  }

  private async computeAttention(
    inputTensor: tf.Tensor1D,
    activations: Map<string, number>
  ): Promise<{ weights: Map<string, number>; output: tf.Tensor1D }> {
    const neuronIds = Array.from(this.neurons.keys());
    const activationValues = neuronIds.map(id => activations.get(id) || 0);
    const activationMatrix = tf.tensor2d([activationValues], [1, neuronIds.length]);

    const query = inputTensor.expandDims(0);
    const keys = activationMatrix;
    const values = activationMatrix;

    const attentionOutput = await this.attention.compute(query, keys, values);

    const weightsMap = new Map<string, number>();
    const attentionWeights = await attentionOutput.weights.array();

    neuronIds.forEach((id, i) => {
      weightsMap.set(id, attentionWeights[0]?.[i] ?? 0);
    });

    query.dispose();
    activationMatrix.dispose();

    return { weights: weightsMap, output: attentionOutput.output };
  }

  private async computePredictionErrors(
    predictions: Map<string, number>,
    activations: Map<string, number>
  ): Promise<{
    errors: Map<string, number>;
    surprises: Array<{ id: string; error: number; surprise: number }>;
  }> {
    const errors = new Map<string, number>();
    const surprises: Array<{ id: string; error: number; surprise: number }> = [];

    for (const [id, neuron] of this.neurons) {
      const predicted = predictions.get(id) || 0;
      const actual = activations.get(id) || 0;
      const error = actual - predicted;
      errors.set(id, error);

      const surprise = Math.abs(error) ** 2;

      neuron.predictionError.dispose();
      neuron.predictionError = tf.tensor1d([error]);
      neuron.learningState.accumulatedSurprise += surprise;

      if (surprise > 0.1) {
        surprises.push({ id, error, surprise });
      }
    }

    return { errors, surprises };
  }

  private runConsciousnessCompetition(
    activations: Map<string, number>,
    attentionResult: { weights: Map<string, number>; output: tf.Tensor1D }
  ): { winners: string[]; broadcastStrength: number } {
    const scores: Array<{ id: string; score: number }> = [];

    for (const [id] of this.neurons) {
      const activation = activations.get(id) || 0;
      const attention = attentionResult.weights.get(id) || 0;
      const score = activation * 0.5 + attention * 0.5;
      scores.push({ id, score });
    }

    scores.sort((a, b) => b.score - a.score);
    const winners = scores.slice(0, 5).map(s => s.id);
    const broadcastStrength = scores.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / 5;

    return { winners, broadcastStrength };
  }

  private async applyLearning(
    inputTensor: tf.Tensor1D,
    activations: Map<string, number>,
    errors: Map<string, number>,
    _surprises: Array<{ id: string; error: number; surprise: number }>
  ): Promise<{ adjustedNeurons: string[]; totalWeightChange: number }> {
    const adjustedNeurons: string[] = [];
    let totalWeightChange = 0;

    for (const [id, neuron] of this.neurons) {
      const error = errors.get(id) || 0;

      const hebbianDelta = this.hebbianLayer.computeWeightDelta(
        inputTensor,
        neuron.actualActivation,
        neuron.learningState.learningRate
      );

      const predictionDelta = neuron.predictionWeights.mul(
        error * this.config.learningConfig.predictionLearningRate
      ) as tf.Tensor2D;

      const newWeights = neuron.weights.add(hebbianDelta) as tf.Tensor2D;
      const newPredictionWeights = neuron.predictionWeights.add(predictionDelta) as tf.Tensor2D;

      const weightChange = (await newWeights.sub(neuron.weights).norm().data())[0];
      totalWeightChange += weightChange;

      neuron.weights.dispose();
      neuron.weights = newWeights;
      neuron.predictionWeights.dispose();
      neuron.predictionWeights = newPredictionWeights;

      neuron.learningState.totalLearningEvents++;
      neuron.learningState.lastLearningAt = Date.now();
      adjustedNeurons.push(id);

      hebbianDelta.dispose();
      predictionDelta.dispose();
    }

    this.stats.totalLearningEvents += adjustedNeurons.length;
    return { adjustedNeurons, totalWeightChange };
  }

  async applyReward(reward: number, context?: { neuronIds?: string[]; decay?: number }): Promise<void> {
    const targetNeurons = context?.neuronIds || Array.from(this.neurons.keys());

    for (const id of targetNeurons) {
      const neuron = this.neurons.get(id);
      if (!neuron) continue;

      const modulatedRate = this.rewardLayer.modulateLearningRate(
        neuron.learningState.learningRate,
        reward,
        context?.decay ?? this.config.learningConfig.rewardDecay
      );

      neuron.learningState.learningRate = modulatedRate;
      neuron.meta.usefulness = Math.max(0, Math.min(1, 
        neuron.meta.usefulness * 0.9 + (reward > 0 ? 0.1 : -0.05)
      ));
    }
  }

  async exportWeights(): Promise<{
    neurons: Array<{
      id: string;
      label: string;
      role: NeuronRole;
      weights: number[];
      bias: number[];
      predictionWeights: number[];
      sensitivityVector: number[];
      learningState: TensorNeuron['learningState'];
      meta: TensorNeuron['meta'];
    }>;
    concepts: TensorConcept[];
    stats: {
      totalProcessing: number;
      totalLearningEvents: number;
      averagePredictionError: number;
      totalSurprise: number;
      gpuMemoryUsed: number;
    };
  }> {
    const neuronsData = [];

    for (const [id, neuron] of this.neurons) {
      neuronsData.push({
        id,
        label: neuron.label,
        role: neuron.role,
        weights: Array.from(await neuron.weights.data()),
        bias: Array.from(await neuron.bias.data()),
        predictionWeights: Array.from(await neuron.predictionWeights.data()),
        sensitivityVector: Array.from(await neuron.sensitivityVector.data()),
        learningState: neuron.learningState,
        meta: neuron.meta,
      });
    }

    const concepts = await this.vsa.exportConcepts();

    return {
      neurons: neuronsData,
      concepts,
      stats: { ...this.stats },
    };
  }

  async importWeights(data: {
    neurons: Array<{
      id: string;
      label: string;
      role: NeuronRole;
      weights: number[];
      bias: number[];
      predictionWeights: number[];
      sensitivityVector: number[];
      learningState: TensorNeuron['learningState'];
      meta: TensorNeuron['meta'];
    }>;
    concepts: TensorConcept[];
  }): Promise<void> {
    for (const id of this.neurons.keys()) {
      this.removeNeuron(id);
    }

    for (const n of data.neurons) {
      const neuron: TensorNeuron = {
        id: n.id,
        label: n.label,
        role: n.role,
        weights: tf.tensor2d(n.weights, [this.config.vsaDimension, 1]),
        bias: tf.tensor1d(n.bias),
        predictionWeights: tf.tensor2d(n.predictionWeights, [this.config.vsaDimension, 1]),
        sensitivityVector: tf.tensor1d(n.sensitivityVector),
        predictedActivation: tf.zeros([1]) as tf.Tensor1D,
        actualActivation: tf.zeros([1]) as tf.Tensor1D,
        predictionError: tf.zeros([1]) as tf.Tensor1D,
        learningState: n.learningState,
        meta: n.meta,
      };
      this.neurons.set(n.id, neuron);
    }

    await this.vsa.importConcepts(data.concepts);
  }

  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  getNeuronCount(): number {
    return this.neurons.size;
  }

  getNeuronIds(): string[] {
    return Array.from(this.neurons.keys());
  }

  getNeuron(id: string): TensorNeuron | undefined {
    return this.neurons.get(id);
  }

  getVSA(): TensorVSA {
    return this.vsa;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  dispose(): void {
    for (const id of this.neurons.keys()) {
      this.removeNeuron(id);
    }
    this.vsa.dispose();
    this.attention.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例管理
// ─────────────────────────────────────────────────────────────────────

const engines = new Map<string, NeuralEngine>();

export function getNeuralEngine(
  userId: string,
  config?: Partial<NeuralEngineConfig>
): NeuralEngine {
  if (!engines.has(userId)) {
    engines.set(userId, new NeuralEngine(config));
  }
  return engines.get(userId)!;
}

export function resetNeuralEngine(userId: string): void {
  const engine = engines.get(userId);
  if (engine) {
    engine.dispose();
    engines.delete(userId);
  }
}
