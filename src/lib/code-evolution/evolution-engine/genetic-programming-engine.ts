/**
 * 遗传编程引擎 (L2-GP)
 * 
 * 通过遗传算法进化代码结构：
 * - 种群管理
 * - 交叉、变异、选择
 * - 适应度评估
 * - 精英保留
 * - 并行评估
 */

import type {
  GeneticOperator,
  CrossoverOperator,
  MutationOperator,
  SelectionOperator,
  GeneticCode,
  GeneticProgram,
  PopulationStats,
  FitnessScore,
  FitnessContext,
  ModuleId,
  Module,
} from '../types/core';

import type { EvolutionCandidate } from '../sandbox/test-executor';

// ═══════════════════════════════════════════════════════════════
// 遗传编程配置
// ═══════════════════════════════════════════════════════════════

export interface GPConfig {
  // 种群参数
  populationSize: number;
  maxGenerations: number;
  elitismCount: number;
  
  // 算子概率
  crossoverRate: number;
  mutationRate: number;
  
  // 选择参数
  tournamentSize: number;
  selectionPressure: number;
  
  // 多样性保护
  diversityThreshold: number;
  nicheRadius: number;
  crowdingFactor: number;
  
  // 停止条件
  targetFitness: number;
  stagnationLimit: number;
  earlyStopping: boolean;
  
  // 并行
  parallelism: number;
}

// ═══════════════════════════════════════════════════════════════
// 个体
// ═══════════════════════════════════════════════════════════════

export interface Individual {
  id: string;
  genotype: GeneticCode;
  fitness?: number;
  age: number;
  origin: 'random' | 'crossover' | 'mutation' | 'elite';
  parentIds?: string[];
}

// ═══════════════════════════════════════════════════════════════
// 种群
// ═══════════════════════════════════════════════════════════════

export interface Population {
  individuals: Individual[];
  generation: number;
  stats: PopulationStats;
}

// ═══════════════════════════════════════════════════════════════
// 进化结果
// ═══════════════════════════════════════════════════════════════

export interface EvolutionResult {
  best: Individual;
  population: Population;
  history: PopulationStats[];
  generations: number;
  converged: boolean;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// 遗传编程引擎
// ═══════════════════════════════════════════════════════════════

export class GeneticProgrammingEngine {
  
  private config: GPConfig;
  private crossoverOps: Map<string, CrossoverOperator> = new Map();
  private mutationOps: Map<string, MutationOperator> = new Map();
  private selectionOps: Map<string, SelectionOperator> = new Map();
  
  // 适应度评估函数
  private fitnessEvaluator: (candidate: EvolutionCandidate, context: FitnessContext) => Promise<FitnessScore>;
  
  constructor(
    config: Partial<GPConfig>,
    fitnessEvaluator: (candidate: EvolutionCandidate, context: FitnessContext) => Promise<FitnessScore>
  ) {
    this.config = {
      populationSize: 100,
      maxGenerations: 1000,
      elitismCount: 2,
      crossoverRate: 0.8,
      mutationRate: 0.2,
      tournamentSize: 5,
      selectionPressure: 1.5,
      diversityThreshold: 0.1,
      nicheRadius: 0.2,
      crowdingFactor: 3,
      targetFitness: 1.0,
      stagnationLimit: 50,
      earlyStopping: true,
      parallelism: 4,
      ...config,
    };
    
    this.fitnessEvaluator = fitnessEvaluator;
    
    // 注册默认算子
    this.registerDefaultOperators();
  }
  
  // ════════════════════════════════════════════════════════════
  // 算子注册
  // ════════════════════════════════════════════════════════════
  
  /**
   * 注册交叉算子
   */
  registerCrossoverOperator(op: CrossoverOperator): void {
    this.crossoverOps.set(op.name, op);
  }
  
  /**
   * 注册变异算子
   */
  registerMutationOperator(op: MutationOperator): void {
    this.mutationOps.set(op.name, op);
  }
  
  /**
   * 注册选择算子
   */
  registerSelectionOperator(op: SelectionOperator): void {
    this.selectionOps.set(op.name, op);
  }
  
  // ════════════════════════════════════════════════════════════
  // 进化主循环
  // ════════════════════════════════════════════════════════════
  
