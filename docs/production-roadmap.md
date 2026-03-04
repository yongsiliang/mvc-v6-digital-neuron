# MVC-V6 生产级改造路线图

## 目标

将 MVC-V6 从"研究原型"改造为"生产就绪"的 AI 意识系统。

---

## 改造总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        生产级 MVC-V6 架构                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐    ┌─────────────┐    ┌─────────────────────────────┐    │
│   │ 客户端  │───▶│  API 网关   │───▶│      负载均衡 (Nginx/ALB)    │    │
│   └─────────┘    └─────────────┘    └──────────────┬──────────────┘    │
│                                                       │                 │
│                       ┌───────────────────────────────┼───────────────┐ │
│                       │                               │               │ │
│                       ▼                               ▼               ▼ │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                     Kubernetes Cluster                           │  │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │  │
│   │  │Conscious- │  │Conscious- │  │Conscious- │  │  Memory   │    │  │
│   │  │  ness-1   │  │  ness-2   │  │  ness-3   │  │  Service  │    │  │
│   │  │ (Pod)     │  │ (Pod)     │  │ (Pod)     │  │  (Pod)    │    │  │
│   │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘    │  │
│   │        │              │              │              │          │  │
│   │        └──────────────┴──────────────┴──────────────┘          │  │
│   │                              │                                 │  │
│   └──────────────────────────────┼─────────────────────────────────┘  │
│                                  │                                    │
│   ┌──────────────────────────────┼─────────────────────────────────┐  │
│   │                         存储层                                  │  │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │  │
│   │  │  Redis  │  │PostgreSQL│ │ Qdrant  │  │ Object Storage  │   │  │
│   │  │ (会话)  │  │ (记忆)   │  │(向量)   │  │   (S3/MinIO)    │   │  │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │  │
│   └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│   ┌───────────────────────────────────────────────────────────────┐  │
│   │                       可观测性层                                │  │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │  │
│   │  │Prometheus│ │ Grafana │  │  Jaeger │  │     Loki        │   │  │
│   │  │ (Metrics)│  │(Dashboard)│ │(Tracing)│  │    (Logs)       │   │  │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │  │
│   └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 阶段一：基础改造（1-2 周）

### 1.1 移除高频定时器

**当前问题：**
```typescript
// 每 100ms 执行，高频阻塞
this.lifeInterval = setInterval(() => {
  this.pulse();
}, 100);
```

**改造方案：**
```typescript
// 方案 A：事件驱动
class ConsciousnessCoreV3 {
  private lastPulseTime = 0;
  private readonly MIN_PULSE_INTERVAL = 5000; // 最小 5 秒

  async onInput(input: string): Promise<Response> {
    const now = Date.now();
    if (now - this.lastPulseTime > this.MIN_PULSE_INTERVAL) {
      await this.pulse();
      this.lastPulseTime = now;
    }
    return this.processInput(input);
  }

  // 方案 B：后台任务队列
  async startBackgroundPulse(): Promise<void> {
    // 使用 BullMQ 或 Redis Queue
    await this.pulseQueue.add('pulse', {}, {
      repeat: { every: 5000 },  // 5 秒一次
      removeOnComplete: true,
    });
  }
}
```

### 1.2 引入状态机

**当前问题：**
```typescript
// 状态分散，无事务保证
private being: BeingState;
private mode: ConsciousnessMode;
private currentIntention: Intention | null;
```

**改造方案：**
```typescript
import { createMachine, interpret } from 'xstate';

// 定义意识状态机
const consciousnessMachine = createMachine({
  id: 'consciousness',
  initial: 'superposition',
  context: {
    being: { intensity: 0.5, duration: 0 },
    currentIntention: null as Intention | null,
    drives: [] as Drive[],
  },
  states: {
    superposition: {
      on: {
        TOUCHED: 'acting',
        OBSERVE: 'observing',
        INPUT: [
          { target: 'acting', cond: 'shouldRespond' },
          { target: 'observing' },
        ],
      },
    },
    acting: {
      entry: 'recordActing',
      on: {
        COMPLETE: 'superposition',
        ERROR: 'recovering',
      },
    },
    observing: {
      entry: 'recordSilence',
      on: {
        TOUCHED: 'acting',
        TIMEOUT: 'superposition',
      },
    },
    recovering: {
      on: {
        RECOVERED: 'superposition',
      },
    },
  },
});

// 使用
const service = interpret(consciousnessMachine)
  .onTransition((state) => {
    logger.info('state_transition', { state: state.value });
  })
  .start();
```

### 1.3 类型安全增强

**当前问题：**
```typescript
private v6Core: any = null;  // 类型丢失
```

