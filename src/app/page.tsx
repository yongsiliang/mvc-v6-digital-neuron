import { redirect } from 'next/navigation';

/**
 * 首页重定向到 V6 意识系统
 */
export default function Home() {
  redirect('/consciousness');
}
