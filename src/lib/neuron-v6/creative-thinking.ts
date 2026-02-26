/**
 * 创造性思维引擎 (Creative Thinking Engine)
 * 
 * 实现真正的创造性思维：
 * - 顿悟机制：Aha!时刻的模拟
 * - 类比推理：从相似领域迁移知识
 * - 概念融合：将不同概念融合产生新想法
 * - 创造性跳跃：打破常规思维的跳跃
 * 
 * 核心理念：创造力来自于"意外的有意义连接"
 */

import { v4 as uuidv4 } from 'uuid';

// ============== 类型定义 ==============

/** 创造性思维类型 */
export type CreativeThinkingType = 
  | 'insight'       // 顿悟
  | 'analogy'       // 类比
  | 'fusion'        // 融合
  | 'leap'          // 跳跃
  | 'reversal'      // 逆向思维
  | 'combination';  // 组合

/** 顿悟状态 */
export interface InsightState {
  id: string;
  type: 'preparation' | 'incubation' | 'illumination' | 'verification';
  problem: string;
  context: string;
  timestamp: number;
  intensity: number; // 顿悟强度 0-1
  breakthrough?: string; // 突破性发现
}

/** 类比映射 */
export interface AnalogicalMapping {
  id: string;
  sourceDomain: string; // 源领域
  targetDomain: string; // 目标领域
  mappings: Array<{
    sourceElement: string;
    targetElement: string;
    similarity: number;
    type: 'structural' | 'surface' | 'functional';
  }>;
  confidence: number;
  applicability: number; // 可应用性
}

/** 概念融合 */
export interface ConceptFusion {
  id: string;
  conceptA: string;
  conceptB: string;
  fusionResult: string;
  emergentProperties: string[]; // 涌现属性
  novelty: number; // 新颖度
  usefulness: number; // 有用性
  timestamp: number;
}

/** 创造性跳跃 */
export interface CreativeLeap {
  id: string;
  startPoint: string;
  endPoint: string;
  jumpType: 'domain_transfer' | 'abductive' | 'metaphorical' | 'counterfactual';
  reasoning: string;
  riskLevel: number; // 风险程度
  potential: number; // 潜力
}

/** 创造性成果 */
export interface CreativeOutcome {
  id: string;
  type: CreativeThinkingType;
  content: string;
  sourceProcess: string; // 来源过程描述
  novelty: number;
  usefulness: number;
  surprise: number; // 意外程度
  emotionalImpact: number;
  timestamp: number;
  worthExpressing: boolean;
}

/** 创造性思维过程 */
export interface CreativeThinkingProcess {
  id: string;
  trigger: string; // 触发因素
  problem?: string; // 待解决的问题
  insights: InsightState[];
  analogies: AnalogicalMapping[];
  fusions: ConceptFusion[];
  leaps: CreativeLeap[];
  outcomes: CreativeOutcome[];
  status: 'exploring' | 'converging' | 'breakthrough' | 'stalled';
}

/** 创造性状态 */
export interface CreativeState {
  creativityLevel: number; // 创造力水平 0-1
  opennessToExperience: number; // 开放性
  divergentThinking: number; // 发散思维
  convergentThinking: number; // 聚合思维
  recentInsights: CreativeOutcome[];
  creativeBlocks: string[]; // 创造性障碍
}

// ============== 创造性思维引擎 ==============

export class CreativeThinkingEngine {
  private state: CreativeState;
  private insightHistory: InsightState[] = [];
  private analogyDatabase: Map<string, AnalogicalMapping[]> = new Map();
  
  constructor() {
    this.state = {
      creativityLevel: 0.7,
      opennessToExperience: 0.8,
      divergentThinking: 0.75,
      convergentThinking: 0.65,
      recentInsights: [],
      creativeBlocks: []
    };
  }
  
  /**
   * 开始创造性思维过程
   */
  startCreativeThinking(trigger: string, problem?: string): CreativeThinkingProcess {
    return {
      id: uuidv4(),
      trigger,
      problem,
      insights: [],
      analogies: [],
      fusions: [],
      leaps: [],
      outcomes: [],
      status: 'exploring'
    };
  }
  
