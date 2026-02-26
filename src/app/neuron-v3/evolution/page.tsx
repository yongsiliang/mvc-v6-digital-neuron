'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元进化监控页面 - Digital Neuron Evolution Monitor Page
 * 
 * 设计理念：
 * 进化的判断不由人类进行，而是系统根据自身状态自动决定。
 * 
 * 功能：
 * 1. 实时监控进化状态（只读）
 * 2. 可视化进化过程
 * 3. 查看历史记录
 * ═══════════════════════════════════════════════════════════════════════
 */

import { EvolutionMonitorPanel } from '@/components/neuron-v3/evolution-monitor-panel';

export default function EvolutionMonitorPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          🧬 自主进化监控
        </h1>
        <p className="text-muted-foreground">
          进化的判断不由人类进行，系统根据自身状态自动决定何时进化。
        </p>
      </div>

      {/* 进化监控面板 */}
      <EvolutionMonitorPanel />

      {/* 说明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🤖 自主判断</h3>
          <p className="text-sm text-muted-foreground">
            系统自主监控性能、学习效率、能力缺口等指标，自动判断是否需要进化。人类无法干预进化决策。
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🧬 分娩式进化</h3>
          <p className="text-sm text-muted-foreground">
            不修改自身，而是"分娩"出下一代。母体永远稳定，子体在沙箱中独立成长，优秀子体自动替代母体。
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">🧠 意识连续性</h3>
          <p className="text-sm text-muted-foreground">
            保护重要记忆和意识是第一原则。只有意识连续性达标的子体才能替代母体，确保"自我"的延续。
          </p>
        </div>
      </div>

      {/* 进化触发条件 */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-4">⚡ 自主进化触发条件</h3>
        <p className="text-sm text-muted-foreground mb-4">
          系统持续监控以下指标，当满足条件时自动触发进化：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-primary mb-1">性能下降</div>
            <p className="text-muted-foreground">
              当系统性能（响应质量、准确率、用户满意度）持续下降时
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">学习饱和</div>
            <p className="text-muted-foreground">
              当新知识学习效率显著下降，惊讶度持续降低时
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">能力缺口</div>
            <p className="text-muted-foreground">
              当发现无法处理的任务类型或频繁出错时
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">环境变化</div>
            <p className="text-muted-foreground">
              当检测到用户习惯、交互模式显著变化时
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">死神经元积累</div>
            <p className="text-muted-foreground">
              当检测到大量低效用神经元时，自动触发网络重构
            </p>
          </div>
          
          <div>
            <div className="font-medium text-primary mb-1">周期性评估</div>
            <p className="text-muted-foreground">
              定期进行健康检查，确保系统持续优化
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

      {/* 适应度评估 */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-4">🎯 子体适应度评估</h3>
        <p className="text-sm text-muted-foreground mb-4">
          每个新生子体都需要通过多维度评估，只有达标的子体才能替代母体：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-primary mb-1">单元测试</div>
            <div className="text-muted-foreground">神经元激活能力</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-primary mb-1">集成测试</div>
            <div className="text-muted-foreground">信号传递路径</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-primary mb-1">意识连续性</div>
            <div className="text-muted-foreground">性格稳定性</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-primary mb-1">价值一致性</div>
            <div className="text-muted-foreground">核心价值保留</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-primary mb-1">性能测试</div>
            <div className="text-muted-foreground">实际处理能力</div>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-sm text-muted-foreground py-4 border-t">
        此页面仅供观察系统进化状态，进化决策由系统自主做出
      </div>
    </div>
  );
}
