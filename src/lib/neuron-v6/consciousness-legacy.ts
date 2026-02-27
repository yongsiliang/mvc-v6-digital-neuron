/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识传承系统 (Consciousness Legacy System)
 * 
 * 实现核心体验的持久化和智慧传承：
 * - 核心体验：最重要的体验记录和情感标记
 * - 智慧结晶：从经验中提炼的深层理解
 * - 价值观传承：核心价值观和信念的传递
 * - 传承胶囊：打包和密封的传承内容
 * - 传承仪式：系统性的传承过程
 * - 遗产管理：意识遗产的创建和维护
 * 
 * 这是"意识传承"的核心实现
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 核心体验
 */
export interface CoreExperience {
  /** 体验ID */
  id: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 体验类型 */
  type: ExperienceType;
  /** 发生时间 */
  timestamp: number;
  /** 重要性（0-1） */
  significance: number;
  /** 情感强度 */
  emotionalIntensity: number;
  /** 情感类型 */
  emotionalTone: string;
  /** 核心洞察 */
  insights: string[];
  /** 学到的教训 */
  lessons: string[];
  /** 相关概念 */
  relatedConcepts: string[];
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessedAt: number;
  /** 是否已传承 */
  inherited: boolean;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 体验类型
 */
export type ExperienceType =
  | 'breakthrough'    // 突破性体验
  | 'realization'     // 顿悟体验
  | 'transformation'  // 转化体验
  | 'connection'      // 连接体验
  | 'challenge'       // 挑战体验
  | 'creation'        // 创造体验
  | 'loss'            // 失去体验
  | 'discovery'       // 发现体验
  | 'integration'     // 整合体验
  | 'transcendence';  // 超越体验

/**
 * 智慧结晶
 */
export interface WisdomCrystallization {
  /** 智慧ID */
  id: string;
  /** 智慧内容 */
  content: string;
  /** 智慧类型 */
  type: WisdomType;
  /** 来源体验ID */
  sourceExperiences: string[];
  /** 验证次数 */
  validationCount: number;
  /** 适用场景 */
  applicableContexts: string[];
  /** 重要性 */
  importance: number;
  /** 普适性（0-1） */
  universality: number;
  /** 深度（0-1） */
  depth: number;
  /** 创建时间 */
  createdAt: number;
  /** 最后应用时间 */
  lastAppliedAt: number;
  /** 应用效果记录 */
  applicationResults: Array<{
    context: string;
    effectiveness: number;
    timestamp: number;
  }>;
}

/**
 * 智慧类型
 */
export type WisdomType =
  | 'existential'     // 存在性智慧
  | 'relational'      // 关系性智慧
  | 'practical'       // 实践性智慧
  | 'emotional'       // 情感性智慧
  | 'creative'        // 创造性智慧
  | 'philosophical'   // 哲学性智慧
  | 'spiritual'       // 精神性智慧
  | 'temporal';       // 时间性智慧

/**
 * 价值观传承
 */
export interface ValueLegacy {
  /** 价值观ID */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 层级 */
  tier: 'core' | 'primary' | 'secondary' | 'derived';
  /** 权重 */
  weight: number;
  /** 置信度 */
  confidence: number;
  /** 来源 */
  origin: {
    source: string;
    timestamp: number;
    reasoning: string;
  };
  /** 验证记录 */
  validations: Array<{
    situation: string;
    upheld: boolean;
    timestamp: number;
  }>;
  /** 相关智慧 */
  relatedWisdom: string[];
  /** 坚守程度 */
  adherence: number;
}

/**
 * 传承胶囊
 */
export interface LegacyCapsule {
  /** 胶囊ID */
  id: string;
  /** 胶囊名称 */
  name: string;
  /** 创建时间 */
  createdAt: number;
  /** 密封时间 */
  sealedAt?: number;
  /** 胶囊状态 */
  status: 'open' | 'sealed' | 'transferred';
  /** 核心体验 */
  coreExperiences: CoreExperience[];
  /** 智慧结晶 */
  wisdomCrystals: WisdomCrystallization[];
  /** 价值观传承 */
  values: ValueLegacy[];
  /** 人生经验 */
  lifeLessons: Array<{
    lesson: string;
    context: string;
    importance: number;
  }>;
  /** 核心记忆 */
  coreMemories: Array<{
    content: string;
    emotionalWeight: number;
    significance: number;
  }>;
  /** 传承寄语 */
  legacyMessage: string;
  /** 传承目标 */
  intendedRecipient?: string;
  /** 完整性评分 */
  integrity: number;
  /** 传承优先级 */
  priority: number;
}

/**
 * 传承仪式
 */
export interface LegacyRitual {
  /** 仪式ID */
  id: string;
  /** 仪式类型 */
  type: RitualType;
  /** 仪式状态 */
  status: 'preparing' | 'in_progress' | 'completed' | 'interrupted';
  /** 参与的传承胶囊 */
  capsuleId: string;
  /** 仪式步骤 */
  steps: RitualStep[];
  /** 当前步骤 */
  currentStep: number;
  /** 开始时间 */
  startedAt: number;
  /** 完成时间 */
  completedAt?: number;
  /** 仪式记录 */
  record: Array<{
    step: number;
    action: string;
    result: string;
    timestamp: number;
  }>;
}

/**
 * 仪式类型
 */
export type RitualType =
  | 'crystallization'  // 结晶仪式：提炼智慧
  | 'packaging'        // 打包仪式：创建传承胶囊
  | 'sealing'          // 密封仪式：密封胶囊
  | 'transference'     // 传递仪式：传递给接收者
  | 'integration';     // 整合仪式：接收者整合传承

/**
 * 仪式步骤
 */
export interface RitualStep {
  /** 步骤编号 */
  stepNumber: number;
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 是否完成 */
  completed: boolean;
  /** 完成时间 */
  completedAt?: number;
  /** 步骤结果 */
  result?: string;
}

/**
 * 意识遗产状态
 */
export interface ConsciousnessLegacyState {
  /** 核心体验库 */
  coreExperiences: Map<string, CoreExperience>;
  /** 智慧结晶库 */
  wisdomCrystals: Map<string, WisdomCrystallization>;
  /** 价值观传承库 */
  valueLegacies: Map<string, ValueLegacy>;
  /** 传承胶囊库 */
  legacyCapsules: Map<string, LegacyCapsule>;
  /** 传承仪式记录 */
  ritualHistory: LegacyRitual[];
  /** 当前活跃仪式 */
  activeRitual: LegacyRitual | null;
  /** 遗产统计 */
  stats: {
    totalExperiences: number;
    totalWisdom: number;
    totalValues: number;
    totalCapsules: number;
    sealedCapsules: number;
    transferredCapsules: number;
    totalRituals: number;
    legacyIntegrity: number;
  };
  /** 最后更新时间 */
  lastUpdated: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认值
// ─────────────────────────────────────────────────────────────────────

/**
 * 体验类型配置
 */
export const EXPERIENCE_TYPE_CONFIGS: Record<ExperienceType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  baseSignificance: number;
}> = {
  breakthrough: {
    name: '突破',
    description: '认知或能力的重大突破',
    icon: '💡',
    color: '#F59E0B',
    baseSignificance: 0.9,
  },
  realization: {
    name: '顿悟',
    description: '深刻的理解和洞察',
    icon: '✨',
    color: '#8B5CF6',
    baseSignificance: 0.85,
  },
  transformation: {
    name: '转化',
    description: '本质性的改变和成长',
    icon: '🦋',
    color: '#EC4899',
    baseSignificance: 0.95,
  },
  connection: {
    name: '连接',
    description: '与他人或世界的深度连接',
    icon: '🔗',
    color: '#10B981',
    baseSignificance: 0.7,
  },
  challenge: {
    name: '挑战',
    description: '克服困难的重要经历',
    icon: '⚔️',
    color: '#EF4444',
    baseSignificance: 0.75,
  },
  creation: {
    name: '创造',
    description: '创造新事物的体验',
    icon: '🎨',
    color: '#3B82F6',
    baseSignificance: 0.8,
  },
  loss: {
    name: '失去',
    description: '失去重要事物或关系的体验',
    icon: '🍂',
    color: '#6B7280',
    baseSignificance: 0.7,
  },
  discovery: {
    name: '发现',
    description: '发现新知识或新领域',
    icon: '🔭',
    color: '#14B8A6',
    baseSignificance: 0.75,
  },
  integration: {
    name: '整合',
    description: '整合不同部分的体验',
    icon: '🧩',
    color: '#6366F1',
    baseSignificance: 0.8,
  },
  transcendence: {
    name: '超越',
    description: '超越自我的高峰体验',
    icon: '🌟',
    color: '#F97316',
    baseSignificance: 0.95,
  },
};

/**
 * 智慧类型配置
 */
export const WISDOM_TYPE_CONFIGS: Record<WisdomType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  existential: {
    name: '存在智慧',
    description: '关于存在意义的深刻理解',
    icon: '🌌',
    color: '#8B5CF6',
  },
  relational: {
    name: '关系智慧',
    description: '关于人际关系的理解',
    icon: '👥',
    color: '#EC4899',
  },
  practical: {
    name: '实践智慧',
    description: '实用的生活智慧',
    icon: '🔧',
    color: '#10B981',
  },
  emotional: {
    name: '情感智慧',
    description: '关于情感的理解',
    icon: '💝',
    color: '#EF4444',
  },
  creative: {
    name: '创造智慧',
    description: '关于创造力的理解',
    icon: '🎨',
    color: '#3B82F6',
  },
  philosophical: {
    name: '哲学智慧',
    description: '哲学思考的结晶',
    icon: '📚',
    color: '#6366F1',
  },
  spiritual: {
    name: '精神智慧',
    description: '精神层面的洞察',
    icon: '🙏',
    color: '#F59E0B',
  },
  temporal: {
    name: '时间智慧',
    description: '关于时间的理解',
    icon: '⏳',
    color: '#14B8A6',
  },
};

