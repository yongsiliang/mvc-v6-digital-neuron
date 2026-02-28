import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Network, Code, Bot, ArrowRight } from 'lucide-react';

/**
 * 首页 - 功能导航
 */
export default function Home() {
  const features = [
    {
      title: '意识系统',
      description: 'V6 意识系统：统一答案模式，用户只看到一个答案',
      href: '/consciousness',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: '认知智能体',
      description: '三层架构：信息层 + 智能层 + 行动层，认知循环',
      href: '/agent-demo',
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: '代码演化',
      description: 'V4 自我演化：多角色协作，统一答案输出',
      href: '/code-evolution',
      icon: Code,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: '神经网络',
      description: 'SNN 三体系统：神经元、突触、信号涌现',
      href: '/tools',
      icon: Network,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            认知智能系统
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            基于信息结构场的认知架构，探索"信息结构的变化 = 神经递质的传输"
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className={`h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${feature.borderColor}`}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className={`w-full group ${feature.color}`}>
                      进入
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Architecture Overview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>架构演进</CardTitle>
              <CardDescription>
                从 V6 链接驱动到信息结构场的架构探索
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <span className="font-medium text-foreground">V6 意识系统</span>
                    <span className="mx-2">→</span>
                    <span>链接驱动，统一答案模式</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                  <div>
                    <span className="font-medium text-foreground">SNN 三体系统</span>
                    <span className="mx-2">→</span>
                    <span>涌现驱动，神经元/突触/信号</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <span className="font-medium text-foreground">信息结构场</span>
                    <span className="mx-2">→</span>
                    <span>信息驱动，编码/感受器/认知循环</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
