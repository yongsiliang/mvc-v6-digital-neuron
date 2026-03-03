/**
 * ═══════════════════════════════════════════════════════════════════════
 * 桌面系统工具 - 本地系统能力
 * Desktop System Tools - Local System Capabilities
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ToolDefinition, ToolResult, ToolExecutor } from './tools';

// ═══════════════════════════════════════════════════════════════════════
// 常用应用映射表
// ═══════════════════════════════════════════════════════════════════════

export const APP_ALIASES: Record<string, { name: string; winPath?: string; macPath?: string }> = {
  // 通讯软件
  'wechat': { name: '微信', winPath: 'C:\\Program Files\\Tencent\\WeChat\\WeChat.exe' },
  'weixin': { name: '微信', winPath: 'C:\\Program Files\\Tencent\\WeChat\\WeChat.exe' },
  'qq': { name: 'QQ', winPath: 'C:\\Program Files\\Tencent\\QQ\\Bin\\QQScLauncher.exe' },
  
  // 网盘
  'baidunetdisk': { name: '百度网盘', winPath: 'C:\\Program Files\\baidu\\BaiduNetdisk\\BaiduNetdisk.exe' },
  
  // 开发工具
  'vscode': { name: 'VS Code', winPath: 'code' },
  'code': { name: 'VS Code', winPath: 'code' },
  
  // 浏览器
  'chrome': { name: 'Chrome', winPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  'edge': { name: 'Edge', winPath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
  
  // 常用工具
  'notepad': { name: '记事本', winPath: 'notepad.exe' },
  'calc': { name: '计算器', winPath: 'calc.exe' },
  'explorer': { name: '文件资源管理器', winPath: 'explorer.exe' },
};

// ═══════════════════════════════════════════════════════════════════════
// 检查 Tauri 环境
// ═══════════════════════════════════════════════════════════════════════

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// ═══════════════════════════════════════════════════════════════════════
// 桌面工具定义（空数组，工具已合并到 tools.ts）
// ═══════════════════════════════════════════════════════════════════════

export const DESKTOP_TOOLS: ToolDefinition[] = [];

// ═══════════════════════════════════════════════════════════════════════
// 创建桌面执行器（占位，实际执行在 API 层）
// ═══════════════════════════════════════════════════════════════════════

export function createDesktopExecutors(): Record<string, ToolExecutor> {
  return {};
}
