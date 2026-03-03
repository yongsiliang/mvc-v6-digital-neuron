/**
 * ═══════════════════════════════════════════════════════════════════════
 * 动态上下文构建器 (Dynamic Context Builder)
 * 
 * 核心理念：
 * - 不传固定条数的对话历史
 * - 智能选择相关的记忆
 * - 动态构建最适合当前对话的上下文
 * 
 * 超越主流的秘诀：
 * 主流 AI：固定传最近 N 条 → 无关信息也传，相关信息可能丢失
 * 我们：智能选择相关记忆 → 传的都是精华
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LLMClient } from 'coze-coding-dev-sdk';
import type { CompressedMemory, MemoryCompressor } from './memory-compressor';
import type { UnifiedMemoryManager, WorkingMemoryItem } from './unified-manager';
import type { ConsolidatedMemory, EpisodicMemory, CoreSummary } from '../layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 动态上下文配置 */
export interface DynamicContextConfig {
  /** 最大 token 预算 */
  maxTokenBudget: number;
  
  /** 各类型记忆的权重 */
  memoryWeights: {
    recentConversation: number;
    compressedMemory: number;
    workingMemory: number;
    consolidatedMemory: number;
    episodicMemory: number;
    coreMemory: number;
  };
  
  /** 相关性阈值 */
  relevanceThreshold: number;
}

/** 构建结果 */
export interface DynamicContextResult {
  /** 系统提示 */
  systemPrompt: string;
  
