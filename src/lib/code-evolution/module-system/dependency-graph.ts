/**
 * 依赖图管理器
 * 
 * 管理模块间的依赖关系，支持：
 * - 依赖解析
 * - 循环检测
 * - 拓扑排序
 * - 影响分析
 */

import type { 
  ModuleId, 
  Dependency, 
  VersionRange,
  SemanticVersion 
} from '../types/core';

interface DependencyNode {
  moduleId: ModuleId;
  version: SemanticVersion;
  dependencies: Dependency[];
  dependents: ModuleId[];
}

interface ResolutionResult {
  satisfied: boolean;
  missing: Array<{
    moduleId: ModuleId;
    requiredRange: VersionRange;
  }>;
  conflicts: Array<{
    moduleId: ModuleId;
    required: VersionRange;
    actual: SemanticVersion;
  }>;
  order: ModuleId[];  // 拓扑排序后的加载顺序
}

/**
 * 解析版本字符串
 */
function parseVersion(version: string | SemanticVersion): SemanticVersion {
  if (typeof version === 'object') {
    return version;
  }
  const parts = version.split('.');
  return {
    major: parseInt(parts[0] || '0', 10),
    minor: parseInt(parts[1] || '0', 10),
    patch: parseInt(parts[2] || '0', 10),
  };
}

export class DependencyGraph {
  
  private nodes: Map<ModuleId, DependencyNode> = new Map();
  
  // ════════════════════════════════════════════════════════════
  // 模块管理
  // ════════════════════════════════════════════════════════════
  
  /**
   * 添加模块到依赖图
   */
  addModule(
    moduleId: ModuleId, 
    version: string | SemanticVersion, 
    dependencies: Dependency[]
  ): void {
    
    const parsedVersion = parseVersion(version);
    
    // 创建节点
    const node: DependencyNode = {
      moduleId,
      version: parsedVersion,
      dependencies,
      dependents: [],
    };
    
    // 建立反向依赖
    for (const dep of dependencies) {
      const depNode = this.nodes.get(dep.moduleId);
      if (depNode) {
        depNode.dependents.push(moduleId);
      }
    }
    
    this.nodes.set(moduleId, node);
  }
  
  /**
   * 从依赖图移除模块
   */
  removeModule(moduleId: ModuleId): void {
    const node = this.nodes.get(moduleId);
    if (!node) return;
    
    // 清除反向依赖
    for (const dep of node.dependencies) {
      const depNode = this.nodes.get(dep.moduleId);
      if (depNode) {
        depNode.dependents = depNode.dependents.filter(id => id !== moduleId);
      }
    }
    
    // 清除依赖此模块的节点的依赖
    for (const dependentId of node.dependents) {
      const dependentNode = this.nodes.get(dependentId);
      if (dependentNode) {
        dependentNode.dependencies = dependentNode.dependencies.filter(
          d => d.moduleId !== moduleId
        );
      }
    }
    
    this.nodes.delete(moduleId);
  }
  
