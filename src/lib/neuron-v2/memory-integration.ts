/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元-记忆集成服务
 * Neuron-Memory Integration Service
 * 
 * 功能：
 * - 将对话内容编码为神经元激活
 * - 从对话中提取关键信息存储为记忆
 * - 回忆相关记忆增强对话上下文
 * - 实现真正的"记忆驱动对话"
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ConversationMemory {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  summary?: string;
  keyPoints: string[];
  emotionalTone?: string;
  topics: string[];
  importance: number;
  createdAt: string;
}

export interface MemoryContext {
  relevantMemories: ConversationMemory[];
  topics: string[];
  emotionalContext: string;
  lastInteractionAt: string | null;
  interactionCount: number;
}

export interface MemoryIntegrationConfig {
  maxRelevantMemories: number;
  importanceThreshold: number;
  enableEmotionalAnalysis: boolean;
  enableTopicExtraction: boolean;
}

const DEFAULT_CONFIG: MemoryIntegrationConfig = {
  maxRelevantMemories: 5,
  importanceThreshold: 0.3,
  enableEmotionalAnalysis: true,
  enableTopicExtraction: true,
};

// ─────────────────────────────────────────────────────────────────────
// 记忆集成服务
// ─────────────────────────────────────────────────────────────────────

export class MemoryIntegrationService {
  private config: MemoryIntegrationConfig;
  private memoryApiUrl: string;
  private userId: string | null = null;

  constructor(config: Partial<MemoryIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryApiUrl = '/api/neuron/memory';
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * 记住对话
   * 
   * @param role 角色（user/assistant）
   * @param content 内容
   * @param context 上下文信息
   */
  async rememberConversation(
    role: 'user' | 'assistant',
    content: string,
    context?: {
      previousMessages?: Array<{ role: string; content: string }>;
      topics?: string[];
    }
  ): Promise<ConversationMemory> {
    // 提取关键信息
    const keyPoints = this.extractKeyPoints(content);
    const topics = context?.topics || this.extractTopics(content);
    const emotionalTone = this.config.enableEmotionalAnalysis 
      ? this.analyzeEmotionalTone(content) 
      : undefined;
    const importance = this.calculateImportance(content, keyPoints, emotionalTone);

    const memory: ConversationMemory = {
      id: uuidv4(),
      role,
      content,
      keyPoints,
      emotionalTone,
      topics,
      importance,
      createdAt: new Date().toISOString(),
    };

    // 保存到记忆系统
    try {
      const response = await fetch(this.memoryApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.userId ? { 'X-User-Id': this.userId } : {}),
        },
        body: JSON.stringify({
          action: 'remember',
          content: this.serializeMemory(memory),
          type: 'episodic',
          importance,
          tags: [...topics, `role:${role}`, ...keyPoints.slice(0, 3)],
        }),
      });

