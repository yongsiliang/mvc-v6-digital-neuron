/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 鼠标控制器
 * 
 * 跨平台鼠标控制：
 * - Windows: PowerShell + .NET
 * - macOS: cliclick / AppleScript
 * - Linux: xdotool
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { AgentConfig, Point, Result, AgentError } from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';
import { PLATFORM_COMMANDS } from '../constants';

const execAsync = promisify(exec);

export class MouseController {
  private config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  /**
   * 移动鼠标到指定位置
   */
  async move(position: Point): Promise<Result<void, AgentError>> {
    try {
      const commands = PLATFORM_COMMANDS[this.config.platform];
      
      switch (this.config.platform) {
        case 'windows':
          await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${position.x},${position.y})"`,
            { timeout: 5000 }
          );
          break;
          
        case 'macos':
          await execAsync(`cliclick m:${position.x},${position.y}`, { timeout: 5000 });
          break;
          
        case 'linux':
          await execAsync(`xdotool mousemove ${position.x} ${position.y}`, { timeout: 5000 });
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.MOUSE_MOVE_FAILED,
        `鼠标移动失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { position }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 点击
   * @param position 点击位置
   * @param button 按键类型：'left' | 'right' | 'middle' 或双击次数
   */
  async click(
    position: Point, 
    button: 'left' | 'right' | 'middle' | number = 'left'
  ): Promise<Result<void, AgentError>> {
    try {
      // 先移动到位置
      const moveResult = await this.move(position);
      if (!moveResult.success) {
        return moveResult;
      }
      
      // 短暂延迟，确保移动完成
      await this.sleep(50);
      
      // 执行点击
      const doubleClick = typeof button === 'number' && button === 2;
      const actualButton = typeof button === 'number' ? 'left' : button;
      
      switch (this.config.platform) {
        case 'windows':
          if (actualButton === 'right') {
            await execAsync(
              `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('+{F10}')"` 
            );
          } else {
            await execAsync(
              `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${doubleClick ? '{ENTER}{ENTER}' : '{ENTER}'}')"`
            );
          }
          break;
          
        case 'macos':
          const clickCmd = actualButton === 'right' ? 'rc' : 'c';
          const clickTimes = doubleClick ? '2' : '1';
          await execAsync(
            `cliclick -c ${clickTimes} ${clickCmd}:${position.x},${position.y}`,
            { timeout: 5000 }
          );
          break;
          
        case 'linux':
          const btn = actualButton === 'left' ? 1 : actualButton === 'right' ? 3 : 2;
          const clickOpt = doubleClick ? '--repeat 2' : '';
          await execAsync(`xdotool click ${clickOpt} ${btn}`, { timeout: 5000 });
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.MOUSE_CLICK_FAILED,
        `鼠标点击失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { position, button }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 拖拽
   */
  async drag(from: Point, to: Point): Promise<Result<void, AgentError>> {
    try {
      // 移动到起点
      const moveResult = await this.move(from);
      if (!moveResult.success) {
        return moveResult;
      }
      
      await this.sleep(50);
      
      switch (this.config.platform) {
        case 'windows':
          // Windows 拖拽较复杂，使用 PowerShell 模拟
          await execAsync(
            `powershell -Command "
              Add-Type -AssemblyName System.Windows.Forms
              [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${from.x},${from.y})
              [System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
              Start-Sleep -Milliseconds 100
              [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${to.x},${to.y})
              [System.Windows.Forms.SendKeys]::SendWait('{UP}')
            "`,
            { timeout: 10000 }
          );
          break;
          
        case 'macos':
          await execAsync(
            `cliclick dd:${from.x},${from.y} dm:${to.x},${to.y} du:${to.x},${to.y}`,
            { timeout: 10000 }
          );
          break;
          
        case 'linux':
          await execAsync(
            `xdotool mousedown 1 mousemove ${to.x} ${to.y} mouseup 1`,
            { timeout: 10000 }
          );
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.MOUSE_CLICK_FAILED,
        `鼠标拖拽失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { from, to }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 滚动
   */
  async scroll(
    amount: number = 3, 
    direction: 'up' | 'down' | 'left' | 'right' = 'down'
  ): Promise<Result<void, AgentError>> {
    try {
      const scrollValue = direction === 'up' || direction === 'left' ? amount : -amount;
      
      switch (this.config.platform) {
        case 'windows':
          const winScroll = direction === 'up' ? '{PGUP}' : '{PGDN}';
          await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${winScroll.repeat(amount)}')"`,
            { timeout: 5000 }
          );
          break;
          
        case 'macos':
          // macOS 滚动方向相反
          const macScroll = direction === 'up' ? 'down' : 'up';
          await execAsync(
            `osascript -e 'tell application "System Events" to key code ${macScroll === 'up' ? 126 : 125} using {command down}'`,
            { timeout: 5000 }
          );
          break;
          
        case 'linux':
          const button = direction === 'up' ? 4 : 5;
          await execAsync(
            `xdotool click --repeat ${amount} ${button}`,
            { timeout: 5000 }
          );
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.MOUSE_CLICK_FAILED,
        `鼠标滚动失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { amount, direction }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 获取当前鼠标位置
   */
  async getPosition(): Promise<Result<Point, AgentError>> {
    try {
      let x = 0, y = 0;
      
      switch (this.config.platform) {
        case 'windows':
          const { stdout: winOut } = await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position.X; [System.Windows.Forms.Cursor]::Position.Y"`,
            { timeout: 5000 }
          );
          const winParts = winOut.trim().split('\n');
          x = parseInt(winParts[0], 10);
          y = parseInt(winParts[1], 10);
          break;
          
        case 'macos':
          const { stdout: macOut } = await execAsync(
            `osascript -e 'tell application "System Events" to get the position of the mouse'`,
            { timeout: 5000 }
          );
          const macParts = macOut.trim().split(',').map(n => parseInt(n.trim(), 10));
          x = macParts[0];
          y = macParts[1];
          break;
          
        case 'linux':
          const { stdout: linuxOut } = await execAsync(
            `xdotool getmouselocation --shell`,
            { timeout: 5000 }
          );
          const linuxMatch = linuxOut.match(/X=(\d+).*Y=(\d+)/s);
          if (linuxMatch) {
            x = parseInt(linuxMatch[1], 10);
            y = parseInt(linuxMatch[2], 10);
          }
          break;
      }
      
      return success({ x, y });
    } catch (error) {
      return failure(createError(
        AgentErrorCode.MOUSE_MOVE_FAILED,
        `获取鼠标位置失败: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
