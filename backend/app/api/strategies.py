"""
策略管理API路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import sys
from datetime import datetime

# 导入现有的策略模块
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'crypto_cta'))

router = APIRouter()

# 数据模型
class Strategy(BaseModel):
    id: str
    name: str
    description: str
    parameters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    is_active: bool = True

class StrategyCreate(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class FactorInfo(BaseModel):
    name: str
    description: str
    parameters: List[str]
    file_path: str

# 模拟策略数据存储
strategies_db: Dict[str, Strategy] = {}

@router.get("/", response_model=List[Strategy])
async def list_strategies():
    """获取所有策略列表"""
    return list(strategies_db.values())

@router.get("/factors", response_model=List[FactorInfo])
async def list_available_factors():
    """获取可用的因子列表"""
    try:
        factors_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'crypto_cta', 'factors')
        factors = []
        
        if os.path.exists(factors_path):
            for file in os.listdir(factors_path):
                if file.endswith('.py') and file != '__init__.py':
                    factor_name = file[:-3]  # 移除.py扩展名
                    
                    # 尝试导入因子模块获取信息
                    try:
                        factor_info = FactorInfo(
                            name=factor_name,
                            description=f"Factor: {factor_name}",
                            parameters=["para"],  # 默认参数
                            file_path=os.path.join(factors_path, file)
                        )
                        factors.append(factor_info)
                    except Exception as e:
                        print(f"Error loading factor {factor_name}: {e}")
                        continue
        
        return factors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list factors: {str(e)}")

@router.get("/{strategy_id}", response_model=Strategy)
async def get_strategy(strategy_id: str):
    """获取特定策略"""
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return strategies_db[strategy_id]

@router.post("/", response_model=Strategy)
async def create_strategy(strategy: StrategyCreate):
    """创建新策略"""
    import uuid
    
    strategy_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_strategy = Strategy(
        id=strategy_id,
        name=strategy.name,
        description=strategy.description,
        parameters=strategy.parameters,
        created_at=now,
        updated_at=now
    )
    
    strategies_db[strategy_id] = new_strategy
    return new_strategy

@router.put("/{strategy_id}", response_model=Strategy)
async def update_strategy(strategy_id: str, strategy_update: StrategyUpdate):
    """更新策略"""
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy = strategies_db[strategy_id]
    
    if strategy_update.name is not None:
        strategy.name = strategy_update.name
    if strategy_update.description is not None:
        strategy.description = strategy_update.description
    if strategy_update.parameters is not None:
        strategy.parameters = strategy_update.parameters
    if strategy_update.is_active is not None:
        strategy.is_active = strategy_update.is_active
    
    strategy.updated_at = datetime.now()
    
    return strategy

@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: str):
    """删除策略"""
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    del strategies_db[strategy_id]
    return {"message": "Strategy deleted successfully"}

@router.get("/{strategy_id}/validate")
async def validate_strategy(strategy_id: str):
    """验证策略配置"""
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy = strategies_db[strategy_id]
    
    # 这里可以添加策略验证逻辑
    # 例如检查参数是否有效、因子是否存在等
    
    validation_result = {
        "is_valid": True,
        "errors": [],
        "warnings": []
    }
    
    # 示例验证逻辑
    if not strategy.parameters:
        validation_result["warnings"].append("No parameters defined")
    
    return validation_result

@router.post("/{strategy_id}/clone")
async def clone_strategy(strategy_id: str, new_name: str):
    """克隆策略"""
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    import uuid
    
    original_strategy = strategies_db[strategy_id]
    new_strategy_id = str(uuid.uuid4())
    now = datetime.now()
    
    cloned_strategy = Strategy(
        id=new_strategy_id,
        name=new_name,
        description=f"Cloned from {original_strategy.name}",
        parameters=original_strategy.parameters.copy(),
        created_at=now,
        updated_at=now
    )
    
    strategies_db[new_strategy_id] = cloned_strategy
    return cloned_strategy
