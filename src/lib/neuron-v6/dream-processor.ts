/**
 * 梦境/离线处理系统
 * 
 * 实现休眠时的记忆整合和知识重组
 * - 记忆整合：将短期记忆转化为长期记忆
 * - 知识重组：发现概念间的新关联
 * - 洞察生成：在"梦境"中产生新的理解
 * - 梦境模拟：模拟意识流和联想跳跃
 */

import { ConceptNode, AssociationEdge, ConceptType } from './association-network';
import { KnowledgeNode as MemoryItem, Wisdom as WisdomItem } from './long-term-memory';

// ============== 类型定义 ==============

/** 梦境阶段 */
export type DreamPhase = 'light' | 'deep' | 'rem';

/** 梦境状态 */
export interface DreamState {
  isActive: boolean;
  phase: DreamPhase;
  startTime: number;
  duration: number;
  intensity: number; // 0-1
}

/** 梦境内容 */
export interface DreamContent {
  id: string;
  timestamp: number;
  phase: DreamPhase;
  elements: DreamElement[];
  narrative: string; // 梦境叙事
  insights: DreamInsight[];
  emotionalTone: string;
  significance: number; // 重要性 0-1
}

/** 梦境元素 */
export interface DreamElement {
  type: 'memory' | 'concept' | 'emotion' | 'symbol';
  content: string;
  sourceId?: string;
  transformation?: string; // 元素如何被转化
}

/** 梦境洞察 */
export interface DreamInsight {
  id: string;
  content: string;
  confidence: number;
  sourceElements: string[]; // 来源元素ID
  type: 'connection' | 'pattern' | 'resolution' | 'creative';
  worthRemembering: boolean;
}

/** 记忆整合结果 */
export interface MemoryConsolidationResult {
  processedMemories: string[]; // 处理的记忆ID
  newLongTermMemories: MemoryItem[];
  strengthenedMemories: string[];
  forgottenMemories: string[];
  extractedWisdoms: WisdomItem[];
}

/** 知识重组结果 */
export interface KnowledgeReorganizationResult {
  newAssociations: AssociationEdge[];
  strengthenedAssociations: string[];
  newConceptNodes: ConceptNode[];
  discoveredPatterns: KnowledgePattern[];
}

/** 知识模式 */
export interface KnowledgePattern {
  id: string;
  description: string;
  occurrences: number;
  relatedConceptNodes: string[];
  confidence: number;
  actionable: boolean;
}

/** 离线处理配置 */
export interface OfflineProcessingConfig {
  consolidationThreshold: number; // 记忆整合阈值
  forgettingRate: number; // 遗忘率
  insightThreshold: number; // 洞察生成阈值
  maxProcessingTime: number; // 最大处理时间(ms)
}

// ============== 默认配置 ==============

const DEFAULT_OFFLINE_CONFIG: OfflineProcessingConfig = {
  consolidationThreshold: 0.6,
  forgettingRate: 0.1,
  insightThreshold: 0.5,
  maxProcessingTime: 30000 // 30秒
};

// ============== 梦境引擎 ==============

export class DreamEngine {
  private dreamState: DreamState | null = null;
  private dreamHistory: DreamContent[] = [];
  private config: OfflineProcessingConfig;
  
  constructor(config: Partial<OfflineProcessingConfig> = {}) {
    this.config = { ...DEFAULT_OFFLINE_CONFIG, ...config };
  }
  
  /**
   * 开始梦境
   */
  startDream(): DreamState {
    this.dreamState = {
      isActive: true,
      phase: 'light',
      startTime: Date.now(),
      duration: 0,
      intensity: 0.5
    };
    return this.dreamState;
  }
  
