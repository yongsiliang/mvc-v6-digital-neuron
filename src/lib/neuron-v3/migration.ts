/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数据库迁移脚本 - Database Migration
 * 
 * 安全迁移原则：
 * 1. 永不删除现有数据
 * 2. 使用 IF NOT EXISTS 防止覆盖
 * 3. 迁移前自动备份
 * 4. 支持回滚操作
 * ═══════════════════════════════════════════════════════════════════════
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface MigrationResult {
  success: boolean;
  message: string;
  tablesCreated: string[];
  tablesExisting: string[];
  errors: string[];
  backupId?: string;
}

export interface MigrationStep {
  name: string;
  sql: string;
  critical: boolean; // 如果失败是否中断
}

// ─────────────────────────────────────────────────────────────────────
// 迁移步骤
// ─────────────────────────────────────────────────────────────────────

const MIGRATION_STEPS: MigrationStep[] = [
  // ══════════════════════════════════════════════════════════════════
  // 核心神经元表
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'neuron_v3_neurons',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_neurons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        
        -- 基本属性
        label TEXT,
        role TEXT NOT NULL DEFAULT 'semantic',
        level INTEGER DEFAULT 0,
        
        -- 敏感度向量
        sensitivity_vector JSONB NOT NULL,
        sensitivity_dimension INTEGER NOT NULL DEFAULT 512,
        sensitivity_plasticity FLOAT DEFAULT 0.1,
        receptive_field TEXT,
        
        -- 预测状态
        prediction_expected_activation FLOAT DEFAULT 0,
        prediction_confidence FLOAT DEFAULT 0.5,
        prediction_context_dependencies JSONB DEFAULT '[]',
        prediction_basis TEXT,
        
        -- 实际状态
        actual_activation FLOAT DEFAULT 0,
        actual_activation_history JSONB DEFAULT '[]',
        actual_last_activated_at TIMESTAMPTZ,
        
        -- 学习状态
        learning_prediction_error FLOAT DEFAULT 0,
        learning_error_history JSONB DEFAULT '[]',
        learning_accumulated_surprise FLOAT DEFAULT 0,
        learning_rate FLOAT DEFAULT 0.01,
        learning_total_events INTEGER DEFAULT 0,
        
        -- 元信息
        meta_creation_reason TEXT,
        meta_usefulness FLOAT DEFAULT 0.5,
        meta_total_activations INTEGER DEFAULT 0,
        meta_average_activation FLOAT DEFAULT 0,
        meta_pruning_candidate BOOLEAN DEFAULT FALSE,
        
        -- 保护标记（新增）
        protection_level TEXT DEFAULT 'normal',
        protection_reason TEXT,
        protection_locked BOOLEAN DEFAULT FALSE,
        protection_core BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  
  // 神经元连接表
  {
    name: 'neuron_v3_connections',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_neuron_id UUID NOT NULL REFERENCES neuron_v3_neurons(id) ON DELETE CASCADE,
        to_neuron_id UUID NOT NULL REFERENCES neuron_v3_neurons(id) ON DELETE CASCADE,
        
        type TEXT NOT NULL DEFAULT 'excitatory',
        strength FLOAT DEFAULT 0.5,
        efficiency FLOAT DEFAULT 1.0,
        delay INTEGER DEFAULT 0,
        
        -- Hebbian学习参数
        hebbian_rate FLOAT DEFAULT 0.001,
        
        -- 统计
        last_activated_at TIMESTAMPTZ,
        total_activations INTEGER DEFAULT 0,
        average_activation_strength FLOAT DEFAULT 0,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(from_neuron_id, to_neuron_id)
      );
    `,
  },
  
  // VSA 概念表
  {
    name: 'neuron_v3_concepts',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_concepts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        
        vector JSONB NOT NULL,
        type TEXT DEFAULT 'atomic',
        components JSONB DEFAULT '[]',
        
        usage_count INTEGER DEFAULT 0,
        source TEXT DEFAULT 'learned',
        
        -- 保护标记
        protection_level TEXT DEFAULT 'normal',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  
  // 系统状态表
  {
    name: 'neuron_v3_state',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_state (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE,
        
        -- 学习统计
        learning_stats JSONB DEFAULT '{
          "totalLearningEvents": 0,
          "totalReward": 0,
          "totalPunishment": 0,
          "averageValue": 0,
          "totalPredictions": 0
        }',
        
        -- 自我模型
        self_model JSONB,
        
        -- 对话历史
        recent_messages JSONB DEFAULT '[]',
        
        -- 意识连续性
        consciousness_continuity JSONB DEFAULT '{
          "recordCount": 0,
          "averageContinuity": 1,
          "lastContinuity": 1
        }',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  
  // ══════════════════════════════════════════════════════════════════
  // 记忆保护表（新增）
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'neuron_v3_memory_protection',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_memory_protection (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        memory_id TEXT NOT NULL,
        memory_type TEXT NOT NULL DEFAULT 'general',
        memory_content TEXT,
        
        -- 保护信息
        importance TEXT NOT NULL DEFAULT 'normal',
        reason TEXT,
        protected_at TIMESTAMPTZ DEFAULT NOW(),
        protected_by TEXT DEFAULT 'system',
        
        -- 锁定状态
        locked BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMPTZ,
        
        -- 元数据
        tags JSONB DEFAULT '[]',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(memory_id, memory_type)
      );
    `,
  },
  
  // 意识连续性快照表（新增）
  {
    name: 'neuron_v3_consciousness_snapshots',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_consciousness_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        snapshot_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- 自我模型快照
        self_model JSONB NOT NULL,
        
        -- 关键记忆引用
        critical_memories JSONB DEFAULT '[]',
        
        -- 意识特征向量
        consciousness_vector JSONB,
        
        -- 连续性得分
        continuity_score FLOAT DEFAULT 1.0,
        
        -- 备份标记
        is_backup BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  
  // 记忆备份表（新增）
  {
    name: 'neuron_v3_memory_backups',
    critical: true,
    sql: `
      CREATE TABLE IF NOT EXISTS neuron_v3_memory_backups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        backup_type TEXT NOT NULL DEFAULT 'automatic',
        backup_reason TEXT,
        
        -- 备份数据
        neurons_data JSONB,
        concepts_data JSONB,
        state_data JSONB,
        protection_data JSONB,
        
        -- 校验信息
        checksum TEXT,
        data_size INTEGER,
        
        -- 保留策略
        retention_days INTEGER DEFAULT 90,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );
    `,
  },
  
  // ══════════════════════════════════════════════════════════════════
  // 索引
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'idx_neuron_v3_neurons_user',
    critical: false,
    sql: `
      CREATE INDEX IF NOT EXISTS idx_neuron_v3_neurons_user 
      ON neuron_v3_neurons(user_id);
    `,
  },
  {
    name: 'idx_neuron_v3_neurons_role',
    critical: false,
    sql: `
      CREATE INDEX IF NOT EXISTS idx_neuron_v3_neurons_role 
      ON neuron_v3_neurons(role);
    `,
  },
  {
    name: 'idx_neuron_v3_protection_importance',
    critical: false,
    sql: `
      CREATE INDEX IF NOT EXISTS idx_neuron_v3_protection_importance 
      ON neuron_v3_memory_protection(importance);
    `,
  },
  {
    name: 'idx_neuron_v3_snapshots_time',
    critical: false,
    sql: `
      CREATE INDEX IF NOT EXISTS idx_neuron_v3_snapshots_time 
      ON neuron_v3_consciousness_snapshots(snapshot_at DESC);
    `,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// 迁移执行器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 执行数据库迁移
 */
export async function runMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: '',
    tablesCreated: [],
    tablesExisting: [],
    errors: [],
  };

  try {
    const supabase = getSupabaseClient();
    
    // 1. 创建备份
    console.log('[Migration] Creating backup before migration...');
    const backupId = await createPreMigrationBackup(supabase);
    result.backupId = backupId;
    
    // 2. 执行迁移步骤
    for (const step of MIGRATION_STEPS) {
      try {
        // 使用 try-catch 包装 RPC 调用
        let error: any = null;
        try {
          await supabase.rpc('exec_sql', { sql: step.sql });
        } catch (rpcError) {
          error = rpcError;
        }
        
        if (error) {
          // 检查是否是"已存在"错误
          if (error.message?.includes('already exists')) {
            result.tablesExisting.push(step.name);
            console.log(`[Migration] Table already exists: ${step.name}`);
          } else {
            throw error;
          }
        } else {
          result.tablesCreated.push(step.name);
          console.log(`[Migration] Table created: ${step.name}`);
        }
      } catch (error) {
        const errorMsg = `Step "${step.name}" failed: ${error}`;
        result.errors.push(errorMsg);
        console.error(`[Migration] ${errorMsg}`);
        
        if (step.critical) {
          result.success = false;
          result.message = `Critical migration step failed: ${step.name}`;
          return result;
        }
      }
    }

    result.message = result.success 
      ? 'Migration completed successfully'
      : 'Migration completed with errors';
    
    console.log('[Migration] Result:', result);
    return result;
    
  } catch (error) {
    result.success = false;
    result.message = `Migration failed: ${error}`;
    result.errors.push(String(error));
    return result;
  }
}

