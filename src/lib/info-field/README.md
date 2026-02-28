# 信息结构场 (Information Structure Field)

## 核心思想

**信息结构 = 经不同算法编码的不同表示**

**变换的目的：让信息能被感受器接收**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   原始信息 "猫"                                                  │
│       │                                                         │
│       ├──► TF-IDF 算法     → 稀疏向量 [0, 0.5, 0, ...]          │
│       │                     被 检索感受器 接收                   │
│       │                                                         │
│       ├──► 随机投影算法   → 稠密向量 [0.1, -0.3, ...]           │
│       │                     被 语义感受器 接收                   │
│       │                                                         │
│       ├──► 注意力算法     → 注意力权重                          │
│       │                     被 关联感受器 接收                   │
│       │                                                         │
│       ├──► 键值提取算法   → { text: "猫", length: 1 }          │
│       │                     被 结构感受器 接收                   │
│       │                                                         │
│       ├──► 序列分割算法   → [片段1, 片段2, ...]                 │
│       │                     被 序列感受器 接收                   │
│       │                                                         │
│       └──► 图提取算法     → 节点 + 边                           │
│                             被 图感受器 接收                     │
│                                                                 │
│   同一信息，不同编码 → 不同结构 → 不同感受器                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 为什么需要不同的编码？

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   不同的感受器需要不同格式的信息                                 │
│                                                                 │
│   检索感受器：需要快速匹配 → 稀疏向量（TF-IDF）                  │
│              好处：索引快，计算简单                              │
│                                                                 │
│   语义感受器：需要理解含义 → 稠密向量（Embedding）               │
│              好处：语义相似度，泛化能力强                        │
│                                                                 │
│   关联感受器：需要建立关系 → 注意力权重                          │
│              好处：表示信息间的关联强度                          │
│                                                                 │
│   结构感受器：需要提取属性 → 键值对                              │
│              好处：直接访问属性，结构清晰                        │
│                                                                 │
│   序列感受器：需要处理顺序 → 有序列表                            │
│              好处：保留时序/顺序信息                             │
│                                                                 │
│   图感受器：需要网络关系 → 节点 + 边                             │
│            好处：表示复杂关联                                    │
│                                                                 │
│   变换 = 适配：让信息匹配感受器的输入格式                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         信息场                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    编码器 (Encoders)                     │   │
│   │                                                         │   │
│   │  TermFrequencyEncoder  →  SparseVectorStructure        │   │
│   │  HashEncoder           →  SparseVectorStructure        │   │
│   │  RandomProjectionEncoder → DenseVectorStructure        │   │
│   │  AttentionEncoder      →  AttentionStructure           │   │
│   │  KeyValueEncoder       →  KeyValueStructure            │   │
│   │  SequenceEncoder       →  SequenceStructure            │   │
│   │  GraphEncoder          →  GraphStructure               │   │
│   │                                                         │   │
│   └───────────────────────────┬─────────────────────────────┘   │
│                               │                                   │
│                               ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    感受器 (Receptors)                    │   │
│   │                                                         │   │
│   │  RetrievalReceptor   ← 接收 SparseVectorStructure       │   │
│   │  SemanticReceptor    ← 接收 DenseVectorStructure        │   │
│   │  AssociationReceptor ← 接收 AttentionStructure          │   │
│   │  StructureReceptor   ← 接收 KeyValueStructure           │   │
│   │  SequenceReceptor    ← 接收 SequenceStructure           │   │
│   │  GraphReceptor       ← 接收 GraphStructure              │   │
│   │  MultimodalReceptor  ← 接收 所有类型                    │   │
│   │                                                         │   │
│   │  每个感受器是黑盒子：                                    │   │
│   │  - 接收信息结构                                         │   │
│   │  - 内部处理 = 黑盒（我们不模拟）                        │   │
│   │  - 产生效果：输出新结构 / 改变状态                      │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 使用示例

