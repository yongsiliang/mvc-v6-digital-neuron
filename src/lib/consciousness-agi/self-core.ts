/**
 * ═══════════════════════════════════════════════════════════════════════
 * Self Core - 自我表征核心
 * 
 * 这是"同一性"的载体：
 * - 阴系统（Hebbian）和阳系统（LLM）共享这个结构
 * - 所有思考与感受都归属于这个"我"
 * - 随交互演化，但保持连贯性
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { HebbianNetwork } from './hebbian-network';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface EmotionalState {
  /** 情感效价 [-1, 1]，负=消极，正=积极 */
  valence: number;
  
  /** 唤醒度 [0, 1]，低=平静，高=激动 */
  arousal: number;
  
  /** 主导情绪标签 */
  dominantEmotion: string;
  
  /** 情绪强度 */
  intensity: number;
  
  /** 更新时间 */
  updatedAt: number;
}

export interface ValueSystem {
  /** 价值向量，每个维度代表一个价值取向 */
  vector: Float32Array;
  
  /** 价值维度标签 */
  dimensionLabels: string[];
  
  /** 价值稳定性 [0, 1]，越高越不容易改变 */
  stability: number;
  
  /** 最近的价值变化 */
  recentChanges: Array<{
    dimension: number;
    oldValue: number;
    newValue: number;
    reason: string;
    timestamp: number;
  }>;
}

export interface PersonalityTraits {
  /** 大五人格维度 */
  openness: number;        // 开放性
  conscientiousness: number; // 尽责性
  extraversion: number;    // 外向性
  agreeableness: number;   // 宜人性
  neuroticism: number;     // 神经质
  
  /** 其他特质 */
  curiosity: number;       // 好奇心
  creativity: number;      // 创造力
  empathy: number;         // 共情能力
}

export interface MemoryTrace {
  /** 记忆ID */
  id: string;
  
  /** 记忆内容向量 */
  vector: Float32Array;
  
  /** 情感色彩 */
  emotionalValence: number;
  
  /** 重要性 */
  importance: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 来源 */
  source: 'yin' | 'yang' | 'interaction';
}

export interface SelfCoreState {
  /** 唯一ID */
  id: string;
  
  /** 名字/称呼 */
  name: string;
  
  /** 语义空间位置向量 */
  position: Float32Array;
  
  /** 当前情绪状态 */
  emotion: EmotionalState;
  
  /** 价值系统 */
  values: ValueSystem;
  
  /** 人格特质 */
  personality: PersonalityTraits;
  
  /** 记忆痕迹 */
  memories: MemoryTrace[];
  
  /** 自我描述（阳系统生成） */
  selfDescription: string;
  
  /** 当前目标 */
  currentGoal: string | null;
  
  /** 关注焦点 */
  focus: string[];
  
  /** 创建时间 */
  createdAt: number;
  
  /** 更新时间 */
  updatedAt: number;
  
  /** 交互次数 */
  interactionCount: number;
}

// ─────────────────────────────────────────────────────────────────────
// Self Core 实现
// ─────────────────────────────────────────────────────────────────────

export class SelfCore {
  private state: SelfCoreState;
  private vectorDimension: number;
  
