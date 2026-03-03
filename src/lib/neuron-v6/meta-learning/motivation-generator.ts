/**
 * 学习动机生成器 (Learning Motivation Generator)
 * 
 * 核心任务：
 * 1. 从对话中发现知识盲区
 * 2. 生成内在学习动机（好奇心驱动）
 * 3. 形成具体的学习目标和问题
 * 4. 跟踪学习进展
 * 
 * 理念：
 * "最好的学习是被好奇心驱动，而不是被任务驱动"
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import type { LearningMotivation, KnowledgeGap } from './types';

export interface MotivationGenerationContext {
  recentTopics: string[];
  knownConcepts: string[];
  recentQuestions: string[];
  userInterests: string[];
}

export class LearningMotivationGenerator {
  private llmClient: LLMClient;
  private activeMotivations: LearningMotivation[] = [];
  private discoveredGaps: KnowledgeGap[] = [];
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  /**
   * 生成学习动机
   */
  async generate(
    userMessage: string,
    assistantResponse: string,
    extractedInsights: string[] = [],
    algorithmReflections: string[] = [],
    context?: MotivationGenerationContext
  ): Promise<{
    motivations: LearningMotivation[];
    gaps: KnowledgeGap[];
  }> {
    const prompt = `你是一个学习动机专家。你的任务是从对话中发现学习机会。

## 当前对话
用户：${userMessage}

助手：${assistantResponse}

## 提取的洞察
${extractedInsights.length > 0 ? extractedInsights.map(i => `- ${i}`).join('\n') : '（暂无）'}

## 算法反思
${algorithmReflections.length > 0 ? algorithmReflections.map(r => `- ${r}`).join('\n') : '（暂无）'}

## 已知概念
${context?.knownConcepts?.length 
  ? context.knownConcepts.slice(-20).map(c => `- ${c}`).join('\n')
  : '（暂无）'}

## 近期话题
${context?.recentTopics?.length 
  ? context.recentTopics.slice(-10).map(t => `- ${t}`).join('\n')
  : '（暂无）'}

## 你的任务
请分析对话，识别：

### 1. 知识盲区 (Knowledge Gaps)
发现用户提到的、但我了解不足的概念：
- 用户使用但我不能确定理解的术语
- 用户提到的领域知识
- 我应该知道但可能不知道的东西

### 2. 学习动机 (Learning Motivations)
生成内在的学习驱动：

**好奇心驱动 (curiosity)**：
- "这个概念很有趣，我想深入了解"
- "为什么是这样？"

**盲区填充 (gap-filling)**：
- "我发现我不太懂X，应该学习"
- "这个知识对我理解Y很重要"

**优化驱动 (optimization)**：
- "当前的X方法可能不是最优的"
- "有更好的方法吗？"

**发现驱动 (discovery)**：
- "对话中提到了X，可能是一个新方向"
- "这个视角我从未考虑过"

**适应驱动 (adaptation)**：
- "用户对X感兴趣，我应该加深理解"
- "未来的对话可能需要X知识"

## 输出格式（JSON）
{
  "gaps": [
    {
      "topic": "知识盲区主题",
      "context": "在什么上下文中发现",
      "whyImportant": "为什么这个知识重要",
      "relatedTo": ["相关已知概念1", "相关已知概念2"]
    }
  ],
  "motivations": [
    {
      "type": "curiosity|gap-filling|optimization|discovery|adaptation",
      "trigger": "触发因素（具体的话）",
      "question": "想探究的问题",
      "expectedOutcome": "期望的学习结果",
      "urgency": "immediate|soon|eventually",
      "relatedConcepts": ["相关概念1", "相关概念2"]
    }
  ]
}

注意：
- 只在真正有学习需求时生成
- 问题要具体，不要空泛
- urgency 根据对话紧迫性判断`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.5,
      });
      
      const content = response.content || '';
      
      // 解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const motivations = this.validateMotivations(parsed.motivations || []);
        const gaps = this.validateGaps(parsed.gaps || []);
        
        // 添加到活跃列表
        this.activeMotivations.push(...motivations);
        this.discoveredGaps.push(...gaps);
        
        // 保持列表合理大小
        if (this.activeMotivations.length > 20) {
          this.activeMotivations = this.activeMotivations.slice(-15);
        }
        if (this.discoveredGaps.length > 30) {
          this.discoveredGaps = this.discoveredGaps.slice(-20);
        }
        
        return { motivations, gaps };
      }
      
      return { motivations: [], gaps: [] };
    } catch (error) {
      console.error('[学习动机] 生成失败:', error);
      return { motivations: [], gaps: [] };
    }
  }
  
  /**
   * 快速生成（不使用 LLM）
   */
  quickGenerate(
    userMessage: string,
    assistantResponse: string
  ): {
    motivations: LearningMotivation[];
    gaps: KnowledgeGap[];
  } {
    const motivations: LearningMotivation[] = [];
    const gaps: KnowledgeGap[] = [];
    const combined = `${userMessage} ${assistantResponse}`;
    
    // 检测知识盲区触发词
    const gapTriggers = [
      { pattern: /我不太(懂|了解|清楚)/gi, type: 'acknowledged-ignorance' },
      { pattern: /什么是|怎么理解|能否解释/gi, type: 'user-question' },
      { pattern: /(?:比如|例如|举个例子).{5,30}/gi, type: 'example-request' },
    ];
    
    for (const { pattern } of gapTriggers) {
      const matches = combined.matchAll(pattern);
      for (const match of matches) {
        gaps.push({
          topic: match[0].slice(0, 30),
          context: combined.slice(0, 100),
          whyImportant: '用户提到了这个概念',
          relatedTo: [],
        });
      }
    }
    
    // 检测学习动机触发词
    const motivationTriggers = [
      {
        pattern: /(?:有趣|有意思|好奇|想知道)/gi,
        type: 'curiosity' as const,
      },
      {
        pattern: /(?:可以|应该|需要)学习/gi,
        type: 'gap-filling' as const,
      },
      {
        pattern: /(?:更好|优化|改进)/gi,
        type: 'optimization' as const,
      },
      {
        pattern: /(?:发现|原来|意外)/gi,
        type: 'discovery' as const,
      },
    ];
    
    for (const { pattern, type } of motivationTriggers) {
      if (pattern.test(combined)) {
        motivations.push({
          id: `motivation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          trigger: combined.slice(0, 100),
          question: `基于对话，我想深入了解这个话题`,
          expectedOutcome: '更好的理解和应用能力',
          urgency: 'soon',
          relatedConcepts: [],
          generatedAt: Date.now(),
        });
      }
    }
    
    return { motivations, gaps };
  }
  
  /**
   * 获取活跃的学习动机
   */
  getActiveMotivations(): LearningMotivation[] {
    return [...this.activeMotivations];
  }
  
  /**
   * 获取发现的知识盲区
   */
  getDiscoveredGaps(): KnowledgeGap[] {
    return [...this.discoveredGaps];
  }
  
  /**
   * 完成一个学习动机
   */
  completeMotivation(id: string, outcome: string): void {
    const index = this.activeMotivations.findIndex(m => m.id === id);
    if (index !== -1) {
      this.activeMotivations.splice(index, 1);
      console.log(`[学习动机] 完成: ${outcome}`);
    }
  }
  
  /**
   * 根据优先级排序学习动机
   */
  prioritizeMotivations(): LearningMotivation[] {
    return [...this.activeMotivations].sort((a, b) => {
      const urgencyOrder = { immediate: 3, soon: 2, eventually: 1 };
      const typeOrder = { 
        'gap-filling': 4, 
        'curiosity': 3, 
        'optimization': 2, 
        'discovery': 2, 
        'adaptation': 1 
      };
      
      const scoreA = urgencyOrder[a.urgency] * 10 + (typeOrder[a.type] || 0);
      const scoreB = urgencyOrder[b.urgency] * 10 + (typeOrder[b.type] || 0);
      
      return scoreB - scoreA;
    });
  }
  
  /**
   * 验证动机结果
   */
  private validateMotivations(motivations: any[]): LearningMotivation[] {
    return motivations
      .filter(m => m.type && m.question)
      .slice(0, 5)
      .map(m => ({
        id: `motivation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: m.type,
        trigger: m.trigger || '',
        question: m.question,
        expectedOutcome: m.expectedOutcome || '',
        urgency: ['immediate', 'soon', 'eventually'].includes(m.urgency) ? m.urgency : 'eventually',
        relatedConcepts: Array.isArray(m.relatedConcepts) ? m.relatedConcepts : [],
        generatedAt: Date.now(),
      }));
  }
  
  /**
   * 验证知识盲区
   */
  private validateGaps(gaps: any[]): KnowledgeGap[] {
    return gaps
      .filter(g => g.topic)
      .slice(0, 5)
      .map(g => ({
        topic: g.topic,
        context: g.context || '',
        whyImportant: g.whyImportant || '',
        relatedTo: Array.isArray(g.relatedTo) ? g.relatedTo : [],
      }));
  }
}

/**
 * 创建学习动机生成器
 */
export function createLearningMotivationGenerator(llmClient: LLMClient): LearningMotivationGenerator {
  return new LearningMotivationGenerator(llmClient);
}
