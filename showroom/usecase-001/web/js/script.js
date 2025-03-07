// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // ボタンのイベントリスナー設定
    document
      .getElementById("getMessage")
      .addEventListener("click", function () {
        // Pythonの関数を呼び出し
        window.pywebview.api.get_message().then(function (response) {
          document.getElementById("message").textContent = response;
        });
      });

    document.getElementById("saveData").addEventListener("click", function () {
      const inputData = document.getElementById("inputData").value;
      if (inputData) {
        // Pythonの関数にデータを送信
        window.pywebview.api.save_data(inputData).then(function (response) {
          if (response.status === "success") {
            document.getElementById("message").textContent =
              "保存に成功しました";
          } else {
            document.getElementById("message").textContent =
              "保存に失敗しました";
          }
        });
      }
    });
  });
});
