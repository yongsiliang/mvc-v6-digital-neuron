/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 核心类型定义
 * 
 * 设计原则：
 * 1. 类型安全：所有操作都有明确的输入输出类型
 * 2. Result 模式：所有可能失败的操作返回 Result<T, E>
 * 3. 不可变性：状态对象在创建后不应被修改
 * 4. 可组合性：小类型组合成大类型
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 基础类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * Result 类型 - 类似 Rust 的 Result
 * 用于处理可能失败的操作，避免 try-catch 的隐式错误传播
 */
export type Result<T, E = AgentError> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * 操作结果包装器
 */
export interface OperationResult<T = unknown> {
  /** 操作是否成功 */
  success: boolean;
  /** 成功时的返回值 */
  value?: T;
  /** 失败时的错误信息 */
  error?: AgentError;
  /** 操作耗时（毫秒） */
  duration: number;
  /** 时间戳 */
  timestamp: number;
  /** 截图路径（可选，用于调试） */
  screenshotPath?: string;
}

/**
 * 代理错误类型
 */
export interface AgentError {
  /** 错误名称 */
  name: string;
  /** 错误代码 */
  code: AgentErrorCode;
  /** 错误消息 */
  message: string;
  /** 详细信息 */
  details?: Record<string, unknown>;
  /** 原始错误 */
  cause?: Error;
  /** 是否可重试 */
  retryable: boolean;
  /** 建议的恢复操作 */
  recoveryHint?: string;
}

/**
 * 错误代码枚举
 */
export enum AgentErrorCode {
  // 通用错误
  UNKNOWN = 'UNKNOWN',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  
  // 视觉相关
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  VISION_ANALYSIS_FAILED = 'VISION_ANALYSIS_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  
  // 输入相关
  MOUSE_MOVE_FAILED = 'MOUSE_MOVE_FAILED',
  MOUSE_CLICK_FAILED = 'MOUSE_CLICK_FAILED',
  KEYBOARD_INPUT_FAILED = 'KEYBOARD_INPUT_FAILED',
  
  // 应用相关
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  APP_LAUNCH_FAILED = 'APP_LAUNCH_FAILED',
  WINDOW_NOT_FOUND = 'WINDOW_NOT_FOUND',
  
  // 文件相关
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_OPERATION_FAILED = 'FILE_OPERATION_FAILED',
  
  // 浏览器相关
  BROWSER_NAVIGATION_FAILED = 'BROWSER_NAVIGATION_FAILED',
  ELEMENT_INTERACTION_FAILED = 'ELEMENT_INTERACTION_FAILED',
  
  // 规划相关
  TASK_PLANNING_FAILED = 'TASK_PLANNING_FAILED',
  STEP_EXECUTION_FAILED = 'STEP_EXECUTION_FAILED',
  
  // 安全相关
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DANGEROUS_OPERATION = 'DANGEROUS_OPERATION',
  SANDBOX_VIOLATION = 'SANDBOX_VIOLATION',
}

// ═══════════════════════════════════════════════════════════════════════
// 坐标和区域类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 二维坐标点
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 矩形区域
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 屏幕尺寸
 */
