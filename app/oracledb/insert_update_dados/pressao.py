from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_tonometria(nr_atendimento):
    query = "SELECT nr_sequencia FROM oft_tonometria WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)"
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
        print(f"Ocorreu um erro ao executar a consulta select_nr_seq_tonometria: {e}")
        return None

def update_tonometria(nr_seq_tonometria, ds_tonometria, nm_usuario):
    query = """
    UPDATE
        oft_tonometria
    SET
        ds_observacao = :ds_tonometria,
        nm_usuario_nrec = :nm_usuario,
        dt_atualizacao_nrec = SYSDATE
    WHERE
        nr_sequencia = :nr_seq_tonometria
    """
    params = {
        'ds_tonometria': ds_tonometria,
        'nm_usuario': nm_usuario,
        'nr_seq_tonometria': nr_seq_tonometria
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
        print(f"Ocorreu um erro ao executar o update update_tonometria: {e}")
        return None

def insert_tonometria(cd_medico, nr_atendimento, ds_tonometria, nm_usuario):
    query = """
        INSERT INTO oft_tonometria
        (
        nr_sequencia,
        dt_atualizacao,
        cd_profissional,
        ie_tipo_tonometria,
        dt_exame,
        nr_seq_consulta,
        nm_usuario,
        ds_observacao
        )
        VALUES
        (
        oft_tonometria_seq.NEXTVAL,
        SYSDATE,
        :cd_medico,
        1,
        SYSDATE,
        (select nr_sequencia from oft_consulta where nr_atendimento = :nr_atendimento AND ROWNUM = 1),
        :nm_usuario,
        :ds_tonometria
        )
    """
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_tonometria': ds_tonometria,
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
        print(f"Ocorreu um erro ao executar o insert insert_tonometria: {e}")
        return None

def salvar_liberar_tonometria(nr_atendimento):
    query = """
        UPDATE 
            oft_tonometria
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
        print(f"Ocorreu um erro ao executar o update salvar_liberar_tonometria: {e}")
        return None
    