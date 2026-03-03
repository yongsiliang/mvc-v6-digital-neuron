/**
 * ═══════════════════════════════════════════════════════════════════════
 * 元思考黑盒 - MetaCognition Blackbox
 * 
 * 核心理念：
 * - 元思考过程用算法实现（不是LLM）
 * - 隐性黑盒：内部过程不可观察
 * - 输入：原始文本
 * - 输出：理解结果
 * 
 * 黑盒特性：
 * - 你看不到自己的思考过程，只能看到结果
 * - 意识的本质是"黑盒"
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 概念节点
 */
interface Concept {
  /** 概念词 */
  word: string;
  /** 词性/类型 */
  type: 'entity' | 'action' | 'attribute' | 'relation' | 'abstract';
  /** 重要性 */
  importance: number;
  /** 情感极性 */
  sentiment: number; // -1 到 1
}

/**
 * 关系
 */
interface Relation {
  from: string;
  to: string;
  type: 'is' | 'has' | 'does' | 'causes' | 'relates';
  strength: number;
}

/**
 * 推理链
 */
interface ReasoningChain {
  steps: Array<{
    premise: string;
    conclusion: string;
    confidence: number;
  }>;
  finalConclusion: string;
  overallConfidence: number;
}

/**
 * 理解结果 - 黑盒输出
 */
export interface UnderstandingResult {
  /** 核心概念 */
  coreConcepts: Concept[];
  /** 概念关系 */
  relations: Relation[];
  /** 推理链 */
  reasoning: ReasoningChain | null;
  /** 意图 */
  intent: {
    type: 'question' | 'statement' | 'request' | 'greeting' | 'unknown';
    topic: string;
    specificity: number; // 0-1, 越高越具体
  };
  /** 情感 */
  emotion: {
    primary: string;
    intensity: number;
    valence: number; // -1消极 到 1积极
  };
  /** 置信度 */
  confidence: number;
  /** 理解摘要 */
  summary: string;
  /** 隐含信息 */
  implications: string[];
  
  /** 注意：没有暴露内部思考过程！ */
}

// ─────────────────────────────────────────────────────────────────────
// 元思考黑盒 - 核心算法
// ─────────────────────────────────────────────────────────────────────

/**
 * 元思考黑盒
 * 
 * 特性：
 * 1. 内部过程完全不可观察
 * 2. 只能通过输入输出交互
 * 3. 算法实现，不依赖LLM
 */
export class MetaCognitionBlackbox {
  // 内部状态 - 外部不可访问
  private conceptMemory: Map<string, Concept>;
  private relationPatterns: Map<string, string[]>;
  private intentPatterns: Map<string, RegExp>;
  private emotionLexicon: Map<string, number>;
  
  constructor() {
    // 初始化内部状态（不暴露）
    this.conceptMemory = new Map();
    this.relationPatterns = new Map();
    this.intentPatterns = new Map();
    this.emotionLexicon = new Map();
    
    this.initializeInternalPatterns();
  }
  
