/**
 * 高维内在博弈系统（带异步学习）
 * 
 * 性能优化：
 * - 博弈思考：并行执行，约1-2秒
 * - 博弈评估：置信度差距大时跳过
 * - 反思学习：异步后台执行，不阻塞用户
 * 
 * 核心原则：先给用户结果，后台默默学习
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 参与博弈的模型（精简到3个，减少调用次数）
 */
const PLAYERS = [
  { id: 'doubao-seed-1-8-251228', role: 'thinker', strength: '深度推理、综合分析' },
  { id: 'deepseek-v3-2-251201', role: 'technician', strength: '技术实现、编程算法' },
  { id: 'doubao-seed-2-0-lite-260215', role: 'responder', strength: '快速响应、日常对话' },
];

/**
 * 模型的博弈记忆
 */
interface GameMemory {
  role: string;
  totalGames: number;
  wins: number;
  wisdomBonus: number;
  learnedAngles: Array<{ from: string; angle: string; strength: number }>;
  reflections: Array<{ question: string; result: 'win' | 'lose'; insight: string; timestamp: number }>;
}

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
 * 学习报告
 */
interface LearningReport {
  reflections: Array<{ role: string; reflection: string; learningGain: number }>;
  updatedWisdom: Array<{ role: string; wisdomBonus: number }>;
}

/**
 * 简化的思考提示词
 */
const THOUGHT_PROMPT = `分析这个问题，输出你的内在思考（不超过50字）：
问题：{QUESTION}
你的角色：{ROLE}，擅长：{STRENGTH}

JSON格式：{"core": "核心", "angle": "你的角度", "confidence": 0.8}`;

/**
 * 反思提示词
 */
const REFLECTION_PROMPT = `博弈反思（30字内）：
角色：{ROLE}，结果：{RESULT}
学到了什么？JSON：{"insight": "...", "gain": 0.1}`;

/**
 * 记忆管理器
 */
class MemoryManager {
  private memories: Map<string, GameMemory> = new Map();
  
  constructor() {
    for (const player of PLAYERS) {
      this.memories.set(player.role, {
        role: player.role,
        totalGames: 0,
        wins: 0,
        wisdomBonus: 0,
        learnedAngles: [],
        reflections: [],
      });
    }
  }
  
  getMemory(role: string): GameMemory {
    return this.memories.get(role) || this.memories.get('thinker')!;
  }
  
  updateMemory(role: string, update: Partial<GameMemory>) {
    const memory = this.getMemory(role);
    this.memories.set(role, { ...memory, ...update });
  }
  
  recordGame(role: string, won: boolean) {
    const m = this.getMemory(role);
    this.updateMemory(role, {
      totalGames: m.totalGames + 1,
      wins: m.wins + (won ? 1 : 0),
    });
  }
  
  updateWisdom(role: string, gain: number) {
    const m = this.getMemory(role);
    this.updateMemory(role, {
      wisdomBonus: Math.min(0.25, m.wisdomBonus + gain),
    });
  }
  
  addReflection(role: string, reflection: GameMemory['reflections'][0]) {
    const m = this.getMemory(role);
    this.updateMemory(role, {
      reflections: [...m.reflections, reflection].slice(-10),
    });
  }
  
  learnAngle(role: string, from: string, angle: string) {
    const m = this.getMemory(role);
    const existing = m.learnedAngles.find(a => a.angle === angle);
    if (existing) {
      existing.strength = Math.min(1, existing.strength + 0.1);
    } else {
      m.learnedAngles.push({ from, angle, strength: 0.3 });
    }
    this.updateMemory(role, { learnedAngles: m.learnedAngles });
  }
  
  getWisdomHint(role: string): string {
    const m = this.getMemory(role);
    if (m.learnedAngles.length === 0) return '';
    const hints = m.learnedAngles.slice(-2).map(a => `从${a.from}学到"${a.angle}"`).join('；');
    return `\n经验：${hints}`;
  }
  