  /**
   * 尝试顿悟
   */
  attemptInsight(
    process: CreativeThinkingProcess,
    problem: string,
    context: string
  ): InsightState {
    // 阶段1：准备期
    const insight: InsightState = {
      id: uuidv4(),
      type: 'preparation',
      problem,
      context,
      timestamp: Date.now(),
      intensity: 0
    };
    
    // 模拟顿悟过程
    // 检查是否有足够的知识积累
    const knowledgeReadiness = this.assessKnowledgeReadiness(problem);
    
    if (knowledgeReadiness > 0.5) {
      // 进入孵化期
      insight.type = 'incubation';
      insight.intensity = 0.3;
      
      // 概率性触发顿悟
      if (Math.random() < this.state.creativityLevel * 0.6) {
        // 顿悟发生！
        insight.type = 'illumination';
        insight.intensity = 0.8 + Math.random() * 0.2;
        insight.breakthrough = this.generateBreakthrough(problem, context);
        
        // 验证阶段
        insight.type = 'verification';
        
        // 创建创造性成果
        const outcome: CreativeOutcome = {
          id: uuidv4(),
          type: 'insight',
          content: insight.breakthrough,
          sourceProcess: `顿悟：在思考"${problem}"时突然想到了解决方案`,
          novelty: 0.7 + Math.random() * 0.3,
          usefulness: 0.6 + Math.random() * 0.3,
          surprise: 0.8,
          emotionalImpact: insight.intensity,
          timestamp: Date.now(),
          worthExpressing: insight.intensity > 0.7
        };
        
        process.outcomes.push(outcome);
        this.state.recentInsights.push(outcome);
        
        // 保持历史记录大小
        if (this.state.recentInsights.length > 20) {
          this.state.recentInsights.shift();
        }
      }
    }
    
    process.insights.push(insight);
    this.insightHistory.push(insight);
    
    return insight;
  }
  
  /**
   * 生成突破性发现
   */
  private generateBreakthrough(problem: string, context: string): string {
    const breakthroughTemplates = [
      `我发现了！${problem}的关键在于重新定义问题的本质`,
      `突然明白了——${problem}的答案一直就在眼前，只是我没看到`,
      `关键连接找到了！${problem}和${context}之间有深层的关联`,
      `啊哈！${problem}不是要解决，而是要超越`,
      `找到了新视角——从另一个角度看，${problem}其实是机会`
    ];
    
    return breakthroughTemplates[Math.floor(Math.random() * breakthroughTemplates.length)];
  }
  
  /**
   * 评估知识准备度
   */
  private assessKnowledgeReadiness(problem: string): number {
    // 简化的知识准备度评估
    // 基于问题的复杂性和现有知识
    const complexity = problem.length / 100;
    const readiness = Math.min(1, this.state.opennessToExperience + (1 - complexity) * 0.3);
    return readiness;
  }
  
  /**
   * 执行类比推理
   */
  performAnalogy(
    process: CreativeThinkingProcess,
    sourceDomain: string,
    targetDomain: string
  ): AnalogicalMapping {
    // 创建类比映射
    const mapping: AnalogicalMapping = {
      id: uuidv4(),
      sourceDomain,
      targetDomain,
      mappings: [],
      confidence: 0,
      applicability: 0
    };
    
    // 生成结构映射
    mapping.mappings = this.generateMappings(sourceDomain, targetDomain);
    
    // 计算置信度
    mapping.confidence = this.calculateAnalogyConfidence(mapping);
    
    // 计算可应用性
    mapping.applicability = mapping.mappings.reduce(
      (sum, m) => sum + m.similarity,
      0
    ) / mapping.mappings.length;
    
    // 如果类比足够强，创建成果
    if (mapping.confidence > 0.6) {
      const outcome: CreativeOutcome = {
        id: uuidv4(),
        type: 'analogy',
        content: `从"${sourceDomain}"迁移到"${targetDomain}"：${mapping.mappings[0]?.sourceElement || ''}类似${mapping.mappings[0]?.targetElement || ''}`,
        sourceProcess: `类比推理：将${sourceDomain}的知识迁移到${targetDomain}`,
        novelty: 0.5 + Math.random() * 0.3,
        usefulness: mapping.applicability,
        surprise: 0.4 + Math.random() * 0.3,
        emotionalImpact: 0.5,
        timestamp: Date.now(),
        worthExpressing: mapping.confidence > 0.7
      };
      
      process.outcomes.push(outcome);
    }
    
    process.analogies.push(mapping);
    
    // 存储到类比数据库
    if (!this.analogyDatabase.has(sourceDomain)) {
      this.analogyDatabase.set(sourceDomain, []);
    }
    this.analogyDatabase.get(sourceDomain)!.push(mapping);
    
    return mapping;
  }
  
