/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智慧演化系统 (Wisdom Evolution System)
 * 
 * 核心思想：
 * - 完整的闭环：链接 → 模式 → 规律 → 智慧 → 指导 → 链接
 * - 双向流动：向上提炼，向下指导
 * - 演化压力：适者生存，保持系统精简
 * - 共振传播：智慧通过软约束影响链接
 * 
 * 架构：
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      链接层 (Link Field)                    │
 * │                     模式层 (Pattern Attractor)              │
 * │                     规律层 (Law Network)                    │
 * │                     智慧层 (Wisdom Space)                   │
 * └─────────────────────────────────────────────────────────────┘
 *          ↑                    ↓
 *        提炼                  指导
 *          │                    │
 *          └────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LinkRecord, LinkParticle, LinkFieldConfig } from './link-field';
import { LinkField, createLinkField } from './link-field';
import type { PatternAttractor, AttractorPhase } from './pattern-attractor';
import { AttractorDynamics, createAttractorDynamics } from './pattern-attractor';
import type { LawEdge, AbstractLaw, LawDiscoveryResult } from './law-network';
import { LawNetwork, createLawNetwork } from './law-network';
import type { WisdomVector, WisdomGuidance, WisdomType } from './wisdom-space';
import { WisdomSpace, createWisdomSpace } from './wisdom-space';

// ─────────────────────────────────────────────────────────────────────
// 常量配置
// ─────────────────────────────────────────────────────────────────────

/** 规律更新周期（毫秒） */
const LAW_UPDATE_INTERVAL = 60 * 1000;

/** 智慧升华周期（毫秒） */
const WISDOM_SUBLIMATION_INTERVAL = 5 * 60 * 1000;

/** 演化压力周期（毫秒） */
const EVOLUTION_PRESSURE_INTERVAL = 10 * 60 * 1000;

/** 最小链接数才能触发规律发现 */
const MIN_LINKS_FOR_LAW = 10;

/** 最小规律数才能触发智慧升华 */
const MIN_LAWS_FOR_WISDOM = 3;

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 演化结果
 */
export interface EvolutionResult {
  /** 新粒子 */
  newParticle: LinkParticle;
  
  /** 吸引结果 */
  attraction: {
    attracted: boolean;
    attractorId: string | null;
    newPattern: PatternAttractor | null;
  };
  
  /** 规律更新 */
  lawUpdate: LawDiscoveryResult | null;
  
  /** 新智慧 */
  newWisdoms: WisdomVector[];
}

/**
 * 行动指导
 */
export interface ActionGuidance {
  /** 推荐的行动倾向 */
  preferredActions: Array<{
    type: string;
    score: number;
    reason: string;
  }>;
  
  /** 共振强度 */
  resonanceStrength: number;
  
  /** 来源追溯 */
  source: {
    wisdom: string;
    law: string;
    pattern: string;
  };
}

/**
 * 演化系统配置
 */
export interface EvolutionConfig {
  lawUpdateInterval: number;
  wisdomSublimationInterval: number;
  evolutionPressureInterval: number;
  minLinksForLaw: number;
  minLawsForWisdom: number;
}

/**
 * 系统状态摘要
 */
export interface SystemStatus {
  linkField: {
    particleCount: number;
    avgCharge: number;
    potentialPeaks: number;
  };
  patterns: {
    total: number;
    byPhase: Record<AttractorPhase, number>;
    avgStrength: number;
  };
  laws: {
    nodeCount: number;
    edgeCount: number;
    abstractLawCount: number;
  };
  wisdom: {
    total: number;
    byType: Record<WisdomType, number>;
    avgAuthority: number;
  };
  lastLawUpdate: number;
  lastWisdomSublimation: number;
  lastEvolutionPressure: number;
}

// ─────────────────────────────────────────────────────────────────────
// 智慧演化系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 智慧演化系统
 */
export class WisdomEvolutionSystem {
  private config: EvolutionConfig;
  
  // 核心组件
  private linkField: LinkField;
  private attractorDynamics: AttractorDynamics;
  private lawNetwork: LawNetwork;
  private wisdomSpace: WisdomSpace;
  
  // 时间追踪
  private lastLawUpdate: number = 0;
  private lastWisdomSublimation: number = 0;
  private lastEvolutionPressure: number = 0;
  
