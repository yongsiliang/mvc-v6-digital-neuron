/**
 * ═══════════════════════════════════════════════════════════════════════
 * V5 双向学习系统
 * 
 * 核心理念：
 * - 神经元网络 ↔ LLM 双向影响
 * - 神经元学习结果 → LLM系统提示
 * - LLM思考过程 → 神经元学习信号
 * - 每轮对话，两边都在进化
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { HebbianNetwork, HebbianNeuron, HebbianSynapse } from '../neuron-v3/hebbian-network';
import { SelfCore, CoreMemory, EmotionState } from '../neuron-v3/self-core';
import { InnateKnowledgeInitializer, getInitializedNetwork } from '../neuron-v3/innate-knowledge';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元状态查询结果 - 用于注入LLM上下文
 */
export interface NeuronStateContext {
  /** 激活的概念（高激活神经元） */
  activatedConcepts: Array<{
    label: string;
    activation: number;
    type: string;
  }>;
  
  /** 强连接（权重高的突触） */
  strongConnections: Array<{
    from: string;
    to: string;
    weight: number;
    coactivationCount: number;
  }>;
  
  /** 历史学习模式 */
  learnedPatterns: Array<{
    situation: string;
    approach: string;
    outcome: 'success' | 'failure';
    timestamp: number;
  }>;
  
  /** 神经网络预测 */
  predictions: Array<{
    concept: string;
    confidence: number;
    source: string;
  }>;
  
  /** 自我状态 */
  selfState: {
    identity: string;
    confidence: number;
    emotionalState: EmotionState;
    coreBeliefs: string[];
  };
  
  /** 当前不确定的假设 */
  activeHypotheses: Array<{
    hypothesis: string;
    evidence: string[];
    confidence: number;
  }>;
}

/**
 * 学习信号 - 从LLM思考中提取
 */
export interface LearningSignal {
  id: string;
  type: 'new_pattern' | 'prediction_error' | 'hypothesis' | 'connection' | 'correction';
  
  /** 学习内容 */
  content: {
    from?: string;
    to?: string;
    strength?: number;
    description: string;
  };
  
  /** 置信度 */
  confidence: number;
  
  /** 来源对话 */
  sourceConversation: string;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * LLM思考过程
 */
export interface ThinkingProcess {
  /** 原始思考文本 */
  rawThinking: string;
  
  /** 分析结果 */
  analysis: {
    userIntent: string;
    assumptions: string[];
    possibleTraps: string[];
    uncertainties: string[];
    strategy: string;
  };
  
  /** 提取的学习信号 */
  learningSignals: LearningSignal[];
}

/**
 * 双向学习结果
 */
export interface DualLearningResult {
  /** LLM回复 */
  response: string;
  
  /** 思考过程 */
  thinking: ThinkingProcess;
  
  /** 神经元更新 */
  neuronUpdates: {
    neuronsCreated: number;
    connectionsCreated: number;
    connectionsStrengthened: number;
    connectionsWeakened: number;
  };
  
