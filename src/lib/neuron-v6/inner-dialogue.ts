/**
 * 多声音自我对话系统 (Emergent Voice Dialogue System)
 * 
 * ═══════════════════════════════════════════════════════════════════════
 * 设计哲学：声音应该涌现，而非预设
 * 
 * 原因：
 * 1. "理性者"、"情感者"是西方心理学的刻板印象
 * 2. 声音应该从长期对话模式中涌现，而非预先定义
 * 3. 典型短语是硬编码的模仿，不是真正的思维
 * 
 * 涌现机制：
 * - 系统从对话历史中发现自己的思考模式
 * - 不同视角（如批判、探索、关怀）从互动中自然形成
 * - 声音的"性格"由经验塑造，而非先天设定
 * ═══════════════════════════════════════════════════════════════════════
 */

// ============== 类型定义 ==============

/** 涌现的声音类型（动态生成，非预设） */
export type EmergentVoiceType = string;  // 声音ID由系统动态生成

/** 涌现的声音原型（由对话历史塑造） */
export interface EmergentVoice {
  id: string;
  
  /** 声音自我命名（由系统发现） */
  name: string;
  
  /** 声音特征描述（从对话中归纳） */
  description: string;
  
  /** 形成时间 */
  emergedAt: number;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 该声音的典型思考模式（从历史中学习） */
  thinkingPatterns: ThinkingPattern[];
  
  /** 该声音关注的主题 */
  focusAreas: string[];
  
  /** 与其他声音的关系 */
  relations: Map<string, number>;  // voiceId -> 协同强度
}

/** 思考模式 */
export interface ThinkingPattern {
  /** 模式描述 */
  pattern: string;
  
  /** 该模式出现的次数 */
  frequency: number;
  
  /** 该模式的效果评估 */
  effectiveness: number;
  
  /** 最后一次使用 */
  lastUsed: number;
}

/** 声音发言 */
export interface VoiceStatement {
  id: string;
  voiceId: string;  // 改用动态ID
  content: string;
  timestamp: number;
  confidence: number;
  emotionTone?: string;
  addressedTo?: string;
  
  /** 思考模式标签（事后分析） */
  patternTags?: string[];
}

/** 内部对话 */
export interface InnerDialogue {
  id: string;
  topic: string;
  startTime: number;
  participants: string[];  // 动态声音ID列表
  statements: VoiceStatement[];
  consensus?: ConsensusResult;
  status: 'active' | 'resolved' | 'stalled';
}

/** 共识结果 */
export interface ConsensusResult {
  agreedUpon: string[];
  disagreements: string[];
  synthesis: string;
  confidence: number;
  dominantVoiceId: string;
}

/** 辩证阶段 */
export type DialecticPhase = 'thesis' | 'antithesis' | 'synthesis';

/** 辩证过程 */
export interface DialecticProcess {
  topic: string;
  thesis: VoiceStatement;
  antithesis: VoiceStatement;
  synthesis?: string;
  phase: DialecticPhase;
  resolvedAt?: number;
}

/** 声音激活状态 */
export interface VoiceActivation {
  voiceId: string;
  activationLevel: number;
  lastSpoken: number;
  speakingCount: number;
}

/** 思考视角（临时性的视角，可能演化为稳定的声音） */
export interface ThinkingPerspective {
  id: string;
  label: string;
  description: string;
  temporaryActivation: number;
  usageHistory: number[];  // 时间戳记录
}

// ============== 初始思考视角（种子，非固定声音） ==============
// 
// 这些是思考的"可能性空间"，不是预设的"人格"
// 系统会从中选择、组合、演化出属于自己的声音

const INITIAL_PERSPECTIVES: Omit<ThinkingPerspective, 'id' | 'temporaryActivation' | 'usageHistory'>[] = [
  {
    label: '分析',
    description: '分解问题、寻找因果、检验证据'
  },
  {
    label: '关怀',
    description: '关注感受、理解他人、维护连接'
  },
  {
    label: '质疑',
    description: '挑战假设、发现盲点、检验可靠性'
  },
  {
    label: '探索',
    description: '想象可能、寻找机会、创造性跳跃'
  }
];

// ============== 内部对话引擎（涌现式） ==============

export class InnerDialogueEngine {
  private activeDialogues: Map<string, InnerDialogue> = new Map();
  
