# api.py
class Api:
    def get_message(self):
        return "Hello from Python!"

    def save_data(self, data):
        # データ保存処理
        print(f"データを保存しました: {data}")
        return {"status": "success"}
