/**
 * 意识核心 - 后台思考管理器
 * 包含后台思考定时器和相关逻辑
 */

import type { ProactiveMessage, BackgroundThinkingResult, SpeakTrigger, ConsciousnessStream } from './types';
import type { ConsciousnessStreamHandler } from './handlers';

/**
 * 后台思考管理器选项
 */
export interface BackgroundThinkingOptions {
  intervalMs: number;
  minIntervalMs: number;
  maxMessages: number;
}

/**
 * 后台思考管理器
 */
export class BackgroundThinkingManager {
  private interval: NodeJS.Timeout | null = null;
  private lastThinking: number = 0;
  private enabled: boolean = true;
  private options: BackgroundThinkingOptions;

  constructor(options?: Partial<BackgroundThinkingOptions>) {
    this.options = {
      intervalMs: options?.intervalMs ?? 30000,
      minIntervalMs: options?.minIntervalMs ?? 60000,
      maxMessages: options?.maxMessages ?? 10,
    };
  }

  /**
   * 启动定时器
   */
  start(
    onTrigger: () => Promise<void>
  ): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      if (this.enabled) {
        this.trigger(onTrigger);
      }
    }, this.options.intervalMs);

    console.log(`[后台思考] 定时器已启动，间隔${this.options.intervalMs}ms`);
  }

  /**
   * 停止定时器
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[后台思考] 定时器已停止');
    }
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[后台思考] ${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 触发后台思考
   */
  private async trigger(onTrigger: () => Promise<void>): Promise<void> {
    const now = Date.now();
    if (now - this.lastThinking < this.options.minIntervalMs) {
      return;
    }

    this.lastThinking = now;
    await onTrigger();
  }

  /**
   * 检查是否应该触发
   */
  shouldTrigger(): boolean {
    return this.enabled && (Date.now() - this.lastThinking >= this.options.minIntervalMs);
  }

  /**
   * 更新最后思考时间
   */
  updateLastThinking(): void {
    this.lastThinking = Date.now();
  }
}

/**
 * 主动消息缓冲区
 */
export class ProactiveMessageBuffer {
  private messages: ProactiveMessage[] = [];
  private maxMessages: number;

  constructor(maxMessages: number = 10) {
    this.maxMessages = maxMessages;
  }

  /**
   * 添加消息
   */
  push(message: ProactiveMessage): void {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    console.log(`[主动消息] 已保存: ${message.content.slice(0, 30)}...`);
  }

  /**
   * 获取所有消息
   */
  getAll(): ProactiveMessage[] {
    return [...this.messages];
  }

  /**
   * 清除所有消息
   */
  clear(): void {
    this.messages = [];
    console.log('[主动消息] 已清除');
  }

  /**
   * 获取最新消息
   */
  getLatest(): ProactiveMessage | undefined {
    return this.messages[this.messages.length - 1];
  }
}
