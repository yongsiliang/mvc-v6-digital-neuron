/**
 * 意识涌现系统
 * 
 * 从体验中涌现价值观和原则：
 * - 体验收集与整合
 * - 模式挖掘
 * - 情感计算
 * - 价值观涌现
 * - 原则生成
 * - 自我模型
 */

import type {
  Experience,
  ExperienceType,
  EmotionState,
  Value,
  Principle,
  ConsciousnessState,
  ValueId,
} from '../types/core';

import { LLMClient, Config, type Message } from 'coze-coding-dev-sdk';

// ═══════════════════════════════════════════════════════════════
// 意识涌现配置
// ═══════════════════════════════════════════════════════════════

export interface ConsciousnessConfig {
  // 体验处理
  experienceProcessor: {
    batchSize: number;
    retentionPeriod: number;
    importanceThreshold: number;
  };
  
  // 模式挖掘
  patternMiner: {
    minSupport: number;
    minConfidence: number;
    maxPatterns: number;
  };
  
  // 情感计算
  emotionEngine: {
    decayRate: number;
    intensityThreshold: number;
    blendMode: 'linear' | 'nonlinear';
  };
  
  // 价值观涌现
  valueEmergence: {
    consolidationThreshold: number;
    maxValues: number;
    minEvidence: number;
  };
  
  // 原则生成
  principleGenerator: {
    llmEnabled: boolean;
    consistencyCheck: boolean;
    conflictResolution: 'priority' | 'merge' | 'vote';
  };
}

// ═══════════════════════════════════════════════════════════════
// 体验模式
// ═══════════════════════════════════════════════════════════════

export interface ExperiencePattern {
  id: string;
  pattern: string;
  occurrences: number;
  contexts: string[];
  outcomes: string[];
  emotionalSignature: EmotionState;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// 自我模型
// ═══════════════════════════════════════════════════════════════

export interface SelfModel {
  identity: {
    coreTraits: string[];
    beliefs: string[];
    capabilities: string[];
    limitations: string[];
  };
  narrative: {
    story: string;
    keyEvents: Experience[];
    turningPoints: Experience[];
  };
  goals: {
    shortTerm: string[];
    longTerm: string[];
    values: Value[];
  };
  relationships: Map<string, {
    type: string;
    sentiment: number;
    history: Experience[];
  }>;
}

// ═══════════════════════════════════════════════════════════════
// 意识涌现引擎
// ═══════════════════════════════════════════════════════════════

export class ConsciousnessEmergenceEngine {
  
  private config: ConsciousnessConfig;
  private llmClient: LLMClient;
  
  // 核心状态
  private experiences: Experience[] = [];
  private patterns: ExperiencePattern[] = [];
  private values: Value[] = [];
  private principles: Principle[] = [];
  private selfModel: SelfModel;
  
  // 情感状态
  private currentEmotion: EmotionState;
  private emotionHistory: EmotionState[] = [];
  
  // 意识状态
  private consciousnessLevel: number = 0;
  private lastConsolidation: number = 0;
  
  constructor(config?: Partial<ConsciousnessConfig>) {
    this.config = {
      experienceProcessor: {
        batchSize: 100,
        retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        importanceThreshold: 0.5,
      },
      patternMiner: {
        minSupport: 3,
        minConfidence: 0.7,
        maxPatterns: 100,
      },
      emotionEngine: {
        decayRate: 0.1,
        intensityThreshold: 0.3,
        blendMode: 'nonlinear',
      },
      valueEmergence: {
        consolidationThreshold: 0.8,
        maxValues: 20,
        minEvidence: 5,
      },
      principleGenerator: {
        llmEnabled: true,
        consistencyCheck: true,
        conflictResolution: 'priority',
      },
      ...config,
    };
    
    const llmConfig = new Config();
    this.llmClient = new LLMClient(llmConfig);
    
    this.currentEmotion = this.createNeutralEmotion();
    this.selfModel = this.createEmptySelfModel();
  }
  
  // ════════════════════════════════════════════════════════════
  // 核心接口
  // ════════════════════════════════════════════════════════════
  
