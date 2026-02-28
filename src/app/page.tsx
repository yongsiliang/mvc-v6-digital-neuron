import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Network, Code, Bot, ArrowRight, Sparkles, Zap, Globe, Eye, Hexagon } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            认知智能系统
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            基于信息结构场的认知架构，探索"信息结构的变化 = 神经递质的传输"
          </p>
        </div>

        {/* 推荐入口 - 场域视觉（梦境可视化）*/}
        <div className="max-w-2xl mx-auto mb-6">
          <Link href="/field-vision">
            <Card className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Hexagon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">场域视觉</h2>
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">梦境启示</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      六边形场网络：浅蓝色场 + 透明圆柱边界 + 黑色太空。探索场与边界的涌现智能。
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hexagon className="w-3 h-3" /> 六边形网格
                      </span>
                      <span className="flex items-center gap-1">
                        <Network className="w-3 h-3" /> 场网络
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> 涌现探索
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {/* 推荐入口 - 认知智能体 */}
        <div className="max-w-2xl mx-auto mb-12">
          <Link href="/agent-demo">
            <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/10 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">认知智能体</h2>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">推荐</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      三层架构：信息层 + 智能层 + 行动层。支持真实浏览器操作、多模态理解、记忆存储。
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> 网页访问
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> 图片理解
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" /> 认知循环
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-green-500 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 其他功能入口 */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className={`h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${feature.borderColor}`}>
                  <CardHeader>
                    <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className={`w-full group ${feature.color}`}>
                      进入
                      <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Architecture Overview */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>架构演进</CardTitle>
              <CardDescription>
                从 V6 链接驱动到信息结构场的架构探索
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-medium">V6 意识系统</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-5">
                    链接驱动，统一答案模式
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="font-medium">SNN 三体系统</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-5">
                    涌现驱动，神经元/突触/信号
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">信息结构场</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-5">
                    信息驱动，编码/感受器/认知循环
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
