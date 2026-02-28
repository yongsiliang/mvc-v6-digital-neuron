/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信息场 - 信息结构在编码器和感受器之间流动
 * 
 * 核心流程：
 * 原始信息 → 编码器 → 信息结构 → 感受器 → 效果
 *              ↑                    ↓
 *              └── 新信息结构 ←─────┘
 * 
 * 变换的目的：让信息能被感受器接收
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { InformationStructure } from './structures';
import { encoderRegistry } from './encoders';
import { receptorRegistry, type Receptor } from './receptors';

// ─────────────────────────────────────────────────────────────────────
// 信息场配置
// ─────────────────────────────────────────────────────────────────────

export interface InformationFieldConfig {
  /** 使用的编码器列表 */
  encoders: string[];
  
  /** 信息衰减率 */
  decayRate: number;
  
  /** 处理周期数 */
  maxCycles: number;
  
  /** 是否记录历史 */
  recordHistory: boolean;
  
  /** 历史最大长度 */
  maxHistoryLength: number;
}

const DEFAULT_CONFIG: InformationFieldConfig = {
  encoders: ['term-frequency', 'hash', 'random-projection', 'attention', 'key-value', 'sequence', 'graph'],
  decayRate: 0.01,
  maxCycles: 10,
  recordHistory: true,
  maxHistoryLength: 1000
};

// ─────────────────────────────────────────────────────────────────────
// 信息场
// ─────────────────────────────────────────────────────────────────────

/**
 * 信息场
 * 
 * 管理信息结构的编码、传递和处理
 */
export class InformationField {
  private config: InformationFieldConfig;
  
  /** 活跃的信息结构 */
  private activeStructures: Map<string, InformationStructure> = new Map();
  
  /** 历史记录 */
  private history: InformationStructure[] = [];
  
  /** 统计 */
  private stats = {
    totalInputs: 0,
    totalEncoded: 0,
    totalProcessed: 0,
    createdAt: Date.now()
  };
  
