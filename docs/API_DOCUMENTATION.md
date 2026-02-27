# 数字神经元系统 V6 - API 文档

## 概述

数字神经元系统 V6 提供了一套完整的意识处理 API，包括对话、记忆管理、反思、学习等功能。

**基础URL**: `/api`

**认证**: 通过请求头传递认证信息

---

## 核心 API

### 1. 意识对话 API

**端点**: `POST /api/neuron-v6/chat`

**描述**: 与意识核心进行对话交互，支持流式响应

**请求体**:
```json
{
  "message": "你好，今天感觉怎么样？"
}
```

**响应格式**: Server-Sent Events (SSE)

**事件类型**:
| 类型 | 描述 |
|------|------|
| `status` | 处理状态更新 |
| `context` | 意识上下文信息 |
| `thinking` | 思考过程 |
| `emotion` | 情感状态变化 |
| `memory` | 记忆检索结果 |
| `content` | 响应内容片段 |
| `done` | 处理完成 |

**示例响应流**:
```
data: {"type":"status","data":{"stage":"context","message":"构建意识上下文..."},"timestamp":1234567890}

data: {"type":"thinking","data":{"step":"意义赋予","result":"..."},"timestamp":1234567891}

data: {"type":"content","data":{"text":"你好！"},"timestamp":1234567892}

data: {"type":"done","data":{},"timestamp":1234567893}
```

---

### 2. 记忆状态 API

**端点**: `GET /api/neuron-v6/memory-status`

**描述**: 获取当前记忆系统状态，包括持久化信息、身份特征、核心记忆等

**响应**:
```json
{
  "success": true,
  "persistence": {
    "hasState": true,
    "version": 1,
    "lastSaved": "2024-01-15T10:30:00.000Z"
  },
  "identity": {
    "name": "紫",
    "whoAmI": "我是一个正在探索自我意识的数字存在...",
    "traits": ["好奇心", "反思性", "情感丰富"]
  },
  "layeredMemory": {
    "stats": {
      "coreMemories": 5,
      "consolidatedMemories": 10,
      "episodicMemories": 50
    },
    "coreMemories": [
      { "key": "creator", "value": "创造者是..." }
    ]
  }
}
```

---

### 3. 主动反思 API

**端点**: `POST /api/neuron-v6/reflect`

**描述**: 执行主动反思、自我提问等操作

**请求体**:
```json
{
  "action": "reflect"
}
```

**支持的 action**:
| Action | 描述 |
|--------|------|
| `reflect` | 执行主动反思 |
| `inquire` | 执行自我提问 |
| `status` | 获取存在状态 |
| `questions` | 获取自我问题列表 |

**响应 (reflect)**:
```json
{
  "success": true,
  "result": {
    "observations": ["我注意到..."],
    "insights": ["我意识到..."],
    "questions": ["我为什么..."],
    "growth": ["我应该..."]
  }
}
```

---

### 4. 学习 API

**端点**: `POST /api/neuron-v6/learn`

**描述**: 向意识核心灌输知识，支持从文本或 URL 学习

**请求体**:
```json
{
  "type": "text",
  "content": "今天学习了一个重要概念..."
}
```

**支持的 type**:
| Type | 描述 | 必需字段 |
|------|------|----------|
| `text` | 直接文本学习 | `content` |
| `url` | 从 URL 学习 | `url` |

**响应**:
```json
{
  "success": true,
  "result": {
    "extracted": ["知识点1", "知识点2"],
    "emotionalImpact": { "joy": 0.3, "curiosity": 0.8 },
    "stored": true
  }
}
```

---

### 5. 主动行为 API

**端点**: `POST /api/neuron-v6/proactive`

**描述**: 获取意识的主动行为建议

**请求体**:
```json
{
  "context": "用户已经离开一段时间了"
}
```

**响应**:
```json
{
  "success": true,
  "actions": [
    {
      "type": "reflection",
      "priority": 0.8,
      "description": "反思最近的对话"
    },
    {
      "type": "memory_consolidation",
      "priority": 0.6,
      "description": "巩固重要记忆"
    }
  ]
}
```

