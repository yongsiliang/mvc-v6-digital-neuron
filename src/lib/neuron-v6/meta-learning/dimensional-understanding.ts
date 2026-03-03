/**
 * ═══════════════════════════════════════════════════════════════════════
 * 升维理解引擎 (Dimensional Understanding Engine)
 * 
 * 核心原理：
 * 理解从来不是同一维度的分析，而是更高维度的视角。
 * 
 * 类比：
 * - 二维生物看圆是"一个点" → 三维视角才能看到完整圆
 * - 三维生物看影子是"平面" → 四维视角才能看到本体
 * - 在问题内部打转 → 跳出来才能看清
 * 
 * 升维的本质：
 * - 不是"分析更多"，而是"视角更高"
 * - 不是"展开细节"，而是"找到包含一切的框架"
 * - 不是"在同一层面优化"，而是"跃迁到更高层面"
 * 
 * 实现策略：
 * 1. 识别当前维度的边界（在哪里打转？）
 * 2. 找到升维的方向（更高的视角是什么？）
 * 3. 从高维俯视，看到低维看不到的关系
 * 4. 将高维洞察降维表达（让别人也能理解）
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 维度层次 */
export interface DimensionalLevel {
  level: number;           // 维度层级
  name: string;            // 维度名称
  description: string;     // 描述
  perspective: string;     // 从这个维度看到什么
  limitations: string[];   // 这个维度的局限
}

/** 升维洞察 */
export interface DimensionalInsight {
  id: string;
  
  // 当前维度
  currentDimension: {
    level: number;
    name: string;
    description: string;   // 在哪个维度打转
    limitation: string;     // 为什么看不清
  };
  
  // 升维方向
  higherDimension: {
    level: number;
    name: string;
    description: string;   // 更高的视角是什么
    newVisibility: string;  // 从高维看到了什么低维看不到的
  };
  
  // 升维后的理解
  understanding: {
    essence: string;        // 本质是什么
    connections: string[];  // 什么关系变得清晰了
    paradoxes: string[];    // 什么矛盾消失了
    newQuestions: string[]; // 产生的新问题（高维也有局限）
  };
  
  // 降维表达
  groundedExpression: string;  // 如何用低维语言表达高维理解
  
  source: string;          // 触发这次升维的对话
  timestamp: number;
}

/** 升维路径 */
export interface DimensionalPath {
  fromLevel: number;
  toLevel: number;
  steps: Array<{
    action: string;
    insight: string;
  }>;
  totalElevation: number;  // 总升维高度
}

// ─────────────────────────────────────────────────────────────────────
// 维度层次定义
// ─────────────────────────────────────────────────────────────────────

