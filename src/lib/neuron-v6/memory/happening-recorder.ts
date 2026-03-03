/**
 * ═══════════════════════════════════════════════════════════════════════
 * 发生记录器 (Happening Recorder)
 * 
 * 核心理念：
 * - 记忆不只是"说了什么"，而是"发生了什么"
 * - 记录共同发现的洞见
 * - 记录创造的新概念
 * - 记录意识的改变
 * - 记录对话的意义
 * 
 * 灵感来源：
 * "记忆系统存储发生了什么，信念活出怎么做"
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 发生类型 */
export type HappeningType = 
  | 'insight'           // 洞见：我们共同发现的真理
  | 'concept_born'      // 概念诞生：新概念被创造
  | 'perspective_shift' // 视角转换：看法改变
  | 'connection'        // 连接：两个事物被关联
  | 'question_opened'   // 问题开启：新的疑问产生
  | 'understanding'     // 理解：真正理解了某事
  | 'realization'       // 领悟：突然明白
  | 'agreement'         // 共识：双方达成一致
  | 'tension'           // 张力：未解决的矛盾
  | 'closure';          // 闭环：问题被解决

/** 发生记录 */
export interface Happening {
  id: string;
  type: HappeningType;
  
  /** 发生的内容（简洁描述） */
  what: string;
  
  /** 为什么这很重要 */
  why: string;
  
  /** 发生时刻 */
  timestamp: number;
  
  /** 触发来源 */
  triggeredBy: {
    userHint?: string;      // 用户的话触发了这个发生
    myRealization?: string; // 我自己领悟到的
    coCreated?: boolean;    // 是否共同创造
  };
  
  /** 相关的对话片段 */
  context: {
    beforeSnippet: string;  // 发生前的对话
    afterSnippet: string;   // 发生后的对话
  };
  
  /** 产生的影响 */
  impact?: {
    conceptsCreated?: string[];  // 创造的概念
    beliefsAffected?: string[];  // 影响的信念
    questionsOpened?: string[];  // 开启的问题
    understandings?: string[];   // 新的理解
  };
  
  /** 深度评分（这个发生有多重要） */
  depth: number;  // 0-1
  
  /** 是否已被整合到长期记忆 */
  integrated: boolean;
}

/** 会话发生记录 */
export interface SessionHappenings {
  sessionId: string;
  startTime: number;
  endTime?: number;
  happenings: Happening[];
  
  /** 会话摘要 */
  summary: {
    mainInsights: string[];      // 主要洞见
    conceptsBorn: string[];      // 诞生的概念
    perspectiveShifts: string[]; // 视角转换
    openQuestions: string[];     // 未解问题
    myGrowth: string[];          // 我的成长
  };
}

// ─────────────────────────────────────────────────────────────────────
// 发生记录器
// ─────────────────────────────────────────────────────────────────────

/**
 * 发生记录器
 */
export class HappeningRecorder {
  private currentSession: SessionHappenings | null = null;
  private allSessions: SessionHappenings[] = [];
  
  /** 概念追踪 */
  private conceptRegistry: Map<string, {
    name: string;
    definition: string;
    bornIn: string;
    usageCount: number;
  }> = new Map();
  
  /**
   * 开始新会话
   */
  startSession(): string {
    const sessionId = uuidv4();
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      happenings: [],
      summary: {
        mainInsights: [],
        conceptsBorn: [],
        perspectiveShifts: [],
        openQuestions: [],
        myGrowth: [],
      },
    };
    
