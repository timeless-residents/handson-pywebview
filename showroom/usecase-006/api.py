# api.py
import os
import json
import datetime
from typing import Dict, Any


class Api:
    def __init__(self):
        # 現在のディレクトリを取得
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # データ保存用のディレクトリとファイルパス
        self.data_dir = os.path.join(self.current_dir, "data")
        self.transactions_file = os.path.join(self.data_dir, "transactions.json")
        self.categories_file = os.path.join(self.data_dir, "categories.json")
        self.budgets_file = os.path.join(self.data_dir, "budgets.json")

        # ディレクトリが存在しない場合は作成
        os.makedirs(self.data_dir, exist_ok=True)

        # 初期データの読み込み
        self.transactions = self._load_data(self.transactions_file, [])
        self.categories = self._load_data(
            self.categories_file,
            [
                {"id": 1, "name": "食費", "color": "#4caf50", "type": "expense"},
                {"id": 2, "name": "住居費", "color": "#2196f3", "type": "expense"},
                {"id": 3, "name": "光熱費", "color": "#ff9800", "type": "expense"},
                {"id": 4, "name": "交通費", "color": "#9c27b0", "type": "expense"},
                {"id": 5, "name": "通信費", "color": "#e91e63", "type": "expense"},
                {"id": 6, "name": "娯楽費", "color": "#009688", "type": "expense"},
                {"id": 7, "name": "医療費", "color": "#f44336", "type": "expense"},
                {"id": 8, "name": "教育費", "color": "#3f51b5", "type": "expense"},
                {"id": 9, "name": "その他支出", "color": "#9e9e9e", "type": "expense"},
                {"id": 10, "name": "給与", "color": "#4caf50", "type": "income"},
                {"id": 11, "name": "ボーナス", "color": "#2196f3", "type": "income"},
                {"id": 12, "name": "副収入", "color": "#ff9800", "type": "income"},
                {"id": 13, "name": "その他収入", "color": "#9e9e9e", "type": "income"},
            ],
        )
        self.budgets = self._load_data(self.budgets_file, [])

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

    # トランザクション（収支記録）関連のメソッド
    def get_transactions(self):
        """すべてのトランザクションを取得"""
        return {"status": "success", "transactions": self.transactions}

    def add_transaction(self, transaction_data: Dict[str, Any]):
        """新しいトランザクションを追加"""
        try:
            # トランザクションIDを生成（既存の最大ID + 1）
            transaction_id = 1
            if self.transactions:
                transaction_id = (
                    max(transaction.get("id", 0) for transaction in self.transactions)
                    + 1
                )

            # トランザクションデータを作成
            transaction = {
                "id": transaction_id,
                "date": transaction_data.get(
                    "date", datetime.datetime.now().strftime("%Y-%m-%d")
                ),
                "amount": float(transaction_data.get("amount", 0)),
                "categoryId": transaction_data.get(
                    "categoryId", 9
                ),  # デフォルトは「その他支出」
                "description": transaction_data.get("description", ""),
                "type": transaction_data.get(
                    "type", "expense"
                ),  # 'income' または 'expense'
                "createdAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            # トランザクションを追加
            self.transactions.append(transaction)

            # データを保存
            if self._save_data(self.transactions_file, self.transactions):
                return {"status": "success", "transaction": transaction}
            else:
                return {
                    "status": "error",
                    "message": "トランザクションの保存に失敗しました",
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"トランザクション追加エラー: {str(e)}",
            }

    def update_transaction(self, transaction_id: int, transaction_data: Dict[str, Any]):
        """トランザクションを更新"""
        try:
            # トランザクションを検索
            transaction_index = next(
                (
                    i
                    for i, transaction in enumerate(self.transactions)
                    if transaction.get("id") == transaction_id
                ),
                -1,
            )

            if transaction_index == -1:
                return {
                    "status": "error",
                    "message": f"トランザクションID {transaction_id} が見つかりません",
                }

            # トランザクションを更新
            transaction = self.transactions[transaction_index]
            transaction["date"] = transaction_data.get("date", transaction["date"])
            transaction["amount"] = float(
                transaction_data.get("amount", transaction["amount"])
            )
            transaction["categoryId"] = transaction_data.get(
                "categoryId", transaction["categoryId"]
            )
            transaction["description"] = transaction_data.get(
                "description", transaction["description"]
            )
            transaction["type"] = transaction_data.get("type", transaction["type"])

            # データを保存
            if self._save_data(self.transactions_file, self.transactions):
                return {"status": "success", "transaction": transaction}
            else:
                return {
                    "status": "error",
                    "message": "トランザクションの保存に失敗しました",
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"トランザクション更新エラー: {str(e)}",
            }

    def delete_transaction(self, transaction_id: int):
        """トランザクションを削除"""
        try:
            # トランザクションを検索
            transaction_index = next(
                (
                    i
                    for i, transaction in enumerate(self.transactions)
                    if transaction.get("id") == transaction_id
                ),
                -1,
            )

            if transaction_index == -1:
                return {
                    "status": "error",
                    "message": f"トランザクションID {transaction_id} が見つかりません",
                }

            # トランザクションを削除
            deleted_transaction = self.transactions.pop(transaction_index)

            # データを保存
            if self._save_data(self.transactions_file, self.transactions):
                return {"status": "success", "transaction": deleted_transaction}
            else:
                return {
                    "status": "error",
                    "message": "トランザクションの保存に失敗しました",
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"トランザクション削除エラー: {str(e)}",
            }

    # カテゴリー関連のメソッド
    def get_categories(self):
        """すべてのカテゴリーを取得"""
        return {"status": "success", "categories": self.categories}

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
                "type": category_data.get(
                    "type", "expense"
                ),  # 'income' または 'expense'
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
            category["type"] = category_data.get("type", category["type"])

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

            # このカテゴリーを使用しているトランザクションがあるか確認
            category = self.categories[category_index]
            default_category_id = (
                9 if category["type"] == "expense" else 13
            )  # 「その他支出」または「その他収入」

            transactions_with_category = [
                transaction
                for transaction in self.transactions
                if transaction.get("categoryId") == category_id
            ]

            if transactions_with_category:
                # トランザクションのカテゴリーをデフォルトに変更
                for transaction in transactions_with_category:
                    transaction["categoryId"] = default_category_id

                # トランザクションデータを保存
                self._save_data(self.transactions_file, self.transactions)

            # カテゴリーを削除
            deleted_category = self.categories.pop(category_index)

            # データを保存
            if self._save_data(self.categories_file, self.categories):
                return {"status": "success", "category": deleted_category}
            else:
                return {"status": "error", "message": "カテゴリーの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"カテゴリー削除エラー: {str(e)}"}

    # 予算関連のメソッド
    def get_budgets(self):
        """すべての予算を取得"""
        return {"status": "success", "budgets": self.budgets}

    def add_budget(self, budget_data: Dict[str, Any]):
        """新しい予算を追加"""
        try:
            # 予算IDを生成（既存の最大ID + 1）
            budget_id = 1
            if self.budgets:
                budget_id = max(budget.get("id", 0) for budget in self.budgets) + 1

            # 予算データを作成
            budget = {
                "id": budget_id,
                "categoryId": budget_data.get("categoryId"),
                "amount": float(budget_data.get("amount", 0)),
                "period": budget_data.get("period", "monthly"),  # 'monthly', 'yearly'
                "startDate": budget_data.get(
                    "startDate", datetime.datetime.now().strftime("%Y-%m")
                ),
            }

            # 予算を追加
            self.budgets.append(budget)

            # データを保存
            if self._save_data(self.budgets_file, self.budgets):
                return {"status": "success", "budget": budget}
            else:
                return {"status": "error", "message": "予算の保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"予算追加エラー: {str(e)}"}

    def update_budget(self, budget_id: int, budget_data: Dict[str, Any]):
        """予算を更新"""
        try:
            # 予算を検索
            budget_index = next(
                (
                    i
                    for i, budget in enumerate(self.budgets)
                    if budget.get("id") == budget_id
                ),
                -1,
            )

            if budget_index == -1:
                return {
                    "status": "error",
                    "message": f"予算ID {budget_id} が見つかりません",
                }

            # 予算を更新
            budget = self.budgets[budget_index]
            budget["categoryId"] = budget_data.get("categoryId", budget["categoryId"])
            budget["amount"] = float(budget_data.get("amount", budget["amount"]))
            budget["period"] = budget_data.get("period", budget["period"])
            budget["startDate"] = budget_data.get("startDate", budget["startDate"])

            # データを保存
            if self._save_data(self.budgets_file, self.budgets):
                return {"status": "success", "budget": budget}
            else:
                return {"status": "error", "message": "予算の保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"予算更新エラー: {str(e)}"}

    def delete_budget(self, budget_id: int):
        """予算を削除"""
        try:
            # 予算を検索
            budget_index = next(
                (
                    i
                    for i, budget in enumerate(self.budgets)
                    if budget.get("id") == budget_id
                ),
                -1,
            )

            if budget_index == -1:
                return {
                    "status": "error",
                    "message": f"予算ID {budget_id} が見つかりません",
                }

            # 予算を削除
            deleted_budget = self.budgets.pop(budget_index)

            # データを保存
            if self._save_data(self.budgets_file, self.budgets):
                return {"status": "success", "budget": deleted_budget}
            else:
                return {"status": "error", "message": "予算の保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"予算削除エラー: {str(e)}"}

    # 集計・分析関連のメソッド
    def get_summary(self, period: str = "month", date: str = None):
        """期間ごとの収支サマリーを取得"""
        try:
            if date is None:
                date = datetime.datetime.now().strftime("%Y-%m")

            # 期間に応じてトランザクションをフィルタリング
            filtered_transactions = []

            if period == "month":
                # 月別（YYYY-MM形式）
                filtered_transactions = [
                    t for t in self.transactions if t.get("date", "").startswith(date)
                ]
            elif period == "year":
                # 年別（YYYY形式）
                year = date.split("-")[0]
                filtered_transactions = [
                    t for t in self.transactions if t.get("date", "").startswith(year)
                ]
            elif period == "all":
                # すべて
                filtered_transactions = self.transactions

            # 収入と支出を計算
            total_income = sum(
                t.get("amount", 0)
                for t in filtered_transactions
                if t.get("type") == "income"
            )

            total_expense = sum(
                t.get("amount", 0)
                for t in filtered_transactions
                if t.get("type") == "expense"
            )

            # 収支バランス
            balance = total_income - total_expense

            return {
                "status": "success",
                "summary": {
                    "period": period,
                    "date": date,
                    "totalIncome": total_income,
                    "totalExpense": total_expense,
                    "balance": balance,
                },
            }
        except Exception as e:
            return {"status": "error", "message": f"サマリー取得エラー: {str(e)}"}

    def get_category_summary(
        self, period: str = "month", date: str = None, type: str = "expense"
    ):
        """カテゴリー別の集計を取得"""
        try:
            if date is None:
                date = datetime.datetime.now().strftime("%Y-%m")

            # 期間に応じてトランザクションをフィルタリング
            filtered_transactions = []

            if period == "month":
                # 月別（YYYY-MM形式）
                filtered_transactions = [
                    t
                    for t in self.transactions
                    if t.get("date", "").startswith(date) and t.get("type") == type
                ]
            elif period == "year":
                # 年別（YYYY形式）
                year = date.split("-")[0]
                filtered_transactions = [
                    t
                    for t in self.transactions
                    if t.get("date", "").startswith(year) and t.get("type") == type
                ]
            elif period == "all":
                # すべて
                filtered_transactions = [
                    t for t in self.transactions if t.get("type") == type
                ]

            # カテゴリー別に集計
            category_summary = {}

            for transaction in filtered_transactions:
                category_id = transaction.get("categoryId")
                amount = transaction.get("amount", 0)

                if category_id not in category_summary:
                    category = next(
                        (c for c in self.categories if c.get("id") == category_id),
                        {
                            "id": category_id,
                            "name": "不明",
                            "color": "#9e9e9e",
                            "type": type,
                        },
                    )

                    category_summary[category_id] = {
                        "categoryId": category_id,
                        "name": category.get("name"),
                        "color": category.get("color"),
                        "amount": 0,
                    }

                category_summary[category_id]["amount"] += amount

            # 合計金額を計算
            total_amount = sum(item["amount"] for item in category_summary.values())

            # パーセンテージを計算
            for item in category_summary.values():
                if total_amount > 0:
                    item["percentage"] = round((item["amount"] / total_amount) * 100, 1)
                else:
                    item["percentage"] = 0

            return {
                "status": "success",
                "categorySummary": list(category_summary.values()),
                "totalAmount": total_amount,
            }
        except Exception as e:
            return {"status": "error", "message": f"カテゴリー集計エラー: {str(e)}"}

    def get_budget_status(self, period: str = "month", date: str = None):
        """予算の進捗状況を取得"""
        try:
            if date is None:
                date = datetime.datetime.now().strftime("%Y-%m")

            # 該当期間の予算を取得
            period_budgets = [
                b
                for b in self.budgets
                if b.get("period") == "monthly" and b.get("startDate") == date
            ]

            if period == "year":
                year = date.split("-")[0]
                yearly_budgets = [
                    b
                    for b in self.budgets
                    if b.get("period") == "yearly"
                    and b.get("startDate").startswith(year)
                ]
                period_budgets.extend(yearly_budgets)

            # 予算の進捗状況を計算
            budget_status = []

            for budget in period_budgets:
                category_id = budget.get("categoryId")
                budget_amount = budget.get("amount", 0)

                # カテゴリー情報を取得
                category = next(
                    (c for c in self.categories if c.get("id") == category_id),
                    {
                        "id": category_id,
                        "name": "不明",
                        "color": "#9e9e9e",
                        "type": "expense",
                    },
                )

                # 該当カテゴリーの支出を計算
                spent_amount = 0

                if period == "month":
                    # 月別（YYYY-MM形式）
                    spent_amount = sum(
                        t.get("amount", 0)
                        for t in self.transactions
                        if t.get("categoryId") == category_id
                        and t.get("type") == "expense"
                        and t.get("date", "").startswith(date)
                    )
                elif period == "year":
                    # 年別（YYYY形式）
                    year = date.split("-")[0]
                    spent_amount = sum(
                        t.get("amount", 0)
                        for t in self.transactions
                        if t.get("categoryId") == category_id
                        and t.get("type") == "expense"
                        and t.get("date", "").startswith(year)
                    )

                # 残額と進捗率を計算
                remaining = budget_amount - spent_amount
                progress = (
                    (spent_amount / budget_amount) * 100 if budget_amount > 0 else 0
                )

                budget_status.append(
                    {
                        "budgetId": budget.get("id"),
                        "categoryId": category_id,
                        "categoryName": category.get("name"),
                        "categoryColor": category.get("color"),
                        "budgetAmount": budget_amount,
                        "spentAmount": spent_amount,
                        "remainingAmount": remaining,
                        "progress": round(progress, 1),
                        "isOverBudget": spent_amount > budget_amount,
                    }
                )

            return {
                "status": "success",
                "budgetStatus": budget_status,
            }
        except Exception as e:
            return {"status": "error", "message": f"予算状況取得エラー: {str(e)}"}

    def get_monthly_trend(self, year: str = None, type: str = "expense"):
        """月別の収支トレンドを取得"""
        try:
            if year is None:
                year = datetime.datetime.now().strftime("%Y")

            # 月別の集計データを初期化
            monthly_data = {f"{i:02d}": 0 for i in range(1, 13)}

            # トランザクションを集計
            for transaction in self.transactions:
                if transaction.get("type") != type:
                    continue

                date = transaction.get("date", "")
                if not date.startswith(year):
                    continue

                month = date.split("-")[1]
                amount = transaction.get("amount", 0)

                monthly_data[month] += amount

            # 結果を整形
            trend_data = [
                {"month": f"{year}-{month}", "amount": amount}
                for month, amount in monthly_data.items()
            ]

            return {
                "status": "success",
                "trendData": trend_data,
                "type": type,
            }
        except Exception as e:
            return {"status": "error", "message": f"トレンド取得エラー: {str(e)}"}
