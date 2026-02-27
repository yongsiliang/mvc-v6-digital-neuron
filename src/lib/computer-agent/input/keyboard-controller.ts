/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 键盘控制器
 * 
 * 跨平台键盘控制：
 * - 文字输入
 * - 单键按压
 * - 快捷键组合
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { AgentConfig, Result, AgentError } from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';
import { HOTKEY_MAPPINGS, PLATFORM_COMMANDS } from '../constants';

const execAsync = promisify(exec);

export class KeyboardController {
  private config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  /**
   * 输入文字
   */
  async type(text: string, interval: number = this.config.keyInputInterval): Promise<Result<void, AgentError>> {
    try {
      switch (this.config.platform) {
        case 'windows':
          // 转义特殊字符
          const escaped = text
            .replace(/\+/g, '{+}')
            .replace(/\^/g, '{^}')
            .replace(/%/g, '{%}')
            .replace(/~/g, '{~}')
            .replace(/\(/g, '{(}')
            .replace(/\)/g, '{)}')
            .replace(/\[/g, '{[}')
            .replace(/\]/g, '{]}')
            .replace(/\{/g, '{{}')
            .replace(/\}/g, '{}}');
          
          await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"${escaped}\\")"`,
            { timeout: 30000 }
          );
          break;
          
        case 'macos':
          // 对中文等非 ASCII 字符使用剪贴板
          if (/[\u4e00-\u9fff]/.test(text)) {
            // 复制到剪贴板然后粘贴
            await execAsync(`echo "${text}" | pbcopy`, { timeout: 5000 });
            await this.hotkey(['Cmd', 'V']);
          } else {
            await execAsync(
              `osascript -e 'tell application "System Events" to keystroke "${text.replace(/"/g, '\\"')}"'`,
              { timeout: 30000 }
            );
          }
          break;
          
        case 'linux':
          // 对中文等非 ASCII 字符使用剪贴板
          if (/[\u4e00-\u9fff]/.test(text)) {
            await execAsync(`echo "${text}" | xclip -selection clipboard`, { timeout: 5000 });
            await this.hotkey(['Ctrl', 'V']);
          } else {
            await execAsync(
              `xdotool type --delay ${interval} "${text.replace(/"/g, '\\"')}"`,
              { timeout: 30000 }
            );
          }
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.KEYBOARD_INPUT_FAILED,
        `键盘输入失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { text }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 按下单个键
   */
  async press(key: string): Promise<Result<void, AgentError>> {
    try {
      const normalizedKey = this.normalizeKey(key);
      
      switch (this.config.platform) {
        case 'windows':
          const winKey = this.toWindowsKey(normalizedKey);
          await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${winKey}')"`,
            { timeout: 5000 }
          );
          break;
          
        case 'macos':
          const keyCode = this.toMacKeyCode(normalizedKey);
          await execAsync(
            `osascript -e 'tell application "System Events" to key code ${keyCode}'`,
            { timeout: 5000 }
          );
          break;
          
