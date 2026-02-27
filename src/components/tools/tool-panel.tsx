/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具操作面板
 * Tool Operations Panel
 * 
 * 提供工具浏览、执行、结果展示的交互界面
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Terminal,
  Globe,
  Monitor,
  AppWindow,
  Bot,
  Play,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  Clock,
  FileText,
  Copy,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ToolDefinition, ToolResult } from '@/lib/tools/types';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

interface ToolCategory {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  tools: ToolDefinition[];
}

interface ToolExecutionResult extends ToolResult {
  name: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 工具面板组件
// ═══════════════════════════════════════════════════════════════════════

export function ToolPanel() {
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ToolExecutionResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['filesystem']);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    toolName: string;
    message: string;
    params: Record<string, unknown>;
  } | null>(null);

  // 加载工具列表
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch('/api/tools?action=list');
      const data = await response.json();

      const categoryIcons: Record<string, React.ReactNode> = {
        filesystem: <FolderOpen className="w-5 h-5" />,
        system: <Monitor className="w-5 h-5" />,
        code: <Terminal className="w-5 h-5" />,
        web: <Globe className="w-5 h-5" />,
        screen: <Monitor className="w-5 h-5" />,
        application: <AppWindow className="w-5 h-5" />,
        automation: <Bot className="w-5 h-5" />,
      };

      const categoryNames: Record<string, string> = {
        filesystem: '文件系统',
        system: '系统信息',
        code: '代码执行',
        web: '网络操作',
        screen: '屏幕操作',
        application: '应用控制',
        automation: '自动化',
      };

      const loadedCategories: ToolCategory[] = Object.entries(data.tools as Record<string, ToolDefinition[]>).map(
        ([name, tools]) => ({
          name,
          displayName: categoryNames[name] || name,
          icon: categoryIcons[name] || <FolderOpen className="w-5 h-5" />,
          tools: tools as ToolDefinition[],
        })
      );

      setCategories(loadedCategories);
    } catch (error) {
      console.error('加载工具列表失败:', error);
    }
  };

  // 执行工具
  const executeTool = useCallback(async (toolName: string, args: Record<string, unknown>) => {
    setIsExecuting(true);

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          name: toolName,
          arguments: args,
        }),
      });

      const result = await response.json();
      
      const executionResult: ToolExecutionResult = {
        ...result,
        name: toolName,
      };

      setExecutionHistory(prev => [executionResult, ...prev].slice(0, 50));

      return result;
    } catch (error) {
      console.error('执行工具失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
      };
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // 处理执行按钮点击
  const handleExecute = useCallback(() => {
    if (!selectedTool) return;

    // 检查是否需要确认
    if (selectedTool.requiresConfirmation || selectedTool.dangerLevel === 'dangerous') {
      setConfirmDialog({
        show: true,
        toolName: selectedTool.name,
        message: `即将执行危险操作: ${selectedTool.displayName}\n${selectedTool.description}`,
        params: paramValues,
      });
    } else {
      executeTool(selectedTool.name, paramValues);
    }
  }, [selectedTool, paramValues, executeTool]);

  // 处理确认对话框
  const handleConfirm = useCallback((confirmed: boolean) => {
    if (confirmed && confirmDialog) {
      executeTool(confirmDialog.toolName, confirmDialog.params);
    }
    setConfirmDialog(null);
  }, [confirmDialog, executeTool]);

  // 过滤工具
  const filteredCategories = categories.map(category => ({
    ...category,
    tools: category.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.tools.length > 0);

  // 切换类别展开
  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="border-b border-border p-4">
        <h2 className="text-xl font-semibold">工具操作面板</h2>
        <p className="text-sm text-muted-foreground mt-1">
          浏览和执行系统工具
        </p>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具列表 */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* 搜索框 */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索工具..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 工具列表 */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredCategories.map(category => (
                <Collapsible
                  key={category.name}
                  open={expandedCategories.includes(category.name)}
                  onOpenChange={() => toggleCategory(category.name)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span>{category.displayName}</span>
                        <Badge variant="secondary" className="ml-1">
                          {category.tools.length}
                        </Badge>
                      </div>
                      {expandedCategories.includes(category.name) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 space-y-1">
                      {category.tools.map(tool => (
                        <Button
                          key={tool.name}
                          variant={selectedTool?.name === tool.name ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start text-left h-auto py-2',
                            selectedTool?.name === tool.name && 'bg-accent'
                          )}
                          onClick={() => {
                            setSelectedTool(tool);
                            setParamValues({});
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <DangerBadge level={tool.dangerLevel} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{tool.displayName}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {tool.description}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="execute" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="execute">执行</TabsTrigger>
              <TabsTrigger value="history">
                历史
                {executionHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {executionHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* 执行标签页 */}
            <TabsContent value="execute" className="flex-1 m-0">
              {selectedTool ? (
                <ToolExecutionPanel
                  tool={selectedTool}
                  paramValues={paramValues}
                  setParamValues={setParamValues}
                  onExecute={handleExecute}
                  isExecuting={isExecuting}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>从左侧选择一个工具</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 历史标签页 */}
            <TabsContent value="history" className="flex-1 m-0">
              <ToolHistoryPanel history={executionHistory} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 确认对话框 */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <Card className="w-[400px] animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                危险操作确认
              </CardTitle>
              <CardDescription>{confirmDialog.toolName}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap mb-4">
                {confirmDialog.message}
              </pre>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleConfirm(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleConfirm(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  确认执行
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 工具执行面板
// ═══════════════════════════════════════════════════════════════════════

interface ToolExecutionPanelProps {
  tool: ToolDefinition;
  paramValues: Record<string, unknown>;
  setParamValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  onExecute: () => void;
  isExecuting: boolean;
}

function ToolExecutionPanel({
  tool,
  paramValues,
  setParamValues,
  onExecute,
  isExecuting,
}: ToolExecutionPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* 工具信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DangerBadge level={tool.dangerLevel} />
                {tool.displayName}
              </CardTitle>
              {tool.requiresConfirmation && (
                <Badge variant="destructive">需要确认</Badge>
              )}
            </div>
            <CardDescription>{tool.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* 参数输入 */}
        {tool.parameters && tool.parameters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">参数</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.parameters.map(param => (
                <div key={param.name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {param.displayName || param.name}
                    {param.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <ParamInput
                    param={param}
                    value={paramValues[param.name]}
                    onChange={(value) =>
                      setParamValues(prev => ({ ...prev, [param.name]: value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {param.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 执行按钮 */}
        <Button
          className="w-full"
          size="lg"
          onClick={onExecute}
          disabled={isExecuting || (tool.parameters?.some(p => p.required && !paramValues[p.name]) ?? false)}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              执行中...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              执行工具
            </>
          )}
        </Button>
      </div>
    </ScrollArea>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 参数输入组件
// ═══════════════════════════════════════════════════════════════════════

interface ParamInputProps {
  param: ToolDefinition['parameters'] extends (infer P)[] ? P : never;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ParamInput({ param, value, onChange }: ParamInputProps) {
  switch (param.type) {
    case 'string':
      if (param.enum) {
        return (
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">选择...</option>
            {param.enum.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      return (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.default as string}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={(value as number) || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          placeholder={param.default as string}
        />
      );

    case 'boolean':
      return (
        <Button
          variant={value ? 'default' : 'outline'}
          onClick={() => onChange(!value)}
        >
          {value ? '是' : '否'}
        </Button>
      );

    case 'array':
      return (
        <Textarea
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
          placeholder="每行一个值"
          rows={3}
        />
      );

    case 'object':
      return (
        <Textarea
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : ''}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // 解析失败时保留原始字符串
            }
          }}
          placeholder="JSON 格式"
          rows={5}
          className="font-mono"
        />
      );

    default:
      return (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工具历史面板
// ═══════════════════════════════════════════════════════════════════════

interface ToolHistoryPanelProps {
  history: ToolExecutionResult[];
}

function ToolHistoryPanel({ history }: ToolHistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无执行记录</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {history.map((result, index) => (
          <Card key={index}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{result.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {result.duration}ms
                    </span>
                  </div>
                  {result.success ? (
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-destructive">{result.error}</p>
                  )}
                  {result.generatedFiles && result.generatedFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.generatedFiles.map((file, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {file.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 危险等级徽章
// ═══════════════════════════════════════════════════════════════════════

interface DangerBadgeProps {
  level: string;
}

function DangerBadge({ level }: DangerBadgeProps) {
  const config = {
    safe: { color: 'bg-green-500', label: '安全' },
    moderate: { color: 'bg-yellow-500', label: '中' },
    dangerous: { color: 'bg-red-500', label: '危险' },
  };

  const { color, label } = config[level as keyof typeof config] || config.safe;

  return (
    <span className={cn('w-2 h-2 rounded-full', color)} title={label} />
  );
}
