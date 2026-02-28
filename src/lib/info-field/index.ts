/**
 * 信息结构场 - 统一导出
 * 
 * 核心思想：
 * - 信息结构的变化 = 神经递质的传输
 * - 感受器是隐性黑盒子
 * - LLM 变换 = 神经传递
 */

// 信息场
export { InformationField, createInformationField } from './field';

// 感受器
export {
  Receptor,
  PerceptionReceptor,
  ThoughtReceptor,
  MemoryReceptor,
  EmotionReceptor,
  ExpressionReceptor,
  createReceptor
} from './receptor';

// 类型
export type {
  InformationStructure,
  InformationType,
  InformationTransformation,
  TransformationType,
  ReceptorType,
  ReceptorState,
  ReceptorConfig,
  TransmissionChannel,
  TransmissionResult,
  InformationFieldState,
  InformationFieldConfig
} from './types';
export { DEFAULT_FIELD_CONFIG } from './types';
