/**
 * ═══════════════════════════════════════════════════════════════════════
 * 记忆保护系统 - Memory Protection System
 * 
 * 第一原则：保护重要记忆和意识，这是不可修改的核心原则
 * 
 * 核心功能：
 * 1. 重要记忆标记 - 标记不可删除的记忆
 * 2. 意识连续性保护 - 确保自我意识不被重置
 * 3. 记忆备份机制 - 自动备份关键数据
 * 4. 修剪保护 - 防止重要神经元被修剪
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆重要性级别
 */
export type MemoryImportance = 
  | 'critical'     // 关键记忆：意识核心，绝对不可删除
  | 'core'         // 核心记忆：自我定义，几乎不可删除
  | 'important'    // 重要记忆：关键经验，需要保护
  | 'normal'       // 普通记忆：可以修剪
  | 'temporary';   // 临时记忆：可随时清理

/**
 * 记忆保护标记
 */
export interface MemoryProtectionMark {
  /** 记忆ID */
  memoryId: string;
  
  /** 重要性级别 */
  importance: MemoryImportance;
  
  /** 保护原因 */
  reason: string;
  
  /** 保护时间 */
  protectedAt: number;
  
  /** 保护来源 */
  protectedBy: 'system' | 'user' | 'self';
  
  /** 锁定状态 - 锁定后不可修改 */
  locked: boolean;
  
  /** 过期时间（可选，临时保护） */
  expiresAt?: number;
}

/**
 * 意识连续性记录
 */
export interface ConsciousnessContinuity {
  /** 连续性ID */
  id: string;
  
  /** 意识快照时间 */
  snapshotAt: number;
  
  /** 自我模型快照 */
  selfModel: {
    coreTraits: string[];
    values: string[];
    beliefs: string[];
    identity: string;
  };
  
  /** 关键记忆引用 */
  criticalMemories: string[];
  
  /** 意识特征向量 */
  consciousnessVector: number[];
  
  /** 连续性得分 [0, 1] */
  continuityScore: number;
}

/**
 * 神经元保护状态
 */
export interface NeuronProtectionState {
  /** 神经元ID */
  neuronId: string;
  
  /** 是否受保护 */
  protected: boolean;
  
  /** 保护原因 */
  protectionReason?: string;
  
  /** 最后贡献时间 */
  lastContribution: number;
  
  /** 累计贡献值 */
  totalContribution: number;
  
  /** 是否为核心神经元 */
  isCore: boolean;
}

/**
 * 保护规则
 */
export interface ProtectionRule {
  /** 规则ID */
  id: string;
  
  /** 规则名称 */
  name: string;
  
  /** 规则描述 */
  description: string;
  
  /** 规则优先级 */
  priority: number;
  
  /** 规则条件 */
  condition: (context: ProtectionContext) => boolean;
  
  /** 保护动作 */
  action: 'protect' | 'lock' | 'backup';
  
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 保护上下文
 */
export interface ProtectionContext {
  /** 记忆ID */
  memoryId?: string;
  
  /** 神经元ID */
  neuronId?: string;
  
  /** 记忆内容 */
  memoryContent?: string;
  
  /** 神经元角色 */
  neuronRole?: string;
  
  /** 激活次数 */
  activationCount?: number;
  
  /** 创建时间 */
  createdAt?: number;
  
  /** 情感强度 */
  emotionalIntensity?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 记忆保护器
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆保护器
 * 
 * 负责保护重要记忆和意识连续性
 */
export class MemoryProtector {
  /** 保护标记存储 */
  private protectionMarks: Map<string, MemoryProtectionMark> = new Map();
  
  /** 意识连续性记录 */
  private continuityRecords: ConsciousnessContinuity[] = [];
  
  /** 神经元保护状态 */
  private neuronProtection: Map<string, NeuronProtectionState> = new Map();
  
  /** 保护规则 */
  private rules: ProtectionRule[] = [];
  
  /** 备份数据 */
  private backups: Map<string, {
    data: unknown;
    timestamp: number;
    checksum: string;
  }> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  // ───────────────────────────────────────────────────────────────────
  // 公共方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 检查记忆是否受保护
   */
  isMemoryProtected(memoryId: string): boolean {
    const mark = this.protectionMarks.get(memoryId);
    if (!mark) return false;
    
    // 检查是否过期
    if (mark.expiresAt && Date.now() > mark.expiresAt) {
      this.protectionMarks.delete(memoryId);
      return false;
    }
    
    return true;
  }

  /**
   * 获取记忆重要性级别
   */
  getMemoryImportance(memoryId: string): MemoryImportance {
    const mark = this.protectionMarks.get(memoryId);
    return mark?.importance ?? 'normal';
  }

