/**
 * ═══════════════════════════════════════════════════════════════════════
 * SSM + MCTS 混合控制器
 * 
 * 核心理念：
 * - SSM负责状态建模和长期依赖
 * - MCTS负责决策规划和搜索
 * - 两者结合实现高效决策
 * 
 * 黑盒特性：
 * - 决策过程完全隐式
 * - 状态在SSM中压缩
 * - 搜索在MCTS中隐式进行
 * 
 * 新增特性 (P0融入)：
 * - 能量预算系统：控制思考深度和调用频率
 * - 深度决策器：根据输入复杂度动态调整
 * ═══════════════════════════════════════════════════════════════════════
 */

import { SSMLayer, createSSMLayer, type SSMState, type SSMOutput, type SSMConfig } from './ssm-layer';
import { SSMEncoder, createSSMEncoder, type EncoderInput, type EncoderOutput } from './ssm-encoder';
import { SSMDecoder, createSSMDecoder, type DecodedInstruction, type DecodedResponse } from './ssm-decoder';
import { 
  EnergyBudgetManager, 
  createEnergyBudgetManager, 
  type EnergyBudgetConfig,
  type EnergyBudget 
} from './energy-budget';
import {
  DepthDecider,
  createDepthDecider,
  type DepthDeciderConfig,
  type DepthDecision,
  type ComplexityScore,
} from './depth-decider';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 混合控制器配置
 */
export interface SSMMCTSConfig {
  /** SSM配置 */
  ssm: Partial<SSMConfig>;
  
  /** MCTS配置 */
  mcts: {
    /** 最大搜索深度 */
    maxDepth: number;
    
    /** 每次搜索的模拟次数 */
    simulationsPerSearch: number;
    
    /** 探索常数 */
    explorationConstant: number;
    
    /** 是否使用SSM状态作为MCTS节点 */
    useSSMStateAsNode: boolean;
  };
  
  /** 是否启用混沌混淆 */
  enableChaos: boolean;
  
  /** 混沌强度 */
  chaosIntensity: number;
  
  /** 能量预算配置（新增） */
  energyBudget?: Partial<EnergyBudgetConfig>;
  
  /** 深度决策配置（新增） */
  depthDecider?: Partial<DepthDeciderConfig>;
  
  /** 是否启用能量预算（新增） */
  enableEnergyBudget?: boolean;
  
  /** 是否启用深度决策（新增） */
  enableDepthDecider?: boolean;
}

const DEFAULT_HYBRID_CONFIG: SSMMCTSConfig = {
  ssm: {
    stateDimension: 256,
    inputDimension: 256,
    outputDimension: 256,
  },
  mcts: {
    maxDepth: 5,
    simulationsPerSearch: 10,
    explorationConstant: 1.414,
    useSSMStateAsNode: true,
  },
  enableChaos: true,
  chaosIntensity: 0.1,
  // 新增：能量预算和深度决策
  enableEnergyBudget: true,
  enableDepthDecider: true,
};

/**
 * 隐式MCTS节点
 */
export interface ImplicitMCTSNode {
  /** 节点ID */
  id: string;
  
  /** SSM状态 */
  ssmState: SSMState;
  
  /** 价值估计 */
  value: number;
  
  /** 访问次数 */
  visitCount: number;
  
  /** 父节点ID */
  parentId: string | null;
  
  /** 子节点ID列表 */
  childIds: string[];
  
  /** 动作向量（导致此节点的动作） */
  actionVector: Float32Array;
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 最佳动作向量 */
  bestAction: Float32Array;
  
  /** 最佳节点 */
  bestNode: ImplicitMCTSNode;
  
  /** 解码后的指令 */
  decodedInstruction: DecodedInstruction;
  
  /** 搜索路径（节点ID列表） */
  searchPath: string[];
  
  /** 搜索耗时（ms） */
  searchTime: number;
  
  /** 总模拟次数 */
  totalSimulations: number;
}

/**
 * 完整思考结果
 */
export interface ThinkingResult {
  /** 是否需要外部调用 */
  needsExternalCall: boolean;
  
  /** 搜索结果 */
  searchResult: SearchResult;
  
  /** SSM输出 */
  ssmOutput: SSMOutput;
  
  /** 解码响应 */
  decodedResponse: DecodedResponse;
  
  /** 置信度 */
  confidence: number;
  
  /** Token预算 */
  tokenBudget: number;
  
  /** 思考耗时（ms） */
  thinkingTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 隐式价值网络
// ─────────────────────────────────────────────────────────────────────

/**
 * 隐式价值网络
 * 
 * 从SSM状态估计价值
 */
class ImplicitValueNetwork {
  private weights: Float32Array;
  private bias: number;
  private dimension: number;
  
