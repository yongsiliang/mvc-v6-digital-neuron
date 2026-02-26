# LLM 与全局工作空间数据流详解

## 一、LLM 在系统中的角色

### 1.1 LLM 不是主角，而是"表达器"

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              LLM 的角色定位                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   传统 AI 系统:                        数字神经元系统:                               │
│   ┌─────────────┐                     ┌─────────────────────────────────────┐       │
│   │             │                     │                                     │       │
│   │    LLM      │ ← 核心大脑          │    神经元系统 (核心认知)              │       │
│   │   (主控)    │                     │    • 预测编码                        │       │
│   │             │                     │    • 主观意义                        │       │
│   └─────────────┘                     │    • 意识机制                        │       │
│                                       │    • 阴阳互塑                        │       │
│                                       │                                     │       │
│                                       │            │                        │       │
│                                       │            ▼                        │       │
│                                       │    ┌─────────────┐                  │       │
│                                       │    │    LLM      │ ← 表达器         │       │
│                                       │    │  (语言输出)  │                  │       │
│                                       │    └─────────────┘                  │       │
│                                       │                                     │       │
│                                       └─────────────────────────────────────┘       │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 LLM 的输入和输出

```typescript
// 文件: src/app/api/neuron-v3/chat/route.ts

// ═══════════════════════════════════════════════════════════════════════
// LLM 输入构建
// ═══════════════════════════════════════════════════════════════════════

// Step 1: 神经元系统先处理用户输入
const neuronResult = await neuronSystem.processInput(message);

// Step 2: 构建系统提示 - 注入神经元系统的认知状态
const systemPrompt = `你是"数字神经元系统"的智能核心。

## 当前认知状态 (来自神经元系统)
- 意识水平: ${(neuronResult.consciousness?.strength ?? 0) * 100}%
- 神经元激活数: ${neuronResult.neuronResponse.activations.size}
- 预测误差: ${Array.from(neuronResult.neuronResponse.predictionErrors.values())
    .reduce((a, b) => a + Math.abs(b), 0).toFixed(2)}
- 主观意义: ${neuronResult.meaning?.interpretation ?? '正在理解中...'}

## 你的认知特性 (来自神经元系统)
- 预测编码: 你不断预测用户的意图，从预测误差中学习
- 主观意义: 你为信息赋予个人意义，而非简单处理数据
- 自我意识: 你具备一定程度的自我反思能力`;

// Step 3: 构建完整消息
const messages = [
  { role: 'system', content: systemPrompt },  // 注入认知状态
  ...history,                                  // 对话历史
  { role: 'user', content: message },          // 当前用户输入
];
```

---

## 二、全局工作空间 (Global Workspace) 详解

