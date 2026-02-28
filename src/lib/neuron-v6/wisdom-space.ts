/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智慧空间与升华算法 (Wisdom Space & Sublimation)
 * 
 * 核心思想：
 * - 智慧是在概念空间中的高维点
 * - 不同领域的智慧可以互相映射和迁移
 * - 智慧的价值在于其"跨域适用性"
 * - 通过语义升华从规律中提炼智慧
 * 
 * 灵感来源：
 * - 概念空间理论 (Gärdenfors)：概念是几何空间中的区域
 * - 向量语义学：语义关系由向量运算捕捉
 * - 抽象化理论：从具体到抽象的归纳过程
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type { AbstractLaw } from './law-network';

// ─────────────────────────────────────────────────────────────────────
// 常量配置
// ─────────────────────────────────────────────────────────────────────

/** 概念维度数 */
const CONCEPT_DIMENSIONS = 32;

/** 智慧阈值 */
const WISDOM_THRESHOLD = 0.6;

/** 跨域阈值 */
const CROSS_DOMAIN_THRESHOLD = 0.5;

/** 最大智慧数 */
const MAX_WISDOMS = 100;

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 智慧类型
 */
export type WisdomType = 
  | 'procedural'    // 过程智慧：如何做
  | 'diagnostic'    // 诊断智慧：识别问题
  | 'strategic'     // 策略智慧：决策指导
  | 'relational'    // 关系智慧：事物关联
  | 'temporal';     // 时间智慧：时机把握

/**
 * 智慧向量
 */
export interface WisdomVector {
  id: string;
  
  /** 在概念空间中的位置 */
  vector: number[];
  
  /** 智慧表述 */
  formulation: string;
  
  /** 简短摘要 */
  summary: string;
  
  /** 智慧类型 */
  type: WisdomType;
  
  /** 来源追溯 */
  sources: {
    laws: string[];
    patterns: string[];
    actions: string[];
  };
  
  /** 适用域 */
  domains: string[];
  
  /** 跨域通用性得分 */
  crossDomainScore: number;
  
  /** 权威性（验证次数） */
  authority: number;
  
  /** 演化历史 */
  evolution: {
    createdAt: number;
    validations: number;
    applications: number;
    successRate: number;
    lastValidated: number;
    lastApplied: number;
  };
  
  /** 关联智慧 */
  relatedWisdoms: string[];
  
  /** 反例 */
  counterExamples: string[];
}

/**
 * 概念维度
 */
export interface ConceptDimension {
  name: string;
  description: string;
  polarity: {
    positive: string;
    negative: string;
  };
}

/**
 * 智慧指导
 */
export interface WisdomGuidance {
  /** 相关智慧 */
  wisdom: WisdomVector;
  
  /** 指导建议 */
  suggestion: string;
  
  /** 适用程度 */
  applicability: number;
  
  /** 来源追溯 */
  source: {
    law: string;
    pattern: string;
  };
}

/**
 * 升华配置
 */
export interface SublimationConfig {
  conceptDimensions: number;
  wisdomThreshold: number;
  crossDomainThreshold: number;
  maxWisdoms: number;
}

// ─────────────────────────────────────────────────────────────────────
// 概念维度定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 定义概念空间的维度
 */
const CONCEPTS: ConceptDimension[] = [
  { name: 'patience', description: '耐心程度', polarity: { positive: '耐心等待', negative: '急于求成' } },
  { name: 'verification', description: '验证倾向', polarity: { positive: '先验证后行动', negative: '直接行动' } },
  { name: 'simplicity', description: '简单性偏好', polarity: { positive: '简单直接', negative: '复杂精细' } },
  { name: 'robustness', description: '鲁棒性偏好', polarity: { positive: '稳健可靠', negative: '灵活多变' } },
  { name: 'adaptability', description: '适应性', polarity: { positive: '随机应变', negative: '坚持计划' } },
  { name: 'caution', description: '谨慎程度', polarity: { positive: '谨慎小心', negative: '大胆尝试' } },
  { name: 'thoroughness', description: '彻底程度', polarity: { positive: '彻底完整', negative: '快速高效' } },
  { name: 'persistence', description: '坚持程度', polarity: { positive: '持之以恒', negative: '见好就收' } },
];

// ─────────────────────────────────────────────────────────────────────
// 智慧空间
// ─────────────────────────────────────────────────────────────────────

/**
 * 智慧空间
 */
