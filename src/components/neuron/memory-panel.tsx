/**
 * ═══════════════════════════════════════════════════════════════════════
 * 记忆面板组件
 * Memory Panel Component
 * 
 * 功能：
 * - 展示用户的记忆列表
 * - 支持添加新记忆
 * - 支持搜索回忆
 * - 展示持久化状态
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useNeuronClient, 
  useMemorySearch 
} from '@/hooks/useNeuronClient';
import { 
  Brain, 
  Search, 
  Plus, 
  Trash2, 
  Clock, 
  Loader2,
  Save,
  User
} from 'lucide-react';

export function MemoryPanel() {
  const {
    userId,
    userInfo,
    state,
    isLoading,
    error,
    isInitialized,
    remember,
    recall,
    forget,
    save,
  } = useNeuronClient();

  const { results, isSearching, search, clear } = useMemorySearch();

  // 输入状态
  const [newMemory, setNewMemory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // 添加记忆
  const handleAddMemory = useCallback(async () => {
    if (!newMemory.trim()) return;
    
    try {
      await remember(newMemory, {
        type: 'episodic',
        importance: 0.5,
      });
      setNewMemory('');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  }, [newMemory, remember]);

  // 搜索记忆
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      clear();
      return;
    }
    
    const memories = await recall(searchQuery);
    console.log('Search results:', memories);
  }, [searchQuery, recall, clear]);

  // 删除记忆
  const handleDelete = useCallback(async (memoryId: string) => {
    if (confirm('确定要删除这条记忆吗？')) {
      await forget(memoryId);
    }
  }, [forget]);

  // 手动保存
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    const success = await save();
    setSaveStatus(success ? 'saved' : 'idle');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [save]);

  // 加载中状态
  if (!isInitialized) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>初始化神经元系统...</span>
        </CardContent>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="py-8 text-center text-destructive">
          <p>初始化失败: {error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 用户状态卡片 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            用户状态
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">用户ID:</span>
            <p className="font-mono text-xs truncate">{userId}</p>
          </div>
          <div>
            <span className="text-muted-foreground">记忆数量:</span>
            <p className="font-bold">{state?.stats.memoryCount || 0}</p>
          </div>
          <div>
            <span className="text-muted-foreground">神经元:</span>
            <p className="font-bold">{state?.stats.neuronCount || 0}</p>
          </div>
          <div>
            <span className="text-muted-foreground">连接:</span>
            <p className="font-bold">{state?.stats.connectionCount || 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* 添加记忆 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            添加记忆
          </CardTitle>
          <CardDescription>
            记住新的内容到你的数字大脑
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入要记住的内容..."
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
              disabled={isLoading}
            />
            <Button onClick={handleAddMemory} disabled={isLoading || !newMemory.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 搜索记忆 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            回忆
          </CardTitle>
          <CardDescription>
            搜索你的记忆
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="输入关键词搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">找到 {results.length} 条相关记忆:</p>
              {results.map((memory) => (
                <div key={memory.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{memory.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{memory.type}</Badge>
                    <Clock className="h-3 w-3" />
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 记忆列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              全部记忆
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSave}
              disabled={isLoading || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : saveStatus === 'saved' ? (
                <span className="text-green-500">已保存</span>
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {saveStatus === 'idle' && '保存'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {state?.memories && state.memories.length > 0 ? (
              <div className="space-y-2">
                {state.memories.map((memory) => (
                  <div 
                    key={memory.id} 
                    className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{memory.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{memory.type}</Badge>
                          <span>重要性: {(memory.importance * 100).toFixed(0)}%</span>
                          <Clock className="h-3 w-3" />
                          {new Date(memory.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(memory.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>还没有记忆</p>
                <p className="text-sm">开始添加你的第一条记忆吧</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