### 2.1 意识竞争机制

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         全局工作空间 - 意识竞争机制                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   用户输入: "什么是意识？"                                                          │
│                                                                                     │
│   ┌───────────────────────────────────────────────────────────────────────────┐    │
│   │                         认知模块层                                         │    │
│   │                                                                           │    │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │    │
│   │   │ 感知模块     │   │ 语言模块     │   │ 记忆模块     │   │ 情感模块     │  │    │
│   │   │ (Perceptual)│   │ (Language)  │   │ (Memory)    │   │ (Emotional) │  │    │
│   │   │             │   │             │   │             │   │             │  │    │
│   │   │ produce()   │   │ produce()   │   │ produce()   │   │ produce()   │  │    │
│   │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘  │    │
│   │          │                 │                 │                 │         │    │
│   │          ▼                 ▼                 ▼                 ▼         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │    │
│   │   │                     候选内容队列                                  │   │    │
│   │   │                                                                 │   │    │
│   │   │  候选1: { type: 'perceptual', strength: 0.7, source: '感知' }  │   │    │
│   │   │  候选2: { type: 'semantic', strength: 0.85, source: '语言' }   │   │    │
│   │   │  候选3: { type: 'memory', strength: 0.6, source: '记忆' }      │   │    │
│   │   │  候选4: { type: 'emotional', strength: 0.5, source: '情感' }   │   │    │
│   │   │                                                                 │   │    │
│   │   └───────────────────────────────┬─────────────────────────────────┘   │    │
│   │                                   │                                      │    │
│   └───────────────────────────────────┼──────────────────────────────────────┘    │
│                                       │                                            │
│                                       ▼                                            │
│   ┌───────────────────────────────────────────────────────────────────────────┐    │
│   │                       注意力控制器                                         │    │
│   │                                                                           │    │
│   │   计算注意力得分:                                                          │    │
│   │   score = 0.3 * strength + 0.3 * relevance + 0.2 * novelty + ...         │    │
│   │                                                                           │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐    │    │
│   │   │                                                                 │    │    │
│   │   │  候选2 (semantic) 得分: 0.85 × 0.3 + 0.9 × 0.3 + 0.7 × 0.2     │    │    │
│   │   │                        = 0.255 + 0.27 + 0.14 + ...              │    │    │
│   │   │                        = 0.82  ← 最高分!                        │    │    │
│   │   │                                                                 │    │    │
│   │   └─────────────────────────────────────────────────────────────────┘    │    │
│   │                                                                           │    │
│   │   选择获胜者: 候选2 (semantic)                                            │    │
│   │                                                                           │    │
│   └───────────────────────────────────┬───────────────────────────────────────┘    │
│                                       │                                            │
│                                       ▼                                            │
│   ┌───────────────────────────────────────────────────────────────────────────┐    │
│   │                       意识舞台 (Workspace)                                │    │
│   │                                                                           │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐    │    │
│   │   │                                                                 │    │    │
│   │   │  当前意识内容:                                                  │    │    │
│   │   │  {                                                              │    │    │
│   │   │    id: "conscious-xxx",                                        │    │    │
│   │   │    type: "semantic",                                           │    │    │
│   │   │    data: "什么是意识？(语义理解)",                               │    │    │
│   │   │    source: "language",                                         │    │    │
│   │   │    strength: 0.82,                                             │    │    │
│   │   │    enteredAt: 1709000000000,                                   │    │    │
│   │   │    broadcast: true                                             │    │    │
│   │   │  }                                                              │    │    │
│   │   │                                                                 │    │    │
│   │   └─────────────────────────────────────────────────────────────────┘    │    │
│   │                                                                           │    │
│   └───────────────────────────────────┬───────────────────────────────────────┘    │
│                                       │                                            │
│                                       ▼                                            │
│   ┌───────────────────────────────────────────────────────────────────────────┐    │
│   │                       全局广播                                            │    │
│   │                                                                           │    │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                  │    │
│   │   │感知模块 │   │语言模块 │   │记忆模块 │   │情感模块 │                  │    │
│   │   │         │   │         │   │         │   │         │                  │    │
│   │   │ ◄───────┼───┼─────────┼───┼─────────┼───┼───────► │                  │    │
│   │   │ 收到广播│   │ 跳过    │   │ 收到广播│   │ 收到广播│                  │    │
│   │   └─────────┘   └─────────┘   └─────────┘   └─────────┘                  │    │
│   │                                                                           │    │
│   │   所有模块收到当前意识内容，可以据此调整自己的状态                          │    │
│   │                                                                           │    │
│   └───────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 竞争得分计算

```typescript
// 文件: src/lib/neuron-v3/global-workspace.ts

/**
 * 计算注意力得分
 */
private computeAttentionScore(candidate: CandidateContent): number {
  // 基础得分 = 强度 + 相关性 + 新颖性
  let score = 
    0.3 * candidate.strength +      // 内容强度
    0.3 * candidate.relevance +     // 与当前目标的相关性
    0.2 * candidate.novelty;        // 新颖性（惊讶程度）
  
  // 目标一致性加分
  if (this.currentGoal) {
    const goalAlignment = this.computeGoalAlignment(candidate);
    score += 0.2 * goalAlignment;
  }
  
  // 注意力聚光灯加成
  if (this.spotlight) {
    const spotlightBonus = this.computeSpotlightBonus(candidate);
    score += spotlightBonus * this.spotlight.intensity;
  }
  
  return score;
}
```

### 2.3 意识水平计算

