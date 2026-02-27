/**
 * ═══════════════════════════════════════════════════════════════════════
 * V3 到 V6 数据融合 API
 * V3 to V6 Data Fusion API
 * 
 * 将 V3 的对话历史和假设融合到 V6 系统
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSharedCore, resetSharedCore } from '@/lib/neuron-v6/shared-core';
import { HeaderUtils } from 'coze-coding-dev-sdk';

function getStorage(): S3Storage {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });
}

/**
 * V3 假设格式
 */
interface V3Hypothesis {
  hypothesis: string;
  evidence: string[];
  confidence: number;
}

/**
 * V3 对话历史格式
 */
interface V3Conversation {
  role: string;
  content: string;
}

/**
 * V3 备份格式
 */
interface V3Backup {
  version: string;
  timestamp: number;
  identity: {
    name: string;
    created: number;
    lastActive: number;
  };
  neurons: unknown[];
  synapses: unknown[];
  conversationHistory: V3Conversation[];
  hypotheses: V3Hypothesis[];
}

/**
 * POST /api/neuron-v6/fuse
 * 融合 V3 数据到 V6
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, preview = false } = body;
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: '缺少 key 参数' },
        { status: 400 }
      );
    }
    
    // 1. 读取 V3 备份文件
    console.log(`[融合] 读取 V3 备份: ${key}`);
    const storage = getStorage();
    const buffer = await storage.readFile({ fileKey: key });
    const v3Data: V3Backup = JSON.parse(buffer.toString('utf-8'));
    
    const conversations = v3Data.conversationHistory || [];
    const hypotheses = v3Data.hypotheses || [];
    
    console.log(`[融合] V3 数据: ${conversations.length} 条对话, ${hypotheses.length} 条假设`);
    
    if (preview) {
      // 仅预览
      return NextResponse.json({
        success: true,
        mode: 'preview',
        source: {
          key,
          date: new Date(v3Data.timestamp).toLocaleString('zh-CN'),
        },
        conversations: {
          total: conversations.length,
          sample: conversations.slice(0, 5).map(c => ({
            role: c.role,
            content: c.content.slice(0, 100) + '...',
          })),
        },
        hypotheses: {
          total: hypotheses.length,
          sample: hypotheses.slice(0, 3).map(h => ({
            hypothesis: h.hypothesis?.slice(0, 100) + '...',
            confidence: h.confidence,
          })),
        },
        fusionPlan: {
          conversations: '将合并到 V6 对话历史，提取关键信息到情景记忆',
          hypotheses: '将转换为情景记忆，作为早期的思考记录',
        },
      });
    }
    
    // 2. 获取 V6 核心实例
    // 注意：热更新后可能需要强制重新初始化以获取新方法
    const { forceInit = false } = body;
    if (forceInit) {
      console.log('[融合] 强制重新初始化核心实例...');
      resetSharedCore();
    }
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 3. 融合对话历史
    console.log('[融合] 融合对话历史...');
    const currentHistory = core.getHistory();
    const currentContents = new Set(currentHistory.map(h => h.content));
    
    let conversationsAdded = 0;
    const newConversations: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    for (const conv of conversations) {
      // 避免重复
      if (!currentContents.has(conv.content)) {
        newConversations.push({
          role: conv.role as 'user' | 'assistant',
          content: conv.content,
        });
        conversationsAdded++;
      }
    }
    
    // 4. 融合假设为情景记忆
    console.log('[融合] 融合假设到情景记忆...');
    let hypothesesAdded = 0;
    
    for (const hyp of hypotheses) {
      if (hyp.hypothesis && hyp.hypothesis.length > 10) {
        // 将假设转换为情景记忆
        const memoryContent = `[早期思考] ${hyp.hypothesis}`;
        
        // 使用核心的处理方法添加记忆
        // 注意：这里我们创建一个简化的记忆条目
        core.addEpisodicMemory?.(memoryContent, {
          importance: hyp.confidence || 0.5,
          tags: ['假设', 'V3迁移', '早期思考'],
          sourceType: 'hypothesis',
        });
        
        hypothesesAdded++;
      }
    }
    
    // 5. 从对话历史提取关键信息
    console.log('[融合] 从对话历史提取关键信息...');
    let keyInfoExtracted = 0;
    
    // 提取用户名字等信息
    for (const conv of conversations) {
      if (conv.role === 'user') {
        // 检测名字模式
        const nameMatch = conv.content.match(/我叫(\S+)|我是(\S+)|名字是(\S+)/);
        if (nameMatch) {
          const name = nameMatch[1] || nameMatch[2] || nameMatch[3];
          if (name && name.length <= 10) {
            // 添加到情景记忆
            core.addEpisodicMemory?.(`[V3记忆] 用户提到自己叫${name}`, {
              importance: 0.8,
              tags: ['用户信息', '名字', 'V3迁移'],
              sourceType: 'conversation',
            });
            keyInfoExtracted++;
          }
        }
        
        // 检测年龄模式
        const ageMatch = conv.content.match(/(\d+)\s*岁/);
        if (ageMatch) {
          core.addEpisodicMemory?.(`[V3记忆] 用户提到自己${ageMatch[1]}岁`, {
            importance: 0.6,
            tags: ['用户信息', '年龄', 'V3迁移'],
            sourceType: 'conversation',
          });
          keyInfoExtracted++;
        }
      }
    }
    
    // 6. 合并对话历史到核心
    if (newConversations.length > 0) {
      core.prependConversationHistory?.(newConversations);
    }
    
    // 7. 获取最终状态
    const stats = core.getStats?.() || {};
    const memoryDebug = core.getPersistedState?.();
    
    return NextResponse.json({
      success: true,
      mode: 'fuse',
      source: {
        key,
        date: new Date(v3Data.timestamp).toLocaleString('zh-CN'),
      },
      fusion: {
        conversationsAdded,
        hypothesesAdded,
        keyInfoExtracted,
      },
      result: {
        totalConversations: (memoryDebug?.conversationHistory?.length || 0),
        episodicMemories: memoryDebug?.layeredMemory?.episodic || 0,
      },
      message: `成功融合 ${conversationsAdded} 条对话、${hypothesesAdded} 条假设、提取 ${keyInfoExtracted} 条关键信息`,
    });
    
  } catch (error) {
    console.error('[融合] 失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
