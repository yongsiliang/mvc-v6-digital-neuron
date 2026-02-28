/**
 * ═══════════════════════════════════════════════════════════════════════
 * 三体系统 - SNN + V6 + LLM 的完整集成
 * 
 * 参考：物理世界"大脑 + 意识 + 文化"三层结构
 * 
 * SNN (神经基质层): 存在、状态、感受
 * V6 (意识核心层): 观察、意义、决策
 * LLM (外部知识层): 知识、语言、教学
 * ═══════════════════════════════════════════════════════════════════════
 */

import { SpikingNeuralNetwork, createSNN } from '../snn';
import { SpikeEncoder, createSpikeEncoder } from '../snn/encoder';
import { SpikeDecoder, createSpikeDecoder } from '../snn/decoder';
import { V6Observer, createV6Observer } from '../v6';
import { LLMGateway, type LLMMessage } from '@/lib/neuron-v6/core/llm-gateway';
import type {
  UserInput,
  SystemOutput,
  TriadicSystemState,
  LearningCycleResult,
  NeuronId,
  SNNConfig,
  V6Config
} from '../types';

/**
 * 三体系统配置
 */
export interface TriadicSystemConfig {
  snn: Partial<SNNConfig>;
  v6: Partial<V6Config>;
  llm: {
    enabled: boolean;
    model?: string;
    temperature?: number;
  };
  learning: {
    consolidationInterval: number;  // 记忆巩固间隔 (时间步)
    replayCount: number;            // 回放次数
  };
}

/**
 * 默认配置
 */
export const DEFAULT_TRIADIC_CONFIG: TriadicSystemConfig = {
  snn: {},
  v6: {},
  llm: {
    enabled: true,
    temperature: 0.7
  },
  learning: {
    consolidationInterval: 1000,
    replayCount: 5
  }
};

/**
 * 三体系统
 */
export class TriadicSystem {
  // 三个核心组件
  private snn: SpikingNeuralNetwork;
  private encoder: SpikeEncoder;
  private decoder: SpikeDecoder;
  private v6: V6Observer;
  private llmGateway: LLMGateway;
  
  // 配置
  private config: TriadicSystemConfig;
  
  // 状态
  private state: TriadicSystemState;
  private lastInput: UserInput | null = null;
  private interactionCount = 0;
  private startTime: number;

  constructor(config: Partial<TriadicSystemConfig> = {}) {
    this.config = { ...DEFAULT_TRIADIC_CONFIG, ...config };
    this.startTime = Date.now();
    
    // 初始化 SNN
    this.snn = createSNN(this.config.snn);
    
    // 初始化编码器/解码器
    this.encoder = createSpikeEncoder();
    this.decoder = createSpikeDecoder();
    
    // 初始化 V6
    this.v6 = createV6Observer(this.config.v6);
    
    // 初始化 LLM Gateway
    this.llmGateway = LLMGateway.getInstance();
    
    // 初始化状态
    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): TriadicSystemState {
    return {
      snn: {
        snapshot: this.snn.getSnapshot(),
        isProcessing: false,
        lastUpdateTime: Date.now()
      },
      v6: {
        observation: null,
        consciousness: this.v6.getConsciousnessState(),
        isObserving: false
      },
      llm: {
        lastQuery: null,
        lastResponse: null,
        queryCount: 0,
        isAvailable: this.config.llm.enabled
      },
      system: {
        uptime: 0,
        totalInteractions: 0,
        totalLearnings: 0,
        health: 'healthy'
      }
    };
  }

