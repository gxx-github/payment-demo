# Solana Fee Payer Demo

## 运行步骤
1. 生成 payer: `solana-keygen new --outfile payer-keypair.json`
2. 充 SOL: `solana airdrop 2 <payer-pubkey> --url devnet`
3. 更新 .env 中的 PAYER_SECRET_KEY 和 USER_PUBLIC_KEY
4. 后端: cd backend && npm start
5. 前端: cd frontend && npm start
6. 浏览器: http://localhost:3000 → 连接 Phantom → 点击测试按钮

## 测试
- 确保 USER_PUBLIC_KEY 是连接的 Phantom 地址。
- 交易: 用户转 0.001 SOL 到目标，payer 付 gas。