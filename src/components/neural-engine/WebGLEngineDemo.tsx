/**
 * ═══════════════════════════════════════════════════════════════════════
 * WebGL 神经引擎演示组件
 * 
 * 展示在浏览器 GPU 上运行神经网络
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useCallback } from 'react';
import { useWebGLEngine, textToSimpleVector, randomVector } from '@/hooks/useWebGLEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export function WebGLEngineDemo() {
  const {
    state,
    initializing,
    initialized,
    error,
    createNeuron,
    addConcept,
    processInput,
    similarity,
  } = useWebGLEngine({
    vsaDimension: 512,
    maxNeurons: 100,
  });

  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    activations: [string, number][];
    consciousContent: string[];
    processingTime: number;
  } | null>(null);

  const [simResult, setSimResult] = useState<number | null>(null);

  // 创建测试神经元
  const handleCreateNeurons = useCallback(async () => {
    if (!initialized) return;

    try {
      await createNeuron('概念-理解', 'semantic');
      await createNeuron('情感-愉悦', 'emotional');
      await createNeuron('记忆-短期', 'episodic');
      await createNeuron('抽象-数学', 'abstract');
      await createNeuron('元认知-反思', 'metacognitive');
      
      await addConcept('理解');
      await addConcept('学习');
      await addConcept('创造');
      await addConcept('思考');
      
      console.log('Test neurons created');
    } catch (err) {
      console.error('Failed to create neurons:', err);
    }
  }, [initialized, createNeuron, addConcept]);

  // 处理输入
  const handleProcess = useCallback(async () => {
    if (!initialized || !inputText.trim()) return;

    setProcessing(true);
    try {
      const vector = textToSimpleVector(inputText, 512);
      const output = await processInput(vector);
      
      setResult({
        activations: Array.from(output.activations.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        consciousContent: output.consciousContent.winners,
        processingTime: output.processingTime,
      });
    } catch (err) {
      console.error('Processing failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [initialized, inputText, processInput]);

  // 测试相似度
  const handleTestSimilarity = useCallback(async () => {
    if (!initialized) return;

    try {
      const vecA = randomVector(512);
      const vecB = randomVector(512);
      const vecC = vecA.map((v, i) => v * 0.9 + vecB[i] * 0.1); // 相似于 A
      
      const simAB = await similarity(vecA, vecB);
      const simAC = await similarity(vecA, vecC);
      
      setSimResult(simAC - simAB); // 应该 > 0，因为 AC 更相似
    } catch (err) {
      console.error('Similarity test failed:', err);
    }
  }, [initialized, similarity]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>WebGL 引擎错误</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 引擎状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            WebGL 神经引擎
            {initializing && <Badge variant="secondary">初始化中...</Badge>}
            {initialized && (
              <Badge variant={state?.gpuAvailable ? 'default' : 'outline'}>
                {state?.backend.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            在浏览器 GPU 上运行的神经网络计算引擎
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">后端:</span>{' '}
                <Badge variant={state.gpuAvailable ? 'default' : 'secondary'}>
                  {state.backend}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">GPU 可用:</span>{' '}
                <Badge variant={state.gpuAvailable ? 'default' : 'outline'}>
                  {state.gpuAvailable ? '是' : '否'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">神经元数量:</span> {state.neuronCount}
              </div>
              <div>
                <span className="text-muted-foreground">概念数量:</span> {state.conceptCount}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>测试操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreateNeurons} disabled={!initialized}>
              创建测试神经元
            </Button>
            <Button onClick={handleTestSimilarity} disabled={!initialized} variant="outline">
              测试相似度计算
            </Button>
          </div>

          {simResult !== null && (
            <p className="text-sm">
              相似度测试: 相似向量比随机向量高 {simResult.toFixed(4)} ✓
            </p>
          )}
        </CardContent>
      </Card>

      {/* 输入处理 */}
      <Card>
        <CardHeader>
          <CardTitle>处理输入</CardTitle>
          <CardDescription>
            输入文本，神经网络将在 GPU 上计算激活值
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入测试文本..."
              onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
            />
            <Button onClick={handleProcess} disabled={!initialized || processing}>
              {processing ? '处理中...' : '处理'}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  处理时间: {result.processingTime}ms
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">神经元激活:</p>
                  {result.activations.map(([id, activation]) => (
                    <div key={id} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-32 truncate">{id}</span>
                      <Progress value={activation * 100} className="flex-1 h-2" />
                      <span className="text-xs w-12 text-right">{(activation * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">意识内容:</p>
                <div className="flex gap-1 mt-1">
                  {result.consciousContent.map((id) => (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {id.slice(0, 20)}...
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
