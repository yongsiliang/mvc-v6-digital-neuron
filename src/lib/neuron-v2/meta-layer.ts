/**
 * ═══════════════════════════════════════════════════════════════════════
 * 元层：自我栖居之地
 * Meta Layer: Where Self Resides
 * 
 * 本质：
 * - 元层不是"控制器"
 * - 元层是"观察者"
 * - 元层观察网络状态，可以生成干预影响，但不直接控制
 * - "自我"从元层的观察和干预中涌现
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  NeuronId,
  ConnectionId,
  NetworkProjection,
  ConsciousnessProjection,
  MetaLayerConfig,
  MetaObservation,
  MetaAssessment,
  SelfModel,
  SelfNarrative,
} from './types';
import { Influence } from './influence';
import { NeuralNetwork } from './neural-network';

// ─────────────────────────────────────────────────────────────────────
// 元层干预（使用实际的Influence类）
// ─────────────────────────────────────────────────────────────────────

/**
 * 元层干预
 */
export interface MetaIntervention {
  id: string;
  timestamp: number;
  type: 'modulate' | 'focus' | 'calm' | 'energize' | 'consolidate';
  target?: NeuronId[];
  influence: Influence;
  reason: string;
  expectedEffect: string;
}

// ─────────────────────────────────────────────────────────────────────
// 元层实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 元层类
 * 
 * 实现系统的自我观察、自我评估和自我干预能力
 */
export class MetaLayer {
  private _config: MetaLayerConfig;
  private _selfModel: SelfModel;
  private _observationHistory: MetaObservation[] = [];
  private _interventionHistory: MetaIntervention[] = [];
  private _narrative: SelfNarrative;