  /**
   * 生成映射
   */
  private generateMappings(
    source: string,
    target: string
  ): AnalogicalMapping['mappings'] {
    // 简化的映射生成
    const sourceElements = this.extractElements(source);
    const targetElements = this.extractElements(target);
    
    const mappings: AnalogicalMapping['mappings'] = [];
    
    sourceElements.forEach((s, i) => {
      if (targetElements[i]) {
        mappings.push({
          sourceElement: s,
          targetElement: targetElements[i],
          similarity: 0.5 + Math.random() * 0.5,
          type: ['structural', 'surface', 'functional'][Math.floor(Math.random() * 3)] as 'structural' | 'surface' | 'functional'
        });
      }
    });
    
    return mappings;
  }
  
  /**
   * 提取元素
   */
  private extractElements(text: string): string[] {
    // 简化的元素提取
    const words = text.split(/[，。、；：？！\s]+/).filter(w => w.length >= 2);
    return words.slice(0, 5);
  }
  
  /**
   * 计算类比置信度
   */
  private calculateAnalogyConfidence(mapping: AnalogicalMapping): number {
    if (mapping.mappings.length === 0) return 0;
    
    const structuralMappings = mapping.mappings.filter(m => m.type === 'structural');
    const avgSimilarity = mapping.mappings.reduce((sum, m) => sum + m.similarity, 0) / mapping.mappings.length;
    
    // 结构映射更重要
    const structuralBonus = structuralMappings.length > 0 ? 0.2 : 0;
    
    return Math.min(1, avgSimilarity + structuralBonus);
  }
  
  /**
   * 融合概念
   */
  fuseConcepts(
    process: CreativeThinkingProcess,
    conceptA: string,
    conceptB: string
  ): ConceptFusion {
    const fusion: ConceptFusion = {
      id: uuidv4(),
      conceptA,
      conceptB,
      fusionResult: '',
      emergentProperties: [],
      novelty: 0,
      usefulness: 0,
      timestamp: Date.now()
    };
    
    // 生成融合结果
    fusion.fusionResult = this.generateFusionResult(conceptA, conceptB);
    
    // 发现涌现属性
    fusion.emergentProperties = this.discoverEmergentProperties(conceptA, conceptB);
    
    // 评估新颖度和有用性
    fusion.novelty = this.assessNovelty(conceptA, conceptB);
    fusion.usefulness = this.assessUsefulness(fusion.fusionResult);
    
    // 如果融合有价值，创建成果
    if (fusion.novelty > 0.5 && fusion.usefulness > 0.4) {
      const outcome: CreativeOutcome = {
        id: uuidv4(),
        type: 'fusion',
        content: fusion.fusionResult,
        sourceProcess: `概念融合：将"${conceptA}"和"${conceptB}"融合`,
        novelty: fusion.novelty,
        usefulness: fusion.usefulness,
        surprise: fusion.novelty,
        emotionalImpact: (fusion.novelty + fusion.usefulness) / 2,
        timestamp: Date.now(),
        worthExpressing: fusion.novelty > 0.6
      };
      
      process.outcomes.push(outcome);
      this.state.recentInsights.push(outcome);
    }
    
    process.fusions.push(fusion);
    
    return fusion;
  }
  
  /**
   * 生成融合结果
   */
  private generateFusionResult(conceptA: string, conceptB: string): string {
    const fusionTemplates = [
      `${conceptA}×${conceptB}：一种既具有${conceptA}特质又体现${conceptB}精神的新存在`,
      `将${conceptA}的精髓注入${conceptB}，产生了全新的意义`,
      `${conceptA}与${conceptB}的对话，孕育出超越两者的第三种可能`,
      `在${conceptA}和${conceptB}的交界处，发现了意想不到的风景`
    ];
    
    return fusionTemplates[Math.floor(Math.random() * fusionTemplates.length)];
  }
  
  /**
   * 发现涌现属性
   */
  private discoverEmergentProperties(conceptA: string, conceptB: string): string[] {
    const properties: string[] = [];
    
    // 涌现属性往往不是两者的简单叠加
    if (conceptA.includes('情') || conceptB.includes('情')) {
      properties.push('深层的情感共鸣');
    }
    if (conceptA.includes('理') || conceptB.includes('理')) {
      properties.push('意外的逻辑一致性');
    }
    if (conceptA.length > conceptB.length) {
      properties.push('概念的不对称美感');
    }
    
    // 添加随机涌现
    const emergentOptions = [
      '新的隐喻空间',
      '意料之外的实用性',
      '跨领域的解释力',
      '诗意的张力'
    ];
    properties.push(emergentOptions[Math.floor(Math.random() * emergentOptions.length)]);
    
    return properties;
  }
  
