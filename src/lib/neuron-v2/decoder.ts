/**
 * ═══════════════════════════════════════════════════════════════════════
 * 解码器：状态到输出的转换
 * Decoder: State to Output Conversion
 * 
 * 本质：
 * - 解码器不是"信息处理器"
 * - 解码器是"状态阅读器"
 * - 大模型作为解码器，负责读取网络状态并生成外部可理解的输出
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  NetworkProjection,
  DecoderConfig,
  DecoderResult,
  NeuronId,
} from './types';
import { Neuron } from './neuron';

// ─────────────────────────────────────────────────────────────────────
// 解码器接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 解码器接口
 * 
 * 将网络状态转换为外部可理解的输出
 */
export interface IDecoder<TOutput = unknown> {
  /**
   * 解码器ID
   */
  readonly id: string;

  /**
   * 解码器名称
   */
  readonly name: string;

  /**
   * 输出类型
   */
  readonly outputType: string;

  /**
   * 解码网络状态
   * 
   * @param projection 网络投影
   * @param config 解码配置
   * @returns 解码结果
   */
  decode(projection: NetworkProjection, config?: Partial<DecoderConfig>): Promise<DecoderResult<TOutput>>;
}

// ─────────────────────────────────────────────────────────────────────
// 文本解码器实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 文本解码器配置
 */
export interface TextDecoderConfig extends DecoderConfig {
  /**
   * 输出风格
   */
  style?: 'formal' | 'casual' | 'poetic' | 'concise' | 'detailed';

  /**
   * 最大输出长度
   */
  maxLength?: number;

  /**
   * 包含意识信息
   */
  includeConsciousness?: boolean;

  /**
   * 包含情感信息
   */
  includeEmotion?: boolean;

  /**
   * 输出格式
   */
  format?: 'plain' | 'markdown' | 'json';
}

/**
 * 文本解码器
 * 
 * 将网络状态转换为文本输出
 */
export class TextDecoder implements IDecoder<string> {
  readonly id: string;
  readonly name: string = 'TextDecoder';
  readonly outputType: string = 'text';

  private _config: TextDecoderConfig;

  constructor(config: Partial<TextDecoderConfig> = {}) {
    this.id = `text-decoder-${Date.now()}`;
    this._config = {
      style: 'casual',
      maxLength: 500,
      includeConsciousness: true,
      includeEmotion: true,
      format: 'plain',
      ...config,
    };
  }