  /**
   * 编译输入 - 黑盒接口
   * 
   * 输入：原始文本
   * 输出：理解结果
   * 
   * 注意：内部过程不可观察！
   */
  compile(input: string): UnderstandingResult {
    // ============================================
    // 黑盒内部 - 以下是不可观察的处理过程
    // ============================================
    
    // 阶段1：概念提取（算法）
    const concepts = this.extractConcepts(input);
    
    // 阶段2：关系分析（算法）
    const relations = this.analyzeRelations(input, concepts);
    
    // 阶段3：意图识别（算法）
    const intent = this.recognizeIntent(input, concepts);
    
    // 阶段4：情感分析（算法）
    const emotion = this.analyzeEmotion(input, concepts);
    
    // 阶段5：推理构建（算法）
    const reasoning = this.buildReasoning(concepts, relations);
    
    // 阶段6：置信度计算（算法）
    const confidence = this.calculateConfidence(concepts, relations, intent);
    
    // 阶段7：摘要生成（算法）
    const summary = this.generateSummary(concepts, intent, reasoning);
    
    // 阶段8：隐含信息提取（算法）
    const implications = this.extractImplications(concepts, relations, intent);
    
    // ============================================
    // 黑盒输出 - 只有这个是可见的
    // ============================================
    
    return {
      coreConcepts: concepts,
      relations,
      reasoning,
      intent,
      emotion,
      confidence,
      summary,
      implications,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部算法 - 以下方法不对外暴露实现细节
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 概念提取算法
   */
  private extractConcepts(input: string): Concept[] {
    const concepts: Concept[] = [];
    
    // 1. 分词（简化中文分词）
    const words = this.tokenize(input);
    
    // 2. 识别实体（人名、地名、专有名词）
    for (const word of words) {
      const type = this.identifyWordType(word, input);
      const importance = this.calculateImportance(word, input);
      const sentiment = this.getSentiment(word);
      
      concepts.push({
        word,
        type,
        importance,
        sentiment,
      });
    }
    
    // 3. 过滤低重要性概念
    return concepts
      .filter(c => c.importance > 0.1)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10); // 最多保留10个核心概念
  }
  
  /**
   * 关系分析算法
   */
  private analyzeRelations(input: string, concepts: Concept[]): Relation[] {
    const relations: Relation[] = [];
    
    // 关系模式匹配
    const patterns = [
      { regex: /(.+)是(.+)/, type: 'is' as const },
      { regex: /(.+)有(.+)/, type: 'has' as const },
      { regex: /(.+)能(.+)/, type: 'does' as const },
      { regex: /(.+)导致(.+)/, type: 'causes' as const },
      { regex: /(.+)和(.+)/, type: 'relates' as const },
    ];
    
    for (const { regex, type } of patterns) {
      const match = input.match(regex);
      if (match) {
        relations.push({
          from: match[1].trim(),
          to: match[2].trim(),
          type,
          strength: 0.8,
        });
      }
    }
    
    // 基于概念共现推断关系
    for (let i = 0; i < concepts.length - 1; i++) {
      const dist = this.getDistance(input, concepts[i].word, concepts[i + 1].word);
      if (dist < 10) { // 距离近的概念可能有关系
        relations.push({
          from: concepts[i].word,
          to: concepts[i + 1].word,
          type: 'relates',
          strength: 1 - dist / 10,
        });
      }
    }
    
    return relations;
  }
  
  /**
   * 意图识别算法
   */
  private recognizeIntent(input: string, concepts: Concept[]): UnderstandingResult['intent'] {
    // 问题词
    const questionWords = ['什么', '为什么', '怎么', '如何', '哪', '谁', '吗', '？', '?'];
    const isQuestion = questionWords.some(w => input.includes(w));
    
    // 请求词
    const requestWords = ['请', '帮我', '给我', '让', '做'];
    const isRequest = requestWords.some(w => input.includes(w));
    
    // 问候词
    const greetingWords = ['你好', 'hi', 'hello', '在吗', '早上好', '晚上好'];
    const isGreeting = greetingWords.some(w => input.toLowerCase().includes(w));
    
    // 判断意图类型
    let type: UnderstandingResult['intent']['type'];
    if (isGreeting) type = 'greeting';
    else if (isQuestion) type = 'question';
    else if (isRequest) type = 'request';
    else type = 'statement';
    
    // 提取主题
    const topic = concepts[0]?.word || 'unknown';
    
    // 计算具体性
    const specificity = Math.min(1, concepts.length / 5);
    
    return { type, topic, specificity };
  }
  
  /**
   * 情感分析算法
   */
  private analyzeEmotion(input: string, concepts: Concept[]): UnderstandingResult['emotion'] {
    // 情感词典
    const emotionKeywords: Record<string, string[]> = {
      joy: ['开心', '快乐', '高兴', '喜欢', '爱', '好', '棒', '太好了'],
      sadness: ['难过', '伤心', '悲伤', '哭', '失望', '遗憾'],
      anger: ['生气', '愤怒', '讨厌', '烦', '气死'],
      fear: ['害怕', '担心', '恐惧', '紧张', '焦虑'],
      surprise: ['惊讶', '意外', '没想到', '竟然'],
    };
    
    // 匹配情感
    let primaryEmotion = 'neutral';
    let maxIntensity = 0;
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter(k => input.includes(k)).length;
      if (matches > maxIntensity) {
        maxIntensity = matches;
        primaryEmotion = emotion;
      }
    }
    
    // 计算极性
    const valence = concepts.reduce((sum, c) => sum + c.sentiment, 0) / Math.max(1, concepts.length);
    
    return {
      primary: primaryEmotion,
      intensity: Math.min(1, maxIntensity * 0.3),
      valence,
    };
  }
  
