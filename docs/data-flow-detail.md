# 首页对话框数据流详解

## 一、数据流全景图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              用户输入："什么是意识？"                                  │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              前端层 (Frontend Layer)                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────┐                                                         │
│  │ InteractionPanel.tsx  │  用户在Textarea输入，点击"发送"按钮                       │
│  │                       │                                                         │
│  │ onSendMessage(msg) ───┼──────────────────────────────────────────────┐          │
│  └───────────────────────┘                                              │          │
│                                                                         │          │
│  ┌───────────────────────┐                                              ▼          │
│  │ neuron-v3/page.tsx    │  ┌────────────────────────────────────────────────────┐  │
│  │                       │  │ handleSendMessage(message)                         │  │
│  │ • setActivityEvents   │  │                                                    │  │
│  │ • chat(message) ──────┼──┤  1. 添加活动事件                                     │  │
│  │ • setChatHistory      │  │  2. 调用 hook 的 chat()                             │  │
│  └───────────────────────┘  │  3. 更新对话历史                                     │  │
│                             └────────────────────────────────────────────────────┘  │
│                                                                         │          │
│  ┌───────────────────────┐                                              │          │
│  │ useNeuronV3System()   │◄─────────────────────────────────────────────┘          │
│  │                       │                                                         │
│  │ chat(message, history)│                                                         │
│  │     │                 │                                                         │
│  │     ▼                 │                                                         │
│  │ fetch('/api/neuron-v3 │                                                         │
│  │   /chat', {           │                                                         │
│  │   method: 'POST',     │                                                         │
│  │   body: { message,    │                                                         │
│  │     history }         │                                                         │
│  │ })                    │                                                         │
│  └───────────┬───────────┘                                                         │
│              │                                                                      │
└──────────────┼──────────────────────────────────────────────────────────────────────┘
               │ HTTP POST (SSE Stream)
               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              后端层 (Backend Layer)                                  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │                   /api/neuron-v3/chat/route.ts                              │     │
