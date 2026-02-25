/**
 * ═══════════════════════════════════════════════════════════════════════
 * 用户认证工具
 * User Authentication Utilities
 * 
 * 功能：
 * - 提供简单的用户识别机制
 * - 支持未来集成 Clerk 等外部认证服务
 * - 使用 localStorage 存储 userId
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'neuron_user_id';
const USER_PREFS_KEY = 'neuron_user_prefs';

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  displayName?: string;
  createdAt: number;
  lastActiveAt: number;
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  autoSaveInterval: number;
  language: 'zh-CN' | 'en-US';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  autoSave: true,
  autoSaveInterval: 30000,
  language: 'zh-CN',
};

// ─────────────────────────────────────────────────────────────────────
// 客户端方法
// ─────────────────────────────────────────────────────────────────────

/**
 * 获取或创建用户ID（客户端）
 * 
 * @returns 用户ID
 */
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be used on the client side');
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
    
    // 创建用户信息
    const userInfo: UserInfo = {
      id: userId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    localStorage.setItem(`${USER_ID_KEY}_info`, JSON.stringify(userInfo));
  }
  
  // 更新最后活跃时间
  updateLastActive(userId);
  
  return userId;
}

/**
 * 获取用户信息
 */
export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  
  const info = localStorage.getItem(`${USER_ID_KEY}_info`);
  return info ? JSON.parse(info) : null;
}

/**
 * 更新最后活跃时间
 */
function updateLastActive(userId: string): void {
  const info = localStorage.getItem(`${USER_ID_KEY}_info`);
  if (info) {
    const userInfo = JSON.parse(info);
    userInfo.lastActiveAt = Date.now();
    localStorage.setItem(`${USER_ID_KEY}_info`, JSON.stringify(userInfo));
  }
}

/**
 * 获取用户偏好设置
 */
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  
  const prefs = localStorage.getItem(USER_PREFS_KEY);
  return prefs ? { ...DEFAULT_PREFERENCES, ...JSON.parse(prefs) } : DEFAULT_PREFERENCES;
}

/**
 * 更新用户偏好设置
 */
export function updateUserPreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  
  const current = getUserPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(updated));
}

/**
 * 清除用户数据（登出）
 */
export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(`${USER_ID_KEY}_info`);
  localStorage.removeItem(USER_PREFS_KEY);
}

// ─────────────────────────────────────────────────────────────────────
// 服务端方法
// ─────────────────────────────────────────────────────────────────────

/**
 * 从请求头获取用户ID（服务端）
 * 
 * 支持多种来源：
 * 1. X-User-Id 请求头
 * 2. Cookie 中的 user_id
 * 3. 未来可集成 Clerk 等认证服务
 */
export function getUserIdFromRequest(request: Request): string | null {
  // 1. 从请求头获取
  const headerUserId = request.headers.get('X-User-Id');
  if (headerUserId) return headerUserId;
  
  // 2. 从 Cookie 获取
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = new Map(
      cookieHeader.split(';').map(c => c.trim().split('=') as [string, string])
    );
    const cookieUserId = cookies.get('user_id');
    if (cookieUserId) return cookieUserId;
  }
  
  return null;
}

/**
 * 验证用户ID格式
 */
export function isValidUserId(userId: string): boolean {
  // UUID 格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

// ─────────────────────────────────────────────────────────────────────
// Clerk 集成预留接口
// ─────────────────────────────────────────────────────────────────────

/**
 * Clerk 认证适配器
 * 
 * 未来集成 Clerk 时，替换 getOrCreateUserId 的实现
 * 
 * 示例：
 * ```typescript
 * import { auth } from '@clerk/nextjs';
 * 
 * export async function getClerkUserId(): Promise<string | null> {
 *   const { userId } = auth();
 *   return userId;
 * }
 * ```
 */
export interface AuthAdapter {
  getUserId(): Promise<string | null>;
  getUserInfo?(): Promise<UserInfo | null>;
  signOut?(): Promise<void>;
}

// 当前使用的默认适配器（localStorage）
export const defaultAuthAdapter: AuthAdapter = {
  getUserId: async () => {
    if (typeof window === 'undefined') return null;
    return getOrCreateUserId();
  },
  getUserInfo: async () => {
    if (typeof window === 'undefined') return null;
    return getUserInfo();
  },
  signOut: async () => {
    clearUserData();
  },
};
