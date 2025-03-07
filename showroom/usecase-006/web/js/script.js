// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // 要素の取得
  // ダッシュボード要素
  const currentPeriod = document.getElementById("currentPeriod");
  const prevPeriodBtn = document.getElementById("prevPeriodBtn");
  const nextPeriodBtn = document.getElementById("nextPeriodBtn");
  const periodType = document.getElementById("periodType");
  const totalIncome = document.getElementById("totalIncome");
  const totalExpense = document.getElementById("totalExpense");
  const totalBalance = document.getElementById("totalBalance");
  const budgetProgressList = document.getElementById("budgetProgressList");

  // チャート要素
  const expensePieChart = document.getElementById("expensePieChart");
  const trendLineChart = document.getElementById("trendLineChart");

  // フィルター要素
  const filterType = document.getElementById("filterType");
  const filterCategory = document.getElementById("filterCategory");
  const filterDateFrom = document.getElementById("filterDateFrom");
  const filterDateTo = document.getElementById("filterDateTo");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  // トランザクションリスト要素
  const transactionsList = document.getElementById("transactionsList");

  // トランザクションモーダル要素
  const transactionModal = document.getElementById("transactionModal");
  const transactionModalTitle = document.getElementById(
    "transactionModalTitle"
  );
  const transactionForm = document.getElementById("transactionForm");
  const transactionId = document.getElementById("transactionId");
  const transactionType = document.getElementById("transactionType");
  const transactionDate = document.getElementById("transactionDate");
  const transactionAmount = document.getElementById("transactionAmount");
  const transactionCategory = document.getElementById("transactionCategory");
  const transactionDescription = document.getElementById(
    "transactionDescription"
  );
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const cancelTransactionBtn = document.getElementById("cancelTransactionBtn");

  // カテゴリーモーダル要素
  const categoryModal = document.getElementById("categoryModal");
  const categoryForm = document.getElementById("categoryForm");
  const categoryId = document.getElementById("categoryId");
  const categoryType = document.getElementById("categoryType");
  const categoryName = document.getElementById("categoryName");
  const categoryColor = document.getElementById("categoryColor");
  const categoriesList = document.getElementById("categoriesList");
  const manageCategoriesBtn = document.getElementById("manageCategoriesBtn");
  const resetCategoryBtn = document.getElementById("resetCategoryBtn");
  const tabBtns = document.querySelectorAll(".tab-btn");

  // 予算モーダル要素
  const budgetModal = document.getElementById("budgetModal");
  const budgetForm = document.getElementById("budgetForm");
  const budgetId = document.getElementById("budgetId");
  const budgetCategory = document.getElementById("budgetCategory");
  const budgetAmount = document.getElementById("budgetAmount");
  const budgetPeriod = document.getElementById("budgetPeriod");
  const budgetStartDate = document.getElementById("budgetStartDate");
  const budgetsList = document.getElementById("budgetsList");
  const manageBudgetsBtn = document.getElementById("manageBudgetsBtn");
  const resetBudgetBtn = document.getElementById("resetBudgetBtn");

  // 閉じるボタン
  const closeBtns = document.querySelectorAll(".close-btn");

  // 通知要素
  const notification = document.getElementById("notification");

  // データ
  let transactions = [];
  let categories = [];
  let budgets = [];
  let currentFilters = {
    type: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
  };

  // チャートインスタンス
  let expensePieChartInstance = null;
  let trendLineChartInstance = null;

  // 現在の期間
  let currentDate = new Date();
  let currentPeriodType = "month"; // 'month' または 'year'

  // 日付ピッカーの初期化
  const transactionDatePicker = flatpickr(transactionDate, {
    dateFormat: "Y-m-d",
    locale: "ja",
    allowInput: true,
    defaultDate: new Date(),
  });

  const filterDateFromPicker = flatpickr(filterDateFrom, {
    dateFormat: "Y-m-d",
    locale: "ja",
    allowInput: true,
  });

  const filterDateToPicker = flatpickr(filterDateTo, {
    dateFormat: "Y-m-d",
    locale: "ja",
    allowInput: true,
  });

  const budgetStartDatePicker = flatpickr(budgetStartDate, {
    dateFormat: "Y-m",
    locale: "ja",
    allowInput: true,
    defaultDate: new Date(),
  });

  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // データの読み込み
    loadTransactions();
    loadCategories();
    loadBudgets();

    // 現在の期間を設定
    updateCurrentPeriodDisplay();

    // イベントリスナーの設定
    setupEventListeners();
  });

  // トランザクションを読み込む関数
  function loadTransactions() {
    window.pywebview.api.get_transactions().then(function (response) {
      if (response.status === "success") {
        transactions = response.transactions;
        renderTransactions();
        updateDashboard();
      } else {
        showNotification("トランザクションの読み込みに失敗しました", "error");
      }
    });
  }

  // カテゴリーを読み込む関数
  function loadCategories() {
    window.pywebview.api.get_categories().then(function (response) {
      if (response.status === "success") {
        categories = response.categories;
        updateCategoryDropdowns();
        renderCategories();
      } else {
        showNotification("カテゴリーの読み込みに失敗しました", "error");
      }
    });
  }

  // 予算を読み込む関数
  function loadBudgets() {
    window.pywebview.api.get_budgets().then(function (response) {
      if (response.status === "success") {
        budgets = response.budgets;
        renderBudgets();
        updateBudgetProgress();
      } else {
        showNotification("予算の読み込みに失敗しました", "error");
      }
    });
  }

  // 現在の期間表示を更新する関数
  function updateCurrentPeriodDisplay() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    if (currentPeriodType === "month") {
      currentPeriod.textContent = `${year}年${month}月`;
    } else {
      currentPeriod.textContent = `${year}年`;
    }

    // ダッシュボードを更新
    updateDashboard();
  }

  // ダッシュボードを更新する関数
  function updateDashboard() {
    // 期間に応じたフォーマットを取得
    const periodFormat =
      currentPeriodType === "month"
        ? `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
          ).padStart(2, "0")}`
        : `${currentDate.getFullYear()}`;

    // サマリーを取得
    window.pywebview.api
      .get_summary(currentPeriodType, periodFormat)
      .then(function (response) {
        if (response.status === "success") {
          const summary = response.summary;

          // 金額をフォーマット
          totalIncome.textContent = formatCurrency(summary.totalIncome);
          totalExpense.textContent = formatCurrency(summary.totalExpense);
          totalBalance.textContent = formatCurrency(summary.balance);

          // 収支バランスに応じてクラスを変更
          if (summary.balance < 0) {
            totalBalance.classList.add("negative");
          } else {
            totalBalance.classList.remove("negative");
          }
        }
      });

    // カテゴリー別支出を取得して円グラフを更新
    updateExpensePieChart();

    // 月別トレンドを取得して折れ線グラフを更新
    updateTrendLineChart();

    // 予算進捗状況を更新
    updateBudgetProgress();
  }

  // カテゴリー別支出の円グラフを更新する関数
  function updateExpensePieChart() {
    const periodFormat =
      currentPeriodType === "month"
        ? `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
          ).padStart(2, "0")}`
        : `${currentDate.getFullYear()}`;

    window.pywebview.api
      .get_category_summary(currentPeriodType, periodFormat, "expense")
      .then(function (response) {
        if (response.status === "success") {
          const categorySummary = response.categorySummary;

          // チャートデータを準備
          const labels = categorySummary.map((item) => item.name);
          const data = categorySummary.map((item) => item.amount);
          const backgroundColor = categorySummary.map((item) => item.color);

          // 既存のチャートを破棄
          if (expensePieChartInstance) {
            expensePieChartInstance.destroy();
          }

          // 新しいチャートを作成
          expensePieChartInstance = new Chart(expensePieChart, {
            type: "pie",
            data: {
              labels: labels,
              datasets: [
                {
                  data: data,
                  backgroundColor: backgroundColor,
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 12,
                    font: {
                      size: 11,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.raw || 0;
                      const percentage =
                        categorySummary[context.dataIndex].percentage;
                      return `${label}: ${formatCurrency(
                        value
                      )} (${percentage}%)`;
                    },
                  },
                },
              },
            },
          });
        }
      });
  }

  // 月別トレンドの折れ線グラフを更新する関数
  function updateTrendLineChart() {
    const year = currentDate.getFullYear();
    console.log("Updating trend chart for year:", year);

    try {
      // 既存のチャートを破棄
      if (trendLineChartInstance) {
        trendLineChartInstance.destroy();
        trendLineChartInstance = null;
      }

      // テストデータを準備（APIからのデータがない場合のフォールバック）
      const dummyLabels = [
        "1月",
        "2月",
        "3月",
        "4月",
        "5月",
        "6月",
        "7月",
        "8月",
        "9月",
        "10月",
        "11月",
        "12月",
      ];
      // テスト用に2月と3月にデータを入れる
      const dummyIncomeData = [0, 168000, 165000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const dummyExpenseData = [0, 50, 300, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      // まず基本的なチャートを作成
      const ctx = trendLineChart.getContext("2d");
      trendLineChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: dummyLabels,
          datasets: [
            {
              label: "収入",
              data: dummyIncomeData,
              borderColor: "rgba(76, 175, 80, 1)",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderWidth: 2,
              fill: true,
            },
            {
              label: "支出",
              data: dummyExpenseData,
              borderColor: "rgba(244, 67, 54, 1)",
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              borderWidth: 2,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });

      console.log("Basic chart created, now fetching real data...");

      // 実際のデータを取得して更新
      Promise.all([
        window.pywebview.api.get_monthly_trend(year, "income"),
        window.pywebview.api.get_monthly_trend(year, "expense"),
      ])
        .then(function ([incomeResponse, expenseResponse]) {
          console.log(
            "Income response:",
            JSON.stringify(incomeResponse, null, 2)
          );
          console.log(
            "Expense response:",
            JSON.stringify(expenseResponse, null, 2)
          );

          if (
            incomeResponse.status === "success" &&
            expenseResponse.status === "success"
          ) {
            const incomeData = incomeResponse.trendData;
            const expenseData = expenseResponse.trendData;

            console.log(
              "Raw income data:",
              JSON.stringify(incomeData, null, 2)
            );
            console.log(
              "Raw expense data:",
              JSON.stringify(expenseData, null, 2)
            );

            // データを更新 - 月ごとに正しい位置にデータを配置
            const incomeValues = Array(12).fill(0);
            const expenseValues = Array(12).fill(0);

            // 収入データを配置
            incomeData.forEach((item) => {
              const month = parseInt(item.month.split("-")[1]) - 1; // 0-indexed
              incomeValues[month] = item.amount;
            });

            // 支出データを配置
            expenseData.forEach((item) => {
              const month = parseInt(item.month.split("-")[1]) - 1; // 0-indexed
              expenseValues[month] = item.amount;
            });

            console.log("Processed income values:", incomeValues);
            console.log("Processed expense values:", expenseValues);

            // チャートデータを更新
            trendLineChartInstance.data.datasets[0].data = incomeValues;
            trendLineChartInstance.data.datasets[1].data = expenseValues;
            trendLineChartInstance.update();

            console.log("Chart updated with real data");
          }
        })
        .catch(function (error) {
          console.error("Error fetching trend data:", error);
        });
    } catch (error) {
      console.error("Error in updateTrendLineChart:", error);
    }
  }

  // 予算進捗状況を更新する関数
  function updateBudgetProgress() {
    const periodFormat =
      currentPeriodType === "month"
        ? `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
          ).padStart(2, "0")}`
        : `${currentDate.getFullYear()}`;

    window.pywebview.api
      .get_budget_status(currentPeriodType, periodFormat)
      .then(function (response) {
        if (response.status === "success") {
          const budgetStatus = response.budgetStatus;
          budgetProgressList.innerHTML = "";

          if (budgetStatus.length === 0) {
            budgetProgressList.innerHTML =
              '<div class="no-budgets">予算が設定されていません</div>';
            return;
          }

          budgetStatus.forEach(function (budget) {
            const progressClass =
              budget.progress >= 100
                ? "danger"
                : budget.progress >= 80
                ? "warning"
                : "success";

            const budgetItem = document.createElement("div");
            budgetItem.className = "budget-progress-item";
            budgetItem.innerHTML = `
              <div class="budget-category">
                <div class="category-color" style="background-color: ${
                  budget.categoryColor
                }"></div>
                <div>${budget.categoryName}</div>
              </div>
              <div class="budget-progress">
                <div class="progress-bar">
                  <div class="progress-fill ${progressClass}" style="width: ${Math.min(
              budget.progress,
              100
            )}%"></div>
                </div>
                <div class="budget-amounts">
                  <div>¥0</div>
                  <div>${formatCurrency(budget.budgetAmount, false)}</div>
                </div>
              </div>
              <div class="budget-info">
                <div class="budget-spent">${formatCurrency(
                  budget.spentAmount,
                  false
                )}</div>
                <div class="budget-remaining ${
                  budget.remainingAmount < 0 ? "negative" : ""
                }">
                  残り: ${formatCurrency(budget.remainingAmount, false)}
                </div>
              </div>
            `;

            budgetProgressList.appendChild(budgetItem);
          });
        }
      });
  }

  // カテゴリードロップダウンを更新する関数
  function updateCategoryDropdowns() {
    // フィルターのカテゴリードロップダウンを更新
    filterCategory.innerHTML = '<option value="all">すべて</option>';

    // トランザクションフォームのカテゴリードロップダウンを更新
    transactionCategory.innerHTML = "";

    // 予算フォームのカテゴリードロップダウンを更新
    budgetCategory.innerHTML = "";

    // 支出カテゴリーを追加
    const expenseCategories = categories.filter((c) => c.type === "expense");
    if (expenseCategories.length > 0) {
      const expenseOptgroup = document.createElement("optgroup");
      expenseOptgroup.label = "支出";

      expenseCategories.forEach(function (category) {
        // フィルター用のオプションを追加
        const filterOption = document.createElement("option");
        filterOption.value = category.id;
        filterOption.textContent = category.name;
        filterCategory.appendChild(filterOption);

        // トランザクションフォーム用のオプションを追加
        const transactionOption = document.createElement("option");
        transactionOption.value = category.id;
        transactionOption.textContent = category.name;
        transactionOption.dataset.type = "expense";
        transactionCategory.appendChild(transactionOption);

        // 予算フォーム用のオプションを追加
        const budgetOption = document.createElement("option");
        budgetOption.value = category.id;
        budgetOption.textContent = category.name;
        budgetCategory.appendChild(budgetOption);
      });
    }

    // 収入カテゴリーを追加
    const incomeCategories = categories.filter((c) => c.type === "income");
    if (incomeCategories.length > 0) {
      const incomeOptgroup = document.createElement("optgroup");
      incomeOptgroup.label = "収入";

      incomeCategories.forEach(function (category) {
        // フィルター用のオプションを追加
        const filterOption = document.createElement("option");
        filterOption.value = category.id;
        filterOption.textContent = category.name;
        filterCategory.appendChild(filterOption);

        // トランザクションフォーム用のオプションを追加
        const transactionOption = document.createElement("option");
        transactionOption.value = category.id;
        transactionOption.textContent = category.name;
        transactionOption.dataset.type = "income";
        transactionCategory.appendChild(transactionOption);
      });
    }
  }

  // トランザクションをレンダリングする関数
  function renderTransactions() {
    transactionsList.innerHTML = "";

    // フィルタリングされたトランザクションを取得
    const filteredTransactions = filterTransactions();

    if (filteredTransactions.length === 0) {
      transactionsList.innerHTML =
        '<div class="no-transactions">取引がありません</div>';
      return;
    }

    // トランザクションをソート（日付の新しい順）
    filteredTransactions.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    // トランザクションを表示
    filteredTransactions.forEach(function (transaction) {
      const category = categories.find(
        (c) => c.id === transaction.categoryId
      ) || {
        name: "不明",
        color: "#9e9e9e",
        type: transaction.type,
      };

      const date = new Date(transaction.date);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const transactionElement = document.createElement("div");
      transactionElement.className = "transaction-item";
      transactionElement.dataset.id = transaction.id;

      transactionElement.innerHTML = `
        <div class="transaction-date">
          <div class="transaction-date-day">${day}</div>
          <div class="transaction-date-month">${year}/${month}</div>
        </div>
        <div class="transaction-category">
          <div class="category-color" style="background-color: ${
            category.color
          }"></div>
          <div>${category.name}</div>
        </div>
        <div class="transaction-content">
          <div class="transaction-description">${
            transaction.description || "説明なし"
          }</div>
          <div class="transaction-meta">
            ${new Date(transaction.createdAt).toLocaleString("ja-JP")}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === "income" ? "+" : "-"}${formatCurrency(
        transaction.amount,
        false
      )}
        </div>
        <div class="transaction-actions">
          <button class="icon-btn edit-transaction-btn" title="編集">
            <span class="material-icons">edit</span>
          </button>
                    <button class="icon-btn delete-transaction-btn" title="削除">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;

      // 編集ボタンのイベントリスナー
      const editBtn = transactionElement.querySelector(".edit-transaction-btn");
      editBtn.addEventListener("click", function () {
        openEditTransactionModal(transaction);
      });

      // 削除ボタンのイベントリスナー
      const deleteBtn = transactionElement.querySelector(
        ".delete-transaction-btn"
      );
      deleteBtn.addEventListener("click", function () {
        deleteTransaction(transaction.id);
      });

      transactionsList.appendChild(transactionElement);
    });
  }

  // トランザクションをフィルタリングする関数
  function filterTransactions() {
    return transactions.filter(function (transaction) {
      // 種類フィルター
      if (
        currentFilters.type !== "all" &&
        transaction.type !== currentFilters.type
      ) {
        return false;
      }

      // カテゴリーフィルター
      if (
        currentFilters.category !== "all" &&
        transaction.categoryId !== parseInt(currentFilters.category)
      ) {
        return false;
      }

      // 日付フィルター（開始日）
      if (
        currentFilters.dateFrom &&
        transaction.date < currentFilters.dateFrom
      ) {
        return false;
      }

      // 日付フィルター（終了日）
      if (currentFilters.dateTo && transaction.date > currentFilters.dateTo) {
        return false;
      }

      // 検索フィルター
      if (
        currentFilters.search &&
        !transaction.description
          .toLowerCase()
          .includes(currentFilters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }

  // カテゴリーをレンダリングする関数
  function renderCategories() {
    categoriesList.innerHTML = "";

    // 現在選択されているタイプのカテゴリーをフィルタリング
    const filteredCategories = categories.filter(
      (c) => c.type === categoryType.value
    );

    if (filteredCategories.length === 0) {
      categoriesList.innerHTML =
        '<div class="no-categories">カテゴリーがありません</div>';
      return;
    }

    filteredCategories.forEach(function (category) {
      const categoryElement = document.createElement("div");
      categoryElement.className = "category-item";
      categoryElement.dataset.id = category.id;

      categoryElement.innerHTML = `
                <div class="category-name">
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
                      category.id <= 13 ? "disabled" : ""
                    }>
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;

      // 編集ボタンのイベントリスナー
      const editBtn = categoryElement.querySelector(".edit-category-btn");
      editBtn.addEventListener("click", function () {
        openEditCategoryModal(category);
      });

      // 削除ボタンのイベントリスナー
      const deleteBtn = categoryElement.querySelector(".delete-category-btn");
      if (category.id > 13) {
        // デフォルトカテゴリーは削除不可
        deleteBtn.addEventListener("click", function () {
          deleteCategory(category.id);
        });
      }

      categoriesList.appendChild(categoryElement);
    });
  }

  // 予算をレンダリングする関数
  function renderBudgets() {
    budgetsList.innerHTML = "";

    if (budgets.length === 0) {
      budgetsList.innerHTML = '<div class="no-budgets">予算がありません</div>';
      return;
    }

    // 予算をソート（カテゴリー名順）
    const sortedBudgets = [...budgets].sort((a, b) => {
      const categoryA = categories.find((c) => c.id === a.categoryId) || {
        name: "不明",
      };
      const categoryB = categories.find((c) => c.id === b.categoryId) || {
        name: "不明",
      };
      return categoryA.name.localeCompare(categoryB.name);
    });

    sortedBudgets.forEach(function (budget) {
      const category = categories.find((c) => c.id === budget.categoryId) || {
        name: "不明",
        color: "#9e9e9e",
      };

      const budgetElement = document.createElement("div");
      budgetElement.className = "budget-item";
      budgetElement.dataset.id = budget.id;

      const periodText = budget.period === "monthly" ? "月次" : "年次";
      const startDate = budget.startDate;

      budgetElement.innerHTML = `
                <div class="budget-item-info">
                    <div class="budget-item-category">
                        <div class="category-color" style="background-color: ${
                          category.color
                        }"></div>
                        <span>${category.name}</span>
                    </div>
                    <div class="budget-item-period">${periodText} (${startDate})</div>
                </div>
                <div class="budget-item-amount">
                    ${formatCurrency(budget.amount, false)}
                </div>
                <div class="budget-item-actions">
                    <button class="icon-btn edit-budget-btn" title="編集">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-btn delete-budget-btn" title="削除">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;

      // 編集ボタンのイベントリスナー
      const editBtn = budgetElement.querySelector(".edit-budget-btn");
      editBtn.addEventListener("click", function () {
        openEditBudgetModal(budget);
      });

      // 削除ボタンのイベントリスナー
      const deleteBtn = budgetElement.querySelector(".delete-budget-btn");
      deleteBtn.addEventListener("click", function () {
        deleteBudget(budget.id);
      });

      budgetsList.appendChild(budgetElement);
    });
  }

  // トランザクション追加モーダルを開く関数
  function openAddTransactionModal() {
    // フォームをリセット
    transactionForm.reset();
    transactionId.value = "";
    transactionModalTitle.textContent = "取引を追加";
    transactionDatePicker.setDate(new Date());

    // トランザクションタイプに応じてカテゴリーを更新
    updateTransactionCategoryOptions();

    // モーダルを表示
    transactionModal.style.display = "block";
  }

  // トランザクション編集モーダルを開く関数
  function openEditTransactionModal(transaction) {
    // フォームに値を設定
    transactionId.value = transaction.id;
    transactionType.value = transaction.type;
    transactionDatePicker.setDate(transaction.date);
    transactionAmount.value = transaction.amount;
    transactionDescription.value = transaction.description || "";

    // トランザクションタイプに応じてカテゴリーを更新
    updateTransactionCategoryOptions();
    transactionCategory.value = transaction.categoryId;

    transactionModalTitle.textContent = "取引を編集";

    // モーダルを表示
    transactionModal.style.display = "block";
  }

  // トランザクションタイプに応じてカテゴリーオプションを更新する関数
  function updateTransactionCategoryOptions() {
    const type = transactionType.value;

    // すべてのオプションを取得
    const options = Array.from(transactionCategory.options);

    // 各オプションを表示/非表示
    options.forEach((option) => {
      if (option.dataset.type === type) {
        option.style.display = "";
      } else {
        option.style.display = "none";
      }
    });

    // 適切なデフォルト値を設定
    const visibleOptions = options.filter(
      (option) => option.dataset.type === type
    );
    if (visibleOptions.length > 0) {
      transactionCategory.value = visibleOptions[0].value;
    }
  }

  // カテゴリー編集モーダルを開く関数
  function openEditCategoryModal(category) {
    // フォームに値を設定
    categoryId.value = category.id;
    categoryName.value = category.name;
    categoryColor.value = category.color;
    categoryType.value = category.type;

    // モーダルを表示
    categoryModal.style.display = "block";
  }

  // 予算編集モーダルを開く関数
  function openEditBudgetModal(budget) {
    // フォームに値を設定
    budgetId.value = budget.id;
    budgetCategory.value = budget.categoryId;
    budgetAmount.value = budget.amount;
    budgetPeriod.value = budget.period;
    budgetStartDatePicker.setDate(budget.startDate);

    // モーダルを表示
    budgetModal.style.display = "block";
  }

  // トランザクションを保存する関数
  function saveTransaction(event) {
    event.preventDefault();

    const transactionData = {
      type: transactionType.value,
      date: transactionDate.value,
      amount: parseFloat(transactionAmount.value),
      categoryId: parseInt(transactionCategory.value),
      description: transactionDescription.value,
    };

    if (transactionId.value) {
      // トランザクションを更新
      window.pywebview.api
        .update_transaction(parseInt(transactionId.value), transactionData)
        .then(function (response) {
          if (response.status === "success") {
            // トランザクションを更新
            const transactionIndex = transactions.findIndex(
              (t) => t.id === parseInt(transactionId.value)
            );
            if (transactionIndex !== -1) {
              transactions[transactionIndex] = response.transaction;
              renderTransactions();
              updateDashboard();
              showNotification("取引を更新しました", "success");
            }

            // モーダルを閉じる
            transactionModal.style.display = "none";
          } else {
            showNotification(response.message, "error");
          }
        });
    } else {
      // 新しいトランザクションを追加
      window.pywebview.api
        .add_transaction(transactionData)
        .then(function (response) {
          if (response.status === "success") {
            // トランザクションを追加
            transactions.push(response.transaction);
            renderTransactions();
            updateDashboard();
            showNotification("取引を追加しました", "success");

            // モーダルを閉じる
            transactionModal.style.display = "none";
          } else {
            showNotification(response.message, "error");
          }
        });
    }
  }

  // トランザクションを削除する関数
  function deleteTransaction(transactionId) {
    if (confirm("この取引を削除してもよろしいですか？")) {
      window.pywebview.api
        .delete_transaction(transactionId)
        .then(function (response) {
          if (response.status === "success") {
            // トランザクションを削除
            transactions = transactions.filter((t) => t.id !== transactionId);
            renderTransactions();
            updateDashboard();
            showNotification("取引を削除しました", "success");
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
      type: categoryType.value,
    };

    if (categoryId.value) {
      // カテゴリーを更新
      window.pywebview.api
        .update_category(parseInt(categoryId.value), categoryData)
        .then(function (response) {
          if (response.status === "success") {
            // カテゴリーを更新
            const categoryIndex = categories.findIndex(
              (c) => c.id === parseInt(categoryId.value)
            );
            if (categoryIndex !== -1) {
              categories[categoryIndex] = response.category;
              renderCategories();
              updateCategoryDropdowns();
              renderTransactions(); // カテゴリー名や色が変わるのでトランザクションも再レンダリング
              updateDashboard(); // チャートも更新
              showNotification("カテゴリーを更新しました", "success");
            }

            // フォームをリセット
            resetCategoryForm();
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
          updateCategoryDropdowns();
          showNotification("カテゴリーを追加しました", "success");

          // フォームをリセット
          resetCategoryForm();
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
        "このカテゴリーを削除してもよろしいですか？このカテゴリーを使用している取引は「その他」カテゴリーに移動します。"
      )
    ) {
      window.pywebview.api
        .delete_category(categoryId)
        .then(function (response) {
          if (response.status === "success") {
            // カテゴリーを削除
            categories = categories.filter((c) => c.id !== categoryId);
            renderCategories();
            updateCategoryDropdowns();

            // トランザクションを再読み込み（カテゴリーが変更されたトランザクションがあるため）
            loadTransactions();

            showNotification("カテゴリーを削除しました", "success");
          } else {
            showNotification(response.message, "error");
          }
        });
    }
  }

  // カテゴリーフォームをリセットする関数
  function resetCategoryForm() {
    categoryForm.reset();
    categoryId.value = "";
    categoryColor.value = "#9e9e9e";
    categoryType.value = "expense";
  }

  // 予算を保存する関数
  function saveBudget(event) {
    event.preventDefault();

    const budgetData = {
      categoryId: parseInt(budgetCategory.value),
      amount: parseFloat(budgetAmount.value),
      period: budgetPeriod.value,
      startDate: budgetStartDate.value,
    };

    if (budgetId.value) {
      // 予算を更新
      window.pywebview.api
        .update_budget(parseInt(budgetId.value), budgetData)
        .then(function (response) {
          if (response.status === "success") {
            // 予算を更新
            const budgetIndex = budgets.findIndex(
              (b) => b.id === parseInt(budgetId.value)
            );
            if (budgetIndex !== -1) {
              budgets[budgetIndex] = response.budget;
              renderBudgets();
              updateBudgetProgress();
              showNotification("予算を更新しました", "success");
            }

            // フォームをリセット
            resetBudgetForm();
          } else {
            showNotification(response.message, "error");
          }
        });
    } else {
      // 新しい予算を追加
      window.pywebview.api.add_budget(budgetData).then(function (response) {
        if (response.status === "success") {
          // 予算を追加
          budgets.push(response.budget);
          renderBudgets();
          updateBudgetProgress();
          showNotification("予算を追加しました", "success");

          // フォームをリセット
          resetBudgetForm();
        } else {
          showNotification(response.message, "error");
        }
      });
    }
  }

  // 予算を削除する関数
  function deleteBudget(budgetId) {
    if (confirm("この予算を削除してもよろしいですか？")) {
      window.pywebview.api.delete_budget(budgetId).then(function (response) {
        if (response.status === "success") {
          // 予算を削除
          budgets = budgets.filter((b) => b.id !== budgetId);
          renderBudgets();
          updateBudgetProgress();
          showNotification("予算を削除しました", "success");
        } else {
          showNotification(response.message, "error");
        }
      });
    }
  }

  // 予算フォームをリセットする関数
  function resetBudgetForm() {
    budgetForm.reset();
    budgetId.value = "";
    budgetStartDatePicker.setDate(new Date());
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

  // 金額をフォーマットする関数
  function formatCurrency(amount, withSymbol = true) {
    const formatter = new Intl.NumberFormat("ja-JP", {
      style: withSymbol ? "currency" : "decimal",
      currency: "JPY",
      minimumFractionDigits: 0,
    });
    return formatter.format(amount);
  }

  // 前の期間に移動する関数
  function goToPreviousPeriod() {
    if (currentPeriodType === "month") {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setFullYear(currentDate.getFullYear() - 1);
    }
    updateCurrentPeriodDisplay();
  }

  // 次の期間に移動する関数
  function goToNextPeriod() {
    if (currentPeriodType === "month") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    updateCurrentPeriodDisplay();
  }

  // 期間タイプを変更する関数
  function changePeriodType() {
    currentPeriodType = periodType.value;
    updateCurrentPeriodDisplay();
  }

  // イベントリスナーを設定する関数
  function setupEventListeners() {
    // 期間セレクター
    prevPeriodBtn.addEventListener("click", goToPreviousPeriod);
    nextPeriodBtn.addEventListener("click", goToNextPeriod);
    periodType.addEventListener("change", changePeriodType);

    // トランザクション追加ボタン
    addTransactionBtn.addEventListener("click", openAddTransactionModal);

    // トランザクションフォーム送信
    transactionForm.addEventListener("submit", saveTransaction);

    // トランザクションタイプ変更時にカテゴリーを更新
    transactionType.addEventListener(
      "change",
      updateTransactionCategoryOptions
    );

    // トランザクションキャンセルボタン
    cancelTransactionBtn.addEventListener("click", function () {
      transactionModal.style.display = "none";
    });

    // カテゴリー管理ボタン
    manageCategoriesBtn.addEventListener("click", function () {
      categoryModal.style.display = "block";
    });

    // カテゴリーフォーム送信
    categoryForm.addEventListener("submit", saveCategory);

    // カテゴリータブ切り替え
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        // アクティブなタブを更新
        tabBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        // カテゴリータイプを更新
        categoryType.value = this.dataset.type;

        // カテゴリーリストを更新
        renderCategories();
      });
    });

    // カテゴリーリセットボタン
    resetCategoryBtn.addEventListener("click", resetCategoryForm);

    // 予算管理ボタン
    manageBudgetsBtn.addEventListener("click", function () {
      budgetModal.style.display = "block";
    });

    // 予算フォーム送信
    budgetForm.addEventListener("submit", saveBudget);

    // 予算リセットボタン
    resetBudgetBtn.addEventListener("click", resetBudgetForm);

    // 閉じるボタン
    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const modal = this.closest(".modal");
        modal.style.display = "none";
      });
    });

    // フィルター変更イベント
    filterType.addEventListener("change", function () {
      currentFilters.type = this.value;
      renderTransactions();
    });

    filterCategory.addEventListener("change", function () {
      currentFilters.category = this.value;
      renderTransactions();
    });

    filterDateFrom.addEventListener("change", function () {
      currentFilters.dateFrom = this.value;
      renderTransactions();
    });

    filterDateTo.addEventListener("change", function () {
      currentFilters.dateTo = this.value;
      renderTransactions();
    });

    // 検索イベント
    searchBtn.addEventListener("click", function () {
      currentFilters.search = searchInput.value.trim();
      renderTransactions();
    });

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        currentFilters.search = this.value.trim();
        renderTransactions();
      }
    });

    // モーダル外クリックで閉じる
    window.addEventListener("click", function (event) {
      if (event.target === transactionModal) {
        transactionModal.style.display = "none";
      } else if (event.target === categoryModal) {
        categoryModal.style.display = "none";
      } else if (event.target === budgetModal) {
        budgetModal.style.display = "none";
      }
    });
  }
});