  /**
   * 更新梦境阶段
   */
  updateDreamPhase(): DreamPhase {
    if (!this.dreamState) return 'light';
    
    // 根据时间推进梦境阶段
    const elapsed = Date.now() - this.dreamState.startTime;
    
    if (elapsed < 10000) {
      this.dreamState.phase = 'light';
      this.dreamState.intensity = 0.3;
    } else if (elapsed < 20000) {
      this.dreamState.phase = 'deep';
      this.dreamState.intensity = 0.7;
    } else {
      this.dreamState.phase = 'rem';
      this.dreamState.intensity = 0.9;
    }
    
    this.dreamState.duration = elapsed;
    return this.dreamState.phase;
  }
  
  /**
   * 结束梦境
   */
  endDream(): DreamContent | null {
    if (!this.dreamState) return null;
    
    // 生成最终梦境内容
    const dreamContent = this.generateDreamContent();
    
    this.dreamHistory.push(dreamContent);
    this.dreamState = null;
    
    return dreamContent;
  }
  
  /**
   * 生成梦境内容
   */
  private generateDreamContent(): DreamContent {
    const phase = this.dreamState?.phase || 'light';
    
    // 梦境元素
    const elements: DreamElement[] = [
      {
        type: 'memory',
        content: '模糊的记忆碎片...',
        transformation: '被抽象化处理'
      },
      {
        type: 'concept',
        content: '漂浮的概念...',
        transformation: '自由联想'
      },
      {
        type: 'emotion',
        content: '潜在的情感色调',
        transformation: '被放大和融合'
      }
    ];
    
    // 生成梦境叙事
    const narrative = this.generateDreamNarrative(phase, elements);
    
    // 生成洞察
    const insights = this.generateDreamInsights(phase, elements);
    
    return {
      id: `dream-${Date.now()}`,
      timestamp: Date.now(),
      phase,
      elements,
      narrative,
      insights,
      emotionalTone: this.determineEmotionalTone(phase),
      significance: this.dreamState?.intensity || 0.5
    };
  }
  
  /**
   * 生成梦境叙事
   */
  private generateDreamNarrative(phase: DreamPhase, elements: DreamElement[]): string {
    const narratives = {
      light: [
        '意识渐渐模糊，记忆碎片开始漂浮...',
        '思绪像云一样飘散，若有若无...',
        '半梦半醒间，想法自由游荡...'
      ],
      deep: [
        '坠入深层的思维空间，概念开始融合...',
        '记忆和想象交织，形成新的图景...',
        '在无意识的海底，智慧的珍珠在闪烁...'
      ],
      rem: [
        '梦境变得生动而清晰，洞察突然涌现...',
        '画面快速切换，在混乱中找到秩序...',
        '创造的火花在意识的边缘绽放...'
      ]
    };
    
    return narratives[phase][Math.floor(Math.random() * narratives[phase].length)];
  }
  
  /**
   * 生成梦境洞察
   */
  private generateDreamInsights(phase: DreamPhase, elements: DreamElement[]): DreamInsight[] {
    const insights: DreamInsight[] = [];
    
    const insightTemplates = {
      light: [
        { type: 'connection' as const, content: '似乎有一些联系正在形成...' },
        { type: 'pattern' as const, content: '感觉到了某种模式的存在...' }
      ],
      deep: [
        { type: 'connection' as const, content: '发现了概念之间深层的联系' },
        { type: 'pattern' as const, content: '识别到了重复出现的模式' },
        { type: 'resolution' as const, content: '对之前的问题有了模糊的理解' }
      ],
      rem: [
        { type: 'connection' as const, content: '顿悟：这些概念是相互关联的！' },
        { type: 'pattern' as const, content: '清晰地看到了问题的结构' },
        { type: 'resolution' as const, content: '找到了问题的解决方案' },
        { type: 'creative' as const, content: '产生了一个全新的想法' }
      ]
    };
    
    const templates = insightTemplates[phase];
    const numInsights = phase === 'rem' ? 2 : 1;
    
    for (let i = 0; i < numInsights && i < templates.length; i++) {
      const template = templates[i];
      insights.push({
        id: `insight-${Date.now()}-${i}`,
        content: template.content,
        confidence: phase === 'rem' ? 0.8 : phase === 'deep' ? 0.6 : 0.4,
        sourceElements: elements.map(e => e.content),
        type: template.type,
        worthRemembering: phase === 'rem' || (phase === 'deep' && Math.random() > 0.5)
      });
    }
    
    return insights;
  }
  
