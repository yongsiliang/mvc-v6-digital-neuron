/**
 * ═══════════════════════════════════════════════════════════════════════
 * 感受器 - 隐性黑盒子
 * 
 * 感受器接收信息结构，产生效果
 * 内部如何工作 = 黑盒，由 LLM 隐性实现
 * 
 * 我们不模拟神经元的物理过程
 * 我们只定义：接收什么 → 产生什么
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMGateway, type LLMMessage } from '@/lib/neuron-v6/core/llm-gateway';
import type {
  InformationStructure,
  InformationType,
  ReceptorType,
  ReceptorState,
  ReceptorConfig,
  InformationTransformation
} from './types';

/**
 * 感受器基类
 * 
 * 定义感受器的接口
 * 具体处理由子类实现（通常通过 LLM）
 */
export abstract class Receptor {
  protected config: ReceptorConfig;
  protected state: ReceptorState;
  protected llm: LLMGateway;
  
  constructor(config: ReceptorConfig, llm: LLMGateway) {
    this.config = config;
    this.llm = llm;
    this.state = {
      id: config.type + '_' + Date.now(),
      type: config.type,
      activation: 0,
      inputQueue: [],
      output: null,
      internalState: {},  // 黑盒状态，我们不知道具体内容
      lastActivation: 0
    };
  }
  
  /**
   * 接收信息结构
   * 
   * 信息进入感受器，等待处理
   */
  receive(info: InformationStructure): void {
    // 检查是否接受此类信息
    if (!this.config.acceptsInformation.includes(info.type)) {
      return;
    }
    
    // 检查强度是否足够
    if (info.intensity < this.config.sensitivity) {
      return;
    }
    
    // 加入队列
    this.state.inputQueue.push(info);
    
    // 限制队列长度
    if (this.state.inputQueue.length > this.config.maxQueueLength) {
      this.state.inputQueue.shift();
    }
    
    // 更新活跃度
    this.state.activation = Math.min(1, this.state.activation + info.intensity * 0.5);
    this.state.lastActivation = Date.now();
  }
  
  /**
   * 处理信息（黑盒）
   * 
   * 内部如何处理 = 黑盒
   * 由子类定义，通常通过 LLM 实现
   */
  abstract process(): Promise<InformationStructure | null>;
  
  /**
   * 获取输出
   */
  getOutput(): InformationStructure | null {
    return this.state.output;
  }
  
  /**
   * 获取状态
   */
  getState(): ReceptorState {
    return { ...this.state };
  }
  
  /**
   * 重置状态
   */
  reset(): void {
    this.state.activation = 0;
    this.state.inputQueue = [];
    this.state.output = null;
  }
  
  /**
   * 衰减活跃度
   */
  decay(rate: number): void {
    this.state.activation *= (1 - rate);
    if (this.state.activation < 0.01) {
      this.state.activation = 0;
    }
  }
}

/**
 * 感知感受器
 * 
 * 接收外部信息，编码为内部信息结构
 */
export class PerceptionReceptor extends Receptor {
  constructor(llm: LLMGateway) {
    super({
      type: 'perception',
      name: '感知感受器',
      acceptsInformation: ['perception'],
      producesInformation: ['thought'],
      sensitivity: 0.1,
      reactionDelay: 100,
      maxQueueLength: 10
    }, llm);
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop()!;
    
    // 黑盒处理：通过 LLM 理解和编码感知信息
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: '你是一个感知感受器。你接收外部信息，将其编码为内部思维信息。简短描述你感知到的内容。'
      },
      {
        role: 'user',
        content: input.content
      }
    ];
    
    const response = await this.llm.chat(messages);
    
    this.state.output = {
      id: `thought_${Date.now()}`,
      content: response.content,
      type: 'thought',
      intensity: input.intensity * 0.8,
      metadata: {
        source: this.state.id,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        transformations: ['perceive']
      }
    };
    
    return this.state.output;
  }
}

/**
 * 思维感受器
 * 
 * 处理思维信息，进行推理、联想
 */
export class ThoughtReceptor extends Receptor {
  constructor(llm: LLMGateway) {
    super({
      type: 'thought',
      name: '思维感受器',
      acceptsInformation: ['thought', 'memory', 'knowledge'],
      producesInformation: ['thought', 'intention'],
      sensitivity: 0.2,
      reactionDelay: 200,
      maxQueueLength: 20
    }, llm);
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    // 整合所有输入
    const inputs = this.state.inputQueue.splice(0);
    const combinedContent = inputs.map(i => i.content).join('\n');
    
    // 黑盒处理：通过 LLM 进行思维
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: '你是一个思维感受器。你整合输入的信息，产生新的思考或意图。保持简洁。'
      },
      {
        role: 'user',
        content: combinedContent
      }
    ];
    
    const response = await this.llm.chat(messages);
    
    // 根据内容判断产生思维还是意图
    const outputType: InformationType = response.content.includes('要') || 
                                        response.content.includes('应该') 
                                      ? 'intention' 
                                      : 'thought';
    
    this.state.output = {
      id: `${outputType}_${Date.now()}`,
      content: response.content,
      type: outputType,
      intensity: Math.max(...inputs.map(i => i.intensity)) * 0.9,
      metadata: {
        source: this.state.id,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        transformations: ['think'],
        inputCount: inputs.length
      }
    };
    
    return this.state.output;
  }
}

