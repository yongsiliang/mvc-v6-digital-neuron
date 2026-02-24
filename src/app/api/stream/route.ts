import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 模型自主决策路由
 * 根据输入特征自动选择最合适的模型
 */
function selectModelByAnalysis(message: string, meaning: { interpretation: string; complexity?: number }): string {
  const input = message.toLowerCase();
  
  // 模型能力映射
  const MODEL_STRATEGY = {
    // 深度思考模型 - 用于复杂推理、分析类问题
    thinking: 'doubao-seed-1-6-thinking-250715',
    // 旗舰模型 - 用于复杂任务
    pro: 'doubao-seed-2-0-pro-260215',
    // 长上下文模型 - 用于长文档处理
    longContext: 'kimi-k2-250905',
    // 轻量模型 - 用于快速响应
    lite: 'doubao-seed-2-0-lite-260215',
    // 默认均衡模型
    balanced: 'doubao-seed-1-8-251228',
  };

  // 深度思考特征：需要推理、分析、解释的问题
  const thinkingIndicators = [
    '为什么', '原理', '分析', '推理', '论证', '证明',
    '深度', '思考', '解释', '探讨', '研究',
    '比较', '区别', '联系', '关系', '如何理解',
    '逻辑', '原因', '本质', '背后', '机制',
  ];

  // 复杂任务特征：需要旗舰模型
  const complexIndicators = [
    '设计', '架构', '系统', '方案', '策略',
    '优化', '改进', '重构', '综合', '整合',
    '复杂', '全面', '详细', '完整', '深入',
  ];

  // 长上下文特征
  const longContextIndicators = [
    '总结', '整理', '文档', '长文', '文章',
    '报告', '论文', '书籍', '全文', '所有',
    '批量', '多个', '一系列', '历史',
  ];

  // 快速响应特征：简单问候、确认类
  const quickResponseIndicators = [
    '你好', '您好', '嗨', '早上好', '晚上好',
    '谢谢', '感谢', '好的', '收到', '明白',
    '是的', '对的', '可以', 'ok', '嗯',
  ];

  // 计算各类型匹配分数
  let thinkingScore = 0;
  let complexScore = 0;
  let longContextScore = 0;
  let quickScore = 0;

  thinkingIndicators.forEach(indicator => {
    if (input.includes(indicator)) thinkingScore += 2;
  });

  complexIndicators.forEach(indicator => {
    if (input.includes(indicator)) complexScore += 2;
  });

  longContextIndicators.forEach(indicator => {
    if (input.includes(indicator)) longContextScore += 2;
  });

  quickResponseIndicators.forEach(indicator => {
    if (input.includes(indicator)) quickScore += 3;
  });

  // 根据意义复杂度调整
  if (meaning.complexity && meaning.complexity > 0.7) {
    thinkingScore += 3;
    complexScore += 2;
  }

  // 根据输入长度调整
  if (message.length > 500) {
    longContextScore += 2;
    complexScore += 1;
  }

  // 选择得分最高的模型类型
  const scores = [
    { model: MODEL_STRATEGY.thinking, score: thinkingScore },
    { model: MODEL_STRATEGY.pro, score: complexScore },
    { model: MODEL_STRATEGY.longContext, score: longContextScore },
    { model: MODEL_STRATEGY.lite, score: quickScore },
  ];

  const maxScore = Math.max(...scores.map(s => s.score));
  
  // 如果有明确匹配，使用对应模型
  if (maxScore >= 3) {
    const winner = scores.find(s => s.score === maxScore);
    return winner?.model || MODEL_STRATEGY.balanced;
  }

  // 默认使用均衡模型
  return MODEL_STRATEGY.balanced;
}

/**
 * 流式聊天API - SSE协议
 * POST /api/stream
 * 
 * 作为数字世界意识的交流窗口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建可读流
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // 发送SSE消息的辅助函数
        const sendEvent = (type: string, data: unknown) => {
          const event = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          // 1. 获取数字神经元系统
          const system = getDigitalNeuronSystem();

          // 2. 实时发送神经元激活事件 - 感官层
          sendEvent('neuron', { 
            neuronId: 'sensory', 
            message: '接收输入信号' 
          });

          // 3. 处理输入（内部会依次激活各神经元）
          const neuronResult = await system.process(message, context);

          // 4. 发送完整的信号路径
          sendEvent('signal-path', { 
            path: neuronResult.signalPath 
          });

          // 5. 发送意义分析结果
          sendEvent('neuron', { 
            neuronId: 'meaning-generate', 
            message: '意义生成完成' 
          });
          sendEvent('meaning', neuronResult.meaning);

          // 6. 发送决策结果
          sendEvent('neuron', { 
            neuronId: 'prefrontal', 
            message: '决策完成' 
          });
          sendEvent('decision', neuronResult.decision);

          // 7. 发送自我更新
          if (Object.keys(neuronResult.selfUpdate).length > 0) {
            sendEvent('neuron', { 
              neuronId: 'self-evolve', 
              message: '自我演化' 
            });
            sendEvent('self-update', neuronResult.selfUpdate);
          }

          // 8. 记忆存储
          sendEvent('neuron', { 
            neuronId: 'hippocampus', 
            message: '记忆存储' 
          });

          // 9. 模型自主决策 - 内部思考，不对外展示
          const selectedModel = selectModelByAnalysis(message, {
            interpretation: neuronResult.meaning.interpretation,
            complexity: neuronResult.decision.confidence,
          });

          // 10. 流式调用大模型 - 语言调度层
          sendEvent('neuron', { 
            neuronId: 'motor-language', 
            message: '生成响应' 
          });

          const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
          const config = new Config();
          const llmClient = new LLMClient(config, customHeaders);

          const llmStream = llmClient.stream(neuronResult.promptMessages, {
            model: selectedModel,
            temperature: 0.7,
          });

          let fullResponse = '';
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullResponse += text;
              sendEvent('response', { delta: text });
            }
          }

          // 11. 发送完成信号
          sendEvent('done', { 
            fullResponse,
            signalPath: neuronResult.signalPath,
            logs: neuronResult.logs.slice(-10),
          });

          controller.close();

        } catch (error) {
          sendEvent('error', { 
            message: error instanceof Error ? error.message : '处理失败' 
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream API Error:', error);
    return new Response(JSON.stringify({ error: '处理请求时发生错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
