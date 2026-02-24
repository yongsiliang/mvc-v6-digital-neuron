/**
 * 空间 - 最基础的结构
 * 
 * 向量决定位置
 * 距离决定关系
 * 分形决定结构
 */

/**
 * 空间
 * 
 * 一个向量，零个或多个子空间。
 * 就是这样。
 */
export interface Space {
  /** 向量 - 位置 */
  v: number[];
  /** 子空间 - 分形 */
  s?: Space[];
}

/**
 * 向量距离
 */
export function distance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  
  return Math.sqrt(sum);
}

/**
 * 向量移动
 * 
 * 向目标方向移动一小步
 */
export function move(from: number[], to: number[], rate: number): number[] {
  if (from.length !== to.length) return from;
  
  return from.map((f, i) => f + (to[i] - f) * rate);
}

/**
 * 向量随机游走
 */
export function wander(v: number[], step: number): number[] {
  return v.map(x => x + (Math.random() - 0.5) * step * 2);
}

/**
 * 在空间中找最近的子空间
 */
export function nearest(space: Space, target: number[]): Space | null {
  if (!space.s || space.s.length === 0) return null;
  
  let minDist = Infinity;
  let nearestSpace: Space | null = null;
  
  for (const sub of space.s) {
    const d = distance(sub.v, target);
    if (d < minDist) {
      minDist = d;
      nearestSpace = sub;
    }
  }
  
  return nearestSpace;
}

/**
 * 在空间中找指定距离范围内的所有子空间
 */
export function within(space: Space, target: number[], range: number): Space[] {
  if (!space.s) return [];
  
  return space.s.filter(sub => distance(sub.v, target) <= range);
}

/**
 * 创建一个新空间
 */
export function createSpace(vector?: number[], subspaces?: Space[]): Space {
  return {
    v: vector || [],
    s: subspaces,
  };
}
