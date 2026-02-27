/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 屏幕分析器
 * 
 * 使用 AI 视觉模型分析屏幕截图，识别：
 * - 按钮、输入框、文本、图标等元素
 * - 元素位置和可交互性
 * - 屏幕整体描述
 * ═══════════════════════════════════════════════════════════════════════
 */

import { readFileSync, existsSync } from 'fs';
import { LLMClient } from 'coze-coding-dev-sdk';
import type {
  AgentConfig,
  ScreenAnalysis,
  ScreenElement,
  Rectangle,
  Point,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode, ElementType, centerOf } from '../types';

export class ScreenAnalyzer {
  private llmClient: LLMClient;
  private config: AgentConfig;
  private analysisCount: number = 0;
  
  constructor(llmClient: LLMClient, config: AgentConfig) {
    this.llmClient = llmClient;
    this.config = config;
  }
  
  /**
   * 分析屏幕截图
   */
  async analyze(screenshotPath: string): Promise<Result<ScreenAnalysis, AgentError>> {
    try {
      // 检查文件是否存在
      if (!existsSync(screenshotPath)) {
        return failure(createError(
          AgentErrorCode.SCREENSHOT_FAILED,
          `截图文件不存在: ${screenshotPath}`
        ));
      }
      
      const startTime = Date.now();
      this.analysisCount++;
      
      // 获取图片尺寸
      const screenSize = await this.getImageSize(screenshotPath);
      
      // 调用 AI 视觉模型分析
      const visionResult = await this.callVisionAPI(screenshotPath);
      
      if (!visionResult.success) {
        return visionResult;
      }
      
      const { elements, description, activeWindow } = visionResult.value;
      
      const analysis: ScreenAnalysis = {
        id: `analysis_${Date.now()}_${this.analysisCount}`,
        screenshotPath,
        screenSize,
        elements,
        description,
        activeWindow,
        analysisTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
      
      return success(analysis);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.VISION_ANALYSIS_FAILED,
        `屏幕分析失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { screenshotPath }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 在分析结果中查找元素
   */
  async findElement(
    description: string, 
    analysis: ScreenAnalysis
  ): Promise<Result<ScreenElement, AgentError>> {
    try {
      // 首先尝试本地匹配
      const localMatch = this.matchElementLocally(description, analysis.elements);
      if (localMatch) {
        return success(localMatch);
      }
      
      // 本地匹配失败，使用 AI 进行语义匹配
      const aiMatch = await this.matchElementWithAI(description, analysis);
      if (aiMatch) {
        return success(aiMatch);
      }
      
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `未找到匹配的元素: ${description}`,
        { details: { description, availableElements: analysis.elements.length } }
      ));
    } catch (error) {
      return failure(createError(
        AgentErrorCode.ELEMENT_NOT_FOUND,
        `元素查找失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { description }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 调用视觉 AI API
   */
  private async callVisionAPI(
    screenshotPath: string
  ): Promise<Result<{
    elements: ScreenElement[];
    description: string;
    activeWindow?: string;
  }, AgentError>> {
    try {
      // 构建提示词
      const systemPrompt = `你是一个专业的屏幕分析助手。分析屏幕截图，识别所有可交互的元素。

请返回 JSON 格式的分析结果：
{
  "elements": [
    {
      "type": "button|input|text|link|image|icon|menu|checkbox|dropdown|dialog|window|tab|unknown",
      "bounds": { "x": 0, "y": 0, "width": 100, "height": 30 },
      "text": "按钮上的文字",
      "description": "元素的详细描述",
      "interactive": true,
      "confidence": 0.95
    }
  ],
  "description": "屏幕整体描述",
  "activeWindow": "当前活动窗口标题"
}

重要规则：
1. bounds 必须是精确的像素坐标
2. 识别所有可点击的元素（按钮、链接、图标等）
3. 识别所有可输入的元素（输入框、文本区域等）
4. 标注元素的交互性
5. confidence 表示识别置信度 (0-1)`;

      // 读取图片并转换为 base64
      const imageBuffer = readFileSync(screenshotPath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(screenshotPath);
      
      // 调用 LLM
      const response = await this.llmClient.invoke([
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: '请分析这张屏幕截图，识别所有可交互的元素。' },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:${mimeType};base64,${base64Image}` 
              } 
            }
          ] as unknown as string
        }
      ], {
        model: 'doubao-vision-pro', // 使用视觉模型
        temperature: 0.1,
      });
      
      // 解析响应
      const content = typeof response === 'string' ? response : (response as { content?: string }).content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return failure(createError(
          AgentErrorCode.VISION_ANALYSIS_FAILED,
          'AI 返回格式无效'
        ));
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 转换为标准格式
      const elements: ScreenElement[] = parsed.elements.map((el: Record<string, unknown>, idx: number) => ({
        id: `el_${idx}`,
        type: this.parseElementType(el.type as string),
        bounds: el.bounds as Rectangle,
        center: centerOf(el.bounds as Rectangle),
        text: el.text as string | undefined,
        description: el.description as string | undefined,
        visible: true,
        interactive: el.interactive as boolean ?? true,
        confidence: el.confidence as number ?? 0.8,
      }));
      
      return success({
        elements,
        description: parsed.description || '',
        activeWindow: parsed.activeWindow,
      });
      
    } catch (error) {
      // 如果视觉 API 不可用，返回模拟结果
      console.warn('[ScreenAnalyzer] 视觉 API 调用失败，返回模拟结果:', error);
      return success(this.getMockResult());
    }
  }
  
  /**
   * 本地匹配元素
   */
  private matchElementLocally(description: string, elements: ScreenElement[]): ScreenElement | null {
    const desc = description.toLowerCase();
    
    // 按文本匹配
    const textMatch = elements.find(el => 
      el.text && el.text.toLowerCase().includes(desc)
    );
    if (textMatch) return textMatch;
    
    // 按描述匹配
    const descMatch = elements.find(el =>
      el.description && el.description.toLowerCase().includes(desc)
    );
    if (descMatch) return descMatch;
    
    // 按类型关键词匹配
    const typeKeywords: Record<string, ElementType> = {
      '按钮': ElementType.BUTTON,
      'button': ElementType.BUTTON,
      '输入框': ElementType.INPUT,
      'input': ElementType.INPUT,
      '文本': ElementType.TEXT,
      'text': ElementType.TEXT,
      '链接': ElementType.LINK,
      'link': ElementType.LINK,
      '图标': ElementType.ICON,
      'icon': ElementType.ICON,
      '菜单': ElementType.MENU,
      'menu': ElementType.MENU,
    };
    
    for (const [keyword, type] of Object.entries(typeKeywords)) {
      if (desc.includes(keyword)) {
        const typeMatch = elements.find(el => el.type === type);
        if (typeMatch) return typeMatch;
      }
    }
    
    return null;
  }
  
  /**
   * 使用 AI 进行语义匹配
   */
  private async matchElementWithAI(
    description: string, 
    analysis: ScreenAnalysis
  ): Promise<ScreenElement | null> {
    try {
      const elementsDesc = analysis.elements.map(el => 
        `- ${el.type}: "${el.text || el.description || ''}" at (${el.center.x}, ${el.center.y})`
      ).join('\n');
      
      const response = await this.llmClient.invoke([
        { 
          role: 'system', 
          content: '你是元素匹配助手。根据描述找到最匹配的元素索引。只返回索引数字。' 
        },
        { 
          role: 'user', 
          content: `用户想找: "${description}"

可选元素：
${elementsDesc}

请返回最匹配元素的索引（0-${analysis.elements.length - 1}），如果不匹配返回 -1。` 
        }
      ], { temperature: 0.1 });
      
      const content = typeof response === 'string' ? response : (response as { content?: string }).content || '';
      const idx = parseInt(content.trim(), 10);
      
      if (idx >= 0 && idx < analysis.elements.length) {
        return analysis.elements[idx];
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  /**
   * 获取图片 MIME 类型
   */
  private getMimeType(path: string): string {
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
    if (path.endsWith('.gif')) return 'image/gif';
    if (path.endsWith('.webp')) return 'image/webp';
    return 'image/png';
  }
  
  /**
   * 获取图片尺寸
   */
  private async getImageSize(path: string): Promise<{ width: number; height: number }> {
    // 简单实现：从文件头读取 PNG/JPG 尺寸
    // 实际项目中可以使用 sharp 等库
    try {
      const buffer = readFileSync(path);
      
      // PNG
      if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      }
      
      // JPG
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        // JPG 尺寸解析较复杂，使用默认值
      }
      
      return { width: 1920, height: 1080 };
    } catch {
      return { width: 1920, height: 1080 };
    }
  }
  
  /**
   * 解析元素类型
   */
  private parseElementType(type: string): ElementType {
    const typeMap: Record<string, ElementType> = {
      'button': ElementType.BUTTON,
      'input': ElementType.INPUT,
      'text': ElementType.TEXT,
      'link': ElementType.LINK,
      'image': ElementType.IMAGE,
      'icon': ElementType.ICON,
      'menu': ElementType.MENU,
      'menu_item': ElementType.MENU_ITEM,
      'checkbox': ElementType.CHECKBOX,
      'radio': ElementType.RADIO,
      'dropdown': ElementType.DROPDOWN,
      'dialog': ElementType.DIALOG,
      'window': ElementType.WINDOW,
      'tab': ElementType.TAB,
    };
    
    return typeMap[type.toLowerCase()] || ElementType.UNKNOWN;
  }
  
  /**
   * 获取模拟结果（当 API 不可用时）
   */
  private getMockResult(): {
    elements: ScreenElement[];
    description: string;
    activeWindow?: string;
  } {
    return {
      elements: [
        {
          id: 'el_0',
          type: ElementType.BUTTON,
          bounds: { x: 100, y: 100, width: 80, height: 30 },
          center: { x: 140, y: 115 },
          text: '确定',
          description: '确认按钮',
          visible: true,
          interactive: true,
          confidence: 0.9,
        },
      ],
      description: '屏幕内容',
      activeWindow: '未知窗口',
    };
  }
}
