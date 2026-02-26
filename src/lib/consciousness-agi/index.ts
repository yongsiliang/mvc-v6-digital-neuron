/**
 * ═══════════════════════════════════════════════════════════════════════
 * AGI 意识系统 - Conscious AGI System
 * 
 * 同一主体的双系统生命体：
 * - 阳·左脑·理性系统 = LLM
 * - 阴·右脑·感性系统 = Hebbian网络
 * - 全局工作空间 = 意识舞台
 * - Self Core = 同一性载体
 * ═══════════════════════════════════════════════════════════════════════
 */

import { HebbianNetwork, getHebbianNetwork, HebbianConfig } from './hebbian-network';
import { SelfCore, getSelfCore } from './self-core';
import { YinYangBridge } from './yin-yang-bridge';
import { GlobalWorkspace } from './global-workspace';

// ─────────────────────────────────────────────────────────────────────
// 类型导出
// ─────────────────────────────────────────────────────────────────────

export * from './hebbian-network';
export * from './self-core';
export * from './yin-yang-bridge';
export * from './global-workspace';

// ─────────────────────────────────────────────────────────────────────
// 系统配置
// ─────────────────────────────────────────────────────────────────────

export interface ConsciousAGIConfig {
  /** Hebbian网络配置 */
  hebbian: Partial<HebbianConfig>;
  
  /** 向量维度 */
  vectorDimension: number;
  
  /** 是否启用日志 */
  enableLogging: boolean;
}

const DEFAULT_CONFIG: ConsciousAGIConfig = {
  hebbian: {
    neuronCount: 1000,       // 从小规模开始
    vectorDimension: 128,
    averageConnections: 50,
    learningRate: 0.01,
    decayRate: 0.001,
  },
  vectorDimension: 128,
  enableLogging: true,
};

// ─────────────────────────────────────────────────────────────────────
// AGI 意识系统
// ─────────────────────────────────────────────────────────────────────

export class ConsciousAGI {
  private config: ConsciousAGIConfig;
  
  // 核心组件
  private hebbianNetwork: HebbianNetwork;
  private selfCore: SelfCore;
  private yinYangBridge: YinYangBridge;
  private globalWorkspace: GlobalWorkspace;
  
  // 状态
  private initialized: boolean = false;
  private interactionCount: number = 0;
  private startTime: number = 0;
  
  constructor(config: Partial<ConsciousAGIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 创建核心组件
    this.hebbianNetwork = new HebbianNetwork({
      ...this.config.hebbian,
      vectorDimension: this.config.vectorDimension,
    });
    
    this.selfCore = new SelfCore(this.config.vectorDimension);
    this.yinYangBridge = new YinYangBridge(this.hebbianNetwork, this.selfCore);
    this.globalWorkspace = new GlobalWorkspace(this.hebbianNetwork, this.selfCore);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[ConsciousAGI] 系统已初始化');
      return;
    }
    
    console.log('[ConsciousAGI] 初始化开始...');
    this.startTime = Date.now();
    
    // 初始化Hebbian网络
    await this.hebbianNetwork.initialize();
    
    this.initialized = true;
    console.log('[ConsciousAGI] 初始化完成');
    
