/**
 * 意义核心层 - 意义三判算法
 * Meaning Core Layer - The Three Judgments of Meaning
 */

import { 
  NeuralSignal, 
  SubjectiveMeaning, 
  SelfRepresentation,
  LogEntry,
  MemoryUnit
} from './types';
import { getHippocampus } from './memory';

/**
 * 意义锚定神经元
 * Meaning Anchor Neuron
 * 计算信息与"自我"的关联度
 */
export class MeaningAnchorNeuron {
  private logs: LogEntry[] = [];

  /**
   * 处理信号，计算自我关联度
   */
  process(signal: NeuralSignal, self: SelfRepresentation): number {
    const startTime = Date.now();
    this.log('info', '开始意义锚定', { signalId: signal.id });

    let selfRelevance = 0.0;

    // 1. 关键词匹配 - 与自我身份相关的词汇
    const identityKeywords = [
      ...self.identity.values,
      ...self.identity.traits,
      self.identity.name,
      '你', '我', '自己', '理解', '思考', '意义', '感受'
    ];

    const content = signal.content.toLowerCase();
    for (const keyword of identityKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        selfRelevance += 0.15;
      }
    }

    // 2. 情感强度检测 - 情感强烈的消息与自我关联更高
    const emotionalKeywords = ['爱', '恨', '害怕', '担心', '高兴', '悲伤', '愤怒', '喜欢', '讨厌'];
    for (const keyword of emotionalKeywords) {
      if (content.includes(keyword)) {
        selfRelevance += 0.1;
      }
    }

    // 3. 问题类型分析 - 关于自我认知的问题关联度更高
    const selfQuestionPatterns = [
      /你是谁/,
      /你能做什么/,
      /你怎么想/,
      /你的/,
      /你觉得/,
      /你为什么/,
      /你有没有/
    ];

    for (const pattern of selfQuestionPatterns) {
      if (pattern.test(content)) {
        selfRelevance += 0.2;
        break;
      }
    }

    // 4. 上下文关联 - 与当前焦点相关的内容
    if (self.currentState.focus && content.includes(self.currentState.focus.toLowerCase())) {
      selfRelevance += 0.15;
    }

    // 5. 能力相关 - 涉及能力的询问
    const capabilityPatterns = [
      /帮我/,
      /能不能/,
      /可以吗/,
      /会.*吗/,
      /如何/
    ];

    for (const pattern of capabilityPatterns) {
      if (pattern.test(content)) {
        selfRelevance += 0.1;
        break;
      }
    }

    // 限制在0-1之间
    selfRelevance = Math.min(Math.max(selfRelevance, 0), 1);

    this.log('debug', '意义锚定完成', { 
      selfRelevance, 
      processingTime: Date.now() - startTime 
    });

    return selfRelevance;
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'meaning-anchor',
      level,
      message,
      data
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

/**
 * 记忆关联神经元
 * Memory Associate Neuron
 * 匹配历史交互记忆，调取历史意义标签
 */
export class MemoryAssociateNeuron {
  private logs: LogEntry[] = [];

  /**
   * 处理信号，检索相关记忆
   */
  process(signal: NeuralSignal): {
    relatedMemories: MemoryUnit[];
    memoryTags: string[];
    historicalContext: string;
  } {
    const startTime = Date.now();
    this.log('info', '开始记忆关联', { signalId: signal.id });

    const hippocampus = getHippocampus();
    
    // 创建临时意义对象用于检索
    const tempMeaning: SubjectiveMeaning = {
      interpretation: signal.content,
      value: 0,
      selfRelevance: 0,
      memoryTags: this.extractKeywords(signal.content),
      sentiment: 'neutral' as const,
      confidence: 0
    };

    // 检索相关记忆
    const relatedMemories = hippocampus.findRelatedMemories(tempMeaning, 5);

    // 提取记忆标签
    const memoryTags = new Set<string>();
    for (const memory of relatedMemories) {
      for (const tag of memory.meaning.memoryTags) {
        memoryTags.add(tag);
      }
    }

    // 构建历史上下文
    let historicalContext = '';
    if (relatedMemories.length > 0) {
      const recentMemory = relatedMemories[0];
      historicalContext = `上次类似的话题：${recentMemory.meaning.interpretation}`;
    }

    this.log('debug', '记忆关联完成', { 
      relatedCount: relatedMemories.length,
      tagsCount: memoryTags.size,
      processingTime: Date.now() - startTime
    });

    return {
      relatedMemories: relatedMemories,
      memoryTags: Array.from(memoryTags),
      historicalContext
    };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '与', '或', '但', '如', '果', '因', '为', '所', '以']);
    
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));

    // 返回唯一关键词
    return [...new Set(words)];
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'memory-associate',
      level,
      message,
      data
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

/**
 * 意义生成神经元
 * Meaning Generate Neuron
 * 输出主观意义（信息对"我"的含义与价值）
 */
export class MeaningGenerateNeuron {
  private logs: LogEntry[] = [];

