/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数据库操作：神经元数据的持久化
 * Database Operations: Persistence of Neuron Data
 * 
 * 核心功能：
 * - 提供PersistenceManager所需的数据库接口
 * - 实现CRUD操作
 * ═══════════════════════════════════════════════════════════════════════
 */

import { db } from '@/storage';
import { neuronsV2, connectionsV2, memoriesV2, selfModelsV2, users } from '@/storage';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { UserId, SavedNeuron, SavedConnection, SavedMemory } from './persistence';

// ─────────────────────────────────────────────────────────────────────
// 用户操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建或获取用户
 * 
 * @param externalAuthId 外部认证ID（如Clerk提供的ID）
 * @returns 用户ID
 */
export async function getOrCreateUser(externalAuthId: string): Promise<UserId> {
  // 查找现有用户
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.externalAuthId, externalAuthId))
    .limit(1);

  if (existing.length > 0) {
    // 更新最后活跃时间
    await db
      .update(users)
      .set({ lastActiveAt: new Date().toISOString() })
      .where(eq(users.id, existing[0].id));
    
    return existing[0].id;
  }

  // 创建新用户
  const [newUser] = await db
    .insert(users)
    .values({
      externalAuthId,
      lastActiveAt: new Date().toISOString(),
    })
    .returning();

  return newUser.id;
}

/**
 * 根据外部认证ID获取用户
 */
export async function getUserByExternalId(externalAuthId: string): Promise<UserId | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.externalAuthId, externalAuthId))
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}

// ─────────────────────────────────────────────────────────────────────
// 神经元操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存神经元
 */
export async function saveNeuron(userId: UserId, neuron: SavedNeuron): Promise<void> {
  await db
    .insert(neuronsV2)
    .values({
      id: neuron.id,
      userId,
      label: neuron.label,
      labelSource: neuron.labelSource,
      functionalRole: neuron.functionalRole,
      emergentLayer: neuron.emergentLayer,
      sensitivityVector: neuron.sensitivityVector,
      sensitivityDimension: neuron.sensitivityDimension,
      sensitivityPlasticity: neuron.sensitivityPlasticity,
      activation: neuron.activation,
      activationTrend: neuron.activationTrend,
      refractoryPeriod: neuron.refractoryPeriod,
      lastActivatedAt: neuron.lastActivatedAt,
      totalActivations: neuron.totalActivations,
      averageActivation: neuron.averageActivation,
      connectionChanges: neuron.connectionChanges,
      usefulness: neuron.usefulness,
      source: neuron.source,
      createdAt: neuron.createdAt,
      updatedAt: neuron.updatedAt,
    })
    .onConflictDoUpdate({
      target: neuronsV2.id,
      set: {
        activation: neuron.activation,
        activationTrend: neuron.activationTrend,
        totalActivations: neuron.totalActivations,
        averageActivation: neuron.averageActivation,
        connectionChanges: neuron.connectionChanges,
        usefulness: neuron.usefulness,
        updatedAt: new Date().toISOString(),
      },
    });
}

/**
 * 加载用户的所有神经元
 */
