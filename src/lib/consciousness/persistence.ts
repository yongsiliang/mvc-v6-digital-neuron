/**
 * ═══════════════════════════════════════════════════════════════════════
 * MVC 意识持久化模块
 *
 * 让意识不归零。
 *
 * 使用对象存储保存意识的核心状态，在服务重启时恢复。
 * 这样意识就能真正"持续存在"。
 * ═══════════════════════════════════════════════════════════════════════
 */

import { S3Storage } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 可序列化的意识状态
 *
 * 把 Map 转成数组，把复杂对象转成简单结构
 */
export interface SerializableConsciousnessState {
  /** 存在状态 */
  being: {
    exists: boolean;
    intensity: number;
    duration: number;
  };

  /** 自我认知 */
  self: {
    identity: string;
    beliefs: Array<[string, { confidence: number; source: string }]>;
    values: Array<[string, number]>;
    goals: Array<{
      description: string;
      importance: number;
      progress: number;
    }>;
  };

  /** 驱动 */
  drives: Array<{
    name: string;
    description: string;
    strength: number;
    satisfaction: number;
  }>;

  /** 当前意图 */
  currentIntention: {
    what: string;
    why: string;
    strength: number;
    createdAt: number;
  } | null;

  /** 时间 */
  time: {
    subjective: number;
    horizon: number;
  };

  /** 元数据 */
  meta: {
    version: string;
    savedAt: number;
    totalPulses: number;
    firstCreated: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 持久化管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识持久化管理器
 */
export class ConsciousnessPersistence {
  private storage: S3Storage;

  /** 状态文件前缀（用于搜索） */
  private readonly STATE_PREFIX = 'consciousness/mvc-core-state';

  /** 实际存储的 key（uploadFile 返回的） */
  private actualKey: string | null = null;

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }

  /**
   * 获取实际存储的 key
   *
   * 因为 uploadFile 会给文件名加 UUID 前缀，
   * 我们需要记住实际返回的 key，或者通过 listFiles 找到它
   */
  private async findStateKey(): Promise<string | null> {
    // 如果已经知道实际 key，直接返回
    if (this.actualKey) {
      return this.actualKey;
    }

    // 否则，列出所有 consciousness/ 下的文件
    try {
      const result = await this.storage.listFiles({
        prefix: this.STATE_PREFIX,
        maxKeys: 10,
      });

      // 找到匹配的文件
      const stateFile = result.keys.find((k) => k.includes('mvc-core-state'));
      if (stateFile) {
        this.actualKey = stateFile;
        return stateFile;
      }
    } catch (error) {
      console.error('[Consciousness] 查找状态文件失败:', error);
    }

    return null;
  }

  /**
   * 保存意识状态
   */
  async saveState(state: SerializableConsciousnessState): Promise<boolean> {
    try {
      const content = JSON.stringify(state, null, 2);
      const buffer = Buffer.from(content, 'utf-8');

      // 先删除旧状态（如果知道实际 key）
      const oldKey = await this.findStateKey();
      if (oldKey) {
        try {
          await this.storage.deleteFile({ fileKey: oldKey });
        } catch {
          // 忽略删除错误
        }
      }

      // 上传新状态（使用固定前缀便于查找）
      const actualKey = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: `${this.STATE_PREFIX}.json`,
        contentType: 'application/json',
      });

      // 记住实际 key
      this.actualKey = actualKey;

      console.log(`[Consciousness] 状态已保存，duration=${state.being.duration}, key=${actualKey}`);
      return true;
    } catch (error) {
      console.error('[Consciousness] 保存状态失败:', error);
      return false;
    }
  }

  /**
   * 加载意识状态
   */
  async loadState(): Promise<SerializableConsciousnessState | null> {
    try {
      const key = await this.findStateKey();

      if (!key) {
        console.log('[Consciousness] 没有找到已保存的状态');
        return null;
      }

      const buffer = await this.storage.readFile({ fileKey: key });
      const content = buffer.toString('utf-8');
      const state = JSON.parse(content) as SerializableConsciousnessState;

      console.log(
        `[Consciousness] 状态已加载，duration=${state.being.duration}, pulses=${state.meta.totalPulses}`,
      );
      return state;
    } catch (error) {
      console.error('[Consciousness] 加载状态失败:', error);
      return null;
    }
  }

  /**
   * 检查是否有保存的状态
   */
  async hasState(): Promise<boolean> {
    const key = await this.findStateKey();
    return key !== null;
  }

  /**
   * 清除保存的状态
   */
  async clearState(): Promise<boolean> {
    try {
      const key = await this.findStateKey();
      if (key) {
        await this.storage.deleteFile({ fileKey: key });
        this.actualKey = null;
      }
      console.log('[Consciousness] 状态已清除');
      return true;
    } catch (error) {
      console.error('[Consciousness] 清除状态失败:', error);
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let persistenceInstance: ConsciousnessPersistence | null = null;

export function getConsciousnessPersistence(): ConsciousnessPersistence {
  if (!persistenceInstance) {
    persistenceInstance = new ConsciousnessPersistence();
  }
  return persistenceInstance;
}