  exportState(): Record<string, GameMemory> {
    const state: Record<string, GameMemory> = {};
    for (const [role, memory] of this.memories) {
      state[role] = memory;
    }
    return state;
  }
}

// 全局记忆
let globalMemory: MemoryManager | null = null;

function getMemory(): MemoryManager {
  if (!globalMemory) globalMemory = new MemoryManager();
  return globalMemory;
}

/**
 * 高维博弈引擎（优化版）
 */
export class LatentGameEngine {
  private llmClient: LLMClient;
  private memory: MemoryManager;
  private asyncLearning = false;
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
    this.memory = getMemory();
  }
  
  /**
   * 快速博弈（不等待学习）
   */
  async play(question: string): Promise<GameResult> {
    // 1. 并行思考
    const thoughts = await Promise.all(
      PLAYERS.map(p => this.think(p, question))
    );
    
    // 2. 快速评估
    const result = this.fastEvaluate(thoughts);
    
    // 3. 记录结果
    for (const t of thoughts) {
      this.memory.recordGame(t.role, t.role === result.winner.role);
    }
    
    return result;
  }
  
  /**
   * 异步学习（不阻塞）
   */
  learnAsync(question: string, thoughts: InnerThought[], winner: InnerThought): void {
    // 不等待，后台执行
    this.doLearning(question, thoughts, winner).catch(() => {});
  }
  
  /**
   * 单模型思考
   */
  private async think(player: typeof PLAYERS[0], question: string): Promise<InnerThought> {
    const wisdomHint = this.memory.getWisdomHint(player.role);
    const wisdomBonus = this.memory.getMemory(player.role).wisdomBonus;
    
    const prompt = THOUGHT_PROMPT
      .replace('{QUESTION}', question)
      .replace('{ROLE}', player.role)
      .replace('{STRENGTH}', player.strength)
      + wisdomHint;
    
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
   * 快速评估（不调用模型）
   */
  private fastEvaluate(thoughts: InnerThought[]): GameResult {
    const sorted = [...thoughts].sort((a, b) => b.confidence - a.confidence);
    const top = sorted[0];
    const second = sorted[1];
    
    // 置信度差距 > 0.15 直接选，不用裁判
    if (top.confidence - (second?.confidence || 0) > 0.15) {
      return {
        winner: top,
        allThoughts: thoughts,
        evaluationReason: `置信度领先 (${top.confidence.toFixed(2)})`,
      };
    }
    
    // 差距小，简单规则：优先级 thinker > technician > responder
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
   * 执行学习（异步）
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
          .replace('{RESULT}', t.role === winner.role ? '胜' : '败');
        
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
          
          this.memory.updateWisdom(t.role, gain);
          this.memory.addReflection(t.role, {
            question: question.slice(0, 30),
            result: t.role === winner.role ? 'win' : 'lose',
            insight: parsed.insight || '',
            timestamp: Date.now(),
          });
          
          // 如果输了，从赢家学习
          if (t.role !== winner.role && winner.angle) {
            this.memory.learnAngle(t.role, winner.role, winner.angle);
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
   * 流式输出最终回答
   */
  async *streamAnswer(question: string, result: GameResult): AsyncGenerator<string> {
    const hints = result.allThoughts
      .filter(t => t.role !== result.winner.role)
      .map(t => `${t.role}认为: ${t.core}`)
      .join('\n');
    
    const messages = [
      { role: 'user' as const, content: `${question}\n\n参考其他视角：\n${hints || '无'}` }
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
   * 获取统计
   */
  getStats(): Record<string, GameMemory> {
    return this.memory.exportState();
  }
}

// 全局引擎
let globalEngine: LatentGameEngine | null = null;

export function getGameEngine(headers: Record<string, string>): LatentGameEngine {
  if (!globalEngine) globalEngine = new LatentGameEngine(headers);
  return globalEngine;
}

export function getPlayers() {
  return PLAYERS;
}

export type { GameMemory, InnerThought, GameResult, LearningReport };
