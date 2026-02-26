/**
 * 模块管理器
 * 
 * 核心功能：
 * - 模块加载、卸载、热替换
 * - 依赖解析
 * - 生命周期管理
 * - 状态迁移
 * - 事件广播
 */

import type {
  Module,
  ModuleId,
  ActiveModule,
  ModuleContext,
  ModuleState,
  ModuleInterface,
  Dependency,
  SemanticVersion,
  Logger,
  EventBus,
} from '../types/core';

import { DependencyGraph } from './dependency-graph';

// ═══════════════════════════════════════════════════════════════
// 加载/卸载/热替换结果类型
// ═══════════════════════════════════════════════════════════════

export interface LoadResult {
  success: boolean;
  module?: ActiveModule;
  error?: string;
  missing?: ModuleId[];
}

export interface UnloadResult {
  success: boolean;
  error?: string;
  dependents?: ModuleId[];
}

export interface HotReplaceResult {
  success: boolean;
  error?: string;
  migratedState?: boolean;
  breakingChanges?: string[];
}

export interface InvokeResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  duration: number;
}

export interface LoadOptions {
  skipDependencyCheck?: boolean;
  lazyLoad?: boolean;
}

export interface UnloadOptions {
  force?: boolean;
  cascade?: boolean;
  saveState?: boolean;
}

export interface HotReplaceOptions {
  forceInterfaceCheck?: boolean;
  migrateState?: boolean;
  notifyDependents?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// 事件类型
// ═══════════════════════════════════════════════════════════════

interface ModuleEvent {
  type: 'loaded' | 'unloaded' | 'replaced' | 'suspended' | 'resumed' | 'error';
  moduleId: ModuleId;
  timestamp: number;
  details?: Record<string, unknown>;
}

type ModuleEventHandler = (event: ModuleEvent) => void | Promise<void>;

// ═══════════════════════════════════════════════════════════════
// 模块管理器
// ═══════════════════════════════════════════════════════════════

export class ModuleManager {
  
  private modules: Map<ModuleId, ActiveModule> = new Map();
  private dependencyGraph: DependencyGraph = new DependencyGraph();
  private eventHandlers: Map<string, Set<ModuleEventHandler>> = new Map();
  private stateStore: Map<ModuleId, unknown> = new Map();
  
  private logger: Logger;
  private globalConfig: Record<string, unknown>;
  
  constructor(config: { logger: Logger; config?: Record<string, unknown> }) {
    this.logger = config.logger;
    this.globalConfig = config.config ?? {};
  }
  
  // ════════════════════════════════════════════════════════════
  // 模块加载
  // ════════════════════════════════════════════════════════════
  
