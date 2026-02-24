/**
 * 模型间协商协议
 * 
 * 核心思想：让模型自己决定谁来处理，而不是写死规则
 * 
 * 工作流程：
 * 1. 用一个轻量模型作为"路由器"评估输入
 * 2. 路由器输出推荐的模型类型
 * 3. 选择对应模型处理
 * 
 * 这样"选择逻辑"本身就是模型生成的，不是写死的
 */

import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 可用模型配置
 */
const MODELS = {
  // 路由器模型 - 用于评估和决策
  router: 'doubao-seed-2-0-lite-260215',
  
  // 处理模型池
  handlers: {
    thinking: 'doubao-seed-1-6-thinking-250715',    // 深度思考
    pro: 'doubao-seed-2-0-pro-260215',              // 复杂任务
    lite: 'doubao-seed-2-0-lite-260215',            // 快速响应
    deepseek: 'deepseek-v3-2-251201',               // 技术推理
    kimi: 'kimi-k2-250905',                         // 长上下文
    glm: 'glm-4-7-251222',                          // 通用
    balanced: 'doubao-seed-1-8-251228',             // 默认均衡
  }
};

/**
 * 路由决策结果
 */
interface RoutingDecision {
  recommendedModel: keyof typeof MODELS.handlers;
  confidence: number;
  reasoning: string;
}

/**
 * 路由提示词 - 让模型自己评估应该由谁处理
 */
const ROUTER_PROMPT = `你是一个模型路由器。你的任务是分析用户输入，决定由哪种类型的模型来处理。

可用的模型类型：
- thinking: 深度思考、逻辑推理、哲学探讨、复杂分析
- pro: 复杂任务、系统设计、综合方案
- lite: 简单对话、问候、快速问答
- deepseek: 技术问题、编程、算法
- kimi: 长文档、内容总结、大量文本
- glm: 通用任务、中文优化
- balanced: 常规问题、均衡处理

用户输入：
"""
{INPUT}
"""

请输出一个JSON格式的决策（只输出JSON，不要其他内容）：
{
  "recommendedModel": "模型类型",
  "confidence": 0.85,
  "reasoning": "简短理由"
}`;

/**
 * 模型协商器
 */
export class ModelNegotiator {
  private llmClient: LLMClient;
  
  constructor(headers: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
  }
  
  /**
   * 路由决策 - 让模型自己决定谁来处理
   */
  async negotiate(userInput: string): Promise<{
    selectedModel: string;
    decision: RoutingDecision;
  }> {
    try {
      // 1. 构造路由提示词
      const prompt = ROUTER_PROMPT.replace('{INPUT}', userInput);
      
      // 2. 调用路由器模型
      const response = await this.callRouter(prompt);
      
      // 3. 解析决策
      const decision = this.parseDecision(response);
      
      // 4. 获取对应的处理模型ID
      const selectedModel = MODELS.handlers[decision.recommendedModel] || MODELS.handlers.balanced;
      
      return {
        selectedModel,
        decision,
      };
      
    } catch (error) {
      // 出错时使用默认模型
      return {
        selectedModel: MODELS.handlers.balanced,
        decision: {
          recommendedModel: 'balanced',
          confidence: 0.5,
          reasoning: '路由失败，使用默认模型',
        },
      };
    }
  }
  
  /**
   * 调用路由器模型
   */
  private async callRouter(prompt: string): Promise<string> {
    let fullResponse = '';
    
    const stream = this.llmClient.stream([
      { role: 'user', content: prompt }
    ], {
      model: MODELS.router,
      temperature: 0.3, // 低温度，更确定的输出
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        fullResponse += chunk.content.toString();
      }
    }
    
    return fullResponse;
  }
  
  /**
   * 解析路由决策
   */
  private parseDecision(response: string): RoutingDecision {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 验证模型类型
        const validModels = Object.keys(MODELS.handlers);
        if (validModels.includes(parsed.recommendedModel)) {
          return {
            recommendedModel: parsed.recommendedModel,
            confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
            reasoning: parsed.reasoning || '',
          };
        }
      }
    } catch (e) {
      // 解析失败
    }
    
    // 默认返回
    return {
      recommendedModel: 'balanced',
      confidence: 0.5,
      reasoning: '无法解析路由决策',
    };
  }
  
  /**
   * 获取模型列表（用于调试）
   */
  static getAvailableModels() {
    return MODELS;
  }
}

/**
 * 创建协商器实例
 */
let globalNegotiator: ModelNegotiator | null = null;

export function getNegotiator(headers: Record<string, string>): ModelNegotiator {
  if (!globalNegotiator) {
    globalNegotiator = new ModelNegotiator(headers);
  }
  return globalNegotiator;
}
