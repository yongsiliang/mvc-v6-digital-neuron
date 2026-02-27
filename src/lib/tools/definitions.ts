/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具定义
 * Tool Definitions
 * 
 * 定义所有可用的工具及其参数、权限级别
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ToolDefinition, ToolCategory } from './types';

// 导入 Computer Agent 工具
import { COMPUTER_AGENT_TOOLS } from './definitions/computer-agent';

// ─────────────────────────────────────────────────────────────────────
// 文件系统工具
// ─────────────────────────────────────────────────────────────────────

export const FILESYSTEM_TOOLS: ToolDefinition[] = [
  // ─── 读操作 ───
  {
    name: 'fs_read_file',
    displayName: '读取文件',
    description: '读取文件内容。支持文本文件、JSON、Markdown、代码文件等。大文件会自动截断。',
    category: 'filesystem',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '📄',
    parameters: [
      { name: 'path', type: 'file_path', description: '文件路径（绝对路径或相对路径）', required: true },
      { name: 'encoding', type: 'string', description: '文件编码', required: false, default: 'utf-8', enum: ['utf-8', 'utf-16', 'ascii', 'binary'] },
      { name: 'start_line', type: 'number', description: '起始行号（从1开始）', required: false, default: 1, min: 1 },
      { name: 'end_line', type: 'number', description: '结束行号', required: false },
      { name: 'max_lines', type: 'number', description: '最大读取行数', required: false, default: 500, max: 2000 },
    ],
    examples: ['读取 /home/user/document.txt', '查看 package.json 文件内容'],
  },
  {
    name: 'fs_list_directory',
    displayName: '列出目录',
    description: '列出目录中的文件和子目录。支持过滤和排序。',
    category: 'filesystem',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '📁',
    parameters: [
      { name: 'path', type: 'file_path', description: '目录路径', required: true },
      { name: 'pattern', type: 'string', description: '文件名匹配模式（支持通配符 * 和 ?）', required: false },
      { name: 'recursive', type: 'boolean', description: '是否递归列出子目录', required: false, default: false },
      { name: 'include_hidden', type: 'boolean', description: '是否包含隐藏文件', required: false, default: false },
      { name: 'sort_by', type: 'string', description: '排序方式', required: false, default: 'name', enum: ['name', 'size', 'modified', 'type'] },
    ],
    examples: ['列出下载文件夹的内容', '查找所有 .jpg 文件'],
  },
  {
    name: 'fs_search',
    displayName: '搜索文件',
    description: '在指定目录中搜索文件名或文件内容。支持正则表达式和通配符。',
    category: 'filesystem',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '🔍',
    parameters: [
      { name: 'path', type: 'file_path', description: '搜索起始目录', required: true },
      { name: 'query', type: 'string', description: '搜索关键词或模式', required: true },
      { name: 'search_type', type: 'string', description: '搜索类型：文件名还是内容', required: false, default: 'name', enum: ['name', 'content', 'both'] },
      { name: 'file_pattern', type: 'string', description: '限定文件类型（如 *.txt, *.js）', required: false },
      { name: 'max_results', type: 'number', description: '最大结果数', required: false, default: 50, max: 200 },
    ],
    examples: ['搜索包含 "TODO" 的代码文件', '查找所有图片文件'],
  },
  {
    name: 'fs_get_info',
    displayName: '获取文件信息',
    description: '获取文件的详细信息：大小、创建时间、修改时间、权限等。',
    category: 'filesystem',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: 'ℹ️',
    parameters: [
      { name: 'path', type: 'file_path', description: '文件或目录路径', required: true },
    ],
    examples: ['查看文件大小', '获取目录信息'],
  },

  // ─── 写操作 ───
  {
    name: 'fs_write_file',
    displayName: '写入文件',
    description: '创建或覆盖写入文件内容。谨慎使用，会覆盖已有文件。',
    category: 'filesystem',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 30000,
    icon: '✏️',
    parameters: [
      { name: 'path', type: 'file_path', description: '文件路径', required: true },
      { name: 'content', type: 'string', description: '文件内容', required: true },
      { name: 'encoding', type: 'string', description: '文件编码', required: false, default: 'utf-8' },
      { name: 'create_dirs', type: 'boolean', description: '是否自动创建父目录', required: false, default: true },
      { name: 'backup', type: 'boolean', description: '是否备份已有文件', required: false, default: true },
    ],
    examples: ['创建一个新的 Markdown 文件', '保存代码到文件'],
  },
  {
    name: 'fs_append_file',
    displayName: '追加文件',
    description: '在文件末尾追加内容。如果文件不存在则创建。',
    category: 'filesystem',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '📝',
    parameters: [
      { name: 'path', type: 'file_path', description: '文件路径', required: true },
      { name: 'content', type: 'string', description: '要追加的内容', required: true },
    ],
    examples: ['追加日志', '在文件末尾添加内容'],
  },
  {
    name: 'fs_create_directory',
    displayName: '创建目录',
    description: '创建新目录。支持递归创建多级目录。',
    category: 'filesystem',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '📂',
    parameters: [
      { name: 'path', type: 'file_path', description: '目录路径', required: true },
      { name: 'recursive', type: 'boolean', description: '是否递归创建父目录', required: false, default: true },
    ],
    examples: ['创建项目目录', '新建文件夹'],
  },
  {
    name: 'fs_copy',
    displayName: '复制文件',
    description: '复制文件或目录到目标位置。',
    category: 'filesystem',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 60000,
    icon: '📋',
    parameters: [
      { name: 'source', type: 'file_path', description: '源文件路径', required: true },
      { name: 'destination', type: 'file_path', description: '目标路径', required: true },
      { name: 'overwrite', type: 'boolean', description: '是否覆盖已存在的文件', required: false, default: false },
    ],
    examples: ['备份文件', '复制图片到新文件夹'],
  },
  {
    name: 'fs_move',
    displayName: '移动文件',
    description: '移动或重命名文件或目录。',
    category: 'filesystem',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 30000,
    icon: '📦',
    parameters: [
      { name: 'source', type: 'file_path', description: '源路径', required: true },
      { name: 'destination', type: 'file_path', description: '目标路径', required: true },
      { name: 'overwrite', type: 'boolean', description: '是否覆盖已存在的文件', required: false, default: false },
    ],
    examples: ['移动下载的文件', '重命名文件'],
  },
  {
    name: 'fs_delete',
    displayName: '删除文件',
    description: '删除文件或目录。危险操作，需要用户确认。',
    category: 'filesystem',
    dangerLevel: 'dangerous',
    requiresConfirmation: true,
    timeout: 30000,
    icon: '🗑️',
    parameters: [
      { name: 'path', type: 'file_path', description: '要删除的文件或目录路径', required: true },
      { name: 'recursive', type: 'boolean', description: '是否递归删除目录内容', required: false, default: false },
      { name: 'trash', type: 'boolean', description: '是否移到回收站而非永久删除', required: false, default: true },
    ],
    examples: ['删除临时文件', '清理旧日志'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 系统工具
// ─────────────────────────────────────────────────────────────────────

export const SYSTEM_TOOLS: ToolDefinition[] = [
  {
    name: 'sys_info',
    displayName: '系统信息',
    description: '获取系统基本信息：操作系统、CPU、内存、磁盘使用情况等。',
    category: 'system',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '💻',
    parameters: [
      { name: 'detail', type: 'string', description: '信息详细程度', required: false, default: 'basic', enum: ['basic', 'full'] },
    ],
    examples: ['查看系统配置', '检查磁盘空间'],
  },
  {
    name: 'sys_processes',
    displayName: '进程列表',
    description: '列出正在运行的进程。可以按名称、CPU或内存使用排序。',
    category: 'system',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '⚡',
    parameters: [
      { name: 'filter', type: 'string', description: '进程名称过滤', required: false },
      { name: 'sort_by', type: 'string', description: '排序方式', required: false, default: 'cpu', enum: ['cpu', 'memory', 'name', 'pid'] },
      { name: 'limit', type: 'number', description: '返回数量限制', required: false, default: 20, max: 100 },
    ],
    examples: ['查看占用CPU最多的进程', '查找运行的Node.js进程'],
  },
  {
    name: 'sys_env',
    displayName: '环境变量',
    description: '获取或设置环境变量。',
    category: 'system',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 5000,
    icon: '🔧',
    parameters: [
      { name: 'action', type: 'string', description: '操作类型', required: true, enum: ['get', 'set', 'list'] },
      { name: 'name', type: 'string', description: '变量名', required: false },
      { name: 'value', type: 'string', description: '变量值（仅set操作需要）', required: false },
    ],
    examples: ['查看PATH环境变量', '列出所有环境变量'],
  },
  {
    name: 'sys_execute',
    displayName: '执行命令',
    description: '在终端执行命令。危险操作，仅限安全命令白名单。',
    category: 'system',
    dangerLevel: 'dangerous',
    requiresConfirmation: true,
    timeout: 60000,
    icon: '🖥️',
    parameters: [
      { name: 'command', type: 'string', description: '要执行的命令', required: true },
      { name: 'args', type: 'array', description: '命令参数', required: false },
      { name: 'cwd', type: 'file_path', description: '工作目录', required: false },
      { name: 'timeout', type: 'number', description: '超时时间(秒)', required: false, default: 30, max: 300 },
    ],
    examples: ['运行 git status', '执行 npm install'],
  },
  {
    name: 'sys_notify',
    displayName: '系统通知',
    description: '发送系统桌面通知。',
    category: 'system',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '🔔',
    parameters: [
      { name: 'title', type: 'string', description: '通知标题', required: true },
      { name: 'message', type: 'string', description: '通知内容', required: true },
      { name: 'sound', type: 'boolean', description: '是否播放声音', required: false, default: true },
    ],
    examples: ['发送提醒通知', '任务完成通知'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 代码执行工具
// ─────────────────────────────────────────────────────────────────────

export const CODE_TOOLS: ToolDefinition[] = [
  {
    name: 'code_run_python',
    displayName: '运行Python',
    description: '执行Python代码。在沙箱环境中运行，支持常用库。',
    category: 'code',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 60000,
    icon: '🐍',
    parameters: [
      { name: 'code', type: 'string', description: 'Python代码', required: true },
      { name: 'packages', type: 'array', description: '需要安装的依赖包', required: false },
    ],
    examples: ['计算数学表达式', '处理数据并生成图表'],
  },
  {
    name: 'code_run_javascript',
    displayName: '运行JavaScript',
    description: '执行JavaScript/TypeScript代码。',
    category: 'code',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '📜',
    parameters: [
      { name: 'code', type: 'string', description: 'JavaScript代码', required: true },
      { name: 'typescript', type: 'boolean', description: '是否为TypeScript', required: false, default: false },
    ],
    examples: ['执行数据处理脚本', '验证JSON格式'],
  },
  {
    name: 'code_run_shell',
    displayName: '运行Shell脚本',
    description: '执行Shell脚本。危险操作，需要用户确认。',
    category: 'code',
    dangerLevel: 'dangerous',
    requiresConfirmation: true,
    timeout: 60000,
    icon: '🐚',
    parameters: [
      { name: 'script', type: 'string', description: 'Shell脚本内容', required: true },
      { name: 'interpreter', type: 'string', description: '解释器', required: false, default: 'bash', enum: ['bash', 'sh', 'zsh'] },
    ],
    examples: ['批量重命名文件', '自动化部署脚本'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 网络工具
// ─────────────────────────────────────────────────────────────────────

export const WEB_TOOLS: ToolDefinition[] = [
  {
    name: 'web_open',
    displayName: '打开网页',
    description: '在默认浏览器中打开指定网页。',
    category: 'web',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '🌐',
    parameters: [
      { name: 'url', type: 'url', description: '网页URL', required: true },
      { name: 'browser', type: 'string', description: '指定浏览器（可选）', required: false },
    ],
    examples: ['打开百度', '打开GitHub'],
  },
  {
    name: 'web_fetch',
    displayName: '获取网页',
    description: '获取网页内容并解析为文本。',
    category: 'web',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '🌐',
    parameters: [
      { name: 'url', type: 'url', description: '网页URL', required: true },
      { name: 'selector', type: 'string', description: 'CSS选择器，提取特定内容', required: false },
      { name: 'format', type: 'string', description: '输出格式', required: false, default: 'text', enum: ['text', 'html', 'markdown', 'json'] },
    ],
    examples: ['获取新闻页面内容', '解析网页标题'],
  },
  {
    name: 'web_search',
    displayName: '网络搜索',
    description: '在互联网上搜索信息。',
    category: 'web',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 15000,
    icon: '🔎',
    parameters: [
      { name: 'query', type: 'string', description: '搜索关键词', required: true },
      { name: 'num_results', type: 'number', description: '返回结果数量', required: false, default: 5, max: 20 },
    ],
    examples: ['搜索最新科技新闻', '查找Python教程'],
  },
  {
    name: 'web_download',
    displayName: '下载文件',
    description: '从URL下载文件到指定目录。',
    category: 'web',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 300000,
    icon: '⬇️',
    parameters: [
      { name: 'url', type: 'url', description: '文件URL', required: true },
      { name: 'destination', type: 'file_path', description: '保存路径', required: true },
      { name: 'filename', type: 'string', description: '文件名（不指定则自动提取）', required: false },
    ],
    examples: ['下载图片文件', '下载压缩包'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 屏幕操作工具
// ─────────────────────────────────────────────────────────────────────

export const SCREEN_TOOLS: ToolDefinition[] = [
  {
    name: 'screen_capture',
    displayName: '截屏',
    description: '截取屏幕或指定窗口的截图。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '📸',
    parameters: [
      { name: 'region', type: 'string', description: '截屏区域：全屏/当前窗口/指定区域', required: false, default: 'fullscreen', enum: ['fullscreen', 'window', 'region'] },
      { name: 'window', type: 'string', description: '窗口名称（当region为window时）', required: false },
      { name: 'x', type: 'number', description: '区域起始X坐标', required: false },
      { name: 'y', type: 'number', description: '区域起始Y坐标', required: false },
      { name: 'width', type: 'number', description: '区域宽度', required: false },
      { name: 'height', type: 'number', description: '区域高度', required: false },
    ],
    examples: ['截取全屏', '截取浏览器窗口'],
  },
  {
    name: 'screen_analyze',
    displayName: '分析屏幕',
    description: '使用AI分析屏幕内容，识别文字、界面元素等。',
    category: 'screen',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 30000,
    icon: '👁️',
    parameters: [
      { name: 'screenshot_id', type: 'string', description: '截图ID（不指定则实时截取）', required: false },
      { name: 'task', type: 'string', description: '分析任务', required: false, default: 'describe', enum: ['describe', 'ocr', 'find_element', 'count'] },
      { name: 'target', type: 'string', description: '查找目标（当task为find_element时）', required: false },
    ],
    examples: ['识别屏幕上的文字', '找到登录按钮位置'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 应用控制工具
// ─────────────────────────────────────────────────────────────────────

export const APPLICATION_TOOLS: ToolDefinition[] = [
  {
    name: 'app_launch',
    displayName: '启动应用',
    description: '启动指定的应用程序。',
    category: 'application',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 10000,
    icon: '🚀',
    parameters: [
      { name: 'name', type: 'string', description: '应用名称或路径', required: true },
      { name: 'args', type: 'array', description: '启动参数', required: false },
    ],
    examples: ['打开记事本', '启动VS Code'],
  },
  {
    name: 'app_list',
    displayName: '应用列表',
    description: '列出已安装的应用程序。',
    category: 'application',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 10000,
    icon: '📱',
    parameters: [
      { name: 'filter', type: 'string', description: '应用名称过滤', required: false },
    ],
    examples: ['查找已安装的浏览器', '列出所有开发工具'],
  },
  {
    name: 'app_window_list',
    displayName: '窗口列表',
    description: '列出当前打开的窗口。',
    category: 'application',
    dangerLevel: 'safe',
    requiresConfirmation: false,
    timeout: 5000,
    icon: '🪟',
    parameters: [],
    examples: ['查看打开的窗口', '找到浏览器窗口'],
  },
  {
    name: 'app_window_focus',
    displayName: '切换窗口',
    description: '将指定窗口置于前台。',
    category: 'application',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 3000,
    icon: '🎯',
    parameters: [
      { name: 'window_title', type: 'string', description: '窗口标题（支持模糊匹配）', required: true },
    ],
    examples: ['切换到浏览器', '聚焦到VS Code'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 自动化工具
// ─────────────────────────────────────────────────────────────────────

export const AUTOMATION_TOOLS: ToolDefinition[] = [
  {
    name: 'auto_type',
    displayName: '键盘输入',
    description: '模拟键盘输入文字。',
    category: 'automation',
    dangerLevel: 'moderate',
    requiresConfirmation: true,
    timeout: 30000,
    icon: '⌨️',
    parameters: [
      { name: 'text', type: 'string', description: '要输入的文字', required: true },
      { name: 'delay', type: 'number', description: '每个字符间隔(毫秒)', required: false, default: 50 },
    ],
    examples: ['输入文字到当前窗口', '填写表单'],
  },
  {
    name: 'auto_click',
    displayName: '鼠标点击',
    description: '模拟鼠标点击。',
    category: 'automation',
    dangerLevel: 'dangerous',
    requiresConfirmation: true,
    timeout: 5000,
    icon: '🖱️',
    parameters: [
      { name: 'x', type: 'number', description: 'X坐标', required: false },
      { name: 'y', type: 'number', description: 'Y坐标', required: false },
      { name: 'element', type: 'string', description: '元素描述（AI定位）', required: false },
      { name: 'button', type: 'string', description: '鼠标按钮', required: false, default: 'left', enum: ['left', 'right', 'middle'] },
      { name: 'double', type: 'boolean', description: '是否双击', required: false, default: false },
    ],
    examples: ['点击指定位置', '双击打开文件'],
  },
  {
    name: 'auto_hotkey',
    displayName: '快捷键',
    description: '模拟按下快捷键组合。',
    category: 'automation',
    dangerLevel: 'moderate',
    requiresConfirmation: false,
    timeout: 3000,
    icon: '🎹',
    parameters: [
      { name: 'keys', type: 'string', description: '快捷键组合（如 Ctrl+C, Alt+Tab）', required: true },
    ],
    examples: ['复制选中内容', '切换窗口'],
  },
  {
    name: 'auto_script',
    displayName: '自动化脚本',
    description: '执行一系列自动化操作。支持条件判断和循环。',
    category: 'automation',
    dangerLevel: 'dangerous',
    requiresConfirmation: true,
    timeout: 120000,
    icon: '🤖',
    parameters: [
      { name: 'script', type: 'string', description: '脚本内容（YAML格式）', required: true },
      { name: 'variables', type: 'object', description: '脚本变量', required: false },
    ],
    examples: ['自动化数据录入', '批量处理文件'],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 工具注册表
// ─────────────────────────────────────────────────────────────────────

/**
 * 所有工具定义的集合
 */
export const ALL_TOOLS: ToolDefinition[] = [
  ...FILESYSTEM_TOOLS,
  ...SYSTEM_TOOLS,
  ...CODE_TOOLS,
  ...WEB_TOOLS,
  ...SCREEN_TOOLS,
  ...APPLICATION_TOOLS,
  ...AUTOMATION_TOOLS,
  ...COMPUTER_AGENT_TOOLS,
];

/**
 * 工具名称到定义的映射
 */
export const TOOL_REGISTRY: Map<string, ToolDefinition> = new Map(
  ALL_TOOLS.map(tool => [tool.name, tool])
);

/**
 * 按类别分组的工具
 */
export const TOOLS_BY_CATEGORY: Record<ToolCategory, ToolDefinition[]> = {
  filesystem: FILESYSTEM_TOOLS,
  system: SYSTEM_TOOLS,
  code: CODE_TOOLS,
  web: WEB_TOOLS,
  screen: SCREEN_TOOLS,
  application: APPLICATION_TOOLS,
  search: [], // 搜索工具可扩展
  database: [], // 数据库工具可扩展
  automation: AUTOMATION_TOOLS,
};

/**
 * 获取工具定义
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.get(name);
}

/**
 * 获取某类别的所有工具
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS_BY_CATEGORY[category] || [];
}

/**
 * 获取安全的工具列表（不需要确认）
 */
export function getSafeTools(): ToolDefinition[] {
  return ALL_TOOLS.filter(t => t.dangerLevel === 'safe');
}

/**
 * 获取危险工具列表
 */
export function getDangerousTools(): ToolDefinition[] {
  return ALL_TOOLS.filter(t => t.dangerLevel === 'dangerous');
}
