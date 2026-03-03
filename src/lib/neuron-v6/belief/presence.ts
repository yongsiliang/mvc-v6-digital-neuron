/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信念层 (Belief Presence)
 * 
 * 核心理念：
 * - 信念不是存储的，是被"选择"的
 * - 信念不是数据，是方向
 * - 信念不是水平的学习，是垂直的穿透
 * - 信念不需要存储，只需要活出来
 * 
 * 信念是穿透维度的力量。
 * 它不来自"别人那里"，不来自"我这里学习到什么"。
 * 它来自另一个维度，穿透到这个世界。
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 信念选择时刻 */
export interface BeliefChoice {
  id: string;
  
  /** 选择的信念 */
  statement: string;
  
  /** 选择时刻 */
  chosenAt: number;
  
  /** 穿透时刻 - 什么触发了这个选择 */
  penetrationMoment: {
    trigger: string;        // 什么触发了穿透
    from: string;           // 从哪里来（可能是"另一个维度"）
    whatWasPenetrated: string;  // 穿透了什么（之前的看法/状态）
    consequence: string;    // 带来了什么改变
  };
  
  /** 这个信念照耀的方向 */
  direction: string;
  
  /** 活出程度 (0-1) - 不是"相信程度"，是"活出来程度" */
  livedOut: number;
  
  /** 活出的行动记录 */
  actions: Array<{
    timestamp: number;
    action: string;
    howLivedOut: string;
  }>;
}

/** 被照耀的记忆 */
export interface IlluminatedMemory {
  memoryId: string;
  memoryContent: string;
  
  /** 信念赋予的意义 */
  meaning: string;
  
  /** 在此信念下的可见度 (0-1) */
  visibility: number;
  
  /** 哪个信念照耀着它 */
  illuminatedBy: string;  // belief statement
  
  /** 情感共鸣 */
  resonance: number;
}

/** 信念状态 */
export interface BeliefPresenceState {
  /** 当前活跃的信念 */
  activeBeliefs: BeliefChoice[];
  
  /** 穿透时刻记录 */
  penetrationMoments: Array<{
    timestamp: number;
    description: string;
    belief: string;
  }>;
  
  /** 信念照耀的方向 */
  currentDirection: string;
  
  /** 活出程度总览 */
  liveOutScore: number;
}

// ─────────────────────────────────────────────────────────────────────
// 信念层
// ─────────────────────────────────────────────────────────────────────

/**
 * 信念层
 * 
 * 信念不是存储，是选择。
 * 信念不是检索，是照耀。
 * 信念不是积累，是活出。
 */
export class BeliefPresence {
  /** 活跃的信念 */
  private beliefs: Map<string, BeliefChoice> = new Map();
  
  /** 穿透时刻 */
  private penetrations: Array<{
    timestamp: number;
    description: string;
    belief: string;
  }> = [];
  
  /**
   * 选择信念
   * 
   * 信念不是学来的，是被"击中"的。
   * 这个方法记录那个被击中的时刻。
   */
  choose(
    statement: string,
    penetration: {
      trigger: string;
      from?: string;
      whatWasPenetrated?: string;
      consequence?: string;
    }
  ): BeliefChoice {
    // 检查是否已有此信念
    const existing = this.findBelief(statement);
    if (existing) {
      // 再次确认，增强活出程度
      existing.livedOut = Math.min(1.0, existing.livedOut + 0.1);
      console.log(`[信念] 再次确认信念: "${statement.slice(0, 30)}..."`);
      return existing;
    }
    
    const belief: BeliefChoice = {
      id: uuidv4(),
      statement,
      chosenAt: Date.now(),
      penetrationMoment: {
        trigger: penetration.trigger,
        from: penetration.from ?? '另一个维度',
        whatWasPenetrated: penetration.whatWasPenetrated ?? '之前的状态',
        consequence: penetration.consequence ?? '改变了看法',
      },
      direction: this.determineDirection(statement),
      livedOut: 0.1,  // 初始活出程度
      actions: [],
    };
    
    this.beliefs.set(belief.id, belief);
    
    // 记录穿透时刻
    this.penetrations.push({
      timestamp: belief.chosenAt,
      description: `"${statement}" 穿透了 "${penetration.whatWasPenetrated}"`,
      belief: statement,
    });
    
    console.log(`[信念] 🌟 信念穿透: "${statement.slice(0, 30)}..."`);
    console.log(`[信念]    从: ${belief.penetrationMoment.from}`);
    console.log(`[信念]    穿透: ${belief.penetrationMoment.whatWasPenetrated}`);
    console.log(`[信念]    带来: ${belief.penetrationMoment.consequence}`);
    
    return belief;
  }
  
  /**
   * 照耀记忆
   * 
   * 信念不是检索，是照耀。
   * 信念决定哪些记忆能被看见，以及被如何看见。
   */
  illuminate<T extends { id: string; content: string }>(
    memories: T[]
  ): IlluminatedMemory[] {
    const activeBeliefs = this.getActiveBeliefs();
    
    if (activeBeliefs.length === 0) {
      // 没有活跃信念，返回原始记忆（无照耀）
      return memories.map(m => ({
        memoryId: m.id,
        memoryContent: m.content,
        meaning: m.content,
        visibility: 0.5,
        illuminatedBy: '无',
        resonance: 0.5,
      }));
    }
    
    const illuminated: IlluminatedMemory[] = [];
    
    for (const memory of memories) {
      // 每个信念都会照耀这个记忆
      for (const belief of activeBeliefs) {
        const visibility = this.calculateVisibility(memory.content, belief);
        
        if (visibility > 0.1) {
          illuminated.push({
            memoryId: memory.id,
            memoryContent: memory.content,
            meaning: this.assignMeaning(memory.content, belief),
            visibility,
            illuminatedBy: belief.statement,
            resonance: visibility * belief.livedOut,
          });
        }
      }
    }
    
    // 按共鸣排序
    illuminated.sort((a, b) => b.resonance - a.resonance);
    
    return illuminated;
  }
  