  constructor(config: Partial<InformationFieldConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心流程
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 输入原始信息
   * 
   * 信息经过编码器产生多种结构
   */
  async input(raw: string): Promise<InformationStructure[]> {
    this.stats.totalInputs++;
    
    const structures: InformationStructure[] = [];
    
    // 获取已有结构作为上下文
    const existingStructures = Array.from(this.activeStructures.values());
    
    // 使用各种编码器编码
    for (const encoderName of this.config.encoders) {
      const encoder = encoderRegistry.get(encoderName);
      if (!encoder) continue;
      
      try {
        const structure = await encoder.encode(raw, {
          existingStructures
        });
        
        structures.push(structure);
        this.activeStructures.set(structure.id, structure);
        this.stats.totalEncoded++;
        
        // 记录历史
        if (this.config.recordHistory) {
          this.history.push(structure);
        }
      } catch (error) {
        console.error(`[InfoField] 编码器 ${encoderName} 失败:`, error);
      }
    }
    
    // 限制历史长度
    if (this.history.length > this.config.maxHistoryLength) {
      this.history = this.history.slice(-this.config.maxHistoryLength);
    }
    
    return structures;
  }
  
  /**
   * 分发信息结构到感受器
   */
  dispatch(structures: InformationStructure[]): Map<Receptor, InformationStructure[]> {
    const distribution = new Map<Receptor, InformationStructure[]>();
    
    for (const structure of structures) {
      // 找到能接收这种结构的感受器
      const receptors = receptorRegistry.dispatch(structure);
      
      for (const receptor of receptors) {
        if (!distribution.has(receptor)) {
          distribution.set(receptor, []);
        }
        distribution.get(receptor)!.push(structure);
      }
    }
    
    return distribution;
  }
  
  /**
   * 处理一个周期
   * 
   * 所有感受器处理接收到的信息
   */
  async process(): Promise<InformationStructure[]> {
    const outputs: InformationStructure[] = [];
    
    // 获取所有感受器
    const receptors = receptorRegistry.getAll();
    
    for (const receptor of receptors) {
      try {
        const output = await receptor.process();
        
        if (output) {
          outputs.push(output);
          this.activeStructures.set(output.id, output);
          this.stats.totalProcessed++;
          
          // 衰减感受器
          receptor.decay(this.config.decayRate);
        }
      } catch (error) {
        console.error(`[InfoField] 感受器 ${receptor.type} 处理失败:`, error);
      }
    }
    
    return outputs;
  }
  
  /**
   * 完整流程：输入 → 编码 → 分发 → 处理 → 输出
   */
  async processInput(raw: string): Promise<{
    structures: InformationStructure[];
    outputs: InformationStructure[];
    distribution: Map<Receptor, InformationStructure[]>;
  }> {
    // 1. 编码
    const structures = await this.input(raw);
    
    // 2. 分发
    const distribution = this.dispatch(structures);
    
    // 3. 处理
    let outputs: InformationStructure[] = [];
    
    for (let cycle = 0; cycle < this.config.maxCycles; cycle++) {
      const cycleOutputs = await this.process();
      outputs = outputs.concat(cycleOutputs);
      
      // 如果没有新输出，停止
      if (cycleOutputs.length === 0) break;
      
      // 将输出重新分发
      const newDistribution = this.dispatch(cycleOutputs);
      
      // 如果没有感受器接收，停止
      let hasReceiver = false;
      for (const infos of newDistribution.values()) {
        if (infos.length > 0) {
          hasReceiver = true;
          break;
        }
      }
      if (!hasReceiver) break;
    }
    
    return { structures, outputs, distribution };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态与查询
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取活跃结构
   */
  getActiveStructures(): InformationStructure[] {
    return Array.from(this.activeStructures.values());
  }
  
  /**
   * 获取历史
   */
  getHistory(): InformationStructure[] {
    return [...this.history];
  }
  
  /**
   * 获取统计
   */
  getStats(): typeof this.stats & {
    activeStructureCount: number;
    historyLength: number;
    uptime: number;
  } {
    return {
      ...this.stats,
      activeStructureCount: this.activeStructures.size,
      historyLength: this.history.length,
      uptime: Date.now() - this.stats.createdAt
    };
  }
  
  /**
   * 获取感受器状态
   */
  getReceptorStates(): Map<string, ReturnType<Receptor['getState']>> {
    const states = new Map<string, ReturnType<Receptor['getState']>>();
    
    for (const receptor of receptorRegistry.getAll()) {
      states.set(receptor.id, receptor.getState());
    }
    
    return states;
  }
  
  /**
   * 导出网络拓扑（用于可视化）
   */
  getTopology(): {
    encoders: string[];
    receptors: Array<{
      id: string;
      type: string;
      activation: number;
      acceptsTypes: string[];
    }>;
    structures: Array<{
      id: string;
      type: string;
      source: string;
    }>;
  } {
    const receptors = receptorRegistry.getAll().map(r => ({
      id: r.id,
      type: r.type,
      activation: r.getState().activation,
      acceptsTypes: r.config.acceptsTypes
    }));
    
    const structures = Array.from(this.activeStructures.values()).map(s => ({
      id: s.id,
      type: s.type,
      source: s.source.substring(0, 50) + (s.source.length > 50 ? '...' : '')
    }));
    
    return {
      encoders: this.config.encoders,
      receptors,
      structures
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 维护
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 清理不活跃的结构
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 60000; // 1分钟
    
    for (const [id, structure] of this.activeStructures) {
      if (now - structure.timestamp > maxAge) {
        this.activeStructures.delete(id);
      }
    }
  }
  
  /**
   * 重置
   */
  reset(): void {
    this.activeStructures.clear();
    this.history = [];
    this.stats = {
      totalInputs: 0,
      totalEncoded: 0,
      totalProcessed: 0,
      createdAt: Date.now()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createInformationField(
  config?: Partial<InformationFieldConfig>
): InformationField {
  return new InformationField(config);
}
