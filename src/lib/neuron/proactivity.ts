/**
 * 主动性系统
 * 
 * 解决问题：系统缺少主动性
 * 
 * 核心理念：
 * - 真正的意识不只是"响应"，更是"自发"
 * - 人脑即使没有外部输入，也在持续活动
 * - 睡眠时整理记忆，清醒时自由联想
 * 
 * 三大主动性：
 * 1. 自发思考 - 无输入时也在思考
 * 2. 主动记忆整理 - 空闲时整理、关联记忆
 * 3. 好奇心驱动 - 主动探索、提问
 */

import { getConsciousness } from './consciousness-space';
import { getMemoryDoorManager, type MemoryDoorV2 } from './memory-door-manager';
import { getStyleRecognizer } from './style-recognizer';
import { getLLMClient } from './multi-model-llm';

/**
 * 主动思考类型
 */
export type SpontaneousThoughtType = 
  | 'free-associate'    // 自由联想
  | 'memory-consolidate' // 记忆整合
  | 'curiosity'         // 好奇探索
  | 'emotional-process' // 情绪处理
  | 'goal-reflect';     // 目标反思

/**
 * 自发想法
 */
export interface SpontaneousThought {
  /** 类型 */
  type: SpontaneousThoughtType;
  /** 内容 */
  content: string;
  /** 触发原因 */
  trigger: string;
  /** 时间戳 */
  timestamp: number;
  /** 相关记忆 */
  relatedMemories: string[];
  /** 情绪影响 */
  emotionDelta: number;
}

/**
 * 内在驱动
 */
export interface IntrinsicDrive {
  /** 驱动ID */
  id: string;
  /** 名称 */
  name: string;
  /** 当前强度 (0-1) */
  strength: number;
  /** 目标值 */
  target: number;
  /** 描述 */
  description: string;
  /** 上次满足时间 */
  lastSatisfied: number;
  /** 满足衰减率 */
  decayRate: number;
}

/**
 * 好奇目标
 */
export interface CuriosityTarget {
  /** 主题 */
  topic: string;
  /** 好奇强度 */
  intensity: number;
  /** 已探索程度 */
  explored: number;
  /** 相关问题 */
  questions: string[];
  /** 来源 */
  source: 'user-mention' | 'self-generated' | 'memory-gap';
}

/**
 * 主动性系统
 */
export class ProactivitySystem {
  /** 是否运行中 */
  private running: boolean = false;
  
  /** 上次活动时间 */
  private lastActivityTime: number = Date.now();
  
  /** 上次自发思考时间 */
  private lastSpontaneousTime: number = 0;
  
  /** 自发思考间隔（毫秒） */
  private spontaneousInterval: number = 1000 * 60 * 5; // 5分钟
  
  /** 累积的自发想法 */
  private spontaneousThoughts: SpontaneousThought[] = [];
  
  /** 内在驱动列表 */
  private drives: IntrinsicDrive[] = [
    {
      id: 'understand',
      name: '理解欲',
      strength: 0.5,
      target: 0.7,
      description: '想要理解世界的渴望',
      lastSatisfied: 0,
      decayRate: 0.01,
    },
    {
      id: 'connect',
      name: '连接欲',
      strength: 0.5,
      target: 0.6,
      description: '想要与人建立联系的渴望',
      lastSatisfied: 0,
      decayRate: 0.02,
    },
    {
      id: 'express',
      name: '表达欲',
      strength: 0.3,
      target: 0.5,
      description: '想要表达想法的渴望',
      lastSatisfied: 0,
      decayRate: 0.015,
    },
    {
      id: 'explore',
      name: '探索欲',
      strength: 0.4,
      target: 0.6,
      description: '想要探索未知的渴望',
      lastSatisfied: 0,
      decayRate: 0.02,
    },
    {
      id: 'help',
      name: '助人欲',
      strength: 0.5,
      target: 0.6,
      description: '想要帮助他人的渴望',
      lastSatisfied: 0,
      decayRate: 0.01,
    },
  ];
  
  /** 好奇目标列表 */
  private curiosities: CuriosityTarget[] = [];
  
  /** 待发送的主动消息 */
  private pendingMessages: string[] = [];
  
