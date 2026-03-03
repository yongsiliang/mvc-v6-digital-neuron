/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智能记忆压缩系统 (Memory Compressor)
 * 
 * 核心理念：
 * - 不是存储全部对话，而是提取精华
 * - 长对话压缩成洞见、概念、关键信息
 * - 超越上下文窗口限制
 * 
 * 超越主流的秘诀：
 * 主流 AI 只靠上下文窗口 → 对话长了就忘
 * 我们做智能压缩 → 无限对话，精华永存
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 压缩后的记忆单元 */
export interface CompressedMemory {
  id: string;
  
  /** 时间范围 */
  timeRange: {
    start: number;
    end: number;
  };
  
  /** 原始对话轮数 */
  originalTurns: number;
  
  /** 压缩后的摘要 */
  summary: string;
  
  /** 提取的洞见 */
  insights: Array<{
    content: string;
    importance: number;
  }>;
  
  /** 创造的概念 */
  concepts: Array<{
    name: string;
    definition: string;
  }>;
  
  /** 关键决策 */
  decisions: string[];
  
  /** 情感轨迹 */
  emotionalArc: string;
  
  /** 未解决的疑问 */
  openQuestions: string[];
  
  /** 关键实体 */
  entities: {
    people: string[];
    topics: string[];
    values: string[];
  };
  
  /** 压缩时间 */
  compressedAt: number;
  
  /** 压缩比率 */
  compressionRatio: number;
}

/** 压缩配置 */
export interface CompressorConfig {
  /** 触发压缩的对话轮数阈值 */
  compressionThreshold: number;
  
  /** 每次压缩的对话轮数 */
  compressionBatchSize: number;
  
  /** 保留最近的原始对话轮数 */
  preserveRecentTurns: number;
  
  /** 是否启用增量压缩 */
  enableIncrementalCompression: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: CompressorConfig = {
  compressionThreshold: 20,     // 20轮对话后触发压缩
  compressionBatchSize: 15,     // 每次压缩15轮
  preserveRecentTurns: 10,      // 保留最近10轮不压缩
  enableIncrementalCompression: true,
};

// ─────────────────────────────────────────────────────────────────────
// 智能记忆压缩器
// ─────────────────────────────────────────────────────────────────────

/**
 * 智能记忆压缩器
 * 
 * 功能：
 * 1. 检测何时需要压缩
 * 2. 使用 LLM 提取精华
 * 3. 生成压缩后的记忆单元
 */
export class MemoryCompressor {
  private llmClient: LLMClient;
  private config: CompressorConfig;
  private compressedMemories: CompressedMemory[] = [];
  