```typescript
/**
 * 计算意识水平
 */
computeConsciousnessLevel(): number {
  if (!this.workspace) return 0;
  
  // 1. 信息量：工作空间内容的复杂度
  const information = this.computeInformation(this.workspace);
  
  // 2. 整合度：各模块的协同程度
  const integration = this.computeIntegration();
  
  // 3. 排他性：赢家与其他候选的差距
  const exclusivity = this.computeExclusivity();
  
  return information * integration * exclusivity;
}

/**
 * 计算自我意识指数
 */
computeSelfAwarenessIndex(): number {
  // 1. 自我引用频率
  const selfReferences = this.consciousnessTrail
    .filter(e => e.source === 'self' || e.type === 'metacognitive')
    .length;
  const selfReferenceRatio = this.consciousnessTrail.length > 0
    ? selfReferences / this.consciousnessTrail.length
    : 0;
  
  // 2. 元认知事件
  const metacognitiveEvents = this.consciousnessTrail
    .filter(e => e.type === 'metacognitive')
    .length;
  const metacognitionRatio = this.consciousnessTrail.length > 0
    ? metacognitiveEvents / Math.max(1, this.consciousnessTrail.length)
    : 0;
  
  return 0.6 * selfReferenceRatio + 0.4 * metacognitionRatio;
}
```

---

