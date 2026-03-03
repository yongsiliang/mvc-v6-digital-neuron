/**
 * ═══════════════════════════════════════════════════════════════════════
 * 深度决策器 (Depth Decider)
 * 
 * 来源：consciousness-compiler/scheduler/depth-decider.ts
 * 改进：融入 SSM+MCTS 控制器
 * 
 * 核心概念：
 * - 输入复杂度估计：多维度评分
 * - 关键词识别：识别需要深度思考的输入
 * - 结构分析：基于句子结构判断复杂度
 * - 动态深度推荐
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { EnergyState } from './energy-budget';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 深度决策配置
 */
export interface DepthDeciderConfig {
  /** 最大深度 */
  maxDepth: number;
  
  /** 每层能量消耗 */
  energyPerDepth: number;
  
  /** 深度关键词（触发深度思考） */
  depthKeywords: string[];
  
  /** 简单关键词（触发浅层思考） */
  simpleKeywords: string[];
  
  /** 结构加分关键词 */
  structureKeywords: string[];
}

/**
 * 复杂度评分结果
 */
export interface ComplexityScore {
  /** 总评分 (0-1) */
  total: number;
  
  /** 长度评分 */
  length: number;
  
  /** 关键词评分 */
  keywords: number;
  
  /** 结构评分 */
  structure: number;
  
  /** 识别到的深度关键词 */
  matchedDepthKeywords: string[];
  
  /** 识别到的简单关键词 */
  matchedSimpleKeywords: string[];
}

/**
 * 深度决策结果
 */
export interface DepthDecision {
  /** 推荐深度 */
  depth: number;
  
  /** 复杂度评分 */
  complexity: ComplexityScore;
  
  /** 决策理由 */
  reason: string;
  
  /** 是否需要深度思考 */
  needsDeepThinking: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

/**
 * 深度关键词（触发深度思考）
 */
export const DEPTH_KEYWORDS = [
  // 哲学/存在
  '本质', '原理', '为什么', '如何', '理解', '思考',
  '意识', '意义', '存在', '哲学', '深入', '探索',
  
  // 分析/推理
  '分析', '推理', '逻辑', '关系', '结构', '系统',
  '比较', '对比', '归纳', '演绎', '推导', '证明',
  
  // 创造/设计
  '设计', '创造', '发明', '创新', '构建', '规划',
  
  // 情感/反思
  '感受', '反思', '觉察', '体验', '感悟', '领悟',
];

/**
 * 简单关键词（触发浅层思考）
 */
export const SIMPLE_KEYWORDS = [
  '你好', '谢谢', '再见', '好的', '嗯', '哦',
  '是什么', '怎么样', '可以吗', '知道吗',
  '对了', '嗨', '哈喽', '早上好', '晚上好',
];

/**
 * 结构关键词（句子结构特征）
 */
export const STRUCTURE_KEYWORDS = [
  '但是', '因为', '所以', '如果', '虽然', '但是',
  '不仅', '而且', '或者', '以及', '不过', '然而',
];

const DEFAULT_CONFIG: DepthDeciderConfig = {
  maxDepth: 5,
  energyPerDepth: 20,
  depthKeywords: DEPTH_KEYWORDS,
  simpleKeywords: SIMPLE_KEYWORDS,
  structureKeywords: STRUCTURE_KEYWORDS,
};

// ─────────────────────────────────────────────────────────────────────
// 深度决策器
// ─────────────────────────────────────────────────────────────────────

/**
 * 深度决策器
 * 
 * 使用示例：
 * ```typescript
 * const decider = new DepthDecider();
 * 
 * // 决策思考深度
 * const decision = decider.decide(input, energyState);
 * 
 * // 获取复杂度评分
 * const complexity = decider.estimateComplexity(input);
 * ```
 */
export class DepthDecider {
  private config: DepthDeciderConfig;
  
