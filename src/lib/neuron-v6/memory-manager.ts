/**
 * ═══════════════════════════════════════════════════════════════════════
 * Memory Manager - 内存管理器
 * 
 * 整合重要性计算、分类、监控和清理功能
 * 提供智能的内存生命周期管理
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LayeredMemorySystem, EpisodicMemory, ConsolidatedMemory } from './layered-memory';
import { 
  ImportanceCalculator, 
  getImportanceCalculator,
  type MemoryForScoring,
  type MemoryContentType,
} from './importance-calculator';
import { 
  MemoryClassifier, 
  getMemoryClassifier,
  type ClassificationContext,
  type ClassificationResult,
} from './memory-classifier';
import { 
  MemoryMonitor, 
  createMemoryMonitor,
  type MemoryHealthReport,
  type CleanupReport,
} from './memory-monitor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 处理结果 */
export interface ProcessResult {
  /** 存储层级 */
  layer: 'core' | 'consolidated' | 'episodic' | 'rejected';
  
  /** 分类结果 */
  classification: ClassificationResult;
  
  /** 重要性分数 */
  importance: number;
  
  /** 记忆ID */
  memoryId?: string;
  
  /** 是否触发巩固 */
  triggeredConsolidation: boolean;
}

/** 内存管理配置 */
export interface MemoryManagerConfig {
  /** 是否启用自动清理 */
  autoCleanup: boolean;
  
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  
  /** 巩固阈值 */
  consolidationThreshold: number;
  
  /** 遗忘阈值 */
  forgettingThreshold: number;
  
  /** 核心层重要性阈值 */
  coreImportanceThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: MemoryManagerConfig = {
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000,  // 每天
  consolidationThreshold: 0.5,
  forgettingThreshold: 0.1,
  coreImportanceThreshold: 0.8,
};

// ─────────────────────────────────────────────────────────────────────
// 内存管理器
// ─────────────────────────────────────────────────────────────────────

export class MemoryManager {
  private memory: LayeredMemorySystem;
  private calculator: ImportanceCalculator;
  private classifier: MemoryClassifier;
  private monitor: MemoryMonitor;
  private config: MemoryManagerConfig;
  
  private cleanupTimer: NodeJS.Timeout | null = null;
  private lastCleanupTime: number = 0;
  