export interface ScreenSize {
  width: number;
  height: number;
  scaleFactor?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 视觉系统类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 屏幕元素类型
 */
export enum ElementType {
  BUTTON = 'button',
  INPUT = 'input',
  TEXT = 'text',
  LINK = 'link',
  IMAGE = 'image',
  ICON = 'icon',
  MENU = 'menu',
  MENU_ITEM = 'menu_item',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DROPDOWN = 'dropdown',
  DIALOG = 'dialog',
  WINDOW = 'window',
  TAB = 'tab',
  SCROLLBAR = 'scrollbar',
  UNKNOWN = 'unknown',
}

/**
 * 屏幕元素 - 视觉分析识别出的可交互元素
 */
export interface ScreenElement {
  /** 元素唯一标识 */
  id: string;
  /** 元素类型 */
  type: ElementType;
  /** 边界框 */
  bounds: Rectangle;
  /** 中心点（点击位置） */
  center: Point;
  /** 文本内容（如果有） */
  text?: string;
  /** 描述信息 */
  description?: string;
  /** 是否可见 */
  visible: boolean;
  /** 是否可交互 */
  interactive: boolean;
  /** 置信度 0-1 */
  confidence: number;
  /** 额外属性 */
  attributes?: Record<string, unknown>;
}

/**
 * 屏幕分析结果
 */
export interface ScreenAnalysis {
  /** 分析ID */
  id: string;
  /** 截图路径 */
  screenshotPath: string;
  /** 屏幕尺寸 */
  screenSize: ScreenSize;
  /** 识别到的元素列表 */
  elements: ScreenElement[];
  /** 屏幕描述 */
  description: string;
  /** 活动窗口标题 */
  activeWindow?: string;
  /** 分析耗时 */
  analysisTime: number;
  /** 时间戳 */
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 输入控制类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 鼠标按键
 */
export enum MouseButton {
  LEFT = 'left',
  RIGHT = 'right',
  MIDDLE = 'middle',
}

/**
 * 鼠标操作类型
 */
export enum MouseAction {
  CLICK = 'click',
  DOUBLE_CLICK = 'double_click',
  RIGHT_CLICK = 'right_click',
  MOVE = 'move',
  DRAG = 'drag',
  SCROLL = 'scroll',
}

/**
 * 鼠标操作请求
 */
export interface MouseOperation {
  /** 操作类型 */
  action: MouseAction;
  /** 目标位置（MOVE, CLICK 等需要） */
  position?: Point;
  /** 起始位置（DRAG 需要） */
  startPosition?: Point;
  /** 鼠标按键 */
  button?: MouseButton;
  /** 滚动量（SCROLL 需要） */
  scrollAmount?: number;
  /** 滚动方向 */
  scrollDirection?: 'up' | 'down' | 'left' | 'right';
  /** 移动速度（像素/毫秒） */
  speed?: number;
}

/**
 * 键盘操作类型
 */
export enum KeyboardAction {
  TYPE = 'type',
  PRESS = 'press',
  HOTKEY = 'hotkey',
}

/**
 * 键盘操作请求
 */
export interface KeyboardOperation {
  /** 操作类型 */
  action: KeyboardAction;
  /** 要输入的文本（TYPE） */
  text?: string;
  /** 按键（PRESS） */
  key?: string;
  /** 快捷键组合（HOTKEY） */
  keys?: string[];
  /** 输入间隔（毫秒） */
  interval?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 任务规划类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 操作步骤状态
 */
export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

/**
 * 原子操作 - 最小执行单元
 */
export interface AtomicAction {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: 'mouse' | 'keyboard' | 'app' | 'file' | 'browser' | 'wait' | 'screenshot';
  /** 操作参数 */
  params: MouseOperation | KeyboardOperation | Record<string, unknown>;
  /** 预期结果描述 */
  expectedOutcome?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
}

/**
 * 任务步骤
 */
export interface TaskStep {
  /** 步骤ID */
  id: string;
  /** 步骤描述 */
  description: string;
  /** 原子操作序列 */
  actions: AtomicAction[];
  /** 当前状态 */
  status: StepStatus;
  /** 依赖的步骤ID */
  dependsOn?: string[];
  /** 失败时的处理策略 */
  onFailure: 'abort' | 'skip' | 'retry';
  /** 最大重试次数 */
  maxRetries?: number;
  /** 当前重试次数 */
  retries?: number;
  /** 执行结果 */
  result?: OperationResult;
  /** 开始时间 */
  startedAt?: number;
  /** 结束时间 */
  endedAt?: number;
}

/**
 * 任务计划
 */
export interface TaskPlan {
  /** 计划ID */
  id: string;
  /** 任务目标描述 */
  goal: string;
  /** 步骤序列 */
  steps: TaskStep[];
  /** 创建时间 */
  createdAt: number;
  /** 预计耗时（毫秒） */
  estimatedDuration?: number;
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high';
  /** 需要确认的步骤 */
  requiresConfirmation?: number[];
}

/**
 * 任务执行状态
 */
export interface TaskExecutionState {
  /** 任务ID */
  taskId: string;
  /** 计划 */
  plan: TaskPlan;
  /** 当前步骤索引 */
  currentStepIndex: number;
  /** 整体状态 */
  status: StepStatus;
  /** 执行日志 */
  logs: ExecutionLog[];
  /** 开始时间 */
  startedAt?: number;
  /** 结束时间 */
  endedAt?: number;
  /** 错误信息 */
  error?: AgentError;
}

/**
 * 执行日志条目
 */
export interface ExecutionLog {
  /** 时间戳 */
  timestamp: number;
  /** 步骤ID */
  stepId?: string;
  /** 操作ID */
  actionId?: string;
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** 消息 */
  message: string;
  /** 附加数据 */
  data?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// 应用和窗口类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 窗口信息
 */
export interface WindowInfo {
  /** 窗口ID */
  id: string | number;
  /** 窗口标题 */
  title: string;
  /** 所属应用名称 */
  appName: string;
  /** 窗口位置和大小 */
  bounds: Rectangle;
  /** 是否可见 */
  visible: boolean;
  /** 是否聚焦 */
  focused: boolean;
  /** 进程ID */
  processId?: number;
}

/**
 * 应用信息
 */
export interface AppInfo {
  /** 应用名称 */
  name: string;
  /** 应用路径 */
  path?: string;
  /** 是否正在运行 */
  running: boolean;
  /** 打开的窗口 */
  windows?: WindowInfo[];
  /** 图标路径 */
  iconPath?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 配置类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 代理配置
 */
export interface AgentConfig {
  /** 操作超时时间（毫秒） */
  operationTimeout: number;
  /** 截图保存目录 */
  screenshotDir: string;
  /** 是否保存操作截图 */
  saveScreenshots: boolean;
  /** 鼠标移动速度（像素/毫秒） */
  mouseSpeed: number;
  /** 键盘输入间隔（毫秒） */
  keyInputInterval: number;
  /** 默认重试次数 */
  defaultRetries: number;
  /** 是否启用安全检查 */
  enableSecurityCheck: boolean;
  /** 危险操作需要确认 */
  confirmDangerousOperations: boolean;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** 平台适配器 */
  platform: 'windows' | 'macos' | 'linux';
}

/**
 * 默认配置
 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  operationTimeout: 30000,
  screenshotDir: '/tmp/computer-agent/screenshots',
  saveScreenshots: true,
  mouseSpeed: 1000, // 1000 像素/秒
  keyInputInterval: 50,
  defaultRetries: 2,
  enableSecurityCheck: true,
  confirmDangerousOperations: true,
  logLevel: 'info',
  platform: process.platform === 'win32' ? 'windows' : 
            process.platform === 'darwin' ? 'macos' : 'linux',
};

// ═══════════════════════════════════════════════════════════════════════
// 事件类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 代理事件类型
 */
export enum AgentEventType {
  // 生命周期
  AGENT_STARTED = 'agent_started',
  AGENT_STOPPED = 'agent_stopped',
  
