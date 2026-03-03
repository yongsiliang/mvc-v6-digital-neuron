/**
 * 元思考黑盒使用示例
 */

import { createMetaCognitionBlackbox, UnderstandingResult } from './meta-cognition-blackbox';

// ═══════════════════════════════════════════════════════════════════════
// 基本使用
// ═══════════════════════════════════════════════════════════════════════

const blackbox = createMetaCognitionBlackbox();

// 输入原始文本，输出理解结果
const result = blackbox.compile('什么是意识？为什么人类有意识？');

console.log('理解结果:');
console.log('- 核心概念:', result.coreConcepts.map(c => c.word));
console.log('- 意图:', result.intent.type, '-', result.intent.topic);
console.log('- 情感:', result.emotion.primary);
console.log('- 置信度:', result.confidence.toFixed(2));
console.log('- 摘要:', result.summary);
console.log('- 隐含信息:', result.implications);

// ═══════════════════════════════════════════════════════════════════════
// 集成到 ConsciousnessCore
// ═══════════════════════════════════════════════════════════════════════

/**
 * 在 ConsciousnessCore.process() 中使用
 */
class ConsciousnessCoreWithBlackbox {
  private metaBlackbox = createMetaCognitionBlackbox();
  
  async process(input: string) {
    // ========================================
    // 阶段1：元思考编译（黑盒，不依赖LLM）
    // ========================================
    const understanding = this.metaBlackbox.compile(input);
    
    console.log('[黑盒输出]', understanding.summary);
    console.log('[置信度]', understanding.confidence);
    
    // ========================================
    // 阶段2：根据理解结果决定后续处理
    // ========================================
    
    // 低置信度 → 需要更多信息
    if (understanding.confidence < 0.3) {
      return {
        response: '我需要更多信息来理解你的问题。',
        needsMoreInfo: true,
      };
    }
    
    // 简单问候 → 直接响应
    if (understanding.intent.type === 'greeting') {
      return {
        response: '你好！有什么我可以帮助你的吗？',
        tokensUsed: 0, // 没有调用LLM
      };
    }
    
    // 复杂问题 → 调用LLM，但使用理解结果优化
    const prompt = this.buildPromptFromUnderstanding(understanding);
    
    // 现在才调用LLM，但已经有理解结果指导
    const response = await this.callLLM(prompt, {
      maxTokens: this.calculateTokenBudget(understanding),
    });
    
    return {
      response,
      understanding,
      tokensUsed: response.tokensUsed,
    };
  }
  
  private buildPromptFromUnderstanding(u: UnderstandingResult): string {
    // 使用黑盒的理解结果构建更精确的提示
    const concepts = u.coreConcepts.map(c => c.word).join('、');
    
    return `用户在询问关于「${concepts}」的问题。
核心主题：${u.intent.topic}
意图类型：${u.intent.type}

请针对这些问题给出准确回答。`;
  }
  
  private calculateTokenBudget(u: UnderstandingResult): number {
    // 根据理解的复杂度决定Token预算
    if (u.intent.specificity > 0.7) return 3000; // 具体问题
    if (u.intent.specificity > 0.4) return 1500; // 中等
    return 800; // 模糊问题
  }
  
  private async callLLM(prompt: string, options: { maxTokens: number }) {
    // 实际LLM调用
    return { content: '...', tokensUsed: 100 };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 黑盒特性演示
// ═══════════════════════════════════════════════════════════════════════

/**
 * 黑盒特性：
 * 1. 你看不到内部思考过程
 * 2. 只能看到输入输出
 * 3. 内部算法是"隐性"的
 */

const bb = createMetaCognitionBlackbox();

// 输入
const input = '我觉得今天心情不好，工作压力太大了';

// 输出（你只看到这个）
const output = bb.compile(input);

console.log('\n黑盒输出:');
console.log(JSON.stringify(output, null, 2));

// 你看不到的过程（在黑盒内部）:
// - 如何提取概念
// - 如何分析关系
// - 如何识别情感
// - 如何构建推理
// 这些都是"隐性"的！

// ═══════════════════════════════════════════════════════════════════════
// 与LLM协作
// ═══════════════════════════════════════════════════════════════════════

/**
 * 协作模式：
 * 1. 黑盒先编译（本地算法，无Token消耗）
 * 2. 根据编译结果决定是否需要LLM
 * 3. LLM调用时使用编译结果优化
 */

async function processWithBlackbox(input: string) {
  const blackbox = createMetaCognitionBlackbox();
  
  // 1. 黑盒编译（0 Token）
  const understanding = blackbox.compile(input);
  
  // 2. 决策（本地算法）
  if (understanding.intent.type === 'greeting') {
    // 简单问候，不调用LLM
    return {
      response: '你好！',
      tokensUsed: 0,
      method: 'blackbox-only',
    };
  }
  
  if (understanding.confidence < 0.3) {
    // 理解不足，请求澄清
    return {
      response: '能详细说说吗？',
      tokensUsed: 0,
      method: 'blackbox-clarify',
    };
  }
  
  // 3. 需要LLM，但用理解结果优化
  const tokenBudget = understanding.intent.specificity > 0.5 ? 2000 : 1000;
  
  // 调用LLM（使用理解结果作为提示）
  const response = await callLLM(
    `主题: ${understanding.intent.topic}
概念: ${understanding.coreConcepts.map(c => c.word).join(', ')}
用户问题: ${input}

请回答:`,
    { maxTokens: tokenBudget }
  );
  
  return {
    response,
    tokensUsed: tokenBudget,
    method: 'blackbox+llm',
    understanding,
  };
}

async function callLLM(prompt: string, options: { maxTokens: number }) {
  return 'LLM响应内容...';
}
