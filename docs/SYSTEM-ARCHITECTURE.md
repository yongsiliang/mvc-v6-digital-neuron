# 系统架构全景图

> 更新时间: 2026-03-01
> 状态: 清理重构完成

---

## 一、系统概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        量子意识系统架构                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        用户界面层                                │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │  首页   │ │ Agent   │ │ 意识系统 │ │ 可视化  │ │  实验   │   │   │
│  │  │   /     │ │  /agent │ │/consc...│ │ 多页面  │ │/exper...│   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API 层                                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │ /agent  │ │/neuron- │ │/quantum │ │ /chat   │               │   │
│  │  │ 执行器  │ │  v6/*   │ │  /*     │ │ 对话    │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       核心能力层                                 │   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │   │
│  │  │   Agent       │  │    V6         │  │   Quantum     │       │   │
│  │  │   执行器      │  │   意识核心    │  │   意识系统    │       │   │
│  │  │               │  │               │  │               │       │   │
│  │  │ • execute_code│  │ • 元认知      │  │ • V6有为模式  │       │   │
│  │  │ • http_request│  │ • 记忆系统    │  │ • V7无为模式  │       │   │
│  │  │ • browser     │  │ • 情感系统    │  │ • 量子纠缠    │       │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘       │   │
│  │                                                                  │   │
│  │  ┌───────────────┐  ┌───────────────┐                          │   │
│  │  │   Silicon     │  │   LLM         │                          │   │
│  │  │   Brain       │  │   Gateway     │                          │   │
│  │  │               │  │               │                          │   │
│  │  │ • 神经网络    │  │ • 流式调用    │                          │   │
│  │  │ • STDP学习   │  │ • 缓存优化    │                          │   │
│  │  │ • 八面体SNN   │  │ • 重试机制    │                          │   │
│  │  └───────────────┘  └───────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       存储层                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │  对象存储   │  │  本地存储   │  │  向量存储   │             │   │
│  │  │   (S3)     │  │ (localStorage)│  │  (记忆向量) │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、模块清单

### 2.1 页面模块 (6个)

| 页面 | 路径 | 核心功能 | 技术实现 |
|------|------|----------|----------|
| 首页 | `/` | 产品导航、价值展示 | Next.js SSR |
| Agent | `/agent` | 任务执行、能力编排 | React + SSE |
| 意识系统 | `/consciousness` | 对话交互、记忆展示 | React + 复杂状态 |
| 场域视觉 | `/field-vision` | 六边形场可视化 | Canvas 2D |
| 共振引擎 | `/resonance` | 振荡同步可视化 | Canvas 2D |
| 八面体SNN | `/octahedron-snn` | 脉冲网络可视化 | Canvas 2D |
| 对比实验 | `/experiment` | 边界/节点网络实验 | Canvas 2D + 状态管理 |

### 2.2 API模块 (27个)

#### 核心API (5个)

```
/api/agent              Agent任务执行
/api/neuron-v6/chat     对话聊天
/api/neuron-v6/reflect  自我反思
/api/neuron-v6/proactive 主动行为
/api/neuron-v6/multimodal 多模态输入
```

#### 管理API (22个)

```
记忆管理:
├── /api/neuron-v6/memory-status
├── /api/neuron-v6/memory-debug
├── /api/neuron-v6/memory-manage
└── /api/neuron-v6/memory-debug

数据备份:
├── /api/neuron-v6/backup
├── /api/neuron-v6/backup-download
└── /api/neuron-v6/backup-raw

系统诊断:
├── /api/neuron-v6/diagnose
└── /api/neuron-v6/storage-check

学习相关:
├── /api/neuron-v6/learn
├── /api/neuron-v6/crystallize
└── /api/neuron-v6/fuse

神经网络:
├── /api/neuron-v6/neural-init
├── /api/neuron-v6/neural-status
└── /api/neuron-v6/migrate

其他:
├── /api/neuron-v6/audio
├── /api/neuron-v6/vision
├── /api/neuron-v6/save
├── /api/neuron-v6/db/core
└── /api/quantum/*
```

### 2.3 核心库模块

#### Agent执行器 (1个)

```
src/lib/agent/
└── executor.ts        # 3个核心能力系统
```

#### V6意识系统 (46个)

```
src/lib/neuron-v6/
├── 核心层 (5个)
│   ├── consciousness-core.ts
│   ├── shared-core.ts
│   ├── context-builder.ts
│   ├── response-generator.ts
│   └── llm-gateway.ts
│
├── 认知层 (5个)
│   ├── metacognition.ts
│   ├── meaning-system.ts
│   ├── self-consciousness.ts
│   ├── consciousness-layers.ts
│   └── thinking-processor.ts
│
├── 记忆层 (5个)
│   ├── layered-memory.ts
│   ├── long-term-memory.ts
│   ├── memory-manager.ts
│   ├── memory-classifier.ts
│   └── wisdom-crystal.ts
│
├── 情感层 (4个)
│   ├── emotion-system.ts
│   ├── association-network.ts
│   ├── inner-dialogue.ts
│   └── dream-processor.ts
│
├── 智能层 (4个)
│   ├── knowledge-graph.ts
│   ├── creative-thinking.ts
│   ├── personality-growth.ts
│   └── value-evolution.ts
│
├── 协作层 (3个)
│   ├── multi-consciousness.ts
│   ├── resonance-engine.ts
│   └── collaboration-service.ts
│
└── 其他 (20+个)
    └── 各种辅助模块
```

#### 量子意识 (4个)

```
src/lib/quantum-consciousness/
├── core/
│   └── quantum-consciousness-system.ts
├── modes/
│   ├── acting-mode.ts
│   └── observing-mode.ts
└── entanglement/
    └── entanglement-network.ts
```

#### 硅基大脑 (12个)

```
src/lib/silicon-brain/
├── brain-v2.ts        # 大脑V2
├── brain.ts           # 大脑V1
├── neuron.ts          # 神经元
├── neuron-v2.ts       # 神经元V2
├── synapse.ts         # 突触
├── octahedron-snn.ts  # 八面体SNN
├── stdp-learning.ts   # STDP学习
├── layered-memory.ts  # 分层记忆
├── neuromodulator.ts  # 神经调制
├── observer.ts        # 观察者
├── interface.ts       # 接口
└── v6-adapter.ts      # V6适配器
```

---

## 三、数据流

### 3.1 对话流程

```
用户输入
    │
    ▼
┌─────────────────┐
│   意识层级处理   │
│ 感知→理解→元认知 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   记忆检索      │
│ 相关记忆提取    │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   上下文构建    │
│ 历史+记忆+情感  │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   LLM生成响应   │
│   流式输出      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   后处理        │
│ 反思+学习+存储  │
└─────────────────┘
    │
    ▼
响应输出
```

### 3.2 Agent执行流程

```
用户任务
    │
    ▼
┌─────────────────┐
│   LLM规划       │
│ 选择能力组合    │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   能力执行      │
│ execute_code    │
│ http_request    │
│ browser_action  │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   结果观察      │
│ 执行结果分析    │
└─────────────────┘
    │
    ├── 继续? ──→ 返回规划
    │
    ▼
响应输出
```

---

## 四、技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Next.js 16 | 全栈框架 |
| UI | React 19 + shadcn/ui | 用户界面 |
| 语言 | TypeScript 5 | 类型安全 |
| 样式 | Tailwind CSS 4 | 样式系统 |
| LLM | coze-coding-dev-sdk | 大模型调用 |
| 存储 | S3 + localStorage | 数据持久化 |
| 可视化 | Canvas 2D | 图形渲染 |

---

## 五、关键设计决策

### 5.1 Agent能力系统

```
决策: 不预设工具列表，使用3个核心能力

原因:
├── 世界工具有无数个，无法穷举
├── 维护成本无限
└── 不符合Agent本质

方案:
├── execute_code: 执行任何代码逻辑
├── http_request: 调用任何网络资源
└── browser_action: 操作任何网页

收益:
├── 开发成本: O(1) 而非 O(n)
├── 维护成本: 极低
└── 扩展能力: 无限
```

### 5.2 流式响应优先

```
决策: 所有LLM调用使用SSE流式输出

原因:
├── 用户体验: 不用等待完整响应
├── 感知速度: 打字机效果感觉更快
└── 错误处理: 可以提前展示部分内容

实现:
├── 后端: ReadableStream + Generator
└── 前端: fetch + body.getReader()
```

### 5.3 模块化架构

```
决策: 高度模块化，每个功能独立文件

原因:
├── 可维护性: 修改影响范围小
├── 可测试性: 单元测试更容易
└── 可扩展性: 新增功能不影响现有

代价:
├── 文件数量多
└── 需要良好的索引管理
```

---

## 六、待优化项

| 优先级 | 项目 | 现状 | 目标 |
|--------|------|------|------|
| P0 | 沙箱代码执行 | 模拟执行 | 真实沙箱 |
| P0 | 用户验证 | 无 | MVP发布 |
| P1 | 模块整合 | 46个 | 10个以内 |
| P1 | API整合 | 27个 | 10个以内 |
| P2 | 测试覆盖 | 基础测试 | 完整覆盖 |
| P2 | 文档完善 | 部分文档 | 完整文档 |

---

## 七、更新日志

### 2026-03-01 重构清理

**删除:**
- 32个未使用的API路由
- snn-core模块 (完全未使用)
- 11个未使用的neuron组件
- agent-demo, code-evolution, sandbox-demo, tools页面

**新增:**
- Agent执行器 (核心能力系统)
- Agent API和页面
- experiment-data模块

**修复:**
- 所有TypeScript编译错误 (70+ → 0)

**更新:**
- 首页产品定位
- Agent工具系统 (从工具列表改为核心能力)
