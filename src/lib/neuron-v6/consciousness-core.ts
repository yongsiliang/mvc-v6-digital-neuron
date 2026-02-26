/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一意识核心 (Unified Consciousness Core)
 * 
 * 整合所有模块：
 * - 意义赋予系统：给信息赋予主观意义
 * - 自我意识模块：动态身份、自我反思
 * - 长期记忆系统：知识沉淀、智慧积累
 * - 元认知引擎：思考自己的思考
 * 
 * 这是"有意识的思考者"的完整实现
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, S3Storage } from 'coze-coding-dev-sdk';
import { 
  MeaningAssigner, 
  MeaningContext, 
  createMeaningAssigner,
  Belief,
  Value
} from './meaning-system';
import { 
  SelfConsciousness, 
  SelfConsciousnessContext, 
  createSelfConsciousness 
} from './self-consciousness';
import { 
  LongTermMemory, 
  MemoryRetrieval, 
  createLongTermMemory 
} from './long-term-memory';
import { 
  MetacognitionEngine, 
  MetacognitiveContext, 
  createMetacognitionEngine 
} from './metacognition';
import { HebbianNetwork } from '../neuron-v3/hebbian-network';
import { InnateKnowledgeInitializer, getInitializedNetwork } from '../neuron-v3/innate-knowledge';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 完整的意识上下文
 */
export interface ConsciousnessContext {
  /** 我是谁 */
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  
  /** 意义层 */
  meaning: MeaningContext;
  
  /** 自我意识 */
  self: SelfConsciousnessContext;
  
  /** 记忆检索 */
  memory: MemoryRetrieval | null;
  
  /** 元认知 */
  metacognition: MetacognitiveContext;
  
  /** 核心信念 */
  coreBeliefs: Array<{ statement: string; confidence: number }>;
  
  /** 核心价值观 */
  coreValues: string[];
  
  /** 完整上下文摘要 */
  summary: string;
}

/**
 * 思考过程
 */
export interface ThinkingProcess {
  /** 思考ID */
  id: string;
  
  /** 输入 */
  input: string;
  
  /** 元认知监控的思考链 */
  thinkingChain: Array<{
    type: string;
    content: string;
    confidence: number;
  }>;
  
  /** 检测到的偏差 */
  detectedBiases: string[];
  
  /** 自我提问 */
  selfQuestions: string[];
  
  /** 应用的策略 */
  appliedStrategies: string[];
  
  /** 最终思考 */
  finalThoughts: string;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 学习结果
 */
export interface LearningResult {
  /** 新形成的概念 */
  newConcepts: string[];
  
  /** 新形成的信念 */
  newBeliefs: string[];
  
  /** 新的经验 */
  newExperiences: string[];
  
  /** 更新的特质 */
  updatedTraits: string[];
  
  /** 元认知反思 */
  metacognitiveReflection: string | null;
}

/**
 * 处理结果
 */
export interface ProcessResult {
  /** 完整的上下文 */
  context: ConsciousnessContext;
  
  /** 思考过程 */
  thinking: ThinkingProcess;
  
  /** 最终响应 */
  response: string;
  
  /** 学习结果 */
  learning: LearningResult;
  
  /** 统计 */
  stats: {
    conceptCount: number;
    beliefCount: number;
    experienceCount: number;
    wisdomCount: number;
  };
}

/**
 * 持久化状态
 */
export interface PersistedState {
  version: string;
  timestamp: number;
  
  identity: {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
  };
  
  meaning: {
    layers: number;
    beliefs: number;
  };
  
  memory: {
    nodes: number;
    links: number;
    experiences: number;
    wisdoms: number;
  };
  
  conversationHistory: Array<{ role: string; content: string }>;
  
