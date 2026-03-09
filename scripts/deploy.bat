@echo off
REM 部署脚本 - mindmap-license-server (Windows)

echo === Mindmap License Server 部署脚本 ===
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: Node.js 未安装。请先安装 Node.js 18+
    exit /b 1
)

REM 检查 npm 是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: npm 未安装。请先安装 npm
    exit /b 1
)

REM 1. 安装依赖
echo 步骤 1/5: 安装依赖...
call npm install
echo √ 依赖安装完成
echo.

REM 2. 构建项目
echo 步骤 2/5: 构建项目...
call npm run build
echo √ 项目构建完成
echo.

REM 3. 初始化数据库
echo 步骤 3/5: 初始化数据库...
set /p init_db="是否初始化数据库？(y/n): "
if /i "%init_db%"=="y" (
    call npm run db:init
)
echo √ 数据库初始化完成
echo.

REM 4. 生成密钥对
echo 步骤 4/5: 生成密钥对...
set /p gen_keys="是否生成新的密钥对？(y/n): "
if /i "%gen_keys%"=="y" (
    call npm run gen:keys
    echo.
    echo 请将生成的密钥添加到 .env 文件中
)
echo √ 密钥对生成完成
echo.

REM 5. 部署应用
echo 步骤 5/5: 部署应用...
set /p do_deploy="是否现在部署应用？(y/n): "
if /i "%do_deploy%"=="y" (
    pm2 restart ecosystem.config.js --env production
    echo √ 应用部署完成
)

echo.
echo === 部署流程完成 ===
echo.
echo 下一步：
echo 1. 配置 Nginx
echo 2. 设置 SSL 证书
echo 3. 测试 API 端点
echo.
echo 更多信息，请参阅 ALIYUN_DEPLOYMENT.md
pause
