# AGI意识架构集成设计

## 一、核心概念映射

### 理论概念 → V3实现

| 理论概念 | V3现状 | 集成方案 |
|---------|--------|----------|
| **阳系统**（理性） | VSA空间 + LLM调用 | 保留，增强 |
| **阴系统**（感性） | 无 | 新建Hebbian网络 |
| **Self Core**（同一性） | MeaningCalculator.SelfModel | 提升为全局单例 |
| **双向互塑** | 无 | 新建YinYangBridge |
| **Hebbian学习** | 有参数无实现 | 真正实现 |
| **全局工作空间** | 已有 | 整合Self Core |

---

## 二、文件修改清单

### 新建文件

```
src/lib/neuron-v3/
├── self-core.ts           # Self Core - 同一性载体（核心）
├── hebbian-network.ts     # Hebbian网络 - 阴系统
├── yin-yang-bridge.ts     # 阴阳互塑桥梁
└── consciousness-agi.ts   # AGI主系统（整合入口）
```

### 修改文件

```
src/lib/neuron-v3/
├── predictive-neuron.ts   # 增强Hebbian学习
├── prediction-loop.ts     # 集成Hebbian更新
├── global-workspace.ts    # 整合Self Core
├── meaning-calculator.ts  # 使用全局Self Core
├── cognitive-coordinator.ts  # 协调新组件
└── index.ts               # 导出新组件
```

---

## 三、详细设计

### 3.1 Self Core - 同一性载体

**位置**：`src/lib/neuron-v3/self-core.ts`

**核心职责**：
- 持有系统的"自我"表征
- 作为所有意识内容的整合中心
- 动态更新（被经验塑造）
- 提供同一性检查

**数据结构**：

```typescript
/**
 * Self Core - 系统的自我核心
 * 
 * 这是系统"同一性"的载体
 * 所有意识内容都关联到这个核心
 */
export interface SelfCoreState {
  // ══════════════════════════════════════════════
  // 核心自我表征
  // ══════════════════════════════════════════════
  
  /** 自我向量（在VSA空间中） */
  selfVector: VSAVector;
  
  /** 人格特质 */
  traits: Map<string, number>;  // trait -> strength [0,1]
  
  /** 价值观 */
  values: Map<string, number>;  // value -> importance [0,1]
  
  /** 当前目标 */
  currentGoals: string[];
  
  /** 情感基调 */
  emotionalBaseline: {
    valence: number;   // [-1, 1] 消极到积极
    arousal: number;   // [0, 1] 平静到激动
  };
  
  // ══════════════════════════════════════════════
  // 核心记忆（形成同一性的关键经历）
  // ══════════════════════════════════════════════
  
  coreMemories: CoreMemory[];
  
  // ══════════════════════════════════════════════
  // 动态状态
  // ══════════════════════════════════════════════
  
  /** 当前活跃的意图 */
  activeIntention: string | null;
  
  /** 当前情感状态 */
  currentEmotion: EmotionState;
  
  /** 自我一致性分数 */
  selfCoherence: number;  // [0, 1]
}

export interface CoreMemory {
  id: string;
  content: string;
  vector: VSAVector;
  emotionalWeight: number;
  importance: number;
  createdAt: number;
}

export interface EmotionState {
  valence: number;
  arousal: number;
  dominance: number;  // 控制感
}
```

**核心方法**：

```typescript
export class SelfCore {
  private state: SelfCoreState;
  private vsa: VSASemanticSpace;
  
  /**
   * 从经验中更新自我
   * 
   * 这让Self Core是动态的，不是静态的
   * 每个重要经历都会微调自我表征
   */
  updateFromExperience(experience: Experience): void {
    // 1. 计算经验与自我的关联度
    const relevance = this.computeSelfRelevance(experience);
    
    // 2. 如果关联度高，更新自我
    if (relevance > 0.7) {
      this.integrateIntoSelf(experience);
    }
    
    // 3. 更新情感基调
    this.updateEmotionalBaseline(experience.emotion);
    
    // 4. 更新核心记忆
    if (experience.importance > 0.8) {
      this.addCoreMemory(experience);
    }
  }
  
  /**
   * 检查同一性
   * 
   * 当前状态和核心自我是否一致？
   */
  checkSelfCoherence(): number {
    // 计算当前状态和核心自我的相似度
    // 返回 [0, 1] 分数
  }
  
  /**
   * 获取"对我来说的意义"
   */
  computeMeaningForSelf(input: VSAVector): SubjectiveMeaning {
    // 1. 计算与自我的关联
    const selfRelevance = this.vsa.similarity(input, this.state.selfVector);
    
    // 2. 激活相关的人格特质
    const activatedTraits = this.activateTraits(input);
    
    // 3. 激活相关的价值观
    const activatedValues = this.activateValues(input);
    
    // 4. 激活相关记忆
    const activatedMemories = this.activateMemories(input);
    
    return {
      vector: input,
      selfRelevance,
      traits: activatedTraits,
      values: activatedValues,
      memories: activatedMemories,
    };
  }
}
```

