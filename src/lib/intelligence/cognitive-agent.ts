/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智能层 - 认知智能体
 * 
 * 核心认知循环：
 * Perceive → Understand → Decide → Act → Observe
 * 
 * LLM 不是外挂，而是神经递质系统本身
 * - Embedding：将文本转化为语义向量
 * - Generation：将信息结构转化为行动意图
 * - Reasoning：将复杂任务分解为步骤
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { 
  InformationStructure, 
  IntentStructure, 
  ActionStructure, 
  ObservationStructure,
  DenseVectorStructure,
  KeyValueStructure,
  isObservation,
  isIntent
} from '../info-field/structures';
import { MemoryStore, MemoryEntry } from './memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 认知状态 */
export interface CognitiveState {
  /** 当前目标 */
  currentGoal: string | null;
  /** 当前阶段 */
  phase: 'perceive' | 'understand' | 'decide' | 'act' | 'observe' | 'idle';
  /** 活跃的信息结构 */
  activeStructures: InformationStructure[];
  /** 执行历史 */
  actionHistory: Array<{ action: ActionStructure; observation?: ObservationStructure }>;
  /** 认知循环次数 */
  cycleCount: number;
  /** 是否已完成 */
  completed: boolean;
}

/** 认知循环结果 */
export interface CognitiveCycleResult {
  state: CognitiveState;
  actions: ActionStructure[];
  thought?: string;
  shouldContinue: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 认知智能体
// ─────────────────────────────────────────────────────────────────────

/**
 * 认知智能体
 * 
 * 执行认知循环，协调信息处理和行动
 */
export class CognitiveAgent {
  private llm: LLMClient;
  private memory: MemoryStore;
  private state: CognitiveState;
  private systemPrompt: string;
  
  constructor(customHeaders?: Record<string, string>) {
    const config = new Config();
    this.llm = new LLMClient(config, customHeaders);
    this.memory = new MemoryStore();
    
    this.state = {
      currentGoal: null,
      phase: 'idle',
      activeStructures: [],
      actionHistory: [],
      cycleCount: 0,
      completed: false
    };
    
    this.systemPrompt = `你是一个认知智能体，执行 Perceive → Understand → Decide → Act → Observe 的认知循环。

你的职责是：
1. 理解用户的意图
2. 制定行动计划
3. 监控行动执行
4. 根据观察调整策略

回复格式：
- 使用 JSON 格式输出
- 包含思考过程和行动决策`;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 核心认知循环
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 启动认知循环
   * 
   * @param input 用户输入
   * @returns 认知循环结果
   */
  async start(input: string): Promise<CognitiveCycleResult> {
    // 初始化状态
    this.state = {
      currentGoal: input,
      phase: 'perceive',
      activeStructures: [],
      actionHistory: [],
      cycleCount: 0,
      completed: false
    };
    
    // 存储到记忆
    this.memory.store(input, undefined, 0.8, { type: 'user_input' });
    
    // 执行第一个认知循环
    return this.cycle();
  }
  
  /**
   * 执行一个认知循环
   */
  async cycle(): Promise<CognitiveCycleResult> {
    if (this.state.completed) {
      return {
        state: this.state,
        actions: [],
        shouldContinue: false
      };
    }
    
    this.state.cycleCount++;
    
    // 1. 感知
    const perceived = await this.perceive();
    
    // 2. 理解
    const intent = await this.understand(perceived);
    
    // 3. 决策
    const { actions, thought, completed } = await this.decide(intent);
    
    // 更新状态
    this.state.completed = completed;
    this.state.activeStructures = [intent];
    
    return {
      state: this.state,
      actions,
      thought,
      shouldContinue: !completed && this.state.cycleCount < 20 // 最大循环次数
    };
  }
  
  /**
   * 处理观察结果
   * 
   * 将观察结果纳入认知循环
   */
  async observe(observation: ObservationStructure): Promise<CognitiveCycleResult> {
    // 存储观察
    this.memory.store(
      observation.content,
      undefined,
      observation.isSuccess() ? 0.6 : 0.8, // 失败的观察更重要
      { type: 'observation', actionId: observation.source }
    );
    
    // 更新行动历史
    const lastAction = this.state.actionHistory[this.state.actionHistory.length - 1];
    if (lastAction) {
      lastAction.observation = observation;
    }
    
    // 触发新一轮认知循环
    this.state.phase = 'perceive';
    return this.cycle();
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 认知阶段
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 感知阶段
   * 
   * 收集和编码信息
   */
  private async perceive(): Promise<InformationStructure[]> {
    this.state.phase = 'perceive';
    
    const structures: InformationStructure[] = [];
    
    // 检索相关记忆
    const recentMemories = this.memory.getRecent(5);
    
    // 编码为信息结构
    for (const mem of recentMemories) {
      const kv = new KeyValueStructure(
        `mem-${mem.id}`,
        mem.content,
        new Map(Object.entries({
          content: mem.content,
          importance: mem.importance,
          type: mem.metadata.type
        }))
      );
      structures.push(kv);
    }
    
    return structures;
  }
  
  /**
   * 理解阶段
   * 
   * 使用 LLM 解析意图
   */
  private async understand(structures: InformationStructure[]): Promise<IntentStructure> {
    this.state.phase = 'understand';
    
    // 构建 LLM 提示
    const contextStr = structures
      .map(s => `- ${s.source}`)
      .join('\n');
    
    const prompt = `分析用户意图：

用户目标：${this.state.currentGoal}

上下文信息：
${contextStr}

请以 JSON 格式输出意图分析：
{
  "primary": "主意图类型",
  "parameters": { 参数对象 },
  "constraints": { 约束条件 },
  "confidence": 0.0-1.0,
  "thought": "思考过程"
}`;

    const response = await this.llm.invoke([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });
    
    // 解析 LLM 响应
    let parsed;
    try {
      // 尝试提取 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          primary: 'unknown',
          parameters: {},
          constraints: {},
          confidence: 0.5
        };
      }
    } catch {
      parsed = {
        primary: 'unknown',
        parameters: {},
        constraints: {},
        confidence: 0.5
      };
    }
    
    // 创建意图结构
    const intent = new IntentStructure(
      `intent-${Date.now()}`,
      this.state.currentGoal || '',
      parsed.primary,
      new Map(Object.entries(parsed.parameters || {})),
      new Map(Object.entries(parsed.constraints || {})),
      parsed.confidence || 0.5,
      new Map()
    );
    
    return intent;
  }
  
