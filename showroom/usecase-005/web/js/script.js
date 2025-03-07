// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // 要素の取得
  const tasksList = document.getElementById("tasksList");
  const categoriesList = document.getElementById("categoriesList");
  const filterCategory = document.getElementById("filterCategory");
  const filterPriority = document.getElementById("filterPriority");
  const filterStatus = document.getElementById("filterStatus");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  // タスクモーダル要素
  const taskModal = document.getElementById("taskModal");
  const taskModalTitle = document.getElementById("taskModalTitle");
  const taskForm = document.getElementById("taskForm");
  const taskId = document.getElementById("taskId");
  const taskTitle = document.getElementById("taskTitle");
  const taskDescription = document.getElementById("taskDescription");
  const taskCategory = document.getElementById("taskCategory");
  const taskPriority = document.getElementById("taskPriority");
  const taskDueDate = document.getElementById("taskDueDate");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const cancelTaskBtn = document.getElementById("cancelTaskBtn");

  // カテゴリーモーダル要素
  const categoryModal = document.getElementById("categoryModal");
  const categoryForm = document.getElementById("categoryForm");
  const categoryId = document.getElementById("categoryId");
  const categoryName = document.getElementById("categoryName");
  const categoryColor = document.getElementById("categoryColor");
  const manageCategoriesBtn = document.getElementById("manageCategoriesBtn");
  const resetCategoryBtn = document.getElementById("resetCategoryBtn");

  // 通知モーダル要素
  const notificationModal = document.getElementById("notificationModal");
  const dueTasks = document.getElementById("dueTasks");
  const closeNotificationBtn = document.getElementById("closeNotificationBtn");
  const notification = document.getElementById("notification");

  // 閉じるボタン
  const closeBtns = document.querySelectorAll(".close-btn");

  // データ
  let tasks = [];
  let categories = [];
  let currentFilters = {
    category: "all",
    priority: "all",
    status: "all",
    search: "",
  };

  // 日付ピッカーの初期化
  const datePicker = flatpickr(taskDueDate, {
    dateFormat: "Y-m-d",
    locale: "ja",
    allowInput: true,
  });

  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // データの読み込み
    loadTasks();
    loadCategories();

    // 締め切りタスクの確認
    checkDueTasks();

    // 通知コールバックの登録
    window.pywebview.api.register_notification_callback(handleNotification);

    // イベントリスナーの設定
    setupEventListeners();
  });

  // タスクを読み込む関数
  function loadTasks() {
    window.pywebview.api.get_tasks().then(function (response) {
      if (response.status === "success") {
        tasks = response.tasks;
        renderTasks();
      } else {
        showNotification("タスクの読み込みに失敗しました", "error");
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

  // 締め切りタスクを確認する関数
  function checkDueTasks() {
    window.pywebview.api.check_due_tasks().then(function (response) {
      if (response.status === "success" && response.count > 0) {
        showDueTasksNotification(response.dueTasks);
      }
    });
  }

  // 通知を処理する関数
  function handleNotification(dueTasks) {
    showDueTasksNotification(dueTasks);
  }

  // 締め切りタスクの通知を表示する関数
  function showDueTasksNotification(dueTasks) {
    // 通知モーダルの内容を更新
    dueTasks.innerHTML = "";

    dueTasks.forEach(function (task) {
      const category = categories.find((c) => c.id === task.categoryId) || {
        name: "その他",
        color: "#9e9e9e",
      };

      const taskElement = document.createElement("div");
      taskElement.className = "due-task-item";
      taskElement.innerHTML = `
                <div class="due-task-category" style="background-color: ${category.color}"></div>
                <div class="due-task-title">${task.title}</div>
            `;

      dueTasks.appendChild(taskElement);
    });

    // 通知モーダルを表示
    notificationModal.style.display = "block";
  }

  // カテゴリードロップダウンを更新する関数
  function updateCategoryDropdowns() {
    // フィルターのカテゴリードロップダウンを更新
    filterCategory.innerHTML = '<option value="all">すべて</option>';

    // タスクフォームのカテゴリードロップダウンを更新
    taskCategory.innerHTML = "";

    categories.forEach(function (category) {
      // フィルター用のオプションを追加
      const filterOption = document.createElement("option");
      filterOption.value = category.id;
      filterOption.textContent = category.name;
      filterCategory.appendChild(filterOption);

      // タスクフォーム用のオプションを追加
      const taskOption = document.createElement("option");
      taskOption.value = category.id;
      taskOption.textContent = category.name;
      taskCategory.appendChild(taskOption);
    });
  }

  // タスクをレンダリングする関数
  function renderTasks() {
    tasksList.innerHTML = "";

    // フィルタリングされたタスクを取得
    const filteredTasks = filterTasks();

    if (filteredTasks.length === 0) {
      tasksList.innerHTML = '<div class="no-tasks">タスクがありません</div>';
      return;
    }

    // タスクをソート（未完了を先に、次に優先度順、次に締め切り日順）
    filteredTasks.sort((a, b) => {
      // 完了状態でソート（未完了を先に）
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // 優先度でソート（高い順）
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // 締め切り日でソート（近い順）
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (a.dueDate) {
        return -1;
      } else if (b.dueDate) {
        return 1;
      }

      // 作成日でソート（新しい順）
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // タスクを表示
    filteredTasks.forEach(function (task) {
      const category = categories.find((c) => c.id === task.categoryId) || {
        name: "その他",
        color: "#9e9e9e",
      };
      const today = new Date().toISOString().split("T")[0];
      const isDueToday = task.dueDate === today;

      const taskElement = document.createElement("div");
      taskElement.className = `task-item ${
        task.completed ? "task-completed" : ""
      }`;
      taskElement.dataset.id = task.id;

      let priorityClass = "";
      let priorityText = "";

      switch (parseInt(task.priority)) {
        case 3:
          priorityClass = "priority-high";
          priorityText = "高";
          break;
        case 2:
          priorityClass = "priority-medium";
          priorityText = "中";
          break;
        case 1:
          priorityClass = "priority-low";
          priorityText = "低";
          break;
      }

      taskElement.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? "checked" : ""}>
                </div>
                <div class="task-content">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-actions">
                            <button class="icon-btn edit-task-btn" title="編集">
                                <span class="material-icons">edit</span>
                            </button>
                            <button class="icon-btn delete-task-btn" title="削除">
                                <span class="material-icons">delete</span>
                            </button>
                        </div>
                    </div>
                    ${
                      task.description
                        ? `<div class="task-description">${task.description}</div>`
                        : ""
                    }
                    <div class="task-meta">
                        <div class="task-category" style="background-color: ${
                          category.color
                        }">
                            <span class="material-icons">label</span>${
                              category.name
                            }
                        </div>
                        <div class="task-priority ${priorityClass}">
                            <span class="material-icons">flag</span>${priorityText}
                        </div>
                        ${
                          task.dueDate
                            ? `
                            <div class="task-due-date ${
                              isDueToday ? "due-date-today" : ""
                            }">
                                <span class="material-icons">event</span>${
                                  task.dueDate
                                }
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `;

      // チェックボックスのイベントリスナー
      const checkbox = taskElement.querySelector('input[type="checkbox"]');
      checkbox.addEventListener("change", function () {
        toggleTaskCompletion(task.id, this.checked);
      });

      // 編集ボタンのイベントリスナー
      const editBtn = taskElement.querySelector(".edit-task-btn");
      editBtn.addEventListener("click", function () {
        openEditTaskModal(task);
      });

      // 削除ボタンのイベントリスナー
      const deleteBtn = taskElement.querySelector(".delete-task-btn");
      deleteBtn.addEventListener("click", function () {
        deleteTask(task.id);
      });

      tasksList.appendChild(taskElement);
    });
  }

  // タスクをフィルタリングする関数
  function filterTasks() {
    return tasks.filter(function (task) {
      // カテゴリーフィルター
      if (
        currentFilters.category !== "all" &&
        task.categoryId !== parseInt(currentFilters.category)
      ) {
        return false;
      }

      // 優先度フィルター
      if (
        currentFilters.priority !== "all" &&
        task.priority !== parseInt(currentFilters.priority)
      ) {
        return false;
      }

      // 状態フィルター
      if (currentFilters.status === "active" && task.completed) {
        return false;
      } else if (currentFilters.status === "completed" && !task.completed) {
        return false;
      }

      // 検索フィルター
      if (
        currentFilters.search &&
        !task.title.toLowerCase().includes(currentFilters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }

  // カテゴリーをレンダリングする関数
  function renderCategories() {
    categoriesList.innerHTML = "";

    categories.forEach(function (category) {
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
                      category.id <= 4 ? "disabled" : ""
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
      if (category.id > 4) {
        // デフォルトカテゴリーは削除不可
        deleteBtn.addEventListener("click", function () {
          deleteCategory(category.id);
        });
      }

      categoriesList.appendChild(categoryElement);
    });
  }

  // タスクの完了状態を切り替える関数
  function toggleTaskCompletion(taskId, completed) {
    window.pywebview.api
      .update_task(taskId, { completed: completed })
      .then(function (response) {
        if (response.status === "success") {
          // タスクを更新
          const taskIndex = tasks.findIndex((t) => t.id === taskId);
          if (taskIndex !== -1) {
            tasks[taskIndex] = response.task;
            renderTasks();
          }
        } else {
          showNotification(response.message, "error");
        }
      });
  }

  // タスク追加モーダルを開く関数
  function openAddTaskModal() {
    // フォームをリセット
    taskForm.reset();
    taskId.value = "";
    taskModalTitle.textContent = "タスクを追加";

    // モーダルを表示
    taskModal.style.display = "block";
  }

  // タスク編集モーダルを開く関数
  function openEditTaskModal(task) {
    // フォームに値を設定
    taskId.value = task.id;
    taskTitle.value = task.title;
    taskDescription.value = task.description || "";
    taskCategory.value = task.categoryId;
    taskPriority.value = task.priority;

    // 日付ピッカーを更新
    if (task.dueDate) {
      datePicker.setDate(task.dueDate);
    } else {
      datePicker.clear();
    }

    taskModalTitle.textContent = "タスクを編集";

    // モーダルを表示
    taskModal.style.display = "block";
  }

  // カテゴリー編集モーダルを開く関数
  function openEditCategoryModal(category) {
    // フォームに値を設定
    categoryId.value = category.id;
    categoryName.value = category.name;
    categoryColor.value = category.color;

    // モーダルを表示
    categoryModal.style.display = "block";
  }

  // タスクを保存する関数
  function saveTask(event) {
    event.preventDefault();

    const taskData = {
      title: taskTitle.value,
      description: taskDescription.value,
      categoryId: parseInt(taskCategory.value),
      priority: parseInt(taskPriority.value),
      dueDate: taskDueDate.value,
    };

    if (taskId.value) {
      // タスクを更新
      window.pywebview.api
        .update_task(parseInt(taskId.value), taskData)
        .then(function (response) {
          if (response.status === "success") {
            // タスクを更新
            const taskIndex = tasks.findIndex(
              (t) => t.id === parseInt(taskId.value)
            );
            if (taskIndex !== -1) {
              tasks[taskIndex] = response.task;
              renderTasks();
              showNotification("タスクを更新しました", "success");
            }

            // モーダルを閉じる
            taskModal.style.display = "none";
          } else {
            showNotification(response.message, "error");
          }
        });
    } else {
      // 新しいタスクを追加
      window.pywebview.api.add_task(taskData).then(function (response) {
        if (response.status === "success") {
          // タスクを追加
          tasks.push(response.task);
          renderTasks();
          showNotification("タスクを追加しました", "success");

          // モーダルを閉じる
          taskModal.style.display = "none";
        } else {
          showNotification(response.message, "error");
        }
      });
    }
  }

  // タスクを削除する関数
  function deleteTask(taskId) {
    if (confirm("このタスクを削除してもよろしいですか？")) {
      window.pywebview.api.delete_task(taskId).then(function (response) {
        if (response.status === "success") {
          // タスクを削除
          tasks = tasks.filter((t) => t.id !== taskId);
          renderTasks();
          showNotification("タスクを削除しました", "success");
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
            const categoryIndex = categories.findIndex(
              (c) => c.id === parseInt(categoryId.value)
            );
            if (categoryIndex !== -1) {
              categories[categoryIndex] = response.category;
              renderCategories();
              updateCategoryDropdowns();
              renderTasks(); // カテゴリー名や色が変わるのでタスクも再レンダリング
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
        "このカテゴリーを削除してもよろしいですか？このカテゴリーを使用しているタスクは「その他」カテゴリーに移動します。"
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

            // タスクを再読み込み（カテゴリーが変更されたタスクがあるため）
            loadTasks();

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

  // イベントリスナーを設定する関数
  function setupEventListeners() {
    // タスク追加ボタン
    addTaskBtn.addEventListener("click", openAddTaskModal);

    // タスクフォーム送信
    taskForm.addEventListener("submit", saveTask);

    // タスクキャンセルボタン
    cancelTaskBtn.addEventListener("click", function () {
      taskModal.style.display = "none";
    });

    // カテゴリー管理ボタン
    manageCategoriesBtn.addEventListener("click", function () {
      categoryModal.style.display = "block";
    });

    // カテゴリーフォーム送信
    categoryForm.addEventListener("submit", saveCategory);

    // カテゴリーリセットボタン
    resetCategoryBtn.addEventListener("click", resetCategoryForm);

    // 閉じるボタン
    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const modal = this.closest(".modal");
        modal.style.display = "none";
      });
    });

    // 通知モーダルを閉じるボタン
    closeNotificationBtn.addEventListener("click", function () {
      notificationModal.style.display = "none";
    });

    // フィルター変更イベント
    filterCategory.addEventListener("change", function () {
      currentFilters.category = this.value;
      renderTasks();
    });

    filterPriority.addEventListener("change", function () {
      currentFilters.priority = this.value;
      renderTasks();
    });

    filterStatus.addEventListener("change", function () {
      currentFilters.status = this.value;
      renderTasks();
    });

    // 検索イベント
    searchBtn.addEventListener("click", function () {
      currentFilters.search = searchInput.value.trim();
      renderTasks();
    });

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        currentFilters.search = this.value.trim();
        renderTasks();
      }
    });

    // モーダル外クリックで閉じる
    window.addEventListener("click", function (event) {
      if (event.target === taskModal) {
        taskModal.style.display = "none";
      } else if (event.target === categoryModal) {
        categoryModal.style.display = "none";
      } else if (event.target === notificationModal) {
        notificationModal.style.display = "none";
      }
    });
  }
});
