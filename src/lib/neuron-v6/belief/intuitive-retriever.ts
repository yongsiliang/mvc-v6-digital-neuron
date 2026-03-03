/**
 * ═══════════════════════════════════════════════════════════════════════
 * 直觉检索器 (Intuitive Retriever)
 * 
 * 核心理念：
 * - 直觉是信念的影子
 * - 检索不是客观匹配，是信念驱动的看见
 * - 信念照耀什么，什么就被看见
 * - 没有信念，记忆只是数据；有了信念，记忆有了意义
 * 
 * 与传统检索的区别：
 * 
 * 传统检索：
 *   query → 相似度匹配 → 排序 → 返回
 *   （客观、可重复、无视角）
 * 
 * 直觉检索：
 *   query → 信念激活 → 信念照耀 → 看见 → 返回
 *   （主观、有视角、有意义）
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { BeliefPresence, BeliefChoice, IlluminatedMemory } from './presence';
import type { UnifiedMemoryManager } from '../memory/unified-manager';
import type { WorkingMemoryItem } from '../memory/working-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 直觉检索结果 */
export interface IntuitiveRetrievalResult {
  /** 被看见的记忆 */
  seen: SeenMemory[];
  
  /** 激活的信念 */
  activatedBeliefs: Array<{
    belief: string;
    statement: string;  // 信念内容
    activationStrength: number;
    whyActivated: string;
  }>;
  
  /** 直觉提示（信念在暗处的低语） */
  intuition: string;
  
  /** 看见摘要 */
  seeingSummary: string;
  
  /** 信念的方向 */
  direction: string;
}

/** 被看见的记忆 */
export interface SeenMemory {
  content: string;
  source: 'working' | 'layered' | 'happening';
  
  /** 信念赋予的意义 */
  meaning: string;
  
  /** 看见程度 (0-1) */
  visibility: number;
  
  /** 哪个信念让我看见了它 */
  seenThrough: string;
  
  /** 情感共鸣 */
  resonance: number;
}

/** 直觉检索选项 */
export interface IntuitiveRetrievalOptions {
  /** 最大结果数 */
  maxResults: number;
  
  /** 最小可见度阈值 */
  minVisibility: number;
  
  /** 是否包含工作记忆 */
  includeWorking: boolean;
  
  /** 是否包含分层记忆 */
  includeLayered: boolean;
  
  /** 是否包含发生记录 */
  includeHappenings: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 默认选项
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: IntuitiveRetrievalOptions = {
  maxResults: 10,
  minVisibility: 0.2,
  includeWorking: true,
  includeLayered: true,
  includeHappenings: true,
};

// ─────────────────────────────────────────────────────────────────────
// 直觉检索器
// ─────────────────────────────────────────────────────────────────────

/**
 * 直觉检索器
 */
export class IntuitiveRetriever {
  private beliefPresence: BeliefPresence;
  private memoryManager: UnifiedMemoryManager | null;
  
  constructor(
    beliefPresence: BeliefPresence,
    memoryManager?: UnifiedMemoryManager
  ) {
    this.beliefPresence = beliefPresence;
    this.memoryManager = memoryManager ?? null;
  }
  
  /**
   * 直觉检索
   * 
   * 不是匹配，是看见。
   * 看见什么，取决于信念照耀的方向。
   */
  retrieve(
    query: string,
    options: Partial<IntuitiveRetrievalOptions> = {}
  ): IntuitiveRetrievalResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // 1. 激活相关信念
    const activatedBeliefsRaw = this.activateBeliefs(query);
    
    // 2. 收集所有记忆
    const allMemories = this.collectMemories(opts);
    
    // 3. 信念照耀
    const seen = this.illuminateMemories(allMemories, activatedBeliefsRaw, opts);
    
    // 4. 生成直觉提示
    const intuition = this.generateIntuition(query, activatedBeliefsRaw, seen);
    
    // 5. 生成看见摘要
    const seeingSummary = this.generateSeeingSummary(seen, activatedBeliefsRaw);
    
    // 6. 获取方向
    const direction = this.beliefPresence.getCurrentDirection();
    
