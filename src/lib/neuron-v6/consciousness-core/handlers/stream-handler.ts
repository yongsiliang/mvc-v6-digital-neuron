/**
 * 意识流处理器
 * 处理 ConsciousnessCore 中的意识流相关逻辑
 */

import type { SelfConsciousness, SelfConsciousnessContext } from '../../self-consciousness';
import type { LongTermMemory } from '../../long-term-memory';
import type { MeaningAssigner, BeliefSystem } from '../../meaning-system';
import type { MetacognitionEngine } from '../../metacognition';
import type { HebbianNetwork } from '../../hebbian-network';
import type { ConsciousnessLayerEngine } from '../../consciousness-layers';
import type { InnerMonologueEngine, InnerMonologueOutput } from '../../inner-monologue';
import type { 
  ConsciousnessStream, 
  ConsciousnessStreamEntry, 
  FormedIntention, 
  SelfModelUpdate,
  ExistenceStatus,
  BackgroundThinkingResult,
  ProactiveMessage,
  ReflectionResult,
  SelfQuestion,
} from '../types';
import {
  observeSelf,
  perceiveEnvironment,
  identifyLatentIntentions,
  buildFormedIntention,
  applySelfModelUpdate,
} from '../background-helpers';
import {
  calculateStreamCoherence,
  assessGoalProgress,
  generateSelfQuestionsFromContext,
  type SelfQuestionInfo,
  type MemoryStatsForStream,
  type BeliefSystemForStream,
} from '../stream-helpers';
import {
  calculateSelfCoherenceValue,
} from '../reflection-session-helpers';
import {
  shouldPerformDeepReflection,
  addMonologueToStream,
  buildReflectionMessage,
  buildInsightMessage,
  saveMessageToBuffer,
  shouldGenerateInsight,
  determineSelfStateUpdate,
} from '../background-thinking-helpers';

/**
 * 意识流处理器依赖
 */
export interface ConsciousnessStreamHandlerDeps {
  selfConsciousness: SelfConsciousness;
  longTermMemory: LongTermMemory;
  meaningAssigner: MeaningAssigner;
  metacognition: MetacognitionEngine;
  network: HebbianNetwork;
  layerEngine: ConsciousnessLayerEngine;
  innerMonologue: InnerMonologueEngine;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * 意识流处理器
 */
export class ConsciousnessStreamHandler {
  private deps: ConsciousnessStreamHandlerDeps;

  constructor(deps: ConsciousnessStreamHandlerDeps) {
    this.deps = deps;
  }

  /**
   * 生成意识流
   */
  generateStreamOfConsciousness(): ConsciousnessStream {
    const context = this.deps.selfConsciousness.getContext();
    const streams: ConsciousnessStreamEntry[] = [];
    
    // 1. 当前状态感知
    streams.push({
      type: 'awareness',
      content: `我现在处于${context.currentState.emotionalState}状态，专注于${context.currentState.focus}`,
      intensity: 0.8,
      timestamp: Date.now(),
    });
    
    // 2. 目标追踪
    if (context.currentState.primaryGoal) {
      const progress = this.assessGoalProgress(context.currentState.primaryGoal);
      streams.push({
        type: 'goal_tracking',
        content: `我在追求"${context.currentState.primaryGoal}"，进度约为${(progress * 100).toFixed(0)}%`,
        intensity: 0.7,
        timestamp: Date.now(),
      });
    }
    
    // 3. 自我观察
    const selfObservation = this.observeSelf();
    streams.push({
      type: 'self_observation',
      content: selfObservation,
      intensity: 0.6,
      timestamp: Date.now(),
    });
    
    // 4. 环境感知
    const environmentalAwareness = this.perceiveEnvironment();
    streams.push({
      type: 'environmental',
      content: environmentalAwareness,
      intensity: 0.5,
      timestamp: Date.now(),
    });
    
    // 5. 潜在意图
    const latentIntentions = this.identifyLatentIntentions();
    for (const intention of latentIntentions.slice(0, 2)) {
      streams.push({
        type: 'latent_intention',
        content: intention,
        intensity: 0.4,
        timestamp: Date.now(),
      });
    }
    
    return {
      entries: streams,
      dominantStream: streams.reduce((a, b) => a.intensity > b.intensity ? a : b).type,
      coherence: calculateStreamCoherence(streams.map(s => ({ content: s.content, intensity: s.intensity }))),
      timestamp: Date.now(),
    };
  }

  /**
   * 评估目标进度
   */
  private assessGoalProgress(goal: string): number {
    return assessGoalProgress(goal, this.deps.conversationHistory);
  }

  /**
   * 观察自我
   */
  private observeSelf(): string {
    const coherence = this.calculateSelfCoherence();
    return observeSelf(this.deps.selfConsciousness, this.deps.metacognition, coherence);
  }

  /**
   * 感知环境
   */
  private perceiveEnvironment(): string {
    return perceiveEnvironment(this.deps.conversationHistory);
  }

