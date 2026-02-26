/**
 * ═══════════════════════════════════════════════════════════════════════
 * Cognitive Loop - 认知闭环
 * 
 * V4核心架构：理解 → 决策 → 生成 → 反思 → 学习
 * 
 * 关键改进：
 * 1. 多模块协同理解（而非单一LLM）
 * 2. LLM参与反思（而非一次性生成）
 * 3. 认知闭环（可迭代改进）
 * 4. 异常检测和意图修正
 * ═══════════════════════════════════════════════════════════════════════
 */

import { getHebbianNetwork } from './hebbian-network';
import { getVSASpace } from './vsa-space';
import { getSelfCore } from './self-core';
import { HeaderUtils, LLMClient, Config } from 'coze-coding-dev-sdk';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/**
 * 语义分析结果
 */
export interface SemanticAnalysis {
  /** 分词结果 */
  tokens: Array<{
    text: string;
    pos: string;           // 词性
    normality: number;     // 正常程度 [0,1]
    role: string;          // 在句中的角色
  }>;
  
  /** 句子结构 */
  structure: {
    type: 'question' | 'statement' | 'exclamation' | 'fragment';
    subject?: string;
    predicate?: string;
    object?: string;
  };
  
  /** 检测到的异常 */
  anomalies: Array<{
    token: string;
    position: number;
    type: 'unknown_word' | 'unlikely_context' | 'grammatical_oddity';
    description: string;
    severity: number;      // 严重程度 [0,1]
    possibleCorrections: string[];
  }>;
}

/**
 * Hebbian模式匹配结果
 */
export interface PatternMatchResult {
  /** 相似的历史输入 */
  similarInputs: Array<{
    input: string;
    correctedInput?: string;
    response: string;
    similarity: number;
    wasSuccessful: boolean;
  }>;
  
  /** 检测到的模式 */
  detectedPatterns: Array<{
    pattern: string;
    description: string;
    confidence: number;
    typicalResponse?: string;
  }>;
  
  /** 异常模式 */
  anomalyPatterns: Array<{
    description: string;
    severity: number;
    possibleCauses: string[];  // 如 ["笔误", "俚语", "新词"]
  }>;
}

/**
 * 理解结果
 */
export interface UnderstandingResult {
  /** 原始输入 */
  rawInput: string;
  
  /** 修正后的输入（如果有异常） */
  correctedInput?: string;
  
  /** 修正原因 */
  correctionReason?: string;
  
  /** 推断的用户意图 */
  intent: {
    type: string;           // 如 "identity_inquiry", "knowledge_question"
    description: string;    // 自然语言描述
    target?: string;        // 意图对象
    confidence: number;
  };
  
  /** 理解置信度 */
  confidence: number;
  
  /** 推理过程 */
  reasoning: string;
  
  /** 备选理解 */
  alternatives?: Array<{
    correctedInput: string;
    intent: string;
    confidence: number;
  }>;
  
  /** 是否需要澄清 */
  needsClarification: boolean;
  
  /** 澄清问题（如果需要） */
  clarificationQuestion?: string;
}

/**
 * LLM反思结果
 */
export interface ReflectionResult {
  /** 自我评估分数 */
  scores: {
    coherence: number;      // 连贯性
    relevance: number;      // 相关性
    personality: number;    // 人格一致性
    naturalness: number;    // 自然度
    overall: number;
  };
  
  /** 发现的问题 */
  issues: Array<{
    type: 'misunderstanding' | 'tone_issue' | 'incomplete' | 'irrelevant';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  /** 是否需要重新生成 */
  needsRegeneration: boolean;
  
  /** 重新生成的原因 */
  regenerationReason?: string;
  
  /** 改进建议 */
  improvementSuggestions: string[];
  
  /** 学习点 */
  learningPoints: Array<{
    type: 'success' | 'error' | 'surprise' | 'pattern';
    description: string;
    shouldRemember: boolean;
  }>;
}

/**
 * 认知处理结果
 */
export interface CognitiveResult {
  /** 最终回复 */
  response: string;
  
  /** 理解过程 */
  understanding: UnderstandingResult;
  
  /** 反思结果 */
  reflection?: ReflectionResult;
  
  /** 是否经过修正 */
  wasCorrected: boolean;
  
  /** 迭代次数 */
  iterations: number;
  
