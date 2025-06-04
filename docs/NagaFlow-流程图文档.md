# NagaFlow 系统流程图文档

本文档基于NagaFlow工程代码的实际实现，详细展示各个核心模块的工作流程。

## 1. 应用启动流程图

基于 `start_dev.py` 的实际实现：

```mermaid
flowchart TD
    A[启动 start_dev.py] --> B[打印启动头部信息]
    B --> C[检查系统要求]
    C --> D{Python 3.8+?}
    D -->|否| E[❌ 退出程序]
    D -->|是| F[检查项目目录结构]
    F --> G{目录完整?}
    G -->|否| E
    G -->|是| H[设置环境变量]
    
    H --> I[检查Node.js和npm]
    I --> J{Node.js可用?}
    J -->|否| K[❌ 提示安装Node.js]
    K --> E
    J -->|是| L[设置后端环境]
    
    L --> M[检查虚拟环境venv/]
    M --> N{虚拟环境存在?}
    N -->|是| O[使用虚拟环境Python]
    N -->|否| P[使用系统Python]
    O --> Q[安装后端依赖]
    P --> Q
    Q --> R[设置前端环境]
    
    R --> S[检查node_modules/]
    S --> T{依赖已安装?}
    T -->|否| U[运行 npm install]
    T -->|是| V[检查可用端口]
    U --> V
    
    V --> W[后端端口检测 8000-8004]
    W --> X[启动后端服务器]
    X --> Y[uvicorn main:app --reload]
    Y --> Z[前端端口检测 5173,3000-3004]
    Z --> AA[启动前端服务器]
    AA --> BB[npm run dev]
    
    BB --> CC[等待服务启动]
    CC --> DD[健康检查]
    DD --> EE{服务正常?}
    EE -->|否| FF[⚠️ 显示警告]
    EE -->|是| GG[✅ 显示服务信息]
    FF --> GG
    GG --> HH[进程监控循环]
    
    HH --> II{进程存活?}
    II -->|是| JJ[等待5秒]
    JJ --> II
    II -->|否| KK[❌ 进程异常退出]
    
    style A fill:#e1f5fe
    style E fill:#ffebee
    style GG fill:#e8f5e8
    style KK fill:#ffebee
```

## 2. FastAPI应用生命周期流程

基于 `backend/main.py` 的实际实现：

```mermaid
flowchart TD
    A[FastAPI应用启动] --> B[执行lifespan函数]
    B --> C[设置日志配置]
    C --> D[添加模块路径到sys.path]
    D --> E{使用内存存储?}
    
    E -->|否| F[初始化数据库连接]
    F --> G[await init_db]
    G --> H[创建SQLAlchemy引擎]
    H --> I[设置连接池]
    I --> J[数据库服务切换到持久化模式]
    
    E -->|是| K[数据库服务切换到内存模式]
    K --> L[配置CORS中间件]
    J --> L
    
    L --> M[注册静态文件服务]
    M --> N[注册API路由]
    N --> O[/api/data - 数据管理]
    O --> P[/api/backtest - 回测]
    P --> Q[/api/strategies - 策略管理]
    Q --> R[端口可用性检测]
    
    R --> S[启动Uvicorn服务器]
    S --> T[应用运行中...]
    T --> U[接收到关闭信号]
    U --> V{使用持久化存储?}
    V -->|是| W[关闭数据库连接]
    V -->|否| X[清理内存数据]
    W --> Y[应用关闭完成]
    X --> Y
    
    style A fill:#e1f5fe
    style Y fill:#fff3e0
    style T fill:#e8f5e8
```

## 3. 数据获取与处理流程

基于 `backend/app/services/data_adapter.py` 和 `local_data_manager.py` 的实际实现：

```mermaid
flowchart TD
    A[数据请求] --> B[DataAdapter.get_symbol_data_for_backtest]
    B --> C[LocalDataManager._load_data]
    C --> D{数据已加载?}
    D -->|是| E[使用缓存数据]
    D -->|否| F[加载本地数据文件]
    
    F --> G[加载spot_dict.pkl]
    G --> H[加载swap_dict.pkl]
    H --> I[数据加载完成标记]
    I --> E
    
    E --> J[优先尝试spot数据]
    J --> K{spot数据存在?}
    K -->|是| L[使用spot数据]
    K -->|否| M[尝试swap数据]
    M --> N{swap数据存在?}
    N -->|是| O[使用swap数据]
    N -->|否| P[❌ 数据不可用]
    
    L --> Q[转换交易对格式]
    O --> Q
    Q --> R[BTCUSDT -> BTC-USDT]
    R --> S[数据清洗和标准化]
    S --> T[移除无效数据]
    T --> U[确保时间列格式正确]
    U --> V[按时间排序]
    V --> W[添加必要列]
    W --> X[为回测准备数据格式]
    X --> Y[✅ 返回处理后数据]
    
    style A fill:#e1f5fe
    style P fill:#ffebee
    style Y fill:#e8f5e8
```

