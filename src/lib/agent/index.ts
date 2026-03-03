/**
 * 本地 Agent 服务
 * 调用 Tauri 后端的截图、鼠标、键盘控制命令
 */

// 检测是否在 Tauri 环境
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// 动态导入 Tauri API
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error('不在 Tauri 环境中');
  }
  // Tauri v2 API
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(cmd, args);
}

// ============ 类型定义 ============

export interface ScreenshotResult {
  success: boolean;
  base64: string | null;
  width: number | null;
  height: number | null;
  error: string | null;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface OperationResult {
  success: boolean;
  message: string;
}

// ============ 截图 ============

/**
 * 截取屏幕
 */
export async function screenshot(): Promise<ScreenshotResult> {
  return invoke<ScreenshotResult>('screenshot');
}

// ============ 鼠标控制 ============

/**
 * 移动鼠标
 */
export async function mouseMove(x: number, y: number): Promise<OperationResult> {
  return invoke<OperationResult>('mouse_move', { x, y });
}

/**
 * 鼠标点击
 * @param button - 'left' | 'right' | 'middle'
 */
export async function mouseClick(button: 'left' | 'right' | 'middle' = 'left'): Promise<OperationResult> {
  return invoke<OperationResult>('mouse_click', { button });
}

/**
 * 鼠标双击
 */
export async function mouseDoubleClick(button: 'left' | 'right' | 'middle' = 'left'): Promise<OperationResult> {
  return invoke<OperationResult>('mouse_double_click', { button });
}

/**
 * 鼠标滚动
 * @param amount - 正数向上，负数向下
 */
export async function mouseScroll(amount: number): Promise<OperationResult> {
  return invoke<OperationResult>('mouse_scroll', { amount });
}

/**
 * 获取鼠标位置
 */
export async function getMousePosition(): Promise<MousePosition> {
  return invoke<MousePosition>('mouse_position');
}

// ============ 键盘控制 ============

/**
 * 输入文本
 */
export async function keyboardType(text: string): Promise<OperationResult> {
  return invoke<OperationResult>('keyboard_type', { text });
}

/**
 * 按下按键
 * 支持单字符、特殊键、组合键（如 'ctrl+c'）
 */
export async function keyboardPress(key: string): Promise<OperationResult> {
  return invoke<OperationResult>('keyboard_press', { key });
}

/**
 * 按下按键（不释放）
 */
export async function keyboardKeyDown(key: string): Promise<OperationResult> {
  return invoke<OperationResult>('keyboard_key_down', { key });
}

/**
 * 释放按键
 */
export async function keyboardKeyUp(key: string): Promise<OperationResult> {
  return invoke<OperationResult>('keyboard_key_up', { key });
}

// ============ 高级操作 ============

/**
 * 点击指定位置
 */
export async function clickAt(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): Promise<OperationResult[]> {
  const results: OperationResult[] = [];
  results.push(await mouseMove(x, y));
  results.push(await mouseClick(button));
  return results;
}

/**
 * 双击指定位置
 */
export async function doubleClickAt(x: number, y: number): Promise<OperationResult[]> {
  const results: OperationResult[] = [];
  results.push(await mouseMove(x, y));
  results.push(await mouseDoubleClick('left'));
  return results;
}

/**
 * 输入文本并回车
 */
export async function typeAndEnter(text: string): Promise<OperationResult[]> {
  const results: OperationResult[] = [];
  results.push(await keyboardType(text));
  results.push(await keyboardPress('enter'));
  return results;
}

/**
 * 复制操作 (Ctrl+C)
 */
export async function copy(): Promise<OperationResult> {
  return keyboardPress('ctrl+c');
}

/**
 * 粘贴操作 (Ctrl+V)
 */
export async function paste(): Promise<OperationResult> {
  return keyboardPress('ctrl+v');
}

/**
 * 全选操作 (Ctrl+A)
 */
export async function selectAll(): Promise<OperationResult> {
  return keyboardPress('ctrl+a');
}

/**
 * 撤销操作 (Ctrl+Z)
 */
export async function undo(): Promise<OperationResult> {
  return keyboardPress('ctrl+z');
}

/**
 * 截图并返回 base64 数据 URL
 */
export async function screenshotAsDataUrl(): Promise<string | null> {
  const result = await screenshot();
  if (result.success && result.base64) {
    return `data:image/png;base64,${result.base64}`;
  }
  return null;
}