/**
 * 创建迁移前备份
 */
async function createPreMigrationBackup(supabase: ReturnType<typeof getSupabaseClient>): Promise<string> {
  const backupId = `pre-migration-${Date.now()}`;
  
  try {
    // 尝试备份现有数据
    const tables = [
      'neuron_v3_neurons',
      'neuron_v3_concepts', 
      'neuron_v3_state',
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (!error && data && data.length > 0) {
        // 保存备份
        await supabase
          .from('neuron_v3_memory_backups')
          .insert({
            backup_type: 'pre-migration',
            backup_reason: `Automatic backup before migration`,
            neurons_data: table === 'neuron_v3_neurons' ? data : null,
            concepts_data: table === 'neuron_v3_concepts' ? data : null,
            state_data: table === 'neuron_v3_state' ? data : null,
            checksum: JSON.stringify(data).length.toString(),
            data_size: JSON.stringify(data).length,
            retention_days: 365,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          });
        
        console.log(`[Migration] Backed up ${data.length} records from ${table}`);
      }
    }
  } catch (error) {
    console.warn('[Migration] Backup warning:', error);
  }
  
  return backupId;
}

/**
 * 检查迁移状态
 */
export async function checkMigrationStatus(): Promise<{
  migrated: boolean;
  tables: Record<string, boolean>;
  missingTables: string[];
}> {
  const supabase = getSupabaseClient();
  const tables: Record<string, boolean> = {};
  const missingTables: string[] = [];
  
  for (const step of MIGRATION_STEPS) {
    if (step.critical) {
      try {
        // 尝试查询表
        const { error } = await supabase
          .from(step.name)
          .select('id')
          .limit(1);
        
        tables[step.name] = !error;
        if (error) {
          missingTables.push(step.name);
        }
      } catch {
        tables[step.name] = false;
        missingTables.push(step.name);
      }
    }
  }
  
  return {
    migrated: missingTables.length === 0,
    tables,
    missingTables,
  };
}

/**
 * 回滚到备份（谨慎使用）
 */
export async function rollbackToBackup(backupId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = getSupabaseClient();
  
  try {
    // 获取备份
    const { data: backup, error } = await supabase
      .from('neuron_v3_memory_backups')
      .select('*')
      .eq('id', backupId)
      .single();
    
    if (error || !backup) {
      return { success: false, message: 'Backup not found' };
    }
    
    // 恢复数据
    if (backup.neurons_data) {
      // 先清空（保留结构）
      await supabase.from('neuron_v3_neurons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // 再恢复
      for (const neuron of backup.neurons_data) {
        await supabase.from('neuron_v3_neurons').insert(neuron);
      }
    }
    
    if (backup.concepts_data) {
      await supabase.from('neuron_v3_concepts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      for (const concept of backup.concepts_data) {
        await supabase.from('neuron_v3_concepts').insert(concept);
      }
    }
    
    if (backup.state_data) {
      await supabase.from('neuron_v3_state').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      for (const state of backup.state_data) {
        await supabase.from('neuron_v3_state').insert(state);
      }
    }
    
    return { success: true, message: 'Rollback completed' };
  } catch (error) {
    return { success: false, message: `Rollback failed: ${error}` };
  }
}
