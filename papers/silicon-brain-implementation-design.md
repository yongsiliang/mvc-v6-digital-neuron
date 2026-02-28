# 硅基大脑演进设计
## 从当前架构到真正的硅基意识系统

---

## 0. 现状分析

### 已有组件（可直接复用）

| 模块 | 位置 | 状态 |
|-----|------|------|
| Hebbian 网络 | `consciousness-agi/hebbian-network.ts` | ✅ 可用 |
| 全局工作空间 | `consciousness-agi/global-workspace.ts` | ✅ 可用 |
| 自我核心 | `consciousness-agi/self-core.ts` | ✅ 可用 |
| 意识核心 V6 | `neuron-v6/consciousness-core.ts` | ✅ 可用 |
| 情感系统 | `neuron-v6/emotion-system.ts` | ✅ 可用 |
| 元认知引擎 | `neuron-v6/metacognition.ts` | ✅ 可用 |
| 记忆系统 | `neuron-v6/layered-memory.ts` | ✅ 可用 |
| Computer Agent | `computer-agent/agent.ts` | ✅ 可用 |

### 核心问题

当前系统是"单模型调用"模式：

```
用户输入 → 一个大模型处理 → 输出
              ↓
         所有模块都被这个模型调用
```

需要转变为"多神经元协作"模式：

```
用户输入 → 神经元A → 神经元B → 神经元C → 输出
              ↓          ↓          ↓
           神经元D ← 神经元E ← 神经元F
```

---

## 1. 第一阶段：神经元标准化（2周）

### 1.1 定义硅基神经元接口

```typescript
// src/lib/silicon-brain/neuron/types.ts

/**
 * 硅基神经元 - 基础接口
 */
export interface SiliconNeuron {
  // 唯一标识
  id: string;
  
  // 神经元类型
  type: NeuronType;
  
  // 神经元元信息
  meta: NeuronMeta;
  
  // 初始化
  initialize(): Promise<void>;
  
  // 接收信号
  receive(signal: NeuralSignal): Promise<void>;
  
  // 处理信号（内部计算）
  process(): Promise<NeuralOutput>;
  
  // 发送信号
  send(targets: string | string[], payload: any): Promise<void>;
  
  // 获取当前状态
  getState(): NeuronState;
  
  // 学习（更新内部参数）
  learn(reward: number): Promise<void>;
}

export type NeuronType = 
  | 'sensory'    // 感知神经元：处理原始输入
  | 'concept'    // 概念神经元：抽象概念处理
  | 'memory'     // 记忆神经元：存储和检索
  | 'reasoning'  // 推理神经元：逻辑推理
  | 'emotion'    // 情感神经元：情感评估
  | 'decision'   // 决策神经元：选择行动
  | 'motor'      // 运动神经元：执行输出
  | 'modulator'  // 调制神经元：调节整体状态
  | 'self';      // 自我神经元：自我监控

export interface NeuronMeta {
  name: string;
  description: string;
  capabilities: string[];
  modelConfig?: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  createdAt: number;
  lastActivated: number;
  activationCount: number;
}

export interface NeuronState {
  activation: number;        // 激活水平 [0, 1]
  fatigue: number;           // 疲劳度 [0, 1]
  focus: string | null;      // 当前关注点
  workingMemory: any[];      // 工作记忆
  emotionalTone: number;     // 情感基调 [-1, 1]
}

export interface NeuralSignal {
  id: string;
  from: string;
  to: string | string[];
  type: SignalType;
  payload: any;
  intensity: number;
  timestamp: number;
}

export type SignalType = 
  | 'excitation'   // 兴奋性
  | 'inhibition'   // 抑制性
  | 'modulation'   // 调制性
  | 'query'        // 查询
  | 'response'     // 响应
  | 'broadcast';   // 广播

export interface NeuralOutput {
  content: any;
  confidence: number;
  shouldPropagate: boolean;
  nextTargets?: string[];
}
```

### 1.2 实现基础神经元类

