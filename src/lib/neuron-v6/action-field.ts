/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动场理论 (Action Field Theory)
 * 
 * 核心思想：
 * - 行动不是孤立的点，而是在场中产生的涟漪
 * - 相似的行动在特征空间中聚集
 * - 场的势能高的区域容易涌现模式
 * 
 * 灵感来源：
 * - 物理场论：场是物质存在的基本形式
 * - 量子力学：粒子的位置和动量是不确定的，只有概率分布
 * - 动力系统：相空间中的轨迹演化
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 常量配置
// ─────────────────────────────────────────────────────────────────────

/** 特征空间维度 */
const FIELD_DIMENSIONS = 16;

/** 势能衰减系数 */
const POTENTIAL_DECAY = 0.95;

/** 势能传播半径 */
const POTENTIAL_SPREAD_RADIUS = 0.3;

/** 涌现阈值 */
const EMERGENCE_THRESHOLD = 0.6;

/** 最大行动粒子数 */
const MAX_PARTICLES = 1000;

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 行动类型
 */
export type ActionType = 
  | 'click'      // 点击
  | 'type'       // 输入
  | 'scroll'     // 滚动
  | 'wait'       // 等待
  | 'navigate'   // 导航
  | 'extract'    // 提取
  | 'verify'     // 验证
  | 'retry'      // 重试
  | 'fallback';  // 降级

/**
 * 行动结果
 */
export type ActionResult = 'success' | 'failed' | 'partial' | 'timeout';

/**
 * 行动粒子
 * 
 * 在特征空间中的一个行动记录
 */
export interface ActionParticle {
  /** 唯一标识 */
  id: string;
  
  /** 在特征空间中的位置（嵌入向量） */
  position: number[];
  
  /** 电荷：成功为正，失败为负 */
  charge: number;
  
  /** 质量：重要性权重 */
  mass: number;
  
  /** 行动类型 */
  type: ActionType;
  
  /** 目标描述 */
  target: string;
  
  /** 上下文描述 */
  context: string;
  
  /** 执行结果 */
  result: ActionResult;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 执行时长（毫秒） */
  duration: number;
  
  /** 重试次数 */
  retryCount: number;
  
  /** 轨迹：前序行动ID序列 */
  trajectory: string[];
  
  /** 元数据 */
  metadata: Record<string, any>;
}

/**
 * 行动记录（原始输入）
 */
export interface ActionRecord {
  type: ActionType;
  target: string;
  context: string;
  result: ActionResult;
  duration: number;
  retryCount: number;
  previousActions?: string[];
  metadata?: Record<string, any>;
}

/**
 * 势能峰值
 */
export interface PotentialPeak {
  /** 峰值位置 */
  position: number[];
  
  /** 势能值 */
  potential: number;
  
  /** 贡献的粒子ID */
  particleIds: string[];
  
  /** 局部密度 */
  density: number;
}

/**
 * 行动场配置
 */
export interface ActionFieldConfig {
  /** 特征空间维度 */
  dimensions: number;
  
  /** 势能衰减系数 */
  potentialDecay: number;
  
  /** 势能传播半径 */
  potentialSpreadRadius: number;
  
  /** 涌现阈值 */
  emergenceThreshold: number;
  
  /** 最大粒子数 */
  maxParticles: number;
}

// ─────────────────────────────────────────────────────────────────────
// 特征嵌入器
// ─────────────────────────────────────────────────────────────────────

/**
 * 行动特征嵌入器
 * 
 * 将行动映射到特征空间
 * 
 * 算法：使用多层特征融合
 * - 类型特征：one-hot + 语义扩展
 * - 目标特征：关键词提取 + 语义编码
 * - 上下文特征：场景编码
 * - 结果特征：结果向量
 */
class ActionEmbedder {
  private typeVectors: Map<ActionType, number[]>;
  private contextKeywords: Map<string, number[]>;
  
  constructor() {
    // 初始化类型向量（在特征空间中的基底）
    this.typeVectors = this.initTypeVectors();
    this.contextKeywords = new Map();
  }
  
