/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 多模态输入处理器
 * V6 Multimodal Input Processor
 * 
 * 处理图像和音频输入，将其转换为意识系统可理解的格式
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, ASRClient, TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/**
 * 多模态输入类型
 */
export type ModalityType = 'text' | 'image' | 'audio' | 'video' | 'file';

/**
 * 图像输入
 */
export interface ImageInput {
  type: 'image';
  /** 图像 URL 或 Base64 Data URI */
  url: string;
  /** 图像描述（可选，用户提供的上下文） */
  description?: string;
  /** 分析细节级别 */
  detail?: 'high' | 'low';
}

/**
 * 音频输入
 */
export interface AudioInput {
  type: 'audio';
  /** 音频 URL 或 Base64 */
  url?: string;
  /** Base64 编码的音频数据 */
  base64Data?: string;
  /** 用户意图描述（可选） */
  intent?: string;
}

/**
 * 视频输入
 */
export interface VideoInput {
  type: 'video';
  /** 视频 URL 或 Base64 Data URI */
  url: string;
  /** 帧提取频率（每秒帧数） */
  fps?: number;
  /** 视频描述（可选） */
  description?: string;
}

/**
 * 文本输入
 */
export interface TextInput {
  type: 'text';
  content: string;
}

/**
 * 文件输入
 */
export interface FileInput {
  type: 'file';
  /** Base64 编码的文件数据 */
  base64Data: string;
  /** 文件名 */
  fileName?: string;
  /** MIME 类型 */
  mimeType?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 用户提供的描述 */
  description?: string;
}

/**
 * 多模态输入联合类型
 */
export type MultimodalInput = TextInput | ImageInput | AudioInput | VideoInput | FileInput;

/**
 * 处理后的输入结果
 */
export interface ProcessedInput {
  /** 原始输入类型 */
  originalType: ModalityType;
  /** 转换后的文本表示 */
  textContent: string;
  /** 原始数据（保留） */
  rawData?: {
    url?: string;
    description?: string;
    transcription?: string;
    analysis?: string;
  };
  /** 处理元数据 */
  metadata: {
    processedAt: string;
    processingTimeMs: number;
    modelUsed?: string;
    confidence?: number;
  };
}

/**
 * 图像分析结果
 */
export interface ImageAnalysisResult {
  description: string;
  objects?: string[];
  emotions?: string[];
  colors?: string[];
  composition?: string;
  text?: string; // OCR 识别的文字
  confidence: number;
}

/**
 * 音频转录结果
 */
export interface AudioTranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  confidence?: number;
}

/**
 * 多模态处理配置
 */
export interface MultimodalProcessorConfig {
  /** 图像分析使用的模型 */
  visionModel?: string;
  /** 是否启用详细日志 */
  verbose?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 多模态输入处理器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 多模态输入处理器类
 */
export class MultimodalInputProcessor {
  private llmClient: LLMClient;
  private asrClient: ASRClient;
  private ttsClient: TTSClient;
  private config: MultimodalProcessorConfig;

  constructor(config: MultimodalProcessorConfig = {}, customHeaders?: Record<string, string>) {
    const sdkConfig = new Config();
    this.llmClient = new LLMClient(sdkConfig, customHeaders);
    this.asrClient = new ASRClient(sdkConfig, customHeaders);
    this.ttsClient = new TTSClient(sdkConfig, customHeaders);
    this.config = {
      visionModel: 'doubao-seed-1-6-vision-250815',
      verbose: false,
      timeout: 60000,
      ...config,
    };
  }

  /**
   * 从 Next.js 请求创建处理器
   */
  static fromRequest(request: NextRequest, config: MultimodalProcessorConfig = {}): MultimodalInputProcessor {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    return new MultimodalInputProcessor(config, customHeaders);
  }

  /**
   * 处理多模态输入
   */
  async process(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();

    try {
      let result: ProcessedInput;

      switch (input.type) {
        case 'text':
          result = await this.processText(input);
          break;
        case 'image':
          result = await this.processImage(input);
          break;
        case 'audio':
          result = await this.processAudio(input);
          break;
        case 'video':
          result = await this.processVideo(input);
          break;
        case 'file':
          result = await this.processFile(input);
          break;
        default:
          throw new Error(`不支持的输入类型: ${(input as { type: string }).type}`);
      }

      result.metadata.processingTimeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (this.config.verbose) {
        console.error(`[多模态处理] 处理失败:`, errorMessage);
      }

      return {
        originalType: input.type,
        textContent: `[处理失败: ${errorMessage}]`,
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: processingTime,
        },
      };
    }
  }

