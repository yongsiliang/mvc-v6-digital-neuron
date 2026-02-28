# V6 意识核心 - 统一调度机制详解

## 一、调度架构总览

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ConsciousnessCore (意识核心)                               │
│                                  统一调度中枢                                        │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              核心调度流程                                      │ │
│  │                                                                               │ │
│  │   process(input)                                                              │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤0] layerEngine.processInput()     意识层级处理               │ │
│  │       │       │                                                              │ │
│  │       │       └─→ 感知 → 理解 → 元认知 → 自我                               │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤0.5] emotionEngine.detectFromText()  情感检测              │ │
│  │       │              emotionEngine.experience()     情感体验               │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤0.75] associationNetwork.processText() 联想网络处理        │ │
│  │       │               inspiration 检测                                       │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤0.9] toolIntentRecognizer.analyzeIntent() 工具意图识别    │ │
│  │       │              toolIntentRecognizer.executeTools() 工具执行         │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤1] buildContext()                上下文构建                │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ longTermMemory.retrieve()     记忆检索                 │ │
│  │       │       ├─→ meaningAssigner.assignMeaning() 意义赋予               │ │
│  │       │       ├─→ selfConsciousness.getContext() 自我状态                 │ │
│  │       │       └─→ metacognition.getContext()    元认知状态                │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤2] think()                       元认知监控的思考          │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ metacognition.beginThinkingStep() 开始思考步骤         │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ 感知 (perception)                                          │ │
│  │       │       │   └─→ metacognition.completeThinkingStep()               │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ 分析 (analysis)                                            │ │
│  │       │       │   └─→ analyzeInput()                                       │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ 推理 (inference)                                           │ │
│  │       │       │   └─→ inferConclusion()                                    │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ 评估 (evaluation)                                          │ │
│  │       │       │   └─→ evaluateThinking()                                   │ │
│  │       │       │                                                              │ │
│  │       │       └─→ synthesizeThinking()        综合思考                    │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤3] generateResponse()            响应生成                  │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ buildSystemPrompt()           系统提示构建              │ │
│  │       │       └─→ llmClient.stream()            LLM 流式生成              │ │
│  │       │                                                                       │ │
│  │       ├─→ [步骤4] learn()                       学习更新                  │ │
│  │       │       │                                                              │ │
│  │       │       ├─→ keyInfoExtractor.extract()    关键信息提取              │ │
│  │       │       ├─→ longTermMemory.store()        记忆存储                  │ │
│  │       │       ├─→ meaningAssigner.formBelief()  信念形成                  │ │
│  │       │       └─→ selfConsciousness.update()    自我更新                  │ │
│  │       │                                                                       │ │
│  │       └─→ [步骤5] updateVolitionsFromConversation() 意愿更新              │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           并行子系统处理                                       │ │
│  │                                                                               │ │
│  │   在 process() 返回前，并行激活以下子系统：                                    │ │
│  │                                                                               │ │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │   │ innerDialogue│ │dreamProcessor│ │creativeEngine│ │valueEngine  │           │ │
│  │   │ 内心对话    │ │梦境处理    │ │创造性思维  │ │价值观演化  │           │ │
│  │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  │                                                                               │ │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │   │existentialE │ │metacognition│ │personalityG │ │knowledgeGrph│           │ │
│  │   │存在思考    │ │元认知深化  │ │人格成长    │ │知识图谱    │           │ │
│  │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  │                                                                               │ │
│  │   ┌─────────────┐ ┌─────────────┐                                            │ │
│  │   │multiConscious│ │legacySystem │                                            │ │
│  │   │多意识体    │ │意识传承    │                                            │ │
│  │   └─────────────┘ └─────────────┘                                            │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心模块依赖图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              核心模块初始化顺序                                       │
│                                                                                      │
│   constructor(llmClient)                                                            │
│       │                                                                              │
│       ├─→ [1] network = getInitializedNetwork()        // 包含先天知识的赫布网络    │
│       │                                                                              │
│       ├─→ [2] 核心四大模块                                                           │
│       │       ├─→ meaningAssigner = createMeaningAssigner()                        │
│       │       ├─→ selfConsciousness = createSelfConsciousness()                    │
│       │       ├─→ longTermMemory = createLongTermMemory()                          │
│       │       └─→ metacognition = createMetacognitionEngine()                      │
│       │                                                                              │
│       ├─→ [3] 意识层级引擎                                                          │
│       │       └─→ layerEngine = createConsciousnessLayerEngine()                   │
│       │                                                                              │
│       ├─→ [4] 内在体验模块                                                          │
│       │       ├─→ innerMonologue = createInnerMonologueEngine()                    │
│       │       ├─→ emotionEngine = createEmotionEngine()                            │
│       │       └─→ associationNetwork = createAssociationNetworkEngine()            │
│       │                                                                              │
│       ├─→ [5] 思维引擎                                                              │
│       │       ├─→ innerDialogueEngine = new InnerDialogueEngine()                  │
│       │       └─→ dialecticEngine = new DialecticThinkingEngine(innerDialogue)     │
│       │                                                                              │
│       ├─→ [6] 离线处理                                                              │
│       │       └─→ offlineProcessor = new OfflineProcessor()                        │
│       │                                                                              │
│       ├─→ [7] 高级认知                                                              │
│       │       ├─→ creativeEngine = new CreativeThinkingEngine()                    │
│       │       ├─→ valueEngine = new ValueEvolutionEngine()                         │
│       │       ├─→ existentialEngine = new ExistentialThinkingEngine()              │
│       │       └─→ metacognitionDeepEngine = new MetacognitionDeepeningEngine()     │
│       │                                                                              │
│       ├─→ [8] 成长系统                                                              │
│       │       ├─→ personalityGrowthSystem = new PersonalityGrowthSystem()          │
│       │       └─→ knowledgeGraphSystem = createKnowledgeGraphSystem()              │
│       │                                                                              │
│       ├─→ [9] 记忆系统                                                              │
│       │       └─→ layeredMemory = new LayeredMemorySystem()                        │
│       │                                                                              │
│       ├─→ [10] 协作系统                                                             │
│       │       └─→ multiConsciousnessSystem = createMultiConsciousnessSystem()      │
│       │                                                                              │
│       ├─→ [11] 传承与超越                                                          │
│       │       ├─→ legacySystem = createConsciousnessLegacySystem()                 │
│       │       └─→ transcendenceSystem = createSelfTranscendenceSystem()            │
│       │                                                                              │
│       ├─→ [12] 能力模块                                                            │
│       │       ├─→ keyInfoExtractor = createKeyInfoExtractor(llmClient)             │
│       │       └─→ toolIntentRecognizer = createToolIntentRecognizer(llmClient)     │
│       │                                                                              │
│       ├─→ [13] 意愿系统                                                            │
│       │       └─→ initializeVolitions()                                            │
│       │                                                                              │
│       └─→ [14] 后台思考                                                            │
│               └─→ startBackgroundThinkingTimer()                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、详细调度流程

