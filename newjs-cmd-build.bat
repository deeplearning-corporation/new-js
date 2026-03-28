@echo off
:: build.bat - 简单编译脚本
title New.js CMD 编译工具
color 0A

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   🔨 New.js CMD 编译器                                        ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: 检查 GCC
echo [1/3] 检查编译环境...
where gcc >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 GCC 编译器
    echo.
    echo 请安装 MinGW-w64:
    echo   https://www.mingw-w64.org/downloads/
    echo.
    pause
    exit /b 1
)
echo ✅ GCC 编译器已安装
gcc --version | findstr "gcc"
echo.

:: 编译
echo [2/3] 编译 newjs-cmd.c...
gcc -o newjs-cmd.exe newjs-cmd.c -O2 -ladvapi32

if %errorlevel% neq 0 (
    echo ❌ 编译失败
    pause
    exit /b 1
)
echo ✅ 编译成功
echo.

:: 显示文件信息
echo [3/3] 生成文件信息...
if exist newjs-cmd.exe (
    for %%A in (newjs-cmd.exe) do (
        echo 📁 文件名: newjs-cmd.exe
        echo 📊 文件大小: %%~zA bytes
        echo 📅 创建时间: %%~tA
    )
) else (
    echo ❌ 未找到生成的文件
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   ✨ 编译完成！                                                ║
echo ║                                                               ║
echo ║   使用方法:                                                    ║
echo ║     newjs-cmd help             显示帮助                        ║
echo ║     newjs-cmd version          显示版本                        ║
echo ║     newjs-cmd create myapp     创建项目                        ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

pause