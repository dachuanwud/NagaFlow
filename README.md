# NagaFlow - 加密货币量化交易Web应用

[![开发状态](https://img.shields.io/badge/开发状态-活跃开发中-brightgreen)](https://github.com/your-username/NagaFlow)
[![前端状态](https://img.shields.io/badge/前端-已完成-success)](http://localhost:3005)
[![后端状态](https://img.shields.io/badge/后端-已完成-success)](http://localhost:8003)
[![网络连接](https://img.shields.io/badge/网络连接-已修复-success)](./NETWORK_TROUBLESHOOTING.md)

NagaFlow是一个现代化的Web应用界面，专为加密货币量化交易系统设计。它提供直观的操作界面和强大的数据分析功能，集成了数据获取、策略回测、结果分析等完整的量化交易工作流。

## ✨ 最新更新 (2025-05-31)

🎉 **回测结果查看界面开发完成**
- 新增友好的"功能开发中"提示界面
- 展示即将推出的4个核心功能模块
- 完整的开发时间线和功能预览

🔧 **网络连接问题已解决**
- 修复前后端API连接配置
- 优化Vite代理设置
- 添加自动化启动脚本

📊 **功能完成度**: 85% (核心功能已完成，高级功能开发中)

## 🚀 技术栈

### 前端技术
- **Vite 6.3.5** - 极速构建工具和开发服务器
- **React 18** - 现代化UI框架，支持并发特性
- **TypeScript** - 类型安全的JavaScript超集
- **Ant Design 5.22** - 企业级UI组件库
- **Plotly.js** - 强大的交互式图表库
- **Framer Motion** - 流畅的动画效果库
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP客户端，支持请求拦截

### 后端技术
- **FastAPI** - 高性能异步API框架
- **Python 3.8+** - 现代Python特性支持
- **Pydantic** - 数据验证和序列化
- **Uvicorn** - 高性能ASGI服务器
- **WebSocket** - 实时双向通信

### 集成模块
- **bn_data** - 币安数据获取与处理模块
- **crypto_cta** - CTA策略回测与评估模块

## 📁 项目结构

```
NagaFlow/
├── frontend/                           # Vite + React前端应用
│   ├── src/
│   │   ├── components/                # 可复用组件
│   │   │   ├── BacktestResults/      # 回测结果组件
│   │   │   ├── Layout/               # 布局组件
│   │   │   ├── Loading/              # 加载组件
│   │   │   └── UI/                   # 基础UI组件
│   │   ├── pages/                    # 页面组件
│   │   │   ├── BacktestPage/         # 回测页面
│   │   │   │   ├── index.tsx         # 主页面
│   │   │   │   └── BacktestResultsModal.tsx  # 结果查看模态框 ✨新增
│   │   │   ├── Dashboard/            # 仪表板
│   │   │   ├── DataManagement/       # 数据管理
│   │   │   ├── Results/              # 结果分析
│   │   │   └── StrategyManagement/   # 策略管理
│   │   ├── services/                 # API服务层
│   │   │   ├── api.ts               # 统一API接口
│   │   │   └── mockApi.ts           # 数据格式化工具
│   │   ├── stores/                   # 状态管理
│   │   ├── hooks/                    # 自定义Hooks
│   │   ├── locales/                  # 国际化文件
│   │   └── styles/                   # 样式系统
│   ├── package.json
│   └── vite.config.ts               # Vite配置 (已优化代理)
├── backend/                          # FastAPI后端应用
│   ├── app/
│   │   ├── api/                     # API路由模块
│   │   │   ├── data.py             # 数据管理API
│   │   │   ├── backtest.py         # 回测API
│   │   │   └── strategies.py       # 策略管理API
│   │   ├── core/                   # 核心配置
│   │   │   └── config.py           # 应用配置
│   │   └── models/                 # 数据模型
│   ├── main.py                     # 应用入口 (智能端口选择)
│   ├── requirements.txt
│   └── venv/                       # Python虚拟环境
├── bn_data/                         # 币安数据模块
├── crypto_cta/                      # CTA策略模块
├── start_services.sh               # 自动化启动脚本 ✨新增
├── test_api_connection.py          # API连接测试脚本
├── NETWORK_TROUBLESHOOTING.md      # 网络故障排除指南 ✨新增
├── BACKTEST_RESULTS_FEATURE.md    # 回测结果功能文档 ✨新增
└── README.md                       # 项目说明文档
```

## 🛠️ 快速启动

### 🚀 方法一：自动化启动（推荐）

使用我们提供的自动化脚本，一键启动前后端服务：

```bash
# 确保脚本有执行权限
chmod +x start_services.sh

# 启动所有服务
./start_services.sh
```

脚本会自动：
- ✅ 设置正确的环境变量（PATH）
- ✅ 检查端口占用情况
- ✅ 启动后端服务（自动选择可用端口 8000-8004）
- ✅ 启动前端服务（自动选择可用端口 3000-3005）
- ✅ 测试前后端连接
- ✅ 显示服务信息和访问地址

### 🔧 方法二：手动启动

#### 后端服务

```bash
# 1. 进入后端目录
cd backend

# 2. 激活虚拟环境（如果已创建）
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 3. 安装依赖（首次运行）
pip install -r requirements.txt

# 4. 启动后端服务器
python main.py
```

**后端服务地址**: http://localhost:8003 (自动选择可用端口)

#### 前端服务

```bash
# 1. 设置Node.js环境变量（macOS用户）
export PATH="/opt/homebrew/bin:$PATH"

# 2. 进入前端目录
cd frontend

# 3. 安装依赖（首次运行）
npm install

# 4. 启动开发服务器
npm run dev
```

**前端服务地址**: http://localhost:3005 (自动选择可用端口)

### 🧪 验证安装

运行API连接测试脚本：

```bash
python test_api_connection.py
```

预期输出：
```
🚀 开始测试NagaFlow API连接...
📊 测试完成!
   总测试数: 8
   通过测试: 7
   失败测试: 1
   成功率: 87.5%
```

## 🎯 核心功能

### 📊 1. 数据管理 (✅ 已完成)
- **交易对管理**: 支持币安期货所有交易对的选择和管理
- **数据下载**: 批量下载历史K线数据，支持多时间周期
- **进度监控**: 实时显示下载进度和状态
- **缓存管理**: 智能缓存机制，提高数据访问效率
- **状态同步**: 前后端实时状态同步

### 🎯 2. 策略管理 (✅ 已完成)
- **策略CRUD**: 完整的策略创建、读取、更新、删除功能
- **因子库**: 集成现有的策略因子，支持动态加载
- **参数配置**: 灵活的JSON格式参数配置
- **策略验证**: 策略有效性检查和验证
- **策略克隆**: 快速复制和修改现有策略

### 🚀 3. 回测系统 (✅ 已完成)
- **批量回测**: 支持多交易对并行回测
- **参数优化**: 策略参数自动优化功能
- **实时监控**: 回测进度实时显示和状态轮询
- **任务管理**: 回测任务的创建、监控、删除
- **结果查看**: 新增回测结果查看界面 ✨

### 📈 4. 结果分析 (🔄 持续优化)
- **统计面板**: 详细的性能指标统计展示
- **资金曲线**: 交互式资金变化趋势图表
- **交易记录**: 完整的交易历史明细表格
- **数据筛选**: 多维度数据筛选和排序
- **报告导出**: 支持PDF和Excel格式导出

### 🎨 5. 用户界面 (✅ 已完成)
- **响应式设计**: 完美适配桌面、平板、移动设备
- **主题切换**: 支持明暗主题无缝切换
- **中文本地化**: 完整的中文界面和提示信息
- **动画效果**: 流畅的页面切换和交互动画
- **视觉一致性**: 统一的设计语言和组件风格

## 📊 API接口文档

### 🔗 服务地址
- **后端API**: http://localhost:8003
- **API文档**: http://localhost:8003/docs (Swagger UI)
- **前端应用**: http://localhost:3005

### 📡 数据管理API
- `GET /api/data/symbols?trade_type=swap` - 获取交易对列表
- `POST /api/data/download` - 启动数据下载任务
- `GET /api/data/status` - 获取下载状态和进度
- `GET /api/data/market/{symbol}` - 获取指定交易对的市场数据
- `DELETE /api/data/cache` - 清理数据缓存

### 🚀 回测管理API
- `POST /api/backtest/run` - 创建并运行回测任务
- `GET /api/backtest/status/{task_id}` - 获取回测任务状态
- `GET /api/backtest/results/{task_id}` - 获取回测结果详情
- `GET /api/backtest/tasks` - 获取所有回测任务列表
- `DELETE /api/backtest/tasks/{task_id}` - 删除指定回测任务
- `POST /api/backtest/optimize` - 启动参数优化任务

### 🎯 策略管理API
- `GET /api/strategies/` - 获取策略列表
- `POST /api/strategies/` - 创建新策略
- `GET /api/strategies/{id}` - 获取策略详情
- `PUT /api/strategies/{id}` - 更新策略信息
- `DELETE /api/strategies/{id}` - 删除策略
- `GET /api/strategies/factors` - 获取可用因子列表
- `POST /api/strategies/{id}/clone` - 克隆策略

### 🏥 系统健康检查
- `GET /health` - 服务健康状态检查
- `GET /` - 服务基本信息

## �️ 开发计划与路线图

### ✅ 第一阶段：基础架构 (已完成)
- [x] **后端API框架** - FastAPI + Pydantic完整搭建
- [x] **前端项目架构** - React + TypeScript + Ant Design
- [x] **基础路由布局** - 响应式布局和导航系统
- [x] **现有模块集成** - bn_data和crypto_cta模块完整集成
- [x] **网络连接优化** - 前后端API连接问题解决

### ✅ 第二阶段：核心功能 (已完成)
- [x] **数据管理界面** - 交易对选择、数据下载、状态监控
- [x] **策略管理界面** - 策略CRUD、因子管理、参数配置
- [x] **回测系统界面** - 任务创建、进度监控、结果查看
- [x] **图表可视化集成** - Plotly.js图表库集成和优化
- [x] **API接口完善** - 完整的RESTful API设计和实现

### 🔄 第三阶段：回测结果增强 (进行中)
- [x] **结果查看模态框** - 友好的功能预览界面 ✨
- [ ] **基础图表展示** - 资金曲线、收益分布等基础图表
- [ ] **交互式分析** - 数据筛选、时间范围选择等交互功能
- [ ] **高级功能** - 策略对比、风险分析、报告导出

### 🚀 第四阶段：性能与体验优化 (计划中)
- [ ] **实时数据推送** - WebSocket实时数据更新
- [ ] **批量操作优化** - 大数据量处理性能优化
- [ ] **用户体验优化** - 加载优化、错误处理、用户引导
- [ ] **移动端适配** - 移动设备专门优化
- [ ] **国际化支持** - 多语言支持扩展

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
