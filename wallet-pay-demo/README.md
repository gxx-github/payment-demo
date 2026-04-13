## Wallet Pay Demo 使用文档

### 概览
- **后端**: Express + Socket.IO 提供订单创建、状态更新与实时通知，并托管静态前端页面。
- **前端**:
  - `web/dapp/`: 模拟“用户钱包内置浏览器打开的 DApp”
  - `web/merchant/`: 模拟“商家端”扫码后向用户发起支付请求

### 目录结构
- `server/server.js`: HTTP API + WebSocket + 静态托管
- `web/dapp/index.html`: 用户端 DApp
- `web/merchant/index.html`: 商家端

### 环境要求
- Node.js 18+（建议 20+/22+）
- 端口: 默认 `8787`

### 安装与启动
1) 安装依赖

```bash
npm install
```

2) 启动服务

```bash
npm run start
```

出现日志：

```
Server listening on http://localhost:8787
```

3) 打开页面
- 商家端: `http://localhost:8787/merchant/`
- 用户 DApp: `http://localhost:8787/dapp/`
- 索引页: `http://localhost:8787/`

### 交互流程（手动联调）
1) 在 DApp 页面
- 填写金额、链等，点击“生成支付二维码”
- 页面会显示订单号与二维码（二维码文本是 JSON，如 {"t":"order","id":"..."}）

2) 在商家端页面
- 将 DApp 的二维码内容文本粘贴到输入框（或对接扫码枪）
- 点击“连接订单”
- 填写 `to`（收款地址），`value`（wei），`data` 可选，点击“请求支付”

3) DApp 钱包侧
- 如果在带 EIP-1193 的钱包环境（如内置浏览器/浏览器钱包）打开 DApp，会收到交易请求
- 确认后，DApp 向后端上报 `txHash`，商家端与 DApp 日志会收到“已支付”事件

### API 说明
- 基础地址: `http://localhost:8787`

- 创建订单
  - POST `/api/orders`
  - Body: `{ "amount": string, "asset": string, "chainId": number }`
  - 响应: `{ orderId, amount, asset, chainId, status, createdAt }`

- 查询订单
  - GET `/api/orders/:orderId`
  - 响应: 订单对象；不存在则 404

- 商家发起支付请求
  - POST `/api/orders/:orderId/request-pay`
  - Body: `{ "to": string, "from"?: string, "value": string, "data"?: string }`
  - 效果: 设置订单状态为 `pay_requested` 并向该订单房间广播 `pay_requested` 事件

- 支付完成回执（DApp 调用）
  - POST `/api/orders/:orderId/paid`
  - Body: `{ "txHash": string }`
  - 效果: 设置订单状态为 `paid` 并广播 `paid` 事件

### WebSocket 事件
- 客户端加入订单房间
  - 事件: `join_order`
  - 参数: `orderId`
- 后端广播
  - `pay_requested`: `{ orderId, payRequest }`
  - `paid`: `{ orderId, txHash }`

### 示例请求
- 创建订单

```bash
curl -X POST http://localhost:8787/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"amount":"100000000000000", "asset":"ETH", "chainId":11155111}'
```

- 发起支付请求（商家）

```bash
curl -X POST http://localhost:8787/api/orders/<ORDER_ID>/request-pay \
  -H 'Content-Type: application/json' \
  -d '{"to":"0xReceiver","value":"100000000000000"}'
```

- 标记已支付（DApp）

```bash
curl -X POST http://localhost:8787/api/orders/<ORDER_ID>/paid \
  -H 'Content-Type: application/json' \
  -d '{"txHash":"0xabc..."}'
```

### 常见问题
- 启动时报找不到依赖，如 “Cannot find package 'express'”
  - 先执行 `npm install`
- 页面连不上后端
  - 确认后端在 `8787` 端口运行
  - 浏览器地址使用 `http://localhost:8787/...`
- DApp 未检测到钱包
  - 日志提示“未检测到 EIP-1193 钱包环境”：请在带钱包的环境打开（如浏览器插件钱包或移动端内置浏览器）
