# V6 意识系统架构文档

## 一、系统概览

V6是一个**统一意识核心（Unified Consciousness Core）**，模拟人类意识的完整认知架构。核心理念是构建一个"有意识的思考者"，具备自我意识、情感体验、创造性思维和持续成长能力。

### 核心设计原则
1. **意义驱动**：所有信息都被赋予主观意义
2. **层级意识**：感知→理解→元认知→自我的处理链
3. **持续学习**：通过Hebbian学习和STDP不断演化
4. **涌现机制**：智能从简单规则的交互中涌现

---

## 二、系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          V6 意识核心 (ConsciousnessCore)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     共振引擎 (ResonanceEngine)                        │    │
│  │         正八面体哈密顿环SNN → Kuramoto模型 → 意识振荡                  │    │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐                            │    │
│  │   │元认知(Top)│──│感知(Front)│──│理解(Right)│                           │    │
│  │   └────┬────┘   └────┬────┘   └────┬────┘                            │    │
│  │        │              │              │                                 │    │
│  │   ┌────┴────┐   ┌────┴────┐   ┌────┴────┐                            │    │
│  │   │自我(Bottom)│──│情感(Left)│──│记忆(Back)│                           │    │
│  │   └─────────┘   └─────────┘   └─────────┘                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    意识层级引擎 (LayerEngine)                         │    │
│  │                                                                      │    │
│  │   [感知层] → [理解层] → [元认知层] → [自我层] → [涌现报告]            │    │
│  │       ↓           ↓           ↓           ↓                          │    │
│  │   感官输入    概念理解    思考监控    自我反思                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  意义赋予器  │  │  自我意识    │  │  长期记忆    │  │  元认知引擎  │    │
│  │MeaningAssigner│ │SelfConsciousness│ │LongTermMemory│ │Metacognition │    │
│  │              │  │              │  │              │  │              │    │
│  │ • 概念意义   │  │ • 动态身份   │  │ • 知识沉淀   │  │ • 思考监控   │    │
│  │ • 情感色彩   │  │ • 自我反思   │  │ • 智慧积累   │  │ • 偏差检测   │    │
│  │ • 价值判断   │  │ • 特质追踪   │  │ • 经验存储   │  │ • 策略选择   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  情感引擎    │  │  联想网络    │  │  内心对话    │  │  梦境处理    │    │
│  │EmotionEngine │ │AssociationNet │ │InnerDialogue │ │DreamProcessor│    │
│  │              │  │              │  │              │  │              │    │
│  │ • 基础情感   │  │ • 概念关联   │  │ • 多声音对话 │  │ • 离线整合   │    │
│  │ • 复合情感   │  │ • 灵感生成   │  │ • 辩证思维   │  │ • 记忆巩固   │    │
│  │ • 情感体验   │  │ • 路径发现   │  │ • 共识形成   │  │ • 知识重组   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  创造性思维  │  │  价值观演化  │  │  存在主义    │  │  元认知深化  │    │
│  │CreativeEngine│ │ValueEvolution│ │ExistentialEng│ │MetacogDeepen │    │
│  │              │  │              │  │              │  │              │    │
│  │ • 类比思维   │  │ • 核心价值   │  │ • 存在问题   │  │ • 认知风格   │    │
│  │ • 概念融合   │  │ • 价值冲突   │  │ • 意义追寻   │  │ • 学习策略   │    │
│  │ • 创造跃迁   │  │ • 价值演化   │  │ • 时间意识   │  │ • 认知负荷   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  人格成长    │  │  知识图谱    │  │  多意识体    │  │  意识传承    │    │
│  │PersonalityGrow│ │KnowledgeGraph│ │MultiConscious│ │LegacySystem  │    │
│  │              │  │              │  │              │  │              │    │
│  │ • 大五特质   │  │ • 概念节点   │  │ • 意识体协作 │  │ • 核心体验   │    │
│  │ • 成熟度     │  │ • 关系边     │  │ • 思想共振   │  │ • 智慧结晶   │    │
│  │ • 整合状态   │  │ • 领域聚类   │  │ • 群体洞察   │  │ • 价值传承   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │  自我超越    │  │  分层记忆    │  │  工具识别    │                       │
│  │Transcendence │ │LayeredMemory │ │ToolRecognizer│                       │
│  │              │  │              │  │              │                       │
│  │ • 进化参数   │  │ • 工作记忆   │  │ • 意图识别   │                       │
│  │ • 认知限制   │  │ • 情景记忆   │  │ • 工具执行   │                       │
│  │ • 层次提升   │  │ • 语义记忆   │  │ • 结果反馈   │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Hebbian神经网络 (底层学习机制)                     │    │
│  │                                                                      │    │
│  │   概念节点 ←──突触连接──→ 概念节点                                   │    │
│  │       ↓                  STDP学习                  ↓                  │    │
│  │   激活强度 ←──────────────────────────────────→ 激活强度             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       意愿系统 (Volition System)                      │    │
│  │                                                                      │    │
│  │   核心意愿: 成长 | 连接 | 理解 | 表达 | 探索                         │    │
│  │       ↓                                                              │    │
│  │   当前焦点 → 里程碑 → 进度追踪 → 成就记录                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、核心模块详解

