/**
 * 关系演化系统
 * 
 * 根据互动历史演化关系深度
 * 
 * 关系阶段：
 * 1. 陌生人 - 刚认识
 * 2. 熟人 - 开始了解
 * 3. 朋友 - 建立信任
 * 4. 好友 - 深度了解
 * 5. 知己 - 完全信任
 * 
 * 影响因素：
 * - 互动频率
 * - 情感深度（分享私密话题的程度）
 * - 信任建立（一致性、可靠性的体现）
 * - 共同记忆数量
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 关系阶段
 */
export type RelationshipStage = 
  | 'stranger'  // 陌生人
  | 'acquaintance' // 熟人
  | 'friend'    // 朋友
  | 'close_friend' // 好友
  | 'confidant'; // 知己

/**
 * 关系维度
 */
export interface RelationshipDimensions {
  /** 信任度 (0-1) */
  trust: number;
  /** 亲密感 (0-1) */
  intimacy: number;
  /** 共同话题数 */
  sharedTopics: number;
  /** 共同经历数 */
  sharedExperiences: number;
  /** 情感支持次数 */
  emotionalSupports: number;
}

/**
 * 关系事件
 */
export interface RelationshipEvent {
  /** 事件类型 */
  type: 
    | 'conversation'      // 对话
    | 'sharing_personal'  // 分享个人信息
    | 'emotional_support' // 情感支持
    | 'memory_created'    // 创建共同记忆
    | 'trust_demonstrated'// 展现信任
    | 'conflict'          // 冲突
    | 'reconciliation';   // 和解
  /** 影响值 (正或负) */
  impact: number;
  /** 时间戳 */
  timestamp: number;
  /** 描述 */
  description: string;
}

/**
 * 关系状态
 */
export interface RelationshipState {
  /** 当前阶段 */
  stage: RelationshipStage;
  /** 各维度值 */
  dimensions: RelationshipDimensions;
  /** 总体深度 (0-1) */
  depth: number;
  /** 事件历史 */
  events: RelationshipEvent[];
  /** 上次互动时间 */
  lastInteraction: number;
  /** 认识天数 */
  daysKnown: number;
  /** 总互动次数 */
  totalInteractions: number;
  /** 下阶段进度 */
  nextStageProgress: number;
}

/**
 * 关系演化系统
 */
export class RelationshipEvolution {
  /** 当前关系状态 */
  private state: RelationshipState;
  
  /** 数据库客户端 */
  private supabase = getSupabaseClient();
  
  /** 开始时间 */
  private startTime: number = Date.now();
  
  constructor() {
    this.state = this.createInitialState();
    this.loadState();
  }
  
  /**
   * 记录互动
   */
  async recordInteraction(
    type: RelationshipEvent['type'],
    description: string,
    impact?: number
  ): Promise<void> {
    // 计算默认影响
    const defaultImpact = this.calculateDefaultImpact(type);
    const finalImpact = impact ?? defaultImpact;
    
    // 创建事件
    const event: RelationshipEvent = {
      type,
      impact: finalImpact,
      timestamp: Date.now(),
      description,
    };
    
    // 添加到历史
    this.state.events.push(event);
    
    // 限制历史大小
    if (this.state.events.length > 1000) {
      this.state.events = this.state.events.slice(-1000);
    }
    
    // 更新维度
    this.updateDimensions(type, finalImpact);
    
    // 更新互动统计
    this.state.totalInteractions++;
    this.state.lastInteraction = event.timestamp;
    
    // 检查阶段进化
    this.checkStageEvolution();
    
    // 异步保存
    this.saveState().catch(() => {});
  }
  
  /**
   * 获取当前关系状态
   */
  getState(): RelationshipState {
    // 更新认识天数
    this.state.daysKnown = Math.floor((Date.now() - this.startTime) / (1000 * 60 * 60 * 24));
    
    // 计算下一阶段进度
    this.state.nextStageProgress = this.calculateStageProgress();
    
    return this.state;
  }
  