## 4. 回测执行详细流程

基于 `backend/app/api/backtest.py` 的实际实现：

```mermaid
flowchart TD
    A[POST /api/backtest/run] --> B[解析BacktestRequest]
    B --> C[生成任务ID]
    C --> D[创建BackgroundTask]
    D --> E[run_backtest_task开始]
    
    E --> F[遍历每个交易对]
    F --> G[run_real_backtest]
    G --> H[优先加载本地数据]
    H --> I{本地数据可用?}
    I -->|是| J[使用本地真实数据]
    I -->|否| K[尝试Binance API]
    
    K --> L[fetch_real_binance_data]
    L --> M[尝试多个API源]
    M --> N[fapi.binance.com]
    N --> O[api.binance.com]
    O --> P{API获取成功?}
    P -->|否| Q[❌ 数据获取失败]
    P -->|是| R[数据验证]
    J --> R
    
    R --> S[validate_real_data]
    S --> T[计算策略信号]
    T --> U{crypto_cta可用?}
    U -->|否| V[❌ 抛出异常]
    U -->|是| W[calculate_real_factor_signals]
    
    W --> X[导入crypto_cta因子模块]
    X --> Y[转换参数格式]
    Y --> Z[调用因子信号计算]
    Z --> AA[计算资金曲线]
    AA --> BB[calculate_equity_curve_simple]
    BB --> CC[应用杠杆、手续费、滑点]
    CC --> DD[计算统计指标]
    DD --> EE[calculate_backtest_statistics]
    
    EE --> FF[计算年化收益率]
    FF --> GG[计算夏普比率]
    GG --> HH[计算最大回撤]
    HH --> II[生成回测结果]
    II --> JJ[保存到数据库/内存]
    JJ --> KK[更新任务状态]
    KK --> LL{还有更多交易对?}
    LL -->|是| F
    LL -->|否| MM[✅ 回测完成]
    
    style A fill:#e1f5fe
    style V fill:#ffebee
    style Q fill:#ffebee
    style MM fill:#e8f5e8
```

## 5. 策略信号计算流程

基于 `crypto_cta` 模块集成的实际实现：

```mermaid
flowchart TD
    A[策略信号计算请求] --> B[calculate_strategy_signals]
    B --> C{crypto_cta模块可用?}
    C -->|否| D[❌ 抛出模块不可用异常]
    C -->|是| E[calculate_real_factor_signals]
    
    E --> F[转换参数格式]
    F --> G[convert_params_to_factor_format]
    G --> H[API参数 -> 因子para格式]
    H --> I[导入因子模块]
    I --> J[import_crypto_cta_factor]
    
    J --> K{因子模块存在?}
    K -->|否| L[尝试内置因子]
    K -->|是| M[使用crypto_cta真实因子]
    
    L --> N[get_builtin_factor]
    N --> O[BuiltinFactor类]
    O --> P[选择策略类型]
    P --> Q[SMA/RSI/MACD/KDJ/ATR]
    
    M --> R[调用因子.signal方法]
    Q --> S[计算对应信号]
    R --> T[因子计算完成]
    S --> T
    
    T --> U[ensure_position_lag]
    U --> V[确保仓位延迟]
    V --> W[添加交易信号列]
    W --> X[pos列: 1买入/-1卖出/0无仓位]
    X --> Y[✅ 返回带信号的DataFrame]
    
    style A fill:#e1f5fe
    style D fill:#ffebee
    style Y fill:#e8f5e8
```

## 6. 数据库操作流程

基于 SQLAlchemy 异步实现：

```mermaid
flowchart TD
    A[数据库操作请求] --> B{存储模式?}
    B -->|内存模式| C[MemoryStorage操作]
    B -->|持久化模式| D[DatabaseService操作]
    
    C --> E[内存字典存储]
    E --> F[strategies_memory]
    F --> G[backtest_results_memory]
    G --> H[直接内存读写]
    H --> I[✅ 内存操作完成]
    
    D --> J[获取异步数据库会话]
    J --> K[get_db依赖注入]
    K --> L{数据库类型?}
    L -->|SQLite| M[SQLite异步引擎]
    L -->|PostgreSQL| N[PostgreSQL异步引擎]
    
    M --> O[AIOSQLite驱动]
    N --> P[AsyncPG驱动]
    O --> Q[执行SQL操作]
    P --> Q
    
    Q --> R[策略CRUD操作]
    R --> S[Strategy模型]
    S --> T[回测CRUD操作]
    T --> U[BacktestTask模型]
    U --> V[数据状态操作]
    V --> W[DataStatus模型]
    W --> X[事务提交]
    X --> Y{操作成功?}
    Y -->|是| Z[✅ 数据库操作完成]
    Y -->|否| AA[回滚事务]
    AA --> BB[❌ 操作失败]
    
    style A fill:#e1f5fe
    style I fill:#e8f5e8
    style Z fill:#e8f5e8
    style BB fill:#ffebee
```