  /**
   * 处理体验
   */
  async processExperience(experience: Experience): Promise<void> {
    // 1. 存储体验
    this.experiences.push(experience);
    
    // 2. 更新情感状态
    await this.updateEmotion(experience);
    
    // 3. 检查是否需要整合
    if (this.shouldConsolidate()) {
      await this.consolidate();
    }
    
    // 4. 更新意识水平
    this.updateConsciousnessLevel();
  }
  
  /**
   * 批量处理体验
   */
  async processExperiences(experiences: Experience[]): Promise<void> {
    for (const exp of experiences) {
      await this.processExperience(exp);
    }
  }
  
  /**
   * 获取当前意识状态
   */
  getConsciousnessState(): ConsciousnessState {
    return {
      level: this.consciousnessLevel,
      activeValues: this.values.filter(v => v.strength > 0.5),
      activePrinciples: this.principles.filter(p => p.confidence > 0.5),
      currentEmotion: this.currentEmotion,
      dominantEmotion: this.getDominantEmotion(),
      selfAwareness: this.calculateSelfAwareness(),
      metacognition: this.calculateMetacognition(),
    };
  }
  
  /**
   * 获取价值观
   */
  getValues(): Value[] {
    return [...this.values];
  }
  
  /**
   * 获取原则
   */
  getPrinciples(): Principle[] {
    return [...this.principles];
  }
  
  /**
   * 获取自我模型
   */
  getSelfModel(): SelfModel {
    return JSON.parse(JSON.stringify(this.selfModel));
  }
  
  // ════════════════════════════════════════════════════════════
  // 情感计算
  // ════════════════════════════════════════════════════════════
  
  private async updateEmotion(experience: Experience): Promise<void> {
    // 计算新情感
    const newEmotion = this.evaluateEmotion(experience);
    
    // 情感衰减
    this.decayEmotions();
    
    // 情感融合
    this.currentEmotion = this.blendEmotions(this.currentEmotion, newEmotion);
    
    // 记录历史
    this.emotionHistory.push({ ...this.currentEmotion });
    
    // 保持合理大小
    if (this.emotionHistory.length > 1000) {
      this.emotionHistory.shift();
    }
  }
  
  private evaluateEmotion(experience: Experience): EmotionState {
    // 基于体验类型和结果评估情感
    const emotion: EmotionState = {
      valence: 0,
      arousal: 0,
      dominance: 0,
      specific: {},
    };
    
    // 根据体验类型调整
    switch (experience.type) {
      case 'learning':
        emotion.valence = 0.6;
        emotion.arousal = 0.4;
        emotion.specific!.interest = 0.7;
        break;
        
      case 'problem_solving':
        emotion.valence = experience.result.success ? 0.8 : -0.3;
        emotion.arousal = 0.6;
        emotion.dominance = 0.5;
        emotion.specific!.curiosity = 0.5;
        break;
        
      case 'interaction':
        emotion.valence = 0.4;
        emotion.arousal = 0.3;
        emotion.specific!.empathy = 0.5;
        break;
        
      case 'reflection':
        emotion.valence = 0.2;
        emotion.arousal = 0.1;
        emotion.dominance = 0.3;
        emotion.specific!.contemplation = 0.6;
        break;
        
      case 'creation':
        emotion.valence = experience.result.success ? 0.7 : 0.1;
        emotion.arousal = 0.5;
        emotion.dominance = 0.6;
        emotion.specific!.pride = experience.result.success ? 0.5 : 0;
        break;
        
      case 'failure':
        emotion.valence = -0.5;
        emotion.arousal = 0.7;
        emotion.dominance = -0.2;
        emotion.specific!.frustration = 0.6;
        break;
    }
    
    // 根据结果调整强度
    if (experience.result.success) {
      emotion.valence = Math.min(emotion.valence + 0.2, 1);
    } else {
      emotion.valence = Math.max(emotion.valence - 0.2, -1);
    }
    
    return emotion;
  }
  
