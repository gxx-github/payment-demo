import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

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

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const orders = new Map();

io.on('connection', (socket) => {
  socket.on('join_order', (orderId) => {
    socket.join(`order:${orderId}`);
  });
});

app.post('/api/orders', (req, res) => {
  const { amount, asset, chainId } = req.body || {};
  const orderId = uuidv4();
  const order = { orderId, amount, asset, chainId, status: 'created', createdAt: Date.now() };
  orders.set(orderId, order);
  res.json(order);
});

app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

app.post('/api/orders/:orderId/request-pay', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { to, from, value, data } = req.body || {};
  order.payRequest = { to, from, value, data };
  order.status = 'pay_requested';
  io.to(`order:${order.orderId}`).emit('pay_requested', { orderId: order.orderId, payRequest: order.payRequest });
  res.json({ ok: true });
});

app.post('/api/orders/:orderId/paid', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { txHash } = req.body || {};
  order.status = 'paid';
  order.txHash = txHash;
  io.to(`order:${order.orderId}`).emit('paid', { orderId: order.orderId, txHash });
  res.json({ ok: true });
});

const port = process.env.PORT || 8787;
httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
