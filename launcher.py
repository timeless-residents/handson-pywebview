import os
import sys
import subprocess
import webview


class Api:
    def launch_usecase(self, usecase_number):
        print(f"launch_usecase({usecase_number})が呼び出されました")

        # 実行ファイルの場所を基準に絶対パスを構築
        if getattr(sys, "frozen", False):
            # 実行ファイルとして実行されている場合
            base_dir = os.path.dirname(sys.executable)
        else:
            # スクリプトとして実行されている場合
            base_dir = os.path.dirname(os.path.abspath(__file__))

        usecase_path = os.path.join(
            base_dir, f"showroom", f"usecase-{usecase_number:03d}", "main.py"
        )

        print(f"起動パス: {usecase_path}")
        print(f"パスの存在: {os.path.exists(usecase_path)}")

        try:
            if os.path.exists(usecase_path):
                subprocess.Popen([sys.executable, usecase_path])
            else:
                print(f"エラー: パスが見つかりません")
        except Exception as e:
            print(f"実行エラー: {e}")


def main():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Usecase Launcher</title>
        <style>
            body { font-family: Arial; padding: 20px; }
            button { margin: 5px; padding: 10px; width: 150px; }
        </style>
    </head>
    <body>
        <h1>Usecase Launcher</h1>
        <div id="buttons"></div>
        <script>
            // pywebviewready イベントを待つ
            window.addEventListener('pywebviewready', function() {
                console.log('pywebviewready イベント発火');
                console.log('API利用可能:', window.pywebview.api);
                
                const buttons = document.getElementById('buttons');
                for (let i = 0; i <= 11; i++) {
                    const btn = document.createElement('button');
                    const num = i.toString().padStart(3, '0');
                    btn.textContent = `Usecase ${num}`;
                    btn.onclick = function() {
                        console.log(`ボタン ${num} がクリックされました`);
                        if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.launch_usecase === 'function') {
                            try {
                                window.pywebview.api.launch_usecase(i);
                            } catch(e) {
                                console.error('API呼び出しエラー:', e);
                                alert('エラーが発生しました: ' + e);
                            }
                        } else {
                            console.error('API関数が見つかりません');
                            alert('APIが正しく初期化されていません');
                        }
                    };
                    buttons.appendChild(btn);
                }
            });
        </script>
    </body>
    </html>
    """

    api = Api()  # Apiクラスのインスタンスを作成
    window = webview.create_window("Usecase Launcher", html=html, js_api=api)
    webview.start(debug=True)  # デバッグモードを有効化


if __name__ == "__main__":
    main()
