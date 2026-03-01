/**
 * Hebbian神经网络单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HebbianNetwork } from '../hebbian-network';

describe('HebbianNetwork', () => {
  let network: HebbianNetwork;

  beforeEach(() => {
    // 重置单例并创建新实例
    HebbianNetwork.reset();
    network = HebbianNetwork.getInstance();
  });

  afterEach(() => {
    HebbianNetwork.reset();
  });

  describe('createNeuron', () => {
    it('应该能创建神经元', () => {
      const neuron = network.createNeuron({
        label: '测试神经元',
        type: 'concept',
      });

      expect(neuron).toBeDefined();
      expect(neuron.id).toBeDefined();
      expect(neuron.label).toBe('测试神经元');
      expect(neuron.type).toBe('concept');
      expect(neuron.activation).toBe(0);
    });

    it('应该为神经元生成默认值', () => {
      const neuron = network.createNeuron({});

      expect(neuron.id).toBeDefined();
      expect(neuron.preferenceVector).toBeDefined();
      expect(Array.isArray(neuron.preferenceVector)).toBe(true);
      expect(neuron.bias).toBeDefined();
    });
  });

  describe('getNeuron', () => {
    it('应该能获取已创建的神经元', () => {
      const created = network.createNeuron({ label: '测试' });
      const retrieved = network.getNeuron(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
    });

    it('应该对不存在的神经元返回 undefined', () => {
      const neuron = network.getNeuron('non-existent');

      expect(neuron).toBeUndefined();
    });
  });

  describe('createSynapse', () => {
    it('应该能创建突触连接', () => {
      const n1 = network.createNeuron({ label: '神经元1' });
      const n2 = network.createNeuron({ label: '神经元2' });

      const synapse = network.createSynapse({
        from: n1.id,
        to: n2.id,
        weight: 0.5,
      });

      expect(synapse).toBeDefined();
      expect(synapse!.from).toBe(n1.id);
      expect(synapse!.to).toBe(n2.id);
      expect(synapse!.weight).toBe(0.5);
    });
  });

  describe('setActivation', () => {
    it('应该能设置神经元激活值', () => {
      const neuron = network.createNeuron({ label: '测试' });

      network.setActivation(neuron.id, 0.8);
      const retrieved = network.getNeuron(neuron.id);

      expect(retrieved!.activation).toBe(0.8);
    });
  });

  describe('spreadActivation', () => {
    it('应该能传播激活', () => {
      const n1 = network.createNeuron({ label: '输入' });
      const n2 = network.createNeuron({ label: '输出' });
      
      network.createSynapse({ from: n1.id, to: n2.id, weight: 0.5 });
      network.setActivation(n1.id, 1.0);

      const spreadResult = network.spreadActivation();

      expect(spreadResult).toBeDefined();
      expect(spreadResult.steps).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('应该能返回网络统计信息', () => {
      network.createNeuron({ label: '神经元1' });
      network.createNeuron({ label: '神经元2' });

      const stats = network.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalNeurons).toBeGreaterThanOrEqual(2);
      expect(stats.totalSynapses).toBeDefined();
      expect(stats.averageActivation).toBeDefined();
    });
  });

  describe('getNetworkState', () => {
    it('应该能返回网络状态', () => {
      network.createNeuron({ label: '测试' });

      const state = network.getNetworkState();

      expect(state).toBeDefined();
      expect(state.neurons).toBeDefined();
      expect(Array.isArray(state.neurons)).toBe(true);
      expect(state.stats).toBeDefined();
    });
  });
});
