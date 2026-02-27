/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 常量配置
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { AgentConfig } from './types';

/**
 * 平台相关常量
 */
export const PLATFORM_COMMANDS = {
  windows: {
    screenshot: 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds"',
    mouseMove: (x: number, y: number) => 
      `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x},${y})"`,
    mouseClick: (button: 'left' | 'right' | 'middle') =>
      `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${button === 'right' ? '{RIGHT}' : '{ENTER}'}')"`,
    keyboardType: (text: string) => 
      `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"${text.replace(/"/g, '""')}\\")"`,
    listApps: 'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle} | ConvertTo-Json"',
    launchApp: (name: string) => `start "" "${name}"`,
  },
  macos: {
    screenshot: 'screencapture -x',
    mouseMove: (x: number, y: number) => 
      `cliclick m:${x},${y}`,
    mouseClick: (x: number, y: number, button: 'left' | 'right' | 'middle') =>
      `cliclick ${button === 'right' ? 'rc' : 'c'}:${x},${y}`,
    keyboardType: (text: string) => 
      `osascript -e 'tell application "System Events" to keystroke "${text.replace(/"/g, '\\"')}"'`,
    listApps: 'osascript -e \'tell application "System Events" to get name of every process whose visible is true\'',
    launchApp: (name: string) => `open -a "${name}"`,
  },
  linux: {
    screenshot: 'scrot',
    mouseMove: (x: number, y: number) => 
      `xdotool mousemove ${x} ${y}`,
    mouseClick: (button: 'left' | 'right' | 'middle') => {
      const btn = button === 'left' ? 1 : button === 'right' ? 3 : 2;
      return `xdotool click ${btn}`;
    },
    keyboardType: (text: string) => 
      `xdotool type "${text}"`,
    listApps: 'wmctrl -l',
    launchApp: (name: string) => `${name} &`,
  },
} as const;

/**
 * 快捷键映射
 */
export const HOTKEY_MAPPINGS: Record<string, string[]> = {
  // 通用快捷键
  'copy': ['Ctrl', 'C'],
  'paste': ['Ctrl', 'V'],
  'cut': ['Ctrl', 'X'],
  'undo': ['Ctrl', 'Z'],
  'redo': ['Ctrl', 'Y'],
  'selectAll': ['Ctrl', 'A'],
  'save': ['Ctrl', 'S'],
  'find': ['Ctrl', 'F'],
  'close': ['Ctrl', 'W'],
  'new': ['Ctrl', 'N'],
  
  // macOS 特有
  'copy_mac': ['Cmd', 'C'],
  'paste_mac': ['Cmd', 'V'],
  'cut_mac': ['Cmd', 'X'],
  'undo_mac': ['Cmd', 'Z'],
  'redo_mac': ['Cmd', 'Shift', 'Z'],
  'selectAll_mac': ['Cmd', 'A'],
  'save_mac': ['Cmd', 'S'],
  'find_mac': ['Cmd', 'F'],
  'close_mac': ['Cmd', 'W'],
  'new_mac': ['Cmd', 'N'],
  'screenshot_mac': ['Cmd', 'Shift', '4'],
  
  // 系统快捷键
  'switchWindow': ['Alt', 'Tab'],
  'taskManager': ['Ctrl', 'Shift', 'Escape'],
  'lockScreen': ['Win', 'L'],
  'runDialog': ['Win', 'R'],
  'explorer': ['Win', 'E'],
  
  // 浏览器快捷键
  'newTab': ['Ctrl', 'T'],
  'closeTab': ['Ctrl', 'W'],
  'nextTab': ['Ctrl', 'Tab'],
  'prevTab': ['Ctrl', 'Shift', 'Tab'],
  'refresh': ['F5'],
  'hardRefresh': ['Ctrl', 'F5'],
  'goBack': ['Alt', 'Left'],
  'goForward': ['Alt', 'Right'],
  'addressBar': ['Ctrl', 'L'],
  'findPage': ['Ctrl', 'F'],
};