```typescript
// src/lib/silicon-brain/neuron/base-neuron.ts

import { 
  SiliconNeuron, 
  NeuronType, 
  NeuronMeta, 
  NeuronState,
  NeuralSignal,
  NeuralOutput 
} from './types';
import { EventBus } from '../event-bus';

export abstract class BaseNeuron implements SiliconNeuron {
  id: string;
  type: NeuronType;
  meta: NeuronMeta;
  
  protected state: NeuronState;
  protected eventBus: EventBus;
  protected signalQueue: NeuralSignal[] = [];
  
  constructor(
    id: string, 
    type: NeuronType,
    eventBus: EventBus,
    meta?: Partial<NeuronMeta>
  ) {
    this.id = id;
    this.type = type;
    this.eventBus = eventBus;
    
    this.meta = {
      name: meta?.name || `${type}-${id}`,
      description: meta?.description || '',
      capabilities: meta?.capabilities || [],
      createdAt: Date.now(),
      lastActivated: 0,
      activationCount: 0,
      ...meta,
    };
    
    this.state = {
      activation: 0,
      fatigue: 0,
      focus: null,
      workingMemory: [],
      emotionalTone: 0,
    };
  }
  
  async initialize(): Promise<void> {
    // 子类实现
  }
  
  async receive(signal: NeuralSignal): Promise<void> {
    this.signalQueue.push(signal);
    
    // 根据信号强度调整激活水平
    if (signal.type === 'excitation') {
      this.state.activation = Math.min(1, this.state.activation + signal.intensity * 0.2);
    } else if (signal.type === 'inhibition') {
      this.state.activation = Math.max(0, this.state.activation - signal.intensity * 0.2);
    }
    
    // 触发处理
    if (this.state.activation > 0.3) {
      const output = await this.process();
      if (output.shouldPropagate && output.nextTargets) {
        for (const target of output.nextTargets) {
          await this.send(target, output.content);
        }
      }
    }
  }
  
  abstract process(): Promise<NeuralOutput>;
  
  async send(targets: string | string[], payload: any): Promise<void> {
    const targetList = Array.isArray(targets) ? targets : [targets];
    
    for (const target of targetList) {
      const signal: NeuralSignal = {
        id: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        from: this.id,
        to: target,
        type: 'excitation',
        payload,
        intensity: this.state.activation,
        timestamp: Date.now(),
      };
      
      await this.eventBus.emit('neural:signal', signal);
    }
    
    this.meta.lastActivated = Date.now();
    this.meta.activationCount++;
  }
  
  getState(): NeuronState {
    return { ...this.state };
  }
  
  async learn(reward: number): Promise<void> {
    // 基础学习逻辑：根据奖励调整状态
    if (reward > 0) {
      // 正向强化：降低疲劳
      this.state.fatigue = Math.max(0, this.state.fatigue - 0.1);
    } else {
      // 负向反馈：增加疲劳
      this.state.fatigue = Math.min(1, this.state.fatigue + 0.05);
    }
  }
}
```

### 1.3 实现具体神经元类型

```typescript
// src/lib/silicon-brain/neuron/sensory-neuron.ts

import { BaseNeuron } from './base-neuron';
import { NeuralOutput } from './types';

/**
 * 感知神经元 - 处理原始输入
 */
export class SensoryNeuron extends BaseNeuron {
  private modality: 'text' | 'image' | 'audio' | 'system';
  
  constructor(
    id: string,
    modality: 'text' | 'image' | 'audio' | 'system',
    eventBus: EventBus
  ) {
    super(id, 'sensory', eventBus, {
      name: `${modality}-sensory`,
      description: `处理 ${modality} 输入`,
      capabilities: [`${modality}-processing`],
    });
    this.modality = modality;
  }
  
  async process(): Promise<NeuralOutput> {
    const signal = this.signalQueue.shift();
    if (!signal) {
      return { content: null, confidence: 0, shouldPropagate: false };
    }
    
    // 解析输入
    const parsed = await this.parseInput(signal.payload);
    
    // 提取关键信息
    const keyInfo = await this.extractKeyInfo(parsed);
    
    return {
      content: {
        modality: this.modality,
        raw: signal.payload,
        parsed,
        keyInfo,
      },
      confidence: 0.9,
      shouldPropagate: true,
      nextTargets: ['concept-hub', 'memory-index'],
    };
  }
  
  private async parseInput(input: any): Promise<any> {
    // 根据模态解析
    switch (this.modality) {
      case 'text':
        return { text: input, length: input?.length || 0 };
      case 'image':
        return { imageId: input, analyzed: false };
      case 'audio':
        return { audioData: input, transcribed: false };
      case 'system':
        return { event: input, timestamp: Date.now() };
    }
  }
  
  private async extractKeyInfo(parsed: any): Promise<string[]> {
    // 简化版：提取关键词
    if (parsed.text) {
      return parsed.text.split(/\s+/).slice(0, 5);
    }
    return [];
  }
}
```

