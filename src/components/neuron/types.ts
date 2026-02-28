/**
 * Neuron 组件本地类型定义
 * 
 * 这些类型原本来自 @/lib/neuron，现在在本地定义以解除依赖
 */

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  neuronType: string;
  message: string;
}

/**
 * 自我表征
 */
export interface SelfRepresentation {
  name: string;
  whoAmI: string;
  traits: string[];
  skills: string[];
  learning: string[];
  adaptations: string[];
  knownUsers: Array<{
    name: string;
    traits: string[];
    relationship: string;
  }>;
  knownEntities: Array<{
    name: string;
    type: string;
    importance: number;
  }>;
  knownContexts: Array<{
    name: string;
    description: string;
    frequency: number;
  }>;
  currentGoals: string[];
  currentEmotions: string[];
  timestamp: number;
  // 核心身份
  identity: {
    name: string;
    purpose: string;
    values: string[];
    traits: string[];
  };
  // 演化状态
  evolution: {
    version: number;
    iterations: number;
    lastUpdate: number;
    learnings: string[];
    adaptations: string[];
  };
  // 当前状态
  currentState: {
    mood: string;
    focus: string;
    energy: number;
    motivation: number;
    openness: number;
  };
  // 能力认知
  capabilities: {
    skills: string[];
    tools: string[];
    domains: string[];
  };
  // 关系网络
  relationships: {
    users: string[];
    entities: string[];
    contexts: string[];
  };
}

/**
 * 主观意义
 */
export interface SubjectiveMeaning {
  concept: string;
  emotionalTone: string;
  importance: number;
  personalRelevance: string;
  associatedMemories?: string[];
  // 情感分析
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  // 意义解释
  interpretation: string;
  // 自我关联度 (0-1)
  selfRelevance: number;
  // 价值评估 (-1 to 1)
  value: number;
  // 置信度 (0-1)
  confidence: number;
  // 记忆标签
  memoryTags: string[];
}