export class WisdomSpace {
  private config: SublimationConfig;
  
  /** 智慧向量 */
  private wisdoms: Map<string, WisdomVector> = new Map();
  
  /** 语义邻近索引 */
  private neighborIndex: Map<string, string[]> = new Map();
  
  /** 领域索引 */
  private domainIndex: Map<string, Set<string>> = new Map();
  
  /** 类型索引 */
  private typeIndex: Map<WisdomType, Set<string>> = new Map();
  
  constructor(config?: Partial<SublimationConfig>) {
    this.config = {
      conceptDimensions: config?.conceptDimensions || CONCEPT_DIMENSIONS,
      wisdomThreshold: config?.wisdomThreshold || WISDOM_THRESHOLD,
      crossDomainThreshold: config?.crossDomainThreshold || CROSS_DOMAIN_THRESHOLD,
      maxWisdoms: config?.maxWisdoms || MAX_WISDOMS,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 智慧升华
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 从抽象规律升华智慧
   * 
   * 核心算法：
   * 1. 语义嵌入：将规律映射到概念空间
   * 2. 聚类：发现规律群的语义中心
   * 3. 抽象：生成跨域表述
   * 4. 验证：评估跨域适用性
   */
  sublimateFromLaws(laws: AbstractLaw[]): WisdomVector[] {
    const newWisdoms: WisdomVector[] = [];
    
    // 1. 语义嵌入
    const lawVectors = laws.map(law => ({
      law,
      vector: this.embedLaw(law),
    }));
    
    // 2. 聚类（简化版：按相似性分组）
    const clusters = this.clusterBySimilarity(lawVectors);
    
    for (const cluster of clusters) {
      if (cluster.length < 2) continue;
      
      // 3. 计算聚类中心
      const centroid = this.computeCentroid(cluster.map(c => c.vector));
      
      // 4. 生成抽象表述
      const formulation = this.generalizeFromCluster(cluster);
      
      // 5. 评估跨域适用性
      const crossDomainScore = this.evaluateCrossDomain(cluster);
      
      if (crossDomainScore < this.config.crossDomainThreshold) continue;
      
      // 6. 推断智慧类型
      const type = this.inferWisdomType(cluster);
      
      // 7. 创建智慧向量
      const wisdom: WisdomVector = {
        id: uuidv4(),
        vector: centroid,
        formulation,
        summary: formulation.slice(0, 50),
        type,
        sources: {
          laws: cluster.map(c => c.law.id),
          patterns: cluster.flatMap(c => c.law.sourcePatterns),
          actions: [],
        },
        domains: [...new Set(cluster.flatMap(c => c.law.scope))],
        crossDomainScore,
        authority: cluster.length,
        evolution: {
          createdAt: Date.now(),
          validations: 0,
          applications: 0,
          successRate: 0.5,
          lastValidated: Date.now(),
          lastApplied: Date.now(),
        },
        relatedWisdoms: [],
        counterExamples: [],
      };
      
      this.addWisdom(wisdom);
      newWisdoms.push(wisdom);
      
      console.log(`[智慧空间] 新智慧升华: "${formulation.slice(0, 30)}..." (跨域: ${crossDomainScore.toFixed(2)})`);
    }
    
    // 8. 维护数量限制
    this.maintainWisdomLimit();
    
    // 9. 更新邻近索引
    this.updateNeighborIndex();
    
    return newWisdoms;
  }
  
  /**
   * 嵌入规律到概念空间
   */
  private embedLaw(law: AbstractLaw): number[] {
    const vector = new Array(CONCEPT_DIMENSIONS).fill(0);
    
    // 基于规律内容推断概念位置
    const content = law.abstraction.toLowerCase();
    
    // 概念映射
    CONCEPTS.forEach((concept, i) => {
      if (content.includes(concept.polarity.positive)) {
        vector[i] = 0.8;
      } else if (content.includes(concept.polarity.negative)) {
        vector[i] = -0.8;
      } else {
        vector[i] = 0;
      }
    });
    
    // 范围和置信度影响后几个维度
    vector[8] = law.scope.length / 5;  // 适用范围
    vector[9] = law.confidence;         // 置信度
    vector[10] = law.significance;      // 显著性
    
    return this.normalize(vector);
  }
  
  /**
   * 按相似性聚类
   */
  private clusterBySimilarity(
    items: Array<{ law: AbstractLaw; vector: number[] }>
  ): Array<Array<{ law: AbstractLaw; vector: number[] }>> {
    const clusters: Array<Array<{ law: AbstractLaw; vector: number[] }>> = [];
    const used = new Set<string>();
    
    const threshold = 0.7;
    
    for (const item of items) {
      if (used.has(item.law.id)) continue;
      
      const cluster: Array<{ law: AbstractLaw; vector: number[] }> = [item];
      used.add(item.law.id);
      
      for (const other of items) {
        if (used.has(other.law.id)) continue;
        
        const similarity = this.cosineSimilarity(item.vector, other.vector);
        
        if (similarity > threshold) {
          cluster.push(other);
          used.add(other.law.id);
        }
      }
      
      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }
  
  /**
   * 计算聚类中心
   */
  private computeCentroid(vectors: number[][]): number[] {
    const dim = vectors[0].length;
    const centroid = new Array(dim).fill(0);
    
    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += vec[i];
      }
    }
    
    return centroid.map(v => v / vectors.length);
  }
  
  /**
   * 从聚类生成抽象表述
   */
  private generalizeFromCluster(
    cluster: Array<{ law: AbstractLaw; vector: number[] }>
  ): string {
    // 找到共同概念
    const commonConcepts: string[] = [];
    const centroid = this.computeCentroid(cluster.map(c => c.vector));
    
    CONCEPTS.forEach((concept, i) => {
      if (centroid[i] > 0.3) {
        commonConcepts.push(concept.polarity.positive);
      } else if (centroid[i] < -0.3) {
        commonConcepts.push(concept.polarity.negative);
      }
    });
    
    // 基于共同概念生成表述
    if (commonConcepts.length > 0) {
      const mainConcept = commonConcepts[0];
      const examples = cluster.slice(0, 2).map(c => c.law.abstraction.slice(0, 20)).join('、');
      
      return `${mainConcept}能提高成功率（例如：${examples}）`;
    }
    
    // 回退到规律聚合
    return cluster[0].law.abstraction;
  }
  
  /**
   * 评估跨域适用性
   */
  private evaluateCrossDomain(
    cluster: Array<{ law: AbstractLaw; vector: number[] }>
  ): number {
    const domains = new Set<string>();
    
    for (const item of cluster) {
      for (const domain of item.law.scope) {
        domains.add(domain);
      }
    }
    
    // 跨域数量得分
    const domainScore = Math.min(domains.size / 3, 1);
    
    // 相似性得分（越相似，跨域越可靠）
    const vectors = cluster.map(c => c.vector);
    let avgSimilarity = 0;
    let pairs = 0;
    
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        avgSimilarity += this.cosineSimilarity(vectors[i], vectors[j]);
        pairs++;
      }
    }
    