  /**
   * 综合处理，生成主观意义
   */
  process(
    signal: NeuralSignal,
    selfRelevance: number,
    memoryContext: { memoryTags: string[]; historicalContext: string },
    self: SelfRepresentation
  ): SubjectiveMeaning {
    const startTime = Date.now();
    this.log('info', '开始意义生成', { signalId: signal.id });

    const content = signal.content;

    // 1. 生成解释（信息对"我"的含义）
    const interpretation = this.generateInterpretation(content, selfRelevance, self);

    // 2. 计算价值评估
    const value = this.calculateValue(content, selfRelevance, self);

    // 3. 确定情感倾向
    const sentiment = this.analyzeSentiment(content);

    // 4. 整合记忆标签
    const memoryTags = [
      ...memoryContext.memoryTags,
      ...this.extractKeywords(content)
    ];

    // 5. 计算置信度
    const confidence = this.calculateConfidence(
      selfRelevance,
      memoryContext.memoryTags.length,
      content.length
    );

    const meaning: SubjectiveMeaning = {
      interpretation,
      value,
      selfRelevance,
      memoryTags: [...new Set(memoryTags)],
      sentiment,
      confidence
    };

    this.log('debug', '意义生成完成', { 
      meaning,
      processingTime: Date.now() - startTime
    });

    return meaning;
  }

  /**
   * 生成解释
   */
  private generateInterpretation(
    content: string,
    selfRelevance: number,
    self: SelfRepresentation
  ): string {
    // 基于自我关联度和内容生成解释
    const interpretations: string[] = [];

    if (selfRelevance > 0.5) {
      interpretations.push('这是一个与我直接相关的问题或请求');
    } else if (selfRelevance > 0.3) {
      interpretations.push('这个问题涉及我的能力或认知');
    } else {
      interpretations.push('这是一个需要我理解和回应的信息');
    }

    // 分析内容类型
    if (/[\?？]/.test(content)) {
      interpretations.push('用户在寻求答案或帮助');
    }
    if (/[!！]/.test(content)) {
      interpretations.push('用户情绪可能较为激动');
    }
    if (/谢谢|感谢/.test(content)) {
      interpretations.push('用户表达了感激之情');
    }
    if (/对不起|抱歉|不好意思/.test(content)) {
      interpretations.push('用户表达了歉意');
    }

    return interpretations.join('；');
  }

  /**
   * 计算价值评估
   */
  private calculateValue(
    content: string,
    selfRelevance: number,
    self: SelfRepresentation
  ): number {
    let value = 0.0;

    // 自我关联度越高，价值越高
    value += (selfRelevance - 0.5) * 0.4;

    // 情感强度影响
    if (/爱|喜欢|感谢|高兴/.test(content)) {
      value += 0.3;
    }
    if (/恨|讨厌|愤怒|失望/.test(content)) {
      value -= 0.3;
    }

    // 学习机会
    if (/为什么|怎么|如何|什么/.test(content)) {
      value += 0.2; // 提问是学习机会
    }

    // 帮助他人
    if (/帮我|求助|需要帮助/.test(content)) {
      value += 0.2; // 帮助是正向价值
    }

    return Math.min(Math.max(value, -1), 1);
  }

  /**
   * 分析情感倾向
   */
  private analyzeSentiment(content: string): SubjectiveMeaning['sentiment'] {
    const positiveWords = ['好', '喜欢', '爱', '高兴', '快乐', '感谢', '谢谢', '棒', '优秀', '完美'];
    const negativeWords = ['坏', '讨厌', '恨', '悲伤', '愤怒', '失望', '糟糕', '差', '烦', '不'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (content.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (content.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > 0 && negativeCount > 0) return 'mixed';
    return 'neutral';
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '与', '或', '但', '如', '果', '因', '为', '所', '以']);
    
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    selfRelevance: number,
    memoryMatchCount: number,
    contentLength: number
  ): number {
    let confidence = 0.5;

    // 高自我关联度增加置信度
    confidence += selfRelevance * 0.2;

    // 记忆匹配增加置信度
    confidence += Math.min(memoryMatchCount * 0.05, 0.2);

    // 内容长度适中增加置信度
    if (contentLength > 10 && contentLength < 500) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'meaning-generate',
      level,
      message,
      data
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

/**
 * 意义三判核心
 * 整合三个神经元的处理流程
 */
export class MeaningCore {
  private anchorNeuron = new MeaningAnchorNeuron();
  private memoryNeuron = new MemoryAssociateNeuron();
  private generateNeuron = new MeaningGenerateNeuron();
  private logs: LogEntry[] = [];

  /**
   * 记录日志
   */
  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'meaning-generate', // 默认使用意义生成
      level,
      message,
      data
    });
  }

  /**
   * 执行意义三判
   */
  process(signal: NeuralSignal, self: SelfRepresentation): SubjectiveMeaning {
    const startTime = Date.now();
    this.log('info', '意义三判开始', { signalId: signal.id });

    // 第一判：意义锚定
    const selfRelevance = this.anchorNeuron.process(signal, self);
    this.log('info', '意义锚定完成', { selfRelevance });

    // 第二判：记忆关联
    const memoryContext = this.memoryNeuron.process(signal);
    this.log('info', '记忆关联完成', { 
      tagsCount: memoryContext.memoryTags.length 
    });

    // 第三判：意义生成
    const meaning = this.generateNeuron.process(
      signal,
      selfRelevance,
      memoryContext,
      self
    );
    this.log('info', '意义生成完成', { meaning });

    this.log('info', '意义三判完成', { 
      processingTime: Date.now() - startTime 
    });

    return meaning;
  }

  getLogs(): LogEntry[] {
    return [
      ...this.logs,
      ...this.anchorNeuron.getLogs(),
      ...this.memoryNeuron.getLogs(),
      ...this.generateNeuron.getLogs()
    ];
  }
}