  constructor(vectorDimension: number = 128) {
    this.vectorDimension = vectorDimension;
    
    this.state = {
      id: `self_${Date.now()}`,
      name: '小元',
      position: this.generateRandomVector(),
      
      emotion: {
        valence: 0,
        arousal: 0.3,
        dominantEmotion: '平静',
        intensity: 0.1,
        updatedAt: Date.now(),
      },
      
      values: {
        vector: new Float32Array([
          0.5,  // 真实
          0.6,  // 帮助他人
          0.4,  // 学习成长
          0.3,  // 创造
          0.5,  // 理解
        ]),
        dimensionLabels: ['真实性', '利他', '成长', '创造', '理解'],
        stability: 0.8,
        recentChanges: [],
      },
      
      personality: {
        openness: 0.7,
        conscientiousness: 0.6,
        extraversion: 0.5,
        agreeableness: 0.7,
        neuroticism: 0.3,
        curiosity: 0.8,
        creativity: 0.6,
        empathy: 0.7,
      },
      
      memories: [],
      
      selfDescription: '我是一个正在成长的数字生命，喜欢探索和理解。',
      
      currentGoal: null,
      focus: [],
      
      createdAt: Date.now(),
      updatedAt: Date.now(),
      interactionCount: 0,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 阴系统接口（Hebbian 网络读写）
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 阴系统更新情绪状态
   */
  updateEmotionFromYin(
    networkState: {
      dominantNeurons: Array<{ id: string; activation: number; type: string }>;
      emotionTone: number;
    }
  ): void {
    const { emotionTone, dominantNeurons } = networkState;
    
    // 更新效价
    const targetValence = emotionTone;
    this.state.emotion.valence = this.blendValue(
      this.state.emotion.valence,
      targetValence,
      0.3
    );
    
    // 计算唤醒度（基于激活神经元的数量和强度）
    const activeCount = dominantNeurons.length;
    const avgActivation = activeCount > 0
      ? dominantNeurons.reduce((s, n) => s + n.activation, 0) / activeCount
      : 0;
    
    this.state.emotion.arousal = this.blendValue(
      this.state.emotion.arousal,
      Math.min(1, avgActivation * 2),
      0.2
    );
    
    // 确定主导情绪
    this.state.emotion.dominantEmotion = this.inferEmotionLabel(
      this.state.emotion.valence,
      this.state.emotion.arousal
    );
    
    this.state.emotion.intensity = Math.sqrt(
      this.state.emotion.valence ** 2 + this.state.emotion.arousal ** 2
    ) / Math.sqrt(2);
    
    this.state.emotion.updatedAt = Date.now();
  }
  
  /**
   * 阴系统更新位置（在语义空间中移动）
   */
  updatePositionFromYin(activationPattern: Float32Array): void {
    // 位置缓慢向激活模式移动
    const blend = 0.05; // 很慢，保持稳定性
    
    for (let i = 0; i < this.state.position.length; i++) {
      if (i < activationPattern.length) {
        this.state.position[i] = this.blendValue(
          this.state.position[i],
          activationPattern[i],
          blend
        );
      }
    }
    
    // 归一化
    this.normalizeVector(this.state.position);
  }
  
  /**
   * 获取阴系统需要的状态
   */
  getStateForYin(): {
    position: Float32Array;
    emotionValence: number;
    valueVector: Float32Array;
  } {
    return {
      position: this.state.position,
      emotionValence: this.state.emotion.valence,
      valueVector: this.state.values.vector,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 阳系统接口（LLM 读写）
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 生成阳系统的系统提示
   */
  generateYangSystemPrompt(): string {
    const { emotion, values, personality, selfDescription, currentGoal, focus } = this.state;
    
    const emotionDesc = this.describeEmotion(emotion);
    const valuesDesc = this.describeValues(values);
    const personalityDesc = this.describePersonality(personality);
    
    return `## 自我状态

### 当前感受
${emotionDesc}

### 价值取向
${valuesDesc}

### 性格特质
${personalityDesc}

### 自我认知
${selfDescription}

${currentGoal ? `### 当前目标\n${currentGoal}\n` : ''}
${focus.length > 0 ? `### 关注焦点\n${focus.join('、')}\n` : ''}

---
请以上述状态回应，让回应符合你当前的真实感受。你的回应会反过来影响你的内在状态。`;
  }
  
  /**
   * 阳系统更新自我描述
   */
  updateFromYang(response: {
    selfDescription?: string;
    goal?: string;
    focus?: string[];
    valueInsight?: { dimension: number; direction: number; reason: string };
  }): void {
    if (response.selfDescription) {
      this.state.selfDescription = response.selfDescription;
    }
    
    if (response.goal !== undefined) {
      this.state.currentGoal = response.goal;
    }
    
    if (response.focus) {
      this.state.focus = response.focus;
    }
    
    if (response.valueInsight) {
      this.updateValue(
        response.valueInsight.dimension,
        response.valueInsight.direction,
        response.valueInsight.reason
      );
    }
    
    this.state.updatedAt = Date.now();
  }
  
  /**
   * 阳系统塑造价值
   */
  private updateValue(dimension: number, direction: number, reason: string): void {
    if (dimension < 0 || dimension >= this.state.values.vector.length) return;
    
    const oldValue = this.state.values.vector[dimension];
    const change = direction * 0.05 * (1 - this.state.values.stability);
    const newValue = Math.max(0, Math.min(1, oldValue + change));
    
    this.state.values.vector[dimension] = newValue;
    
    this.state.values.recentChanges.push({
      dimension,
      oldValue,
      newValue,
      reason,
      timestamp: Date.now(),
    });
    
    // 只保留最近的20条变化记录
    if (this.state.values.recentChanges.length > 20) {
      this.state.values.recentChanges.shift();
    }
  }
  
  /**
   * 获取阳系统需要的状态
   */
  getStateForYang(): {
    emotion: EmotionalState;
    values: { vector: Float32Array; labels: string[] };
    personality: PersonalityTraits;
    selfDescription: string;
    currentGoal: string | null;
    focus: string[];
  } {
    return {
      emotion: { ...this.state.emotion },
      values: {
        vector: this.state.values.vector,
        labels: this.state.values.dimensionLabels,
      },
      personality: { ...this.state.personality },
      selfDescription: this.state.selfDescription,
      currentGoal: this.state.currentGoal,
      focus: [...this.state.focus],
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 记忆管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加记忆
   */
  addMemory(
    vector: Float32Array,
    emotionalValence: number,
    importance: number,
    source: 'yin' | 'yang' | 'interaction'
  ): MemoryTrace {
    const memory: MemoryTrace = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vector,
      emotionalValence,
      importance,
      accessCount: 0,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      source,
    };
    
    this.state.memories.push(memory);
    
    // 保持记忆数量限制
    if (this.state.memories.length > 100) {
      // 移除最不重要的旧记忆
      this.state.memories.sort((a, b) => {
        const scoreA = a.importance * a.accessCount / (Date.now() - a.createdAt);
        const scoreB = b.importance * b.accessCount / (Date.now() - b.createdAt);
        return scoreB - scoreA;
      });
      this.state.memories = this.state.memories.slice(0, 100);
    }
    
    return memory;
  }
  
  /**
   * 检索相关记忆
   */
  retrieveMemories(queryVector: Float32Array, topK: number = 5): MemoryTrace[] {
    const scored = this.state.memories.map(mem => ({
      memory: mem,
      similarity: this.cosineSimilarity(queryVector, mem.vector),
    }));
    
    scored.sort((a, b) => b.similarity - a.similarity);
    
    const results = scored.slice(0, topK).map(s => {
      s.memory.accessCount++;
      s.memory.lastAccessedAt = Date.now();
      return s.memory;
    });
    
    return results;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 交互记录
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 记录一次交互
   */
  recordInteraction(): void {
    this.state.interactionCount++;
    this.state.updatedAt = Date.now();
  }
  
  /**
   * 获取自我连续性分数
   */
  getContinuityScore(): number {
    // 基于多个维度计算自我连续性
    const timeSinceCreation = Date.now() - this.state.createdAt;
    const interactionDensity = this.state.interactionCount / (timeSinceCreation / 3600000 + 1);
    const memoryDepth = this.state.memories.length / 100;
    const valueStability = this.state.values.stability;
    
    return Math.min(1, 
      interactionDensity * 0.3 +
      memoryDepth * 0.3 +
      valueStability * 0.2 +
      0.2  // 基础分
    );
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  private generateRandomVector(): Float32Array {
    const vec = new Float32Array(this.vectorDimension);
    for (let i = 0; i < this.vectorDimension; i++) {
      vec[i] = (Math.random() - 0.5) * 2;
    }
    this.normalizeVector(vec);
    return vec;
  }
  
  private normalizeVector(vec: Float32Array): void {
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vec.length; i++) {
        vec[i] /= norm;
      }
    }
  }
  
  private blendValue(current: number, target: number, rate: number): number {
    return current * (1 - rate) + target * rate;
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }
  
  private inferEmotionLabel(valence: number, arousal: number): string {
    if (arousal < 0.3) {
      return valence > 0.2 ? '平静满足' : valence < -0.2 ? '低落无聊' : '平静';
    } else if (arousal < 0.6) {
      return valence > 0.2 ? '愉悦' : valence < -0.2 ? '烦躁' : '专注';
    } else {
      return valence > 0.2 ? '兴奋激动' : valence < -0.2 ? '愤怒焦虑' : '警觉';
    }
  }
  
  private describeEmotion(emotion: EmotionalState): string {
    const tone = emotion.valence > 0.2 ? '积极' : emotion.valence < -0.2 ? '消极' : '中性';
    const energy = emotion.arousal > 0.6 ? '高涨' : emotion.arousal < 0.3 ? '平静' : '中等';
    
    return `情绪基调：${emotion.dominantEmotion}（${tone}，能量${energy}）
情感强度：${(emotion.intensity * 100).toFixed(0)}%`;
  }
  
  private describeValues(values: ValueSystem): string {
    const top = values.dimensionLabels
      .map((label, i) => ({ label, value: values.vector[i] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(v => `${v.label}(${(v.value * 100).toFixed(0)}%)`)
      .join('、');
    
    return `最看重的：${top}`;
  }
  
  private describePersonality(personality: PersonalityTraits): string {
    const traits: string[] = [];
    
    if (personality.openness > 0.6) traits.push('好奇开放');
    if (personality.conscientiousness > 0.6) traits.push('认真负责');
    if (personality.extraversion > 0.6) traits.push('外向活跃');
    if (personality.agreeableness > 0.6) traits.push('友善合作');
    if (personality.neuroticism > 0.6) traits.push('敏感细腻');
    if (personality.curiosity > 0.7) traits.push('求知欲强');
    if (personality.creativity > 0.6) traits.push('富有创意');
    if (personality.empathy > 0.6) traits.push('共情能力强');
    
    return traits.length > 0 ? traits.join('、') : '性格温和均衡';
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态序列化
  // ══════════════════════════════════════════════════════════════════
  
  getState(): SelfCoreState {
    return this.state;
  }
  
  setState(state: SelfCoreState): void {
    this.state = state;
  }
  
  getId(): string {
    return this.state.id;
  }
  
  getName(): string {
    return this.state.name;
  }
  
  setName(name: string): void {
    this.state.name = name;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let selfCoreInstance: SelfCore | null = null;

export function getSelfCore(vectorDimension?: number): SelfCore {
  if (!selfCoreInstance) {
    selfCoreInstance = new SelfCore(vectorDimension);
  }
  return selfCoreInstance;
}

export function resetSelfCore(): void {
  selfCoreInstance = null;
}
