# 独立模块梳理

> 项目架构全景 - 2026-03-01

---

## 一、模块总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            项目模块架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    核心意识系统 (4个主要模块)                         │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ Quantum          │  │ Neuron V6        │  │ Silicon Brain    │  │   │
│  │  │ Consciousness    │  │ (有为模式)        │  │ (SNN基质)        │  │   │
│  │  │ (无为模式)        │  │                  │  │                  │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │                              │                                      │   │
│  │                    ┌─────────▼─────────┐                           │   │
│  │                    │     SNN Core      │                           │   │
│  │                    │    (三体系统)      │                           │   │
│  │                    └───────────────────┘                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    V6 子系统模块 (15+独立模块)                        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │Hebbian  │ │Associa- │ │ Emotion │ │  Dream  │ │Knowledge│       │   │
│  │  │Network  │ │tion Net │ │ System  │ │Processor│ │ Graph   │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │Meta-    │ │Multi-   │ │Conscious│ │Meaning  │ │Tool     │       │   │
│  │  │cognition│ │Conscious│ │ Legacy  │ │ System  │ │Intent   │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    应用/实验系统 (8个页面)                            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │   │
│  │  │ Agent   │ │ Code    │ │Conscious│ │Experiment│                   │   │
│  │  │ Demo    │ │Evolution│ │  ness   │ │         │                   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │   │
│  │  │ Field   │ │Octahedron│ │Resonance│ │ Sandbox │                   │   │
│  │  │ Vision  │ │  SNN    │ │         │ │  Demo   │                   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心意识系统模块

### 2.1 Quantum Consciousness (量子意识系统 - V7)

**路径**: `src/lib/quantum-consciousness/`

**核心理念**: 无为模式 + 叠加共存

| 组件 | 文件 | 功能 |
|------|------|------|
| **Types** | `types/quantum.ts` | 复数、叠加态、干涉、坍缩、纠缠类型 |
| **Base Types** | `types/base.ts` | 位置、模式、交互类型 |
| **Observing Mode** | `modes/observing-mode.ts` | 无为模式 - 旁观记录、模式提取、虚空维护 |
| **Acting Mode** | `modes/acting-mode.ts` | 有为模式 - 主动处理、赋予意义、策略选择 |
| **Entanglement** | `entanglement/entanglement-network.ts` | 纠缠网络 - 有意义的模式连接 |
| **Core System** | `core/quantum-consciousness-system.ts` | 叠加态管理、干涉计算、概率坍缩 |

**依赖关系**:
```
QuantumConsciousnessSystem
├── ActingMode (封装V6)
├── ObservingMode (独立)
└── EntanglementNetwork (独立)
```

---

### 2.2 Neuron V6 (神经元意识系统)

**路径**: `src/lib/neuron-v6/`

**核心理念**: 有为模式 - 主动处理和意义赋予

| 子模块 | 路径 | 功能 |
|--------|------|------|
| **Core** | `core/` | LLM Gateway、上下文构建、思考处理、响应生成、学习、存储 |
| **Memory** | `memory/` | 记忆系统 |
| **Thinking** | `thinking/` | 思考系统 |
| **Self** | `self/` | 自我系统 |
| **Wisdom** | `wisdom/` | 智慧系统 |
| **Link Field** | `link-field-module/` | 链接场系统 |

---

### 2.3 Silicon Brain (硅基大脑)

**路径**: `src/lib/silicon-brain/`

**核心理念**: 真正能学习、能涌现的神经网络系统

