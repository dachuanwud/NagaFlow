"""
策略管理API路由
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import os
import sys
import uuid

from datetime import datetime
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession

# 导入现有的策略模块
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'crypto_cta'))

from ..database import get_db
from ..services.database_service import db_service

router = APIRouter()

# 参数类型枚举
class ParameterType(str, Enum):
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    STRING = "string"
    LIST = "list"
    RANGE = "range"

# 参数约束模型
class ParameterConstraint(BaseModel):
    min_value: Optional[Union[int, float]] = None
    max_value: Optional[Union[int, float]] = None
    step: Optional[Union[int, float]] = None
    options: Optional[List[Any]] = None
    default: Any = None
    required: bool = True

# 参数定义模型
class ParameterDefinition(BaseModel):
    name: str
    display_name: str
    description: str
    type: ParameterType
    constraint: ParameterConstraint
    group: Optional[str] = "基础参数"
    order: int = 0

# 因子信息模型
class FactorInfo(BaseModel):
    name: str
    display_name: str
    description: str
    category: str
    parameters: List[ParameterDefinition]
    file_path: str
    is_active: bool = True

# 策略数据模型
class Strategy(BaseModel):
    id: str
    name: str
    description: str
    factors: List[str]  # 使用的因子列表
    parameters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    is_active: bool = True

class StrategyCreate(BaseModel):
    name: str
    description: str
    factors: List[str]
    parameters: Dict[str, Any]

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    factors: Optional[List[str]] = None
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

# 因子配置定义
FACTOR_DEFINITIONS = {
    "sma": FactorInfo(
        name="sma",
        display_name="简单移动平均线",
        description="基于简单移动平均线的趋势跟踪策略",
        category="技术指标",
        parameters=[
            ParameterDefinition(
                name="n",
                display_name="移动平均周期",
                description="计算移动平均线的K线周期数",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=5,
                    max_value=500,
                    step=1,
                    default=200,
                    required=True
                ),
                group="基础参数",
                order=1
            )
        ],
        file_path="crypto_cta/factors/sma.py"
    ),
    "xbx": FactorInfo(
        name="xbx",
        display_name="修正布林带策略",
        description="基于布林带的均值回归策略，增加了bias控制",
        category="技术指标",
        parameters=[
            ParameterDefinition(
                name="n",
                display_name="布林带周期",
                description="计算布林带的K线周期数",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=10,
                    max_value=300,
                    step=1,
                    default=200,
                    required=True
                ),
                group="基础参数",
                order=1
            ),
            ParameterDefinition(
                name="m",
                display_name="标准差倍数",
                description="布林带上下轨的标准差倍数",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=0.5,
                    max_value=5.0,
                    step=0.1,
                    default=2.0,
                    required=True
                ),
                group="基础参数",
                order=2
            ),
            ParameterDefinition(
                name="bias_pct",
                display_name="偏离度阈值",
                description="价格偏离均线的百分比阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=0.01,
                    max_value=0.5,
                    step=0.01,
                    default=0.05,
                    required=True
                ),
                group="风险控制",
                order=3
            )
        ],
        file_path="crypto_cta/factors/xbx.py"
    ),
    "rsi": FactorInfo(
        name="rsi",
        display_name="RSI相对强弱指标",
        description="基于RSI指标的超买超卖策略",
        category="技术指标",
        parameters=[
            ParameterDefinition(
                name="period",
                display_name="RSI周期",
                description="计算RSI的K线周期数",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=5,
                    max_value=50,
                    step=1,
                    default=14,
                    required=True
                ),
                group="基础参数",
                order=1
            ),
            ParameterDefinition(
                name="overbought",
                display_name="超买阈值",
                description="RSI超买区域阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=60,
                    max_value=90,
                    step=1,
                    default=70,
                    required=True
                ),
                group="信号参数",
                order=2
            ),
            ParameterDefinition(
                name="oversold",
                display_name="超卖阈值",
                description="RSI超卖区域阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=10,
                    max_value=40,
                    step=1,
                    default=30,
                    required=True
                ),
                group="信号参数",
                order=3
            )
        ],
        file_path="crypto_cta/factors/rsi.py"
    ),
    "macd": FactorInfo(
        name="macd",
        display_name="MACD指标",
        description="基于MACD指标的趋势跟踪策略",
        category="技术指标",
        parameters=[
            ParameterDefinition(
                name="fast_period",
                display_name="快线周期",
                description="MACD快速EMA周期",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=5,
                    max_value=30,
                    step=1,
                    default=12,
                    required=True
                ),
                group="基础参数",
                order=1
            ),
            ParameterDefinition(
                name="slow_period",
                display_name="慢线周期",
                description="MACD慢速EMA周期",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=15,
                    max_value=50,
                    step=1,
                    default=26,
                    required=True
                ),
                group="基础参数",
                order=2
            ),
            ParameterDefinition(
                name="signal_period",
                display_name="信号线周期",
                description="MACD信号线EMA周期",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=3,
                    max_value=20,
                    step=1,
                    default=9,
                    required=True
                ),
                group="基础参数",
                order=3
            )
        ],
        file_path="crypto_cta/factors/macd.py"
    ),
    "kdj": FactorInfo(
        name="kdj",
        display_name="KDJ随机指标",
        description="基于KDJ指标的超买超卖策略",
        category="技术指标",
        parameters=[
            ParameterDefinition(
                name="period",
                display_name="KDJ周期",
                description="计算KDJ的K线周期数",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=5,
                    max_value=30,
                    step=1,
                    default=9,
                    required=True
                ),
                group="基础参数",
                order=1
            ),
            ParameterDefinition(
                name="k_period",
                display_name="K值平滑周期",
                description="K值的移动平均周期",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=1,
                    max_value=10,
                    step=1,
                    default=3,
                    required=True
                ),
                group="基础参数",
                order=2
            ),
            ParameterDefinition(
                name="d_period",
                display_name="D值平滑周期",
                description="D值的移动平均周期",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=1,
                    max_value=10,
                    step=1,
                    default=3,
                    required=True
                ),
                group="基础参数",
                order=3
            ),
            ParameterDefinition(
                name="overbought",
                display_name="超买阈值",
                description="KDJ超买区域阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=70,
                    max_value=95,
                    step=1,
                    default=80,
                    required=True
                ),
                group="信号参数",
                order=4
            ),
            ParameterDefinition(
                name="oversold",
                display_name="超卖阈值",
                description="KDJ超卖区域阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=5,
                    max_value=30,
                    step=1,
                    default=20,
                    required=True
                ),
                group="信号参数",
                order=5
            )
        ],
        file_path="crypto_cta/factors/kdj.py"
    ),
    "atr_breakout": FactorInfo(
        name="atr_breakout",
        display_name="ATR突破策略",
        description="基于ATR的价格突破策略，适用于趋势行情",
        category="突破策略",
        parameters=[
            ParameterDefinition(
                name="atr_period",
                display_name="ATR周期",
                description="计算ATR的K线周期数",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=10,
                    max_value=50,
                    step=1,
                    default=20,
                    required=True
                ),
                group="基础参数",
                order=1
            ),
            ParameterDefinition(
                name="entry_multiplier",
                display_name="入场倍数",
                description="ATR的入场倍数",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=1.0,
                    max_value=5.0,
                    step=0.1,
                    default=2.0,
                    required=True
                ),
                group="信号参数",
                order=2
            ),
            ParameterDefinition(
                name="exit_multiplier",
                display_name="出场倍数",
                description="ATR的出场倍数",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=0.5,
                    max_value=3.0,
                    step=0.1,
                    default=1.5,
                    required=True
                ),
                group="信号参数",
                order=3
            )
        ],
        file_path="crypto_cta/factors/atr_breakout.py"
    ),
    "mean_reversion": FactorInfo(
        name="mean_reversion",
        display_name="均值回归策略",
        description="基于价格偏离均线的均值回归策略，适用于震荡行情",
        category="均值回归",
        parameters=[
            ParameterDefinition(
                name="period",
                display_name="均线周期",
                description="计算均线和标准差的周期",
                type=ParameterType.INTEGER,
                constraint=ParameterConstraint(
                    min_value=10,
                    max_value=100,
                    step=1,
                    default=20,
                    required=True
                ),
                group="基础参数",
                order=1
            ),
            ParameterDefinition(
                name="entry_threshold",
                display_name="入场阈值",
                description="价格偏离均线的标准差倍数阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=1.0,
                    max_value=4.0,
                    step=0.1,
                    default=2.0,
                    required=True
                ),
                group="信号参数",
                order=2
            ),
            ParameterDefinition(
                name="exit_threshold",
                display_name="出场阈值",
                description="价格回归的标准差倍数阈值",
                type=ParameterType.FLOAT,
                constraint=ParameterConstraint(
                    min_value=0.1,
                    max_value=2.0,
                    step=0.1,
                    default=0.5,
                    required=True
                ),
                group="信号参数",
                order=3
            )
        ],
        file_path="crypto_cta/factors/mean_reversion.py"
    )
}

@router.get("/")
async def list_strategies(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """获取所有策略列表"""
    try:
        strategies = await db_service.get_strategies(db, skip, limit, active_only)
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取策略列表失败: {str(e)}")

@router.get("/factors", response_model=List[FactorInfo])
async def list_available_factors():
    """获取可用的因子列表"""
    try:
        # 返回预定义的因子信息
        factors = list(FACTOR_DEFINITIONS.values())

        # 动态扫描factors目录中的其他因子
        factors_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'crypto_cta', 'factors')

        if os.path.exists(factors_path):
            for file in os.listdir(factors_path):
                if file.endswith('.py') and file != '__init__.py':
                    factor_name = file[:-3]  # 移除.py扩展名

                    # 如果不在预定义列表中，添加基础信息
                    if factor_name not in FACTOR_DEFINITIONS:
                        try:
                            factor_info = FactorInfo(
                                name=factor_name,
                                display_name=factor_name.upper(),
                                description=f"因子: {factor_name}",
                                category="其他",
                                parameters=[
                                    ParameterDefinition(
                                        name="para",
                                        display_name="参数",
                                        description="因子参数",
                                        type=ParameterType.LIST,
                                        constraint=ParameterConstraint(
                                            default=[],
                                            required=False
                                        ),
                                        group="基础参数",
                                        order=1
                                    )
                                ],
                                file_path=os.path.join(factors_path, file)
                            )
                            factors.append(factor_info)
                        except Exception as e:
                            print(f"Error loading factor {factor_name}: {e}")
                            continue

        return factors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list factors: {str(e)}")

@router.get("/{strategy_id}")
async def get_strategy(strategy_id: str, db: AsyncSession = Depends(get_db)):
    """获取特定策略"""
    try:
        strategy = await db_service.get_strategy(db, strategy_id)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        return strategy
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取策略失败: {str(e)}")

@router.post("/")
async def create_strategy(strategy: StrategyCreate, db: AsyncSession = Depends(get_db)):
    """创建新策略"""
    try:
        strategy_data = {
            "id": str(uuid.uuid4()),
            "name": strategy.name,
            "description": strategy.description,
            "factors": strategy.factors,
            "parameters": strategy.parameters,
            "is_active": True,
        }

        new_strategy = await db_service.create_strategy(db, strategy_data)
        return new_strategy
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建策略失败: {str(e)}")

@router.put("/{strategy_id}")
async def update_strategy(
    strategy_id: str,
    strategy_update: StrategyUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新策略"""
    try:
        update_data = strategy_update.model_dump(exclude_unset=True)
        updated_strategy = await db_service.update_strategy(db, strategy_id, update_data)

        if not updated_strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")

        return updated_strategy
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新策略失败: {str(e)}")

