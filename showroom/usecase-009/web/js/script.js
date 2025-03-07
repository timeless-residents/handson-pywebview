// システムモニターアプリケーション用JavaScript

// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // 初期化
    initApp();
  });
});

// アプリケーションの初期化
function initApp() {
  // タブ切り替え機能の初期化
  initTabs();

  // 初回データ取得
  refreshData();

  // 更新ボタンのイベントリスナー設定
  document.getElementById("refresh-btn").addEventListener("click", refreshData);

  // 自動更新チェックボックスのイベントリスナー設定
  const autoRefreshCheckbox = document.getElementById("auto-refresh");
  autoRefreshCheckbox.addEventListener("change", toggleAutoRefresh);

  // プロセス検索機能の初期化
  document
    .getElementById("process-search")
    .addEventListener("input", filterProcesses);

  // プロセスソート機能の初期化
  document
    .getElementById("process-sort")
    .addEventListener("change", sortProcesses);
}

// タブ切り替え機能
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // アクティブなタブボタンのクラスを削除
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // クリックされたボタンをアクティブに
      this.classList.add("active");

      // タブペインを非表示に
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      // 対応するタブペインを表示
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// 自動更新の切り替え
let autoRefreshInterval = null;
function toggleAutoRefresh() {
  const autoRefreshCheckbox = document.getElementById("auto-refresh");

  if (autoRefreshCheckbox.checked) {
    // 自動更新を開始（5秒間隔）
    autoRefreshInterval = setInterval(refreshData, 5000);
  } else {
    // 自動更新を停止
    clearInterval(autoRefreshInterval);
  }
}

// データの更新
function refreshData() {
  // ローディング表示
  showLoading();

  // Pythonのget_all_info関数を呼び出し
  window.pywebview.api
    .get_all_info()
    .then(function (data) {
      // 各セクションのデータを更新
      updateSystemInfo(data.system);
      updateCpuInfo(data.cpu);
      updateMemoryInfo(data.memory);
      updateDiskInfo(data.disk);
      updateNetworkInfo(data.network);
      updateProcessList(data.processes);

      // ローディング表示を消す
      hideLoading();
    })
    .catch(function (error) {
      console.error("データ取得エラー:", error);
      hideLoading();
    });
}

// ローディング表示
function showLoading() {
  // 必要に応じてローディングインジケータを表示
}

// ローディング非表示
function hideLoading() {
  // ローディングインジケータを非表示
}

// システム情報の更新
function updateSystemInfo(data) {
  document.getElementById(
    "system-name"
  ).textContent = `${data.system} ${data.release}`;
  document.getElementById("boot-time").textContent = data.boot_time;
}

// CPU情報の更新
function updateCpuInfo(data) {
  // ダッシュボードのCPU情報
  const avgCpuPercent =
    data.percent.reduce((a, b) => a + b, 0) / data.percent.length;
  document.getElementById("cpu-value").textContent = `${avgCpuPercent.toFixed(
    1
  )}%`;
  document.getElementById("cpu-cores").textContent = data.count;
  document.getElementById("cpu-freq").textContent = data.freq_current
    ? `${data.freq_current.toFixed(0)} MHz`
    : "N/A";

  // ゲージの更新
  updateGauge("cpu-gauge", avgCpuPercent);

  // CPU詳細情報
  document.getElementById("cpu-processor").textContent = data.system || "N/A";
  document.getElementById("cpu-physical-cores").textContent =
    data.physical_count || "N/A";
  document.getElementById("cpu-logical-cores").textContent =
    data.count || "N/A";
  document.getElementById("cpu-current-freq").textContent = data.freq_current
    ? `${data.freq_current.toFixed(0)} MHz`
    : "N/A";
  document.getElementById("cpu-max-freq").textContent = data.freq_max
    ? `${data.freq_max.toFixed(0)} MHz`
    : "N/A";

  // コア別使用率
  const coresContainer = document.getElementById("cpu-cores-container");
  coresContainer.innerHTML = "";

  data.percent.forEach((percent, index) => {
    const coreItem = document.createElement("div");
    coreItem.className = "cpu-core-item";

    coreItem.innerHTML = `
            <div class="cpu-core-label">コア ${index}: ${percent.toFixed(
      1
    )}%</div>
            <div class="cpu-core-bar">
                <div class="cpu-core-bar-used" style="width: ${percent}%"></div>
            </div>
        `;

    coresContainer.appendChild(coreItem);
  });
}

