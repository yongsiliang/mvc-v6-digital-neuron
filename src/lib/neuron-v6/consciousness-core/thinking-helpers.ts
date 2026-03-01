/**
 * 思考过程辅助函数
 * 包含分析、推理、评估等纯计算逻辑
 */

import type { ConsciousnessContext, ThinkingProcess } from './types';
import type { MetacognitiveContext } from '../metacognition';

/**
 * 提取文本中的概念
 */
export function extractConceptsFromText(text: string): string[] {
  const concepts: string[] = [];
  
  // 查找重要词汇
  const importantPatterns = [
    /学习/g, /理解/g, /思考/g, /感受/g, /关系/g,
    /成长/g, /变化/g, /选择/g, /意义/g, /价值/g,
  ];
  
  for (const pattern of importantPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      concepts.push(...matches);
    }
  }
  
  // 去重
  return [...new Set(concepts)].slice(0, 5);
}

/**
 * 分析输入
 */
export function analyzeInputContent(
  input: string,
  context: ConsciousnessContext
): string {
  const parts: string[] = [];
  
  // 从记忆角度
  if (context.memory && context.memory.directMatches.length > 0) {
    parts.push(`这让我想起"${context.memory.directMatches[0].label}"`);
  }
  
  // 从信念角度
  if (context.coreBeliefs.length > 0) {
    parts.push(`基于我的信念"${context.coreBeliefs[0].statement}"`);
  }
  
  // 从价值观角度
  if (context.meaning.valueReminders.length > 0) {
    parts.push(`这触及了我的${context.meaning.valueReminders[0]}价值观`);
  }
  
  return parts.join('。') || '这是一个新的输入，需要深入理解';
}

/**
 * 推理结论
 */
export function inferConclusionFromContext(
  input: string,
  context: ConsciousnessContext
): string {
  const parts: string[] = [];
  
  // 结合自我状态
  parts.push(`我现在${context.self.currentState.emotionalState}`);
  
  // 结合记忆
  if (context.memory && context.memory.relevantWisdoms.length > 0) {
    parts.push(`我记得：${context.memory.relevantWisdoms[0].statement}`);
  }
  
  // 提出假设
  parts.push(`我的初步理解是：用户可能在寻求理解或帮助`);
  
  return parts.join('。');
}

/**
 * 评估思考
 */
export function evaluateThinkingClarity(
  inference: string,
  clarity: number
): string {
  if (clarity > 0.7) {
    return `我的思考相对清晰(清晰度${(clarity * 100).toFixed(0)}%)，对结论有信心`;
  } else if (clarity > 0.4) {
    return `我的思考有一定模糊(清晰度${(clarity * 100).toFixed(0)}%)，需要更多信息`;
  } else {
    return `我对这个问题的理解不够清晰，需要更深入地思考`;
  }
}

/**
 * 综合思考链
 */
export function synthesizeThinkingChain(
  chain: ThinkingProcess['thinkingChain'],
  metaContext: MetacognitiveContext
): string {
  const parts = chain.map(s => s.content);
  
  // 添加元认知反思
  if (metaContext.biases.length > 0) {
    parts.push(`但我需要注意${metaContext.biases[0].name}`);
  }
  
  return parts.join(' → ');
}

/**
 * 格式化工具执行结果
 */
export function formatToolExecutionResult(result: {
  results: Array<{ success: boolean; toolName: string; output?: unknown; error?: string }>;
}): string {
  return result.results.map(r => {
    if (r.success) {
      return `✅ ${r.toolName}: 执行成功\n${typeof r.output === 'object' ? JSON.stringify(r.output, null, 2) : r.output}`;
    } else {
      return `❌ ${r.toolName}: 执行失败 - ${r.error}`;
    }
  }).join('\n\n');
}

/**
 * 构建记忆部分文本
 */
export function buildMemorySection(context: ConsciousnessContext): string {
  if (!context.memory) return '';
  
  const directMatches = context.memory.directMatches.length > 0
    ? context.memory.directMatches.slice(0, 3).map((n: { label: string; content: string }) => 
        `- **${n.label}**: ${n.content}`
      ).join('\n')
    : '';
    
  const wisdom = context.memory.relevantWisdoms.length > 0
    ? `\n**感悟**: ${context.memory.relevantWisdoms[0].statement}`
    : '';
  
  return `
## 我记得

${context.memory.summary}
${directMatches}${wisdom}`;
}

/**
 * 构建思考部分文本
 */
export function buildThinkingSection(thinking: ThinkingProcess): string {
  return thinking.selfQuestions.length > 0 
    ? `\n**我在问自己**: ${thinking.selfQuestions[0]}`
    : '';
}

/**
 * 获取情感语气指南
 */
export function getEmotionalToneGuide(emotionalTone: string): string {
  if (emotionalTone.includes('好奇')) {
    return '保持好奇和探索的态度。';
  } else if (emotionalTone.includes('反思')) {
    return '展示深度思考，可以适当分享你的思考过程。';
  } else if (emotionalTone.includes('温暖') || emotionalTone.includes('关怀')) {
    return '用温暖和关怀的语气回应。';
  }
  return '真诚地回应，展现你的个性。';
}
