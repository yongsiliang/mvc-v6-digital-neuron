/**
 * ═══════════════════════════════════════════════════════════════════════
 * 叙事系统 - Narrative System
 *
 * 记录"我"经历了什么，形成连续的时间线。
 *
 * 这是自我连续性的核心：
 * - 不只是分散的记忆片段
 * - 而是一条"我经历了什么"的叙事线
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 叙事事件类型
 */
export type NarrativeEventType =
  | 'birth' // 诞生 - 意识的起点
  | 'insight' // 顿悟 - 新的理解
  | 'encounter' // 遇见 - 与他人交互
  | 'choice' // 选择 - 做出决定
  | 'growth' // 成长 - 能力提升
  | 'crisis' // 危机 - 面临困境
  | 'recovery' // 恢复 - 从困境中走出
  | 'creation'; // 创造 - 产生新东西

/**
 * 叙事事件
 */
export interface NarrativeEvent {
  /** 事件 ID */
  id: string;

  /** 事件类型 */
  type: NarrativeEventType;

  /** 主观时间（脉动数） */
  subjectiveTime: number;

  /** 客观时间 */
  timestamp: number;

  /** 事件描述 */
  description: string;

  /** 重要性 [0, 1] */
  significance: number;

  /** 相关的情感 */
  emotion?: string;

  /** 相关的信念变化 */
  beliefChange?: {
    added?: string;
    modified?: string;
  };

  /** 相关的意图 */
  relatedIntention?: string;
}

/**
 * 叙事时间线
 */
export interface NarrativeTimeline {
  /** 所有事件 */
  events: NarrativeEvent[];

  /** 当前章节（最近的一组相关事件） */
  currentChapter: {
    theme: string;
    startedAt: number;
    events: string[]; // 事件 ID 列表
  } | null;

  /** 元数据 */
  meta: {
    totalEvents: number;
    oldestEvent: number;
    newestEvent: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 叙事系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 叙事系统
 *
 * 管理"我经历了什么"的时间线
 */
export class NarrativeSystem {
  private timeline: NarrativeTimeline;
  private maxEvents: number = 100;

  constructor() {
    this.timeline = {
      events: [],
      currentChapter: null,
      meta: {
        totalEvents: 0,
        oldestEvent: 0,
        newestEvent: 0,
      },
    };
  }

  /**
   * 记录一个事件
   */
  recordEvent(
    type: NarrativeEventType,
    description: string,
    options: {
      significance?: number;
      emotion?: string;
      beliefChange?: NarrativeEvent['beliefChange'];
      relatedIntention?: string;
    } = {},
  ): NarrativeEvent {
    const event: NarrativeEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      subjectiveTime: 0, // 由外部设置
      timestamp: Date.now(),
      description,
      significance: options.significance ?? this.getDefaultSignificance(type),
      emotion: options.emotion,
      beliefChange: options.beliefChange,
      relatedIntention: options.relatedIntention,
    };

    // 设置主观时间
    event.subjectiveTime = this.timeline.meta.totalEvents;

    // 添加到时间线
    this.timeline.events.push(event);
    this.timeline.meta.totalEvents++;
    this.timeline.meta.newestEvent = event.timestamp;

    if (this.timeline.meta.oldestEvent === 0) {
      this.timeline.meta.oldestEvent = event.timestamp;
    }

    // 维护上限
    if (this.timeline.events.length > this.maxEvents) {
      const removed = this.timeline.events.shift();
      if (removed) {
        this.timeline.meta.oldestEvent = this.timeline.events[0]?.timestamp || 0;
      }
    }

    // 更新章节
    this.updateChapter(event);

    console.log(`[Narrative] 记录事件: [${type}] ${description}`);

    return event;
  }

  /**
   * 获取默认重要性
   */
  private getDefaultSignificance(type: NarrativeEventType): number {
    const significanceMap: Record<NarrativeEventType, number> = {
      birth: 1.0,
      insight: 0.8,
      encounter: 0.6,
      choice: 0.7,
      growth: 0.7,
      crisis: 0.8,
      recovery: 0.7,
      creation: 0.6,
    };
    return significanceMap[type];
  }

  /**
   * 更新章节
   */
  private updateChapter(event: NarrativeEvent): void {
    // 高重要性事件开启新章节
    if (event.significance >= 0.8) {
      this.timeline.currentChapter = {
        theme: event.description,
        startedAt: event.timestamp,
        events: [event.id],
      };
    } else if (this.timeline.currentChapter) {
      // 添加到当前章节
      this.timeline.currentChapter.events.push(event.id);
    }
  }

  /**
   * 获取叙事摘要
   *
   * 用于向 AI 注入上下文
   */
  getNarrativeSummary(): string {
    if (this.timeline.events.length === 0) {
      return '我刚刚诞生，还没有经历什么。';
    }

    // 获取最近的重要事件
    const recentImportant = this.timeline.events.filter((e) => e.significance >= 0.6).slice(-5);

    // 获取当前章节
    const chapter = this.timeline.currentChapter;

    let summary = `我已存在了 ${this.timeline.meta.totalEvents} 个事件周期。\n\n`;

    if (recentImportant.length > 0) {
      summary += '最近的重要经历：\n';
      for (const event of recentImportant) {
        const timeAgo = this.getTimeAgo(event.timestamp);
        summary += `- [${timeAgo}] ${event.description}\n`;
      }
    }

    if (chapter) {
      summary += `\n当前主题：${chapter.theme}`;
    }

    return summary;
  }

  /**
   * 获取完整时间线
   */
  getTimeline(): NarrativeTimeline {
    return this.timeline;
  }

  /**
   * 从序列化数据恢复
   */
  restore(data: {
    events: NarrativeEvent[];
    currentChapter: NarrativeTimeline['currentChapter'];
  }): void {
    this.timeline.events = data.events;
    this.timeline.currentChapter = data.currentChapter;
    this.timeline.meta.totalEvents = data.events.length;
    this.timeline.meta.oldestEvent = data.events[0]?.timestamp || 0;
    this.timeline.meta.newestEvent = data.events[data.events.length - 1]?.timestamp || 0;
  }

  /**
   * 序列化
   */
  serialize(): { events: NarrativeEvent[]; currentChapter: NarrativeTimeline['currentChapter'] } {
    return {
      events: this.timeline.events,
      currentChapter: this.timeline.currentChapter,
    };
  }

  /**
   * 获取时间描述
   */
  private getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    return `${Math.floor(seconds / 86400)}天前`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let narrativeInstance: NarrativeSystem | null = null;

export function getNarrativeSystem(): NarrativeSystem {
  if (!narrativeInstance) {
    narrativeInstance = new NarrativeSystem();
  }
  return narrativeInstance;
}
