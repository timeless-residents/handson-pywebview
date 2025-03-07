# api.py
import os
import markdown


class Api:
    def __init__(self):
        # 現在のディレクトリを取得
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # ファイル保存用のディレクトリを作成
        self.documents_dir = os.path.join(self.current_dir, "documents")
        os.makedirs(self.documents_dir, exist_ok=True)

    def save_markdown(self, filename, content):
        """マークダウンファイルを保存する"""
        try:
            # ファイル名が.mdで終わるようにする
            if not filename.endswith(".md"):
                filename += ".md"

            # ファイルパスを生成
            file_path = os.path.join(self.documents_dir, filename)

            # ファイルに書き込み
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

            return {
                "status": "success",
                "message": f"ファイル '{filename}' を保存しました",
            }
        except Exception as e:
            return {"status": "error", "message": f"保存エラー: {str(e)}"}

    def load_markdown(self, filename):
        """マークダウンファイルを読み込む"""
        try:
            # ファイル名が.mdで終わるようにする
            if not filename.endswith(".md"):
                filename += ".md"

            # ファイルパスを生成
            file_path = os.path.join(self.documents_dir, filename)

            # ファイルが存在するか確認
            if not os.path.exists(file_path):
                return {
                    "status": "error",
                    "message": f"ファイル '{filename}' が見つかりません",
                }

            # ファイルを読み込み
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            return {
                "status": "success",
                "content": content,
                "message": f"ファイル '{filename}' を読み込みました",
            }
        except Exception as e:
            return {"status": "error", "message": f"読み込みエラー: {str(e)}"}

    def list_files(self):
        """保存されているマークダウンファイルの一覧を取得"""
        try:
            # ディレクトリ内のmdファイルを取得
            files = [f for f in os.listdir(self.documents_dir) if f.endswith(".md")]
            return {"status": "success", "files": files}
        except Exception as e:
            return {"status": "error", "message": f"ファイル一覧取得エラー: {str(e)}"}

    def export_html(self, markdown_content, filename):
        """マークダウンをHTMLに変換して保存"""
        try:
            # マークダウンをHTMLに変換
            html_content = markdown.markdown(
                markdown_content, extensions=["tables", "fenced_code"]
            )

            # 基本的なHTMLテンプレート
            html_template = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{filename}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0 auto; max-width: 800px; padding: 20px; line-height: 1.6; }}
        pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }}
        code {{ font-family: Consolas, Monaco, 'Andale Mono', monospace; }}
        img {{ max-width: 100%; }}
        table {{ border-collapse: collapse; width: 100%; }}
        table, th, td {{ border: 1px solid #ddd; padding: 8px; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>"""

            # ファイル名が.htmlで終わるようにする
            if not filename.endswith(".html"):
                filename += ".html"

            # ファイルパスを生成
            file_path = os.path.join(self.documents_dir, filename)

            # ファイルに書き込み
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(html_template)

            return {
                "status": "success",
                "message": f"HTMLファイル '{filename}' をエクスポートしました",
                "path": file_path,
            }
        except Exception as e:
            return {"status": "error", "message": f"HTMLエクスポートエラー: {str(e)}"}

    def open_file(self, path):
        """ファイルをデフォルトのアプリケーションで開く"""
        try:
            import webbrowser

            webbrowser.open(path)
            return {"status": "success", "message": "ファイルを開きました"}
        except Exception as e:
            return {
                "status": "error",
                "message": f"ファイルを開けませんでした: {str(e)}",
            }