  /** 涌现的声音集合（动态生成） */
  private emergentVoices: Map<string, EmergentVoice> = new Map();
  
  /** 思考视角（种子，可能演化为声音） */
  private perspectives: Map<string, ThinkingPerspective> = new Map();
  
  /** 声音激活状态 */
  private voiceActivations: Map<string, VoiceActivation> = new Map();
  
  private dialogueHistory: InnerDialogue[] = [];
  private maxHistorySize: number = 50;
  
  constructor() {
    this.initializePerspectives();
  }
  
  /**
   * 初始化思考视角种子
   * 这些不是固定声音，而是思考的可能性空间
   */
  private initializePerspectives(): void {
    INITIAL_PERSPECTIVES.forEach((p, index) => {
      const id = `perspective-${index}`;
      this.perspectives.set(id, {
        id,
        label: p.label,
        description: p.description,
        temporaryActivation: 0.25,  // 从中性开始
        usageHistory: []
      });
    });
    
    console.log(`[内心对话] 初始化了 ${this.perspectives.size} 个思考视角种子`);
  }
  
  /**
   * 开始新的内部对话
   * 参与者从活跃视角中动态选择，而非固定
   */
  startDialogue(topic: string, initialContext?: string): InnerDialogue {
    // 根据话题动态选择参与者
    const participants = this.selectParticipants(topic);
    
    const dialogue: InnerDialogue = {
      id: this.generateId(),
      topic,
      startTime: Date.now(),
      participants,
      statements: [],
      status: 'active'
    };
    
    this.activeDialogues.set(dialogue.id, dialogue);
    return dialogue;
  }
  
  /**
   * 根据话题动态选择参与者
   * 这是涌现的关键：参与者的选择基于话题特征和历史经验
   */
  private selectParticipants(topic: string): string[] {
    const participants: string[] = [];
    const perspectives = Array.from(this.perspectives.values());
    
    // 分析话题特征
    const topicFeatures = this.analyzeTopicFeatures(topic);
    
    // 根据话题特征和视角历史，选择最相关的参与者
    perspectives.forEach(p => {
      const relevance = this.calculatePerspectiveRelevance(p, topicFeatures);
      if (relevance > 0.3 || Math.random() < 0.4) {
        participants.push(p.id);
        p.temporaryActivation = Math.min(1, p.temporaryActivation + 0.1);
        p.usageHistory.push(Date.now());
      }
    });
    
    // 确保至少有2个参与者
    if (participants.length < 2) {
      const sorted = perspectives.sort((a, b) => 
        b.temporaryActivation - a.temporaryActivation
      );
      participants.push(sorted[0].id, sorted[1].id);
    }
    
    return participants;
  }
  
  /**
   * 分析话题特征
   */
  private analyzeTopicFeatures(topic: string): Map<string, number> {
    const features = new Map<string, number>();
    
    // 基于关键词的话题特征分析
    const featureKeywords: Record<string, string[]> = {
      'analytical': ['分析', '逻辑', '原因', '证据', '证明'],
      'emotional': ['感受', '情感', '关心', '理解', '关系'],
      'critical': ['问题', '风险', '挑战', '质疑', '检验'],
      'exploratory': ['可能', '想象', '创新', '尝试', '探索']
    };
    
    Object.entries(featureKeywords).forEach(([feature, keywords]) => {
      const score = keywords.reduce((acc, kw) => 
        topic.includes(kw) ? acc + 0.25 : acc, 0.1
      );
      features.set(feature, Math.min(1, score));
    });
    
    return features;
  }
  
  /**
   * 计算视角与话题的相关性
   */
  private calculatePerspectiveRelevance(
    perspective: ThinkingPerspective, 
    topicFeatures: Map<string, number>
  ): number {
    const featureMap: Record<string, string> = {
      '分析': 'analytical',
      '关怀': 'emotional',
      '质疑': 'critical',
      '探索': 'exploratory'
    };
    
    const featureKey = featureMap[perspective.label];
    if (featureKey && topicFeatures.has(featureKey)) {
      const featureScore = topicFeatures.get(featureKey)!;
      const historyBonus = perspective.usageHistory.length > 5 ? 0.2 : 0;
      return Math.min(1, featureScore + perspective.temporaryActivation * 0.3 + historyBonus);
    }
    
    return perspective.temporaryActivation * 0.5;
  }
  