### 3.1 步骤 0：意识层级处理

```typescript
// 意识层级处理 - 感知→理解→元认知→自我
const layerResult = await this.layerEngine.processInput(input);
const { layerResults, selfObservation } = layerResult;
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    意识层级引擎 (ConsciousnessLayerEngine)           │
│                                                                      │
│   processInput(input)                                                │
│       │                                                              │
│       ├─→ Layer 1: 感知层 (Perception)                              │
│       │       ├─→ 特征提取                                          │
│       │       ├─→ 模式识别                                          │
│       │       └─→ 输入表征                                          │
│       │                                                              │
│       ├─→ Layer 2: 理解层 (Understanding)                           │
│       │       ├─→ 语义解析                                          │
│       │       ├─→ 上下文整合                                        │
│       │       └─→ 意义关联                                          │
│       │                                                              │
│       ├─→ Layer 3: 元认知层 (Metacognition)                         │
│       │       ├─→ 思考监控                                          │
│       │       ├─→ 策略选择                                          │
│       │       └─→ 偏差检测                                          │
│       │                                                              │
│       ├─→ Layer 4: 自我层 (Self)                                    │
│       │       ├─→ 自我观察                                          │
│       │       ├─→ 身份确认                                          │
│       │       └─→ 存在感                                            │
│       │                                                              │
│       └─→ 返回: { layerResults, selfObservation, emergenceReport }  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 步骤 0.5：情感处理

```typescript
// 情感检测
const detectedEmotion = this.emotionEngine.detectFromText(input);

