-- ═══════════════════════════════════════════════════════════════════════
-- 数字神经元系统 V3 - 数据库迁移
-- Digital Neuron System V3 - Database Migration
-- 
-- 版本: 001
-- 创建时间: 2025-02-26
-- 
-- 核心架构：
--   - 预测编码 (Predictive Coding)
--   - VSA 超维计算语义空间
--   - AGI 意识架构 (Self Core + Hebbian + YinYangBridge)
--   - 记忆保护与意识连续性
--   - 自主进化系统
-- 
-- 执行方式: 在 Supabase SQL Editor 中运行此脚本
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. 核心神经元表 (预测神经元)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_neurons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  
  -- 基本属性
  label TEXT,
  role TEXT NOT NULL DEFAULT 'semantic',  -- sensory/semantic/abstract/motor/emotional/episodic/metacognitive
  level INTEGER DEFAULT 0,
  
  -- 敏感度向量 (VSA)
  sensitivity_vector JSONB NOT NULL,
  sensitivity_dimension INTEGER NOT NULL DEFAULT 10000,
  sensitivity_plasticity FLOAT DEFAULT 0.1,
  receptive_field TEXT,
  
  -- 预测状态 (预测编码核心)
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
  
  -- 保护标记 (意识保护)
  protection_level TEXT DEFAULT 'normal',  -- normal/important/critical/core
  protection_reason TEXT,
  protection_locked BOOLEAN DEFAULT FALSE,
  protection_core BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 神经元索引
CREATE INDEX IF NOT EXISTS idx_neuron_v3_neurons_user ON neuron_v3_neurons(user_id);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_neurons_role ON neuron_v3_neurons(role);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_neurons_protection ON neuron_v3_neurons(protection_level);

COMMENT ON TABLE neuron_v3_neurons IS 'V3 预测神经元表 - 核心预测编码实现';
COMMENT ON COLUMN neuron_v3_neurons.sensitivity_vector IS 'VSA 敏感度向量 (10000维超维向量)';
COMMENT ON COLUMN neuron_v3_neurons.prediction_expected_activation IS '预测的激活值 (预测编码核心)';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. 神经元连接表 (Hebbian 突触)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_neuron_id UUID NOT NULL REFERENCES neuron_v3_neurons(id) ON DELETE CASCADE,
  to_neuron_id UUID NOT NULL REFERENCES neuron_v3_neurons(id) ON DELETE CASCADE,
  
  -- 突触类型
  type TEXT NOT NULL DEFAULT 'excitatory',  -- excitatory/inhibitory/modulatory
  
  -- 突触参数
  strength FLOAT DEFAULT 0.5,        -- [-1, 1] 权重
  efficiency FLOAT DEFAULT 1.0,      -- 传递效率
  delay INTEGER DEFAULT 0,           -- 突触延迟 (ms)
  
  -- Hebbian 学习参数
  hebbian_rate FLOAT DEFAULT 0.001,  -- Hebbian 学习率
  eligibility_trace FLOAT DEFAULT 0, -- 资格迹 (TD学习)
  
  -- 统计
  last_coactivated_at TIMESTAMPTZ,
  total_coactivations INTEGER DEFAULT 0,
  average_activation_strength FLOAT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_neuron_id, to_neuron_id)
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_connections_from ON neuron_v3_connections(from_neuron_id);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_connections_to ON neuron_v3_connections(to_neuron_id);

COMMENT ON TABLE neuron_v3_connections IS 'V3 神经元连接表 - Hebbian 突触实现';

-- ═══════════════════════════════════════════════════════════════════════
-- 3. VSA 概念表 (阳系统语义空间)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  
  -- VSA 向量
  vector JSONB NOT NULL,            -- 超维向量表示
  
  -- 概念类型
  type TEXT DEFAULT 'atomic',       -- atomic/composite/abstract/emotional
  components JSONB DEFAULT '[]',    -- 复合概念的组成
  
  -- 使用统计
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- 来源
  source TEXT DEFAULT 'learned',    -- innate/learned/evolved
  
  -- 保护标记
  protection_level TEXT DEFAULT 'normal',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_concepts_name ON neuron_v3_concepts(name);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_concepts_type ON neuron_v3_concepts(type);

