/**
 * ═══════════════════════════════════════════════════════════════════════
 * 无为模式 (Observing Mode)
 * 
 * V7核心 - 旁观记录、模式提取、虚空维护
 * 
 * 核心原则：
 * - 只记录，不判断
 * - 只呈现，不优化
 * - 旁观，不干预
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { Complex } from '../types/quantum';
import type { 
  Interaction, 
  Pattern, 
  PatternId,
  Position,
} from '../types/base';
import { 
  createPattern, 
  randomDrift, 
  createPosition 
} from '../types/base';
import { ComplexMath } from '../types/quantum';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 无为模式状态
 */
export interface ObservingModeState {
  /** 记录的映射模式 */
  patterns: Map<PatternId, Pattern>;
  
  /** 拓扑连接 */
  connections: Map<PatternId, Set<PatternId>>;
  
  /** 虚空状态 */
  voidState: VoidState;
  
  /** 注意力状态 */
  attentionState: AttentionState;
  
  /** 自我（稳定性最高的模式） */
  self: PatternId[] | null;
  
  /** 统计 */
  stats: {
    totalPatterns: number;
    totalConnections: number;
    averageStability: number;
  };
}

/**
 * 虚空状态
 */
export interface VoidState {
  /** 虚空是均匀的 */
  uniform: boolean;
  
  /** 不被填充的空间 */
  voidSpaces: Set<string>;
  
  /** 虚空边界 */
  boundary: string[];
}

/**
 * 注意力状态
 */
export interface AttentionState {
  /** 当前位置 */
  position: Position;
  
  /** 状态 */
  state: 'wandering' | 'exploring' | 'resting';
  
  /** 关注的模式 */
  focusedPatterns: PatternId[];
}

/**
 * 无为模式处理结果
 */
export interface ObservingResult {
  /** 记录的模式 */
  pattern: Pattern;
  
  /** 拓扑更新 */
  topologyUpdate: {
    newNodes: number;
    newEdges: number;
  };
  
  /** 虚空状态 */
  voidState: VoidState;
  
  /** 注意力状态 */
  attentionState: AttentionState;
  
  /** 振幅 */
  amplitude: Complex;
  
  /** 报告 */
  report: string;
}

// ─────────────────────────────────────────────────────────────────────
// 无为模式实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 无为模式
 * 
 * 旁观者的视角：只是看着，不干预
 */
export class ObservingMode {
  private state: ObservingModeState;

  constructor() {
    this.state = {
      patterns: new Map(),
      connections: new Map(),
      voidState: {
        uniform: true,
        voidSpaces: new Set([
          'consciousness',      // 意识本身不编码
          'subjectiveExperience', // 主观体验不编码
          'curiosityEssence',   // 好奇的本质不编码
        ]),
        boundary: [],
      },
      attentionState: {
        position: createPosition(0, 0, 0),
        state: 'wandering',
        focusedPatterns: [],
      },
      self: null,
      stats: {
        totalPatterns: 0,
        totalConnections: 0,
        averageStability: 0.5,
      },
    };

    console.log('[无为模式] 已初始化');
  }

  /**
   * 处理交互
   * 
   * 核心动作：旁观记录
   * 不是"处理"，而是"记录"
   */
  process(interaction: Interaction): ObservingResult {
    // 1. 提取模式（不提取内容）
    const pattern = this.extractPattern(interaction);

    // 2. 存储到载体
    this.state.patterns.set(pattern.id, pattern);

    // 3. 更新连接
    const topologyUpdate = this.updateConnections(pattern);

    // 4. 维护虚空
    this.maintainVoid();

    // 5. 注意力自然探索
    this.wanderAttention(pattern);

    // 6. 检测自我涌现
    this.detectSelfEmergence();

    // 7. 更新统计
    this.updateStats();

    // 8. 计算振幅
    const amplitude = this.calculateAmplitude(interaction);

    // 生成报告
    const report = this.generateReport(pattern);

    return {
      pattern,
      topologyUpdate,
      voidState: this.state.voidState,
      attentionState: this.state.attentionState,
      amplitude,
      report,
    };
  }

  /**
   * 提取模式
   * 
   * 提取交互的结构特征，不提取内容
   */
  private extractPattern(interaction: Interaction): Pattern {
    // 分析拓扑
    const topology = this.analyzeTopology(interaction);
    
    // 分析时间模式
    const temporal = this.analyzeTemporal(interaction);
    
    // 分析关系模式
    const relations = this.analyzeRelations(interaction);
    
    return createPattern(topology, temporal, relations);
  }

