/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - 浏览器执行器
 * 
 * 轻量级浏览器，基于 fetch + cheerio
 * 可以真实访问网页、提取内容
 * 
 * 未来可扩展为 Playwright 执行器
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as cheerio from 'cheerio';
import { ActionStructure } from '../info-field/structures';
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface BrowserState {
  currentUrl: string;
  history: string[];
  cookies: Map<string, string>;
  lastResponse: {
    status: number;
    headers: Record<string, string>;
    body: string;
  } | null;
}

interface ExtractedContent {
  title: string;
  text: string;
  links: Array<{ text: string; href: string }>;
  images: Array<{ alt: string; src: string }>;
  meta: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────
// 轻量级浏览器执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * 轻量级浏览器执行器
 * 
 * 使用 fetch 获取网页，cheerio 解析 HTML
 * 适合信息检索场景，不支持复杂交互
 */
export class LightweightBrowserExecutor implements ActionExecutor {
  readonly type = 'browser-lightweight';
  
  private state: BrowserState = {
    currentUrl: '',
    history: [],
    cookies: new Map(),
    lastResponse: null
  };
  
  private userAgent: string;
  private timeout: number;
  
  constructor(options?: { userAgent?: string; timeout?: number }) {
    this.userAgent = options?.userAgent || 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.timeout = options?.timeout || 30000;
  }
  
