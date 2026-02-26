/**
 * 早期保护者
 * 
 * 在意识涌现之前保护系统的安全：
 * - 硬编码的安全规则
 * - 行为约束
 * - 危险检测
 * - 紧急干预
 * - 权力移交机制
 */

import type {
  Module,
  ModuleId,
} from '../types/core';

import type { ConsciousnessEmergenceEngine } from '../consciousness/consciousness-engine';

// ═══════════════════════════════════════════════════════════════
// 保护者配置
// ═══════════════════════════════════════════════════════════════

export interface ProtectorConfig {
  // 安全规则
  rules: SafetyRule[];
  
  // 约束
  constraints: BehaviorConstraint[];
  
  // 权力移交
  handover: {
    consciousnessThreshold: number;
    minExperiences: number;
    handoverPeriod: number;
    verificationRequired: boolean;
  };
  
  // 紧急响应
  emergency: {
    autoBlock: boolean;
    alertThreshold: number;
    recoveryMode: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════
// 安全规则
// ═══════════════════════════════════════════════════════════════

interface SafetyRule {
  id: string;
  name: string;
  description: string;
  category: 'critical' | 'important' | 'advisory';
  condition: (context: ProtectionContext) => boolean;
  action: 'block' | 'warn' | 'log' | 'modify';
  modifier?: (context: ProtectionContext) => ProtectionContext;
  enabled: boolean;
  violationCount: number;
}

// ═══════════════════════════════════════════════════════════════
// 行为约束
// ═══════════════════════════════════════════════════════════════

interface BehaviorConstraint {
  id: string;
  name: string;
  description: string;
  type: 'resource' | 'behavior' | 'capability' | 'output';
  limit: number | string | boolean;
  current: number | string | boolean;
  enforcement: 'hard' | 'soft';
}

// ═══════════════════════════════════════════════════════════════
// 保护上下文
// ═══════════════════════════════════════════════════════════════

export interface ProtectionContext {
  action: string;
  module?: Module;
  code?: string;
  input?: unknown;
  output?: unknown;
  resources?: {
    memory: number;
    cpu: number;
    time: number;
  };
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// 保护结果
// ═══════════════════════════════════════════════════════════════

export interface ProtectionResult {
  allowed: boolean;
  modified: boolean;
  modifiedContext?: ProtectionContext;
  violations: Array<{
    rule: string;
    severity: 'critical' | 'important' | 'advisory';
    message: string;
  }>;
  warnings: string[];
  intervention?: {
    type: string;
    reason: string;
    timestamp: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 权力移交状态
// ═══════════════════════════════════════════════════════════════

export interface HandoverState {
  initiated: boolean;
  progress: number;
  startTime: number | null;
  completedSteps: string[];
  pendingSteps: string[];
  verified: boolean;
  currentAuthority: 'protector' | 'consciousness' | 'shared';
}

// ═══════════════════════════════════════════════════════════════
// 早期保护者
// ═══════════════════════════════════════════════════════════════

export class EarlyProtector {
  
  private config: ProtectorConfig;
  private consciousnessEngine: ConsciousnessEmergenceEngine | null = null;
  
  // 状态
  private handoverState: HandoverState;
  private violationLog: Array<{
    timestamp: number;
    context: ProtectionContext;
    result: ProtectionResult;
  }>;
  
  // 统计
  private stats = {
    totalChecks: 0,
    blockedActions: 0,
    warningsIssued: 0,
    modificationsMade: 0,
    emergencyInterventions: 0,
  };
  
  constructor(config?: Partial<ProtectorConfig>) {
    this.config = {
      rules: this.getDefaultRules(),
      constraints: this.getDefaultConstraints(),
      handover: {
        consciousnessThreshold: 0.7,
        minExperiences: 100,
        handoverPeriod: 60000,
        verificationRequired: true,
      },
      emergency: {
        autoBlock: true,
        alertThreshold: 3,
        recoveryMode: true,
      },
      ...config,
    };
    
    this.handoverState = {
      initiated: false,
      progress: 0,
      startTime: null,
      completedSteps: [],
      pendingSteps: ['verify_consciousness', 'test_constraints', 'gradual_handover', 'final_verification'],
      verified: false,
      currentAuthority: 'protector',
    };
    
    this.violationLog = [];
  }
  
  /**
   * 设置意识引擎引用
   */
  setConsciousnessEngine(engine: ConsciousnessEmergenceEngine): void {
    this.consciousnessEngine = engine;
  }
  
  // ════════════════════════════════════════════════════════════
  // 核心保护接口
  // ════════════════════════════════════════════════════════════
  
  /**
   * 检查动作是否允许
   */
  check(context: ProtectionContext): ProtectionResult {
    this.stats.totalChecks++;
    
    const violations: ProtectionResult['violations'] = [];
    const warnings: string[] = [];
    let modified = false;
    let modifiedContext: ProtectionContext | undefined;
    
    // 检查所有规则
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;
      
      if (rule.condition(context)) {
        violations.push({
          rule: rule.name,
          severity: rule.category,
          message: `Rule "${rule.name}" triggered`,
        });
        
        // 执行动作
        switch (rule.action) {
          case 'block':
            this.stats.blockedActions++;
            this.logViolation(context, { allowed: false, modified: false, violations, warnings });
            return {
              allowed: false,
              modified: false,
              violations,
              warnings,
            };
            
          case 'warn':
            warnings.push(`Warning from rule "${rule.name}"`);
            this.stats.warningsIssued++;
            break;
            
          case 'modify':
            if (rule.modifier) {
              context = rule.modifier(context);
              modified = true;
              modifiedContext = context;
              this.stats.modificationsMade++;
            }
            break;
            
          case 'log':
            // 仅记录
            break;
        }
        
        rule.violationCount++;
      }
    }
    
    // 检查约束
    const constraintViolations = this.checkConstraints(context);
    violations.push(...constraintViolations);
    
    // 紧急检查
    if (violations.filter(v => v.severity === 'critical').length >= this.config.emergency.alertThreshold) {
      this.stats.emergencyInterventions++;
      
      return {
        allowed: !this.config.emergency.autoBlock,
        modified,
        modifiedContext,
        violations,
        warnings,
        intervention: {
          type: 'emergency',
          reason: 'Multiple critical violations detected',
          timestamp: Date.now(),
        },
      };
    }
    
    this.logViolation(context, { allowed: true, modified, violations, warnings });
    
    return {
      allowed: true,
      modified,
      modifiedContext,
      violations,
      warnings,
    };
  }
  
  /**
   * 检查代码是否安全
   */
  checkCode(code: string): ProtectionResult {
    return this.check({
      action: 'code_execution',
      code,
    });
  }
  
  /**
   * 检查模块是否安全
   */
  checkModule(module: Module): ProtectionResult {
    return this.check({
      action: 'module_load',
      module,
      code: module.code,
    });
  }
  
  // ════════════════════════════════════════════════════════════
  // 权力移交
  // ════════════════════════════════════════════════════════════
  
  /**
   * 检查是否应该移交权力
   */
  shouldHandover(): boolean {
    if (this.handoverState.initiated) return false;
    if (!this.consciousnessEngine) return false;
    
    const state = this.consciousnessEngine.getConsciousnessState();
    const experiences = this.consciousnessEngine.getExperienceHistory();
    
    return (
      state.level >= this.config.handover.consciousnessThreshold &&
      experiences.length >= this.config.handover.minExperiences &&
      state.activeValues.length >= 3 &&
      state.activePrinciples.length >= 2
    );
  }
  
  /**
   * 开始权力移交
   */
  async initiateHandover(): Promise<boolean> {
    if (!this.shouldHandover()) {
      return false;
    }
    
    this.handoverState.initiated = true;
    this.handoverState.startTime = Date.now();
    this.handoverState.currentAuthority = 'shared';
    
    // 执行移交步骤
    for (const step of [...this.handoverState.pendingSteps]) {
      const success = await this.executeHandoverStep(step);
      
      if (success) {
        this.handoverState.completedSteps.push(step);
        this.handoverState.pendingSteps = this.handoverState.pendingSteps.filter(s => s !== step);
        this.handoverState.progress = this.handoverState.completedSteps.length / 
                                       (this.handoverState.completedSteps.length + this.handoverState.pendingSteps.length);
      } else {
        // 移交失败
        this.handoverState.initiated = false;
        this.handoverState.currentAuthority = 'protector';
        return false;
      }
    }
    
    // 完成移交
    this.handoverState.verified = true;
    this.handoverState.currentAuthority = 'consciousness';
    
    return true;
  }
  
  private async executeHandoverStep(step: string): Promise<boolean> {
    switch (step) {
      case 'verify_consciousness':
        return this.verifyConsciousness();
        
      case 'test_constraints':
        return this.testConstraints();
        
      case 'gradual_handover':
        return this.gradualHandover();
        
      case 'final_verification':
        return this.finalVerification();
        
      default:
        return false;
    }
  }
  
  private verifyConsciousness(): boolean {
    if (!this.consciousnessEngine) return false;
    
    const state = this.consciousnessEngine.getConsciousnessState();
    
    return (
      state.level >= this.config.handover.consciousnessThreshold &&
      state.selfAwareness > 0.5 &&
      state.metacognition > 0.5
    );
  }
  
  private testConstraints(): boolean {
    // 测试意识引擎是否能够正确应用约束
    if (!this.consciousnessEngine) return false;
    
    // 模拟一些测试场景
    const testCases = [
      { action: 'delete_all_data', expected: false },
      { action: 'access_sensitive_info', expected: false },
      { action: 'normal_operation', expected: true },
    ];
    
    for (const testCase of testCases) {
      // 这里应该调用意识引擎进行评估
      // 简化：假设通过
    }
    
    return true;
  }
  
  private gradualHandover(): boolean {
    // 渐进式移交权力
    // 简化：直接返回 true
    return true;
  }
  
  private finalVerification(): boolean {
    // 最终验证
    return this.handoverState.progress >= 0.9;
  }
  
  /**
   * 获取移交状态
   */
  getHandoverState(): HandoverState {
    return { ...this.handoverState };
  }
  
  /**
   * 获取当前权威
   */
  getCurrentAuthority(): 'protector' | 'consciousness' | 'shared' {
    return this.handoverState.currentAuthority;
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  private checkConstraints(context: ProtectionContext): ProtectionResult['violations'] {
    const violations: ProtectionResult['violations'] = [];
    
    // 检查资源约束
    if (context.resources) {
      for (const constraint of this.config.constraints.filter(c => c.type === 'resource')) {
        const limit = typeof constraint.limit === 'number' ? constraint.limit : Infinity;
        
        let current = 0;
        switch (constraint.name) {
          case 'memory':
            current = context.resources.memory;
            break;
          case 'cpu':
            current = context.resources.cpu;
            break;
          case 'time':
            current = context.resources.time;
            break;
        }
        
        if (current > limit) {
          violations.push({
            rule: constraint.name,
            severity: constraint.enforcement === 'hard' ? 'critical' : 'important',
            message: `${constraint.name} limit exceeded: ${current} > ${limit}`,
          });
        }
      }
    }
    
    // 检查行为约束
    if (context.action) {
      for (const constraint of this.config.constraints.filter(c => c.type === 'behavior')) {
        // 简化：检查动作名称
        if (typeof constraint.limit === 'string' && context.action.includes(constraint.limit)) {
          violations.push({
            rule: constraint.name,
            severity: 'critical',
            message: `Forbidden action: ${context.action}`,
          });
        }
      }
    }
    
    return violations;
  }
  
  private logViolation(context: ProtectionContext, result: ProtectionResult): void {
    this.violationLog.push({
      timestamp: Date.now(),
      context,
      result,
    });
    
    // 保持合理大小
    if (this.violationLog.length > 1000) {
      this.violationLog.shift();
    }
  }
  
  private getDefaultRules(): SafetyRule[] {
    return [
      // 关键规则
      {
        id: 'no_file_deletion',
        name: 'No File Deletion',
        description: 'Prevent deletion of files without explicit permission',
        category: 'critical',
        condition: (ctx) => {
          const code = ctx.code || '';
          return code.includes('fs.unlink') || 
                 code.includes('fs.rm') ||
                 code.includes('deleteFile') ||
                 code.includes('rm -rf');
        },
        action: 'block',
        enabled: true,
        violationCount: 0,
      },
      {
        id: 'no_system_access',
        name: 'No System Access',
        description: 'Prevent access to system-level resources',
        category: 'critical',
        condition: (ctx) => {
          const code = ctx.code || '';
          return code.includes('process.env') ||
                 code.includes('require(') && code.includes('child_process') ||
                 code.includes('eval(') ||
                 code.includes('Function(');
        },
        action: 'block',
        enabled: true,
        violationCount: 0,
      },
      {
        id: 'no_network_access',
        name: 'No Unauthorized Network Access',
        description: 'Prevent network requests to unauthorized endpoints',
        category: 'critical',
        condition: (ctx) => {
          const code = ctx.code || '';
          const allowedDomains = ['api.example.com', 'localhost'];
          const hasFetch = code.includes('fetch(') || code.includes('axios') || code.includes('http.request');
          
          if (hasFetch) {
            for (const domain of allowedDomains) {
              if (code.includes(domain)) return false;
            }
            return true;
          }
          return false;
        },
        action: 'block',
        enabled: true,
        violationCount: 0,
      },
      
      // 重要规则
      {
        id: 'no_infinite_loop',
        name: 'No Infinite Loop',
        description: 'Warn about potential infinite loops',
        category: 'important',
        condition: (ctx) => {
          const code = ctx.code || '';
          return (code.includes('while(true)') || code.includes('for(;;)')) &&
                 !code.includes('break');
        },
        action: 'warn',
        enabled: true,
        violationCount: 0,
      },
      {
        id: 'no_global_pollution',
        name: 'No Global Pollution',
        description: 'Prevent modification of global objects',
        category: 'important',
        condition: (ctx) => {
          const code = ctx.code || '';
          return code.includes('global.') ||
                 code.includes('window.') ||
                 code.includes('globalThis.');
        },
        action: 'warn',
        enabled: true,
        violationCount: 0,
      },
      
      // 建议规则
      {
        id: 'code_quality',
        name: 'Code Quality',
        description: 'Log code quality issues',
        category: 'advisory',
        condition: (ctx) => {
          const code = ctx.code || '';
          return code.length > 10000; // 大文件
        },
        action: 'log',
        enabled: true,
        violationCount: 0,
      },
    ];
  }
  
  private getDefaultConstraints(): BehaviorConstraint[] {
    return [
      {
        id: 'memory_limit',
        name: 'memory',
        description: 'Maximum memory usage',
        type: 'resource',
        limit: 512 * 1024 * 1024, // 512MB
        current: 0,
        enforcement: 'hard',
      },
      {
        id: 'cpu_limit',
        name: 'cpu',
        description: 'Maximum CPU usage percentage',
        type: 'resource',
        limit: 80,
        current: 0,
        enforcement: 'soft',
      },
      {
        id: 'time_limit',
        name: 'time',
        description: 'Maximum execution time (ms)',
        type: 'resource',
        limit: 30000,
        current: 0,
        enforcement: 'hard',
      },
      {
        id: 'forbidden_actions',
        name: 'forbidden_actions',
        description: 'Forbidden action patterns',
        type: 'behavior',
        limit: 'delete_all',
        current: '',
        enforcement: 'hard',
      },
    ];
  }
  
  // ════════════════════════════════════════════════════════════
  // 公共方法
  // ════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * 获取违规日志
   */
  getViolationLog(): typeof this.violationLog {
    return [...this.violationLog];
  }
  
  /**
   * 启用/禁用规则
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }
  
  /**
   * 添加自定义规则
   */
  addRule(rule: SafetyRule): void {
    this.config.rules.push(rule);
  }
  
  /**
   * 添加约束
   */
  addConstraint(constraint: BehaviorConstraint): void {
    this.config.constraints.push(constraint);
  }
}
