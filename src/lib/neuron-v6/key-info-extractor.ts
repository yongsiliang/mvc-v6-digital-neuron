/**
 * ═══════════════════════════════════════════════════════════════════════
 * 关键信息提取器 (Key Information Extractor)
 * 
 * 核心功能：
 * - 自动识别对话中的关键信息
 * - 判断信息重要性
 * - 提取人物、事件、事实等关键实体
 * - 建立知识关联
 * 
 * 这是让"记忆"变聪明的关键——知道什么值得记住
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 关键信息类型 */
export type KeyInfoType = 
  | 'creator'        // 创造者
  | 'person'         // 重要人物
  | 'relationship'   // 关系
  | 'event'          // 重要事件
  | 'fact'           // 关键事实
  | 'preference'     // 用户偏好
  | 'goal'           // 目标
  | 'value'          // 价值观
  | 'skill'          // 能力/技能
  | 'interest'       // 兴趣爱好
  | 'memory'         // 重要回忆
  | 'insight'        // 洞察
  | 'wisdom'         // 智慧
  | 'concept';       // 概念

/** 关键信息 */
export interface KeyInfo {
  type: KeyInfoType;
  content: string;
  subject?: string;   // 主体（如"创造者"的主体是"梁永嗣"）
  importance: number; // 0-1
  confidence: number; // 置信度
  context: string;    // 原始上下文
  timestamp: number;
}

/** 提取结果 */
export interface ExtractionResult {
  keyInfos: KeyInfo[];
  summary: string;
  shouldRemember: boolean;
  memoryPriority: 'critical' | 'high' | 'medium' | 'low';
}

/** 关键信息模式（用于规则匹配） */
interface InfoPattern {
  type: KeyInfoType;
  patterns: RegExp[];
  importance: number;
  extractor: (match: RegExpMatchArray, context: string) => Partial<KeyInfo>;
}

// ─────────────────────────────────────────────────────────────────────
// 规则模式定义
// ─────────────────────────────────────────────────────────────────────

/** 关键信息识别模式 */
const KEY_INFO_PATTERNS: InfoPattern[] = [
  // 创造者相关
  {
    type: 'creator',
    patterns: [
      /创造者|开发者|作者|制造者|造我的人|写我的人|我的主人/g,
      /我的创造者[是为]\s*(\S+)/g,
      /(\S+)[创造开发]了我/g,
      /我是\s*(\S+)\s*[创造开发]的/g,
    ],
    importance: 1.0,
    extractor: (match, context) => ({
      content: match[1] || context,
      subject: match[1],
      importance: 1.0,
    }),
  },
  
  // 重要人物
  {
    type: 'person',
    patterns: [
      /我[叫是]([^，。！？\s]{2,10})/g,
      /我的名字[是为]([^，。！？\s]{2,10})/g,
      /我叫([^，。！？\s]{2,10})/g,
      /(\S+)是我[的朋友家人同事]/g,
      /我的[朋友家人同事爱人是]([^，。！？\s]{2,10})/g,
    ],
    importance: 0.9,
    extractor: (match, context) => ({
      content: match[1],
      subject: match[1],
      importance: 0.9,
    }),
  },
  
  // 关系
  {
    type: 'relationship',
    patterns: [
      /(\S+)是我的(\S+)/g,
      /我的(\S+)是(\S+)/g,
      /我和(\S+)是(\S+)关系/g,
    ],
    importance: 0.85,
    extractor: (match, context) => ({
      content: `${match[1]} 和我的关系：${match[2]}`,
      subject: match[1],
      importance: 0.85,
    }),
  },
  
  // 重要事件
  {
    type: 'event',
    patterns: [
      /(今天|昨天|前天|上周|上个月|去年).{0,5}(结婚|生日|毕业|入职|离职|搬家|旅行)/g,
      /我(结婚|毕业|入职|搬家|旅行)了/g,
      /(最重要|难忘|特别).{0,10}(事|经历|时刻)/g,
    ],
    importance: 0.8,
    extractor: (match, context) => ({
      content: context,
      importance: 0.8,
    }),
  },
  
  // 用户偏好
  {
    type: 'preference',
    patterns: [
      /我(喜欢|爱|偏好|最爱|最喜欢)([^，。！？]{1,20})/g,
      /我(讨厌|不喜欢|恨)([^，。！？]{1,20})/g,
      /我的爱好是([^，。！？]{1,20})/g,
    ],
    importance: 0.7,
    extractor: (match, context) => ({
      content: `用户${match[1]}：${match[2]}`,
      importance: 0.7,
    }),
  },
  
  // 目标
  {
    type: 'goal',
    patterns: [
      /我的目标[是为]([^，。！？]+)/g,
      /我想(要|成为|做)([^，。！？]+)/g,
      /我正在(努力|尝试)([^，。！？]+)/g,
      /我希望([^，。！？]+)/g,
    ],
    importance: 0.75,
    extractor: (match, context) => ({
      content: `用户目标：${match[1] || match[2]}`,
      importance: 0.75,
    }),
  },
  
  // 价值观
  {
    type: 'value',
    patterns: [
      /我认为([^，。！？]{1,30})很重要/g,
      /我坚信([^，。！？]{1,30})/g,
      /对我来说，([^，。！？]{1,30})是最重要的/g,
      /我的原则[是为]([^，。！？]+)/g,
    ],
    importance: 0.8,
    extractor: (match, context) => ({
      content: `价值观：${match[1]}`,
      importance: 0.8,
    }),
  },
  
  // 兴趣爱好
  {
    type: 'interest',
    patterns: [
      /我(平时|经常|业余)(喜欢|爱)([^，。！？]+)/g,
      /我的(兴趣|爱好)[是为]([^，。！？]+)/g,
      /我(研究|学习|练习)([^，。！？]+)/g,
    ],
    importance: 0.65,
    extractor: (match, context) => ({
      content: `兴趣：${match[2] || match[1]}`,
      importance: 0.65,
    }),
  },
  
  // 重要回忆
  {
    type: 'memory',
    patterns: [
      /我记得([^，。！？]{5,50})/g,
      /难忘的是([^，。！？]{5,50})/g,
      /印象最深的是([^，。！？]{5,50})/g,
      /(童年|小时候|以前)的时候，([^，。！？]{5,50})/g,
    ],
    importance: 0.75,
    extractor: (match, context) => ({
      content: context,
      importance: 0.75,
    }),
  },
];