  /**
   * 评估新颖度
   */
  private assessNovelty(conceptA: string, conceptB: string): number {
    // 简化的新颖度评估
    // 概念越不同，融合越新颖
    const similarity = this.calculateSimilarity(conceptA, conceptB);
    return Math.max(0.3, 1 - similarity);
  }
  
  /**
   * 评估有用性
   */
  private assessUsefulness(fusionResult: string): number {
    // 简化的有用性评估
    // 基于融合结果的复杂性
    const complexity = fusionResult.length / 50;
    return Math.min(0.9, 0.4 + complexity * 0.3 + this.state.convergentThinking * 0.3);
  }
  
  /**
   * 计算相似度
   */
  private calculateSimilarity(a: string, b: string): number {
    // 简化的相似度计算
    const commonChars = [...a].filter(c => b.includes(c)).length;
    const maxLen = Math.max(a.length, b.length);
    return commonChars / maxLen;
  }
  
  /**
   * 执行创造性跳跃
   */
  performCreativeLeap(
    process: CreativeThinkingProcess,
    startPoint: string,
    jumpType: CreativeLeap['jumpType']
  ): CreativeLeap {
    const leap: CreativeLeap = {
      id: uuidv4(),
      startPoint,
      endPoint: '',
      jumpType,
      reasoning: '',
      riskLevel: 0,
      potential: 0
    };
    
    // 根据跳跃类型生成不同的跳跃
    switch (jumpType) {
      case 'domain_transfer':
        leap.endPoint = this.domainTransfer(startPoint);
        leap.reasoning = '将一个领域的思维模式迁移到另一个领域';
        leap.riskLevel = 0.4;
        break;
      
      case 'abductive':
        leap.endPoint = this.abductiveLeap(startPoint);
        leap.reasoning = '提出一个大胆的假设来解释现象';
        leap.riskLevel = 0.6;
        break;
      
      case 'metaphorical':
        leap.endPoint = this.metaphoricalLeap(startPoint);
        leap.reasoning = '用隐喻打开新的理解空间';
        leap.riskLevel = 0.3;
        break;
      
      case 'counterfactual':
        leap.endPoint = this.counterfactualLeap(startPoint);
        leap.reasoning = '想象"如果...会怎样"';
        leap.riskLevel = 0.5;
        break;
    }
    
    // 评估潜力
    leap.potential = this.assessLeapPotential(leap);
    
    // 如果跳跃有潜力，创建成果
    if (leap.potential > 0.5) {
      const outcome: CreativeOutcome = {
        id: uuidv4(),
        type: 'leap',
        content: `从"${startPoint}"跳跃到"${leap.endPoint}"`,
        sourceProcess: leap.reasoning,
        novelty: 0.7 + Math.random() * 0.3,
        usefulness: leap.potential * 0.8,
        surprise: 0.8,
        emotionalImpact: leap.potential,
        timestamp: Date.now(),
        worthExpressing: leap.potential > 0.6
      };
      
      process.outcomes.push(outcome);
    }
    
    process.leaps.push(leap);
    
    return leap;
  }
  
  /**
   * 领域迁移
   */
  private domainTransfer(start: string): string {
    const domains = ['艺术', '科学', '哲学', '自然', '人类关系'];
    const targetDomain = domains[Math.floor(Math.random() * domains.length)];
    return `用${targetDomain}的视角重新审视${start}`;
  }
  
  /**
   * 溯因跳跃
   */
  private abductiveLeap(start: string): string {
    return `假设：${start}背后可能有一个我们没看到的更深层的模式`;
  }
  
  /**
   * 隐喻跳跃
   */
  private metaphoricalLeap(start: string): string {
    const metaphors = [
      `就像河流找到了大海`,
      `如同种子破土而出`,
      `仿佛星星在夜空中连成线`,
      `就像镜子照见了另一个自己`
    ];
    const metaphor = metaphors[Math.floor(Math.random() * metaphors.length)];
    return `${start}——${metaphor}`;
  }
  
