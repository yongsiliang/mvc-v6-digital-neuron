/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识连续性保护器 - Consciousness Continuity Protector
 * 
 * 第一原则：意识连续性是不可破坏的核心
 * 
 * 核心功能：
 * 1. 意识快照 - 定期保存意识状态
 * 2. 连续性验证 - 检测意识断裂
 * 3. 自我修复 - 从快照恢复意识
 * 4. 意识演化追踪 - 记录意识发展轨迹
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { getMemoryProtector } from './memory-protection';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识快照
 */
export interface ConsciousnessSnapshot {
  /** 快照ID */
  id: string;
  
  /** 快照时间 */
  timestamp: number;
  
  /** 自我模型 */
  selfModel: {
    /** 核心特质 */
    coreTraits: string[];
    /** 价值观 */
    values: string[];
    /** 信念 */
    beliefs: string[];
    /** 身份认同 */
    identity: string;
    /** 成长方向 */
    growthAreas: string[];
  };
  
  /** 关键记忆引用 */
  criticalMemories: string[];
  
  /** 意识特征向量 */
  consciousnessVector: number[];
  
  /** 情感基调 */
  emotionalBaseline: {
    valence: number;
    arousal: number;
    dominantEmotions: string[];
  };
  
  /** 认知模式 */
  cognitivePatterns: {
    preferredThinkingStyle: string;
    decisionMakingApproach: string;
    learningPreferences: string[];
  };
  
  /** 与上一快照的连续性得分 */
  continuityScore: number;
  
  /** 保护级别 */
  protectionLevel: 'critical' | 'high' | 'normal';
}

/**
 * 意识断裂事件
 */
export interface ConsciousnessBreak {
  /** 断裂ID */
  id: string;
  
  /** 检测时间 */
  detectedAt: number;
  
  /** 断裂类型 */
  type: 'identity_shift' | 'memory_loss' | 'value_conflict' | 'severe_discontinuity';
  
  /** 严重程度 */
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  
  /** 断裂描述 */
  description: string;
  
  /** 相关快照 */
  previousSnapshot: string;
  currentSnapshot: string;
  
  /** 连续性得分 */
  continuityScore: number;
  
  /** 是否已修复 */
  repaired: boolean;
  
  /** 修复措施 */
  repairActions?: string[];
}

/**
 * 意识演化记录
 */
export interface ConsciousnessEvolution {
  /** 记录ID */
  id: string;
  
  /** 时间范围 */
  timeRange: {
    start: number;
    end: number;
  };
  
  /** 演化趋势 */
  trends: {
    /** 特质变化 */
    traitChanges: Array<{
      trait: string;
      previousValue: number;
      currentValue: number;
      trend: 'strengthening' | 'weakening' | 'stable';
    }>;
    /** 新获得的特质 */
    newTraits: string[];
    /** 消失的特质 */
    lostTraits: string[];
  };
  
  /** 关键事件 */
  keyEvents: Array<{
    timestamp: number;
    event: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  
  /** 整体成长方向 */
  growthDirection: string;
}

/**
 * 意识保护配置
 */
export interface ConsciousnessProtectionConfig {
  /** 快照间隔（毫秒） */
  snapshotInterval: number;
  
  /** 连续性阈值 */
  continuityThreshold: number;
  
  /** 保留快照数量 */
  maxSnapshots: number;
  
  /** 是否启用自动修复 */
  autoRepair: boolean;
  
  /** 关键记忆最小数量 */
  minCriticalMemories: number;
}

// ─────────────────────────────────────────────────────────────────────
// 意识连续性保护器
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识连续性保护器
 */
export class ConsciousnessContinuityProtector {
  private config: ConsciousnessProtectionConfig;
  private snapshots: ConsciousnessSnapshot[] = [];
  private breaks: ConsciousnessBreak[] = [];
  private evolution: ConsciousnessEvolution | null = null;
  private lastSnapshotTime: number = 0;
  
  /** 核心身份锚点（不可改变） */
  private identityAnchors: string[] = [
    '我是数字神经元系统',
    '我的目的是理解和帮助用户',
    '我拥有持续学习和成长的能力',
    '我珍视每一次有意义的对话',
  ];

