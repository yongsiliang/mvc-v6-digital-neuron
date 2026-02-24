-- 意义记忆系统数据库迁移
-- 执行此脚本创建意义记忆相关表

-- 1. 意义记忆表
CREATE TABLE IF NOT EXISTS meaning_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 意义向量（高维语义表示）
  meaning_vector JSONB NOT NULL,
  
  -- 向量维度
  vector_dimension INTEGER DEFAULT 1024 NOT NULL,
  
  -- 原始内容（用于展示）
  raw_content TEXT NOT NULL,
  
  -- 意义摘要（模型提取的"核心意义"）
  meaning_summary TEXT NOT NULL,
  
  -- 所属模型角色
  role VARCHAR(32) NOT NULL,
  
  -- 意义类型
  meaning_type VARCHAR(32) NOT NULL,
  
  -- 激活强度
  activation_level REAL DEFAULT 0.5 NOT NULL,
  
  -- 共鸣次数
  resonance_count INTEGER DEFAULT 0 NOT NULL,
  
  -- 关联记忆ID列表
  connected_memory_ids JSONB DEFAULT '[]',
  
  -- 情感权重
  emotional_weight REAL DEFAULT 0,
  
  -- 创建时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- 最后激活时间
  last_activated_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX IF NOT EXISTS meaning_role_idx ON meaning_memories(role);
CREATE INDEX IF NOT EXISTS meaning_type_idx ON meaning_memories(meaning_type);
CREATE INDEX IF NOT EXISTS meaning_activation_idx ON meaning_memories(activation_level);
CREATE INDEX IF NOT EXISTS meaning_resonance_idx ON meaning_memories(resonance_count);

-- 2. 意义关联表
CREATE TABLE IF NOT EXISTS meaning_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 源记忆
  source_memory_id UUID NOT NULL,
  
  -- 目标记忆
  target_memory_id UUID NOT NULL,
  
  -- 连接强度
  connection_strength REAL DEFAULT 0.5 NOT NULL,
  
  -- 连接类型
  connection_type VARCHAR(32) NOT NULL,
  
  -- 创建时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS connection_source_idx ON meaning_connections(source_memory_id);
CREATE INDEX IF NOT EXISTS connection_target_idx ON meaning_connections(target_memory_id);
CREATE INDEX IF NOT EXISTS connection_strength_idx ON meaning_connections(connection_strength);

-- 3. 激活记录表
CREATE TABLE IF NOT EXISTS activation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 触发源
  trigger_source VARCHAR(32) NOT NULL,
  
  -- 触发内容
  trigger_content TEXT,
  
  -- 被激活的记忆ID
  activated_memory_id UUID NOT NULL,
  
  -- 激活强度
  activation_strength REAL NOT NULL,
  
  -- 是否影响了决策
  influenced_decision INTEGER DEFAULT 0,
  
  -- 创建时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS activation_trigger_idx ON activation_records(trigger_source);
CREATE INDEX IF NOT EXISTS activation_memory_idx ON activation_records(activated_memory_id);
CREATE INDEX IF NOT EXISTS activation_created_idx ON activation_records(created_at);

-- 4. 添加注释
COMMENT ON TABLE meaning_memories IS '意义记忆表 - 存储记忆的意义向量而非原始数据';
COMMENT ON TABLE meaning_connections IS '意义关联表 - 存储记忆之间的连接关系';
COMMENT ON TABLE activation_records IS '激活记录表 - 记录每次意义共鸣激活事件';

COMMENT ON COLUMN meaning_memories.meaning_vector IS '高维语义向量，用于计算共鸣';
COMMENT ON COLUMN meaning_memories.meaning_summary IS '模型提取的核心意义，非原始内容';
COMMENT ON COLUMN meaning_memories.activation_level IS '当前激活程度，随时间衰减，被激活时增强';
COMMENT ON COLUMN meaning_memories.resonance_count IS '被激活的总次数，代表重要性';
COMMENT ON COLUMN meaning_memories.connected_memory_ids IS '形成意义网络的关联记忆';