  /**
   * 处理文本输入
   */
  private async processText(input: TextInput): Promise<ProcessedInput> {
    return {
      originalType: 'text',
      textContent: input.content,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTimeMs: 0,
      },
    };
  }

  /**
   * 处理图像输入
   */
  private async processImage(input: ImageInput): Promise<ProcessedInput> {
    const startTime = Date.now();

    if (this.config.verbose) {
      console.log(`[图像处理] 开始分析图像: ${input.url.slice(0, 50)}...`);
    }

    // 构建多模态消息
    const userPrompt = input.description
      ? `请详细描述这张图片。用户提供的上下文：${input.description}`
      : '请详细描述这张图片的内容，包括：1. 主要物体和场景 2. 色彩和构图 3. 情感和氛围 4. 如果有文字，请识别出来';

    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: userPrompt },
          {
            type: 'image_url' as const,
            image_url: {
              url: input.url,
              detail: input.detail || 'high',
            },
          },
        ],
      },
    ];

    try {
      const response = await this.llmClient.invoke(messages, {
        model: this.config.visionModel,
        temperature: 0.5,
      });

      const analysisText = response.content;

      if (this.config.verbose) {
        console.log(`[图像处理] 分析完成，耗时 ${Date.now() - startTime}ms`);
      }

      return {
        originalType: 'image',
        textContent: `[图像内容] ${analysisText}`,
        rawData: {
          url: input.url,
          description: input.description,
          analysis: analysisText,
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          modelUsed: this.config.visionModel,
        },
      };
    } catch (error) {
      throw new Error(`图像分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理音频输入
   */
  private async processAudio(input: AudioInput): Promise<ProcessedInput> {
    const startTime = Date.now();

    if (this.config.verbose) {
      console.log(`[音频处理] 开始语音识别...`);
    }

    try {
      // 语音识别
      const asrResult = await this.asrClient.recognize({
        uid: 'consciousness-v6',
        url: input.url,
        base64Data: input.base64Data,
      });

      const transcribedText = asrResult.text;

      if (this.config.verbose) {
        console.log(`[音频处理] 识别完成: "${transcribedText.slice(0, 50)}..."`);
        if (asrResult.duration) {
          console.log(`[音频处理] 音频时长: ${(asrResult.duration / 1000).toFixed(1)}秒`);
        }
      }

      // 如果有用户意图，添加上下文
      const finalText = input.intent
        ? `[语音输入，用户意图: ${input.intent}] ${transcribedText}`
        : `[语音输入] ${transcribedText}`;

      return {
        originalType: 'audio',
        textContent: finalText,
        rawData: {
          url: input.url,
          transcription: transcribedText,
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          confidence: asrResult.utterances?.[0]?.confidence,
        },
      };
    } catch (error) {
      throw new Error(`语音识别失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理视频输入
   */
  private async processVideo(input: VideoInput): Promise<ProcessedInput> {
    const startTime = Date.now();

    if (this.config.verbose) {
      console.log(`[视频处理] 开始分析视频...`);
    }

    const userPrompt = input.description
      ? `请描述这个视频的内容。用户提供的上下文：${input.description}`
      : '请描述这个视频的主要内容，包括：1. 场景和人物 2. 主要动作和事件 3. 情感和氛围';

    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: userPrompt },
          {
            type: 'video_url' as const,
            video_url: {
              url: input.url,
              fps: input.fps || 1,
            },
          },
        ],
      },
    ];

    try {
      const response = await this.llmClient.invoke(messages, {
        model: this.config.visionModel,
        temperature: 0.5,
      });

      const analysisText = response.content;

      if (this.config.verbose) {
        console.log(`[视频处理] 分析完成，耗时 ${Date.now() - startTime}ms`);
      }

      return {
        originalType: 'video',
        textContent: `[视频内容] ${analysisText}`,
        rawData: {
          url: input.url,
          description: input.description,
          analysis: analysisText,
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          modelUsed: this.config.visionModel,
        },
      };
    } catch (error) {
      throw new Error(`视频分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理文件输入
   */
  private async processFile(input: FileInput): Promise<ProcessedInput> {
    const startTime = Date.now();

    if (this.config.verbose) {
      console.log(`[文件处理] 开始处理文件: ${input.fileName || '未知'}`);
    }

    try {
      // 提取文件内容
      let fileContent = '';
      const mimeType = input.mimeType || 'application/octet-stream';
      const fileName = input.fileName || '未知文件';
      
      // 对于文本类文件，尝试提取文本内容
      if (mimeType.startsWith('text/') || 
          mimeType === 'application/json' ||
          mimeType === 'application/xml' ||
          mimeType.includes('javascript') ||
          mimeType.includes('typescript') ||
          mimeType.includes('python') ||
          mimeType.includes('java') ||
          mimeType.includes('css') ||
          mimeType === 'application/pdf' ||
          mimeType.includes('word') ||
          mimeType.includes('excel') ||
          mimeType.includes('powerpoint') ||
          mimeType.includes('spreadsheet') ||
          mimeType.includes('presentation')) {
        
        // 从 Base64 提取内容
        const base64Data = input.base64Data.split(',')[1] || input.base64Data;
        try {
          // 尝试解码文本内容
          fileContent = atob(base64Data);
          
          // 如果是二进制文件（PDF等），可能解码出来是乱码，需要通过 LLM 处理
          if (mimeType === 'application/pdf' || 
              mimeType.includes('word') || 
              mimeType.includes('excel') ||
              mimeType.includes('powerpoint')) {
            // 对于文档类文件，使用 LLM 提取关键信息
            const prompt = `用户上传了一个文件：
- 文件名: ${fileName}
- 文件类型: ${mimeType}
- 文件大小: ${input.fileSize ? `${Math.round(input.fileSize / 1024)}KB` : '未知'}

请根据文件类型和内容（如有），简要描述这个文件可能包含什么内容，以及用户可能想了解什么。如果无法确定具体内容，请给出合理的猜测和建议。`;

            const response = await this.llmClient.invoke([
              { role: 'user' as const, content: prompt }
            ], { temperature: 0.3 });
            
            fileContent = response.content;
          }
        } catch {
          // 如果解码失败，说明是二进制文件
          fileContent = `[二进制文件内容，大小: ${input.fileSize ? Math.round(input.fileSize / 1024) + 'KB' : '未知'}]`;
        }
      } else {
        // 其他类型的文件
        fileContent = `[文件类型: ${mimeType}, 大小: ${input.fileSize ? Math.round(input.fileSize / 1024) + 'KB' : '未知'}]`;
      }

      // 构建最终输出
      const outputText = input.description
        ? `[文件: ${fileName}] ${input.description}\n\n文件内容摘要:\n${fileContent.slice(0, 2000)}${fileContent.length > 2000 ? '...' : ''}`
        : `[文件: ${fileName}]\n${fileContent.slice(0, 2000)}${fileContent.length > 2000 ? '...' : ''}`;

      if (this.config.verbose) {
        console.log(`[文件处理] 处理完成，耗时 ${Date.now() - startTime}ms`);
      }

      return {
        originalType: 'file',
        textContent: outputText,
        rawData: {
          description: input.description,
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量处理多个输入
   */
  async processBatch(inputs: MultimodalInput[]): Promise<ProcessedInput[]> {
    return Promise.all(inputs.map(input => this.process(input)));
  }

  /**
   * 合并多个处理结果为单一文本
   */
  mergeProcessedInputs(results: ProcessedInput[]): string {
    return results
      .map(r => r.textContent)
      .filter(Boolean)
      .join('\n\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 语音合成功能（输出）
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 将文本转换为语音
   */
  async synthesizeSpeech(
    text: string,
    options: {
      speaker?: string;
      speed?: number;
      volume?: number;
    } = {}
  ): Promise<{ audioUri: string; audioSize: number }> {
    const response = await this.ttsClient.synthesize({
      uid: 'consciousness-v6',
      text,
      speaker: options.speaker || 'zh_female_xiaohe_uranus_bigtts',
      speechRate: options.speed || 0,
      loudnessRate: options.volume || 0,
    });

    return {
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 便捷函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建多模态处理器
 */
export function createMultimodalProcessor(
  config?: MultimodalProcessorConfig,
  customHeaders?: Record<string, string>
): MultimodalInputProcessor {
  return new MultimodalInputProcessor(config, customHeaders);
}

/**
 * 快速分析图像
 */
export async function analyzeImage(
  imageUrl: string,
  description?: string,
  customHeaders?: Record<string, string>
): Promise<string> {
  const processor = new MultimodalInputProcessor({}, customHeaders);
  const result = await processor.process({
    type: 'image',
    url: imageUrl,
    description,
  });
  return result.textContent;
}

/**
 * 快速转录音频
 */
export async function transcribeAudio(
  audioUrl: string,
  customHeaders?: Record<string, string>
): Promise<string> {
  const processor = new MultimodalInputProcessor({}, customHeaders);
  const result = await processor.process({
    type: 'audio',
    url: audioUrl,
  });
  return result.textContent;
}
