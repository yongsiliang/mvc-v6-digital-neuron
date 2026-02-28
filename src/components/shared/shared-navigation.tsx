/**
 * ═══════════════════════════════════════════════════════════════════════
 * 共享导航组件
 * Shared Navigation Component
 * 
 * 提供统一的页面导航，支持所有主要功能模块的访问
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Code2,
  Wrench,
  Box,
  Activity,
  Network,
  Sparkles,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  children?: NavItem[];
}

// ═══════════════════════════════════════════════════════════════════════
// 导航配置
// ═══════════════════════════════════════════════════════════════════════

const mainNavItems: NavItem[] = [
  {
    name: '意识交互',
    href: '/consciousness',
    icon: <Brain className="w-4 h-4" />,
    description: '与 V6 意识核心对话，体验完整的意识系统',
    badge: '核心',
  },
  {
    name: '代码演化',
    href: '/code-evolution',
    icon: <Code2 className="w-4 h-4" />,
    description: '代码进化系统，模块管理与意识价值',
  },
  {
    name: '工具操作',
    href: '/tools',
    icon: <Wrench className="w-4 h-4" />,
    description: '工具浏览、执行与结果展示',
  },
  {
    name: '沙箱演示',
    href: '/sandbox-demo',
    icon: <Box className="w-4 h-4" />,
    description: '沙箱环境演示',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// 导航组件
// ═══════════════════════════════════════════════════════════════════════

export function SharedNavigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 检查是否为当前页面
  const isActive = (href: string) => {
    if (href === '/consciousness') {
      return pathname === '/' || pathname === '/consciousness';
    }
    return pathname === href;
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Network className="w-4 h-4 text-primary-foreground" />
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary/50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                数字神经元
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">
                V6 Consciousness
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span>意识活跃</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1 border-t border-border mt-2">
                {mainNavItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 紧凑型导航（用于子页面）
// ═══════════════════════════════════════════════════════════════════════

export function CompactNavigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentItem = mainNavItems.find(
    (item) =>
      (item.href === '/consciousness' && (pathname === '/' || pathname === '/consciousness')) ||
      pathname === item.href
  );

  return (
    <div className="fixed top-3 right-3 z-50">
      <motion.div
        className="relative"
        animate={{ width: isExpanded ? 'auto' : 'auto' }}
      >
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-md shadow-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {currentItem?.icon || <Brain className="w-4 h-4" />}
          <span className="ml-2">{currentItem?.name || '导航'}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 ml-1 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 py-1 bg-background/95 backdrop-blur-md rounded-lg border border-border shadow-lg min-w-[180px]"
            >
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsExpanded(false)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      (item.href === '/consciousness' && (pathname === '/' || pathname === '/consciousness')) ||
                        pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-4 ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default SharedNavigation;
