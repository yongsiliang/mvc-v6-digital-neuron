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

// ========== 意义记忆系统 ==========

/**
 * 意义记忆表 - 存储"意义向量"而非原始数据
 * 
 * 核心理念：
 * - 记忆不是存储，而是意义
 * - 意义是高维向量，能与其他记忆共鸣
 * - 记忆主动影响认知，而非被动检索
 */
export const meaningMemories = pgTable(
  "meaning_memories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 意义向量（高维语义表示）
    meaningVector: jsonb("meaning_vector").$type<number[]>().notNull(),
    
    // 向量维度
    vectorDimension: integer("vector_dimension").default(1024).notNull(),
    
    // 原始内容（用于展示）
    rawContent: text("raw_content").notNull(),
    
    // 意义摘要（模型提取的"核心意义"）
    meaningSummary: text("meaning_summary").notNull(),
    
    // 所属模型角色
    role: varchar("role", { length: 32 }).notNull(),
    
    // 意义类型
    meaningType: varchar("meaning_type", { length: 32 }).notNull(), 
    // insight: 洞察 | pattern: 模式 | strategy: 策略 | emotion: 情感 | concept: 概念
    
    // 激活强度（当前激活程度，会随时间衰减）
    activationLevel: real("activation_level").default(0.5).notNull(),
    
    // 共鸣次数（被激活的次数，代表重要性）
    resonanceCount: integer("resonance_count").default(0).notNull(),
    
    // 关联记忆ID列表（形成意义网络）
    connectedMemoryIds: jsonb("connected_memory_ids").$type<string[]>().default([]),
    
    // 情感权重（-1到1，负面到正面）
    emotionalWeight: real("emotional_weight").default(0),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    
    // 最后激活时间
    lastActivatedAt: timestamp("last_activated_at", { withTimezone: true }),
  },
  (table) => [
    index("meaning_role_idx").on(table.role),
    index("meaning_type_idx").on(table.meaningType),
    index("meaning_activation_idx").on(table.activationLevel),
    index("meaning_resonance_idx").on(table.resonanceCount),
  ]
);

/**
 * 意义关联表 - 存储记忆之间的连接强度
 * 
 * 记忆之间不是孤立的，而是形成网络
 * 相似的记忆会形成强连接，互相激活
 */
export const meaningConnections = pgTable(
  "meaning_connections",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 源记忆
    sourceMemoryId: uuid("source_memory_id").notNull(),
    
    // 目标记忆
    targetMemoryId: uuid("target_memory_id").notNull(),
    
    // 连接强度（0-1，基于意义相似度）
    connectionStrength: real("connection_strength").default(0.5).notNull(),
    
    // 连接类型
    connectionType: varchar("connection_type", { length: 32 }).notNull(),
    // similar: 相似 | complementary: 互补 | causal: 因果 | contrastive: 对比
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("connection_source_idx").on(table.sourceMemoryId),
    index("connection_target_idx").on(table.targetMemoryId),
    index("connection_strength_idx").on(table.connectionStrength),
  ]
);

/**
 * 激活记录表 - 记录每次激活事件
 * 
 * 用于分析记忆的使用模式，优化激活策略
 */
export const activationRecords = pgTable(
  "activation_records",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // 触发源（什么触发了激活）
    triggerSource: varchar("trigger_source", { length: 32 }).notNull(),
    // input: 用户输入 | resonance: 共鸣激活 | reflection: 反思激活
    
    // 触发内容
    triggerContent: text("trigger_content"),
    
    // 被激活的记忆ID
    activatedMemoryId: uuid("activated_memory_id").notNull(),
    
    // 激活强度
    activationStrength: real("activation_strength").notNull(),
    
    // 是否影响了决策
    influencedDecision: integer("influenced_decision").default(0),
    
    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activation_trigger_idx").on(table.triggerSource),
    index("activation_memory_idx").on(table.activatedMemoryId),
    index("activation_created_idx").on(table.createdAt),
  ]
);

// ========== 类脑记忆系统（兼容旧系统） ==========

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

// 意义记忆类型导出
export type MeaningMemory = typeof meaningMemories.$inferSelect;
export type MeaningConnection = typeof meaningConnections.$inferSelect;
export type ActivationRecord = typeof activationRecords.$inferSelect;

// 意义类型枚举
export type MeaningType = 'insight' | 'pattern' | 'strategy' | 'emotion' | 'concept';
export type ConnectionType = 'similar' | 'complementary' | 'causal' | 'contrastive';
export type TriggerSource = 'input' | 'resonance' | 'reflection';