  /**
   * 将行动嵌入到特征空间
   */
  embed(record: ActionRecord): number[] {
    const vector = new Array(FIELD_DIMENSIONS).fill(0);
    
    // 1. 类型特征（前4维）
    const typeVec = this.typeVectors.get(record.type) || this.typeVectors.get('click')!;
    for (let i = 0; i < 4; i++) {
      vector[i] = typeVec[i];
    }
    
    // 2. 目标特征（5-8维）
    const targetVec = this.embedTarget(record.target);
    for (let i = 0; i < 4; i++) {
      vector[4 + i] = targetVec[i];
    }
    
    // 3. 上下文特征（9-12维）
    const contextVec = this.embedContext(record.context);
    for (let i = 0; i < 4; i++) {
      vector[8 + i] = contextVec[i];
    }
    
    // 4. 结果特征（13-16维）
    const resultVec = this.embedResult(record.result, record.retryCount, record.duration);
    for (let i = 0; i < 4; i++) {
      vector[12 + i] = resultVec[i];
    }
    
    // 归一化
    return this.normalize(vector);
  }
  
  /**
   * 初始化类型向量
   */
  private initTypeVectors(): Map<ActionType, number[]> {
    const vectors = new Map<ActionType, number[]>();
    
    // 使用有意义的基底
    vectors.set('click', [1, 0, 0, 0]);
    vectors.set('type', [0, 1, 0, 0]);
    vectors.set('scroll', [0, 0, 1, 0]);
    vectors.set('wait', [0, 0, 0, 1]);
    vectors.set('navigate', [0.7, 0, 0.7, 0]);
    vectors.set('extract', [0.5, 0.5, 0, 0]);
    vectors.set('verify', [0.3, 0, 0, 0.9]);
    vectors.set('retry', [0.8, 0, 0, 0.6]);
    vectors.set('fallback', [0.2, 0.2, 0.2, 0.8]);
    
    return vectors;
  }
  
  /**
   * 嵌入目标特征
   */
  private embedTarget(target: string): number[] {
    const vec = [0, 0, 0, 0];
    
    // 基于关键词的语义编码
    const keywords = {
      'button': [1, 0, 0, 0],
      'link': [0.8, 0.2, 0, 0],
      'input': [0, 1, 0, 0],
      'text': [0, 0.8, 0.2, 0],
      'element': [0.5, 0.5, 0, 0],
      'page': [0, 0, 1, 0],
      'modal': [0.3, 0, 0.7, 0],
      'form': [0.2, 0.8, 0, 0],
    };
    
    const targetLower = target.toLowerCase();
    for (const [kw, v] of Object.entries(keywords)) {
      if (targetLower.includes(kw)) {
        for (let i = 0; i < 4; i++) {
          vec[i] = vec[i] * 0.5 + v[i] * 0.5;
        }
      }
    }
    
    return vec;
  }
  
  /**
   * 嵌入上下文特征
   */
  private embedContext(context: string): number[] {
    const vec = [0.5, 0.5, 0.5, 0.5];
    
    // 场景编码
    const scenes = {
      'error': [1, 0, 0, 0],
      'loading': [0, 1, 0, 0],
      'success': [0, 0, 1, 0],
      'navigation': [0, 0, 0, 1],
      'form': [0.7, 0.3, 0, 0],
      'modal': [0, 0.7, 0.3, 0],
    };
    
    const contextLower = context.toLowerCase();
    for (const [scene, v] of Object.entries(scenes)) {
      if (contextLower.includes(scene)) {
        for (let i = 0; i < 4; i++) {
          vec[i] = vec[i] * 0.6 + v[i] * 0.4;
        }
      }
    }
    
    return vec;
  }
  
