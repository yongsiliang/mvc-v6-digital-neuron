#!/usr/bin/env python3
"""
记忆空间数据库迁移脚本
使用 PGDATABASE_URL 直接连接数据库执行迁移
"""

import os
import sys

def get_database_url():
    """获取数据库连接URL"""
    try:
        from coze_workload_identity import Client
        client = Client()
        env_vars = client.get_project_env_vars()
        client.close()
        
        for env_var in env_vars:
            if env_var.key == 'PGDATABASE_URL':
                return env_var.value
        
        return None
    except Exception as e:
        print(f"获取环境变量失败: {e}")
        return None

def run_migration():
    """执行迁移"""
    db_url = get_database_url()
    if not db_url:
        print("错误: 无法获取数据库连接URL")
        return False
    
    print("正在连接数据库...")
    
    try:
        import psycopg2
    except ImportError:
        print("安装 psycopg2...")
        os.system("pip install psycopg2-binary -q")
        import psycopg2
    
    migration_sql = """
-- 1. 记忆门表
CREATE TABLE IF NOT EXISTS memory_doors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  meaning TEXT NOT NULL,
  meaning_vector JSONB NOT NULL,
  lock_complexity REAL DEFAULT 0.5 NOT NULL,
  lock_pattern JSONB NOT NULL,
  door_type VARCHAR(32) NOT NULL,
  emotional_charge REAL DEFAULT 0,
  access_count INTEGER DEFAULT 0 NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS doors_type_idx ON memory_doors(door_type);
CREATE INDEX IF NOT EXISTS doors_creator_idx ON memory_doors(created_by);
CREATE INDEX IF NOT EXISTS doors_access_idx ON memory_doors(access_count);

-- 2. 神经钥匙表
CREATE TABLE IF NOT EXISTS neural_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_role VARCHAR(32) NOT NULL,
  teeth_pattern JSONB NOT NULL,
  strength REAL DEFAULT 0.5 NOT NULL,
  target_door_id UUID NOT NULL,
  rust_level REAL DEFAULT 0 NOT NULL,
  use_count INTEGER DEFAULT 0 NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  forged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS keys_holder_idx ON neural_keys(holder_role);
CREATE INDEX IF NOT EXISTS keys_door_idx ON neural_keys(target_door_id);
CREATE INDEX IF NOT EXISTS keys_strength_idx ON neural_keys(strength);
"""
    
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("执行迁移SQL...")
        
        # 分割SQL并逐个执行
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
        
        for i, stmt in enumerate(statements):
            if stmt:
                try:
                    cursor.execute(stmt)
                    print(f"  ✓ 语句 {i+1}/{len(statements)} 执行成功")
                except Exception as e:
                    if 'already exists' in str(e).lower():
                        print(f"  ○ 语句 {i+1}/{len(statements)} 已存在，跳过")
                    else:
                        print(f"  ✗ 语句 {i+1}/{len(statements)} 执行失败: {e}")
        
        cursor.close()
        conn.close()
        
        print()
        print("✅ 迁移完成！")
        return True
        
    except Exception as e:
        print(f"迁移失败: {e}")
        return False

if __name__ == "__main__":
    run_migration()
