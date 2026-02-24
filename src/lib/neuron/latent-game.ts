/**
 * 高维内在博弈系统（带持久化记忆和对话上下文）
 * 
 * 记忆架构（类脑分层）：
 * - 工作记忆：当前对话上下文（让模型知道之前聊了什么）
 * - 情景记忆：具体博弈事件
 * - 语义记忆：学到的知识
 * - 程序记忆：自动化的习惯
 * 
 * 持久化：使用 Supabase 存储，刷新页面记忆不丢失
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getConversationContext } from './conversation-context';
import type { NeuronMemory, LearnedAngle } from '@/storage/database/shared/schema';

/**
 * 参与博弈的模型
 */
const PLAYERS = [
  { id: 'doubao-seed-1-8-251228', role: 'thinker', strength: '深度推理、综合分析' },
  { id: 'deepseek-v3-2-251201', role: 'technician', strength: '技术实现、编程算法' },
  { id: 'doubao-seed-2-0-lite-260215', role: 'responder', strength: '快速响应、日常对话' },
];

/**
 * 内在思考结果
 */
interface InnerThought {
  modelId: string;
  role: string;
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
}

/**
 * 思考提示词（带对话上下文）
 */
const THOUGHT_PROMPT = `{CONTEXT}分析这个问题，输出内在思考（不超过50字）：
问题：{QUESTION}
你的角色：{ROLE}，擅长：{STRENGTH}
{MEMORY_HINT}
JSON格式：{"core": "核心", "angle": "你的角度", "confidence": 0.8}`;

/**
 * 反思提示词
 */
const REFLECTION_PROMPT = `博弈反思（30字内）：
角色：{ROLE}，结果：{RESULT}，问题：{QUESTION}
学到了什么？JSON：{"insight": "...", "angle": "学到的新角度", "gain": 0.1}`;

/**
 * 持久化记忆管理器
 */
class PersistentMemory {
  private supabase = getSupabaseClient();
  
  /**
   * 获取博弈统计
   */
  async getStats(): Promise<Map<string, { role: string; totalGames: number; wins: number; wisdomBonus: number }>> {
    const { data, error } = await this.supabase
      .from('game_statistics')
      .select('*');
    
    const stats = new Map<string, { role: string; totalGames: number; wins: number; wisdomBonus: number }>();
    
    if (!error && data) {
      for (const stat of data) {
        stats.set(stat.role, {
          role: stat.role,
          totalGames: stat.total_games || 0,
          wins: stat.wins || 0,
          wisdomBonus: stat.wisdom_bonus || 0,
        });
      }
    }
    
    // 确保所有角色都有统计
    for (const player of PLAYERS) {
      if (!stats.has(player.role)) {
        stats.set(player.role, {
          role: player.role,
          totalGames: 0,
          wins: 0,
          wisdomBonus: 0,
        });
      }
    }
    
    return stats;
  }
  
