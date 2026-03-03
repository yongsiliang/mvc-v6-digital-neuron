/**
 * Attention计算工具
 * 
 * 核心公式：
 * Attention(Q, K, V) = softmax(QK^T / √d) @ V
 * 
 * - QK^T: Query与Key的点积，度量相似度
 * - √d: 防止点积过大导致softmax梯度消失
 * - softmax: 转换为概率分布
 * - @ V: 加权求和
 */

import { dot, magnitude, scale, add, multiply } from './vector';
import { softmax, clamp } from './math';

/**
 * Attention分数
 * 计算 QK^T / √d
 */
export function attentionScore(query: number[], key: number[]): number {
  const dk = Math.sqrt(query.length);
  return dot(query, key) / dk;
}

/**
 * 计算所有Key的Attention权重
 */
export function attentionWeights(
  query: number[],
  keys: number[][],
  mask?: boolean[]
): number[] {
  // 计算原始分数
  let scores = keys.map(k => attentionScore(query, k));
  
  // 应用mask（可选）
  if (mask) {
    scores = scores.map((s, i) => mask[i] ? s : -Infinity);
  }
  
  // Softmax归一化
  return softmax(scores);
}

/**
 * 加权求和
 * Σ(weight_i * value_i)
 */
export function weightedSum(weights: number[], values: number[][]): number[] {
  if (weights.length !== values.length) {
    throw new Error(`权重和值数量不匹配: ${weights.length} vs ${values.length}`);
  }
  
  const dimension = values[0].length;
  const result = new Array(dimension).fill(0);
  
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < dimension; j++) {
      result[j] += weights[i] * values[i][j];
    }
  }
  
  return result;
}

/**
 * 单头Attention
 */
export function singleHeadAttention(
  query: number[],
  keys: number[][],
  values: number[][],
  mask?: boolean[]
): {
  output: number[];
  weights: number[];
} {
  // 计算权重
  const weights = attentionWeights(query, keys, mask);
  
  // 加权求和
  const output = weightedSum(weights, values);
  
  return { output, weights };
}

/**
 * 多头Attention
 */
export function multiHeadAttention(
  query: number[],
  keys: number[][],
  values: number[][],
  heads: number,
  headDimension: number
): {
  output: number[];
  headOutputs: number[][];
  headWeights: number[][];
} {
  const headOutputs: number[][] = [];
  const headWeights: number[][] = [];
  
  for (let h = 0; h < heads; h++) {
    // 每个头有自己的"视角"
    // 这里简化处理：使用不同的投影
    const headQuery = projectHead(query, h, headDimension);
    const headKeys = keys.map(k => projectHead(k, h, headDimension));
    const headValues = values.map(v => projectHead(v, h, headDimension));
    
    const { output, weights } = singleHeadAttention(headQuery, headKeys, headValues);
    headOutputs.push(output);
    headWeights.push(weights);
  }
  
  // 拼接所有头的输出
  const concatenated: number[] = [];
  for (const output of headOutputs) {
    concatenated.push(...output);
  }
  
  // 投影回原始维度（简化：直接返回拼接结果）
  return {
    output: concatenated,
    headOutputs,
    headWeights,
  };
}

/**
 * 简化的头投影
 * 实际实现中会用可学习的投影矩阵
 */
function projectHead(vector: number[], headIndex: number, dimension: number): number[] {
  // 简化：取向量的不同片段
  const start = (headIndex * dimension) % vector.length;
  const projected: number[] = [];
  
  for (let i = 0; i < dimension; i++) {
    projected.push(vector[(start + i) % vector.length]);
  }
  
  return projected;
}

/**
 * 自注意力
 * 每个元素关注所有其他元素
 */
export function selfAttention(
  queries: number[][],
  keys: number[][],
  values: number[][]
): {
  outputs: number[][];
  attentionMatrix: number[][];
} {
  const outputs: number[][] = [];
  const attentionMatrix: number[][] = [];
  
  for (let i = 0; i < queries.length; i++) {
    const { output, weights } = singleHeadAttention(queries[i], keys, values);
    outputs.push(output);
    attentionMatrix.push(weights);
  }
  
  return { outputs, attentionMatrix };
}

/**
 * 掩码自注意力（因果注意力）
 * 每个元素只能关注它之前的元素
 */
export function causalSelfAttention(
  queries: number[][],
  keys: number[][],
  values: number[][]
): {
  outputs: number[][];
  attentionMatrix: number[][];
} {
  const outputs: number[][] = [];
  const attentionMatrix: number[][] = [];
  
  for (let i = 0; i < queries.length; i++) {
    // 创建因果掩码：只能看到之前的位置
    const mask = queries.map((_, j) => j <= i);
    
    const { output, weights } = singleHeadAttention(queries[i], keys, values, mask);
    outputs.push(output);
    attentionMatrix.push(weights);
  }
  
  return { outputs, attentionMatrix };
}

/**
 * 交叉注意力
 * 用一组Query关注另一组Key-Value
 */
export function crossAttention(
  queries: number[][],
  keys: number[][],
  values: number[][]
): {
  outputs: number[][];
  attentionMatrix: number[][];
} {
  return selfAttention(queries, keys, values);
}

/**
 * 计算注意力熵
 * 衡量注意力分布的集中程度
 */
export function attentionEntropy(weights: number[]): number {
  // 熵 = -Σ p(x) log(p(x))
  // 熵越低，注意力越集中
  let entropy = 0;
  for (const w of weights) {
    if (w > 0) {
      entropy -= w * Math.log2(w);
    }
  }
  return entropy;
}

/**
 * 计算最大注意力权重
 */
export function maxAttentionWeight(weights: number[]): number {
  return Math.max(...weights);
}

/**
 * 找到注意力最高的位置
 */
export function argmaxAttention(weights: number[]): number {
  let maxIndex = 0;
  let maxValue = weights[0];
  
  for (let i = 1; i < weights.length; i++) {
    if (weights[i] > maxValue) {
      maxValue = weights[i];
      maxIndex = i;
    }
  }
  
  return maxIndex;
}
