# CTA加密货币量化策略回测框架

## 项目概述

**CryptoCustomersTraditionalAdvisor (CTA)** 是一个专业的加密货币量化策略回测框架，专为数字资产交易策略的开发、验证和优化而设计。该框架提供了完整的技术分析工具链，支持多币种、多周期的策略回测，并集成了高级的风险管理功能。

### 核心特性

- 🚀 **高效数据处理**: 基于Pandas和Numba优化的数据处理引擎
- 📊 **多维度回测**: 支持多币种、多周期、多参数并行回测
- 🔧 **模块化架构**: 策略、回测引擎、评估模块完全解耦
- 📈 **丰富的技术指标**: 内置MACD、RSI、KDJ、SMA、ATR等经典指标
- 💰 **精确的成本建模**: 考虑手续费、滑点、杠杆和保证金要求
- 📋 **专业评估体系**: 提供超过20种量化评估指标
- 🎯 **风险控制**: 内置止盈止损和仓位管理机制
- 📊 **可视化分析**: 自动生成资金曲线和策略表现图表

## 项目结构

```
crypto_cta/
├── config.py                 # 全局配置文件
├── requirements.txt          # 项目依赖
├── min_amount.py            # 最小交易量处理
├── 最小下单量.csv           # 交易所最小下单量数据
├── 
├── 1_kline_data.py          # 数据预处理脚本
├── 2_fast_backview.py       # 单策略快速回测
├── 3_fastover.py            # 参数优化回测
├── 4_strategy_evaluate.py   # 策略评估分析
├── 
├── data/                    # 数据存储目录
│   └── pickle_data/         # 处理后的数据文件
├── 
├── cta_api/                 # 核心回测引擎
│   ├── cta_core.py         # 回测核心逻辑
│   ├── function.py         # 工具函数库
│   ├── statistics.py       # 统计分析模块
│   ├── evaluate.py         # 策略评估模块
│   ├── position.py         # 仓位管理模块
│   ├── reader.py           # 数据读取模块
│   └── tools.py            # 辅助工具
└── 
└── factors/                 # 策略因子库
    ├── __init__.py
    ├── sma.py              # 简单移动平均策略
    ├── macd.py             # MACD策略
    ├── rsi.py              # RSI策略
    ├── kdj.py              # KDJ策略
    ├── mean_reversion.py   # 均值回归策略
    ├── atr_breakout.py     # ATR突破策略
    └── xbx.py              # 自定义策略
```

## 快速开始

### 环境配置

1. **创建虚拟环境**
```bash
conda create -n crypto_cta python=3.8.19
conda activate crypto_cta
```

2. **安装依赖包**
```bash
pip install -r requirements.txt
```

### 数据配置

在 `config.py` 中配置数据路径：

```python
# K线数据路径配置
data_center_path = 'D:/gitlab的项目/bn_data/output/market/swap_1m'
time_interval = '1m'

# 回测币种配置
symbol_list = ['1000PEPE-USDT']  # 可配置多个币种
```

### 基本使用流程

#### 1. 数据预处理
```bash
python 1_kline_data.py
```
- 从原始数据中心读取K线数据
- 进行数据清洗和格式标准化
- 生成多周期聚合数据
- 保存为高效的feather格式

#### 2. 策略回测
```bash
python 2_fast_backview.py
```
- 执行单策略单参数回测
- 生成详细的交易记录
- 输出策略表现指标

#### 3. 参数优化
```bash
python 3_fastover.py
```
- 执行参数空间遍历
- 多进程并行计算
- 生成参数优化结果

#### 4. 策略评估
```bash
python 4_strategy_evaluate.py
```
- 生成综合评估报告
- 可视化分析结果
- 对比基准表现

## 策略开发指南

### 策略文件结构

每个策略需要在 `factors/` 目录下创建独立的Python文件，包含以下两个核心函数：

```python
def signal(df, para=[200, 2], proportion=1, leverage_rate=1):
    """
    生成交易信号的核心函数
    
    Args:
        df: 包含OHLCV数据的DataFrame
        para: 策略参数列表
        proportion: 止盈止损比例
        leverage_rate: 杠杆倍数
    
    Returns:
        包含signal列的DataFrame
    """
    # 策略逻辑实现
    return df

def para_list():
    """
    定义参数遍历范围
    
    Returns:
        参数组合列表
    """
    return [[i] for i in range(20, 300, 20)]
```

### 信号定义规范

- `signal = 1`: 开多仓信号
- `signal = -1`: 开空仓信号  
- `signal = 0`: 平仓信号
- `signal = NaN`: 无操作

### 示例：SMA双均线策略

