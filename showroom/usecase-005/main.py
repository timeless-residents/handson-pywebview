# main.py
import os
import webview
from api import Api  # api.pyからApiクラスをインポート

# カレントディレクトリのパスを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
# HTMLファイルのパスを生成
html_path = os.path.join(current_dir, "web", "index.html")

if __name__ == "__main__":
    # APIインスタンスを作成
    api = Api()

    # ウィンドウを作成
    window = webview.create_window(
        title="Task Manager",
        url=html_path,
        js_api=api,
        width=1000,
        height=700,
        resizable=True,
    )

    # アプリケーションを開始
    webview.start(debug=True)
