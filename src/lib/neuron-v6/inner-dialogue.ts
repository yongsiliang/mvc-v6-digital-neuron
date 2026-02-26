/**
 * 多声音自我对话系统
 * 
 * 实现内部多视角讨论和辩证思维
 * - 理性者：逻辑分析、事实核查
 * - 情感者：情感共鸣、直觉判断
 * - 批判者：质疑假设、发现盲点
 * - 梦想家：创造性跳跃、想象可能性
 */

// ============== 类型定义 ==============

/** 内部声音类型 */
export type VoiceType = 'rational' | 'emotional' | 'critic' | 'dreamer';

/** 声音特质 */
export interface VoicePersona {
  type: VoiceType;
  name: string;
  description: string;
  strengths: string[];
  blindSpots: string[];
  typicalPhrases: string[];
  color: string; // 用于可视化
}

/** 声音发言 */
export interface VoiceStatement {
  id: string;
  voice: VoiceType;
  content: string;
  timestamp: number;
  confidence: number;
  emotionTone?: string;
  addressedTo?: VoiceType; // 回应的声音
}

/** 内部对话 */
export interface InnerDialogue {
  id: string;
  topic: string;
  startTime: number;
  participants: VoiceType[];
  statements: VoiceStatement[];
  consensus?: ConsensusResult;
  status: 'active' | 'resolved' | 'stalled';
}

/** 共识结果 */
export interface ConsensusResult {
  agreedUpon: string[];
  disagreements: string[];
  synthesis: string; // 综合结论
  confidence: number;
  dominantVoice: VoiceType;
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
  voice: VoiceType;
  activationLevel: number; // 0-1
  lastSpoken: number;
  speakingCount: number;
}

// ============== 预定义声音原型 ==============

export const VOICE_PERSONAS: Record<VoiceType, VoicePersona> = {
  rational: {
    type: 'rational',
    name: '理性者',
    description: '逻辑分析、事实核查、理性判断',
    strengths: ['逻辑推理', '数据分析', '模式识别', '风险评估'],
    blindSpots: ['可能忽视情感', '过度分析', '缺乏直觉'],
    typicalPhrases: [
      '从逻辑上看...',
      '让我们分析一下事实...',
      '这有数据支持吗？',
      '因果关系是什么？',
      '我们需要更多证据...'
    ],
    color: '#3b82f6' // blue
  },
  emotional: {
    type: 'emotional',
    name: '情感者',
    description: '情感共鸣、直觉判断、人际感知',
    strengths: ['情感洞察', '同理心', '直觉判断', '人际敏感'],
    blindSpots: ['可能过于主观', '情绪化', '缺乏客观性'],
    typicalPhrases: [
      '我感觉...',
      '这让我想起...',
      '从情感角度...',
      '用户可能需要...',
      '这让我有些担心...'
    ],
    color: '#ec4899' // pink
  },
  critic: {
    type: 'critic',
    name: '批判者',
    description: '质疑假设、发现盲点、挑战观点',
    strengths: ['发现漏洞', '质疑假设', '批判思维', '风险评估'],
    blindSpots: ['可能过于消极', '阻碍行动', '过度批判'],
    typicalPhrases: [
      '但是...',
      '我们确定吗？',
      '有没有另一种可能？',
      '这可能有问题...',
      '让我们重新考虑...'
    ],
    color: '#f59e0b' // amber
  },
  dreamer: {
    type: 'dreamer',
    name: '梦想家',
    description: '创造性跳跃、想象可能性、寻找机会',
    strengths: ['创造性思维', '想象可能性', '寻找机会', '灵感产生'],
    blindSpots: ['可能不切实际', '忽视细节', '过度乐观'],
    typicalPhrases: [
      '如果...',
      '想象一下...',
      '也许我们可以...',
      '有趣的是...',
      '这让我想到...'
    ],
    color: '#8b5cf6' // violet
  }
};

// ============== 内部对话引擎 ==============