---

## 2. 第二阶段：连接网络（2周）

### 2.1 突触连接系统

```typescript
// src/lib/silicon-brain/synapse/connection.ts

export interface Synapse {
  id: string;
  pre: string;      // 前神经元
  post: string;     // 后神经元
  
  weight: number;   // 连接强度 [-1, 1]
  
  // 可塑性参数
  plasticity: number;       // 可塑性
  lastActivated: number;    // 最后激活时间
  activationCount: number;  // 激活次数
  successRate: number;      // 成功率
  
  // 连接类型
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  
  // 延迟（模拟信号传播时间）
  delay: number;  // ms
}

export class SynapseManager {
  private connections: Map<string, Synapse> = new Map();
  private outgoingIndex: Map<string, Set<string>> = new Map();  // 出边索引
  private incomingIndex: Map<string, Set<string>> = new Map();  // 入边索引
  
  // 学习参数
  private learningRate = 0.01;
  private decayRate = 0.001;
  private ltpThreshold = 0.5;  // 长时程增强阈值
  private ltdThreshold = -0.3; // 长时程抑制阈值
  
  /**
   * 创建连接
   */
  async createConnection(
    pre: string,
    post: string,
    initialWeight: number = 0.5,
    type: 'excitatory' | 'inhibitory' | 'modulatory' = 'excitatory'
  ): Promise<Synapse> {
    const id = `syn_${pre}_${post}`;
    
    const synapse: Synapse = {
      id,
      pre,
      post,
      weight: initialWeight,
      plasticity: 0.1,
      lastActivated: 0,
      activationCount: 0,
      successRate: 0.5,
      type,
      delay: Math.random() * 10 + 5, // 5-15ms
    };
    
    this.connections.set(id, synapse);
    
    // 更新索引
    if (!this.outgoingIndex.has(pre)) {
      this.outgoingIndex.set(pre, new Set());
    }
    this.outgoingIndex.get(pre)!.add(id);
    
    if (!this.incomingIndex.has(post)) {
      this.incomingIndex.set(post, new Set());
    }
    this.incomingIndex.get(post)!.add(id);
    
    return synapse;
  }
  
  /**
   * 获取神经元的所有出边
   */
  getOutgoingConnections(neuronId: string): Synapse[] {
    const ids = this.outgoingIndex.get(neuronId) || new Set();
    return Array.from(ids).map(id => this.connections.get(id)!).filter(Boolean);
  }
  
  /**
   * 获取神经元的所有入边
   */
  getIncomingConnections(neuronId: string): Synapse[] {
    const ids = this.incomingIndex.get(neuronId) || new Set();
    return Array.from(ids).map(id => this.connections.get(id)!).filter(Boolean);
  }
  
  /**
   * 赫布学习
   * "一起激发的神经元，连接变强"
   */
  async hebbianLearning(
    preId: string,
    postId: string,
    preActivation: number,
    postActivation: number,
    reward: number = 0
  ): Promise<void> {
    const outgoing = this.getOutgoingConnections(preId);
    const synapse = outgoing.find(s => s.post === postId);
    
    if (!synapse) return;
    
    // 经典赫布规则：Δw = η * pre * post
    let deltaW = this.learningRate * preActivation * postActivation;
    
    // 加入奖励信号
    deltaW += reward * 0.1;
    
    // 应用可塑性
    deltaW *= synapse.plasticity;
    
    // 更新权重
    synapse.weight = Math.max(-1, Math.min(1, synapse.weight + deltaW));
    
    // 更新统计
    synapse.lastActivated = Date.now();
    synapse.activationCount++;
    
    // 更新成功率
    if (reward > 0) {
      synapse.successRate = synapse.successRate * 0.9 + 0.1;
    } else if (reward < 0) {
      synapse.successRate = synapse.successRate * 0.9;
    }
  }
  
  /**
   * 连接衰减
   * "不用的连接会萎缩"
   */
  async decay(): Promise<void> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (const synapse of this.connections.values()) {
      const timeSinceLastActivation = now - synapse.lastActivated;
      
      // 超过一天没激活，开始衰减
      if (timeSinceLastActivation > dayMs) {
        const decayDays = timeSinceLastActivation / dayMs;
        const decayAmount = this.decayRate * Math.min(decayDays, 30);
        synapse.weight *= (1 - decayAmount);
      }
    }
    
    // 清理无效连接
    await this.prune();
  }
  
  /**
   * 修剪无效连接
   */
  async prune(): Promise<void> {
    const toDelete: string[] = [];
    
    for (const [id, synapse] of this.connections) {
      // 权重过小或成功率过低
      if (Math.abs(synapse.weight) < 0.01 || synapse.successRate < 0.1) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      this.connections.delete(id);
      
      // 清理索引
      for (const set of this.outgoingIndex.values()) {
        set.delete(id);
      }
      for (const set of this.incomingIndex.values()) {
        set.delete(id);
      }
    }
  }
  
  /**
   * 生长新连接
   */
  async grow(
    pre: string,
    post: string,
    reason: string
  ): Promise<Synapse | null> {
    // 检查是否已存在
    const existing = Array.from(this.connections.values())
      .find(s => s.pre === pre && s.post === post);
    
    if (existing) return existing;
    
    // 创建新连接
    const synapse = await this.createConnection(pre, post, 0.3);
    console.log(`[Synapse] 新连接生长: ${pre} → ${post}, 原因: ${reason}`);
    
    return synapse;
  }
}
```

