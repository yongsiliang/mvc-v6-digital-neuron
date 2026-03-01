# 技术债务清理计划

> 创建时间: 2026-03-01
> 执行周期: 6周
> 目标: 将系统从 3.5/10 提升到 8/10 生产就绪度

---

## 一、P0 级别债务（紧急）

### 1.1 记忆持久化

**问题**: 默认使用内存存储，重启后所有记忆丢失

**影响**: 
- 用户数据丢失
- 无法实现"永久记忆"
- 不满足贾维斯级助手的基本要求

**解决方案**:

```typescript
// Step 1: 配置 S3 存储
const STORAGE_CONFIG = {
  backend: 's3',
  s3: {
    bucket: process.env.S3_BUCKET!,
    prefix: 'consciousness-v6/',
  },
};

// Step 2: 实现 Redis 缓存层
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Step 3: 修改存储初始化
const storage = UnifiedStorage.getInstance({
  backend: 's3',
  enableCache: true,
});
```

**工作量**: 2天

**验收标准**:
- [ ] 重启服务后记忆完整保留
- [ ] 记忆读写延迟 < 100ms
- [ ] 支持记忆导入导出

---

### 1.2 向量检索集成

**问题**: 缺少向量数据库，记忆检索仅支持关键词匹配

**影响**:
- 记忆检索效率低
- 无法实现语义搜索
- 记忆相关性差

**解决方案**:

```typescript
// Step 1: 安装 Pinecone SDK
// pnpm add @pinecone-database/pinecone

// Step 2: 创建向量存储适配器
import { Pinecone } from '@pinecone-database/pinecone';

class VectorMemoryStore {
  private pinecone = new Pinecone({ apiKey: process.env.PINECONE_KEY });
  private index = this.pinecone.index('consciousness-memory');
  
  async store(id: string, content: string, metadata: Record<string, unknown>) {
    const vector = await this.embed(content);
    await this.index.upsert([{
      id,
      values: vector,
      metadata,
    }]);
  }
  
  async search(query: string, topK = 10) {
    const vector = await this.embed(query);
    return this.index.query({
      vector,
      topK,
      includeMetadata: true,
    });
  }
}

// Step 3: 替换现有检索逻辑
// 在 layered-memory.ts 中集成向量检索
```

**工作量**: 3天

**验收标准**:
- [ ] 语义搜索准确率 > 85%
- [ ] 检索延迟 < 50ms
- [ ] 支持元数据过滤

---

### 1.3 代码执行安全

**问题**: 使用 `new Function()` 执行代码，存在安全风险

**影响**:
- 可执行任意系统命令
- 存在注入风险
- 不适合生产环境

**解决方案**:

```typescript
// Step 1: 安装 Docker SDK
// pnpm add dockerode

// Step 2: 创建沙箱执行器
import Docker from 'dockerode';

class SandboxExecutor {
  private docker = new Docker();
  
  async executeJavaScript(code: string): Promise<ExecutionResult> {
    const container = await this.docker.createContainer({
      Image: 'node:20-alpine',
      Cmd: ['node', '-e', code],
      HostConfig: {
        Memory: 256 * 1024 * 1024,
        CpuQuota: 50000,
        NetworkMode: 'none',
        ReadonlyRootfs: true,
        AutoRemove: true,
      },
    });
    
    await container.start();
    const logs = await container.logs({ stdout: true, stderr: true });
    
    return { success: true, output: logs.toString() };
  }
  
  async executePython(code: string): Promise<ExecutionResult> {
    // 使用 python:3.11-slim 镜像
  }
}

// Step 3: 替换 executor.ts 中的模拟执行
```

**工作量**: 3天

**验收标准**:
- [ ] JavaScript 真实执行
- [ ] Python 真实执行
- [ ] 执行隔离，无安全风险
- [ ] 超时自动终止

---

## 二、P1 级别债务（重要）

### 2.1 降级策略

**问题**: 无降级策略，任何模块失败都影响整体

**解决方案**:

```typescript
// 添加熔断器
import CircuitBreaker from 'opossum';

const llmBreaker = new CircuitBreaker(llmGateway.chat, {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

// 降级策略
llmBreaker.fallback(() => ({
  content: '抱歉，当前服务繁忙，请稍后再试',
  degraded: true,
}));
```

**工作量**: 1天

---

### 2.2 模块整合

**问题**: 46个模块，维护成本高

**整合方案**:

```
当前结构 (46个模块):
├── meaning-system.ts
├── self-consciousness.ts
├── metacognition.ts
├── emotion-system.ts
├── association-network.ts
├── ... (40+个)

目标结构 (5个模块):
├── core.ts              // 核心处理逻辑
├── memory.ts            // 记忆系统整合
├── cognition.ts         // 认知能力整合
├── emotion.ts           // 情感系统整合
└── growth.ts            // 成长系统整合
```

**工作量**: 5天

---

### 2.3 性能优化

**问题**: 串行调用过多，响应延迟累积

**解决方案**:

```typescript
// 并行化处理
async process(input: string) {
  const [context, memory, emotion] = await Promise.all([
    this.buildContext(input),
    this.retrieveMemory(input),
    this.analyzeEmotion(input),
  ]);
  
  const response = await this.generateResponse({
    context, memory, emotion
  });
  
  return response;
}
```

**工作量**: 2天

---

## 三、P2 级别债务（优化）

### 3.1 监控告警

**解决方案**: 集成 Prometheus + Grafana

**工作量**: 3天

### 3.2 测试覆盖

**解决方案**: 添加单元测试和 E2E 测试

**工作量**: 5天

### 3.3 文档完善

**解决方案**: 完善 API 文档和用户指南

**工作量**: 3天

---

## 四、执行时间线

```
Week 1: P0 紧急修复
├── Day 1-2: 记忆持久化 (S3 + Redis)
├── Day 3-5: 向量检索集成 (Pinecone)
└── Day 6-7: 代码执行安全 (Docker)

Week 2: P1 重要优化
├── Day 1: 降级策略
├── Day 2-4: 模块整合
├── Day 5-6: 性能优化
└── Day 7: 集成测试

Week 3-4: P2 质量提升
├── Day 1-3: 监控告警
├── Day 4-8: 测试覆盖
└── Day 9-10: 文档完善

Week 5-6: 灰度发布
├── Day 1-3: 预发布环境验证
├── Day 4-7: 灰度发布
└── Day 8-10: 全量发布
```

---

## 五、资源需求

| 资源 | 用途 | 成本 |
|------|------|------|
| Pinecone Starter | 向量数据库 | $70/月 |
| Redis Cloud | 缓存 | $15/月 |
| AWS S3 | 存储 | $10/月 |
| Docker Hub | 镜像 | 免费 |
| **总计** | - | **$95/月** |

---

## 六、验收标准

### 发布前检查清单

- [ ] 所有 P0 债务已解决
- [ ] 核心功能测试通过率 > 95%
- [ ] 性能指标达标 (响应时间 < 2s)
- [ ] 监控告警正常
- [ ] 文档更新完成
- [ ] 回滚方案就绪

### 成功指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 生产就绪度 | 3.5/10 | 8/10 |
| 数据持久化 | 0% | 100% |
| 代码执行安全性 | 0% | 100% |
| 向量检索覆盖率 | 0% | 100% |
| 测试覆盖率 | 10% | 80% |
