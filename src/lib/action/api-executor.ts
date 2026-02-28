/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - API 调用执行器
 * 
 * 支持 HTTP 请求：
 * - GET/POST/PUT/DELETE
 * - 自定义 Headers
 * - JSON/Form 数据
 * ─══════════════════════════════════════════════════════════════════════
 */

import { ActionStructure } from '../info-field/structures';
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

interface ResponseInfo {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  size: number;
  duration: number;
}

// ─────────────────────────────────────────────────────────────────────
// API 调用执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * API 调用执行器
 * 
 * 执行 HTTP 请求
 */
export class APIExecutor implements ActionExecutor {
  readonly type = 'api';
  
  private defaultTimeout: number;
  private maxResponseSize: number;
  
  constructor(options?: { timeout?: number; maxResponseSize?: number }) {
    this.defaultTimeout = options?.timeout ?? 30000; // 30s
    this.maxResponseSize = options?.maxResponseSize ?? 5 * 1024 * 1024; // 5MB
  }
  
  getCapabilities(): ExecutorCapabilities {
    return {
      name: 'API Executor',
      description: 'API 调用执行器，支持 GET/POST/PUT/DELETE 等 HTTP 方法',
      supportedActions: [
        'api-get',
        'api-post',
        'api-put',
        'api-delete',
        'api-patch',
        'api-request'
      ]
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.getCapabilities().supportedActions.includes(action.action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    const url = action.target;
    
    if (!url) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: '未指定 URL',
        completed: false
      };
    }
    
    // 解析请求配置
    const config = this.parseConfig(action);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: AbortSignal.timeout(config.timeout || this.defaultTimeout)
      });
      
      const duration = Date.now() - startTime;
      
      // 获取响应头
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // 解析响应体
      let data: unknown;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        // 尝试解析为 JSON
        try {
          data = JSON.parse(text);
        } catch {
          data = text.substring(0, 5000); // 限制文本长度
        }
      }
      
      const responseInfo: ResponseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        size: JSON.stringify(data).length,
        duration
      };
      
      const extracted = new Map<string, unknown>();
      extracted.set('response', responseInfo);
      extracted.set('status', response.status);
      extracted.set('data', data);
      extracted.set('duration', duration);
      
      const statusEmoji = response.ok ? '✅' : '❌';
      
      return {
        actionId: action.id,
        status: response.ok ? 'success' : 'failed',
        content: `${statusEmoji} ${config.method} ${url}\n状态: ${response.status} ${response.statusText}\n耗时: ${duration}ms\n大小: ${this.formatSize(responseInfo.size)}\n\n${this.formatResponseData(data)}`,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 请求配置解析
  // ───────────────────────────────────────────────────────────────────
  
  private parseConfig(action: ActionStructure): RequestConfig {
    const methodMap: Record<string, 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'> = {
      'api-get': 'GET',
      'api-post': 'POST',
      'api-put': 'PUT',
      'api-delete': 'DELETE',
      'api-patch': 'PATCH',
      'api-request': 'GET'
    };
    
    const config: RequestConfig = {
      method: methodMap[action.action] || 'GET',
      timeout: this.defaultTimeout
    };
    
    // 从 context 中获取额外配置
    if (action.context) {
      const { headers, body, timeout, method } = action.context as Record<string, unknown>;
      
      if (headers && typeof headers === 'object') {
        config.headers = headers as Record<string, string>;
      }
      
      if (body) {
        config.body = body;
      }
      
      if (typeof timeout === 'number') {
        config.timeout = timeout;
      }
      
      if (typeof method === 'string' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        config.method = method as RequestConfig['method'];
      }
    }
    
    // 如果有 value 且是 POST/PUT/PATCH，作为 body
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && action.value) {
      try {
        config.body = typeof action.value === 'string' ? JSON.parse(action.value) : action.value;
      } catch {
        config.body = action.value;
      }
    }
    
    // 默认 Content-Type
    if (!config.headers) {
      config.headers = { 'Content-Type': 'application/json' };
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
  private formatResponseData(data: unknown): string {
    if (typeof data === 'string') {
      return data.substring(0, 1000);
    }
    
    try {
      const json = JSON.stringify(data, null, 2);
      return json.substring(0, 1000) + (json.length > 1000 ? '\n...' : '');
    } catch {
      return String(data).substring(0, 1000);
    }
  }
  
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