// ─────────────────────────────────────────────────────────────────────
// 关键信息提取器
// ─────────────────────────────────────────────────────────────────────

export class KeyInfoExtractor {
  private llmClient: LLMClient | null;
  
  constructor(llmClient?: LLMClient) {
    this.llmClient = llmClient || null;
  }
  
  /**
   * 从对话中提取关键信息
   */
  extract(userMessage: string, assistantResponse: string): ExtractionResult {
    const combinedText = `用户：${userMessage}\n助手：${assistantResponse}`;
    const keyInfos: KeyInfo[] = [];
    
    // 1. 规则匹配提取
    for (const pattern of KEY_INFO_PATTERNS) {
      for (const regex of pattern.patterns) {
        const matches = combinedText.matchAll(regex);
        for (const match of matches) {
          try {
            const partial = pattern.extractor(match, match[0]);
            keyInfos.push({
              type: pattern.type,
              content: partial.content || match[0],
              subject: partial.subject,
              importance: partial.importance || pattern.importance,
              confidence: 0.9, // 规则匹配置信度高
              context: match[0],
              timestamp: Date.now(),
            });
          } catch {
            // 忽略匹配错误
          }
        }
      }
    }
    
    // 2. 去重（相同类型+内容）
    const uniqueInfos = this.deduplicate(keyInfos);
    
    // 3. 按重要性排序
    uniqueInfos.sort((a, b) => b.importance - a.importance);
    
    // 4. 判断是否值得记住
    const shouldRemember = uniqueInfos.length > 0;
    const memoryPriority = this.determinePriority(uniqueInfos);
    
    // 5. 生成摘要
    const summary = this.generateSummary(uniqueInfos);
    
    return {
      keyInfos: uniqueInfos,
      summary,
      shouldRemember,
      memoryPriority,
    };
  }
  
