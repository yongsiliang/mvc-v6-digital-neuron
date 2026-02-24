/**
 * 竞争性模型神经元池
 * 
 * 灵感来源：大脑神经元的竞争性选择机制
 * - 并行激活：多个神经元同时被输入激活
 * - 竞争性抑制：强信号抑制弱信号，赢家通吃
 * - 动态权重：连接强度随使用反馈调整（Hebbian学习）
 * - 涌现决策：没有中央控制器，决策从竞争中涌现
 */

import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 模型神经元 - 每个模型是一个"神经元"
 */
export interface ModelNeuron {
  id: string;
  name: string;
  
  // 特征敏感度权重（类似神经元的突触权重）
  // 这些权重会随学习动态调整
  featureWeights: {
    reasoning: number;      // 推理类问题的敏感度
    creative: number;       // 创意类问题的敏感度
    factual: number;        // 事实类问题的敏感度
    emotional: number;      // 情感类问题的敏感度
    technical: number;      // 技术类问题的敏感度
    conversational: number; // 对话类问题的敏感度
    analytical: number;     // 分析类问题的敏感度
  };
  
  // 基础激活阈值
  threshold: number;
  
  // 使用统计（用于Hebbian学习）
  usageStats: {
    totalActivations: number;
    successfulActivations: number;
    avgSatisfaction: number;
  };
}

/**
 * 输入特征向量
 */
export interface InputFeatures {
  reasoning: number;      // 推理特征强度
  creative: number;       // 创意特征强度
  factual: number;        // 事实特征强度
  emotional: number;      // 情感特征强度
  technical: number;      // 技术特征强度
  conversational: number; // 对话特征强度
  analytical: number;     // 分析特征强度
  length: number;         // 输入长度归一化
  complexity: number;     // 语义复杂度
}

// Headers 类型
type SDKHeaders = Record<string, string>;

/**
 * 特征提取器 - 从输入中提取特征向量
 * 使用轻量级规则快速评估，不调用LLM
 */
function extractFeatures(input: string, meaningContext?: { interpretation: string }): InputFeatures {
  const text = input.toLowerCase();
  const words = text.split(/\s+/).length;
  
  // 特征关键词库
  const featureKeywords = {
    reasoning: ['为什么', '原因', '推理', '逻辑', '证明', '论证', '如何理解', '解释', '原理', '因为', '所以'],
    creative: ['想象', '创意', '设计', '创作', '如果', '假设', '可能', '故事', '构思', '设想'],
    factual: ['是什么', '定义', '事实', '数据', '统计', '信息', '介绍', '概述', '说明'],
    emotional: ['感觉', '心情', '喜欢', '讨厌', '开心', '难过', '情绪', '感受', '担心', '期待'],
    technical: ['代码', '程序', '算法', '系统', '架构', '技术', '实现', '开发', 'bug', '优化'],
    conversational: ['你好', '谢谢', '请', '能', '可以', '吗', '呢', '吧', '哈', '嗯'],
    analytical: ['分析', '比较', '区别', '关系', '影响', '趋势', '模式', '规律', '评估', '研究'],
  };

  // 计算各特征强度
  const features: InputFeatures = {
    reasoning: 0,
    creative: 0,
    factual: 0,
    emotional: 0,
    technical: 0,
    conversational: 0,
    analytical: 0,
    length: Math.min(input.length / 500, 1),
    complexity: 0,
  };

  // 统计关键词命中
  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        features[feature as keyof typeof features] += 0.2;
      }
    }
    // 归一化到 [0, 1]
    features[feature as keyof typeof features] = Math.min(
      features[feature as keyof typeof features] as number, 
      1
    );
  }

  // 复杂度评估
  features.complexity = (
    features.reasoning * 0.3 +
    features.analytical * 0.3 +
    features.technical * 0.2 +
    features.length * 0.2
  );

  return features;
}

/**
 * 竞争性模型神经元池
 */
export class CompetitiveModelPool {
  private neurons: Map<string, ModelNeuron> = new Map();
  private headers: SDKHeaders;
  
  // 全局抑制系数（类似神经网络的侧向抑制）
  private globalInhibition = 0.1;
  
  constructor(headers: SDKHeaders) {
    this.headers = headers;
    this.initializeNeurons();
  }
  