```python
def signal(df, para=[200], proportion=1, leverage_rate=1):
    n = para[0]
    
    # 计算双均线
    df['ma_short'] = df['close'].rolling(n, min_periods=1).mean()
    df['ma_long'] = df['ma_short'].rolling(n, min_periods=1).mean()
    
    # 做多信号：短线上穿长线
    condition1 = df['ma_short'] > df['ma_long']
    condition2 = df['ma_short'].shift(1) <= df['ma_long'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 1
    
    # 平仓信号：短线下穿长线
    condition1 = df['ma_short'] < df['ma_long']
    condition2 = df['ma_short'].shift(1) >= df['ma_long'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 0
    
    # 合并信号并去重
    df['signal'] = df['signal_long']
    temp = df[df['signal'].notnull()][['signal']]
    temp = temp[temp['signal'] != temp['signal'].shift(1)]
    df['signal'] = temp['signal']
    
    # 应用止盈止损
    df = process_stop_loss_close(df, proportion, leverage_rate)
    
    return df
```

## 配置参数详解

### 回测配置

```python
# 基本配置
symbol_list = ['1000PEPE-USDT']     # 回测币种列表
para = [180]                        # 策略参数
signal_name_list = ['sma']          # 策略名称列表
rule_type_list = ['1H']             # 时间周期列表
date_start = '2021-01-01'           # 回测开始时间
date_end = '2025-01-01'             # 回测结束时间

# 交易成本配置
c_rate = 8/10000                    # 手续费率 (0.08%)
slippage = 1/1000                   # 滑点率 (0.1%)
leverage_rate = 1                   # 杠杆倍数
min_margin_ratio = 1/100            # 最低保证金率

# 风险控制
proportion = 0.5                    # 止盈止损比例
drop_days = 10                      # 新币种上线后等待天数
```

### 高级配置

```python
# 分段回测模式
per_eva = 'a'      # 'y'=按年, 'm'=按月, 'w'=按周, 'a'=全部

# 性能优化
multiple_process = True             # 是否启用多进程
del_mode = True                     # 是否删除历史结果
cover_curve = False                 # 是否绘制参数覆盖曲线
```

## 输出结果说明

### 目录结构
```
data/output/
├── equity_curve/           # 资金曲线文件
├── para/                   # 参数遍历结果
├── pic/                    # 策略图表
└── para_pic/              # 参数热力图
```

### 核心评估指标

- **收益指标**: 累积净值、年化收益率、月度收益率
- **风险指标**: 最大回撤、波动率、下行风险
- **风险调整收益**: 夏普比率、卡玛比率、索提诺比率
- **交易指标**: 胜率、盈亏比、平均持仓天数
- **资金效率**: 资金利用率、杠杆效率

### 可视化输出

1. **资金曲线图**: 策略净值走势与基准对比
2. **回撤分析图**: 历史回撤分布和恢复时间
3. **参数热力图**: 参数空间表现分布 (2D参数)
4. **参数平原图**: 单参数敏感性分析 (1D参数)

## 性能优化

### 数据处理优化
- 使用feather格式存储，提升I/O性能
- 基于Numba的JIT编译加速计算密集型函数
- 智能内存管理，避免大数据集内存溢出

### 并行计算
- 多进程并行回测不同币种
- 参数遍历的并行化处理
- CPU核心数自适应调度

### 存储优化
- 分层存储策略，热数据内存缓存
- 压缩存储历史数据
- 增量式数据更新机制

## 风险提示

⚠️ **重要声明**

1. **仅供研究学习**: 本框架仅用于量化策略研究和学习，不构成投资建议
2. **历史表现不代表未来**: 回测结果基于历史数据，无法保证未来表现
3. **市场风险**: 数字资产投资存在高风险，可能导致本金损失
4. **技术风险**: 策略可能存在逻辑缺陷或数据偏差
5. **流动性风险**: 实盘交易可能面临滑点和流动性不足问题

## 技术支持

### 环境要求
- Python 3.8+
- 8GB+ RAM (推荐16GB)
- 多核CPU (支持并行计算)

### 依赖库版本
- pandas >= 1.3.0
- numpy >= 1.19.0  
- numba >= 0.53.0
- matplotlib >= 3.4.0
- plotly >= 5.3.0

### 常见问题

**Q: 数据文件格式错误？**
A: 确保原始数据为标准OHLCV格式，运行数据预处理脚本进行标准化。

**Q: 内存不足错误？**
A: 减少并行进程数量，或分批处理大量币种数据。

**Q: 策略信号异常？**
A: 检查策略逻辑中的边界条件和数据完整性。

## 版本更新

### v2.1.0 (2024-10-29)
- 修复手续费计算问题
- 增加自动化功能模块
- 优化内存使用效率

### v2.0.0 (2024-10-25)
- 增加轮动策略功能
- 完善CTA轮动框架
- 提升回测引擎性能

### v1.1.0 (2024-10-16)
- 修正年化收益率计算方法
- 增加更多评估指标
- 优化图表展示效果

## 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交Issue和Pull Request来改进项目：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**免责声明**: 本框架仅用于教育和研究目的。任何基于此框架的投资决策风险自负。投资有风险，入市需谨慎。 