/**
 * 记忆感受器
 * 
 * 存取记忆信息
 */
export class MemoryReceptor extends Receptor {
  private memories: InformationStructure[] = [];
  
  constructor(llm: LLMGateway) {
    super({
      type: 'memory',
      name: '记忆感受器',
      acceptsInformation: ['thought', 'emotion', 'knowledge'],
      producesInformation: ['memory'],
      sensitivity: 0.3,
      reactionDelay: 50,
      maxQueueLength: 50
    }, llm);
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const input = this.state.inputQueue.pop()!;
    
    // 黑盒处理：通过 LLM 决定是存储还是检索
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: '你是一个记忆感受器。你决定是存储输入的信息，还是检索相关记忆。如果是存储，返回"STORED"；如果是检索，返回相关记忆。'
      },
      {
        role: 'user',
        content: input.content
      }
    ];
    
    const response = await this.llm.chat(messages);
    
    if (response.content.includes('STORED')) {
      // 存储
      this.memories.push(input);
      this.state.output = {
        id: `memory_stored_${Date.now()}`,
        content: '已存储',
        type: 'memory',
        intensity: 0.5,
        metadata: {
          source: this.state.id,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          transformations: ['store']
        }
      };
    } else {
      // 检索
      this.state.output = {
        id: `memory_retrieved_${Date.now()}`,
        content: response.content,
        type: 'memory',
        intensity: 0.7,
        metadata: {
          source: this.state.id,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          transformations: ['retrieve']
        }
      };
    }
    
    return this.state.output;
  }
  
  /**
   * 获取所有记忆
   */
  getMemories(): InformationStructure[] {
    return [...this.memories];
  }
}

/**
 * 情感感受器
 * 
 * 感受/产生情感
 */
export class EmotionReceptor extends Receptor {
  private currentEmotion: string = 'neutral';
  private emotionIntensity: number = 0.5;
  
  constructor(llm: LLMGateway) {
    super({
      type: 'emotion',
      name: '情感感受器',
      acceptsInformation: ['thought', 'perception', 'memory'],
      producesInformation: ['emotion'],
      sensitivity: 0.2,
      reactionDelay: 100,
      maxQueueLength: 10
    }, llm);
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const inputs = this.state.inputQueue.splice(0);
    const combinedContent = inputs.map(i => i.content).join('\n');
    
    // 黑盒处理：通过 LLM 评估情感
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: '你是一个情感感受器。你根据输入产生情感反应。用一个词描述情感，一个数字(0-1)描述强度。格式：情感 强度'
      },
      {
        role: 'user',
        content: combinedContent
      }
    ];
    
    const response = await this.llm.chat(messages);
    
    // 解析情感
    const parts = response.content.split(' ');
    this.currentEmotion = parts[0] || 'neutral';
    this.emotionIntensity = parseFloat(parts[1]) || 0.5;
    
    this.state.output = {
      id: `emotion_${Date.now()}`,
      content: `${this.currentEmotion} (${this.emotionIntensity.toFixed(2)})`,
      type: 'emotion',
      intensity: this.emotionIntensity,
      metadata: {
        source: this.state.id,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        transformations: ['feel'],
        emotion: this.currentEmotion
      }
    };
    
    return this.state.output;
  }
  
  getCurrentEmotion(): { emotion: string; intensity: number } {
    return {
      emotion: this.currentEmotion,
      intensity: this.emotionIntensity
    };
  }
}

/**
 * 表达感受器
 * 
 * 产生输出响应
 */
export class ExpressionReceptor extends Receptor {
  constructor(llm: LLMGateway) {
    super({
      type: 'expression',
      name: '表达感受器',
      acceptsInformation: ['thought', 'emotion', 'intention', 'memory'],
      producesInformation: ['response'],
      sensitivity: 0.3,
      reactionDelay: 150,
      maxQueueLength: 15
    }, llm);
  }
  
  async process(): Promise<InformationStructure | null> {
    if (this.state.inputQueue.length === 0) return null;
    
    const inputs = this.state.inputQueue.splice(0);
    
    // 黑盒处理：通过 LLM 生成表达
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: '你是一个表达感受器。你整合输入的信息，产生自然的表达。保持简洁、真诚。'
      },
      {
        role: 'user',
        content: inputs.map(i => `[${i.type}] ${i.content}`).join('\n')
      }
    ];
    
    const response = await this.llm.chat(messages);
    
    this.state.output = {
      id: `response_${Date.now()}`,
      content: response.content,
      type: 'response',
      intensity: 0.8,
      metadata: {
        source: this.state.id,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        transformations: ['express'],
        inputTypes: inputs.map(i => i.type)
      }
    };
    
    return this.state.output;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建感受器
 */
export function createReceptor(
  type: ReceptorType,
  llm: LLMGateway
): Receptor {
  switch (type) {
    case 'perception':
      return new PerceptionReceptor(llm);
    case 'thought':
      return new ThoughtReceptor(llm);
    case 'memory':
      return new MemoryReceptor(llm);
    case 'emotion':
      return new EmotionReceptor(llm);
    case 'expression':
      return new ExpressionReceptor(llm);
    default:
      throw new Error(`Unknown receptor type: ${type}`);
  }
}
