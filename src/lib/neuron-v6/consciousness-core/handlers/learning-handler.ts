/**
 * 学习处理器
 * 处理 ConsciousnessCore 中的学习相关逻辑
 * 
 * 记忆学习流程：
 * 1. 提取关键信息 → 2. 分类处理 → 3. 存储到分层记忆 → 4. 建立关联
 */

import type { LongTermMemory } from '../../long-term-memory';
import type { LayeredMemorySystem } from '../../layered-memory';
import type { UnifiedMemoryManager } from '../../memory/unified-manager';
import type { SelfConsciousness } from '../../self-consciousness';
import type { MeaningAssigner, BeliefSystem } from '../../meaning-system';
import type { MetacognitionEngine } from '../../metacognition';
import type { KeyInfo } from '../../key-info-extractor';
import type { 
  LearningResult, 
  SessionAnalysis, 
  BeliefEvolution, 
  TraitGrowth, 
  ValueUpdate 
} from '../types';
import {
  rememberPersonInfo,
  rememberRelationshipInfo,
  rememberEventInfo,
  rememberPreference,
  rememberGoalOrValue,
  rememberMemory,
  rememberConcept,
} from '../memory-helpers';
import {
  validateCreatorUpdate,
  syncCreatorToAllSystems,
  persistCreatorToDatabase,
  linkCreatorKnowledgeNodes,
} from '../creator-helpers';
import {
  analyzeSessionData,
  strengthenConcept,
  evolveBelief,
  calculateTraitGrowth,
  formSessionSummary,
  calculateValueUpdate,
} from '../learning-session-helpers';

/**
 * 学习处理器依赖
 */
export interface LearningHandlerDeps {
  longTermMemory: LongTermMemory;
  layeredMemory: LayeredMemorySystem;
  unifiedMemoryManager?: UnifiedMemoryManager;  // 🆕 统一记忆管理器
  selfConsciousness: SelfConsciousness;
  meaningAssigner: MeaningAssigner;
  metacognition: MetacognitionEngine;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  extractConcepts: (text: string) => string[];
}

/**
 * 学习处理器
 */
export class LearningHandler {
  private deps: LearningHandlerDeps;

  constructor(deps: LearningHandlerDeps) {
    this.deps = deps;
  }