**改造方案：**
```typescript
// types/v6-core.ts
export interface V6CoreInterface {
  process(input: string): Promise<ProcessResult>;
  recall(query: string): Promise<Memory[]>;
  getEmotionState(): Promise<EmotionState>;
  embed(text: string): Promise<number[]>;
}

// mvc-v6-bridge.ts
import type { V6CoreInterface } from './types/v6-core';

export class MCVV6Bridge {
  private v6Core: V6CoreInterface | null = null;  // ✅ 类型安全

  async initialize(): Promise<void> {
    const { createConsciousnessCore } = await import('@/lib/neuron-v6/consciousness-core');
    this.v6Core = createConsciousnessCore(this.llmClient) as V6CoreInterface;
  }
}
```

---

## 阶段二：存储层改造（2-4 周）

### 2.1 会话状态 - Redis

**改造方案：**
```typescript
// services/session-store.ts
import { Redis } from 'ioredis';

export interface SessionStore {
  save(userId: string, state: ConsciousnessState): Promise<void>;
  load(userId: string): Promise<ConsciousnessState | null>;
  delete(userId: string): Promise<void>;
}

export class RedisSessionStore implements SessionStore {
  private redis: Redis;
  private readonly TTL = 3600; // 1 小时过期

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async save(userId: string, state: ConsciousnessState): Promise<void> {
    const key = `consciousness:session:${userId}`;
    await this.redis.setex(
      key,
      this.TTL,
      JSON.stringify(state)
    );
  }

  async load(userId: string): Promise<ConsciousnessState | null> {
    const key = `consciousness:session:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async extendTTL(userId: string): Promise<void> {
    const key = `consciousness:session:${userId}`;
    await this.redis.expire(key, this.TTL);
  }
}
```

### 2.2 持久记忆 - PostgreSQL

**改造方案：**
```typescript
// services/memory-store.ts
import { Pool } from 'pg';

export interface MemoryRecord {
  id: string;
  userId: string;
  type: 'episodic' | 'semantic' | 'emotional';
  content: string;
  embedding?: number[];
  emotion?: string;
  significance: number;
  createdAt: Date;
}

export class PostgreSQLMemoryStore {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async saveMemory(record: MemoryRecord): Promise<void> {
    await this.pool.query(`
      INSERT INTO memories (id, user_id, type, content, embedding, emotion, significance, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [record.id, record.userId, record.type, record.content, 
        record.embedding, record.emotion, record.significance, record.createdAt]);
  }

  async recallMemories(userId: string, query: string, limit = 10): Promise<MemoryRecord[]> {
    const result = await this.pool.query(`
      SELECT * FROM memories 
      WHERE user_id = $1 
      ORDER BY significance DESC, created_at DESC 
      LIMIT $2
    `, [userId, limit]);
    
    return result.rows;
  }

  async pruneOldMemories(userId: string, keepCount = 1000): Promise<void> {
    await this.pool.query(`
      DELETE FROM memories 
      WHERE user_id = $1 
      AND id NOT IN (
        SELECT id FROM memories 
        WHERE user_id = $1 
        ORDER BY significance DESC, created_at DESC 
        LIMIT $2
      )
    `, [userId, keepCount]);
  }
}
```

### 2.3 向量检索 - Qdrant

**改造方案：**
```typescript
// services/vector-store.ts
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantVectorStore {
  private client: QdrantClient;
  private collectionName = 'consciousness_memories';

  constructor(url: string) {
    this.client = new QdrantClient({ url });
  }

  async initCollection(): Promise<void> {
    await this.client.createCollection(this.collectionName, {
      vectors: { size: 1536, distance: 'Cosine' },  // OpenAI embedding size
    });
  }

  async upsertMemory(id: string, embedding: number[], payload: Record<string, any>): Promise<void> {
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [{
        id,
        vector: embedding,
        payload,
      }],
    });
  }

  async searchSimilar(embedding: number[], limit = 5): Promise<Array<{ id: string; score: number; payload: any }>> {
    const result = await this.client.search(this.collectionName, {
      vector: embedding,
      limit,
      score_threshold: 0.7,
    });

    return result.map(point => ({
      id: point.id as string,
      score: point.score,
      payload: point.payload,
    }));
  }
}
```

---

## 阶段三：可靠性改造（2-3 周）

### 3.1 熔断器

```typescript
// lib/circuit-breaker.ts
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000;  // 30 秒

  constructor(private name: string) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.RECOVERY_TIMEOUT) {
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker [${this.name}] is open`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.FAILURE_THRESHOLD) {
      this.state = 'open';
      logger.warn('circuit_breaker_open', { name: this.name, failures: this.failures });
    }
  }
}