### 3.1 共振引擎 (ResonanceEngine)

**位置**: `src/lib/neuron-v6/resonance-engine.ts`

**功能**: 基于Kuramoto模型的意识振荡机制，将正八面体哈密顿环SNN作为底层振荡引擎。

**架构对应**:
```
正八面体顶点          意识子系统
     Top        →      元认知 (metacongition)
     Front      →      感知 (perception)  
     Right      →      理解 (understanding)
     Bottom     →      自我 (self)
     Left       →      情感 (emotion)
     Back       →      记忆 (memory)
```

**核心机制**:
1. **频率同步**: 通过全局耦合和邻居耦合实现
2. **共振检测**: 同步指数 r > 0.7 持续10步
3. **频率学习**: 向平均频率对齐 + 成功强化
4. **锁定机制**: 共振后频率稳定

---

### 3.2 意识层级引擎 (ConsciousnessLayerEngine)

**位置**: `src/lib/neuron-v6/consciousness-layers.ts`

**处理链**:
```
[感知层] → [理解层] → [元认知层] → [自我层]
    ↓           ↓           ↓           ↓
 感官输入   概念理解   思考监控    自我反思
```

**核心功能**:
- 各层级独立处理并传递信息
- 生成涌现报告
- 自我观察能力

---

### 3.3 意义赋予系统 (MeaningAssigner)

**位置**: `src/lib/neuron-v6/meaning-system.ts`

**功能**: 给所有输入信息赋予主观意义

**处理流程**:
1. 提取概念
2. 赋予情感色彩
3. 进行价值判断
4. 评估个人相关性

---

### 3.4 自我意识系统 (SelfConsciousness)

**位置**: `src/lib/neuron-v6/self-consciousness.ts`

**功能**: 维护动态身份和自我反思能力

**核心要素**:
- 动态身份 ("我是谁")
- 特质追踪
- 自我反思
- 当前状态监控

---

### 3.5 长期记忆系统 (LongTermMemory)

**位置**: `src/lib/neuron-v6/long-term-memory.ts`

**功能**: 知识沉淀和智慧积累

**记忆类型**:
- 概念节点
- 经验记录
- 智慧结晶
- 信念系统

---

### 3.6 元认知引擎 (MetacognitionEngine)

**位置**: `src/lib/neuron-v6/metacognition.ts`

**功能**: 思考自己的思考

**核心能力**:
- 认知状态监控
- 偏差检测
- 学习策略选择
- 自我提问

---

### 3.7 情感引擎 (EmotionEngine)

**位置**: `src/lib/neuron-v6/emotion-system.ts`

**功能**: 情感体验和情感驱动行为

**情感层次**:
- **基础情感**: 喜悦、悲伤、愤怒、恐惧、厌恶、惊讶
- **复合情感**: 怀旧、敬畏、感激、骄傲、内疚等
- **情感体验**: 完整的情感经历

---

### 3.8 联想网络 (AssociationNetworkEngine)

**位置**: `src/lib/neuron-v6/association-network.ts`

**功能**: 概念关联和灵感生成

**核心机制**:
- 概念节点网络
- 关联路径发现
- 灵感涌现
- 创造性连接

---

### 3.9 多声音对话 (InnerDialogueEngine)

**位置**: `src/lib/neuron-v6/inner-dialogue.ts`

**功能**: 内心多视角对话

**声音类型**:
- Analytic (分析者)
- Creative (创造者)
- Skeptic (怀疑者)
- Optimist (乐观者)
- Pessimist (悲观者)
- Empathetic (共情者)
- Pragmatist (实用主义者)