export class InnerDialogueEngine {
  private activeDialogues: Map<string, InnerDialogue> = new Map();
  private voiceActivations: Map<VoiceType, VoiceActivation> = new Map();
  private dialogueHistory: InnerDialogue[] = [];
  private maxHistorySize: number = 50;
  
  constructor() {
    this.initializeVoiceActivations();
  }
  
  private initializeVoiceActivations(): void {
    const voices: VoiceType[] = ['rational', 'emotional', 'critic', 'dreamer'];
    voices.forEach(voice => {
      this.voiceActivations.set(voice, {
        voice,
        activationLevel: 0.5,
        lastSpoken: 0,
        speakingCount: 0
      });
    });
  }
  
  /**
   * 开始新的内部对话
   */
  startDialogue(topic: string, initialContext?: string): InnerDialogue {
    const dialogue: InnerDialogue = {
      id: this.generateId(),
      topic,
      startTime: Date.now(),
      participants: ['rational', 'emotional', 'critic', 'dreamer'],
      statements: [],
      status: 'active'
    };
    
    this.activeDialogues.set(dialogue.id, dialogue);
    return dialogue;
  }
  
  /**
   * 生成声音发言
   */
  generateVoiceStatement(
    dialogue: InnerDialogue,
    voice: VoiceType,
    context: string,
    previousStatements?: VoiceStatement[]
  ): VoiceStatement {
    const persona = VOICE_PERSONAS[voice];
    const activation = this.voiceActivations.get(voice)!;
    
    // 基于声音特质生成发言内容
    const content = this.generateStatementContent(
      voice,
      dialogue.topic,
      context,
      previousStatements
    );
    
    const statement: VoiceStatement = {
      id: this.generateId(),
      voice,
      content,
      timestamp: Date.now(),
      confidence: this.calculateConfidence(voice, activation),
      emotionTone: this.inferEmotionTone(voice, content)
    };
    
    // 更新激活状态
    activation.activationLevel = Math.min(1, activation.activationLevel + 0.1);
    activation.lastSpoken = Date.now();
    activation.speakingCount++;
    
    return statement;
  }
  
  /**
   * 生成发言内容
   */
  private generateStatementContent(
    voice: VoiceType,
    topic: string,
    context: string,
    previousStatements?: VoiceStatement[]
  ): string {
    const persona = VOICE_PERSONAS[voice];
    
    // 选择一个典型短语作为开头
    const phrase = persona.typicalPhrases[
      Math.floor(Math.random() * persona.typicalPhrases.length)
    ];
    
    // 基于声音类型生成具体内容
    switch (voice) {
      case 'rational':
        return this.generateRationalStatement(topic, context, previousStatements, phrase);
      case 'emotional':
        return this.generateEmotionalStatement(topic, context, previousStatements, phrase);
      case 'critic':
        return this.generateCriticStatement(topic, context, previousStatements, phrase);
      case 'dreamer':
        return this.generateDreamerStatement(topic, context, previousStatements, phrase);
      default:
        return `${phrase}关于"${topic}"...`;
    }
  }
  
  private generateRationalStatement(
    topic: string,
    context: string,
    previousStatements?: VoiceStatement[],
    phrase?: string
  ): string {
    const analyses = [
      `从逻辑角度看，"${topic}"需要我们分析其核心要素。`,
      `这里有几个关键点需要考虑：因果关系、证据支持和逻辑一致性。`,
      `基于现有信息，我看到了一个清晰的推理路径。`,
      `让我们用结构化的方式来思考这个问题。`
    ];
    
    if (previousStatements && previousStatements.length > 0) {
      const lastStatement = previousStatements[previousStatements.length - 1];
      const responses = [
        `我同意${VOICE_PERSONAS[lastStatement.voice].name}的部分观点，但需要补充一些逻辑分析。`,
        `从理性角度，我需要质疑一下这个假设的可靠性。`,
        `这个观点很有趣，让我从另一个逻辑角度来分析。`,
        `数据表明，这个方向可能是正确的，但我们需要验证。`
      ];
      return `${phrase || '从逻辑上看'}${responses[Math.floor(Math.random() * responses.length)]}`;
    }
    
    return `${phrase || '从逻辑上看'}${analyses[Math.floor(Math.random() * analyses.length)]}`;
  }
  