  constructor(config?: Partial<DepthDeciderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 决定思考深度
   * 
   * 综合考虑：
   * 1. 能量限制
   * 2. 好奇心调节
   * 3. 输入复杂度
   * 4. 疲劳度抑制
   */
  decide(input: string, energyState?: Partial<EnergyState>): DepthDecision {
    // 1. 计算复杂度
    const complexity = this.estimateComplexity(input);
    
    // 2. 能量限制（如果提供）
    let maxByEnergy = this.config.maxDepth;
    if (energyState?.current !== undefined && energyState.current > 0) {
      const energyPerDepth = this.config.energyPerDepth;
      maxByEnergy = Math.floor(energyState.current / energyPerDepth);
    }
    
    // 3. 好奇心调节
    const curiosityFactor = energyState?.curiosity ?? 0.5;
    
    // 4. 疲劳度抑制
    const fatigue = energyState?.fatigue ?? 0;
    const fatigueFactor = 1 - fatigue / 200;
    
    // 5. 综合计算
    const rawDepth = complexity.total * curiosityFactor * fatigueFactor * this.config.maxDepth;
    const depth = Math.max(1, Math.min(
      Math.round(rawDepth),
      Math.min(maxByEnergy, this.config.maxDepth)
    ));
    
    // 6. 决策理由
    const reason = this.generateReason(depth, complexity, energyState);
    
    return {
      depth,
      complexity,
      reason,
      needsDeepThinking: depth >= 3,
    };
  }
  
  /**
   * 估计输入复杂度
   * 
   * 多因素综合评分
   */
  estimateComplexity(input: string): ComplexityScore {
    const length = this.scoreByLength(input);
    const keywords = this.scoreByKeywords(input);
    const structure = this.scoreByStructure(input);
    
    // 加权平均
    const total = 0.3 * length + 0.4 * keywords.total + 0.3 * structure;
    
    return {
      total: Math.max(0.1, Math.min(1, total)),
      length,
      keywords: keywords.total,
      structure,
      matchedDepthKeywords: keywords.depthMatches,
      matchedSimpleKeywords: keywords.simpleMatches,
    };
  }
  
  /**
   * 快速判断是否需要深度思考
   */
  needsDeepThinking(input: string): boolean {
    // 快速检查
    for (const keyword of this.config.depthKeywords) {
      if (input.includes(keyword)) {
        return true;
      }
    }
    
    // 结构检查
    if (input.length > 100 || input.includes('？') || input.includes('?')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取推荐模拟次数
   */
  getRecommendedSimulations(complexity: number): number {
    const base = 10;
    const max = 100;
    return Math.floor(base + complexity * (max - base));
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<DepthDeciderConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   */
  getConfig(): DepthDeciderConfig {
    return { ...this.config };
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 私有方法：评分函数
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 基于长度的评分
   */
  private scoreByLength(input: string): number {
    const length = input.length;
    if (length < 20) return 0.2;
    if (length < 50) return 0.4;
    if (length < 100) return 0.6;
    if (length < 200) return 0.8;
    return 1.0;
  }
  
  /**
   * 基于关键词的评分
   */
  private scoreByKeywords(input: string): {
    total: number;
    depthMatches: string[];
    simpleMatches: string[];
  } {
    let score = 0.5; // 基础分
    const depthMatches: string[] = [];
    const simpleMatches: string[] = [];
    
    // 深度关键词加分
    for (const keyword of this.config.depthKeywords) {
      if (input.includes(keyword)) {
        score += 0.1;
        depthMatches.push(keyword);
      }
    }
    
    // 简单关键词减分
    for (const keyword of this.config.simpleKeywords) {
      if (input.includes(keyword)) {
        score -= 0.15;
        simpleMatches.push(keyword);
      }
    }
    
    return {
      total: Math.max(0.1, Math.min(1, score)),
      depthMatches,
      simpleMatches,
    };
  }
  
  /**
   * 基于结构的评分
   */
  private scoreByStructure(input: string): number {
    let score = 0.5;
    
    // 有问号
    if (input.includes('?') || input.includes('？')) {
      score += 0.1;
    }
    
    // 多个句子
    const sentences = input.split(/[。！？.!?]/).filter(s => s.trim());
    if (sentences.length > 2) {
      score += 0.1;
    }
    if (sentences.length > 4) {
      score += 0.1;
    }
    
    // 有逻辑连接词
    for (const keyword of this.config.structureKeywords) {
      if (input.includes(keyword)) {
        score += 0.15;
        break;
      }
    }
    
    // 有引号（引用或强调）
    if (input.includes('"') || input.includes('"') || input.includes('「') || input.includes('『')) {
      score += 0.1;
    }
    
    // 有列表（编号或项目符号）
    if (/\d+[.、]/.test(input) || /[-•·]/.test(input)) {
      score += 0.1;
    }
    
    return Math.max(0.1, Math.min(1, score));
  }
  
  /**
   * 生成决策理由
   */
  private generateReason(
    depth: number,
    complexity: ComplexityScore,
    energyState?: Partial<EnergyState>
  ): string {
    const parts: string[] = [];
    
    // 深度描述
    if (depth >= 4) {
      parts.push('深度思考');
    } else if (depth >= 3) {
      parts.push('中等深度思考');
    } else if (depth >= 2) {
      parts.push('浅层思考');
    } else {
      parts.push('快速响应');
    }
    
    // 复杂度因素
    if (complexity.matchedDepthKeywords.length > 0) {
      parts.push(`检测到深度关键词: ${complexity.matchedDepthKeywords.slice(0, 3).join(', ')}`);
    }
    if (complexity.matchedSimpleKeywords.length > 0) {
      parts.push(`检测到简单关键词: ${complexity.matchedSimpleKeywords.slice(0, 3).join(', ')}`);
    }
    
    // 能量因素
    if (energyState?.current !== undefined) {
      if (energyState.current < 30) {
        parts.push('能量较低，限制深度');
      }
    }
    
    // 疲劳因素
    if (energyState?.fatigue !== undefined && energyState.fatigue > 50) {
      parts.push(`疲劳度 ${Math.round(energyState.fatigue)}%，影响效率`);
    }
    
    return parts.join('；');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createDepthDecider(config?: Partial<DepthDeciderConfig>): DepthDecider {
  return new DepthDecider(config);
}

/**
 * 创建默认深度决策器
 */
export function createDefaultDepthDecider(): DepthDecider {
  return new DepthDecider(DEFAULT_CONFIG);
}

export default DepthDecider;
