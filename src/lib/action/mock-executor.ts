/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - 模拟执行器
 * 
 * 用于测试和演示的执行器
 * 不连接真实浏览器，而是模拟执行过程
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ActionStructure } from '../info-field/structures';
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';

// ─────────────────────────────────────────────────────────────────────
// 模拟执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * 模拟执行器
 * 
 * 模拟各种行动的执行，用于测试
 */
export class MockExecutor implements ActionExecutor {
  readonly type = 'mock';
  
  private simulatedState: {
    currentUrl: string;
    pageContent: string;
    inputValue: string;
    clickCount: number;
  };
  
  constructor() {
    this.simulatedState = {
      currentUrl: 'about:blank',
      pageContent: '',
      inputValue: '',
      clickCount: 0
    };
  }
  
  getCapabilities(): ExecutorCapabilities {
    return {
      name: 'Mock Executor',
      description: '模拟执行器，用于测试认知循环',
      supportedActions: [
        'navigate',
        'click',
        'type',
        'extract',
        'think',
        'complete',
        'wait',
        'scroll'
      ]
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.getCapabilities().supportedActions.includes(action.action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    // 模拟网络延迟
    await this.simulateDelay(500);
    
    switch (action.action) {
      case 'navigate':
        return this.executeNavigate(action);
      case 'click':
        return this.executeClick(action);
      case 'type':
        return this.executeType(action);
      case 'extract':
        return this.executeExtract(action);
      case 'think':
        return this.executeThink(action);
      case 'complete':
        return this.executeComplete(action);
      case 'wait':
        return this.executeWait(action);
      case 'scroll':
        return this.executeScroll(action);
      default:
        return this.executeUnknown(action);
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 行动执行方法
  // ───────────────────────────────────────────────────────────────────
  
  private async executeNavigate(action: ActionStructure): Promise<ActionResult> {
    const url = action.target;
    this.simulatedState.currentUrl = url;
    
    // 模拟页面内容
    this.simulatedState.pageContent = this.generateMockPageContent(url);
    
    return {
      actionId: action.id,
      status: 'success',
      content: `导航到 ${url}\n页面标题: Mock Page for ${url}`,
      completed: false
    };
  }
  
  private async executeClick(action: ActionStructure): Promise<ActionResult> {
    this.simulatedState.clickCount++;
    
    // 模拟点击效果
    const target = action.target;
    const mockResponse = this.getMockClickResponse(target);
    
    return {
      actionId: action.id,
      status: 'success',
      content: `点击元素: ${target}\n${mockResponse}`,
      completed: false
    };
  }
  
  private async executeType(action: ActionStructure): Promise<ActionResult> {
    const value = action.value || '';
    this.simulatedState.inputValue = value;
    
    return {
      actionId: action.id,
      status: 'success',
      content: `输入文本: "${value}" 到 ${action.target}`,
      completed: false
    };
  }
  
  private async executeExtract(action: ActionStructure): Promise<ActionResult> {
    const target = action.target;
    
    // 模拟提取数据
    const extracted = new Map<string, unknown>();
    
    if (target.includes('title')) {
      extracted.set('title', `Mock Title - ${this.simulatedState.currentUrl}`);
    }
    if (target.includes('content')) {
      extracted.set('content', this.simulatedState.pageContent);
    }
    if (target.includes('links')) {
      extracted.set('links', [
        { text: 'Link 1', href: 'https://example.com/1' },
        { text: 'Link 2', href: 'https://example.com/2' }
      ]);
    }
    
    // 默认提取
    if (extracted.size === 0) {
      extracted.set('raw', this.simulatedState.pageContent.substring(0, 500));
      extracted.set('url', this.simulatedState.currentUrl);
    }
    
    return {
      actionId: action.id,
      status: 'success',
      content: `从 ${target} 提取数据`,
      extracted,
      completed: false
    };
  }
  
  private async executeThink(action: ActionStructure): Promise<ActionResult> {
    // 思考行动不执行任何操作，只是让智能体重新评估
    return {
      actionId: action.id,
      status: 'success',
      content: `思考: ${action.target || '重新评估当前状态'}`,
      completed: false
    };
  }
  
  private async executeComplete(action: ActionStructure): Promise<ActionResult> {
    return {
      actionId: action.id,
      status: 'success',
      content: action.target || '任务完成',
      completed: true
    };
  }
  
  private async executeWait(action: ActionStructure): Promise<ActionResult> {
    const ms = parseInt(action.value || '1000', 10);
    await this.simulateDelay(ms);
    
    return {
      actionId: action.id,
      status: 'success',
      content: `等待 ${ms}ms`,
      completed: false
    };
  }
  
  private async executeScroll(action: ActionStructure): Promise<ActionResult> {
    return {
      actionId: action.id,
      status: 'success',
      content: `滚动页面: ${action.target}`,
      completed: false
    };
  }
  
  private async executeUnknown(action: ActionStructure): Promise<ActionResult> {
    return {
      actionId: action.id,
      status: 'failed',
      content: '',
      error: `未知的行动类型: ${action.action}`,
      completed: false
    };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 模拟辅助方法
  // ───────────────────────────────────────────────────────────────────
  
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.min(ms, 1000))); // 最多等待1秒
  }
  
  private generateMockPageContent(url: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Mock Page - ${url}</title></head>
      <body>
        <h1>Welcome to ${url}</h1>
        <p>This is a simulated page for testing the cognitive agent.</p>
        <div class="content">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
        <nav>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
        <form>
          <input type="text" id="search" placeholder="Search...">
          <button type="submit">Submit</button>
        </form>
      </body>
      </html>
    `.trim();
  }
  
  private getMockClickResponse(target: string): string {
    if (target.includes('submit') || target.includes('button')) {
      return '表单已提交，等待响应...';
    }
    if (target.includes('link') || target.includes('a')) {
      return '导航到新页面...';
    }
    return '元素已被点击';
  }
}

// ─────────────────────────────────────────────────────────────────────
// 记录执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * 记录执行器
 * 
 * 记录所有执行的操作，用于调试和日志
 */
export class LoggingExecutor implements ActionExecutor {
  readonly type = 'logging';
  private wrappedExecutor: ActionExecutor;
  private logs: Array<{ action: ActionStructure; result: ActionResult; timestamp: number }> = [];
  
  constructor(executor: ActionExecutor) {
    this.wrappedExecutor = executor;
  }
  
  getCapabilities(): ExecutorCapabilities {
    const caps = this.wrappedExecutor.getCapabilities();
    return {
      ...caps,
      name: `Logging ${caps.name}`
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.wrappedExecutor.canExecute(action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    const result = await this.wrappedExecutor.execute(action);
    
    this.logs.push({
      action,
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  /**
   * 获取执行日志
   */
  getLogs(): Array<{ action: ActionStructure; result: ActionResult; timestamp: number }> {
    return [...this.logs];
  }
  
  /**
   * 清除日志
   */
  clearLogs(): void {
    this.logs = [];
  }
}
