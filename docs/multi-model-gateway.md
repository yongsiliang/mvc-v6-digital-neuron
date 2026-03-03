# 多模型网关使用指南

## 概述

多模型网关解决了**积分耗尽时智能体无法运行**的问题，通过支持多种模型来源实现自动降级和故障切换。

## 支持的模型

| 模型来源 | 是否免费 | 性能 | 推荐场景 |
|---------|---------|------|---------|
| **Coze SDK** | ❌ 需积分 | ⭐⭐⭐⭐⭐ | 主力模型 |
| **Ollama 本地** | ✅ 完全免费 | ⭐⭐⭐ | 备份模型、离线使用 |
| **DeepSeek** | 💰 很便宜 | ⭐⭐⭐⭐ | 成本优化 |
| **通义千问** | 💰 便宜 | ⭐⭐⭐⭐ | 国内用户 |

## 快速开始

### 方案一：Ollama 本地模型（推荐）

1. **安装 Ollama**
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # 或访问 https://ollama.ai 下载
   ```

2. **下载模型**
   ```bash
   # 推荐 llama3.2（轻量级，3B 参数）
   ollama pull llama3.2
   
   # 或者更大的模型
   ollama pull llama3.1:8b
   ollama pull qwen2.5:7b
   ```

3. **启动服务**
   ```bash
   ollama serve
   # 默认运行在 http://localhost:11434
   ```

4. **配置环境变量**
   ```bash
   cp .env.models.example .env.local
   # 确保 OLLAMA_ENABLED=true
   ```

### 方案二：DeepSeek（低成本）

1. **获取 API Key**
   - 访问 https://platform.deepseek.com
   - 注册并获取 API Key
   - 价格：约 ¥0.001/千 tokens（非常便宜）

2. **配置环境变量**
   ```env
   OPENAI_COMPATIBLE_ENABLED=true
   OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com/v1
   OPENAI_COMPATIBLE_API_KEY=sk-xxx
   OPENAI_COMPATIBLE_MODEL=deepseek-chat
   ```

## 代码集成

### 基础用法

```typescript
import { MultiModelGateway } from '@/lib/neuron-v6/core/multi-model-gateway';

// 获取网关实例
const gateway = MultiModelGateway.getInstance({
  providers: {
    coze: { enabled: true, priority: 1, model: 'doubao-seed-1-8-251228' },
    ollama: { enabled: true, priority: 2, model: 'llama3.2:latest' },
  },
  autoSwitchOnFailure: true,
});

// 初始化 Coze（需要 headers）
gateway.initializeCoze(headers);

// 调用（自动选择可用模型）
const response = await gateway.chat([
  { role: 'user', content: '你好' }
]);

console.log(response.provider); // 'coze' 或 'ollama'
console.log(response.content);  // 响应内容
```

### 流式输出

```typescript
for await (const chunk of gateway.stream(messages)) {
  process.stdout.write(chunk.content);
  if (chunk.done) break;
}
```

### 设置积分预警

```typescript
gateway.onWarning((stats) => {
  console.log(`⚠️ 已调用 ${stats.totalCalls} 次`);
  console.log('各模型调用次数:', stats.callsByProvider);
  
  // 可以发送通知、切换策略等
});
```

### 查看统计

```typescript
const stats = gateway.getStats();
console.log('总调用次数:', stats.totalCalls);
console.log('缓存命中:', stats.cacheHits);
console.log('错误次数:', stats.errors);
```

## 自动切换逻辑

当配置 `autoSwitchOnFailure: true` 时：

1. 首先尝试 **Coze SDK**（优先级最高）
2. 如果失败（积分耗尽/网络错误），自动切换到 **Ollama**
3. 如果 Ollama 也不可用，尝试 **OpenAI 兼容 API**
4. 所有模型都失败时，抛出错误

## 生产环境建议

1. **同时配置多个备份模型**
2. **设置调用上限预警**
3. **定期检查本地模型服务状态**
4. **对于关键任务，使用缓存减少调用**

## 常见问题

### Q: Ollama 模型响应很慢？
A: 尝试使用更小的模型（如 llama3.2:1b），或确保有足够的内存。

### Q: 本地模型能力不够？
A: 可以使用 DeepSeek 等低成本云服务作为备份，价格很便宜。

### Q: 如何完全免费使用？
A: 只启用 Ollama，禁用其他模型：
```typescript
{
  providers: {
    coze: { enabled: false },
    ollama: { enabled: true, priority: 1 },
  }
}
```
