# NagaFlow - 加密货币量化交易Web应用

[![开发状态](https://img.shields.io/badge/开发状态-活跃开发中-brightgreen)](https://github.com/dachuanwud/NagaFlow)
[![前端状态](https://img.shields.io/badge/前端-已完成-success)](http://localhost:5173)
[![后端状态](https://img.shields.io/badge/后端-已完成-success)](http://localhost:8000)
[![数据库](https://img.shields.io/badge/数据库-SQLite%2FPostgreSQL-blue)](./backend/app/core/config.py)

NagaFlow是一个现代化的Web应用界面，专为加密货币量化交易系统设计。它提供直观的操作界面和强大的数据分析功能，集成了数据获取、策略回测、结果分析等完整的量化交易工作流。系统采用真实市场数据，支持多种CTA策略，具备完整的数据库持久化功能。

## ✨ 最新更新 (2025-01-25)

🚀 **项目架构全面优化**
- 前后端完整分离架构，支持独立部署和扩展
- 智能端口检测系统，自动避免端口冲突
- 完善的错误处理和日志系统

💾 **数据库系统增强**
- 完整的SQLAlchemy 2.0+ ORM集成
- 支持SQLite (开发) 和 PostgreSQL (生产) 双数据库
- Alembic数据库迁移管理
- 灵活的内存/持久化存储切换

🎨 **用户界面完善**
- 响应式设计，完美适配移动端
- 深色/浅色主题无缝切换
- 完整的中文本地化支持
- 现代化组件库和动画效果

📊 **功能完成度**: 95% (核心功能完成，持续优化体验)

## 🚀 技术栈

### 前端技术
- **Vite 6.0.1** - 下一代前端构建工具
- **React 18.3.1** - 现代化UI框架，支持并发特性
- **TypeScript 5.6.3** - 类型安全的JavaScript超集
- **Ant Design 5.22.2** - 企业级UI组件库
- **Plotly.js 2.35.2** - 强大的交互式图表库
- **React Router 6.28.0** - 声明式路由管理
- **Framer Motion 11.18.2** - 流畅的动画效果库
- **Zustand 5.0.1** - 轻量级状态管理
- **Axios 1.7.7** - HTTP客户端，支持请求拦截
- **Day.js 1.11.13** - 轻量级日期处理库
- **Styled Components 6.1.13** - CSS-in-JS样式方案

### 后端技术
- **FastAPI 0.104.1+** - 高性能异步API框架
- **Python 3.8+** - 现代Python特性支持
- **Pydantic 2.5.0+** - 数据验证和序列化
- **Uvicorn** - 高性能ASGI服务器
- **SQLAlchemy 2.0+** - 现代化异步ORM框架
- **Alembic 1.13.0+** - 数据库迁移工具
- **AsyncPG 0.29.0+** - PostgreSQL异步驱动
- **AIOSQLite 0.19.0+** - SQLite异步驱动
- **WebSocket** - 实时双向通信支持

### 数据分析库
- **Pandas 2.2.0+** - 数据处理和分析
- **NumPy 1.26.0+** - 数值计算基础库
- **Joblib 1.3.2+** - 并行计算支持

### 数据来源
- **本地预处理数据** - 预处理的币安历史数据文件
- **Binance API** - 实时数据获取备用方案
- **Pickle格式** - 高效的数据存储和读取

### 集成模块
- **crypto_cta** - CTA策略回测与评估模块

## 📁 项目结构

```text
NagaFlow/
├── frontend/                           # Vite + React前端应用
│   ├── src/
│   │   ├── components/                # 可复用组件
│   │   │   ├── Layout/               # 应用布局组件
│   │   │   ├── Loading/              # 加载状态组件
│   │   │   ├── Charts/               # 图表组件库
│   │   │   ├── BacktestResults/      # 回测结果组件
│   │   │   ├── ErrorBoundary/        # 错误边界组件
│   │   │   ├── EnhancedLoading/      # 增强加载组件
│   │   │   ├── TimeRangeHint/        # 时间范围提示
│   │   │   ├── FactorConfiguration/  # 因子配置组件
│   │   │   ├── Animation/            # 动画组件
│   │   │   └── UI/                   # 基础UI组件
│   │   ├── pages/                    # 页面组件
│   │   │   ├── Dashboard/            # 仪表板页面
│   │   │   ├── DataManagement/       # 数据管理页面
│   │   │   ├── StrategyManagement/   # 策略管理页面
│   │   │   ├── BacktestPage/         # 回测页面
│   │   │   └── Results/              # 结果分析页面
│   │   ├── services/                 # API服务层
│   │   │   ├── api.ts               # 统一API接口
│   │   │   └── mockApi.ts           # 模拟数据服务
│   │   ├── stores/                   # Zustand状态管理
│   │   ├── hooks/                    # 自定义React Hooks
│   │   ├── styles/                   # 样式系统
│   │   │   ├── designSystem.ts      # 设计系统配置
│   │   │   └── globalStyles.css     # 全局样式
│   │   └── locales/                  # 国际化配置
│   │       └── zh-CN.ts             # 中文本地化
│   ├── package.json                  # 前端依赖配置
│   ├── vite.config.ts               # Vite配置
│   ├── tsconfig.json                # TypeScript配置
│   └── eslint.config.js             # ESLint配置
├── backend/                          # FastAPI后端应用
│   ├── app/
│   │   ├── api/                     # API路由模块
│   │   │   ├── data.py             # 数据管理API
│   │   │   ├── backtest.py         # 回测API (3300+行)
│   │   │   └── strategies.py       # 策略管理API (700+行)
│   │   ├── core/                   # 核心配置
│   │   │   └── config.py           # 应用配置
│   │   ├── database/               # 数据库模块
│   │   │   ├── base.py            # 数据库基类
│   │   │   ├── connection.py      # 异步连接管理
│   │   │   └── models/            # 数据模型定义
│   │   ├── crud/                   # 数据库操作层
│   │   ├── models/                 # SQLAlchemy模型
│   │   │   ├── strategy.py        # 策略模型
│   │   │   ├── backtest.py        # 回测模型
│   │   │   └── data_status.py     # 数据状态模型
│   │   └── services/               # 业务逻辑层
│   │       ├── data_adapter.py    # 数据适配器
│   │       ├── local_data_manager.py # 本地数据管理器
│   │       └── database_service.py # 数据库服务
│   ├── alembic/                    # 数据库迁移
│   │   └── versions/              # 迁移版本文件
│   ├── scripts/                    # 工具脚本
│   │   └── init_db.py             # 数据库初始化
│   ├── static/                     # 静态文件
│   ├── main.py                     # 应用入口
│   ├── requirements.txt            # 后端依赖配置
│   ├── alembic.ini                 # Alembic配置
│   ├── nagaflow.db                # SQLite数据库文件
│   └── venv/                      # Python虚拟环境
├── crypto_cta/                     # CTA策略模块
│   ├── factors/                   # 策略因子库
│   ├── cta_api/                   # CTA API接口
│   ├── data/                      # 数据处理模块
│   ├── config.py                  # CTA配置文件
│   └── requirements.txt           # CTA模块依赖
├── start_dev.py                    # 一键启动脚本 (560行)
├── .gitignore                      # Git忽略文件
└── README.md                       # 项目说明文档
```

## 🛠️ 快速启动

### 🚀 方法一：一键启动脚本（强烈推荐）

使用我们提供的智能启动脚本，一键启动前后端服务：

```bash
# 确保脚本有执行权限
chmod +x start_dev.py

# 启动所有服务
./start_dev.py
```

**脚本功能特性:**
- ✅ **智能环境检查** - 自动检测Python 3.8+、Node.js、npm
- ✅ **路径自动配置** - 自动设置macOS Homebrew路径
- ✅ **依赖管理** - 自动检查并安装前后端依赖
- ✅ **端口智能分配** - 自动检测并分配可用端口
- ✅ **虚拟环境支持** - 自动识别和使用Python虚拟环境
- ✅ **健康检查** - 完整的服务启动验证
- ✅ **进程监控** - 实时监控服务状态
- ✅ **优雅退出** - 安全的进程清理和资源释放

**端口分配策略:**
- 后端服务: 8000-8004 (自动选择可用端口)
- 前端服务: 5173, 3000-3004 (自动选择可用端口)

### 🔧 方法二：手动启动

#### 后端服务

```bash
# 1. 进入后端目录
cd backend

# 2. 激活虚拟环境（可选，推荐）
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 3. 安装依赖（首次运行）
pip install -r requirements.txt

# 4. 启动后端服务器
python main.py
```

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

### 🧪 服务验证

启动完成后，访问以下地址验证服务状态：

- **前端应用**: http://localhost:5173 (或显示的实际端口)
- **后端API**: http://localhost:8000 (或显示的实际端口)
- **API文档**: http://localhost:8000/docs (Swagger UI)
- **健康检查**: http://localhost:8000/health

### 💾 数据库配置

#### 开发环境 (SQLite - 默认)
```bash
# 无需额外配置，自动创建数据库文件
./start_dev.py
```

#### 生产环境 (PostgreSQL)
```bash
# 1. 复制环境配置模板
cp backend/.env.example backend/.env

# 2. 编辑配置文件
nano backend/.env

# 配置示例:
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_USER=nagaflow
# POSTGRES_PASSWORD=your_password
# POSTGRES_DB=nagaflow

# 3. 运行数据库迁移
cd backend
alembic upgrade head
```

#### 数据库管理命令
```bash
cd backend

# 初始化数据库
python scripts/init_db.py

# 生成新的迁移文件
alembic revision --autogenerate -m "描述信息"

# 执行迁移
alembic upgrade head

# 查看迁移历史
alembic history

# 回滚到指定版本
alembic downgrade <revision>
```

## 🎯 核心功能

### 📊 1. 数据管理 (✅ 已完成)
- **数据源管理**: 本地预处理数据文件 + Binance API备用
- **交易对支持**: 币安现货(spot)和期货(swap)交易对
- **数据格式**: Pickle格式存储，高效读取和处理
- **智能适配**: 自动检测数据可用性和格式转换
- **实时获取**: Binance API实时数据获取(备用方案)
- **状态监控**: 数据可用性和质量监控

### 🎯 2. 策略管理 (✅ 已完成)
- **完整CRUD**: 策略创建、读取、更新、删除
- **因子库集成**: 动态加载现有策略因子
- **参数配置**: 灵活的JSON格式参数设置
- **策略验证**: 参数有效性检查和验证
- **策略克隆**: 快速复制和修改现有策略
- **因子配置器**: 可视化因子参数配置界面

### 🚀 3. 回测系统 (✅ 已完成)
- **批量回测**: 多交易对并行回测支持
- **实时监控**: 回测进度实时显示和状态轮询
- **任务管理**: 完整的回测任务生命周期管理
- **结果持久化**: 回测结果数据库存储
- **错误处理**: 完善的异常处理和错误提示
- **调试支持**: 开发模式下的详细调试信息

### 📈 4. 结果分析 (🔄 持续优化)
- **统计面板**: 详细的性能指标统计
- **交互式图表**: 基于Plotly.js的动态图表
- **数据筛选**: 多维度数据筛选和排序
- **结果查看**: 模态框形式的友好预览
- **导出功能**: 支持多种格式的结果导出

### 🎨 5. 用户界面 (✅ 已完成)
- **响应式设计**: 完美适配桌面、平板、移动设备
- **主题系统**: 深色/浅色主题无缝切换
- **设计系统**: 统一的颜色、字体、间距规范
- **动画效果**: 基于Framer Motion的流畅动画
- **错误边界**: 完善的错误处理和用户反馈
- **加载状态**: 多种加载状态指示器

### 💾 6. 数据库系统 (✅ 已完成)
- **双数据库支持**: SQLite开发 + PostgreSQL生产
- **异步ORM**: SQLAlchemy 2.0异步支持
- **迁移管理**: Alembic自动化数据库迁移
- **连接池**: 高效的数据库连接池管理
- **事务支持**: 完整的事务处理机制
- **模式切换**: 内存/持久化存储动态切换

## 📊 API接口文档

### 🔗 服务地址
- **前端应用**: http://localhost:5173 (或自动分配端口)
- **后端API**: http://localhost:8000 (或自动分配端口)
- **API文档**: http://localhost:8000/docs (Swagger交互文档)
- **ReDoc文档**: http://localhost:8000/redoc (ReDoc风格文档)

### 📡 数据管理API
```http
GET /api/data/symbols?trade_type=swap     # 获取交易对列表
POST /api/data/download                   # 启动数据下载任务
GET /api/data/status                      # 获取下载状态
GET /api/data/market/{symbol}             # 获取市场数据
DELETE /api/data/cache                    # 清理数据缓存
```

### 🚀 回测管理API
```http
POST /api/backtest/run                    # 创建回测任务
GET /api/backtest/status/{task_id}        # 获取任务状态
GET /api/backtest/results/{task_id}       # 获取回测结果
GET /api/backtest/tasks                   # 获取任务列表
DELETE /api/backtest/tasks/{task_id}      # 删除回测任务
POST /api/backtest/optimize               # 参数优化
```

### 🎯 策略管理API
```http
GET /api/strategies/                      # 获取策略列表
POST /api/strategies/                     # 创建新策略
GET /api/strategies/{id}                  # 获取策略详情
PUT /api/strategies/{id}                  # 更新策略
DELETE /api/strategies/{id}               # 删除策略
GET /api/strategies/factors               # 获取因子列表
POST /api/strategies/{id}/clone           # 克隆策略
```

### 🏥 系统管理API
```http
GET /health                               # 健康检查
GET /                                     # 服务信息
GET /admin/database-info                  # 数据库信息
POST /admin/switch-storage-mode           # 切换存储模式
```

## 🎯 开发计划与路线图

### ✅ 第一阶段：基础架构 (已完成)
- [x] **FastAPI后端框架** - 完整的异步API框架搭建
- [x] **React前端架构** - TypeScript + Ant Design完整集成
- [x] **响应式布局** - 移动端适配的布局系统
- [x] **模块集成** - crypto_cta和bn_data模块完整集成
- [x] **开发工具链** - ESLint、TypeScript、Vite配置优化

### ✅ 第二阶段：核心功能 (已完成)
- [x] **数据管理系统** - 完整的数据下载和管理功能
- [x] **策略管理系统** - 策略CRUD和因子配置
- [x] **回测执行引擎** - 高性能并行回测系统
- [x] **状态管理** - Zustand状态管理集成
- [x] **API接口** - 完整的RESTful API设计

### ✅ 第三阶段：数据库集成 (已完成)
- [x] **SQLAlchemy集成** - 异步ORM和模型设计
- [x] **数据库迁移** - Alembic迁移管理系统
- [x] **双数据库支持** - SQLite/PostgreSQL切换
- [x] **数据持久化** - 策略、回测、结果持久化
- [x] **连接池管理** - 高效的数据库连接管理

### 🔄 第四阶段：用户体验优化 (进行中)
- [x] **主题系统** - 深色/浅色主题切换
- [x] **设计系统** - 统一的设计语言和组件
- [x] **动画效果** - 流畅的页面切换动画
- [ ] **实时通知** - WebSocket实时消息推送
- [ ] **高级图表** - 更丰富的数据可视化

### 🚀 第五阶段：性能与扩展 (计划中)
- [ ] **性能优化** - 前端代码分割和懒加载
- [ ] **缓存策略** - Redis缓存集成
- [ ] **监控系统** - 应用性能监控
- [ ] **容器化部署** - Docker容器化支持
- [ ] **CI/CD集成** - 自动化构建和部署

## 🛠️ 开发指南

### 环境要求
- **Python**: 3.8+ (推荐3.10+)
- **Node.js**: 16+ (推荐18+ LTS)
- **npm**: 8+ (或yarn、pnpm)
- **Git**: 最新版本

### 代码规范
- **Python**: 遵循PEP 8规范，使用Black格式化
- **TypeScript**: 严格模式，ESLint规则检查
- **提交信息**: 使用约定式提交规范

### 调试技巧
```bash
# 前端调试
npm run dev -- --debug

# 后端调试
uvicorn main:app --reload --log-level debug

# 数据库调试
export DATABASE_ECHO=true
```

## 🤝 贡献指南

1. **Fork项目** - 在GitHub上Fork项目
2. **创建分支** - `git checkout -b feature/新功能`
3. **开发测试** - 编写代码并测试
4. **提交代码** - `git commit -m 'feat: 添加新功能'`
5. **推送分支** - `git push origin feature/新功能`
6. **创建PR** - 在GitHub上创建Pull Request

### 问题反馈
- **GitHub Issues**: [项目Issues页面](https://github.com/dachuanwud/NagaFlow/issues)
- **功能请求**: 使用Feature Request模板
- **Bug报告**: 使用Bug Report模板

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **项目仓库**: [NagaFlow GitHub](https://github.com/dachuanwud/NagaFlow)
- **问题反馈**: [GitHub Issues](https://github.com/dachuanwud/NagaFlow/issues)
- **邮箱联系**: 1755645633@qq.com

---

**NagaFlow** - 专业的加密货币量化交易Web应用平台 🌊

*构建下一代量化交易系统，让数据驱动投资决策*

## 🔄 数据来源说明

### 主要数据源
NagaFlow使用预处理的本地数据文件作为主要数据源：

- **数据格式**: Pickle文件 (`.pkl`)
- **数据类型**: 币安现货(spot)和期货(swap)历史数据
- **时间粒度**: 1小时K线数据
- **存储结构**: 
  - `spot_dict.pkl` - 现货数据字典
  - `swap_dict.pkl` - 期货数据字典

### 备用数据源
当本地数据不可用时，系统自动切换到备用方案：

- **Binance API**: 官方币安API实时获取
- **数据覆盖**: 支持多个时间周期 (1m, 5m, 15m, 1H, 4H, 1D)
- **自动重试**: 多API源智能切换
- **数据验证**: 完整性和质量检查

### 数据配置
系统支持灵活的数据源配置：

```python
# 本地数据管理器配置
data_dir = "/path/to/your/data/directory"

# 支持的市场类型
market_types = ["spot", "swap", "all"]

# 数据格式转换
symbol_format = "BTCUSDT" -> "BTC-USDT" (本地格式)
```