  /**
   * 加载模块
   */
  async loadModule(
    module: Module,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    
    this.logger.info(`加载模块: ${module.id}@${this.versionString(module.version)}`);
    
    // 1. 检查是否已加载
    if (this.modules.has(module.id)) {
      return { success: false, error: '模块已加载' };
    }
    
    // 2. 验证模块完整性
    const validation = this.validateModule(module);
    if (!validation.valid) {
      return { success: false, error: `模块验证失败: ${validation.errors.join(', ')}` };
    }
    
    // 3. 解析依赖
    if (!options.skipDependencyCheck) {
      // 先添加到依赖图以进行解析
      this.dependencyGraph.addModule(module.id, module.version, module.dependencies);
      
      const resolution = this.dependencyGraph.resolve(module.id);
      
      if (!resolution.satisfied) {
        // 从依赖图移除
        this.dependencyGraph.removeModule(module.id);
        
        return { 
          success: false, 
          error: '依赖不满足',
          missing: resolution.missing.map(m => m.moduleId),
        };
      }
      
      // 检查版本冲突
      if (resolution.conflicts.length > 0) {
        this.dependencyGraph.removeModule(module.id);
        
        return {
          success: false,
          error: `版本冲突: ${resolution.conflicts.map(c => 
            `${c.moduleId} 需要 ${this.versionRangeString(c.required)}, 实际 ${this.versionString(c.actual)}`
          ).join('; ')}`,
        };
      }
    } else {
      // 跳过检查，仍需添加到依赖图
      this.dependencyGraph.addModule(module.id, module.version, module.dependencies);
    }
    
    // 4. 创建隔离上下文
    const context = this.createContext(module);
    
    // 5. 实例化模块
    let instance: unknown;
    try {
      instance = await this.instantiateModule(module, context);
    } catch (error) {
      this.dependencyGraph.removeModule(module.id);
      return { success: false, error: `实例化失败: ${error}` };
    }
    
    // 6. 创建活跃模块
    const activeModule: ActiveModule = {
      definition: module,
      state: {
        id: module.id,
        status: 'loading',
        version: module.version,
        loadedAt: Date.now(),
        lastActivity: Date.now(),
        metrics: {
          invocations: 0,
          errors: 0,
          avgLatency: 0,
          memoryUsage: 0,
        },
      },
      context,
      instance,
    };
    
    // 7. 执行加载钩子
    try {
      if (this.hasLifecycleHook(instance, 'onLoad')) {
        await (instance as { onLoad: (ctx: ModuleContext) => Promise<void> }).onLoad(context);
      }
    } catch (error) {
      this.dependencyGraph.removeModule(module.id);
      return { success: false, error: `加载钩子失败: ${error}` };
    }
    
    // 8. 注册到运行时
    this.modules.set(module.id, activeModule);
    activeModule.state.status = 'active';
    
    // 9. 连接事件
    this.connectModuleEvents(module);
    
    // 10. 通知依赖者
    await this.notifyDependentModules(module.id, 'loaded');
    
    // 11. 广播事件
    this.emitEvent({
      type: 'loaded',
      moduleId: module.id,
      timestamp: Date.now(),
      details: { version: module.version },
    });
    
    this.logger.info(`模块加载完成: ${module.id}`);
    
    return { success: true, module: activeModule };
  }
  
  // ════════════════════════════════════════════════════════════
  // 模块卸载
  // ════════════════════════════════════════════════════════════
  
  /**
   * 卸载模块
   */
  async unloadModule(
    moduleId: ModuleId,
    options: UnloadOptions = {}
  ): Promise<UnloadResult> {
    
    this.logger.info(`卸载模块: ${moduleId}`);
    
    const activeModule = this.modules.get(moduleId);
    if (!activeModule) {
      return { success: false, error: '模块不存在' };
    }
    
    // 1. 检查是否为核心模块
    if (activeModule.definition.type === 'core' && !options.force) {
      return { success: false, error: '核心模块不可卸载（使用 force 选项强制）' };
    }
    
    // 2. 检查依赖者
    const dependents = this.dependencyGraph.getDependents(moduleId);
    if (dependents.length > 0 && !options.cascade) {
      return {
        success: false,
        error: '存在依赖此模块的其他模块',
        dependents,
      };
    }
    
    // 3. 级联卸载
    if (options.cascade && dependents.length > 0) {
      for (const dependentId of dependents) {
        const result = await this.unloadModule(dependentId, { cascade: true, force: true });
        if (!result.success) {
          return result;
        }
      }
    }
    
    // 4. 保存状态
    if (options.saveState !== false) {
      try {
        const state = await this.saveModuleState(activeModule);
        if (state !== undefined) {
          this.stateStore.set(moduleId, state);
        }
      } catch (error) {
        this.logger.warn(`保存模块状态失败: ${error}`);
      }
    }
    
    // 5. 执行卸载钩子
    try {
      if (this.hasLifecycleHook(activeModule.instance, 'onUnload')) {
        await (activeModule.instance as { onUnload: () => Promise<void> }).onUnload();
      }
    } catch (error) {
      this.logger.error(`卸载钩子失败: ${error}`);
      // 继续卸载
    }
    
    // 6. 断开事件连接
    this.disconnectModuleEvents(activeModule.definition);
    
    // 7. 从运行时移除
    this.modules.delete(moduleId);
    activeModule.state.status = 'unloading';
    
    // 8. 更新依赖图
    this.dependencyGraph.removeModule(moduleId);
    
    // 9. 通知相关模块
    await this.notifyRelatedModules(moduleId, 'unloaded');
    
    // 10. 广播事件
    this.emitEvent({
      type: 'unloaded',
      moduleId,
      timestamp: Date.now(),
    });
    
    this.logger.info(`模块卸载完成: ${moduleId}`);
    
    return { success: true };
  }
  
