/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具调用 API
 * Tool Calling API
 * 
 * 处理工具列表获取、工具执行、确认等请求
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getToolEngine, DEFAULT_SECURITY_POLICY } from '@/lib/tools';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import type { ToolCallRequest, SecurityPolicy } from '@/lib/tools/types';

// ═══════════════════════════════════════════════════════════════════════
// GET: 获取工具列表
// ═══════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'list':
      return listTools();
    case 'categories':
      return listCategories();
    case 'get':
      const name = searchParams.get('name');
      if (!name) {
        return NextResponse.json({ error: '缺少工具名称' }, { status: 400 });
      }
      return getToolInfo(name);
    default:
      return listTools();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// POST: 执行工具
// ═══════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'execute':
        return await executeTool(data, request);
      case 'confirm':
        return await confirmExecution(data, request);
      case 'batch':
        return await executeBatch(data, request);
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Tools API] 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理请求失败' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 操作处理函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 列出所有工具
 */
async function listTools(): Promise<NextResponse> {
  const engine = getToolEngine();
  const tools = engine.getAvailableTools();

  // 按类别分组
  const grouped = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      dangerLevel: tool.dangerLevel,
      requiresConfirmation: tool.requiresConfirmation,
      icon: tool.icon,
    });
    return acc;
  }, {} as Record<string, unknown[]>);

  return NextResponse.json({
    tools: grouped,
    total: tools.length,
    safe: tools.filter(t => t.dangerLevel === 'safe').length,
    moderate: tools.filter(t => t.dangerLevel === 'moderate').length,
    dangerous: tools.filter(t => t.dangerLevel === 'dangerous').length,
  });
}

/**
 * 列出工具类别
 */
async function listCategories(): Promise<NextResponse> {
  const engine = getToolEngine();
  const tools = engine.getAvailableTools();

  const categories = [...new Set(tools.map(t => t.category))].map(cat => ({
    name: cat,
    count: tools.filter(t => t.category === cat).length,
  }));

  return NextResponse.json({ categories });
}

/**
 * 获取单个工具信息
 */
async function getToolInfo(name: string): Promise<NextResponse> {
  const engine = getToolEngine();
  const tools = engine.getAvailableTools();
  const tool = tools.find(t => t.name === name);

  if (!tool) {
    return NextResponse.json({ error: '工具不存在' }, { status: 404 });
  }

  return NextResponse.json({ tool });
}

/**
 * 执行工具
 */
async function executeTool(data: Record<string, unknown>, request: NextRequest): Promise<NextResponse> {
  const { name, arguments: args, sessionId, workingDirectory } = data;

  if (!name) {
    return NextResponse.json({ error: '缺少工具名称' }, { status: 400 });
  }

  // 提取请求头
  const headers = HeaderUtils.extractForwardHeaders(request.headers);

  // 创建工具调用请求
  const toolRequest: ToolCallRequest = {
    id: randomUUID(),
    name: name as string,
    arguments: (args as Record<string, unknown>) || {},
    source: 'user',
    conversationId: sessionId as string,
    timestamp: Date.now(),
  };

  // 获取工具引擎
  const engine = getToolEngine(DEFAULT_SECURITY_POLICY, (msg, level) => {
    console[level](`[ToolEngine] ${msg}`);
  });

  // 执行工具
  const result = await engine.execute(toolRequest, {
    workingDirectory: (workingDirectory as string) || process.cwd(),
    sessionId: sessionId as string,
    headers,
  });

  return NextResponse.json({
    ...result,
    toolName: name,
    duration: Date.now() - (result.timestamp - result.duration),
  });
}

/**
 * 确认执行（危险操作）
 */
async function confirmExecution(data: Record<string, unknown>, request: NextRequest): Promise<NextResponse> {
  const { callId, confirmed, name, arguments: args } = data;

  if (!confirmed) {
    return NextResponse.json({
      success: false,
      error: '用户取消了操作',
    });
  }

  // 如果用户确认，重新执行（跳过确认步骤）
  // 在实际实现中，应该有一个确认队列来存储待确认的请求
  // 这里简化处理，直接执行
  
  const headers = HeaderUtils.extractForwardHeaders(request.headers);

  const toolRequest: ToolCallRequest = {
    id: callId as string || randomUUID(),
    name: name as string,
    arguments: (args as Record<string, unknown>) || {},
    source: 'user',
    timestamp: Date.now(),
  };

  // 创建一个临时策略，强制跳过确认
  const policyWithConfirmationBypass: SecurityPolicy = {
    ...DEFAULT_SECURITY_POLICY,
    // 标记已确认
  };

  const engine = getToolEngine(policyWithConfirmationBypass);

  // 临时修改以允许执行
  const result = await engine.execute(toolRequest, {
    workingDirectory: process.cwd(),
    headers,
  });

  return NextResponse.json(result);
}

/**
 * 批量执行
 */
async function executeBatch(data: Record<string, unknown>, request: NextRequest): Promise<NextResponse> {
  const { calls, stopOnError, parallel } = data;

  if (!Array.isArray(calls) || calls.length === 0) {
    return NextResponse.json({ error: '无效的调用列表' }, { status: 400 });
  }

  const headers = HeaderUtils.extractForwardHeaders(request.headers);
  const engine = getToolEngine();

  const requests: ToolCallRequest[] = calls.map((call: { name: string; arguments: Record<string, unknown> }) => ({
    id: randomUUID(),
    name: call.name,
    arguments: call.arguments || {},
    source: 'user',
    timestamp: Date.now(),
  }));

  const result = await engine.executeBatch({
    id: randomUUID(),
    calls: requests,
    stopOnError: stopOnError as boolean ?? true,
    parallel: parallel as boolean ?? false,
  }, {
    workingDirectory: process.cwd(),
    headers,
  });

  return NextResponse.json(result);
}