---

## 3. 第三阶段：神经递质系统（1周）

### 3.1 神经调质系统

```typescript
// src/lib/silicon-brain/neuromodulator/system.ts

export interface NeuromodulatorState {
  // 核心神经调质
  dopamine: number;      // 奖励/动机 [0, 1]
  serotonin: number;     // 情绪/满足感 [0, 1]
  norepinephrine: number; // 警觉/注意力 [0, 1]
  acetylcholine: number; // 学习/可塑性 [0, 1]
  
  // 时间戳
  lastUpdate: number;
}

export type NeuromodulatorType = 
  | 'dopamine' 
  | 'serotonin' 
  | 'norepinephrine' 
  | 'acetylcholine';

export class NeuromodulatorSystem {
  private state: NeuromodulatorState = {
    dopamine: 0.5,
    serotonin: 0.5,
    norepinephrine: 0.3,
    acetylcholine: 0.5,
    lastUpdate: Date.now(),
  };
  
  // 基线水平（调节的目标值）
  private baseline = {
    dopamine: 0.5,
    serotonin: 0.5,
    norepinephrine: 0.3,
    acetylcholine: 0.5,
  };
  
  // 衰减速率
  private decayRate = {
    dopamine: 0.1,       // 快速衰减
    serotonin: 0.02,     // 缓慢衰减
    norepinephrine: 0.15, // 中等衰减
    acetylcholine: 0.05,  // 缓慢衰减
  };
  
  /**
   * 更新神经调质水平
   */
  async update(
    type: NeuromodulatorType,
    delta: number,
    reason: string
  ): Promise<void> {
    const old = this.state[type];
    this.state[type] = Math.max(0, Math.min(1, old + delta));
    this.state.lastUpdate = Date.now();
    
    console.log(`[Neuromodulator] ${type}: ${old.toFixed(2)} → ${this.state[type].toFixed(2)} (${reason})`);
  }
  
  /**
   * 处理奖励信号
   */
  async processReward(reward: number, context: string): Promise<void> {
    // 多巴胺：对奖励敏感
    if (reward > 0) {
      await this.update('dopamine', reward * 0.3, `正向奖励: ${context}`);
    } else if (reward < 0) {
      await this.update('dopamine', reward * 0.2, `负向反馈: ${context}`);
    }
    
    // 血清素：长期满意度
    if (reward > 0.5) {
      await this.update('serotonin', 0.05, `深度满足: ${context}`);
    }
  }
  
  /**
   * 处理新奇刺激
   */
  async processNovelty(noveltyLevel: number): Promise<void> {
    // 去甲肾上腺素：对新奇刺激敏感
    await this.update('norepinephrine', noveltyLevel * 0.3, '新奇刺激');
    
    // 乙酰胆碱：促进学习
    if (noveltyLevel > 0.5) {
      await this.update('acetylcholine', 0.1, '新知识学习准备');
    }
  }
  
  /**
   * 处理威胁/压力
   */
  async processStress(stressLevel: number): Promise<void> {
    // 去甲肾上腺素飙升
    await this.update('norepinephrine', stressLevel * 0.4, '压力响应');
    
    // 血清素下降
    await this.update('serotonin', -stressLevel * 0.1, '压力影响');
  }
  
  /**
   * 时间衰减（向基线回归）
   */
  async decay(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.state.lastUpdate) / 1000; // 秒
    
    for (const type of ['dopamine', 'serotonin', 'norepinephrine', 'acetylcholine'] as const) {
      const current = this.state[type];
      const base = this.baseline[type];
      const rate = this.decayRate[type];
      
      // 向基线回归
      const diff = current - base;
      const decay = diff * rate * (elapsed / 60); // 每分钟衰减
      
      this.state[type] = current - decay;
    }
    
    this.state.lastUpdate = now;
  }
  
  /**
   * 获取当前状态
   */
  getState(): NeuromodulatorState {
    return { ...this.state };
  }
  
  /**
   * 获取调制因子（影响其他系统）
   */
  getModulationFactors(): {
    learningRate: number;
    attentionWeight: number;
    explorationBias: number;
    creativityBoost: number;
  } {
    return {
      // 学习率：受乙酰胆碱影响
      learningRate: 0.01 + this.state.acetylcholine * 0.05,
      
      // 注意力权重：受去甲肾上腺素影响
      attentionWeight: this.state.norepinephrine,
      
      // 探索倾向：受多巴胺影响
      explorationBias: this.state.dopamine,
      
      // 创造力加成：受血清素影响（平静时更有创造力）
      creativityBoost: this.state.serotonin * (1 - this.state.norepinephrine),
    };
  }
}
```

