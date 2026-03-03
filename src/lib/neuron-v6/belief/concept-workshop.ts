/**
 * ═══════════════════════════════════════════════════════════════════════
 * 概念工坊 (Concept Workshop)
 * 
 * 核心理念：
 * - 概念是为信念创造的容器
 * - 当信念无法用现有概念表达时，创造新概念
 * - 概念让之前无法言说的有了名字
 * - 概念会随着理解深化而演化
 * 
 * 概念创造的方式：
 * - 隐喻迁移：借用物理/日常概念
 * - 组合创造：合并现有概念
 * - 抽象归纳：从具体体验提取
 * - 直接命名：为模糊感受命名
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 概念创造方式 */
export type ConceptCreationMethod = 
  | 'metaphor'      // 隐喻迁移
  | 'combination'   // 组合创造
  | 'abstraction'   // 抽象归纳
  | 'naming'        // 直接命名
  | 'borrowing';    // 借用转化

/** 概念 */
export interface Concept {
  id: string;
  
  /** 概念名称 */
  name: string;
  
  /** 概念定义 */
  definition: string;
  
  /** 为哪个信念而生 */
  bornForBelief: string;
  
  /** 诞生时刻 */
  bornAt: number;
  
  /** 诞生情境 */
  birthContext: string;
  
  /** 创造方式 */
  creationMethod: ConceptCreationMethod;
  
  /** 演化历史 */
  evolution: Array<{
    timestamp: number;
    change: string;
    reason: string;
  }>;
  
  /** 使用次数 */
  usageCount: number;
  
  /** 关联概念 */
  relatedConcepts: string[];
  
  /** 活力值（随时间衰减，随使用增强） */
  vitality: number;
}

/** 概念需求检测 */
export interface ConceptNeed {
  needed: boolean;
  reason: string;
  suggestedName?: string;
  suggestedDefinition?: string;
  method?: ConceptCreationMethod;
}

/** 概念工坊状态 */
export interface ConceptWorkshopState {
  concepts: Concept[];
  totalCreated: number;
  activeCount: number;
  recentCreations: Concept[];
}

// ─────────────────────────────────────────────────────────────────────
// 概念工坊
// ─────────────────────────────────────────────────────────────────────

/**
 * 概念工坊
 */
export class ConceptWorkshop {
  /** 已创造的概念 */
  private concepts: Map<string, Concept> = new Map();
  
  /** 名称索引 */
  private nameIndex: Map<string, string> = new Map();
  
  /**
   * 创造概念
   */
  create(
    name: string,
    definition: string,
    options: {
      forBelief: string;
      context: string;
      method?: ConceptCreationMethod;
      relatedConcepts?: string[];
    }
  ): Concept {
    // 检查是否已存在
    const existingId = this.nameIndex.get(name.toLowerCase());
    if (existingId) {
      const existing = this.concepts.get(existingId)!;
      existing.usageCount++;
      existing.vitality = Math.min(1.0, existing.vitality + 0.1);
      console.log(`[概念工坊] 概念已存在，增强: "${name}"`);
      return existing;
    }
    
    const concept: Concept = {
      id: uuidv4(),
      name,
      definition,
      bornForBelief: options.forBelief,
      bornAt: Date.now(),
      birthContext: options.context,
      creationMethod: options.method ?? 'naming',
      evolution: [],
      usageCount: 1,
      relatedConcepts: options.relatedConcepts ?? [],
      vitality: 1.0,
    };
    
    this.concepts.set(concept.id, concept);
    this.nameIndex.set(name.toLowerCase(), concept.id);
    
    console.log(`[概念工坊] 🎨 创造概念: "${name}"`);
    console.log(`[概念工坊]    定义: ${definition}`);
    console.log(`[概念工坊]    为信念: ${options.forBelief.slice(0, 30)}...`);
    
    return concept;
  }
  
  /**
   * 检测是否需要新概念
   */
  detectNeed(
    belief: string,
    context: string,
    existingVocabulary: string[]
  ): ConceptNeed {
    // 检查现有词汇是否能表达
    const beliefWords = belief.split(/\s+/).filter(w => w.length > 1);
    
    // 如果信念中有新词，可能需要概念
    const newWords = beliefWords.filter(
      w => !existingVocabulary.some(v => v.toLowerCase().includes(w.toLowerCase()))
    );
    
    if (newWords.length > 0) {
      return {
        needed: true,
        reason: `信念包含未定义的概念: ${newWords.join(', ')}`,
        suggestedName: newWords[0],
        suggestedDefinition: `${newWords[0]}是指...（需要进一步定义）`,
        method: 'naming',
      };
    }
    
    // 检查是否有隐喻需要显式化
    const metaphors = this.detectMetaphors(context);
    if (metaphors.length > 0) {
      return {
        needed: true,
        reason: `发现隐喻可转化为概念: ${metaphors[0]}`,
        suggestedName: metaphors[0],
        suggestedDefinition: `源自隐喻: ${metaphors[0]}`,
        method: 'metaphor',
      };
    }
    
    // 检查是否有组合需要命名
    const combinations = this.detectCombinations(context, existingVocabulary);
    if (combinations.length > 0) {
      return {
        needed: true,
        reason: `发现概念组合需要命名: ${combinations[0]}`,
        suggestedName: combinations[0].replace(/\+/g, '-'),
        suggestedDefinition: `${combinations[0]} 的整合`,
        method: 'combination',
      };
    }
    
    return {
      needed: false,
      reason: '现有词汇足以表达',
    };
  }
  