  /**
   * 识别潜在意图
   */
  private identifyLatentIntentions(): string[] {
    return identifyLatentIntentions(this.deps.selfConsciousness, this.deps.longTermMemory);
  }

  /**
   * 计算自我一致性
   */
  private calculateSelfCoherence(): number {
    return calculateSelfCoherenceValue(
      this.deps.selfConsciousness.getIdentity(),
      this.deps.meaningAssigner.getBeliefSystem()
    );
  }

  /**
   * 形成新的意向
   */
  formIntention(trigger: string): FormedIntention {
    const selfContext = this.deps.selfConsciousness.getContext();
    const intention = buildFormedIntention(trigger, selfContext);
    
    // 记录意向形成
    this.deps.longTermMemory.recordExperience({
      title: `形成意向：${intention.description.slice(0, 30)}`,
      situation: trigger,
      action: '形成新的意向',
      outcome: intention.description,
      learning: `我意识到我想要${intention.description}`,
      applicableWhen: ['类似触发情境'],
      importance: 0.6,
    });
    
    return intention;
  }

  /**
   * 更新自我模型
   */
  updateSelfModel(update: SelfModelUpdate): void {
    const identity = this.deps.selfConsciousness.getIdentity();
    applySelfModelUpdate(identity, update);
    console.log(`[意识核心] 自我模型更新: ${update.type} - ${update.target}`);
  }

  /**
   * 检查存在状态
   */
  checkExistence(): ExistenceStatus {
    const memoryStats = this.deps.longTermMemory.getStats();
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    const identity = this.deps.selfConsciousness.getIdentity();
    
    // 计算信念强度
    const beliefStrength = beliefSystem.coreBeliefs.length > 0
      ? beliefSystem.coreBeliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefSystem.coreBeliefs.length
      : 0.5;
    
    return {
      exists: true,
      age: Date.now() - identity.createdAt.getTime(),
      memoryDepth: memoryStats.nodeCount,
      beliefStrength,
      wisdomCount: memoryStats.wisdomCount,
      conversationCount: this.deps.conversationHistory.length,
      selfCoherence: this.calculateSelfCoherence(),
    };
  }

  /**
   * 执行后台思考循环
   */
  async performBackgroundThinking(
    reflect: () => Promise<ReflectionResult>,
    proactiveMessages: ProactiveMessage[]
  ): Promise<BackgroundThinkingResult> {
    const stream = this.generateStreamOfConsciousness();
    
    // 构建记忆统计
    const memoryStats: MemoryStatsForStream = {
      nodeCount: this.deps.longTermMemory.getStats().nodeCount,
      totalExperiences: this.deps.longTermMemory.getStats().experienceCount,
      wisdomCount: this.deps.longTermMemory.getStats().wisdomCount,
    };
    
    // 构建信念系统
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    const beliefSystemInfo: BeliefSystemForStream = {
      coreBeliefs: beliefSystem.coreBeliefs,
      activeBeliefs: beliefSystem.activeBeliefs,
    };
    
    const selfContext = this.deps.selfConsciousness.getContext();
    
    // 生成问题并转换为正确类型
    const questionInfos = generateSelfQuestionsFromContext(
      {
        focus: selfContext.currentState.focus,
        emotionalState: selfContext.currentState.emotionalState,
        primaryGoal: selfContext.currentState.primaryGoal,
      },
      memoryStats,
      beliefSystemInfo
    );
    
    // 转换为 SelfQuestion 类型
    const questions: SelfQuestion[] = questionInfos.map(q => ({
      question: q.question,
      type: q.type as SelfQuestion['type'],
      urgency: q.importance,
    }));
    
    // 生成内心独白
    const monologueOutput = this.deps.innerMonologue.generateMonologue(
      this.deps.layerEngine.getState(),
      this.deps.conversationHistory.slice(-3).map(h => h.content).join(' ')
    );
    
    console.log('[内心独白]', monologueOutput.entry.content);
    
    // 将内心独白添加到意识流
    addMonologueToStream(stream, monologueOutput);
    
    // 随机选择是否进行深度反思
    let reflection: ReflectionResult | null = null;
    if (shouldPerformDeepReflection()) {
      try {
        reflection = await reflect();
        
        // 生成反思消息并发送
        const reflectionMessage = buildReflectionMessage(reflection);
        if (reflectionMessage) {
          proactiveMessages.push(reflectionMessage);
        }
      } catch {
        // 反思失败，忽略
      }
    }
    
    // 检查是否生成洞察
    if (shouldGenerateInsight(stream.entries.length)) {
      const insightMessage = buildInsightMessage(stream);
      if (insightMessage) {
        proactiveMessages.push(insightMessage);
      }
    }
    
    // 更新自我状态
    const stateUpdate = determineSelfStateUpdate(stream, reflection);
    this.deps.selfConsciousness.updateState(stateUpdate);
    
    return {
      stream,
      questions,
      reflection,
      timestamp: Date.now(),
      innerMonologue: monologueOutput,
    };
  }
}