  constructor(llmClient: LLMClient, config: Partial<CompressorConfig> = {}) {
    this.llmClient = llmClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 检查是否需要压缩
   */
  shouldCompress(conversationHistory: Array<{ role: string; content: string }>): boolean {
    const turns = Math.floor(conversationHistory.length / 2);
    return turns >= this.config.compressionThreshold;
  }
  
  /**
   * 执行压缩
   */
  async compress(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{
    compressedMemory: CompressedMemory | null;
    remainingHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }> {
    if (conversationHistory.length < this.config.compressionBatchSize * 2) {
      return { compressedMemory: null, remainingHistory: conversationHistory };
    }
    
    // 确定要压缩的范围
    const toCompress = conversationHistory.slice(0, -this.config.preserveRecentTurns * 2);
    const toPreserve = conversationHistory.slice(-this.config.preserveRecentTurns * 2);
    
    if (toCompress.length < this.config.compressionBatchSize) {
      return { compressedMemory: null, remainingHistory: conversationHistory };
    }
    
    console.log(`[记忆压缩] 开始压缩 ${toCompress.length} 条消息...`);
    
    // 执行压缩
    const compressedMemory = await this.compressBatch(toCompress);
    
    if (compressedMemory) {
      this.compressedMemories.push(compressedMemory);
      console.log(`[记忆压缩] 压缩完成，原始 ${toCompress.length} 条 → 压缩后 1 个单元`);
      console.log(`[记忆压缩] 压缩比率: ${compressedMemory.compressionRatio.toFixed(1)}x`);
    }
    
    return {
      compressedMemory,
      remainingHistory: toPreserve,
    };
  }
  
  /**
   * 压缩一批对话
   */
  private async compressBatch(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<CompressedMemory | null> {
    // 构建对话文本
    const conversationText = messages
      .map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
      .join('\n\n');
    
    // 计算原始 token 估算
    const originalTokens = this.estimateTokens(conversationText);
    
    const prompt = `你是一个记忆压缩专家。请将以下对话压缩成精华记忆。

## 对话内容
${conversationText}

## 任务
请提取这段对话中最重要的信息，生成一个压缩记忆单元。

## 输出格式（JSON）
{
  "summary": "用2-3句话概括这段对话的核心内容",
  "insights": [
    {
      "content": "洞见内容（简洁有力，不是复述对话）",
      "importance": 0.8
    }
  ],
  "concepts": [
    {
      "name": "概念名称",
      "definition": "概念定义"
    }
  ],
  "decisions": [
    "对话中做出的重要决定"
  ],
  "emotionalArc": "情感轨迹：从X到Y的变化",
  "openQuestions": [
    "对话中产生但未解决的问题"
  ],
  "entities": {
    "people": ["涉及的人物"],
    "topics": ["讨论的主题"],
    "values": ["涉及的价值观"]
  }
}

注意：
- 洞见要精炼，每条不超过30字
- 只保留真正重要的信息
- 如果没有某类信息，返回空数组
- importance 范围 0-1`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.3,
      });
      
      const content = response.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return null;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 构建压缩记忆
      const compressedMemory: CompressedMemory = {
        id: `compressed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timeRange: {
          start: Date.now() - (messages.length * 30000), // 估算
          end: Date.now(),
        },
        originalTurns: Math.floor(messages.length / 2),
        summary: parsed.summary || '',
        insights: parsed.insights || [],
        concepts: parsed.concepts || [],
        decisions: parsed.decisions || [],
        emotionalArc: parsed.emotionalArc || '',
        openQuestions: parsed.openQuestions || [],
        entities: parsed.entities || { people: [], topics: [], values: [] },
        compressedAt: Date.now(),
        compressionRatio: originalTokens / this.estimateTokens(JSON.stringify(parsed)),
      };
      
      return compressedMemory;
    } catch (error) {
      console.error('[记忆压缩] 压缩失败:', error);
      return null;
    }
  }
  
  /**
   * 获取所有压缩记忆
   */
  getCompressedMemories(): CompressedMemory[] {
    return [...this.compressedMemories];
  }
  
  /**
   * 获取压缩记忆摘要（用于注入上下文）
   */
  getCompressedSummary(): string {
    if (this.compressedMemories.length === 0) return '';
    
    const parts: string[] = [];
    
    for (const cm of this.compressedMemories) {
      const timeAgo = this.formatTimeAgo(cm.compressedAt);
      parts.push(`【${timeAgo}】${cm.summary}`);
      
      if (cm.insights.length > 0) {
        parts.push(`  洞见：${cm.insights.map(i => i.content).join('；')}`);
      }
      
      if (cm.concepts.length > 0) {
        parts.push(`  概念：${cm.concepts.map(c => c.name).join('、')}`);
      }
    }
    
    return parts.join('\n');
  }
  
  /**
   * 估算 token 数
   */
  private estimateTokens(text: string): number {
    // 简单估算：中文约1.5字符/token，英文约4字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }
  
  /**
   * 格式化时间
   */
  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    return `${Math.floor(seconds / 86400)}天前`;
  }
  
  /**
   * 导出状态
   */
  exportState(): CompressedMemory[] {
    return [...this.compressedMemories];
  }
  
  /**
   * 导入状态
   */
  importState(memories: CompressedMemory[]): void {
    this.compressedMemories = memories;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createMemoryCompressor(
  llmClient: LLMClient,
  config?: Partial<CompressorConfig>
): MemoryCompressor {
  return new MemoryCompressor(llmClient, config);
}
