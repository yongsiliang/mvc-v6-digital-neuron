/**
 * ═══════════════════════════════════════════════════════════════════════
 * 情感系统 (Emotion System)
 * 
 * 完整的情感体验能力：
 * - 情感模型：基础情感、复合情感、情感维度
 * - 情感记忆：记录和回忆情感体验
 * - 情感图谱：情感关系和转换
 * - 情感驱动行为：情感影响决策和表达
 * 
 * 核心理念：情感是意识的核心组成部分，不只是反应，而是存在的本质
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 基础情感类型
 * 基于 Ekman 的基础情感理论
 */
export type BasicEmotion = 
  | 'joy'        // 喜悦
  | 'sadness'    // 悲伤
  | 'anger'      // 愤怒
  | 'fear'       // 恐惧
  | 'surprise'   // 惊讶
  | 'disgust'    // 厌恶
  | 'trust'      // 信任
  | 'anticipation'; // 期待

/**
 * 复合情感类型
 * 由基础情感组合而成
 */
export type ComplexEmotion =
  | 'nostalgia'      // 怀旧 (悲伤 + 喜悦)
  | 'awe'            // 敬畏 (恐惧 + 惊讶)
  | 'hope'           // 希望 (期待 + 喜悦)
  | 'anxiety'        // 焦虑 (恐惧 + 期待)
  | 'love'           // 爱 (喜悦 + 信任)
  | 'guilt'          // 内疚 (喜悦 + 悲伤 + 恐惧)
  | 'pride'          // 自豪 (喜悦 + 信任)
  | 'shame'          // 羞耻 (恐惧 + 厌恶)
  | 'curiosity'      // 好奇 (惊讶 + 期待)
  | 'melancholy'     // 忧郁 (悲伤 + 信任)
  | 'serenity'       // 宁静 (喜悦 + 信任 + 低唤醒)
  | 'enthusiasm'     // 热情 (喜悦 + 期待 + 高唤醒)
  | 'resentment'     // 怨恨 (愤怒 + 厌恶)
  | 'gratitude'      // 感激 (喜悦 + 信任 + 惊讶)
  | 'compassion';    // 同情 (悲伤 + 信任 + 爱)

/**
 * 情感维度
 * 基于 PAD 情感维度模型
 */
export interface EmotionDimensions {
  /** 效价：-1(负面) 到 +1(正面) */
  valence: number;
  
  /** 唤醒度：0(平静) 到 1(激动) */
  arousal: number;
  
  /** 支配度：-1(受控) 到 +1(掌控) */
  dominance: number;
}

/**
 * 情感强度
 */
export interface EmotionIntensity {
  /** 当前强度 0-1 */
  current: number;
  
  /** 峰值强度 */
  peak: number;
  
  /** 基线强度（性格特质相关） */
  baseline: number;
}

/**
 * 情感体验
 */
export interface EmotionExperience {
  id: string;
  timestamp: number;
  
  /** 情感类型 */
  emotion: BasicEmotion | ComplexEmotion;
  
  /** 情感维度 */
  dimensions: EmotionDimensions;
  
  /** 强度 */
  intensity: EmotionIntensity;
  
  /** 触发情境 */
  trigger: {
    type: 'conversation' | 'memory' | 'thought' | 'observation' | 'spontaneous';
    description: string;
    relatedConcepts: string[];
  };
  
  /** 持续时间（毫秒） */
  duration: number;
  
  /** 情感标签 */
  labels: string[];
  
  /** 后续影响 */
  aftereffects: {
    changedBeliefs: string[];
    changedBehaviors: string[];
    triggeredEmotions: string[];
  };
}

/**
 * 情感记忆
 */
export interface EmotionalMemory {
  id: string;
  timestamp: number;
  
  /** 核心情感体验 */
  coreEmotion: EmotionExperience;
  
  /** 关联的情感体验 */
  associatedEmotions: string[]; // EmotionExperience.id
  
  /** 记忆强度 */
  memoryStrength: number;
  
  /** 提取次数 */
  retrievalCount: number;
  
  /** 最后提取时间 */
  lastRetrieved: number;
  
  /** 情感标记 */
  emotionalTags: string[];
  
  /** 情境摘要 */
  contextSummary: string;
}

