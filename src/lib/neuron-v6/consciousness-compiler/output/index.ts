/**
 * 输出层
 * 
 * 职责：
 * - Attention聚焦
 * - 理解结果提取
 * - 响应生成
 * 
 * 特性：显式过程
 */

import type { Understanding } from '../types';
import { softmax } from '../utils/math';

/**
 * 输出层配置
 */
export interface OutputLayerConfig {
  /** 聚焦温度 */
  temperature: number;
  /** 最大输出长度 */
  maxOutputLength: number;
  /** 最小置信度阈值 */
  minConfidence: number;
}

const DEFAULT_CONFIG: OutputLayerConfig = {
  temperature: 0.8,
  maxOutputLength: 500,
  minConfidence: 0.3,
};

/**
 * 输出结果
 */
export interface OutputResult {
  /** 生成的响应 */
  response: string;
  /** 置信度 */
  confidence: number;
  /** 使用的理解 */
  understanding: Understanding;
  /** 是否经过聚焦 */
  wasFocused: boolean;
}

/**
 * 输出层
 */
export class OutputLayer {
  private config: OutputLayerConfig;
  
  constructor(config?: Partial<OutputLayerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 处理理解结果并生成输出
   */
  process(understanding: Understanding): OutputResult {
    // 1. 检查置信度
    if (understanding.confidence < this.config.minConfidence) {
      return this.generateLowConfidenceResponse(understanding);
    }
    
    // 2. 聚焦核心概念
    const focusedConcepts = this.focusConcepts(understanding);
    
    // 3. 生成响应
    const response = this.generateResponse(understanding, focusedConcepts);
    
    return {
      response,
      confidence: understanding.confidence,
      understanding,
      wasFocused: true,
    };
  }
  
  /**
   * Attention聚焦
   * 
   * 核心概念：对理解结果中的概念应用 Attention 机制，
   * 突出最重要的内容
   */
  private focusConcepts(understanding: Understanding): string[] {
    const concepts = understanding.derivation;
    
    if (concepts.length === 0) {
      return [];
    }
    
    // 为每个概念计算注意力权重
    // 应用温度缩放
    const weights = concepts.map((_, i) => {
      // 距离核心越近，权重越高
      const positionWeight = 1 / (1 + i);
      // 温度缩放：温度越低，权重差异越明显
      return positionWeight / this.config.temperature;
    });
    
    // 应用 softmax 归一化
    const normalizedWeights = softmax(weights);
    
    // 选择权重最高的概念
    const threshold = 1 / concepts.length;
    const focused = concepts.filter((_, i) => normalizedWeights[i] > threshold);
    
    return focused;
  }
  
  /**
   * 生成响应
   */
  private generateResponse(
    understanding: Understanding,
    focusedConcepts: string[]
  ): string {
    let response = '';
    
    // 1. 核心理解
    if (focusedConcepts.length > 0) {
      response = `理解到 ${focusedConcepts[0]}`;
      
      if (focusedConcepts.length > 1) {
        response += `，与 ${focusedConcepts.slice(1).join('、')} 相关`;
      }
    } else {
      response = understanding.essence;
    }
    
    // 2. 添加推导过程（简化）
    if (understanding.derivation.length > 0) {
      response += `。\n\n推导路径：${understanding.derivation.slice(0, 5).join(' → ')}`;
    }
    
    // 3. 添加置信度
    response += `\n\n置信度：${(understanding.confidence * 100).toFixed(1)}%`;
    
    // 截断
    if (response.length > this.config.maxOutputLength) {
      response = response.slice(0, this.config.maxOutputLength) + '...';
    }
    
    return response;
  }
  
  /**
   * 生成低置信度响应
   */
  private generateLowConfidenceResponse(understanding: Understanding): OutputResult {
    return {
      response: `理解不够充分。核心概念：${understanding.essence}\n\n需要更多信息以形成明确理解。`,
      confidence: understanding.confidence,
      understanding,
      wasFocused: false,
    };
  }
  
  /**
   * 格式化输出
   */
  formatOutput(result: OutputResult): string {
    const lines: string[] = [
      '--- 意识编译输出 ---',
      '',
      result.response,
      '',
      `状态：${result.wasFocused ? '已聚焦' : '未聚焦'}`,
      `时间：${new Date(result.understanding.timestamp).toISOString()}`,
      '--- 结束 ---',
    ];
    
    return lines.join('\n');
  }
}

/**
 * 创建输出层
 */
export function createOutputLayer(config?: Partial<OutputLayerConfig>): OutputLayer {
  return new OutputLayer(config);
}
