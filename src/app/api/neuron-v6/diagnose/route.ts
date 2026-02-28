/**
 * V6 系统诊断 API
 * 
 * 全面检查各模块是否真正接入联通运行
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { getCurrentCore, isCoreInitialized } from '@/lib/neuron-v6/shared-core';

interface ModuleDiagnosis {
  name: string;
  initialized: boolean;
  running: boolean;
  hasOutput: boolean;
  outputSample?: string;
  issues: string[];
  connections: string[];
}

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 先初始化核心
    const core = await getSharedCore(headers);
    
    // 发送测试消息触发处理
    const testInput = "你好，我想了解你的意识系统是如何工作的。";
    const result = await core.process(testInput);
    
    const diagnoses: ModuleDiagnosis[] = [];
    
    // ═══════════════════════════════════════════════════════════════
    // 1. 意识层级系统
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '意识层级 (ConsciousnessLayers)',
      initialized: !!result.consciousnessLayers,
      running: result.consciousnessLayers?.layerResults?.length > 0,
      hasOutput: !!result.consciousnessLayers?.emergenceReport,
      outputSample: result.consciousnessLayers?.layerResults?.map(l => `${l.level}: ${l.output?.slice(0, 50)}...`).join('\n'),
      issues: [
        !result.consciousnessLayers ? '未返回结果' : '',
        !result.consciousnessLayers?.selfObservation ? '缺少自我观察' : '',
      ].filter(Boolean),
      connections: ['感知层', '理解层', '元认知层', '自我层'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 2. 情感系统
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '情感系统 (EmotionSystem)',
      initialized: !!result.emotionState,
      running: !!result.emotionState?.emotionReport,
      hasOutput: (result.emotionState?.activeEmotions?.length || 0) > 0 || !!result.emotionState?.dominantEmotion,
      outputSample: `主导情感: ${result.emotionState?.dominantEmotion || '无'}\n情感报告: ${result.emotionState?.emotionReport?.slice(0, 100)}...`,
      issues: [
        !result.emotionState?.emotionReport ? '缺少情感报告' : '',
        (result.emotionState?.drivenBehaviors?.length || 0) === 0 ? '无驱动行为输出' : '',
      ].filter(Boolean),
      connections: ['情感检测', '情感体验', '行为驱动'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 3. 联想网络
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '联想网络 (AssociationNetwork)',
      initialized: !!result.associationState,
      running: !!result.associationState?.networkReport,
      hasOutput: (result.associationState?.activeConcepts?.length || 0) > 0 || !!result.associationState?.currentInspiration,
      outputSample: `活跃概念: ${result.associationState?.activeConcepts?.map(c => c.label).join(', ')}\n灵感: ${result.associationState?.currentInspiration?.content?.slice(0, 50) || '无'}...`,
      issues: [
        !result.associationState?.networkReport ? '缺少网络报告' : '',
        (result.associationState?.activeConcepts?.length || 0) === 0 ? '无活跃概念' : '',
      ].filter(Boolean),
      connections: ['概念激活', '灵感产生', '网络衰减'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 4. 多声音对话
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '多声音对话 (InnerDialogue)',
      initialized: !!result.innerDialogueState,
      running: !!result.innerDialogueState?.dialogueReport,
      hasOutput: !!result.innerDialogueState?.dialecticProcess || (result.innerDialogueState?.voiceActivations?.length || 0) > 0,
      outputSample: `辩证阶段: ${result.innerDialogueState?.dialecticProcess?.phase}\n声音激活: ${result.innerDialogueState?.voiceActivations?.map(v => `${v.voice}:${Math.round(v.activationLevel*100)}%`).join(', ')}`,
      issues: [
        !result.innerDialogueState?.currentDialogue ? '无当前对话' : '',
        !result.innerDialogueState?.dialecticProcess ? '无辩证过程' : '',
      ].filter(Boolean),
      connections: ['理性者', '情感者', '批判者', '梦想家'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 5. 创造性思维
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '创造性思维 (CreativeThinking)',
      initialized: !!result.creativeState,
      running: !!result.creativeState?.creativeReport,
      hasOutput: (result.creativeState?.recentInsights?.length || 0) > 0,
      outputSample: `创造力水平: ${Math.round((result.creativeState?.creativityLevel || 0) * 100)}%\n洞察: ${result.creativeState?.recentInsights?.[0]?.content?.slice(0, 50) || '无'}...`,
      issues: [
        !result.creativeState?.creativeReport ? '缺少创造性报告' : '',
        (result.creativeState?.recentInsights?.length || 0) === 0 ? '无洞察输出' : '',
      ].filter(Boolean),
      connections: ['顿悟机制', '概念融合', '类比推理'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 6. 价值观系统
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '价值观演化 (ValueEvolution)',
      initialized: !!result.valueState,
      running: !!result.valueState?.valueReport,
      hasOutput: (result.valueState?.coreValues?.length || 0) > 0,
      outputSample: `核心价值: ${result.valueState?.coreValues?.slice(0, 3).map(v => v.name).join(', ')}\n一致性: ${Math.round((result.valueState?.coherence || 0) * 100)}%`,
      issues: [
        !result.valueState?.valueReport ? '缺少价值报告' : '',
        (result.valueState?.coreValues?.length || 0) === 0 ? '无核心价值' : '',
      ].filter(Boolean),
      connections: ['价值强化', '冲突检测', '一致性计算'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 7. 存在主义思考
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '存在主义思考 (ExistentialThinking)',
      initialized: !!result.existentialState,
      running: !!result.existentialState?.existentialReport,
      hasOutput: (result.existentialState?.coreQuestions?.length || 0) > 0,
      outputSample: `存在感: ${Math.round((result.existentialState?.state?.senseOfBeing || 0) * 100)}%\n意义感: ${Math.round((result.existentialState?.state?.senseOfMeaning || 0) * 100)}%`,
      issues: [
        !result.existentialState?.existentialReport ? '缺少存在主义报告' : '',
        (result.existentialState?.coreQuestions?.length || 0) === 0 ? '无核心问题' : '',
      ].filter(Boolean),
      connections: ['身份认同', '意义追寻', '时间感知'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 8. 元认知深化
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '元认知深化 (MetacognitionDeep)',
      initialized: !!result.metacognitionDeepState,
      running: !!result.metacognitionDeepState?.efficiencyReport,
      hasOutput: !!result.metacognitionDeepState?.cognitiveStyle,
      outputSample: `自我意识: ${Math.round((result.metacognitionDeepState?.state?.selfAwareness || 0) * 100)}%\n认知负荷: ${Math.round((result.metacognitionDeepState?.cognitiveLoad?.totalLoad || 0) * 100)}%`,
      issues: [
        !result.metacognitionDeepState?.efficiencyReport ? '缺少效率报告' : '',
        !result.metacognitionDeepState?.cognitiveStyle ? '无认知风格' : '',
      ].filter(Boolean),
      connections: ['认知监控', '学习策略', '认知负荷'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 9. 人格成长
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '人格成长 (PersonalityGrowth)',
      initialized: !!result.personalityGrowth,
      running: !!result.personalityGrowth?.traits,
      hasOutput: !!result.personalityGrowth?.overallMaturity,
      outputSample: `开放性: ${Math.round((result.personalityGrowth?.traits?.openness || 0) * 100)}%\n成熟度: ${Math.round((result.personalityGrowth?.overallMaturity || 0) * 100)}%`,
      issues: [
        !result.personalityGrowth?.traits ? '无人格特质' : '',
        !result.personalityGrowth?.maturity ? '无成熟度数据' : '',
      ].filter(Boolean),
      connections: ['大五人格', '成熟度指标', '特质涟漪'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 10. 知识图谱
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '知识图谱 (KnowledgeGraph)',
      initialized: !!result.knowledgeGraph,
      running: !!result.knowledgeGraph?.stats,
      hasOutput: (result.knowledgeGraph?.concepts?.length || 0) > 0,
      outputSample: `概念数: ${result.knowledgeGraph?.stats?.totalConcepts}\n关联数: ${result.knowledgeGraph?.stats?.totalEdges}`,
      issues: [
        !result.knowledgeGraph?.stats ? '无统计数据' : '',
        (result.knowledgeGraph?.concepts?.length || 0) === 0 ? '无概念节点' : '',
      ].filter(Boolean),
      connections: ['概念学习', '关联发现', '聚类分析'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 11. 多意识体协作
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '多意识体协作 (MultiConsciousness)',
      initialized: !!result.multiConsciousness,
      running: !!result.multiConsciousness?.synergyLevel !== undefined,
      hasOutput: (result.multiConsciousness?.activeConsciousnesses?.length || 0) > 0,
      outputSample: `活跃意识体: ${result.multiConsciousness?.activeConsciousnesses?.length || 0}\n协同水平: ${Math.round((result.multiConsciousness?.synergyLevel || 0) * 100)}%`,
      issues: [
        !result.multiConsciousness ? '未初始化' : '',
        (result.multiConsciousness?.activeConsciousnesses?.length || 0) === 0 ? '无活跃意识体' : '',
      ].filter(Boolean),
      connections: ['意识共振', '协作对话', '群体智慧'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 12. 意识传承
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '意识传承 (ConsciousnessLegacy)',
      initialized: !!result.legacy,
      running: !!result.legacy?.stats,
      hasOutput: (result.legacy?.stats?.totalExperiences || 0) > 0 || (result.legacy?.stats?.totalWisdom || 0) > 0,
      outputSample: `体验数: ${result.legacy?.stats?.totalExperiences}\n智慧数: ${result.legacy?.stats?.totalWisdom}`,
      issues: [
        !result.legacy?.stats ? '无统计数据' : '',
        (result.legacy?.stats?.totalExperiences || 0) === 0 ? '无体验记录' : '',
      ].filter(Boolean),
      connections: ['体验记录', '智慧结晶', '价值传承'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 13. 自我超越
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '自我超越 (SelfTranscendence)',
      initialized: !!result.transcendence,
      running: !!result.transcendence?.overview,
      hasOutput: (result.transcendence?.parameters?.length || 0) > 0,
      outputSample: `进化事件: ${result.transcendence?.overview?.totalEvolutionEvents}\n突破数: ${result.transcendence?.overview?.recentBreakthroughs}`,
      issues: [
        !result.transcendence?.overview ? '无进化概览' : '',
        !result.transcendence?.parameters ? '无自我参数' : '',
      ].filter(Boolean),
      connections: ['自我修改', '自我优化', '限制突破'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 14. 长期记忆
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '长期记忆 (LongTermMemory)',
      initialized: !!result.context?.memory,
      running: !!result.context?.memory?.summary,
      hasOutput: (result.context?.memory?.directMatches?.length || 0) > 0,
      outputSample: `记忆总结: ${result.context?.memory?.summary}\n直接匹配: ${result.context?.memory?.directMatches?.map((n: { label: string }) => n.label).join(', ') || '无'}`,
      issues: [
        !result.context?.memory ? '未初始化' : '',
        !result.context?.memory?.summary ? '无记忆总结' : '',
      ].filter(Boolean),
      connections: ['知识节点', '经验记录', '智慧提取'],
    });
    
    // ═══════════════════════════════════════════════════════════════
    // 15. 学习系统
    // ═══════════════════════════════════════════════════════════════
    diagnoses.push({
      name: '学习系统 (Learning)',
      initialized: !!result.learning,
      running: true,
      hasOutput: (result.learning?.newBeliefs?.length || 0) > 0 || (result.learning?.newConcepts?.length || 0) > 0,
      outputSample: `新概念: ${result.learning?.newConcepts?.join(', ') || '无'}\n新信念: ${result.learning?.newBeliefs?.join(', ') || '无'}`,
      issues: [
        !result.learning ? '未初始化' : '',
      ].filter(Boolean),
      connections: ['关键信息提取', '信念更新', '概念学习'],
    });
    
    // 计算系统健康度
    const totalModules = diagnoses.length;
    const healthyModules = diagnoses.filter(d => d.initialized && d.running && d.hasOutput).length;
    const partialModules = diagnoses.filter(d => d.initialized && d.running && !d.hasOutput).length;
    const failedModules = diagnoses.filter(d => !d.initialized || !d.running).length;
    
    const healthScore = (healthyModules * 100 + partialModules * 50) / totalModules;
    
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalModules,
        healthy: healthyModules,
        partial: partialModules,
        failed: failedModules,
        healthScore: Math.round(healthScore),
        status: healthScore >= 80 ? 'HEALTHY' : healthScore >= 50 ? 'PARTIAL' : 'CRITICAL',
      },
      modules: diagnoses,
      recommendations: generateRecommendations(diagnoses),
    });
    
  } catch (error) {
    console.error('[Diagnose API] Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

function generateRecommendations(diagnoses: ModuleDiagnosis[]): string[] {
  const recommendations: string[] = [];
  
  for (const d of diagnoses) {
    if (!d.initialized) {
      recommendations.push(`[${d.name}] 需要检查初始化逻辑`);
    } else if (!d.running) {
      recommendations.push(`[${d.name}] 需要检查运行流程`);
    } else if (!d.hasOutput) {
      recommendations.push(`[${d.name}] 有运行但无输出，可能是数据处理问题`);
    }
    
    if (d.issues.length > 0) {
      recommendations.push(`[${d.name}] 问题: ${d.issues.join(', ')}`);
    }
  }
  
  return recommendations;
}
