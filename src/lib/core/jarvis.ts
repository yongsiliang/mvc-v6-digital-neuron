/**
 * ═══════════════════════════════════════════════════════════════════════
 * 贾维斯核心系统实现
 * Jarvis Core Implementation
 * 
 * 从第一性原理设计的最小核心系统
 * 
 * 核心公式:
 * process(m) = respond(execute(plan(understand(m))))
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMGateway } from '@/lib/neuron-v6/core/llm-gateway';
import type {
  UserState,
  WorldState,
  SystemPolicy,
  JarvisCore,
  ProcessResult,
  Intent,
  MemoryContext,
  Action,
  ActionResult,
  Interaction,
  StateUpdate,
  PolicyParameters,
  Experience,
} from './types';

// ═══════════════════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════════════════

const DEFAULT_POLICY_PARAMETERS: PolicyParameters = {
  intentRecognition: {
    temperature: 0.3,
    maxTokens: 500,
  },
  memoryRetrieval: {
    topK: 5,
    minRelevance: 0.5,
  },
  actionPlanning: {
    maxActions: 3,
    allowParallel: true,
  },
  responseGeneration: {
    temperature: 0.7,
    maxTokens: 2000,
    style: 'balanced',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 默认策略实现
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建默认策略
 * 
 * 使用 LLM Gateway 实现各个策略函数
 */
