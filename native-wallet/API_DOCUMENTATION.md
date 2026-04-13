# Native Wallet API 文档

本文档描述了 Native Wallet 与后端服务之间的通信协议。

## WebSocket 连接

### 连接地址

\`\`\`
wss://your-backend-service.com/ws?wallet={walletAddress}
\`\`\`

### 连接流程

1. 客户端建立 WebSocket 连接
2. 连接成功后发送 AUTH 消息
3. 服务器验证钱包地址
4. 开始接收和发送消息

## 消息格式

所有消息使用 JSON 格式，结构如下：

\`\`\`typescript
interface WebSocketMessage {
  type: string;      // 消息类型
  data: any;         // 消息数据
  timestamp: number; // 时间戳（毫秒）
}
\`\`\`

## 消息类型

### 1. 客户端认证 (AUTH)

**方向**: 客户端 → 服务器

**时机**: 连接建立后立即发送

**数据格式**:
\`\`\`json
{
  "type": "AUTH",
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 1,
    "signature": "optional_signature_for_verification"
  },
  "timestamp": 1234567890123
}
\`\`\`

**响应**:
\`\`\`json
{
  "type": "AUTH_SUCCESS",
  "data": {
    "sessionId": "session_uuid",
    "message": "Authentication successful"
  },
  "timestamp": 1234567890124
}
\`\`\`

### 2. 支付请求 (PAYMENT_REQUEST)

**方向**: 服务器 → 客户端

**时机**: 商家发起支付请求时

**数据格式**:
\`\`\`json
{
  "type": "PAYMENT_REQUEST",
  "data": {
    "requestId": "req_uuid_12345",
    "amount": "0.1",
    "currency": "ETH",
    "chainId": 1,
    "merchant": "星巴克咖啡",
    "merchantAddress": "0x1234...5678",
    "description": "购买咖啡 x2",
    "orderId": "order_12345",
    "expiresAt": 1234567890123
  },
  "timestamp": 1234567890123
}
\`\`\`

**字段说明**:
- `requestId`: 唯一请求 ID
- `amount`: 支付金额（字符串格式，避免精度问题）
- `currency`: 币种符号（ETH, BNB, MATIC, SOL 等）
- `chainId`: 链 ID
- `merchant`: 商家名称
- `merchantAddress`: 商家钱包地址
- `description`: 交易描述
- `orderId`: 订单 ID（可选）
- `expiresAt`: 过期时间戳（可选）

### 3. 用户接受支付 (PAYMENT_ACCEPTED)

**方向**: 客户端 → 服务器

**时机**: 用户确认支付请求后

**数据格式**:
\`\`\`json
{
  "type": "PAYMENT_ACCEPTED",
  "data": {
    "requestId": "req_uuid_12345"
  },
  "timestamp": 1234567890125
}
\`\`\`

### 4. 用户拒绝支付 (PAYMENT_REJECTED)

**方向**: 客户端 → 服务器

**时机**: 用户拒绝支付请求

**数据格式**:
\`\`\`json
{
  "type": "PAYMENT_REJECTED",
  "data": {
    "requestId": "req_uuid_12345",
    "reason": "user_cancelled"
  },
  "timestamp": 1234567890126
}
\`\`\`

### 5. 交易提交 (TRANSACTION_SUBMITTED)

**方向**: 客户端 → 服务器

**时机**: 交易已提交到区块链

**数据格式**:
\`\`\`json
{
  "type": "TRANSACTION_SUBMITTED",
  "data": {
    "requestId": "req_uuid_12345",
    "txHash": "0xabcdef...",
    "chainId": 1,
    "from": "0x742d35...",
    "to": "0x1234...",
    "amount": "0.1",
    "gasPrice": "50",
    "gasLimit": "21000"
  },
  "timestamp": 1234567890127
}
\`\`\`

### 6. 支付确认 (PAYMENT_CONFIRMED)

**方向**: 服务器 → 客户端

**时机**: 交易在区块链上确认

**数据格式**:
\`\`\`json
{
  "type": "PAYMENT_CONFIRMED",
  "data": {
    "requestId": "req_uuid_12345",
    "txHash": "0xabcdef...",
    "blockNumber": 12345678,
    "confirmations": 3,
    "status": "success"
  },
  "timestamp": 1234567890130
}
\`\`\`

### 7. 支付失败 (PAYMENT_FAILED)

**方向**: 服务器 → 客户端

**时机**: 交易失败或被拒绝

**数据格式**:
\`\`\`json
{
  "type": "PAYMENT_FAILED",
  "data": {
    "requestId": "req_uuid_12345",
    "reason": "insufficient_funds",
    "message": "账户余额不足",
    "txHash": "0xabcdef..." // 如果交易已提交
  },
  "timestamp": 1234567890131
}
\`\`\`

**失败原因代码**:
- `insufficient_funds`: 余额不足
- `gas_too_high`: Gas 费用过高
- `transaction_reverted`: 交易被回退
- `timeout`: 交易超时
- `user_rejected`: 用户拒绝
- `network_error`: 网络错误

### 8. 心跳 (PING/PONG)

**方向**: 双向

**时机**: 定期发送保持连接

**PING**:
\`\`\`json
{
  "type": "PING",
  "data": {},
  "timestamp": 1234567890132
}
\`\`\`

**PONG**:
\`\`\`json
{
  "type": "PONG",
  "data": {},
  "timestamp": 1234567890133
}
\`\`\`

### 9. 余额更新通知 (BALANCE_UPDATE)

**方向**: 服务器 → 客户端

**时机**: 检测到余额变化

**数据格式**:
\`\`\`json
{
  "type": "BALANCE_UPDATE",
  "data": {
    "address": "0x742d35...",
    "chainId": 1,
    "balance": "1.5",
    "currency": "ETH",
    "previousBalance": "1.6"
  },
  "timestamp": 1234567890134
}
\`\`\`

### 10. 交易通知 (TRANSACTION_NOTIFICATION)

**方向**: 服务器 → 客户端

**时机**: 检测到新交易

**数据格式**:
\`\`\`json
{
  "type": "TRANSACTION_NOTIFICATION",
  "data": {
    "txHash": "0xabcdef...",
    "type": "receive",
    "from": "0x1234...",
    "to": "0x742d35...",
    "amount": "0.5",
    "currency": "ETH",
    "chainId": 1,
    "blockNumber": 12345678,
    "timestamp": 1234567890135
  },
  "timestamp": 1234567890135
}
\`\`\`

## REST API 端点（可选）

如果需要 REST API 补充 WebSocket，以下是建议的端点：

### 获取交易历史

\`\`\`
GET /api/transactions?address={address}&chainId={chainId}&page={page}&limit={limit}
\`\`\`

**响应**:
\`\`\`json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "txHash": "0xabcdef...",
        "type": "send",
        "from": "0x742d35...",
        "to": "0x1234...",
        "amount": "0.1",
        "currency": "ETH",
        "chainId": 1,
        "status": "confirmed",
        "blockNumber": 12345678,
        "timestamp": 1234567890000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
\`\`\`

### 获取余额

\`\`\`
GET /api/balance?address={address}&chainId={chainId}
\`\`\`

**响应**:
\`\`\`json
{
  "success": true,
  "data": {
    "address": "0x742d35...",
    "chainId": 1,
    "balance": "1.5",
    "currency": "ETH"
  }
}
\`\`\`

### 获取 Gas 价格

\`\`\`
GET /api/gas-price?chainId={chainId}
\`\`\`

**响应**:
\`\`\`json
{
  "success": true,
  "data": {
    "chainId": 1,
    "gasPrice": "50",
    "gasPriceGwei": "50",
    "estimatedTime": "15s"
  }
}
\`\`\`

## 错误处理

所有错误消息格式：

\`\`\`json
{
  "type": "ERROR",
  "data": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": 1234567890136
}
\`\`\`

**错误代码**:
- `AUTH_FAILED`: 认证失败
- `INVALID_REQUEST`: 无效请求
- `INSUFFICIENT_BALANCE`: 余额不足
- `NETWORK_ERROR`: 网络错误
- `TRANSACTION_FAILED`: 交易失败
- `TIMEOUT`: 超时
- `RATE_LIMIT`: 请求频率限制

## 安全建议

1. **使用 WSS (WebSocket Secure)**
   - 生产环境必须使用 WSS
   - 配置有效的 SSL 证书

2. **认证机制**
   - 可选：要求用户签名验证钱包所有权
   - 实现 session 管理

3. **数据验证**
   - 验证所有输入数据
   - 检查金额和地址格式
   - 防止重放攻击

4. **频率限制**
   - 限制每个钱包的请求频率
   - 防止 DDoS 攻击

5. **交易监控**
   - 监控异常交易模式
   - 实现交易金额限制
   - 提供交易审核机制

## 测试工具

### 使用 wscat 测试

\`\`\`bash
npm install -g wscat
wscat -c "wss://your-backend-service.com/ws?wallet=0x742d35..."
\`\`\`

### 发送测试消息

\`\`\`json
{"type":"AUTH","data":{"walletAddress":"0x742d35..."},"timestamp":1234567890}
\`\`\`

## 性能优化

1. **消息压缩**
   - 考虑使用 WebSocket 压缩扩展

2. **批量消息**
   - 将多个通知合并成一条消息

3. **连接池**
   - 服务器端实现连接池管理

4. **负载均衡**
   - 使用负载均衡分散 WebSocket 连接

## 版本控制

在消息中添加版本字段以支持协议升级：

\`\`\`json
{
  "version": "1.0",
  "type": "PAYMENT_REQUEST",
  "data": {...},
  "timestamp": 1234567890
}
\`\`\`

---

如有疑问，请参考示例实现或联系技术支持。

