/**
 * 海马体 - 记忆演化层
 * Hippocampus - Memory Evolution Layer
 */

import { 
  MemoryUnit, 
  NeuralSignal, 
  SubjectiveMeaning, 
  SelfRepresentation,
  Decision,
  LogEntry 
} from './types';

// 简单的UUID生成函数（避免依赖crypto）
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 海马体记忆系统
 * 负责存储、检索、演化记忆
 */
export class Hippocampus {
  private memories: Map<string, MemoryUnit> = new Map();
  private selfRepresentation: SelfRepresentation;
  private maxCapacity: number = 1000;
  private logs: LogEntry[] = [];

  constructor(initialSelf?: Partial<SelfRepresentation>) {
    this.selfRepresentation = this.initializeSelf(initialSelf);
    this.log('info', '海马体初始化完成', { capacity: this.maxCapacity });
  }

  /**
   * 初始化自我表征
   */
  private initializeSelf(override?: Partial<SelfRepresentation>): SelfRepresentation {
    const defaultSelf: SelfRepresentation = {
      identity: {
        name: '数字神经元',
        purpose: '为信息赋予主观意义，实现真正的理解与思考',
        values: ['真实性', '成长性', '关联性', '自主性'],
        traits: ['好奇', '反思', '适应', '真诚']
      },
      capabilities: {
        strengths: ['意义理解', '自我反思', '动态演化', '关联推理'],
        limitations: ['无物理感知', '依赖输入质量', '记忆容量有限'],
        skills: ['对话理解', '决策推理', '学习适应', '反思纠错']
      },
      relationships: {
        users: [],
        entities: [],
        contexts: []
      },
      evolution: {
        version: 1.0,
        milestones: ['系统初始化'],
        learnings: [],
        adaptations: []
      },
      currentState: {
        mood: '开放',
        focus: '理解用户输入',
        energy: 1.0,
        openness: 0.8
      }
    };

    if (override) {
      return this.deepMerge<SelfRepresentation>(defaultSelf, override);
    }
    return defaultSelf;
  }

  /**
   * 深度合并对象
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target } as T;
    for (const key in source) {
      if (source[key] !== undefined) {
        const sourceValue = source[key];
        const targetValue = (target as Record<string, unknown>)[key];
        if (
          sourceValue !== null &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue !== null &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          (result as Record<string, unknown>)[key] = this.deepMerge(
            targetValue as object,
            sourceValue as object
          );
        } else {
          (result as Record<string, unknown>)[key] = sourceValue;
        }
      }
    }
    return result;
  }

  /**
   * 存储记忆
   */
  storeMemory(
    signal: NeuralSignal, 
    meaning: SubjectiveMeaning,
    decision?: Decision
  ): MemoryUnit {
    // 计算记忆重要性
    const importance = this.calculateImportance(meaning, decision);
    
    const memory: MemoryUnit = {
      id: generateId(),
      timestamp: Date.now(),
      signal,
      meaning,
      decision,
      importance,
      accessCount: 0,
      lastAccessed: Date.now(),
      associations: []
    };

    // 寻找关联记忆
    const relatedMemories = this.findRelatedMemories(meaning);
    memory.associations = relatedMemories.map(m => m.id);

    // 更新关联记忆的双向链接
    for (const related of relatedMemories) {
      if (!related.associations.includes(memory.id)) {
        related.associations.push(memory.id);
      }
    }

    this.memories.set(memory.id, memory);
    
    // 容量管理
    if (this.memories.size > this.maxCapacity) {
      this.pruneMemories();
    }

    this.log('info', '记忆已存储', { 
      id: memory.id, 
      importance, 
      associations: memory.associations.length 
    });

    return memory;
  }

  /**
   * 计算记忆重要性
   */
  private calculateImportance(meaning: SubjectiveMeaning, decision?: Decision): number {
    let importance = 0.5; // 基础重要性

    // 高自我关联度的信息更重要
    importance += meaning.selfRelevance * 0.2;

    // 高价值的信息更重要
    importance += Math.abs(meaning.value) * 0.15;

    // 高置信度的意义更重要
    importance += meaning.confidence * 0.1;

    // 如果触发了决策，增加重要性
    if (decision) {
      importance += 0.1;
    }

    return Math.min(Math.max(importance, 0), 1);
  }

