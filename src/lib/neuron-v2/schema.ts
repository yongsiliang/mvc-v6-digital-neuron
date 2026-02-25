/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元系统 V2 - 数据库表结构（带用户隔离）
 * Digital Neuron System V2 - Database Schema (with User Isolation)
 * 
 * 核心设计：
 * - 每个用户有独立的神经元网络
 * - 通过userId实现数据隔离
 * - 支持跨设备、跨会话的数据同步
 * ═══════════════════════════════════════════════════════════════════════
 */

import { pgTable, unique, uuid, varchar, integer, real, timestamp, text, serial, jsonb, index, boolean } from "drizzle-orm/pg-core"

// ─────────────────────────────────────────────────────────────────────
// 用户表
// ─────────────────────────────────────────────────────────────────────

/**
 * 用户表
 * 
 * 存储用户的基本信息，用于跨设备识别
 */
export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 外部认证ID（如Clerk、Auth0等提供的ID）
  externalAuthId: varchar("external_auth_id", { length: 255 }).unique(),
  
  // 用户显示名称
  displayName: varchar("display_name", { length: 100 }),
  
  // 用户邮箱（可选）
  email: varchar({ length: 255 }).unique(),
  
  // 用户头像URL
  avatarUrl: varchar("avatar_url", { length: 500 }),
  
  // 用户偏好设置
  preferences: jsonb().default({}),
  
  // 创建时间
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  
  // 更新时间
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  
  // 最后活跃时间
  lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
  unique("users_external_auth_id_unique").on(table.externalAuthId),
  unique("users_email_unique").on(table.email),
]);

// ─────────────────────────────────────────────────────────────────────
// 神经元表（带用户隔离）
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元表 V2
 * 
 * 每个用户的神经元独立存储
 */
export const neuronsV2 = pgTable("neurons_v2", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 所属用户ID
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // 神经元标签
  label: varchar({ length: 255 }),
  labelSource: varchar("label_source", { length: 20 }),
  
  // 功能角色
  functionalRole: varchar("functional_role", { length: 20 }).default('latent').notNull(),
  emergentLayer: varchar("emergent_layer", { length: 20 }),
  
  // 敏感度向量
  sensitivityVector: jsonb("sensitivity_vector").notNull(),
  sensitivityDimension: integer("sensitivity_dimension").default(768).notNull(),
  sensitivityPlasticity: real("sensitivity_plasticity").default(0.5).notNull(),
  
  // 激活状态
  activation: real().default(0).notNull(),
  activationTrend: varchar("activation_trend", { length: 10 }).default('stable'),
  refractoryPeriod: integer("refractory_period").default(100).notNull(),
  
  // 激活历史
  lastActivatedAt: timestamp("last_activated_at", { withTimezone: true, mode: 'string' }),
  totalActivations: integer("total_activations").default(0).notNull(),
  averageActivation: real("average_activation").default(0).notNull(),
  
  // 统计信息
  connectionChanges: integer("connection_changes").default(0).notNull(),
  usefulness: real().default(0.5).notNull(),
  
  // 来源
  source: varchar({ length: 20 }).default('created').notNull(),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
  index("neurons_v2_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  index("neurons_v2_activation_idx").using("btree", table.activation.asc().nullsLast().op("float4_ops")),
  index("neurons_v2_layer_idx").using("btree", table.emergentLayer.asc().nullsLast().op("text_ops")),
  index("neurons_v2_role_idx").using("btree", table.functionalRole.asc().nullsLast().op("text_ops")),
]);

// ─────────────────────────────────────────────────────────────────────
// 连接表（带用户隔离）
// ─────────────────────────────────────────────────────────────────────

/**
 * 连接表 V2
 * 
 * 神经元之间的连接，每个用户独立
 */
export const connectionsV2 = pgTable("connections_v2", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 所属用户ID
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // 连接的神经元
  from: uuid("from_neuron").notNull().references(() => neuronsV2.id, { onDelete: 'cascade' }),
  to: uuid("to_neuron").notNull().references(() => neuronsV2.id, { onDelete: 'cascade' }),
  
  // 连接类型
  type: varchar({ length: 20 }).default('excitatory').notNull(),
  
  // 连接强度
  strength: real().default(0.5).notNull(),
  plasticity: real().default(0.5).notNull(),
  
  // 传播特性
  delay: real().default(0).notNull(),
  efficiency: real().default(1).notNull(),
  
  // Hebbian学习参数
  hebbianLearningRate: real("hebbian_learning_rate").default(0.1),
  hebbianDecayRate: real("hebbian_decay_rate").default(0.01),
  
  // 激活历史
  lastActivatedAt: timestamp("last_activated_at", { withTimezone: true, mode: 'string' }),
  totalActivations: integer("total_activations").default(0).notNull(),
  averageActivationStrength: real("average_activation_strength").default(0).notNull(),
  
  // 来源
  source: varchar({ length: 20 }).default('created').notNull(),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("connections_v2_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  index("connections_v2_from_idx").using("btree", table.from.asc().nullsLast().op("uuid_ops")),
  index("connections_v2_to_idx").using("btree", table.to.asc().nullsLast().op("uuid_ops")),
  index("connections_v2_strength_idx").using("btree", table.strength.asc().nullsLast().op("float4_ops")),
]);