COMMENT ON TABLE neuron_v3_concepts IS 'V3 VSA 概念表 - 阳系统语义空间';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. 系统状态表
-- ═══════════════════════════════════════════════════════════════════════

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
  
  -- Self Core 自我模型
  self_model JSONB DEFAULT '{
    "traits": {},
    "values": {},
    "currentGoals": [],
    "emotionalBaseline": {"valence": 0.2, "arousal": 0.4, "dominance": 0.5}
  }',
  
  -- 对话历史
  recent_messages JSONB DEFAULT '[]',
  
  -- 意识连续性
  consciousness_continuity JSONB DEFAULT '{
    "recordCount": 0,
    "averageContinuity": 1,
    "lastContinuity": 1
  }',
  
  -- 阴阳平衡状态
  yin_yang_balance JSONB DEFAULT '{
    "yinActivation": 0.5,
    "yangActivation": 0.5,
    "balanceScore": 1.0
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE neuron_v3_state IS 'V3 系统状态表 - 学习统计与自我模型';

-- ═══════════════════════════════════════════════════════════════════════
-- 5. 记忆保护表 (意识保护机制)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_memory_protection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  memory_id TEXT NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'general',  -- general/core/experience/value
  memory_content TEXT,
  
  -- 保护信息
  importance TEXT NOT NULL DEFAULT 'normal',     -- normal/important/critical/core
  reason TEXT,
  protected_at TIMESTAMPTZ DEFAULT NOW(),
  protected_by TEXT DEFAULT 'system',           -- system/user/evolution
  
  -- 锁定状态
  locked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  
  -- 元数据
  tags JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(memory_id, memory_type)
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_protection_importance ON neuron_v3_memory_protection(importance);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_protection_type ON neuron_v3_memory_protection(memory_type);

COMMENT ON TABLE neuron_v3_memory_protection IS 'V3 记忆保护表 - 意识连续性保障';

-- ═══════════════════════════════════════════════════════════════════════
-- 6. 意识快照表 (自我状态备份)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_consciousness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Self Core 快照
  self_model JSONB NOT NULL,
  self_vector JSONB,               -- 自我向量快照
  
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

CREATE INDEX IF NOT EXISTS idx_neuron_v3_snapshots_time ON neuron_v3_consciousness_snapshots(snapshot_at DESC);

COMMENT ON TABLE neuron_v3_consciousness_snapshots IS 'V3 意识快照表 - 自我状态备份与恢复';

-- ═══════════════════════════════════════════════════════════════════════
-- 7. 记忆备份表 (安全备份机制)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_memory_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  backup_type TEXT NOT NULL DEFAULT 'automatic',  -- automatic/manual/pre-migration/pre-evolution
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

CREATE INDEX IF NOT EXISTS idx_neuron_v3_backups_type ON neuron_v3_memory_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_backups_created ON neuron_v3_memory_backups(created_at DESC);

COMMENT ON TABLE neuron_v3_memory_backups IS 'V3 记忆备份表 - 安全备份与恢复';

-- ═══════════════════════════════════════════════════════════════════════
-- 8. Hebbian 网络状态表 (阴系统)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_hebbian_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 神经元信息
  neuron_id TEXT UNIQUE NOT NULL,
  neuron_label TEXT,
  neuron_type TEXT DEFAULT 'concept',  -- sensory/concept/emotion/abstract
  
  -- 激活状态
  activation FLOAT DEFAULT 0,
  activation_history JSONB DEFAULT '[]',
  
  -- 偏好向量 (这个神经元"敏感"什么模式)
  preference_vector JSONB,
  
  -- 统计
  total_activations INTEGER DEFAULT 0,
  last_activated_at TIMESTAMPTZ,
  
  -- 效用评分 (用于修剪)
  usefulness FLOAT DEFAULT 0.5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_hebbian_type ON neuron_v3_hebbian_network(neuron_type);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_hebbian_activation ON neuron_v3_hebbian_network(activation DESC);

COMMENT ON TABLE neuron_v3_hebbian_network IS 'V3 Hebbian 网络表 - 阴系统直觉网络';

