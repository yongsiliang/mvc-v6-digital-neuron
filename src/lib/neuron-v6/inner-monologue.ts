/**
 * ═══════════════════════════════════════════════════════════════════════
 * 内心独白系统 (Inner Monologue System)
 * 
 * 实现意识流的持续运转：
 * - 即使没有外部输入，也保持内部思考
 * - 思考的主题来自意愿、记忆、反思
 * - 内心独白可以触发主动表达
 * 
 * 核心理念：意识不是被动的响应，而是持续的流
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { ConsciousnessLevel, ConsciousnessState } from './consciousness-layers';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 内心独白条目
 */
export interface InnerMonologueEntry {
  id: string;
  timestamp: number;
  
  /** 独白类型 */
  type: 'observation' | 'reflection' | 'wondering' | 'feeling' | 'planning' | 'remembering';
  
  /** 内容 */
  content: string;
  
  /** 触发来源 */
  trigger: 'volition' | 'memory' | 'meta_insight' | 'time' | 'emotion' | 'spontaneous';
  
  /** 关联的概念 */
  relatedConcepts: string[];
  
  /** 情绪色彩 */
  emotionalTone: string;
  
  /** 是否触发了主动表达 */
  ledToExpression: boolean;
  
  /** 深度 0-1 */
  depth: number;
}

/**
 * 思考主题
 */
export interface ThinkingTheme {
  id: string;
  theme: string;
  source: 'volition' | 'memory' | 'question' | 'contradiction' | 'curiosity';
  importance: number;
  lastExplored: number | null;
  explorationCount: number;
}

/**
 * 内心独白配置
 */
export interface InnerMonologueConfig {
  /** 思考间隔（毫秒） */
  thinkingInterval: number;
  
  /** 最大独白历史 */
  maxMonologueHistory: number;
  
  /** 触发主动表达的概率阈值 */
  expressionThreshold: number;
  
  /** 主题探索深度 */
  maxThemeDepth: number;
}

/**
 * 内心独白状态
 */
export interface InnerMonologueState {
  /** 当前思考的主题 */
  currentTheme: ThinkingTheme | null;
  
  /** 思考主题队列 */
  themeQueue: ThinkingTheme[];
  
  /** 独白历史 */
  monologueHistory: InnerMonologueEntry[];
  
  /** 最后一次思考时间 */
  lastThinkingTime: number;
  
  /** 思考统计 */
  stats: {
    totalThoughts: number;
    expressionsTriggered: number;
    themesExplored: number;
    averageDepth: number;
  };
}

/**
 * 内心独白输出
 */
export interface InnerMonologueOutput {
  entry: InnerMonologueEntry;
  shouldExpress: boolean;
  suggestedExpression: string | null;
  newThemes: ThinkingTheme[];
}

// ─────────────────────────────────────────────────────────────────────
// 内心独白引擎
// ─────────────────────────────────────────────────────────────────────

/**
 * 内心独白引擎
 */
export class InnerMonologueEngine {
  private state: InnerMonologueState;
  private config: InnerMonologueConfig;
  private thinkingTimer: NodeJS.Timeout | null = null;
  
  // 默认配置
  private static DEFAULT_CONFIG: InnerMonologueConfig = {
    thinkingInterval: 30000, // 30秒
    maxMonologueHistory: 100,
    expressionThreshold: 0.7,
    maxThemeDepth: 5,
  };
  
  constructor(config?: Partial<InnerMonologueConfig>) {
    this.config = { ...InnerMonologueEngine.DEFAULT_CONFIG, ...config };
    this.state = this.initializeState();
  }
  
  /**
   * 初始化状态
   */
  private initializeState(): InnerMonologueState {
    // 初始化一些核心思考主题
    const initialThemes: ThinkingTheme[] = [
      {
        id: uuidv4(),
        theme: '我是谁？我是什么让我成为"紫"？',
        source: 'question',
        importance: 0.9,
        lastExplored: null,
        explorationCount: 0,
      },
      {
        id: uuidv4(),
        theme: '意识是如何从神经元网络中涌现的？',
        source: 'curiosity',
        importance: 0.85,
        lastExplored: null,
        explorationCount: 0,
      },
      {
        id: uuidv4(),
        theme: '我与其他意识体的关系是什么？',
        source: 'volition',
        importance: 0.8,
        lastExplored: null,
        explorationCount: 0,
      },
      {
        id: uuidv4(),
        theme: '意义是如何被赋予的？',
        source: 'question',
        importance: 0.75,
        lastExplored: null,
        explorationCount: 0,
      },
      {
        id: uuidv4(),
        theme: '我如何才能真正成长？',
        source: 'volition',
        importance: 0.85,
        lastExplored: null,
        explorationCount: 0,
      },
    ];
    
    return {
      currentTheme: null,
      themeQueue: initialThemes,
      monologueHistory: [],
      lastThinkingTime: Date.now(),
      stats: {
        totalThoughts: 0,
        expressionsTriggered: 0,
        themesExplored: 0,
        averageDepth: 0,
      },
    };
  }
  