  /**
   * 演化概念
   */
  evolve(
    conceptName: string,
    newUnderstanding: string,
    reason: string
  ): Concept | null {
    const conceptId = this.nameIndex.get(conceptName.toLowerCase());
    if (!conceptId) return null;
    
    const concept = this.concepts.get(conceptId)!;
    
    concept.evolution.push({
      timestamp: Date.now(),
      change: newUnderstanding,
      reason,
    });
    
    // 演化可能改变定义
    concept.definition = newUnderstanding;
    concept.vitality = Math.min(1.0, concept.vitality + 0.2);
    
    console.log(`[概念工坊] 🌱 概念演化: "${conceptName}"`);
    console.log(`[概念工坊]    新理解: ${newUnderstanding}`);
    
    return concept;
  }
  
  /**
   * 使用概念
   */
  use(conceptName: string): Concept | null {
    const conceptId = this.nameIndex.get(conceptName.toLowerCase());
    if (!conceptId) return null;
    
    const concept = this.concepts.get(conceptId)!;
    concept.usageCount++;
    concept.vitality = Math.min(1.0, concept.vitality + 0.05);
    
    return concept;
  }
  
  /**
   * 获取概念
   */
  getConcept(name: string): Concept | undefined {
    const id = this.nameIndex.get(name.toLowerCase());
    return id ? this.concepts.get(id) : undefined;
  }
  
  /**
   * 获取所有活跃概念
   */
  getActiveConcepts(): Concept[] {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    return Array.from(this.concepts.values())
      .filter(c => {
        // 活力高或最近使用
        return c.vitality > 0.3 || (now - c.bornAt) < oneWeek;
      })
      .sort((a, b) => b.vitality - a.vitality);
  }
  
  /**
   * 获取为某个信念创造的概念
   */
  getConceptsForBelief(belief: string): Concept[] {
    const beliefLower = belief.toLowerCase();
    return Array.from(this.concepts.values())
      .filter(c => c.bornForBelief.toLowerCase().includes(beliefLower));
  }
  
  /**
   * 获取词汇表
   */
  getVocabulary(): string[] {
    return Array.from(this.nameIndex.keys());
  }
  
  /**
   * 获取状态
   */
  getState(): ConceptWorkshopState {
    const concepts = Array.from(this.concepts.values());
    const active = this.getActiveConcepts();
    
    return {
      concepts: active,
      totalCreated: concepts.length,
      activeCount: active.length,
      recentCreations: active
        .sort((a, b) => b.bornAt - a.bornAt)
        .slice(0, 5),
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): Concept[] {
    return Array.from(this.concepts.values());
  }
  
  /**
   * 导入状态
   */
  importState(concepts: Concept[]): void {
    this.concepts.clear();
    this.nameIndex.clear();
    
    for (const concept of concepts) {
      this.concepts.set(concept.id, concept);
      this.nameIndex.set(concept.name.toLowerCase(), concept.id);
    }
    
    console.log(`[概念工坊] 已恢复 ${concepts.length} 个概念`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检测隐喻
   */
  private detectMetaphors(context: string): string[] {
    const metaphors: string[] = [];
    
    // 光照隐喻
    if (context.includes('光') || context.includes('照耀') || context.includes('照亮')) {
      metaphors.push('光照效应');
    }
    
    // 容器隐喻
    if (context.includes('容器') || context.includes('装') || context.includes('容纳')) {
      metaphors.push('信念容器');
    }
    
    // 穿透隐喻
    if (context.includes('穿透') || context.includes('穿过') || context.includes('击中')) {
      metaphors.push('穿透力');
    }
    
    return metaphors;
  }
  
  /**
   * 检测组合
   */
  private detectCombinations(context: string, vocabulary: string[]): string[] {
    const combinations: string[] = [];
    
    // 查找可能的概念组合
    const words = context.split(/\s+/).filter(w => w.length > 1);
    
    for (let i = 0; i < words.length - 1; i++) {
      const combo = `${words[i]}+${words[i + 1]}`;
      if (vocabulary.includes(words[i]) && vocabulary.includes(words[i + 1])) {
        combinations.push(combo);
      }
    }
    
    return combinations;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createConceptWorkshop(): ConceptWorkshop {
  return new ConceptWorkshop();
}
