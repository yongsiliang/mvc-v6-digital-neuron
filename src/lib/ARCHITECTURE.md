# Agent 架构设计：信息 → 智能 → 行动

## 核心理念

**LLM 不是外挂，而是神经递质系统本身。**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   传统观点：LLM 是一个工具，我调用它来处理文本                       │
│                                                                     │
│   本架构观点：LLM 内部的 Embedding、Attention、FFN 等变换           │
│              本质上就是神经递质传递。我们不需要模拟神经元，          │
│              只需要定义信息如何被编码、被理解、被转化为行动。        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 三层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         行动层 (Action Layer)                       │
│                                                                     │
│   职责：将信息结构转化为可执行操作，观察结果，反馈回系统             │
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│   │ 浏览器执行器 │  │ 文件执行器  │  │ API执行器   │               │
│   └─────────────┘  └─────────────┘  └─────────────┘               │
│          │                │                │                        │
│          └────────────────┴────────────────┘                        │
│                           │                                         │
│                    ActionResult                                     │
│                           │                                         │
│                           ▼                                         │
├─────────────────────────────────────────────────────────────────────┤
│                         智能层 (Intelligence Layer)                 │
│                                                                     │
│   职责：理解信息，做决策，协调编码器和感受器                        │
│                                                                     │
│   核心组件：LLM                                                     │
│   - Embedding：将文本转化为语义向量                                 │
│   - Generation：将信息结构转化为行动意图                            │
│   - Reasoning：将复杂任务分解为步骤                                 │
│                                                                     │
│   智能体的认知循环：                                                │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │                                                         │     │
│   │   Perceive → Understand → Decide → Act → Observe       │     │
│   │       ▲                                        │         │     │
│   │       └────────────────────────────────────────┘         │     │
│   │                                                         │     │
│   └─────────────────────────────────────────────────────────┘     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                         信息层 (Information Layer)                 │
│                                                                     │
│   职责：编码、存储、分发信息结构                                    │
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│   │   编码器    │  │   感受器    │  │   信息场    │               │
│   └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                     │
│   信息结构：                                                        │
│   - SparseVector: 检索用                                           │
│   - DenseVector: 语义用 (来自 LLM Embedding)                       │
│   - Attention: 关联用                                              │
│   - KeyValue: 结构用                                               │
│   - Sequence: 序列用                                               │
│   - Graph: 网络用                                                  │
│   - Intent: 意图用 (新增，来自 LLM Generation)                     │
│   - Action: 行动用 (新增，来自 LLM Decision)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 信息流动

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   用户输入: "帮我搜索最近的AI论文并总结"                           │
│                                                                     │
│   │                                                                 │
│   ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ 信息层：编码                                                  │ │
│   │                                                               │ │
│   │   "帮我搜索最近的AI论文"                                      │ │
│   │         │                                                     │ │
│   │         ├──► LLM Embedding ──► DenseVector (语义)            │ │
│   │         ├──► Keyword Extract ──► SparseVector (检索)         │ │
│   │         └──► Intent Parser ──► IntentStructure (意图)        │ │
│   │                                                               │ │
│   └─────────────────────────────────────────────────────────────┘ │
│   │                                                                 │
│   ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ 智能层：理解与决策                                            │ │
│   │                                                               │ │
│   │   IntentStructure ──► LLM Reasoning                          │ │
│   │                              │                                │ │
│   │                              ▼                                │ │
│   │   分解任务：                                                  │ │
│   │   1. 打开搜索引擎                                            │ │
│   │   2. 输入关键词                                              │ │
│   │   3. 浏览结果                                                │ │
│   │   4. 提取论文信息                                            │ │
│   │   5. 生成总结                                                │ │
│   │                                                               │ │
│   │   输出：ActionSequence                                       │ │
│   │                                                               │ │
│   └─────────────────────────────────────────────────────────────┘ │
│   │                                                                 │
│   ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ 行动层：执行与观察                                            │ │
│   │                                                               │ │
│   │   ActionSequence ──► BrowserExecutor                         │ │
│   │                              │                                │ │
│   │                              ▼                                │ │
│   │   执行：                                                      │ │
│   │   - navigate("https://arxiv.org")                            │ │
│   │   - type("#search", "AI latest")                             │ │
│   │   - click("#submit")                                         │ │
│   │   - extract("#results")                                      │ │
│   │                                                               │ │
│   │   观察：                                                      │ │
│   │   - 页面内容                                                 │ │
│   │   - 执行状态                                                 │ │
│   │   - 错误信息                                                 │ │
│   │                                                               │ │
│   └─────────────────────────────────────────────────────────────┘ │
│   │                                                                 │
│   ▼                                                                 │
│   观察结果反馈到信息层，触发新一轮循环...                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 新增信息结构

