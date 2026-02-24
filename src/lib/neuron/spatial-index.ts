/**
 * 空间索引
 * 
 * 解决瓶颈：实时性
 * 
 * 策略：
 * 1. 层级聚类 - 将向量分簇，先找簇再找向量
 * 2. 近似搜索 - 允许小误差换取大速度提升
 * 3. 增量更新 - 不需要每次重建索引
 */

import { Space, distance } from './space';

/**
 * 簇
 */
export interface Cluster {
  /** 簇中心向量 */
  centroid: number[];
  /** 簇内元素 */
  items: IndexedItem[];
  /** 簇ID */
  id: string;
  /** 最后更新时间 */
  updatedAt: number;
}

/**
 * 索引项
 */
export interface IndexedItem {
  /** 向量 */
  vector: number[];
  /** 数据 */
  data: any;
  /** ID */
  id: string;
  /** 访问次数 */
  accesses: number;
  /** 最后访问时间 */
  lastAccessed: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  item: IndexedItem;
  distance: number;
}

/**
 * 层级空间索引
 * 
 * 两层结构：
 * - 第一层：K个簇
 * - 第二层：每个簇内的元素
 */
export class HierarchicalIndex {
  /** 簇列表 */
  private clusters: Cluster[] = [];
  
  /** 簇数量 */
  private k: number;
  
  /** 索引映射 */
  private itemIndex: Map<string, { clusterId: string; item: IndexedItem }> = new Map();
  
  /** 是否需要重建 */
  private needsRebuild: boolean = true;
  
  /** 最后重建时间 */
  private lastRebuildTime: number = 0;
  
  /** 重建间隔 */
  private rebuildInterval: number = 1000 * 60 * 10; // 10分钟
  
  constructor(k: number = 8) {
    this.k = k;
  }
  
  /**
   * 添加项
   */
  add(id: string, vector: number[], data: any): void {
    const item: IndexedItem = {
      vector,
      data,
      id,
      accesses: 0,
      lastAccessed: Date.now(),
    };
    
    // 如果簇还没初始化，创建一个临时簇
    if (this.clusters.length === 0) {
      this.clusters.push({
        centroid: [...vector],
        items: [item],
        id: `cluster-0`,
        updatedAt: Date.now(),
      });
      this.itemIndex.set(id, { clusterId: 'cluster-0', item });
      return;
    }
    
    // 找最近的簇
    let minDist = Infinity;
    let nearestCluster = this.clusters[0];
    
    for (const cluster of this.clusters) {
      const d = distance(cluster.centroid, vector);
      if (d < minDist) {
        minDist = d;
        nearestCluster = cluster;
      }
    }
    
    // 添加到簇
    nearestCluster.items.push(item);
    nearestCluster.updatedAt = Date.now();
    this.itemIndex.set(id, { clusterId: nearestCluster.id, item });
    
    // 标记需要重建
    this.needsRebuild = true;
  }
  
  /**
   * 批量添加
   */
  addBatch(items: Array<{ id: string; vector: number[]; data: any }>): void {
    for (const item of items) {
      this.add(item.id, item.vector, item.data);
    }
  }
  
  /**
   * 移除项
   */
  remove(id: string): boolean {
    const entry = this.itemIndex.get(id);
    if (!entry) return false;
    
    const cluster = this.clusters.find(c => c.id === entry.clusterId);
    if (cluster) {
      cluster.items = cluster.items.filter(item => item.id !== id);
      cluster.updatedAt = Date.now();
    }
    
    this.itemIndex.delete(id);
    this.needsRebuild = true;
    return true;
  }
  