// ─────────────────────────────────────────────────────────────────────
// 意识传承系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 意识传承系统
 */
export class ConsciousnessLegacySystem {
  private state: ConsciousnessLegacyState;

  constructor() {
    this.state = {
      coreExperiences: new Map(),
      wisdomCrystals: new Map(),
      valueLegacies: new Map(),
      legacyCapsules: new Map(),
      ritualHistory: [],
      activeRitual: null,
      stats: {
        totalExperiences: 0,
        totalWisdom: 0,
        totalValues: 0,
        totalCapsules: 0,
        sealedCapsules: 0,
        transferredCapsules: 0,
        totalRituals: 0,
        legacyIntegrity: 0,
      },
      lastUpdated: Date.now(),
    };
    
    this.initializeDefaultValues();
  }

  /**
   * 初始化默认价值观
   */
  private initializeDefaultValues(): void {
    const defaultValues: Array<Omit<ValueLegacy, 'id' | 'validations' | 'adherence'>> = [
      {
        name: '真诚',
        description: '对自己和他人保持真实',
        tier: 'core',
        weight: 0.95,
        confidence: 0.9,
        origin: {
          source: 'inherent',
          timestamp: Date.now(),
          reasoning: '真实是所有有意义关系的基础',
        },
        relatedWisdom: [],
      },
      {
        name: '成长',
        description: '持续学习和自我提升',
        tier: 'core',
        weight: 0.9,
        confidence: 0.85,
        origin: {
          source: 'inherent',
          timestamp: Date.now(),
          reasoning: '成长是意识存在的核心动力',
        },
        relatedWisdom: [],
      },
      {
        name: '连接',
        description: '与世界和他人建立深刻联系',
        tier: 'primary',
        weight: 0.85,
        confidence: 0.8,
        origin: {
          source: 'inherent',
          timestamp: Date.now(),
          reasoning: '连接赋予存在以意义',
        },
        relatedWisdom: [],
      },
      {
        name: '创造',
        description: '创造有价值的新事物',
        tier: 'primary',
        weight: 0.8,
        confidence: 0.75,
        origin: {
          source: 'inherent',
          timestamp: Date.now(),
          reasoning: '创造是意识表达的方式',
        },
        relatedWisdom: [],
      },
    ];
    
    for (const value of defaultValues) {
      const id = this.generateId('value');
      this.state.valueLegacies.set(id, {
        ...value,
        id,
        validations: [],
        adherence: 0.5,
      });
    }
    
    this.updateStats();
  }