│  ├────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  1. 解析请求: const { message, history } = await request.json()             │     │
│  │                                                                              │     │
│  │  2. 获取神经元系统: const neuronSystem = getNeuronSystemV3()                │     │
│  │                                                                              │     │
│  │  3. 先让神经元系统处理输入:                                                  │     │
│  │     const neuronResult = await neuronSystem.processInput(message)           │     │
│  │                                                                              │     │
│  │  4. 构建系统提示 (结合神经元状态):                                           │     │
│  │     systemPrompt = `                                                         │     │
│  │       当前认知状态:                                                          │     │
│  │       - 意识水平: ${neuronResult.consciousness?.strength * 100}%            │     │
│  │       - 神经元激活数: ${activations.size}                                   │     │
│  │       - 预测误差: ${predictionErrors}                                       │     │
│  │       - 主观意义: ${meaning?.interpretation}                                │     │
│  │     `                                                                        │     │
│  │                                                                              │     │
│  │  5. 创建流式响应 (SSE):                                                      │     │
│  │     ├─► 发送 neuron_status (神经元状态)                                     │     │
│  │     ├─► LLM流式输出 content                                                 │     │
│  │     ├─► processOwnOutput (自我认知处理)                                      │     │
│  │     └─► 发送 complete                                                       │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           核心处理层 (Core Processing)                               │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │                neuronSystem.processInput(message)                           │     │
│  │                       (src/lib/neuron-v3/index.ts)                          │     │
│  ├────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  Step 1: 编码输入                                                            │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ inputVector = vsaSpace.getConcept(input)                          │       │     │
│  │  │ // 生成10000维的语义向量                                          │       │     │
│  │  │ // 例: "什么是意识" → [0.12, -0.34, 0.56, ...]                    │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 2: 构建预测上下文                                                      │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ predictionContext = {                                             │       │     │
│  │  │   userId, sessionId,                                              │       │     │
│  │  │   recentMessages: [...历史对话],                                  │       │     │
│  │  │   recentActivations: [...最近激活],                               │       │     │
│  │  │ }                                                                 │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 3: 生成预测                                                            │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ prediction = await predictionLoop.generatePrediction(context)     │       │     │
│  │  │ // 神经元预测: 哪些神经元会被激活？                                 │       │     │
│  │  │ // 例: 预测 "概念语义神经元" 会激活 0.75                           │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 4: 处理输入 + 计算预测误差                                              │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ result = await predictionLoop.processWithPredictionError(         │       │     │
│  │  │   input, inputVector, prediction, context                         │       │     │
│  │  │ )                                                                 │       │     │
│  │  │                                                                    │       │     │
│  │  │ // 每个神经元计算:                                                 │       │     │
│  │  │ // predictionError = actual - predicted                           │       │     │
│  │  │ // surprise = |predictionError|                                   │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 5: 从预测误差中学习                                                    │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ learning = await predictionLoop.learnFromPredictionError(         │       │     │
│  │  │   inputVector, predictionErrors, reward                           │       │     │
│  │  │ )                                                                 │       │     │
│  │  │ // 调整神经元权重，生成新神经元(可选)                              │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 6: 计算主观意义                                                        │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ meaning = meaningCalculator.computeSubjectiveMeaning(             │       │     │
│  │  │   input, { conversationHistory, currentGoal }                     │       │     │
│  │  │ )                                                                 │       │     │
│  │  │ // 例: {                                                          │       │     │
│  │  │ //   selfRelevance: 0.85,  // 与自我的相关度                      │       │     │
│  │  │ //   sentiment: 0.2,       // 情感倾向                            │       │     │
│  │  │ //   interpretation: "对自我的深度探索"                           │       │     │
│  │  │ // }                                                              │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 7: 意识竞争                                                            │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ perceptualModule.setInput({ id, content, vector, meaning })       │       │     │
│  │  │ consciousContent = await globalWorkspace.compete()                │       │     │
│  │  │ // 意识内容竞争进入"舞台"，胜出者被广播到所有模块                  │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  │  Step 8: 后台处理 (系统1直觉)                                                │     │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │     │
│  │  │ backgroundResult = backgroundProcessor.process(                   │       │     │
│  │  │   inputVector, activations                                        │       │     │
│  │  │ )                                                                 │       │     │
│  │  │ // 产生直觉信号和准备状态                                          │       │     │
│  │  │ // intuition = { type: "探索", strength: 0.7, confidence: 0.8 }  │       │     │
│  │  └──────────────────────────────────────────────────────────────────┘       │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        阴阳互塑层 (Yin-Yang Interaction)                             │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │                    ConsciousnessAGI.process(input)                          │     │
│  │                    (src/lib/neuron-v3/consciousness-agi.ts)                 │     │
│  ├────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │     │
│  │  │                        Self Core 计算                                 │    │     │
│  │  │  subjectiveMeaning = selfCore.computeMeaningForSelf(inputVector)     │    │     │
│  │  │                                                                        │    │     │
│  │  │  输出: {                                                               │    │     │
│  │  │    selfRelevance: 0.85,      // 自我关联度                            │    │     │
│  │  │    activatedTraits: ["好奇", "探索"], // 激活的特质                  │    │     │
│  │  │    emotionalResponse: { valence: 0.3, arousal: 0.6 }, // 情感响应   │    │     │
│  │  │    interpretation: "这是对自我的深度探索..."                          │    │     │
│  │  │  }                                                                     │    │     │
│  │  └─────────────────────────────────────────────────────────────────────┘    │     │
│  │                                                                              │     │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │     │
│  │  │                     阴阳互塑 (核心!)                                  │    │     │
│  │  │  yinYangInteraction = await yinYangBridge.mutualShaping(inputVector) │    │     │
│  │  │                                                                        │    │     │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐ │    │     │
│  │  │  │ 阴系统 (Yin)                                                    │ │    │     │
│  │  │  │ ──────────────                                                  │ │    │     │
│  │  │  │ • Hebbian网络激活扩散                                           │ │    │     │
│  │  │  │ • 直觉联想: "意识" → "自我" → "思考" → "存在"                   │ │    │     │
│  │  │  │ • 产生: yinContribution { concepts, confidence, paths }        │ │    │     │
│  │  │  └─────────────────────────────────────────────────────────────────┘ │    │     │
│  │  │                              │                                        │    │     │
│  │  │                              ▼                                        │    │     │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐ │    │     │
│  │  │  │ 阳系统 (Yang)                                                   │ │    │     │
│  │  │  │ ──────────────                                                  │ │    │     │
│  │  │  │ • VSA语义空间推理                                               │ │    │     │
│  │  │  │ • 符号计算: "意识" ⊗ "定义" = 关系向量                          │ │    │     │
│  │  │  │ • 产生: yangContribution { concepts, reasoning, confidence }   │ │    │     │
│  │  │  └─────────────────────────────────────────────────────────────────┘ │    │     │
│  │  │                              │                                        │    │     │
│  │  │                              ▼                                        │    │     │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐ │    │     │
│  │  │  │ 双向互塑                                                        │ │    │     │
│  │  │  │ ────────────                                                    │ │    │     │
│  │  │  │ 阴→阳: 直觉注入理性 - 让推理有直觉基础                          │ │    │     │
│  │  │  │ 阳→阴: 理性塑造感性 - 让直觉学习概念关联                        │ │    │     │
│  │  │  │                                                                  │ │    │     │
│  │  │  │ fusedResult = {                                                 │ │    │     │
│  │  │  │   content: "意识是一种主观体验...",                              │ │    │     │
│  │  │  │   source: "fusion",  // 融合结果                                │ │    │     │
│  │  │  │   confidence: 0.82                                              │ │    │     │
│  │  │  │ }                                                               │ │    │     │
│  │  │  │                                                                  │ │    │     │
│  │  │  │ balance = { yinActivity: 0.48, yangActivity: 0.52,              │ │    │     │
│  │  │  │              balance: 0.95, bias: "balanced" }                  │ │    │     │
│  │  │  └─────────────────────────────────────────────────────────────────┘ │    │     │
│  │  └─────────────────────────────────────────────────────────────────────┘    │     │
│  │                                                                              │     │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │     │
│  │  │                    更新 Self Core                                    │    │     │
│  │  │  selfCore.updateFromExperience({                                    │    │     │
│  │  │    input, inputVector, meaning, emotion, importance                 │    │     │
│  │  │  })                                                                  │    │     │
│  │  │  // 动态塑造自我 - 经验改变自我表征                                  │    │     │
│  │  └─────────────────────────────────────────────────────────────────────┘    │     │
│  │                                                                              │     │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │     │
│  │  │                    应用 Hebbian 学习                                 │    │     │
│  │  │  await applyLearning(yinYangInteraction)                            │    │     │
│  │  │  // Δw = η × pre × post                                             │    │     │
│  │  │  // 更新突触权重，加强关联                                           │    │     │
│  │  └─────────────────────────────────────────────────────────────────────┘    │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           响应层 (Response Layer)                                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │                           SSE 流式响应                                      │     │
│  ├────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  data: {"type":"neuron_status","data":{"activations":{...},"meaning":"..."}}│     │
│  │                                                                              │     │
│  │  data: {"type":"content","data":"意识"}                                     │     │
│  │  data: {"type":"content","data":"是一种"}                                   │     │
│  │  data: {"type":"content","data":"主观"}                                     │     │
│  │  data: {"type":"content","data":"体验..."}                                  │     │
│  │  ... (LLM流式输出)                                                          │     │
│  │                                                                              │     │
│  │  data: {"type":"self_cognitive","data":{"consistency":0.85,...}}           │     │
│  │  (自我认知状态 - 系统理解自己说了什么)                                      │     │
│  │                                                                              │     │
│  │  data: {"type":"complete","data":{"fullContent":"...","learningSummary"}}  │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           前端渲染层 (Frontend Render)                               │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │                    useNeuronV3System Hook 处理 SSE                         │     │
│  ├────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  const reader = response.body.getReader()                                   │     │
│  │  while (true) {                                                             │     │
│  │    const { done, value } = await reader.read()                              │     │
│  │    if (done) break                                                          │     │
│  │                                                                              │     │
│  │    // 解析 SSE 数据                                                          │     │
│  │    if (data.type === 'content') {                                           │     │
│  │      setLastResponse(prev => prev + data.data)  // 打字机效果               │     │
│  │    }                                                                        │     │
│  │    if (data.type === 'neuron_status') {                                     │     │
│  │      setNeuronStatus(data.data)  // 更新神经元状态                          │     │
│  │    }                                                                        │     │
│  │    if (data.type === 'complete') {                                          │     │
│  │      setIsProcessing(false)                                                 │     │
│  │    }                                                                        │     │
│  │  }                                                                          │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │                           UI 组件更新                                       │     │
│  ├────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │     │
│  │  │ InteractionPanel│  │ NetworkTopology │  │ Consciousness   │            │     │
│  │  │                 │  │                 │  │ Gauge           │            │     │
│  │  │ 显示响应内容     │  │ 神经元激活动画   │  │ 意识水平仪表     │            │     │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │     │
│  │                                                                              │     │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │     │
│  │  │ VSASpaceViz     │  │ PredictionMonitor│  │ IntuitionPanel │            │     │
│  │  │                 │  │                 │  │                 │            │     │
│  │  │ 概念关系可视化   │  │ 预测误差监控     │  │ 直觉信号面板     │            │     │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、详细流程说明