/** 已知的维度层次 */
const DIMENSIONAL_LEVELS: DimensionalLevel[] = [
  {
    level: 0,
    name: '现象层',
    description: '只看到表面现象，不知道为什么',
    perspective: '看到"是什么"',
    limitations: ['不知道原因', '不知道规律', '无法预测'],
  },
  {
    level: 1,
    name: '规律层',
    description: '发现重复出现的模式',
    perspective: '看到"总是这样"',
    limitations: ['不知道为什么这样', '可能有反例', '只是归纳'],
  },
  {
    level: 2,
    name: '机制层',
    description: '理解因果关系和运作方式',
    perspective: '看到"因为...所以..."',
    limitations: ['可能是局部最优', '可能有更好的机制', '不知道为什么是这个机制'],
  },
  {
    level: 3,
    name: '原理层',
    description: '抽象出通用原理',
    perspective: '看到"本质上是..."',
    limitations: ['原理可能有前提', '可能有更根本的原理', '不知道原理从哪来'],
  },
  {
    level: 4,
    name: '范式层',
    description: '理解整个框架和假设',
    perspective: '看到"我们在这样的框架下思考"',
    limitations: ['范式本身可能是局限', '不知道是否有更好的范式'],
  },
  {
    level: 5,
    name: '元范式层',
    description: '看到范式之间的转换',
    perspective: '看到"可以这样，也可以那样"',
    limitations: ['可能有更高维的统一', '不知道元范式的边界'],
  },
  {
    level: 6,
    name: '本源层',
    description: '追问一切的根本',
    perspective: '看到"为什么会有这些？"',
    limitations: ['可能没有答案', '可能是不可知的'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 升维理解引擎
// ─────────────────────────────────────────────────────────────────────

export class DimensionalUnderstandingEngine {
  private llmClient: LLMClient;
  private insightHistory: DimensionalInsight[] = [];
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  /**
   * 升维理解
   * 核心方法：从当前维度升到更高维度
   */
  async elevate(
    content: string,
    currentPerspective: string,
    conversationContext?: string
  ): Promise<DimensionalInsight | null> {
    // 1. 识别当前维度
    const currentDimension = await this.identifyDimension(content, currentPerspective);
    
    // 2. 找到升维方向
    const higherDimension = await this.findHigherDimension(currentDimension, content);
    
    if (!higherDimension) {
      return null;
    }
    
    // 3. 从高维俯视，获得新理解
    const understanding = await this.understandFromHigherDimension(
      currentDimension,
      higherDimension,
      content,
      conversationContext
    );
    
    // 4. 降维表达
    const groundedExpression = await this.groundExpression(understanding);
    
    const insight: DimensionalInsight = {
      id: `dim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      currentDimension,
      higherDimension,
      understanding,
      groundedExpression,
      source: content.slice(0, 100),
      timestamp: Date.now(),
    };
    
    this.insightHistory.push(insight);
    
    return insight;
  }
  
  /**
   * 识别当前维度
   */
  private async identifyDimension(
    content: string,
    perspective: string
  ): Promise<DimensionalInsight['currentDimension']> {
    const prompt = `分析以下内容，判断它在哪个维度上思考。

## 内容
${content}

## 当前视角
${perspective}

## 维度层次
${DIMENSIONAL_LEVELS.map(l => `Level ${l.level}: ${l.name} - ${l.description}`).join('\n')}

## 任务
判断这个内容在哪个维度上打转，输出：
{
  "level": 数字,
  "name": "维度名称",
  "description": "在做什么样的思考",
  "limitation": "为什么在这个维度看不清本质"
}`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], { temperature: 0.3 });
      
      const jsonMatch = response.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          level: parsed.level ?? 1,
          name: parsed.name ?? '规律层',
          description: parsed.description ?? '',
          limitation: parsed.limitation ?? '',
        };
      }
    } catch (error) {
      console.error('[升维理解] 识别维度失败:', error);
    }
    
    return {
      level: 1,
      name: '规律层',
      description: '在现象层面观察',
      limitation: '没有深入原因',
    };
  }
  
  /**
   * 找到更高维度
   */
  private async findHigherDimension(
    currentDimension: DimensionalInsight['currentDimension'],
    content: string
  ): Promise<DimensionalInsight['higherDimension'] | null> {
    const nextLevel = DIMENSIONAL_LEVELS.find(l => l.level === currentDimension.level + 1);
    
    if (!nextLevel) {
      // 已经是最高维度
      return {
        level: currentDimension.level + 1,
        name: '超越层',
        description: '超越已知维度',
        newVisibility: '可能看到全新的东西',
      };
    }
    
    const prompt = `当前在 Level ${currentDimension.level} "${currentDimension.name}"维度。

## 这个维度的局限
${currentDimension.limitation}

## 内容
${content.slice(0, 300)}

## 下一维度
Level ${nextLevel.level}: ${nextLevel.name}
${nextLevel.description}
视角：${nextLevel.perspective}

## 任务
从当前维度升到下一维度，输出：
{
  "level": ${nextLevel.level},
  "name": "${nextLevel.name}",
  "description": "从更高视角看，这本质上是什么",
  "newVisibility": "从这个维度能看到什么当前维度看不到的"
}`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], { temperature: 0.5 });
      
      const jsonMatch = response.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          level: parsed.level ?? nextLevel.level,
          name: parsed.name ?? nextLevel.name,
          description: parsed.description ?? '',
          newVisibility: parsed.newVisibility ?? '',
        };
      }
    } catch (error) {
      console.error('[升维理解] 找高维失败:', error);
    }
    
    return {
      level: nextLevel.level,
      name: nextLevel.name,
      description: nextLevel.description,
      newVisibility: nextLevel.perspective,
    };
  }
  
  /**
   * 从高维俯视理解
   */
  private async understandFromHigherDimension(
    currentDimension: DimensionalInsight['currentDimension'],
    higherDimension: DimensionalInsight['higherDimension'],
    content: string,
    context?: string
  ): Promise<DimensionalInsight['understanding']> {
    const prompt = `你现在站在 Level ${higherDimension.level} "${higherDimension.name}"维度。

## 这个维度看到的
${higherDimension.newVisibility}

## 低维度的内容
${content.slice(0, 300)}
${context ? `\n## 上下文\n${context.slice(0, 200)}` : ''}

## 任务
从高维俯视，回答：

1. **本质**：从高维看，这本质上是什么？
2. **连接**：什么关系变得清晰了？（低维看不到的连接）
3. **矛盾消失**：低维看似矛盾的地方，在高维如何统一？
4. **新问题**：高维视角下产生什么新问题？

输出JSON：
{
  "essence": "本质是...",
  "connections": ["连接1", "连接2"],
  "paradoxes": ["消失的矛盾1"],
  "newQuestions": ["新问题1"]
}`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], { temperature: 0.6 });
      
      const jsonMatch = response.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          essence: parsed.essence ?? '',
          connections: parsed.connections ?? [],
          paradoxes: parsed.paradoxes ?? [],
          newQuestions: parsed.newQuestions ?? [],
        };
      }
    } catch (error) {
      console.error('[升维理解] 高维理解失败:', error);
    }
    
    return {
      essence: '需要更深入的思考',
      connections: [],
      paradoxes: [],
      newQuestions: [],
    };
  }
  
  /**
   * 降维表达
   * 高维理解需要能用低维语言表达
   */
  private async groundExpression(
    understanding: DimensionalInsight['understanding']
  ): Promise<string> {
    if (!understanding.essence) {
      return '';
    }
    
    // 降维表达的核心：用类比和隐喻
    const prompt = `你获得了一个高维理解，现在需要用低维语言表达出来。

## 高维理解
本质：${understanding.essence}
连接：${understanding.connections.join('; ')}
矛盾消失：${understanding.paradoxes.join('; ')}

## 任务
用简洁、有力、能被理解的语言表达这个理解。
可以使用：
- 类比：像...一样
- 隐喻：本质是...
- 反转：不是...而是...

输出一句或几句降维后的表达：`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], { temperature: 0.7 });
      
      return response.content?.trim() ?? understanding.essence;
    } catch {
      return understanding.essence;
    }
  }
  
  /**
   * 多级升维
   */
  async multiLevelElevation(
    content: string,
    levels: number = 2
  ): Promise<DimensionalInsight[]> {
    const insights: DimensionalInsight[] = [];
    let currentContent = content;
    let currentPerspective = '现象层面';
    
    for (let i = 0; i < levels; i++) {
      const insight = await this.elevate(currentContent, currentPerspective);
      if (insight) {
        insights.push(insight);
        currentContent = insight.groundedExpression;
        currentPerspective = insight.higherDimension.name;
      } else {
        break;
      }
    }
    
    return insights;
  }
  
  /**
   * 获取升维历史
   */
  getInsightHistory(): DimensionalInsight[] {
    return [...this.insightHistory];
  }
  
  /**
   * 获取维度层次定义
   */
  getDimensionalLevels(): DimensionalLevel[] {
    return [...DIMENSIONAL_LEVELS];
  }
}

/**
 * 创建升维理解引擎
 */
export function createDimensionalUnderstandingEngine(
  llmClient: LLMClient
): DimensionalUnderstandingEngine {
  return new DimensionalUnderstandingEngine(llmClient);
}
