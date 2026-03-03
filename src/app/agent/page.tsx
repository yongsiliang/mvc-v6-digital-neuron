'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  isTauri,
  screenshotAsDataUrl,
  mouseMove,
  mouseClick,
  mouseDoubleClick,
  mouseScroll,
  getMousePosition,
  keyboardType,
  keyboardPress,
  clickAt,
  typeAndEnter,
  copy,
  paste,
  selectAll,
} from '@/lib/agent';

export default function AgentPage() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 鼠标控制输入
  const [mouseX, setMouseX] = useState('500');
  const [mouseY, setMouseY] = useState('400');
  const [scrollAmount, setScrollAmount] = useState('-3');

  // 键盘控制输入
  const [textInput, setTextInput] = useState('');
  const [keyInput, setKeyInput] = useState('');

  // 检测环境
  const inTauri = isTauri();

  const handleScreenshot = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    setLoading(true);
    try {
      const url = await screenshotAsDataUrl();
      if (url) {
        setScreenshotUrl(url);
        setStatus('✅ 截图成功');
      } else {
        setStatus('❌ 截图失败');
      }
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
    setLoading(false);
  };

  const handleGetMousePosition = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    try {
      const pos = await getMousePosition();
      setMousePos(pos);
      setMouseX(String(pos.x));
      setMouseY(String(pos.y));
      setStatus(`✅ 鼠标位置: (${pos.x}, ${pos.y})`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  const handleMouseMove = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    setLoading(true);
    try {
      const result = await mouseMove(parseInt(mouseX), parseInt(mouseY));
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
    setLoading(false);
  };

  const handleClick = async (button: 'left' | 'right' | 'middle') => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    try {
      const result = await mouseClick(button);
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  const handleDoubleClick = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    try {
      const result = await mouseDoubleClick('left');
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  const handleScroll = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    try {
      const result = await mouseScroll(parseInt(scrollAmount));
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  const handleType = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    if (!textInput) {
      setStatus('❌ 请输入文本');
      return;
    }
    try {
      const result = await keyboardType(textInput);
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  const handleKeyPress = async () => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    if (!keyInput) {
      setStatus('❌ 请输入按键');
      return;
    }
    try {
      const result = await keyboardPress(keyInput);
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!inTauri) {
      setStatus('❌ 需要在桌面应用中运行');
      return;
    }
    try {
      let result;
      switch (action) {
        case 'copy':
          result = await copy();
          break;
        case 'paste':
          result = await paste();
          break;
        case 'selectAll':
          result = await selectAll();
          break;
        default:
          return;
      }
      setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (e) {
      setStatus(`❌ 错误: ${e}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">本地 Agent 控制台</h1>
            <p className="text-muted-foreground">控制鼠标、键盘，让 AI 真正操作你的电脑</p>
          </div>
          <Badge variant={inTauri ? 'default' : 'destructive'}>
            {inTauri ? '桌面应用模式' : '浏览器模式 (功能受限)'}
          </Badge>
        </div>

        {/* 状态栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">状态:</span>
              <span className="font-mono text-sm">{status || '就绪'}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 截图 */}
          <Card>
            <CardHeader>
              <CardTitle>📸 截图</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleScreenshot} disabled={loading} className="w-full">
                截取屏幕
              </Button>
              {screenshotUrl && (
                <div className="overflow-hidden rounded border">
                  <img src={screenshotUrl} alt="截图" className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 鼠标控制 */}
          <Card>
            <CardHeader>
              <CardTitle>🖱️ 鼠标控制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGetMousePosition} variant="outline" className="w-full">
                获取鼠标位置: ({mousePos.x}, {mousePos.y})
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>X</Label>
                  <Input value={mouseX} onChange={(e) => setMouseX(e.target.value)} type="number" />
                </div>
                <div>
                  <Label>Y</Label>
                  <Input value={mouseY} onChange={(e) => setMouseY(e.target.value)} type="number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleMouseMove} disabled={loading}>
                  移动鼠标
                </Button>
                <Button onClick={handleDoubleClick} variant="outline">
                  双击
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleClick('left')} className="flex-1">
                  左键
                </Button>
                <Button onClick={() => handleClick('right')} variant="outline" className="flex-1">
                  右键
                </Button>
                <Button onClick={() => handleClick('middle')} variant="outline" className="flex-1">
                  中键
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={scrollAmount}
                  onChange={(e) => setScrollAmount(e.target.value)}
                  type="number"
                  placeholder="滚动量"
                  className="flex-1"
                />
                <Button onClick={handleScroll} variant="outline">
                  滚动
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 键盘控制 */}
          <Card>
            <CardHeader>
              <CardTitle>⌨️ 键盘控制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>输入文本</Label>
                <div className="flex gap-2">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="输入要打字的文本"
                  />
                  <Button onClick={handleType}>输入</Button>
                </div>
              </div>

              <div>
                <Label>按键 (如: enter, tab, ctrl+c)</Label>
                <div className="flex gap-2">
                  <Input
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="按键名称"
                  />
                  <Button onClick={handleKeyPress} variant="outline">
                    按下
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => keyboardPress('enter')} variant="outline" size="sm">
                  Enter
                </Button>
                <Button onClick={() => keyboardPress('tab')} variant="outline" size="sm">
                  Tab
                </Button>
                <Button onClick={() => keyboardPress('escape')} variant="outline" size="sm">
                  Esc
                </Button>
                <Button onClick={() => keyboardPress('backspace')} variant="outline" size="sm">
                  Backspace
                </Button>
                <Button onClick={() => keyboardPress('delete')} variant="outline" size="sm">
                  Delete
                </Button>
                <Button onClick={() => keyboardPress('space')} variant="outline" size="sm">
                  Space
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ 快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleQuickAction('copy')} variant="outline">
                  复制 (Ctrl+C)
                </Button>
                <Button onClick={() => handleQuickAction('paste')} variant="outline">
                  粘贴 (Ctrl+V)
                </Button>
                <Button onClick={() => handleQuickAction('selectAll')} variant="outline">
                  全选 (Ctrl+A)
                </Button>
                <Button onClick={() => keyboardPress('ctrl+z')} variant="outline">
                  撤销 (Ctrl+Z)
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => keyboardPress('ctrl+s')} variant="outline">
                  保存 (Ctrl+S)
                </Button>
                <Button onClick={() => keyboardPress('ctrl+w')} variant="outline">
                  关闭 (Ctrl+W)
                </Button>
                <Button onClick={() => keyboardPress('alt+f4')} variant="outline">
                  退出 (Alt+F4)
                </Button>
                <Button onClick={() => keyboardPress('ctrl+shift+esc')} variant="outline">
                  任务管理器
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => keyboardPress('up')} variant="outline" size="sm">
                  ↑
                </Button>
                <Button onClick={() => keyboardPress('down')} variant="outline" size="sm">
                  ↓
                </Button>
                <Button onClick={() => keyboardPress('left')} variant="outline" size="sm">
                  ←
                </Button>
                <Button onClick={() => keyboardPress('right')} variant="outline" size="sm">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📖 使用说明</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                <strong>启动桌面应用:</strong> 运行 <code>pnpm tauri:dev</code>
              </li>
              <li>
                <strong>截图:</strong> 点击截图按钮，AI 就能看到你的屏幕
              </li>
              <li>
                <strong>鼠标控制:</strong> 输入坐标移动鼠标，或点击按钮执行点击
              </li>
              <li>
                <strong>键盘控制:</strong> 输入文本或按键，支持组合键如 ctrl+c
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
