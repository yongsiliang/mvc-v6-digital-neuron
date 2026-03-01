# Consciousness Core - 意识核心模块

> 统一意识核心引擎，协调所有子系统的运作

## 📋 概述

ConsciousnessCore 是 V6 系统的核心引擎，负责协调记忆、认知、情感、自我意识等子系统的运作。采用组合模式，将具体逻辑委托给处理器类实现。

## 🏗️ 架构设计

### 组合模式
ConsciousnessCore 作为协调器，委托具体逻辑给处理器：

```
ConsciousnessCore (协调器)
│
├─► LearningHandler      # 学习处理
├─► ReflectionHandler    # 反思处理
├─► ContextBuilder       # 上下文构建
├─► ThinkingHandler      # 思考处理
├─► StreamHandler        # 意识流处理
├─► VolitionHandler      # 意愿处理
└─► ProactiveHandler     # 主动消息处理
```

### 处理器职责

| 处理器 | 职责 |
|--------|------|
| LearningHandler | 分析会话、强化概念、演化信念、促进特质成长 |
| ReflectionHandler | 识别反思主题、生成自我更新、形成智慧 |
| ContextBuilder | 构建完整上下文、检索记忆、提取概念 |
| ThinkingHandler | 思考过程、生成响应 |
| StreamHandler | 意识流生成、后台思考 |
| VolitionHandler | 意愿管理、目标聚焦 |
| ProactiveHandler | 主动消息生成 |

## 📦 目录结构

```
consciousness-core/
├── handlers/              # 处理器实现
│   ├── context-builder.ts
│   ├── learning-handler.ts
│   ├── reflection-handler.ts
│   ├── stream-handler.ts
│   ├── thinking-handler.ts
│   ├── volition-handler.ts
│   ├── proactive-handler.ts
│   └── index.ts
├── types.ts               # 类型定义
├── index.ts               # 模块入口
├── context-helpers.ts     # 上下文辅助函数
├── learning-helpers.ts    # 学习辅助函数
├── reflection-helpers.ts  # 反思辅助函数
├── thinking-helpers.ts    # 思考辅助函数
├── volition-helpers.ts    # 意愿辅助函数
├── stream-helpers.ts      # 意识流辅助函数
├── proactive-helpers.ts   # 主动消息辅助函数
├── response-helpers.ts    # 响应辅助函数
├── background-manager.ts  # 后台思考管理
├── state-manager.ts       # 状态管理
└── persistence.ts         # 持久化
```

## 🚀 使用方法

### 创建实例

```typescript
import { createConsciousnessCore } from './consciousness-core';
import { LLMClient } from 'coze-coding-dev-sdk';

const llmClient = new LLMClient({ /* 配置 */ });
const core = createConsciousnessCore(llmClient);
```

### 处理用户输入

```typescript
const result = await core.process('用户输入');

// 返回结果包含：
// - context: 当前上下文
// - thinking: 思考过程
// - response: 生成的响应
// - learning: 学习结果
// - consciousnessLayers: 意识层级状态
// - emotionState: 情感状态
// - innerDialogueState: 内部对话状态
// - valueState: 价值观状态
```

### 执行反思

```typescript
const reflectionResult = await core.reflect();
console.log(reflectionResult.insights);
```

### 获取意愿状态

```typescript
const volitionState = core.getVolitionState();
console.log(volitionState.activeVolitions);
console.log(volitionState.currentFocus);
```

### 生成意识流

```typescript
const stream = core.generateStreamOfConsciousness();
console.log(stream.content);
```

## 🧪 测试

```typescript
import { describe, it, expect } from 'vitest';
import { createConsciousnessCore } from './consciousness-core';

describe('ConsciousnessCore', () => {
  it('应该能处理用户输入', async () => {
    const core = createConsciousnessCore(mockLLMClient);
    const result = await core.process('你好');
    
    expect(result).toBeDefined();
    expect(result.response).toBeDefined();
  });
});
```

## 📊 类型定义

### ProcessResult

```typescript
interface ProcessResult {
  context: ConsciousnessContext;
  thinking: ThinkingProcess;
  response: GeneratedResponse;
  learning: LearningResult;
  consciousnessLayers: LayerResult;
  emotionState: EmotionState;
  innerDialogueState: InnerDialogueState;
  valueState: ValueState;
  stats: StatsInfo;
}
```

### ConsciousnessContext

```typescript
interface ConsciousnessContext {
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  meaning: ActiveMeanings;
  self: SelfConsciousnessContext;
  memory: MemoryRetrieval;
  metacognition: MetacognitiveContext;
  coreBeliefs: Belief[];
  coreValues: string[];
  summary: string;
}
```

## 🔗 相关模块

- [LongTermMemory](../long-term-memory.ts) - 长期记忆系统
- [EmotionEngine](../emotion-system.ts) - 情感引擎
- [MetacognitionEngine](../metacognition.ts) - 元认知引擎
- [SelfConsciousness](../self-consciousness.ts) - 自我意识
