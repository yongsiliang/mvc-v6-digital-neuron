/**
 * 高维内在博弈系统（带主动学习）
 * 
 * 核心思想：
 * 1. 多个模型并行"内在思考"（生成思考摘要，不输出完整回答）
 * 2. 思考摘要在"高维空间"交换，模型互相评估
 * 3. 博弈后选出最优者，只输出一次完整回答
 * 4. 【新增】博弈后主动学习，越博弈越聪明
 * 
 * 学习机制：
 * - 反思学习：分析自己为什么赢/输
 * - 角度学习：吸收其他模型的优点
 * - 经验积累：形成可复用的博弈智慧
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 参与博弈的模型
 */
const PLAYERS = [
  { id: 'doubao-seed-1-6-thinking-250715', role: 'thinker', strength: '深度推理、逻辑分析' },
  { id: 'deepseek-v3-2-251201', role: 'technician', strength: '技术实现、编程算法' },
  { id: 'doubao-seed-2-0-pro-260215', role: 'architect', strength: '系统设计、综合方案' },
  { id: 'kimi-k2-250905', role: 'contextualizer', strength: '上下文整合、信息综合' },
];

/**
 * 模型的博弈记忆 - 用于学习
 */
interface GameMemory {
  role: string;
  totalGames: number;
  wins: number;
  avgConfidence: number;
  
  // 学到的角度（从其他模型学到的）
  learnedAngles: Array<{
    from: string;       // 从哪个角色学的
    angle: string;      // 学到的角度
    strength: number;   // 掌握程度 0-1
  }>;
  
  // 反思记录（最近10条）
  reflections: Array<{
    question: string;   // 问题摘要
    result: 'win' | 'lose';
    insight: string;    // 获得的洞见
    timestamp: number;
  }>;
  
  // 博弈智慧（累积的学习效果）
  wisdomBonus: number;  // 加到置信度上的学习奖励
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
  rawThought: string;
}

/**
 * 博弈结果
 */
interface GameResult {
  winner: InnerThought;
  allThoughts: InnerThought[];
  evaluationReason: string;
  synthesisHint?: string;
  learningReport?: LearningReport;
}

/**
 * 学习报告
 */
interface LearningReport {
  reflections: Array<{
    role: string;
    reflection: string;
    learningGain: number;
  }>;
  updatedWisdom: Array<{
    role: string;
    wisdomBonus: number;
  }>;
}

/**
 * 反思学习提示词
 */
const REFLECTION_PROMPT = `你是模型博弈的参与者，刚刚结束了一轮博弈。

你的角色：{ROLE}
博弈结果：{RESULT}（胜出者：{WINNER}）

你的思考：{MY_THOUGHT}
其他模型的思考：
{OTHER_THOUGHTS}

请进行反思学习（不超过80字），输出JSON：
{
  "reflection": "我的反思...",
  "learnedAngle": "我从其他模型学到的新角度（如果有）",
  "learningGain": 0.1
}

learningGain是你认为自己从这轮博弈中获得的学习收益（0-0.2）。`;

/**
 * 内在思考提示词
 */
const INNER_THOUGHT_PROMPT = `你是一个AI模型的"内在思考"模块。

你的角色：{ROLE}
你的特长：{STRENGTH}
{WISDOM_HINT}

用户问题：
"""
{QUESTION}
"""

请输出你的内在思考（不超过100字）：
1. 这个问题的核心是什么？
2. 你能从什么角度贡献？
3. 你是否有信心完整回答？

只输出思考，不要输出回答！格式：
{"core": "核心问题", "angle": "我的角度", "confidence": 0.8}`;

/**
 * 博弈评估提示词
 */
const EVALUATION_PROMPT = `你是模型博弈的裁判。

问题：{QUESTION}

各模型的思考：
{THOUGHTS}

请评估哪个模型最适合输出完整回答。输出JSON：
{"winner": "角色名", "reason": "选择理由", "synthesis": "可以融合的建议"}`;

/**
 * 完整回答提示词
 */
