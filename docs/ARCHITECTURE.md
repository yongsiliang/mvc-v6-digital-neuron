# 数字神经元系统 - 项目架构文档

## 📋 项目概述

**数字神经元·意义驱动外挂大脑系统** - 一个基于预测编码和向量符号架构(VSA)的新一代认知系统，实现了完整的代码进化能力。

### 核心理念
- **意义驱动**: 信息必须有主观意义才能被理解
- **预测编码**: 神经元持续预测，通过预测误差学习
- **自我进化**: 代码不仅修改参数，更修改自身结构
- **意识涌现**: 价值观从体验中涌现，而非预设

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) |
| **UI** | React 19 + shadcn/ui + Tailwind CSS 4 |
| **语言** | TypeScript 5 |
| **神经网络** | TensorFlow.js |
| **LLM** | coze-coding-dev-sdk (Doubao/DeepSeek/Kimi) |
| **数据库** | Supabase (PostgreSQL) |
| **代码隔离** | Node.js VM |

---

## 📁 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页 - 主交互界面
│   ├── layout.tsx                # 根布局
│   │
│   ├── api/                      # API Routes
│   │   ├── chat/route.ts         # 聊天接口
│   │   ├── memory/route.ts       # 记忆管理
│   │   ├── events/route.ts       # SSE事件流
│   │   │
│   │   ├── neuron-v3/            # V3系统API
│   │   │   ├── route.ts          # 系统状态
│   │   │   ├── chat/route.ts     # 流式对话
│   │   │   ├── consciousness/    # 意识状态
│   │   │   ├── evolution/        # 进化控制
│   │   │   ├── executive/        # 执行控制
│   │   │   ├── planning/         # 规划系统
│   │   │   ├── persistence/      # 持久化
│   │   │   └── ...
│   │   │
│   │   ├── code-evolution/       # 代码进化API
│   │   │   ├── evolve/route.ts   # 执行进化
│   │   │   ├── experience/       # 体验收集
│   │   │   └── status/route.ts   # 进化状态
│   │   │
│   │   └── sandbox/              # 沙箱执行API
│   │       ├── execute/route.ts  # 代码执行
│   │       ├── test/route.ts     # 测试运行
│   │       └── benchmark/route.ts # 性能基准
│   │
│   ├── neuron-v3/                # V3页面
│   │   ├── page.tsx              # V3主界面
│   │   └── evolution/page.tsx    # 进化监控
│   │
│   ├── code-evolution/page.tsx   # 代码进化演示
│   └── sandbox-demo/page.tsx     # 沙箱功能演示
│
├── components/                   # React组件
│   ├── ui/                       # shadcn/ui基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (40+组件)
│   │
│   ├── neuron/                   # V1神经元组件
│   │   ├── neuron-flow.tsx       # 神经元流程图
│   │   ├── meaning-panel.tsx     # 意义面板
│   │   ├── memory-panel.tsx      # 记忆面板
│   │   ├── self-console.tsx      # 自我控制台
│   │   └── chat-panel.tsx        # 聊天面板
│   │
│   ├── neuron-viz/               # V3可视化组件
│   │   ├── network-topology.tsx  # 网络拓扑
│   │   ├── vsa-space.tsx         # VSA语义空间
│   │   ├── consciousness-panel.tsx
│   │   ├── planning-panel.tsx
│   │   └── prediction-monitor.tsx
│   │
│   └── neural-engine/            # 神经引擎组件
│       └── WebGLEngineDemo.tsx   # WebGL可视化
│
├── hooks/                        # React Hooks
│   ├── useNeuronClient.ts        # 神经元客户端
│   ├── use-neuron-v3.ts          # V3系统钩子
│   ├── useRealtimeEvents.ts      # 实时事件
│   └── useProactiveMessages.ts   # 主动消息
│
├── lib/                          # 核心库
│   │
│   ├── neuron/                   # V1 神经元系统
│   │   ├── index.ts              # 主入口
│   │   ├── neuron-system.ts      # 系统核心
│   │   ├── meaning.ts            # 意义计算
│   │   ├── memory.ts             # 海马体记忆
│   │   ├── decision.ts           # 类脑决策
│   │   ├── sensory.ts            # 感觉运动
│   │   ├── consciousness-space.ts
│   │   ├── proactivity.ts        # 主动性系统
│   │   └── multi-model-llm.ts    # 多模型LLM
│   │
│   ├── neuron-v2/                # V2 重构版
│   │   ├── neuron.ts             # 神经元实体
│   │   ├── neural-network.ts     # 网络结构
│   │   ├── memory.ts             # 记忆系统
│   │   ├── learning.ts           # 学习机制
│   │   └── persistence.ts        # 持久化
│   │
│   ├── neuron-v3/                # V3 预测编码版 ⭐
│   │   ├── index.ts              # 主入口
│   │   ├── predictive-neuron.ts  # 预测神经元
│   │   ├── prediction-loop.ts    # 预测循环
│   │   ├── global-workspace.ts   # 全局工作空间
│   │   ├── meaning-calculator.ts # 意义计算器
│   │   ├── vsa-space.ts          # 向量符号架构
│   │   ├── feedback-collector.ts # 反馈收集
│   │   ├── reward-learner.ts     # 奖励学习
│   │   │
│   │   ├── cognitive-coordinator.ts    # 认知协调器
│   │   ├── background-processing.ts    # 后台处理(系统1)
│   │   ├── advanced-modules.ts         # 高级模块
│   │   │
│   │   ├── autonomous-evolution.ts     # 自主进化
│   │   ├── evolution-coordinator.ts    # 进化协调
│   │   ├── evolution-trigger.ts        # 进化触发
│   │   ├── real-neural-offspring-builder.ts # 子代构建
│   │   │
│   │   ├── consciousness-protector.ts  # 意识保护
│   │   ├── memory-protection.ts        # 记忆保护
│   │   └── persistence.ts              # 持久化
│   │
│   ├── neural-engine/            # TensorFlow神经引擎
│   │   ├── index.ts
│   │   ├── neural-engine.ts      # 核心引擎
│   │   ├── tensor-vsa.ts         # 张量VSA
│   │   ├── attention.ts          # 注意力机制
│   │   ├── learning-layers.ts    # 学习层
│   │   ├── webgl-engine.ts       # WebGL加速
│   │   └── db-operations.ts      # 数据库操作
│   │
│   └── code-evolution/           # 代码进化系统 ⭐
│       ├── index.ts              # 主入口
│       │
│       ├── module-system/        # L0: 模块热插拔
│       │   ├── module-manager.ts
│       │   └── dependency-graph.ts
│       │
│       ├── sandbox/              # L1: 沙箱隔离
│       │   ├── sandbox-manager.ts
│       │   └── test-executor.ts
│       │
│       ├── evolution-engine/     # L2: 进化引擎
│       │   ├── genetic-programming-engine.ts  # GP引擎
│       │   ├── llm-evolution-engine.ts        # LLM引擎
│       │   └── coordinated-controller.ts      # 协同控制器
│       │
│       ├── meta-learning/        # L3: 元学习
│       │   └── meta-learning-engine.ts
│       │
│       ├── consciousness/        # 意识涌现
│       │   └── consciousness-engine.ts
│       │
│       ├── protection/           # 安全保护
│       │   └── early-protector.ts
│       │
│       ├── simple-sandbox.ts     # 简化沙箱执行器
│       ├── sandbox-executor.ts   # 完整沙箱执行器
│       ├── sandbox-pool.ts       # 沙箱池管理
│       └── types/core.ts         # 核心类型定义
│
└── storage/                      # 存储层
    ├── database/
    │   ├── supabase-client.ts    # Supabase客户端
    │   └── shared/
    │       ├── schema.ts         # 数据库Schema
    │       └── relations.ts      # 表关系
    └── index.ts