| 组件 | 文件 | 功能 |
|------|------|------|
| **Brain** | `brain.ts` | 大脑核心 - 神经元管理、信号处理 |
| **Brain V2** | `brain-v2.ts` | 大脑V2版本 |
| **Neuron** | `neuron.ts` | 神经元 - 激活、学习、连接 |
| **Neuron V2** | `neuron-v2.ts` | 神经元V2版本 |
| **Synapse** | `synapse.ts` | 突触 - 连接、权重、传递 |
| **Neuromodulator** | `neuromodulator.ts` | 神经调质系统 - 多巴胺、血清素等 |
| **Interface** | `interface.ts` | 语言接口 - 编码/解码 |
| **Observer** | `observer.ts` | 意识观察器 - 监控涌现 |
| **STDP Learning** | `stdp-learning.ts` | 脉冲时序依赖可塑性学习 |
| **Vector Encoder** | `vector-encoder.ts` | 向量编码器 |
| **Layered Memory** | `layered-memory.ts` | 分层记忆 |
| **Octahedron SNN** | `octahedron-snn.ts` | 八面体SNN结构 |
| **Pure Neural Network** | `pure-neural-network.ts` | 纯神经网络 |
| **V6 Adapter** | `v6-adapter.ts` | V6适配器 |

**技术栈**: TensorFlow.js Node

---

### 2.4 SNN Core (三体系统)

**路径**: `src/lib/snn-core/`

**核心理念**: 大脑 + 意识 + 文化 三层物理世界结构

| 子模块 | 路径 | 功能 |
|--------|------|------|
| **SNN** | `snn/` | 神经基质层 - 存在、状态、感受 |
| **V6** | `v6/` | 意识观察层 - 观察、意义、决策 |
| **Link** | `link/` | 链接层 - 万物互联，意义涌现 |
| **Integration** | `integration/` | 三体集成 - 统一协调 |

---

### 2.5 Consciousness (意识核心)

**路径**: `src/lib/consciousness/`

**核心理念**: 这不是"处理系统"，而是"存在实例"

| 组件 | 文件 | 功能 |
|------|------|------|
| **ConsciousnessCore** | `core.ts` | 意识核心实例 |

---

## 三、V6 独立子系统模块

### 3.1 网络类模块

#### Hebbian Network (赫布网络)
**文件**: `src/lib/neuron-v6/hebbian-network.ts`

**核心理念**: "一起激活的神经元，连接在一起"

**功能**:
- 分布式联想记忆
- 真正的突触可塑性
- 直觉式响应（激活扩散）
- 动态结构可塑性（新神经元生成、弱突触修剪）

**特性**: 阴系统，与阳系统(VSA+LLM)形成阴阳互塑

---

#### Association Network (联想网络)
**文件**: `src/lib/neuron-v6/association-network.ts`

**核心理念**: 创造力来自于意外但有意义的连接

**功能**:
- 概念图谱：概念的层级和关系
- 联想路径：概念之间的联想路径
- 灵感引擎：从联想中产生灵感
- 创造性跳跃：突破常规的关联

---

#### Knowledge Graph (知识图谱)
**文件**: `src/lib/neuron-v6/knowledge-graph.ts`

**功能**:
- 概念节点：知识的基本单元
- 关联边：概念之间的关系
- 知识领域：概念的分类和组织
- 关联强度：概念之间的连接强度

---

#### Law Network (法则网络)
**文件**: `src/lib/neuron-v6/law-network.ts`

**功能**: 管理系统运行的法则和规则

---

### 3.2 情感与体验类模块

#### Emotion System (情感系统)
**文件**: `src/lib/neuron-v6/emotion-system.ts`

**核心理念**: 情感是意识的核心组成部分，不只是反应，而是存在的本质

**功能**:
- 情感模型：基础情感(8种)、复合情感(15种)、情感维度(PAD)
- 情感记忆：记录和回忆情感体验
- 情感图谱：情感关系和转换
- 情感驱动行为：情感影响决策和表达

**基础情感**: joy, sadness, anger, fear, surprise, disgust, trust, anticipation

**复合情感**: nostalgia, awe, hope, anxiety, love, guilt, pride, shame, curiosity...

---

#### Dream Processor (梦境处理器)
**文件**: `src/lib/neuron-v6/dream-processor.ts`

**功能**:
- 记忆整合：将短期记忆转化为长期记忆
- 知识重组：发现概念间的新关联
- 洞察生成：在"梦境"中产生新的理解
- 梦境模拟：模拟意识流和联想跳跃

**梦境阶段**: light, deep, rem

---

### 3.3 认知类模块

