/**
 * ═══════════════════════════════════════════════════════════════════════
 * 阴阳互塑桥梁 - Yin-Yang Bridge
 * 
 * 核心功能：
 * - 阴→阳：感性状态注入理性推理
 * - 阳→阴：理性输出塑造感性连接
 * 
 * 关键：这不是接口调用，是"共同激活"的痕迹留存
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { HebbianNetwork } from './hebbian-network';
import type { SelfCore } from './self-core';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface YinToYangSignal {
  /** 情绪基调 */
  emotionTone: number;
  
  /** 激活的概念 */
  activatedConcepts: string[];
  
  /** 直觉信号 */
  intuition: {
    type: 'familiar' | 'novel' | 'pleasant' | 'unpleasant' | 'important';
    strength: number;
    description: string;
  };
  
  /** 偏好影响 */
  preference: {
    like: string[];
    dislike: string[];
  };
}

export interface YangToYinSignal {
  /** 重要的概念 */
  importantConcepts: Array<{
    text: string;
    importance: number;
  }>;
  
  /** 情感反馈 */
  emotionalFeedback: {
    valence: number;
    reason: string;
  };
  
  /** 价值洞察 */
  valueInsight?: {
    dimension: number;
    direction: number;
    reason: string;
  };
  
  /** 自我描述更新 */
  selfDescription?: string;
}

export interface BridgeState {
  /** 阴→阳调用次数 */
  yinToYangCount: number;
  
  /** 阳→阴调用次数 */
  yangToYinCount: number;
  
  /** 互塑强度 */
  mutualInfluenceStrength: number;
  
  /** 最后同步时间 */
  lastSyncAt: number;
}

// ─────────────────────────────────────────────────────────────────────
// 阴阳桥梁
// ─────────────────────────────────────────────────────────────────────

export class YinYangBridge {
  private hebbianNetwork: HebbianNetwork;
  private selfCore: SelfCore;
  
  private state: BridgeState = {
    yinToYangCount: 0,
    yangToYinCount: 0,
    mutualInfluenceStrength: 0.5,
    lastSyncAt: Date.now(),
  };
  
