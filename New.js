#!/usr/bin/env node
// New-cmd.js - New.js 命令行工具

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const readline = require('readline');

const version = '2.0.0';
const commands = {
  create: createProject,
  run: runProject,
  build: buildProject,
  generate: generateFile,
  install: installDeps,
  help: showHelp,
  version: showVersion
};

// 显示帮助信息
function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 New.js CLI v${version} - 命令行工具                    ║
║                                                           ║
║   用法: new-cmd <命令> [选项]                              ║
║                                                           ║
║   命令:                                                    ║
║     create <项目名>     创建新项目                          ║
║     run                 运行项目                           ║
║     build               构建项目                           ║
║     generate <类型>     生成文件（controller/model/view）  ║
║     install             安装依赖                           ║
║     help                显示帮助信息                        ║
║     version             显示版本信息                        ║
║                                                           ║
║   示例:                                                    ║
║     new-cmd create myapp                                  ║
║     cd myapp && new-cmd run                               ║
║     new-cmd generate controller User                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

// 显示版本
function showVersion() {
  console.log(`New.js CLI v${version}`);
}

// 创建新项目
async function createProject(projectName) {
  if (!projectName) {
    console.error('❌ 请指定项目名称');
    console.log('用法: new-cmd create <项目名称>');
    return;
  }
  
  const projectPath = path.join(process.cwd(), projectName);
  
  if (fs.existsSync(projectPath)) {
    console.error(`❌ 项目目录已存在: ${projectPath}`);
    return;
  }
  
  console.log(`📁 正在创建项目: ${projectName}`);
  fs.mkdirSync(projectPath);
  
  // 创建项目结构
  const dirs = [
    'app', 'routes', 'views', 'public', 'middleware', 
    'models', 'controllers', 'config', 'data', 'logs', 'uploads'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(projectPath, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✅ 创建目录: ${dir}`);
  });
  
  // 创建 package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'New.js 应用',
    main: 'app/main.njs',
    scripts: {
      start: 'new-cmd run',
      dev: 'NODE_ENV=development new-cmd run',
      build: 'new-cmd build'
    },
    dependencies: {
      'sqlite3': '^5.1.0',
      'bcrypt': '^5.1.0',
      'jsonwebtoken': '^9.0.0'
    },
    devDependencies: {
      'nodemon': '^3.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log('  ✅ 创建 package.json');
  
  // 创建 main.njs
  const mainContent = `// app/main.njs - 应用入口
const New = require('../New.js');

const app = new New({
  config: {
    port: 3000,
    host: 'localhost',
    env: process.env.NODE_ENV || 'development',
    staticDir: './public',
    viewsDir: './views'
  }
});

// 首页路由
app.get('/', async (req, res) => {
  res.render('index.html', {
    title: 'New.js 应用',
    message: '欢迎使用 New.js 框架'
  });
});

// API示例
app.get('/api/hello', async (req, res) => {
  res.json({
    message: 'Hello from New.js!',
    timestamp: Date.now()
  });
});

// 静态文件
app.static('./public');
app.static('./uploads');

// 视图引擎
app.view('html');

// 启动应用
if (require.main === module) {
  app.listen(3000, 'localhost', () => {
    console.log('✨ New.js 应用已启动');
    console.log('🚀 访问: http://localhost:3000');
  });
}

module.exports = app;
`;
  
  fs.writeFileSync(path.join(projectPath, 'app', 'main.njs'), mainContent);
  console.log('  ✅ 创建 app/main.njs');
  
  // 创建 index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - New.js</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; }
        .message { color: #666; margin: 20px 0; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 {{title}}</h1>
        <div class="message">{{message}}</div>
        <a href="/api/hello" class="btn">测试API</a>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(projectPath, 'views', 'index.html'), indexHtml);
  console.log('  ✅ 创建 views/index.html');
  
  // 创建 .gitignore
  const gitignore = `node_modules/
data/*.db
logs/*.log
uploads/*
.env
.DS_Store
*.log`;
  
  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);
  console.log('  ✅ 创建 .gitignore');
  
  // 创建 README.md
  const readme = `# ${projectName}

New.js 应用项目

## 安装依赖

\`\`\`bash
npm install
\`\`\`

## 运行项目

\`\`\`bash
npm start
# 或
new-cmd run
\`\`\`

## 开发模式

\`\`\`bash
npm run dev
\`\`\`

## 项目结构

\`\`\`
.
├── app/           # 应用代码
├── routes/        # 路由文件
├── controllers/   # 控制器
├── models/        # 数据模型
├── views/         # 视图模板
├── public/        # 静态文件
├── middleware/    # 中间件
├── config/        # 配置文件
├── data/          # 数据文件
├── logs/          # 日志文件
└── uploads/       # 上传文件
\`\`\`

## 更多信息

访问 https://newjs.dev 获取文档
`;
  
  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
  console.log('  ✅ 创建 README.md');
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✨ 项目创建成功！                                        ║
║                                                           ║
║   📁 项目路径: ${projectPath}                               ║
║                                                           ║
║   下一步:                                                  ║
║     cd ${projectName}                                     ║
║     new-cmd install     # 安装依赖                        ║
║     new-cmd run         # 运行项目                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

// 运行项目
function runProject() {
  console.log('🚀 启动 New.js 应用...');
  
  const mainFile = path.join(process.cwd(), 'app', 'main.njs');
  
  if (!fs.existsSync(mainFile)) {
    console.error('❌ 未找到 app/main.njs 文件');
    console.log('请确保在项目根目录运行此命令');
    return;
  }
  
  const env = process.env.NODE_ENV || 'development';
  console.log(`🌍 环境: ${env}`);
  
  // 检查 node_modules
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('📦 未检测到依赖，正在安装...');
    installDeps();
  }
  
  // 运行应用
  const child = spawn('node', [mainFile], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: env }
  });
  
  child.on('error', (err) => {
    console.error('运行失败:', err);
  });
  
  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit();
  });
}

// 构建项目
function buildProject() {
  console.log('🔨 构建项目...');
  
  const buildDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }
  
  // 复制文件
  const filesToCopy = ['app', 'views', 'public', 'config', 'New.js'];
  filesToCopy.forEach(file => {
    const src = path.join(process.cwd(), file);
    const dest = path.join(buildDir, file);
    
    if (fs.existsSync(src)) {
      copyRecursive(src, dest);
      console.log(`  ✅ 复制: ${file}`);
    }
  });
  
  // 生成 package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  delete packageJson.devDependencies;
  fs.writeFileSync(path.join(buildDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  console.log('✅ 构建完成！');
  console.log(`📁 输出目录: ${buildDir}`);
}

// 生成文件
function generateFile(type, name) {
  const templates = {
    controller: `// controllers/${name}.js
class ${name}Controller {
  async index(req, res) {
    res.json({ message: '${name} controller index' });
  }
  
  async show(req, res) {
    const { id } = req.params;
    res.json({ id, message: 'Show ${name}' });
  }
  
  async create(req, res) {
    const data = req.body;
    res.json({ data, message: 'Create ${name}' });
  }
  
  async update(req, res) {
    const { id } = req.params;
    const data = req.body;
    res.json({ id, data, message: 'Update ${name}' });
  }
  
  async delete(req, res) {
    const { id } = req.params;
    res.json({ id, message: 'Delete ${name}' });
  }
}

module.exports = new ${name}Controller();`,
    
    model: `// models/${name}.js
class ${name} {
  constructor(db) {
    this.db = db;
    this.table = '${name.toLowerCase()}s';
  }
  
  async findAll() {
    return await this.db.query(\`SELECT * FROM \${this.table}\`);
  }
  
  async findById(id) {
    return await this.db.query(\`SELECT * FROM \${this.table} WHERE id = ?\`, [id]);
  }
  
  async create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(',');
    const values = fields.map(field => data[field]);
    
    const sql = \`INSERT INTO \${this.table} (\${fields.join(',')}) VALUES (\${placeholders})\`;
    const result = await this.db.execute(sql, values);
    return result.lastID;
  }
  
  async update(id, data) {
    const setClause = Object.keys(data).map(key => \`\${key} = ?\`).join(',');
    const values = [...Object.values(data), id];
    
    const sql = \`UPDATE \${this.table} SET \${setClause} WHERE id = ?\`;
    return await this.db.execute(sql, values);
  }
  
  async delete(id) {
    const sql = \`DELETE FROM \${this.table} WHERE id = ?\`;
    return await this.db.execute(sql, [id]);
  }
}

module.exports = ${name};`,
    
    view: `<!-- views/${name}.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - ${name}</title>
</head>
<body>
    <h1>{{title}}</h1>
    <div class="content">
        <!-- 页面内容 -->
    </div>
</body>
</html>`
  };
  
  const template = templates[type];
  if (!template) {
    console.error(`❌ 不支持的类型: ${type}`);
    console.log('支持的类型: controller, model, view');
    return;
  }
  
  const fileName = type === 'view' ? `${name}.html` : `${name}.${type === 'controller' ? 'js' : 'js'}`;
  const filePath = path.join(process.cwd(), type === 'controller' ? 'controllers' : type === 'model' ? 'models' : 'views', fileName);
  
  if (fs.existsSync(filePath)) {
    console.error(`❌ 文件已存在: ${filePath}`);
    return;
  }
  
  fs.writeFileSync(filePath, template);
  console.log(`✅ 创建文件: ${filePath}`);
}

// 安装依赖
function installDeps() {
  console.log('📦 正在安装依赖...');
  
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['install'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 依赖安装完成');
    } else {
      console.error('❌ 依赖安装失败');
    }
  });
}

// 辅助函数：递归复制
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const arg = args[1];
  
  if (commands[command]) {
    commands[command](arg);
  } else {
    showHelp();
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = commands;