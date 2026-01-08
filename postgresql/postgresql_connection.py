import psycopg2
from psycopg2.extras import RealDictCursor

class PostgresConnection:
    def __init__(self, user, password, host, port, database):
        self.user = user
        self.password = password
        self.host = host
        self.port = port
        self.database = database

    def get_connection(self):
        connection = psycopg2.connect(
            user=self.user,
            password=self.password,
            host=self.host,
            port=self.port,
            database=self.database
        )
        return connection

    def execute_select(self, query, params=None):
        connection = self.get_connection()
        cursor = connection.cursor(cursor_factory=RealDictCursor)
        try:
            cursor.execute(query, params if params else {})
            rows = cursor.fetchall()
        except Exception as e:
            print(f"Falha ao executar SELECT no banco PostgreSQL: {e}")
            rows = []
        finally:
            cursor.close()
            connection.close()
        return rows

    def execute_update(self, query, params=None):
        connection = self.get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(query, params if params else {})
            connection.commit()
            rows_affected = cursor.rowcount
        except Exception as e:
            print(f"Falha ao executar UPDATE no banco PostgreSQL: {e}")
            connection.rollback()
            rows_affected = 0
        finally:
            cursor.close()
            connection.close()
        return rows_affected

    def execute_insert(self, query, params=None):
        connection = self.get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(query, params if params else {})
            connection.commit()
            rows_affected = cursor.rowcount
        except Exception as e:
            print(f"Falha ao executar INSERT no banco PostgreSQL: {e}")
            connection.rollback()
            rows_affected = 0
        finally:
            cursor.close()
            connection.close()
        return rows_affected