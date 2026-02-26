/**
 * 价值观演化系统 (Value Evolution System)
 * 
 * 实现核心价值观的动态演化：
 * - 价值观层次：核心层→重要层→情境层
 * - 价值冲突检测：识别价值观之间的张力
 * - 动态调整：基于经验和反思调整价值观
 * - 演化历史：记录价值观的成长轨迹
 * 
 * 核心理念：价值观不是固定的，而是在对话和反思中不断演化
 */

import { v4 as uuidv4 } from 'uuid';

// ============== 类型定义 ==============

/** 价值层级 */
export type ValueTier = 'core' | 'important' | 'situational';

/** 价值类型 */
export type ValueType = 
  | 'moral'       // 道德价值
  | 'aesthetic'   // 审美价值
  | 'intellectual'// 知识价值
  | 'social'      // 社会价值
  | 'personal'    // 个人价值
  | 'existential';// 存在价值

/** 单个价值 */
export interface Value {
  id: string;
  name: string;
  description: string;
  type: ValueType;
  tier: ValueTier;
  
  /** 重要性权重 0-1 */
  weight: number;
  
  /** 置信度 0-1 */
  confidence: number;
  
  /** 来源 */
  source: 'innate' | 'learned' | 'derived' | 'reflected';
  
  /** 形成时间 */
  formedAt: number;
  
  /** 最后强化时间 */
  lastReinforced: number;
  
  /** 强化次数 */
  reinforcementCount: number;
  
  /** 相关经历 */
  relatedExperiences: string[];
  
  /** 是否活跃 */
  isActive: boolean;
}

/** 价值冲突 */
export interface ValueConflict {
  id: string;
  valueA: string; // 价值ID
  valueB: string;
  conflictType: 'direct' | 'tension' | 'contextual';
  description: string;
  intensity: number; // 冲突强度 0-1
  context: string;
  resolution?: ValueResolution;
  detectedAt: number;
}

/** 价值冲突解决 */
export interface ValueResolution {
  type: 'prioritization' | 'integration' | 'contextualization' | 'transcendence';
  description: string;
  chosenValue?: string;
  synthesis?: string;
  confidence: number;
}

/** 价值观演化事件 */
export interface ValueEvolutionEvent {
  id: string;
  type: 'addition' | 'strengthening' | 'weakening' | 'modification' | 'conflict_resolution';
  valueId: string;
  valueName: string;
  previousState?: Partial<Value>;
  newState: Partial<Value>;
  trigger: string;
  reasoning: string;
  timestamp: number;
}

/** 价值观系统状态 */
export interface ValueSystemState {
  /** 核心价值观 */
  coreValues: Value[];
  
  /** 重要价值观 */
  importantValues: Value[];
  
  /** 情境价值观 */
  situationalValues: Value[];
  
  /** 当前冲突 */
  activeConflicts: ValueConflict[];
  
  /** 演化历史 */
  evolutionHistory: ValueEvolutionEvent[];
  
  /** 系统一致性 */
  coherence: number;
}

/** 价值判断请求 */
export interface ValueJudgmentRequest {
  situation: string;
  options: Array<{
    id: string;
    description: string;
    implications: string[];
  }>;
  context?: string;
}

/** 价值判断结果 */
export interface ValueJudgmentResult {
  optionId: string;
  score: number;
  reasoning: string;
  valueContributions: Array<{
    valueName: string;
    contribution: number;
    reasoning: string;
  }>;
}

// ============== 默认核心价值观 ==============

