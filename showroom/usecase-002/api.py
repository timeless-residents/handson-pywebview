# api.py
import os
import webview
from mutagen.id3 import ID3
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen import File

# 音声再生用のライブラリをインポート
try:
    import pygame
except ImportError:
    print("pygame not found, installing...")
    import subprocess

    subprocess.check_call(["pip", "install", "pygame"])
    import pygame

# pygameの初期化
pygame.mixer.init()


class Api:
    def __init__(self):
        self.playlist = []
        self.current_index = -1
        self.current_song = None

    def select_music_files(self):
        """ローカルの音楽ファイルを選択するダイアログを表示"""
        file_types = ("音楽ファイル (*.mp3;*.flac;*.wav)", "*.mp3;*.flac;*.wav")
        result = webview.windows[0].create_file_dialog(
            webview.OPEN_DIALOG, allow_multiple=True, file_types=[file_types[0]]
        )

        if result:
            new_songs = []
            for file_path in result:
                song_info = self.get_song_info(file_path)
                new_songs.append(song_info)

            # プレイリストに追加
            self.playlist.extend(new_songs)
            return new_songs
        return []

    def get_song_info(self, file_path):
        """音楽ファイルからID3タグなどのメタデータを読み取る"""
        filename = os.path.basename(file_path)
        file_ext = os.path.splitext(filename)[1].lower()

        # デフォルト値
        song_info = {
            "path": file_path,
            "filename": filename,
            "title": os.path.splitext(filename)[0],
            "artist": "Unknown Artist",
            "album": "Unknown Album",
            "duration": 0,
        }

        try:
            # ファイルタイプに応じてメタデータを読み取る
            if file_ext == ".mp3":
                audio = MP3(file_path)
                if audio.tags:
                    id3 = ID3(file_path)
                    if "TIT2" in id3:  # タイトル
                        song_info["title"] = str(id3["TIT2"])
                    if "TPE1" in id3:  # アーティスト
                        song_info["artist"] = str(id3["TPE1"])
                    if "TALB" in id3:  # アルバム
                        song_info["album"] = str(id3["TALB"])
                song_info["duration"] = int(audio.info.length)

            elif file_ext == ".flac":
                audio = FLAC(file_path)
                if "title" in audio:
                    song_info["title"] = audio["title"][0]
                if "artist" in audio:
                    song_info["artist"] = audio["artist"][0]
                if "album" in audio:
                    song_info["album"] = audio["album"][0]
                song_info["duration"] = int(audio.info.length)

            else:  # その他のフォーマット
                audio = File(file_path)
                if audio and hasattr(audio.info, "length"):
                    song_info["duration"] = int(audio.info.length)
        except Exception as e:
            print(f"Error reading metadata: {e}")

        return song_info

    def get_playlist(self):
        """現在のプレイリストを取得"""
        return self.playlist

    def clear_playlist(self):
        """プレイリストをクリア"""
        self.playlist = []
        self.current_index = -1
        self.current_song = None
        return {"status": "success"}

    def play_song(self, index):
        """指定されたインデックスの曲を再生"""
        if 0 <= index < len(self.playlist):
            self.current_index = index
            self.current_song = self.playlist[index]

            # 現在再生中の曲を停止
            pygame.mixer.music.stop()

            # 新しい曲をロード
            try:
                pygame.mixer.music.load(self.current_song["path"])
                pygame.mixer.music.play()
                print(f"Playing: {self.current_song['title']}")
                return self.current_song
            except Exception as e:
                print(f"Error playing song: {e}")
                return {"status": "error", "message": str(e)}

        return {"status": "error", "message": "Invalid song index"}

    def play_pause(self):
        """再生/一時停止を切り替え"""
        if not self.current_song:
            return {"status": "error", "message": "No song selected"}

        if pygame.mixer.music.get_busy():
            pygame.mixer.music.pause()
            return {"status": "paused"}
        else:
            pygame.mixer.music.unpause()
            return {"status": "playing"}

    def stop_playback(self):
        """再生を停止"""
        pygame.mixer.music.stop()
        return {"status": "stopped"}

    def set_volume(self, volume):
        """音量を設定 (0.0 - 1.0)"""
        pygame.mixer.music.set_volume(max(0.0, min(1.0, volume)))
        return {"status": "success", "volume": volume}

    def get_playback_position(self):
        """現在の再生位置を取得（秒）"""
        if pygame.mixer.music.get_busy():
            return {"position": pygame.mixer.music.get_pos() / 1000.0}
        return {"position": 0}

    def get_current_song(self):
        """現在再生中の曲情報を取得"""
        if self.current_song:
            return self.current_song
        return None

    def next_song(self):
        """次の曲へ"""
        if not self.playlist:
            return None

        if self.current_index < len(self.playlist) - 1:
            self.current_index += 1
        else:
            self.current_index = 0  # プレイリストの最初に戻る

        self.current_song = self.playlist[self.current_index]

        # 新しい曲を再生
        try:
            pygame.mixer.music.stop()
            pygame.mixer.music.load(self.current_song["path"])
            pygame.mixer.music.play()
            print(f"Playing next: {self.current_song['title']}")
        except Exception as e:
            print(f"Error playing next song: {e}")

        return self.current_song

    def previous_song(self):
        """前の曲へ"""
        if not self.playlist:
            return None

        if self.current_index > 0:
            self.current_index -= 1
        else:
            self.current_index = len(self.playlist) - 1  # プレイリストの最後へ

        self.current_song = self.playlist[self.current_index]

        # 新しい曲を再生
        try:
            pygame.mixer.music.stop()
            pygame.mixer.music.load(self.current_song["path"])
            pygame.mixer.music.play()
            print(f"Playing previous: {self.current_song['title']}")
        except Exception as e:
            print(f"Error playing previous song: {e}")

        return self.current_song

    def remove_from_playlist(self, index):
        """プレイリストから曲を削除"""
        if 0 <= index < len(self.playlist):
            # 現在再生中の曲より前の曲を削除した場合はインデックスを調整
            if index < self.current_index:
                self.current_index -= 1
            # 現在再生中の曲を削除した場合
            elif index == self.current_index:
                # プレイリストが空になる場合
                if len(self.playlist) == 1:
                    self.current_index = -1
                    self.current_song = None
                # 最後の曲を削除した場合は最初の曲に戻る
                elif self.current_index == len(self.playlist) - 1:
                    self.current_index = 0
                    self.current_song = self.playlist[0]

            removed = self.playlist.pop(index)
            return {"status": "success", "removed": removed}
        return {"status": "error", "message": "Invalid song index"}