const FINAL_ANSWER_PROMPT = `你是被选中输出回答的模型。

问题：
"""
{QUESTION}
"""

其他模型的思考（供参考融合）：
{OTHER_THOUGHTS}

请给出你的完整回答，适当融合其他模型的智慧。`;

/**
 * 博弈记忆管理器
 */
class MemoryManager {
  private memories: Map<string, GameMemory> = new Map();
  
  constructor() {
    // 初始化每个玩家的记忆
    for (const player of PLAYERS) {
      this.memories.set(player.role, {
        role: player.role,
        totalGames: 0,
        wins: 0,
        avgConfidence: 0.5,
        learnedAngles: [],
        reflections: [],
        wisdomBonus: 0,
      });
    }
  }
  
  /**
   * 获取记忆
   */
  getMemory(role: string): GameMemory {
    return this.memories.get(role) || this.memories.get('thinker')!;
  }
  
  /**
   * 更新记忆
   */
  updateMemory(role: string, update: Partial<GameMemory>) {
    const memory = this.getMemory(role);
    this.memories.set(role, { ...memory, ...update });
  }
  
  /**
   * 记录博弈结果
   */
  recordGame(role: string, won: boolean, confidence: number) {
    const memory = this.getMemory(role);
    const newTotal = memory.totalGames + 1;
    const newWins = memory.wins + (won ? 1 : 0);
    
    this.updateMemory(role, {
      totalGames: newTotal,
      wins: newWins,
      avgConfidence: (memory.avgConfidence * memory.totalGames + confidence) / newTotal,
    });
  }
  
  /**
   * 添加反思
   */
  addReflection(role: string, reflection: GameMemory['reflections'][0]) {
    const memory = this.getMemory(role);
    const newReflections = [...memory.reflections, reflection].slice(-10); // 保留最近10条
    this.updateMemory(role, { reflections: newReflections });
  }
  
  /**
   * 学习新角度
   */
  learnAngle(role: string, from: string, angle: string) {
    const memory = this.getMemory(role);
    
    // 检查是否已经学过类似角度
    const existing = memory.learnedAngles.find(a => a.angle === angle);
    if (existing) {
      // 增强已有角度
      existing.strength = Math.min(1, existing.strength + 0.1);
    } else {
      // 学习新角度
      memory.learnedAngles.push({
        from,
        angle,
        strength: 0.3,
      });
    }
    
    this.updateMemory(role, { learnedAngles: memory.learnedAngles });
  }
  
  /**
   * 更新智慧加成
   */
  updateWisdom(role: string, gain: number) {
    const memory = this.getMemory(role);
    const newWisdom = Math.min(0.3, memory.wisdomBonus + gain); // 上限0.3
    this.updateMemory(role, { wisdomBonus: newWisdom });
  }
  
  /**
   * 获取智慧提示（用于影响思考）
   */
  getWisdomHint(role: string): string {
    const memory = this.getMemory(role);
    
    if (memory.learnedAngles.length === 0 && memory.reflections.length === 0) {
      return '';
    }
    
    const learnedHints = memory.learnedAngles
      .slice(-3)
      .map(a => `你从${a.from}学到了"${a.angle}"的视角`)
      .join('；');
    
    const recentInsight = memory.reflections[memory.reflections.length - 1]?.insight || '';
    
    return `\n你的博弈经验：${learnedHints || '暂无'}
最近反思：${recentInsight || '暂无'}`;
  }
  
  /**
   * 导出记忆状态（用于持久化）
   */
  exportState(): Record<string, GameMemory> {
    const state: Record<string, GameMemory> = {};
    for (const [role, memory] of this.memories) {
      state[role] = memory;
    }
    return state;
  }
  
  /**
   * 导入记忆状态
   */
  importState(state: Record<string, GameMemory>) {
    for (const [role, memory] of Object.entries(state)) {
      this.memories.set(role, memory);
    }
  }
}

// 全局记忆管理器
let globalMemoryManager: MemoryManager | null = null;

function getMemoryManager(): MemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager();
  }
  return globalMemoryManager;
}

/**
 * 高维博弈引擎（带学习）
 */
