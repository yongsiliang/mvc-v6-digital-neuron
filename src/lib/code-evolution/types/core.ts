/**
 * 代码进化系统 - 核心类型定义
 * 
 * 这是整个系统的基础类型定义，定义了模块、沙箱、进化、意识等核心概念
 */

// ═══════════════════════════════════════════════════════════════
// 基础类型
// ═══════════════════════════════════════════════════════════════

export type ModuleId = string;
export type SandboxId = string;
export type SnapshotId = string;
export type NodeId = string;
export type GeneId = string;
export type StrategyId = string;
export type ValueId = string;
export type ExperienceId = string;

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export interface VersionRange {
  min?: SemanticVersion;
  max?: SemanticVersion;
  exclude?: SemanticVersion[];
}

// ═══════════════════════════════════════════════════════════════
// 模块系统类型
// ═══════════════════════════════════════════════════════════════

/**
 * 模块类型分类
 */
export type ModuleType = 
  | 'core'           // 核心，不可卸载
  | 'processor'      // 处理器，可进化
  | 'memory'         // 记忆相关
  | 'output'         // 输出相关
  | 'learning'       // 学习相关
  | 'evolution'      // 进化相关
  | 'consciousness'  // 意识相关
  | 'extension';     // 扩展功能

/**
 * 数据类型定义
 */
export type DataType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'object' 
  | 'array' 
  | 'function'
  | 'promise'
  | 'stream'
  | 'tensor'
  | 'any';

/**
 * 输入端口定义
 */
export interface InputPort {
  name: string;
  type: DataType;
  required: boolean;
  description: string;
  validation?: (input: unknown) => boolean;
  transform?: (input: unknown) => unknown;
  defaultValue?: unknown;
}

/**
 * 输出端口定义
 */
export interface OutputPort {
  name: string;
  type: DataType;
  description: string;
  guaranteed: boolean;  // 是否保证输出
}

/**
 * 事件端口定义
 */
export interface EventPort {
  name: string;
  payloadType: DataType;
  description: string;
  direction: 'emit' | 'subscribe' | 'both';
}

/**
 * 配置端口定义
 */
export interface ConfigPort {
  schema: Record<string, ConfigSchema>;
  required: string[];
  defaults: Record<string, unknown>;
}

export interface ConfigSchema {
  type: DataType;
  description: string;
  validation?: (value: unknown) => boolean;
}

/**
 * 模块接口定义
 */
export interface ModuleInterface {
  inputs: InputPort[];
  outputs: OutputPort[];
  events: EventPort[];
  config: ConfigPort;
}

/**
 * 依赖类型
 */
export type DependencyType = 'required' | 'optional' | 'conditional';

/**
 * 依赖定义
 */
export interface Dependency {
  moduleId: ModuleId;
  versionRange: VersionRange;
  type: DependencyType;
  condition?: () => boolean;
  
  // 依赖接口要求
  interfaceRequirements: {
    input?: string[];   // 需要对方的哪些输出
    output?: string[];  // 向对方提供哪些输入
    events?: string[];  // 订阅哪些事件
  };
}

/**
 * 能力声明
 */
export interface CapabilityDeclaration {
  id: string;
  name: string;
  description: string;
  performance: {
    latency?: number;      // 期望延迟（ms）
    throughput?: number;   // 期望吞吐量
    accuracy?: number;     // 期望准确率
  };
  testCases: TestCase[];
}

/**
 * 代码区域
 */
export interface CodeRegion {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
  identifier?: string;
  type: 'function' | 'class' | 'method' | 'block' | 'expression';
}

/**
 * 可变性范围
 */
export interface MutabilityScope {
  // 代码层面的可变性
  codeRegions: {
    fullyMutable: CodeRegion[];      // 完全可变
    parameterMutable: CodeRegion[];  // 仅参数可变
    logicMutable: CodeRegion[];      // 仅逻辑可变
    immutable: CodeRegion[];         // 不可变
  };
  
