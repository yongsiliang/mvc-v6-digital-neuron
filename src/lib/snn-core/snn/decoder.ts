/**
 * ═══════════════════════════════════════════════════════════════════════
 * 脉冲解码器 - 脉冲到文本的转换
 * 
 * 将 SNN 的输出脉冲解码为有意义的文本/数值
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  NeuronId,
  NeuronRegion,
  Spike,
  SpikeTrain,
  SpikeToTextResult,
  NetworkSnapshot,
  ActivationPattern
} from '../types';

/**
 * 脉冲解码器
 */
export class SpikeDecoder {
  // 神经元到概念/意义的映射
  private neuronToMeaning: Map<NeuronId, string> = new Map();
  private meaningToNeurons: Map<string, NeuronId[]> = new Map();
  
  // 模式库
  private patternLibrary: Map<string, { meaning: string; confidence: number }> = new Map();

  /**
   * 注册神经元意义
   */
  registerMeaning(neuronId: NeuronId, meaning: string): void {
    this.neuronToMeaning.set(neuronId, meaning);
    
    const neurons = this.meaningToNeurons.get(meaning) || [];
    if (!neurons.includes(neuronId)) {
      neurons.push(neuronId);
      this.meaningToNeurons.set(meaning, neurons);
    }
  }

  /**
   * 注册模式
   */
  registerPattern(patternId: string, meaning: string, confidence: number): void {
    this.patternLibrary.set(patternId, { meaning, confidence });
  }

  /**
   * 解码脉冲序列为数值
   */
  decodeToValue(spikeTrains: Map<NeuronId, SpikeTrain>): number {
    let totalSpikes = 0;
    let totalNeurons = 0;
    
    for (const [, train] of spikeTrains) {
      totalSpikes += train.spikes.length;
      totalNeurons++;
    }
    
    // 归一化到 [0, 1]
    const avgSpikes = totalNeurons > 0 ? totalSpikes / totalNeurons : 0;
    return Math.min(1, avgSpikes / 50);  // 假设最大 50 个脉冲/神经元
  }