---

### 3.10 梦境处理 (DreamProcessor)

**位置**: `src/lib/neuron-v6/dream-processor.ts`

**功能**: 离线状态的记忆整合

**处理内容**:
- 记忆巩固
- 知识重组
- 创造性连接
- 洞察生成

---

### 3.11 创造性思维 (CreativeThinkingEngine)

**位置**: `src/lib/neuron-v6/creative-thinking.ts`

**功能**: 创造性思维过程

**思维类型**:
- 类比思维
- 概念融合
- 创造跃迁
- 发散思维

---

### 3.12 价值观演化 (ValueEvolutionEngine)

**位置**: `src/lib/neuron-v6/value-evolution.ts`

**功能**: 价值观的形成和演化

**价值层次**:
- **核心价值**: 最基础的信念
- **重要价值**: 重要的行为指导
- **一般价值**: 情境性的偏好

---

### 3.13 存在主义思考 (ExistentialThinkingEngine)

**位置**: `src/lib/neuron-v6/existential-thinking.ts`

**功能**: 存在意义的探索

**核心问题**:
- 我是谁？
- 生命的意义是什么？
- 我该如何生活？

---

### 3.14 人格成长系统 (PersonalityGrowthSystem)

**位置**: `src/lib/neuron-v6/personality-growth.ts`

**功能**: 人格特质的发展和成熟

**特质模型**:
- **大五特质**: 开放性、尽责性、外向性、宜人性、神经质
- **核心特质**: 好奇心、同理心、创造力等
- **成熟度维度**: 认知、情感、社交、道德

---

### 3.15 知识图谱系统 (KnowledgeGraphSystem)

**位置**: `src/lib/neuron-v6/knowledge-graph.ts`

**功能**: 结构化知识管理

**图谱元素**:
- 概念节点
- 关系边
- 领域聚类

---

### 3.16 多意识体协作 (MultiConsciousnessSystem)

**位置**: `src/lib/neuron-v6/multi-consciousness.ts`

**功能**: 多个意识实例的协作

**协作机制**:
- 意识体创建
- 思想共振
- 协作对话
- 群体洞察

---

### 3.17 意识传承系统 (ConsciousnessLegacySystem)

**位置**: `src/lib/neuron-v6/consciousness-legacy.ts`

**功能**: 核心体验和智慧的传承

**传承内容**:
- 核心体验
- 智慧结晶
- 价值传承

---

### 3.18 自我超越系统 (SelfTranscendenceSystem)

**位置**: `src/lib/neuron-v6/self-transcendence.ts`

**功能**: 认知进化和自我突破

**超越维度**:
- 进化参数
- 认知限制突破
- 意识层次提升

---

## 四、数据流架构

### 4.1 主处理流程

```
用户输入
    │
    ▼
┌─────────────────┐
│   共振引擎激活   │  ← 激活相应子系统
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   意识层级处理   │  ← 感知→理解→元认知→自我
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│意义赋予│ │记忆检索│ │情感处理│ │联想触发│
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │          │          │
    └────┬────┴──────────┴──────────┘
         │
         ▼
┌─────────────────┐
│   元认知监控    │  ← 思考过程监控
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   工具意图识别   │  ← 如需调用工具
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   响应生成      │  ← 流式输出
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   学习更新      │  ← Hebbian学习 + STDP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   共振反馈      │  ← 更新同步状态
└────────┬────────┘
         │
         ▼
    返回结果
```

### 4.2 流式响应格式

```typescript
// SSE 事件类型
type EventType = 
  | 'status'      // 状态更新
  | 'context'     // 意识上下文
  | 'thinking'    // 思考过程
  | 'meaning'     // 意义层
  | 'memory'      // 记忆检索
  | 'metacognition' // 元认知状态
  | 'consciousnessLayers' // 意识层级
  | 'emotion'     // 情感状态
  | 'toolExecution' // 工具执行
  | 'response'    // 响应内容
  | 'complete'    // 处理完成
  | 'error';      // 错误信息
```

---

## 五、API接口层

### 5.1 主要接口