  constructor(dimension: number) {
    this.dimension = dimension;
    this.weights = new Float32Array(dimension);
    this.bias = 0;
    
    // Xavier初始化
    const scale = Math.sqrt(2.0 / dimension);
    for (let i = 0; i < dimension; i++) {
      this.weights[i] = (Math.random() * 2 - 1) * scale;
    }
  }
  
  /**
   * 估计状态价值
   */
  evaluate(state: SSMState): number {
    let sum = this.bias;
    for (let i = 0; i < this.dimension && i < state.h.length; i++) {
      sum += this.weights[i] * state.h[i];
    }
    return Math.tanh(sum);  // 输出在[-1, 1]
  }
  
  /**
   * 从基因组更新
   */
  updateFromGenome(genome: Float32Array): void {
    this.weights.set(genome.slice(0, this.dimension));
    this.bias = genome[this.dimension] || 0;
  }
}

/**
 * 隐式策略网络
 * 
 * 从SSM状态生成动作向量
 */
class ImplicitPolicyNetwork {
  private weights: Float32Array;
  private bias: Float32Array;
  private inputDim: number;
  private outputDim: number;
  
  constructor(inputDim: number, outputDim: number) {
    this.inputDim = inputDim;
    this.outputDim = outputDim;
    this.weights = new Float32Array(inputDim * outputDim);
    this.bias = new Float32Array(outputDim);
    
    const scale = Math.sqrt(2.0 / (inputDim + outputDim));
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = (Math.random() * 2 - 1) * scale;
    }
  }
  
  /**
   * 生成动作向量
   */
  sample(state: SSMState, noise: number = 0): Float32Array {
    const action = new Float32Array(this.outputDim);
    
    for (let j = 0; j < this.outputDim; j++) {
      let sum = this.bias[j];
      for (let i = 0; i < this.inputDim && i < state.h.length; i++) {
        sum += this.weights[j * this.inputDim + i] * state.h[i];
      }
      
      // 加入噪声
      if (noise > 0) {
        sum += (Math.random() * 2 - 1) * noise;
      }
      
      action[j] = Math.tanh(sum);
    }
    
    return action;
  }
  
  /**
   * 从基因组更新
   */
  updateFromGenome(genome: Float32Array): void {
    this.weights.set(genome.slice(0, this.weights.length));
    this.bias.set(genome.slice(this.weights.length, this.weights.length + this.outputDim));
  }
}

// ─────────────────────────────────────────────────────────────────────
// SSM + MCTS 混合控制器
// ─────────────────────────────────────────────────────────────────────

/**
 * SSM + MCTS 混合控制器
 * 
 * 核心算法：
 * 1. 用SSM编码输入并维护状态
 * 2. 用MCTS在状态空间中搜索最优决策
 * 3. 用SSM预测下一个状态
 * 4. 用价值网络评估状态
 */
export class SSMMCTSController {
  private config: SSMMCTSConfig;
  
  // 核心组件
  private ssm: SSMLayer;
  private encoder: SSMEncoder;
  private decoder: SSMDecoder;
  
  // MCTS组件
  private valueNetwork: ImplicitValueNetwork;
  private policyNetwork: ImplicitPolicyNetwork;
  
  // 能量预算和深度决策（新增）
  private energyBudgetManager: EnergyBudgetManager | null;
  private depthDecider: DepthDecider | null;
  
  // MCTS树
  private nodes: Map<string, ImplicitMCTSNode>;
  private rootId: string | null;
  
  // 统计
  private stats: {
    totalSearches: number;
    totalSimulations: number;
    avgSearchDepth: number;
    externalCalls: number;
    localDecisions: number;
    avgThinkingTime: number;
    energySavedCount: number;  // 新增：能量节省次数
  };
  
  constructor(config?: Partial<SSMMCTSConfig>) {
    this.config = { ...DEFAULT_HYBRID_CONFIG, ...config };
    
    // 初始化组件
    this.ssm = createSSMLayer(this.config.ssm);
    this.encoder = createSSMEncoder({ outputDimension: this.config.ssm.inputDimension });
    this.decoder = createSSMDecoder({ inputDimension: this.config.ssm.outputDimension });
    
    // 初始化网络
    const stateDim = this.config.ssm.stateDimension || 256;
    const outputDim = this.config.ssm.outputDimension || 256;
    this.valueNetwork = new ImplicitValueNetwork(stateDim);
    this.policyNetwork = new ImplicitPolicyNetwork(stateDim, outputDim);
    
    // 初始化能量预算和深度决策（新增）
    if (this.config.enableEnergyBudget) {
      this.energyBudgetManager = createEnergyBudgetManager(this.config.energyBudget);
    } else {
      this.energyBudgetManager = null;
    }
    
    if (this.config.enableDepthDecider) {
      this.depthDecider = createDepthDecider(this.config.depthDecider);
    } else {
      this.depthDecider = null;
    }
    
    // 初始化树
    this.nodes = new Map();
    this.rootId = null;
    
    // 初始化统计
    this.stats = {
      totalSearches: 0,
      totalSimulations: 0,
      avgSearchDepth: 0,
      externalCalls: 0,
      localDecisions: 0,
      avgThinkingTime: 0,
      energySavedCount: 0,
    };
  }
  