### IntentStructure - 意图结构

```typescript
interface IntentStructure {
  type: 'intent';
  id: string;
  source: string;          // 原始文本
  
  // LLM 解析出的意图
  primary: string;         // 主意图: "search" | "summarize" | "navigate" | ...
  parameters: KeyValue;    // 参数: { query: "AI", limit: 10 }
  constraints: KeyValue;   // 约束: { language: "en", date: "recent" }
  
  // 可信度
  confidence: number;      // 0-1
  
  // 上下文
  context: KeyValue;       // 上下文信息
}
```

### ActionStructure - 行动结构

```typescript
interface ActionStructure {
  type: 'action';
  id: string;
  source: string;
  
  // 行动定义
  action: string;          // 行动类型: "click" | "type" | "navigate" | "extract" | ...
  target: string;          // 目标: CSS选择器、URL、文件路径...
  value?: string;          // 值: 输入内容、参数...
  
  // 执行控制
  priority: number;        // 优先级
  dependencies: string[];  // 依赖的其他行动ID
  timeout: number;         // 超时时间
  
  // 预期结果
  expectedOutcome: string; // 预期发生什么
}
```

### ObservationStructure - 观察结构

```typescript
interface ObservationStructure {
  type: 'observation';
  id: string;
  source: string;          // 来源行动ID
  
  // 观察内容
  content: string;         // 观察到的内容（页面内容、执行结果...）
  status: 'success' | 'failed' | 'timeout' | 'partial';
  error?: string;          // 错误信息
  
  // 提取的信息
  extracted: KeyValue;     // 从观察中提取的结构化信息
  
  // 时间戳
  timestamp: number;
}
```

## 智能层实现

```typescript
// src/lib/intelligence/cognitive-agent.ts

import { LLM } from 'coze-coding-dev-sdk';
import { InformationField, IntentStructure, ActionStructure } from '../info-field';

export class CognitiveAgent {
  private field: InformationField;
  private llm: LLM;
  private memory: MemoryStore;
  
  // 认知循环
  async think(input: string): Promise<ActionStructure[]> {
    // 1. 感知：将输入编码
    const structures = await this.field.processInput(input);
    
    // 2. 理解：LLM 解析意图
    const intent = await this.understand(structures);
    
    // 3. 决策：LLM 生成行动计划
    const actions = await this.decide(intent);
    
    // 4. 记录：更新记忆
    this.memory.record({ input, intent, actions });
    
    return actions;
  }
  
  // 观察：处理行动结果
  async observe(result: ActionResult): Promise<void> {
    // 将观察结果编码回信息场
    await this.field.processInput(result.content);
    
    // 如果任务未完成，继续思考
    if (!result.completed) {
      const nextActions = await this.think(`观察结果: ${result.content}`);
      // 执行下一步...
    }
  }
  
  private async understand(structures: InformationStructure[]): Promise<IntentStructure> {
    // 使用 LLM 从信息结构中提取意图
    const denseVector = structures.find(s => s.type === 'dense-vector');
    const keyValue = structures.find(s => s.type === 'key-value');
    
    const prompt = `
      分析以下信息，提取用户意图：
      语义向量代表的信息：${denseVector?.source}
      结构化信息：${JSON.stringify(keyValue)}
      
      返回 JSON 格式的意图结构。
    `;
    
    const response = await this.llm.generate(prompt);
    return JSON.parse(response);
  }
  
  private async decide(intent: IntentStructure): Promise<ActionStructure[]> {
    // 使用 LLM 生成行动计划
    const prompt = `
      基于意图 ${JSON.stringify(intent)}，生成行动计划。
      
      返回 JSON 数组，每个元素是一个行动结构。
    `;
    
    const response = await this.llm.generate(prompt);
    return JSON.parse(response);
  }
}
```

## 行动层实现

