from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

'''
def insert_conduta(cd_medico, nr_atendimento, ds_conduta):
    query = """
    INSERT INTO oft_conduta 
    (
        dt_registro,
        cd_profissional,
        nr_seq_consulta,
        nr_sequencia,
        nm_usuario,
        dt_atualizacao,
        ds_conduta,
        dt_liberacao,
        ie_situacao
    )
    VALUES
    (
        SYSDATE,
        :cd_medico,
        (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
        oft_conduta_seq.NEXTVAL,
        'ghr.tech',
        SYSDATE,
        :ds_conduta,
        SYSDATE,
        'A'
    )
    """
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_conduta': ds_conduta
    }

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    return oraconn.execute_insert(query, params_cleared)

'''