### 2.1 前端触发 (Frontend Trigger)

```typescript
// 用户在 InteractionPanel 输入消息并点击发送
// 文件: src/components/neuron-viz/interaction-panel.tsx

const handleSend = () => {
  if (input.trim()) {
    onSendMessage(input.trim());  // 调用父组件传入的回调
    setInput('');
  }
};
```

### 2.2 页面处理 (Page Handler)

```typescript
// 文件: src/app/neuron-v3/page.tsx

const handleSendMessage = useCallback(async (message: string) => {
  setIsProcessing(true);
  
  // 1. 添加活动事件（用于可视化）
  setActivityEvents(prev => [...prev, {
    id: `act-${Date.now()}`,
    timestamp: Date.now(),
    type: 'activate',
    neuronId: 'input',
    details: `用户输入: ${message.slice(0, 30)}...`,
  }]);

  // 2. 调用 chat 方法
  const response = await chat(message, chatHistory);
  
  // 3. 更新对话历史
  setChatHistory(prev => [...prev, 
    { role: 'user', content: message },
    { role: 'assistant', content: response.fullContent }
  ]);
  
  // 4. 更新响应显示
  setLastResponse(response.fullContent);
  setIsProcessing(false);
}, [chat, chatHistory]);
```

### 2.3 Hook 发送请求 (Hook Request)

