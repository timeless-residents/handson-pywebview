# api.py
import os
import json
import sqlite3
import csv
import datetime


class Api:
    def __init__(self):
        # 現在のディレクトリを取得
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # データ保存用のディレクトリとファイルパス
        self.data_dir = os.path.join(self.current_dir, "data")

        # ディレクトリが存在しない場合は作成
        os.makedirs(self.data_dir, exist_ok=True)

        # 現在接続中のデータベース
        self.current_db = None
        self.connection = None
        self.cursor = None

        # サンプルデータベースの作成（初回実行時のみ）
        self._create_sample_database()

    def _create_sample_database(self):
        """サンプルデータベースを作成する"""
        sample_db_path = os.path.join(self.data_dir, "sample.db")

        # すでに存在する場合は作成しない
        if os.path.exists(sample_db_path):
            return

        try:
            # データベース接続
            conn = sqlite3.connect(sample_db_path)
            cursor = conn.cursor()

            # ユーザーテーブルの作成
            cursor.execute(
                """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                age INTEGER,
                created_at TEXT
            )
            """
            )

            # サンプルデータの挿入
            users = [
                (
                    1,
                    "山田太郎",
                    "taro@example.com",
                    30,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    2,
                    "佐藤花子",
                    "hanako@example.com",
                    25,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    3,
                    "鈴木一郎",
                    "ichiro@example.com",
                    40,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    4,
                    "田中美咲",
                    "misaki@example.com",
                    22,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    5,
                    "伊藤健太",
                    "kenta@example.com",
                    35,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ]

            cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?)", users)

            # 商品テーブルの作成
            cursor.execute(
                """
            CREATE TABLE products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                price INTEGER,
                category TEXT,
                stock INTEGER,
                created_at TEXT
            )
            """
            )

            # サンプルデータの挿入
            products = [
                (
                    1,
                    "ノートパソコン",
                    80000,
                    "電子機器",
                    10,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    2,
                    "スマートフォン",
                    60000,
                    "電子機器",
                    15,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    3,
                    "コーヒーメーカー",
                    5000,
                    "家電",
                    8,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    4,
                    "デスクチェア",
                    12000,
                    "家具",
                    5,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    5,
                    "ヘッドフォン",
                    15000,
                    "電子機器",
                    12,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ]

            cursor.executemany(
                "INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)", products
            )

            # 注文テーブルの作成
            cursor.execute(
                """
            CREATE TABLE orders (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                total_price INTEGER,
                order_date TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
            """
            )

            # サンプルデータの挿入
            orders = [
                (
                    1,
                    1,
                    2,
                    1,
                    60000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    2,
                    2,
                    3,
                    2,
                    10000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    3,
                    3,
                    1,
                    1,
                    80000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    4,
                    4,
                    5,
                    1,
                    15000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    5,
                    5,
                    4,
                    2,
                    24000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    6,
                    1,
                    3,
                    1,
                    5000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                (
                    7,
                    2,
                    5,
                    1,
                    15000,
                    datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ]

            cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", orders)

            # 変更をコミット
            conn.commit()
            conn.close()

        except Exception as e:
            print(f"サンプルデータベース作成エラー: {str(e)}")

    def _close_connection(self):
        """データベース接続を閉じる"""
        if self.connection:
            self.connection.close()
            self.connection = None
            self.cursor = None
            self.current_db = None

    def get_database_list(self):
        """データディレクトリ内のSQLiteデータベースファイルのリストを取得"""
        try:
            db_files = []
            for file in os.listdir(self.data_dir):
                if (
                    file.endswith(".db")
                    or file.endswith(".sqlite")
                    or file.endswith(".sqlite3")
                ):
                    db_path = os.path.join(self.data_dir, file)
                    db_size = os.path.getsize(db_path)
                    db_files.append(
                        {
                            "name": file,
                            "path": db_path,
                            "size": self._format_size(db_size),
                            "modified": datetime.datetime.fromtimestamp(
                                os.path.getmtime(db_path)
                            ).strftime("%Y-%m-%d %H:%M:%S"),
                        }
                    )
            return {"status": "success", "databases": db_files}
        except Exception as e:
            return {
                "status": "error",
                "message": f"データベースリスト取得エラー: {str(e)}",
            }

    def _format_size(self, size_bytes):
        """ファイルサイズを読みやすい形式に変換"""
        for unit in ["B", "KB", "MB", "GB"]:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"

    def connect_database(self, db_path):
        """データベースに接続"""
        try:
            # 既存の接続を閉じる
            self._close_connection()

            # 新しい接続を開く
            self.connection = sqlite3.connect(db_path)
            # カラム名を取得するための設定
            self.connection.row_factory = sqlite3.Row
            self.cursor = self.connection.cursor()
            self.current_db = db_path

            return {
                "status": "success",
                "message": f"データベース '{os.path.basename(db_path)}' に接続しました",
            }
        except Exception as e:
            return {"status": "error", "message": f"データベース接続エラー: {str(e)}"}

    def get_tables(self):
        """データベース内のテーブル一覧を取得"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # SQLiteのシステムテーブルからテーブル一覧を取得
            self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in self.cursor.fetchall()]

            # 各テーブルの行数を取得
            tables_info = []
            for table in tables:
                self.cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
                row_count = self.cursor.fetchone()[0]

                # テーブルのカラム情報を取得
                self.cursor.execute(f'PRAGMA table_info("{table}")')
                columns = self.cursor.fetchall()
                column_count = len(columns)

                tables_info.append(
                    {"name": table, "rows": row_count, "columns": column_count}
                )

            return {"status": "success", "tables": tables_info}
        except Exception as e:
            return {"status": "error", "message": f"テーブル一覧取得エラー: {str(e)}"}

    def get_table_data(
        self, table_name, page=1, page_size=100, sort_column=None, sort_order="ASC"
    ):
        """テーブルのデータを取得"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # テーブルの総行数を取得
            self.cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            total_rows = self.cursor.fetchone()[0]

            # ページネーション用のオフセットを計算
            offset = (page - 1) * page_size

            # カラム情報を取得
            self.cursor.execute(f'PRAGMA table_info("{table_name}")')
            columns_info = self.cursor.fetchall()
            columns = [
                {"name": col[1], "type": col[2], "pk": col[5] == 1}
                for col in columns_info
            ]

            # データを取得
            query = f'SELECT * FROM "{table_name}"'

            # ソート条件がある場合は追加
            if sort_column:
                query += f' ORDER BY "{sort_column}" {sort_order}'

            # ページネーション
            query += f" LIMIT {page_size} OFFSET {offset}"

            self.cursor.execute(query)
            rows = self.cursor.fetchall()

            # 結果を辞書のリストに変換
            data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    row_dict[col["name"]] = row[i]
                data.append(row_dict)

            # 総ページ数を計算
            total_pages = (total_rows + page_size - 1) // page_size

            return {
                "status": "success",
                "table": table_name,
                "columns": columns,
                "data": data,
                "pagination": {
                    "page": page,
                    "pageSize": page_size,
                    "totalRows": total_rows,
                    "totalPages": total_pages,
                },
            }
        except Exception as e:
            return {"status": "error", "message": f"テーブルデータ取得エラー: {str(e)}"}

    def execute_query(self, query):
        """SQLクエリを実行"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # クエリを実行
            start_time = datetime.datetime.now()
            self.cursor.execute(query)

            # SELECT文の場合は結果を返す
            if query.strip().upper().startswith("SELECT"):
                rows = self.cursor.fetchall()

                # カラム名を取得
                columns = [{"name": col[0]} for col in self.cursor.description]

                # 結果を辞書のリストに変換
                data = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        row_dict[col["name"]] = row[i]
                    data.append(row_dict)

                end_time = datetime.datetime.now()
                execution_time = (end_time - start_time).total_seconds()

                return {
                    "status": "success",
                    "columns": columns,
                    "data": data,
                    "rowCount": len(data),
                    "executionTime": execution_time,
                }
            else:
                # INSERT, UPDATE, DELETEなどの場合は影響を受けた行数を返す
                self.connection.commit()
                end_time = datetime.datetime.now()
                execution_time = (end_time - start_time).total_seconds()

                return {
                    "status": "success",
                    "rowsAffected": self.cursor.rowcount,
                    "executionTime": execution_time,
                    "message": f"{self.cursor.rowcount}行に影響しました",
                }
        except Exception as e:
            return {"status": "error", "message": f"クエリ実行エラー: {str(e)}"}

    def update_table_data(
        self, table_name, row_data, primary_key_column, primary_key_value
    ):
        """テーブルのデータを更新"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # 更新用のSQLを構築
            set_clause = ", ".join([f'"{col}" = ?' for col in row_data.keys()])
            values = list(row_data.values())

            query = f'UPDATE "{table_name}" SET {set_clause} WHERE "{primary_key_column}" = ?'
            values.append(primary_key_value)

            # クエリを実行
            self.cursor.execute(query, values)
            self.connection.commit()

            return {
                "status": "success",
                "message": "データを更新しました",
                "rowsAffected": self.cursor.rowcount,
            }
        except Exception as e:
            return {"status": "error", "message": f"データ更新エラー: {str(e)}"}

    def insert_table_data(self, table_name, row_data):
        """テーブルに新しい行を挿入"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # 挿入用のSQLを構築
            columns = ", ".join([f'"{col}"' for col in row_data.keys()])
            placeholders = ", ".join(["?" for _ in row_data])
            values = list(row_data.values())

            query = f'INSERT INTO "{table_name}" ({columns}) VALUES ({placeholders})'

            # クエリを実行
            self.cursor.execute(query, values)
            self.connection.commit()

            return {
                "status": "success",
                "message": "データを挿入しました",
                "rowsAffected": self.cursor.rowcount,
                "lastRowId": self.cursor.lastrowid,
            }
        except Exception as e:
            return {"status": "error", "message": f"データ挿入エラー: {str(e)}"}

    def delete_table_data(self, table_name, primary_key_column, primary_key_value):
        """テーブルから行を削除"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # 削除用のSQLを構築
            query = f'DELETE FROM "{table_name}" WHERE "{primary_key_column}" = ?'

            # クエリを実行
            self.cursor.execute(query, (primary_key_value,))
            self.connection.commit()

            return {
                "status": "success",
                "message": "データを削除しました",
                "rowsAffected": self.cursor.rowcount,
            }
        except Exception as e:
            return {"status": "error", "message": f"データ削除エラー: {str(e)}"}

    def export_query_results(self, query, format="csv"):
        """クエリ結果をエクスポート"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # クエリを実行
            self.cursor.execute(query)
            rows = self.cursor.fetchall()

            # カラム名を取得
            columns = [col[0] for col in self.cursor.description]

            if format == "csv":
                # CSVフォーマットでエクスポート
                output = []
                # ヘッダー行
                output.append(",".join([f'"{col}"' for col in columns]))

                # データ行
                for row in rows:
                    output.append(
                        ",".join(
                            [
                                f'"{str(val)}"' if val is not None else '""'
                                for val in row
                            ]
                        )
                    )

                content = "\n".join(output)
                return {
                    "status": "success",
                    "content": content,
                    "filename": f"export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    "format": "csv",
                }

            elif format == "json":
                # JSONフォーマットでエクスポート
                data = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        row_dict[col] = row[i]
                    data.append(row_dict)

                content = json.dumps(data, ensure_ascii=False, indent=2)
                return {
                    "status": "success",
                    "content": content,
                    "filename": f"export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    "format": "json",
                }

            elif format == "sql":
                # SQLインサート文としてエクスポート
                table_name = "exported_data"
                if query.strip().upper().startswith("SELECT"):
                    # FROM句からテーブル名を抽出してみる
                    parts = query.split()
                    from_index = -1
                    for i, part in enumerate(parts):
                        if part.upper() == "FROM":
                            from_index = i
                            break

                    if from_index >= 0 and from_index + 1 < len(parts):
                        table_name = parts[from_index + 1].strip('"`[]')

                output = []
                # テーブル作成文
                column_defs = []
                for col in columns:
                    column_defs.append(f"    `{col}` TEXT")

                output.append(f"CREATE TABLE IF NOT EXISTS `{table_name}` (")
                output.append(",\n".join(column_defs))
                output.append(");")
                output.append("")

                # インサート文
                for row in rows:
                    values = []
                    for val in row:
                        if val is None:
                            values.append("NULL")
                        elif isinstance(val, (int, float)):
                            values.append(str(val))
                        else:
                            escaped_val = str(val).replace("'", "''")
                            values.append(f"'{escaped_val}'")

                    output.append(
                        f"INSERT INTO `{table_name}` ({', '.join([f'`{col}`' for col in columns])}) VALUES ({', '.join(values)});"
                    )

                content = "\n".join(output)
                return {
                    "status": "success",
                    "content": content,
                    "filename": f"export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.sql",
                    "format": "sql",
                }

            else:
                return {"status": "error", "message": f"未対応のフォーマット: {format}"}

        except Exception as e:
            return {"status": "error", "message": f"エクスポートエラー: {str(e)}"}

    def get_table_structure(self, table_name):
        """テーブルの構造を取得"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # テーブルのカラム情報を取得
            self.cursor.execute(f'PRAGMA table_info("{table_name}")')
            columns = self.cursor.fetchall()

            columns_info = []
            for col in columns:
                columns_info.append(
                    {
                        "cid": col[0],
                        "name": col[1],
                        "type": col[2],
                        "notnull": col[3] == 1,
                        "default_value": col[4],
                        "pk": col[5] == 1,
                    }
                )

            # インデックス情報を取得
            self.cursor.execute(f'PRAGMA index_list("{table_name}")')
            indices = self.cursor.fetchall()

            indices_info = []
            for idx in indices:
                try:
                    # インデックスのカラム情報を取得
                    self.cursor.execute(f'PRAGMA index_info("{idx[1]}")')
                    index_columns = self.cursor.fetchall()

                    columns = []
                    for idx_col in index_columns:
                        columns.append(
                            {"seqno": idx_col[0], "cid": idx_col[1], "name": idx_col[2]}
                        )

                    # インデックス情報の構造を確認し、必要なフィールドが存在するか確認
                    index_info = {
                        "seq": idx[0],
                        "name": idx[1],
                        "unique": idx[2] == 1,
                    }

                    # SQLiteのバージョンによってはorigin, partialフィールドが存在しない場合がある
                    if len(idx) > 3:
                        index_info["origin"] = idx[3]
                    if len(idx) > 4:
                        index_info["partial"] = idx[4] == 1

                    index_info["columns"] = columns
                    indices_info.append(index_info)
                except Exception as e:
                    # インデックス情報の取得に失敗した場合は、基本情報だけ追加
                    indices_info.append(
                        {
                            "seq": idx[0] if len(idx) > 0 else 0,
                            "name": idx[1] if len(idx) > 1 else "unknown",
                            "unique": idx[2] == 1 if len(idx) > 2 else False,
                            "columns": [],
                        }
                    )

            # 外部キー情報を取得
            self.cursor.execute(f'PRAGMA foreign_key_list("{table_name}")')
            foreign_keys = self.cursor.fetchall()

            foreign_keys_info = []
            for fk in foreign_keys:
                fk_info = {
                    "id": fk[0],
                    "seq": fk[1],
                    "table": fk[2],
                    "from": fk[3],
                    "to": fk[4],
                }

                # SQLiteのバージョンによってはon_update, on_delete, matchフィールドが存在しない場合がある
                if len(fk) > 5:
                    fk_info["on_update"] = fk[5]
                if len(fk) > 6:
                    fk_info["on_delete"] = fk[6]
                if len(fk) > 7:
                    fk_info["match"] = fk[7]

                foreign_keys_info.append(fk_info)

            return {
                "status": "success",
                "table": table_name,
                "columns": columns_info,
                "indices": indices_info,
                "foreign_keys": foreign_keys_info,
            }
        except Exception as e:
            return {"status": "error", "message": f"テーブル構造取得エラー: {str(e)}"}

    def create_database(self, db_name):
        """新しいデータベースを作成"""
        try:
            if not db_name.endswith((".db", ".sqlite", ".sqlite3")):
                db_name += ".db"

            db_path = os.path.join(self.data_dir, db_name)

            # すでに存在する場合はエラー
            if os.path.exists(db_path):
                return {
                    "status": "error",
                    "message": f"データベース '{db_name}' はすでに存在します",
                }

            # 新しいデータベースを作成
            conn = sqlite3.connect(db_path)
            conn.close()

            return {
                "status": "success",
                "message": f"データベース '{db_name}' を作成しました",
                "path": db_path,
            }
        except Exception as e:
            return {"status": "error", "message": f"データベース作成エラー: {str(e)}"}

    def import_csv_to_table(self, table_name, csv_content, create_table=True):
        """CSVデータをテーブルにインポート"""
        if not self.connection:
            return {"status": "error", "message": "データベースに接続されていません"}

        try:
            # CSVデータを解析
            lines = csv_content.strip().split("\n")
            reader = csv.reader(lines)
            headers = next(reader)  # ヘッダー行

            # ヘッダーの特殊文字を削除
            headers = [h.strip("\"'") for h in headers]

            if create_table:
                # テーブルを作成
                columns = ", ".join([f'"{header}" TEXT' for header in headers])
                self.cursor.execute(
                    f'CREATE TABLE IF NOT EXISTS "{table_name}" ({columns})'
                )

            # データを挿入
            placeholders = ", ".join(["?" for _ in headers])
            insert_query = f'INSERT INTO "{table_name}" ({", ".join([f"\"{h}\"" for h in headers])}) VALUES ({placeholders})'

            rows = []
            for row in reader:
                # 値の特殊文字を削除
                values = [val.strip("\"'") for val in row]
                rows.append(values)

            self.cursor.executemany(insert_query, rows)
            self.connection.commit()

            return {
                "status": "success",
                "message": f"{len(rows)}行をインポートしました",
                "rowsAffected": len(rows),
            }
        except Exception as e:
            return {"status": "error", "message": f"CSVインポートエラー: {str(e)}"}