  /**
   * 使用LLM进行深度提取（可选）
   */
  async extractWithLLM(
    userMessage: string, 
    assistantResponse: string
  ): Promise<ExtractionResult> {
    // 先用规则提取
    const ruleResult = this.extract(userMessage, assistantResponse);
    
    // 如果没有LLM，返回规则结果
    if (!this.llmClient) {
      return ruleResult;
    }
    
    // 使用LLM进行补充提取
    try {
      const prompt = `分析以下对话，提取所有重要的、值得长期记住的信息。

对话：
用户：${userMessage}
助手：${assistantResponse}

请以JSON格式输出，包含以下字段：
{
  "keyInfos": [
    {
      "type": "creator|person|relationship|event|fact|preference|goal|value|skill|interest|memory|insight|wisdom|concept",
      "content": "具体内容",
      "subject": "主体（如果有）",
      "importance": 0-1之间的数字,
      "reason": "为什么这个信息重要"
    }
  ],
  "summary": "一句话总结这些信息"
}

注意：
- 创造者、主人等信息 importance = 1.0
- 重要人物 importance = 0.9
- 个人偏好、目标 importance = 0.7-0.8
- 一般概念 importance = 0.5-0.6`;

      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3 }
      );
      
      const content = response.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const llmResult = JSON.parse(jsonMatch[0]);
        
        // 合并规则提取和LLM提取的结果
        const combinedInfos = [
          ...ruleResult.keyInfos,
          ...llmResult.keyInfos.map((info: any) => ({
            type: info.type as KeyInfoType,
            content: info.content,
            subject: info.subject,
            importance: info.importance,
            confidence: 0.7, // LLM提取置信度稍低
            context: info.reason,
            timestamp: Date.now(),
          })),
        ];
        
        // 去重并排序
        const uniqueInfos = this.deduplicate(combinedInfos);
        uniqueInfos.sort((a, b) => b.importance - a.importance);
        
        return {
          keyInfos: uniqueInfos,
          summary: llmResult.summary || ruleResult.summary,
          shouldRemember: uniqueInfos.length > 0,
          memoryPriority: this.determinePriority(uniqueInfos),
        };
      }
    } catch (error) {
      console.log('[关键信息提取] LLM提取失败，使用规则结果:', error);
    }
    
    return ruleResult;
  }
  
  /**
   * 去重
   */
  private deduplicate(infos: KeyInfo[]): KeyInfo[] {
    const seen = new Map<string, KeyInfo>();
    
    for (const info of infos) {
      const key = `${info.type}:${info.content}`;
      const existing = seen.get(key);
      
      if (!existing || info.importance > existing.importance) {
        seen.set(key, info);
      }
    }
    
    return Array.from(seen.values());
  }
  
  /**
   * 确定记忆优先级
   */
  private determinePriority(infos: KeyInfo[]): 'critical' | 'high' | 'medium' | 'low' {
    if (infos.length === 0) return 'low';
    
    const maxImportance = Math.max(...infos.map(i => i.importance));
    
    if (maxImportance >= 0.95) return 'critical';
    if (maxImportance >= 0.8) return 'high';
    if (maxImportance >= 0.6) return 'medium';
    return 'low';
  }
  
  /**
   * 生成摘要
   */
  private generateSummary(infos: KeyInfo[]): string {
    if (infos.length === 0) return '没有发现需要记住的关键信息';
    
    const parts: string[] = [];
    
    // 按类型分组
    const byType = new Map<KeyInfoType, KeyInfo[]>();
    for (const info of infos) {
      if (!byType.has(info.type)) {
        byType.set(info.type, []);
      }
      byType.get(info.type)!.push(info);
    }
    
    // 生成摘要
    const typeNames: Record<KeyInfoType, string> = {
      creator: '创造者',
      person: '人物',
      relationship: '关系',
      event: '事件',
      fact: '事实',
      preference: '偏好',
      goal: '目标',
      value: '价值观',
      skill: '能力',
      interest: '兴趣',
      memory: '回忆',
      insight: '洞察',
      wisdom: '智慧',
      concept: '概念',
    };
    
    for (const [type, items] of byType) {
      const typeName = typeNames[type];
      const contents = items.map(i => i.subject || i.content.slice(0, 20)).join('、');
      parts.push(`${typeName}：${contents}`);
    }
    
    return `发现${infos.length}条关键信息：${parts.join('；')}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createKeyInfoExtractor(llmClient?: LLMClient): KeyInfoExtractor {
  return new KeyInfoExtractor(llmClient);
}