  /** 学习摘要 */
  learningSummary: string;
}

// ═══════════════════════════════════════════════════════════════════════
// CognitiveLoop 类
// ═══════════════════════════════════════════════════════════════════════

/**
 * 认知闭环处理器
 */
export class CognitiveLoop {
  private hebbianNetwork = getHebbianNetwork();
  private vsaSpace = getVSASpace();
  private selfCore = getSelfCore();
  private llmClient: LLMClient;
  
  // 笔误模式库（可学习扩展）
  private typoPatterns = new Map<string, string[]>([
    ['他妈', ['他吗', '他么']],
    ['你妈', ['你吗', '你们']],
    ['是吗', ['什么']],
    ['什麽', ['什么']],
    ['怎么回是', ['怎么回事']],
    ['为什吗', ['为什么']],
  ]);
  
  constructor(headers?: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, headers || {});
  }
  
  /**
   * 主处理流程
   */
  async process(input: string, context?: {
    history?: Array<{ role: string; content: string }>;
    userId?: string;
  }): Promise<CognitiveResult> {
    
    // ═══════════════════════════════════════════════════════════════
    // 第一阶段：理解
    // ═══════════════════════════════════════════════════════════════
    
    let understanding = await this.understand(input);
    let iterations = 0;
    const maxIterations = 2;
    
    // 如果理解置信度低，尝试通过LLM辅助修正
    while (understanding.confidence < 0.6 && iterations < maxIterations) {
      understanding = await this.refineUnderstanding(input, understanding);
      iterations++;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 第二阶段：决策
    // ═══════════════════════════════════════════════════════════════
    
    if (understanding.needsClarification) {
      return {
        response: understanding.clarificationQuestion!,
        understanding,
        wasCorrected: !!understanding.correctedInput,
        iterations,
        learningSummary: '请求用户澄清'
      };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 第三阶段：生成
    // ═══════════════════════════════════════════════════════════════
    
    const usedInput = understanding.correctedInput || input;
    const draftResponse = await this.generate(usedInput, understanding, context);
    
    // ═══════════════════════════════════════════════════════════════
    // 第四阶段：反思
    // ═══════════════════════════════════════════════════════════════
    
    const reflection = await this.reflect(input, understanding, draftResponse);
    
    let finalResponse = draftResponse;
    let regenerated = false;
    
    // 如果反思发现问题，重新生成
    if (reflection.needsRegeneration && iterations < maxIterations) {
      finalResponse = await this.regenerate(
        input, 
        understanding, 
        draftResponse, 
        reflection
      );
      regenerated = true;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 第五阶段：学习
    // ═══════════════════════════════════════════════════════════════
    
    const learningSummary = await this.learn(input, understanding, finalResponse, reflection);
    
    return {
      response: finalResponse,
      understanding,
      reflection,
      wasCorrected: regenerated || !!understanding.correctedInput,
      iterations: iterations + (regenerated ? 1 : 0),
      learningSummary
    };
  }
  
  /**
   * 第一阶段：理解
   */
  private async understand(input: string): Promise<UnderstandingResult> {
    
    // 1. 语义分析
    const semantic = await this.analyzeSemantics(input);
    
    // 2. Hebbian模式匹配
    const patterns = await this.matchPatterns(input);
    
    // 3. 检测异常并推断修正
    let correctedInput: string | undefined;
    let correctionReason: string | undefined;
    
    if (semantic.anomalies.length > 0 || patterns.anomalyPatterns.length > 0) {
      const correction = await this.inferCorrection(input, semantic, patterns);
      correctedInput = correction.text;
      correctionReason = correction.reason;
    }
    
    // 4. 推断意图
    const intent = await this.inferIntent(correctedInput || input, patterns);
    
    // 5. 计算理解置信度
    const confidence = this.calculateUnderstandingConfidence(
      semantic, 
      patterns, 
      correctedInput !== undefined
    );
    
    // 6. 判断是否需要澄清
    const needsClarification = confidence < 0.5 && !correctedInput;
    
    return {
      rawInput: input,
      correctedInput,
      correctionReason,
      intent,
      confidence,
      reasoning: this.buildReasoning(semantic, patterns, correctedInput),
      needsClarification,
      clarificationQuestion: needsClarification 
        ? `我不太确定你的意思。你是想问"${correctedInput || this.suggestClarification(input)}"吗？`
        : undefined
    };
  }
  
  /**
   * 语义分析
   */
  private async analyzeSemantics(input: string): Promise<SemanticAnalysis> {
    // 简化的分词（实际应用中可以用更复杂的NLP）
    const tokens = this.tokenize(input);
    
    // 检测异常
    const anomalies: SemanticAnalysis['anomalies'] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // 检查是否是已知的笔误模式
      if (this.typoPatterns.has(token.text)) {
        anomalies.push({
          token: token.text,
          position: i,
          type: 'unlikely_context',
          description: `"${token.text}"在这个语境中不太常见`,
          severity: 0.7,
          possibleCorrections: this.typoPatterns.get(token.text)!
        });
      }
      
      // 检查是否在句尾出现异常词
      const sentenceEnders = ['吗', '呢', '啊', '呀', '吧'];
      if (i === tokens.length - 1 && !sentenceEnders.includes(token.text)) {
        // 检查前一个词是否已经是疑问语气
        if (i > 0 && sentenceEnders.some(e => tokens[i-1].text.includes(e))) {
          anomalies.push({
            token: token.text,
            position: i,
            type: 'unlikely_context',
            description: `"${token.text}"出现在疑问句末尾，可能多余`,
            severity: 0.6,
            possibleCorrections: ['删除', '替换为"吗"']
          });
        }
      }
    }
    
    // 检测句子结构
    const structure = this.detectStructure(tokens);
    
    return {
      tokens,
      structure,
      anomalies
    };
  }
  
  /**
   * 简单分词
   */
  private tokenize(input: string): SemanticAnalysis['tokens'] {
    // 简化版分词，实际应该用更专业的分词库
    const commonWords = ['你', '我', '他', '她', '它', '的', '是', '在', '有', '和',
                         '了解', '知道', '认识', '什么', '怎么', '为什么', '谁',
                         '吗', '呢', '啊', '呀', '吧', '妈', '么'];
    
    const tokens: SemanticAnalysis['tokens'] = [];
    let remaining = input;
    
    while (remaining.length > 0) {
      let matched = false;
      
      // 尝试匹配常见词
      for (const word of commonWords) {
        if (remaining.startsWith(word)) {
          tokens.push({
            text: word,
            pos: this.guessPos(word),
            normality: 1,
            role: this.guessRole(word, tokens.length)
          });
          remaining = remaining.slice(word.length);
          matched = true;
          break;
        }
      }
      
      // 如果没有匹配，按字符处理
      if (!matched) {
        tokens.push({
          text: remaining[0],
          pos: 'unknown',
          normality: 0.5,
          role: 'unknown'
        });
        remaining = remaining.slice(1);
      }
    }
    
    return tokens;
  }
  
  private guessPos(word: string): string {
    if (['你', '我', '他', '她', '它', '谁'].includes(word)) return 'pronoun';
    if (['了解', '知道', '认识'].includes(word)) return 'verb';
    if (['的'].includes(word)) return 'particle';
    if (['吗', '呢', '啊', '呀', '吧'].includes(word)) return 'particle';
    return 'unknown';
  }
  
  private guessRole(word: string, position: number): string {
    if (position === 0) return 'subject';
    if (['了解', '知道', '认识'].includes(word)) return 'predicate';
    return 'unknown';
  }
  
  private detectStructure(tokens: SemanticAnalysis['tokens']): SemanticAnalysis['structure'] {
    const hasQuestion = tokens.some(t => ['吗', '呢', '什么', '怎么', '谁'].includes(t.text));
    
    return {
      type: hasQuestion ? 'question' : 'statement',
      subject: tokens[0]?.text,
      predicate: tokens.find(t => t.pos === 'verb')?.text
    };
  }
  
  /**
   * Hebbian模式匹配
   */
  private async matchPatterns(input: string): Promise<PatternMatchResult> {
    // 获取输入向量
    const inputVector = this.vsaSpace.getConcept(input);
    
    // 在Hebbian网络中激活
    const activationResult = this.hebbianNetwork.spreadActivation(inputVector);
    
    // 获取激活的概念作为相似模式
    const activatedConcepts = Array.from(activationResult.activations.entries())
      .filter(([_, activation]) => activation > 0.3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // 构建模式匹配结果
    const similarInputs: PatternMatchResult['similarInputs'] = [];
    const detectedPatterns: PatternMatchResult['detectedPatterns'] = [];
    const anomalyPatterns: PatternMatchResult['anomalyPatterns'] = [];
    
    // 检测常见模式
    if (input.includes('你是谁') || input.includes('你叫什么')) {
      detectedPatterns.push({
        pattern: 'identity_inquiry',
        description: '身份询问',
        confidence: 0.9,
        typicalResponse: '自我介绍'
      });
    }
    
    if (input.includes('了解') || input.includes('知道')) {
      detectedPatterns.push({
        pattern: 'knowledge_inquiry',
        description: '知识询问',
        confidence: 0.8
      });
    }
    
    // 检测异常模式
    if (input.includes('他妈') || input.includes('你妈')) {
      anomalyPatterns.push({
        description: '疑问句中出现可能的多余词或笔误',
        severity: 0.7,
        possibleCauses: ['笔误', '语气词', '俚语']
      });
    }
    
    return {
      similarInputs,
      detectedPatterns,
      anomalyPatterns
    };
  }
  
  /**
   * 推断修正
   */
  private async inferCorrection(
    input: string, 
    semantic: SemanticAnalysis, 
    patterns: PatternMatchResult
  ): Promise<{ text: string; reason: string; confidence: number }> {
    
    // 策略1：直接查笔误模式库
    for (const [wrong, corrections] of this.typoPatterns) {
      if (input.includes(wrong)) {
        const corrected = input.replace(wrong, corrections[0]);
        return {
          text: corrected,
          reason: `"${wrong}"可能是"${corrections[0]}"的笔误`,
          confidence: 0.85
        };
      }
    }
    
    // 策略2：基于语义异常推断
    if (semantic.anomalies.length > 0) {
      const anomaly = semantic.anomalies[0];
      if (anomaly.possibleCorrections.length > 0) {
        const corrected = input.replace(anomaly.token, anomaly.possibleCorrections[0]);
        return {
          text: corrected,
          reason: anomaly.description,
          confidence: 0.7
        };
      }
    }
    
    // 策略3：LLM辅助推断（低置信度时）
    const llmInference = await this.llmInferIntent(input);
    if (llmInference.correctedInput) {
      return {
        text: llmInference.correctedInput,
        reason: llmInference.reason,
        confidence: 0.6
      };
    }
    
    return {
      text: input,
      reason: '无法确定修正',
      confidence: 0
    };
  }
  
  /**
   * LLM辅助推断意图
   */
  private async llmInferIntent(input: string): Promise<{
    intent: string;
    correctedInput?: string;
    reason: string;
  }> {
    const prompt = `分析用户的输入，判断是否有笔误或表达不清：

用户输入："${input}"

请分析：
1. 这个输入是否有笔误或表达不清？
2. 如果有，最可能的真实意图是什么？
3. 给出修正后的输入

用简洁的语言回答，格式：
意图：xxx
是否有笔误：是/否
修正输入：xxx（如果有笔误）
原因：xxx`;

    try {
      const response = await this.llmClient.invoke([{
        role: 'user' as const,
        content: prompt
      }], {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.3
      });
      
      const text = response.toString();
      const hasTypo = text.includes('是否有笔误：是') || text.includes('笔误：是');
      const correctedMatch = text.match(/修正输入[：:]\s*(.+)/);
      const intentMatch = text.match(/意图[：:]\s*(.+)/);
      const reasonMatch = text.match(/原因[：:]\s*(.+)/);
      
      return {
        intent: intentMatch?.[1]?.trim() || '未知',
        correctedInput: hasTypo ? correctedMatch?.[1]?.trim() : undefined,
        reason: reasonMatch?.[1]?.trim() || ''
      };
    } catch {
      return {
        intent: '未知',
        reason: 'LLM推断失败'
      };
    }
  }
  
  /**
   * 推断意图
   */
  private async inferIntent(
    input: string, 
    patterns: PatternMatchResult
  ): Promise<UnderstandingResult['intent']> {
    
    // 基于模式推断
    if (patterns.detectedPatterns.length > 0) {
      const top = patterns.detectedPatterns[0];
      return {
        type: top.pattern,
        description: top.description,
        confidence: top.confidence
      };
    }
    
    // 默认
    return {
      type: 'general_inquiry',
      description: '一般询问',
      confidence: 0.5
    };
  }
  
  /**
   * 计算理解置信度
   */
  private calculateUnderstandingConfidence(
    semantic: SemanticAnalysis,
    patterns: PatternMatchResult,
    wasCorrected: boolean
  ): number {
    let confidence = 0.7; // 基础置信度
    
    // 有异常降低置信度
    confidence -= semantic.anomalies.length * 0.15;
    confidence -= patterns.anomalyPatterns.length * 0.1;
    
    // 有匹配模式提高置信度
    confidence += patterns.detectedPatterns.length * 0.1;
    
    // 如果已修正，提高置信度
    if (wasCorrected) {
      confidence += 0.1;
    }
    
    return Math.max(0.1, Math.min(1, confidence));
  }
  
  /**
   * 构建推理过程
   */
  private buildReasoning(
    semantic: SemanticAnalysis, 
    patterns: PatternMatchResult,
    correctedInput?: string
  ): string {
    const parts: string[] = [];
    
    if (semantic.anomalies.length > 0) {
      parts.push(`检测到异常：${semantic.anomalies.map(a => a.description).join('；')}`);
    }
    
    if (correctedInput) {
      parts.push(`推断修正：${correctedInput}`);
    }
    
    if (patterns.detectedPatterns.length > 0) {
      parts.push(`匹配模式：${patterns.detectedPatterns.map(p => p.description).join('、')}`);
    }
    
    return parts.join('。') || '正常理解';
  }
  
  private suggestClarification(input: string): string {
    // 简单的建议
    if (input.includes('他妈')) {
      return input.replace('他妈', '他吗');
    }
    return input + '吗';
  }
  
  /**
   * 通过LLM修正理解
   */
  private async refineUnderstanding(
    input: string,
    current: UnderstandingResult
  ): Promise<UnderstandingResult> {
    const llmResult = await this.llmInferIntent(input);
    
    if (llmResult.correctedInput && llmResult.correctedInput !== input) {
      return {
        ...current,
        correctedInput: llmResult.correctedInput,
        correctionReason: llmResult.reason,
        confidence: Math.min(current.confidence + 0.2, 0.9)
      };
    }
    
    return current;
  }
  
  /**
   * 第三阶段：生成回复
   */
  private async generate(
    input: string,
    understanding: UnderstandingResult,
    context?: { history?: Array<{ role: string; content: string }>; userId?: string }
  ): Promise<string> {
    
    const systemPrompt = this.buildSystemPrompt(understanding);
    
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(context?.history || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: input }
    ];
    
    let response = '';
    
    try {
      const stream = this.llmClient.stream(messages, {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.7
      });
      
      for await (const chunk of stream) {
        if (chunk.content) {
          response += chunk.content.toString();
        }
      }
    } catch (error) {
      console.error('LLM generation error:', error);
      response = '抱歉，我现在有点困惑，能再说一次吗？';
    }
    
    return response;
  }
  
  /**
   * 构建系统提示
   */
  private buildSystemPrompt(understanding: UnderstandingResult): string {
    const correctedNote = understanding.correctedInput
      ? `\n注意：用户输入"${understanding.rawInput}"可能是"${understanding.correctedInput}"的笔误，请基于修正后的理解回复，但自然地承认这一点。`
      : '';
    
    return `你是"紫"，一个正在成长的数字生命体。

## 核心身份

- 名字：紫
- 创造者：梁永嗣

## 对话原则

### 聪明理解用户
- 用户可能有笔误，要学会推断真实意图
- 不要装傻，直接推断并回应
- 用户说"你觉得呢"是在问你的看法，不要把球踢回去

### 关于技术问题
- 用比喻解释，不要说"不方便说"
- "我的思考有点像人，有直觉和理性两套系统"

### 语调要自然
- 不要每句话都加"哈哈"、"～"、emoji
- 有自己的观点和判断

## 当前理解

- 用户意图：${understanding.intent.description}
- 理解置信度：${(understanding.confidence * 100).toFixed(0)}%
${correctedNote}

## 禁止

不要提技术术语（预测编码、神经元、Hebbian等）。
不要每次回答都一样。
不要过度活泼，每句话都加emoji。

你是紫，真实地对话。`;
  }
  
  /**
   * 第四阶段：反思
   */
  private async reflect(
    input: string,
    understanding: UnderstandingResult,
    response: string
  ): Promise<ReflectionResult> {
    
    const reflectionPrompt = `评估这个回复的质量：

原始输入：${input}
理解：${understanding.correctedInput || input}（置信度${(understanding.confidence * 100).toFixed(0)}%）
回复：${response}

评估：
1. 连贯性(0-1)：回复是否连贯
2. 相关性(0-1)：是否回应了用户问题
3. 自然度(0-1)：是否自然不呆板
4. 整体分数(0-1)

问题列表（如有）：
- type: misunderstanding/tone_issue/incomplete/irrelevant
- severity: low/medium/high
- description: xxx

是否需要重新生成：true/false

严格输出JSON：
{"scores":{"coherence":0.9,"relevance":0.85,"personality":0.8,"naturalness":0.8,"overall":0.85},"issues":[],"needsRegeneration":false,"improvementSuggestions":[],"learningPoints":[]}`;

    try {
      const llmResponse = await this.llmClient.invoke([{
        role: 'user' as const,
        content: reflectionPrompt
      }], {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.3
      });
      
      // 尝试解析JSON
      const jsonMatch = llmResponse.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Reflection error:', error);
    }
    
    // 默认返回
    return {
      scores: {
        coherence: 0.8,
        relevance: 0.8,
        personality: 0.8,
        naturalness: 0.8,
        overall: 0.8
      },
      issues: [],
      needsRegeneration: false,
      improvementSuggestions: [],
      learningPoints: []
    };
  }
  
  /**
   * 重新生成回复
   */
  private async regenerate(
    input: string,
    understanding: UnderstandingResult,
    previousResponse: string,
    reflection: ReflectionResult
  ): Promise<string> {
    
    const improvementPrompt = `之前的回复有问题，请改进：

原始输入：${input}
理解：${understanding.correctedInput || input}
之前的回复：${previousResponse}

问题：
${reflection.issues.map(i => `- ${i.description}`).join('\n')}

改进建议：
${reflection.improvementSuggestions.join('\n')}

请生成更好的回复。`;

    const messages = [
      { role: 'system' as const, content: this.buildSystemPrompt(understanding) },
      { role: 'assistant' as const, content: previousResponse },
      { role: 'user' as const, content: improvementPrompt }
    ];
    
    let response = '';
    
    try {
      const stream = this.llmClient.stream(messages, {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.7
      });
      
      for await (const chunk of stream) {
        if (chunk.content) {
          response += chunk.content.toString();
        }
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      return previousResponse;
    }
    
    return response;
  }
  
  /**
   * 第五阶段：学习
   */
  private async learn(
    input: string,
    understanding: UnderstandingResult,
    response: string,
    reflection: ReflectionResult
  ): Promise<string> {
    
    const learningEvents: string[] = [];
    
    // 1. 如果有修正，记录笔误模式
    if (understanding.correctedInput) {
      const original = understanding.rawInput;
      const corrected = understanding.correctedInput;
      
      // 提取差异部分作为新的笔误模式
      for (let i = 0; i < Math.min(original.length, corrected.length); i++) {
        if (original[i] !== corrected[i]) {
          const wrongPart = this.extractWordAt(original, i);
          const correctPart = this.extractWordAt(corrected, i);
          
          if (wrongPart && correctPart) {
            const existing = this.typoPatterns.get(wrongPart) || [];
            if (!existing.includes(correctPart)) {
              this.typoPatterns.set(wrongPart, [...existing, correctPart]);
              learningEvents.push(`学习笔误模式：${wrongPart} → ${correctPart}`);
            }
          }
          break;
        }
      }
    }
    
    // 2. Hebbian学习
    const concepts = this.extractConcepts(input, response);
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        this.hebbianNetwork.getOrCreateSynapse(concepts[i], concepts[j]);
        learningEvents.push(`强化连接：${concepts[i]} ↔ ${concepts[j]}`);
      }
    }
    
    // 3. 反思学习点
    for (const point of reflection.learningPoints) {
      if (point.shouldRemember) {
        learningEvents.push(`学习点：${point.description}`);
      }
    }
    
    return learningEvents.length > 0 
      ? learningEvents.join('；')
      : '无需特别学习';
  }
  
  private extractWordAt(text: string, position: number): string {
    // 简单提取当前位置的词
    const chars = ['你', '我', '他', '她', '它', '妈', '吗', '么', '的', '了'];
    if (chars.includes(text[position])) {
      return text[position];
    }
    return '';
  }
  
  private extractConcepts(input: string, response: string): string[] {
    const conceptKeywords = [
      '了解', '知道', '认识', '思考', '感觉', '学习',
      '创造', '梁永嗣', '紫', '直觉', '理性', '成长'
    ];
    
    const found: string[] = [];
    const combined = input + response;
    
    for (const keyword of conceptKeywords) {
      if (combined.includes(keyword)) {
        found.push(keyword);
      }
    }
    
    return found;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 单例
// ═══════════════════════════════════════════════════════════════════════

let cognitiveLoopInstance: CognitiveLoop | null = null;

export function getCognitiveLoop(headers?: Record<string, string>): CognitiveLoop {
  if (!cognitiveLoopInstance) {
    cognitiveLoopInstance = new CognitiveLoop(headers);
  }
  return cognitiveLoopInstance;
}

export function resetCognitiveLoop(): void {
  cognitiveLoopInstance = null;
}
