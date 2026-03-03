/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆系统 - 数据库迁移
 * 
 * 创建表：
 * - v6_unified_memories: 记忆节点存储
 * - v6_memory_associations: 记忆关联关系
 * - v6_memory_triggers: 触发器索引
 * 
 * 注意：此迁移需要 PostgreSQL + pgvector 扩展
 * ═══════════════════════════════════════════════════════════════════════
 */

import { sql } from 'drizzle-orm';

// 迁移 SQL
export const MIGRATION_SQL = `
-- 启用 pgvector 扩展（如果未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════
-- V6 统一记忆表
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v6_unified_memories (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(30),
  content TEXT NOT NULL,
  embedding vector(1536),
  
  -- 时间信息
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- 艾宾浩斯参数
  strength REAL DEFAULT 1.0,
  retention_rate REAL DEFAULT 1.0,
  review_count INTEGER DEFAULT 0,
  next_review_time TIMESTAMPTZ,
  forgetting_curve JSONB DEFAULT '[]',
  
  -- 情感标记
  emotional_marker JSONB NOT NULL DEFAULT '{"valence":0.5,"arousal":0.5,"dominance":0.5}',
  emotional_boost REAL DEFAULT 0,
  
  -- 激活状态
  activation_count INTEGER DEFAULT 0,
  last_activation_time BIGINT DEFAULT 0,
  activation_history JSONB DEFAULT '[]',
  
  -- 结晶化
  consolidation_level REAL DEFAULT 0,
  crystallized BOOLEAN DEFAULT FALSE,
  crystallized_at TIMESTAMPTZ,
  
  -- 其他
  importance REAL DEFAULT 0.5,
  tags JSONB DEFAULT '[]',
  metadata JSONB
);

-- 索引
CREATE INDEX IF NOT EXISTS v6_memories_type_idx ON v6_unified_memories(type);
CREATE INDEX IF NOT EXISTS v6_memories_category_idx ON v6_unified_memories(category);
CREATE INDEX IF NOT EXISTS v6_memories_created_idx ON v6_unified_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS v6_memories_crystallized_idx ON v6_unified_memories(crystallized) WHERE crystallized = TRUE;
CREATE INDEX IF NOT EXISTS v6_memories_importance_idx ON v6_unified_memories(importance DESC);

-- 向量索引 (HNSW)
CREATE INDEX IF NOT EXISTS v6_memories_embedding_idx ON v6_unified_memories 
  USING hnsw (embedding vector_cosine_ops);

-- ═══════════════════════════════════════════════════════════════════════
-- V6 记忆关联表
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v6_memory_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES v6_unified_memories(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES v6_unified_memories(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL,  -- semantic, temporal, causal, emotional, trigger
  weight REAL NOT NULL DEFAULT 0.5,
  
  co_activation_count INTEGER DEFAULT 0,
  last_co_activated TIMESTAMPTZ,
  formed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(source_id, target_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS v6_assoc_source_idx ON v6_memory_associations(source_id);
CREATE INDEX IF NOT EXISTS v6_assoc_target_idx ON v6_memory_associations(target_id);
CREATE INDEX IF NOT EXISTS v6_assoc_type_idx ON v6_memory_associations(type);
CREATE INDEX IF NOT EXISTS v6_assoc_weight_idx ON v6_memory_associations(weight DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- V6 触发器表
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS v6_memory_triggers (
  id VARCHAR(50) PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES v6_unified_memories(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL,  -- keyword, concept, emotion, context
  pattern TEXT NOT NULL,
  strength REAL NOT NULL DEFAULT 0.5,
  
  trigger_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE
);

-- 索引
CREATE INDEX IF NOT EXISTS v6_triggers_memory_idx ON v6_memory_triggers(memory_id);
CREATE INDEX IF NOT EXISTS v6_triggers_type_idx ON v6_memory_triggers(type);
CREATE INDEX IF NOT EXISTS v6_triggers_pattern_idx ON v6_memory_triggers(pattern);
CREATE INDEX IF NOT EXISTS v6_triggers_enabled_idx ON v6_memory_triggers(enabled) WHERE enabled = TRUE;

-- ═══════════════════════════════════════════════════════════════════════
-- 触发器索引视图（用于快速检索）
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v6_trigger_index AS
SELECT 
  type,
  pattern,
  memory_id,
  strength
FROM v6_memory_triggers
WHERE enabled = TRUE
ORDER BY strength DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 向量相似度搜索函数
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION v6_search_similar_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.6,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM v6_unified_memories m
  WHERE m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 自我核心视图
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v6_self_core AS
SELECT 
  id,
  content,
  type,
  consolidation_level,
  crystallized_at,
  importance,
  tags
FROM v6_unified_memories
WHERE crystallized = TRUE
ORDER BY consolidation_level DESC, importance DESC;
`;

// 回滚 SQL
export const ROLLBACK_SQL = `
DROP VIEW IF EXISTS v6_self_core;
DROP FUNCTION IF EXISTS v6_search_similar_memories;
DROP VIEW IF EXISTS v6_trigger_index;
DROP TABLE IF EXISTS v6_memory_triggers;
DROP TABLE IF EXISTS v6_memory_associations;
DROP TABLE IF EXISTS v6_unified_memories;
`;

/**
 * 执行迁移
 */
export async function runMigration(): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log('[迁移] 开始创建统一记忆系统表...');
  
  try {
    const { db } = await import('@/storage/index');
    
    // 分割SQL语句并逐个执行
    const statements = MIGRATION_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        try {
          await db.execute(sql.raw(statement));
        } catch (e) {
          // 忽略 "已存在" 类型的错误
          const errorMsg = e instanceof Error ? e.message : String(e);
          if (!errorMsg.includes('already exists') && !errorMsg.includes('duplicate')) {
            console.warn(`[迁移] 语句执行警告: ${errorMsg.substring(0, 100)}`);
          }
        }
      }
    }
    
    console.log('[迁移] 统一记忆系统表创建成功');
    return { success: true, message: '统一记忆系统表创建成功' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[迁移] 创建表失败:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * 回滚迁移
 */
export async function rollbackMigration(): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log('[迁移] 开始回滚统一记忆系统表...');
  
  try {
    const { db } = await import('@/storage/index');
    
    // 分割SQL语句并逐个执行
    const statements = ROLLBACK_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement) {
        try {
          await db.execute(sql.raw(statement));
        } catch (e) {
          // 忽略 "不存在" 类型的错误
          const errorMsg = e instanceof Error ? e.message : String(e);
          if (!errorMsg.includes('does not exist')) {
            console.warn(`[迁移] 回滚语句警告: ${errorMsg.substring(0, 100)}`);
          }
        }
      }
    }
    
    console.log('[迁移] 统一记忆系统表已删除');
    return { success: true, message: '统一记忆系统表已删除' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[迁移] 回滚失败:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
