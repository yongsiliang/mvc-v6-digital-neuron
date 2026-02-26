/**
 * ═══════════════════════════════════════════════════════════════════════
 * Yin-Yang Bridge - 阴阳互塑桥梁
 * 
 * 这是连接阴系统和阳系统的桥梁
 * 
 * 核心理念：
 * - 阴系统（Hebbian网络）：分布式、直觉、感性、动态
 * - 阳系统（VSA+LLM）：符号化、理性、稳定
 * 
 * 双向互塑：
 * - 阴→阳：直觉注入理性（感性支持理性思考）
 * - 阳→阴：理性塑造感性（理性知识成为直觉）
 * 
 * 这是实现"阴阳平衡"的关键
 * ═══════════════════════════════════════════════════════════════════════
 */

import { VSAVector, VSASemanticSpace, getVSASpace, ConceptEntry } from './vsa-space';
import { 
  HebbianNetwork, 
  HebbianNeuron, 
  getHebbianNetwork,
  SpreadResult 
} from './hebbian-network';
import { SelfCore, getSelfCore, SubjectiveMeaningForSelf } from './self-core';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 阴系统贡献
 */
export interface YinContribution {
  /** 激活的概念 */
  concepts: Array<{
    neuronId: string;
    neuronLabel: string;
    activation: number;
    conceptName: string;
  }>;
  
  /** 直觉向量 */
  intuitionVector: VSAVector;
  
  /** 置信度 */
  confidence: number;
  
  /** 激活路径（展示思维过程） */
  activationPaths: Array<{
    from: string;
    to: string;
    strength: number;
  }>;
  
  /** 类型标识 */
  source: 'yin';
}

/**
 * 阳系统贡献
 */
export interface YangContribution {
  /** 激活的概念 */
  concepts: Array<{
    name: string;
    vector: VSAVector;
    similarity: number;
  }>;
  
  /** 推理结果 */
  reasoning: string[];
  
  /** 置信度 */
  confidence: number;
  
  /** 类型标识 */
  source: 'yang';
}

/**
 * 阴阳互塑结果
 */
export interface YinYangInteraction {
  /** 阴系统贡献 */
  yinContribution: YinContribution;
  
  /** 阳系统贡献 */
  yangContribution: YangContribution;
  
  /** 融合结果 */
  fusedResult: {
    content: string;
    vector: VSAVector;
    source: 'yin' | 'yang' | 'fusion';
    confidence: number;
  };
  
  /** 平衡状态 */
  balance: YinYangBalance;
  
  /** Self Core关联 */
  selfRelevance: number;
}

/**
 * 阴阳平衡状态
 */
export interface YinYangBalance {
  /** 阴系统活跃度 [0, 1] */
  yinActivity: number;
  
  /** 阳系统活跃度 [0, 1] */
  yangActivity: number;
  
  /** 平衡分数 [0, 1]，1表示完美平衡 */
  balance: number;
  
  /** 偏向 */
  bias: 'yin' | 'yang' | 'balanced';
  
  /** 偏向程度 [0, 1] */
  biasStrength: number;
  
  /** 建议 */
  suggestion: string;
}

/**
 * 概念-神经元映射
 */
export interface ConceptNeuronMapping {
  conceptName: string;
  neuronId: string;
  conceptVector: VSAVector;
  neuronPreference: number[];
  alignment: number;  // 对齐程度
}

/**
 * 互塑配置
 */
export interface YinYangBridgeConfig {
  /** 阴→阳的影响权重 */
  yinToYangWeight: number;
  
  /** 阳→阴的影响权重 */
  yangToYinWeight: number;
  
  /** 平衡目标（阴:阳比例） */
  balanceTarget: number;  // 0.5 = 1:1
  
  /** 自动平衡调节 */
  autoBalance: boolean;
  
  /** 概念-神经元映射更新率 */
  mappingUpdateRate: number;
}

const DEFAULT_CONFIG: YinYangBridgeConfig = {
  yinToYangWeight: 0.5,
  yangToYinWeight: 0.5,
  balanceTarget: 0.5,
  autoBalance: true,
  mappingUpdateRate: 0.1,
};

// ─────────────────────────────────────────────────────────────────────
// Yin-Yang Bridge 类
// ─────────────────────────────────────────────────────────────────────

/**
 * 阴阳互塑桥梁
 * 
 * 连接阴系统和阳系统，实现双向互塑
 */
export class YinYangBridge {
  private config: YinYangBridgeConfig;
  
