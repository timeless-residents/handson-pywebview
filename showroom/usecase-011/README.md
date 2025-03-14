# レシピ管理アプリ

PyWebViewを使用した、シンプルで使いやすいレシピ管理アプリケーションです。

## 機能

このアプリケーションには以下の機能があります：

1. **レシピの追加・編集**
   - 新しいレシピを作成し、既存のレシピを編集できます
   - レシピ名、説明、カテゴリ、調理時間、準備時間、人数などの情報を管理できます

2. **材料リスト管理**
   - 各レシピに必要な材料とその量を追加・編集できます
   - 材料名、量、単位を個別に管理できます

3. **カテゴリ検索**
   - レシピをカテゴリで分類し、検索できます
   - 新しいカテゴリの追加や削除も可能です

4. **調理時間計算**
   - 準備時間と調理時間から合計時間を自動計算します
   - レシピ一覧で時間情報を確認できます

## 使い方

### レシピの閲覧

- アプリケーションを起動すると、左側にレシピ一覧が表示されます
- レシピをクリックすると、右側に詳細が表示されます
- 検索ボックスとカテゴリフィルターを使用して、特定のレシピを検索できます

### レシピの追加

1. 「新規レシピ」ボタンをクリックします
2. レシピ名、説明、カテゴリ、準備時間、調理時間、人数を入力します
3. 「材料を追加」ボタンをクリックして、必要な材料を追加します
4. 「手順を追加」ボタンをクリックして、調理手順を追加します
5. 「保存」ボタンをクリックして、レシピを保存します

### レシピの編集

1. 編集したいレシピを選択します
2. 「編集」ボタンをクリックします
3. 情報を更新します
4. 「保存」ボタンをクリックして、変更を保存します

### レシピの削除

1. 削除したいレシピを選択します
2. 「削除」ボタンをクリックします
3. 確認ダイアログで「OK」をクリックします

### カテゴリの管理

- 左側のサイドバー下部にあるカテゴリ管理セクションで、新しいカテゴリを追加できます
- 既存のカテゴリの横にある「削除」をクリックすると、カテゴリを削除できます

## 技術的な詳細

このアプリケーションは以下の技術を使用しています：

- **バックエンド**: Python + PyWebView
- **フロントエンド**: HTML, CSS, JavaScript
- **データストレージ**: JSONファイル

データは以下のJSONファイルに保存されます：
- `data/recipes.json`: レシピデータ
- `data/categories.json`: カテゴリデータ

## 実行方法

```bash
cd showroom/usecase-011
python main.py
```

## 初期データ

アプリケーションには、以下のサンプルレシピが含まれています：

1. **Simple Pasta**: シンプルなパスタ料理
2. **Classic Omelette**: 基本的なオムレツ

これらのレシピを参考に、独自のレシピを追加してください。
