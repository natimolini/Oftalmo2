from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_anamnese(nr_atendimento):
    query = "SELECT nr_sequencia FROM oft_anamnese WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)"
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
        print(f"Ocorreu um erro ao executar o select select_nr_seq_anamnese: {e}")
        return None

def update_anamnese(nr_seq_anamnese, ds_anamnese, nm_usuario):
    query = """
        UPDATE 
            oft_anamnese 
        SET
            ds_anamnese = :ds_anamnese,
            nm_usuario_nrec = :nm_usuario,
            dt_atualizacao_nrec = SYSDATE,
            ie_situacao = 'A'
        WHERE
            nr_sequencia = :nr_seq_anamnese
            AND ROWNUM = 1
    """
    params = {
        'ds_anamnese': ds_anamnese,
        'nm_usuario': nm_usuario,
        'nr_seq_anamnese': nr_seq_anamnese
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
        print(f"Ocorreu um erro ao executar o update update_anamnese: {e}")
        return None


def insert_anamnese(cd_medico, nr_atendimento, ds_anamnese, nm_usuario):
    query = """
        INSERT INTO oft_anamnese 
        (
        dt_atualizacao,
        nr_sequencia,
        nm_usuario,
        ds_anamnese,
        dt_anamnese,
        cd_profissional,
        nr_seq_consulta,
        ie_situacao
        ) 
        VALUES 
        (
        SYSDATE, 
        oft_anamnese_seq.NEXTVAL, 
        :nm_usuario, 
        :ds_anamnese, 
        SYSDATE, 
        :cd_medico, 
        (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
        'A'
        )
    """
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_anamnese': ds_anamnese,
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
        print(f"Ocorreu um erro ao executar o insert insert_anamnese: {e}")
        return None

def salvar_liberar_anamnese(nr_atendimento):
    query = """
        UPDATE 
            oft_anamnese 
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
        print(f"Ocorreu um erro ao executar o update salvar_liberar_anamnese: {e}")
        return None
