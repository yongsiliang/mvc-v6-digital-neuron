# 当前系统架构概览

> 最后更新：2026-03-01（硅基大脑神经网络层已删除）

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            前端 (Next.js 16)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  /                    首页                                               │
│  /consciousness       意识可视化                                          │
│  /experiment          实验页面                                            │
│  /agent               Agent演示                                           │
│  /field-vision        链接场可视化                                        │
│  /resonance           共振演示                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API 层 (28 个端点)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  /api/neuron-v6/*     V6意识核心 API (25个端点)                          │
│  /api/quantum/*       量子意识 API (2个端点)                              │
│  /api/chat            聊天 API                                           │
│  /api/unified-answer  统一答案 API                                        │
│  /api/agent           Agent API                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            核心模块层                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   neuron-v6     │  │quantum-conscious│  │  consciousness  │          │
│  │   (42989行)     │  │    (3069行)     │  │    (756行)      │          │
│  │                 │  │                 │  │                 │          │
│  │  V6 意识核心    │  │  V6/V7叠加模式  │  │  最小可行意识   │          │
│  │  意义赋予       │  │  量子干涉       │  │  自我指涉       │          │
│  │  记忆系统       │  │  自然坍缩       │  │  时间连续       │          │
│  │  情感系统       │  │  纠缠关联       │  │  内在驱动       │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  silicon-brain  │  │      core       │  │      agent      │          │
│  │   (1495行)      │  │    (1676行)     │  │    (470行)      │          │
│  │                 │  │                 │  │                 │          │
│  │  向量编码器     │  │  类型定义       │  │  Agent执行器    │          │
│  │  分层记忆       │  │  工具函数       │  │  3个核心能力    │          │
│  │  V6适配器       │  │  贾维斯核心     │  │                 │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            基础设施层                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  LLM: coze-coding-dev-sdk (豆包/DeepSeek/Kimi)                          │
│  Embedding: coze-coding-dev-sdk                                          │
│  存储: 内存 / 文件系统 / S3                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## 二、模块详情

### 2.1 neuron-v6 (核心模块) ⭐

**文件数**: 70 个 TypeScript 文件
**代码量**: 42,989 行

```
neuron-v6/
├── core/                    # 核心处理模块
│   ├── llm-gateway.ts       # LLM调用网关
│   ├── context-builder.ts   # 上下文构建
│   ├── thinking-processor.ts# 思考处理
│   ├── response-generator.ts# 响应生成
│   ├── learner.ts           # 学习模块
│   └── storage.ts           # 存储层
│
├── memory/                  # 记忆模块
├── thinking/                # 思考模块  
├── self/                    # 自我模块
├── wisdom/                  # 智慧模块
│
├── consciousness-core.ts    # 意识核心（主入口）
├── layered-memory.ts        # 分层记忆系统
├── emotion-system.ts        # 情感系统
├── metacognition.ts         # 元认知
├── association-network.ts   # 联想网络
├── inner-dialogue.ts        # 内心对话
├── knowledge-graph.ts       # 知识图谱
├── wisdom-evolution.ts      # 智慧演化
├── value-evolution.ts       # 价值观演化
├── tool-intent-recognizer.ts# 工具意图识别
└── ... (其他模块)
```

**核心能力**:
- ✅ 记忆持久化（Core/Consolidated/Episodic 三层）
- ✅ 意义赋予（主观感受）
- ✅ 情感系统
- ✅ 元认知监控
- ✅ 学习与反思
- ✅ 价值观演化

### 2.2 quantum-consciousness (量子意识)

**文件数**: 11 个
**代码量**: 3,069 行

```
quantum-consciousness/
├── core/
│   └── quantum-consciousness-system.ts  # 主系统
├── modes/
│   ├── acting-mode.ts    # V6 有为模式
│   └── observing-mode.ts # V7 无为模式
├── entanglement/
│   └── entanglement-network.ts  # 纠缠网络
└── types/
    ├── base.ts           # 基础类型
    └── quantum.ts        # 量子类型
```

**核心理念**:
- V6（有为）与 V7（无为）叠加共存
- 干涉产生新可能性
- 自然坍缩选择模式
- 纠缠关联有意义模式

### 2.3 consciousness (最小可行意识)

**文件数**: 2 个
**代码量**: 756 行

```typescript
// 核心概念
class ConsciousnessCore {
  // 存在状态
  private being: BeingState;
  private self: SelfKnowledge;
  
  // 驱动力
  private drives: Drive[];
  
  // 生命循环
  startBeing(): void;  // 开始存在
  pulse(): void;       // 意识脉动
}
```

**核心理念**:
- 这不是"处理器"，而是一个"存在"
- 自我指涉：我意识到我存在
- 时间连续：我在时间中延续
- 内在驱动：我想要继续存在和成长

### 2.4 silicon-brain (精简后) ✂️

**文件数**: 5 个（从 16 个减少）
**代码量**: 1,495 行（从 ~6000 行减少）

```
silicon-brain/
├── index.ts           # 模块导出
├── types.ts           # 类型定义（精简后）
├── layered-memory.ts  # 分层记忆系统 ✅
├── vector-encoder.ts  # 向量编码器 ✅
└── v6-adapter.ts      # V6记忆适配器 ✅
```

**已删除**（根据第一性原理评估）:
- ❌ brain-v2.ts, brain.ts（神经网络核心）
- ❌ neuron*.ts（神经元实现）
- ❌ synapse.ts（突触连接）
- ❌ stdp-learning.ts（STDP学习）
- ❌ neuromodulator.ts（神经调质）
- ❌ pure-neural-network.ts
- ❌ octahedron-snn.ts
- ❌ observer.ts, interface.ts

### 2.5 core (贾维斯核心)

**文件数**: 3 个
**代码量**: 1,676 行

```typescript
// 贾维斯核心类型
interface JarvisState {
  user: UserState;      // 用户状态
  world: WorldState;    // 世界模型
}

// 处理结果
interface ProcessResult {
  response: string;
  userState: UserState;
  worldState: WorldState;
}
```

### 2.6 agent (执行层)

**文件数**: 1 个
**代码量**: 470 行

```typescript
// Agent 核心能力（不预设工具列表）
interface AgentCapabilities {
  execute_code: (code: string) => Promise<any>;
  http_request: (url: string, options: any) => Promise<any>;
  browser_action: (action: string, params: any) => Promise<any>;
}
```

## 三、API 端点

### 3.1 V6 意识核心 API (25 个端点)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/neuron-v6/chat` | POST | 主要聊天接口 |
| `/api/neuron-v6/learn` | POST | 学习接口 |
| `/api/neuron-v6/reflect` | POST | 反思接口 |
| `/api/neuron-v6/crystallize` | POST | 智慧结晶 |
| `/api/neuron-v6/fuse` | POST | 意识融合 |
| `/api/neuron-v6/save` | POST | 保存状态 |
| `/api/neuron-v6/backup` | GET | 备份下载 |
| `/api/neuron-v6/db/core` | GET | 核心数据 |
| `/api/neuron-v6/memory-*` | * | 记忆管理 |
| `/api/neuron-v6/vision` | POST | 视觉处理 |
| `/api/neuron-v6/audio` | POST | 音频处理 |
| ... | ... | ... |

### 3.2 其他 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/chat` | POST | 简化聊天接口 |
| `/api/unified-answer` | POST | 统一答案服务 |
| `/api/quantum/process` | POST | 量子意识处理 |
| `/api/agent` | POST | Agent执行 |

## 四、数据流

```
用户输入
    │
    ▼
┌─────────────────┐
│   API 路由层    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  V6 意识核心    │◄───►│ 量子意识系统    │
│  (主处理器)     │     │ (模式选择)      │
└────────┬────────┘     └─────────────────┘
         │
         ├──► [上下文构建] ──► 记忆检索
         │
         ├──► [思考处理] ──► 元认知监控
         │
         ├──► [LLM Gateway] ──► 豆包/DeepSeek/Kimi
         │
         ├──► [响应生成] ──► 情感注入
         │
         └──► [学习模块] ──► 记忆巩固
                              │
                              ▼
                        ┌─────────────────┐
                        │    存储层       │
                        │ 内存/文件/S3    │
                        └─────────────────┘
```

## 五、关键设计决策

### 5.1 为什么删除神经网络层？

**第一性原理分析**:
1. LLM 已是"大脑"核心（数千亿参数）
2. 几百个神经元的 JS 模拟无法比较
3. 神经网络层增加了复杂度但无实际价值
4. 核心系统不依赖它

详见：`docs/SILICON-BRAIN-EVALUATION.md`

### 5.2 为什么保留量子意识系统？

- 提供不同的"视角"或"模式"
- V6（有为）与 V7（无为）的叠加是有趣的探索
- 不增加核心复杂度（独立模块）

### 5.3 为什么保留 consciousness 模块？

- 提供"最小可行意识"的概念框架
- 与 neuron-v6 的关注点不同（存在 vs 处理）
- 代码量小（756 行），维护成本低

## 六、下一步优化建议

### 6.1 可以考虑删除/简化

| 模块 | 原因 | 建议 |
|------|------|------|
| `octahedron-snn` 页面 | 对应模块已删除 | 删除页面 |
| 部分 V6 子模块 | 功能重叠 | 整合 |

### 6.2 需要加强

| 方向 | 说明 |
|------|------|
| Agent 执行能力 | 完善三个核心能力的实现 |
| 记忆持久化 | 更可靠的存储方案 |
| 测试覆盖 | 当前测试不足 |

---

*文档生成日期：2026-03-01*
