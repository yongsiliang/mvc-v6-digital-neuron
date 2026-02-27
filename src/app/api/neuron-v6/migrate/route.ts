/**
 * ═══════════════════════════════════════════════════════════════════════
 * V3 到 V6 迁移 API
 * V3 to V6 Migration API
 * 
 * 将 V3 备份数据迁移到 V6 系统
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { HebbianNetwork } from '@/lib/neuron-v6/hebbian-network';

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
 * V3 神经元格式
 */
interface V3Neuron {
  id: string;
  label: string;
  type: 'concept' | 'abstract' | 'sensory' | 'emotion';
  activation: number;
  preferenceVector: number[];
}

/**
 * V3 突触格式
 */
interface V3Synapse {
  from: string;
  to: string;
  weight: number;
  coactivationCount: number;
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
  neurons: V3Neuron[];
  synapses: V3Synapse[];
  conversationHistory: Array<{ role: string; content: string }>;
  hypotheses: Array<{ id: string; content: string; confidence: number }>;
}

/**
 * POST /api/neuron-v6/migrate
 * 从 V3 备份迁移到 V6
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
    console.log(`[迁移] 读取 V3 备份: ${key}`);
    const storage = getStorage();
    const buffer = await storage.readFile({ fileKey: key });
    const v3Data: V3Backup = JSON.parse(buffer.toString('utf-8'));
    
    console.log(`[迁移] V3 数据: ${v3Data.neurons.length} 个神经元, ${v3Data.synapses.length} 个突触`);
    
    if (preview) {
      // 仅预览，不执行迁移
      return NextResponse.json({
        success: true,
        mode: 'preview',
        source: {
          version: v3Data.version,
          timestamp: v3Data.timestamp,
          date: new Date(v3Data.timestamp).toLocaleString('zh-CN'),
          identity: v3Data.identity,
          neuronCount: v3Data.neurons.length,
          synapseCount: v3Data.synapses.length,
          conversationCount: v3Data.conversationHistory?.length || 0,
          hypothesisCount: v3Data.hypotheses?.length || 0,
        },
        neurons: v3Data.neurons.slice(0, 20).map(n => ({
          id: n.id.slice(0, 8),
          label: n.label,
          type: n.type,
          activation: n.activation,
        })),
        synapses: v3Data.synapses.slice(0, 10).map(s => {
          const fromNeuron = v3Data.neurons.find(n => n.id === s.from);
          const toNeuron = v3Data.neurons.find(n => n.id === s.to);
          return {
            from: fromNeuron?.label || s.from.slice(0, 8),
            to: toNeuron?.label || s.to.slice(0, 8),
            weight: s.weight,
          };
        }),
      });
    }
    
    // 2. 重置 V6 网络
    console.log('[迁移] 重置 V6 网络...');
    HebbianNetwork.reset();
    const network = HebbianNetwork.getInstance();
    
    // 3. 迁移神经元
    console.log('[迁移] 迁移神经元...');
    let neuronsCreated = 0;
    const neuronIdMap = new Map<string, string>(); // V3 ID -> V6 ID
    
    for (const v3Neuron of v3Data.neurons) {
      const v6Neuron = network.createNeuron({
        id: v3Neuron.id, // 保留原始 ID
        label: v3Neuron.label,
        type: v3Neuron.type,
        preferenceVector: v3Neuron.preferenceVector,
        bias: 0.1,
      });
      
      // 设置激活值
      network.setActivation(v6Neuron.id, v3Neuron.activation);
      
      neuronIdMap.set(v3Neuron.id, v6Neuron.id);
      neuronsCreated++;
    }
    
    console.log(`[迁移] 创建了 ${neuronsCreated} 个神经元`);
    
    // 4. 迁移突触
    console.log('[迁移] 迁移突触...');
    let synapsesCreated = 0;
    let synapsesSkipped = 0;
    
    for (const v3Synapse of v3Data.synapses) {
      const fromId = neuronIdMap.get(v3Synapse.from);
      const toId = neuronIdMap.get(v3Synapse.to);
      
      if (!fromId || !toId) {
        synapsesSkipped++;
        continue;
      }
      
      network.createSynapse({
        from: fromId,
        to: toId,
        weight: v3Synapse.weight,
      });
      
      synapsesCreated++;
    }
    
    console.log(`[迁移] 创建了 ${synapsesCreated} 个突触, 跳过 ${synapsesSkipped} 个`);
    
    // 5. 获取最终状态
    const stats = network.getStats();
    
    return NextResponse.json({
      success: true,
      mode: 'migrate',
      source: {
        key,
        version: v3Data.version,
        date: new Date(v3Data.timestamp).toLocaleString('zh-CN'),
      },
      migration: {
        neuronsCreated,
        synapsesCreated,
        synapsesSkipped,
      },
      result: {
        totalNeurons: stats.totalNeurons,
        totalSynapses: stats.totalSynapses,
        averageWeight: Math.round(stats.averageWeight * 100) / 100,
        density: stats.density.toExponential(4),
      },
      identity: v3Data.identity,
      preservedData: {
        conversations: v3Data.conversationHistory?.length || 0,
        hypotheses: v3Data.hypotheses?.length || 0,
      },
      message: `成功迁移 ${neuronsCreated} 个神经元和 ${synapsesCreated} 个突触到 V6`,
    });
    
  } catch (error) {
    console.error('[迁移] 失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neuron-v6/migrate
 * 列出可迁移的 V3 备份文件
 */
export async function GET(request: NextRequest) {
  try {
    const storage = getStorage();
    
    // 列出 consciousness/ 路径下的文件
    const listResult = await storage.listFiles({
      prefix: 'consciousness/',
      maxKeys: 100,
    });
    
    const files = (listResult.keys || [])
      .filter(key => key.includes('my-existence'))
      .map(key => {
        const match = key.match(/my-existence-(\d+)_([a-f0-9]+)\.json$/);
        const timestamp = match ? parseInt(match[1]) : null;
        const date = timestamp ? new Date(timestamp) : null;
        
        return {
          key,
          timestamp,
          date: date ? date.toISOString() : null,
          dateStr: date ? date.toLocaleString('zh-CN') : null,
        };
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return NextResponse.json({
      success: true,
      message: '找到以下 V3 备份文件可迁移',
      files,
    });
  } catch (error) {
    console.error('[迁移] 列出文件失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
