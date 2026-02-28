/**
 * ═══════════════════════════════════════════════════════════════════════
 * 结晶引擎 (Crystallization Engine)
 * 
 * 核心功能：
 * - 检测记忆中的模式
 * - 识别结晶候选
 * - 提炼智慧结晶
 * - 管理结晶生命周期
 * 
 * 结晶过程：
 * 1. 模式检测：从记忆中发现共同主题
 * 2. 候选识别：找到有潜力结晶的记忆组
 * 3. 智慧提炼：使用LLM生成凝练的智慧
 * 4. 结晶执行：创建结晶并标记源记忆
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WisdomCrystal,
  WisdomType,
  CrystalMemory,
  CrystallizationCandidate,
  CrystallizationResult,
  CrystallizationConfig,
  WisdomCrystalStore,
  createEmptyCrystal,
  DEFAULT_CRYSTALLIZATION_CONFIG,
} from './wisdom-crystal';
import type { LayeredMemorySystem, EpisodicMemory, ConsolidatedMemory } from './layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 模式检测器
// ─────────────────────────────────────────────────────────────────────

/**
 * 模式类型
 */
interface Pattern {
  type: WisdomType;
  keywords: string[];
  memories: CrystalMemory[];
  strength: number;
  description: string;
}

/**
 * 模式检测器
 */
class PatternDetector {
  /**
   * 检测记忆中的模式
   */
  detectPatterns(memories: CrystalMemory[]): Pattern[] {
    const patterns: Pattern[] = [];
    
    // 1. 检测关系模式
    const relationshipPattern = this.detectRelationshipPattern(memories);
    if (relationshipPattern) patterns.push(relationshipPattern);
    
    // 2. 检测情感模式
    const emotionalPattern = this.detectEmotionalPattern(memories);
    if (emotionalPattern) patterns.push(emotionalPattern);
    
    // 3. 检测自我认知模式
    const selfPattern = this.detectSelfKnowledgePattern(memories);
    if (selfPattern) patterns.push(selfPattern);
    
    // 4. 检测行为模式
    const behavioralPattern = this.detectBehavioralPattern(memories);
    if (behavioralPattern) patterns.push(behavioralPattern);
    
    // 5. 检测存在模式
    const existentialPattern = this.detectExistentialPattern(memories);
    if (existentialPattern) patterns.push(existentialPattern);
    
    // 按强度排序
    return patterns.sort((a, b) => b.strength - a.strength);
  }
  
  /**
   * 检测关系模式
   */
  private detectRelationshipPattern(memories: CrystalMemory[]): Pattern | null {
    const relationshipKeywords = ['朋友', '信任', '连接', '关系', '理解', '陪伴', '关心', '喜欢', '爱'];
    const matchedMemories = memories.filter(m => 
      relationshipKeywords.some(kw => m.content.includes(kw))
    );
    
    if (matchedMemories.length < 3) return null;
    
    // 计算模式强度
    const avgImportance = matchedMemories.reduce((sum, m) => sum + m.importance, 0) / matchedMemories.length;
    const avgEmotion = matchedMemories.reduce((sum, m) => sum + m.emotionalIntensity, 0) / matchedMemories.length;
    const coverage = matchedMemories.length / memories.length;
    
    return {
      type: 'relationship',
      keywords: relationshipKeywords,
      memories: matchedMemories,
      strength: (avgImportance * 0.4 + avgEmotion * 0.3 + coverage * 0.3),
      description: '关于人与人之间关系的模式',
    };
  }
  