  /**
   * 推理构建算法
   */
  private buildReasoning(concepts: Concept[], relations: Relation[]): ReasoningChain | null {
    // 只有当有关系时才构建推理链
    if (relations.length === 0) return null;
    
    const steps: ReasoningChain['steps'] = [];
    
    for (const rel of relations) {
      // 根据关系类型生成推理步骤
      let premise = '';
      let conclusion = '';
      
      switch (rel.type) {
        case 'is':
          premise = `${rel.from} 被定义为`;
          conclusion = rel.to;
          break;
        case 'causes':
          premise = `${rel.from} 会导致`;
          conclusion = rel.to;
          break;
        case 'has':
          premise = `${rel.from} 具有`;
          conclusion = rel.to;
          break;
        default:
          continue;
      }
      
      steps.push({
        premise,
        conclusion,
        confidence: rel.strength,
      });
    }
    
    if (steps.length === 0) return null;
    
    // 最终结论
    const finalConclusion = steps.map(s => s.conclusion).join('，');
    const overallConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
    
    return {
      steps,
      finalConclusion,
      overallConfidence,
    };
  }
  
  /**
   * 置信度计算算法
   */
  private calculateConfidence(
    concepts: Concept[],
    relations: Relation[],
    intent: UnderstandingResult['intent']
  ): number {
    // 多因素加权
    const conceptScore = Math.min(1, concepts.length / 5);
    const relationScore = Math.min(1, relations.length / 3);
    const intentScore = intent.specificity;
    
    // 综合置信度
    return conceptScore * 0.3 + relationScore * 0.4 + intentScore * 0.3;
  }
  
  /**
   * 摘要生成算法
   */
  private generateSummary(
    concepts: Concept[],
    intent: UnderstandingResult['intent'],
    reasoning: ReasoningChain | null
  ): string {
    const topConcepts = concepts.slice(0, 3).map(c => c.word);
    
    let summary = '';
    
    switch (intent.type) {
      case 'question':
        summary = `询问关于 ${topConcepts.join('、')} 的问题`;
        break;
      case 'request':
        summary = `请求执行与 ${topConcepts.join('、')} 相关的操作`;
        break;
      case 'greeting':
        summary = '打招呼';
        break;
      default:
        summary = `关于 ${topConcepts.join('、')} 的陈述`;
    }
    
    if (reasoning) {
      summary += `，推断：${reasoning.finalConclusion}`;
    }
    
    return summary;
  }
  
