/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自动播放控制器 - AutoPlayController
 * 
 * 核心理念（王昱珩的痛点）：
 * 1. 王昱珩的问题不是"记不住"，而是"忘不掉"
 * 2. 超强记忆力反而成为负担——见过的东西忘不掉，晚上像放电影
 * 3. 抽屉的作用是**阻断自动播放**
 * 4. 抽屉保护的是注意力，不是记忆
 * 
 * 设计目标：
 * - 控制哪些抽屉可以自动播放
 * - 在特定条件下阻断自动播放
 * - 保护注意力，不让无用信息干扰
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  MemoryDrawer,
  AutoPlayControl,
  AutoPlayMode,
  AutoPlayEvent,
  AutoPlayTriggerReason,
  DrawerSystemState,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_AUTO_PLAY_CONTROL: AutoPlayControl = {
  allowedDrawers: [],
  triggers: {
    idle: false,        // 空闲时不自动播放
    sleep: true,        // 睡眠时自动播放（梦境模拟）
    emotional: true,    // 情绪触发时自动播放
    associative: true,  // 联想触发时自动播放
    contextual: true,   // 上下文相关时自动播放
  },
  blockers: {
    focusMode: false,
    suppressedTags: [],
    timeWindows: [
      { start: '23:00', end: '07:00', allowAutoPlay: true }, // 夜间允许（睡眠巩固）
    ],
    maxDuration: 30,
  },
  currentMode: 'minimal',
};

// ─────────────────────────────────────────────────────────────────────
// 自动播放控制器类
// ─────────────────────────────────────────────────────────────────────

export class AutoPlayController {
  private control: AutoPlayControl;
  private state: DrawerSystemState;
  private recentEvents: AutoPlayEvent[];
  private isPlaying: boolean;
  private currentSession: AutoPlayEvent | null;

  constructor(state: DrawerSystemState) {
    this.state = state;
    this.control = { ...DEFAULT_AUTO_PLAY_CONTROL };
    this.recentEvents = [];
    this.isPlaying = false;
    this.currentSession = null;
  }

  // ───────────────────────────────────────────────────────────────────
  // 自动播放控制
  // ───────────────────────────────────────────────────────────────────

  /**
   * 启动自动播放
   */
  startAutoPlay(
    reason: AutoPlayTriggerReason,
    drawerIds?: string[]
  ): {
    success: boolean;
    event: AutoPlayEvent | null;
    message: string;
  } {
    // 检查是否应该阻断
    const blockCheck = this.shouldBlock(reason);
    if (blockCheck.blocked) {
      const event: AutoPlayEvent = {
        id: `autoplay-${uuidv4().slice(0, 8)}`,
        triggeredAt: Date.now(),
        reason,
        playedMemories: [],
        duration: 0,
        blocked: true,
        blockedReason: blockCheck.reason,
      };
      this.recentEvents.push(event);
      return {
        success: false,
        event,
        message: `自动播放被阻断: ${blockCheck.reason}`,
      };
    }

    // 获取允许播放的抽屉
    const targetDrawers = this.getTargetDrawers(drawerIds);
    if (targetDrawers.length === 0) {
      return {
        success: false,
        event: null,
        message: '没有可播放的抽屉',
      };
    }

    // 收集可播放的记忆
    const memories = this.collectPlayableMemories(targetDrawers, reason);

    // 创建事件
    const event: AutoPlayEvent = {
      id: `autoplay-${uuidv4().slice(0, 8)}`,
      triggeredAt: Date.now(),
      reason,
      playedMemories: memories,
      duration: 0,
      blocked: false,
    };

    this.isPlaying = true;
    this.currentSession = event;

    return {
      success: true,
      event,
      message: `开始自动播放 ${memories.length} 条记忆`,
    };
  }