/**
 * 常用应用名称映射
 */
export const APP_NAME_MAPPINGS: Record<string, { windows: string; macos: string; linux: string }> = {
  'chrome': { windows: 'Google Chrome', macos: 'Google Chrome', linux: 'google-chrome' },
  'firefox': { windows: 'Firefox', macos: 'Firefox', linux: 'firefox' },
  'edge': { windows: 'Microsoft Edge', macos: 'Microsoft Edge', linux: 'microsoft-edge' },
  'safari': { windows: '', macos: 'Safari', linux: '' },
  'wechat': { windows: 'WeChat', macos: 'WeChat', linux: '' },
  'qq': { windows: 'QQ', macos: 'QQ', linux: '' },
  'vscode': { windows: 'Code', macos: 'Visual Studio Code', linux: 'code' },
  'terminal': { windows: 'Windows Terminal', macos: 'Terminal', linux: 'gnome-terminal' },
  'explorer': { windows: 'explorer', macos: 'Finder', linux: 'nautilus' },
  'notepad': { windows: 'notepad', macos: 'TextEdit', linux: 'gedit' },
  'calculator': { windows: 'calc', macos: 'Calculator', linux: 'gnome-calculator' },
  'settings': { windows: 'ms-settings:', macos: 'System Preferences', linux: 'gnome-control-center' },
};

/**
 * 危险操作列表
 */
export const DANGEROUS_OPERATIONS = {
  // 文件操作
  fileDelete: ['delete', 'remove', 'rm'],
  fileMove: ['move', 'mv', 'rename'],
  fileOverwrite: ['overwrite', 'replace'],
  
  // 系统操作
  systemShutdown: ['shutdown', 'poweroff', 'restart', 'reboot'],
  systemConfig: ['modify registry', 'change system settings'],
  
  // 数据操作
  dataClear: ['clear', 'reset', 'factory reset'],
  dataSend: ['send', 'upload', 'sync'],
  
  // 应用操作
  appUninstall: ['uninstall', 'remove app'],
  appInstall: ['install', 'download and install'],
} as const;

/**
 * 最大重试次数
 */
export const MAX_RETRIES = {
  operation: 3,
  step: 2,
  task: 1,
} as const;

/**
 * 超时时间（毫秒）
 */
export const TIMEOUTS = {
  screenshot: 10000,
  visionAnalysis: 30000,
  mouseOperation: 5000,
  keyboardOperation: 10000,
  appLaunch: 15000,
  windowSwitch: 3000,
  pageLoad: 30000,
  stepExecution: 60000,
  taskExecution: 300000, // 5 分钟
} as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AgentConfig = {
  operationTimeout: TIMEOUTS.stepExecution,
  screenshotDir: '/tmp/computer-agent/screenshots',
  saveScreenshots: true,
  mouseSpeed: 1000,
  keyInputInterval: 50,
  defaultRetries: MAX_RETRIES.operation,
  enableSecurityCheck: true,
  confirmDangerousOperations: true,
  logLevel: 'info',
  platform: process.platform === 'win32' ? 'windows' : 
            process.platform === 'darwin' ? 'macos' : 'linux',
};

/**
 * 安全策略
 */
export const SECURITY_POLICY = {
  // 允许的目录
  allowedPaths: [
    '/tmp',
    '/home',
    process.env.HOME || '~',
  ],
  // 禁止的目录
  blockedPaths: [
    '/etc',
    '/root',
    '/.ssh',
    '/var/log',
    'C:\\Windows\\System32',
    'C:\\Program Files',
  ],
  // 允许的应用
  allowedApps: [
    'chrome',
    'firefox',
    'edge',
    'safari',
    'vscode',
    'terminal',
    'notepad',
    'calculator',
  ],
  // 需要确认的操作
  requiresConfirmation: [
    'fileDelete',
    'fileMove',
    'systemShutdown',
    'dataClear',
    'appUninstall',
  ],
} as const;
