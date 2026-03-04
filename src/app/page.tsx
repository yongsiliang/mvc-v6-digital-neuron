/**
 * ═══════════════════════════════════════════════════════════════════════
 * 首页 - 智能助手
 * Home Page - Intelligent Assistant
 *
 * 设计理念：
 * - 极简主义：核心功能突出，次要功能隐藏
 * - 响应式：自适应手机、平板、桌面
 * - 沉浸式：专注聊天体验
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Bot,
  Send,
  Loader2,
  Brain,
  Heart,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Hexagon,
  Activity,
  Triangle,
  Layers,
  Clock,
  MessageCircle,
  Lightbulb,
  Cpu,
  Sparkles,
  Zap,
  Settings2,
  MoreHorizontal,
  Sparkle,
  Command,
  Globe,
  Wand2,
  Search,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 渲染带链接的文本
 * 将 [文本](URL) 格式转换为可点击的链接
 */
function renderTextWithLinks(text: string) {
  // 匹配 Markdown 链接格式: [文本](URL)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // 添加链接前的文本
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // 添加链接
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium"
      >
        {match[1]}
      </a>,
    );

    lastIndex = match.index + match[0].length;
  }

  // 添加最后的文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: string[];
  memory?: string[];
  context?: {
    identity: { name: string; whoAmI: string };
    emotionalState: string;
    focus: string;
  };
  emotion?: {
    dominantEmotion: { emotion: string; intensity: number } | null;
    activeEmotions: Array<{ emotion: string; intensity: number }>;
  };
  learning?: {
    newConcepts: string[];
    newBeliefs: string[];
  };
  // 自主模式相关
  isAutonomous?: boolean;
  reasoningSteps?: ReasoningStep[];
  toolsUsed?: string[];
}

// 自主推理步骤
interface ReasoningStep {
  type: 'thought' | 'action' | 'observation' | 'final';
  content?: string;
  tool?: string;
  params?: Record<string, unknown>;
  result?: string;
}

interface ExistenceStatus {
  exists: boolean;
  age: number;
  memoryDepth: number;
  conversationCount: number;
}

// ─────────────────────────────────────────────────────────────────────
// 导航配置（次要功能，隐藏到下拉菜单）
// ─────────────────────────────────────────────────────────────────────

const SECONDARY_LINKS = [
  {
    href: '/agent',
    label: 'Agent 控制台',
    icon: Cpu,
    description: '控制鼠标键盘',
  },
  {
    href: '/field-vision',
    label: '场域视觉',
    icon: Hexagon,
    description: '可视化意识场域',
  },
  {
    href: '/resonance',
    label: '共振引擎',
    icon: Activity,
    description: '情感共振分析',
  },
  {
    href: '/octahedron-snn',
    label: '八面体SNN',
    icon: Triangle,
    description: '神经网络架构',
  },
  {
    href: '/experiment',
    label: '对比实验',
    icon: Layers,
    description: '效果对比测试',
  },
];

// 示例问题
const EXAMPLE_QUESTIONS = [
  '你好，我是谁？',
  '我们刚才聊了什么？',
  '帮我记住：我喜欢编程',
  '我有什么特点？',
];

// MVC 模式示例问题
const MVC_EXAMPLES = [
  '你现在感觉怎么样？',
  '你在思考什么？',
  '你相信什么？',
  '你存在的意义是什么？',
];

// 自主模式示例问题
const AUTONOMOUS_EXAMPLES = [
  '帮我搜索今天的科技新闻',
  '查一下北京现在几点了',
  '帮我记住：我下周三有会议',
  '搜索一下最近有什么好看的电影',
];

