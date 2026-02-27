/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 记忆数据库服务
 * V6 Memory Database Service
 * 
 * 提供分层记忆的数据库持久化：
 * - 核心记忆（不可变）
 * - 巩固记忆（长期）
 * - 情景记忆（短期，可衰减）
 * ═══════════════════════════════════════════════════════════════════════
 */

import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { db } from './index';
import {
  v6CoreSummary,
  v6CoreRelationships,
  v6EpisodicMemories,
  v6ConsolidatedMemories,
  v6ConsciousnessSnapshots,
  v6PerformanceMetrics,
  v6EmotionExperiences,
} from './database/shared/schema';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

export interface CoreSummaryData {
  creatorName?: string;
  creatorDescription?: string;
  identityName: string;
  identityPurpose?: string;
  identityTraits: string[];
  identitySelfDefinition?: string;
  coreValues: string[];
  corePreferences: string[];
}

export interface CoreRelationshipData {
  personName: string;
  relationshipType: string;
  importance: number;
  keyInteractions?: string[];
  notes?: string;
}

export interface EpisodicMemoryData {
  content: string;
  importance: number;
  tags: string[];
  sourceType: string;
  consolidationCandidate: boolean;
}

export interface ConsolidatedMemoryData {
  content: string;
  type: 'wisdom' | 'preference' | 'fact' | 'skill';
  importance: number;
  tags: string[];
  sourceEpisodes?: string[];
  relatedEntities?: string[];
  emotionalMarker?: string;
}

