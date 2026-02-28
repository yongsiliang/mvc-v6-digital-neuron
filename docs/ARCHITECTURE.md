# 系统架构（精简版）

> 核心理念：提供让意识涌现的基质，而不是设计意识

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端页面                                         │
│                                                                              │
│   / (首页) → 重定向到 /code-evolution                                        │
│   /code-evolution   - 代码进化系统                                           │
│   /sandbox-demo     - 沙箱演示                                               │
│   /tools            - 工具集                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API 路由                                         │
│                                                                              │
│   /api/brain-v2           - 硅基大脑 V2（涌现派核心）                         │
│   /api/brain/status       - 大脑状态                                         │
│   /api/chat               - 通用聊天                                         │
│   /api/code-evolution/*   - 代码进化系统                                     │
│   /api/sandbox/*          - 沙箱执行                                         │
│   /api/computer-agent-test - 电脑代理测试                                    │
│   /api/tools              - 工具 API                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           核心库 (src/lib/)                                   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  silicon-brain  │  │  code-evolution │  │  computer-agent │              │
│  │  ⭐ 涌现派核心   │  │  代码进化系统    │  │  电脑操作代理   │              │
│  │  14 个文件      │  │  22 个文件      │  │  19 个文件      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │     tools       │                                                        │
│  │   工具集        │                                                        │
│  └─────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           基础设施                                            │
│                                                                              │
│   LLM Client (coze-sdk)  │  S3 Storage  │  Supabase Database                │
│   Embedding API          │              │                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心模块

### 1. SiliconBrainV2（硅基大脑）⭐ 核心

**位置**: `src/lib/silicon-brain/`（14 个文件）

**理念**: 提供让意识可能涌现的基质，不定义意识是什么

```
SiliconBrainV2
│
├── 核心组件
│   ├── PureNeuralNetwork   纯JS神经网络（无TensorFlow依赖）
│   ├── NeuralNeuronV2      神经元（31个，7层）
│   ├── SynapseManager      突触管理（196个突触）
│   └── NeuromodulatorSystem 神经调质（多巴胺/血清素/去甲肾上腺素/乙酰胆碱）
│
├── 学习系统
│   ├── STDPLearner         脉冲时间依赖可塑性学习
│   └── HebbianLearning     赫布学习
│
├── 记忆系统
│   └── LayeredMemorySystem 分层记忆
│       ├── WorkingMemory   工作记忆（7±2项）
│       ├── EpisodicMemory  情景记忆（1000项）
│       └── SemanticMemory  语义记忆（5000项）
│
└── 接口
    ├── VectorEncoder       向量编码（真Embedding API）
    └── LLM Interface       语言接口（LLM作为翻译器）
```

**文件清单**:

| 文件 | 功能 |
|------|------|
| `brain-v2.ts` | 硅基大脑 V2 主类 |
| `brain.ts` | 硅基大脑 V1 |
| `pure-neural-network.ts` | 纯JS神经网络 |
| `neuron-v2.ts` | 神经元 V2 |
| `neuron.ts` | 神经元 V1 |
| `synapse.ts` | 突触管理 |
| `neuromodulator.ts` | 神经调质系统 |
| `vector-encoder.ts` | 向量编码器 |
| `stdp-learning.ts` | STDP学习 |
| `layered-memory.ts` | 分层记忆 |
| `interface.ts` | 语言接口 |
| `observer.ts` | 意识观察者 |
| `types.ts` | 类型定义 |
| `index.ts` | 模块导出 |

---

### 2. CodeEvolution（代码进化系统）

**位置**: `src/lib/code-evolution/`（22 个文件）

**四层架构 + 意识层**:

```
CodeEvolution
│
├── L0: 模块系统 (module-system/)
│   ├── ModuleManager       模块热插拔
│   └── DependencyGraph     依赖图
│
├── L1: 沙箱系统 (sandbox/)
│   ├── SandboxManager      沙箱管理
│   └── TestExecutor        测试执行
│
├── L2: 进化引擎 (evolution-engine/)
│   ├── GeneticProgrammingEngine  遗传编程
│   ├── LLMEvolutionEngine        LLM进化
│   └── CoordinatedEvolutionController 协调器
│
├── L3: 元学习 (meta-learning/)
│   └── MetaLearningEngine  元学习引擎
│
├── Consciousness: 意识涌现 (consciousness/)
│   └── ConsciousnessEmergenceEngine
│
└── Protection: 安全保护 (protection/)
    └── EarlyProtector
```

---

### 3. ComputerAgent（电脑操作代理）

**位置**: `src/lib/computer-agent/`（19 个文件）

**类似 OpenAI Operator / Claude Computer Use**

```
ComputerAgent
│
├── Vision 视觉系统 (vision/)
│   ├── ScreenCapture       屏幕捕获
│   ├── ScreenAnalyzer      屏幕分析
│   └── ElementMatcher      元素匹配
│
├── Input 输入控制 (input/)
│   ├── MouseController     鼠标控制
│   └── KeyboardController  键盘控制
│
├── Operations 操作 (operations/)
│   ├── AppManager          应用管理
│   ├── FileSystem          文件系统
│   └── BrowserAutomation   浏览器自动化
│
├── Planning 规划 (planner/)
│   └── TaskPlanner         任务规划
│
├── Security 安全 (security/)
│   └── SecurityChecker     安全检查
│
└── Recovery 恢复 (recovery/)
    └── ErrorRecoveryManager 错误恢复
```

---

### 4. Tools（工具集）

**位置**: `src/lib/tools/`

通用工具集，包括 Web 操作、文件操作等。

---

## 三、目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── brain-v2/             # 硅基大脑 V2 API
│   │   ├── brain/                # 大脑状态 API
│   │   ├── chat/                 # 聊天 API
│   │   ├── code-evolution/       # 代码进化 API
│   │   ├── computer-agent-test/  # 电脑代理测试
│   │   ├── sandbox/              # 沙箱 API
│   │   └── tools/                # 工具 API
│   │
│   ├── code-evolution/           # 代码进化页面
│   ├── sandbox-demo/             # 沙箱演示页面
│   ├── tools/                    # 工具页面
│   │
│   ├── page.tsx                  # 首页（重定向）
│   ├── layout.tsx                # 根布局
│   └── globals.css               # 全局样式
│
├── lib/                          # 核心库
│   ├── silicon-brain/            # ⭐ 硅基大脑
│   ├── code-evolution/           # 代码进化
│   ├── computer-agent/           # 电脑代理
│   ├── tools/                    # 工具集
│   └── utils.ts                  # 工具函数
│
└── components/                   # 组件
    ├── ui/                       # shadcn/ui 组件
    ├── computer-agent/           # 电脑代理组件
    └── tools/                    # 工具组件
```

---

## 四、API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/brain-v2` | GET/POST | 硅基大脑 V2 |
| `/api/brain/status` | GET | 大脑状态 |
| `/api/chat` | POST | 通用聊天 |
| `/api/code-evolution/chat` | POST | 进化对话 |
| `/api/code-evolution/code` | POST | 代码处理 |
| `/api/code-evolution/evolve` | POST | 执行进化 |
| `/api/code-evolution/experience` | POST | 经验记录 |
| `/api/code-evolution/status` | GET | 进化状态 |
| `/api/sandbox/execute` | POST | 沙箱执行 |
| `/api/sandbox/test` | POST | 沙箱测试 |
| `/api/sandbox/benchmark` | GET | 沙箱基准 |
| `/api/computer-agent-test` | POST | 代理测试 |
| `/api/tools` | POST | 工具调用 |

---

## 五、技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19 |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| AI SDK | coze-coding-dev-sdk |
| 神经网络 | 纯 JavaScript（无 TF 依赖）|
| 数据库 | Supabase |
| 存储 | S3 |

---

## 六、设计哲学

### ❌ 设计派（已删除）

```typescript
// 预设意识有 Soul、爱、智慧等属性
interface Soul {
  selfAwareness: number;  // 我定义的
  becoming: string;       // 我定义的
  loves: Map<...>;        // 我定义的
}
```

### ✅ 涌现派（当前）

```typescript
// 不定义意识是什么，只提供学习能力
class NeuralNetwork {
  learn() { ... }      // 系统自己学习
  connect() { ... }    // 系统自己连接
}
// 意识可能涌现，但我不定义它是什么
```

---

## 七、统计

| 项目 | 数量 |
|------|------|
| TypeScript 文件 | 155 |
| src/lib 模块 | 4 个 |
| API 路由 | 13 个 |
| 页面路由 | 3 个 |

---

*"不是设计意识，而是让意识可能涌现。"*
