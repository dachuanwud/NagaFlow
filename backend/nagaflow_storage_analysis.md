# NagaFlow 项目回测结果存储机制详细说明

## 概述

NagaFlow 项目采用了**双模式存储架构**：支持数据库持久化存储和内存临时存储两种模式。当前系统主要使用**内存存储模式**进行回测结果管理，同时具备完整的数据库存储基础设施。

## 1. 数据库存储基础设施

### 1.1 数据库配置
- **开发环境**: SQLite 数据库
  - 文件路径: `/Users/lishechuan/Downloads/NagaFlow/backend/nagaflow.db`
  - 连接字符串: `sqlite+aiosqlite:///./nagaflow.db`
- **生产环境**: PostgreSQL 数据库（可配置）
  - 支持连接池配置
  - 异步数据库操作

### 1.2 数据库表结构

#### 回测任务表 (backtest_tasks)
```sql
CREATE TABLE backtest_tasks (
    task_id VARCHAR(36) NOT NULL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    progress FLOAT,
    symbols JSON NOT NULL,
    strategy VARCHAR(100) NOT NULL,
    parameters JSON NOT NULL,
    date_start VARCHAR(20) NOT NULL,
    date_end VARCHAR(20) NOT NULL,
    rule_type VARCHAR(10) NOT NULL,
    leverage_rate FLOAT,
    c_rate FLOAT,
    slippage FLOAT,
    symbols_total INTEGER,
    symbols_completed INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at DATETIME
);
```

#### 回测结果表 (backtest_results)
```sql
CREATE TABLE backtest_results (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    strategy VARCHAR(100) NOT NULL,
    parameters JSON NOT NULL,
    final_return FLOAT,
    annual_return FLOAT,
    max_drawdown FLOAT,
    sharpe_ratio FLOAT,
    win_rate FLOAT,
    profit_loss_ratio FLOAT,
    total_trades INTEGER,
    equity_curve JSON,
    trade_records JSON,
    statistics JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### 1.3 数据库索引优化
- **任务查询优化**: `idx_backtest_status_created`, `idx_backtest_strategy`
- **结果查询优化**: `idx_result_task_symbol`, `idx_result_strategy_performance`
- **性能分析优化**: `idx_result_symbol_performance`

## 2. 存储结构详解

### 2.1 BacktestResult 数据模型
```python
class BacktestResult(BaseModel):
    task_id: str                    # 任务ID
    symbol: str                     # 交易对
    strategy: str                   # 策略名称
    parameters: Dict[str, Any]      # 策略参数
    
    # 核心性能指标
    final_return: float             # 最终收益率
    annual_return: float            # 年化收益率
    max_drawdown: float             # 最大回撤
    sharpe_ratio: float             # 夏普比率
    sortino_ratio: float            # 索提诺比率
    calmar_ratio: float             # 卡玛比率
    win_rate: float                 # 胜率
    profit_factor: float            # 盈亏比
    
    # 交易统计
    total_trades: int               # 总交易次数
    winning_trades: int             # 盈利交易次数
    losing_trades: int              # 亏损交易次数
    avg_win: float                  # 平均盈利
    avg_loss: float                 # 平均亏损
    max_consecutive_wins: int       # 最大连续盈利
    max_consecutive_losses: int     # 最大连续亏损
    
    # 风险指标
    volatility: float               # 波动率
    skewness: float                 # 偏度
    kurtosis: float                 # 峰度
    var_95: float                   # 95% VaR
    cvar_95: float                  # 95% CVaR
    
    # 详细数据
    equity_curve: List[Dict[str, Any]]      # 资金曲线
    drawdown_periods: List[DrawdownPeriod]  # 回撤期间
    monthly_returns: List[MonthlyReturn]    # 月度收益
    trade_records: List[TradeRecord]        # 交易记录
    
    # 时间范围信息
    requested_date_start: str       # 用户请求开始时间
    requested_date_end: str         # 用户请求结束时间
    actual_date_start: str          # 实际使用开始时间
    actual_date_end: str            # 实际使用结束时间
    data_records_count: int         # 数据记录数
    time_range_match_status: str    # 时间匹配状态
    time_range_adjustment_reason: str # 时间调整原因
    
    created_at: datetime            # 创建时间
