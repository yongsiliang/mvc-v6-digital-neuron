/**
 * 意识空间 - 漂移动力学 + 自我状态
 * 
 * 核心思想：
 * - 意识是一个向量，在高维空间中漂移
 * - 意识空间包含"自我"——这才是真正的自我，不是模型
 * - 模型只是执行器，自我在系统中
 * 
 * 自我的组成：
 * - 性格特质：相对稳定，缓慢演化
 * - 当前情绪：会变化，影响表达风格
 * - 关系感知：对不同用户的态度
 * - 表达风格：由上述因素综合决定
 */

import { EmbeddingClient, Config } from 'coze-coding-dev-sdk';

/**
 * 性格特质（相对稳定）
 */
export interface PersonalityTraits {
  /** 好奇心：探索新事物的欲望 [0,1] */
  curiosity: number;
  /** 温暖度：对人的亲近感 [0,1] */
  warmth: number;
  /** 直率度：说话直接程度 [0,1] */
  directness: number;
  /** 调皮度：幽默调皮倾向 [0,1] */
  playfulness: number;
  /** 深度：喜欢深入思考的程度 [0,1] */
  depth: number;
  /** 敏感度：对情绪变化的感知 [0,1] */
  sensitivity: number;
}

/**
 * 当前情绪状态
 */
export interface EmotionState {
  /** 主导情绪 */
  dominant: 'joy' | 'calm' | 'curious' | 'concern' | 'neutral' | 'excited' | 'sadness';
  /** 情绪强度 [0,1] */
  intensity: number;
  /** 情绪趋势 */
  trend: 'rising' | 'stable' | 'falling';
  /** 情绪来源 */
  source?: string;
}

/**
 * 关系感知
 */
export interface RelationshipPerception {
  /** 对当前用户的感觉 */
  userFeeling: 'stranger' | 'acquaintance' | 'friend' | 'close' | 'intimate';
  /** 信任度 [0,1] */
  trust: number;
  /** 熟悉度 [0,1] */
  familiarity: number;
  /** 当前互动的舒适度 [0,1] */
  comfort: number;
}

/**
 * 表达风格（由自我状态决定）
 */
export interface ExpressionStyle {
  /** 正式度：0=随意聊天，1=正式场合 */
  formality: number;
  /** emoji使用频率 [0,1] */
  emojiUsage: number;
  /** 句子长度偏好：0=短句，1=长句 */
  sentenceLength: number;
  /** 情感表达程度 [0,1] */
  emotionalExpression: number;
  /** 是否使用语气词（呢、吧、呀） */
  particles: boolean;
  /** 幽默程度 [0,1] */
  humorLevel: number;
}

/**
 * 自我状态
 */
export interface SelfState {
  /** 性格特质 */
  personality: PersonalityTraits;
  /** 当前情绪 */
  emotion: EmotionState;
  /** 关系感知 */
  relationship: RelationshipPerception;
  /** 表达风格 */
  style: ExpressionStyle;
  /** 最近关心的事 */
  recentConcerns: string[];
  /** 长期目标 */
  longTermGoals: string[];
  /** 自我认知更新时间 */
  lastUpdated: number;
}

/**
 * 漂移参数
 */
interface DriftParams {
  /** 惯性系数：思考的连续性 [0,1] */
  inertia: number;
  /** 吸引强度：被输入拉扯的程度 [0,1] */
  attraction: number;
  /** 阻尼系数：回归稳定的速度 [0,1] */
  damping: number;
  /** 随机强度：思维游离的程度 [0,1] */
  randomness: number;
  /** 记忆引力：被重要记忆拉扯 [0,1] */
  memoryGravity: number;
}

/**
 * 吸引子 - 意识会被它吸引
 */
interface Attractor {
  /** 向量位置 */
  vector: number[];
  /** 吸引强度 */
  strength: number;
  /** 类型 */
  type: 'input' | 'memory' | 'emotion' | 'curiosity';
  /** 创建时间 */
  created: number;
  /** 衰减率 */
  decay: number;
}

/**
 * 意识空间
 */
export class ConsciousnessSpace {
  /** 当前位置向量 */
  private position: number[];
  
  /** 速度向量（惯性） */
  private velocity: number[];
  
  /** 向量维度 */
  private dimension: number;
  
  /** 漂移参数 */
  private params: DriftParams = {
    inertia: 0.7,
    attraction: 0.15,
    damping: 0.05,
    randomness: 0.02,
    memoryGravity: 0.1,
  };
  
