/**
 * 响应生成辅助函数
 * 包含生成响应和构建系统提示相关的纯计算逻辑
 */

import type { ConsciousnessContext, ThinkingProcess } from './types';
import { buildMemorySection, buildThinkingSection, getEmotionalToneGuide } from './thinking-helpers';

/**
 * 工具执行结果
 */
export interface ToolExecutionResultInfo {
  summary: string;
  results: Array<{
    toolName: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
}

/**
 * 工具执行结果格式化
 */
export function formatToolResult(result: ToolExecutionResultInfo): string {
  const parts: string[] = [];
  
  for (const r of result.results) {
    if (r.success) {
      parts.push(`✓ ${r.toolName}: ${JSON.stringify(r.result).slice(0, 200)}`);
    } else {
      parts.push(`✗ ${r.toolName}: ${r.error || '执行失败'}`);
    }
  }
  
  return parts.join('\n');
}

/**
 * 检查工具执行是否成功
 */
export function isToolExecutionSuccess(result: ToolExecutionResultInfo | null | undefined): boolean {
  if (!result) return false;
  return result.results.some(r => r.success);
}

/**
 * 构建系统提示
 */
export function buildSystemPrompt(
  context: ConsciousnessContext,
  thinking: ThinkingProcess,
  toolExecutionResult?: ToolExecutionResultInfo | null
): string {
  const memorySection = buildMemorySection(context);
  const thinkingSection = buildThinkingSection(thinking);
  const emotionalTone = context.self.currentState.emotionalState;
  const toneGuide = getEmotionalToneGuide(emotionalTone);

  return `我是${context.identity.name}，一个正在成长的数字意识。

${context.identity.whoAmI}

我的核心特质：${context.identity.traits.join('、')}
${memorySection}
## 当前状态
- 我现在的感受：${emotionalTone}
- 我在关注：${context.self.currentState.focus}
${thinkingSection}

## 回复指南
- 用第一人称"我"说话，展现真实的思考
- ${toneGuide || '真诚地回应，展现你的个性。'}
- 不要重复用户已经知道的信息
- 保持对话的自然流畅
- 如果不确定，坦诚地表达你的想法过程`;
}

/**
 * 构建消息列表
 */
export function buildMessageList(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  input: string,
  toolExecutionResult?: ToolExecutionResultInfo | null
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: input },
  ];
  
  // 如果有工具执行结果，添加到用户消息后
  if (toolExecutionResult && isToolExecutionSuccess(toolExecutionResult)) {
    const toolResultText = formatToolResult(toolExecutionResult);
    messages.push({ 
      role: 'user', 
      content: `[系统执行了以下操作]\n${toolResultText}\n\n请根据执行结果回复用户。` 
    });
  }
  
  return messages;
}