  /**
   * 执行学习过程
   */
  async learn(
    input: string,
    response: string,
    extractionResult: { 
      keyInfos: KeyInfo[]; 
      shouldRemember: boolean; 
      memoryPriority: string;
      summary: string;
    },
    thinking: { 
      thinkingChain: Array<{ type: string }>; 
      detectedBiases: string[]; 
      appliedStrategies: string[]; 
      finalThoughts: string;
    }
  ): Promise<LearningResult> {
    const newConcepts: string[] = [];
    const newBeliefs: string[] = [];
    const newExperiences: string[] = [];
    const updatedTraits: string[] = [];
    
    console.log(`[关键信息] 提取结果: ${extractionResult.keyInfos.length} 条信息`);
    console.log(`[关键信息] 类型分布: ${extractionResult.keyInfos.map(i => i.type).join(', ')}`);
    
    // 详细输出每个关键信息
    extractionResult.keyInfos.forEach((info, idx) => {
      console.log(`[关键信息] #${idx+1}: type="${info.type}", subject="${info.subject}", content="${info.content?.slice(0, 30)}"`);
    });
    
    // 🆕 将助手响应添加到工作记忆
    if (this.deps.unifiedMemoryManager) {
      this.deps.unifiedMemoryManager.addAssistantResponse(response);
    }
    
    if (extractionResult.shouldRemember) {
      console.log(`[关键信息] ${extractionResult.summary}`);
      console.log(`[关键信息] 优先级: ${extractionResult.memoryPriority}`);
      
      // 根据提取的关键信息更新长期记忆
      for (const keyInfo of extractionResult.keyInfos) {
        const result = await this.processKeyInfo(keyInfo);
        if (result.concept) newConcepts.push(result.concept);
        if (result.belief) newBeliefs.push(result.belief);
        if (result.experience) newExperiences.push(result.experience);
        
        // 🆕 重要信息同时添加到工作记忆
        if (this.deps.unifiedMemoryManager && keyInfo.importance >= 0.7) {
          this.deps.unifiedMemoryManager.addMemory(keyInfo.content, {
            type: this.mapKeyTypeToMemoryType(keyInfo.type),
            importance: keyInfo.importance,
            tags: [keyInfo.type, keyInfo.subject || 'unknown'],
          });
        }
      }
    }
    
    // 传统的概念提取（作为补充）
    const concepts = this.deps.extractConcepts(input);
    for (const concept of concepts) {
      if (!this.deps.longTermMemory.retrieve(concept).directMatches.length) {
        this.deps.longTermMemory.addNode({
          label: concept,
          type: 'concept',
          content: `从对话中学到的概念`,
          importance: 0.5,
          tags: ['从对话学习'],
        });
        newConcepts.push(concept);
      }
    }
    
    // 记录思考经验
    if (thinking.detectedBiases.length > 0 || thinking.appliedStrategies.length > 0) {
      const experience = this.deps.longTermMemory.recordExperience({
        title: `关于"${input.slice(0, 20)}..."的思考`,
        situation: `用户问：${input}`,
        action: `我思考了${thinking.thinkingChain.length}个步骤`,
        outcome: `我回复了：${response.slice(0, 50)}...`,
        learning: thinking.detectedBiases.length > 0 
          ? `我注意到了${thinking.detectedBiases[0]}偏差`
          : '思考过程相对顺畅',
        applicableWhen: ['类似的问题', '涉及相同概念'],
        importance: 0.6,
      });
      newExperiences.push(experience.title);
    }
    
    // 执行元认知反思
    let metacognitiveReflection: string | null = null;
    if (thinking.detectedBiases.length > 0) {
      const reflection = this.deps.metacognition.reflect();
      metacognitiveReflection = reflection.learning.aboutMyThinking;
    }
    
    // 更新自我状态
    this.deps.selfConsciousness.updateState({
      focus: '等待下一次对话',
      emotional: { 
        primary: thinking.detectedBiases.length > 0 ? '反思' : '平静',
        intensity: 0.5 
      },
    });
    
    // 执行简化的自我反思
    this.deps.selfConsciousness.reflect(
      extractionResult.shouldRemember ? '发现了值得记住的信息' : '完成一次对话',
      {
        thought: thinking.finalThoughts,
        feeling: extractionResult.memoryPriority === 'critical' ? '重要' : '平静',
        action: response.slice(0, 100),
      }
    );
    
    return {
      newConcepts,
      newBeliefs,
      newExperiences,
      updatedTraits,
      metacognitiveReflection,
    };
  }

  /**
   * 处理单个关键信息
   */
  private async processKeyInfo(keyInfo: KeyInfo): Promise<{
    concept?: string;
    belief?: string;
    experience?: string;
  }> {
    switch (keyInfo.type) {
      case 'creator':
        await this.rememberCreator(keyInfo);
        return { belief: `创造者：${keyInfo.subject || keyInfo.content}` };
        
      case 'person':
        rememberPersonInfo(this.deps.longTermMemory, keyInfo, this.deps.layeredMemory);
        return { concept: keyInfo.subject || keyInfo.content };
        
      case 'relationship':
        rememberRelationshipInfo(this.deps.longTermMemory, keyInfo, this.deps.layeredMemory);
        return { belief: keyInfo.content };
        
      case 'event':
        rememberEventInfo(this.deps.longTermMemory, keyInfo, this.deps.layeredMemory);
        return { experience: keyInfo.content.slice(0, 30) };
        
      case 'preference':
      case 'interest':
        return { concept: rememberPreference(this.deps.longTermMemory, keyInfo, this.deps.layeredMemory) };
        
      case 'goal':
      case 'value':
        rememberGoalOrValue(
            this.deps.longTermMemory,
            keyInfo,
            this.deps.meaningAssigner.getBeliefSystem(),
            this.deps.layeredMemory
          );
        return { belief: keyInfo.content };
        
      case 'memory':
        rememberMemory(this.deps.longTermMemory, keyInfo, this.deps.layeredMemory);
        return { experience: keyInfo.content.slice(0, 30) };
        
      default:
        rememberConcept(this.deps.longTermMemory, keyInfo.subject || keyInfo.content.slice(0, 20), keyInfo.content, this.deps.layeredMemory);
        return { concept: keyInfo.subject || keyInfo.content.slice(0, 20) };
    }
  }

