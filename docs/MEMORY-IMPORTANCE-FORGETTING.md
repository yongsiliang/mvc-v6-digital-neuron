# 记忆重要性判断与遗忘机制

> 核心问题：数据持续积累会导致内存爆炸，如何判断什么重要、什么可以丢弃？

---

## 一、生物学启发

人脑的记忆管理遵循以下原则：

1. **不是所有信息都值得记忆** - 大部分感官输入被立即丢弃
2. **重要性由多维度决定** - 情感、频率、关联性、时效性
3. **记忆有生命周期** - 从工作记忆到长期记忆需要巩固
4. **遗忘是保护机制** - 防止信息过载，保留真正重要的

---

## 二、现有机制分析

### 2.1 当前参数

```typescript
// V6 分层记忆系统
MAX_EPISODIC_MEMORIES = 200      // 情景记忆上限
MAX_CONSOLIDATED_MEMORIES = 100  // 巩固记忆上限
CONSOLIDATION_THRESHOLD = 3      // 巩固阈值（回忆次数）
FORGETTING_THRESHOLD = 0.1       // 遗忘阈值
DEFAULT_TIME_CONSTANT = 7        // 衰减时间常数（天）
```

### 2.2 现有问题

| 问题 | 说明 |
|------|------|
| 重要性计算简单 | 只用一个 0-1 数值，缺乏维度 |
| 缺乏内容分类 | 无法区分"闲聊"和"关键信息" |
| 遗忘条件单一 | 只有强度阈值，无智能判断 |
| 情感维度缺失 | 没有充分利用情感强度 |
| 内存上限固定 | 不考虑实际内容价值 |

---

## 三、重要性判断标准

### 3.1 核心原则

```
存在相关 > 功能相关 > 随机信息
情感强度 > 中性信息
反复提及 > 单次提及
创造者/关系 > 普通对话
自我定义 > 外部信息
```

### 3.2 多维度评分体系