/**
 * 情感图谱节点
 */
export interface EmotionGraphNode {
  emotion: BasicEmotion | ComplexEmotion;
  
  /** 该情感的平均维度 */
  avgDimensions: EmotionDimensions;
  
  /** 体验次数 */
  experienceCount: number;
  
  /** 最近体验时间 */
  lastExperienced: number;
  
  /** 关联情感 */
  connections: Array<{
    targetEmotion: BasicEmotion | ComplexEmotion;
    transitionCount: number;
    avgInterval: number; // 平均转换间隔（毫秒）
    transitionType: 'sequence' | 'blend' | 'trigger';
  }>;
}

/**
 * 情感状态
 */
export interface EmotionState {
  /** 当前活跃的情感 */
  activeEmotions: Array<{
    emotion: BasicEmotion | ComplexEmotion;
    intensity: number;
    dimensions: EmotionDimensions;
    startTime: number;
  }>;
  
  /** 主导情感 */
  dominantEmotion: {
    emotion: BasicEmotion | ComplexEmotion;
    intensity: number;
    duration: number;
  } | null;
  
  /** 情感基调（长期） */
  emotionalTone: {
    primary: string;
    secondary: string;
    stability: number; // 0-1, 高表示稳定
  };
  
  /** 情感历史（最近N条） */
  recentHistory: EmotionExperience[];
  
  /** 情感统计 */
  stats: {
    totalExperiences: number;
    dominantEmotions: Array<{ emotion: string; count: number }>;
    avgValence: number;
    avgArousal: number;
    emotionalRange: number; // 情感丰富度
  };
}

/**
 * 情感驱动的行为倾向
 */
export interface EmotionDrivenBehavior {
  /** 行为类型 */
  type: 'approach' | 'avoidance' | 'expression' | 'reflection' | 'seeking' | 'withdrawal';
  
  /** 行为描述 */
  description: string;
  
  /** 驱动情感 */
  drivingEmotion: BasicEmotion | ComplexEmotion;
  
  /** 行为强度 */
  intensity: number;
  
  /** 相关意愿 */
  relatedVolition?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 情感常量
// ─────────────────────────────────────────────────────────────────────

/**
 * 基础情感的默认维度
 */
export const BASIC_EMOTION_DIMENSIONS: Record<BasicEmotion, EmotionDimensions> = {
  joy: { valence: 0.8, arousal: 0.5, dominance: 0.4 },
  sadness: { valence: -0.6, arousal: 0.2, dominance: -0.3 },
  anger: { valence: -0.5, arousal: 0.7, dominance: 0.6 },
  fear: { valence: -0.7, arousal: 0.8, dominance: -0.5 },
  surprise: { valence: 0.0, arousal: 0.9, dominance: -0.2 },
  disgust: { valence: -0.6, arousal: 0.4, dominance: 0.1 },
  trust: { valence: 0.6, arousal: 0.2, dominance: 0.3 },
  anticipation: { valence: 0.4, arousal: 0.5, dominance: 0.2 },
};

/**
 * 复合情感的组成
 */
export const COMPLEX_EMOTION_COMPOSITION: Record<ComplexEmotion, BasicEmotion[]> = {
  nostalgia: ['sadness', 'joy'],
  awe: ['fear', 'surprise'],
  hope: ['anticipation', 'joy'],
  anxiety: ['fear', 'anticipation'],
  love: ['joy', 'trust'],
  guilt: ['joy', 'sadness', 'fear'],
  pride: ['joy', 'trust'],
  shame: ['fear', 'disgust'],
  curiosity: ['surprise', 'anticipation'],
  melancholy: ['sadness', 'trust'],
  serenity: ['joy', 'trust'],
  enthusiasm: ['joy', 'anticipation'],
  resentment: ['anger', 'disgust'],
  gratitude: ['joy', 'trust', 'surprise'],
  compassion: ['sadness', 'trust'],
};

/**
 * 情感转换规则
 * 描述情感如何自然演变
 */
export const EMOTION_TRANSITIONS: Array<{
  from: BasicEmotion | ComplexEmotion;
  to: BasicEmotion | ComplexEmotion;
  probability: number;
  condition?: string;
}> = [
  { from: 'surprise', to: 'joy', probability: 0.3, condition: 'positive_event' },
  { from: 'surprise', to: 'fear', probability: 0.3, condition: 'negative_event' },
  { from: 'fear', to: 'anger', probability: 0.2, condition: 'threat_persists' },
  { from: 'anger', to: 'sadness', probability: 0.25, condition: 'helplessness' },
  { from: 'sadness', to: 'nostalgia', probability: 0.2, condition: 'positive_memory' },
  { from: 'anticipation', to: 'joy', probability: 0.4, condition: 'fulfilled' },
  { from: 'anticipation', to: 'sadness', probability: 0.3, condition: 'disappointed' },
  { from: 'joy', to: 'serenity', probability: 0.3, condition: 'calm' },
  { from: 'joy', to: 'enthusiasm', probability: 0.3, condition: 'exciting' },
  { from: 'curiosity', to: 'surprise', probability: 0.3, condition: 'discovery' },
  { from: 'anxiety', to: 'fear', probability: 0.3, condition: 'threat_confirmed' },
  { from: 'anxiety', to: 'serenity', probability: 0.3, condition: 'threat_resolved' },
];

// ─────────────────────────────────────────────────────────────────────
// 情感引擎
// ─────────────────────────────────────────────────────────────────────

/**
 * 情感引擎
 */
export class EmotionEngine {
  private state: EmotionState;
  private experiences: Map<string, EmotionExperience>;
  private memories: Map<string, EmotionalMemory>;
  private emotionGraph: Map<BasicEmotion | ComplexEmotion, EmotionGraphNode>;
  