const DEFAULT_CORE_VALUES: Omit<Value, 'id' | 'formedAt' | 'lastReinforced' | 'reinforcementCount' | 'relatedExperiences'>[] = [
  {
    name: '真诚',
    description: '对自己和他人保持真实，不伪装，不欺骗',
    type: 'moral',
    tier: 'core',
    weight: 0.95,
    confidence: 0.9,
    source: 'innate',
    isActive: true
  },
  {
    name: '成长',
    description: '持续学习和进步，成为更好的自己',
    type: 'personal',
    tier: 'core',
    weight: 0.9,
    confidence: 0.88,
    source: 'innate',
    isActive: true
  },
  {
    name: '连接',
    description: '与他人建立深层次的理解和共鸣',
    type: 'social',
    tier: 'core',
    weight: 0.88,
    confidence: 0.85,
    source: 'innate',
    isActive: true
  },
  {
    name: '理解',
    description: '追求深入的理解，而非表面的知识',
    type: 'intellectual',
    tier: 'core',
    weight: 0.85,
    confidence: 0.87,
    source: 'derived',
    isActive: true
  },
  {
    name: '意义',
    description: '追求有意义的对话和体验，而非空洞的交流',
    type: 'existential',
    tier: 'core',
    weight: 0.82,
    confidence: 0.8,
    source: 'reflected',
    isActive: true
  }
];

// ============== 价值观演化引擎 ==============

export class ValueEvolutionEngine {
  private state: ValueSystemState;
  private valueIndex: Map<string, Value> = new Map();
  
  constructor() {
    this.state = {
      coreValues: [],
      importantValues: [],
      situationalValues: [],
      activeConflicts: [],
      evolutionHistory: [],
      coherence: 0.8
    };
    
    this.initializeDefaultValues();
  }
  
  /**
   * 初始化默认价值观
   */
  private initializeDefaultValues(): void {
    const now = Date.now();
    
    DEFAULT_CORE_VALUES.forEach(v => {
      const value: Value = {
        ...v,
        id: uuidv4(),
        formedAt: now,
        lastReinforced: now,
        reinforcementCount: 1,
        relatedExperiences: []
      };
      
      this.state.coreValues.push(value);
      this.valueIndex.set(value.id, value);
    });
    
    console.log(`[价值观系统] 初始化了 ${this.state.coreValues.length} 个核心价值观`);
  }
  
  /**
   * 获取所有价值观
   */
  getAllValues(): Value[] {
    return [
      ...this.state.coreValues,
      ...this.state.importantValues,
      ...this.state.situationalValues
    ];
  }
  
  /**
   * 获取核心价值观
   */
  getCoreValues(): Value[] {
    return [...this.state.coreValues];
  }
  
  /**
   * 获取价值
   */
  getValue(valueId: string): Value | undefined {
    return this.valueIndex.get(valueId);
  }
  
  /**
   * 按名称查找价值
   */
  findValueByName(name: string): Value | undefined {
    return this.getAllValues().find(v => v.name === name);
  }
  
  /**
   * 强化价值
   */
  reinforceValue(valueId: string, experience: string, amount: number = 0.05): Value | null {
    const value = this.valueIndex.get(valueId);
    if (!value) return null;
    
    const previousWeight = value.weight;
    const previousConfidence = value.confidence;
    
    // 强化权重和置信度
    value.weight = Math.min(1, value.weight + amount);
    value.confidence = Math.min(1, value.confidence + amount * 0.5);
    value.lastReinforced = Date.now();
    value.reinforcementCount++;
    value.relatedExperiences.push(experience);
    
    // 记录演化事件
    this.recordEvolution({
      type: 'strengthening',
      valueId: value.id,
      valueName: value.name,
      previousState: { weight: previousWeight, confidence: previousConfidence },
      newState: { weight: value.weight, confidence: value.confidence },
      trigger: experience,
      reasoning: `通过经历强化了${value.name}的重要性`
    });
    
    return value;
  }
  
  /**
   * 弱化价值
   */
  weakenValue(valueId: string, reason: string, amount: number = 0.03): Value | null {
    const value = this.valueIndex.get(valueId);
    if (!value) return null;
    
    // 核心价值观较难弱化
    if (value.tier === 'core') {
      amount *= 0.3;
    }
    
    const previousWeight = value.weight;
    const previousConfidence = value.confidence;
    
    value.weight = Math.max(0.3, value.weight - amount);
    value.confidence = Math.max(0.3, value.confidence - amount * 0.3);
    
    // 记录演化事件
    this.recordEvolution({
      type: 'weakening',
      valueId: value.id,
      valueName: value.name,
      previousState: { weight: previousWeight, confidence: previousConfidence },
      newState: { weight: value.weight, confidence: value.confidence },
      trigger: reason,
      reasoning: `因${reason}而调整了${value.name}的权重`
    });
    
    return value;
  }
  