## 7. 前端-后端交互流程

基于实际的API接口实现：

```mermaid
flowchart TD
    A[前端React组件] --> B[Axios HTTP请求]
    B --> C[Vite代理配置]
    C --> D[/api路径代理]
    D --> E[FastAPI后端]
    
    E --> F{请求路径?}
    F -->|/api/data/*| G[数据管理API]
    F -->|/api/strategies/*| H[策略管理API]
    F -->|/api/backtest/*| I[回测API]
    
    G --> J[获取交易对列表]
    J --> K[DataAdapter.get_usdt_symbols_async]
    K --> L[LocalDataManager.get_available_symbols]
    L --> M[返回USDT交易对]
    
    H --> N[策略CRUD操作]
    N --> O{存储模式?}
    O -->|内存| P[内存策略存储]
    O -->|数据库| Q[SQLAlchemy操作]
    P --> R[返回策略数据]
    Q --> R
    
    I --> S[回测任务管理]
    S --> T[BackgroundTasks]
    T --> U[异步回测执行]
    U --> V[进度状态更新]
    V --> W[WebSocket推送(计划中)]
    
    M --> X[JSON响应]
    R --> X
    V --> X
    X --> Y[前端状态更新]
    Y --> Z[UI重新渲染]
    Z --> AA[✅ 用户界面更新]
    
    style A fill:#e1f5fe
    style AA fill:#e8f5e8
    style W fill:#fff3e0
```

## 8. 系统整体架构流程

基于完整的技术栈实现：

```mermaid
flowchart TB
    subgraph "前端层 (Frontend)"
        A[React 18.3.1] --> B[TypeScript 5.6.3]
        B --> C[Ant Design 5.22.2]
        C --> D[Zustand状态管理]
        D --> E[Axios HTTP客户端]
    end
    
    subgraph "构建工具 (Build Tools)"
        F[Vite 6.0.1] --> G[ESLint配置]
        G --> H[代理配置]
    end
    
    subgraph "后端层 (Backend)"
        I[FastAPI 0.104.1+] --> J[Pydantic 2.5.0+]
        J --> K[Uvicorn ASGI服务器]
        K --> L[异步路由处理]
    end
    
    subgraph "数据处理层 (Data Layer)"
        M[DataAdapter] --> N[LocalDataManager]
        N --> O[本地Pickle文件]
        O --> P[Binance API备用]
    end
    
    subgraph "策略计算层 (Strategy Layer)"
        Q[crypto_cta模块] --> R[因子库]
        R --> S[信号计算]
        S --> T[回测引擎]
    end
    
    subgraph "数据库层 (Database Layer)"
        U[SQLAlchemy 2.0+] --> V[Alembic迁移]
        V --> W{数据库类型}
        W --> X[SQLite开发环境]
        W --> Y[PostgreSQL生产环境]
    end
    
    subgraph "部署层 (Deployment)"
        Z[start_dev.py启动脚本] --> AA[端口智能分配]
        AA --> BB[进程监控]
        BB --> CC[健康检查]
    end
    
    E --> H
    H --> I
    L --> M
    M --> Q
    Q --> U
    U --> Z
    
    style A fill:#e3f2fd
    style I fill:#e8f5e8
    style M fill:#fff3e0
    style Q fill:#f3e5f5
    style U fill:#e0f2f1
    style Z fill:#fce4ec
```

## 总结

以上流程图严格基于NagaFlow工程代码的实际实现，详细展示了：

1. **启动流程**: 从环境检查到服务启动的完整过程
2. **应用生命周期**: FastAPI应用的初始化和关闭流程
3. **数据处理**: 本地数据文件到回测数据的转换过程
4. **回测执行**: 从请求到结果的完整回测流程
5. **策略计算**: crypto_cta模块的因子计算流程
6. **数据库操作**: 内存和持久化存储的双模式支持
7. **前后端交互**: HTTP API的完整请求响应流程
8. **系统架构**: 多层架构的组件交互关系

这些流程图可以帮助开发者快速理解系统的工作机制，便于维护和扩展开发。 