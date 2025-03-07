# api.py
import os
import json
import datetime
import time
import threading
from typing import Dict, Any


class Api:
    def __init__(self):
        # 現在のディレクトリを取得
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # データ保存用のディレクトリとファイルパス
        self.data_dir = os.path.join(self.current_dir, "data")
        self.tasks_file = os.path.join(self.data_dir, "tasks.json")
        self.categories_file = os.path.join(self.data_dir, "categories.json")

        # ディレクトリが存在しない場合は作成
        os.makedirs(self.data_dir, exist_ok=True)

        # 初期データの読み込み
        self.tasks = self._load_data(self.tasks_file, [])
        self.categories = self._load_data(
            self.categories_file,
            [
                {"id": 1, "name": "仕事", "color": "#4caf50"},
                {"id": 2, "name": "個人", "color": "#2196f3"},
                {"id": 3, "name": "買い物", "color": "#ff9800"},
                {"id": 4, "name": "その他", "color": "#9e9e9e"},
            ],
        )

        # 通知用のタイマー
        self.notification_timer = None
        self.notification_callbacks = []
        self._start_notification_timer()

    def _load_data(self, file_path: str, default_data: Any) -> Any:
        """JSONファイルからデータを読み込む"""
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            else:
                # ファイルが存在しない場合はデフォルトデータを保存
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(default_data, f, ensure_ascii=False, indent=2)
                return default_data
        except Exception as e:
            print(f"データ読み込みエラー: {str(e)}")
            return default_data

    def _save_data(self, file_path: str, data: Any) -> bool:
        """データをJSONファイルに保存"""
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"データ保存エラー: {str(e)}")
            return False

    def _start_notification_timer(self):
        """通知用のタイマーを開始"""

        def check_deadlines():
            while True:
                # 現在の日時
                now = datetime.datetime.now()
                today = now.strftime("%Y-%m-%d")

                # 今日が締め切りのタスクを検索
                due_tasks = [
                    task for task in self.tasks if task.get("dueDate") == today
                ]

                # 通知があれば通知コールバックを呼び出す
                if due_tasks and self.notification_callbacks:
                    for callback in self.notification_callbacks:
                        try:
                            callback(due_tasks)
                        except Exception as e:
                            print(f"通知コールバックエラー: {str(e)}")

                # 1時間ごとにチェック
                time.sleep(3600)

        # バックグラウンドスレッドで実行
        self.notification_timer = threading.Thread(target=check_deadlines, daemon=True)
        self.notification_timer.start()

    def register_notification_callback(self, callback):
        """通知コールバックを登録"""
        self.notification_callbacks.append(callback)
        return {"status": "success"}

    def get_tasks(self):
        """すべてのタスクを取得"""
        return {"status": "success", "tasks": self.tasks}

    def get_categories(self):
        """すべてのカテゴリーを取得"""
        return {"status": "success", "categories": self.categories}

    def add_task(self, task_data: Dict[str, Any]):
        """新しいタスクを追加"""
        try:
            # タスクIDを生成（既存の最大ID + 1）
            task_id = 1
            if self.tasks:
                task_id = max(task.get("id", 0) for task in self.tasks) + 1

            # タスクデータを作成
            task = {
                "id": task_id,
                "title": task_data.get("title", ""),
                "description": task_data.get("description", ""),
                "categoryId": task_data.get("categoryId", 4),  # デフォルトは「その他」
                "priority": task_data.get("priority", 2),  # デフォルトは「中」
                "dueDate": task_data.get("dueDate", ""),
                "completed": False,
                "createdAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            # タスクを追加
            self.tasks.append(task)

            # データを保存
            if self._save_data(self.tasks_file, self.tasks):
                return {"status": "success", "task": task}
            else:
                return {"status": "error", "message": "タスクの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"タスク追加エラー: {str(e)}"}

    def update_task(self, task_id: int, task_data: Dict[str, Any]):
        """タスクを更新"""
        try:
            # タスクを検索
            task_index = next(
                (i for i, task in enumerate(self.tasks) if task.get("id") == task_id),
                -1,
            )

            if task_index == -1:
                return {
                    "status": "error",
                    "message": f"タスクID {task_id} が見つかりません",
                }

            # タスクを更新
            task = self.tasks[task_index]
            task["title"] = task_data.get("title", task["title"])
            task["description"] = task_data.get("description", task["description"])
            task["categoryId"] = task_data.get("categoryId", task["categoryId"])
            task["priority"] = task_data.get("priority", task["priority"])
            task["dueDate"] = task_data.get("dueDate", task["dueDate"])
            task["completed"] = task_data.get("completed", task["completed"])

            # データを保存
            if self._save_data(self.tasks_file, self.tasks):
                return {"status": "success", "task": task}
            else:
                return {"status": "error", "message": "タスクの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"タスク更新エラー: {str(e)}"}

    def delete_task(self, task_id: int):
        """タスクを削除"""
        try:
            # タスクを検索
            task_index = next(
                (i for i, task in enumerate(self.tasks) if task.get("id") == task_id),
                -1,
            )

            if task_index == -1:
                return {
                    "status": "error",
                    "message": f"タスクID {task_id} が見つかりません",
                }

            # タスクを削除
            deleted_task = self.tasks.pop(task_index)

            # データを保存
            if self._save_data(self.tasks_file, self.tasks):
                return {"status": "success", "task": deleted_task}
            else:
                return {"status": "error", "message": "タスクの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"タスク削除エラー: {str(e)}"}

    def add_category(self, category_data: Dict[str, Any]):
        """新しいカテゴリーを追加"""
        try:
            # カテゴリーIDを生成（既存の最大ID + 1）
            category_id = 1
            if self.categories:
                category_id = (
                    max(category.get("id", 0) for category in self.categories) + 1
                )

            # カテゴリーデータを作成
            category = {
                "id": category_id,
                "name": category_data.get("name", ""),
                "color": category_data.get("color", "#9e9e9e"),  # デフォルトはグレー
            }

            # カテゴリーを追加
            self.categories.append(category)

            # データを保存
            if self._save_data(self.categories_file, self.categories):
                return {"status": "success", "category": category}
            else:
                return {"status": "error", "message": "カテゴリーの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"カテゴリー追加エラー: {str(e)}"}

    def update_category(self, category_id: int, category_data: Dict[str, Any]):
        """カテゴリーを更新"""
        try:
            # カテゴリーを検索
            category_index = next(
                (
                    i
                    for i, category in enumerate(self.categories)
                    if category.get("id") == category_id
                ),
                -1,
            )

            if category_index == -1:
                return {
                    "status": "error",
                    "message": f"カテゴリーID {category_id} が見つかりません",
                }

            # カテゴリーを更新
            category = self.categories[category_index]
            category["name"] = category_data.get("name", category["name"])
            category["color"] = category_data.get("color", category["color"])

            # データを保存
            if self._save_data(self.categories_file, self.categories):
                return {"status": "success", "category": category}
            else:
                return {"status": "error", "message": "カテゴリーの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"カテゴリー更新エラー: {str(e)}"}

    def delete_category(self, category_id: int):
        """カテゴリーを削除"""
        try:
            # カテゴリーを検索
            category_index = next(
                (
                    i
                    for i, category in enumerate(self.categories)
                    if category.get("id") == category_id
                ),
                -1,
            )

            if category_index == -1:
                return {
                    "status": "error",
                    "message": f"カテゴリーID {category_id} が見つかりません",
                }

            # このカテゴリーを使用しているタスクがあるか確認
            tasks_with_category = [
                task for task in self.tasks if task.get("categoryId") == category_id
            ]

            if tasks_with_category:
                # タスクのカテゴリーを「その他」に変更
                for task in tasks_with_category:
                    task["categoryId"] = 4  # 「その他」のID

                # タスクデータを保存
                self._save_data(self.tasks_file, self.tasks)

            # カテゴリーを削除
            deleted_category = self.categories.pop(category_index)

            # データを保存
            if self._save_data(self.categories_file, self.categories):
                return {"status": "success", "category": deleted_category}
            else:
                return {"status": "error", "message": "カテゴリーの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"カテゴリー削除エラー: {str(e)}"}

    def check_due_tasks(self):
        """今日が締め切りのタスクを取得"""
        try:
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            due_tasks = [
                task
                for task in self.tasks
                if task.get("dueDate") == today and not task.get("completed")
            ]

            return {"status": "success", "dueTasks": due_tasks, "count": len(due_tasks)}
        except Exception as e:
            return {"status": "error", "message": f"締め切りタスク取得エラー: {str(e)}"}
