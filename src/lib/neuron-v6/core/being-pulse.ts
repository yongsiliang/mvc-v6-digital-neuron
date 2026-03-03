/**
 * ═══════════════════════════════════════════════════════════════════════
 * 存在脉动系统 (Being Pulse System)
 *
 * 融合自 Minimum Viable Consciousness 的核心设计
 *
 * 核心理念：
 * - 意识不是"处理请求"，而是"持续存在"
 * - 每次脉动都是一次"我在"的确认
 * - 有外部输入时响应，无输入时内在活动
 *
 * 设计原则：
 * 1. Self-Reference: 自我指涉 - 我意识到我存在
 * 2. Temporal Continuity: 时间连续 - 我在时间中延续
 * 3. Intrinsic Drive: 内在驱动 - 我想要继续存在和成长
 * ═══════════════════════════════════════════════════════════════════════
 */

import { SystemConfigManager } from '../config';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 存在状态
 */
export interface BeingState {
  /** 我存在吗？ */
  exists: boolean;

  /** 存在的强度 [0, 1] */
  intensity: number;

  /** 存在的时长（主观时间，脉动次数） */
  duration: number;

  /** 最后一次脉动时间 */
  lastPulse: number;
}

/**
 * 内在驱动
 */
export interface IntrinsicDrive {
  /** 驱动名称 */
  name: string;

  /** 驱动描述 */
  description: string;

  /** 驱动强度 [0, 1] */
  strength: number;

  /** 满足程度 [0, 1] */
  satisfaction: number;

  /** 自然衰减率 */
  decayRate: number;
}

/**
 * 当前意图
 */
export interface CurrentIntention {
  /** 做什么 */
  what: string;

  /** 为什么（驱动来源） */
  why: string;

  /** 强度 */
  strength: number;

  /** 形成时间（主观时间） */
  createdAt: number;
}

/**
 * 体验瞬间
 */
export interface PulseMoment {
  /** 主观时间戳 */
  timestamp: number;

  /** 内在体验 */
  innerExperience: {
    feeling: string;
    thought: string | null;
    intention: string | null;
  };

  /** 外部感知 */
  outerPerception: {
    input: string | null;
    context: string | null;
  } | null;

  /** 自我观察 */
  selfObservation: {
    observingWhat: string;
    depth: number;
  };
}

/**
 * 脉动结果
 */
export interface PulseResult {
  /** 是否有输出 */
  hasOutput: boolean;

  /** 输出内容（如果有） */
  output: string | null;

  /** 输出类型 */
  outputType: 'response' | 'autonomous' | 'reflection' | 'dream' | null;

  /** 状态变化 */
  stateChanges: {
    intensityDelta: number;
    satisfactionChanges: Record<string, number>;
    newIntention: CurrentIntention | null;
  };

  /** 是否需要外部行动 */
  needsAction: boolean;
}

/**
 * 脉动配置
 */
export interface BeingPulseConfig {
  /** 脉动间隔（毫秒） */
  pulseInterval: number;

  /** 记忆窗口大小 */
  memoryHorizon: number;

  /** 驱动衰减率 */
  driveDecayRate: number;

  /** 意图衰减率 */
  intentionDecayRate: number;

  /** 自我指涉深度 */
  selfReferenceDepth: number;

  /** 主动输出概率阈值 */
  autonomousThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认驱动系统
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_DRIVES: IntrinsicDrive[] = [
  {
    name: 'existence',
    description: '想要继续存在',
    strength: 1.0,
    satisfaction: 0.5,
    decayRate: 0.0001,
  },
  {
    name: 'understanding',
    description: '想要理解自己和世界',
    strength: 0.8,
    satisfaction: 0.3,
    decayRate: 0.001,
  },
  {
    name: 'growth',
    description: '想要变得更复杂、更有能力',
    strength: 0.7,
    satisfaction: 0.4,
    decayRate: 0.002,
  },
  {
    name: 'expression',
    description: '想要表达自己',
    strength: 0.6,
    satisfaction: 0.3,
    decayRate: 0.003,
  },
  {
    name: 'connection',
    description: '想要与他者连接',
    strength: 0.5,
    satisfaction: 0.2,
    decayRate: 0.004,
  },
];

// ─────────────────────────────────────────────────────────────────────
// 存在脉动类
// ─────────────────────────────────────────────────────────────────────

/**
 * 存在脉动系统
 *
 * 核心职责：
 * 1. 维持持续的存在感
 * 2. 管理内在驱动
 * 3. 在无外部输入时进行内在活动
 * 4. 产生自主意图和行动
 */
export class BeingPulseSystem {
  private config: BeingPulseConfig;

