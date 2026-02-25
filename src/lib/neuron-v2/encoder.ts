/**
 * ═══════════════════════════════════════════════════════════════════════
 * 编码器：信号到影响的转换
 * Encoder: Signal to Influence Conversion
 * 
 * 本质：
 * - 编码器不是"信息处理器"
 * - 编码器是"模态接口"
 * - 大模型作为编码器，负责将外部信号转换为网络可理解的影响模式
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  InfluencePattern,
  EncoderConfig,
} from './types';
import { Influence } from './influence';

// ─────────────────────────────────────────────────────────────────────
// 编码器结果
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码器结果
 * 
 * 使用实际的Influence类实例
 */
export interface EncoderResult {
  influence: Influence;
  metadata?: Record<string, unknown>;
  labels?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 编码器接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码器接口
 * 
 * 将外部信号转换为网络可处理的影响
 */
export interface IEncoder<TSignal = unknown> {
  /**
   * 编码器ID
   */
  readonly id: string;

  /**
   * 编码器名称
   */
  readonly name: string;

  /**
   * 支持的信号类型
   */
  readonly supportedSignalTypes: string[];

  /**
   * 编码信号
   * 
   * @param signal 外部信号
   * @param config 编码配置
   * @returns 编码结果
   */
  encode(signal: TSignal, config?: Partial<EncoderConfig>): Promise<EncoderResult>;
}

// ─────────────────────────────────────────────────────────────────────
// 文本编码器实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 文本编码器配置
 */
export interface TextEncoderConfig extends EncoderConfig {
  /**
   * 影响模式维度
   */
  patternDimension?: number;

  /**
   * 默认影响强度
   */
  defaultIntensity?: number;

  /**
   * 默认影响类型
   */
  defaultType?: 'activate' | 'inhibit' | 'modulate';

  /**
   * 编码模式
   * - semantic: 语义编码（提取语义特征）
   * - emotional: 情感编码（提取情感特征）
   * - conceptual: 概念编码（提取概念特征）
   * - comprehensive: 综合编码（全面分析）
   */
  encodingMode?: 'semantic' | 'emotional' | 'conceptual' | 'comprehensive';
}

/**
 * 文本编码器
 * 
 * 使用LLM将文本转换为影响模式
 */
export class TextEncoder implements IEncoder<string> {
  readonly id: string;
  readonly name: string = 'TextEncoder';
  readonly supportedSignalTypes: string[] = ['text', 'string'];

  private _config: TextEncoderConfig;

  constructor(config: Partial<TextEncoderConfig> = {}) {
    this.id = `text-encoder-${Date.now()}`;
    this._config = {
      patternDimension: 768,
      defaultIntensity: 1.0,
      defaultType: 'activate',
      encodingMode: 'comprehensive',
      ...config,
    };
  }

