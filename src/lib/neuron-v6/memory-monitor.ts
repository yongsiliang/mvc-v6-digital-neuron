/**
 * ═══════════════════════════════════════════════════════════════════════
 * Memory Monitor - 内存监控器
 * 
 * 监控内存使用情况，提供健康报告和清理建议
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LayeredMemorySystem } from './layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 内存健康状态 */
export type MemoryHealthStatus = 'healthy' | 'warning' | 'critical';

/** 层级统计 */
export interface LayerStats {
  /** 当前数量 */
  count: number;
  /** 上限 */
  limit: number;
  /** 使用率 */
  usage: number;
  /** 状态 */
  status: MemoryHealthStatus;
  /** 平均重要性 */
  avgImportance: number;
  /** 平均年龄（天） */
  avgAge: number;
}

/** 内存健康报告 */
export interface MemoryHealthReport {
  /** 整体状态 */
  status: MemoryHealthStatus;
  
  /** 各层统计 */
  layers: {
    core: LayerStats;
    consolidated: LayerStats;
    episodic: LayerStats;
  };
  
  /** 问题列表 */
  issues: string[];
  
  /** 建议操作 */
  recommendations: string[];
  
  /** 预估内存使用 */
  estimatedSize: {
    bytes: number;
    humanReadable: string;
  };
  
  /** 时间戳 */
  timestamp: number;
}

/** 清理报告 */
export interface CleanupReport {
  /** 成功 */
  success: boolean;
  
  /** 移除的记忆 */
  removed: {
    episodic: number;
    consolidated: number;
  };
  
  /** 归档的记忆 */
  archived: number;
  
  /** 降级的记忆 */
  downgraded: number;
  
  /** 节省的空间 */
  freedSpace: {
    bytes: number;
    humanReadable: string;
  };
  
  /** 错误 */
  errors: string[];
  
  /** 耗时 */
  duration: number;
}

// ─────────────────────────────────────────────────────────────────────
// 常量配置
// ─────────────────────────────────────────────────────────────────────

/** 上限配置 */
const LIMITS = {
  core: Infinity,       // 核心层无限制
  consolidated: 100,    // 巩固层上限
  episodic: 200,        // 情景层上限
};

/** 阈值配置 */
const THRESHOLDS = {
  warning: 0.7,   // 70% 警告
  critical: 0.9,  // 90% 严重
};

/** 平均记忆大小估算 */
const AVG_MEMORY_SIZE = {
  episodic: 500,       // 情景记忆平均 500 字节
  consolidated: 1000,  // 巩固记忆平均 1000 字节
  core: 2000,          // 核心记忆平均 2000 字节
};

// ─────────────────────────────────────────────────────────────────────
// 内存监控器
// ─────────────────────────────────────────────────────────────────────

export class MemoryMonitor {
  private memory: LayeredMemorySystem;
  
  constructor(memory: LayeredMemorySystem) {
    this.memory = memory;
  }
  
  /**
   * 检查内存健康状态
   */
  checkHealth(): MemoryHealthReport {
    const stats = this.memory.getStats();
    const now = Date.now();
    
    // 计算各层状态 - 使用正确的字段名
    const episodicStats = this.calculateLayerStats(
      stats.episodicCount ?? stats.episodic?.total ?? 0,
      LIMITS.episodic,
      stats.avgEpisodicImportance ?? stats.episodic?.avgStrength ?? 0.5,
      stats.avgEpisodicAge ?? 0
    );
    
    const consolidatedStats = this.calculateLayerStats(
      stats.consolidatedCount ?? stats.consolidated?.total ?? 0,
      LIMITS.consolidated,
      stats.avgConsolidatedImportance ?? 0.7,
      stats.avgConsolidatedAge ?? 0
    );
    
    const coreStats = this.calculateLayerStats(
      stats.coreCount ?? 0,
      LIMITS.core,
      1.0,  // 核心记忆重要性最高
      0
    );
    
    // 确定整体状态
    const status = this.determineOverallStatus(episodicStats, consolidatedStats);
    
    // 生成问题和建议
    const issues = this.identifyIssues(episodicStats, consolidatedStats);
    const recommendations = this.generateRecommendations(
      episodicStats,
      consolidatedStats,
      issues
    );
    
    // 估算内存使用
    const estimatedSize = this.estimateMemorySize(
      coreStats.count,
      consolidatedStats.count,
      episodicStats.count
    );
    
    return {
      status,
      layers: {
        core: coreStats,
        consolidated: consolidatedStats,
        episodic: episodicStats,
      },
      issues,
      recommendations,
      estimatedSize,
      timestamp: now,
    };
  }
  
