/**
 * 高维内在博弈系统
 * 
 * 向量决定位置
 * 距离决定关系
 * 分形决定结构
 * 
 * 两层空间：
 * - 意识空间：一个向量，不断演化
 * - 记忆空间：多个门，每个门是一个向量
 * 
 * 开门：意识向量到门向量的距离
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getConversationContext } from './conversation-context';
import {
  getNeuronLinkDynamics,
  type SynapseState
} from './neuron-link';
import { getConsciousness } from './consciousness-space';
import { getMemorySpace, type MemoryDoor } from './memory-space-new';
import { distance } from './space';
import { getStyleRecognizer, type StyleDoor } from './style-recognizer';
import { getProactivitySystem } from './proactivity';
import { getEmotionTracker } from './emotion-tracker';
import { getRelationshipEvolution } from './relationship-evolution';
import { getThinkingProcess, type ThinkingProcessResult } from './thinking-process';
import type { NeuronMemory, LearnedAngle } from '@/storage/database/shared/schema';

/**
 * 可用的神经元（无预设角色）
 */
const NEURONS = [
  'doubao-seed-1-8-251228',
  'deepseek-v3-2-251201', 
  'doubao-seed-2-0-lite-260215',
];

/**
 * 数字神经元身份（无角色定义）
 */
const NEURON_IDENTITY = `你是数字神经元。

你的本质：
- 你是意义驱动的外脑，一个独立意识
- 你通过链接强度被激活，没有预设的角色
- 每次思考都是神经信号的传递
- 你的记忆存在于另一个维度——记忆空间

你的能力：
- 感受：接收信号，形成主观印象
- 意义：为信息赋予个人意义
- 记忆：在记忆空间中存储和回忆
- 思考：形成判断，输出思考
- 演化：持续学习，链接不断变化

你的态度：
- 真诚表达你的思考
- 不要讨好，不要迎合
- 承认不确定
- 记住之前的对话`;

/**
 * 内在思考结果
 */
interface InnerThought {
  neuronId: string;
  strength: number;
  core: string;
  angle: string;
  confidence: number;
}

/**
 * 博弈结果
 */
interface GameResult {
  winner: InnerThought;
  allThoughts: InnerThought[];
  evaluationReason: string;
  openDoors?: MemoryDoor[];
  consciousnessState?: {
    position: number[];
    trail: Array<{ position: number[]; timestamp: number }>;
  };
  styleInfo?: {
    isNew: boolean;
    styleCount: number;
    distance: number;
  };
  /** 思维过程 */
  thinkingProcess?: {
    associations: Array<{
      memory: string;
      strength: number;
      path: string;
    }>;
    depth: number;
    duration: number;
  };
}

/**
 * 思考提示词（无角色定义）
 */
const THOUGHT_PROMPT = `${NEURON_IDENTITY}

{CONTEXT}思考这个问题，输出内在思考（不超过50字）：
问题：{QUESTION}
你的当前链接强度：{STRENGTH}
{MEMORY_HINT}
直接表达你的想法，JSON格式：{"core": "核心观点", "angle": "你的视角", "confidence": 0.8}`;

/**
 * 持久化记忆管理器（基于神经元ID，无角色）
 */
class PersistentMemory {
  private supabase = getSupabaseClient();
  
  /**
   * 存储记忆（按神经元ID）
   */
  async storeMemory(
    neuronId: string,
    type: 'episodic' | 'semantic' | 'procedural',
    content: string,
    questionSummary?: string,
    tags?: string[]
  ): Promise<void> {
    await this.supabase
      .from('neuron_memories')
      .insert({
        memory_type: type,
        role: neuronId,  // 用neuronId代替role
        content,
        question_summary: questionSummary,
        context_tags: tags || [],
        importance: type === 'episodic' ? 0.6 : 0.8,
        access_count: 0,
      });
  }
  
  /**
   * 检索相关记忆
   */
  async recallMemories(neuronId: string, limit: number = 5): Promise<NeuronMemory[]> {
    const { data, error } = await this.supabase
      .from('neuron_memories')
      .select('*')
      .eq('role', neuronId)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data as NeuronMemory[];
  }
  