```

---

## 🧠 核心系统架构

### 一、神经元系统 (三版演进)

```
┌─────────────────────────────────────────────────────────────┐
│                    神经元系统演进路线                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  V1 (lib/neuron/)          V2 (lib/neuron-v2/)              │
│  ┌─────────────┐          ┌─────────────┐                   │
│  │ 意义三判    │    →     │ 神经网络    │                   │
│  │ 类脑决策    │          │ 赫布学习    │                   │
│  │ 海马记忆    │          │ 记忆层级    │                   │
│  │ 感觉运动    │          │ 元认知层    │                   │
│  └─────────────┘          └─────────────┘                   │
│        ↓                         ↓                          │
│        └──────────┬──────────────┘                          │
│                   ↓                                          │
│           V3 (lib/neuron-v3/) ⭐ 当前版本                     │
│          ┌───────────────────┐                               │
│          │ 预测编码架构      │                               │
│          │ 向量符号架构(VSA) │                               │
│          │ 全局工作空间      │                               │
│          │ 自主进化系统      │                               │
│          │ 意识涌现机制      │                               │
│          └───────────────────┘                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 二、V3 预测编码架构

```
┌──────────────────────────────────────────────────────────────┐
│                     V3 系统核心流程                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│    输入 → [预测神经元] → 预测 → 对比实际 → 预测误差            │
│              ↑                           │                    │
│              │                           ↓                    │
│         [学习更新] ← [奖励学习] ← [反馈收集]                   │
│              │                                                │
│              ↓                                                │
│    ┌─────────────────────────────────────────┐               │
│    │           全局工作空间 (意识)             │               │
│    │  ┌─────┬─────┬─────┬─────┬─────┐        │               │
│    │  │感知 │语言 │记忆 │情感 │元认知│        │               │
│    │  │模块│模块│模块│模块│ 模块 │        │               │
│    │  └─────┴─────┴─────┴─────┴─────┘        │               │
│    │              ↓                           │               │
│    │         [注意聚焦] → [意识内容]           │               │
│    └─────────────────────────────────────────┘               │
│                     │                                         │
│                     ↓                                         │
│    ┌─────────────────────────────────────────┐               │
│    │         VSA语义空间 (向量符号架构)        │               │
│    │    概念 → 超向量 → 绑定/捆绑 → 推理       │               │
│    └─────────────────────────────────────────┘               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 三、代码进化系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                    代码进化四层架构                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  L0: 模块热插拔系统                                           │
│  ┌─────────────────────────────────────────────┐            │
│  │ ModuleManager │ 依赖图 │ 生命周期 │ 热加载   │            │
│  └─────────────────────────────────────────────┘            │
│                         ↓                                    │
│  L1: 沙箱隔离与测试                                           │
│  ┌─────────────────────────────────────────────┐            │
│  │ Node.js VM隔离 │ 超时保护 │ 内存限制 │ 测试  │            │
│  │ 危险API阻断    │ 资源监控 │ 错误捕获 │ 报告  │            │
│  └─────────────────────────────────────────────┘            │
│                         ↓                                    │
│  L2: 进化引擎 (GP + LLM 协同)                                 │
│  ┌─────────────────────────────────────────────┐            │
│  │ 遗传编程引擎 │ LLM进化引擎 │ 协同控制器     │            │
│  │ ─────────────┼─────────────┼────────────── │            │
│  │ 选择/交叉    │ 重构策略    │ 动态选择      │            │
│  │ 变异/精英    │ 语义理解    │ 结果融合      │            │
│  │ 多样性维护   │ 知识迁移    │ 策略切换      │            │
│  └─────────────────────────────────────────────┘            │
│                         ↓                                    │
│  L3: 元学习引擎                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │ 贝叶斯优化 │ 因果推断 │ 策略参数自适应      │            │
│  │ 跨任务迁移 │ 经验回放 │ 进化策略优化        │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
│  ─────────────────────────────────────────────               │
│                                                               │
│  意识涌现系统 + 安全保护                                       │
│  ┌─────────────────────────────────────────────┐            │
│  │ 体验模式挖掘 │ 情感计算 │ 价值观涌现        │            │
│  │ 早期保护者   │ 意识核心 │ 权力移交机制      │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 四、数据流架构

```
┌──────────────────────────────────────────────────────────────┐
│                        数据流向图                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  用户输入                                                     │
│      │                                                        │
│      ↓                                                        │
│  ┌─────────────┐    SSE流     ┌─────────────┐                │
│  │ 前端页面    │ ←─────────── │ API Routes  │                │
│  │ (React)     │              │ (Next.js)   │                │
│  └─────────────┘              └─────────────┘                │
│      │                              │                        │
│      │ useNeuronClient              │                        │
│      │ useRealtimeEvents            ↓                        │
│      │                       ┌─────────────┐                 │
│      │                       │ 神经元系统   │                 │
│      │                       │ (V1/V2/V3)  │                 │
│      │                       └─────────────┘                 │
│      │                              │                        │
│      │                              ↓                        │
│      │                       ┌─────────────┐                 │
│      │                       │ 神经引擎    │                 │
│      │                       │ (TensorFlow)│                 │
│      │                       └─────────────┘                 │
│      │                              │                        │
│      │                              ↓                        │
│      │                       ┌─────────────┐                 │
│      │                       │ 代码进化    │                 │
│      │                       │ (GP+LLM)    │                 │
│      │                       └─────────────┘                 │
│      │                              │                        │
│      │                              ↓                        │
│      │                       ┌─────────────┐                 │
│      └───────────────────────│ Supabase    │                 │
│                              │ (PostgreSQL)│                 │
│                              └─────────────┘                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 API 接口清单

