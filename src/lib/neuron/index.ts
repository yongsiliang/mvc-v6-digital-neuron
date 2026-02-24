/**
 * 数字神经元系统 - 主入口
 * Digital Neuron System - Main Entry
 * 
 * 向量决定位置
 * 距离决定关系
 * 分形决定结构
 */

import { NeuralSignal, SubjectiveMeaning, Decision, SelfRepresentation, LogEntry, SystemSnapshot } from './types';
import { getHippocampus, Hippocampus } from './memory';
import { MeaningCore } from './meaning';
import { DecisionCore } from './decision';
import { getSensoryNeuron, getMotorLanguageNeuron, getMotorActionNeuron, SensoryNeuron, MotorLanguageNeuron, MotorActionNeuron } from './sensory';

// 导出类型
export * from './types';
export { Hippocampus, getHippocampus } from './memory';
export { MeaningCore } from './meaning';
export { DecisionCore } from './decision';
export { SensoryNeuron, MotorLanguageNeuron, MotorActionNeuron, getSensoryNeuron, getMotorLanguageNeuron, getMotorActionNeuron } from './sensory';

// 导出博弈引擎
export { LatentGameEngine, type InnerThought, type GameResult } from './latent-game';

// 导出链接强度管理器
export { NeuronLinkManager, getNeuronLinkManager, type NeuronLinkState } from './neuron-link';

// 导出对话上下文
export { ConversationContext, getConversationContext } from './conversation-context';

// 导出空间基础结构
export { 
  type Space, 
  distance, 
  move, 
  wander, 
  nearest, 
  within, 
  createSpace 
} from './space';

// 导出意识空间
export { ConsciousnessSpace, getConsciousness } from './consciousness-space';

// 导出记忆空间
export { MemorySpace, getMemorySpace, type MemoryDoor } from './memory-space-new';

// 导出优化模块
export { 
  EmbeddingManager, 
  getEmbeddingManager, 
  type EmbeddingModel 
} from './embedding-manager';

export { 
  HierarchicalIndex, 
  getHierarchicalIndex,
  type Cluster,
  type IndexedItem,
  type SearchResult 
} from './spatial-index';

export { 
  MemoryDoorManager, 
  getMemoryDoorManager,
  type MemoryDoorV2 
} from './memory-door-manager';

export { 
  MultiModelLLMClient, 
  LLMFactory,
  getLLMClient,
  type ModelConfig,
  type ModelSelectionStrategy 
} from './multi-model-llm';

// 导出主动性系统
export { 
  ProactivitySystem, 
  getProactivitySystem,
  startProactivity,
  type SpontaneousThought,
  type SpontaneousThoughtType,
  type IntrinsicDrive,
  type CuriosityTarget 
} from './proactivity';

/**
 * 数字神经元系统
 * 整合所有神经元模块，实现完整的信息处理流程
 */
export class DigitalNeuronSystem {
  private hippocampus: Hippocampus;
  private meaningCore: MeaningCore;
  private decisionCore: DecisionCore;
  private sensoryNeuron: SensoryNeuron;
  private motorLanguage: MotorLanguageNeuron;
  private motorAction: MotorActionNeuron;
  private logs: LogEntry[] = [];
  private signalPath: string[] = [];

  constructor() {
    this.hippocampus = getHippocampus();
    this.meaningCore = new MeaningCore();
    this.decisionCore = new DecisionCore();
    this.sensoryNeuron = getSensoryNeuron();
    this.motorLanguage = getMotorLanguageNeuron();
    this.motorAction = getMotorActionNeuron();

    this.log('info', '数字神经元系统初始化完成');
  }