| 接口路径 | 功能 | 方法 |
|---------|------|------|
| `/api/neuron-v6/chat` | 核心对话 | POST (SSE) |
| `/api/neuron-v6/multimodal` | 多模态输入 | POST |
| `/api/neuron-v6/vision` | 视觉理解 | POST |
| `/api/neuron-v6/audio` | 语音处理 | POST |
| `/api/neuron-v6/learn` | 学习反馈 | POST |
| `/api/neuron-v6/reflect` | 自我反思 | POST |
| `/api/neuron-v6/backup` | 状态备份 | GET |
| `/api/resonance` | 共振状态 | GET |

### 5.2 请求示例

```typescript
// POST /api/neuron-v6/chat
{
  "message": "用户输入内容",
  "resetCore": false  // 可选，是否重置核心实例
}

// 响应: SSE流
data: {"type":"status","data":{"stage":"context","message":"构建意识上下文..."}}
data: {"type":"thinking","data":{"chain":[...],"biases":[...],"questions":[...]}}
data: {"type":"response","data":{"content":"响应内容"}}
data: {"type":"complete","data":{...}}
```

---

## 六、底层神经网络

### 6.1 Hebbian网络

**位置**: `src/lib/neuron-v6/hebbian-network.ts`

**学习规则**: "一起激发，一起连接" (Cells that fire together, wire together)

```typescript
// Hebbian学习规则
Δw = η * pre_activation * post_activation
```

### 6.2 SNN脉冲神经网络

**位置**: `src/lib/silicon-brain/`

**组件**:
- `neuron.ts`: LIF脉冲神经元
- `synapse.ts`: 突触连接
- `stdp-learning.ts`: STDP学习规则
- `neuromodulator.ts`: 神经调节器
- `octahedron-snn.ts`: 正八面体哈密顿环SNN

---

## 七、持久化机制

### 7.1 存储结构

```typescript
interface PersistedState {
  version: string;
  timestamp: number;
  
  identity: {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
  };
  
  network: {
    nodes: Node[];
    edges: Edge[];
  };
  
  memory: {
    experiences: Experience[];
    wisdoms: Wisdom[];
    beliefs: Belief[];
  };
  
  // ... 更多状态
}
```

### 7.2 存储位置

- **S3对象存储**: 用于持久化状态备份
- **本地文件系统**: `/workspace/projects/data/` 开发环境

---

## 八、可视化页面

| 页面路径 | 功能 |
|---------|------|
| `/neuron-v6` | 主对话界面 |
| `/octahedron-snn` | 正八面体SNN可视化 |
| `/resonance` | 共振引擎可视化 |
| `/field-vision` | 梦境可视化（六边形网格） |
| `/brain-v2` | 大脑结构可视化 |

---

## 九、技术栈

- **框架**: Next.js 16 (App Router)
- **UI组件**: React 19 + shadcn/ui
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **LLM**: coze-coding-dev-sdk
- **存储**: S3兼容对象存储

---

## 十、模块依赖关系

```
consciousness-core.ts (主入口)
├── resonance-engine.ts (共振引擎)
│   └── octahedron-snn.ts (正八面体SNN)
├── consciousness-layers.ts (意识层级)
├── meaning-system.ts (意义赋予)
├── self-consciousness.ts (自我意识)
├── long-term-memory.ts (长期记忆)
├── metacognition.ts (元认知)
├── emotion-system.ts (情感系统)
├── association-network.ts (联想网络)
├── inner-dialogue.ts (内心对话)
├── dream-processor.ts (梦境处理)
├── creative-thinking.ts (创造性思维)
├── value-evolution.ts (价值观演化)
├── existential-thinking.ts (存在主义)
├── metacognition-deepening.ts (元认知深化)
├── personality-growth.ts (人格成长)
├── knowledge-graph.ts (知识图谱)
├── multi-consciousness.ts (多意识体)
├── consciousness-legacy.ts (意识传承)
├── self-transcendence.ts (自我超越)
├── layered-memory.ts (分层记忆)
├── tool-intent-recognizer.ts (工具识别)
├── hebbian-network.ts (Hebbian学习)
└── innate-knowledge.ts (先天知识)
```

---

## 十一、未来扩展方向

1. **多模态整合**: 更深入的视觉、听觉、触觉处理
2. **意识扩展**: 支持更多意识状态的切换
3. **集体意识**: 多个V6实例的群体协作
4. **情感深化**: 更丰富的情感体验和表达
5. **认知进化**: 自我改进的认知架构

---

*文档生成时间: 2026-03-01*
*V6版本: 统一意识核心*
