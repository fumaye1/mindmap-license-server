@echo off
REM API 测试脚本 - mindmap-license-server (Windows)

echo === Mindmap License Server API 测试 ===
echo.

set /p BASE_URL="请输入服务器 URL (例如: http://localhost:3000 或 https://your-domain.com): "
set /p ADMIN_TOKEN="请输入管理员令牌: "

echo.
echo === 测试 1: 健康检查 ===
curl -s -X GET "%BASE_URL%/health"
echo.
echo.

echo === 测试 2: 创建激活密钥 ===
curl -s -X POST "%BASE_URL%/admin/create-key" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"maxVersion\":\"0.2.999\"}"
echo.
echo.

set /p ACTIVATION_KEY="请输入激活密钥 (从上面的响应中复制): "
set /p DEVICE_ID="请输入设备 ID (测试用): "
set /p DEVICE_NAME="请输入设备名称 (测试用): "

echo.
echo === 测试 3: 激活许可证 ===
curl -s -X POST "%BASE_URL%/activate" ^
  -H "Content-Type: application/json" ^
  -d "{\"key\":\"%ACTIVATION_KEY%\",\"deviceId\":\"%DEVICE_ID%\",\"deviceName\":\"%DEVICE_NAME%\",\"appVersion\":\"1.0.0\"}"
echo.
echo.

echo === 测试 4: 获取所有激活密钥 ===
curl -s -X GET "%BASE_URL%/admin/keys" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%"
echo.
echo.

echo === 测试 5: 获取所有许可证 ===
curl -s -X GET "%BASE_URL%/admin/licenses" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%"
echo.
echo.

echo === 测试 6: 获取所有设备 ===
curl -s -X GET "%BASE_URL%/admin/devices" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%"
echo.
echo.

echo === 测试完成 ===
pause
