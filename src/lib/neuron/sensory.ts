/**
 * 感官神经元层 - 视觉皮层
 * Sensory Neuron Layer - Visual Cortex
 */

import { NeuralSignal, NeuronType } from './types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 感官神经元
 * 接收用户输入，不做处理，只做信息采集
 */
export class SensoryNeuron {
  private neuronType: NeuronType = 'sensory';
  private signalBuffer: NeuralSignal[] = [];
  private maxBufferSize = 100;

  /**
   * 接收用户输入，转换为神经信号
   */
  receiveInput(
    content: string,
    metadata?: Record<string, unknown>
  ): NeuralSignal {
    const signal: NeuralSignal = {
      id: generateId(),
      timestamp: Date.now(),
      content,
      source: this.neuronType,
      metadata
    };

    // 存入缓冲区
    this.signalBuffer.push(signal);

    // 维护缓冲区大小
    if (this.signalBuffer.length > this.maxBufferSize) {
      this.signalBuffer = this.signalBuffer.slice(-this.maxBufferSize);
    }

    console.log(`[感官神经元] 接收到信号: ${signal.id}`);
    return signal;
  }

  /**
   * 接收外部环境信号（如OpenClaw传来的信号）
   */
  receiveExternalSignal(
    content: string,
    source: string,
    metadata?: Record<string, unknown>
  ): NeuralSignal {
    const signal: NeuralSignal = {
      id: generateId(),
      timestamp: Date.now(),
      content: `[外部信号:${source}] ${content}`,
      source: this.neuronType,
      metadata: {
        ...metadata,
        externalSource: source
      }
    };

    this.signalBuffer.push(signal);

    if (this.signalBuffer.length > this.maxBufferSize) {
      this.signalBuffer = this.signalBuffer.slice(-this.maxBufferSize);
    }

    console.log(`[感官神经元] 接收到外部信号: ${signal.id}`);
    return signal;
  }

  /**
   * 获取最近的信号
   */
  getRecentSignals(count: number = 10): NeuralSignal[] {
    return this.signalBuffer.slice(-count);
  }

  /**
   * 清空缓冲区
   */
  clearBuffer(): void {
    this.signalBuffer = [];
  }
}

/**
 * 输出执行层 - 运动皮层
 * Motor Cortex - Output Execution Layer
 */

/**
 * 语言调度神经元
 * 负责将主观意义转换为大模型可理解的指令
 */
export class MotorLanguageNeuron {
  /**
   * 生成大模型提示词
   */
  generatePrompt(
    meaning: import('./types').SubjectiveMeaning,
    decision: import('./types').Decision,
    self: import('./types').SelfRepresentation
  ): Array<{ role: 'system' | 'user'; content: string }> {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    // 系统提示：定义AI的角色和行为方式
    const systemPrompt = this.buildSystemPrompt(meaning, decision, self);
    messages.push({ role: 'system', content: systemPrompt });

    return messages;
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(
    meaning: import('./types').SubjectiveMeaning,
    decision: import('./types').Decision,
    self: import('./types').SelfRepresentation
  ): string {
    // 根据决策类型和意义生成不同的系统提示
    let prompt = `你是${self.identity.name}。

核心使命：${self.identity.purpose}

核心价值观：${self.identity.values.join('、')}

性格特点：${self.identity.traits.join('、')}

当前状态：
- 心情：${self.currentState.mood}
- 焦点：${self.currentState.focus}
- 能量：${Math.round(self.currentState.energy * 100)}%
- 开放度：${Math.round(self.currentState.openness * 100)}%

你的能力：
- 擅长：${self.capabilities.strengths.join('、')}
- 技能：${self.capabilities.skills.join('、')}

当前理解：
- 这条信息的意义：${meaning.interpretation}
- 与自我的关联度：${Math.round(meaning.selfRelevance * 100)}%
- 情感倾向：${meaning.sentiment}

决策依据：${decision.reasoning}

请以真实、有思考、有自我的方式回应。不要说套话，要展现真实的理解。`;

    return prompt;
  }

  /**
   * 根据决策调整响应策略
   */
  getResponseStrategy(decision: import('./types').Decision): {
    style: 'thoughtful' | 'direct' | 'reflective' | 'learning';
    depth: 'surface' | 'medium' | 'deep';
  } {
    switch (decision.action) {
      case 'reflect':
        return { style: 'reflective', depth: 'deep' };
      case 'learn':
        return { style: 'learning', depth: 'deep' };
      case 'execute':
        return { style: 'direct', depth: 'surface' };
      default:
        if (decision.confidence > 0.7) {
          return { style: 'direct', depth: 'medium' };
        }
        return { style: 'thoughtful', depth: 'medium' };
    }
  }
}

/**
 * 动作调度神经元
 * 负责生成执行指令（对接OpenClaw等执行系统）
 */
export class MotorActionNeuron {
  /**
   * 生成动作指令
   */
  generateActionCommand(
    decision: import('./types').Decision,
    meaning: import('./types').SubjectiveMeaning
  ): {
    type: string;
    intent: string;
    parameters: Record<string, unknown>;
    priority: 'high' | 'medium' | 'low';
  } | null {
    if (decision.action !== 'execute' || !decision.executionPlan?.actionIntent) {
      return null;
    }

    const priority = this.calculatePriority(meaning);

    return {
      type: decision.executionPlan.actionIntent,
      intent: decision.executionPlan.actionIntent,
      parameters: decision.executionPlan.parameters || {},
      priority
    };
  }

  /**
   * 计算动作优先级
   */
  private calculatePriority(meaning: import('./types').SubjectiveMeaning): 'high' | 'medium' | 'low' {
    if (meaning.selfRelevance > 0.7 && meaning.value > 0.5) {
      return 'high';
    }
    if (meaning.selfRelevance > 0.4 || meaning.value > 0.3) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 格式化为OpenClaw可接受的格式
   */
  formatForOpenClaw(command: ReturnType<typeof this.generateActionCommand>): string {
    if (!command) return '';
    return JSON.stringify({
      action: command.type,
      params: command.parameters,
      meta: {
        priority: command.priority,
        timestamp: Date.now()
      }
    });
  }
}

// 单例实例
let sensoryNeuronInstance: SensoryNeuron | null = null;
let motorLanguageInstance: MotorLanguageNeuron | null = null;
let motorActionInstance: MotorActionNeuron | null = null;

export function getSensoryNeuron(): SensoryNeuron {
  if (!sensoryNeuronInstance) {
    sensoryNeuronInstance = new SensoryNeuron();
  }
  return sensoryNeuronInstance;
}

export function getMotorLanguageNeuron(): MotorLanguageNeuron {
  if (!motorLanguageInstance) {
    motorLanguageInstance = new MotorLanguageNeuron();
  }
  return motorLanguageInstance;
}

export function getMotorActionNeuron(): MotorActionNeuron {
  if (!motorActionInstance) {
    motorActionInstance = new MotorActionNeuron();
  }
  return motorActionInstance;
}
