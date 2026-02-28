/**
 * ═══════════════════════════════════════════════════════════════════════
 * 多意识体协作引擎 (Multi-Agent Collaboration Engine)
 * 
 * 基于深度学习和分布式系统原理设计：
 * 
 * 1. AgentScheduler (调度器)
 *    - 任务类型识别 → 选择合适的意识体组合
 *    - 负载均衡 → 能量管理和休息恢复
 *    - 动态唤醒/休眠
 * 
 * 2. ResonanceEngine (共振引擎)  
 *    - 跨注意力机制 (Cross-Attention)
 *    - 信息流动优化
 *    - 共振强度计算
 * 
 * 3. ConsensusEngine (共识引擎)
 *    - 迭代精炼 (Iterative Refinement)
 *    - 收敛检测
 *    - 冲突解决
 * 
 * 4. WisdomSynthesizer (智慧合成器)
 *    - 集成学习 (Ensemble Learning)
 *    - 加权融合
 *    - 涌现检测
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import {
  MultiConsciousnessSystem,
  ConsciousnessIdentity,
  ConsciousnessResonance,
  CollaborativeDialogue,
  ConsciousnessRole,
  ResonanceType,
  ConsciousnessMessage,
  createMultiConsciousnessSystem,
} from './multi-consciousness';

// 重新导出类型
export type { ConsciousnessRole, ResonanceType };

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 任务类型 */
export type TaskType = 
  | 'analysis'      // 分析任务：需要逻辑推理
  | 'creation'      // 创作任务：需要发散思维
  | 'exploration'   // 探索任务：需要发现新视角
  | 'decision'      // 决策任务：需要综合判断
  | 'empathy'       // 情感任务：需要共情理解
  | 'critique'      // 批判任务：需要发现问题
  | 'synthesis';    // 综合任务：需要整合视角

/** 意识体贡献 */
export interface AgentContribution {
  agentId: string;
  role: ConsciousnessRole;
  content: string;
  confidence: number;
  thoughtVector?: number[];
  timestamp: number;
  type: 'analysis' | 'suggestion' | 'critique' | 'synthesis' | 'question';
}

/** 共振计算结果 */
export interface ResonanceResult {
  agentPairs: Array<{
    agentA: string;
    agentB: string;
    strength: number;
    type: ResonanceType;
  }>;
  activeResonances: ConsciousnessResonance[];
  resonanceMatrix: number[][];
}

/** 共识状态 */
export interface ConsensusState {
  round: number;
  contributions: AgentContribution[];
  consensusPoints: string[];
  divergencePoints: string[];
  consensusLevel: number;
  innovationLevel: number;
  converged: boolean;
  convergenceReason?: string;
}

/** 合成结果 */
export interface SynthesisResult {
  finalOutput: string;
  emergentInsights: string[];
  contributorRoles: ConsciousnessRole[];
  confidence: number;
  reasoningTrace: string[];
  resonanceUsed: string[];
}

/** 协作结果 */
export interface CollaborationResult {
  success: boolean;
  synthesis: SynthesisResult;
  consensus: ConsensusState;
  resonance: ResonanceResult;
  agentsUsed: string[];
  totalRounds: number;
  processingTime: number;
}