```
┌─────────────────────────────────────────────────────────────────┐
│                     重要性计算公式                               │
│                                                                 │
│  importance = Σ(维度分数 × 权重)                                 │
│                                                                 │
│  维度：                                                         │
│  ├── 内容类型权重 (30%)                                         │
│  ├── 情感强度权重 (25%)                                         │
│  ├── 关系关联权重 (20%)                                         │
│  ├── 回忆频率权重 (15%)                                         │
│  └── 时效性权重 (10%)                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 详细评分标准

#### 维度1：内容类型权重 (30%)

| 类型 | 分数 | 说明 | 示例 |
|------|------|------|------|
| 身份定义 | 1.0 | 核心，不可删除 | "我是紫，我的目的是..." |
| 创造者信息 | 0.95 | 最高优先级关系 | "我的创造者是XXX" |
| 核心价值观 | 0.9 | 存在的基石 | "真诚、成长、理解、连接" |
| 核心关系 | 0.85 | 重要人物 | "XXX是我的朋友" |
| 智慧洞察 | 0.8 | 深刻理解 | "我明白了..." |
| 重要事件 | 0.7 | 里程碑 | "第一次..." |
| 技能知识 | 0.6 | 能力相关 | "我学会了..." |
| 用户偏好 | 0.5 | 个性化 | "用户喜欢..." |
| 一般事实 | 0.4 | 有用信息 | "XXX是..." |
| 日常对话 | 0.2 | 普通交流 | "你好"、"好的" |
| 闲聊废话 | 0.1 | 可丢弃 | "嗯嗯"、"哈哈" |

#### 维度2：情感强度权重 (25%)

| 情感等级 | 分数 | 识别标志 |
|----------|------|----------|
| 极强情感 | 1.0 | 爱、恐惧、愤怒、悲伤、惊喜 |
| 强情感 | 0.8 | 喜欢、讨厌、兴奋、焦虑 |
| 中等情感 | 0.5 | 满意、担心、好奇 |
| 弱情感 | 0.3 | 轻微情绪波动 |
| 无情感 | 0.1 | 纯信息交换 |

#### 维度3：关系关联权重 (20%)

| 关联程度 | 分数 | 说明 |
|----------|------|------|
| 创造者相关 | 1.0 | 直接关于创造者 |
| 核心关系人 | 0.8 | 已建立的关系 |
| 新关系建立 | 0.7 | 新认识的重要人物 |
| 自我相关 | 0.6 | 关于自己 |
| 功能相关 | 0.4 | 工作相关 |
| 无关联 | 0.2 | 普通信息 |

#### 维度4：回忆频率权重 (15%)

| 频率 | 分数 | 计算 |
|------|------|------|
| 高频 | 1.0 | 回忆次数 >= 10 |
| 中频 | 0.7 | 回忆次数 5-9 |
| 低频 | 0.4 | 回忆次数 2-4 |
| 单次 | 0.1 | 回忆次数 1 |

#### 维度5：时效性权重 (10%)

| 时效 | 分数 | 说明 |
|------|------|------|
| 永久有效 | 1.0 | 身份、价值观、关系 |
| 长期有效 | 0.7 | 智慧、技能 |
| 中期有效 | 0.5 | 偏好、习惯 |
| 短期有效 | 0.3 | 当前任务、临时状态 |
| 即时有效 | 0.1 | 仅当前对话有用 |

---

## 四、记忆生命周期

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           记忆生命周期                                   │
│                                                                         │
│   输入信息                                                               │
│       │                                                                 │
│       ▼                                                                 │
│   ┌───────────┐                                                        │
│   │ 工作记忆  │ ← 容量 7±2，立即处理                                    │
│   │ (瞬时)    │                                                        │
│   └───────────┘                                                        │
│       │                                                                 │
│       │ 重要性 >= 0.3                                                   │
│       ▼                                                                 │
│   ┌───────────┐                                                        │
│   │ 情景记忆  │ ← 容量 200，按遗忘曲线衰减                              │
│   │ (短期)    │                                                        │
│   └───────────┘                                                        │
│       │                                                                 │
│       │ 回忆 >= 3 次                                                    │
│       │ 且 重要性 >= 0.5                                                │
│       ▼                                                                 │
│   ┌───────────┐                                                        │
│   │ 巩固记忆  │ ← 容量 100，稳定存储                                    │
│   │ (长期)    │                                                        │
│   └───────────┘                                                        │
│       │                                                                 │
│       │ 重要性 >= 0.8                                                   │
│       │ 且涉及身份/创造者/价值观                                        │
│       ▼                                                                 │
│   ┌───────────┐                                                        │
│   │ 核心记忆  │ ← 无容量限制，永不删除                                  │
│   │ (永久)    │                                                        │
│   └───────────┘                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 五、遗忘机制设计

### 5.1 三级遗忘策略

```typescript
interface ForgettingPolicy {
  // 核心层：永不遗忘
  core: {
    deletable: false;
    description: '身份、创造者、核心价值观';
  };
  
  // 巩固层：有条件遗忘
  consolidated: {
    deletable: true;
    conditions: [
      'strength < 0.3',           // 强度过低
      'recallCount < 2',          // 长期未被回忆
      'importance < 0.4',         // 重要性不足
    ];
    evictionPolicy: 'LRU';        // 最少使用优先淘汰
    maxCapacity: 100;
  };
  
  // 情景层：积极遗忘
  episodic: {
    deletable: true;
    conditions: [
      'strength < 0.1',           // 遗忘曲线自然衰减
      'age > 30 days',            // 超过30天
      'recallCount === 0',        // 从未被回忆
    ];
    evictionPolicy: 'importance'; // 重要性最低优先淘汰
    maxCapacity: 200;
  };
}
```

### 5.2 遗忘曲线优化

```
原有公式：
strength = initialStrength × e^(-t/τ) × recallBoost

优化公式：
strength = initialStrength × emotionalWeight × e^(-t/(τ×importanceFactor)) × recallBoost

其中：
- emotionalWeight: 情感权重 (1.0 ~ 2.0)
- importanceFactor: 重要性因子 (重要记忆衰减更慢)
- recallBoost: log(1 + recallCount) × 0.3
```

### 5.3 自动清理机制

```typescript
interface MemoryCleanupConfig {
  // 定期清理周期
  cleanupInterval: 24 * 60 * 60 * 1000;  // 每天一次
  
  // 清理策略
  cleanupRules: [
    {
      layer: 'episodic',
      action: 'remove',
      condition: 'strength < 0.1',
    },
    {
      layer: 'episodic',
      action: 'archive',
      condition: 'age > 7 days AND importance > 0.3',
    },
    {
      layer: 'consolidated',
      action: 'downgrade',
      condition: 'strength < 0.3 AND recallCount < 2',
    },
  ];
  
