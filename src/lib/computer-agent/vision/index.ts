/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 视觉系统
 * 
 * 屏幕截图和 AI 视觉分析
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import type {
  AgentConfig,
  IVisionSystem,
  ScreenAnalysis,
  ScreenElement,
  Rectangle,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode, ElementType } from '../types';
import { ScreenCapture } from './screen-capture';
import { ScreenAnalyzer } from './screen-analyzer';

/**
 * 创建视觉系统
 */
export function createVisionSystem(llmClient: LLMClient, config: AgentConfig): IVisionSystem {
  const capture = new ScreenCapture(config);
  const analyzer = new ScreenAnalyzer(llmClient, config);
  
  return {
    async captureScreen(region?: Rectangle): Promise<Result<string, AgentError>> {
      return capture.capture(region);
    },
    
    async analyzeScreen(screenshotPath: string): Promise<Result<ScreenAnalysis, AgentError>> {
      return analyzer.analyze(screenshotPath);
    },
    
    async findElement(description: string, analysis: ScreenAnalysis): Promise<Result<ScreenElement, AgentError>> {
      return analyzer.findElement(description, analysis);
    },
  };
}

export { ScreenCapture } from './screen-capture';
export { ScreenAnalyzer } from './screen-analyzer';
