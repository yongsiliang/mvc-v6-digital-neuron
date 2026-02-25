/**
 * ═══════════════════════════════════════════════════════════════════════
 * 反馈收集器 - Feedback Collector
 * 
 * 多维反馈系统：
 * 1. 显式反馈：用户直接表达的（评分、按钮、文本）
 * 2. 隐式反馈：从用户行为推断的（停留时间、回复长度、情感变化）
 * 3. 自评估：系统内部的评估（预测准确度、一致性、效率）
 * 
 * 这些反馈被融合为"奖励信号"，驱动神经元学习
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 显式反馈
 */
export interface ExplicitFeedback {
  /** 用户评分 [1-5] */
  rating?: 1 | 2 | 3 | 4 | 5;
  
  /** 是否继续对话 */
  continued?: boolean;
  
  /** 用户是否重新表述问题（暗示回答不满意） */
  rephrased?: boolean;
  
  /** 用户是否采纳建议 */
  accepted?: boolean;
  
  /** 用户是否表达感谢 */
  thanked?: boolean;
  
  /** 用户是否表达不满 */
  complained?: boolean;
  
  /** 用户是否要求重新回答 */
  retryRequested?: boolean;
  
  /** 用户文本反馈的情感 */
  textSentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * 隐式反馈
 */
export interface ImplicitFeedback {
  /** 用户回复时间（毫秒） */
  responseTime: number;
  
  /** 用户回复长度（字符数） */
  messageLength: number;
  
  /** 话题连续性 [0-1] */
  topicContinuity: number;
  
  /** 情感变化 [-1, 1] */
  sentimentChange: number;
  
  /** 参与度评分 [0-1] */
  engagementScore: number;
  
  /** 对话深度（轮次数） */
  conversationDepth: number;
  
  /** 用户是否打断了回复 */
  interrupted?: boolean;
  
  /** 用户是否复制了回复内容 */
  copiedContent?: boolean;
}

/**
 * 系统自评估
 */
export interface SelfEvaluation {
  /** 预测准确度 [0-1] */
  predictionAccuracy: number;
  
  /** 回答一致性 [0-1] */
  coherenceScore: number;
  
  /** 新颖度 [0-1] */
  noveltyScore: number;
  
  /** 效率评分 [0-1] */
  efficiencyScore: number;
  
  /** 情感匹配度 [0-1] */
  emotionalMatch: number;
  
  /** 记忆利用率 [0-1] */
  memoryUtilization: number;
  
  /** 神经元激活熵 */
  activationEntropy: number;
}

/**
 * 完整反馈信号
 */
export interface FeedbackSignals {
  explicit: ExplicitFeedback;
  implicit: ImplicitFeedback;
  self: SelfEvaluation;
  
  /** 收集时间 */
  collectedAt: number;
  
  /** 会话ID */
  sessionId: string;
}

/**
 * 奖励信号
 */
export interface RewardSignal {
  /** 综合奖励值 [-1, 1] */
  reward: number;
  
  /** 奖励分解 */
  breakdown: {
    explicit: number;
    implicit: number;
    self: number;
  };
  
  /** 置信度 */
  confidence: number;
  
  /** 原因说明 */
  reason: string;
}

/**
 * 对话上下文（用于推断隐式反馈）
 */
export interface ConversationContext {
  /** 会话ID */
  sessionId: string;
  
  /** 之前的消息 */
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sentiment?: number;
  }>;
  
  /** 当前时间 */
  currentTime: number;
  
  /** 用户最后活跃时间 */
  lastUserActiveTime: number;
  
  /** 系统最后回复时间 */
  lastAssistantReplyTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 反馈收集器
// ─────────────────────────────────────────────────────────────────────

export class FeedbackCollector {
  private sessionHistory: Map<string, ConversationContext> = new Map();
  