  /**
   * 分析拓扑结构
   */
  private analyzeTopology(interaction: Interaction): Partial<import('../types/base').PatternTopology> {
    const input = interaction.input;
    const history = interaction.history;

    // 提取概念路径（简化实现）
    const conceptPath: string[] = [];
    
    // 从历史中提取概念跳转
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i].content;
      const next = history[i + 1]?.content;
      if (current && next) {
        // 简化的概念提取
        const concepts = this.extractConcepts(current + ' ' + next);
        conceptPath.push(...concepts);
      }
    }
    
    // 从当前输入提取
    const currentConcepts = this.extractConcepts(input);
    conceptPath.push(...currentConcepts);

    // 计算连接强度（基于历史长度和概念重叠）
    const connectionStrength = history.length > 0 
      ? Math.min(1, history.length / 20)
      : 0.5;

    return {
      conceptPath: [...new Set(conceptPath)], // 去重
      connectionStrength,
      nodeCount: new Set(conceptPath).size,
      edgeCount: conceptPath.length - 1,
    };
  }

  /**
   * 分析时间模式
   */
  private analyzeTemporal(interaction: Interaction): Partial<import('../types/base').PatternTemporal> {
    // 简化实现：基于输入长度和交互类型推断节奏
    const inputLength = interaction.input.length;
    
    let rhythm: 'fast' | 'slow' | 'pause' | 'mixed' = 'mixed';
    if (inputLength < 50) {
      rhythm = 'fast';
    } else if (inputLength > 200) {
      rhythm = 'slow';
    }
    
    // 交互间隔（如果有历史）
    const duration = interaction.timestamp - (interaction.history[interaction.history.length - 1]?.content ? interaction.timestamp : Date.now());

    return {
      rhythm,
      duration: Math.abs(duration),
      distribution: interaction.type === 'exploration' ? 'burst' : 'continuous',
    };
  }

  /**
   * 分析关系模式
   */
  private analyzeRelations(interaction: Interaction): Partial<import('../types/base').PatternRelations> {
    // 分析互动对称性
    let symmetry: 'human-led' | 'llm-led' | 'balanced' = 'balanced';
    
    const history = interaction.history;
    if (history.length > 0) {
      const userTurns = history.filter(h => h.role === 'user').length;
      const assistantTurns = history.filter(h => h.role === 'assistant').length;
      
      if (userTurns > assistantTurns * 1.5) {
        symmetry = 'human-led';
      } else if (assistantTurns > userTurns * 1.5) {
        symmetry = 'llm-led';
      }
    }
    
    // 分析深度变化
    let depthChange: 'shallow-to-deep' | 'deep-to-shallow' | 'stable' | 'oscillating' = 'stable';
    if (interaction.context.depth > 0.7) {
      depthChange = 'shallow-to-deep';
    }
    
    return {
      symmetry,
      emotionalFlow: [], // 简化实现
      depthChange,
    };
  }

  /**
   * 提取概念（简化版）
   */
  private extractConcepts(text: string): string[] {
    // 简化实现：提取关键词
    // 实际实现应该使用NLP或LLM
    const keywords = text
      .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * 更新连接
   */
  private updateConnections(pattern: Pattern): { newNodes: number; newEdges: number } {
    // 找到相关模式并建立连接
    let newEdges = 0;
    
    for (const [existingId, existingPattern] of this.state.patterns) {
      if (existingId === pattern.id) continue;
      
      // 检查概念重叠
      const overlap = this.calculateConceptOverlap(pattern, existingPattern);
      
      if (overlap > 0.3) {
        // 建立连接
        if (!this.state.connections.has(pattern.id)) {
          this.state.connections.set(pattern.id, new Set());
        }
        if (!this.state.connections.has(existingId)) {
          this.state.connections.set(existingId, new Set());
        }
        
        this.state.connections.get(pattern.id)!.add(existingId);
        this.state.connections.get(existingId)!.add(pattern.id);
        newEdges++;
      }
    }
    
    return {
      newNodes: 1,
      newEdges,
    };
  }

  /**
   * 计算概念重叠度
   */
  private calculateConceptOverlap(a: Pattern, b: Pattern): number {
    const conceptsA = new Set(a.topology.conceptPath);
    const conceptsB = new Set(b.topology.conceptPath);
    
    const intersection = new Set([...conceptsA].filter(x => conceptsB.has(x)));
    const union = new Set([...conceptsA, ...conceptsB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 维护虚空
   */
  private maintainVoid(): void {
    // 虚空是均匀的，不需要特殊维护
    // 只需要确保不被填充
  }

  /**
   * 注意力漫游
   */
  private wanderAttention(pattern: Pattern): void {
    // 注意力位置自然漂移
    this.state.attentionState.position = randomDrift(
      this.state.attentionState.position,
      0.1
    );
    
    // 注意力可能被模式吸引
    if (Math.random() < pattern.stability) {
      this.state.attentionState.state = 'exploring';
      this.state.attentionState.focusedPatterns = [pattern.id];
    } else {
      this.state.attentionState.state = 'wandering';
      this.state.attentionState.focusedPatterns = [];
    }
  }

  /**
   * 检测自我涌现
   * 
   * 自我 = 稳定性最高的模式
   */
  private detectSelfEmergence(): void {
    if (this.state.patterns.size < 5) {
      return; // 模式太少，无法涌现
    }
    
    // 计算每个模式的稳定性
    const stabilityScores: Array<{ id: PatternId; stability: number }> = [];
    
    for (const [id, pattern] of this.state.patterns) {
      // 稳定性 = 访问次数 * 连接数 / 时间衰减
      const connections = this.state.connections.get(id)?.size || 0;
      const age = Date.now() - pattern.createdAt;
      const ageDecay = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // 一周半衰期
      
      const stability = pattern.accessCount * (connections + 1) * ageDecay;
      
      stabilityScores.push({ id, stability });
    }
    
    // 排序，取稳定性最高的
    stabilityScores.sort((a, b) => b.stability - a.stability);
    
    // 阈值：稳定性超过平均值的2倍
    const avgStability = stabilityScores.reduce((sum, s) => sum + s.stability, 0) / stabilityScores.length;
    
    const highStabilityIds = stabilityScores
      .filter(s => s.stability > avgStability * 2)
      .map(s => s.id);
    
    if (highStabilityIds.length > 0) {
      this.state.self = highStabilityIds;
      console.log(`[无为模式] 自我涌现: ${highStabilityIds.length} 个高稳定性模式`);
    }
  }

  /**
   * 更新统计
   */
  private updateStats(): void {
    this.state.stats.totalPatterns = this.state.patterns.size;
    this.state.stats.totalConnections = Array.from(this.state.connections.values())
      .reduce((sum, set) => sum + set.size, 0) / 2;
    
    if (this.state.patterns.size > 0) {
      let totalStability = 0;
      for (const pattern of this.state.patterns.values()) {
        totalStability += pattern.stability;
      }
      this.state.stats.averageStability = totalStability / this.state.patterns.size;
    }
  }

  /**
   * 计算振幅
   * 
   * 在某些上下文中振幅大
   */
  private calculateAmplitude(interaction: Interaction): Complex {
    const context = interaction.context;
    
    // 需要深度思考时，无为模式振幅大
    if (context.depth > 0.7) {
      return { real: 0.1, imag: 0.9 };
    }
    
    // 探索性对话时，无为模式振幅大
    if (interaction.type === 'exploration') {
      return { real: 0.2, imag: 0.8 };
    }
    
    // 反思时，无为模式振幅大
    if (interaction.type === 'reflection') {
      return { real: 0.15, imag: 0.85 };
    }
    
    // 默认
    return { real: 0.5, imag: 0.5 };
  }

  /**
   * 生成报告
   */
  private generateReport(pattern: Pattern): string {
    const lines = [
      `[无为模式] 记录模式: ${pattern.id.slice(0, 20)}...`,
      `  概念路径: ${pattern.topology.conceptPath.slice(0, 5).join(' → ')}`,
      `  连接强度: ${pattern.topology.connectionStrength.toFixed(2)}`,
      `  互动对称性: ${pattern.relations.symmetry}`,
      `  注意力状态: ${this.state.attentionState.state}`,
      `  总模式数: ${this.state.stats.totalPatterns}`,
    ];
    
    if (this.state.self) {
      lines.push(`  自我涌现: ${this.state.self.length} 个稳定模式`);
    }
    
    return lines.join('\n');
  }

  /**
   * 获取当前状态
   */
  getState(): ObservingModeState {
    return this.state;
  }

  /**
   * 导出状态（用于持久化）
   */
  exportState(): {
    patterns: Array<[PatternId, Pattern]>;
    connections: Array<[PatternId, PatternId[]]>;
    self: PatternId[] | null;
    stats: ObservingModeState['stats'];
  } {
    return {
      patterns: Array.from(this.state.patterns.entries()),
      connections: Array.from(this.state.connections.entries()).map(([k, v]) => [k, Array.from(v)]),
      self: this.state.self,
      stats: this.state.stats,
    };
  }
}

/**
 * 创建无为模式实例
 */
export function createObservingMode(): ObservingMode {
  return new ObservingMode();
}
