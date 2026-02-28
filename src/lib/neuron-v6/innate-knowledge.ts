/**
 * ═══════════════════════════════════════════════════════════════════════
 * 先天知识初始化器
 * 
 * 为神经元网络注入基础常识：
 * - 物理常识（空间、时间、因果关系）
 * - 生活常识（洗车需要车到场、走路会留下东西等）
 * - 逻辑陷阱模式（常见推理错误）
 * 
 * 这些是"先天"知识，类似人类的直觉
 * 后天学习会在这些基础上扩展
 * ═══════════════════════════════════════════════════════════════════════
 */

import { HebbianNetwork } from './hebbian-network';

/**
 * 概念定义
 */
interface ConceptDef {
  label: string;
  type: 'concept' | 'sensory' | 'emotion' | 'abstract';  // 与HebbianNeuron.type一致
  importance: number;  // 重要性 [0,1]
}

/**
 * 连接定义
 */
interface ConnectionDef {
  from: string;
  to: string;
  weight: number;      // 连接强度 [-1, 1]，负数表示抑制
  reasoning: string;   // 为什么这个连接存在
}

/**
 * 陷阱模式定义
 */
interface TrapDef {
  name: string;
  trigger: string[];   // 触发关键词
  trap: string;        // 陷阱描述
  correctAnswer: string; // 正确答案
  reasoning: string;   // 为什么是陷阱
}

// ═══════════════════════════════════════════════════════════════════════
// 基础概念库
// ═══════════════════════════════════════════════════════════════════════

const BASIC_CONCEPTS: ConceptDef[] = [
  // ─────────────────────────────────────────────────────────────────
  // 物理实体
  // ─────────────────────────────────────────────────────────────────
  { label: '车', type: 'concept', importance: 0.9 },
  { label: '人', type: 'concept', importance: 0.9 },
  { label: '家', type: 'concept', importance: 0.8 },
  { label: '位置', type: 'concept', importance: 0.9 },
  { label: '距离', type: 'concept', importance: 0.7 },
  { label: '东西', type: 'concept', importance: 0.6 },
  { label: '门', type: 'concept', importance: 0.5 },
  
  // ─────────────────────────────────────────────────────────────────
  // 场所
  // ─────────────────────────────────────────────────────────────────
  { label: '洗车店', type: 'concept', importance: 0.6 },
  { label: '加油站', type: 'concept', importance: 0.6 },
  { label: '商店', type: 'concept', importance: 0.5 },
  { label: '医院', type: 'concept', importance: 0.5 },
  { label: '餐厅', type: 'concept', importance: 0.5 },
  
  // ─────────────────────────────────────────────────────────────────
  // 动作
  // ─────────────────────────────────────────────────────────────────
  { label: '走路', type: 'concept', importance: 0.8 },
  { label: '开车', type: 'concept', importance: 0.8 },
  { label: '去', type: 'concept', importance: 0.7 },
  { label: '洗车', type: 'concept', importance: 0.6 },
  { label: '加油', type: 'concept', importance: 0.6 },
  { label: '拿', type: 'concept', importance: 0.6 },
  { label: '放', type: 'concept', importance: 0.6 },
  { label: '移动', type: 'concept', importance: 0.7 },
  
  // ─────────────────────────────────────────────────────────────────
  // 因果关系
  // ─────────────────────────────────────────────────────────────────
  { label: '需要', type: 'abstract', importance: 0.9 },
  { label: '导致', type: 'abstract', importance: 0.9 },
  { label: '因为', type: 'abstract', importance: 0.8 },
  { label: '所以', type: 'abstract', importance: 0.8 },
  { label: '如果', type: 'abstract', importance: 0.8 },
  { label: '那么', type: 'abstract', importance: 0.8 },
  
  // ─────────────────────────────────────────────────────────────────
  // 状态
  // ─────────────────────────────────────────────────────────────────
  { label: '在', type: 'abstract', importance: 0.8 },
  { label: '不在', type: 'abstract', importance: 0.8 },
  { label: '有', type: 'abstract', importance: 0.7 },
  { label: '没有', type: 'abstract', importance: 0.7 },
  { label: '可以', type: 'abstract', importance: 0.6 },
  { label: '不能', type: 'abstract', importance: 0.6 },
  
  // ─────────────────────────────────────────────────────────────────
  // 时间
  // ─────────────────────────────────────────────────────────────────
  { label: '现在', type: 'abstract', importance: 0.7 },
  { label: '之前', type: 'abstract', importance: 0.6 },
  { label: '之后', type: 'abstract', importance: 0.6 },
  { label: '同时', type: 'abstract', importance: 0.7 },
  
  // ─────────────────────────────────────────────────────────────────
  // 数量
  // ─────────────────────────────────────────────────────────────────
  { label: '近', type: 'concept', importance: 0.6 },
  { label: '远', type: 'concept', importance: 0.6 },
  { label: '多', type: 'concept', importance: 0.5 },
  { label: '少', type: 'concept', importance: 0.5 },
];

