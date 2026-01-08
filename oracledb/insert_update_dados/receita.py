from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_receita(nr_atendimento):
    query = "SELECT nr_sequencia FROM med_receita WHERE nr_atendimento_hosp = :nr_atendimento"
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
        print(f"Ocorreu um erro ao executar a consulta select_nr_seq_receita: {e}")
        return None

def update_receita(nr_seq_receita, ds_receita, nm_usuario):
    query = """
        UPDATE 
            med_receita
        SET
            ds_receita = :ds_receita,
            nm_usuario_nrec = :nm_usuario,
            dt_atualizacao_nrec = SYSDATE
        WHERE
            nr_sequencia = :nr_seq_receita
    """
    params = {
        'ds_receita': ds_receita,
        'nm_usuario': nm_usuario,
        'nr_seq_receita': nr_seq_receita
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
        print(f"Ocorreu um erro ao executar o update update_receita: {e}")
        return None
    
def insert_receita(nm_usuario, cd_medico, ds_receita, nr_atendimento):
    query = """
    INSERT INTO med_receita
    (
    dt_receita,
    cd_pessoa_fisica,
    nr_sequencia,
    nm_usuario,
    dt_atualizacao,
    cd_medico,
    ds_receita,
    nr_atendimento_hosp
    )
    VALUES
    (
    SYSDATE,
    (SELECT cd_pessoa_fisica FROM atendimento_paciente WHERE nr_atendimento = :nr_atendimento),
    med_receita_seq.NEXTVAL,
    :nm_usuario,
    SYSDATE,
    :cd_medico,
    :ds_receita,
    :nr_atendimento
    )
    """
    params = {
        'nm_usuario': nm_usuario,
        'cd_medico': cd_medico,
        'ds_receita': ds_receita,
        'nr_atendimento': nr_atendimento
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
        print(f"Ocorreu um erro ao executar o insert insert_receita: {e}")
        return None

def salvar_liberar_receita(nr_atendimento):
    query = """
        UPDATE 
            med_receita 
        SET
            dt_liberacao = SYSDATE
        WHERE
            nr_atendimento_hosp = :nr_atendimento
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
        print(f"Ocorreu um erro ao executar o update salvar_liberar_receita: {e}")
        return None
