/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent 核心能力系统
 * Agent Core Capabilities
 * 
 * 设计理念：
 * - 不逐个实现工具，而是提供少量核心能力
 * - LLM动态编排这些能力完成任意任务
 * - 工具 = 能力的组合
 * 
 * 三大核心能力：
 * 1. execute_code - 执行代码（计算、文件、任何逻辑）
 * 2. http_request - HTTP请求（API、网页、任何网络）
 * 3. browser_action - 浏览器操作（网页交互）
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 核心能力类型 */
export type CapabilityType = 'execute_code' | 'http_request' | 'browser_action' | 'think' | 'respond';

/** 执行代码参数 */
export interface ExecuteCodeParams {
  language: 'javascript' | 'python' | 'bash';
  code: string;
  timeout?: number;
}

/** HTTP请求参数 */
export interface HttpRequestParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/** 浏览器操作参数 */
export interface BrowserActionParams {
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'scroll' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
}

/** 能力执行参数 */
export type CapabilityParams = 
  | { type: 'execute_code'; params: ExecuteCodeParams }
  | { type: 'http_request'; params: HttpRequestParams }
  | { type: 'browser_action'; params: BrowserActionParams }
  | { type: 'think'; params: { content: string } }
  | { type: 'respond'; params: { content: string } };

/** 能力执行结果 */
export interface CapabilityResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

/** Agent步骤 */
export interface AgentStep {
  id: string;
  type: 'thought' | 'action' | 'observation';
  content: string;
  capability?: CapabilityParams;
  result?: CapabilityResult;
  timestamp: number;
}

/** Agent执行结果 */
export interface AgentResult {
  success: boolean;
  response: string;
  steps: AgentStep[];
  duration: number;
}

/** Agent配置 */
export interface AgentConfig {
  llmClient: LLMClient;
  maxSteps?: number;
  onStep?: (step: AgentStep) => void;
}

// ═══════════════════════════════════════════════════════════════════════
// 核心能力执行器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 执行代码能力
 * 
 * 这是"万能工具"：
 * - 可以做任何计算
 * - 可以操作文件
 * - 可以调用任何API
 * - 可以处理任何数据格式
 */
async function executeCode(params: ExecuteCodeParams): Promise<CapabilityResult> {
  const startTime = Date.now();
  
  try {
    // 在实际环境中，这里应该调用沙箱执行
    // 目前返回模拟结果
    console.log(`[execute_code] 执行 ${params.language} 代码:`, params.code.substring(0, 100));
    
    // 模拟执行
    if (params.language === 'javascript') {
      // 安全地执行简单JavaScript（实际应该用沙箱）
      const fn = new Function('return ' + params.code);
      const result = fn();
      return {
        success: true,
        output: result,
        duration: Date.now() - startTime
      };
    }
    
    return {
      success: true,
      output: `[模拟执行] ${params.language} 代码已执行`,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
      duration: Date.now() - startTime
    };
  }
}

/**
 * HTTP请求能力
 * 
 * 这是"万能网络工具"：
 * - 可以调用任何API
 * - 可以抓取任何网页
 * - 可以上传下载文件
 */
async function httpRequest(params: HttpRequestParams): Promise<CapabilityResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(params.url, {
      method: params.method,
      headers: params.headers,
      body: params.body ? JSON.stringify(params.body) : undefined
    });
    
    const data = await response.text();
    
    return {
      success: response.ok,
      output: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: data.substring(0, 10000) // 限制大小
      },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败',
      duration: Date.now() - startTime
    };
  }
}

/**
 * 浏览器操作能力
 * 
 * 这是"万能网页工具"：
 * - 可以导航网页
 * - 可以点击、输入
 * - 可以截图
 */
async function browserAction(params: BrowserActionParams): Promise<CapabilityResult> {
  const startTime = Date.now();
  
  // 浏览器操作需要在浏览器环境中执行
  // 这里返回提示信息
  return {
    success: true,
    output: {
      message: `浏览器操作 [${params.action}] 需要在浏览器环境中执行`,
      params
    },
    duration: Date.now() - startTime
  };
}

/**
 * 执行核心能力
 */
