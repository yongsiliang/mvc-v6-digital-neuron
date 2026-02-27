/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent 工具定义
 * Computer Agent Tool Definitions
 * 
 * 定义电脑操作代理相关的工具
 * 类似 OpenAI Operator / Claude Computer Use
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ToolDefinition } from '../types';

// ─────────────────────────────────────────────────────────────────────
// 屏幕操作工具
// ─────────────────────────────────────────────────────────────────────

export const SCREEN_TOOLS: ToolDefinition[] = [
  {
    name: 'screen_capture',
    displayName: '截取屏幕',
    description: '截取当前屏幕内容，返回截图路径。可以截取全屏或指定区域。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '📸',
    parameters: [
      { name: 'region', type: 'object', description: '截图区域 {x, y, width, height}，不指定则全屏', required: false },
    ],
    examples: ['截取当前屏幕', '截图屏幕左上角区域'],
  },
  {
    name: 'screen_analyze',
    displayName: '分析屏幕',
    description: '使用 AI 分析当前屏幕内容，识别按钮、输入框、文本等元素。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '🔍',
    parameters: [
      { name: 'screenshot_path', type: 'string', description: '截图文件路径，不指定则自动截取', required: false },
      { name: 'focus_type', type: 'string', description: '关注的元素类型', required: false, enum: ['all', 'button', 'input', 'text', 'link', 'image'] },
    ],
    examples: ['分析当前屏幕有哪些按钮', '识别屏幕上的输入框'],
  },
  {
    name: 'screen_find_element',
    displayName: '查找屏幕元素',
    description: '在屏幕上查找指定的 UI 元素，返回元素位置和属性。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '🎯',
    parameters: [
      { name: 'description', type: 'string', description: '元素描述，如"登录按钮"、"搜索输入框"', required: true },
      { name: 'near_position', type: 'object', description: '预期位置附近 {x, y}', required: false },
    ],
    examples: ['找到"提交"按钮', '查找用户名输入框'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 鼠标操作工具
// ─────────────────────────────────────────────────────────────────────

export const MOUSE_TOOLS: ToolDefinition[] = [
  {
    name: 'mouse_move',
    displayName: '移动鼠标',
    description: '将鼠标移动到指定屏幕坐标。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '🖱️',
    parameters: [
      { name: 'x', type: 'number', description: 'X 坐标', required: true, min: 0 },
      { name: 'y', type: 'number', description: 'Y 坐标', required: true, min: 0 },
      { name: 'speed', type: 'number', description: '移动速度（像素/秒）', required: false, default: 1000 },
    ],
    examples: ['移动鼠标到屏幕中心', '移动鼠标到坐标 (500, 300)'],
  },
  {
    name: 'mouse_click',
    displayName: '鼠标点击',
    description: '在指定位置点击鼠标。支持左键、右键、双击。',
    category: 'screen',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '👆',
    parameters: [
      { name: 'x', type: 'number', description: 'X 坐标，不指定则点击当前位置', required: false },
      { name: 'y', type: 'number', description: 'Y 坐标', required: false },
      { name: 'button', type: 'string', description: '按键类型', required: false, default: 'left', enum: ['left', 'right', 'middle', 'double'] },
    ],
    examples: ['点击屏幕上的按钮', '右键点击', '双击打开'],
  },
  {
    name: 'mouse_drag',
    displayName: '鼠标拖拽',
    description: '从起点拖拽到终点。',
    category: 'screen',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '✋',
    parameters: [
      { name: 'from_x', type: 'number', description: '起点 X 坐标', required: true },
      { name: 'from_y', type: 'number', description: '起点 Y 坐标', required: true },
      { name: 'to_x', type: 'number', description: '终点 X 坐标', required: true },
      { name: 'to_y', type: 'number', description: '终点 Y 坐标', required: true },
    ],
    examples: ['拖拽文件到文件夹', '移动窗口'],
  },
  {
    name: 'mouse_scroll',
    displayName: '鼠标滚动',
    description: '滚动鼠标滚轮。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '📜',
    parameters: [
      { name: 'amount', type: 'number', description: '滚动量', required: false, default: 3 },
      { name: 'direction', type: 'string', description: '滚动方向', required: false, default: 'down', enum: ['up', 'down', 'left', 'right'] },
    ],
    examples: ['向下滚动 5 格', '向上滚动页面'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 键盘操作工具
// ─────────────────────────────────────────────────────────────────────

export const KEYBOARD_TOOLS: ToolDefinition[] = [
  {
    name: 'keyboard_type',
    displayName: '键盘输入',
    description: '模拟键盘输入文字。',
    category: 'screen',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '⌨️',
    parameters: [
      { name: 'text', type: 'string', description: '要输入的文字', required: true },
      { name: 'interval', type: 'number', description: '按键间隔（毫秒）', required: false, default: 50 },
    ],
    examples: ['输入用户名', '输入搜索关键词'],
  },
  {
    name: 'keyboard_press',
    displayName: '按下按键',
    description: '按下单个按键，如 Enter、Tab、Escape 等。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '🔲',
    parameters: [
      { name: 'key', type: 'string', description: '按键名称，如 enter, tab, escape, space', required: true },
    ],
    examples: ['按回车确认', '按 Tab 切换'],
  },
  {
    name: 'keyboard_hotkey',
    displayName: '执行快捷键',
    description: '执行组合快捷键，如 Ctrl+C、Cmd+V 等。',
    category: 'screen',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '⚡',
    parameters: [
      { name: 'keys', type: 'string', description: '快捷键，用 + 连接，如 "Ctrl+C"、"Cmd+V"', required: true },
    ],
    examples: ['复制 (Ctrl+C)', '粘贴 (Ctrl+V)', '保存 (Ctrl+S)'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 应用操作工具
// ─────────────────────────────────────────────────────────────────────

export const APPLICATION_TOOLS: ToolDefinition[] = [
  {
    name: 'app_launch',
    displayName: '启动应用',
    description: '启动指定的应用程序。',
    category: 'application',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 15000,
    icon: '🚀',
    parameters: [
      { name: 'name', type: 'string', description: '应用名称或路径', required: true },
      { name: 'args', type: 'array', description: '启动参数', required: false },
    ],
    examples: ['打开浏览器', '启动 VS Code', '打开计算器'],
  },
  {
    name: 'app_list',
    displayName: '列出应用',
    description: '列出正在运行的应用程序。',
    category: 'application',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '📋',
    parameters: [],
    examples: ['查看正在运行的应用', '列出所有打开的窗口'],
  },
  {
    name: 'app_list_windows',
    displayName: '列出窗口',
    description: '列出所有打开的窗口。',
    category: 'application',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '🪟',
    parameters: [],
    examples: ['查看所有打开的窗口'],
  },
  {
    name: 'app_focus_window',
    displayName: '聚焦窗口',
    description: '将指定窗口置于前台。',
    category: 'application',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '🎯',
    parameters: [
      { name: 'window_id', type: 'string', description: '窗口 ID 或标题', required: true },
    ],
    examples: ['切换到浏览器窗口', '聚焦到 VS Code'],
  },
  {
    name: 'app_close_window',
    displayName: '关闭窗口',
    description: '关闭指定的窗口。',
    category: 'application',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 5000,
    icon: '❌',
    parameters: [
      { name: 'window_id', type: 'string', description: '窗口 ID 或标题', required: true },
    ],
    examples: ['关闭当前窗口', '关闭浏览器标签页'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 浏览器自动化工具
// ─────────────────────────────────────────────────────────────────────

export const BROWSER_TOOLS: ToolDefinition[] = [
  {
    name: 'browser_navigate',
    displayName: '浏览器导航',
    description: '打开浏览器并导航到指定 URL。',
    category: 'web',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '🌐',
    parameters: [
      { name: 'url', type: 'url', description: '目标 URL', required: true },
    ],
    examples: ['打开百度', '访问 github.com'],
  },
  {
    name: 'browser_click',
    displayName: '浏览器点击',
    description: '在网页上点击指定元素。',
    category: 'web',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '👆',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS 选择器或元素描述', required: true },
    ],
    examples: ['点击登录按钮', '点击提交'],
  },
  {
    name: 'browser_type',
    displayName: '浏览器输入',
    description: '在网页输入框中输入文字。',
    category: 'web',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '⌨️',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS 选择器或元素描述', required: true },
      { name: 'text', type: 'string', description: '要输入的文字', required: true },
      { name: 'press_enter', type: 'boolean', description: '是否按回车', required: false, default: false },
    ],
    examples: ['在搜索框输入关键词', '填写用户名'],
  },
  {
    name: 'browser_screenshot',
    displayName: '浏览器截图',
    description: '截取当前网页的截图。',
    category: 'web',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '📸',
    parameters: [
      { name: 'full_page', type: 'boolean', description: '是否截取完整页面', required: false, default: false },
    ],
    examples: ['截取网页截图', '截取整页'],
  },
  {
    name: 'browser_evaluate',
    displayName: '执行脚本',
    description: '在网页中执行 JavaScript 代码。',
    category: 'web',
    dangerLevel: 'dangerous',
    requiresConfirmation: true,
    timeout: 10000,
    icon: '🔧',
    parameters: [
      { name: 'script', type: 'string', description: 'JavaScript 代码', required: true },
    ],
    examples: ['获取页面标题', '提取页面文本'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 复合任务工具
// ─────────────────────────────────────────────────────────────────────

export const AUTOMATION_TOOLS: ToolDefinition[] = [
  {
    name: 'automation_execute',
    displayName: '执行自动化任务',
    description: '执行一个由多个步骤组成的自动化任务。AI 会自动规划和执行。',
    category: 'automation',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 120000,
    icon: '🤖',
    parameters: [
      { name: 'goal', type: 'string', description: '任务目标描述', required: true },
      { name: 'max_steps', type: 'number', description: '最大执行步骤数', required: false, default: 20 },
    ],
    examples: ['打开浏览器搜索今天的新闻', '创建一个新的项目文件夹并初始化'],
  },
  {
    name: 'automation_status',
    displayName: '任务状态',
    description: '获取当前正在执行的自动化任务的状态。',
    category: 'automation',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '📊',
    parameters: [],
    examples: ['查看任务执行状态'],
  },
  {
    name: 'automation_stop',
    displayName: '停止任务',
    description: '停止当前正在执行的自动化任务。',
    category: 'automation',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '⏹️',
    parameters: [],
    examples: ['停止当前任务'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 导出所有 Computer Agent 工具
// ─────────────────────────────────────────────────────────────────────

export const COMPUTER_AGENT_TOOLS: ToolDefinition[] = [
  ...SCREEN_TOOLS,
  ...MOUSE_TOOLS,
  ...KEYBOARD_TOOLS,
  ...APPLICATION_TOOLS,
  ...BROWSER_TOOLS,
  ...AUTOMATION_TOOLS,
];