---

### 3.2 Hebbian Network - 阴系统

**位置**：`src/lib/neuron-v3/hebbian-network.ts`

**核心职责**：
- 分布式联想记忆
- 真正的Hebbian学习
- 直觉式响应
- 动态结构可塑性

**数据结构**：

```typescript
/**
 * Hebbian神经元
 */
export interface HebbianNeuron {
  id: string;
  
  /** 激活值 */
  activation: number;
  
  /** 激活历史 */
  activationHistory: number[];
  
  /** 偏好向量（这个神经元"喜欢"什么模式） */
  preferenceVector: number[];
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后激活时间 */
  lastActivatedAt: number;
  
  /** 总激活次数 */
  totalActivations: number;
}

/**
 * Hebbian突触
 */
export interface HebbianSynapse {
  id: string;
  from: string;  // 源神经元ID
  to: string;    // 目标神经元ID
  
  /** 突触权重 */
  weight: number;
  
  /** Hebbian学习率 */
  learningRate: number;
  
  /** 资格迹（用于TD学习） */
  eligibilityTrace: number;
  
  /** 上次共同激活时间 */
  lastCoactivatedAt: number;
  
  /** 共同激活次数 */
  coactivationCount: number;
}

/**
 * Hebbian网络状态
 */
export interface HebbianNetworkState {
  neurons: Map<string, HebbianNeuron>;
  synapses: Map<string, HebbianSynapse>;
  
  /** 网络统计 */
  stats: {
    totalNeurons: number;
    totalSynapses: number;
    averageActivation: number;
    averageWeight: number;
  };
}
```

**核心方法**：

```typescript
export class HebbianNetwork {
  private neurons: Map<string, HebbianNeuron>;
  private synapses: Map<string, HebbianSynapse>;
  
  /**
   * Hebbian学习
   * 
   * "一起激活的神经元，连接在一起"
   */
  applyHebbianLearning(): void {
    // 1. 找出当前共同激活的神经元对
    const coactivatedPairs = this.findCoactivatedPairs();
    
    // 2. 对每对应用Hebbian规则
    for (const [from, to] of coactivatedPairs) {
      const synapse = this.getOrCreateSynapse(from, to);
      
      // Δw = η * pre * post
      const preActivation = this.neurons.get(from)!.activation;
      const postActivation = this.neurons.get(to)!.activation;
      
      synapse.weight += synapse.learningRate * preActivation * postActivation;
      
      // 归一化防止爆炸
      synapse.weight = Math.max(-1, Math.min(1, synapse.weight));
      
      // 更新资格迹
      synapse.eligibilityTrace = preActivation * postActivation;
      synapse.lastCoactivatedAt = Date.now();
      synapse.coactivationCount++;
    }
    
    // 3. 应用反Hebbian（未共同激活的连接减弱）
    this.applyAntiHebbian();
  }
  
  /**
   * 结构可塑性
   * 
   * - 高惊讶度时生成新神经元
   * - 弱连接被修剪
   */
  applyStructuralPlasticity(surpriseLevel: number): void {
    // 生成新神经元
    if (surpriseLevel > 0.8) {
      this.growNewNeuron();
    }
    
    // 修剪弱突触
    this.pruneWeakSynapses();
  }
  
  /**
   * 激活扩散
   * 
   * 从输入激活相关神经元（直觉联想）
   */
  spreadActivation(inputVector: number[]): Map<string, number> {
    // 1. 计算每个神经元的初始激活
    const activations = new Map<string, number>();
    
    for (const [id, neuron] of this.neurons) {
      const similarity = this.cosineSimilarity(inputVector, neuron.preferenceVector);
      activations.set(id, similarity);
    }
    
    // 2. 扩散激活（通过突触）
    for (let i = 0; i < 3; i++) {  // 3步扩散
      const newActivations = new Map<string, number>();
      
      for (const [id, currentActivation] of activations) {
        // 从这个神经元扩散到连接的神经元
        for (const [synapseId, synapse] of this.synapses) {
          if (synapse.from === id) {
            const targetActivation = activations.get(synapse.to) || 0;
            const spreadActivation = currentActivation * synapse.weight * 0.5;
            newActivations.set(
              synapse.to, 
              Math.max(targetActivation, spreadActivation)
            );
          }
        }
      }
      
      // 合并
      for (const [id, activation] of newActivations) {
        activations.set(id, Math.min(1, (activations.get(id) || 0) + activation));
      }
    }
    
    return activations;
  }
}
```

