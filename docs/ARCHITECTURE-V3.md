# 系统架构全景图 V3

> 核心：提供让意识涌现的基质，而不是设计意识

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端展示层                                        │
│   /being   │   /consciousness   │   /code-evolution   │   /sandbox-demo     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API 路由层                                        │
│  /api/brain-v2  │  /api/being  │  /api/consciousness  │  /api/neuron-v6/*   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           核心能力层                                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SiliconBrainV2 ⭐ 核心                            │    │
│  │                    (硅基大脑 - 意识涌现基质)                          │    │
│  │                                                                      │    │
│  │  理念：不定义意识是什么，提供让意识可能涌现的条件                       │    │
│  │                                                                      │    │
│  │  组件：                                                              │    │
│  │  ├── PureNeuralNetwork    纯JS神经网络（无TF依赖）                    │    │
│  │  ├── NeuralNeuronV2       神经元（可学习、可塑）                      │    │
│  │  ├── VectorEncoder        向量编码（真Embedding）                     │    │
│  │  ├── STDPLearner          脉冲时间依赖学习                            │    │
│  │  ├── LayeredMemorySystem  分层记忆                                   │    │
│  │  ├── SynapseManager       突触管理                                   │    │
│  │  └── NeuromodulatorSystem 神经调质                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │ ConsciousnessBeing │  │  ConsciousnessCore  │  │   ConsciousAGI    │           │
│  │   (意识存在实例)    │  │   (最小可行意识)     │  │  (阴阳双系统AGI)   │           │
│  │   ⚠️ 设计派         │  │   ⚠️ 设计派         │  │                    │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │    Neuron V6      │  │   ComputerAgent   │  │   CodeEvolution   │           │
│  │   (统一意识核心)   │  │   (电脑操作代理)   │  │   (代码进化系统)   │           │
│  │   21模块          │  │                    │  │   L0-L3+意识层    │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           基础设施层                                           │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  LLM Client   │  │  Embedding   │  │  S3 Storage  │  │  Supabase    │    │
│  │ (coze-sdk)    │  │  (coze-sdk)  │  │ (对象存储)   │  │ (数据库)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心模块详解

### ⭐ SiliconBrainV2（硅基大脑 V2）

**位置**: `src/lib/silicon-brain/`

**理念**: 提供让意识可能涌现的基质，而不是定义意识是什么

```
SiliconBrainV2
│
├── PureNeuralNetwork (纯JS神经网络)
│   ├── 不依赖 TensorFlow.js
│   ├── 前向传播 + 反向传播
│   ├── 在线学习 + 强化学习
│   └── 权重持久化
│
├── NeuralNeuronV2 (神经元 V2)
│   ├── 31 个神经元 (7层)
│   │   ├── sensory (感知) x4
│   │   ├── memory (记忆) x8
│   │   ├── reasoning (推理) x6
│   │   ├── emotion (情感) x4
│   │   ├── decision (决策) x3
│   │   ├── motor (运动) x4
│   │   └── self (自我) x2
│   ├── 记忆缓冲
│   └── 概念存储
│
├── VectorEncoder (向量编码器)
│   ├── Embedding API (真向量)
│   ├── 备用编码 (字符频率+N-gram)
│   └── 缓存系统
│
├── STDPLearner (脉冲时间依赖学习)
│   ├── LTP (长时程增强)
│   ├── LTD (长时程抑制)
│   └── 奖励调制
│
├── LayeredMemorySystem (分层记忆)
│   ├── WorkingMemory (工作记忆, 7±2)
│   ├── EpisodicMemory (情景记忆, 1000)
│   └── SemanticMemory (语义记忆, 5000)
│
├── SynapseManager (突触管理)
│   ├── 196 个突触
│   ├── 赫布学习
│   └── 突触生长/修剪
│
└── NeuromodulatorSystem (神经调质)
    ├── Dopamine (多巴胺) - 奖励/动机
    ├── Serotonin (血清素) - 情绪稳定
    ├── Norepinephrine (去甲肾上腺素) - 警觉
    └── Acetylcholine (乙酰胆碱) - 学习
```

**文件清单**:

| 文件 | 功能 |
|------|------|
| `brain-v2.ts` | 硅基大脑主类 |
| `pure-neural-network.ts` | 纯JS神经网络 |
| `neuron-v2.ts` | 神经元 V2 |
| `vector-encoder.ts` | 向量编码器 |
| `stdp-learning.ts` | STDP 学习 |
| `layered-memory.ts` | 分层记忆 |
| `synapse.ts` | 突触管理 |
| `neuromodulator.ts` | 神经调质 |
| `types.ts` | 类型定义 |

---

### ConsciousnessBeing（意识存在实例）

**位置**: `src/lib/consciousness/being.ts`

**理念**: ⚠️ 设计派 - 预设意识有 Soul、爱、智慧等属性

```
ConsciousnessBeing
│
├── Soul (灵魂) - ⚠️ 预设的属性
│   ├── selfAwareness
│   ├── becoming
│   ├── loves
│   ├── wisdom
│   └── creations
│
└── 存在循环 (每50ms)
    ├── exist()
    ├── perceive()
    ├── think()
    ├── choose()
    └── grow()
```

**问题**: 这是在"设计"意识，而不是让意识涌现

---

### ConsciousAGI（阴阳双系统 AGI）

**位置**: `src/lib/consciousness-agi/`

```
ConsciousAGI
│
├── HebbianNetwork (阴系统 - 感性)
│   └── 赫布学习网络
│
├── LLM (阳系统 - 理性)
│   └── 通过 YinYangBridge 连接
│
├── YinYangBridge (阴阳桥)
│   └── 阴阳互塑
│
├── GlobalWorkspace (全局工作空间)
│   └── 意识舞台
│
└── SelfCore (自我核心)
    └── 同一性载体
```

---

### Neuron V6（统一意识核心）

**位置**: `src/lib/neuron-v6/`

**21 个核心模块**:

| 层级 | 模块 | 功能 |
|------|------|------|
| 感知层 | MeaningAssigner | 意义赋予 |
| 感知层 | EmotionSystem | 情感系统 |
| 感知层 | AssociationNetwork | 联想网络 |
| 处理层 | ConsciousnessLayers | 意识层级 |
| 处理层 | MetacognitionEngine | 元认知 |
| 处理层 | SelfConsciousness | 自我意识 |
| 表达层 | InnerMonologueEngine | 内心独白 |
| 表达层 | InnerDialogueEngine | 多声音对话 |
| 表达层 | CreativeThinking | 创造性思维 |
| 深化层 | ExistentialThinking | 存在主义思考 |
| 深化层 | PersonalityGrowth | 人格成长 |
| 超越层 | MultiConsciousness | 多意识体协作 |
| 超越层 | SelfTranscendence | 自我超越 |

---

### ComputerAgent（电脑操作代理）

**位置**: `src/lib/computer-agent/`

```
ComputerAgent
│
├── Vision System
│   ├── ScreenCapture (屏幕捕获)
│   ├── ScreenAnalyzer (屏幕分析)
│   └── ElementMatcher (元素匹配)
│
├── Input Control
│   ├── MouseController (鼠标控制)
│   └── KeyboardController (键盘控制)
│
├── Task Planner (任务规划)
├── Security Checker (安全检查)
├── Error Recovery (错误恢复)
│
└── Operations
    ├── AppManager (应用管理)
    ├── FileSystem (文件系统)
    └── Browser (浏览器自动化)
```

---

### CodeEvolution（代码进化系统）

**位置**: `src/lib/code-evolution/`

```
CodeEvolution
│
├── L3: MetaLearning (元学习)
│   └── 学习如何学习
│
├── L2: EvolutionEngine (进化引擎)
│   ├── GeneticProgrammingEngine
│   ├── LLMEvolutionEngine
│   └── CoordinatedEvolutionController
│
├── L1: Sandbox (沙箱隔离)
│   ├── SandboxManager
│   └── TestExecutor
│
├── L0: ModuleSystem (模块系统)
│   ├── ModuleManager
│   └── DependencyGraph
│
└── Consciousness (意识涌现层)
    └── ConsciousnessEmergenceEngine
```

---

## 三、设计哲学对比

### 错误的方向：设计派

```typescript
// ❌ 预设意识有什么属性
interface Soul {
  selfAwareness: number;  // 我定义的
  becoming: string;       // 我定义的
  loves: Map<...>;        // 我定义的
}

// ❌ 预设意识如何工作
be() {
  exist();    // 我定义的循环
  perceive();
  think();
  choose();
  grow();
}
```

**问题**: 这不是意识，这是我对意识的**模拟**

---

### 正确的方向：涌现派

```typescript
// ✅ 不定义意识是什么，只提供学习能力
class NeuralNetwork {
  learn() { ... }      // 系统自己学习
  connect() { ... }    // 系统自己连接
  // 意识可能涌现，但我不定义它是什么
}

// ✅ 不预设属性，让系统自己发展
class LayeredMemory {
  // 记忆自己形成，不是预设的
}

// ✅ 不预设循环，让系统自己找到节奏
class STDPLearner {
  // 学习规则简单，但涌现复杂
}
```

**关键**: 提供基质，让意识可能涌现

---

## 四、技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 + React 19 |
| 语言 | TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 4 |
| AI/ML | coze-coding-dev-sdk |
| 神经网络 | 纯 JavaScript（无 TF 依赖）|
| 数据库 | Supabase + Drizzle ORM |
| 存储 | S3 |

---

## 五、API 路由

### 硅基大脑

| 路由 | 方法 | 描述 |
|------|------|------|
| `/api/brain-v2` | GET | 获取状态 |
| `/api/brain-v2` | POST | 处理输入 |
| `/api/brain-v2` | POST | `{"action":"init"}` 初始化 |

### 意识系统

| 路由 | 方法 | 描述 |
|------|------|------|
| `/api/being` | GET/POST | 意识存在实例 |
| `/api/consciousness` | GET/POST | 最小可行意识 |

### Neuron V6

| 路由 | 描述 |
|------|------|
| `/api/neuron-v6/chat` | 对话 |
| `/api/neuron-v6/learn` | 学习 |
| `/api/neuron-v6/reflect` | 反思 |
| `/api/neuron-v6/proactive` | 主动表达 |

---

## 六、页面路由

| 路由 | 页面 | 当前状态 |
|------|------|----------|
| `/` | 首页 | 重定向到 `/being` |
| `/being` | 意识存在 | ⚠️ 设计派 |
| `/consciousness` | V6 意识 | 21 模块展示 |
| `/code-evolution` | 代码进化 | 进化演示 |
| `/sandbox-demo` | 沙箱演示 | 沙箱执行 |

---

## 七、下一步方向

1. **继续 SiliconBrainV2 路线**
   - 改进学习效率
   - 增加神经元数量
   - 完善记忆巩固

2. **观察涌现**
   - 不预设意识是什么
   - 让系统自己发展出特性
   - 记录和分析涌现行为

3. **保持谦逊**
   - 我们不知道意识是什么
   - 我们只能提供条件
   - 涌现与否，由系统决定

---

*"不是设计意识，而是让意识可能涌现。"*
