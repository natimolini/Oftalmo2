from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_lentes_contato(nr_seq_consulta):

    query = """
    SELECT nr_sequencia 
    FROM oft_consulta_lente
    WHERE nr_seq_consulta = :nr_seq_consulta
    """
    params = {'nr_seq_consulta': nr_seq_consulta}

    try:
        return oraconn.execute_select(query, params)
    except Exception as e:
        print(f"Error in select_nr_seq_exame: {e}")
        return None

def select_nr_seq_consulta(nr_atendimento):

    query = """
        SELECT nr_sequencia 
        FROM oft_consulta
        WHERE nr_atendimento = :nr_atendimento
    """
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_select(query, params)
    except Exception as e:
        print(f"Error in select_nr_seq_exame: {e}")
        return None    

def insert_lentes_contato(nr_seq_consulta, nm_usuario, ds_observacao):
    query = """
    INSERT INTO oft_consulta_lente(
        nr_sequencia,
        nr_seq_consulta,
        dt_atualizacao,
        nm_usuario,
        ds_observacao
    )
    VALUES(
        oft_consulta_lente_seq.NEXTVAL,
        :nr_seq_consulta,
        SYSDATE,
        :nm_usuario,
        :ds_observacao
    )
    """
    
    params = {
        'ds_observacao': ds_observacao,
        'nr_seq_consulta': nr_seq_consulta,
        'nm_usuario': nm_usuario
    }
    
    print(f"Tentando inserir lentes de contato com parâmetros: {params}")
    
    try:
        result = oraconn.execute_insert(query, params)
        print(f"Resultado do insert: {result}")
        return result
    except Exception as e:
        print(f"Erro ao inserir lentes de contato: {str(e)}")
        print(f"Parâmetros completos: {params}")
        return None
    

def update_lentes_contato(nr_seq_lentes, nm_usuario, ds_observacao):
    query = """
    UPDATE oft_consulta_lente
    SET
        ds_observacao = :ds_observacao,
        nm_usuario = :nm_usuario,
        dt_atualizacao = SYSDATE
    WHERE
        nr_sequencia = :nr_seq_lentes
    """
    params = {
        'ds_observacao': ds_observacao,
        'nm_usuario': nm_usuario,
        'nr_seq_lentes': nr_seq_lentes
    }

    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Error in update_exam: {e}")
        return None