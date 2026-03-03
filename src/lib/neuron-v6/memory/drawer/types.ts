/**
 * ═══════════════════════════════════════════════════════════════════════
 * 抽屉式记忆管理 - 类型定义
 * 
 * 核心理念（来自王昱珩的记忆方法）：
 * 1. 分类收纳 - 将记忆存放在带标签的抽屉里
 * 2. 折叠而非删除 - 选择性遗忘，保留检索路径
 * 3. 检索优先于存储 - 找得快比存得多更重要
 * 4. 控制自动播放 - 阻断不需要的记忆干扰
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SuperMemory } from '../super-memory';

// ─────────────────────────────────────────────────────────────────────
// 核心类型
// ─────────────────────────────────────────────────────────────────────

/** 记忆抽屉 */
export interface MemoryDrawer {
  /** 抽屉ID */
  id: string;
  
  /** 抽屉标签（人类可读） */
  label: string;
  
  /** 分类 */
  category: DrawerCategory;
  
  /** 优先级（0-1，越高越重要） */
  priority: number;
  
  /** 抽屉状态 */
  state: DrawerState;
  
  /** 内容物 */
  contents: DrawerItem[];
  
  /** 索引 */
  index: Map<string, DrawerItem>;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 是否允许自动播放 */
  autoPlayAllowed: boolean;
  
  /** 抽屉容量（0 = 无限制） */
  capacity: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 描述 */
  description?: string;
  
  /** 父抽屉（支持层级） */
  parentDrawerId?: string;
  
  /** 子抽屉 */
  childDrawerIds: string[];
}

/** 抽屉分类 */
export type DrawerCategory = 
  | 'work'          // 工作
  | 'life'          // 生活
  | 'skill'         // 技能
  | 'knowledge'     // 知识
  | 'emotion'       // 情感
  | 'relationship'  // 关系
  | 'goal'          // 目标
  | 'insight'       // 洞察
  | 'belief'        // 信念
  | 'creative'      // 创意
  | 'routine'       // 日常
  | 'archive'       // 归档
  | 'custom';       // 自定义

/** 抽屉状态 */
export type DrawerState = 
  | 'open'     // 打开：内容可被检索和自动浮现
  | 'closed'   // 关闭：内容需要主动打开才能访问
  | 'folded'   // 折叠：所有内容都被折叠
  | 'locked';  // 锁定：需要特定条件才能打开

/** 抽屉内的记忆项 */
export interface DrawerItem {
  /** 原始记忆ID */
  memoryId: string;
  
  /** 引用的原始记忆 */
  memory: SuperMemory;
  
  /** 在抽屉内的标签 */
  localLabel: string;
  
  /** 折叠状态 */
  folded: boolean;
  
  /** 折叠原因 */
  foldedReason?: FoldingReason;
  
  /** 放入抽屉的时间 */
  addedAt: number;
  
  /** 最后展开时间 */
  lastUnfoldedAt?: number;
  
  /** 局部重要性（相对于抽屉内其他项） */
  localPriority: number;
  
