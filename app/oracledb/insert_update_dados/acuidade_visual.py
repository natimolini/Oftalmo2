from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_acuidade(nr_atendimento):
    query = "SELECT nr_sequencia FROM oft_correcao_atual WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)"
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_select(query, params)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar a consulta select_nr_seq_acuidade: {e}")
        return None

def update_acuidade(nr_seq_acuidade, ds_acuidade, nm_usuario):
    query = """
        UPDATE 
            oft_correcao_atual
        SET
            ds_observacao = :ds_acuidade,
            nm_usuario_nrec = :nm_usuario,
            dt_atualizacao_nrec = SYSDATE
        WHERE
            nr_sequencia = :nr_seq_acuidade
    """
    params = {
        'ds_acuidade': ds_acuidade,
        'nm_usuario': nm_usuario,
        'nr_seq_acuidade': nr_seq_acuidade
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
        print(f"Ocorreu um erro ao executar o update update_acuidade: {e}")
        return None

def insert_acuidade(cd_medico, nr_atendimento, ds_acuidade, nm_usuario):
    query = """
        INSERT INTO oft_correcao_atual
        (
        nr_sequencia,
        cd_profissional,
        dt_registro,
        nr_seq_consulta,
        dt_atualizacao,
        nm_usuario,
        ds_observacao
        )
        VALUES
        (
        oft_correcao_atual_seq.NEXTVAL,
        :cd_medico,
        SYSDATE,
        (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
        SYSDATE,
        :nm_usuario,
        :ds_acuidade
)
    """
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_acuidade': ds_acuidade,
        'nm_usuario': nm_usuario
    }

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    try:
        return oraconn.execute_insert(query, params_cleared)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar o insert insert_acuidade: {e}")
        return None
    
def salvar_liberar_acuidade_visual(nr_atendimento):
    query = """
        UPDATE 
            oft_correcao_atual 
        SET
            dt_liberacao = SYSDATE
        WHERE
            nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)
    """
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_update(query, params)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar o update salvar_liberar_acuidade_visual: {e}")
        return None
    