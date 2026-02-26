# 数字神经元系统 V3 - 数据库迁移指南

## 迁移文件说明

### 当前迁移文件

| 文件 | 版本 | 说明 |
|------|------|------|
| `001_neuron_v3_init.sql` | v001 | V3 初始化迁移 - 完整 AGI 意识架构 |

### 已删除的过时迁移文件

以下文件已删除，因为它们针对旧架构（V1/V2），会误导开发：

| 已删除文件 | 原因 |
|------------|------|
| `docs/migrations/001_neuron_v2_schema.sql` | V2 架构，已被 V3 取代 |
| `src/storage/database/migrations/*.sql` | 旧的意义记忆、记忆空间架构 |
| `scripts/migrate_memory_space.py` | Python 迁移脚本，针对旧架构 |
| `src/app/api/migrate/route.ts` | 旧版迁移 API |

---

## V3 数据库架构

### 表结构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    V3 数据库架构                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ neuron_v3_       │    │ neuron_v3_       │                    │
│  │ neurons          │───►│ connections      │ (预测神经元连接)    │
│  │ (预测神经元)      │    └─────────────────┘                    │
│  └─────────────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ neuron_v3_       │    │ neuron_v3_       │                    │
│  │ concepts         │    │ state            │ (系统状态)          │
│  │ (VSA概念空间)     │    └─────────────────┘                    │
│  └─────────────────┘                                            │
│                                                                 │
│  ═══════════════ AGI 意识架构 ═══════════════                   │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ neuron_v3_       │    │ neuron_v3_       │                    │
│  │ hebbian_network  │───►│ hebbian_synapses │ (阴系统突触)        │
│  │ (阴系统神经元)    │    └─────────────────┘                    │
│  └─────────────────┘                                            │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ neuron_v3_       │    │ neuron_v3_       │                    │
│  │ memory_protection│    │ consciousness_   │                    │
│  │ (记忆保护)        │    │ snapshots        │ (意识快照)          │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  ═══════════════ 自主进化 ═══════════════                       │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ neuron_v3_       │    │ neuron_v3_       │                    │
│  │ evolution_history│    │ genomes          │ (数字基因组)        │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  ═══════════════ 阴阳互塑 ═══════════════                       │
│                                                                 │
│  ┌─────────────────┐                                            │
│  │ neuron_v3_       │                                            │
│  │ yinyang_         │ (阴阳互塑记录)                              │
│  │ interactions     │                                            │
│  └─────────────────┘                                            │
│                                                                 │
│  ═══════════════ 备份机制 ═══════════════                       │
│                                                                 │
│  ┌─────────────────┐                                            │
│  │ neuron_v3_       │                                            │
│  │ memory_backups   │ (安全备份)                                  │
│  └─────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 表详情

#### 1. 核心预测编码

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `neuron_v3_neurons` | 预测神经元 | `prediction_expected_activation`, `learning_prediction_error` |
| `neuron_v3_connections` | Hebbian 突触连接 | `strength`, `hebbian_rate`, `eligibility_trace` |
| `neuron_v3_concepts` | VSA 语义概念 | `vector` (10000维超维向量) |
| `neuron_v3_state` | 系统状态 | `self_model`, `yin_yang_balance` |

#### 2. AGI 意识架构

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `neuron_v3_hebbian_network` | 阴系统神经元 | `activation`, `preference_vector` |
| `neuron_v3_hebbian_synapses` | 阴系统突触 | `weight`, `coactivation_count` |
| `neuron_v3_memory_protection` | 记忆保护 | `importance`, `locked` |
| `neuron_v3_consciousness_snapshots` | 意识快照 | `self_model`, `continuity_score` |

#### 3. 自主进化

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `neuron_v3_evolution_history` | 进化历史 | `generation`, `offspring_fitness` |
| `neuron_v3_genomes` | 数字基因组 | `core_genes`, `expression_genes`, `mutations` |

#### 4. 阴阳互塑

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `neuron_v3_yinyang_interactions` | 阴阳互塑记录 | `yin_contribution`, `yang_contribution`, `fused_result` |

---

## 执行迁移

### 方式 1: Supabase SQL Editor

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/migrations/001_neuron_v3_init.sql` 内容
4. 执行

### 方式 2: API 调用

```bash
# 检查迁移状态
curl http://localhost:5000/api/neuron-v3/migrate

# 执行迁移
curl -X POST http://localhost:5000/api/neuron-v3/migrate \
  -H "Content-Type: application/json" \
  -d '{"confirm": "MIGRATE_WITH_PROTECTION"}'
```

### 方式 3: Supabase CLI

```bash
supabase db push
```

---

## 迁移安全机制

### 自动备份

每次迁移前，系统会自动备份：

- `neuron_v3_neurons` 数据
- `neuron_v3_concepts` 数据
- `neuron_v3_state` 数据

备份保留 365 天。

### 回滚机制

```typescript
// 通过代码回滚
import { rollbackToBackup } from '@/lib/neuron-v3/migration';

await rollbackToBackup('backup-id');
```

### 安全原则

1. **永不删除数据**: 使用 `IF NOT EXISTS` 防止覆盖
2. **自动备份**: 迁移前创建备份
3. **可回滚**: 支持恢复到任意备份点
4. **幂等性**: 可重复执行无副作用

---

## 后续迁移

当需要更新数据库架构时：

1. 创建新迁移文件: `002_xxx.sql`
2. 在 `neuron_v3_migrations` 表记录版本
3. 遵循安全原则：不删除、不覆盖、先备份

---

## 相关代码

| 文件 | 说明 |
|------|------|
| `src/lib/neuron-v3/migration.ts` | 迁移执行逻辑 |
| `src/app/api/neuron-v3/migrate/route.ts` | 迁移 API |
| `supabase/migrations/001_neuron_v3_init.sql` | V3 初始化 SQL |