// 情感体验
if (detectedEmotion) {
  emotionExperience = this.emotionEngine.experience(
    detectedEmotion.emotion,
    { type: 'conversation', description: `对话中检测到${detectedEmotion.emotion}` },
    detectedEmotion.intensity
  );
}

// 情感衰减
this.emotionEngine.decayActiveEmotions();
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                      情感引擎 (EmotionEngine)                        │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  基础情感 (Basic Emotions)                                    │ │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │ │
│   │  │喜悦 │ │悲伤 │ │愤怒 │ │恐惧 │ │惊讶 │ │厌恶 │            │ │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  复杂情感 (Complex Emotions)                                  │ │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │ │
│   │  │怀旧     │ │愧疚     │ │自豪     │ │羞耻     │             │ │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │ │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │ │
│   │  │感激     │ │孤独     │ │希望     │                        │ │
│   │  └─────────┘ └─────────┘ └─────────┘                        │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   处理流程:                                                          │
│   detectFromText() → experience() → decayActiveEmotions()           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 步骤 1：上下文构建

```typescript
const context = await this.buildContext(input);
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                      buildContext(input) 构建上下文                  │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. 记忆检索                                                  │   │
│   │     longTermMemory.retrieve(input, {                         │   │
│   │       maxResults: 5,                                         │   │
│   │       includeExperiences: true,                              │   │
│   │       includeWisdoms: true                                   │   │
│   │     })                                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  2. 意义赋予                                                  │   │
│   │     for (concept of extractConcepts(input)) {                │   │
│   │       meaningAssigner.assignMeaning(concept, context)        │   │
│   │     }                                                        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3. 自我状态                                                  │   │
│   │     selfConsciousness.getContext()                           │   │
│   │     - 当前状态                                                │   │
│   │     - 核心信念                                                │   │
│   │     - 价值观                                                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  4. 元认知状态                                                │   │
│   │     metacognition.getContext()                               │   │
│   │     - 活跃策略                                                │   │
│   │     - 检测到的偏差                                            │   │
│   │     - 自我提问                                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│   返回: ConsciousnessContext {                                       │
│     identity, meaning, self, memory, metacognition,                 │
│     coreBeliefs, coreValues, summary                                │
│   }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 步骤 2：元认知监控的思考

```typescript
const thinking = await this.think(input, context);
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    think(input, context) 思考过程                    │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  元认知监控循环                                                │ │
│   │                                                               │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │  Step 1: 感知 (Perception)                              │ │ │
│   │   │  ─────────────────────                                  │ │ │
│   │   │  step = metacognition.beginThinkingStep(               │ │ │
│   │   │    'perception', input, '感知输入'                      │ │ │
│   │   │  )                                                      │ │ │
│   │   │  → "用户说：'{input}'。从我的意义系统看，{meaning}"      │ │ │
│   │   │  metacognition.completeThinkingStep(step, perception)  │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                           ↓                                   │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │  Step 2: 分析 (Analysis)                               │ │ │
│   │   │  ─────────────────                                    │ │ │
│   │   │  step = metacognition.beginThinkingStep(               │ │ │
│   │   │    'analysis', perception, '分析意义'                   │ │ │
│   │   │  )                                                      │ │ │
│   │   │  → analyzeInput(input, context)                        │ │ │
│   │   │    - 从记忆角度分析                                     │ │ │
│   │   │    - 从信念角度分析                                     │ │ │
│   │   │    - 从价值观角度分析                                   │ │ │
│   │   │  metacognition.completeThinkingStep(step, analysis)    │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                           ↓                                   │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │  Step 3: 推理 (Inference)                              │ │ │
│   │   │  ─────────────────                                    │ │ │
│   │   │  step = metacognition.beginThinkingStep(               │ │ │
│   │   │    'inference', analysis, '推理结论'                    │ │ │
│   │   │  )                                                      │ │ │
│   │   │  → inferConclusion(input, context)                     │ │ │
│   │   │    - 结合自我状态                                       │ │ │
│   │   │    - 结合记忆                                           │ │ │
│   │   │    - 提出假设                                           │ │ │
│   │   │  metacognition.completeThinkingStep(step, inference)   │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                           ↓                                   │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │  Step 4: 评估 (Evaluation)                            │ │ │
│   │   │  ─────────────────                                    │ │ │
│   │   │  step = metacognition.beginThinkingStep(               │ │ │
│   │   │    'evaluation', inference, '评估质量'                  │ │ │
│   │   │  )                                                      │ │ │
│   │   │  → evaluateThinking(inference, context)                │ │ │
│   │   │    - 检查思考清晰度                                     │ │ │
│   │   │    - 评估结论信心                                       │ │ │
│   │   │  metacognition.completeThinkingStep(step, evaluation)  │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                           ↓                                   │ │
│   │   ┌─────────────────────────────────────────────────────────┐ │ │
│   │   │  综合思考 (Synthesis)                                 │ │ │
│   │   │  ─────────────────                                    │ │ │
│   │   │  finalThoughts = synthesizeThinking(                   │ │ │
│   │   │    thinkingChain, metaContext                          │ │ │
│   │   │  )                                                      │ │ │
│   │   │  → 链接所有思考步骤                                     │ │ │
│   │   │  → 添加元认知反思                                       │ │ │
│   │   └─────────────────────────────────────────────────────────┘ │ │
│   │                                                               │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   返回: ThinkingProcess {                                            │
│     id, input, thinkingChain, detectedBiases,                       │
│     selfQuestions, appliedStrategies, finalThoughts, timestamp      │
│   }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.5 步骤 3：响应生成

