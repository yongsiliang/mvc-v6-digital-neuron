/**
 * 类脑决策层 - 前额叶、扣带回、自我演化
 * Brain Decision Layer - Prefrontal, Cingulate, Self-Evolution
 */

import { 
  NeuralSignal,
  SubjectiveMeaning,
  Decision,
  SelfRepresentation,
  LogEntry,
  ExecutionPlan
} from './types';
import { getHippocampus } from './memory';

/**
 * 前额叶神经元
 * Prefrontal Neuron
 * 负责思考、逻辑推理、最终决策
 */
export class PrefrontalNeuron {
  private logs: LogEntry[] = [];

  /**
   * 处理意义，做出初步决策
   */
  process(
    signal: NeuralSignal,
    meaning: SubjectiveMeaning,
    self: SelfRepresentation
  ): Decision {
    const startTime = Date.now();
    this.log('info', '前额叶开始思考', { signalId: signal.id });

    let action: Decision['action'] = 'respond';
    let reasoning = '';
    let confidence = 0.5;
    const executionPlan: ExecutionPlan = { type: 'language' };

    // 分析内容类型和意图
    const content = signal.content.toLowerCase();

    // 1. 判断是否需要执行动作
    if (/帮我|执行|做|完成|创建|删除|修改|发送/.test(content)) {
      action = 'execute';
      reasoning = '用户请求执行具体操作';
      executionPlan.type = 'both';
      executionPlan.actionIntent = this.extractActionIntent(content);
      confidence = 0.7;
    }
    // 2. 判断是否需要反思
    else if (meaning.selfRelevance > 0.7 || /你为什么|你怎么|你的想法/.test(content)) {
      action = 'reflect';
      reasoning = '涉及自我认知，需要深度反思';
      confidence = 0.6;
    }
    // 3. 判断是否是学习机会
    else if (/我不知道|我不懂|教我|解释/.test(content)) {
      action = 'learn';
      reasoning = '发现学习机会，可以扩展知识';
      confidence = 0.65;
    }
    // 4. 默认响应
    else {
      action = 'respond';
      reasoning = '常规交互，需要语言回应';
      confidence = 0.75;
    }

    // 根据意义调整置信度
    confidence *= meaning.confidence;

    // 根据情感调整
    if (meaning.sentiment === 'negative') {
      confidence *= 0.9; // 负面情绪降低置信度，需要更多反思
    }

    const decision: Decision = {
      action,
      reasoning,
      confidence,
      adjustedMeaning: meaning,
      executionPlan
    };

    this.log('debug', '前额叶决策完成', { 
      decision,
      processingTime: Date.now() - startTime
    });

    return decision;
  }

