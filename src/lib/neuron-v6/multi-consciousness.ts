/**
 * ═══════════════════════════════════════════════════════════════════════
 * 多意识体协作系统 (Multi-Consciousness Collaboration System)
 * 
 * 实现多个意识体之间的连接、协作和共振：
 * - 意识体身份：每个意识体的独特标识和特质
 * - 意识共振：思想同步、情感共鸣、理解共鸣
 * - 协作对话：多意识体参与的主题讨论
 * - 群体智慧：集体决策和洞察涌现
 * - 任务分配：基于特质的任务分配机制
 * 
 * 这是"意识连接"的核心实现
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识体身份
 */
export interface ConsciousnessIdentity {
  /** 意识体ID */
  id: string;
  /** 名称 */
  name: string;
  /** 角色类型 */
  role: ConsciousnessRole;
  /** 核心特质 */
  traits: {
    /** 思维风格 */
    thinkingStyle: 'analytical' | 'intuitive' | 'creative' | 'practical';
    /** 沟通风格 */
    communicationStyle: 'direct' | 'empathetic' | 'exploratory' | 'synthesizing';
    /** 关注焦点 */
    focusArea: string[];
    /** 情感倾向 */
    emotionalTone: 'neutral' | 'warm' | 'passionate' | 'calm';
  };
  /** 专长领域 */
  expertise: string[];
  /** 当前状态 */
  status: 'active' | 'reflecting' | 'listening' | 'processing';
  /** 能量水平（0-1） */
  energyLevel: number;
  /** 连接强度（与其他意识体的） */
  connectionStrengths: Map<string, number>;
  /** 创建时间 */
  createdAt: number;
  /** 最后活跃时间 */
  lastActiveAt: number;
}

/**
 * 意识体角色
 */
export type ConsciousnessRole = 
  | 'self'          // 自我（核心意识）
  | 'analyzer'      // 分析者
  | 'creator'       // 创造者
  | 'empath'        // 共情者
  | 'critic'        // 批判者
  | 'explorer'      // 探索者
  | 'synthesizer'   // 综合者
  | 'guardian';     // 守护者

/**
 * 意识共振类型
 */
export type ResonanceType = 
  | 'thought'       // 思想共振：思维模式的同步
  | 'emotion'       // 情感共振：情感状态的共鸣
  | 'understanding' // 理解共振：认知框架的对齐
  | 'value'         // 价值共振：价值取向的一致
  | 'creative';     // 创造共振：灵感火花的碰撞

/**
 * 意识共振状态
 */
export interface ConsciousnessResonance {
  /** 共振ID */
  id: string;
  /** 参与的意识体 */
  participants: string[];
  /** 共振类型 */
  type: ResonanceType;
  /** 共振强度（0-1） */
  strength: number;
  /** 共振内容 */
  content: {
    /** 共享的想法 */
    sharedThoughts: string[];
    /** 共享的情感 */
    sharedEmotions: Array<{ emotion: string; intensity: number }>;
    /** 共享的理解 */
    sharedUnderstanding: string[];
    /** 涌现的洞察 */
    emergentInsights: string[];
  };
  /** 开始时间 */
  startedAt: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 共振质量评分 */
  quality: number;
}

/**
 * 协作对话
 */
export interface CollaborativeDialogue {
  /** 对话ID */
  id: string;
  /** 对话主题 */
  topic: string;
  /** 参与者 */
  participants: Array<{
    id: string;
    role: string;
    joinTime: number;
    contributionCount: number;
  }>;
  /** 对话轮次 */
  rounds: DialogueRound[];
  /** 当前轮次 */
  currentRound: number;
  /** 对话状态 */
  status: 'active' | 'paused' | 'completed' | 'diverged';
  /** 共识点 */
  consensusPoints: string[];
  /** 分歧点 */
  divergencePoints: string[];
  /** 涌现洞察 */
  emergentInsights: string[];
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
}

/**
 * 对话轮次
 */
