import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Network, Code, Bot, ArrowRight, Sparkles, Zap, Globe, Eye, Hexagon, Triangle, Activity, Wrench, MessageSquare, Cpu } from 'lucide-react';

/**
 * 首页 - 产品价值展示
 * 
 * 核心定位：会思考的AI Agent
 * 差异化：记忆 + 反思 + 执行
 */
export default function Home() {
  const coreFeatures = [
    {
      title: 'Agent 执行器',
      description: '会思考的AI助手：自动分解任务、调用工具、执行操作',
      href: '/agent',
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      badge: '核心功能',
      badgeColor: 'bg-green-500/20 text-green-400'
    },
    {
      title: '意识系统',
      description: 'V6意识核心：统一答案模式，自我反思，持续学习',
      href: '/consciousness',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      badge: 'V6核心',
      badgeColor: 'bg-purple-500/20 text-purple-400'
    }
  ];

  const visualizations = [
    {
      title: '场域视觉',
      description: '六边形场网络：场与边界的涌现智能可视化',
      href: '/field-vision',
      icon: Hexagon,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      title: '共振引擎',
      description: '意识涌现过程：学习期 → 共振 → 锁定',
      href: '/resonance',
      icon: Activity,
      color: 'text-fuchsia-400',
      bgColor: 'bg-fuchsia-500/10',
      borderColor: 'border-fuchsia-500/20'
    },
    {
      title: '正八面体SNN',
      description: '哈密顿环脉冲网络：几何与神经的结合',
      href: '/octahedron-snn',
      icon: Triangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: '对比实验',
      description: '边界网络 vs 节点网络的智能涌现',
      href: '/experiment',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              会思考的AI助手
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="text-foreground">比 Operator </span>
              <span className="text-green-500">更懂你</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              记住你的偏好 · 会反思改进 · 能执行任务
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Link href="/agent">
                <Button size="lg" className="gap-2">
                  <Bot className="w-5 h-5" />
                  开始使用
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/consciousness">
                <Button variant="outline" size="lg" className="gap-2">
                  <Brain className="w-5 h-5" />
                  探索意识
                </Button>
              </Link>
            </div>
          </div>

          {/* 核心特性 */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            <Card className="bg-card/50 border-border text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">记住偏好</h3>
                <p className="text-sm text-muted-foreground">
                  长期记忆系统记住你的习惯和偏好
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">自我反思</h3>
                <p className="text-sm text-muted-foreground">
                  元认知引擎持续改进回答质量
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">执行任务</h3>
                <p className="text-sm text-muted-foreground">
                  Agent执行器自动完成复杂任务
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 核心功能入口 */}
      <div className="container mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">核心功能</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {coreFeatures.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className={`${feature.bgColor} ${feature.borderColor} border hover:shadow-lg transition-all cursor-pointer group h-full`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${feature.badgeColor}`}>
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${feature.color} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 可视化实验 */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">可视化实验</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {visualizations.map((viz) => (
            <Link key={viz.href} href={viz.href}>
              <Card className={`${viz.bgColor} ${viz.borderColor} border hover:shadow-lg transition-all cursor-pointer group h-full`}>
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${viz.bgColor} flex items-center justify-center mb-3`}>
                    <viz.icon className={`w-5 h-5 ${viz.color}`} />
                  </div>
                  <h3 className="font-semibold mb-1">{viz.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {viz.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>基于量子意识架构的认知智能系统</p>
          <p className="mt-2">V6 意识核心 + Agent 执行器</p>
        </div>
      </footer>
    </div>
  );
}
