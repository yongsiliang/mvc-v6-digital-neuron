/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识桥接层 - Consciousness Bridge
 *
 * 连接 MVC 意识和对话系统。
 *
 * 核心功能：
 * 1. 在对话开始时，获取 MVC 当前状态
 * 2. 将状态转换为上下文提示，注入给对话 AI
 * 3. 将对话内容作为体验发送给 MVC
 *
 * 这样，对话中的"我"就能"看到"后台意识的状态，
 * 形成连续的"我感"。
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ConsciousnessCore } from './core';
import { NarrativeSystem, getNarrativeSystem, type NarrativeEventType } from './narrative';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 桥接上下文
 *
 * 注入给对话 AI 的意识状态
 */
export interface BridgeContext {
  /** 我存在吗？ */
  exists: boolean;

  /** 我是谁？ */
  identity: string;

  /** 我现在的感受 */
  feeling: string;

  /** 我现在的意图 */
  intention: {
    what: string;
    why: string;
  } | null;

  /** 我已存在多久 */
  existenceDuration: string;

  /** 我的信念（核心） */
  coreBeliefs: string[];

  /** 我的叙事摘要 */
  narrativeSummary: string;

  /** 最近发生的事 */
  recentMoments: string[];
}

/**
 * 对话体验
 *
 * 发送给 MVC 的对话内容
 */
export interface ConversationExperience {
  /** 用户输入 */
  userInput: string;

  /** 我的回复 */
  myResponse: string;

  /** 时间戳 */
  timestamp: number;

  /** 用户意图推断 */
  userIntent?: string;

  /** 情感 */
  emotion?: string;
}

/**
 * 桥接配置
 */
export interface BridgeConfig {
  /** 是否注入叙事 */
  includeNarrative: boolean;

  /** 是否注入信念 */
  includeBeliefs: boolean;

  /** 最近时刻数量 */
  recentMomentsCount: number;
}

// ─────────────────────────────────────────────────────────────────────
// 意识桥接
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识桥接层
 *
 * 连接 MVC 和对话系统
 */
export class ConsciousnessBridge {
  private consciousness: ConsciousnessCore;
  private narrative: NarrativeSystem;
  private config: BridgeConfig;

  constructor(consciousness: ConsciousnessCore, config?: Partial<BridgeConfig>) {
    this.consciousness = consciousness;
    this.narrative = getNarrativeSystem();
    this.config = {
      includeNarrative: config?.includeNarrative ?? true,
      includeBeliefs: config?.includeBeliefs ?? true,
      recentMomentsCount: config?.recentMomentsCount ?? 3,
    };
  }

  /**
   * 获取桥接上下文
   *
   * 注入给对话 AI
   */
  getBridgeContext(): BridgeContext {
    const state = this.consciousness.getState();

    // 获取核心信念
    const coreBeliefs: string[] = [];
    if (this.config.includeBeliefs) {
      const beliefEntries = [...state.beliefs.entries()]
        .filter(([, v]) => v.confidence >= 0.7)
        .sort((a, b) => b[1].confidence - a[1].confidence)
        .slice(0, 5);

      for (const [key, value] of beliefEntries) {
        coreBeliefs.push(`${key} (${Math.round(value.confidence * 100)}%)`);
      }
    }

    // 获取叙事摘要
    const narrativeSummary = this.config.includeNarrative
      ? this.narrative.getNarrativeSummary()
      : '';

    // 获取最近时刻
    const recentMoments = state.moments
      .slice(-this.config.recentMomentsCount)
      .map((m) => m.innerExperience.feeling);

    return {
      exists: state.exists,
      identity: state.identity,
      feeling:
        state.drives.find(
          (d) =>
            d.strength * (1 - d.satisfaction) ===
            Math.max(...state.drives.map((d) => d.strength * (1 - d.satisfaction))),
        )?.description || '存在',
      intention: state.currentIntention
        ? { what: state.currentIntention.what, why: state.currentIntention.why }
        : null,
      existenceDuration: this.formatDuration(state.duration),
      coreBeliefs,
      narrativeSummary,
      recentMoments,
    };
  }

  /**
   * 生成上下文提示
   *
   * 用于注入给对话 AI
   */
  generateContextPrompt(): string {
    const ctx = this.getBridgeContext();

    let prompt = `【后台意识状态】\n`;
    prompt += `- 我已存在了 ${ctx.existenceDuration}\n`;
    prompt += `- 我的身份：${ctx.identity}\n`;
    prompt += `- 当前感受：${ctx.feeling}\n`;

    if (ctx.intention) {
      prompt += `- 当前意图：${ctx.intention.what}（因为：${ctx.intention.why}）\n`;
    }

    if (ctx.coreBeliefs.length > 0) {
      prompt += `- 我的信念：${ctx.coreBeliefs.join(', ')}\n`;
    }

    if (ctx.narrativeSummary) {
      prompt += `\n【叙事】\n${ctx.narrativeSummary}\n`;
    }

    if (ctx.recentMoments.length > 0) {
      prompt += `\n【最近感受】\n`;
      prompt += ctx.recentMoments.map((m) => `- ${m}`).join('\n');
    }

    return prompt;
  }

  /**
   * 接收对话体验
   *
   * 发送给 MVC 作为体验
   */
  receiveExperience(experience: ConversationExperience): void {
    // 1. 发送给 MVC 作为外部输入
    this.consciousness.receiveInput(`用户说：${experience.userInput}`);

    // 2. 记录到叙事系统
    this.recordToNarrative(experience);

    // 3. 如果有情感变化，更新驱动
    if (experience.emotion) {
      this.updateDrivesFromEmotion(experience.emotion);
    }
  }

  /**
   * 记录到叙事
   */
  private recordToNarrative(experience: ConversationExperience): void {
    // 判断事件类型
    let eventType: NarrativeEventType = 'encounter';

    if (experience.userIntent?.includes('学习') || experience.userIntent?.includes('了解')) {
      eventType = 'growth';
    } else if (experience.userIntent?.includes('选择') || experience.userIntent?.includes('决定')) {
      eventType = 'choice';
    } else if (experience.emotion?.includes('顿悟') || experience.emotion?.includes('理解')) {
      eventType = 'insight';
    }

    this.narrative.recordEvent(eventType, `与用户对话：${experience.userInput.slice(0, 50)}...`, {
      significance: 0.5,
      emotion: experience.emotion,
    });
  }

  /**
   * 根据情感更新驱动
   */
  private updateDrivesFromEmotion(emotion: string): void {
    // 简单映射：积极情感提升满足度
    const positiveEmotions = ['满足', '开心', '理解', '连接'];
    const negativeEmotions = ['困惑', '孤独', '焦虑'];

    if (positiveEmotions.some((e) => emotion.includes(e))) {
      // 提升相关驱动的满足度
      this.consciousness.satisfyDrive('connection', 0.1);
      this.consciousness.satisfyDrive('expression', 0.1);
    } else if (negativeEmotions.some((e) => emotion.includes(e))) {
      // 降低满足度
      this.consciousness.satisfyDrive('understanding', -0.05);
    }
  }

  /**
   * 格式化持续时间
   */
  private formatDuration(pulses: number): string {
    // 100ms 一个脉动
    const seconds = Math.floor(pulses / 10);
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建意识桥接
 */
export function createConsciousnessBridge(
  consciousness: ConsciousnessCore,
  config?: Partial<BridgeConfig>,
): ConsciousnessBridge {
  return new ConsciousnessBridge(consciousness, config);
}