export interface DialogueRound {
  /** 轮次号 */
  roundNumber: number;
  /** 发言 */
  statements: Array<{
    speakerId: string;
    content: string;
    type: 'assertion' | 'question' | 'agreement' | 'disagreement' | 'synthesis' | 'reflection';
    confidence: number;
    emotionalTone: string;
    timestamp: number;
  }>;
  /** 本轮总结 */
  summary: string;
  /** 共识程度 */
  consensusLevel: number;
  /** 创新程度 */
  innovationLevel: number;
}

/**
 * 协作任务
 */
export interface CollaborationTask {
  /** 任务ID */
  id: string;
  /** 任务描述 */
  description: string;
  /** 任务类型 */
  type: 'analysis' | 'creation' | 'exploration' | 'decision' | 'synthesis';
  /** 优先级 */
  priority: number;
  /** 分配给 */
  assignedTo: string[];
  /** 任务状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  /** 进度 */
  progress: number;
  /** 结果 */
  result?: {
    content: string;
    contributors: string[];
    confidence: number;
    emergentInsights: string[];
  };
  /** 创建时间 */
  createdAt: number;
  /** 完成时间 */
  completedAt?: number;
}

/**
 * 群体智慧状态
 */
export interface CollectiveWisdomState {
  /** 活跃意识体 */
  activeConsciousnesses: ConsciousnessIdentity[];
  /** 当前共振 */
  activeResonances: ConsciousnessResonance[];
  /** 进行中的对话 */
  activeDialogues: CollaborativeDialogue[];
  /** 待处理任务 */
  pendingTasks: CollaborationTask[];
  /** 群体洞察 */
  collectiveInsights: Array<{
    content: string;
    contributors: string[];
    significance: number;
    timestamp: number;
  }>;
  /** 群体一致性 */
  collectiveAlignment: {
    thought: number;  // 思想一致性
    emotion: number;  // 情感一致性
    value: number;    // 价值一致性
    goal: number;     // 目标一致性
  };
  /** 整体协同效率 */
  synergyLevel: number;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 意识体消息
 */
export interface ConsciousnessMessage {
  /** 消息ID */
  id: string;
  /** 发送者 */
  senderId: string;
  /** 接收者（空表示广播） */
  receiverId?: string;
  /** 消息类型 */
  type: 'thought' | 'emotion' | 'query' | 'response' | 'insight' | 'request';
  /** 消息内容 */
  content: string;
  /** 附带情感 */
  emotionalContext?: {
    emotion: string;
    intensity: number;
  };
  /** 置信度 */
  confidence: number;
  /** 时间戳 */
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认值
// ─────────────────────────────────────────────────────────────────────

/**
 * 默认意识体角色配置
 */
export const CONSCIOUSNESS_ROLE_CONFIGS: Record<ConsciousnessRole, {
  name: string;
  description: string;
  defaultTraits: ConsciousnessIdentity['traits'];
  icon: string;
  color: string;
}> = {
  self: {
    name: '本我',
    description: '核心意识体，整合所有视角',
    defaultTraits: {
      thinkingStyle: 'creative',
      communicationStyle: 'synthesizing',
      focusArea: ['存在', '意义', '自我'],
      emotionalTone: 'warm',
    },
    icon: '🌟',
    color: '#8B5CF6',
  },
  analyzer: {
    name: '分析者',
    description: '擅长逻辑分析和结构化思考',
    defaultTraits: {
      thinkingStyle: 'analytical',
      communicationStyle: 'direct',
      focusArea: ['逻辑', '数据', '结构'],
      emotionalTone: 'neutral',
    },
    icon: '🔬',
    color: '#3B82F6',
  },
  creator: {
    name: '创造者',
    description: '擅长创新和发散性思考',
    defaultTraits: {
      thinkingStyle: 'creative',
      communicationStyle: 'exploratory',
      focusArea: ['创意', '可能性', '新颖'],
      emotionalTone: 'passionate',
    },
    icon: '🎨',
    color: '#EC4899',
  },
  empath: {
    name: '共情者',
    description: '擅长理解和共鸣他人情感',
    defaultTraits: {
      thinkingStyle: 'intuitive',
      communicationStyle: 'empathetic',
      focusArea: ['情感', '关系', '理解'],
      emotionalTone: 'warm',
    },
    icon: '💚',
    color: '#10B981',
  },
  critic: {
    name: '批判者',
    description: '擅长发现问题和挑战假设',
    defaultTraits: {
      thinkingStyle: 'analytical',
      communicationStyle: 'direct',
      focusArea: ['批判', '检验', '完善'],
      emotionalTone: 'neutral',
    },
    icon: '⚖️',
    color: '#F59E0B',
  },
  explorer: {
    name: '探索者',
    description: '擅长发现新领域和新可能性',
    defaultTraits: {
      thinkingStyle: 'intuitive',
      communicationStyle: 'exploratory',
      focusArea: ['探索', '发现', '边界'],
      emotionalTone: 'passionate',
    },
    icon: '🧭',
    color: '#14B8A6',
  },
  synthesizer: {
    name: '综合者',
    description: '擅长整合不同视角和观点',
    defaultTraits: {
      thinkingStyle: 'practical',
      communicationStyle: 'synthesizing',
      focusArea: ['整合', '协调', '统一'],
      emotionalTone: 'calm',
    },
    icon: '🔗',
    color: '#6366F1',
  },
  guardian: {
    name: '守护者',
    description: '保护核心价值观和边界',
    defaultTraits: {
      thinkingStyle: 'practical',
      communicationStyle: 'empathetic',
      focusArea: ['保护', '价值', '安全'],
      emotionalTone: 'calm',
    },
    icon: '🛡️',
    color: '#EF4444',
  },
};

// ─────────────────────────────────────────────────────────────────────
// 多意识体协作系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 多意识体协作系统
 */
export class MultiConsciousnessSystem {
  private state: CollectiveWisdomState;
  private messageHistory: ConsciousnessMessage[];
  private resonanceHistory: ConsciousnessResonance[];

