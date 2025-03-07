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
        self.snippets_file = os.path.join(self.data_dir, "snippets.json")
        self.categories_file = os.path.join(self.data_dir, "categories.json")

        # ディレクトリが存在しない場合は作成
        os.makedirs(self.data_dir, exist_ok=True)

        # 初期データの読み込み
        self.snippets = self._load_data(self.snippets_file, [])
        self.categories = self._load_data(
            self.categories_file,
            [
                {"id": 1, "name": "JavaScript", "color": "#f7df1e"},
                {"id": 2, "name": "Python", "color": "#3776ab"},
                {"id": 3, "name": "HTML", "color": "#e34c26"},
                {"id": 4, "name": "CSS", "color": "#264de4"},
                {"id": 5, "name": "Java", "color": "#007396"},
                {"id": 6, "name": "C#", "color": "#178600"},
                {"id": 7, "name": "PHP", "color": "#777bb4"},
                {"id": 8, "name": "Ruby", "color": "#cc342d"},
                {"id": 9, "name": "Go", "color": "#00add8"},
                {"id": 10, "name": "その他", "color": "#9e9e9e"},
            ],
        )

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

    # スニペット関連のメソッド
    def get_snippets(self):
        """すべてのスニペットを取得"""
        return {"status": "success", "snippets": self.snippets}

    def add_snippet(self, snippet_data: Dict[str, Any]):
        """新しいスニペットを追加"""
        try:
            # スニペットIDを生成（既存の最大ID + 1）
            snippet_id = 1
            if self.snippets:
                snippet_id = max(snippet.get("id", 0) for snippet in self.snippets) + 1

            # スニペットデータを作成
            snippet = {
                "id": snippet_id,
                "title": snippet_data.get("title", "無題のスニペット"),
                "code": snippet_data.get("code", ""),
                "language": snippet_data.get("language", "text"),
                "description": snippet_data.get("description", ""),
                "categoryId": snippet_data.get(
                    "categoryId", 10
                ),  # デフォルトは「その他」
                "tags": snippet_data.get("tags", []),
                "createdAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updatedAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            # スニペットを追加
            self.snippets.append(snippet)

            # データを保存
            if self._save_data(self.snippets_file, self.snippets):
                return {"status": "success", "snippet": snippet}
            else:
                return {"status": "error", "message": "スニペットの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"スニペット追加エラー: {str(e)}"}

    def update_snippet(self, snippet_id: int, snippet_data: Dict[str, Any]):
        """スニペットを更新"""
        try:
            # スニペットを検索
            snippet_index = next(
                (
                    i
                    for i, snippet in enumerate(self.snippets)
                    if snippet.get("id") == snippet_id
                ),
                -1,
            )

            if snippet_index == -1:
                return {
                    "status": "error",
                    "message": f"スニペットID {snippet_id} が見つかりません",
                }

            # スニペットを更新
            snippet = self.snippets[snippet_index]
            snippet["title"] = snippet_data.get("title", snippet["title"])
            snippet["code"] = snippet_data.get("code", snippet["code"])
            snippet["language"] = snippet_data.get("language", snippet["language"])
            snippet["description"] = snippet_data.get(
                "description", snippet["description"]
            )
            snippet["categoryId"] = snippet_data.get(
                "categoryId", snippet["categoryId"]
            )
            snippet["tags"] = snippet_data.get("tags", snippet["tags"])
            snippet["updatedAt"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # データを保存
            if self._save_data(self.snippets_file, self.snippets):
                return {"status": "success", "snippet": snippet}
            else:
                return {"status": "error", "message": "スニペットの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"スニペット更新エラー: {str(e)}"}

    def delete_snippet(self, snippet_id: int):
        """スニペットを削除"""
        try:
            # スニペットを検索
            snippet_index = next(
                (
                    i
                    for i, snippet in enumerate(self.snippets)
                    if snippet.get("id") == snippet_id
                ),
                -1,
            )

            if snippet_index == -1:
                return {
                    "status": "error",
                    "message": f"スニペットID {snippet_id} が見つかりません",
                }

            # スニペットを削除
            deleted_snippet = self.snippets.pop(snippet_index)

            # データを保存
            if self._save_data(self.snippets_file, self.snippets):
                return {"status": "success", "snippet": deleted_snippet}
            else:
                return {"status": "error", "message": "スニペットの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"スニペット削除エラー: {str(e)}"}

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

            # このカテゴリーを使用しているスニペットがあるか確認
            category = self.categories[category_index]
            default_category_id = 10  # 「その他」

            snippets_with_category = [
                snippet
                for snippet in self.snippets
                if snippet.get("categoryId") == category_id
            ]

            if snippets_with_category:
                # スニペットのカテゴリーをデフォルトに変更
                for snippet in snippets_with_category:
                    snippet["categoryId"] = default_category_id

                # スニペットデータを保存
                self._save_data(self.snippets_file, self.snippets)

            # カテゴリーを削除
            deleted_category = self.categories.pop(category_index)

            # データを保存
            if self._save_data(self.categories_file, self.categories):
                return {"status": "success", "category": deleted_category}
            else:
                return {"status": "error", "message": "カテゴリーの保存に失敗しました"}
        except Exception as e:
            return {"status": "error", "message": f"カテゴリー削除エラー: {str(e)}"}

    # タグ関連のメソッド
    def get_all_tags(self):
        """すべてのタグを取得"""
        try:
            # すべてのスニペットからタグを抽出
            all_tags = []
            for snippet in self.snippets:
                all_tags.extend(snippet.get("tags", []))

            # 重複を削除して並べ替え
            unique_tags = sorted(list(set(all_tags)))

            return {"status": "success", "tags": unique_tags}
        except Exception as e:
            return {"status": "error", "message": f"タグ取得エラー: {str(e)}"}

    # 検索関連のメソッド
    def search_snippets(self, query: Dict[str, Any]):
        """スニペットを検索"""
        try:
            search_text = query.get("text", "").lower()
            category_id = query.get("categoryId")
            tags = query.get("tags", [])

            filtered_snippets = self.snippets

            # テキスト検索
            if search_text:
                filtered_snippets = [
                    s
                    for s in filtered_snippets
                    if search_text in s.get("title", "").lower()
                    or search_text in s.get("description", "").lower()
                    or search_text in s.get("code", "").lower()
                ]

            # カテゴリーフィルター
            if category_id is not None:
                filtered_snippets = [
                    s for s in filtered_snippets if s.get("categoryId") == category_id
                ]

            # タグフィルター
            if tags:
                filtered_snippets = [
                    s
                    for s in filtered_snippets
                    if all(tag in s.get("tags", []) for tag in tags)
                ]

            return {"status": "success", "snippets": filtered_snippets}
        except Exception as e:
            return {"status": "error", "message": f"検索エラー: {str(e)}"}

    # エクスポート関連のメソッド
    def export_snippet(self, snippet_id: int, format: str = "text"):
        """スニペットをエクスポート"""
        try:
            # スニペットを検索
            snippet = next(
                (s for s in self.snippets if s.get("id") == snippet_id), None
            )

            if not snippet:
                return {
                    "status": "error",
                    "message": f"スニペットID {snippet_id} が見つかりません",
                }

            # カテゴリー情報を取得
            category = next(
                (
                    c
                    for c in self.categories
                    if c.get("id") == snippet.get("categoryId")
                ),
                {"name": "その他"},
            )

            if format == "text":
                # プレーンテキスト形式
                content = f"""タイトル: {snippet.get('title')}
言語: {snippet.get('language')}
カテゴリー: {category.get('name')}
タグ: {', '.join(snippet.get('tags', []))}
作成日時: {snippet.get('createdAt')}
更新日時: {snippet.get('updatedAt')}
説明:
{snippet.get('description')}

コード:
{snippet.get('code')}
"""
                return {
                    "status": "success",
                    "content": content,
                    "filename": f"{snippet.get('title')}.txt",
                }

            elif format == "html":
                # HTML形式
                content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{snippet.get('title')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .snippet-header {{ margin-bottom: 20px; }}
        .snippet-title {{ font-size: 24px; margin-bottom: 10px; }}
        .snippet-meta {{ color: #666; margin-bottom: 5px; }}
        .snippet-description {{ margin-bottom: 20px; }}
        .snippet-code {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }}
        pre {{ margin: 0; }}
    </style>
</head>
<body>
    <div class="snippet-header">
        <div class="snippet-title">{snippet.get('title')}</div>
        <div class="snippet-meta">言語: {snippet.get('language')}</div>
        <div class="snippet-meta">カテゴリー: {category.get('name')}</div>
        <div class="snippet-meta">タグ: {', '.join(snippet.get('tags', []))}</div>
        <div class="snippet-meta">作成日時: {snippet.get('createdAt')}</div>
        <div class="snippet-meta">更新日時: {snippet.get('updatedAt')}</div>
    </div>
    <div class="snippet-description">{snippet.get('description')}</div>
    <div class="snippet-code">
        <pre><code>{snippet.get('code')}</code></pre>
    </div>
</body>
</html>
"""
                return {
                    "status": "success",
                    "content": content,
                    "filename": f"{snippet.get('title')}.html",
                }

            elif format == "json":
                # JSON形式
                content = json.dumps(snippet, ensure_ascii=False, indent=2)
                return {
                    "status": "success",
                    "content": content,
                    "filename": f"{snippet.get('title')}.json",
                }

            else:
                return {"status": "error", "message": f"未対応のフォーマット: {format}"}

        except Exception as e:
            return {"status": "error", "message": f"エクスポートエラー: {str(e)}"}

    def export_all_snippets(self, format: str = "json"):
        """すべてのスニペットをエクスポート"""
        try:
            if format == "json":
                # JSON形式
                content = json.dumps(self.snippets, ensure_ascii=False, indent=2)
                return {
                    "status": "success",
                    "content": content,
                    "filename": "all_snippets.json",
                }
            else:
                return {"status": "error", "message": f"未対応のフォーマット: {format}"}
        except Exception as e:
            return {"status": "error", "message": f"エクスポートエラー: {str(e)}"}