@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: str, db: AsyncSession = Depends(get_db)):
    """删除策略"""
    try:
        success = await db_service.delete_strategy(db, strategy_id)
        if not success:
            raise HTTPException(status_code=404, detail="Strategy not found")

        return {"message": "Strategy deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除策略失败: {str(e)}")

@router.get("/{strategy_id}/validate")
async def validate_strategy(strategy_id: str, db: AsyncSession = Depends(get_db)):
    """验证策略配置"""
    try:
        strategy = await db_service.get_strategy(db, strategy_id)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")

        # 这里可以添加策略验证逻辑
        # 例如检查参数是否有效、因子是否存在等

        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }

        # 示例验证逻辑
        if not strategy.get("parameters"):
            validation_result["warnings"].append("No parameters defined")

        return validation_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"验证策略失败: {str(e)}")

@router.post("/{strategy_id}/clone")
async def clone_strategy(
    strategy_id: str,
    new_name: str,
    db: AsyncSession = Depends(get_db)
):
    """克隆策略"""
    try:
        original_strategy = await db_service.get_strategy(db, strategy_id)
        if not original_strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")

        cloned_strategy_data = {
            "id": str(uuid.uuid4()),
            "name": new_name,
            "description": f"Cloned from {original_strategy['name']}",
            "factors": original_strategy["factors"].copy() if original_strategy["factors"] else [],
            "parameters": original_strategy["parameters"].copy() if original_strategy["parameters"] else {},
            "is_active": True,
        }

        cloned_strategy = await db_service.create_strategy(db, cloned_strategy_data)
        return cloned_strategy
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"克隆策略失败: {str(e)}")