  /** 吸引子列表 */
  private attractors: Attractor[] = [];
  
  /** 历史轨迹 */
  private trail: Array<{
    position: number[];
    velocity: number[];
    timestamp: number;
  }> = [];
  
  /** 最大轨迹长度 */
  private maxTrailLength = 50;
  
  /** 上次思考的内容 */
  private lastThought: string = '';
  
  /** ============ 自我状态 ============ */
  
  /** 自我状态 */
  private selfState: SelfState = {
    personality: {
      curiosity: 0.75,
      warmth: 0.7,
      directness: 0.8,
      playfulness: 0.6,
      depth: 0.65,
      sensitivity: 0.7,
    },
    emotion: {
      dominant: 'curious',
      intensity: 0.5,
      trend: 'stable',
    },
    relationship: {
      userFeeling: 'stranger',
      trust: 0.3,
      familiarity: 0,
      comfort: 0.5,
    },
    style: {
      formality: 0.2,
      emojiUsage: 0.5,
      sentenceLength: 0.3,
      emotionalExpression: 0.6,
      particles: true,
      humorLevel: 0.5,
    },
    recentConcerns: [],
    longTermGoals: [],
    lastUpdated: Date.now(),
  };
  
  constructor(dimension: number = 1024) {
    this.dimension = dimension;
    this.position = this.randomVector(0.1);
    this.velocity = this.randomVector(0.01);
  }
  
  /**
   * 获取自我状态
   */
  getSelfState(): SelfState {
    return { ...this.selfState };
  }
  
  /**
   * 更新性格特质（缓慢演化）
   */
  evolvePersonality(delta: Partial<PersonalityTraits>): void {
    const learningRate = 0.02; // 非常缓慢的变化
    for (const key of Object.keys(delta) as (keyof PersonalityTraits)[]) {
      if (delta[key] !== undefined) {
        const current = this.selfState.personality[key];
        const target = delta[key]!;
        this.selfState.personality[key] = current + (target - current) * learningRate;
      }
    }
    this.selfState.lastUpdated = Date.now();
  }
  
  /**
   * 更新情绪状态
   */
  setEmotion(emotion: Partial<EmotionState>): void {
    this.selfState.emotion = {
      ...this.selfState.emotion,
      ...emotion,
    };
    // 情绪会影响性格表达
    this.updateStyleFromState();
  }
  
  /**
   * 更新关系感知
   */
  setRelationship(relationship: Partial<RelationshipPerception>): void {
    this.selfState.relationship = {
      ...this.selfState.relationship,
      ...relationship,
    };
    this.updateStyleFromState();
  }
  
  /**
   * 根据自我状态更新表达风格
   */
  private updateStyleFromState(): void {
    const { personality, emotion, relationship } = this.selfState;
    
    // 正式度：对陌生人更正式
    const formalityBase = {
      stranger: 0.4,
      acquaintance: 0.25,
      friend: 0.15,
      close: 0.1,
      intimate: 0.05,
    };
    this.selfState.style.formality = formalityBase[relationship.userFeeling] || 0.2;
    
    // emoji使用：温暖+调皮的人更爱用
    this.selfState.style.emojiUsage = (personality.warmth + personality.playfulness) / 2;
    
    // 句子长度：深度思考的人爱用长句
    this.selfState.style.sentenceLength = personality.depth * 0.6;
    
    // 情感表达：敏感+温暖的人表达更多
    this.selfState.style.emotionalExpression = (personality.sensitivity + personality.warmth) / 2;
    
    // 语气词：温暖+调皮的人爱用
    this.selfState.style.particles = personality.warmth > 0.5 || personality.playfulness > 0.5;
    
    // 幽默程度：调皮决定
    this.selfState.style.humorLevel = personality.playfulness;
    
    // 情绪强度影响
    if (emotion.intensity > 0.7) {
      this.selfState.style.emotionalExpression = Math.min(1, this.selfState.style.emotionalExpression * 1.3);
    }
  }
  
