/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 入口模块
 * 
 * 对话式电脑操作代理，类似 OpenAI Operator / Claude Computer Use
 * 
 * 使用方法：
 * ```typescript
 * import { createComputerAgent } from '@/lib/computer-agent';
 * 
 * const agent = createComputerAgent();
 * const result = await agent.execute('打开浏览器搜索今天的新闻');
 * ```
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心类
export { ComputerAgent, createComputerAgent, getComputerAgent } from './agent';

// 类型导出
export * from './types';

// 常量导出
export * from './constants';

// 子系统导出（高级用户可直接使用）
export { createInputController, MouseController, KeyboardController } from './input';
export { createVisionSystem, ScreenCapture, ScreenAnalyzer } from './vision';
export { createAppManager } from './operations/app-manager';
export { createTaskPlanner } from './planner';
export { createSecurityChecker } from './security';
export { createHistoryLogger } from './history';

// 新增模块导出
export { 
  FileSystemOperations, 
  createFileSystemOperations,
  type FileInfo,
  type DirectoryInfo,
  type SearchResult,
  type FileEditOptions,
  type FileOperationRecord,
} from './operations/file-system';

export { 
  BrowserAutomation, 
  createBrowserAutomation,
  type BrowserType,
  type BrowserConfig,
  type PageInfo,
  type ElementInfo,
  type NavigationOptions,
  type InputOptions,
  type ClickOptions,
} from './operations/browser';

export { 
  ElementMatcher, 
  createElementMatcher,
} from './vision/element-matcher';

export { 
  ErrorRecoveryManager, 
  createErrorRecoveryManager,
  type RecoveryContext,
  type RecoveryRecord,
  type RecoveryResult,
  type RecoveryStrategy,
} from './recovery';
