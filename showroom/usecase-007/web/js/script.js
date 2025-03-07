// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // 要素の取得
  // ヘッダー要素
  const addSnippetBtn = document.getElementById("addSnippetBtn");
  const manageCategoriesBtn = document.getElementById("manageCategoriesBtn");

  // サイドバー要素
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const categoryList = document.getElementById("categoryList");
  const tagCloud = document.getElementById("tagCloud");

  // スニペットリスト要素
  const snippetsList = document.getElementById("snippetsList");
  const sortSelect = document.getElementById("sortSelect");

  // スニペット詳細要素
  const snippetDetail = document.getElementById("snippetDetail");
  const snippetDetailTitle = document.getElementById("snippetDetailTitle");
  const snippetDetailCategory = document.getElementById(
    "snippetDetailCategory"
  );
  const snippetDetailLanguage = document.getElementById(
    "snippetDetailLanguage"
  );
  const snippetDetailDate = document.getElementById("snippetDetailDate");
  const snippetDetailTags = document.getElementById("snippetDetailTags");
  const snippetDetailDescription = document.getElementById(
    "snippetDetailDescription"
  );
  const snippetDetailCode = document.getElementById("snippetDetailCode");
  const editSnippetBtn = document.getElementById("editSnippetBtn");
  const exportSnippetBtn = document.getElementById("exportSnippetBtn");
  const closeDetailBtn = document.getElementById("closeDetailBtn");
  const copyCodeBtn = document.getElementById("copyCodeBtn");

  // スニペットモーダル要素
  const snippetModal = document.getElementById("snippetModal");
  const snippetModalTitle = document.getElementById("snippetModalTitle");
  const snippetForm = document.getElementById("snippetForm");
  const snippetId = document.getElementById("snippetId");
  const snippetTitle = document.getElementById("snippetTitle");
  const snippetLanguage = document.getElementById("snippetLanguage");
  const snippetCategory = document.getElementById("snippetCategory");
  const snippetDescription = document.getElementById("snippetDescription");
  const snippetCode = document.getElementById("snippetCode");
  const snippetTags = document.getElementById("snippetTags");
  const cancelSnippetBtn = document.getElementById("cancelSnippetBtn");

  // カテゴリーモーダル要素
  const categoryModal = document.getElementById("categoryModal");
  const categoryForm = document.getElementById("categoryForm");
  const categoryId = document.getElementById("categoryId");
  const categoryName = document.getElementById("categoryName");
  const categoryColor = document.getElementById("categoryColor");
  const categoriesList = document.getElementById("categoriesList");
  const resetCategoryBtn = document.getElementById("resetCategoryBtn");

  // エクスポートモーダル要素
  const exportModal = document.getElementById("exportModal");
  const exportBtn = document.getElementById("exportBtn");
  const exportResult = document.getElementById("exportResult");
  const exportContent = document.getElementById("exportContent");
  const copyExportBtn = document.getElementById("copyExportBtn");
  const downloadExportBtn = document.getElementById("downloadExportBtn");
  const exportFormatRadios = document.getElementsByName("exportFormat");

  // 閉じるボタン
  const closeBtns = document.querySelectorAll(".close-btn");

  // 通知要素
  const notification = document.getElementById("notification");

  // データ
  let snippets = [];
  let categories = [];
  let tags = [];
  let currentSnippet = null;
  let activeFilters = {
    category: null,
    tags: [],
    search: "",
  };

  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // データの読み込み
    loadSnippets();
    loadCategories();
    loadTags();

    // イベントリスナーの設定
    setupEventListeners();
  });

  // スニペットを読み込む関数
  function loadSnippets() {
    window.pywebview.api.get_snippets().then(function (response) {
      if (response.status === "success") {
        snippets = response.snippets;
        renderSnippets();
      } else {
        showNotification("スニペットの読み込みに失敗しました", "error");
      }
    });
  }

  // カテゴリーを読み込む関数
  function loadCategories() {
    window.pywebview.api.get_categories().then(function (response) {
      if (response.status === "success") {
        categories = response.categories;
        renderCategories();
        updateCategoryDropdown();
      } else {
        showNotification("カテゴリーの読み込みに失敗しました", "error");
      }
    });
  }

  // タグを読み込む関数
  function loadTags() {
    window.pywebview.api.get_all_tags().then(function (response) {
      if (response.status === "success") {
        tags = response.tags;
        renderTagCloud();
      } else {
        showNotification("タグの読み込みに失敗しました", "error");
      }
    });
  }

  // スニペットをレンダリングする関数
  function renderSnippets() {
    snippetsList.innerHTML = "";

    // フィルタリングされたスニペットを取得
    let filteredSnippets = filterSnippets();

    // スニペットをソート
    filteredSnippets = sortSnippets(filteredSnippets);

    if (filteredSnippets.length === 0) {
      snippetsList.innerHTML =
        '<div class="no-snippets">スニペットがありません</div>';
      return;
    }

    filteredSnippets.forEach(function (snippet) {
      const category = getCategoryById(snippet.categoryId);
      const snippetElement = document.createElement("div");
      snippetElement.className = "snippet-item";
      snippetElement.dataset.id = snippet.id;

      snippetElement.innerHTML = `
        <div class="snippet-item-header">
          <div class="snippet-item-title">${snippet.title}</div>
          <div class="snippet-item-language">${snippet.language}</div>
        </div>
        <div class="snippet-item-meta">
          <div class="snippet-item-category">
            <div class="category-color" style="background-color: ${
              category ? category.color : "#9e9e9e"
            }"></div>
            <span>${category ? category.name : "その他"}</span>
          </div>
          <div class="snippet-item-date">${formatDate(snippet.updatedAt)}</div>
        </div>
        ${
          snippet.description
            ? `<div class="snippet-item-description">${snippet.description}</div>`
            : ""
        }
        ${
          snippet.tags && snippet.tags.length > 0
            ? `<div class="snippet-item-tags">
                ${snippet.tags
                  .map((tag) => `<div class="snippet-item-tag">${tag}</div>`)
                  .join("")}
              </div>`
            : ""
        }
      `;

      snippetElement.addEventListener("click", function () {
        openSnippetDetail(snippet);
      });

      snippetsList.appendChild(snippetElement);
    });
  }

  // スニペットをフィルタリングする関数
  function filterSnippets() {
    return snippets.filter(function (snippet) {
      // カテゴリーフィルター
      if (
        activeFilters.category !== null &&
        snippet.categoryId !== activeFilters.category
      ) {
        return false;
      }

      // タグフィルター
      if (
        activeFilters.tags.length > 0 &&
        !activeFilters.tags.every((tag) => snippet.tags.includes(tag))
      ) {
        return false;
      }

      // 検索フィルター
      if (activeFilters.search) {
        const searchLower = activeFilters.search.toLowerCase();
        return (
          snippet.title.toLowerCase().includes(searchLower) ||
          snippet.description.toLowerCase().includes(searchLower) ||
          snippet.code.toLowerCase().includes(searchLower) ||
          snippet.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }

  // スニペットをソートする関数
  function sortSnippets(snippetsToSort) {
    const sortType = sortSelect.value;

    return [...snippetsToSort].sort((a, b) => {
      if (sortType === "newest") {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      } else if (sortType === "oldest") {
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      } else if (sortType === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }

  // カテゴリーをレンダリングする関数
  function renderCategories() {
    // サイドバーのカテゴリーリスト
    categoryList.innerHTML = `
      <li class="category-item ${
        activeFilters.category === null ? "active" : ""
      }" data-id="all">
        <span class="category-name">すべて</span>
        <span class="category-count">${snippets.length}</span>
      </li>
    `;

    categories.forEach(function (category) {
      const count = snippets.filter(
        (snippet) => snippet.categoryId === category.id
      ).length;
      const categoryElement = document.createElement("li");
      categoryElement.className = `category-item ${
        activeFilters.category === category.id ? "active" : ""
      }`;
      categoryElement.dataset.id = category.id;

      categoryElement.innerHTML = `
        <div class="category-color" style="background-color: ${category.color}"></div>
        <span class="category-name">${category.name}</span>
        <span class="category-count">${count}</span>
      `;

      categoryElement.addEventListener("click", function () {
        // カテゴリーフィルターを設定
        if (activeFilters.category === category.id) {
          activeFilters.category = null;
        } else {
          activeFilters.category = category.id;
        }
        // カテゴリーリストを更新
        renderCategories();
        // スニペットリストを更新
        renderSnippets();
      });

      categoryList.appendChild(categoryElement);
    });

    // カテゴリー管理モーダルのカテゴリーリスト
    categoriesList.innerHTML = "";
    categories.forEach(function (category) {
      const categoryElement = document.createElement("div");
      categoryElement.className = "category-item-manage";
      categoryElement.dataset.id = category.id;

      categoryElement.innerHTML = `
        <div class="category-name-color">
          <div class="category-color" style="background-color: ${
            category.color
          }"></div>
          <span>${category.name}</span>
        </div>
        <div class="category-actions">
          <button class="icon-btn edit-category-btn" title="編集">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-btn delete-category-btn" title="削除" ${
            category.id <= 10 ? "disabled" : ""
          }>
            <span class="material-icons">delete</span>
          </button>
        </div>
      `;

      // 編集ボタンのイベントリスナー
      const editBtn = categoryElement.querySelector(".edit-category-btn");
      editBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openEditCategoryModal(category);
      });

      // 削除ボタンのイベントリスナー
      const deleteBtn = categoryElement.querySelector(".delete-category-btn");
      if (category.id > 10) {
        // デフォルトカテゴリーは削除不可
        deleteBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          deleteCategory(category.id);
        });
      }

      categoriesList.appendChild(categoryElement);
    });
  }

  // タグクラウドをレンダリングする関数
  function renderTagCloud() {
    tagCloud.innerHTML = "";

    if (tags.length === 0) {
      tagCloud.innerHTML = '<div class="no-tags">タグがありません</div>';
      return;
    }

    tags.forEach(function (tag) {
      const tagElement = document.createElement("div");
      tagElement.className = `tag ${
        activeFilters.tags.includes(tag) ? "active" : ""
      }`;
      tagElement.textContent = tag;

      tagElement.addEventListener("click", function () {
        // タグフィルターを設定
        if (activeFilters.tags.includes(tag)) {
          activeFilters.tags = activeFilters.tags.filter((t) => t !== tag);
        } else {
          activeFilters.tags.push(tag);
        }
        // タグクラウドを更新
        renderTagCloud();
        // スニペットリストを更新
        renderSnippets();
      });

      tagCloud.appendChild(tagElement);
    });
  }

  // カテゴリードロップダウンを更新する関数
  function updateCategoryDropdown() {
    snippetCategory.innerHTML = "";

    categories.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      snippetCategory.appendChild(option);
    });
  }

  // スニペット詳細を開く関数
  function openSnippetDetail(snippet) {
    currentSnippet = snippet;
    const category = getCategoryById(snippet.categoryId);

    snippetDetailTitle.textContent = snippet.title;
    snippetDetailCategory.textContent = category ? category.name : "その他";
    snippetDetailLanguage.textContent = snippet.language;
    snippetDetailDate.textContent = formatDate(snippet.updatedAt);

    // タグを表示
    snippetDetailTags.innerHTML = "";
    if (snippet.tags && snippet.tags.length > 0) {
      snippet.tags.forEach(function (tag) {
        const tagElement = document.createElement("div");
        tagElement.className = "snippet-tag";
        tagElement.textContent = tag;
        snippetDetailTags.appendChild(tagElement);
      });
    } else {
      snippetDetailTags.innerHTML = '<div class="no-tags">タグなし</div>';
    }

    // 説明を表示
    snippetDetailDescription.textContent = snippet.description || "説明なし";

    // コードを表示して構文ハイライト
    snippetDetailCode.textContent = snippet.code;
    snippetDetailCode.className = `language-${snippet.language}`;
    hljs.highlightElement(snippetDetailCode);

    // 詳細パネルを表示
    snippetDetail.classList.add("active");
  }

  // スニペット詳細を閉じる関数
  function closeSnippetDetail() {
    snippetDetail.classList.remove("active");
    currentSnippet = null;
  }

  // スニペット追加モーダルを開く関数
  function openAddSnippetModal() {
    snippetForm.reset();
    snippetId.value = "";
    snippetModalTitle.textContent = "新規スニペット";
    snippetModal.style.display = "block";
  }

  // スニペット編集モーダルを開く関数
  function openEditSnippetModal(snippet) {
    snippetId.value = snippet.id;
    snippetTitle.value = snippet.title;
    snippetLanguage.value = snippet.language;
    snippetCategory.value = snippet.categoryId;
    snippetDescription.value = snippet.description || "";
    snippetCode.value = snippet.code;
    snippetTags.value = snippet.tags.join(", ");

    snippetModalTitle.textContent = "スニペットを編集";
    snippetModal.style.display = "block";
  }

  // カテゴリー追加モーダルを開く関数
  function openAddCategoryModal() {
    categoryForm.reset();
    categoryId.value = "";
    categoryColor.value = "#9e9e9e";
    categoryModal.style.display = "block";
  }

  // カテゴリー編集モーダルを開く関数
  function openEditCategoryModal(category) {
    categoryId.value = category.id;
    categoryName.value = category.name;
    categoryColor.value = category.color;
    categoryModal.style.display = "block";
  }

  // エクスポートモーダルを開く関数
  function openExportModal() {
    // ラジオボタンをリセット
    exportFormatRadios[0].checked = true;
    // エクスポート結果を非表示
    exportResult.classList.add("hidden");
    exportModal.style.display = "block";
  }

  // スニペットを保存する関数
  function saveSnippet(event) {
    event.preventDefault();

    // タグを配列に変換
    const tagsArray = snippetTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const snippetData = {
      title: snippetTitle.value,
      language: snippetLanguage.value,
      categoryId: parseInt(snippetCategory.value),
      description: snippetDescription.value,
      code: snippetCode.value,
      tags: tagsArray,
    };

    if (snippetId.value) {
      // スニペットを更新
      window.pywebview.api
        .update_snippet(parseInt(snippetId.value), snippetData)
        .then(function (response) {
          if (response.status === "success") {
            // スニペットを更新
            const index = snippets.findIndex(
              (s) => s.id === parseInt(snippetId.value)
            );
            if (index !== -1) {
              snippets[index] = response.snippet;
              renderSnippets();
              loadTags(); // タグを再読み込み
              showNotification("スニペットを更新しました", "success");

              // 現在表示中のスニペットが更新された場合は詳細表示も更新
              if (currentSnippet && currentSnippet.id === response.snippet.id) {
                openSnippetDetail(response.snippet);
              }
            }

            // モーダルを閉じる
            snippetModal.style.display = "none";
          } else {
            showNotification(response.message, "error");
          }
        });
    } else {
      // 新しいスニペットを追加
      window.pywebview.api.add_snippet(snippetData).then(function (response) {
        if (response.status === "success") {
          // スニペットを追加
          snippets.push(response.snippet);
          renderSnippets();
          loadTags(); // タグを再読み込み
          showNotification("スニペットを追加しました", "success");

          // モーダルを閉じる
          snippetModal.style.display = "none";
        } else {
          showNotification(response.message, "error");
        }
      });
    }
  }

  // スニペットを削除する関数
  function deleteSnippet(snippetId) {
    if (confirm("このスニペットを削除してもよろしいですか？")) {
      window.pywebview.api.delete_snippet(snippetId).then(function (response) {
        if (response.status === "success") {
          // スニペットを削除
          snippets = snippets.filter((s) => s.id !== snippetId);
          renderSnippets();
          loadTags(); // タグを再読み込み
          showNotification("スニペットを削除しました", "success");

          // 現在表示中のスニペットが削除された場合は詳細表示を閉じる
          if (currentSnippet && currentSnippet.id === snippetId) {
            closeSnippetDetail();
          }
        } else {
          showNotification(response.message, "error");
        }
      });
    }
  }

  // カテゴリーを保存する関数
  function saveCategory(event) {
    event.preventDefault();

    const categoryData = {
      name: categoryName.value,
      color: categoryColor.value,
    };

    if (categoryId.value) {
      // カテゴリーを更新
      window.pywebview.api
        .update_category(parseInt(categoryId.value), categoryData)
        .then(function (response) {
          if (response.status === "success") {
            // カテゴリーを更新
            const index = categories.findIndex(
              (c) => c.id === parseInt(categoryId.value)
            );
            if (index !== -1) {
              categories[index] = response.category;
              renderCategories();
              updateCategoryDropdown();
              renderSnippets(); // カテゴリー名や色が変わるのでスニペットも再レンダリング
              showNotification("カテゴリーを更新しました", "success");

              // 現在表示中のスニペットのカテゴリーが更新された場合は詳細表示も更新
              if (
                currentSnippet &&
                currentSnippet.categoryId === response.category.id
              ) {
                openSnippetDetail(currentSnippet);
              }
            }

            // フォームをリセット
            categoryForm.reset();
            categoryId.value = "";
            categoryColor.value = "#9e9e9e";
          } else {
            showNotification(response.message, "error");
          }
        });
    } else {
      // 新しいカテゴリーを追加
      window.pywebview.api.add_category(categoryData).then(function (response) {
        if (response.status === "success") {
          // カテゴリーを追加
          categories.push(response.category);
          renderCategories();
          updateCategoryDropdown();
          showNotification("カテゴリーを追加しました", "success");

          // フォームをリセット
          categoryForm.reset();
          categoryId.value = "";
          categoryColor.value = "#9e9e9e";
        } else {
          showNotification(response.message, "error");
        }
      });
    }
  }

  // カテゴリーを削除する関数
  function deleteCategory(categoryId) {
    if (
      confirm(
        "このカテゴリーを削除してもよろしいですか？このカテゴリーを使用しているスニペットは「その他」カテゴリーに移動します。"
      )
    ) {
      window.pywebview.api
        .delete_category(categoryId)
        .then(function (response) {
          if (response.status === "success") {
            // カテゴリーを削除
            categories = categories.filter((c) => c.id !== categoryId);
            // アクティブフィルターをリセット
            if (activeFilters.category === categoryId) {
              activeFilters.category = null;
            }
            // スニペットを再読み込み（カテゴリーが変更されたスニペットがあるため）
            loadSnippets();
            renderCategories();
            updateCategoryDropdown();
            showNotification("カテゴリーを削除しました", "success");
          } else {
            showNotification(response.message, "error");
          }
        });
    }
  }

  // スニペットをエクスポートする関数
  function exportSnippet() {
    if (!currentSnippet) {
      showNotification("エクスポートするスニペットがありません", "error");
      return;
    }

    // 選択されたフォーマットを取得
    let format = "text";
    for (const radio of exportFormatRadios) {
      if (radio.checked) {
        format = radio.value;
        break;
      }
    }

    window.pywebview.api
      .export_snippet(currentSnippet.id, format)
      .then(function (response) {
        if (response.status === "success") {
          // エクスポート結果を表示
          exportContent.textContent = response.content;
          exportResult.classList.remove("hidden");

          // ダウンロードボタンにファイル名を設定
          downloadExportBtn.setAttribute("data-filename", response.filename);
        } else {
          showNotification(response.message, "error");
        }
      });
  }

  // エクスポート結果をコピーする関数
  function copyExportContent() {
    navigator.clipboard
      .writeText(exportContent.textContent)
      .then(function () {
        showNotification("クリップボードにコピーしました", "success");
      })
      .catch(function () {
        showNotification("コピーに失敗しました", "error");
      });
  }

  // エクスポート結果をダウンロードする関数
  function downloadExportContent() {
    const content = exportContent.textContent;
    const filename = downloadExportBtn.getAttribute("data-filename");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // コードをコピーする関数
  function copyCode() {
    if (!currentSnippet) return;

    navigator.clipboard
      .writeText(currentSnippet.code)
      .then(function () {
        showNotification("コードをクリップボードにコピーしました", "success");
      })
      .catch(function () {
        showNotification("コピーに失敗しました", "error");
      });
  }

  // 検索を実行する関数
  function performSearch() {
    activeFilters.search = searchInput.value.trim();
    renderSnippets();
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

  // 日付をフォーマットする関数
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // カテゴリーIDからカテゴリーを取得する関数
  function getCategoryById(categoryId) {
    return categories.find((category) => category.id === categoryId);
  }

  // イベントリスナーを設定する関数
  function setupEventListeners() {
    // スニペット追加ボタン
    addSnippetBtn.addEventListener("click", openAddSnippetModal);

    // スニペットフォーム送信
    snippetForm.addEventListener("submit", saveSnippet);

    // スニペットキャンセルボタン
    cancelSnippetBtn.addEventListener("click", function () {
      snippetModal.style.display = "none";
    });

    // スニペット詳細の編集ボタン
    editSnippetBtn.addEventListener("click", function () {
      if (currentSnippet) {
        openEditSnippetModal(currentSnippet);
      }
    });

    // スニペット詳細のエクスポートボタン
    exportSnippetBtn.addEventListener("click", function () {
      if (currentSnippet) {
        openExportModal();
      }
    });

    // スニペット詳細の閉じるボタン
    closeDetailBtn.addEventListener("click", closeSnippetDetail);

    // コードコピーボタン
    copyCodeBtn.addEventListener("click", copyCode);

    // カテゴリー管理ボタン
    manageCategoriesBtn.addEventListener("click", openAddCategoryModal);

    // カテゴリーフォーム送信
    categoryForm.addEventListener("submit", saveCategory);

    // カテゴリーリセットボタン
    resetCategoryBtn.addEventListener("click", function () {
      categoryForm.reset();
      categoryId.value = "";
      categoryColor.value = "#9e9e9e";
    });

    // エクスポートボタン
    exportBtn.addEventListener("click", exportSnippet);

    // エクスポート結果コピーボタン
    copyExportBtn.addEventListener("click", copyExportContent);

    // エクスポート結果ダウンロードボタン
    downloadExportBtn.addEventListener("click", downloadExportContent);

    // 検索ボタン
    searchBtn.addEventListener("click", performSearch);

    // 検索入力フィールドでEnterキーを押したとき
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });

    // ソート選択変更時
    sortSelect.addEventListener("change", function () {
      renderSnippets();
    });

    // 閉じるボタン
    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const modal = this.closest(".modal");
        modal.style.display = "none";
      });
    });

    // モーダル外クリックで閉じる
    window.addEventListener("click", function (event) {
      if (event.target === snippetModal) {
        snippetModal.style.display = "none";
      } else if (event.target === categoryModal) {
        categoryModal.style.display = "none";
      } else if (event.target === exportModal) {
        exportModal.style.display = "none";
      }
    });
  }
});