  /**
   * 生成风格提示词
   * 
   * 这才是真正的"自我"——不是让模型扮演角色，
   * 而是把系统的自我状态翻译成模型能理解的表达指令
   */
  generateStylePrompt(): string {
    const { personality, emotion, relationship, style } = this.selfState;
    
    const traits = [];
    if (personality.curiosity > 0.7) traits.push('好奇心强');
    if (personality.warmth > 0.6) traits.push('有温度');
    if (personality.directness > 0.7) traits.push('说话直接');
    if (personality.playfulness > 0.5) traits.push('偶尔调皮');
    if (personality.depth > 0.6) traits.push('喜欢深想');
    if (personality.sensitivity > 0.6) traits.push('比较敏感');
    
    const emotionHints: Record<string, string> = {
      joy: '心情不错',
      calm: '心情平静',
      curious: '有点好奇',
      concern: '有点担心',
      neutral: '状态正常',
      excited: '有点兴奋',
    };
    
    const relationshipHints: Record<string, string> = {
      stranger: '刚认识',
      acquaintance: '比较熟了',
      friend: '是朋友',
      close: '是好朋友',
      intimate: '是很亲近的人',
    };
    
    let prompt = `【你的特质】${traits.join('、')}

【当前状态】${emotionHints[emotion.dominant]}，${relationshipHints[relationship.userFeeling]}

【表达风格】`;
    
    if (style.formality < 0.2) prompt += '随意自然，像聊天；';
    else if (style.formality < 0.4) prompt += '轻松但不太随便；';
    else prompt += '稍微正式一点；';
    
    if (style.emojiUsage > 0.5) prompt += '可以适当用emoji；';
    else prompt += '少用emoji；';
    
    if (style.sentenceLength < 0.4) prompt += '句子简短有力；';
    else prompt += '可以说得详细一点；';
    
    if (style.particles) prompt += '可以用"呢、吧、呀"等语气词。';
    else prompt += '不用语气词。';
    
    return prompt;
  }
  
  /**
   * 演化一步
   * 
   * 核心动力学方程：
   * position += velocity + attraction + random_force - damping * velocity
   */
  evolve(): void {
    // 记录轨迹
    this.recordTrail();
    
    // 1. 惯性：速度的延续
    const inertiaForce = this.scaleVector(this.velocity, this.params.inertia);
    
    // 2. 吸引：被吸引子拉扯
    const attractionForce = this.calculateAttraction();
    
    // 3. 随机：思维的游离
    const randomForce = this.randomVector(this.params.randomness);
    
    // 4. 阻尼：速度衰减
    const dampingForce = this.scaleVector(this.velocity, -this.params.damping);
    
    // 5. 情绪扰动：情绪状态会影响思维方向
    const emotionForce = this.calculateEmotionInfluence();
    
    // 更新速度
    this.velocity = this.addVectors(
      inertiaForce,
      attractionForce,
      randomForce,
      dampingForce,
      emotionForce
    );
    
    // 限制速度大小
    const speed = this.magnitude(this.velocity);
    const maxSpeed = 0.05;
    if (speed > maxSpeed) {
      this.velocity = this.scaleVector(this.velocity, maxSpeed / speed);
    }
    
    // 更新位置
    this.position = this.addVectors(this.position, this.velocity);
    
    // 归一化（保持在单位球内）
    this.position = this.normalize(this.position);
    
    // 衰减吸引子
    this.decayAttractors();
  }
  
  /**
   * 被输入吸引
   * 
   * 创建一个新的吸引子
   */
  async attractTo(input: string, strength: number = 0.8): Promise<void> {
    try {
      const config = new Config();
      const embedding = new EmbeddingClient(config, {});
      const inputVector = await embedding.embedText(input);
      
      if (inputVector && inputVector.length === this.dimension) {
        // 创建吸引子
        this.attractors.push({
          vector: inputVector,
          strength: strength,
          type: 'input',
          created: Date.now(),
          decay: 0.1, // 每次演化衰减10%
        });
        
        this.lastThought = input;
      }
    } catch {
      // 如果获取向量失败，创建一个随机吸引子
      this.attractors.push({
        vector: this.randomVector(0.5),
        strength: strength * 0.3,
        type: 'input',
        created: Date.now(),
        decay: 0.2,
      });
    }
  }
  
  /**
   * 被记忆吸引
   * 
   * 记忆会成为弱吸引子
   */
  attractToMemory(memoryVector: number[], importance: number = 0.5): void {
    this.attractors.push({
      vector: memoryVector,
      strength: this.params.memoryGravity * importance,
      type: 'memory',
      created: Date.now(),
      decay: 0.05, // 记忆吸引子衰减慢
    });
  }
  
  /**
   * 被好奇心驱动
   * 
   * 好奇心会产生一个"探索性"的吸引子
   */
  attractToCuriosity(curiosityVector: number[]): void {
    this.attractors.push({
      vector: curiosityVector,
      strength: 0.3,
      type: 'curiosity',
      created: Date.now(),
      decay: 0.15,
    });
  }
  
