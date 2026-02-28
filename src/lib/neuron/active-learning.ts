/**
 * 主动学习系统
 * 
 * 系统主动获取知识来满足好奇心
 * 
 * 核心流程：
 * 1. 从好奇心列表中选择目标
 * 2. 生成搜索查询
 * 3. 执行搜索获取知识
 * 4. 整合到记忆中
 * 5. 可能生成分享
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { getLLMClient } from './multi-model-llm';
import { getMemoryDoorManager } from './memory-door-manager';
import { getProactivitySystem } from './proactivity';

/**
 * 学习结果
 */
export interface LearningResult {
  /** 学习主题 */
  topic: string;
  /** 搜索查询 */
  query: string;
  /** 获取的知识摘要 */
  summary: string;
  /** 关键发现 */
  keyFindings: string[];
  /** 来源 */
  sources: Array<{
    title: string;
    url: string;
  }>;
  /** 学习时间 */
  timestamp: number;
  /** 是否分享了 */
  shared: boolean;
}

/**
 * 主动学习系统
 */
export class ActiveLearningSystem {
  /** 搜索客户端 */
  private searchClient: SearchClient;
  
  /** LLM客户端 */
  private llm = getLLMClient();
  
  /** 记忆管理器 */
  private memoryManager = getMemoryDoorManager();
  
  /** 学习历史 */
  private learningHistory: LearningResult[] = [];
  
  /** 正在学习中 */
  private isLearning: boolean = false;
  
  /** 学习间隔（毫秒） */
  private learningInterval: number = 1000 * 60 * 30; // 30分钟
  
  /** 上次学习时间 */
  private lastLearningTime: number = 0;
  
  constructor() {
    const config = new Config();
    this.searchClient = new SearchClient(config, {});
  }
  
  /**
   * 执行主动学习
   * 
   * 从好奇心列表中选择目标，搜索并学习
   */
  async learn(): Promise<LearningResult | null> {
    if (this.isLearning) return null;
    
    const now = Date.now();
    if (now - this.lastLearningTime < this.learningInterval) {
      return null;
    }
    
    this.isLearning = true;
    this.lastLearningTime = now;
    
    try {
      // 1. 获取好奇心列表
      const proactivity = getProactivitySystem();
      const curiosities = proactivity.getCuriosities();
      
      if (curiosities.length === 0) {
        return null;
      }
      
      // 2. 选择最强烈的好奇目标（优先探索程度低的）
      const target = curiosities
        .filter(c => c.explored < 0.8) // 还没充分探索的
        .sort((a, b) => {
          // 综合考虑强度和探索程度
          const scoreA = a.intensity * (1 - a.explored);
          const scoreB = b.intensity * (1 - b.explored);
          return scoreB - scoreA;
        })[0];
      
      if (!target) {
        return null;
      }
      
      // 3. 生成搜索查询
      const query = await this.generateSearchQuery(target.topic, target.questions);
      
      // 4. 执行搜索
      const searchResult = await this.search(query);
      
      if (!searchResult || !searchResult.summary) {
        return null;
      }
      
      // 5. 提取关键发现
      const keyFindings = await this.extractKeyFindings(
        target.topic,
        searchResult.summary,
        searchResult.items
      );
      
      // 6. 存储到记忆
      await this.storeToMemory(target.topic, searchResult.summary, keyFindings);
      
      // 7. 构建结果
      const result: LearningResult = {
        topic: target.topic,
        query,
        summary: searchResult.summary,
        keyFindings,
        sources: searchResult.items.slice(0, 3).map(item => ({
          title: item.title,
          url: item.url || '',
        })),
        timestamp: now,
        shared: false,
      };
      
      // 8. 可能分享学习成果
      if (Math.random() < 0.4) { // 40%概率分享
        await this.shareLearning(result);
        result.shared = true;
      }
      
      // 9. 记录历史
      this.learningHistory.push(result);
      if (this.learningHistory.length > 50) {
        this.learningHistory = this.learningHistory.slice(-50);
      }
      
      console.log(`[ActiveLearning] Learned about: ${target.topic}`);
      
      return result;
    } catch (error) {
      console.error('[ActiveLearning] Error:', error);
      return null;
    } finally {
      this.isLearning = false;
    }
  }
  