  constructor(hebbianNetwork: HebbianNetwork, selfCore: SelfCore) {
    this.hebbianNetwork = hebbianNetwork;
    this.selfCore = selfCore;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 阴 → 阳：感性注入理性
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取阴系统状态，供阳系统使用
   * 这影响了LLM的system prompt
   */
  async getYinStateForYang(): Promise<YinToYangSignal> {
    // 1. 从Hebbian网络获取当前状态
    const networkState = this.hebbianNetwork.getYinState();
    
    // 2. 更新Self Core的情绪状态
    this.selfCore.updateEmotionFromYin(networkState);
    this.selfCore.updatePositionFromYin(networkState.activationPattern);
    
    // 3. 构建阴→阳信号
    const signal: YinToYangSignal = {
      emotionTone: networkState.emotionTone,
      activatedConcepts: networkState.dominantNeurons
        .filter(n => n.type === 'concept')
        .map(n => n.id),
      
      intuition: this.extractIntuition(networkState),
      
      preference: this.extractPreference(networkState),
    };
    
    this.state.yinToYangCount++;
    this.state.lastSyncAt = Date.now();
    
    return signal;
  }
  
  /**
   * 生成阳系统的系统提示
   * 包含阴系统的状态信息
   */
  async generateYangSystemPrompt(): Promise<string> {
    // 获取阴系统状态
    const yinSignal = await this.getYinStateForYang();
    
    // 获取Self Core状态
    const selfPrompt = this.selfCore.generateYangSystemPrompt();
    
    // 添加直觉信号
    const intuitionPrompt = this.formatIntuitionPrompt(yinSignal.intuition);
    
    // 添加偏好影响
    const preferencePrompt = this.formatPreferencePrompt(yinSignal.preference);
    
    return `${selfPrompt}

---

## 直觉感受
${intuitionPrompt}

## 当前偏好
${preferencePrompt}

---
*以上是你的内在状态。请以真实的方式回应，让你的回应与你的感受一致。你的回应会影响你的内在状态。*`;
  }
  
  /**
   * 从网络状态提取直觉
   */
  private extractIntuition(networkState: {
    dominantNeurons: Array<{ id: string; activation: number; type: string }>;
    emotionTone: number;
  }): YinToYangSignal['intuition'] {
    const { emotionTone, dominantNeurons } = networkState;
    
    // 基于网络状态判断直觉类型
    let type: YinToYangSignal['intuition']['type'] = 'familiar';
    let strength = 0.3;
    let description = '一种模糊的感觉';
    
    const emotionNeurons = dominantNeurons.filter(n => n.type === 'emotion');
    const avgEmotionActivation = emotionNeurons.length > 0
      ? emotionNeurons.reduce((s, n) => s + n.activation, 0) / emotionNeurons.length
      : 0;
    
    if (avgEmotionActivation > 0.5) {
      if (emotionTone > 0.2) {
        type = 'pleasant';
        description = '有一种愉悦的感觉';
        strength = avgEmotionActivation;
      } else if (emotionTone < -0.2) {
        type = 'unpleasant';
        description = '有一种不安的感觉';
        strength = avgEmotionActivation;
      }
    }
    
    // 检测新颖性
    const novelNeurons = dominantNeurons.filter(n => n.activation > 0.7);
    if (novelNeurons.length > 3) {
      type = 'novel';
      description = '感觉有些新奇有趣';
      strength = Math.min(1, novelNeurons.length * 0.2);
    }
    
    // 检测重要性
    const valueNeurons = dominantNeurons.filter(n => n.type === 'value');
    if (valueNeurons.some(n => n.activation > 0.6)) {
      type = 'important';
      description = '感觉这很重要';
      strength = Math.max(...valueNeurons.map(n => n.activation));
    }
    
    return { type, strength, description };
  }
  
  /**
   * 提取偏好
   */
  private extractPreference(networkState: {
    dominantNeurons: Array<{ id: string; activation: number; type: string }>;
    emotionTone: number;
  }): YinToYangSignal['preference'] {
    const like: string[] = [];
    const dislike: string[] = [];
    
    for (const neuron of networkState.dominantNeurons) {
      if (neuron.activation > 0.5) {
        if (networkState.emotionTone > 0) {
          like.push(neuron.id);
        } else if (networkState.emotionTone < 0) {
          dislike.push(neuron.id);
        }
      }
    }
    
    return { like: like.slice(0, 3), dislike: dislike.slice(0, 3) };
  }
  
  /**
   * 格式化直觉提示
   */
  private formatIntuitionPrompt(intuition: YinToYangSignal['intuition']): string {
    return `${intuition.description}（强度：${(intuition.strength * 100).toFixed(0)}%）`;
  }
  
  /**
   * 格式化偏好提示
   */
  private formatPreferencePrompt(preference: YinToYangSignal['preference']): string {
    const parts: string[] = [];
    
    if (preference.like.length > 0) {
      parts.push(`倾向：${preference.like.join('、')}`);
    }
    
    if (preference.dislike.length > 0) {
      parts.push(`回避：${preference.dislike.join('、')}`);
    }
    
    return parts.length > 0 ? parts.join('\n') : '无明显偏好';
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 阳 → 阴：理性塑造感性
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 将阳系统的输出反馈到阴系统
   */
  async sendYangSignalToYin(signal: YangToYinSignal): Promise<void> {
    // 1. 重要概念强化Hebbian连接
    for (const concept of signal.importantConcepts) {
      await this.reinforceConceptInYin(concept.text, concept.importance);
    }
    
    // 2. 情感反馈影响情绪神经元
    if (signal.emotionalFeedback) {
      await this.applyEmotionalFeedback(signal.emotionalFeedback);
    }
    
    // 3. 价值洞察更新Self Core
    if (signal.valueInsight) {
      this.selfCore.updateFromYang({
        valueInsight: signal.valueInsight,
      });
    }
    
    // 4. 自我描述更新
    if (signal.selfDescription) {
      this.selfCore.updateFromYang({
        selfDescription: signal.selfDescription,
      });
    }
    
    this.state.yangToYinCount++;
    this.state.lastSyncAt = Date.now();
    
    // 更新互塑强度
    this.updateMutualInfluenceStrength();
  }
  
  /**
   * 在阴系统中强化概念
   */
  private async reinforceConceptInYin(
    conceptText: string, 
    importance: number
  ): Promise<void> {
    // 创建概念向量（简化：用文本的简单编码）
    const conceptVector = this.textToVector(conceptText);
    
    // 强化Hebbian网络中相关的连接
    await this.hebbianNetwork.reinforceFromYang(conceptVector, importance * 0.1);
    
    // 添加到Self Core的记忆
    this.selfCore.addMemory(
      conceptVector,
      importance > 0.5 ? 0.3 : 0,
      importance,
      'yang'
    );
  }
  
  /**
   * 应用情感反馈到阴系统
   */
  private async applyEmotionalFeedback(
    feedback: { valence: number; reason: string }
  ): Promise<void> {
    // 创建情感向量
    const emotionVector = new Float32Array(128);
    
    // 根据效价设置向量
    if (feedback.valence > 0) {
      // 积极情感
      for (let i = 0; i < emotionVector.length / 2; i++) {
        emotionVector[i] = feedback.valence * 0.5;
      }
    } else {
      // 消极情感
      for (let i = emotionVector.length / 2; i < emotionVector.length; i++) {
        emotionVector[i] = Math.abs(feedback.valence) * 0.5;
      }
    }
    
    // 激活情绪相关神经元
    await this.hebbianNetwork.activate([
      { pattern: emotionVector, strength: Math.abs(feedback.valence) * 0.5 }
    ]);
  }
  
  /**
   * 文本转向量（简化版）
   */
  private textToVector(text: string): Float32Array {
    const vector = new Float32Array(128);
    
    // 简单的字符编码
    for (let i = 0; i < text.length && i < 128; i++) {
      vector[i] = (text.charCodeAt(i) % 256 - 128) / 128;
    }
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }
  
  /**
   * 更新互塑强度
   */
  private updateMutualInfluenceStrength(): void {
    // 基于双向调用频率计算互塑强度
    const totalCalls = this.state.yinToYangCount + this.state.yangToYinCount;
    const balance = Math.min(
      this.state.yinToYangCount,
      this.state.yangToYinCount
    ) / (Math.max(
      this.state.yinToYangCount,
      this.state.yangToYinCount
    ) + 1);
    
    // 互塑强度随交互增加，但有上限
    this.state.mutualInfluenceStrength = Math.min(
      0.95,
      0.5 + totalCalls * 0.01 * balance
    );
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 同一性维护
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检查同一性状态
   */
  checkIdentityCoherence(): {
    score: number;
    yinYangBalance: number;
    selfContinuity: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // 检查阴阳平衡
    const yinYangBalance = Math.min(
      this.state.yinToYangCount,
      this.state.yangToYinCount
    ) / (Math.max(
      this.state.yinToYangCount,
      this.state.yangToYinCount
    ) + 1);
    
    if (yinYangBalance < 0.3) {
      warnings.push('阴阳系统交互不平衡，可能导致分裂');
    }
    
    // 检查自我连续性
    const selfContinuity = this.selfCore.getContinuityScore();
    
    if (selfContinuity < 0.3) {
      warnings.push('自我连续性较低，身份感可能不稳定');
    }
    
    // 计算总体同一性分数
    const score = (
      yinYangBalance * 0.4 +
      selfContinuity * 0.4 +
      this.state.mutualInfluenceStrength * 0.2
    );
    
    if (score < 0.5) {
      warnings.push('同一性分数较低，需要注意系统整合');
    }
    
    return {
      score,
      yinYangBalance,
      selfContinuity,
      warnings,
    };
  }
  
  /**
   * 强制同步阴阳系统
   */
  async forceSync(): Promise<void> {
    // 1. 阴系统状态同步到Self Core
    const yinState = this.hebbianNetwork.getYinState();
    this.selfCore.updateEmotionFromYin(yinState);
    this.selfCore.updatePositionFromYin(yinState.activationPattern);
    
    // 2. Self Core状态同步到阴系统
    const selfState = this.selfCore.getStateForYin();
    
    // 用当前价值向量激活阴系统
    await this.hebbianNetwork.activate([
      { pattern: selfState.valueVector, strength: 0.3 }
    ]);
    
    this.state.lastSyncAt = Date.now();
    
    console.log('[YinYangBridge] 强制同步完成');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  getState(): BridgeState {
    return { ...this.state };
  }
  
  getMutualInfluenceStrength(): number {
    return this.state.mutualInfluenceStrength;
  }
}