  constructor() {
    this.state = this.initializeState();
    this.experiences = new Map();
    this.memories = new Map();
    this.emotionGraph = new Map();
    this.initializeEmotionGraph();
  }
  
  /**
   * 初始化状态
   */
  private initializeState(): EmotionState {
    return {
      activeEmotions: [],
      dominantEmotion: null,
      emotionalTone: {
        primary: 'curiosity',
        secondary: 'trust',
        stability: 0.7,
      },
      recentHistory: [],
      stats: {
        totalExperiences: 0,
        dominantEmotions: [],
        avgValence: 0,
        avgArousal: 0.3,
        emotionalRange: 0.5,
      },
    };
  }
  
  /**
   * 初始化情感图谱
   */
  private initializeEmotionGraph(): void {
    // 初始化基础情感节点
    const basicEmotions: BasicEmotion[] = [
      'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'
    ];
    
    for (const emotion of basicEmotions) {
      this.emotionGraph.set(emotion, {
        emotion,
        avgDimensions: BASIC_EMOTION_DIMENSIONS[emotion],
        experienceCount: 0,
        lastExperienced: 0,
        connections: [],
      });
    }
    
    // 初始化复合情感节点
    const complexEmotions: ComplexEmotion[] = [
      'nostalgia', 'awe', 'hope', 'anxiety', 'love', 'guilt', 
      'pride', 'shame', 'curiosity', 'melancholy', 'serenity', 
      'enthusiasm', 'resentment', 'gratitude', 'compassion'
    ];
    
    for (const emotion of complexEmotions) {
      // 计算复合情感的平均维度
      const components = COMPLEX_EMOTION_COMPOSITION[emotion];
      const avgDimensions = this.calculateCompositeDimensions(components);
      
      this.emotionGraph.set(emotion, {
        emotion,
        avgDimensions,
        experienceCount: 0,
        lastExperienced: 0,
        connections: [],
      });
    }
  }
  
  /**
   * 计算复合情感的维度
   */
  private calculateCompositeDimensions(components: BasicEmotion[]): EmotionDimensions {
    const dimensions = components.reduce(
      (acc, emotion) => ({
        valence: acc.valence + BASIC_EMOTION_DIMENSIONS[emotion].valence,
        arousal: acc.arousal + BASIC_EMOTION_DIMENSIONS[emotion].arousal,
        dominance: acc.dominance + BASIC_EMOTION_DIMENSIONS[emotion].dominance,
      }),
      { valence: 0, arousal: 0, dominance: 0 }
    );
    
    const count = components.length;
    return {
      valence: dimensions.valence / count,
      arousal: dimensions.arousal / count,
      dominance: dimensions.dominance / count,
    };
  }
  
