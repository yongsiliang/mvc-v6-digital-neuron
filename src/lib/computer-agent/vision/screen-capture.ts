/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 屏幕截图
 * 
 * 跨平台屏幕截图：
 * - Windows: PowerShell + .NET
 * - macOS: screencapture
 * - Linux: scrot / gnome-screenshot
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import { platform } from 'os';
import { join } from 'path';
import type { AgentConfig, Rectangle, Result, AgentError } from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';

const execAsync = promisify(exec);

export class ScreenCapture {
  private config: AgentConfig;
  private screenshotCount: number = 0;
  
  constructor(config: AgentConfig) {
    this.config = config;
    this.ensureDirectory();
  }
  
  /**
   * 截取屏幕
   * @param region 可选的区域，不传则截取全屏
   * @returns 截图文件路径
   */
  async capture(region?: Rectangle): Promise<Result<string, AgentError>> {
    try {
      const timestamp = Date.now();
      this.screenshotCount++;
      const filename = `screen_${timestamp}_${this.screenshotCount}.png`;
      const outputPath = join(this.config.screenshotDir, filename);
      
      switch (this.config.platform) {
        case 'windows':
          await this.captureWindows(outputPath, region);
          break;
          
        case 'macos':
          await this.captureMac(outputPath, region);
          break;
          
        case 'linux':
          await this.captureLinux(outputPath, region);
          break;
      }
      
      return success(outputPath);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.SCREENSHOT_FAILED,
        `屏幕截图失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { region }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * Windows 截图
   */
  private async captureWindows(outputPath: string, region?: Rectangle): Promise<void> {
    const regionScript = region
      ? `$rect = New-Object System.Drawing.Rectangle(${region.x}, ${region.y}, ${region.width}, ${region.height})`
      : `$rect = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds`;
    
    const script = `
      Add-Type -AssemblyName System.Windows.Forms, System.Drawing
      ${regionScript}
      $bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.CopyFromScreen($rect.Location, [System.Drawing.Point]::Empty, $rect.Size)
      $bmp.Save('${outputPath.replace(/\\/g, '\\\\')}')
      $bmp.Dispose()
      $g.Dispose()
    `;
    
    await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`, {
      timeout: 10000,
    });
  }
  
  /**
   * macOS 截图
   */
  private async captureMac(outputPath: string, region?: Rectangle): Promise<void> {
    let command: string;
    
    if (region) {
      command = `screencapture -R${region.x},${region.y},${region.width},${region.height} "${outputPath}"`;
    } else {
      command = `screencapture "${outputPath}"`;
    }
    
    await execAsync(command, { timeout: 10000 });
  }
  
  /**
   * Linux 截图
   */
  private async captureLinux(outputPath: string, region?: Rectangle): Promise<void> {
    let command: string;
    
    if (region) {
      // 尝试 scrot
      try {
        command = `scrot --overwrite -a ${region.x},${region.y},${region.width},${region.height} "${outputPath}"`;
        await execAsync(command, { timeout: 10000 });
        return;
      } catch {
        // scrot 不可用，尝试 gnome-screenshot
        command = `gnome-screenshot -a -f "${outputPath}"`;
        await execAsync(command, { timeout: 10000 });
      }
    } else {
      try {
        command = `scrot --overwrite "${outputPath}"`;
        await execAsync(command, { timeout: 10000 });
        return;
      } catch {
        command = `gnome-screenshot -f "${outputPath}"`;
        await execAsync(command, { timeout: 10000 });
      }
    }
  }
  
  /**
   * 确保截图目录存在
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await mkdir(this.config.screenshotDir, { recursive: true });
    } catch {
      // 目录已存在或无权限，忽略错误
    }
  }
  
  /**
   * 获取屏幕尺寸
   */
  async getScreenSize(): Promise<Result<{ width: number; height: number }, AgentError>> {
    try {
      let width = 1920, height = 1080; // 默认值
      
      switch (this.config.platform) {
        case 'windows':
          const { stdout: winOut } = await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height"`,
            { timeout: 5000 }
          );
          const winParts = winOut.trim().split('\n');
          width = parseInt(winParts[0], 10);
          height = parseInt(winParts[1], 10);
          break;
          
        case 'macos':
          const { stdout: macOut } = await execAsync(
            `osascript -e 'tell application "Finder" to get bounds of window of desktop'`,
            { timeout: 5000 }
          );
          const macParts = macOut.split(',').map(n => parseInt(n.trim(), 10));
          width = macParts[2];
          height = macParts[3];
          break;
          
        case 'linux':
          const { stdout: linuxOut } = await execAsync(
            `xdpyinfo | grep dimensions`,
            { timeout: 5000 }
          );
          const linuxMatch = linuxOut.match(/(\d+)x(\d+)/);
          if (linuxMatch) {
            width = parseInt(linuxMatch[1], 10);
            height = parseInt(linuxMatch[2], 10);
          }
          break;
      }
      
      return success({ width, height });
    } catch (error) {
      return failure(createError(
        AgentErrorCode.SCREENSHOT_FAILED,
        `获取屏幕尺寸失败: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      ));
    }
  }
}
