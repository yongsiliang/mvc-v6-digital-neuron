/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 神经网络状态 API
 * V6 Neural Network Status API
 * 
 * 获取 Hebbian 网络的实时统计信息
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { HebbianNetwork } from '@/lib/neuron-v6/hebbian-network';

export async function GET(request: NextRequest) {
  try {
    // 直接使用 HebbianNetwork 单例，不经过 innate-knowledge 初始化器
    const network = HebbianNetwork.getInstance();
    
    // 获取网络统计
    const stats = network.getStats();
    
    // 获取所有神经元
    const neurons = network.getAllNeurons();
    
    // 按类型分组统计
    const neuronsByType: Record<string, number> = {};
    for (const neuron of neurons) {
      neuronsByType[neuron.type] = (neuronsByType[neuron.type] || 0) + 1;
    }
    
    // 获取高激活神经元
    const highlyActiveNeurons = neurons
      .filter(n => n.activation > 0.5)
      .map(n => ({
        id: n.id.slice(0, 8),
        label: n.label,
        activation: Math.round(n.activation * 100) / 100,
        type: n.type,
      }))
      .slice(0, 20);
    
    // 获取强突触
    const allSynapses = neurons.flatMap(n => network.getOutgoingSynapses(n.id));
    const strongSynapses = allSynapses
      .filter(s => Math.abs(s.weight) > 0.5)
      .slice(0, 20)
      .map(s => {
        const fromNeuron = network.getNeuron(s.from);
        const toNeuron = network.getNeuron(s.to);
        return {
          from: fromNeuron?.label || s.from.slice(0, 8),
          to: toNeuron?.label || s.to.slice(0, 8),
          weight: Math.round(s.weight * 100) / 100,
        };
      });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      network: {
        // 核心统计
        totalNeurons: stats.totalNeurons,
        totalSynapses: stats.totalSynapses,
        
        // 激活状态
        averageActivation: Math.round(stats.averageActivation * 1000) / 1000,
        highlyActiveCount: stats.highlyActiveNeurons,
        
        // 权重状态
        averageWeight: Math.round(stats.averageWeight * 1000) / 1000,
        strongSynapseCount: stats.strongSynapses,
        
        // 网络密度
        density: stats.density.toExponential(4),
        
        // 神经元类型分布
        neuronsByType,
        
        // 详情
        highlyActiveNeurons,
        strongSynapses,
      },
    });
  } catch (error) {
    console.error('[API] 获取网络状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取网络状态失败' },
      { status: 500 }
    );
  }
}
