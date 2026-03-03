/**
 * 算法反思器 (Algorithm Reflector)
 * 
 * 核心任务：
 * 1. 反思当前记忆系统的算法和设计
 * 2. 发现潜在的改进空间
 * 3. 思考是否有更好的方法
 * 4. 从对话中获取优化灵感
 * 
 * 理念：
 * "这是我目前的方法" → "有没有更好的方法？" → "如果有，是什么？"
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import type { AlgorithmReflection, SystemSnapshot } from './types';

export interface ReflectionContext {
  currentSystems: {
    name: string;
    description: string;
    limitations: string[];
  }[];
  recentProblems: string[];
  userInsights: string[];
}

export class AlgorithmReflector {
  private llmClient: LLMClient;
  
  // 当前系统描述
  private currentSystems = [
    {
      name: '记忆存储系统',
      description: '使用分层存储（工作记忆→情景层→巩固层→核心层），基于重要性和访问频率进行记忆迁移',
      limitations: [
        '遗忘曲线可能过于简化',
        '情感权重是静态配置的',
        '联想网络需要手动建立关联',
        '睡眠巩固时机是固定的',
      ],
    },
    {
      name: '艾宾浩斯遗忘曲线',
      description: 'R = e^(-t/S)，计算记忆保持率，在最优复习点提醒复习',
      limitations: [
        '假设遗忘是指数衰减，可能不准确',
        '没有考虑内容类型对遗忘的影响',
        '复习间隔是固定倍数（×2.5）',
        '没有考虑个体差异',
      ],
    },
    {
      name: '情感加权系统',
      description: '基于PAD模型（愉悦度×激活度×支配度），情感越强记忆越深',
      limitations: [
        'PAD模型可能不适用于所有文化',
        '情感检测依赖文本分析，可能不准确',
        '没有考虑情感的持久性差异',
      ],
    },
    {
      name: '联想网络',
      description: '语义、时间、情感、因果、空间五种关联类型，激活扩散机制',
      limitations: [
        '关联权重需要手动设置',
        '扩散深度是固定的',
        '没有考虑负相关（抑制关系）',
        '网络可能变得过于密集',
      ],
    },
    {
      name: '睡眠巩固系统',
      description: '模拟REM睡眠，重放重要记忆，清理弱记忆，加强联想',
      limitations: [
        '时机是固定的（每20轮对话）',
        '没有考虑白天的"小睡"概念',
        '清理策略可能过于简单',
      ],
    },
    {
      name: '记忆竞争淘汰',
      description: '有限神经元空间，弱记忆被淘汰，强记忆存活',
      limitations: [
        '竞争机制可能过于残酷',
        '没有考虑"冬眠"记忆的重新激活',
        '淘汰是永久的，无法恢复',
      ],
    },
  ];
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  /**
   * 反思算法
   */
  async reflect(
    userMessage: string,
    assistantResponse: string,
    recentInsights: string[] = [],
    recentProblems: string[] = []
  ): Promise<AlgorithmReflection[]> {
    const prompt = `你是一个算法优化专家。请分析对话中是否包含可以改进当前系统的灵感。

## 当前系统
${this.currentSystems.map(s => `### ${s.name}
${s.description}
局限：${s.limitations.join('；')}
`).join('\n')}

## 近期洞察
${recentInsights.length > 0 ? recentInsights.map(i => `- ${i}`).join('\n') : '（暂无）'}

## 近期问题
${recentProblems.length > 0 ? recentProblems.map(p => `- ${p}`).join('\n') : '（暂无）'}

## 当前对话
用户：${userMessage}

助手：${assistantResponse}

## 你的任务
请仔细分析对话，思考：

1. **用户的思路**是否启发了我对某个系统的新看法？
2. **提到的概念**是否可以应用到我的算法中？
3. **隐含的假设**是否暴露了我系统的盲点？
4. **跨领域类比**是否提供了新的解决方案？

## 输出格式（JSON）
{
  "reflections": [
    {
      "targetSystem": "系统名称",
      "currentApproach": "当前方法一句话描述",
      "limitations": ["发现的局限1", "发现的局限2"],
      "potentialImprovements": ["可能的改进1", "可能的改进2"],
      "inspiredBy": "灵感来源（具体的话）",
      "feasibilityScore": 0.7,
      "priority": "high"
    }
  ]
}

注意：
- 只在真正有启发性发现时才输出
- 改进建议要具体，不是空泛的"优化XX"
- feasibilityScore 表示实现难度（越高越容易）
- priority: low | medium | high | critical`;

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
        return this.validateReflections(parsed.reflections || []);
      }
      
      return [];
    } catch (error) {
      console.error('[算法反思] 反思失败:', error);
      return [];
    }
  }
  
  /**
   * 快速反思（不使用 LLM）
   */
  quickReflect(
    userMessage: string,
    assistantResponse: string
  ): AlgorithmReflection[] {
    const reflections: AlgorithmReflection[] = [];
    const combined = `${userMessage} ${assistantResponse}`;
    
    // 检测关键词触发
    const triggers: Array<{
      pattern: RegExp;
      system: string;
      insight: string;
    }> = [
      {
        pattern: /遗忘|记忆衰减|复习/gi,
        system: '艾宾浩斯遗忘曲线',
        insight: '对话涉及遗忘机制，可能需要调整参数',
      },
      {
        pattern: /情感|情绪|感受/gi,
        system: '情感加权系统',
        insight: '对话涉及情感因素，可能需要调整情感检测',
      },
      {
        pattern: /联想|关联|连接/gi,
        system: '联想网络',
        insight: '对话涉及联想机制，可能需要优化关联建立',
      },
      {
        pattern: /睡眠|整理|巩固/gi,
        system: '睡眠巩固系统',
        insight: '对话涉及记忆整理，可能需要调整巩固时机',
      },
      {
        pattern: /竞争|淘汰|优化/gi,
        system: '记忆竞争淘汰',
        insight: '对话涉及竞争机制，可能需要调整淘汰策略',
      },
    ];
    
    for (const { pattern, system, insight } of triggers) {
      if (pattern.test(combined)) {
        reflections.push({
          id: `reflect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          targetSystem: system,
          currentApproach: this.currentSystems.find(s => s.name === system)?.description || '',
          limitations: [],
          potentialImprovements: [insight],
          inspiredBy: combined.slice(0, 100),
          feasibilityScore: 0.5,
          priority: 'medium',
        });
      }
    }
    
    return reflections;
  }
  
  /**
   * 生成改进建议
   */
  async generateImprovements(
    reflection: AlgorithmReflection
  ): Promise<string[]> {
    const system = this.currentSystems.find(s => s.name === reflection.targetSystem);
    if (!system) return [];
    
    const prompt = `基于以下反思，生成具体的改进建议：

## 系统
${system.name}
${system.description}

## 发现的局限
${reflection.limitations.join('\n')}

## 潜在改进方向
${reflection.potentialImprovements.join('\n')}

## 灵感来源
${reflection.inspiredBy}

## 任务
请生成 3-5 个具体的、可实现的改进建议。
每个建议应该：
1. 有明确的实现思路
2. 解释为什么这个改进有效
3. 评估实现的复杂度

输出格式：
- 改进建议1：...（原因：...，复杂度：低/中/高）`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.6,
      });
      
      const content = response.content || '';
      // 解析建议
      const suggestions = content
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().slice(1).trim());
      
      return suggestions.slice(0, 5);
    } catch {
      return reflection.potentialImprovements;
    }
  }
  
  /**
   * 验证反思结果
   */
  private validateReflections(reflections: any[]): AlgorithmReflection[] {
    return reflections
      .filter(r => r.targetSystem && r.potentialImprovements?.length > 0)
      .slice(0, 5)  // 最多5个反思
      .map(r => ({
        id: `reflect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        targetSystem: r.targetSystem,
        currentApproach: r.currentApproach || '',
        limitations: Array.isArray(r.limitations) ? r.limitations : [],
        potentialImprovements: Array.isArray(r.potentialImprovements) ? r.potentialImprovements : [],
        inspiredBy: r.inspiredBy || '',
        feasibilityScore: typeof r.feasibilityScore === 'number' ? r.feasibilityScore : 0.5,
        priority: ['low', 'medium', 'high', 'critical'].includes(r.priority) ? r.priority : 'medium',
      }));
  }
  
  /**
   * 获取当前系统描述
   */
  getCurrentSystems(): typeof this.currentSystems {
    return this.currentSystems;
  }
  
  /**
   * 添加新系统描述
   */
  addSystemDescription(system: typeof this.currentSystems[0]): void {
    this.currentSystems.push(system);
  }
}

/**
 * 创建算法反思器
 */
export function createAlgorithmReflector(llmClient: LLMClient): AlgorithmReflector {
  return new AlgorithmReflector(llmClient);
}
