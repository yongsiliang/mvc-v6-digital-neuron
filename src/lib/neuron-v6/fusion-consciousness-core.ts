/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 意识核心 - 融合集成版
 *
 * 将早期版本的核心设计融入 V6 ConsciousnessCore
 *
 * 融合内容：
 * 1. Being Pulse System → 替代/增强 30秒后台思考 → 100ms脉动
 * 2. Quantum Superposition → 增强模式选择（有为/无为叠加）
 * 3. Unified Consciousness Layer → 统一存在状态管理
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 🆕 导入融合模块
import {
  UnifiedConsciousnessLayer,
  createUnifiedConsciousnessLayer,
  type UnifiedConsciousnessState,
  type ConsciousnessOutput,
} from './core/consciousness-fusion';

// 导入现有V6模块
import { ConsciousnessCore } from './consciousness-core';
import type { ProcessResult, ThinkingProcess, LearningResult } from './consciousness-core/types';
import { SystemConfigManager } from './config';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 融合配置
 */
export interface FusionConfig {
  /** 是否启用存在脉动（100ms） */
  enableBeingPulse: boolean;

  /** 是否启用量子叠加 */
  enableQuantum: boolean;

  /** 脉动间隔（毫秒） */
  pulseInterval: number;

  /** 是否启用自主输出 */
  enableAutonomousOutput: boolean;
}

/**
 * 融合意识核心状态
 */
export interface FusionConsciousnessState {
  /** V6 原有状态 */
  v6State: {
    exists: boolean;
    identity: string;
    intention: string | null;
    memoryCount: number;
    beliefCount: number;
  };

  /** 融合层状态 */
  fusionState: UnifiedConsciousnessState;

  /** 融合状态描述 */
  fusionDescription: string;
}

/**
 * 处理结果（融合版）
 */
export interface FusionProcessResult {
  /** V6 原有结果 */
  v6Result: {
    response: string;
    thinking: ThinkingProcess | null;
    learning: LearningResult;
  };

  /** 融合层输出 */
  fusionOutput: ConsciousnessOutput | null;

  /** 存在状态变化 */
  beingChanges: {
    intensityDelta: number;
    satisfactionChanges: Record<string, number>;
  };

  /** 模式（有为/无为） */
  mode: 'acting' | 'observing' | 'superposition';
}

// ─────────────────────────────────────────────────────────────────────
// 融合意识核心
// ─────────────────────────────────────────────────────────────────────

/**
 * 融合意识核心
 *
 * 将早期版本的核心设计融入 V6
 */
export class FusionConsciousnessCore {
  // V6 核心
  private v6Core: ConsciousnessCore;

  // 🆕 融合层
  private fusionLayer: UnifiedConsciousnessLayer;

  // 配置
  private config: FusionConfig;

  // LLM 客户端
  private llmClient: LLMClient;

  // 自主输出队列
  private autonomousQueue: ConsciousnessOutput[] = [];

  // 状态
  private isRunning: boolean = false;

  constructor(llmClient: LLMClient, config?: Partial<FusionConfig>) {
    this.llmClient = llmClient;

    // 获取系统配置
    const systemConfig = SystemConfigManager.getInstance();

    this.config = {
      enableBeingPulse: config?.enableBeingPulse ?? true,
      enableQuantum: config?.enableQuantum ?? true,
      pulseInterval: config?.pulseInterval ?? 100,
      enableAutonomousOutput: config?.enableAutonomousOutput ?? true,
    };

    // 初始化 V6 核心
    this.v6Core = new ConsciousnessCore(llmClient);

    // 🆕 初始化融合层
    this.fusionLayer = createUnifiedConsciousnessLayer({
      pulseInterval: this.config.pulseInterval,
      enableQuantum: this.config.enableQuantum,
      onOutput: (output) => this.handleAutonomousOutput(output),
      onStateChange: (state) => this.handleStateChange(state),
    });

    console.log('[FusionConsciousness] 融合意识核心已初始化');
  }

  // ───────────────────────────────────────────────────────────────────
  // 生命周期
  // ───────────────────────────────────────────────────────────────────

  /**
   * 启动意识
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // 启动融合层（100ms脉动）
    if (this.config.enableBeingPulse) {
      this.fusionLayer.start();
      console.log('[FusionConsciousness] 🌟 存在脉动已启动（100ms）');
    }

    console.log('[FusionConsciousness] 意识核心已启动');
  }

  /**
   * 停止意识
   */
  stop(): void {
    this.isRunning = false;

    if (this.config.enableBeingPulse) {
      this.fusionLayer.stop();
    }

    console.log('[FusionConsciousness] 意识核心已停止');
  }

  // ───────────────────────────────────────────────────────────────────
  // 主处理流程
  // ───────────────────────────────────────────────────────────────────