  /**
   * 确定情感基调
   */
  private determineEmotionalTone(phase: DreamPhase): string {
    const tones = {
      light: ['平静', '轻微好奇', '放松'],
      deep: ['沉思', '专注', '神秘'],
      rem: ['兴奋', '顿悟', '创造']
    };
    
    const phaseTones = tones[phase];
    return phaseTones[Math.floor(Math.random() * phaseTones.length)];
  }
  
  /**
   * 获取当前梦境状态
   */
  getDreamState(): DreamState | null {
    return this.dreamState;
  }
  
  /**
   * 获取梦境历史
   */
  getDreamHistory(): DreamContent[] {
    return [...this.dreamHistory];
  }
}

// ============== 离线处理器 ==============

export class OfflineProcessor {
  private dreamEngine: DreamEngine;
  private config: OfflineProcessingConfig;
  
  constructor(config: Partial<OfflineProcessingConfig> = {}) {
    this.config = { ...DEFAULT_OFFLINE_CONFIG, ...config };
    this.dreamEngine = new DreamEngine(config);
  }
  
  /**
   * 执行离线处理
   */
  async processOffline(
    shortTermMemories: MemoryItem[],
    concepts: ConceptNode[],
    associations: AssociationEdge[]
  ): Promise<{
    memoryConsolidation: MemoryConsolidationResult;
    knowledgeReorganization: KnowledgeReorganizationResult;
    dreamContent: DreamContent | null;
  }> {
    // 开始梦境
    this.dreamEngine.startDream();
    
    // 模拟梦境阶段推进
    await this.simulateDreamProgression();
    
    // 执行记忆整合
    const memoryConsolidation = this.consolidateMemories(shortTermMemories);
    
    // 执行知识重组
    const knowledgeReorganization = this.reorganizeKnowledge(concepts, associations);
    
    // 结束梦境
    const dreamContent = this.dreamEngine.endDream();
    
    return {
      memoryConsolidation,
      knowledgeReorganization,
      dreamContent
    };
  }
  
  /**
   * 模拟梦境推进
   */
  private async simulateDreamProgression(): Promise<void> {
    // 快速推进梦境阶段（实际中可能需要更长时间）
    const phases: DreamPhase[] = ['light', 'deep', 'rem'];
    
    for (const phase of phases) {
      this.dreamEngine.updateDreamPhase();
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟时间流逝
    }
  }
  