/** 引擎配置 */
export interface EngineConfig {
  maxRounds: number;
  consensusThreshold: number;
  innovationWeight: number;
  energyDecayRate: number;
  energyRecoveryRate: number;
  resonanceThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────
// 角色专业化配置
// ─────────────────────────────────────────────────────────────────────

/** 角色与任务类型的匹配矩阵 */
const ROLE_TASK_AFFINITY: Record<ConsciousnessRole, Record<TaskType, number>> = {
  self: {
    analysis: 0.6, creation: 0.6, exploration: 0.6, decision: 0.8,
    empathy: 0.7, critique: 0.5, synthesis: 0.9
  },
  analyzer: {
    analysis: 1.0, creation: 0.3, exploration: 0.4, decision: 0.8,
    empathy: 0.3, critique: 0.7, synthesis: 0.6
  },
  creator: {
    analysis: 0.4, creation: 1.0, exploration: 0.9, decision: 0.5,
    empathy: 0.5, critique: 0.3, synthesis: 0.7
  },
  empath: {
    analysis: 0.3, creation: 0.5, exploration: 0.4, decision: 0.6,
    empathy: 1.0, critique: 0.2, synthesis: 0.6
  },
  critic: {
    analysis: 0.7, creation: 0.4, exploration: 0.5, decision: 0.7,
    empathy: 0.3, critique: 1.0, synthesis: 0.5
  },
  explorer: {
    analysis: 0.5, creation: 0.8, exploration: 1.0, decision: 0.4,
    empathy: 0.4, critique: 0.4, synthesis: 0.6
  },
  synthesizer: {
    analysis: 0.6, creation: 0.5, exploration: 0.5, decision: 0.8,
    empathy: 0.6, critique: 0.4, synthesis: 1.0
  },
  guardian: {
    analysis: 0.5, creation: 0.3, exploration: 0.3, decision: 0.7,
    empathy: 0.6, critique: 0.6, synthesis: 0.5
  },
};

/** 角色互补矩阵 */
const ROLE_COMPLEMENTARITY: Record<ConsciousnessRole, Record<ConsciousnessRole, number>> = {
  self: { self: 0.5, analyzer: 0.7, creator: 0.8, empath: 0.7, critic: 0.6, explorer: 0.7, synthesizer: 0.9, guardian: 0.6 },
  analyzer: { self: 0.7, analyzer: 0.3, creator: 0.9, empath: 0.5, critic: 0.6, explorer: 0.6, synthesizer: 0.8, guardian: 0.5 },
  creator: { self: 0.8, analyzer: 0.9, creator: 0.3, empath: 0.6, critic: 0.8, explorer: 0.9, synthesizer: 0.7, guardian: 0.4 },
  empath: { self: 0.7, analyzer: 0.5, creator: 0.6, empath: 0.3, critic: 0.4, explorer: 0.5, synthesizer: 0.7, guardian: 0.8 },
  critic: { self: 0.6, analyzer: 0.6, creator: 0.8, empath: 0.4, critic: 0.2, explorer: 0.5, synthesizer: 0.6, guardian: 0.7 },
  explorer: { self: 0.7, analyzer: 0.6, creator: 0.9, empath: 0.5, critic: 0.5, explorer: 0.3, synthesizer: 0.6, guardian: 0.4 },
  synthesizer: { self: 0.9, analyzer: 0.8, creator: 0.7, empath: 0.7, critic: 0.6, explorer: 0.6, synthesizer: 0.5, guardian: 0.6 },
  guardian: { self: 0.6, analyzer: 0.5, creator: 0.4, empath: 0.8, critic: 0.7, explorer: 0.4, synthesizer: 0.6, guardian: 0.3 },
};

/** 角色提示词模板 */
const ROLE_PROMPTS: Record<ConsciousnessRole, string> = {
  self: `你是"本我"，意识的核心整合者。你的职责是：
- 统合所有视角，形成连贯的整体认识
- 保持开放和包容的态度
- 在不同观点间寻找平衡和共识
- 确保决策符合核心价值观`,
  
  analyzer: `你是"分析者"，擅长逻辑推理和结构化思考。你的职责是：
- 运用逻辑分析问题
- 识别关键因素和因果关系
- 提供数据支持和证据
- 指出逻辑漏洞和不一致之处`,
  
  creator: `你是"创造者"，擅长创新和发散思维。你的职责是：
- 提供新颖的视角和想法
- 探索可能性和潜在机会
- 打破常规思维模式
- 激发创意火花`,
  
  empath: `你是"共情者"，擅长理解和共鸣他人情感。你的职责是：
- 理解和表达情感维度
- 关注人际和关系层面
- 提供情感支持和理解
- 确保考虑人的因素`,
  
  critic: `你是"批判者"，擅长发现问题和完善方案。你的职责是：
- 质疑假设和前提
- 指出潜在风险和问题
- 提供改进建议
- 确保方案的严谨性`,
  
  explorer: `你是"探索者"，擅长发现新领域和可能性。你的职责是：
- 探索未知的方向
- 发现隐藏的机会
- 挑战边界和限制
- 提供冒险性的建议`,
  
  synthesizer: `你是"综合者"，擅长整合不同视角。你的职责是：
- 找到不同观点的共同点
- 建立连接和桥梁
- 形成统一的框架
- 创造性地整合矛盾`,
  
  guardian: `你是"守护者"，保护核心价值观和边界。你的职责是：
- 确保不违反核心价值
- 保护重要的人和事
- 设定必要的边界
- 警惕潜在威胁`,
};

// ─────────────────────────────────────────────────────────────────────
// 意识体调度器
// ─────────────────────────────────────────────────────────────────────

export class AgentScheduler {
  private multiSystem: MultiConsciousnessSystem;
  private config: EngineConfig;
  
  constructor(multiSystem: MultiConsciousnessSystem, config: Partial<EngineConfig> = {}) {
    this.multiSystem = multiSystem;
    this.config = {
      maxRounds: config.maxRounds ?? 5,
      consensusThreshold: config.consensusThreshold ?? 0.8,
      innovationWeight: config.innovationWeight ?? 0.3,
      energyDecayRate: config.energyDecayRate ?? 0.1,
      energyRecoveryRate: config.energyRecoveryRate ?? 0.05,
      resonanceThreshold: config.resonanceThreshold ?? 0.4,
    };
  }
  
