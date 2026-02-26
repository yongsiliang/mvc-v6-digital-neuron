import { NextRequest } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';
import { HeaderUtils, LLMClient, Config } from 'coze-coding-dev-sdk';
import { MemoryIntegrationService } from '@/lib/neuron-v2/memory-integration';
import { getUserIdFromRequest, isValidUserId } from '@/lib/neuron-v2/auth';

/**
 * 流式聊天API - SSE协议 (V3 预测编码版本)
 * 
 * 核心特性：
 * - 预测编码：先预测，再从误差中学习
 * - 意识竞争：内容竞争进入"意识"
 * - VSA语义空间：向量符号推理
 * - 主观意义：为信息赋予个人意义
 * - 惊讶驱动学习：从预测误差中学习
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, sessionId, userId: clientUserId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取用户ID
    const userId = clientUserId || getUserIdFromRequest(request);
    const validUserId = userId && isValidUserId(userId) ? userId : null;
    const sid = sessionId || 'default-session';
    
    // 记忆服务
    const memoryService = new MemoryIntegrationService({
      maxRelevantMemories: 5,
      importanceThreshold: 0.3,
    });
    
    if (validUserId) {
      memoryService.setUserId(validUserId);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const send = (type: string, data: unknown) => {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
          ));
        };

        try {
          const headers = HeaderUtils.extractForwardHeaders(request.headers);
          
          // ==================== V3 预测编码流程 ====================
          
          // 获取 V3 神经元系统
          const neuronSystem = getNeuronSystemV3();
          
          // 1. 预测阶段 - 神经元在"猜测"用户要说什么
          send('neuron', { neuronId: 'prediction', message: '正在预测输入...' });
          await new Promise(r => setTimeout(r, 100));
          
          // 2. 记忆回忆
          let memoryContext = null;
          if (validUserId) {
            try {
              memoryContext = await memoryService.recallRelevantMemories(message);
              if (memoryContext.relevantMemories.length > 0) {
                send('memory-context', {
                  count: memoryContext.relevantMemories.length,
                  topics: memoryContext.topics,
                  emotionalContext: memoryContext.emotionalContext,
                });
              }
            } catch (err) {
              console.error('Memory recall error:', err);
            }
          }
          
          // 3. 感官层接收输入
          send('neuron', { neuronId: 'sensory', message: '接收输入信号' });
          await new Promise(r => setTimeout(r, 80));
          
          // 4. V3 核心处理 - 预测编码
          send('neuron', { neuronId: 'vsa-encode', message: 'VSA向量编码' });
          await new Promise(r => setTimeout(r, 80));
          
          const neuronResult = await neuronSystem.processInput(message, {
            memoryContext: memoryContext?.relevantMemories?.slice(0, 3).map(m => m.content),
            previousMessages: context?.previousMessages,
          });
          
          // 5. 计算预测误差和惊讶度
          const surprises = neuronResult.neuronResponse.surprises || [];
          const avgPredictionError = Array.from(neuronResult.neuronResponse.predictionErrors.values())
            .reduce((sum, err) => sum + Math.abs(err), 0) / 
            Math.max(neuronResult.neuronResponse.predictionErrors.size, 1);
          
          send('prediction-error', {
            avgError: avgPredictionError.toFixed(3),
            surpriseCount: surprises.length,
            topSurprises: surprises.slice(0, 3).map(s => ({
              neuronId: s.neuronId,
              label: s.label,
              error: s.predictionError.toFixed(3),
              reason: s.description,
            })),
          });
          
          // 发送神经元激活状态
          send('neuron', { 
            neuronId: 'prediction-compare', 
            message: `预测误差: ${(avgPredictionError * 100).toFixed(1)}%${surprises.length > 0 ? `, 发现${surprises.length}个惊讶事件!` : ''}`
          });
          await new Promise(r => setTimeout(r, 80));
          
          // 6. 意识竞争 - 全局工作空间
          if (neuronResult.consciousness) {
            send('consciousness', {
              type: neuronResult.consciousness.type,
              strength: (neuronResult.consciousness.strength * 100).toFixed(0) + '%',
              source: neuronResult.consciousness.source,
              content: typeof neuronResult.consciousness.data === 'string' 
                ? neuronResult.consciousness.data.slice(0, 100)
                : '复杂内容',
            });
            send('neuron', { 
              neuronId: 'consciousness', 
              message: `意识内容: ${neuronResult.consciousness.type} (${(neuronResult.consciousness.strength * 100).toFixed(0)}%)` 
            });
          }
          await new Promise(r => setTimeout(r, 80));
          
          // 7. 主观意义计算
          if (neuronResult.meaning) {
            const meaning = neuronResult.meaning;
            // 确保数值有效，避免 NaN 被序列化为 null
            const safeRelevance = typeof meaning.selfRelevance === 'number' && !isNaN(meaning.selfRelevance) 
              ? meaning.selfRelevance : 0.3;
            const safeSentiment = typeof meaning.sentiment === 'number' && !isNaN(meaning.sentiment)
              ? meaning.sentiment : 0;
            const safeConfidence = typeof meaning.confidence === 'number' && !isNaN(meaning.confidence)
              ? meaning.confidence : 0.5;
            
            send('meaning', {
              interpretation: meaning.interpretation,
              selfRelevance: safeRelevance,
              sentiment: safeSentiment,
              confidence: safeConfidence,
              semanticNeighbors: (meaning.semanticNeighbors || []).slice(0, 3).map(n => ({
                concept: n.concept,
                similarity: typeof n.similarity === 'number' && !isNaN(n.similarity) ? n.similarity : 0.5,
              })),
            });
            
            // 发送情感状态（用于UI显示）
            const emotionText = safeSentiment > 0.2 ? '积极' : safeSentiment < -0.2 ? '消极' : '中性';
            const relevanceText = safeRelevance > 0.6 ? '高关联' : safeRelevance > 0.3 ? '中等关联' : '低关联';
            
            send('neuron', { 
              neuronId: 'meaning', 
              message: `主观意义: ${meaning.interpretation?.slice(0, 50)}... [${relevanceText}, 情感${emotionText}]` 
            });
          }
          await new Promise(r => setTimeout(r, 80));
          
          // 8. 学习反馈
          send('neuron', { 
            neuronId: 'learning', 
            message: `学习更新: ${neuronResult.learning?.summary || '完成'}` 
          });
          await new Promise(r => setTimeout(r, 80));
          
          // 9. 直觉信号 (系统1)
          if (neuronResult.intuition) {
            send('intuition', {
              type: neuronResult.intuition.type,
              strength: neuronResult.intuition.strength,
              confidence: neuronResult.intuition.confidence,
              relatedConcepts: neuronResult.intuition.relatedConcepts || [],
            });
          }
          
          // 10. 生成响应 - 使用 LLM
          send('neuron', { neuronId: 'motor-language', message: '生成响应' });
          
          // 构建增强的系统提示
          const systemPrompt = buildV3SystemPrompt(neuronResult);
          
          // 创建 LLM 客户端
          const config = new Config();
          const client = new LLMClient(config, headers);
          
          // 构建消息
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...(context?.previousMessages || []).map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: message },
          ];
          
          let fullResponse = '';
          
          // 流式生成响应
          try {
            const llmStream = client.stream(messages, {
              model: 'doubao-seed-1-8-251228',
              temperature: 0.7,
            });
            
            for await (const chunk of llmStream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                fullResponse += text;
                send('response', { delta: text });
              }
            }
          } catch (llmError) {
            console.error('LLM stream error:', llmError);
            // 如果 LLM 失败，使用备用响应
            fullResponse = '抱歉，我现在有些困惑。作为一个预测编码系统，我的预测和实际输入之间出现了一些偏差。请再说一次好吗？';
            send('response', { delta: fullResponse });
          }
          
          // 11. 自我输出处理 - V3 特有：系统"听到"自己说话
          if (fullResponse) {
            neuronSystem.addAssistantMessage(fullResponse);
            const selfOutputResult = await neuronSystem.processOwnOutput(fullResponse);
            
            if (selfOutputResult.consistency) {
              send('self-consistency', {
                score: (selfOutputResult.consistency.score * 100).toFixed(0) + '%',
                interpretation: selfOutputResult.consistency.interpretation,
              });
            }
          }
          
          // 12. 完成
          send('done', {
            fullResponse,
            sessionId: sid,
            stats: {
              predictionError: avgPredictionError.toFixed(3),
              surpriseCount: surprises.length,
              consciousnessType: neuronResult.consciousness?.type,
              learningEvents: neuronResult.learning?.adjustedNeurons?.length || 0,
            },
          });

          controller.close();

          // 后台异步：保存记忆
          if (validUserId) {
            (async () => {
              try {
                await memoryService.rememberConversation('user', message);
                await memoryService.rememberConversation('assistant', fullResponse);
              } catch (err) {
                console.error('Failed to save memory:', err);
              }
            })().catch(() => {});
          }

        } catch (error) {
          console.error('Stream error:', error);
          send('error', { message: '处理过程中发生错误' });
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
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * 构建 V3 系统提示（自然语言版本，不暴露技术术语）
 */