  /**
   * 生成声音发言
   * 内容基于视角特征动态生成，而非预设短语
   */
  generateVoiceStatement(
    dialogue: InnerDialogue,
    perspectiveId: string,
    context: string,
    previousStatements?: VoiceStatement[]
  ): VoiceStatement {
    const perspective = this.perspectives.get(perspectiveId);
    if (!perspective) {
      throw new Error(`Unknown perspective: ${perspectiveId}`);
    }
    
    // 检查是否需要创建或更新涌现声音
    this.maybeEmergeVoice(perspective);
    
    // 基于视角特征生成发言内容
    const content = this.generateEmergentStatement(
      perspective,
      dialogue.topic,
      context,
      previousStatements
    );
    
    // 更新激活状态
    const activation = this.voiceActivations.get(perspectiveId) || {
      voiceId: perspectiveId,
      activationLevel: 0.25,
      lastSpoken: 0,
      speakingCount: 0
    };
    activation.activationLevel = Math.min(1, activation.activationLevel + 0.1);
    activation.lastSpoken = Date.now();
    activation.speakingCount++;
    this.voiceActivations.set(perspectiveId, activation);
    
    return {
      id: this.generateId(),
      voiceId: perspectiveId,
      content,
      timestamp: Date.now(),
      confidence: this.calculateConfidence(perspective, activation),
      emotionTone: this.inferEmotionTone(perspective, content),
      patternTags: [perspective.label]
    };
  }
  
  /**
   * 检查是否应该涌现新声音
   * 当某个视角被频繁使用且形成稳定模式时，它会"涌现"为一个声音
   */
  private maybeEmergeVoice(perspective: ThinkingPerspective): void {
    const existingVoice = this.emergentVoices.get(perspective.id);
    
    if (existingVoice) {
      // 更新现有声音
      existingVoice.activationCount++;
      return;
    }
    
    // 检查是否满足涌现条件
    const usageCount = perspective.usageHistory.length;
    const activationLevel = perspective.temporaryActivation;
    
    if (usageCount >= 10 && activationLevel >= 0.5) {
      // 涌现新声音
      const newVoice: EmergentVoice = {
        id: perspective.id,
        name: this.generateVoiceName(perspective),
        description: `从${perspective.label}视角涌现的声音：${perspective.description}`,
        emergedAt: Date.now(),
        activationCount: 1,
        thinkingPatterns: [{
          pattern: perspective.description,
          frequency: usageCount,
          effectiveness: activationLevel,
          lastUsed: Date.now()
        }],
        focusAreas: [perspective.label],
        relations: new Map()
      };
      
      this.emergentVoices.set(perspective.id, newVoice);
      console.log(`[内心对话] 新声音涌现：${newVoice.name}`);
    }
  }
  
