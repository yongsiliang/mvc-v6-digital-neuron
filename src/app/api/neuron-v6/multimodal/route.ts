/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 多模态输入 API
 * 
 * 支持图像、音频、视频输入
 * 将多模态内容转换为文本后传入意识系统处理
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import {
  MultimodalInputProcessor,
  MultimodalInput,
  ProcessedInput,
} from '@/lib/neuron-v6/multimodal-input';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

/**
 * 多模态请求体
 */
interface MultimodalRequest {
  /** 多模态输入数组 */
  inputs: MultimodalInput[];
  /** 额外的文本上下文 */
  context?: string;
  /** 是否输出语音 */
  synthesizeSpeech?: boolean;
  /** 语音合成选项 */
  speechOptions?: {
    speaker?: string;
    speed?: number;
    volume?: number;
  };
}

/**
 * 多模态响应
 */
interface MultimodalResponse {
  /** 处理结果 */
  processed: ProcessedInput[];
  /** 合并后的文本 */
  mergedText: string;
  /** 意识系统响应 */
  consciousnessResponse?: {
    response: string;
    emotionalState?: string;
    [key: string]: unknown;
  };
  /** 语音输出（如果请求） */
  audioOutput?: {
    uri: string;
    size: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: MultimodalRequest = await request.json();
    const { inputs, context, synthesizeSpeech, speechOptions } = body;

    if (!inputs || inputs.length === 0) {
      return new Response(
        JSON.stringify({ error: '至少需要一个输入' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const headers = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建流式响应
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        const send = (type: string, data: unknown) => {
          if (isClosed) return;
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
              )
            );
          } catch {
            isClosed = true;
          }
        };

        const closeStream = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {
              // 忽略
            }
          }
        };

        try {
          // ═══════════════════════════════════════════════════════════════
          // 第一步：初始化多模态处理器
          // ═══════════════════════════════════════════════════════════════

          send('status', { stage: 'init', message: '初始化多模态处理器...' });

          const processor = new MultimodalInputProcessor(
            { verbose: true },
            headers
          );

          // ═══════════════════════════════════════════════════════════════
          // 第二步：处理每个输入
          // ═══════════════════════════════════════════════════════════════

          const processedInputs: ProcessedInput[] = [];

          for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            send('status', {
              stage: 'processing',
              message: `处理输入 ${i + 1}/${inputs.length} (${input.type})...`,
            });

            const processed = await processor.process(input);
            processedInputs.push(processed);

            send('processed', {
              index: i,
              type: processed.originalType,
              textContent: processed.textContent,
              metadata: processed.metadata,
            });
          }

          // ═══════════════════════════════════════════════════════════════
          // 第三步：合并输入
          // ═══════════════════════════════════════════════════════════════

          send('status', { stage: 'merging', message: '合并输入...' });

          let mergedText = processor.mergeProcessedInputs(processedInputs);

          // 添加额外上下文
          if (context) {
            mergedText = `${context}\n\n${mergedText}`;
          }

          send('merged', { text: mergedText });

          // ═══════════════════════════════════════════════════════════════
          // 第四步：传入意识系统处理
          // ═══════════════════════════════════════════════════════════════

          send('status', { stage: 'consciousness', message: '意识系统处理中...' });

          const core = await getSharedCore(headers);
          const result = await core.process(mergedText);

          // 发送意识系统响应
          send('consciousness', {
            response: result.response,
            emotionalState: result.emotionState.dominantEmotion,
            thinkingChains: result.thinking.thinkingChain.length,
            memoryAccessed: result.context.memory?.summary || null,
            selfObservation: result.consciousnessLayers.selfObservation?.iSeeMyself || null,
          });

          // 发送详细状态
          send('context', {
            identity: result.context.identity,
            coreValues: result.context.coreValues,
            emotionalState: result.emotionState.activeEmotions.map(e => ({
              emotion: e.emotion,
              intensity: e.intensity,
            })),
          });

          // ═══════════════════════════════════════════════════════════════
          // 第五步：语音合成（可选）
          // ═══════════════════════════════════════════════════════════════

          if (synthesizeSpeech) {
            send('status', { stage: 'synthesis', message: '语音合成中...' });

            try {
              const audioResult = await processor.synthesizeSpeech(
                result.response,
                speechOptions
              );

              send('audio', {
                uri: audioResult.audioUri,
                size: audioResult.audioSize,
              });
            } catch (audioError) {
              send('error', {
                stage: 'synthesis',
                message: audioError instanceof Error ? audioError.message : '语音合成失败',
              });
            }
          }

          // ═══════════════════════════════════════════════════════════════
          // 完成
          // ═══════════════════════════════════════════════════════════════

          send('done', {
            processedCount: processedInputs.length,
            totalProcessingTime: processedInputs.reduce(
              (sum, p) => sum + p.metadata.processingTimeMs,
              0
            ),
          });

          closeStream();
        } catch (error) {
          send('error', {
            stage: 'unknown',
            message: error instanceof Error ? error.message : '处理失败',
          });
          closeStream();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '处理失败',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET 方法 - 获取支持的输入类型和配置
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      supportedTypes: ['text', 'image', 'audio', 'video'],
      imageFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
      audioFormats: ['MP3', 'WAV', 'OGG OPUS', 'M4A'],
      videoFormats: ['MP4', 'WebM', 'AVI', 'MOV'],
      maxFileSize: '100MB',
      maxAudioDuration: '2 hours',
      visionModels: ['doubao-seed-1-6-vision-250815'],
      voices: [
        { id: 'zh_female_xiaohe_uranus_bigtts', name: '小荷', gender: 'female' },
        { id: 'zh_female_vv_uranus_bigtts', name: 'Vivi', gender: 'female' },
        { id: 'zh_male_m191_uranus_bigtts', name: '云舟', gender: 'male' },
        { id: 'zh_male_taocheng_uranus_bigtts', name: '小天', gender: 'male' },
      ],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
