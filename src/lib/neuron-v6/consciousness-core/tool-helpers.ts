/**
 * 工具处理辅助函数
 * 包含工具意图识别和执行相关的纯计算逻辑
 */

import type { ToolIntentRecognizer } from '../tool-intent-recognizer';

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  summary: string;
  results: Array<{
    toolName: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
}

/**
 * 工具意图
 */
export interface ToolIntent {
  needsTool: boolean;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

/**
 * 工具处理参数
 */
export interface ToolProcessParams {
  input: string;
  toolIntentRecognizer: ToolIntentRecognizer;
}

/**
 * 工具处理结果
 */
export interface ToolProcessResult {
  toolExecutionResult: ToolExecutionResult | null;
  toolIntent: ToolIntent | null;
}

/**
 * 识别和执行工具调用
 */
export async function recognizeAndExecuteTools(
  params: ToolProcessParams
): Promise<ToolProcessResult> {
  const { input, toolIntentRecognizer } = params;
  
  let toolExecutionResult: ToolExecutionResult | null = null;
  let toolIntent: ToolIntent | null = null;
  
  try {
    toolIntent = await toolIntentRecognizer.analyzeIntent(input);
    
    if (toolIntent.needsTool && toolIntent.toolCalls && toolIntent.toolCalls.length > 0) {
      console.log('[工具意图] 检测到工具调用意图:', toolIntent.toolCalls.map(t => t.name).join(', '));
      
      // 执行工具
      toolExecutionResult = await toolIntentRecognizer.executeTools(
        toolIntent.toolCalls.map(tc => ({ name: tc.name, arguments: tc.arguments }))
      );
      
      console.log('[工具执行] 结果:', toolExecutionResult.summary);
    }
  } catch (error) {
    console.error('[工具意图] 识别或执行失败:', error);
  }
  
  return { toolExecutionResult, toolIntent };
}
