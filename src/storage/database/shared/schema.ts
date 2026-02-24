import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  index,
  uuid,
  real,
} from "drizzle-orm/pg-core";

// ========== 系统表（保留不动） ==========
export const healthCheck = pgTable("health_check", {
	id: integer("id").primaryKey(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

// ========== 类脑记忆系统 ==========

/**
 * 主记忆表 - 存储所有类型的记忆
 * 
 * 记忆类型：
 * - episodic: 情景记忆（具体事件，如"上次博弈输了"）
 * - semantic: 语义记忆（知识，如"系统设计问题要先考虑架构"）
 * - procedural: 程序记忆（习惯/技能，如"遇到这类问题自动用某角度"）
 */
export const neuronMemories = pgTable(
  "neuron_memories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 记忆类型
    memoryType: varchar("memory_type", { length: 20 }).notNull(), // episodic | semantic | procedural
    
    // 所属模型角色
    role: varchar("role", { length: 32 }).notNull(), // thinker | technician | responder
    
    // 记忆内容
    content: text("content").notNull(),
    
    // 上下文标签（用于检索）
    contextTags: jsonb("context_tags").$type<string[]>(),
    
    // 关联的问题摘要（用于情景记忆）
    questionSummary: text("question_summary"),
    
    // 重要性 0-1（越高越不容易遗忘）
    importance: real("importance").default(0.5).notNull(),
    
    // 访问次数（用于记忆强化）
    accessCount: integer("access_count").default(0).notNull(),
    
    // 最后访问时间
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("memories_type_idx").on(table.memoryType),
    index("memories_role_idx").on(table.role),
    index("memories_importance_idx").on(table.importance),
  ]
);

/**
 * 博弈统计表 - 每个角色的统计数据
 */
export const gameStatistics = pgTable(
  "game_statistics",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 模型角色
    role: varchar("role", { length: 32 }).notNull().unique(),
    
    // 总博弈次数
    totalGames: integer("total_games").default(0).notNull(),
    
    // 胜利次数
    wins: integer("wins").default(0).notNull(),
    
    // 智慧加成
    wisdomBonus: real("wisdom_bonus").default(0).notNull(),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    
    // 更新时间
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("stats_role_idx").on(table.role),
  ]
);

/**
 * 学到的角度表 - 从其他模型学到的视角
 */
export const learnedAngles = pgTable(
  "learned_angles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 学习者角色
    learnerRole: varchar("learner_role", { length: 32 }).notNull(),
    
    // 教学者角色（从谁那学的）
    teacherRole: varchar("teacher_role", { length: 32 }).notNull(),
    
    // 学到的角度
    angle: text("angle").notNull(),
    
    // 掌握程度 0-1
    strength: real("strength").default(0.3).notNull(),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    
    // 更新时间
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("angles_learner_idx").on(table.learnerRole),
  ]
);

/**
 * 对话历史表 - 工作记忆（当前对话上下文）
 * 
 * 存储用户和AI的对话历史，让模型能够理解上下文
 */
export const conversationHistory = pgTable(
  "conversation_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 会话ID（用于区分不同对话）
    sessionId: varchar("session_id", { length: 36 }).notNull(),
    
    // 消息角色
    role: varchar("role", { length: 20 }).notNull(), // user | assistant
    
    // 消息内容
    content: text("content").notNull(),
    
    // 获胜模型角色（仅assistant消息有）
    winnerRole: varchar("winner_role", { length: 32 }),
    
    // 所有模型的思考（JSON格式，供回顾）
    thoughts: jsonb("thoughts").$type<Array<{ role: string; core: string; confidence: number }>>(),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("history_session_idx").on(table.sessionId),
    index("history_created_idx").on(table.createdAt),
  ]
);

/**
 * 会话摘要表 - 长期记忆（压缩的历史）
 * 
 * 当对话太长时，压缩成摘要存储
 */
export const sessionSummaries = pgTable(
  "session_summaries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 会话ID
    sessionId: varchar("session_id", { length: 36 }).notNull(),
    
    // 摘要内容
    summary: text("summary").notNull(),
    
    // 涵盖的消息范围
    messageCount: integer("message_count").default(0).notNull(),
    
    // 关键主题
    topics: jsonb("topics").$type<string[]>(),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("summaries_session_idx").on(table.sessionId),
  ]
);

// 类型导出
export type NeuronMemory = typeof neuronMemories.$inferSelect;
export type GameStatistic = typeof gameStatistics.$inferSelect;
export type LearnedAngle = typeof learnedAngles.$inferSelect;
export type ConversationMessage = typeof conversationHistory.$inferSelect;
export type SessionSummary = typeof sessionSummaries.$inferSelect;
