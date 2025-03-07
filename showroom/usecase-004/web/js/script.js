// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // 要素の取得
  const pdfSelect = document.getElementById("pdfSelect");
  const pdfViewer = document.getElementById("pdfViewer");
  const pdfContainer = document.getElementById("pdfContainer");
  const textLayer = document.getElementById("textLayer");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomLevel = document.getElementById("zoomLevel");
  const searchInput = document.getElementById("searchInput");
  const searchPrevBtn = document.getElementById("searchPrev");
  const searchNextBtn = document.getElementById("searchNext");
  const searchInfo = document.getElementById("searchInfo");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const notification = document.getElementById("notification");

  // PDF.js関連の変数
  let pdfDoc = null;
  let pageNum = 1;
  let pageRendering = false;
  let pageNumPending = null;
  let scale = 1.0;
  let canvas = pdfViewer;
  let ctx = canvas.getContext("2d");

  // 検索関連の変数
  let searchMatches = [];
  let searchMatchIndex = -1;

  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // PDFファイル一覧を読み込む
    loadPdfList();

    // PDFファイル選択時のイベント
    pdfSelect.addEventListener("change", function () {
      const selectedFile = pdfSelect.value;
      if (selectedFile) {
        loadPdf(selectedFile);
      }
    });

    // ページナビゲーションのイベント
    prevPageBtn.addEventListener("click", function () {
      if (pageNum <= 1) return;
      pageNum--;
      queueRenderPage(pageNum);
      updatePageInfo();
    });

    nextPageBtn.addEventListener("click", function () {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
      queueRenderPage(pageNum);
      updatePageInfo();
    });

    // ズーム機能のイベント
    zoomInBtn.addEventListener("click", function () {
      if (scale >= 3.0) return;
      scale += 0.2;
      queueRenderPage(pageNum);
      updateZoomLevel();
    });

    zoomOutBtn.addEventListener("click", function () {
      if (scale <= 0.4) return;
      scale -= 0.2;
      queueRenderPage(pageNum);
      updateZoomLevel();
    });

    // 検索機能のイベント
    searchInput.addEventListener("input", function () {
      if (pdfDoc) {
        performSearch(searchInput.value);
      }
    });

    searchPrevBtn.addEventListener("click", function () {
      if (searchMatches.length > 0) {
        searchMatchIndex =
          (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
        jumpToMatch(searchMatchIndex);
      }
    });

    searchNextBtn.addEventListener("click", function () {
      if (searchMatches.length > 0) {
        searchMatchIndex = (searchMatchIndex + 1) % searchMatches.length;
        jumpToMatch(searchMatchIndex);
      }
    });
  });

  // PDFファイル一覧を読み込む関数
  function loadPdfList() {
    showLoading(true);
    window.pywebview.api.list_pdf_files().then(function (response) {
      showLoading(false);
      if (response.status === "success") {
        // 既存のオプションをクリア（最初のデフォルトオプションは残す）
        while (pdfSelect.options.length > 1) {
          pdfSelect.remove(1);
        }

        // ファイル一覧を追加
        response.files.forEach(function (file) {
          const option = document.createElement("option");
          option.value = file.name;
          option.textContent = `${file.name} (${file.size})`;
          pdfSelect.appendChild(option);
        });

        // ファイルがない場合のメッセージ
        if (response.files.length === 0) {
          const option = document.createElement("option");
          option.disabled = true;
          option.textContent = "PDFファイルがありません";
          pdfSelect.appendChild(option);
          showNotification(
            "PDFファイルをpdfsフォルダに追加してください",
            "error"
          );
        }
      } else {
        showNotification(response.message, "error");
      }
    });
  }

  // PDFファイルを読み込む関数
  function loadPdf(filename) {
    showLoading(true);
    window.pywebview.api.get_pdf_data(filename).then(function (response) {
      if (response.status === "success") {
        // Base64データをバイナリデータに変換
        const pdfData = atob(response.data);

        // Uint8Arrayに変換
        const uint8Array = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
          uint8Array[i] = pdfData.charCodeAt(i);
        }

        // PDF.jsでPDFを読み込み
        pdfjsLib
          .getDocument({ data: uint8Array })
          .promise.then(function (pdf) {
            pdfDoc = pdf;
            pageNum = 1;

            // コントロールを有効化
            enableControls(true);

            // 最初のページをレンダリング
            renderPage(pageNum);
            updatePageInfo();

            showNotification(`${filename} を読み込みました`, "success");
          })
          .catch(function (error) {
            console.error("PDF読み込みエラー:", error);
            showNotification("PDFの読み込みに失敗しました", "error");
            showLoading(false);
          });
      } else {
        showNotification(response.message, "error");
        showLoading(false);
      }
    });
  }

  // ページをレンダリングする関数
  function renderPage(num) {
    pageRendering = true;

    // ページを取得
    pdfDoc.getPage(num).then(function (page) {
      // ビューポートに合わせてスケール調整
      const viewport = page.getViewport({ scale: scale });

      // キャンバスの寸法を設定
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // レンダリングコンテキストを設定
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      // ページをレンダリング
      const renderTask = page.render(renderContext);

      // テキストレイヤーをクリア
      textLayer.innerHTML = "";
      textLayer.style.width = viewport.width + "px";
      textLayer.style.height = viewport.height + "px";

      // テキストコンテンツを取得してテキストレイヤーを作成
      page.getTextContent().then(function (textContent) {
        pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayer,
          viewport: viewport,
          textDivs: [],
        });

        // 検索結果をハイライト
        if (searchMatches.length > 0 && searchInput.value.trim() !== "") {
          highlightMatches();
        }
      });

      // レンダリング完了時の処理
      renderTask.promise.then(function () {
        pageRendering = false;
        showLoading(false);

        // ページ切り替え待ちがある場合
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });
    });
  }

  // ページレンダリングをキューに入れる関数
  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  // ページ情報を更新する関数
  function updatePageInfo() {
    if (pdfDoc) {
      pageInfo.textContent = `${pageNum} / ${pdfDoc.numPages}`;
    }
  }

  // ズームレベルを更新する関数
  function updateZoomLevel() {
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
  }

  // コントロールの有効/無効を切り替える関数
  function enableControls(enabled) {
    prevPageBtn.disabled = !enabled;
    nextPageBtn.disabled = !enabled;
    zoomInBtn.disabled = !enabled;
    zoomOutBtn.disabled = !enabled;
    searchInput.disabled = !enabled;
    searchPrevBtn.disabled = !enabled || searchMatches.length === 0;
    searchNextBtn.disabled = !enabled || searchMatches.length === 0;
  }

  // 検索を実行する関数
  function performSearch(query) {
    // 検索結果をリセット
    searchMatches = [];
    searchMatchIndex = -1;
    searchInfo.textContent = "";

    if (!query || query.trim() === "") {
      // テキストレイヤーのハイライトをクリア
      const highlights = textLayer.querySelectorAll(".highlight");
      highlights.forEach(function (highlight) {
        highlight.classList.remove("highlight");
        highlight.classList.remove("selected");
      });

      searchPrevBtn.disabled = true;
      searchNextBtn.disabled = true;
      return;
    }

    // 現在のページのテキスト要素を取得
    const textElements = textLayer.querySelectorAll("span");
    const searchRegex = new RegExp(query, "gi");

    // テキスト要素を検索
    textElements.forEach(function (element, index) {
      const text = element.textContent;
      let match;

      // 正規表現で検索
      while ((match = searchRegex.exec(text)) !== null) {
        searchMatches.push({
          element: element,
          index: index,
          position: match.index,
          length: match[0].length,
        });
      }
    });

    // 検索結果を表示
    searchInfo.textContent = `${searchMatches.length} 件見つかりました`;
    searchPrevBtn.disabled = searchMatches.length === 0;
    searchNextBtn.disabled = searchMatches.length === 0;

    // 検索結果をハイライト
    highlightMatches();

    // 最初の検索結果にジャンプ
    if (searchMatches.length > 0) {
      searchMatchIndex = 0;
      jumpToMatch(searchMatchIndex);
    }
  }

  // 検索結果をハイライトする関数
  function highlightMatches() {
    // テキストレイヤーのハイライトをクリア
    const highlights = textLayer.querySelectorAll(".highlight");
    highlights.forEach(function (highlight) {
      highlight.classList.remove("highlight");
      highlight.classList.remove("selected");
    });

    // 検索結果をハイライト
    searchMatches.forEach(function (match, index) {
      match.element.classList.add("highlight");
      if (index === searchMatchIndex) {
        match.element.classList.add("selected");
      }
    });
  }

  // 検索結果にジャンプする関数
  function jumpToMatch(index) {
    if (
      searchMatches.length === 0 ||
      index < 0 ||
      index >= searchMatches.length
    ) {
      return;
    }

    // ハイライトを更新
    highlightMatches();

    // 要素にスクロール
    const match = searchMatches[index];
    match.element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  // ローディングインジケーターを表示/非表示する関数
  function showLoading(show) {
    if (show) {
      loadingIndicator.classList.remove("hidden");
    } else {
      loadingIndicator.classList.add("hidden");
    }
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