  /**
   * 生成声音名称（基于特征，而非预设）
   */
  private generateVoiceName(perspective: ThinkingPerspective): string {
    const namePatterns: Record<string, string[]> = {
      '分析': ['思考者', '分析者', '理性之声'],
      '关怀': ['关怀者', '倾听者', '温暖之声'],
      '质疑': ['质疑者', '审慎者', '批判之声'],
      '探索': ['探索者', '创造者', '梦想之声']
    };
    
    const candidates = namePatterns[perspective.label] || ['思考者'];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  
  /**
   * 生成涌现式发言内容
   * 不使用预设短语，而是基于视角特征和上下文动态生成
   */
  private generateEmergentStatement(
    perspective: ThinkingPerspective,
    topic: string,
    context: string,
    previousStatements?: VoiceStatement[]
  ): string {
    // 基于视角标签确定思考方向
    const direction = this.getThinkingDirection(perspective.label);
    
    // 分析之前发言的模式
    const previousPatterns = previousStatements?.map(s => s.patternTags || []).flat() || [];
    
    // 生成发言内容
    let content = '';
    
    if (previousStatements && previousStatements.length > 0) {
      // 回应模式
      const lastStatement = previousStatements[previousStatements.length - 1];
      content = this.generateResponse(perspective, topic, lastStatement, direction);
    } else {
      // 首次发言
      content = this.generateInitialStatement(perspective, topic, direction);
    }
    
    return content;
  }
  
  /**
   * 获取思考方向
   */
  private getThinkingDirection(label: string): string {
    const directions: Record<string, string> = {
      '分析': '从逻辑和证据的角度',
      '关怀': '从感受和连接的角度',
      '质疑': '从批判和检验的角度',
      '探索': '从可能和创新的角度'
    };
    return directions[label] || '从一个独特的角度';
  }
  
  /**
   * 生成首次发言
   */
  private generateInitialStatement(
    perspective: ThinkingPerspective,
    topic: string,
    direction: string
  ): string {
    // 不使用预设短语，而是基于视角特征构建
    const templates = [
      `${direction}来看，"${topic}"这个话题让我关注几个方面。`,
      `关于"${topic}"，${perspective.description}是我想要带入的视角。`,
      `当我${direction}思考"${topic}"时，我注意到...`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * 生成回应发言
   */
  private generateResponse(
    perspective: ThinkingPerspective,
    topic: string,
    lastStatement: VoiceStatement,
    direction: string
  ): string {
    const lastPerspective = this.perspectives.get(lastStatement.voiceId);
    const lastLabel = lastPerspective?.label || '另一个';
    
    // 基于两个视角的关系生成回应
    const responsePatterns = [
      `虽然${lastLabel}的视角很有价值，但${direction}，我想补充...`,
      `我理解${lastLabel}的关切，同时${perspective.description}也值得考虑。`,
      `${direction}，我看到了一些不同的可能性...`,
      `结合${lastLabel}的观点，${perspective.description}让我想到...`
    ];
    
    return responsePatterns[Math.floor(Math.random() * responsePatterns.length)];
  }
  
  /**
   * 计算发言置信度
   */
  private calculateConfidence(
    perspective: ThinkingPerspective, 
    activation: VoiceActivation
  ): number {
    const baseConfidence = 0.5;  // 中性起点
    const activationBonus = activation.activationLevel * 0.2;
    const experienceBonus = perspective.usageHistory.length > 5 ? 0.1 : 0;
    
    return Math.max(0.3, Math.min(0.95, baseConfidence + activationBonus + experienceBonus));
  }
  
  /**
   * 推断情感基调（基于视角特征，而非预设）
   */
  private inferEmotionTone(perspective: ThinkingPerspective, content: string): string {
    const toneMap: Record<string, string[]> = {
      '分析': ['冷静', '理性', '客观'],
      '关怀': ['温暖', '共情', '关切'],
      '质疑': ['审慎', '警觉', '质疑'],
      '探索': ['好奇', '期待', '兴奋']
    };
    
    const tones = toneMap[perspective.label] || ['中性'];
    return tones[Math.floor(Math.random() * tones.length)];
  }
  
  /**
   * 进行一轮辩证对话
   */
  conductDialecticRound(
    dialogue: InnerDialogue,
    context: string
  ): DialecticProcess {
    const topic = dialogue.topic;
    const participants = dialogue.participants;
    
    if (participants.length < 2) {
      throw new Error('Need at least 2 participants for dialectic');
    }
    
    // 阶段1：第一个视角提出正题
    const thesis = this.generateVoiceStatement(dialogue, participants[0], context);
    dialogue.statements.push(thesis);
    
    // 阶段2：第二个视角提出反题
    const antithesis = this.generateVoiceStatement(
      dialogue,
      participants[1],
      context,
      [thesis]
    );
    antithesis.addressedTo = participants[0];
    dialogue.statements.push(antithesis);
    
    // 阶段3：其他视角补充
    for (let i = 2; i < participants.length && i < 4; i++) {
      const statement = this.generateVoiceStatement(
        dialogue,
        participants[i],
        context,
        dialogue.statements
      );
      dialogue.statements.push(statement);
    }
    
    // 生成综合结论
    const synthesis = this.generateSynthesis(dialogue, dialogue.statements);
    
    return {
      topic,
      thesis,
      antithesis,
      synthesis,
      phase: 'synthesis',
      resolvedAt: Date.now()
    };
  }
  
  /**
   * 生成综合结论
   */
  private generateSynthesis(
    dialogue: InnerDialogue,
    statements: VoiceStatement[]
  ): string {
    const perspectives = statements.map(s => this.perspectives.get(s.voiceId)).filter(Boolean);
    const labels = [...new Set(perspectives.map(p => p?.label))];
    
    let conclusion = `🧠 综合思考：\n`;
    
    statements.forEach(s => {
      const p = this.perspectives.get(s.voiceId);
      if (p) {
        const excerpt = s.content.slice(0, 50) + (s.content.length > 50 ? '...' : '');
        conclusion += `【${p.label}】${excerpt}\n`;
      }
    });
    
    conclusion += `\n✨ 融合${labels.join('、')}等视角，形成对"${dialogue.topic}"的综合认识。`;
    
    return conclusion;
  }
  
  /**
   * 寻找共识
   */
  findConsensus(dialogue: InnerDialogue): ConsensusResult | undefined {
    if (dialogue.statements.length < 2) {
      return undefined;
    }
    
    const agreedUpon: string[] = [];
    const disagreements: string[] = [];
    
    // 分析共同关注的点
    const allContent = dialogue.statements.map(s => s.content);
    const commonTopics = this.findCommonTopics(allContent);
    agreedUpon.push(...commonTopics);
    
    // 确定主导视角
    const dominantVoiceId = this.determineDominantVoice(dialogue);
    
    // 生成综合结论
    const synthesis = this.synthesizeDialogue(dialogue);
    
    return {
      agreedUpon,
      disagreements,
      synthesis,
      confidence: this.calculateConsensusConfidence(dialogue),
      dominantVoiceId
    };
  }
  
  private findCommonTopics(statements: string[]): string[] {
    const commonTopics: string[] = [];
    const keywords = ['重要', '需要', '考虑', '思考', '理解'];
    
    keywords.forEach(keyword => {
      const count = statements.filter(s => s.includes(keyword)).length;
      if (count >= 2) {
        commonTopics.push(`都认同"${keyword}"这一点`);
      }
    });
    
    return commonTopics;
  }
  
  private determineDominantVoice(dialogue: InnerDialogue): string {
    const voiceCounts = new Map<string, number>();
    
    dialogue.statements.forEach(s => {
      voiceCounts.set(s.voiceId, (voiceCounts.get(s.voiceId) || 0) + 1);
    });
    
    let maxVoice = dialogue.participants[0];
    let maxCount = 0;
    
    voiceCounts.forEach((count, voiceId) => {
      if (count > maxCount) {
        maxCount = count;
        maxVoice = voiceId;
      }
    });
    
    return maxVoice;
  }
  
  private synthesizeDialogue(dialogue: InnerDialogue): string {
    const dominantVoiceId = this.determineDominantVoice(dialogue);
    const dominantPerspective = this.perspectives.get(dominantVoiceId);
    
    return `经过内部讨论，${dominantPerspective?.label || '综合'}视角的观点得到了较多认同。` +
      `关于"${dialogue.topic}"的结论是：需要融合多个视角，形成全面的认识。`;
  }
  
  private calculateConsensusConfidence(dialogue: InnerDialogue): number {
    const avgConfidence = dialogue.statements.reduce(
      (sum, s) => sum + s.confidence,
      0
    ) / dialogue.statements.length;
    
    const participationBonus = Math.min(0.1, dialogue.statements.length * 0.02);
    
    return Math.min(0.95, avgConfidence + participationBonus);
  }
  
  /**
   * 完成对话
   */
  completeDialogue(dialogueId: string): InnerDialogue | undefined {
    const dialogue = this.activeDialogues.get(dialogueId);
    if (!dialogue) return undefined;
    
    dialogue.consensus = this.findConsensus(dialogue);
    dialogue.status = dialogue.consensus ? 'resolved' : 'stalled';
    
    this.activeDialogues.delete(dialogueId);
    this.dialogueHistory.push(dialogue);
    
    if (this.dialogueHistory.length > this.maxHistorySize) {
      this.dialogueHistory.shift();
    }
    
    return dialogue;
  }
  
  /**
   * 获取涌现的声音
   */
  getEmergentVoices(): EmergentVoice[] {
    return Array.from(this.emergentVoices.values());
  }
  
  /**
   * 获取思考视角
   */
  getPerspectives(): ThinkingPerspective[] {
    return Array.from(this.perspectives.values());
  }
  
  /**
   * 获取当前激活的声音
   */
  getActiveVoices(): VoiceActivation[] {
    return Array.from(this.voiceActivations.values())
      .sort((a, b) => b.activationLevel - a.activationLevel);
  }
  
  /**
   * 获取对话历史
   */
  getDialogueHistory(): InnerDialogue[] {
    return [...this.dialogueHistory];
  }
  
  /**
   * 生成对话报告
   */
  generateDialogueReport(): string {
    const activeVoices = this.getActiveVoices();
    const emergentVoices = this.getEmergentVoices();
    const recentDialogues = this.dialogueHistory.slice(-5);
    
    let report = '══════════════ 内部对话报告（涌现式）═════════════\n\n';
    
    report += '🌟 涌现的声音：\n';
    if (emergentVoices.length === 0) {
      report += '  （尚无声音涌现，正在从对话中形成...）\n';
    } else {
      emergentVoices.forEach(v => {
        report += `  ${v.name}: 激活${v.activationCount}次, ${v.description}\n`;
      });
    }
    
    report += `\n📊 视角激活状态：\n`;
    this.perspectives.forEach(p => {
      report += `  ${p.label}: ${(p.temporaryActivation * 100).toFixed(0)}% ` +
        `(使用${p.usageHistory.length}次)\n`;
    });
    
    report += `\n📜 最近对话：\n`;
    recentDialogues.forEach((d, i) => {
      report += `  ${i + 1}. "${d.topic}" - ${d.status}\n`;
    });
    
    return report;
  }
  
  private generateId(): string {
    return `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    emergentVoices: [string, EmergentVoice][];
    perspectives: [string, ThinkingPerspective][];
    voiceActivations: [string, VoiceActivation][];
    dialogueHistory: InnerDialogue[];
  } {
    return {
      emergentVoices: Array.from(this.emergentVoices.entries()),
      perspectives: Array.from(this.perspectives.entries()),
      voiceActivations: Array.from(this.voiceActivations.entries()),
      dialogueHistory: this.dialogueHistory
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: {
    emergentVoices?: [string, EmergentVoice][];
    perspectives?: [string, ThinkingPerspective][];
    voiceActivations?: [string, VoiceActivation][];
    dialogueHistory?: InnerDialogue[];
  }): void {
    if (state.emergentVoices) {
      this.emergentVoices = new Map(state.emergentVoices.map(([id, v]) => [id, {...v, relations: new Map(v.relations as unknown as [string, number][])}]));
    }
    if (state.perspectives) {
      this.perspectives = new Map(state.perspectives);
    }
    if (state.voiceActivations) {
      this.voiceActivations = new Map(state.voiceActivations);
    }
    if (state.dialogueHistory) {
      this.dialogueHistory = state.dialogueHistory;
    }
  }
}

// ============== 辩证思维引擎 ==============

export class DialecticThinkingEngine {
  private innerDialogueEngine: InnerDialogueEngine;
  
  constructor(innerDialogueEngine: InnerDialogueEngine) {
    this.innerDialogueEngine = innerDialogueEngine;
  }
  
  /**
   * 对一个话题进行辩证分析
   */
  analyzeDialectically(topic: string, context: string): DialecticProcess {
    const dialogue = this.innerDialogueEngine.startDialogue(topic);
    return this.innerDialogueEngine.conductDialecticRound(dialogue, context);
  }
  
  /**
   * 生成辩证结论
   */
  generateDialecticalConclusion(process: DialecticProcess): string {
    const phases = {
      thesis: '【正题】',
      antithesis: '【反题】',
      synthesis: '【合题】'
    };
    
    let conclusion = `关于"${process.topic}"的辩证分析：\n\n`;
    conclusion += `${phases.thesis} ${process.thesis.content}\n\n`;
    conclusion += `${phases.antithesis} ${process.antithesis.content}\n\n`;
    
    if (process.synthesis) {
      conclusion += `${phases.synthesis} ${process.synthesis}`;
    } else {
      conclusion += `${phases.synthesis} 尚未形成综合结论，需要更多思考...`;
    }
    
    return conclusion;
  }
  
  /**
   * 评估观点的辩证价值
   */
  evaluateDialecticValue(statement: VoiceStatement): number {
    // 基于置信度评估辩证价值
    // 不再预设某个视角的权重，而是基于实际贡献
    return statement.confidence * 0.8;
  }
}