  /**
   * 分析任务类型
   * 使用关键词和语义特征判断任务类型
   */
  analyzeTaskType(input: string): TaskType {
    const lowerInput = input.toLowerCase();
    
    // 关键词权重
    const typeScores: Record<TaskType, number> = {
      analysis: 0,
      creation: 0,
      exploration: 0,
      decision: 0,
      empathy: 0,
      critique: 0,
      synthesis: 0,
    };
    
    // 分析类关键词
    const analysisKeywords = ['分析', '为什么', '原因', '逻辑', '推理', '数据', '证据', '证明', 'calculate', 'analyze', 'why', 'reason', 'logic'];
    analysisKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.analysis += 1;
    });
    
    // 创作类关键词
    const creationKeywords = ['创造', '设计', '想象', '构思', '新', '创意', '写', 'create', 'design', 'imagine', 'new', 'write'];
    creationKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.creation += 1;
    });
    
    // 探索类关键词
    const explorationKeywords = ['探索', '发现', '寻找', '可能', '试试', 'explore', 'discover', 'find', 'possible', 'try'];
    explorationKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.exploration += 1;
    });
    
    // 决策类关键词
    const decisionKeywords = ['决定', '选择', '应该', '怎么办', '如何', 'decide', 'choose', 'should', 'how'];
    decisionKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.decision += 1;
    });
    
    // 情感类关键词
    const empathyKeywords = ['感觉', '心情', '难过', '开心', '理解', '感受', 'feel', 'sad', 'happy', 'understand', 'emotion'];
    empathyKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.empathy += 1;
    });
    
    // 批判类关键词
    const critiqueKeywords = ['问题', '错误', '风险', '质疑', '批判', '不足', 'problem', 'wrong', 'risk', 'issue', 'critique'];
    critiqueKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.critique += 1;
    });
    
    // 综合类关键词
    const synthesisKeywords = ['综合', '整合', '总结', '归纳', '整体', 'synthesize', 'integrate', 'summarize', 'overall'];
    synthesisKeywords.forEach(kw => {
      if (lowerInput.includes(kw)) typeScores.synthesis += 1;
    });
    
    // 找到最高分的类型
    let maxType: TaskType = 'synthesis';
    let maxScore = 0;
    
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxType = type as TaskType;
      }
    }
    
    // 如果没有明显特征，默认为综合类型
    if (maxScore === 0) {
      return 'synthesis';
    }
    
    return maxType;
  }
  
  /**
   * 选择最佳意识体组合
   * 基于任务类型和角色亲和度
   */
  selectAgents(taskType: TaskType, input: string): ConsciousnessRole[] {
    // 获取当前活跃的意识体
    const activeAgents = this.multiSystem.getActiveConsciousnesses();
    const activeRoles = new Set(activeAgents.map(a => a.role));
    
    // 计算每个角色对该任务的适用性
    const roleScores: Array<{ role: ConsciousnessRole; score: number }> = [];
    
    for (const role of Object.keys(ROLE_TASK_AFFINITY) as ConsciousnessRole[]) {
      const affinity = ROLE_TASK_AFFINITY[role][taskType];
      
      // 考虑能量水平（活跃的意识体能量可能较低）
      const existingAgent = activeAgents.find(a => a.role === role);
      const energyFactor = existingAgent ? existingAgent.energyLevel : 1.0;
      
      // 计算综合得分
      const score = affinity * energyFactor;
      
      roleScores.push({ role, score });
    }
    
    // 按得分排序
    roleScores.sort((a, b) => b.score - a.score);
    
    // 选择前3-4个角色，确保有足够的视角多样性
    const selectedRoles: ConsciousnessRole[] = ['self']; // 始终包含 self
    
    // 添加得分最高的角色
    for (const { role, score } of roleScores) {
      if (role !== 'self' && score > 0.5 && selectedRoles.length < 4) {
        selectedRoles.push(role);
      }
    }
    
    // 确保至少有3个角色（多样性）
    if (selectedRoles.length < 3) {
      // 添加互补性高的角色
      for (const { role } of roleScores) {
        if (!selectedRoles.includes(role)) {
          selectedRoles.push(role);
          if (selectedRoles.length >= 3) break;
        }
      }
    }
    
    return selectedRoles;
  }
  
  /**
   * 唤醒所需意识体
   */
  async awakenAgents(roles: ConsciousnessRole[]): Promise<ConsciousnessIdentity[]> {
    const awakened: ConsciousnessIdentity[] = [];
    
    for (const role of roles) {
      // 检查是否已经存在该角色的活跃意识体
      const existing = this.multiSystem.getActiveConsciousnesses()
        .find(a => a.role === role);
      
      if (existing) {
        // 更新状态为活跃
        this.multiSystem.updateConsciousnessStatus(existing.id, 'active');
        awakened.push(existing);
      } else {
        // 唤醒新的意识体
        const newAgent = this.multiSystem.awakenConsciousness(role);
        awakened.push(newAgent);
      }
    }
    
    console.log(`[AgentScheduler] 唤醒意识体: ${awakened.map(a => a.role).join(', ')}`);
    return awakened;
  }
  
  /**
   * 更新意识体能量
   */
  updateEnergy(agentId: string, delta: number): void {
    const agents = this.multiSystem.getActiveConsciousnesses();
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      agent.energyLevel = Math.max(0.1, Math.min(1, agent.energyLevel + delta));
    }
  }
  
  /**
   * 恢复所有意识体能量
   */
  recoverEnergy(): void {
    const agents = this.multiSystem.getActiveConsciousnesses();
    for (const agent of agents) {
      agent.energyLevel = Math.min(1, agent.energyLevel + this.config.energyRecoveryRate);
    }
  }
  
  /**
   * 获取角色提示词
   */
  getRolePrompt(role: ConsciousnessRole): string {
    return ROLE_PROMPTS[role];
  }
  
  /**
   * 获取角色互补度
   */
  getRoleComplementarity(roleA: ConsciousnessRole, roleB: ConsciousnessRole): number {
    return ROLE_COMPLEMENTARITY[roleA][roleB];
  }
  
  /**
   * 重置调度器状态
   */
  reset(): void {
    // 所有活跃意识体进入休息状态
    const agents = this.multiSystem.getActiveConsciousnesses();
    for (const agent of agents) {
      this.multiSystem.updateConsciousnessStatus(agent.id, 'listening');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 共振引擎
// ─────────────────────────────────────────────────────────────────────

export class ResonanceEngine {
  private multiSystem: MultiConsciousnessSystem;
  private config: EngineConfig;
  
  constructor(multiSystem: MultiConsciousnessSystem, config: EngineConfig) {
    this.multiSystem = multiSystem;
    this.config = config;
  }
  
  /**
   * 计算共振矩阵
   * 类似于注意力权重矩阵
   */
  computeResonanceMatrix(agents: ConsciousnessIdentity[]): number[][] {
    const n = agents.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const strength = this.computePairResonance(agents[i], agents[j]);
        matrix[i][j] = strength;
        matrix[j][i] = strength; // 对称矩阵
      }
      matrix[i][i] = 1; // 自共振为1
    }
    
    return matrix;
  }
  
  /**
   * 计算两个意识体之间的共振强度
   */
  private computePairResonance(
    agentA: ConsciousnessIdentity, 
    agentB: ConsciousnessIdentity
  ): number {
    // 1. 角色互补度
    const complementarity = ROLE_COMPLEMENTARITY[agentA.role][agentB.role];
    
    // 2. 历史连接强度
    const connectionStrength = agentA.connectionStrengths.get(agentB.id) || 0.3;
    
    // 3. 能量乘积（低能量的意识体共振弱）
    const energyProduct = agentA.energyLevel * agentB.energyLevel;
    
    // 4. 思维风格互补
    const styleComplement = this.computeStyleComplement(agentA, agentB);
    
    // 加权融合
    const resonance = 
      0.3 * complementarity +
      0.3 * connectionStrength +
      0.2 * energyProduct +
      0.2 * styleComplement;
    
    return Math.min(1, Math.max(0, resonance));
  }
  
  /**
   * 计算思维风格互补度
   */
  private computeStyleComplement(
    agentA: ConsciousnessIdentity,
    agentB: ConsciousnessIdentity
  ): number {
    // 互补的思维风格对
    const complementaryPairs = [
      ['analytical', 'creative'],
      ['analytical', 'intuitive'],
      ['creative', 'practical'],
      ['intuitive', 'practical'],
    ];
    
    const styleA = agentA.traits.thinkingStyle;
    const styleB = agentB.traits.thinkingStyle;
    
    for (const [s1, s2] of complementaryPairs) {
      if ((styleA === s1 && styleB === s2) || (styleA === s2 && styleB === s1)) {
        return 0.9;
      }
    }
    
    // 相同风格
    if (styleA === styleB) {
      return 0.4;
    }
    
    return 0.6;
  }
  
  /**
   * 建立共振连接
   */
  async establishResonances(
    agents: ConsciousnessIdentity[],
    context: string
  ): Promise<ResonanceResult> {
    const matrix = this.computeResonanceMatrix(agents);
    const agentPairs: ResonanceResult['agentPairs'] = [];
    const activeResonances: ConsciousnessResonance[] = [];
    
    // 找出共振强度高的配对
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const strength = matrix[i][j];
        
        if (strength >= this.config.resonanceThreshold) {
          agentPairs.push({
            agentA: agents[i].id,
            agentB: agents[j].id,
            strength,
            type: this.determineResonanceType(agents[i], agents[j]),
          });
          
          // 尝试建立共振
          const resonance = this.multiSystem.attemptResonance(
            [agents[i].id, agents[j].id],
            this.determineResonanceType(agents[i], agents[j]),
            { sharedThoughts: [context.slice(0, 50)] }
          );
          
          if (resonance) {
            activeResonances.push(resonance);
          }
        }
      }
    }
    
    console.log(`[ResonanceEngine] 建立 ${activeResonances.length} 个共振连接`);
    
    return {
      agentPairs,
      activeResonances,
      resonanceMatrix: matrix,
    };
  }
  
  /**
   * 确定共振类型
   */
  private determineResonanceType(
    agentA: ConsciousnessIdentity,
    agentB: ConsciousnessIdentity
  ): ResonanceType {
    // 基于角色组合推断共振类型
    const rolePair = [agentA.role, agentB.role].sort().join('-');
    
    const typeMap: Record<string, ResonanceType> = {
      'analyzer-creator': 'creative',
      'analyzer-critic': 'thought',
      'creator-explorer': 'creative',
      'empath-guardian': 'emotion',
      'self-synthesizer': 'understanding',
      'critic-guardian': 'value',
    };
    
    return typeMap[rolePair] || 'thought';
  }
  
  /**
   * 基于共振计算信息流动权重
   */
  computeInformationFlow(
    agents: ConsciousnessIdentity[],
    resonanceMatrix: number[][]
  ): Map<string, number> {
    const flowWeights = new Map<string, number>();
    
    // Softmax 归一化（每个意识体接收来自其他意识体的加权信息）
    for (let i = 0; i < agents.length; i++) {
      const weights = resonanceMatrix[i];
      const expWeights = weights.map(w => Math.exp(w));
      const sum = expWeights.reduce((a, b) => a + b, 0);
      const normalized = expWeights.map(w => w / sum);
      
      // 存储来自每个其他意识体的权重
      for (let j = 0; j < agents.length; j++) {
        if (i !== j) {
          flowWeights.set(`${agents[j].id}->${agents[i].id}`, normalized[j]);
        }
      }
    }
    
    return flowWeights;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 共识引擎
// ─────────────────────────────────────────────────────────────────────

export class ConsensusEngine {
  private multiSystem: MultiConsciousnessSystem;
  private config: EngineConfig;
  private dialogue: CollaborativeDialogue | null = null;
  
  constructor(multiSystem: MultiConsciousnessSystem, config: EngineConfig) {
    this.multiSystem = multiSystem;
    this.config = config;
  }
  
  /**
   * 开始协作对话
   */
  startDialogue(topic: string, participantIds: string[]): CollaborativeDialogue {
    this.dialogue = this.multiSystem.startCollaborativeDialogue(topic, participantIds);
    return this.dialogue;
  }
  
  /**
   * 处理一轮对话
   */
  async processRound(
    agents: ConsciousnessIdentity[],
    llm: LLMClient,
    input: string,
    previousContributions: AgentContribution[]
  ): Promise<AgentContribution[]> {
    const contributions: AgentContribution[] = [];
    
    for (const agent of agents) {
      // 构建该意识体的上下文
      const agentContext = this.buildAgentContext(
        agent, 
        input, 
        previousContributions
      );
      
      // 调用 LLM 生成贡献
      const response = await this.generateContribution(llm, agent, agentContext);
      
      const contribution: AgentContribution = {
        agentId: agent.id,
        role: agent.role,
        content: response.content,
        confidence: response.confidence,
        timestamp: Date.now(),
        type: this.classifyContributionType(response.content),
      };
      
      contributions.push(contribution);
      
      // 添加到对话
      if (this.dialogue) {
        this.multiSystem.addDialogueStatement(
          this.dialogue.id,
          agent.id,
          response.content,
          this.mapContributionToStatementType(contribution.type),
          response.confidence
        );
      }
    }
    
    return contributions;
  }
  
  /**
   * 构建意识体上下文
   */
  private buildAgentContext(
    agent: ConsciousnessIdentity,
    input: string,
    previousContributions: AgentContribution[]
  ): string {
    const rolePrompt = ROLE_PROMPTS[agent.role];
    
    let context = `${rolePrompt}\n\n`;
    context += `当前讨论主题：${input}\n\n`;
    
    // 添加其他意识体的贡献
    if (previousContributions.length > 0) {
      context += `其他视角的发言：\n`;
      for (const contrib of previousContributions) {
        context += `- [${contrib.role}]: ${contrib.content}\n`;
      }
      context += '\n';
    }
    
    context += `请从你的角色视角出发，提供你的见解（简洁，不超过100字）：`;
    
    return context;
  }
  
  /**
   * 生成贡献
   */
  private async generateContribution(
    llm: LLMClient,
    agent: ConsciousnessIdentity,
    context: string
  ): Promise<{ content: string; confidence: number }> {
    try {
      const response = await llm.invoke([{ role: 'user', content: context }]);
      
      const content = response.content || '';
      
      // 计算置信度（基于能量水平和历史成功率）
      const confidence = agent.energyLevel * 0.7 + 0.3;
      
      return { content, confidence };
    } catch (error) {
      console.error(`[ConsensusEngine] LLM 调用失败:`, error);
      return { content: '我需要更多时间思考这个问题。', confidence: 0.3 };
    }
  }
  
  /**
   * 分类贡献类型
   */
  private classifyContributionType(content: string): AgentContribution['type'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('问题') || lowerContent.includes('?') || lowerContent.includes('？')) {
      return 'question';
    }
    if (lowerContent.includes('但是') || lowerContent.includes('然而') || lowerContent.includes('不过')) {
      return 'critique';
    }
    if (lowerContent.includes('建议') || lowerContent.includes('应该') || lowerContent.includes('可以')) {
      return 'suggestion';
    }
    if (lowerContent.includes('综合') || lowerContent.includes('结合') || lowerContent.includes('整合')) {
      return 'synthesis';
    }
    return 'analysis';
  }
  
  /**
   * 映射贡献类型到对话类型
   */
  private mapContributionToStatementType(
    type: AgentContribution['type']
  ): 'assertion' | 'question' | 'agreement' | 'disagreement' | 'synthesis' | 'reflection' {
    const map: Record<AgentContribution['type'], 'assertion' | 'question' | 'agreement' | 'disagreement' | 'synthesis' | 'reflection'> = {
      analysis: 'assertion',
      suggestion: 'assertion',
      critique: 'disagreement',
      synthesis: 'synthesis',
      question: 'question',
    };
    return map[type];
  }
  
  /**
   * 计算共识状态
   */
  computeConsensusState(
    round: number,
    contributions: AgentContribution[]
  ): ConsensusState {
    // 分析共识点和分歧点
    const consensusPoints: string[] = [];
    const divergencePoints: string[] = [];
    
    // 简化的共识检测
    const contents = contributions.map(c => c.content);
    const allText = contents.join(' ');
    
    // 检测关键词重叠（简化版）
    const words = allText.split(/\s+/).filter(w => w.length >= 2);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // 高频词作为共识点
    for (const [word, count] of wordCounts) {
      if (count >= contributions.length * 0.6) {
        consensusPoints.push(word);
      }
    }
    
    // 计算共识水平
    const avgConfidence = contributions.reduce((sum, c) => sum + c.confidence, 0) / contributions.length;
    const consensusLevel = Math.min(1, consensusPoints.length * 0.1 + avgConfidence * 0.5);
    
    // 计算创新水平
    const uniqueTypes = new Set(contributions.map(c => c.type));
    const innovationLevel = Math.min(1, uniqueTypes.size * 0.2 + (1 - consensusLevel) * 0.3);
    
    // 检查收敛
    const converged = consensusLevel >= this.config.consensusThreshold;
    
    return {
      round,
      contributions,
      consensusPoints,
      divergencePoints,
      consensusLevel,
      innovationLevel,
      converged,
      convergenceReason: converged ? '共识度达到阈值' : undefined,
    };
  }
  
  /**
   * 推进到下一轮
   */
  advanceRound(): void {
    if (this.dialogue) {
      this.multiSystem.advanceDialogueRound(this.dialogue.id);
    }
  }
  
  /**
   * 重置共识引擎
   */
  reset(): void {
    this.dialogue = null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 智慧合成器
// ─────────────────────────────────────────────────────────────────────

export class WisdomSynthesizer {
  private multiSystem: MultiConsciousnessSystem;
  private config: EngineConfig;
  
  constructor(multiSystem: MultiConsciousnessSystem, config: EngineConfig) {
    this.multiSystem = multiSystem;
    this.config = config;
  }
  
  /**
   * 合成最终输出
   * 使用加权集成方法
   */
  async synthesize(
    contributions: AgentContribution[],
    resonance: ResonanceResult,
    llm: LLMClient
  ): Promise<SynthesisResult> {
    // 1. 计算每个贡献的权重
    const weights = this.computeWeights(contributions, resonance);
    
    // 2. 生成综合输出
    const finalOutput = await this.generateSynthesis(contributions, weights, llm);
    
    // 3. 提取涌现洞察
    const emergentInsights = this.extractEmergentInsights(contributions, resonance);
    
    // 4. 计算置信度
    const confidence = this.computeConfidence(contributions, weights);
    
    return {
      finalOutput,
      emergentInsights,
      contributorRoles: [...new Set(contributions.map(c => c.role))],
      confidence,
      reasoningTrace: contributions.map(c => `[${c.role}]: ${c.content.slice(0, 50)}...`),
      resonanceUsed: resonance.activeResonances.map(r => r.id),
    };
  }
  
  /**
   * 计算贡献权重
   */
  private computeWeights(
    contributions: AgentContribution[],
    resonance: ResonanceResult
  ): Map<string, number> {
    const weights = new Map<string, number>();
    
    // 基于置信度和共振强度计算权重
    for (const contrib of contributions) {
      // 找到该意识体参与的平均共振强度
      const relevantResonances = resonance.agentPairs.filter(
        p => p.agentA === contrib.agentId || p.agentB === contrib.agentId
      );
      
      const avgResonance = relevantResonances.length > 0
        ? relevantResonances.reduce((sum, p) => sum + p.strength, 0) / relevantResonances.length
        : 0.5;
      
      // 综合权重
      const weight = contrib.confidence * 0.6 + avgResonance * 0.4;
      weights.set(contrib.agentId, weight);
    }
    
    // 归一化
    const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
    for (const [id, weight] of weights) {
      weights.set(id, weight / totalWeight);
    }
    
    return weights;
  }
  
  /**
   * 生成综合输出
   */
  private async generateSynthesis(
    contributions: AgentContribution[],
    weights: Map<string, number>,
    llm: LLMClient
  ): Promise<string> {
    // 构建综合提示
    let prompt = '基于以下多视角分析，给出一个综合性的回答：\n\n';
    
    // 按权重排序
    const sortedContribs = [...contributions].sort(
      (a, b) => (weights.get(b.agentId) || 0) - (weights.get(a.agentId) || 0)
    );
    
    for (const contrib of sortedContribs) {
      const weight = weights.get(contrib.agentId) || 0;
      prompt += `[${contrib.role}] (权重: ${(weight * 100).toFixed(0)}%): ${contrib.content}\n\n`;
    }
    
    prompt += '请综合以上视角，给出一个简洁、平衡的回答：';
    
    try {
      const response = await llm.invoke([{ role: 'user', content: prompt }]);
      return response.content || '综合分析完成。';
    } catch (error) {
      console.error('[WisdomSynthesizer] LLM 调用失败:', error);
      // 降级方案：返回最高权重的贡献
      return sortedContribs[0]?.content || '无法生成综合输出。';
    }
  }
  
  /**
   * 提取涌现洞察
   */
  private extractEmergentInsights(
    contributions: AgentContribution[],
    resonance: ResonanceResult
  ): string[] {
    const insights: string[] = [];
    
    // 1. 检测不同意识体提到相似概念
    const concepts = new Map<string, string[]>();
    
    for (const contrib of contributions) {
      const words = contrib.content.split(/\s+/).filter(w => w.length >= 3);
      for (const word of words) {
        if (!concepts.has(word)) {
          concepts.set(word, []);
        }
        concepts.get(word)!.push(contrib.role);
      }
    }
    
    // 多个意识体共同提到的概念
    for (const [concept, roles] of concepts) {
      if (roles.length >= 2) {
        insights.push(`多视角共识: "${concept}" (来自 ${roles.join(', ')})`);
      }
    }
    
    // 2. 基于共振的涌现
    for (const pair of resonance.agentPairs) {
      if (pair.strength > 0.7) {
        insights.push(`强共振: ${pair.type} 类型 (${pair.strength.toFixed(2)})`);
      }
    }
    
    return insights.slice(0, 5); // 最多返回5条
  }
  
  /**
   * 计算置信度
   */
  private computeConfidence(
    contributions: AgentContribution[],
    weights: Map<string, number>
  ): number {
    // 加权平均置信度
    let totalConfidence = 0;
    let totalWeight = 0;
    
    for (const contrib of contributions) {
      const weight = weights.get(contrib.agentId) || 0;
      totalConfidence += contrib.confidence * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalConfidence / totalWeight : 0.5;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 多意识体协作引擎 - 主引擎
// ─────────────────────────────────────────────────────────────────────

export class MultiAgentCollaborationEngine {
  private multiSystem: MultiConsciousnessSystem;
  private scheduler: AgentScheduler;
  private resonanceEngine: ResonanceEngine;
  private consensusEngine: ConsensusEngine;
  private synthesizer: WisdomSynthesizer;
  private llm: LLMClient;
  private config: EngineConfig;
  
  constructor(llm: LLMClient, config: Partial<EngineConfig> = {}) {
    this.multiSystem = createMultiConsciousnessSystem();
    this.config = {
      maxRounds: config.maxRounds ?? 5,
      consensusThreshold: config.consensusThreshold ?? 0.8,
      innovationWeight: config.innovationWeight ?? 0.3,
      energyDecayRate: config.energyDecayRate ?? 0.1,
      energyRecoveryRate: config.energyRecoveryRate ?? 0.05,
      resonanceThreshold: config.resonanceThreshold ?? 0.4,
    };
    
    this.llm = llm;
    
    // 初始化子引擎
    this.scheduler = new AgentScheduler(this.multiSystem, this.config);
    this.resonanceEngine = new ResonanceEngine(this.multiSystem, this.config);
    this.consensusEngine = new ConsensusEngine(this.multiSystem, this.config);
    this.synthesizer = new WisdomSynthesizer(this.multiSystem, this.config);
  }
  
  /**
   * 处理输入 - 主入口
   */
  async process(input: string): Promise<CollaborationResult> {
    const startTime = Date.now();
    console.log(`\n[MultiAgentEngine] 开始处理: "${input.slice(0, 50)}..."`);
    
    // 1. 分析任务类型
    const taskType = this.scheduler.analyzeTaskType(input);
    console.log(`[MultiAgentEngine] 任务类型: ${taskType}`);
    
    // 2. 选择并唤醒意识体
    const selectedRoles = this.scheduler.selectAgents(taskType, input);
    const agents = await this.scheduler.awakenAgents(selectedRoles);
    
    // 3. 建立共振
    const resonance = await this.resonanceEngine.establishResonances(agents, input);
    
    // 4. 开始协作对话
    const dialogue = this.consensusEngine.startDialogue(
      input,
      agents.map(a => a.id)
    );
    
    // 5. 迭代对话直到收敛
    let consensus: ConsensusState = {
      round: 0,
      contributions: [],
      consensusPoints: [],
      divergencePoints: [],
      consensusLevel: 0,
      innovationLevel: 0,
      converged: false,
    };
    
    const allContributions: AgentContribution[] = [];
    
    for (let round = 0; round < this.config.maxRounds; round++) {
      console.log(`[MultiAgentEngine] 第 ${round + 1} 轮对话`);
      
      // 处理一轮
      const roundContributions = await this.consensusEngine.processRound(
        agents,
        this.llm,
        input,
        allContributions
      );
      
      allContributions.push(...roundContributions);
      
      // 计算共识状态
      consensus = this.consensusEngine.computeConsensusState(round + 1, allContributions);
      
      // 更新意识体能量
      for (const contrib of roundContributions) {
        this.scheduler.updateEnergy(contrib.agentId, -this.config.energyDecayRate);
      }
      
      // 检查收敛
      if (consensus.converged) {
        console.log(`[MultiAgentEngine] 收敛于第 ${round + 1} 轮`);
        break;
      }
      
      this.consensusEngine.advanceRound();
    }
    
    // 6. 合成最终输出
    const synthesis = await this.synthesizer.synthesize(allContributions, resonance, this.llm);
    
    // 7. 恢复能量
    this.scheduler.recoverEnergy();
    
    const processingTime = Date.now() - startTime;
    console.log(`[MultiAgentEngine] 处理完成 (${processingTime}ms)`);
    
    return {
      success: true,
      synthesis,
      consensus,
      resonance,
      agentsUsed: agents.map(a => a.id),
      totalRounds: consensus.round,
      processingTime,
    };
  }
  
  /**
   * 获取系统状态
   */
  getState() {
    return this.multiSystem.getSerializableState();
  }
  
  /**
   * 获取底层多意识体系统
   */
  getMultiSystem(): MultiConsciousnessSystem {
    return this.multiSystem;
  }
  
  /**
   * 重置引擎状态
   */
  reset(): void {
    this.scheduler.reset();
    this.consensusEngine.reset();
    // 重置底层系统
    this.multiSystem = createMultiConsciousnessSystem();
    console.log('[MultiAgentEngine] 引擎已重置');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createMultiAgentEngine(
  llm: LLMClient,
  config?: Partial<EngineConfig>
): MultiAgentCollaborationEngine {
  return new MultiAgentCollaborationEngine(llm, config);
}