// メモリ情報の更新
function updateMemoryInfo(data) {
  const memData = data.memory;
  const swapData = data.swap;

  // ダッシュボードのメモリ情報
  document.getElementById(
    "memory-value"
  ).textContent = `${memData.percent.toFixed(1)}%`;
  document.getElementById("memory-used").textContent = formatBytes(
    memData.used
  );
  document.getElementById("memory-total").textContent = formatBytes(
    memData.total
  );

  // ゲージの更新
  updateGauge("memory-gauge", memData.percent);

  // 物理メモリ詳細
  document.getElementById(
    "physical-memory-bar"
  ).style.width = `${memData.percent}%`;
  document.getElementById("physical-memory-total").textContent = formatBytes(
    memData.total
  );
  document.getElementById("physical-memory-total-value").textContent =
    formatBytes(memData.total);
  document.getElementById("physical-memory-used").textContent = formatBytes(
    memData.used
  );
  document.getElementById("physical-memory-available").textContent =
    formatBytes(memData.available);
  document.getElementById(
    "physical-memory-percent"
  ).textContent = `${memData.percent.toFixed(1)}%`;

  // スワップメモリ詳細
  document.getElementById(
    "swap-memory-bar"
  ).style.width = `${swapData.percent}%`;
  document.getElementById("swap-memory-total").textContent = formatBytes(
    swapData.total
  );
  document.getElementById("swap-memory-total-value").textContent = formatBytes(
    swapData.total
  );
  document.getElementById("swap-memory-used").textContent = formatBytes(
    swapData.used
  );
  document.getElementById("swap-memory-free").textContent = formatBytes(
    swapData.free
  );
  document.getElementById(
    "swap-memory-percent"
  ).textContent = `${swapData.percent.toFixed(1)}%`;
}

// ディスク情報の更新
function updateDiskInfo(data) {
  // ダッシュボードのディスク情報
  const diskContainer = document.getElementById("disk-usage-container");
  diskContainer.innerHTML = "";

  // 使用率でソートして上位3つのパーティションのみ表示
  const sortedPartitions = [...data.partitions]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  sortedPartitions.forEach((partition) => {
    const diskItem = document.createElement("div");
    diskItem.className = "disk-item";

    // パス名が長い場合は短縮表示
    const displayName =
      partition.mountpoint.length > 15
        ? partition.mountpoint.split("/").pop() || partition.mountpoint
        : partition.mountpoint;

    diskItem.innerHTML = `
            <div class="disk-label" title="${partition.mountpoint} (${
      partition.device
    })">
              ${displayName}
            </div>
            <div class="disk-bar">
                <div class="disk-bar-used" style="width: ${
                  partition.percent
                }%"></div>
            </div>
            <div class="disk-details">
                <span>${formatBytes(partition.used)} / ${formatBytes(
      partition.total
    )}</span>
                <span>${partition.percent.toFixed(1)}%</span>
            </div>
        `;

    diskContainer.appendChild(diskItem);
  });

  // ディスク詳細情報
  const partitionsContainer = document.getElementById(
    "disk-partitions-container"
  );
  partitionsContainer.innerHTML = "";

  data.partitions.forEach((partition) => {
    const partitionItem = document.createElement("div");
    partitionItem.className = "disk-partition";

    partitionItem.innerHTML = `
            <h4>${partition.device} (${partition.fstype})</h4>
            <p>マウントポイント: ${partition.mountpoint}</p>
            <div class="disk-bar">
                <div class="disk-bar-used" style="width: ${
                  partition.percent
                }%"></div>
            </div>
            <div class="disk-details">
                <span>使用中: ${formatBytes(
                  partition.used
                )} (${partition.percent.toFixed(1)}%)</span>
                <span>空き: ${formatBytes(partition.free)}</span>
                <span>合計: ${formatBytes(partition.total)}</span>
            </div>
        `;

    partitionsContainer.appendChild(partitionItem);
  });

  // ディスクI/O情報
  const io = data.io_counters;
  if (io) {
    document.getElementById("disk-read-count").textContent =
      io.read_count.toLocaleString();
    document.getElementById("disk-write-count").textContent =
      io.write_count.toLocaleString();
    document.getElementById("disk-read-bytes").textContent = formatBytes(
      io.read_bytes
    );
    document.getElementById("disk-write-bytes").textContent = formatBytes(
      io.write_bytes
    );
    document.getElementById(
      "disk-read-time"
    ).textContent = `${io.read_time.toLocaleString()} ms`;
    document.getElementById(
      "disk-write-time"
    ).textContent = `${io.write_time.toLocaleString()} ms`;
  }
}