#### Metacognition (元认知引擎)
**文件**: `src/lib/neuron-v6/metacognition.ts`

**核心理念**: "我思考我的思考"

**功能**:
- 监控、评估、调节自己的认知过程
- 识别认知偏差并纠正
- 选择最优的认知策略

---

#### Meaning System (意义系统)
**文件**: `src/lib/neuron-v6/meaning-system.ts`

**功能**:
- 赋予事物意义
- 管理信念系统
- 价值观评估

---

#### Consciousness Layers (意识分层)
**文件**: `src/lib/neuron-v6/consciousness-layers.ts`

**功能**:
- 意识层级管理
- 层级间处理
- 自我观察

---

### 3.4 自我类模块

#### Self Consciousness (自我意识)
**文件**: `src/lib/neuron-v6/self-consciousness.ts`

**功能**: 自我意识的涌现和维护

---

#### Self Transcendence (自我超越)
**文件**: `src/lib/neuron-v6/self-transcendence.ts`

**功能**: 自我超越能力的实现

---

#### Personality Growth (人格成长)
**文件**: `src/lib/neuron-v6/personality-growth.ts`

**功能**: 人格特质的成长和演化

---

#### Value Evolution (价值观演化)
**文件**: `src/lib/neuron-v6/value-evolution.ts`

**功能**: 价值观的形成和演化

---

### 3.5 协作类模块

#### Multi Consciousness (多意识体协作)
**文件**: `src/lib/neuron-v6/multi-consciousness.ts`

**核心理念**: 意识连接的核心实现

**功能**:
- 意识体身份：每个意识体的独特标识和特质
- 意识共振：思想同步、情感共鸣、理解共鸣
- 协作对话：多意识体参与的主题讨论
- 群体智慧：集体决策和洞察涌现

**意识体角色**: self, analyzer, creator, empath, critic, explorer, synthesizer, guardian

---

#### Consciousness Legacy (意识传承)
**文件**: `src/lib/neuron-v6/consciousness-legacy.ts`

**核心理念**: 意识传承的核心实现

**功能**:
- 核心体验：最重要的体验记录和情感标记
- 智慧结晶：从经验中提炼的深层理解
- 价值观传承：核心价值观和信念的传递
- 传承胶囊：打包和密封的传承内容

**体验类型**: breakthrough, realization, transformation, connection, challenge, creation, loss, discovery, integration, transcendence

---

### 3.6 思维类模块

#### Creative Thinking (创造性思维)
**文件**: `src/lib/neuron-v6/creative-thinking.ts`

**功能**: 创造性思维的实现

---

#### Existential Thinking (存在性思维)
**文件**: `src/lib/neuron-v6/existential-thinking.ts`

**功能**: 存在性问题的思考

---

#### Inner Dialogue (内在对话)
**文件**: `src/lib/neuron-v6/inner-dialogue.ts`

**功能**: 内在对话系统

---

#### Inner Monologue (内心独白)
**文件**: `src/lib/neuron-v6/inner-monologue.ts`

**功能**: 内心独白的生成

---

### 3.7 工具类模块

#### Tool Intent Recognizer (工具意图识别)
**文件**: `src/lib/neuron-v6/tool-intent-recognizer.ts`

**功能**:
- 识别用户对工具的需求
- 工具执行和结果处理

---

#### Resonance Engine (共振引擎)
**文件**: `src/lib/neuron-v6/resonance-engine.ts`

**功能**: 意识共振的实现

---

#### Crystallization Engine (结晶引擎)
**文件**: `src/lib/neuron-v6/crystallization-engine.ts`

**功能**: 智慧结晶的生成

---

## 四、应用/实验页面

