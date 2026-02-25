/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数据库连接：Drizzle ORM + Supabase
 * Database Connection: Drizzle ORM + Supabase
 * 
 * 核心功能：
 * - 提供统一的数据库连接
 * - 兼容 drizzle-orm 和 Supabase 客户端
 * ═══════════════════════════════════════════════════════════════════════
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getSupabaseCredentials } from './database/supabase-client';

// 从共享schema导入所有表
import * as schema from './database/shared/schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * 获取数据库连接（单例模式）
 */
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const { url } = getSupabaseCredentials();
  
  // 使用 pg 连接池
  const pool = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

  dbInstance = drizzle(pool, { schema });
  
  return dbInstance;
}

// 导出db实例（延迟初始化）
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const actualDb = getDb();
    return Reflect.get(actualDb, prop, actualDb);
  }
});

// 导出schema
export * from './database/shared/schema';