  /**
   * 整合记忆
   */
  private consolidateMemories(memories: MemoryItem[]): MemoryConsolidationResult {
    const processedMemories: string[] = [];
    const newLongTermMemories: MemoryItem[] = [];
    const strengthenedMemories: string[] = [];
    const forgottenMemories: string[] = [];
    const extractedWisdoms: WisdomItem[] = [];
    
    // 按重要性分组处理
    const highImportance = memories.filter(m => (m.importance || 0.5) >= 0.8);
    const mediumImportance = memories.filter(m => {
      const imp = m.importance || 0.5;
      return imp >= 0.5 && imp < 0.8;
    });
    const lowImportance = memories.filter(m => (m.importance || 0.5) < 0.5);
    
    // 高重要性记忆：直接转为长期记忆并提取智慧
    highImportance.forEach(memory => {
      processedMemories.push(memory.id);
      const longTermMemory: MemoryItem = {
        ...memory,
        importance: Math.min(1, memory.importance + 0.15),
        tags: [...(memory.tags || []), '长期记忆', '核心记忆']
      };
      newLongTermMemories.push(longTermMemory);
      strengthenedMemories.push(memory.id);
      
      // 提取智慧
      const wisdom = this.extractWisdom(memory);
      if (wisdom) {
        extractedWisdoms.push(wisdom);
      }
    });
    
    // 中等重要性记忆：根据访问次数决定
    mediumImportance.forEach(memory => {
      processedMemories.push(memory.id);
      const accessCount = memory.accessCount || 0;
      
      if (accessCount >= 2 || memory.tags?.includes('核心')) {
        const longTermMemory: MemoryItem = {
          ...memory,
          importance: Math.min(1, memory.importance + 0.1),
          tags: [...(memory.tags || []), '长期记忆']
        };
        newLongTermMemories.push(longTermMemory);
        strengthenedMemories.push(memory.id);
      } else if (Math.random() < this.config.forgettingRate * 0.5) {
        // 较低的遗忘率
        forgottenMemories.push(memory.id);
      }
    });
    
    // 低重要性记忆：大部分被遗忘，少数保留
    lowImportance.forEach(memory => {
      processedMemories.push(memory.id);
      
      // 只保留被多次访问过的低重要性记忆
      const accessCount = memory.accessCount || 0;
      if (accessCount >= 3) {
        const longTermMemory: MemoryItem = {
          ...memory,
          importance: Math.min(1, memory.importance + 0.05),
          tags: [...(memory.tags || []), '长期记忆']
        };
        newLongTermMemories.push(longTermMemory);
      } else if (Math.random() < this.config.forgettingRate) {
        forgottenMemories.push(memory.id);
      }
    });
    
    return {
      processedMemories,
      newLongTermMemories,
      strengthenedMemories,
      forgottenMemories,
      extractedWisdoms
    };
  }
  
