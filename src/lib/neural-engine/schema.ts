/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎 - 数据库表结构
 * Neural Computing Engine - Database Schema
 * 
 * 用于持久化 TensorFlow.js 神经网络状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import { pgTable, unique, uuid, varchar, integer, real, timestamp, text, jsonb, index, boolean } from "drizzle-orm/pg-core"

// ─────────────────────────────────────────────────────────────────────
// 神经网络引擎神经元表
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元表
 * 
 * 存储 TensorFlow.js 神经元的权重和状态
 */
export const neuralEngineNeurons = pgTable("neural_engine_neurons", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 用户ID（用于多用户隔离）
  userId: varchar("user_id", { length: 255 }).notNull(),
  
  // 神经元标识
  engineId: varchar("engine_id", { length: 100 }).notNull(), // 引擎内部ID
  label: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 20 }).default('semantic').notNull(), // sensory, semantic, episodic, emotional, abstract, motor, metacognitive
  level: integer().default(0).notNull(),
  
  // 权重数据（JSONB 存储数组）
  weights: jsonb().notNull(), // number[][]
  bias: jsonb().notNull(), // number[]
  predictionWeights: jsonb().notNull(), // number[][]
  sensitivityVector: jsonb("sensitivity_vector").notNull(), // number[]
  
  // 状态数据
  predictedActivation: jsonb("predicted_activation").notNull(), // number[]
  actualActivation: jsonb("actual_activation").notNull(), // number[]
  predictionError: jsonb("prediction_error").notNull(), // number[]
  
  // 学习状态
  learningRate: real("learning_rate").default(0.01).notNull(),
  accumulatedSurprise: real("accumulated_surprise").default(0).notNull(),
  totalLearningEvents: integer("total_learning_events").default(0).notNull(),
  lastLearningAt: timestamp("last_learning_at", { withTimezone: true, mode: 'string' }),
  
  // 元数据
  usefulness: real().default(0.5).notNull(),
  totalActivations: integer("total_activations").default(0).notNull(),
  
  // 创建和更新时间
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
  index("neural_engine_neurons_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  unique("neural_engine_neurons_user_engine_idx").on(table.userId, table.engineId),
  index("neural_engine_neurons_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
]);

// ─────────────────────────────────────────────────────────────────────
// VSA 概念表
// ─────────────────────────────────────────────────────────────────────

/**
 * VSA 概念表
 * 
 * 存储向量符号架构中的概念向量
 */
export const neuralEngineConcepts = pgTable("neural_engine_concepts", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 用户ID
  userId: varchar("user_id", { length: 255 }).notNull(),
  
  // 概念标识
  name: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 20 }).default('concept').notNull(), // concept, relation, composite
  
  // 向量数据
  vector: jsonb().notNull(), // number[]
  dimension: integer().default(512).notNull(),
  
  // 关联信息
  relatedConcepts: jsonb("related_concepts").default([]), // string[]
  role: varchar({ length: 20 }),
  
  // 使用统计
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
  index("neural_engine_concepts_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  unique("neural_engine_concepts_user_name_idx").on(table.userId, table.name),
]);

// ─────────────────────────────────────────────────────────────────────
// 引擎状态表
// ─────────────────────────────────────────────────────────────────────

/**
 * 引擎状态表
 * 
 * 存储引擎的全局状态和配置
 */
export const neuralEngineState = pgTable("neural_engine_state", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  
  // 用户ID
  userId: varchar("user_id", { length: 255 }).notNull(),
  
  // 配置
  vsaDimension: integer("vsa_dimension").default(512).notNull(),
  maxNeurons: integer("max_neurons").default(100).notNull(),
  learningConfig: jsonb("learning_config").notNull(),
  
  // 统计
  totalProcessing: integer("total_processing").default(0).notNull(),
  totalLearningEvents: integer("total_learning_events").default(0).notNull(),
  averagePredictionError: real("average_prediction_error").default(0).notNull(),
  totalSurprise: real("total_surprise").default(0).notNull(),
  
  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique("neural_engine_state_user_unique").on(table.userId),
]);

// ─────────────────────────────────────────────────────────────────────
// 类型导出
// ─────────────────────────────────────────────────────────────────────

export type NeuralEngineNeuron = typeof neuralEngineNeurons.$inferSelect;
export type NewNeuralEngineNeuron = typeof neuralEngineNeurons.$inferInsert;

export type NeuralEngineConcept = typeof neuralEngineConcepts.$inferSelect;
export type NewNeuralEngineConcept = typeof neuralEngineConcepts.$inferInsert;

export type NeuralEngineStateRow = typeof neuralEngineState.$inferSelect;
export type NewNeuralEngineState = typeof neuralEngineState.$inferInsert;
