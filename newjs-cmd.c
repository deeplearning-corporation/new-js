/*
 * newjs-cmd.c - New.js 命令行工具 (Windows C语言版本)
 * 版本: 2.0.0
 * 作者: deeplearning-corporation
 * 编译: gcc -o newjs-cmd.exe newjs-cmd.c -ladvapi32
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <windows.h>
#include <direct.h>
#include <io.h>
#include <time.h>
#include <process.h>

// 颜色定义 (Windows API)
#define CONSOLE_RED 12
#define CONSOLE_GREEN 10
#define CONSOLE_YELLOW 14
#define CONSOLE_BLUE 11
#define CONSOLE_CYAN 11
#define CONSOLE_WHITE 15
#define CONSOLE_DEFAULT 7

// Windows 控制台颜色
void set_console_color(int color) {
    HANDLE hConsole = GetStdHandle(STD_OUTPUT_HANDLE);
    SetConsoleTextAttribute(hConsole, color);
}

void reset_console_color() {
    HANDLE hConsole = GetStdHandle(STD_OUTPUT_HANDLE);
    SetConsoleTextAttribute(hConsole, CONSOLE_DEFAULT);
}

void print_error(const char* msg) {
    set_console_color(CONSOLE_RED);
    printf("[ERROR] %s\n", msg);
    reset_console_color();
}

void print_success(const char* msg) {
    set_console_color(CONSOLE_GREEN);
    printf("[SUCCESS] %s\n", msg);
    reset_console_color();
}

void print_info(const char* msg) {
    set_console_color(CONSOLE_YELLOW);
    printf("[INFO] %s\n", msg);
    reset_console_color();
}

void print_step(const char* msg) {
    set_console_color(CONSOLE_BLUE);
    printf("%s\n", msg);
    reset_console_color();
}

void print_warning(const char* msg) {
    set_console_color(CONSOLE_YELLOW);
    printf("[WARNING] %s\n", msg);
    reset_console_color();
}

// 检查目录是否存在 (Windows API)
int directory_exists(const char* path) {
    DWORD attrs = GetFileAttributesA(path);
    return (attrs != INVALID_FILE_ATTRIBUTES && (attrs & FILE_ATTRIBUTE_DIRECTORY));
}

// 检查文件是否存在
int file_exists(const char* path) {
    DWORD attrs = GetFileAttributesA(path);
    return (attrs != INVALID_FILE_ATTRIBUTES && !(attrs & FILE_ATTRIBUTE_DIRECTORY));
}

// 创建目录
int create_directory(const char* path) {
    return CreateDirectoryA(path, NULL) || GetLastError() == ERROR_ALREADY_EXISTS;
}

// 写入文件
int write_file(const char* path, const char* content) {
    FILE* fp = fopen(path, "w");
    if (!fp) return 0;
    fprintf(fp, "%s", content);
    fclose(fp);
    return 1;
}

// 读取文件
char* read_file(const char* path) {
    FILE* fp = fopen(path, "rb");
    if (!fp) return NULL;
    
    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    
    char* content = (char*)malloc(size + 1);
    if (!content) {
        fclose(fp);
        return NULL;
    }
    
    fread(content, 1, size, fp);
    content[size] = '\0';
    fclose(fp);
    
    return content;
}

// 执行命令
int execute_command(const char* cmd) {
    return system(cmd);
}

// 复制文件
int copy_file(const char* src, const char* dest) {
    return CopyFileA(src, dest, FALSE);
}

// 递归复制目录
int copy_directory(const char* src, const char* dest) {
    char cmd[512];
    sprintf(cmd, "xcopy /E /I /Y \"%s\" \"%s\" >nul 2>&1", src, dest);
    return system(cmd) == 0;
}

// 删除目录
int delete_directory(const char* path) {
    char cmd[512];
    sprintf(cmd, "rd /s /q \"%s\" 2>nul", path);
    return system(cmd) == 0;
}

// 显示帮助信息
void show_help() {
    set_console_color(CONSOLE_CYAN);
    printf("╔═══════════════════════════════════════════════════════════════╗\n");
    printf("║                                                               ║\n");
    printf("║   New.js CLI v2.0.0 - Windows C语言命令行工具              ║\n");
    printf("║                                                               ║\n");
    printf("║   用法: newjs-cmd <命令> [选项]                               ║\n");
    printf("║                                                               ║\n");
    printf("║   命令:                                                        ║\n");
    printf("║     create <项目名>     创建新项目                              ║\n");
    printf("║     run                 运行项目                               ║\n");
    printf("║     build               构建项目                               ║\n");
    printf("║     install             安装依赖                               ║\n");
    printf("║     generate <类型>     生成文件 (controller/model/view)       ║\n");
    printf("║     version             显示版本信息                            ║\n");
    printf("║     help                显示帮助信息                            ║\n");
    printf("║                                                               ║\n");
    printf("║   示例:                                                        ║\n");
    printf("║     newjs-cmd create myapp                                    ║\n");
    printf("║     cd myapp && newjs-cmd install                             ║\n");
    printf("║     newjs-cmd run                                             ║\n");
    printf("║     newjs-cmd generate controller User                        ║\n");
    printf("║                                                               ║\n");
    printf("╚═══════════════════════════════════════════════════════════════╝\n");
    reset_console_color();
}

// 显示版本
void show_version() {
    set_console_color(CONSOLE_GREEN);
    printf("New.js CLI v2.0.0 (Windows C语言版本)\n");
    printf("Node.js 后端框架命令行工具\n");
    printf("Copyright (c) 2024 deeplearning-corporation\n");
    printf("编译时间: %s %s\n", __DATE__, __TIME__);
    reset_console_color();
}

// 创建项目
int create_project(const char* project_name) {
    if (!project_name || strlen(project_name) == 0) {
        print_error("请指定项目名称");
        printf("用法: newjs-cmd create <项目名称>\n");
        return 1;
    }
    
    char project_path[1024];
    _getcwd(project_path, sizeof(project_path));
    strcat(project_path, "\\");
    strcat(project_path, project_name);
    
    if (directory_exists(project_path)) {
        print_error("项目目录已存在");
        return 1;
    }
    
    print_success("正在创建项目...");
    printf("项目名称: %s\n", project_name);
    printf("项目路径: %s\n", project_path);
    
    // 创建项目目录
    create_directory(project_path);
    print_step("创建项目目录");
    
    // 创建子目录
    char dir_path[1024];
    const char* dirs[] = {
        "app", "routes", "views", "public", "middleware",
        "models", "controllers", "config", "data", "logs", "uploads"
    };
    
    for (int i = 0; i < 11; i++) {
        sprintf(dir_path, "%s\\%s", project_path, dirs[i]);
        create_directory(dir_path);
        printf("  ? 创建目录: %s\n", dirs[i]);
    }
    
    // 创建 package.json
    char package_json[8192];
    sprintf(package_json,
        "{\n"
        "  \"name\": \"%s\",\n"
        "  \"version\": \"1.0.0\",\n"
        "  \"description\": \"New.js 应用\",\n"
        "  \"main\": \"app/main.njs\",\n"
        "  \"scripts\": {\n"
        "    \"start\": \"newjs-cmd run\",\n"
        "    \"dev\": \"set NODE_ENV=development && newjs-cmd run\",\n"
        "    \"build\": \"newjs-cmd build\"\n"
        "  },\n"
        "  \"dependencies\": {\n"
        "    \"newjs\": \"^2.0.0\",\n"
        "    \"sqlite3\": \"^5.1.0\"\n"
        "  },\n"
        "  \"devDependencies\": {\n"
        "    \"nodemon\": \"^3.0.0\"\n"
        "  }\n"
        "}\n",
        project_name);
    
    sprintf(dir_path, "%s\\package.json", project_path);
    write_file(dir_path, package_json);
    print_step("创建 package.json");
    
    // 创建 main.njs
    sprintf(dir_path, "%s\\app\\main.njs", project_path);
    const char* main_content = 
        "const New = require('newjs');\n\n"
        "const app = new New({\n"
        "  config: {\n"
        "    port: 3000,\n"
        "    host: 'localhost',\n"
        "    env: process.env.NODE_ENV || 'development',\n"
        "    staticDir: './public',\n"
        "    viewsDir: './views'\n"
        "  }\n"
        "});\n\n"
        "// 首页路由\n"
        "app.get('/', (req, res) => {\n"
        "  res.render('index.html', {\n"
        "    title: 'New.js 应用',\n"
        "    message: '欢迎使用 New.js 框架'\n"
        "  });\n"
        "});\n\n"
        "// API示例\n"
        "app.get('/api/hello', (req, res) => {\n"
        "  res.json({\n"
        "    message: 'Hello from New.js!',\n"
        "    timestamp: Date.now()\n"
        "  });\n"
        "});\n\n"
        "// 静态文件\n"
        "app.static('./public');\n"
        "app.static('./uploads');\n\n"
        "// 视图引擎\n"
        "app.view('html');\n\n"
        "// 启动应用\n"
        "if (require.main === module) {\n"
        "  app.listen(3000, 'localhost', () => {\n"
        "    console.log('? New.js 应用已启动');\n"
        "    console.log('?? 访问: http://localhost:3000');\n"
        "  });\n"
        "}\n\n"
        "module.exports = app;\n";
    
    write_file(dir_path, main_content);
    print_step("创建 app/main.njs");
    
    // 创建 index.html
    sprintf(dir_path, "%s\\views\\index.html", project_path);
    const char* index_html = 
        "<!DOCTYPE html>\n"
        "<html lang=\"zh-CN\">\n"
        "<head>\n"
        "    <meta charset=\"UTF-8\">\n"
        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        "    <title>{{title}} - New.js</title>\n"
        "    <style>\n"
        "        body {\n"
        "            font-family: Arial, sans-serif;\n"
        "            text-align: center;\n"
        "            padding: 50px;\n"
        "            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n"
        "            min-height: 100vh;\n"
        "            margin: 0;\n"
        "            display: flex;\n"
        "            align-items: center;\n"
        "            justify-content: center;\n"
        "        }\n"
        "        .container {\n"
        "            background: white;\n"
        "            border-radius: 20px;\n"
        "            padding: 40px;\n"
        "            box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n"
        "        }\n"
        "        h1 { color: #667eea; }\n"
        "        .message { color: #666; margin: 20px 0; }\n"
        "        .btn {\n"
        "            display: inline-block;\n"
        "            padding: 10px 20px;\n"
        "            background: #667eea;\n"
        "            color: white;\n"
        "            text-decoration: none;\n"
        "            border-radius: 5px;\n"
        "            margin-top: 20px;\n"
        "        }\n"
        "    </style>\n"
        "</head>\n"
        "<body>\n"
        "    <div class=\"container\">\n"
        "        <h1>?? {{title}}</h1>\n"
        "        <div class=\"message\">{{message}}</div>\n"
        "        <a href=\"/api/hello\" class=\"btn\">测试API</a>\n"
        "    </div>\n"
        "</body>\n"
        "</html>\n";
    
    write_file(dir_path, index_html);
    print_step("创建 views/index.html");
    
    // 创建 .gitignore
    sprintf(dir_path, "%s\\.gitignore", project_path);
    const char* gitignore = 
        "node_modules/\n"
        "data/*.db\n"
        "logs/*.log\n"
        "uploads/*\n"
        ".env\n"
        ".DS_Store\n"
        "*.log\n"
        "dist/\n";
    
    write_file(dir_path, gitignore);
    print_step("创建 .gitignore");
    
    // 创建 README.md
    sprintf(dir_path, "%s\\README.md", project_path);
    char readme[4096];
    sprintf(readme,
        "# %s\n\n"
        "New.js 应用项目\n\n"
        "## 安装依赖\n\n"
        "```bash\n"
        "npm install\n"
        "```\n\n"
        "## 运行项目\n\n"
        "```bash\n"
        "npm start\n"
        "# 或\n"
        "newjs-cmd run\n"
        "```\n\n"
        "## 开发模式\n\n"
        "```bash\n"
        "npm run dev\n"
        "```\n\n"
        "## 项目结构\n\n"
        "```\n"
        ".\n"
        "├── app/           # 应用代码\n"
        "├── routes/        # 路由文件\n"
        "├── controllers/   # 控制器\n"
        "├── models/        # 数据模型\n"
        "├── views/         # 视图模板\n"
        "├── public/        # 静态文件\n"
        "├── middleware/    # 中间件\n"
        "├── config/        # 配置文件\n"
        "├── data/          # 数据文件\n"
        "├── logs/          # 日志文件\n"
        "└── uploads/       # 上传文件\n"
        "```\n\n"
        "## 更多信息\n\n"
        "访问 https://github.com/deeplearning-corporation/node-js 获取文档\n",
        project_name);
    
    write_file(dir_path, readme);
    print_step("创建 README.md");
    
    set_console_color(CONSOLE_GREEN);
    printf("\n╔═══════════════════════════════════════════════════════════════╗\n");
    printf("║                                                               ║\n");
    printf("║   ? 项目创建成功！                                            ║\n");
    printf("║                                                               ║\n");
    printf("║   ?? 项目路径: %s\n", project_path);
    printf("║                                                               ║\n");
    printf("║   下一步:                                                      ║\n");
    printf("║     cd %s                                                    ║\n", project_name);
    printf("║     newjs-cmd install     # 安装依赖                            ║\n");
    printf("║     newjs-cmd run         # 运行项目                            ║\n");
    printf("║                                                               ║\n");
    printf("╚═══════════════════════════════════════════════════════════════╝\n");
    reset_console_color();
    
    return 0;
}

// 运行项目
int run_project() {
    print_success("启动 New.js 应用...");
    
    if (!file_exists("app\\main.njs")) {
        print_error("未找到 app/main.njs 文件");
        print_info("请确保在项目根目录运行此命令");
        return 1;
    }
    
    // 检查依赖
    if (!directory_exists("node_modules")) {
        print_warning("未检测到依赖，正在安装...");
        execute_command("npm install");
    }
    
    // 运行应用
    print_success("启动服务器...");
    printf("\n");
    return execute_command("node app\\main.njs");
}

// 安装依赖
int install_deps() {
    print_info("正在安装依赖...");
    
    if (!file_exists("package.json")) {
        print_error("未找到 package.json 文件");
        return 1;
    }
    
    int result = execute_command("npm install");
    
    if (result == 0) {
        print_success("依赖安装完成");
    } else {
        print_error("依赖安装失败");
    }
    
    return result;
}

// 构建项目
int build_project() {
    print_info("构建项目...");
    
    // 创建 dist 目录
    if (!directory_exists("dist")) {
        create_directory("dist");
    } else {
        delete_directory("dist");
        create_directory("dist");
    }
    
    // 复制文件
    print_step("复制应用文件...");
    if (directory_exists("app")) {
        copy_directory("app", "dist\\app");
        printf("    ? 复制 app/\n");
    }
    
    if (directory_exists("views")) {
        copy_directory("views", "dist\\views");
        printf("    ? 复制 views/\n");
    }
    
    if (directory_exists("public")) {
        copy_directory("public", "dist\\public");
        printf("    ? 复制 public/\n");
    }
    
    if (directory_exists("config")) {
        copy_directory("config", "dist\\config");
        printf("    ? 复制 config/\n");
    }
    
    // 复制 New.js 核心文件
    if (file_exists("New.js")) {
        copy_file("New.js", "dist\\New.js");
        printf("    ? 复制 New.js\n");
    }
    
    // 生成 package.json
    print_step("生成 package.json...");
    char* package_content = read_file("package.json");
    if (package_content) {
        // 简单处理：移除 devDependencies
        char* dev_start = strstr(package_content, "\"devDependencies\"");
        if (dev_start) {
            char* dev_end = strstr(dev_start, "},");
            if (dev_end) {
                char* new_content = (char*)malloc(strlen(package_content) + 1);
                int pos = dev_start - package_content;
                strncpy(new_content, package_content, pos);
                strcpy(new_content + pos, dev_end + 2);
                write_file("dist\\package.json", new_content);
                free(new_content);
            } else {
                write_file("dist\\package.json", package_content);
            }
        } else {
            write_file("dist\\package.json", package_content);
        }
        free(package_content);
        printf("    ? 生成 package.json\n");
    }
    
    print_success("构建完成！");
    printf("?? 输出目录: %s\\dist\n", _getcwd(NULL, 0));
    return 0;
}

// 生成控制器
int generate_controller(const char* name) {
    char file_path[1024];
    sprintf(file_path, "controllers\\%s.js", name);
    
    if (file_exists(file_path)) {
        print_error("文件已存在");
        return 1;
    }
    
    char content[4096];
    sprintf(content,
        "class %sController {\n"
        "  async index(req, res) {\n"
        "    res.json({ message: '%s controller index' });\n"
        "  }\n"
        "  \n"
        "  async show(req, res) {\n"
        "    const { id } = req.params;\n"
        "    res.json({ id, message: 'Show %s' });\n"
        "  }\n"
        "  \n"
        "  async create(req, res) {\n"
        "    const data = req.body;\n"
        "    res.json({ data, message: 'Create %s' });\n"
        "  }\n"
        "  \n"
        "  async update(req, res) {\n"
        "    const { id } = req.params;\n"
        "    const data = req.body;\n"
        "    res.json({ id, data, message: 'Update %s' });\n"
        "  }\n"
        "  \n"
        "  async delete(req, res) {\n"
        "    const { id } = req.params;\n"
        "    res.json({ id, message: 'Delete %s' });\n"
        "  }\n"
        "}\n\n"
        "module.exports = new %sController();\n",
        name, name, name, name, name, name, name);
    
    write_file(file_path, content);
    print_success("创建控制器");
    printf("?? 文件: %s\n", file_path);
    return 0;
}

// 生成模型
int generate_model(const char* name) {
    char file_path[1024];
    sprintf(file_path, "models\\%s.js", name);
    
    if (file_exists(file_path)) {
        print_error("文件已存在");
        return 1;
    }
    
    char content[2048];
    sprintf(content,
        "class %s {\n"
        "  constructor(db) {\n"
        "    this.db = db;\n"
        "    this.table = '%ss';\n"
        "  }\n"
        "  \n"
        "  async findAll() {\n"
        "    return await this.db.query(`SELECT * FROM ${this.table}`);\n"
        "  }\n"
        "  \n"
        "  async findById(id) {\n"
        "    return await this.db.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);\n"
        "  }\n"
        "  \n"
        "  async create(data) {\n"
        "    const fields = Object.keys(data);\n"
        "    const placeholders = fields.map(() => '?').join(',');\n"
        "    const values = fields.map(field => data[field]);\n"
        "    const sql = `INSERT INTO ${this.table} (${fields.join(',')}) VALUES (${placeholders})`;\n"
        "    const result = await this.db.execute(sql, values);\n"
        "    return result.lastID;\n"
        "  }\n"
        "  \n"
        "  async update(id, data) {\n"
        "    const setClause = Object.keys(data).map(key => `${key} = ?`).join(',');\n"
        "    const values = [...Object.values(data), id];\n"
        "    const sql = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;\n"
        "    return await this.db.execute(sql, values);\n"
        "  }\n"
        "  \n"
        "  async delete(id) {\n"
        "    const sql = `DELETE FROM ${this.table} WHERE id = ?`;\n"
        "    return await this.db.execute(sql, [id]);\n"
        "  }\n"
        "}\n\n"
        "module.exports = %s;\n",
        name, name, name);
    
    write_file(file_path, content);
    print_success("创建模型");
    printf("?? 文件: %s\n", file_path);
    return 0;
}

// 生成视图
int generate_view(const char* name) {
    char file_path[1024];
    sprintf(file_path, "views\\%s.html", name);
    
    if (file_exists(file_path)) {
        print_error("文件已存在");
        return 1;
    }
    
    char content[1024];
    sprintf(content,
        "<!DOCTYPE html>\n"
        "<html lang=\"zh-CN\">\n"
        "<head>\n"
        "    <meta charset=\"UTF-8\">\n"
        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        "    <title>{{title}} - %s</title>\n"
        "</head>\n"
        "<body>\n"
        "    <h1>{{title}}</h1>\n"
        "    <div class=\"content\">\n"
        "        <!-- 页面内容 -->\n"
        "    </div>\n"
        "</body>\n"
        "</html>\n", name);
    
    write_file(file_path, content);
    print_success("创建视图");
    printf("?? 文件: %s\n", file_path);
    return 0;
}

// 生成文件
int generate_file(const char* type, const char* name) {
    if (!type || strlen(type) == 0) {
        print_error("请指定生成类型");
        print_info("支持的类型: controller, model, view");
        return 1;
    }
    
    if (!name || strlen(name) == 0) {
        print_error("请指定名称");
        return 1;
    }
    
    if (strcmp(type, "controller") == 0) {
        return generate_controller(name);
    } else if (strcmp(type, "model") == 0) {
        return generate_model(name);
    } else if (strcmp(type, "view") == 0) {
        return generate_view(name);
    } else {
        print_error("不支持的类型");
        printf("支持的类型: controller, model, view\n");
        return 1;
    }
}

// 主函数
int main(int argc, char* argv[]) {
    // 设置控制台为 UTF-8
    SetConsoleOutputCP(65001);
    
    if (argc < 2) {
        show_help();
        return 0;
    }
    
    if (strcmp(argv[1], "create") == 0) {
        return create_project(argc >= 3 ? argv[2] : NULL);
    } else if (strcmp(argv[1], "run") == 0) {
        return run_project();
    } else if (strcmp(argv[1], "build") == 0) {
        return build_project();
    } else if (strcmp(argv[1], "install") == 0) {
        return install_deps();
    } else if (strcmp(argv[1], "generate") == 0) {
        return generate_file(argc >= 3 ? argv[2] : NULL, argc >= 4 ? argv[3] : NULL);
    } else if (strcmp(argv[1], "version") == 0) {
        show_version();
        return 0;
    } else if (strcmp(argv[1], "help") == 0) {
        show_help();
        return 0;
    } else {
        print_error("未知命令");
        show_help();
        return 1;
    }
    
    return 0;
}
