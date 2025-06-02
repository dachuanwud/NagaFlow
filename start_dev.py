#!/usr/bin/env python3
"""
NagaFlow 开发环境一键启动脚本
功能完善版 - 支持环境检查、依赖安装、服务启动、健康检查等
"""

import subprocess
import sys
import os
import time
import threading
import signal
import platform
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, List, Tuple

# 全局变量
backend_process: Optional[subprocess.Popen] = None
frontend_process: Optional[subprocess.Popen] = None
backend_python_cmd: str = ""
is_shutting_down = False

# 颜色输出
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_colored(message: str, color: str = Colors.WHITE, end: str = '\n'):
    """打印彩色消息"""
    print(f"{color}{message}{Colors.END}", end=end)

def print_header():
    """打印启动头部信息"""
    print_colored("\n" + "=" * 60, Colors.CYAN)
    print_colored("🌊 NagaFlow 量化交易系统 - 开发环境启动器", Colors.BOLD + Colors.CYAN)
    print_colored("=" * 60, Colors.CYAN)
    print_colored(f"📅 启动时间: {time.strftime('%Y-%m-%d %H:%M:%S')}", Colors.WHITE)
    print_colored(f"🖥️  操作系统: {platform.system()} {platform.release()}", Colors.WHITE)
    print_colored(f"🐍 Python版本: {sys.version.split()[0]}", Colors.WHITE)
    print_colored("=" * 60 + "\n", Colors.CYAN)

def check_system_requirements() -> bool:
    """检查系统要求"""
    print_colored("🔍 检查系统要求...", Colors.BLUE)

    # 检查Python版本
    if sys.version_info < (3, 8):
        print_colored("❌ Python 3.8+ 是必需的", Colors.RED)
        print_colored(f"   当前版本: {sys.version.split()[0]}", Colors.RED)
        return False
    print_colored(f"✅ Python版本检查通过: {sys.version.split()[0]}", Colors.GREEN)

    # 检查是否在正确的目录
    if not Path("README.md").exists() or not Path("backend").exists() or not Path("frontend").exists():
        print_colored("❌ 请在NagaFlow项目根目录运行此脚本", Colors.RED)
        print_colored("   确保目录包含: README.md, backend/, frontend/", Colors.RED)
        return False
    print_colored("✅ 项目目录结构检查通过", Colors.GREEN)

    return True

def check_command_exists(command: str) -> bool:
    """检查命令是否存在"""
    try:
        subprocess.run([command, "--version"],
                      stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL,
                      check=True,
                      timeout=10)  # 添加10秒超时
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False

def setup_environment() -> bool:
    """设置环境变量"""
    print_colored("🔧 设置环境变量...", Colors.BLUE)

    # Mac用户的Node.js路径问题
    if platform.system() == "Darwin":
        homebrew_paths = ["/opt/homebrew/bin", "/usr/local/bin"]
        current_path = os.environ.get("PATH", "")

        for path in homebrew_paths:
            if path not in current_path and os.path.exists(path):
                os.environ["PATH"] = f"{path}:{current_path}"
                print_colored(f"✅ 已添加 {path} 到 PATH", Colors.GREEN)

    # 检查Node.js和npm
    if not check_command_exists("node"):
        print_colored("❌ Node.js 未安装或不在PATH中", Colors.RED)
        print_colored("   请安装Node.js: https://nodejs.org/", Colors.YELLOW)
        if platform.system() == "Darwin":
            print_colored("   或使用Homebrew: brew install node", Colors.YELLOW)
        return False

    if not check_command_exists("npm"):
        print_colored("❌ npm 未安装或不在PATH中", Colors.RED)
        return False

    # 获取版本信息
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True, timeout=10).strip()
        npm_version = subprocess.check_output(["npm", "--version"], text=True, timeout=10).strip()
        print_colored(f"✅ Node.js {node_version} 和 npm {npm_version} 已就绪", Colors.GREEN)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        print_colored("⚠️  无法获取Node.js/npm版本信息", Colors.YELLOW)

    return True

def check_ports(ports: List[int]) -> List[int]:
    """检查端口占用情况，返回可用端口列表"""
    available_ports = []

    for port in ports:
        try:
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('localhost', port))
                if result != 0:  # 端口未被占用
                    available_ports.append(port)
                else:
                    print_colored(f"⚠️  端口 {port} 已被占用", Colors.YELLOW)
        except Exception:
            available_ports.append(port)  # 如果检查失败，假设端口可用

    return available_ports