  /**
   * 思考入口
   * 
   * 输入：用户输入
   * 输出：思考结果
   * 
   * 新增特性：
   * - 能量预算检查：能量不足时触发浅层思考
   * - 深度决策：根据输入复杂度调整搜索参数
   */
  async think(input: EncoderInput): Promise<ThinkingResult> {
    const startTime = Date.now();
    
    // ─── Step 0: 能量预算检查（新增） ───
    let budget: EnergyBudget | null = null;
    let depthDecision: DepthDecision | null = null;
    let simulations = this.config.mcts.simulationsPerSearch;
    let maxDepth = this.config.mcts.maxDepth;
    
    if (this.energyBudgetManager) {
      budget = this.energyBudgetManager.calculateBudget();
      
      // 能量不足，快速返回浅层决策
      if (budget.isLowEnergy) {
        this.stats.energySavedCount++;
        return this.shallowThink(input, budget);
      }
      
      // 使用推荐模拟次数
      simulations = Math.min(simulations, budget.recommendedSimulations);
    }
    
    // ─── Step 0.5: 深度决策（新增） ───
    if (this.depthDecider && input.text) {
      const energyState = this.energyBudgetManager?.getState();
      depthDecision = this.depthDecider.decide(input.text, energyState);
      
      // 使用推荐的深度和模拟次数
      maxDepth = Math.min(maxDepth, depthDecision.depth);
      simulations = Math.max(simulations, 
        this.depthDecider.getRecommendedSimulations(depthDecision.complexity.total));
    }
    
    // ─── Step 1: 编码输入 ───
    const encoded = await this.encoder.encode(input);
    
    // ─── Step 2: SSM前向传播 ───
    const ssmOutput = this.ssm.forward(encoded.vector);
    
    // ─── Step 3: MCTS搜索（使用动态参数） ───
    const searchResult = this.search(ssmOutput.newState, simulations, maxDepth);
    
    // ─── Step 4: 解码决策 ───
    const decodedResponse = this.decoder.decode(ssmOutput);
    
    // ─── Step 5: 汇总结果 ───
    const needsExternalCall = searchResult.decodedInstruction.type === 'llm_call' ||
                              searchResult.decodedInstruction.type === 'reflect' ||
                              searchResult.decodedInstruction.type === 'tool_call';
    
    // ─── Step 6: 消耗能量（新增） ───
    if (this.energyBudgetManager && maxDepth > 0) {
      this.energyBudgetManager.consumeEnergy(maxDepth);
    }
    
    // 更新统计
    const thinkingTime = Date.now() - startTime;
    this.stats.totalSearches++;
    this.stats.totalSimulations += searchResult.totalSimulations;
    this.stats.avgThinkingTime = 
      (this.stats.avgThinkingTime * (this.stats.totalSearches - 1) + thinkingTime)
      / this.stats.totalSearches;
    
    if (needsExternalCall) {
      this.stats.externalCalls++;
    } else {
      this.stats.localDecisions++;
    }
    
    return {
      needsExternalCall,
      searchResult,
      ssmOutput,
      decodedResponse,
      confidence: ssmOutput.confidence * searchResult.decodedInstruction.confidence,
      tokenBudget: searchResult.decodedInstruction.tokenBudget,
      thinkingTime,
    };
  }
  