- 金额单位
  - `value` 使用 `wei`（字符串）

### 文件索引（关键片段）
- 后端静态托管与路由

```12:33:/Users/gxx/wallet-pay-demo/server/server.js
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const orders = new Map();

io.on('connection', (socket) => {
  socket.on('join_order', (orderId) => {
    socket.join(`order:${orderId}`);
  });
});

// Serve static demo pages
app.use('/dapp', express.static('web/dapp'));
app.use('/merchant', express.static('web/merchant'));
app.get('/', (_req, res) => {
  res.type('html').send(
    '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px">'
    + '<h2>Wallet Pay Demo</h2>'
    + '<p><a href="/merchant/">商家端</a></p>'
    + '<p><a href="/dapp/">用户 DApp</a></p>'
    + '</body></html>'
  );
});
```

- 创建订单

```22:28:/Users/gxx/wallet-pay-demo/server/server.js
app.post('/api/orders', (req, res) => {
  const { amount, asset, chainId } = req.body || {};
  const orderId = uuidv4();
  const order = { orderId, amount, asset, chainId, status: 'created', createdAt: Date.now() };
  orders.set(orderId, order);
  res.json(order);
});
```

- 商家发起支付请求并广播

```36:44:/Users/gxx/wallet-pay-demo/server/server.js
app.post('/api/orders/:orderId/request-pay', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { to, from, value, data } = req.body || {};
  order.payRequest = { to, from, value, data };
  order.status = 'pay_requested';
  io.to(`order:${order.orderId}`).emit('pay_requested', { orderId: order.orderId, payRequest: order.payRequest });
  res.json({ ok: true });
});
```

- 支付完成并广播

```46:59:/Users/gxx/wallet-pay-demo/server/server.js
app.post('/api/orders/:orderId/paid', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { txHash } = req.body || {};
  order.status = 'paid';
  order.txHash = txHash;
  io.to(`order:${order.orderId}`).emit('paid', { orderId: order.orderId, txHash });
  res.json({ ok: true });
});
```

- DApp 收到商家支付请求并调用钱包

```53:75:/Users/gxx/wallet-pay-demo/web/dapp/index.html
socket.on('pay_requested', async (payload) => {
  append('收到商家支付请求，尝试通过已注入的钱包发起交易');
  const pay = payload.payRequest;
  try {
    if (window.ethereum && window.ethereum.request) {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ to: pay.to, from: pay.from, value: pay.value, data: pay.data || '0x' }]
      });
      append('钱包已提交交易: ' + txHash);
      await axios.post(`${serverBase}/api/orders/${order.orderId}/paid`, { txHash });
    } else {
      append('未检测到 EIP-1193 钱包环境');
    }
  } catch (err) {
    append('用户拒绝或发送失败: ' + err.message);
  }
});

socket.on('paid', (p) => {
  append('后端确认支付，txHash=' + p.txHash);
});
```

- 商家端连接订单与发起支付请求

```46:67:/Users/gxx/wallet-pay-demo/web/merchant/index.html
document.getElementById('connect').onclick = async () => {
  try {
    const obj = JSON.parse(document.getElementById('scan').value);
    if(obj.t !== 'order') throw new Error('不是订单二维码');
    orderId = obj.id;
    const socket = io(serverBase);
    socket.emit('join_order', orderId);
    append('已连接订单房间: ' + orderId);
  } catch(e){
    append('解析失败: ' + e.message);
  }
};

document.getElementById('requestPay').onclick = async () => {
  if(!orderId) return append('请先连接订单');
  const to = document.getElementById('to').value;
  const from = document.getElementById('from').value || undefined;
  const value = document.getElementById('value').value;
  const data = document.getElementById('data').value || undefined;
  await axios.post(`${serverBase}/api/orders/${orderId}/request-pay`, { to, from, value, data });
  append('已向订单推送支付请求');
};
```


