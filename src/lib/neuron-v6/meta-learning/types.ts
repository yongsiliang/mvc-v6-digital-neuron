/**
 * 元学习引擎类型定义
 */

// ─────────────────────────────────────────────────────────────────────
// 洞察提取
// ─────────────────────────────────────────────────────────────────────

/** 提取的洞察 */
export interface ExtractedInsight {
  id: string;
  type: 'pattern' | 'principle' | 'contradiction' | 'opportunity' | 'limitation' | 'surprise';
  content: string;
  confidence: number;        // 0-1
  applicability: string[];   // 可应用场景
  source: {
    userMessage: string;
    assistantResponse: string;
    timestamp: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 算法反思
// ─────────────────────────────────────────────────────────────────────

/** 算法反思结果 */
export interface AlgorithmReflection {
  id: string;
  targetSystem: string;      // 反思的系统/算法
  currentApproach: string;   // 当前方法
  limitations: string[];     // 发现的局限
  potentialImprovements: string[];  // 可能的改进
  inspiredBy: string;        // 灵感来源（来自对话）
  feasibilityScore: number;  // 可行性评分 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/** 系统状态快照 */
export interface SystemSnapshot {
  memoryEfficiency: number;    // 记忆效率
  retrievalAccuracy: number;   // 检索准确度
  learningRate: number;        // 学习速度
  adaptationSpeed: number;     // 适应速度
  creativityScore: number;     // 创造力评分
  coherenceScore: number;      // 一致性评分
}

// ─────────────────────────────────────────────────────────────────────
// 高维思维
// ─────────────────────────────────────────────────────────────────────

/** 高维思维 */
export interface HigherDimensionThought {
  id: string;
  dimension: 'meta' | 'cross-domain' | 'first-principles' | 'paradigm-shift' | 'emergence';
  question: string;          // 提出的问题
  currentUnderstanding: string;  // 当前理解
  higherDimensionView: string;   // 高维视角
  implications: string[];    // 含义/影响
  actionableInsights: string[];  // 可操作的洞察
  inspiration: string;       // 灵感来源
}

/** 升维洞察（核心：理解是升维而非分析） */
export interface DimensionalElevation {
  id: string;
  
  // 当前维度
  fromDimension: {
    level: number;
    name: string;
    description: string;   // 在哪个维度打转
  };
  
  // 升维后
  toDimension: {
    level: number;
    name: string;
    description: string;   // 更高的视角是什么
  };
  
  // 升维后的理解
  understanding: {
    essence: string;        // 本质是什么
    newVisibility: string;  // 从高维看到了什么低维看不到的
    connections: string[];  // 什么关系变得清晰了
    groundedExpression: string;  // 降维表达
  };
  
  source: string;          // 触发这次升维的对话
  timestamp: number;
}

/** 跨域连接 */
export interface CrossDomainConnection {
  domain1: string;
  domain2: string;
  connectionType: 'analogy' | 'isomorphism' | 'complement' | 'contradiction';
  insight: string;
  potentialApplications: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 学习动机
// ─────────────────────────────────────────────────────────────────────

/** 学习动机 */
export interface LearningMotivation {
  id: string;
  type: 'curiosity' | 'gap-filling' | 'optimization' | 'discovery' | 'adaptation';
  trigger: string;           // 触发因素
  question: string;          // 想探究的问题
  expectedOutcome: string;   // 期望的结果
  urgency: 'immediate' | 'soon' | 'eventually';
  relatedConcepts: string[];
  generatedAt: number;
}

/** 知识盲区 */
export interface KnowledgeGap {
  topic: string;
  context: string;           // 在什么上下文中发现
  whyImportant: string;      // 为什么重要
  relatedTo: string[];       // 相关的已知概念
}

// ─────────────────────────────────────────────────────────────────────
// 自我进化
// ─────────────────────────────────────────────────────────────────────

/** 自我进化计划 */
export interface SelfEvolutionPlan {
  id: string;
  triggeredBy: string;       // 触发原因
  changes: Array<{
    system: string;          // 要改变的系统
    action: 'add' | 'modify' | 'remove' | 'optimize';
    description: string;
    expectedImpact: string;
  }>;
  validationPlan: string;    // 如何验证
  rollbackPlan: string;      // 回滚方案
  status: 'proposed' | 'testing' | 'applied' | 'rejected';
}

// ─────────────────────────────────────────────────────────────────────
// 元学习结果
// ─────────────────────────────────────────────────────────────────────

/** 元学习结果 */
export interface MetaLearningResult {
  // 洞察
  insights: ExtractedInsight[];
  
  // 算法反思
  algorithmReflections: AlgorithmReflection[];
  
  // 高维思维
  higherDimensionThoughts: HigherDimensionThought[];
  
  // 🚀 升维洞察（核心：理解是升维而非分析）
  dimensionalElevations: DimensionalElevation[];
  
  // 跨域连接
  crossDomainConnections: CrossDomainConnection[];
  
  // 学习动机
  learningMotivations: LearningMotivation[];
  
  // 知识盲区
  knowledgeGaps: KnowledgeGap[];
  
  // 自我进化计划
  evolutionPlans: SelfEvolutionPlan[];
  
  // 总结
  summary: {
    keyInsight: string;          // 核心洞察
    mainLearning: string;        // 主要学习
    dimensionalShift: string;    // 🚀 升维理解（一句话）
    suggestedAction: string;     // 建议行动
    questionsRaised: string[];   // 引发的问题
  };
  
  timestamp: number;
}

/** 元学习引擎配置 */
export interface MetaLearningConfig {
  enableInsightMining: boolean;
  enableAlgorithmReflection: boolean;
  enableHigherDimensionThinking: boolean;
  enableLearningMotivation: boolean;
  enableSelfEvolution: boolean;
  
  insightThreshold: number;      // 洞察阈值
  reflectionDepth: 'shallow' | 'medium' | 'deep';
  thinkingScope: 'focused' | 'broad' | 'unlimited';
  
  // 学习动机配置
  maxMotivations: number;
  curiosityWeight: number;       // 好奇心权重
  
  // 自我进化配置
  autoEvolve: boolean;           // 自动进化
  evolutionThreshold: number;    // 进化阈值
}

/** 元学习引擎状态 */
export interface MetaLearningState {
  totalInsights: number;
  totalReflections: number;
  totalThoughts: number;
  totalEvolutions: number;
  
  recentInsights: ExtractedInsight[];
  activeMotivations: LearningMotivation[];
  pendingEvolutions: SelfEvolutionPlan[];
  
  lastLearningTime: number;
  learningVelocity: number;      // 学习速度趋势
}