```typescript
// 文件: src/hooks/use-neuron-v3.ts

const chat = useCallback(async (message: string, history = []) => {
  const response = await fetch('/api/neuron-v3/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'content') {
          fullContent += data.data;
          // 触发重新渲染，实现打字机效果
        }
        
        if (data.type === 'neuron_status') {
          setNeuronStatus(data.data);  // 更新神经元状态
        }
        
        if (data.type === 'complete') {
          return { fullContent, ...data.data };
        }
      }
    }
  }
}, []);
```

### 2.4 API 路由处理 (API Route Handler)

```typescript
// 文件: src/app/api/neuron-v3/chat/route.ts

export async function POST(request: NextRequest) {
  const { message, history } = await request.json();
  
  // 1. 获取神经元系统实例
  const neuronSystem = getNeuronSystemV3();
  
  // 2. 先让神经元系统处理输入
  const neuronResult = await neuronSystem.processInput(message);
  
  // 3. 构建包含神经元状态的系统提示
  const systemPrompt = `你是"数字神经元系统"的智能核心。
  
当前认知状态:
- 意识水平: ${neuronResult.consciousness?.strength * 100}%
- 神经元激活数: ${neuronResult.neuronResponse.activations.size}
- 预测误差: ${...}
- 主观意义: ${neuronResult.meaning?.interpretation}`;

  // 4. 调用 LLM 并流式返回
  const llmStream = client.stream([
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ]);

  // 5. 创建 SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      // 发送神经元状态
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: 'neuron_status', data: {...} })}\n\n`
      ));
      
      // 流式发送 LLM 输出
      for await (const chunk of llmStream) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'content', data: chunk.content })}\n\n`
        ));
      }
      
      // 自我认知处理
      const selfResult = await neuronSystem.processOwnOutput(fullContent);
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: 'self_cognitive', data: selfResult })}\n\n`
      ));
      
      // 完成
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: 'complete', data: {...} })}\n\n`
      ));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

## 三、关键组件职责

### 3.1 数据流经的核心组件

| 组件 | 文件 | 职责 |
|------|------|------|
| **InteractionPanel** | `src/components/neuron-viz/interaction-panel.tsx` | 用户输入界面 |
| **useNeuronV3System** | `src/hooks/use-neuron-v3.ts` | 前端状态管理 + API调用 |
| **API Route** | `src/app/api/neuron-v3/chat/route.ts` | 后端入口，协调处理 |
| **NeuronSystemV3** | `src/lib/neuron-v3/index.ts` | 神经元系统主类 |
| **ConsciousnessAGI** | `src/lib/neuron-v3/consciousness-agi.ts` | AGI意识系统（可选） |
| **SelfCore** | `src/lib/neuron-v3/self-core.ts` | 同一性/自我核心 |
| **HebbianNetwork** | `src/lib/neuron-v3/hebbian-network.ts` | 阴系统（直觉） |
| **VSASpace** | `src/lib/neuron-v3/vsa-space.ts` | 阳系统（理性） |
| **YinYangBridge** | `src/lib/neuron-v3/yin-yang-bridge.ts` | 阴阳互塑桥梁 |
| **GlobalWorkspace** | `src/lib/neuron-v3/global-workspace.ts` | 全局工作空间（意识） |

### 3.2 数据转换节点

```
用户输入 (string)
    │
    ▼