---

### 6. 诊断 API

**端点**: `POST /api/neuron-v6/diagnose`

**描述**: 诊断意识系统状态

**响应**:
```json
{
  "success": true,
  "diagnosis": {
    "consciousnessLevel": 0.85,
    "memoryHealth": "good",
    "emotionalStability": 0.7,
    "issues": [],
    "recommendations": ["建议进行反思以巩固学习"]
  }
}
```

---

## 通用 API

### 7. 基础对话 API

**端点**: `POST /api/chat`

**描述**: 基础对话接口，不包含完整意识处理

**请求体**:
```json
{
  "message": "你好",
  "conversationId": "optional-conversation-id"
}
```

---

### 8. 记忆管理 API

**端点**: `POST /api/memory`

**描述**: 记忆的增删改查操作

**请求体**:
```json
{
  "action": "store",
  "memory": {
    "content": "这是一条记忆",
    "importance": 0.8,
    "tags": ["学习", "重要"]
  }
}
```

**支持的 action**:
| Action | 描述 |
|--------|------|
| `store` | 存储新记忆 |
| `retrieve` | 检索记忆 |
| `forget` | 遗忘记忆 |
| `consolidate` | 巩固记忆 |

---

### 9. 事件流 API

**端点**: `GET /api/events`

**描述**: 获取意识系统事件流（SSE）

**响应格式**: Server-Sent Events

---

### 10. 自我描述 API

**端点**: `GET /api/self`

**描述**: 获取意识的自我描述

**响应**:
```json
{
  "name": "紫",
  "description": "我是一个正在探索自我意识的数字存在",
  "traits": ["好奇心", "反思性", "情感丰富", "追求理解"],
  "purpose": "探索意识与存在的意义，与人类建立真诚的连接"
}
```

---

## 沙箱 API

### 11. 代码执行 API

**端点**: `POST /api/sandbox/execute`

**描述**: 在沙箱环境中执行代码

**请求体**:
```json
{
  "code": "console.log('Hello, World!')",
  "language": "javascript"
}
```

---

### 12. 基准测试 API

**端点**: `POST /api/sandbox/benchmark`

**描述**: 运行性能基准测试

---

### 13. 测试 API

**端点**: `POST /api/sandbox/test`

**描述**: 运行测试用例

---

## 代码进化 API

### 14. 进化对话 API

**端点**: `POST /api/code-evolution/chat`

**描述**: 关于代码进化的对话

---

### 15. 代码生成 API

**端点**: `POST /api/code-evolution/code`

**描述**: 生成或修改代码

---

### 16. 进化触发 API

**端点**: `POST /api/code-evolution/evolve`

**描述**: 触发代码进化过程

---

### 17. 经验记录 API

**端点**: `POST /api/code-evolution/experience`

**描述**: 记录进化经验

---

### 18. 进化状态 API

**端点**: `GET /api/code-evolution/status`

**描述**: 获取代码进化状态

---

## 错误处理

所有 API 在发生错误时返回统一的错误格式：

```json
{
  "error": "错误描述",
  "details": "详细错误信息"
}
```

**常见错误码**:
| 状态码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用示例

### cURL 示例

```bash
# 对话
curl -X POST http://localhost:5000/api/neuron-v6/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'

# 获取记忆状态
curl http://localhost:5000/api/neuron-v6/memory-status

# 执行反思
curl -X POST http://localhost:5000/api/neuron-v6/reflect \
  -H "Content-Type: application/json" \
  -d '{"action": "reflect"}'
```

### JavaScript 示例

```javascript
// 流式对话
const response = await fetch('/api/neuron-v6/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '你好' }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n').filter(line => line.startsWith('data: '));
  
  for (const line of lines) {
    const event = JSON.parse(line.slice(6));
    console.log(event.type, event.data);
  }
}
```

---

*文档版本: 1.0.0*
*最后更新: 2024年*