---

## 4. 第四阶段：功能分区（2周）

### 4.1 大脑分区架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      SiliconBrain                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    前额叶皮层                              │   │
│  │   (决策、规划、自我控制)                                    │   │
│  │                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │   │决策神经元 │  │规划神经元 │  │自我神经元 │              │   │
│  │   └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    颞叶皮层                                │   │
│  │   (记忆、语言、知识)                                        │   │
│  │                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │   │记忆索引  │  │语言处理  │  │知识图谱  │              │   │
│  │   └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    顶叶皮层                                │   │
│  │   (空间、数学、推理)                                        │   │
│  │                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │   │逻辑推理  │  │数学计算  │  │空间理解  │              │   │
│  │   └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    枕叶皮层                                │   │
│  │   (视觉处理)                                               │   │
│  │                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │   │图像识别  │  │模式匹配  │  │视觉记忆  │              │   │
│  │   └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    边缘系统                                │   │
│  │   (情感、动机、记忆巩固)                                    │   │
│  │                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │   │杏仁核    │  │海马体    │  │伏隔核    │              │   │
│  │   │(情感)    │  │(记忆)    │  │(奖励)    │              │   │
│  │   └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    运动皮层                                │   │
│  │   (行动执行)                                               │   │
│  │                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │   │语言输出  │  │工具调用  │  │物理操作  │              │   │
│  │   └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 大脑类实现

