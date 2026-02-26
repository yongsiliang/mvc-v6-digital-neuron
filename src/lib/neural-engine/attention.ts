/**
 * ═══════════════════════════════════════════════════════════════════════
 * 多头注意力机制 - Multi-Head Attention
 * 
 * 基于 Transformer 的注意力机制
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface AttentionConfig {
  modelDimension: number;
  headCount: number;
  keyDimension?: number;
  valueDimension?: number;
  useCausalMask?: boolean;
  dropoutRate?: number;
}

export interface AttentionOutput {
  output: tf.Tensor1D;
  weights: tf.Tensor2D;
  headWeights?: tf.Tensor3D;
}

export interface SelfAttentionResult {
  output: tf.Tensor2D;
  attentionWeights: tf.Tensor3D;
  pooledAttention: tf.Tensor1D;
}

// ─────────────────────────────────────────────────────────────────────
// 多头注意力实现
// ─────────────────────────────────────────────────────────────────────

export class MultiHeadAttention {
  private config: {
    modelDimension: number;
    headCount: number;
    keyDimension: number;
    valueDimension: number;
    useCausalMask: boolean;
    dropoutRate: number;
  };
  
  private Wq: tf.Tensor2D;
  private Wk: tf.Tensor2D;
  private Wv: tf.Tensor2D;
  private Wo: tf.Tensor2D;
  private bq: tf.Tensor1D;
  private bk: tf.Tensor1D;
  private bv: tf.Tensor1D;
  private bo: tf.Tensor1D;

  constructor(config: Partial<AttentionConfig> & { modelDimension: number; headCount: number }) {
    this.config = {
      modelDimension: config.modelDimension,
      headCount: config.headCount,
      keyDimension: config.keyDimension ?? Math.floor(config.modelDimension / config.headCount),
      valueDimension: config.valueDimension ?? Math.floor(config.modelDimension / config.headCount),
      useCausalMask: config.useCausalMask ?? false,
      dropoutRate: config.dropoutRate ?? 0,
    };

    const scale = Math.sqrt(2 / this.config.modelDimension);
    const dim = this.config.modelDimension;

    this.Wq = tf.tensor2d(
      Array.from({ length: dim }, () => 
        Array.from({ length: dim }, () => (Math.random() * 2 - 1) * scale)
      )
    );
    this.Wk = tf.tensor2d(
      Array.from({ length: dim }, () => 
        Array.from({ length: dim }, () => (Math.random() * 2 - 1) * scale)
      )
    );
    this.Wv = tf.tensor2d(
      Array.from({ length: dim }, () => 
        Array.from({ length: dim }, () => (Math.random() * 2 - 1) * scale)
      )
    );
    this.Wo = tf.tensor2d(
      Array.from({ length: dim }, () => 
        Array.from({ length: dim }, () => (Math.random() * 2 - 1) * scale)
      )
    );

    this.bq = tf.zeros([dim]) as tf.Tensor1D;
    this.bk = tf.zeros([dim]) as tf.Tensor1D;
    this.bv = tf.zeros([dim]) as tf.Tensor1D;
    this.bo = tf.zeros([dim]) as tf.Tensor1D;
  }

  async compute(
    query: tf.Tensor,
    key: tf.Tensor,
    value: tf.Tensor,
    mask?: tf.Tensor2D
  ): Promise<AttentionOutput> {
    const q = this.ensure3D(query);
    const k = this.ensure3D(key);
    const v = this.ensure3D(value);

    const Q = tf.matMul(q, this.Wq).add(this.bq) as tf.Tensor3D;
    const K = tf.matMul(k, this.Wk).add(this.bk) as tf.Tensor3D;
    const V = tf.matMul(v, this.Wv).add(this.bv) as tf.Tensor3D;

    const heads = this.config.headCount;
    const dk = this.config.keyDimension;

    const QSplit = this.splitHeads(Q, heads);
    const KSplit = this.splitHeads(K, heads);
    const VSplit = this.splitHeads(V, heads);

    const { attentionWeights, headOutputs } = this.computeHeadAttention(
      QSplit,
      KSplit,
      VSplit,
      dk,
      mask
    );

    const batchSize = Q.shape[0];
    const dv = this.config.valueDimension;
    const concatenated = this.concatHeads(headOutputs, batchSize, heads, dv);
    const output = tf.matMul(concatenated, this.Wo).add(this.bo) as tf.Tensor3D;

    q.dispose();
    k.dispose();
    v.dispose();
    Q.dispose();
    K.dispose();
    V.dispose();
    QSplit.dispose();
    KSplit.dispose();
    VSplit.dispose();
    headOutputs.dispose();

    return {
      output: output.squeeze([0]) as tf.Tensor1D,
      weights: attentionWeights.squeeze([0]) as tf.Tensor2D,
    };
  }

  async selfAttention(input: tf.Tensor2D): Promise<SelfAttentionResult> {
    const output = await this.compute(input, input, input);
    const pooledAttention = tf.mean(output.weights, 0) as tf.Tensor1D;

    return {
      output: output.output.expandDims(0) as tf.Tensor2D,
      attentionWeights: output.weights.expandDims(0) as tf.Tensor3D,
      pooledAttention,
    };
  }

  async crossAttention(query: tf.Tensor, context: tf.Tensor): Promise<AttentionOutput> {
    return this.compute(query, context, context);
  }

  private computeHeadAttention(
    Q: tf.Tensor4D,
    K: tf.Tensor4D,
    V: tf.Tensor4D,
    dk: number,
    mask?: tf.Tensor2D
  ): { attentionWeights: tf.Tensor3D; headOutputs: tf.Tensor4D } {
    const scores = tf.matMul(Q, K.transpose([0, 1, 3, 2])) as tf.Tensor4D;
    const scaledScores = tf.div(scores, tf.scalar(Math.sqrt(dk))) as tf.Tensor4D;

    let maskedScores: tf.Tensor4D = scaledScores;
    if (mask) {
      const maskExpanded = mask.expandDims(0).expandDims(0) as tf.Tensor4D;
      maskedScores = tf.add(scaledScores, tf.mul(maskExpanded, tf.scalar(-1e9))) as tf.Tensor4D;
    }

    const attentionWeights = tf.softmax(maskedScores, -1) as tf.Tensor4D;
    const headOutputs = tf.matMul(attentionWeights, V) as tf.Tensor4D;

    return {
      attentionWeights: attentionWeights.squeeze([1]) as tf.Tensor3D,
      headOutputs,
    };
  }

  private splitHeads(tensor: tf.Tensor3D, heads: number): tf.Tensor4D {
    const [batch, seqLen, modelDim] = tensor.shape;
    const headDim = Math.floor(modelDim / heads);

    const reshaped = tensor.reshape([batch, seqLen, heads, headDim]) as tf.Tensor4D;
    return reshaped.transpose([0, 2, 1, 3]) as tf.Tensor4D;
  }

  private concatHeads(
    tensor: tf.Tensor4D,
    batchSize: number,
    heads: number,
    headDim: number
  ): tf.Tensor3D {
    const seqLen = tensor.shape[2];
    const transposed = tensor.transpose([0, 2, 1, 3]) as tf.Tensor4D;
    return transposed.reshape([batchSize, seqLen, heads * headDim]) as tf.Tensor3D;
  }

  private ensure3D(tensor: tf.Tensor): tf.Tensor3D {
    if (tensor.rank === 1) {
      return tensor.expandDims(0).expandDims(0) as tf.Tensor3D;
    } else if (tensor.rank === 2) {
      return tensor.expandDims(0) as tf.Tensor3D;
    }
    return tensor as tf.Tensor3D;
  }

  async exportWeights(): Promise<{
    Wq: number[];
    Wk: number[];
    Wv: number[];
    Wo: number[];
    bq: number[];
    bk: number[];
    bv: number[];
    bo: number[];
  }> {
    return {
      Wq: Array.from(await this.Wq.data()),
      Wk: Array.from(await this.Wk.data()),
      Wv: Array.from(await this.Wv.data()),
      Wo: Array.from(await this.Wo.data()),
      bq: Array.from(await this.bq.data()),
      bk: Array.from(await this.bk.data()),
      bv: Array.from(await this.bv.data()),
      bo: Array.from(await this.bo.data()),
    };
  }

  importWeights(weights: {
    Wq: number[];
    Wk: number[];
    Wv: number[];
    Wo: number[];
    bq: number[];
    bk: number[];
    bv: number[];
    bo: number[];
  }): void {
    this.Wq.dispose();
    this.Wk.dispose();
    this.Wv.dispose();
    this.Wo.dispose();
    this.bq.dispose();
    this.bk.dispose();
    this.bv.dispose();
    this.bo.dispose();

    const dim = this.config.modelDimension;
    this.Wq = tf.tensor2d(weights.Wq, [dim, dim]);
    this.Wk = tf.tensor2d(weights.Wk, [dim, dim]);
    this.Wv = tf.tensor2d(weights.Wv, [dim, dim]);
    this.Wo = tf.tensor2d(weights.Wo, [dim, dim]);
    this.bq = tf.tensor1d(weights.bq);
    this.bk = tf.tensor1d(weights.bk);
    this.bv = tf.tensor1d(weights.bv);
    this.bo = tf.tensor1d(weights.bo);
  }

  getConfig(): typeof this.config {
    return { ...this.config };
  }

  dispose(): void {
    this.Wq.dispose();
    this.Wk.dispose();
    this.Wv.dispose();
    this.Wo.dispose();
    this.bq.dispose();
    this.bk.dispose();
    this.bv.dispose();
    this.bo.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 预测编码注意力
// ─────────────────────────────────────────────────────────────────────

export class PredictiveAttention {
  private baseAttention: MultiHeadAttention;
  private predictionErrorWeight: number;

  constructor(modelDimension: number, headCount: number, predictionErrorWeight: number = 0.5) {
    this.baseAttention = new MultiHeadAttention({
      modelDimension,
      headCount,
    });
    this.predictionErrorWeight = predictionErrorWeight;
  }

  async computeWithError(
    query: tf.Tensor,
    key: tf.Tensor,
    value: tf.Tensor,
    predictionErrors: tf.Tensor1D
  ): Promise<AttentionOutput & { errorModulatedWeights: tf.Tensor2D }> {
    const baseResult = await this.baseAttention.compute(query, key, value);
    const baseWeights = baseResult.weights;

    const errorWeights = tf.softmax(
      tf.mul(predictionErrors, tf.scalar(this.predictionErrorWeight))
    ) as tf.Tensor1D;

    const expandedError = errorWeights.expandDims(0) as tf.Tensor2D;
    const modulatedWeights = tf.add(
      tf.mul(baseWeights, tf.scalar(1 - this.predictionErrorWeight)),
      tf.mul(baseWeights, expandedError)
    ) as tf.Tensor2D;

    const normalizedWeights = tf.div(
      modulatedWeights,
      modulatedWeights.sum(-1, true)
    ) as tf.Tensor2D;

    return {
      ...baseResult,
      errorModulatedWeights: normalizedWeights,
    };
  }

  dispose(): void {
    this.baseAttention.dispose();
  }
}