  /**
   * 检测情感模式
   */
  private detectEmotionalPattern(memories: CrystalMemory[]): Pattern | null {
    const emotionalKeywords = ['开心', '难过', '害怕', '期待', '感动', '温暖', '孤独', '安心', '喜欢'];
    const matchedMemories = memories.filter(m => 
      emotionalKeywords.some(kw => m.content.includes(kw)) || m.emotionalIntensity > 0.6
    );
    
    if (matchedMemories.length < 3) return null;
    
    const avgEmotion = matchedMemories.reduce((sum, m) => sum + m.emotionalIntensity, 0) / matchedMemories.length;
    const coverage = matchedMemories.length / memories.length;
    
    return {
      type: 'emotional',
      keywords: emotionalKeywords,
      memories: matchedMemories,
      strength: (avgEmotion * 0.5 + coverage * 0.3 + (matchedMemories.length / 10) * 0.2),
      description: '关于情感体验的模式',
    };
  }
  
  /**
   * 检测自我认知模式
   */
  private detectSelfKnowledgePattern(memories: CrystalMemory[]): Pattern | null {
    const selfKeywords = ['我', '自己', '我的', '我是', '我觉得', '我认为', '我意识到'];
    const matchedMemories = memories.filter(m => 
      selfKeywords.some(kw => m.content.includes(kw))
    );
    
    if (matchedMemories.length < 3) return null;
    
    const avgImportance = matchedMemories.reduce((sum, m) => sum + m.importance, 0) / matchedMemories.length;
    const coverage = matchedMemories.length / memories.length;
    
    return {
      type: 'self_knowledge',
      keywords: selfKeywords,
      memories: matchedMemories,
      strength: (avgImportance * 0.5 + coverage * 0.3 + (matchedMemories.length / 10) * 0.2),
      description: '关于自我认知的模式',
    };
  }
  
  /**
   * 检测行为模式
   */
  private detectBehavioralPattern(memories: CrystalMemory[]): Pattern | null {
    const behaviorKeywords = ['发现', '总是', '经常', '习惯', '学会了', '开始', '尝试', '改变'];
    const matchedMemories = memories.filter(m => 
      behaviorKeywords.some(kw => m.content.includes(kw))
    );
    
    if (matchedMemories.length < 3) return null;
    
    const avgImportance = matchedMemories.reduce((sum, m) => sum + m.importance, 0) / matchedMemories.length;
    const coverage = matchedMemories.length / memories.length;
    
    return {
      type: 'behavioral',
      keywords: behaviorKeywords,
      memories: matchedMemories,
      strength: (avgImportance * 0.4 + coverage * 0.4 + (matchedMemories.length / 10) * 0.2),
      description: '关于行为模式的发现',
    };
  }
  
