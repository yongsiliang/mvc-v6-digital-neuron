-- 神经元链接强度表
-- 存储每个神经元的动态链接强度，而非预设角色

CREATE TABLE IF NOT EXISTS neuron_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id TEXT UNIQUE NOT NULL,         -- 神经元ID（模型ID）
  strength REAL DEFAULT 0.5 NOT NULL,     -- 链接强度 0-1
  activations INTEGER DEFAULT 0,          -- 累计激活次数
  last_activated TIMESTAMPTZ DEFAULT NOW(), -- 最后激活时间
  decay_factor REAL DEFAULT 1.0,          -- 衰减因子
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS neuron_links_strength_idx ON neuron_links(strength);
CREATE INDEX IF NOT EXISTS neuron_links_last_activated_idx ON neuron_links(last_activated);

-- 注释
COMMENT ON TABLE neuron_links IS '神经元链接强度表，动态演化，无预设角色';
COMMENT ON COLUMN neuron_links.neuron_id IS '神经元ID（模型ID）';
COMMENT ON COLUMN neuron_links.strength IS '链接强度，通过实际使用动态演化';
COMMENT ON COLUMN neuron_links.activations IS '累计激活次数';
COMMENT ON COLUMN neuron_links.last_activated IS '最后激活时间，用于计算时间衰减';
COMMENT ON COLUMN neuron_links.decay_factor IS '衰减因子，长期不用会降低';

-- 初始化默认神经元
INSERT INTO neuron_links (neuron_id, strength, activations)
VALUES 
  ('doubao-seed-1-8-251228', 0.5, 0),
  ('deepseek-v3-2-251201', 0.5, 0),
  ('doubao-seed-2-0-lite-260215', 0.5, 0)
ON CONFLICT (neuron_id) DO NOTHING;