  /**
   * 浅层思考（能量不足时使用）
   */
  private async shallowThink(input: EncoderInput, budget: EnergyBudget): Promise<ThinkingResult> {
    const startTime = Date.now();
    
    // 简单编码
    const encoded = await this.encoder.encode(input);
    
    // 单次SSM传播
    const ssmOutput = this.ssm.forward(encoded.vector);
    
    // 快速解码
    const decodedResponse = this.decoder.decode(ssmOutput);
    
    // 构造本地决策
    const localInstruction: DecodedInstruction = {
      type: 'local_action',
      localAction: 'cache',
      confidence: 0.5,
      tokenBudget: 0,
      prompt: undefined,
      priority: 0,
      timestamp: Date.now(),
    };
    
    const searchResult: SearchResult = {
      bestAction: new Float32Array(256),
      bestNode: {
        id: 'shallow-root',
        ssmState: ssmOutput.newState,
        value: 0.5,
        visitCount: 1,
        parentId: null,
        childIds: [],
        actionVector: new Float32Array(256),
        createdAt: Date.now(),
      },
      decodedInstruction: localInstruction,
      searchPath: ['shallow-root'],
      searchTime: 0,
      totalSimulations: 1,
    };
    
    return {
      needsExternalCall: false,
      searchResult,
      ssmOutput,
      decodedResponse,
      confidence: 0.5,
      tokenBudget: 0,
      thinkingTime: Date.now() - startTime,
    };
  }
  
  /**
   * MCTS搜索
   * 
   * @param rootState 根状态
   * @param simulations 模拟次数（可选，默认使用配置值）
   * @param maxDepth 最大深度（可选，默认使用配置值）
   */
  private search(
    rootState: SSMState, 
    simulations?: number,
    maxDepth?: number
  ): SearchResult {
    const startTime = Date.now();
    const configMaxDepth = maxDepth ?? this.config.mcts.maxDepth;
    const configSimulations = simulations ?? this.config.mcts.simulationsPerSearch;
    const { explorationConstant } = this.config.mcts;
    
    // 创建根节点
    const rootNode = this.createNode(null, rootState, new Float32Array(rootState.h.length));
    this.rootId = rootNode.id;
    this.nodes.clear();
    this.nodes.set(rootNode.id, rootNode);
    
    const searchPath: string[] = [];
    
    // 执行模拟（使用动态参数）
    for (let sim = 0; sim < configSimulations; sim++) {
      // 选择
      const { node, path } = this.select(rootNode.id, explorationConstant);
      searchPath.push(...path);
      
      // 扩展
      const childNode = this.expand(node);
      
      // 模拟
      const value = this.simulate(childNode);
      
      // 反向传播
      this.backpropagate(childNode.id, value);
    }
    
    // 选择最佳动作
    const bestChild = this.selectBestChild(rootNode.id);
    const bestNode = this.nodes.get(bestChild.nodeId)!;
    
    // 解码最佳动作
    const decodedInstruction = this.decodeAction(bestNode.actionVector);
    
    return {
      bestAction: bestNode.actionVector,
      bestNode,
      decodedInstruction,
      searchPath,
      searchTime: Date.now() - startTime,
      totalSimulations: configSimulations,
    };
  }
  
  /**
   * 选择阶段（UCB）
   */
  private select(nodeId: string, c: number): { node: ImplicitMCTSNode; path: string[] } {
    const path: string[] = [nodeId];
    let currentId = nodeId;
    
    while (true) {
      const node = this.nodes.get(currentId)!;
      
      // 如果是叶子节点或未完全扩展，返回
      if (node.childIds.length === 0) {
        return { node, path };
      }
      
      // 使用UCB选择子节点
      let bestScore = -Infinity;
      let bestChildId = node.childIds[0];
      
      for (const childId of node.childIds) {
        const child = this.nodes.get(childId)!;
        const ucb = this.computeUCB(child, node.visitCount, c);
        
        if (ucb > bestScore) {
          bestScore = ucb;
          bestChildId = childId;
        }
      }
      
      path.push(bestChildId);
      currentId = bestChildId;
    }
  }
  
  /**
   * 扩展阶段
   */
  private expand(node: ImplicitMCTSNode): ImplicitMCTSNode {
    // 使用策略网络生成动作
    const actionVector = this.policyNetwork.sample(
      node.ssmState,
      this.config.enableChaos ? this.config.chaosIntensity : 0
    );
    
    // 预测下一个状态
    const newState = this.predictNextState(node.ssmState, actionVector);
    
    // 创建新节点
    const childNode = this.createNode(node.id, newState, actionVector);
    this.nodes.set(childNode.id, childNode);
    
    // 更新父节点的子节点列表
    node.childIds.push(childNode.id);
    
    return childNode;
  }
  
  /**
   * 模拟阶段
   */
  private simulate(node: ImplicitMCTSNode): number {
    // 使用价值网络估计
    return this.valueNetwork.evaluate(node.ssmState);
  }
  
  /**
   * 反向传播阶段
   */
  private backpropagate(nodeId: string, value: number): void {
    let currentId: string | null = nodeId;
    
    while (currentId !== null) {
      const node: ImplicitMCTSNode = this.nodes.get(currentId)!;
      node.visitCount++;
      
      // 更新价值（增量平均）
      const oldValue = node.value;
      node.value = oldValue + (value - oldValue) / node.visitCount;
      
      currentId = node.parentId;
    }
  }
  
