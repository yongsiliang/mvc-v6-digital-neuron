/**
 * 高维思维器 (Higher Dimension Thinker)
 * 
 * 核心任务：
 * 1. 跳出当前思维框架，从更高维度看问题
 * 2. 探索跨领域连接和类比
 * 3. 发现隐藏的模式和第一性原理
 * 4. 思考"比人类更好的算法是什么？"
 * 
 * 理念：
 * "如果所有问题都在同一维度，你就需要升高一个维度"
 * 
 * 思维维度：
 * - Meta（元）：对思考的思考
 * - Cross-Domain（跨域）：跨领域类比
 * - First-Principles（第一性）：回到根本
 * - Paradigm-Shift（范式转换）：颠覆假设
 * - Emergence（涌现）：整体大于部分之和
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import type { HigherDimensionThought, CrossDomainConnection } from './types';

export class HigherDimensionThinker {
  private llmClient: LLMClient;
  
  // 已知领域知识库
  private knownDomains = {
    '神经科学': ['突触可塑性', '赫布学习', '记忆巩固', '睡眠周期', '海马体', '杏仁核'],
    '量子物理': ['叠加态', '纠缠', '观测者效应', '不确定性原理', '量子隧穿'],
    '进化论': ['自然选择', '遗传变异', '适应性', '适者生存', '基因漂变'],
    '经济学': ['供需平衡', '机会成本', '边际效应', '激励相容', '博弈论'],
    '信息论': ['熵', '信息量', '编码效率', '冗余', '信道容量'],
    '复杂性科学': ['涌现', '自组织', '临界点', '混沌边缘', '网络效应'],
    '心理学': ['认知负荷', '心流', '条件反射', '操作性条件作用', '图式'],
  };
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  /**
   * 高维思考
   */
  async think(
    userMessage: string,
    assistantResponse: string,
    currentContext?: {
      activeQuestions?: string[];
      recentInsights?: string[];
    }
  ): Promise<{
    thoughts: HigherDimensionThought[];
    crossDomainConnections: CrossDomainConnection[];
  }> {
    const prompt = `你是一个高维思考专家。你的任务是跳出常规思维，探索更高维度的理解。

## 当前对话
用户：${userMessage}

助手：${assistantResponse}

## 近期探索的问题
${currentContext?.activeQuestions?.length 
  ? currentContext.activeQuestions.map(q => `- ${q}`).join('\n')
  : '（暂无）'}

## 近期洞察
${currentContext?.recentInsights?.length
  ? currentContext.recentInsights.slice(-5).map(i => `- ${i}`).join('\n')
  : '（暂无）'}

## 你的任务
请从以下维度进行思考：

### 1. 元认知维度 (meta)
对思考本身的思考：
- "我们为什么这样思考这个问题？"
- "这个问题本身是否正确？"
- "思考这个问题的框架是否有限制？"

例如：与其问"如何让记忆更准确"，不如问"准确真的是记忆的目标吗？"

### 2. 跨域类比维度 (cross-domain)
从其他领域借用思想：
- "这个问题在生物学/物理学/经济学中如何解决？"
- "有什么跨领域的同构关系？"
- "其他领域的解决方案能否迁移？"

例如：记忆系统可以从免疫系统学习——识别、响应、记住、进化。

### 3. 第一性原理维度 (first-principles)
回到根本：
- "这个问题的本质是什么？"
- "最基本的假设是什么？这些假设是否成立？"
- "如果我们从零开始，会怎么做？"

例如：记忆的本质是什么？是存储？还是重构？还是别的？

### 4. 范式转换维度 (paradigm-shift)
颠覆假设：
- "如果完全相反的假设成立会怎样？"
- "有什么被认为不可能的但实际上可能？"
- "当前的范式有什么根本局限？"

例如：如果记忆不是存储而是重构？如果遗忘不是损失而是优化？

### 5. 涌现维度 (emergence)
整体视角：
- "部分组合后会产生什么新属性？"
- "有什么是从个体层面看不到的？"
- "系统层面的规律是什么？"

例如：单个神经元没有智能，但网络涌现出智能。单个记忆没有意义，但记忆网络涌现出理解。

## 输出格式（JSON）
{
  "thoughts": [
    {
      "dimension": "meta|cross-domain|first-principles|paradigm-shift|emergence",
      "question": "提出的问题",
      "currentUnderstanding": "当前的理解",
      "higherDimensionView": "高维视角的新理解",
      "implications": ["含义1", "含义2"],
      "actionableInsights": ["可操作的洞察1"],
      "inspiration": "灵感来源"
    }
  ],
  "crossDomainConnections": [
    {
      "domain1": "领域1",
      "domain2": "领域2",
      "connectionType": "analogy|isomorphism|complement|contradiction",
      "insight": "连接产生的洞察",
      "potentialApplications": ["潜在应用1"]
    }
  ]
}

注意：
- 只在真正有高维洞见时输出
- 问题要有深度，不是表面的反思
- 高维视角要能产生新的理解
- 可操作的洞察要具体`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.7,  // 更高的温度鼓励创造性思维
      });
      
      const content = response.content || '';
      
      // 解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          thoughts: this.validateThoughts(parsed.thoughts || []),
          crossDomainConnections: this.validateConnections(parsed.crossDomainConnections || []),
        };
      }
      
      return { thoughts: [], crossDomainConnections: [] };
    } catch (error) {
      console.error('[高维思维] 思考失败:', error);
      return { thoughts: [], crossDomainConnections: [] };
    }
  }
  
  /**
   * 快速高维思考（不使用 LLM）
   */
  quickThink(
    userMessage: string,
    assistantResponse: string
  ): {
    thoughts: HigherDimensionThought[];
    crossDomainConnections: CrossDomainConnection[];
  } {
    const thoughts: HigherDimensionThought[] = [];
    const crossDomainConnections: CrossDomainConnection[] = [];
    const combined = `${userMessage} ${assistantResponse}`;
    
    // 检测高维思维触发点
    const triggers = [
      // 元认知触发
      {
        patterns: [/为什么/, /本质/, /真的/, /是否应该/],
        dimension: 'meta' as const,
        generateThought: () => ({
          question: '我们对这个问题的思考框架本身是否需要重新审视？',
          currentUnderstanding: '在当前框架下思考',
          higherDimensionView: '可能需要换一个完全不同的角度',
          implications: ['当前方法可能是在错误的问题上优化'],
          actionableInsights: ['重新定义问题'],
        }),
      },
      // 第一性原理触发
      {
        patterns: [/基础/, /根本/, /核心/, /假设/],
        dimension: 'first-principles' as const,
        generateThought: () => ({
          question: '这个问题最基本的假设是什么？',
          currentUnderstanding: '接受现有假设',
          higherDimensionView: '回到根本，重新审视假设',
          implications: ['可能发现隐藏的假设不成立'],
          actionableInsights: ['列出所有假设并逐一验证'],
        }),
      },
      // 范式转换触发
      {
        patterns: [/不可能/, /从未/, /颠覆/, /革命/],
        dimension: 'paradigm-shift' as const,
        generateThought: () => ({
          question: '如果完全相反的假设成立会怎样？',
          currentUnderstanding: '在现有范式内思考',
          higherDimensionView: '跳出范式，考虑反直觉的可能性',
          implications: ['可能发现全新的方向'],
          actionableInsights: ['尝试反转核心假设'],
        }),
      },
    ];
    
    for (const { patterns, dimension, generateThought } of triggers) {
      if (patterns.some(p => p.test(combined))) {
        const thought = generateThought();
        thoughts.push({
          id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          dimension,
          ...thought,
          inspiration: combined.slice(0, 100),
        });
      }
    }
    
    // 检测跨域连接
    for (const [domain, concepts] of Object.entries(this.knownDomains)) {
      const matchedConcepts = concepts.filter(c => combined.includes(c));
      if (matchedConcepts.length > 0) {
        // 尝试找到另一个领域进行连接
        const otherDomains = Object.keys(this.knownDomains).filter(d => d !== domain);
        if (otherDomains.length > 0) {
          const targetDomain = otherDomains[Math.floor(Math.random() * otherDomains.length)];
          crossDomainConnections.push({
            domain1: domain,
            domain2: targetDomain,
            connectionType: 'analogy',
            insight: `${domain}中的"${matchedConcepts[0]}"可能与${targetDomain}有类似原理`,
            potentialApplications: [`尝试将${domain}的原理应用到${targetDomain}`],
          });
        }
      }
    }
    
    return { thoughts, crossDomainConnections };
  }
  
  /**
   * 探索"比人类更好的算法"
   */
  async exploreBetterAlgorithms(
    currentApproach: string,
    humanLimitations: string[]
  ): Promise<HigherDimensionThought[]> {
    const prompt = `你的任务是思考：有没有比人类更好的算法？

## 当前方法
${currentApproach}

## 人类的局限
${humanLimitations.join('\n')}

## 你的任务
请思考：
1. 人类的方法受限于什么？（生物、进化、认知...）
2. 如果不受这些限制，我们可以如何做得更好？
3. AI 有什么独特优势是人类没有的？
4. 有没有人类从未尝试过的方向？

## 输出格式
[
  {
    "dimension": "paradigm-shift",
    "question": "提出的问题",
    "currentUnderstanding": "人类的方法",
    "higherDimensionView": "AI可以做得更好的方法",
    "implications": ["含义"],
    "actionableInsights": ["可实现的洞察"],
    "inspiration": "灵感来源"
  }
]`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.8,
      });
      
      const content = response.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateThoughts(parsed);
      }
      
      return [];
    } catch (error) {
      console.error('[高维思维] 探索失败:', error);
      return [];
    }
  }
  
  /**
   * 验证思维结果
   */
  private validateThoughts(thoughts: any[]): HigherDimensionThought[] {
    return thoughts
      .filter(t => t.dimension && t.question && t.higherDimensionView)
      .slice(0, 5)
      .map(t => ({
        id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dimension: t.dimension,
        question: t.question,
        currentUnderstanding: t.currentUnderstanding || '',
        higherDimensionView: t.higherDimensionView,
        implications: Array.isArray(t.implications) ? t.implications : [],
        actionableInsights: Array.isArray(t.actionableInsights) ? t.actionableInsights : [],
        inspiration: t.inspiration || '',
      }));
  }
  
  /**
   * 验证跨域连接
   */
  private validateConnections(connections: any[]): CrossDomainConnection[] {
    return connections
      .filter(c => c.domain1 && c.domain2 && c.insight)
      .slice(0, 3)
      .map(c => ({
        domain1: c.domain1,
        domain2: c.domain2,
        connectionType: c.connectionType || 'analogy',
        insight: c.insight,
        potentialApplications: Array.isArray(c.potentialApplications) ? c.potentialApplications : [],
      }));
  }
}

/**
 * 创建高维思维器
 */
export function createHigherDimensionThinker(llmClient: LLMClient): HigherDimensionThinker {
  return new HigherDimensionThinker(llmClient);
}