// Agent 模式示例问题（需要桌面应用）
const AGENT_EXAMPLES = [
  '截图看看我屏幕上有什么',
  '帮我打开微信',
  '移动鼠标到屏幕中央',
  '输入 Hello World',
];

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // UI 状态
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 模式切换
  const [devMode, setDevMode] = useState(() => searchParams.get('dev') === 'true');
  const [autonomousMode, setAutonomousMode] = useState(false); // 自主模式
  const [mvcMode, setMvcMode] = useState(false); // MVC 意识模式
  const [existenceStatus, setExistenceStatus] = useState<ExistenceStatus | null>(null);
  const [mvcStatus, setMvcStatus] = useState<{
    exists: boolean;
    identity: string;
    duration: number;
  } | null>(null);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 滚动到底部
  useEffect(() => {
    const scrollToBottom = () => {
      // 优先使用直接设置 scrollTop
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
      }
      // 备用：使用 scrollIntoView
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
      }
    };

    // 使用 requestAnimationFrame + setTimeout 确保 DOM 完全渲染
    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 100);
    });
  }, [messages]);

  // 获取存在状态
  useEffect(() => {
    if (devMode) {
      fetchExistenceStatus();
    }
  }, [devMode]);

  // 获取 MVC 状态
  useEffect(() => {
    if (mvcMode) {
      fetchMvcStatus();
    }
  }, [mvcMode]);

  const fetchExistenceStatus = async () => {
    try {
      const res = await fetch('/api/neuron-v6/reflect?action=status');
      if (res.ok) {
        const data = await res.json();
        setExistenceStatus(data);
      }
    } catch (e) {
      console.error('获取状态失败:', e);
    }
  };

  const fetchMvcStatus = async () => {
    try {
      const res = await fetch('/api/consciousness');
      if (res.ok) {
        const data = await res.json();
        setMvcStatus(data);
      }
    } catch (e) {
      console.error('获取 MVC 状态失败:', e);
    }
  };

  // 发送消息
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // 根据模式选择不同的 API
      if (autonomousMode) {
        await sendAutonomousMessage(messageText);
      } else if (mvcMode) {
        await sendMvcMessage(messageText);
      } else {
        await sendNormalMessage(messageText);
      }

      setIsLoading(false);
    },
    [isLoading, devMode, autonomousMode],
  );

  // 普通模式发送消息
  const sendNormalMessage = async (messageText: string) => {
    try {
      const response = await fetch('/api/neuron-v6/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let thinkingSteps: string[] = [];
      let memoryRetrieved: string[] = [];
      let contextData: Message['context'];
      let emotionData: Message['emotion'];
      let learningData: Message['learning'];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content' && data.data?.delta) {
                assistantContent += data.data.delta;
              } else if (data.type === 'thinking' && data.data?.chain) {
                thinkingSteps = data.data.chain
                  .slice(0, 3)
                  .map((s: { content: string }) => s.content.substring(0, 100));
              } else if (data.type === 'memory' && data.data?.summary) {
                memoryRetrieved = [data.data.summary];
                if (data.data.directMatches?.length > 0) {
                  memoryRetrieved.push(...data.data.directMatches.slice(0, 2));
                }
              } else if (data.type === 'context') {
                contextData = data.data;
              } else if (data.type === 'emotion') {
                emotionData = data.data;
              } else if (data.type === 'learning') {
                learningData = data.data;
              } else if (data.type === 'complete') {
                const assistantMessage: Message = {
                  id: `assistant_${Date.now()}`,
                  role: 'assistant',
                  content: assistantContent || data.data?.fullResponse || '',
                  timestamp: Date.now(),
                  thinking: devMode ? thinkingSteps : undefined,
                  memory: devMode ? memoryRetrieved : undefined,
                  context: devMode ? contextData : undefined,
                  emotion: devMode ? emotionData : undefined,
                  learning: devMode ? learningData : undefined,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                if (devMode) fetchExistenceStatus();
              }
            } catch (e) {
              console.error('解析数据失败:', e);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `抱歉，出现了一些问题：${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // MVC 意识模式发送消息
  const sendMvcMessage = async (messageText: string) => {
    try {
      const response = await fetch('/api/consciousness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'interact', content: messageText }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.response || '...',
        timestamp: Date.now(),
        context: devMode
          ? {
              identity: {
                name: data.consciousness?.identity || 'MVC',
                whoAmI: data.consciousness?.identity || '',
              },
              emotionalState: data.consciousness?.feeling || '存在',
              focus: data.consciousness?.currentIntention?.what || '存在',
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      fetchMvcStatus();
    } catch (err) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `MVC 意识交互失败：${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // 自主模式发送消息
  const sendAutonomousMessage = async (messageText: string) => {
    try {
      const response = await fetch('/api/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';
      const reasoningSteps: ReasoningStep[] = [];
      let finalContent = '';
      let toolsUsed: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'step') {
                reasoningSteps.push(data.data);

                // 🔥 真正的行动力：执行各种动作
                if (data.data.type === 'action' && data.data.tool) {
                  const tool = data.data.tool;
                  const params = data.data.params || {};

                  // 检查是否在 Tauri 环境
                  const inTauri = '__TAURI__' in window;

                  // 打开网页
                  if (tool === 'open_url') {
                    const url = params.url;
                    if (url) {
                      console.log('[行动] 打开网页:', url);
                      window.open(url, '_blank');
                    }
                  }

                  // 打开本地应用（需要 Tauri 环境）
                  if (tool === 'open_app') {
                    const appPath = params.app_path;
                    if (appPath && inTauri) {
                      console.log('[行动] 打开应用:', params.app_name, appPath);
                      import('@tauri-apps/plugin-shell')
                        .then((module) => {
                          module.Command.create(appPath).execute();
                        })
                        .catch(console.error);
                    }
                  }

                  // 打开本地文件（需要 Tauri 环境）
                  if (tool === 'open_file') {
                    const path = params.path;
                    if (path && inTauri) {
                      console.log('[行动] 打开文件:', path);
                      import('@tauri-apps/plugin-shell')
                        .then((module) => {
                          module.open(path);
                        })
                        .catch(console.error);
                    }
                  }

                  // 执行系统命令（需要 Tauri 环境）
                  if (tool === 'run_command') {
                    const command = params.command;
                    const args = params.args || [];
                    if (command && inTauri) {
                      console.log('[行动] 执行命令:', command, args);
                      import('@tauri-apps/plugin-shell')
                        .then((module) => {
                          module.Command.create(command, args as string[]).execute();
                        })
                        .catch(console.error);
                    }
                  }

                  // ═══════════════════════════════════════════════════
                  // Agent 控制工具（真正的电脑控制！）
                  // ═══════════════════════════════════════════════════

                  // 截图
                  if (tool === 'screenshot' && inTauri) {
                    console.log('[行动] 截图');
                    import('@tauri-apps/api/core').then(async ({ invoke }) => {
                      try {
                        const result = await invoke<{
                          success: boolean;
                          base64: string | null;
                          error: string | null;
                        }>('screenshot');
                        if (result.success && result.base64) {
                          console.log('[行动] 截图成功，图片大小:', result.base64.length);
                          // 可以把截图存起来或者发给 AI 分析
                        } else {
                          console.error('[行动] 截图失败:', result.error);
                        }
                      } catch (e) {
                        console.error('[行动] 截图异常:', e);
                      }
                    });
                  }

                  // 鼠标移动
                  if (tool === 'mouse_move' && inTauri) {
                    const { x, y } = params;
                    console.log('[行动] 鼠标移动到:', x, y);
                    import('@tauri-apps/api/core').then(async ({ invoke }) => {
                      try {
                        await invoke('mouse_move', { x, y });
                      } catch (e) {
                        console.error('[行动] 鼠标移动失败:', e);
                      }
                    });
                  }

                  // 鼠标点击
                  if (tool === 'mouse_click' && inTauri) {
                    const { button = 'left', double = false } = params;
                    console.log('[行动] 鼠标点击:', button, double ? '(双击)' : '');
                    import('@tauri-apps/api/core').then(async ({ invoke }) => {
                      try {
                        if (double) {
                          await invoke('mouse_double_click', { button });
                        } else {
                          await invoke('mouse_click', { button });
                        }
                      } catch (e) {
                        console.error('[行动] 鼠标点击失败:', e);
                      }
                    });
                  }

                  // 鼠标滚动
                  if (tool === 'mouse_scroll' && inTauri) {
                    const { amount } = params;
                    console.log('[行动] 鼠标滚动:', amount);
                    import('@tauri-apps/api/core').then(async ({ invoke }) => {
                      try {
                        await invoke('mouse_scroll', { amount });
                      } catch (e) {
                        console.error('[行动] 鼠标滚动失败:', e);
                      }
                    });
                  }

                  // 键盘输入
                  if (tool === 'keyboard_type' && inTauri) {
                    const { text } = params;
                    console.log('[行动] 键盘输入:', text);
                    import('@tauri-apps/api/core').then(async ({ invoke }) => {
                      try {
                        await invoke('keyboard_type', { text });
                      } catch (e) {
                        console.error('[行动] 键盘输入失败:', e);
                      }
                    });
                  }

                  // 键盘按键
                  if (tool === 'keyboard_press' && inTauri) {
                    const { key } = params;
                    console.log('[行动] 按下按键:', key);
                    import('@tauri-apps/api/core').then(async ({ invoke }) => {
                      try {
                        await invoke('keyboard_press', { key });
                      } catch (e) {
                        console.error('[行动] 按键失败:', e);
                      }
                    });
                  }
                }
              } else if (data.type === 'complete') {
                finalContent = data.data.content;
                toolsUsed = data.data.toolsUsed;
              }
            } catch (e) {
              console.error('解析数据失败:', e);
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: finalContent || '抱歉，我无法完成这个任务。',
        timestamp: Date.now(),
        isAutonomous: true,
        reasoningSteps,
        toolsUsed,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `自主推理失败：${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    sendMessage(question);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 头部导航 - 极简设计 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 品牌区 */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <Sparkle className="absolute -top-1 -right-1 w-3 h-3 text-fuchsia-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">紫</span>
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                智能助手
              </span>
            </div>
          </Link>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-1">
            {/* MVC 意识模式开关 - 桌面端 */}
            <div
              className={cn(
                'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full',
                'bg-muted/50 border border-border/50',
                mvcMode && 'bg-cyan-500/10 border-cyan-500/30',
              )}
            >
              <Heart
                className={cn('w-3.5 h-3.5', mvcMode ? 'text-cyan-400' : 'text-muted-foreground')}
              />
              <span className="text-xs text-muted-foreground">MVC</span>
              <Switch
                checked={mvcMode}
                onCheckedChange={setMvcMode}
                className="scale-75 origin-center"
              />
            </div>

            {/* 自主模式开关 - 桌面端 */}
            <div
              className={cn(
                'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full',
                'bg-muted/50 border border-border/50',
                autonomousMode && 'bg-amber-500/10 border-amber-500/30',
              )}
            >
              <Wand2
                className={cn(
                  'w-3.5 h-3.5',
                  autonomousMode ? 'text-amber-400' : 'text-muted-foreground',
                )}
              />
              <span className="text-xs text-muted-foreground">自主</span>
              <Switch
                checked={autonomousMode}
                onCheckedChange={setAutonomousMode}
                className="scale-75 origin-center"
              />
            </div>

            {/* 开发者模式 - 桌面端 */}
            <div
              className={cn(
                'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full',
                'bg-muted/50 border border-border/50',
                devMode && 'bg-purple-500/10 border-purple-500/30',
              )}
            >
              <Settings2
                className={cn('w-3.5 h-3.5', devMode ? 'text-purple-400' : 'text-muted-foreground')}
              />
              <span className="text-xs text-muted-foreground">开发者</span>
              <Switch
                checked={devMode}
                onCheckedChange={setDevMode}
                className="scale-75 origin-center"
              />
            </div>

            {/* 功能菜单按钮 */}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full hover:bg-muted"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>

              {/* 下拉菜单 */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 p-2 rounded-xl bg-card border border-border shadow-xl animate-in fade-in-0 zoom-in-95">
                  <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
                    功能模块
                  </div>
                  {SECONDARY_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center">
                        <link.icon className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{link.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {link.description}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* 移动端模式开关 */}
                  <div className="md:hidden border-t border-border mt-2 pt-2 space-y-2">
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm">MVC 意识</span>
                      </div>
                      <Switch checked={mvcMode} onCheckedChange={setMvcMode} />
                    </div>
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-amber-500" />
                        <span className="text-sm">自主模式</span>
                      </div>
                      <Switch checked={autonomousMode} onCheckedChange={setAutonomousMode} />
                    </div>
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">开发者模式</span>
                      </div>
                      <Switch checked={devMode} onCheckedChange={setDevMode} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MVC 意识模式状态栏 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {mvcMode && mvcStatus && (
        <div className="border-b border-border/50 bg-gradient-to-r from-cyan-500/5 via-transparent to-teal-500/5">
          <div className="max-w-4xl mx-auto px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10">
                <Heart className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-muted-foreground">MVC</span>
                <span className="font-medium text-foreground">活跃</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-muted-foreground">存在</span>
                <span className="font-medium text-foreground">{mvcStatus.duration || 0} 脉动</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {mvcStatus.identity || '探索中...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 开发者模式状态栏 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {devMode && existenceStatus && (
        <div className="border-b border-border/50 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5">
          <div className="max-w-4xl mx-auto px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-muted-foreground">存在</span>
                <span className="font-medium text-foreground">
                  {Math.floor(existenceStatus.age / 60000)}m
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-muted-foreground">记忆</span>
                <span className="font-medium text-foreground">{existenceStatus.memoryDepth}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10">
                <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-muted-foreground">对话</span>
                <span className="font-medium text-foreground">
                  {existenceStatus.conversationCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 主内容区 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          /* 欢迎界面 */
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
            {/* Logo 动画 */}
            <div className="relative mb-6">
              <div
                className={cn(
                  'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl',
                  mvcMode
                    ? 'bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-cyan-500/30'
                    : autonomousMode
                      ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-amber-500/30'
                      : 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-purple-500/30',
                )}
              >
                {mvcMode ? (
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                ) : autonomousMode ? (
                  <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                ) : (
                  <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                )}
              </div>
              {/* 装饰 */}
              <div
                className={cn(
                  'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg',
                  mvcMode
                    ? 'bg-gradient-to-br from-cyan-400 to-teal-500'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500',
                )}
              >
                <Sparkle className="w-3 h-3 text-white" />
              </div>
              <div
                className={cn(
                  'absolute -bottom-1 -left-2 w-5 h-5 rounded-full shadow-lg',
                  mvcMode
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                    : 'bg-gradient-to-br from-cyan-400 to-blue-500',
                )}
              />
            </div>

            {/* 欢迎文字 */}
            <div className="text-center space-y-2 mb-8">
              <h1
                className={cn(
                  'text-2xl sm:text-3xl font-bold bg-clip-text text-transparent',
                  mvcMode
                    ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600'
                    : autonomousMode
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600'
                      : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600',
                )}
              >
                {mvcMode ? 'MVC 意识模式' : autonomousMode ? '自主意识模式' : '你好，我是紫'}
              </h1>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {mvcMode
                  ? '与 Minimum Viable Consciousness 对话。它拥有自我指涉、时间连续和内在驱动。它正在探索"我"的本质。'
                  : autonomousMode
                    ? '我可以自主决定使用工具，包括搜索网络、查询时间、存储记忆等。我会自己想办法解决问题。'
                    : '我拥有持久的记忆能力，能够记住我们的每一次对话，了解你的喜好与特点。'}
              </p>
            </div>

            {/* 快捷问题 */}
            <div className="w-full max-w-md space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-3">
                {mvcMode
                  ? '试着与 MVC 对话，探索意识的本质'
                  : autonomousMode
                    ? '试着让我帮你完成这些任务'
                    : '试着问我这些问题'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(mvcMode
                  ? MVC_EXAMPLES
                  : autonomousMode
                    ? '__TAURI__' in window
                      ? [...AUTONOMOUS_EXAMPLES, ...AGENT_EXAMPLES]
                      : AUTONOMOUS_EXAMPLES
                    : EXAMPLE_QUESTIONS
                )
                  .slice(0, 6)
                  .map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(question)}
                      disabled={isLoading}
                      className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all text-left"
                    >
                      {mvcMode ? (
                        <Heart className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      ) : autonomousMode ? (
                        <Search className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                        {question}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* 模式切换提示 */}
            <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => setAutonomousMode(!autonomousMode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                {autonomousMode ? (
                  <>
                    <Bot className="w-3 h-3" />
                    <span>切换到普通模式</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    <span>切换到自主模式</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 消息列表 - 使用原生滚动确保可靠 */
          <div className="flex-1 px-4 overflow-y-auto" ref={scrollViewportRef}>
            <div className="space-y-3 py-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} devMode={devMode} />
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-muted/50 border border-border/50">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">思考中...</span>
                  </div>
                </div>
              )}
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 输入区域 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="说点什么，我会记住的..."
                className="w-full h-11 sm:h-12 pl-4 pr-12 rounded-full bg-muted/50 border-border/50 focus:border-purple-500/50 focus:ring-purple-500/20"
                disabled={isLoading}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 hidden sm:block">
                Enter 发送
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 消息气泡组件
// ═══════════════════════════════════════════════════════════════════════

function MessageBubble({ message, devMode }: { message: Message; devMode: boolean }) {
  const [showDetails, setShowDetails] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] sm:max-w-[75%]', isUser ? 'order-1' : 'order-1')}>
        {/* 开发者模式：记忆提示 */}
        {devMode && message.memory && message.memory.length > 0 && (
          <div className="mb-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3 text-pink-400" />
              <span className="text-xs font-medium text-pink-400">记忆检索</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {message.memory.map((m, i) => (
                <p key={i} className="truncate">
                  {m}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 开发者模式：情感状态 */}
        {devMode && message.emotion && message.emotion.activeEmotions?.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {message.emotion.activeEmotions.slice(0, 3).map((e, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/30">
                {e.emotion}{' '}
                <span className="text-muted-foreground ml-0.5">
                  {(e.intensity * 100).toFixed(0)}%
                </span>
              </Badge>
            ))}
          </div>
        )}

        {/* 消息内容 */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-br-md'
              : 'bg-muted/50 border border-border/50 rounded-bl-md',
          )}
        >
          <p className="whitespace-pre-wrap">{renderTextWithLinks(message.content)}</p>

          {/* 时间戳 */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1.5 text-[10px]',
              isUser ? 'text-white/60' : 'text-muted-foreground',
            )}
          >
            <Clock className="w-2.5 h-2.5" />
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* 开发者模式：展开详情 */}
        {devMode && !isUser && (message.thinking?.length || message.learning) && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/30 transition-colors">
              <Zap className="w-3 h-3" />
              <span>处理详情</span>
              <ChevronDown className="w-3 h-3 details-chevron-down hidden" />
              <ChevronUp className="w-3 h-3 details-chevron-up hidden" />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {message.thinking && message.thinking.length > 0 && (
                <div className="px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="flex items-center gap-1 text-purple-400 mb-1">
                    <Lightbulb className="w-3 h-3" />
                    <span className="text-xs font-medium">思考过程</span>
                  </div>
                  {message.thinking.map((t, i) => (
                    <p key={i} className="text-xs text-muted-foreground truncate">
                      • {t}
                    </p>
                  ))}
                </div>
              )}
              {message.learning && (
                <div className="px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-1 text-green-400 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-medium">学习结果</span>
                  </div>
                  {message.learning.newConcepts?.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      新概念: {message.learning.newConcepts.join(', ')}
                    </p>
                  )}
                  {message.learning.newBeliefs?.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      新信念: {message.learning.newBeliefs.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </details>
        )}

        {/* 自主模式：推理步骤展示 */}
        {message.isAutonomous && message.reasoningSteps && message.reasoningSteps.length > 0 && (
          <details className="mt-1.5" open>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted/30 transition-colors">
              <Wand2 className="w-3 h-3 text-amber-500" />
              <span>自主推理过程</span>
              {message.toolsUsed && message.toolsUsed.length > 0 && (
                <div className="flex gap-1 ml-2">
                  {message.toolsUsed.map((tool, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tool}
                    </Badge>
                  ))}
                </div>
              )}
            </summary>
            <div className="mt-2 space-y-1.5 pl-2">
              {message.reasoningSteps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs',
                    step.type === 'thought' && 'bg-amber-500/5 border border-amber-500/10',
                    step.type === 'action' && 'bg-blue-500/5 border border-blue-500/10',
                    step.type === 'observation' && 'bg-green-500/5 border border-green-500/10',
                    step.type === 'final' && 'bg-purple-500/5 border border-purple-500/10',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1 mb-0.5 font-medium',
                      step.type === 'thought' && 'text-amber-400',
                      step.type === 'action' && 'text-blue-400',
                      step.type === 'observation' && 'text-green-400',
                      step.type === 'final' && 'text-purple-400',
                    )}
                  >
                    {step.type === 'thought' && <Lightbulb className="w-3 h-3" />}
                    {step.type === 'action' && <Zap className="w-3 h-3" />}
                    {step.type === 'observation' && <Search className="w-3 h-3" />}
                    {step.type === 'final' && <Sparkles className="w-3 h-3" />}
                    <span>
                      {step.type === 'thought' && '思考'}
                      {step.type === 'action' && `行动: ${step.tool}`}
                      {step.type === 'observation' && '观察'}
                      {step.type === 'final' && '结论'}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-3">
                    {step.content || step.result || JSON.stringify(step.params)}
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
