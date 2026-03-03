/**
 * 数学工具函数
 */

/**
 * Softmax归一化
 * 将数值转换为概率分布（和为1）
 */
export function softmax(values: number[]): number[] {
  // 减去最大值防止溢出
  const max = Math.max(...values);
  const exp = values.map(v => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(e => e / sum);
}

/**
 * Sigmoid函数
 * 将值压缩到 0-1 之间
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * ReLU函数
 * 负值归零，正值保留
 */
export function relu(x: number): number {
  return Math.max(0, x);
}

/**
 * Leaky ReLU
 * 负值保留小的梯度
 */
export function leakyRelu(x: number, alpha: number = 0.01): number {
  return x > 0 ? x : alpha * x;
}

/**
 * Tanh函数
 * 将值压缩到 -1 到 1 之间
 */
export function tanh(x: number): number {
  return Math.tanh(x);
}

/**
 * 高斯函数
 */
export function gaussian(x: number, mean: number, std: number): number {
  const exp = -((x - mean) ** 2) / (2 * std ** 2);
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exp);
}

/**
 * 指数衰减
 * 用于STDP学习
 */
export function exponentialDecay(deltaT: number, tau: number): number {
  return Math.exp(-Math.abs(deltaT) / tau);
}

/**
 * 限制值在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 线性插值
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 计算统计信息
 */
export function stats(values: number[]): {
  mean: number;
  std: number;
  min: number;
  max: number;
  sum: number;
} {
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  
  return {
    mean,
    std,
    min: Math.min(...values),
    max: Math.max(...values),
    sum,
  };
}

/**
 * 生成范围内随机数
 */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * 生成随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/**
 * 打乱数组
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