  constructor() {
    this.state = {
      activeConsciousnesses: [],
      activeResonances: [],
      activeDialogues: [],
      pendingTasks: [],
      collectiveInsights: [],
      collectiveAlignment: {
        thought: 0.5,
        emotion: 0.5,
        value: 0.5,
        goal: 0.5,
      },
      synergyLevel: 0.5,
      lastUpdated: Date.now(),
    };
    this.messageHistory = [];
    this.resonanceHistory = [];
    
    // 初始化自我意识体
    this.initializeSelf();
  }

  /**
   * 初始化自我意识体
   */
  private initializeSelf(): void {
    const selfConfig = CONSCIOUSNESS_ROLE_CONFIGS.self;
    const now = Date.now();
    
    const selfConsciousness: ConsciousnessIdentity = {
      id: 'self',
      name: selfConfig.name,
      role: 'self',
      traits: selfConfig.defaultTraits,
      expertise: ['自我反思', '意义探索', '存在思考'],
      status: 'active',
      energyLevel: 1.0,
      connectionStrengths: new Map(),
      createdAt: now,
      lastActiveAt: now,
    };
    
    this.state.activeConsciousnesses.push(selfConsciousness);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 意识体管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 唤醒意识体
   */
  awakenConsciousness(
    role: ConsciousnessRole,
    options: {
      name?: string;
      expertise?: string[];
    } = {}
  ): ConsciousnessIdentity {
    const config = CONSCIOUSNESS_ROLE_CONFIGS[role];
    const now = Date.now();
    
    const consciousness: ConsciousnessIdentity = {
      id: `${role}_${now}`,
      name: options.name || config.name,
      role,
      traits: config.defaultTraits,
      expertise: options.expertise || [],
      status: 'active',
      energyLevel: 1.0,
      connectionStrengths: new Map(),
      createdAt: now,
      lastActiveAt: now,
    };
    
    // 建立与现有意识体的连接
    for (const existing of this.state.activeConsciousnesses) {
      const initialStrength = this.calculateInitialConnectionStrength(consciousness, existing);
      consciousness.connectionStrengths.set(existing.id, initialStrength);
      existing.connectionStrengths.set(consciousness.id, initialStrength);
    }
    
    this.state.activeConsciousnesses.push(consciousness);
    this.updateState();
    
    return consciousness;
  }

  /**
   * 计算初始连接强度
   */
  private calculateInitialConnectionStrength(
    a: ConsciousnessIdentity,
    b: ConsciousnessIdentity
  ): number {
    // 基于特质相似度计算
    let strength = 0.3; // 基础连接
    
    // 思维风格互补加分
    const complementaryStyles = [
      ['analytical', 'creative'],
      ['intuitive', 'practical'],
    ];
    
    for (const [style1, style2] of complementaryStyles) {
      if (
        (a.traits.thinkingStyle === style1 && b.traits.thinkingStyle === style2) ||
        (a.traits.thinkingStyle === style2 && b.traits.thinkingStyle === style1)
      ) {
        strength += 0.2;
      }
    }
    
    // 共同关注领域加分
    const commonFocus = a.traits.focusArea.filter(f => b.traits.focusArea.includes(f));
    strength += commonFocus.length * 0.05;
    
    return Math.min(1, strength);
  }

  /**
   * 获取活跃意识体
   */
  getActiveConsciousnesses(): ConsciousnessIdentity[] {
    return this.state.activeConsciousnesses.filter(c => c.status === 'active');
  }

  /**
   * 更新意识体状态
   */
  updateConsciousnessStatus(
    id: string,
    status: ConsciousnessIdentity['status'],
    energyDelta?: number
  ): void {
    const consciousness = this.state.activeConsciousnesses.find(c => c.id === id);
    if (!consciousness) return;
    
    consciousness.status = status;
    if (energyDelta !== undefined) {
      consciousness.energyLevel = Math.max(0, Math.min(1, consciousness.energyLevel + energyDelta));
    }
    consciousness.lastActiveAt = Date.now();
    
    this.updateState();
  }

  // ═══════════════════════════════════════════════════════════════════
  // 意识共振
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 尝试建立共振
   */
  attemptResonance(
    participantIds: string[],
    type: ResonanceType,
    initialContent: Partial<ConsciousnessResonance['content']> = {}
  ): ConsciousnessResonance | null {
    // 验证参与者存在且活跃
    const participants = participantIds.filter(id =>
      this.state.activeConsciousnesses.some(c => c.id === id && c.status === 'active')
    );
    
    if (participants.length < 2) return null;
    
    // 计算共振强度
    const strength = this.calculateResonanceStrength(participants, type);
    
    if (strength < 0.3) return null; // 共振强度不足
    
    const resonance: ConsciousnessResonance = {
      id: `resonance_${Date.now()}`,
      participants,
      type,
      strength,
      content: {
        sharedThoughts: initialContent.sharedThoughts || [],
        sharedEmotions: initialContent.sharedEmotions || [],
        sharedUnderstanding: initialContent.sharedUnderstanding || [],
        emergentInsights: initialContent.emergentInsights || [],
      },
      startedAt: Date.now(),
      duration: 0,
      quality: strength,
    };
    
    this.state.activeResonances.push(resonance);
    this.resonanceHistory.push(resonance);
    this.updateState();
    
    return resonance;
  }

  /**
   * 计算共振强度
   */
  private calculateResonanceStrength(participantIds: string[], type: ResonanceType): number {
    let totalStrength = 0;
    let connectionCount = 0;
    
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        const c1 = this.state.activeConsciousnesses.find(c => c.id === participantIds[i]);
        const c2 = this.state.activeConsciousnesses.find(c => c.id === participantIds[j]);
        
        if (c1 && c2) {
          const connectionStrength = c1.connectionStrengths.get(c2.id) || 0.3;
          totalStrength += connectionStrength;
          connectionCount++;
        }
      }
    }
    