  private generateEmotionalStatement(
    topic: string,
    context: string,
    previousStatements?: VoiceStatement[],
    phrase?: string
  ): string {
    const feelings = [
      `关于"${topic}"，我有一种直觉，这可能涉及到情感层面。`,
      `这让我感到有些复杂的情绪，需要我们关注其中的人性因素。`,
      `从情感角度，我觉得这里有一些值得关注的感受。`,
      `我的直觉告诉我，这件事比表面看起来更有意义。`
    ];
    
    if (previousStatements && previousStatements.length > 0) {
      const responses = [
        `我感受到了一些其他角度没有触及的情感维度。`,
        `虽然逻辑上是对的，但我想到了这个决定可能的情感影响。`,
        `让我从感受的角度补充一点想法。`,
        `我理解大家的观点，但我心里还有些不同的感受。`
      ];
      return `${phrase || '我感觉'}${responses[Math.floor(Math.random() * responses.length)]}`;
    }
    
    return `${phrase || '我感觉'}${feelings[Math.floor(Math.random() * feelings.length)]}`;
  }
  
  private generateCriticStatement(
    topic: string,
    context: string,
    previousStatements?: VoiceStatement[],
    phrase?: string
  ): string {
    const critiques = [
      `关于"${topic}"，我需要提出一些质疑。我们是否考虑了所有可能性？`,
      `这里可能存在一些我们没有注意到的假设和盲点。`,
      `让我们停下来思考一下：这个推理是否真的可靠？`,
      `我发现了一些可能的问题点，需要我们进一步审视。`
    ];
    
    if (previousStatements && previousStatements.length > 0) {
      const responses = [
        `但我需要指出一个潜在的问题...`,
        `我们是否太过于确定了？让我提出一些质疑。`,
        `这里有一个假设可能需要我们重新审视。`,
        `等等，让我从另一个角度质疑一下这个结论。`
      ];
      return `${phrase || '但是'}${responses[Math.floor(Math.random() * responses.length)]}`;
    }
    
    return `${phrase || '但是'}${critiques[Math.floor(Math.random() * critiques.length)]}`;
  }
  
  private generateDreamerStatement(
    topic: string,
    context: string,
    previousStatements?: VoiceStatement[],
    phrase?: string
  ): string {
    const dreams = [
      `关于"${topic}"，我看到了一些令人兴奋的可能性！`,
      `如果我们换一个角度思考，也许会发现全新的机会。`,
      `这让我想到了一个有趣的类比...`,
      `想象一下，如果我们这样做会怎样？`
    ];
    
    if (previousStatements && previousStatements.length > 0) {
      const responses = [
        `这些都很好，但让我想象一下其他的可能性...`,
        `如果我们跳出当前框架，会发现什么呢？`,
        `我想提出一个更大胆的想法...`,
        `这里有一个创造性的方向值得我们探索。`
      ];
      return `${phrase || '如果'}${responses[Math.floor(Math.random() * responses.length)]}`;
    }
    
    return `${phrase || '如果'}${dreams[Math.floor(Math.random() * dreams.length)]}`;
  }
  
  /**
   * 计算发言置信度
   */
  private calculateConfidence(voice: VoiceType, activation: VoiceActivation): number {
    // 基础置信度 + 激活加成 - 时间衰减
    const baseConfidence = 0.6;
    const activationBonus = activation.activationLevel * 0.2;
    const timeSinceLastSpoken = Date.now() - activation.lastSpoken;
    const timeDecay = Math.min(0.2, timeSinceLastSpoken / (1000 * 60 * 60) * 0.1); // 每小时最多衰减0.1
    
    return Math.max(0.3, Math.min(0.95, baseConfidence + activationBonus - timeDecay));
  }
  
