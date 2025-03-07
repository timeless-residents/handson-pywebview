# api.py
import time
import platform
from datetime import datetime
import psutil


class Api:
    def __init__(self):
        self.prev_net_io = psutil.net_io_counters()
        self.prev_time = time.time()

        # 初期化時にプロセスのCPU使用率を更新
        for proc in psutil.process_iter(["cpu_percent"]):
            try:
                # CPU使用率の初期値を取得（この呼び出しは0を返す）
                proc.cpu_percent()
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass

        # 少し待ってからCPU使用率を再計算できるようにする
        time.sleep(0.1)

    def get_cpu_info(self):
        """CPUの情報と使用率を取得"""
        cpu_percent = psutil.cpu_percent(interval=0.5, percpu=True)
        cpu_freq = psutil.cpu_freq()

        return {
            "percent": cpu_percent,
            "count": psutil.cpu_count(),
            "physical_count": psutil.cpu_count(logical=False),
            "freq_current": cpu_freq.current if cpu_freq else None,
            "freq_max": cpu_freq.max if cpu_freq else None,
            "system": platform.processor(),
        }

    def get_memory_info(self):
        """メモリ使用状況を取得"""
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()

        return {
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percent": memory.percent,
            },
            "swap": {
                "total": swap.total,
                "used": swap.used,
                "free": swap.free,
                "percent": swap.percent,
            },
        }

    def get_disk_info(self):
        """ディスク使用状況を取得"""
        partitions = []
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                partitions.append(
                    {
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": usage.percent,
                    }
                )
            except (PermissionError, FileNotFoundError):
                # 一部のディスクはアクセス権限がない場合がある
                continue

        return {"partitions": partitions, "io_counters": self._get_disk_io()}

    def _get_disk_io(self):
        """ディスクI/O情報を取得"""
        io = psutil.disk_io_counters()
        if io:
            return {
                "read_count": io.read_count,
                "write_count": io.write_count,
                "read_bytes": io.read_bytes,
                "write_bytes": io.write_bytes,
                "read_time": io.read_time,
                "write_time": io.write_time,
            }
        return {}

    def get_network_info(self):
        """ネットワークトラフィック情報を取得"""
        current_net_io = psutil.net_io_counters()
        current_time = time.time()

        # 前回の測定からの経過時間
        time_delta = current_time - self.prev_time

        # 送受信バイト数の差分を計算
        bytes_sent = current_net_io.bytes_sent - self.prev_net_io.bytes_sent
        bytes_recv = current_net_io.bytes_recv - self.prev_net_io.bytes_recv

        # 1秒あたりの送受信速度を計算 (bytes/sec)
        send_rate = bytes_sent / time_delta
        recv_rate = bytes_recv / time_delta

        # 前回の値を更新
        self.prev_net_io = current_net_io
        self.prev_time = current_time

        # ネットワークインターフェース情報
        interfaces = {}
        for name, stats in psutil.net_if_stats().items():
            interfaces[name] = {
                "isup": stats.isup,
                "speed": stats.speed,
                "mtu": stats.mtu,
            }

        return {
            "bytes_sent": current_net_io.bytes_sent,
            "bytes_recv": current_net_io.bytes_recv,
            "packets_sent": current_net_io.packets_sent,
            "packets_recv": current_net_io.packets_recv,
            "send_rate": send_rate,
            "recv_rate": recv_rate,
            "interfaces": interfaces,
        }

    def get_process_list(self):
        """実行中のプロセス一覧を取得"""
        processes = []
        for proc in psutil.process_iter(
            [
                "pid",
                "name",
                "username",
                "cpu_percent",
                "memory_percent",
                "create_time",
                "status",
            ]
        ):
            try:
                pinfo = proc.info
                # 作成時間をフォーマット
                create_time = (
                    datetime.fromtimestamp(pinfo["create_time"]).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                    if pinfo["create_time"]
                    else ""
                )

                processes.append(
                    {
                        "pid": pinfo["pid"],
                        "name": pinfo["name"],
                        "username": pinfo["username"],
                        "cpu_percent": pinfo["cpu_percent"],
                        "memory_percent": pinfo["memory_percent"],
                        "create_time": create_time,
                        "status": pinfo["status"],
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass

        # CPU使用率でソート (None値を0として扱う)
        processes.sort(key=lambda x: x["cpu_percent"] or 0, reverse=True)
        return processes[:100]  # 上位100プロセスのみ返す

    def get_system_info(self):
        """システム全体の情報を取得"""
        return {
            "system": platform.system(),
            "node": platform.node(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        }

    def get_all_info(self):
        """すべてのシステム情報を一度に取得"""
        return {
            "cpu": self.get_cpu_info(),
            "memory": self.get_memory_info(),
            "disk": self.get_disk_info(),
            "network": self.get_network_info(),
            "processes": self.get_process_list(),
            "system": self.get_system_info(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