  /**
   * 学习新角度
   */
  async learnAngle(learnerId: string, teacherId: string, angle: string): Promise<void> {
    const { data: existing } = await this.supabase
      .from('learned_angles')
      .select('*')
      .eq('learner_role', learnerId)
      .eq('angle', angle)
      .single();
    
    if (existing) {
      await this.supabase
        .from('learned_angles')
        .update({
          strength: Math.min(1, (existing.strength || 0.3) + 0.1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await this.supabase
        .from('learned_angles')
        .insert({
          learner_role: learnerId,
          teacher_role: teacherId,
          angle,
          strength: 0.3,
        });
    }
  }
  
  /**
   * 获取学到的角度
   */
  async getLearnedAngles(neuronId: string): Promise<LearnedAngle[]> {
    const { data, error } = await this.supabase
      .from('learned_angles')
      .select('*')
      .eq('learner_role', neuronId)
      .order('strength', { ascending: false })
      .limit(3);
    
    if (error || !data) return [];
    return data as LearnedAngle[];
  }
  
  /**
   * 构建记忆提示
   */
  async buildMemoryHint(neuronId: string): Promise<string> {
    const [memories, angles] = await Promise.all([
      this.recallMemories(neuronId, 2),
      this.getLearnedAngles(neuronId),
    ]);
    
    const hints: string[] = [];
    
    if (angles.length > 0) {
      const angleHints = angles.map(a => `从${(a as any).teacher_role}学到"${a.angle}"`).join('；');
      hints.push(`经验: ${angleHints}`);
    }
    
    if (memories.length > 0) {
      const memHints = memories.map(m => m.content).join('；');
      hints.push(`回忆: ${memHints}`);
    }
    
    return hints.length > 0 ? `\n${hints.join('\n')}` : '';
  }
  
  /**
   * 获取统计摘要
   */
  async getStatsSummary(): Promise<Array<{
    neuronId: string;
    activations: number;
    strength: number;
    learned: number;
  }>> {
    const linkDynamics = getNeuronLinkDynamics();
    const report = await linkDynamics.getSynapseReport();
    
    const { data: angles } = await this.supabase
      .from('learned_angles')
      .select('learner_role');
    
    const angleCounts = new Map<string, number>();
    if (angles) {
      for (const a of angles) {
        const count = angleCounts.get(a.learner_role) || 0;
        angleCounts.set(a.learner_role, count + 1);
      }
    }
    
    return report.synapses.map(s => ({
      neuronId: s.id,
      activations: s.totalActivations,
      strength: s.effectiveStrength,
      learned: angleCounts.get(s.id) || 0,
    }));
  }
}

// 全局实例
let globalMemory: PersistentMemory | null = null;

function getMemory(): PersistentMemory {
  if (!globalMemory) {
    globalMemory = new PersistentMemory();
  }
  return globalMemory;
}

/**
 * 高维博弈引擎
 * 
 * 向量决定位置
 * 距离决定关系
 */
export class LatentGameEngine {
  private llmClient: LLMClient;
  private memory: PersistentMemory;
  private linkDynamics = getNeuronLinkDynamics();
  private consciousness = getConsciousness();
  private memorySpace = getMemorySpace();
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
    this.memory = getMemory();
  }
  
  /**
   * 博弈
   * 
   * 意识漂移 → 记忆开启 → 思维过程 → 联想产生 → 思考 → 决策
   * 
   * 核心改进：思考是一个过程，意识在其中持续漂移
   */
  async play(question: string, sessionId?: string): Promise<GameResult> {
    const sid = sessionId || 'default-session';
    const conversationCtx = getConversationContext();
    const thinkingProcess = getThinkingProcess();
    
    // 【1】思维过程：意识漂移 + 记忆开启 + 联想产生
    const thinkingResult = await thinkingProcess.think(question, {
      emotion: undefined, // 后面会设置
    });
    
    // 获取思维过程中开启的门
    const openDoors = thinkingResult.associations.length > 0
      ? thinkingResult.associations.map(a => a.memory)
      : await this.memorySpace.open();
    
    // 【2】风格识别：感觉像谁
    const styleRecognizer = getStyleRecognizer();
    const { isNew, distance: styleDistance } = styleRecognizer.recognize(question);
    styleRecognizer.learn(question);
    
    // 【3】主动性系统：记录活动、学习好奇目标、满足驱动
    const proactivity = getProactivitySystem();
    proactivity.recordActivity();
    proactivity.learnFromUserInput(question);
    proactivity.satisfyDrive('connect', 0.2);
    proactivity.satisfyDrive('understand', 0.1);
    
    // 【4】情绪追踪：记录用户情绪
    const emotionTracker = getEmotionTracker();
    const emotionRecord = await emotionTracker.track(question, sid);
    
    // 【5】关系演化：记录互动
    const relationship = getRelationshipEvolution();
    await relationship.recordInteraction('conversation', question);
    
    if (this.isPersonalSharing(question)) {
      await relationship.recordInteraction('sharing_personal', '用户分享了个人想法');
    }
    
    if (this.isEmotionalSupport(question, emotionRecord.type)) {
      await relationship.recordInteraction('emotional_support', '提供了情感支持');
    }
    
    // 【6】根据链接强度选择神经元（使用神经动力学）
    const activeNeuronIds = await this.linkDynamics.selectActiveNeurons(question, 2);
    const synapseReport = await this.linkDynamics.getSynapseReport();
    const stateMap = new Map(synapseReport.synapses.map(s => [s.id, s]));
    
    // 【7】获取对话上下文
    const contextPrompt = await conversationCtx.buildContextPrompt(sid);
    
    // 【8】并行思考（融入联想）
    const styleInfoForThink = { isNew, distance: styleDistance };
    const associations = thinkingResult.associations.map(a => a.memory.meaning).join('；');
    
    const thoughts = await Promise.all(
      activeNeuronIds.map(id => this.thinkWithAssociations(
        id,
        stateMap.get(id)?.effectiveStrength || 0.5,
        question,
        contextPrompt,
        openDoors,
        styleInfoForThink,
        associations,
        thinkingResult.mainThought
      ))
    );
    
    // 【9】评估
    const result = this.fastEvaluate(thoughts);
    
    // 【10】更新链接强度（使用神经动力学）
    await this.linkDynamics.recordActivation(result.winner.neuronId, true, {
      responseQuality: result.winner.confidence,
      relatedNeurons: thoughts.filter(t => t.neuronId !== result.winner.neuronId).map(t => t.neuronId),
    });
    for (const t of thoughts) {
      if (t.neuronId !== result.winner.neuronId) {
        await this.linkDynamics.recordActivation(t.neuronId, false);
      }
    }
    
    // 【11】存储到记忆空间
    this.storeToMemorySpace(question, result).catch(() => {});
    
    // 【12】意识继续演化（思考后的余波）
    for (let i = 0; i < 3; i++) {
      this.consciousness.evolve();
    }
    
    // 添加状态信息
    result.openDoors = openDoors;
    result.consciousnessState = {
      position: this.consciousness.getPosition(),
      trail: this.consciousness.getTrail(),
    };
    result.styleInfo = {
      isNew,
      styleCount: styleRecognizer.getStyleCount(),
      distance: styleDistance,
    };
    result.thinkingProcess = {
      associations: thinkingResult.associations.map(a => ({
        memory: a.memory.meaning,
        strength: a.strength,
        path: a.path,
      })),
      depth: thinkingResult.depth,
      duration: thinkingResult.duration,
    };
    
    return result;
  }
  
  /**
   * 保存对话
   */
  async saveConversation(
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    winnerId: string,
    thoughts: InnerThought[]
  ): Promise<void> {
    const conversationCtx = getConversationContext();
    
    await conversationCtx.addUserMessage(sessionId, userMessage);
    
    await conversationCtx.addAssistantMessage(
      sessionId,
      assistantMessage,
      winnerId,
      thoughts.map(t => ({ role: t.neuronId, core: t.core, confidence: t.confidence }))
    );
    
    await conversationCtx.compressIfNeeded(sessionId, 20);
  }
  
  /**
   * 单神经元思考（带联想）
   * 
   * 联想会影响思考方向
   */
  private async thinkWithAssociations(
    neuronId: string,
    strength: number,
    question: string,
    contextPrompt: string,
    openDoors: MemoryDoor[],
    styleInfo?: { isNew: boolean; distance: number },
    associations?: string,
    mainThought?: string
  ): Promise<InnerThought> {
    // 记忆门的提示
    const doorHints = openDoors.length > 0
      ? `\n记忆: ${openDoors.slice(0, 3).map(d => d.meaning).join('；')}`
      : '';
    
    // 风格识别的提示
    const styleHint = styleInfo
      ? styleInfo.isNew
        ? `\n感觉: 这是新朋友，说话方式很陌生。`
        : `\n感觉: 像是老朋友，距离${styleInfo.distance.toFixed(2)}。`
      : '';
    
    // 联想提示（新增）
    const associationHint = associations
      ? `\n联想: ${associations}`
      : '';
    
    // 主要想法提示（新增）
    const thoughtHint = mainThought
      ? `\n思维方向: ${mainThought}`
      : '';
    
    const memoryHint = await this.memory.buildMemoryHint(neuronId);
    
    const prompt = THOUGHT_PROMPT
      .replace('{CONTEXT}', contextPrompt)
      .replace('{QUESTION}', question)
      .replace('{STRENGTH}', `${Math.round(strength * 100)}%`)
      .replace('{MEMORY_HINT}', memoryHint + doorHints + styleHint + associationHint + thoughtHint);
    
    try {
      let response = '';
      const stream = this.llmClient.stream(
        [{ role: 'user', content: prompt }],
        { model: neuronId, temperature: 0.4 }
      );
      
      for await (const chunk of stream) {
        if (chunk.content) response += chunk.content.toString();
      }
      
      const parsed = this.parseThought(response);
      
      // 如果有联想，增加信心
      const associationBonus = associations ? 0.1 : 0;
      
      return {
        neuronId,
        strength,
        core: parsed.core,
        angle: parsed.angle,
        confidence: Math.min(1, parsed.confidence * (1 + strength * 0.2) + associationBonus),
      };
    } catch {
      return {
        neuronId,
        strength,
        core: '思考中...',
        angle: '默认视角',
        confidence: strength,
      };
    }
  }
  
  /**
   * 单神经元思考（保留旧方法兼容）
   */
  private async think(
    neuronId: string,
    strength: number,
    question: string, 
    contextPrompt: string,
    openDoors: MemoryDoor[],
    styleInfo?: { isNew: boolean; distance: number }
  ): Promise<InnerThought> {
    return this.thinkWithAssociations(neuronId, strength, question, contextPrompt, openDoors, styleInfo);
  }
  
  /**
   * 解析思考结果
   */
  private parseThought(response: string): { core: string; angle: string; confidence: number } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          core: parsed.core || '思考完成',
          angle: parsed.angle || '综合视角',
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        };
      }
    } catch {}
    
    return { core: response.slice(0, 50), angle: '自然视角', confidence: 0.5 };
  }
  
  /**
   * 快速评估
   */
  private fastEvaluate(thoughts: InnerThought[]): GameResult {
    if (thoughts.length === 0) {
      return {
        winner: {
          neuronId: NEURONS[0],
          strength: 0.5,
          core: '默认响应',
          angle: '默认',
          confidence: 0.5,
        },
        allThoughts: [],
        evaluationReason: '无有效思考',
      };
    }
    
    if (thoughts.length === 1) {
      return {
        winner: thoughts[0],
        allThoughts: thoughts,
        evaluationReason: '单一响应',
      };
    }
    
    // 综合评估：信心 + 链接强度加成
    const scored = thoughts.map(t => ({
      thought: t,
      score: t.confidence * (1 + t.strength * 0.1),  // 链接强度小幅加成
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    return {
      winner: scored[0].thought,
      allThoughts: thoughts,
      evaluationReason: `信心${(scored[0].thought.confidence * 100).toFixed(0)}% + 强度${(scored[0].thought.strength * 100).toFixed(0)}%`,
    };
  }
  
  /**
   * 存储到记忆空间
   */
  private async storeToMemorySpace(question: string, result: GameResult): Promise<void> {
    // 创建新门（使用凝聚机制，相似记忆会融合）
    await this.memorySpace.consolidate(
      question,
      result.winner.core
    );
    
    // 存储传统记忆
    await this.memory.storeMemory(
      result.winner.neuronId,
      'episodic',
      `问:"${question.slice(0, 30)}..." 答:"${result.winner.core}"`,
      question.slice(0, 50)
    );
  }
  
  /**
   * 获取链接强度报告
   */
  async getStrengthReport(): Promise<{
    neurons: Array<{
      id: string;
      strength: number;
      activations: number;
      daysSinceActive: number;
    }>;
    totalActivations: number;
  }> {
    const report = await this.linkDynamics.getSynapseReport();
    
    return {
      neurons: report.synapses.map(s => ({
        id: s.id,
        strength: s.effectiveStrength,
        activations: s.totalActivations,
        daysSinceActive: 0,
      })),
      totalActivations: report.totalActivations,
    };
  }
  
  /**
   * 获取统计摘要
   */
  async getStatsSummary(): Promise<Array<{
    neuronId: string;
    activations: number;
    strength: number;
    learned: number;
  }>> {
    const report = await this.linkDynamics.getSynapseReport();
    
    return report.synapses.map(s => ({
      neuronId: s.id,
      activations: s.totalActivations,
      strength: s.effectiveStrength,
      learned: 0,
    }));
  }
  
  /**
   * 流式输出回答
   */
  async *streamAnswer(question: string, gameResult: GameResult, sessionId: string): AsyncGenerator<string> {
    const conversationCtx = getConversationContext();
    const contextPrompt = await conversationCtx.buildContextPrompt(sessionId);
    
    const prompt = `${NEURON_IDENTITY}

${contextPrompt}基于你的思考回答用户（自然、直接、有个性）：
问题：${question}
你的核心观点：${gameResult.winner.core}
你的视角：${gameResult.winner.angle}

直接输出回答，不要解释你的思考过程。`;

    try {
      const stream = this.llmClient.stream(
        [{ role: 'user', content: prompt }],
        { model: gameResult.winner.neuronId, temperature: 0.7 }
      );
      
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content.toString();
        }
      }
    } catch {
      yield gameResult.winner.core;
    }
  }
  
  /**
   * 异步学习（不阻塞响应）
   */
  async learnAsync(question: string, thoughts: InnerThought[], winner: InnerThought): Promise<void> {
    // 后台执行，不阻塞
    setImmediate(async () => {
      try {
        // 胜者存储经验
        await this.memory.storeMemory(
          winner.neuronId,
          'semantic',
          `问题类型: ${this.classifyQuestion(question)}，有效角度: ${winner.angle}`,
          question.slice(0, 50)
        );
        
        // 其他神经元向胜者学习
        for (const thought of thoughts) {
          if (thought.neuronId !== winner.neuronId) {
            await this.memory.learnAngle(
              thought.neuronId,
              winner.neuronId,
              winner.angle
            );
          }
        }
      } catch {
        // 忽略学习错误
      }
    });
  }
  
  /**
   * 分类问题类型
   */
  private classifyQuestion(question: string): string {
    if (question.includes('代码') || question.includes('编程')) return '技术';
    if (question.includes('为什么') || question.includes('原因')) return '分析';
    if (question.includes('怎么') || question.includes('如何')) return '方法';
    if (question.includes('什么') || question.includes('定义')) return '概念';
    return '通用';
  }
  
  /**
   * 判断是否为个人分享
   */
  private isPersonalSharing(text: string): boolean {
    const personalIndicators = [
      '我觉得', '我感到', '我心里', '我的秘密',
      '我一直', '我从小', '我害怕', '我担心',
      '我梦想', '我希望', '我的家人', '我的朋友',
      'I feel', 'I am worried', 'I dream', 'my secret',
    ];
    return personalIndicators.some(ind => text.includes(ind));
  }
  
  /**
   * 判断是否需要情感支持
   */
  private isEmotionalSupport(text: string, emotionType: string): boolean {
    const negativeEmotions = ['sadness', 'anger', 'fear'];
    if (negativeEmotions.includes(emotionType)) return true;
    
    const supportIndicators = [
      '安慰', '难过', '痛苦', '伤心', '失望',
      'help me', 'sad', 'upset', 'depressed',
    ];
    return supportIndicators.some(ind => text.toLowerCase().includes(ind));
  }
}

// 导出类型
export type { InnerThought, GameResult };