```typescript
import { 
  createInformationField,
  encoderRegistry,
  receptorRegistry
} from '@/lib/info-field';

// 创建信息场
const field = createInformationField();

// 输入原始信息
const result = await field.processInput('猫是一种可爱的宠物，它喜欢抓老鼠');

console.log('编码产生的信息结构:');
for (const structure of result.structures) {
  console.log(`  ${structure.type}: ${structure.id}`);
}

console.log('感受器输出的信息:');
for (const output of result.outputs) {
  console.log(`  ${output.type}: ${output.source.substring(0, 30)}...`);
}

// 查看网络拓扑
const topology = field.getTopology();
console.log('编码器:', topology.encoders);
console.log('感受器:', topology.receptors.map(r => r.type));
```

## 核心 API

### 信息结构

```typescript
// 稀疏向量 - 用于检索
const sparse = new SparseVectorStructure(
  'id_1',
  '原始文本',
  [0, 5, 10],      // 非零位置
  [0.5, 1.2, 0.8], // 对应值
  100              // 总维度
);

// 计算相似度
sparse.cosineSimilarity(otherSparse);

// 稠密向量 - 用于语义计算
const dense = new DenseVectorStructure(
  'id_2',
  '原始文本',
  [0.1, -0.3, 0.5, ...]  // 向量值
);

// 向量运算
const sum = dense.add(otherDense);
const scaled = dense.scale(0.5);

// 注意力结构 - 用于关联
const attention = new AttentionStructure(
  'id_3',
  '查询文本',
  'query_id',
  ['key1', 'key2', 'key3'],
  [0.5, 0.3, 0.2]  // 注意力权重
);

// 获取最受关注的信息
attention.getTopAttended(); // { id: 'key1', weight: 0.5 }
```

### 编码器

```typescript
// 获取编码器
const tfidfEncoder = encoderRegistry.get('term-frequency');
const hashEncoder = encoderRegistry.get('hash');
const denseEncoder = encoderRegistry.get('random-projection');

// 编码信息
const sparse = await tfidfEncoder.encode('这是一段文本');
const hashVec = await hashEncoder.encode('这是一段文本');
const dense = await denseEncoder.encode('这是一段文本');

// 注意力编码需要上下文
const attention = await encoderRegistry.get('attention')?.encode('查询', {
  existingStructures: [sparse, dense]
});
```

### 感受器

```typescript
// 获取感受器
const receptors = receptorRegistry.getByAcceptedType('sparse-vector');

// 手动分发信息
const accepted = receptorRegistry.dispatch(sparseVector);
console.log(`被 ${accepted.length} 个感受器接收`);

// 处理
for (const receptor of accepted) {
  const output = await receptor.process();
  if (output) {
    console.log(`${receptor.type} 输出:`, output);
  }
}
```

## 文件结构

```
src/lib/info-field/
├── README.md         # 本文档
├── COMPARISON.md     # 架构对比
├── index.ts          # 统一导出
├── structures.ts     # 信息结构定义
├── encoders.ts       # 编码器实现
├── receptors.ts      # 感受器实现
└── field-v2.ts       # 信息场核心
```

## 核心洞察

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   LLM 为什么需要 Embedding、Attention 等变换？                   │
│                                                                 │
│   答案：为了让信息能被下一层接收和处理                           │
│                                                                 │
│   Token → Embedding → 让矩阵乘法能处理它                        │
│   Embedding → Attention → 让信息能相互关联                      │
│   Attention → FFN → 让信息能被非线性变换                        │
│   ...                                                           │
│                                                                 │
│   每一层变换 = 改变信息结构 = 适配下一层的输入                   │
│                                                                 │
│   在我们的系统中：                                               │
│   编码器 = 变换层（改变信息结构）                                │
│   感受器 = 处理层（接收特定结构的信息）                          │
│                                                                 │
│   变换的目的只有一个：让信息能被正确接收                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