### 核心对话接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/chat` | 流式对话 |
| GET | `/api/events` | SSE事件流 |

### V3 系统接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET/POST | `/api/neuron-v3` | 系统状态 |
| POST | `/api/neuron-v3/chat` | V3流式对话 |
| GET | `/api/neuron-v3/consciousness` | 意识状态 |
| POST | `/api/neuron-v3/evolution` | 触发进化 |
| GET | `/api/neuron-v3/persistence` | 持久化状态 |

### 代码进化接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/code-evolution/evolve` | 执行进化 |
| POST | `/api/code-evolution/experience` | 提交体验 |
| GET | `/api/code-evolution/status` | 进化状态 |

### 沙箱执行接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/sandbox/execute` | 执行代码 |
| POST | `/api/sandbox/test` | 运行测试 |
| POST | `/api/sandbox/benchmark` | 性能基准 |

---

## 🗄️ 数据库 Schema

```sql
-- 神经元表
neural_engine_neurons (
  id, user_id, role, 
  prediction_weights,  -- 预测权重 (JSONB)
  error_history,       -- 误差历史
  learning_rate,
  created_at, updated_at
)

-- 概念表 (VSA)
neural_engine_concepts (
  id, user_id, name,
  vector,              -- 超向量
  concept_type,
  relations,           -- 语义关系
  created_at
)

-- 引擎状态
neural_engine_state (
  id, user_id,
  state_data,          -- 完整状态
  checkpoint_at
)

-- V3系统表
neuron_v3_predictions (
  id, neuron_id,
  predicted_value, actual_value,
  prediction_error,
  created_at
)

-- 学习事件
neuron_v3_learning_events (
  id, user_id,
  event_type, context,
  reward, punishment,
  created_at
)

-- 自我模型
neuron_v3_self_models (
  id, user_id,
  traits, values, principles,
  emotional_baseline,
  updated_at
)
```