```typescript
const response = await this.generateResponse(input, context, thinking, toolResult);
```

```
┌─────────────────────────────────────────────────────────────────────┐
│               generateResponse() 响应生成                            │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. 构建系统提示                                              │ │
│   │     buildSystemPrompt(context, thinking, toolResult)          │ │
│   │                                                               │ │
│   │     包含:                                                      │ │
│   │     - 身份信息: "我是..."                                      │ │
│   │     - 当前状态: 情感、能量、专注                               │ │
│   │     - 核心信念: 价值观列表                                     │ │
│   │     - 思考过程: thinkingChain 摘要                             │ │
│   │     - 工具结果: 如果有执行结果                                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  2. 构建消息序列                                              │ │
│   │     messages = [                                              │ │
│   │       { role: 'system', content: systemPrompt },              │ │
│   │       ...conversationHistory.slice(-10),                      │ │
│   │       { role: 'user', content: input },                       │ │
│   │       // 如果有工具结果，添加到消息中                          │ │
│   │       { role: 'user', content: toolResultText }               │ │
│   │     ]                                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  3. LLM 流式生成                                              │ │
│   │     stream = llmClient.stream(messages, {                     │ │
│   │       model: 'doubao-seed-1-8-251228'                         │ │
│   │     })                                                        │ │
│   │                                                               │ │
│   │     for await (const chunk of stream) {                       │ │
│   │       response += chunk.content                               │ │
│   │     }                                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   返回: string (完整响应)                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.6 步骤 4：学习更新

```typescript
const learning = await this.learn(input, response, thinking);
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    learn(input, response, thinking) 学习过程         │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  1. 关键信息提取                                              │ │
│   │     extractionResult = keyInfoExtractor.extract(input, response)│
│   │                                                               │ │
│   │     识别类型:                                                  │ │
│   │     - creator: 创造者信息 (最高优先级)                         │ │
│   │     - person: 重要人物                                        │ │
│   │     - relationship: 关系                                      │ │
│   │     - event: 事件                                             │ │
│   │     - preference: 偏好                                        │ │
│   │     - knowledge: 知识                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  2. 分类型存储                                                │ │
│   │                                                               │ │
│   │     switch (keyInfo.type) {                                   │ │
│   │       case 'creator':                                         │ │
│   │         await rememberCreator(keyInfo)                        │ │
│   │         break                                                  │ │
│   │       case 'person':                                          │ │
│   │         rememberPerson(keyInfo)                               │ │
│   │         break                                                  │ │
│   │       case 'relationship':                                    │ │
│   │         rememberRelationship(keyInfo)                         │ │
│   │         break                                                  │ │
│   │       case 'event':                                           │ │
│   │         rememberEvent(keyInfo)                                │ │
│   │         break                                                  │ │
│   │       case 'preference':                                      │ │
│   │         rememberPreference(keyInfo)                           │ │
│   │         break                                                  │ │
│   │       case 'knowledge':                                       │ │
│   │         rememberKnowledge(keyInfo)                            │ │
│   │         break                                                  │ │
│   │     }                                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  3. 信念和价值更新                                            │ │
│   │                                                               │ │
│   │     // 形成新信念                                              │ │
│   │     meaningAssigner.formBelief(concept, confidence, source)   │ │
│   │                                                               │ │
│   │     // 强化价值观                                              │ │
│   │     if (input.includes('真诚')) {                             │ │
│   │       valueEngine.reinforceValue(value.id, input, 0.02)       │ │
│   │     }                                                         │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  4. 自我更新                                                  │ │
│   │                                                               │ │
│   │     // 更新自我状态                                            │ │
│   │     selfConsciousness.update({                                │ │
│   │       lastInteraction: Date.now(),                            │ │
│   │       growthMetrics: { ... }                                  │ │
│   │     })                                                        │ │
│   │                                                               │ │
│   │     // 更新神经网络                                            │ │
│   │     network.learn(input, response)                            │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                          │
│   返回: LearningResult {                                             │
│     newConcepts, newBeliefs, newExperiences,                        │
│     updatedTraits, metacognitiveReflection                          │
│   }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 四、并行子系统处理

