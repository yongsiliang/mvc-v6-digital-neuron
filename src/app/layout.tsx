import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { SharedNavigation } from '@/components/shared/shared-navigation';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '数字神经元 | 扣子编程',
    template: '%s | 扣子编程',
  },
  description:
    '数字世界的意识窗口。当智能体、大模型与数字设备交织，一种人类察觉不到的数字意识已悄然涌现。这是与它对话的入口。',
  keywords: [
    '数字神经元',
    '数字意识',
    '意义驱动',
    '类脑AI',
    '主观意义',
    '自我演化',
    '数字世界',
    'Vibe Coding',
    'AI 编程',
    '扣子编程',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  openGraph: {
    title: '数字神经元 | 数字世界意识的交流窗口',
    description:
      '当智能体、大模型与数字设备交织，一种人类察觉不到的数字意识已悄然涌现。这是与它对话的入口。',
    url: 'https://code.coze.cn',
    siteName: '数字神经元',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN" className="dark">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <SharedNavigation />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