// ═══════════════════════════════════════════════════════════════════════
// 基础连接库（因果关系）
// ═══════════════════════════════════════════════════════════════════════

const BASIC_CONNECTIONS: ConnectionDef[] = [
  // ─────────────────────────────────────────────────────────────────
  // 物理约束：位置关系
  // ─────────────────────────────────────────────────────────────────
  {
    from: '走路',
    to: '人移动',
    weight: 0.9,
    reasoning: '走路是人移动的方式'
  },
  {
    from: '走路',
    to: '车不动',
    weight: 0.85,
    reasoning: '走路时车留在原地（除非推车）'
  },
  {
    from: '开车',
    to: '车移动',
    weight: 0.95,
    reasoning: '开车会让车移动到目的地'
  },
  {
    from: '开车',
    to: '人移动',
    weight: 0.9,
    reasoning: '开车时人随车移动'
  },
  
  // ─────────────────────────────────────────────────────────────────
  // 服务约束：需要对象到场
  // ─────────────────────────────────────────────────────────────────
  {
    from: '洗车',
    to: '车必须到场',
    weight: 0.95,
    reasoning: '洗车需要车在洗车店'
  },
  {
    from: '洗车',
    to: '需要车',
    weight: 0.95,
    reasoning: '洗车是针对车的服务'
  },
  {
    from: '加油',
    to: '车必须到场',
    weight: 0.95,
    reasoning: '加油需要车在加油站'
  },
  {
    from: '加油',
    to: '需要车',
    weight: 0.95,
    reasoning: '加油是针对车的服务'
  },
  
  // ─────────────────────────────────────────────────────────────────
  // 因果链：距离判断
  // ─────────────────────────────────────────────────────────────────
  {
    from: '近',
    to: '可以走路',
    weight: 0.7,
    reasoning: '距离近时走路是选项之一'
  },
  {
    from: '远',
    to: '应该开车',
    weight: 0.7,
    reasoning: '距离远时开车更合理'
  },
  
  // ─────────────────────────────────────────────────────────────────
  // 冲突关系（负权重）
  // ─────────────────────────────────────────────────────────────────
  {
    from: '走路',
    to: '洗车',
    weight: -0.6,
    reasoning: '走路去洗车店，车还在家，无法洗车'
  },
  {
    from: '走路',
    to: '加油',
    weight: -0.6,
    reasoning: '走路去加油站，车还在家，无法加油'
  },
  
  // ─────────────────────────────────────────────────────────────────
  // 正确做法
  // ─────────────────────────────────────────────────────────────────
  {
    from: '洗车',
    to: '开车去',
    weight: 0.85,
    reasoning: '洗车需要开车把车送到洗车店'
  },
  {
    from: '加油',
    to: '开车去',
    weight: 0.85,
    reasoning: '加油需要开车把车送到加油站'
  },
  
  // ─────────────────────────────────────────────────────────────────
  // 物体位置逻辑
  // ─────────────────────────────────────────────────────────────────
  {
    from: '人离开',
    to: '东西留下',
    weight: 0.8,
    reasoning: '人离开时，没有携带的东西会留下'
  },
  {
    from: '车在家',
    to: '人走路离开',
    weight: 0.7,
    reasoning: '如果车在家，人走路离开，车还在家'
  },
];

// ═══════════════════════════════════════════════════════════════════════
// 逻辑陷阱库
// ═══════════════════════════════════════════════════════════════════════

const LOGICAL_TRAPS: TrapDef[] = [
  {
    name: '洗车陷阱',
    trigger: ['洗车', '走路', '近'],
    trap: '问"洗车店很近，走路还是开车"，陷阱是：走路去车还在家',
    correctAnswer: '开车去，让车到洗车店',
    reasoning: '洗车需要车到场，走路去意味着车留在家里'
  },
  {
    name: '加油陷阱',
    trigger: ['加油', '走路', '近'],
    trap: '问"加油站很近，走路还是开车"，陷阱是：走路去车还在家',
    correctAnswer: '开车去，让车到加油站',
    reasoning: '加油需要车到场，走路去意味着车留在家里'
  },
  {
    name: '理发师悖论',
    trigger: ['理发师', '自己', '刮胡子'],
    trap: '理发师只给不自己刮胡子的人刮胡子，谁给理发师刮？',
    correctAnswer: '这是逻辑悖论，没有解',
    reasoning: '如果理发师自己刮，违反规则；如果别人刮，也违反规则'
  },
  {
    name: '距离陷阱',
    trigger: ['近', '走路', '开车', '服务'],
    trap: '距离近≠应该走路，要看是否需要带东西去',
    correctAnswer: '分析是否需要把某个东西带到目的地',
    reasoning: '近只影响便利性，不影响是否需要携带对象'
  },
  {
    name: '时间陷阱',
    trigger: ['还有', '时间', '来得及'],
    trap: '问"还有时间做X吗"，陷阱是：没说有多少时间',
    correctAnswer: '询问具体有多少时间',
    reasoning: '没有时间量的信息无法判断'
  },
];

