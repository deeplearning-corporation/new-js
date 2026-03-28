@echo off
:: New.js 命令行工具 for Windows
:: 版本: 2.0.0
:: 作者: deeplearning-corporation

setlocal enabledelayedexpansion

:: 获取脚本所在目录
set "NEWJS_HOME=%~dp0"
set "NEWJS_HOME=%NEWJS_HOME:~0,-1%"

:: 颜色定义
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "MAGENTA=[35m"
set "CYAN=[36m"
set "WHITE=[37m"
set "RESET=[0m"

:: 显示彩色文本的函数
:color_echo
echo %~1%~2%RESET%
goto :eof

:: 显示帮助信息
:show_help
call :color_echo %CYAN% "╔═══════════════════════════════════════════════════════════╗"
call :color_echo %CYAN% "║                                                           ║"
call :color_echo %CYAN% "║   🚀 New.js CLI v2.0.0 - Windows 命令行工具               ║"
call :color_echo %CYAN% "║                                                           ║"
call :color_echo %CYAN% "║   用法: newjs <命令> [选项]                               ║"
call :color_echo %CYAN% "║                                                           ║"
call :color_echo %CYAN% "║   命令:                                                    ║"
call :color_echo %CYAN% "║     create <项目名>     创建新项目                          ║"
call :color_echo %CYAN% "║     run                 运行项目                           ║"
call :color_echo %CYAN% "║     build               构建项目                           ║"
call :color_echo %CYAN% "║     install             安装依赖                           ║"
call :color_echo %CYAN% "║     generate <类型>     生成文件                           ║"
call :color_echo %CYAN% "║     version             显示版本信息                        ║"
call :color_echo %CYAN% "║     help                显示帮助信息                        ║"
call :color_echo %CYAN% "║                                                           ║"
call :color_echo %CYAN% "║   示例:                                                    ║"
call :color_echo %CYAN% "║     newjs create myapp                                   ║"
call :color_echo %CYAN% "║     cd myapp && newjs install                            ║"
call :color_echo %CYAN% "║     newjs run                                            ║"
call :color_echo %CYAN% "║     newjs generate controller User                       ║"
call :color_echo %CYAN% "║                                                           ║"
call :color_echo %CYAN% "╚═══════════════════════════════════════════════════════════╝"
goto :eof

:: 显示版本信息
:show_version
call :color_echo %GREEN% "New.js CLI v2.0.0"
call :color_echo %GREEN% "Node.js 后端框架"
call :color_echo %GREEN% "Copyright (c) 2024 deeplearning-corporation"
goto :eof

:: 创建新项目
:create_project
set "PROJECT_NAME=%~1"
if "%PROJECT_NAME%"=="" (
    call :color_echo %RED% "❌ 请指定项目名称"
    call :color_echo %YELLOW% "用法: newjs create <项目名称>"
    exit /b 1
)

set "PROJECT_PATH=%CD%\%PROJECT_NAME%"
if exist "%PROJECT_PATH%" (
    call :color_echo %RED% "❌ 项目目录已存在: %PROJECT_PATH%"
    exit /b 1
)

call :color_echo %GREEN% "📁 正在创建项目: %PROJECT_NAME%"
mkdir "%PROJECT_PATH%" 2>nul

:: 创建目录结构
call :color_echo %BLUE% "  创建目录结构..."
mkdir "%PROJECT_PATH%\app" 2>nul
mkdir "%PROJECT_PATH%\routes" 2>nul
mkdir "%PROJECT_PATH%\views" 2>nul
mkdir "%PROJECT_PATH%\public" 2>nul
mkdir "%PROJECT_PATH%\middleware" 2>nul
mkdir "%PROJECT_PATH%\models" 2>nul
mkdir "%PROJECT_PATH%\controllers" 2>nul
mkdir "%PROJECT_PATH%\config" 2>nul
mkdir "%PROJECT_PATH%\data" 2>nul
mkdir "%PROJECT_PATH%\logs" 2>nul
mkdir "%PROJECT_PATH%\uploads" 2>nul