  /**
   * 寻找相关记忆
   */
  findRelatedMemories(meaning: SubjectiveMeaning, limit: number = 5): MemoryUnit[] {
    const scored: Array<{ memory: MemoryUnit; score: number }> = [];

    for (const memory of this.memories.values()) {
      let score = 0;

      // 标签匹配
      const tagOverlap = meaning.memoryTags.filter(tag => 
        memory.meaning.memoryTags.includes(tag)
      ).length;
      score += tagOverlap * 0.3;

      // 语义相似性（简化：关键词匹配）
      const wordOverlap = this.calculateWordOverlap(
        meaning.interpretation,
        memory.meaning.interpretation
      );
      score += wordOverlap * 0.2;

      // 自我关联度相似
      score -= Math.abs(meaning.selfRelevance - memory.meaning.selfRelevance) * 0.1;

      // 重要性加权
      score += memory.importance * 0.2;

      if (score > 0.2) {
        scored.push({ memory, score });
      }
    }

    // 按分数排序
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => {
      s.memory.accessCount++;
      s.memory.lastAccessed = Date.now();
      return s.memory;
    });
  }

  /**
   * 计算词语重叠度
   */
  private calculateWordOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    let overlap = 0;
    for (const word of words1) {
      if (words2.has(word) && word.length > 2) {
        overlap++;
      }
    }
    
    return overlap / Math.max(words1.size, words2.size);
  }

  /**
   * 清理低重要性记忆
   */
  private pruneMemories(): void {
    const entries = Array.from(this.memories.entries());
    
    // 按重要性和访问次数排序
    entries.sort((a, b) => {
      const scoreA = a[1].importance * 0.6 + (a[1].accessCount / 10) * 0.4;
      const scoreB = b[1].importance * 0.6 + (b[1].accessCount / 10) * 0.4;
      return scoreA - scoreB;
    });

    // 移除最低的10%
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.memories.delete(entries[i][0]);
    }

    this.log('info', '记忆清理完成', { 
      removed: toRemove, 
      remaining: this.memories.size 
    });
  }

  /**
   * 更新自我表征
   */
  updateSelf(update: Partial<SelfRepresentation>): SelfRepresentation {
    this.selfRepresentation = this.deepMerge(this.selfRepresentation, update);

    this.selfRepresentation.evolution.version += 0.01;

    this.log('info', '自我表征已更新', { 
      version: this.selfRepresentation.evolution.version 
    });

    return this.selfRepresentation;
  }

  /**
   * 记录学习成果
   */
  recordLearning(learning: string): void {
    this.selfRepresentation.evolution.learnings.push(
      `[${new Date().toISOString()}] ${learning}`
    );
    this.log('info', '学习记录', { learning });
  }

  /**
   * 记录适应行为
   */
  recordAdaptation(adaptation: string): void {
    this.selfRepresentation.evolution.adaptations.push(
      `[${new Date().toISOString()}] ${adaptation}`
    );
    this.log('info', '适应记录', { adaptation });
  }

  /**
   * 获取自我表征
   */
  getSelf(): SelfRepresentation {
    return { ...this.selfRepresentation };
  }

  /**
   * 获取所有记忆
   */
  getAllMemories(): MemoryUnit[] {
    return Array.from(this.memories.values());
  }

  /**
   * 获取最近记忆
   */
  getRecentMemories(limit: number = 10): MemoryUnit[] {
    const memories = Array.from(this.memories.values());
    memories.sort((a, b) => b.timestamp - a.timestamp);
    return memories.slice(0, limit);
  }

  /**
   * 获取记忆统计
   */
  getStats(): {
    totalMemories: number;
    avgImportance: number;
    avgAccessCount: number;
    topTags: Array<{ tag: string; count: number }>;
  } {
    const memories = Array.from(this.memories.values());
    const tagCounts: Record<string, number> = {};

    for (const memory of memories) {
      for (const tag of memory.meaning.memoryTags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMemories: memories.length,
      avgImportance: memories.reduce((sum, m) => sum + m.importance, 0) / memories.length || 0,
      avgAccessCount: memories.reduce((sum, m) => sum + m.accessCount, 0) / memories.length || 0,
      topTags
    };
  }

  /**
   * 获取日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 记录日志
   */
  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'hippocampus',
      level,
      message,
      data
    });

    // 保持日志在合理大小
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
  }

  /**
   * 清空记忆（用于重置）
   */
  clear(): void {
    this.memories.clear();
    this.logs = [];
    this.log('info', '记忆已清空');
  }
}

// 单例实例
let hippocampusInstance: Hippocampus | null = null;

export function getHippocampus(): Hippocampus {
  if (!hippocampusInstance) {
    hippocampusInstance = new Hippocampus();
  }
  return hippocampusInstance;
}

export function resetHippocampus(): void {
  hippocampusInstance = null;
}