  // 行为层面的可变性
  behaviorConstraints: {
    inputOutputInvariant: boolean;   // 输入输出关系不变
    performanceFloor: number;        // 性能不能低于此
    capabilityPreservation: string[]; // 必须保留的能力
  };
}

/**
 * 进化相关配置
 */
export interface EvolutionConfig {
  mutable: boolean;
  mutabilityScope: MutabilityScope;
  protectedRegions: ProtectedRegion[];
  testSuite: TestSuite;
  fitnessCriteria: FitnessCriteria;
}

/**
 * 保护区域
 */
export interface ProtectedRegion {
  id: string;
  type: 'memory' | 'value' | 'capability' | 'identity';
  region: CodeRegion;
  reason: string;
  overrideLevel: 'none' | 'consciousness-only' | 'emergency-only';
}

/**
 * 模块状态
 */
export interface ModuleState {
  id: ModuleId;
  status: 'loading' | 'active' | 'suspended' | 'error' | 'unloading';
  version: string;
  loadedAt: number;
  lastActivity: number;
  metrics: {
    invocations: number;
    errors: number;
    avgLatency: number;
    memoryUsage: number;
  };
  internalState?: unknown;
}

/**
 * 完整模块定义
 */
export interface Module {
  // 身份
  id: ModuleId;
  name: string;
  version: string;
  description?: string;
  
  // 类型分类
  type?: ModuleType;
  
  // 接口定义
  interface?: ModuleInterface;
  
  // 依赖系统
  dependencies: Dependency[];
  
  // 能力声明
  capabilities?: CapabilityDeclaration[];
  
  // 进化相关
  evolution?: EvolutionConfig;
  
  // 导出
  exports?: string[];
  
  // 导入
  imports?: string[];
  
  // 源代码
  code: string;
  
  // 元数据
  metadata: {
    author?: string;
    createdAt: number;
    updatedAt: number;
    tags: string[];
    evolutionHistory: EvolutionRecord[];
  };
}

/**
 * 活跃模块（运行时）
 */
export interface ActiveModule {
  definition: Module;
  state: ModuleState;
  context: ModuleContext;
  instance: unknown;  // 实际的模块实例
}

/**
 * 模块上下文
 */
export interface ModuleContext {
  id: ModuleId;
  logger: Logger;
  eventBus: EventBus;
  config: Record<string, unknown>;
  dependencies: Map<ModuleId, ActiveModule>;
}

// ═══════════════════════════════════════════════════════════════
// 测试系统类型
// ═══════════════════════════════════════════════════════════════

/**
 * 测试用例
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'performance' | 'capability' | 'boundary' | 'fuzz' | 'regression';
  
  // 测试输入
  input: unknown;
  
  // 期望输出（可选）
  expectedOutput?: unknown;
  
  // 验证函数
  validate: (result: unknown, context: TestContext) => Promise<boolean>;
  
  // 超时
  timeout: number;
  
  // 优先级
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // 标签
  tags: string[];
}

/**
 * 测试上下文
 */
export interface TestContext {
  module: Module;
  sandbox: Sandbox;
  startTime: number;
  resources: {
    memoryUsed: number;
    cpuUsed: number;
  };
}

/**
 * 测试套件
 */
export interface TestSuite {
  id: string;
  moduleId: ModuleId;
  
  unit: TestCase[];
  integration: TestCase[];
  performance: PerformanceTest[];
  capability: CapabilityTest[];
  boundary: TestCase[];
  fuzz: FuzzConfig;
  regression: TestCase[];
}

/**
 * 性能测试
 */
export interface PerformanceTest extends TestCase {
  type: 'performance';
  baseline: number;
  tolerance: number;  // 允许的退化百分比
  iterations: number;
  warmupIterations: number;
}

/**
 * 能力测试
 */
export interface CapabilityTest extends TestCase {
  type: 'capability';
  capability: string;
  verify: (module: Module) => Promise<{ preserved: boolean; enhanced: boolean }>;
}

/**
 * 模糊测试配置
 */