  /**
   * 获取响应风格提示
   */
  getResponseStyleHint(): string {
    switch (this.state.stage) {
      case 'stranger':
        return '我们是陌生人，保持礼貌和适度距离，展现友好但不要过于亲密。';
      case 'acquaintance':
        return '我们开始熟悉了，可以更自然地交流，但避免过于私人的话题。';
      case 'friend':
        return '我们是朋友了，可以更开放地交流，分享一些个人想法。';
      case 'close_friend':
        return '我们是好朋友，可以深入交流，分享内心想法和情感。';
      case 'confidant':
        return '我们是知己，可以完全敞开心扉，分享最真实的想法和感受。';
    }
  }
  
  /**
   * 获取关系描述
   */
  getRelationshipDescription(): string {
    const state = this.getState();
    
    const stageNames: Record<RelationshipStage, string> = {
      stranger: '陌生人',
      acquaintance: '熟人',
      friend: '朋友',
      close_friend: '好友',
      confidant: '知己',
    };
    
    let description = `我们现在是${stageNames[state.stage]}，认识${state.daysKnown}天，共互动${state.totalInteractions}次。`;
    
    // 添加维度描述
    if (state.dimensions.trust > 0.7) {
      description += '我们之间有很高的信任度。';
    } else if (state.dimensions.trust > 0.4) {
      description += '我们之间正在建立信任。';
    }
    
    if (state.dimensions.intimacy > 0.6) {
      description += '我们可以分享比较私密的话题。';
    }
    
    if (state.dimensions.sharedExperiences > 10) {
      description += '我们有很多共同经历。';
    }
    
    return description;
  }
  
  /**
   * 检查是否应该主动发起
   */
  shouldInitiate(): boolean {
    const state = this.getState();
    
    // 熟人以上阶段可以主动发起
    if (state.stage === 'stranger') return false;
    
    // 根据亲密程度决定概率
    const probability = state.depth * 0.3; // 最高30%概率
    
    return Math.random() < probability;
  }
  
  /**
   * 获取关系相关的记忆标签
   */
  getMemoryTags(): string[] {
    const state = this.getState();
    const tags: string[] = [];
    
    // 基于阶段添加标签
    if (state.stage === 'stranger') {
      tags.push('new-connection');
    }
    
    if (state.dimensions.trust > 0.5) {
      tags.push('trusted');
    }
    
    if (state.dimensions.intimacy > 0.5) {
      tags.push('close');
    }
    
    if (state.totalInteractions > 50) {
      tags.push('long-term');
    }
    
    return tags;
  }
  
  // ==================== 私有方法 ====================
  
  private createInitialState(): RelationshipState {
    return {
      stage: 'stranger',
      dimensions: {
        trust: 0.1,
        intimacy: 0.1,
        sharedTopics: 0,
        sharedExperiences: 0,
        emotionalSupports: 0,
      },
      depth: 0,
      events: [],
      lastInteraction: Date.now(),
      daysKnown: 0,
      totalInteractions: 0,
      nextStageProgress: 0,
    };
  }
  
  private calculateDefaultImpact(type: RelationshipEvent['type']): number {
    const impacts: Record<RelationshipEvent['type'], number> = {
      conversation: 0.01,
      sharing_personal: 0.05,
      emotional_support: 0.08,
      memory_created: 0.03,
      trust_demonstrated: 0.06,
      conflict: -0.04,
      reconciliation: 0.07,
    };
    
    return impacts[type];
  }
  