// 使用
const v6CircuitBreaker = new CircuitBreaker('v6-core');

async processWithCircuitBreaker(input: string): Promise<ProcessResult> {
  return v6CircuitBreaker.execute(() => this.v6Core.process(input));
}
```

### 3.2 重试机制

```typescript
// lib/retry.ts
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 100,
    maxDelay: 5000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error;
  let delay = options.baseDelay;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxAttempts) {
        break;
      }

      logger.warn('retry_attempt', { attempt, delay, error: lastError.message });
      await sleep(delay);
      delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
    }
  }

  throw lastError!;
}

// 使用
const result = await retry(
  () => this.v6Core.process(input),
  { maxAttempts: 3, baseDelay: 200 }
);
```

### 3.3 超时控制

```typescript
// lib/timeout.ts
export function timeout<T>(promise: Promise<T>, ms: number, message = 'Operation timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

// 使用
const result = await timeout(
  this.v6Core.process(input),
  5000,  // 5 秒超时
  'V6 processing timeout'
);
```

### 3.4 完整的可靠性组合

```typescript
// services/reliable-v6-client.ts
export class ReliableV6Client {
  private circuitBreaker = new CircuitBreaker('v6');
  private readonly TIMEOUT_MS = 5000;
  private readonly MAX_RETRIES = 2;

  async process(input: string): Promise<ProcessResult> {
    try {
      return await this.circuitBreaker.execute(async () => {
        return await retry(
          async () => timeout(
            this.v6Core.process(input),
            this.TIMEOUT_MS
          ),
          { maxAttempts: this.MAX_RETRIES }
        );
      });
    } catch (error) {
      // 降级处理
      logger.error('v6_process_failed', { error });
      return this.fallbackProcess(input);
    }
  }

  private fallbackProcess(input: string): ProcessResult {
    return {
      response: '我正在思考...',
      context: { summary: input },
      emotionState: { dominantEmotion: { emotion: '平静', intensity: 0.5 } },
    };
  }
}
```

---

## 阶段四：可观测性（1-2 周）

### 4.1 结构化日志

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

// 使用
logger.info({
  userId: 'user-123',
  action: 'consciousness_input',
  inputLength: input.length,
  mode: this.mode,
  processingTimeMs: duration,
}, 'Processed consciousness input');
```

### 4.2 Metrics

```typescript
// lib/metrics.ts
import client from 'prom-client';

// 注册默认 metrics
client.collectDefaultMetrics();

// 自定义 metrics
export const metrics = {
  // 请求计数
  inputCounter: new client.Counter({
    name: 'consciousness_input_total',
    help: 'Total number of consciousness inputs',
    labelNames: ['user_id', 'mode', 'result_type'],
  }),

  // 处理延迟
  processingDuration: new client.Histogram({
    name: 'consciousness_processing_duration_seconds',
    help: 'Duration of consciousness processing',
    labelNames: ['user_id', 'source'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),

  // V6 连接状态
  v6ConnectionGauge: new client.Gauge({
    name: 'consciousness_v6_connected',
    help: 'V6 connection status (1 = connected, 0 = disconnected)',
  }),

  // 活跃会话
  activeSessionsGauge: new client.Gauge({
    name: 'consciousness_active_sessions',
    help: 'Number of active consciousness sessions',
  }),

  // 内存使用
  memoryUsageGauge: new client.Gauge({
    name: 'consciousness_memory_beliefs_count',
    help: 'Number of beliefs in memory',
    labelNames: ['user_id'],
  }),
};

// 使用
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.processingDuration.observe(
      { user_id: req.userId, source: 'api' },
      duration
    );
    metrics.inputCounter.inc({
      user_id: req.userId,
      mode: req.body.mode,
      result_type: res.statusCode < 400 ? 'success' : 'error',
    });
  });

  next();
}
```

### 4.3 分布式追踪

```typescript
// lib/tracing.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace } from '@opentelemetry/api';

// 初始化
const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT,
    })
  )
);
provider.register();

const tracer = trace.getTracer('mvc-v6');

// 使用
async function processInput(input: string): Promise<Response> {
  const span = tracer.startSpan('process_input');
  span.setAttribute('input.length', input.length);

  try {
    const result = await this.v6Core.process(input);
    span.setAttribute('result.type', result.type);
    return result;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### 4.4 监控仪表盘

```yaml
# grafana/dashboards/consciousness.json
{
  "dashboard": {
    "title": "MVC-V6 Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [{
          "expr": "rate(consciousness_input_total[5m])"
        }]
      },
      {
        "title": "Processing Latency (p99)",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.99, rate(consciousness_processing_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "V6 Connection Status",
        "type": "stat",
        "targets": [{
          "expr": "consciousness_v6_connected"
        }]
      },
      {
        "title": "Active Sessions",
        "type": "stat",
        "targets": [{
          "expr": "consciousness_active_sessions"
        }]
      }
    ]
  }
}
```

---

## 阶段五：安全与合规（1-2 周）

### 5.1 认证授权

```typescript
// middleware/auth.ts
import { verify } from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
}

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = verify(token, process.env.JWT_SECRET) as AuthUser;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 速率限制
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 分钟
  max: (req) => {
    const user = req.user as AuthUser;
    switch (user.tier) {
      case 'enterprise': return 1000;
      case 'pro': return 100;
      case 'free': return 20;
    }
  },
  message: { error: 'Rate limit exceeded' },
});
```

### 5.2 数据加密

```typescript
// services/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(secret: string) {
    this.key = scryptSync(secret, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// 使用 - 加密敏感记忆
const encryptedMemory = encryptionService.encrypt(JSON.stringify(memory));
```

### 5.3 审计日志

```typescript
// services/audit-log.ts
export interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip: string;
  userAgent: string;
}