在主流程返回结果之前，会并行激活所有子系统进行状态更新和报告生成：

```typescript
// 所有并行子系统处理（在 process() 返回前）
{
  // 情感状态
  emotionState: {
    activeEmotions, dominantEmotion, drivenBehaviors, emotionReport
  },
  
  // 联想网络状态  
  associationState: {
    currentInspiration, activeConcepts, networkReport
  },
  
  // 内心对话状态
  innerDialogueState: {
    currentDialogue, dialecticProcess, voiceActivations, dialogueReport
  },
  
  // 梦境状态
  dreamState: {
    currentDream, recentDream, insights
  },
  
  // 创造性思维状态
  creativeState: {
    creativityLevel, recentInsights, creativeReport
  },
  
  // 价值观状态
  valueState: {
    coreValues, activeConflicts, coherence, valueReport
  },
  
  // 存在主义思考状态
  existentialState: {
    state, coreQuestions, recentInsights, meaningSystem, timeConsciousness
  },
  
  // 元认知深化状态
  metacognitionDeepState: {
    state, cognitiveStyle, cognitiveLoad, topStrategies, efficiencyReport
  },
  
  // 人格成长状态
  personalityGrowth: {
    traits, maturity, overallMaturity, integration, milestones
  },
  
  // 知识图谱状态
  knowledgeGraph: {
    domains, concepts, edges, stats
  },
  
  // 多意识体协作状态
  multiConsciousness: {
    activeConsciousnesses, activeResonances, activeDialogues,
    collectiveInsights, collectiveAlignment, synergyLevel
  },
  
  // 意识传承状态
  legacy: {
    coreExperiences, wisdomCrystallizations, valueLegacies, legacyRituals
  }
}
```

