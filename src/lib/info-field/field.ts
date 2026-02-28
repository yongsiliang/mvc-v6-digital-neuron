/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信息结构场 - 核心
 * 
 * 信息结构在感受器之间流动、变换
 * LLM 变换 = 神经递质传输
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMGateway, type LLMMessage } from '@/lib/neuron-v6/core/llm-gateway';
import { Receptor, createReceptor } from './receptor';
import type {
  InformationStructure,
  InformationType,
  ReceptorType,
  TransmissionChannel,
  TransmissionResult,
  InformationFieldState,
  InformationFieldConfig
} from './types';
import { DEFAULT_FIELD_CONFIG } from './types';

/**
 * 信息结构场
 * 
 * 管理感受器和信息流动
 */
export class InformationField {
  private config: InformationFieldConfig;
  private llm: LLMGateway;
  
  /** 感受器 */
  private receptors: Map<string, Receptor> = new Map();
  
  /** 传输通道 */
  private channels: Map<string, TransmissionChannel> = new Map();
  
  /** 活跃的信息结构 */
  private activeInformation: InformationStructure[] = [];
  
  /** 信息历史 */
  private history: InformationStructure[] = [];
  
  /** 统计 */
  private stats = {
    totalTransmissions: 0,
    createdAt: Date.now()
  };
  
