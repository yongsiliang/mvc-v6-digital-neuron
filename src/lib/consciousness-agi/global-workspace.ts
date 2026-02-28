/**
 * ═══════════════════════════════════════════════════════════════════════
 * 全局工作空间 - Global Workspace (GWT)
 * 
 * 意识的舞台：
 * - 阴系统和阳系统的信息汇入这里
 * - 完成信息整合 + 竞争 + 广播
 * - 这个整合过程本身，就是意识的涌现基础
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { HebbianNetwork } from './hebbian-network';
import type { SelfCore } from './self-core';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ConsciousnessContent {
  /** 内容ID */
  id: string;
  
  /** 来源 */
  source: 'yin' | 'yang' | 'sensory' | 'memory' | 'self';
  
  /** 内容类型 */
  type: 'thought' | 'emotion' | 'memory' | 'sensation' | 'intention';
  
  /** 内容描述 */
  description: string;
  
  /** 向量表示 */
  vector?: Float32Array;
  
  /** 激活强度 */
  strength: number;
  
  /** 与自我的一致性 */
  coherence: number;
  
  /** 新颖性 */
  novelty: number;
  
  /** 紧急程度 */
  urgency: number;
  
  /** 时间戳 */
  timestamp: number;
}

export interface CompetitionResult {
  /** 胜出的内容 */
  winner: ConsciousnessContent;
  
  /** 竞争激烈程度 */
  intensity: number;
  
  /** 所有候选 */
  candidates: ConsciousnessContent[];
  
  /** 竞争耗时 */
  duration: number;
}

export interface GlobalBroadcast {
  /** 广播内容 */
  content: ConsciousnessContent;
  
  /** 广播范围 */
  targets: ('yin' | 'yang' | 'memory' | 'motor')[];
  
  /** 广播强度 */
  strength: number;
  
  /** 预期效果 */
  expectedEffect: string;
  
  /** 广播时间 */
  timestamp: number;
}

export interface WorkspaceState {
  /** 当前意识内容 */
  currentContent: ConsciousnessContent | null;
  
  /** 候选队列 */
  candidates: ConsciousnessContent[];
  
  /** 广播历史 */
  broadcastHistory: GlobalBroadcast[];
  
