/**
 * 共振处理辅助函数
 * 包含共振引擎相关的纯计算逻辑
 */

import type { ResonanceEngine, ResonanceEngineState } from '../resonance-engine';

/**
 * 共振处理参数
 */
export interface ResonanceProcessParams {
  resonanceEngine: ResonanceEngine;
}

/**
 * 共振处理结果
 */
export interface ResonanceProcessResult {
  resonanceState: ResonanceEngineState;
  synchronyIndex: number;
  isResonant: boolean;
}

/**
 * 初始化共振引擎处理
 */
export function initializeResonanceProcessing(
  params: ResonanceProcessParams
): ResonanceProcessResult {
  const { resonanceEngine } = params;
  
  // 激活感知子系统
  resonanceEngine.activateSubsystem('perception', 0.8);
  
  // 执行共振引擎一步
  const resonanceState = resonanceEngine.step();
  
  console.log('[共振引擎] 同步指数:', resonanceState.synchronyIndex.toFixed(4));
  console.log('[共振引擎] 是否共振:', resonanceState.isResonant);
  if (resonanceState.resonance.isLocked) {
    console.log('[共振引擎] 锁定周期:', resonanceState.resonance.lockedPeriod?.toFixed(1), '步');
  }
  
  return {
    resonanceState,
    synchronyIndex: resonanceState.synchronyIndex,
    isResonant: resonanceState.isResonant,
  };
}

/**
 * 构建共振状态结果
 */
export function buildResonanceStateResult(
  resonanceState: ResonanceEngineState
) {
  return {
    synchronyIndex: resonanceState.synchronyIndex,
    isResonant: resonanceState.isResonant,
    resonance: resonanceState.resonance,
  };
}
