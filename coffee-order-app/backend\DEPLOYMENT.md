# WECO CAFE 后端API部署指南

## 概述

本指南介绍如何部署WECO CAFE小程序的后端API服务。提供了多种部署方案，包括本地开发、微信云托管和自建服务器。

## 部署方案选择

### 方案一：本地开发环境（推荐开发阶段）
- **适用场景**：开发、测试、本地调试
- **技术要求**：Node.js、MongoDB（可选）
- **成本**：免费
- **优点**：快速启动，便于调试

### 方案二：微信云托管（推荐生产环境）
- **适用场景**：小程序生产环境
- **技术要求**：微信小程序账号，开通云托管
- **成本**：按量计费（约150-300 MOP/月）
- **优点**：免运维，微信生态深度集成，自动扩缩容

### 方案三：自建服务器（推荐高级用户）
- **适用场景**：需要完全控制权的生产环境
- **技术要求**：服务器运维经验
- **成本**：服务器租赁+运维成本（约800-1600 MOP/月）
- **优点**：完全控制，数据自主，可定制化

## 方案一：本地开发环境部署

### 1. 环境准备
```bash
# 安装 Node.js（版本 16+）
node --version  # 检查版本

# 安装 MongoDB（可选，也可使用内存模式）
mongod --version  # 检查版本
```

### 2. 项目配置
```bash
# 进入后端目录
cd coffee-order-app/backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置必要的环境变量
# 重要：配置微信小程序AppID和Secret
```

### 3. 启动服务
```bash
# 开发模式（使用nodemon自动重启）
npm run dev

# 或者直接启动
npm start

# 预期输出：
# 🚀 WECO CAFE API 服务已启动，端口: 3000
# 📡 健康检查: http://localhost:3000/health
# 📚 API文档: http://localhost:3000/api/docs
```

### 4. 验证服务
```bash
# 使用curl或浏览器访问
curl http://localhost:3000/health
# 预期返回：{"status":"ok","service":"WECO CAFE API","region":"macau"}

# 访问API文档
curl http://localhost:3000/api/docs
```

## 方案二：微信云托管部署