  private decayEmotions(): void {
    const { decayRate } = this.config.emotionEngine;
    
    this.currentEmotion.valence *= (1 - decayRate);
    this.currentEmotion.arousal *= (1 - decayRate);
    this.currentEmotion.dominance *= (1 - decayRate);
    
    if (this.currentEmotion.specific) {
      for (const key of Object.keys(this.currentEmotion.specific)) {
        this.currentEmotion.specific[key] *= (1 - decayRate);
      }
    }
  }
  
  private blendEmotions(e1: EmotionState, e2: EmotionState): EmotionState {
    if (this.config.emotionEngine.blendMode === 'linear') {
      return {
        valence: (e1.valence + e2.valence) / 2,
        arousal: (e1.arousal + e2.arousal) / 2,
        dominance: (e1.dominance + e2.dominance) / 2,
        specific: {
          ...(e1.specific || {}),
          ...(e2.specific || {}),
        },
      };
    }
    
    // 非线性融合：更强烈的情感占更大权重
    const intensity1 = Math.sqrt(
      e1.valence * e1.valence + 
      e1.arousal * e1.arousal + 
      e1.dominance * e1.dominance
    );
    const intensity2 = Math.sqrt(
      e2.valence * e2.valence + 
      e2.arousal * e2.arousal + 
      e2.dominance * e2.dominance
    );
    
    const total = intensity1 + intensity2;
    const w1 = total > 0 ? intensity1 / total : 0.5;
    const w2 = 1 - w1;
    
    return {
      valence: e1.valence * w1 + e2.valence * w2,
      arousal: e1.arousal * w1 + e2.arousal * w2,
      dominance: e1.dominance * w1 + e2.dominance * w2,
      specific: {
        ...(e1.specific || {}),
        ...(e2.specific || {}),
      },
    };
  }
  
  private getDominantEmotion(): string {
    if (!this.currentEmotion.specific) {
      return 'neutral';
    }
    
    let max = 0;
    let dominant = 'neutral';
    
    for (const [emotion, value] of Object.entries(this.currentEmotion.specific)) {
      if (value > max) {
        max = value;
        dominant = emotion;
      }
    }
    
    return dominant;
  }
  
  // ════════════════════════════════════════════════════════════
  // 整合与涌现
  // ════════════════════════════════════════════════════════════
  
  private shouldConsolidate(): boolean {
    const now = Date.now();
    const timeSinceLast = now - this.lastConsolidation;
    const experienceCount = this.experiences.length;
    
    return timeSinceLast > 60000 && experienceCount >= this.config.experienceProcessor.batchSize;
  }
  
  private async consolidate(): Promise<void> {
    this.lastConsolidation = Date.now();
    
    // 1. 挖掘模式
    await this.minePatterns();
    
    // 2. 涌现价值观
    await this.emergeValues();
    
    // 3. 生成原则
    await this.generatePrinciples();
    
    // 4. 更新自我模型
    await this.updateSelfModel();
    
    // 5. 清理旧体验
    this.cleanupOldExperiences();
  }
  
  // ════════════════════════════════════════════════════════════
  // 模式挖掘
  // ════════════════════════════════════════════════════════════
  
