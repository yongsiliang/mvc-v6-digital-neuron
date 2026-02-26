/**
 * ═══════════════════════════════════════════════════════════════════════
 * 张量向量符号架构 - Tensor Vector Symbolic Architecture
 * 
 * 使用 TensorFlow.js 实现的真正高维向量运算
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export type ConceptType = 
  | 'atomic'
  | 'composite'
  | 'relational'
  | 'temporal'
  | 'spatial'
  | 'emotional';

export interface TensorConcept {
  name: string;
  vector: number[];
  type: ConceptType;
  components?: string[];
  createdAt: number;
  usageCount: number;
  source: 'predefined' | 'learned' | 'composed';
}

export interface TensorReasoningResult {
  vector: tf.Tensor1D;
  conceptName?: string;
  reasoningPath: string[];
  confidence: number;
}

export interface SemanticRelation {
  type: 'is_a' | 'has_a' | 'part_of' | 'causes' | 'similar_to' | 'opposite_of' | 'related_to';
  from: string;
  to: string;
  strength: number;
}

// ─────────────────────────────────────────────────────────────────────
// 张量 VSA 实现
// ─────────────────────────────────────────────────────────────────────

export class TensorVSA {
  private dimension: number;
  private concepts: Map<string, { entry: TensorConcept; tensor: tf.Tensor1D }>;
  private relations: SemanticRelation[];
  private permutationIndices: number[];
  private inversePermutationIndices: number[];

  constructor(dimension: number = 10000) {
    this.dimension = dimension;
    this.concepts = new Map();
    this.relations = [];
    this.permutationIndices = this.generatePermutationIndices();
    this.inversePermutationIndices = this.generateInversePermutationIndices();
    this.initializeBasicConcepts();
  }

  async bind(a: tf.Tensor1D, b: tf.Tensor1D): Promise<tf.Tensor1D> {
    const zerosA = tf.zeros(a.shape) as tf.Tensor1D;
    const zerosB = tf.zeros(b.shape) as tf.Tensor1D;
    
    const aComplex = tf.complex(a, zerosA);
    const bComplex = tf.complex(b, zerosB);
    const aFFT = tf.fft(aComplex);
    const bFFT = tf.fft(bComplex);
    const product = tf.mul(aFFT, bFFT);
    const resultComplex = tf.ifft(product);
    const result = tf.real(resultComplex) as tf.Tensor1D;
    const normalized = this.normalize(result);

    zerosA.dispose();
    zerosB.dispose();
    aComplex.dispose();
    bComplex.dispose();
    aFFT.dispose();
    bFFT.dispose();
    product.dispose();
    resultComplex.dispose();
    result.dispose();

    return normalized;
  }

  async bundle(vectors: tf.Tensor1D[]): Promise<tf.Tensor1D> {
    if (vectors.length === 0) {
      return this.generateRandomVector();
    }

    const stacked = tf.stack(vectors);
    const sum = tf.sum(stacked, 0) as tf.Tensor1D;
    const normalized = this.normalize(sum);

    stacked.dispose();

    return normalized;
  }

  permute(v: tf.Tensor1D, times: number = 1): tf.Tensor1D {
    let result = v;
    for (let t = 0; t < times; t++) {
      result = tf.gather(result, this.permutationIndices) as tf.Tensor1D;
    }
    return result;
  }

  inversePermute(v: tf.Tensor1D, times: number = 1): tf.Tensor1D {
    let result = v;
    for (let t = 0; t < times; t++) {
      result = tf.gather(result, this.inversePermutationIndices) as tf.Tensor1D;
    }
    return result;
  }

  async unbind(bound: tf.Tensor1D, key: tf.Tensor1D): Promise<tf.Tensor1D> {
    const keyInverse = this.inverse(key);
    const result = await this.bind(bound, keyInverse);
    keyInverse.dispose();
    return result;
  }

  inverse(v: tf.Tensor1D): tf.Tensor1D {
    return tf.reverse(v, 0) as tf.Tensor1D;
  }

  async similarity(a: tf.Tensor1D, b: tf.Tensor1D): Promise<number> {
    const dotProduct = tf.dot(a, b);
    const normA = tf.norm(a);
    const normB = tf.norm(b);
    const denominator = tf.mul(normA, normB);
    const sim = tf.div(dotProduct, denominator);
    const result = (await sim.data())[0];

    dotProduct.dispose();
    normA.dispose();
    normB.dispose();
    denominator.dispose();
    sim.dispose();

    return result;
  }

  async getConceptVector(name: string): Promise<tf.Tensor1D> {
    const existing = this.concepts.get(name);
    if (existing) {
      existing.entry.usageCount++;
      return existing.tensor.clone();
    }

    const tensor = this.generateRandomVector();
    const vectorData = Array.from(await tensor.data());
    
    const entry: TensorConcept = {
      name,
      vector: vectorData,
      type: 'atomic',
      createdAt: Date.now(),
      usageCount: 1,
      source: 'learned',
    };

    this.concepts.set(name, { entry, tensor: tensor.clone() });
    return tensor;
  }

  async buildCompositeConcept(components: string[], name: string): Promise<tf.Tensor1D> {
    const vectors = await Promise.all(components.map(c => this.getConceptVector(c)));

    let result = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      const newResult = await this.bind(result, vectors[i]);
      result.dispose();
      result = newResult;
    }

    const vectorData = Array.from(await result.data());
    const entry: TensorConcept = {
      name,
      vector: vectorData,
      type: 'composite',
      components,
      createdAt: Date.now(),
      usageCount: 0,
      source: 'composed',
    };

    this.concepts.set(name, { entry, tensor: result.clone() });

    vectors.forEach((v, i) => {
      if (i > 0) v.dispose();
    });

    return result;
  }

  async buildRelation(relation: string, subject: string, object: string): Promise<tf.Tensor1D> {
    const relationVec = await this.getConceptVector(relation);
    const subjectVec = await this.getConceptVector(subject);
    const objectVec = await this.getConceptVector(object);

    const pair = await this.bundle([subjectVec, objectVec]);
    const result = await this.bind(relationVec, pair);

    this.relations.push({
      type: 'related_to',
      from: subject,
      to: object,
      strength: 1,
    });

    relationVec.dispose();
    subjectVec.dispose();
    objectVec.dispose();
    pair.dispose();

    return result;
  }

  async analogy(a: string, b: string, c: string): Promise<TensorReasoningResult> {
    const vecA = await this.getConceptVector(a);
    const vecB = await this.getConceptVector(b);
    const vecC = await this.getConceptVector(c);

    const relation = await this.unbind(vecB, vecA);
    const result = await this.bind(relation, vecC);
    const decoded = await this.decode(result);

    vecA.dispose();
    vecB.dispose();
    vecC.dispose();
    relation.dispose();

    return {
      vector: result,
      conceptName: decoded?.name,
      reasoningPath: [
        `${a}:${b}::${c}:?`,
        `relation = ${b} ⊗ ${a}⁻¹`,
        `result = relation ⊗ ${c}`,
      ],
      confidence: decoded?.confidence || 0.5,
    };
  }

  async decode(vector: tf.Tensor1D): Promise<{ name: string; confidence: number } | null> {
    let bestMatch: { name: string; confidence: number } | null = null;
    let bestSimilarity = -1;

    for (const [name, { tensor }] of this.concepts) {
      const sim = await this.similarity(vector, tensor);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = { name, confidence: sim };
      }
    }

    if (bestMatch && bestMatch.confidence > 0.3) {
      return bestMatch;
    }

    return null;
  }

  async findSimilar(query: string, topK: number = 5): Promise<Array<{ name: string; similarity: number }>> {
    const queryVec = await this.getConceptVector(query);
    const results: Array<{ name: string; similarity: number }> = [];

    for (const [name, { tensor }] of this.concepts) {
      if (name === query) continue;
      const sim = await this.similarity(queryVec, tensor);
      results.push({ name, similarity: sim });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    queryVec.dispose();

    return results.slice(0, topK);
  }

  generateRandomVector(): tf.Tensor1D {
    return tf.randomUniform([this.dimension], -1, 1).step(0).mul(2).sub(1) as tf.Tensor1D;
  }

  normalize(v: tf.Tensor1D): tf.Tensor1D {
    const norm = tf.norm(v);
    const epsilon = tf.scalar(1e-8);
    const safeNorm = tf.maximum(norm, epsilon) as tf.Scalar;
    const normalized = v.div(safeNorm) as tf.Tensor1D;

    norm.dispose();
    epsilon.dispose();
    safeNorm.dispose();

    return normalized;
  }

  private generatePermutationIndices(): number[] {
    const indices = Array.from({ length: this.dimension }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }

  private generateInversePermutationIndices(): number[] {
    const inverse = new Array(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      inverse[this.permutationIndices[i]] = i;
    }
    return inverse;
  }

  private initializeBasicConcepts(): void {
    const basicConcepts = [
      'is_a', 'has_a', 'part_of', 'causes', 'similar_to', 'opposite_of',
      'before', 'after', 'during', 'now', 'past', 'future',
      'in', 'on', 'under', 'near', 'far', 'between',
      'and', 'or', 'not', 'if', 'then', 'because',
      'happy', 'sad', 'angry', 'fear', 'surprise', 'disgust',
      'self', 'other', 'world', 'mind', 'body', 'thought',
    ];

    basicConcepts.forEach(name => {
      const tensor = this.generateRandomVector();
      const entry: TensorConcept = {
        name,
        vector: [],
        type: this.getConceptType(name),
        createdAt: Date.now(),
        usageCount: 0,
        source: 'predefined',
      };

      tensor.data().then(data => {
        entry.vector = Array.from(data);
      });

      this.concepts.set(name, { entry, tensor });
    });
  }

  private getConceptType(name: string): ConceptType {
    const relationWords = ['is_a', 'has_a', 'part_of', 'causes', 'similar_to', 'opposite_of'];
    const timeWords = ['before', 'after', 'during', 'now', 'past', 'future'];
    const spaceWords = ['in', 'on', 'under', 'near', 'far', 'between'];
    const emotionWords = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust'];

    if (relationWords.includes(name)) return 'relational';
    if (timeWords.includes(name)) return 'temporal';
    if (spaceWords.includes(name)) return 'spatial';
    if (emotionWords.includes(name)) return 'emotional';
    return 'atomic';
  }

  async exportConcepts(): Promise<TensorConcept[]> {
    const concepts: TensorConcept[] = [];
    for (const [, { entry, tensor }] of this.concepts) {
      concepts.push({
        ...entry,
        vector: Array.from(await tensor.data()),
      });
    }
    return concepts;
  }

  async importConcepts(concepts: TensorConcept[]): Promise<void> {
    for (const entry of concepts) {
      const tensor = tf.tensor1d(entry.vector);
      this.concepts.set(entry.name, { 
        entry: { ...entry, createdAt: entry.createdAt || Date.now(), source: entry.source || 'learned' }, 
        tensor 
      });
    }
  }

  getConceptCount(): number {
    return this.concepts.size;
  }

  getDimension(): number {
    return this.dimension;
  }

  dispose(): void {
    for (const [, { tensor }] of this.concepts) {
      tensor.dispose();
    }
    this.concepts.clear();
  }
}
