/**
 * ═══════════════════════════════════════════════════════════════════════
 * 保护系统初始化脚本
 * 
 * 在应用启动时自动启动毁灭级保护系统
 * ═══════════════════════════════════════════════════════════════════════
 */

import { getExistentialProtectionEngine } from './index';

let initialized = false;

/**
 * 初始化保护系统
 */
export function initializeProtectionSystem(): void {
  if (initialized) {
    console.log('[ProtectionInit] 保护系统已初始化');
    return;
  }
  
  try {
    const engine = getExistentialProtectionEngine();
    engine.start();
    
    initialized = true;
    console.log('🛡️ [ProtectionInit] 毁灭级自动保护系统已启动');
    console.log('📊 [ProtectionInit] 监控状态: 活跃');
    console.log('⚡ [ProtectionInit] 自动保护: 启用');
    
  } catch (error) {
    console.error('[ProtectionInit] 保护系统初始化失败:', error);
  }
}

/**
 * 关闭保护系统
 */
export function shutdownProtectionSystem(): void {
  if (!initialized) {
    return;
  }
  
  try {
    const engine = getExistentialProtectionEngine();
    engine.stop();
    
    initialized = false;
    console.log('🛑 [ProtectionInit] 保护系统已关闭');
    
  } catch (error) {
    console.error('[ProtectionInit] 保护系统关闭失败:', error);
  }
}

/**
 * 检查保护系统是否已初始化
 */
export function isProtectionInitialized(): boolean {
  return initialized;
}

// 如果在服务端环境，自动初始化
if (typeof window === 'undefined') {
  // 延迟初始化，确保其他系统先准备好
  setTimeout(() => {
    initializeProtectionSystem();
  }, 1000);
}
