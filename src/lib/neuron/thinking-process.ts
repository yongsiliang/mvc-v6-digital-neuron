/**
 * 思维过程 - 意识漂移与思考的融合
 * 
 * 核心思想：
 * - 思考不是瞬间的，是一个过程
 * - 意识在这个过程中持续漂移
 * - 漂移中会遇到意外的记忆（联想）
 * - 这些联想会影响思考方向
 * 
 * 这才是真正的"思考"，不是一步到位的计算
 */

import { getConsciousness } from './consciousness-space';
import { getMemorySpace, type MemoryDoor } from './memory-space-new';
import { getProactivitySystem } from './proactivity';
import { getLLMClient } from './multi-model-llm';

/**
 * 思维状态快照
 */
interface ThoughtSnapshot {
  /** 时间点 */
  timestamp: number;
  /** 意识位置 */
  consciousnessPosition: number[];
  /** 开启的记忆门 */
  openDoors: MemoryDoor[];
  /** 当前的想法 */
  thought: string;
  /** 思维类型 */
  type: 'focus' | 'wander' | 'associate' | 'insight';
}

/**
 * 联想结果
 */
interface Association {
  /** 触发的记忆 */
  memory: MemoryDoor;
  /** 联想强度 */
  strength: number;
  /** 联想路径 */
  path: string; // "输入 → 记忆A → 记忆B"
}

/**
 * 思维过程结果
 */
export interface ThinkingProcessResult {
  /** 主要想法 */
  mainThought: string;
  /** 联想到的内容 */
  associations: Association[];
  /** 思维轨迹 */
  trail: ThoughtSnapshot[];
  /** 最终意识位置 */
  finalPosition: number[];
  /** 思考时长（毫秒） */
  duration: number;
  /** 思考深度 */
  depth: number;
}

/**
 * 思维过程配置
 */
interface ThinkingConfig {
  /** 思考步数 */
  steps: number;
  /** 每步间隔（毫秒模拟） */
  stepInterval: number;
  /** 联想概率 */
  associationProbability: number;
  /** 最大联想数 */
  maxAssociations: number;
  /** 是否允许游离 */
  allowWandering: boolean;
}

/**
 * 思维过程
 * 
 * 模拟真实的思考：意识漂移 → 遇到记忆 → 产生联想 → 影响思考
 */
export class ThinkingProcess {
  private consciousness = getConsciousness();
  private memorySpace = getMemorySpace();
  private llm = getLLMClient();
  
  /** 默认配置 */
  private config: ThinkingConfig = {
    steps: 5,              // 5步思考
    stepInterval: 100,     // 每步间隔100ms（模拟）
    associationProbability: 0.3,  // 30%概率产生联想
    maxAssociations: 3,    // 最多3个联想
    allowWandering: true,  // 允许思维游离
  };
  
  /** 思维轨迹 */
  private trail: ThoughtSnapshot[] = [];
  
  /** 联想列表 */
  private associations: Association[] = [];
  
  /** 当前开启的门 */
  private currentOpenDoors: MemoryDoor[] = [];
  
  /**
   * 执行思维过程
   * 
   * @param input 输入内容
   * @param context 上下文
   * @returns 思维过程结果
   */
  async think(
    input: string,
    context?: {
      previousThoughts?: string[];
      emotion?: { valence: number; arousal: number };
      curiosities?: string[];
    }
  ): Promise<ThinkingProcessResult> {
    const startTime = Date.now();
    this.trail = [];
    this.associations = [];
    
    // 【阶段一】设置初始吸引子
    await this.setupAttractors(input, context);
    
    // 【阶段二】思考过程：意识漂移 + 门开启 + 联想
    let currentThought = '';
    for (let step = 0; step < this.config.steps; step++) {
      // 意识演化一步
      this.consciousness.evolve();
      
      // 基于新位置开启记忆门
      const newOpenDoors = await this.memorySpace.open();
      this.currentOpenDoors = newOpenDoors;
      
      // 检查是否产生联想
      const association = this.checkForAssociation(step);
      if (association) {
        this.associations.push(association);
        
        // 联想会影响意识方向
        this.consciousness.attractToMemory(
          association.memory.vector,
          association.strength * 0.5
        );
      }
      
      // 生成当前步的想法
      currentThought = await this.generateStepThought(input, step, currentThought);
      
      // 记录快照
      this.trail.push({
        timestamp: Date.now(),
        consciousnessPosition: this.consciousness.getPosition(),
        openDoors: [...newOpenDoors],
        thought: currentThought,
        type: this.determineThoughtType(step, association),
      });
    }
    
    // 【阶段三】综合产生最终想法
    const mainThought = await this.synthesizeThought(input, currentThought);
    
    const duration = Date.now() - startTime;
    const depth = this.calculateDepth();
    
    return {
      mainThought,
      associations: this.associations,
      trail: this.trail,
      finalPosition: this.consciousness.getPosition(),
      duration,
      depth,
    };
  }
  