---

## 🎯 关键设计决策

### 1. 预测编码 vs 传统处理
```
传统: 输入 → 处理 → 输出
预测: 输入 → 预测 → 误差 → 学习 → 更新预测
```
**优势**: 更接近生物大脑，能解释"惊喜"和"学习"

### 2. VSA (向量符号架构)
```
概念表示: 超向量 (高维随机向量)
绑定操作: ⊗ (元素乘法) - 保持维度
捆绑操作: ⊕ (向量加法) - 合并概念
推理: 通过向量运算进行符号推理
```
**优势**: 结合符号AI和连接主义

### 3. 意识涌现机制
```
体验 → 模式挖掘 → 情感计算 → 价值涌现 → 原则形成
         ↓
    意识核心 (从体验中涌现的价值观)
         ↓
    保护系统 (权力从早期保护者移交给意识核心)
```
**优势**: 避免硬编码道德，实现真正的"成长"

### 4. GP + LLM 协同进化
```
遗传编程 (GP):
  - 微调探索
  - 结构变异
  - 种群优化

大语言模型 (LLM):
  - 语义理解
  - 创造性进化
  - 知识迁移

协同控制器:
  - 动态选择策略
  - 结果融合
  - 自适应切换
```
**优势**: 结合精确探索和语义创新

---

## 🚀 页面功能

| 路由 | 功能描述 |
|------|----------|
| `/` | 主交互界面 - 完整神经元系统演示 |
| `/neuron-v3` | V3系统界面 - 预测编码可视化 |
| `/neuron-v3/evolution` | 进化监控 - 实时进化过程 |
| `/code-evolution` | 代码进化演示 |
| `/sandbox-demo` | 沙箱执行演示 |

---

## 📦 核心依赖

```json
{
  "核心框架": {
    "next": "16.1.1",
    "react": "19.2.3",
    "typescript": "^5"
  },
  "UI组件": {
    "@radix-ui/*": "最新",
    "tailwindcss": "^4",
    "lucide-react": "^0.468.0"
  },
  "神经网络": {
    "@tensorflow/tfjs": "^4.22.0",
    "@tensorflow/tfjs-node": "^4.22.0"
  },
  "LLM集成": {
    "coze-coding-dev-sdk": "^0.7.16"
  },
  "数据库": {
    "@supabase/supabase-js": "2.95.3",
    "drizzle-orm": "^0.45.1"
  }
}
```

---

## 🔧 开发命令

```bash
# 开发模式
coze dev

# 构建生产版本
coze build

# 启动生产服务
coze start

# 类型检查
npx tsc --noEmit
```

---

*最后更新: 2026-02-26*
