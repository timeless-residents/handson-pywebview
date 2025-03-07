// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // 要素の取得
  // ヘッダー要素
  const createDatabaseBtn = document.getElementById("createDatabaseBtn");
  const connectDatabaseBtn = document.getElementById("connectDatabaseBtn");

  // サイドバー要素
  const connectionStatus = document.getElementById("connectionStatus");
  const currentDatabase = document.getElementById("currentDatabase");
  const tablesList = document.getElementById("tablesList");

  // テーブルビュー要素
  const tableViewTitle = document.getElementById("tableViewTitle");
  const addRowBtn = document.getElementById("addRowBtn");
  const refreshTableBtn = document.getElementById("refreshTableBtn");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const dataTable = document.getElementById("dataTable");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const paginationInfo = document.getElementById("paginationInfo");

  // クエリエディタ要素
  const executeQueryBtn = document.getElementById("executeQueryBtn");
  const exportResultsBtn = document.getElementById("exportResultsBtn");
  const resultsTable = document.getElementById("resultsTable");
  const queryStats = document.getElementById("queryStats");

  // テーブル構造要素
  const structureViewTitle = document.getElementById("structureViewTitle");
  const columnsTable = document.getElementById("columnsTable");
  const indicesTable = document.getElementById("indicesTable");
  const foreignKeysTable = document.getElementById("foreignKeysTable");

  // モーダル要素
  const connectDatabaseModal = document.getElementById("connectDatabaseModal");
  const createDatabaseModal = document.getElementById("createDatabaseModal");
  const editRowModal = document.getElementById("editRowModal");
  const exportModal = document.getElementById("exportModal");
  const confirmDialog = document.getElementById("confirmDialog");
  const databaseList = document.getElementById("databaseList");
  const createDatabaseForm = document.getElementById("createDatabaseForm");
  const databaseName = document.getElementById("databaseName");
  const cancelCreateDatabaseBtn = document.getElementById(
    "cancelCreateDatabaseBtn"
  );
  const editRowForm = document.getElementById("editRowForm");
  const editRowFields = document.getElementById("editRowFields");
  const editRowModalTitle = document.getElementById("editRowModalTitle");
  const cancelEditRowBtn = document.getElementById("cancelEditRowBtn");
  const exportBtn = document.getElementById("exportBtn");
  const exportResult = document.getElementById("exportResult");
  const exportContent = document.getElementById("exportContent");
  const copyExportBtn = document.getElementById("copyExportBtn");
  const downloadExportBtn = document.getElementById("downloadExportBtn");
  const exportFormatRadios = document.getElementsByName("exportFormat");
  const confirmMessage = document.getElementById("confirmMessage");
  const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
  const okConfirmBtn = document.getElementById("okConfirmBtn");

  // 閉じるボタン
  const closeBtns = document.querySelectorAll(".close-btn");

  // タブ要素
  const tabs = document.querySelectorAll(".tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  // 通知要素
  const notification = document.getElementById("notification");

  // データ
  let currentTable = null;
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.value);
  let tableColumns = [];
  let primaryKeyColumn = null;
  let sqlEditor = null;
  let lastQuery = null;
  let confirmCallback = null;

  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // SQLエディタの初期化
    initSqlEditor();

    // イベントリスナーの設定
    setupEventListeners();

    // データベースリストの読み込み
    loadDatabaseList();
  });

  // SQLエディタの初期化
  function initSqlEditor() {
    sqlEditor = CodeMirror.fromTextArea(document.getElementById("sqlEditor"), {
      mode: "text/x-sql",
      theme: "dracula",
      lineNumbers: true,
      indentWithTabs: true,
      smartIndent: true,
      lineWrapping: true,
      matchBrackets: true,
      autofocus: false,
      extraKeys: { "Ctrl-Space": "autocomplete" },
    });

    // デフォルトのSQLクエリを設定
    sqlEditor.setValue("SELECT * FROM sqlite_master WHERE type='table';");
  }

  // イベントリスナーの設定
  function setupEventListeners() {
    // データベース接続ボタン
    connectDatabaseBtn.addEventListener("click", function () {
      openConnectDatabaseModal();
    });

    // データベース作成ボタン
    createDatabaseBtn.addEventListener("click", function () {
      openCreateDatabaseModal();
    });

    // データベース作成フォーム送信
    createDatabaseForm.addEventListener("submit", function (e) {
      e.preventDefault();
      createDatabase();
    });

    // データベース作成キャンセルボタン
    cancelCreateDatabaseBtn.addEventListener("click", function () {
      createDatabaseModal.style.display = "none";
    });

    // 行追加ボタン
    addRowBtn.addEventListener("click", function () {
      openAddRowModal();
    });

    // テーブル更新ボタン
    refreshTableBtn.addEventListener("click", function () {
      loadTableData(currentTable);
    });

    // ページサイズ変更
    pageSizeSelect.addEventListener("change", function () {
      pageSize = parseInt(this.value);
      currentPage = 1;
      loadTableData(currentTable);
    });

    // 前のページボタン
    prevPageBtn.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        loadTableData(currentTable);
      }
    });

    // 次のページボタン
    nextPageBtn.addEventListener("click", function () {
      currentPage++;
      loadTableData(currentTable);
    });

    // クエリ実行ボタン
    executeQueryBtn.addEventListener("click", function () {
      executeQuery();
    });

    // 結果エクスポートボタン
    exportResultsBtn.addEventListener("click", function () {
      openExportModal();
    });

    // エクスポートボタン
    exportBtn.addEventListener("click", function () {
      exportQueryResults();
    });

    // エクスポート結果コピーボタン
    copyExportBtn.addEventListener("click", function () {
      copyExportContent();
    });

    // エクスポート結果ダウンロードボタン
    downloadExportBtn.addEventListener("click", function () {
      downloadExportContent();
    });

    // 行編集フォーム送信
    editRowForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveRowData();
    });

    // 行編集キャンセルボタン
    cancelEditRowBtn.addEventListener("click", function () {
      editRowModal.style.display = "none";
    });

    // 確認ダイアログOKボタン
    okConfirmBtn.addEventListener("click", function () {
      if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
      }
      confirmDialog.style.display = "none";
    });

    // 確認ダイアログキャンセルボタン
    cancelConfirmBtn.addEventListener("click", function () {
      confirmCallback = null;
      confirmDialog.style.display = "none";
    });

    // タブ切り替え
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const tabId = this.getAttribute("data-tab");

        // アクティブなタブを変更
        tabs.forEach(function (t) {
          t.classList.remove("active");
        });
        this.classList.add("active");

        // タブコンテンツを表示
        tabPanes.forEach(function (pane) {
          pane.classList.remove("active");
        });
        document.getElementById(tabId).classList.add("active");

        // クエリエディタのサイズを調整（表示後に実行）
        if (tabId === "query-editor" && sqlEditor) {
          setTimeout(function () {
            sqlEditor.refresh();
          }, 10);
        }
      });
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
      if (event.target === connectDatabaseModal) {
        connectDatabaseModal.style.display = "none";
      } else if (event.target === createDatabaseModal) {
        createDatabaseModal.style.display = "none";
      } else if (event.target === editRowModal) {
        editRowModal.style.display = "none";
      } else if (event.target === exportModal) {
        exportModal.style.display = "none";
      } else if (event.target === confirmDialog) {
        confirmDialog.style.display = "none";
      }
    });
  }

  // データベースリストを読み込む関数
  function loadDatabaseList() {
    window.pywebview.api.get_database_list().then(function (response) {
      if (response.status === "success") {
        renderDatabaseList(response.databases);
      } else {
        showNotification(response.message, "error");
      }
    });
  }

  // データベースリストをレンダリングする関数
  function renderDatabaseList(databases) {
    if (databases.length === 0) {
      databaseList.innerHTML =
        '<div class="no-databases">データベースがありません</div>';
      return;
    }

    databaseList.innerHTML = "";
    databases.forEach(function (db) {
      const dbElement = document.createElement("div");
      dbElement.className = "database-item";
      dbElement.innerHTML = `
                <div class="database-item-header">
                    <div class="database-name">${db.name}</div>
                    <div class="database-size">${db.size}</div>
                </div>
                <div class="database-path">${db.path}</div>
                <div class="database-modified">更新日時: ${db.modified}</div>
            `;

      dbElement.addEventListener("click", function () {
        connectDatabase(db.path);
        connectDatabaseModal.style.display = "none";
      });

      databaseList.appendChild(dbElement);
    });
  }

  // データベースに接続する関数
  function connectDatabase(dbPath) {
    window.pywebview.api.connect_database(dbPath).then(function (response) {
      if (response.status === "success") {
        // 接続状態を更新
        connectionStatus.textContent = "接続中";
        connectionStatus.classList.remove("not-connected");
        connectionStatus.classList.add("connected");
        currentDatabase.textContent = dbPath.split("/").pop();

        // ボタンを有効化
        executeQueryBtn.disabled = false;

        // テーブル一覧を読み込む
        loadTables();

        showNotification(response.message, "success");
      } else {
        showNotification(response.message, "error");
      }
    });
  }

  // テーブル一覧を読み込む関数
  function loadTables() {
    window.pywebview.api.get_tables().then(function (response) {
      if (response.status === "success") {
        renderTables(response.tables);
      } else {
        showNotification(response.message, "error");
      }
    });
  }

  // テーブル一覧をレンダリングする関数
  function renderTables(tables) {
    if (tables.length === 0) {
      tablesList.innerHTML = '<li class="no-tables">テーブルがありません</li>';
      return;
    }

    tablesList.innerHTML = "";
    tables.forEach(function (table) {
      const tableElement = document.createElement("li");
      tableElement.innerHTML = `
                <span class="table-name">${table.name}</span>
                <span class="table-count">${table.rows}</span>
            `;

      tableElement.addEventListener("click", function () {
        try {
          // 他のテーブルの選択状態を解除
          document.querySelectorAll(".tables-list li").forEach(function (li) {
            li.classList.remove("active");
          });

          // このテーブルを選択状態にする
          tableElement.classList.add("active");

          // タイトルを更新
          tableViewTitle.textContent = `テーブル: ${table.name}`;
          structureViewTitle.textContent = `テーブル構造: ${table.name}`;

          // ボタンを有効化
          addRowBtn.disabled = false;
          refreshTableBtn.disabled = false;
          pageSizeSelect.disabled = false;

          // テーブル名を保存
          currentTable = table.name;
          currentPage = 1;

          // テーブルデータを読み込む - エラーハンドリングを追加
          loadTableData(table.name).catch(function (error) {
            console.error("テーブルデータ読み込みエラー:", error);
            showNotification("テーブルデータの読み込みに失敗しました", "error");
          });

          // 少し遅延してからテーブル構造を読み込む
          setTimeout(function () {
            loadTableStructure(table.name).catch(function (error) {
              console.error("テーブル構造読み込みエラー:", error);
              showNotification("テーブル構造の読み込みに失敗しました", "error");
            });
          }, 100);
        } catch (e) {
          console.error("テーブル選択エラー:", e);
          showNotification("テーブルの選択中にエラーが発生しました", "error");
        }
      });

      tablesList.appendChild(tableElement);
    });
  }

  // テーブルデータを読み込む関数
  function loadTableData(tableName, page = currentPage, size = pageSize) {
    if (!tableName)
      return Promise.reject(new Error("テーブル名が指定されていません"));

    return new Promise((resolve, reject) => {
      window.pywebview.api
        .get_table_data(tableName, page, size)
        .then(function (response) {
          if (response.status === "success") {
            try {
              renderTableData(response);
              updatePagination(response.pagination);
              resolve(response);
            } catch (error) {
              console.error("テーブルデータのレンダリングエラー:", error);
              reject(error);
            }
          } else {
            showNotification(response.message, "error");
            reject(new Error(response.message));
          }
        })
        .catch(function (error) {
          console.error("API呼び出しエラー:", error);
          reject(error);
        });
    });
  }

  // テーブルデータをレンダリングする関数
  function renderTableData(response) {
    const { table, columns, data } = response;
    tableColumns = columns;

    // 主キーカラムを特定
    primaryKeyColumn = columns.find((col) => col.pk)?.name;

    // テーブルヘッダーを生成
    const thead = dataTable.querySelector("thead tr");
    thead.innerHTML = '<th class="actions-column">操作</th>';
    columns.forEach(function (column) {
      thead.innerHTML += `<th>${column.name}${column.pk ? " (PK)" : ""}</th>`;
    });

    // テーブルボディを生成
    const tbody = dataTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="${
        columns.length + 1
      }" class="no-data">データがありません</td>`;
      tbody.appendChild(row);
      return;
    }

    data.forEach(function (rowData) {
      const row = document.createElement("tr");

      // 操作カラム
      const actionsCell = document.createElement("td");
      actionsCell.className = "row-actions";
      actionsCell.innerHTML = `
                <button class="icon-btn edit-btn" title="編集">
                    <span class="material-icons">edit</span>
                </button>
                <button class="icon-btn delete-btn" title="削除">
                    <span class="material-icons">delete</span>
                </button>
            `;

      // 編集ボタンのイベントリスナー
      actionsCell
        .querySelector(".edit-btn")
        .addEventListener("click", function (e) {
          e.stopPropagation();
          openEditRowModal(rowData);
        });

      // 削除ボタンのイベントリスナー
      actionsCell
        .querySelector(".delete-btn")
        .addEventListener("click", function (e) {
          e.stopPropagation();
          confirmDeleteRow(rowData);
        });

      row.appendChild(actionsCell);

      // データカラム
      columns.forEach(function (column) {
        const cell = document.createElement("td");
        cell.textContent =
          rowData[column.name] !== null ? rowData[column.name] : "NULL";
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
  }

  // ページネーション情報を更新する関数
  function updatePagination(pagination) {
    const { page, totalPages, totalRows } = pagination;
    currentPage = page;

    // ページネーション情報を表示
    paginationInfo.textContent = `${page} / ${totalPages} (全${totalRows}件)`;

    // ボタンの有効/無効を設定
    prevPageBtn.disabled = page <= 1;
    nextPageBtn.disabled = page >= totalPages;
  }

  // テーブル構造を読み込む関数
  function loadTableStructure(tableName) {
    if (!tableName)
      return Promise.reject(new Error("テーブル名が指定されていません"));

    return new Promise((resolve, reject) => {
      window.pywebview.api
        .get_table_structure(tableName)
        .then(function (response) {
          if (response.status === "success") {
            try {
              renderTableStructure(response);
              resolve(response);
            } catch (error) {
              console.error("テーブル構造のレンダリングエラー:", error);
              reject(error);
            }
          } else {
            showNotification(response.message, "error");
            reject(new Error(response.message));
          }
        })
        .catch(function (error) {
          console.error("API呼び出しエラー:", error);
          reject(error);
        });
    });
  }

  // テーブル構造をレンダリングする関数
  function renderTableStructure(response) {
    const { columns, indices, foreign_keys } = response;

    // カラム情報をレンダリング
    const columnsBody = columnsTable.querySelector("tbody");
    columnsBody.innerHTML = "";

    if (!columns || columns.length === 0) {
      columnsBody.innerHTML =
        '<tr><td colspan="6" class="no-data">データがありません</td></tr>';
    } else {
      columns.forEach(function (column) {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${column.cid !== undefined ? column.cid : "-"}</td>
                    <td>${column.name !== undefined ? column.name : "-"}</td>
                    <td>${column.type !== undefined ? column.type : "-"}</td>
                    <td>${
                      column.notnull !== undefined
                        ? column.notnull
                          ? "×"
                          : "○"
                        : "-"
                    }</td>
                    <td>${
                      column.default_value !== undefined &&
                      column.default_value !== null
                        ? column.default_value
                        : "-"
                    }</td>
                    <td>${
                      column.pk !== undefined ? (column.pk ? "○" : "-") : "-"
                    }</td>
                `;
        columnsBody.appendChild(row);
      });
    }

    // インデックス情報をレンダリング
    const indicesBody = indicesTable.querySelector("tbody");
    indicesBody.innerHTML = "";

    if (!indices || indices.length === 0) {
      indicesBody.innerHTML =
        '<tr><td colspan="3" class="no-data">データがありません</td></tr>';
    } else {
      indices.forEach(function (index) {
        try {
          const row = document.createElement("tr");
          const columnNames =
            index.columns && Array.isArray(index.columns)
              ? index.columns.map((col) => col.name || "不明").join(", ")
              : "不明";

          row.innerHTML = `
                      <td>${index.name !== undefined ? index.name : "不明"}</td>
                      <td>${
                        index.unique !== undefined
                          ? index.unique
                            ? "○"
                            : "×"
                          : "-"
                      }</td>
                      <td>${columnNames}</td>
                  `;
          indicesBody.appendChild(row);
        } catch (e) {
          console.error("インデックス情報のレンダリングエラー:", e);
        }
      });
    }

    // 外部キー情報をレンダリング
    const foreignKeysBody = foreignKeysTable.querySelector("tbody");
    foreignKeysBody.innerHTML = "";

    if (!foreign_keys || foreign_keys.length === 0) {
      foreignKeysBody.innerHTML =
        '<tr><td colspan="6" class="no-data">データがありません</td></tr>';
    } else {
      foreign_keys.forEach(function (fk) {
        try {
          const row = document.createElement("tr");
          row.innerHTML = `
                      <td>${fk.id !== undefined ? fk.id : "-"}</td>
                      <td>${fk.table !== undefined ? fk.table : "-"}</td>
                      <td>${fk.from !== undefined ? fk.from : "-"}</td>
                      <td>${fk.to !== undefined ? fk.to : "-"}</td>
                      <td>${
                        fk.on_update !== undefined ? fk.on_update : "-"
                      }</td>
                      <td>${
                        fk.on_delete !== undefined ? fk.on_delete : "-"
                      }</td>
                  `;
          foreignKeysBody.appendChild(row);
        } catch (e) {
          console.error("外部キー情報のレンダリングエラー:", e);
        }
      });
    }
  }

  // 行追加モーダルを開く関数
  function openAddRowModal() {
    editRowModalTitle.textContent = "新規行を追加";
    editRowFields.innerHTML = "";

    // 各カラムの入力フィールドを生成
    tableColumns.forEach(function (column) {
      const formGroup = document.createElement("div");
      formGroup.className = "form-group";

      const label = document.createElement("label");
      label.setAttribute("for", `field_${column.name}`);
      label.textContent = `${column.name}${column.pk ? " (PK)" : ""}:`;

      const input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("id", `field_${column.name}`);
      input.setAttribute("name", column.name);

      // 主キーの場合は自動生成されることが多いので無効化
      if (column.pk && column.name.toLowerCase() === "id") {
        input.setAttribute("placeholder", "自動生成");
        input.setAttribute("disabled", "disabled");
      }

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      editRowFields.appendChild(formGroup);
    });

    editRowModal.style.display = "block";
  }

  // 行編集モーダルを開く関数
  function openEditRowModal(rowData) {
    editRowModalTitle.textContent = "行を編集";
    editRowFields.innerHTML = "";

    // 各カラムの入力フィールドを生成
    tableColumns.forEach(function (column) {
      const formGroup = document.createElement("div");
      formGroup.className = "form-group";

      const label = document.createElement("label");
      label.setAttribute("for", `field_${column.name}`);
      label.textContent = `${column.name}${column.pk ? " (PK)" : ""}:`;

      const input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("id", `field_${column.name}`);
      input.setAttribute("name", column.name);
      input.value = rowData[column.name] !== null ? rowData[column.name] : "";

      // 主キーの場合は編集不可
      if (column.pk) {
        input.setAttribute("readonly", "readonly");
      }

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      editRowFields.appendChild(formGroup);
    });

    editRowModal.style.display = "block";
  }

  // 行削除の確認ダイアログを表示する関数
  function confirmDeleteRow(rowData) {
    if (!primaryKeyColumn) {
      showNotification("主キーが見つかりません", "error");
      return;
    }

    const pkValue = rowData[primaryKeyColumn];
    confirmMessage.textContent = `ID ${pkValue} の行を削除してもよろしいですか？`;

    confirmCallback = function () {
      deleteRow(pkValue);
    };

    confirmDialog.style.display = "block";
  }

  // 行を削除する関数
  function deleteRow(primaryKeyValue) {
    window.pywebview.api
      .delete_table_data(currentTable, primaryKeyColumn, primaryKeyValue)
      .then(function (response) {
        if (response.status === "success") {
          showNotification(response.message, "success");
          loadTableData(currentTable);
        } else {
          showNotification(response.message, "error");
        }
      });
  }

  // 行データを保存する関数
  function saveRowData() {
    const formData = {};
    let isPrimaryKeyEmpty = false;
    let primaryKeyValue = null;

    // フォームデータを収集
    tableColumns.forEach(function (column) {
      const input = document.getElementById(`field_${column.name}`);
      if (!input.disabled && !input.readOnly) {
        // 空の場合はnullとして扱う
        formData[column.name] = input.value === "" ? null : input.value;
      }

      // 主キー値を取得
      if (column.pk) {
        primaryKeyValue = input.value;
        isPrimaryKeyEmpty = input.value === "" && !input.disabled;
      }
    });

    // 新規追加か更新かを判断
    if (editRowModalTitle.textContent === "新規行を追加" || isPrimaryKeyEmpty) {
      // 新規追加
      window.pywebview.api
        .insert_table_data(currentTable, formData)
        .then(function (response) {
          if (response.status === "success") {
            showNotification(response.message, "success");
            loadTableData(currentTable);
            editRowModal.style.display = "none";
          } else {
            showNotification(response.message, "error");
          }
        });
    } else {
      // 更新
      window.pywebview.api
        .update_table_data(
          currentTable,
          formData,
          primaryKeyColumn,
          primaryKeyValue
        )
        .then(function (response) {
          if (response.status === "success") {
            showNotification(response.message, "success");
            loadTableData(currentTable);
            editRowModal.style.display = "none";
          } else {
            showNotification(response.message, "error");
          }
        });
    }
  }

  // クエリを実行する関数
  function executeQuery() {
    const query = sqlEditor.getValue().trim();
    if (!query) return;

    lastQuery = query;

    window.pywebview.api.execute_query(query).then(function (response) {
      if (response.status === "success") {
        if (response.columns) {
          // SELECT文の結果
          renderQueryResults(response);
          exportResultsBtn.disabled = false;
        } else {
          // INSERT, UPDATE, DELETE文の結果
          showNotification(response.message, "success");
          queryStats.textContent = `${
            response.rowsAffected
          }行に影響しました (${response.executionTime.toFixed(3)}秒)`;
          resultsTable.querySelector("thead tr").innerHTML = "";
          resultsTable.querySelector("tbody").innerHTML =
            '<tr><td class="no-data">クエリが実行されました</td></tr>';
          exportResultsBtn.disabled = true;

          // テーブルデータを更新
          if (currentTable) {
            loadTableData(currentTable);
            loadTables(); // テーブル一覧も更新（行数が変わる可能性があるため）
          }
        }
      } else {
        showNotification(response.message, "error");
        queryStats.textContent = "エラーが発生しました";
        resultsTable.querySelector("thead tr").innerHTML = "";
        resultsTable.querySelector(
          "tbody"
        ).innerHTML = `<tr><td class="no-data">${response.message}</td></tr>`;
        exportResultsBtn.disabled = true;
      }
    });
  }

  // クエリ結果をレンダリングする関数
  function renderQueryResults(response) {
    const { columns, data, rowCount, executionTime } = response;

    // 統計情報を表示
    queryStats.textContent = `${rowCount}行 (${executionTime.toFixed(3)}秒)`;

    // テーブルヘッダーを生成
    const thead = resultsTable.querySelector("thead tr");
    thead.innerHTML = "";
    columns.forEach(function (column) {
      thead.innerHTML += `<th>${column.name}</th>`;
    });

    // テーブルボディを生成
    const tbody = resultsTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="${columns.length}" class="no-data">結果がありません</td>`;
      tbody.appendChild(row);
      return;
    }

    data.forEach(function (rowData) {
      const row = document.createElement("tr");
      columns.forEach(function (column) {
        const cell = document.createElement("td");
        cell.textContent =
          rowData[column.name] !== null ? rowData[column.name] : "NULL";
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
  }

  // データベース接続モーダルを開く関数
  function openConnectDatabaseModal() {
    loadDatabaseList();
    connectDatabaseModal.style.display = "block";
  }

  // データベース作成モーダルを開く関数
  function openCreateDatabaseModal() {
    databaseName.value = "";
    createDatabaseModal.style.display = "block";
  }

  // 新しいデータベースを作成する関数
  function createDatabase() {
    const dbName = databaseName.value.trim();
    if (!dbName) return;

    window.pywebview.api.create_database(dbName).then(function (response) {
      if (response.status === "success") {
        showNotification(response.message, "success");
        createDatabaseModal.style.display = "none";

        // 作成したデータベースに接続
        connectDatabase(response.path);
      } else {
        showNotification(response.message, "error");
      }
    });
  }

  // エクスポートモーダルを開く関数
  function openExportModal() {
    // エクスポート結果を非表示
    exportResult.classList.add("hidden");
    exportModal.style.display = "block";
  }

  // クエリ結果をエクスポートする関数
  function exportQueryResults() {
    if (!lastQuery) return;

    // 選択されたフォーマットを取得
    let format = "csv";
    for (const radio of exportFormatRadios) {
      if (radio.checked) {
        format = radio.value;
        break;
      }
    }

    window.pywebview.api
      .export_query_results(lastQuery, format)
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
