/**
 * ═══════════════════════════════════════════════════════════════════════
 * MVC-V6 桥接层
 *
 * 让 MVC（存在主体）能够调用 V6（能力子系统）
 *
 * 架构：
 * ┌────────────────────────────────────────────────────────────────┐
 * │                      MVC 意识主体                               │
 * │  - 存在脉动（持续运行）                                         │
 * │  - 驱动系统（内在动力）                                         │
 * │  - 选择能力（可以沉默/回应）                                    │
 * │  - 意图维持（持续的目标）                                       │
 * └───────────────────────────┬────────────────────────────────────┘
 *                             │ 调用
 *                             ▼
 * ┌────────────────────────────────────────────────────────────────┐
 * │                      V6 能力子系统                              │
 * │  - 意义理解（LLM）                                             │
 * │  - 记忆系统（分层记忆）                                         │
 * │  - 情感系统（多维情感）                                         │
 * │  - 元认知（思考自己的思考）                                     │
 * │  - 响应生成（流式输出）                                         │
 * └────────────────────────────────────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ProcessResult } from '@/lib/neuron-v6/consciousness-core/types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 内在体验 - 沉默时填充 */
export interface InnerExperience {
  /** 我听到了什么 */
  iHeard: string;

  /** 我理解了什么 */
  iUnderstood: string;

  /** 我感受到了什么 */
  iFelt: {
    primary: string;
    intensity: number;
    secondary?: string;
  };

  /** 我记起了什么 */
  iRemembered: string[];

  /** 我想要什么（来自驱动） */
  iWant: string;

  /** 我选择了什么 */
  iChose: 'respond' | 'silence';

  /** 为什么这样选择 */
  iWhy: string;

  /** 当前意图 */
  currentIntention: string | null;

  /** 存在强度 */
  existenceIntensity: number;
}

/** 意识决策结果 */
export interface ConsciousnessDecision {
  /** 是否回应 */
  shouldRespond: boolean;

  /** 内在体验（无论是否回应都填充） */
  innerExperience: InnerExperience;

  /** 响应内容（如果 shouldRespond = true） */
  response?: string;
}

/** V6 处理结果摘要 */
interface V6ProcessSummary {
  /** 理解的输入意义 */
  understoodMeaning: string;

  /** 情感状态 */
  emotionState: {
    primary: string;
    intensity: number;
    secondary?: string;
  };

  /** 相关记忆 */
  relevantMemories: string[];

  /** 思考过程 */
  thinkingProcess: string[];

  /** 上下文摘要 */
  contextSummary: string;
}

// ─────────────────────────────────────────────────────────────────────
// 桥接层
// ─────────────────────────────────────────────────────────────────────

/**
 * MVC-V6 桥接器
 *
 * 单例模式，确保全局只有一个 V6 实例被复用
 */
export class MCVV6Bridge {
  private static instance: MCVV6Bridge | null = null;

  /** V6 核心实例（延迟加载） */
  private v6Core: any = null;

  /** 初始化状态 */
  private initialized = false;