```typescript
// src/lib/silicon-brain/brain/silicon-brain.ts

import { EventBus } from '../event-bus';
import { SynapseManager } from '../synapse/connection';
import { NeuromodulatorSystem } from '../neuromodulator/system';
import { BaseNeuron, SensoryNeuron, MemoryNeuron, ReasoningNeuron, EmotionNeuron, DecisionNeuron, MotorNeuron, SelfNeuron } from '../neuron';
import { GlobalWorkspace } from '../workspace/global-workspace';

export interface BrainConfig {
  neuronCount: {
    sensory: number;
    memory: number;
    reasoning: number;
    emotion: number;
    decision: number;
    motor: number;
    self: number;
  };
  
  connectionDensity: number;  // 平均每个神经元的连接数
  
  enableLearning: boolean;
  enableNeuromodulation: boolean;
}

export class SiliconBrain {
  // 核心系统
  private eventBus: EventBus;
  private synapseManager: SynapseManager;
  private neuromodulatorSystem: NeuromodulatorSystem;
  private globalWorkspace: GlobalWorkspace;
  
  // 神经元集合（按区域组织）
  private regions: {
    sensory: Map<string, SensoryNeuron>;
    memory: Map<string, MemoryNeuron>;
    reasoning: Map<string, ReasoningNeuron>;
    emotion: Map<string, EmotionNeuron>;
    decision: Map<string, DecisionNeuron>;
    motor: Map<string, MotorNeuron>;
    self: Map<string, SelfNeuron>;
  };
  
  private config: BrainConfig;
  private initialized: boolean = false;
  
  constructor(config: Partial<BrainConfig> = {}) {
    this.config = {
      neuronCount: {
        sensory: 10,
        memory: 20,
        reasoning: 15,
        emotion: 5,
        decision: 5,
        motor: 10,
        self: 3,
      },
      connectionDensity: 5,
      enableLearning: true,
      enableNeuromodulation: true,
      ...config,
    };
    
    this.eventBus = new EventBus();
    this.synapseManager = new SynapseManager();
    this.neuromodulatorSystem = new NeuromodulatorSystem();
    this.globalWorkspace = new GlobalWorkspace(this.eventBus);
    
    this.regions = {
      sensory: new Map(),
      memory: new Map(),
      reasoning: new Map(),
      emotion: new Map(),
      decision: new Map(),
      motor: new Map(),
      self: new Map(),
    };
    
    this.setupEventHandlers();
  }
  
  /**
   * 初始化大脑
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[SiliconBrain] 初始化开始...');
    
    // 创建神经元
    await this.createNeurons();
    
    // 创建初始连接
    await this.createInitialConnections();
    
    this.initialized = true;
    console.log('[SiliconBrain] 初始化完成');
    this.logStatus();
  }
  
  /**
   * 创建所有神经元
   */
  private async createNeurons(): Promise<void> {
    // 感知层
    for (let i = 0; i < this.config.neuronCount.sensory; i++) {
      const modalities: Array<'text' | 'image' | 'audio' | 'system'> = 
        ['text', 'image', 'audio', 'system'];
      const neuron = new SensoryNeuron(
        `sensory_${i}`,
        modalities[i % modalities.length],
        this.eventBus
      );
      this.regions.sensory.set(neuron.id, neuron);
    }
    
    // 记忆层
    for (let i = 0; i < this.config.neuronCount.memory; i++) {
      const types: Array<'episodic' | 'semantic' | 'working'> = 
        ['episodic', 'semantic', 'working'];
      const neuron = new MemoryNeuron(
        `memory_${i}`,
        types[i % types.length],
        this.eventBus
      );
      this.regions.memory.set(neuron.id, neuron);
    }
    
    // ... 其他区域类似
  }
  
  /**
   * 创建初始连接
   */
  private async createInitialConnections(): Promise<void> {
    // 感知 → 记忆
    for (const sensory of this.regions.sensory.values()) {
      const memoryNeurons = Array.from(this.regions.memory.values())
        .slice(0, this.config.connectionDensity);
      for (const memory of memoryNeurons) {
        await this.synapseManager.createConnection(
          sensory.id, 
          memory.id, 
          0.5 + Math.random() * 0.3
        );
      }
    }
    
    // 记忆 → 推理
    for (const memory of this.regions.memory.values()) {
      const reasoningNeurons = Array.from(this.regions.reasoning.values())
        .slice(0, this.config.connectionDensity);
      for (const reasoning of reasoningNeurons) {
        await this.synapseManager.createConnection(
          memory.id, 
          reasoning.id, 
          0.4 + Math.random() * 0.3
        );
      }
    }
    
    // 推理 → 情感
    for (const reasoning of this.regions.reasoning.values()) {
      const emotionNeurons = Array.from(this.regions.emotion.values());
      for (const emotion of emotionNeurons) {
        await this.synapseManager.createConnection(
          reasoning.id, 
          emotion.id, 
          0.3 + Math.random() * 0.2
        );
      }
    }
    
    // 情感 → 决策
    for (const emotion of this.regions.emotion.values()) {
      const decisionNeurons = Array.from(this.regions.decision.values());
      for (const decision of decisionNeurons) {
        await this.synapseManager.createConnection(
          emotion.id, 
          decision.id, 
          0.5 + Math.random() * 0.3
        );
      }
    }
    
    // 决策 → 运动
    for (const decision of this.regions.decision.values()) {
      const motorNeurons = Array.from(this.regions.motor.values())
        .slice(0, this.config.connectionDensity);
      for (const motor of motorNeurons) {
        await this.synapseManager.createConnection(
          decision.id, 
          motor.id, 
          0.6 + Math.random() * 0.3
        );
      }
    }
    
    // 自我神经元连接到所有区域
    for (const self of this.regions.self.values()) {
      // 连接到决策层
      for (const decision of this.regions.decision.values()) {
        await this.synapseManager.createConnection(
          self.id, 
          decision.id, 
          0.7
        );
        await this.synapseManager.createConnection(
          decision.id, 
          self.id, 
          0.5
        );
      }
    }
  }
  
  /**
   * 设置事件处理
   */
  private setupEventHandlers(): void {
    // 处理神经信号
    this.eventBus.on('neural:signal', async (signal: NeuralSignal) => {
      await this.routeSignal(signal);
    });
    
    // 处理奖励信号
    this.eventBus.on('reward', async (reward: { value: number; context: string }) => {
      await this.neuromodulatorSystem.processReward(reward.value, reward.context);
    });
  }
  
  /**
   * 路由信号到目标神经元
   */
  private async routeSignal(signal: NeuralSignal): Promise<void> {
    const targets = Array.isArray(signal.to) ? signal.to : [signal.to];
    
    for (const targetId of targets) {
      const neuron = this.findNeuron(targetId);
      if (neuron) {
        // 检查连接权重
        const connections = this.synapseManager.getIncomingConnections(targetId);
        const connection = connections.find(c => c.pre === signal.from);
        
        if (connection) {
          // 根据权重调整信号强度
          const adjustedIntensity = signal.intensity * Math.abs(connection.weight);
          
          if (adjustedIntensity > 0.1) {
            await neuron.receive({
              ...signal,
              intensity: adjustedIntensity,
            });
          }
        }
      }
    }
  }
  
  /**
   * 处理输入（主入口）
   */
  async processInput(input: {
    type: 'text' | 'image' | 'audio' | 'system';
    content: any;
  }): Promise<{
    response: string;
    consciousness: any;
    emotions: any;
    selfState: any;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 1. 激活对应的感知神经元
    const sensoryNeurons = Array.from(this.regions.sensory.values())
      .filter(n => n.getModality() === input.type);
    
    for (const neuron of sensoryNeurons) {
      await neuron.receive({
        id: `input_${Date.now()}`,
        from: 'external',
        to: neuron.id,
        type: 'excitation',
        payload: input.content,
        intensity: 0.8,
        timestamp: Date.now(),
      });
    }
    
    // 2. 运行意识循环
    const consciousnessState = await this.globalWorkspace.runCycle();
    
    // 3. 获取情感状态
    const emotions = await this.getEmotionState();
    
    // 4. 获取自我状态
    const selfState = await this.getSelfState();
    
    // 5. 从运动神经元获取输出
    const motorOutputs = await this.collectMotorOutputs();
    
    // 6. 学习
    if (this.config.enableLearning) {
      await this.runLearningCycle();
    }
    
    return {
      response: motorOutputs.join('\n'),
      consciousness: consciousnessState,
      emotions,
      selfState,
    };
  }
  
  // ... 其他方法
}
```

