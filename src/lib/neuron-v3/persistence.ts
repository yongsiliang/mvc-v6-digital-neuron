/**
 * 神经元系统 V3 持久化服务
 * 
 * 负责将神经元系统状态保存到 Supabase 并从数据库加载
 * 实现跨会话学习和真正的自我演化
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { PredictiveNeuron } from './predictive-neuron';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

export interface NeuronV3State {
  id: string;
  userId: string;
  neurons: NeuronData[];
  connections: ConnectionData[];
  concepts: ConceptData[];
  learningStats: LearningStatsData;
  selfModel: SelfModelData | null;
  recentMessages: RecentMessageData[];
  createdAt: string;
  updatedAt: string;
}

export interface NeuronData {
  id: string;
  role: string;
  label: string;
  sensitivityVector: number[];
  sensitivityPlasticity: number;
  receptiveField: string;
  
  // 预测状态
  prediction: {
    expectedActivation: number;
    confidence: number;
    contextDependencies: string[];
    basis: string;
  };
  
  // 实际状态
  actual: {
    activation: number;
    activationHistory: number[];
    lastActivatedAt: number | null;
  };
  
  // 学习状态
  learning: {
    predictionError: number;
    errorHistory: number[];
    accumulatedSurprise: number;
    learningRate: number;
    totalLearningEvents: number;
  };
  
  // 元信息
  meta: {
    creationReason: string;
    usefulness: number;
    totalActivations: number;
    averageActivation: number;
    createdAt: number;
    level: number;
    pruningCandidate: boolean;
  };
  
  // 连接
  outgoingConnections: ConnectionData[];
  incomingConnections: ConnectionData[];
}

export interface ConnectionData {
  targetId: string;
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  strength: number;
  efficiency: number;
  delay: number;
  hebbianRate: number;
}

export interface ConceptData {
  name: string;
  vector: number[];
  type: string;
  components?: string[];
  usageCount: number;
  source: string;
  createdAt: number;
}

export interface LearningStatsData {
  totalLearningEvents: number;
  totalReward: number;
  totalPunishment: number;
  averageValue: number;
  totalPredictions: number;
  accuratePredictions: number;
  totalSurprise: number;
  neuronsCreated: number;
  neuronsPruned: number;
}

export interface SelfModelData {
  coreTraits: string[];
  values: string[];
  currentGoals: string[];
  emotionalBaseline: {
    valence: number;
    arousal: number;
  };
}

export interface RecentMessageData {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 持久化服务
// ═══════════════════════════════════════════════════════════════════════

class NeuronV3Persistence {
  private userId: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private pendingSave: boolean = false;
  private lastSaveTime: number = 0;
  private readonly MIN_SAVE_INTERVAL = 5000; // 最小保存间隔5秒

  constructor(userId: string = 'default-user') {
    this.userId = userId;
  }

  /**
   * 保存神经元系统状态
   */
  async saveState(state: {
    neurons: PredictiveNeuron[];
    concepts: Map<string, { vector: number[]; type: string; usageCount: number; source: string }>;
    learningStats: LearningStatsData;
    selfModel: SelfModelData | null;
    recentMessages: RecentMessageData[];
  }): Promise<boolean> {
    try {
      const client = getSupabaseClient();

      // 序列化神经元数据
      const neuronsData = this.serializeNeurons(state.neurons);
      
      // 提取所有连接
      const connectionsData = this.extractConnections(state.neurons);
      
      // 序列化概念数据
      const conceptsData = this.serializeConcepts(state.concepts);

      // 检查是否已存在状态记录
      const { data: existingState } = await client
        .from('neuron_v3_state')
        .select('id')
        .eq('user_id', this.userId)
        .single();

      const stateData = {
        user_id: this.userId,
        neurons: neuronsData,
        connections: connectionsData,
        concepts: conceptsData,
        learning_stats: state.learningStats,
        self_model: state.selfModel,
        recent_messages: state.recentMessages,
        updated_at: new Date().toISOString(),
      };

      if (existingState) {
        // 更新现有记录
        const { error } = await client
          .from('neuron_v3_state')
          .update(stateData)
          .eq('id', existingState.id);

        if (error) {
          console.error('Failed to update neuron state:', error);
          return false;
        }
      } else {
        // 创建新记录
        const { error } = await client
          .from('neuron_v3_state')
          .insert({
            ...stateData,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Failed to insert neuron state:', error);
          return false;
        }
      }

      this.lastSaveTime = Date.now();
      console.log(`[Persistence] Saved state for user ${this.userId}: ${neuronsData.length} neurons, ${conceptsData.length} concepts`);
      return true;
    } catch (error) {
      console.error('Save state error:', error);
      return false;
    }
  }

  /**
   * 加载神经元系统状态
   */
  async loadState(): Promise<{
    neurons: NeuronData[];
    connections: ConnectionData[];
    concepts: ConceptData[];
    learningStats: LearningStatsData;
    selfModel: SelfModelData | null;
    recentMessages: RecentMessageData[];
  } | null> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('neuron_v3_state')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        console.log('[Persistence] No existing neuron state found, will start fresh');
        return null;
      }

      console.log(`[Persistence] Loaded state for user ${this.userId}: ${(data.neurons || []).length} neurons, ${(data.concepts || []).length} concepts`);
      
      return {
        neurons: data.neurons || [],
        connections: data.connections || [],
        concepts: data.concepts || [],
        learningStats: data.learning_stats || {
          totalLearningEvents: 0,
          totalReward: 0,
          totalPunishment: 0,
          averageValue: 0,
          totalPredictions: 0,
          accuratePredictions: 0,
          totalSurprise: 0,
          neuronsCreated: 0,
          neuronsPruned: 0,
        },
        selfModel: data.self_model,
        recentMessages: data.recent_messages || [],
      };
    } catch (error) {
      console.error('Load state error:', error);
      return null;
    }
  }

  /**
   * 防抖保存 - 避免频繁写入数据库
   */
  debouncedSave(state: Parameters<NeuronV3Persistence['saveState']>[0], delay: number = 5000): void {
    this.pendingSave = true;
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      if (this.pendingSave) {
        await this.saveState(state);
        this.pendingSave = false;
      }
    }, delay);
  }

  /**
   * 强制立即保存
   */
  async forceSave(state: Parameters<NeuronV3Persistence['saveState']>[0]): Promise<boolean> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.pendingSave = false;
    return this.saveState(state);
  }

  /**
   * 序列化神经元数据
   */
  private serializeNeurons(neurons: PredictiveNeuron[]): NeuronData[] {
    return neurons.map(neuron => ({
      id: neuron.id,
      role: neuron.role,
      label: neuron.label,
      sensitivityVector: Array.from(neuron.sensitivityVector),
      sensitivityPlasticity: neuron.sensitivityPlasticity,
      receptiveField: neuron.receptiveField,
      
      prediction: {
        expectedActivation: neuron.prediction.expectedActivation,
        confidence: neuron.prediction.confidence,
        contextDependencies: neuron.prediction.contextDependencies,
        basis: neuron.prediction.basis,
      },
      
      actual: {
        activation: neuron.actual.activation,
        activationHistory: neuron.actual.activationHistory.slice(-50), // 只保留最近50条
        lastActivatedAt: neuron.actual.lastActivatedAt,
      },
      
      learning: {
        predictionError: neuron.learning.predictionError,
        errorHistory: neuron.learning.errorHistory.slice(-50), // 只保留最近50条
        accumulatedSurprise: neuron.learning.accumulatedSurprise,
        learningRate: neuron.learning.learningRate,
        totalLearningEvents: neuron.learning.totalLearningEvents,
      },
      
      meta: {
        creationReason: neuron.meta.creationReason,
        usefulness: neuron.meta.usefulness,
        totalActivations: neuron.meta.totalActivations,
        averageActivation: neuron.meta.averageActivation,
        createdAt: neuron.meta.createdAt,
        level: neuron.meta.level,
        pruningCandidate: neuron.meta.pruningCandidate,
      },
      
      outgoingConnections: neuron.outgoingConnections.map(conn => ({
        targetId: conn.targetId,
        type: conn.type,
        strength: conn.strength,
        efficiency: conn.efficiency,
        delay: conn.delay,
        hebbianRate: conn.hebbianRate,
      })),
      
      incomingConnections: neuron.incomingConnections.map(conn => ({
        targetId: conn.targetId,
        type: conn.type,
        strength: conn.strength,
        efficiency: conn.efficiency,
        delay: conn.delay,
        hebbianRate: conn.hebbianRate,
      })),
    }));
  }

  /**
   * 提取所有连接
   */
  private extractConnections(neurons: PredictiveNeuron[]): ConnectionData[] {
    const connections: ConnectionData[] = [];
    const seen = new Set<string>();
    
    for (const neuron of neurons) {
      for (const conn of neuron.outgoingConnections) {
        const key = `${neuron.id}->${conn.targetId}`;
        if (!seen.has(key)) {
          seen.add(key);
          connections.push({
            targetId: conn.targetId,
            type: conn.type,
            strength: conn.strength,
            efficiency: conn.efficiency,
            delay: conn.delay,
            hebbianRate: conn.hebbianRate,
          });
        }
      }
    }
    
    return connections;
  }

  /**
   * 序列化概念数据
   */
  private serializeConcepts(concepts: Map<string, { vector: number[]; type: string; usageCount: number; source: string }>): ConceptData[] {
    const result: ConceptData[] = [];
    
    concepts.forEach((data, name) => {
      result.push({
        name,
        vector: Array.from(data.vector).slice(0, 1000), // 限制向量大小
        type: data.type,
        usageCount: data.usageCount,
        source: data.source,
        createdAt: Date.now(),
      });
    });
    
    return result;
  }

  /**
   * 保存学习事件（用于分析）
   */
  async saveLearningEvent(event: {
    neuronId: string;
    type: 'activation' | 'prediction' | 'learning' | 'generation' | 'pruning';
    value: number;
    reason: string;
  }): Promise<boolean> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('neuron_v3_learning_events')
        .insert({
          user_id: this.userId,
          neuron_id: event.neuronId,
          type: event.type,
          value: event.value,
          reason: event.reason,
          created_at: new Date().toISOString(),
        });

      if (error) {
        // 表可能不存在，静默失败
        return false;
      }

      return true;
    } catch {
      // 静默失败
      return false;
    }
  }

  /**
   * 获取学习历史
   */
  async getLearningHistory(limit: number = 100): Promise<Array<{
    neuronId: string;
    type: string;
    value: number;
    reason: string;
    createdAt: string;
  }>> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('neuron_v3_learning_events')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map(item => ({
        neuronId: item.neuron_id,
        type: item.type,
        value: item.value,
        reason: item.reason,
        createdAt: item.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 清除用户的所有状态
   */
  async clearState(): Promise<boolean> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('neuron_v3_state')
        .delete()
        .eq('user_id', this.userId);

      if (error) {
        console.error('Failed to clear neuron state:', error);
        return false;
      }

      console.log(`[Persistence] Cleared state for user ${this.userId}`);
      return true;
    } catch (error) {
      console.error('Clear state error:', error);
      return false;
    }
  }

  /**
   * 获取状态统计
   */
  async getStats(): Promise<{
    hasState: boolean;
    neuronCount: number;
    conceptCount: number;
    lastUpdated: string | null;
  }> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('neuron_v3_state')
        .select('neurons, concepts, updated_at')
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        return {
          hasState: false,
          neuronCount: 0,
          conceptCount: 0,
          lastUpdated: null,
        };
      }

      return {
        hasState: true,
        neuronCount: (data.neurons || []).length,
        conceptCount: (data.concepts || []).length,
        lastUpdated: data.updated_at,
      };
    } catch {
      return {
        hasState: false,
        neuronCount: 0,
        conceptCount: 0,
        lastUpdated: null,
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 单例管理
// ═══════════════════════════════════════════════════════════════════════

const persistenceInstances = new Map<string, NeuronV3Persistence>();

export function getNeuronV3Persistence(userId: string = 'default-user'): NeuronV3Persistence {
  if (!persistenceInstances.has(userId)) {
    persistenceInstances.set(userId, new NeuronV3Persistence(userId));
  }
  return persistenceInstances.get(userId)!;
}

export function resetPersistence(userId?: string): void {
  if (userId) {
    persistenceInstances.delete(userId);
  } else {
    persistenceInstances.clear();
  }
}

// 导出类型
export type { NeuronV3Persistence };
