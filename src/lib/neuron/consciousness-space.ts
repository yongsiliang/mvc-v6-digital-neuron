/**
 * 意识空间 - 漂移动力学
 * 
 * 核心思想：
 * - 意识是一个向量，在高维空间中漂移
 * - 有惯性：思考有连续性，不会突然跳跃
 * - 有吸引：被重要的输入、记忆拉扯
 * - 有阻尼：逐渐回归稳定，不会发散
 * - 有随机：思维的游离和灵感
 * 
 * 这不是随机游走，是"有生命的漂移"
 */

import { EmbeddingClient, Config } from 'coze-coding-dev-sdk';

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
    inertia: 0.7,       // 较强的惯性，思考有连续性
    attraction: 0.15,   // 温和的吸引
    damping: 0.05,      // 轻微阻尼
    randomness: 0.02,   // 少量随机
    memoryGravity: 0.1, // 记忆引力
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
  
  /** 上次思考的内容（用于连贯性） */
  private lastThought: string = '';
  
  /** 情绪状态 [valence, arousal] */
  private emotionState: [number, number] = [0.5, 0.3];
  
  constructor(dimension: number = 1024) {
    this.dimension = dimension;
    // 初始位置：原点附近
    this.position = this.randomVector(0.1);
    // 初始速度：随机方向，小速度
    this.velocity = this.randomVector(0.01);
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
   * 设置情绪状态
   */
  setEmotion(valence: number, arousal: number): void {
    this.emotionState = [
      Math.max(0, Math.min(1, valence)),
      Math.max(0, Math.min(1, arousal)),
    ];
    
    // 情绪会影响参数
    // 高兴奋时，随机性增加，惯性降低
    if (arousal > 0.6) {
      this.params.randomness = 0.04;
      this.params.inertia = 0.5;
    } else {
      this.params.randomness = 0.02;
      this.params.inertia = 0.7;
    }
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
    const [valence, arousal] = this.emotionState;
    
    // 情绪会影响思维的"温度"
    // 高唤醒时，思维更活跃
    const temperature = arousal * 0.01;
    
    // 效价会影响方向（正向情绪倾向于正向思维方向）
    // 这里用一个简化的假设：正向情绪倾向于"向上"
    const influence = this.randomVector(temperature);
    
    // 效价影响符号
    if (valence < 0.3) {
      // 负面情绪，增加一些"下沉"的随机扰动
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
