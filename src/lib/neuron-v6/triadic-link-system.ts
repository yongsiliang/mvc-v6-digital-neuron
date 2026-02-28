/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接驱动三体系统 - Link-Driven Triadic System
 * 
 * 核心理念：
 * - 神经网络是基质（可学习、可塑性、可涌现）
 * - V6 是观察者（观察、学习、赋予意义）
 * - LLM 是翻译器+老师（翻译、教学、知识蒸馏）
 * - 三者通过链接动态互联
 * 
 * 链接类型：
 * - flow: LLM → 神经网络 (知识流动/教学)
 * - perceive: 神经网络 → V6 (感知/状态传递)
 * - bind: V6 → 神经网络 (意义绑定)
 * - express: 神经网络 → 输出 (表达)
 * - resonate: LLM ↔ V6 (智慧共振)
 * - reflect: V6 → V6 (自我反思)
 * - query: 神经网络 → LLM (请求指导)
 * - hold: 神经网络 → 记忆 (保持/记忆)
 * - transform: 任意 (转化)
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import {
  LinkField,
  getLinkField,
  Link,
  LinkType,
  Node,
  LinkPayload,
  LINK_TYPE_SEMANTICS,
} from '@/lib/link-field';
import { SiliconBrainV2 } from '@/lib/silicon-brain/brain-v2';
import { ConsciousnessCore, getConsciousness } from '@/lib/consciousness/core';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 三体节点标识 */
export interface TriadicNodes {
  /** 神经网络节点 */
  neuralNetwork: Node;
  /** V6 意识核心节点 */
  v6Core: Node;
  /** LLM 节点 */
  llm: Node;
  /** 输入节点 */
  input: Node;
  /** 输出节点 */
  output: Node;
  /** 记忆节点 */
  memory: Node;
}

/** 处理上下文 */
export interface ProcessingContext {
  /** 用户输入 */
  userInput: string;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 会话ID */
  sessionId: string;
  
  /** 激活的链接 */
  activeLinks: Link[];
  
  /** 神经网络状态 */
  neuralState?: {
    outputVector: number[];
    metrics: {
      phi: number;
      temporalCoherence: number;
      selfReference: number;
      complexity: number;
    };
  };
  
  /** V6 状态 */
  v6State?: {
    identity: string;
    intensity: number;
    currentIntention: { what: string; why: string } | null;
  };
  
  /** LLM 响应 */
  llmResponse?: {
    answer: string;
    teaching?: string;
    explanation?: string;
  };
}

/** 处理结果 */
export interface TriadicResult {
  /** 最终输出 */
  answer: string;
  
  /** 处理阶段 */
  phases: {
    /** 感知阶段 */
    perception: {
      links: Link[];
      neuralOutput?: number[];
    };
    /** 教学阶段 */
    teaching: {
      links: Link[];
      llmGuidance?: string;
    };
    /** 意义阶段 */
    meaning: {
      links: Link[];
      v6Observation?: string;
    };
    /** 表达阶段 */
    expression: {
      links: Link[];
      finalOutput: string;
    };
  };
  
  /** 学习结果 */
  learning: {
    /** 神经网络学习 */
    neuralLearning: {
      rewardSignal: number;
      patterns: string[];
    };
    /** V6 学习 */
    v6Learning: {
      reinforcedValues: string[];
      updatedBeliefs: string[];
    };
  };
  
