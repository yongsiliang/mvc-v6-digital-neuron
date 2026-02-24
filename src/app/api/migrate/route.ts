import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 数据库迁移API
 * 
 * 执行记忆空间表的创建
 */

// 迁移SQL
const MIGRATION_SQL = `
-- 1. 记忆门表
CREATE TABLE IF NOT EXISTS memory_doors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 门的内容（另一个维度的信息）
  content TEXT NOT NULL,
  
  -- 核心意义
  meaning TEXT NOT NULL,
  
  -- 意义向量（门的位置坐标）
  meaning_vector JSONB NOT NULL,
  
  -- 锁的复杂度（0-1，越高越难开）
  lock_complexity REAL DEFAULT 0.5 NOT NULL,
  
  -- 锁的齿纹模式（需要的钥匙形状）
  lock_pattern JSONB NOT NULL,
  
  -- 门类型
  door_type VARCHAR(32) NOT NULL,
  
  -- 情感电荷（-1到1，影响门的可见性）
  emotional_charge REAL DEFAULT 0,
  
  -- 访问次数
  access_count INTEGER DEFAULT 0 NOT NULL,
  
  -- 最后访问时间
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- 创建者（哪个角色）
  created_by VARCHAR(32) NOT NULL,
  
  -- 创建时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS doors_type_idx ON memory_doors(door_type);
CREATE INDEX IF NOT EXISTS doors_creator_idx ON memory_doors(created_by);
CREATE INDEX IF NOT EXISTS doors_access_idx ON memory_doors(access_count);

-- 2. 神经钥匙表
CREATE TABLE IF NOT EXISTS neural_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 钥匙持有者
  holder_role VARCHAR(32) NOT NULL,
  
  -- 钥匙齿纹（神经连接模式）
  teeth_pattern JSONB NOT NULL,
  
  -- 钥匙强度（0-1）
  strength REAL DEFAULT 0.5 NOT NULL,
  
  -- 对应的记忆门
  target_door_id UUID NOT NULL REFERENCES memory_doors(id),
  
  -- 锈蚀程度（0-1，越高越难用）
  rust_level REAL DEFAULT 0 NOT NULL,
  
  -- 使用次数
  use_count INTEGER DEFAULT 0 NOT NULL,
  
  -- 最后使用时间
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- 创建时间
  forged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS keys_holder_idx ON neural_keys(holder_role);
CREATE INDEX IF NOT EXISTS keys_door_idx ON neural_keys(target_door_id);
CREATE INDEX IF NOT EXISTS keys_strength_idx ON neural_keys(strength);

-- 3. 添加注释
COMMENT ON TABLE memory_doors IS '记忆门 - 存在于记忆空间中的信息，每扇门后有记忆';
COMMENT ON TABLE neural_keys IS '神经钥匙 - 打开记忆门的工具，学习就是锻造钥匙';
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // 尝试使用 RPC 执行迁移
    // 注意：这需要 Supabase 配置了 execute_sql RPC 函数
    // 如果没有，需要手动在 Supabase 控制台执行 SQL
    
    // 首先检查表是否已存在
    const { error: checkError } = await supabase
      .from('memory_doors')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: '记忆空间表已存在，无需迁移',
        tables: ['memory_doors', 'neural_keys']
      });
    }
    
    // 表不存在，返回迁移 SQL 供用户手动执行
    return NextResponse.json({
      success: false,
      message: '记忆空间表不存在，请手动执行迁移SQL',
      instruction: '在 Supabase 控制台 -> SQL Editor 中执行以下SQL：',
      sql: MIGRATION_SQL,
      tables: ['memory_doors', 'neural_keys']
    });
    
  } catch (error) {
    console.error('迁移失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '迁移失败',
    }, { status: 500 });
  }
}

/**
 * GET - 检查迁移状态
 */
export async function GET() {
  const supabase = getSupabaseClient();
  
  const tables: Record<string, boolean> = {};
  
  // 检查 memory_doors 表
  const { error: doorsError } = await supabase
    .from('memory_doors')
    .select('id')
    .limit(1);
  tables.memory_doors = !doorsError;
  
  // 检查 neural_keys 表
  const { error: keysError } = await supabase
    .from('neural_keys')
    .select('id')
    .limit(1);
  tables.neural_keys = !keysError;
  
  // 检查现有表
  const { count: neuronMemoriesCount } = await supabase
    .from('neuron_memories')
    .select('*', { count: 'exact', head: true });
  
  const { count: gameStatsCount } = await supabase
    .from('game_statistics')
    .select('*', { count: 'exact', head: true });
  
  return NextResponse.json({
    success: true,
    tables,
    existingData: {
      neuron_memories: neuronMemoriesCount || 0,
      game_statistics: gameStatsCount || 0,
    },
    allMigrated: tables.memory_doors && tables.neural_keys
  });
}