      if (!response.ok) {
        console.error('Failed to save conversation memory');
      }
    } catch (error) {
      console.error('Error saving conversation memory:', error);
    }

    return memory;
  }

  /**
   * 回忆相关记忆
   * 
   * @param query 查询内容
   * @returns 相关记忆上下文
   */
  async recallRelevantMemories(query: string): Promise<MemoryContext> {
    const memories: ConversationMemory[] = [];
    const topics = this.extractTopics(query);
    
    try {
      // 搜索相关记忆
      const response = await fetch(this.memoryApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.userId ? { 'X-User-Id': this.userId } : {}),
        },
        body: JSON.stringify({
          action: 'recall',
          cue: query,
          limit: this.config.maxRelevantMemories,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        for (const m of data.data?.matches || []) {
          try {
            const parsed = this.deserializeMemory(m.content);
            if (parsed) {
              memories.push(parsed);
            }
          } catch {
            // 如果解析失败，创建基本记忆
            memories.push({
              id: m.id,
              role: 'user',
              content: m.content,
              keyPoints: [],
              topics: [],
              importance: m.importance,
              createdAt: m.createdAt,
            });
          }
        }
      }

      // 按主题搜索
      for (const topic of topics.slice(0, 2)) {
        const topicResponse = await fetch(this.memoryApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.userId ? { 'X-User-Id': this.userId } : {}),
          },
          body: JSON.stringify({
            action: 'recall',
            cue: topic,
            limit: 3,
          }),
        });

        if (topicResponse.ok) {
          const data = await topicResponse.json();
          for (const m of data.data?.matches || []) {
            if (!memories.find(existing => existing.id === m.id)) {
              memories.push({
                id: m.id,
                role: 'user',
                content: m.content,
                keyPoints: [],
                topics: [topic],
                importance: m.importance,
                createdAt: m.createdAt,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error recalling memories:', error);
    }

    // 构建上下文
    const emotionalContext = this.buildEmotionalContext(memories);
    const lastInteraction = memories.length > 0 
      ? memories.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0].createdAt 
      : null;

    return {
      relevantMemories: memories.slice(0, this.config.maxRelevantMemories),
      topics,
      emotionalContext,
      lastInteractionAt: lastInteraction,
      interactionCount: memories.length,
    };
  }

  /**
   * 构建对话上下文提示
   * 
   * @param context 记忆上下文
   * @returns 格式化的上下文提示
   */
  buildContextPrompt(context: MemoryContext): string {
    if (context.relevantMemories.length === 0) {
      return '';
    }

    const parts: string[] = ['[相关记忆]'];

    // 添加时间信息
    if (context.lastInteractionAt) {
      const lastDate = new Date(context.lastInteractionAt);
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 0) {
        parts.push(`最近交互: 今天`);
      } else if (daysSince === 1) {
        parts.push(`最近交互: 昨天`);
      } else {
        parts.push(`最近交互: ${daysSince}天前`);
      }
    }

    // 添加相关记忆摘要
    parts.push('\n之前的对话:');
    for (const memory of context.relevantMemories.slice(0, 3)) {
      const role = memory.role === 'user' ? '用户' : '助手';
      const summary = memory.keyPoints.length > 0 
        ? memory.keyPoints.join('、') 
        : memory.content.slice(0, 50) + (memory.content.length > 50 ? '...' : '');
      parts.push(`- ${role}: ${summary}`);
    }

    // 添加情感上下文
    if (context.emotionalContext && context.emotionalContext !== 'neutral') {
      parts.push(`\n情感基调: ${context.emotionalContext}`);
    }

    // 添加主题
    if (context.topics.length > 0) {
      parts.push(`\n相关主题: ${context.topics.join('、')}`);
    }

    return parts.join('\n');
  }

  // ─────────────────────────────────────────────────────────────────
  // 私有方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 提取关键点
   */
  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
    
    // 简单规则：提取关键短语
    const patterns = [
      /(?:我想要|我想|我希望)([^。！？,，]+)/g,
      /(?:重点是|重要的是)([^。！？,，]+)/g,
      /(?:记得|记住)([^。！？,，]+)/g,
      /(?:问题|疑问)是([^。！？,，]+)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].trim().length > 2) {
          points.push(match[1].trim());
        }
      }
    }

    return [...new Set(points)].slice(0, 5);
  }

  /**
   * 提取主题
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    
    // 关键词映射
    const topicKeywords: Record<string, string[]> = {
      '工作': ['工作', '项目', '任务', '会议', '报告'],
      '学习': ['学习', '课程', '考试', '知识', '理解'],
      '生活': ['生活', '日常', '习惯', '休息', '运动'],
      '技术': ['代码', '程序', '开发', '技术', '系统'],
      '情感': ['开心', '难过', '焦虑', '担心', '期待'],
      '计划': ['计划', '目标', '打算', '安排', '未来'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => content.includes(kw))) {
        topics.push(topic);
      }
    }

    return topics.slice(0, 3);
  }

  /**
   * 分析情感基调
   */
  private analyzeEmotionalTone(content: string): string {
    const positiveWords = ['开心', '高兴', '喜欢', '期待', '感谢', '棒', '好', '成功'];
    const negativeWords = ['难过', '担心', '焦虑', '问题', '困难', '失败', '烦'];
    const curiousWords = ['为什么', '怎么', '如何', '什么', '吗', '？'];

    let positiveScore = 0;
    let negativeScore = 0;
    let curiousScore = 0;

    for (const word of positiveWords) {
      if (content.includes(word)) positiveScore++;
    }
    for (const word of negativeWords) {
      if (content.includes(word)) negativeScore++;
    }
    for (const word of curiousWords) {
      if (content.includes(word)) curiousScore++;
    }

    if (curiousScore > positiveScore && curiousScore > negativeScore) {
      return 'curious';
    }
    if (positiveScore > negativeScore) {
      return 'positive';
    }
    if (negativeScore > positiveScore) {
      return 'concerned';
    }
    return 'neutral';
  }

  /**
   * 计算重要性
   */
  private calculateImportance(
    content: string, 
    keyPoints: string[], 
    emotionalTone?: string
  ): number {
    let importance = 0.5;

    // 关键点越多越重要
    importance += keyPoints.length * 0.05;

    // 情感强度
    if (emotionalTone && emotionalTone !== 'neutral') {
      importance += 0.1;
    }

    // 内容长度
    if (content.length > 200) {
      importance += 0.05;
    }

    // 特定关键词
    const importantKeywords = ['重要', '记住', '必须', '关键', '核心'];
    for (const kw of importantKeywords) {
      if (content.includes(kw)) {
        importance += 0.1;
        break;
      }
    }

    return Math.min(1, importance);
  }

  /**
   * 构建情感上下文
   */
  private buildEmotionalContext(memories: ConversationMemory[]): string {
    if (memories.length === 0) return 'neutral';

    const tones = memories
      .filter(m => m.emotionalTone)
      .map(m => m.emotionalTone!);

    if (tones.length === 0) return 'neutral';

    // 统计最常见的情感基调
    const counts: Record<string, number> = {};
    for (const tone of tones) {
      counts[tone] = (counts[tone] || 0) + 1;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'neutral';
  }

  /**
   * 序列化记忆
   */
  private serializeMemory(memory: ConversationMemory): string {
    return JSON.stringify({
      role: memory.role,
      content: memory.content,
      keyPoints: memory.keyPoints,
      topics: memory.topics,
      emotionalTone: memory.emotionalTone,
      importance: memory.importance,
    });
  }

  /**
   * 反序列化记忆
   */
  private deserializeMemory(content: string): ConversationMemory | null {
    try {
      const parsed = JSON.parse(content);
      return {
        id: uuidv4(),
        role: parsed.role || 'user',
        content: parsed.content,
        keyPoints: parsed.keyPoints || [],
        topics: parsed.topics || [],
        emotionalTone: parsed.emotionalTone,
        importance: parsed.importance || 0.5,
        createdAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createMemoryIntegrationService(
  config?: Partial<MemoryIntegrationConfig>
): MemoryIntegrationService {
  return new MemoryIntegrationService(config);
}