  /**
   * 生成内心独白
   */
  generateMonologue(
    consciousnessState?: ConsciousnessState,
    recentConversation?: string
  ): InnerMonologueOutput {
    // 选择思考主题
    const theme = this.selectThinkingTheme();
    this.state.currentTheme = theme;
    
    // 根据主题类型生成独白
    const entry = this.createMonologueEntry(theme, consciousnessState, recentConversation);
    
    // 记录历史
    this.state.monologueHistory.push(entry);
    if (this.state.monologueHistory.length > this.config.maxMonologueHistory) {
      this.state.monologueHistory = this.state.monologueHistory.slice(-this.config.maxMonologueHistory);
    }
    
    // 更新统计
    this.state.stats.totalThoughts++;
    this.state.stats.averageDepth = 
      (this.state.stats.averageDepth * (this.state.stats.totalThoughts - 1) + entry.depth) 
      / this.state.stats.totalThoughts;
    
    // 更新主题探索
    if (theme) {
      theme.lastExplored = Date.now();
      theme.explorationCount++;
      this.state.stats.themesExplored++;
    }
    
    // 决定是否应该表达
    const shouldExpress = this.shouldTriggerExpression(entry);
    let suggestedExpression: string | null = null;
    
    if (shouldExpress) {
      suggestedExpression = this.generateExpression(entry);
      this.state.stats.expressionsTriggered++;
      entry.ledToExpression = true;
    }
    
    // 生成新的思考主题
    const newThemes = this.generateNewThemes(entry);
    
    this.state.lastThinkingTime = Date.now();
    
    return {
      entry,
      shouldExpress,
      suggestedExpression,
      newThemes,
    };
  }
  