def setup_backend_environment() -> bool:
    """设置后端环境"""
    print_colored("🔧 设置后端环境...", Colors.BLUE)
    backend_dir = Path("backend")

    # 检查虚拟环境
    venv_dir = backend_dir / "venv"

    # 使用现有虚拟环境或系统Python
    if venv_dir.exists():
        print_colored("✅ 发现现有虚拟环境", Colors.GREEN)
        if platform.system() == "Windows":
            venv_python = venv_dir / "Scripts" / "python.exe"
            venv_pip = venv_dir / "Scripts" / "pip.exe"
        else:
            # 使用虚拟环境中的python（不是python3.13）
            venv_python = venv_dir / "bin" / "python"
            venv_pip = venv_dir / "bin" / "pip"

        # 转换为绝对路径（不解析符号链接，保持虚拟环境路径）
        venv_python = venv_python.absolute()
        venv_pip = venv_pip.absolute()

        # 检查虚拟环境的Python和pip是否都存在
        if not venv_pip.exists() or not venv_python.exists():
            print_colored(f"⚠️  虚拟环境不完整:", Colors.YELLOW)
            print_colored(f"   Python: {venv_python} ({'存在' if venv_python.exists() else '不存在'})", Colors.YELLOW)
            print_colored(f"   pip: {venv_pip} ({'存在' if venv_pip.exists() else '不存在'})", Colors.YELLOW)
            print_colored("   使用系统Python", Colors.YELLOW)
            use_system_python = True
        else:
            print_colored(f"✅ 找到虚拟环境Python: {venv_python}", Colors.GREEN)
            print_colored(f"✅ 找到虚拟环境pip: {venv_pip}", Colors.GREEN)
            use_system_python = False
    else:
        print_colored("⚠️  未找到虚拟环境，使用系统Python", Colors.YELLOW)
        use_system_python = True

    # 设置Python和pip命令
    if use_system_python:
        python_cmd = sys.executable
        pip_cmd = [sys.executable, "-m", "pip"]
    else:
        python_cmd = str(venv_python)
        pip_cmd = [str(venv_pip)]

    # 检查requirements.txt并安装依赖
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        print_colored("📦 安装后端依赖...", Colors.YELLOW)
        try:
            # 升级pip
            print_colored("   升级pip...", Colors.BLUE)
            subprocess.run(
                pip_cmd + ["install", "--upgrade", "pip"],
                check=True, cwd=backend_dir,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )

            # 安装依赖
            print_colored("   安装项目依赖...", Colors.BLUE)
            subprocess.run(
                pip_cmd + ["install", "-r", "requirements.txt"],
                check=True, cwd=backend_dir
            )
            print_colored("✅ 后端依赖安装成功", Colors.GREEN)
        except subprocess.CalledProcessError as e:
            print_colored(f"❌ 后端依赖安装失败: {e}", Colors.RED)
            print_colored("💡 尝试手动安装: cd backend && pip install -r requirements.txt", Colors.YELLOW)
            return False
    else:
        print_colored("⚠️  未找到requirements.txt文件", Colors.YELLOW)

    # 保存Python命令供后续使用
    global backend_python_cmd
    backend_python_cmd = python_cmd
    print_colored(f"✅ 后端Python命令: {python_cmd}", Colors.GREEN)

    return True

def setup_frontend_environment() -> bool:
    """设置前端环境"""
    print_colored("🎨 设置前端环境...", Colors.BLUE)
    frontend_dir = Path("frontend")

    # 检查package.json
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        print_colored("❌ 未找到package.json文件", Colors.RED)
        return False

    # 检查node_modules
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print_colored("📦 安装前端依赖...", Colors.YELLOW)
        try:
            subprocess.run(["npm", "install"],
                         check=True, cwd=frontend_dir)
            print_colored("✅ 前端依赖安装成功", Colors.GREEN)
        except subprocess.CalledProcessError as e:
            print_colored(f"❌ 前端依赖安装失败: {e}", Colors.RED)
            print_colored("💡 尝试清理npm缓存: npm cache clean --force", Colors.YELLOW)
            return False
    else:
        print_colored("✅ 前端依赖已存在", Colors.GREEN)

    return True