  /**
   * 替换模块（保留依赖关系）
   */
  replaceModule(
    oldModuleId: ModuleId,
    newModuleId: ModuleId,
    version: string | SemanticVersion,
    dependencies: Dependency[]
  ): void {
    
    const oldNode = this.nodes.get(oldModuleId);
    
    // 获取旧模块的依赖者
    const dependents = oldNode ? [...oldNode.dependents] : [];
    
    // 移除旧模块
    this.removeModule(oldModuleId);
    
    // 添加新模块
    this.addModule(newModuleId, version, dependencies);
    
    // 恢复依赖者关系
    const newNode = this.nodes.get(newModuleId)!;
    newNode.dependents = dependents;
    
    // 更新依赖者的依赖
    for (const dependentId of dependents) {
      const dependentNode = this.nodes.get(dependentId);
      if (dependentNode) {
        for (const dep of dependentNode.dependencies) {
          if (dep.moduleId === oldModuleId) {
            dep.moduleId = newModuleId;
          }
        }
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 依赖查询
  // ════════════════════════════════════════════════════════════
  
  /**
   * 获取模块的所有依赖（递归）
   */
  getAllDependencies(moduleId: ModuleId, visited: Set<ModuleId> = new Set()): ModuleId[] {
    
    if (visited.has(moduleId)) return [];
    visited.add(moduleId);
    
    const node = this.nodes.get(moduleId);
    if (!node) return [];
    
    const result: ModuleId[] = [];
    
    for (const dep of node.dependencies) {
      if (dep.type === 'required') {
        result.push(dep.moduleId);
        result.push(...this.getAllDependencies(dep.moduleId, visited));
      }
    }
    
    return result;
  }
  
  /**
   * 获取依赖此模块的所有模块（递归）
   */
  getAllDependents(moduleId: ModuleId, visited: Set<ModuleId> = new Set()): ModuleId[] {
    
    if (visited.has(moduleId)) return [];
    visited.add(moduleId);
    
    const node = this.nodes.get(moduleId);
    if (!node) return [];
    
    const result: ModuleId[] = [];
    
    for (const dependentId of node.dependents) {
      result.push(dependentId);
      result.push(...this.getAllDependents(dependentId, visited));
    }
    
    return result;
  }
  
  /**
   * 获取直接依赖者
   */
  getDependents(moduleId: ModuleId): ModuleId[] {
    const node = this.nodes.get(moduleId);
    return node ? [...node.dependents] : [];
  }
  
  /**
   * 获取直接依赖
   */
  getDependencies(moduleId: ModuleId): Dependency[] {
    const node = this.nodes.get(moduleId);
    return node ? [...node.dependencies] : [];
  }
  
  // ════════════════════════════════════════════════════════════
  // 依赖解析
  // ════════════════════════════════════════════════════════════
  
  /**
   * 解析依赖，检查是否满足
   */
  resolve(moduleId: ModuleId): ResolutionResult {
    
    const missing: ResolutionResult['missing'] = [];
    const conflicts: ResolutionResult['conflicts'] = [];
    const visited = new Set<ModuleId>();
    
    // 递归检查
    this.resolveRecursive(moduleId, visited, missing, conflicts);
    
    // 检查循环依赖
    const cycles = this.detectCycles();
    if (cycles.length > 0) {
      // 循环依赖不阻止加载，但记录警告
      console.warn('检测到循环依赖:', cycles);
    }
    
    // 拓扑排序
    const order = this.topologicalSort(moduleId);
    
    return {
      satisfied: missing.length === 0 && conflicts.length === 0,
      missing,
      conflicts,
      order,
    };
  }
  
  private resolveRecursive(
    moduleId: ModuleId,
    visited: Set<ModuleId>,
    missing: ResolutionResult['missing'],
    conflicts: ResolutionResult['conflicts']
  ): void {
    
    if (visited.has(moduleId)) return;
    visited.add(moduleId);
    
    const node = this.nodes.get(moduleId);
    if (!node) return;
    
    for (const dep of node.dependencies) {
      const depNode = this.nodes.get(dep.moduleId);
      
      if (!depNode) {
        // 依赖缺失
        missing.push({
          moduleId: dep.moduleId,
          requiredRange: dep.versionRange,
        });
      } else {
        // 检查版本兼容
        if (!this.versionSatisfies(depNode.version, dep.versionRange)) {
          conflicts.push({
            moduleId: dep.moduleId,
            required: dep.versionRange,
            actual: depNode.version,
          });
        }
        
        // 递归检查
        this.resolveRecursive(dep.moduleId, visited, missing, conflicts);
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 拓扑排序
  // ════════════════════════════════════════════════════════════
  
  /**
   * 拓扑排序，返回加载顺序
   */
  topologicalSort(startModuleId?: ModuleId): ModuleId[] {
    
    const result: ModuleId[] = [];
    const visited = new Set<ModuleId>();
    const visiting = new Set<ModuleId>();
    
    const visit = (moduleId: ModuleId) => {
      if (visited.has(moduleId)) return;
      if (visiting.has(moduleId)) {
        // 检测到循环，跳过
        return;
      }
      
      visiting.add(moduleId);
      
      const node = this.nodes.get(moduleId);
      if (node) {
        // 先访问所有依赖
        for (const dep of node.dependencies) {
          visit(dep.moduleId);
        }
      }
      
      visiting.delete(moduleId);
      visited.add(moduleId);
      result.push(moduleId);
    };
    
    if (startModuleId) {
      visit(startModuleId);
    } else {
      // 从所有节点开始
      for (const moduleId of this.nodes.keys()) {
        visit(moduleId);
      }
    }
    
    return result;
  }
  
  // ════════════════════════════════════════════════════════════
  // 循环检测
  // ════════════════════════════════════════════════════════════
  
  /**
   * 检测循环依赖
   */
  detectCycles(): ModuleId[][] {
    
    const cycles: ModuleId[][] = [];
    const visited = new Set<ModuleId>();
    const recursionStack = new Set<ModuleId>();
    const path: ModuleId[] = [];
    
    const dfs = (moduleId: ModuleId) => {
      if (recursionStack.has(moduleId)) {
        // 找到循环
        const cycleStart = path.indexOf(moduleId);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), moduleId]);
        }
        return;
      }
      
      if (visited.has(moduleId)) return;
      
      visited.add(moduleId);
      recursionStack.add(moduleId);
      path.push(moduleId);
      
      const node = this.nodes.get(moduleId);
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep.moduleId);
        }
      }
      
      path.pop();
      recursionStack.delete(moduleId);
    };
    
