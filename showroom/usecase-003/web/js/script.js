// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // 要素の取得
  const markdownEditor = document.getElementById("markdownEditor");
  const preview = document.getElementById("preview");
  const saveBtn = document.getElementById("saveBtn");
  const loadBtn = document.getElementById("loadBtn");
  const exportBtn = document.getElementById("exportBtn");
  const filenameInput = document.getElementById("filename");
  const fileList = document.getElementById("fileList");
  const notification = document.getElementById("notification");

  // マークダウンエディタの初期値
  const defaultMarkdown = `# マークダウンエディターへようこそ！

## 機能
- リアルタイムプレビュー
- ファイル保存・読み込み
- シンタックスハイライト
- HTMLエクスポート機能

## マークダウンの書き方

### 見出し
# 見出し1
## 見出し2
### 見出し3

### リスト
- 項目1
- 項目2
  - ネストした項目

1. 番号付きリスト1
2. 番号付きリスト2

### 強調
*イタリック* または _イタリック_
**太字** または __太字__

### コード
\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

インラインコード: \`const x = 10;\`

### リンクと画像
[リンクテキスト](https://example.com)
![画像の代替テキスト](画像のURL)

### 表
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A1  | B1  | C1  |
| A2  | B2  | C2  |

### 引用
> これは引用です。
> 複数行にまたがることもできます。
`;

  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // 初期化
    markdownEditor.value = defaultMarkdown;
    updatePreview();
    loadFileList();

    // マークダウン入力時にプレビューを更新
    markdownEditor.addEventListener("input", updatePreview);

    // 保存ボタンのイベント
    saveBtn.addEventListener("click", function () {
      const filename = filenameInput.value.trim();
      if (!filename) {
        showNotification("ファイル名を入力してください", "error");
        return;
      }

      window.pywebview.api
        .save_markdown(filename, markdownEditor.value)
        .then(function (response) {
          if (response.status === "success") {
            showNotification(response.message, "success");
            loadFileList();
          } else {
            showNotification(response.message, "error");
          }
        });
    });

    // 読み込みボタンのイベント
    loadBtn.addEventListener("click", function () {
      fileList.classList.toggle("hidden");
      if (!fileList.classList.contains("hidden")) {
        loadFileList();
      }
    });

    // ファイルリスト選択時のイベント
    fileList.addEventListener("change", function () {
      const selectedFile = fileList.value;
      if (selectedFile) {
        window.pywebview.api
          .load_markdown(selectedFile)
          .then(function (response) {
            if (response.status === "success") {
              markdownEditor.value = response.content;
              filenameInput.value = selectedFile.replace(/\.md$/, "");
              updatePreview();
              showNotification(response.message, "success");
              fileList.classList.add("hidden");
            } else {
              showNotification(response.message, "error");
            }
          });
      }
    });

    // HTMLエクスポートボタンのイベント
    exportBtn.addEventListener("click", function () {
      const filename = filenameInput.value.trim();
      if (!filename) {
        showNotification("ファイル名を入力してください", "error");
        return;
      }

      window.pywebview.api
        .export_html(markdownEditor.value, filename)
        .then(function (response) {
          if (response.status === "success") {
            showNotification(response.message, "success");
            // エクスポートしたHTMLファイルを開く
            window.pywebview.api.open_file(response.path);
          } else {
            showNotification(response.message, "error");
          }
        });
    });
  });

  // プレビューを更新する関数
  function updatePreview() {
    // マークダウンをHTMLに変換
    const markedOptions = {
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    };

    // markedのオプションを設定
    marked.setOptions(markedOptions);

    // マークダウンをHTMLに変換してプレビューに表示
    preview.innerHTML = marked.parse(markdownEditor.value);

    // コードブロックのシンタックスハイライトを適用
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  // ファイル一覧を読み込む関数
  function loadFileList() {
    window.pywebview.api.list_files().then(function (response) {
      if (response.status === "success") {
        // 既存のオプションをクリア（最初のデフォルトオプションは残す）
        while (fileList.options.length > 1) {
          fileList.remove(1);
        }

        // ファイル一覧を追加
        response.files.forEach(function (file) {
          const option = document.createElement("option");
          option.value = file;
          option.textContent = file;
          fileList.appendChild(option);
        });

        // ファイルがない場合のメッセージ
        if (response.files.length === 0) {
          const option = document.createElement("option");
          option.disabled = true;
          option.textContent = "保存されたファイルはありません";
          fileList.appendChild(option);
        }
      }
    });
  }

  // 通知を表示する関数
  function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.className = type;
    notification.classList.remove("hidden");

    // 3秒後に通知を非表示にする
    setTimeout(function () {
      notification.classList.add("hidden");
    }, 3000);
  }
});
