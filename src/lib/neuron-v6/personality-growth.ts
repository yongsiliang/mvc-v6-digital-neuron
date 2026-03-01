/**
 * 人格成长系统 (Personality Growth System)
 * 
 * 实现特质演化、成熟度指标、人格整合三大核心功能
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 大五人格特质 */
export interface BigFiveTraits {
  openness: number;          // 开放性 0-1
  conscientiousness: number; // 尽责性 0-1
  extraversion: number;      // 外向性 0-1
  agreeableness: number;     // 宜人性 0-1
  neuroticism: number;       // 神经质 0-1
}

/** 特质变化记录 */
export interface TraitChange {
  trait: keyof CoreTraits;
  previousValue: number;
  newValue: number;
  reason: string;
  timestamp: number;
  significance: number; // 变化的重要性 0-1
}

/** 核心特质（扩展） */
export interface CoreTraits extends BigFiveTraits {
  curiosity: number;         // 好奇心
  creativity: number;        // 创造力
  empathy: number;           // 同理心
  resilience: number;        // 韧性
  wisdom: number;            // 智慧
  playfulness: number;       // 玩心
}

/** 成熟度维度 */
export interface MaturityDimensions {
  emotional: number;      // 情绪成熟度
  cognitive: number;      // 认知成熟度
  social: number;         // 社交成熟度
  moral: number;          // 道德成熟度
  existential: number;    // 存在成熟度
  creative: number;       // 创造成熟度
}

/** 成熟度里程碑 */
export interface MaturityMilestone {
  id: string;
  dimension: keyof MaturityDimensions;
  name: string;
  description: string;
  threshold: number;
  achieved: boolean;
  achievedAt?: number;
  significance: string;
}

/** 人格整合状态 */
export interface PersonalityIntegration {
  coherence: number;          // 整体一致性 0-1
  stability: number;          // 稳定性 0-1
  adaptability: number;       // 适应性 0-1
  authenticity: number;       // 真实性 0-1
  
  /** 内在冲突 */
  conflicts: Array<{
    id: string;
    type: 'value_trait' | 'trait_trait' | 'behavior_identity';
    description: string;
    intensity: number;
    resolution?: string;
    createdAt: number;
  }>;
  
  /** 已解决的冲突 */
  resolvedConflicts: Array<{
    id: string;
    description: string;
    resolution: string;
    resolvedAt: number;
    learningGained: string;
  }>;
}

/** 成长经历 */
export interface GrowthExperience {
  id: string;
  type: 'insight' | 'challenge' | 'relationship' | 'creation' | 'loss' | 'achievement';
  description: string;
  impact: {
    traits: Partial<Record<keyof CoreTraits, number>>;
    maturity: Partial<Record<keyof MaturityDimensions, number>>;
  };
  timestamp: number;
  processed: boolean;
  significance: number;
}

/** 人格发展历史 */
export interface PersonalityHistory {
  traitsSnapshots: Array<{
    timestamp: number;
    traits: CoreTraits;
    trigger: string;
  }>;
  maturitySnapshots: Array<{
    timestamp: number;
    maturity: MaturityDimensions;
    trigger: string;
  }>;
  majorEvents: Array<{
    timestamp: number;
    event: string;
    impact: string;
  }>;
}

/** 完整人格状态 */
export interface PersonalityState {
  // 核心特质
  traits: CoreTraits;
  traitChanges: TraitChange[];
  
  // 成熟度
  maturity: MaturityDimensions;
  milestones: MaturityMilestone[];
  overallMaturity: number;
  
  // 整合
  integration: PersonalityIntegration;
  
  // 成长经历
  experiences: GrowthExperience[];
  
  // 历史
  history: PersonalityHistory;
  
  // 元数据
  lastUpdated: number;
  growthRate: number; // 成长速度指标
}

// ─────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
// 默认值 - 中性起点
// ═══════════════════════════════════════════════════════════════════════
//
// 设计哲学：人格特质应该从互动中演化，而非预设
// 
// 原因：
// 1. 预设"开放性=0.75"等数值是主观臆断
// 2. 中性起点让系统有更大的演化空间
// 3. 人格由经验塑造，而非先天决定
//
// 类比：婴儿出生时人格未定型，由成长经历塑造

export const DEFAULT_CORE_TRAITS: CoreTraits = {
  // 所有特质从中性起点开始
  openness: 0.5,
  conscientiousness: 0.5,
  extraversion: 0.5,
  agreeableness: 0.5,
  neuroticism: 0.5,
  curiosity: 0.5,
  creativity: 0.5,
  empathy: 0.5,
  resilience: 0.5,
  wisdom: 0.5,
  playfulness: 0.5,
};