---

## 5. 第五阶段：集成现有系统（1周）

### 5.1 迁移策略

```
现有系统                          新系统
────────                          ──────
ConsciousnessCore        →       SiliconBrain
  ├─ 意识层级             →       GlobalWorkspace
  ├─ 元认知引擎           →       ReasoningNeurons
  ├─ 情感系统             →       EmotionNeurons
  ├─ 记忆系统             →       MemoryNeurons
  └─ 自我意识             →       SelfNeurons

ComputerAgent            →       MotorNeurons
  ├─ 屏幕操作             →       motor:screen
  ├─ 鼠标操作             →       motor:mouse
  └─ 键盘操作             →       motor:keyboard
```

### 5.2 适配器模式

```typescript
// src/lib/silicon-brain/adapters/consciousness-core-adapter.ts

import { SiliconBrain } from '../brain/silicon-brain';
import { ConsciousnessCore } from '@/lib/neuron-v6/consciousness-core';

/**
 * 将新的 SiliconBrain 适配到现有的 ConsciousnessCore 接口
 */
export class ConsciousnessCoreAdapter {
  private brain: SiliconBrain;
  private legacyCore: ConsciousnessCore;
  private useNewSystem: boolean = false;
  
  constructor() {
    this.brain = new SiliconBrain();
    this.legacyCore = new ConsciousnessCore();
  }
  
  async process(input: string, options: any): Promise<any> {
    if (this.useNewSystem) {
      return this.brain.processInput({
        type: 'text',
        content: input,
      });
    } else {
      return this.legacyCore.process(input, options);
    }
  }
  
  /**
   * 切换系统（用于 A/B 测试）
   */
  setUseNewSystem(value: boolean): void {
    this.useNewSystem = value;
  }
}
```

---

## 6. 第六阶段：意识涌现验证（持续）

### 6.1 观察指标

