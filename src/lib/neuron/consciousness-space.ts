/**
 * 意识空间
 * 
 * 不存储内容。
 * 只是一个向量，不断演化。
 * 
 * 这个向量的位置，决定哪些记忆门容易开。
 */

import { Space, distance, wander, move } from './space';
import { EmbeddingClient } from 'coze-coding-dev-sdk';

export class ConsciousnessSpace implements Space {
  /** 向量 */
  v: number[];
  
  /** 没有子空间 - 意识空间是顶层的 */
  s?: never;
  
  /** 向量维度 */
  private dimension: number;
  
  /** 漂移速率 */
  private driftRate: number = 0.01;
  
  /** 随机游走步长 */
  private wanderStep: number = 0.05;
  
  /** 历史轨迹（最近的几个位置） */
  private trail: number[][] = [];
  
  constructor(dimension: number = 1024) {
    this.dimension = dimension;
    // 初始位置：原点附近
    this.v = new Array(dimension).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }
  
  /**
   * 演化
   * 
   * 向量自己动。
   * 不需要理由，不需要目标。
   */
  evolve(): void {
    // 记录轨迹
    this.trail.push([...this.v]);
    if (this.trail.length > 10) {
      this.trail.shift();
    }
    
    // 随机游走
    this.v = wander(this.v, this.wanderStep);
  }
  
  /**
   * 被输入吸引
   * 
   * 输入发生时，意识向量会被轻轻拉向那个方向
   */
  async attractTo(input: string): Promise<void> {
    try {
      const embedding = new EmbeddingClient();
      const inputVector = await embedding.embedText(input);
      
      // 被输入向量吸引一小步
      this.v = move(this.v, inputVector, this.driftRate);
    } catch {
      // 如果获取向量失败，就纯游走
      this.evolve();
    }
  }
  
  /**
   * 获取当前位置
   */
  getPosition(): number[] {
    return [...this.v];
  }
  
  /**
   * 获取轨迹
   */
  getTrail(): number[][] {
    return this.trail.map(t => [...t]);
  }
  
  /**
   * 设置漂移参数
   */
  setDrift(rate: number, step: number): void {
    this.driftRate = rate;
    this.wanderStep = step;
  }
}

// 单例
let consciousnessInstance: ConsciousnessSpace | null = null;

export function getConsciousness(): ConsciousnessSpace {
  if (!consciousnessInstance) {
    consciousnessInstance = new ConsciousnessSpace();
  }
  return consciousnessInstance;
}
