/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎 - 数据库操作
 * Neural Computing Engine - Database Operations
 * ═══════════════════════════════════════════════════════════════════════
 */

import { eq, and } from 'drizzle-orm';
import { db } from '@/storage';
import {
  neuralEngineNeurons,
  neuralEngineConcepts,
  neuralEngineState,
  type NeuralEngineNeuron,
  type NeuralEngineConcept,
  type NeuralEngineStateRow,
} from './schema';
import type { NeuronRole } from './neural-engine';

// ─────────────────────────────────────────────────────────────────────
// 神经元操作
// ─────────────────────────────────────────────────────────────────────

// 扩展的神经元数据类型（用于数据库存储）
interface NeuronData {
  id: string;
  label: string;
  role: NeuronRole;
  weights: number[];
  bias: number[];
  predictionWeights: number[];
  sensitivityVector: number[];
  learningState: {
    learningRate: number;
    accumulatedSurprise: number;
    totalLearningEvents: number;
    lastLearningAt: number | null;
  };
  meta: {
    level: number;
    usefulness: number;
    totalActivations: number;
  };
}

/**
 * 保存神经元到数据库
 */
export async function saveNeuron(
  userId: string,
  neuron: NeuronData
): Promise<void> {
  // 将一维数组转换为二维数组存储（适配数据库 JSONB 格式）
  const weights2D = neuron.weights.length > 0 ? [neuron.weights] : [];
  const predWeights2D = neuron.predictionWeights.length > 0 ? [neuron.predictionWeights] : [];
  
  const neuronData = {
    userId,
    engineId: neuron.id,
    label: neuron.label,
    role: neuron.role,
    level: neuron.meta.level,
    weights: weights2D,
    bias: neuron.bias,
    predictionWeights: predWeights2D,
    sensitivityVector: neuron.sensitivityVector,
    predictedActivation: [0], // 默认值
    actualActivation: [0], // 默认值
    predictionError: [0], // 默认值
    learningRate: neuron.learningState.learningRate,
    accumulatedSurprise: neuron.learningState.accumulatedSurprise,
    totalLearningEvents: neuron.learningState.totalLearningEvents,
    lastLearningAt: neuron.learningState.lastLearningAt ? new Date(neuron.learningState.lastLearningAt).toISOString() : null,
    usefulness: neuron.meta.usefulness,
    totalActivations: neuron.meta.totalActivations,
    updatedAt: new Date().toISOString(),
  };
  
  try {
    // Upsert: 先尝试更新，如果不存在则插入
    const existing = await db
      .select()
      .from(neuralEngineNeurons)
      .where(and(
        eq(neuralEngineNeurons.userId, userId),
        eq(neuralEngineNeurons.engineId, neuron.id)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(neuralEngineNeurons)
        .set(neuronData)
        .where(eq(neuralEngineNeurons.id, existing[0].id));
    } else {
      await db.insert(neuralEngineNeurons).values(neuronData);
    }
  } catch (error) {
    // 数据库表可能不存在，静默失败
    console.warn('[DB] Failed to save neuron (table may not exist):', error instanceof Error ? error.message : String(error));
  }
}

/**
 * 加载用户的所有神经元
 */
export async function loadNeurons(userId: string): Promise<NeuralEngineNeuron[]> {

  const neurons = await db
    .select()
    .from(neuralEngineNeurons)
    .where(eq(neuralEngineNeurons.userId, userId));
  
  return neurons;
}

/**
 * 删除神经元
 */
export async function deleteNeuron(userId: string, engineId: string): Promise<void> {

  await db
    .delete(neuralEngineNeurons)
    .where(and(
      eq(neuralEngineNeurons.userId, userId),
      eq(neuralEngineNeurons.engineId, engineId)
    ));
}

/**
 * 删除用户的所有神经元
 */
export async function deleteAllNeurons(userId: string): Promise<void> {

  await db
    .delete(neuralEngineNeurons)
    .where(eq(neuralEngineNeurons.userId, userId));
}

// ─────────────────────────────────────────────────────────────────────
// 概念操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存概念到数据库
 */
export async function saveConcept(
  userId: string,
  concept: {
    name: string;
    vector: number[];
    type?: string;
    role?: string;
    relatedConcepts?: string[];
    dimension?: number;
  }
): Promise<void> {

  const conceptData = {
    userId,
    name: concept.name,
    type: concept.type || 'concept',
    vector: concept.vector,
    dimension: concept.dimension || concept.vector.length,
    role: concept.role || null,
    relatedConcepts: concept.relatedConcepts || [],
    usageCount: 0,
    updatedAt: new Date().toISOString(),
  };
  
  const existing = await db
    .select()
    .from(neuralEngineConcepts)
    .where(and(
      eq(neuralEngineConcepts.userId, userId),
      eq(neuralEngineConcepts.name, concept.name)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db
      .update(neuralEngineConcepts)
      .set({
        ...conceptData,
        usageCount: existing[0].usageCount + 1,
      })
      .where(eq(neuralEngineConcepts.id, existing[0].id));
  } else {
    await db.insert(neuralEngineConcepts).values(conceptData);
  }
}

/**
 * 加载用户的所有概念
 */
export async function loadConcepts(userId: string): Promise<NeuralEngineConcept[]> {

  const concepts = await db
    .select()
    .from(neuralEngineConcepts)
    .where(eq(neuralEngineConcepts.userId, userId));
  
  return concepts;
}

/**
 * 删除概念
 */
export async function deleteConcept(userId: string, name: string): Promise<void> {

  await db
    .delete(neuralEngineConcepts)
    .where(and(
      eq(neuralEngineConcepts.userId, userId),
      eq(neuralEngineConcepts.name, name)
    ));
}

// ─────────────────────────────────────────────────────────────────────
// 引擎状态操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存引擎状态
 */
export async function saveEngineState(
  userId: string,
  state: {
    vsaDimension: number;
    maxNeurons: number;
    learningConfig: {
      hebbianRate: number;
      predictionLearningRate: number;
      rewardDecay: number;
      tdLambda: number;
    };
    stats: {
      totalProcessing: number;
      totalLearningEvents: number;
      averagePredictionError: number;
      totalSurprise: number;
    };
  }
): Promise<void> {

  const stateData = {
    userId,
    vsaDimension: state.vsaDimension,
    maxNeurons: state.maxNeurons,
    learningConfig: state.learningConfig,
    totalProcessing: state.stats.totalProcessing,
    totalLearningEvents: state.stats.totalLearningEvents,
    averagePredictionError: state.stats.averagePredictionError,
    totalSurprise: state.stats.totalSurprise,
    updatedAt: new Date().toISOString(),
  };
  
  const existing = await db
    .select()
    .from(neuralEngineState)
    .where(eq(neuralEngineState.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    await db
      .update(neuralEngineState)
      .set(stateData)
      .where(eq(neuralEngineState.id, existing[0].id));
  } else {
    await db.insert(neuralEngineState).values(stateData);
  }
}

/**
 * 加载引擎状态
 */
export async function loadEngineState(userId: string): Promise<NeuralEngineStateRow | null> {
  const states = await db
    .select()
    .from(neuralEngineState)
    .where(eq(neuralEngineState.userId, userId))
    .limit(1);
  
  return states[0] || null;
}

// ─────────────────────────────────────────────────────────────────────
// 批量操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存完整的引擎状态（神经元 + 概念 + 状态）
 */
export async function saveCompleteEngineState(
  userId: string,
  data: {
    neurons: Array<{
      id: string;
      label: string;
      role: NeuronRole;
      weights: number[];
      bias: number[];
      predictionWeights: number[];
      sensitivityVector: number[];
      learningState: {
        learningRate: number;
        accumulatedSurprise: number;
        totalLearningEvents: number;
        lastLearningAt: number | null;
      };
      meta: {
        level: number;
        usefulness: number;
        totalActivations: number;
      };
    }>;
    concepts: Array<{
      name: string;
      vector: number[];
      type?: string;
      role?: string;
    }>;
    engineConfig: {
      vsaDimension: number;
      maxNeurons: number;
      learningConfig: {
        hebbianRate: number;
        predictionLearningRate: number;
        rewardDecay: number;
        tdLambda: number;
      };
    };
    stats: {
      totalProcessing: number;
      totalLearningEvents: number;
      averagePredictionError: number;
      totalSurprise: number;
    };
  }
): Promise<void> {
  // 并行保存所有数据
  await Promise.all([
    // 保存神经元
    ...data.neurons.map(n => saveNeuron(userId, n)),
    // 保存概念
    ...data.concepts.map(c => saveConcept(userId, c)),
    // 保存引擎状态
    saveEngineState(userId, {
      vsaDimension: data.engineConfig.vsaDimension,
      maxNeurons: data.engineConfig.maxNeurons,
      learningConfig: data.engineConfig.learningConfig,
      stats: data.stats,
    }),
  ]);
}

/**
 * 清除用户的所有引擎数据
 */
export async function clearAllEngineData(userId: string): Promise<void> {
  await Promise.all([
    db.delete(neuralEngineNeurons).where(eq(neuralEngineNeurons.userId, userId)),
    db.delete(neuralEngineConcepts).where(eq(neuralEngineConcepts.userId, userId)),
    db.delete(neuralEngineState).where(eq(neuralEngineState.userId, userId)),
  ]);
}
