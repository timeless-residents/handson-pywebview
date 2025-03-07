# api.py
import os
import base64


class Api:
    def __init__(self):
        # 現在のディレクトリを取得
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # PDFファイル保存用のディレクトリ
        self.pdfs_dir = os.path.join(self.current_dir, "pdfs")
        os.makedirs(self.pdfs_dir, exist_ok=True)

    def list_pdf_files(self):
        """PDFファイルの一覧を取得"""
        try:
            # ディレクトリ内のPDFファイルを取得
            files = [f for f in os.listdir(self.pdfs_dir) if f.lower().endswith(".pdf")]

            # ファイル情報を取得
            file_info = []
            for file in files:
                file_path = os.path.join(self.pdfs_dir, file)
                file_size = os.path.getsize(file_path)
                file_info.append(
                    {
                        "name": file,
                        "path": file_path,
                        "size": self._format_size(file_size),
                    }
                )

            return {"status": "success", "files": file_info}
        except Exception as e:
            return {"status": "error", "message": f"ファイル一覧取得エラー: {str(e)}"}

    def get_pdf_data(self, filename):
        """PDFファイルのデータをBase64エンコードして返す"""
        try:
            file_path = os.path.join(self.pdfs_dir, filename)

            # ファイルが存在するか確認
            if not os.path.exists(file_path):
                return {
                    "status": "error",
                    "message": f"ファイル '{filename}' が見つかりません",
                }

            # ファイルをバイナリモードで読み込み
            with open(file_path, "rb") as file:
                pdf_data = file.read()

            # Base64エンコード
            pdf_base64 = base64.b64encode(pdf_data).decode("utf-8")

            return {"status": "success", "data": pdf_base64, "filename": filename}
        except Exception as e:
            return {"status": "error", "message": f"PDFデータ取得エラー: {str(e)}"}

    def upload_pdf(self, file_data, filename):
        """Base64エンコードされたPDFデータを保存"""
        try:
            # ファイル名が.pdfで終わるようにする
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"

            # ファイルパスを生成
            file_path = os.path.join(self.pdfs_dir, filename)

            # Base64デコード
            pdf_data = base64.b64decode(file_data)

            # ファイルに書き込み
            with open(file_path, "wb") as file:
                file.write(pdf_data)

            return {
                "status": "success",
                "message": f"ファイル '{filename}' をアップロードしました",
                "path": file_path,
            }
        except Exception as e:
            return {"status": "error", "message": f"アップロードエラー: {str(e)}"}

    def _format_size(self, size_bytes):
        """ファイルサイズを読みやすい形式に変換"""
        for unit in ["B", "KB", "MB", "GB"]:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