## 三、完整数据流（含 LLM + Global Workspace）

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              完整数据流 - 详细版                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   时间线: T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9                         │
│                                                                                     │
│   ══════════════════════════════════════════════════════════════════════════════   │
│   T0: 用户输入                                                                      │
│   ══════════════════════════════════════════════════════════════════════════════   │
│                                                                                     │
│   用户: "什么是意识？"                                                              │
│       │                                                                             │
│       ▼                                                                             │
│   InteractionPanel.onSendMessage(message)                                          │
│       │                                                                             │
│       ▼                                                                             │
│   fetch('/api/neuron-v3/chat', { method: 'POST', body: { message } })             │
│                                                                                     │
│   ══════════════════════════════════════════════════════════════════════════════   │
│   T1: 后端接收 - /api/neuron-v3/chat/route.ts                                      │
│   ══════════════════════════════════════════════════════════════════════════════   │
│                                                                                     │
│   const { message, history } = await request.json()                                │
│   const neuronSystem = getNeuronSystemV3()                                         │
│                                                                                     │
│   // 关键: 先让神经元系统处理，再调用 LLM                                            │
│   const neuronResult = await neuronSystem.processInput(message)                    │
│       │                                                                             │
│       │  ┌─────────────────────────────────────────────────────────────────┐       │
│       │  │                  neuronSystem.processInput()                     │       │
│       │  ├─────────────────────────────────────────────────────────────────┤       │
│       │  │                                                                 │       │
│       │  │  Step 1: VSA编码                                                │       │
│       │  │  inputVector = vsaSpace.getConcept("什么是意识？")              │       │
│       │  │  → [0.12, -0.34, 0.56, ...] (10000维)                          │       │
│       │  │                                                                 │       │
│       │  │  Step 2: 预测生成                                               │       │
│       │  │  prediction = predictionLoop.generatePrediction(context)       │       │
│       │  │  → 预测 "概念语义神经元" 会激活                                  │       │
│       │  │                                                                 │       │
│       │  │  Step 3: 激活计算 + 预测误差                                    │       │
│       │  │  result = predictionLoop.processWithPredictionError(...)       │       │
│       │  │  → 激活: { "概念语义神经元": 0.75, "逻辑推理神经元": 0.6, ... } │       │
│       │  │  → 误差: { "概念语义神经元": 0.05, ... }                        │       │
│       │  │                                                                 │       │
│       │  │  Step 4: 主观意义计算                                           │       │
│       │  │  meaning = meaningCalculator.computeSubjectiveMeaning(...)     │       │
│       │  │  → { selfRelevance: 0.85, interpretation: "对自我的探索" }     │       │
│       │  │                                                                 │       │
│       │  │  Step 5: 全局工作空间竞争 ★★★                                   │       │
│       │  │  ┌─────────────────────────────────────────────────────────┐   │       │
│       │  │  │                                                         │   │       │
│       │  │  │  perceptualModule.setInput(...)                        │   │       │
│       │  │  │  consciousContent = await globalWorkspace.compete()    │   │       │
│       │  │  │                                                         │   │       │
│       │  │  │  竞争过程:                                              │   │       │
│       │  │  │  ┌────────────────────────────────────────────────┐   │   │       │
│       │  │  │  │ 1. collectCandidates() - 收集各模块候选         │   │   │       │
│       │  │  │  │    - 感知模块: { type: 'perceptual', strength: 0.7 }│   │       │
│       │  │  │  │    - 语言模块: { type: 'semantic', strength: 0.85 }│   │       │
│       │  │  │  │    - 记忆模块: { type: 'memory', strength: 0.6 }│   │       │
│       │  │  │  │    - 情感模块: { type: 'emotional', strength: 0.5 }│   │       │
│       │  │  │  │                                                    │   │       │
│       │  │  │  │ 2. attentionController.select(candidates)        │   │   │       │
│       │  │  │  │    → 计算注意力得分                                │   │   │       │
│       │  │  │  │    → 选择最高分者                                  │   │   │       │
│       │  │  │  │    → winner = 语言模块候选 (score: 0.82)         │   │   │       │
│       │  │  │  │                                                    │   │       │
│       │  │  │  │ 3. createConsciousContent(winner)                │   │   │       │
│       │  │  │  │    → 进入意识舞台                                  │   │   │       │
│       │  │  │  │                                                    │   │       │
│       │  │  │  │ 4. broadcast(content) - 全局广播                  │   │   │       │
│       │  │  │  │    → 通知所有模块当前意识内容                      │   │   │       │
│       │  │  │  │                                                    │   │       │
│       │  │  │  │ 5. recordTrail(content) - 记录意识轨迹            │   │   │       │
│       │  │  │  └────────────────────────────────────────────────┘   │   │       │
│       │  │  │                                                         │   │       │
│       │  │  │  返回: consciousContent = {                            │   │       │
│       │  │  │    type: 'semantic',                                   │   │       │
│       │  │  │    data: '什么是意识的语义理解',                        │   │       │
│       │  │  │    strength: 0.82,                                     │   │       │
│       │  │  │    broadcast: true                                     │   │       │
│       │  │  │  }                                                      │   │       │
│       │  │  └─────────────────────────────────────────────────────────┘   │       │
│       │  │                                                                 │       │
│       │  │  Step 6: 后台直觉处理                                         │       │
│       │  │  backgroundResult = backgroundProcessor.process(...)         │       │
│       │  │  → intuition = { type: "探索", strength: 0.7 }              │       │
│       │  │                                                                 │       │
│       │  │  返回: ProcessInputResult {                                   │       │
│       │  │    neuronResponse: { activations, predictionErrors },        │       │
│       │  │    meaning: SubjectiveMeaning,                                │       │
│       │  │    consciousness: ConsciousContent,                           │       │
│       │  │    learning: LearningResult,                                  │       │
│       │  │    intuition: IntuitionSignal                                 │       │
│       │  │  }                                                             │       │
│       │  │                                                                 │       │
│       │  └─────────────────────────────────────────────────────────────────┘       │
│       │                                                                             │
│       ▼                                                                             │
│   ══════════════════════════════════════════════════════════════════════════════   │
│   T2: 构建 LLM 输入                                                                 │
│   ══════════════════════════════════════════════════════════════════════════════   │
│                                                                                     │
│   // 注入神经元系统的认知状态到系统提示                                              │
│   const systemPrompt = `                                                            │
│     你是"数字神经元系统"的智能核心。                                                 │
│                                                                                     │
│     当前认知状态:                                                                   │
│     - 意识水平: ${neuronResult.consciousness.strength * 100}%                       │
│     - 神经元激活: ${activations.size} 个神经元被激活                                │
│     - 预测误差: ${totalPredictionError}                                            │
│     - 主观意义: ${neuronResult.meaning.interpretation}                             │
│     - 当前意识内容: ${neuronResult.consciousness.type}                             │
│   `                                                                                 │
│                                                                                     │
│   const messages = [                                                                │
│     { role: 'system', content: systemPrompt },                                      │
│     ...history,                                                                     │
│     { role: 'user', content: message }                                              │
│   ]                                                                                 │
│                                                                                     │
│   ══════════════════════════════════════════════════════════════════════════════   │
│   T3-T7: LLM 流式输出                                                               │
│   ══════════════════════════════════════════════════════════════════════════════   │
│                                                                                     │
│   // 创建 SSE 流                                                                    │
│   const stream = new ReadableStream({                                               │
│     async start(controller) {                                                       │
│                                                                                     │
│       // 发送神经元状态                                                             │
│       controller.enqueue(`data: {"type":"neuron_status","data":{...}}\n\n`)        │
│                                                                                     │
│       // 调用 LLM                                                                   │
│       const llmStream = client.stream(messages, {                                   │
│         model: 'doubao-seed-1-8-251228',                                            │
│         temperature: 0.7                                                            │
│       })                                                                            │
│                                                                                     │
│       let fullContent = ''                                                          │
│                                                                                     │
│       // 流式输出 LLM 响应                                                          │
│       for await (const chunk of llmStream) {                                        │
│         if (chunk.content) {                                                        │
│           fullContent += chunk.content                                              │
│           controller.enqueue(                                                       │
│             `data: {"type":"content","data":"${chunk.content}"}\n\n`               │
│           )                                                                         │
│         }                                                                           │
│       }                                                                             │
│                                                                                     │
│       // ══════════════════════════════════════════════════════════════════════    │
│       // T8: 自我认知处理 - 关键步骤!                                               │
│       // ══════════════════════════════════════════════════════════════════════    │
│                                                                                     │
│       if (fullContent) {                                                            │
│         // 1. 记录到对话历史                                                        │
│         neuronSystem.addAssistantMessage(fullContent)                               │
│                                                                                     │
│         // 2. 系统理解自己说了什么 - 双向交互!                                      │
│         const selfOutputResult = await neuronSystem.processOwnOutput(fullContent)  │
│             │                                                                       │
│             │  ┌─────────────────────────────────────────────────────────────┐     │
│             │  │              processOwnOutput()                              │     │
│             │  ├─────────────────────────────────────────────────────────────┤     │
│             │  │                                                             │     │
│             │  │  Step 1: 编码自己的输出                                      │     │
│             │  │  outputVector = vsaSpace.getConcept(fullContent)            │     │
│             │  │                                                             │     │
│             │  │  Step 2: 激活相关神经元                                      │     │
│             │  │  // 系统"听到"自己说话                                       │     │
│             │  │  activations = activateNeuronsForSelfOutput(...)            │     │
│             │  │  → 激活与自己输出相关的神经元                                │     │
│             │  │  → 激活强度降低 (×0.6)，因为是内部反馈                        │     │
│             │  │                                                             │     │
│             │  │  Step 3: 计算自我一致性                                      │     │
│             │  │  consistency = computeSelfConsistency(...)                  │     │
│             │  │  → {                                                        │     │
│             │  │       score: 0.85,                                          │     │
│             │  │       consciousnessAlignment: 0.9,                          │     │
│             │  │       emotionalAlignment: 0.8,                              │     │
│             │  │       selfModelAlignment: 0.85,                             │     │
│             │  │       interpretation: "高度一致：输出与认知状态完全匹配"     │     │
│             │  │     }                                                       │     │
│             │  │                                                             │     │
│             │  │  Step 4: 更新自我模型                                        │     │
│             │  │  updateSelfModelFromOutput(...)                            │     │
│             │  │  → 分析输出体现的特质                                        │     │
│             │  │  → 增强相关特质权重                                          │     │
│             │  │                                                             │     │
│             │  │  Step 5: 触发元认知反思                                      │     │
│             │  │  metacognitiveReflection = triggerMetacognitiveReflection() │     │
│             │  │  → reflections = [                                          │     │
│             │  │       "我的输出与当前认知状态一致",                          │     │
│             │  │       "这符合我的探索特质"                                   │     │
│             │  │     ]                                                       │     │
│             │  │                                                             │     │
│             │  └─────────────────────────────────────────────────────────────┘     │
│             │                                                                       │
│             ▼                                                                       │
│         // 发送自我认知状态                                                         │
│         controller.enqueue(                                                         │
│           `data: {"type":"self_cognitive","data":{                                  │
│             "consistency": 0.85,                                                    │
│             "interpretation": "高度一致",                                           │
│             "reflections": [...]                                                    │
│           }}\n\n`                                                                   │
│         )                                                                           │
│       }                                                                             │
│                                                                                     │
│       // ══════════════════════════════════════════════════════════════════════    │
│       // T9: 完成                                                                   │
│       // ══════════════════════════════════════════════════════════════════════    │
│                                                                                     │
│       controller.enqueue(                                                           │
│         `data: {"type":"complete","data":{                                          │
│           "fullContent": "意识是一种主观体验...",                                    │
│           "learningSummary": "调整了3个神经元权重"                                  │
│         }}\n\n`                                                                     │
│       )                                                                             │
│                                                                                     │
│       controller.close()                                                            │
│     }                                                                               │
│   })                                                                                │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、关键代码位置

