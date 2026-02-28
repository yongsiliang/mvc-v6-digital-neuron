/**
 * 信息结构场 - 统一导出
 * 
 * 核心思想：
 * - 信息结构 = 经不同算法编码的不同表示
 * - 变换的目的：让信息能被感受器接收
 * - 感受器是隐性黑盒子
 */

// 信息结构（类已自动导出）
export {
  InformationStructure,
  SparseVectorStructure,
  DenseVectorStructure,
  AttentionStructure,
  KeyValueStructure,
  SequenceStructure,
  GraphStructure
} from './structures';

// 编码器
export type { Encoder, EncodingContext } from './encoders';
export {
  TermFrequencyEncoder,
  HashEncoder,
  AttentionEncoder,
  RandomProjectionEncoder,
  KeyValueEncoder,
  SequenceEncoder,
  GraphEncoder,
  EncoderRegistry,
  encoderRegistry
} from './encoders';

// 感受器
export type { Receptor, ReceptorState, ReceptorConfig } from './receptors';
export {
  RetrievalReceptor,
  SemanticReceptor,
  AssociationReceptor,
  StructureReceptor,
  SequenceReceptor,
  GraphReceptor,
  MultimodalReceptor,
  ReceptorRegistry,
  receptorRegistry
} from './receptors';

// 信息场
export type { InformationFieldConfig } from './field-v2';
export {
  InformationField,
  createInformationField
} from './field-v2';