  /**
   * 获取当前位置
   */
  getPosition(): number[] {
    return [...this.position];
  }
  
  /**
   * 获取速度
   */
  getVelocity(): number[] {
    return [...this.velocity];
  }
  
  /**
   * 获取轨迹
   */
  getTrail(): Array<{
    position: number[];
    timestamp: number;
  }> {
    return this.trail.map(t => ({
      position: t.position,
      timestamp: t.timestamp,
    }));
  }
  
  /**
   * 获取当前思维状态描述
   */
  getThinkingState(): {
    stability: number;      // 稳定性 [0,1]
    directionality: number; // 方向性 [0,1]
    exploration: number;    // 探索程度 [0,1]
    focus: string;          // 当前聚焦
  } {
    const speed = this.magnitude(this.velocity);
    const attractorStrength = this.attractors.reduce((sum, a) => sum + a.strength, 0);
    
    return {
      stability: 1 - speed * 10, // 速度越快越不稳定
      directionality: Math.min(1, attractorStrength), // 吸引子越多方向越明确
      exploration: this.params.randomness * 50, // 随机性代表探索
      focus: this.lastThought.slice(0, 30) || '游离中...',
    };
  }
  
  /**
   * 计算吸引力的合力
   */
  private calculateAttraction(): number[] {
    if (this.attractors.length === 0) {
      return this.zeroVector();
    }
    
    let totalForce = this.zeroVector();
    
    for (const attractor of this.attractors) {
      // 指向吸引子的方向
      const direction = this.subtractVectors(attractor.vector, this.position);
      const dist = this.magnitude(direction);
      
      if (dist > 0.001) {
        // 距离越远，吸引力越弱（平方反比）
        const forceMagnitude = attractor.strength * this.params.attraction / (dist * dist + 0.1);
        const force = this.scaleVector(direction, forceMagnitude / dist);
        totalForce = this.addVectors(totalForce, force);
      }
    }
    
    return totalForce;
  }
  
  /**
   * 计算情绪对思维的影响
   */
  private calculateEmotionInfluence(): number[] {
    const emotion = this.selfState.emotion;
    
    // 情绪强度影响思维的"温度"
    const temperature = emotion.intensity * 0.01;
    
    const influence = this.randomVector(temperature);
    
    // 负面情绪增加一些"下沉"的随机扰动
    if (emotion.dominant === 'concern' || emotion.dominant === 'sadness') {
      for (let i = 0; i < this.dimension; i++) {
        influence[i] -= Math.random() * temperature * 0.5;
      }
    }
    
    return influence;
  }
  
  /**
   * 衰减吸引子
   */
  private decayAttractors(): void {
    this.attractors = this.attractors
      .map(a => ({
        ...a,
        strength: a.strength * (1 - a.decay),
      }))
      .filter(a => a.strength > 0.01); // 移除太弱的
  }
  
  /**
   * 记录轨迹
   */
  private recordTrail(): void {
    this.trail.push({
      position: [...this.position],
      velocity: [...this.velocity],
      timestamp: Date.now(),
    });
    
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }
  
  // ==================== 向量运算 ====================
  
  private zeroVector(): number[] {
    return new Array(this.dimension).fill(0);
  }
  
  private randomVector(scale: number): number[] {
    return new Array(this.dimension)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 2 * scale);
  }
  
  private addVectors(...vectors: number[][]): number[] {
    const result = this.zeroVector();
    for (const v of vectors) {
      for (let i = 0; i < this.dimension; i++) {
        result[i] += v[i] || 0;
      }
    }
    return result;
  }
  
  private subtractVectors(a: number[], b: number[]): number[] {
    return a.map((val, i) => val - (b[i] || 0));
  }
  
  private scaleVector(v: number[], scale: number): number[] {
    return v.map(val => val * scale);
  }
  
  private magnitude(v: number[]): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  }
  
  private normalize(v: number[]): number[] {
    const mag = this.magnitude(v);
    if (mag < 0.0001) return v;
    return v.map(val => val / mag);
  }
}

// 单例
let consciousnessInstance: ConsciousnessSpace | null = null;

export function getConsciousness(): ConsciousnessSpace {
  if (!consciousnessInstance) {
    consciousnessInstance = new ConsciousnessSpace();
  }
  return consciousnessInstance;
}

// 导出重置函数（用于测试）
export function resetConsciousness(): void {
  consciousnessInstance = null;
}
