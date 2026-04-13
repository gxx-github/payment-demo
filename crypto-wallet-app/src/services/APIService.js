import axios from 'axios';
import { API_CONFIG, ERROR_CODES, ERROR_MESSAGES } from '../utils/constants';

class APIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseUrl,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证token等
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        return this.handleError(error);
      }
    );
  }

  // 获取认证token
  getAuthToken() {
    // 从安全存储中获取token
    // 这里需要实现具体的token获取逻辑
    return null;
  }

  // 错误处理
  handleError(error) {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      switch (status) {
        case 401:
          throw new Error(ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED] || '未授权访问');
        case 403:
          throw new Error(ERROR_MESSAGES[ERROR_CODES.FORBIDDEN] || '禁止访问');
        case 404:
          throw new Error(ERROR_MESSAGES[ERROR_CODES.NOT_FOUND] || '资源不存在');
        case 500:
          throw new Error(ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR] || '服务器错误');
        default:
          throw new Error(data.message || '请求失败');
      }
    } else if (error.request) {
      // 网络错误
      throw new Error(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR] || '网络连接失败');
    } else {
      // 其他错误
      throw new Error(error.message || '未知错误');
    }
  }

  // 重试机制
  async retryRequest(requestFn, retries = API_CONFIG.retryAttempts) {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (i + 1)));
      }
    }
  }

  // 用户认证相关API
  async login(email, password) {
    return this.retryRequest(() =>
      this.client.post('/auth/login', { email, password })
    );
  }

  async register(email, password, walletAddress) {
    return this.retryRequest(() =>
      this.client.post('/auth/register', { email, password, walletAddress })
    );
  }

  async logout() {
    return this.retryRequest(() =>
      this.client.post('/auth/logout')
    );
  }

  async refreshToken() {
    return this.retryRequest(() =>
      this.client.post('/auth/refresh')
    );
  }

  // 钱包相关API
  async getWalletInfo(address) {
    return this.retryRequest(() =>
      this.client.get(`/wallet/${address}`)
    );
  }

  async getWalletBalance(address, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/wallet/${address}/balance`, {
        params: { network }
      })
    );
  }

  async getWalletTransactions(address, network = 'ethereum', limit = 50, offset = 0) {
    return this.retryRequest(() =>
      this.client.get(`/wallet/${address}/transactions`, {
        params: { network, limit, offset }
      })
    );
  }

  // 交易相关API
  async sendTransaction(transactionData) {
    return this.retryRequest(() =>
      this.client.post('/transaction/send', transactionData)
    );
  }

  async getTransactionStatus(txHash, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/transaction/${txHash}/status`, {
        params: { network }
      })
    );
  }

  async getTransactionDetails(txHash, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/transaction/${txHash}`, {
        params: { network }
      })
    );
  }

  // 价格相关API
  async getTokenPrice(symbol, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/price/${symbol}`, {
        params: { network }
      })
    );
  }

  async getTokenPrices(symbols, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.post('/price/batch', {
        symbols,
        network
      })
    );
  }

  // Gas费用相关API
  async getGasPrice(network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/gas/price`, {
        params: { network }
      })
    );
  }

  async estimateGas(transactionData, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.post('/gas/estimate', {
        ...transactionData,
        network
      })
    );
  }

  // 网络相关API
  async getNetworkStatus(network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/network/${network}/status`)
    );
  }

  async getSupportedNetworks() {
    return this.retryRequest(() =>
      this.client.get('/network/supported')
    );
  }

  // 代币相关API
  async getTokenList(network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/token/list`, {
        params: { network }
      })
    );
  }

  async getTokenInfo(tokenAddress, network = 'ethereum') {
    return this.retryRequest(() =>
      this.client.get(`/token/${tokenAddress}`, {
        params: { network }
      })
    );
  }

  // 用户设置相关API
  async getUserSettings() {
    return this.retryRequest(() =>
      this.client.get('/user/settings')
    );
  }

  async updateUserSettings(settings) {
    return this.retryRequest(() =>
      this.client.put('/user/settings', settings)
    );
  }

  // 通知相关API
  async getNotifications(limit = 20, offset = 0) {
    return this.retryRequest(() =>
      this.client.get('/notifications', {
        params: { limit, offset }
      })
    );
  }

  async markNotificationAsRead(notificationId) {
    return this.retryRequest(() =>
      this.client.put(`/notifications/${notificationId}/read`)
    );
  }

  // 备份相关API
  async backupWallet(walletData, encrypted = true) {
    return this.retryRequest(() =>
      this.client.post('/backup/wallet', {
        walletData,
        encrypted
      })
    );
  }

  async restoreWallet(backupData) {
    return this.retryRequest(() =>
      this.client.post('/backup/restore', {
        backupData
      })
    );
  }

  // 安全相关API
  async reportSuspiciousActivity(activityData) {
    return this.retryRequest(() =>
      this.client.post('/security/report', activityData)
    );
  }

  async getSecurityAlerts() {
    return this.retryRequest(() =>
      this.client.get('/security/alerts')
    );
  }

  // 统计相关API
  async getWalletStats(address, period = '30d') {
    return this.retryRequest(() =>
      this.client.get(`/stats/wallet/${address}`, {
        params: { period }
      })
    );
  }

  async getTransactionStats(address, period = '30d') {
    return this.retryRequest(() =>
      this.client.get(`/stats/transactions/${address}`, {
        params: { period }
      })
    );
  }
}

export default new APIService();