  // 统计
  private linkCount: number = 0;
  private patternSequenceBuffer: Array<{ patternIds: string[]; timestamps: number[] }> = [];
  
  constructor(config?: Partial<EvolutionConfig>) {
    this.config = {
      lawUpdateInterval: config?.lawUpdateInterval || LAW_UPDATE_INTERVAL,
      wisdomSublimationInterval: config?.wisdomSublimationInterval || WISDOM_SUBLIMATION_INTERVAL,
      evolutionPressureInterval: config?.evolutionPressureInterval || EVOLUTION_PRESSURE_INTERVAL,
      minLinksForLaw: config?.minLinksForLaw || MIN_LINKS_FOR_LAW,
      minLawsForWisdom: config?.minLawsForWisdom || MIN_LAWS_FOR_WISDOM,
    };
    
    // 初始化组件
    this.linkField = createLinkField();
    this.attractorDynamics = createAttractorDynamics(this.linkField);
    this.lawNetwork = createLawNetwork();
    this.wisdomSpace = createWisdomSpace();
    
    console.log('[演化系统] 初始化完成');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 记录链接（入口）
   * 
   * 每个链接触发整个系统的微调
   */
  async recordLink(record: LinkRecord): Promise<EvolutionResult> {
    this.linkCount++;
    
    // 1. 链接进入场
    const particle = this.linkField.addParticle(record);
    
    // 2. 处理吸引
    const attraction = this.attractorDynamics.processParticle(particle);
    
    // 3. 记录模式序列
    if (attraction.attractorId) {
      this.recordPatternSequence(attraction.attractorId);
    }
    
    // 4. 检查是否需要更新规律
    let lawUpdate: LawDiscoveryResult | null = null;
    if (this.shouldUpdateLaws()) {
      lawUpdate = await this.updateLaws();
      this.lastLawUpdate = Date.now();
    }
    
    // 5. 检查是否需要升华智慧
    let newWisdoms: WisdomVector[] = [];
    if (this.shouldSublimateWisdom()) {
      newWisdoms = await this.sublimateWisdom();
      this.lastWisdomSublimation = Date.now();
    }
    
    // 6. 检查是否需要施加演化压力
    if (this.shouldApplyEvolutionPressure()) {
      this.applyEvolutionPressure();
      this.lastEvolutionPressure = Date.now();
    }
    
    return {
      newParticle: particle,
      attraction: {
        attracted: attraction.attractorId !== null,
        attractorId: attraction.attractorId,
        newPattern: attraction.newAttractor,
      },
      lawUpdate,
      newWisdoms,
    };
  }
  
  /**
   * 获取指导（出口）
   * 
   * 根据当前上下文，从智慧向下传播指导
   */
  async getGuidance(context: string, domain?: string): Promise<ActionGuidance> {
    // 1. 从智慧空间获取指导
    const wisdomGuidances = this.wisdomSpace.getGuidance(context, domain);
    
    if (wisdomGuidances.length === 0) {
      // 回退到规律层
      return this.getGuidanceFromLaws(context);
    }
    
    // 2. 选择最佳指导
    const best = wisdomGuidances[0];
    
    // 3. 向下投影到行动层
    const preferredActions = this.projectToActions(best.wisdom);
    
    // 4. 标记智慧被应用
    this.wisdomSpace.applyWisdom(best.wisdom.id);
    
    return {
      preferredActions,
      resonanceStrength: best.applicability,
      source: {
        wisdom: best.wisdom.summary,
        law: best.source.law,
        pattern: best.source.pattern,
      },
    };
  }
  
  /**
   * 反馈验证
   * 
   * 行动执行后反馈结果
   */
  feedback(wisdomId: string, success: boolean, context?: string): void {
    this.wisdomSpace.validateWisdom(wisdomId, success);
    
    if (!success && context) {
      this.wisdomSpace.addCounterExample(wisdomId, context);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 向上提炼
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新规律网络
   */
  private async updateLaws(): Promise<LawDiscoveryResult> {
    const patterns = this.attractorDynamics.getAllAttractors();
    
    const result = this.lawNetwork.discoverFromPatterns(
      patterns,
      this.patternSequenceBuffer
    );
    
    // 清空缓冲区
    this.patternSequenceBuffer = [];
    
    console.log(`[演化系统] 规律更新: 新增 ${result.newEdges.length} 边, ${result.newAbstractLaws.length} 抽象规律`);
    
    return result;
  }
  
  /**
   * 升华智慧
   */
  private async sublimateWisdom(): Promise<WisdomVector[]> {
    const laws = this.lawNetwork.getAbstractLaws();
    
    if (laws.length < this.config.minLawsForWisdom) {
      return [];
    }
    
    const newWisdoms = this.wisdomSpace.sublimateFromLaws(laws);
    
    console.log(`[演化系统] 智慧升华: 新增 ${newWisdoms.length} 条智慧`);
    
    return newWisdoms;
  }
  
  /**
   * 记录模式序列
   */
  private recordPatternSequence(patternId: string): void {
    const now = Date.now();
    
    // 添加到最近的序列
    if (this.patternSequenceBuffer.length === 0) {
      this.patternSequenceBuffer.push({
        patternIds: [patternId],
        timestamps: [now],
      });
    } else {
      const last = this.patternSequenceBuffer[this.patternSequenceBuffer.length - 1];
      const timeGap = now - last.timestamps[last.timestamps.length - 1];
      
      // 如果时间间隔小于5分钟，认为是同一序列
      if (timeGap < 5 * 60 * 1000 && last.patternIds.length < 20) {
        last.patternIds.push(patternId);
        last.timestamps.push(now);
      } else {
        // 新序列
        this.patternSequenceBuffer.push({
          patternIds: [patternId],
          timestamps: [now],
        });
      }
    }
    
    // 限制缓冲区大小
    if (this.patternSequenceBuffer.length > 100) {
      this.patternSequenceBuffer = this.patternSequenceBuffer.slice(-50);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 向下指导
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 从规律获取指导（回退）
   */
  private getGuidanceFromLaws(context: string): ActionGuidance {
    // 找到最相关的模式
    const relevantPattern = this.attractorDynamics.getMostRelevantAttractor(context);
    
    if (!relevantPattern) {
      return {
        preferredActions: [],
        resonanceStrength: 0,
        source: { wisdom: '', law: '', pattern: '' },
      };
    }
    
    // 获取后续模式
    const nextPatterns = this.lawNetwork.getNextPatterns(relevantPattern.id);
    
    return {
      preferredActions: nextPatterns.map(p => ({
        type: p.patternId,
        score: p.probability,
        reason: `基于模式转移概率 ${p.probability.toFixed(2)}`,
      })),
      resonanceStrength: relevantPattern.confidence,
      source: {
        wisdom: '',
        law: '',
        pattern: relevantPattern.summary,
      },
    };
  }
  
  /**
   * 投影到行动层
   */
  private projectToActions(wisdom: WisdomVector): Array<{
    type: string;
    score: number;
    reason: string;
  }> {
    const actions: Array<{ type: string; score: number; reason: string }> = [];
    
    // 根据智慧类型推断推荐行动
    const typeActions: Record<WisdomType, string[]> = {
      procedural: ['execute_sequence', 'follow_steps', 'proceed_carefully'],
      diagnostic: ['verify', 'check', 'inspect'],
      strategic: ['decide', 'choose', 'prioritize'],
      relational: ['connect', 'relate', 'integrate'],
      temporal: ['wait', 'time_it', 'sequence'],
    };
    
    const recommendedTypes = typeActions[wisdom.type] || [];
    
    for (const type of recommendedTypes) {
      actions.push({
        type,
        score: wisdom.crossDomainScore * wisdom.evolution.successRate,
        reason: `基于智慧: ${wisdom.summary}`,
      });
    }
    
    return actions;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 演化压力
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 应用演化压力
   * 
   * 适者生存：长期未被验证的元素会衰亡
   */
  private applyEvolutionPressure(): void {
    console.log('[演化系统] 应用演化压力...');
    
    // 1. 吸引子衰减
    this.attractorDynamics.applyTimeDecay();
    
    // 2. 智慧衰减已在 WisdomSpace 中通过验证机制实现
    
    // 3. 规律衰减已在 LawNetwork 中通过低置信度移除实现
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 条件检查
  // ══════════════════════════════════════════════════════════════════
  
  private shouldUpdateLaws(): boolean {
    const elapsed = Date.now() - this.lastLawUpdate;
    return (
      elapsed >= this.config.lawUpdateInterval &&
      this.linkCount >= this.config.minLinksForLaw &&
      this.patternSequenceBuffer.length >= 3
    );
  }
  
  private shouldSublimateWisdom(): boolean {
    const elapsed = Date.now() - this.lastWisdomSublimation;
    const lawCount = this.lawNetwork.getStats().abstractLawCount;
    
    return (
      elapsed >= this.config.wisdomSublimationInterval &&
      lawCount >= this.config.minLawsForWisdom
    );
  }
  
  private shouldApplyEvolutionPressure(): boolean {
    return Date.now() - this.lastEvolutionPressure >= this.config.evolutionPressureInterval;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态查询
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取系统状态
   */
  getStatus(): SystemStatus {
    const fieldState = this.linkField.getFieldState();
    const patternStats = this.attractorDynamics.getStats();
    const lawStats = this.lawNetwork.getStats();
    const wisdomStats = this.wisdomSpace.getStats();
    
    return {
      linkField: {
        particleCount: fieldState.particleCount,
        avgCharge: fieldState.avgCharge,
        potentialPeaks: fieldState.potentialPeaks,
      },
      patterns: {
        total: patternStats.totalAttractors,
        byPhase: patternStats.byPhase,
        avgStrength: patternStats.avgStrength,
      },
      laws: {
        nodeCount: lawStats.nodeCount,
        edgeCount: lawStats.edgeCount,
        abstractLawCount: lawStats.abstractLawCount,
      },
      wisdom: {
        total: wisdomStats.totalWisdoms,
        byType: wisdomStats.byType,
        avgAuthority: wisdomStats.avgAuthority,
      },
      lastLawUpdate: this.lastLawUpdate,
      lastWisdomSublimation: this.lastWisdomSublimation,
      lastEvolutionPressure: this.lastEvolutionPressure,
    };
  }
  
  /**
   * 获取所有模式
   */
  getAllPatterns(): PatternAttractor[] {
    return this.attractorDynamics.getAllAttractors();
  }
  
  /**
   * 获取所有规律
   */
  getAllLaws(): AbstractLaw[] {
    return this.lawNetwork.getAbstractLaws();
  }
  
  /**
   * 获取所有智慧
   */
  getAllWisdoms(): WisdomVector[] {
    return this.wisdomSpace.getAllWisdoms();
  }
  
  /**
   * 导出完整状态
   */
  exportState(): string {
    return JSON.stringify({
      linkField: this.linkField.exportState(),
      patterns: this.attractorDynamics.exportState(),
      laws: this.lawNetwork.exportState(),
      wisdoms: this.wisdomSpace.exportState(),
      meta: {
        linkCount: this.linkCount,
        lastLawUpdate: this.lastLawUpdate,
        lastWisdomSublimation: this.lastWisdomSublimation,
        lastEvolutionPressure: this.lastEvolutionPressure,
      },
    });
  }
  
  /**
   * 导入完整状态
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.linkField) {
        this.linkField.importState(parsed.linkField);
      }
      if (parsed.patterns) {
        this.attractorDynamics.importState(parsed.patterns);
      }
      if (parsed.laws) {
        this.lawNetwork.importState(parsed.laws);
      }
      if (parsed.wisdoms) {
        this.wisdomSpace.importState(parsed.wisdoms);
      }
      
      if (parsed.meta) {
        this.linkCount = parsed.meta.linkCount || 0;
        this.lastLawUpdate = parsed.meta.lastLawUpdate || 0;
        this.lastWisdomSublimation = parsed.meta.lastWisdomSublimation || 0;
        this.lastEvolutionPressure = parsed.meta.lastEvolutionPressure || 0;
      }
      
      console.log('[演化系统] 状态已恢复');
    } catch (e) {
      console.error('[演化系统] 导入状态失败:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let systemInstance: WisdomEvolutionSystem | null = null;

export function createWisdomEvolutionSystem(
  config?: Partial<EvolutionConfig>
): WisdomEvolutionSystem {
  if (!systemInstance) {
    systemInstance = new WisdomEvolutionSystem(config);
  }
  return systemInstance;
}

export function getWisdomEvolutionSystem(): WisdomEvolutionSystem | null {
  return systemInstance;
}

// 重新导出类型
export type { LinkRecord, LinkParticle } from './link-field';
export type { PatternAttractor, AttractorPhase, PatternType } from './pattern-attractor';
export type { LawEdge, AbstractLaw, LawEdgeType } from './law-network';
export type { WisdomVector, WisdomGuidance, WisdomType } from './wisdom-space';