  /**
   * 处理用户输入 - 完整流程
   */
  async process(
    userInput: string,
    context?: {
      userId?: string;
      sessionId?: string;
      previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }
  ): Promise<{
    signal: NeuralSignal;
    meaning: SubjectiveMeaning;
    decision: Decision;
    selfUpdate: Partial<SelfRepresentation>;
    promptMessages: Array<{ role: 'system' | 'user'; content: string }>;
    actionCommand: ReturnType<MotorActionNeuron['generateActionCommand']>;
    logs: LogEntry[];
    signalPath: string[];
  }> {
    const startTime = Date.now();
    this.signalPath = [];

    // 1. 感官神经元接收输入
    this.log('info', '感官神经元接收输入');
    this.signalPath.push('sensory');
    const signal = this.sensoryNeuron.receiveInput(userInput, {
      userId: context?.userId,
      sessionId: context?.sessionId
    });

    // 2. 获取当前自我表征
    const self = this.hippocampus.getSelf();

    // 3. 意义三判
    this.log('info', '意义三判开始');
    this.signalPath.push('meaning-anchor');
    this.signalPath.push('memory-associate');
    this.signalPath.push('meaning-generate');
    const meaning = this.meaningCore.process(signal, self);
    this.log('info', '意义三判完成', { meaning });

    // 4. 类脑决策
    this.log('info', '类脑决策开始');
    this.signalPath.push('prefrontal');
    this.signalPath.push('cingulate');
    this.signalPath.push('self-evolve');
    const { decision, selfUpdate } = this.decisionCore.process(signal, meaning, self);
    this.log('info', '类脑决策完成', { decision });

    // 5. 存储记忆
    this.signalPath.push('hippocampus');
    this.hippocampus.storeMemory(signal, meaning, decision);

    // 6. 更新自我表征
    if (Object.keys(selfUpdate).length > 0) {
      this.hippocampus.updateSelf(selfUpdate);
      this.log('info', '自我表征已更新');
    }

    // 7. 生成输出指令
    this.signalPath.push('motor-language');
    const promptMessages = this.motorLanguage.generatePrompt(meaning, decision, self);
    
    // 添加用户消息
    promptMessages.push({ role: 'user', content: userInput });

    // 8. 生成动作指令
    this.signalPath.push('motor-action');
    const actionCommand = this.motorAction.generateActionCommand(decision, meaning);

    const processingTime = Date.now() - startTime;
    this.log('info', '处理完成', { processingTime });

    // 收集所有日志
    const allLogs = this.collectLogs();

    return {
      signal,
      meaning,
      decision,
      selfUpdate,
      promptMessages,
      actionCommand,
      logs: allLogs,
      signalPath: [...this.signalPath]
    };
  }

  /**
   * 获取系统快照
   */
  getSnapshot(): SystemSnapshot {
    return {
      timestamp: Date.now(),
      activeNeuron: this.signalPath[this.signalPath.length - 1] as SystemSnapshot['activeNeuron'],
      signalPath: this.signalPath as SystemSnapshot['signalPath'],
      selfRepresentation: this.hippocampus.getSelf(),
      recentMemories: this.hippocampus.getRecentMemories(10),
      logs: this.logs.slice(-50)
    };
  }

  /**
   * 获取自我表征
   */
  getSelf(): SelfRepresentation {
    return this.hippocampus.getSelf();
  }

  /**
   * 更新自我表征
   */
  updateSelf(update: Partial<SelfRepresentation>): SelfRepresentation {
    return this.hippocampus.updateSelf(update);
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats(): ReturnType<Hippocampus['getStats']> {
    return this.hippocampus.getStats();
  }

  /**
   * 获取最近记忆
   */
  getRecentMemories(limit?: number): ReturnType<Hippocampus['getRecentMemories']> {
    return this.hippocampus.getRecentMemories(limit);
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.hippocampus.clear();
    this.sensoryNeuron.clearBuffer();
    this.logs = [];
    this.signalPath = [];
    this.log('info', '系统已重置');
  }

  /**
   * 收集所有模块日志
   */
  private collectLogs(): LogEntry[] {
    return [
      ...this.logs,
      ...this.meaningCore.getLogs(),
      ...this.decisionCore.getLogs(),
      ...this.hippocampus.getLogs()
    ].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 记录日志
   */
  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'sensory', // 默认，会被调用者覆盖
      level,
      message,
      data
    });
  }
}

// 单例实例
let systemInstance: DigitalNeuronSystem | null = null;

/**
 * 获取系统实例
 */
export function getDigitalNeuronSystem(): DigitalNeuronSystem {
  if (!systemInstance) {
    systemInstance = new DigitalNeuronSystem();
  }
  return systemInstance;
}

/**
 * 重置系统
 */
export function resetDigitalNeuronSystem(): void {
  systemInstance = null;
}