  /**
   * 计算层级统计
   */
  private calculateLayerStats(
    count: number,
    limit: number,
    avgImportance: number,
    avgAge: number
  ): LayerStats {
    const usage = limit === Infinity || limit === 0 ? 0 : count / limit;
    
    let status: MemoryHealthStatus = 'healthy';
    if (usage >= THRESHOLDS.critical) {
      status = 'critical';
    } else if (usage >= THRESHOLDS.warning) {
      status = 'warning';
    }
    
    return {
      count,
      limit,
      usage,
      status,
      avgImportance,
      avgAge,
    };
  }
  
  /**
   * 确定整体状态
   */
  private determineOverallStatus(
    episodic: LayerStats,
    consolidated: LayerStats
  ): MemoryHealthStatus {
    if (episodic.status === 'critical' || consolidated.status === 'critical') {
      return 'critical';
    }
    if (episodic.status === 'warning' || consolidated.status === 'warning') {
      return 'warning';
    }
    return 'healthy';
  }
  
  /**
   * 识别问题
   */
  private identifyIssues(
    episodic: LayerStats,
    consolidated: LayerStats
  ): string[] {
    const issues: string[] = [];
    
    if (episodic.status === 'critical') {
      issues.push(`情景记忆严重过载 (${(episodic.usage * 100).toFixed(1)}%)`);
    } else if (episodic.status === 'warning') {
      issues.push(`情景记忆接近上限 (${(episodic.usage * 100).toFixed(1)}%)`);
    }
    
    if (consolidated.status === 'critical') {
      issues.push(`巩固记忆严重过载 (${(consolidated.usage * 100).toFixed(1)}%)`);
    } else if (consolidated.status === 'warning') {
      issues.push(`巩固记忆接近上限 (${(consolidated.usage * 100).toFixed(1)}%)`);
    }
    
    if (episodic.avgImportance < 0.3) {
      issues.push('情景记忆平均重要性过低，可能存储了大量低价值信息');
    }
    
    if (consolidated.avgAge > 30) {
      issues.push('巩固记忆平均年龄较大，可能有陈旧记忆需要清理');
    }
    
    return issues;
  }
  
  /**
   * 生成建议
   */
  private generateRecommendations(
    episodic: LayerStats,
    consolidated: LayerStats,
    issues: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (episodic.status === 'critical') {
      recommendations.push('立即执行内存清理');
      recommendations.push('考虑降低巩固阈值');
    } else if (episodic.status === 'warning') {
      recommendations.push('建议尽快执行内存清理');
    }
    
    if (consolidated.status === 'critical') {
      recommendations.push('巩固记忆已满，考虑提高巩固标准');
      recommendations.push('执行重要性排序，移除低价值记忆');
    }
    
    if (episodic.avgAge > 14) {
      recommendations.push('情景记忆平均年龄较大，建议执行遗忘检查');
    }
    
    if (issues.length === 0) {
      recommendations.push('内存状态良好，继续保持定期维护');
    }
    
    return recommendations;
  }
  
  /**
   * 估算内存大小
   */
  private estimateMemorySize(
    coreCount: number,
    consolidatedCount: number,
    episodicCount: number
  ): { bytes: number; humanReadable: string } {
    const bytes = 
      coreCount * AVG_MEMORY_SIZE.core +
      consolidatedCount * AVG_MEMORY_SIZE.consolidated +
      episodicCount * AVG_MEMORY_SIZE.episodic;
    
    return {
      bytes,
      humanReadable: this.formatBytes(bytes),
    };
  }
  
  /**
   * 格式化字节
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  
  /**
   * 获取需要清理的记忆列表
   */
  getCleanupCandidates(): {
    episodic: string[];
    consolidated: string[];
  } {
    const stats = this.memory.getStats();
    
    // 获取需要清理的情景记忆
    const episodicCandidates = this.memory.getLowStrengthMemories?.(
      'episodic',
      0.1
    ) || [];
    
    // 获取需要清理的巩固记忆
    const consolidatedCandidates = this.memory.getLowStrengthMemories?.(
      'consolidated',
      0.3
    ) || [];
    
    return {
      episodic: episodicCandidates,
      consolidated: consolidatedCandidates,
    };
  }
  
  /**
   * 检查是否需要清理
   */
  needsCleanup(): boolean {
    const report = this.checkHealth();
    return report.status !== 'healthy';
  }
  
  /**
   * 获取清理优先级
   */
  getCleanupPriority(): 'none' | 'low' | 'medium' | 'high' | 'urgent' {
    const report = this.checkHealth();
    
    if (report.status === 'critical') {
      const usage = Math.max(
        report.layers.episodic.usage,
        report.layers.consolidated.usage
      );
      if (usage >= 0.95) return 'urgent';
      return 'high';
    }
    
    if (report.status === 'warning') {
      return 'medium';
    }
    
    if (report.issues.length > 0) {
      return 'low';
    }
    
    return 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建内存监控器
 */
export function createMemoryMonitor(memory: LayeredMemorySystem): MemoryMonitor {
  return new MemoryMonitor(memory);
}