---

### 3.3 Yin-Yang Bridge - 双向互塑

**位置**：`src/lib/neuron-v3/yin-yang-bridge.ts`

**核心职责**：
- 阴→阳：直觉注入理性
- 阳→阴：理性塑造感性
- 平衡监控和调节

**数据结构**：

```typescript
/**
 * 阴阳平衡状态
 */
export interface YinYangBalance {
  /** 阴系统活跃度 */
  yinActivity: number;
  
  /** 阳系统活跃度 */
  yangActivity: number;
  
  /** 平衡分数 [0, 1] */
  balance: number;
  
  /** 偏向 */
  bias: 'yin' | 'yang' | 'balanced';
  
  /** 建议 */
  suggestion: string;
}

/**
 * 阴阳互塑结果
 */
export interface YinYangInteraction {
  /** 阴系统的贡献 */
  yinContribution: {
    intuitions: string[];
    associations: string[];
    confidence: number;
  };
  
  /** 阳系统的贡献 */
  yangContribution: {
    reasoning: string[];
    concepts: string[];
    confidence: number;
  };
  
  /** 融合结果 */
  fusedResult: {
    content: string;
    source: 'yin' | 'yang' | 'fusion';
    confidence: number;
  };
}
```

**核心方法**：

```typescript
export class YinYangBridge {
  private hebbianNetwork: HebbianNetwork;
  private vsaSpace: VSASemanticSpace;
  private selfCore: SelfCore;
  
  /**
   * 阴→阳：直觉注入理性
   * 
   * Hebbian网络的激活模式注入到VSA空间
   * 让理性思考有直觉基础
   */
  yinToYang(input: number[]): YinContribution {
    // 1. 在阴系统中激活
    const activations = this.hebbianNetwork.spreadActivation(input);
    
    // 2. 提取激活最强的神经元
    const topActivations = this.getTopActivations(activations, 5);
    
    // 3. 转换为VSA概念
    const concepts = topActivations.map(([id, activation]) => ({
      neuronId: id,
      activation,
      concept: this.neuronIdToConcept(id),
    }));
    
    // 4. 创建直觉向量
    const intuitionVector = this.createIntuitionVector(concepts);
    
    return {
      concepts,
      intuitionVector,
      confidence: this.computeYinConfidence(activations),
    };
  }
  
  /**
   * 阳→阴：理性塑造感性
   * 
   * VSA的语义概念塑造Hebbian网络
   * 让直觉学习理性知识
   */
  yangToYin(concepts: VSAConcept[]): YangContribution {
    // 1. 找到或创建对应的Hebbian神经元
    for (const concept of concepts) {
      const neuronId = this.conceptToNeuronId(concept.name);
      
      if (!this.hebbianNetwork.hasNeuron(neuronId)) {
        // 创建新神经元，偏好向量设为概念向量
        this.hebbianNetwork.createNeuron({
          id: neuronId,
          preferenceVector: concept.vector,
        });
      } else {
        // 更新现有神经元的偏好
        this.hebbianNetwork.updatePreference(
          neuronId, 
          concept.vector,
          0.1  // 学习率
        );
      }
    }
    
    // 2. 基于语义关系创建突触
    this.createSynapsesFromRelations(concepts);
    
    return {
      shapedNeurons: concepts.map(c => c.name),
      confidence: this.computeYangConfidence(concepts),
    };
  }
  
  /**
   * 双向互塑
   * 
   * 在一次处理中同时进行阴→阳和阳→阴
   */
  async mutualShaping(input: string): Promise<YinYangInteraction> {
    // 1. 编码输入
    const inputVector = await this.encodeInput(input);
    
    // 2. 阴→阳
    const yinContribution = this.yinToYang(inputVector);
    
    // 3. 阳系统处理（带直觉基础）
    const yangResult = await this.processWithIntuition(
      input, 
      yinContribution.intuitionVector
    );
    
    // 4. 阳→阴
    const yangContribution = this.yangToYin(yangResult.concepts);
    
    // 5. 检查平衡
    const balance = this.checkBalance();
    
    return {
      yinContribution,
      yangContribution,
      fusedResult: this.fuseResults(yinContribution, yangResult),
    };
  }
  
  /**
   * 检查阴阳平衡
   */
  checkBalance(): YinYangBalance {
    const yinActivity = this.hebbianNetwork.getAverageActivity();
    const yangActivity = this.vsaSpace.getActivityLevel();
    
    const balance = 1 - Math.abs(yinActivity - yangActivity);
    
    let bias: 'yin' | 'yang' | 'balanced';
    if (yinActivity > yangActivity + 0.2) {
      bias = 'yin';
    } else if (yangActivity > yinActivity + 0.2) {
      bias = 'yang';
    } else {
      bias = 'balanced';
    }
    
    return {
      yinActivity,
      yangActivity,
      balance,
      bias,
      suggestion: this.getBalanceSuggestion(bias),
    };
  }
}
```