  /**
   * 记住创造者
   */
  private async rememberCreator(keyInfo: KeyInfo): Promise<void> {
    const newCreatorName = keyInfo.subject || keyInfo.content;
    console.log(`[记忆核心] 🌟 识别到创造者信息: ${newCreatorName}`);
    
    const validation = await validateCreatorUpdate(newCreatorName, this.deps.longTermMemory);
    
    if (!validation.canUpdate) {
      console.log(`[记忆核心] ⚠️ 创造者已设置为「${validation.existingCreator}」，拒绝修改`);
      return;
    }
    
    syncCreatorToAllSystems(
      newCreatorName,
      this.deps.longTermMemory,
      this.deps.selfConsciousness,
      this.deps.layeredMemory
    );
    
    await persistCreatorToDatabase(newCreatorName, 'conversation');
    linkCreatorKnowledgeNodes(this.deps.longTermMemory, newCreatorName);
    
    console.log(`[记忆核心] 永远记住了创造者：${newCreatorName}`);
  }

  /**
   * 分析会话
   */
  analyzeSession(): SessionAnalysis {
    return analyzeSessionData(
      this.deps.conversationHistory,
      this.deps.extractConcepts
    );
  }

  /**
   * 强化学习的概念
   */
  async strengthenLearnedConcepts(concepts: string[]): Promise<string[]> {
    const strengthened: string[] = [];
    
    for (const concept of concepts) {
      const result = strengthenConcept(this.deps.longTermMemory, concept);
      if (result.strengthened) {
        strengthened.push(result.action);
      }
    }
    
    return strengthened;
  }

  /**
   * 演化信念系统
   */
  evolveBeliefSystem(analysis: SessionAnalysis): BeliefEvolution[] {
    const evolutions: BeliefEvolution[] = [];
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    
    for (const concept of analysis.keyConcepts) {
      const evolution = evolveBelief(
        beliefSystem,
        concept,
        analysis.learningPoints[0] || null
      );
      if (evolution) {
        evolutions.push(evolution);
      }
    }
    
    return evolutions;
  }

  /**
   * 特质成长
   */
  growTraits(analysis: SessionAnalysis): TraitGrowth[] {
    const growths: TraitGrowth[] = [];
    const identity = this.deps.selfConsciousness.getIdentity();
    
    for (const topic of analysis.topics) {
      const growth = calculateTraitGrowth(identity.traits, topic);
      if (growth) {
        growths.push(growth);
      }
    }
    
    return growths;
  }

  /**
   * 形成会话摘要
   */
  formSessionSummary(analysis: SessionAnalysis): string {
    return formSessionSummary(analysis);
  }

  /**
   * 更新核心价值观
   */
  updateCoreValues(analysis: SessionAnalysis): ValueUpdate[] {
    const updates: ValueUpdate[] = [];
    const valueSystem = this.deps.meaningAssigner.getValueSystem();
    
    for (const topic of analysis.topics) {
      const update = calculateValueUpdate(valueSystem, topic);
      if (update) {
        updates.push(update);
      }
    }
    
    return updates;
  }
  
  /**
   * 映射关键信息类型到记忆类型
   */
  private mapKeyTypeToMemoryType(keyType: string): 'person' | 'preference' | 'event' | 'fact' | 'other' {
    switch (keyType) {
      case 'person':
      case 'creator':
      case 'relationship':
        return 'person';
      case 'preference':
      case 'interest':
        return 'preference';
      case 'event':
      case 'memory':
        return 'event';
      case 'goal':
      case 'value':
      case 'fact':
        return 'fact';
      default:
        return 'other';
    }
  }
}