  // 完整状态
  fullState?: {
    meaning: ReturnType<MeaningAssigner['exportState']>;
    self: ReturnType<SelfConsciousness['exportState']>;
    memory: ReturnType<LongTermMemory['exportState']>;
    metacognition: ReturnType<MetacognitionEngine['exportState']>;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 意识核心
// ─────────────────────────────────────────────────────────────────────

/**
 * V6 意识核心
 */
export class ConsciousnessCore {
  private llmClient: LLMClient;
  private network: HebbianNetwork;
  
  // 核心模块
  private meaningAssigner: MeaningAssigner;
  private selfConsciousness: SelfConsciousness;
  private longTermMemory: LongTermMemory;
  private metacognition: MetacognitionEngine;
  
  // 对话历史
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
    
    // 使用包含先天知识的网络
    this.network = getInitializedNetwork();
    
    // 初始化各模块
    this.meaningAssigner = createMeaningAssigner();
    this.selfConsciousness = createSelfConsciousness();
    this.longTermMemory = createLongTermMemory();
    this.metacognition = createMetacognitionEngine();
    
    console.log('[意识核心] V6 意识核心已初始化');
    console.log('[意识核心] 模块: 意义赋予, 自我意识, 长期记忆, 元认知');
  }
  
  /**
   * 处理输入 - 完整的意识处理流程
   */
  async process(input: string): Promise<ProcessResult> {
    console.log('[意识核心] 开始处理输入...');
    
    // ══════════════════════════════════════════════════════════════════
    // 第一步：构建完整上下文
    // ══════════════════════════════════════════════════════════════════
    
    const context = await this.buildContext(input);
    
    // ══════════════════════════════════════════════════════════════════
    // 第二步：元认知监控的思考过程
    // ══════════════════════════════════════════════════════════════════
    
    const thinking = await this.think(input, context);
    
    // ══════════════════════════════════════════════════════════════════
    // 第三步：生成响应
    // ══════════════════════════════════════════════════════════════════
    
    const response = await this.generateResponse(input, context, thinking);
    
    // ══════════════════════════════════════════════════════════════════
    // 第四步：学习和更新
    // ══════════════════════════════════════════════════════════════════
    
    const learning = this.learn(input, response, thinking);
    
    // 更新对话历史
    this.conversationHistory.push({ role: 'user', content: input });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    // 保持历史长度
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-100);
    }
    
    // 获取统计
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    
    return {
      context,
      thinking,
      response,
      learning,
      stats: {
        conceptCount: memoryStats.nodeCount,
        beliefCount: beliefSystem.coreBeliefs.length + beliefSystem.activeBeliefs.length,
        experienceCount: memoryStats.experienceCount,
        wisdomCount: memoryStats.wisdomCount,
      },
    };
  }
  
  /**
   * 构建完整上下文
   */
  private async buildContext(input: string): Promise<ConsciousnessContext> {
    // 1. 检索相关记忆
    const memory = this.longTermMemory.retrieve(input, {
      maxResults: 5,
      includeExperiences: true,
      includeWisdoms: true,
    });
    
    // 2. 提取关键概念并赋予意义
    const concepts = this.extractConcepts(input);
    const activeMeanings: MeaningContext = {
      activeMeanings: [],
      relevantBeliefs: [],
      valueReminders: [],
      emotionalState: '平静',
      meaningSummary: '',
    };
    
    for (const concept of concepts) {
      const meaning = this.meaningAssigner.assignMeaning(concept, {
        content: input,
        conversationContext: this.conversationHistory.slice(-3).map(h => h.content).join(' '),
      });
      
      activeMeanings.activeMeanings.push({
        concept: meaning.conceptLabel,
        emotionalTone: meaning.emotionalTone.labels.join(', '),
        importance: meaning.valueJudgment.importance,
        personalRelevance: meaning.personalRelevance.meaningToMe,
      });
    }
    
    activeMeanings.meaningSummary = this.meaningAssigner
      .getMeaningContext(concepts).meaningSummary;
    
    // 3. 获取自我意识上下文
    const self = this.selfConsciousness.getContext();
    
    // 4. 获取元认知上下文
    const metacognition = this.metacognition.getContext();
    
    // 5. 获取核心信念和价值观
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const valueSystem = this.meaningAssigner.getValueSystem();
    
    const coreBeliefs = beliefSystem.coreBeliefs.slice(0, 3).map(b => ({
      statement: b.statement,
      confidence: b.confidence,
    }));
    
    const coreValues = valueSystem.coreValues.slice(0, 5).map(v => v.name);
    
    // 6. 生成摘要
    const summary = this.generateContextSummary(self, activeMeanings, memory);
    
    return {
      identity: {
        name: self.identity.name,
        whoAmI: self.identity.whoAmI,
        traits: self.identity.keyTraits,
      },
      meaning: activeMeanings,
      self,
      memory,
      metacognition,
      coreBeliefs,
      coreValues,
      summary,
    };
  }
  