  /**
   * 初始化模型神经元池
   * 每个模型有不同的初始特征敏感度
   */
  private initializeNeurons() {
    const neuronConfigs: Array<Omit<ModelNeuron, 'usageStats'>> = [
      {
        id: 'doubao-seed-1-6-thinking-250715',
        name: 'Doubao Thinking',
        featureWeights: {
          reasoning: 0.9,
          creative: 0.3,
          factual: 0.5,
          emotional: 0.2,
          technical: 0.6,
          conversational: 0.1,
          analytical: 0.8,
        },
        threshold: 0.4,
      },
      {
        id: 'doubao-seed-2-0-pro-260215',
        name: 'Doubao Pro',
        featureWeights: {
          reasoning: 0.7,
          creative: 0.6,
          factual: 0.7,
          emotional: 0.4,
          technical: 0.8,
          conversational: 0.3,
          analytical: 0.7,
        },
        threshold: 0.3,
      },
      {
        id: 'doubao-seed-2-0-lite-260215',
        name: 'Doubao Lite',
        featureWeights: {
          reasoning: 0.2,
          creative: 0.3,
          factual: 0.4,
          emotional: 0.5,
          technical: 0.2,
          conversational: 0.9,
          analytical: 0.2,
        },
        threshold: 0.2,
      },
      {
        id: 'kimi-k2-250905',
        name: 'Kimi K2',
        featureWeights: {
          reasoning: 0.5,
          creative: 0.4,
          factual: 0.6,
          emotional: 0.3,
          technical: 0.5,
          conversational: 0.4,
          analytical: 0.6,
        },
        threshold: 0.35,
      },
      {
        id: 'deepseek-v3-2-251201',
        name: 'DeepSeek V3.2',
        featureWeights: {
          reasoning: 0.8,
          creative: 0.5,
          factual: 0.6,
          emotional: 0.2,
          technical: 0.9,
          conversational: 0.2,
          analytical: 0.8,
        },
        threshold: 0.35,
      },
      {
        id: 'glm-4-7-251222',
        name: 'GLM-4-7',
        featureWeights: {
          reasoning: 0.6,
          creative: 0.5,
          factual: 0.7,
          emotional: 0.5,
          technical: 0.6,
          conversational: 0.6,
          analytical: 0.5,
        },
        threshold: 0.3,
      },
      {
        id: 'doubao-seed-1-8-251228',
        name: 'Doubao Balanced',
        featureWeights: {
          reasoning: 0.5,
          creative: 0.5,
          factual: 0.5,
          emotional: 0.5,
          technical: 0.5,
          conversational: 0.5,
          analytical: 0.5,
        },
        threshold: 0.25,
      },
    ];
    
    for (const config of neuronConfigs) {
      this.neurons.set(config.id, {
        ...config,
        usageStats: {
          totalActivations: 0,
          successfulActivations: 0,
          avgSatisfaction: 0.5,
        },
      });
    }
  }
  
  /**
   * 计算神经元的激活值
   * 激活值 = 特征向量 · 权重向量 - 阈值 + 历史成功率加成
   */
  private calculateActivation(neuron: ModelNeuron, features: InputFeatures): number {
    // 点积计算基础激活
    let activation = 0;
    const weights = neuron.featureWeights;
    
    activation += features.reasoning * weights.reasoning;
    activation += features.creative * weights.creative;
    activation += features.factual * weights.factual;
    activation += features.emotional * weights.emotional;
    activation += features.technical * weights.technical;
    activation += features.conversational * weights.conversational;
    activation += features.analytical * weights.analytical;
    
    // 归一化
    activation /= 7;
    
    // 减去阈值
    activation -= neuron.threshold;
    
    // 加上复杂度适配
    activation += features.complexity * 0.2;
    
    // 加上历史成功率加成（类似Hebbian学习）
    const successRate = neuron.usageStats.totalActivations > 0
      ? neuron.usageStats.successfulActivations / neuron.usageStats.totalActivations
      : 0.5;
    activation += successRate * 0.1;
    
    // 加上平均满意度加成
    activation += neuron.usageStats.avgSatisfaction * 0.1;
    
    return Math.max(0, activation);
  }
  
  /**
   * 竞争性选择 - 并行激活，赢家通吃
   */
  compete(input: string, meaningContext?: { interpretation: string }): {
    winner: ModelNeuron;
    activation: number;
    allActivations: Array<{ neuron: ModelNeuron; activation: number }>;
    features: InputFeatures;
  } {
    // 1. 提取输入特征
    const features = extractFeatures(input, meaningContext);
    
    // 2. 并行计算所有神经元的激活值
    const activations: Array<{ neuron: ModelNeuron; activation: number }> = [];
    
    for (const neuron of this.neurons.values()) {
      const activation = this.calculateActivation(neuron, features);
      activations.push({ neuron, activation });
    }
    
    // 3. 应用全局抑制（侧向抑制机制）
    // 高激活值会抑制其他神经元
    const maxActivation = Math.max(...activations.map(a => a.activation));
    const inhibitedActivations = activations.map(({ neuron, activation }) => ({
      neuron,
      activation: activation - (maxActivation - activation) * this.globalInhibition,
    }));
    
    // 4. 选择赢家
    inhibitedActivations.sort((a, b) => b.activation - a.activation);
    const winner = inhibitedActivations[0];
    
    // 5. 更新使用统计
    const winnerNeuron = this.neurons.get(winner.neuron.id)!;
    winnerNeuron.usageStats.totalActivations++;
    
    return {
      winner: winner.neuron,
      activation: winner.activation,
      allActivations: inhibitedActivations,
      features,
    };
  }
  
  /**
   * 反馈学习 - Hebbian权重调整
   * 根据使用结果调整神经元的权重
   */
  learn(modelId: string, satisfaction: number /* 0-1 */) {
    const neuron = this.neurons.get(modelId);
    if (!neuron) return;
    
    // 更新成功率
    if (satisfaction > 0.6) {
      neuron.usageStats.successfulActivations++;
    }
    
    // 更新平均满意度（指数移动平均）
    neuron.usageStats.avgSatisfaction = 
      neuron.usageStats.avgSatisfaction * 0.9 + satisfaction * 0.1;
    
    // 调整阈值：高满意度降低阈值（更容易被激活），低满意度提高阈值
    const thresholdAdjust = (satisfaction - 0.5) * 0.01;
    neuron.threshold = Math.max(0.1, Math.min(0.6, neuron.threshold - thresholdAdjust));
  }
  
  /**
   * 获取所有神经元状态
   */
  getNeuronsState(): ModelNeuron[] {
    return Array.from(this.neurons.values());
  }
  
  /**
   * 获取指定模型
   */
  getNeuron(modelId: string): ModelNeuron | undefined {
    return this.neurons.get(modelId);
  }
}

/**
 * 创建全局模型池实例
 */
let globalPool: CompetitiveModelPool | null = null;

export function getModelPool(headers: SDKHeaders): CompetitiveModelPool {
  if (!globalPool) {
    globalPool = new CompetitiveModelPool(headers);
  }
  return globalPool;
}
