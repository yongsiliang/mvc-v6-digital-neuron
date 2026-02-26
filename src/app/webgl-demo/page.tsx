/**
 * ═══════════════════════════════════════════════════════════════════════
 * WebGL 神经引擎演示页面
 * ═══════════════════════════════════════════════════════════════════════
 */

import { WebGLEngineDemo } from '@/components/neural-engine/WebGLEngineDemo';

export default function WebGLEnginePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WebGL 神经引擎</h1>
        <p className="text-muted-foreground">
          在浏览器 GPU 上运行的真正神经网络计算引擎
        </p>
      </div>

      <WebGLEngineDemo />

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">工作原理</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>WebGL 后端</strong>: 使用浏览器的 WebGL API 在 GPU 上进行张量计算
          </li>
          <li>
            <strong>无需 CUDA</strong>: 任何现代浏览器都支持 WebGL，不需要 NVIDIA GPU
          </li>
          <li>
            <strong>自动降级</strong>: 如果 WebGL 不可用，自动降级到 WASM 或 CPU 后端
          </li>
          <li>
            <strong>真正神经网络</strong>: 使用 TensorFlow.js 进行真实的矩阵运算，不是软件模拟
          </li>
        </ul>
      </div>
    </div>
  );
}
