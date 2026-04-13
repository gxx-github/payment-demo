const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // 代理 /api 请求到后端服务器
    app.use(
        '/api/signTx',
        createProxyMiddleware({
            target: 'https://qa-pay.weajp.com',
            changeOrigin: true,
            secure: false, // 如果后端使用 HTTPS，设置为 true
            logLevel: 'debug',
            onProxyReq: (proxyReq, req, res) => {
                console.log('Proxy request:', req.method, req.url);
            },
            onProxyRes: (proxyRes, req, res) => {
                console.log('Proxy response:', proxyRes.statusCode, req.url);
            },
            onError: (err, req, res) => {
                console.error('Proxy error:', err);
            }
        })
    );
};