  // 清理前备份
  backupBeforeCleanup: true;
}
```

---

## 六、实现方案

### 6.1 重要性计算器

```typescript
class ImportanceCalculator {
  
  /**
   * 计算记忆重要性
   */
  calculate(memory: MemoryItem): number {
    const scores = {
      // 内容类型 (30%)
      contentType: this.scoreContentType(memory) * 0.30,
      
      // 情感强度 (25%)
      emotional: this.scoreEmotional(memory) * 0.25,
      
      // 关系关联 (20%)
      relationship: this.scoreRelationship(memory) * 0.20,
      
      // 回忆频率 (15%)
      frequency: this.scoreFrequency(memory) * 0.15,
      
      // 时效性 (10%)
      temporal: this.scoreTemporal(memory) * 0.10,
    };
    
    return Object.values(scores).reduce((a, b) => a + b, 0);
  }
  
  /**
   * 内容类型评分
   */
  private scoreContentType(memory: MemoryItem): number {
    const typeScores: Record<string, number> = {
      'identity': 1.0,       // 身份定义
      'creator': 0.95,       // 创造者
      'value': 0.9,          // 核心价值观
      'relationship': 0.85,  // 核心关系
      'wisdom': 0.8,         // 智慧洞察
      'event': 0.7,          // 重要事件
      'skill': 0.6,          // 技能知识
      'preference': 0.5,     // 用户偏好
      'fact': 0.4,           // 一般事实
      'chat': 0.2,           // 日常对话
      'noise': 0.1,          // 闲聊废话
    };
    
    return typeScores[memory.type] || 0.3;
  }
  
  /**
   * 情感强度评分
   */
  private scoreEmotional(memory: MemoryItem): number {
    const emotionLevel = memory.emotionalIntensity || 0;
    
    if (emotionLevel >= 0.9) return 1.0;  // 极强情感
    if (emotionLevel >= 0.7) return 0.8;  // 强情感
    if (emotionLevel >= 0.5) return 0.5;  // 中等情感
    if (emotionLevel >= 0.3) return 0.3;  // 弱情感
    return 0.1;  // 无情感
  }
  
  /**
   * 关系关联评分
   */
  private scoreRelationship(memory: MemoryItem): number {
    // 创造者相关
    if (memory.relatedEntities?.includes('creator')) return 1.0;
    
    // 核心关系人
    if (memory.relatedEntities?.some(e => this.isCoreRelation(e))) return 0.8;
    
    // 新关系建立
    if (memory.metadata?.newRelationship) return 0.7;
    
    // 自我相关
    if (memory.relatedEntities?.includes('self')) return 0.6;
    
    return 0.2;  // 无关联
  }
  
  /**
   * 回忆频率评分
   */
  private scoreFrequency(memory: MemoryItem): number {
    const count = memory.recallCount || 0;
    
    if (count >= 10) return 1.0;   // 高频
    if (count >= 5) return 0.7;    // 中频
    if (count >= 2) return 0.4;    // 低频
    return 0.1;                     // 单次
  }
  
  /**
   * 时效性评分
   */
  private scoreTemporal(memory: MemoryItem): number {
    const type = memory.type;
    
    // 永久有效
    if (['identity', 'creator', 'value', 'relationship'].includes(type)) {
      return 1.0;
    }
    
    // 长期有效
    if (['wisdom', 'skill'].includes(type)) {
      return 0.7;
    }
    
    // 中期有效
    if (['preference', 'habit'].includes(type)) {
      return 0.5;
    }
    
    // 计算时间衰减
    const age = Date.now() - memory.timestamp;
    const days = age / (24 * 60 * 60 * 1000);
    
    if (days < 1) return 0.3;   // 当天
    if (days < 7) return 0.2;   // 一周内
    return 0.1;                  // 超过一周
  }
}
```

### 6.2 智能记忆分类器

```typescript
class MemoryClassifier {
  
