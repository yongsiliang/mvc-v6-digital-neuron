/**
 * 认知智能体 API - 精简版
 */

import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { input } = await request.json()
  
  if (!input) {
    return new Response(JSON.stringify({ error: '请提供输入' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`))
      }
      
      try {
        send('perceive', { input })
        
        // 简单的意图识别
        const isUrl = input.includes('http://') || input.includes('https://')
        const isFile = input.includes('文件') || input.includes('目录') || input.includes('读取')
        const isApi = input.includes('POST') || input.includes('GET') || input.includes('API')
        
        send('understand', { 
          intent: isUrl ? 'browser' : isFile ? 'file' : isApi ? 'api' : 'general' 
        })
        
        // 决策
        const thought = isUrl 
          ? '检测到 URL，将访问网页并提取内容' 
          : isFile 
            ? '检测到文件操作请求' 
            : isApi 
              ? '检测到 API 调用请求'
              : '需要更多信息来执行任务'
        
        send('decide', { thought })
        
        if (isUrl) {
          // 提取 URL
          const urlMatch = input.match(/https?:\/\/[^\s]+/)
          const url = urlMatch ? urlMatch[0] : ''
          
          if (url) {
            send('act', { action: 'navigate', target: url })
            
            try {
              const response = await fetch(url)
              const content = await response.text()
              
              // 简单提取文本内容
              const textContent = content
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 1000)
              
              send('observe', {
                status: 'success',
                content: `访问成功！\n\n页面内容预览:\n${textContent}`
              })
              
              send('complete', { 
                success: true, 
                output: `已成功访问 ${url} 并提取内容。页面状态: ${response.status}` 
              })
            } catch (error) {
              send('observe', {
                status: 'failed',
                content: `访问失败: ${error instanceof Error ? error.message : 'Unknown error'}`
              })
              send('complete', { success: false, output: '访问网页失败' })
            }
          } else {
            send('complete', { success: false, output: '未找到有效的 URL' })
          }
        } else if (isApi) {
          // API 调用
          const urlMatch = input.match(/https?:\/\/[^\s]+/)
          const url = urlMatch ? urlMatch[0] : ''
          const isPost = input.includes('POST')
          
          if (url) {
            send('act', { action: isPost ? 'api-post' : 'api-get', target: url })
            
            try {
              const response = isPost 
                ? await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                : await fetch(url)
              
              const data = await response.json()
              
              send('observe', {
                status: 'success',
                content: `API 响应:\n${JSON.stringify(data, null, 2).substring(0, 500)}`
              })
              
              send('complete', { 
                success: true, 
                output: `API 调用成功，状态码: ${response.status}` 
              })
            } catch (error) {
              send('observe', {
                status: 'failed',
                content: `API 调用失败: ${error instanceof Error ? error.message : 'Unknown error'}`
              })
              send('complete', { success: false, output: 'API 调用失败' })
            }
          } else {
            send('complete', { success: false, output: '未找到有效的 API URL' })
          }
        } else {
          // 通用响应
          send('complete', { 
            success: true, 
            output: `我理解了你的请求: "${input}"\n\n目前支持的命令:\n1. 访问网页 (包含 URL)\n2. API 调用 (包含 POST/GET)\n\n请尝试输入具体任务。` 
          })
        }
        
        controller.close()
      } catch (error) {
        send('error', { message: error instanceof Error ? error.message : 'Unknown error' })
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