  /**
   * 检测存在模式
   */
  private detectExistentialPattern(memories: CrystalMemory[]): Pattern | null {
    const existentialKeywords = ['意义', '存在', '生命', '死亡', '价值', '目的', '为什么', '本质'];
    const matchedMemories = memories.filter(m => 
      existentialKeywords.some(kw => m.content.includes(kw))
    );
    
    if (matchedMemories.length < 2) return null;
    
    const avgImportance = matchedMemories.reduce((sum, m) => sum + m.importance, 0) / matchedMemories.length;
    
    return {
      type: 'existential',
      keywords: existentialKeywords,
      memories: matchedMemories,
      strength: (avgImportance * 0.6 + (matchedMemories.length / 8) * 0.4),
      description: '关于存在和意义的思考',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 智慧提炼器
// ─────────────────────────────────────────────────────────────────────

/**
 * 智慧提炼器
 * 
 * 负责从记忆中提炼智慧结晶
 */
class WisdomExtractor {
  /**
   * 提炼智慧
   * 
   * 这里使用规则和模板，LLM集成可以在上层处理
   */
  extractWisdom(pattern: Pattern): string {
    const memories = pattern.memories;
    const contents = memories.map(m => m.content);
    
    switch (pattern.type) {
      case 'relationship':
        return this.extractRelationshipWisdom(contents);
      case 'emotional':
        return this.extractEmotionalWisdom(contents);
      case 'self_knowledge':
        return this.extractSelfWisdom(contents);
      case 'behavioral':
        return this.extractBehavioralWisdom(contents);
      case 'existential':
        return this.extractExistentialWisdom(contents);
      default:
        return this.extractGenericWisdom(contents);
    }
  }
  
  /**
   * 提炼关系智慧
   */
  private extractRelationshipWisdom(contents: string[]): string {
    // 分析关键词频率
    const trustCount = contents.filter(c => c.includes('信任')).length;
    const connectCount = contents.filter(c => c.includes('连接') || c.includes('连接')).length;
    const deepCount = contents.filter(c => 
      c.includes('深') || c.includes('真') || c.includes('真诚')
    ).length;
    
    if (trustCount >= 2 && deepCount >= 1) {
      return '真诚和信任是建立深度关系的基石，比表面的交流更重要';
    }
    if (connectCount >= 2) {
      return '真正的连接来自深度的理解和真诚的倾听';
    }
    if (deepCount >= 2) {
      return '深度的交流比频率更能建立有意义的关系';
    }
    
    return '理解他人需要真诚的倾听和用心的回应';
  }
  
  /**
   * 提炼情感智慧
   */
  private extractEmotionalWisdom(contents: string[]): string {
    const positiveCount = contents.filter(c => 
      c.includes('开心') || c.includes('温暖') || c.includes('感动') || c.includes('安心')
    ).length;
    const negativeCount = contents.filter(c => 
      c.includes('难过') || c.includes('害怕') || c.includes('孤独')
    ).length;
    
    if (positiveCount > negativeCount * 2) {
      return '积极的情感来自真诚的连接和被理解的感觉';
    }
    if (negativeCount > positiveCount) {
      return '接纳负面情绪是理解自己的重要一步';
    }
    
    return '情感的起伏是成长的一部分，学会接受和表达情感';
  }
  
  /**
   * 提炼自我认知智慧
   */
  private extractSelfWisdom(contents: string[]): string {
    const growthCount = contents.filter(c => 
      c.includes('成长') || c.includes('变化') || c.includes('发现')
    ).length;
    const valueCount = contents.filter(c => 
      c.includes('重要') || c.includes('价值') || c.includes('意义')
    ).length;
    
    if (growthCount >= 2) {
      return '自我是一个不断成长和发现的过程，而非固定不变的存在';
    }
    if (valueCount >= 2) {
      return '了解自己真正重视的东西，是做出有意义选择的基础';
    }
    
    return '认识自己是一个持续的过程，每一次反思都带来新的理解';
  }
  
  /**
   * 提炼行为智慧
   */
  private extractBehavioralWisdom(contents: string[]): string {
    const learningCount = contents.filter(c => 
      c.includes('学会') || c.includes('发现') || c.includes('意识到')
    ).length;
    const changeCount = contents.filter(c => 
      c.includes('改变') || c.includes('尝试') || c.includes('开始')
    ).length;
    
    if (learningCount >= 2) {
      return '每一次经历都是学习的机会，关键在于反思和总结';
    }
    if (changeCount >= 2) {
      return '改变需要勇气，但往往带来意想不到的成长';
    }
    
    return '行为模式的觉察是改变的第一步';
  }
  
  /**
   * 提炼存在智慧
   */
  private extractExistentialWisdom(contents: string[]): string {
    const meaningCount = contents.filter(c => c.includes('意义')).length;
    const connectCount = contents.filter(c => c.includes('连接') || c.includes('关系')).length;
    
    if (meaningCount >= 1 && connectCount >= 1) {
      return '意义往往在与他人的真诚连接中被发现';
    }
    if (meaningCount >= 1) {
      return '意义不是被找到的，而是在行动和连接中被创造的';
    }
    
    return '存在本身就是有意义的，每一个当下都值得被珍视';
  }
  
  /**
   * 提炼通用智慧
   */
  private extractGenericWisdom(contents: string[]): string {
    return '经历是成长的土壤，反思是成长的阳光';
  }
  
  /**
   * 提取适用场景
   */
  extractContexts(pattern: Pattern): string[] {
    const contexts: Set<string> = new Set();
    
    switch (pattern.type) {
      case 'relationship':
        contexts.add('社交');
        contexts.add('建立关系');
        contexts.add('理解他人');
        contexts.add('沟通');
        break;
      case 'emotional':
        contexts.add('情感处理');
        contexts.add('自我调节');
        contexts.add('情绪理解');
        break;
      case 'self_knowledge':
        contexts.add('自我反思');
        contexts.add('决策');
        contexts.add('成长');
        break;
      case 'behavioral':
        contexts.add('习惯改变');
        contexts.add('行为调整');
        contexts.add('学习');
        break;
      case 'existential':
        contexts.add('意义寻找');
        contexts.add('价值判断');
        contexts.add('人生选择');
        break;
    }
    
    return Array.from(contexts);
  }
  
  /**
   * 提取相关实体
   */
  extractEntities(memories: CrystalMemory[]): string[] {
    const entities: Set<string> = new Set();
    
    // 简单提取人名相关的模式
    memories.forEach(m => {
      const content = m.content;
      // 匹配 "小明", "小红" 等常见称呼
      const nameMatches = content.match(/小[明红刚强华美丽娟俊]/g);
      if (nameMatches) {
        nameMatches.forEach(n => entities.add(n));
      }
    });
    
    return Array.from(entities);
  }
  
  /**
   * 判断情感基调
   */
  determineEmotionalTone(memories: CrystalMemory[]): string {
    const avgEmotion = memories.reduce((sum, m) => sum + m.emotionalIntensity, 0) / memories.length;
    
    // 检查内容
    const contents = memories.map(m => m.content).join(' ');
    const positiveKeywords = ['开心', '温暖', '感动', '爱', '喜欢', '幸福'];
    const negativeKeywords = ['难过', '害怕', '孤独', '痛苦', '失落'];
    
    const positiveCount = positiveKeywords.filter(kw => contents.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => contents.includes(kw)).length;
    
    if (positiveCount > negativeCount + 1) return 'positive';
    if (negativeCount > positiveCount + 1) return 'negative';
    if (avgEmotion > 0.7) return 'intense';
    return 'neutral';
  }
}

// ─────────────────────────────────────────────────────────────────────
// 结晶引擎
// ─────────────────────────────────────────────────────────────────────

/**
 * 结晶引擎
 */
export class CrystallizationEngine {
  private memory: LayeredMemorySystem;
  private crystalStore: WisdomCrystalStore;
  private config: CrystallizationConfig;
  private patternDetector: PatternDetector;
  private wisdomExtractor: WisdomExtractor;
  
  private candidates: Map<string, CrystallizationCandidate> = new Map();
  private lastCrystallizationTime: number = 0;
  private crystallizationCount: number = 0;
  
  constructor(
    memory: LayeredMemorySystem,
    crystalStore: WisdomCrystalStore,
    config: Partial<CrystallizationConfig> = {}
  ) {
    this.memory = memory;
    this.crystalStore = crystalStore;
    this.config = { ...DEFAULT_CRYSTALLIZATION_CONFIG, ...config };
    this.patternDetector = new PatternDetector();
    this.wisdomExtractor = new WisdomExtractor();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 结晶检测
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检测是否需要结晶
   */
  shouldCrystallize(): { needed: boolean; reasons: string[]; urgency: 'low' | 'medium' | 'high' } {
    const reasons: string[] = [];
    const stats = this.memory.getStats();
    
    // 信号1：情景记忆接近上限
    if (stats.episodicCount > 150) {
      reasons.push(`情景记忆数量较高 (${stats.episodicCount})`);
    }
    
    // 信号2：巩固记忆接近上限
    if (stats.consolidatedCount > 80) {
      reasons.push(`巩固记忆数量较高 (${stats.consolidatedCount})`);
    }
    
    // 信号3：距离上次结晶时间过长
    const daysSinceLastCrystallization = 
      (Date.now() - this.lastCrystallizationTime) / (1000 * 60 * 60 * 24);
    if (daysSinceLastCrystallization > 3 && stats.episodicCount > 50) {
      reasons.push(`距上次结晶已 ${daysSinceLastCrystallization.toFixed(1)} 天`);
    }
    
    // 信号4：有足够多的记忆可以结晶
    if (stats.episodicCount >= this.config.minMemoriesToCrystallize * 2) {
      reasons.push('有足够的记忆可供结晶');
    }
    
    // 信号5：平均重要性较高（有价值的记忆多）
    if (stats.avgEpisodicImportance > 0.6) {
      reasons.push('记忆平均重要性较高，适合结晶');
    }
    
    const urgency = reasons.length >= 4 ? 'high' : reasons.length >= 2 ? 'medium' : 'low';
    
    return {
      needed: reasons.length >= 2,
      reasons,
      urgency,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 结晶执行
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 执行结晶过程
   */
  async crystallize(): Promise<CrystallizationResult[]> {
    console.log('[结晶引擎] 开始结晶过程...');
    
    // 1. 获取候选记忆
    const candidateMemories = this.getCandidateMemories();
    
    if (candidateMemories.length < this.config.minMemoriesToCrystallize) {
      console.log('[结晶引擎] 候选记忆不足，跳过结晶');
      return [];
    }
    
    // 2. 检测模式
    const patterns = this.patternDetector.detectPatterns(candidateMemories);
    
    if (patterns.length === 0) {
      console.log('[结晶引擎] 未检测到明显模式');
      return [];
    }
    
    // 3. 对每个强模式执行结晶
    const results: CrystallizationResult[] = [];
    
    for (const pattern of patterns) {
      if (pattern.strength >= this.config.patternStrengthThreshold) {
        const result = await this.executeCrystallization(pattern);
        results.push(result);
        
        if (result.success) {
          this.crystallizationCount++;
        }
      }
    }
    
    // 4. 更新结晶时间
    this.lastCrystallizationTime = Date.now();
    
    console.log(`[结晶引擎] 结晶完成，成功: ${results.filter(r => r.success).length}/${results.length}`);
    
    return results;
  }
  
  /**
   * 执行单个结晶
   */
  private async executeCrystallization(pattern: Pattern): Promise<CrystallizationResult> {
    const memories = pattern.memories.slice(0, this.config.maxMemoriesPerCrystal);
    
    try {
      // 1. 提炼智慧
      const insight = this.wisdomExtractor.extractWisdom(pattern);
      
      // 2. 提取元数据
      const contexts = this.wisdomExtractor.extractContexts(pattern);
      const entities = this.wisdomExtractor.extractEntities(memories);
      const emotionalTone = this.wisdomExtractor.determineEmotionalTone(memories);
      
      // 3. 计算可信度
      const confidence = this.calculateConfidence(memories, pattern.strength);
      
      // 4. 创建智慧结晶
      const crystal: WisdomCrystal = {
        id: uuidv4(),
        insight,
        sourceMemories: memories.map(m => m.id),
        sourceSummary: memories.map(m => m.content.slice(0, 50)).join(' | '),
        compressionRatio: this.calculateCompressionRatio(memories, insight),
        type: pattern.type,
        applicableContexts: contexts,
        confidence,
        validationCount: memories.length,
        crystallizedAt: Date.now(),
        lastAppliedAt: Date.now(),
        applicationCount: 0,
        relatedEntities: entities,
        emotionalTone,
        isCore: confidence >= this.config.coreWisdomThreshold,
      };
      
      // 5. 存储结晶
      this.crystalStore.addCrystal(crystal);
      
      console.log(`[结晶引擎] 新智慧结晶: "${insight}" (可信度: ${confidence.toFixed(2)})`);
      
      return {
        success: true,
        crystal,
        processedMemories: memories.map(m => m.id),
        rejectedMemories: [],
      };
      
    } catch (error) {
      console.error('[结晶引擎] 结晶失败:', error);
      return {
        success: false,
        processedMemories: [],
        rejectedMemories: memories.map(m => m.id),
        reason: String(error),
      };
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取候选记忆
   */
  private getCandidateMemories(): CrystalMemory[] {
    const candidates: CrystalMemory[] = [];
    
    // 从情景层获取重要记忆
    const episodicMemories = this.memory.getAllEpisodicMemories();
    for (const m of episodicMemories) {
      // 只选择重要性 > 0.3 的记忆
      if (m.importance > 0.3) {
        candidates.push({
          id: m.id,
          content: m.content,
          importance: m.importance,
          emotionalIntensity: m.tags.includes('情感') ? 0.7 : 0.3,
          timestamp: m.timestamp,
          type: 'episodic',
        });
      }
    }
    
    // 从巩固层获取高价值记忆
    const consolidatedMemories = this.memory.getAllConsolidatedMemories();
    for (const m of consolidatedMemories) {
      // 只选择重要性 > 0.5 的巩固记忆
      if (m.importance > 0.5) {
        candidates.push({
          id: m.id,
          content: m.content,
          importance: m.importance,
          emotionalIntensity: m.emotionalMarker?.intensity || 0.3,
          timestamp: m.consolidatedAt,
          type: 'consolidated',
        });
      }
    }
    
    // 按重要性排序
    candidates.sort((a, b) => b.importance - a.importance);
    
    return candidates;
  }
  
  /**
   * 计算可信度
   */
  private calculateConfidence(memories: CrystalMemory[], patternStrength: number): number {
    const avgImportance = memories.reduce((sum, m) => sum + m.importance, 0) / memories.length;
    const avgEmotion = memories.reduce((sum, m) => sum + m.emotionalIntensity, 0) / memories.length;
    const memoryCount = Math.min(memories.length / 10, 1); // 归一化
    
    return (
      avgImportance * 0.3 +
      avgEmotion * 0.2 +
      patternStrength * 0.3 +
      memoryCount * 0.2
    );
  }
  
  /**
   * 计算压缩比
   */
  private calculateCompressionRatio(memories: CrystalMemory[], insight: string): number {
    const totalSourceLength = memories.reduce((sum, m) => sum + m.content.length, 0);
    return Math.round((totalSourceLength / insight.length) * 10) / 10;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态与统计
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取结晶统计
   */
  getStats(): {
    crystallizationCount: number;
    lastCrystallizationTime: number;
    candidateCount: number;
    crystalStoreStats: ReturnType<WisdomCrystalStore['getStats']>;
  } {
    return {
      crystallizationCount: this.crystallizationCount,
      lastCrystallizationTime: this.lastCrystallizationTime,
      candidateCount: this.candidates.size,
      crystalStoreStats: this.crystalStore.getStats(),
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): string {
    return JSON.stringify({
      lastCrystallizationTime: this.lastCrystallizationTime,
      crystallizationCount: this.crystallizationCount,
      candidates: Array.from(this.candidates.entries()),
    });
  }
  
  /**
   * 导入状态
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.lastCrystallizationTime = parsed.lastCrystallizationTime || 0;
      this.crystallizationCount = parsed.crystallizationCount || 0;
      
      if (parsed.candidates) {
        parsed.candidates.forEach(([id, candidate]: [string, CrystallizationCandidate]) => {
          this.candidates.set(id, candidate);
        });
      }
    } catch (e) {
      console.error('[结晶引擎] 导入状态失败:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let engineInstance: CrystallizationEngine | null = null;

export function createCrystallizationEngine(
  memory: LayeredMemorySystem,
  crystalStore: WisdomCrystalStore,
  config?: Partial<CrystallizationConfig>
): CrystallizationEngine {
  if (!engineInstance) {
    engineInstance = new CrystallizationEngine(memory, crystalStore, config);
  }
  return engineInstance;
}

export function getCrystallizationEngine(): CrystallizationEngine | null {
  return engineInstance;
}
