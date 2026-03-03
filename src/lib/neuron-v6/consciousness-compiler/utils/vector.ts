/**
 * 向量操作工具
 */

/**
 * 生成随机向量
 */
export function randomVector(dimension: number): number[] {
  const vector: number[] = [];
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.random() * 2 - 1); // -1 到 1
  }
  return normalize(vector);
}

/**
 * 生成零向量
 */
export function zeroVector(dimension: number): number[] {
  return new Array(dimension).fill(0);
}

/**
 * 向量点积
 */
export function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * 向量模长
 */
export function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

/**
 * 向量归一化
 */
export function normalize(v: number[]): number[] {
  const mag = magnitude(v);
  if (mag === 0) return v;
  return v.map(val => val / mag);
}

/**
 * 向量加法
 */
export function add(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }
  return a.map((val, i) => val + b[i]);
}

/**
 * 向量减法
 */
export function subtract(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }
  return a.map((val, i) => val - b[i]);
}

/**
 * 向量标量乘法
 */
export function scale(v: number[], scalar: number): number[] {
  return v.map(val => val * scalar);
}

/**
 * 向量逐元素乘法
 */
export function multiply(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }
  return a.map((val, i) => val * b[i]);
}

/**
 * 向量拼接
 */
export function concat(vectors: number[][]): number[] {
  return vectors.flat();
}

/**
 * 余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = dot(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * 向量复制
 */
export function clone(v: number[]): number[] {
  return [...v];
}