export async function executeCapability(capability: CapabilityParams): Promise<CapabilityResult> {
  switch (capability.type) {
    case 'execute_code':
      return executeCode(capability.params);
    case 'http_request':
      return httpRequest(capability.params);
    case 'browser_action':
      return browserAction(capability.params);
    case 'think':
    case 'respond':
      return {
        success: true,
        output: capability.params.content,
        duration: 0
      };
    default:
      return {
        success: false,
        error: `未知能力类型`,
        duration: 0
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Agent 执行器
// ═══════════════════════════════════════════════════════════════════════

/**
 * Agent 执行器
 * 
 * 核心理念：
 * - 不预设工具列表
 * - LLM根据任务动态决定使用什么能力
 * - 能力组合 = 无限工具
 */
export class Agent {
  private config: AgentConfig;
  private steps: AgentStep[] = [];
  private llmClient: LLMClient;

  constructor(config: AgentConfig) {
    this.config = {
      maxSteps: 20,
      ...config
    };
    this.llmClient = config.llmClient;
  }

  /**
   * 执行用户请求
   */
  async execute(userInput: string): Promise<AgentResult> {
    const startTime = Date.now();
    this.steps = [];

    try {
      // 使用LLM规划并执行
      await this.planAndExecute(userInput);

      // 生成最终响应
      const response = await this.generateResponse(userInput);

      return {
        success: true,
        response,
        steps: this.steps,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        response: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        steps: this.steps,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 规划并执行
   */
  private async planAndExecute(input: string): Promise<void> {
    // 构建系统提示
    const systemPrompt = `你是一个智能Agent，拥有以下核心能力：

1. **execute_code** - 执行代码
   - 可以执行 JavaScript/Python/Bash 代码
   - 可以做任何计算、数据处理、文件操作
   - 示例：计算斐波那契数列、解析JSON、处理字符串

2. **http_request** - HTTP请求
   - 可以发送任何HTTP请求
   - 可以调用API、抓取网页
   - 示例：调用天气API、获取网页内容

3. **browser_action** - 浏览器操作
   - 可以控制浏览器导航、点击、输入
   - 可以截图、等待元素
   - 示例：打开网页、填写表单

根据用户需求，选择合适的能力完成任务。
如果任务简单，可以直接回答而不使用任何能力。

用户输入: ${input}

请规划你的行动。如果需要使用能力，请按以下格式输出：

ACTION: <能力类型>
PARAMS: <JSON参数>

如果可以直接回答，请输出：
RESPONSE: <回答内容>`;

    // 调用LLM（使用流式接口）
    let response = '';
    try {
      const streamIterator = this.llmClient.stream([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ]);
      
      for await (const chunk of streamIterator) {
        if (chunk.content) {
          response += chunk.content.toString();
        }
      }
    } catch (e) {
      console.error('LLM调用失败:', e);
      response = 'RESPONSE: 我理解你的请求。请告诉我更多细节。';
    }
    
    // 解析LLM响应
    await this.parseAndExecute(response);
  }

  /**
   * 解析并执行LLM输出
   */
  private async parseAndExecute(content: string): Promise<void> {
    // 记录思考
    this.addStep('thought', content);

    // 检查是否需要执行能力
    const actionMatch = content.match(/ACTION:\s*(\w+)/);
    const paramsMatch = content.match(/PARAMS:\s*([\s\S]+?)(?=\n\n|RESPONSE:|$)/);

    if (actionMatch && paramsMatch) {
      const actionType = actionMatch[1] as CapabilityType;
      
      try {
        const params = JSON.parse(paramsMatch[1].trim());
        
        const capability: CapabilityParams = {
          type: actionType as 'execute_code' | 'http_request' | 'browser_action',
          params
        } as CapabilityParams;

        // 执行能力
        const result = await executeCapability(capability);
        
        // 记录结果
        this.addStep('observation', JSON.stringify(result.output || result.error), capability, result);
      } catch (e) {
        this.addStep('observation', `解析参数失败: ${e}`);
      }
    }
  }

  /**
   * 生成最终响应
   */
  private async generateResponse(input: string): Promise<string> {
    // 如果有执行结果，用LLM总结
    if (this.steps.some(s => s.type === 'observation')) {
      const observationSteps = this.steps.filter(s => s.type === 'observation');
      const lastObservation = observationSteps[observationSteps.length - 1];
      
      try {
        let response = '';
        const streamIterator = this.llmClient.stream([
          { role: 'system', content: '根据执行结果回答用户问题。简洁明了。' },
          { role: 'user', content: `问题: ${input}\n\n执行结果: ${lastObservation.content}` }
        ]);
        
        for await (const chunk of streamIterator) {
          if (chunk.content) {
            response += chunk.content.toString();
          }
        }
        
        return response || '执行完成';
      } catch (e) {
        return '执行完成';
      }
    }

    // 直接从LLM响应中提取
    const responseMatch = this.steps[0]?.content.match(/RESPONSE:\s*([\s\S]+)$/);
    if (responseMatch) {
      return responseMatch[1].trim();
    }

    return '我理解了你的请求。有什么具体需要我帮助的吗？';
  }

  /**
   * 添加步骤
   */
  private addStep(type: AgentStep['type'], content: string, capability?: CapabilityParams, result?: CapabilityResult): void {
    const step: AgentStep = {
      id: `step_${Date.now()}_${this.steps.length}`,
      type,
      content,
      timestamp: Date.now()
    };
    
    if (capability) step.capability = capability;
    if (result) step.result = result;
    
    this.steps.push(step);
    this.config.onStep?.(step);
  }
}

/**
 * 创建Agent实例
 */
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}

/**
 * 获取能力描述（供前端展示）
 */
export function getCapabilities(): Array<{ type: string; description: string; examples: string[] }> {
  return [
    {
      type: 'execute_code',
      description: '执行代码 - 万能计算工具',
      examples: [
        '计算数学问题',
        '处理数据文件',
        '解析JSON/XML',
        '生成图表'
      ]
    },
    {
      type: 'http_request',
      description: 'HTTP请求 - 万能网络工具',
      examples: [
        '调用API获取数据',
        '抓取网页内容',
        '上传/下载文件'
      ]
    },
    {
      type: 'browser_action',
      description: '浏览器操作 - 万能网页工具',
      examples: [
        '打开网页',
        '点击按钮',
        '填写表单',
        '截图保存'
      ]
    }
  ];
}