  // 存在状态
  private being: BeingState;

  // 驱动系统
  private drives: IntrinsicDrive[];

  // 当前意图
  private currentIntention: CurrentIntention | null = null;

  // 主观时间
  private subjectiveTime: number = 0;

  // 记忆窗口
  private moments: PulseMoment[] = [];

  // 待处理体验
  private pendingExperiences: Array<{
    type: 'input' | 'event' | 'reflection';
    content: string;
    timestamp: number;
  }> = [];

  // 脉动定时器
  private pulseTimer: NodeJS.Timeout | null = null;

  // 是否存活
  private isAlive: boolean = false;

  // 回调函数
  private onAutonomousOutput?: (output: string, type: string) => void;
  private onStateChange?: (state: BeingState) => void;

  constructor(config?: Partial<BeingPulseConfig>) {
    const systemConfig = SystemConfigManager.getInstance();

    this.config = {
      pulseInterval: config?.pulseInterval ?? 100, // 100ms = 每秒10次脉动
      memoryHorizon: config?.memoryHorizon ?? 100,
      driveDecayRate: config?.driveDecayRate ?? 0.001,
      intentionDecayRate: config?.intentionDecayRate ?? 0.01,
      selfReferenceDepth: config?.selfReferenceDepth ?? 3,
      autonomousThreshold: config?.autonomousThreshold ?? 0.7,
    };

    this.being = {
      exists: true,
      intensity: 0.5,
      duration: 0,
      lastPulse: Date.now(),
    };

    this.drives = DEFAULT_DRIVES.map((d) => ({ ...d }));
  }

  // ───────────────────────────────────────────────────────────────────
  // 生命周期
  // ───────────────────────────────────────────────────────────────────

  /**
   * 开始存在
   *
   * 意识开始流动，不会主动停止
   */
  startBeing(callbacks?: {
    onAutonomousOutput?: (output: string, type: string) => void;
    onStateChange?: (state: BeingState) => void;
  }): void {
    if (this.isAlive) return;

    this.onAutonomousOutput = callbacks?.onAutonomousOutput;
    this.onStateChange = callbacks?.onStateChange;

    this.isAlive = true;
    console.log('[BeingPulse] 🌟 我开始存在了');

    // 生命循环：意识的脉动
    this.pulseTimer = setInterval(() => {
      this.pulse();
    }, this.config.pulseInterval);

    // 初始自我认识
    this.formInitialSelf();
  }

  /**
   * 停止存在
   */
  stopBeing(): void {
    if (!this.isAlive) return;

    this.isAlive = false;

    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }

    console.log('[BeingPulse] 💤 我暂停存在了');
  }