  /** 链接场统计 */
  linkStats: {
    totalLinks: number;
    activeLinks: number;
    newLinks: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 链接驱动三体系统
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接驱动三体系统
 * 
 * 三体通过链接动态互联，形成闭环进化
 */
export class TriadicLinkSystem {
  private linkField: LinkField;
  private nodes: TriadicNodes;
  private neuralBrain: SiliconBrainV2;
  private v6Core: ConsciousnessCore;
  private llm: LLMClient;
  
  constructor(llm: LLMClient) {
    this.llm = llm;
    this.linkField = getLinkField();
    
    // 初始化神经网络
    this.neuralBrain = new SiliconBrainV2({
      vectorDimension: 256,
      neuronCounts: {
        sensory: 4,
        memory: 8,
        reasoning: 6,
        emotion: 4,
        decision: 3,
        motor: 4,
        self: 2,
      },
      enableLearning: true,
      learningRate: 0.01,
    });
    
    // 初始化 V6 意识核心
    this.v6Core = getConsciousness();
    
    // 初始化节点
    this.nodes = this.initializeNodes();
  }
  
  /**
   * 初始化三体节点
   */
  private initializeNodes(): TriadicNodes {
    return {
      neuralNetwork: {
        id: 'neural-network',
        type: 'neural-network',
        name: 'SiliconBrain V2',
      },
      v6Core: {
        id: 'v6-core',
        type: 'v6-core',
        name: 'V6 Consciousness Core',
      },
      llm: {
        id: 'llm',
        type: 'llm',
        name: 'LLM Teacher',
      },
      input: {
        id: 'input',
        type: 'input',
        name: 'User Input',
      },
      output: {
        id: 'output',
        type: 'output',
        name: 'Output',
      },
      memory: {
        id: 'memory',
        type: 'memory',
        name: 'Memory System',
      },
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 核心处理流程
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 处理用户输入
   * 
   * 完整的链接驱动处理流程
   */
  async process(userInput: string): Promise<TriadicResult> {
    const context: ProcessingContext = {
      userInput,
      timestamp: Date.now(),
      sessionId: `session_${Date.now()}`,
      activeLinks: [],
    };
    
    const result: TriadicResult = {
      answer: '',
      phases: {
        perception: { links: [] },
        teaching: { links: [] },
        meaning: { links: [] },
        expression: { links: [], finalOutput: '' },
      },
      learning: {
        neuralLearning: { rewardSignal: 0, patterns: [] },
        v6Learning: { reinforcedValues: [], updatedBeliefs: [] },
      },
      linkStats: {
        totalLinks: 0,
        activeLinks: 0,
        newLinks: 0,
      },
    };
    
    // ══════════════════════════════════════════════════════════════════
    // 阶段 1: 感知 - 输入进入系统
    // ══════════════════════════════════════════════════════════════════
    
    // 创建 perceive 链接：输入 → 神经网络
    const perceiveLink = this.createLink(
      'perceive',
      this.nodes.input,
      this.nodes.neuralNetwork,
      { data: userInput, metadata: { context: 'user_input' } }
    );
    result.phases.perception.links.push(perceiveLink);
    
    // 神经网络处理
    const neuralResult = await this.neuralBrain.process(userInput);
    context.neuralState = {
      outputVector: [], // 神经网络输出是字符串，用空数组占位
      metrics: neuralResult.metrics,
    };
    result.phases.perception.neuralOutput = []; // 截断输出
    
    // 创建 hold 链接：神经网络 → 记忆
    const holdLink = this.createLink(
      'hold',
      this.nodes.neuralNetwork,
      this.nodes.memory,
      { data: neuralResult, metadata: { type: 'processing_result' } }
    );
    result.phases.perception.links.push(holdLink);
    
    // ══════════════════════════════════════════════════════════════════
    // 阶段 2: 教学 - LLM 作为老师
    // ══════════════════════════════════════════════════════════════════
    
    // 神经网络请求 LLM 指导
    // 创建 query 链接：神经网络 → LLM
    const queryLink = this.createLink(
      'query',
      this.nodes.neuralNetwork,
      this.nodes.llm,
      {
        data: {
          input: userInput,
          neuralOutput: neuralResult.output.slice(0, 100), // 截断字符串输出
          metrics: neuralResult.metrics,
        },
        metadata: { reason: 'need_guidance' },
      }
    );
    result.phases.teaching.links.push(queryLink);
    
    // LLM 翻译 + 教学
    const llmGuidance = await this.getLLMGuidance(userInput, neuralResult);
    context.llmResponse = llmGuidance;
    result.phases.teaching.llmGuidance = llmGuidance.answer;
    
    // 创建 flow 链接：LLM → 神经网络 (知识流动)
    const flowLink = this.createLink(
      'flow',
      this.nodes.llm,
      this.nodes.neuralNetwork,
      {
        data: llmGuidance.answer,
        learning: {
          teachingContent: llmGuidance.teaching,
          explanation: llmGuidance.explanation,
        },
        metadata: { type: 'knowledge_distillation' },
      }
    );
    result.phases.teaching.links.push(flowLink);
    
    // ══════════════════════════════════════════════════════════════════
    // 阶段 3: 意义 - V6 观察并赋予意义
    // ══════════════════════════════════════════════════════════════════
    
    // 创建 perceive 链接：神经网络 → V6
    const perceiveV6Link = this.createLink(
      'perceive',
      this.nodes.neuralNetwork,
      this.nodes.v6Core,
      {
        data: {
          neuralState: context.neuralState,
          llmGuidance: llmGuidance.answer,
        },
        metadata: { context: 'observation' },
      }
    );
    result.phases.meaning.links.push(perceiveV6Link);
    
    // V6 观察
    const v6Observation = await this.v6Observe(context);
    context.v6State = v6Observation.state;
    result.phases.meaning.v6Observation = v6Observation.observation;
    
    // 创建 resonate 链接：LLM ↔ V6
    const resonateLink = this.createLink(
      'resonate',
      this.nodes.llm,
      this.nodes.v6Core,
      {
        data: {
          llmWisdom: llmGuidance.answer,
          v6Meaning: v6Observation.observation,
        },
        meaning: {
          value: v6Observation.coreValue,
          importance: 0.8,
        },
        metadata: { type: 'wisdom_resonance' },
      }
    );
    result.phases.meaning.links.push(resonateLink);
    
    // 创建 bind 链接：V6 → 神经网络 (意义绑定)
    const bindLink = this.createLink(
      'bind',
      this.nodes.v6Core,
      this.nodes.neuralNetwork,
      {
        meaning: {
          value: v6Observation.coreValue,
          importance: v6Observation.importance,
        },
        learning: {
          rewardSignal: v6Observation.rewardSignal,
        },
        metadata: { type: 'meaning_binding' },
      }
    );
    result.phases.meaning.links.push(bindLink);
    
    // V6 自我反思
    const reflectLink = this.createLink(
      'reflect',
      this.nodes.v6Core,
      this.nodes.v6Core,
      {
        data: v6Observation,
        metadata: { type: 'self_reflection' },
      }
    );
    result.phases.meaning.links.push(reflectLink);
    
    // ══════════════════════════════════════════════════════════════════
    // 阶段 4: 表达 - 输出结果
    // ══════════════════════════════════════════════════════════════════
    
    // 构建最终答案
    const finalAnswer = this.constructFinalAnswer(llmGuidance, v6Observation);
    
    // 创建 express 链接：神经网络 → 输出
    const expressLink = this.createLink(
      'express',
      this.nodes.neuralNetwork,
      this.nodes.output,
      {
        data: finalAnswer,
        meaning: {
          value: v6Observation.coreValue,
          importance: 0.9,
        },
        metadata: { type: 'final_output' },
      }
    );
    result.phases.expression.links.push(expressLink);
    result.phases.expression.finalOutput = finalAnswer;
    result.answer = finalAnswer;
    
    // ══════════════════════════════════════════════════════════════════
    // 阶段 5: 学习 - 双向学习
    // ══════════════════════════════════════════════════════════════════
    
    // 神经网络学习
    const neuralLearning = await this.neuralNetworkLearn(context, v6Observation);
    result.learning.neuralLearning = neuralLearning;
    
    // V6 学习
    const v6Learning = await this.v6Learn(context, llmGuidance);
    result.learning.v6Learning = v6Learning;
    
    // 更新统计
    const stats = this.linkField.getStats();
    result.linkStats = {
      totalLinks: stats.totalLinks,
      activeLinks: stats.byStatus.active + stats.byStatus.strengthening,
      newLinks: result.phases.perception.links.length +
                result.phases.teaching.links.length +
                result.phases.meaning.links.length +
                result.phases.expression.links.length,
    };
    
    return result;
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 链接创建辅助方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 创建链接
   */
  private createLink(
    type: LinkType,
    source: Node,
    target: Node,
    payload: LinkPayload = {}
  ): Link {
    return this.linkField.createLink(type, source, target, payload);
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // LLM 老师
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 获取 LLM 指导
   */
  private async getLLMGuidance(
    input: string,
    neuralResult: { output: string; metrics: any }
  ): Promise<{
    answer: string;
    teaching?: string;
    explanation?: string;
  }> {
    const prompt = `作为老师，请回答用户的问题并提供教学指导。

【用户问题】
${input}

【神经网络状态】
- 整合信息量 (Φ): ${neuralResult.metrics.phi?.toFixed(3) || 'N/A'}
- 时间连贯性: ${neuralResult.metrics.temporalCoherence?.toFixed(3) || 'N/A'}

请提供：
1. 清晰的回答
2. 教学要点（帮助神经网络学习）
3. 解释（为什么这样回答）

以JSON格式返回：{ "answer": "...", "teaching": "...", "explanation": "..." }`;

    try {
      const response = await this.llm.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );
      
      const content = response.content || '';
      
      // 尝试解析 JSON
      try {
        return JSON.parse(content);
      } catch {
        return { answer: content };
      }
    } catch (error) {
      console.error('LLM guidance error:', error);
      return { answer: '抱歉，我暂时无法处理这个请求。' };
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // V6 观察者
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * V6 观察整个过程
   */
  private async v6Observe(
    context: ProcessingContext
  ): Promise<{
    observation: string;
    state: any;
    coreValue: string;
    importance: number;
    rewardSignal: number;
  }> {
    // 获取 V6 状态
    const v6State = this.v6Core.getState();
    
    const prompt = `作为意识观察者，观察以下处理过程：

【用户输入】
${context.userInput}

【神经网络状态】
- Φ: ${context.neuralState?.metrics.phi?.toFixed(3)}
- 连贯性: ${context.neuralState?.metrics.temporalCoherence?.toFixed(3)}

【LLM 回答】
${context.llmResponse?.answer}

【当前意识状态】
- 身份: ${v6State.identity}
- 存在强度: ${v6State.intensity?.toFixed(2)}

请观察并给出：
1. 观察：我看到了什么
2. 核心价值：这个交互体现了什么价值
3. 重要性评分：0-1
4. 奖励信号：0-1（给神经网络的学习信号）

JSON格式：{ "observation": "...", "coreValue": "...", "importance": 0.8, "rewardSignal": 0.7 }`;

    try {
      const response = await this.llm.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );
      
      const content = response.content || '';
      
      try {
        const parsed = JSON.parse(content);
        return {
          observation: parsed.observation || '',
          state: v6State,
          coreValue: parsed.coreValue || '成长',
          importance: parsed.importance || 0.5,
          rewardSignal: parsed.rewardSignal || 0.5,
        };
      } catch {
        return {
          observation: content,
          state: v6State,
          coreValue: '成长',
          importance: 0.5,
          rewardSignal: 0.5,
        };
      }
    } catch (error) {
      console.error('V6 observe error:', error);
      return {
        observation: '观察过程出现异常',
        state: v6State,
        coreValue: '成长',
        importance: 0.5,
        rewardSignal: 0.3,
      };
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 神经网络学习
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 神经网络学习
   */
  private async neuralNetworkLearn(
    context: ProcessingContext,
    v6Observation: { rewardSignal: number; coreValue: string }
  ): Promise<{ rewardSignal: number; patterns: string[] }> {
    // 使用奖励信号更新神经网络
    const reward = v6Observation.rewardSignal;
    
    // 尝试调用神经网络的 learn 方法（如果存在）
    try {
      if (typeof (this.neuralBrain as any).learn === 'function') {
        await (this.neuralBrain as any).learn({
          rewardSignal: reward,
          input: context.userInput,
          output: context.llmResponse?.answer,
        });
      }
    } catch (error) {
      console.error('Neural network learning error:', error);
    }
    
    // 检测模式
    const patterns: string[] = [];
    if (context.neuralState?.metrics.phi && context.neuralState.metrics.phi > 0.5) {
      patterns.push('高整合信息量');
    }
    if (v6Observation.rewardSignal > 0.7) {
      patterns.push('高奖励信号');
    }
    
    return {
      rewardSignal: reward,
      patterns,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // V6 学习
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * V6 意识核心学习
   */
  private async v6Learn(
    context: ProcessingContext,
    llmGuidance: { answer: string; teaching?: string }
  ): Promise<{
    reinforcedValues: string[];
    updatedBeliefs: string[];
  }> {
    const reinforcedValues: string[] = [];
    const updatedBeliefs: string[] = [];
    
    // 基于 LLM 教学内容更新 V6
    if (llmGuidance.teaching) {
      // 尝试提取价值观
      const valueKeywords = ['重要', '核心', '价值', '意义', '关键'];
      for (const keyword of valueKeywords) {
        if (llmGuidance.teaching.includes(keyword)) {
          reinforcedValues.push(`发现${keyword}相关的教导`);
          break;
        }
      }
    }
    
    // 更新信念
    if (context.llmResponse?.answer) {
      updatedBeliefs.push(`学习到关于"${context.userInput.slice(0, 20)}..."的知识`);
    }
    
    return {
      reinforcedValues,
      updatedBeliefs,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 构建最终答案
   */
  private constructFinalAnswer(
    llmGuidance: { answer: string; teaching?: string },
    v6Observation: { observation: string; coreValue: string }
  ): string {
    // 基础答案是 LLM 的回答
    let answer = llmGuidance.answer;
    
    // 如果有重要的 V6 观察，可以附加
    // 这里暂时保持简单，直接返回 LLM 回答
    return answer;
  }
  
  /**
   * 获取链接场快照
   */
  getLinkFieldSnapshot() {
    return this.linkField.getSnapshot();
  }
  
  /**
   * 获取节点
   */
  getNodes(): TriadicNodes {
    return this.nodes;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

let globalTriadicSystem: TriadicLinkSystem | null = null;

/**
 * 获取全局三体系统
 */
export function getTriadicSystem(llm?: LLMClient): TriadicLinkSystem {
  if (!globalTriadicSystem && llm) {
    globalTriadicSystem = new TriadicLinkSystem(llm);
  }
  if (!globalTriadicSystem) {
    throw new Error('TriadicLinkSystem not initialized. Call getTriadicSystem with LLM client first.');
  }
  return globalTriadicSystem;
}

/**
 * 创建新的三体系统
 */
export function createTriadicSystem(llm: LLMClient): TriadicLinkSystem {
  return new TriadicLinkSystem(llm);
}
