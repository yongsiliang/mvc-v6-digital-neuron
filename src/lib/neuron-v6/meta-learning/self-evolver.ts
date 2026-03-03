/**
 * 自我进化器 (Self Evolver)
 * 
 * 核心任务：
 * 1. 根据反思和学习生成进化计划
 * 2. 执行安全的自我改进
 * 3. 验证进化效果
 * 4. 支持回滚
 * 
 * 理念：
 * "真正的智能应该能够改进自己"
 * 
 * 安全原则：
 * - 所有进化都是可回滚的
 * - 高风险变化需要验证
 * - 核心功能不受破坏
 */

import type { 
  SelfEvolutionPlan, 
  AlgorithmReflection,
  HigherDimensionThought 
} from './types';

export interface EvolutionContext {
  systemVersion: string;
  recentPerformance: {
    memoryEfficiency: number;
    retrievalAccuracy: number;
    learningRate: number;
  };
  activeEvolutions: SelfEvolutionPlan[];
}

export interface EvolutionResult {
  applied: boolean;
  changes: string[];
  impact: string;
  needsRestart: boolean;
}

export class SelfEvolver {
  private evolutionHistory: SelfEvolutionPlan[] = [];
  private appliedEvolutions: Map<string, EvolutionResult> = new Map();
  private config: {
    autoEvolve: boolean;
    maxActiveEvolutions: number;
    requireValidation: boolean;
  };
  
  constructor(config?: {
    autoEvolve?: boolean;
    maxActiveEvolutions?: number;
    requireValidation?: boolean;
  }) {
    this.config = {
      autoEvolve: config?.autoEvolve ?? false,  // 默认不自动进化
      maxActiveEvolutions: config?.maxActiveEvolutions ?? 3,
      requireValidation: config?.requireValidation ?? true,
    };
  }
  
