/**
 * 意识层级处理辅助函数
 * 包含意识层级相关的纯计算逻辑
 */

import type { ConsciousnessLayerEngine, LayerProcessResult as ImportedLayerResult, SelfObservationResult } from '../consciousness-layers';

/**
 * 意识层级处理参数
 */
export interface LayerProcessParams {
  layerEngine: ConsciousnessLayerEngine;
  input: string;
  resonanceEngine: {
    activateSubsystem: (name: string, value: number) => void;
  };
}

/**
 * 意识层级处理结果
 */
export interface LayerProcessResult {
  layerResults: ImportedLayerResult[];
  selfObservation: SelfObservationResult | null;
}

/**
 * 处理意识层级
 */
export async function processConsciousnessLayers(
  params: LayerProcessParams
): Promise<LayerProcessResult> {
  const { layerEngine, input, resonanceEngine } = params;
  
  // 激活理解子系统
  resonanceEngine.activateSubsystem('understanding', 0.6);
  
  const layerResult = await layerEngine.processInput(input);
  const { layerResults, selfObservation } = layerResult;
  
  console.log('[意识层级] 层级处理完成:', layerResults.map(r => r.level).join(' → '));
  if (selfObservation) {
    console.log('[自我观察]', selfObservation.iSeeMyself);
  }
  
  return { layerResults, selfObservation };
}