  /**
   * 嵌入结果特征
   */
  private embedResult(result: ActionResult, retryCount: number, duration: number): number[] {
    const vec = [0, 0, 0, 0];
    
    // 结果向量
    switch (result) {
      case 'success':
        vec[0] = 1;
        vec[1] = 1 - Math.min(retryCount * 0.2, 0.5);
        break;
      case 'failed':
        vec[0] = 0;
        vec[1] = 0;
        vec[2] = Math.min(retryCount * 0.3, 1);
        break;
      case 'partial':
        vec[0] = 0.5;
        vec[1] = 0.5;
        vec[2] = 0.3;
        break;
      case 'timeout':
        vec[0] = 0;
        vec[1] = 0;
        vec[3] = 1;
        break;
    }
    
    // 时长特征（归一化）
    vec[3] = Math.min(duration / 5000, 1);
    
    return vec;
  }
  
  /**
   * 归一化向量
   */
  private normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm < 0.0001) return vec;
    return vec.map(v => v / norm);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 行动场
// ─────────────────────────────────────────────────────────────────────

/**
 * 行动场
 * 
 * 行动在特征空间中形成的场
 */
export class ActionField {
  private config: ActionFieldConfig;
  private embedder: ActionEmbedder;
  
  /** 场中的行动粒子 */
  private particles: Map<string, ActionParticle> = new Map();
  
  /** 场的势能分布（离散化的网格） */
  private potentialGrid: Float32Array;
  
  /** 粒子索引（用于快速查询） */
  private spatialIndex: Map<string, Set<string>> = new Map();
  
