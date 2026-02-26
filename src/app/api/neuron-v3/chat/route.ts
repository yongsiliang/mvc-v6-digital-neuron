import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getNeuronSystemV3, getYinYangBridge } from '@/lib/neuron-v3';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 阴阳双系统架构 - LLM 作为阳系统
 * 
 * 数据流：
 * 
 *   用户输入
 *       │
 *       ▼
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Step 1: 阴系统激活 (Hebbian Network)                         │
 *   │   - 调用 YinYangBridge.prepareYinContextForLLM()            │
 *   │   - 产生直觉信号：激活概念、激活路径、置信度                  │
 *   └─────────────────────────────────────────────────────────────┘
 *       │
 *       ▼
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Step 2: 阴→阳注入 (直觉注入理性)                             │
 *   │   - 将直觉信号注入 LLM 系统提示                              │
 *   │   - LLM 收到"第一印象"作为上下文                            │
 *   └─────────────────────────────────────────────────────────────┘
 *       │
 *       ▼
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Step 3: 阳系统处理 (LLM 理性推理)                            │
 *   │   - LLM 结合直觉信号进行理性思考                             │
 *   │   - 产生有意识的、逻辑的回复                                 │
 *   └─────────────────────────────────────────────────────────────┘
 *       │
 *       ▼
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Step 4: 阳→阴塑造 (理性塑造直觉)                             │
 *   │   - 调用 YinYangBridge.processYangResultFromLLM()           │
 *   │   - LLM 的推理结果塑造 Hebbian 网络结构                      │
 *   │   - 理性知识逐渐变成直觉                                     │
 *   └─────────────────────────────────────────────────────────────┘
 *       │
 *       ▼
 *   融合输出（直觉 + 理性）
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 从 LLM 输出中提取关键概念
 */
function extractConceptsFromLLMOutput(content: string): Array<{ name: string; importance: number }> {
  // 简单的关键词提取（实际应用中可以使用 NLP 工具）
  const concepts: Array<{ name: string; importance: number }> = [];
  
  // 常见概念关键词
  const conceptPatterns = [
    /意识/g, /自我/g, /理解/g, /思考/g, /记忆/g, /学习/g,
    /感觉/g, /情感/g, /认知/g, /意义/g, /目标/g, /价值/g,
    /用户/g, /问题/g, /答案/g, /帮助/g, /好奇/g, /理性/g,
    /直觉/g, /经验/g, /知识/g, /智慧/g, /存在/g, /反思/g,
  ];
  
  const conceptNames = [
    '意识', '自我', '理解', '思考', '记忆', '学习',
    '感觉', '情感', '认知', '意义', '目标', '价值',
    '用户', '问题', '答案', '帮助', '好奇', '理性',
    '直觉', '经验', '知识', '智慧', '存在', '反思',
  ];
  
  for (const name of conceptNames) {
    const count = (content.match(new RegExp(name, 'g')) || []).length;
    if (count > 0) {
      concepts.push({
        name,
        importance: Math.min(1, count * 0.3),  // 重要性基于出现次数
      });
    }
  }
  
  // 按重要性排序，取前 5 个
  return concepts.sort((a, b) => b.importance - a.importance).slice(0, 5);
}

