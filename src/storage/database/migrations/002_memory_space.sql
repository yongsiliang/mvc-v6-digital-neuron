-- 记忆空间系统数据库迁移
-- 核心思想：记忆是另一个维度的存在，神经连接是钥匙

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

COMMENT ON COLUMN memory_doors.lock_pattern IS '锁的齿纹模式，决定需要什么样的钥匙才能打开';
COMMENT ON COLUMN memory_doors.lock_complexity IS '锁的复杂度，越高越难开，情感强的记忆锁更简单';
COMMENT ON COLUMN memory_doors.emotional_charge IS '情感电荷，正面/负面情感影响门的可见性和开锁难度';

COMMENT ON COLUMN neural_keys.teeth_pattern IS '钥匙齿纹，与门锁匹配才能打开';
COMMENT ON COLUMN neural_keys.strength IS '钥匙强度，学习时锻造的质量';
COMMENT ON COLUMN neural_keys.rust_level IS '锈蚀程度，长期不用会生锈，影响开锁能力';

-- 4. 外键约束（确保钥匙指向有效的门）
ALTER TABLE neural_keys 
ADD CONSTRAINT fk_neural_keys_door 
FOREIGN KEY (target_door_id) REFERENCES memory_doors(id) ON DELETE CASCADE;