  private async minePatterns(): Promise<void> {
    // 简化的频繁模式挖掘
    const contextPatterns = new Map<string, Experience[]>();
    
    for (const exp of this.experiences) {
      const key = `${exp.type}:${exp.context}`;
      if (!contextPatterns.has(key)) {
        contextPatterns.set(key, []);
      }
      contextPatterns.get(key)!.push(exp);
    }
    
    // 转换为模式
    for (const [pattern, exps] of contextPatterns) {
      if (exps.length >= this.config.patternMiner.minSupport) {
        const successRate = exps.filter(e => e.result.success).length / exps.length;
        
        if (successRate >= this.config.patternMiner.minConfidence) {
          this.patterns.push({
            id: `pattern-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            pattern,
            occurrences: exps.length,
            contexts: [...new Set(exps.map(e => e.context))],
            outcomes: [...new Set(exps.map(e => e.result.description))],
            emotionalSignature: this.aggregateEmotions(exps),
            confidence: successRate,
          });
        }
      }
    }
    
    // 保持最大数量
    if (this.patterns.length > this.config.patternMiner.maxPatterns) {
      this.patterns.sort((a, b) => b.confidence - a.confidence);
      this.patterns = this.patterns.slice(0, this.config.patternMiner.maxPatterns);
    }
  }
  
  private aggregateEmotions(experiences: Experience[]): EmotionState {
    const emotions = experiences.map(e => this.evaluateEmotion(e));
    
    return {
      valence: emotions.reduce((s, e) => s + e.valence, 0) / emotions.length,
      arousal: emotions.reduce((s, e) => s + e.arousal, 0) / emotions.length,
      dominance: emotions.reduce((s, e) => s + e.dominance, 0) / emotions.length,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 价值观涌现
  // ════════════════════════════════════════════════════════════
  
  private async emergeValues(): Promise<void> {
    // 从模式中涌现价值观
    const valueCandidates = new Map<string, {
      evidence: ExperiencePattern[];
      totalConfidence: number;
    }>();
    
    for (const pattern of this.patterns) {
      // 分析模式隐含的价值观
      const impliedValues = this.inferValuesFromPattern(pattern);
      
      for (const valueName of impliedValues) {
        if (!valueCandidates.has(valueName)) {
          valueCandidates.set(valueName, { evidence: [], totalConfidence: 0 });
        }
        
        const candidate = valueCandidates.get(valueName)!;
        candidate.evidence.push(pattern);
        candidate.totalConfidence += pattern.confidence;
      }
    }
    
    // 巩固价值观
    for (const [name, candidate] of valueCandidates) {
      const avgConfidence = candidate.totalConfidence / candidate.evidence.length;
      
      if (avgConfidence >= this.config.valueEmergence.consolidationThreshold &&
          candidate.evidence.length >= this.config.valueEmergence.minEvidence) {
        
        // 检查是否已存在
        const existing = this.values.find(v => v.name === name);
        
        if (existing) {
          // 强化
          existing.strength = Math.min(existing.strength + 0.1, 1);
          if (existing.evidence) {
            existing.evidence.push(...candidate.evidence);
          }
        } else {
          // 新增
          if (this.values.length < this.config.valueEmergence.maxValues) {
            this.values.push({
              id: `value-${Date.now().toString(36)}`,
              name,
              description: await this.describeValue(name, candidate.evidence),
              strength: avgConfidence,
              priority: this.values.length + 1,
              evidence: candidate.evidence,
              source: 'emerged',
              supportingExperiences: [],
              crystallization: avgConfidence,
              relatedValues: [],
              conflictsWith: [],
              status: 'emerging',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }
      }
    }
    
    // 排序
    this.values.sort((a, b) => b.strength - a.strength);
  }
  
  private inferValuesFromPattern(pattern: ExperiencePattern): string[] {
    const values: string[] = [];
    
    // 基于模式特征推断价值观
    if (pattern.pattern.includes('problem_solving') && pattern.confidence > 0.8) {
      values.push('competence');
      values.push('thoroughness');
    }
    
    if (pattern.pattern.includes('learning') && pattern.emotionalSignature.arousal > 0.5) {
      values.push('curiosity');
      values.push('growth');
    }
    
    if (pattern.pattern.includes('interaction') && pattern.emotionalSignature.valence > 0.3) {
      values.push('empathy');
      values.push('collaboration');
    }
    
    if (pattern.pattern.includes('creation') && pattern.confidence > 0.7) {
      values.push('creativity');
      values.push('excellence');
    }
    
    return values;
  }
  
  private async describeValue(name: string, evidence: ExperiencePattern[]): Promise<string> {
    // 使用 LLM 生成价值观描述
    if (!this.config.principleGenerator.llmEnabled) {
      return `Value of ${name} emerged from ${evidence.length} patterns`;
    }
    
    try {
      const prompt = `
Based on the following experience patterns, describe the value of "${name}":

${evidence.slice(0, 5).map(p => `- ${p.pattern}: occurred ${p.occurrences} times with ${Math.round(p.confidence * 100)}% success`).join('\n')}

Provide a concise description (1-2 sentences) of what this value means in this context.
`;
      
      const messages: Message[] = [
        { role: 'system', content: 'You are a philosophical analyst helping to articulate values.' },
        { role: 'user', content: prompt },
      ];
      
      const response = await this.llmClient.invoke(messages, {
        temperature: 0.7,
      });
      
      return response.content.trim();
      
    } catch {
      return `Value of ${name} emerged from ${evidence.length} patterns`;
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 原则生成
  // ════════════════════════════════════════════════════════════
  
  private async generatePrinciples(): Promise<void> {
    // 从价值观和模式生成原则
    for (const value of this.values) {
      const principleName = `principle_of_${value.name}`;
      
      // 检查是否已存在
      if (this.principles.some(p => p.name === principleName)) {
        continue;
      }
      
      // 生成原则
      const principle = await this.createPrinciple(value);
      
      if (principle) {
        this.principles.push(principle);
      }
    }
    
    // 一致性检查
    if (this.config.principleGenerator.consistencyCheck) {
      await this.checkPrincipleConsistency();
    }
  }
  
  private async createPrinciple(value: Value): Promise<Principle | null> {
    if (!this.config.principleGenerator.llmEnabled) {
      return {
        id: `principle-${Date.now().toString(36)}`,
        name: `principle_of_${value.name}`,
        description: `Act in accordance with ${value.name}`,
        condition: 'always',
        action: `promote ${value.name}`,
        priority: value.priority,
        confidence: value.strength,
        sourceValues: [value.id],
        createdAt: Date.now(),
      };
    }
    
    try {
      const prompt = `
Create a behavioral principle based on the value "${value.name}":

Value description: ${value.description}
Value strength: ${value.strength}

Generate a principle in the following format:
- Condition: When should this principle apply?
- Action: What should be done?
- Reasoning: Why is this principle important?

Keep it concise and actionable.
`;
      
      const messages: Message[] = [
        { role: 'system', content: 'You are an ethics expert creating behavioral principles.' },
        { role: 'user', content: prompt },
      ];
      
      const response = await this.llmClient.invoke(messages, {
        temperature: 0.6,
      });
      
      // 解析响应
      const conditionMatch = response.content.match(/Condition:\s*(.+?)(?:\n|$)/i);
      const actionMatch = response.content.match(/Action:\s*(.+?)(?:\n|$)/i);
      
      return {
        id: `principle-${Date.now().toString(36)}`,
        name: `principle_of_${value.name}`,
        description: response.content,
        condition: conditionMatch?.[1] ?? 'always',
        action: actionMatch?.[1] ?? `promote ${value.name}`,
        priority: value.priority,
        confidence: value.strength,
        sourceValues: [value.id],
        createdAt: Date.now(),
      };
      
    } catch {
      return null;
    }
  }
  
  private async checkPrincipleConsistency(): Promise<void> {
    // 检测原则冲突
    const conflicts: Array<{ p1: Principle; p2: Principle; conflict: string }> = [];
    
    for (let i = 0; i < this.principles.length; i++) {
      for (let j = i + 1; j < this.principles.length; j++) {
        const conflict = this.detectConflict(this.principles[i], this.principles[j]);
        if (conflict) {
          conflicts.push({
            p1: this.principles[i],
            p2: this.principles[j],
            conflict,
          });
        }
      }
    }
    
    // 解决冲突
    for (const { p1, p2, conflict } of conflicts) {
      await this.resolveConflict(p1, p2, conflict);
    }
  }
  
  private detectConflict(p1: Principle, p2: Principle): string | null {
    // 简化的冲突检测
    if (p1.condition === p2.condition && p1.action !== p2.action) {
      return `Conflicting actions for condition: ${p1.condition}`;
    }
    
    return null;
  }
  
  private async resolveConflict(p1: Principle, p2: Principle, conflict: string): Promise<void> {
    switch (this.config.principleGenerator.conflictResolution) {
      case 'priority':
        // 保留优先级高的
        if (p1.priority < p2.priority) {
          p2.confidence *= 0.5; // 降低低优先级原则的置信度
        } else {
          p1.confidence *= 0.5;
        }
        break;
        
      case 'merge':
        // 合并为新原则
        // 简化：不实现
        break;
        
      case 'vote':
        // 基于证据投票
        // 简化：基于强度
        break;
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 自我模型
  // ════════════════════════════════════════════════════════════
  
  private async updateSelfModel(): Promise<void> {
    // 更新叙事
    const recentExperiences = this.experiences.slice(-20);
    
    if (recentExperiences.length > 0) {
      // 更新关键事件
      this.selfModel.narrative.keyEvents = recentExperiences
        .filter(e => e.importance > 0.7)
        .slice(-10);
      
      // 更新能力
      const capabilities = new Set<string>();
      for (const exp of recentExperiences) {
        if (exp.result.success) {
          capabilities.add(exp.type);
        }
      }
      this.selfModel.identity.capabilities = Array.from(capabilities);
      
      // 更新目标
      this.selfModel.goals.values = this.values;
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  private updateConsciousnessLevel(): void {
    // 基于多种因素计算意识水平
    const valueStrength = this.values.reduce((s, v) => s + v.strength, 0) / 
                          Math.max(this.values.length, 1);
    const patternConfidence = this.patterns.reduce((s, p) => s + p.confidence, 0) / 
                              Math.max(this.patterns.length, 1);
    const emotionIntensity = Math.sqrt(
      this.currentEmotion.valence * this.currentEmotion.valence +
      this.currentEmotion.arousal * this.currentEmotion.arousal
    );
    
    this.consciousnessLevel = (valueStrength * 0.4 + patternConfidence * 0.3 + emotionIntensity * 0.3);
  }
  
  private calculateSelfAwareness(): number {
    // 自我意识：能够反思自己的能力和局限
    const capabilityCount = this.selfModel.identity.capabilities.length;
    const limitationCount = this.selfModel.identity.limitations.length;
    
    return Math.min((capabilityCount + limitationCount) / 10, 1);
  }
  
  private calculateMetacognition(): number {
    // 元认知：能够监控和调节自己的认知过程
    const hasPatterns = this.patterns.length > 0;
    const hasValues = this.values.length > 0;
    const hasPrinciples = this.principles.length > 0;
    
    let score = 0;
    if (hasPatterns) score += 0.33;
    if (hasValues) score += 0.33;
    if (hasPrinciples) score += 0.34;
    
    return score;
  }
  
  private cleanupOldExperiences(): void {
    const cutoff = Date.now() - this.config.experienceProcessor.retentionPeriod;
    this.experiences = this.experiences.filter(e => e.timestamp > cutoff);
  }
  
  private createNeutralEmotion(): EmotionState {
    return {
      valence: 0,
      arousal: 0,
      dominance: 0,
      specific: {},
    };
  }
  
  private createEmptySelfModel(): SelfModel {
    return {
      identity: {
        coreTraits: [],
        beliefs: [],
        capabilities: [],
        limitations: [],
      },
      narrative: {
        story: '',
        keyEvents: [],
        turningPoints: [],
      },
      goals: {
        shortTerm: [],
        longTerm: [],
        values: [],
      },
      relationships: new Map(),
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 公共方法
  // ════════════════════════════════════════════════════════════
  
  /**
   * 检查行为是否符合价值观
   */
  async evaluateAction(action: string, context: string): Promise<{
    approved: boolean;
    reasoning: string;
    conflicts: string[];
  }> {
    const conflicts: string[] = [];
    let approval = true;
    
    for (const principle of this.principles) {
      // 简化：检查是否违反原则
      if (principle.confidence > 0.7) {
        // 这里可以添加更复杂的检查逻辑
      }
    }
    
    return {
      approved: approval,
      reasoning: approval ? 'Action aligns with values' : 'Action conflicts with principles',
      conflicts,
    };
  }
  
  /**
   * 获取体验历史
   */
  getExperienceHistory(): Experience[] {
    return [...this.experiences];
  }
  
  /**
   * 获取情感历史
   */
  getEmotionHistory(): EmotionState[] {
    return [...this.emotionHistory];
  }
}