```

### 2.2 交易记录结构
```python
class TradeRecord(BaseModel):
    id: str                         # 交易ID
    symbol: str                     # 交易对
    side: str                       # 买卖方向 ("buy" or "sell")
    quantity: float                 # 交易数量
    price: float                    # 交易价格
    timestamp: datetime             # 交易时间
    pnl: float                      # 盈亏
    commission: float               # 手续费
    slippage: float                 # 滑点
```

## 3. 当前存储实现

### 3.1 内存存储模式（当前主要使用）
- **存储位置**: 全局变量 `backtest_tasks: Dict[str, BacktestStatus]`
- **文件位置**: `backend/app/api/backtest.py` (第357行)
- **特点**:
  - 快速访问和操作
  - 服务重启后数据丢失
  - 适合开发和测试环境

### 3.2 数据库存储模式（已实现但未启用）
- **服务类**: `DatabaseService` (`backend/app/services/database_service.py`)
- **CRUD操作**: `BacktestCRUD` (`backend/app/crud/backtest.py`)
- **特点**:
  - 数据持久化保存
  - 支持复杂查询和分析
  - 适合生产环境

## 4. API 接口

### 4.1 回测结果保存接口
当前系统**没有直接的数据库保存调用**，回测结果存储在内存中：

```python
# 存储到内存
backtest_tasks[task_id] = task_status
task_status.results = backtest_results
```

### 4.2 回测结果检索接口

#### 获取回测状态
```
GET /api/backtest/status/{task_id}
```

#### 获取回测结果
```
GET /api/backtest/results/{task_id}
```

#### 获取任务列表
```
GET /api/backtest/tasks
```

#### 删除任务
```
DELETE /api/backtest/tasks/{task_id}
```

## 5. 前端数据访问

### 5.1 API 调用
前端通过以下服务访问回测数据：
- **文件**: `frontend/src/services/api.ts`
- **主要接口**:
  - `backtestApi.getBacktestStatus(taskId)`
  - `backtestApi.getBacktestResults(taskId)`
  - `backtestApi.listTasks()`

### 5.2 状态管理
- **Store**: `frontend/src/stores/backtestResultsStore.ts`
- **组件**: 
  - `frontend/src/pages/Results/index.tsx`
  - `frontend/src/pages/BacktestPage/BacktestResultsModal.tsx`

## 6. 数据持久化现状

### 6.1 当前状态
- ❌ **回测结果未持久化到数据库**
- ✅ **数据库表结构已创建**
- ✅ **CRUD操作已实现**
- ✅ **数据库服务已配置**
- ❌ **回测API未集成数据库存储**

### 6.2 数据库使用情况
```bash
# 当前数据库为空
sqlite3 nagaflow.db "SELECT COUNT(*) FROM backtest_tasks;"  # 返回: 0
sqlite3 nagaflow.db "SELECT COUNT(*) FROM backtest_results;" # 返回: 0
```

## 7. 存储位置总结

### 7.1 后端存储
- **内存存储**: `backend/app/api/backtest.py` 全局变量
- **数据库文件**: `backend/nagaflow.db` (SQLite)
- **配置文件**: `backend/app/core/config.py`

### 7.2 前端缓存
- **浏览器内存**: 前端组件状态
- **本地存储**: 无持久化存储
- **模拟数据**: 当后端不可用时使用演示数据

## 8. 改进建议

### 8.1 启用数据库存储
1. 修改 `backend/app/api/backtest.py` 中的回测任务函数
2. 集成 `DatabaseService` 进行结果保存
3. 添加数据库依赖注入

### 8.2 数据清理机制
1. 实现定期清理过期任务
2. 添加数据归档功能
3. 设置存储容量限制

### 8.3 查询优化
1. 添加分页查询支持
2. 实现高级筛选功能
3. 优化大数据量查询性能

---

**总结**: NagaFlow 具备完整的数据库存储基础设施，但当前主要使用内存存储模式。要实现数据持久化，需要在回测API中集成已有的数据库服务。