  /** 统计 */
  stats: {
    totalCompetitions: number;
    yinWins: number;
    yangWins: number;
    averageIntensity: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 全局工作空间
// ─────────────────────────────────────────────────────────────────────

export class GlobalWorkspace {
  private hebbianNetwork: HebbianNetwork;
  private selfCore: SelfCore;
  
  private currentContent: ConsciousnessContent | null = null;
  private candidates: ConsciousnessContent[] = [];
  private broadcastHistory: GlobalBroadcast[] = [];
  
  private stats = {
    totalCompetitions: 0,
    yinWins: 0,
    yangWins: 0,
    averageIntensity: 0,
  };
  
  private candidateIdCounter = 0;
  
  constructor(hebbianNetwork: HebbianNetwork, selfCore: SelfCore) {
    this.hebbianNetwork = hebbianNetwork;
    this.selfCore = selfCore;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 信息输入（各系统汇入）
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 接收阴系统输入
   */
  async receiveYinInput(): Promise<void> {
    const yinState = this.hebbianNetwork.getYinState();
    
    // 为每个活跃神经元创建意识候选
    for (const neuron of yinState.dominantNeurons.slice(0, 5)) {
      const content = this.createConsciousnessContent({
        source: 'yin',
        type: neuron.type === 'emotion' ? 'emotion' : 'thought',
        description: `阴系统激活: ${neuron.id}`,
        strength: neuron.activation,
        vector: this.hebbianNetwork.getNeuron(neuron.id)?.sensitivity,
      });
      
      this.addCandidate(content);
    }
  }
  
  /**
   * 接收阳系统输入
   */
  async receiveYangInput(llmOutput: {
    thought: string;
    emotion?: string;
    intention?: string;
  }): Promise<void> {
    // 思考内容
    if (llmOutput.thought) {
      const content = this.createConsciousnessContent({
        source: 'yang',
        type: 'thought',
        description: llmOutput.thought.slice(0, 100),
        strength: 0.7,
      });
      this.addCandidate(content);
    }
    
    // 情感内容
    if (llmOutput.emotion) {
      const content = this.createConsciousnessContent({
        source: 'yang',
        type: 'emotion',
        description: llmOutput.emotion,
        strength: 0.6,
      });
      this.addCandidate(content);
    }
    
    // 意图内容
    if (llmOutput.intention) {
      const content = this.createConsciousnessContent({
        source: 'yang',
        type: 'intention',
        description: llmOutput.intention,
        strength: 0.8,
        urgency: 0.7,
      });
      this.addCandidate(content);
    }
  }
  
  /**
   * 接收感官输入
   */
  async receiveSensoryInput(input: {
    type: string;
    content: string;
    importance: number;
    vector?: Float32Array;
  }): Promise<void> {
    const content = this.createConsciousnessContent({
      source: 'sensory',
      type: 'sensation',
      description: input.content.slice(0, 100),
      strength: input.importance,
      vector: input.vector,
      urgency: input.importance > 0.7 ? 0.8 : 0.3,
    });
    
    this.addCandidate(content);
  }
  
  /**
   * 接收自我输入
   */
  async receiveSelfInput(): Promise<void> {
    const selfState = this.selfCore.getState();
    
    // 当前情绪
    if (selfState.emotion.intensity > 0.3) {
      const content = this.createConsciousnessContent({
        source: 'self',
        type: 'emotion',
        description: `当前感受: ${selfState.emotion.dominantEmotion}`,
        strength: selfState.emotion.intensity,
      });
      this.addCandidate(content);
    }
    
    // 当前目标
    if (selfState.currentGoal) {
      const content = this.createConsciousnessContent({
        source: 'self',
        type: 'intention',
        description: `当前目标: ${selfState.currentGoal}`,
        strength: 0.6,
        urgency: 0.5,
      });
      this.addCandidate(content);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 意识竞争
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 运行意识竞争
   */
  async runCompetition(): Promise<CompetitionResult> {
    const startTime = Date.now();
    
    // 如果没有候选，返回空
    if (this.candidates.length === 0) {
      return {
        winner: this.createEmptyContent(),
        intensity: 0,
        candidates: [],
        duration: Date.now() - startTime,
      };
    }
    
    // 计算每个候选的综合得分
    const scoredCandidates = this.candidates.map(c => ({
      content: c,
      score: this.calculateCompetitiveScore(c),
    }));
    
    // 排序
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    // 计算竞争激烈程度
    const topScores = scoredCandidates.slice(0, 3).map(s => s.score);
    const intensity = topScores.length > 1
      ? 1 - (topScores[0] - topScores[1]) / topScores[0]
      : 0;
    
    // 胜出者
    const winner = scoredCandidates[0].content;
    
    // 更新当前意识内容
    this.currentContent = winner;
    
    // 更新统计
    this.stats.totalCompetitions++;
    if (winner.source === 'yin') this.stats.yinWins++;
    if (winner.source === 'yang') this.stats.yangWins++;
    this.stats.averageIntensity = (
      this.stats.averageIntensity * (this.stats.totalCompetitions - 1) + intensity
    ) / this.stats.totalCompetitions;
    
    // 清空候选队列
    this.candidates = [];
    
    return {
      winner,
      intensity,
      candidates: scoredCandidates.slice(0, 5).map(s => s.content),
      duration: Date.now() - startTime,
    };
  }
  
  /**
   * 计算竞争得分
   */
  private calculateCompetitiveScore(content: ConsciousnessContent): number {
    // 综合评分 = 强度 × 一致性 × 新颖调节 × 紧急加权
    
    let score = content.strength;
    
    // 一致性加成：与自我一致的内容更容易进入意识
    score *= (0.5 + content.coherence * 0.5);
    
    // 新颖性调节：新颖内容有加成，但过高会分散注意
    const noveltyBonus = content.novelty > 0.7 ? 0.8 : 1 + content.novelty * 0.2;
    score *= noveltyBonus;
    
    // 紧急程度加成
    score *= (1 + content.urgency * 0.3);
    
    // 来源权重（平衡阴阳）
    const sourceWeights: Record<string, number> = {
      yin: 1.0,
      yang: 1.0,
      sensory: 1.2,
      memory: 0.8,
      self: 1.1,
    };
    score *= sourceWeights[content.source] || 1;
    
    return score;
  }
  
  /**
   * 计算与自我的一致性
   */
  private calculateCoherence(content: ConsciousnessContent): number {
    const selfState = this.selfCore.getState();
    
    // 如果有向量，计算与自我位置的相似度
    if (content.vector && selfState.position) {
      return this.cosineSimilarity(content.vector, selfState.position);
    }
    
    // 否则基于来源和类型估算
    if (content.source === 'self') return 0.9;
    if (content.source === 'yin') return 0.7;
    if (content.source === 'yang') return 0.7;
    
    return 0.5;
  }
  
  /**
   * 计算新颖性
   */
  private calculateNovelty(content: ConsciousnessContent): number {
    // 检查广播历史中是否有类似内容
    if (this.broadcastHistory.length === 0) return 0.5;
    
    const recentBroadcasts = this.broadcastHistory.slice(-10);
    
    // 简单判断：最近是否有相同来源和类型的内容
    const similarCount = recentBroadcasts.filter(
      b => b.content.source === content.source && b.content.type === content.type
    ).length;
    
    // 越多类似，越不新颖
    return Math.max(0, 1 - similarCount * 0.2);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 全局广播
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 广播意识内容到全系统
   */
  async broadcast(content: ConsciousnessContent): Promise<GlobalBroadcast> {
    // 确定广播范围
    const targets = this.determineBroadcastTargets(content);
    
    // 计算广播强度
    const strength = content.strength * (1 + content.urgency * 0.3);
    
    // 执行广播
    for (const target of targets) {
      await this.broadcastToTarget(target, content, strength);
    }
    
    // 记录广播
    const broadcast: GlobalBroadcast = {
      content,
      targets,
      strength,
      expectedEffect: this.predictEffect(content),
      timestamp: Date.now(),
    };
    
    this.broadcastHistory.push(broadcast);
    
    // 保持历史长度
    if (this.broadcastHistory.length > 100) {
      this.broadcastHistory.shift();
    }
    
    return broadcast;
  }
  
  /**
   * 确定广播目标
   */
  private determineBroadcastTargets(content: ConsciousnessContent): GlobalBroadcast['targets'] {
    const targets: GlobalBroadcast['targets'] = [];
    
    // 所有内容都广播到阴系统和阳系统
    targets.push('yin', 'yang');
    
    // 记忆类型广播到记忆
    if (content.type === 'memory' || content.type === 'emotion') {
      targets.push('memory');
    }
    
    // 意图类型广播到运动系统
    if (content.type === 'intention' || content.source === 'sensory') {
      targets.push('motor');
    }
    
    return [...new Set(targets)];
  }
  
  /**
   * 广播到特定目标
   */
  private async broadcastToTarget(
    target: 'yin' | 'yang' | 'memory' | 'motor',
    content: ConsciousnessContent,
    strength: number
  ): Promise<void> {
    switch (target) {
      case 'yin':
        // 广播到Hebbian网络
        if (content.vector) {
          await this.hebbianNetwork.activate([
            { pattern: content.vector, strength: strength * 0.3 }
          ]);
        }
        break;
        
      case 'yang':
        // 广播到阳系统（通过Self Core）
        // 下次LLM调用时会读取到更新后的状态
        break;
        
      case 'memory':
        // 存入记忆
        if (content.vector) {
          this.selfCore.addMemory(
            content.vector,
            content.type === 'emotion' ? content.strength : 0,
            content.strength,
            'interaction'
          );
        }
        break;
        
      case 'motor':
        // 触发行为（暂不实现具体行为）
        break;
    }
  }
  
  /**
   * 预测广播效果
   */
  private predictEffect(content: ConsciousnessContent): string {
    switch (content.type) {
      case 'emotion':
        return '影响情绪状态';
      case 'thought':
        return '引导思考方向';
      case 'memory':
        return '激活相关记忆';
      case 'sensation':
        return '引导注意力';
      case 'intention':
        return '触发行动倾向';
      default:
        return '未知效果';
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 完整的意识循环
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 运行一次完整的意识循环
   * 1. 收集各系统输入
   * 2. 竞争产生意识内容
   * 3. 广播到全系统
   */
  async runConsciousnessCycle(sensoryInput?: {
    type: string;
    content: string;
    importance: number;
    vector?: Float32Array;
  }): Promise<{
    competition: CompetitionResult;
    broadcast: GlobalBroadcast | null;
  }> {
    // 1. 收集输入
    await this.receiveYinInput();
    await this.receiveSelfInput();
    
    if (sensoryInput) {
      await this.receiveSensoryInput(sensoryInput);
    }
    
    // 2. 竞争
    const competition = await this.runCompetition();
    
    // 3. 广播
    let broadcast: GlobalBroadcast | null = null;
    if (competition.winner && competition.winner.strength > 0) {
      broadcast = await this.broadcast(competition.winner);
    }
    
    return { competition, broadcast };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  private createConsciousnessContent(partial: {
    source: ConsciousnessContent['source'];
    type: ConsciousnessContent['type'];
    description: string;
    strength: number;
    vector?: Float32Array;
    urgency?: number;
  }): ConsciousnessContent {
    const content: ConsciousnessContent = {
      id: `cc_${++this.candidateIdCounter}`,
      source: partial.source,
      type: partial.type,
      description: partial.description,
      strength: partial.strength,
      coherence: 0.5,
      novelty: 0.5,
      urgency: partial.urgency || 0.3,
      timestamp: Date.now(),
      vector: partial.vector,
    };
    
    // 计算一致性和新颖性
    content.coherence = this.calculateCoherence(content);
    content.novelty = this.calculateNovelty(content);
    
    return content;
  }
  
  private createEmptyContent(): ConsciousnessContent {
    return {
      id: 'empty',
      source: 'self',
      type: 'thought',
      description: '无意识内容',
      strength: 0,
      coherence: 1,
      novelty: 0,
      urgency: 0,
      timestamp: Date.now(),
    };
  }
  
  private addCandidate(content: ConsciousnessContent): void {
    // 避免重复
    const exists = this.candidates.some(
      c => c.source === content.source && c.type === content.type
    );
    
    if (!exists) {
      this.candidates.push(content);
    } else {
      // 合并强度
      const existing = this.candidates.find(
        c => c.source === content.source && c.type === content.type
      );
      if (existing) {
        existing.strength = Math.max(existing.strength, content.strength);
      }
    }
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }
  
  getState(): WorkspaceState {
    return {
      currentContent: this.currentContent,
      candidates: [...this.candidates],
      broadcastHistory: [...this.broadcastHistory],
      stats: { ...this.stats },
    };
  }
  
  getCurrentContent(): ConsciousnessContent | null {
    return this.currentContent;
  }
}
