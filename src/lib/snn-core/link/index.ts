/**
 * 链接层 - 统一导出
 */

export { LinkLayer, createLinkLayer } from './layer';
export type {
  ConceptId,
  LinkType,
  Link,
  LinkGroup,
  LinkLayerConfig,
  EmergedLinkCandidate,
  LinkToSynapseRule
} from './types';
export { LINK_SYNAPSE_RULES, DEFAULT_LINK_CONFIG } from './types';