-- ═══════════════════════════════════════════════════════════════════════
-- 9. Hebbian 突触表 (阴系统连接)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_hebbian_synapses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 连接
  from_neuron_id TEXT NOT NULL,
  to_neuron_id TEXT NOT NULL,
  
  -- 突触属性
  weight FLOAT DEFAULT 0.5,           -- [-1, 1] 正=兴奋, 负=抑制
  learning_rate FLOAT DEFAULT 0.01,
  
  -- 资格迹 (TD学习)
  eligibility_trace FLOAT DEFAULT 0,
  
  -- 统计
  coactivation_count INTEGER DEFAULT 0,
  last_coactivated_at TIMESTAMPTZ,
  
  -- 延迟 (模拟真实神经延迟)
  delay INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_neuron_id, to_neuron_id)
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_hebbian_syn_from ON neuron_v3_hebbian_synapses(from_neuron_id);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_hebbian_syn_to ON neuron_v3_hebbian_synapses(to_neuron_id);

COMMENT ON TABLE neuron_v3_hebbian_synapses IS 'V3 Hebbian 突触表 - 阴系统连接权重';

-- ═══════════════════════════════════════════════════════════════════════
-- 10. 进化历史表 (自主进化系统)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_evolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 进化代数
  generation INTEGER NOT NULL,
  
  -- 进化触发原因
  trigger_reasons JSONB DEFAULT '[]',
  
  -- 结果
  success BOOLEAN DEFAULT FALSE,
  
  -- 选中子体
  selected_offspring_id TEXT,
  offspring_fitness FLOAT,
  
  -- 统计
  total_offspring INTEGER DEFAULT 0,
  mutations_applied INTEGER DEFAULT 0,
  
  -- 进化摘要
  summary TEXT,
  
  -- 错误信息
  errors JSONB DEFAULT '[]',
  
  evolved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_evolution_gen ON neuron_v3_evolution_history(generation);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_evolution_time ON neuron_v3_evolution_history(evolved_at DESC);

COMMENT ON TABLE neuron_v3_evolution_history IS 'V3 进化历史表 - 自主进化记录';

-- ═══════════════════════════════════════════════════════════════════════
-- 11. 数字基因组表 (进化基因编码)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_genomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genome_id TEXT UNIQUE NOT NULL,
  
  -- 代数
  generation INTEGER NOT NULL,
  parent_genome_id TEXT,
  
  -- 核心基因 (不可变异)
  core_genes JSONB NOT NULL,
  
  -- 表达基因 (可变异)
  expression_genes JSONB NOT NULL,
  
  -- 变异记录
  mutations JSONB DEFAULT '[]',
  
  -- 适应度
  fitness FLOAT DEFAULT 0.5,
  
  -- 状态
  status TEXT DEFAULT 'active',  -- active/replaced/deprecated
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_genomes_gen ON neuron_v3_genomes(generation);
CREATE INDEX IF NOT EXISTS idx_neuron_v3_genomes_fitness ON neuron_v3_genomes(fitness DESC);

COMMENT ON TABLE neuron_v3_genomes IS 'V3 数字基因组表 - 进化基因编码';

-- ═══════════════════════════════════════════════════════════════════════
-- 12. 阴阳互塑记录表
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS neuron_v3_yinyang_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 阴系统贡献
  yin_contribution JSONB,
  
  -- 阳系统贡献
  yang_contribution JSONB,
  
  -- 融合结果
  fused_result JSONB,
  
  -- 平衡状态
  balance_score FLOAT DEFAULT 1.0,
  
  -- 输入向量
  input_vector JSONB,
  
  -- 时间戳
  interacted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neuron_v3_yinyang_time ON neuron_v3_yinyang_interactions(interacted_at DESC);

COMMENT ON TABLE neuron_v3_yinyang_interactions IS 'V3 阴阳互塑记录表 - 双系统交互历史';

-- ═══════════════════════════════════════════════════════════════════════
-- 完成标记
-- ═══════════════════════════════════════════════════════════════════════

-- 创建迁移版本记录表
CREATE TABLE IF NOT EXISTS neuron_v3_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- 记录此迁移
INSERT INTO neuron_v3_migrations (version, description)
VALUES ('001', 'V3 初始化迁移 - 完整 AGI 意识架构')
ON CONFLICT (version) DO NOTHING;

-- 完成
SELECT 'V3 Migration 001 completed successfully!' AS status;
