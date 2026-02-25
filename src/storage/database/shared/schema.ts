import { pgTable, unique, uuid, varchar, integer, real, timestamp, text, serial, jsonb, index, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const gameStatistics = pgTable("game_statistics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	role: varchar({ length: 32 }).notNull(),
	totalGames: integer("total_games").default(0).notNull(),
	wins: integer().default(0).notNull(),
	wisdomBonus: real("wisdom_bonus").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("game_statistics_role_unique").on(table.role),
]);

export const learnedAngles = pgTable("learned_angles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	learnerRole: varchar("learner_role", { length: 32 }).notNull(),
	teacherRole: varchar("teacher_role", { length: 32 }).notNull(),
	angle: text().notNull(),
	strength: real().default(0.3).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const neuronMemories = pgTable("neuron_memories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memoryType: varchar("memory_type", { length: 20 }).notNull(),
	role: varchar({ length: 32 }).notNull(),
	content: text().notNull(),
	contextTags: jsonb("context_tags"),
	questionSummary: text("question_summary"),
	importance: real().default(0.5).notNull(),
	accessCount: integer("access_count").default(0).notNull(),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const conversationHistory = pgTable("conversation_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: varchar("session_id", { length: 36 }).notNull(),
	role: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	winnerRole: varchar("winner_role", { length: 32 }),
	thoughts: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const sessionSummaries = pgTable("session_summaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: varchar("session_id", { length: 36 }).notNull(),
	summary: text().notNull(),
	messageCount: integer("message_count").default(0).notNull(),
	topics: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const memoryDoors = pgTable("memory_doors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	meaning: text().notNull(),
	meaningVector: jsonb("meaning_vector").notNull(),
	lockComplexity: real("lock_complexity").default(0.5).notNull(),
	lockPattern: jsonb("lock_pattern").notNull(),
	doorType: varchar("door_type", { length: 32 }).notNull(),
	emotionalCharge: real("emotional_charge").default(0),
	accessCount: integer("access_count").default(0).notNull(),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }),
	createdBy: varchar("created_by", { length: 32 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("doors_access_idx").using("btree", table.accessCount.asc().nullsLast().op("int4_ops")),
	index("doors_creator_idx").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("doors_type_idx").using("btree", table.doorType.asc().nullsLast().op("text_ops")),
]);

export const neuralKeys = pgTable("neural_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	holderRole: varchar("holder_role", { length: 32 }).notNull(),
	teethPattern: jsonb("teeth_pattern").notNull(),
	strength: real().default(0.5).notNull(),
	targetDoorId: uuid("target_door_id").notNull(),
	rustLevel: real("rust_level").default(0).notNull(),
	useCount: integer("use_count").default(0).notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	forgedAt: timestamp("forged_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("keys_door_idx").using("btree", table.targetDoorId.asc().nullsLast().op("uuid_ops")),
	index("keys_holder_idx").using("btree", table.holderRole.asc().nullsLast().op("text_ops")),
	index("keys_strength_idx").using("btree", table.strength.asc().nullsLast().op("float4_ops")),
]);

export const activationHistory = pgTable("activation_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	neuronId: uuid("neuron_id").notNull(),
	activationValue: real("activation_value").notNull(),
	source: varchar({ length: 20 }).notNull(),
	triggeredBy: jsonb("triggered_by"),
	influenceId: uuid("influence_id"),
	sessionId: varchar("session_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activation_neuron_idx").using("btree", table.neuronId.asc().nullsLast().op("uuid_ops")),
	index("activation_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const connectionStrengthHistory = pgTable("connection_strength_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	connectionId: uuid("connection_id").notNull(),
	previousStrength: real("previous_strength").notNull(),
	newStrength: real("new_strength").notNull(),
	reason: varchar({ length: 50 }).notNull(),
	fromActivation: real("from_activation"),
	toActivation: real("to_activation"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("strength_history_connection_idx").using("btree", table.connectionId.asc().nullsLast().op("uuid_ops")),
	index("strength_history_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const connections = pgTable("connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fromNeuronId: uuid("from_neuron_id").notNull(),
	toNeuronId: uuid("to_neuron_id").notNull(),
	strength: real().default(0.5).notNull(),
	strengthTrend: varchar("strength_trend", { length: 15 }).default('stable'),
	connectionType: varchar("connection_type", { length: 15 }).default('excitatory').notNull(),
	delay: integer().default(0).notNull(),
	efficiency: real().default(1).notNull(),
	plasticity: real().default(0.5).notNull(),
	hebbianLearningRate: real("hebbian_learning_rate").default(0.1).notNull(),
	hebbianDecayRate: real("hebbian_decay_rate").default(0.01).notNull(),
	stdpEnabled: boolean("stdp_enabled").default(true).notNull(),
	totalActivations: integer("total_activations").default(0).notNull(),
	averageActivationStrength: real("average_activation_strength").default(0).notNull(),
	usefulness: real().default(0.5).notNull(),
	reliability: real().default(0.5).notNull(),
	lastActivatedAt: timestamp("last_activated_at", { withTimezone: true, mode: 'string' }),
	source: varchar({ length: 20 }).default('created').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("connections_from_idx").using("btree", table.fromNeuronId.asc().nullsLast().op("uuid_ops")),
	index("connections_strength_idx").using("btree", table.strength.asc().nullsLast().op("float4_ops")),
	index("connections_to_idx").using("btree", table.toNeuronId.asc().nullsLast().op("uuid_ops")),
]);

export const influenceRecords = pgTable("influence_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	influenceType: varchar("influence_type", { length: 15 }).notNull(),
	intensity: real().notNull(),
	scope: varchar({ length: 15 }).notNull(),
	targetNeurons: jsonb("target_neurons"),
	pattern: jsonb().notNull(),
	patternLabel: varchar("pattern_label", { length: 100 }),
	source: varchar({ length: 15 }).notNull(),
	sourceId: varchar("source_id", { length: 100 }),
	originalSignal: jsonb("original_signal"),
	processed: boolean().default(false).notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	sessionId: varchar("session_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("influence_records_processed_idx").using("btree", table.processed.asc().nullsLast().op("bool_ops")),
	index("influence_records_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("influence_records_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const metaInterventions = pgTable("meta_interventions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interventionType: varchar("intervention_type", { length: 20 }).notNull(),
	targetNeurons: jsonb("target_neurons"),
	influencePattern: jsonb("influence_pattern").notNull(),
	influenceIntensity: real("influence_intensity").notNull(),
	reason: text().notNull(),
	expectedEffect: text().notNull(),
	actualEffect: text(),
	success: boolean().default(true),
	observationId: uuid("observation_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("meta_interventions_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("meta_interventions_type_idx").using("btree", table.interventionType.asc().nullsLast().op("text_ops")),
]);

export const metaObservations = pgTable("meta_observations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	insights: jsonb().notNull(),
	patterns: jsonb().notNull(),
	anomalies: jsonb().notNull(),
	attentionFocus: jsonb("attention_focus").notNull(),
	systemStateId: uuid("system_state_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("meta_observations_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const neurons = pgTable("neurons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	label: varchar({ length: 255 }),
	labelSource: varchar("label_source", { length: 20 }),
	functionalRole: varchar("functional_role", { length: 20 }).default('latent').notNull(),
	emergentLayer: varchar("emergent_layer", { length: 20 }),
	sensitivityVector: jsonb("sensitivity_vector").notNull(),
	sensitivityDimension: integer("sensitivity_dimension").default(768).notNull(),
	sensitivityPlasticity: real("sensitivity_plasticity").default(0.5).notNull(),
	activation: real().default(0).notNull(),
	activationTrend: varchar("activation_trend", { length: 10 }).default('stable'),
	refractoryPeriod: integer("refractory_period").default(100).notNull(),
	lastActivatedAt: timestamp("last_activated_at", { withTimezone: true, mode: 'string' }),
	totalActivations: integer("total_activations").default(0).notNull(),
	averageActivation: real("average_activation").default(0).notNull(),
	connectionChanges: integer("connection_changes").default(0).notNull(),
	usefulness: real().default(0.5).notNull(),
	source: varchar({ length: 20 }).default('created').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("neurons_activation_idx").using("btree", table.activation.asc().nullsLast().op("float4_ops")),
	index("neurons_layer_idx").using("btree", table.emergentLayer.asc().nullsLast().op("text_ops")),
	index("neurons_role_idx").using("btree", table.functionalRole.asc().nullsLast().op("text_ops")),
]);

export const selfModel = pgTable("self_model", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	coreTraits: jsonb("core_traits").notNull(),
	values: jsonb().notNull(),
	beliefs: jsonb().notNull(),
	strengths: jsonb().notNull(),
	limitations: jsonb().notNull(),
	growthAreas: jsonb("growth_areas").notNull(),
	significantEvents: jsonb("significant_events").notNull(),
	learnedLessons: jsonb("learned_lessons").notNull(),
	recurringPatterns: jsonb("recurring_patterns").notNull(),
	shortTermAspirations: jsonb("short_term_aspirations").notNull(),
	longTermAspirations: jsonb("long_term_aspirations").notNull(),
	aspirationValues: jsonb("aspiration_values").notNull(),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

export const selfNarratives = pgTable("self_narratives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	summary: text().notNull(),
	emotion: varchar({ length: 30 }).notNull(),
	themes: jsonb().notNull(),
	currentChapter: varchar("current_chapter", { length: 50 }).notNull(),
	trajectory: varchar({ length: 15 }).notNull(),
	observationId: uuid("observation_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("self_narratives_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const systemStates = pgTable("system_states", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	neuronCount: integer("neuron_count").default(0).notNull(),
	connectionCount: integer("connection_count").default(0).notNull(),
	globalActivationLevel: real("global_activation_level").default(0).notNull(),
	activationMean: real("activation_mean").default(0).notNull(),
	activationVariance: real("activation_variance").default(0).notNull(),
	activationMax: real("activation_max").default(0).notNull(),
	activationMin: real("activation_min").default(0).notNull(),
	entropy: real().default(0).notNull(),
	coherence: real().default(0).notNull(),
	vitality: real().default(0).notNull(),
	selfCoherence: real("self_coherence").default(0).notNull(),
	selfVitality: real("self_vitality").default(0).notNull(),
	selfGrowth: real("self_growth").default(0).notNull(),
	dominantEmotion: varchar("dominant_emotion", { length: 30 }),
	emotionIntensity: real("emotion_intensity").default(0),
	averageDegree: real("average_degree").default(0).notNull(),
	clusteringCoefficient: real("clustering_coefficient").default(0).notNull(),
	evolutionStep: integer("evolution_step").default(0).notNull(),
	sessionId: varchar("session_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("system_states_time_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);
