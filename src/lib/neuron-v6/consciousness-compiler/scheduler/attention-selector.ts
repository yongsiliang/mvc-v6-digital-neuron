/**
 * Attention模块选择器
 * 
 * 职责：
 * - 使用Attention机制选择激活哪些模块
 * - 在能量预算内优化模块组合
 */

import type { ModuleDefinition } from '../types';
import { MODULES } from '../types';
import { attentionWeights, weightedSum } from '../utils/attention';
import { randomVector, dot, magnitude } from '../utils/vector';
import { softmax, clamp } from '../utils/math';

/**
 * 模块选择结果
 */
export interface ModuleSelection {
  /** 选中的模块名 */
  selected: string[];
  /** 每个模块的权重 */
  weights: Map<string, number>;
  /** 总能量消耗 */
  totalCost: number;
}

/**
 * 模块选择器配置
 */
export interface AttentionSelectorConfig {
  /** 可用模块 */
  modules: ModuleDefinition[];
  /** 向量维度 */
  vectorDimension: number;
}

const DEFAULT_CONFIG: AttentionSelectorConfig = {
  modules: MODULES,
  vectorDimension: 4,
};

/**
 * Attention模块选择器
 */
export class AttentionSelector {
  private config: AttentionSelectorConfig;
  private queryVector: number[];
  
  constructor(config?: Partial<AttentionSelectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryVector = randomVector(this.config.vectorDimension);
  }
  
  /**
   * 选择模块
   * 
   * 流程：
   * 1. 将输入编码为Query向量
   * 2. 计算每个模块的Attention分数
   * 3. 在能量预算内选择模块
   */
  select(input: string, energyBudget: number): ModuleSelection {
    // 1. 编码输入为Query
    const query = this.encodeInput(input);
    
    // 2. 获取所有模块的Key
    const keys = this.config.modules.map(m => m.key);
    
    // 3. 计算Attention权重
    const attentionW = attentionWeights(query, keys);
    
    // 4. 创建带分数的模块列表
    const moduleScores = this.config.modules.map((m, i) => ({
      name: m.name,
      score: attentionW[i],
      cost: m.cost,
      description: m.description,
    }));
    
    // 5. 按分数排序
    moduleScores.sort((a, b) => b.score - a.score);
    
    // 6. 在能量预算内选择
    const selected: string[] = [];
    const weights = new Map<string, number>();
    let totalCost = 0;
    
    for (const m of moduleScores) {
      if (totalCost + m.cost <= energyBudget) {
        selected.push(m.name);
        weights.set(m.name, m.score);
        totalCost += m.cost;
      }
    }
    
    return { selected, weights, totalCost };
  }
  
  /**
   * 编码输入为Query向量
   * 
   * 将输入文本转换为一个向量，用于与模块Key进行Attention计算
   */
  private encodeInput(input: string): number[] {
    // 基础Query向量
    let query = [...this.queryVector];
    
    // 根据输入特征调整
    const features = this.extractFeatures(input);
    
    // 加权融合
    for (let i = 0; i < query.length; i++) {
      query[i] = query[i] * 0.5 + features[i] * 0.5;
    }
    
    return query;
  }
  
  /**
   * 提取输入特征
   */
  private extractFeatures(input: string): number[] {
    // 4维特征向量对应4个模块
    const features = [0, 0, 0, 0];
    
    // 感知特征（索引0）：基础输入处理
    features[0] = 0.5 + (input.length > 20 ? 0.3 : 0);
    
    // 洞察特征（索引1）：深度思考关键词
    if (/本质|原理|理解|洞见|发现/.test(input)) {
      features[1] = 0.8;
    } else if (/为什么|如何|思考/.test(input)) {
      features[1] = 0.5;
    } else {
      features[1] = 0.2;
    }
    
    // 升维特征（索引2）：抽象概念
    if (/意识|存在|哲学|意义|系统|结构/.test(input)) {
      features[2] = 0.9;
    } else if (/关系|本质|原理/.test(input)) {
      features[2] = 0.5;
    } else {
      features[2] = 0.1;
    }
    
    // 动机特征（索引3）：目标导向
    if (/目标|想要|希望|计划|学习/.test(input)) {
      features[3] = 0.7;
    } else if (/接下来|以后|未来/.test(input)) {
      features[3] = 0.4;
    } else {
      features[3] = 0.2;
    }
    
    // 归一化
    const mag = magnitude(features);
    if (mag > 0) {
      for (let i = 0; i < features.length; i++) {
        features[i] /= mag;
      }
    }
    
    return features;
  }
  
  /**
   * 更新Query向量（学习）
   */
  updateQuery(feedback: number[]): void {
    // 根据反馈调整Query向量
    for (let i = 0; i < this.queryVector.length; i++) {
      this.queryVector[i] += 0.01 * (feedback[i] - this.queryVector[i]);
    }
  }
  
  /**
   * 获取当前Query向量
   */
  getQuery(): number[] {
    return [...this.queryVector];
  }
  
  /**
   * 获取模块列表
   */
  getModules(): ModuleDefinition[] {
    return [...this.config.modules];
  }
}
