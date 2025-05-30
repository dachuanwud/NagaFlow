# NagaFlow 前后端API对接指南

## 🎯 概述

本指南详细说明了NagaFlow前端与后端API的完整对接过程。我们已经完成了以下主要工作：

### ✅ 已完成的对接工作

1. **API服务层重构** - 完整的类型定义和错误处理
2. **数据管理模块** - 真实的交易对获取和数据下载
3. **回测模块** - 完整的回测任务管理和结果展示
4. **策略管理模块** - 策略CRUD操作和因子管理
5. **仪表板** - 实时统计数据和性能展示
6. **结果分析** - 真实回测结果的可视化

## 🚀 启动步骤

### 1. 启动后端服务

```bash
# 在项目根目录
python main.py
```

后端服务将在 `http://localhost:8000` 启动

### 2. 启动前端服务

```bash
# 进入前端目录
cd frontend

# 安装依赖（如果还没有安装）
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

### 3. 测试API连接

```bash
# 运行API连接测试脚本
python test_api_connection.py
```

## 📋 API端点对接详情

### 数据管理 API

| 端点 | 方法 | 前端组件 | 功能 |
|------|------|----------|------|
| `/api/data/symbols` | GET | DataManagement | 获取交易对列表 |
| `/api/data/status` | GET | DataManagement | 获取数据下载状态 |
| `/api/data/download` | POST | DataManagement | 启动数据下载 |
| `/api/data/market/{symbol}` | GET | DataManagement | 获取市场数据 |

### 回测 API

| 端点 | 方法 | 前端组件 | 功能 |
|------|------|----------|------|
| `/api/backtest/run` | POST | BacktestPage | 启动回测任务 |
| `/api/backtest/tasks` | GET | BacktestPage, Dashboard | 获取任务列表 |
| `/api/backtest/status/{task_id}` | GET | BacktestPage | 获取任务状态 |
| `/api/backtest/results/{task_id}` | GET | Results | 获取回测结果 |

### 策略管理 API

| 端点 | 方法 | 前端组件 | 功能 |
|------|------|----------|------|
| `/api/strategies/` | GET | StrategyManagement, Dashboard | 获取策略列表 |
| `/api/strategies/` | POST | StrategyManagement | 创建新策略 |
| `/api/strategies/{id}` | PUT | StrategyManagement | 更新策略 |
| `/api/strategies/{id}` | DELETE | StrategyManagement | 删除策略 |
| `/api/strategies/factors` | GET | BacktestPage, StrategyManagement | 获取因子列表 |
| `/api/strategies/{id}/clone` | POST | StrategyManagement | 克隆策略 |

## 🔧 主要改进

### 1. API服务层 (`frontend/src/services/api.ts`)

- ✅ 完整的TypeScript类型定义
- ✅ 统一的错误处理机制
- ✅ 用户友好的错误提示
- ✅ 请求超时和重试机制

### 2. 数据格式化工具 (`frontend/src/services/mockApi.ts`)

- ✅ 重构为数据格式化工具
- ✅ 统计计算函数
- ✅ 日期时间格式化
- ✅ 数字和百分比格式化

### 3. 页面组件更新

#### DataManagement
- ✅ 真实的交易对数据获取
- ✅ 实时下载进度显示
- ✅ 单个交易对下载功能
- ✅ 数据状态监控

#### BacktestPage
- ✅ 动态策略因子选择
- ✅ 真实的回测任务创建
- ✅ 任务状态轮询
- ✅ 完整的参数配置

#### StrategyManagement
- ✅ 策略CRUD操作
- ✅ 策略状态切换
- ✅ 策略克隆功能
- ✅ JSON参数编辑

#### Dashboard
- ✅ 实时统计数据
- ✅ 真实的任务状态
- ✅ 动态性能图表
- ✅ 最新活动展示

#### Results
- ✅ 真实回测结果展示
- ✅ 动态策略筛选
- ✅ 资金曲线可视化
- ✅ 详细统计表格

## 🎨 用户体验改进

### 加载状态管理
- ✅ 页面级加载状态
- ✅ 组件级加载指示器
- ✅ 骨架屏占位符
- ✅ 空状态提示

### 错误处理
- ✅ 网络错误提示
- ✅ API错误消息显示
- ✅ 优雅降级处理
- ✅ 重试机制

### 数据刷新
- ✅ 自动状态轮询
- ✅ 手动刷新功能
- ✅ 实时数据更新
- ✅ 缓存管理

## 🔍 测试验证

### 功能测试清单

- [ ] 数据管理页面能正确显示交易对列表
- [ ] 数据下载功能正常工作并显示进度
- [ ] 回测页面能创建和监控任务
- [ ] 策略管理页面CRUD操作正常
- [ ] 仪表板显示实时统计数据
- [ ] 结果页面正确展示回测结果
- [ ] 所有页面的加载状态正常
- [ ] 错误处理机制工作正常

### API测试

运行测试脚本验证所有API端点：

```bash
python test_api_connection.py
```

## 🚨 注意事项

### 1. 后端服务依赖
确保后端服务正常运行，包括：
- 数据库连接正常
- 币安API配置正确
- 所有依赖包已安装

### 2. 网络配置
- 前端默认连接 `http://localhost:8000`
- 如需修改，请更新 `frontend/src/services/api.ts` 中的 `baseURL`

### 3. 数据初始化
- 首次使用需要下载交易对数据
- 建议先创建一些测试策略
- 运行几个回测任务以获得结果数据

## 🔄 下一步计划

### 短期优化
1. 添加WebSocket实时通信
2. 实现参数优化功能
3. 增强图表交互性
4. 添加数据导出功能

### 长期规划
1. 用户认证和权限管理
2. 多用户支持
3. 云端部署配置
4. 性能监控和日志

## 📞 技术支持

如果在对接过程中遇到问题，请检查：

1. 后端服务是否正常启动
2. API端点是否返回正确数据
3. 前端控制台是否有错误信息
4. 网络连接是否正常

通过运行测试脚本可以快速诊断大部分连接问题。
