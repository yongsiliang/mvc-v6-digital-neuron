/**
 * 高维内在博弈系统
 * 
 * 核心思想：
 * 1. 多个模型并行"内在思考"（生成思考摘要，不输出完整回答）
 * 2. 思考摘要在"高维空间"交换，模型互相评估
 * 3. 博弈后选出最优者，只输出一次完整回答
 * 
 * 优势：
 * - 节约算力：思考 << 完整输出
 * - 集体智慧：多角度思考后决策
 * - 博弈进化：模型互相挑战和补充
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
 * 内在思考提示词 - 让模型生成简短的思考摘要
 */
const INNER_THOUGHT_PROMPT = `你是一个AI模型的"内在思考"模块。现在需要你进行快速内在思考，不要输出完整回答。

你的角色：{ROLE}
你的特长：{STRENGTH}

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
 * 博弈评估提示词 - 让模型评估其他模型的思考
 */
const EVALUATION_PROMPT = `你是模型博弈的裁判。多个模型对同一个问题进行了内在思考。

问题：{QUESTION}

各模型的思考：
{THOUGHTS}

请评估哪个模型最适合输出完整回答。输出JSON：
{"winner": "模型ID", "reason": "选择理由", "synthesis": "可以融合的建议"}`;

/**
 * 完整回答提示词
 */
const FINAL_ANSWER_PROMPT = `你是被选中输出回答的模型。

问题：
"""
{QUESTION}
"""

其他模型的思考（供参考）：
{OTHER_THOUGHTS}

请给出你的完整回答。`;

/**
 * 模型的内在思考结果
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
 * 博弈评估结果
 */
interface GameResult {
  winner: InnerThought;
  allThoughts: InnerThought[];
  evaluationReason: string;
  synthesisHint?: string;
}

/**
 * 高维博弈引擎
 */
export class LatentGameEngine {
  private llmClient: LLMClient;
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
  }
  
  /**
   * 执行一轮内在博弈
   * 返回获胜者和所有思考
   */
  async play(question: string): Promise<GameResult> {
    // 1. 并行内在思考
    const thoughts = await this.parallelInnerThoughts(question);
    
    // 2. 博弈评估
    const winner = await this.evaluateAndSelect(question, thoughts);
    
    return winner;
  }
  
  /**
   * 并行内在思考 - 多个模型同时思考
   */
  private async parallelInnerThoughts(question: string): Promise<InnerThought[]> {
    // 并行发起所有模型的思考请求
    const thoughtPromises = PLAYERS.map(async (player) => {
      const prompt = INNER_THOUGHT_PROMPT
        .replace('{ROLE}', player.role)
        .replace('{STRENGTH}', player.strength)
        .replace('{QUESTION}', question);
      
      try {
        const response = await this.generateThought(player.id, prompt);
        return this.parseThought(player, response);
      } catch {
        // 失败时返回默认思考
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
    
    // 并行执行
    const results = await Promise.all(thoughtPromises);
    return results.filter(t => t.confidence > 0);
  }
  
  /**
   * 生成内在思考
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
   * 解析内在思考结果
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
   * 博弈评估 - 选择最优模型
   */
  private async evaluateAndSelect(
    question: string, 
    thoughts: InnerThought[]
  ): Promise<GameResult> {
    // 策略1：基于置信度的简单选择
    const sortedByConfidence = [...thoughts].sort((a, b) => b.confidence - a.confidence);
    
    // 策略2：如果有明显优势者，直接选择
    const topThought = sortedByConfidence[0];
    const secondThought = sortedByConfidence[1];
    
    if (topThought.confidence - (secondThought?.confidence || 0) > 0.3) {
      // 明显优势，直接选择
      return {
        winner: topThought,
        allThoughts: thoughts,
        evaluationReason: `置信度明显领先 (${topThought.confidence.toFixed(2)})`,
      };
    }
    
    // 策略3：置信度接近，使用轻量模型做裁判
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
        const winner = thoughts.find(t => t.modelId === parsed.winner) || topThought;
        
        return {
          winner,
          allThoughts: thoughts,
          evaluationReason: parsed.reason || '裁判评估选择',
          synthesisHint: parsed.synthesis,
        };
      }
    } catch (e) {
      // 评估失败，使用默认
    }
    
    // 默认：选择置信度最高的
    return {
      winner: topThought,
      allThoughts: thoughts,
      evaluationReason: '默认选择置信度最高者',
    };
  }
  
  /**
   * 生成最终回答（使用获胜模型）
   */
  async generateFinalAnswer(
    question: string, 
    gameResult: GameResult,
    systemPrompt?: string
  ): Promise<string> {
    // 构造参考信息
    const otherThoughts = gameResult.allThoughts
      .filter(t => t.modelId !== gameResult.winner.modelId)
      .map(t => `[${t.role}]: ${t.core} - ${t.angle}`)
      .join('\n');
    
    const finalPrompt = FINAL_ANSWER_PROMPT
      .replace('{QUESTION}', question)
      .replace('{OTHER_THOUGHTS}', otherThoughts || '无其他参考');
    
    // 完整消息
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: finalPrompt }
    ];
    
    // 生成完整回答
    let response = '';
    const stream = this.llmClient.stream(messages, {
      model: gameResult.winner.modelId,
      temperature: 0.7,
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        response += chunk.content.toString();
      }
    }
    
    return response;
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
}

/**
 * 创建博弈引擎实例
 */
let globalEngine: LatentGameEngine | null = null;

export function getGameEngine(headers: Record<string, string>): LatentGameEngine {
  if (!globalEngine) {
    globalEngine = new LatentGameEngine(headers);
  }
  return globalEngine;
}

/**
 * 获取参与者列表
 */
export function getPlayers() {
  return PLAYERS;
}