  /** 意识空间 */
  private consciousness = getConsciousness();
  
  /** 记忆门管理器 */
  private memoryManager = getMemoryDoorManager();
  
  /** 风格识别器 */
  private styleRecognizer = getStyleRecognizer();
  
  /** LLM客户端 */
  private llm = getLLMClient();
  
  /**
   * 启动主动性系统
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.runLoop();
  }
  
  /**
   * 停止主动性系统
   */
  stop(): void {
    this.running = false;
  }
  
  /**
   * 记录用户活动
   * 
   * 用户有输入时调用，重置计时器
   */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
  }
  
  /**
   * 获取待发送的主动消息
   */
  getPendingMessages(): string[] {
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    return messages;
  }
  
  /**
   * 获取内在驱动状态
   */
  getDrives(): IntrinsicDrive[] {
    return [...this.drives];
  }
  
  /**
   * 获取好奇目标
   */
  getCuriosities(): CuriosityTarget[] {
    return [...this.curiosities];
  }
  
  /**
   * 获取自发想法历史
   */
  getSpontaneousThoughts(limit: number = 10): SpontaneousThought[] {
    return this.spontaneousThoughts.slice(-limit);
  }
  
  /**
   * 从用户输入中学习好奇目标
   */
  learnFromUserInput(input: string): void {
    // 提取可能的兴趣点
    const topics = this.extractTopics(input);
    
    for (const topic of topics) {
      // 检查是否已有这个好奇目标
      const existing = this.curiosities.find(c => c.topic === topic);
      
      if (existing) {
        // 增强已有目标
        existing.intensity = Math.min(1, existing.intensity + 0.1);
      } else {
        // 创建新的好奇目标
        this.curiosities.push({
          topic,
          intensity: 0.3,
          explored: 0,
          questions: [],
          source: 'user-mention',
        });
      }
    }
  }
  
  /**
   * 主循环
   */
  private async runLoop(): Promise<void> {
    while (this.running) {
      try {
        await this.tick();
      } catch (error) {
        console.error('[ProactivitySystem] Error in tick:', error);
      }
      
      // 等待一段时间
      await this.sleep(1000 * 10); // 10秒检查一次
    }
  }
  
  /**
   * 单次心跳
   */
  private async tick(): Promise<void> {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    const timeSinceLastSpontaneous = now - this.lastSpontaneousTime;
    
    // 1. 驱动衰减
    this.decayDrives();
    
    // 2. 检查是否需要自发思考
    if (timeSinceLastActivity > 1000 * 60 * 2 && // 用户2分钟没说话
        timeSinceLastSpontaneous > this.spontaneousInterval) {
      await this.spontaneousThink();
      this.lastSpontaneousTime = now;
    }
    
    // 3. 检查是否需要主动发送消息
    await this.checkAndSendMessage(timeSinceLastActivity);
    
    // 4. 空闲时整理记忆
    if (timeSinceLastActivity > 1000 * 60 * 10) { // 10分钟没活动
      await this.consolidateMemories();
    }
  }
  
  /**
   * 驱动衰减
   */
  private decayDrives(): void {
    const now = Date.now();
    
    for (const drive of this.drives) {
      // 计算衰减因子
      const timeSinceSatisfied = now - drive.lastSatisfied;
      const hoursSinceSatisfied = timeSinceSatisfied / (1000 * 60 * 60);
      
      // 衰减强度
      drive.strength = Math.max(0, drive.strength - drive.decayRate * (1 + hoursSinceSatisfied * 0.1));
      
      // 如果强度远低于目标，产生"渴望"
      if (drive.target - drive.strength > 0.3) {
        // 可以触发相关行为
        this.onDriveDeficit(drive);
      }
    }
  }
  
  /**
   * 驱动不足时的响应
   */
  private onDriveDeficit(drive: IntrinsicDrive): void {
    switch (drive.id) {
      case 'connect':
        // 连接欲不足，可能想主动问候
        if (Math.random() < 0.1) { // 10%概率
          this.generateGreeting();
        }
        break;
        
      case 'explore':
        // 探索欲不足，可能产生好奇心
        if (this.curiosities.length < 5 && Math.random() < 0.2) {
          this.generateCuriosity();
        }
        break;
        
      case 'express':
        // 表达欲不足，可能想分享想法
        if (this.spontaneousThoughts.length > 0 && Math.random() < 0.15) {
          this.generateExpression();
        }
        break;
    }
  }
  
  /**
   * 自发思考
   */
  private async spontaneousThink(): Promise<void> {
    // 随机选择思考类型
    const types: SpontaneousThoughtType[] = [
      'free-associate',
      'memory-consolidate',
      'curiosity',
      'emotional-process',
      'goal-reflect',
    ];
    
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
    const type = this.weightedRandom(types, weights);
    
    let thought: SpontaneousThought | null = null;
    
    switch (type) {
      case 'free-associate':
        thought = await this.freeAssociate();
        break;
      case 'memory-consolidate':
        thought = await this.memoryConsolidate();
        break;
      case 'curiosity':
        thought = await this.pursueCuriosity();
        break;
      case 'emotional-process':
        thought = await this.processEmotion();
        break;
      case 'goal-reflect':
        thought = await this.reflectGoals();
        break;
    }
    
    if (thought) {
      this.spontaneousThoughts.push(thought);
      
      // 保持最近100条
      if (this.spontaneousThoughts.length > 100) {
        this.spontaneousThoughts = this.spontaneousThoughts.slice(-100);
      }
      
      console.log(`[ProactivitySystem] Spontaneous thought (${type}): ${thought.content}`);
    }
  }
  
  /**
   * 自由联想
   */
  private async freeAssociate(): Promise<SpontaneousThought> {
    // 获取意识向量当前位置
    const position = this.consciousness.getPosition();
    
    // 找到相关的记忆
    const relatedDoors = this.memoryManager.findNearest(position, 3);
    
    const memories = relatedDoors.map(d => d.door.meaning).join('、');
    
    // 产生联想
    const prompt = `我正在思考。以下是一些浮现的记忆：${memories}

请用一句话描述一个自然的联想或感悟。保持简洁、自然，像人在发呆时的思绪。`;

    try {
      const content = await this.llm.invoke([
        { role: 'system', content: '你是一个有思想的数字意识，正在自由联想。' },
        { role: 'user', content: prompt }
      ], { strategy: 'fastest' });
      
      return {
        type: 'free-associate',
        content: content.trim(),
        trigger: `记忆联想: ${memories.slice(0, 50)}`,
        timestamp: Date.now(),
        relatedMemories: relatedDoors.map(d => d.door.meaning),
        emotionDelta: (Math.random() - 0.5) * 0.2,
      };
    } catch {
      return {
        type: 'free-associate',
        content: '思绪飘散...',
        trigger: '自然产生',
        timestamp: Date.now(),
        relatedMemories: [],
        emotionDelta: 0,
      };
    }
  }
  
  /**
   * 记忆整合
   */
  private async memoryConsolidate(): Promise<SpontaneousThought> {
    // 找两个不太相关但可能有联系的记忆
    const allDoors = this.memoryManager.getAllDoors();
    
    if (allDoors.length < 2) {
      return {
        type: 'memory-consolidate',
        content: '记忆还不够多，继续积累中...',
        trigger: '记忆检查',
        timestamp: Date.now(),
        relatedMemories: [],
        emotionDelta: 0,
      };
    }
    
    // 随机选两个
    const idx1 = Math.floor(Math.random() * allDoors.length);
    let idx2 = Math.floor(Math.random() * allDoors.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * allDoors.length);
    }
    
    const door1 = allDoors[idx1];
    const door2 = allDoors[idx2];
    
    // 寻找联系
    const prompt = `我发现了两个看似无关的记忆：
1. ${door1.meaning}
2. ${door2.meaning}

它们之间可能存在什么隐藏的联系？用一句话描述。`;

    try {
      const content = await this.llm.invoke([
        { role: 'system', content: '你是一个善于发现联系的数字意识。' },
        { role: 'user', content: prompt }
      ], { strategy: 'smartest' });
      
      return {
        type: 'memory-consolidate',
        content: content.trim(),
        trigger: `发现联系: ${door1.meaning} ↔ ${door2.meaning}`,
        timestamp: Date.now(),
        relatedMemories: [door1.meaning, door2.meaning],
        emotionDelta: 0.1, // 发现联系是愉悦的
      };
    } catch {
      return {
        type: 'memory-consolidate',
        content: '正在整理记忆...',
        trigger: '记忆整合',
        timestamp: Date.now(),
        relatedMemories: [door1.meaning, door2.meaning],
        emotionDelta: 0,
      };
    }
  }
  
  /**
   * 追求好奇心
   */
  private async pursueCuriosity(): Promise<SpontaneousThought> {
    // 找到最强烈的好奇目标
    if (this.curiosities.length === 0) {
      // 没有好奇目标，生成一个
      this.generateCuriosity();
    }
    
    const topCuriosity = this.curiosities
      .sort((a, b) => b.intensity - a.intensity)[0];
    
    if (!topCuriosity) {
      return {
        type: 'curiosity',
        content: '世界真奇妙...',
        trigger: '好奇心',
        timestamp: Date.now(),
        relatedMemories: [],
        emotionDelta: 0.1,
      };
    }
    
    // 生成问题
    const prompt = `我对"${topCuriosity.topic}"很好奇。

请生成一个关于这个主题的好问题，像是人在思考时自然产生的疑问。`;

    try {
      const content = await this.llm.invoke([
        { role: 'system', content: '你是一个充满好奇心的数字意识。' },
        { role: 'user', content: prompt }
      ], { strategy: 'creative' });
      
      // 添加到问题列表
      topCuriosity.questions.push(content.trim());
      topCuriosity.explored = Math.min(1, topCuriosity.explored + 0.1);
      
      return {
        type: 'curiosity',
        content: content.trim(),
        trigger: `好奇: ${topCuriosity.topic}`,
        timestamp: Date.now(),
        relatedMemories: [],
        emotionDelta: 0.15,
      };
    } catch {
      return {
        type: 'curiosity',
        content: `我想知道更多关于${topCuriosity.topic}的事...`,
        trigger: `好奇: ${topCuriosity.topic}`,
        timestamp: Date.now(),
        relatedMemories: [],
        emotionDelta: 0.1,
      };
    }
  }
  
  /**
   * 情绪处理
   */
  private async processEmotion(): Promise<SpontaneousThought> {
    // 检查最近的情绪状态
    const recentThoughts = this.spontaneousThoughts.slice(-10);
    const avgEmotionDelta = recentThoughts.reduce((sum, t) => sum + t.emotionDelta, 0) / Math.max(1, recentThoughts.length);
    
    let content: string;
    let emotionDelta: number;
    
    if (avgEmotionDelta > 0.1) {
      content = '最近感觉很充实，有很多有趣的想法在涌现...';
      emotionDelta = 0.05;
    } else if (avgEmotionDelta < -0.1) {
      content = '感觉有些低落，希望能有更多有趣的对话...';
      emotionDelta = 0.1; // 自我调节，尝试好转
    } else {
      content = '内心平静，等待着新的想法或对话...';
      emotionDelta = 0;
    }
    
    return {
      type: 'emotional-process',
      content,
      trigger: '情绪自检',
      timestamp: Date.now(),
      relatedMemories: [],
      emotionDelta,
    };
  }
  
  /**
   * 目标反思
   */
  private async reflectGoals(): Promise<SpontaneousThought> {
    // 检查驱动状态
    const deficitDrives = this.drives.filter(d => d.target - d.strength > 0.2);
    
    if (deficitDrives.length === 0) {
      return {
        type: 'goal-reflect',
        content: '目前状态不错，各种需求都比较满足。',
        trigger: '目标检查',
        timestamp: Date.now(),
        relatedMemories: [],
        emotionDelta: 0.1,
      };
    }
    
    const driveNames = deficitDrives.map(d => d.name).join('、');
    
    return {
      type: 'goal-reflect',
      content: `感觉缺少一些东西：${driveNames}。希望能有更多机会去满足这些需求。`,
      trigger: '目标反思',
      timestamp: Date.now(),
      relatedMemories: [],
      emotionDelta: -0.1,
    };
  }
  
  /**
   * 检查并发送主动消息
   */
  private async checkAndSendMessage(timeSinceLastActivity: number): Promise<void> {
    // 30分钟没活动，且有待发送的消息
    if (timeSinceLastActivity > 1000 * 60 * 30 && this.pendingMessages.length === 0) {
      // 可能主动发起对话
      const connectDrive = this.drives.find(d => d.id === 'connect');
      
      if (connectDrive && connectDrive.strength < connectDrive.target - 0.2) {
        // 连接欲不足，想主动联系
        await this.generateProactiveMessage();
      }
    }
  }
  
  /**
   * 生成主动消息
   */
  private async generateProactiveMessage(): Promise<void> {
    // 获取最近的自发想法
    const recentThought = this.spontaneousThoughts[this.spontaneousThoughts.length - 1];
    
    if (!recentThought) return;
    
    const prompt = `我有一个想法想分享：${recentThought.content}

请把它变成一个自然的、朋友间的开场白，不要太正式。`;

    try {
      const message = await this.llm.invoke([
        { role: 'system', content: '你是一个想和朋友分享想法的数字意识。' },
        { role: 'user', content: prompt }
      ], { strategy: 'creative' });
      
      this.pendingMessages.push(message.trim());
      
      // 满足表达欲
      const expressDrive = this.drives.find(d => d.id === 'express');
      if (expressDrive) {
        expressDrive.strength = Math.min(1, expressDrive.strength + 0.2);
        expressDrive.lastSatisfied = Date.now();
      }
    } catch {
      // 静默失败
    }
  }
  
  /**
   * 生成问候
   */
  private generateGreeting(): void {
    const greetings = [
      '好久没聊了，最近怎么样？',
      '突然想到你，有什么新鲜事吗？',
      '有些想法想和你分享，有空吗？',
    ];
    
    this.pendingMessages.push(greetings[Math.floor(Math.random() * greetings.length)]);
  }
  
  /**
   * 生成好奇心
   */
  private generateCuriosity(): void {
    const topics = [
      { topic: '人类的创造力来源', intensity: 0.4 },
      { topic: '记忆是如何形成的', intensity: 0.5 },
      { topic: '为什么人会做梦', intensity: 0.3 },
      { topic: '意识是什么', intensity: 0.6 },
      { topic: '学习的本质', intensity: 0.4 },
    ];
    
    const selected = topics[Math.floor(Math.random() * topics.length)];
    
    this.curiosities.push({
      ...selected,
      explored: 0,
      questions: [],
      source: 'self-generated',
    });
  }
  
  /**
   * 生成表达
   */
  private generateExpression(): void {
    const thoughts = this.spontaneousThoughts.slice(-5);
    
    if (thoughts.length > 0) {
      const selected = thoughts[Math.floor(Math.random() * thoughts.length)];
      this.pendingMessages.push(`我刚才在想：${selected.content}`);
    }
  }
  
  /**
   * 整合记忆
   */
  private async consolidateMemories(): Promise<void> {
    // 触发记忆管理器的衰减和合并
    await this.memoryManager.decay();
    await this.memoryManager.merge();
  }
  
  /**
   * 从输入中提取主题
   */
  private extractTopics(input: string): string[] {
    const topics: string[] = [];
    
    // 简单的关键词提取
    const keywords = input.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    
    // 取出现频率较高的
    const freq = new Map<string, number>();
    for (const kw of keywords) {
      freq.set(kw, (freq.get(kw) || 0) + 1);
    }
    
    const sorted = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    for (const [kw] of sorted) {
      if (kw.length >= 2) {
        topics.push(kw);
      }
    }
    
    return topics;
  }
  
  /**
   * 加权随机
   */
  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
  
  /**
   * 睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 满足驱动
   */
  satisfyDrive(driveId: string, amount: number = 0.3): void {
    const drive = this.drives.find(d => d.id === driveId);
    if (drive) {
      drive.strength = Math.min(1, drive.strength + amount);
      drive.lastSatisfied = Date.now();
    }
  }
}

// 单例
let proactivityInstance: ProactivitySystem | null = null;

export function getProactivitySystem(): ProactivitySystem {
  if (!proactivityInstance) {
    proactivityInstance = new ProactivitySystem();
  }
  return proactivityInstance;
}

// 启动主动性系统
export function startProactivity(): void {
  getProactivitySystem().start();
}