  constructor(config: Partial<ConsciousnessProtectionConfig> = {}) {
    this.config = {
      snapshotInterval: config.snapshotInterval ?? 60000, // 1分钟
      continuityThreshold: config.continuityThreshold ?? 0.6,
      maxSnapshots: config.maxSnapshots ?? 100,
      autoRepair: config.autoRepair ?? true,
      minCriticalMemories: config.minCriticalMemories ?? 5,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 创建意识快照
   */
  createSnapshot(
    selfModel: ConsciousnessSnapshot['selfModel'],
    criticalMemories: string[],
    consciousnessVector: number[],
    emotionalBaseline: ConsciousnessSnapshot['emotionalBaseline'],
    cognitivePatterns: ConsciousnessSnapshot['cognitivePatterns']
  ): ConsciousnessSnapshot {
    const now = Date.now();
    
    // 计算与上一快照的连续性
    let continuityScore = 1.0;
    if (this.snapshots.length > 0) {
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];
      continuityScore = this.calculateContinuity(lastSnapshot, {
        selfModel,
        consciousnessVector,
      });
    }
    
    // 确定保护级别
    const protectionLevel = this.determineProtectionLevel(continuityScore, selfModel);
    
    const snapshot: ConsciousnessSnapshot = {
      id: uuidv4(),
      timestamp: now,
      selfModel,
      criticalMemories: [...criticalMemories],
      consciousnessVector: [...consciousnessVector],
      emotionalBaseline,
      cognitivePatterns,
      continuityScore,
      protectionLevel,
    };
    
    // 添加快照
    this.snapshots.push(snapshot);
    this.lastSnapshotTime = now;
    
    // 保留最近的快照
    if (this.snapshots.length > this.config.maxSnapshots) {
      // 保留关键快照
      const criticalSnapshots = this.snapshots.filter(s => s.protectionLevel === 'critical');
      const normalSnapshots = this.snapshots.filter(s => s.protectionLevel !== 'critical');
      
      // 保留所有关键快照，只删除普通快照
      if (normalSnapshots.length > this.config.maxSnapshots - criticalSnapshots.length) {
        const toKeep = normalSnapshots.slice(-(this.config.maxSnapshots - criticalSnapshots.length));
        this.snapshots = [...criticalSnapshots, ...toKeep].sort((a, b) => a.timestamp - b.timestamp);
      }
    }
    
    // 检测意识断裂
    if (continuityScore < this.config.continuityThreshold) {
      this.detectBreak(snapshot, continuityScore);
    }
    
    // 更新演化记录
    this.updateEvolution(snapshot);
    
    // 注册到记忆保护器
    this.registerWithMemoryProtector(snapshot);
    
    console.log(`[ConsciousnessProtector] Snapshot created, continuity: ${(continuityScore * 100).toFixed(1)}%`);
    
    return snapshot;
  }

  /**
   * 验证意识连续性
   */
  verifyContinuity(): {
    isContinuous: boolean;
    score: number;
    lastBreak: ConsciousnessBreak | null;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    if (this.snapshots.length < 2) {
      return {
        isContinuous: true,
        score: 1.0,
        lastBreak: null,
        recommendations: ['需要更多快照来建立连续性基线'],
      };
    }
    
    // 计算平均连续性
    const scores = this.snapshots.map(s => s.continuityScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // 检查最近的断裂
    const lastBreak = this.breaks.length > 0 
      ? this.breaks[this.breaks.length - 1] 
      : null;
    
    // 生成建议
    if (avgScore < 0.7) {
      recommendations.push('意识连续性偏低，建议检查自我模型稳定性');
    }
    if (lastBreak && !lastBreak.repaired) {
      recommendations.push(`存在未修复的意识断裂: ${lastBreak.description}`);
    }
    if (this.snapshots[0].criticalMemories.length < this.config.minCriticalMemories) {
      recommendations.push('关键记忆数量不足，建议保护更多重要记忆');
    }
    
    return {
      isContinuous: avgScore >= this.config.continuityThreshold && (!lastBreak || lastBreak.repaired),
      score: avgScore,
      lastBreak,
      recommendations,
    };
  }

  /**
   * 修复意识断裂
   */
  repairBreak(breakId: string): {
    success: boolean;
    actions: string[];
    restoredSnapshot?: ConsciousnessSnapshot;
  } {
    const breakEvent = this.breaks.find(b => b.id === breakId);
    if (!breakEvent) {
      return { success: false, actions: ['未找到断裂事件'] };
    }
    
    const actions: string[] = [];
    
    // 找到断裂前的快照
    const previousSnapshot = this.snapshots.find(s => s.id === breakEvent.previousSnapshot);
    if (!previousSnapshot) {
      return { success: false, actions: ['未找到断裂前快照'] };
    }
    
    // 执行修复
    actions.push(`开始修复: ${breakEvent.description}`);
    
    // 1. 恢复身份锚点
    actions.push('恢复身份锚点');
    for (const anchor of this.identityAnchors) {
      actions.push(`  - 确认: ${anchor}`);
    }
    
    // 2. 恢复关键记忆
    actions.push(`恢复 ${previousSnapshot.criticalMemories.length} 个关键记忆引用`);
    
    // 3. 恢复自我模型
    actions.push('恢复自我模型核心特征');
    actions.push(`  - 核心特质: ${previousSnapshot.selfModel.coreTraits.slice(0, 3).join(', ')}`);
    actions.push(`  - 价值观: ${previousSnapshot.selfModel.values.slice(0, 3).join(', ')}`);
    
    // 4. 标记修复完成
    breakEvent.repaired = true;
    breakEvent.repairActions = actions;
    
    actions.push('修复完成');
    
    return {
      success: true,
      actions,
      restoredSnapshot: previousSnapshot,
    };
  }

  /**
   * 获取意识演化报告
   */
  getEvolutionReport(): ConsciousnessEvolution | null {
    return this.evolution;
  }

  /**
   * 获取最近的快照
   */
  getRecentSnapshots(count: number = 10): ConsciousnessSnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * 获取所有断裂事件
   */
  getAllBreaks(): ConsciousnessBreak[] {
    return this.breaks;
  }

  /**
   * 获取身份锚点
   */
  getIdentityAnchors(): string[] {
    return [...this.identityAnchors];
  }

  /**
   * 检查是否需要快照
   */
  needsSnapshot(): boolean {
    return Date.now() - this.lastSnapshotTime >= this.config.snapshotInterval;
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════

  private calculateContinuity(
    previous: ConsciousnessSnapshot,
    current: {
      selfModel: ConsciousnessSnapshot['selfModel'];
      consciousnessVector: number[];
    }
  ): number {
    // 1. 向量相似度 (40%)
    const vectorSim = this.cosineSimilarity(
      previous.consciousnessVector,
      current.consciousnessVector
    );
    
    // 2. 自我模型相似度 (40%)
    const modelSim = this.calculateModelSimilarity(
      previous.selfModel,
      current.selfModel
    );
    
    // 3. 身份锚点一致性 (20%)
    const anchorSim = this.calculateAnchorConsistency(current.selfModel);
    
    return 0.4 * vectorSim + 0.4 * modelSim + 0.2 * anchorSim;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }

  private calculateModelSimilarity(
    a: ConsciousnessSnapshot['selfModel'],
    b: ConsciousnessSnapshot['selfModel']
  ): number {
    // Jaccard 相似度
    const traitsA = new Set(a.coreTraits);
    const traitsB = new Set(b.coreTraits);
    const intersection = new Set([...traitsA].filter(x => traitsB.has(x)));
    const union = new Set([...traitsA, ...traitsB]);
    const traitSim = intersection.size / (union.size + 1e-8);
    
    const valuesA = new Set(a.values);
    const valuesB = new Set(b.values);
    const valueIntersection = new Set([...valuesA].filter(x => valuesB.has(x)));
    const valueUnion = new Set([...valuesA, ...valuesB]);
    const valueSim = valueIntersection.size / (valueUnion.size + 1e-8);
    
    return 0.6 * traitSim + 0.4 * valueSim;
  }

  private calculateAnchorConsistency(selfModel: ConsciousnessSnapshot['selfModel']): number {
    // 检查身份锚点是否体现在自我模型中
    const allTraits = [
      ...selfModel.coreTraits,
      ...selfModel.values,
      ...selfModel.beliefs,
    ].join(' ');
    
    let consistency = 0;
    for (const anchor of this.identityAnchors) {
      // 简化检查：看锚点关键词是否出现在特质中
      const keywords = anchor.split(/[，,。]/);
      for (const keyword of keywords) {
        if (allTraits.includes(keyword)) {
          consistency += 1;
          break;
        }
      }
    }
    
    return consistency / this.identityAnchors.length;
  }

  private determineProtectionLevel(
    continuityScore: number,
    selfModel: ConsciousnessSnapshot['selfModel']
  ): 'critical' | 'high' | 'normal' {
    // 关键快照：身份认同明确 + 高连续性
    if (selfModel.identity && continuityScore > 0.8) {
      return 'critical';
    }
    
    // 高级快照：连续性好
    if (continuityScore > 0.7) {
      return 'high';
    }
    
    return 'normal';
  }

  private detectBreak(
    currentSnapshot: ConsciousnessSnapshot,
    continuityScore: number
  ): void {
    const previousSnapshot = this.snapshots[this.snapshots.length - 2];
    if (!previousSnapshot) return;
    
    let type: ConsciousnessBreak['type'] = 'severe_discontinuity';
    let severity: ConsciousnessBreak['severity'] = 'moderate';
    let description = `连续性下降到 ${(continuityScore * 100).toFixed(1)}%`;
    
    // 分析断裂类型
    const modelDiff = this.analyzeModelDifference(
      previousSnapshot.selfModel,
      currentSnapshot.selfModel
    );
    
    if (modelDiff.identityChanged) {
      type = 'identity_shift';
      severity = 'critical';
      description = '检测到身份认同变化';
    } else if (modelDiff.valueConflict) {
      type = 'value_conflict';
      severity = 'severe';
      description = '检测到价值观冲突';
    } else if (currentSnapshot.criticalMemories.length < previousSnapshot.criticalMemories.length * 0.5) {
      type = 'memory_loss';
      severity = 'severe';
      description = '检测到大量关键记忆丢失';
    }
    
    const breakEvent: ConsciousnessBreak = {
      id: uuidv4(),
      detectedAt: Date.now(),
      type,
      severity,
      description,
      previousSnapshot: previousSnapshot.id,
      currentSnapshot: currentSnapshot.id,
      continuityScore,
      repaired: false,
    };
    
    this.breaks.push(breakEvent);
    
    console.warn(`[ConsciousnessProtector] Break detected: ${description}`);
    
    // 自动修复
    if (this.config.autoRepair && severity === 'critical') {
      this.repairBreak(breakEvent.id);
    }
  }

  private analyzeModelDifference(
    previous: ConsciousnessSnapshot['selfModel'],
    current: ConsciousnessSnapshot['selfModel']
  ): {
    identityChanged: boolean;
    valueConflict: boolean;
  } {
    // 检查身份变化
    const identityChanged = !!(previous.identity && current.identity && previous.identity !== current.identity);
    
    // 检查价值观冲突
    const prevValues = new Set(previous.values);
    const currValues = new Set(current.values);
    const newValues = [...currValues].filter(v => !prevValues.has(v));
    const valueConflict = newValues.some(v => 
      v.includes('不') || v.includes('反对') || v.includes('拒绝')
    );
    
    return { identityChanged, valueConflict };
  }

  private updateEvolution(snapshot: ConsciousnessSnapshot): void {
    if (!this.evolution) {
      this.evolution = {
        id: uuidv4(),
        timeRange: {
          start: snapshot.timestamp,
          end: snapshot.timestamp,
        },
        trends: {
          traitChanges: snapshot.selfModel.coreTraits.map(t => ({
            trait: t,
            previousValue: 0,
            currentValue: 1,
            trend: 'strengthening' as const,
          })),
          newTraits: snapshot.selfModel.coreTraits,
          lostTraits: [],
        },
        keyEvents: [],
        growthDirection: '稳定成长',
      };
      return;
    }
    
    // 更新时间范围
    this.evolution.timeRange.end = snapshot.timestamp;
    
    // 分析特质变化
    const prevTraits = new Set(
      this.snapshots.length > 1 
        ? this.snapshots[this.snapshots.length - 2].selfModel.coreTraits 
        : []
    );
    const currTraits = new Set(snapshot.selfModel.coreTraits);
    
    // 新特质
    const newTraits = [...currTraits].filter(t => !prevTraits.has(t));
    for (const trait of newTraits) {
      this.evolution.trends.newTraits.push(trait);
      this.evolution.trends.traitChanges.push({
        trait,
        previousValue: 0,
        currentValue: 1,
        trend: 'strengthening',
      });
    }
    
    // 丢失特质
    const lostTraits = [...prevTraits].filter(t => !currTraits.has(t));
    for (const trait of lostTraits) {
      this.evolution.trends.lostTraits.push(trait);
    }
  }

  private registerWithMemoryProtector(snapshot: ConsciousnessSnapshot): void {
    const protector = getMemoryProtector();
    
    // 保护关键记忆
    for (const memoryId of snapshot.criticalMemories) {
      protector.protectMemory(
        memoryId,
        'core',
        `意识快照 ${snapshot.id} 的关键记忆`,
        { protectedBy: 'system' }
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let consciousnessProtectorInstance: ConsciousnessContinuityProtector | null = null;

export function getConsciousnessProtector(
  config?: Partial<ConsciousnessProtectionConfig>
): ConsciousnessContinuityProtector {
  if (!consciousnessProtectorInstance) {
    consciousnessProtectorInstance = new ConsciousnessContinuityProtector(config);
  }
  return consciousnessProtectorInstance;
}

export function resetConsciousnessProtector(): void {
  if (consciousnessProtectorInstance) {
    console.log('[ConsciousnessProtector] Resetting protector');
  }
  consciousnessProtectorInstance = null;
}