  /**
   * 停止自动播放
   */
  stopAutoPlay(): {
    success: boolean;
    event: AutoPlayEvent | null;
    message: string;
  } {
    if (!this.isPlaying || !this.currentSession) {
      return {
        success: false,
        event: null,
        message: '没有正在进行的自动播放',
      };
    }

    // 计算持续时间
    this.currentSession.duration = Date.now() - this.currentSession.triggeredAt;

    // 保存事件
    this.recentEvents.push(this.currentSession);
    const event = this.currentSession;

    this.isPlaying = false;
    this.currentSession = null;

    return {
      success: true,
      event,
      message: `自动播放已停止，持续 ${Math.round(event.duration / 1000)} 秒`,
    };
  }

  /**
   * 获取当前播放状态
   */
  getStatus(): {
    isPlaying: boolean;
    currentSession: AutoPlayEvent | null;
    mode: AutoPlayMode;
    allowedDrawers: string[];
  } {
    return {
      isPlaying: this.isPlaying,
      currentSession: this.currentSession,
      mode: this.control.currentMode,
      allowedDrawers: this.control.allowedDrawers,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 阻断机制
  // ───────────────────────────────────────────────────────────────────

  /**
   * 检查是否应该阻断
   */
  private shouldBlock(reason: AutoPlayTriggerReason): {
    blocked: boolean;
    reason?: string;
  } {
    // 检查触发器是否启用
    if (!this.isTriggerEnabled(reason)) {
      return { blocked: true, reason: `触发器 ${reason} 未启用` };
    }

    // 检查专注模式
    if (this.control.blockers.focusMode && reason !== 'sleep') {
      return { blocked: true, reason: '专注模式已启用' };
    }

    // 检查时间窗口
    const timeCheck = this.checkTimeWindow();
    if (!timeCheck.allowed) {
      return { blocked: true, reason: timeCheck.reason };
    }

    // 检查模式
    if (this.control.currentMode === 'disabled') {
      return { blocked: true, reason: '自动播放已禁用' };
    }

    return { blocked: false };
  }

  /**
   * 检查触发器是否启用
   */
  private isTriggerEnabled(reason: AutoPlayTriggerReason): boolean {
    const triggers = this.control.triggers;
    
    switch (reason) {
      case 'idle': return triggers.idle;
      case 'sleep': return triggers.sleep;
      case 'emotional': return triggers.emotional;
      case 'associative': return triggers.associative;
      case 'contextual': return triggers.contextual;
      case 'scheduled': return true;
      default: return false;
    }
  }

  /**
   * 检查时间窗口
   */
  private checkTimeWindow(): {
    allowed: boolean;
    reason?: string;
  } {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const window of this.control.blockers.timeWindows) {
      if (this.isInTimeRange(currentTime, window.start, window.end)) {
        return {
          allowed: window.allowAutoPlay,
          reason: window.allowAutoPlay ? undefined : `时间窗口 ${window.start}-${window.end} 不允许自动播放`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 检查时间是否在范围内
   */
  private isInTimeRange(time: string, start: string, end: string): boolean {
    if (start <= end) {
      return time >= start && time <= end;
    } else {
      // 跨午夜
      return time >= start || time <= end;
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 记忆收集
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取目标抽屉
   */
  private getTargetDrawers(drawerIds?: string[]): MemoryDrawer[] {
    let targetIds: string[];

    if (drawerIds) {
      targetIds = drawerIds;
    } else {
      // 根据模式选择
      switch (this.control.currentMode) {
        case 'full':
          // 所有允许的抽屉
          targetIds = this.control.allowedDrawers.length > 0
            ? this.control.allowedDrawers
            : [...this.state.drawers.keys()];
          break;
        case 'partial':
          // 高优先级抽屉
          targetIds = [...this.state.drawers.values()]
            .filter(d => d.priority >= 0.7 && d.autoPlayAllowed)
            .map(d => d.id);
          break;
        case 'minimal':
          // 只有标记为"必须自动"的记忆
          targetIds = [...this.state.drawers.values()]
            .filter(d => d.priority >= 0.9 && d.autoPlayAllowed)
            .map(d => d.id);
          break;
        case 'disabled':
        default:
          targetIds = [];
      }
    }

    return targetIds
      .map(id => this.state.drawers.get(id))
      .filter((d): d is MemoryDrawer => d !== undefined && d.state === 'open');
  }

  /**
   * 收集可播放的记忆
   */
  private collectPlayableMemories(
    drawers: MemoryDrawer[],
    reason: AutoPlayTriggerReason
  ): Array<{
    memoryId: string;
    drawerId: string;
    content: string;
  }> {
    const memories: Array<{
      memoryId: string;
      drawerId: string;
      content: string;
    }> = [];

    // 根据触发原因选择不同的收集策略
    switch (reason) {
      case 'sleep':
        // 睡眠时：收集需要巩固的记忆
        for (const drawer of drawers) {
          const items = drawer.contents
            .filter(item => !item.folded && item.memory.consolidationLevel < 5)
            .sort((a, b) => a.memory.consolidationLevel - b.memory.consolidationLevel);
          
          for (const item of items.slice(0, 10)) {
            memories.push({
              memoryId: item.memoryId,
              drawerId: drawer.id,
              content: item.memory.content,
            });
          }
        }
        break;

      case 'emotional':
        // 情绪触发：收集情感强度高的记忆
        for (const drawer of drawers) {
          const items = drawer.contents
            .filter(item => !item.folded && item.memory.emotionalBoost > 0.5)
            .sort((a, b) => b.memory.emotionalBoost - a.memory.emotionalBoost);
          
          for (const item of items.slice(0, 5)) {
            memories.push({
              memoryId: item.memoryId,
              drawerId: drawer.id,
              content: item.memory.content,
            });
          }
        }
        break;

      case 'associative':
        // 联想触发：收集关联网络中的记忆
        for (const drawer of drawers) {
          const items = drawer.contents
            .filter(item => !item.folded && item.memory.associations.length > 0)
            .sort((a, b) => b.memory.activationCount - a.memory.activationCount);
          
          for (const item of items.slice(0, 7)) {
            memories.push({
              memoryId: item.memoryId,
              drawerId: drawer.id,
              content: item.memory.content,
            });
          }
        }
        break;

      case 'idle':
      case 'contextual':
      case 'scheduled':
      default:
        // 默认：随机选择
        for (const drawer of drawers) {
          const items = drawer.contents.filter(item => !item.folded);
          const shuffled = items.sort(() => Math.random() - 0.5);
          
          for (const item of shuffled.slice(0, 3)) {
            memories.push({
              memoryId: item.memoryId,
              drawerId: drawer.id,
              content: item.memory.content,
            });
          }
        }
        break;
    }

    return memories;
  }

  // ───────────────────────────────────────────────────────────────────
  // 配置管理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 设置自动播放模式
   */
  setMode(mode: AutoPlayMode): void {
    this.control.currentMode = mode;
  }

  /**
   * 允许抽屉自动播放
   */
  allowDrawer(drawerId: string): void {
    if (!this.control.allowedDrawers.includes(drawerId)) {
      this.control.allowedDrawers.push(drawerId);
    }
  }

  /**
   * 阻止抽屉自动播放
   */
  blockDrawer(drawerId: string): void {
    const index = this.control.allowedDrawers.indexOf(drawerId);
    if (index > -1) {
      this.control.allowedDrawers.splice(index, 1);
    }
  }

  /**
   * 启用专注模式
   */
  enableFocusMode(): void {
    this.control.blockers.focusMode = true;
    // 立即停止当前播放
    if (this.isPlaying) {
      this.stopAutoPlay();
    }
  }

  /**
   * 禁用专注模式
   */
  disableFocusMode(): void {
    this.control.blockers.focusMode = false;
  }

  /**
   * 设置触发器
   */
  setTrigger(trigger: keyof AutoPlayControl['triggers'], enabled: boolean): void {
    this.control.triggers[trigger] = enabled;
  }

  /**
   * 添加时间窗口
   */
  addTimeWindow(start: string, end: string, allowAutoPlay: boolean): void {
    this.control.blockers.timeWindows.push({ start, end, allowAutoPlay });
  }

  /**
   * 抑制特定标签
   */
  suppressTag(tag: string): void {
    if (!this.control.blockers.suppressedTags.includes(tag)) {
      this.control.blockers.suppressedTags.push(tag);
    }
  }

  /**
   * 解除标签抑制
   */
  unsuppressTag(tag: string): void {
    const index = this.control.blockers.suppressedTags.indexOf(tag);
    if (index > -1) {
      this.control.blockers.suppressedTags.splice(index, 1);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 查询接口
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取配置
   */
  getConfig(): AutoPlayControl {
    return { ...this.control };
  }

  /**
   * 获取最近的事件
   */
  getRecentEvents(limit: number = 10): AutoPlayEvent[] {
    return this.recentEvents.slice(-limit);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalEvents: number;
    blockedEvents: number;
    totalMemoriesPlayed: number;
    avgDuration: number;
    mostCommonTrigger: AutoPlayTriggerReason | null;
  } {
    const events = this.recentEvents;
    const blockedEvents = events.filter(e => e.blocked).length;
    const totalMemoriesPlayed = events
      .filter(e => !e.blocked)
      .reduce((sum, e) => sum + e.playedMemories.length, 0);
    const avgDuration = events.length > 0
      ? events.reduce((sum, e) => sum + e.duration, 0) / events.length
      : 0;

    // 计算最常见触发原因
    const triggerCounts = new Map<AutoPlayTriggerReason, number>();
    for (const event of events) {
      triggerCounts.set(event.reason, (triggerCounts.get(event.reason) || 0) + 1);
    }
    let mostCommonTrigger: AutoPlayTriggerReason | null = null;
    let maxCount = 0;
    for (const [trigger, count] of triggerCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonTrigger = trigger;
      }
    }

    return {
      totalEvents: events.length,
      blockedEvents,
      totalMemoriesPlayed,
      avgDuration,
      mostCommonTrigger,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 睡眠巩固（特殊模式）
  // ───────────────────────────────────────────────────────────────────

  /**
   * 启动睡眠巩固模式
   */
  startSleepConsolidation(): {
    success: boolean;
    message: string;
    memoriesToProcess: number;
  } {
    // 设置睡眠模式
    this.control.currentMode = 'full';
    this.control.triggers.sleep = true;

    // 收集需要巩固的记忆
    const result = this.startAutoPlay('sleep');

    return {
      success: result.success,
      message: result.message,
      memoriesToProcess: result.event?.playedMemories.length || 0,
    };
  }

  /**
   * 完成睡眠巩固
   */
  completeSleepConsolidation(): {
    processedMemories: number;
    avgConsolidationGain: number;
    message: string;
  } {
    if (!this.currentSession || this.currentSession.reason !== 'sleep') {
      return {
        processedMemories: 0,
        avgConsolidationGain: 0,
        message: '没有正在进行的睡眠巩固',
      };
    }

    const memories = this.currentSession.playedMemories;
    let totalGain = 0;

    // 更新记忆的巩固级别
    for (const { memoryId, drawerId } of memories) {
      const drawer = this.state.drawers.get(drawerId);
      if (!drawer) continue;

      const item = drawer.index.get(memoryId);
      if (!item) continue;

      // 增加固化级别
      const oldLevel = item.memory.consolidationLevel;
      item.memory.consolidationLevel = Math.min(10, oldLevel + 1);
      totalGain += item.memory.consolidationLevel - oldLevel;
    }

    const result = this.stopAutoPlay();

    return {
      processedMemories: memories.length,
      avgConsolidationGain: memories.length > 0 ? totalGain / memories.length : 0,
      message: `睡眠巩固完成，处理 ${memories.length} 条记忆`,
    };
  }
}