  // ════════════════════════════════════════════════════════════
  // 热替换
  // ════════════════════════════════════════════════════════════
  
  /**
   * 热替换模块（无需重启）
   */
  async hotReplace(
    oldModuleId: ModuleId,
    newModule: Module,
    options: HotReplaceOptions = {}
  ): Promise<HotReplaceResult> {
    
    this.logger.info(`热替换模块: ${oldModuleId} → ${newModule.id}`);
    
    const oldActiveModule = this.modules.get(oldModuleId);
    if (!oldActiveModule) {
      return { success: false, error: '原模块不存在' };
    }
    
    // 1. 验证接口兼容性
    const compatibility = this.checkInterfaceCompatibility(
      oldActiveModule.definition.interface!,
      newModule.interface!
    );
    
    if (!compatibility.compatible && !options.forceInterfaceCheck) {
      return {
        success: false,
        error: '接口不兼容',
        breakingChanges: compatibility.breakingChanges,
      };
    }
    
    // 2. 保存旧状态
    let oldState: unknown;
    try {
      oldState = await this.saveModuleState(oldActiveModule);
    } catch (error) {
      this.logger.warn(`保存旧模块状态失败: ${error}`);
    }
    
    // 3. 迁移状态
    let newState = oldState;
    let migrated = false;
    
    if (options.migrateState !== false && oldState !== undefined) {
      try {
        newState = await this.migrateModuleState(
          newModule,
          oldActiveModule.definition.version,
          oldState
        );
        migrated = newState !== oldState;
      } catch (error) {
        this.logger.warn(`状态迁移失败: ${error}`);
        newState = oldState;
      }
    }
    
    // 4. 暂停旧模块
    if (this.hasLifecycleHook(oldActiveModule.instance, 'onSuspend')) {
      try {
        await (oldActiveModule.instance as { onSuspend: () => Promise<void> }).onSuspend();
      } catch (error) {
        this.logger.warn(`暂停钩子失败: ${error}`);
      }
    }
    
    // 5. 创建新上下文
    const context = this.createContext(newModule);
    
    // 6. 实例化新模块
    let newInstance: unknown;
    try {
      newInstance = await this.instantiateModule(newModule, context);
    } catch (error) {
      // 恢复旧模块
      if (this.hasLifecycleHook(oldActiveModule.instance, 'onResume')) {
        await (oldActiveModule.instance as { onResume: () => Promise<void> }).onResume();
      }
      return { success: false, error: `新模块实例化失败: ${error}` };
    }
    
    // 7. 执行新模块加载钩子
    try {
      if (this.hasLifecycleHook(newInstance, 'onLoad')) {
        await (newInstance as { onLoad: (ctx: ModuleContext) => Promise<void> }).onLoad(context);
      }
    } catch (error) {
      return { success: false, error: `新模块加载钩子失败: ${error}` };
    }
    
    // 8. 恢复状态
    if (newState !== undefined && this.hasLifecycleHook(newInstance, 'restoreState')) {
      try {
        await (newInstance as { restoreState: (state: unknown) => Promise<void> }).restoreState(newState);
      } catch (error) {
        this.logger.warn(`状态恢复失败: ${error}`);
      }
    }
    
    // 9. 原子替换
    const newActiveModule: ActiveModule = {
      definition: newModule,
      state: {
        id: newModule.id,
        status: 'active',
        version: newModule.version,
        loadedAt: Date.now(),
        lastActivity: Date.now(),
        metrics: { ...oldActiveModule.state.metrics },
        internalState: newState,
      },
      context,
      instance: newInstance,
    };
    
    this.modules.set(newModule.id, newActiveModule);
    
    if (oldModuleId !== newModule.id) {
      this.modules.delete(oldModuleId);
    }
    
    // 10. 更新依赖图
    this.dependencyGraph.replaceModule(
      oldModuleId,
      newModule.id,
      newModule.version,
      newModule.dependencies
    );
    
    // 11. 重新连接事件
    this.reconnectModuleEvents(newModule);
    
    // 12. 通知依赖者
    if (options.notifyDependents !== false) {
      await this.notifyDependentModules(newModule.id, 'replaced', {
        oldVersion: oldActiveModule.definition.version,
        newVersion: newModule.version,
      });
    }
    
    // 13. 广播事件
    this.emitEvent({
      type: 'replaced',
      moduleId: newModule.id,
      timestamp: Date.now(),
      details: {
        oldModuleId,
        oldVersion: oldActiveModule.definition.version,
        newVersion: newModule.version,
      },
    });
    
    this.logger.info(`热替换完成: ${oldModuleId} → ${newModule.id}`);
    
    return {
      success: true,
      migratedState: migrated,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 模块调用
  // ════════════════════════════════════════════════════════════
  
  /**
   * 调用模块端口
   */
  async invoke<P = unknown, R = unknown>(
    moduleId: ModuleId,
    port: string,
    payload: P
  ): Promise<InvokeResult<R>> {
    
    const activeModule = this.modules.get(moduleId);
    if (!activeModule) {
      return { success: false, error: `模块 ${moduleId} 不存在`, duration: 0 };
    }
    
    // 验证端口
    const moduleInterface = activeModule.definition.interface;
    if (!moduleInterface) {
      return { success: false, error: `模块 ${moduleId} 没有定义接口`, duration: 0 };
    }
    const inputPort = moduleInterface.inputs.find(i => i.name === port);
    if (!inputPort) {
      return { success: false, error: `模块 ${moduleId} 没有输入端口 ${port}`, duration: 0 };
    }
    
    // 验证输入
    if (inputPort.validation && !inputPort.validation(payload)) {
      return { success: false, error: '输入验证失败', duration: 0 };
    }
    
    // 转换输入
    const transformedPayload = inputPort.transform ? inputPort.transform(payload) : payload;
    
    // 执行
    const startTime = Date.now();
    
    try {
      const instance = activeModule.instance as Record<string, (p: unknown) => Promise<R>>;
      
      if (typeof instance[port] !== 'function') {
        return { success: false, error: `端口 ${port} 不是可调用函数`, duration: 0 };
      }
      
      const result = await instance[port](transformedPayload);
      
      const duration = Date.now() - startTime;
      
      // 更新指标
      activeModule.state.metrics.invocations++;
      activeModule.state.lastActivity = Date.now();
      this.updateLatencyMetric(activeModule, duration);
      
      return { success: true, result, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      activeModule.state.metrics.errors++;
      
      return {
        success: false,
        error: `执行错误: ${error}`,
        duration,
      };
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 事件系统
  // ════════════════════════════════════════════════════════════
  
  /**
   * 订阅模块事件
   */
  subscribe(event: string, handler: ModuleEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(handler);
    
    // 返回取消订阅函数
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }
  
  /**
   * 广播事件
   */
  private emitEvent(event: ModuleEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          this.logger.error(`事件处理器错误: ${error}`);
        }
      }
    }
    
    // 也广播到 '*' 处理器
    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      for (const handler of allHandlers) {
        try {
          handler(event);
        } catch (error) {
          this.logger.error(`事件处理器错误: ${error}`);
        }
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 查询接口
  // ════════════════════════════════════════════════════════════
  
  /**
   * 获取模块
   */
  getModule(moduleId: ModuleId): ActiveModule | undefined {
    return this.modules.get(moduleId);
  }
  
  /**
   * 获取所有模块
   */
  getAllModules(): ActiveModule[] {
    return Array.from(this.modules.values());
  }
  
  /**
   * 检查模块是否存在
   */
  hasModule(moduleId: ModuleId): boolean {
    return this.modules.has(moduleId);
  }
  
  /**
   * 获取模块状态
   */
  getModuleState(moduleId: ModuleId): ModuleState | undefined {
    return this.modules.get(moduleId)?.state;
  }
  
  /**
   * 获取依赖图快照
   */
  getDependencySnapshot(): ReturnType<DependencyGraph['getSnapshot']> {
    return this.dependencyGraph.getSnapshot();
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  /**
   * 验证模块
   */
  private validateModule(module: Module): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 检查必要字段
    if (!module.id) errors.push('缺少模块 ID');
    if (!module.type) errors.push('缺少模块类型');
    if (!module.interface) errors.push('缺少接口定义');
    if (!module.code) errors.push('缺少代码');
    
    // 检查接口完整性
    if (module.interface) {
      if (!Array.isArray(module.interface.inputs)) {
        errors.push('接口 inputs 必须是数组');
      }
      if (!Array.isArray(module.interface.outputs)) {
        errors.push('接口 outputs 必须是数组');
      }
    }
    
    // 检查进化配置
    if (module.evolution?.mutable && !module.evolution.testSuite) {
      errors.push('可进化模块必须提供测试套件');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * 检查接口兼容性
   */
  private checkInterfaceCompatibility(
    oldInterface: ModuleInterface,
    newInterface: ModuleInterface
  ): { compatible: boolean; breakingChanges: string[] } {
    
    const breakingChanges: string[] = [];
    
    // 检查输入端口
    for (const oldInput of oldInterface.inputs) {
      const newInput = newInterface.inputs.find(i => i.name === oldInput.name);
      
      if (!newInput) {
        breakingChanges.push(`输入端口 ${oldInput.name} 被移除`);
      } else {
        if (oldInput.required && !newInput.required) {
          // 这是向后兼容的
        } else if (!oldInput.required && newInput.required) {
          breakingChanges.push(`输入端口 ${oldInput.name} 变为必填`);
        }
        
        if (oldInput.type !== newInput.type) {
          breakingChanges.push(`输入端口 ${oldInput.name} 类型改变: ${oldInput.type} → ${newInput.type}`);
        }
      }
    }
    
    // 检查输出端口
    for (const oldOutput of oldInterface.outputs) {
      if (oldOutput.guaranteed) {
        const newOutput = newInterface.outputs.find(o => o.name === oldOutput.name);
        
        if (!newOutput) {
          breakingChanges.push(`保证的输出端口 ${oldOutput.name} 被移除`);
        } else if (!newOutput.guaranteed) {
          breakingChanges.push(`输出端口 ${oldOutput.name} 不再保证`);
        }
      }
    }
    
    return {
      compatible: breakingChanges.length === 0,
      breakingChanges,
    };
  }
  
  /**
   * 创建模块上下文
   */
  private createContext(module: Module): ModuleContext {
    const self = this;
    
    return {
      id: module.id,
      logger: this.createModuleLogger(module.id),
      eventBus: this.createModuleEventBus(module.id),
      config: { ...this.globalConfig, ...(module.interface?.config?.defaults || {}) },
      dependencies: new Map(),
    };
  }
  
  /**
   * 实例化模块
   */
  private async instantiateModule(
    module: Module,
    context: ModuleContext
  ): Promise<unknown> {
    
    // 动态执行代码
    // 注意：实际实现需要更安全的沙箱环境
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    
    const wrappedCode = `
      ${module.code}
      
      // 导出模块实例
      return typeof ${module.id} !== 'undefined' ? new ${module.id}(context) : module.exports;
    `;
    
    try {
      const factory = new AsyncFunction('context', wrappedCode);
      return await factory(context);
    } catch (error) {
      throw new Error(`实例化失败: ${error}`);
    }
  }
  
  /**
   * 检查生命周期钩子
   */
  private hasLifecycleHook(instance: unknown, hook: string): boolean {
    return instance !== null && 
           typeof instance === 'object' && 
           hook in instance && 
           typeof (instance as Record<string, unknown>)[hook] === 'function';
  }
  
  /**
   * 保存模块状态
   */
  private async saveModuleState(module: ActiveModule): Promise<unknown> {
    if (this.hasLifecycleHook(module.instance, 'saveState')) {
      return await (module.instance as { saveState: () => Promise<unknown> }).saveState();
    }
    return module.state.internalState;
  }
  
  /**
   * 迁移模块状态
   */
  private async migrateModuleState(
    module: Module,
    fromVersion: string | SemanticVersion,
    state: unknown
  ): Promise<unknown> {
    
    // 尝试调用迁移钩子
    if (this.hasLifecycleHook(module, 'migrateState')) {
      try {
        const instance = await this.instantiateModule(module, this.createContext(module));
        return await (instance as { 
          migrateState: (from: string, state: unknown) => Promise<unknown> 
        }).migrateState(this.versionString(fromVersion), state);
      } catch {
        // 迁移失败，返回原状态
        return state;
      }
    }
    
    return state;
  }
  
  /**
   * 连接模块事件
   */
  private connectModuleEvents(module: Module): void {
    // 连接模块定义的事件端口
    if (!module.interface?.events) return;
    for (const eventPort of module.interface.events) {
      if (eventPort.direction === 'subscribe' || eventPort.direction === 'both') {
        // 订阅逻辑
      }
    }
  }
  
  /**
   * 断开模块事件
   */
  private disconnectModuleEvents(module: Module): void {
    // 断开事件连接
  }
  
  /**
   * 重新连接模块事件
   */
  private reconnectModuleEvents(module: Module): void {
    this.disconnectModuleEvents(module);
    this.connectModuleEvents(module);
  }
  
  /**
   * 通知依赖模块
   */
  private async notifyDependentModules(
    moduleId: ModuleId,
    event: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    
    const dependents = this.dependencyGraph.getDependents(moduleId);
    
    for (const dependentId of dependents) {
      const dependentModule = this.modules.get(dependentId);
      if (dependentModule && this.hasLifecycleHook(dependentModule.instance, 'onDependencyChange')) {
        try {
          await (dependentModule.instance as { 
            onDependencyChange: (event: unknown) => Promise<void> 
          }).onDependencyChange({
            type: event,
            moduleId,
            details,
          });
        } catch (error) {
          this.logger.error(`通知依赖模块 ${dependentId} 失败: ${error}`);
        }
      }
    }
  }
  
  /**
   * 通知相关模块
   */
  private async notifyRelatedModules(
    moduleId: ModuleId,
    event: string
  ): Promise<void> {
    await this.notifyDependentModules(moduleId, event);
  }
  
  /**
   * 更新延迟指标
   */
  private updateLatencyMetric(module: ActiveModule, duration: number): void {
    const metrics = module.state.metrics;
    const count = metrics.invocations;
    metrics.avgLatency = (metrics.avgLatency * (count - 1) + duration) / count;
  }
  
  /**
   * 创建模块日志器
   */
  private createModuleLogger(moduleId: ModuleId): Logger {
    return {
      debug: (msg, ...args) => this.logger.debug(`[${moduleId}] ${msg}`, ...args),
      info: (msg, ...args) => this.logger.info(`[${moduleId}] ${msg}`, ...args),
      warn: (msg, ...args) => this.logger.warn(`[${moduleId}] ${msg}`, ...args),
      error: (msg, ...args) => this.logger.error(`[${moduleId}] ${msg}`, ...args),
    };
  }
  
  /**
   * 创建模块事件总线
   */
  private createModuleEventBus(moduleId: ModuleId): EventBus {
    return {
      subscribe: (event, handler) => {
        return this.subscribe(event, (e) => {
          if (e.moduleId !== moduleId) {
            handler(e);
          }
        });
      },
      emit: (event, payload) => {
        this.emitEvent({
          type: event as ModuleEvent['type'],
          moduleId,
          timestamp: Date.now(),
          details: payload as Record<string, unknown>,
        });
      },
    };
  }
  
  /**
   * 版本字符串
   */
  private versionString(v: string | SemanticVersion): string {
    if (typeof v === 'string') return v;
    let s = `${v.major}.${v.minor}.${v.patch}`;
    if (v.prerelease) s += `-${v.prerelease}`;
    return s;
  }
  
  /**
   * 版本范围字符串
   */
  private versionRangeString(r: { min?: SemanticVersion; max?: SemanticVersion }): string {
    const parts: string[] = [];
    if (r.min) parts.push(`>=${this.versionString(r.min)}`);
    if (r.max) parts.push(`<=${this.versionString(r.max)}`);
    return parts.join(' ') || '*';
  }
}