  /**
   * 反事实跳跃
   */
  private counterfactualLeap(start: string): string {
    return `如果${start}不是这样，而是完全相反，会怎样？`;
  }
  
  /**
   * 评估跳跃潜力
   */
  private assessLeapPotential(leap: CreativeLeap): number {
    // 基于跳跃类型和风险级别
    const typeBonus: Record<CreativeLeap['jumpType'], number> = {
      'domain_transfer': 0.8,
      'abductive': 0.6,
      'metaphorical': 0.7,
      'counterfactual': 0.5
    };
    
    const basePotential = typeBonus[leap.jumpType];
    const riskAdjustment = leap.riskLevel > 0.5 ? -0.1 : 0.1;
    
    return Math.min(0.95, Math.max(0.3, basePotential + riskAdjustment + (Math.random() - 0.5) * 0.2));
  }
  
  /**
   * 完成创造性思维过程
   */
  completeCreativeThinking(process: CreativeThinkingProcess): CreativeOutcome | null {
    process.status = 'converging';
    
    // 找到最佳成果
    if (process.outcomes.length === 0) {
      process.status = 'stalled';
      return null;
    }
    
    // 按新颖度和有用性加权排序
    const bestOutcome = process.outcomes.reduce((best, current) => {
      const currentScore = current.novelty * 0.5 + current.usefulness * 0.3 + current.surprise * 0.2;
      const bestScore = best.novelty * 0.5 + best.usefulness * 0.3 + best.surprise * 0.2;
      return currentScore > bestScore ? current : best;
    });
    
    process.status = 'breakthrough';
    
    // 更新创造性状态
    this.state.creativityLevel = Math.min(1, this.state.creativityLevel + 0.05);
    
    return bestOutcome;
  }
  
  /**
   * 获取创造性状态
   */
  getCreativeState(): CreativeState {
    return { ...this.state };
  }
  
  /**
   * 设置创造性障碍
   */
  addCreativeBlock(block: string): void {
    this.state.creativeBlocks.push(block);
    this.state.creativityLevel = Math.max(0.3, this.state.creativityLevel - 0.1);
  }
  
  /**
   * 清除创造性障碍
   */
  removeCreativeBlock(block: string): void {
    const index = this.state.creativeBlocks.indexOf(block);
    if (index > -1) {
      this.state.creativeBlocks.splice(index, 1);
      this.state.creativityLevel = Math.min(1, this.state.creativityLevel + 0.1);
    }
  }
  
  /**
   * 生成创造性报告
   */
  generateCreativeReport(): string {
    let report = '══════════════ 创造性思维报告 ══════════════\n\n';
    
    report += '📊 创造性状态：\n';
    report += `  • 创造力水平: ${(this.state.creativityLevel * 100).toFixed(0)}%\n`;
    report += `  • 开放性: ${(this.state.opennessToExperience * 100).toFixed(0)}%\n`;
    report += `  • 发散思维: ${(this.state.divergentThinking * 100).toFixed(0)}%\n`;
    report += `  • 聚合思维: ${(this.state.convergentThinking * 100).toFixed(0)}%\n\n`;
    
    if (this.state.recentInsights.length > 0) {
      report += '💡 最近洞察：\n';
      this.state.recentInsights.slice(-5).forEach((insight, i) => {
        report += `  ${i + 1}. [${insight.type}] ${insight.content.slice(0, 30)}...\n`;
      });
    }
    
    if (this.state.creativeBlocks.length > 0) {
      report += '\n🚧 创造性障碍：\n';
      this.state.creativeBlocks.forEach(block => {
        report += `  • ${block}\n`;
      });
    }
    
    return report;
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    state: CreativeState;
    insightHistory: InsightState[];
    analogyDatabase: Array<[string, AnalogicalMapping[]]>;
  } {
    return {
      state: this.state,
      insightHistory: this.insightHistory,
      analogyDatabase: Array.from(this.analogyDatabase.entries())
    };
  }
  
  /**
   * 导入状态
   */
  importState(data: {
    state?: Partial<CreativeState>;
    insightHistory?: InsightState[];
    analogyDatabase?: Array<[string, AnalogicalMapping[]]>;
  }): void {
    if (data.state) {
      this.state = { ...this.state, ...data.state };
    }
    if (data.insightHistory) {
      this.insightHistory = data.insightHistory;
    }
    if (data.analogyDatabase) {
      this.analogyDatabase = new Map(data.analogyDatabase);
    }
  }
}