    for (const moduleId of this.nodes.keys()) {
      dfs(moduleId);
    }
    
    return cycles;
  }
  
  // ════════════════════════════════════════════════════════════
  // 版本比较
  // ════════════════════════════════════════════════════════════
  
  /**
   * 检查版本是否满足范围
   */
  private versionSatisfies(version: SemanticVersion, range: VersionRange): boolean {
    
    // 检查最小版本
    if (range.min && this.compareVersions(version, range.min) < 0) {
      return false;
    }
    
    // 检查最大版本
    if (range.max && this.compareVersions(version, range.max) > 0) {
      return false;
    }
    
    // 检查排除版本
    if (range.exclude) {
      for (const excluded of range.exclude) {
        if (this.compareVersions(version, excluded) === 0) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 比较两个版本
   * @returns -1 if a < b, 0 if a == b, 1 if a > b
   */
  private compareVersions(a: SemanticVersion, b: SemanticVersion): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    if (a.patch !== b.patch) return a.patch - b.patch;
    return 0;
  }
  
  // ════════════════════════════════════════════════════════════
  // 影响分析
  // ════════════════════════════════════════════════════════════
  
  /**
   * 分析模块变更的影响范围
   */
  analyzeImpact(moduleId: ModuleId): {
    directDependents: ModuleId[];
    transitiveDependents: ModuleId[];
    affectedCapabilities: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    
    const directDependents = this.getDependents(moduleId);
    const transitiveDependents = this.getAllDependents(moduleId);
    
    // 分析风险级别
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (transitiveDependents.length > 10) {
      riskLevel = 'critical';
    } else if (transitiveDependents.length > 5) {
      riskLevel = 'high';
    } else if (transitiveDependents.length > 2) {
      riskLevel = 'medium';
    }
    
    // 检查是否影响核心模块
    const node = this.nodes.get(moduleId);
    if (node) {
      for (const dep of node.dependencies) {
        const depNode = this.nodes.get(dep.moduleId);
        if (depNode && depNode.dependents.length > 5) {
          riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
        }
      }
    }
    
    return {
      directDependents,
      transitiveDependents,
      affectedCapabilities: [],  // 需要从实际模块信息中获取
      riskLevel,
    };
  }
  
  /**
   * 获取完整的依赖图快照
   */
  getSnapshot(): Map<ModuleId, {
    version: SemanticVersion;
    dependencies: ModuleId[];
    dependents: ModuleId[];
  }> {
    
    const snapshot = new Map();
    
    for (const [id, node] of this.nodes) {
      snapshot.set(id, {
        version: node.version,
        dependencies: node.dependencies.map(d => d.moduleId),
        dependents: [...node.dependents],
      });
    }
    
    return snapshot;
  }
  
  /**
   * 从快照恢复
   */
  restoreFromSnapshot(
    snapshot: Map<ModuleId, {
      version: SemanticVersion;
      dependencies: ModuleId[];
      dependents: ModuleId[];
    }>
  ): void {
    
    this.nodes.clear();
    
    // 首先创建所有节点
    for (const [id, data] of snapshot) {
      this.nodes.set(id, {
        moduleId: id,
        version: data.version,
        dependencies: data.dependencies.map(depId => ({
          moduleId: depId,
          versionRange: {},
          type: 'required' as const,
          interfaceRequirements: {},
        })),
        dependents: data.dependents,
      });
    }
  }
}