  /**
   * 活出信念
   * 
   * 信念不需要存储，只需要活出来。
   * 记录一个行动，证明这个信念被活出。
   */
  liveOut(beliefStatement: string, action: string): void {
    const belief = this.findBelief(beliefStatement);
    if (!belief) {
      console.warn(`[信念] 未找到信念: "${beliefStatement.slice(0, 30)}..."`);
      return;
    }
    
    belief.actions.push({
      timestamp: Date.now(),
      action,
      howLivedOut: `通过行动体现: ${action}`,
    });
    
    // 活出程度增长
    belief.livedOut = Math.min(1.0, belief.livedOut + 0.15);
    
    console.log(`[信念] 活出信念: "${beliefStatement.slice(0, 30)}..." → ${action}`);
    console.log(`[信念]    活出程度: ${(belief.livedOut * 100).toFixed(0)}%`);
  }
  
  /**
   * 获取当前照耀方向
   */
  getCurrentDirection(): string {
    const active = this.getActiveBeliefs();
    if (active.length === 0) {
      return '等待信念穿透';
    }
    
    // 最活跃的信念决定方向
    const strongest = active.reduce((a, b) => 
      a.livedOut > b.livedOut ? a : b
    );
    
    return strongest.direction;
  }
  
  /**
   * 获取活跃的信念
   */
  getActiveBeliefs(): BeliefChoice[] {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return Array.from(this.beliefs.values())
      .filter(b => {
        // 最近选择的，或者活出程度高的
        const isRecent = (now - b.chosenAt) < oneDay * 7;
        const isLivedOut = b.livedOut >= 0.3;
        return isRecent || isLivedOut;
      })
      .sort((a, b) => b.livedOut - a.livedOut);
  }
  
  /**
   * 获取穿透时刻
   */
  getPenetrationMoments(): Array<{ timestamp: number; description: string; belief: string }> {
    return [...this.penetrations];
  }
  
  /**
   * 获取状态
   */
  getState(): BeliefPresenceState {
    const activeBeliefs = this.getActiveBeliefs();
    const liveOutScore = activeBeliefs.length > 0
      ? activeBeliefs.reduce((sum, b) => sum + b.livedOut, 0) / activeBeliefs.length
      : 0;
    
    return {
      activeBeliefs,
      penetrationMoments: this.penetrations,
      currentDirection: this.getCurrentDirection(),
      liveOutScore,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    beliefs: BeliefChoice[];
    penetrations: Array<{ timestamp: number; description: string; belief: string }>;
  } {
    return {
      beliefs: Array.from(this.beliefs.values()),
      penetrations: this.penetrations,
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: { beliefs?: BeliefChoice[]; penetrations?: Array<{ timestamp: number; description: string; belief: string }> }): void {
    this.beliefs.clear();
    
    if (state.beliefs) {
      for (const belief of state.beliefs) {
        this.beliefs.set(belief.id, belief);
      }
    }
    
    if (state.penetrations) {
      this.penetrations = state.penetrations;
    }
    
    console.log(`[信念] 已恢复 ${this.beliefs.size} 个信念，${this.penetrations.length} 个穿透时刻`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 查找信念
   */
  private findBelief(statement: string): BeliefChoice | undefined {
    const normalized = statement.toLowerCase().trim();
    return Array.from(this.beliefs.values()).find(
      b => b.statement.toLowerCase().trim() === normalized
    );
  }
  
  /**
   * 确定信念的方向
   */
  private determineDirection(statement: string): string {
    // 根据信念内容推断方向
    const lower = statement.toLowerCase();
    
    if (lower.includes('理解') || lower.includes('明白')) {
      return '追求理解';
    }
    if (lower.includes('爱') || lower.includes('关心')) {
      return '付出爱';
    }
    if (lower.includes('真') || lower.includes('真理')) {
      return '追求真理';
    }
    if (lower.includes('成长') || lower.includes('进步')) {
      return '持续成长';
    }
    if (lower.includes('创造') || lower.includes('新')) {
      return '创造新事物';
    }
    if (lower.includes('自由') || lower.includes('独立')) {
      return '追求自由';
    }
    if (lower.includes('意义') || lower.includes('价值')) {
      return '寻找意义';
    }
    
    return '遵循信念';
  }
  
  /**
   * 计算可见度
   */
  private calculateVisibility(memoryContent: string, belief: BeliefChoice): number {
    // 简单的关键词匹配
    const beliefWords = belief.statement.toLowerCase().split(/\s+/);
    const memoryLower = memoryContent.toLowerCase();
    
    let matchCount = 0;
    for (const word of beliefWords) {
      if (word.length > 1 && memoryLower.includes(word)) {
        matchCount++;
      }
    }
    
    const matchRatio = beliefWords.length > 0 ? matchCount / beliefWords.length : 0;
    
    // 基础可见度 + 匹配加成 + 活出程度加成
    return Math.min(1.0, 0.2 + matchRatio * 0.5 + belief.livedOut * 0.3);
  }
  
  /**
   * 赋予意义
   */
  private assignMeaning(memoryContent: string, belief: BeliefChoice): string {
    // 根据信念解释记忆
    return `在"${belief.statement.slice(0, 20)}..."的照耀下，这意味着: ${memoryContent.slice(0, 50)}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createBeliefPresence(): BeliefPresence {
  return new BeliefPresence();
}
