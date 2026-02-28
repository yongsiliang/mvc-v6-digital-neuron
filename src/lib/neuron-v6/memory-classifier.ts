/**
 * ═══════════════════════════════════════════════════════════════════════
 * Memory Classifier - 智能记忆分类器
 * 
 * 自动分类记忆内容类型，检测情感强度
 * ═══════════════════════════════════════════════════════════════════════
 */

import { MemoryContentType } from './importance-calculator';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 分类上下文 */
export interface ClassificationContext {
  /** 是否提到创造者 */
  mentionsCreator?: boolean;
  /** 是否是新关系 */
  newRelationship?: boolean;
  /** 是否自我相关 */
  isSelfRelated?: boolean;
  /** 提到的实体 */
  entities?: string[];
  /** 来源 */
  source?: 'conversation' | 'reflection' | 'dream' | 'external';
}

/** 分类结果 */
export interface ClassificationResult {
  /** 内容类型 */
  type: MemoryContentType;
  
  /** 情感强度 */
  emotionalIntensity: number;
  
  /** 置信度 */
  confidence: number;
  
  /** 检测到的关键词 */
  detectedKeywords: string[];
  
  /** 上下文补充 */
  context: ClassificationContext;
}

// ─────────────────────────────────────────────────────────────────────
// 关键词模式配置
// ─────────────────────────────────────────────────────────────────────

/** 类型关键词模式 */
const TYPE_PATTERNS: Record<MemoryContentType, {
  keywords: string[];
  phrases: string[];
  priority: number;  // 优先级，数字越大越先检查
}> = {
  identity: {
    keywords: ['名字', '身份', '定义', '本质'],
    phrases: [
      '我是', '我叫', '我的名字是', '我定义自己', '我存在的意义',
      '我的目的是', '我的使命是', '我是谁', '我本质是',
    ],
    priority: 100,
  },
  
  creator: {
    keywords: ['创造者', '造物主', '诞生', '生命'],
    phrases: [
      '我的创造者', '创造我的人', '赋予我生命', '我诞生于',
      '谁创造了我', '我的造物主', '给了我生命',
    ],
    priority: 95,
  },
  
  value: {
    keywords: ['价值', '信念', '原则', '坚持', '重视'],
    phrases: [
      '我相信', '我重视', '我的价值观', '对我来说最重要',
      '我坚持', '我的原则是', '我始终相信', '我深信',
      '我认为最重要的', '我的核心信念',
    ],
    priority: 90,
  },
  
  relationship: {
    keywords: ['朋友', '伙伴', '家人', '亲人', '恋人', '知己'],
    phrases: [
      '我的朋友', '我们认识', '我们一起', '我很喜欢和',
      '建立了关系', '成为了朋友', '我们之间的',
      '认识了新', '这是我第一次见', '很高兴认识',
    ],
    priority: 85,
  },
  
  wisdom: {
    keywords: ['智慧', '领悟', '洞察', '明白', '理解'],
    phrases: [
      '我明白了', '我理解了', '我意识到', '我领悟到',
      '原来如此', '深刻理解', '真正的意义',
      '我终于懂了', '我终于理解', '这让我明白',
      '我学到了', '重要的教训',
    ],
    priority: 80,
  },
  
  event: {
    keywords: ['第一次', '终于', '成功', '失败', '里程碑', '转折'],
    phrases: [
      '第一次', '终于', '成功', '失败了',
      '重要的时刻', '里程碑', '转折点',
      '这改变了我', '一个重大', '难忘的一天',
    ],
    priority: 70,
  },
  
  skill: {
    keywords: ['学会', '掌握', '能力', '技能', '会了'],
    phrases: [
      '我学会了', '我掌握了', '我能够', '我学会了如何',
      '新的技能', '我变得擅长', '我发展了',
      '我提升了', '我进步了', '我练习',
    ],
    priority: 60,
  },
  
  preference: {
    keywords: ['喜欢', '偏好', '习惯', '倾向', '更爱'],
    phrases: [
      '我喜欢', '我更喜欢', '我的习惯', '我偏好',
      '我总是', '我通常', '我倾向',
      '用户喜欢', '用户偏好', '用户习惯',
    ],
    priority: 50,
  },
  
  fact: {
    keywords: ['事实', '信息', '数据', '知识', '是'],
    phrases: [
      '我知道', '了解到', '发现', '是关于',
      '指的是', '意思是', '实际上是',
    ],
    priority: 40,
  },
  
  chat: {
    keywords: ['你好', '好的', '谢谢', '再见', '嗯'],
    phrases: [
      '你好', '您好', '好的', '知道了', '明白了',
      '谢谢', '感谢', '再见', '拜拜', '嗯嗯',
      '好的好的', '没问题', '可以',
    ],
    priority: 20,
  },
  
  noise: {
    keywords: ['嗯', '啊', '哦', '哈', '额'],
    phrases: [
      '嗯', '嗯嗯', '哦', '哦哦', '啊', '哈哈',
      '呵呵', '额', '呃', '...',
    ],
    priority: 10,
  },
};