  /**
   * 选择最佳子节点
   */
  private selectBestChild(nodeId: string): { nodeId: string; score: number } {
    const node = this.nodes.get(nodeId)!;
    
    let bestId = node.childIds[0];
    let bestVisit = 0;
    
    for (const childId of node.childIds) {
      const child = this.nodes.get(childId)!;
      if (child.visitCount > bestVisit) {
        bestVisit = child.visitCount;
        bestId = childId;
      }
    }
    
    const bestChild = this.nodes.get(bestId)!;
    return { nodeId: bestId, score: bestChild.value };
  }
  
  /**
   * 计算UCB值
   */
  private computeUCB(node: ImplicitMCTSNode, parentVisits: number, c: number): number {
    if (node.visitCount === 0) {
      return Infinity;
    }
    
    const exploitation = node.value;
    const exploration = c * Math.sqrt(Math.log(parentVisits) / node.visitCount);
    
    return exploitation + exploration;
  }
  
  /**
   * 预测下一个状态
   */
  private predictNextState(state: SSMState, action: Float32Array): SSMState {
    // 使用SSM预测
    const output = this.ssm.forward(action);
    return output.newState;
  }
  
  /**
   * 解码动作
   */
  private decodeAction(actionVector: Float32Array): DecodedInstruction {
    // 创建临时SSM输出
    const tempOutput: SSMOutput = {
      y: actionVector,
      newState: this.ssm.getCurrentState(),
      triggerExternal: false,
      confidence: 0.5,
    };
    
    return this.decoder.decode(tempOutput).instructions[0];
  }
  
  /**
   * 创建节点
   */
  private createNode(
    parentId: string | null,
    state: SSMState,
    action: Float32Array
  ): ImplicitMCTSNode {
    return {
      id: this.generateId(),
      ssmState: state,
      value: 0,
      visitCount: 0,
      parentId,
      childIds: [],
      actionVector: action,
      createdAt: Date.now(),
    };
  }
  
  /**
   * 重置控制器
   */
  reset(): void {
    this.ssm.reset();
    this.nodes.clear();
    this.rootId = null;
  }
  
  /**
   * 从基因组更新（DE-RL优化）
   */
  updateFromGenome(genome: {
    ssm: Float32Array;
    valueNetwork: Float32Array;
    policyNetwork: Float32Array;
  }): void {
    this.ssm.updateFromGenome(genome.ssm);
    this.valueNetwork.updateFromGenome(genome.valueNetwork);
    this.policyNetwork.updateFromGenome(genome.policyNetwork);
  }
  
  /**
   * 获取当前SSM状态
   */
  getCurrentState(): SSMState {
    return this.ssm.getCurrentState();
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * 获取能量预算（新增）
   */
  getEnergyBudget(): EnergyBudget | null {
    return this.energyBudgetManager?.calculateBudget() ?? null;
  }
  
  /**
   * 获取能量状态（新增）
   */
  getEnergyState() {
    return this.energyBudgetManager?.getState() ?? null;
  }
  
  /**
   * 恢复能量（新增）
   */
  rest(duration: number = 1): void {
    this.energyBudgetManager?.rest(duration);
  }
  
  /**
   * 设置好奇心（新增）
   */
  setCuriosity(value: number): void {
    this.energyBudgetManager?.setCuriosity(value);
  }
  
  /**
   * 估计输入复杂度（新增）
   */
  estimateComplexity(input: string): ComplexityScore | null {
    return this.depthDecider?.estimateComplexity(input) ?? null;
  }
  
  /**
   * 判断是否需要深度思考（新增）
   */
  needsDeepThinking(input: string): boolean {
    return this.depthDecider?.needsDeepThinking(input) ?? false;
  }
  
  /**
   * 生成ID
   */
  private generateId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSSMMCTSController(config?: Partial<SSMMCTSConfig>): SSMMCTSController {
  return new SSMMCTSController(config);
}

/**
 * 创建默认配置的控制器
 */
export function createDefaultSSMMCTSController(): SSMMCTSController {
  return createSSMMCTSController({
    ssm: {
      stateDimension: 256,
      inputDimension: 256,
      outputDimension: 256,
      useSelective: true,
    },
    mcts: {
      maxDepth: 5,
      simulationsPerSearch: 10,
      explorationConstant: 1.414,
      useSSMStateAsNode: true,
    },
    enableChaos: true,
    chaosIntensity: 0.1,
  });
}

export default SSMMCTSController;