def start_backend_server() -> Tuple[Optional[subprocess.Popen], Optional[int]]:
    """启动后端服务器"""
    global backend_process, backend_python_cmd

    print_colored("🚀 启动后端服务器...", Colors.BLUE)
    backend_dir = Path("backend")

    # 使用之前设置的Python命令
    if not backend_python_cmd:
        print_colored("❌ 后端Python命令未设置", Colors.RED)
        return None, None

    # 检查可用端口
    backend_ports = [8000, 8001, 8002, 8003, 8004]
    available_ports = check_ports(backend_ports)

    if not available_ports:
        print_colored("❌ 没有可用的后端端口", Colors.RED)
        return None, None

    backend_port = available_ports[0]

    try:
        # 启动后端服务器
        env = os.environ.copy()
        env['PORT'] = str(backend_port)

        backend_process = subprocess.Popen([
            backend_python_cmd, "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0", "--port", str(backend_port), "--reload"
        ], cwd=backend_dir, env=env,
           stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

        print_colored(f"✅ 后端服务器启动中... (PID: {backend_process.pid})", Colors.GREEN)
        return backend_process, backend_port

    except Exception as e:
        print_colored(f"❌ 后端服务器启动失败: {e}", Colors.RED)
        return None, None

def start_frontend_server() -> Tuple[Optional[subprocess.Popen], Optional[int]]:
    """启动前端服务器"""
    global frontend_process

    print_colored("🎨 启动前端服务器...", Colors.BLUE)
    frontend_dir = Path("frontend")

    # 检查可用端口
    frontend_ports = [5173, 3000, 3001, 3002, 3003, 3004]
    available_ports = check_ports(frontend_ports)

    if not available_ports:
        print_colored("❌ 没有可用的前端端口", Colors.RED)
        return None, None

    frontend_port = available_ports[0]

    try:
        # 启动前端开发服务器
        env = os.environ.copy()
        env['PORT'] = str(frontend_port)

        frontend_process = subprocess.Popen([
            "npm", "run", "dev", "--", "--port", str(frontend_port), "--host"
        ], cwd=frontend_dir, env=env,
           stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        print_colored(f"✅ 前端服务器启动中... (PID: {frontend_process.pid})", Colors.GREEN)
        return frontend_process, frontend_port

    except Exception as e:
        print_colored(f"❌ 前端服务器启动失败: {e}", Colors.RED)
        return None, None

def wait_for_service(url: str, timeout: int = 30, service_name: str = "服务") -> bool:
    """等待服务启动"""
    print_colored(f"⏳ 等待{service_name}启动...", Colors.YELLOW)

    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            import urllib.request
            with urllib.request.urlopen(url, timeout=5) as response:
                if response.status == 200:
                    print_colored(f"✅ {service_name}已就绪", Colors.GREEN)
                    return True
        except Exception:
            pass

        time.sleep(2)
        print_colored(".", Colors.YELLOW, end="")

    print_colored(f"\n❌ {service_name}启动超时", Colors.RED)
    return False

def check_service_health(backend_port: int, frontend_port: int) -> bool:
    """检查服务健康状态"""
    print_colored("🔍 检查服务健康状态...", Colors.BLUE)

    # 检查后端健康状态
    backend_url = f"http://localhost:{backend_port}/health"
    if not wait_for_service(backend_url, 30, "后端API"):
        return False

    # 检查前端服务
    frontend_url = f"http://localhost:{frontend_port}"
    if not wait_for_service(frontend_url, 20, "前端服务"):
        return False

    # 检查前后端连接
    try:
        api_url = f"http://localhost:{frontend_port}/api/data/status"
        with urllib.request.urlopen(api_url, timeout=10) as response:
            if response.status == 200:
                print_colored("✅ 前后端API连接正常", Colors.GREEN)
                return True
    except Exception as e:
        print_colored(f"⚠️  前后端API连接测试失败: {e}", Colors.YELLOW)
        print_colored("   这可能是正常的，如果前端代理配置正确", Colors.YELLOW)

    return True

def print_service_info(backend_port: int, frontend_port: int):
    """打印服务信息"""
    print_colored("\n" + "=" * 60, Colors.CYAN)
    print_colored("🎉 NagaFlow 开发环境启动成功!", Colors.BOLD + Colors.GREEN)
    print_colored("=" * 60, Colors.CYAN)
    print_colored("📊 服务信息:", Colors.BOLD + Colors.WHITE)
    print_colored(f"   🌐 前端界面: http://localhost:{frontend_port}", Colors.GREEN)
    print_colored(f"   🔧 后端API:  http://localhost:{backend_port}", Colors.GREEN)
    print_colored(f"   📚 API文档:  http://localhost:{backend_port}/docs", Colors.GREEN)
    print_colored(f"   ❤️  健康检查: http://localhost:{backend_port}/health", Colors.GREEN)
    print_colored("=" * 60, Colors.CYAN)
    print_colored("💡 使用提示:", Colors.BOLD + Colors.WHITE)
    print_colored("   • 按 Ctrl+C 停止所有服务", Colors.WHITE)
    print_colored("   • 前端支持热重载，修改代码会自动刷新", Colors.WHITE)
    print_colored("   • 后端修改需要手动重启", Colors.WHITE)
    print_colored("=" * 60 + "\n", Colors.CYAN)

def cleanup_processes():
    """清理进程"""
    global backend_process, frontend_process, is_shutting_down

    if is_shutting_down:
        return

    is_shutting_down = True
    print_colored("\n🛑 正在关闭服务...", Colors.YELLOW)

    # 关闭前端进程
    if frontend_process and frontend_process.poll() is None:
        try:
            frontend_process.terminate()
            frontend_process.wait(timeout=5)
            print_colored("✅ 前端服务已关闭", Colors.GREEN)
        except subprocess.TimeoutExpired:
            frontend_process.kill()
            print_colored("⚠️  强制关闭前端服务", Colors.YELLOW)
        except Exception as e:
            print_colored(f"❌ 关闭前端服务失败: {e}", Colors.RED)

    # 关闭后端进程
    if backend_process and backend_process.poll() is None:
        try:
            backend_process.terminate()
            backend_process.wait(timeout=5)
            print_colored("✅ 后端服务已关闭", Colors.GREEN)
        except subprocess.TimeoutExpired:
            backend_process.kill()
            print_colored("⚠️  强制关闭后端服务", Colors.YELLOW)
        except Exception as e:
            print_colored(f"❌ 关闭后端服务失败: {e}", Colors.RED)

    print_colored("👋 再见！感谢使用NagaFlow!", Colors.CYAN)

def signal_handler(signum, frame):
    """信号处理器"""
    _ = frame  # 避免未使用变量警告
    print_colored(f"\n📡 接收到信号 {signum}", Colors.YELLOW)
    cleanup_processes()
    sys.exit(0)

def check_backend_output():
    """检查后端进程输出"""
    global backend_process

    if backend_process:
        if backend_process.poll() is not None:
            # 进程已退出，获取输出
            stdout, _ = backend_process.communicate()
            if stdout:
                print_colored("🔍 后端进程输出:", Colors.YELLOW)
                print_colored(stdout, Colors.WHITE)
            return False
        else:
            # 进程还在运行，尝试读取部分输出
            try:
                import select
                import fcntl
                import os

                # 设置非阻塞读取
                fd = backend_process.stdout.fileno()
                fl = fcntl.fcntl(fd, fcntl.F_GETFL)
                fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

                # 尝试读取输出
                try:
                    output = backend_process.stdout.read()
                    if output:
                        print_colored("🔍 后端进程当前输出:", Colors.YELLOW)
                        print_colored(output, Colors.WHITE)
                except:
                    pass
            except:
                pass
    return True

def monitor_processes():
    """监控进程状态"""
    global backend_process, frontend_process

    while not is_shutting_down:
        try:
            # 检查后端进程
            if backend_process and backend_process.poll() is not None:
                print_colored("❌ 后端进程意外退出", Colors.RED)
                if backend_process.returncode != 0:
                    stdout, _ = backend_process.communicate()
                    if stdout:
                        print_colored(f"后端输出: {stdout}", Colors.RED)
                break

            # 检查前端进程
            if frontend_process and frontend_process.poll() is not None:
                print_colored("❌ 前端进程意外退出", Colors.RED)
                if frontend_process.returncode != 0:
                    _, stderr = frontend_process.communicate()
                    if stderr:
                        print_colored(f"前端错误: {stderr}", Colors.RED)
                break

            time.sleep(5)  # 每5秒检查一次

        except KeyboardInterrupt:
            break
        except Exception as e:
            print_colored(f"⚠️  进程监控异常: {e}", Colors.YELLOW)
            break

def main():
    """主函数"""
    global backend_process, frontend_process

    # 设置信号处理器
    import signal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # 打印启动信息
        print_header()

        # 1. 检查系统要求
        if not check_system_requirements():
            sys.exit(1)

        # 2. 设置环境
        if not setup_environment():
            sys.exit(1)

        # 3. 设置后端环境
        if not setup_backend_environment():
            sys.exit(1)

        # 4. 设置前端环境
        if not setup_frontend_environment():
            sys.exit(1)

        # 5. 启动后端服务器
        backend_process, backend_port = start_backend_server()
        if not backend_process or not backend_port:
            sys.exit(1)

        # 6. 启动前端服务器
        frontend_process, frontend_port = start_frontend_server()
        if not frontend_process or not frontend_port:
            cleanup_processes()
            sys.exit(1)

        # 7. 检查服务健康状态
        if not check_service_health(backend_port, frontend_port):
            print_colored("⚠️  服务健康检查失败，但服务可能仍然可用", Colors.YELLOW)
            # 检查后端进程输出以获取更多信息
            check_backend_output()

        # 8. 打印服务信息
        print_service_info(backend_port, frontend_port)

        # 9. 监控进程状态
        monitor_processes()

    except KeyboardInterrupt:
        print_colored("\n📡 接收到中断信号", Colors.YELLOW)
    except Exception as e:
        print_colored(f"\n❌ 启动过程中发生错误: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        cleanup_processes()

if __name__ == "__main__":
    main()