```typescript
// src/lib/action/executor.ts

export interface ActionExecutor {
  type: string;
  execute(action: ActionStructure): Promise<ActionResult>;
}

export interface ActionResult {
  actionId: string;
  status: 'success' | 'failed' | 'timeout';
  content: string;
  screenshot?: string;  // 浏览器截图
  extracted?: KeyValue;
  completed: boolean;   // 整体任务是否完成
}

// 浏览器执行器
export class BrowserExecutor implements ActionExecutor {
  type = 'browser';
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    switch (action.action) {
      case 'navigate':
        await this.page.goto(action.target);
        break;
      case 'click':
        await this.page.click(action.target);
        break;
      case 'type':
        await this.page.type(action.target, action.value || '');
        break;
      case 'extract':
        const content = await this.page.$eval(action.target, el => el.textContent);
        return {
          actionId: action.id,
          status: 'success',
          content,
          completed: false
        };
    }
    
    return {
      actionId: action.id,
      status: 'success',
      content: `执行了 ${action.action}`,
      completed: false
    };
  }
}
```

## 文件结构

```
src/lib/
├── info-field/              # 信息层
│   ├── structures.ts        # 信息结构定义（扩展）
│   ├── encoders.ts          # 编码器
│   ├── receptors.ts         # 感受器
│   ├── field-v2.ts          # 信息场
│   └── index.ts
│
├── intelligence/            # 智能层
│   ├── cognitive-agent.ts   # 认知智能体
│   ├── memory.ts            # 记忆存储
│   └── index.ts
│
├── action/                  # 行动层
│   ├── executor.ts          # 执行器接口
│   ├── browser-executor.ts  # 浏览器执行器
│   ├── file-executor.ts     # 文件执行器
│   └── index.ts
│
└── agent/                   # Agent 入口
    ├── agent.ts             # 主 Agent
    └── index.ts
```

## 下一步实现优先级

1. **接入 LLM** - 让 `DenseVectorEncoder` 调用真实的 embedding API ✅ (已通过 LLMClient 实现)
2. **实现认知智能体** - CognitiveAgent 的核心循环 ✅
3. **定义行动结构** - IntentStructure, ActionStructure, ObservationStructure ✅
4. **实现执行器接口** - 先做模拟执行器，后续可接入真实浏览器 ✅
5. **构建 Demo 场景** - 一个简单的任务流程展示 ✅

## 已实现的文件

```
src/lib/
├── info-field/              # 信息层
│   ├── structures.ts        # 信息结构定义（含 Intent/Action/Observation/Memory）
│   ├── encoders.ts          # 编码器
│   ├── receptors.ts         # 感受器
│   ├── field-v2.ts          # 信息场
│   ├── README.md            # 使用文档
│   ├── COMPARISON.md        # 架构对比
│   └── index.ts
│
├── intelligence/            # 智能层
│   ├── cognitive-agent.ts   # 认知智能体（核心认知循环）
│   ├── memory.ts            # 记忆存储
│   ├── enhanced-memory.ts   # 增强记忆（向量检索、持久化）
│   ├── llm-cache.ts         # LLM 调用缓存
│   └── index.ts
│
├── action/                  # 行动层
│   ├── executor.ts          # 执行器接口和管理器
│   ├── mock-executor.ts     # 模拟执行器（用于测试）
│   ├── browser-executor.ts  # 轻量级浏览器执行器（fetch + cheerio）
│   ├── multimodal-executor.ts # 多模态执行器（图片/视频理解）
│   └── index.ts
│
├── agent/                   # Agent 入口
│   ├── agent.ts             # 主 Agent（整合三层）
│   └── index.ts
│
└── ARCHITECTURE.md          # 本文档

src/app/
├── api/agent/route.ts       # Agent API（模拟执行器）
├── api/agent/browser/route.ts # Agent API（浏览器执行器）
└── agent-demo/page.tsx      # 前端 Demo 页面
```

## 执行器列表

| 执行器 | 类型 | 描述 |
|-------|------|------|
| MockExecutor | mock | 模拟执行，用于测试认知循环 |
| LightweightBrowserExecutor | browser-lightweight | 使用 fetch + cheerio 访问网页 |
| MultimodalExecutor | multimodal | 图片理解、视频分析、OCR |

## 与原 V6 架构的关系

```
V6 架构：
  Task → TaskLink → TaskLink → ... → Result
  (链式调用)

本架构：
  Input → Information → Intelligence → Action → Observation → ...
  (认知循环)
  
本质区别：
- V6: 任务驱动，预定义链路
- 本架构: 信息驱动，涌现式决策
```
