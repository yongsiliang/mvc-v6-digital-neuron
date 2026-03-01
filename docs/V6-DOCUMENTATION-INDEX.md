# Neuron V6 文档索引

> 统一的文档导航

## 📚 核心文档

| 文档 | 描述 | 路径 |
|------|------|------|
| V6 版本审查计划 | 版本优化计划和进度 | [V6-VERSION-REVIEW-PLAN.md](../../V6-VERSION-REVIEW-PLAN.md) |
| V6 架构设计 | 系统架构详细说明 | [V6-ARCHITECTURE.md](./V6-ARCHITECTURE.md) |
| API 文档 | 接口使用说明 | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |

## 📦 模块文档

### 核心引擎

| 模块 | 文档 | 测试 |
|------|------|------|
| ConsciousnessCore | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/consciousness-core.test.ts) |
| ResonanceEngine | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/resonance-engine.test.ts) |
| HebbianNetwork | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/hebbian-network.test.ts) |

### 记忆系统

| 模块 | 文档 | 测试 |
|------|------|------|
| LongTermMemory | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/long-term-memory.test.ts) |
| KnowledgeGraph | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/knowledge-graph.test.ts) |
| LayeredMemory | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/layered-memory.test.ts) |

### 认知系统

| 模块 | 文档 | 测试 |
|------|------|------|
| EmotionEngine | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/emotion-system.test.ts) |
| MetacognitionEngine | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/metacognition.test.ts) |
| InnerDialogueEngine | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/inner-dialogue.test.ts) |
| ValueEvolutionEngine | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/value-evolution.test.ts) |

### 自我系统

| 模块 | 文档 | 测试 |
|------|------|------|
| SelfConsciousness | 内联文档 | [测试](../src/lib/neuron-v6/__tests__/self-consciousness.test.ts) |

### 处理器

| 处理器 | 文档 | 测试 |
|--------|------|------|
| LearningHandler | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/handlers/learning-handler.test.ts) |
| ReflectionHandler | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/handlers/reflection-handler.test.ts) |
| ContextBuilder | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/handlers/context-builder.test.ts) |
| VolitionHandler | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/handlers/volition-handler.test.ts) |
| ThinkingHandler | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/handlers/thinking-handler.test.ts) |
| StreamHandler | [README.md](../src/lib/neuron-v6/consciousness-core/README.md) | [测试](../src/lib/neuron-v6/__tests__/handlers/stream-handler.test.ts) |

## 🧪 测试文档

- [测试套件文档](../src/lib/neuron-v6/__tests__/README.md) - 完整测试说明

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
npx vitest run
```

### 启动开发服务

```bash
coze dev
```

## 📊 项目状态

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| Phase 1: 架构优化 | ✅ 完成 | 100% |
| Phase 2: 测试覆盖 | ✅ 完成 | 70%+ |
| Phase 3: 文档完善 | 🔄 进行中 | 50% |
| Phase 4: 性能优化 | ⏳ 待开始 | 0% |
| Phase 5: 工程化提升 | ⏳ 待开始 | 0% |

## 🔗 外部资源

- [Vite 文档](https://vitejs.dev/)
- [Vitest 文档](https://vitest.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