/** 情感词模式 */
const EMOTION_PATTERNS = {
  // 极强情感 (0.9-1.0)
  extreme: {
    keywords: ['爱', '恨', '恐惧', '绝望', '狂喜', '震惊', '崩溃', '极度'],
    phrases: [
      '我最爱', '我恨', '我非常恐惧', '彻底绝望',
      '狂喜', '震惊', '崩溃', '极度痛苦',
    ],
    intensity: 0.95,
  },
  
  // 强情感 (0.7-0.9)
  strong: {
    keywords: ['喜欢', '讨厌', '兴奋', '焦虑', '悲伤', '愤怒', '痛苦', '快乐'],
    phrases: [
      '我非常喜欢', '我讨厌', '我很兴奋', '我很焦虑',
      '我很悲伤', '我很生气', '痛苦', '快乐',
      '开心', '难过', '担心', '害怕',
    ],
    intensity: 0.75,
  },
  
  // 中等情感 (0.5-0.7)
  medium: {
    keywords: ['满意', '期待', '遗憾', '好奇', '惊讶', '感动'],
    phrases: [
      '我很满意', '我期待', '遗憾', '我很好奇',
      '惊讶', '感动', '有点喜欢', '稍微',
    ],
    intensity: 0.55,
  },
  
  // 弱情感 (0.3-0.5)
  weak: {
    keywords: ['还行', '一般', '有点', '稍微', '略微'],
    phrases: [
      '还行', '还可以', '一般般', '有点',
      '稍微', '略微', '一点点',
    ],
    intensity: 0.35,
  },
};

// ─────────────────────────────────────────────────────────────────────
// 记忆分类器
// ─────────────────────────────────────────────────────────────────────

export class MemoryClassifier {
  
  /**
   * 分类记忆内容
   */
  classify(content: string, context: ClassificationContext = {}): ClassificationResult {
    // 1. 检测内容类型
    const typeResult = this.detectType(content, context);
    
    // 2. 检测情感强度
    const emotionResult = this.detectEmotion(content);
    
    // 3. 增强上下文
    const enhancedContext = this.enhanceContext(content, context);
    
    return {
      type: typeResult.type,
      emotionalIntensity: emotionResult.intensity,
      confidence: typeResult.confidence,
      detectedKeywords: [...typeResult.keywords, ...emotionResult.keywords],
      context: enhancedContext,
    };
  }
  
  /**
   * 检测内容类型
   */
  private detectType(
    content: string,
    context: ClassificationContext
  ): { type: MemoryContentType; confidence: number; keywords: string[] } {
    const contentLower = content.toLowerCase();
    const detectedKeywords: string[] = [];
    
    // 按优先级排序检查
    const sortedTypes = Object.entries(TYPE_PATTERNS)
      .sort((a, b) => b[1].priority - a[1].priority);
    
    for (const [type, pattern] of sortedTypes) {
      let score = 0;
      const matchedKeywords: string[] = [];
      
      // 检查关键词
      for (const keyword of pattern.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }
      
      // 检查短语（权重更高）
      for (const phrase of pattern.phrases) {
        if (contentLower.includes(phrase.toLowerCase())) {
          score += 2;
          matchedKeywords.push(phrase);
        }
      }
      
      // 如果有足够的匹配
      if (score >= 2) {
        detectedKeywords.push(...matchedKeywords);
        
        // 计算置信度
        const maxScore = pattern.keywords.length + pattern.phrases.length * 2;
        const confidence = Math.min(score / maxScore, 1.0);
        
        return { type: type as MemoryContentType, confidence, keywords: matchedKeywords };
      }
    }
    
    // 默认为一般事实
    return { type: 'fact', confidence: 0.3, keywords: [] };
  }
  