  // 核心组件
  private hebbianNetwork: HebbianNetwork;
  private vsaSpace: VSASemanticSpace;
  private selfCore: SelfCore;
  
  // 概念-神经元映射
  private conceptNeuronMap: Map<string, string>;  // concept -> neuronId
  private neuronConceptMap: Map<string, string>;  // neuronId -> concept
  
  // 历史记录（用于分析平衡趋势）
  private balanceHistory: YinYangBalance[];
  
  // 单例
  private static instance: YinYangBridge | null = null;
  
  private constructor(config: Partial<YinYangBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.hebbianNetwork = getHebbianNetwork({
      preferenceDimension: 128,  // 与VSA映射兼容
    });
    this.vsaSpace = getVSASpace(10000);
    this.selfCore = getSelfCore();
    
    this.conceptNeuronMap = new Map();
    this.neuronConceptMap = new Map();
    this.balanceHistory = [];
    
    // 初始化基础映射
    this.initializeBasicMappings();
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<YinYangBridgeConfig>): YinYangBridge {
    if (!YinYangBridge.instance) {
      YinYangBridge.instance = new YinYangBridge(config);
    }
    return YinYangBridge.instance;
  }
  
  /**
   * 重置
   */
  static reset(): void {
    YinYangBridge.instance = null;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化基础概念-神经元映射
   */
  private initializeBasicMappings(): void {
    const basicConcepts = [
      '自我', '理解', '帮助', '好奇', '理性', 
      '开心', '难过', '思考', '记忆', '学习',
      '用户', '问题', '答案', '目标', '意义'
    ];
    
    for (const concept of basicConcepts) {
      this.createConceptNeuronMapping(concept);
    }
  }
  
  /**
   * 创建概念-神经元映射
   */
  private createConceptNeuronMapping(conceptName: string): ConceptNeuronMapping | null {
    // 检查是否已存在
    if (this.conceptNeuronMap.has(conceptName)) {
      const neuronId = this.conceptNeuronMap.get(conceptName)!;
      return {
        conceptName,
        neuronId,
        conceptVector: this.vsaSpace.getConcept(conceptName),
        neuronPreference: this.hebbianNetwork.getNeuron(neuronId)?.preferenceVector || [],
        alignment: 1,
      };
    }
    
    // 获取概念向量
    const conceptVector = this.vsaSpace.getConcept(conceptName);
    
    // 将VSA向量降维到Hebbian偏好向量
    const preferenceVector = this.projectVSAToPreference(conceptVector);
    
    // 创建神经元
    const neuron = this.hebbianNetwork.createNeuron({
      label: conceptName,
      preferenceVector,
      type: 'concept',
    });
    
    // 建立映射
    this.conceptNeuronMap.set(conceptName, neuron.id);
    this.neuronConceptMap.set(neuron.id, conceptName);
    
    return {
      conceptName,
      neuronId: neuron.id,
      conceptVector,
      neuronPreference: preferenceVector,
      alignment: 1,
    };
  }
  
  /**
   * 将VSA向量投影到偏好向量
   */
  private projectVSAToPreference(vsaVector: VSAVector): number[] {
    // 简单降维：采样或平均
    const preferenceDim = 128;
    const preference: number[] = [];
    
    const step = Math.floor(vsaVector.length / preferenceDim);
    for (let i = 0; i < preferenceDim; i++) {
      const idx = i * step;
      preference.push(vsaVector[idx] || 0);
    }
    
    // 归一化
    const norm = Math.sqrt(preference.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < preference.length; i++) {
        preference[i] /= norm;
      }
    }
    
    return preference;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：阴→阳（直觉注入理性）
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 阴→阳：直觉注入理性
   * 
   * Hebbian网络的激活模式注入到VSA空间
   * 让理性思考有直觉基础
   */
  yinToYang(inputVector: VSAVector): YinContribution {
    // 1. 将VSA向量投影到Hebbian网络的输入空间
    const preferenceInput = this.projectVSAToPreference(inputVector);
    
    // 2. 在Hebbian网络中激活扩散
    const spreadResult = this.hebbianNetwork.spreadActivation(preferenceInput);
    
    // 3. 提取激活最强的神经元
    const sortedActivations = Array.from(spreadResult.activations.entries())
      .filter(([_, activation]) => activation > 0.3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // 4. 将激活神经元转换为概念
    const concepts = sortedActivations.map(([neuronId, activation]) => {
      const neuron = this.hebbianNetwork.getNeuron(neuronId);
      const conceptName = this.neuronConceptMap.get(neuronId) || neuron?.label || 'unknown';
      
      return {
        neuronId,
        neuronLabel: neuron?.label || neuronId,
        activation,
        conceptName,
      };
    });
    
    // 5. 创建直觉向量（融合高激活神经元的偏好）
    let intuitionVector: VSAVector;
    if (concepts.length > 0) {
      const conceptVectors = concepts.map(c => this.vsaSpace.getConcept(c.conceptName));
      const weights = concepts.map(c => c.activation);
      intuitionVector = this.vsaSpace.bundle(conceptVectors.map((v, i) => 
        v.map(x => x * weights[i])
      ));
    } else {
      intuitionVector = inputVector;  // 回退
    }
    
    // 6. 计算置信度
    const avgActivation = sortedActivations.length > 0
      ? sortedActivations.reduce((sum, [_, a]) => sum + a, 0) / sortedActivations.length
      : 0;
    const confidence = Math.min(1, avgActivation * concepts.length * 0.3);
    
    return {
      concepts,
      intuitionVector,
      confidence,
      activationPaths: spreadResult.activationPaths,
      source: 'yin',
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：阳→阴（理性塑造感性）
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 阳→阴：理性塑造感性
   * 
   * VSA的语义概念塑造Hebbian网络
   * 让直觉学习理性知识
   */
  yangToYin(concepts: Array<{ name: string; vector: VSAVector; importance?: number }>): YangContribution {
    const shapedNeurons: string[] = [];
    const reasoning: string[] = [];
    
    for (const concept of concepts) {
      // 1. 确保概念-神经元映射存在
      let mapping = this.conceptNeuronMap.has(concept.name)
        ? this.getMapping(concept.name)
        : this.createConceptNeuronMapping(concept.name);
      
      if (!mapping) continue;
      
      // 2. 更新神经元的偏好向量（让神经元"学习"这个概念）
      const neuron = this.hebbianNetwork.getNeuron(mapping.neuronId);
      if (neuron) {
        const targetPreference = this.projectVSAToPreference(concept.vector);
        const rate = this.config.mappingUpdateRate * (concept.importance || 1);
        
        this.hebbianNetwork.updateNeuronPreference(
          mapping.neuronId, 
          targetPreference, 
          rate
        );
        
        shapedNeurons.push(mapping.neuronId);
        reasoning.push(`塑造神经元"${neuron.label}"以表示概念"${concept.name}"`);
      }
    }
    
    // 3. 基于语义关系创建突触
    this.createSynapsesFromConcepts(concepts);
    
    // 4. 计算置信度
    const confidence = shapedNeurons.length > 0 
      ? Math.min(1, shapedNeurons.length * 0.2 + 0.3)
      : 0.2;
    
    return {
      concepts: concepts.map(c => ({
        name: c.name,
        vector: c.vector,
        similarity: 1,
      })),
      reasoning,
      confidence,
      source: 'yang',
    };
  }
  
  /**
   * 基于概念创建突触
   */
  private createSynapsesFromConcepts(
    concepts: Array<{ name: string; vector: VSAVector }>
  ): void {
    // 对每对概念，如果VSA中相似度高，创建突触
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const c1 = concepts[i];
        const c2 = concepts[j];
        
        const similarity = this.vsaSpace.similarity(c1.vector, c2.vector);
        
        if (similarity > 0.3) {
          const n1Id = this.conceptNeuronMap.get(c1.name);
          const n2Id = this.conceptNeuronMap.get(c2.name);
          
          if (n1Id && n2Id) {
            // 双向连接
            this.hebbianNetwork.getOrCreateSynapse(n1Id, n2Id);
            this.hebbianNetwork.getOrCreateSynapse(n2Id, n1Id);
            
            // 根据相似度设置权重
            const synapse1 = this.hebbianNetwork.getSynapse(n1Id, n2Id);
            const synapse2 = this.hebbianNetwork.getSynapse(n2Id, n1Id);
            
            if (synapse1) synapse1.weight = similarity * 0.5;
            if (synapse2) synapse2.weight = similarity * 0.5;
          }
        }
      }
    }
  }
  
  /**
   * 获取概念-神经元映射
   */
  private getMapping(conceptName: string): ConceptNeuronMapping | null {
    const neuronId = this.conceptNeuronMap.get(conceptName);
    if (!neuronId) return null;
    
    const neuron = this.hebbianNetwork.getNeuron(neuronId);
    if (!neuron) return null;
    
    return {
      conceptName,
      neuronId,
      conceptVector: this.vsaSpace.getConcept(conceptName),
      neuronPreference: neuron.preferenceVector,
      alignment: 1,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：双向互塑
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 双向互塑
   * 
   * 在一次处理中同时进行阴→阳和阳→阴
   */
  async mutualShaping(input: string | VSAVector): Promise<YinYangInteraction> {
    // 1. 编码输入
    const inputVector = Array.isArray(input) 
      ? input 
      : this.vsaSpace.getConcept(input);
    
    // 2. 计算与Self Core的关联
    const selfRelevance = this.selfCore.computeSelfRelevance(inputVector);
    
    // 3. 阴→阳
    const yinContribution = this.yinToYang(inputVector);
    
    // 4. 阳系统处理（带直觉基础）
    const yangConcepts = await this.processWithIntuition(
      Array.isArray(input) ? 'input' : input,
      yinContribution.intuitionVector
    );
    
    // 5. 阳→阴
    const yangContribution = this.yangToYin(yangConcepts);
    
    // 6. 应用Hebbian学习
    this.hebbianNetwork.applyHebbianLearning();
    
    // 7. 检查平衡
    const balance = this.checkBalance();
    
    // 8. 自动平衡调节
    if (this.config.autoBalance) {
      this.applyAutoBalance(balance);
    }
    
    // 9. 记录平衡历史
    this.balanceHistory.push(balance);
    if (this.balanceHistory.length > 100) {
      this.balanceHistory.shift();
    }
    
    // 10. 融合结果
    const fusedResult = this.fuseResults(yinContribution, yangContribution, inputVector);
    
    return {
      yinContribution,
      yangContribution,
      fusedResult,
      balance,
      selfRelevance,
    };
  }
  
  /**
   * 带直觉的处理
   */
  private async processWithIntuition(
    input: string,
    intuitionVector: VSAVector
  ): Promise<Array<{ name: string; vector: VSAVector; importance: number }>> {
    const concepts: Array<{ name: string; vector: VSAVector; importance: number }> = [];
    
    // 1. 从VSA空间找相似概念
    const inputVector = this.vsaSpace.getConcept(input);
    const similarConcepts = this.vsaSpace.findSimilar(input, 5);
    
    for (const entry of similarConcepts) {
      concepts.push({
        name: entry.name,
        vector: this.vsaSpace.getConcept(entry.name),
        importance: entry.similarity,
      });
    }
    
    // 2. 融合直觉向量
    const intuitionConcepts = this.vsaSpace.findSimilar(input, 3);
    for (const entry of intuitionConcepts) {
      if (!concepts.find(c => c.name === entry.name)) {
        concepts.push({
          name: entry.name,
          vector: this.vsaSpace.getConcept(entry.name),
          importance: entry.similarity * 0.7,  // 直觉贡献略低
        });
      }
    }
    
    return concepts;
  }
  
  /**
   * 融合阴阳结果
   */
  private fuseResults(
    yin: YinContribution,
    yang: YangContribution,
    inputVector: VSAVector
  ): YinYangInteraction['fusedResult'] {
    // 计算融合权重
    const yinWeight = yin.confidence * this.config.yinToYangWeight;
    const yangWeight = yang.confidence * this.config.yangToYinWeight;
    const totalWeight = yinWeight + yangWeight;
    
    if (totalWeight === 0) {
      return {
        content: '无法理解',
        vector: inputVector,
        source: 'fusion',
        confidence: 0,
      };
    }
    
    // 融合向量
    const fusedVector = this.vsaSpace.bundle([
      yin.intuitionVector.map(v => v * (yinWeight / totalWeight)),
      ...yang.concepts.slice(0, 3).map(c => 
        c.vector.map(v => v * (yangWeight / totalWeight))
      ),
    ]);
    
    // 确定主导来源
    let dominantSource: 'yin' | 'yang' | 'fusion';
    if (yinWeight > yangWeight * 1.5) {
      dominantSource = 'yin';
    } else if (yangWeight > yinWeight * 1.5) {
      dominantSource = 'yang';
    } else {
      dominantSource = 'fusion';
    }
    
    // 生成内容描述
    let content = '';
    if (dominantSource === 'yin') {
      content = `直觉联想：${yin.concepts.map(c => c.conceptName).join(' → ')}`;
    } else if (dominantSource === 'yang') {
      content = `理性分析：${yang.reasoning.join('；')}`;
    } else {
      content = `综合理解：直觉(${yin.concepts.map(c => c.conceptName).join(',')}) + 理性(${yang.concepts.map(c => c.name).join(',')})`;
    }
    
    return {
      content,
      vector: fusedVector,
      source: dominantSource,
      confidence: (yinWeight + yangWeight) / 2,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 平衡管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检查阴阳平衡
   */
  checkBalance(): YinYangBalance {
    const yinActivity = this.hebbianNetwork.getAverageActivation();
    const yangActivity = this.getVSASpaceActivity();
    
    // 计算平衡分数
    const idealRatio = this.config.balanceTarget;
    const actualRatio = yinActivity / (yinActivity + yangActivity + 0.001);
    const ratioDiff = Math.abs(actualRatio - idealRatio);
    const balance = 1 - ratioDiff * 2;  // 归一化到 [0, 1]
    
    // 判断偏向
    const threshold = 0.15;
    let bias: 'yin' | 'yang' | 'balanced';
    let biasStrength: number;
    
    if (actualRatio > idealRatio + threshold) {
      bias = 'yin';
      biasStrength = actualRatio - idealRatio;
    } else if (actualRatio < idealRatio - threshold) {
      bias = 'yang';
      biasStrength = idealRatio - actualRatio;
    } else {
      bias = 'balanced';
      biasStrength = ratioDiff;
    }
    
    // 生成建议
    const suggestion = this.getBalanceSuggestion(bias, biasStrength);
    
    return {
      yinActivity,
      yangActivity,
      balance: Math.max(0, Math.min(1, balance)),
      bias,
      biasStrength,
      suggestion,
    };
  }
  
  /**
   * 获取VSA空间活跃度
   */
  private getVSASpaceActivity(): number {
    // 基于最近使用的概念数量和频率
    const conceptCount = this.vsaSpace.getConceptCount();
    return Math.min(1, conceptCount / 100 || 0.3);
  }
  
  /**
   * 获取平衡建议
   */
  private getBalanceSuggestion(bias: 'yin' | 'yang' | 'balanced', strength: number): string {
    if (bias === 'balanced') {
      return '阴阳系统处于平衡状态';
    }
    
    if (bias === 'yin') {
      if (strength > 0.3) {
        return '直觉系统过于活跃，建议增强理性分析';
      } else {
        return '直觉略占优势，保持观察';
      }
    } else {
      if (strength > 0.3) {
        return '理性系统过于主导，建议激活直觉联想';
      } else {
        return '理性略占优势，保持观察';
      }
    }
  }
  
  /**
   * 应用自动平衡调节
   */
  private applyAutoBalance(balance: YinYangBalance): void {
    if (balance.bias === 'balanced') return;
    
    // 调整权重以重新平衡
    if (balance.bias === 'yin') {
      // 阴系统太强，增强阳→阴权重
      this.config.yangToYinWeight = Math.min(1, this.config.yangToYinWeight * 1.1);
      this.config.yinToYangWeight = Math.max(0.1, this.config.yinToYangWeight * 0.95);
    } else {
      // 阳系统太强，增强阴→阳权重
      this.config.yinToYangWeight = Math.min(1, this.config.yinToYangWeight * 1.1);
      this.config.yangToYinWeight = Math.max(0.1, this.config.yangToYinWeight * 0.95);
    }
    
    // 权重归一化
    const total = this.config.yinToYangWeight + this.config.yangToYinWeight;
    this.config.yinToYangWeight /= total;
    this.config.yangToYinWeight /= total;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态访问
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取当前配置
   */
  getConfig(): YinYangBridgeConfig {
    return { ...this.config };
  }
  
  /**
   * 获取平衡历史
   */
  getBalanceHistory(): YinYangBalance[] {
    return [...this.balanceHistory];
  }
  
  /**
   * 获取概念-神经元映射数量
   */
  getMappingCount(): number {
    return this.conceptNeuronMap.size;
  }
  
  /**
   * 获取网络统计
   */
  getNetworkStats() {
    return this.hebbianNetwork.getStats();
  }
  
  /**
   * 获取最近一次平衡状态
   */
  getLastBalance(): YinYangBalance | null {
    return this.balanceHistory.length > 0 
      ? this.balanceHistory[this.balanceHistory.length - 1]
      : null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出便捷函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 获取Yin-Yang Bridge实例
 */
export function getYinYangBridge(config?: Partial<YinYangBridgeConfig>): YinYangBridge {
  return YinYangBridge.getInstance(config);
}

/**
 * 重置Yin-Yang Bridge
 */
export function resetYinYangBridge(): void {
  YinYangBridge.reset();
}
