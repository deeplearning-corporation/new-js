/**
 * New.js Runtime - .nsj 文件运行时
 * 版本: 2.0.0
 * 支持 .nsj 文件格式
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

class NSJRuntime {
    constructor(options = {}) {
        this.config = {
            rootDir: process.cwd(),
            watch: options.watch || false,
            debug: options.debug || false,
            port: options.port || 3000,
            host: options.host || 'localhost',
            entry: options.entry || 'app/main.nsj',
            ...options
        };
        
        this.modules = new Map();
        this.watchers = new Map();
    }
    
    /**
     * 加载 .nsj 文件
     */
    async loadNSJ(filePath) {
        const absolutePath = path.resolve(this.config.rootDir, filePath);
        
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`❌ 文件不存在: ${absolutePath}`);
        }
        
        // 读取 .nsj 文件
        let code = fs.readFileSync(absolutePath, 'utf8');
        
        // 编译 .nsj 代码
        const compiled = this.compileNSJ(code, absolutePath);
        
        // 创建执行上下文
        const context = this.createContext(absolutePath);
        
        // 执行代码
        const result = await this.execute(compiled, context);
        
        return result;
    }
    
    /**
     * 编译 .nsj 代码
     */
    compileNSJ(code, filename) {
        // .nsj 文件语法增强
        let processedCode = code;
        
        // 支持 import 语法
        processedCode = processedCode.replace(
            /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
            (match, imports, module) => {
                return `const {${imports}} = require('${module}');`;
            }
        );
        
        // 支持 export default
        processedCode = processedCode.replace(
            /export\s+default\s+([^;]+);?/g,
            (match, exportValue) => {
                return `module.exports = ${exportValue};`;
            }
        );
        
        // 支持 export const/function
        processedCode = processedCode.replace(
            /export\s+(const|function|class)\s+(\w+)/g,
            (match, type, name) => {
                return `${type} ${name}`;
            }
        );
        
        // 包装代码
        const wrappedCode = `
            (function(exports, require, module, __filename, __dirname, __nsj) {
                ${processedCode}
                return module.exports;
            })
        `;
        
        return vm.compileFunction(wrappedCode, [], {
            filename: filename,
            lineOffset: 0,
            columnOffset: 0
        });
    }
    
    /**
     * 创建执行上下文
     */
    createContext(filename) {
        const context = {
            // Node.js 核心
            require: (module) => this.require(module, filename),
            module: { exports: {} },
            exports: {},
            __filename: filename,
            __dirname: path.dirname(filename),
            
            // .nsj 特有对象
            __nsj: {
                version: '2.0.0',
                runtime: this,
                config: this.config
            },
            
            // 全局对象
            console: console,
            process: process,
            Buffer: Buffer,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
            
            // New.js 辅助函数
            __render: this.renderTemplate.bind(this),
            __fetch: this.fetchData.bind(this),
            __query: this.queryDatabase.bind(this)
        };
        
        return context;
    }
    
    /**
     * 执行编译后的代码
     */
    async execute(compiled, context) {
        const sandbox = vm.createContext(context);
        
        try {
            const result = compiled.call(
                sandbox,
                context.exports,
                context.require,
                context.module,
                context.__filename,
                context.__dirname,
                context.__nsj
            );
            
            return result || context.module.exports;
        } catch (error) {
            console.error('执行错误:', error);
            throw error;
        }
    }
    
    /**
     * 安全的 require
     */
    require(moduleName, currentFile) {
        // 内置模块
        if (['fs', 'path', 'http', 'https', 'url', 'crypto'].includes(moduleName)) {
            return require(moduleName);
        }
        
        // New.js 核心
        if (moduleName === 'newjs') {
            return require('./New.js');
        }
        
        // 相对路径 .nsj 文件
        if (moduleName.startsWith('.') && currentFile) {
            const basePath = path.dirname(currentFile);
            let modulePath = path.resolve(basePath, moduleName);
            
            // 尝试 .nsj 扩展名
            if (!fs.existsSync(modulePath)) {
                modulePath = modulePath + '.nsj';
            }
            if (!fs.existsSync(modulePath)) {
                modulePath = path.join(modulePath, 'index.nsj');
            }
            
            if (fs.existsSync(modulePath)) {
                return this.loadSync(modulePath);
            }
        }
        
        // node_modules
        const nodePath = this.findNodeModule(moduleName);
        if (nodePath) {
            return require(nodePath);
        }
        
        throw new Error(`找不到模块: ${moduleName}`);
    }
    
    /**
     * 同步加载 .nsj
     */
    loadSync(filePath) {
        if (this.modules.has(filePath)) {
            return this.modules.get(filePath);
        }
        
        const code = fs.readFileSync(filePath, 'utf8');
        const compiled = this.compileNSJ(code, filePath);
        const context = this.createContext(filePath);
        
        const sandbox = vm.createContext(context);
        const result = compiled.call(
            sandbox,
            context.exports,
            context.require,
            context.module,
            context.__filename,
            context.__dirname,
            context.__nsj
        );
        
        const exports = result || context.module.exports;
        this.modules.set(filePath, exports);
        
        return exports;
    }
    
    /**
     * 模板渲染
     */
    renderTemplate(template, data) {
        let html = template;
        
        // 简单的模板语法 {{ variable }}
        html = html.replace(/{{(.*?)}}/g, (match, key) => {
            const value = data[key.trim()];
            return value !== undefined ? value : '';
        });
        
        // 条件渲染 {% if condition %}
        html = html.replace(/{% if (.*?) %}(.*?){% endif %}/gs, (match, condition, content) => {
            try {
                const result = eval(`(${condition})`);
                return result ? content : '';
            } catch {
                return '';
            }
        });
        
        // 循环渲染 {% for item in items %}
        html = html.replace(/{% for (.*?) in (.*?) %}(.*?){% endfor %}/gs, (match, item, array, content) => {
            const items = data[array];
            if (!items || !Array.isArray(items)) return '';
            
            return items.map(itemData => {
                return content.replace(new RegExp(`{{${item}\\.(.*?)}}`, 'g'), (m, key) => {
                    return itemData[key] || '';
                });
            }).join('');
        });
        
        return html;
    }
    
    /**
     * 数据获取
     */
    async fetchData(url, options = {}) {
        const http = url.startsWith('https') ? require('https') : require('http');
        
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(data);
                    }
                });
            });
            
            req.on('error', reject);
            req.end();
        });
    }
    
    /**
     * 数据库查询
     */
    async queryDatabase(sql, params = []) {
        // 简单的 SQLite 支持
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.join(this.config.rootDir, 'data', 'app.db');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
            
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                db.all(sql, params, (err, rows) => {
                    db.close();
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                db.run(sql, params, function(err) {
                    db.close();
                    if (err) reject(err);
                    else resolve({ changes: this.changes, lastID: this.lastID });
                });
            }
        });
    }
    
    /**
     * 查找 node_modules
     */
    findNodeModule(moduleName) {
        let currentDir = this.config.rootDir;
        
        while (currentDir !== path.parse(currentDir).root) {
            const modulePath = path.join(currentDir, 'node_modules', moduleName);
            if (fs.existsSync(modulePath)) {
                const pkgPath = path.join(modulePath, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    const main = pkg.main || 'index.js';
                    return path.join(modulePath, main);
                }
                return modulePath;
            }
            currentDir = path.dirname(currentDir);
        }
        
        return null;
    }
    
    /**
     * 启动应用
     */
    async start() {
        console.log('🚀 New.js Runtime v2.0.0');
        console.log(`📁 工作目录: ${this.config.rootDir}`);
        console.log(`📄 入口文件: ${this.config.entry}`);
        
        try {
            const app = await this.loadNSJ(this.config.entry);
            
            if (app && typeof app.listen === 'function') {
                app.listen(this.config.port, this.config.host, () => {
                    console.log(`✨ 应用已启动`);
                    console.log(`🌐 访问: http://${this.config.host}:${this.config.port}`);
                });
            } else {
                console.log('✅ .nsj 文件加载成功');
                return app;
            }
        } catch (error) {
            console.error('❌ 启动失败:', error.message);
            throw error;
        }
    }
    
    /**
     * 停止应用
     */
    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

// 创建运行时实例
function createRuntime(options = {}) {
    return new NSJRuntime(options);
}

// 运行应用
async function runNSJ(entry, options = {}) {
    const runtime = createRuntime({
        entry: entry,
        ...options
    });
    
    return await runtime.start();
}

module.exports = {
    NSJRuntime,
    createRuntime,
    runNSJ
};

// 命令行直接运行
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'run' && args[1]) {
        runNSJ(args[1], {
            watch: args.includes('--watch'),
            debug: args.includes('--debug'),
            port: parseInt(process.env.PORT || 3000)
        }).catch(console.error);
    } else {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 New.js Runtime v2.0.0 - .nsj 文件运行时              ║
║                                                           ║
║   用法: node runtime.js run <入口.nsj> [选项]              ║
║                                                           ║
║   选项:                                                   ║
║     --watch    启用热重载                                  ║
║     --debug    启用调试模式                                ║
║                                                           ║
║   示例:                                                   ║
║     node runtime.js run app/main.nsj                     ║
║     node runtime.js run app/main.nsj --watch             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
    }
}
