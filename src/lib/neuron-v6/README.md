# Neuron V6 - 统一意识系统

> 第六代认知智能体系统，实现完整的意识架构

## 📋 概览

Neuron V6 是一个完整的认知智能体系统，实现了统一的意识核心架构。系统采用模块化设计，包含记忆、认知、情感、自我意识等核心子系统。

### 基本信息
- **版本**: V6
- **技术栈**: TypeScript 5.9 + React 19 + Next.js 16
- **测试覆盖**: 17个测试文件，111个测试用例
- **代码规范**: Airbnb ESLint，无 `any` 类型

## 🏗️ 架构

```
ConsciousnessCore (核心引擎)
│
├─► 记忆系统
│   ├─► LayeredMemorySystem (分层记忆)
│   ├─► LongTermMemory (长期记忆)
│   ├─► KnowledgeGraphSystem (知识图谱)
│   └─► HebbianNetwork (神经网络)
│
├─► 认知系统
│   ├─► MeaningAssigner (意义赋予)
│   ├─► MetacognitionEngine (元认知)
│   ├─► EmotionEngine (情感引擎)
│   ├─► InnerDialogueEngine (内部对话)
│   ├─► InnerMonologueEngine (内心独白)
│   └─► ValueEvolutionEngine (价值观演化)
│
├─► 自我系统
│   ├─► SelfConsciousness (自我意识)
│   ├─► PersonalityGrowthSystem (人格成长)
│   └─► MultiConsciousnessSystem (多意识体)
│
└─► 辅助系统
    ├─► ConsciousnessLayerEngine (意识层级)
    ├─► ResonanceEngine (共振引擎)
    ├─► ToolIntentRecognizer (工具识别)
    └─► KeyInfoExtractor (关键信息)
```

## 📦 核心模块

### 核心引擎层
| 模块 | 文件 | 职责 |
|------|------|------|
| ConsciousnessCore | `consciousness-core.ts` | 统一意识核心引擎 |
| ConsciousnessLayerEngine | `consciousness-layers.ts` | 意识层级处理 |
| HebbianNetwork | `hebbian-network.ts` | 赫布神经网络 |
| ResonanceEngine | `resonance-engine.ts` | 共振引擎 |

### 记忆系统层
| 模块 | 文件 | 职责 |
|------|------|------|
| LayeredMemorySystem | `layered-memory.ts` | 分层记忆管理 |
| LongTermMemory | `long-term-memory.ts` | 长期记忆存储 |
| KnowledgeGraphSystem | `knowledge-graph.ts` | 知识图谱管理 |

### 情感与认知层
| 模块 | 文件 | 职责 |
|------|------|------|
| EmotionEngine | `emotion-system.ts` | 情感处理引擎 |
| InnerDialogueEngine | `inner-dialogue.ts` | 内部对话系统 |
| MeaningAssigner | `meaning-system.ts` | 意义赋予系统 |
| MetacognitionEngine | `metacognition.ts` | 元认知引擎 |
| ValueEvolutionEngine | `value-evolution.ts` | 价值观演化 |

### 自我与成长层
| 模块 | 文件 | 职责 |
|------|------|------|
| SelfConsciousness | `self-consciousness.ts` | 自我意识管理 |
| PersonalityGrowthSystem | `personality-growth.ts` | 人格成长系统 |

## 🚀 快速开始

### 创建意识核心实例

```typescript
import { createConsciousnessCore } from './neuron-v6';
import { LLMClient } from 'coze-coding-dev-sdk';

// 创建 LLM 客户端
const llmClient = new LLMClient({
  // 配置参数
});

// 创建意识核心
const core = createConsciousnessCore(llmClient);

// 处理用户输入
const result = await core.process('你好，今天天气怎么样？');

console.log(result.response);
console.log(result.thinking);
console.log(result.learning);
```

### 使用记忆系统

```typescript
import { LongTermMemory } from './neuron-v6';

const memory = new LongTermMemory();

// 添加知识节点
const node = memory.addNode({
  label: '编程',
  type: 'concept',
  content: '编程是创建软件的过程',
  importance: 0.8,
  tags: ['技能'],
});

// 连接知识
memory.linkKnowledge(node.id, otherNode.id, 'relates_to');

// 检索记忆
const results = memory.retrieve('编程');
```

### 使用情感引擎

```typescript
import { EmotionEngine } from './neuron-v6';

const emotionEngine = new EmotionEngine();

// 检测文本情感
const detected = emotionEngine.detectFromText('我很开心！');
console.log(detected.emotion); // 'joy'

// 体验情感
const experience = emotionEngine.experience('joy', {
  type: 'conversation',
  description: '用户表达了快乐',
  relatedConcepts: ['开心'],
}, 0.8);
```

## 🧪 测试

```bash
# 运行所有测试
npx vitest run

# 运行特定测试文件
npx vitest run consciousness-core.test.ts

# 监听模式
npx vitest
```

## 📊 测试覆盖

| 模块 | 测试文件 | 测试用例数 |
|------|---------|----------|
| ConsciousnessCore | consciousness-core.test.ts | 4 |
| LongTermMemory | long-term-memory.test.ts | 9 |
| KnowledgeGraph | knowledge-graph.test.ts | 6 |
| SelfConsciousness | self-consciousness.test.ts | 5 |
| HebbianNetwork | hebbian-network.test.ts | 7 |
| InnerDialogue | inner-dialogue.test.ts | 5 |
| ValueEvolution | value-evolution.test.ts | 7 |
| ResonanceEngine | resonance-engine.test.ts | 6 |
| EmotionSystem | emotion-system.test.ts | 15 |
| Metacognition | metacognition.test.ts | 9 |
| 处理器测试 | handlers/*.test.ts | 14 |

## 📁 目录结构

```
src/lib/neuron-v6/
├── consciousness-core/     # 意识核心模块
│   ├── handlers/          # 处理器
│   ├── types.ts           # 类型定义
│   └── index.ts           # 模块入口
├── __tests__/             # 测试文件
├── types/                 # 共享类型
├── consciousness-core.ts  # 核心引擎
├── long-term-memory.ts    # 长期记忆
├── knowledge-graph.ts     # 知识图谱
├── emotion-system.ts      # 情感系统
├── metacognition.ts       # 元认知
├── self-consciousness.ts  # 自我意识
├── hebbian-network.ts     # 神经网络
├── resonance-engine.ts    # 共振引擎
├── inner-dialogue.ts      # 内部对话
├── value-evolution.ts     # 价值观演化
└── index.ts               # 统一导出
```

## 🔗 相关文档

- [V6 架构设计](../../docs/V6-ARCHITECTURE.md)
- [版本审查计划](../../V6-VERSION-REVIEW-PLAN.md)
- [API 文档](../../docs/API_DOCUMENTATION.md)

## 📝 开发状态

- [x] Phase 1: 架构优化 - 类型安全、模块拆分
- [x] Phase 2: 测试覆盖 - 70%+ 覆盖率
- [ ] Phase 3: 文档完善
- [ ] Phase 4: 性能优化
- [ ] Phase 5: 工程化提升