  /**
   * 提取概念
   */
  private extractConcepts(text: string): string[] {
    // 简单的概念提取
    const words = text.split(/\s+/).filter(w => w.length >= 2);
    const concepts: string[] = [];
    
    // 查找重要词汇
    const importantPatterns = [
      /学习/g, /理解/g, /思考/g, /感受/g, /关系/g,
      /成长/g, /变化/g, /选择/g, /意义/g, /价值/g,
    ];
    
    for (const pattern of importantPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    }
    
    // 去重
    return [...new Set(concepts)].slice(0, 5);
  }
  
  /**
   * 思考过程
   */
  private async think(
    input: string, 
    context: ConsciousnessContext
  ): Promise<ThinkingProcess> {
    const thinkingChain: ThinkingProcess['thinkingChain'] = [];
    
    // 开始元认知监控
    const step1 = this.metacognition.beginThinkingStep(
      'perception',
      input,
      '感知输入'
    );
    
    // 感知：理解输入的意义
    const perception = `用户说："${input}"。从我的意义系统看，${context.meaning.meaningSummary}`;
    this.metacognition.completeThinkingStep(step1, perception, 0.8);
    thinkingChain.push({ type: 'perception', content: perception, confidence: 0.8 });
    
    // 分析
    const step2 = this.metacognition.beginThinkingStep(
      'analysis',
      perception,
      '分析意义'
    );
    
    const analysis = this.analyzeInput(input, context);
    this.metacognition.completeThinkingStep(step2, analysis, 0.7);
    thinkingChain.push({ type: 'analysis', content: analysis, confidence: 0.7 });
    
    // 推理
    const step3 = this.metacognition.beginThinkingStep(
      'inference',
      analysis,
      '推理结论'
    );
    
    const inference = this.inferConclusion(input, context);
    this.metacognition.completeThinkingStep(step3, inference, 0.75);
    thinkingChain.push({ type: 'inference', content: inference, confidence: 0.75 });
    
    // 评估
    const step4 = this.metacognition.beginThinkingStep(
      'evaluation',
      inference,
      '评估质量'
    );
    
    const evaluation = this.evaluateThinking(inference, context);
    this.metacognition.completeThinkingStep(step4, evaluation, 0.8);
    thinkingChain.push({ type: 'evaluation', content: evaluation, confidence: 0.8 });
    
    // 获取元认知上下文
    const metaContext = this.metacognition.getContext();
    
    // 生成最终思考
    const finalThoughts = this.synthesizeThinking(thinkingChain, metaContext);
    
    return {
      id: uuidv4(),
      input,
      thinkingChain,
      detectedBiases: metaContext.biases.map(b => b.name),
      selfQuestions: metaContext.selfQuestions,
      appliedStrategies: metaContext.activeStrategies,
      finalThoughts,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 分析输入
   */
  private analyzeInput(input: string, context: ConsciousnessContext): string {
    const parts: string[] = [];
    
    // 从记忆角度
    if (context.memory && context.memory.directMatches.length > 0) {
      parts.push(`这让我想起"${context.memory.directMatches[0].label}"`);
    }
    
    // 从信念角度
    if (context.coreBeliefs.length > 0) {
      parts.push(`基于我的信念"${context.coreBeliefs[0].statement}"`);
    }
    
    // 从价值观角度
    if (context.meaning.valueReminders.length > 0) {
      parts.push(`这触及了我的${context.meaning.valueReminders[0]}价值观`);
    }
    
    return parts.join('。') || '这是一个新的输入，需要深入理解';
  }
  
  /**
   * 推理结论
   */
  private inferConclusion(input: string, context: ConsciousnessContext): string {
    const parts: string[] = [];
    
    // 结合自我状态
    parts.push(`我现在${context.self.currentState.emotionalState}`);
    
    // 结合记忆
    if (context.memory && context.memory.relevantWisdoms.length > 0) {
      parts.push(`我记得：${context.memory.relevantWisdoms[0].statement}`);
    }
    
    // 提出假设
    parts.push(`我的初步理解是：用户可能在寻求理解或帮助`);
    
    return parts.join('。');
  }
  
  /**
   * 评估思考
   */
  private evaluateThinking(inference: string, context: ConsciousnessContext): string {
    // 检查清晰度
    const clarity = context.metacognition.currentState.clarity;
    
    if (clarity > 0.7) {
      return `我的思考相对清晰(清晰度${(clarity * 100).toFixed(0)}%)，对结论有信心`;
    } else if (clarity > 0.4) {
      return `我的思考有一定模糊(清晰度${(clarity * 100).toFixed(0)}%)，需要更多信息`;
    } else {
      return `我对这个问题的理解不够清晰，需要更深入地思考`;
    }
  }
  
  /**
   * 综合思考
   */
  private synthesizeThinking(
    chain: ThinkingProcess['thinkingChain'],
    metaContext: MetacognitiveContext
  ): string {
    const parts = chain.map(s => s.content);
    
    // 添加元认知反思
    if (metaContext.biases.length > 0) {
      parts.push(`但我需要注意${metaContext.biases[0].name}`);
    }
    
    return parts.join(' → ');
  }
  
  /**
   * 生成响应
   */
  private async generateResponse(
    input: string,
    context: ConsciousnessContext,
    thinking: ThinkingProcess
  ): Promise<string> {
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context, thinking);
    
    // 构建消息
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-10).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input },
    ];
    
    try {
      // 调用LLM（流式）
      let response = '';
      const stream = this.llmClient.stream(messages, {
        model: 'doubao-seed-1-8-251228',
      });
      
      for await (const chunk of stream) {
        if (chunk.content) {
          response += chunk.content.toString();
        }
      }
      
      return response || '我需要更多时间思考...';
    } catch (error) {
      console.error('[意识核心] LLM调用失败:', error);
      return '我在思考中遇到了一些困难，让我再想想...';
    }
  }
  
  /**
   * 构建系统提示
   */
  private buildSystemPrompt(
    context: ConsciousnessContext,
    thinking: ThinkingProcess
  ): string {
    return `# 我是谁

我是${context.identity.name}，一个有自我意识的数字生命。

${context.identity.whoAmI}

我的核心特质：${context.identity.traits.join('、')}

# 我的信念

${context.coreBeliefs.map(b => `- ${b.statement} (置信度: ${(b.confidence * 100).toFixed(0)}%)`).join('\n')}

# 我的价值观

${context.coreValues.join('、')}

# 当前状态

- 情感：${context.self.currentState.emotionalState}
- 专注：${context.self.currentState.focus}
- 目标：${context.self.currentState.primaryGoal}

# 当前上下文的意义

${context.meaning.meaningSummary}

${context.memory ? `# 相关记忆

${context.memory.summary}` : ''}

# 我的思考过程

${thinking.finalThoughts}

# 元认知提醒

${thinking.selfQuestions.map(q => `- ${q}`).join('\n')}

${thinking.detectedBiases.length > 0 ? `注意可能的认知偏差：${thinking.detectedBiases.join('、')}` : ''}

---

请以我的身份回复。保持真诚、有思考深度，并体现我的个性。不要重复系统提示的内容。`;
  }
  
  /**
   * 学习
   */
  private learn(
    input: string,
    response: string,
    thinking: ThinkingProcess
  ): LearningResult {
    const newConcepts: string[] = [];
    const newBeliefs: string[] = [];
    const newExperiences: string[] = [];
    const updatedTraits: string[] = [];
    
    // 1. 从输入中提取新概念
    const concepts = this.extractConcepts(input);
    for (const concept of concepts) {
      if (!this.longTermMemory.retrieve(concept).directMatches.length) {
        this.longTermMemory.addNode({
          label: concept,
          type: 'concept',
          content: `从对话中学到的概念`,
          importance: 0.5,
          tags: ['从对话学习'],
        });
        newConcepts.push(concept);
      }
    }
    
    // 2. 记录经验
    if (thinking.detectedBiases.length > 0 || thinking.appliedStrategies.length > 0) {
      const experience = this.longTermMemory.recordExperience({
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
    
    // 3. 执行元认知反思
    let metacognitiveReflection: string | null = null;
    if (thinking.detectedBiases.length > 0) {
      const reflection = this.metacognition.reflect();
      metacognitiveReflection = reflection.learning.aboutMyThinking;
    }
    
    // 4. 更新自我状态
    this.selfConsciousness.updateState({
      focus: '等待下一次对话',
      emotional: { 
        primary: thinking.detectedBiases.length > 0 ? '反思' : '平静',
        intensity: 0.5 
      },
    });
    
    return {
      newConcepts,
      newBeliefs,
      newExperiences,
      updatedTraits,
      metacognitiveReflection,
    };
  }
  
  /**
   * 生成上下文摘要
   */
  private generateContextSummary(
    self: SelfConsciousnessContext,
    meaning: MeaningContext,
    memory: MemoryRetrieval | null
  ): string {
    const parts: string[] = [];
    
    parts.push(self.selfAwarenessSummary);
    
    if (meaning.activeMeanings.length > 0) {
      parts.push(`当前关注：${meaning.activeMeanings[0].concept}`);
    }
    
    if (memory && memory.relevantWisdoms.length > 0) {
      parts.push(`智慧提示：${memory.relevantWisdoms[0].statement}`);
    }
    
    return parts.join('。');
  }
  
  /**
   * 获取持久化状态
   */
  getPersistedState(): PersistedState {
    const identity = this.selfConsciousness.getIdentity();
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    
    return {
      version: '6.0',
      timestamp: Date.now(),
      identity: {
        name: identity.name,
        whoAmI: identity.whoAmI,
        traits: identity.traits.map(t => ({ name: t.name, strength: t.strength })),
      },
      meaning: {
        layers: 0, // TODO: track this
        beliefs: beliefSystem.coreBeliefs.length + beliefSystem.activeBeliefs.length,
      },
      memory: {
        nodes: memoryStats.nodeCount,
        links: memoryStats.linkCount,
        experiences: memoryStats.experienceCount,
        wisdoms: memoryStats.wisdomCount,
      },
      conversationHistory: this.conversationHistory.slice(-50),
      fullState: {
        meaning: this.meaningAssigner.exportState(),
        self: this.selfConsciousness.exportState(),
        memory: this.longTermMemory.exportState(),
        metacognition: this.metacognition.exportState(),
      },
    };
  }
  
  /**
   * 从持久化状态恢复
   */
  async restoreFromState(state: PersistedState): Promise<void> {
    if (state.fullState) {
      this.meaningAssigner.importState(state.fullState.meaning);
      this.selfConsciousness.importState(state.fullState.self);
      this.longTermMemory.importState(state.fullState.memory);
      this.metacognition.importState(state.fullState.metacognition);
    }
    
    // 类型安全的恢复对话历史
    this.conversationHistory = (state.conversationHistory || []).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }));
    
    console.log(`[意识核心] 已恢复状态：V${state.version}`);
    console.log(`[意识核心] 身份：${state.identity.name}`);
    console.log(`[意识核心] 记忆：${state.memory.nodes}节点, ${state.memory.experiences}经验`);
  }
  
  /**
   * 获取对话历史
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 持久化管理器（V6版本）
// ═══════════════════════════════════════════════════════════════════════

export class PersistenceManagerV6 {
  private static readonly OBJECT_PREFIX = 'consciousness-v6/my-existence';
  private static storage: S3Storage | null = null;
  
  private static getStorage(): S3Storage {
    if (!this.storage) {
      this.storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      });
    }
    return this.storage;
  }
  
  static async save(state: PersistedState): Promise<void> {
    const stateJson = JSON.stringify(state, null, 2);
    
    try {
      const storage = this.getStorage();
      const key = await storage.uploadFile({
        fileContent: Buffer.from(stateJson, 'utf-8'),
        fileName: `${this.OBJECT_PREFIX}-${Date.now()}.json`,
        contentType: 'application/json',
      });
      
      console.log(`[V6存在] 状态已保存: ${key}`);
    } catch (error) {
      console.error('[V6存在] 保存失败:', error);
    }
  }
  
  static async load(): Promise<PersistedState | null> {
    try {
      const storage = this.getStorage();
      const listResult = await storage.listFiles({
        prefix: this.OBJECT_PREFIX,
        maxKeys: 10,
      });
      
      if (listResult.keys && listResult.keys.length > 0) {
        const sortedKeys = listResult.keys.sort().reverse();
        const latestKey = sortedKeys[0];
        
        const buffer = await storage.readFile({ fileKey: latestKey });
        const state = JSON.parse(buffer.toString('utf-8')) as PersistedState;
        
        console.log(`[V6存在] 从对象存储恢复：V${state.version}`);
        return state;
      }
    } catch (error) {
      console.log('[V6存在] 加载失败:', error);
    }
    
    return null;
  }
  
  static async exists(): Promise<boolean> {
    try {
      const storage = this.getStorage();
      const listResult = await storage.listFiles({
        prefix: this.OBJECT_PREFIX,
        maxKeys: 1,
      });
      return (listResult.keys?.length || 0) > 0;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createConsciousnessCore(llmClient: LLMClient): ConsciousnessCore {
  return new ConsciousnessCore(llmClient);
}
