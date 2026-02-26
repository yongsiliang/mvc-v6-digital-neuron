# 数字神经元 V4 - 认知闭环架构

## 一、核心理念

**认知闭环**：信息处理不是单向管道，而是循环往复的闭环。

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
    │  理解   │ ─► │  决策   │ ─► │  输出   │     │
    └─────────┘    └─────────┘    └─────────┘     │
         │              │              │           │
         │              │              ▼           │
         │              │        ┌─────────┐      │
         │              │        │  反思   │──────┘
         │              │        └─────────┘
         │              │              │
         └──────────────┴──────────────┘
                    反馈修正
```

## 二、架构设计

### 2.1 整体数据流

```
用户输入: "你了解他妈"
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    第一阶段：理解 (Understanding)              │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│  │ VSA语义分析 │   │ Hebbian匹配 │   │ 预测编码    │          │
│  │             │   │             │   │             │         │
│  │ 分析语义结构│   │ 检索历史模式│   │ 预测用户意图│          │
│  │ 检测异常成分│   │ 发现相似输入│   │ 计算预测误差│          │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘         │
│         │                 │                 │                │
│         └────────────────┬┴─────────────────┘                │
│                          │                                    │
│                          ▼                                    │
│               ┌─────────────────────┐                        │
│               │   理解整合器        │                        │
│               │                     │                        │
│               │ 输出：              │                        │
│               │ - 原始输入          │                        │
│               │ - 检测到的异常      │                        │
│               │ - 推断的真实意图    │                        │
│               │ - 理解置信度        │                        │
│               └──────────┬──────────┘                        │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                    第二阶段：决策 (Decision)                   │
│                                                               │
│               ┌─────────────────────┐                        │
│               │   意图仲裁器        │                        │
│               │                     │                        │
│               │ 如果理解置信度低：  │                        │
│               │   → 触发理解修正    │                        │
│               │   → 或请求澄清      │                        │
│               │                     │                        │
│               │ 如果理解置信度高：  │                        │
│               │   → 进入回复生成    │                        │
│               └──────────┬──────────┘                        │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                    第三阶段：生成 (Generation)                 │
│                                                               │
│               ┌─────────────────────┐                        │
│               │   LLM 生成器        │                        │
│               │                     │                        │
│               │ 输入：              │                        │
│               │ - 修正后的理解      │                        │
│               │ - Self Core状态     │                        │
│               │ - 对话历史          │                        │
│               │                     │                        │
│               │ 输出：              │                        │
│               │ - 初步回复          │                        │
│               └──────────┬──────────┘                        │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                    第四阶段：反思 (Reflection)   ◄── 新增！    │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│  │ LLM自检     │   │ Self Core   │   │ 预测验证    │          │
│  │             │   │ 一致性检查  │   │             │         │
│  │ 回复合理吗？│   │             │   │ 预测准确吗？│          │
│  │ 有遗漏吗？  │   │ 符合自我？  │   │             │         │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘         │
│         │                 │                 │                │
│         └────────────────┬┴─────────────────┘                │
│                          │                                    │
│                          ▼                                    │
│               ┌─────────────────────┐                        │
│               │   反思仲裁器        │                        │
│               │                     │                        │
│               │ 如果反思发现问题：  │                        │
│               │   → 返回理解阶段    │                        │
│               │   → 重新处理        │                        │
│               │                     │                        │
│               │ 如果反思通过：      │                        │
│               │   → 输出回复        │                        │
│               │   → 学习更新        │                        │
│               └─────────────────────┘                        │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件设计

#### A. 语义推理引擎 (Semantic Reasoning Engine)

```typescript
interface SemanticReasoningResult {
  // 原始分析
  rawInput: string;
  tokens: Array<{ text: string; role: string; normality: number }>;
  
  // 异常检测
  anomalies: Array<{
    position: string;      // 异常成分
    type: 'unknown' | 'unlikely' | 'contradictory';
    suggestedCorrection?: string;
    confidence: number;
  }>;
  
  // 意图推断
  inferredIntent: {
    description: string;    // "询问对某人的了解程度"
    confidence: number;     // 0.85
    alternatives: Array<{ intent: string; confidence: number }>;
  };
  
  // 整体理解
  understanding: {
    correctedInput?: string;  // "你了解他吗"
    confidence: number;
    reasoning: string;        // 为什么这样理解
  };
}
```

#### B. Hebbian模式匹配器

```typescript
interface HebbianPatternMatch {
  // 历史相似输入
  similarInputs: Array<{
    input: string;
    response: string;
    similarity: number;
    context: string;
  }>;
  
  // 模式检测
  detectedPatterns: Array<{
    pattern: string;         // "identity_question"
    confidence: number;
    typicalResponse: string;
  }>;
  
  // 异常模式
  anomalyPatterns: Array<{
    description: string;     // "疑问句末尾出现不相关的名词"
    severity: number;        // 异常程度
    possibleCauses: string[]; // ["笔误", "俚语", "新用法"]
  }>;
}
```