  /**
   * 收集显式反馈
   */
  collectExplicitFeedback(
    userAction: {
      rating?: number;
      continued?: boolean;
      rephrased?: boolean;
      accepted?: boolean;
      thanked?: boolean;
      complained?: boolean;
      retryRequested?: boolean;
      textSentiment?: 'positive' | 'neutral' | 'negative';
    }
  ): ExplicitFeedback {
    return {
      rating: userAction.rating as 1 | 2 | 3 | 4 | 5 | undefined,
      continued: userAction.continued,
      rephrased: userAction.rephrased,
      accepted: userAction.accepted,
      thanked: userAction.thanked,
      complained: userAction.complained,
      retryRequested: userAction.retryRequested,
      textSentiment: userAction.textSentiment,
    };
  }

  /**
   * 推断隐式反馈
   */
  inferImplicitFeedback(
    context: ConversationContext,
    newUserMessage?: string
  ): ImplicitFeedback {
    const messages = context.messages;
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    
    // 1. 响应时间
    let responseTime = 30000; // 默认30秒
    if (lastAssistantMsg && context.currentTime) {
      responseTime = context.currentTime - lastAssistantMsg.timestamp;
    }
    
    // 2. 消息长度
    let messageLength = 0;
    if (newUserMessage) {
      messageLength = newUserMessage.length;
    } else if (lastUserMsg) {
      messageLength = lastUserMsg.content.length;
    }
    
    // 3. 话题连续性
    const topicContinuity = this.computeTopicContinuity(messages);
    
    // 4. 情感变化
    const sentimentChange = this.computeSentimentChange(messages);
    
    // 5. 参与度
    const engagementScore = this.computeEngagementScore(context, messageLength);
    
    // 6. 对话深度
    const conversationDepth = messages.filter(m => m.role === 'user').length;
    
    return {
      responseTime,
      messageLength,
      topicContinuity,
      sentimentChange,
      engagementScore,
      conversationDepth,
    };
  }

  /**
   * 计算系统自评估
   */
  computeSelfEvaluation(params: {
    predictionErrors: Map<string, number>;
    activations: Map<string, number>;
    responseLength: number;
    responseTime: number;
    memoryHits: number;
    memoryTotal: number;
    previousResponses: string[];
    currentResponse: string;
  }): SelfEvaluation {
    // 1. 预测准确度
    const predictionAccuracy = this.computePredictionAccuracy(params.predictionErrors);
    
    // 2. 一致性评分（与历史回答的一致性）
    const coherenceScore = this.computeCoherence(
      params.previousResponses,
      params.currentResponse
    );
    
    // 3. 新颖度
    const noveltyScore = this.computeNovelty(
      params.previousResponses,
      params.currentResponse
    );
    
    // 4. 效率评分
    const efficiencyScore = this.computeEfficiency(
      params.responseLength,
      params.responseTime
    );
    
    // 5. 情感匹配（简化版）
    const emotionalMatch = 0.7; // 默认值，实际需要情感分析
    
    // 6. 记忆利用率
    const memoryUtilization = params.memoryTotal > 0
      ? params.memoryHits / params.memoryTotal
      : 0;
    
    // 7. 激活熵
    const activationEntropy = this.computeActivationEntropy(params.activations);
    
    return {
      predictionAccuracy,
      coherenceScore,
      noveltyScore,
      efficiencyScore,
      emotionalMatch,
      memoryUtilization,
      activationEntropy,
    };
  }

  /**
   * 融合为奖励信号
   */
  computeRewardSignal(feedback: FeedbackSignals): RewardSignal {
    // 计算各维度的奖励分量
    
    // 显式奖励 [-1, 1]
    const explicitReward = this.computeExplicitReward(feedback.explicit);
    
    // 隐式奖励 [-1, 1]
    const implicitReward = this.computeImplicitReward(feedback.implicit);
    
    // 自评估奖励 [-1, 1]
    const selfReward = this.computeSelfReward(feedback.self);
    
    // 加权融合
    // 显式反馈权重最高，因为是用户直接表达的
    const weights = {
      explicit: 0.5,
      implicit: 0.3,
      self: 0.2,
    };
    
    const totalReward = 
      weights.explicit * explicitReward +
      weights.implicit * implicitReward +
      weights.self * selfReward;
    
    // 计算置信度
    const confidence = this.computeRewardConfidence(feedback);
    
    // 生成原因说明
    const reason = this.generateRewardReason(
      explicitReward,
      implicitReward,
      selfReward,
      feedback
    );
    
    return {
      reward: Math.max(-1, Math.min(1, totalReward)),
      breakdown: {
        explicit: explicitReward,
        implicit: implicitReward,
        self: selfReward,
      },
      confidence,
      reason,
    };
  }

