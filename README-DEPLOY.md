# 认知智能体 - 本地部署指南

## 这是什么？

一个会"动手干活"的 AI 智能体：
- 访问网页并提取信息
- 读写本地文件
- 调用 API 接口
- 理解图片内容

## 环境要求

- Node.js 18+
- pnpm 9+

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# LLM API 配置（必需）
# 如果使用豆包/火山引擎
ARK_API_KEY=your_api_key_here

# 或者使用其他兼容的 LLM 服务
# 具体配置参考 coze-coding-dev-sdk 文档
```

### 3. 运行

```bash
# 开发模式
pnpm dev

# 或者
coze dev

# 访问 http://localhost:5000
```

### 4. 构建（生产环境）

```bash
pnpm build
pnpm start
```

## 项目结构

```
src/
├── app/                    # Next.js 页面
│   ├── page.tsx           # 首页
│   ├── agent-demo/        # 认知智能体演示页
│   └── api/               # API 接口
│       └── agent/
│           ├── browser/   # 浏览器模式 API
│           └── executors/ # 执行器信息 API
│
├── lib/
│   ├── info-field/        # 信息层：信息结构定义
│   ├── intelligence/      # 智能层：认知智能体
│   │   ├── cognitive-agent.ts    # 核心认知循环
│   │   ├── memory.ts            # 记忆系统
│   │   └── llm-cache.ts         # LLM 缓存
│   │
│   └── action/            # 行动层：执行器
│       ├── executor.ts           # 执行器接口
│       ├── executor-manager.ts   # 执行器管理器
│       ├── browser-executor.ts   # 浏览器执行器
│       ├── multimodal-executor.ts # 多模态执行器
│       ├── file-executor.ts      # 文件执行器
│       └── api-executor.ts       # API 执行器
│
└── components/            # UI 组件
    └── ui/               # shadcn/ui 组件
```

## 使用示例

### 访问网页
```
访问 https://example.com 并提取页面内容
```

### 文件操作
```
读取 /tmp 目录下的文件列表
```

### API 调用
```
用 POST 请求调用 https://httpbin.org/post，发送 {"name": "test"}
```

### 图片理解
```
分析这张图片 https://example.com/image.png
```

## 功能特点

### 三层架构

```
信息层 → 智能层 → 行动层
  ↓         ↓         ↓
编码     LLM决策    执行操作
```

### 认知循环

```
Perceive → Understand → Decide → Act → Observe
   ↓          ↓          ↓       ↓      ↓
  感知       理解       决策     执行   观察
```

### 自动执行器选择

系统根据意图自动选择合适的执行器：
- `browser`: 网页浏览、导航、搜索
- `multimodal`: 图片理解、OCR
- `file`: 文件读写、目录操作
- `api`: HTTP API 调用

## 扩展开发

### 添加新执行器

```typescript
// src/lib/action/my-executor.ts
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';
import { ActionStructure } from '../info-field/structures';

export class MyExecutor implements ActionExecutor {
  readonly type = 'my-executor';
  
  getCapabilities(): ExecutorCapabilities {
    return {
      name: 'My Executor',
      description: '自定义执行器',
      supportedActions: ['my-action']
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.getCapabilities().supportedActions.includes(action.action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    // 实现你的执行逻辑
    return {
      actionId: action.id,
      status: 'success',
      content: '执行成功',
      completed: false
    };
  }
}
```

### 注册执行器

```typescript
// src/lib/action/executor-manager.ts
import { MyExecutor } from './my-executor';

// 在 registerDefaultExecutors 方法中添加
this.register(new MyExecutor());
```

## 注意事项

1. **API Key**: 必须配置 LLM API Key 才能使用
2. **文件访问**: 默认只允许访问 `/tmp` 和 `/workspace` 目录
3. **网络访问**: 可以访问公网资源，无法访问内网
4. **执行超时**: 默认 30 秒超时

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- shadcn/ui
- Tailwind CSS 4
- coze-coding-dev-sdk (LLM)
- cheerio (HTML 解析)

## License

MIT
