/**
 * 高维内在博弈系统（链接强度驱动）
 * 
 * 核心理念：
 * - 没有预设角色，每个神经元是平等的
 * - 链接强度通过实际使用动态演化
 * - 高链接强度的神经元更容易被激活
 * - 类似真实神经网络的Hebbian学习
 * 
 * 架构：
 * ┌─────────────────────────────────────────────────────────┐
 * │   输入 ──→ 链接强度选择 ──→ 激活神经元                   │
 * │              │                       │                  │
 * │              ↓                       ↓                  │
 * │         意义共鸣 ←── 记忆空间开锁                       │
 * │              │                                          │
 * │              ↓                                          │
 * │         博弈思考 ──→ 提取意义                           │
 * │              │                                          │
 * │              ↓                                          │
 * │         更新链接强度 ──→ 持续演化                        │
 * └─────────────────────────────────────────────────────────┘
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getConversationContext } from './conversation-context';
import { 
  MeaningMemoryEngine, 
  getMeaningMemoryEngine,
  type ResonanceResult,
  type DecisionInfluence 
} from './meaning-memory';
import {
  MemorySpaceEngine,
  getMemorySpaceEngine,
  type MemoryDoor,
} from './memory-space';
import {
  NeuronLinkManager,
  getNeuronLinkManager,
  type NeuronLinkState
} from './neuron-link';
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
  strength: number;      // 激活时的链接强度
  core: string;
  angle: string;
  confidence: number;
  meaningInfluence?: DecisionInfluence;
}

/**
 * 博弈结果
 */
interface GameResult {
  winner: InnerThought;
  allThoughts: InnerThought[];
  evaluationReason: string;
  resonance?: ResonanceResult;
  strengthReport?: {
    neurons: Array<{
      id: string;
      strength: number;
      activations: number;
    }>;
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
    const linkManager = getNeuronLinkManager();
    const report = await linkManager.getStrengthReport();
    
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
    
    return report.neurons.map(n => ({
      neuronId: n.id,
      activations: n.activations,
      strength: n.strength,
      learned: angleCounts.get(n.id) || 0,
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
 * 高维博弈引擎（链接强度驱动）
 */
export class LatentGameEngine {
  private llmClient: LLMClient;
  private memory: PersistentMemory;
  private meaningMemory: MeaningMemoryEngine;
  private memorySpace: MemorySpaceEngine;
  private linkManager: NeuronLinkManager;
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
    this.memory = getMemory();
    this.meaningMemory = getMeaningMemoryEngine(headers);
    this.memorySpace = getMemorySpaceEngine(headers);
    this.linkManager = getNeuronLinkManager();
  }
  
  /**
   * 博弈（链接强度驱动）
   * 
   * 流程：
   * 1. 根据链接强度选择激活的神经元
   * 2. 意义共鸣 + 记忆空间开锁
   * 3. 并行思考
   * 4. 评估获胜者
   * 5. 更新链接强度
   */
  async play(question: string, sessionId?: string): Promise<GameResult> {
    const sid = sessionId || 'default-session';
    const conversationCtx = getConversationContext();
    
    // 【核心1】根据链接强度选择激活的神经元
    const activeNeuronIds = await this.linkManager.selectActiveNeurons();
    
    // 获取链接状态
    const linkStates = await this.linkManager.getLinkStates();
    const stateMap = new Map(linkStates.map(s => [s.neuronId, s]));
    
    // 【核心2】意义共鸣：输入激活相关记忆
    const resonances = await Promise.all(
      activeNeuronIds.map(id => this.meaningMemory.resonate(question, id))
    );
    
    // 【核心3】记忆空间：尝试打开记忆门
    const { EmbeddingClient } = await import('coze-coding-dev-sdk');
    const embeddingClient = new EmbeddingClient();
    const inputVector = await embeddingClient.embedText(question);
    
    const openedDoors = await Promise.all(
      activeNeuronIds.map(id => this.memorySpace.resonantUnlock(inputVector, id, 1))
    );
    
    // 获取对话上下文
    const contextPrompt = await conversationCtx.buildContextPrompt(sid);
    
    // 【核心4】并行思考（带记忆影响）
    const thoughts = await Promise.all(
      activeNeuronIds.map((id, i) => this.think(
        id, 
        stateMap.get(id)?.strength || 0.5,
        question, 
        contextPrompt, 
        resonances[i],
        openedDoors[i]
      ))
    );
    
    // 快速评估
    const result = this.fastEvaluate(thoughts);
    
    // 【核心5】更新链接强度
    await this.linkManager.recordActivation(result.winner.neuronId, true);
    for (const t of thoughts) {
      if (t.neuronId !== result.winner.neuronId) {
        await this.linkManager.recordActivation(t.neuronId, false);
      }
    }
    
    // 存储到记忆空间（后台）
    this.storeToMemorySpace(question, result).catch(() => {});
    
    // 获取链接强度报告
    const report = await this.linkManager.getStrengthReport();
    result.strengthReport = {
      neurons: report.neurons.map(n => ({
        id: n.id,
        strength: n.strength,
        activations: n.activations,
      }))
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
   * 单神经元思考（无角色定义）
   */
  private async think(
    neuronId: string,
    strength: number,
    question: string, 
    contextPrompt: string,
    resonance: ResonanceResult,
    openedDoors: MemoryDoor[]
  ): Promise<InnerThought> {
    const meaningInfluence = this.meaningMemory.influenceDecision(resonance);
    
    const doorHints = openedDoors.length > 0
      ? `\n记忆之门已打开: ${openedDoors.slice(0, 3).map(d => d.meaning).join('；')}`
      : '';
    
    const memoryHint = await this.memory.buildMemoryHint(neuronId);
    const meaningHint = this.buildMeaningHint(meaningInfluence);
    
    const prompt = THOUGHT_PROMPT
      .replace('{CONTEXT}', contextPrompt)
      .replace('{QUESTION}', question)
      .replace('{STRENGTH}', `${Math.round(strength * 100)}%`)
      .replace('{MEMORY_HINT}', memoryHint + meaningHint + doorHints);
    
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
      
      return {
        neuronId,
        strength,
        core: parsed.core,
        angle: parsed.angle,
        confidence: parsed.confidence * (1 + strength * 0.2),  // 高强度略微提升信心
        meaningInfluence,
      };
    } catch {
      return {
        neuronId,
        strength,
        core: '思考中...',
        angle: '默认视角',
        confidence: strength,  // 使用链接强度作为信心
        meaningInfluence,
      };
    }
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
   * 构建意义提示
   */
  private buildMeaningHint(influence: DecisionInfluence): string {
    const hints: string[] = [];
    
    if (influence.patterns.length > 0) {
      hints.push(`发现模式: ${influence.patterns.slice(0, 2).join('；')}`);
    }
    
    if (influence.hints.length > 0) {
      hints.push(`提示: ${influence.hints.slice(0, 2).join('；')}`);
    }
    
    if (influence.emotional) {
      hints.push(`情感: ${influence.emotional}`);
    }
    
    return hints.length > 0 ? `\n${hints.join('\n')}` : '';
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
    // 创建记忆门
    await this.memorySpace.createMemoryDoor(
      question,
      result.winner.neuronId,
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
    return this.linkManager.getStrengthReport();
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
   * 获取统计摘要
   */
  async getStatsSummary(): Promise<Array<{
    neuronId: string;
    activations: number;
    strength: number;
    learned: number;
  }>> {
    return this.memory.getStatsSummary();
  }
}

// 导出类型
export type { InnerThought, GameResult };