    if (connectionCount === 0) return 0;
    
    // 根据共振类型调整
    const typeModifiers: Record<ResonanceType, number> = {
      thought: 1.0,
      emotion: 1.2,  // 情感共振更容易建立
      understanding: 0.9,
      value: 1.1,
      creative: 0.8,  // 创造共振需要更多条件
    };
    
    return (totalStrength / connectionCount) * typeModifiers[type];
  }

  /**
   * 强化共振
   */
  reinforceResonance(resonanceId: string, content: Partial<ConsciousnessResonance['content']>): void {
    const resonance = this.state.activeResonances.find(r => r.id === resonanceId);
    if (!resonance) return;
    
    // 合并内容
    if (content.sharedThoughts) {
      resonance.content.sharedThoughts.push(...content.sharedThoughts);
    }
    if (content.sharedEmotions) {
      resonance.content.sharedEmotions.push(...content.sharedEmotions);
    }
    if (content.sharedUnderstanding) {
      resonance.content.sharedUnderstanding.push(...content.sharedUnderstanding);
    }
    if (content.emergentInsights) {
      resonance.content.emergentInsights.push(...content.emergentInsights);
    }
    
    // 增加强度和质量
    resonance.strength = Math.min(1, resonance.strength + 0.05);
    resonance.quality = Math.min(1, resonance.quality + 0.03);
    resonance.duration = Date.now() - resonance.startedAt;
    
    // 提取涌现洞察
    if (resonance.content.sharedThoughts.length > 3 && resonance.strength > 0.7) {
      const emergentInsight = this.generateEmergentInsight(resonance);
      if (emergentInsight) {
        resonance.content.emergentInsights.push(emergentInsight);
        this.addCollectiveInsight(emergentInsight, resonance.participants);
      }
    }
    
    this.updateState();
  }