  constructor(config?: Partial<ActionFieldConfig>) {
    this.config = {
      dimensions: config?.dimensions || FIELD_DIMENSIONS,
      potentialDecay: config?.potentialDecay || POTENTIAL_DECAY,
      potentialSpreadRadius: config?.potentialSpreadRadius || POTENTIAL_SPREAD_RADIUS,
      emergenceThreshold: config?.emergenceThreshold || EMERGENCE_THRESHOLD,
      maxParticles: config?.maxParticles || MAX_PARTICLES,
    };
    
    this.embedder = new ActionEmbedder();
    
    // 初始化势能网格（简化为8维网格）
    this.potentialGrid = new Float32Array(Math.pow(2, 8));
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加行动粒子
   * 
   * 行动进入场，产生涟漪
   */
  addParticle(record: ActionRecord): ActionParticle {
    // 嵌入特征空间
    const position = this.embedder.embed(record);
    
    // 计算电荷（成功为正，失败为负）
    const charge = this.calculateCharge(record);
    
    // 计算质量（重要性）
    const mass = this.calculateMass(record);
    
    const particle: ActionParticle = {
      id: uuidv4(),
      position,
      charge,
      mass,
      type: record.type,
      target: record.target,
      context: record.context,
      result: record.result,
      timestamp: Date.now(),
      duration: record.duration,
      retryCount: record.retryCount,
      trajectory: record.previousActions || [],
      metadata: record.metadata || {},
    };
    
    // 添加到场
    this.particles.set(particle.id, particle);
    
    // 更新空间索引
    this.updateSpatialIndex(particle);
    
    // 更新势能
    this.updatePotential(particle);
    
    // 维护粒子数量
    this.maintainParticleLimit();
    
    console.log(`[行动场] 新粒子进入: ${record.type} → ${record.result} (电荷: ${charge.toFixed(2)})`);
    
    return particle;
  }
  
  /**
   * 获取粒子
   */
  getParticle(id: string): ActionParticle | undefined {
    return this.particles.get(id);
  }
  
  /**
   * 获取所有粒子
   */
  getAllParticles(): ActionParticle[] {
    return Array.from(this.particles.values());
  }
  
  /**
   * 获取粒子数量
   */
  getParticleCount(): number {
    return this.particles.size;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 势能计算
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算某点的势能
   * 
   * 使用高斯核叠加
   */
  calculatePotentialAt(position: number[]): number {
    let potential = 0;
    
    for (const particle of this.particles.values()) {
      const distance = this.euclideanDistance(position, particle.position);
      
      // 高斯核：势能随距离衰减
      const contribution = particle.charge * particle.mass * 
        Math.exp(-distance * distance / (2 * this.config.potentialSpreadRadius * this.config.potentialSpreadRadius));
      
      potential += contribution;
    }
    
    return potential;
  }
  
  /**
   * 查找势能峰值
   * 
   * 使用密度峰值聚类思想
   */
  findPotentialPeaks(): PotentialPeak[] {
    const peaks: PotentialPeak[] = [];
    const processedIds = new Set<string>();
    
    // 计算每个粒子的局部密度
    const densities = new Map<string, number>();
    for (const particle of this.particles.values()) {
      densities.set(particle.id, this.calculateLocalDensity(particle));
    }
    
    // 找到密度峰值
    for (const particle of this.particles.values()) {
      if (processedIds.has(particle.id)) continue;
      
      const density = densities.get(particle.id)!;
      
      // 检查是否是局部最大
      const neighbors = this.findNeighbors(particle.position, this.config.potentialSpreadRadius * 2);
      let isPeak = true;
      
      for (const neighborId of neighbors) {
        if (neighborId === particle.id) continue;
        const neighborDensity = densities.get(neighborId) || 0;
        if (neighborDensity > density) {
          isPeak = false;
          break;
        }
      }
      
      if (isPeak && density >= this.config.emergenceThreshold) {
        // 收集属于这个峰的粒子
        const clusterParticles = neighbors.filter(id => {
          const p = this.particles.get(id);
          if (!p) return false;
          const d = this.euclideanDistance(p.position, particle.position);
          return d < this.config.potentialSpreadRadius * 2;
        });
        
        peaks.push({
          position: [...particle.position],
          potential: this.calculatePotentialAt(particle.position),
          particleIds: clusterParticles,
          density,
        });
        
        clusterParticles.forEach(id => processedIds.add(id));
      }
    }
    
    return peaks.sort((a, b) => b.potential - a.potential);
  }
  
  /**
   * 计算局部密度
   */
  private calculateLocalDensity(particle: ActionParticle): number {
    let density = 0;
    const radius = this.config.potentialSpreadRadius * 2;
    
    for (const other of this.particles.values()) {
      const distance = this.euclideanDistance(particle.position, other.position);
      if (distance < radius) {
        // 使用截断核
        density += other.charge * (1 - distance / radius);
      }
    }
    
    return density;
  }
  
  /**
   * 更新势能分布
   */
  private updatePotential(particle: ActionParticle): void {
    // 简化：只更新粒子附近的势能
    // 实际实现中可以使用网格化计算
    const neighbors = this.findNeighbors(particle.position, this.config.potentialSpreadRadius * 3);
    
    for (const neighborId of neighbors) {
      const neighbor = this.particles.get(neighborId);
      if (neighbor && neighbor.id !== particle.id) {
        // 势能叠加
        const distance = this.euclideanDistance(particle.position, neighbor.position);
        const contribution = particle.charge * Math.exp(-distance * distance);
        // 更新会影响后续计算
      }
    }
  }
  
  // ═══════────────────────────────────────────────────────────────────
  // 空间索引
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 更新空间索引
   */
  private updateSpatialIndex(particle: ActionParticle): void {
    // 将位置离散化为网格坐标
    const gridKey = this.positionToGridKey(particle.position);
    
    if (!this.spatialIndex.has(gridKey)) {
      this.spatialIndex.set(gridKey, new Set());
    }
    this.spatialIndex.get(gridKey)!.add(particle.id);
  }
  
  /**
   * 查找邻近粒子
   */
  findNeighbors(position: number[], radius: number): string[] {
    const neighbors: string[] = [];
    const gridKeys = this.getNearbyGridKeys(position, radius);
    
    for (const key of gridKeys) {
      const ids = this.spatialIndex.get(key);
      if (ids) {
        for (const id of ids) {
          const particle = this.particles.get(id);
          if (particle) {
            const distance = this.euclideanDistance(position, particle.position);
            if (distance <= radius) {
              neighbors.push(id);
            }
          }
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * 位置转网格键
   */
  private positionToGridKey(position: number[]): string {
    // 简化为4维网格
    const gridSize = 0.2;
    const coords = position.slice(0, 4).map(p => Math.floor(p / gridSize));
    return coords.join(',');
  }
  
  /**
   * 获取附近的网格键
   */
  private getNearbyGridKeys(position: number[], radius: number): string[] {
    const keys: string[] = [];
    const gridSize = 0.2;
    const range = Math.ceil(radius / gridSize);
    
    const coords = position.slice(0, 4).map(p => Math.floor(p / gridSize));
    
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        for (let dz = -range; dz <= range; dz++) {
          for (let dw = -range; dw <= range; dw++) {
            keys.push(`${coords[0] + dx},${coords[1] + dy},${coords[2] + dz},${coords[3] + dw}`);
          }
        }
      }
    }
    
    return keys;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算电荷
   */
  private calculateCharge(record: ActionRecord): number {
    let charge = 0;
    
    switch (record.result) {
      case 'success':
        charge = 1.0 - Math.min(record.retryCount * 0.15, 0.5);
        break;
      case 'partial':
        charge = 0.3;
        break;
      case 'failed':
        charge = -0.5 - Math.min(record.retryCount * 0.1, 0.3);
        break;
      case 'timeout':
        charge = -0.7;
        break;
    }
    
    return charge;
  }
  
  /**
   * 计算质量
   */
  private calculateMass(record: ActionRecord): number {
    let mass = 0.5;
    
    // 复杂操作更重要
    if (record.type === 'navigate' || record.type === 'extract') {
      mass += 0.2;
    }
    
    // 需要重试的操作更有学习价值
    mass += Math.min(record.retryCount * 0.1, 0.3);
    
    // 长时间操作
    if (record.duration > 3000) {
      mass += 0.1;
    }
    
    return Math.min(mass, 1.0);
  }
  
  /**
   * 欧氏距离
   */
  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      sum += (a[i] - b[i]) * (a[i] - b[i]);
    }
    return Math.sqrt(sum);
  }
  
  /**
   * 维护粒子数量限制
   */
  private maintainParticleLimit(): void {
    if (this.particles.size <= this.config.maxParticles) {
      return;
    }
    
    // 移除最老的粒子
    const sorted = Array.from(this.particles.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const toRemove = sorted.slice(0, this.particles.size - this.config.maxParticles);
    
    for (const particle of toRemove) {
      this.particles.delete(particle.id);
      
      // 从空间索引移除
      const gridKey = this.positionToGridKey(particle.position);
      this.spatialIndex.get(gridKey)?.delete(particle.id);
    }
    
    console.log(`[行动场] 清理了 ${toRemove.length} 个旧粒子`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取场状态
   */
  getFieldState(): {
    particleCount: number;
    avgCharge: number;
    avgMass: number;
    potentialPeaks: number;
  } {
    const particles = Array.from(this.particles.values());
    const peaks = this.findPotentialPeaks();
    
    return {
      particleCount: particles.length,
      avgCharge: particles.length > 0 
        ? particles.reduce((sum, p) => sum + p.charge, 0) / particles.length 
        : 0,
      avgMass: particles.length > 0
        ? particles.reduce((sum, p) => sum + p.mass, 0) / particles.length
        : 0,
      potentialPeaks: peaks.length,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): string {
    return JSON.stringify({
      particles: Array.from(this.particles.entries()),
    });
  }
  
  /**
   * 导入状态
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.particles.clear();
      this.spatialIndex.clear();
      
      if (parsed.particles) {
        for (const [id, particle] of parsed.particles) {
          this.particles.set(id, particle);
          this.updateSpatialIndex(particle);
        }
      }
      
      console.log(`[行动场] 已恢复 ${this.particles.size} 个粒子`);
    } catch (e) {
      console.error('[行动场] 导入状态失败:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let fieldInstance: ActionField | null = null;

export function createActionField(config?: Partial<ActionFieldConfig>): ActionField {
  if (!fieldInstance) {
    fieldInstance = new ActionField(config);
  }
  return fieldInstance;
}

export function getActionField(): ActionField | null {
  return fieldInstance;
}
