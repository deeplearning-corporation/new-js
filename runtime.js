/**
 * New.js Runtime - 运行时核心模块
 * 版本: 2.0.0
 * 作者: deeplearning-corporation
 * 描述: New.js 框架的运行时环境，提供模块加载、热重载、调试等功能
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const EventEmitter = require('events');

class NewRuntime extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // 运行时配置
        this.config = {
            rootDir: process.cwd(),
            modulesDir: path.join(process.cwd(), 'node_modules'),
            cacheDir: path.join(process.cwd(), '.runtime-cache'),
            watchEnabled: options.watch || false,
            debugEnabled: options.debug || false,
            hotReload: options.hotReload || false,
            moduleCache: true,
            sandboxEnabled: true,
            maxMemory: options.maxMemory || 512, // MB
            timeout: options.timeout || 30000, // 毫秒
            ...options
        };
        
        // 模块缓存
        this.modules = new Map();
        this.moduleCache = new Map();
        
        // 文件监听器
        this.watchers = new Map();
        
        // 运行时上下文
        this.context = this.createContext();
        
        // 已加载的 .njs 文件
        this.loadedFiles = new Set();
        
        // 性能统计
        this.stats = {
            modulesLoaded: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            startTime: Date.now()
        };
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化运行时
     */
    init() {
        // 创建缓存目录
        if (!fs.existsSync(this.config.cacheDir)) {
            fs.mkdirSync(this.config.cacheDir, { recursive: true });
        }
        
        // 加载环境变量
        this.loadEnv();
        
        // 设置全局对象
        this.setupGlobals();
        
        // 启动文件监听
        if (this.config.watchEnabled) {
            this.startWatching();
        }
        
        this.emit('ready', { runtime: this });
    }
    
    /**
     * 创建安全的执行上下文
     */
    createContext() {
        const context = {
            // Node.js 核心模块
            require: this.createRequire(),
            module: { exports: {} },
            exports: {},
            __filename: '',
            __dirname: '',
            
            // 全局对象
            console: this.createConsole(),
            process: process,
            Buffer: Buffer,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
            setImmediate: setImmediate,
            clearImmediate: clearImmediate,
            
            // New.js 扩展
            NewRuntime: this,
            __NEWJS_VERSION__: '2.0.0',
            __NEWJS_ENV__: process.env.NODE_ENV || 'development'
        };
        
        return context;
    }
    
    /**
     * 创建安全的 require 函数
     */
    createRequire() {
        const self = this;
        
        return function(moduleName) {
            return self.require(moduleName, this.__filename);
        }.bind(this);
    }
    
    /**
     * 创建安全的 console 对象
     */
    createConsole() {
        const self = this;
        
        return {
            log: (...args) => {
                if (self.config.debugEnabled) {
                    console.log(`[New.js]`, ...args);
                }
            },
            error: (...args) => {
                console.error(`[New.js Error]`, ...args);
                self.stats.errors++;
                self.emit('error', { args });
            },
            warn: (...args) => {
                console.warn(`[New.js Warning]`, ...args);
            },
            info: (...args) => {
                console.info(`[New.js Info]`, ...args);
            },
            debug: (...args) => {
                if (self.config.debugEnabled) {
                    console.debug(`[New.js Debug]`, ...args);
                }
            }
        };
    }
    
    /**
     * 加载环境变量
     */
    loadEnv() {
        const envPath = path.join(this.config.rootDir, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    const value = valueParts.join('=');
                    if (key && value) {
                        process.env[key.trim()] = value.trim();
                    }
                }
            }
        }
    }
    
    /**
     * 设置全局变量
     */
    setupGlobals() {
        // 添加全局辅助函数
        global.__newjs = {
            version: '2.0.0',
            runtime: this,
            debug: this.config.debugEnabled
        };
        
        // 添加全局日志函数
        if (this.config.debugEnabled) {
            global.d = (...args) => console.log('[DEBUG]', ...args);
        }
    }
    
    /**
     * 加载 .njs 文件
     */
    async loadFile(filePath, options = {}) {
        const absolutePath = path.resolve(this.config.rootDir, filePath);
        
        // 检查缓存
        if (this.config.moduleCache && this.moduleCache.has(absolutePath)) {
            this.stats.cacheHits++;
            return this.moduleCache.get(absolutePath);
        }
        
        this.stats.cacheMisses++;
        
        // 检查文件是否存在
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${absolutePath}`);
        }
        
        // 读取文件内容
        let code = fs.readFileSync(absolutePath, 'utf8');
        
        // 编译代码
        const compiledCode = this.compileCode(code, absolutePath);
        
        // 创建执行上下文
        const context = this.createContext();
        context.__filename = absolutePath;
        context.__dirname = path.dirname(absolutePath);
        
        // 执行代码
        let result;
        try {
            result = await this.executeCode(compiledCode, context, options);
        } catch (error) {
            this.emit('error', { file: absolutePath, error });
            throw error;
        }
        
        // 缓存结果
        if (this.config.moduleCache) {
            this.moduleCache.set(absolutePath, result);
        }
        
        this.loadedFiles.add(absolutePath);
        this.stats.modulesLoaded++;
        
        this.emit('loaded', { file: absolutePath, result });
        
        return result;
    }
    
    /**
     * 编译代码
     */
    compileCode(code, filename) {
        try {
            // 添加 Source Map 支持
            const sourceMap = this.generateSourceMap(code, filename);
            
            // 包装代码
            const wrappedCode = `
                (function(exports, require, module, __filename, __dirname) {
                    ${code}
                    return module.exports;
                })
            `;
            
            // 编译为可执行函数
            const compiled = vm.compileFunction(wrappedCode, [], {
                filename: filename,
                lineOffset: 0,
                columnOffset: 0
            });
            
            return {
                fn: compiled,
                sourceMap: sourceMap,
                filename: filename
            };
        } catch (error) {
            this.emit('compile-error', { filename, error });
            throw error;
        }
    }
    
    /**
     * 生成 Source Map
     */
    generateSourceMap(code, filename) {
        // 简单的 Source Map 生成
        const lines = code.split('\n');
        const mappings = [];
        
        for (let i = 0; i < lines.length; i++) {
            mappings.push({
                line: i + 1,
                column: 0,
                source: filename
            });
        }
        
        return {
            version: 3,
            file: filename,
            sources: [filename],
            mappings: mappings,
            sourcesContent: [code]
        };
    }
    
    /**
     * 执行编译后的代码
     */
    async executeCode(compiled, context, options = {}) {
        return new Promise((resolve, reject) => {
            // 设置超时
            const timeout = setTimeout(() => {
                reject(new Error(`Execution timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);
            
            try {
                // 创建沙箱上下文
                const sandbox = vm.createContext(context);
                
                // 执行代码
                const result = compiled.fn.call(
                    sandbox,
                    context.exports,
                    context.require,
                    context.module,
                    context.__filename,
                    context.__dirname
                );
                
                clearTimeout(timeout);
                resolve(result || context.module.exports);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }
    
    /**
     * 安全的 require 实现
     */
    require(moduleName, currentFile) {
        // 内置模块
        if (['fs', 'path', 'http', 'https', 'url', 'crypto', 'events', 'vm'].includes(moduleName)) {
            return require(moduleName);
        }
        
        // New.js 核心模块
        if (moduleName === 'newjs') {
            return require('./New.js');
        }
        
        // 相对路径模块
        if (moduleName.startsWith('.') && currentFile) {
            const basePath = path.dirname(currentFile);
            const modulePath = path.resolve(basePath, moduleName);
            
            // 尝试加载 .js 文件
            let jsPath = modulePath;
            if (!fs.existsSync(jsPath)) {
                jsPath = modulePath + '.js';
            }
            if (!fs.existsSync(jsPath)) {
                jsPath = path.join(modulePath, 'index.js');
            }
            
            if (fs.existsSync(jsPath)) {
                return this.loadSync(jsPath);
            }
            
            // 尝试加载 .njs 文件
            let njsPath = modulePath;
            if (!fs.existsSync(njsPath)) {
                njsPath = modulePath + '.njs';
            }
            if (!fs.existsSync(njsPath)) {
                njsPath = path.join(modulePath, 'index.njs');
            }
            
            if (fs.existsSync(njsPath)) {
                return this.loadSync(njsPath);
            }
        }
        
        // node_modules 模块
        const nodeModulePath = this.findNodeModule(moduleName);
        if (nodeModulePath) {
            return require(nodeModulePath);
        }
        
        throw new Error(`Cannot find module '${moduleName}'`);
    }
    
    /**
     * 同步加载模块
     */
    loadSync(filePath) {
        if (this.moduleCache.has(filePath)) {
            return this.moduleCache.get(filePath);
        }
        
        const code = fs.readFileSync(filePath, 'utf8');
        const compiled = this.compileCode(code, filePath);
        const context = this.createContext();
        context.__filename = filePath;
        context.__dirname = path.dirname(filePath);
        
        const result = compiled.fn.call(
            context,
            context.exports,
            context.require,
            context.module,
            context.__filename,
            context.__dirname
        );
        
        const exports = result || context.module.exports;
        this.moduleCache.set(filePath, exports);
        
        return exports;
    }
    
    /**
     * 查找 node_modules 模块
     */
    findNodeModule(moduleName) {
        let currentDir = this.config.rootDir;
        
        while (currentDir !== path.parse(currentDir).root) {
            const modulePath = path.join(currentDir, 'node_modules', moduleName);
            if (fs.existsSync(modulePath)) {
                const packagePath = path.join(modulePath, 'package.json');
                if (fs.existsSync(packagePath)) {
                    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    const mainFile = pkg.main || 'index.js';
                    return path.join(modulePath, mainFile);
                }
                return modulePath;
            }
            currentDir = path.dirname(currentDir);
        }
        
        return null;
    }
    
    /**
     * 启动文件监听（热重载）
     */
    startWatching() {
        if (!this.config.hotReload) return;
        
        const watchDirs = ['app', 'routes', 'controllers', 'models', 'middleware'];
        
        for (const dir of watchDirs) {
            const dirPath = path.join(this.config.rootDir, dir);
            if (fs.existsSync(dirPath)) {
                this.watchDirectory(dirPath);
            }
        }
        
        this.emit('watching-started', { directories: watchDirs });
    }
    
    /**
     * 监听目录
     */
    watchDirectory(dirPath) {
        const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.endsWith('.njs') || filename.endsWith('.js'))) {
                const filePath = path.join(dirPath, filename);
                this.handleFileChange(filePath);
            }
        });
        
        this.watchers.set(dirPath, watcher);
    }
    
    /**
     * 处理文件变更
     */
    async handleFileChange(filePath) {
        this.emit('file-changed', { file: filePath });
        
        // 清除缓存
        if (this.moduleCache.has(filePath)) {
            this.moduleCache.delete(filePath);
        }
        
        // 重新加载
        if (this.config.hotReload) {
            try {
                const module = await this.loadFile(filePath, { reload: true });
                this.emit('module-reloaded', { file: filePath, module });
            } catch (error) {
                this.emit('reload-error', { file: filePath, error });
            }
        }
    }
    
    /**
     * 停止文件监听
     */
    stopWatching() {
        for (const [dir, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();
        this.emit('watching-stopped');
    }
    
    /**
     * 获取性能统计
     */
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime,
            memoryUsage: process.memoryUsage(),
            cachedModules: this.moduleCache.size,
            loadedFiles: this.loadedFiles.size
        };
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.moduleCache.clear();
        this.stats.cacheHits = 0;
        this.stats.cacheMisses = 0;
        this.emit('cache-cleared');
    }
    
    /**
     * 预加载模块
     */
    async preload(modules) {
        const results = [];
        
        for (const module of modules) {
            try {
                const result = await this.loadFile(module);
                results.push({ module, success: true, result });
            } catch (error) {
                results.push({ module, success: false, error });
            }
        }
        
        return results;
    }
    
    /**
     * 执行代码片段
     */
    async eval(code, options = {}) {
        const filename = options.filename || '<eval>';
        const context = this.createContext();
        
        if (options.context) {
            Object.assign(context, options.context);
        }
        
        const compiled = this.compileCode(code, filename);
        const result = await this.executeCode(compiled, context, options);
        
        return result;
    }
    
    /**
     * 运行脚本文件
     */
    async runScript(filePath, options = {}) {
        const absolutePath = path.resolve(this.config.rootDir, filePath);
        
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Script not found: ${absolutePath}`);
        }
        
        const code = fs.readFileSync(absolutePath, 'utf8');
        const result = await this.eval(code, { ...options, filename: absolutePath });
        
        return result;
    }
    
    /**
     * 性能分析
     */
    async profile(fn, name = 'anonymous') {
        const start = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        
        try {
            const result = await fn();
            const end = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            const duration = Number(end - start) / 1e6; // 毫秒
            const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
            
            this.emit('profile', {
                name,
                duration,
                memoryUsed,
                result
            });
            
            return {
                result,
                stats: { duration, memoryUsed }
            };
        } catch (error) {
            this.emit('profile-error', { name, error });
            throw error;
        }
    }
    
    /**
     * 垃圾回收
     */
    gc() {
        if (global.gc) {
            global.gc();
            this.emit('gc', { timestamp: Date.now() });
            return true;
        }
        return false;
    }
    
    /**
     * 清理资源
     */
    async cleanup() {
        this.stopWatching();
        this.clearCache();
        this.emit('cleanup');
    }
    
    /**
     * 生成调试信息
     */
    getDebugInfo() {
        return {
            version: '2.0.0',
            config: this.config,
            stats: this.getStats(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                cwd: process.cwd(),
                env: process.env.NODE_ENV
            },
            modules: Array.from(this.moduleCache.keys()),
            watchers: Array.from(this.watchers.keys())
        };
    }
}

/**
 * 创建运行时实例
 */
function createRuntime(options = {}) {
    return new NewRuntime(options);
}

/**
 * 运行应用
 */
async function runApplication(entryFile, options = {}) {
    const runtime = createRuntime(options);
    
    try {
        const app = await runtime.loadFile(entryFile);
        
        if (app && typeof app.listen === 'function') {
            // 如果导出了 listen 方法，启动服务器
            const port = options.port || 3000;
            const host = options.host || 'localhost';
            
            app.listen(port, host, () => {
                console.log(`✨ New.js 应用已启动`);
                console.log(`🚀 服务地址: http://${host}:${port}`);
            });
        }
        
        return { runtime, app };
    } catch (error) {
        console.error('启动失败:', error);
        throw error;
    }
}

// 导出模块
module.exports = {
    NewRuntime,
    createRuntime,
    runApplication,
    version: '2.0.0'
};

// 如果直接运行
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'run' && args[1]) {
        runApplication(args[1], {
            watch: args.includes('--watch'),
            debug: args.includes('--debug')
        }).catch(console.error);
    } else {
        console.log(`
New.js Runtime v2.0.0
用法: node runtime.js run <入口文件> [选项]

选项:
  --watch    启用热重载
  --debug    启用调试模式
  --help     显示帮助信息

示例:
  node runtime.js run app/main.njs
  node runtime.js run app/main.njs --watch
  node runtime.js run app/main.njs --debug
        `);
    }
}