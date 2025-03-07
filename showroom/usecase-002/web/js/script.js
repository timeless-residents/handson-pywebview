// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", function () {
  // pywebviewのJSAPIが利用可能になるまで待機
  window.addEventListener("pywebviewready", function () {
    // 要素の取得
    const playButton = document.getElementById("play-button");
    const prevButton = document.getElementById("prev-button");
    const nextButton = document.getElementById("next-button");
    const selectFilesButton = document.getElementById("select-files");
    const clearPlaylistButton = document.getElementById("clear-playlist");
    const playlistElement = document.getElementById("playlist");
    const songTitleElement = document.getElementById("song-title");
    const songArtistElement = document.getElementById("song-artist");
    const songAlbumElement = document.getElementById("song-album");
    const currentTimeElement = document.getElementById("current-time");
    const durationElement = document.getElementById("duration");
    const progressElement = document.getElementById("progress");
    const progressBarElement = document.querySelector(".progress-bar");

    // 再生状態
    let isPlaying = false;
    let currentSongIndex = -1;
    let playlist = [];

    // 音楽ファイル選択ボタンのイベントリスナー
    selectFilesButton.addEventListener("click", function () {
      window.pywebview.api.select_music_files().then(function (newSongs) {
        if (newSongs && newSongs.length > 0) {
          // プレイリストに追加された曲を表示
          updatePlaylistUI();

          // プレイリストが空だった場合は最初の曲を選択
          if (currentSongIndex === -1) {
            loadSong(0);
          }

          // クリアボタンを有効化
          clearPlaylistButton.disabled = false;
        }
      });
    });

    // プレイリストクリアボタンのイベントリスナー
    clearPlaylistButton.addEventListener("click", function () {
      window.pywebview.api.clear_playlist().then(function (response) {
        if (response.status === "success") {
          // UIをリセット
          resetPlayerUI();
          updatePlaylistUI();

          // ボタンを無効化
          clearPlaylistButton.disabled = true;
          playButton.disabled = true;
          prevButton.disabled = true;
          nextButton.disabled = true;
        }
      });
    });

    // 再生/一時停止ボタンのイベントリスナー
    playButton.addEventListener("click", function () {
      if (currentSongIndex >= 0) {
        window.pywebview.api.play_pause().then(function (response) {
          if (response.status === "paused") {
            pauseUI();
          } else if (response.status === "playing") {
            playUI();
          }
        });
      }
    });

    // 前の曲ボタンのイベントリスナー
    prevButton.addEventListener("click", function () {
      window.pywebview.api.previous_song().then(function (song) {
        if (song) {
          currentSongIndex = playlist.findIndex((s) => s.path === song.path);
          updateSongInfo(song);
          window.pywebview.api.play_song(currentSongIndex).then(function () {
            playUI();
          });
        }
      });
    });

    // 次の曲ボタンのイベントリスナー
    nextButton.addEventListener("click", function () {
      window.pywebview.api.next_song().then(function (song) {
        if (song) {
          currentSongIndex = playlist.findIndex((s) => s.path === song.path);
          updateSongInfo(song);
          window.pywebview.api.play_song(currentSongIndex).then(function () {
            playUI();
          });
        }
      });
    });

    // プログレスバークリックのイベントリスナー
    progressBarElement.addEventListener("click", function (e) {
      const song = playlist[currentSongIndex];
      if (song && song.duration) {
        const percent = e.offsetX / progressBarElement.offsetWidth;
        const position = percent * song.duration;

        // 再生位置を更新（将来的な機能）
        // 現在のpygameでは再生位置の設定はサポートされていないため、
        // ここではUIの更新のみ行う
        currentTimeElement.textContent = formatTime(position);
        progressElement.style.width = `${percent * 100}%`;
      }
    });

    // 曲情報を更新
    function updateSongInfo(song) {
      songTitleElement.textContent = song.title;
      songArtistElement.textContent = song.artist;
      songAlbumElement.textContent = song.album;

      if (song.duration) {
        durationElement.textContent = formatTime(song.duration);
      }

      // プレイリストの選択状態を更新
      updatePlaylistSelection();

      // コントロールボタンを有効化
      playButton.disabled = false;
      prevButton.disabled = false;
      nextButton.disabled = false;
    }

    // 曲の読み込み
    function loadSong(index) {
      if (index >= 0 && index < playlist.length) {
        currentSongIndex = index;
        const song = playlist[index];

        // 曲情報を表示
        updateSongInfo(song);

        // Pythonバックエンドに現在の曲を通知して再生
        window.pywebview.api.play_song(index).then(function (response) {
          if (response) {
            playUI();
          }
        });
      }
    }

    // 再生UI更新
    function playUI() {
      isPlaying = true;
      playButton.innerHTML = '<i class="fas fa-pause"></i>';

      // 再生位置の定期的な更新を開始
      startProgressUpdate();
    }

    // 一時停止UI更新
    function pauseUI() {
      isPlaying = false;
      playButton.innerHTML = '<i class="fas fa-play"></i>';
    }

    // 再生位置の定期的な更新
    let progressInterval;
    function startProgressUpdate() {
      // 既存のインターバルをクリア
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // 新しいインターバルを設定（500ミリ秒ごとに更新）
      progressInterval = setInterval(function () {
        window.pywebview.api.get_playback_position().then(function (data) {
          if (data.position) {
            // プログレスバーの更新
            const song = playlist[currentSongIndex];
            if (song && song.duration) {
              const progressPercent = (data.position / song.duration) * 100;
              progressElement.style.width = `${progressPercent}%`;

              // 時間表示の更新
              currentTimeElement.textContent = formatTime(data.position);
            }
          }
        });
      }, 500);
    }

    // プログレスバーの更新（未使用）
    function updateProgress() {
      // この関数は現在使用されていません
      // pygameを使用した再生位置の更新は startProgressUpdate 関数で行われます
    }

    // 時間のフォーマット (秒 -> MM:SS)
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }

    // プレイリストUIの更新
    function updatePlaylistUI() {
      // プレイリストを取得
      window.pywebview.api.get_playlist().then(function (songs) {
        playlist = songs;

        // プレイリスト要素をクリア
        playlistElement.innerHTML = "";

        // 各曲をプレイリストに追加
        songs.forEach((song, index) => {
          const li = document.createElement("li");
          li.className = "playlist-item";
          if (index === currentSongIndex) {
            li.classList.add("active");
          }

          li.innerHTML = `
            <div class="song-details">
              <div class="song-title">${song.title}</div>
              <div class="song-meta">${song.artist} - ${song.album}</div>
            </div>
            <button class="remove-button" data-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          `;

          // 曲クリックで再生
          li.addEventListener("click", function (e) {
            // 削除ボタンのクリックは無視
            if (e.target.closest(".remove-button")) return;

            loadSong(index);
          });

          playlistElement.appendChild(li);
        });

        // 削除ボタンのイベントリスナーを設定
        document.querySelectorAll(".remove-button").forEach((button) => {
          button.addEventListener("click", function () {
            const index = parseInt(this.getAttribute("data-index"));
            window.pywebview.api
              .remove_from_playlist(index)
              .then(function (response) {
                if (response.status === "success") {
                  updatePlaylistUI();

                  // プレイリストが空になった場合
                  if (playlist.length === 0) {
                    resetPlayerUI();
                    clearPlaylistButton.disabled = true;
                  }
                }
              });
          });
        });
      });
    }

    // プレイリストの選択状態を更新
    function updatePlaylistSelection() {
      document.querySelectorAll(".playlist-item").forEach((item, index) => {
        if (index === currentSongIndex) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }

    // プレーヤーUIをリセット
    function resetPlayerUI() {
      songTitleElement.textContent = "曲を選択してください";
      songArtistElement.textContent = "-";
      songAlbumElement.textContent = "-";
      currentTimeElement.textContent = "0:00";
      durationElement.textContent = "0:00";
      progressElement.style.width = "0";

      // 再生状態をリセット
      isPlaying = false;
      currentSongIndex = -1;

      // 再生を停止
      window.pywebview.api.stop_playback();

      // ボタンの状態をリセット
      playButton.innerHTML = '<i class="fas fa-play"></i>';
      playButton.disabled = true;
      prevButton.disabled = true;
      nextButton.disabled = true;

      // インターバルをクリア
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }

    // 初期化時にプレイリストを取得
    updatePlaylistUI();
  });
});