// ネットワーク情報の更新
function updateNetworkInfo(data) {
  // ダッシュボードのネットワーク情報
  document.getElementById("network-send").textContent = `${formatBytes(
    data.send_rate
  )}/s`;
  document.getElementById("network-recv").textContent = `${formatBytes(
    data.recv_rate
  )}/s`;
  document.getElementById("network-total-sent").textContent = formatBytes(
    data.bytes_sent
  );
  document.getElementById("network-total-recv").textContent = formatBytes(
    data.bytes_recv
  );

  // ネットワーク詳細情報
  document.getElementById("network-send-rate").textContent = `${formatBytes(
    data.send_rate
  )}/s`;
  document.getElementById("network-recv-rate").textContent = `${formatBytes(
    data.recv_rate
  )}/s`;
  document.getElementById("network-total-sent-bytes").textContent = formatBytes(
    data.bytes_sent
  );
  document.getElementById("network-total-recv-bytes").textContent = formatBytes(
    data.bytes_recv
  );
  document.getElementById("network-packets-sent").textContent =
    data.packets_sent.toLocaleString();
  document.getElementById("network-packets-recv").textContent =
    data.packets_recv.toLocaleString();

  // ネットワークインターフェース情報
  const interfacesContainer = document.getElementById(
    "network-interfaces-container"
  );
  interfacesContainer.innerHTML = "";

  for (const [name, stats] of Object.entries(data.interfaces)) {
    const interfaceItem = document.createElement("div");
    interfaceItem.className = "network-interface";

    interfaceItem.innerHTML = `
            <h4>${name}</h4>
            <div class="network-interface-details">
                <div class="network-interface-item">
                    <span class="network-interface-label">状態:</span>
                    <span class="network-interface-value">${
                      stats.isup ? "アクティブ" : "非アクティブ"
                    }</span>
                </div>
                <div class="network-interface-item">
                    <span class="network-interface-label">速度:</span>
                    <span class="network-interface-value">${
                      stats.speed > 0 ? `${stats.speed} Mbps` : "不明"
                    }</span>
                </div>
                <div class="network-interface-item">
                    <span class="network-interface-label">MTU:</span>
                    <span class="network-interface-value">${stats.mtu}</span>
                </div>
            </div>
        `;

    interfacesContainer.appendChild(interfaceItem);
  }
}

// プロセス一覧の更新
let currentProcesses = [];
function updateProcessList(processes) {
  // 現在のプロセスリストを保存
  currentProcesses = processes;

  // ダッシュボードのトッププロセス
  const topProcessesBody = document.getElementById("top-processes-body");
  topProcessesBody.innerHTML = "";

  // 上位5プロセスのみ表示
  processes.slice(0, 5).forEach((proc) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.name}</td>
            <td>${proc.username}</td>
            <td>${proc.cpu_percent.toFixed(1)}%</td>
            <td>${proc.memory_percent.toFixed(1)}%</td>
            <td>${proc.status}</td>
        `;

    topProcessesBody.appendChild(row);
  });

  // プロセスタブの全プロセス一覧
  renderProcessList(processes);
}

// プロセス一覧の描画
function renderProcessList(processes) {
  const processesBody = document.getElementById("processes-body");
  processesBody.innerHTML = "";

  processes.forEach((proc) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.name}</td>
            <td>${proc.username}</td>
            <td>${proc.cpu_percent.toFixed(1)}%</td>
            <td>${proc.memory_percent.toFixed(1)}%</td>
            <td>${proc.create_time}</td>
            <td>${proc.status}</td>
        `;

    processesBody.appendChild(row);
  });
}

// プロセスの検索フィルタリング
function filterProcesses() {
  const searchTerm = document
    .getElementById("process-search")
    .value.toLowerCase();

  if (!searchTerm) {
    // 検索語がなければ全プロセスを表示
    renderProcessList(currentProcesses);
    return;
  }

  // 検索語に一致するプロセスをフィルタリング
  const filteredProcesses = currentProcesses.filter(
    (proc) =>
      proc.name.toLowerCase().includes(searchTerm) ||
      proc.pid.toString().includes(searchTerm)
  );

  renderProcessList(filteredProcesses);
}

// プロセスのソート
function sortProcesses() {
  const sortBy = document.getElementById("process-sort").value;
  let sortedProcesses = [...currentProcesses];

  switch (sortBy) {
    case "cpu":
      sortedProcesses.sort((a, b) => b.cpu_percent - a.cpu_percent);
      break;
    case "memory":
      sortedProcesses.sort((a, b) => b.memory_percent - a.memory_percent);
      break;
    case "pid":
      sortedProcesses.sort((a, b) => a.pid - b.pid);
      break;
    case "name":
      sortedProcesses.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  renderProcessList(sortedProcesses);
}

// ゲージの更新
function updateGauge(gaugeId, percent) {
  const gauge = document.getElementById(gaugeId);
  if (!gauge) return;

  const gaugeFill = gauge.querySelector(".gauge-fill");

  // CSS変数を使用してconic-gradientのパーセンテージを設定
  gaugeFill.style.setProperty("--percent", `${percent}%`);
}

// バイト数のフォーマット
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
}
