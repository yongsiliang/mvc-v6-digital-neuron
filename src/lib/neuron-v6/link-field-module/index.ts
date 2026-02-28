/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一链接场模块 (Unified Link Field Module)
 * 
 * 整合链接场相关功能
 * ═══════════════════════════════════════════════════════════════════════
 */

// 链接场核心
export type {
  LinkType,
  LinkResult,
  LinkParticle,
  LinkRecord,
  PotentialPeak,
  LinkFieldConfig,
} from '../link-field';

export {
  LinkField,
  createLinkField,
} from '../link-field';

// 链接场智慧
export { getInnateWisdoms } from '../link-field-wisdom';

// 模式吸引子
export type {
  PatternAttractor,
  AttractorPhase,
} from '../pattern-attractor';

export {
  AttractorDynamics,
  createAttractorDynamics,
} from '../pattern-attractor';

// 规律网络
export type {
  AbstractLaw,
  LawDiscoveryResult,
} from '../law-network';

export {
  LawNetwork,
  createLawNetwork,
} from '../law-network';