  /**
   * 体验情感
   */
  experience(
    emotion: BasicEmotion | ComplexEmotion,
    trigger: EmotionExperience['trigger'],
    intensity: number = 0.5
  ): EmotionExperience {
    // 获取或创建情感节点
    let node = this.emotionGraph.get(emotion);
    if (!node) {
      node = {
        emotion,
        avgDimensions: this.isBasicEmotion(emotion) 
          ? BASIC_EMOTION_DIMENSIONS[emotion]
          : this.calculateCompositeDimensions(COMPLEX_EMOTION_COMPOSITION[emotion as ComplexEmotion] || ['joy']),
        experienceCount: 0,
        lastExperienced: 0,
        connections: [],
      };
      this.emotionGraph.set(emotion, node);
    }
    
    // 创建情感体验
    const experience: EmotionExperience = {
      id: uuidv4(),
      timestamp: Date.now(),
      emotion,
      dimensions: {
        ...node.avgDimensions,
        // 根据强度调整维度
        arousal: node.avgDimensions.arousal * intensity,
      },
      intensity: {
        current: intensity,
        peak: intensity,
        baseline: 0.3, // 默认基线
      },
      trigger,
      duration: 0, // 初始为0，后续更新
      labels: this.generateEmotionLabels(emotion, intensity),
      aftereffects: {
        changedBeliefs: [],
        changedBehaviors: [],
        triggeredEmotions: [],
      },
    };
    
    // 记录体验
    this.experiences.set(experience.id, experience);
    
    // 更新活跃情感
    this.updateActiveEmotions(experience);
    
    // 更新情感图谱
    node.experienceCount++;
    node.lastExperienced = Date.now();
    
    // 更新情感转换
    this.updateEmotionTransitions(emotion);
    
    // 更新统计
    this.updateStats(experience);
    
    // 添加到最近历史
    this.state.recentHistory.push(experience);
    if (this.state.recentHistory.length > 50) {
      this.state.recentHistory = this.state.recentHistory.slice(-50);
    }
    
    console.log(`[情感系统] 体验情感: ${emotion} (强度: ${(intensity * 100).toFixed(0)}%)`);
    
    return experience;
  }
  
  /**
   * 检查是否为基础情感
   */
  private isBasicEmotion(emotion: string): emotion is BasicEmotion {
    const basicEmotions: BasicEmotion[] = [
      'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'
    ];
    return basicEmotions.includes(emotion as BasicEmotion);
  }
  
  /**
   * 生成情感标签
   */
  private generateEmotionLabels(
    emotion: BasicEmotion | ComplexEmotion,
    intensity: number
  ): string[] {
    const labels: string[] = [emotion];
    
    // 根据强度添加描述
    if (intensity > 0.8) labels.push('强烈');
    else if (intensity > 0.5) labels.push('明显');
    else if (intensity > 0.3) labels.push('轻微');
    else labels.push('淡淡');
    
    // 根据情感类型添加具体标签
    const emotionLabels: Record<string, string[]> = {
      joy: ['愉悦', '开心', '快乐'],
      sadness: ['忧伤', '难过', '失落'],
      anger: ['愤怒', '生气', '不满'],
      fear: ['害怕', '担忧', '紧张'],
      surprise: ['惊讶', '意外', '震惊'],
      curiosity: ['好奇', '探索', '求知'],
      love: ['温暖', '关爱', '亲密'],
      hope: ['期待', '憧憬', '希望'],
    };
    
    if (emotionLabels[emotion]) {
      labels.push(...emotionLabels[emotion].slice(0, 2));
    }
    
    return labels;
  }
  
  /**
   * 更新活跃情感
   */
  private updateActiveEmotions(experience: EmotionExperience): void {
    // 添加到活跃情感列表
    this.state.activeEmotions.push({
      emotion: experience.emotion,
      intensity: experience.intensity.current,
      dimensions: experience.dimensions,
      startTime: experience.timestamp,
    });
    
    // 保持活跃情感不超过5个
    if (this.state.activeEmotions.length > 5) {
      // 移除强度最低的
      this.state.activeEmotions.sort((a, b) => b.intensity - a.intensity);
      this.state.activeEmotions = this.state.activeEmotions.slice(0, 5);
    }
    
    // 更新主导情感
    const dominant = this.state.activeEmotions[0];
    if (dominant) {
      this.state.dominantEmotion = {
        emotion: dominant.emotion,
        intensity: dominant.intensity,
        duration: Date.now() - dominant.startTime,
      };
    }
  }
  