:: 创建 package.json
call :color_echo %BLUE% "  创建 package.json..."
(
echo {
echo   "name": "%PROJECT_NAME%",
echo   "version": "1.0.0",
echo   "description": "New.js 应用",
echo   "main": "app/main.njs",
echo   "scripts": {
echo     "start": "newjs run",
echo     "dev": "set NODE_ENV=development && newjs run",
echo     "build": "newjs build"
echo   },
echo   "dependencies": {
echo     "newjs": "^2.0.0",
echo     "sqlite3": "^5.1.0"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.0"
echo   }
echo }
) > "%PROJECT_PATH%\package.json"

:: 创建 main.njs
call :color_echo %BLUE% "  创建 app/main.njs..."
(
echo const New = require('newjs'^);
echo.
echo const app = new New({
echo   config: {
echo     port: 3000,
echo     host: 'localhost',
echo     env: process.env.NODE_ENV || 'development',
echo     staticDir: './public',
echo     viewsDir: './views'
echo   }
echo });
echo.
echo // 首页路由
echo app.get('/', (req, res^) => {
echo   res.render('index.html', {
echo     title: 'New.js 应用',
echo     message: '欢迎使用 New.js 框架'
echo   });
echo });
echo.
echo // API示例
echo app.get('/api/hello', (req, res^) => {
echo   res.json({
echo     message: 'Hello from New.js!',
echo     timestamp: Date.now()
echo   });
echo });
echo.
echo // 静态文件
echo app.static('./public');
echo app.static('./uploads');
echo.
echo // 视图引擎
echo app.view('html');
echo.
echo // 启动应用
echo if (require.main === module^) {
echo   app.listen(3000, 'localhost', (^) => {
echo     console.log('✨ New.js 应用已启动');
echo     console.log('🚀 访问: http://localhost:3000');
echo   });
echo }
echo.
echo module.exports = app;
) > "%PROJECT_PATH%\app\main.njs"

