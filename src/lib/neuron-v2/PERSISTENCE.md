# 持久化与用户识别架构

> **核心问题**：页面刷新后记忆还在吗？不同设备如何识别用户？

---

## 一、当前状态

### 1.1 问题诊断

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     当前系统状态                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ❌ 问题1：没有长期记忆                                                  │
│     • MemoryManager 是内存实现                                          │
│     • 页面刷新 → 所有数据丢失                                            │
│                                                                         │
│  ❌ 问题2：没有用户隔离                                                  │
│     • 没有 userId 字段                                                  │
│     • 所有用户共享同一份数据                                             │
│                                                                         │
│  ❌ 问题3：没有跨设备同步                                                │
│     • 没有用户认证机制                                                  │
│     • 设备A和设备B无法识别同一用户                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、完整解决方案

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     完整架构                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      前端（浏览器）                              │   │
│  │                                                                 │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │   │
│  │  │  用户认证   │    │ 数字神经元  │    │  自动保存   │        │   │
│  │  │  (Clerk)   │    │   系统     │    │  (30秒)    │        │   │
│  │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │   │
│  │         │                  │                  │               │   │
│  │         │ userId           │ 网络状态         │ 持久化        │   │
│  │         │                  │                  │               │   │
│  └─────────┼──────────────────┼──────────────────┼───────────────┘   │
│            │                  │                  │                    │
│            └──────────────────┼──────────────────┘                    │
│                               │                                       │
│                               ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      后端（API Routes）                          │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                    /api/neuron/*                        │   │   │
│  │  │                                                         │   │   │
│  │  │  POST /remember     - 记住内容                          │   │   │
│  │  │  POST /recall       - 回忆内容                          │   │   │
│  │  │  GET  /state        - 获取完整状态                       │   │   │
│  │  │  POST /save         - 手动保存                          │   │   │
│  │  │  POST /load         - 加载状态                          │   │   │
│  │  │  GET  /stats        - 获取统计                          │   │   │
│  │  │                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                               │                                 │   │
│  └───────────────────────────────┼─────────────────────────────────┘   │
│                                  │                                     │
│                                  ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      数据库（Supabase）                          │   │
│  │                                                                 │   │
│  │  ┌─────────────┐                                              │   │
│  │  │   users     │ ← 外部认证ID (Clerk ID)                       │   │
│  │  └──────┬──────┘                                              │   │
│  │         │                                                      │   │
│  │         │ userId (外键)                                        │   │
│  │         │                                                      │   │
│  │  ┌──────┴──────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │ neurons_v2  │  │connections_v2│  │ memories_v2 │           │   │
│  │  │ + userId    │  │ + userId    │  │ + userId    │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐                            │   │
│  │  │self_models_v2│ │system_states_v2│                         │   │
│  │  │ + userId    │  │ + userId    │                            │   │
│  │  └─────────────┘  └─────────────┘                            │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户登录流程：

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ 用户    │ ──→ │ Clerk   │ ──→ │ 获取    │ ──→ │ 创建/获取│
│ 访问    │     │ 认证    │     │ userId  │     │ 用户记录 │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                     │
                                                     ▼
                                              ┌─────────┐
                                              │ 加载    │
                                              │ 大脑状态 │
                                              └────┬────┘
                                                     │
                                                     ▼
                                              ┌─────────┐
                                              │ 恢复    │
                                              │ 记忆网络 │
                                              └─────────┘

页面刷新流程：

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ 页面    │ ──→ │ 检查    │ ──→ │ 从数据库 │ ──→ │ 恢复    │
│ 刷新    │     │ 认证态  │     │ 加载状态 │     │ 完整状态 │
└─────────┘     └─────────┘     └─────────┘     └─────────┘

跨设备登录流程：

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ 设备A   │     │         │     │         │     │ 设备B   │
│ 登录    │ ──→ │ 同一个  │ ──→ │ 同一个  │ ──→ │ 登录    │
│ 修改    │     │ userId  │     │ 数据库  │     │ 看到    │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

---

## 三、用户识别机制

### 3.1 三层识别

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     用户识别层次                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  第1层：外部认证服务（Clerk/Auth0/自定义）                               │
│  ─────────────────────────────────────                                  │
│                                                                         │
│    用户 ──→ 认证服务 ──→ externalAuthId                                 │
│                                                                         │
│    例如：                                                                │
│    • Clerk: "user_2xYz123456789"                                        │
│    • Auth0: "auth0|abc123"                                              │
│    • 自定义: "custom_user_123"                                          │
│                                                                         │
│  第2层：内部用户表                                                       │
│  ─────────────────────                                                  │
│                                                                         │
│    externalAuthId ──→ users表 ──→ userId (UUID)                         │
│                                                                         │
│    用户表：                                                              │
│    ┌────────────────────────────────────────────────────────────────┐  │
│    │ id (userId)  │ externalAuthId      │ email     │ displayName  │  │
│    │ uuid-xxx     │ user_2xYz123456789  │ a@b.com   │ 张三         │  │
│    └────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  第3层：数据隔离                                                        │
│  ─────────────────                                                      │
│                                                                         │
│    所有数据表都有 userId 字段：                                          │
│                                                                         │
│    neurons_v2:      { id, userId, ... }                                 │
│    connections_v2:  { id, userId, ... }                                 │
│    memories_v2:     { id, userId, ... }                                 │
│                                                                         │
│    查询时自动过滤：                                                      │
│    SELECT * FROM neurons_v2 WHERE userId = ?                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 代码实现

```typescript
// 步骤1：用户登录时，获取或创建用户记录

import { getOrCreateUser } from '@/lib/neuron-v2/db-operations';
import { auth } from '@clerk/nextjs'; // 或其他认证库

async function handleUserLogin() {
  // 从认证服务获取外部ID
  const { userId: externalAuthId } = auth();
  
  // 在数据库中获取或创建用户
  const userId = await getOrCreateUser(externalAuthId);
  
  // 设置到持久化管理器
  persistenceManager.setUser(userId);
  
  // 加载用户的大脑状态
  const brainState = await persistenceManager.loadBrainState();
  
  if (brainState) {
    // 恢复之前的状态
    await persistenceManager.applyLoadedState(
      brainState, 
      system.network, 
      system.memoryManager
    );
  } else {
    // 首次使用，初始化新大脑
    system.initializeBaseNeurons();
  }
  
  return userId;
}
```

---

## 四、持久化机制

### 4.1 自动保存

```typescript
// 配置自动保存

const persistenceManager = createPersistenceManager(dbInterface, {
  autoSave: true,           // 启用自动保存
  autoSaveInterval: 30000,  // 每30秒保存一次
  saveActivationHistory: true,
  saveConnectionHistory: true,
  historyRetentionDays: 30,
});

// 监听自动保存事件
persistenceManager.on('autoSave', async ({ userId, timestamp }) => {
  // 触发保存
  await persistenceManager.saveBrainState(
    system.network,
    system.memoryManager
  );
});
```

### 4.2 手动保存

```typescript
// 关键操作后手动保存

async function remember(content: string) {
  // 1. 执行记忆操作
  await system.remember(content);
  
  // 2. 立即保存
  await persistenceManager.saveBrainState(
    system.network,
    system.memoryManager
  );
}

// 用户主动保存
async function handleManualSave() {
  await persistenceManager.saveBrainState(
    system.network,
    system.memoryManager
  );
  
  toast.success('已保存到云端');
}
```

### 4.3 页面刷新处理

```typescript
// 页面加载时恢复状态

import { useEffect } from 'react';

function useNeuronSystem() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [system, setSystem] = useState<DigitalNeuronSystem | null>(null);
  
  useEffect(() => {
    async function init() {
      // 1. 等待认证完成
      const userId = await waitForAuth();
      
      // 2. 创建系统实例
      const sys = new DigitalNeuronSystem();
      
      // 3. 设置持久化
      const pm = createPersistenceManager(dbInterface);
      pm.setUser(userId);
      
      // 4. 加载保存的状态
      const state = await pm.loadBrainState();
      if (state) {
        await pm.applyLoadedState(state, sys.network, sys.memoryManager);
      }
      
      // 5. 启动自动保存
      pm.startAutoSave();
      
      setSystem(sys);
      setIsLoaded(true);
    }
    
    init();
  }, []);
  
  return { system, isLoaded };
}
```

---

## 五、数据库表结构

### 5.1 核心表

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_auth_id VARCHAR(255) UNIQUE,  -- 外部认证ID
  display_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  avatar_url VARCHAR(500),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
);

-- 神经元表（带用户隔离）
CREATE TABLE neurons_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(255),
  sensitivity_vector JSONB NOT NULL,
  activation REAL DEFAULT 0,
  -- ... 其他字段
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX neurons_v2_user_idx ON neurons_v2(user_id);

-- 连接表（带用户隔离）
CREATE TABLE connections_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_neuron UUID NOT NULL REFERENCES neurons_v2(id) ON DELETE CASCADE,
  to_neuron UUID NOT NULL REFERENCES neurons_v2(id) ON DELETE CASCADE,
  strength REAL DEFAULT 0.5,
  -- ... 其他字段
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX connections_v2_user_idx ON connections_v2(user_id);

-- 记忆表（带用户隔离）
CREATE TABLE memories_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  strength REAL DEFAULT 1,
  importance REAL DEFAULT 0.5,
  -- ... 其他字段
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX memories_v2_user_idx ON memories_v2(user_id);
```

---

## 六、API接口设计

### 6.1 REST API

```typescript
// app/api/neuron/route.ts

import { getOrCreateUser } from '@/lib/neuron-v2/db-operations';
import { auth } from '@clerk/nextjs';

// 获取用户ID中间件
async function getUserId() {
  const { userId: externalAuthId } = auth();
  if (!externalAuthId) {
    throw new Error('Unauthorized');
  }
  return getOrCreateUser(externalAuthId);
}

// GET /api/neuron/state - 获取完整状态
export async function GET() {
  const userId = await getUserId();
  
  const neurons = await loadNeurons(userId);
  const connections = await loadConnections(userId);
  const memories = await loadMemories(userId);
  
  return Response.json({
    neurons,
    connections,
    memories,
    stats: {
      neuronCount: neurons.length,
      connectionCount: connections.length,
      memoryCount: memories.length,
    },
  });
}

// POST /api/neuron/remember - 记住内容
export async function POST(request: Request) {
  const userId = await getUserId();
  const { content, type, importance } = await request.json();
  
  // 执行记忆逻辑...
  
  return Response.json({ success: true });
}
```

### 6.2 客户端调用

```typescript
// hooks/useNeuronClient.ts

export function useNeuronClient() {
  // 记住内容
  const remember = async (content: string, options = {}) => {
    const res = await fetch('/api/neuron/remember', {
      method: 'POST',
      body: JSON.stringify({ content, ...options }),
    });
    return res.json();
  };
  
  // 回忆内容
  const recall = async (cue: string) => {
    const res = await fetch('/api/neuron/recall', {
      method: 'POST',
      body: JSON.stringify({ cue }),
    });
    return res.json();
  };
  
  // 获取状态
  const getState = async () => {
    const res = await fetch('/api/neuron/state');
    return res.json();
  };
  
  // 手动保存
  const save = async () => {
    const res = await fetch('/api/neuron/save', { method: 'POST' });
    return res.json();
  };
  
  return { remember, recall, getState, save };
}
```

---

## 七、回答核心问题

### Q1: 有长期记忆吗？

```
✅ 解决方案已实现：

• MemoryManager: 内存记忆管理
• PersistenceManager: 持久化管理
• 数据库表: neurons_v2, connections_v2, memories_v2

长期记忆 = 连接强度分布
存储在数据库，永久保存
```

### Q2: 页面刷新后呢？

```
✅ 解决方案：

1. 页面加载时
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │ 检查    │ ──→ │ 获取    │ ──→ │ 从数据库 │
   │ 认证态  │     │ userId  │     │ 加载状态 │
   └─────────┘     └─────────┘     └─────────┘
                                         │
                                         ▼
                                  ┌─────────┐
                                  │ 恢复    │
                                  │ 完整状态 │
                                  └─────────┘

2. 自动保存
   每30秒自动保存到数据库

3. 关键操作后
   记忆、回忆等操作后立即保存

结果：页面刷新后，状态完整恢复
```

### Q3: 不同设备如何识别用户？

```
✅ 解决方案：

1. 统一认证服务（Clerk）
   所有设备使用同一个认证服务
   
2. 外部认证ID
   Clerk提供唯一的 externalAuthId
   
3. 内部用户表
   externalAuthId → userId (UUID)
   
4. 数据隔离
   所有数据通过 userId 关联

流程：
   设备A登录 ──→ Clerk认证 ──→ 获取userId
                                    │
                                    ▼
                             加载用户数据
                                    │
   设备B登录 ──→ Clerk认证 ──→ 同一userId ──→ 同一份数据
                                    │
                                    ▼
                             看到同样的记忆
```

---

## 八、总结

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     完整解决方案总结                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  问题                    │ 解决方案                  │ 文件             │
│  ────────────────────────┼──────────────────────────┼────────────────── │
│  没有长期记忆            │ PersistenceManager       │ persistence.ts   │
│  页面刷新数据丢失        │ 自动保存 + 加载机制       │ db-operations.ts │
│  没有用户隔离            │ userId 字段 + 数据隔离    │ schema.ts        │
│  跨设备无法识别          │ 外部认证ID (Clerk)        │ 需要集成         │
│                                                                         │
│  新增文件：                                                              │
│  • persistence.ts    - 持久化管理器                                    │
│  • db-operations.ts  - 数据库操作                                      │
│  • schema.ts         - 数据库表结构（V2）                               │
│                                                                         │
│  需要集成：                                                              │
│  • Clerk 认证服务                                                       │
│  • API Routes                                                          │
│  • 前端 hooks                                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