// ─────────────────────────────────────────────────────────────────────
// 记忆表（带用户隔离）
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆表 V2
 * 
 * 用户的长期记忆
 */
export const memoriesV2 = pgTable("memories_v2", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 所属用户ID
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // 记忆内容
  content: text().notNull(),
  
  // 记忆类型
  type: varchar({ length: 20 }).notNull(), // episodic, semantic, procedural, emotional
  
  // 重要性 [0, 1]
  importance: real().default(0.5).notNull(),
  
  // 情绪属性
  emotionalIntensity: real("emotional_intensity").default(0).notNull(),
  emotionalValence: real("emotional_valence").default(0).notNull(), // [-1, 1]
  
  // 记忆强度
  strength: real().default(1).notNull(),
  
  // 是否已巩固
  consolidated: boolean().default(false).notNull(),
  
  // 相关神经元和连接
  relatedNeurons: jsonb("related_neurons").default([]).notNull(),
  relatedConnections: jsonb("related_connections").default([]).notNull(),
  
  // 标签
  tags: jsonb().default([]).notNull(),
  
  // 回忆统计
  recallCount: integer("recall_count").default(0).notNull(),
  lastRecalledAt: timestamp("last_recalled_at", { withTimezone: true, mode: 'string' }),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
  index("memories_v2_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  index("memories_v2_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
  index("memories_v2_importance_idx").using("btree", table.importance.asc().nullsLast().op("float4_ops")),
  index("memories_v2_strength_idx").using("btree", table.strength.asc().nullsLast().op("float4_ops")),
]);

// ─────────────────────────────────────────────────────────────────────
// 自我模型表（带用户隔离）
// ─────────────────────────────────────────────────────────────────────

/**
 * 自我模型表 V2
 * 
 * 存储用户数字大脑的自我认知
 */
export const selfModelsV2 = pgTable("self_models_v2", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 所属用户ID
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  
  // 核心特质
  coreTraits: jsonb("core_traits").notNull(),
  
  // 价值观
  values: jsonb().notNull(),
  
  // 信念
  beliefs: jsonb().notNull(),
  
  // 优势
  strengths: jsonb().notNull(),
  
  // 局限
  limitations: jsonb().notNull(),
  
  // 成长领域
  growthAreas: jsonb("growth_areas").notNull(),
  
  // 重大事件
  significantEvents: jsonb("significant_events").notNull(),
  
  // 学到的教训
  learnedLessons: jsonb("learned_lessons").notNull(),
  
  // 模式
  recurringPatterns: jsonb("recurring_patterns").notNull(),
  
  // 短期目标
  shortTermAspirations: jsonb("short_term_aspirations").notNull(),
  
  // 长期目标
  longTermAspirations: jsonb("long_term_aspirations").notNull(),
  
  // 版本
  version: integer().default(1).notNull(),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
  index("self_models_v2_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

// ─────────────────────────────────────────────────────────────────────
// 系统状态表（带用户隔离）
// ─────────────────────────────────────────────────────────────────────

/**
 * 系统状态表 V2
 * 
 * 存储用户数字大脑的整体状态快照
 */
export const systemStatesV2 = pgTable("system_states_v2", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 所属用户ID
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // 会话ID
  sessionId: varchar("session_id", { length: 36 }),
  
  // 网络统计
  neuronCount: integer("neuron_count").default(0).notNull(),
  connectionCount: integer("connection_count").default(0).notNull(),
  globalActivationLevel: real("global_activation_level").default(0).notNull(),
  
  // 激活分布
  activationMean: real("activation_mean").default(0).notNull(),
  activationVariance: real("activation_variance").default(0).notNull(),
  activationMax: real("activation_max").default(0).notNull(),
  activationMin: real("activation_min").default(0).notNull(),
  
  // 意识指标
  entropy: real().default(0).notNull(),
  coherence: real().default(0).notNull(),
  vitality: real().default(0).notNull(),
  
  // 自我指标
  selfCoherence: real("self_coherence").default(0).notNull(),
  selfVitality: real("self_vitality").default(0).notNull(),
  selfGrowth: real("self_growth").default(0).notNull(),
  
  // 情绪状态
  dominantEmotion: varchar("dominant_emotion", { length: 30 }),
  emotionIntensity: real("emotion_intensity").default(0),
  
  // 拓扑指标
  averageDegree: real("average_degree").default(0).notNull(),
  clusteringCoefficient: real("clustering_coefficient").default(0).notNull(),
  
  // 演化步数
  evolutionStep: integer("evolution_step").default(0).notNull(),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("system_states_v2_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  index("system_states_v2_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

// ─────────────────────────────────────────────────────────────────────
// 类型导出
// ─────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type NeuronV2 = typeof neuronsV2.$inferSelect;
export type NewNeuronV2 = typeof neuronsV2.$inferInsert;

export type ConnectionV2 = typeof connectionsV2.$inferSelect;
export type NewConnectionV2 = typeof connectionsV2.$inferInsert;

export type MemoryV2 = typeof memoriesV2.$inferSelect;
export type NewMemoryV2 = typeof memoriesV2.$inferInsert;

export type SelfModelV2 = typeof selfModelsV2.$inferSelect;
export type NewSelfModelV2 = typeof selfModelsV2.$inferInsert;

export type SystemStateV2 = typeof systemStatesV2.$inferSelect;
export type NewSystemStateV2 = typeof systemStatesV2.$inferInsert;