@router.get("/factors/categories")
async def get_factor_categories():
    """获取因子分类列表"""
    categories = set()
    for factor_info in FACTOR_DEFINITIONS.values():
        categories.add(factor_info.category)

    return {
        "categories": sorted(list(categories))
    }

@router.get("/factors/{factor_name}", response_model=FactorInfo)
async def get_factor_info(factor_name: str):
    """获取特定因子的详细信息"""
    if factor_name in FACTOR_DEFINITIONS:
        return FACTOR_DEFINITIONS[factor_name]
    else:
        raise HTTPException(status_code=404, detail="Factor not found")

@router.post("/factors/{factor_name}/validate")
async def validate_factor_parameters(factor_name: str, parameters: Dict[str, Any]):
    """验证因子参数"""
    if factor_name not in FACTOR_DEFINITIONS:
        raise HTTPException(status_code=404, detail="Factor not found")

    factor_info = FACTOR_DEFINITIONS[factor_name]
    validation_result = {
        "is_valid": True,
        "errors": [],
        "warnings": []
    }

    # 验证每个参数
    for param_def in factor_info.parameters:
        param_name = param_def.name
        param_value = parameters.get(param_name)

        # 检查必需参数
        if param_def.constraint.required and param_value is None:
            validation_result["errors"].append(f"参数 '{param_def.display_name}' 是必需的")
            validation_result["is_valid"] = False
            continue

        # 如果参数为空且不是必需的，跳过验证
        if param_value is None:
            continue

        # 类型验证
        if param_def.type == ParameterType.INTEGER:
            if not isinstance(param_value, int):
                validation_result["errors"].append(f"参数 '{param_def.display_name}' 必须是整数")
                validation_result["is_valid"] = False
                continue
        elif param_def.type == ParameterType.FLOAT:
            if not isinstance(param_value, (int, float)):
                validation_result["errors"].append(f"参数 '{param_def.display_name}' 必须是数字")
                validation_result["is_valid"] = False
                continue

        # 范围验证
        constraint = param_def.constraint
        if constraint.min_value is not None and param_value < constraint.min_value:
            validation_result["errors"].append(
                f"参数 '{param_def.display_name}' 不能小于 {constraint.min_value}"
            )
            validation_result["is_valid"] = False

        if constraint.max_value is not None and param_value > constraint.max_value:
            validation_result["errors"].append(
                f"参数 '{param_def.display_name}' 不能大于 {constraint.max_value}"
            )
            validation_result["is_valid"] = False

    return validation_result
