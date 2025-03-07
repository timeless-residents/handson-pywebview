import webview

import webview


def main():
    # ウィンドウタイトルと表示するURLまたはHTMLコンテンツを指定
    # 例1: 外部URLを表示
    # webview.create_window('pywebview サンプル', 'https://www.example.com')

    # 例2: ローカルのHTML文字列を表示
    html_content = """
    <html>
      <head>
        <meta charset="UTF-8">
        <title>pywebviewハンズオン</title>
      </head>
      <body>
        <h1>Hello, pywebview!</h1>
        <p>M系Mac OS上でVSCodeから実行中。</p>
      </body>
    </html>
    """
    webview.create_window("pywebview ハンズオン", html=html_content)
    webview.start()


if __name__ == "__main__":
    main()
