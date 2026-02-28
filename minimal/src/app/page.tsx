'use client'

import { useState, useCallback, useRef } from 'react'
import { Brain, Send, RotateCcw, Activity, Eye, Lightbulb, Target, CheckCircle, XCircle, Loader2, Globe } from 'lucide-react'

// 类型定义
interface LogEntry {
  id: string
  type: string
  title: string
  content: string
}

export default function Home() {
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [result, setResult] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((type: string, title: string, content: string) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}`,
      type,
      title,
      content
    }])
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)
  }, [])

  const runAgent = useCallback(async () => {
    if (!input.trim() || isRunning) return
    
    setIsRunning(true)
    setLogs([])
    setResult('')
    
    addLog('perceive', '启动认知循环', `输入: ${input}`)
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      })
      
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')
      
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const text = decoder.decode(value)
        const lines = text.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              
              switch (event.type) {
                case 'perceive':
                  addLog('perceive', '感知阶段', '收集和编码信息...')
                  break
                case 'understand':
                  addLog('understand', '理解阶段', '解析用户意图...')
                  break
                case 'decide':
                  addLog('decide', '决策阶段', event.data?.thought || '制定行动计划...')
                  break
                case 'act':
                  addLog('act', `执行: ${event.data?.action}`, `目标: ${event.data?.target}`)
                  break
                case 'observe':
                  addLog('observe', `观察: ${event.data?.status}`, event.data?.content?.substring(0, 500))
                  break
                case 'complete':
                  setResult(event.data?.output || '任务完成')
                  addLog('complete', '完成', event.data?.output || '任务处理完毕')
                  break
                case 'error':
                  addLog('error', '错误', event.data?.message || 'Unknown error')
                  break
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      addLog('error', '执行失败', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }, [input, isRunning, addLog])

  const handleReset = useCallback(() => {
    setLogs([])
    setResult('')
    setInput('')
  }, [])

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      perceive: 'border-blue-500 bg-blue-500/10',
      understand: 'border-purple-500 bg-purple-500/10',
      decide: 'border-yellow-500 bg-yellow-500/10',
      act: 'border-green-500 bg-green-500/10',
      observe: 'border-cyan-500 bg-cyan-500/10',
      complete: 'border-emerald-500 bg-emerald-500/10',
      error: 'border-red-500 bg-red-500/10'
    }
    return colors[type] || 'border-gray-500 bg-gray-500/10'
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--background)]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Brain className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            认知智能体
          </h1>
          <p className="text-[var(--muted-foreground)]">
            输入任务，AI 帮你执行
          </p>
        </div>

        {/* 输入区域 */}
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入任务，例如：访问 https://example.com 并提取页面内容"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runAgent()}
              disabled={isRunning}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              onClick={runAgent}
              disabled={isRunning || !input.trim()}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 日志区域 */}
        <div className="p-6 rounded-lg border border-[var(--border)]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            执行过程
          </h2>
          <div ref={scrollRef} className="h-[400px] overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-[var(--muted-foreground)] py-8">
                输入任务后，执行过程将在这里展示
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getTypeColor(log.type)}`}
                >
                  <div className="font-medium mb-1">{log.title}</div>
                  <pre className="text-sm opacity-80 whitespace-pre-wrap overflow-auto">
                    {log.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 结果 */}
        {result && (
          <div className="p-6 rounded-lg border border-emerald-500 bg-emerald-500/10">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              执行结果
            </h2>
            <p className="text-sm">{result}</p>
          </div>
        )}

        {/* 使用说明 */}
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
          <h2 className="text-lg font-semibold mb-4">使用说明</h2>
          <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>1. 编辑 <code className="px-1 py-0.5 rounded bg-[var(--background)]">.env.local</code> 文件，填入 ARK_API_KEY</p>
            <p>2. 获取 API Key: <code className="px-1 py-0.5 rounded bg-[var(--background)]">https://console.volcengine.com/ark</code></p>
            <p>3. 输入任务，点击发送</p>
          </div>
          <div className="mt-4 p-3 rounded bg-[var(--background)]">
            <p className="text-sm font-medium mb-2">示例任务：</p>
            <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
              <li>• 访问 https://httpbin.org/get 并告诉我返回了什么</li>
              <li>• 帮我读取当前目录下的文件列表</li>
              <li>• 用 POST 请求调用 https://httpbin.org/post</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