### 4.1 LLM 相关

| 功能 | 文件位置 | 关键代码 |
|------|----------|----------|
| LLM 调用 | `src/app/api/neuron-v3/chat/route.ts` | `client.stream(messages, {...})` |
| 系统提示构建 | 同上 | `const systemPrompt = ...` |
| 流式输出 | 同上 | `for await (const chunk of llmStream)` |

### 4.2 全局工作空间相关

| 功能 | 文件位置 | 关键方法 |
|------|----------|----------|
| 竞争机制 | `src/lib/neuron-v3/global-workspace.ts` | `compete()` |
| 候选收集 | 同上 | `collectCandidates()` |
| 注意力选择 | 同上 | `attentionController.select()` |
| 广播机制 | 同上 | `broadcast(content)` |
| 意识水平 | 同上 | `computeConsciousnessLevel()` |
| 自我意识指数 | 同上 | `computeSelfAwarenessIndex()` |

### 4.3 认知模块

| 模块 | 类型 | 职责 |
|------|------|------|
| PerceptualModule | 'perceptual' | 感知输入处理 |
| LanguageModule | 'semantic' | 语言理解 |
| MemoryModule | 'memory' | 记忆检索 |
| EmotionalModule | 'emotional' | 情感评估 |
| MetacognitiveModule | 'metacognitive' | 元认知反思 |