  /** 访问历史 */
  accessHistory: Array<{
    at: number;
    type: 'open' | 'close' | 'fold' | 'unfold' | 'search';
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// 折叠系统
// ─────────────────────────────────────────────────────────────────────

/** 折叠原因 */
export type FoldingReason =
  | 'low_access_frequency'    // 访问频率低
  | 'low_relevance'           // 相关性低
  | 'time_decay'              // 时间衰减
  | 'low_emotional_weight'    // 情感权重低
  | 'user_explicit_fold'      // 用户主动折叠
  | 'drawer_full'             // 抽屉满了
  | 'category_archive'        // 分类归档
  | 'consolidation_complete'; // 巩固完成

/** 折叠规则 */
export interface FoldingRule {
  /** 规则ID */
  id: string;
  
  /** 规则名称 */
  name: string;
  
  /** 触发条件 */
  conditions: FoldingConditions;
  
  /** 折叠后的行为 */
  behavior: FoldingBehavior;
  
  /** 规则优先级 */
  priority: number;
  
  /** 是否启用 */
  enabled: boolean;
}

/** 折叠条件 */
export interface FoldingConditions {
  /** 访问频率阈值（低于此值触发） */
  accessFrequencyThreshold?: number;
  
  /** 相关性阈值（低于此值触发） */
  relevanceThreshold?: number;
  
  /** 距上次访问的天数阈值（超过此值触发） */
  daysSinceLastAccess?: number;
  
  /** 情感权重阈值（低于此值触发） */
  emotionalWeightThreshold?: number;
  
  /** 记忆强度阈值（低于此值触发） */
  strengthThreshold?: number;
  
  /** 巩固级别阈值（高于此值触发） */
  consolidationLevelThreshold?: number;
  
  /** 自定义条件函数名 */
  customCondition?: string;
}

/** 折叠行为 */
export interface FoldingBehavior {
  /** 从主动池移除 */
  removeFromActivePool: boolean;
  
  /** 保留索引路径 */
  retainIndexPath: boolean;
  
  /** 强度降低比例 */
  strengthReduction: number;
  
  /** 是否归档 */
  archive: boolean;
  
  /** 折叠后的访问方式 */
  accessMode: 'search_only' | 'explicit_unfold' | 'triggered';
}

/** 折叠的记忆引用 */
export interface FoldedMemoryReference {
  /** 原始记忆ID */
  memoryId: string;
  
  /** 所在抽屉ID */
  drawerId: string;
  
  /** 折叠时间 */
  foldedAt: number;
  
  /** 折叠原因 */
  reason: FoldingReason;
  
  /** 索引关键词 */
  indexKeywords: string[];
  
  /** 快速恢复路径 */
  recoveryPath: string;
  
  /** 折叠前的强度 */
  originalStrength: number;
}

// ─────────────────────────────────────────────────────────────────────
// 检索系统
// ─────────────────────────────────────────────────────────────────────

/** 记忆索引 */
export interface MemoryIndex {
  /** 主索引：标签 → 抽屉ID列表 */
  labelIndex: Map<string, string[]>;
  
  /** 内容索引：关键词 → 记忆引用列表 */
  contentIndex: Map<string, IndexedMemoryRef[]>;
  
  /** 时间索引：时间范围 → 记忆引用列表 */
  timeIndex: Map<string, IndexedMemoryRef[]>;
  
  /** 关联索引：记忆ID → 相关联的记忆ID列表 */
  associationIndex: Map<string, string[]>;
  
  /** 折叠索引：折叠的记忆仍然可被找到 */
  foldedIndex: Map<string, FoldedMemoryReference>;
  
  /** 分类索引：分类 → 抽屉ID列表 */
  categoryIndex: Map<DrawerCategory, string[]>;
  
  /** 索引统计 */
  stats: IndexStats;
}

/** 索引中的记忆引用 */
export interface IndexedMemoryRef {
  /** 记忆ID */
  memoryId: string;
  
  /** 所在抽屉ID */
  drawerId: string;
  
  /** 相关性分数 */
  relevanceScore: number;
  
  /** 是否折叠 */
  folded: boolean;
  
  /** 关键词 */
  keywords: string[];
  
  /** 时间戳 */
  timestamp: number;
}

/** 索引统计 */
export interface IndexStats {
  /** 总索引项数 */
  totalIndexed: number;
  
  /** 折叠项数 */
  foldedCount: number;
  
  /** 标签数 */
  labelCount: number;
  
  /** 关键词数 */
  keywordCount: number;
  
  /** 最后更新时间 */
  lastUpdated: number;
}

/** 搜索选项 */
export interface SearchOptions {
  /** 搜索范围：抽屉ID列表（空 = 全部） */
  drawerIds?: string[];
  
  /** 分类过滤 */
  categories?: DrawerCategory[];
  
  /** 是否包含折叠的记忆 */
  includeFolded: boolean;
  
  /** 是否需要展开折叠的记忆 */
  autoUnfold: boolean;
  
  /** 时间范围 */
  timeRange?: {
    start: number;
    end: number;
  };
  
  /** 最小相关性 */
  minRelevance?: number;
  
  /** 最大结果数 */
  maxResults: number;
  
  /** 搜索深度 */
  depth: 'shallow' | 'normal' | 'deep';
}

/** 搜索结果 */
export interface SearchResult {
  /** 找到的记忆 */
  items: SearchResultItem[];
  
  /** 总匹配数 */
  totalMatches: number;
  
  /** 搜索耗时（ms） */
  searchTime: number;
  
  /** 搜索来源 */
  sources: {
    activeDrawers: number;
    foldedMemories: number;
    associationTrails: number;
  };
}

/** 搜索结果项 */
export interface SearchResultItem {
  /** 记忆引用 */
  ref: IndexedMemoryRef;
  
  /** 匹配类型 */
  matchType: 'exact' | 'keyword' | 'association' | 'time' | 'tag';
  
  /** 匹配分数 */
  score: number;
  
  /** 匹配片段 */
  matchedSegments: string[];
  
  /** 是否来自折叠记忆 */
  fromFolded: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 自动播放控制
// ─────────────────────────────────────────────────────────────────────

/** 自动播放控制 */
export interface AutoPlayControl {
  /** 允许自动播放的抽屉ID列表 */
  allowedDrawers: string[];
  
  /** 自动播放触发条件 */
  triggers: AutoPlayTriggers;
  
  /** 阻断机制 */
  blockers: AutoPlayBlockers;
  
  /** 当前模式 */
  currentMode: AutoPlayMode;
}

/** 自动播放触发条件 */
export interface AutoPlayTriggers {
  /** 空闲时触发 */
  idle: boolean;
  
  /** 睡眠时触发（梦境模拟） */
  sleep: boolean;
  
  /** 情绪触发 */
  emotional: boolean;
  
  /** 联想触发 */
  associative: boolean;
  
  /** 上下文相关触发 */
  contextual: boolean;
}

/** 自动播放阻断机制 */
export interface AutoPlayBlockers {
  /** 专注模式 */
  focusMode: boolean;
  
  /** 抑制的标签 */
  suppressedTags: string[];
  
  /** 时间窗口限制 */
  timeWindows: Array<{
    start: string;  // HH:mm
    end: string;    // HH:mm
    allowAutoPlay: boolean;
  }>;
  
  /** 最大自动播放时长（分钟） */
  maxDuration: number;
}

/** 自动播放模式 */
export type AutoPlayMode = 
  | 'full'      // 完全自动：所有允许的抽屉都可以自动播放
  | 'partial'   // 部分自动：只有高优先级抽屉自动播放
  | 'minimal'   // 最小自动：只有标记为"必须自动"的记忆播放
  | 'disabled'; // 禁用：不自动播放任何记忆

/** 自动播放事件 */
export interface AutoPlayEvent {
  /** 事件ID */
  id: string;
  
  /** 触发时间 */
  triggeredAt: number;
  
  /** 触发原因 */
  reason: AutoPlayTriggerReason;
  
  /** 播放的记忆 */
  playedMemories: Array<{
    memoryId: string;
    drawerId: string;
    content: string;
  }>;
  
  /** 持续时间 */
  duration: number;
  
  /** 是否被阻断 */
  blocked: boolean;
  
  /** 阻断原因 */
  blockedReason?: string;
}

/** 自动播放触发原因 */
export type AutoPlayTriggerReason =
  | 'idle'           // 空闲
  | 'sleep'          // 睡眠
  | 'emotional'      // 情绪
  | 'associative'    // 联想
  | 'contextual'     // 上下文
  | 'scheduled';     // 计划

// ─────────────────────────────────────────────────────────────────────
// 抽屉系统状态
// ─────────────────────────────────────────────────────────────────────

/** 抽屉系统状态 */
export interface DrawerSystemState {
  /** 所有抽屉 */
  drawers: Map<string, MemoryDrawer>;
  
  /** 当前打开的抽屉 */
  openDrawers: string[];
  
  /** 当前焦点的抽屉 */
  focusedDrawer: string | null;
  
  /** 索引 */
  index: MemoryIndex;
  
  /** 折叠规则 */
  foldingRules: FoldingRule[];
  
  /** 自动播放控制 */
  autoPlayControl: AutoPlayControl;
  
  /** 统计信息 */
  stats: DrawerSystemStats;
}

/** 抽屉系统统计 */
export interface DrawerSystemStats {
  /** 总抽屉数 */
  totalDrawers: number;
  
  /** 总记忆数 */
  totalMemories: number;
  
  /** 折叠记忆数 */
  foldedMemories: number;
  
  /** 平均访问频率 */
  avgAccessFrequency: number;
  
  /** 最高优先级抽屉 */
  highestPriorityDrawer: string | null;
  
  /** 最近访问的抽屉 */
  recentlyAccessedDrawers: string[];
  
  /** 系统最后更新时间 */
  lastUpdated: number;
}

// ─────────────────────────────────────────────────────────────────────
// 操作结果
// ─────────────────────────────────────────────────────────────────────

/** 抽屉操作结果 */
export interface DrawerOperationResult {
  /** 是否成功 */
  success: boolean;
  
  /** 操作类型 */
  operation: 'create' | 'open' | 'close' | 'fold' | 'unfold' | 'assign' | 'remove' | 'search';
  
  /** 目标抽屉ID */
  drawerId: string;
  
  /** 影响的记忆数 */
  affectedMemories: number;
  
  /** 消息 */
  message: string;
  
  /** 错误（如果有） */
  error?: string;
}

/** 记忆分配结果 */
export interface MemoryAssignmentResult {
  /** 是否成功 */
  success: boolean;
  
  /** 分配到的抽屉 */
  drawerId: string;
  
  /** 抽屉标签 */
  drawerLabel: string;
  
  /** 是否新建抽屉 */
  newDrawerCreated: boolean;
  
  /** 是否触发折叠 */
  triggeredFolding: boolean;
  
  /** 折叠的记忆数 */
  foldedCount: number;
}

/** 系统初始化选项 */
export interface DrawerSystemOptions {
  /** 是否启用自动分类 */
  autoClassification: boolean;
  
  /** 默认自动播放模式 */
  defaultAutoPlayMode: AutoPlayMode;
  
  /** 默认折叠规则 */
  defaultFoldingRules: FoldingRule[];
  
  /** 抽屉容量限制 */
  drawerCapacity: number;
  
  /** 是否启用索引自动更新 */
  autoIndexUpdate: boolean;
}