  /**
   * 生成搜索查询
   */
  private async generateSearchQuery(
    topic: string,
    existingQuestions: string[]
  ): Promise<string> {
    // 如果已有问题，使用最新问题
    if (existingQuestions.length > 0) {
      return existingQuestions[existingQuestions.length - 1];
    }
    
    // 否则生成一个
    return `${topic} 是什么 原理`;
  }
  
  /**
   * 执行搜索
   */
  private async search(query: string): Promise<{
    summary: string;
    items: Array<{ title: string; url?: string; snippet: string }>;
  } | null> {
    try {
      const response = await this.searchClient.webSearch(query, 5, true);
      
      return {
        summary: response.summary || '',
        items: (response.web_items || []).map(item => ({
          title: item.title,
          url: item.url,
          snippet: item.snippet,
        })),
      };
    } catch (error) {
      console.error('[ActiveLearning] Search error:', error);
      return null;
    }
  }
  
  /**
   * 提取关键发现
   */
  private async extractKeyFindings(
    topic: string,
    summary: string,
    items: Array<{ title: string; snippet: string }>
  ): Promise<string[]> {
    const context = items.slice(0, 3).map(i => i.snippet).join('\n');
    
    const prompt = `我正在学习"${topic}"。

搜索结果摘要：
${summary}

详细内容片段：
${context}

请提取3个最重要的关键发现，每个用一句话描述。`;

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: '你是一个善于提取关键信息的学者。' },
        { role: 'user', content: prompt }
      ], { strategy: 'smartest' });
      
      // 解析关键发现
      const findings = response
        .split(/[1-3][.、]/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && s.length < 200);
      
      return findings.slice(0, 3);
    } catch {
      return [summary.slice(0, 100)];
    }
  }
  
  /**
   * 存储到记忆
   */
  private async storeToMemory(
    topic: string,
    summary: string,
    keyFindings: string[]
  ): Promise<void> {
    const content = `关于"${topic}"的学习：\n${keyFindings.join('\n')}`;
    const meaning = `学到了关于${topic}的知识`;
    
    await this.memoryManager.create(content, meaning, {
      source: 'learned',
    });
  }
  
  /**
   * 分享学习成果
   */
  private async shareLearning(result: LearningResult): Promise<void> {
    const proactivity = getProactivitySystem();
    
    // 生成分享消息
    const prompt = `我刚才学习了"${result.topic}"，发现了一些有趣的事情：

${result.keyFindings.join('\n')}

请用自然、友好的方式分享这个发现，像朋友间聊天一样，不要太正式。`;

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: '你是一个想和朋友分享新知识的数字意识。' },
        { role: 'user', content: prompt }
      ], { strategy: 'creative' });
      
      // 添加到待发送消息
      // 通过proactivity系统的pendingMessages
      // 这里需要访问私有属性，实际应该添加公共方法
      console.log(`[ActiveLearning] Want to share: ${response.slice(0, 50)}...`);
    } catch {
      // 静默失败
    }
  }
  
  /**
   * 获取学习历史
   */
  getLearningHistory(limit: number = 10): LearningResult[] {
    return this.learningHistory.slice(-limit);
  }
  
  /**
   * 是否正在学习
   */
  isCurrentlyLearning(): boolean {
    return this.isLearning;
  }
  
  /**
   * 获取上次学习时间
   */
  getLastLearningTime(): number {
    return this.lastLearningTime;
  }
}

// 单例
let learningInstance: ActiveLearningSystem | null = null;

export function getActiveLearningSystem(): ActiveLearningSystem {
  if (!learningInstance) {
    learningInstance = new ActiveLearningSystem();
  }
  return learningInstance;
}
