/**
 * ═══════════════════════════════════════════════════════════════════════
 * 学习模块 (Learner)
 * 
 * 职责：
 * - 从对话中学习新概念
 * - 更新信念系统
 * - 记录新经验
 * - 触发特质演化
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LearningResult, ThinkingProcess } from './types';
import type { MeaningAssigner } from '../meaning-system';
import type { SelfConsciousness } from '../self-consciousness';
import type { LongTermMemory } from '../long-term-memory';
import type { MetacognitionEngine } from '../metacognition';
import type { HebbianNetwork } from '../hebbian-network';
import type { LayeredMemorySystem } from '../layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface LearnerDeps {
  meaningAssigner: MeaningAssigner;
  selfConsciousness: SelfConsciousness;
  longTermMemory: LongTermMemory;
  metacognition: MetacognitionEngine;
  network: HebbianNetwork;
  layeredMemory: LayeredMemorySystem;
}

// ─────────────────────────────────────────────────────────────────────
// 学习模块
// ─────────────────────────────────────────────────────────────────────

export class Learner {
  private deps: LearnerDeps;
  
  constructor(deps: LearnerDeps) {
    this.deps = deps;
  }
  
  /**
   * 执行学习
   */
  async learn(
    input: string, 
    response: string, 
    thinking: ThinkingProcess
  ): Promise<LearningResult> {
    const result: LearningResult = {
      newConcepts: [],
      newBeliefs: [],
      newExperiences: [],
      updatedTraits: [],
      metacognitiveReflection: null,
    };
    
    // 1. 提取新概念
    result.newConcepts = this.extractNewConcepts(input, response);
    
    // 2. 更新信念系统（简化版本）
    result.newBeliefs = this.updateBeliefs(input, response, thinking);
    
    // 3. 记录新经验（简化版本）
    result.newExperiences = this.recordExperiences(input, response, thinking);
    
    // 4. 元认知反思
    result.metacognitiveReflection = this.reflectOnLearning(thinking);
    
    // 5. 更新分层记忆
    this.updateLayeredMemory(input, response, thinking);
    
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 提取新概念
   */
  private extractNewConcepts(input: string, response: string): string[] {
    const concepts: string[] = [];
    const combined = `${input} ${response}`;
    const conceptPatterns = [
      /我学到了?([^\。，。！？]+)/g,
      /理解了?([^\。，。！？]+)/g,
      /发现了?([^\。，。！？]+)/g,
    ];
    
    for (const pattern of conceptPatterns) {
      const matches = combined.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    }
    
    return [...new Set(concepts)].slice(0, 3);
  }
  
  /**
   * 更新信念系统
   */
  private updateBeliefs(
    input: string, 
    _response: string, 
    thinking: ThinkingProcess
  ): string[] {
    const newBeliefs: string[] = [];
    
    // 如果思考链中有高置信度的推理
    const highConfidenceThoughts = thinking.thinkingChain
      .filter(t => t.confidence > 0.8 && t.type === 'inference');
    
    for (const thought of highConfidenceThoughts) {
      if (thought.content.length > 10 && thought.content.length < 100) {
        newBeliefs.push(thought.content);
      }
    }
    
    return newBeliefs;
  }
  
  /**
   * 记录新经验
   */
  private recordExperiences(
    input: string, 
    response: string, 
    thinking: ThinkingProcess
  ): string[] {
    const experiences: string[] = [];
    
    // 记录有意义的交互
    if (thinking.thinkingChain.length >= 3) {
      const summary = `对话：用户说"${input.slice(0, 30)}..."，我回应"${response.slice(0, 30)}..."`;
      experiences.push(summary);
    }
    
    return experiences;
  }
  
  /**
   * 元认知反思
   */
  private reflectOnLearning(thinking: ThinkingProcess): string | null {
    if (thinking.detectedBiases.length > 0) {
      return `我注意到自己存在${thinking.detectedBiases[0]}的倾向，需要更加谨慎。`;
    }
    
    if (thinking.selfQuestions.length > 0) {
      return `我在思考过程中问了自己：${thinking.selfQuestions[0]}`;
    }
    
    const evaluation = thinking.thinkingChain.find(t => t.type === 'evaluation');
    if (evaluation) {
      return evaluation.content;
    }
    
    return null;
  }
  
  /**
   * 更新分层记忆
   */
  private updateLayeredMemory(
    input: string, 
    response: string, 
    thinking: ThinkingProcess
  ): void {
    // 添加到情景记忆
    const content = `用户: ${input}\n我: ${response}`;
    const importance = thinking.thinkingChain.some(t => t.confidence > 0.8) ? 0.7 : 0.4;
    const tags = this.extractTags(input, response);
    
    this.deps.layeredMemory.addEpisodicMemory(content, {
      importance,
      tags,
    });
  }
  
  /**
   * 提取标签
   */
  private extractTags(input: string, response: string): string[] {
    const tags: string[] = [];
    const tagKeywords = ['学习', '理解', '思考', '情感', '关系', '成长', '发现'];
    
    const combined = `${input} ${response}`;
    for (const keyword of tagKeywords) {
      if (combined.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createLearner(deps: LearnerDeps): Learner {
  return new Learner(deps);
}