export interface PerformanceMetricData {
  metricType: string;
  metricName: string;
  value: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 核心层服务
// ═══════════════════════════════════════════════════════════════════════

/**
 * 保存核心摘要
 */
export async function saveCoreSummary(data: CoreSummaryData): Promise<{ success: boolean; id?: string }> {
  try {
    const [result] = await db.insert(v6CoreSummary).values({
      creatorName: data.creatorName,
      creatorDescription: data.creatorDescription,
      identityName: data.identityName,
      identityPurpose: data.identityPurpose,
      identityTraits: data.identityTraits,
      identitySelfDefinition: data.identitySelfDefinition,
      coreValues: data.coreValues,
      corePreferences: data.corePreferences,
    }).returning({ id: v6CoreSummary.id });
    
    console.log(`[V6 DB] 核心摘要已保存: ${result.id}`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[V6 DB] 保存核心摘要失败:', error);
    return { success: false };
  }
}

/**
 * 获取最新的核心摘要
 */
export async function getLatestCoreSummary(): Promise<CoreSummaryData | null> {
  try {
    const results = await db
      .select()
      .from(v6CoreSummary)
      .orderBy(desc(v6CoreSummary.version))
      .limit(1);
    
    if (results.length === 0) return null;
    
    const row = results[0];
    return {
      creatorName: row.creatorName || undefined,
      creatorDescription: row.creatorDescription || undefined,
      identityName: row.identityName,
      identityPurpose: row.identityPurpose || undefined,
      identityTraits: row.identityTraits as string[],
      identitySelfDefinition: row.identitySelfDefinition || undefined,
      coreValues: row.coreValues as string[],
      corePreferences: row.corePreferences as string[],
    };
  } catch (error) {
    console.error('[V6 DB] 获取核心摘要失败:', error);
    return null;
  }
}

/**
 * 添加核心关系
 */
export async function addCoreRelationship(data: CoreRelationshipData): Promise<{ success: boolean; id?: string }> {
  try {
    // 检查是否已存在
    const existing = await db
      .select()
      .from(v6CoreRelationships)
      .where(eq(v6CoreRelationships.personName, data.personName))
      .limit(1);
    
    if (existing.length > 0) {
      // 更新现有关系
      const [result] = await db
        .update(v6CoreRelationships)
        .set({
          relationshipType: data.relationshipType,
          importance: Math.max(existing[0].importance, data.importance),
          keyInteractions: data.keyInteractions,
          notes: data.notes,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(v6CoreRelationships.id, existing[0].id))
        .returning({ id: v6CoreRelationships.id });
      
      return { success: true, id: result.id };
    }
    
    // 创建新关系
    const [result] = await db.insert(v6CoreRelationships).values({
      personName: data.personName,
      relationshipType: data.relationshipType,
      importance: data.importance,
      keyInteractions: data.keyInteractions || [],
      notes: data.notes,
    }).returning({ id: v6CoreRelationships.id });
    
    console.log(`[V6 DB] 核心关系已添加: ${data.personName}`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[V6 DB] 添加核心关系失败:', error);
    return { success: false };
  }
}

/**
 * 获取所有核心关系
 */
export async function getCoreRelationships(): Promise<CoreRelationshipData[]> {
  try {
    const results = await db
      .select()
      .from(v6CoreRelationships)
      .orderBy(desc(v6CoreRelationships.importance));
    
    return results.map(row => ({
      personName: row.personName,
      relationshipType: row.relationshipType,
      importance: row.importance,
      keyInteractions: row.keyInteractions as string[] | undefined,
      notes: row.notes || undefined,
    }));
  } catch (error) {
    console.error('[V6 DB] 获取核心关系失败:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 情景记忆服务
// ═══════════════════════════════════════════════════════════════════════

/**
 * 添加情景记忆
 */
export async function addEpisodicMemory(data: EpisodicMemoryData): Promise<{ success: boolean; id?: string }> {
  try {
    const [result] = await db.insert(v6EpisodicMemories).values({
      content: data.content,
      importance: data.importance,
      tags: data.tags,
      sourceType: data.sourceType,
      consolidationCandidate: data.consolidationCandidate,
    }).returning({ id: v6EpisodicMemories.id });
    
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[V6 DB] 添加情景记忆失败:', error);
    return { success: false };
  }
}

/**
 * 检索情景记忆
 */
export async function searchEpisodicMemories(
  query: string,
  options: { limit?: number; minImportance?: number } = {}
): Promise<Array<{ id: string; content: string; importance: number; tags: string[] }>> {
  try {
    const limit = options.limit || 10;
    const minImportance = options.minImportance || 0;
    
    // 简单的文本搜索
    const results = await db
      .select()
      .from(v6EpisodicMemories)
      .where(
        and(
          gte(v6EpisodicMemories.importance, minImportance),
          sql`${v6EpisodicMemories.content} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(v6EpisodicMemories.importance))
      .limit(limit);
    
    return results.map(row => ({
      id: row.id,
      content: row.content,
      importance: row.importance,
      tags: row.tags as string[],
    }));
  } catch (error) {
    console.error('[V6 DB] 检索情景记忆失败:', error);
    return [];
  }
}

/**
 * 获取需要巩固的情景记忆
 */
export async function getConsolidationCandidates(limit: number = 10): Promise<Array<{
  id: string;
  content: string;
  importance: number;
  recallCount: number;
}>> {
  try {
    const results = await db
      .select()
      .from(v6EpisodicMemories)
      .where(
        and(
          eq(v6EpisodicMemories.consolidationCandidate, true),
          gte(v6EpisodicMemories.recallCount, 3)
        )
      )
      .orderBy(desc(v6EpisodicMemories.recallCount))
      .limit(limit);
    
    return results.map(row => ({
      id: row.id,
      content: row.content,
      importance: row.importance,
      recallCount: row.recallCount,
    }));
  } catch (error) {
    console.error('[V6 DB] 获取巩固候选失败:', error);
    return [];
  }
}

/**
 * 更新情景记忆回忆计数
 */
export async function incrementRecallCount(memoryId: string): Promise<void> {
  try {
    await db
      .update(v6EpisodicMemories)
      .set({
        recallCount: sql`${v6EpisodicMemories.recallCount} + 1`,
        lastRecalledAt: new Date().toISOString(),
      })
      .where(eq(v6EpisodicMemories.id, memoryId));
  } catch (error) {
    console.error('[V6 DB] 更新回忆计数失败:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 巩固记忆服务
// ═══════════════════════════════════════════════════════════════════════

/**
 * 添加巩固记忆
 */
export async function addConsolidatedMemory(data: ConsolidatedMemoryData): Promise<{ success: boolean; id?: string }> {
  try {
    const [result] = await db.insert(v6ConsolidatedMemories).values({
      content: data.content,
      type: data.type,
      importance: data.importance,
      tags: data.tags,
      sourceEpisodes: data.sourceEpisodes || [],
      relatedEntities: data.relatedEntities || [],
      emotionalMarker: data.emotionalMarker,
    }).returning({ id: v6ConsolidatedMemories.id });
    
    console.log(`[V6 DB] 巩固记忆已添加: ${data.content.slice(0, 30)}...`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[V6 DB] 添加巩固记忆失败:', error);
    return { success: false };
  }
}

/**
 * 检索巩固记忆
 */
export async function searchConsolidatedMemories(
  query: string,
  options: { limit?: number; type?: string } = {}
): Promise<Array<{
  id: string;
  content: string;
  type: string;
  importance: number;
}>> {
  try {
    const limit = options.limit || 10;
    
    let queryBuilder = db
      .select()
      .from(v6ConsolidatedMemories)
      .where(sql`${v6ConsolidatedMemories.content} ILIKE ${`%${query}%`}`);
    
    if (options.type) {
      queryBuilder = db
        .select()
        .from(v6ConsolidatedMemories)
        .where(
          and(
            eq(v6ConsolidatedMemories.type, options.type),
            sql`${v6ConsolidatedMemories.content} ILIKE ${`%${query}%`}`
          )
        );
    }
    
    const results = await queryBuilder
      .orderBy(desc(v6ConsolidatedMemories.importance))
      .limit(limit);
    
    return results.map(row => ({
      id: row.id,
      content: row.content,
      type: row.type,
      importance: row.importance,
    }));
  } catch (error) {
    console.error('[V6 DB] 检索巩固记忆失败:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 意识状态快照服务
// ═══════════════════════════════════════════════════════════════════════

/**
 * 保存意识状态快照
 */
export async function saveConsciousnessSnapshot(data: {
  version: number;
  identity: Record<string, unknown>;
  layeredMemory: Record<string, unknown>;
  emotionState?: Record<string, unknown>;
  metacognitionState?: Record<string, unknown>;
  fullState?: Record<string, unknown>;
}): Promise<{ success: boolean; id?: string }> {
  try {
    const [result] = await db.insert(v6ConsciousnessSnapshots).values({
      version: data.version,
      identity: data.identity,
      layeredMemory: data.layeredMemory,
      emotionState: data.emotionState,
      metacognitionState: data.metacognitionState,
      fullState: data.fullState,
    }).returning({ id: v6ConsciousnessSnapshots.id });
    
    console.log(`[V6 DB] 意识快照已保存: V${data.version}`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[V6 DB] 保存意识快照失败:', error);
    return { success: false };
  }
}

/**
 * 获取最新的意识状态快照
 */
export async function getLatestSnapshot(): Promise<{
  version: number;
  identity: Record<string, unknown>;
  layeredMemory: Record<string, unknown>;
  emotionState?: Record<string, unknown>;
  metacognitionState?: Record<string, unknown>;
} | null> {
  try {
    const results = await db
      .select()
      .from(v6ConsciousnessSnapshots)
      .orderBy(desc(v6ConsciousnessSnapshots.version))
      .limit(1);
    
    if (results.length === 0) return null;
    
    const row = results[0];
    return {
      version: row.version,
      identity: row.identity as Record<string, unknown>,
      layeredMemory: row.layeredMemory as Record<string, unknown>,
      emotionState: row.emotionState as Record<string, unknown> | undefined,
      metacognitionState: row.metacognitionState as Record<string, unknown> | undefined,
    };
  } catch (error) {
    console.error('[V6 DB] 获取意识快照失败:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 性能监控服务
// ═══════════════════════════════════════════════════════════════════════

/**
 * 记录性能指标
 */
export async function recordPerformanceMetric(data: PerformanceMetricData): Promise<void> {
  try {
    await db.insert(v6PerformanceMetrics).values({
      metricType: data.metricType,
      metricName: data.metricName,
      value: data.value,
      unit: data.unit,
      metadata: data.metadata || {},
      sessionId: data.sessionId,
    });
  } catch (error) {
    console.error('[V6 DB] 记录性能指标失败:', error);
  }
}

/**
 * 获取性能指标统计
 */
export async function getPerformanceStats(
  metricType: string,
  options: { hours?: number } = {}
): Promise<{
  count: number;
  avg: number;
  min: number;
  max: number;
}> {
  try {
    const hours = options.hours || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const results = await db
      .select({
        count: sql<number>`count(*)`,
        avg: sql<number>`avg(${v6PerformanceMetrics.value})`,
        min: sql<number>`min(${v6PerformanceMetrics.value})`,
        max: sql<number>`max(${v6PerformanceMetrics.value})`,
      })
      .from(v6PerformanceMetrics)
      .where(
        and(
          eq(v6PerformanceMetrics.metricType, metricType),
          gte(v6PerformanceMetrics.createdAt, since)
        )
      );
    
    if (results.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }
    
    const row = results[0];
    return {
      count: Number(row.count) || 0,
      avg: Number(row.avg) || 0,
      min: Number(row.min) || 0,
      max: Number(row.max) || 0,
    };
  } catch (error) {
    console.error('[V6 DB] 获取性能统计失败:', error);
    return { count: 0, avg: 0, min: 0, max: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 情感记录服务
// ═══════════════════════════════════════════════════════════════════════

/**
 * 记录情感体验
 */
export async function recordEmotionExperience(data: {
  emotion: string;
  intensity: number;
  valence?: number;
  arousal?: number;
  triggerType?: string;
  triggerDescription?: string;
  labels?: string[];
}): Promise<void> {
  try {
    await db.insert(v6EmotionExperiences).values({
      emotion: data.emotion,
      intensity: data.intensity,
      valence: data.valence,
      arousal: data.arousal,
      triggerType: data.triggerType,
      triggerDescription: data.triggerDescription,
      labels: data.labels || [],
    });
  } catch (error) {
    console.error('[V6 DB] 记录情感体验失败:', error);
  }
}

/**
 * 获取情感历史
 */
export async function getEmotionHistory(
  options: { limit?: number; hours?: number } = {}
): Promise<Array<{
  emotion: string;
  intensity: number;
  createdAt: string;
}>> {
  try {
    const limit = options.limit || 50;
    const hours = options.hours || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const results = await db
      .select()
      .from(v6EmotionExperiences)
      .where(gte(v6EmotionExperiences.createdAt, since))
      .orderBy(desc(v6EmotionExperiences.createdAt))
      .limit(limit);
    
    return results.map(row => ({
      emotion: row.emotion,
      intensity: row.intensity,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error('[V6 DB] 获取情感历史失败:', error);
    return [];
  }
}