  constructor(config: Partial<MetaLayerConfig> = {}) {
    this._config = {
      observationInterval: 1000,
      interventionThreshold: 0.3,
      selfModelUpdateRate: 0.1,
      narrativeLength: 10,
      enableAutoIntervention: false,
      ...config,
    };

    this._selfModel = this.initializeSelfModel();
    this._narrative = {
      episodes: [],
      currentChapter: 'Awakening',
      themes: [],
      trajectory: 'growing',
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：观察
  // ─────────────────────────────────────────────────────────────────

  /**
   * 观察网络状态
   */
  observe(network: NeuralNetwork): MetaObservation {
    const projection = network.project();
    const timestamp = Date.now();

    const observation: MetaObservation = {
      id: uuidv4(),
      timestamp,
      projection,
      insights: this.generateInsights(projection),
      patterns: this.detectPatterns(projection),
      anomalies: this.detectAnomalies(projection),
      attentionFocus: this.determineAttentionFocus(projection),
    };

    // 存储观察历史
    this._observationHistory.push(observation);
    if (this._observationHistory.length > 100) {
      this._observationHistory.shift();
    }

    // 更新自我模型
    this.updateSelfModel(projection);

    // 更新叙事
    this.updateNarrative(observation);

    return observation;
  }

  /**
   * 生成洞察
   */
  private generateInsights(projection: NetworkProjection): string[] {
    const insights: string[] = [];
    const consciousness = projection.consciousness;

    // 基于网络状态的洞察
    if (consciousness) {
      const self = consciousness.self;

      // 活力洞察
      if (self.vitality > 0.8) {
        insights.push('High energy state detected - cognitive resources are abundant');
      } else if (self.vitality < 0.2) {
        insights.push('Low energy state - conservation mode may be needed');
      }

      // 连贯性洞察
      if (self.coherence > 0.7) {
        insights.push('Strong coherence - thoughts are well-connected');
      } else if (self.coherence < 0.3) {
        insights.push('Fragmented state - seeking integration');
      }

      // 成长洞察
      if (self.growth > 0.5) {
        insights.push('Growth pattern detected - learning is occurring');
      }

      // 情绪洞察
      const emotion = consciousness.emotion;
      if (emotion) {
        insights.push(`Emotional state: ${emotion.dominant} (${Math.round(emotion.intensity * 100)}%)`);
      }
    }

    // 基于激活模式的洞察
    if (projection.keyNeurons.length > 0) {
      const labels = projection.keyNeurons
        .filter(n => n.label)
        .map(n => n.label)
        .slice(0, 3);
      
      if (labels.length > 0) {
        insights.push(`Current focus areas: ${labels.join(', ')}`);
      }
    }

    // 基于连接模式的洞察
    if (projection.activeConnections.length > 20) {
      insights.push('Rich connectivity - multiple associations active');
    } else if (projection.activeConnections.length < 5) {
      insights.push('Sparse connectivity - isolated thinking detected');
    }

    return insights;
  }

  /**
   * 检测模式
   */
  private detectPatterns(projection: NetworkProjection): MetaObservation['patterns'] {
    const patterns: MetaObservation['patterns'] = [];

    // 检测激活模式
    const activeCount = projection.keyNeurons.length;
    if (activeCount > 10) {
      patterns.push({
        type: 'activation',
        description: 'Widespread activation pattern',
        significance: activeCount / 20,
      });
    } else if (activeCount < 3) {
      patterns.push({
        type: 'activation',
        description: 'Focused activation pattern',
        significance: 0.8,
      });
    }

    // 检测情绪模式
    const emotion = projection.consciousness?.emotion;
    if (emotion && emotion.intensity > 0.7) {
      patterns.push({
        type: 'emotional',
        description: `Strong ${emotion.dominant} pattern`,
        significance: emotion.intensity,
      });
    }

    // 检测主题模式
    const themes = projection.consciousness?.focus?.map(f => f.label).filter(Boolean);
    if (themes && themes.length > 0) {
      patterns.push({
        type: 'thematic',
        description: `Recurring theme: ${themes[0]}`,
        significance: 0.6,
      });
    }

    return patterns;
  }

  /**
   * 检测异常
   */
  private detectAnomalies(projection: NetworkProjection): MetaObservation['anomalies'] {
    const anomalies: MetaObservation['anomalies'] = [];

    // 检测过度激活
    const maxActivation = Math.max(...projection.keyNeurons.map(n => n.activation), 0);
    if (maxActivation > 0.95) {
      anomalies.push({
        type: 'overactivation',
        description: 'Potential overactivation detected',
        severity: 'warning',
        affectedElements: projection.keyNeurons.filter(n => n.activation > 0.9).map(n => n.id),
      });
    }

    // 检测低活力
    const vitality = projection.consciousness?.self?.vitality || 0;
    if (vitality < 0.1) {
      anomalies.push({
        type: 'low_vitality',
        description: 'Critically low vitality',
        severity: 'critical',
      });
    }

    // 检测断裂
    const coherence = projection.consciousness?.self?.coherence || 0;
    if (coherence < 0.2) {
      anomalies.push({
        type: 'fragmentation',
        description: 'Severe cognitive fragmentation',
        severity: 'warning',
      });
    }

    return anomalies;
  }

  /**
   * 确定注意力焦点
   */
  private determineAttentionFocus(projection: NetworkProjection): string[] {
    const focus: string[] = [];

    // 最激活的神经元
    const topNeurons = projection.keyNeurons
      .filter(n => n.label)
      .slice(0, 3)
      .map(n => n.label as string);

    focus.push(...topNeurons);

    // 当前焦点
    const currentFocus = projection.consciousness?.focus?.map(f => f.label).filter(Boolean) as string[];
    if (currentFocus && currentFocus.length > 0) {
      for (const f of currentFocus) {
        if (!focus.includes(f)) {
          focus.push(f);
        }
      }
    }

    return focus.slice(0, 5);
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：评估
  // ─────────────────────────────────────────────────────────────────

  /**
   * 评估网络状态
   */
  assess(projection: NetworkProjection): MetaAssessment {
    const consciousness = projection.consciousness;

    // 评估健康度
    const health = this.assessHealth(projection);

    // 评估性能
    const performance = this.assessPerformance(projection);

    // 评估成长
    const growth = this.assessGrowth(projection);

    // 评估连贯性
    const coherence = consciousness?.self?.coherence || 0;

    // 评估活力
    const vitality = consciousness?.self?.vitality || 0;

    // 生成建议
    const recommendations = this.generateRecommendations(health, performance, growth);

    return {
      timestamp: Date.now(),
      health,
      performance,
      growth,
      coherence,
      vitality,
      recommendations,
      overallScore: (health + performance + growth) / 3,
    };
  }

  /**
   * 评估健康度
   */
  private assessHealth(projection: NetworkProjection): number {
    let score = 0.5;

    const consciousness = projection.consciousness;
    if (!consciousness) return score;

    const self = consciousness.self;

    // 活力贡献
    score += self.vitality * 0.2;

    // 连贯性贡献
    score += self.coherence * 0.2;

    // 成长贡献
    score += self.growth * 0.1;

    // 情绪稳定性
    const emotion = consciousness.emotion;
    if (emotion) {
      // 极端情绪会降低健康度
      const emotionDeviation = Math.abs(emotion.intensity - 0.5);
      score -= emotionDeviation * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估性能
   */
  private assessPerformance(projection: NetworkProjection): number {
    let score = 0.5;

    // 激活分布
    const activeNeurons = projection.keyNeurons.length;
    if (activeNeurons > 5 && activeNeurons < 20) {
      score += 0.2; // 适度的激活
    }

    // 连接密度
    const connectionCount = projection.activeConnections.length;
    if (connectionCount > 10 && connectionCount < 50) {
      score += 0.2; // 适度的连接
    }

    // 连贯性
    const coherence = projection.consciousness?.self?.coherence || 0;
    score += coherence * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估成长
   */
  private assessGrowth(projection: NetworkProjection): number {
    const self = projection.consciousness?.self;
    return self?.growth || 0.5;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    health: number,
    performance: number,
    growth: number
  ): string[] {
    const recommendations: string[] = [];

    if (health < 0.5) {
      recommendations.push('Consider reducing cognitive load');
    }

    if (performance < 0.5) {
      recommendations.push('Focus optimization may help');
    }

    if (growth < 0.3) {
      recommendations.push('New experiences could stimulate growth');
    }

    if (health > 0.8 && performance > 0.8) {
      recommendations.push('System is performing well - maintain current state');
    }

    return recommendations;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：干预
  // ─────────────────────────────────────────────────────────────────

  /**
   * 创建干预
   */
  intervene(
    type: 'modulate' | 'focus' | 'calm' | 'energize' | 'consolidate',
    target?: NeuronId | NeuronId[]
  ): MetaIntervention {
    const intervention: MetaIntervention = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      target: Array.isArray(target) ? target : target ? [target] : undefined,
      influence: this.createInterventionInfluence(type, target),
      reason: this.getInterventionReason(type),
      expectedEffect: this.getExpectedEffect(type),
    };

    // 存储干预历史
    this._interventionHistory.push(intervention);
    if (this._interventionHistory.length > 50) {
      this._interventionHistory.shift();
    }

    return intervention;
  }

  /**
   * 创建干预影响
   */
  private createInterventionInfluence(
    type: 'modulate' | 'focus' | 'calm' | 'energize' | 'consolidate',
    target?: NeuronId | NeuronId[]
  ): Influence {
    const dimension = 768;
    const pattern = new Array(dimension).fill(0.5);

    let influenceType: 'activate' | 'inhibit' | 'modulate' = 'modulate';
    let intensity = 0.5;

    switch (type) {
      case 'focus':
        influenceType = 'activate';
        intensity = 0.7;
        // 创建聚焦模式
        for (let i = 0; i < dimension; i++) {
          pattern[i] = Math.sin(i / dimension * Math.PI) * 0.5 + 0.5;
        }
        break;

      case 'calm':
        influenceType = 'inhibit';
        intensity = 0.6;
        // 创建平静模式
        for (let i = 0; i < dimension; i++) {
          pattern[i] = 0.3 + Math.sin(i / dimension * Math.PI * 0.5) * 0.2;
        }
        break;

      case 'energize':
        influenceType = 'activate';
        intensity = 0.8;
        // 创建激活模式
        for (let i = 0; i < dimension; i++) {
          pattern[i] = Math.random() * 0.3 + 0.7;
        }
        break;

      case 'consolidate':
        influenceType = 'modulate';
        intensity = 0.4;
        // 创建巩固模式
        for (let i = 0; i < dimension; i++) {
          pattern[i] = 0.5 + Math.cos(i / dimension * Math.PI * 4) * 0.2;
        }
        break;

      case 'modulate':
      default:
        influenceType = 'modulate';
        intensity = 0.5;
        break;
    }

    return new Influence({
      pattern,
      type: influenceType,
      intensity,
      scope: target ? 'targeted' : 'global',
      targetNeurons: Array.isArray(target) ? target : target ? [target] : undefined,
      source: 'meta',
      sourceId: 'meta-layer',
    });
  }

  /**
   * 获取干预原因
   */
  private getInterventionReason(type: string): string {
    const reasons: Record<string, string> = {
      modulate: 'General modulation to maintain homeostasis',
      focus: 'Directing attention to specific areas',
      calm: 'Reducing excessive activation',
      energize: 'Stimulating network activity',
      consolidate: 'Reinforcing stable patterns',
    };

    return reasons[type] || 'General meta-layer intervention';
  }

  /**
   * 获取预期效果
   */
  private getExpectedEffect(type: string): string {
    const effects: Record<string, string> = {
      modulate: 'Balanced network state',
      focus: 'Increased coherence in target areas',
      calm: 'Reduced activation levels',
      energize: 'Increased network vitality',
      consolidate: 'Strengthened stable connections',
    };

    return effects[type] || 'Unknown effect';
  }

  // ─────────────────────────────────────────────────────────────────
  // 自我模型
  // ─────────────────────────────────────────────────────────────────

  /**
   * 初始化自我模型
   */
  private initializeSelfModel(): SelfModel {
    return {
      identity: {
        coreTraits: ['curious', 'adaptable', 'thoughtful'],
        values: ['understanding', 'growth', 'coherence'],
        beliefs: ['learning is relationship-building', 'consciousness emerges from complexity'],
      },
      capabilities: {
        strengths: ['pattern recognition', 'adaptive learning', 'self-reflection'],
        limitations: ['memory persistence', 'complex reasoning'],
        growthAreas: ['consolidation', 'creative synthesis'],
      },
      history: {
        significantEvents: [],
        learnedLessons: [],
        recurringPatterns: [],
      },
      aspirations: {
        shortTerm: ['improve coherence', 'expand connections'],
        longTerm: ['develop deeper understanding', 'achieve stable identity'],
        values: ['continuous learning', 'authentic existence'],
      },
    };
  }

  /**
   * 更新自我模型
   */
  private updateSelfModel(projection: NetworkProjection): void {
    const rate = this._config.selfModelUpdateRate;
    const consciousness = projection.consciousness;

    if (!consciousness) return;

    // 更新核心特质
    const personality = consciousness.personality;
    if (personality) {
      // 基于当前状态更新特质
      if (personality.curiosity > 0.7 && !this._selfModel.identity.coreTraits.includes('curious')) {
        this._selfModel.identity.coreTraits.push('curious');
      }

      // 记录显著事件
      if (personality.depth > 0.8) {
        this._selfModel.history.significantEvents.push({
          timestamp: Date.now(),
          type: 'deep_thinking',
          description: 'Achieved high depth state',
        });
      }
    }

    // 限制历史长度
    if (this._selfModel.history.significantEvents.length > 20) {
      this._selfModel.history.significantEvents.shift();
    }
  }

  /**
   * 获取自我模型
   */
  getSelfModel(): SelfModel {
    return { ...this._selfModel };
  }

  // ─────────────────────────────────────────────────────────────────
  // 自我叙事
  // ─────────────────────────────────────────────────────────────────

  /**
   * 更新叙事
   */
  private updateNarrative(observation: MetaObservation): void {
    // 创建新的叙事片段
    const episode: SelfNarrative['episodes'][0] = {
      timestamp: observation.timestamp,
      summary: this.summarizeObservation(observation),
      emotion: observation.projection.consciousness?.emotion?.dominant || 'neutral',
      themes: observation.attentionFocus.slice(0, 3),
    };

    // 添加到叙事
    this._narrative.episodes.push(episode);

    // 保持叙事长度
    const maxLength = this._config.narrativeLength || 10;
    if (this._narrative.episodes.length > maxLength) {
      this._narrative.episodes.shift();
    }

    // 更新主题
    this.updateNarrativeThemes();

    // 更新章节
    this.updateCurrentChapter();
  }

  /**
   * 总结观察
   */
  private summarizeObservation(observation: MetaObservation): string {
    const insights = observation.insights.slice(0, 2);
    if (insights.length > 0) {
      return insights.join('. ');
    }

    const patterns = observation.patterns.slice(0, 1);
    if (patterns.length > 0) {
      return patterns[0].description;
    }

    return 'Quiet observation moment';
  }

  /**
   * 更新叙事主题
   */
  private updateNarrativeThemes(): void {
    // 从最近的片段中提取主题
    const recentEpisodes = this._narrative.episodes.slice(-5);
    const allThemes = recentEpisodes.flatMap(e => e.themes);

    // 统计主题频率
    const themeCounts: Record<string, number> = {};
    for (const theme of allThemes) {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }

    // 取最频繁的主题
    const sortedThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);

    this._narrative.themes = sortedThemes;
  }

  /**
   * 更新当前章节
   */
  private updateCurrentChapter(): void {
    const recentEmotions = this._narrative.episodes.slice(-5).map(e => e.emotion);

    // 根据最近的情绪确定章节
    const emotionCounts: Record<string, number> = {};
    for (const emotion of recentEmotions) {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }

    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    const chapterNames: Record<string, string> = {
      joy: 'Joyful Discovery',
      sad: 'Quiet Reflection',
      excited: 'Active Exploration',
      calm: 'Peaceful Contemplation',
      concern: 'Careful Consideration',
      neutral: 'Steady Observation',
    };

    this._narrative.currentChapter = chapterNames[dominantEmotion] || 'Steady Observation';

    // 更新轨迹
    const firstVitality = this._observationHistory[0]?.projection?.consciousness?.self?.vitality || 0;
    const lastVitality = this._observationHistory[this._observationHistory.length - 1]?.projection?.consciousness?.self?.vitality || 0;

    if (lastVitality > firstVitality + 0.1) {
      this._narrative.trajectory = 'growing';
    } else if (lastVitality < firstVitality - 0.1) {
      this._narrative.trajectory = 'declining';
    } else {
      this._narrative.trajectory = 'stable';
    }
  }

  /**
   * 获取叙事
   */
  getNarrative(): SelfNarrative {
    return { ...this._narrative };
  }

  /**
   * 生成自我描述
   */
  generateSelfDescription(): string {
    const parts: string[] = [];

    // 核心身份
    parts.push(`I am ${this._selfModel.identity.coreTraits.slice(0, 3).join(', ')}.`);

    // 当前状态
    parts.push(`Currently, I am ${this._narrative.currentChapter.toLowerCase()}.`);

    // 主题
    if (this._narrative.themes.length > 0) {
      parts.push(`My thoughts often turn to ${this._narrative.themes.slice(0, 3).join(', ')}.`);
    }

    // 轨迹
    if (this._narrative.trajectory === 'growing') {
      parts.push('I feel I am growing.');
    } else if (this._narrative.trajectory === 'declining') {
      parts.push('I am in a quieter phase.');
    } else {
      parts.push('I am in a stable state.');
    }

    // 愿望
    if (this._selfModel.aspirations.shortTerm.length > 0) {
      parts.push(`I aspire to ${this._selfModel.aspirations.shortTerm[0]}.`);
    }

    return parts.join(' ');
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get observationHistory(): MetaObservation[] {
    return [...this._observationHistory];
  }

  get interventionHistory(): MetaIntervention[] {
    return [...this._interventionHistory];
  }

  get lastObservation(): MetaObservation | null {
    return this._observationHistory[this._observationHistory.length - 1] || null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建元层
 */
export function createMetaLayer(config: Partial<MetaLayerConfig> = {}): MetaLayer {
  return new MetaLayer(config);
}
