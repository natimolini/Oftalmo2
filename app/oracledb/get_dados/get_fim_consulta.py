from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_dt_fim_consulta(nr_atendimento):
    query = """
    SELECT 
        dt_fim_consulta
    FROM 
        oft_consulta
    where 
        nr_atendimento = :nr_atendimento
    """

    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})

    if not result:
        return None

    return result[0][0]
