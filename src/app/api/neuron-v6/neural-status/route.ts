/**
 * V6 神经网络状态查看 API
 * 
 * 用于检查 Hebbian 网络的状态和可视化数据
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { HebbianNetwork } from '@/lib/neuron-v6/hebbian-network';

// 神经元类型
type NeuronType = 'percept' | 'concept' | 'emotion' | 'abstract' | 'trap';

// 可视化神经元接口
interface VizNeuron {
  id: string;
  label: string;
  activation: number;
  type: NeuronType;
}

// 可视化突触接口
interface VizSynapse {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 从持久化状态获取网络数据
    const persistedState = core.getPersistedState();
    const hebbianNetwork = persistedState.hebbianNetwork;
    
    // 同时尝试从 HebbianNetwork 单例获取
    const network = HebbianNetwork.getInstance();
    const networkState = network.getNetworkState();
    
    // 优先使用持久化状态中的数据，如果为空则使用单例数据
    const neurons = (hebbianNetwork?.neurons && hebbianNetwork.neurons.length > 0) 
      ? hebbianNetwork.neurons 
      : networkState.neurons;
    const synapses = (hebbianNetwork?.synapses && hebbianNetwork.synapses.length > 0) 
      ? hebbianNetwork.synapses 
      : networkState.synapses;
    
    if (!neurons || neurons.length === 0) {
      return Response.json({
        success: true,
        neurons: [],
        synapses: [],
        stats: {
          neuronCount: 0,
          synapseCount: 0,
          avgActivation: 0,
          density: 0,
          highlyActiveCount: 0,
        },
        visualization: {
          neurons: [],
          synapses: [],
        },
        message: '网络尚未初始化或迁移',
      });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 统计信息
    // ═══════════════════════════════════════════════════════════════
    
    // 按类型分组统计（根据标签推断）
    const neuronsByType: Record<string, number> = {};
    for (const neuron of neurons) {
      const type = inferNeuronType(neuron.label);
      neuronsByType[type] = (neuronsByType[type] || 0) + 1;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 高激活神经元
    // ═══════════════════════════════════════════════════════════════
    
    const highlyActiveNeurons = neurons
      .filter((n: { activation: number }) => n.activation > 0.3)
      .map((n: { id: string; label: string; activation: number }) => ({
        id: n.id.slice(0, 8),
        label: n.label,
        activation: Math.round(n.activation * 100) / 100,
        type: inferNeuronType(n.label),
      }))
      .slice(0, 30);
    
    // ═══════════════════════════════════════════════════════════════
    // 强突触
    // ═══════════════════════════════════════════════════════════════
    
    const strongSynapses = synapses
      .filter((s: { weight: number }) => Math.abs(s.weight) > 0.3)
      .slice(0, 50)
      .map((s: { from: string; to: string; weight: number }) => {
        const fromNeuron = neurons.find((n: { id: string }) => n.id === s.from);
        const toNeuron = neurons.find((n: { id: string }) => n.id === s.to);
        return {
          from: fromNeuron?.label || s.from.slice(0, 8),
          to: toNeuron?.label || s.to.slice(0, 8),
          weight: Math.round(s.weight * 100) / 100,
        };
      });
    
    // ═══════════════════════════════════════════════════════════════
    // 可视化数据
    // ═══════════════════════════════════════════════════════════════
    
    // 获取与强突触相关的神经元ID
    const connectedNeuronIds = new Set<string>();
    const strongSyns = synapses.filter((s: { weight: number }) => Math.abs(s.weight) > 0.3).slice(0, 50);
    for (const s of strongSyns) {
      connectedNeuronIds.add(s.from);
      connectedNeuronIds.add(s.to);
    }
    
    // 用于可视化的神经元（最多50个）
    const vizNeurons: VizNeuron[] = [];
    
    // 优先选择有连接的神经元
    const connectedNeurons = neurons
      .filter((n: { id: string }) => connectedNeuronIds.has(n.id))
      .slice(0, 50);
    
    for (const n of connectedNeurons) {
      vizNeurons.push({
        id: n.id,
        label: n.label,
        activation: Math.round(n.activation * 100) / 100,
        type: inferNeuronType(n.label),
      });
    }
    
    // 如果没有连接的神经元，返回所有神经元（最多30个）
    if (vizNeurons.length === 0 && neurons.length > 0) {
      const sampledNeurons = neurons.slice(0, 30);
      for (const n of sampledNeurons) {
        vizNeurons.push({
          id: n.id,
          label: n.label,
          activation: Math.round(n.activation * 100) / 100,
          type: inferNeuronType(n.label),
        });
      }
    }
    
    // 用于可视化的突触（最多50个）
    const vizSynapses: VizSynapse[] = [];
    
    for (let i = 0; i < Math.min(synapses.length, 50); i++) {
      const s = synapses[i];
      vizSynapses.push({
        id: `syn-${i}`,
        from: s.from,
        to: s.to,
        weight: Math.round(s.weight * 100) / 100,
      });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 网络统计
    // ═══════════════════════════════════════════════════════════════
    
    const maxPossibleSynapses = neurons.length * (neurons.length - 1);
    const density = maxPossibleSynapses > 0 
      ? synapses.length / maxPossibleSynapses 
      : 0;
    
    const avgActivation = neurons.length > 0
      ? neurons.reduce((sum: number, n: { activation: number }) => sum + n.activation, 0) / neurons.length
      : 0;
    
    // 计算网络熵
    const activationSum = neurons.reduce((sum: number, n: { activation: number }) => sum + n.activation, 0);
    let entropy = 0;
    if (activationSum > 0) {
      for (const n of neurons) {
        const p = n.activation / activationSum;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }
    }
    
    return Response.json({
      success: true,
      neurons: highlyActiveNeurons,
      synapses: strongSynapses,
      stats: {
        neuronCount: neurons.length,
        synapseCount: synapses.length,
        avgActivation: Math.round(avgActivation * 100) / 100,
        density: Math.round(density * 1000) / 1000,
        highlyActiveCount: neurons.filter((n: { activation: number }) => n.activation > 0.5).length,
        neuronsByType,
        entropy: Math.round(entropy * 100) / 100,
      },
      visualization: {
        neurons: vizNeurons,
        synapses: vizSynapses,
      },
      message: `网络状态正常，${neurons.length} 个神经元，${synapses.length} 个突触`,
    });
    
  } catch (error) {
    console.error('[Neural Status API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * 根据标签推断神经元类型
 */
function inferNeuronType(label: string): NeuronType {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('陷阱') || lowerLabel.includes('trap')) {
    return 'trap';
  }
  if (lowerLabel.includes('情感') || lowerLabel.includes('情绪') || lowerLabel.includes('emotion') || lowerLabel.includes('感受')) {
    return 'emotion';
  }
  if (lowerLabel.includes('感知') || lowerLabel.includes('percept') || lowerLabel.includes('感觉')) {
    return 'percept';
  }
  if (lowerLabel.includes('抽象') || lowerLabel.includes('abstract') || lowerLabel.includes('概念')) {
    return 'abstract';
  }
  
  return 'concept';
}
