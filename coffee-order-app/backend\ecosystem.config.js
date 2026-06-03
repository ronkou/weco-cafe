// PM2 进程管理配置文件
// 用于生产环境部署

module.exports = {
  apps: [{
    name: 'weco-cafe-api',
    script: './index.js',
    instances: 'max', // 根据CPU核心数自动扩展
    exec_mode: 'cluster', // 集群模式
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    // 监控配置
    max_restarts: 10,
    restart_delay: 5000,
    // 健康检查
    health_check: {
      path: '/health',
      port: 3000,
      protocol: 'http',
      interval: 30000, // 30秒
      timeout: 5000,
      unhealthy_threshold: 3
    }
  }],

  // 部署配置（可选）
  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/weco-cafe-backend.git',
      path: '/var/www/weco-cafe-api',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};