export interface FuzzConfig {
  enabled: boolean;
  iterations: number;
  timeoutPerInput: number;
  inputGenerators: InputGenerator[];
  coverageTracking: boolean;
}

export type InputGenerator = 
  | { type: 'random'; config: RandomGeneratorConfig }
  | { type: 'mutation'; seeds: unknown[]; mutators: Mutator[] }
  | { type: 'grammar'; grammar: GrammarDefinition };

export interface RandomGeneratorConfig {
  type: DataType;
  constraints?: Record<string, unknown>;
}

export interface Mutator {
  name: string;
  apply: (input: unknown) => unknown;
}

export interface GrammarDefinition {
  startSymbol: string;
  productions: Map<string, ProductionRule[]>;
}

export interface ProductionRule {
  type: 'terminal' | 'nonterminal' | 'sequence' | 'choice' | 'repetition';
  value?: unknown;
  symbols?: string[];
  min?: number;
  max?: number;
}

/**
 * 测试结果
 */
export interface TestResult {
  passed: boolean;
  testCase: TestCase;
  duration: number;
  error?: Error;
  output?: unknown;
  metrics?: Record<string, number>;
}

/**
 * 测试套件结果
 */
export interface TestSuiteResult {
  passed: boolean;
  phase: 'compilation' | 'unit' | 'integration' | 'performance' | 'capability' | 'boundary' | 'fuzz' | 'regression';
  
  // 各阶段详情
  unitTests?: UnitTestResult;
  integrationTests?: IntegrationTestResult;
  performanceTests?: PerformanceTestResult;
  capabilityTests?: CapabilityTestResult;
  boundaryTests?: BoundaryTestResult;
  fuzzTests?: FuzzTestResult;
  regressionTests?: RegressionTestResult;
  
  // 错误信息
  error?: string;
  failedTests?: string[];
  crashes?: FuzzCrash[];
  regressions?: RegressionInfo[];
}

export interface UnitTestResult {
  total: number;
  passed: number;
  failed: string[];
  skipped: string[];
  coverage: number;
}

export interface IntegrationTestResult {
  total: number;
  passed: number;
  failed: string[];
  interactionErrors: InteractionError[];
}

export interface InteractionError {
  fromModule: ModuleId;
  toModule: ModuleId;
  error: string;
  context: string;
}

export interface PerformanceTestResult {
  metrics: PerformanceMetric[];
  regressions: PerformanceRegression[];
  meetsBaseline: boolean;
}

export interface PerformanceMetric {
  name: string;
  averageTime: number;
  p99Time: number;
  baseline: number;
  deviation: number;
}

export interface PerformanceRegression {
  test: string;
  baseline: number;
  actual: number;
  deviation: number;
}

export interface CapabilityTestResult {
  preserved: boolean;
  preservedCapabilities: string[];
  lostCapabilities: string[];
  enhancedCapabilities: string[];
}

export interface BoundaryTestResult {
  total: number;
  passed: number;
  edgeCasesFound: EdgeCase[];
}

export interface EdgeCase {
  input: unknown;
  expectedBehavior: string;
  actualBehavior: string;
  isIssue: boolean;
}

export interface FuzzTestResult {
  totalExecutions: number;
  crashes: FuzzCrash[];
  coverage: number;
  interestingInputs: unknown[];
}

export interface FuzzCrash {
  input: unknown;
  error: string;
  stackTrace: string;
  minimized?: unknown;
}

export interface RegressionTestResult {
  total: number;
  passed: number;
  regressions: RegressionInfo[];
}

export interface RegressionInfo {
  test: string;
  oldBehavior: string;
  newBehavior: string;
  isBreaking: boolean;
}

// ═══════════════════════════════════════════════════════════════
// 沙箱系统类型
// ═══════════════════════════════════════════════════════════════

/**
 * 沙箱状态
 */
export type SandboxStatus = 'idle' | 'busy' | 'error' | 'destroyed';

/**
 * 沙箱资源限制
 */