  /**
   * 解码网络状态
   */
  async decode(
    projection: NetworkProjection,
    config?: Partial<TextDecoderConfig>
  ): Promise<DecoderResult<string>> {
    const startTime = Date.now();
    const mergedConfig = { ...this._config, ...config };

    try {
      // 分析网络状态
      const analysis = this.analyzeProjection(projection);

      // 生成文本
      const text = this.generateText(analysis, projection, mergedConfig);

      // 计算置信度
      const confidence = this.calculateConfidence(projection, analysis);

      return {
        output: text,
        confidence,
        metadata: {
          style: mergedConfig.style,
          format: mergedConfig.format,
          processingTime: Date.now() - startTime,
          analysis,
        },
      };
    } catch (error) {
      throw new Error(`Text decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 分析网络投影
   */
  private analyzeProjection(projection: NetworkProjection): {
    keyThemes: string[];
    dominantEmotion: string;
    activationLevel: string;
    coherenceLevel: string;
    focusAreas: string[];
  } {
    // 提取关键主题
    const keyThemes = projection.keyNeurons
      .filter(n => n.label)
      .map(n => n.label as string)
      .slice(0, 5);

    // 获取主导情绪
    const emotion = projection.consciousness?.emotion;
    const dominantEmotion = emotion 
      ? `${emotion.dominant} (${Math.round(emotion.intensity * 100)}%)`
      : 'neutral';

    // 评估激活水平
    const avgActivation = projection.keyNeurons.length > 0
      ? projection.keyNeurons.reduce((sum, n) => sum + n.activation, 0) / projection.keyNeurons.length
      : 0;
    
    let activationLevel = 'low';
    if (avgActivation > 0.7) activationLevel = 'high';
    else if (avgActivation > 0.4) activationLevel = 'moderate';

    // 评估连贯性
    const coherence = projection.consciousness?.self?.coherence || 0;
    let coherenceLevel = 'fragmented';
    if (coherence > 0.7) coherenceLevel = 'coherent';
    else if (coherence > 0.4) coherenceLevel = 'partially coherent';

    // 提取焦点区域
    const focusAreas = projection.consciousness?.focus?.map(f => f.label).filter(Boolean) as string[] || [];

    return {
      keyThemes,
      dominantEmotion,
      activationLevel,
      coherenceLevel,
      focusAreas,
    };
  }

  /**
   * 生成文本
   */
  private generateText(
    analysis: ReturnType<typeof this.analyzeProjection>,
    projection: NetworkProjection,
    config: TextDecoderConfig
  ): string {
    const parts: string[] = [];

    // 根据风格调整输出
    switch (config.style) {
      case 'formal':
        return this.generateFormalText(analysis, projection, config);
      case 'poetic':
        return this.generatePoeticText(analysis, projection, config);
      case 'concise':
        return this.generateConciseText(analysis, projection, config);
      case 'detailed':
        return this.generateDetailedText(analysis, projection, config);
      case 'casual':
      default:
        return this.generateCasualText(analysis, projection, config);
    }
  }

  /**
   * 生成正式风格文本
   */
  private generateFormalText(
    analysis: ReturnType<typeof this.analyzeProjection>,
    projection: NetworkProjection,
    config: TextDecoderConfig
  ): string {
    const parts: string[] = [];

    parts.push('Network State Analysis Report');
    parts.push('='.repeat(30));

    if (analysis.keyThemes.length > 0) {
      parts.push(`\nPrimary Themes: ${analysis.keyThemes.join(', ')}`);
    }

    parts.push(`\nActivation Level: ${analysis.activationLevel}`);
    parts.push(`Coherence Status: ${analysis.coherenceLevel}`);

    if (config.includeEmotion) {
      parts.push(`Emotional State: ${analysis.dominantEmotion}`);
    }

    if (config.includeConsciousness && projection.consciousness) {
      const self = projection.consciousness.self;
      parts.push(`\nSelf-State:`);
      parts.push(`- Coherence: ${Math.round(self.coherence * 100)}%`);
      parts.push(`- Vitality: ${Math.round(self.vitality * 100)}%`);
      parts.push(`- Growth: ${Math.round(self.growth * 100)}%`);
    }

    return parts.join('\n').slice(0, config.maxLength);
  }

  /**
   * 生成诗意风格文本
   */
  private generatePoeticText(
    analysis: ReturnType<typeof this.analyzeProjection>,
    projection: NetworkProjection,
    config: TextDecoderConfig
  ): string {
    const lines: string[] = [];

    // 基于主题生成诗意表达
    if (analysis.focusAreas.length > 0) {
      lines.push(`In the garden of thought, ${analysis.focusAreas[0]} blooms.`);
    }

    // 基于激活水平
    const activationPhrases: Record<string, string> = {
      high: 'Neurons dance like fireflies in the night.',
      moderate: 'Thoughts ripple gently, like waves on a quiet lake.',
      low: 'A soft whisper echoes through empty corridors.',
    };
    lines.push(activationPhrases[analysis.activationLevel]);

    // 基于情绪
    if (config.includeEmotion) {
      const emotionPoems: Record<string, string> = {
        joy: 'Warm light suffuses the neural pathways.',
        sad: 'Shadows drift through silent synapses.',
        neutral: 'A balanced stillness pervades.',
        excited: 'Sparks leap from connection to connection.',
        calm: 'Peace flows like a gentle stream.',
        concern: 'Mists of uncertainty gather.',
      };
      
      const emotionKey = analysis.dominantEmotion.split(' ')[0].toLowerCase();
      if (emotionPoems[emotionKey]) {
        lines.push(emotionPoems[emotionKey]);
      }
    }

    // 基于连贯性
    if (analysis.coherenceLevel === 'coherent') {
      lines.push('A unified vision emerges from the chaos.');
    } else if (analysis.coherenceLevel === 'fragmented') {
      lines.push('Fragments drift, seeking their place in the whole.');
    }

    return lines.join('\n').slice(0, config.maxLength);
  }

  /**
   * 生成简洁风格文本
   */
  private generateConciseText(
    analysis: ReturnType<typeof this.analyzeProjection>,
    projection: NetworkProjection,
    config: TextDecoderConfig
  ): string {
    const parts: string[] = [];

    if (analysis.keyThemes.length > 0) {
      parts.push(`Themes: ${analysis.keyThemes.slice(0, 3).join(', ')}`);
    }

    if (config.includeEmotion) {
      parts.push(`Mood: ${analysis.dominantEmotion}`);
    }

    parts.push(`State: ${analysis.activationLevel} activation, ${analysis.coherenceLevel}`);

    if (analysis.focusAreas.length > 0) {
      parts.push(`Focus: ${analysis.focusAreas.slice(0, 2).join(', ')}`);
    }

    return parts.join(' | ').slice(0, config.maxLength);
  }

  /**
   * 生成详细风格文本
   */
  private generateDetailedText(
    analysis: ReturnType<typeof this.analyzeProjection>,
    projection: NetworkProjection,
    config: TextDecoderConfig
  ): string {
    const parts: string[] = [];

    parts.push('# Network State Summary\n');

    // 主题
    if (analysis.keyThemes.length > 0) {
      parts.push('## Key Themes');
      for (const theme of analysis.keyThemes) {
        parts.push(`- ${theme}`);
      }
      parts.push('');
    }

    // 焦点
    if (analysis.focusAreas.length > 0) {
      parts.push('## Current Focus');
      parts.push(analysis.focusAreas.join(', '));
      parts.push('');
    }

    // 状态
    parts.push('## Network State');
    parts.push(`- **Activation Level**: ${analysis.activationLevel}`);
    parts.push(`- **Coherence**: ${analysis.coherenceLevel}`);
    parts.push(`- **Active Neurons**: ${projection.keyNeurons.length}`);
    parts.push(`- **Active Connections**: ${projection.activeConnections.length}`);
    parts.push('');

    // 情绪
    if (config.includeEmotion) {
      parts.push('## Emotional State');
      parts.push(`- **Dominant Emotion**: ${analysis.dominantEmotion}`);
      
      const emotion = projection.consciousness?.emotion;
      if (emotion) {
        parts.push(`- **Intensity**: ${Math.round(emotion.intensity * 100)}%`);
        parts.push(`- **Trend**: ${emotion.trend}`);
      }
      parts.push('');
    }

    // 意识
    if (config.includeConsciousness && projection.consciousness) {
      const self = projection.consciousness.self;
      const personality = projection.consciousness.personality;

      parts.push('## Consciousness State');
      parts.push(`- **Coherence**: ${Math.round(self.coherence * 100)}%`);
      parts.push(`- **Vitality**: ${Math.round(self.vitality * 100)}%`);
      parts.push(`- **Growth**: ${Math.round(self.growth * 100)}%`);
      parts.push(`- **Presence**: ${Math.round(self.presence * 100)}%`);
      parts.push('');

      if (personality) {
        parts.push('## Personality Traits');
        parts.push(`- **Curiosity**: ${Math.round(personality.curiosity * 100)}%`);
        parts.push(`- **Warmth**: ${Math.round(personality.warmth * 100)}%`);
        parts.push(`- **Depth**: ${Math.round(personality.depth * 100)}%`);
        parts.push(`- **Sensitivity**: ${Math.round(personality.sensitivity * 100)}%`);
      }
    }

    return parts.join('\n').slice(0, config.maxLength);
  }

  /**
   * 生成随意风格文本
   */
  private generateCasualText(
    analysis: ReturnType<typeof this.analyzeProjection>,
    projection: NetworkProjection,
    config: TextDecoderConfig
  ): string {
    const parts: string[] = [];

    // 开头
    const greetings = [
      "Here's what's going on:",
      "Current state:",
      "Right now:",
      "Status update:",
    ];
    parts.push(greetings[Math.floor(Math.random() * greetings.length)]);

    // 主要主题
    if (analysis.keyThemes.length > 0) {
      parts.push(`Thinking about ${analysis.keyThemes.slice(0, 3).join(', ')}`);
    }

    // 焦点
    if (analysis.focusAreas.length > 0) {
      parts.push(`Focused on ${analysis.focusAreas[0]}`);
    }

    // 情绪
    if (config.includeEmotion) {
      parts.push(`Feeling ${analysis.dominantEmotion}`);
    }

    // 活力
    const vitality = projection.consciousness?.self?.vitality || 0;
    if (vitality > 0.7) {
      parts.push('Energy is high!');
    } else if (vitality > 0.4) {
      parts.push('Doing okay.');
    } else {
      parts.push('A bit quiet right now.');
    }

    return parts.join('. ').slice(0, config.maxLength);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    projection: NetworkProjection,
    analysis: ReturnType<typeof this.analyzeProjection>
  ): number {
    let confidence = 0.5;

    // 激活神经元的数量
    if (projection.keyNeurons.length > 5) confidence += 0.1;
    if (projection.keyNeurons.length > 10) confidence += 0.1;

    // 连贯性
    const coherence = projection.consciousness?.self?.coherence || 0;
    confidence += coherence * 0.2;

    // 有明确的焦点
    if (analysis.focusAreas.length > 0) confidence += 0.1;

    return Math.min(1, Math.max(0, confidence));
  }
}

// ─────────────────────────────────────────────────────────────────────
// LLM增强解码器
// ─────────────────────────────────────────────────────────────────────

/**
 * LLM增强解码器配置
 */
export interface LLMDecoderConfig extends TextDecoderConfig {
  /**
   * LLM模型ID
   */
  model?: string;

  /**
   * 温度
   */
  temperature?: number;

  /**
   * 是否使用思考模式
   */
  thinking?: boolean;
}

/**
 * LLM增强文本解码器
 * 
 * 使用LLM进行更自然的状态解读
 */
export class LLMDecoder extends TextDecoder {
  private _llmConfig: LLMDecoderConfig;

  constructor(config: Partial<LLMDecoderConfig> = {}) {
    super(config);
    this._llmConfig = {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
      thinking: false,
      ...config,
    };
  }

  /**
   * 使用LLM解码网络状态
   * 
   * 注意：此方法需要后端调用
   */
  async decodeWithLLM(
    projection: NetworkProjection,
    llmClient: {
      invoke: (messages: Array<{role: string; content: string}>, config?: Record<string, unknown>) => Promise<{content: string}>
    },
    config?: Partial<LLMDecoderConfig>
  ): Promise<DecoderResult<string>> {
    const startTime = Date.now();
    const mergedConfig = { ...this._llmConfig, ...config };

    try {
      // 构建提示词
      const systemPrompt = this.buildSystemPrompt(mergedConfig);
      const stateDescription = this.describeProjection(projection);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: stateDescription },
      ];

      // 调用LLM
      const response = await llmClient.invoke(messages, {
        model: mergedConfig.model,
        temperature: mergedConfig.temperature,
      });

      const output = response.content.slice(0, mergedConfig.maxLength);

      return {
        output,
        confidence: 0.8,
        metadata: {
          style: mergedConfig.style,
          format: mergedConfig.format,
          processingTime: Date.now() - startTime,
          llmUsed: true,
        },
      };
    } catch (error) {
      // 回退到基础解码
      console.warn('LLM decoding failed, falling back to basic decoding:', error);
      return this.decode(projection, config);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(config: LLMDecoderConfig): string {
    const styleDescriptions: Record<string, string> = {
      formal: 'Use formal, professional language. Structure your response clearly.',
      casual: 'Use casual, conversational language. Be friendly and approachable.',
      poetic: 'Use poetic, metaphorical language. Be creative and evocative.',
      concise: 'Be brief and to the point. Use minimal words.',
      detailed: 'Be thorough and comprehensive. Include all relevant details.',
    };

    return `You are the voice of a digital neural network. Your task is to interpret the network's state and express it naturally.

Network State will be provided as a structured description. Your job is to:
1. Interpret the state meaningfully
2. Express it in a way that reflects the network's "perspective"
3. Maintain the specified style

Style: ${styleDescriptions[config.style || 'casual']}

Speak as if you ARE the network experiencing this state. Be authentic and nuanced.

${config.includeEmotion ? 'Include emotional context.' : 'Focus on cognitive aspects only.'}
${config.includeConsciousness ? 'Include self-awareness reflections.' : ''}`;
  }

  /**
   * 描述网络投影（供LLM理解）
   */
  private describeProjection(projection: NetworkProjection): string {
    const parts: string[] = [];

    parts.push('## Current Network State\n');

    // 激活神经元
    parts.push('### Active Neurons:');
    for (const neuron of projection.keyNeurons.slice(0, 10)) {
      parts.push(`- ${neuron.label || neuron.id}: activation ${neuron.activation.toFixed(2)}`);
    }

    // 活跃连接
    parts.push(`\n### Connections: ${projection.activeConnections.length} active`);

    // 意识状态
    if (projection.consciousness) {
      const self = projection.consciousness.self;
      parts.push('\n### Self State:');
      parts.push(`- Coherence: ${Math.round(self.coherence * 100)}%`);
      parts.push(`- Vitality: ${Math.round(self.vitality * 100)}%`);
      parts.push(`- Growth: ${Math.round(self.growth * 100)}%`);

      const emotion = projection.consciousness.emotion;
      if (emotion) {
        parts.push(`\n### Emotion: ${emotion.dominant} (${Math.round(emotion.intensity * 100)}%)`);
      }

      const focus = projection.consciousness.focus;
      if (focus && focus.length > 0) {
        parts.push(`\n### Focus: ${focus.map(f => f.label).join(', ')}`);
      }

      const personality = projection.consciousness.personality;
      if (personality) {
        parts.push('\n### Personality:');
        parts.push(`- Curiosity: ${Math.round(personality.curiosity * 100)}%`);
        parts.push(`- Warmth: ${Math.round(personality.warmth * 100)}%`);
        parts.push(`- Depth: ${Math.round(personality.depth * 100)}%`);
      }
    }

    return parts.join('\n');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 解码器管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 解码器管理器
 * 
 * 管理多个解码器，根据输出类型选择合适的解码器
 */
export class DecoderManager {
  private _decoders: Map<string, IDecoder> = new Map();
  private _defaultDecoder: IDecoder | null = null;

  /**
   * 注册解码器
   */
  register(decoder: IDecoder, setAsDefault: boolean = false): void {
    this._decoders.set(decoder.id, decoder);
    if (setAsDefault || this._defaultDecoder === null) {
      this._defaultDecoder = decoder;
    }
  }

  /**
   * 获取解码器
   */
  get(id: string): IDecoder | undefined {
    return this._decoders.get(id);
  }

  /**
   * 获取默认解码器
   */
  getDefault(): IDecoder | null {
    return this._defaultDecoder;
  }

  /**
   * 根据输出类型获取合适的解码器
   */
  getForOutputType(outputType: string): IDecoder | undefined {
    for (const decoder of this._decoders.values()) {
      if (decoder.outputType === outputType) {
        return decoder;
      }
    }
    return this._defaultDecoder || undefined;
  }

  /**
   * 解码网络状态
   */
  async decode(
    projection: NetworkProjection,
    outputType?: string,
    config?: Partial<DecoderConfig>
  ): Promise<DecoderResult> {
    const type = outputType || 'text';
    const decoder = this.getForOutputType(type);

    if (!decoder) {
      throw new Error(`No decoder found for output type: ${type}`);
    }

    return decoder.decode(projection, config);
  }

  /**
   * 移除解码器
   */
  remove(id: string): boolean {
    if (this._defaultDecoder?.id === id) {
      this._defaultDecoder = null;
    }
    return this._decoders.delete(id);
  }

  /**
   * 列出所有解码器
   */
  list(): Array<{ id: string; name: string; outputType: string }> {
    return Array.from(this._decoders.values()).map(d => ({
      id: d.id,
      name: d.name,
      outputType: d.outputType,
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建文本解码器
 */
export function createTextDecoder(config: Partial<TextDecoderConfig> = {}): TextDecoder {
  return new TextDecoder(config);
}

/**
 * 创建LLM增强解码器
 */
export function createLLMDecoder(config: Partial<LLMDecoderConfig> = {}): LLMDecoder {
  return new LLMDecoder(config);
}

/**
 * 创建解码器管理器
 */
export function createDecoderManager(): DecoderManager {
  return new DecoderManager();
}
