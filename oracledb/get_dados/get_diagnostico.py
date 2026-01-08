from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_ds_diagnostico(nr_atendimento):
    """
    Retorna o primeiro diagnóstico do atendimento como string.
    """
    query = """
    SELECT ds_diagnostico FROM diagnostico_doenca WHERE nr_atendimento = :nr_atendimento
    """
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
    if not result:
        return ""
    ds_diagnostico = result[0][0]
    return ds_diagnostico

def get_all_ds_diagnostico(nr_atendimento):
    """
    Retorna todos os diagnósticos do atendimento como lista de strings.
    """
    query = """
    SELECT ds_diagnostico FROM diagnostico_medico WHERE nr_atendimento = :nr_atendimento
    """
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
    if not result:
        return []
    ds_diagnosticos = [row[0] for row in result if row[0]]
    return ds_diagnosticos

def get_diagnostico_multiline(nr_atendimento):
    """
    Retorna todos os diagnósticos do atendimento como uma única string multiline.
    Útil para exibição no histórico.
    """
    diagnosticos = get_all_ds_diagnostico(nr_atendimento)
    return "\n".join(diagnosticos) if diagnosticos else ""