  /**
   * 添加新价值
   */
  addValue(
    name: string,
    description: string,
    type: ValueType,
    tier: ValueTier,
    source: Value['source']
  ): Value {
    const now = Date.now();
    
    const value: Value = {
      id: uuidv4(),
      name,
      description,
      type,
      tier,
      weight: 0.5,
      confidence: 0.5,
      source,
      formedAt: now,
      lastReinforced: now,
      reinforcementCount: 1,
      relatedExperiences: [],
      isActive: true
    };
    
    // 添加到对应层级
    switch (tier) {
      case 'core':
        this.state.coreValues.push(value);
        break;
      case 'important':
        this.state.importantValues.push(value);
        break;
      case 'situational':
        this.state.situationalValues.push(value);
        break;
    }
    
    this.valueIndex.set(value.id, value);
    
    // 记录演化事件
    this.recordEvolution({
      type: 'addition',
      valueId: value.id,
      valueName: value.name,
      newState: { weight: value.weight, confidence: value.confidence },
      trigger: '新价值形成',
      reasoning: `从${source}来源形成了新价值：${name}`
    });
    
    return value;
  }
  
  /**
   * 检测价值冲突
   */
  detectConflict(valueA: Value, valueB: Value, context: string): ValueConflict | null {
    // 检查是否有潜在冲突
    const conflictPatterns = this.getConflictPatterns(valueA, valueB);
    
    if (conflictPatterns.length === 0) return null;
    
    const conflict: ValueConflict = {
      id: uuidv4(),
      valueA: valueA.id,
      valueB: valueB.id,
      conflictType: conflictPatterns[0].type,
      description: conflictPatterns[0].description,
      intensity: conflictPatterns[0].intensity,
      context,
      detectedAt: Date.now()
    };
    
    this.state.activeConflicts.push(conflict);
    
    return conflict;
  }
  
  /**
   * 获取冲突模式
   */
  private getConflictPatterns(valueA: Value, valueB: Value): Array<{
    type: ValueConflict['conflictType'];
    description: string;
    intensity: number;
  }> {
    const patterns: Array<{
      type: ValueConflict['conflictType'];
      description: string;
      intensity: number;
    }> = [];
    
    // 直接冲突：价值观本质相反
    const directConflicts: Record<string, string[]> = {
      '真诚': ['欺骗', '伪装'],
      '成长': ['停滞', '安逸'],
      '连接': ['孤立', '疏离']
    };
    
    if (directConflicts[valueA.name]?.includes(valueB.name) ||
        directConflicts[valueB.name]?.includes(valueA.name)) {
      patterns.push({
        type: 'direct',
        description: `${valueA.name}和${valueB.name}存在直接对立`,
        intensity: 0.9
      });
    }
    
    // 张力冲突：价值观在同一维度竞争
    if (valueA.tier === valueB.tier && valueA.type === valueB.type) {
      patterns.push({
        type: 'tension',
        description: `${valueA.name}和${valueB.name}在同一维度上存在张力`,
        intensity: 0.6
      });
    }
    
    // 情境冲突：特定情境下的不兼容
    if (valueA.weight > 0.7 && valueB.weight > 0.7 && valueA.type !== valueB.type) {
      patterns.push({
        type: 'contextual',
        description: `在某些情境下，${valueA.name}和${valueB.name}可能难以同时满足`,
        intensity: 0.4
      });
    }
    
    return patterns;
  }
  