  /**
   * 收集完整反馈
   */
  collectFeedback(
    sessionId: string,
    context: ConversationContext,
    explicit: Partial<ExplicitFeedback>,
    systemMetrics: {
      predictionErrors: Map<string, number>;
      activations: Map<string, number>;
      responseLength: number;
      responseTime: number;
      memoryHits: number;
      memoryTotal: number;
      previousResponses: string[];
      currentResponse: string;
    }
  ): FeedbackSignals {
    // 更新会话历史
    this.sessionHistory.set(sessionId, context);
    
    // 收集各类反馈
    const explicitFeedback: ExplicitFeedback = {
      ...this.collectExplicitFeedback({}),
      ...explicit,
    };
    
    const implicitFeedback = this.inferImplicitFeedback(context);
    
    const selfEvaluation = this.computeSelfEvaluation(systemMetrics);
    
    return {
      explicit: explicitFeedback,
      implicit: implicitFeedback,
      self: selfEvaluation,
      collectedAt: Date.now(),
      sessionId,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法：计算各项指标
  // ══════════════════════════════════════════════════════════════════

  /**
   * 计算话题连续性
   */
  private computeTopicContinuity(messages: ConversationContext['messages']): number {
    if (messages.length < 2) return 1.0;
    
    // 简单实现：检查最近消息是否有关键词重叠
    const recentMessages = messages.slice(-4);
    const keywords = recentMessages.map(m => this.extractKeywords(m.content));
    
    if (keywords.length < 2) return 1.0;
    
    // 计算相邻消息的关键词重叠
    let overlapSum = 0;
    for (let i = 1; i < keywords.length; i++) {
      const prev = keywords[i - 1];
      const curr = keywords[i];
      
      if (prev.size === 0 || curr.size === 0) continue;
      
      let overlap = 0;
      for (const word of curr) {
        if (prev.has(word)) overlap++;
      }
      
      overlapSum += overlap / Math.max(prev.size, curr.size);
    }
    
    return overlapSum / (keywords.length - 1);
  }

  /**
   * 计算情感变化
   */
  private computeSentimentChange(messages: ConversationContext['messages']): number {
    if (messages.length < 2) return 0;
    
    // 使用已有的情感值或简单启发式
    const sentiments = messages
      .filter(m => m.sentiment !== undefined)
      .map(m => m.sentiment!);
    
    if (sentiments.length < 2) return 0;
    
    // 最后两个情感值的差
    return sentiments[sentiments.length - 1] - sentiments[sentiments.length - 2];
  }

  /**
   * 计算参与度评分
   */
  private computeEngagementScore(
    context: ConversationContext,
    messageLength: number
  ): number {
    const messages = context.messages;
    
    // 因素1：对话长度
    const depthScore = Math.min(1, messages.length / 10);
    
    // 因素2：消息长度（用户投入）
    const lengthScore = Math.min(1, messageLength / 200);
    
    // 因素3：响应速度（太快或太慢都不好）
    const avgResponseTime = this.getAverageResponseTime(messages);
    const timingScore = this.scoreResponseTiming(avgResponseTime);
    
    return 0.4 * depthScore + 0.3 * lengthScore + 0.3 * timingScore;
  }

  /**
   * 计算预测准确度
   */
  private computePredictionAccuracy(errors: Map<string, number>): number {
    if (errors.size === 0) return 0.5;
    
    let totalError = 0;
    for (const error of errors.values()) {
      totalError += Math.abs(error);
    }
    
    const avgError = totalError / errors.size;
    
    // 误差越小，准确度越高
    return Math.max(0, 1 - avgError);
  }

  /**
   * 计算一致性评分
   */
  private computeCoherence(
    previousResponses: string[],
    currentResponse: string
  ): number {
    if (previousResponses.length === 0) return 0.8;
    
    // 简单实现：检查是否与最近回答风格一致
    const recentResponse = previousResponses[previousResponses.length - 1];
    
    // 长度一致性
    const lengthRatio = currentResponse.length / recentResponse.length;
    const lengthScore = Math.min(lengthRatio, 1 / lengthRatio);
    
    return 0.5 + 0.5 * lengthScore;
  }

  /**
   * 计算新颖度
   */
  private computeNovelty(
    previousResponses: string[],
    currentResponse: string
  ): number {
    if (previousResponses.length === 0) return 0.8;
    
    // 检查与历史回答的相似度
    const currentWords = new Set(this.extractKeywords(currentResponse));
    
    let maxSimilarity = 0;
    for (const prev of previousResponses.slice(-5)) {
      const prevWords = new Set(this.extractKeywords(prev));
      
      let overlap = 0;
      for (const word of currentWords) {
        if (prevWords.has(word)) overlap++;
      }
      
      const similarity = currentWords.size > 0
        ? overlap / currentWords.size
        : 0;
      
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    // 相似度越低，新颖度越高
    return 1 - maxSimilarity;
  }

  /**
   * 计算效率评分
   */
  private computeEfficiency(responseLength: number, responseTime: number): number {
    // 长度效率：不要太短也不要太长
    const lengthEfficiency = responseLength > 50 && responseLength < 2000 ? 1 : 0.7;
    
    // 时间效率：回复时间应该合理
    const timeEfficiency = responseTime < 10000 ? 1 : responseTime < 30000 ? 0.8 : 0.5;
    
    return 0.5 * lengthEfficiency + 0.5 * timeEfficiency;
  }

  /**
   * 计算激活熵
   */
  private computeActivationEntropy(activations: Map<string, number>): number {
    const values = Array.from(activations.values());
    if (values.length === 0) return 0;
    
    // 归一化
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;
    
    const probs = values.map(v => v / sum);
    
    // 计算熵
    let entropy = 0;
    for (const p of probs) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    // 归一化到 [0, 1]
    const maxEntropy = Math.log2(values.length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * 计算显式奖励
   */
  private computeExplicitReward(feedback: ExplicitFeedback): number {
    let reward = 0;
    
    // 评分
    if (feedback.rating !== undefined) {
      reward += (feedback.rating - 3) / 2; // [1-5] -> [-1, 1]
    }
    
    // 继续对话
    if (feedback.continued === true) reward += 0.3;
    if (feedback.continued === false) reward -= 0.3;
    
    // 采纳建议
    if (feedback.accepted === true) reward += 0.5;
    
    // 感谢
    if (feedback.thanked === true) reward += 0.4;
    
    // 不满
    if (feedback.complained === true) reward -= 0.5;
    
    // 重述问题
    if (feedback.rephrased === true) reward -= 0.3;
    
    // 重试请求
    if (feedback.retryRequested === true) reward -= 0.4;
    
    // 文本情感
    if (feedback.textSentiment === 'positive') reward += 0.3;
    if (feedback.textSentiment === 'negative') reward -= 0.3;
    
    return Math.max(-1, Math.min(1, reward));
  }

  /**
   * 计算隐式奖励
   */
  private computeImplicitReward(feedback: ImplicitFeedback): number {
    let reward = 0;
    
    // 响应时间
    // 太快(< 1秒)：可能没仔细看
    // 太慢(> 60秒)：可能没兴趣
    // 合适(5-30秒)：积极
    if (feedback.responseTime < 1000) {
      reward -= 0.1;
    } else if (feedback.responseTime < 30000) {
      reward += 0.2;
    } else if (feedback.responseTime > 60000) {
      reward -= 0.2;
    }
    
    // 消息长度
    // 长消息暗示投入
    if (feedback.messageLength > 100) {
      reward += 0.2;
    } else if (feedback.messageLength < 10) {
      reward -= 0.1;
    }
    
    // 话题连续性
    reward += (feedback.topicContinuity - 0.5) * 0.4;
    
    // 情感变化
    reward += feedback.sentimentChange * 0.3;
    
    // 参与度
    reward += (feedback.engagementScore - 0.5) * 0.4;
    
    // 对话深度
    if (feedback.conversationDepth > 5) {
      reward += 0.2;
    }
    
    // 打断
    if (feedback.interrupted) {
      reward -= 0.3;
    }
    
    // 复制内容
    if (feedback.copiedContent) {
      reward += 0.2;
    }
    
    return Math.max(-1, Math.min(1, reward));
  }

  /**
   * 计算自评估奖励
   */
  private computeSelfReward(evaluation: SelfEvaluation): number {
    // 综合各项指标
    return (
      0.25 * (evaluation.predictionAccuracy - 0.5) * 2 +
      0.2 * (evaluation.coherenceScore - 0.5) * 2 +
      0.15 * (evaluation.noveltyScore - 0.5) * 2 +
      0.15 * (evaluation.efficiencyScore - 0.5) * 2 +
      0.15 * (evaluation.emotionalMatch - 0.5) * 2 +
      0.1 * (evaluation.memoryUtilization - 0.5) * 2
    );
  }

  /**
   * 计算奖励置信度
   */
  private computeRewardConfidence(feedback: FeedbackSignals): number {
    let confidence = 0.5;
    
    // 有显式反馈时置信度更高
    if (feedback.explicit.rating !== undefined) {
      confidence += 0.3;
    }
    if (feedback.explicit.thanked || feedback.explicit.complained) {
      confidence += 0.2;
    }
    
    // 有足够的隐式数据
    if (feedback.implicit.conversationDepth > 3) {
      confidence += 0.1;
    }
    
    return Math.min(1, confidence);
  }

  /**
   * 生成奖励原因说明
   */
  private generateRewardReason(
    explicit: number,
    implicit: number,
    self: number,
    feedback: FeedbackSignals
  ): string {
    const reasons: string[] = [];
    
    if (explicit > 0.3) {
      reasons.push('用户正面反馈');
    } else if (explicit < -0.3) {
      reasons.push('用户负面反馈');
    }
    
    if (implicit > 0.2) {
      reasons.push('高参与度');
    } else if (implicit < -0.2) {
      reasons.push('低参与度');
    }
    
    if (self > 0.2) {
      reasons.push('系统表现良好');
    } else if (self < -0.2) {
      reasons.push('系统表现欠佳');
    }
    
    if (reasons.length === 0) {
      reasons.push('综合评估');
    }
    
    return reasons.join('；');
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 提取关键词（简单实现）
   */
  private extractKeywords(text: string): Set<string> {
    // 移除标点和常见停用词
    const stopWords = new Set([
      '的', '是', '在', '了', '和', '与', '或', '这', '那', '有', '我', '你',
      '他', '她', '它', '们', '吗', '呢', '吧', '啊', '哦', '嗯',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'to', 'for',
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
    
    return new Set(words);
  }

  /**
   * 获取平均响应时间
   */
  private getAverageResponseTime(messages: ConversationContext['messages']): number {
    const times: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i - 1].role === 'assistant') {
        times.push(messages[i].timestamp - messages[i - 1].timestamp);
      }
    }
    
    if (times.length === 0) return 10000;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * 评分响应时机
   */
  private scoreResponseTiming(avgTime: number): number {
    // 理想响应时间：5-15秒
    if (avgTime >= 5000 && avgTime <= 15000) return 1;
    if (avgTime >= 2000 && avgTime <= 30000) return 0.8;
    if (avgTime >= 1000 && avgTime <= 60000) return 0.6;
    return 0.4;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let feedbackCollectorInstance: FeedbackCollector | null = null;

export function getFeedbackCollector(): FeedbackCollector {
  if (!feedbackCollectorInstance) {
    feedbackCollectorInstance = new FeedbackCollector();
  }
  return feedbackCollectorInstance;
}

export function resetFeedbackCollector(): void {
  feedbackCollectorInstance = null;
}