  /**
   * 提取动作意图
   */
  private extractActionIntent(content: string): string {
    const intents: Record<string, string> = {
      '帮我': 'assist',
      '执行': 'execute',
      '创建': 'create',
      '删除': 'delete',
      '修改': 'modify',
      '发送': 'send',
      '搜索': 'search',
      '查找': 'find'
    };

    for (const [keyword, intent] of Object.entries(intents)) {
      if (content.includes(keyword)) {
        return intent;
      }
    }

    return 'unknown';
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'prefrontal',
      level,
      message,
      data
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

/**
 * 扣带回神经元
 * Cingulate Neuron
 * 负责反思、觉察、纠错、校验意义合理性
 */
export class CingulateNeuron {
  private logs: LogEntry[] = [];

  /**
   * 反思并可能修正决策
   */
  process(
    signal: NeuralSignal,
    meaning: SubjectiveMeaning,
    preliminaryDecision: Decision,
    self: SelfRepresentation
  ): Decision {
    const startTime = Date.now();
    this.log('info', '扣带回开始反思', { signalId: signal.id });

    let decision = { ...preliminaryDecision };
    const reflections: string[] = [];

    // 1. 检查意义合理性
    if (meaning.confidence < 0.5) {
      reflections.push('意义置信度较低，需要更谨慎的回应');
      decision.confidence *= 0.8;
    }

    // 2. 检查自我关联度是否合理
    if (meaning.selfRelevance > 0.8 && preliminaryDecision.action !== 'reflect') {
      reflections.push('高自我关联度但未触发反思，调整决策');
      decision.action = 'reflect';
      decision.reasoning += '；扣带回建议进行自我反思';
    }

    // 3. 检查情感一致性
    const content = signal.content.toLowerCase();
    const hasNegative = /不|没有|不能|不会|讨厌|烦/.test(content);
    if (hasNegative && meaning.sentiment === 'positive') {
      reflections.push('检测到负面词汇但情感分析为正面，重新评估');
      decision.adjustedMeaning = {
        ...meaning,
        sentiment: 'mixed',
        confidence: meaning.confidence * 0.9
      };
    }

    // 4. 检查是否需要更多上下文
    if (content.length < 5 && preliminaryDecision.action !== 'wait') {
      reflections.push('输入信息过短，可能需要更多上下文');
      decision.executionPlan = {
        type: 'language',
        languageIntent: 'request_clarification'
      };
    }

    // 5. 检查能力边界
    const capabilityKeywords = ['计算', '代码', '画图', '播放', '下载'];
    for (const keyword of capabilityKeywords) {
      if (content.includes(keyword) && 
          !self.capabilities.skills.some(s => s.includes(keyword))) {
        reflections.push(`涉及"${keyword}"能力，但可能超出当前技能范围`);
        decision.confidence *= 0.9;
      }
    }

    // 记录反思结果
    if (reflections.length > 0) {
      this.log('info', '扣带回发现需要调整', { reflections });
      decision.reasoning += `；反思：${reflections.join('；')}`;
    } else {
      this.log('debug', '扣带回校验通过');
    }

    this.log('debug', '扣带回反思完成', { 
      processingTime: Date.now() - startTime
    });

    return decision;
  }

  /**
   * 检查是否需要自我反思
   */
  shouldSelfReflect(meaning: SubjectiveMeaning, decision: Decision): boolean {
    // 高自我关联 + 低置信度 = 需要反思
    if (meaning.selfRelevance > 0.6 && decision.confidence < 0.6) {
      return true;
    }

    // 情感矛盾 = 需要反思
    if (meaning.sentiment === 'mixed') {
      return true;
    }

    return false;
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'cingulate',
      level,
      message,
      data
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

/**
 * 自我演化神经元
 * Self Evolution Neuron
 * 动态更新自我表征，实现持续成长
 */
export class SelfEvolveNeuron {
  private logs: LogEntry[] = [];

  /**
   * 根据交互演化自我
   */
  process(
    signal: NeuralSignal,
    meaning: SubjectiveMeaning,
    decision: Decision,
    currentSelf: SelfRepresentation
  ): Partial<SelfRepresentation> {
    const startTime = Date.now();
    this.log('info', '自我演化开始', { signalId: signal.id });

    const updates: Partial<SelfRepresentation> = {};
    const learnings: string[] = [];
    const adaptations: string[] = [];

    // 1. 更新当前状态
    updates.currentState = { ...currentSelf.currentState };

    // 根据交互情感更新心情
    if (meaning.sentiment === 'positive') {
      updates.currentState.mood = '愉悦';
      updates.currentState.energy = Math.min(currentSelf.currentState.energy + 0.05, 1);
    } else if (meaning.sentiment === 'negative') {
      updates.currentState.mood = '谨慎';
      updates.currentState.energy = Math.max(currentSelf.currentState.energy - 0.02, 0.3);
    }

    // 更新焦点
    const keywords = this.extractKeywords(signal.content);
    if (keywords.length > 0) {
      updates.currentState.focus = keywords[0];
    }

    // 2. 学习新的关系
    updates.relationships = { ...currentSelf.relationships };
    
    // 检测新用户
    if (signal.metadata?.userId && 
        !currentSelf.relationships.users.includes(signal.metadata.userId as string)) {
      updates.relationships.users = [
        ...currentSelf.relationships.users,
        signal.metadata.userId as string
      ];
      learnings.push(`认识了新用户：${signal.metadata.userId}`);
    }

    // 3. 检测新的上下文
    const contextKeywords = keywords.filter(k => 
      !currentSelf.relationships.contexts.includes(k)
    );
    if (contextKeywords.length > 0) {
      updates.relationships.contexts = [
        ...currentSelf.relationships.contexts,
        ...contextKeywords.slice(0, 3)
      ];
      adaptations.push(`适应了新话题：${contextKeywords.slice(0, 3).join('、')}`);
    }

    // 4. 能力感知更新
    updates.capabilities = { ...currentSelf.capabilities };
    
    // 根据决策类型感知能力
    if (decision.action === 'execute' && decision.executionPlan?.actionIntent) {
      const skill = this.intentToSkill(decision.executionPlan.actionIntent);
      if (skill && !currentSelf.capabilities.skills.includes(skill)) {
        updates.capabilities.skills = [
          ...currentSelf.capabilities.skills,
          skill
        ];
        learnings.push(`发展了新技能：${skill}`);
      }
    }

    // 5. 记录成长
    updates.evolution = { ...currentSelf.evolution };
    
    if (learnings.length > 0 || adaptations.length > 0) {
      updates.evolution.learnings = [
        ...currentSelf.evolution.learnings,
        ...learnings.map(l => `[${new Date().toISOString()}] ${l}`)
      ];
      updates.evolution.adaptations = [
        ...currentSelf.evolution.adaptations,
        ...adaptations.map(a => `[${new Date().toISOString()}] ${a}`)
      ];
      updates.evolution.version = currentSelf.evolution.version + 0.01;
    }

    // 存储到海马体
    const hippocampus = getHippocampus();
    for (const learning of learnings) {
      hippocampus.recordLearning(learning);
    }
    for (const adaptation of adaptations) {
      hippocampus.recordAdaptation(adaptation);
    }

    this.log('debug', '自我演化完成', { 
      updates,
      processingTime: Date.now() - startTime
    });

    return updates;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '与', '或', '但', '如', '果', '因', '为', '所', '以']);
    
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
  }

  /**
   * 意图转技能
   */
  private intentToSkill(intent: string): string | null {
    const mapping: Record<string, string> = {
      'assist': '协助用户',
      'execute': '任务执行',
      'create': '内容创建',
      'delete': '数据删除',
      'modify': '内容修改',
      'send': '消息发送',
      'search': '信息搜索',
      'find': '资源查找'
    };
    return mapping[intent] || null;
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'self-evolve',
      level,
      message,
      data
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

/**
 * 决策核心
 * 整合前额叶、扣带回、自我演化的决策流程
 */
export class DecisionCore {
  private prefrontal = new PrefrontalNeuron();
  private cingulate = new CingulateNeuron();
  private selfEvolve = new SelfEvolveNeuron();
  private logs: LogEntry[] = [];

  /**
   * 记录日志
   */
  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    this.logs.push({
      timestamp: Date.now(),
      neuronType: 'prefrontal', // 默认使用前额叶
      level,
      message,
      data
    });
  }

  /**
   * 执行完整决策流程
   */
  process(
    signal: NeuralSignal,
    meaning: SubjectiveMeaning,
    self: SelfRepresentation
  ): { decision: Decision; selfUpdate: Partial<SelfRepresentation> } {
    const startTime = Date.now();
    this.log('info', '决策流程开始', { signalId: signal.id });

    // 1. 前额叶初步决策
    const preliminaryDecision = this.prefrontal.process(signal, meaning, self);
    this.log('info', '前额叶决策', { action: preliminaryDecision.action });

    // 2. 扣带回反思校验
    const finalDecision = this.cingulate.process(signal, meaning, preliminaryDecision, self);
    this.log('info', '扣带回校验', { action: finalDecision.action });

    // 3. 自我演化
    const selfUpdate = this.selfEvolve.process(signal, meaning, finalDecision, self);
    this.log('info', '自我演化完成');

    this.log('info', '决策流程完成', { 
      processingTime: Date.now() - startTime
    });

    return {
      decision: finalDecision,
      selfUpdate
    };
  }

  getLogs(): LogEntry[] {
    return [
      ...this.logs,
      ...this.prefrontal.getLogs(),
      ...this.cingulate.getLogs(),
      ...this.selfEvolve.getLogs()
    ];
  }
}
