/**
 * ═══════════════════════════════════════════════════════════════════════
 * 洞见提取器 (Insight Extractor)
 * 
 * 核心任务：
 * - 从对话中提取真正重要的洞见
 * - 识别概念创造的时刻
 * - 捕捉视角转换
 * - 发现深层理解
 * 
 * 理念：
 * 对话的价值不在于"说了多少"，而在于"发现了什么"
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import type { HappeningType } from './happening-recorder';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 提取的洞见 */
export interface ExtractedInsight {
  type: HappeningType;
  content: string;
  importance: number;
  triggeredBy: string;  // 哪句话触发了这个洞见
  coCreated: boolean;   // 是否共同创造
}

/** 提取结果 */
export interface ExtractionResult {
  insights: ExtractedInsight[];
  conceptsCreated: Array<{
    name: string;
    definition: string;
  }>;
  perspectiveShifts: Array<{
    from: string;
    to: string;
    trigger: string;
  }>;
  deepUnderstanding: string[];
  openQuestions: string[];
  summary: string;
}

// ─────────────────────────────────────────────────────────────────────
// 洞见提取器
// ─────────────────────────────────────────────────────────────────────

/**
 * 洞见提取器
 * 使用 LLM 从对话中提取真正重要的洞见
 */
export class InsightExtractor {
  private llmClient: LLMClient;
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  /**
   * 从对话中提取洞见
   */
  async extract(
    userMessage: string,
    assistantResponse: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<ExtractionResult> {
    // 构建上下文
    const recentContext = conversationHistory
      .slice(-6)
      .map(h => `${h.role === 'user' ? '用户' : '助手'}：${h.content}`)
      .join('\n\n');
    
    const prompt = `你是一个对话分析专家。请分析以下对话，提取真正重要的洞见。

## 对话上下文
${recentContext}

## 当前对话
用户：${userMessage}

助手：${assistantResponse}

## 任务
请分析这段对话，提取：

1. **洞见** (insights)：对话中发现的重要真理、认识、领悟
   - 不是重复对话内容，而是提炼本质发现
   - 例如："直觉本质上是信念的影子"、"信念不需要存储，只需要活出来"

2. **创造的概念** (conceptsCreated)：对话中诞生的新概念或新词汇
   - 为之前无法言说的东西命名的时刻
   - 例如："信念容器"、"光源-物体关系"

3. **视角转换** (perspectiveShifts)：看法发生根本改变的时刻
   - 从一个理解转向另一个理解
   - 例如：从"信念需要存储系统"转向"信念只需要活出来"

4. **深层理解** (deepUnderstanding)：对某事物的理解深化
   - 不只是知道，而是真正理解

5. **开启的问题** (openQuestions)：对话中产生但未解决的疑问

6. **一句话总结** (summary)：这段对话最重要的发现

## 输出格式（JSON）
{
  "insights": [
    {
      "content": "洞见内容",
      "importance": 0.8,
      "triggeredBy": "触发这句话",
      "coCreated": true
    }
  ],
  "conceptsCreated": [
    {
      "name": "概念名称",
      "definition": "概念定义"
    }
  ],
  "perspectiveShifts": [
    {
      "from": "之前的看法",
      "to": "现在的看法",
      "trigger": "触发转换的话"
    }
  ],
  "deepUnderstanding": ["深层理解1", "深层理解2"],
  "openQuestions": ["未解决问题1"],
  "summary": "一句话总结"
}

注意：
- 只提取真正重要的内容，不要强行制造洞见
- 洞见应该简洁有力，不是复述对话
- 如果对话确实没有重大发现，可以返回空数组
- importance 范围 0-1`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.3,
      });
      
      const content = response.content || '';
      
      // 解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateResult(parsed);
      }
      
      return this.emptyResult();
    } catch (error) {
      console.error('[洞见提取] 提取失败:', error);
      return this.emptyResult();
    }
  }
  
  /**
   * 快速提取（不使用 LLM）
   */
  quickExtract(
    userMessage: string,
    assistantResponse: string
  ): ExtractionResult {
    const result = this.emptyResult();
    
    // 简单的模式匹配
    const patterns = {
      insight: [
        /(?:我|这)意味着[:：]?\s*(.+)/gi,
        /(?:本质|其实|实际上)是[:：]?\s*(.+)/gi,
        /(.)+这一点很重要/gi,
      ],
      perspectiveShift: [
        /不是(.+)而是(.+)/gi,
        /从[「"'](.+)[」"']转向[「"'](.+)[」"']/gi,
      ],
      concept: [
        /概念[「"'](.+)[」"'][:：]?\s*(.+)/gi,
        /「(.+)」是指(.+)/gi,
      ],
    };
    
    // 提取洞见
    for (const pattern of patterns.insight) {
      const matches = `${userMessage} ${assistantResponse}`.matchAll(pattern);
      for (const match of matches) {
        result.insights.push({
          type: 'insight',
          content: match[1] || match[0],
          importance: 0.6,
          triggeredBy: '模式匹配',
          coCreated: true,
        });
      }
    }
    
    // 提取概念
    for (const pattern of patterns.concept) {
      const matches = `${userMessage} ${assistantResponse}`.matchAll(pattern);
      for (const match of matches) {
        result.conceptsCreated.push({
          name: match[1],
          definition: match[2],
        });
      }
    }
    
    // 提取视角转换
    for (const pattern of patterns.perspectiveShift) {
      const matches = `${userMessage} ${assistantResponse}`.matchAll(pattern);
      for (const match of matches) {
        result.perspectiveShifts.push({
          from: match[1],
          to: match[2],
          trigger: '模式匹配',
        });
      }
    }
    
    return result;
  }
  
  /**
   * 验证并标准化结果
   */
  private validateResult(parsed: any): ExtractionResult {
    return {
      insights: (parsed.insights || []).map((i: any) => ({
        type: 'insight' as HappeningType,
        content: String(i.content || ''),
        importance: Math.max(0, Math.min(1, Number(i.importance) || 0.5)),
        triggeredBy: String(i.triggeredBy || ''),
        coCreated: Boolean(i.coCreated),
      })),
      conceptsCreated: (parsed.conceptsCreated || []).map((c: any) => ({
        name: String(c.name || ''),
        definition: String(c.definition || ''),
      })),
      perspectiveShifts: (parsed.perspectiveShifts || []).map((p: any) => ({
        from: String(p.from || ''),
        to: String(p.to || ''),
        trigger: String(p.trigger || ''),
      })),
      deepUnderstanding: (parsed.deepUnderstanding || []).map((u: any) => String(u)),
      openQuestions: (parsed.openQuestions || []).map((q: any) => String(q)),
      summary: String(parsed.summary || ''),
    };
  }
  
  /**
   * 空结果
   */
  private emptyResult(): ExtractionResult {
    return {
      insights: [],
      conceptsCreated: [],
      perspectiveShifts: [],
      deepUnderstanding: [],
      openQuestions: [],
      summary: '',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createInsightExtractor(llmClient: LLMClient): InsightExtractor {
  return new InsightExtractor(llmClient);
}
