/**
 * LLM 进化引擎 (L2-LLM)
 * 
 * 使用大语言模型进行语义级别的代码进化：
 * - 结构重构
 * - 语义理解与改进
 * - 知识迁移
 * - 创造性变异
 * - 模式学习
 */

import type {
  Module,
  ModuleId,
  FitnessScore,
  FitnessContext,
  EvolutionHistory,
} from '../types/core';

import type { EvolutionCandidate } from '../sandbox/test-executor';

import { LLMClient, Config, type Message } from 'coze-coding-dev-sdk';

// ═══════════════════════════════════════════════════════════════
// LLM 进化配置
// ═══════════════════════════════════════════════════════════════

export interface LLMEvolutionConfig {
  // 模型配置
  model: string;
  temperature: number;
  maxTokens: number;
  
  // 进化策略
  strategies: EvolutionStrategy[];
  
  // 提示词模板
  promptTemplates: PromptTemplates;
  
  // 并行
  maxConcurrent: number;
}

type EvolutionStrategy = 
  | 'refactor'
  | 'optimize'
  | 'extend'
  | 'simplify'
  | 'fix'
  | 'enhance';

interface PromptTemplates {
  refactor: string;
  optimize: string;
  extend: string;
  simplify: string;
  fix: string;
  enhance: string;
}

// ═══════════════════════════════════════════════════════════════
// 进化上下文
// ═══════════════════════════════════════════════════════════════

interface EvolutionContext {
  module: Module;
  fitness?: FitnessScore;
  testResults?: unknown;
  history?: EvolutionHistory;
  goals?: string[];
  constraints?: string[];
}

// ═══════════════════════════════════════════════════════════════
// 进化结果
// ═══════════════════════════════════════════════════════════════

export interface LLMEvolutionResult {
  success: boolean;
  candidate?: EvolutionCandidate;
  reasoning?: string;
  changes?: string[];
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// LLM 进化引擎
// ═══════════════════════════════════════════════════════════════

export class LLMEvolutionEngine {
  
  private config: LLMEvolutionConfig;
  private client: LLMClient;
  
  constructor(config?: Partial<LLMEvolutionConfig>) {
    this.config = {
      model: 'doubao-seed-1-6-thinking-250715',
      temperature: 0.7,
      maxTokens: 8192,
      strategies: ['refactor', 'optimize', 'extend', 'simplify', 'fix', 'enhance'],
      promptTemplates: this.getDefaultTemplates(),
      maxConcurrent: 4,
      ...config,
    };
    
    const llmConfig = new Config();
    this.client = new LLMClient(llmConfig);
  }
  
  // ════════════════════════════════════════════════════════════
  // 核心进化方法
  // ════════════════════════════════════════════════════════════
  
  /**
   * 进化单个候选
   */
  async evolve(
    candidate: EvolutionCandidate,
    context: FitnessContext
  ): Promise<LLMEvolutionResult> {
    
    const evolutionContext: EvolutionContext = {
      module: candidate.module,
      fitness: candidate.fitness ? { 
        overall: candidate.fitness,
        components: {},
        timestamp: Date.now(),
      } : undefined,
      goals: this.inferGoals(candidate),
      constraints: this.inferConstraints(candidate),
    };
    
    // 选择进化策略
    const strategy = this.selectStrategy(evolutionContext);
    
    // 生成进化代码
    return this.generateEvolution(candidate, evolutionContext, strategy);
  }
  