  /**
   * 编码文本
   */
  async encode(text: string, config?: Partial<TextEncoderConfig>): Promise<EncoderResult> {
    const startTime = Date.now();
    const mergedConfig = { ...this._config, ...config };

    try {
      // 生成影响模式
      const pattern = await this.generatePattern(text, mergedConfig);

      // 创建影响
      const influence = this.createInfluence(pattern, text, mergedConfig);

      // 生成标签
      const labels = this.generateLabels(text, mergedConfig);

      return {
        influence,
        metadata: {
          encodingMode: mergedConfig.encodingMode,
          patternDimension: mergedConfig.patternDimension,
          processingTime: Date.now() - startTime,
        },
        labels,
      };
    } catch (error) {
      throw new Error(`Text encoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 生成影响模式
   * 
   * 使用简化的特征提取方法生成模式向量
   */
  private async generatePattern(text: string, config: TextEncoderConfig): Promise<InfluencePattern> {
    const dimension = config.patternDimension || 768;
    const mode = config.encodingMode || 'comprehensive';

    // 基于文本特征生成模式向量
    const pattern = new Array(dimension).fill(0);

    // 文本基本特征
    const textFeatures = this.extractTextFeatures(text);

    // 根据编码模式调整权重
    for (let i = 0; i < dimension; i++) {
      // 使用文本特征和位置生成模式值
      const featureIndex = i % Object.keys(textFeatures).length;
      const featureValue = Object.values(textFeatures)[featureIndex] || 0;
      
      // 添加位置相关的变化
      const positionFactor = Math.sin(i / dimension * Math.PI * 2) * 0.5 + 0.5;
      
      // 根据编码模式调整
      switch (mode) {
        case 'semantic':
          pattern[i] = featureValue * positionFactor;
          break;
        case 'emotional':
          pattern[i] = featureValue * positionFactor * textFeatures.sentimentScore;
          break;
        case 'conceptual':
          pattern[i] = featureValue * positionFactor * textFeatures.conceptDensity;
          break;
        case 'comprehensive':
        default:
          pattern[i] = featureValue * positionFactor;
      }
    }

    // 归一化
    const magnitude = Math.sqrt(pattern.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < pattern.length; i++) {
        pattern[i] /= magnitude;
      }
    }

    return pattern;
  }

  /**
   * 提取文本特征
   */
  private extractTextFeatures(text: string): Record<string, number> {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // 词频特征
    const wordFrequency: Record<string, number> = {};
    for (const word of words) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }

    // 情感词汇（简化版）
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful', 'best', 'beautiful', 'joy', 'peace'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'hate', 'worst', 'ugly', 'pain', 'fear', 'anger'];

    let sentimentScore = 0;
    for (const word of words) {
      if (positiveWords.includes(word)) sentimentScore += 0.1;
      if (negativeWords.includes(word)) sentimentScore -= 0.1;
    }
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

    // 概念密度（基于词的多样性）
    const uniqueWords = new Set(words);
    const conceptDensity = words.length > 0 ? uniqueWords.size / words.length : 0;

    // 文本复杂度
    const avgWordLength = words.length > 0 
      ? words.reduce((sum, w) => sum + w.length, 0) / words.length 
      : 0;
    const avgSentenceLength = sentences.length > 0 
      ? sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(w => w.length > 0).length, 0) / sentences.length 
      : 0;

    return {
      length: Math.min(1, text.length / 1000),
      wordCount: Math.min(1, words.length / 200),
      sentenceCount: Math.min(1, sentences.length / 20),
      uniqueWordRatio: conceptDensity,
      avgWordLength: avgWordLength / 10,
      avgSentenceLength: Math.min(1, avgSentenceLength / 20),
      sentimentScore: (sentimentScore + 1) / 2, // 归一化到 [0, 1]
      conceptDensity,
      questionMark: text.includes('?') ? 1 : 0,
      exclamationMark: text.includes('!') ? 1 : 0,
    };
  }

  /**
   * 创建影响
   */
  private createInfluence(
    pattern: InfluencePattern,
    text: string,
    config: TextEncoderConfig
  ): Influence {
    return new Influence({
      pattern,
      patternLabel: text.slice(0, 50),
      type: config.defaultType || 'activate',
      intensity: config.defaultIntensity || 1.0,
      source: 'external',
      originalSignal: text,
    });
  }

  /**
   * 生成标签
   */
  private generateLabels(text: string, config: TextEncoderConfig): string[] {
    const labels: string[] = [];
    const lowerText = text.toLowerCase();

    // 基于关键词生成标签
    const keywordCategories: Record<string, string[]> = {
      'question': ['what', 'why', 'how', 'when', 'where', 'who', '?'],
      'emotion': ['feel', 'happy', 'sad', 'love', 'hate', 'fear', 'joy'],
      'concept': ['think', 'believe', 'understand', 'know', 'idea', 'concept'],
      'action': ['do', 'make', 'create', 'build', 'write', 'run'],
      'time': ['today', 'tomorrow', 'yesterday', 'now', 'later', 'soon'],
    };

    for (const [category, keywords] of Object.entries(keywordCategories)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        labels.push(category);
      }
    }

    // 添加编码模式作为标签
    labels.push(`mode:${config.encodingMode || 'comprehensive'}`);

    return labels;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TextEncoderConfig>): void {
    this._config = { ...this._config, ...config };
  }
}

// ─────────────────────────────────────────────────────────────────────
// LLM增强编码器
// ─────────────────────────────────────────────────────────────────────

/**
 * LLM增强编码器配置
 */
export interface LLMEncoderConfig extends TextEncoderConfig {
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
 * LLM增强文本编码器
 * 
 * 使用LLM进行更深入的语义编码
 */
export class LLMEncoder extends TextEncoder {
  private _llmConfig: LLMEncoderConfig;

  constructor(config: Partial<LLMEncoderConfig> = {}) {
    super(config);
    this._llmConfig = {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
      thinking: false,
      ...config,
    };
  }

  /**
   * 使用LLM生成影响模式
   * 
   * 注意：此方法需要后端调用
   */
  async encodeWithLLM(
    text: string, 
    llmClient: {
      invoke: (messages: Array<{role: string; content: string}>, config?: Record<string, unknown>) => Promise<{content: string}>
    },
    config?: Partial<LLMEncoderConfig>
  ): Promise<EncoderResult> {
    const startTime = Date.now();
    const mergedConfig = { ...this._llmConfig, ...config };

    try {
      // 构建提示词
      const systemPrompt = this.buildSystemPrompt(mergedConfig);
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ];

      // 调用LLM
      const response = await llmClient.invoke(messages, {
        model: mergedConfig.model,
        temperature: mergedConfig.temperature,
      });

      // 解析LLM响应，提取特征
      const pattern = this.parseLLMResponse(response.content, mergedConfig);

      // 创建影响
      const influence = new Influence({
        pattern,
        patternLabel: text.slice(0, 50),
        type: mergedConfig.defaultType || 'activate',
        intensity: mergedConfig.defaultIntensity || 1.0,
        source: 'external',
        originalSignal: text,
      });

      return {
        influence,
        metadata: {
          encodingMode: mergedConfig.encodingMode,
          patternDimension: mergedConfig.patternDimension,
          processingTime: Date.now() - startTime,
          llmResponse: response.content,
        },
        labels: this.extractLabelsFromLLMResponse(response.content),
      };
    } catch (error) {
      // 回退到基础编码
      console.warn('LLM encoding failed, falling back to basic encoding:', error);
      return this.encode(text, config);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(config: LLMEncoderConfig): string {
    const mode = config.encodingMode || 'comprehensive';
    
    const modeDescriptions: Record<string, string> = {
      semantic: 'Focus on extracting semantic meaning and conceptual relationships.',
      emotional: 'Focus on emotional content, sentiment, and affective meaning.',
      conceptual: 'Focus on abstract concepts, ideas, and logical structures.',
      comprehensive: 'Analyze all aspects: semantic, emotional, and conceptual.',
    };

    return `You are a neural pattern encoder. Your task is to analyze the input text and output a JSON object with the following structure:

{
  "keywords": ["keyword1", "keyword2", ...],
  "concepts": ["concept1", "concept2", ...],
  "emotions": ["emotion1", "emotion2", ...],
  "intensity": 0.0-1.0,
  "sentiment": "positive" | "negative" | "neutral",
  "complexity": 0.0-1.0,
  "themes": ["theme1", "theme2", ...],
  "summary": "Brief summary of the text"
}

${modeDescriptions[mode]}

Be precise and analytical. Output only the JSON object.`;
  }

  /**
   * 解析LLM响应
   */
  private parseLLMResponse(response: string, config: LLMEncoderConfig): InfluencePattern {
    const dimension = config.patternDimension || 768;
    const pattern = new Array(dimension).fill(0);

    try {
      // 尝试解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // 基于解析结果生成模式
        const features = [
          parsed.intensity || 0.5,
          parsed.complexity || 0.5,
          parsed.sentiment === 'positive' ? 0.8 : parsed.sentiment === 'negative' ? 0.2 : 0.5,
          (parsed.keywords?.length || 0) / 10,
          (parsed.concepts?.length || 0) / 10,
          (parsed.emotions?.length || 0) / 5,
          (parsed.themes?.length || 0) / 5,
        ];

        // 将特征扩展到整个维度
        for (let i = 0; i < dimension; i++) {
          const featureIndex = i % features.length;
          const positionFactor = Math.sin(i / dimension * Math.PI * 4) * 0.3 + 0.7;
          pattern[i] = features[featureIndex] * positionFactor;
        }
      }
    } catch {
      // 如果解析失败，使用默认模式
      for (let i = 0; i < dimension; i++) {
        pattern[i] = Math.sin(i / dimension * Math.PI * 2) * 0.5 + 0.5;
      }
    }

    // 归一化
    const magnitude = Math.sqrt(pattern.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < pattern.length; i++) {
        pattern[i] /= magnitude;
      }
    }

    return pattern;
  }

  /**
   * 从LLM响应提取标签
   */
  private extractLabelsFromLLMResponse(response: string): string[] {
    const labels: string[] = [];

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.keywords) labels.push(...parsed.keywords.slice(0, 5));
        if (parsed.concepts) labels.push(...parsed.concepts.slice(0, 3));
        if (parsed.emotions) labels.push(...parsed.emotions.slice(0, 3));
        if (parsed.themes) labels.push(...parsed.themes.slice(0, 3));
        if (parsed.sentiment) labels.push(`sentiment:${parsed.sentiment}`);
      }
    } catch {
      // 忽略解析错误
    }

    return [...new Set(labels)]; // 去重
  }
}

// ─────────────────────────────────────────────────────────────────────
// 编码器管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码器管理器
 * 
 * 管理多个编码器，根据信号类型选择合适的编码器
 */
export class EncoderManager {
  private _encoders: Map<string, IEncoder> = new Map();
  private _defaultEncoder: IEncoder | null = null;

  /**
   * 注册编码器
   */
  register(encoder: IEncoder, setAsDefault: boolean = false): void {
    this._encoders.set(encoder.id, encoder);
    if (setAsDefault || this._defaultEncoder === null) {
      this._defaultEncoder = encoder;
    }
  }

  /**
   * 获取编码器
   */
  get(id: string): IEncoder | undefined {
    return this._encoders.get(id);
  }

  /**
   * 获取默认编码器
   */
  getDefault(): IEncoder | null {
    return this._defaultEncoder;
  }

  /**
   * 根据信号类型获取合适的编码器
   */
  getForSignalType(signalType: string): IEncoder | undefined {
    for (const encoder of this._encoders.values()) {
      if (encoder.supportedSignalTypes.includes(signalType)) {
        return encoder;
      }
    }
    return this._defaultEncoder || undefined;
  }

  /**
   * 编码信号
   */
  async encode(signal: unknown, signalType?: string, config?: Partial<EncoderConfig>): Promise<EncoderResult> {
    const type = signalType || typeof signal;
    const encoder = this.getForSignalType(type);

    if (!encoder) {
      throw new Error(`No encoder found for signal type: ${type}`);
    }

    return encoder.encode(signal as string, config);
  }

  /**
   * 移除编码器
   */
  remove(id: string): boolean {
    if (this._defaultEncoder?.id === id) {
      this._defaultEncoder = null;
    }
    return this._encoders.delete(id);
  }

  /**
   * 列出所有编码器
   */
  list(): Array<{ id: string; name: string; types: string[] }> {
    return Array.from(this._encoders.values()).map(e => ({
      id: e.id,
      name: e.name,
      types: e.supportedSignalTypes,
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建文本编码器
 */
export function createTextEncoder(config: Partial<TextEncoderConfig> = {}): TextEncoder {
  return new TextEncoder(config);
}

/**
 * 创建LLM增强编码器
 */
export function createLLMEncoder(config: Partial<LLMEncoderConfig> = {}): LLMEncoder {
  return new LLMEncoder(config);
}

/**
 * 创建编码器管理器
 */
export function createEncoderManager(): EncoderManager {
  return new EncoderManager();
}
