#!/bin/bash

# API 测试脚本 - mindmap-license-server

set -e

echo "=== Mindmap License Server API 测试 ==="
echo ""

# 获取配置
read -p "请输入服务器 URL (例如: http://localhost:3000 或 https://your-domain.com): " BASE_URL
read -p "请输入管理员令牌: " ADMIN_TOKEN

echo ""
echo "=== 测试 1: 健康检查 ==="
curl -s -X GET "$BASE_URL/health" | jq '.'
echo ""

echo "=== 测试 2: 创建激活密钥 ==="
KEY_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/create-key"   -H "Authorization: Bearer $ADMIN_TOKEN"   -H "Content-Type: application/json"   -d '{"maxVersion":"0.2.999"}')
echo "$KEY_RESPONSE" | jq '.'

ACTIVATION_KEY=$(echo "$KEY_RESPONSE" | jq -r '.key')
echo ""
echo "激活密钥: $ACTIVATION_KEY"
echo ""

read -p "请输入设备 ID (测试用): " DEVICE_ID
read -p "请输入设备名称 (测试用): " DEVICE_NAME

echo ""
echo "=== 测试 3: 激活许可证 ==="
ACTIVATE_PAYLOAD=$(jq -n --arg key "$ACTIVATION_KEY" --arg deviceId "$DEVICE_ID" --arg deviceName "$DEVICE_NAME" --arg appVersion "1.0.0" '{key:$key, deviceId:$deviceId, deviceName:$deviceName, appVersion:$appVersion}')
ACTIVATE_RESPONSE=$(curl -s -X POST "$BASE_URL/activate"   -H "Content-Type: application/json"   -d "$ACTIVATE_PAYLOAD")
echo "$ACTIVATE_RESPONSE" | jq '.'

# 保存响应以便后续测试
TMP_FILE="${TMPDIR:-/tmp}/license_response.json"
echo "$ACTIVATE_RESPONSE" > "$TMP_FILE"

echo ""
echo "=== 测试 4: 刷新许可证 ==="
PAYLOAD_B64=$(cat "$TMP_FILE" | jq -r '.payloadB64')
SIG_B64=$(cat "$TMP_FILE" | jq -r '.sigB64')
REFRESH_PAYLOAD=$(jq -n --arg payloadB64 "$PAYLOAD_B64" --arg sigB64 "$SIG_B64" --arg deviceId "$DEVICE_ID" --arg deviceName "$DEVICE_NAME" --arg appVersion "1.0.0" '{payloadB64:$payloadB64, sigB64:$sigB64, deviceId:$deviceId, deviceName:$deviceName, appVersion:$appVersion}')
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/refresh"   -H "Content-Type: application/json"   -d "$REFRESH_PAYLOAD")
echo "$REFRESH_RESPONSE" | jq '.'

echo ""
echo "=== 测试 5: 获取所有激活密钥 ==="
curl -s -X GET "$BASE_URL/admin/keys"   -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo ""
echo "=== 测试 6: 获取所有许可证 ==="
curl -s -X GET "$BASE_URL/admin/licenses"   -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo ""
echo "=== 测试 7: 获取所有设备 ==="
curl -s -X GET "$BASE_URL/admin/devices"   -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo ""
echo "=== 测试完成 ==="