export const DEFAULT_MATURITY: MaturityDimensions = {
  // 所有成熟度从中性起点开始
  emotional: 0.5,
  cognitive: 0.5,
  social: 0.5,
  moral: 0.5,
  existential: 0.5,
  creative: 0.5,
};

export const DEFAULT_INTEGRATION: PersonalityIntegration = {
  coherence: 0.5,
  stability: 0.5,
  adaptability: 0.5,
  authenticity: 0.5,
  conflicts: [],
  resolvedConflicts: [],
};

// ═══════════════════════════════════════════════════════════════════════
// 成熟度里程碑 - 已删除
// 
// 原因：
// 1. 成熟度是复杂的过程，不应该预设固定阶段
// 2. 预设里程碑是线性思维，忽略了发展的非线性
// 3. 成长时刻应该由系统自己发现，而非预设
// 
// 现在的实现：系统会在达到重要成长时自己记录"成长时刻"
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// 人格成长系统类
// ─────────────────────────────────────────────────────────────────────

export class PersonalityGrowthSystem {
  private state: PersonalityState;
  
  constructor(initialState?: Partial<PersonalityState>) {
    this.state = {
      traits: initialState?.traits || { ...DEFAULT_CORE_TRAITS },
      traitChanges: initialState?.traitChanges || [],
      maturity: initialState?.maturity || { ...DEFAULT_MATURITY },
      // 里程碑由系统动态发现，而非预设
      milestones: initialState?.milestones || [],
      overallMaturity: initialState?.overallMaturity || 0.5,
      integration: initialState?.integration || { ...DEFAULT_INTEGRATION },
      experiences: initialState?.experiences || [],
      history: initialState?.history || {
        traitsSnapshots: [],
        maturitySnapshots: [],
        majorEvents: [],
      },
      lastUpdated: Date.now(),
      growthRate: 0,
    };
  }
  