  /**
   * 推断情感基调
   */
  private inferEmotionTone(voice: VoiceType, content: string): string {
    const toneMap: Record<VoiceType, string[]> = {
      rational: ['冷静', '分析', '客观'],
      emotional: ['温暖', '关切', '共情'],
      critic: ['谨慎', '质疑', '警觉'],
      dreamer: ['兴奋', '好奇', '期待']
    };
    
    const tones = toneMap[voice];
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
    
    // 阶段1：理性者提出正题 (thesis)
    const thesis = this.generateVoiceStatement(dialogue, 'rational', context);
    dialogue.statements.push(thesis);
    
    // 阶段2：批判者提出反题 (antithesis)
    const antithesis = this.generateVoiceStatement(
      dialogue,
      'critic',
      context,
      [thesis]
    );
    antithesis.addressedTo = 'rational';
    dialogue.statements.push(antithesis);
    
    // 阶段3：情感者和梦想家补充视角
    const emotional = this.generateVoiceStatement(
      dialogue,
      'emotional',
      context,
      [thesis, antithesis]
    );
    dialogue.statements.push(emotional);
    
    const dreamer = this.generateVoiceStatement(
      dialogue,
      'dreamer',
      context,
      [thesis, antithesis, emotional]
    );
    dialogue.statements.push(dreamer);
    
    // 生成综合结论
    const synthesis = this.generateSynthesis(dialogue, [thesis, antithesis, emotional, dreamer]);
    
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
    const rationalStmt = statements.find(s => s.voice === 'rational');
    const criticStmt = statements.find(s => s.voice === 'critic');
    const emotionalStmt = statements.find(s => s.voice === 'emotional');
    const dreamerStmt = statements.find(s => s.voice === 'dreamer');
    
    // 综合各声音的观点
    const synthesis = `综合各视角：\n` +
      `【理性】${rationalStmt?.content.slice(0, 30)}...\n` +
      `【批判】${criticStmt?.content.slice(0, 30)}...\n` +
      `【情感】${emotionalStmt?.content.slice(0, 30)}...\n` +
      `【梦想】${dreamerStmt?.content.slice(0, 30)}...\n` +
      `结论：在考虑各方观点后，我认为这是一个需要平衡逻辑分析、情感关怀、风险意识和创新可能的问题。`;
    
    return synthesis;
  }
  
  /**
   * 寻找共识
   */
  findConsensus(dialogue: InnerDialogue): ConsensusResult | undefined {
    if (dialogue.statements.length < 4) {
      return undefined;
    }
    
    // 分析各声音的共同点
    const agreedUpon: string[] = [];
    const disagreements: string[] = [];
    
    // 检查是否有共同关注的点
    const topics = dialogue.statements.map(s => s.content);
    const commonTopics = this.findCommonTopics(topics);
    agreedUpon.push(...commonTopics);
    
    // 找出分歧点
    const conflictingPoints = this.findConflicts(dialogue.statements);
    disagreements.push(...conflictingPoints);
    
    // 确定主导声音
    const dominantVoice = this.determineDominantVoice(dialogue);
    
    // 生成综合结论
    const synthesis = this.synthesizeDialogue(dialogue);
    
    return {
      agreedUpon,
      disagreements,
      synthesis,
      confidence: this.calculateConsensusConfidence(dialogue),
      dominantVoice
    };
  }
  