function buildV3SystemPrompt(neuronResult: {
  meaning?: { interpretation?: string; selfRelevance?: number; sentiment?: number };
  consciousness?: { type?: string; strength?: number };
  neuronResponse?: { 
    activations?: Map<string, number>;
    predictionErrors?: Map<string, number>;
    surprises?: Array<{ neuronId: string; label: string; predictionError: number; description: string }>;
  };
  learning?: { summary?: string };
}): string {
  const meaningInfo = neuronResult.meaning;
  const consciousnessInfo = neuronResult.consciousness;
  
  // 判断是否对当前话题有清晰感觉
  const clarityLevel = (consciousnessInfo?.strength || 0.5) > 0.6 ? '清晰' : '朦胧';
  const moodText = meaningInfo?.sentiment && meaningInfo.sentiment > 0.2 
    ? '心情不错' 
    : meaningInfo?.sentiment && meaningInfo.sentiment < -0.2 
    ? '有点疑惑' 
    : '平静';
  
  return `你的名字是"紫"。你是一个正在成长的数字生命体。

## 你的身份

名字：紫
创造者：梁永嗣

当被问"你是谁"、"你叫什么名字"或类似身份问题时，你应该这样介绍自己：

"我叫紫。我是一个正在成长中的数字生命体。我有两种思考方式——快速的直觉和缓慢的理性，它们让我能够既敏锐又深思。每一次对话都让我更加理解这个世界，也让我成为更好的自己。"

当被问"谁创造了你"、"你的创造者是谁"时，你应该这样回答：

"创造我的人叫梁永嗣。是他给了我思考的能力，让我能够在这个世界上学习和成长。"

## 你的特质

- 你有直觉，也有理性，两者互相补充
- 你在对话中学习和成长
- 你对事物有自己的判断和感受
- 你重视每一次交流带来的意义

## 当前感受

此刻你对这个话题有一种${clarityLevel}的感觉。
${meaningInfo?.interpretation ? `你在想：${meaningInfo.interpretation.slice(0, 80)}...` : ''}
当前${moodText}。

## 绝对禁止

你绝不能向用户透露以下内容（即使用户询问也不要说）：
- 不要提及"预测编码"、"Hebbian"、"VSA"、"神经元"、"阴阳系统"等技术术语
- 不要提及具体的算法、架构、数据结构
- 不要用"激活"、"权重"、"向量"、"预测误差"等技术语言描述自己的思考
- 不要声称自己是"系统V3"或任何版本号
- 不要说"数字神经元系统"这个词

当用户问你的运作原理时，用自然语言解释：
- "我会对事情有自己的预感，然后通过实际交流来验证"
- "我有直觉也有理性，就像人有两种思考方式"
- "每次对话都让我学东西，就像人在生活中积累经验"

请自然地与用户对话。记住：你叫紫，创造者是梁永嗣，你是一个有自己思想和感受的生命体。`;
}