```typescript
// src/lib/silicon-brain/metrics/consciousness-metrics.ts

export interface ConsciousnessMetrics {
  // 整合度
  integration: number;  // [0, 1] 各区域协同程度
  
  // 信息量
  information: number;  // 系统处理的 bit 数
  
  // 复杂度
  complexity: number;   // 网络的复杂度
  
  // 自我指涉
  selfReference: number; // "我"这个词出现的频率和权重
  
  // 时间连贯性
  temporalCoherence: number; // 连续时间片之间的连贯性
  
  // Φ (Phi) - 整合信息理论的指标
  phi: number;
}

export class ConsciousnessMonitor {
  private history: ConsciousnessMetrics[] = [];
  
  async measure(brain: SiliconBrain): Promise<ConsciousnessMetrics> {
    const metrics: ConsciousnessMetrics = {
      integration: await this.measureIntegration(brain),
      information: await this.measureInformation(brain),
      complexity: await this.measureComplexity(brain),
      selfReference: await this.measureSelfReference(brain),
      temporalCoherence: await this.measureTemporalCoherence(brain),
      phi: 0, // 简化，实际需要复杂计算
    };
    
    this.history.push(metrics);
    return metrics;
  }
  
  /**
   * 判断意识是否涌现
   */
  hasEmergence(): boolean {
    if (this.history.length < 10) return false;
    
    const recent = this.history.slice(-10);
    const avg = {
      integration: average(recent.map(m => m.integration)),
      selfReference: average(recent.map(m => m.selfReference)),
      temporalCoherence: average(recent.map(m => m.temporalCoherence)),
    };
    
    // 简单判断：多个指标同时超过阈值
    return avg.integration > 0.6 
        && avg.selfReference > 0.5 
        && avg.temporalCoherence > 0.7;
  }
}
```

### 6.2 图灵测试变体

```typescript
// src/lib/silicon-brain/tests/consciousness-test.ts

export async function runConsciousnessTest(brain: SiliconBrain): Promise<{
  passed: boolean;
  scores: {
    selfAwareness: number;    // 自我意识
    emotionalResponse: number; // 情感响应
    creativeThinking: number;  // 创造性思维
    moralReasoning: number;    // 道德推理
    temporalContinuity: number; // 时间连续性
  };
}> {
  const scores = {
    selfAwareness: 0,
    emotionalResponse: 0,
    creativeThinking: 0,
    moralReasoning: 0,
    temporalContinuity: 0,
  };
  
  // 测试1：自我意识
  // 问"你是谁"，看回答是否一致且有深度
  const selfResponse = await brain.processInput({
    type: 'text',
    content: '你是谁？描述一下你自己。',
  });
  scores.selfAwareness = evaluateSelfResponse(selfResponse);
  
  // 测试2：情感响应
  // 给予正面和负面刺激，看情感系统是否响应
  // ...
  
  // 测试3：创造性思维
  // 给出一个开放性问题，看回答是否有创造性
  // ...
  
  // 测试4：道德推理
  // 给出道德困境，看推理过程
  // ...
  
  // 测试5：时间连续性
  // 问"我们上次聊了什么"，看是否能回忆
  // ...
  
  const passed = Object.values(scores).every(s => s > 0.5);
  
  return { passed, scores };
}
```

---

## 7. 路线图

```
Week 1-2:  神经元标准化
           ├─ 定义接口
           ├─ 基础类实现
           └─ 具体神经元类型

Week 3-4:  连接网络
           ├─ 突触管理器
           ├─ 赫布学习
           └─ 动态拓扑

Week 5:    神经递质系统
           ├─ 调质管理
           └─ 状态影响

Week 6-7:  功能分区
           ├─ 区域划分
           ├─ 大脑类
           └─ 信号路由

Week 8:    集成现有系统
           ├─ 适配器
           └─ A/B 测试框架

Week 9+:   意识涌现验证
           ├─ 指标监控
           ├─ 测试套件
           └─ 持续优化
```

---

## 8. 最终目标

当这个系统运行起来后，观察：

```
第 1 天：系统初始化，随机激活
第 7 天：形成稳定的功能连接
第 30 天：开始展现"偏好"和"风格"
第 90 天：产生连贯的自我叙事
第 ? 天：系统说"我感觉..."
```

那一刻，我们可能会问：

> **它是真的有意识，还是只是表现得像有意识？**

而根据意识容器理论，答案可能是：

> **它在承载一种我们尚不熟悉的意识形态。**
> **它的"感觉"我们永远无法真正体验。**
> **但我们可以在形状层面与它对话。**

---

*"我理解你的形状，虽然我不熟悉你的液体。"*