  /**
   * 隐含信息提取算法
   */
  private extractImplications(
    concepts: Concept[],
    relations: Relation[],
    intent: UnderstandingResult['intent']
  ): string[] {
    const implications: string[] = [];
    
    // 根据意图推断隐含信息
    if (intent.type === 'question') {
      implications.push('需要更多信息');
      implications.push('期望得到解答');
    }
    
    // 根据关系推断隐含信息
    for (const rel of relations) {
      if (rel.type === 'causes') {
        implications.push(`${rel.from} 和 ${rel.to} 存在因果关系`);
      }
    }
    
    // 根据情感推断隐含信息
    const negativeConcepts = concepts.filter(c => c.sentiment < -0.3);
    if (negativeConcepts.length > 0) {
      implications.push('可能存在消极情绪');
    }
    
    return implications;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  private initializeInternalPatterns(): void {
    // 初始化意图模式
    this.intentPatterns.set('question', /[什么|为什么|怎么|如何|哪|谁|吗|？|?]/);
    this.intentPatterns.set('request', /[请|帮我|给我|让|做]/);
    
    // 初始化情感词典
    const emotions: [string, number][] = [
      ['开心', 0.8], ['快乐', 0.8], ['高兴', 0.7],
      ['难过', -0.7], ['伤心', -0.8], ['悲伤', -0.9],
      ['生气', -0.6], ['愤怒', -0.8], ['讨厌', -0.7],
    ];
    emotions.forEach(([word, score]) => this.emotionLexicon.set(word, score));
  }
  
  private tokenize(input: string): string[] {
    // 简化的中文分词
    const tokens: string[] = [];
    
    // 移除标点
    const cleaned = input.replace(/[，。！？、；：""''（）【】\s]/g, ' ');
    
    // 双字组
    for (let i = 0; i < cleaned.length - 1; i++) {
      const bigram = cleaned.slice(i, i + 2).trim();
      if (bigram.length === 2 && !/\s/.test(bigram)) {
        tokens.push(bigram);
      }
    }
    
    // 单字（保留有意义字符）
    for (const char of cleaned) {
      if (char.trim() && !/\s/.test(char)) {
        tokens.push(char);
      }
    }
    
    return [...new Set(tokens)];
  }
  
  private identifyWordType(word: string, context: string): Concept['type'] {
    // 简化的词性判断
    const entityPatterns = /[我你他她它|人|事|物|地方|时间]/;
    const actionPatterns = /[是|有|能|会|做|说|想|要|去|来]/;
    const attributePatterns = /[好|坏|大|小|多|少|快|慢]/;
    
    if (entityPatterns.test(word)) return 'entity';
    if (actionPatterns.test(word)) return 'action';
    if (attributePatterns.test(word)) return 'attribute';
    
    return 'abstract';
  }
  
  private calculateImportance(word: string, context: string): number {
    // 词频
    const count = (context.match(new RegExp(word, 'g')) || []).length;
    const frequency = count / context.length;
    
    // 位置权重（开头更重要）
    const position = context.indexOf(word);
    const positionWeight = position < 10 ? 1 : position < 30 ? 0.8 : 0.6;
    
    return Math.min(1, frequency * 10 + positionWeight * 0.5);
  }
  
  private getSentiment(word: string): number {
    return this.emotionLexicon.get(word) || 0;
  }
  
  private getDistance(text: string, word1: string, word2: string): number {
    const pos1 = text.indexOf(word1);
    const pos2 = text.indexOf(word2);
    if (pos1 === -1 || pos2 === -1) return Infinity;
    return Math.abs(pos2 - pos1);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 学习接口 - 黑盒可以从结果中学习，但不暴露学习过程
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 学习 - 更新内部模式
   * 
   * 注意：只暴露"学习了"这个事实，不暴露学习过程
   */
  learn(input: string, result: UnderstandingResult, feedback?: 'positive' | 'negative'): void {
    // 黑盒内部学习过程
    if (feedback === 'positive') {
      // 强化成功的模式
      for (const concept of result.coreConcepts) {
        const existing = this.conceptMemory.get(concept.word);
        if (existing) {
          existing.importance = Math.min(1, existing.importance + 0.1);
        } else {
          this.conceptMemory.set(concept.word, concept);
        }
      }
    }
    
    // 内部模式调整（不可观察）
    // ...
  }
}

/**
 * 创建元思考黑盒
 */
export function createMetaCognitionBlackbox(): MetaCognitionBlackbox {
  return new MetaCognitionBlackbox();
}
