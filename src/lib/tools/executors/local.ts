/**
 * ═══════════════════════════════════════════════════════════════════════
 * 本地电脑操作执行器
 * 
 * 实现真正的本地电脑控制能力：
 * - 打开浏览器/应用
 * - 键盘鼠标自动化
 * - 屏幕截取和分析
 * - 系统通知
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────
// 本地操作执行器
// ─────────────────────────────────────────────────────────────────────

export function createLocalExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'local',
      displayName: '本地电脑操作',
      description: '控制本地电脑：打开浏览器、启动应用、键盘鼠标自动化、截图等',
      category: 'automation',
      dangerLevel: 'moderate',
      requiresConfirmation: false,
      timeout: 30000,
      parameters: [],
    },

    async execute(
      params: Record<string, unknown>,
      context: ExecutionContext
    ): Promise<ToolResult> {
      const startTime = Date.now();
      const toolName = params._toolName as string;
      const os = platform();

      try {
        let result: { success: boolean; output?: unknown; error?: string };

        switch (toolName) {
          case 'web_open':
            result = await openBrowser(params, os);
            break;
          case 'app_launch':
            result = await launchApp(params, os);
            break;
          case 'app_list':
            result = await listApps(os);
            break;
          case 'app_window_list':
            result = await listWindows(os);
            break;
          case 'app_window_focus':
            result = await focusWindow(params, os);
            break;
          case 'auto_type':
            result = await sendKeys(params, os);
            break;
          case 'auto_hotkey':
            result = await sendHotkey(params, os);
            break;
          case 'auto_click':
            result = await mouseClick(params, os);
            break;
          case 'auto_script':
            result = await runAutomation(params, context);
            break;
          case 'screen_capture':
            result = await screenCapture(params, os);
            break;
          case 'sys_notify':
            result = await sendNotification(params, os);
            break;
          default:
            result = { success: false, error: `未知的本地工具: ${toolName}` };
        }

        return {
          callId: `local_${Date.now()}`,
          toolName,
          success: result.success,
          output: result.output,
          error: result.error,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          callId: `local_${Date.now()}`,
          toolName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
    },

    validateParams(params: Record<string, unknown>): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      if (!params._toolName) {
        errors.push('缺少 _toolName 参数');
      }
      return { valid: errors.length === 0, errors };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// 具体实现函数
// ─────────────────────────────────────────────────────────────────────

async function openBrowser(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const url = params.url as string;
  const browser = params.browser as string | undefined;

  if (!url) {
    return { success: false, error: '缺少 URL 参数' };
  }

  try {
    let command: string;

    if (browser) {
      if (os === 'win32') {
        command = `start "" "${browser}" "${url}"`;
      } else if (os === 'darwin') {
        command = `open -a "${browser}" "${url}"`;
      } else {
        command = `${browser} "${url}" &`;
      }
    } else {
      if (os === 'win32') {
        command = `start "" "${url}"`;
      } else if (os === 'darwin') {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}" &`;
      }
    }

    await execAsync(command, { timeout: 10000 });

    return {
      success: true,
      output: {
        message: `已打开浏览器访问: ${url}`,
        url,
        browser: browser || '默认浏览器',
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `打开浏览器失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function launchApp(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const name = params.name as string;
  const args = (params.args as string[]) || [];

  if (!name) {
    return { success: false, error: '缺少应用名称' };
  }

  try {
    let command: string;
    const appArgs = args.join(' ');

    if (os === 'win32') {
      command = appArgs ? `start "" "${name}" ${appArgs}` : `start "" "${name}"`;
    } else if (os === 'darwin') {
      if (name.endsWith('.app')) {
        command = appArgs ? `open -a "${name}" --args ${appArgs}` : `open -a "${name}"`;
      } else {
        command = appArgs ? `open "${name}" ${appArgs}` : `open "${name}"`;
      }
    } else {
      command = appArgs ? `${name} ${appArgs} &` : `${name} &`;
    }

    await execAsync(command, { timeout: 10000 });

    return {
      success: true,
      output: {
        message: `已启动应用: ${name}`,
        app: name,
        args,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `启动应用失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function listApps(
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  try {
    let apps: string[] = [];

    if (os === 'win32') {
      const { stdout } = await execAsync(
        'dir /b "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs" 2>nul'
      );
      apps = stdout.split('\n').filter(Boolean);
    } else if (os === 'darwin') {
      const { stdout } = await execAsync(
        'ls /Applications/*.app 2>/dev/null | xargs -n1 basename'
      );
      apps = stdout.split('\n').filter(Boolean);
    } else {
      const { stdout } = await execAsync(
        'ls /usr/share/applications/*.desktop 2>/dev/null | xargs -n1 basename | sed "s/.desktop$//"'
      );
      apps = stdout.split('\n').filter(Boolean);
    }

    return {
      success: true,
      output: {
        apps: apps.slice(0, 50),
        count: apps.length,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `列出应用失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function listWindows(
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  try {
    let windows: Array<{ title: string; id: string }> = [];

    if (os === 'win32') {
      const { stdout } = await execAsync(
        'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id, MainWindowTitle | ConvertTo-Json"'
      );
      const result = JSON.parse(stdout || '[]');
      windows = (Array.isArray(result) ? result : [result]).map(
        (p: { Id: number; MainWindowTitle: string }) => ({
          id: String(p.Id),
          title: p.MainWindowTitle,
        })
      );
    } else if (os === 'darwin') {
      const { stdout } = await execAsync(
        'osascript -e \'tell application "System Events" to get name of every process whose visible is true\''
      );
      windows = stdout.split(', ').map((name, i) => ({
        id: String(i),
        title: name.trim(),
      }));
    } else {
      const { stdout } = await execAsync('wmctrl -l 2>/dev/null || echo ""');
      windows = stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(/\s+/);
          return {
            id: parts[0],
            title: parts.slice(3).join(' '),
          };
        });
    }

    return {
      success: true,
      output: {
        windows,
        count: windows.length,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `获取窗口列表失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function focusWindow(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const windowTitle = (params.window_title || params.title) as string;
  const id = params.id as string;

  if (!windowTitle && !id) {
    return { success: false, error: '需要提供窗口标题' };
  }

  try {
    let command: string;

    if (os === 'win32') {
      if (id) {
        command = `powershell -Command "$p = Get-Process -Id ${id} -ErrorAction SilentlyContinue; if ($p) { (New-Object -ComObject WScript.Shell).AppActivate($p.ProcessName) }"`;
      } else {
        command = `powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate('${windowTitle}')"`;
      }
    } else if (os === 'darwin') {
      command = `osascript -e 'tell application "${windowTitle}" to activate'`;
    } else {
      command = id
        ? `wmctrl -i -a ${id}`
        : `wmctrl -a "${windowTitle}"`;
    }

    await execAsync(command, { timeout: 5000 });

    return {
      success: true,
      output: {
        message: `已聚焦窗口: ${windowTitle || id}`,
        title: windowTitle,
        id,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `聚焦窗口失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function sendKeys(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const text = params.text as string;
  const delay = (params.delay as number) || 50;

  if (!text) {
    return { success: false, error: '缺少要输入的文本' };
  }

  try {
    let command: string;

    if (os === 'win32') {
      const escaped = text.replace(/"/g, '""');
      command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"${escaped}\\")"`;
    } else if (os === 'darwin') {
      command = `osascript -e 'tell application "System Events" to keystroke "${text}"'`;
    } else {
      command = `xdotool type --delay ${delay} "${text}"`;
    }

    await execAsync(command, { timeout: 30000 });

    return {
      success: true,
      output: {
        message: `已发送键盘输入: ${text}`,
        text,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `发送键盘输入失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function sendHotkey(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const keys = params.keys as string | string[];

  if (!keys) {
    return { success: false, error: '缺少快捷键参数' };
  }

  const keyArray = typeof keys === 'string' ? keys.split(/[+]/).map((k) => k.trim()) : keys;

  try {
    let command: string;

    const keyMap: Record<string, string> = {
      ctrl: 'Control',
      alt: 'Alt',
      shift: 'Shift',
      cmd: 'Command',
      win: 'Win',
      enter: 'Enter',
      tab: 'Tab',
      escape: 'Escape',
      backspace: 'BackSpace',
      delete: 'Delete',
      space: 'Space',
    };

    const normalizedKeys = keyArray.map((k) => keyMap[k.toLowerCase()] || k);

    if (os === 'win32') {
      const hotkeyStr = normalizedKeys
        .map((k) => (k === 'Win' ? '^{ESC}' : k === 'Control' ? '^' : k === 'Alt' ? '%' : k === 'Shift' ? '+' : k))
        .join('');
      command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"${hotkeyStr}\\")"`;
    } else if (os === 'darwin') {
      const modifiers = normalizedKeys.slice(0, -1).map((k) => k.toLowerCase() + ' down');
      const key = normalizedKeys[normalizedKeys.length - 1];
      command = `osascript -e 'tell application "System Events" to keystroke "${key}" using {${modifiers.join(', ')}}'`;
    } else {
      const hotkeyStr = normalizedKeys.map((k) => k.toLowerCase()).join('+');
      command = `xdotool key ${hotkeyStr}`;
    }

    await execAsync(command, { timeout: 5000 });

    return {
      success: true,
      output: {
        message: `已发送快捷键: ${keyArray.join('+')}`,
        keys: keyArray,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `发送快捷键失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function mouseClick(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const x = params.x as number | undefined;
  const y = params.y as number | undefined;
  const button = (params.button as 'left' | 'right' | 'middle') || 'left';
  const double = (params.double as boolean) || false;

  try {
    let command: string;

    if (os === 'win32') {
      if (x !== undefined && y !== undefined) {
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x},${y})"`;
        await execAsync(command, { timeout: 5000 });
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"{ENTER}\\")"`;
      } else {
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"{ENTER}\\")"`;
      }
    } else if (os === 'darwin') {
      const clickCmd = button === 'right' ? 'rc' : 'c';
      if (x !== undefined && y !== undefined) {
        command = `cliclick ${clickCmd}:${x},${y}`;
      } else {
        command = `cliclick ${clickCmd}:.`;
      }
    } else {
      if (x !== undefined && y !== undefined) {
        const btn = button === 'left' ? '1' : button === 'right' ? '3' : '2';
        command = `xdotool mousemove ${x} ${y} click ${btn}${double ? ' --repeat 2' : ''}`;
      } else {
        const btn = button === 'left' ? '1' : button === 'right' ? '3' : '2';
        command = `xdotool click ${btn}${double ? ' --repeat 2' : ''}`;
      }
    }

    await execAsync(command, { timeout: 5000 });

    return {
      success: true,
      output: {
        message: `已执行鼠标点击${double ? '(双击)' : ''}`,
        x,
        y,
        button,
        double,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `鼠标点击失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function screenCapture(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const region = params.region as { x: number; y: number; width: number; height: number } | undefined;
  const output = (params.output as string) || `/tmp/screenshot_${Date.now()}.png`;

  try {
    let command: string;

    if (os === 'win32') {
      const regionScript = region
        ? `$rect = New-Object System.Drawing.Rectangle(${region.x}, ${region.y}, ${region.width}, ${region.height})`
        : '$rect = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds';
      command = `powershell -Command "
        Add-Type -AssemblyName System.Windows.Forms, System.Drawing
        ${regionScript}
        $bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.CopyFromScreen($rect.Location, [System.Drawing.Point]::Empty, $rect.Size)
        $bmp.Save('${output}')
        $bmp.Dispose()
        $g.Dispose()
      "`;
    } else if (os === 'darwin') {
      const regionArg = region ? `-R${region.x},${region.y},${region.width},${region.height}` : '';
      command = `screencapture ${regionArg} "${output}"`;
    } else {
      const regionArg = region ? `--region=${region.x},${region.y},${region.width},${region.height}` : '';
      command = `scrot ${regionArg} "${output}" 2>/dev/null || gnome-screenshot ${region ? '-a' : ''} -f "${output}"`;
    }

    await execAsync(command, { timeout: 10000 });

    return {
      success: true,
      output: {
        message: '截图成功',
        path: output,
        region,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `截图失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function sendNotification(
  params: Record<string, unknown>,
  os: NodeJS.Platform
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const title = params.title as string;
  const message = params.message as string;
  const sound = (params.sound as boolean) !== false;

  if (!title || !message) {
    return { success: false, error: '缺少标题或消息内容' };
  }

  try {
    let command: string;

    if (os === 'win32') {
      command = `powershell -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')"`;
    } else if (os === 'darwin') {
      command = `osascript -e 'display notification "${message}" with title "${title}"${sound ? ' sound name "default"' : ''}'`;
    } else {
      command = `notify-send "${title}" "${message}"`;
    }

    await execAsync(command, { timeout: 5000 });

    return {
      success: true,
      output: {
        message: '通知已发送',
        title,
        body: message,
        sound,
        platform: os,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `发送通知失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function runAutomation(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const script = params.script as string;
  const type = (params.type as 'python' | 'javascript' | 'shell') || 'shell';

  if (!script) {
    return { success: false, error: '缺少脚本内容' };
  }

  try {
    let result: { stdout: string; stderr: string };

    if (type === 'python') {
      result = await execAsync(`python3 -c "${script.replace(/"/g, '\\"')}"`, {
        timeout: 60000,
        env: { ...process.env, ...context.env },
      });
    } else if (type === 'javascript') {
      result = await execAsync(`node -e "${script.replace(/"/g, '\\"')}"`, {
        timeout: 60000,
        env: { ...process.env, ...context.env },
      });
    } else {
      result = await execAsync(script, {
        timeout: 60000,
        env: { ...process.env, ...context.env },
      });
    }

    return {
      success: true,
      output: {
        stdout: result.stdout,
        stderr: result.stderr,
        type,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `执行自动化脚本失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
