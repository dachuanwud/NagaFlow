# NagaFlow 前端访问问题诊断与解决方案

## 问题诊断结果

### 🔍 发现的问题
1. **端口冲突**: 原配置端口3000被其他服务占用
2. **多个服务实例**: 有多个Vite服务器实例在不同端口运行
3. **配置不一致**: Vite配置文件中的端口与实际运行端口不匹配

### ✅ 已解决的问题
1. **统一端口配置**: 将Vite配置端口更新为5173
2. **清理冲突进程**: 停止了冲突的服务器实例
3. **重新启动服务**: 在正确端口启动了干净的开发服务器

## 当前状态

### 🌐 正确的访问地址
- **主页**: http://localhost:5173/
- **回测结果页**: http://localhost:5173/results
- **数据管理页**: http://localhost:5173/data
- **策略管理页**: http://localhost:5173/strategies
- **回测页面**: http://localhost:5173/backtest

### 🚀 服务器状态
- **端口**: 5173
- **状态**: 正常运行
- **热重载**: 已启用
- **API代理**: 配置到 http://localhost:8003

## 启动方法

### 方法1: 使用启动脚本 (推荐)
```bash
cd frontend
./start_frontend.sh
```

### 方法2: 手动启动
```bash
cd frontend
export PATH="/opt/homebrew/bin:$PATH"
npm run dev -- --port 5173 --host
```

### 方法3: 使用项目根目录的启动脚本
```bash
# 在项目根目录
python start_dev.py
```

## 常见问题解决

### 问题1: 端口被占用
**症状**: 启动时显示 "Port 5173 is in use"
**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :5173

# 停止进程 (替换PID为实际进程ID)
kill <PID>

# 或强制停止
kill -9 <PID>
```

### 问题2: npm命令未找到
**症状**: "npm: command not found"
**解决方案**:
```bash
# 设置正确的PATH
export PATH="/opt/homebrew/bin:$PATH"

# 或使用完整路径
/opt/homebrew/bin/npm run dev
```

### 问题3: 页面空白或加载失败
**症状**: 浏览器显示空白页面或加载错误
**解决方案**:
1. 检查浏览器控制台是否有错误
2. 确认服务器正在运行: `curl -I http://localhost:5173`
3. 重新启动开发服务器
4. 清除浏览器缓存

### 问题4: API请求失败
**症状**: 前端无法获取数据，控制台显示API错误
**解决方案**:
1. 确认后端服务在8003端口运行
2. 检查Vite代理配置
3. 查看网络请求是否被正确代理

## 配置文件说明

### vite.config.ts 关键配置
```typescript
server: {
  port: 5173,        // 开发服务器端口
  host: true,        // 允许外部访问
  proxy: {
    '/api': {
      target: 'http://localhost:8003',  // 后端API地址
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### package.json 脚本
```json
{
  "scripts": {
    "dev": "vite",                    // 开发模式
    "build": "vite build",           // 构建生产版本
    "preview": "vite preview"        // 预览构建结果
  }
}
```

## 开发环境要求

### 必需软件
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **浏览器**: Chrome, Firefox, Safari, Edge (现代版本)

### 推荐配置
- **内存**: >= 4GB
- **磁盘空间**: >= 1GB (包含node_modules)
- **网络**: 稳定的互联网连接 (用于安装依赖)

## 性能优化建议

### 开发模式优化
1. **关闭不必要的浏览器扩展**
2. **使用Chrome DevTools的Performance面板监控**
3. **定期清理node_modules并重新安装依赖**

### 网络优化
1. **确保后端服务响应正常**
2. **检查API请求是否有不必要的重复调用**
3. **使用浏览器的Network面板监控请求**

## 监控和调试

### 实时监控
```bash
# 监控端口状态
watch -n 1 'lsof -i :5173'

# 监控进程状态
ps aux | grep vite

# 检查网络连接
curl -I http://localhost:5173
```

### 日志查看
- **Vite日志**: 在终端中查看启动日志
- **浏览器控制台**: F12 -> Console
- **网络请求**: F12 -> Network

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 操作系统版本
2. Node.js和npm版本
3. 错误信息截图
4. 浏览器控制台错误日志
5. 终端启动日志

---

**最后更新**: 2024年12月
**状态**: ✅ 已解决
**当前访问地址**: http://localhost:5173/