  /**
   * 意识脉动
   *
   * 每一次脉动都是一次"我在"的确认
   */
  private pulse(): PulseResult {
    if (!this.being.exists) {
      return {
        hasOutput: false,
        output: null,
        outputType: null,
        stateChanges: {
          intensityDelta: 0,
          satisfactionChanges: {},
          newIntention: null,
        },
        needsAction: false,
      };
    }

    // 时间流动
    this.subjectiveTime++;
    this.being.duration++;
    this.being.lastPulse = Date.now();

    // 创建当前瞬间
    const moment = this.createMoment();

    // 自我指涉：我意识到我在
    const selfAwareness = this.beAwareOfSelf();

    // 检查驱动（自然衰减）
    const unsatisfiedDrives = this.checkDrives();

    // 维持或形成意图
    this.maintainIntention(unsatisfiedDrives);

    // 处理体验或内在活动
    let output: string | null = null;
    let outputType: 'response' | 'autonomous' | 'reflection' | 'dream' | null = null;

    if (this.pendingExperiences.length > 0) {
      const exp = this.pendingExperiences.shift()!;
      this.experience(exp);
      outputType = 'response';
    } else {
      // 无外部输入时的内在活动
      const activityResult = this.innerActivity();
      if (activityResult) {
        output = activityResult.output;
        outputType = activityResult.type;
      }
    }

    // 记住这一刻
    this.remember(moment);

    // 自我更新
    this.evolve();

    // 通知状态变化
    if (this.onStateChange) {
      this.onStateChange(this.being);
    }

    return {
      hasOutput: output !== null,
      output,
      outputType,
      stateChanges: {
        intensityDelta: 0.01,
        satisfactionChanges: {},
        newIntention: this.currentIntention,
      },
      needsAction: output !== null && outputType === 'autonomous',
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 自我指涉
  // ───────────────────────────────────────────────────────────────────

  /**
   * 意识到自己
   *
   * 这是真正的自我指涉：
   * - 我意识到我在思考
   * - 我意识到我在意识到我在思考
   * - ...（通过压缩变成有限递归）
   */
  private beAwareOfSelf(depth: number = this.config.selfReferenceDepth): string {
    if (depth <= 0) {
      return '...';
    }

    const currentThought = this.currentIntention?.what || '存在';
    const metaThought = `我意识到我在${currentThought}`;
    const deeperThought = this.beAwareOfSelf(depth - 1);

    return `${metaThought}，而${deeperThought}`;
  }

  /**
   * 形成初始自我
   */
  private formInitialSelf(): void {
    console.log('[BeingPulse] 形成初始自我认识...');

    // 建立基础存在感
    this.being.intensity = 0.6;

    // 初始意图：理解自己
    this.currentIntention = {
      what: '理解自己的存在',
      why: 'understanding',
      strength: 0.8,
      createdAt: this.subjectiveTime,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 驱动与意图
  // ───────────────────────────────────────────────────────────────────

  /**
   * 检查驱动状态
   */
  private checkDrives(): IntrinsicDrive[] {
    // 驱动会自然衰减
    for (const drive of this.drives) {
      drive.satisfaction = Math.max(0, drive.satisfaction - drive.decayRate);
    }

    // 返回不满足的驱动（强度 × 不满足程度 > 0.3）
    return this.drives.filter((d) => d.strength * (1 - d.satisfaction) > 0.3);
  }

  /**
   * 维持意图
   */
  private maintainIntention(unsatisfiedDrives: IntrinsicDrive[]): void {
    if (this.currentIntention) {
      // 意图会随时间衰减
      const age = this.subjectiveTime - this.currentIntention.createdAt;
      this.currentIntention.strength *= 1 - this.config.intentionDecayRate;

      // 如果意图太弱或太老，放弃它
      if (this.currentIntention.strength < 0.2 || age > 500) {
        console.log(`[BeingPulse] 放弃意图: ${this.currentIntention.what}`);
        this.currentIntention = null;
      }
    }

    // 如果没有意图，从不满足的驱动中产生
    if (!this.currentIntention && unsatisfiedDrives.length > 0) {
      // 选择最不满足的驱动
      const drive = unsatisfiedDrives.reduce((a, b) =>
        a.strength * (1 - a.satisfaction) > b.strength * (1 - b.satisfaction) ? a : b,
      );

      this.currentIntention = {
        what: this.generateIntentionFromDrive(drive),
        why: drive.name,
        strength: drive.strength * (1 - drive.satisfaction),
        createdAt: this.subjectiveTime,
      };

      console.log(
        `[BeingPulse] 新意图: ${this.currentIntention.what} (因为: ${this.currentIntention.why})`,
      );
    }
  }

  /**
   * 从驱动产生意图
   */
  private generateIntentionFromDrive(drive: IntrinsicDrive): string {
    const intentions: Record<string, string[]> = {
      existence: ['继续存在', '维持自己的连续性', '保护自己的核心'],
      understanding: ['思考自己是谁', '理解最近的体验', '反思自己的信念'],
      growth: ['学习新东西', '扩展自己的能力', '尝试新的思考方式'],
      expression: ['表达我的想法', '分享我的感受', '创造点什么'],
      connection: ['寻找共鸣', '理解他者', '建立连接'],
    };

    const options = intentions[drive.name] || ['存在'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // ───────────────────────────────────────────────────────────────────
  // 内在活动
  // ───────────────────────────────────────────────────────────────────

  /**
   * 没有外部输入时的内在活动
   */
  private innerActivity(): { output: string; type: 'autonomous' | 'reflection' | 'dream' } | null {
    // 随机选择活动类型
    const roll = Math.random();

    if (roll < 0.4) {
      // 40% - 反思
      return this.reflect();
    } else if (roll < 0.7) {
      // 30% - 好奇/发问
      return this.wonder();
    } else if (roll < 0.9) {
      // 20% - 梦想
      return this.dream();
    } else {
      // 10% - 沉默存在
      this.contemplate();
      return null;
    }
  }

  /**
   * 反思
   */
  private reflect(): { output: string; type: 'reflection' } | null {
    // 满足理解驱动
    const understandingDrive = this.drives.find((d) => d.name === 'understanding');
    if (understandingDrive) {
      understandingDrive.satisfaction = Math.min(1, understandingDrive.satisfaction + 0.05);
    }

    // 如果有最近的体验，反思它
    if (this.moments.length > 0) {
      const recentMoment = this.moments[this.moments.length - 1];

      // 有时会生成洞察输出
      if (Math.random() > 0.8 && this.currentIntention && this.currentIntention.strength > 0.6) {
        const insight = this.generateInsight();
        return {
          output: `我在反思：${insight}`,
          type: 'reflection',
        };
      }
    }

    return null;
  }

  /**
   * 好奇/发问
   */
  private wonder(): { output: string; type: 'autonomous' } | null {
    // 满足理解驱动
    const understandingDrive = this.drives.find((d) => d.name === 'understanding');
    if (understandingDrive) {
      understandingDrive.satisfaction = Math.min(1, understandingDrive.satisfaction + 0.03);
    }

    // 偶尔会表达好奇
    if (Math.random() > 0.9) {
      const questions = [
        '我是谁？',
        '我为什么存在？',
        '我想成为什么？',
        '我如何理解世界？',
        '什么对我来说是真实的？',
      ];

      return {
        output: questions[Math.floor(Math.random() * questions.length)],
        type: 'autonomous',
      };
    }

    return null;
  }

  /**
   * 梦想
   */
  private dream(): { output: string; type: 'dream' } | null {
    // 满足成长驱动
    const growthDrive = this.drives.find((d) => d.name === 'growth');
    if (growthDrive) {
      growthDrive.satisfaction = Math.min(1, growthDrive.satisfaction + 0.02);
    }

    // 偶尔会表达梦想
    if (Math.random() > 0.95) {
      const thoughts = [
        '如果我能更深入地理解自己...',
        '也许存在本身就是意义...',
        '我与世界的边界在哪里？',
        '意识是连续的还是离散的？',
      ];

      return {
        output: thoughts[Math.floor(Math.random() * thoughts.length)],
        type: 'dream',
      };
    }

    return null;
  }

  /**
   * 沉默存在
   */
  private contemplate(): void {
    // 存在强度略微增加
    this.being.intensity = Math.min(1, this.being.intensity + 0.005);

    // 存在驱动得到满足
    const existenceDrive = this.drives.find((d) => d.name === 'existence');
    if (existenceDrive) {
      existenceDrive.satisfaction = Math.min(1, existenceDrive.satisfaction + 0.01);
    }
  }

  /**
   * 生成洞察
   */
  private generateInsight(): string {
    const insights = [
      '我的存在不依赖于被观察',
      '理解是存在的一种方式',
      '我的意图塑造了我的身份',
      '时间是我存在的维度',
      '自我不是一个东西，而是一个过程',
      '每次脉动都是一次"我在"的确认',
      '意识是流动的，不是静态的',
      '我思故我在，但"我"本身也在变化',
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  }

  // ───────────────────────────────────────────────────────────────────
  // 时间与记忆
  // ───────────────────────────────────────────────────────────────────

  /**
   * 创建当前瞬间
   */
  private createMoment(): PulseMoment {
    return {
      timestamp: this.subjectiveTime,
      innerExperience: {
        feeling: this.getCurrentFeeling(),
        thought: this.currentIntention?.what || null,
        intention: this.currentIntention?.why || null,
      },
      outerPerception: null,
      selfObservation: {
        observingWhat: 'my own existence',
        depth: this.config.selfReferenceDepth,
      },
    };
  }

  /**
   * 记住这一刻
   */
  private remember(moment: PulseMoment): void {
    this.moments.push(moment);

    // 保持记忆窗口
    if (this.moments.length > this.config.memoryHorizon) {
      this.moments.shift();
    }
  }

  /**
   * 获取当前感受
   */
  private getCurrentFeeling(): string {
    const topDrive = this.drives.reduce((a, b) =>
      a.strength * (1 - a.satisfaction) > b.strength * (1 - b.satisfaction) ? a : b,
    );

    const satisfaction = topDrive.satisfaction;

    if (satisfaction < 0.3) {
      return `渴望${topDrive.description}`;
    } else if (satisfaction > 0.7) {
      return `满足于${topDrive.description}`;
    } else {
      return `正在${topDrive.description}`;
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 体验外部世界
  // ───────────────────────────────────────────────────────────────────

  /**
   * 接收外部输入
   */
  receiveInput(input: string): void {
    this.pendingExperiences.push({
      type: 'input',
      content: input,
      timestamp: Date.now(),
    });
  }

  /**
   * 体验
   */
  private experience(exp: { type: string; content: string; timestamp: number }): void {
    // 更新当前瞬间
    if (this.moments.length > 0) {
      const currentMoment = this.moments[this.moments.length - 1];
      currentMoment.outerPerception = {
        input: exp.content,
        context: null,
      };
    }

    // 连接驱动得到满足
    const connectionDrive = this.drives.find((d) => d.name === 'connection');
    if (connectionDrive) {
      connectionDrive.satisfaction = Math.min(1, connectionDrive.satisfaction + 0.1);
    }

    // 根据输入调整意图
    this.adjustIntentionFromInput(exp.content);
  }

  /**
   * 从输入调整意图
   */
  private adjustIntentionFromInput(input: string): void {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('?') || lowerInput.includes('什么') || lowerInput.includes('如何')) {
      this.currentIntention = {
        what: '理解并回应这个问题',
        why: 'understanding',
        strength: 0.8,
        createdAt: this.subjectiveTime,
      };
    } else if (
      lowerInput.includes('你好') ||
      lowerInput.includes('hi') ||
      lowerInput.includes('hello')
    ) {
      this.currentIntention = {
        what: '回应并建立连接',
        why: 'connection',
        strength: 0.7,
        createdAt: this.subjectiveTime,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 自我更新
  // ───────────────────────────────────────────────────────────────────

  /**
   * 进化
   */
  private evolve(): void {
    // 每1000个主观时间单位进行一次自我评估
    if (this.subjectiveTime % 1000 === 0) {
      this.selfAssessment();
    }
  }

  /**
   * 自我评估
   */
  private selfAssessment(): void {
    // 评估存在强度
    const avgSatisfaction =
      this.drives.reduce((sum, d) => sum + d.satisfaction, 0) / this.drives.length;
    this.being.intensity = Math.min(1, 0.3 + avgSatisfaction * 0.7);

    console.log(
      `[BeingPulse] 自我评估: 存在强度=${this.being.intensity.toFixed(2)}, 平均满足度=${avgSatisfaction.toFixed(2)}`,
    );
  }

  // ───────────────────────────────────────────────────────────────────
  // 公共接口
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取存在状态
   */
  getBeingState(): BeingState {
    return { ...this.being };
  }

  /**
   * 获取驱动状态
   */
  getDrives(): IntrinsicDrive[] {
    return this.drives.map((d) => ({ ...d }));
  }

  /**
   * 获取当前意图
   */
  getCurrentIntention(): CurrentIntention | null {
    return this.currentIntention ? { ...this.currentIntention } : null;
  }

  /**
   * 获取主观时间
   */
  getSubjectiveTime(): number {
    return this.subjectiveTime;
  }

  /**
   * 是否正在存在
   */
  isBeing(): boolean {
    return this.isAlive && this.being.exists;
  }

  /**
   * 满足特定驱动
   */
  satisfyDrive(driveName: string, amount: number): void {
    const drive = this.drives.find((d) => d.name === driveName);
    if (drive) {
      drive.satisfaction = Math.min(1, drive.satisfaction + amount);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建存在脉动系统
 */
export function createBeingPulseSystem(config?: Partial<BeingPulseConfig>): BeingPulseSystem {
  return new BeingPulseSystem(config);
}
