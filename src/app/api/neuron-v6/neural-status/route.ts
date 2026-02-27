/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 神经网络状态 API
 * V6 Neural Network Status API
 * 
 * 获取 Hebbian 网络的实时统计信息
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function GET(request: NextRequest) {
  try {
    // 使用 ConsciousnessCore 的网络实例
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 获取持久化状态中的网络数据
    const state = core.getPersistedState();
    const networkState = state.hebbianNetwork;
    
    if (!networkState) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        network: {
          totalNeurons: 0,
          totalSynapses: 0,
          averageActivation: 0,
          highlyActiveCount: 0,
          averageWeight: 0,
          strongSynapseCount: 0,
          density: '0.0000e+0',
          neuronsByType: {},
          highlyActiveNeurons: [],
          strongSynapses: [],
        },
        message: '网络尚未初始化或迁移',
      });
    }
    
    const neurons = networkState.neurons;
    const synapses = networkState.synapses;
    
    // 按类型分组统计
    const neuronsByType: Record<string, number> = {};
    for (const neuron of neurons) {
      // 根据标签推断类型
      const type = neuron.label.includes('陷阱') ? 'trap' : 'concept';
      neuronsByType[type] = (neuronsByType[type] || 0) + 1;
    }
    
    // 获取高激活神经元
    const highlyActiveNeurons = neurons
      .filter(n => n.activation > 0.5)
      .map(n => ({
        id: n.id.slice(0, 8),
        label: n.label,
        activation: Math.round(n.activation * 100) / 100,
      }))
      .slice(0, 20);
    
    // 获取强突触
    const strongSynapses = synapses
      .filter(s => Math.abs(s.weight) > 0.5)
      .slice(0, 20)
      .map(s => {
        const fromNeuron = neurons.find(n => n.id === s.from);
        const toNeuron = neurons.find(n => n.id === s.to);
        return {
          from: fromNeuron?.label || s.from.slice(0, 8),
          to: toNeuron?.label || s.to.slice(0, 8),
          weight: Math.round(s.weight * 100) / 100,
        };
      });
    
    // 计算网络密度
    const maxPossibleSynapses = neurons.length * (neurons.length - 1);
    const density = maxPossibleSynapses > 0 
      ? synapses.length / maxPossibleSynapses 
      : 0;
    
    // 计算平均激活度
    const avgActivation = neurons.length > 0
      ? neurons.reduce((sum, n) => sum + n.activation, 0) / neurons.length
      : 0;
    
    // 计算平均权重
    const avgWeight = synapses.length > 0
      ? synapses.reduce((sum, s) => sum + Math.abs(s.weight), 0) / synapses.length
      : 0;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      network: {
        totalNeurons: neurons.length,
        totalSynapses: synapses.length,
        averageActivation: Math.round(avgActivation * 100) / 100,
        highlyActiveCount: highlyActiveNeurons.length,
        averageWeight: Math.round(avgWeight * 100) / 100,
        strongSynapseCount: strongSynapses.length,
        density: density.toExponential(4),
        neuronsByType,
        highlyActiveNeurons,
        strongSynapses,
      },
    });
    
  } catch (error) {
    console.error('[神经网络状态] 错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取状态失败' 
      },
      { status: 500 }
    );
  }
}