  constructor(config: Partial<InformationFieldConfig> = {}) {
    this.config = { ...DEFAULT_FIELD_CONFIG, ...config };
    this.llm = LLMGateway.getInstance();
    
    // 初始化核心感受器
    this.initializeReceptors();
    
    // 初始化默认通道
    this.initializeChannels();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化感受器
   */
  private initializeReceptors(): void {
    const receptorTypes: ReceptorType[] = [
      'perception', 'thought', 'memory', 'emotion', 'expression'
    ];
    
    for (const type of receptorTypes) {
      const receptor = createReceptor(type, this.llm);
      this.receptors.set(type, receptor);
    }
  }
  
  /**
   * 初始化默认通道
   */
  private initializeChannels(): void {
    // 感知 → 思维
    this.createChannel('perception', 'thought', 0.8);
    
    // 思维 → 记忆
    this.createChannel('thought', 'memory', 0.6);
    
    // 思维 → 情感
    this.createChannel('thought', 'emotion', 0.5);
    
    // 思维 → 表达
    this.createChannel('thought', 'expression', 0.7);
    
    // 记忆 → 思维
    this.createChannel('memory', 'thought', 0.7);
    
    // 情感 → 思维
    this.createChannel('emotion', 'thought', 0.6);
    
    // 情感 → 表达
    this.createChannel('emotion', 'expression', 0.8);
    
    // 意图 → 表达
    this.createChannel('intention', 'expression', 0.9);
  }
  
  /**
   * 创建传输通道
   */
  private createChannel(
    source: string,
    target: string,
    strength: number = 0.5
  ): TransmissionChannel {
    const id = `${source}→${target}`;
    
    const channel: TransmissionChannel = {
      id,
      source,
      target,
      strength,
      transformation: {
        type: 'transform',
        description: `从 ${source} 到 ${target} 的信息传递`
      },
      usageCount: 0,
      lastTransmission: 0
    };
    
    this.channels.set(id, channel);
    return channel;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作：输入 → 处理 → 输出
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 输入信息
   * 
   * 信息进入感知感受器
   */
  input(content: string, type: InformationType = 'perception'): void {
    const info: InformationStructure = {
      id: `input_${Date.now()}`,
      content,
      type,
      intensity: 1.0,
      metadata: {
        source: 'external',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        transformations: []
      }
    };
    
    // 加入活跃信息
    this.activeInformation.push(info);
    
    // 发送到感知感受器
    const receptor = this.receptors.get('perception');
    if (receptor) {
      receptor.receive(info);
    }
  }
  
  /**
   * 处理周期
   * 
   * 信息在感受器之间流动、变换
   */
  async process(): Promise<InformationStructure | null> {
    // 1. 每个感受器处理输入
    for (const [type, receptor] of this.receptors) {
      const output = await receptor.process();
      
      if (output) {
        // 2. 将输出传输到其他感受器
        await this.transmit(type, output);
        
        // 3. 记录历史
        this.history.push(output);
        if (this.history.length > this.config.historyRetention) {
          this.history.shift();
        }
      }
      
      // 4. 衰减活跃度
      receptor.decay(this.config.informationDecayRate);
    }
    
    // 5. 检查表达感受器是否有输出
    const expressionReceptor = this.receptors.get('expression');
    return expressionReceptor?.getOutput() || null;
  }
  
  /**
   * 完整处理流程
   * 
   * 输入 → 多轮处理 → 输出
   */
  async processInput(
    content: string,
    maxCycles: number = 5
  ): Promise<InformationStructure | null> {
    // 输入
    this.input(content);
    
    // 多轮处理
    let output: InformationStructure | null = null;
    for (let i = 0; i < maxCycles; i++) {
      output = await this.process();
      
      // 如果有表达输出，返回
      if (output && output.type === 'response') {
        break;
      }
      
      // 如果没有活跃信息，停止
      const hasActive = Array.from(this.receptors.values())
        .some(r => r.getState().activation > 0.1);
      
      if (!hasActive) {
        break;
      }
    }
    
    return output;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 神经递质传输（LLM 变换）
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 传输信息
   * 
   * 从一个感受器传递到另一个
   * 这个过程就是"神经递质传输"
   * 由 LLM 变换实现
   */
  private async transmit(
    sourceType: string,
    info: InformationStructure
  ): Promise<void> {
    // 找到所有从源出发的通道
    const outgoingChannels = Array.from(this.channels.values())
      .filter(ch => ch.source === sourceType);
    
    for (const channel of outgoingChannels) {
      // 根据通道强度决定是否传输
      if (Math.random() > channel.strength) {
        continue;
      }
      
      // 执行传输（LLM 变换）
      const result = await this.executeTransmission(channel, info);
      
      if (result.success) {
        // 更新通道统计
        channel.usageCount++;
        channel.lastTransmission = Date.now();
        
        // 强化通道
        channel.strength = Math.min(
          1,
          channel.strength + this.config.channelStrengthenRate
        );
        
        // 发送到目标感受器
        const targetReceptor = this.receptors.get(channel.target);
        if (targetReceptor) {
          targetReceptor.receive(result.transformed);
        }
        
        this.stats.totalTransmissions++;
      }
    }
  }
  
  /**
   * 执行传输
   * 
   * LLM 变换 = 神经递质传递
   * 信息结构在传输过程中被变换
   */
  private async executeTransmission(
    channel: TransmissionChannel,
    info: InformationStructure
  ): Promise<TransmissionResult> {
    const startTime = Date.now();
    
    try {
      // LLM 变换
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `你是从 ${channel.source} 感受器到 ${channel.target} 感受器的信息传输通道。
信息在传输过程中会被变换。保持信息的核心意义，但调整表述以适应目标感受器。`
        },
        {
          role: 'user',
          content: info.content
        }
      ];
      
      const response = await this.llm.chat(messages);
      
      // 创建变换后的信息
      const transformed: InformationStructure = {
        id: `info_${Date.now()}`,
        content: response.content,
        type: info.type,
        intensity: info.intensity * channel.strength,
        embedding: info.embedding,
        metadata: {
          ...info.metadata,
          source: channel.source,
          modifiedAt: Date.now(),
          transformations: [
            ...info.metadata.transformations,
            `${channel.source}→${channel.target}`
          ]
        }
      };
      
      return {
        success: true,
        original: info,
        transformed,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        original: info,
        transformed: info,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态与查询
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取状态
   */
  getState(): InformationFieldState {
    const receptors = new Map<string, ReturnType<Receptor['getState']>>();
    for (const [id, receptor] of this.receptors) {
      receptors.set(id, receptor.getState());
    }
    
    return {
      receptors,
      channels: new Map(this.channels),
      activeInformation: [...this.activeInformation],
      informationHistory: [...this.history],
      createdAt: this.stats.createdAt,
      totalTransmissions: this.stats.totalTransmissions
    };
  }
  
  /**
   * 获取感受器状态
   */
  getReceptorState(type: ReceptorType): ReturnType<Receptor['getState']> | null {
    const receptor = this.receptors.get(type);
    return receptor ? receptor.getState() : null;
  }
  
  /**
   * 获取通道强度
   */
  getChannelStrength(source: string, target: string): number {
    const channel = this.channels.get(`${source}→${target}`);
    return channel?.strength || 0;
  }
  
  /**
   * 获取统计
   */
  getStats(): {
    totalTransmissions: number;
    activeInformation: number;
    historySize: number;
    channelCount: number;
    receptorCount: number;
    uptime: number;
  } {
    return {
      totalTransmissions: this.stats.totalTransmissions,
      activeInformation: this.activeInformation.length,
      historySize: this.history.length,
      channelCount: this.channels.size,
      receptorCount: this.receptors.size,
      uptime: Date.now() - this.stats.createdAt
    };
  }
  
  /**
   * 导出网络拓扑（用于可视化）
   */
  getNetworkTopology(): {
    nodes: Array<{ id: string; type: string; activation: number }>;
    edges: Array<{ 
      source: string; 
      target: string; 
      strength: number; 
      usageCount: number 
    }>;
  } {
    const nodes = Array.from(this.receptors.entries()).map(([id, receptor]) => ({
      id,
      type: receptor.getState().type,
      activation: receptor.getState().activation
    }));
    
    const edges = Array.from(this.channels.values()).map(channel => ({
      source: channel.source,
      target: channel.target,
      strength: channel.strength,
      usageCount: channel.usageCount
    }));
    
    return { nodes, edges };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 维护
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 衰减所有通道
   */
  decayChannels(): void {
    for (const channel of this.channels.values()) {
      channel.strength *= (1 - this.config.channelDecayRate);
      
      // 移除过弱的通道
      if (channel.strength < 0.1 && channel.usageCount < 5) {
        this.channels.delete(channel.id);
      }
    }
  }
  
  /**
   * 重置
   */
  reset(): void {
    for (const receptor of this.receptors.values()) {
      receptor.reset();
    }
    
    this.activeInformation = [];
    this.history = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建信息场
 */
export function createInformationField(
  config?: Partial<InformationFieldConfig>
): InformationField {
  return new InformationField(config);
}
