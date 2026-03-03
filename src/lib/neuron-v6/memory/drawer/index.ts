/**
 * ═══════════════════════════════════════════════════════════════════════
 * 抽屉式记忆管理系统 - 主入口
 * 
 * 核心理念（来自王昱珩的记忆方法）：
 * 
 * 1. 分类收纳
 *    - 将记忆存放在带标签的抽屉里
 *    - 不同类型的记忆被分类存放在不同空间
 *    - 建立高效检索系统
 * 
 * 2. 折叠而非删除
 *    - 选择性遗忘，保留检索路径
 *    - 折叠 = 仍然存在，但不展开
 *    - 可以后展开，但默认不显示
 * 
 * 3. 检索优先于存储
 *    - 真正的学习不是填满内存，而是建立高效的检索系统
 *    - 记忆能力 ≠ 存储量
 *    - 记忆能力 = 检索效率
 * 
 * 4. 控制自动播放
 *    - 阻断不需要的记忆干扰
 *    - 保护注意力，不让无用信息干扰
 *    - 抽屉的本质是门，不是容器
 * ═══════════════════════════════════════════════════════════════════════
 */

// 导出类型
export type {
  MemoryDrawer,
  DrawerCategory,
  DrawerState,
  DrawerItem,
  DrawerOperationResult,
  MemoryAssignmentResult,
  DrawerSystemState,
  DrawerSystemOptions,
  DrawerSystemStats,
  FoldingRule,
  FoldingReason,
  FoldingConditions,
  FoldingBehavior,
  FoldedMemoryReference,
  MemoryIndex,
  IndexedMemoryRef,
  IndexStats,
  SearchOptions,
  SearchResult,
  SearchResultItem,
  AutoPlayControl,
  AutoPlayMode,
  AutoPlayEvent,
  AutoPlayTriggerReason,
  AutoPlayTriggers,
  AutoPlayBlockers,
} from './types';

// 导出模块
export { DrawerManager } from './drawer-manager';
export { FoldingEngine } from './folding-engine';
export { RetrievalOptimizer } from './retrieval-optimizer';
export { AutoPlayController } from './autoplay-controller';

// 导出统一的系统类
export { DrawerMemorySystem } from './system';