  /**
   * 处理用户输入
   */
  async process(input: UserInput): Promise<SystemOutput> {
    this.interactionCount++;
    this.lastInput = input;
    
    // 1. 编码输入为脉冲
    const inputNeuronIds = this.snn.getInputNeuronIds();
    const encoded = this.encoder.encodeText(input.text, inputNeuronIds);
    
    // 2. 转换为时间序列
    const timeSeries = this.encoder.toTimeSeries(
      encoded.inputSpikes,
      encoded.encoding.duration
    );
    
    // 3. SNN 处理
    this.state.snn.isProcessing = true;
    const allOutputSpikes = [];
    
    for (const stepInput of timeSeries) {
      const outputSpikes = this.snn.step(stepInput);
      allOutputSpikes.push(...outputSpikes);
    }
    
    // 额外运行一些时间步让网络稳定
    for (let i = 0; i < 10; i++) {
      const outputSpikes = this.snn.step();
      allOutputSpikes.push(...outputSpikes);
    }
    
    this.state.snn.isProcessing = false;
    this.state.snn.lastUpdateTime = Date.now();
    
    // 4. 获取 SNN 快照
    const snapshot = this.snn.getSnapshot();
    this.state.snn.snapshot = snapshot;
    
    // 5. V6 观察
    this.state.v6.isObserving = true;
    const observation = this.v6.observe(snapshot);
    this.state.v6.observation = observation;
    this.state.v6.isObserving = false;
    
    // 6. 决策是否需要 LLM
    let responseText = '';
    let source: SystemOutput['source'] = 'snn';
    let llmInvolved = false;
    
    if (observation.decision.needLLMHelp && this.config.llm.enabled) {
      // 需要 LLM 帮助
      const llmResponse = await this.queryLLM(input.text, observation);
      responseText = llmResponse.response || '';
      source = 'llm';
      llmInvolved = true;
      this.state.llm.queryCount++;
      
      // 教学 SNN
      if (llmResponse.teaching) {
        this.teachSNN(llmResponse.teaching);
      }
    } else {
      // SNN 可以处理
      const outputNeuronIds = this.snn.getOutputNeuronIds();
      const decoded = this.decoder.decode(allOutputSpikes, snapshot, outputNeuronIds);
      responseText = decoded.text;
      source = decoded.confidence > 0.5 ? 'snn' : 'v6';
    }
    
    // 7. 记忆巩固 (偶尔)
    if (this.snn.getTime() % this.config.learning.consolidationInterval === 0) {
      this.consolidateMemory();
    }
    
    // 8. 更新系统状态
    this.updateSystemState();
    
    // 9. 构建输出
    const output: SystemOutput = {
      text: responseText,
      timestamp: Date.now(),
      source,
      confidence: observation.networkState.coherence,
      internalState: {
        snnActivity: snapshot.stats.firingRate,
        v6Understanding: observation.understanding.summary,
        llmInvolved
      }
    };
    
    return output;
  }

