/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - 多模态执行器
 * 
 * 支持图片理解、视频分析
 * 使用 LLM Vision 模型
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { ActionStructure } from '../info-field/structures';
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

type MediaType = 'image' | 'video';

interface MediaAnalysisResult {
  description: string;
  objects?: string[];
  text?: string;
  emotions?: string[];
  actions?: string[];
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// 多模态执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * 多模态执行器
 * 
 * 使用 Vision LLM 分析图片和视频
 */
export class MultimodalExecutor implements ActionExecutor {
  readonly type = 'multimodal';
  
  private llm: LLMClient;
  private visionModel: string;
  
  constructor(customHeaders?: Record<string, string>, visionModel?: string) {
    const config = new Config();
    this.llm = new LLMClient(config, customHeaders);
    this.visionModel = visionModel || 'doubao-seed-1-6-vision-250815';
  }
  
  getCapabilities(): ExecutorCapabilities {
    return {
      name: 'Multimodal Executor',
      description: '多模态执行器，支持图片和视频理解',
      supportedActions: [
        'analyze-image',
        'analyze-video',
        'ocr',
        'describe',
        'extract-text'
      ]
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.getCapabilities().supportedActions.includes(action.action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    switch (action.action) {
      case 'analyze-image':
        return this.analyzeImage(action);
      case 'analyze-video':
        return this.analyzeVideo(action);
      case 'ocr':
      case 'extract-text':
        return this.extractText(action);
      case 'describe':
        return this.describe(action);
      default:
        return {
          actionId: action.id,
          status: 'failed',
          content: '',
          error: `不支持的多模态行动类型: ${action.action}`,
          completed: false
        };
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 行动实现
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 分析图片
   */
  private async analyzeImage(action: ActionStructure): Promise<ActionResult> {
    const imageUrl = action.target;
    const prompt = action.value || '请详细描述这张图片的内容，包括：主体、背景、颜色、氛围、可能的故事。';
    
    try {
      const response = await this.llm.invoke([
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ], {
        model: this.visionModel,
        temperature: 0.7
      });
      
      const extracted = new Map<string, unknown>();
      extracted.set('description', response.content);
      extracted.set('imageUrl', imageUrl);
      
      return {
        actionId: action.id,
        status: 'success',
        content: response.content,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `图片分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  /**
   * 分析视频
   */
  private async analyzeVideo(action: ActionStructure): Promise<ActionResult> {
    const videoUrl = action.target;
    const fps = parseInt(action.value || '1', 10);
    const prompt = '请描述这个视频的内容，包括主要事件、人物动作、场景变化等。';
    
    try {
      const response = await this.llm.invoke([
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'video_url',
              video_url: {
                url: videoUrl,
                fps: Math.min(Math.max(fps, 0.2), 5) // 限制在 0.2-5 之间
              }
            }
          ]
        }
      ], {
        model: this.visionModel,
        temperature: 0.7
      });
      
      const extracted = new Map<string, unknown>();
      extracted.set('description', response.content);
      extracted.set('videoUrl', videoUrl);
      extracted.set('fps', fps);
      
      return {
        actionId: action.id,
        status: 'success',
        content: response.content,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `视频分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  /**
   * 提取文字（OCR）
   */
  private async extractText(action: ActionStructure): Promise<ActionResult> {
    const imageUrl = action.target;
    const prompt = '请识别图片中的所有文字，按原始布局输出。如果没有文字，请说明。';
    
    try {
      const response = await this.llm.invoke([
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ], {
        model: this.visionModel,
        temperature: 0.3 // 低温度，更准确
      });
      
      const extracted = new Map<string, unknown>();
      extracted.set('text', response.content);
      extracted.set('imageUrl', imageUrl);
      
      return {
        actionId: action.id,
        status: 'success',
        content: `提取的文字:\n${response.content}`,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `文字提取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  /**
   * 描述媒体内容
   */
  private async describe(action: ActionStructure): Promise<ActionResult> {
    const mediaUrl = action.target;
    const mediaType = this.detectMediaType(mediaUrl);
    const prompt = action.value || '请用简洁的语言描述这个内容。';
    
    if (mediaType === 'video') {
      // 创建新的视频分析行动
      const videoAction = new ActionStructure(
        action.id + '-video',
        action.source,
        'analyze-video',
        mediaUrl,
        '1' // fps
      );
      return this.analyzeVideo(videoAction);
    } else {
      // 创建新的图片分析行动
      const imageAction = new ActionStructure(
        action.id + '-image',
        action.source,
        'analyze-image',
        mediaUrl,
        prompt
      );
      return this.analyzeImage(imageAction);
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
  private detectMediaType(url: string): MediaType {
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    
    const lowerUrl = url.toLowerCase();
    
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
      return 'video';
    }
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
      return 'image';
    }
    
    // 默认当作图片处理
    return 'image';
  }
}
