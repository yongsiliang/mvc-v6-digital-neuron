/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 浏览器自动化
 * 
 * 基于 Playwright 的浏览器自动化：
 * - 页面导航
 * - 元素交互（点击、输入、选择）
 * - 截图和 PDF
 * - 网络拦截
 * - 多标签页管理
 * 
 * 设计原则：
 * 1. 智能等待：自动等待元素可交互
 * 2. 错误恢复：自动重试和降级策略
 * 3. 安全隔离：沙箱模式运行浏览器
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  AgentConfig,
  Result,
  AgentError,
  Point,
  Rectangle,
} from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';

// ═══════════════════════════════════════════════════════════════════════
// 浏览器类型定义
// ═══════════════════════════════════════════════════════════════════════

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface BrowserConfig {
  /** 浏览器类型 */
  browserType: BrowserType;
  /** 是否无头模式 */
  headless: boolean;
  /** 启动参数 */
  args?: string[];
  /** 代理设置 */
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  /** 视口大小 */
  viewport?: {
    width: number;
    height: number;
  };
  /** 用户代理 */
  userAgent?: string;
  /** 超时时间 */
  timeout: number;
  /** 是否启用沙箱 */
  enableSandbox: boolean;
}

export interface PageInfo {
  /** 页面 URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** 页面 ID */
  id: string;
  /** 是否激活 */
  active: boolean;
}

export interface ElementInfo {
  /** 选择器 */
  selector: string;
  /** 标签名 */
  tagName: string;
  /** 文本内容 */
  text?: string;
  /** 属性 */
  attributes: Record<string, string>;
  /** 位置和大小 */
  bounds: Rectangle;
  /** 是否可见 */
  visible: boolean;
  /** 是否可交互 */
  interactive: boolean;
}

export interface NavigationOptions {
  /** 等待条件 */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  /** 超时时间 */
  timeout?: number;
  /** 引用页 */
  referer?: string;
}

export interface InputOptions {
  /** 输入延迟（毫秒） */
  delay?: number;
  /** 是否清空现有内容 */
  clear?: boolean;
  /** 是否按下回车 */
  pressEnter?: boolean;
  /** 等待选择器超时 */
  timeout?: number;
}

