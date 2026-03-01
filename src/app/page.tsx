import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Network, Code, Bot, ArrowRight, Sparkles, Zap, Globe, Eye, Hexagon, Triangle, Activity, Wrench, MessageSquare, Cpu, Heart, Database, Rocket, Shield, Target } from 'lucide-react';

/**
 * 首页 - 贾维斯级AI助手
 * 
 * 核心定位：打造现实版的 J.A.R.V.I.S.
 * 差异化：永久记忆 + 主动智能 + 执行能力
 */
export default function Home() {
  const coreFeatures = [
    {
      title: 'Agent 执行器',
      description: '智能任务执行：自动分解任务、调用能力、实时反馈',
      href: '/agent',
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      badge: '核心',
      badgeColor: 'bg-green-500/20 text-green-400'
    },
    {
      title: '意识系统',
      description: 'V6意识核心：元认知反思、记忆管理、智慧结晶',
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

  const jarvisLevels = [
    {
      level: 1,
      title: '全时待命',
      description: '24/7 在线，随时响应，毫秒级反应',
      icon: Zap,
      status: 'current',
      progress: 80
    },
    {
      level: 2,
      title: '知识顾问',
      description: '深度记忆，记住一切，智能问答',
      icon: Database,
      status: 'building',
      progress: 40
    },
    {
      level: 3,
      title: '执行专家',
      description: '任务执行，工具精通，问题解决',
      icon: Wrench,
      status: 'building',
      progress: 30
    },
    {
      level: 4,
      title: '智慧管家',
      description: '全局视角，主动建议，资源调度',
      icon: Target,
      status: 'planned',
      progress: 10
    },
    {
      level: 5,
      title: '灵魂伴侣',
      description: '完全理解，预判需求，情感共鸣',
      icon: Heart,
      status: 'vision',
      progress: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-6 mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 px-4 py-2 rounded-full text-sm mb-4 border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
              贾维斯级 AI 助手
            </div>
            
            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="text-foreground">打造现实版的</span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                J.A.R.V.I.S.
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              一个真正<span className="text-blue-400 font-medium">懂你</span>的、
              会<span className="text-purple-400 font-medium">思考</span>的、
              能<span className="text-green-400 font-medium">执行</span>的AI助手
            </p>
            
            {/* CTA buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Link href="/agent">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Bot className="w-5 h-5" />
                  开始体验
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/consciousness">
                <Button variant="outline" size="lg" className="gap-2 border-purple-500/30 hover:bg-purple-500/10">
                  <Brain className="w-5 h-5 text-purple-400" />
                  探索意识系统
                </Button>
              </Link>
            </div>
          </div>

          {/* 核心价值卡片 */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            <Card className="bg-card/50 border-border text-center hover:border-blue-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">永久记忆</h3>
                <p className="text-sm text-muted-foreground">
                  记住你的一切，永不遗忘
                </p>
                <div className="mt-3 text-xs text-blue-400">Level 2 目标</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border text-center hover:border-purple-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">主动智能</h3>
                <p className="text-sm text-muted-foreground">
                  预判需求，主动建议
                </p>
                <div className="mt-3 text-xs text-purple-400">Level 4 目标</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border text-center hover:border-green-500/30 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">全能执行</h3>
                <p className="text-sm text-muted-foreground">
                  执行任何授权的任务
                </p>
                <div className="mt-3 text-xs text-green-400">Level 3 目标</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 贾维斯能力演进路线 */}
      <div className="container mx-auto px-4 pb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">贾维斯能力演进</h2>
          <p className="text-muted-foreground">从全时待命到灵魂伴侣的五级进化</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-3">
            {jarvisLevels.map((item, index) => (
              <div 
                key={item.level}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  item.status === 'current' 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : item.status === 'building'
                    ? 'bg-purple-500/5 border-purple-500/20'
                    : 'bg-card/30 border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.status === 'current' 
                    ? 'bg-blue-500/20' 
                    : item.status === 'building'
                    ? 'bg-purple-500/10'
                    : 'bg-muted'
                }`}>
                  <item.icon className={`w-5 h-5 ${
                    item.status === 'current' 
                      ? 'text-blue-400' 
                      : item.status === 'building'
                      ? 'text-purple-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Level {item.level}</span>
                    <span className="font-semibold">{item.title}</span>
                    {item.status === 'current' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">当前</span>
                    )}
                    {item.status === 'building' && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">建设中</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                
                <div className="w-24">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        item.status === 'current' 
                          ? 'bg-blue-500' 
                          : item.status === 'building'
                          ? 'bg-purple-500'
                          : 'bg-muted-foreground/30'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-right mt-1 text-muted-foreground">{item.progress}%</div>
                </div>
              </div>
            ))}
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

      {/* Footer CTA */}
      <div className="border-t border-border bg-card/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">开始打造你的贾维斯</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            记忆会贬值，理解会增值。越了解你，越不可替代。
          </p>
          <Link href="/agent">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Rocket className="w-5 h-5" />
              立即开始
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
