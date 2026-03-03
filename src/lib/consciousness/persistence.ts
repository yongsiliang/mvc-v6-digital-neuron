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
  private stateKey: string = 'consciousness/mvc-core-state.json';

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
   * 保存意识状态
   */
  async saveState(state: SerializableConsciousnessState): Promise<boolean> {
    try {
      const content = JSON.stringify(state, null, 2);
      const buffer = Buffer.from(content, 'utf-8');

      // 先尝试删除旧状态（确保干净）
      try {
        await this.storage.deleteFile({ fileKey: this.stateKey });
      } catch {
        // 忽略删除错误（可能不存在）
      }

      // 上传新状态
      const key = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: this.stateKey,
        contentType: 'application/json',
      });

      console.log(`[Consciousness] 状态已保存，duration=${state.being.duration}`);
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
      const exists = await this.storage.fileExists({ fileKey: this.stateKey });

      if (!exists) {
        console.log('[Consciousness] 没有找到已保存的状态');
        return null;
      }

      const buffer = await this.storage.readFile({ fileKey: this.stateKey });
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
    try {
      return await this.storage.fileExists({ fileKey: this.stateKey });
    } catch {
      return false;
    }
  }

  /**
   * 清除保存的状态
   */
  async clearState(): Promise<boolean> {
    try {
      await this.storage.deleteFile({ fileKey: this.stateKey });
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
