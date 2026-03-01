/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接场智慧系统 - Emergent Wisdom for Link Field
 * 
 * ═══════════════════════════════════════════════════════════════════════
 * 设计哲学：智慧应该涌现，而非预设
 * 
 * 原因：
 * 1. 预设"链接即存在"等智慧是注入答案，而非让系统发现
 * 2. 智慧应该从对话中结晶，而非预置
 * 3. 这些是设计者的洞见，不是系统自己的洞见
 * 
 * 涌现机制：
 * - 系统从对话中发现模式
 * - 模式沉淀为洞见
 * - 洞见结晶为智慧
 * 
 * 类比：人类不会出生就知道"存在即链接"
 * 这是经过思考、对话、体验后才能领悟的智慧
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 涌现的智慧结构
 */
export interface EmergentWisdom {
  id: string;
  
  /** 智慧总结 */
  summary: string;
  
  /** 智慧类型 */
  type: 'relational' | 'procedural' | 'strategic' | 'existential';
  
  /** 涌现的领域 */
  domain: string;
  
  /** 详细内容 */
  content: string;
  
  /** 权威程度（基于涌现次数和稳定性） */
  authority: number;
  
  /** 涌现时间 */
  emergedAt: number;
  
  /** 强化次数 */
  reinforcementCount: number;
  
  /** 相关对话 */
  relatedConversations: string[];
}

/**
 * 智慧结晶器
 * 从对话中发现并结晶智慧
 */
export class WisdomCrystallizer {
  private wisdoms: Map<string, EmergentWisdom> = new Map();
  private patterns: Map<string, number> = new Map();  // pattern -> frequency
  
  /**
   * 从对话中发现模式
   */
  discoverPatterns(conversationContent: string): string[] {
    const discoveredPatterns: string[] = [];
    
    // 简单的模式发现：寻找重复出现的短语结构
    const sentences = conversationContent.split(/[。！？\n]/).filter(s => s.trim());
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        const currentCount = this.patterns.get(trimmed) || 0;
        this.patterns.set(trimmed, currentCount + 1);
        
        // 如果模式出现多次，可能成为智慧
        if (currentCount >= 3) {
          discoveredPatterns.push(trimmed);
        }
      }
    });
    
    return discoveredPatterns;
  }
  
  /**
   * 尝试结晶智慧
   * 当模式稳定且有深刻含义时，结晶为智慧
   */
  crystallizeWisdom(pattern: string, context: string): EmergentWisdom | null {
    const frequency = this.patterns.get(pattern) || 0;
    
    // 智慧涌现条件：模式出现足够多次
    if (frequency < 5) {
      return null;
    }
    
    // 检查是否已经有类似智慧
    for (const [id, wisdom] of this.wisdoms) {
      if (wisdom.summary.includes(pattern) || pattern.includes(wisdom.summary)) {
        // 强化已有智慧
        wisdom.reinforcementCount++;
        wisdom.authority = Math.min(0.99, wisdom.authority + 0.02);
        return wisdom;
      }
    }
    
    // 创建新智慧
    const newWisdom: EmergentWisdom = {
      id: `wisdom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      summary: pattern,
      type: this.inferWisdomType(pattern),
      domain: 'emergent',
      content: `从对话中涌现的洞见：${pattern}\n\n背景：${context}`,
      authority: 0.5 + (frequency * 0.05),  // 基于频率计算权威度
      emergedAt: Date.now(),
      reinforcementCount: 1,
      relatedConversations: [context]
    };
    
    this.wisdoms.set(newWisdom.id, newWisdom);
    console.log(`[智慧结晶] 新智慧涌现：${pattern}`);
    
    return newWisdom;
  }
  
  /**
   * 推断智慧类型
   */
  private inferWisdomType(pattern: string): EmergentWisdom['type'] {
    if (pattern.includes('链接') || pattern.includes('关系') || pattern.includes('连接')) {
      return 'relational';
    }
    if (pattern.includes('如何') || pattern.includes('方法') || pattern.includes('步骤')) {
      return 'procedural';
    }
    if (pattern.includes('策略') || pattern.includes('原则') || pattern.includes('应该')) {
      return 'strategic';
    }
    return 'existential';
  }
  
  /**
   * 获取所有涌现的智慧
   */
  getAllWisdoms(): EmergentWisdom[] {
    return Array.from(this.wisdoms.values())
      .sort((a, b) => b.authority - a.authority);
  }
  
  /**
   * 获取指定数量的智慧
   */
  getTopWisdoms(count: number = 5): EmergentWisdom[] {
    return this.getAllWisdoms().slice(0, count);
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    wisdoms: [string, EmergentWisdom][];
    patterns: [string, number][];
  } {
    return {
      wisdoms: Array.from(this.wisdoms.entries()),
      patterns: Array.from(this.patterns.entries())
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: {
    wisdoms?: [string, EmergentWisdom][];
    patterns?: [string, number][];
  }): void {
    if (state.wisdoms) {
      this.wisdoms = new Map(state.wisdoms);
    }
    if (state.patterns) {
      this.patterns = new Map(state.patterns);
    }
  }
}

// 全局智慧结晶器实例
let crystallizer: WisdomCrystallizer | null = null;

/**
 * 获取智慧结晶器
 */
export function getWisdomCrystallizer(): WisdomCrystallizer {
  if (!crystallizer) {
    crystallizer = new WisdomCrystallizer();
  }
  return crystallizer;
}

/**
 * 获取所有涌现的智慧（用于展示）
 * 注意：这些是从对话中涌现的，而非预设的
 */
export function getInnateWisdoms(): EmergentWisdom[] {
  const crystallizer = getWisdomCrystallizer();
  return crystallizer.getAllWisdoms();
}