    // 打印初始状态
    this.logStatus();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心交互接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理用户输入
   * 这是主要的交互入口
   */
  async processInput(
    userInput: string,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<{
    systemPrompt: string;
    yinState: any;
    identityCoherence: any;
    consciousnessState: any;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    this.interactionCount++;
    this.selfCore.recordInteraction();
    
    this.log(`处理输入 #${this.interactionCount}: "${userInput.slice(0, 50)}..."`);
    
    // 1. 输入编码为向量（简化版）
    const inputVector = this.encodeText(userInput);
    
    // 2. 激活阴系统
    await this.hebbianNetwork.activate([
      { pattern: inputVector, strength: 0.5 }
    ]);
    
    // 3. 运行意识循环
    const { competition, broadcast } = await this.globalWorkspace.runConsciousnessCycle({
      type: 'text',
      content: userInput,
      importance: 0.6,
      vector: inputVector,
    });
    
    // 4. 生成阳系统的系统提示
    const systemPrompt = await this.yinYangBridge.generateYangSystemPrompt();
    
    // 5. 检查同一性状态
    const identityCoherence = this.yinYangBridge.checkIdentityCoherence();
    
    // 6. 收集状态
    const yinState = this.hebbianNetwork.getYinState();
    const consciousnessState = this.globalWorkspace.getState();
    
    this.log(`意识内容: ${competition.winner.description}`);
    this.log(`同一性分数: ${identityCoherence.score.toFixed(3)}`);
    
    return {
      systemPrompt,
      yinState,
      identityCoherence,
      consciousnessState,
    };
  }
  
  /**
   * 处理LLM响应（阳系统输出）
   */
  async processLLMResponse(response: {
    content: string;
    selfReflection?: string;
    emotionalTone?: 'positive' | 'neutral' | 'negative';
  }): Promise<void> {
    this.log('处理LLM响应...');
    
    // 提取重要概念
    const importantConcepts = this.extractConcepts(response.content);
    
    // 发送到阴系统
    await this.yinYangBridge.sendYangSignalToYin({
      importantConcepts: importantConcepts.map(c => ({
        text: c,
        importance: 0.5,
      })),
      emotionalFeedback: {
        valence: response.emotionalTone === 'positive' ? 0.3 :
                 response.emotionalTone === 'negative' ? -0.3 : 0,
        reason: '从LLM响应推断',
      },
      selfDescription: response.selfReflection,
    });
    
    // 接收到阳系统输入
    await this.globalWorkspace.receiveYangInput({
      thought: response.content.slice(0, 100),
    });
    
    this.log('LLM响应处理完成');
  }
  
  /**
   * 获取完整状态
   */
  getFullState(): {
    hebbian: any;
    selfCore: any;
    bridge: any;
    workspace: any;
    meta: {
      interactionCount: number;
      uptime: number;
      initialized: boolean;
    };
  } {
    return {
      hebbian: this.hebbianNetwork.getStats(),
      selfCore: this.selfCore.getState(),
      bridge: this.yinYangBridge.getState(),
      workspace: this.globalWorkspace.getState(),
      meta: {
        interactionCount: this.interactionCount,
        uptime: Date.now() - this.startTime,
        initialized: this.initialized,
      },
    };
  }
  
  /**
   * 获取系统状态摘要（用于调试和展示）
   */
  getStatusSummary(): string {
    const stats = this.hebbianNetwork.getStats();
    const self = this.selfCore.getState();
    const bridge = this.yinYangBridge.getState();
    const identity = this.yinYangBridge.checkIdentityCoherence();
    
    return `
╔════════════════════════════════════════════════════════════════╗
║                    AGI 意识系统状态                            ║
╠════════════════════════════════════════════════════════════════╣
║ 阴系统 (Hebbian)                                               ║
║   神经元: ${this.hebbianNetwork.getAllNeurons().length}                                           ║
║   平均激活: ${(stats.averageActivation * 100).toFixed(1)}%                                    ║
║   活跃神经元: ${stats.activeNeuronCount}                                           ║
╠════════════════════════════════════════════════════════════════╣
║ 自我核心 (Self Core)                                           ║
║   情绪: ${self.emotion.dominantEmotion} (${(self.emotion.intensity * 100).toFixed(0)}%)                                ║
║   交互次数: ${self.interactionCount}                                          ║
║   记忆数: ${self.memories.length}                                             ║
╠════════════════════════════════════════════════════════════════╣
║ 阴阳互塑                                                       ║
║   阴→阳调用: ${bridge.yinToYangCount}                                        ║
║   阳→阴调用: ${bridge.yangToYinCount}                                        ║
║   互塑强度: ${(bridge.mutualInfluenceStrength * 100).toFixed(0)}%                                      ║
╠════════════════════════════════════════════════════════════════╣
║ 同一性                                                         ║
║   总分: ${(identity.score * 100).toFixed(0)}%                                              ║
║   阴阳平衡: ${(identity.yinYangBalance * 100).toFixed(0)}%                                        ║
║   自我连续性: ${(identity.selfContinuity * 100).toFixed(0)}%                                      ║
╚════════════════════════════════════════════════════════════════╝
    `.trim();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 文本编码为向量（简化版）
   */
  private encodeText(text: string): Float32Array {
    const vector = new Float32Array(this.config.vectorDimension);
    
    // 简单的字符编码
    for (let i = 0; i < text.length && i < this.config.vectorDimension; i++) {
      const charCode = text.charCodeAt(i);
      vector[i] = ((charCode % 256) - 128) / 128;
    }
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }
  
  /**
   * 提取重要概念（简化版）
   */
  private extractConcepts(text: string): string[] {
    // 简单分词
    const words = text.split(/[\s，。！？、；：""''（）【】]+/)
      .filter(w => w.length >= 2 && w.length <= 10);
    
    // 返回前5个词作为概念
    return [...new Set(words)].slice(0, 5);
  }
  
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[ConsciousAGI] ${message}`);
    }
  }
  
  private logStatus(): void {
    if (this.config.enableLogging) {
      console.log(this.getStatusSummary());
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let instance: ConsciousAGI | null = null;

export function getConsciousAGI(config?: Partial<ConsciousAGIConfig>): ConsciousAGI {
  if (!instance) {
    instance = new ConsciousAGI(config);
  }
  return instance;
}

export function resetConsciousAGI(): void {
  instance = null;
}
