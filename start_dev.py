#!/usr/bin/env python3
"""
NagaFlow开发环境启动脚本
同时启动前端和后端开发服务器
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def run_backend():
    """启动后端服务器"""
    print("🚀 Starting backend server...")
    backend_dir = Path(__file__).parent / "backend"
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return
    
    try:
        # 检查是否安装了依赖
        requirements_file = backend_dir / "requirements.txt"
        if requirements_file.exists():
            print("📦 Installing backend dependencies...")
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
            ], cwd=backend_dir, check=True)
        
        # 启动后端服务器
        subprocess.run([
            sys.executable, "main.py"
        ], cwd=backend_dir)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend startup failed: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped")

def run_frontend():
    """启动前端开发服务器"""
    print("🎨 Starting frontend server...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return
    
    try:
        # 检查package.json是否存在
        package_json = frontend_dir / "package.json"
        if not package_json.exists():
            print("❌ package.json not found in frontend directory!")
            return
        
        # 检查node_modules是否存在，如果不存在则安装依赖
        node_modules = frontend_dir / "node_modules"
        if not node_modules.exists():
            print("📦 Installing frontend dependencies...")
            subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        
        # 启动前端开发服务器
        subprocess.run(["npm", "run", "dev"], cwd=frontend_dir)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend startup failed: {e}")
        print("💡 Make sure Node.js and npm are installed")
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")

def main():
    """主函数"""
    print("🌊 NagaFlow Development Environment")
    print("=" * 50)
    
    # 检查Python版本
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    # 检查是否在正确的目录
    if not Path("README.md").exists():
        print("❌ Please run this script from the NagaFlow root directory")
        sys.exit(1)
    
    try:
        # 在后台启动后端
        backend_thread = threading.Thread(target=run_backend, daemon=True)
        backend_thread.start()
        
        # 等待后端启动
        print("⏳ Waiting for backend to start...")
        time.sleep(3)
        
        # 启动前端（主线程）
        run_frontend()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down development servers...")
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()