  // 任务相关
  TASK_RECEIVED = 'task_received',
  TASK_PLANNING = 'task_planning',
  TASK_PLANNED = 'task_planned',
  TASK_STARTED = 'task_started',
  TASK_STEP_STARTED = 'task_step_started',
  TASK_STEP_COMPLETED = 'task_step_completed',
  TASK_STEP_FAILED = 'task_step_failed',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  
  // 操作相关
  OPERATION_STARTED = 'operation_started',
  OPERATION_COMPLETED = 'operation_completed',
  OPERATION_FAILED = 'operation_failed',
  
  // 视觉相关
  SCREENSHOT_TAKEN = 'screenshot_taken',
  SCREEN_ANALYZED = 'screen_analyzed',
  
  // 安全相关
  SECURITY_CHECK_PASSED = 'security_check_passed',
  SECURITY_CHECK_FAILED = 'security_check_failed',
  CONFIRMATION_REQUIRED = 'confirmation_required',
}

/**
 * 代理事件
 */
export interface AgentEvent {
  /** 事件类型 */
  type: AgentEventType;
  /** 时间戳 */
  timestamp: number;
  /** 事件数据 */
  data?: unknown;
  /** 关联的任务ID */
  taskId?: string;
  /** 关联的步骤ID */
  stepId?: string;
}

/**
 * 事件监听器
 */
export type AgentEventListener = (event: AgentEvent) => void | Promise<void>;

// ═══════════════════════════════════════════════════════════════════════
// 接口定义（依赖倒置原则）
// ═══════════════════════════════════════════════════════════════════════

/**
 * 视觉系统接口
 */
export interface IVisionSystem {
  /** 截取屏幕 */
  captureScreen(region?: Rectangle): Promise<Result<string, AgentError>>;
  /** 分析屏幕内容 */
  analyzeScreen(screenshotPath: string): Promise<Result<ScreenAnalysis, AgentError>>;
  /** 查找元素 */
  findElement(
    description: string, 
    analysis: ScreenAnalysis
  ): Promise<Result<ScreenElement, AgentError>>;
}

/**
 * 输入控制器接口
 */
export interface IInputController {
  /** 执行鼠标操作 */
  executeMouse(operation: MouseOperation): Promise<Result<void, AgentError>>;
  /** 执行键盘操作 */
  executeKeyboard(operation: KeyboardOperation): Promise<Result<void, AgentError>>;
  /** 获取鼠标当前位置 */
  getMousePosition(): Promise<Result<Point, AgentError>>;
}

/**
 * 应用管理器接口
 */
export interface IAppManager {
  /** 启动应用 */
  launchApp(name: string, args?: string[]): Promise<Result<AppInfo, AgentError>>;
  /** 获取应用列表 */
  listApps(): Promise<Result<AppInfo[], AgentError>>;
  /** 获取窗口列表 */
  listWindows(): Promise<Result<WindowInfo[], AgentError>>;
  /** 聚焦窗口 */
  focusWindow(windowId: string | number): Promise<Result<void, AgentError>>;
  /** 关闭窗口 */
  closeWindow(windowId: string | number): Promise<Result<void, AgentError>>;
}

/**
 * 任务规划器接口
 */
export interface ITaskPlanner {
  /** 规划任务 */
  plan(goal: string, context?: ScreenAnalysis): Promise<Result<TaskPlan, AgentError>>;
  /** 重新规划（失败后） */
  replan(
    currentPlan: TaskPlan, 
    failedStep: TaskStep, 
    error: AgentError
  ): Promise<Result<TaskPlan, AgentError>>;
}

/**
 * 安全检查器接口
 */
export interface ISecurityChecker {
  /** 检查操作是否允许 */
  checkOperation(operation: AtomicAction): Promise<Result<boolean, AgentError>>;
  /** 是否需要用户确认 */
  requiresConfirmation(operation: AtomicAction): boolean;
  /** 获取确认消息 */
  getConfirmationMessage(operation: AtomicAction): string;
}

/**
 * 历史记录器接口
 */
export interface IHistoryLogger {
  /** 记录操作 */
  log(operation: AtomicAction, result: OperationResult): void;
  /** 获取历史记录 */
  getHistory(limit?: number): OperationRecord[];
  /** 回滚到指定点 */
  rollbackTo(recordId: string): Promise<Result<void, AgentError>>;
}

/**
 * 操作记录
 */
export interface OperationRecord {
  /** 记录ID */
  id: string;
  /** 操作 */
  operation: AtomicAction;
  /** 结果 */
  result: OperationResult;
  /** 时间戳 */
  timestamp: number;
  /** 是否可回滚 */
  reversible: boolean;
  /** 回滚操作 */
  rollbackOperation?: AtomicAction;
}

// ═══════════════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建成功结果
 */
export function success<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * 创建失败结果
 */
export function failure<E extends AgentError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * 创建代理错误
 */
export function createError(
  code: AgentErrorCode,
  message: string,
  options?: {
    details?: Record<string, unknown>;
    cause?: Error;
    recoveryHint?: string;
    retryable?: boolean;
  }
): AgentError {
  return {
    name: `AgentError[${code}]`,
    code,
    message,
    retryable: options?.retryable ?? isRetryable(code),
    details: options?.details,
    cause: options?.cause,
    recoveryHint: options?.recoveryHint,
  };
}

/**
 * 判断错误是否可重试
 */
function isRetryable(code: AgentErrorCode): boolean {
  const retryableCodes = [
    AgentErrorCode.TIMEOUT,
    AgentErrorCode.SCREENSHOT_FAILED,
    AgentErrorCode.VISION_ANALYSIS_FAILED,
    AgentErrorCode.MOUSE_MOVE_FAILED,
    AgentErrorCode.MOUSE_CLICK_FAILED,
    AgentErrorCode.KEYBOARD_INPUT_FAILED,
    AgentErrorCode.APP_LAUNCH_FAILED,
    AgentErrorCode.ELEMENT_NOT_FOUND,
  ];
  return retryableCodes.includes(code);
}

/**
 * 计算两点间距离
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * 计算矩形中心点
 */
export function centerOf(rect: Rectangle): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * 判断点是否在矩形内
 */
export function isInside(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
