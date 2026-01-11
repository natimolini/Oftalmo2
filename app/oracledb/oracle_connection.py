import cx_Oracle


class OracleConnection:

    _oracle_client_initialized = False

    def __init__(self, user, password, host, port, service_name):
        self._initialize_oracle_client()
        self.user = user
        self.password = password
        self.host = host
        self.port = port
        self.service_name = service_name

    @classmethod
    def _initialize_oracle_client(cls):
        if not cls._oracle_client_initialized:
            #Oracle Renan
            #oracle_client_path = r"C:\Oracle\instantclient_21_15"

            #Oracle Nati
            #oracle_client_path = r"C:\Oracle\instantclient_23_6"

            #Oracle Pedro
            #oracle_client_path = r"C:\Oracle\instantclient_21_17"

            oracle_client_path = "/opt/oracle/instantclient_23_9" #alternativa para linux
            cx_Oracle.init_oracle_client(lib_dir=oracle_client_path)
            cls._oracle_client_initialized = True

    def get_connection(self):
        dsn = cx_Oracle.makedsn(self.host, self.port, service_name=self.service_name)
        connection = cx_Oracle.connect(self.user, self.password, dsn)

        cursor = connection.cursor()
        try:
            cursor.execute("ALTER SESSION SET CURRENT_SCHEMA = TASY")
        except Exception as e:
            print(f"Falha ao alterar o schema da sessão: {e}")
        finally:
            cursor.close()
        return connection

    def execute_select(self, query, params=None):
        connection = self.get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(query, params if params else {})
            rows = cursor.fetchall()
        except Exception as e:
            print(f"Falha ao executar SELECT no banco Oracle: {e}")
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
            print(f"Falha ao executar UPDATE no banco Oracle: {e}")
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
            print(f"Falha ao executar INSERT no banco Oracle: {e}")
            connection.rollback()
            rows_affected = 0
        finally:
            cursor.close()
            connection.close()
        return rows_affected

if __name__ == "__main__":
    oracle_conn = OracleConnection(user="ghrprontuario", password="Xy7#kT2@", host="10.250.250.2", port=1521, service_name="dbprod.oftalmocuritiba.com.br")
    query = "SELECT nm_guerra FROM medico WHERE cd_pessoa_fisica = :cd_pessoa_fisica"
    params = {"cd_pessoa_fisica": 192}
    result = oracle_conn.execute_select(query, params)
    print(result[0][0])