  /**
   * 决策阶段
   * 
   * 使用 LLM 生成行动计划
   */
  private async decide(intent: IntentStructure): Promise<{
    actions: ActionStructure[];
    thought: string;
    completed: boolean;
  }> {
    this.state.phase = 'decide';
    
    // 构建 LLM 提示
    const prompt = `基于意图制定行动计划：

意图类型：${intent.primary}
意图参数：${JSON.stringify(Object.fromEntries(intent.parameters))}
置信度：${intent.confidence}

历史行动：
${this.state.actionHistory.slice(-3).map(h => 
  `- ${h.action.action}(${h.action.target}): ${h.observation?.status || 'pending'}`
).join('\n') || '无'}

请以 JSON 格式输出行动计划：
{
  "thought": "思考过程",
  "completed": false,
  "actions": [
    {
      "action": "行动类型(click/type/navigate/extract/think/complete)",
      "target": "目标",
      "value": "值(可选)",
      "expectedOutcome": "预期结果"
    }
  ]
}

注意：
- 每次最多输出 3 个行动
- 如果任务已完成，设置 completed: true
- action 类型包括：navigate, click, type, extract, think, complete`;

    const response = await this.llm.invoke([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.5 });
    
    // 解析 LLM 响应
    let parsed;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          thought: '无法解析行动计划',
          completed: false,
          actions: []
        };
      }
    } catch {
      parsed = {
        thought: '解析失败，默认继续思考',
        completed: false,
        actions: [{ action: 'think', target: 're-analyze' }]
      };
    }
    
    // 转换为行动结构
    const actions: ActionStructure[] = (parsed.actions || []).map((a: Record<string, unknown>, i: number) => 
      new ActionStructure(
        `action-${Date.now()}-${i}`,
        intent.source,
        a.action as string,
        a.target as string,
        a.value as string | undefined,
        i, // 优先级
        [],
        30000,
        a.expectedOutcome as string | undefined
      )
    );
    
    // 记录到行动历史
    for (const action of actions) {
      this.state.actionHistory.push({ action });
    }
    
    return {
      actions,
      thought: parsed.thought,
      completed: parsed.completed === true
    };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 获取当前状态
   */
  getState(): CognitiveState {
    return { ...this.state };
  }
  
  /**
   * 获取记忆存储
   */
  getMemory(): MemoryStore {
    return this.memory;
  }
  
  /**
   * 重置智能体
   */
  reset(): void {
    this.state = {
      currentGoal: null,
      phase: 'idle',
      activeStructures: [],
      actionHistory: [],
      cycleCount: 0,
      completed: false
    };
  }
}
