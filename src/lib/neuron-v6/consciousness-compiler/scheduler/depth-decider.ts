/**
 * 深度决策器
 * 
 * 职责：
 * - 根据输入复杂度和系统状态决定编译深度
 * - 整合能量预算、好奇心、复杂度估计
 */

import type { SystemState } from '../types';
import { clamp } from '../utils/math';

/**
 * 深度决策配置
 */
export interface DepthDeciderConfig {
  /** 最大深度 */
  maxDepth: number;
  /** 每层能量消耗 */
  energyPerDepth: number;
  /** 深度关键词 */
  depthKeywords: string[];
  /** 简单关键词 */
  simpleKeywords: string[];
}

const DEFAULT_CONFIG: DepthDeciderConfig = {
  maxDepth: 5,
  energyPerDepth: 20,
  depthKeywords: [
    '本质', '原理', '为什么', '如何', '理解', '思考',
    '意识', '意义', '存在', '哲学', '深入', '探索',
    '分析', '推理', '逻辑', '关系', '结构', '系统',
  ],
  simpleKeywords: [
    '你好', '谢谢', '再见', '好的', '嗯', '哦',
    '是什么', '怎么样', '可以吗',
  ],
};

/**
 * 深度决策器
 */
export class DepthDecider {
  private config: DepthDeciderConfig;
  
  constructor(config?: Partial<DepthDeciderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 决定编译深度
   * 
   * 综合考虑：
   * 1. 能量限制（能量/单层消耗）
   * 2. 好奇心调节（愿意投入多少）
   * 3. 输入复杂度（需要投入多少）
   */
  decide(input: string, state: SystemState): number {
    // 1. 能量限制
    const maxByEnergy = Math.floor(state.energy / this.config.energyPerDepth);
    
    // 2. 好奇心调节
    const curiosityFactor = state.curiosity;
    
    // 3. 复杂度估计
    const complexity = this.estimateComplexity(input);
    
    // 4. 疲劳度抑制
    const fatigueFactor = 1 - state.fatigue / 200; // 疲劳度越高，抑制越大
    
    // 5. 综合计算
    const rawDepth = complexity * curiosityFactor * fatigueFactor * this.config.maxDepth;
    
    // 6. 限制范围
    const depth = Math.round(clamp(
      rawDepth,
      1,  // 至少1层
      Math.min(maxByEnergy, this.config.maxDepth)
    ));
    
    return depth;
  }
  
  /**
   * 估计输入复杂度
   */
  estimateComplexity(input: string): number {
    // 多因素综合
    const lengthScore = this.scoreByLength(input);
    const keywordScore = this.scoreByKeywords(input);
    const structureScore = this.scoreByStructure(input);
    
    // 加权平均
    return 0.3 * lengthScore + 0.4 * keywordScore + 0.3 * structureScore;
  }
  
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
  private scoreByKeywords(input: string): number {
    let score = 0.5; // 基础分
    
    // 深度关键词加分
    for (const keyword of this.config.depthKeywords) {
      if (input.includes(keyword)) {
        score += 0.1;
      }
    }
    
    // 简单关键词减分
    for (const keyword of this.config.simpleKeywords) {
      if (input.includes(keyword)) {
        score -= 0.15;
      }
    }
    
    return clamp(score, 0.1, 1.0);
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
    
    // 有逻辑连接词
    if (input.includes('但是') || input.includes('因为') || input.includes('所以')) {
      score += 0.15;
    }
    
    // 有引号（引用或强调）
    if (input.includes('"') || input.includes('"') || input.includes('「')) {
      score += 0.1;
    }
    
    return clamp(score, 0.1, 1.0);
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
}