  /**
   * 更新博弈统计
   */
  async updateStats(role: string, won: boolean): Promise<void> {
    // 先获取当前统计
    const { data: existing } = await this.supabase
      .from('game_statistics')
      .select('*')
      .eq('role', role)
      .single();
    
    if (existing) {
      // 更新
      await this.supabase
        .from('game_statistics')
        .update({
          total_games: (existing.total_games || 0) + 1,
          wins: (existing.wins || 0) + (won ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('role', role);
    } else {
      // 插入
      await this.supabase
        .from('game_statistics')
        .insert({
          role,
          total_games: 1,
          wins: won ? 1 : 0,
          wisdom_bonus: 0,
        });
    }
  }
  
  /**
   * 更新智慧加成
   */
  async updateWisdom(role: string, gain: number): Promise<void> {
    const { data: existing } = await this.supabase
      .from('game_statistics')
      .select('wisdom_bonus')
      .eq('role', role)
      .single();
    
    const newWisdom = Math.min(0.25, (existing?.wisdom_bonus || 0) + gain);
    
    await this.supabase
      .from('game_statistics')
      .update({
        wisdom_bonus: newWisdom,
        updated_at: new Date().toISOString(),
      })
      .eq('role', role);
  }
  
  /**
   * 存储记忆
   */
  async storeMemory(
    role: string,
    type: 'episodic' | 'semantic' | 'procedural',
    content: string,
    questionSummary?: string,
    tags?: string[]
  ): Promise<void> {
    await this.supabase
      .from('neuron_memories')
      .insert({
        memory_type: type,
        role,
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
  async recallMemories(role: string, limit: number = 5): Promise<NeuronMemory[]> {
    const { data, error } = await this.supabase
      .from('neuron_memories')
      .select('*')
      .eq('role', role)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    // 更新访问次数
    for (const memory of data) {
      await this.supabase
        .from('neuron_memories')
        .update({
          access_count: (memory.access_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', memory.id);
    }
    
    return data as NeuronMemory[];
  }
  
  /**
   * 学习新角度
   */
  async learnAngle(learnerRole: string, teacherRole: string, angle: string): Promise<void> {
    // 检查是否已学过
    const { data: existing } = await this.supabase
      .from('learned_angles')
      .select('*')
      .eq('learner_role', learnerRole)
      .eq('angle', angle)
      .single();
    
    if (existing) {
      // 增强已有角度
      await this.supabase
        .from('learned_angles')
        .update({
          strength: Math.min(1, (existing.strength || 0.3) + 0.1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // 学习新角度
      await this.supabase
        .from('learned_angles')
        .insert({
          learner_role: learnerRole,
          teacher_role: teacherRole,
          angle,
          strength: 0.3,
        });
    }
  }
  
  /**
   * 获取学到的角度
   */
  async getLearnedAngles(role: string): Promise<LearnedAngle[]> {
    const { data, error } = await this.supabase
      .from('learned_angles')
      .select('*')
      .eq('learner_role', role)
      .order('strength', { ascending: false })
      .limit(3);
    
    if (error || !data) return [];
    return data as LearnedAngle[];
  }
  
  /**
   * 构建记忆提示（用于影响思考）
   */
  async buildMemoryHint(role: string): Promise<string> {
    const [memories, angles, stats] = await Promise.all([
      this.recallMemories(role, 2),
      this.getLearnedAngles(role),
      this.getStats(),
    ]);
    
    const hints: string[] = [];
    
    // 智慧加成
    const stat = stats.get(role);
    if (stat && stat.wisdomBonus > 0) {
      hints.push(`智慧加成: +${(stat.wisdomBonus * 100).toFixed(0)}%`);
    }
    
    // 学到的角度（Supabase返回snake_case字段）
    if (angles.length > 0) {
      const angleHints = angles.map(a => `从${(a as any).teacher_role}学到"${a.angle}"`).join('；');
      hints.push(`经验: ${angleHints}`);
    }
    
    // 最近记忆
    if (memories.length > 0) {
      const memHints = memories.map(m => m.content).join('；');
      hints.push(`回忆: ${memHints}`);
    }
    
    return hints.length > 0 ? `\n${hints.join('\n')}` : '';
  }
  
  /**
   * 获取所有统计摘要
   */
  async getStatsSummary(): Promise<Array<{
    role: string;
    games: number;
    wins: number;
    winRate: string;
    wisdom: string;
    learned: number;
  }>> {
    const [stats, angles] = await Promise.all([
      this.getStats(),
      this.supabase.from('learned_angles').select('learner_role')
    ]);
    
    const angleCounts = new Map<string, number>();
    if (angles.data) {
      for (const a of angles.data) {
        const count = angleCounts.get(a.learner_role) || 0;
        angleCounts.set(a.learner_role, count + 1);
      }
    }
    
    return Array.from(stats.values()).map(s => ({
      role: s.role,
      games: s.totalGames || 0,
      wins: s.wins || 0,
      winRate: (s.totalGames || 0) > 0 ? ((s.wins || 0) / (s.totalGames || 1)).toFixed(2) : '0',
      wisdom: (s.wisdomBonus || 0).toFixed(3),
      learned: angleCounts.get(s.role) || 0,
    }));
  }
}

// 全局持久化记忆实例
let globalMemory: PersistentMemory | null = null;

function getMemory(): PersistentMemory {
  if (!globalMemory) {
    globalMemory = new PersistentMemory();
  }
  return globalMemory;
}

/**
 * 高维博弈引擎（持久化版）
 */
export class LatentGameEngine {
  private llmClient: LLMClient;
  private memory: PersistentMemory;
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
    this.memory = getMemory();
  }
  
  /**
   * 快速博弈（带对话上下文）
   */
  async play(question: string, sessionId?: string): Promise<GameResult> {
    const sid = sessionId || 'default-session';
    const conversationCtx = getConversationContext();
    
    // 获取对话上下文
    const contextPrompt = await conversationCtx.buildContextPrompt(sid);
    
    // 并行思考（带记忆提示和对话上下文）
    const thoughts = await Promise.all(
      PLAYERS.map(p => this.think(p, question, contextPrompt))
    );
    
    // 快速评估
    const result = this.fastEvaluate(thoughts);
    
    // 记录博弈结果
    for (const t of thoughts) {
      await this.memory.updateStats(t.role, t.role === result.winner.role);
    }
    
    return result;
  }
  
  /**
   * 保存对话（用户消息和AI回复）
   */
  async saveConversation(
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    winnerRole: string,
    thoughts: InnerThought[]
  ): Promise<void> {
    const conversationCtx = getConversationContext();
    
    // 保存用户消息
    await conversationCtx.addUserMessage(sessionId, userMessage);
    
    // 保存AI回复
    await conversationCtx.addAssistantMessage(
      sessionId,
      assistantMessage,
      winnerRole,
      thoughts.map(t => ({ role: t.role, core: t.core, confidence: t.confidence }))
    );
    
    // 检查是否需要压缩历史
    await conversationCtx.compressIfNeeded(sessionId, 20);
  }
  
  /**
   * 异步学习
   */
  async learnAsync(question: string, thoughts: InnerThought[], winner: InnerThought): Promise<void> {
    this.doLearning(question, thoughts, winner).catch(() => {});
  }
  
  /**
   * 单模型思考（带记忆和对话上下文）
   */
  private async think(player: typeof PLAYERS[0], question: string, contextPrompt: string): Promise<InnerThought> {
    // 获取记忆提示
    const [memoryHint, stats] = await Promise.all([
      this.memory.buildMemoryHint(player.role),
      this.memory.getStats(),
    ]);
    
    const stat = stats.get(player.role);
    const wisdomBonus = stat?.wisdomBonus || 0;
    
    const prompt = THOUGHT_PROMPT
      .replace('{CONTEXT}', contextPrompt)
      .replace('{QUESTION}', question)
      .replace('{ROLE}', player.role)
      .replace('{STRENGTH}', player.strength)
      .replace('{MEMORY_HINT}', memoryHint);
    
    try {
      let response = '';
      const stream = this.llmClient.stream(
        [{ role: 'user', content: prompt }],
        { model: player.id, temperature: 0.4 }
      );
      
      for await (const chunk of stream) {
        if (chunk.content) response += chunk.content.toString();
      }
      
      const parsed = this.parseThought(response);
      return {
        modelId: player.id,
        role: player.role,
        core: parsed.core,
        angle: parsed.angle,
        confidence: Math.min(1, parsed.confidence + wisdomBonus),
      };
    } catch {
      return {
        modelId: player.id,
        role: player.role,
        core: '思考失败',
        angle: '',
        confidence: 0.3 + wisdomBonus,
      };
    }
  }
  
  /**
   * 快速评估
   */
  private fastEvaluate(thoughts: InnerThought[]): GameResult {
    const sorted = [...thoughts].sort((a, b) => b.confidence - a.confidence);
    const top = sorted[0];
    const second = sorted[1];
    
    if (top.confidence - (second?.confidence || 0) > 0.15) {
      return {
        winner: top,
        allThoughts: thoughts,
        evaluationReason: `置信度领先 (${top.confidence.toFixed(2)})`,
      };
    }
    
    const priority = ['thinker', 'technician', 'responder'];
    for (const role of priority) {
      const found = thoughts.find(t => t.role === role);
      if (found && found.confidence > 0.5) {
        return {
          winner: found,
          allThoughts: thoughts,
          evaluationReason: '综合评估胜出',
        };
      }
    }
    
    return {
      winner: top,
      allThoughts: thoughts,
      evaluationReason: '默认选择',
    };
  }
  
  /**
   * 执行学习
   */
  private async doLearning(
    question: string,
    thoughts: InnerThought[],
    winner: InnerThought
  ): Promise<void> {
    for (const t of thoughts) {
      try {
        const prompt = REFLECTION_PROMPT
          .replace('{ROLE}', t.role)
          .replace('{RESULT}', t.role === winner.role ? '胜' : '败')
          .replace('{QUESTION}', question.slice(0, 50));
        
        let response = '';
        const stream = this.llmClient.stream(
          [{ role: 'user', content: prompt }],
          { model: 'doubao-seed-2-0-lite-260215', temperature: 0.5 }
        );
        
        for await (const chunk of stream) {
          if (chunk.content) response += chunk.content.toString();
        }
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const gain = Math.min(0.15, Math.max(0, parsed.gain || 0.05));
          
          // 更新智慧
          await this.memory.updateWisdom(t.role, gain);
          
          // 存储情景记忆
          await this.memory.storeMemory(
            t.role,
            'episodic',
            `${t.role === winner.role ? '胜' : '败'}：${parsed.insight || ''}`,
            question.slice(0, 50)
          );
          
          // 如果输了且有学到新角度
          if (t.role !== winner.role && parsed.angle) {
            await this.memory.learnAngle(t.role, winner.role, parsed.angle);
            
            // 存储语义记忆
            await this.memory.storeMemory(
              t.role,
              'semantic',
              `${winner.role}的视角：${parsed.angle}`,
              undefined,
              [winner.role]
            );
          }
        }
      } catch {
        // 学习失败，忽略
      }
    }
  }
  
  /**
   * 解析思考
   */
  private parseThought(response: string): { core: string; angle: string; confidence: number } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          core: parsed.core || '',
          angle: parsed.angle || '',
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        };
      }
    } catch {}
    
    return { core: response.slice(0, 30), angle: '', confidence: 0.4 };
  }
  
  /**
   * 流式输出最终回答（带对话上下文）
   */
  async *streamAnswer(
    question: string, 
    result: GameResult, 
    sessionId?: string
  ): AsyncGenerator<string> {
    const sid = sessionId || 'default-session';
    const conversationCtx = getConversationContext();
    
    // 获取对话历史
    const contextPrompt = await conversationCtx.buildContextPrompt(sid);
    
    // 其他模型的视角
    const hints = result.allThoughts
      .filter(t => t.role !== result.winner.role)
      .map(t => `${t.role}认为: ${t.core}`)
      .join('\n');
    
    // 构建完整提示
    const fullPrompt = `${contextPrompt}当前问题：${question}

参考其他模型的视角：
${hints || '无'}

请回答用户的问题，保持与之前对话的连贯性。`;
    
    const messages = [
      { role: 'user' as const, content: fullPrompt }
    ];
    
    const stream = this.llmClient.stream(messages, {
      model: result.winner.modelId,
      temperature: 0.7,
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }
  
  /**
   * 获取统计摘要
   */
  async getStatsSummary() {
    return this.memory.getStatsSummary();
  }
}

// 全局引擎
let globalEngine: LatentGameEngine | null = null;

export function getGameEngine(headers: Record<string, string>): LatentGameEngine {
  if (!globalEngine) {
    globalEngine = new LatentGameEngine(headers);
  }
  return globalEngine;
}

export function getPlayers() {
  return PLAYERS;
}

export type { InnerThought, GameResult };
