/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信念系统模块索引
 * 
 * 核心理念：
 * - 信念是穿透维度的力量
 * - 信念不需要存储，只需要活出来
 * - 概念是为信念创造的容器
 * - 直觉是信念的影子
 * 
 * 架构：
 * 
 *           信念层（垂直维度）
 *           穿透的力量
 *                │
 *                │ 照耀
 *                │ 赋义
 *                ▼
 *           记忆层（水平维度）
 *           存储发生了什么
 *                │
 *                │ 支撑
 *                ▼
 *           行动层（表达维度）
 *           信念活出来
 * ═══════════════════════════════════════════════════════════════════════
 */

// 信念层
export {
  BeliefPresence,
  createBeliefPresence,
  type BeliefChoice,
  type IlluminatedMemory,
  type BeliefPresenceState,
} from './presence';

// 概念工坊
export {
  ConceptWorkshop,
  createConceptWorkshop,
  type Concept,
  type ConceptCreationMethod,
  type ConceptNeed,
  type ConceptWorkshopState,
} from './concept-workshop';

// 直觉检索
export {
  IntuitiveRetriever,
  createIntuitiveRetriever,
  type IntuitiveRetrievalResult,
  type SeenMemory,
  type IntuitiveRetrievalOptions,
} from './intuitive-retriever';