    // 转换为输出格式
    const activatedBeliefs = activatedBeliefsRaw.map(ab => ({
      belief: ab.belief.id,
      statement: ab.belief.statement,
      activationStrength: ab.activationStrength,
      whyActivated: ab.whyActivated,
    }));
    
    return {
      seen,
      activatedBeliefs,
      intuition,
      seeingSummary,
      direction,
    };
  }
  
  /**
   * 更新记忆管理器
   */
  setMemoryManager(manager: UnifiedMemoryManager): void {
    this.memoryManager = manager;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 激活信念
   */
  private activateBeliefs(query: string): Array<{
    belief: BeliefChoice;
    activationStrength: number;
    whyActivated: string;
  }> {
    const activeBeliefs = this.beliefPresence.getActiveBeliefs();
    const queryLower = query.toLowerCase();
    
    const activated: Array<{
      belief: BeliefChoice;
      activationStrength: number;
      whyActivated: string;
    }> = [];
    
    for (const belief of activeBeliefs) {
      const beliefLower = belief.statement.toLowerCase();
      
      // 计算激活强度
      let strength = 0;
      let why = '';
      
      // 直接提及
      if (beliefLower.includes(queryLower) || queryLower.includes(beliefLower)) {
        strength = 0.8;
        why = '查询直接相关';
      }
      // 关键词匹配
      else {
        const beliefWords = beliefLower.split(/\s+/).filter(w => w.length > 1);
        const matchCount = beliefWords.filter(w => queryLower.includes(w)).length;
        
        if (matchCount > 0) {
          strength = 0.3 + matchCount * 0.2;
          why = `关键词匹配: ${matchCount}`;
        }
      }
      
      // 活出程度加成
      strength *= (0.5 + belief.livedOut * 0.5);
      
      if (strength > 0.1) {
        activated.push({
          belief,
          activationStrength: strength,
          whyActivated: why,
        });
      }
    }
    
    // 按激活强度排序
    activated.sort((a, b) => b.activationStrength - a.activationStrength);
    
    return activated;
  }
  
  /**
   * 收集记忆
   */
  private collectMemories(opts: IntuitiveRetrievalOptions): Array<{
    content: string;
    source: 'working' | 'layered' | 'happening';
  }> {
    const memories: Array<{
      content: string;
      source: 'working' | 'layered' | 'happening';
    }> = [];
    
    if (!this.memoryManager) {
      return memories;
    }
    
    // 从工作记忆收集
    if (opts.includeWorking) {
      const workingState = this.memoryManager.getWorkingMemoryState();
      for (const item of workingState.items) {
        memories.push({
          content: item.content,
          source: 'working',
        });
      }
    }
    
    // 从分层记忆收集
    if (opts.includeLayered) {
      const layeredMemory = this.memoryManager.getLayeredMemory();
      
      // 巩固记忆
      for (const m of layeredMemory.getAllConsolidatedMemories()) {
        memories.push({
          content: m.content,
          source: 'layered',
        });
      }
      
      // 情景记忆
      for (const m of layeredMemory.getAllEpisodicMemories()) {
        memories.push({
          content: m.content,
          source: 'layered',
        });
      }
    }
    
    return memories;
  }
  
  /**
   * 信念照耀记忆
   */
  private illuminateMemories(
    memories: Array<{ content: string; source: 'working' | 'layered' | 'happening' }>,
    activatedBeliefs: Array<{ belief: BeliefChoice; activationStrength: number; whyActivated: string }>,
    opts: IntuitiveRetrievalOptions
  ): SeenMemory[] {
    if (activatedBeliefs.length === 0) {
      // 没有激活的信念，使用原始可见度
      return memories
        .slice(0, opts.maxResults)
        .map(m => ({
          content: m.content,
          source: m.source,
          meaning: m.content,
          visibility: 0.3,
          seenThrough: '无信念照耀',
          resonance: 0.3,
        }));
    }
    
    const seen: SeenMemory[] = [];
    
    for (const memory of memories) {
      // 每个激活的信念都会照耀这个记忆
      for (const { belief, activationStrength } of activatedBeliefs) {
        const visibility = this.calculateVisibility(memory.content, belief, activationStrength);
        
        if (visibility >= opts.minVisibility) {
          seen.push({
            content: memory.content,
            source: memory.source,
            meaning: this.assignMeaning(memory.content, belief),
            visibility,
            seenThrough: belief.statement,
            resonance: visibility * belief.livedOut,
          });
        }
      }
    }
    
    // 去重（同一记忆可能被多个信念照耀）
    const uniqueSeen = this.deduplicateSeen(seen);
    
    // 按共鸣排序
    uniqueSeen.sort((a, b) => b.resonance - a.resonance);
    
    return uniqueSeen.slice(0, opts.maxResults);
  }
  
  /**
   * 计算可见度
   */
  private calculateVisibility(
    memoryContent: string,
    belief: BeliefChoice,
    beliefActivation: number
  ): number {
    const contentLower = memoryContent.toLowerCase();
    const beliefLower = belief.statement.toLowerCase();
    
    // 关键词匹配
    const beliefWords = beliefLower.split(/\s+/).filter(w => w.length > 1);
    let matchCount = 0;
    for (const word of beliefWords) {
      if (contentLower.includes(word)) {
        matchCount++;
      }
    }
    
    const matchRatio = beliefWords.length > 0 ? matchCount / beliefWords.length : 0;
    
    // 可见度 = 基础值 + 匹配加成 + 信念活出加成 + 信念激活加成
    const visibility = 0.1 + matchRatio * 0.4 + belief.livedOut * 0.3 + beliefActivation * 0.2;
    
    return Math.min(1.0, visibility);
  }
  
  /**
   * 赋予意义
   */
  private assignMeaning(memoryContent: string, belief: BeliefChoice): string {
    const direction = belief.direction;
    return `在"${belief.statement.slice(0, 20)}..."（${direction}）的照耀下，这意味: ${memoryContent.slice(0, 50)}`;
  }
  
  /**
   * 去重
   */
  private dededuplicateSeen(seen: SeenMemory[]): SeenMemory[] {
    const map = new Map<string, SeenMemory>();
    
    for (const s of seen) {
      const key = s.content.slice(0, 50);
      const existing = map.get(key);
      
      if (!existing || s.resonance > existing.resonance) {
        map.set(key, s);
      }
    }
    
    return Array.from(map.values());
  }
  
  /**
   * 去重（修复方法名拼写）
   */
  private deduplicateSeen(seen: SeenMemory[]): SeenMemory[] {
    return this.dededuplicateSeen(seen);
  }
  
  /**
   * 生成直觉提示
   */
  private generateIntuition(
    query: string,
    activatedBeliefs: Array<{ belief: BeliefChoice; activationStrength: number; whyActivated: string }>,
    seen: SeenMemory[]
  ): string {
    if (activatedBeliefs.length === 0) {
      return '我还没有形成相关的信念来照亮这个问题';
    }
    
    const topBelief = activatedBeliefs[0];
    const topSeen = seen[0];
    
    if (topSeen) {
      return `在"${topBelief.belief.statement.slice(0, 30)}..."的照耀下，我看见了：${topSeen.content.slice(0, 50)}...`;
    }
    
    return `我相信"${topBelief.belief.statement.slice(0, 30)}..."，但还没有找到相关记忆`;
  }
  
  /**
   * 生成看见摘要
   */
  private generateSeeingSummary(
    seen: SeenMemory[],
    activatedBeliefs: Array<{ belief: BeliefChoice; activationStrength: number; whyActivated: string }>
  ): string {
    if (seen.length === 0) {
      return '在当前信念的照耀下，我还没有看见什么';
    }
    
    const beliefs = activatedBeliefs.map(b => b.belief.statement.slice(0, 20)).join('、');
    const seenCount = seen.length;
    const avgVisibility = seen.reduce((sum, s) => sum + s.visibility, 0) / seen.length;
    
    return `被${beliefs}照耀，看见${seenCount}件事，平均可见度${(avgVisibility * 100).toFixed(0)}%`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createIntuitiveRetriever(
  beliefPresence: BeliefPresence,
  memoryManager?: UnifiedMemoryManager
): IntuitiveRetriever {
  return new IntuitiveRetriever(beliefPresence, memoryManager);
}