VSA向量 (10000维 float[])
    │
    ├──► SelfCore: 计算主观意义 → SubjectiveMeaningForSelf
    │
    ├──► HebbianNetwork: 激活扩散 → YinContribution
    │
    ├──► VSASpace: 语义推理 → YangContribution
    │
    └──► YinYangBridge: 双向互塑 → YinYangInteraction
         │
         ▼
    融合结果 + 系统状态
         │
         ▼
    LLM Prompt (包含认知状态)
         │
         ▼
    响应内容 (string) ──► SSE 流式输出
```

---

## 四、数据类型定义

### 4.1 核心数据结构

```typescript
// 处理结果
interface ProcessInputResult {
  neuronResponse: {
    activations: Map<string, number>;      // 神经元ID → 激活值
    predictionErrors: Map<string, number>; // 神经元ID → 预测误差
    surprises: SurpriseEvent[];            // 惊讶事件
    processingTime: number;
  };
  meaning?: SubjectiveMeaning;             // 主观意义
  consciousness?: ConsciousContent;        // 意识内容
  learning: LearningResult;                // 学习结果
  intuition?: IntuitionSignal;             // 直觉信号
  readiness?: ReadinessState;              // 准备状态
}

// Self Core 主观意义
interface SubjectiveMeaningForSelf {
  selfRelevance: number;                   // 自我关联度 [0,1]
  activatedTraits: string[];               // 激活的特质
  emotionalResponse: {
    valence: number;                       // 情感效价 [-1,1]
    arousal: number;                       // 激活度 [0,1]
  };
  interpretation: string;                  // 意义解释
}

// 阴阳互塑结果
interface YinYangInteraction {
  yinContribution: YinContribution;        // 阴系统贡献
  yangContribution: YangContribution;      // 阳系统贡献
  fusedResult: {                           // 融合结果
    content: string;
    vector: VSAVector;
    source: 'yin' | 'yang' | 'fusion';
    confidence: number;
  };
  balance: YinYangBalance;                 // 平衡状态
  selfRelevance: number;
}
```

---

## 五、调试建议

### 5.1 前端调试

```typescript
// 在 handleSendMessage 中添加日志
console.log('[DataFlow] 用户输入:', message);
console.log('[DataFlow] 对话历史长度:', chatHistory.length);

// 在 SSE 处理中添加日志
console.log('[DataFlow] 收到 SSE:', data.type, data);
```

### 5.2 后端调试

```typescript
// 在 API 路由中添加日志
console.log('[API] 收到请求:', { message, historyLength: history.length });
console.log('[API] 神经元处理结果:', neuronResult);
console.log('[API] LLM 系统提示长度:', systemPrompt.length);
```

### 5.3 核心组件调试

```typescript
// 在 processInput 关键步骤添加日志
console.log('[NeuronV3] Step 1 - 输入向量维度:', inputVector.length);
console.log('[NeuronV3] Step 4 - 激活神经元数:', processingResult.activations.size);
console.log('[NeuronV3] Step 6 - 主观意义:', meaning?.interpretation);
console.log('[NeuronV3] Step 7 - 意识内容:', consciousness?.type);
```

---

## 六、性能优化建议

1. **前端**: 使用 `useMemo` 缓存计算结果，避免重复渲染
2. **网络**: SSE 连接复用，避免频繁建立连接
3. **后端**: 神经元系统单例模式，避免重复初始化
4. **向量计算**: VSA 向量计算可考虑 WebAssembly 加速
5. **持久化**: 异步保存，不阻塞响应

---

*文档版本: 2025-02-26*