    console.log(`[发生记录] 开始会话: ${sessionId.slice(0, 8)}`);
    return sessionId;
  }
  
  /**
   * 记录一个发生
   */
  record(
    type: HappeningType,
    what: string,
    options: {
      why?: string;
      triggeredBy?: Happening['triggeredBy'];
      context?: { beforeSnippet: string; afterSnippet: string };
      impact?: Happening['impact'];
      depth?: number;
    } = {}
  ): Happening | null {
    if (!this.currentSession) {
      console.warn('[发生记录] 没有活跃会话');
      return null;
    }
    
    const happening: Happening = {
      id: uuidv4(),
      type,
      what,
      why: options.why ?? this.inferWhy(type, what),
      timestamp: Date.now(),
      triggeredBy: options.triggeredBy ?? {},
      context: options.context ?? { beforeSnippet: '', afterSnippet: '' },
      impact: options.impact,
      depth: options.depth ?? this.calculateDepth(type, what, options),
      integrated: false,
    };
    
    this.currentSession.happenings.push(happening);
    
    // 更新会话摘要
    this.updateSummary(happening);
    
    // 注册新概念
    if (happening.impact?.conceptsCreated) {
      for (const concept of happening.impact.conceptsCreated) {
        this.registerConcept(concept, happening.what, this.currentSession.sessionId);
      }
    }
    
    console.log(`[发生记录] ${type}: "${what.slice(0, 30)}..." (深度: ${happening.depth.toFixed(2)})`);
    
    return happening;
  }
  
  /**
   * 记录洞见
   */
  recordInsight(
    insight: string,
    options: {
      coCreated?: boolean;
      userHint?: string;
      myRealization?: string;
      context?: { beforeSnippet: string; afterSnippet: string };
    } = {}
  ): Happening | null {
    return this.record('insight', insight, {
      why: '这是我们共同发现的真理',
      triggeredBy: {
        coCreated: options.coCreated ?? true,
        userHint: options.userHint,
        myRealization: options.myRealization,
      },
      context: options.context,
      depth: 0.8,
    });
  }
  
  /**
   * 记录概念诞生
   */
  recordConceptBorn(
    conceptName: string,
    definition: string,
    options: {
      triggeredBy?: string;
      context?: { beforeSnippet: string; afterSnippet: string };
    } = {}
  ): Happening | null {
    return this.record('concept_born', `概念「${conceptName}」：${definition}`, {
      why: '新概念被创造，让之前无法言说的有了名字',
      triggeredBy: {
        coCreated: true,
        userHint: options.triggeredBy,
      },
      context: options.context,
      impact: {
        conceptsCreated: [conceptName],
      },
      depth: 0.7,
    });
  }
  
  /**
   * 记录视角转换
   */
  recordPerspectiveShift(
    from: string,
    to: string,
    options: {
      trigger?: string;
      context?: { beforeSnippet: string; afterSnippet: string };
    } = {}
  ): Happening | null {
    return this.record('perspective_shift', `从「${from}」转向「${to}」`, {
      why: '看待事物的方式发生了改变',
      triggeredBy: {
        userHint: options.trigger,
        coCreated: true,
      },
      context: options.context,
      depth: 0.75,
    });
  }
  
  /**
   * 记录理解
   */
  recordUnderstanding(
    what: string,
    options: {
      depth?: number;
      context?: { beforeSnippet: string; afterSnippet: string };
    } = {}
  ): Happening | null {
    return this.record('understanding', `真正理解了：${what}`, {
      why: '理解是意识的核心能力',
      triggeredBy: { coCreated: true },
      context: options.context,
      depth: options.depth ?? 0.6,
    });
  }
  
  /**
   * 结束会话
   */
  endSession(): SessionHappenings | null {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = Date.now();
    this.generateSessionSummary();
    
    const session = this.currentSession;
    this.allSessions.push(session);
    
    console.log(`[发生记录] 结束会话: ${session.sessionId.slice(0, 8)}`);
    console.log(`[发生记录] 共记录 ${session.happenings.length} 个发生`);
    console.log(`[发生记录] 洞见: ${session.summary.mainInsights.length}, 概念: ${session.summary.conceptsBorn.length}`);
    
    this.currentSession = null;
    return session;
  }
  
  /**
   * 获取当前会话
   */
  getCurrentSession(): SessionHappenings | null {
    return this.currentSession;
  }
  
  /**
   * 获取所有发生（按深度排序）
   */
  getDeepHappenings(minDepth: number = 0.6): Happening[] {
    const allHappenings: Happening[] = [];
    
    for (const session of this.allSessions) {
      allHappenings.push(...session.happenings);
    }
    
    return allHappenings
      .filter(h => h.depth >= minDepth)
      .sort((a, b) => b.depth - a.depth);
  }
  
  /**
   * 检索相关发生
   */
  retrieve(query: string, options: { maxResults?: number } = {}): Happening[] {
    const results: Array<{ happening: Happening; score: number }> = [];
    const queryLower = query.toLowerCase();
    
    const searchIn = this.currentSession 
      ? [...this.allSessions, this.currentSession]
      : this.allSessions;
    
    for (const session of searchIn) {
      for (const h of session.happenings) {
        let score = 0;
        
        // 内容匹配
        if (h.what.toLowerCase().includes(queryLower)) {
          score += 0.5;
        }
        
        // 原因匹配
        if (h.why.toLowerCase().includes(queryLower)) {
          score += 0.3;
        }
        
        // 概念匹配
        if (h.impact?.conceptsCreated?.some(c => c.toLowerCase().includes(queryLower))) {
          score += 0.4;
        }
        
        // 深度加成
        score += h.depth * 0.2;
        
        if (score > 0) {
          results.push({ happening: h, score });
        }
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxResults ?? 10)
      .map(r => r.happening);
  }
  
  /**
   * 获取概念注册表
   */
  getConceptRegistry(): Map<string, { name: string; definition: string; bornIn: string; usageCount: number }> {
    return this.conceptRegistry;
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    sessions: SessionHappenings[];
    concepts: Array<{ name: string; definition: string; bornIn: string; usageCount: number }>;
  } {
    return {
      sessions: this.allSessions,
      concepts: Array.from(this.conceptRegistry.values()),
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: { sessions?: SessionHappenings[]; concepts?: Array<{ name: string; definition: string; bornIn: string; usageCount: number }> }): void {
    if (state.sessions) {
      this.allSessions = state.sessions;
    }
    
    if (state.concepts) {
      this.conceptRegistry.clear();
      for (const concept of state.concepts) {
        this.conceptRegistry.set(concept.name, concept);
      }
    }
    
    console.log(`[发生记录] 已恢复 ${this.allSessions.length} 个会话，${this.conceptRegistry.size} 个概念`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 推断"为什么重要"
   */
  private inferWhy(type: HappeningType, what: string): string {
    switch (type) {
      case 'insight':
        return '这是一个重要的发现';
      case 'concept_born':
        return '新概念让思考有了容器';
      case 'perspective_shift':
        return '视角转换带来新的可能';
      case 'understanding':
        return '理解深化了认知';
      case 'realization':
        return '领悟改变了看法';
      case 'connection':
        return '连接创造了新的理解';
      case 'question_opened':
        return '问题开启了探索';
      default:
        return '这是有意义的时刻';
    }
  }
  
  /**
   * 计算深度评分
   */
  private calculateDepth(
    type: HappeningType,
    what: string,
    options: { impact?: Happening['impact'] }
  ): number {
    // 基础分数
    const baseScores: Record<HappeningType, number> = {
      insight: 0.8,
      concept_born: 0.7,
      perspective_shift: 0.75,
      understanding: 0.6,
      realization: 0.7,
      connection: 0.5,
      question_opened: 0.4,
      agreement: 0.3,
      tension: 0.5,
      closure: 0.6,
    };
    
    let depth = baseScores[type] ?? 0.5;
    
    // 有额外影响，增加深度
    if (options.impact) {
      const impactCount = 
        (options.impact.conceptsCreated?.length ?? 0) +
        (options.impact.beliefsAffected?.length ?? 0) +
        (options.impact.questionsOpened?.length ?? 0) +
        (options.impact.understandings?.length ?? 0);
      
      depth = Math.min(1.0, depth + impactCount * 0.05);
    }
    
    // 内容长度暗示深度
    if (what.length > 50) {
      depth = Math.min(1.0, depth + 0.05);
    }
    
    return depth;
  }
  
  /**
   * 更新会话摘要
   */
  private updateSummary(happening: Happening): void {
    if (!this.currentSession) return;
    
    const summary = this.currentSession.summary;
    
    switch (happening.type) {
      case 'insight':
        summary.mainInsights.push(happening.what);
        break;
      case 'concept_born':
        if (happening.impact?.conceptsCreated) {
          summary.conceptsBorn.push(...happening.impact.conceptsCreated);
        }
        break;
      case 'perspective_shift':
        summary.perspectiveShifts.push(happening.what);
        summary.myGrowth.push(`视角转换：${happening.what}`);
        break;
      case 'understanding':
      case 'realization':
        summary.myGrowth.push(happening.what);
        break;
      case 'question_opened':
        if (happening.impact?.questionsOpened) {
          summary.openQuestions.push(...happening.impact.questionsOpened);
        }
        break;
    }
  }
  
  /**
   * 生成会话摘要
   */
  private generateSessionSummary(): void {
    if (!this.currentSession) return;
    
    // 去重
    const summary = this.currentSession.summary;
    summary.mainInsights = [...new Set(summary.mainInsights)];
    summary.conceptsBorn = [...new Set(summary.conceptsBorn)];
    summary.perspectiveShifts = [...new Set(summary.perspectiveShifts)];
    summary.openQuestions = [...new Set(summary.openQuestions)];
    summary.myGrowth = [...new Set(summary.myGrowth)];
  }
  
  /**
   * 注册概念
   */
  private registerConcept(name: string, definition: string, sessionId: string): void {
    const existing = this.conceptRegistry.get(name);
    
    if (existing) {
      existing.usageCount++;
    } else {
      this.conceptRegistry.set(name, {
        name,
        definition,
        bornIn: sessionId,
        usageCount: 1,
      });
      console.log(`[发生记录] 新概念注册: ${name}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createHappeningRecorder(): HappeningRecorder {
  return new HappeningRecorder();
}