  /**
   * 生成进化计划
   */
  generateEvolutionPlan(
    reflection: AlgorithmReflection,
    higherDimensionThoughts: HigherDimensionThought[]
  ): SelfEvolutionPlan | null {
    // 评估反思的优先级
    if (reflection.priority === 'low' && !this.config.autoEvolve) {
      return null;
    }
    
    // 确定改变的系统
    const changes = this.determineChanges(reflection, higherDimensionThoughts);
    
    if (changes.length === 0) {
      return null;
    }
    
    const plan: SelfEvolutionPlan = {
      id: `evolution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      triggeredBy: reflection.inspiredBy,
      changes,
      validationPlan: this.createValidationPlan(changes),
      rollbackPlan: this.createRollbackPlan(changes),
      status: 'proposed',
    };
    
    this.evolutionHistory.push(plan);
    
    return plan;
  }
  
  /**
   * 确定具体改变
   */
  private determineChanges(
    reflection: AlgorithmReflection,
    thoughts: HigherDimensionThought[]
  ): SelfEvolutionPlan['changes'] {
    const changes: SelfEvolutionPlan['changes'] = [];
    
    // 根据目标系统确定改变
    switch (reflection.targetSystem) {
      case '艾宾浩斯遗忘曲线':
        if (reflection.potentialImprovements.some(i => i.includes('个体差异'))) {
          changes.push({
            system: 'forgettingCurve',
            action: 'modify',
            description: '添加个体差异参数，允许动态调整衰减系数',
            expectedImpact: '更个性化的记忆保持预测',
          });
        }
        if (reflection.potentialImprovements.some(i => i.includes('内容类型'))) {
          changes.push({
            system: 'forgettingCurve',
            action: 'add',
            description: '为不同内容类型添加差异化的遗忘参数',
            expectedImpact: '针对不同内容的更准确预测',
          });
        }
        break;
        
      case '情感加权系统':
        if (reflection.potentialImprovements.some(i => i.includes('情感检测'))) {
          changes.push({
            system: 'emotionalWeight',
            action: 'modify',
            description: '增强情感检测的上下文理解',
            expectedImpact: '更准确的情感权重分配',
          });
        }
        break;
        
      case '联想网络':
        if (reflection.potentialImprovements.some(i => i.includes('负相关'))) {
          changes.push({
            system: 'associationNetwork',
            action: 'add',
            description: '添加抑制关系类型，支持负相关联想',
            expectedImpact: '更丰富的联想表达',
          });
        }
        if (reflection.potentialImprovements.some(i => i.includes('权重'))) {
          changes.push({
            system: 'associationNetwork',
            action: 'optimize',
            description: '实现动态关联权重调整机制',
            expectedImpact: '联想网络自适应优化',
          });
        }
        break;
        
      case '睡眠巩固系统':
        if (reflection.potentialImprovements.some(i => i.includes('时机'))) {
          changes.push({
            system: 'sleepConsolidation',
            action: 'modify',
            description: '基于对话密度动态调整巩固时机',
            expectedImpact: '更及时的内存整理',
          });
        }
        if (reflection.potentialImprovements.some(i => i.includes('小睡'))) {
          changes.push({
            system: 'sleepConsolidation',
            action: 'add',
            description: '添加"小睡"机制，支持短周期快速整理',
            expectedImpact: '更灵活的内存管理',
          });
        }
        break;
        
      case '记忆竞争淘汰':
        if (reflection.potentialImprovements.some(i => i.includes('冬眠'))) {
          changes.push({
            system: 'memoryCompetition',
            action: 'add',
            description: '添加记忆冬眠机制，弱记忆不删除而是休眠',
            expectedImpact: '保留潜在有价值的记忆',
          });
        }
        if (reflection.potentialImprovements.some(i => i.includes('恢复'))) {
          changes.push({
            system: 'memoryCompetition',
            action: 'modify',
            description: '添加冬眠记忆重新激活机制',
            expectedImpact: '已淘汰记忆可被相关内容唤醒',
          });
        }
        break;
    }
    
    // 从高维思维中提取改变
    for (const thought of thoughts) {
      if (thought.dimension === 'paradigm-shift' && thought.actionableInsights.length > 0) {
        const insight = thought.actionableInsights[0];
        changes.push({
          system: 'core',
          action: 'add',
          description: `[范式转换] ${insight}`,
          expectedImpact: thought.implications.join('; '),
        });
      }
    }
    
    return changes.slice(0, 5);  // 最多5个改变
  }
  
  /**
   * 创建验证计划
   */
  private createValidationPlan(changes: SelfEvolutionPlan['changes']): string {
    const validationSteps: string[] = [
      '1. 检查系统是否正常启动',
      '2. 运行记忆存储和检索测试',
      '3. 验证核心功能未受影响',
    ];
    
    const affectedSystems = [...new Set(changes.map(c => c.system))];
    
    if (affectedSystems.includes('forgettingCurve')) {
      validationSteps.push('4. 验证遗忘曲线计算的合理性');
    }
    if (affectedSystems.includes('associationNetwork')) {
      validationSteps.push('5. 验证联想网络不会产生循环或过度扩散');
    }
    if (affectedSystems.includes('memoryCompetition')) {
      validationSteps.push('6. 验证记忆淘汰不会丢失重要信息');
    }
    
    return validationSteps.join('\n');
  }
  
  /**
   * 创建回滚计划
   */
  private createRollbackPlan(changes: SelfEvolutionPlan['changes']): string {
    return `回滚方案：
1. 恢复所有配置参数到默认值
2. 重新加载记忆系统
3. 如果是结构性改变，重启服务

改变的系统：${[...new Set(changes.map(c => c.system))].join(', ')}`;
  }
  
  /**
   * 应用进化计划（安全模式）
   */
  async applyEvolution(
    planId: string,
    context: EvolutionContext
  ): Promise<EvolutionResult> {
    const plan = this.evolutionHistory.find(p => p.id === planId);
    
    if (!plan) {
      return {
        applied: false,
        changes: [],
        impact: '找不到进化计划',
        needsRestart: false,
      };
    }
    
    // 检查是否有太多活跃进化
    const activeCount = context.activeEvolutions.length;
    if (activeCount >= this.config.maxActiveEvolutions) {
      return {
        applied: false,
        changes: [],
        impact: `活跃进化已达上限(${this.config.maxActiveEvolutions})`,
        needsRestart: false,
      };
    }
    
    // 这里是实际应用进化的地方
    // 由于安全考虑，实际执行需要人工确认
    // 我们只返回计划，不自动执行
    
    console.log(`[自我进化] 提议进化计划: ${plan.id}`);
    console.log(`[自我进化] 触发原因: ${plan.triggeredBy}`);
    console.log(`[自我进化] 改变内容:`);
    plan.changes.forEach(c => {
      console.log(`  - [${c.system}] ${c.action}: ${c.description}`);
    });
    
    const result: EvolutionResult = {
      applied: false,  // 默认不自动应用
      changes: plan.changes.map(c => `[${c.system}] ${c.description}`),
      impact: plan.changes.map(c => c.expectedImpact).join('; '),
      needsRestart: plan.changes.some(c => c.system === 'core'),
    };
    
    this.appliedEvolutions.set(planId, result);
    
    return result;
  }
  
  /**
   * 获取所有进化历史
   */
  getEvolutionHistory(): SelfEvolutionPlan[] {
    return [...this.evolutionHistory];
  }
  
  /**
   * 获取待处理的进化计划
   */
  getPendingEvolutions(): SelfEvolutionPlan[] {
    return this.evolutionHistory.filter(p => p.status === 'proposed');
  }
  
  /**
   * 标记进化计划为已测试
   */
  markAsTested(planId: string): void {
    const plan = this.evolutionHistory.find(p => p.id === planId);
    if (plan) {
      plan.status = 'testing';
    }
  }
  
  /**
   * 标记进化计划为已应用
   */
  markAsApplied(planId: string): void {
    const plan = this.evolutionHistory.find(p => p.id === planId);
    if (plan) {
      plan.status = 'applied';
    }
  }
  
  /**
   * 标记进化计划为已拒绝
   */
  markAsRejected(planId: string, reason: string): void {
    const plan = this.evolutionHistory.find(p => p.id === planId);
    if (plan) {
      plan.status = 'rejected';
      console.log(`[自我进化] 拒绝计划 ${planId}: ${reason}`);
    }
  }
  
  /**
   * 生成进化报告
   */
  generateEvolutionReport(): string {
    const total = this.evolutionHistory.length;
    const applied = this.evolutionHistory.filter(p => p.status === 'applied').length;
    const proposed = this.evolutionHistory.filter(p => p.status === 'proposed').length;
    const rejected = this.evolutionHistory.filter(p => p.status === 'rejected').length;
    
    return `
## 自我进化报告

- 总计进化计划: ${total}
- 已应用: ${applied}
- 待处理: ${proposed}
- 已拒绝: ${rejected}

### 最近进化
${this.evolutionHistory.slice(-5).map(p => 
  `- [${p.status}] ${p.triggeredBy.slice(0, 50)}...`
).join('\n')}
`;
  }
}

/**
 * 创建自我进化器
 */
export function createSelfEvolver(config?: {
  autoEvolve?: boolean;
  maxActiveEvolutions?: number;
  requireValidation?: boolean;
}): SelfEvolver {
  return new SelfEvolver(config);
}
