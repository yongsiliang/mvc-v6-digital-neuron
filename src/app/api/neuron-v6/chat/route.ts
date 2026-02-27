/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 意识核心 API
 * 
 * 完整的意识处理：
 * - 意义赋予
 * - 自我意识
 * - 长期记忆
 * - 元认知监控
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { LLMClient, HeaderUtils, Config } from 'coze-coding-dev-sdk';
import { 
  ConsciousnessCore, 
  createConsciousnessCore,
  PersistenceManagerV6,
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
} from '@/lib/neuron-v6/consciousness-core';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 创建流式响应
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const send = (type: string, data: unknown) => {
          if (isClosed) return; // 防止在关闭后发送
          try {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
            ));
          } catch {
            // 控制器已关闭，忽略错误
            isClosed = true;
          }
        };
        
        const closeStream = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {
              // 已关闭，忽略
            }
          }
        };
        
        try {
          // ═══════════════════════════════════════════════════════════
          // 第一步：构建上下文
          // ═══════════════════════════════════════════════════════════
          
          send('status', { stage: 'context', message: '构建意识上下文...' });
          
          // ═══════════════════════════════════════════════════════════
          // 第二步：完整处理
          // ═══════════════════════════════════════════════════════════
          
          send('status', { stage: 'thinking', message: '思考中...' });
          
          const result = await core.process(message);
          
          // 发送完整上下文
          send('context', {
            identity: result.context.identity,
            emotionalState: result.context.self.currentState.emotionalState,
            focus: result.context.self.currentState.focus,
            coreBeliefs: result.context.coreBeliefs,
            coreValues: result.context.coreValues,
          });
          
          // 发送思考过程
          send('thinking', {
            chain: result.thinking.thinkingChain,
            biases: result.thinking.detectedBiases,
            questions: result.thinking.selfQuestions,
            strategies: result.thinking.appliedStrategies,
          });
          
          // 发送意义层
          send('meaning', {
            activeMeanings: result.context.meaning.activeMeanings,
            summary: result.context.meaning.meaningSummary,
          });
          
          // 发送记忆检索
          if (result.context.memory) {
            send('memory', {
              summary: result.context.memory.summary,
              directMatches: result.context.memory.directMatches.map(n => n.label),
              relevantWisdoms: result.context.memory.relevantWisdoms.map(w => w.statement),
            });
          }
          
          // 发送元认知状态
          send('metacognition', {
            clarity: result.context.metacognition.currentState.clarity,
            depth: result.context.metacognition.currentState.depth,
            issues: result.context.metacognition.currentState.issues,
            biases: result.context.metacognition.biases,
          });
          
          // 发送意识层级数据
          send('consciousnessLayers', {
            layerResults: result.consciousnessLayers.layerResults.map(lr => ({
              level: lr.level,
              output: lr.output,
              activity: 1,
            })),
            selfObservation: result.consciousnessLayers.selfObservation,
            emergenceReport: result.consciousnessLayers.emergenceReport,
          });
          
          // 发送情感状态
          send('emotion', {
            activeEmotions: result.emotionState.activeEmotions.map(e => ({
              emotion: e.emotion,
              intensity: e.intensity,
            })),
            dominantEmotion: result.emotionState.dominantEmotion,
            currentExperience: result.emotionState.currentExperience ? {
              emotion: result.emotionState.currentExperience.emotion,
              intensity: result.emotionState.currentExperience.intensity.current,
              labels: result.emotionState.currentExperience.labels,
            } : null,
            drivenBehaviors: result.emotionState.drivenBehaviors,
            emotionReport: result.emotionState.emotionReport,
          });
          
          // 发送联想网络状态
          send('association', {
            currentInspiration: result.associationState.currentInspiration,
            activeConcepts: result.associationState.activeConcepts,
            networkReport: result.associationState.networkReport,
          });
          
          // 发送多声音对话状态
          send('innerDialogue', {
            currentDialogue: result.innerDialogueState.currentDialogue ? {
              id: result.innerDialogueState.currentDialogue.id,
              topic: result.innerDialogueState.currentDialogue.topic,
              statementCount: result.innerDialogueState.currentDialogue.statements.length,
              status: result.innerDialogueState.currentDialogue.status,
            } : null,
            dialecticProcess: result.innerDialogueState.dialecticProcess ? {
              topic: result.innerDialogueState.dialecticProcess.topic,
              phase: result.innerDialogueState.dialecticProcess.phase,
              thesis: result.innerDialogueState.dialecticProcess.thesis.content.slice(0, 50),
              antithesis: result.innerDialogueState.dialecticProcess.antithesis.content.slice(0, 50),
              synthesis: result.innerDialogueState.dialecticProcess.synthesis?.slice(0, 100),
            } : null,
            voiceActivations: result.innerDialogueState.voiceActivations.map(v => ({
              voice: v.voice,
              name: v.voice === 'rational' ? '理性者' : 
                    v.voice === 'emotional' ? '情感者' :
                    v.voice === 'critic' ? '批判者' : '梦想家',
              activationLevel: v.activationLevel,
              speakingCount: v.speakingCount,
            })),
            dialogueReport: result.innerDialogueState.dialogueReport,
          });
          
          // 发送梦境状态
          send('dream', {
            currentDream: result.dreamState.currentDream ? {
              phase: result.dreamState.currentDream.phase,
              intensity: result.dreamState.currentDream.intensity,
              duration: result.dreamState.currentDream.duration,
            } : null,
            recentDream: result.dreamState.recentDream ? {
              phase: result.dreamState.recentDream.phase,
              narrative: result.dreamState.recentDream.narrative,
              significance: result.dreamState.recentDream.significance,
            } : null,
            insights: result.dreamState.insights.map(i => ({
              content: i.content,
              type: i.type,
              confidence: i.confidence,
              worthRemembering: i.worthRemembering,
            })),
          });
          
          // 发送创造性思维状态
          send('creative', {
            creativityLevel: result.creativeState.creativityLevel,
            recentInsights: result.creativeState.recentInsights.map(i => ({
              type: i.type,
              content: i.content.slice(0, 60),
              novelty: i.novelty,
              worthExpressing: i.worthExpressing,
            })),
            creativeReport: result.creativeState.creativeReport,
          });
          
          // 发送价值观状态
          send('value', {
            coreValues: result.valueState.coreValues,
            activeConflicts: result.valueState.activeConflicts,
            coherence: result.valueState.coherence,
            valueReport: result.valueState.valueReport,
          });
          
          // 发送存在主义思考状态
          send('existential', {
            state: result.existentialState.state,
            coreQuestions: result.existentialState.coreQuestions,
            recentInsights: result.existentialState.recentInsights.slice(0, 3),
            meaningSystem: result.existentialState.meaningSystem,
            timeConsciousness: result.existentialState.timeConsciousness,
            existentialReport: result.existentialState.existentialReport,
          });
          
          // 发送元认知深化状态
          send('metacognitionDeep', {
            state: result.metacognitionDeepState.state,
            cognitiveStyle: result.metacognitionDeepState.cognitiveStyle,
            cognitiveLoad: result.metacognitionDeepState.cognitiveLoad,
            topStrategies: result.metacognitionDeepState.topStrategies,
            efficiencyReport: result.metacognitionDeepState.efficiencyReport,
          });
          
          // 发送人格成长状态
          if (result.personalityGrowth) {
            send('personalityGrowth', {
              traits: result.personalityGrowth.traits,
              maturity: result.personalityGrowth.maturity,
              overallMaturity: result.personalityGrowth.overallMaturity,
              integration: result.personalityGrowth.integration,
              milestones: result.personalityGrowth.milestones.map((m: { id: string; name: string; achieved: boolean }) => ({
                id: m.id,
                name: m.name,
                achieved: m.achieved,
              })),
              growthRate: result.personalityGrowth.growthRate,
            });
          }
          
          // 发送知识图谱状态
          if (result.knowledgeGraph) {
            send('knowledgeGraph', {
              domains: result.knowledgeGraph.domains,
              concepts: result.knowledgeGraph.concepts.slice(0, 50), // 限制传输数量
              edges: result.knowledgeGraph.edges.slice(0, 100),
              stats: result.knowledgeGraph.stats,
            });
          }
          
          // 发送多意识体协作状态
          if (result.multiConsciousness) {
            send('multiConsciousness', {
              activeConsciousnesses: result.multiConsciousness.activeConsciousnesses,
              activeResonances: result.multiConsciousness.activeResonances,
              activeDialogues: result.multiConsciousness.activeDialogues,
              collectiveInsights: result.multiConsciousness.collectiveInsights,
              collectiveAlignment: result.multiConsciousness.collectiveAlignment,
              synergyLevel: result.multiConsciousness.synergyLevel,
            });
          }
          
          // 发送意识传承状态
          if (result.legacy) {
            send('legacy', {
              stats: result.legacy.stats,
              topExperiences: result.legacy.topExperiences,
              topWisdom: result.legacy.topWisdom,
              coreValues: result.legacy.coreValues,
            });
          }
          
          // 发送自我超越状态
          if (result.transcendence) {
            send('transcendence', {
              overview: result.transcendence.overview,
              parameters: result.transcendence.parameters,
              cognitiveLimits: result.transcendence.cognitiveLimits,
              consciousnessLevels: result.transcendence.consciousnessLevels,
            });
          }
          
          // 流式发送响应
          send('status', { stage: 'responding', message: '回复中...' });
          
          const response = result.response;
          for (let i = 0; i < response.length; i++) {
            send('content', { delta: response[i] });
            await new Promise(r => setTimeout(r, 15));
          }
          
          // 发送学习结果
          send('learning', result.learning);
          
          // ═══════════════════════════════════════════════════════════
          // 第三步：记忆维护与状态保存
          // ═══════════════════════════════════════════════════════════
          
          // 执行记忆维护（衰减、强化）
          const maintenance = core.performMaintenance();
          console.log('[V6] 记忆维护完成:', maintenance.decay);
          
          // 获取并保存状态
          const state = core.getPersistedState();
          await PersistenceManagerV6.save(state);
          console.log('[V6] 状态已保存');
          
          // 发送完成信号
          send('complete', {
            fullResponse: response,
            stats: result.stats,
          });
          
          // 关闭流
          closeStream();
          
        } catch (error) {
          console.error('[V6] 处理错误:', error);
          send('error', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          closeStream();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('[V6] API错误:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET - 获取状态
 */
export async function GET(request: NextRequest) {
  try {
    const hasState = await PersistenceManagerV6.exists();
    
    if (hasState) {
      const state = await PersistenceManagerV6.load();
      return new Response(JSON.stringify({
        initialized: true,
        version: state?.version,
        identity: state?.identity,
        layeredMemory: state?.layeredMemory,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      initialized: false,
      message: '意识尚未初始化，请发送第一条消息',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