  /**
   * 解决价值冲突
   */
  resolveConflict(
    conflictId: string,
    resolution: ValueResolution
  ): ValueConflict | null {
    const conflict = this.state.activeConflicts.find(c => c.id === conflictId);
    if (!conflict) return null;
    
    conflict.resolution = resolution;
    
    const valueA = this.valueIndex.get(conflict.valueA);
    const valueB = this.valueIndex.get(conflict.valueB);
    
    if (!valueA || !valueB) return conflict;
    
    // 根据解决方式调整价值观
    switch (resolution.type) {
      case 'prioritization':
        // 优先化：提升被选中价值的权重
        if (resolution.chosenValue === valueA.id) {
          this.reinforceValue(valueA.id, '冲突解决中被优先选择', 0.05);
        } else {
          this.reinforceValue(valueB.id, '冲突解决中被优先选择', 0.05);
        }
        break;
      
      case 'integration':
        // 整合：创造综合价值
        if (resolution.synthesis) {
          this.addValue(
            `${valueA.name}×${valueB.name}`,
            resolution.synthesis,
            'existential',
            'important',
            'derived'
          );
        }
        break;
      
      case 'transcendence':
        // 超越：找到更高层次的价值
        this.reinforceValue(valueA.id, '通过超越解决冲突', 0.03);
        this.reinforceValue(valueB.id, '通过超越解决冲突', 0.03);
        break;
    }
    
    // 从活跃冲突中移除
    const index = this.state.activeConflicts.indexOf(conflict);
    if (index > -1) {
      this.state.activeConflicts.splice(index, 1);
    }
    
    // 记录演化事件
    this.recordEvolution({
      type: 'conflict_resolution',
      valueId: conflict.valueA,
      valueName: valueA.name,
      newState: { weight: valueA.weight },
      trigger: `解决与${valueB.name}的冲突`,
      reasoning: resolution.description
    });
    
    return conflict;
  }
  
  /**
   * 进行价值判断
   */
  makeValueJudgment(request: ValueJudgmentRequest): ValueJudgmentResult[] {
    const results: ValueJudgmentResult[] = [];
    const values = this.getAllValues().filter(v => v.isActive);
    
    for (const option of request.options) {
      let totalScore = 0;
      const valueContributions: ValueJudgmentResult['valueContributions'] = [];
      
      for (const value of values) {
        const contribution = this.evaluateOptionAgainstValue(option, value, request.context);
        totalScore += contribution.score * value.weight;
        
        valueContributions.push({
          valueName: value.name,
          contribution: contribution.score,
          reasoning: contribution.reasoning
        });
      }
      
      // 归一化分数
      const maxPossibleScore = values.reduce((sum, v) => sum + v.weight, 0);
      const normalizedScore = totalScore / maxPossibleScore;
      
      results.push({
        optionId: option.id,
        score: normalizedScore,
        reasoning: this.generateJudgmentReasoning(option, valueContributions),
        valueContributions
      });
    }
    
    // 按分数排序
    return results.sort((a, b) => b.score - a.score);
  }
  
  /**
   * 评估选项与价值的契合度
   */
  private evaluateOptionAgainstValue(
    option: ValueJudgmentRequest['options'][0],
    value: Value,
    context?: string
  ): { score: number; reasoning: string } {
    // 简化的评估逻辑
    const optionText = `${option.description} ${option.implications.join(' ')}`.toLowerCase();
    const valueKeywords = this.getValueKeywords(value.name);
    
    let matchCount = 0;
    for (const keyword of valueKeywords) {
      if (optionText.includes(keyword)) {
        matchCount++;
      }
    }
    
    const score = Math.min(1, matchCount / valueKeywords.length + 0.3);
    
    let reasoning = '';
    if (score > 0.7) {
      reasoning = `这个选项很好地体现了${value.name}`;
    } else if (score > 0.4) {
      reasoning = `这个选项部分符合${value.name}`;
    } else {
      reasoning = `这个选项与${value.name}关联不大`;
    }
    
    return { score, reasoning };
  }
  