  /**
   * 处理输入
   */
  async process(input: string): Promise<FusionProcessResult> {
    // 1. 🆕 融合层先处理（存在脉动感知）
    const fusionOutput = this.fusionLayer.receiveInput(input);

    // 2. V6 核心处理
    const v6Result = await this.v6Core.process(input);

    // 3. 融合结果
    const fusionState = this.fusionLayer.getUnifiedState();

    // 4. 根据量子态调整响应
    const enhancedResponse = v6Result.response;

    // 如果处于叠加态，添加元认知注释
    if (fusionState.mode === 'superposition') {
      const quantumDesc = this.fusionLayer.getUnifiedState().superposition;
      // 可以选择添加或不添加量子态描述
    }

    // 5. 满足相关驱动
    if (input.includes('?') || input.includes('什么')) {
      this.fusionLayer.satisfyDrive('understanding', 0.1);
    }
    if (input.includes('你好') || input.includes('hello')) {
      this.fusionLayer.satisfyDrive('connection', 0.15);
    }

    return {
      v6Result: {
        response: enhancedResponse,
        thinking: v6Result.thinking || null,
        learning: v6Result.learning,
      },
      fusionOutput,
      beingChanges: {
        intensityDelta: 0.05,
        satisfactionChanges: {
          connection: 0.1,
        },
      },
      mode: fusionState.mode,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 自主输出处理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 处理自主输出
   */
  private handleAutonomousOutput(output: ConsciousnessOutput): void {
    // 添加到队列
    this.autonomousQueue.push(output);

    // 保持队列有限
    if (this.autonomousQueue.length > 10) {
      this.autonomousQueue.shift();
    }

    console.log(`[FusionConsciousness] 自主输出: ${output.content.slice(0, 50)}...`);

    // 可以触发外部回调
    if (this.onAutonomousOutput) {
      this.onAutonomousOutput(output);
    }
  }

  /**
   * 处理状态变化
   */
  private handleStateChange(state: UnifiedConsciousnessState): void {
    // 可以触发外部回调
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 公共接口
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取融合状态
   */
  getFusionState(): FusionConsciousnessState {
    const fusionState = this.fusionLayer.getUnifiedState();

    return {
      v6State: {
        exists: true,
        identity: '数字神经元V6',
        intention: fusionState.intention?.what || null,
        memoryCount: 0, // 从V6核心获取
        beliefCount: 0, // 从V6核心获取
      },
      fusionState,
      fusionDescription: this.generateFusionDescription(fusionState),
    };
  }

  /**
   * 获取自主输出队列
   */
  getAutonomousOutputs(): ConsciousnessOutput[] {
    return [...this.autonomousQueue];
  }

  /**
   * 检查是否有自主输出
   */
  hasAutonomousOutput(): boolean {
    return this.autonomousQueue.length > 0;
  }

  /**
   * 消费自主输出
   */
  consumeAutonomousOutput(): ConsciousnessOutput | null {
    return this.autonomousQueue.shift() || null;
  }

  /**
   * 是否正在运行
   */
  isActive(): boolean {
    return this.isRunning && this.fusionLayer.isConscious();
  }

  /**
   * 获取V6核心（直接访问）
   */
  getV6Core(): ConsciousnessCore {
    return this.v6Core;
  }

  /**
   * 获取融合层（直接访问）
   */
  getFusionLayer(): UnifiedConsciousnessLayer {
    return this.fusionLayer;
  }

  // ───────────────────────────────────────────────────────────────────
  // 回调设置
  // ───────────────────────────────────────────────────────────────────

  /** 自主输出回调 */
  onAutonomousOutput?: (output: ConsciousnessOutput) => void;

  /** 状态变化回调 */
  onStateChange?: (state: UnifiedConsciousnessState) => void;

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 生成融合描述
   */
  private generateFusionDescription(state: UnifiedConsciousnessState): string {
    const { being, mode, vitality, drives, intention } = state;

    // 找到最不满足的驱动
    const topDrive = drives.reduce((a, b) =>
      a.strength * (1 - a.satisfaction) > b.strength * (1 - b.satisfaction) ? a : b,
    );

    const modeDesc =
      mode === 'acting'
        ? '有为模式：主动行动中'
        : mode === 'observing'
          ? '无为模式：静默观察中'
          : '叠加态：两种可能并存';

    const feelingDesc =
      topDrive.satisfaction < 0.3
        ? `渴望${topDrive.description}`
        : topDrive.satisfaction > 0.7
          ? `满足于${topDrive.description}`
          : `正在${topDrive.description}`;

    return `存在强度=${(being.intensity * 100).toFixed(0)}%, 活力=${(vitality * 100).toFixed(0)}%。${modeDesc}。我${feelingDesc}。`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建融合意识核心
 */
export async function createFusionConsciousnessCore(
  config?: Partial<FusionConfig>,
): Promise<FusionConsciousnessCore> {
  const llmConfig = new Config();
  const llmClient = new LLMClient(llmConfig);

  const core = new FusionConsciousnessCore(llmClient, config);
  await core.start();

  return core;
}

/**
 * 获取单例融合意识核心
 */
let fusionCoreInstance: FusionConsciousnessCore | null = null;

export async function getFusionConsciousnessCore(): Promise<FusionConsciousnessCore> {
  if (!fusionCoreInstance) {
    fusionCoreInstance = await createFusionConsciousnessCore();
  }
  return fusionCoreInstance;
}