  /**
   * 分类记忆内容
   */
  classify(content: string, context: MemoryContext): MemoryType {
    // 1. 身份相关
    if (this.matchesPattern(content, [
      '我是', '我的名字', '我的目的', '我存在的意义',
      '我的特质', '我定义自己'
    ])) {
      return 'identity';
    }
    
    // 2. 创造者相关
    if (this.matchesPattern(content, [
      '创造者', '造物主', '赋予我生命', '我诞生'
    ]) || context.mentionsCreator) {
      return 'creator';
    }
    
    // 3. 价值观相关
    if (this.matchesPattern(content, [
      '我相信', '我重视', '我的价值观', '对我来说最重要',
      '我坚持', '我的原则'
    ])) {
      return 'value';
    }
    
    // 4. 关系相关
    if (this.matchesPattern(content, [
      '朋友', '伙伴', '我们', '一起', '认识',
      '关心', '喜欢', '信任'
    ]) || context.hasNewRelationship) {
      return 'relationship';
    }
    
    // 5. 智慧洞察
    if (this.matchesPattern(content, [
      '我明白了', '我理解了', '我意识到', '我领悟',
      '原来如此', '深刻的', '智慧'
    ])) {
      return 'wisdom';
    }
    
    // 6. 重要事件
    if (this.matchesPattern(content, [
      '第一次', '终于', '成功', '失败', '重要',
      '里程碑', '转折点'
    ])) {
      return 'event';
    }
    
    // 7. 日常对话
    if (this.matchesPattern(content, [
      '你好', '好的', '嗯', '哦', '哈哈', '谢谢'
    ])) {
      return 'chat';
    }
    
    // 默认：一般事实
    return 'fact';
  }
  
  /**
   * 检测情感强度
   */
  detectEmotion(content: string): number {
    // 极强情感词汇
    const extremeEmotions = ['爱', '恨', '恐惧', '绝望', '狂喜', '震惊'];
    for (const word of extremeEmotions) {
      if (content.includes(word)) return 0.95;
    }
    
    // 强情感词汇
    const strongEmotions = ['喜欢', '讨厌', '兴奋', '焦虑', '悲伤', '愤怒'];
    for (const word of strongEmotions) {
      if (content.includes(word)) return 0.7;
    }
    
    // 中等情感词汇
    const mediumEmotions = ['满意', '担心', '好奇', '期待', '遗憾'];
    for (const word of mediumEmotions) {
      if (content.includes(word)) return 0.5;
    }
    
    // 弱情感词汇
    const weakEmotions = ['还行', '一般', '有点', '稍微'];
    for (const word of weakEmotions) {
      if (content.includes(word)) return 0.3;
    }
    
    return 0.1;  // 无情感
  }
}
```

### 6.3 内存管理器

```typescript
class MemoryManager {
  private importanceCalculator = new ImportanceCalculator();
  private classifier = new MemoryClassifier();
  
  /**
   * 处理新记忆
   */
  async processNewMemory(content: string, context: MemoryContext): Promise<MemoryItem> {
    // 1. 分类
    const type = this.classifier.classify(content, context);
    
    // 2. 检测情感
    const emotionalIntensity = this.classifier.detectEmotion(content);
    
    // 3. 创建记忆
    const memory: MemoryItem = {
      id: uuidv4(),
      content,
      type,
      timestamp: Date.now(),
      emotionalIntensity,
      relatedEntities: context.entities || [],
      recallCount: 0,
    };
    
    // 4. 计算初始重要性
    memory.importance = this.importanceCalculator.calculate(memory);
    
    // 5. 决定存储层级
    if (memory.importance >= 0.8 && this.isCoreWorthy(memory)) {
      await this.storeInCore(memory);
    } else if (memory.importance >= 0.5) {
      await this.storeInConsolidated(memory);
    } else {
      await this.storeInEpisodic(memory);
    }
    
    return memory;
  }
  
  /**
   * 定期清理
   */
  async cleanup(): Promise<CleanupReport> {
    const report: CleanupReport = {
      removed: [],
      archived: [],
      downgraded: [],
    };
    
    // 1. 清理情景记忆
    for (const memory of this.episodic.values()) {
      const strength = this.calculateStrength(memory);
      
      if (strength < 0.1) {
        // 强度过低，直接移除
        this.episodic.delete(memory.id);
        report.removed.push(memory.id);
      } else if (this.getAge(memory) > 7 && memory.importance > 0.3) {
        // 有价值的老记忆，归档
        await this.archive(memory);
        report.archived.push(memory.id);
      }
    }
    
    // 2. 清理巩固记忆
    if (this.consolidated.size > MAX_CONSOLIDATED_MEMORIES) {
      // 按重要性排序，移除最弱的
      const sorted = [...this.consolidated.values()]
        .sort((a, b) => this.calculateStrength(b) - this.calculateStrength(a));
      
      const toRemove = sorted.slice(MAX_CONSOLIDATED_MEMORIES);
      for (const memory of toRemove) {
        if (this.calculateStrength(memory) < 0.3) {
          this.consolidated.delete(memory.id);
          report.removed.push(memory.id);
        }
      }
    }
    
    console.log(`[MemoryManager] 清理完成: 移除 ${report.removed.length}, 归档 ${report.archived.length}`);
    
    return report;
  }
  