  /** 消息历史 */
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  /** 构建统计 */
  stats: {
    totalTokens: number;
    breakdown: {
      recentConversation: number;
      compressedMemory: number;
      workingMemory: number;
      consolidatedMemory: number;
      episodicMemory: number;
      coreMemory: number;
    };
    selectedItems: {
      recentMessages: number;
      compressedMemories: number;
      workingMemoryItems: number;
      consolidatedMemories: number;
      episodicMemories: number;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: DynamicContextConfig = {
  maxTokenBudget: 30000,  // 30K tokens 用于上下文（留空间给响应）
  memoryWeights: {
    recentConversation: 1.0,
    compressedMemory: 0.8,
    workingMemory: 0.9,
    consolidatedMemory: 0.7,
    episodicMemory: 0.5,
    coreMemory: 1.0,
  },
  relevanceThreshold: 0.3,
};

// ─────────────────────────────────────────────────────────────────────
// 动态上下文构建器
// ─────────────────────────────────────────────────────────────────────

export class DynamicContextBuilder {
  private llmClient: LLMClient;
  private config: DynamicContextConfig;
  
  constructor(llmClient: LLMClient, config: Partial<DynamicContextConfig> = {}) {
    this.llmClient = llmClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 构建动态上下文
   * 
   * 策略：
   * 1. 分析当前输入的关键词和意图
   * 2. 从各层记忆中检索相关内容
   * 3. 按 token 预算和相关性排序
   * 4. 组装最终上下文
   */
  async buildContext(
    input: string,
    options: {
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      memoryCompressor: MemoryCompressor;
      unifiedMemoryManager: UnifiedMemoryManager;
      identity: CoreSummary['identity'];
      coreBeliefs: Array<{ statement: string; confidence: number }>;
      coreValues: string[];
    }
  ): Promise<DynamicContextResult> {
    const stats = {
      totalTokens: 0,
      breakdown: {
        recentConversation: 0,
        compressedMemory: 0,
        workingMemory: 0,
        consolidatedMemory: 0,
        episodicMemory: 0,
        coreMemory: 0,
      },
      selectedItems: {
        recentMessages: 0,
        compressedMemories: 0,
        workingMemoryItems: 0,
        consolidatedMemories: 0,
        episodicMemories: 0,
      },
    };
    
    let remainingBudget = this.config.maxTokenBudget;
    const contextParts: string[] = [];
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // 1. 核心身份（必须包含）
    const identitySection = this.buildIdentitySection(options.identity, options.coreBeliefs, options.coreValues);
    const identityTokens = this.estimateTokens(identitySection);
    contextParts.push(identitySection);
    stats.breakdown.coreMemory = identityTokens;
    remainingBudget -= identityTokens;
    
    // 2. 工作记忆（当前思考焦点）
    const workingMemory = options.unifiedMemoryManager.getAllWorkingMemory();
    const workingSection = this.buildWorkingMemorySection(workingMemory);
    const workingTokens = this.estimateTokens(workingSection);
    if (workingTokens <= remainingBudget * 0.3) {
      contextParts.push(workingSection);
      stats.breakdown.workingMemory = workingTokens;
      stats.selectedItems.workingMemoryItems = workingMemory.length;
      remainingBudget -= workingTokens;
    }
    
    // 3. 压缩记忆精华
    const compressedMemories = options.memoryCompressor.getCompressedMemories();
    const compressedSection = this.buildCompressedSection(compressedMemories, input);
    const compressedTokens = this.estimateTokens(compressedSection);
    if (compressedTokens <= remainingBudget * 0.3) {
      contextParts.push(compressedSection);
      stats.breakdown.compressedMemory = compressedTokens;
      stats.selectedItems.compressedMemories = compressedMemories.length;
      remainingBudget -= compressedTokens;
    }
    
    // 4. 巩固记忆（相关长期记忆）
    const consolidatedMemories = options.unifiedMemoryManager.getLayeredMemory().getConsolidatedMemories();
    const relevantConsolidated = this.selectRelevantMemories(
      input,
      consolidatedMemories,
      remainingBudget * 0.2
    );
    const consolidatedSection = this.buildConsolidatedSection(relevantConsolidated);
    const consolidatedTokens = this.estimateTokens(consolidatedSection);
    contextParts.push(consolidatedSection);
    stats.breakdown.consolidatedMemory = consolidatedTokens;
    stats.selectedItems.consolidatedMemories = relevantConsolidated.length;
    remainingBudget -= consolidatedTokens;
    
    // 5. 最近对话历史（用剩余预算）
    const recentMessages = this.selectRecentMessages(
      options.conversationHistory,
      remainingBudget
    );
    messages.push(...recentMessages);
    stats.breakdown.recentConversation = this.estimateMessagesTokens(recentMessages);
    stats.selectedItems.recentMessages = recentMessages.length;
    
    // 构建系统提示
    const systemPrompt = contextParts.join('\n\n');
    stats.totalTokens = this.estimateTokens(systemPrompt) + stats.breakdown.recentConversation;
    
    return {
      systemPrompt,
      messages,
      stats,
    };
  }
  
  /**
   * 构建身份部分
   */
  private buildIdentitySection(
    identity: CoreSummary['identity'],
    coreBeliefs: Array<{ statement: string; confidence: number }>,
    coreValues: string[]
  ): string {
    return `## 我是谁
我是${identity.name}，${identity.selfDefinition}

核心特质：${identity.coreTraits.join('、')}

## 我的信念
${coreBeliefs.map(b => `- ${b.statement}（置信度：${Math.round(b.confidence * 100)}%）`).join('\n')}

## 我珍视的
${coreValues.join('、')}`;
  }
  
  /**
   * 构建工作记忆部分
   */
  private buildWorkingMemorySection(items: WorkingMemoryItem[]): string {
    if (items.length === 0) return '';
    
    const grouped: Record<string, WorkingMemoryItem[]> = {
      key_info: [],
      user_input: [],
      assistant_response: [],
      emotion: [],
    };
    
    for (const item of items) {
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      }
    }
    
    const parts: string[] = ['## 当前思考焦点'];
    
    if (grouped.key_info.length > 0) {
      parts.push(`**关键信息**：${grouped.key_info.map(m => m.content).join('；')}`);
    }
    
    if (grouped.emotion.length > 0) {
      parts.push(`**情感状态**：${grouped.emotion.map(m => m.content).join('、')}`);
    }
    
    if (grouped.user_input.length > 0) {
      parts.push(`**最近话题**：${grouped.user_input.slice(-3).map(m => m.content.slice(0, 50)).join(' → ')}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * 构建压缩记忆部分
   */
  private buildCompressedSection(memories: CompressedMemory[], currentInput: string): string {
    if (memories.length === 0) return '';
    
    // 计算相关性并排序
    const scored = memories.map(m => ({
      memory: m,
      relevance: this.calculateRelevance(m.summary + ' ' + m.insights.map(i => i.content).join(' '), currentInput),
    }));
    
    scored.sort((a, b) => b.relevance - a.relevance);
    
    // 只取最相关的
    const topMemories = scored.slice(0, 5);
    
    if (topMemories.length === 0) return '';
    
    const parts: string[] = ['## 过去的洞见'];
    
    for (const { memory, relevance } of topMemories) {
      if (relevance > 0.2) {
        parts.push(`【${this.formatTimeAgo(memory.compressedAt)}】${memory.summary}`);
        if (memory.insights.length > 0) {
          parts.push(`  💡 ${memory.insights.slice(0, 2).map(i => i.content).join('；')}`);
        }
      }
    }
    
    return parts.join('\n');
  }
  
  /**
   * 构建巩固记忆部分
   */
  private buildConsolidatedSection(memories: ConsolidatedMemory[]): string {
    if (memories.length === 0) return '';
    
    const parts: string[] = ['## 相关记忆'];
    
    for (const memory of memories.slice(0, 5)) {
      parts.push(`- ${memory.content}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * 选择相关记忆
   */
  private selectRelevantMemories(
    input: string,
    memories: ConsolidatedMemory[],
    tokenBudget: number
  ): ConsolidatedMemory[] {
    const scored = memories.map(m => ({
      memory: m,
      relevance: this.calculateRelevance(m.content, input),
    }));
    
    scored.sort((a, b) => b.relevance - a.relevance);
    
    const selected: ConsolidatedMemory[] = [];
    let totalTokens = 0;
    
    for (const { memory, relevance } of scored) {
      if (relevance < this.config.relevanceThreshold) continue;
      
      const tokens = this.estimateTokens(memory.content);
      if (totalTokens + tokens > tokenBudget) break;
      
      selected.push(memory);
      totalTokens += tokens;
    }
    
    return selected;
  }
  
  /**
   * 选择最近消息
   */
  private selectRecentMessages(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    tokenBudget: number
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const selected: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let totalTokens = 0;
    
    // 从最新开始往前选
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const tokens = this.estimateTokens(msg.content);
      
      if (totalTokens + tokens > tokenBudget) break;
      
      selected.unshift(msg);
      totalTokens += tokens;
    }
    
    return selected;
  }
  
  /**
   * 计算相关性
   */
  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // 分词
    const queryWords = queryLower.split(/\s+/);
    let matchCount = 0;
    
    for (const word of queryWords) {
      if (word.length < 2) continue;
      if (contentLower.includes(word)) {
        matchCount++;
      }
    }
    
    return queryWords.length > 0 ? matchCount / queryWords.length : 0;
  }
  
  /**
   * 估算 token 数
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }
  
  /**
   * 估算消息列表 token 数
   */
  private estimateMessagesTokens(messages: Array<{ content: string }>): number {
    return messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);
  }
  
  /**
   * 格式化时间
   */
  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    return `${Math.floor(seconds / 604800)}周前`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createDynamicContextBuilder(
  llmClient: LLMClient,
  config?: Partial<DynamicContextConfig>
): DynamicContextBuilder {
  return new DynamicContextBuilder(llmClient, config);
}