  /**
   * 运行进化
   */
  async evolve(
    seedCandidates: EvolutionCandidate[],
    context: FitnessContext
  ): Promise<EvolutionResult> {
    
    // 初始化种群
    let population = await this.initializePopulation(seedCandidates, context);
    const history: PopulationStats[] = [population.stats];
    
    let stagnationCount = 0;
    let previousBestFitness = 0;
    
    for (let gen = 0; gen < this.config.maxGenerations; gen++) {
      population.generation = gen;
      
      // 评估适应度
      await this.evaluatePopulation(population, context);
      
      // 记录统计
      history.push(population.stats);
      
      // 检查收敛
      if (population.stats.bestFitness >= this.config.targetFitness) {
        const best = this.getBestIndividual(population);
        return {
          best,
          population,
          history,
          generations: gen + 1,
          converged: true,
          reason: '达到目标适应度',
        };
      }
      
      // 检查停滞
      if (population.stats.bestFitness <= previousBestFitness) {
        stagnationCount++;
      } else {
        stagnationCount = 0;
        previousBestFitness = population.stats.bestFitness;
      }
      
      if (stagnationCount >= this.config.stagnationLimit && this.config.earlyStopping) {
        const best = this.getBestIndividual(population);
        return {
          best,
          population,
          history,
          generations: gen + 1,
          converged: true,
          reason: '停滞超过阈值',
        };
      }
      
      // 进化下一代
      population = await this.evolveNextGeneration(population, context);
    }
    
    const best = this.getBestIndividual(population);
    return {
      best,
      population,
      history,
      generations: this.config.maxGenerations,
      converged: false,
      reason: '达到最大代数',
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 种群初始化
  // ════════════════════════════════════════════════════════════
  
  private async initializePopulation(
    seeds: EvolutionCandidate[],
    context: FitnessContext
  ): Promise<Population> {
    
    const individuals: Individual[] = [];
    
    // 添加种子个体
    for (const seed of seeds.slice(0, this.config.populationSize)) {
      individuals.push({
        id: this.generateId(),
        genotype: seed.module.code,
        age: 0,
        origin: 'random',
      });
    }
    
    // 随机生成剩余个体
    while (individuals.length < this.config.populationSize) {
      const genotype = this.randomGenotype(context);
      individuals.push({
        id: this.generateId(),
        genotype,
        age: 0,
        origin: 'random',
      });
    }
    
    return {
      individuals,
      generation: 0,
      stats: this.computeStats(individuals),
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 适应度评估
  // ════════════════════════════════════════════════════════════
  
  private async evaluatePopulation(
    population: Population,
    context: FitnessContext
  ): Promise<void> {
    
    // 并行评估
    const chunks = this.chunkArray(population.individuals, this.config.parallelism);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (individual) => {
          if (individual.fitness === undefined) {
            const candidate = this.individualToCandidate(individual);
            const fitnessResult = await this.fitnessEvaluator(candidate, context);
            individual.fitness = fitnessResult.overall;
          }
        })
      );
    }
    
    // 更新统计
    population.stats = this.computeStats(population.individuals);
  }
  
  // ════════════════════════════════════════════════════════════
  // 进化下一代
  // ════════════════════════════════════════════════════════════
  
  private async evolveNextGeneration(
    population: Population,
    context: FitnessContext
  ): Promise<Population> {
    
    const nextGeneration: Individual[] = [];
    
    // 1. 精英保留
    const elites = this.selectElites(population);
    for (const elite of elites) {
      nextGeneration.push({
        ...elite,
        age: elite.age + 1,
        origin: 'elite',
      });
    }
    
    // 2. 生成新个体
    while (nextGeneration.length < this.config.populationSize) {
      
      // 选择
      const [parent1, parent2] = this.tournamentSelection(population, 2);
      
      let offspring: Individual;
      
      // 交叉或变异
      if (Math.random() < this.config.crossoverRate) {
        // 交叉
        const [child1, child2] = this.crossover(parent1, parent2);
        offspring = child1;
      } else {
        // 变异
        offspring = this.mutate(parent1, context);
      }
      
      // 多样性检查
      if (this.isDiverse(offspring, nextGeneration)) {
        nextGeneration.push(offspring);
      }
    }
    
    return {
      individuals: nextGeneration,
      generation: population.generation + 1,
      stats: this.computeStats(nextGeneration),
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 选择算子
  // ════════════════════════════════════════════════════════════
  
  /**
   * 锦标赛选择
   */
  private tournamentSelection(population: Population, count: number): Individual[] {
    const selected: Individual[] = [];
    
    for (let i = 0; i < count; i++) {
      // 随机选择 tournamentSize 个个体
      const tournament = [];
      for (let j = 0; j < this.config.tournamentSize; j++) {
        const idx = Math.floor(Math.random() * population.individuals.length);
        tournament.push(population.individuals[idx]);
      }
      
      // 选择适应度最高的
      tournament.sort((a, b) => 
        (b.fitness ?? 0) - (a.fitness ?? 0)
      );
      
      selected.push(tournament[0]);
    }
    
    return selected;
  }
  
  /**
   * 精英选择
   */
  private selectElites(population: Population): Individual[] {
    const sorted = [...population.individuals].sort((a, b) =>
      (b.fitness ?? 0) - (a.fitness ?? 0)
    );
    
    return sorted.slice(0, this.config.elitismCount);
  }
  
  /**
   * 轮盘赌选择
   */
  private rouletteSelection(population: Population, count: number): Individual[] {
    const totalFitness = population.individuals.reduce(
      (sum, ind) => sum + (ind.fitness ?? 0),
      0
    );
    
    const selected: Individual[] = [];
    
    for (let i = 0; i < count; i++) {
      let cumulative = 0;
      const r = Math.random() * totalFitness;
      
      for (const ind of population.individuals) {
        cumulative += ind.fitness ?? 0;
        if (cumulative >= r) {
          selected.push(ind);
          break;
        }
      }
    }
    
    return selected;
  }
  
  // ════════════════════════════════════════════════════════════
  // 交叉算子
  // ════════════════════════════════════════════════════════════
  
  /**
   * 单点交叉
   */
  private singlePointCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const code1 = parent1.genotype;
    const code2 = parent2.genotype;
    
    // 转换为 AST（简化：按行分割）
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    
    const crossoverPoint = Math.floor(Math.random() * Math.min(lines1.length, lines2.length));
    
    const child1Code = [...lines1.slice(0, crossoverPoint), ...lines2.slice(crossoverPoint)].join('\n');
    const child2Code = [...lines2.slice(0, crossoverPoint), ...lines1.slice(crossoverPoint)].join('\n');
    
    return [
      { id: this.generateId(), genotype: child1Code, age: 0, origin: 'crossover', parentIds: [parent1.id, parent2.id] },
      { id: this.generateId(), genotype: child2Code, age: 0, origin: 'crossover', parentIds: [parent1.id, parent2.id] },
    ];
  }
  
  /**
   * 均匀交叉
   */
  private uniformCrossover(parent1: Individual, parent2: Individual, rate: number = 0.5): [Individual, Individual] {
    const lines1 = parent1.genotype.split('\n');
    const lines2 = parent2.genotype.split('\n');
    
    const maxLen = Math.max(lines1.length, lines2.length);
    const child1: string[] = [];
    const child2: string[] = [];
    
    for (let i = 0; i < maxLen; i++) {
      const gene1 = lines1[i] ?? '';
      const gene2 = lines2[i] ?? '';
      
      if (Math.random() < rate) {
        child1.push(gene1);
        child2.push(gene2);
      } else {
        child1.push(gene2);
        child2.push(gene1);
      }
    }
    
    return [
      { id: this.generateId(), genotype: child1.join('\n'), age: 0, origin: 'crossover', parentIds: [parent1.id, parent2.id] },
      { id: this.generateId(), genotype: child2.join('\n'), age: 0, origin: 'crossover', parentIds: [parent1.id, parent2.id] },
    ];
  }
  
  // ════════════════════════════════════════════════════════════
  // 变异算子
  // ════════════════════════════════════════════════════════════
  
  /**
   * 点变异
   */
  private pointMutation(individual: Individual, context: FitnessContext): Individual {
    const lines = individual.genotype.split('\n');
    
    if (lines.length === 0) {
      return { ...individual, id: this.generateId(), origin: 'mutation', parentIds: [individual.id] };
    }
    
    // 随机选择一行进行变异
    const mutationPoint = Math.floor(Math.random() * lines.length);
    
    // 简单变异：添加/删除/修改行
    const mutationType = Math.floor(Math.random() * 3);
    
    switch (mutationType) {
      case 0: // 修改
        lines[mutationPoint] = `// mutated: ${lines[mutationPoint]}`;
        break;
      case 1: // 删除
        lines.splice(mutationPoint, 1);
        break;
      case 2: // 插入
        lines.splice(mutationPoint, 0, '// new code');
        break;
    }
    
    return {
      id: this.generateId(),
      genotype: lines.join('\n'),
      age: 0,
      origin: 'mutation',
      parentIds: [individual.id],
    };
  }
  
  /**
   * 子树变异（针对 AST）
   */
  private subtreeMutation(individual: Individual, context: FitnessContext): Individual {
    // 简化实现
    return this.pointMutation(individual, context);
  }
  
  /**
   * 复制变异
   */
  private duplicationMutation(individual: Individual): Individual {
    const lines = individual.genotype.split('\n');
    
    if (lines.length === 0) {
      return { ...individual, id: this.generateId(), origin: 'mutation', parentIds: [individual.id] };
    }
    
    // 复制一段代码
    const start = Math.floor(Math.random() * lines.length);
    const length = Math.floor(Math.random() * 3) + 1;
    const segment = lines.slice(start, start + length);
    
    // 插入到随机位置
    const insertPoint = Math.floor(Math.random() * lines.length);
    lines.splice(insertPoint, 0, ...segment);
    
    return {
      id: this.generateId(),
      genotype: lines.join('\n'),
      age: 0,
      origin: 'mutation',
      parentIds: [individual.id],
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 高层进化接口
  // ════════════════════════════════════════════════════════════
  
  /**
   * 执行交叉
   */
  private crossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    // 随机选择交叉算子
    const crossoverTypes = ['singlePoint', 'uniform'];
    const type = crossoverTypes[Math.floor(Math.random() * crossoverTypes.length)];
    
    switch (type) {
      case 'uniform':
        return this.uniformCrossover(parent1, parent2);
      default:
        return this.singlePointCrossover(parent1, parent2);
    }
  }
  
  /**
   * 执行变异
   */
  private mutate(individual: Individual, context: FitnessContext): Individual {
    const mutationTypes = ['point', 'subtree', 'duplication'];
    const type = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
    
    switch (type) {
      case 'subtree':
        return this.subtreeMutation(individual, context);
      case 'duplication':
        return this.duplicationMutation(individual);
      default:
        return this.pointMutation(individual, context);
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  private registerDefaultOperators(): void {
    // 注册默认选择算子
    this.registerSelectionOperator({
      name: 'tournament',
      select: (population, count) => this.tournamentSelection({ individuals: population as Individual[], generation: 0, stats: {} as PopulationStats }, count),
    });
    
    // 注册默认交叉算子
    this.registerCrossoverOperator({
      name: 'singlePoint',
      crossover: (p1, p2) => this.singlePointCrossover(p1 as Individual, p2 as Individual),
    });
    
    this.registerCrossoverOperator({
      name: 'uniform',
      crossover: (p1, p2) => this.uniformCrossover(p1 as Individual, p2 as Individual),
    });
    
    // 注册默认变异算子
    this.registerMutationOperator({
      name: 'point',
      mutate: (individual) => this.pointMutation(individual as Individual, {} as FitnessContext),
    });
  }
  
  private generateId(): string {
    return `gp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  private randomGenotype(context: FitnessContext): GeneticCode {
    // 简化：返回空代码
    return '// Random genotype\nreturn null;';
  }
  
  private individualToCandidate(individual: Individual): EvolutionCandidate {
    return {
      id: individual.id,
      module: {
        id: `module-${individual.id}`,
        name: `evolved-${individual.id}`,
        version: '0.0.1',
        code: individual.genotype,
        dependencies: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
          evolutionHistory: [],
        },
      },
      code: individual.genotype,
      fitness: individual.fitness,
    };
  }
  
  private getBestIndividual(population: Population): Individual {
    return population.individuals.reduce((best, current) =>
      (current.fitness ?? 0) > (best.fitness ?? 0) ? current : best
    );
  }
  
  private computeStats(individuals: Individual[]): PopulationStats {
    const fitnesses = individuals
      .map(i => i.fitness ?? 0)
      .filter(f => f > 0);
    
    if (fitnesses.length === 0) {
      return {
        averageFitness: 0,
        bestFitness: 0,
        worstFitness: 0,
        diversity: 0,
        size: individuals.length,
        generation: 0,
      };
    }
    
    const averageFitness = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
    const bestFitness = Math.max(...fitnesses);
    const worstFitness = Math.min(...fitnesses);
    
    // 计算多样性（遗传距离）
    const diversity = this.computeDiversity(individuals);
    
    return {
      averageFitness,
      bestFitness,
      worstFitness,
      diversity,
      size: individuals.length,
      generation: 0,
    };
  }
  
  private computeDiversity(individuals: Individual[]): number {
    if (individuals.length < 2) return 0;
    
    // 简化：基于代码长度差异
    const lengths = individuals.map(i => i.genotype.length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
    
    return Math.sqrt(variance) / (mean || 1);
  }
  
  private isDiverse(individual: Individual, population: Individual[]): boolean {
    if (population.length === 0) return true;
    
    // 检查与现有个体的相似度
    for (const existing of population) {
      const similarity = this.computeSimilarity(individual.genotype, existing.genotype);
      if (similarity > (1 - this.config.diversityThreshold)) {
        return false;
      }
    }
    
    return true;
  }
  
  private computeSimilarity(code1: string, code2: string): number {
    // 简化：基于编辑距离
    const len1 = code1.length;
    const len2 = code2.length;
    
    if (len1 === 0 && len2 === 0) return 1;
    if (len1 === 0 || len2 === 0) return 0;
    
    // Jaccard 相似度（基于字符）
    const set1 = new Set(code1);
    const set2 = new Set(code2);
    const intersection = new Set([...set1].filter(c => set2.has(c)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  private chunkArray<T>(array: T[], chunks: number): T[][] {
    const chunkSize = Math.ceil(array.length / chunks);
    const result: T[][] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    
    return result;
  }
}
