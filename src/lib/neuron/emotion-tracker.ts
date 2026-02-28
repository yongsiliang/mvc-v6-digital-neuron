/**
 * 情绪追踪系统
 * 
 * 长期追踪用户情绪变化
 * 
 * 能力：
 * 1. 分析用户输入的情绪
 * 2. 记录情绪历史
 * 3. 检测情绪模式
 * 4. 响应用户情绪状态
 */

import { getLLMClient } from './multi-model-llm';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 情绪类型
 */
export type EmotionType = 
  | 'joy'       // 喜悦
  | 'sadness'   // 悲伤
  | 'anger'     // 愤怒
  | 'fear'      // 恐惧
  | 'surprise'  // 惊讶
  | 'disgust'   // 厌恶
  | 'neutral';  // 中性

/**
 * 情绪记录
 */
export interface EmotionRecord {
  /** 情绪类型 */
  type: EmotionType;
  /** 强度 (0-1) */
  intensity: number;
  /** 时间戳 */
  timestamp: number;
  /** 触发内容（用户输入的摘要） */
  trigger: string;
  /** 会话ID */
  sessionId: string;
}

/**
 * 情绪模式
 */
export interface EmotionPattern {
  /** 模式名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 最近出现时间 */
  lastSeen: number;
  /** 出现频率 */
  frequency: number;
}

/**
 * 情绪统计
 */
export interface EmotionStats {
  /** 主导情绪 */
  dominantEmotion: EmotionType;
  /** 情绪分布 */
  distribution: Record<EmotionType, number>;
  /** 平均强度 */
  averageIntensity: number;
  /** 情绪波动性 */
  volatility: number;
  /** 检测到的模式 */
  patterns: EmotionPattern[];
  /** 趋势：改善/恶化/稳定 */
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * 情绪追踪器
 */
export class EmotionTracker {
  /** 情绪历史 */
  private history: EmotionRecord[] = [];
  
  /** LLM客户端 */
  private llm = getLLMClient();
  
  /** 数据库客户端 */
  private supabase = getSupabaseClient();
  
  /** 最大历史记录数 */
  private maxHistory = 1000;
  
  constructor() {
    this.loadHistory();
  }
  
  /**
   * 分析并记录情绪
   */
  async track(input: string, sessionId: string): Promise<EmotionRecord> {
    // 分析情绪
    const emotion = await this.analyzeEmotion(input);
    
    // 创建记录
    const record: EmotionRecord = {
      ...emotion,
      timestamp: Date.now(),
      trigger: input.slice(0, 50),
      sessionId,
    };
    
    // 添加到历史
    this.history.push(record);
    
    // 限制历史大小
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    
    // 异步保存
    this.saveRecord(record).catch(() => {});
    
    return record;
  }
  
  /**
   * 分析情绪
   */
  private async analyzeEmotion(input: string): Promise<{
    type: EmotionType;
    intensity: number;
  }> {
    // 快速情绪检测（基于关键词）
    const quickResult = this.quickEmotionDetect(input);
    
    if (quickResult.confidence > 0.8) {
      return {
        type: quickResult.type,
        intensity: quickResult.intensity,
      };
    }
    
    // 深度分析（使用LLM）
    try {
      const prompt = `分析以下文本的情绪。只返回JSON格式：{"type":"joy|sadness|anger|fear|surprise|disgust|neutral","intensity":0.0-1.0}

文本：${input}`;

      const response = await this.llm.invoke([
        { role: 'system', content: '你是一个情绪分析专家。' },
        { role: 'user', content: prompt }
      ], { strategy: 'fastest' });
      
      const match = response.match(/\{[^}]+\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          type: this.validateEmotionType(parsed.type),
          intensity: Math.max(0, Math.min(1, parsed.intensity || 0.5)),
        };
      }
    } catch {
      // 降级
    }
    
    return {
      type: quickResult.type,
      intensity: quickResult.intensity,
    };
  }
  
