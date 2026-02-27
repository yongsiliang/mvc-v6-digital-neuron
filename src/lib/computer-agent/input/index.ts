/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 输入控制器
 * 
 * 整合鼠标和键盘控制
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  AgentConfig,
  IInputController,
  MouseOperation,
  KeyboardOperation,
  Point,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';
import { MouseController } from './mouse-controller';
import { KeyboardController } from './keyboard-controller';

/**
 * 创建输入控制器
 */
export function createInputController(config: AgentConfig): IInputController {
  const mouse = new MouseController(config);
  const keyboard = new KeyboardController(config);
  
  return {
    async executeMouse(operation: MouseOperation): Promise<Result<void, AgentError>> {
      switch (operation.action) {
        case 'click':
        case 'double_click':
        case 'right_click':
          return mouse.click(
            operation.position!,
            operation.action === 'double_click' ? 2 : 
            operation.action === 'right_click' ? 'right' : 'left'
          );
          
        case 'move':
          return mouse.move(operation.position!);
          
        case 'drag':
          return mouse.drag(operation.startPosition!, operation.position!);
          
        case 'scroll':
          return mouse.scroll(
            operation.scrollAmount || 3,
            operation.scrollDirection || 'down'
          );
          
        default:
          return failure(createError(
            AgentErrorCode.MOUSE_CLICK_FAILED,
            `未知的鼠标操作: ${operation.action}`
          ));
      }
    },
    
    async executeKeyboard(operation: KeyboardOperation): Promise<Result<void, AgentError>> {
      switch (operation.action) {
        case 'type':
          return keyboard.type(operation.text!, operation.interval);
          
        case 'press':
          return keyboard.press(operation.key!);
          
        case 'hotkey':
          return keyboard.hotkey(operation.keys!);
          
        default:
          return failure(createError(
            AgentErrorCode.KEYBOARD_INPUT_FAILED,
            `未知的键盘操作: ${operation.action}`
          ));
      }
    },
    
    async getMousePosition(): Promise<Result<Point, AgentError>> {
      return mouse.getPosition();
    },
  };
}

export { MouseController } from './mouse-controller';
export { KeyboardController } from './keyboard-controller';
