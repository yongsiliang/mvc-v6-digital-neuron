import { redirect } from 'next/navigation';

/**
 * 首页重定向到代码进化系统
 */
export default function Home() {
  redirect('/code-evolution');
}