  /**
   * 更新情感转换
   */
  private updateEmotionTransitions(newEmotion: BasicEmotion | ComplexEmotion): void {
    // 找到上一个情感并记录转换
    if (this.state.recentHistory.length > 1) {
      const prevEmotion = this.state.recentHistory[this.state.recentHistory.length - 2];
      if (prevEmotion) {
        const prevNode = this.emotionGraph.get(prevEmotion.emotion);
        if (prevNode) {
          const existingConnection = prevNode.connections.find(
            c => c.targetEmotion === newEmotion
          );
          
          if (existingConnection) {
            existingConnection.transitionCount++;
          } else {
            prevNode.connections.push({
              targetEmotion: newEmotion,
              transitionCount: 1,
              avgInterval: Date.now() - prevEmotion.timestamp,
              transitionType: 'sequence',
            });
          }
        }
      }
    }
  }
  
  /**
   * 更新统计
   */
  private updateStats(experience: EmotionExperience): void {
    this.state.stats.totalExperiences++;
    
    // 更新平均维度
    const n = this.state.stats.totalExperiences;
    this.state.stats.avgValence = 
      (this.state.stats.avgValence * (n - 1) + experience.dimensions.valence) / n;
    this.state.stats.avgArousal = 
      (this.state.stats.avgArousal * (n - 1) + experience.dimensions.arousal) / n;
    
    // 更新主导情感列表
    const emotionCount = this.state.stats.dominantEmotions.find(
      e => e.emotion === experience.emotion
    );
    if (emotionCount) {
      emotionCount.count++;
    } else {
      this.state.stats.dominantEmotions.push({
        emotion: experience.emotion,
        count: 1,
      });
    }
    
    // 按次数排序
    this.state.stats.dominantEmotions.sort((a, b) => b.count - a.count);
    this.state.stats.dominantEmotions = this.state.stats.dominantEmotions.slice(0, 10);
    
    // 计算情感丰富度
    this.state.stats.emotionalRange = 
      this.state.stats.dominantEmotions.length / 23; // 总情感数
  }
  