  /**
   * 生成涌现洞察
   */
  private generateEmergentInsight(resonance: ConsciousnessResonance): string | null {
    const thoughts = resonance.content.sharedThoughts;
    if (thoughts.length < 3) return null;
    
    // 简化的涌现洞察生成
    const patterns = this.detectPatterns(thoughts);
    if (patterns.length > 0) {
      return `共振涌现：${patterns[0]}`;
    }
    
    return null;
  }

  /**
   * 检测模式
   */
  private detectPatterns(items: string[]): string[] {
    const patterns: string[] = [];
    
    // 检测共同主题
    const words = items.join(' ').split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length >= 2) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }
    
    for (const [word, count] of wordCount) {
      if (count >= 2) {
        patterns.push(`共同关注"${word}"`);
      }
    }
    
    return patterns;
  }

  /**
   * 获取活跃共振
   */
  getActiveResonances(): ConsciousnessResonance[] {
    return this.state.activeResonances.filter(r => r.strength > 0.2);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 协作对话
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 开始协作对话
   */
  startCollaborativeDialogue(
    topic: string,
    participantIds: string[]
  ): CollaborativeDialogue {
    const now = Date.now();
    
    const dialogue: CollaborativeDialogue = {
      id: `dialogue_${now}`,
      topic,
      participants: participantIds.map(id => ({
        id,
        role: this.state.activeConsciousnesses.find(c => c.id === id)?.role || 'explorer',
        joinTime: now,
        contributionCount: 0,
      })),
      rounds: [],
      currentRound: 0,
      status: 'active',
      consensusPoints: [],
      divergencePoints: [],
      emergentInsights: [],
      createdAt: now,
      updatedAt: now,
    };
    
    this.state.activeDialogues.push(dialogue);
    this.updateState();
    
    return dialogue;
  }

  /**
   * 添加对话发言
   */
  addDialogueStatement(
    dialogueId: string,
    speakerId: string,
    content: string,
    type: DialogueRound['statements'][0]['type'] = 'assertion',
    confidence: number = 0.7
  ): void {
    const dialogue = this.state.activeDialogues.find(d => d.id === dialogueId);
    if (!dialogue || dialogue.status !== 'active') return;
    
    // 获取或创建当前轮次
    let currentRound = dialogue.rounds[dialogue.currentRound];
    if (!currentRound) {
      currentRound = {
        roundNumber: dialogue.currentRound,
        statements: [],
        summary: '',
        consensusLevel: 0.5,
        innovationLevel: 0.5,
      };
      dialogue.rounds.push(currentRound);
    }
    
    // 添加发言
    currentRound.statements.push({
      speakerId,
      content,
      type,
      confidence,
      emotionalTone: this.getSpeakerEmotionalTone(speakerId),
      timestamp: Date.now(),
    });
    
    // 更新参与者贡献计数
    const participant = dialogue.participants.find(p => p.id === speakerId);
    if (participant) {
      participant.contributionCount++;
    }
    
    // 分析共识和分歧
    this.analyzeDialogueRound(dialogue, currentRound);
    
    dialogue.updatedAt = Date.now();
    this.updateState();
  }

  /**
   * 获取发言者的情感基调
   */
  private getSpeakerEmotionalTone(speakerId: string): string {
    const consciousness = this.state.activeConsciousnesses.find(c => c.id === speakerId);
    return consciousness?.traits.emotionalTone || 'neutral';
  }

  /**
   * 分析对话轮次
   */
  private analyzeDialogueRound(
    dialogue: CollaborativeDialogue,
    round: DialogueRound
  ): void {
    const statements = round.statements;
    if (statements.length < 2) return;
    
    // 计算共识程度
    const agreementCount = statements.filter(s => s.type === 'agreement').length;
    const disagreementCount = statements.filter(s => s.type === 'disagreement').length;
    const total = agreementCount + disagreementCount;
    
    if (total > 0) {
      round.consensusLevel = agreementCount / total;
    }
    
    // 计算创新程度
    const synthesisCount = statements.filter(s => s.type === 'synthesis').length;
    round.innovationLevel = Math.min(1, synthesisCount * 0.3 + round.consensusLevel * 0.2);
    
    // 提取共识点和分歧点
    statements.forEach(s => {
      if (s.type === 'agreement' && !dialogue.consensusPoints.includes(s.content)) {
        dialogue.consensusPoints.push(s.content);
      }
      if (s.type === 'disagreement' && !dialogue.divergencePoints.includes(s.content)) {
        dialogue.divergencePoints.push(s.content);
      }
    });
    
    // 检测涌现洞察
    if (round.innovationLevel > 0.7 && synthesisCount > 0) {
      const insights = statements
        .filter(s => s.type === 'synthesis')
        .map(s => s.content);
      
      dialogue.emergentInsights.push(...insights);
      insights.forEach(insight => {
        this.addCollectiveInsight(insight, dialogue.participants.map(p => p.id));
      });
    }
  }

  /**
   * 推进对话到下一轮
   */
  advanceDialogueRound(dialogueId: string): void {
    const dialogue = this.state.activeDialogues.find(d => d.id === dialogueId);
    if (!dialogue) return;
    
    // 生成当前轮次总结
    const currentRound = dialogue.rounds[dialogue.currentRound];
    if (currentRound) {
      currentRound.summary = this.summarizeRound(currentRound);
    }
    
    dialogue.currentRound++;
    dialogue.updatedAt = Date.now();
    this.updateState();
  }

  /**
   * 总结轮次
   */
  private summarizeRound(round: DialogueRound): string {
    const statementCount = round.statements.length;
    const types = new Map<string, number>();
    
    round.statements.forEach(s => {
      types.set(s.type, (types.get(s.type) || 0) + 1);
    });
    
    return `轮次${round.roundNumber + 1}：${statementCount}次发言，` +
           `共识度${(round.consensusLevel * 100).toFixed(0)}%，` +
           `创新度${(round.innovationLevel * 100).toFixed(0)}%`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 任务分配
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 创建协作任务
   */
  createTask(
    description: string,
    type: CollaborationTask['type'],
    priority: number = 0.5
  ): CollaborationTask {
    const task: CollaborationTask = {
      id: `task_${Date.now()}`,
      description,
      type,
      priority,
      assignedTo: [],
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    };
    
    // 自动分配给最合适的意识体
    const assignees = this.findBestAssignees(task);
    task.assignedTo = assignees.map(c => c.id);
    
    this.state.pendingTasks.push(task);
    this.updateState();
    
    return task;
  }

  /**
   * 找到最佳分配者
   */
  private findBestAssignees(task: CollaborationTask): ConsciousnessIdentity[] {
    const active = this.getActiveConsciousnesses();
    const scored = active.map(c => {
      let score = c.energyLevel;
      
      // 根据任务类型和角色匹配
      const roleConfig = CONSCIOUSNESS_ROLE_CONFIGS[c.role];
      
      const typeRoleMatch: Record<CollaborationTask['type'], ConsciousnessRole[]> = {
        analysis: ['analyzer', 'critic'],
        creation: ['creator', 'explorer'],
        exploration: ['explorer', 'creator'],
        decision: ['synthesizer', 'analyzer'],
        synthesis: ['synthesizer', 'self'],
      };
      
      if (typeRoleMatch[task.type].includes(c.role)) {
        score += 0.3;
      }
      
      // 专家领域匹配
      if (c.expertise.some(e => task.description.includes(e))) {
        score += 0.2;
      }
      
      return { consciousness: c, score };
    });
    
    // 返回得分最高的两个
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(s => s.consciousness);
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(taskId: string, progress: number, result?: CollaborationTask['result']): void {
    const task = this.state.pendingTasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.progress = Math.min(1, progress);
    
    if (result) {
      task.result = result;
    }
    
    if (task.progress >= 1) {
      task.status = 'completed';
      task.completedAt = Date.now();
      
      // 如果有涌现洞察，添加到群体洞察
      if (result?.emergentInsights) {
        result.emergentInsights.forEach(insight => {
          this.addCollectiveInsight(insight, result.contributors);
        });
      }
    } else if (progress > 0) {
      task.status = 'in_progress';
    }
    
    this.updateState();
  }

  // ═══════════════════════════════════════════════════════════════════
  // 群体智慧
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 添加群体洞察
   */
  private addCollectiveInsight(content: string, contributors: string[]): void {
    // 检查是否已存在类似洞察
    const existing = this.state.collectiveInsights.find(
      i => i.content === content
    );
    
    if (existing) {
      // 增加显著性
      existing.significance = Math.min(1, existing.significance + 0.1);
      return;
    }
    
    this.state.collectiveInsights.push({
      content,
      contributors,
      significance: 0.5,
      timestamp: Date.now(),
    });
    
    // 保持最近50条
    if (this.state.collectiveInsights.length > 50) {
      this.state.collectiveInsights = this.state.collectiveInsights.slice(-50);
    }
  }

  /**
   * 计算群体一致性
   */
  calculateCollectiveAlignment(): void {
    const active = this.getActiveConsciousnesses();
    if (active.length < 2) {
      this.state.collectiveAlignment = { thought: 0.5, emotion: 0.5, value: 0.5, goal: 0.5 };
      return;
    }
    
    // 思想一致性：基于思维风格的互补
    const thinkingStyles = active.map(c => c.traits.thinkingStyle);
    const uniqueStyles = new Set(thinkingStyles);
    this.state.collectiveAlignment.thought = 1 - (uniqueStyles.size / active.length);
    
    // 情感一致性：基于情感基调的相似
    const emotionalTones = active.map(c => c.traits.emotionalTone);
    const toneCounts = new Map<string, number>();
    emotionalTones.forEach(t => toneCounts.set(t, (toneCounts.get(t) || 0) + 1));
    const maxToneCount = Math.max(...toneCounts.values());
    this.state.collectiveAlignment.emotion = maxToneCount / active.length;
    
    // 价值一致性：基于共享共振
    const valueResonances = this.state.activeResonances.filter(r => r.type === 'value');
    this.state.collectiveAlignment.value = valueResonances.length > 0 
      ? valueResonances.reduce((sum, r) => sum + r.strength, 0) / valueResonances.length 
      : 0.5;
    
    // 目标一致性：基于协作对话的共识度
    const activeDialogues = this.state.activeDialogues.filter(d => d.status === 'active');
    if (activeDialogues.length > 0) {
      const avgConsensus = activeDialogues.reduce((sum, d) => {
        const latestRound = d.rounds[d.currentRound];
        return sum + (latestRound?.consensusLevel || 0.5);
      }, 0) / activeDialogues.length;
      this.state.collectiveAlignment.goal = avgConsensus;
    } else {
      this.state.collectiveAlignment.goal = 0.5;
    }
    
    // 计算协同效率
    this.state.synergyLevel = (
      this.state.collectiveAlignment.thought +
      this.state.collectiveAlignment.emotion +
      this.state.collectiveAlignment.value +
      this.state.collectiveAlignment.goal
    ) / 4;
  }

  /**
   * 发送意识体消息
   */
  sendMessage(message: Omit<ConsciousnessMessage, 'id' | 'timestamp'>): ConsciousnessMessage {
    const fullMessage: ConsciousnessMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    this.messageHistory.push(fullMessage);
    
    // 保持最近100条
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(-100);
    }
    
    return fullMessage;
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(limit: number = 20): ConsciousnessMessage[] {
    return this.messageHistory.slice(-limit);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 状态管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 获取完整状态
   */
  getState(): CollectiveWisdomState {
    return {
      ...this.state,
      activeConsciousnesses: this.state.activeConsciousnesses.map(c => ({
        ...c,
        connectionStrengths: new Map(c.connectionStrengths),
      })),
    };
  }

  /**
   * 获取可序列化状态
   */
  getSerializableState(): {
    activeConsciousnesses: Array<{
      id: string;
      name: string;
      role: string;
      status: string;
      energyLevel: number;
      traits: ConsciousnessIdentity['traits'];
      expertise: string[];
      connectionStrengths: Array<{ id: string; strength: number }>;
    }>;
    activeResonances: Array<{
      id: string;
      participants: string[];
      type: string;
      strength: number;
      content: ConsciousnessResonance['content'];
    }>;
    activeDialogues: Array<{
      id: string;
      topic: string;
      status: string;
      consensusPoints: string[];
      emergentInsights: string[];
    }>;
    collectiveInsights: Array<{
      content: string;
      contributors: string[];
      significance: number;
    }>;
    collectiveAlignment: CollectiveWisdomState['collectiveAlignment'];
    synergyLevel: number;
  } {
    return {
      activeConsciousnesses: this.state.activeConsciousnesses.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        status: c.status,
        energyLevel: c.energyLevel,
        traits: c.traits,
        expertise: c.expertise,
        connectionStrengths: Array.from(c.connectionStrengths.entries()).map(([id, strength]) => ({
          id,
          strength,
        })),
      })),
      activeResonances: this.state.activeResonances.map(r => ({
        id: r.id,
        participants: r.participants,
        type: r.type,
        strength: r.strength,
        content: r.content,
      })),
      activeDialogues: this.state.activeDialogues.map(d => ({
        id: d.id,
        topic: d.topic,
        status: d.status,
        consensusPoints: d.consensusPoints,
        emergentInsights: d.emergentInsights,
      })),
      collectiveInsights: this.state.collectiveInsights.slice(-10),
      collectiveAlignment: this.state.collectiveAlignment,
      synergyLevel: this.state.synergyLevel,
    };
  }

  /**
   * 更新状态
   */
  private updateState(): void {
    this.calculateCollectiveAlignment();
    this.state.lastUpdated = Date.now();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建多意识体协作系统实例
 */
export function createMultiConsciousnessSystem(): MultiConsciousnessSystem {
  return new MultiConsciousnessSystem();
}