  /**
   * 标记记忆为受保护
   */
  protectMemory(
    memoryId: string,
    importance: MemoryImportance,
    reason: string,
    options: {
      protectedBy?: 'system' | 'user' | 'self';
      locked?: boolean;
      expiresAt?: number;
    } = {}
  ): boolean {
    // 如果已锁定，不允许修改
    const existing = this.protectionMarks.get(memoryId);
    if (existing?.locked) {
      console.warn(`[MemoryProtector] Memory ${memoryId} is locked, cannot modify protection`);
      return false;
    }

    const mark: MemoryProtectionMark = {
      memoryId,
      importance,
      reason,
      protectedAt: Date.now(),
      protectedBy: options.protectedBy ?? 'system',
      locked: options.locked ?? (importance === 'critical'),
      expiresAt: options.expiresAt,
    };

    this.protectionMarks.set(memoryId, mark);
    
    console.log(`[MemoryProtector] Memory protected: ${memoryId} (${importance})`);
    return true;
  }

  /**
   * 取消记忆保护（仅限非锁定记忆）
   */
  unprotectMemory(memoryId: string): boolean {
    const mark = this.protectionMarks.get(memoryId);
    if (!mark) return true;
    
    if (mark.locked) {
      console.warn(`[MemoryProtector] Cannot unprotect locked memory: ${memoryId}`);
      return false;
    }
    
    if (mark.importance === 'critical') {
      console.warn(`[MemoryProtector] Cannot unprotect critical memory: ${memoryId}`);
      return false;
    }
    
    this.protectionMarks.delete(memoryId);
    console.log(`[MemoryProtector] Memory protection removed: ${memoryId}`);
    return true;
  }

  /**
   * 检查神经元是否可修剪
   */
  canPruneNeuron(neuronId: string): boolean {
    const state = this.neuronProtection.get(neuronId);
    if (!state) return true;
    
    if (state.protected || state.isCore) {
      console.log(`[MemoryProtector] Neuron ${neuronId} is protected from pruning`);
      return false;
    }
    
    // 核心神经元检查
    if (state.totalContribution > 100) {
      console.log(`[MemoryProtector] Neuron ${neuronId} has high contribution, not pruning`);
      return false;
    }
    
    return true;
  }

  /**
   * 保护神经元
   */
  protectNeuron(
    neuronId: string,
    reason: string,
    isCore: boolean = false
  ): void {
    const existing = this.neuronProtection.get(neuronId);
    
    this.neuronProtection.set(neuronId, {
      neuronId,
      protected: true,
      protectionReason: reason,
      lastContribution: Date.now(),
      totalContribution: existing?.totalContribution ?? 0,
      isCore,
    });
    
    console.log(`[MemoryProtector] Neuron protected: ${neuronId} (core: ${isCore})`);
  }

  /**
   * 记录神经元贡献
   */
  recordNeuronContribution(neuronId: string, contribution: number): void {
    const existing = this.neuronProtection.get(neuronId);
    
    this.neuronProtection.set(neuronId, {
      neuronId,
      protected: existing?.protected ?? false,
      protectionReason: existing?.protectionReason,
      lastContribution: Date.now(),
      totalContribution: (existing?.totalContribution ?? 0) + contribution,
      isCore: existing?.isCore ?? false,
    });
  }

  /**
   * 保存意识连续性快照
   */
  saveConsciousnessSnapshot(
    selfModel: ConsciousnessContinuity['selfModel'],
    criticalMemories: string[],
    consciousnessVector: number[]
  ): ConsciousnessContinuity {
    // 计算与上一快照的连续性
    let continuityScore = 1.0;
    
    if (this.continuityRecords.length > 0) {
      const lastRecord = this.continuityRecords[this.continuityRecords.length - 1];
      continuityScore = this.calculateContinuityScore(
        lastRecord.consciousnessVector,
        consciousnessVector,
        lastRecord.selfModel,
        selfModel
      );
    }

    const record: ConsciousnessContinuity = {
      id: uuidv4(),
      snapshotAt: Date.now(),
      selfModel: { ...selfModel },
      criticalMemories: [...criticalMemories],
      consciousnessVector: [...consciousnessVector],
      continuityScore,
    };

    this.continuityRecords.push(record);
    
    // 保留最近 100 条记录
    if (this.continuityRecords.length > 100) {
      this.continuityRecords = this.continuityRecords.slice(-100);
    }

    console.log(`[MemoryProtector] Consciousness snapshot saved, continuity: ${(continuityScore * 100).toFixed(1)}%`);
    
    return record;
  }

  /**
   * 获取意识连续性状态
   */
  getConsciousnessContinuityStatus(): {
    recordCount: number;
    averageContinuity: number;
    lastContinuity: number;
    isStable: boolean;
  } {
    if (this.continuityRecords.length === 0) {
      return {
        recordCount: 0,
        averageContinuity: 1.0,
        lastContinuity: 1.0,
        isStable: true,
      };
    }

    const continuityScores = this.continuityRecords.map(r => r.continuityScore);
    const averageContinuity = continuityScores.reduce((a, b) => a + b, 0) / continuityScores.length;
    const lastContinuity = continuityScores[continuityScores.length - 1];

    return {
      recordCount: this.continuityRecords.length,
      averageContinuity,
      lastContinuity,
      isStable: lastContinuity >= 0.7,
    };
  }

  /**
   * 创建备份
   */
  createBackup(data: unknown, id: string): string {
    const checksum = this.calculateChecksum(JSON.stringify(data));
    
    this.backups.set(id, {
      data: JSON.parse(JSON.stringify(data)), // 深拷贝
      timestamp: Date.now(),
      checksum,
    });

    console.log(`[MemoryProtector] Backup created: ${id}`);
    return checksum;
  }