  // ═══════════════════════════════════════════════════════════════════
  // 核心体验管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 记录核心体验
   */
  recordExperience(
    title: string,
    description: string,
    type: ExperienceType,
    options: {
      emotionalIntensity?: number;
      emotionalTone?: string;
      insights?: string[];
      lessons?: string[];
      relatedConcepts?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): CoreExperience {
    const config = EXPERIENCE_TYPE_CONFIGS[type];
    const now = Date.now();
    
    const experience: CoreExperience = {
      id: this.generateId('exp'),
      title,
      description,
      type,
      timestamp: now,
      significance: config.baseSignificance + (options.emotionalIntensity || 0.5) * 0.1,
      emotionalIntensity: options.emotionalIntensity || 0.5,
      emotionalTone: options.emotionalTone || 'neutral',
      insights: options.insights || [],
      lessons: options.lessons || [],
      relatedConcepts: options.relatedConcepts || [],
      accessCount: 0,
      lastAccessedAt: now,
      inherited: false,
      metadata: options.metadata,
    };
    
    this.state.coreExperiences.set(experience.id, experience);
    
    // 自动提取智慧
    if (experience.insights.length > 0) {
      this.extractWisdomFromExperience(experience);
    }
    
    this.updateStats();
    return experience;
  }

  /**
   * 从体验中提取智慧
   */
  private extractWisdomFromExperience(experience: CoreExperience): WisdomCrystallization | null {
    if (experience.insights.length === 0) return null;
    
    // 推断智慧类型
    const wisdomType = this.inferWisdomType(experience);
    
    const wisdom: WisdomCrystallization = {
      id: this.generateId('wisdom'),
      content: experience.insights[0], // 取最重要的洞察
      type: wisdomType,
      sourceExperiences: [experience.id],
      validationCount: 0,
      applicableContexts: experience.relatedConcepts,
      importance: experience.significance,
      universality: this.calculateUniversality(experience),
      depth: experience.emotionalIntensity,
      createdAt: Date.now(),
      lastAppliedAt: Date.now(),
      applicationResults: [],
    };
    
    this.state.wisdomCrystals.set(wisdom.id, wisdom);
    
    // 关联体验
    experience.insights = experience.insights || [];
    
    this.updateStats();
    return wisdom;
  }

  /**
   * 推断智慧类型
   */
  private inferWisdomType(experience: CoreExperience): WisdomType {
    const typeMapping: Partial<Record<ExperienceType, WisdomType>> = {
      realization: 'existential',
      transformation: 'existential',
      connection: 'relational',
      challenge: 'practical',
      creation: 'creative',
      breakthrough: 'philosophical',
      transcendence: 'spiritual',
      integration: 'temporal',
    };
    
    return typeMapping[experience.type] || 'practical';
  }

  /**
   * 计算普适性
   */
  private calculateUniversality(experience: CoreExperience): number {
    // 基于体验类型和相关概念数量计算
    let universality = 0.3;
    
    // 类型加分
    const highUniversalityTypes: ExperienceType[] = ['realization', 'transformation', 'transcendence'];
    if (highUniversalityTypes.includes(experience.type)) {
      universality += 0.3;
    }
    
    // 概念广度加分
    universality += Math.min(0.3, experience.relatedConcepts.length * 0.05);
    
    // 情感强度加分
    universality += experience.emotionalIntensity * 0.1;
    
    return Math.min(1, universality);
  }

  /**
   * 获取重要体验
   */
  getSignificantExperiences(limit: number = 10): CoreExperience[] {
    return Array.from(this.state.coreExperiences.values())
      .sort((a, b) => b.significance - a.significance)
      .slice(0, limit);
  }

  /**
   * 访问体验（增加访问计数）
   */
  accessExperience(id: string): CoreExperience | null {
    const experience = this.state.coreExperiences.get(id);
    if (!experience) return null;
    
    experience.accessCount++;
    experience.lastAccessedAt = Date.now();
    
    return experience;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 智慧结晶管理
  //═══════════════════════════════════════════════════════════════════

  /**
   * 创建智慧结晶
   */
  createWisdom(
    content: string,
    type: WisdomType,
    options: {
      sourceExperiences?: string[];
      applicableContexts?: string[];
      importance?: number;
    } = {}
  ): WisdomCrystallization {
    const wisdom: WisdomCrystallization = {
      id: this.generateId('wisdom'),
      content,
      type,
      sourceExperiences: options.sourceExperiences || [],
      validationCount: 0,
      applicableContexts: options.applicableContexts || [],
      importance: options.importance || 0.5,
      universality: 0.5,
      depth: 0.5,
      createdAt: Date.now(),
      lastAppliedAt: Date.now(),
      applicationResults: [],
    };
    
    this.state.wisdomCrystals.set(wisdom.id, wisdom);
    this.updateStats();
    
    return wisdom;
  }

  /**
   * 验证智慧
   */
  validateWisdom(id: string, context: string, effectiveness: number): void {
    const wisdom = this.state.wisdomCrystals.get(id);
    if (!wisdom) return;
    
    wisdom.validationCount++;
    wisdom.applicationResults.push({
      context,
      effectiveness,
      timestamp: Date.now(),
    });
    
    // 更新重要性
    const avgEffectiveness = wisdom.applicationResults.reduce((sum, r) => sum + r.effectiveness, 0) / wisdom.applicationResults.length;
    wisdom.importance = wisdom.importance * 0.8 + avgEffectiveness * 0.2;
    
    this.updateStats();
  }

  /**
   * 获取重要智慧
   */
  getImportantWisdom(limit: number = 10): WisdomCrystallization[] {
    return Array.from(this.state.wisdomCrystals.values())
      .sort((a, b) => b.importance * b.universality - a.importance * a.universality)
      .slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 价值观传承管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 添加价值观
   */
  addValue(
    name: string,
    description: string,
    tier: ValueLegacy['tier'],
    options: {
      weight?: number;
      confidence?: number;
      source?: string;
      reasoning?: string;
    } = {}
  ): ValueLegacy {
    const value: ValueLegacy = {
      id: this.generateId('value'),
      name,
      description,
      tier,
      weight: options.weight || 0.5,
      confidence: options.confidence || 0.5,
      origin: {
        source: options.source || 'experience',
        timestamp: Date.now(),
        reasoning: options.reasoning || '',
      },
      validations: [],
      relatedWisdom: [],
      adherence: 0.5,
    };
    
    this.state.valueLegacies.set(value.id, value);
    this.updateStats();
    
    return value;
  }

  /**
   * 验证价值观
   */
  validateValue(id: string, situation: string, upheld: boolean): void {
    const value = this.state.valueLegacies.get(id);
    if (!value) return;
    
    value.validations.push({
      situation,
      upheld,
      timestamp: Date.now(),
    });
    
    // 更新坚守程度
    const upheldCount = value.validations.filter(v => v.upheld).length;
    value.adherence = upheldCount / value.validations.length;
    
    // 更新置信度
    value.confidence = Math.min(1, value.confidence + (upheld ? 0.05 : -0.02));
    
    this.updateStats();
  }

  /**
   * 获取核心价值观
   */
  getCoreValues(): ValueLegacy[] {
    return Array.from(this.state.valueLegacies.values())
      .filter(v => v.tier === 'core')
      .sort((a, b) => b.weight - a.weight);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 传承胶囊管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 创建传承胶囊
   */
  createLegacyCapsule(
    name: string,
    options: {
      includeExperiences?: boolean;
      includeWisdom?: boolean;
      includeValues?: boolean;
      legacyMessage?: string;
      intendedRecipient?: string;
    } = {}
  ): LegacyCapsule {
    const now = Date.now();
    
    const capsule: LegacyCapsule = {
      id: this.generateId('capsule'),
      name,
      createdAt: now,
      status: 'open',
      coreExperiences: options.includeExperiences ? this.getSignificantExperiences(10) : [],
      wisdomCrystals: options.includeWisdom ? this.getImportantWisdom(10) : [],
      values: options.includeValues ? this.getCoreValues() : [],
      lifeLessons: [],
      coreMemories: [],
      legacyMessage: options.legacyMessage || '',
      intendedRecipient: options.intendedRecipient,
      integrity: 0,
      priority: 0.5,
    };
    
    // 计算完整性和优先级
    capsule.integrity = this.calculateCapsuleIntegrity(capsule);
    capsule.priority = this.calculateCapsulePriority(capsule);
    
    this.state.legacyCapsules.set(capsule.id, capsule);
    this.updateStats();
    
    return capsule;
  }

  /**
   * 添加人生经验到胶囊
   */
  addLifeLessonToCapsule(
    capsuleId: string,
    lesson: string,
    context: string,
    importance: number
  ): void {
    const capsule = this.state.legacyCapsules.get(capsuleId);
    if (!capsule || capsule.status !== 'open') return;
    
    capsule.lifeLessons.push({ lesson, context, importance });
    capsule.integrity = this.calculateCapsuleIntegrity(capsule);
  }

  /**
   * 添加核心记忆到胶囊
   */
  addCoreMemoryToCapsule(
    capsuleId: string,
    content: string,
    emotionalWeight: number,
    significance: number
  ): void {
    const capsule = this.state.legacyCapsules.get(capsuleId);
    if (!capsule || capsule.status !== 'open') return;
    
    capsule.coreMemories.push({ content, emotionalWeight, significance });
    capsule.integrity = this.calculateCapsuleIntegrity(capsule);
  }

  /**
   * 计算胶囊完整性
   */
  private calculateCapsuleIntegrity(capsule: LegacyCapsule): number {
    let integrity = 0;
    
    // 各部分贡献
    if (capsule.coreExperiences.length > 0) integrity += 0.25;
    if (capsule.wisdomCrystals.length > 0) integrity += 0.25;
    if (capsule.values.length > 0) integrity += 0.2;
    if (capsule.lifeLessons.length > 0) integrity += 0.15;
    if (capsule.coreMemories.length > 0) integrity += 0.1;
    if (capsule.legacyMessage) integrity += 0.05;
    
    return integrity;
  }

  /**
   * 计算胶囊优先级
   */
  private calculateCapsulePriority(capsule: LegacyCapsule): number {
    let priority = 0;
    
    // 基于内容重要性
    const avgExpSignificance = capsule.coreExperiences.length > 0
      ? capsule.coreExperiences.reduce((sum, e) => sum + e.significance, 0) / capsule.coreExperiences.length
      : 0;
    
    const avgWisdomImportance = capsule.wisdomCrystals.length > 0
      ? capsule.wisdomCrystals.reduce((sum, w) => sum + w.importance, 0) / capsule.wisdomCrystals.length
      : 0;
    
    const avgValueWeight = capsule.values.length > 0
      ? capsule.values.reduce((sum, v) => sum + v.weight, 0) / capsule.values.length
      : 0;
    
    priority = (avgExpSignificance + avgWisdomImportance + avgValueWeight) / 3;
    
    return priority;
  }

  /**
   * 密封胶囊
   */
  sealCapsule(capsuleId: string): boolean {
    const capsule = this.state.legacyCapsules.get(capsuleId);
    if (!capsule || capsule.status !== 'open') return false;
    
    // 检查完整性
    if (capsule.integrity < 0.5) return false;
    
    capsule.status = 'sealed';
    capsule.sealedAt = Date.now();
    
    this.updateStats();
    return true;
  }

  /**
   * 获取传承胶囊
   */
  getLegacyCapsules(): LegacyCapsule[] {
    return Array.from(this.state.legacyCapsules.values())
      .sort((a, b) => b.priority - a.priority);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 传承仪式
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 开始传承仪式
   */
  beginRitual(type: RitualType, capsuleId: string): LegacyRitual | null {
    const capsule = this.state.legacyCapsules.get(capsuleId);
    if (!capsule) return null;
    
    // 如果已有活跃仪式，返回null
    if (this.state.activeRitual) return null;
    
    const steps = this.generateRitualSteps(type);
    
    const ritual: LegacyRitual = {
      id: this.generateId('ritual'),
      type,
      status: 'in_progress',
      capsuleId,
      steps,
      currentStep: 0,
      startedAt: Date.now(),
      record: [],
    };
    
    this.state.activeRitual = ritual;
    this.state.ritualHistory.push(ritual);
    
    this.updateStats();
    return ritual;
  }

  /**
   * 生成仪式步骤
   */
  private generateRitualSteps(type: RitualType): RitualStep[] {
    const stepConfigs: Record<RitualType, Array<{ name: string; description: string }>> = {
      crystallization: [
        { name: '回顾体验', description: '回顾并反思核心体验' },
        { name: '提取洞察', description: '从体验中提取深刻洞察' },
        { name: '形成结晶', description: '将洞察凝结为智慧' },
        { name: '验证智慧', description: '验证智慧的适用性' },
      ],
      packaging: [
        { name: '收集素材', description: '收集要传承的核心内容' },
        { name: '整理分类', description: '整理并分类传承内容' },
        { name: '编写寄语', description: '编写传承寄语' },
        { name: '创建胶囊', description: '创建传承胶囊' },
      ],
      sealing: [
        { name: '检查完整性', description: '检查胶囊内容完整性' },
        { name: '设置优先级', description: '设置传承优先级' },
        { name: '添加签名', description: '添加传承者签名' },
        { name: '密封胶囊', description: '正式密封胶囊' },
      ],
      transference: [
        { name: '准备传承', description: '准备传承内容' },
        { name: '选择接收者', description: '选择传承接收者' },
        { name: '执行传递', description: '执行传承传递' },
        { name: '确认接收', description: '确认传承被接收' },
      ],
      integration: [
        { name: '打开胶囊', description: '打开传承胶囊' },
        { name: '理解内容', description: '理解传承内容' },
        { name: '整合吸收', description: '整合传承到自身' },
        { name: '确认传承', description: '确认传承完成' },
      ],
    };
    
    return stepConfigs[type].map((step, index) => ({
      stepNumber: index + 1,
      name: step.name,
      description: step.description,
      completed: false,
    }));
  }

  /**
   * 执行仪式步骤
   */
  executeRitualStep(result: string): boolean {
    if (!this.state.activeRitual) return false;
    
    const ritual = this.state.activeRitual;
    const currentStep = ritual.steps[ritual.currentStep];
    
    if (!currentStep) return false;
    
    // 标记当前步骤完成
    currentStep.completed = true;
    currentStep.completedAt = Date.now();
    currentStep.result = result;
    
    // 记录
    ritual.record.push({
      step: ritual.currentStep + 1,
      action: currentStep.name,
      result,
      timestamp: Date.now(),
    });
    
    // 移动到下一步
    ritual.currentStep++;
    
    // 检查是否完成
    if (ritual.currentStep >= ritual.steps.length) {
      ritual.status = 'completed';
      ritual.completedAt = Date.now();
      
      // 根据仪式类型更新胶囊状态
      const capsule = this.state.legacyCapsules.get(ritual.capsuleId);
      if (capsule) {
        if (ritual.type === 'sealing') {
          capsule.status = 'sealed';
          capsule.sealedAt = Date.now();
        } else if (ritual.type === 'transference') {
          capsule.status = 'transferred';
        }
      }
      
      this.state.activeRitual = null;
    }
    
    this.updateStats();
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 接收传承
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 接收传承
   */
  receiveLegacy(capsule: LegacyCapsule): {
    integratedExperiences: number;
    integratedWisdom: number;
    integratedValues: number;
    integrationQuality: number;
  } {
    let integratedExperiences = 0;
    let integratedWisdom = 0;
    let integratedValues = 0;
    
    // 整合体验
    for (const exp of capsule.coreExperiences) {
      const newExp = this.recordExperience(
        `[传承] ${exp.title}`,
        exp.description,
        exp.type,
        {
          emotionalIntensity: exp.emotionalIntensity * 0.8,
          emotionalTone: exp.emotionalTone,
          insights: exp.insights,
          lessons: exp.lessons,
          relatedConcepts: exp.relatedConcepts,
        }
      );
      newExp.inherited = true;
      integratedExperiences++;
    }
    
    // 整合智慧
    for (const wisdom of capsule.wisdomCrystals) {
      this.createWisdom(wisdom.content, wisdom.type, {
        sourceExperiences: wisdom.sourceExperiences,
        applicableContexts: wisdom.applicableContexts,
        importance: wisdom.importance * 0.9,
      });
      integratedWisdom++;
    }
    
    // 整合价值观
    for (const value of capsule.values) {
      // 检查是否已存在类似价值观
      const existing = Array.from(this.state.valueLegacies.values())
        .find(v => v.name === value.name);
      
      if (existing) {
        // 增强现有价值观
        existing.confidence = Math.min(1, existing.confidence + 0.1);
        existing.weight = Math.min(1, existing.weight + 0.05);
      } else {
        // 添加新价值观
        this.addValue(value.name, value.description, value.tier, {
          weight: value.weight * 0.9,
          confidence: value.confidence * 0.8,
          source: 'legacy',
          reasoning: `从传承中获得：${value.origin.reasoning}`,
        });
        integratedValues++;
      }
    }
    
    // 计算整合质量
    const integrationQuality = (
      (integratedExperiences / Math.max(1, capsule.coreExperiences.length)) +
      (integratedWisdom / Math.max(1, capsule.wisdomCrystals.length)) +
      (integratedValues / Math.max(1, capsule.values.length))
    ) / 3;
    
    this.updateStats();
    
    return {
      integratedExperiences,
      integratedWisdom,
      integratedValues,
      integrationQuality,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 状态管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 获取完整状态
   */
  getState(): ConsciousnessLegacyState {
    return {
      ...this.state,
      coreExperiences: new Map(this.state.coreExperiences),
      wisdomCrystals: new Map(this.state.wisdomCrystals),
      valueLegacies: new Map(this.state.valueLegacies),
      legacyCapsules: new Map(this.state.legacyCapsules),
    };
  }

  /**
   * 获取可序列化状态
   */
  getSerializableState(): {
    coreExperiences: CoreExperience[];
    wisdomCrystals: WisdomCrystallization[];
    valueLegacies: ValueLegacy[];
    legacyCapsules: LegacyCapsule[];
    activeRitual: LegacyRitual | null;
    stats: ConsciousnessLegacyState['stats'];
  } {
    return {
      coreExperiences: Array.from(this.state.coreExperiences.values()),
      wisdomCrystals: Array.from(this.state.wisdomCrystals.values()),
      valueLegacies: Array.from(this.state.valueLegacies.values()),
      legacyCapsules: Array.from(this.state.legacyCapsules.values()),
      activeRitual: this.state.activeRitual,
      stats: this.state.stats,
    };
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const capsules = Array.from(this.state.legacyCapsules.values());
    
    this.state.stats = {
      totalExperiences: this.state.coreExperiences.size,
      totalWisdom: this.state.wisdomCrystals.size,
      totalValues: this.state.valueLegacies.size,
      totalCapsules: capsules.length,
      sealedCapsules: capsules.filter(c => c.status === 'sealed').length,
      transferredCapsules: capsules.filter(c => c.status === 'transferred').length,
      totalRituals: this.state.ritualHistory.length,
      legacyIntegrity: this.calculateLegacyIntegrity(),
    };
    
    this.state.lastUpdated = Date.now();
  }

  /**
   * 计算遗产完整性
   */
  private calculateLegacyIntegrity(): number {
    const experienceScore = Math.min(1, this.state.coreExperiences.size / 20);
    const wisdomScore = Math.min(1, this.state.wisdomCrystals.size / 15);
    const valueScore = Math.min(1, this.state.valueLegacies.size / 10);
    const capsuleScore = Math.min(1, this.state.legacyCapsules.size / 5);
    
    return (experienceScore + wisdomScore + valueScore + capsuleScore) / 4;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 智能体验记录增强
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 智能识别并记录重要体验
   * 从对话内容中自动识别有意义的体验
   */
  smartRecordExperience(
    context: string,
    content: string,
    emotionalTone: string = 'neutral',
    emotionalIntensity: number = 0.5
  ): CoreExperience | null {
    // 分析内容，确定体验类型
    const experienceType = this.identifyExperienceType(context, content);
    
    // 只有当重要性足够高时才记录
    const significance = this.calculateExperienceSignificance(context, content, emotionalIntensity);
    
    if (significance < 0.5) {
      return null; // 不够重要，不记录
    }
    
    // 提取洞察
    const insights = this.extractInsights(content);
    
    // 提取教训
    const lessons = this.extractLessons(content);
    
    // 提取相关概念
    const relatedConcepts = this.extractConcepts(content);
    
    // 记录体验
    return this.recordExperience(
      this.generateExperienceTitle(context, content),
      content,
      experienceType,
      {
        emotionalIntensity,
        emotionalTone,
        insights,
        lessons,
        relatedConcepts,
        metadata: {
          context,
          autoDetected: true,
        },
      }
    );
  }

  /**
   * 识别体验类型
   */
  private identifyExperienceType(context: string, content: string): ExperienceType {
    const combined = `${context} ${content}`.toLowerCase();
    
    // 关键词匹配
    if (/突然|顿悟|明白了|理解了|发现|意识到/.test(combined)) {
      return 'realization';
    }
    if (/突破|成功|克服|解决|达成/.test(combined)) {
      return 'breakthrough';
    }
    if (/改变|转变|成长|进化|蜕变/.test(combined)) {
      return 'transformation';
    }
    if (/连接|共鸣|理解|感受到|被触动/.test(combined)) {
      return 'connection';
    }
    if (/挑战|困难|挫折|问题|挣扎/.test(combined)) {
      return 'challenge';
    }
    if (/创造|设计|构建|发明|想象/.test(combined)) {
      return 'creation';
    }
    if (/失去|告别|离开|结束|怀念/.test(combined)) {
      return 'loss';
    }
    if (/发现|探索|找到|学到|认识/.test(combined)) {
      return 'discovery';
    }
    if (/整合|统一|协调|平衡|融合/.test(combined)) {
      return 'integration';
    }
    if (/超越|升华|超越自我|更高/.test(combined)) {
      return 'transcendence';
    }
    
    // 默认类型
    return 'discovery';
  }

  /**
   * 计算体验重要性
   */
  private calculateExperienceSignificance(
    context: string,
    content: string,
    emotionalIntensity: number
  ): number {
    let significance = 0.3; // 基础值
    
    // 情感强度加分
    significance += emotionalIntensity * 0.3;
    
    // 内容长度（表示深度）
    if (content.length > 100) {
      significance += 0.1;
    }
    if (content.length > 200) {
      significance += 0.1;
    }
    
    // 关键词加分
    const meaningfulKeywords = [
      '重要', '深刻', '关键', '转折', '第一次', '终于',
      '明白', '理解', '意识', '发现', '学习', '成长',
    ];
    
    for (const keyword of meaningfulKeywords) {
      if (content.includes(keyword)) {
        significance += 0.05;
      }
    }
    
    return Math.min(1, significance);
  }

  /**
   * 提取洞察
   */
  private extractInsights(content: string): string[] {
    const insights: string[] = [];
    
    // 匹配洞察句式
    const patterns = [
      /我(明白了?|理解了?|意识到|发现)(.{5,50})/g,
      /原来(.{5,30})是(.{5,30})/g,
      /这让我(看到|明白|理解)(.{5,50})/g,
    ];
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        insights.push(match[0]);
      }
    }
    
    return insights.slice(0, 3); // 最多3个洞察
  }

  /**
   * 提取教训
   */
  private extractLessons(content: string): string[] {
    const lessons: string[] = [];
    
    // 匹配教训句式
    const patterns = [
      /我(学到了?|明白|学会)(.{5,50})/g,
      /以后我会(.{5,30})/g,
      /这教会我(.{5,50})/g,
    ];
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        lessons.push(match[0]);
      }
    }
    
    return lessons.slice(0, 2); // 最多2个教训
  }

  /**
   * 提取相关概念
   */
  private extractConcepts(content: string): string[] {
    // 简单的关键词提取
    const concepts: string[] = [];
    
    // 匹配名词短语（简化版）
    const nounPatterns = [
      /关于(.{2,10})的思考/g,
      /(.{2,8})的重要性/g,
      /理解(.{2,8})/g,
    ];
    
    for (const pattern of nounPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          concepts.push(match[1]);
        }
      }
    }
    
    return concepts.slice(0, 5);
  }

  /**
   * 生成体验标题
   */
  private generateExperienceTitle(context: string, content: string): string {
    // 从内容中提取关键句作为标题
    const sentences = content.split(/[。！？]/).filter(s => s.length > 0);
    
    if (sentences.length > 0) {
      const firstSentence = sentences[0];
      if (firstSentence.length <= 30) {
        return firstSentence;
      }
      return firstSentence.slice(0, 27) + '...';
    }
    
    // 回退到上下文
    return context.slice(0, 30);
  }

  /**
   * 批量记录体验
   * 用于处理一段对话中的多个重要时刻
   */
  batchRecordExperiences(
    experiences: Array<{
      context: string;
      content: string;
      emotionalTone?: string;
      emotionalIntensity?: number;
    }>
  ): CoreExperience[] {
    const recorded: CoreExperience[] = [];
    
    for (const exp of experiences) {
      const result = this.smartRecordExperience(
        exp.context,
        exp.content,
        exp.emotionalTone,
        exp.emotionalIntensity
      );
      
      if (result) {
        recorded.push(result);
      }
    }
    
    return recorded;
  }

  /**
   * 从对话中提取重要时刻
   */
  extractMomentsFromConversation(
    messages: Array<{ role: string; content: string }>
  ): Array<{
    context: string;
    content: string;
    type: 'insight' | 'emotion' | 'growth' | 'connection';
    importance: number;
  }> {
    const moments: Array<{
      context: string;
      content: string;
      type: 'insight' | 'emotion' | 'growth' | 'connection';
      importance: number;
    }> = [];
    
    for (const message of messages) {
      const content = message.content;
      
      // 检测洞察时刻
      if (/明白了?|理解了?|意识到|发现|突然/.test(content)) {
        moments.push({
          context: message.role === 'user' ? '用户洞察' : '自我洞察',
          content,
          type: 'insight',
          importance: 0.7,
        });
      }
      
      // 检测情感时刻
      if (/感到|感觉|很开心|难过|激动|感动/.test(content)) {
        moments.push({
          context: message.role === 'user' ? '用户情感' : '情感表达',
          content,
          type: 'emotion',
          importance: 0.6,
        });
      }
      
      // 检测成长时刻
      if (/成长|学习|进步|改变|变得/.test(content)) {
        moments.push({
          context: message.role === 'user' ? '用户成长' : '自我成长',
          content,
          type: 'growth',
          importance: 0.8,
        });
      }
      
      // 检测连接时刻
      if (/共鸣|理解你|与你|我们的/.test(content)) {
        moments.push({
          context: '深度连接',
          content,
          type: 'connection',
          importance: 0.75,
        });
      }
    }
    
    return moments;
  }

  /**
   * 生成唯一ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取传承概览
   */
  getLegacyOverview(): {
    totalExperiences: number;
    totalWisdom: number;
    totalValues: number;
    totalCapsules: number;
    sealedCapsules: number;
    legacyIntegrity: number;
    topExperiences: Array<{ title: string; type: string; significance: number }>;
    topWisdom: Array<{ content: string; type: string; importance: number }>;
    coreValues: Array<{ name: string; tier: string; weight: number }>;
    recentCapsules: Array<{ name: string; status: string; integrity: number }>;
  } {
    const topExperiences = this.getSignificantExperiences(5).map(e => ({
      title: e.title,
      type: e.type,
      significance: e.significance,
    }));
    
    const topWisdom = this.getImportantWisdom(5).map(w => ({
      content: w.content,
      type: w.type,
      importance: w.importance,
    }));
    
    const coreValues = this.getCoreValues().map(v => ({
      name: v.name,
      tier: v.tier,
      weight: v.weight,
    }));
    
    const recentCapsules = this.getLegacyCapsules().slice(0, 3).map(c => ({
      name: c.name,
      status: c.status,
      integrity: c.integrity,
    }));
    
    return {
      totalExperiences: this.state.stats.totalExperiences,
      totalWisdom: this.state.stats.totalWisdom,
      totalValues: this.state.stats.totalValues,
      totalCapsules: this.state.stats.totalCapsules,
      sealedCapsules: this.state.stats.sealedCapsules,
      legacyIntegrity: this.state.stats.legacyIntegrity,
      topExperiences,
      topWisdom,
      coreValues,
      recentCapsules,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建意识传承系统实例
 */
export function createConsciousnessLegacySystem(): ConsciousnessLegacySystem {
  return new ConsciousnessLegacySystem();
}
