/**
 * SNN 神经基质层 - 统一导出
 */

export { LIFNeuron, createLIFNeuron, createNeuronPopulation } from './neuron';
export { Synapse, STDPWindow, createSynapse, createRandomConnections } from './synapse';
export { SpikingNeuralNetwork, createSNN } from './network';
export { SpikeEncoder, createSpikeEncoder } from './encoder';
export { SpikeDecoder, createSpikeDecoder } from './decoder';

// 类型重导出
export type {
  NeuronId,
  SynapseId,
  NeuronType,
  NeuronRegion,
  LIFNeuronState,
  SynapseState,
  Spike,
  SpikeTrain,
  NetworkSnapshot,
  SNNConfig,
  DEFAULT_SNN_CONFIG,
  EncodingType,
  EncodingConfig,
  TextToSpikeResult,
  SpikeToTextResult
} from '../types';
