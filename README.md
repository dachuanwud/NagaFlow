# NagaFlow - 加密货币量化交易Web应用

NagaFlow是一个现代化的Web应用界面，用于更直观地操作和展示加密货币量化交易系统。它集成了数据获取、策略回测和结果分析功能。

## 🚀 技术栈

### 前端
- **Vite** - 快速的构建工具和开发服务器
- **React 18** - 现代化UI框架
- **TypeScript** - 类型安全
- **Ant Design** - 企业级UI组件库
- **Plotly.js** - 交互式图表库
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP客户端

### 后端
- **FastAPI** - 高性能异步API框架
- **Python 3.8+** - 编程语言
- **Pydantic** - 数据验证
- **Uvicorn** - ASGI服务器
- **WebSocket** - 实时通信

### 现有模块集成
- **bn_data** - 币安数据获取与处理模块
- **crypto_cta** - CTA策略回测与评估模块

## 📁 项目结构

```
NagaFlow/
├── frontend/                 # Vite + React前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   └── models/         # 数据模型
│   ├── main.py
│   └── requirements.txt
├── bn_data/                 # 现有数据模块
├── crypto_cta/             # 现有回测模块
└── README.md
```

## 🛠️ 安装和运行

### 前端开发环境

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 http://localhost:3000 运行

### 后端开发环境

1. 进入后端目录：
```bash
cd backend
```

2. 创建虚拟环境（推荐）：
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 启动后端服务器：
```bash
python main.py
```

后端API将在 http://localhost:8000 运行

## 🎯 主要功能

### 1. 数据管理
- 交易对选择和管理
- 数据下载进度监控
- 数据状态实时更新
- 缓存管理

### 2. 策略管理
- 策略创建和编辑
- 因子库管理
- 策略验证
- 策略克隆

### 3. 回测系统
- 批量回测执行
- 参数优化
- 实时进度监控
- 结果对比分析

### 4. 可视化分析
- 交互式资金曲线图表
- 性能指标展示
- 实时数据更新
- 响应式设计

## 📊 API接口

### 数据管理
- `GET /api/data/symbols` - 获取交易对列表
- `POST /api/data/download` - 启动数据下载
- `GET /api/data/status` - 获取下载状态
- `GET /api/data/market/{symbol}` - 获取市场数据

### 回测管理
- `POST /api/backtest/run` - 运行回测
- `GET /api/backtest/status/{task_id}` - 获取回测状态
- `GET /api/backtest/results/{task_id}` - 获取回测结果
- `POST /api/backtest/optimize` - 参数优化

### 策略管理
- `GET /api/strategies/` - 获取策略列表
- `POST /api/strategies/` - 创建策略
- `PUT /api/strategies/{id}` - 更新策略
- `GET /api/strategies/factors` - 获取因子列表

## 🔧 开发计划

### 阶段一：基础架构（1-2周）
- [x] 后端API框架搭建
- [x] 前端项目初始化
- [x] 基础路由和布局
- [ ] 现有模块集成测试

### 阶段二：核心功能（2-3周）
- [ ] 数据管理界面开发
- [ ] 策略回测界面开发
- [ ] 图表和可视化集成
- [ ] API接口完善

### 阶段三：高级功能（2-3周）
- [ ] 实时数据推送
- [ ] 批量操作优化
- [ ] 用户体验优化
- [ ] 性能优化

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱: your-email@example.com
- GitHub Issues: [项目Issues页面](https://github.com/your-username/NagaFlow/issues)
量化平台WEB应用
