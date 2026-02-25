# 数字神经元系统 - 下一步优化规划

> 当前版本: V2.0 持久化版本
> 更新时间: 2026-02-25

---

## 一、当前状态

### 已完成功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 用户认证 | ✅ | localStorage 生成 UUID，预留 Clerk 接口 |
| 持久化架构 | ✅ | PersistenceManager + 数据库表设计 |
| API 接口 | ✅ | /api/neuron/* 系列接口 |
| 前端集成 | ✅ | useNeuronClient hook |
| 记忆集成服务 | ✅ | MemoryIntegrationService |
| 错误处理 | ✅ | 数据库不可用时优雅降级 |

### 当前数据流

```
用户 → 前端(useNeuronClient) → API(/api/neuron/*) → 数据库/内存
                    ↓
         MemoryIntegrationService
                    ↓
         记住对话 / 回忆上下文
```

---

## 二、优化路线图

### P0 - 核心功能（优先实现）

#### 1. 创建数据库表

**目标**：让持久化真正工作

**操作**：
```bash
# 在 Supabase SQL Editor 中执行
docs/migrations/001_neuron_v2_schema.sql
```

**预期效果**：
- 所有记忆永久保存
- 跨设备数据同步
- 页面刷新后完整恢复

---

#### 2. 集成到现有对话流

**目标**：让对话系统使用记忆增强

**修改文件**：`src/app/api/stream/route.ts`

**示例代码**：
```typescript
import { createMemoryIntegrationService } from '@/lib/neuron-v2';

export async function POST(request: Request) {
  const { message, userId } = await request.json();
  
  // 1. 创建记忆服务
  const memoryService = createMemoryIntegrationService();
  if (userId) memoryService.setUserId(userId);
  
  // 2. 回忆相关上下文
  const context = await memoryService.recallRelevantMemories(message);
  const contextPrompt = memoryService.buildContextPrompt(context);
  
  // 3. 构建增强提示
  const enhancedPrompt = contextPrompt 
    ? `${contextPrompt}\n\n当前用户输入: ${message}`
    : message;
  
  // 4. 调用 LLM...
  
  // 5. 记住对话
  await memoryService.rememberConversation('user', message);
  await memoryService.rememberConversation('assistant', response);
}
```

---

#### 3. 前端对话集成

**目标**：前端自动使用记忆增强

**修改文件**：`src/app/page.tsx`

**示例代码**：
```typescript
const handleSendMessage = useCallback(async (message: string) => {
  // 1. 回忆相关记忆
  const context = await recallConversationContext(message);
  
  // 2. 构建增强提示（可选，后端已处理）
  const contextPrompt = context ? buildContextPrompt(context) : '';
  
  // 3. 发送消息时附带记忆上下文
  await fetch('/api/stream', {
    body: JSON.stringify({ 
      message, 
      userId,
      memoryContext: contextPrompt, // 新增
    }),
  });
  
  // 4. 对话完成后自动记住（已实现）
  await rememberConversation('user', message);
}, [recallConversationContext, buildContextPrompt, rememberConversation]);
```

---

### P1 - 体验优化

#### 4. 记忆向量化（语义搜索）

**目标**：从关键词搜索升级为语义搜索

**实现**：
```typescript
// 使用 OpenAI Embedding 或本地模型
import { embed } from 'ai';

// 记忆时生成向量
const embedding = await embed({
  model: 'text-embedding-3-small',
  value: content,
});

// 搜索时使用向量相似度
const results = await sql`
  SELECT * FROM memories_v2
  WHERE user_id = ${userId}
  ORDER BY content_embedding <=> ${queryEmbedding}
  LIMIT 5;
`;
```

**数据库**：已预留 `content_embedding VECTOR(1536)` 字段

---

#### 5. 记忆可视化图谱

**目标**：可视化展示记忆之间的关系

**实现**：
- 神经元 → 节点
- 连接 → 边
- 记忆 → 激活的神经元簇

**效果**：
```
    [工作] ←─────→ [项目]
       │              │
       ↓              ↓
    [会议]          [代码]
       │              │
       └────→ [我] ←──┘
                │
                ↓
             [学习]
```

---

#### 6. 记忆时间线

**目标**：按时间轴展示记忆

**UI 组件**：
```tsx
<MemoryTimeline memories={memories}>
  <TimelineItem date="2026-02-25">
    <MemoryCard content="学习了神经元的记忆机制..." />
  </TimelineItem>
  <TimelineItem date="2026-02-24">
    <MemoryCard content="讨论了项目的下一步优化..." />
  </TimelineItem>
</MemoryTimeline>
```

---

### P2 - 高级功能

#### 7. 记忆巩固机制

**目标**：模拟人脑的记忆巩固过程

**流程**：
```
短期记忆（working memory）
    ↓ 重复激活/重要性高
长期记忆（long-term memory）
    ↓ 长时间不激活
遗忘（forgetting）
```

**实现**：
```typescript
class MemoryConsolidation {
  // 每天运行一次
  async consolidate(userId: string) {
    // 1. 找出高频访问的记忆 → 强化
    // 2. 找出低重要性且长期未访问的 → 标记遗忘
    // 3. 合并相似记忆
  }
}
```

---

#### 8. 实时同步

**目标**：多设备实时同步

**方案**：WebSocket 或 Supabase Realtime

```typescript
// Supabase Realtime
const channel = supabase
  .channel('memories')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'memories_v2',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // 新记忆同步到本地
    addMemory(payload.new);
  })
  .subscribe();
```

---

#### 9. Clerk 认证升级

**目标**：专业级用户认证

**修改**：
```typescript
// src/lib/neuron-v2/auth.ts
import { auth } from '@clerk/nextjs';

export async function getClerkUserId(): Promise<string | null> {
  const { userId } = auth();
  return userId;
}

// 替换 localStorage 方案
export const clerkAuthAdapter: AuthAdapter = {
  getUserId: getClerkUserId,
  // ...
};
```

---

## 三、实施优先级

```
Week 1: P0 核心功能
├── Day 1-2: 创建数据库表
├── Day 3-4: 对话流集成
└── Day 5: 测试验证

Week 2: P1 体验优化
├── Day 1-2: 记忆向量化
├── Day 3-4: 可视化图谱
└── Day 5: 时间线组件

Week 3-4: P2 高级功能
├── 记忆巩固机制
├── 实时同步
└── Clerk 升级
```

---

## 四、快速开始

### 立即可用的功能

```typescript
// 在任何组件中
import { useNeuronClient } from '@/hooks/useNeuronClient';

function MyComponent() {
  const {
    // 基础功能
    remember,                // 记住内容
    recall,                  // 搜索记忆
    save,                    // 手动保存
    
    // 增强功能
    rememberConversation,    // 记住对话（自动提取关键点）
    recallConversationContext, // 回忆相关上下文
    buildContextPrompt,      // 构建上下文提示
    
    // 状态
    state,                   // 当前状态
    isInitialized,           // 是否已初始化
  } = useNeuronClient();
  
  // 使用...
}
```

### 需要数据库的功能

1. 运行 `docs/migrations/001_neuron_v2_schema.sql`
2. 重启服务
3. 所有记忆将持久化到数据库

---

## 五、预期效果

完成后：

| 场景 | 效果 |
|------|------|
| 页面刷新 | 所有状态完整恢复 |
| 新设备登录 | 同一用户看到相同记忆 |
| 对话 | 自动关联历史记忆 |
| 搜索 | 语义级搜索，而非关键词 |
| 长期使用 | 记忆自动巩固/遗忘 |