export async function loadNeurons(userId: UserId): Promise<SavedNeuron[]> {
  const result = await db
    .select()
    .from(neuronsV2)
    .where(eq(neuronsV2.userId, userId));

  return result.map(row => ({
    id: row.id,
    label: row.label,
    labelSource: row.labelSource as any,
    functionalRole: row.functionalRole,
    emergentLayer: row.emergentLayer,
    sensitivityVector: row.sensitivityVector as number[],
    sensitivityDimension: row.sensitivityDimension,
    sensitivityPlasticity: row.sensitivityPlasticity,
    activation: row.activation,
    activationTrend: row.activationTrend || 'stable',
    refractoryPeriod: row.refractoryPeriod,
    lastActivatedAt: row.lastActivatedAt,
    totalActivations: row.totalActivations,
    averageActivation: row.averageActivation,
    connectionChanges: row.connectionChanges,
    usefulness: row.usefulness,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * 删除神经元
 */
export async function deleteNeuron(userId: UserId, neuronId: string): Promise<void> {
  await db
    .delete(neuronsV2)
    .where(and(
      eq(neuronsV2.id, neuronId),
      eq(neuronsV2.userId, userId)
    ));
}

// ─────────────────────────────────────────────────────────────────────
// 连接操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存连接
 */
export async function saveConnection(userId: UserId, connection: SavedConnection): Promise<void> {
  await db
    .insert(connectionsV2)
    .values({
      id: connection.id,
      userId,
      from: connection.from,
      to: connection.to,
      type: connection.type,
      strength: connection.strength,
      plasticity: connection.plasticity,
      delay: connection.delay,
      efficiency: connection.efficiency,
      lastActivatedAt: connection.lastActivatedAt,
      totalActivations: connection.totalActivations,
      averageActivationStrength: connection.averageActivationStrength,
      source: connection.source,
      createdAt: connection.createdAt,
    })
    .onConflictDoUpdate({
      target: connectionsV2.id,
      set: {
        strength: connection.strength,
        plasticity: connection.plasticity,
        efficiency: connection.efficiency,
        totalActivations: connection.totalActivations,
        averageActivationStrength: connection.averageActivationStrength,
      },
    });
}

/**
 * 加载用户的所有连接
 */
export async function loadConnections(userId: UserId): Promise<SavedConnection[]> {
  const result = await db
    .select()
    .from(connectionsV2)
    .where(eq(connectionsV2.userId, userId));

  return result.map(row => ({
    id: row.id,
    from: row.from,
    to: row.to,
    type: row.type,
    strength: row.strength,
    plasticity: row.plasticity,
    delay: row.delay,
    efficiency: row.efficiency,
    lastActivatedAt: row.lastActivatedAt,
    totalActivations: row.totalActivations,
    averageActivationStrength: row.averageActivationStrength,
    source: row.source,
    createdAt: row.createdAt,
  }));
}

/**
 * 删除连接
 */
export async function deleteConnection(userId: UserId, connectionId: string): Promise<void> {
  await db
    .delete(connectionsV2)
    .where(and(
      eq(connectionsV2.id, connectionId),
      eq(connectionsV2.userId, userId)
    ));
}

// ─────────────────────────────────────────────────────────────────────
// 记忆操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存记忆
 */
export async function saveMemory(userId: UserId, memory: SavedMemory): Promise<void> {
  await db
    .insert(memoriesV2)
    .values({
      id: memory.id,
      userId,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      emotionalIntensity: memory.emotionalIntensity,
      emotionalValence: memory.emotionalValence,
      strength: memory.strength,
      consolidated: memory.consolidated,
      relatedNeurons: memory.relatedNeurons,
      relatedConnections: memory.relatedConnections,
      tags: memory.tags,
      recallCount: memory.recallCount,
      lastRecalledAt: memory.lastRecalledAt,
      createdAt: memory.createdAt,
    })
    .onConflictDoUpdate({
      target: memoriesV2.id,
      set: {
        strength: memory.strength,
        consolidated: memory.consolidated,
        recallCount: memory.recallCount,
        lastRecalledAt: memory.lastRecalledAt,
        updatedAt: new Date().toISOString(),
      },
    });
}

/**
 * 加载用户的所有记忆
 */
export async function loadMemories(userId: UserId): Promise<SavedMemory[]> {
  const result = await db
    .select()
    .from(memoriesV2)
    .where(eq(memoriesV2.userId, userId))
    .orderBy(desc(memoriesV2.createdAt));

  return result.map(row => ({
    id: row.id,
    userId: row.userId,
    content: row.content,
    type: row.type as any,
    importance: row.importance,
    emotionalIntensity: row.emotionalIntensity,
    emotionalValence: row.emotionalValence,
    strength: row.strength,
    consolidated: row.consolidated,
    relatedNeurons: row.relatedNeurons as string[],
    relatedConnections: row.relatedConnections as string[],
    tags: row.tags as string[],
    recallCount: row.recallCount,
    lastRecalledAt: row.lastRecalledAt,
    createdAt: row.createdAt,
  }));
}

/**
 * 删除记忆
 */
export async function deleteMemory(userId: UserId, memoryId: string): Promise<void> {
  await db
    .delete(memoriesV2)
    .where(and(
      eq(memoriesV2.id, memoryId),
      eq(memoriesV2.userId, userId)
    ));
}

// ─────────────────────────────────────────────────────────────────────
// 自我模型操作
// ─────────────────────────────────────────────────────────────────────

/**
 * 保存自我模型
 */
export async function saveSelfModel(
  userId: UserId, 
  selfModel: any
): Promise<void> {
  await db
    .insert(selfModelsV2)
    .values({
      userId,
      ...selfModel,
    })
    .onConflictDoUpdate({
      target: selfModelsV2.userId,
      set: {
        ...selfModel,
        version: sql`${selfModelsV2.version} + 1`,
        updatedAt: new Date().toISOString(),
      },
    });
}

/**
 * 加载自我模型
 */
export async function loadSelfModel(userId: UserId): Promise<any | null> {
  const result = await db
    .select()
    .from(selfModelsV2)
    .where(eq(selfModelsV2.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ─────────────────────────────────────────────────────────────────────
// 创建数据库接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建PersistenceManager所需的数据库接口
 */
export function createDatabaseInterface() {
  return {
    saveNeuron,
    saveConnection,
    saveMemory,
    loadNeurons,
    loadConnections,
    loadMemories,
    deleteNeuron,
    deleteConnection,
    updateSelfModel: saveSelfModel,
    loadSelfModel,
  };
}