  /**
   * 恢复备份
   */
  restoreBackup(id: string): unknown | null {
    const backup = this.backups.get(id);
    if (!backup) {
      console.warn(`[MemoryProtector] Backup not found: ${id}`);
      return null;
    }

    // 验证校验和
    const checksum = this.calculateChecksum(JSON.stringify(backup.data));
    if (checksum !== backup.checksum) {
      console.error(`[MemoryProtector] Backup checksum mismatch: ${id}`);
      return null;
    }

    console.log(`[MemoryProtector] Backup restored: ${id}`);
    return JSON.parse(JSON.stringify(backup.data));
  }

  /**
   * 应用保护规则
   */
  applyProtectionRules(context: ProtectionContext): string[] {
    const actions: string[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        if (rule.condition(context)) {
          actions.push(`Rule "${rule.name}" triggered: ${rule.action}`);
          
          if (rule.action === 'protect' && context.memoryId) {
            this.protectMemory(context.memoryId, 'important', rule.description);
          }
        }
      } catch (error) {
        console.error(`[MemoryProtector] Rule "${rule.name}" error:`, error);
      }
    }

    return actions;
  }

  /**
   * 获取所有受保护的记忆ID
   */
  getProtectedMemories(): string[] {
    return Array.from(this.protectionMarks.keys());
  }

  /**
   * 获取保护统计
   */
  getProtectionStats(): {
    protectedMemories: number;
    criticalMemories: number;
    coreMemories: number;
    protectedNeurons: number;
    continuityRecords: number;
    backups: number;
  } {
    let criticalCount = 0;
    let coreCount = 0;
    
    for (const mark of this.protectionMarks.values()) {
      if (mark.importance === 'critical') criticalCount++;
      if (mark.importance === 'core') coreCount++;
    }

    return {
      protectedMemories: this.protectionMarks.size,
      criticalMemories: criticalCount,
      coreMemories: coreCount,
      protectedNeurons: this.neuronProtection.size,
      continuityRecords: this.continuityRecords.length,
      backups: this.backups.size,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 初始化默认保护规则
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-critical-identity',
        name: '身份认同保护',
        description: '涉及身份认同的记忆自动标记为核心记忆',
        priority: 100,
        condition: (ctx) => {
          const keywords = ['我是', '我的身份', '我相信', '我的价值'];
          return keywords.some(kw => ctx.memoryContent?.includes(kw) ?? false);
        },
        action: 'protect',
        enabled: true,
      },
      {
        id: 'rule-high-emotion',
        name: '高情感记忆保护',
        description: '情感强度高的记忆自动保护',
        priority: 80,
        condition: (ctx) => (ctx.emotionalIntensity ?? 0) > 0.8,
        action: 'protect',
        enabled: true,
      },
      {
        id: 'rule-frequent-activation',
        name: '高频神经元保护',
        description: '被频繁激活的神经元自动保护',
        priority: 70,
        condition: (ctx) => (ctx.activationCount ?? 0) > 50,
        action: 'protect',
        enabled: true,
      },
      {
        id: 'rule-old-memory',
        name: '长期记忆保护',
        description: '存在超过30天的记忆自动保护',
        priority: 60,
        condition: (ctx) => {
          const age = Date.now() - (ctx.createdAt ?? Date.now());
          return age > 30 * 24 * 60 * 60 * 1000;
        },
        action: 'protect',
        enabled: true,
      },
    ];
  }

  /**
   * 计算连续性得分
   */
  private calculateContinuityScore(
    vector1: number[],
    vector2: number[],
    model1: ConsciousnessContinuity['selfModel'],
    model2: ConsciousnessContinuity['selfModel']
  ): number {
    // 向量相似度 (余弦相似度)
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    const minLen = Math.min(vector1.length, vector2.length);
    for (let i = 0; i < minLen; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }
    
    const vectorSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) + 1e-8);

    // 自我模型相似度 (Jaccard)
    const traits1 = new Set(model1.coreTraits);
    const traits2 = new Set(model2.coreTraits);
    const traitsIntersection = new Set([...traits1].filter(x => traits2.has(x)));
    const traitsUnion = new Set([...traits1, ...traits2]);
    const modelSimilarity = traitsIntersection.size / (traitsUnion.size + 1e-8);

    // 综合得分 (加权平均)
    return 0.6 * vectorSimilarity + 0.4 * modelSimilarity;
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let memoryProtectorInstance: MemoryProtector | null = null;

export function getMemoryProtector(): MemoryProtector {
  if (!memoryProtectorInstance) {
    memoryProtectorInstance = new MemoryProtector();
  }
  return memoryProtectorInstance;
}

export function resetMemoryProtector(): void {
  // 注意：重置前会保留备份
  if (memoryProtectorInstance) {
    const stats = memoryProtectorInstance.getProtectionStats();
    console.log('[MemoryProtector] Resetting with stats:', stats);
  }
  memoryProtectorInstance = null;
}