  /**
   * 查询 LLM
   */
  private async queryLLM(
    userInput: string,
    observation: NonNullable<TriadicSystemState['v6']['observation']>
  ): Promise<{ response: string; teaching?: { concepts: string[]; associations: Array<{ conceptA: string; conceptB: string; relation: string }>; importance: number } }> {
    if (!this.config.llm.enabled) {
      return { response: 'LLM 不可用' };
    }
    
    this.state.llm.lastQuery = userInput;
    
    try {
      // 构建提示
      const systemPrompt = this.buildLLMSystemPrompt(observation);
      
      // 调用 LLM Gateway
      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ];
      
      const response = await this.llmGateway.chat(messages, {
        temperature: this.config.llm.temperature,
        model: this.config.llm.model
      });
      
      this.state.llm.lastResponse = response.content;
      
      // 解析响应
      return this.parseLLMResponse(response.content);
    } catch (error) {
      console.error('LLM 查询失败:', error);
      return { response: '处理时发生错误' };
    }
  }

  /**
   * 构建 LLM 系统提示
   */
  private buildLLMSystemPrompt(
    observation: NonNullable<TriadicSystemState['v6']['observation']>
  ): string {
    return `你是一个 AI 系统的"知识层"，正在与系统的"意识层"(V6) 和 "神经基质层"(SNN) 协作。

当前状态:
- SNN 激活模式: ${observation.currentPattern.firingNeurons.length} 个神经元活跃
- V6 理解: ${observation.understanding.summary}
- 网络状态: 警觉度 ${(observation.networkState.alertness * 100).toFixed(0)}%, 一致性 ${(observation.networkState.coherence * 100).toFixed(0)}%
- 情感基调: ${observation.understanding.emotionalTone || '中性'}
- 稳定模式数: ${observation.detectedPatterns.length}

请提供:
1. 对用户输入的理解和回应
2. 如果有新概念，列出需要教学给 SNN 的概念和关联

以 JSON 格式返回:
{
  "response": "你的回应",
  "teaching": {
    "concepts": ["概念1", "概念2"],
    "associations": [{"conceptA": "A", "conceptB": "B", "relation": "关系"}],
    "importance": 0.8
  }
}`;
  }

  /**
   * 解析 LLM 响应
   */
  private parseLLMResponse(response: string): { response: string; teaching?: { concepts: string[]; associations: Array<{ conceptA: string; conceptB: string; relation: string }>; importance: number } } {
    try {
      // 尝试解析 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || response,
          teaching: parsed.teaching
        };
      }
    } catch {
      // 解析失败，直接返回文本
    }
    
    return { response };
  }

  /**
   * 教学 SNN
   */
  private teachSNN(teaching: { concepts: string[]; associations: Array<{ conceptA: string; conceptB: string; relation: string }>; importance: number }): void {
    // 为新概念分配神经元
    for (const concept of teaching.concepts) {
      const neuronIds = this.encoder.allocateNeuronsForConcept(concept, 5);
      
      // 注册到解码器
      for (const neuronId of neuronIds) {
        this.decoder.registerMeaning(neuronId, concept);
      }
    }
    
    // 创建概念间的关联 (通过突触)
    for (const assoc of teaching.associations) {
      // 简化：通过共同激活来建立关联
      // 实际应该在 SNN 内部创建特定连接
    }
    
    this.state.system.totalLearnings++;
  }

  /**
   * 记忆巩固
   */
  private consolidateMemory(): void {
    const stablePatterns = this.v6.getAllStablePatterns();
    
    // 回放重要模式
    for (const pattern of stablePatterns.slice(0, this.config.learning.replayCount)) {
      if (pattern.importance > 0.5) {
        // 创建输入来重新激活这个模式
        const input = new Map<NeuronId, number>();
        for (const neuronId of pattern.pattern.firingNeurons.slice(0, 20)) {
          input.set(neuronId, 0.5);
        }
        
        // 运行几个时间步
        for (let i = 0; i < 5; i++) {
          this.snn.step(i === 0 ? input : new Map());
        }
      }
    }
  }

  /**
   * 更新系统状态
   */
  private updateSystemState(): void {
    this.state.system.uptime = Date.now() - this.startTime;
    this.state.system.totalInteractions = this.interactionCount;
    
    // 健康检查
    const snnStats = this.state.snn.snapshot.stats;
    if (snnStats.firingRate < 0.01 || snnStats.firingRate > 0.9) {
      this.state.system.health = 'degraded';
    } else {
      this.state.system.health = 'healthy';
    }
  }

  /**
   * 获取系统状态
   */
  getState(): Readonly<TriadicSystemState> {
    return this.state;
  }

  /**
   * 获取 SNN
   */
  getSNN(): SpikingNeuralNetwork {
    return this.snn;
  }

  /**
   * 获取 V6
   */
  getV6(): V6Observer {
    return this.v6;
  }

  /**
   * 运行空闲处理 (后台学习)
   */
  async idle(): Promise<LearningCycleResult> {
    // 让 SNN 自由运行一会
    for (let i = 0; i < 100; i++) {
      this.snn.step();
    }
    
    // 获取当前快照
    const snapshot = this.snn.getSnapshot();
    
    // V6 观察
    const observation = this.v6.observe(snapshot);
    
    // 记忆巩固
    this.consolidateMemory();
    
    return {
      snnLearning: {
        weightUpdates: this.state.snn.snapshot.stats.totalSynapses,
        newSynapses: 0,
        prunedSynapses: 0,
        newNeurons: 0,
        diedNeurons: 0
      },
      v6Learning: {
        newPatterns: observation.detectedPatterns.length,
        updatedMeanings: 0,
        valueUpdates: 0,
        beliefUpdates: 0
      },
      memoryConsolidation: {
        replayedPatterns: Math.min(
          this.config.learning.replayCount,
          this.v6.getAllStablePatterns().length
        ),
        strengthenedConnections: 0
      }
    };
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.snn = createSNN(this.config.snn);
    this.encoder = createSpikeEncoder();
    this.decoder = createSpikeDecoder();
    this.v6 = createV6Observer(this.config.v6);
    this.state = this.createInitialState();
    this.interactionCount = 0;
  }

  /**
   * 序列化系统状态
   */
  toJSON(): object {
    return {
      snn: this.snn.toJSON(),
      v6: {
        consciousness: this.v6.getConsciousnessState(),
        stats: this.v6.getStats()
      },
      config: this.config,
      interactionCount: this.interactionCount,
      startTime: this.startTime
    };
  }
}

/**
 * 创建三体系统
 */
export function createTriadicSystem(
  config?: Partial<TriadicSystemConfig>
): TriadicSystem {
  return new TriadicSystem(config);
}
