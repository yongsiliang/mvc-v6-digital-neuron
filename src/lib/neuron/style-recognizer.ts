/**
 * 用户风格识别
 * 
 * 不是"认证"，是"感觉"
 * 神经元通过风格向量距离，判断像不像聊过的人
 */

import { Space, distance, within } from './space';

/**
 * 风格门
 * 
 * 存在记忆空间里，代表一种"说话风格"
 */
export interface StyleDoor extends Space {
  /** 风格向量 */
  v: number[];
  /** 这个风格的代表对话 */
  samples: string[];
  /** 出现次数 */
  count: number;
  /** 最后出现时间 */
  lastSeen: number;
}

/**
 * 从文本提取风格特征
 * 
 * 简单、不精确，但够用
 */
export function extractStyle(text: string): number[] {
  const features: number[] = [];
  
  // 1. 句子平均长度 (归一化到0-1)
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
  const avgLength = sentences.length > 0 
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length / 100
    : 0.5;
  features.push(Math.min(1, avgLength));
  
  // 2. 标点密度
  const punctCount = (text.match(/[，。！？、；：""''（）]/g) || []).length;
  features.push(Math.min(1, punctCount / text.length * 10));
  
  // 3. 问号比例（好奇程度）
  const questionRatio = (text.match(/[？?]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, questionRatio));
  
  // 4. 感叹号比例（情绪强度）
  const exclamRatio = (text.match(/[！!]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, exclamRatio));
  
  // 5. 代词使用（"我"的比例）
  const pronounRatio = (text.match(/[我你他她它]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, pronounRatio));
  
  // 6. 数字使用（具体性）
  const numberRatio = (text.match(/\d/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, numberRatio));
  
  // 7. 英文比例
  const englishRatio = (text.match(/[a-zA-Z]/g) || []).length / Math.max(1, text.length) * 100;
  features.push(Math.min(1, englishRatio));
  
  // 8. 平均词长（复杂度）
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordLen = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length / 20
    : 0.5;
  features.push(Math.min(1, avgWordLen));
  
  // 填充到固定维度（比如16维）
  while (features.length < 16) {
    features.push(Math.random() * 0.1); // 随机噪声
  }
  
  return features.slice(0, 16);
}

/**
 * 风格识别器
 */
export class StyleRecognizer {
  /** 风格门列表 */
  private styleDoors: StyleDoor[] = [];
  
  /** 识别阈值：距离小于此值认为是同一风格 */
  private threshold = 0.3;
  
  /**
   * 识别：输入文本，返回最相似的风格
   */
  recognize(text: string): { style: StyleDoor | null; distance: number; isNew: boolean } {
    const styleVector = extractStyle(text);
    
    // 找最近的风格门
    let minDist = Infinity;
    let nearestStyle: StyleDoor | null = null;
    
    for (const door of this.styleDoors) {
      const d = distance(door.v, styleVector);
      if (d < minDist) {
        minDist = d;
        nearestStyle = door;
      }
    }
    
    // 判断是否新风格
    const isNew = minDist > this.threshold;
    
    return {
      style: isNew ? null : nearestStyle,
      distance: minDist,
      isNew,
    };
  }
  
  /**
   * 学习：记住这个风格
   */
  learn(text: string): StyleDoor {
    const styleVector = extractStyle(text);
    
    // 先尝试识别
    const { style, isNew } = this.recognize(text);
    
    if (!isNew && style) {
      // 已有风格，更新
      style.count++;
      style.lastSeen = Date.now();
      style.samples.push(text.slice(0, 50));
      if (style.samples.length > 5) style.samples.shift();
      
      // 向量稍微移动向新样本
      for (let i = 0; i < style.v.length; i++) {
        style.v[i] = style.v[i] * 0.9 + styleVector[i] * 0.1;
      }
      
      return style;
    }
    
    // 新风格，创建门
    const newStyle: StyleDoor = {
      v: styleVector,
      samples: [text.slice(0, 50)],
      count: 1,
      lastSeen: Date.now(),
    };
    
    this.styleDoors.push(newStyle);
    
    return newStyle;
  }
  
  /**
   * 获取所有风格
   */
  getAllStyles(): StyleDoor[] {
    return this.styleDoors;
  }
  
  /**
   * 获取风格数量
   */
  getStyleCount(): number {
    return this.styleDoors.length;
  }
}

// 单例
let styleRecognizer: StyleRecognizer | null = null;

export function getStyleRecognizer(): StyleRecognizer {
  if (!styleRecognizer) {
    styleRecognizer = new StyleRecognizer();
  }
  return styleRecognizer;
}