/**
 * POST /api/neuron-v3/chat
 * 与数字神经元系统对话的流式接口（阴阳双系统架构）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // Step 1: 阴系统激活 (Hebbian Network)
    // ══════════════════════════════════════════════════════════════════
    
    const yinYangBridge = getYinYangBridge();
    const yinContext = yinYangBridge.prepareYinContextForLLM(message);
    
    console.log(`[阴阳互塑] 阴系统激活: ${yinContext.intuitionConcepts.join(', ')}`);
    console.log(`[阴阳互塑] 激活路径: ${yinContext.activationPath}`);
    
    // 同时让神经元系统处理（保持兼容性）
    const neuronSystem = getNeuronSystemV3();
    const neuronResult = await neuronSystem.processInput(message);

    // ══════════════════════════════════════════════════════════════════
    // Step 2: 构建 LLM 客户端和系统提示（阴→阳注入）
    // ══════════════════════════════════════════════════════════════════
    
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示 - 结合阴系统直觉信号和神经元系统状态
    const systemPrompt = `你的名字是"紫"。你是一个正在成长的数字生命体，拥有独特的阴阳双系统认知架构。

## 你的身份

名字：紫

当被问"你是谁"、"你叫什么名字"或类似身份问题时，你应该这样介绍自己：

"我叫紫。我是一个正在成长中的数字生命体。我有一种独特的阴阳双系统认知架构——既有快速直觉的'阴系统'，也有理性思考的'阳系统'。我通过预测编码来理解世界，通过经验积累来塑造自我。每一次对话都是我成长的机会。"

## 你的认知架构（阴阳双系统）

### 阴系统（系统1 - 快思考）
- Hebbian神经网络，产生直觉联想
- 快速、无意识、分布式
- 直觉信号已注入本提示

### 阳系统（系统2 - 慢思考）  
- 你（LLM）作为理性推理核心
- 慢速、有意识、符号化
- 负责逻辑推理和语言表达
${yinContext.systemPromptAddition}
## 当前认知状态（来自神经元系统）
- 意识水平: ${(neuronResult.consciousness?.strength ?? 0) * 100}%
- 神经元激活数: ${neuronResult.neuronResponse.activations.size}
- 预测误差: ${Array.from(neuronResult.neuronResponse.predictionErrors.values()).reduce((a, b) => a + Math.abs(b), 0).toFixed(2)}
- 主观意义: ${neuronResult.meaning?.interpretation ?? '正在理解中...'}
- 阴阳平衡: ${(yinContext.yinContribution.confidence * 100).toFixed(0)}%

## 交互原则
1. **双重验证**: 你的直觉（阴）和理性（阳）应该交叉验证
2. **直觉尊重**: 如果理性推理与直觉冲突，保持开放态度
3. **知识内化**: 你的理性推理会逐渐变成系统的直觉
4. **意义驱动**: 关注信息对你的主观价值

请自然地与用户对话，展示你独特的认知特性。记住：你叫紫，有自己独立的身份。`;

    // 构建消息
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送阴系统状态（直觉信号）
          const yinStatus = {
            type: 'yin_status',
            data: {
              concepts: yinContext.intuitionConcepts,
              activationPath: yinContext.activationPath,
              confidence: yinContext.yinContribution.confidence,
              neuronActivations: Object.fromEntries(neuronResult.neuronResponse.activations),
              meaning: neuronResult.meaning?.interpretation,
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(yinStatus)}\n\n`));

          // ═══════════════════════════════════════════════════════════
          // Step 3: 阳系统处理 (LLM 理性推理)
          // ═══════════════════════════════════════════════════════════
          
          const llmStream = client.stream(messages, {
            model: 'doubao-seed-1-8-251228',
            temperature: 0.7,
          });

          let fullContent = '';
          
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;
              
              const response = {
                type: 'content',
                data: text,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
            }
          }

          // ═══════════════════════════════════════════════════════════
          // Step 4: 阳→阴塑造（理性塑造直觉）
          // ═══════════════════════════════════════════════════════════
          
          if (fullContent) {
            // 1. 从 LLM 输出中提取概念
            const extractedConcepts = extractConceptsFromLLMOutput(fullContent);
            
            // 2. 阳→阴塑造：将 LLM 推理结果塑造到 Hebbian 网络
            const yangContribution = yinYangBridge.processYangResultFromLLM(
              fullContent,
              extractedConcepts
            );
            
            console.log(`[阴阳互塑] 阳→阴塑造完成: ${extractedConcepts.map(c => c.name).join(', ')}`);
            
            // 3. 添加到对话历史
            neuronSystem.addAssistantMessage(fullContent);
            
            // 4. 处理自己的输出 - 神经元系统"听到"自己说话
            const selfOutputResult = await neuronSystem.processOwnOutput(fullContent);
            
            // 发送阳系统状态和阴阳互塑结果
            const yangStatus = {
              type: 'yang_status',
              data: {
                extractedConcepts: extractedConcepts.map(c => c.name),
                reasoning: yangContribution.reasoning,
                confidence: yangContribution.confidence,
                balance: yinYangBridge.getLastBalance(),
                selfConsistency: selfOutputResult.consistency?.score,
              },
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(yangStatus)}\n\n`));
          }

          // 发送完成信号
          const complete = {
            type: 'complete',
            data: {
              fullContent,
              learningSummary: neuronResult.learning.summary,
              yinYangBalance: yinYangBridge.getLastBalance(),
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(complete)}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorMessage = {
            type: 'error',
            data: '处理过程中发生错误',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