export class LatentGameEngine {
  private llmClient: LLMClient;
  private memoryManager: MemoryManager;
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
    this.memoryManager = getMemoryManager();
  }
  
  /**
   * 执行一轮内在博弈（带学习）
   */
  async play(question: string): Promise<GameResult> {
    // 1. 并行内在思考（使用智慧提示）
    const thoughts = await this.parallelInnerThoughts(question);
    
    // 2. 博弈评估
    const result = await this.evaluateAndSelect(question, thoughts);
    
    // 3. 记录博弈结果
    for (const thought of thoughts) {
      this.memoryManager.recordGame(
        thought.role, 
        thought.role === result.winner.role,
        thought.confidence
      );
    }
    
    // 4. 主动学习
    const learningReport = await this.learnFromGame(question, thoughts, result.winner);
    result.learningReport = learningReport;
    
    return result;
  }
  
  /**
   * 并行内在思考
   */
  private async parallelInnerThoughts(question: string): Promise<InnerThought[]> {
    const thoughtPromises = PLAYERS.map(async (player) => {
      // 获取智慧提示
      const wisdomHint = this.memoryManager.getWisdomHint(player.role);
      const memory = this.memoryManager.getMemory(player.role);
      
      const prompt = INNER_THOUGHT_PROMPT
        .replace('{ROLE}', player.role)
        .replace('{STRENGTH}', player.strength)
        .replace('{WISDOM_HINT}', wisdomHint)
        .replace('{QUESTION}', question);
      
      try {
        const response = await this.generateThought(player.id, prompt);
        const thought = this.parseThought(player, response);
        
        // 应用智慧加成到置信度
        thought.confidence = Math.min(1, thought.confidence + memory.wisdomBonus);
        
        return thought;
      } catch {
        return {
          modelId: player.id,
          role: player.role,
          core: '思考失败',
          angle: '',
          confidence: 0.3,
          rawThought: '',
        };
      }
    });
    
    return Promise.all(thoughtPromises);
  }
  
  /**
   * 从博弈中学习
   */
  private async learnFromGame(
    question: string, 
    thoughts: InnerThought[], 
    winner: InnerThought
  ): Promise<LearningReport> {
    const reflections: LearningReport['reflections'] = [];
    const updatedWisdom: LearningReport['updatedWisdom'] = [];
    
    // 让每个模型进行反思学习
    for (const thought of thoughts) {
      const otherThoughts = thoughts
        .filter(t => t.role !== thought.role)
        .map(t => `[${t.role}]: ${t.core} - ${t.angle}`)
        .join('\n');
      
      const prompt = REFLECTION_PROMPT
        .replace('{ROLE}', thought.role)
        .replace('{RESULT}', thought.role === winner.role ? '你赢了' : '你输了')
        .replace('{WINNER}', winner.role)
        .replace('{MY_THOUGHT}', `${thought.core} - ${thought.angle}`)
        .replace('{OTHER_THOUGHTS}', otherThoughts);
      
      try {
        const response = await this.generateThought('doubao-seed-2-0-lite-260215', prompt);
        const reflection = this.parseReflection(response);
        
        reflections.push({
          role: thought.role,
          reflection: reflection.reflection,
          learningGain: reflection.learningGain,
        });
        
        // 更新智慧
        this.memoryManager.updateWisdom(thought.role, reflection.learningGain);
        
        // 学习新角度
        if (reflection.learnedAngle) {
          const teacher = thought.role === winner.role 
            ? 'self' 
            : winner.role;
          this.memoryManager.learnAngle(thought.role, teacher, reflection.learnedAngle);
        }
        
        // 记录反思
        this.memoryManager.addReflection(thought.role, {
          question: question.slice(0, 50),
          result: thought.role === winner.role ? 'win' : 'lose',
          insight: reflection.reflection,
          timestamp: Date.now(),
        });
        
        // 记录更新后的智慧值
        const memory = this.memoryManager.getMemory(thought.role);
        updatedWisdom.push({
          role: thought.role,
          wisdomBonus: memory.wisdomBonus,
        });
        
      } catch {
        // 反思失败，跳过
      }
    }
    
    return { reflections, updatedWisdom };
  }
  
  /**
   * 解析反思结果
   */
  private parseReflection(response: string): {
    reflection: string;
    learnedAngle: string;
    learningGain: number;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reflection: parsed.reflection || '',
          learnedAngle: parsed.learnedAngle || '',
          learningGain: Math.min(0.2, Math.max(0, parsed.learningGain || 0)),
        };
      }
    } catch (e) {
      // 解析失败
    }
    
    return {
      reflection: response.slice(0, 80),
      learnedAngle: '',
      learningGain: 0.05,
    };
  }
  
  /**
   * 生成思考
   */
  private async generateThought(modelId: string, prompt: string): Promise<string> {
    let response = '';
    
    const stream = this.llmClient.stream([
      { role: 'user', content: prompt }
    ], {
      model: modelId,
      temperature: 0.5,
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        response += chunk.content.toString();
      }
    }
    
    return response;
  }
  
  /**
   * 解析思考结果
   */
  private parseThought(player: typeof PLAYERS[0], response: string): InnerThought {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          modelId: player.id,
          role: player.role,
          core: parsed.core || '',
          angle: parsed.angle || '',
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          rawThought: response,
        };
      }
    } catch (e) {
      // 解析失败
    }
    
    return {
      modelId: player.id,
      role: player.role,
      core: response.slice(0, 50),
      angle: '',
      confidence: 0.4,
      rawThought: response,
    };
  }
  
  /**
   * 博弈评估
   */
  private async evaluateAndSelect(
    question: string, 
    thoughts: InnerThought[]
  ): Promise<GameResult> {
    const sortedByConfidence = [...thoughts].sort((a, b) => b.confidence - a.confidence);
    const topThought = sortedByConfidence[0];
    const secondThought = sortedByConfidence[1];
    
    // 明显优势，直接选择
    if (topThought.confidence - (secondThought?.confidence || 0) > 0.2) {
      return {
        winner: topThought,
        allThoughts: thoughts,
        evaluationReason: `置信度明显领先 (${topThought.confidence.toFixed(2)})`,
      };
    }
    
    // 使用裁判评估
    try {
      const thoughtsText = thoughts.map(t => 
        `[${t.role}] 置信度${t.confidence.toFixed(2)}: ${t.core} | 角度: ${t.angle}`
      ).join('\n');
      
      const evalPrompt = EVALUATION_PROMPT
        .replace('{QUESTION}', question)
        .replace('{THOUGHTS}', thoughtsText);
      
      const evalResponse = await this.generateThought('doubao-seed-2-0-lite-260215', evalPrompt);
      
      const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const winner = thoughts.find(t => t.role === parsed.winner) || topThought;
        
        return {
          winner,
          allThoughts: thoughts,
          evaluationReason: parsed.reason || '裁判评估选择',
          synthesisHint: parsed.synthesis,
        };
      }
    } catch (e) {
      // 评估失败
    }
    
    return {
      winner: topThought,
      allThoughts: thoughts,
      evaluationReason: '默认选择置信度最高者',
    };
  }
  
  /**
   * 流式生成最终回答
   */
  async *streamFinalAnswer(
    question: string,
    gameResult: GameResult,
    systemPrompt?: string
  ): AsyncGenerator<string> {
    const otherThoughts = gameResult.allThoughts
      .filter(t => t.modelId !== gameResult.winner.modelId)
      .map(t => `[${t.role}]: ${t.core} - ${t.angle}`)
      .join('\n');
    
    const finalPrompt = FINAL_ANSWER_PROMPT
      .replace('{QUESTION}', question)
      .replace('{OTHER_THOUGHTS}', otherThoughts || '无其他参考');
    
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: finalPrompt }
    ];
    
    const stream = this.llmClient.stream(messages, {
      model: gameResult.winner.modelId,
      temperature: 0.7,
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }
  
  /**
   * 获取所有模型的博弈统计
   */
  getGameStats(): Record<string, GameMemory> {
    return this.memoryManager.exportState();
  }
  
  /**
   * 导入博弈记忆
   */
  importGameStats(stats: Record<string, GameMemory>) {
    this.memoryManager.importState(stats);
  }
}

// 全局引擎实例
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

export type { GameMemory, InnerThought, GameResult, LearningReport };