  /**
   * 快速情绪检测（基于关键词）
   */
  private quickEmotionDetect(input: string): {
    type: EmotionType;
    intensity: number;
    confidence: number;
  } {
    const text = input.toLowerCase();
    
    // 情绪关键词
    const patterns: Array<{
      type: EmotionType;
      keywords: string[];
      intensity: number;
    }> = [
      {
        type: 'joy',
        keywords: ['开心', '高兴', '哈哈', '嘻嘻', '太好', '棒', '喜欢', '爱', 'happy', 'love', 'great', 'awesome', '😊', '😄', '🎉'],
        intensity: 0.7,
      },
      {
        type: 'sadness',
        keywords: ['难过', '伤心', '悲伤', '哭', '痛苦', '失望', 'sad', 'cry', 'miss', '😢', '😭', '💔'],
        intensity: 0.7,
      },
      {
        type: 'anger',
        keywords: ['生气', '愤怒', '讨厌', '烦', '气死', '可恶', 'angry', 'hate', 'damn', '😤', '😡'],
        intensity: 0.8,
      },
      {
        type: 'fear',
        keywords: ['害怕', '担心', '恐惧', '紧张', '焦虑', '怕', 'afraid', 'scared', 'worried', '😰', '😨'],
        intensity: 0.6,
      },
      {
        type: 'surprise',
        keywords: ['哇', '天哪', '没想到', '意外', '惊讶', 'wow', 'surprise', 'amazing', '😲', '🤯'],
        intensity: 0.7,
      },
      {
        type: 'disgust',
        keywords: ['恶心', '厌恶', '讨厌', '吐', 'disgust', 'yuck', '🤢', '🤮'],
        intensity: 0.6,
      },
    ];
    
    // 匹配关键词
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword)) {
          return {
            type: pattern.type,
            intensity: pattern.intensity,
            confidence: 0.9,
          };
        }
      }
    }
    
    // 默认中性
    return {
      type: 'neutral',
      intensity: 0.3,
      confidence: 0.5,
    };
  }
  
  /**
   * 获取情绪统计
   */
  getStats(timeRange?: { start: number; end: number }): EmotionStats {
    let records = this.history;
    
    if (timeRange) {
      records = records.filter(r => 
        r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
      );
    }
    
    if (records.length === 0) {
      return {
        dominantEmotion: 'neutral',
        distribution: this.emptyDistribution(),
        averageIntensity: 0,
        volatility: 0,
        patterns: [],
        trend: 'stable',
      };
    }
    
    // 计算分布
    const distribution = this.emptyDistribution();
    for (const record of records) {
      distribution[record.type]++;
    }
    
    // 归一化
    const total = records.length;
    for (const key of Object.keys(distribution) as EmotionType[]) {
      distribution[key] /= total;
    }
    
    // 找主导情绪
    let dominantEmotion: EmotionType = 'neutral';
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion as EmotionType;
      }
    }
    
    // 计算平均强度
    const averageIntensity = records.reduce((sum, r) => sum + r.intensity, 0) / records.length;
    
    // 计算波动性
    const volatility = this.calculateVolatility(records);
    
    // 检测模式
    const patterns = this.detectPatterns(records);
    
    // 计算趋势
    const trend = this.calculateTrend(records);
    
    return {
      dominantEmotion,
      distribution,
      averageIntensity,
      volatility,
      patterns,
      trend,
    };
  }
  
  /**
   * 获取最近的情绪记录
   */
  getRecentRecords(limit: number = 10): EmotionRecord[] {
    return this.history.slice(-limit);
  }
  
  /**
   * 根据情绪生成响应提示
   */
  generateEmotionResponseHint(record: EmotionRecord): string {
    switch (record.type) {
      case 'joy':
        return '用户现在很开心，可以一起分享快乐，保持轻松愉快的语调。';
      case 'sadness':
        return '用户现在有些难过，需要温暖和支持，语调要温柔。';
      case 'anger':
        return '用户现在有些愤怒，要冷静、理解，不要刺激。';
      case 'fear':
        return '用户现在有些担心或害怕，需要安慰和保证。';
      case 'surprise':
        return '用户现在很惊讶，可以一起探讨这个意外。';
      case 'disgust':
        return '用户现在有些不舒服，要理解和支持。';
      default:
        return '';
    }
  }
  
  /**
   * 检测情绪异常
   */
  detectAnomaly(): { detected: boolean; type: string; description: string } {
    const recent = this.history.slice(-20);
    
    if (recent.length < 5) {
      return { detected: false, type: '', description: '' };
    }
    
    // 检测持续负面情绪
    const negativeEmotions = recent.filter(r => 
      ['sadness', 'anger', 'fear'].includes(r.type)
    );
    
    if (negativeEmotions.length > recent.length * 0.7) {
      return {
        detected: true,
        type: 'sustained-negative',
        description: '用户最近持续处于负面情绪状态，可能需要特别关注。',
      };
    }
    
    // 检测情绪剧烈波动
    const volatility = this.calculateVolatility(recent);
    if (volatility > 0.5) {
      return {
        detected: true,
        type: 'high-volatility',
        description: '用户情绪波动很大，可能处于不稳定状态。',
      };
    }
    
    return { detected: false, type: '', description: '' };
  }
  
  // ==================== 私有方法 ====================
  
  private emptyDistribution(): Record<EmotionType, number> {
    return {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0,
    };
  }
  
  private validateEmotionType(type: string): EmotionType {
    const valid: EmotionType[] = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
    return valid.includes(type as EmotionType) ? type as EmotionType : 'neutral';
  }
  
  private calculateVolatility(records: EmotionRecord[]): number {
    if (records.length < 2) return 0;
    
    let totalChange = 0;
    for (let i = 1; i < records.length; i++) {
      const change = Math.abs(records[i].intensity - records[i-1].intensity);
      totalChange += change;
    }
    
    return totalChange / (records.length - 1);
  }
  
  private detectPatterns(records: EmotionRecord[]): EmotionPattern[] {
    const patterns: EmotionPattern[] = [];
    
    // 检测模式：周末低谷
    const weekendRecords = records.filter(r => {
      const day = new Date(r.timestamp).getDay();
      return day === 0 || day === 6;
    });
    
    const weekendNegative = weekendRecords.filter(r => 
      ['sadness', 'anger'].includes(r.type)
    );
    
    if (weekendNegative.length > weekendRecords.length * 0.5 && weekendRecords.length > 3) {
      patterns.push({
        name: '周末低谷',
        description: '用户在周末容易出现负面情绪',
        lastSeen: weekendNegative[weekendNegative.length - 1].timestamp,
        frequency: weekendNegative.length / weekendRecords.length,
      });
    }
    
    return patterns;
  }
  
  private calculateTrend(records: EmotionRecord[]): 'improving' | 'worsening' | 'stable' {
    if (records.length < 5) return 'stable';
    
    const firstHalf = records.slice(0, Math.floor(records.length / 2));
    const secondHalf = records.slice(Math.floor(records.length / 2));
    
    // 防止除零错误
    if (firstHalf.length === 0 || secondHalf.length === 0) return 'stable';
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + this.emotionToValue(r.type), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + this.emotionToValue(r.type), 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'worsening';
    return 'stable';
  }
  
  private emotionToValue(type: EmotionType): number {
    const values: Record<EmotionType, number> = {
      joy: 1,
      surprise: 0.6,
      neutral: 0.5,
      fear: 0.3,
      disgust: 0.2,
      sadness: 0.1,
      anger: 0,
    };
    return values[type];
  }
  
  private async loadHistory(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('emotion_records')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(this.maxHistory);
      
      if (data) {
        this.history = data.map((row: any) => ({
          type: row.emotion_type,
          intensity: row.intensity,
          timestamp: row.timestamp,
          trigger: row.trigger,
          sessionId: row.session_id,
        })).reverse();
      }
    } catch {
      // 表不存在
    }
  }
  
  private async saveRecord(record: EmotionRecord): Promise<void> {
    try {
      await this.supabase
        .from('emotion_records')
        .insert({
          emotion_type: record.type,
          intensity: record.intensity,
          timestamp: record.timestamp,
          trigger: record.trigger,
          session_id: record.sessionId,
        });
    } catch {
      // 忽略
    }
  }
}

// 单例
let trackerInstance: EmotionTracker | null = null;

export function getEmotionTracker(): EmotionTracker {
  if (!trackerInstance) {
    trackerInstance = new EmotionTracker();
  }
  return trackerInstance;
}