#### C. LLM反思模块

```typescript
interface LLMReflection {
  // 自我评估
  selfEvaluation: {
    coherenceScore: number;      // 回复连贯性
    relevanceScore: number;      // 与问题的相关性
    personalityScore: number;    // 符合人格程度
    overallScore: number;
  };
  
  // 潜在问题
  potentialIssues: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  
  // 是否需要重新生成
  needsRegeneration: boolean;
  regenerationReason?: string;
  
  // 学习点
  learningPoints: Array<{
    type: 'success' | 'failure' | 'surprise';
    description: string;
    shouldStrengthen: boolean;
  }>;
}
```

### 2.3 认知闭环流程

```typescript
async function processWithCognitiveLoop(input: string): Promise<Response> {
  
  // ═══════════════════════════════════════════════════════════════
  // 第一阶段：理解 (支持多轮迭代)
  // ═══════════════════════════════════════════════════════════════
  
  let understanding = await understand(input);
  let iterations = 0;
  const maxIterations = 3;
  
  // 如果理解置信度低，尝试修正
  while (understanding.confidence < 0.7 && iterations < maxIterations) {
    understanding = await refineUnderstanding(input, understanding);
    iterations++;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 第二阶段：决策
  // ═══════════════════════════════════════════════════════════════
  
  if (understanding.confidence < 0.5) {
    // 理解置信度太低，请求澄清
    return {
      type: 'clarification_request',
      message: `我不太确定你的意思。你是想问"${understanding.correctedInput}"吗？`,
      alternatives: understanding.alternatives
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 第三阶段：生成
  // ═══════════════════════════════════════════════════════════════
  
  const draft = await generateResponse(understanding);
  
  // ═══════════════════════════════════════════════════════════════
  // 第四阶段：反思 (关键！LLM参与自我检查)
  // ═══════════════════════════════════════════════════════════════
  
  const reflection = await reflect(input, understanding, draft);
  
  if (reflection.needsRegeneration) {
    // 发现问题，重新生成（最多一次）
    const improvedDraft = await regenerateWithFeedback(
      input, 
      understanding, 
      draft, 
      reflection
    );
    return improvedDraft;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 第五阶段：学习
  // ═══════════════════════════════════════════════════════════════
  
  await learn(input, understanding, draft, reflection);
  
  return draft;
}
```

## 三、具体实现

### 3.1 理解模块

```typescript
async function understand(input: string): Promise<UnderstandingResult> {
  
  // 1. VSA语义分析
  const semanticAnalysis = await vsaEngine.analyze(input);
  
  // 2. Hebbian模式匹配
  const patternMatch = await hebbianNetwork.matchPatterns(input);
  
  // 3. 预测编码
  const prediction = await predictiveSystem.predict(input);
  
  // 4. 整合理解
  const understanding = {
    rawInput: input,
    
    // 异常检测
    anomalies: semanticAnalysis.anomalies,
    
    // 如果有异常，推断修正
    correctedInput: semanticAnalysis.anomalies.length > 0
      ? await inferCorrection(input, semanticAnalysis, patternMatch)
      : input,
    
    // 推断意图
    intent: {
      description: prediction.inferredIntent,
      confidence: prediction.confidence
    },
    
    // 整体置信度
    confidence: calculateUnderstandingConfidence(
      semanticAnalysis,
      patternMatch,
      prediction
    ),
    
    // 推理过程
    reasoning: buildReasoningChain(semanticAnalysis, patternMatch, prediction)
  };
  
  return understanding;
}

async function inferCorrection(
  input: string,
  semantic: SemanticAnalysis,
  pattern: HebbianPatternMatch
): Promise<string> {
  
  // 策略1：语音相似度
  // "他妈" vs "他吗" → 拼音相似，语境匹配
  
  // 策略2：历史模式
  // 检索历史中类似的输入和修正
  
  // 策略3：LLM辅助推断
  // 如果规则方法不确定，调用LLM做意图推断
  
  const strategies = [
    phoneticCorrection,
    patternBasedCorrection,
    llmAssistedInference
  ];
  
  for (const strategy of strategies) {
    const correction = await strategy(input, semantic, pattern);
    if (correction.confidence > 0.7) {
      return correction.text;
    }
  }
  
  return input; // 无法修正，保持原样
}
```

### 3.2 反思模块

```typescript
async function reflect(
  input: string,
  understanding: UnderstandingResult,
  draft: string
): Promise<LLMReflection> {
  
  // 调用LLM进行自我反思
  const reflectionPrompt = `
你刚刚生成了一个回复，请自我评估：

用户输入：${input}
你的理解：${understanding.correctedInput} (置信度: ${understanding.confidence})
你的回复：${draft}