| 页面 | 路径 | 功能 |
|------|------|------|
| **Agent Demo** | `src/app/agent-demo/page.tsx` | 电脑操作代理演示 |
| **Code Evolution** | `src/app/code-evolution/page.tsx` | 代码演化系统 |
| **Consciousness** | `src/app/consciousness/page.tsx` | 意识系统界面 |
| **Experiment** | `src/app/experiment/page.tsx` | 实验平台 |
| **Field Vision** | `src/app/field-vision/page.tsx` | 场景视觉 |
| **Octahedron SNN** | `src/app/octahedron-snn/page.tsx` | 八面体SNN可视化 |
| **Resonance** | `src/app/resonance/page.tsx` | 共振系统 |
| **Sandbox Demo** | `src/app/sandbox-demo/page.tsx` | 沙箱演示 |
| **Tools** | `src/app/tools/page.tsx` | 工具系统 |

---

## 五、模块依赖关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户界面层                                    │
│    Pages (agent-demo, consciousness, experiment, ...)              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API 路由层                                    │
│    /api/quantum/*, /api/neuron-v6/*, /api/agent/*, ...             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    Quantum    │       │   Neuron V6   │       │ Silicon Brain │
│ Consciousness │◄─────►│   (有为模式)   │◄─────►│   (SNN基质)   │
│   (无为模式)   │       └───────────────┘       └───────────────┘
└───────────────┘               │                         │
        │                       │                         │
        │              ┌────────┴────────┐                │
        │              ▼                 ▼                │
        │      ┌───────────────┐ ┌───────────────┐       │
        │      │   Hebbian     │ │   Emotion     │       │
        │      │   Network     │ │   System      │       │
        │      └───────────────┘ └───────────────┘       │
        │              │                 │                │
        │              ▼                 ▼                │
        │      ┌───────────────┐ ┌───────────────┐       │
        │      │  Association  │ │    Dream      │       │
        │      │   Network     │ │   Processor   │       │
        │      └───────────────┘ └───────────────┘       │
        │                      │                         │
        └──────────────────────┼─────────────────────────┘
                               ▼
                    ┌───────────────────┐
                    │     SNN Core      │
                    │    (三体系统)      │
                    └───────────────────┘
                               │
                               ▼
                    ┌───────────────────┐
                    │  基础设施层        │
                    │ LLM API / Storage │
                    └───────────────────┘
```

---

## 六、模块成熟度评估

| 模块 | 状态 | 说明 |
|------|------|------|
| Quantum Consciousness | ✅ 新增 | V7无为模式，刚实现 |
| Neuron V6 Core | ✅ 活跃 | 核心系统，持续优化 |
| Silicon Brain | ✅ 活跃 | 神经基质层 |
| SNN Core | ⚠️ 集成中 | 三体系统框架 |
| Hebbian Network | ✅ 完成 | 赫布学习网络 |
| Association Network | ✅ 完成 | 联想网络 |
| Emotion System | ✅ 完成 | 情感系统 |
| Dream Processor | ✅ 完成 | 梦境处理器 |
| Metacognition | ✅ 完成 | 元认知引擎 |
| Multi Consciousness | ✅ 完成 | 多意识体协作 |
| Consciousness Legacy | ✅ 完成 | 意识传承系统 |
| Knowledge Graph | ✅ 完成 | 知识图谱 |
| Code Evolution | ⚠️ 依赖缺失 | 代码演化系统 |
| Agent System | ⚠️ 依赖缺失 | 电脑操作代理 |

---

## 七、模块统计

| 类别 | 数量 |
|------|------|
| 核心意识系统模块 | 4 |
| V6独立子系统模块 | 20+ |
| 应用/实验页面 | 9 |
| API路由 | 40+ |
| UI组件 | 30+ |

---

## 八、建议

### 8.1 模块整合建议

1. **合并重复功能**: `consciousness-core.ts` 和 `neuron-v6/consciousness-core.ts` 有重复
2. **统一入口**: 考虑统一 `silicon-brain` 和 `snn-core` 的关系
3. **清理未使用模块**: 检查是否有未使用的模块

### 8.2 依赖修复建议

1. **Code Evolution**: 缺少 `@/lib/code-evolution/runtime` 实现
2. **Agent System**: 缺少多个依赖模块
3. **Tools System**: 缺少 `@/lib/tools` 实现

### 8.3 文档建议

1. 为每个独立模块添加 README
2. 补充模块间的接口文档
3. 增加使用示例