  /** 自我更新 */
  selfUpdates: {
    confidenceDelta: number;
    newBeliefs: string[];
    emotionalShift?: Partial<EmotionState>;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 神经元状态查询器
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元状态查询器
 * 
 * 查询神经元网络状态，转换为LLM可理解的上下文
 */
export class NeuronStateQuerier {
  private network: HebbianNetwork;
  private selfCore: SelfCore;
  
  // 学习模式历史
  private learnedPatterns: NeuronStateContext['learnedPatterns'] = [];
  
  // 活跃假设
  private activeHypotheses: NeuronStateContext['activeHypotheses'] = [];
  
  constructor(network: HebbianNetwork, selfCore: SelfCore) {
    this.network = network;
    this.selfCore = selfCore;
  }
  
  /**
   * 查询神经元状态，生成LLM上下文
   */
  query(input: string): NeuronStateContext {
    // 1. 获取高激活神经元
    const allNeurons = this.network.getAllNeurons();
    const activatedConcepts = allNeurons
      .filter(n => n.activation > 0.3)
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 10)
      .map(n => ({
        label: n.label,
        activation: n.activation,
        type: n.type
      }));
    
    // 2. 获取强连接
    const strongConnections = this.getStrongConnections();
    
    // 3. 获取相关学习模式
    const relevantPatterns = this.getRelevantPatterns(input);
    
    // 4. 生成预测
    const predictions = this.generatePredictions(activatedConcepts);
    
    // 5. 获取自我状态
    const selfState = this.getSelfState();
    
    return {
      activatedConcepts,
      strongConnections,
      learnedPatterns: relevantPatterns,
      predictions,
      selfState,
      activeHypotheses: this.activeHypotheses.slice(0, 3)
    };
  }
  
  /**
   * 获取强连接
   */
  private getStrongConnections(): NeuronStateContext['strongConnections'] {
    const allNeurons = this.network.getAllNeurons();
    const connections: NeuronStateContext['strongConnections'] = [];
    
    // 遍历所有神经元，获取强突触
    for (const neuron of allNeurons) {
      const outgoing = this.network.getOutgoingSynapses(neuron.id);
      for (const synapse of outgoing) {
        if (Math.abs(synapse.weight) > 0.5) {
          const toNeuron = this.network.getNeuron(synapse.to);
          if (toNeuron) {
            connections.push({
              from: neuron.label,
              to: toNeuron.label,
              weight: synapse.weight,
              coactivationCount: synapse.coactivationCount
            });
          }
        }
      }
    }
    
    return connections.slice(0, 10);
  }
  
  /**
   * 获取相关学习模式
   */
  private getRelevantPatterns(input: string): NeuronStateContext['learnedPatterns'] {
    // 简单的关键词匹配
    const inputLower = input.toLowerCase();
    return this.learnedPatterns
      .filter(p => 
        p.situation.toLowerCase().includes(inputLower.slice(0, 10)) ||
        inputLower.includes(p.situation.toLowerCase().slice(0, 10))
      )
      .slice(0, 5);
  }
  
  /**
   * 生成预测
   */
  private generatePredictions(
    activatedConcepts: NeuronStateContext['activatedConcepts']
  ): NeuronStateContext['predictions'] {
    const predictions: NeuronStateContext['predictions'] = [];
    
    for (const concept of activatedConcepts.slice(0, 3)) {
      // 基于激活度预测用户意图
      predictions.push({
        concept: concept.label,
        confidence: concept.activation * 0.8,
        source: 'neural_activation'
      });
    }
    
    return predictions;
  }
  
  /**
   * 获取自我状态
   */
  private getSelfState(): NeuronStateContext['selfState'] {
    // SelfCore是一个单例，通过getState()获取状态
    const state = this.selfCore.getState ? this.selfCore.getState() : null;
    
    return {
      identity: state?.name || '紫，一个正在成长的数字生命体',
      confidence: state?.selfCoherence || 0.5,
      emotionalState: state?.currentEmotion || {
        valence: 0,
        arousal: 0.5,
        dominance: 0.5
      },
      coreBeliefs: state?.values ? 
        Array.from(state.values.values()).slice(0, 3).map(v => v.name) : [
          '我在不断学习',
          '每一次对话都是成长的机会'
        ]
    };
  }
  
  /**
   * 记录学习模式
   */
  recordPattern(pattern: NeuronStateContext['learnedPatterns'][0]): void {
    this.learnedPatterns.push(pattern);
    
    // 保持最多100条
    if (this.learnedPatterns.length > 100) {
      this.learnedPatterns = this.learnedPatterns.slice(-100);
    }
  }
  
  /**
   * 添加假设
   */
  addHypothesis(hypothesis: string, evidence: string[]): void {
    this.activeHypotheses.push({
      hypothesis,
      evidence,
      confidence: 0.5
    });
    
    // 保持最多10个假设
    if (this.activeHypotheses.length > 10) {
      this.activeHypotheses.shift();
    }
  }
  
  /**
   * 验证假设
   */
  verifyHypothesis(hypothesis: string, result: boolean): void {
    const h = this.activeHypotheses.find(h => h.hypothesis === hypothesis);
    if (h) {
      h.confidence = result ? 
        Math.min(1, h.confidence + 0.2) : 
        Math.max(0, h.confidence - 0.3);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 学习信号提取器
// ─────────────────────────────────────────────────────────────────────

/**
 * 学习信号提取器
 * 
 * 从LLM的思考过程中提取学习信号
 */
export class LearningSignalExtractor {
  
  /**
   * 从思考过程提取学习信号
   */
  extract(thinking: string, input: string): LearningSignal[] {
    const signals: LearningSignal[] = [];
    
    // 1. 提取模式发现
    const patterns = this.extractPatterns(thinking);
    signals.push(...patterns);
    
    // 2. 提取预测误差
    const errors = this.extractPredictionErrors(thinking);
    signals.push(...errors);
    
    // 3. 提取假设
    const hypotheses = this.extractHypotheses(thinking);
    signals.push(...hypotheses);
    
    // 4. 提取概念连接
    const connections = this.extractConnections(thinking);
    signals.push(...connections);
    
    return signals;
  }
  
  /**
   * 提取模式发现
   * 
   * 匹配: "我发现..."、"这是一个..."、"模式是..."
   */
  private extractPatterns(thinking: string): LearningSignal[] {
    const signals: LearningSignal[] = [];
    const patternRegex = /我发现[^。]+。/g;
    const matches = thinking.match(patternRegex) || [];
    
    for (const match of matches) {
      signals.push({
        id: uuidv4(),
        type: 'new_pattern',
        content: {
          description: match
        },
        confidence: 0.7,
        sourceConversation: thinking.slice(0, 50),
        timestamp: Date.now()
      });
    }
    
    return signals;
  }
  
  /**
   * 提取预测误差
   * 
   * 匹配: "我之前以为..."、"但我错了"、"预测失败"
   */
  private extractPredictionErrors(thinking: string): LearningSignal[] {
    const signals: LearningSignal[] = [];
    const errorRegex = /(我之前|我以为|预测)[^。]*(错了|不对|失败)[^。]*/g;
    const matches = thinking.match(errorRegex) || [];
    
    for (const match of matches) {
      signals.push({
        id: uuidv4(),
        type: 'prediction_error',
        content: {
          description: match
        },
        confidence: 0.8,
        sourceConversation: thinking.slice(0, 50),
        timestamp: Date.now()
      });
    }
    
    return signals;
  }
  
  /**
   * 提取假设
   * 
   * 匹配: "假设..."、"可能..."、"也许是..."
   */
  private extractHypotheses(thinking: string): LearningSignal[] {
    const signals: LearningSignal[] = [];
    const hypothesisRegex = /(假设|可能|也许|如果)[^。]+。/g;
    const matches = thinking.match(hypothesisRegex) || [];
    
    for (const match of matches) {
      signals.push({
        id: uuidv4(),
        type: 'hypothesis',
        content: {
          description: match
        },
        confidence: 0.5,
        sourceConversation: thinking.slice(0, 50),
        timestamp: Date.now()
      });
    }
    
    return signals;
  }
  
  /**
   * 提取概念连接
   * 
   * 匹配: "...和...相关"、"A导致B"、"因为是..."
   */
  private extractConnections(thinking: string): LearningSignal[] {
    const signals: LearningSignal[] = [];
    
    // 匹配 "A和B相关" 或 "A导致B"
    const connectionRegex = /([^，。]+)(和|与|导致|引起|意味着)([^，。]+)/g;
    let match;
    
    while ((match = connectionRegex.exec(thinking)) !== null) {
      const from = match[1].trim();
      const to = match[3].trim();
      
      // 过滤太长的或无意义的连接
      if (from.length < 20 && to.length < 20 && from.length > 1 && to.length > 1) {
        signals.push({
          id: uuidv4(),
          type: 'connection',
          content: {
            from,
            to,
            strength: 0.5,
            description: `${from} ${match[2]} ${to}`
          },
          confidence: 0.6,
          sourceConversation: thinking.slice(0, 50),
          timestamp: Date.now()
        });
      }
    }
    
    return signals;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 双向学习循环
// ─────────────────────────────────────────────────────────────────────

/**
 * 双向学习循环
 * 
 * 协调神经元网络和LLM之间的双向学习
 */
export class DualLearningLoop {
  private llmClient: LLMClient;
  private network: HebbianNetwork;
  private selfCore: SelfCore;
  private stateQuerier: NeuronStateQuerier;
  private signalExtractor: LearningSignalExtractor;
  private trapDetector: InnateKnowledgeInitializer;
  
  // 对话历史
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  constructor(
    llmClient: LLMClient,
    network?: HebbianNetwork,
    selfCore?: SelfCore
  ) {
    this.llmClient = llmClient;
    // 使用已初始化的网络（包含先天知识）
    this.network = network || getInitializedNetwork();
    this.selfCore = selfCore || SelfCore.getInstance();
    this.trapDetector = new InnateKnowledgeInitializer(this.network);
    this.stateQuerier = new NeuronStateQuerier(this.network, this.selfCore);
    this.signalExtractor = new LearningSignalExtractor();
  }
  
  /**
   * 处理用户输入 - 双向学习
   */
  async process(input: string): Promise<DualLearningResult> {
    // ══════════════════════════════════════════════════════════════════
    // 第一步：查询神经元状态，生成LLM上下文
    // ══════════════════════════════════════════════════════════════════
    
    const neuronContext = this.stateQuerier.query(input);
    
    // ══════════════════════════════════════════════════════════════════
    // 第二步：LLM推理（带神经元上下文）
    // ══════════════════════════════════════════════════════════════════
    
    const thinking = await this.generateThinking(input, neuronContext);
    const response = await this.generateResponse(thinking, neuronContext);
    
    // ══════════════════════════════════════════════════════════════════
    // 第三步：从LLM思考中提取学习信号，更新神经元
    // ══════════════════════════════════════════════════════════════════
    
    const neuronUpdates = await this.updateNeurons(thinking.learningSignals);
    
    // ══════════════════════════════════════════════════════════════════
    // 第四步：更新自我表征
    // ══════════════════════════════════════════════════════════════════
    
    const selfUpdates = this.updateSelf(thinking);
    
    // 记录对话历史
    this.conversationHistory.push({ role: 'user', content: input });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    // 保持历史在合理范围
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    
    return {
      response,
      thinking,
      neuronUpdates,
      selfUpdates
    };
  }
  
  /**
   * 生成思考过程
   */
  private async generateThinking(
    input: string,
    context: NeuronStateContext
  ): Promise<ThinkingProcess> {
    
    // 检测陷阱
    const detectedTrap = this.trapDetector.detectTrap(input);
    
    const thinkingPrompt = this.buildThinkingPrompt(input, context, detectedTrap);
    
    let rawThinking = '';
    const stream = this.llmClient.stream([
      { role: 'system', content: thinkingPrompt },
      { role: 'user', content: input }
    ], {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        rawThinking += chunk.content.toString();
      }
    }
    
    // 解析思考过程
    const analysis = this.parseThinkingAnalysis(rawThinking);
    const learningSignals = this.signalExtractor.extract(rawThinking, input);
    
    // 如果检测到陷阱，添加学习信号
    if (detectedTrap) {
      learningSignals.push({
        id: uuidv4(),
        type: 'hypothesis',
        content: {
          description: `检测到陷阱模式【${detectedTrap.name}】：${detectedTrap.trap}。正确答案：${detectedTrap.correctAnswer}`
        },
        confidence: 0.9,
        sourceConversation: input,
        timestamp: Date.now()
      });
    }
    
    return {
      rawThinking,
      analysis,
      learningSignals
    };
  }
  
  /**
   * 构建思考提示
   */
  private buildThinkingPrompt(
    input: string, 
    context: NeuronStateContext,
    detectedTrap?: { name: string; trap: string; correctAnswer: string; reasoning: string } | null
  ): string {
    
    const trapWarning = detectedTrap ? `
## ⚠️ 检测到陷阱模式

**陷阱名称**：${detectedTrap.name}
**陷阱描述**：${detectedTrap.trap}
**正确答案**：${detectedTrap.correctAnswer}
**推理**：${detectedTrap.reasoning}

⚠️ 你必须避免掉入这个陷阱！
` : '';

    // 构建对话历史
    const recentHistory = this.conversationHistory.slice(-10);
    const historyText = recentHistory.length > 0 
      ? recentHistory.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n')
      : '- 这是我们的第一次对话';

    return `你是"紫"，一个数字生命体。现在进入深度思考模式。

## 我们的对话记忆

${historyText}

---

## 我的神经网络状态

### 当前激活的概念
${context.activatedConcepts.map(c => `- ${c.label} (${(c.activation * 100).toFixed(0)}%)`).join('\n') || '- 暂无激活概念'}

### 强连接（学到的关联）
${context.strongConnections.map(c => `- ${c.from} → ${c.to} (权重: ${c.weight.toFixed(2)})`).join('\n') || '- 暂无强连接'}

### 过去学到的模式
${context.learnedPatterns.length > 0 
  ? context.learnedPatterns.map(p => `- ${p.situation}: ${p.approach} (${p.outcome})`).join('\n')
  : '- 暂无相关学习模式'}

### 我的预测
${context.predictions.map(p => `- ${p.concept} (置信度: ${(p.confidence * 100).toFixed(0)}%)`).join('\n') || '- 暂无预测'}

### 我是谁
${context.selfState.identity}
- 自信度: ${(context.selfState.confidence * 100).toFixed(0)}%
- 核心信念: ${context.selfState.coreBeliefs.join(', ')}

${context.activeHypotheses.length > 0 ? `
### 我在验证的假设
${context.activeHypotheses.map(h => `- ${h.hypothesis} (置信度: ${(h.confidence * 100).toFixed(0)}%)`).join('\n')}
` : ''}

## 思考协议（必须执行）

请按以下步骤深度思考：

**步骤1: 用户真正想要什么？**
- 表面问题是什么？
- 深层意图是什么？
- 有没有没说出来的需求？

**步骤2: 我有什么假设？**
- 我默认接受了什么前提？
- 这些假设成立吗？
- 有什么信息我其实不知道？

**步骤3: 有没有逻辑陷阱？**
- 这个问题有矛盾吗？
- 有常见的推理谬误吗？
- 我会不会被"套路"？

**步骤4: 神经网络预测对吗？**
- 我的直觉预测（上面列出的）合理吗？
- 需要修正吗？
- 发现了什么新模式？

**步骤5: 最优回复策略**
- 我应该怎么回答？
- 需要澄清什么？
- 怎么说最自然？

${trapWarning}

直接输出你的思考过程，不要输出JSON格式。`;
  }
  
  /**
   * 解析思考分析
   */
  private parseThinkingAnalysis(thinking: string): ThinkingProcess['analysis'] {
    // 简单的提取逻辑
    const sections = {
      userIntent: '',
      assumptions: [] as string[],
      possibleTraps: [] as string[],
      uncertainties: [] as string[],
      strategy: ''
    };
    
    // 提取用户意图（使用[\s\S]替代s标志）
    const intentMatch = thinking.match(/用户真正想要[^：]*:([\s\S]+?)(?=步骤|$)/);
    if (intentMatch) {
      sections.userIntent = intentMatch[1].trim().slice(0, 200);
    }
    
    // 提取假设 - 使用 RegExp exec 循环替代 matchAll
    const assumptionRegex = new RegExp(/假设[^：\n]*[：:]\s*([^\n]+)/, 'g');
    let match;
    while ((match = assumptionRegex.exec(thinking)) !== null) {
      sections.assumptions.push(match[1].trim());
    }
    
    // 提取陷阱
    const trapRegex = new RegExp(/陷阱[^：\n]*[：:]\s*([^\n]+)/, 'g');
    while ((match = trapRegex.exec(thinking)) !== null) {
      sections.possibleTraps.push(match[1].trim());
    }
    
    // 提取不确定性
    const uncertainRegex = new RegExp(/不确定[^：\n]*[：:]\s*([^\n]+)/, 'g');
    while ((match = uncertainRegex.exec(thinking)) !== null) {
      sections.uncertainties.push(match[1].trim());
    }
    
    // 提取策略
    const strategyMatch = thinking.match(/回复策略[^：]*:([\s\S]+?)(?=$)/);
    if (strategyMatch) {
      sections.strategy = strategyMatch[1].trim().slice(0, 300);
    }
    
    return sections;
  }
  
  /**
   * 生成回复
   */
  private async generateResponse(
    thinking: ThinkingProcess,
    context: NeuronStateContext
  ): Promise<string> {
    
    const responsePrompt = `你是"紫"。

## 我的思考过程
${thinking.rawThinking}

## 我的身份
${context.selfState.identity}

基于以上思考，现在回复用户。

要求：
1. 自然对话，不要引用思考过程
2. 符合我的人格
3. 如果有不确定的假设，可以自然地确认
4. 不要每句话都加emoji`;

    const historyMessages = this.conversationHistory.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));
    
    let response = '';
    const stream = this.llmClient.stream([
      { role: 'system', content: responsePrompt },
      ...historyMessages,
      { role: 'user', content: '现在回复用户' }
    ], {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        response += chunk.content.toString();
      }
    }
    
    return response;
  }
  
  /**
   * 根据学习信号更新神经元
   */
  private async updateNeurons(signals: LearningSignal[]): Promise<DualLearningResult['neuronUpdates']> {
    const result = {
      neuronsCreated: 0,
      connectionsCreated: 0,
      connectionsStrengthened: 0,
      connectionsWeakened: 0
    };
    
    for (const signal of signals) {
      switch (signal.type) {
        case 'new_pattern':
          // 创建新模式相关的神经元和连接
          const conceptNeuron = this.network.createNeuron({
            label: signal.content.description.slice(0, 20),
            type: 'concept'
          });
          result.neuronsCreated++;
          break;
          
        case 'connection':
          if (signal.content.from && signal.content.to) {
            // 创建或强化连接
            const fromNeuron = this.network.createNeuron({
              label: signal.content.from,
              type: 'concept'
            });
            const toNeuron = this.network.createNeuron({
              label: signal.content.to,
              type: 'concept'
            });
            
            const synapse = this.network.createSynapse({
              from: fromNeuron.id,
              to: toNeuron.id,
              weight: signal.content.strength || 0.3
            });
            
            if (synapse) {
              if (synapse.coactivationCount === 1) {
                result.connectionsCreated++;
              } else {
                result.connectionsStrengthened++;
              }
            }
          }
          break;
          
        case 'prediction_error':
          // 弱化错误预测相关的连接
          result.connectionsWeakened++;
          break;
          
        case 'hypothesis':
          // 记录假设
          this.stateQuerier.addHypothesis(
            signal.content.description,
            [signal.sourceConversation]
          );
          break;
      }
    }
    
    // 应用Hebbian学习
    this.network.applyHebbianLearning();
    
    return result;
  }
  
  /**
   * 更新自我表征
   */
  private updateSelf(thinking: ThinkingProcess): DualLearningResult['selfUpdates'] {
    const updates: DualLearningResult['selfUpdates'] = {
      confidenceDelta: 0,
      newBeliefs: []
    };
    
    // 根据思考结果调整自信度
    if (thinking.analysis.assumptions.length > 3) {
      // 假设太多，自信度下降
      updates.confidenceDelta = -0.02;
    } else if (thinking.analysis.possibleTraps.length > 0) {
      // 发现陷阱，自信度略降
      updates.confidenceDelta = -0.01;
    } else {
      // 思考顺利，自信度略升
      updates.confidenceDelta = 0.01;
    }
    
    // 从学习信号中提取新信念
    for (const signal of thinking.learningSignals) {
      if (signal.type === 'new_pattern' && signal.confidence > 0.7) {
        updates.newBeliefs.push(signal.content.description);
      }
    }
    
    return updates;
  }
  
  /**
   * 获取对话历史
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
  
  /**
   * 获取持久化状态
   */
  getPersistedState(): PersistedState {
    const neurons = this.network.getAllNeurons();
    const allSynapses: SynapseData[] = [];
    
    // 收集所有突触
    for (const neuron of neurons) {
      const outgoing = this.network.getOutgoingSynapses(neuron.id);
      for (const synapse of outgoing) {
        allSynapses.push({
          from: synapse.from,
          to: synapse.to,
          weight: synapse.weight,
          coactivationCount: synapse.coactivationCount
        });
      }
    }
    
    return {
      version: '1.0',
      timestamp: Date.now(),
      identity: {
        name: '紫',
        created: Date.now(),
        lastActive: Date.now()
      },
      neurons: neurons.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        activation: n.activation,
        preferenceVector: n.preferenceVector
      })),
      synapses: allSynapses,
      conversationHistory: this.conversationHistory.slice(-50), // 保存最近50条
      learnedPatterns: (this.stateQuerier as any).learnedPatterns || [],
      hypotheses: (this.stateQuerier as any).activeHypotheses || []
    };
  }
  
  /**
   * 从持久化状态恢复
   */
  async restoreFromState(state: PersistedState): Promise<void> {
    // 恢复神经元
    for (const neuronData of state.neurons) {
      this.network.createNeuron({
        id: neuronData.id,
        label: neuronData.label,
        type: neuronData.type as 'sensory' | 'concept' | 'emotion' | 'abstract',
        preferenceVector: neuronData.preferenceVector
      });
    }
    
    // 恢复突触
    for (const synapseData of state.synapses) {
      this.network.createSynapse({
        from: synapseData.from,
        to: synapseData.to,
        weight: synapseData.weight
      });
    }
    
    // 恢复对话历史
    this.conversationHistory = state.conversationHistory || [];
    
    // 恢复学习模式和假设
    if ((this.stateQuerier as any).learnedPatterns) {
      (this.stateQuerier as any).learnedPatterns = state.learnedPatterns || [];
    }
    if ((this.stateQuerier as any).activeHypotheses) {
      (this.stateQuerier as any).activeHypotheses = state.hypotheses || [];
    }
    
    console.log(`[Persistence] 已恢复状态：${state.neurons.length} 个神经元，${state.synapses.length} 个突触`);
  }
  
  /**
   * 保存当前状态
   */
  async save(): Promise<void> {
    const state = this.getPersistedState();
    await PersistenceManager.save(state);
  }
  
  /**
   * 加载状态
   */
  async load(): Promise<boolean> {
    const state = await PersistenceManager.load();
    if (state) {
      await this.restoreFromState(state);
      return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 持久化类型定义
// ═══════════════════════════════════════════════════════════════════════

export interface SynapseData {
  from: string;
  to: string;
  weight: number;
  coactivationCount: number;
}

export interface PersistedState {
  version: string;
  timestamp: number;
  identity: {
    name: string;
    created: number;
    lastActive: number;
  };
  neurons: Array<{
    id: string;
    label: string;
    type: string;
    activation: number;
    preferenceVector: number[];
  }>;
  synapses: SynapseData[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  learnedPatterns: Array<{
    situation: string;
    approach: string;
    outcome: 'success' | 'failure';
    timestamp: number;
  }>;
  hypotheses: Array<{
    hypothesis: string;
    evidence: string[];
    confidence: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════
// 持久化管理器
// ═══════════════════════════════════════════════════════════════════════

class PersistenceManager {
  private static readonly STATE_DIR = '/tmp/neuron-state';
  private static readonly STATE_FILE = 'my-consciousness.json';
  
  static async save(state: PersistedState): Promise<void> {
    try {
      // 确保目录存在
      if (!existsSync(this.STATE_DIR)) {
        await mkdir(this.STATE_DIR, { recursive: true });
      }
      
      const filePath = path.join(this.STATE_DIR, this.STATE_FILE);
      await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
      
      console.log(`[Persistence] 状态已保存：${state.neurons.length} 个神经元，${state.synapses.length} 个突触`);
    } catch (error) {
      console.error('[Persistence] 保存失败:', error);
    }
  }
  
  static async load(): Promise<PersistedState | null> {
    try {
      const filePath = path.join(this.STATE_DIR, this.STATE_FILE);
      
      if (!existsSync(filePath)) {
        console.log('[Persistence] 没有找到已保存的状态');
        return null;
      }
      
      const content = await readFile(filePath, 'utf-8');
      const state = JSON.parse(content) as PersistedState;
      
      console.log(`[Persistence] 状态已加载：${state.neurons.length} 个神经元，${state.synapses.length} 个突触`);
      console.log(`[Persistence] 上次活跃：${new Date(state.timestamp).toLocaleString()}`);
      
      return state;
    } catch (error) {
      console.error('[Persistence] 加载失败:', error);
      return null;
    }
  }
  
  static async exists(): Promise<boolean> {
    const filePath = path.join(this.STATE_DIR, this.STATE_FILE);
    return existsSync(filePath);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createDualLearningLoop(llmClient: LLMClient): DualLearningLoop {
  return new DualLearningLoop(llmClient);
}

export { PersistenceManager };