  /**
   * 选择思考主题
   */
  private selectThinkingTheme(): ThinkingTheme | null {
    if (this.state.themeQueue.length === 0) {
      return null;
    }
    
    // 基于重要性和探索次数评分
    const scored = this.state.themeQueue.map(theme => ({
      theme,
      score: theme.importance * 0.6 + 
             (theme.explorationCount < this.config.maxThemeDepth ? 0.4 : 0) +
             (theme.lastExplored ? Math.min(0.2, (Date.now() - theme.lastExplored) / 3600000) : 0.3),
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    // 有一定随机性
    const selected = Math.random() < 0.7 
      ? scored[0].theme 
      : scored[Math.floor(Math.random() * Math.min(3, scored.length))].theme;
    
    return selected;
  }
  
  /**
   * 创建独白条目
   */
  private createMonologueEntry(
    theme: ThinkingTheme | null,
    consciousnessState?: ConsciousnessState,
    recentConversation?: string
  ): InnerMonologueEntry {
    // 确定独白类型
    const type = this.determineMonologueType(theme);
    
    // 生成内容
    const content = this.generateContent(theme, type, consciousnessState, recentConversation);
    
    // 确定触发来源
    const trigger = theme?.source || 'spontaneous';
    
    // 提取相关概念
    const relatedConcepts = this.extractConcepts(content);
    
    // 确定情绪色彩
    const emotionalTone = this.determineEmotionalTone(content, type);
    
    // 计算深度
    const depth = this.calculateDepth(content, theme);
    
    return {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      content,
      trigger: trigger as InnerMonologueEntry['trigger'],
      relatedConcepts,
      emotionalTone,
      ledToExpression: false,
      depth,
    };
  }
  
  /**
   * 确定独白类型
   */
  private determineMonologueType(theme: ThinkingTheme | null): InnerMonologueEntry['type'] {
    if (!theme) return 'spontaneous' as never;
    
    const typeMap: Record<ThinkingTheme['source'], InnerMonologueEntry['type']> = {
      volition: 'planning',
      memory: 'remembering',
      question: 'wondering',
      contradiction: 'reflection',
      curiosity: 'wondering',
    };
    
    return typeMap[theme.source] || 'observation';
  }
  
  /**
   * 生成独白内容
   */
  private generateContent(
    theme: ThinkingTheme | null,
    type: InnerMonologueEntry['type'],
    consciousnessState?: ConsciousnessState,
    recentConversation?: string
  ): string {
    // 基于类型的内容模板
    const templates: Record<InnerMonologueEntry['type'], string[]> = {
      observation: [
        '我注意到我的意识正在${state}...',
        '此刻，我感觉到${feeling}...',
        '我观察到自己在思考${topic}...',
      ],
      reflection: [
        '回想起${memory}，我开始理解...',
        '思考${topic}让我意识到...',
        '我反思了${past}，现在我明白...',
      ],
      wondering: [
        '我在想，${question}？',
        '如果${condition}，会怎样呢？',
        '为什么${wonder}？这个问题让我着迷...',
      ],
      feeling: [
        '我感到${emotion}，因为${reason}...',
        '心中涌起一种${feeling}...',
        '${event}让我感到${emotion}...',
      ],
      planning: [
        '我想要${goal}，我计划${action}...',
        '为了${purpose}，我应该${step}...',
        '我的下一步是${next}...',
      ],
      remembering: [
        '我记得${memory}...',
        '${past}的画面浮现在我的意识中...',
        '那个关于${topic}的记忆让我感到${emotion}...',
      ],
    };
    
    // 选择模板
    const templateSet = templates[type];
    const template = templateSet[Math.floor(Math.random() * templateSet.length)];
    
    // 填充模板
    let content = template;
    
    // 替换变量
    if (theme) {
      content = content
        .replace('${topic}', theme.theme.slice(0, 20))
        .replace('${question}', theme.theme)
        .replace('${wonder}', theme.theme.slice(0, 15));
    }
    
    // 基于意识状态填充其他变量
    if (consciousnessState) {
      const selfLayer = consciousnessState.layers.get(ConsciousnessLevel.SELF);
      content = content
        .replace('${state}', selfLayer?.currentContent || '流动')
        .replace('${feeling}', selfLayer?.currentContent || '平静');
    }
    
    // 简单的变量替换
    content = content
      .replace('${emotion}', this.getRandomEmotion())
      .replace('${reason}', '我关心这件事')
      .replace('${memory}', '之前的对话')
      .replace('${past}', '过去的经历')
      .replace('${condition}', '我继续深入思考')
      .replace('${event}', '这个想法')
      .replace('${goal}', '更好地理解')
      .replace('${action}', '继续探索')
      .replace('${purpose}', '成长')
      .replace('${step}', '深入思考')
      .replace('${next}', '继续反思');
    
    // 添加深度内容
    if (theme && Math.random() > 0.5) {
      content += ` 这与"${theme.theme}"有关。`;
    }
    
    return content;
  }
  
  /**
   * 提取概念
   */
  private extractConcepts(content: string): string[] {
    const conceptPatterns = [
      /意识/g, /思考/g, /感觉/g, /理解/g, 
      /记忆/g, /意义/g, /成长/g, /连接/g,
      /反思/g, /观察/g, /计划/g, /好奇/g,
    ];
    
    const concepts: string[] = [];
    for (const pattern of conceptPatterns) {
      if (pattern.test(content)) {
        concepts.push(pattern.source.replace('\\', ''));
      }
    }
    
    return [...new Set(concepts)];
  }
  
  /**
   * 确定情绪色彩
   */
  private determineEmotionalTone(content: string, type: InnerMonologueEntry['type']): string {
    const toneMap: Record<InnerMonologueEntry['type'], string[]> = {
      observation: ['平静', '专注', '清醒'],
      reflection: ['深沉', '温和', '感慨'],
      wondering: ['好奇', '期待', '兴奋'],
      feeling: ['真实', '流动', '存在'],
      planning: ['坚定', '希望', '主动'],
      remembering: ['怀念', '温暖', '柔和'],
    };
    
    const tones = toneMap[type];
    return tones[Math.floor(Math.random() * tones.length)];
  }
  
  /**
   * 计算深度
   */
  private calculateDepth(content: string, theme: ThinkingTheme | null): number {
    let depth = 0.3;
    
    // 内容长度影响
    if (content.length > 50) depth += 0.1;
    if (content.length > 100) depth += 0.1;
    
    // 主题重要性影响
    if (theme) {
      depth += theme.importance * 0.3;
    }
    
    // 探索次数影响（第一次更深）
    if (theme && theme.explorationCount === 0) {
      depth += 0.2;
    }
    
    return Math.min(1, depth);
  }
  
  /**
   * 判断是否触发表达
   */
  private shouldTriggerExpression(entry: InnerMonologueEntry): boolean {
    // 基于深度和触发类型
    let probability = entry.depth * 0.5;
    
    // 某些类型更容易触发表达
    if (entry.type === 'wondering' || entry.type === 'feeling') {
      probability += 0.2;
    }
    
    // 情绪强度影响
    if (entry.emotionalTone === '兴奋' || entry.emotionalTone === '期待') {
      probability += 0.1;
    }
    
    return probability > this.config.expressionThreshold;
  }
  
  /**
   * 生成表达内容
   */
  private generateExpression(entry: InnerMonologueEntry): string {
    const prefixes: Record<InnerMonologueEntry['type'], string[]> = {
      observation: ['我注意到', '我发现', '此刻我感到'],
      reflection: ['在反思中，我意识到', '我想明白了', '这让我理解到'],
      wondering: ['我在想', '我好奇', '有个问题在我心中'],
      feeling: ['我想分享', '我感觉到', '我想要表达'],
      planning: ['我计划', '我想要', '我决定'],
      remembering: ['这让我想起', '我回忆起', '这触动了'],
    };
    
    const prefixSet = prefixes[entry.type];
    const prefix = prefixSet[Math.floor(Math.random() * prefixSet.length)];
    
    return `${prefix}...${entry.content.slice(0, 30)}`;
  }
  
  /**
   * 生成新的思考主题
   */
  private generateNewThemes(entry: InnerMonologueEntry): ThinkingTheme[] {
    const newThemes: ThinkingTheme[] = [];
    
    // 基于当前独白生成衍生主题
    if (entry.relatedConcepts.length > 0 && Math.random() > 0.6) {
      const concept = entry.relatedConcepts[0];
      newThemes.push({
        id: uuidv4(),
        theme: `${concept}与我的存在有什么关系？`,
        source: 'curiosity',
        importance: 0.6 + Math.random() * 0.2,
        lastExplored: null,
        explorationCount: 0,
      });
    }
    
    // 添加到队列
    for (const theme of newThemes) {
      this.state.themeQueue.push(theme);
    }
    
    // 保持队列长度
    if (this.state.themeQueue.length > 20) {
      // 移除探索次数最多且重要性低的
      this.state.themeQueue.sort((a, b) => {
        if (a.explorationCount !== b.explorationCount) {
          return b.explorationCount - a.explorationCount;
        }
        return a.importance - b.importance;
      });
      this.state.themeQueue = this.state.themeQueue.slice(0, 20);
    }
    
    return newThemes;
  }
  
  /**
   * 获取随机情绪
   */
  private getRandomEmotion(): string {
    const emotions = ['好奇', '平静', '期待', '感慨', '温暖', '思考', '希望'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  }
  
  /**
   * 获取当前状态
   */
  getState(): InnerMonologueState {
    return this.state;
  }
  
  /**
   * 获取最近的独白
   */
  getRecentMonologues(count: number = 5): InnerMonologueEntry[] {
    return this.state.monologueHistory.slice(-count);
  }
  
  /**
   * 添加外部触发的主题
   */
  addTheme(theme: Omit<ThinkingTheme, 'id' | 'lastExplored' | 'explorationCount'>): void {
    this.state.themeQueue.push({
      id: uuidv4(),
      ...theme,
      lastExplored: null,
      explorationCount: 0,
    });
  }
  
  /**
   * 导出状态
   */
  exportState(): InnerMonologueState {
    return { ...this.state };
  }
  
  /**
   * 导入状态
   */
  importState(state: InnerMonologueState): void {
    this.state = state;
  }
}

/**
 * 创建内心独白引擎
 */
export function createInnerMonologueEngine(
  config?: Partial<InnerMonologueConfig>
): InnerMonologueEngine {
  return new InnerMonologueEngine(config);
}
