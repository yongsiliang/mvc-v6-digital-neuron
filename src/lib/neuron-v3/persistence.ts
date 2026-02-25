/**
 * 神经元系统 V3 持久化服务
 * 
 * 负责将神经元系统状态保存到 Supabase 并从数据库加载
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { PredictiveNeuron } from '@/lib/neuron-v3/predictive-neuron';

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
  createdAt: string;
  updatedAt: string;
}

export interface NeuronData {
  id: string;
  role: string;
  label: string;
  sensitivityVector: number[];
  actual: {
    activation: number;
    prediction: number;
    predictionError: number;
    lastActivatedAt: number;
    lastPredictedAt: number;
  };
  learning: {
    totalActivations: number;
    totalPredictions: number;
    averageError: number;
    utility: number;
  };
}

export interface ConnectionData {
  fromNeuronId: string;
  toNeuronId: string;
  weight: number;
  type: 'excitatory' | 'inhibitory';
}

export interface ConceptData {
  name: string;
  vector: number[];
  createdAt: number;
  accessCount: number;
}

export interface LearningStatsData {
  totalLearningEvents: number;
  totalReward: number;
  totalPunishment: number;
  averageValue: number;
}

export interface SelfModelData {
  coreTraits: string[];
  values: string[];
  beliefs: string[];
  strengths: string[];
  limitations: string[];
  growthAreas: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// 持久化服务
// ═══════════════════════════════════════════════════════════════════════

class NeuronV3Persistence {
  private userId: string;

  constructor(userId: string = 'default-user') {
    this.userId = userId;
  }

  /**
   * 保存神经元系统状态
   */
  async saveState(state: Omit<NeuronV3State, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const client = getSupabaseClient();

      // 检查是否已存在状态记录
      const { data: existingState } = await client
        .from('neuron_v3_states')
        .select('id')
        .eq('user_id', this.userId)
        .single();

      const stateData = {
        user_id: this.userId,
        neurons: state.neurons,
        connections: state.connections,
        concepts: state.concepts,
        learning_stats: state.learningStats,
        self_model: state.selfModel,
        updated_at: new Date().toISOString(),
      };

      if (existingState) {
        // 更新现有记录
        const { error } = await client
          .from('neuron_v3_states')
          .update(stateData)
          .eq('id', existingState.id);

        if (error) {
          console.error('Failed to update neuron state:', error);
          return false;
        }
      } else {
        // 创建新记录
        const { error } = await client
          .from('neuron_v3_states')
          .insert({
            ...stateData,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Failed to insert neuron state:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Save state error:', error);
      return false;
    }
  }

  /**
   * 加载神经元系统状态
   */
  async loadState(): Promise<NeuronV3State | null> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('neuron_v3_states')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        console.log('No existing neuron state found');
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        neurons: data.neurons || [],
        connections: data.connections || [],
        concepts: data.concepts || [],
        learningStats: data.learning_stats || {
          totalLearningEvents: 0,
          totalReward: 0,
          totalPunishment: 0,
          averageValue: 0,
        },
        selfModel: data.self_model,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Load state error:', error);
      return null;
    }
  }

  /**
   * 保存学习事件
   */
  async saveLearningEvent(event: {
    neuronId: string;
    type: string;
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
          event_type: event.type,
          value: event.value,
          reason: event.reason,
          created_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Save learning event error:', error);
      return false;
    }
  }

  /**
   * 获取学习历史
   */
  async getLearningHistory(limit: number = 100): Promise<Array<{
    id: string;
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
        id: item.id,
        neuronId: item.neuron_id,
        type: item.event_type,
        value: item.value,
        reason: item.reason,
        createdAt: item.created_at,
      }));
    } catch (error) {
      console.error('Get learning history error:', error);
      return [];
    }
  }

  /**
   * 清除所有状态
   */
  async clearState(): Promise<boolean> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('neuron_v3_states')
        .delete()
        .eq('user_id', this.userId);

      return !error;
    } catch (error) {
      console.error('Clear state error:', error);
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 单例导出
// ═══════════════════════════════════════════════════════════════════════

let persistenceInstance: NeuronV3Persistence | null = null;

export function getNeuronV3Persistence(userId?: string): NeuronV3Persistence {
  if (!persistenceInstance || (userId && persistenceInstance['userId'] !== userId)) {
    persistenceInstance = new NeuronV3Persistence(userId);
  }
  return persistenceInstance;
}

export function resetNeuronV3Persistence(): void {
  persistenceInstance = null;
}