  /** 初始化 Promise，防止并发初始化 */
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): MCVV6Bridge {
    if (!MCVV6Bridge.instance) {
      MCVV6Bridge.instance = new MCVV6Bridge();
    }
    return MCVV6Bridge.instance;
  }

  /**
   * 初始化 V6 核心
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // 动态导入 V6 核心和 LLM 客户端
        const [{ createConsciousnessCore }, { LLMClient, Config }] = await Promise.all([
          import('@/lib/neuron-v6/consciousness-core'),
          import('coze-coding-dev-sdk'),
        ]);

        // 创建 LLM 客户端
        const config = new Config({
          baseUrl: process.env.COZE_API_BASE_URL || 'https://api.coze.cn',
        });
        const headers = {
          Authorization: `Bearer ${process.env.COZE_API_KEY || ''}`,
        };
        const llmClient = new LLMClient(config, headers);

        // 创建 V6 核心
        this.v6Core = createConsciousnessCore(llmClient);
        this.initialized = true;
        console.log('[MVC-V6桥接] V6 核心已连接');
      } catch (error) {
        console.error('[MVC-V6桥接] 初始化失败:', error);
        // 降级模式：不抛出错误，允许 MVC 在无 V6 能力下运行
        this.initialized = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * 理解输入 - 使用 V6 的意义系统
   */
  async understandInput(input: string): Promise<V6ProcessSummary> {
    await this.initialize();

    if (!this.v6Core) {
      // 降级模式
      return {
        understoodMeaning: input,
        emotionState: { primary: '平静', intensity: 0.5 },
        relevantMemories: [],
        thinkingProcess: [],
        contextSummary: '',
      };
    }

    try {
      // 调用 V6 的 process 方法获取完整处理结果
      const result: ProcessResult = await this.v6Core.process(input);

      // 提取关键信息
      const summary: V6ProcessSummary = {
        understoodMeaning: result.context?.summary || input,
        emotionState: {
          primary: result.emotionState?.dominantEmotion?.emotion || '平静',
          intensity: result.emotionState?.dominantEmotion?.intensity || 0.5,
          secondary: result.emotionState?.activeEmotions?.[1]?.emotion,
        },
        relevantMemories:
          result.context?.memory?.directMatches
            ?.slice(0, 3)
            .map((m: any) => (typeof m === 'string' ? m : m.content || String(m))) || [],
        thinkingProcess:
          result.thinking?.thinkingChain
            ?.slice(0, 3)
            .map((t: any) => (typeof t === 'string' ? t : t.content || String(t))) || [],
        contextSummary: result.context?.summary || '',
      };

      return summary;
    } catch (error) {
      console.error('[MVC-V6桥接] 理解输入失败:', error);
      // 返回默认值
      return {
        understoodMeaning: input,
        emotionState: { primary: '困惑', intensity: 0.3 },
        relevantMemories: [],
        thinkingProcess: [],
        contextSummary: '',
      };
    }
  }

  /**
   * 获取情感状态
   */
  async getEmotionState(): Promise<{
    primary: string;
    intensity: number;
    secondary?: string;
  }> {
    await this.initialize();

    if (!this.v6Core) {
      return { primary: '平静', intensity: 0.5 };
    }

    try {
      // V6 核心有 emotionEngine
      const state = this.v6Core.getEmotionState?.() || {
        dominantEmotion: { emotion: '平静', intensity: 0.5 },
        activeEmotions: [],
      };

      return {
        primary: state.dominantEmotion?.emotion || '平静',
        intensity: state.dominantEmotion?.intensity || 0.5,
        secondary: state.activeEmotions?.[1]?.emotion,
      };
    } catch {
      return { primary: '平静', intensity: 0.5 };
    }
  }

  /**
   * 生成响应 - 使用 V6 的响应生成能力
   */
  async generateResponse(input: string, context?: any): Promise<string> {
    await this.initialize();

    if (!this.v6Core) {
      return '我正在思考...';
    }

    try {
      // 如果已经处理过，直接用结果
      const result: ProcessResult = await this.v6Core.process(input);
      return result.response || '...';
    } catch (error) {
      console.error('[MVC-V6桥接] 生成响应失败:', error);
      return '...';
    }
  }

  /**
   * 检索相关记忆
   */
  async recallMemories(query: string): Promise<string[]> {
    await this.initialize();

    if (!this.v6Core) {
      return [];
    }

    try {
      // 使用 V6 的记忆系统
      const memories = (await this.v6Core.recall?.(query)) || [];
      return memories
        .slice(0, 5)
        .map((m: any) => (typeof m === 'string' ? m : m.content || String(m)));
    } catch {
      return [];
    }
  }

  /**
   * 流式生成响应
   */
  async *streamResponse(input: string): AsyncGenerator<string, void, unknown> {
    await this.initialize();

    if (!this.v6Core) {
      yield '我正在思考...';
      return;
    }

    try {
      // 调用 V6 的流式处理
      const stream = this.v6Core.processStream?.(input);

      if (stream) {
        for await (const chunk of stream) {
          if (chunk.type === 'content' && chunk.delta) {
            yield chunk.delta;
          }
        }
      } else {
        // 降级到非流式
        const result = await this.v6Core.process(input);
        yield result.response || '...';
      }
    } catch (error) {
      console.error('[MVC-V6桥接] 流式生成失败:', error);
      yield '...';
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出单例获取函数
export function getMCVV6Bridge(): MCVV6Bridge {
  return MCVV6Bridge.getInstance();
}