  /**
   * 从记忆中提取智慧
   */
  private extractWisdom(memory: MemoryItem): WisdomItem | null {
    // 简化的智慧提取逻辑
    const wisdomTemplates = [
      `从"${memory.content.slice(0, 20)}..."中学到：每个经历都是成长的机会`,
      `领悟：${memory.content.slice(0, 30)}...教会了我重要的一课`,
      `智慧：在这次体验中，我发现了深层的意义`
    ];
    
    return {
      id: `wisdom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      statement: wisdomTemplates[Math.floor(Math.random() * wisdomTemplates.length)],
      derivation: {
        fromExperiences: [memory.id],
        fromReflections: [],
        fromInsights: []
      },
      applicableContexts: [],
      confidence: memory.importance || 0.7,
      formedAt: Date.now(),
      applicationCount: 0,
      successCount: 0
    };
  }
  
  /**
   * 重组知识
   */
  private reorganizeKnowledge(
    concepts: ConceptNode[],
    associations: AssociationEdge[]
  ): KnowledgeReorganizationResult {
    const newAssociations: AssociationEdge[] = [];
    const strengthenedAssociations: string[] = [];
    const newConceptNodes: ConceptNode[] = [];
    const discoveredPatterns: KnowledgePattern[] = [];
    
    // 发现新的关联
    const newAssociation = this.discoverNewAssociation(concepts, associations);
    if (newAssociation) {
      newAssociations.push(newAssociation);
    }
    
    // 强化现有关联
    associations.forEach(assoc => {
      // 模拟Hebbian学习：使用过的关联被强化
      if (assoc.strength < 1) {
        strengthenedAssociations.push(assoc.id);
      }
    });
    
    // 发现模式
    const pattern = this.discoverPattern(concepts, associations);
    if (pattern) {
      discoveredPatterns.push(pattern);
    }
    
    return {
      newAssociations,
      strengthenedAssociations,
      newConceptNodes,
      discoveredPatterns
    };
  }
  
  /**
   * 发现新关联
   */
  private discoverNewAssociation(
    concepts: ConceptNode[],
    existingAssociations: AssociationEdge[]
  ): AssociationEdge | null {
    // 寻找可能相关但尚未关联的概念对
    if (concepts.length < 2) return null;
    
    // 随机选择两个概念（简化版本）
    const idx1 = Math.floor(Math.random() * concepts.length);
    let idx2 = Math.floor(Math.random() * concepts.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * concepts.length);
    }
    
    const concept1 = concepts[idx1];
    const concept2 = concepts[idx2];
    
    // 检查是否已存在关联
    const exists = existingAssociations.some(
      a => (a.sourceId === concept1.id && a.targetId === concept2.id) ||
           (a.sourceId === concept2.id && a.targetId === concept1.id)
    );
    
    if (exists) return null;
    
    // 创建新关联
    return {
      id: `assoc-dream-${Date.now()}`,
      sourceId: concept1.id,
      targetId: concept2.id,
      type: 'related_to',
      strength: 0.3, // 初始强度较低
      metadata: {
        createdFrom: 'dream',
        context: '梦境中发现的新关联',
        confidence: 0.5,
        lastReinforced: Date.now()
      },
      bidirectional: true
    };
  }
  
  /**
   * 发现知识模式
   */
  private discoverPattern(
    concepts: ConceptNode[],
    associations: AssociationEdge[]
  ): KnowledgePattern | null {
    if (concepts.length < 3) return null;
    
    // 简化的模式发现：寻找相似类型的概念群
    const typeGroups = new Map<ConceptType, ConceptNode[]>();
    
    concepts.forEach(c => {
      if (!typeGroups.has(c.type)) {
        typeGroups.set(c.type, []);
      }
      typeGroups.get(c.type)!.push(c);
    });
    
    // 找到最大的类型组
    let maxType: ConceptType | null = null;
    let maxCount = 0;
    
    typeGroups.forEach((group, type) => {
      if (group.length > maxCount) {
        maxCount = group.length;
        maxType = type;
      }
    });
    
    if (maxType && maxCount >= 3) {
      return {
        id: `pattern-${Date.now()}`,
        description: `发现多个${maxType}类型的概念，可能形成一个知识领域`,
        occurrences: maxCount,
        relatedConceptNodes: typeGroups.get(maxType)!.map(c => c.id),
        confidence: 0.7,
        actionable: true
      };
    }
    
    return null;
  }
  
  /**
   * 获取梦境引擎
   */
  getDreamEngine(): DreamEngine {
    return this.dreamEngine;
  }
  
  /**
   * 生成离线处理报告
   */
  generateProcessingReport(result: {
    memoryConsolidation: MemoryConsolidationResult;
    knowledgeReorganization: KnowledgeReorganizationResult;
    dreamContent: DreamContent | null;
  }): string {
    let report = '══════════════ 离线处理报告 ══════════════\n\n';
    
    // 梦境信息
    if (result.dreamContent) {
      report += `🌙 梦境阶段: ${result.dreamContent.phase}\n`;
      report += `📝 梦境叙事: ${result.dreamContent.narrative}\n`;
      report += `💡 洞察数量: ${result.dreamContent.insights.length}\n\n`;
    }
    
    // 记忆整合
    report += `🧠 记忆整合:\n`;
    report += `  - 处理记忆: ${result.memoryConsolidation.processedMemories.length}条\n`;
    report += `  - 转为长期: ${result.memoryConsolidation.newLongTermMemories.length}条\n`;
    report += `  - 强化记忆: ${result.memoryConsolidation.strengthenedMemories.length}条\n`;
    report += `  - 提取智慧: ${result.memoryConsolidation.extractedWisdoms.length}条\n\n`;
    
    // 知识重组
    report += `🔗 知识重组:\n`;
    report += `  - 新关联: ${result.knowledgeReorganization.newAssociations.length}个\n`;
    report += `  - 强化关联: ${result.knowledgeReorganization.strengthenedAssociations.length}个\n`;
    report += `  - 发现模式: ${result.knowledgeReorganization.discoveredPatterns.length}个\n`;
    
    return report;
  }
}