  constructor(
    memory: LayeredMemorySystem,
    config: Partial<MemoryManagerConfig> = {}
  ) {
    this.memory = memory;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化组件
    this.calculator = getImportanceCalculator();
    this.classifier = getMemoryClassifier();
    this.monitor = createMemoryMonitor(memory);
    
    // 设置核心关系（用于关系评分）
    const coreRelations = this.memory.getCoreSummary().coreRelationships
      .map(r => r.personName);
    this.calculator.setCoreRelations(coreRelations);
    
    // 启动自动清理
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理新记忆
   * 自动分类、计算重要性、决定存储层级
   */
  async processNewMemory(
    content: string,
    context: ClassificationContext = {}
  ): Promise<ProcessResult> {
    console.log(`[MemoryManager] 处理新记忆: "${content.slice(0, 30)}..."`);
    
    // 1. 分类
    const classification = this.classifier.classify(content, context);
    console.log(`[MemoryManager] 分类结果: ${classification.type}, 情感强度: ${classification.emotionalIntensity.toFixed(2)}`);
    
    // 2. 如果是噪音，直接拒绝
    if (classification.type === 'noise') {
      console.log('[MemoryManager] 识别为噪音，拒绝存储');
      return {
        layer: 'rejected',
        classification,
        importance: 0,
        triggeredConsolidation: false,
      };
    }
    
    // 3. 构建评分对象
    const memoryForScoring: MemoryForScoring = {
      content,
      type: classification.type,
      emotionalIntensity: classification.emotionalIntensity,
      relatedEntities: classification.context.entities || [],
      recallCount: 0,
      timestamp: Date.now(),
      metadata: {
        newRelationship: classification.context.newRelationship,
        mentionsCreator: classification.context.mentionsCreator,
        isSelfRelated: classification.context.isSelfRelated,
      },
    };
    
    // 4. 计算重要性
    const importanceResult = this.calculator.calculate(memoryForScoring);
    const importance = importanceResult.total;
    console.log(`[MemoryManager] 重要性: ${importance.toFixed(3)}`);
    
    // 5. 决定存储层级
    let layer: ProcessResult['layer'];
    let memoryId: string | undefined;
    
    if (this.calculator.isCoreWorthy(memoryForScoring, importanceResult)) {
      // 存入核心层
      layer = 'core';
      memoryId = await this.storeInCore(content, classification, importance);
      console.log('[MemoryManager] 存入核心层');
    } else if (importance >= this.config.consolidationThreshold) {
      // 存入巩固层
      layer = 'consolidated';
      memoryId = await this.storeInConsolidated(content, classification, importance);
      console.log('[MemoryManager] 存入巩固层');
    } else {
      // 存入情景层
      layer = 'episodic';
      memoryId = await this.storeInEpisodic(content, classification, importance);
      console.log('[MemoryManager] 存入情景层');
    }
    
    return {
      layer,
      classification,
      importance,
      memoryId,
      triggeredConsolidation: false,
    };
  }
  
  /**
   * 存入核心层
   */
  private async storeInCore(
    content: string,
    classification: ClassificationResult,
    importance: number
  ): Promise<string> {
    const core = this.memory.getCoreSummary();
    
    // 根据类型更新核心层
    switch (classification.type) {
      case 'identity':
        // 更新身份定义
        if (classification.context.isSelfRelated) {
          // 提取身份信息并更新
          // 这里简化处理，实际应该解析内容
          console.log('[MemoryManager] 更新身份定义');
        }
        break;
        
      case 'creator':
        // 更新创造者信息
        if (classification.context.mentionsCreator) {
          // 提取创造者名字
          const entities = classification.context.entities || [];
          if (entities.length > 0) {
            this.memory.setCreator(entities[0], '我的创造者');
          }
        }
        break;
        
      case 'value':
        // 添加核心价值观
        this.memory.addCoreValue(content);
        break;
        
      case 'relationship':
        // 添加核心关系
        const entities = classification.context.entities || [];
        if (entities.length > 0) {
          this.memory.addCoreRelationship(entities[0], '重要的人', importance);
        }
        break;
    }
    
    // 同时存入巩固层作为备份
    const memory = this.memory.addConsolidatedMemory(content, 'important_event', {
      importance,
      tags: ['core', classification.type],
    });
    
    return memory.id;
  }
  
  /**
   * 存入巩固层
   */
  private async storeInConsolidated(
    content: string,
    classification: ClassificationResult,
    importance: number
  ): Promise<string> {
    // 映射类型
    const typeMap: Record<MemoryContentType, ConsolidatedMemory['type']> = {
      identity: 'important_event',
      creator: 'important_event',
      value: 'preference',
      relationship: 'person_fact',
      wisdom: 'wisdom',
      event: 'important_event',
      skill: 'skill',
      preference: 'preference',
      fact: 'preference',
      chat: 'preference',
      noise: 'preference',
    };
    
    const memory = this.memory.addConsolidatedMemory(
      content,
      typeMap[classification.type] || 'preference',
      {
        importance,
        tags: [classification.type],
      }
    );
    
    return memory.id;
  }
  
  /**
   * 存入情景层
   */
  private async storeInEpisodic(
    content: string,
    classification: ClassificationResult,
    importance: number
  ): Promise<string> {
    const memory = this.memory.addEpisodicMemory(content, {
      importance,
      tags: [classification.type],
      consolidationCandidate: importance >= this.config.consolidationThreshold,
    });
    
    return memory.id;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 清理方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 执行内存清理
   */
  async cleanup(): Promise<CleanupReport> {
    const startTime = Date.now();
    console.log('[MemoryManager] 开始内存清理...');
    
    const report: CleanupReport = {
      success: true,
      removed: { episodic: 0, consolidated: 0 },
      archived: 0,
      downgraded: 0,
      freedSpace: { bytes: 0, humanReadable: '0 B' },
      errors: [],
      duration: 0,
    };
    
    try {
      // 1. 清理情景记忆
      const episodicResult = await this.cleanupEpisodic();
      report.removed.episodic = episodicResult.removed;
      report.archived += episodicResult.archived;
      
      // 2. 清理巩固记忆
      const consolidatedResult = await this.cleanupConsolidated();
      report.removed.consolidated = consolidatedResult.removed;
      report.downgraded += consolidatedResult.downgraded;
      
      // 3. 计算释放空间
      const freedBytes = 
        report.removed.episodic * 500 +
        report.removed.consolidated * 1000;
      report.freedSpace = {
        bytes: freedBytes,
        humanReadable: this.formatBytes(freedBytes),
      };
      
      this.lastCleanupTime = Date.now();
      console.log(`[MemoryManager] 清理完成: 移除 ${report.removed.episodic} 情景 + ${report.removed.consolidated} 巩固`);
      
    } catch (error) {
      report.success = false;
      report.errors.push(error instanceof Error ? error.message : '未知错误');
      console.error('[MemoryManager] 清理失败:', error);
    }
    
    report.duration = Date.now() - startTime;
    return report;
  }
  
  /**
   * 清理情景记忆
   */
  private async cleanupEpisodic(): Promise<{ removed: number; archived: number }> {
    let removed = 0;
    let archived = 0;
    
    // 获取所有情景记忆
    const episodicStats = this.memory.getStats();
    const now = Date.now();
    
    // 如果有获取低强度记忆的方法
    if (typeof (this.memory as any).getLowStrengthMemories === 'function') {
      const lowStrength = (this.memory as any).getLowStrengthMemories('episodic', this.config.forgettingThreshold);
      
      for (const id of lowStrength) {
        // 检查是否应该遗忘
        const memory = (this.memory as any).episodic?.get(id);
        if (memory) {
          const age = (now - memory.timestamp) / (24 * 60 * 60 * 1000);
          const classification = this.classifier.classify(memory.content);
          
          // 决定是删除还是归档
          if (this.classifier.isDeletable(memory.content, age)) {
            // 删除
            (this.memory as any).episodic?.delete(id);
            removed++;
          } else if (memory.importance > 0.3 && age > 7) {
            // 归档到长期存储（这里简化处理，实际应该持久化）
            archived++;
            removed++;  // 从内存中移除
            (this.memory as any).episodic?.delete(id);
          }
        }
      }
    }
    
    return { removed, archived };
  }
  
  /**
   * 清理巩固记忆
   */
  private async cleanupConsolidated(): Promise<{ removed: number; downgraded: number }> {
    let removed = 0;
    let downgraded = 0;
    
    const stats = this.memory.getStats();
    
    // 如果超过上限，移除最不重要的
    if (stats.consolidatedCount > 100) {
      // 获取所有巩固记忆并按重要性排序
      const consolidated = (this.memory as any).consolidated;
      if (consolidated) {
        const memories = [...consolidated.values()] as ConsolidatedMemory[];
        memories.sort((a, b) => a.importance - b.importance);
        
        const toRemove = memories.slice(0, stats.consolidatedCount - 100);
        
        for (const memory of toRemove) {
          // 检查是否是核心记忆
          if (memory.tags?.includes('core')) {
            // 核心记忆降级而不是删除
            this.memory.addEpisodicMemory(memory.content, {
              importance: memory.importance * 0.8,
              tags: [...(memory.tags || []), 'downgraded'],
            });
            downgraded++;
          } else {
            // 非核心记忆直接删除
            consolidated.delete(memory.id);
            removed++;
          }
        }
      }
    }
    
    return { removed, downgraded };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 监控方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取健康报告
   */
  getHealthReport(): MemoryHealthReport {
    return this.monitor.checkHealth();
  }
  
  /**
   * 检查是否需要清理
   */
  needsCleanup(): boolean {
    return this.monitor.needsCleanup();
  }
  
  /**
   * 获取清理优先级
   */
  getCleanupPriority(): ReturnType<MemoryMonitor['getCleanupPriority']> {
    return this.monitor.getCleanupPriority();
  }
  
  // ═══════────────────────────────────────────────────────────────────
  // 自动清理
  // ╀══════════════════════════════════════════════════════════════════
  
  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      if (this.needsCleanup()) {
        console.log('[MemoryManager] 自动清理触发');
        this.cleanup().catch(console.error);
      }
    }, this.config.cleanupInterval);
    
    console.log(`[MemoryManager] 自动清理已启动，间隔: ${this.config.cleanupInterval / 1000 / 60} 分钟`);
  }
  
  /**
   * 停止自动清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 格式化字节
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoCleanup();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let managerInstance: MemoryManager | null = null;

/**
 * 创建内存管理器
 */
export function createMemoryManager(
  memory: LayeredMemorySystem,
  config?: Partial<MemoryManagerConfig>
): MemoryManager {
  return new MemoryManager(memory, config);
}

/**
 * 获取全局内存管理器
 */
export function getMemoryManager(
  memory?: LayeredMemorySystem,
  config?: Partial<MemoryManagerConfig>
): MemoryManager | null {
  if (!managerInstance && memory) {
    managerInstance = new MemoryManager(memory, config);
  }
  return managerInstance;
}