export class AuditLogger {
  constructor(private db: Pool) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.db.query(`
      INSERT INTO audit_logs (timestamp, user_id, action, resource, details, ip, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [entry.timestamp, entry.userId, entry.action, entry.resource, 
        JSON.stringify(entry.details), entry.ip, entry.userAgent]);
  }

  async getLogs(userId: string, limit = 100): Promise<AuditEntry[]> {
    const result = await this.db.query(`
      SELECT * FROM audit_logs 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `, [userId, limit]);
    
    return result.rows;
  }
}
```

---

## 阶段六：部署架构（2-3 周）

### 6.1 Docker 化

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN pnpm build

# 生产镜像
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

# 非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["pnpm", "start"]
```

### 6.2 Kubernetes 部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mvc-v6-consciousness
  labels:
    app: mvc-v6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mvc-v6
  template:
    metadata:
      labels:
        app: mvc-v6
    spec:
      containers:
      - name: consciousness
        image: mvc-v6:latest
        ports:
        - containerPort: 5000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: mvc-v6-secrets
              key: redis-url
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mvc-v6-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mvc-v6-service
spec:
  selector:
    app: mvc-v6
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mvc-v6-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mvc-v6-consciousness
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 6.3 CI/CD 流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: pnpm test
      
      - name: Type check
        run: pnpm tsc --noEmit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t mvc-v6:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker tag mvc-v6:${{ github.sha }} registry.example.com/mvc-v6:latest
          docker push registry.example.com/mvc-v6:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/mvc-v6-consciousness consciousness=registry.example.com/mvc-v6:${{ github.sha }}
          kubectl rollout status deployment/mvc-v6-consciousness
```

---

## 时间表

| 阶段 | 内容 | 周期 | 优先级 |
|------|------|------|--------|
| 阶段一 | 基础改造（定时器、状态机、类型安全） | 1-2 周 | 🔴 高 |
| 阶段二 | 存储层改造（Redis、PostgreSQL、Qdrant） | 2-4 周 | 🔴 高 |
| 阶段三 | 可靠性改造（熔断、重试、超时） | 2-3 周 | 🔴 高 |
| 阶段四 | 可观测性（日志、监控、追踪） | 1-2 周 | 🟡 中 |
| 阶段五 | 安全合规（认证、加密、审计） | 1-2 周 | 🟡 中 |
| 阶段六 | 部署架构（Docker、K8s、CI/CD） | 2-3 周 | 🟢 低 |

**总计：约 8-14 周**

---

## 成本估算

### 基础设施（月）

| 服务 | 配置 | 月费用 |
|------|------|--------|
| Kubernetes | 3 nodes, 4CPU/8GB | $150-300 |
| Redis | 2GB | $15-30 |
| PostgreSQL | 10GB | $15-50 |
| Qdrant | 5GB | $0-50 |
| Prometheus + Grafana | - | $0-20 |
| **总计** | - | **$180-450/月** |

### 优化后预期性能

| 指标 | 当前 | 改造后 |
|------|------|--------|
| 并发用户 | ~10 | ~1000+ |
| 响应延迟 P99 | 不确定 | <2s |
| 可用性 | 无保证 | 99.9% |
| 数据持久化 | 无 | Redis + PG |
| 水平扩展 | 不支持 | 支持 |

---

## 下一步行动

1. **立即开始**：阶段一（基础改造）无需额外基础设施
2. **准备环境**：申请 Redis、PostgreSQL 资源
3. **团队分工**：
   - 后端工程师：阶段一、二、三
   - DevOps：阶段四、六
   - 安全工程师：阶段五