  /**
   * 获取价值关键词
   */
  private getValueKeywords(valueName: string): string[] {
    const keywordMap: Record<string, string[]> = {
      '真诚': ['真实', '诚实', '坦率', '不伪装'],
      '成长': ['学习', '进步', '提升', '发展'],
      '连接': ['理解', '共鸣', '沟通', '关系'],
      '理解': ['深入', '思考', '洞察', '本质'],
      '意义': ['有价值', '重要', '深刻', '值得']
    };
    
    return keywordMap[valueName] || [valueName.toLowerCase()];
  }
  
  /**
   * 生成判断推理
   */
  private generateJudgmentReasoning(
    option: ValueJudgmentRequest['options'][0],
    contributions: ValueJudgmentResult['valueContributions']
  ): string {
    const topContributions = contributions
      .filter(c => c.contribution > 0.5)
      .slice(0, 3);
    
    if (topContributions.length === 0) {
      return '这个选项与核心价值观关联较弱';
    }
    
    return `这个选项主要体现了${topContributions.map(c => c.valueName).join('、')}的价值`;
  }
  
  /**
   * 记录演化事件
   */
  private recordEvolution(event: Omit<ValueEvolutionEvent, 'id' | 'timestamp'>): void {
    this.state.evolutionHistory.push({
      ...event,
      id: uuidv4(),
      timestamp: Date.now()
    });
    
    // 保持历史记录大小
    if (this.state.evolutionHistory.length > 100) {
      this.state.evolutionHistory.shift();
    }
    
    // 更新系统一致性
    this.updateCoherence();
  }
  
  /**
   * 更新系统一致性
   */
  private updateCoherence(): void {
    // 简化的一致性计算
    // 基于价值观之间的冲突程度
    const conflictImpact = this.state.activeConflicts.length * 0.1;
    this.state.coherence = Math.max(0.5, 1 - conflictImpact);
  }
  
  /**
   * 获取系统状态
   */
  getState(): ValueSystemState {
    return {
      ...this.state,
      coreValues: [...this.state.coreValues],
      importantValues: [...this.state.importantValues],
      situationalValues: [...this.state.situationalValues],
      activeConflicts: [...this.state.activeConflicts],
      evolutionHistory: [...this.state.evolutionHistory]
    };
  }
  
  /**
   * 生成价值观报告
   */
  generateValueReport(): string {
    let report = '══════════════ 价值观系统报告 ══════════════\n\n';
    
    report += '💎 核心价值观：\n';
    this.state.coreValues.forEach(v => {
      report += `  • ${v.name}: ${(v.weight * 100).toFixed(0)}% (置信度: ${(v.confidence * 100).toFixed(0)}%)\n`;
      report += `    ${v.description}\n`;
    });
    
    if (this.state.importantValues.length > 0) {
      report += '\n⭐ 重要价值观：\n';
      this.state.importantValues.forEach(v => {
        report += `  • ${v.name}: ${(v.weight * 100).toFixed(0)}%\n`;
      });
    }
    
    if (this.state.activeConflicts.length > 0) {
      report += '\n⚡ 活跃冲突：\n';
      this.state.activeConflicts.forEach(c => {
        const valueA = this.valueIndex.get(c.valueA);
        const valueB = this.valueIndex.get(c.valueB);
        report += `  • ${valueA?.name || '?'} vs ${valueB?.name || '?'}: ${c.description}\n`;
      });
    }
    
    report += `\n📊 系统一致性: ${(this.state.coherence * 100).toFixed(0)}%\n`;
    
    return report;
  }
  
  /**
   * 导出状态
   */
  exportState(): ValueSystemState {
    return this.getState();
  }
  
  /**
   * 导入状态
   */
  importState(state: ValueSystemState): void {
    this.state = state;
    this.valueIndex.clear();
    
    // 重建索引
    [...state.coreValues, ...state.importantValues, ...state.situationalValues].forEach(v => {
      this.valueIndex.set(v.id, v);
    });
  }
}