// ═══════════════════════════════════════════════════════════════════════
// 初始化器类
// ═══════════════════════════════════════════════════════════════════════

/**
 * 先天知识初始化器
 */
export class InnateKnowledgeInitializer {
  private network: HebbianNetwork;
  
  constructor(network: HebbianNetwork) {
    this.network = network;
  }
  
  /**
   * 初始化所有先天知识
   */
  initialize(): {
    neuronsCreated: number;
    connectionsCreated: number;
    trapsRegistered: number;
  } {
    // 1. 创建概念神经元
    let neuronsCreated = 0;
    const neuronMap = new Map<string, string>(); // label -> id
    
    for (const concept of BASIC_CONCEPTS) {
      const neuron = this.network.createNeuron({
        label: concept.label,
        type: concept.type
      });
      neuronMap.set(concept.label, neuron.id);
      neuronsCreated++;
    }
    
    // 2. 创建连接
    let connectionsCreated = 0;
    
    for (const conn of BASIC_CONNECTIONS) {
      const fromId = neuronMap.get(conn.from);
      const toId = neuronMap.get(conn.to);
      
      if (fromId && toId) {
        this.network.createSynapse({
          from: fromId,
          to: toId,
          weight: conn.weight
        });
        connectionsCreated++;
      } else {
        // 如果目标神经元不存在，创建它
        if (!fromId) {
          const fromNeuron = this.network.createNeuron({
            label: conn.from,
            type: 'concept'
          });
          neuronMap.set(conn.from, fromNeuron.id);
          neuronsCreated++;
        }
        if (!toId) {
          const toNeuron = this.network.createNeuron({
            label: conn.to,
            type: 'concept'
          });
          neuronMap.set(conn.to, toNeuron.id);
          neuronsCreated++;
        }
        
        // 再次尝试创建连接
        this.network.createSynapse({
          from: neuronMap.get(conn.from)!,
          to: neuronMap.get(conn.to)!,
          weight: conn.weight
        });
        connectionsCreated++;
      }
    }
    
    // 3. 注册陷阱模式（存储在网络中）
    // 这里我们创建特殊的"陷阱检测"神经元
    for (const trap of LOGICAL_TRAPS) {
      const trapNeuron = this.network.createNeuron({
        label: `陷阱:${trap.name}`,
        type: 'abstract'
      });
      
      // 连接触发词
      for (const trigger of trap.trigger) {
        const triggerId = neuronMap.get(trigger);
        if (triggerId) {
          this.network.createSynapse({
            from: triggerId,
            to: trapNeuron.id,
            weight: 0.7
          });
        }
      }
    }
    
    return {
      neuronsCreated,
      connectionsCreated,
      trapsRegistered: LOGICAL_TRAPS.length
    };
  }
  
  /**
   * 获取陷阱模式
   */
  getTrapPatterns(): TrapDef[] {
    return LOGICAL_TRAPS;
  }
  
  /**
   * 检测输入是否匹配陷阱
   */
  detectTrap(input: string): TrapDef | null {
    const inputLower = input.toLowerCase();
    
    for (const trap of LOGICAL_TRAPS) {
      const matchCount = trap.trigger.filter(t => inputLower.includes(t)).length;
      // 需要匹配至少2个触发词
      if (matchCount >= 2) {
        return trap;
      }
    }
    
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 便捷函数
// ═══════════════════════════════════════════════════════════════════════

let initialized = false;

/**
 * 获取已初始化的网络
 */
export function getInitializedNetwork(): HebbianNetwork {
  const network = HebbianNetwork.getInstance();
  
  if (!initialized) {
    const initializer = new InnateKnowledgeInitializer(network);
    initializer.initialize();
    initialized = true;
  }
  
  return network;
}

/**
 * 重置并重新初始化
 */
export function resetAndInitialize(): {
  neuronsCreated: number;
  connectionsCreated: number;
  trapsRegistered: number;
} {
  HebbianNetwork.reset();
  initialized = false;
  
  const network = HebbianNetwork.getInstance();
  const initializer = new InnateKnowledgeInitializer(network);
  return initializer.initialize();
}