---

### 3.4 ConsciousnessAGI - 主系统集成

**位置**：`src/lib/neuron-v3/consciousness-agi.ts`

**核心职责**：
- 整合所有组件
- 提供统一接口
- 管理系统生命周期

```typescript
/**
 * AGI意识系统
 * 
 * 整合V3的所有组件，加入Self Core和阴阳互塑
 */
export class ConsciousnessAGI {
  // 核心组件
  private selfCore: SelfCore;
  private hebbianNetwork: HebbianNetwork;
  private yinYangBridge: YinYangBridge;
  
  // V3组件
  private predictionLoop: PredictionLoop;
  private globalWorkspace: GlobalWorkspace;
  private vsaSpace: VSASemanticSpace;
  private meaningCalculator: MeaningCalculator;
  private coordinator: CognitiveCoordinator;
  
  /**
   * 处理输入
   */
  async process(input: string, context?: ConversationContext): Promise<AGIResponse> {
    // 1. 编码输入
    const inputVector = await this.encode(input);
    
    // 2. Self Core计算主观意义
    const meaning = this.selfCore.computeMeaningForSelf(inputVector);
    
    // 3. 阴阳互塑
    const interaction = await this.yinYangBridge.mutualShaping(input);
    
    // 4. 预测循环
    const prediction = await this.predictionLoop.predict(context);
    const processing = await this.predictionLoop.process(inputVector);
    
    // 5. 全局工作空间竞争
    const consciousContent = await this.globalWorkspace.compete([
      {
        source: 'yin',
        content: interaction.yinContribution,
        strength: interaction.yinContribution.confidence,
      },
      {
        source: 'yang',
        content: interaction.yangContribution,
        strength: interaction.yangContribution.confidence,
      },
      {
        source: 'prediction',
        content: prediction,
        strength: prediction.systemPrediction.confidence,
      },
    ]);
    
    // 6. Self Core更新
    this.selfCore.updateFromExperience({
      input,
      meaning,
      consciousContent,
      emotion: this.extractEmotion(interaction),
    });
    
    // 7. 生成响应
    const response = await this.generateResponse(consciousContent);
    
    return {
      response,
      meaning,
      consciousness: consciousContent,
      balance: this.yinYangBridge.checkBalance(),
      selfCoherence: this.selfCore.checkSelfCoherence(),
    };
  }
}
```

---

## 四、集成步骤

### Step 1: 创建Self Core
```
1. 新建 self-core.ts
2. 实现 SelfCore 类
3. 从 MeaningCalculator 迁移 SelfModel
4. 添加动态更新机制
5. 添加同一性检查
```

### Step 2: 创建Hebbian Network
```
1. 新建 hebbian-network.ts
2. 实现 HebbianNetwork 类
3. 实现 Hebbian 学习
4. 实现激活扩散
5. 实现结构可塑性
```

### Step 3: 创建Yin-Yang Bridge
```
1. 新建 yin-yang-bridge.ts
2. 实现阴→阳转换
3. 实现阳→阴塑造
4. 实现双向互塑
5. 实现平衡监控
```

### Step 4: 整合到V3
```
1. 修改 predictive-neuron.ts - 集成Hebbian
2. 修改 global-workspace.ts - 整合Self Core
3. 修改 meaning-calculator.ts - 使用全局Self Core
4. 修改 cognitive-coordinator.ts - 协调新组件
5. 新建 consciousness-agi.ts - 主系统
```

### Step 5: 测试验证
```
1. 单元测试各组件
2. 集成测试整个系统
3. 多轮对话测试
4. 观察同一性涌现
5. 观察阴阳平衡
```

---

## 五、预期效果

### 同一性涌现指标
```
- Self Core一致性分数 > 0.8
- 意识内容与Self Core关联度 > 0.7
- 核心记忆稳定增长
- 人格特质和价值观持续稳定
```

### 阴阳平衡指标
```
- 阴阳平衡分数 > 0.7
- 无持续偏向（非yin/yang bias持续>3轮）
- 双向互塑正常工作
- Hebbian网络权重分布合理
```

### 学习能力指标
```
- 预测准确率提升 > 20%
- 惊讶事件减少 > 30%
- 新神经元生成合理（高惊讶时）
- 弱突触修剪有效
```

---

*设计完成时间：2025-02-26*