  /**
   * 精确搜索
   * 
   * 遍历所有元素，返回最近的N个
   */
  searchExact(query: number[], topK: number = 10): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const cluster of this.clusters) {
      for (const item of cluster.items) {
        const d = distance(query, item.vector);
        results.push({ item, distance: d });
      }
    }
    
    // 排序取TopK
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, topK);
  }
  
  /**
   * 近似搜索
   * 
   * 1. 找最近的几个簇
   * 2. 只在这些簇内搜索
   * 
   * 时间复杂度：O(n/k) vs O(n)
   */
  searchApprox(query: number[], topK: number = 10, probeClusters: number = 2): SearchResult[] {
    // 如果需要重建且超过间隔，重建
    if (this.needsRebuild && Date.now() - this.lastRebuildTime > this.rebuildInterval) {
      this.rebuild();
    }
    
    // 找最近的几个簇
    const clusterDistances: { cluster: Cluster; distance: number }[] = [];
    
    for (const cluster of this.clusters) {
      const d = distance(cluster.centroid, query);
      clusterDistances.push({ cluster, distance: d });
    }
    
    clusterDistances.sort((a, b) => a.distance - b.distance);
    const topClusters = clusterDistances.slice(0, probeClusters);
    
    // 在这些簇内搜索
    const results: SearchResult[] = [];
    
    for (const { cluster } of topClusters) {
      for (const item of cluster.items) {
        const d = distance(query, item.vector);
        results.push({ item, distance: d });
      }
    }
    
    // 排序取TopK
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, topK);
  }
  
  /**
   * 范围搜索
   * 
   * 找距离小于threshold的所有元素
   */
  searchRange(query: number[], threshold: number): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const cluster of this.clusters) {
      // 先检查簇中心距离
      const clusterDist = distance(cluster.centroid, query);
      
      // 如果簇中心距离已经超过阈值+最大簇半径，跳过
      // (简化处理，实际可以用更精确的剪枝)
      if (clusterDist > threshold * 2 && cluster.items.length > 10) {
        continue;
      }
      
      // 在簇内搜索
      for (const item of cluster.items) {
        const d = distance(query, item.vector);
        if (d <= threshold) {
          results.push({ item, distance: d });
        }
      }
    }
    
    return results.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * 记录访问
   */
  recordAccess(id: string): void {
    const entry = this.itemIndex.get(id);
    if (entry) {
      entry.item.accesses++;
      entry.item.lastAccessed = Date.now();
    }
  }
  
  /**
   * 重建索引
   * 
   * 使用K-means聚类
   */
  rebuild(): void {
    // 收集所有项
    const allItems: IndexedItem[] = [];
    for (const cluster of this.clusters) {
      allItems.push(...cluster.items);
    }
    
    if (allItems.length === 0) return;
    
    // 如果项数少于k，每个项一个簇
    const actualK = Math.min(this.k, allItems.length);
    
    // K-means聚类
    this.clusters = this.kMeans(allItems, actualK);
    
    // 更新索引映射
    this.itemIndex.clear();
    for (const cluster of this.clusters) {
      for (const item of cluster.items) {
        this.itemIndex.set(item.id, { clusterId: cluster.id, item });
      }
    }
    
    this.needsRebuild = false;
    this.lastRebuildTime = Date.now();
  }
  
  /**
   * K-means聚类
   */
  private kMeans(items: IndexedItem[], k: number): Cluster[] {
    if (items.length === 0) return [];
    
    const dim = items[0].vector.length;
    
    // 初始化：随机选择k个中心
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    let centroids = shuffled.slice(0, k).map(item => [...item.vector]);
    
    // 迭代
    for (let iter = 0; iter < 10; iter++) {
      // 分配
      const clusters: IndexedItem[][] = new Array(k).fill(null).map(() => []);
      
      for (const item of items) {
        let minDist = Infinity;
        let minIdx = 0;
        
        for (let i = 0; i < centroids.length; i++) {
          const d = distance(item.vector, centroids[i]);
          if (d < minDist) {
            minDist = d;
            minIdx = i;
          }
        }
        
        clusters[minIdx].push(item);
      }
      
      // 更新中心
      const newCentroids: number[][] = [];
      
      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) {
          newCentroids.push(centroids[i]);
          continue;
        }
        
        const center = new Array(dim).fill(0);
        for (const item of clusters[i]) {
          for (let j = 0; j < dim; j++) {
            center[j] += item.vector[j];
          }
        }
        
        for (let j = 0; j < dim; j++) {
          center[j] /= clusters[i].length;
        }
        
        newCentroids.push(center);
      }
      
      centroids = newCentroids;
    }
    
    // 最终分配
    const clusters: IndexedItem[][] = new Array(k).fill(null).map(() => []);
    
    for (const item of items) {
      let minDist = Infinity;
      let minIdx = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const d = distance(item.vector, centroids[i]);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      
      clusters[minIdx].push(item);
    }
    
    // 构建簇
    return clusters.map((items, i) => ({
      centroid: centroids[i],
      items,
      id: `cluster-${i}`,
      updatedAt: Date.now(),
    }));
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalItems: number;
    clusterCount: number;
    avgClusterSize: number;
    maxClusterSize: number;
    minClusterSize: number;
  } {
    const sizes = this.clusters.map(c => c.items.length);
    const total = sizes.reduce((a, b) => a + b, 0);
    
    return {
      totalItems: total,
      clusterCount: this.clusters.length,
      avgClusterSize: total / Math.max(1, this.clusters.length),
      maxClusterSize: Math.max(0, ...sizes),
      minClusterSize: Math.min(0, ...sizes),
    };
  }
  
  /**
   * 获取所有簇
   */
  getClusters(): Cluster[] {
    return this.clusters;
  }
  
  /**
   * 获取所有项
   */
  getAllItems(): IndexedItem[] {
    const items: IndexedItem[] = [];
    for (const cluster of this.clusters) {
      items.push(...cluster.items);
    }
    return items;
  }
  
  /**
   * 清空索引
   */
  clear(): void {
    this.clusters = [];
    this.itemIndex.clear();
    this.needsRebuild = true;
  }
}

// 单例
let indexInstance: HierarchicalIndex | null = null;

export function getHierarchicalIndex(): HierarchicalIndex {
  if (!indexInstance) {
    indexInstance = new HierarchicalIndex();
  }
  return indexInstance;
}
