from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_status_consulta(nr_atendimento):
    query = "SELECT dt_fim_consulta FROM oft_consulta WHERE nr_atendimento = :nr_atendimento"
    return oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})[0][0]

def get_dt_consulta(nr_atendimento):
    query = """
    SELECT dt_consulta
    FROM agenda_consulta
    WHERE nr_atendimento = :nr_atendimento
    """

    return oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})[0][0]

def update_status_em_consulta(nr_atendimento):
    query = """
    UPDATE agenda_consulta
    SET dt_consulta = SYSDATE
    WHERE nr_atendimento = :nr_atendimento
    """

    return oraconn.execute_update(query, {'nr_atendimento': nr_atendimento})