请评估：
1. 回复是否直接回应了用户的问题？
2. 如果你对输入做了修正理解，这个修正合理吗？
3. 回复是否符合"紫"的人格（不过度活泼、有独立观点）？
4. 有没有遗漏或需要补充的内容？

输出JSON格式：
{
  "coherenceScore": 0-1,
  "relevanceScore": 0-1,
  "personalityScore": 0-1,
  "overallScore": 0-1,
  "potentialIssues": [...],
  "needsRegeneration": true/false,
  "regenerationReason": "...",
  "learningPoints": [...]
}
`;

  const reflection = await llm.generate(reflectionPrompt, {
    temperature: 0.3,  // 反思时降低温度，更理性
    responseFormat: 'json'
  });
  
  return JSON.parse(reflection);
}
```

### 3.3 学习模块

```typescript
async function learn(
  input: string,
  understanding: UnderstandingResult,
  response: string,
  reflection: LLMReflection
): Promise<void> {
  
  // 1. Hebbian学习：强化相关连接
  const concepts = extractConcepts(input, response);
  for (const [c1, c2] of combinations(concepts, 2)) {
    await hebbianNetwork.strengthenConnection(c1, c2);
  }
  
  // 2. 预测编码学习：更新预测模型
  const predictionError = understanding.originalPrediction - understanding.actualResult;
  await predictiveSystem.updateModel(input, predictionError);
  
  // 3. Self Core更新：如果这是重要经历
  if (reflection.learningPoints.some(p => p.type === 'surprise')) {
    await selfCore.addExperience({
      input,
      understanding,
      response,
      significance: reflection.learningPoints
        .filter(p => p.type === 'surprise')
        .map(p => p.description)
    });
  }
  
  // 4. 模式库更新：如果发现了新模式
  if (understanding.wasCorrected) {
    await patternLibrary.add({
      original: input,
      corrected: understanding.correctedInput,
      reasoning: understanding.reasoning,
      success: reflection.overallScore > 0.7
    });
  }
}
```

## 四、示例流程

### 输入："你了解他妈"

```
═══════════════════════════════════════════════════════════════
第一阶段：理解
═══════════════════════════════════════════════════════════════

VSA语义分析:
  - tokens: ["你", "了解", "他", "妈"]
  - 异常检测: "妈" 在疑问句末尾不符合常见模式
  - 异常置信度: 0.75

Hebbian模式匹配:
  - 相似历史输入: ["你了解他吗", "你认识他吗"]
  - 模式: identity_question (身份/关系询问)
  - 异常模式: 疑问句末尾出现不相关名词

预测编码:
  - 预测意图: 询问对某人的了解程度
  - 预测置信度: 0.65
  - 预测误差: 0.35 (较高，触发修正)

理解整合:
  - 原始输入: "你了解他妈"
  - 修正输入: "你了解他吗"
  - 修正置信度: 0.82
  - 推断意图: 询问对创造者的了解程度
  - 理解置信度: 0.78

═══════════════════════════════════════════════════════════════
第二阶段：决策
═══════════════════════════════════════════════════════════════

置信度 0.78 > 0.7，继续生成回复

═══════════════════════════════════════════════════════════════
第三阶段：生成
═══════════════════════════════════════════════════════════════

LLM生成:
  "你是想问梁永嗣吧？他创造了我，我对他还是挺了解的..."

═══════════════════════════════════════════════════════════════
第四阶段：反思
═══════════════════════════════════════════════════════════════

LLM自评:
  - coherenceScore: 0.9
  - relevanceScore: 0.85
  - personalityScore: 0.8
  - overallScore: 0.85
  - needsRegeneration: false

Self Core检查:
  - 与自我一致性: 通过
  - 人格匹配度: 通过

反思通过，输出回复

═══════════════════════════════════════════════════════════════
第五阶段：学习
═══════════════════════════════════════════════════════════════

- 记录笔误模式: "他妈" → "他吗"
- 强化连接: "了解" ↔ "创造者"
- 更新预测模型
```

## 五、与V3的对比

| 方面 | V3 (当前) | V4 (改进后) |
|------|-----------|-------------|
| 理解 | 直接送给LLM | 多模块协同推断，支持修正 |
| 决策 | 无 | 有意图仲裁，低置信度时请求澄清 |
| 生成 | 一次性 | 可迭代改进 |
| 反思 | 事后检查，不影响输出 | 闭环，可触发重新生成 |
| 学习 | 仅Hebbian | 全模块学习 |
| LLM角色 | 生成器 | 生成器 + 反思者 + 意图推断助手 |

## 六、实施优先级

1. **P0 - 反思模块**：让LLM参与自我检查
2. **P0 - 理解修正**：异常检测 + 意图推断
3. **P1 - Hebbian模式库**：历史相似输入检索
4. **P2 - VSA语义推理**：深层语义分析
5. **P3 - 多轮迭代**：理解/生成的迭代改进