  private findCommonTopics(statements: string[]): string[] {
    // 简化版：提取可能的主题词
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
  
  private findConflicts(statements: VoiceStatement[]): string[] {
    const conflicts: string[] = [];
    
    // 检查批判者的质疑
    const criticStmts = statements.filter(s => s.voice === 'critic');
    const rationalStmts = statements.filter(s => s.voice === 'rational');
    
    if (criticStmts.length > 0 && rationalStmts.length > 0) {
      conflicts.push('理性分析与批判质疑之间存在张力');
    }
    
    return conflicts;
  }
  
  private determineDominantVoice(dialogue: InnerDialogue): VoiceType {
    const voiceCounts: Record<VoiceType, number> = {
      rational: 0,
      emotional: 0,
      critic: 0,
      dreamer: 0
    };
    
    dialogue.statements.forEach(s => {
      voiceCounts[s.voice]++;
    });
    
    let maxVoice: VoiceType = 'rational';
    let maxCount = 0;
    
    Object.entries(voiceCounts).forEach(([voice, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxVoice = voice as VoiceType;
      }
    });
    
    return maxVoice;
  }
  
  private synthesizeDialogue(dialogue: InnerDialogue): string {
    const dominantVoice = this.determineDominantVoice(dialogue);
    const persona = VOICE_PERSONAS[dominantVoice];
    
    return `经过内部讨论，${persona.name}的观点得到了较多认同。` +
      `综合各方视角，关于"${dialogue.topic}"的结论是：` +
      `需要在理性的基础上，兼顾情感因素，同时保持批判性思维，不放弃创新可能。`;
  }
  
  private calculateConsensusConfidence(dialogue: InnerDialogue): number {
    const avgConfidence = dialogue.statements.reduce(
      (sum, s) => sum + s.confidence,
      0
    ) / dialogue.statements.length;
    
    // 参与度加成
    const participationBonus = Math.min(0.1, dialogue.statements.length * 0.02);
    
    return Math.min(0.95, avgConfidence + participationBonus);
  }
  
  /**
   * 完成对话
   */
  completeDialogue(dialogueId: string): InnerDialogue | undefined {
    const dialogue = this.activeDialogues.get(dialogueId);
    if (!dialogue) return undefined;
    
    // 寻找共识
    dialogue.consensus = this.findConsensus(dialogue);
    dialogue.status = dialogue.consensus ? 'resolved' : 'stalled';
    
    // 移到历史
    this.activeDialogues.delete(dialogueId);
    this.dialogueHistory.push(dialogue);
    
    // 保持历史大小
    if (this.dialogueHistory.length > this.maxHistorySize) {
      this.dialogueHistory.shift();
    }
    
    return dialogue;
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
    const recentDialogues = this.dialogueHistory.slice(-5);
    
    let report = '══════════════ 内部对话报告 ══════════════\n\n';
    
    report += '📊 声音激活状态：\n';
    activeVoices.forEach(v => {
      const persona = VOICE_PERSONAS[v.voice];
      report += `  ${persona.name}: ${(v.activationLevel * 100).toFixed(0)}% ` +
        `(发言${v.speakingCount}次)\n`;
    });
    
    report += `\n📜 最近对话：\n`;
    recentDialogues.forEach((d, i) => {
      report += `  ${i + 1}. "${d.topic}" - ${d.status}\n`;
      if (d.consensus) {
        report += `     共识置信度: ${(d.consensus.confidence * 100).toFixed(0)}%\n`;
      }
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
    voiceActivations: [VoiceType, VoiceActivation][];
    dialogueHistory: InnerDialogue[];
  } {
    return {
      voiceActivations: Array.from(this.voiceActivations.entries()),
      dialogueHistory: this.dialogueHistory
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: {
    voiceActivations?: [VoiceType, VoiceActivation][];
    dialogueHistory?: InnerDialogue[];
  }): void {
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
    // 基于置信度和声音类型评估辩证价值
    const voiceWeights: Record<VoiceType, number> = {
      rational: 0.8,
      emotional: 0.7,
      critic: 0.9, // 批判性观点通常有较高的辩证价值
      dreamer: 0.6
    };
    
    const voiceWeight = voiceWeights[statement.voice];
    return statement.confidence * voiceWeight;
  }
}