### 1. 开通云托管
1. 登录[微信云托管控制台](https://cloud.weixin.qq.com/cloudrun)
2. 创建新环境（选择离澳门最近的区域）
3. 记下环境ID

### 2. 准备Docker镜像
```dockerfile
# 项目根目录已有 Dockerfile
# 构建镜像
docker build -t weco-cafe-api:latest .

# 推送镜像到云托管仓库
docker tag weco-cafe-api:latest your-registry/weco-cafe-api:latest
docker push your-registry/weco-cafe-api:latest
```

### 3. 云托管配置
1. 在云托管控制台创建服务
2. 配置服务名称：`weco-cafe-api`
3. 选择刚才推送的镜像
4. 配置环境变量（参考.env.example）
5. 设置容器端口：80
6. 配置健康检查路径：`/health`

### 4. 域名配置
1. 在云托管控制台绑定自定义域名
2. 建议域名：`api.weco-cafe-macau.com`
3. 配置SSL证书（云托管自动提供）

### 5. 微信小程序配置
1. 登录微信公众平台
2. 进入「开发」-「开发设置」
3. 在「服务器域名」中添加：
   - request合法域名：`https://api.weco-cafe-macau.com`
   - uploadFile合法域名：`https://api.weco-cafe-macau.com`
   - downloadFile合法域名：`https://api.weco-cafe-macau.com`

## 方案三：自建服务器部署（Ubuntu 20.04）

### 1. 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装Nginx
sudo apt install -y nginx
```

### 2. 项目部署
```bash
# 创建项目目录
sudo mkdir -p /opt/weco-cafe-api
sudo chown -R $USER:$USER /opt/weco-cafe-api

# 上传代码（可以使用Git、SCP等）
cd /opt/weco-cafe-api
git clone <your-repository> .

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 创建日志目录
mkdir -p logs uploads
```

### 3. 使用PM2管理进程
```bash
# 全局安装PM2
sudo npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status
pm2 logs weco-cafe-api
```

### 4. 配置Nginx反向代理
```nginx
# /etc/nginx/sites-available/weco-cafe-api
server {
    listen 80;
    server_name api.weco-cafe-macau.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/weco-cafe-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 配置SSL证书（使用Let's Encrypt）
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.weco-cafe-macau.com

# 自动续期测试
sudo certbot renew --dry-run
```

## 数据库配置

### MongoDB生产环境配置
```yaml
# /etc/mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1  # 仅本地访问，通过Nginx代理

security:
  authorization: enabled  # 启用认证

# 重启MongoDB
sudo systemctl restart mongod
```

### 创建数据库用户
```javascript
// 连接到MongoDB
mongo

// 创建管理员用户
use admin
db.createUser({
  user: "weco_admin",
  pwd: "strong_password_here",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

// 创建应用数据库用户
use weco_cafe
db.createUser({
  user: "weco_app",
  pwd: "app_password_here",
  roles: [{ role: "readWrite", db: "weco_cafe" }]
})
```

## 监控与维护

### 服务监控
```bash
# PM2监控
pm2 monit
pm2 logs weco-cafe-api --lines 100

# 系统资源监控
htop
df -h  # 磁盘使用
free -h  # 内存使用
```

### 日志管理
```bash
# 查看应用日志
tail -f /opt/weco-cafe-api/logs/pm2-out.log
tail -f /opt/weco-cafe-api/logs/pm2-error.log

# 查看Nginx访问日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 查看MongoDB日志
tail -f /var/log/mongodb/mongod.log
```

### 备份策略
```bash
# 数据库备份脚本
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/weco_cafe_$DATE.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mongodump --db weco_cafe --gzip --archive=$BACKUP_FILE

# 保留最近7天的备份
find $BACKUP_DIR -name "weco_cafe_*.gz" -mtime +7 -delete

# 上传到云存储（可选）
# ossutil cp $BACKUP_FILE oss://weco-cafe-backup/
```

## 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
sudo lsof -i :3000

# 检查错误日志
pm2 logs weco-cafe-api --err

# 检查环境变量
echo $NODE_ENV
```

#### 2. 数据库连接失败
```bash
# 检查MongoDB服务状态
sudo systemctl status mongod

# 测试MongoDB连接
mongo --host localhost --port 27017

# 检查防火墙
sudo ufw status
```

#### 3. Nginx代理失败
```bash
# 检查Nginx配置
sudo nginx -t

# 检查Nginx状态
sudo systemctl status nginx

# 检查错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 4. 微信小程序无法访问API
1. 检查服务器域名是否在微信公众平台配置
2. 检查SSL证书是否有效
3. 检查防火墙是否开放443端口
4. 检查Nginx是否配置正确的CORS头

### 应急响应
```bash
# 服务重启
pm2 restart weco-cafe-api

# 数据库恢复
mongorestore --db weco_cafe --gzip --archive=/backup/mongodb/backup_file.gz

# 回滚到上一个版本（如果使用Git）
git reset --hard HEAD~1
pm2 restart weco-cafe-api
```

## 性能优化

### 应用层优化
1. **启用压缩**：Nginx启用gzip压缩
2. **缓存策略**：配置适当的HTTP缓存头
3. **数据库索引**：确保常用查询字段有索引
4. **连接池**：配置MongoDB连接池

### 基础设施优化
1. **CDN加速**：静态资源使用CDN
2. **负载均衡**：多实例部署
3. **数据库读写分离**：生产环境考虑
4. **Redis缓存**：缓存热点数据

## 安全建议

### 基础安全
1. **防火墙配置**：仅开放必要端口
2. **定期更新**：系统和软件安全更新
3. **最小权限**：服务使用非root用户运行
4. **日志审计**：监控异常访问

### 应用安全
1. **输入验证**：所有API输入都需要验证
2. **SQL注入防护**：使用参数化查询
3. **XSS防护**：设置合适的HTTP头
4. **速率限制**：防止暴力攻击

### 数据安全
1. **加密传输**：全站HTTPS
2. **密码哈希**：使用bcrypt存储密码
3. **敏感数据加密**：数据库字段加密
4. **定期备份**：异地备份重要数据

## 更新升级

### 版本升级流程
1. 在测试环境验证新版本
2. 备份生产环境数据和配置
3. 部署新版本到生产环境
4. 监控新版本运行状态
5. 准备回滚方案

### 回滚流程
1. 停止当前服务
2. 恢复上一个版本的代码
3. 恢复数据库备份（如果有数据变更）
4. 重启服务
5. 验证回滚结果

## 支持与联系

### 技术支持
- 技术文档：本部署指南
- 问题反馈：创建GitHub Issue
- 紧急支持：tech@weco-cafe-macau.com

### 相关链接
- 微信小程序开发文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 微信云托管文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/index.html
- MongoDB文档：https://docs.mongodb.com/
- PM2文档：https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/

---

**最后更新**：2026年4月8日  
**文档版本**：v1.0  
**适用版本**：WECO CAFE API v1.0.0