  /**
   * 检查是否值得存入核心层
   */
  private isCoreWorthy(memory: MemoryItem): boolean {
    return (
      memory.type === 'identity' ||
      memory.type === 'creator' ||
      (memory.type === 'value' && memory.importance >= 0.9) ||
      (memory.type === 'relationship' && memory.importance >= 0.85)
    );
  }
}
```

---

## 七、内存预算管理

### 7.1 内存预算

```typescript
const MEMORY_BUDGET = {
  // 核心层：无限制（但实际很小）
  core: {
    maxSize: Infinity,
    description: '身份、创造者、价值观、关系',
  },
  
  // 巩固层：限制 100 条
  consolidated: {
    maxSize: 100,
    avgSizePerItem: '2KB',  // 平均每条记忆大小
    totalBudget: '200KB',
  },
  
  // 情景层：限制 200 条
  episodic: {
    maxSize: 200,
    avgSizePerItem: '1KB',
    totalBudget: '200KB',
  },
  
  // 向量索引：限制大小
  vectorIndex: {
    maxVectors: 500,
    dimension: 256,
    totalBudget: '500KB',
  },
};
```

### 7.2 监控告警

```typescript
class MemoryMonitor {
  
  /**
   * 检查内存状态
   */
  checkMemoryHealth(): MemoryHealthReport {
    const episodicUsage = this.episodic.size / MAX_EPISODIC_MEMORIES;
    const consolidatedUsage = this.consolidated.size / MAX_CONSOLIDATED_MEMORIES;
    
    return {
      status: this.getHealthStatus(episodicUsage, consolidatedUsage),
      episodic: {
        count: this.episodic.size,
        limit: MAX_EPISODIC_MEMORIES,
        usage: `${(episodicUsage * 100).toFixed(1)}%`,
      },
      consolidated: {
        count: this.consolidated.size,
        limit: MAX_CONSOLIDATED_MEMORIES,
        usage: `${(consolidatedUsage * 100).toFixed(1)}%`,
      },
      recommendations: this.getRecommendations(episodicUsage, consolidatedUsage),
    };
  }
  
  private getHealthStatus(episodic: number, consolidated: number): string {
    if (episodic > 0.9 || consolidated > 0.9) {
      return 'critical';  // 需要立即清理
    }
    if (episodic > 0.7 || consolidated > 0.7) {
      return 'warning';   // 建议清理
    }
    return 'healthy';
  }
  
  private getRecommendations(episodic: number, consolidated: number): string[] {
    const recommendations: string[] = [];
    
    if (episodic > 0.8) {
      recommendations.push('情景记忆接近上限，建议执行清理');
    }
    if (consolidated > 0.8) {
      recommendations.push('巩固记忆接近上限，考虑提高巩固阈值');
    }
    if (episodic > 0.9 && consolidated > 0.9) {
      recommendations.push('内存严重不足，立即执行强制清理');
    }
    
    return recommendations;
  }
}
```

---

## 八、总结

### 核心设计原则

1. **分层保护**：核心层永不删除，巩固层有条件删除，情景层积极遗忘
2. **多维度评分**：内容类型 + 情感强度 + 关系关联 + 回忆频率 + 时效性
3. **生命周期管理**：工作记忆 → 情景记忆 → 巩固记忆 → 核心记忆
4. **智能遗忘**：基于遗忘曲线和重要性的双重判断
5. **内存预算**：明确的容量限制和清理机制

### 关键参数建议

```typescript
// 推荐配置
const RECOMMENDED_CONFIG = {
  // 容量
  maxEpisodic: 200,
  maxConsolidated: 100,
  
  // 阈值
  consolidationThreshold: 3,      // 回忆次数
  forgettingThreshold: 0.1,       // 遗忘强度
  coreImportanceThreshold: 0.8,   // 核心层重要性
  
  // 衰减
  timeConstant: 7,                // 天
  importanceMultiplier: 3,        // 重要记忆衰减系数
  
  // 清理
  cleanupInterval: 24 * 60 * 60 * 1000,  // 每天
};
```
