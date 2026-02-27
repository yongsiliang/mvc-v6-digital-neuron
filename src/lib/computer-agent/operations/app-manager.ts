/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 应用管理器
 * 
 * 跨平台应用程序管理：
 * - 启动应用
 * - 窗口列表
 * - 窗口切换
 * - 关闭应用
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  AgentConfig,
  IAppManager,
  AppInfo,
  WindowInfo,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';
import { APP_NAME_MAPPINGS } from '../constants';

const execAsync = promisify(exec);

export function createAppManager(config: AgentConfig): IAppManager {
  return new AppManager(config);
}

class AppManager implements IAppManager {
  private config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  async launchApp(name: string, args: string[] = []): Promise<Result<AppInfo, AgentError>> {
    try {
      // 查找应用映射
      const mapping = APP_NAME_MAPPINGS[name.toLowerCase()];
      const appName = mapping 
        ? mapping[this.config.platform] 
        : name;
      
      if (!appName) {
        return failure(createError(
          AgentErrorCode.APP_NOT_FOUND,
          `应用 "${name}" 在当前平台不可用`
        ));
      }
      
      const appArgs = args.join(' ');
      
      switch (this.config.platform) {
        case 'windows':
          await execAsync(
            appArgs ? `start "" "${appName}" ${appArgs}` : `start "" "${appName}"`,
            { timeout: 15000 }
          );
          break;
          
        case 'macos':
          if (appName.endsWith('.app')) {
            await execAsync(
              appArgs ? `open -a "${appName}" --args ${appArgs}` : `open -a "${appName}"`,
              { timeout: 15000 }
            );
          } else {
            await execAsync(
              appArgs ? `open "${appName}" ${appArgs}` : `open "${appName}"`,
              { timeout: 15000 }
            );
          }
          break;
          
        case 'linux':
          await execAsync(
            appArgs ? `${appName} ${appArgs} &` : `${appName} &`,
            { timeout: 15000 }
          );
          break;
      }
      
      return success({
        name: appName,
        running: true,
      });
    } catch (error) {
      return failure(createError(
        AgentErrorCode.APP_LAUNCH_FAILED,
        `启动应用失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { name, args }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  async listApps(): Promise<Result<AppInfo[], AgentError>> {
    try {
      const apps: AppInfo[] = [];
      
      switch (this.config.platform) {
        case 'windows':
          const { stdout: winOut } = await execAsync(
            'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object ProcessName, MainWindowTitle | ConvertTo-Json"',
            { timeout: 10000 }
          );
          const winResult = JSON.parse(winOut || '[]');
          const winList = Array.isArray(winResult) ? winResult : [winResult];
          winList.forEach((p: { ProcessName: string; MainWindowTitle: string }) => {
            if (p.ProcessName) {
              apps.push({
                name: p.ProcessName,
                running: true,
                windows: p.MainWindowTitle ? [{
                  id: p.ProcessName,
                  title: p.MainWindowTitle,
                  appName: p.ProcessName,
                  bounds: { x: 0, y: 0, width: 0, height: 0 },
                  visible: true,
                  focused: false,
                }] : undefined,
              });
            }
          });
          break;
          
        case 'macos':
          const { stdout: macOut } = await execAsync(
            'osascript -e \'tell application "System Events" to get name of every process whose visible is true\'',
            { timeout: 10000 }
          );
          macOut.split(', ').forEach(name => {
            if (name.trim()) {
              apps.push({ name: name.trim(), running: true });
            }
          });
          break;
          
        case 'linux':
          const { stdout: linuxOut } = await execAsync(
            'wmctrl -l 2>/dev/null || echo ""',
            { timeout: 10000 }
          );
          const seenApps = new Set<string>();
          linuxOut.split('\n').filter(Boolean).forEach(line => {
            const parts = line.split(/\s+/);
            if (parts.length >= 4) {
              const appName = parts[2];
              if (!seenApps.has(appName)) {
                seenApps.add(appName);
                apps.push({ name: appName, running: true });
              }
            }
          });
          break;
      }
      
      return success(apps);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.APP_NOT_FOUND,
        `获取应用列表失败: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  async listWindows(): Promise<Result<WindowInfo[], AgentError>> {
    try {
      const windows: WindowInfo[] = [];
      
      switch (this.config.platform) {
        case 'windows':
          const { stdout: winOut } = await execAsync(
            `powershell -Command "
              Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class Win32 {
                  [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();
                  [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
                  [DllImport(\\"user32.dll\\")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
                  public struct RECT { public int Left, Top, Right, Bottom; }
                }
"@
              Get-Process | Where-Object {$_.MainWindowTitle} | ForEach-Object {
                $rect = New-Object Win32+RECT
                [Win32]::GetWindowRect($_.MainWindowHandle, [ref]$rect)
                [PSCustomObject]@{
                  Id = $_.Id
                  Title = $_.MainWindowTitle
                  ProcessName = $_.ProcessName
                  Bounds = @{
                    X = $rect.Left
                    Y = $rect.Top
                    Width = $rect.Right - $rect.Left
                    Height = $rect.Bottom - $rect.Top
                  }
                }
              } | ConvertTo-Json
            "`,
            { timeout: 10000 }
          );
          const winResult = JSON.parse(winOut || '[]');
          const winList = Array.isArray(winResult) ? winResult : [winResult];
          winList.forEach((w: Record<string, unknown>) => {
            windows.push({
              id: w.Id as number,
              title: w.Title as string,
              appName: w.ProcessName as string,
              bounds: w.Bounds as WindowInfo['bounds'],
              visible: true,
              focused: false,
              processId: w.Id as number,
            });
          });
          break;
          
        case 'macos':
          const { stdout: macOut } = await execAsync(
            'osascript -e \'tell application "System Events" to get {name, id, position, size} of every window of every process whose visible is true\'',
            { timeout: 10000 }
          );
          // 解析 AppleScript 输出较复杂，简化处理
          const appNames = macOut.split(',').map(s => s.trim());
          appNames.forEach((name, idx) => {
            windows.push({
              id: idx,
              title: name,
              appName: name.split(' ').slice(-1)[0],
              bounds: { x: 0, y: 0, width: 800, height: 600 },
              visible: true,
              focused: idx === 0,
            });
          });
          break;
          
        case 'linux':
          const { stdout: linuxOut } = await execAsync(
            'wmctrl -l 2>/dev/null || echo ""',
            { timeout: 10000 }
          );
          linuxOut.split('\n').filter(Boolean).forEach((line, idx) => {
            const parts = line.split(/\s+/);
            if (parts.length >= 4) {
              windows.push({
                id: parts[0],
                title: parts.slice(3).join(' '),
                appName: parts[2],
                bounds: { x: 0, y: 0, width: 800, height: 600 },
                visible: true,
                focused: false,
              });
            }
          });
          break;
      }
      
      return success(windows);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.WINDOW_NOT_FOUND,
        `获取窗口列表失败: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  async focusWindow(windowId: string | number): Promise<Result<void, AgentError>> {
    try {
      switch (this.config.platform) {
        case 'windows':
          await execAsync(
            `powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate('${windowId}')"`,
            { timeout: 5000 }
          );
          break;
          
        case 'macos':
          // 需要先获取窗口对应的app名称
          await execAsync(
            `osascript -e 'tell application "System Events" to set frontmost of first window to true'`,
            { timeout: 5000 }
          );
          break;
          
        case 'linux':
          await execAsync(
            `wmctrl -i -a ${windowId}`,
            { timeout: 5000 }
          );
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.WINDOW_NOT_FOUND,
        `聚焦窗口失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { windowId }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  async closeWindow(windowId: string | number): Promise<Result<void, AgentError>> {
    try {
      switch (this.config.platform) {
        case 'windows':
          await execAsync(
            `powershell -Command "Stop-Process -Id ${windowId} -Force"`,
            { timeout: 5000 }
          );
          break;
          
        case 'macos':
          await execAsync(
            `osascript -e 'tell application "System Events" to keystroke "w" using command down'`,
            { timeout: 5000 }
          );
          break;
          
        case 'linux':
          await execAsync(
            `wmctrl -i -c ${windowId}`,
            { timeout: 5000 }
          );
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.WINDOW_NOT_FOUND,
        `关闭窗口失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { windowId }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
}
