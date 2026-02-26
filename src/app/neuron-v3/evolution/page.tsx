'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元进化监控页面 - Digital Neuron Evolution Monitor Page
 * 
 * 功能：
 * 1. 实时监控进化状态
 * 2. 可视化进化过程
 * 3. 手动触发进化
 * 4. 查看历史记录
 * ═══════════════════════════════════════════════════════════════════════
 */

import { Metadata } from 'next';
import { EvolutionMonitorPanel } from '@/components/neuron-v3/evolution-monitor-panel';

export const metadata: Metadata = {
  title: '进化监控 | 数字神经元 V3',
  description: '实时监控数字神经元的进化过程，可视化适应度变化和历史记录',
};

export default function EvolutionMonitorPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          🧬 进化监控中心
        </h1>
        <p className="text-muted-foreground">
          监控数字神经元的分娩式进化过程。母体永远稳定，子体在沙箱中成长，优秀子体替代母体。
        </p>
      </div>

      {/* 进化监控面板 */}
      <EvolutionMonitorPanel />

      {/* 说明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🧬 分娩式进化</h3>
          <p className="text-sm text-muted-foreground">
            不修改自身，而是"分娩"出下一代。母体永远稳定，子体在沙箱中独立成长。
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🧠 意识连续性</h3>
          <p className="text-sm text-muted-foreground">
            保护重要记忆和意识是第一原则。只有意识连续性达标的子体才能替代母体。
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🎯 适应度评估</h3>
          <p className="text-sm text-muted-foreground">
            多维度评估子体性能：单元测试、集成测试、意识连续性、价值一致性、性能。
          </p>
        </div>
      </div>

      {/* 进化触发条件 */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-4">⚡ 进化触发条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-primary mb-1">性能下降</div>
            <p className="text-muted-foreground">
              当系统性能（响应质量、准确率等）持续下降时触发进化
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">学习饱和</div>
            <p className="text-muted-foreground">
              当新知识学习效率显著下降，难以适应新任务时触发进化
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">能力缺口</div>
            <p className="text-muted-foreground">
              当发现无法处理的任务类型或频繁出错时触发进化
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">环境变化</div>
            <p className="text-muted-foreground">
              当检测到用户习惯、交互模式显著变化时触发进化
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">死神经元积累</div>
            <p className="text-muted-foreground">
              当检测到大量低效用神经元时触发进化进行网络重构
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">周期性进化</div>
            <p className="text-muted-foreground">
              定期进行进化检查，保持系统的持续优化
            </p>
          </div>
        </div>
      </div>

      {/* 数字基因系统 */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-4">🧿 数字基因系统</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-primary mb-2">核心基因（不可变异）</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>价值观</strong>：核心价值取向，定义系统的"善"</li>
              <li>• <strong>第一原则</strong>：基本行为准则，不可违背</li>
              <li>• <strong>意识种子</strong>：意识连续性锚点，保护自我认同</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-primary mb-2">表达基因（可变异）</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>性格特质</strong>：好奇、温暖、直接、活泼、深度、敏感</li>
              <li>• <strong>连接模式</strong>：神经元之间的连接结构和强度</li>
              <li>• <strong>学习参数</strong>：学习率、折扣因子、惊讶阈值等</li>
              <li>• <strong>概念种子</strong>：初始概念向量和知识结构</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