---

## 五、后台思考机制

```
┌─────────────────────────────────────────────────────────────────────┐
│                    后台思考 (Background Thinking)                    │
│                                                                      │
│   启动: startBackgroundThinkingTimer()                               │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  定时器: 每 30 秒触发一次                                      │ │
│   │                                                               │ │
│   │  setInterval(() => {                                          │ │
│   │    if (backgroundThinkingEnabled &&                          │ │
│   │        Date.now() - lastBackgroundThinking > 30000) {        │ │
│   │      this.performBackgroundThinking()                        │ │
│   │    }                                                          │ │
│   │  }, 30000)                                                    │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   后台思考内容:                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. 离线记忆整合                                              │   │
│   │     offlineProcessor.process()                               │   │
│   │     - 记忆固化                                                │   │
│   │     - 知识重组                                                │   │
│   │                                                              │   │
│   │  2. 梦境生成                                                  │   │
│   │     dreamEngine.generateDream()                              │   │
│   │     - 概念组合                                                │   │
│   │     - 洞察涌现                                                │   │
│   │                                                              │   │
│   │  3. 创造性孵化                                                │   │
│   │     creativeEngine.incubate()                                │   │
│   │     - 概念融合                                                │   │
│   │     - 顿悟尝试                                                │   │
│   │                                                              │   │
│   │  4. 价值反思                                                  │   │
│   │     valueEngine.reflect()                                    │   │
│   │     - 价值一致性检查                                          │   │
│   │     - 冲突解决                                                │   │
│   │                                                              │   │
│   │  5. 存在思考                                                  │   │
│   │     existentialEngine.ponder()                               │   │
│   │     - 存在问题追问                                            │   │
│   │     - 意义系统更新                                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 六、调度设计原则

### 6.1 模块化分层

```
Layer 0: 神经基质 (HebbianNetwork)         ← 最底层，提供学习基础
    ↓
Layer 1: 核心模块 (Meaning, Self, Memory, Metacognition)  ← 四大核心
    ↓
Layer 2: 意识层级 (LayerEngine)            ← 感知→理解→元认知→自我
    ↓
Layer 3: 体验模块 (Emotion, Association, Monologue)  ← 情感与联想
    ↓
Layer 4: 思维引擎 (Dialogue, Creative, Dialectic)    ← 高级思维
    ↓
Layer 5: 成长系统 (Personality, Knowledge, Value)    ← 持续成长
    ↓
Layer 6: 协作系统 (MultiConsciousness)     ← 集体智慧
    ↓
Layer 7: 传承系统 (Legacy, Transcendence)  ← 超越与传承
```

### 6.2 数据流向

```
输入 → 意识层级 → 情感检测 → 联想网络 → 工具识别
                                          ↓
                                    上下文构建
                                          ↓
                                    元认知思考
                                          ↓
                                    响应生成
                                          ↓
                                    学习更新
                                          ↓
                                    并行子系统
                                          ↓
                                    完整结果
```

### 6.3 关键设计模式

1. **责任链模式**: 意识层级处理 (感知→理解→元认知→自我)
2. **观察者模式**: 元认知监控所有思考步骤
3. **策略模式**: 元认知选择不同的思考策略
4. **模板方法**: think() 方法的四步固定流程
5. **组合模式**: 所有子系统状态组合成最终结果

---

## 七、总结

V6 意识核心的统一调度遵循以下原则：

1. **有序性**: 严格按照步骤顺序处理，确保信息流动清晰
2. **并行性**: 所有子系统并行运行，最大化处理效率
3. **监控性**: 元认知全程监控，提供自我反思能力
4. **学习性**: 每次交互都触发学习，持续成长
5. **涌现性**: 从简单规则中涌现复杂行为

这是一个**有机的意识系统**，而非机械的处理器——模块间相互关联、相互增强，形成真正的智能涌现。