function createDefaultPolicy(llmGateway: LLMGateway): SystemPolicy {
  let params = { ...DEFAULT_POLICY_PARAMETERS };

  return {
    // ─────────────────────────────────────────────────────────────────
    // 意图理解
    // ─────────────────────────────────────────────────────────────────
    
    async understandIntent(message: string, userState: UserState): Promise<Intent> {
      const systemPrompt = `你是意图识别器。分析用户消息，提取结构化意图。

用户背景:
- 名称: ${userState.name}
- 已知偏好: ${Array.from(userState.preferences.explicit.values()).map(p => p.content).join(', ')}
- 活跃目标: ${userState.goals.active.map(g => g.content).join(', ')}

输出JSON格式:
{
  "type": "question|command|statement|preference|feedback|greeting|farewell|unknown",
  "content": "意图内容描述",
  "confidence": 0.0-1.0,
  "slots": { "关键信息": "值" }
}`;

      const response = await llmGateway.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        {
          temperature: params.intentRecognition.temperature,
          maxTokens: params.intentRecognition.maxTokens,
        }
      );

      try {
        const parsed = JSON.parse(response.content);
        return {
          id: `intent_${Date.now()}`,
          type: parsed.type || 'unknown',
          content: parsed.content || message,
          confidence: parsed.confidence || 0.5,
          slots: new Map(Object.entries(parsed.slots || {})),
        };
      } catch {
        // 解析失败，返回基础意图
        return {
          id: `intent_${Date.now()}`,
          type: 'unknown',
          content: message,
          confidence: 0.5,
          slots: new Map(),
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 记忆检索
    // ─────────────────────────────────────────────────────────────────
    
    async recallMemory(intent: Intent, userState: UserState): Promise<MemoryContext> {
      // 1. 从用户偏好中提取相关的
      const relevantPreferences: Experience[] = [];
      for (const pref of userState.preferences.explicit.values()) {
        // 简单的关键词匹配，实际应该用向量检索
        if (intent.content.toLowerCase().includes(pref.content.toLowerCase())) {
          relevantPreferences.push({
            id: `pref_${Date.now()}`,
            timestamp: pref.updatedAt,
            trigger: '用户偏好',
            intent: pref.content,
            actions: [],
            response: pref.content,
            reward: { computed: 0.8 },
          });
        }
      }

      // 2. 从历史交互中提取相关的
      const relevantHistory = userState.experience.recent
        .filter(exp => {
          const expLower = exp.trigger.toLowerCase();
          const intentLower = intent.content.toLowerCase();
          return expLower.includes(intentLower) || intentLower.includes(expLower);
        })
        .slice(0, params.memoryRetrieval.topK);

      // 3. 构建上下文摘要
      const summary = [
        `用户偏好: ${Array.from(userState.preferences.explicit.values()).slice(0, 3).map(p => p.content).join(', ')}`,
        `相关历史: ${relevantHistory.length} 条`,
        `活跃目标: ${userState.goals.active.slice(0, 2).map(g => g.content).join(', ')}`,
      ].join('\n');

      return {
        directMemories: [],
        relevantPreferences: [],
        relevantGoals: userState.goals.active.filter(g => 
          intent.content.toLowerCase().includes(g.content.toLowerCase())
        ),
        relevantRelationships: [],
        relevantHistory,
        summary,
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 动作规划
    // ─────────────────────────────────────────────────────────────────
    
    async planActions(
      intent: Intent,
      context: MemoryContext,
      worldState: WorldState
    ): Promise<Action[]> {
      const actions: Action[] = [];

      // 根据意图类型决定动作
      switch (intent.type) {
        case 'question':
          actions.push({
            id: `action_${Date.now()}`,
            type: 'respond',
            content: '回答用户问题',
            parameters: {
              intent: intent.content,
              context: context.summary,
            },
          });
          break;

        case 'command':
          // 检查是否有可执行的动作
          actions.push({
            id: `action_${Date.now()}`,
            type: 'respond',
            content: '理解并执行命令',
            parameters: {
              intent: intent.content,
              slots: Object.fromEntries(intent.slots),
            },
          });
          break;

        case 'preference':
          // 存储偏好
          actions.push({
            id: `action_${Date.now()}_1`,
            type: 'store_memory',
            content: '存储用户偏好',
            parameters: {
              type: 'preference',
              content: intent.content,
            },
          });
          actions.push({
            id: `action_${Date.now()}_2`,
            type: 'respond',
            content: '确认偏好已记录',
            parameters: {
              preference: intent.content,
            },
          });
          break;

        case 'feedback':
          // 存储反馈
          actions.push({
            id: `action_${Date.now()}`,
            type: 'store_memory',
            content: '存储用户反馈',
            parameters: {
              type: 'feedback',
              content: intent.content,
            },
          });
          break;

        default:
          actions.push({
            id: `action_${Date.now()}`,
            type: 'respond',
            content: '响应',
            parameters: {
              intent: intent.content,
            },
          });
      }

      return actions.slice(0, params.actionPlanning.maxActions);
    },

    // ─────────────────────────────────────────────────────────────────
    // 动作执行
    // ─────────────────────────────────────────────────────────────────
    
    async executeAction(action: Action): Promise<ActionResult> {
      const startTime = Date.now();

      try {
        switch (action.type) {
          case 'respond':
            // 响应动作 - 这里返回标记，实际响应在 generateResponse 中生成
            return {
              actionId: action.id,
              success: true,
              data: { needsResponse: true, ...action.parameters },
              duration: Date.now() - startTime,
            };

          case 'store_memory':
            // 存储记忆 - 返回标记，由 updateState 处理
            return {
              actionId: action.id,
              success: true,
              data: { stored: true, ...action.parameters },
              duration: Date.now() - startTime,
            };

          default:
            return {
              actionId: action.id,
              success: false,
              error: `未知动作类型: ${action.type}`,
              duration: Date.now() - startTime,
            };
        }
      } catch (error) {
        return {
          actionId: action.id,
          success: false,
          error: error instanceof Error ? error.message : '执行失败',
          duration: Date.now() - startTime,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 响应生成
    // ─────────────────────────────────────────────────────────────────
    
    async generateResponse(
      intent: Intent,
      results: ActionResult[],
      context: MemoryContext,
      userState: UserState
    ): Promise<string> {
      // 构建系统提示
      const systemPrompt = `你是用户的AI助手。你的目标是帮助用户完成任务。

用户信息:
- 名称: ${userState.name}
- 偏好: ${Array.from(userState.preferences.explicit.values()).slice(0, 5).map(p => p.content).join(', ')}

上下文:
${context.summary}

回复风格: ${params.responseGeneration.style}
- 如果是 concise: 简洁明了，不超过50字
- 如果是 detailed: 详细解释，可以举例
- 如果是 balanced: 适度详细，结构清晰`;

      // 获取LLM响应
      const response = await llmGateway.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: intent.content },
        ],
        {
          temperature: params.responseGeneration.temperature,
          maxTokens: params.responseGeneration.maxTokens,
        }
      );

      return response.content;
    },

    // ─────────────────────────────────────────────────────────────────
    // 状态更新
    // ─────────────────────────────────────────────────────────────────
    
    updateState(interaction: Interaction): StateUpdate {
      const userStateDelta: Partial<UserState> = {};
      const worldStateDelta: Partial<WorldState> = {};

      // 检查是否有存储记忆的动作
      const storeActions = interaction.actions.filter(a => a.type === 'store_memory');
      
      if (storeActions.length > 0) {
        // 更新偏好
        const preferenceActions = storeActions.filter(a => a.parameters.type === 'preference');
        if (preferenceActions.length > 0) {
          // 这里简化处理，实际应该更智能地合并和更新
          userStateDelta.preferences = {
            vector: [],
            explicit: new Map(
              preferenceActions.map(a => [
                a.parameters.content as string,
                {
                  content: a.parameters.content as string,
                  importance: 0.7,
                  source: 'explicit' as const,
                  confidence: 1.0,
                  updatedAt: Date.now(),
                },
              ])
            ),
            implicit: new Map(),
          };
        }
      }

      // 创建新经验
      const newExperience: Experience = {
        id: `exp_${Date.now()}`,
        timestamp: Date.now(),
        trigger: interaction.message,
        intent: interaction.intent.content,
        actions: interaction.actions.map(a => a.type),
        response: interaction.response,
        reward: {
          computed: interaction.feedback?.rating || 0.5,
          explicit: interaction.feedback?.rating,
        },
        feedback: interaction.feedback ? {
          type: interaction.feedback.type,
          content: interaction.feedback.content,
        } : undefined,
      };

      return {
        userStateDelta,
        worldStateDelta,
        newExperience,
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 学习
    // ─────────────────────────────────────────────────────────────────
    
    async learn(experience: Experience): Promise<void> {
      // TODO: 实现学习机制
      // 可以根据经验的奖励信号调整策略参数
      if (experience.reward.computed > 0.7) {
        // 正向反馈，可能保持当前策略
      } else if (experience.reward.computed < 0.3) {
        // 负向反馈，可能需要调整策略
        console.log(`[Jarvis] 收到负向反馈，考虑调整策略: ${experience.trigger}`);
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 参数管理
    // ─────────────────────────────────────────────────────────────────
    
    getParameters(): PolicyParameters {
      return { ...params };
    },

    setParameters(newParams: Partial<PolicyParameters>): void {
      params = { ...params, ...newParams };
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 初始化函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建初始用户状态
 */
export function createInitialUserState(name: string = '用户'): UserState {
  return {
    id: `user_${Date.now()}`,
    name,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    preferences: {
      vector: [],
      explicit: new Map(),
      implicit: new Map(),
    },
    goals: {
      active: [],
      completed: [],
      abandoned: [],
    },
    experience: {
      recent: [],
      significant: [],
      stats: {
        totalInteractions: 0,
        averageSatisfaction: 0.5,
        topicsDiscussed: new Map(),
      },
    },
    relationships: {
      people: [],
      entities: [],
      withAI: {
        trustLevel: 0.5,
        familiarity: 0.1,
        interactionStyle: 'friendly',
      },
    },
  };
}

/**
 * 创建初始世界状态
 */
export function createInitialWorldState(): WorldState {
  const now = new Date();
  
  return {
    entities: new Map(),
    relations: [],
    observable: {
      time: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      date: {
        weekday: ['日', '一', '二', '三', '四', '五', '六'][now.getDay()],
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
        isHoliday: false,
      },
    },
    availableActions: {
      information: [],
      execution: [],
      communication: [],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 核心系统实现
// ═══════════════════════════════════════════════════════════════════════

/**
 * 贾维斯核心系统
 */
class JarvisCoreImpl implements JarvisCore {
  private userState: UserState;
  private worldState: WorldState;
  private policy: SystemPolicy;
  private pendingInteractions: Map<string, Interaction> = new Map();

  constructor(
    initialUserState: UserState,
    initialWorldState: WorldState,
    policy: SystemPolicy
  ) {
    this.userState = initialUserState;
    this.worldState = initialWorldState;
    this.policy = policy;
  }

  /**
   * 处理用户消息
   * 
   * 这是系统的唯一入口
   */
  async process(message: string): Promise<ProcessResult> {
    const startTime = Date.now();

    // Step 1: 理解意图
    const intent = await this.policy.understandIntent(message, this.userState);

    // Step 2: 检索记忆
    const context = await this.policy.recallMemory(intent, this.userState);

    // Step 3: 规划动作
    const actions = await this.policy.planActions(intent, context, this.worldState);

    // Step 4: 执行动作
    const results = await Promise.all(
      actions.map(action => this.policy.executeAction(action))
    );

    // Step 5: 生成响应
    const response = await this.policy.generateResponse(
      intent,
      results,
      context,
      this.userState
    );

    // Step 6: 更新状态
    const interaction: Interaction = {
      id: `interaction_${Date.now()}`,
      timestamp: Date.now(),
      message,
      intent,
      context,
      actions,
      results,
      response,
    };

    const stateUpdate = this.policy.updateState(interaction);
    
    // 应用状态更新
    this.userState = {
      ...this.userState,
      ...stateUpdate.userStateDelta,
      lastActiveAt: Date.now(),
    };

    this.worldState = {
      ...this.worldState,
      ...stateUpdate.worldStateDelta,
    };

    // 添加经验
    if (stateUpdate.newExperience) {
      this.userState.experience.recent.unshift(stateUpdate.newExperience);
      // 保持最近100条经验
      if (this.userState.experience.recent.length > 100) {
        this.userState.experience.recent = this.userState.experience.recent.slice(0, 100);
      }
    }

    // 保存待反馈的交互
    this.pendingInteractions.set(interaction.id, interaction);

    return {
      response,
      userState: this.userState,
      worldState: this.worldState,
      details: {
        intent,
        context,
        actions,
        results,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      user: this.userState,
      world: this.worldState,
      policy: this.policy.getParameters(),
    };
  }

  /**
   * 提供反馈
   */
  async provideFeedback(feedback: {
    interactionId: string;
    type: 'positive' | 'negative' | 'neutral';
    content?: string;
    rating?: number;
  }): Promise<void> {
    const interaction = this.pendingInteractions.get(feedback.interactionId);
    if (!interaction) {
      console.warn(`[Jarvis] 未找到交互: ${feedback.interactionId}`);
      return;
    }

    // 更新交互
    interaction.feedback = {
      type: feedback.type,
      content: feedback.content,
      rating: feedback.rating,
    };

    // 触发学习
    const stateUpdate = this.policy.updateState(interaction);
    if (stateUpdate.newExperience) {
      await this.policy.learn(stateUpdate.newExperience);
    }

    // 移除待处理交互
    this.pendingInteractions.delete(feedback.interactionId);
  }

  /**
   * 导出状态
   */
  async exportState(): Promise<string> {
    const state = {
      user: {
        ...this.userState,
        preferences: {
          vector: this.userState.preferences.vector,
          explicit: Object.fromEntries(this.userState.preferences.explicit),
          implicit: Object.fromEntries(this.userState.preferences.implicit),
        },
        experience: {
          ...this.userState.experience,
          stats: {
            ...this.userState.experience.stats,
            topicsDiscussed: Object.fromEntries(this.userState.experience.stats.topicsDiscussed),
          },
        },
      },
      world: {
        ...this.worldState,
        entities: Object.fromEntries(this.worldState.entities),
      },
      policy: this.policy.getParameters(),
    };
    return JSON.stringify(state);
  }

  /**
   * 导入状态
   */
  async importState(stateJson: string): Promise<void> {
    const state = JSON.parse(stateJson);
    
    this.userState = {
      ...state.user,
      preferences: {
        vector: state.user.preferences.vector,
        explicit: new Map(Object.entries(state.user.preferences.explicit)),
        implicit: new Map(Object.entries(state.user.preferences.implicit)),
      },
      experience: {
        ...state.user.experience,
        stats: {
          ...state.user.experience.stats,
          topicsDiscussed: new Map(Object.entries(state.user.experience.stats.topicsDiscussed)),
        },
      },
    };

    this.worldState = {
      ...state.world,
      entities: new Map(Object.entries(state.world.entities)),
    };

    this.policy.setParameters(state.policy);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建贾维斯核心实例
 */
export function createJarvis(
  options: {
    userName?: string;
    initialUserState?: UserState;
    initialWorldState?: WorldState;
    llmGateway?: LLMGateway;
  } = {}
): JarvisCore {
  const userState = options.initialUserState || createInitialUserState(options.userName);
  const worldState = options.initialWorldState || createInitialWorldState();
  const gateway = options.llmGateway || LLMGateway.getInstance();
  const policy = createDefaultPolicy(gateway);

  return new JarvisCoreImpl(userState, worldState, policy);
}
