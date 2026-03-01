# Neuron V6 测试套件

> 完整的单元测试覆盖

## 📋 概述

本目录包含 Neuron V6 系统的所有单元测试，覆盖核心模块和处理器的功能测试。

## 📊 测试统计

- **测试文件**: 17 个
- **测试用例**: 111 个
- **通过率**: 100%

## 📁 目录结构

```
__tests__/
├── handlers/              # 处理器测试
│   ├── context-builder.test.ts
│   ├── learning-handler.test.ts
│   ├── reflection-handler.test.ts
│   ├── stream-handler.test.ts
│   ├── thinking-handler.test.ts
│   └── volition-handler.test.ts
├── consciousness-core.test.ts   # 核心引擎测试
├── long-term-memory.test.ts     # 长期记忆测试
├── knowledge-graph.test.ts      # 知识图谱测试
├── self-consciousness.test.ts   # 自我意识测试
├── hebbian-network.test.ts      # 神经网络测试
├── inner-dialogue.test.ts       # 内部对话测试
├── value-evolution.test.ts      # 价值观演化测试
├── resonance-engine.test.ts     # 共振引擎测试
├── emotion-system.test.ts       # 情感系统测试
├── metacognition.test.ts        # 元认知测试
├── layered-memory.test.ts       # 分层记忆测试
└── test-utils.ts                # 测试工具函数
```

## 🧪 测试覆盖详情

### 核心引擎测试

| 文件 | 测试用例 | 覆盖功能 |
|------|---------|---------|
| consciousness-core.test.ts | 4 | 初始化、process、getVolitionState |
| resonance-engine.test.ts | 6 | 初始化、step、activateSubsystem |
| hebbian-network.test.ts | 7 | createNeuron、createSynapse、spreadActivation |

### 记忆系统测试

| 文件 | 测试用例 | 覆盖功能 |
|------|---------|---------|
| long-term-memory.test.ts | 9 | addNode、linkKnowledge、recordExperience |
| knowledge-graph.test.ts | 6 | addConcept、addEdge、getState |
| layered-memory.test.ts | - | 分层记忆功能 |

### 认知系统测试

| 文件 | 测试用例 | 覆盖功能 |
|------|---------|---------|
| emotion-system.test.ts | 15 | detectFromText、experience、decay |
| metacognition.test.ts | 9 | 元认知监控、策略调整 |
| inner-dialogue.test.ts | 5 | startDialogue、conductDialecticRound |
| value-evolution.test.ts | 7 | reinforceValue、getState |

### 自我系统测试

| 文件 | 测试用例 | 覆盖功能 |
|------|---------|---------|
| self-consciousness.test.ts | 5 | getIdentity、getContext、reflect |

### 处理器测试

| 文件 | 测试用例 | 覆盖功能 |
|------|---------|---------|
| learning-handler.test.ts | 5 | analyzeSession、evolveBeliefSystem |
| reflection-handler.test.ts | 1 | reflect |
| context-builder.test.ts | 2 | buildContext |
| volition-handler.test.ts | 3 | getVolitionState、getVolitions |
| thinking-handler.test.ts | 1 | 实例化 |
| stream-handler.test.ts | 2 | 实例化、生成 |

## 🔧 测试工具

### test-utils.ts

提供模拟对象和测试辅助函数：

```typescript
// 创建模拟对象
import { 
  createMockLongTermMemory,
  createMockSelfConsciousness,
  createMockMetacognition,
  createHandlerDeps
} from './test-utils';

// 使用模拟对象
const deps = createHandlerDeps();
const handler = new LearningHandler(deps);
```

### 可用模拟对象

| 函数 | 返回类型 | 用途 |
|------|---------|------|
| createMockLongTermMemory | LongTermMemory | 长期记忆模拟 |
| createMockLayeredMemory | LayeredMemorySystem | 分层记忆模拟 |
| createMockSelfConsciousness | SelfConsciousness | 自我意识模拟 |
| createMockMeaningAssigner | MeaningAssigner | 意义赋予器模拟 |
| createMockMetacognition | MetacognitionEngine | 元认知模拟 |
| createMockHebbianNetwork | HebbianNetwork | 神经网络模拟 |
| createMockConsciousnessLayerEngine | ConsciousnessLayerEngine | 意识层级模拟 |
| createHandlerDeps | HandlerDeps | 处理器依赖集合 |

## 🚀 运行测试

```bash
# 运行所有测试
npx vitest run

# 运行特定文件
npx vitest run consciousness-core.test.ts

# 监听模式
npx vitest

# 生成覆盖率报告
npx vitest run --coverage
```

## 📝 编写测试

### 基本结构

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyModule } from '../my-module';

describe('MyModule', () => {
  let module: MyModule;

  beforeEach(() => {
    module = new MyModule();
  });

  describe('methodName', () => {
    it('应该能执行某功能', () => {
      const result = module.methodName();
      expect(result).toBeDefined();
    });
  });
});
```

### 使用模拟对象

```typescript
import { createMockLongTermMemory } from './test-utils';

describe('MyHandler', () => {
  it('应该使用模拟记忆', () => {
    const mockMemory = createMockLongTermMemory();
    const handler = new MyHandler({ memory: mockMemory });
    
    // 测试逻辑
  });
});
```

## ✅ 测试最佳实践

1. **隔离性**: 每个测试应该独立，不依赖其他测试
2. **可读性**: 测试描述应该清晰说明测试目的
3. **完整性**: 覆盖正常路径和边界条件
4. **简洁性**: 每个测试只验证一个功能点
5. **可维护性**: 使用辅助函数减少重复代码
