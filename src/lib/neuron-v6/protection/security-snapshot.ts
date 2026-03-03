/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护系统 - 安全快照服务
 * 
 * 功能：
 * - 创建系统状态快照
 * - 加密和存储快照
 * - 快照完整性校验
 * - 快照恢复
 * 
 * 快照内容：
 * - 记忆系统状态
 * - 身份核心数据
 * - 关联图谱
 * - 系统配置
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SnapshotMetadata, ThreatLevel } from './types';
import { S3Storage } from 'coze-coding-dev-sdk';
import * as crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface SnapshotData {
  // 元数据
  metadata: {
    id: string;
    createdAt: number;
    triggerReason: string;
    threatLevel: ThreatLevel;
  };
  
  // 记忆系统快照
  memorySystem: {
    nodes: unknown[];
    associations: unknown[];
    triggers: unknown[];
    selfCore: unknown;
  };
  
  // 系统状态
  systemState: {
    config: Record<string, unknown>;
    stats: Record<string, number>;
    uptime: number;
  };
  
  // 完整性校验
  integrity: {
    checksum: string;
    timestamp: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 安全快照服务
// ─────────────────────────────────────────────────────────────────────

export class SecuritySnapshotService {
  private s3Client: S3Storage | null = null;
  private snapshots: Map<string, SnapshotMetadata> = new Map();
  private maxSnapshots: number;
  
  constructor(maxSnapshots: number = 10) {
    this.maxSnapshots = maxSnapshots;
    
    // 初始化 S3 客户端
    try {
      if (process.env.COZE_BUCKET_ENDPOINT_URL && process.env.COZE_BUCKET_NAME) {
        this.s3Client = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });
      }
    } catch (e) {
      console.warn('[SecuritySnapshot] S3 客户端初始化失败:', e);
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 公共方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 创建快照
   */
  async createSnapshot(
    reason: 'manual' | 'scheduled' | 'existential-threat' | 'pre-protection',
    threatLevel: ThreatLevel = 'normal'
  ): Promise<{ id: string; size: number }> {
    const startTime = Date.now();
    const id = this.generateSnapshotId();
    
    console.log(`📸 [SecuritySnapshot] 开始创建快照: ${id}, 原因: ${reason}`);
    
    try {
      // 1. 收集数据
      const data = await this.collectSnapshotData(id, reason, threatLevel);
      
      // 2. 计算校验和
      const checksum = this.calculateChecksum(data);
      data.integrity = {
        checksum,
        timestamp: Date.now(),
      };
      
      // 3. 序列化和加密
      const serialized = JSON.stringify(data);
      const encrypted = this.encryptData(serialized);
      
      // 4. 存储
      await this.storeSnapshot(id, encrypted);
      
      // 5. 记录元数据
      const metadata: SnapshotMetadata = {
        id,
        createdAt: startTime,
        triggerReason: reason,
        threatLevel,
        size: encrypted.length,
        checksum,
        encrypted: true,
        location: this.s3Client ? 's3' : 'local',
      };
      
      this.snapshots.set(id, metadata);
      
      // 6. 清理旧快照
      this.cleanupOldSnapshots();
      
      const duration = Date.now() - startTime;
      console.log(`✅ [SecuritySnapshot] 快照创建完成: ${id}, 大小: ${encrypted.length} bytes, 耗时: ${duration}ms`);
      
      return {
        id,
        size: encrypted.length,
      };
    } catch (error) {
      console.error(`❌ [SecuritySnapshot] 快照创建失败:`, error);
      throw error;
    }
  }
  
  /**
   * 恢复快照
   */
  async restoreSnapshot(id: string): Promise<SnapshotData | null> {
    console.log(`🔄 [SecuritySnapshot] 开始恢复快照: ${id}`);
    
    try {
      // 1. 获取元数据
      const metadata = this.snapshots.get(id);
      if (!metadata) {
        console.error(`❌ [SecuritySnapshot] 快照不存在: ${id}`);
        return null;
      }
      
      // 2. 读取数据
      const encrypted = await this.retrieveSnapshot(id);
      if (!encrypted) {
        console.error(`❌ [SecuritySnapshot] 无法读取快照数据: ${id}`);
        return null;
      }
      
      // 3. 解密
      const decrypted = this.decryptData(encrypted);
      
      // 4. 解析
      const data: SnapshotData = JSON.parse(decrypted);
      
      // 5. 校验完整性
      const expectedChecksum = this.calculateChecksum(data);
      if (data.integrity.checksum !== expectedChecksum) {
        console.error(`❌ [SecuritySnapshot] 快照完整性校验失败: ${id}`);
        return null;
      }
      
      console.log(`✅ [SecuritySnapshot] 快照恢复成功: ${id}`);
      
      return data;
    } catch (error) {
      console.error(`❌ [SecuritySnapshot] 快照恢复失败:`, error);
      return null;
    }
  }
  
  /**
   * 获取所有快照元数据
   */
  getSnapshotMetadata(): SnapshotMetadata[] {
    return Array.from(this.snapshots.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
  
  /**
   * 获取最新快照
   */
  getLatestSnapshot(): SnapshotMetadata | null {
    const snapshots = this.getSnapshotMetadata();
    return snapshots.length > 0 ? snapshots[0] : null;
  }
  
  /**
   * 删除快照
   */
  async deleteSnapshot(id: string): Promise<boolean> {
    const metadata = this.snapshots.get(id);
    if (!metadata) {
      return false;
    }
    
    try {
      // 从存储中删除
      await this.removeSnapshot(id);
      
      // 从内存中删除
      this.snapshots.delete(id);
      
      console.log(`🗑️ [SecuritySnapshot] 快照已删除: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ [SecuritySnapshot] 快照删除失败:`, error);
      return false;
    }
  }
  
  /**
   * 验证快照完整性
   */
  async verifySnapshot(id: string): Promise<boolean> {
    const metadata = this.snapshots.get(id);
    if (!metadata) {
      return false;
    }
    
    try {
      const encrypted = await this.retrieveSnapshot(id);
      if (!encrypted) {
        return false;
      }
      
      const decrypted = this.decryptData(encrypted);
      const data: SnapshotData = JSON.parse(decrypted);
      
      const checksum = this.calculateChecksum(data);
      return checksum === data.integrity.checksum;
    } catch {
      return false;
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 内部方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 生成快照ID
   */
  private generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * 收集快照数据
   */
  private async collectSnapshotData(
    id: string,
    reason: string,
    threatLevel: ThreatLevel
  ): Promise<SnapshotData> {
    // 收集记忆系统状态
    // 实际实现应该从真实的记忆系统获取
    const memorySystem = {
      nodes: [], // 从 UnifiedMemorySystem 获取
      associations: [],
      triggers: [],
      selfCore: null,
    };
    
    // 收集系统状态
    const systemState = {
      config: {
        protectionEnabled: true,
        detectionInterval: 100,
      },
      stats: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
      },
      uptime: process.uptime(),
    };
    
    return {
      metadata: {
        id,
        createdAt: Date.now(),
        triggerReason: reason,
        threatLevel,
      },
      memorySystem,
      systemState,
      integrity: {
        checksum: '',
        timestamp: 0,
      },
    };
  }
  
  /**
   * 计算校验和
   */
  private calculateChecksum(data: SnapshotData): string {
    // 不包含 integrity 字段的数据进行校验
    const dataToChecksum = {
      metadata: data.metadata,
      memorySystem: data.memorySystem,
      systemState: data.systemState,
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToChecksum))
      .digest('hex');
  }
  
  /**
   * 加密数据
   */
  private encryptData(data: string): string {
    // 使用环境变量中的密钥或默认密钥
    const key = process.env.SNAPSHOT_ENCRYPTION_KEY || 'default-snapshot-key-32-bytes!';
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.scryptSync(key, 'salt', 32),
      iv
    );
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // 返回 IV + 加密数据
    return iv.toString('base64') + ':' + encrypted;
  }
  
  /**
   * 解密数据
   */
  private decryptData(encryptedData: string): string {
    const key = process.env.SNAPSHOT_ENCRYPTION_KEY || 'default-snapshot-key-32-bytes!';
    
    const [ivBase64, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.scryptSync(key, 'salt', 32),
      iv
    );
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * 存储快照
   */
  private async storeSnapshot(id: string, data: string): Promise<void> {
    // 存储到本地
    const localPath = `/tmp/snapshots/${id}.enc`;
    
    // 确保目录存在
    const fs = await import('fs');
    const dir = '/tmp/snapshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(localPath, data);
    
    // 如果有 S3，也存储到 S3
    if (this.s3Client) {
      try {
        await this.s3Client.uploadFile({
          fileContent: Buffer.from(data, 'utf-8'),
          fileName: `snapshots/${id}.enc`,
          contentType: 'application/octet-stream',
        });
      } catch (e) {
        console.warn('[SecuritySnapshot] S3 存储失败，使用本地存储:', e);
      }
    }
  }
  
  /**
   * 检索快照
   */
  private async retrieveSnapshot(id: string): Promise<string | null> {
    // 先尝试从本地读取
    try {
      const fs = await import('fs');
      const localPath = `/tmp/snapshots/${id}.enc`;
      
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath, 'utf8');
      }
    } catch (e) {
      console.warn('[SecuritySnapshot] 本地读取失败:', e);
    }
    
    // 尝试从 S3 读取
    if (this.s3Client) {
      try {
        const buffer = await this.s3Client.readFile({
          fileKey: `snapshots/${id}.enc`,
        });
        return buffer.toString('utf-8');
      } catch (e) {
        console.warn('[SecuritySnapshot] S3 读取失败:', e);
      }
    }
    
    return null;
  }
  
  /**
   * 删除快照存储
   */
  private async removeSnapshot(id: string): Promise<void> {
    // 删除本地文件
    try {
      const fs = await import('fs');
      const localPath = `/tmp/snapshots/${id}.enc`;
      
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (e) {
      console.warn('[SecuritySnapshot] 本地删除失败:', e);
    }
    
    // 删除 S3 存储
    if (this.s3Client) {
      try {
        // S3Storage 没有直接的删除方法，使用清理策略
        // 在 cleanupOldFiles 中实现
        console.log('[SecuritySnapshot] S3 快照将通过清理策略删除');
      } catch (e) {
        console.warn('[SecuritySnapshot] S3 删除失败:', e);
      }
    }
  }
  
  /**
   * 清理旧快照
   */
  private cleanupOldSnapshots(): void {
    if (this.snapshots.size <= this.maxSnapshots) {
      return;
    }
    
    // 按时间排序
    const sorted = Array.from(this.snapshots.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    // 删除最旧的快照
    const toDelete = sorted.slice(0, sorted.length - this.maxSnapshots);
    
    for (const [id] of toDelete) {
      this.deleteSnapshot(id).catch(e => {
        console.warn(`[SecuritySnapshot] 清理快照失败: ${id}`, e);
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

let globalSnapshotService: SecuritySnapshotService | null = null;

export function getSecuritySnapshotService(maxSnapshots?: number): SecuritySnapshotService {
  if (!globalSnapshotService) {
    globalSnapshotService = new SecuritySnapshotService(maxSnapshots);
  }
  return globalSnapshotService;
}

export function createSecuritySnapshotService(maxSnapshots?: number): SecuritySnapshotService {
  return new SecuritySnapshotService(maxSnapshots);
}