        case 'linux':
          await execAsync(
            `xdotool key ${normalizedKey.toLowerCase()}`,
            { timeout: 5000 }
          );
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.KEYBOARD_INPUT_FAILED,
        `按键失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { key }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 执行快捷键
   */
  async hotkey(keys: string[]): Promise<Result<void, AgentError>> {
    try {
      // 检查是否是预定义的快捷键名称
      const hotkeyName = keys.join('+');
      if (HOTKEY_MAPPINGS[hotkeyName]) {
        keys = HOTKEY_MAPPINGS[hotkeyName];
      }
      
      // macOS 特殊处理
      const isMac = this.config.platform === 'macos';
      const normalizedKeys = keys.map(k => {
        const upper = k.toUpperCase();
        // 转换修饰键名称
        if (upper === 'CONTROL' || upper === 'CTRL') return isMac ? 'Command' : 'Control';
        if (upper === 'COMMAND' || upper === 'CMD') return 'Command';
        if (upper === 'OPTION' || upper === 'ALT') return isMac ? 'Option' : 'Alt';
        if (upper === 'SUPER' || upper === 'WIN' || upper === 'META') return isMac ? 'Command' : 'Super';
        return upper;
      });
      
      switch (this.config.platform) {
        case 'windows':
          const winHotkey = normalizedKeys
            .map(k => this.toWindowsModifier(k))
            .join('');
          await execAsync(
            `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${winHotkey}')"`,
            { timeout: 5000 }
          );
          break;
          
        case 'macos':
          const modifiers = normalizedKeys.slice(0, -1).map(k => {
            const kLower = k.toLowerCase();
            if (kLower === 'command') return 'command down';
            if (kLower === 'option') return 'option down';
            if (kLower === 'shift') return 'shift down';
            if (kLower === 'control') return 'control down';
            return '';
          }).filter(Boolean);
          
          const lastKey = normalizedKeys[normalizedKeys.length - 1];
          
          if (modifiers.length > 0) {
            await execAsync(
              `osascript -e 'tell application "System Events" to keystroke "${lastKey.toLowerCase()}" using {${modifiers.join(', ')}}'`,
              { timeout: 5000 }
            );
          } else {
            await execAsync(
              `osascript -e 'tell application "System Events" to keystroke "${lastKey.toLowerCase()}"'`,
              { timeout: 5000 }
            );
          }
          break;
          
        case 'linux':
          const linuxHotkey = normalizedKeys
            .map(k => k.toLowerCase())
            .join('+');
          await execAsync(
            `xdotool key ${linuxHotkey}`,
            { timeout: 5000 }
          );
          break;
      }
      
      return success(undefined);
    } catch (error) {
      return failure(createError(
        AgentErrorCode.KEYBOARD_INPUT_FAILED,
        `快捷键执行失败: ${error instanceof Error ? error.message : String(error)}`,
        { details: { keys }, cause: error instanceof Error ? error : undefined }
      ));
    }
  }
  
  /**
   * 标准化键名
   */
  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      'enter': 'Enter',
      'return': 'Enter',
      'tab': 'Tab',
      'escape': 'Escape',
      'esc': 'Escape',
      'backspace': 'BackSpace',
      'delete': 'Delete',
      'space': 'Space',
      'arrowup': 'Up',
      'arrowdown': 'Down',
      'arrowleft': 'Left',
      'arrowright': 'Right',
      'up': 'Up',
      'down': 'Down',
      'left': 'Left',
      'right': 'Right',
      'home': 'Home',
      'end': 'End',
      'pageup': 'Page_Up',
      'pagedown': 'Page_Down',
      'f1': 'F1', 'f2': 'F2', 'f3': 'F3', 'f4': 'F4',
      'f5': 'F5', 'f6': 'F6', 'f7': 'F7', 'f8': 'F8',
      'f9': 'F9', 'f10': 'F10', 'f11': 'F11', 'f12': 'F12',
    };
    
    const lower = key.toLowerCase();
    return keyMap[lower] || key.toUpperCase();
  }
  
  /**
   * 转换为 Windows SendKeys 格式
   */
  private toWindowsKey(key: string): string {
    const keyMap: Record<string, string> = {
      'Enter': '{ENTER}',
      'Tab': '{TAB}',
      'Escape': '{ESC}',
      'BackSpace': '{BACKSPACE}',
      'Delete': '{DELETE}',
      'Space': ' ',
      'Up': '{UP}',
      'Down': '{DOWN}',
      'Left': '{LEFT}',
      'Right': '{RIGHT}',
      'Home': '{HOME}',
      'End': '{END}',
      'Page_Up': '{PGUP}',
      'Page_Down': '{PGDN}',
    };
    
    if (keyMap[key]) return keyMap[key];
    if (key.startsWith('F') && /^F\d+$/.test(key)) return `{${key}}`;
    return key;
  }
  
  /**
   * 转换为 Windows 修饰键格式
   */
  private toWindowsModifier(key: string): string {
    const modifierMap: Record<string, string> = {
      'Control': '^',
      'Shift': '+',
      'Alt': '%',
      'Super': '^',  // Windows 键映射为 Ctrl
    };
    
    if (modifierMap[key]) return modifierMap[key];
    return this.toWindowsKey(key);
  }
  
  /**
   * 转换为 macOS 键码
   */
  private toMacKeyCode(key: string): number {
    const keyCodeMap: Record<string, number> = {
      'A': 0, 'S': 1, 'D': 2, 'F': 3, 'H': 4, 'G': 5, 'Z': 6, 'X': 7,
      'C': 8, 'V': 9, 'B': 11, 'Q': 12, 'W': 13, 'E': 14, 'R': 15,
      'Y': 16, 'T': 17, '1': 18, '2': 19, '3': 20, '4': 21, '6': 22,
      '5': 23, '=': 24, '9': 25, '7': 26, '-': 27, '8': 28, '0': 29,
      ']': 30, 'O': 31, 'U': 32, '[': 33, 'I': 34, 'P': 35,
      'Enter': 36, 'L': 37, 'J': 38, "'": 39, 'K': 40, ';': 41,
      '\\': 42, ',': 43, '/': 44, 'N': 45, 'M': 46, '.': 47, 'Tab': 48,
      'Space': 49, '`': 50, 'BackSpace': 51, 'Escape': 53,
      'F1': 122, 'F2': 120, 'F3': 99, 'F4': 118, 'F5': 96, 'F6': 97,
      'F7': 98, 'F8': 100, 'F9': 101, 'F10': 109, 'F11': 103, 'F12': 111,
      'Up': 126, 'Down': 125, 'Left': 123, 'Right': 124,
      'Home': 115, 'End': 119, 'Page_Up': 116, 'Page_Down': 121,
    };
    
    return keyCodeMap[key] ?? 0;
  }
}