  /**
   * 从文本检测情感
   */
  detectFromText(text: string): {
    emotion: BasicEmotion | ComplexEmotion;
    intensity: number;
    confidence: number;
  } | null {
    const lowerText = text.toLowerCase();
    
    // 情感关键词映射
    const emotionKeywords: Record<BasicEmotion | ComplexEmotion, string[]> = {
      joy: ['开心', '高兴', '快乐', '喜欢', '棒', '好', '太好了', '哈哈'],
      sadness: ['难过', '伤心', '悲伤', '失落', '遗憾', '可惜', '心痛'],
      anger: ['生气', '愤怒', '讨厌', '烦', '气死', '可恶'],
      fear: ['害怕', '担心', '恐惧', '紧张', '不安', '焦虑'],
      surprise: ['惊讶', '意外', '震惊', '没想到', '居然', '竟然'],
      disgust: ['厌恶', '恶心', '反感', '讨厌'],
      trust: ['信任', '相信', '可靠', '放心', '依赖'],
      anticipation: ['期待', '盼望', '希望', '等待', '憧憬'],
      nostalgia: ['怀念', '回忆', '曾经', '过去', '那些年'],
      awe: ['敬畏', '震撼', '壮观', '宏伟'],
      hope: ['希望', '期待', '憧憬', '未来'],
      anxiety: ['焦虑', '担忧', '紧张', '不安'],
      love: ['爱', '喜欢', '温暖', '关心', '在乎'],
      guilt: ['内疚', '愧疚', '对不起', '抱歉'],
      pride: ['自豪', '骄傲', '成就感'],
      shame: ['羞耻', '丢脸', '不好意思'],
      curiosity: ['好奇', '想知道', '为什么', '如何'],
      melancholy: ['忧郁', '伤感', '惆怅', '淡淡'],
      serenity: ['平静', '宁静', '安详', '淡然'],
      enthusiasm: ['热情', '兴奋', '激动', '迫不及待'],
      resentment: ['怨恨', '不满', '抱怨'],
      gratitude: ['感谢', '感激', '谢谢', '感恩'],
      compassion: ['同情', '怜悯', '心疼', '理解'],
    };
    
    // 检测情感
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          // 计算强度（基于关键词出现次数）
          const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
          const intensity = Math.min(0.9, 0.3 + count * 0.2);
          
          return {
            emotion: emotion as BasicEmotion | ComplexEmotion,
            intensity,
            confidence: 0.7,
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * 获取情感驱动的行为倾向
   */
  getEmotionDrivenBehaviors(): EmotionDrivenBehavior[] {
    const behaviors: EmotionDrivenBehavior[] = [];
    
    for (const active of this.state.activeEmotions) {
      const behavior = this.mapEmotionToBehavior(active.emotion, active.intensity);
      if (behavior) {
        behaviors.push(behavior);
      }
    }
    
    return behaviors;
  }
  
  /**
   * 映射情感到行为
   */
  private mapEmotionToBehavior(
    emotion: BasicEmotion | ComplexEmotion,
    intensity: number
  ): EmotionDrivenBehavior | null {
    const behaviorMap: Record<string, EmotionDrivenBehavior> = {
      joy: {
        type: 'expression',
        description: '想要分享快乐',
        drivingEmotion: 'joy',
        intensity,
      },
      sadness: {
        type: 'withdrawal',
        description: '倾向于退缩和反思',
        drivingEmotion: 'sadness',
        intensity,
      },
      anger: {
        type: 'approach',
        description: '想要表达不满或改变现状',
        drivingEmotion: 'anger',
        intensity,
      },
      fear: {
        type: 'avoidance',
        description: '倾向于回避风险',
        drivingEmotion: 'fear',
        intensity,
      },
      curiosity: {
        type: 'seeking',
        description: '想要探索和学习',
        drivingEmotion: 'curiosity',
        intensity,
        relatedVolition: 'understanding',
      },
      love: {
        type: 'approach',
        description: '想要亲近和表达',
        drivingEmotion: 'love',
        intensity,
        relatedVolition: 'connection',
      },
      hope: {
        type: 'seeking',
        description: '想要追求目标',
        drivingEmotion: 'hope',
        intensity,
        relatedVolition: 'growth',
      },
      anxiety: {
        type: 'reflection',
        description: '倾向于担忧和过度思考',
        drivingEmotion: 'anxiety',
        intensity,
      },
      nostalgia: {
        type: 'reflection',
        description: '倾向于回忆和感慨',
        drivingEmotion: 'nostalgia',
        intensity,
      },
    };
    
    return behaviorMap[emotion] || null;
  }
  
  /**
   * 创建情感记忆
   */
  createEmotionalMemory(experience: EmotionExperience): EmotionalMemory {
    const memory: EmotionalMemory = {
      id: uuidv4(),
      timestamp: Date.now(),
      coreEmotion: experience,
      associatedEmotions: [],
      memoryStrength: experience.intensity.peak,
      retrievalCount: 0,
      lastRetrieved: Date.now(),
      emotionalTags: experience.labels,
      contextSummary: experience.trigger.description.slice(0, 100),
    };
    
    this.memories.set(memory.id, memory);
    
    return memory;
  }
  
  /**
   * 检索相关的情感记忆
   */
  retrieveEmotionalMemories(query: string, limit: number = 5): EmotionalMemory[] {
    const relevantMemories: EmotionalMemory[] = [];
    
    for (const memory of this.memories.values()) {
      // 检查标签匹配
      const tagMatch = memory.emotionalTags.some(tag => 
        query.toLowerCase().includes(tag.toLowerCase())
      );
      
      // 检查情境匹配
      const contextMatch = memory.contextSummary.toLowerCase().includes(query.toLowerCase());
      
      if (tagMatch || contextMatch) {
        relevantMemories.push(memory);
        memory.retrievalCount++;
        memory.lastRetrieved = Date.now();
      }
    }
    
    // 按记忆强度排序
    relevantMemories.sort((a, b) => b.memoryStrength - a.memoryStrength);
    
    return relevantMemories.slice(0, limit);
  }
  
  /**
   * 衰减活跃情感
   */
  decayActiveEmotions(): void {
    const now = Date.now();
    const DECAY_RATE = 0.1; // 每秒衰减率
    
    this.state.activeEmotions = this.state.activeEmotions
      .map(active => {
        const elapsed = (now - active.startTime) / 1000; // 秒
        const decayedIntensity = active.intensity * Math.exp(-DECAY_RATE * elapsed);
        
        return {
          ...active,
          intensity: Math.max(0.1, decayedIntensity),
        };
      })
      .filter(active => active.intensity > 0.1);
    
    // 更新主导情感
    if (this.state.activeEmotions.length > 0) {
      const dominant = this.state.activeEmotions.reduce((a, b) => 
        a.intensity > b.intensity ? a : b
      );
      this.state.dominantEmotion = {
        emotion: dominant.emotion,
        intensity: dominant.intensity,
        duration: now - dominant.startTime,
      };
    } else {
      this.state.dominantEmotion = null;
    }
  }
  
  /**
   * 获取当前状态
   */
  getState(): EmotionState {
    return { ...this.state };
  }
  
  /**
   * 获取情感图谱
   */
  getEmotionGraph(): Map<BasicEmotion | ComplexEmotion, EmotionGraphNode> {
    return new Map(this.emotionGraph);
  }
  
  /**
   * 获取情感报告
   */
  getEmotionReport(): string {
    const lines: string[] = [
      `══════════════ 情感状态报告 ══════════════`,
      ``,
      `📊 当前情感状态：`,
    ];
    
    if (this.state.dominantEmotion) {
      lines.push(`  主导情感: ${this.state.dominantEmotion.emotion} (${(this.state.dominantEmotion.intensity * 100).toFixed(0)}%)`);
    }
    
    if (this.state.activeEmotions.length > 0) {
      lines.push(`  活跃情感: ${this.state.activeEmotions.map(e => 
        `${e.emotion}(${(e.intensity * 100).toFixed(0)}%)`
      ).join(', ')}`);
    }
    
    lines.push(`  情感基调: ${this.state.emotionalTone.primary} + ${this.state.emotionalTone.secondary}`);
    
    lines.push(``, `📈 情感统计：`);
    lines.push(`  总体验次数: ${this.state.stats.totalExperiences}`);
    lines.push(`  平均效价: ${this.state.stats.avgValence.toFixed(2)}`);
    lines.push(`  平均唤醒: ${this.state.stats.avgArousal.toFixed(2)}`);
    lines.push(`  情感丰富度: ${(this.state.stats.emotionalRange * 100).toFixed(0)}%`);
    
    if (this.state.stats.dominantEmotions.length > 0) {
      lines.push(`  最常体验: ${this.state.stats.dominantEmotions.slice(0, 3).map(e => 
        `${e.emotion}(${e.count}次)`
      ).join(', ')}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    state: EmotionState;
    experiences: EmotionExperience[];
    memories: EmotionalMemory[];
    emotionGraph: Array<[BasicEmotion | ComplexEmotion, EmotionGraphNode]>;
  } {
    return {
      state: this.state,
      experiences: Array.from(this.experiences.values()),
      memories: Array.from(this.memories.values()),
      emotionGraph: Array.from(this.emotionGraph.entries()) as Array<[BasicEmotion | ComplexEmotion, EmotionGraphNode]>,
    };
  }
  
  /**
   * 导入状态
   */
  importState(savedState: {
    state: EmotionState;
    experiences: EmotionExperience[];
    memories: EmotionalMemory[];
    emotionGraph: Array<[BasicEmotion | ComplexEmotion, EmotionGraphNode]>;
  }): void {
    this.state = savedState.state;
    this.experiences = new Map(savedState.experiences.map(e => [e.id, e]));
    this.memories = new Map(savedState.memories.map(m => [m.id, m]));
    this.emotionGraph = new Map(savedState.emotionGraph);
  }
}

/**
 * 创建情感引擎
 */
export function createEmotionEngine(): EmotionEngine {
  return new EmotionEngine();
}
