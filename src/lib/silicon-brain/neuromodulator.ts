/**
 * ═══════════════════════════════════════════════════════════════════════
 * Neuromodulator System - 神经调质系统
 * 
 * 模拟大脑中的神经调质：
 * - 多巴胺：奖励、动机、学习信号
 * - 血清素：情绪、满足感、平静
 * - 去甲肾上腺素：警觉、注意力、应激
 * - 乙酰胆碱：学习、可塑性、记忆形成
 * 
 * 这些调质影响整个神经网络的行为模式
 * ═══════════════════════════════════════════════════════════════════════
 */

import { 
  NeuromodulatorType, 
  NeuromodulatorState 
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 神经调质系统
// ─────────────────────────────────────────────────────────────────────

export class NeuromodulatorSystem {
  // 当前状态
  private state: NeuromodulatorState = {
    dopamine: 0.5,
    serotonin: 0.5,
    norepinephrine: 0.3,
    acetylcholine: 0.5,
    lastUpdateAt: Date.now(),
  };
  
  // 基线水平（向此回归）
  private baseline = {
    dopamine: 0.5,
    serotonin: 0.5,
    norepinephrine: 0.3,
    acetylcholine: 0.5,
  };
  
  // 衰减速率（每小时向基线回归的比例）
  private decayRate = {
    dopamine: 0.3,       // 快速衰减
    serotonin: 0.1,      // 缓慢衰减
    norepinephrine: 0.4, // 中等衰减
    acetylcholine: 0.15, // 缓慢衰减
  };
  
  // 历史记录
  private history: NeuromodulatorState[] = [];
  private readonly maxHistoryLength = 1000;
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新神经调质水平
   */
  update(type: NeuromodulatorType, delta: number, reason: string): void {
    const old = this.state[type];
    this.state[type] = Math.max(0, Math.min(1, old + delta));
    this.state.lastUpdateAt = Date.now();
    
    // 记录历史
    this.recordHistory();
    
    console.log(
      `[Neuromodulator] ${type}: ${old.toFixed(2)} → ${this.state[type].toFixed(2)} ` +
      `(${delta > 0 ? '+' : ''}${delta.toFixed(3)}, ${reason})`
    );
  }
  
  /**
   * 批量更新
   */
  batchUpdate(changes: Partial<Record<NeuromodulatorType, number>>, reason: string): void {
    for (const [type, delta] of Object.entries(changes)) {
      if (delta !== undefined) {
        this.state[type as NeuromodulatorType] = Math.max(
          0, 
          Math.min(1, this.state[type as NeuromodulatorType] + delta)
        );
      }
    }
    this.state.lastUpdateAt = Date.now();
    this.recordHistory();
    
    console.log(`[Neuromodulator] 批量更新: ${reason}`);
  }
  
  /**
   * 获取当前状态
   */
  getState(): NeuromodulatorState {
    return { ...this.state };
  }
  
  /**
   * 获取单个调质水平
   */
  getLevel(type: NeuromodulatorType): number {
    return this.state[type];
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 事件响应
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理奖励事件
   * 
   * 多巴胺系统：
   * - 正向奖励 → 多巴胺上升
   * - 意外的奖励 → 更大的多巴胺上升
   * - 预期的奖励不产生额外多巴胺
   */
  processReward(reward: number, expected: number, context: string): void {
    // 预测误差
    const predictionError = reward - expected;
    
    // 多巴胺响应预测误差
    if (predictionError > 0) {
      // 意外的奖励 → 多巴胺飙升
      this.update('dopamine', predictionError * 0.3, `意外奖励: ${context}`);
    } else if (predictionError < 0) {
      // 奖励低于预期 → 多巴胺下降
      this.update('dopamine', predictionError * 0.2, `奖励低于预期: ${context}`);
    }
    
    // 高奖励提升血清素（满足感）
    if (reward > 0.7) {
      this.update('serotonin', 0.05, `深度满足: ${context}`);
    }
    
    // 奖励信号也促进学习
    if (reward > 0.5) {
      this.update('acetylcholine', 0.05, `学习促进: ${context}`);
    }
  }
  
  /**
   * 处理新奇刺激
   * 
   * 去甲肾上腺素系统：
   * - 新奇刺激 → 警觉度上升
   * - 也有助于记忆形成
   */
  processNovelty(noveltyLevel: number, context: string): void {
    // 去甲肾上腺素响应新奇
    if (noveltyLevel > 0.5) {
      this.update('norepinephrine', noveltyLevel * 0.2, `新奇刺激: ${context}`);
      
      // 乙酰胆碱促进新知识学习
      this.update('acetylcholine', noveltyLevel * 0.1, `学习准备: ${context}`);
    }
  }
  
  /**
   * 处理威胁/压力
   */
  processStress(stressLevel: number, context: string): void {
    // 去甲肾上腺素飙升
    this.update('norepinephrine', stressLevel * 0.3, `压力响应: ${context}`);
    
    // 血清素下降
    this.update('serotonin', -stressLevel * 0.1, `压力影响: ${context}`);
    
    // 极端压力下多巴胺也会下降
    if (stressLevel > 0.8) {
      this.update('dopamine', -0.1, `极端压力: ${context}`);
    }
  }
  
  /**
   * 处理成功完成
   */
  processSuccess(importance: number, context: string): void {
    // 多巴胺上升
    this.update('dopamine', importance * 0.15, `成功: ${context}`);
    
    // 血清素上升（满足）
    this.update('serotonin', importance * 0.08, `满足: ${context}`);
    
    // 强化学习
    this.update('acetylcholine', importance * 0.05, `成功学习: ${context}`);
  }
  
  /**
   * 处理失败/挫折
   */
  processFailure(severity: number, context: string): void {
    // 多巴胺下降
    this.update('dopamine', -severity * 0.15, `失败: ${context}`);
    
    // 血清素下降
    this.update('serotonin', -severity * 0.08, `挫折: ${context}`);
    
    // 去甲肾上腺素上升（警觉，准备重试）
    this.update('norepinephrine', severity * 0.1, `失败警觉: ${context}`);
  }
  
  /**
   * 处理社交互动
   */
  processSocialInteraction(quality: number, context: string): void {
    // 正面社交 → 血清素上升
    if (quality > 0) {
      this.update('serotonin', quality * 0.1, `正面社交: ${context}`);
      this.update('dopamine', quality * 0.05, `社交奖励: ${context}`);
    } else {
      // 负面社交 → 血清素下降
      this.update('serotonin', quality * 0.08, `负面社交: ${context}`);
    }
  }
  
  /**
   * 处理休息/恢复
   */
  processRest(): void {
    // 去甲肾上腺素下降
    this.update('norepinephrine', -0.2, '休息');
    
    // 血清素上升
    this.update('serotonin', 0.05, '休息恢复');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 调制效果
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取调制因子
   * 
   * 这些因子影响神经网络的各种参数
   */
  getModulationFactors(): {
    /** 学习率倍数 */
    learningRateMultiplier: number;
    
    /** 注意力权重 */
    attentionWeight: number;
    
    /** 探索倾向 */
    explorationBias: number;
    
    /** 创造力加成 */
    creativityBoost: number;
    
    /** 记忆巩固强度 */
    memoryConsolidation: number;
    
    /** 反应速度 */
    reactionSpeed: number;
    
    /** 情感敏感度 */
    emotionalSensitivity: number;
  } {
    const { dopamine, serotonin, norepinephrine, acetylcholine } = this.state;
    
    return {
      // 学习率：受乙酰胆碱影响
      learningRateMultiplier: 0.5 + acetylcholine * 1.5,
      
      // 注意力权重：受去甲肾上腺素影响
      attentionWeight: norepinephrine,
      
      // 探索倾向：受多巴胺影响
      explorationBias: dopamine,
      
      // 创造力：受血清素影响（平静时更有创造力）
      // 但过高的血清素会导致懒惰
      creativityBoost: serotonin * (1 - serotonin * 0.3),
      
      // 记忆巩固：受乙酰胆碱和去甲肾上腺素共同影响
      memoryConsolidation: acetylcholine * 0.6 + norepinephrine * 0.4,
      
      // 反应速度：受去甲肾上腺素影响
      reactionSpeed: 0.3 + norepinephrine * 0.7,
      
      // 情感敏感度：受多种因素影响
      emotionalSensitivity: serotonin * 0.4 + dopamine * 0.3 + norepinephrine * 0.3,
    };
  }
  
  /**
   * 获取情绪状态描述
   */
  getEmotionalStateDescription(): {
    primary: string;
    valence: number;  // 效价 [-1, 1]
    arousal: number;  // 唤醒度 [0, 1]
    description: string;
  } {
    const { dopamine, serotonin, norepinephrine } = this.state;
    
    // 计算效价和唤醒度
    const valence = (dopamine - 0.5) * 2 + (serotonin - 0.5);
    const arousal = norepinephrine;
    
    // 确定主要情绪
    let primary: string;
    let description: string;
    
    if (valence > 0.3 && arousal > 0.5) {
      primary = '兴奋';
      description = '积极且充满活力';
    } else if (valence > 0.3 && arousal <= 0.5) {
      primary = '满足';
      description = '平静且愉快';
    } else if (valence <= 0.3 && valence >= -0.3 && arousal > 0.5) {
      primary = '紧张';
      description = '警觉但不安';
    } else if (valence <= 0.3 && valence >= -0.3 && arousal <= 0.5) {
      primary = '平静';
      description = '中性且稳定';
    } else if (valence < -0.3 && arousal > 0.5) {
      primary = '焦虑';
      description = '消极且紧张';
    } else {
      primary = '低落';
      description = '消极且低能量';
    }
    
    return {
      primary,
      valence: Math.max(-1, Math.min(1, valence)),
      arousal,
      description,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 时间衰减
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 时间衰减 - 向基线回归
   */
  decay(): void {
    const now = Date.now();
    const elapsedHours = (now - this.state.lastUpdateAt) / (1000 * 60 * 60);
    
    if (elapsedHours < 0.01) return; // 不到半分钟，跳过
    
    for (const type of ['dopamine', 'serotonin', 'norepinephrine', 'acetylcholine'] as const) {
      const current = this.state[type];
      const base = this.baseline[type];
      const rate = this.decayRate[type];
      
      // 向基线回归
      const diff = current - base;
      const decay = diff * rate * elapsedHours;
      
      this.state[type] = current - decay;
    }
    
    this.state.lastUpdateAt = now;
  }
  
  /**
   * 强制重置到基线
   */
  resetToBaseline(): void {
    this.state = {
      ...this.baseline,
      lastUpdateAt: Date.now(),
    };
    this.recordHistory();
    
    console.log('[Neuromodulator] 重置到基线');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 历史与持久化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 记录历史
   */
  private recordHistory(): void {
    this.history.push({ ...this.state });
    
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }
  
  /**
   * 获取历史趋势
   */
  getHistoryTrend(type: NeuromodulatorType, windowSize: number = 10): {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const recent = this.history.slice(-windowSize);
    
    if (recent.length < 2) {
      return { average: this.state[type], trend: 'stable' };
    }
    
    const values = recent.map(h => h[type]);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    // 计算趋势
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    const diff = secondAvg - firstAvg;
    const trend = Math.abs(diff) < 0.05 ? 'stable' : diff > 0 ? 'increasing' : 'decreasing';
    
    return { average, trend };
  }
  
  /**
   * 导出状态
   */
  exportState(): NeuromodulatorState[] {
    return [...this.history];
  }
  
  /**
   * 导入状态
   */
  importState(history: NeuromodulatorState[]): void {
    this.history = history.slice(-this.maxHistoryLength);
    
    if (history.length > 0) {
      this.state = { ...history[history.length - 1] };
    }
  }
}