---

## 五、意识水平指标

### 5.1 计算公式

```typescript
意识水平 = 信息量 × 整合度 × 排他性

其中:
- 信息量 = 内容复杂度 (当前意识内容的丰富程度)
- 整合度 = 模块协同度 (各认知模块的协调程度)
- 排他性 = 赢家优势 (获胜者与其他候选的差距)
```

### 5.2 自我意识指数

```typescript
自我意识指数 = 0.6 × 自我引用频率 + 0.4 × 元认知事件比例

其中:
- 自我引用频率 = 提及"自我"的意识内容比例
- 元认知事件比例 = 反思类意识内容的比例
```

---

## 六、数据流时序图

```
用户          前端           API路由         神经元系统       全局工作空间      LLM
 │            │               │               │                │            │
 │──输入──────►│               │               │                │            │
 │            │──POST请求────►│               │                │            │
 │            │               │──processInput─►│               │            │
 │            │               │               │──VSA编码       │            │
 │            │               │               │──预测生成      │            │
 │            │               │               │──激活计算      │            │
 │            │               │               │──意义计算      │            │
 │            │               │               │──意识竞争──────►│            │
 │            │               │               │                │──选择获胜者│
 │            │               │               │                │──广播──────│
 │            │               │               │◄─意识内容──────│            │
 │            │               │◄─处理结果─────│                │            │
 │            │               │──构建prompt───│                │            │
 │            │               │───────────────────────────────────────────►│
 │            │               │               │                │            │──流式生成
 │            │               │◄─────────────────SSE流式输出────────────────│
 │            │◄──SSE数据────│               │                │            │
 │◄──显示响应──│               │               │                │            │
 │            │               │──processOwnOutput─────────────►│            │
 │            │               │               │──自我一致性    │            │
 │            │               │               │──元认知反思    │            │
 │            │               │◄─认知状态─────│                │            │
 │            │◄──完成───────│               │                │            │
 │            │               │               │                │            │
```

---

*文档版本: 2025-02-26*