:: 创建 index.html
call :color_echo %BLUE% "  创建 views/index.html..."
(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>{{title}} - New.js^</title^>
echo     ^<style^>
echo         body {
echo             font-family: Arial, sans-serif;
echo             text-align: center;
echo             padding: 50px;
echo             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%%^);
echo             min-height: 100vh;
echo             margin: 0;
echo             display: flex;
echo             align-items: center;
echo             justify-content: center;
echo         }
echo         .container {
echo             background: white;
echo             border-radius: 20px;
echo             padding: 40px;
echo             box-shadow: 0 20px 60px rgba(0,0,0,0.3^);
echo         }
echo         h1 { color: #667eea; }
echo         .message { color: #666; margin: 20px 0; }
echo         .btn {
echo             display: inline-block;
echo             padding: 10px 20px;
echo             background: #667eea;
echo             color: white;
echo             text-decoration: none;
echo             border-radius: 5px;
echo             margin-top: 20px;
echo         }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<h1^>🚀 {{title}}^</h1^>
echo         ^<div class="message"^>{{message}}^</div^>
echo         ^<a href="/api/hello" class="btn"^>测试API^</a^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > "%PROJECT_PATH%\views\index.html"

:: 创建 .gitignore
call :color_echo %BLUE% "  创建 .gitignore..."
(
echo node_modules/
echo data/*.db
echo logs/*.log
echo uploads/*
echo .env
echo .DS_Store
echo *.log
) > "%PROJECT_PATH%\.gitignore"

:: 创建 README.md
call :color_echo %BLUE% "  创建 README.md..."
(
echo # %PROJECT_NAME%
echo.
echo New.js 应用项目
echo.
echo ## 安装依赖
echo.
echo ```bash
echo npm install
echo ```
echo.
echo ## 运行项目
echo.
echo ```bash
echo npm start
echo # 或
echo newjs run
echo ```
echo.
echo ## 开发模式
echo.
echo ```bash
echo npm run dev
echo ```
echo.
echo ## 项目结构
echo.
echo ```
echo .
echo ├── app/           # 应用代码
echo ├── routes/        # 路由文件
echo ├── controllers/   # 控制器
echo ├── models/        # 数据模型
echo ├── views/         # 视图模板
echo ├── public/        # 静态文件
echo ├── middleware/    # 中间件
echo ├── config/        # 配置文件
echo ├── data/          # 数据文件
echo ├── logs/          # 日志文件
echo └── uploads/       # 上传文件
echo ```
echo.
echo ## 更多信息
echo.
echo 访问 https://github.com/deeplearning-corporation/node-js 获取文档
) > "%PROJECT_PATH%\README.md"

call :color_echo %GREEN% "✅ 项目创建成功！"
call :color_echo %GREEN% "📁 项目路径: %PROJECT_PATH%"
echo.
call :color_echo %YELLOW% "下一步:"
call :color_echo %YELLOW% "  cd %PROJECT_NAME%"
call :color_echo %YELLOW% "  newjs install     # 安装依赖"
call :color_echo %YELLOW% "  newjs run         # 运行项目"
goto :eof

:: 运行项目
:run_project
call :color_echo %GREEN% "🚀 启动 New.js 应用..."

if not exist "app\main.njs" (
    call :color_echo %RED% "❌ 未找到 app/main.njs 文件"
    call :color_echo %YELLOW% "请确保在项目根目录运行此命令"
    exit /b 1
)

if not exist "node_modules" (
    call :color_echo %YELLOW% "📦 未检测到依赖，正在安装..."
    call :install_deps
)

node app\main.njs
goto :eof

:: 安装依赖
:install_deps
call :color_echo %BLUE% "📦 正在安装依赖..."

if exist "package.json" (
    call npm install
    if !errorlevel! equ 0 (
        call :color_echo %GREEN% "✅ 依赖安装完成"
    ) else (
        call :color_echo %RED% "❌ 依赖安装失败"
    )
) else (
    call :color_echo %RED% "❌ 未找到 package.json 文件"
)
goto :eof

:: 构建项目
:build_project
call :color_echo %BLUE% "🔨 构建项目..."

set "BUILD_DIR=%CD%\dist"
if exist "%BUILD_DIR%" rd /s /q "%BUILD_DIR%" 2>nul
mkdir "%BUILD_DIR%" 2>nul

:: 复制文件
call :color_echo %BLUE% "  复制文件..."
xcopy /E /I "app" "%BUILD_DIR%\app" >nul 2>&1
xcopy /E /I "views" "%BUILD_DIR%\views" >nul 2>&1
xcopy /E /I "public" "%BUILD_DIR%\public" >nul 2>&1
xcopy /E /I "config" "%BUILD_DIR%\config" >nul 2>&1
if exist "New.js" copy "New.js" "%BUILD_DIR%\" >nul 2>&1

:: 生成 package.json
call :color_echo %BLUE% "  生成 package.json..."
findstr /v "devDependencies" package.json > "%BUILD_DIR%\package.json"

call :color_echo %GREEN% "✅ 构建完成！"
call :color_echo %GREEN% "📁 输出目录: %BUILD_DIR%"
goto :eof

:: 生成文件
:generate_file
set "TYPE=%~1"
set "NAME=%~2"

if "%TYPE%"=="" (
    call :color_echo %RED% "❌ 请指定生成类型"
    call :color_echo %YELLOW% "支持的类型: controller, model, view"
    exit /b 1
)

if "%NAME%"=="" (
    call :color_echo %RED% "❌ 请指定名称"
    exit /b 1
)

if "%TYPE%"=="controller" (
    call :generate_controller "%NAME%"
) else if "%TYPE%"=="model" (
    call :generate_model "%NAME%"
) else if "%TYPE%"=="view" (
    call :generate_view "%NAME%"
) else (
    call :color_echo %RED% "❌ 不支持的类型: %TYPE%"
    call :color_echo %YELLOW% "支持的类型: controller, model, view"
)
goto :eof

:generate_controller
set "CONTROLLER_NAME=%~1"
set "CONTROLLER_FILE=%CD%\controllers\%CONTROLLER_NAME%.js"

if exist "%CONTROLLER_FILE%" (
    call :color_echo %RED% "❌ 文件已存在: %CONTROLLER_FILE%"
    exit /b 1
)

(
echo class %CONTROLLER_NAME%Controller {
echo   async index(req, res^) {
echo     res.json({ message: '%CONTROLLER_NAME% controller index' });
echo   }
echo   
echo   async show(req, res^) {
echo     const { id } = req.params;
echo     res.json({ id, message: 'Show %CONTROLLER_NAME%' });
echo   }
echo   
echo   async create(req, res^) {
echo     const data = req.body;
echo     res.json({ data, message: 'Create %CONTROLLER_NAME%' });
echo   }
echo   
echo   async update(req, res^) {
echo     const { id } = req.params;
echo     const data = req.body;
echo     res.json({ id, data, message: 'Update %CONTROLLER_NAME%' });
echo   }
echo   
echo   async delete(req, res^) {
echo     const { id } = req.params;
echo     res.json({ id, message: 'Delete %CONTROLLER_NAME%' });
echo   }
echo }
echo.
echo module.exports = new %CONTROLLER_NAME%Controller();
) > "%CONTROLLER_FILE%"

call :color_echo %GREEN% "✅ 创建控制器: %CONTROLLER_FILE%"
goto :eof

:generate_model
set "MODEL_NAME=%~1"
set "MODEL_FILE=%CD%\models\%MODEL_NAME%.js"

if exist "%MODEL_FILE%" (
    call :color_echo %RED% "❌ 文件已存在: %MODEL_FILE%"
    exit /b 1
)

(
echo class %MODEL_NAME% {
echo   constructor(db^) {
echo     this.db = db;
echo     this.table = '%MODEL_NAME%s';
echo   }
echo   
echo   async findAll(^) {
echo     return await this.db.query(`SELECT * FROM ${this.table}`);
echo   }
echo   
echo   async findById(id^) {
echo     return await this.db.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
echo   }
echo   
echo   async create(data^) {
echo     const fields = Object.keys(data);
echo     const placeholders = fields.map((^) => '?').join(',');
echo     const values = fields.map(field => data[field]);
echo     const sql = `INSERT INTO ${this.table} (${fields.join(',')}) VALUES (${placeholders})`;
echo     const result = await this.db.execute(sql, values);
echo     return result.lastID;
echo   }
echo   
echo   async update(id, data^) {
echo     const setClause = Object.keys(data).map(key => `${key} = ?`).join(',');
echo     const values = [...Object.values(data), id];
echo     const sql = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
echo     return await this.db.execute(sql, values);
echo   }
echo   
echo   async delete(id^) {
echo     const sql = `DELETE FROM ${this.table} WHERE id = ?`;
echo     return await this.db.execute(sql, [id]);
echo   }
echo }
echo.
echo module.exports = %MODEL_NAME%;
) > "%MODEL_FILE%"

call :color_echo %GREEN% "✅ 创建模型: %MODEL_FILE%"
goto :eof

:generate_view
set "VIEW_NAME=%~1"
set "VIEW_FILE=%CD%\views\%VIEW_NAME%.html"

if exist "%VIEW_FILE%" (
    call :color_echo %RED% "❌ 文件已存在: %VIEW_FILE%"
    exit /b 1
)

(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>{{title}} - %VIEW_NAME%^</title^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>{{title}}^</h1^>
echo     ^<div class="content"^>
echo         ^<!-- 页面内容 --^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > "%VIEW_FILE%"

call :color_echo %GREEN% "✅ 创建视图: %VIEW_FILE%"
goto :eof

:: 主程序
if "%~1"=="" (
    call :show_help
    exit /b 0
)

set "COMMAND=%~1"
set "ARG=%~2"

if "%COMMAND%"=="create" (
    call :create_project "%ARG%"
) else if "%COMMAND%"=="run" (
    call :run_project
) else if "%COMMAND%"=="build" (
    call :build_project
) else if "%COMMAND%"=="install" (
    call :install_deps
) else if "%COMMAND%"=="generate" (
    call :generate_file "%ARG%" "%~3"
) else if "%COMMAND%"=="version" (
    call :show_version
) else if "%COMMAND%"=="help" (
    call :show_help
) else (
    call :color_echo %RED% "❌ 未知命令: %COMMAND%"
    call :show_help
)

exit /b 0