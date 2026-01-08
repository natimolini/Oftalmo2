from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_conduta(nr_atendimento):
    query = "SELECT nr_sequencia FROM oft_conduta WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)"
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
        print(f"Ocorreu um erro ao executar a consulta select_nr_seq_conduta: {e}")
        return None

def update_conduta(nr_seq_conduta, ds_conduta, nm_usuario):
    query = """
    UPDATE
        oft_conduta
    SET
        ds_conduta = :ds_conduta,
        ds_observacao = :ds_conduta,
        nm_usuario_nrec = :nm_usuario,
        dt_atualizacao_nrec = SYSDATE
    WHERE
        nr_sequencia = :nr_seq_conduta
        AND ROWNUM = 1
    """
    params = {
        'ds_conduta': ds_conduta,
        'nm_usuario': nm_usuario,
        'nr_seq_conduta': nr_seq_conduta
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
        print(f"Ocorreu um erro ao executar o update update_conduta: {e}")
        return None

def insert_conduta(cd_medico, nr_atendimento, ds_conduta, nm_usuario):
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
        ds_observacao
    )
    VALUES
    (
        SYSDATE,
        :cd_medico,
        (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
        oft_conduta_seq.NEXTVAL,
        :nm_usuario,
        SYSDATE,
        :ds_conduta,
        :ds_conduta
    )
    """
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_conduta': ds_conduta,
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
        print(f"Ocorreu um erro ao executar o insert insert_conduta: {e}")
        return None

def salvar_liberar_conduta(nr_atendimento):
    query = """
        UPDATE 
            oft_conduta 
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
        print(f"Ocorreu um erro ao executar o update salvar_liberar_conduta: {e}")
        return None

def update_observacao_conduta(nr_seq_conduta, ds_observacao, nm_usuario):
    query = """
    UPDATE
        oft_conduta
    SET
        ds_observacao = :ds_observacao,
        nm_usuario_nrec = :nm_usuario,
        dt_atualizacao_nrec = SYSDATE
    WHERE
        nr_sequencia = :nr_seq_conduta
        AND ROWNUM = 1
    """
    params = {
        'ds_observacao': ds_observacao,
        'nm_usuario': nm_usuario,
        'nr_seq_conduta': nr_seq_conduta
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
        print(f"Ocorreu um erro ao executar o update update_observacao_conduta: {e}")
        return None

def update_observacao2_conduta(nr_seq_conduta, ds_observacao2, nm_usuario):
    query = """
    UPDATE med_conduta
    SET ds_observacao2 = :ds_observacao2,
        dt_atualizacao = SYSDATE,
        nm_usuario = :nm_usuario
    WHERE nr_sequencia = :nr_seq_conduta
    """
    params = {
        'ds_observacao2': ds_observacao2,
        'nm_usuario': nm_usuario,
        'nr_seq_conduta': nr_seq_conduta
    }
    return oraconn.execute_update(query, params)

def combinar_receitas(ds_observacao1, ds_observacao2):
    """
    Combina duas receitas usando um separador especial
    """
    separador = "\n###SEGUNDA_RECEITA###\n"
    
    # Se ambas estiverem vazias
    if not ds_observacao1 and not ds_observacao2:
        return ""
    
    # Se apenas a primeira existe
    if ds_observacao1 and not ds_observacao2:
        return ds_observacao1
    
    # Se apenas a segunda existe
    if not ds_observacao1 and ds_observacao2:
        return separador + ds_observacao2
    
    # Se ambas existem
    return ds_observacao1 + separador + ds_observacao2