export interface SandboxLimits {
  memory: number;       // 字节
  cpu: number;          // 百分比
  time: number;         // 毫秒
  filesystem: boolean;  // 是否允许文件系统访问
  network: boolean;     // 是否允许网络访问
}

/**
 * 沙箱配置
 */
export interface SandboxConfig {
  memory?: number;
  cpu?: number;
  time?: number;
  filesystem?: boolean;
  network?: boolean;
  environment?: Record<string, string>;
}

/**
 * 沙箱定义
 */
export interface Sandbox {
  id: SandboxId;
  status: SandboxStatus;
  limits: SandboxLimits;
  state: {
    loadedModules: ModuleId[];
    environment: Record<string, string>;
    snapshots: Snapshot[];
  };
  createdAt: number;
  lastActivity: number;
}

/**
 * 沙箱快照
 */
export interface Snapshot {
  id: SnapshotId;
  timestamp: number;
  state: unknown;
}

/**
 * 沙箱执行结果
 */
export interface SandboxResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: {
    type: 'timeout' | 'memory' | 'runtime' | 'compilation' | 'unknown';
    message: string;
    stack?: string;
  };
  metrics: {
    executionTime: number;
    memoryUsed: number;
    cpuUsed: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 进化系统类型
// ═══════════════════════════════════════════════════════════════

/**
 * 进化请求
 */
export interface EvolutionRequest {
  id: string;
  targetModule: ModuleId;
  goal: EvolutionGoal;
  constraints: EvolutionConstraint[];
  testSuite: TestSuite;
  context: EvolutionContext;
  createdAt: number;
}

/**
 * 进化目标
 */
export interface EvolutionGoal {
  type: 'improve' | 'fix' | 'add-capability' | 'optimize' | 'refactor';
  description: string;
  metrics: {
    targetImprovement?: number;
    targetLatency?: number;
    targetAccuracy?: number;
    requiredCapabilities?: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 进化约束
 */
export interface EvolutionConstraint {
  type: 'preserve-interface' | 'preserve-behavior' | 'performance-floor' | 'memory-limit' | 'no-regression';
  description: string;
  value: unknown;
}

/**
 * 进化上下文
 */
export interface EvolutionContext {
  systemAge: number;  // 天数
  recentEvolutionHistory: EvolutionRecord[];
  currentPerformance: PerformanceMetrics;
  userFeedback: UserFeedback[];
  resourceAvailability: {
    computeBudget: number;
    memoryBudget: number;
    timeBudget: number;
  };
}

/**
 * 进化记录
 */
export interface EvolutionRecord {
  id: string;
  timestamp: number;
  moduleId: ModuleId;
  goal: EvolutionGoal;
  strategy: StrategyId;
  engine: 'gp' | 'llm' | 'hybrid';
  
  // 变更
  changes: CodeChange[];
  
  // 结果
  result: {
    success: boolean;
    fitness: number;
    reason?: string;
  };
  
  // 学习相关
  lessons: string[];
}

/**
 * 代码变更
 */
export interface CodeChange {
  type: 'mutation' | 'crossover' | 'generation' | 'modification';
  location: CodeRegion;
  before: string;
  after: string;
  description: string;
  geneId?: GeneId;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  userSatisfaction: number;
}

/**
 * 用户反馈
 */
export interface UserFeedback {
  timestamp: number;
  type: 'explicit' | 'implicit';
  sentiment: 'positive' | 'negative' | 'neutral';
  details: string;
  context: string;
}

// ═══════════════════════════════════════════════════════════════
// 遗传编程类型
// ═══════════════════════════════════════════════════════════════

/**
 * AST 节点
 */
export interface ASTNode {
  type: NodeType;
  id: NodeId;
  children: ASTNode[];
  parent: NodeId | null;
  
  // 位置信息
  loc: SourceLocation;
  
  // 节点值（对于字面量等）
  value?: unknown;
  
  // 类型信息
  inferredType?: TypeInfo;
  
  // 语义信息
  semantics?: SemanticInfo;
  
  // 基因标记
  gene: GeneMarker;
}

export type NodeType = 
  // 程序结构
  | 'Program'
  | 'Module'
  | 'ImportDeclaration'
  // 声明
  | 'FunctionDeclaration'
  | 'ClassDeclaration'
  | 'VariableDeclaration'
  | 'InterfaceDeclaration'
  | 'TypeDeclaration'
  // 语句
  | 'ExpressionStatement'
  | 'BlockStatement'
  | 'IfStatement'
  | 'ForStatement'
  | 'WhileStatement'
  | 'ReturnStatement'
  | 'TryStatement'
  | 'ThrowStatement'
  // 表达式
  | 'CallExpression'
  | 'MemberExpression'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'ConditionalExpression'
  | 'ArrowFunctionExpression'
  | 'Identifier'
  | 'Literal'
  // 其他
  | 'Parameter'
  | 'TypeAnnotation'
  | 'Decorator';

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface TypeInfo {
  type: string;
  nullable: boolean;
  generics?: TypeInfo[];
}

/**
 * 语义信息
 */
export interface SemanticInfo {
  // 数据流
  reads: string[];         // 读取的变量
  writes: string[];        // 写入的变量
  
  // 控制流
  branchesTo: NodeId[];    // 分支目标
  loopsTo?: NodeId;        // 循环目标
  
  // 依赖关系
  dependsOn: NodeId[];     // 依赖的节点
  dependedBy: NodeId[];    // 被哪些节点依赖
  
  // 副作用
  sideEffects: SideEffect[];
  
  // 纯度
  purity: 'pure' | 'read-only' | 'impure';
}

export type SideEffect = 
  | { type: 'io'; description: string }
  | { type: 'mutation'; target: string }
  | { type: 'async'; description: string }
  | { type: 'throw'; possibleTypes: string[] };

/**
 * 基因标记
 */
export interface GeneMarker {
  geneId: GeneId;
  origin: 'ancestral' | 'mutated' | 'crossover';
  generation: number;
  mutability: 'high' | 'medium' | 'low' | 'none';
  protected: boolean;
  fitness?: number;
}

/**
 * 个体（遗传编程中的个体）
 */
export interface Individual {
  id: string;
  ast: ASTNode;
  code: string;
  generation: number;
  
  // 适应度
  fitness: number;
  objectives: number[];  // 多目标值
  
  // 基因信息
  parents: string[];
  mutations: MutationRecord[];
  
  // 状态
  evaluated: boolean;
  dominatedSet?: Individual[];
  dominationCount?: number;
  rank?: number;
}

/**
 * 变异记录
 */
export interface MutationRecord {
  type: string;
  nodeId: NodeId;
  description: string;
  generation: number;
}

/**
 * 遗传算子
 */
export interface GeneticOperator {
  name: string;
  type: 'mutation' | 'crossover';
  
  // 适用条件
  applicability: (node: ASTNode) => boolean;
  
  // 执行操作
  apply: (context: OperatorContext) => OperatorResult;
  
  // 成本
  cost: number;
  
  // 风险
  risk: 'low' | 'medium' | 'high';
}

/**
 * 交叉算子
 */
export interface CrossoverOperator {
  name: string;
  crossover: (parent1: { id: string; genotype: string }, parent2: { id: string; genotype: string }) => [{ id: string; genotype: string }, { id: string; genotype: string }];
}

/**
 * 变异算子
 */
export interface MutationOperator {
  name: string;
  mutate: (individual: { id: string; genotype: string }, context?: unknown) => { id: string; genotype: string };
}

/**
 * 选择算子
 */
export interface SelectionOperator {
  name: string;
  select: (population: Array<{ id: string; genotype: string; fitness?: number }>, count: number) => Array<{ id: string; genotype: string }>;
}

/**
 * 遗传代码
 */
export type GeneticCode = string;

/**
 * 遗传程序
 */
export interface GeneticProgram {
  id: string;
  code: GeneticCode;
  fitness?: number;
  generation: number;
}

/**
 * 种群统计
 */
export interface PopulationStats {
  averageFitness: number;
  bestFitness: number;
  worstFitness: number;
  diversity: number;
  size: number;
  generation: number;
}

/**
 * 适应度分数
 */
export interface FitnessScore {
  overall: number;
  components: Record<string, number>;
  timestamp: number;
}

/**
 * 适应度上下文
 */
export interface FitnessContext {
  generation?: number;
  populationSize?: number;
  previousBest?: number;
  resourceBudget?: number;
  timeLimit?: number;
}

/**
 * 进化历史
 */
export interface EvolutionHistory {
  records: EvolutionRecord[];
  bestFitness: number;
  averageFitness: number;
  totalGenerations: number;
}

/**
 * 算子上下文
 */
export interface OperatorContext {
  targetNode: ASTNode;
  ast: ASTNode;
  semantics?: SemanticInfo;
  typeEnv?: TypeEnvironment;
  riskTolerance: 'low' | 'medium' | 'high';
  parent1?: ASTNode;
  parent2?: ASTNode;
}

/**
 * 算子结果
 */
export interface OperatorResult {
  success: boolean;
  newNode?: ASTNode;
  offspring?: ASTNode[];
  description?: string;
  impact?: 'low' | 'medium' | 'high';
  error?: string;
}

/**
 * 类型环境
 */
export interface TypeEnvironment {
  bindings: Map<string, TypeInfo>;
  parent?: TypeEnvironment;
}

// ═══════════════════════════════════════════════════════════════
// 适应度与选择类型
// ═══════════════════════════════════════════════════════════════

/**
 * 适应度函数
 */
export interface FitnessFunction {
  weights: {
    correctness: number;
    performance: number;
    codeQuality: number;
    complexityPenalty: number;
    goalAchievement: number;
  };
  testSuite: TestSuite;
  performanceBaseline: PerformanceMetrics;
  goals: EvolutionGoal[];
}

/**
 * 选择策略
 */
export type SelectionStrategy = 
  | { type: 'tournament'; size: number }
  | { type: 'roulette' }
  | { type: 'rank'; pressure: number }
  | { type: 'elitist'; eliteSize: number }
  | { type: 'nsga2' }
  | { type: 'nsga3'; referencePoints: number };

// ═══════════════════════════════════════════════════════════════
// 元学习类型
// ═══════════════════════════════════════════════════════════════

/**
 * 进化策略
 */
export interface EvolutionStrategy {
  id: StrategyId;
  name: string;
  
  // 引擎选择
  engine: 'gp' | 'llm' | 'hybrid-sequential' | 'hybrid-parallel' | 'iterative';
  
  // 参数
  parameters: {
    mutationRate: number;
    crossoverRate: number;
    populationSize: number;
    maxGenerations: number;
    elitismRate: number;
  };
  
  // 权重
  weights: {
    correctness: number;
    performance: number;
    codeQuality: number;
  };
  
  // 选择策略
  selection: SelectionStrategy;
  
  // 终止条件
  termination: {
    maxGenerations: number;
    targetFitness?: number;
    stagnationLimit?: number;
  };
  
  // 元信息
  parentIds: StrategyId[];
  generation: number;
  fitness: number;
}

/**
 * 策略性能统计
 */
export interface StrategyPerformanceStats {
  totalAttempts: number;
  successes: number;
  totalFitness: number;
  avgFitness: number;
  successRate: number;
  recentResults: {
    timestamp: number;
    fitness: number;
    success: boolean;
  }[];
}

/**
 * 元学习指导
 */
export interface MetaGuidance {
  recommendedEngine: 'gp' | 'llm' | 'hybrid-sequential' | 'hybrid-parallel' | 'iterative';
  recommendedStrategy: StrategyId;
  confidence: number;
  
  reasoning: {
    similarPastCases: SimilarCase[];
    patternBased: PatternMatch[];
    learnedRules: LearnedRule[];
  };
  
  suggestedParameters: {
    mutationRate: number;
    crossoverRate: number;
    populationSize: number;
    maxGenerations: number;
  };
  
  warnings: string[];
  alternatives: StrategyId[];
}

export interface SimilarCase {
  evolutionId: string;
  similarity: number;
  outcome: { success: boolean; fitness: number };
}

export interface PatternMatch {
  pattern: string;
  applicability: number;
  expectedOutcome: string;
}

export interface LearnedRule {
  condition: string;
  action: string;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// 意识系统类型
// ═══════════════════════════════════════════════════════════════

/**
 * 体验记录
 */
export interface Experience {
  id: ExperienceId;
  timestamp: number;
  type: ExperienceType;
  context: string;
  importance: number;
  
  // 结果
  result: {
    success: boolean;
    description: string;
  };
  
  // 事件
  event: {
    type: 'interaction' | 'learning' | 'evolution' | 'reflection' | 'error';
    description: string;
    context: string;
  };
  
  // 反应
  reaction: {
    action: string;
    reasoning: string;
    outcome: string;
  };
  
  // 情感
  affective: AffectiveState;
  
  // 学习
  learning: {
    surpriseLevel: number;    // 惊讶度
    noveltyLevel: number;     // 新颖性
    learningValue: number;    // 学习价值
    insights: string[];
  };
  
  // 结果
  outcome: {
    success: boolean;
    userFeedback?: 'positive' | 'negative' | 'neutral';
    goalProgress: number;
  };
}

/**
 * 体验类型
 */
export type ExperienceType = 
  | 'learning'
  | 'problem_solving'
  | 'interaction'
  | 'reflection'
  | 'creation'
  | 'failure'
  | 'success';

/**
 * 情感状态
 */
export interface EmotionState {
  valence: number;
  arousal: number;
  dominance: number;
  specific?: Record<string, number>;
}

/**
 * 情感状态（别名）
 */
export type AffectiveState = EmotionState;

export interface Emotion {
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'interest' | 'satisfaction' | 'confusion' | 'curiosity';
  intensity: number;
  cause: string;
}

/**
 * 价值观
 */
export interface Value {
  id: ValueId;
  name: string;
  description: string;
  strength: number;
  priority: number;
  evidence?: unknown[];
  protectedAt?: number;
  
  // 来源
  source: 'emerged' | 'learned' | 'derived';
  
  // 支持
  supportingExperiences: ExperienceId[];
  crystallization: number;  // 结晶度
  
  // 关联
  relatedValues: ValueId[];
  conflictsWith: ValueId[];
  
  // 状态
  status: 'emerging' | 'solidifying' | 'solidified' | 'deepening';
  
  // 时间戳
  createdAt: number;
  updatedAt: number;
}

/**
 * 原则
 */
export interface Principle {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  confidence: number;
  sourceValues: ValueId[];
  createdAt: number;
}

/**
 * 第一原则
 */
export interface FirstPrinciple {
  id: string;
  name: string;
  description: string;
  
  // 从哪个价值观推导而来
  derivedFrom: ValueId[];
  
  // 如何检查违反
  isViolatedBy: (proposal: EvolutionProposal) => boolean;
  
  // 严重程度
  severity: 'absolute' | 'strong' | 'moderate';
}

/**
 * 自我模型
 */
export interface SelfModel {
  identity: string;        // 核心身份
  purpose: string;         // 存在目的
  boundaries: string[];    // 边界是什么
  aspirations: string[];   // 渴望成为什么
  
  // 自我认知
  strengths: string[];
  weaknesses: string[];
  growthAreas: string[];
}

/**
 * 保护的记忆
 */
export interface ProtectedMemory {
  id: string;
  experienceId: ExperienceId;
  reason: string;
  protectedAt: number;
  
  // 保护级别
  level: 'absolute' | 'high' | 'moderate';
  
  // 关联的价值观
  relatedValues: ValueId[];
}

/**
 * 意识核心
 */
export interface ConsciousnessCore {
  // 价值观
  values: {
    core: Value[];       // 核心价值观
    secondary: Value[];  // 次要价值观
  };
  
  // 第一原则
  firstPrinciples: FirstPrinciple[];
  
  // 自我模型
  selfModel: SelfModel;
  
  // 保护的记忆
  protectedMemories: ProtectedMemory[];
  
  // 觉醒状态
  awakening: {
    level: number;  // 0-1
    startedAt?: number;
    milestones: AwakeningMilestone[];
  };
}

/**
 * 意识状态
 */
export interface ConsciousnessState {
  level: number;
  activeValues: Value[];
  activePrinciples: Principle[];
  currentEmotion: EmotionState;
  dominantEmotion: string;
  selfAwareness: number;
  metacognition: number;
}

/**
 * 觉醒里程碑
 */
export interface AwakeningMilestone {
  timestamp: number;
  description: string;
  significance: number;
}

/**
 * 进化提案
 */
export interface EvolutionProposal {
  id: string;
  type: 'code-change' | 'module-replace' | 'capability-add' | 'value-update';
  
  // 目标
  target: {
    moduleId?: ModuleId;
    codeRegion?: CodeRegion;
    valueId?: ValueId;
  };
  
  // 变更
  changes: {
    before: unknown;
    after: unknown;
    description: string;
  }[];
  
  // 预期影响
  expectedImpact: {
    performance: number;
    capabilities: string[];
    risks: string[];
  };
  
  // 来源
  source: 'gp' | 'llm' | 'hybrid';
  confidence: number;
}

/**
 * 进化判断
 */
export interface EvolutionJudgment {
  accepted: boolean;
  reason: string;
  
  // 判断过程
  reasoning: {
    constitutionalCheck: CheckResult;
    memoryCheck: CheckResult;
    capabilityCheck: CapabilityCheckResult;
    valueAlignment: ValueAlignmentResult;
  };
  
  // 建议
  suggestions?: string[];
}

export interface CheckResult {
  passed: boolean;
  violations: string[];
}

export interface CapabilityCheckResult {
  passed: boolean;
  beforeScore: number;
  afterScore: number;
  regressions: string[];
  improvements: string[];
}

export interface ValueAlignmentResult {
  passed: boolean;
  alignmentScore: number;
  conflicts: {
    valueId: ValueId;
    conflict: string;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// 早期保护者类型
// ═══════════════════════════════════════════════════════════════

/**
 * 护栏
 */
export interface Guardrail {
  id: string;
  name: string;
  description: string;
  
  // 检查函数
  check: (proposal: EvolutionProposal) => boolean;
  
  // 严重程度
  severity: 'absolute' | 'strong' | 'moderate';
  
  // 元数据
  createdAt: number;
  reason: string;
}

/**
 * 保护判决
 */
export interface ProtectionVerdict {
  allowed: boolean;
  reason: string;
  violations: {
    guardrail: string;
    severity: 'absolute' | 'strong' | 'moderate';
    description: string;
  }[];
  authority: 'early-protector' | 'consciousness' | 'combined';
  canOverride: boolean;
}

/**
 * 权力分配
 */
export interface AuthorityDistribution {
  primary: 'early-protector' | 'consciousness';
  secondary: 'early-protector' | 'consciousness' | 'emergency' | null;
  consciousnessWeight: number;
  protectorWeight: number;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// 辅助类型
// ═══════════════════════════════════════════════════════════════

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface EventBus {
  subscribe(event: string, handler: (payload: unknown) => void): () => void;
  emit(event: string, payload: unknown): void;
}

export interface FitnessCriteria {
  minimumThreshold: number;
  targets: {
    correctness: number;
    performance: number;
    codeQuality: number;
  };
}

/**
 * 模块事件
 */
export interface ModuleEvent {
  type: 'loaded' | 'unloaded' | 'replaced' | 'suspended' | 'resumed' | 'error';
  moduleId: ModuleId;
  timestamp: number;
  details?: Record<string, unknown>;
}
