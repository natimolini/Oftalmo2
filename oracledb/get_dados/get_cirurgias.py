from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')

def get_ds_cirurgias(nr_atendimento):
    """Busca a descrição de cirurgias por número de atendimento"""
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

def update_cirurgias(nr_atendimento, ds_cirurgias, nm_usuario):
    """Atualiza a descrição de cirurgias"""
    query = """
    UPDATE oft_conduta
    SET DS_INF_PRE_CIRURGICA = :ds_observacao,
        nm_usuario_nrec = :nm_usuario,
        dt_atualizacao_nrec = SYSDATE
    WHERE nr_seq_consulta = (
        SELECT nr_sequencia 
        FROM oft_consulta 
        WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1
    )
    """
    
    params = {
        'ds_observacao': ds_cirurgias,
        'nm_usuario': nm_usuario,
        'nr_atendimento': nr_atendimento
    }
    
    try:
        return oraconn.execute_update(query, params)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f'Erro ao atualizar cirurgias: {e}')
        return None