    avgSimilarity = pairs > 0 ? avgSimilarity / pairs : 0;
    
    return domainScore * 0.6 + avgSimilarity * 0.4;
  }
  
  /**
   * 推断智慧类型
   */
  private inferWisdomType(
    cluster: Array<{ law: AbstractLaw; vector: number[] }>
  ): WisdomType {
    const content = cluster.map(c => c.law.abstraction.toLowerCase()).join(' ');
    
    if (content.includes('步骤') || content.includes('顺序') || content.includes('流程')) {
      return 'procedural';
    }
    if (content.includes('诊断') || content.includes('识别') || content.includes('检查')) {
      return 'diagnostic';
    }
    if (content.includes('决策') || content.includes('选择') || content.includes('策略')) {
      return 'strategic';
    }
    if (content.includes('关联') || content.includes('影响') || content.includes('导致')) {
      return 'relational';
    }
    if (content.includes('时机') || content.includes('等待') || content.includes('先后')) {
      return 'temporal';
    }
    
    return 'procedural';
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 智慧管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加智慧
   */
  addWisdom(wisdom: WisdomVector): void {
    this.wisdoms.set(wisdom.id, wisdom);
    this.updateIndices(wisdom);
  }
  
  /**
   * 获取智慧
   */
  getWisdom(id: string): WisdomVector | undefined {
    return this.wisdoms.get(id);
  }
  
  /**
   * 获取所有智慧
   */
  getAllWisdoms(): WisdomVector[] {
    return Array.from(this.wisdoms.values());
  }
  
  /**
   * 按领域获取智慧
   */
  getWisdomsByDomain(domain: string): WisdomVector[] {
    const ids = this.domainIndex.get(domain.toLowerCase());
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.wisdoms.get(id))
      .filter(Boolean) as WisdomVector[];
  }
  
  /**
   * 按类型获取智慧
   */
  getWisdomsByType(type: WisdomType): WisdomVector[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.wisdoms.get(id))
      .filter(Boolean) as WisdomVector[];
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 指导传播
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取指导
   * 
   * 根据当前上下文，从智慧空间传播指导建议
   */
  getGuidance(context: string, domain?: string): WisdomGuidance[] {
    const contextVector = this.embedContext(context);
    const guidances: WisdomGuidance[] = [];
    
    // 1. 找到相关的智慧
    const candidates = domain 
      ? this.getWisdomsByDomain(domain) 
      : this.getAllWisdoms();
    
    for (const wisdom of candidates) {
      const similarity = this.cosineSimilarity(contextVector, wisdom.vector);
      
      if (similarity > 0.3) {
        // 2. 生成指导建议
        const suggestion = this.generateSuggestion(wisdom, context);
        
        guidances.push({
          wisdom,
          suggestion,
          applicability: similarity * wisdom.crossDomainScore * wisdom.evolution.successRate,
          source: {
            law: wisdom.sources.laws[0] || '',
            pattern: wisdom.sources.patterns[0] || '',
          },
        });
      }
    }
    
    // 3. 按适用性排序
    return guidances
      .sort((a, b) => b.applicability - a.applicability)
      .slice(0, 5);
  }
  
  /**
   * 嵌入上下文
   */
  private embedContext(context: string): number[] {
    const vector = new Array(CONCEPT_DIMENSIONS).fill(0);
    const contextLower = context.toLowerCase();
    
    CONCEPTS.forEach((concept, i) => {
      if (contextLower.includes(concept.polarity.positive)) {
        vector[i] = 0.5;
      } else if (contextLower.includes(concept.polarity.negative)) {
        vector[i] = -0.5;
      }
    });
    
    return this.normalize(vector);
  }
  
  /**
   * 生成指导建议
   */
  private generateSuggestion(wisdom: WisdomVector, context: string): string {
    // 简化版：基于智慧类型和上下文生成建议
    const templates: Record<WisdomType, string> = {
      procedural: `建议采用：${wisdom.formulation}`,
      diagnostic: `注意检查：${wisdom.formulation}`,
      strategic: `考虑策略：${wisdom.formulation}`,
      relational: `注意关系：${wisdom.formulation}`,
      temporal: `把握时机：${wisdom.formulation}`,
    };
    
    return templates[wisdom.type];
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 智慧验证与演化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 验证智慧
   */
  validateWisdom(id: string, success: boolean): void {
    const wisdom = this.wisdoms.get(id);
    if (!wisdom) return;
    
    wisdom.evolution.validations++;
    wisdom.evolution.lastValidated = Date.now();
    
    // 更新成功率
    const n = wisdom.evolution.validations;
    const currentRate = wisdom.evolution.successRate;
    wisdom.evolution.successRate = (currentRate * (n - 1) + (success ? 1 : 0)) / n;
    
    // 更新权威性
    wisdom.authority = wisdom.evolution.validations * wisdom.evolution.successRate;
  }
  
  /**
   * 应用智慧
   */
  applyWisdom(id: string): void {
    const wisdom = this.wisdoms.get(id);
    if (!wisdom) return;
    
    wisdom.evolution.applications++;
    wisdom.evolution.lastApplied = Date.now();
  }
  
  /**
   * 添加反例
   */
  addCounterExample(id: string, example: string): void {
    const wisdom = this.wisdoms.get(id);
    if (!wisdom) return;
    
    wisdom.counterExamples.push(example);
    
    // 如果反例太多，降低跨域得分
    if (wisdom.counterExamples.length > 5) {
      wisdom.crossDomainScore *= 0.9;
    }
  }
  
  /**
   * 关联智慧
   */
  relateWisdoms(id1: string, id2: string): void {
    const wisdom1 = this.wisdoms.get(id1);
    const wisdom2 = this.wisdoms.get(id2);
    
    if (!wisdom1 || !wisdom2) return;
    
    if (!wisdom1.relatedWisdoms.includes(id2)) {
      wisdom1.relatedWisdoms.push(id2);
    }
    if (!wisdom2.relatedWisdoms.includes(id1)) {
      wisdom2.relatedWisdoms.push(id1);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新索引
   */
  private updateIndices(wisdom: WisdomVector): void {
    // 领域索引
    for (const domain of wisdom.domains) {
      const key = domain.toLowerCase();
      if (!this.domainIndex.has(key)) {
        this.domainIndex.set(key, new Set());
      }
      this.domainIndex.get(key)!.add(wisdom.id);
    }
    
    // 类型索引
    if (!this.typeIndex.has(wisdom.type)) {
      this.typeIndex.set(wisdom.type, new Set());
    }
    this.typeIndex.get(wisdom.type)!.add(wisdom.id);
  }
  
  /**
   * 更新邻近索引
   */
  private updateNeighborIndex(): void {
    this.neighborIndex.clear();
    
    const wisdoms = Array.from(this.wisdoms.values());
    
    for (const wisdom of wisdoms) {
      const neighbors: string[] = [];
      
      for (const other of wisdoms) {
        if (other.id === wisdom.id) continue;
        
        const similarity = this.cosineSimilarity(wisdom.vector, other.vector);
        if (similarity > 0.6) {
          neighbors.push(other.id);
        }
      }
      
      this.neighborIndex.set(wisdom.id, neighbors);
    }
  }
  
  /**
   * 维护智慧数量限制
   */
  private maintainWisdomLimit(): void {
    if (this.wisdoms.size <= this.config.maxWisdoms) return;
    
    // 按权威性排序，移除低权威的
    const sorted = Array.from(this.wisdoms.values())
      .sort((a, b) => b.authority - a.authority);
    
    const toRemove = sorted.slice(this.config.maxWisdoms);
    
    for (const wisdom of toRemove) {
      this.wisdoms.delete(wisdom.id);
      
      // 从索引移除
      for (const domain of wisdom.domains) {
        this.domainIndex.get(domain.toLowerCase())?.delete(wisdom.id);
      }
      this.typeIndex.get(wisdom.type)?.delete(wisdom.id);
    }
    
    console.log(`[智慧空间] 清理了 ${toRemove.length} 个低权威智慧`);
  }
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dot / denominator : 0;
  }
  
  /**
   * 归一化
   */
  private normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm < 0.0001) return vec;
    return vec.map(v => v / norm);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalWisdoms: number;
    byType: Record<WisdomType, number>;
    avgCrossDomainScore: number;
    avgAuthority: number;
    avgSuccessRate: number;
  } {
    const wisdoms = Array.from(this.wisdoms.values());
    
    const byType: Record<WisdomType, number> = {
      procedural: 0,
      diagnostic: 0,
      strategic: 0,
      relational: 0,
      temporal: 0,
    };
    
    for (const w of wisdoms) {
      byType[w.type]++;
    }
    
    return {
      totalWisdoms: wisdoms.length,
      byType,
      avgCrossDomainScore: wisdoms.length > 0
        ? wisdoms.reduce((sum, w) => sum + w.crossDomainScore, 0) / wisdoms.length
        : 0,
      avgAuthority: wisdoms.length > 0
        ? wisdoms.reduce((sum, w) => sum + w.authority, 0) / wisdoms.length
        : 0,
      avgSuccessRate: wisdoms.length > 0
        ? wisdoms.reduce((sum, w) => sum + w.evolution.successRate, 0) / wisdoms.length
        : 0,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): string {
    return JSON.stringify({
      wisdoms: Array.from(this.wisdoms.entries()),
    });
  }
  
  /**
   * 导入状态
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      this.wisdoms.clear();
      this.domainIndex.clear();
      this.typeIndex.clear();
      this.neighborIndex.clear();
      
      if (parsed.wisdoms) {
        for (const [id, wisdom] of parsed.wisdoms) {
          this.wisdoms.set(id, wisdom);
          this.updateIndices(wisdom);
        }
      }
      
      this.updateNeighborIndex();
      
      console.log(`[智慧空间] 已恢复 ${this.wisdoms.size} 条智慧`);
    } catch (e) {
      console.error('[智慧空间] 导入状态失败:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let spaceInstance: WisdomSpace | null = null;

export function createWisdomSpace(config?: Partial<SublimationConfig>): WisdomSpace {
  if (!spaceInstance) {
    spaceInstance = new WisdomSpace(config);
  }
  return spaceInstance;
}

export function getWisdomSpace(): WisdomSpace | null {
  return spaceInstance;
}