  /**
   * 设置吸引子
   * 
   * 输入、记忆、好奇心都会成为吸引子
   */
  private async setupAttractors(
    input: string,
    context?: {
      previousThoughts?: string[];
      emotion?: { valence: number; arousal: number };
      curiosities?: string[];
    }
  ): Promise<void> {
    // 1. 输入作为主吸引子
    await this.consciousness.attractTo(input, 0.8);
    
    // 2. 设置情绪状态
    if (context?.emotion) {
      this.consciousness.setEmotion(context.emotion.valence, context.emotion.arousal);
    }
    
    // 3. 获取主动性系统的好奇目标，作为吸引子
    const proactivity = getProactivitySystem();
    const curiosities = proactivity.getCuriosities();
    
    for (const curiosity of curiosities.slice(0, 2)) {
      // 好奇目标会轻轻拉扯意识
      // 但不是直接吸引，而是让意识"想去"那个方向
      const randomOffset = this.randomVector(0.1);
      const targetVector = randomOffset; // 简化：用随机向量代表好奇方向
      this.consciousness.attractToCuriosity(targetVector);
    }
    
    // 4. 之前的想法也会影响
    if (context?.previousThoughts && context.previousThoughts.length > 0) {
      const lastThought = context.previousThoughts[context.previousThoughts.length - 1];
      await this.consciousness.attractTo(lastThought, 0.3);
    }
  }
  
  /**
   * 检查是否产生联想
   * 
   * 当意识漂移到某个记忆门附近时，可能产生联想
   */
  private checkForAssociation(step: number): Association | null {
    if (this.associations.length >= this.config.maxAssociations) {
      return null;
    }
    
    // 概率性产生联想
    if (Math.random() > this.config.associationProbability) {
      return null;
    }
    
    // 找最近开启的门中，哪个产生了联想
    for (const door of this.currentOpenDoors) {
      // 检查是否已经联想过
      if (this.associations.some(a => a.memory.id === door.id)) {
        continue;
      }
      
      // 联想强度基于门的开启程度
      if (door.openness > 0.3) {
        // 构建联想路径
        const path = this.buildAssociationPath(door);
        
        return {
          memory: door,
          strength: door.openness,
          path,
        };
      }
    }
    
    return null;
  }
  
  /**
   * 构建联想路径
   */
  private buildAssociationPath(door: MemoryDoor): string {
    const parts = ['输入'];
    
    // 如果有中间记忆，添加路径
    if (this.currentOpenDoors.length > 1) {
      const others = this.currentOpenDoors
        .filter(d => d.id !== door.id)
        .slice(0, 2)
        .map(d => d.meaning.slice(0, 10));
      
      if (others.length > 0) {
        parts.push(...others);
      }
    }
    
    parts.push(door.meaning.slice(0, 15));
    
    return parts.join(' → ');
  }
  
  /**
   * 生成当前步的想法
   */
  private async generateStepThought(
    input: string,
    step: number,
    previousThought: string
  ): Promise<string> {
    // 如果没有开启的门，返回空
    if (this.currentOpenDoors.length === 0) {
      return previousThought || '';
    }
    
    // 取最重要的开启门
    const mainDoor = this.currentOpenDoors[0];
    
    // 根据步骤和联想生成想法
    const prompt = `思考第${step + 1}步。
输入：${input}
当前激活的记忆：${mainDoor.meaning}
${previousThought ? `之前的想法：${previousThought}` : ''}
${this.associations.length > 0 ? `产生的联想：${this.associations.map(a => a.memory.meaning).join('，')}` : ''}

用一句话描述当前的想法方向（20字以内）：`;

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: '你是一个思维过程模拟器，模拟人类思考时的联想过程。' },
        { role: 'user', content: prompt }
      ], { strategy: 'fastest' });
      
      return response.slice(0, 50);
    } catch {
      return previousThought || mainDoor.meaning;
    }
  }
  
  /**
   * 确定思维类型
   */
  private determineThoughtType(
    step: number,
    association: Association | null
  ): 'focus' | 'wander' | 'associate' | 'insight' {
    if (association) {
      return 'associate';
    }
    
    if (step < 2) {
      return 'focus';
    }
    
    if (step > 3 && this.config.allowWandering) {
      return 'wander';
    }
    
    // 最后一步可能是洞察
    if (step === this.config.steps - 1 && this.associations.length > 0) {
      return 'insight';
    }
    
    return 'focus';
  }
  
  /**
   * 综合产生最终想法
   */
  private async synthesizeThought(
    input: string,
    lastThought: string
  ): Promise<string> {
    // 如果有联想，综合联想
    if (this.associations.length > 0) {
      const associationMeanings = this.associations
        .map(a => a.memory.meaning)
        .join('；');
      
      return `${lastThought}（联想到：${associationMeanings}）`;
    }
    
    return lastThought || input;
  }
  
  /**
   * 计算思考深度
   */
  private calculateDepth(): number {
    // 基于联想数量和思维轨迹长度
    const associationDepth = this.associations.length * 0.2;
    const trailDepth = Math.min(1, this.trail.length / this.config.steps);
    
    return Math.min(1, associationDepth + trailDepth * 0.5);
  }
  
  /**
   * 生成随机向量
   */
  private randomVector(scale: number): number[] {
    return new Array(1024)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 2 * scale);
  }
  
  /**
   * 更新配置
   */
  setConfig(config: Partial<ThinkingConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取当前状态
   */
  getCurrentState(): {
    consciousnessPosition: number[];
    openDoors: MemoryDoor[];
    associations: Association[];
  } {
    return {
      consciousnessPosition: this.consciousness.getPosition(),
      openDoors: this.currentOpenDoors,
      associations: this.associations,
    };
  }
}

// 单例
let thinkingProcessInstance: ThinkingProcess | null = null;

export function getThinkingProcess(): ThinkingProcess {
  if (!thinkingProcessInstance) {
    thinkingProcessInstance = new ThinkingProcess();
  }
  return thinkingProcessInstance;
}