  getCapabilities(): ExecutorCapabilities {
    return {
      name: 'Lightweight Browser Executor',
      description: '轻量级浏览器，使用 fetch + cheerio 访问网页',
      supportedActions: [
        'navigate',
        'extract',
        'search',
        'scroll',      // 模拟滚动（获取更多内容）
        'click',       // 模拟点击（跟随链接）
        'type',        // 模拟输入（记录状态）
        'think',       // 思考（记录状态）
        'wait',
        'complete'
      ]
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.getCapabilities().supportedActions.includes(action.action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    switch (action.action) {
      case 'navigate':
        return this.navigate(action);
      case 'extract':
        return this.extract(action);
      case 'search':
        return this.search(action);
      case 'click':
        return this.click(action);
      case 'type':
        return this.typeText(action);
      case 'think':
        return this.think(action);
      case 'scroll':
        return this.scroll(action);
      case 'wait':
        return this.wait(action);
      case 'complete':
        return this.complete(action);
      default:
        return {
          actionId: action.id,
          status: 'failed',
          content: '',
          error: `不支持的行动类型: ${action.action}`,
          completed: false
        };
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 行动实现
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 导航到指定 URL
   */
  private async navigate(action: ActionStructure): Promise<ActionResult> {
    const url = this.normalizeUrl(action.target);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(this.timeout)
      });
      
      const body = await response.text();
      
      // 更新状态
      this.state.history.push(this.state.currentUrl);
      this.state.currentUrl = url;
      this.state.lastResponse = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body
      };
      
      // 解析页面
      const $ = cheerio.load(body);
      const title = $('title').text() || '无标题';
      
      return {
        actionId: action.id,
        status: 'success',
        content: `导航到 ${url}\n状态码: ${response.status}\n标题: ${title}`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `导航失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  /**
   * 提取页面内容
   */
  private async extract(action: ActionStructure): Promise<ActionResult> {
    if (!this.state.lastResponse) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: '没有可用的页面内容，请先导航到网页',
        completed: false
      };
    }
    
    const $ = cheerio.load(this.state.lastResponse.body);
    const target = action.target.toLowerCase();
    const extracted = new Map<string, unknown>();
    
    // 根据目标提取不同内容
    if (target.includes('title')) {
      extracted.set('title', $('title').text());
    }
    
    if (target.includes('text') || target.includes('content')) {
      // 提取主要文本内容
      const text = this.extractMainText($);
      extracted.set('text', text);
    }
    
    if (target.includes('link')) {
      const links: Array<{ text: string; href: string }> = [];
      $('a[href]').each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const text = $el.text().trim();
        if (text && href && !href.startsWith('javascript:')) {
          links.push({ text, href: this.resolveUrl(href) });
        }
      });
      extracted.set('links', links.slice(0, 50)); // 最多50个链接
    }
    
    if (target.includes('image')) {
      const images: Array<{ alt: string; src: string }> = [];
      $('img[src]').each((_, el) => {
        const $el = $(el);
        images.push({
          alt: $el.attr('alt') || '',
          src: this.resolveUrl($el.attr('src') || '')
        });
      });
      extracted.set('images', images.slice(0, 20));
    }
    
    if (target.includes('meta')) {
      const meta: Record<string, string> = {};
      $('meta[name], meta[property]').each((_, el) => {
        const $el = $(el);
        const key = $el.attr('name') || $el.attr('property') || '';
        const value = $el.attr('content') || '';
        if (key && value) {
          meta[key] = value;
        }
      });
      extracted.set('meta', meta);
    }
    
    // 默认提取全部
    if (extracted.size === 0) {
      const fullContent = this.extractFullContent($);
      extracted.set('title', fullContent.title);
      extracted.set('text', fullContent.text.substring(0, 2000));
      extracted.set('links', fullContent.links.slice(0, 20));
      extracted.set('meta', fullContent.meta);
    }
    
    const contentSummary = Array.from(extracted.entries())
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.substring(0, 100) : JSON.stringify(v).substring(0, 100)}`)
      .join('\n');
    
    return {
      actionId: action.id,
      status: 'success',
      content: `提取内容:\n${contentSummary}`,
      extracted,
      completed: false
    };
  }
  
  /**
   * 搜索（使用搜索引擎）
   */
  private async search(action: ActionStructure): Promise<ActionResult> {
    const query = action.value || action.target;
    const engine = action.target.includes('google') ? 'google' : 
                   action.target.includes('bing') ? 'bing' : 'baidu';
    
    // 构建搜索 URL
    const searchUrls: Record<string, string> = {
      baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`
    };
    
    const url = searchUrls[engine];
    
    // 创建导航行动
    const navAction = new ActionStructure(
      action.id + '-nav',
      action.source,
      'navigate',
      url
    );
    
    // 执行导航
    const navResult = await this.navigate(navAction);
    
    if (navResult.status !== 'success') {
      return navResult;
    }
    
    // 创建提取行动
    const extractAction = new ActionStructure(
      action.id + '-extract',
      action.source,
      'extract',
      'links text'
    );
    
    // 提取搜索结果
    return this.extract(extractAction);
  }
  
  /**
   * 点击（跟随链接）
   */
  private async click(action: ActionStructure): Promise<ActionResult> {
    // 在轻量级浏览器中，点击 = 跟随链接
    let targetUrl = action.target;
    
    // 如果是相对路径，转换为绝对路径
    if (targetUrl.startsWith('/') || targetUrl.startsWith('./')) {
      targetUrl = this.resolveUrl(targetUrl);
    }
    
    // 如果是选择器，尝试从当前页面找到链接
    if (targetUrl.startsWith('#') || targetUrl.startsWith('.')) {
      if (!this.state.lastResponse) {
        return {
          actionId: action.id,
          status: 'failed',
          content: '',
          error: '没有当前页面',
          completed: false
        };
      }
      
      const $ = cheerio.load(this.state.lastResponse.body);
      const $el = $(targetUrl).first();
      const href = $el.attr('href') || $el.find('a').attr('href');
      
      if (!href) {
        return {
          actionId: action.id,
          status: 'failed',
          content: '',
          error: `找不到链接: ${targetUrl}`,
          completed: false
        };
      }
      
      targetUrl = this.resolveUrl(href);
    }
    
    // 创建导航行动
    const navAction = new ActionStructure(
      action.id + '-click',
      action.source,
      'navigate',
      targetUrl
    );
    
    return this.navigate(navAction);
  }
  
  /**
   * 滚动（模拟 - 获取更多内容）
   */
  private async scroll(action: ActionStructure): Promise<ActionResult> {
    // 轻量级浏览器不支持真正的滚动，但可以提取更多内容
    return {
      actionId: action.id,
      status: 'success',
      content: '轻量级浏览器不支持滚动操作',
      completed: false
    };
  }
  
  /**
   * 输入（模拟 - 记录状态）
   */
  private async typeText(action: ActionStructure): Promise<ActionResult> {
    const value = action.value || '';
    
    return {
      actionId: action.id,
      status: 'success',
      content: `模拟输入: "${value}" 到 ${action.target}`,
      completed: false
    };
  }
  
  /**
   * 思考（记录状态）
   */
  private async think(action: ActionStructure): Promise<ActionResult> {
    return {
      actionId: action.id,
      status: 'success',
      content: `思考: ${action.target || action.value || '处理中...'}`,
      completed: false
    };
  }
  
  /**
   * 等待
   */
  private async wait(action: ActionStructure): Promise<ActionResult> {
    const ms = parseInt(action.value || '1000', 10);
    await new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000)));
    
    return {
      actionId: action.id,
      status: 'success',
      content: `等待 ${ms}ms`,
      completed: false
    };
  }
  
  /**
   * 完成
   */
  private async complete(action: ActionStructure): Promise<ActionResult> {
    return {
      actionId: action.id,
      status: 'success',
      content: action.target || '任务完成',
      completed: true
    };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
  private normalizeUrl(url: string): string {
    // 如果已经是完整 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 尝试从描述性文本中提取 URL
    // 例如: "浏览器地址栏 https://example.com" -> "https://example.com"
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const match = url.match(urlPattern);
    if (match) {
      return match[0];
    }
    
    // 如果包含常见域名，尝试构建 URL
    const domainPattern = /([a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z]{2,}/;
    const domainMatch = url.match(domainPattern);
    if (domainMatch) {
      return `https://${domainMatch[0]}`;
    }
    
    // 默认添加 https://
    return `https://${url}`;
  }
  
  private resolveUrl(href: string): string {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    if (href.startsWith('//')) {
      const baseUrl = new URL(this.state.currentUrl);
      return `${baseUrl.protocol}${href}`;
    }
    if (href.startsWith('/')) {
      const baseUrl = new URL(this.state.currentUrl);
      return `${baseUrl.origin}${href}`;
    }
    // 相对路径
    const baseUrl = new URL(this.state.currentUrl);
    return `${baseUrl.origin}${baseUrl.pathname}/${href}`;
  }
  
  private extractMainText($: cheerio.CheerioAPI): string {
    // 移除脚本、样式等
    $('script, style, nav, footer, header, aside').remove();
    
    // 尝试找到主要内容
    const mainSelectors = [
      'main', 'article', '.content', '.post', '.article',
      '#content', '#main', '.main', '#article'
    ];
    
    for (const selector of mainSelectors) {
      const $main = $(selector);
      if ($main.length > 0) {
        return $main.text().replace(/\s+/g, ' ').trim();
      }
    }
    
    // 回退到 body
    return $('body').text().replace(/\s+/g, ' ').trim();
  }
  
  private extractFullContent($: cheerio.CheerioAPI): ExtractedContent {
    const title = $('title').text();
    const text = this.extractMainText($);
    
    const links: Array<{ text: string; href: string }> = [];
    $('a[href]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const linkText = $el.text().trim();
      if (linkText && href && !href.startsWith('javascript:')) {
        links.push({ text: linkText, href: this.resolveUrl(href) });
      }
    });
    
    const meta: Record<string, string> = {};
    $('meta[name], meta[property]').each((_, el) => {
      const $el = $(el);
      const key = $el.attr('name') || $el.attr('property') || '';
      const value = $el.attr('content') || '';
      if (key && value) {
        meta[key] = value;
      }
    });
    
    return { title, text, links, images: [], meta };
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 状态访问
  // ───────────────────────────────────────────────────────────────────
  
  getCurrentUrl(): string {
    return this.state.currentUrl;
  }
  
  getHistory(): string[] {
    return [...this.state.history];
  }
  
  getLastResponse(): BrowserState['lastResponse'] {
    return this.state.lastResponse;
  }
}