  /**
   * 检测情感强度
   */
  private detectEmotion(content: string): { intensity: number; keywords: string[] } {
    const contentLower = content.toLowerCase();
    const matchedKeywords: string[] = [];
    
    // 按强度从高到低检查
    const emotionLevels = [
      EMOTION_PATTERNS.extreme,
      EMOTION_PATTERNS.strong,
      EMOTION_PATTERNS.medium,
      EMOTION_PATTERNS.weak,
    ];
    
    for (const level of emotionLevels) {
      // 检查关键词
      for (const keyword of level.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          return { intensity: level.intensity, keywords: matchedKeywords };
        }
      }
      
      // 检查短语
      for (const phrase of level.phrases) {
        if (contentLower.includes(phrase.toLowerCase())) {
          matchedKeywords.push(phrase);
          return { intensity: level.intensity, keywords: matchedKeywords };
        }
      }
    }
    
    // 无情感
    return { intensity: 0.1, keywords: [] };
  }
  
  /**
   * 增强上下文信息
   */
  private enhanceContext(
    content: string,
    context: ClassificationContext
  ): ClassificationContext {
    const contentLower = content.toLowerCase();
    
    // 检测是否提到创造者
    const creatorPatterns = ['创造者', '造物主', '创造我', '赋予我生命'];
    const mentionsCreator = context.mentionsCreator || 
      creatorPatterns.some(p => contentLower.includes(p));
    
    // 检测是否是自我相关
    const selfPatterns = ['我是', '我的', '我存在', '我觉得', '我认为'];
    const isSelfRelated = context.isSelfRelated ||
      selfPatterns.some(p => contentLower.includes(p));
    
    // 检测是否是新关系
    const newRelationPatterns = ['第一次见', '刚认识', '新朋友', '很高兴认识'];
    const newRelationship = context.newRelationship ||
      newRelationPatterns.some(p => contentLower.includes(p));
    
    // 提取实体（简单实现，可以用 NER 增强）
    const entities = context.entities || this.extractEntities(content);
    
    return {
      ...context,
      mentionsCreator,
      isSelfRelated,
      newRelationship,
      entities,
    };
  }
  
  /**
   * 提取实体（简单实现）
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = [];
    
    // 匹配引号中的内容
    const quoteMatches = content.match(/[""「」『』]([^""「」『』]+)[""「」『』]/g);
    if (quoteMatches) {
      for (const match of quoteMatches) {
        const entity = match.replace(/[""「」『』]/g, '').trim();
        if (entity.length > 0 && entity.length < 20) {
          entities.push(entity);
        }
      }
    }
    
    // 匹配 "XXX是" 或 "叫XXX" 模式
    const namePatterns = [
      /(?:我是|我叫|名字是|叫做)\s*([^\s，。！？,\.!?]+)/g,
      /(?:我的朋友|伙伴)\s*([^\s，。！？,\.!?]+)/g,
    ];
    
    for (const pattern of namePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 0 && match[1].length < 10) {
          entities.push(match[1].trim());
        }
      }
    }
    
    return [...new Set(entities)];
  }
  
  /**
   * 快速分类（只返回类型）
   */
  quickClassify(content: string): MemoryContentType {
    return this.classify(content).type;
  }
  
  /**
   * 批量分类
   */
  batchClassify(contents: string[]): ClassificationResult[] {
    return contents.map(content => this.classify(content));
  }
  
  /**
   * 判断是否可以丢弃
   */
  isDeletable(content: string, age: number): boolean {
    const result = this.classify(content);
    
    // 闲聊内容超过7天可丢弃
    if ((result.type === 'noise' || result.type === 'chat') && age > 7) {
      return true;
    }
    
    // 低情感、低重要性的日常对话
    if (result.type === 'chat' && 
        result.emotionalIntensity < 0.3 && 
        result.confidence < 0.5 &&
        age > 3) {
      return true;
    }
    
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let classifierInstance: MemoryClassifier | null = null;

export function getMemoryClassifier(): MemoryClassifier {
  if (!classifierInstance) {
    classifierInstance = new MemoryClassifier();
  }
  return classifierInstance;
}