  /**
   * 批量进化
   */
  async evolveBatch(
    candidates: EvolutionCandidate[],
    context: FitnessContext
  ): Promise<LLMEvolutionResult[]> {
    
    const results: LLMEvolutionResult[] = [];
    
    // 分批处理
    for (let i = 0; i < candidates.length; i += this.config.maxConcurrent) {
      const batch = candidates.slice(i, i + this.config.maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(c => this.evolve(c, context))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * 结构重构
   */
  async refactor(
    candidate: EvolutionCandidate,
    refactorType: 'extract' | 'inline' | 'rename' | 'reorganize'
  ): Promise<LLMEvolutionResult> {
    
    const prompt = this.buildRefactorPrompt(candidate, refactorType);
    
    const messages: Message[] = [
      { role: 'system', content: this.config.promptTemplates.refactor },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.3, // 低温度，保持精确
      thinking: 'enabled',
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  /**
   * 性能优化
   */
  async optimize(
    candidate: EvolutionCandidate,
    target: 'speed' | 'memory' | 'both'
  ): Promise<LLMEvolutionResult> {
    
    const prompt = this.buildOptimizePrompt(candidate, target);
    
    const messages: Message[] = [
      { role: 'system', content: this.config.promptTemplates.optimize },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.5,
      thinking: 'enabled',
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  /**
   * 功能扩展
   */
  async extend(
    candidate: EvolutionCandidate,
    extensionDescription: string
  ): Promise<LLMEvolutionResult> {
    
    const prompt = this.buildExtendPrompt(candidate, extensionDescription);
    
    const messages: Message[] = [
      { role: 'system', content: this.config.promptTemplates.extend },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.8,
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  /**
   * 代码简化
   */
  async simplify(
    candidate: EvolutionCandidate,
    preserveBehavior: boolean = true
  ): Promise<LLMEvolutionResult> {
    
    const prompt = this.buildSimplifyPrompt(candidate, preserveBehavior);
    
    const messages: Message[] = [
      { role: 'system', content: this.config.promptTemplates.simplify },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.4,
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  /**
   * Bug 修复
   */
  async fix(
    candidate: EvolutionCandidate,
    errorDescription: string,
    testFailure?: string
  ): Promise<LLMEvolutionResult> {
    
    const prompt = this.buildFixPrompt(candidate, errorDescription, testFailure);
    
    const messages: Message[] = [
      { role: 'system', content: this.config.promptTemplates.fix },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.3,
      thinking: 'enabled',
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  /**
   * 功能增强
   */
  async enhance(
    candidate: EvolutionCandidate,
    enhancementGoal: string
  ): Promise<LLMEvolutionResult> {
    
    const prompt = this.buildEnhancePrompt(candidate, enhancementGoal);
    
    const messages: Message[] = [
      { role: 'system', content: this.config.promptTemplates.enhance },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.7,
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  // ════════════════════════════════════════════════════════════
  // 知识迁移
  // ════════════════════════════════════════════════════════════
  
  /**
   * 从成功案例学习
   */
  async learnFromExamples(
    candidate: EvolutionCandidate,
    successfulExamples: Module[]
  ): Promise<LLMEvolutionResult> {
    
    const examplesCode = successfulExamples
      .map(e => `// Module: ${e.name}\n${e.code}`)
      .join('\n\n---\n\n');
    
    const prompt = `
You are learning from successful code examples.

## Current Code to Improve
\`\`\`typescript
${candidate.code}
\`\`\`

## Successful Examples
${examplesCode}

## Task
Analyze the patterns in the successful examples and apply similar improvements to the current code.
Focus on:
1. Design patterns used
2. Code organization
3. Error handling approaches
4. Performance optimizations

Provide the improved code in a code block.
`;
    
    const messages: Message[] = [
      { 
        role: 'system', 
        content: 'You are an expert programmer learning from examples to improve code.' 
      },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.6,
    });
    
    return this.parseEvolutionResponse(response.content, candidate);
  }
  
  /**
   * 知识迁移
   */
  async transferKnowledge(
    sourceModule: Module,
    targetCandidate: EvolutionCandidate,
    transferType: 'pattern' | 'algorithm' | 'architecture'
  ): Promise<LLMEvolutionResult> {
    
    const prompt = `
Transfer ${transferType} from source to target.

## Source Module (${sourceModule.name})
\`\`\`typescript
${sourceModule.code}
\`\`\`

## Target Module
\`\`\`typescript
${targetCandidate.code}
\`\`\`

## Task
Identify the ${transferType} in the source that could benefit the target.
Apply the ${transferType} while maintaining the target's existing functionality.

Provide the improved code in a code block.
`;
    
    const messages: Message[] = [
      { 
        role: 'system', 
        content: 'You are an expert at transferring programming knowledge and patterns.' 
      },
      { role: 'user', content: prompt },
    ];
    
    const response = await this.client.invoke(messages, {
      model: this.config.model,
      temperature: 0.5,
    });
    
    return this.parseEvolutionResponse(response.content, targetCandidate);
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  private selectStrategy(context: EvolutionContext): EvolutionStrategy {
    // 根据上下文选择最佳策略
    const fitness = context.fitness;
    
    if (fitness && fitness.overall < 0.3) {
      return 'fix';
    }
    
    if (fitness && fitness.overall < 0.6) {
      return 'optimize';
    }
    
    if (fitness && fitness.overall < 0.8) {
      return 'enhance';
    }
    
    // 随机选择
    const strategies = this.config.strategies;
    return strategies[Math.floor(Math.random() * strategies.length)];
  }
  
  private async generateEvolution(
    candidate: EvolutionCandidate,
    context: EvolutionContext,
    strategy: EvolutionStrategy
  ): Promise<LLMEvolutionResult> {
    
    switch (strategy) {
      case 'refactor':
        return this.refactor(candidate, 'reorganize');
      case 'optimize':
        return this.optimize(candidate, 'both');
      case 'extend':
        return this.extend(candidate, 'Add useful functionality');
      case 'simplify':
        return this.simplify(candidate, true);
      case 'fix':
        return this.fix(candidate, 'Improve code quality', undefined);
      case 'enhance':
        return this.enhance(candidate, 'General improvement');
      default:
        return this.enhance(candidate, 'General improvement');
    }
  }
  
  private inferGoals(candidate: EvolutionCandidate): string[] {
    const goals: string[] = [];
    
    if (candidate.fitness !== undefined) {
      if (candidate.fitness < 0.5) {
        goals.push('Fix bugs and errors');
        goals.push('Improve functionality');
      } else if (candidate.fitness < 0.8) {
        goals.push('Optimize performance');
        goals.push('Enhance code quality');
      } else {
        goals.push('Add new features');
        goals.push('Improve maintainability');
      }
    }
    
    return goals;
  }
  
  private inferConstraints(candidate: EvolutionCandidate): string[] {
    return [
      'Preserve existing functionality',
      'Maintain API compatibility',
      'Follow coding standards',
      'Keep code readable',
    ];
  }
  
  private buildRefactorPrompt(
    candidate: EvolutionCandidate,
    type: string
  ): string {
    return `
Refactor the following code using ${type} strategy.

## Current Code
\`\`\`typescript
${candidate.code}
\`\`\`

## Refactor Type: ${type}

## Requirements
1. Maintain exact same behavior
2. Improve code organization
3. Follow TypeScript best practices

Provide the refactored code in a code block.
`;
  }
  
  private buildOptimizePrompt(
    candidate: EvolutionCandidate,
    target: string
  ): string {
    return `
Optimize the following code for ${target}.

## Current Code
\`\`\`typescript
${candidate.code}
\`\`\`

## Optimization Target: ${target}

## Requirements
1. Maintain same functionality
2. Improve ${target === 'speed' ? 'execution time' : target === 'memory' ? 'memory usage' : 'both'}
3. Document optimizations made

Provide the optimized code in a code block.
`;
  }
  
  private buildExtendPrompt(
    candidate: EvolutionCandidate,
    description: string
  ): string {
    return `
Extend the following code with new functionality.

## Current Code
\`\`\`typescript
${candidate.code}
\`\`\`

## Extension Description
${description}

## Requirements
1. Add the requested functionality
2. Maintain existing functionality
3. Follow consistent patterns

Provide the extended code in a code block.
`;
  }
  
  private buildSimplifyPrompt(
    candidate: EvolutionCandidate,
    preserveBehavior: boolean
  ): string {
    return `
Simplify the following code.

## Current Code
\`\`\`typescript
${candidate.code}
\`\`\`

## Requirements
${preserveBehavior ? '1. MUST preserve exact same behavior' : '1. Simplify while maintaining core functionality'}
2. Reduce complexity
3. Improve readability
4. Remove unnecessary code

Provide the simplified code in a code block.
`;
  }
  
  private buildFixPrompt(
    candidate: EvolutionCandidate,
    error: string,
    testFailure?: string
  ): string {
    return `
Fix the issues in the following code.

## Current Code
\`\`\`typescript
${candidate.code}
\`\`\`

## Error Description
${error}

${testFailure ? `## Test Failure\n${testFailure}` : ''}

## Requirements
1. Fix all identified issues
2. Ensure code passes tests
3. Maintain intended functionality

Provide the fixed code in a code block.
`;
  }
  
  private buildEnhancePrompt(
    candidate: EvolutionCandidate,
    goal: string
  ): string {
    return `
Enhance the following code.

## Current Code
\`\`\`typescript
${candidate.code}
\`\`\`

## Enhancement Goal
${goal}

## Requirements
1. Improve overall quality
2. Add relevant enhancements
3. Maintain existing functionality
4. Follow best practices

Provide the enhanced code in a code block.
`;
  }
  
  private parseEvolutionResponse(
    response: string,
    originalCandidate: EvolutionCandidate
  ): LLMEvolutionResult {
    
    // 提取代码块
    const codeMatch = response.match(/```(?:typescript|javascript|js|ts)?\n([\s\S]*?)```/);
    
    if (!codeMatch) {
      return {
        success: false,
        confidence: 0,
        reasoning: 'No code block found in response',
      };
    }
    
    const newCode = codeMatch[1].trim();
    
    // 提取推理（如果有）
    const reasoningMatch = response.match(/##?\s*(?:Reasoning|Explanation|Analysis)\s*\n([\s\S]*?)(?=##?\s*|$)/i);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : undefined;
    
    // 提取变更说明（如果有）
    const changesMatch = response.match(/##?\s*(?:Changes|Improvements)\s*\n([\s\S]*?)(?=##?\s*|$)/i);
    const changes = changesMatch 
      ? changesMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim())
      : undefined;
    
    // 计算置信度
    const confidence = this.calculateConfidence(newCode, originalCandidate.code);
    
    return {
      success: true,
      candidate: {
        id: `llm-evolved-${Date.now().toString(36)}`,
        module: {
          ...originalCandidate.module,
          code: newCode,
          metadata: {
            ...originalCandidate.module.metadata,
            updatedAt: Date.now(),
          },
        },
        code: newCode,
      },
      reasoning,
      changes,
      confidence,
    };
  }
  
  private calculateConfidence(newCode: string, oldCode: string): number {
    // 基于代码差异计算置信度
    if (newCode === oldCode) return 0.1; // 没有变化
    
    const similarity = this.calculateSimilarity(newCode, oldCode);
    
    // 太相似或太不相似都降低置信度
    if (similarity > 0.95) return 0.3;
    if (similarity < 0.3) return 0.4;
    
    // 中等程度的修改置信度较高
    return 0.7 + (1 - Math.abs(similarity - 0.6)) * 0.3;
  }
  
  private calculateSimilarity(code1: string, code2: string): number {
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    
    const set1 = new Set(lines1);
    const set2 = new Set(lines2);
    
    const intersection = new Set([...set1].filter(l => set2.has(l)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  private getDefaultTemplates(): PromptTemplates {
    return {
      refactor: `You are an expert software architect specializing in code refactoring.
Your goal is to improve code structure while maintaining exact behavior.
Use design patterns, SOLID principles, and clean code practices.`,
      
      optimize: `You are a performance optimization expert.
Your goal is to improve code efficiency while maintaining functionality.
Consider algorithmic complexity, memory usage, and runtime characteristics.`,
      
      extend: `You are a senior software engineer.
Your goal is to extend functionality while maintaining code quality.
Add features thoughtfully and integrate them seamlessly.`,
      
      simplify: `You are a code simplification specialist.
Your goal is to reduce complexity while preserving functionality.
Remove unnecessary abstractions, simplify logic, and improve clarity.`,
      
      fix: `You are a debugging expert.
Your goal is to fix issues while maintaining intended behavior.
Consider edge cases, error handling, and robustness.`,
      
      enhance: `You are a code quality specialist.
Your goal is to enhance code quality comprehensively.
Improve readability, maintainability, and extensibility.`,
    };
  }
}
