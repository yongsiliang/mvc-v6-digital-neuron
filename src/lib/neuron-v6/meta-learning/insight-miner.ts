/**
 * 洞察挖掘器 (Insight Miner)
 * 
 * 核心任务：
 * 1. 从对话中挖掘深层洞察（不只是信息）
 * 2. 识别模式、原理、矛盾、机会
 * 3. 发现系统的局限性
 * 4. 捕捉意外和惊喜
 * 
 * 理念：
 * 对话的价值不在于"交换了多少信息"，而在于"发现了什么"
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import type { ExtractedInsight } from './types';

export interface InsightMiningResult {
  insights: ExtractedInsight[];
  patterns: string[];
  principles: string[];
  contradictions: string[];
  opportunities: string[];
}

export class InsightMiner {
  private llmClient: LLMClient;
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  /**
   * 从对话中挖掘洞察
   */
  async mine(
    userMessage: string,
    assistantResponse: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    systemContext?: {
      recentLearnings?: string[];
      activeGoals?: string[];
    }
  ): Promise<InsightMiningResult> {
    // 构建上下文
    const recentContext = conversationHistory
      .slice(-5)
      .map(h => `${h.role === 'user' ? '用户' : '助手'}：${h.content.slice(0, 200)}...`)
      .join('\n');
    
    const systemContextStr = systemContext?.recentLearnings?.length
      ? `\n## 最近的学习\n${systemContext.recentLearnings.slice(-3).map(l => `- ${l}`).join('\n')}`
      : '';
    
    const prompt = `你是一个深度思考专家。你的任务是从对话中挖掘真正有价值的洞察。

## 对话历史
${recentContext}

## 当前对话
用户：${userMessage}

助手：${assistantResponse}
${systemContextStr}

## 你的任务
请深入分析这段对话，提取以下类型的洞察：

### 1. 模式发现 (pattern)
识别重复出现的模式、规律、趋势
例如：
- "我发现用户在描述复杂概念时倾向于用比喻"
- "每次讨论记忆系统时，都会引出关于人类大脑的思考"

### 2. 原理提取 (principle)
从具体案例中抽象出通用原理
例如：
- "对话的深度不取决于信息量，而取决于视角的转换"
- "理解的本质是建立连接，而不是存储信息"

### 3. 矛盾发现 (contradiction)
识别看似矛盾但值得深思的悖论
例如：
- "要记住更多，可能需要遗忘一些东西"
- "追求完美的记忆反而限制了理解"

### 4. 机会识别 (opportunity)
发现可能的改进机会或新方向
例如：
- "也许我们可以用另一种方式组织记忆..."
- "这里有一个未被探索的方向..."

### 5. 局限发现 (limitation)
识别当前方法或理解的根本局限
例如：
- "当前的存储模型无法捕捉这种动态关系"
- "这个方法假设了X，但X并不总是成立"

### 6. 意外发现 (surprise)
与预期不符的发现，令人惊讶的洞察
例如：
- "我以为X，但实际上是Y"
- "这个结果完全出乎意料..."

## 输出格式（JSON）
{
  "insights": [
    {
      "type": "pattern|principle|contradiction|opportunity|limitation|surprise",
      "content": "洞察内容（简洁有力，一句话）",
      "confidence": 0.8,
      "applicability": ["可应用场景1", "可应用场景2"]
    }
  ],
  "patterns": ["发现的模式1", "发现的模式2"],
  "principles": ["抽象的原理1", "抽象的原理2"],
  "contradictions": ["发现的矛盾1"],
  "opportunities": ["发现的机会1"]
}

注意：
- 洞察要简洁有力，不是复述对话内容
- 只提取真正重要的内容，不要强行制造洞察
- 如果确实没有重要发现，返回空数组
- confidence 表示你对这个洞察的确信程度`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.4,
      });
      
      const content = response.content || '';
      
      // 解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndEnrich(parsed, userMessage, assistantResponse);
      }
      
      return this.emptyResult();
    } catch (error) {
      console.error('[洞察挖掘] 挖掘失败:', error);
      return this.emptyResult();
    }
  }
  
  /**
   * 快速挖掘（不使用 LLM）
   */
  quickMine(
    userMessage: string,
    assistantResponse: string
  ): InsightMiningResult {
    const result = this.emptyResult();
    const combined = `${userMessage} ${assistantResponse}`;
    
    // 模式匹配提取
    const insightPatterns = [
      // 模式发现
      {
        regex: /(?:我发现|发现|注意到|观察到)[，,]?\s*(.{10,50})/g,
        type: 'pattern' as const,
      },
      // 原理提取
      {
        regex: /(?:本质|核心|关键|原理)是[「"']?([^」"'\n]{5,40})[」"']?/g,
        type: 'principle' as const,
      },
      // 矛盾发现
      {
        regex: /(?:不是|并非|相反)[「"']?([^」"'\n]{5,30})[」"']?[，,]?\s*(?:而是|实际上)[「"']?([^」"'\n]{5,30})[」"']?/g,
        type: 'contradiction' as const,
      },
      // 机会识别
      {
        regex: /(?:也许|可能|或许)可以(.{5,40})/g,
        type: 'opportunity' as const,
      },
      // 局限发现
      {
        regex: /(?:局限|无法|不能|不足|缺陷)是[「"']?([^」"'\n]{5,40})[」"']?/g,
        type: 'limitation' as const,
      },
      // 意外发现
      {
        regex: /(?:意外|惊讶|出乎意料|没想到)的是[，,]?\s*(.{5,40})/g,
        type: 'surprise' as const,
      },
    ];
    
    for (const { regex, type } of insightPatterns) {
      const matches = combined.matchAll(regex);
      for (const match of matches) {
        const content = match[1] || match[0];
        result.insights.push({
          id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          content: content.trim(),
          confidence: 0.5,
          applicability: [],
          source: {
            userMessage: userMessage.slice(0, 100),
            assistantResponse: assistantResponse.slice(0, 100),
            timestamp: Date.now(),
          },
        });
      }
    }
    
    // 分类汇总
    result.insights.forEach(insight => {
      switch (insight.type) {
        case 'pattern':
          result.patterns.push(insight.content);
          break;
        case 'principle':
          result.principles.push(insight.content);
          break;
        case 'contradiction':
          result.contradictions.push(insight.content);
          break;
        case 'opportunity':
          result.opportunities.push(insight.content);
          break;
      }
    });
    
    return result;
  }
  
  /**
   * 验证和丰富结果
   */
  private validateAndEnrich(
    parsed: any,
    userMessage: string,
    assistantResponse: string
  ): InsightMiningResult {
    const result = this.emptyResult();
    
    if (Array.isArray(parsed.insights)) {
      result.insights = parsed.insights
        .filter((i: any) => i.content && i.type)
        .slice(0, 10)  // 最多10个洞察
        .map((i: any) => ({
          id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: i.type,
          content: i.content,
          confidence: typeof i.confidence === 'number' ? i.confidence : 0.5,
          applicability: Array.isArray(i.applicability) ? i.applicability : [],
          source: {
            userMessage: userMessage.slice(0, 100),
            assistantResponse: assistantResponse.slice(0, 100),
            timestamp: Date.now(),
          },
        }));
    }
    
    // 分类汇总
    if (Array.isArray(parsed.patterns)) {
      result.patterns = parsed.patterns;
    }
    if (Array.isArray(parsed.principles)) {
      result.principles = parsed.principles;
    }
    if (Array.isArray(parsed.contradictions)) {
      result.contradictions = parsed.contradictions;
    }
    if (Array.isArray(parsed.opportunities)) {
      result.opportunities = parsed.opportunities;
    }
    
    return result;
  }
  
  private emptyResult(): InsightMiningResult {
    return {
      insights: [],
      patterns: [],
      principles: [],
      contradictions: [],
      opportunities: [],
    };
  }
}

/**
 * 创建洞察挖掘器
 */
export function createInsightMiner(llmClient: LLMClient): InsightMiner {
  return new InsightMiner(llmClient);
}