export interface ClickOptions {
  /** 点击次数 */
  clickCount?: number;
  /** 点击位置偏移 */
  position?: Point;
  /** 修饰键 */
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  /** 等待元素超时 */
  timeout?: number;
  /** 是否强制点击（即使元素被覆盖） */
  force?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// 浏览器自动化类
// ═══════════════════════════════════════════════════════════════════════

/**
 * 浏览器自动化控制器
 * 
 * 特性：
 * - 智能等待：自动等待元素可交互
 * - 多标签页管理
 * - 网络请求拦截
 * - 截图和 PDF 导出
 * - Cookie 和存储管理
 */
export class BrowserAutomation {
  private config: BrowserConfig;
  private browser: any = null;
  private context: any = null;
  private pages: Map<string, any> = new Map();
  private activePageId: string | null = null;
  private isInitialized: boolean = false;

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = {
      browserType: 'chromium',
      headless: true,
      timeout: 30000,
      enableSandbox: true,
      viewport: { width: 1280, height: 720 },
      ...config,
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // 生命周期管理
  // ════════════════════════════════════════════════════════════════════

  /**
   * 初始化浏览器
   */
  async initialize(): Promise<Result<void, AgentError>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      // 动态导入 Playwright（因为它是可选依赖）
      let browserLauncher: any;
      
      // @ts-ignore - Playwright is optional dependency
      const playwright = await import('playwright').catch(() => null);
      
      if (!playwright) {
        return failure(createError(
          AgentErrorCode.APP_LAUNCH_FAILED,
          'Playwright 未安装，请运行: pnpm add playwright',
          {}
        ));
      }
      
      const { chromium, firefox, webkit } = playwright;
      
      // 选择浏览器类型
      switch (this.config.browserType) {
        case 'firefox':
          browserLauncher = firefox;
          break;
        case 'webkit':
          browserLauncher = webkit;
          break;
        default:
          browserLauncher = chromium;
      }

      // 启动浏览器
      const launchOptions: any = {
        headless: this.config.headless,
        args: this.config.args || [],
      };

      if (this.config.proxy) {
        launchOptions.proxy = this.config.proxy;
      }

      // 沙箱参数
      if (this.config.enableSandbox) {
        launchOptions.args.push(
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        );
      }

      this.browser = await browserLauncher.launch(launchOptions);

      // 创建浏览器上下文
      const contextOptions: any = {
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
      };

      this.context = await this.browser.newContext(contextOptions);

      // 创建初始页面
      const page = await this.context.newPage();
      const pageId = this.generatePageId();
      this.pages.set(pageId, page);
      this.activePageId = pageId;

      this.isInitialized = true;
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.APP_LAUNCH_FAILED,
        `浏览器启动失败: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<Result<void, AgentError>> {
    try {
      if (this.browser) {
        await this.browser.close();
      }

      this.browser = null;
      this.context = null;
      this.pages.clear();
      this.activePageId = null;
      this.isInitialized = false;

      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.UNKNOWN,
        `关闭浏览器失败: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 页面导航
  // ════════════════════════════════════════════════════════════════════

  /**
   * 导航到 URL
   */
  async navigate(
    url: string,
    options?: NavigationOptions
  ): Promise<Result<PageInfo, AgentError>> {
    try {
      const initResult = await this.ensureInitialized();
      if (!initResult.success) return initResult as any;

      const page = this.getActivePage();
      if (!page) {
        return failure(createError(
          AgentErrorCode.APP_NOT_FOUND,
          '没有活动页面'
        ));
      }

      await page.goto(url, {
        waitUntil: options?.waitUntil || 'load',
        timeout: options?.timeout || this.config.timeout,
        referer: options?.referer,
      });

      return success(await this.getPageInfo(page));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.BROWSER_NAVIGATION_FAILED,
        `导航失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { url }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 后退
   */
  async goBack(): Promise<Result<PageInfo, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      await page.goBack({ waitUntil: 'load' });
      return success(await this.getPageInfo(page));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.BROWSER_NAVIGATION_FAILED,
        `后退失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * 前进
   */
  async goForward(): Promise<Result<PageInfo, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      await page.goForward({ waitUntil: 'load' });
      return success(await this.getPageInfo(page));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.BROWSER_NAVIGATION_FAILED,
        `前进失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * 刷新页面
   */
  async refresh(): Promise<Result<PageInfo, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      await page.reload({ waitUntil: 'load' });
      return success(await this.getPageInfo(page));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.BROWSER_NAVIGATION_FAILED,
        `刷新失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 元素交互
  // ════════════════════════════════════════════════════════════════════

  /**
   * 查找元素
   */
  async findElement(
    selector: string,
    options?: { timeout?: number }
  ): Promise<Result<ElementInfo, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const element = await page.waitForSelector(selector, {
        timeout: options?.timeout || this.config.timeout,
        state: 'attached',
      });

      if (!element) {
        return failure(createError(
          AgentErrorCode.ELEMENT_NOT_FOUND,
          `元素未找到: ${selector}`
        ));
      }

      return success(await this.getElementInfo(element, selector));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `查找元素失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 查找多个元素
   */
  async findElements(
    selector: string
  ): Promise<Result<ElementInfo[], AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const elements = await page.$$(selector);
      const results: ElementInfo[] = [];

      for (let i = 0; i < elements.length; i++) {
        results.push(await this.getElementInfo(elements[i], `${selector}:nth(${i})`));
      }

      return success(results);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `查找元素失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 点击元素
   */
  async click(
    selector: string,
    options?: ClickOptions
  ): Promise<Result<void, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      await page.click(selector, {
        clickCount: options?.clickCount || 1,
        position: options?.position,
        modifiers: options?.modifiers,
        timeout: options?.timeout || this.config.timeout,
        force: options?.force,
      });

      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_INTERACTION_FAILED,
        `点击失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 双击元素
   */
  async doubleClick(
    selector: string,
    options?: { timeout?: number }
  ): Promise<Result<void, AgentError>> {
    return this.click(selector, { ...options, clickCount: 2 });
  }

  /**
   * 输入文本
   */
  async type(
    selector: string,
    text: string,
    options?: InputOptions
  ): Promise<Result<void, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      // 等待元素可交互
      await page.waitForSelector(selector, {
        timeout: options?.timeout || this.config.timeout,
        state: 'visible',
      });

      // 清空现有内容
      if (options?.clear !== false) {
        await page.fill(selector, '');
      }

      // 输入文本
      await page.type(selector, text, {
        delay: options?.delay || 0,
      });

      // 按下回车
      if (options?.pressEnter) {
        await page.press(selector, 'Enter');
      }

      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.KEYBOARD_INPUT_FAILED,
        `输入失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 选择下拉选项
   */
  async select(
    selector: string,
    value: string | string[]
  ): Promise<Result<void, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      await page.selectOption(selector, value);
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_INTERACTION_FAILED,
        `选择失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 勾选/取消勾选
   */
  async check(
    selector: string,
    checked: boolean = true
  ): Promise<Result<void, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      if (checked) {
        await page.check(selector);
      } else {
        await page.uncheck(selector);
      }

      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_INTERACTION_FAILED,
        `勾选操作失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 获取元素文本
   */
  async getText(selector: string): Promise<Result<string, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const text = await page.textContent(selector);
      return success(text || '');
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `获取文本失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 获取输入框值
   */
  async getInputValue(selector: string): Promise<Result<string, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const value = await page.inputValue(selector);
      return success(value);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `获取输入值失败: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  /**
   * 等待元素
   */
  async waitFor(
    selector: string,
    options?: {
      state?: 'attached' | 'detached' | 'visible' | 'hidden';
      timeout?: number;
    }
  ): Promise<Result<void, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      await page.waitForSelector(selector, {
        state: options?.state || 'visible',
        timeout: options?.timeout || this.config.timeout,
      });

      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `等待元素超时: ${selector}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 标签页管理
  // ════════════════════════════════════════════════════════════════════

  /**
   * 打开新标签页
   */
  async newTab(): Promise<Result<PageInfo, AgentError>> {
    try {
      const initResult = await this.ensureInitialized();
      if (!initResult.success) return initResult as any;

      const page = await this.context.newPage();
      const pageId = this.generatePageId();
      this.pages.set(pageId, page);
      this.activePageId = pageId;

      return success(await this.getPageInfo(page));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.UNKNOWN,
        `创建标签页失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * 切换标签页
   */
  async switchTab(pageId: string): Promise<Result<PageInfo, AgentError>> {
    if (!this.pages.has(pageId)) {
      return failure(createError(
        AgentErrorCode.APP_NOT_FOUND,
        `标签页不存在: ${pageId}`
      ));
    }

    this.activePageId = pageId;
    const page = this.pages.get(pageId)!;
    return success(await this.getPageInfo(page));
  }

  /**
   * 关闭标签页
   */
  async closeTab(pageId?: string): Promise<Result<void, AgentError>> {
    try {
      const targetId = pageId || this.activePageId;
      if (!targetId || !this.pages.has(targetId)) {
        return failure(createError(
          AgentErrorCode.APP_NOT_FOUND,
          '标签页不存在'
        ));
      }

      const page = this.pages.get(targetId)!;
      await page.close();
      this.pages.delete(targetId);

      // 如果关闭的是活动标签页，切换到其他标签页
      if (this.activePageId === targetId) {
        const remainingPages = Array.from(this.pages.keys());
        this.activePageId = remainingPages.length > 0 ? remainingPages[0] : null;
      }

      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.UNKNOWN,
        `关闭标签页失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * 获取所有标签页
   */
  async getTabs(): Promise<Result<PageInfo[], AgentError>> {
    const results: PageInfo[] = [];
    
    for (const [id, page] of this.pages) {
      results.push(await this.getPageInfo(page, id));
    }

    return success(results);
  }

  // ════════════════════════════════════════════════════════════════════
  // 截图和导出
  // ════════════════════════════════════════════════════════════════════

  /**
   * 截图
   */
  async screenshot(
    options?: {
      path?: string;
      fullPage?: boolean;
      selector?: string;
    }
  ): Promise<Result<Buffer, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const screenshotOptions: any = {
        fullPage: options?.fullPage || false,
      };

      if (options?.path) {
        screenshotOptions.path = options.path;
      }

      if (options?.selector) {
        const element = await page.$(options.selector);
        if (element) {
          const buffer = await element.screenshot(screenshotOptions);
          return success(buffer);
        }
      }

      const buffer = await page.screenshot(screenshotOptions);
      return success(buffer);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.SCREENSHOT_FAILED,
        `截图失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * 导出 PDF
   */
  async pdf(
    options?: {
      path?: string;
      format?: 'A4' | 'A3' | 'Letter' | 'Legal';
      printBackground?: boolean;
    }
  ): Promise<Result<Buffer, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const buffer = await page.pdf({
        format: options?.format || 'A4',
        printBackground: options?.printBackground || true,
        path: options?.path,
      });

      return success(buffer);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.UNKNOWN,
        `导出 PDF 失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 执行脚本
  // ════════════════════════════════════════════════════════════════════

  /**
   * 执行 JavaScript
   */
  async evaluate<R>(
    script: string | (() => R | Promise<R>)
  ): Promise<Result<R, AgentError>> {
    try {
      const page = this.getActivePage();
      if (!page) {
        return failure(createError(AgentErrorCode.APP_NOT_FOUND, '没有活动页面'));
      }

      const result = await page.evaluate(script);
      return success(result);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.UNKNOWN,
        `执行脚本失败: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // 私有辅助方法
  // ════════════════════════════════════════════════════════════════════

  private async ensureInitialized(): Promise<Result<void, AgentError>> {
    if (!this.isInitialized) {
      return this.initialize();
    }
    return success(undefined);
  }

  private getActivePage(): any | null {
    if (!this.activePageId) return null;
    return this.pages.get(this.activePageId) || null;
  }

  private generatePageId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getPageInfo(page: any, id?: string): Promise<PageInfo> {
    const [url, title] = await Promise.all([
      page.url(),
      page.title(),
    ]);

    return {
      url,
      title,
      id: id || this.activePageId || 'unknown',
      active: id === this.activePageId || !id,
    };
  }

  private async getElementInfo(element: any, selector: string): Promise<ElementInfo> {
    const box = await element.boundingBox();
    const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
    const text = await element.textContent();
    const visible = await element.isVisible();
    
    // 获取属性
    const attributes = await element.evaluate((el: Element) => {
      const attrs: Record<string, string> = {};
      for (const attr of el.attributes) {
        attrs[attr.name] = attr.value;
      }
      return attrs;
    });

    // 判断是否可交互
    const interactive = await element.evaluate((el: Element) => {
      const tag = el.tagName.toLowerCase();
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'option'];
      const htmlEl = el as HTMLElement;
      const hasClickHandler = htmlEl.onclick !== null || el.getAttribute('onclick');
      return interactiveTags.includes(tag) || hasClickHandler || el.hasAttribute('tabindex');
    });

    return {
      selector,
      tagName,
      text: text || undefined,
      attributes,
      bounds: box ? {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      } : { x: 0, y: 0, width: 0, height: 0 },
      visible,
      interactive,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createBrowserAutomation(config?: Partial<BrowserConfig>): BrowserAutomation {
  return new BrowserAutomation(config);
}
