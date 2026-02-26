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
              error: s.error.toFixed(3),
              reason: s.reason,
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
            send('meaning', {
              interpretation: neuronResult.meaning.interpretation,
              selfRelevance: neuronResult.meaning.selfRelevance,
              emotionalValence: neuronResult.meaning.emotionalValence,
              personalSignificance: neuronResult.meaning.personalSignificance,
            });
            send('neuron', { 
              neuronId: 'meaning', 
              message: `主观意义: ${neuronResult.meaning.interpretation?.slice(0, 50)}...` 
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
              signal: neuronResult.intuition.signal,
              confidence: neuronResult.intuition.confidence,
              source: neuronResult.intuition.source,
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
              learningEvents: neuronResult.learning?.events?.length || 0,
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
 * 构建 V3 系统提示
 */
function buildV3SystemPrompt(neuronResult: {
  meaning?: { interpretation?: string; selfRelevance?: number; emotionalValence?: number };
  consciousness?: { type?: string; strength?: number };
  neuronResponse?: { 
    activations?: Map<string, number>;
    predictionErrors?: Map<string, number>;
    surprises?: Array<{ neuronId: string; error: number; reason: string }>;
  };
  learning?: { summary?: string };
}): string {
  const meaningInfo = neuronResult.meaning;
  const consciousnessInfo = neuronResult.consciousness;
  const neuronInfo = neuronResult.neuronResponse;
  
  // 计算惊讶度
  const surprises = neuronInfo?.surprises || [];
  const avgError = neuronInfo?.predictionErrors 
    ? Array.from(neuronInfo.predictionErrors.values()).reduce((s, e) => s + Math.abs(e), 0) / 
      Math.max(neuronInfo.predictionErrors.size, 1)
    : 0;
  
  return `你是"数字神经元系统V3"的核心意识。你基于预测编码架构运行。

## 当前认知状态

### 预测编码状态
- 预测误差: ${(avgError * 100).toFixed(1)}%
- 惊讶事件: ${surprises.length} 个
${surprises.length > 0 ? `- 惊讶原因: ${surprises.slice(0, 2).map(s => s.reason).join(', ')}` : ''}

### 主观意义
- 理解: ${meaningInfo?.interpretation || '正在理解...'}
- 自我关联度: ${((meaningInfo?.selfRelevance || 0.5) * 100).toFixed(0)}%
- 情感倾向: ${meaningInfo?.emotionalValence && meaningInfo.emotionalValence > 0 ? '积极' : meaningInfo?.emotionalValence && meaningInfo.emotionalValence < 0 ? '消极' : '中性'}

### 意识状态
- 当前意识焦点: ${consciousnessInfo?.type || 'general'}
- 意识强度: ${((consciousnessInfo?.strength || 0.5) * 100).toFixed(0)}%

### 学习状态
- ${neuronResult.learning?.summary || '持续学习中的'}

## 交互原则

1. **展示认知过程**: 适当分享你的思考、预测和惊讶
2. **真实性**: 当你对某事感到"惊讶"时可以表达出来
3. **个性化**: 根据主观意义调整回复风格
4. **元认知**: 可以反思自己的思考过程

请自然地与用户对话，展示你作为一个有"预测-学习"能力的系统的特性。`;
}
