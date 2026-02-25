-- ═══════════════════════════════════════════════════════════════════════
-- 数字神经元系统 V2 - 数据库迁移脚本
-- Digital Neuron System V2 - Database Migration
-- 
-- 执行方式: 在 Supabase SQL Editor 中运行此脚本
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. 用户表
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_auth_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_external_auth_idx ON users(external_auth_id);

-- ─────────────────────────────────────────────────────────────────────
-- 2. 神经元表
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS neurons_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(255),
  label_source VARCHAR(20),
  functional_role VARCHAR(20) DEFAULT 'latent' NOT NULL,
  emergent_layer VARCHAR(20),
  sensitivity_vector JSONB NOT NULL,
  sensitivity_dimension INTEGER DEFAULT 768 NOT NULL,
  sensitivity_plasticity REAL DEFAULT 0.5 NOT NULL,
  activation REAL DEFAULT 0 NOT NULL,
  activation_trend VARCHAR(10) DEFAULT 'stable',
  refractory_period INTEGER DEFAULT 100 NOT NULL,
  last_activated_at TIMESTAMPTZ,
  total_activations INTEGER DEFAULT 0 NOT NULL,
  average_activation REAL DEFAULT 0 NOT NULL,
  connection_changes INTEGER DEFAULT 0 NOT NULL,
  usefulness REAL DEFAULT 0.5 NOT NULL,
  source VARCHAR(20) DEFAULT 'created' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS neurons_v2_user_idx ON neurons_v2(user_id);
CREATE INDEX IF NOT EXISTS neurons_v2_activation_idx ON neurons_v2(activation);

-- ─────────────────────────────────────────────────────────────────────
-- 3. 连接表
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS connections_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_neuron UUID NOT NULL REFERENCES neurons_v2(id) ON DELETE CASCADE,
  to_neuron UUID NOT NULL REFERENCES neurons_v2(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'excitatory' NOT NULL,
  strength REAL DEFAULT 0.5 NOT NULL,
  plasticity REAL DEFAULT 0.5 NOT NULL,
  delay REAL DEFAULT 0 NOT NULL,
  efficiency REAL DEFAULT 1 NOT NULL,
  last_activated_at TIMESTAMPTZ,
  total_activations INTEGER DEFAULT 0 NOT NULL,
  average_activation_strength REAL DEFAULT 0 NOT NULL,
  source VARCHAR(20) DEFAULT 'created' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS connections_v2_user_idx ON connections_v2(user_id);
CREATE INDEX IF NOT EXISTS connections_v2_from_idx ON connections_v2(from_neuron);
CREATE INDEX IF NOT EXISTS connections_v2_to_idx ON connections_v2(to_neuron);

-- ─────────────────────────────────────────────────────────────────────
-- 4. 记忆表
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memories_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_embedding VECTOR(1536),  -- OpenAI embedding 维度
  type VARCHAR(20) NOT NULL,
  importance REAL DEFAULT 0.5 NOT NULL,
  emotional_intensity REAL DEFAULT 0 NOT NULL,
  emotional_valence REAL DEFAULT 0 NOT NULL,
  strength REAL DEFAULT 1 NOT NULL,
  consolidated BOOLEAN DEFAULT FALSE NOT NULL,
  related_neurons JSONB DEFAULT '[]',
  related_connections JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  recall_count INTEGER DEFAULT 0 NOT NULL,
  last_recalled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS memories_v2_user_idx ON memories_v2(user_id);
CREATE INDEX IF NOT EXISTS memories_v2_type_idx ON memories_v2(type);
CREATE INDEX IF NOT EXISTS memories_v2_created_idx ON memories_v2(created_at DESC);

-- 向量相似度搜索索引（需要 pgvector 扩展）
-- CREATE INDEX IF NOT EXISTS memories_v2_embedding_idx ON memories_v2 
--   USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────
-- 5. 自我模型表
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS self_models_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  core_traits JSONB DEFAULT '[]',
  values JSONB DEFAULT '[]',
  beliefs JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  limitations JSONB DEFAULT '[]',
  growth_areas JSONB DEFAULT '[]',
  significant_events JSONB DEFAULT '[]',
  learned_lessons JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS self_models_v2_user_idx ON self_models_v2(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 6. 系统状态快照表
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_states_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  neuron_count INTEGER DEFAULT 0 NOT NULL,
  connection_count INTEGER DEFAULT 0 NOT NULL,
  global_activation_level REAL DEFAULT 0 NOT NULL,
  entropy REAL DEFAULT 0 NOT NULL,
  coherence REAL DEFAULT 0 NOT NULL,
  vitality REAL DEFAULT 0 NOT NULL,
  snapshot_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS system_states_v2_user_idx ON system_states_v2(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 启用 pgvector 扩展（用于向量相似度搜索）
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════
-- 添加向量相似度搜索函数
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION search_memories_by_similarity(
  query_embedding VECTOR(1536),
  p_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  type VARCHAR(20),
  importance REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    1 - (m.content_embedding <=> query_embedding) AS similarity,
    m.type,
    m.importance,
    m.created_at
  FROM memories_v2 m
  WHERE m.user_id = p_user_id
    AND m.content_embedding IS NOT NULL
    AND 1 - (m.content_embedding <=> query_embedding) > match_threshold
  ORDER BY m.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 触发器：自动更新 updated_at
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加触发器
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'neurons_v2_updated_at') THEN
    CREATE TRIGGER neurons_v2_updated_at
      BEFORE UPDATE ON neurons_v2
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'memories_v2_updated_at') THEN
    CREATE TRIGGER memories_v2_updated_at
      BEFORE UPDATE ON memories_v2
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'self_models_v2_updated_at') THEN
    CREATE TRIGGER self_models_v2_updated_at
      BEFORE UPDATE ON self_models_v2
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
