# NagaFlow 开发指南

## 📋 项目概述

NagaFlow是一个现代化的Web应用，旨在为您的加密货币量化交易系统提供直观的操作界面。项目采用前后端分离架构，集成了您现有的`bn_data`和`crypto_cta`模块。

## 🏗️ 架构设计

### 技术选型理由

1. **前端 - Vite + React**
   - ✅ Vite提供极快的热模块替换(HMR)
   - ✅ React生态成熟，组件化开发效率高
   - ✅ TypeScript提供类型安全
   - ✅ Ant Design提供企业级UI组件

2. **后端 - FastAPI**
   - ✅ 高性能异步框架，适合数据密集型应用
   - ✅ 自动生成API文档
   - ✅ 与现有Python代码无缝集成
   - ✅ 支持WebSocket实时通信

3. **图表库 - Plotly.js**
   - ✅ 强大的交互式图表功能
   - ✅ 支持金融图表类型
   - ✅ 与您现有的HTML模板兼容

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

```bash
python start_dev.py
```

### 方法二：手动启动

**启动后端：**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**启动前端：**
```bash
cd frontend
npm install
npm run dev
```

## 📁 项目结构详解

```
NagaFlow/
├── frontend/                    # React前端应用
│   ├── src/
│   │   ├── components/         # 可复用组件
│   │   │   └── Layout/        # 布局组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard/     # 仪表板
│   │   │   ├── DataManagement/ # 数据管理
│   │   │   ├── BacktestPage/  # 回测页面
│   │   │   └── ...
│   │   ├── services/          # API服务层
│   │   ├── stores/            # 状态管理(Zustand)
│   │   └── utils/             # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # FastAPI后端应用
│   ├── app/
│   │   ├── api/               # API路由模块
│   │   │   ├── data.py       # 数据管理API
│   │   │   ├── backtest.py   # 回测API
│   │   │   └── strategies.py # 策略管理API
│   │   ├── core/             # 核心配置
│   │   └── models/           # 数据模型
│   ├── main.py               # 应用入口
│   └── requirements.txt
├── bn_data/                    # 现有数据获取模块
├── crypto_cta/                 # 现有回测模块
└── shared/                     # 共享配置和工具
```

## 🔧 开发流程

### 阶段一：基础架构验证（当前阶段）

**已完成：**
- [x] 项目结构搭建
- [x] 前端基础框架（React + Vite + Ant Design）
- [x] 后端API框架（FastAPI）
- [x] 基础路由和布局
- [x] 主题切换功能
- [x] API接口设计

**下一步：**
1. **测试现有模块集成**
   ```bash
   # 测试bn_data模块导入
   cd backend
   python -c "import sys; sys.path.append('../bn_data'); from main import run; print('bn_data模块导入成功')"
   
   # 测试crypto_cta模块导入
   python -c "import sys; sys.path.append('../crypto_cta'); from cta_api.cta_core import base_data; print('crypto_cta模块导入成功')"
   ```

2. **完善API接口实现**
   - 实现数据下载API的实际逻辑
   - 集成回测模块的核心功能
   - 添加错误处理和日志记录

### 阶段二：核心功能开发

**数据管理模块：**
- [ ] 交易对选择界面
- [ ] 数据下载进度实时显示
- [ ] 数据完整性检查
- [ ] 缓存管理功能

**回测模块：**
- [ ] 策略参数配置界面
- [ ] 批量回测任务管理
- [ ] 实时进度监控
- [ ] 结果对比分析

**可视化模块：**
- [ ] 资金曲线图表集成
- [ ] 性能指标仪表板
- [ ] 交互式数据探索

### 阶段三：高级功能

**实时通信：**
- [ ] WebSocket连接管理
- [ ] 实时状态更新
- [ ] 进度推送

**用户体验：**
- [ ] 响应式设计优化
- [ ] 加载状态处理
- [ ] 错误恢复机制

## 🛠️ 开发建议

### 1. 现有模块集成策略

**数据路径配置：**
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # 确保路径指向正确的数据目录
    bn_data_path: str = "../bn_data"
    crypto_cta_path: str = "../crypto_cta"
    data_center_path: str = "../bn_data/output/market"
```

**模块导入优化：**
```python
# 在API路由中安全导入现有模块
try:
    sys.path.append(settings.bn_data_path)
    from main import run as bn_data_run
except ImportError as e:
    logger.error(f"Failed to import bn_data: {e}")
```

### 2. 性能优化建议

**后端优化：**
- 使用异步处理长时间运行的任务
- 实现任务队列管理
- 添加缓存机制

**前端优化：**
- 使用React.memo优化组件渲染
- 实现虚拟滚动处理大量数据
- 使用懒加载优化初始加载时间

### 3. 数据流设计

```
用户操作 → 前端组件 → API调用 → 后端处理 → 现有模块 → 数据库/文件
    ↑                                                      ↓
实时更新 ← WebSocket ← 状态管理 ← 任务队列 ← 异步处理 ← 结果返回
```

## 🔍 调试和测试

### 后端调试
```bash
# 启动调试模式
cd backend
python -m debugpy --listen 5678 --wait-for-client main.py
```

### 前端调试
```bash
# 启动开发服务器（自带热重载）
cd frontend
npm run dev
```

### API测试
访问 http://localhost:8000/docs 查看自动生成的API文档

## 📊 监控和日志

**建议添加的监控指标：**
- API响应时间
- 数据下载进度
- 回测任务状态
- 系统资源使用情况

**日志记录：**
- 用户操作日志
- 系统错误日志
- 性能监控日志

## 🚀 部署建议

### 开发环境
使用提供的`start_dev.py`脚本

### 生产环境
1. 使用Docker容器化部署
2. 配置Nginx反向代理
3. 设置SSL证书
4. 配置监控和日志收集

## 📞 技术支持

如遇到问题，请检查：
1. Python版本是否为3.8+
2. Node.js版本是否为16+
3. 依赖是否正确安装
4. 端口是否被占用（8000, 5173）

## 🎯 下一步行动计划

1. **立即执行：**
   - 运行`python start_dev.py`测试基础架构
   - 验证现有模块导入是否正常
   - 测试API接口是否可访问

2. **本周内完成：**
   - 完善数据管理API的实际实现
   - 创建数据管理页面的基础界面
   - 集成第一个回测功能

3. **两周内完成：**
   - 完成核心功能开发
   - 添加图表可视化
   - 实现实时状态更新

这个架构为您提供了一个坚实的基础，可以逐步扩展和完善功能。建议先从基础功能开始，确保每个模块都能正常工作后再添加高级功能。
