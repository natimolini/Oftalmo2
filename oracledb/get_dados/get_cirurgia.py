from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_cirurgia(nr_atendimento):
    query = """
    SELECT DS_INF_PRE_CIRURGICA
    FROM oft_conduta
    WHERE nr_seq_consulta = (
        SELECT nr_sequencia 
        FROM oft_consulta 
        WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1
    )
    """
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})

    if not result or not result[0][0]:
        return ""
    return result[0][0]
