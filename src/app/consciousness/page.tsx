/**
 * 意识系统页面 - 重定向到首页
 * 
 * 原功能已合并到首页的"开发者模式"
 * 访问此页面将自动跳转到首页并开启开发者模式
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Brain } from 'lucide-react';

export default function ConsciousnessPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到首页并开启开发者模式
    router.replace('/?dev=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8 text-purple-400" />
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>正在跳转到首页...</span>
        </div>
        <p className="text-sm text-muted-foreground">
          意识系统功能已合并到首页的「开发者模式」
        </p>
      </div>
    </div>
  );
}