  /**
   * 解码输出层脉冲为文本
   */
  decode(
    outputSpikes: Spike[],
    snapshot: NetworkSnapshot,
    outputNeuronIds: NeuronId[]
  ): SpikeToTextResult {
    // 统计每个输出神经元的脉冲数
    const spikeCounts = new Map<NeuronId, number>();
    for (const neuronId of outputNeuronIds) {
      spikeCounts.set(neuronId, 0);
    }
    
    for (const spike of outputSpikes) {
      if (spikeCounts.has(spike.neuronId)) {
        spikeCounts.set(spike.neuronId, spikeCounts.get(spike.neuronId)! + 1);
      }
    }
    
    // 找出活跃的神经元
    const activeNeurons = Array.from(spikeCounts.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    
    // 解码为概念
    const concepts: string[] = [];
    for (const [neuronId, count] of activeNeurons) {
      const meaning = this.neuronToMeaning.get(neuronId);
      if (meaning) {
        concepts.push(meaning);
      }
    }
    
    // 如果没有直接映射，尝试模式匹配
    if (concepts.length === 0) {
      const patternMatch = this.matchPattern(activeNeurons.map(([id]) => id));
      if (patternMatch) {
        concepts.push(patternMatch);
      }
    }
    
    // 计算置信度
    const totalOutputSpikes = activeNeurons.reduce((sum, [, c]) => sum + c, 0);
    const confidence = Math.min(1, totalOutputSpikes / 20);
    
    // 生成文本
    const text = concepts.length > 0 
      ? concepts.join(' ')
      : `[活动模式: ${activeNeurons.length}个神经元, 总脉冲: ${totalOutputSpikes}]`;
    
    return {
      text,
      confidence,
      decoding: {
        activePatterns: concepts,
        dominantRegion: 'output',
        processingTime: snapshot.timestamp
      }
    };
  }

  /**
   * 尝试匹配已知模式
   */
  private matchPattern(activeNeuronIds: NeuronId[]): string | null {
    // 简单匹配：检查是否有已知模式的神经元子集
    for (const [patternId, { meaning, confidence }] of this.patternLibrary) {
      // 如果有高置信度，返回
      if (confidence > 0.7) {
        return meaning;
      }
    }
    
    return null;
  }

  /**
   * 解码网络状态为描述文本
   */
  decodeState(snapshot: NetworkSnapshot): string {
    const parts: string[] = [];
    
    // 网络整体状态
    parts.push(`网络状态 [t=${snapshot.timestamp}]:`);
    parts.push(`  神经元: ${snapshot.stats.totalNeurons}, 突触: ${snapshot.stats.totalSynapses}`);
    parts.push(`  发放率: ${(snapshot.stats.firingRate * 100).toFixed(1)}%`);
    parts.push(`  平均电位: ${snapshot.stats.avgPotential.toFixed(3)}`);
    
    // 激活模式
    if (snapshot.activeNeurons.length > 0) {
      parts.push(`  活跃神经元: ${snapshot.activeNeurons.length}个`);
    }
    
    // 电位分布
    parts.push(`  电位分布: ${snapshot.potentialDistribution.min.toFixed(2)} ~ ${snapshot.potentialDistribution.max.toFixed(2)}`);
    
    return parts.join('\n');
  }

  /**
   * 解码激活模式为描述
   */
  decodePattern(pattern: ActivationPattern): string {
    const parts: string[] = [];
    
    parts.push(`激活模式 #${pattern.id}:`);
    parts.push(`  神经元数: ${pattern.neuronIds.length}`);
    parts.push(`  发放神经元: ${pattern.firingNeurons.length}`);
    parts.push(`  强度: ${(pattern.intensity * 100).toFixed(0)}%`);
    parts.push(`  一致性: ${(pattern.coherence * 100).toFixed(0)}%`);
    
    // 尝试解码为概念
    const concepts = pattern.firingNeurons
      .map(id => this.neuronToMeaning.get(id))
      .filter(Boolean);
    
    if (concepts.length > 0) {
      parts.push(`  概念: ${concepts.join(', ')}`);
    }
    
    return parts.join('\n');
  }

  /**
   * 将脉冲活动转换为情绪标记
   */
  decodeEmotion(snapshot: NetworkSnapshot): {
    valence: number;  // -1 (负面) 到 1 (正面)
    arousal: number;  // 0 (平静) 到 1 (激动)
    label: string;
  } {
    const { stats, potentialDistribution } = snapshot;
    
    // 唤醒度基于发放率
    const arousal = Math.min(1, stats.firingRate * 5);
    
    // 效价基于电位分布的对称性 (简化)
    const skewness = potentialDistribution.mean - 0.5;
    const valence = Math.max(-1, Math.min(1, skewness * 2));
    
    // 生成标签
    let label = '中性';
    if (arousal > 0.7) {
      label = valence > 0 ? '兴奋' : '焦虑';
    } else if (arousal > 0.3) {
      label = valence > 0 ? '愉悦' : '低落';
    } else {
      label = valence > 0 ? '平静' : '疲惫';
    }
    
    return { valence, arousal, label };
  }

  /**
   * 导出神经元意义映射
   */
  exportMeanings(): Array<{ neuronId: NeuronId; meaning: string }> {
    return Array.from(this.neuronToMeaning.entries())
      .map(([neuronId, meaning]) => ({ neuronId, meaning }));
  }

  /**
   * 导入神经元意义映射
   */
  importMeanings(meanings: Array<{ neuronId: NeuronId; meaning: string }>): void {
    for (const { neuronId, meaning } of meanings) {
      this.registerMeaning(neuronId, meaning);
    }
  }

  /**
   * 清空映射
   */
  clear(): void {
    this.neuronToMeaning.clear();
    this.meaningToNeurons.clear();
    this.patternLibrary.clear();
  }
}

/**
 * 创建脉冲解码器
 */
export function createSpikeDecoder(): SpikeDecoder {
  return new SpikeDecoder();
}