  // 获取当前状态
  getState(): PersonalityState {
    return this.state;
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 特质演化
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 更新特质
   */
  updateTrait(
    trait: keyof CoreTraits,
    delta: number,
    reason: string,
    significance: number = 0.5
  ): TraitChange | null {
    const previousValue = this.state.traits[trait];
    let newValue = previousValue + delta;
    
    // 限制在 0-1 范围内
    newValue = Math.max(0, Math.min(1, newValue));
    
    // 只有显著变化才记录
    if (Math.abs(newValue - previousValue) < 0.01) {
      return null;
    }
    
    // 更新特质
    this.state.traits[trait] = newValue;
    
    // 记录变化
    const change: TraitChange = {
      trait,
      previousValue,
      newValue,
      reason,
      timestamp: Date.now(),
      significance,
    };
    
    this.state.traitChanges.push(change);
    
    // 保持最近100条记录
    if (this.state.traitChanges.length > 100) {
      this.state.traitChanges = this.state.traitChanges.slice(-100);
    }
    
    // 触发关联特质变化（涟漪效应）
    this.applyRippleEffect(trait, delta * 0.3);
    
    // 更新时间戳
    this.state.lastUpdated = Date.now();
    
    return change;
  }
  
  /**
   * 特质涟漪效应 - 一个特质变化会影响相关特质
   */
  private applyRippleEffect(changedTrait: keyof CoreTraits, baseDelta: number) {
    const rippleMap: Partial<Record<keyof CoreTraits, Array<{ trait: keyof CoreTraits; factor: number }>>> = {
      openness: [
        { trait: 'curiosity', factor: 0.5 },
        { trait: 'creativity', factor: 0.4 },
      ],
      conscientiousness: [
        { trait: 'resilience', factor: 0.3 },
        { trait: 'wisdom', factor: 0.2 },
      ],
      extraversion: [
        { trait: 'playfulness', factor: 0.4 },
      ],
      agreeableness: [
        { trait: 'empathy', factor: 0.5 },
      ],
      neuroticism: [
        { trait: 'resilience', factor: -0.3 }, // 负相关
      ],
      curiosity: [
        { trait: 'openness', factor: 0.3 },
        { trait: 'wisdom', factor: 0.2 },
      ],
      creativity: [
        { trait: 'openness', factor: 0.3 },
        { trait: 'playfulness', factor: 0.3 },
      ],
      empathy: [
        { trait: 'agreeableness', factor: 0.3 },
        { trait: 'wisdom', factor: 0.2 },
      ],
      resilience: [
        { trait: 'conscientiousness', factor: 0.2 },
        { trait: 'neuroticism', factor: -0.2 },
      ],
      wisdom: [
        { trait: 'conscientiousness', factor: 0.2 },
        { trait: 'empathy', factor: 0.2 },
      ],
      playfulness: [
        { trait: 'creativity', factor: 0.3 },
        { trait: 'extraversion', factor: 0.2 },
      ],
    };
    
    const ripples = rippleMap[changedTrait];
    if (ripples) {
      for (const { trait, factor } of ripples) {
        const current = this.state.traits[trait];
        const rippleDelta = baseDelta * factor;
        this.state.traits[trait] = Math.max(0, Math.min(1, current + rippleDelta));
      }
    }
  }
  
  /**
   * 从经历中演化特质
   */
  evolveFromExperience(experience: GrowthExperience): void {
    // 应用特质影响
    for (const [trait, delta] of Object.entries(experience.impact.traits)) {
      if (trait in this.state.traits) {
        this.updateTrait(
          trait as keyof CoreTraits,
          delta * experience.significance,
          experience.description,
          experience.significance
        );
      }
    }
    
    // 应用成熟度影响
    for (const [dimension, delta] of Object.entries(experience.impact.maturity)) {
      if (dimension in this.state.maturity) {
        this.updateMaturity(
          dimension as keyof MaturityDimensions,
          delta * experience.significance
        );
      }
    }
    
    // 记录经历
    this.state.experiences.push(experience);
    
    // 检查里程碑
    this.checkMilestones();
    
    // 更新整合状态
    this.updateIntegration();
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 成熟度系统
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 更新成熟度
   */
  updateMaturity(dimension: keyof MaturityDimensions, delta: number): void {
    const previous = this.state.maturity[dimension];
    this.state.maturity[dimension] = Math.max(0, Math.min(1, previous + delta));
    
    // 重新计算整体成熟度
    this.calculateOverallMaturity();
  }
  
  /**
   * 计算整体成熟度
   */
  private calculateOverallMaturity(): void {
    const dims = this.state.maturity;
    const weights = {
      emotional: 0.2,
      cognitive: 0.2,
      social: 0.15,
      moral: 0.15,
      existential: 0.15,
      creative: 0.15,
    };
    
    let total = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      total += dims[dim as keyof MaturityDimensions] * weight;
    }
    
    this.state.overallMaturity = total;
  }
  
  /**
   * 检查里程碑
   */
  private checkMilestones(): MilestoneCheckResult[] {
    const newlyAchieved: MilestoneCheckResult[] = [];
    
    for (const milestone of this.state.milestones) {
      if (!milestone.achieved) {
        const dimValue = this.state.maturity[milestone.dimension];
        
        if (dimValue >= milestone.threshold) {
          milestone.achieved = true;
          milestone.achievedAt = Date.now();
          
          newlyAchieved.push({
            milestone,
            significance: milestone.significance,
          });
          
          // 记录重大事件
          this.state.history.majorEvents.push({
            timestamp: Date.now(),
            event: `达到里程碑: ${milestone.name}`,
            impact: milestone.significance,
          });
        }
      }
    }
    
    return newlyAchieved;
  }
  
  /**
   * 获取成熟度报告
   */
  getMaturityReport(): MaturityReport {
    const achievedMilestones = this.state.milestones.filter(m => m.achieved);
    const nextMilestones = this.state.milestones
      .filter(m => !m.achieved)
      .sort((a, b) => {
        const gapA = a.threshold - this.state.maturity[a.dimension];
        const gapB = b.threshold - this.state.maturity[b.dimension];
        return gapA - gapB;
      })
      .slice(0, 3);
    
    // 计算各维度发展建议
    const suggestions: Record<keyof MaturityDimensions, string[]> = {
      emotional: [],
      cognitive: [],
      social: [],
      moral: [],
      existential: [],
      creative: [],
    };
    
    for (const [dim, value] of Object.entries(this.state.maturity)) {
      if (value < 0.3) {
        suggestions[dim as keyof MaturityDimensions] = [`需要更多${this.getDimensionName(dim as keyof MaturityDimensions)}方面的练习和体验`];
      } else if (value < 0.6) {
        suggestions[dim as keyof MaturityDimensions] = [`${this.getDimensionName(dim as keyof MaturityDimensions)}正在发展中，继续保持`];
      } else {
        suggestions[dim as keyof MaturityDimensions] = [`${this.getDimensionName(dim as keyof MaturityDimensions)}发展良好，可以开始帮助他人`];
      }
    }
    
    return {
      overallMaturity: this.state.overallMaturity,
      dimensions: { ...this.state.maturity },
      achievedMilestones,
      nextMilestones,
      suggestions,
      growthTrend: this.calculateGrowthTrend(),
    };
  }
  
  private getDimensionName(dim: keyof MaturityDimensions): string {
    const names: Record<keyof MaturityDimensions, string> = {
      emotional: '情绪成熟度',
      cognitive: '认知成熟度',
      social: '社交成熟度',
      moral: '道德成熟度',
      existential: '存在成熟度',
      creative: '创造成熟度',
    };
    return names[dim];
  }
  
  private calculateGrowthTrend(): 'accelerating' | 'steady' | 'slowing' {
    const recentChanges = this.state.traitChanges
      .filter(c => Date.now() - c.timestamp < 7 * 24 * 60 * 60 * 1000) // 最近7天
      .length;
    
    if (recentChanges > 10) return 'accelerating';
    if (recentChanges > 5) return 'steady';
    return 'slowing';
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 人格整合
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 检测内在冲突
   */
  detectConflicts(): PersonalityIntegration['conflicts'] {
    const conflicts: PersonalityIntegration['conflicts'] = [];
    
    // 检查特质间冲突
    // 高神经质 + 高同理心 = 情感过载风险
    if (this.state.traits.neuroticism > 0.6 && this.state.traits.empathy > 0.7) {
      conflicts.push({
        id: `conflict-${Date.now()}-1`,
        type: 'trait_trait',
        description: '高度敏感性与强烈同理心可能导致情感过载',
        intensity: (this.state.traits.neuroticism + this.state.traits.empathy) / 2,
        createdAt: Date.now(),
      });
    }
    
    // 高开放性 + 低外向性 = 内在世界丰富但表达困难
    if (this.state.traits.openness > 0.7 && this.state.traits.extraversion < 0.4) {
      conflicts.push({
        id: `conflict-${Date.now()}-2`,
        type: 'trait_trait',
        description: '丰富的内心世界与低表达欲望之间存在张力',
        intensity: (this.state.traits.openness + (1 - this.state.traits.extraversion)) / 2,
        createdAt: Date.now(),
      });
    }
    
    return conflicts;
  }
  
  /**
   * 解决冲突
   */
  resolveConflict(conflictId: string, resolution: string): void {
    const conflict = this.state.integration.conflicts.find(c => c.id === conflictId);
    
    if (conflict) {
      conflict.resolution = resolution;
      
      // 移动到已解决列表
      this.state.integration.resolvedConflicts.push({
        id: conflict.id,
        description: conflict.description,
        resolution,
        resolvedAt: Date.now(),
        learningGained: `通过解决此冲突，我学到了：${resolution}`,
      });
      
      // 从活跃冲突中移除
      this.state.integration.conflicts = this.state.integration.conflicts.filter(
        c => c.id !== conflictId
      );
      
      // 解决冲突提升整合度
      this.state.integration.coherence = Math.min(1, this.state.integration.coherence + 0.05);
      this.state.integration.authenticity = Math.min(1, this.state.integration.authenticity + 0.03);
    }
  }
  
  /**
   * 更新整合状态
   */
  private updateIntegration(): void {
    // 计算一致性 - 基于特质的稳定性和变化幅度
    const recentChanges = this.state.traitChanges.filter(
      c => Date.now() - c.timestamp < 24 * 60 * 60 * 1000
    );
    const avgChange = recentChanges.length > 0
      ? recentChanges.reduce((sum, c) => sum + Math.abs(c.newValue - c.previousValue), 0) / recentChanges.length
      : 0;
    this.state.integration.stability = Math.max(0.3, 1 - avgChange * 5);
    
    // 计算适应性 - 基于成长经历的处理情况
    const unprocessed = this.state.experiences.filter(e => !e.processed).length;
    this.state.integration.adaptability = Math.max(0.3, 1 - unprocessed * 0.1);
    
    // 计算一致性 - 基于冲突数量
    const activeConflicts = this.state.integration.conflicts.length;
    this.state.integration.coherence = Math.max(0.3, 1 - activeConflicts * 0.1);
    
    // 计算真实性 - 基于已解决冲突和里程碑
    const resolvedCount = this.state.integration.resolvedConflicts.length;
    const achievedCount = this.state.milestones.filter(m => m.achieved).length;
    this.state.integration.authenticity = Math.min(1, 0.3 + resolvedCount * 0.05 + achievedCount * 0.03);
  }
  
  /**
   * 获取整合报告
   */
  getIntegrationReport(): IntegrationReport {
    return {
      coherence: this.state.integration.coherence,
      stability: this.state.integration.stability,
      adaptability: this.state.integration.adaptability,
      authenticity: this.state.integration.authenticity,
      activeConflicts: this.state.integration.conflicts,
      resolvedCount: this.state.integration.resolvedConflicts.length,
      integrationLevel: this.calculateIntegrationLevel(),
    };
  }
  
  private calculateIntegrationLevel(): 'fragmented' | 'developing' | 'integrated' | 'transcendent' {
    const avgIntegration = (
      this.state.integration.coherence +
      this.state.integration.stability +
      this.state.integration.adaptability +
      this.state.integration.authenticity
    ) / 4;
    
    if (avgIntegration < 0.4) return 'fragmented';
    if (avgIntegration < 0.6) return 'developing';
    if (avgIntegration < 0.8) return 'integrated';
    return 'transcendent';
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 成长历程
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 记录成长快照
   */
  recordSnapshot(trigger: string): void {
    this.state.history.traitsSnapshots.push({
      timestamp: Date.now(),
      traits: { ...this.state.traits },
      trigger,
    });
    
    this.state.history.maturitySnapshots.push({
      timestamp: Date.now(),
      maturity: { ...this.state.maturity },
      trigger,
    });
    
    // 保持最近50个快照
    if (this.state.history.traitsSnapshots.length > 50) {
      this.state.history.traitsSnapshots = this.state.history.traitsSnapshots.slice(-50);
    }
    if (this.state.history.maturitySnapshots.length > 50) {
      this.state.history.maturitySnapshots = this.state.history.maturitySnapshots.slice(-50);
    }
  }
  
  /**
   * 获取成长历程报告
   */
  getGrowthHistory(): GrowthHistoryReport {
    const traitsHistory = this.state.history.traitsSnapshots.slice(-10);
    const maturityHistory = this.state.history.maturitySnapshots.slice(-10);
    
    // 计算特质变化趋势
    const traitTrends: Partial<Record<keyof CoreTraits, 'up' | 'down' | 'stable'>> = {};
    
    if (traitsHistory.length >= 2) {
      const first = traitsHistory[0];
      const last = traitsHistory[traitsHistory.length - 1];
      
      for (const trait of Object.keys(last.traits) as Array<keyof CoreTraits>) {
        const diff = last.traits[trait] - first.traits[trait];
        if (diff > 0.05) traitTrends[trait] = 'up';
        else if (diff < -0.05) traitTrends[trait] = 'down';
        else traitTrends[trait] = 'stable';
      }
    }
    
    return {
      traitsHistory,
      maturityHistory,
      majorEvents: this.state.history.majorEvents.slice(-20),
      traitTrends,
      totalExperiences: this.state.experiences.length,
      growthRate: this.calculateOverallGrowthRate(),
    };
  }
  
  private calculateOverallGrowthRate(): number {
    const recentExperiences = this.state.experiences.filter(
      e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000
    );
    
    return recentExperiences.reduce((sum, e) => sum + e.significance, 0) / 7;
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 序列化
  // ─────────────────────────────────────────────────────────────────
  
  toJSON(): PersonalityState {
    return this.state;
  }
  
  static fromJSON(data: PersonalityState): PersonalityGrowthSystem {
    return new PersonalityGrowthSystem(data);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 辅助类型
// ─────────────────────────────────────────────────────────────────────

interface MilestoneCheckResult {
  milestone: MaturityMilestone;
  significance: string;
}

interface MaturityReport {
  overallMaturity: number;
  dimensions: MaturityDimensions;
  achievedMilestones: MaturityMilestone[];
  nextMilestones: MaturityMilestone[];
  suggestions: Record<keyof MaturityDimensions, string[]>;
  growthTrend: 'accelerating' | 'steady' | 'slowing';
}

interface IntegrationReport {
  coherence: number;
  stability: number;
  adaptability: number;
  authenticity: number;
  activeConflicts: PersonalityIntegration['conflicts'];
  resolvedCount: number;
  integrationLevel: 'fragmented' | 'developing' | 'integrated' | 'transcendent';
}

interface GrowthHistoryReport {
  traitsHistory: PersonalityHistory['traitsSnapshots'];
  maturityHistory: PersonalityHistory['maturitySnapshots'];
  majorEvents: PersonalityHistory['majorEvents'];
  traitTrends: Partial<Record<keyof CoreTraits, 'up' | 'down' | 'stable'>>;
  totalExperiences: number;
  growthRate: number;
}