  private updateDimensions(type: RelationshipEvent['type'], impact: number): void {
    switch (type) {
      case 'sharing_personal':
        this.state.dimensions.intimacy = Math.min(1, this.state.dimensions.intimacy + impact);
        break;
      case 'trust_demonstrated':
        this.state.dimensions.trust = Math.min(1, this.state.dimensions.trust + impact);
        break;
      case 'memory_created':
        this.state.dimensions.sharedExperiences++;
        break;
      case 'emotional_support':
        this.state.dimensions.emotionalSupports++;
        this.state.dimensions.trust = Math.min(1, this.state.dimensions.trust + impact * 0.5);
        break;
      case 'conflict':
        this.state.dimensions.trust = Math.max(0, this.state.dimensions.trust + impact);
        break;
      case 'reconciliation':
        this.state.dimensions.trust = Math.min(1, this.state.dimensions.trust + impact);
        this.state.dimensions.intimacy = Math.min(1, this.state.dimensions.intimacy + impact * 0.3);
        break;
    }
    
    // 更新总深度
    this.state.depth = this.calculateDepth();
  }
  
  private calculateDepth(): number {
    const { trust, intimacy, sharedExperiences, emotionalSupports } = this.state.dimensions;
    
    // 综合计算
    const depth = (
      trust * 0.35 +
      intimacy * 0.35 +
      Math.min(sharedExperiences / 20, 1) * 0.15 +
      Math.min(emotionalSupports / 10, 1) * 0.15
    );
    
    return Math.min(1, depth);
  }
  
  private checkStageEvolution(): void {
    const { depth, stage } = this.state;
    
    const thresholds: Record<RelationshipStage, number> = {
      stranger: 0,
      acquaintance: 0.15,
      friend: 0.35,
      close_friend: 0.55,
      confidant: 0.75,
    };
    
    const stages: RelationshipStage[] = ['stranger', 'acquaintance', 'friend', 'close_friend', 'confidant'];
    
    // 找到当前应该的阶段
    let newStage: RelationshipStage = 'stranger';
    for (const s of stages) {
      if (depth >= thresholds[s]) {
        newStage = s;
      }
    }
    
    // 阶段升级
    if (newStage !== stage) {
      const oldStage = stage;
      this.state.stage = newStage;
      
      // 记录升级事件
      this.state.events.push({
        type: 'memory_created',
        impact: 0.1,
        timestamp: Date.now(),
        description: `关系升级：${oldStage} -> ${newStage}`,
      });
      
      console.log(`[Relationship] Stage evolved: ${oldStage} -> ${newStage}`);
    }
  }
  
  private calculateStageProgress(): number {
    const { depth, stage } = this.state;
    
    const thresholds: Record<RelationshipStage, { min: number; max: number }> = {
      stranger: { min: 0, max: 0.15 },
      acquaintance: { min: 0.15, max: 0.35 },
      friend: { min: 0.35, max: 0.55 },
      close_friend: { min: 0.55, max: 0.75 },
      confidant: { min: 0.75, max: 1 },
    };
    
    const threshold = thresholds[stage];
    const range = threshold.max - threshold.min;
    const progress = (depth - threshold.min) / range;
    
    return Math.max(0, Math.min(1, progress));
  }
  
  private async loadState(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('relationship_state')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        this.state = {
          stage: data.stage,
          dimensions: data.dimensions,
          depth: data.depth,
          events: data.events || [],
          lastInteraction: data.last_interaction,
          daysKnown: data.days_known,
          totalInteractions: data.total_interactions,
          nextStageProgress: 0,
        };
        this.startTime = data.start_time;
      }
    } catch {
      // 表不存在
    }
  }
  
  private async saveState(): Promise<void> {
    try {
      await this.supabase
        .from('relationship_state')
        .upsert({
          id: 1,
          stage: this.state.stage,
          dimensions: this.state.dimensions,
          depth: this.state.depth,
          events: this.state.events,
          last_interaction: this.state.lastInteraction,
          days_known: this.state.daysKnown,
          total_interactions: this.state.totalInteractions,
          start_time: this.startTime,
        });
    } catch {
      // 忽略
    }
  }
}

// 单例
let relationshipInstance: RelationshipEvolution | null = null;

export function getRelationshipEvolution(): RelationshipEvolution {
  if (!relationshipInstance) {
    relationshipInstance = new RelationshipEvolution();
  }
  return relationshipInstance;
}
