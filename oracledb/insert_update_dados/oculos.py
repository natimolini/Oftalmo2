from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_oculos(nr_atendimento):
    query = """
    SELECT nr_sequencia 
    FROM oft_oculos 
    WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)
    """
    params = {'nr_atendimento': nr_atendimento}

    try:
        results = oraconn.execute_select(query, params)
        return results if results else None
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar a consulta select_nr_seq_oculos: {e}")
        return None

def update_oculos(nr_seq_oculos, ds_oculos, nm_usuario):
    if not nr_seq_oculos:
        print("Nr_seq_oculos não pode ser nulo")
        return None
        
    query = """
    UPDATE
        oft_oculos
    SET
        ds_orientacao = :ds_oculos,
        nm_usuario_nrec = :nm_usuario,
        dt_atualizacao_nrec = SYSDATE
    WHERE
        nr_sequencia = :nr_seq_oculos
    """
    params = {
        'ds_oculos': ds_oculos,
        'nr_seq_oculos': nr_seq_oculos,
        'nm_usuario': nm_usuario
    }

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    try:
        return oraconn.execute_update(query, params_cleared)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar o update update_oculos: {e}")
        return None

def insert_oculos(cd_medico, nr_atendimento, nm_usuario, ds_oculos):
    # Truncar ds_oculos para garantir que não exceda o tamanho máximo da coluna
    max_chars = 500  # Conforme char_length reportado
    
    if ds_oculos and len(ds_oculos) > max_chars:
        print(f"AVISO: Texto de orientação truncado de {len(ds_oculos)} para {max_chars} caracteres")
        ds_oculos = ds_oculos[:max_chars]
    
    query = """
    INSERT INTO oft_oculos
    (
        nr_sequencia,
        nr_seq_consulta,
        dt_registro,
        cd_profissional,
        nm_usuario,
        dt_atualizacao,
        ds_orientacao
    ) 
    VALUES 
    (
        oft_oculos_seq.NEXTVAL,
        (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
        SYSDATE,
        :cd_medico,
        :nm_usuario,
        SYSDATE,
        :ds_oculos
    )
    """
    
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'nm_usuario': nm_usuario,
        'ds_oculos': ds_oculos
    }
    
    # Limpar valores None se houver
    params_cleared = {key: (None if value is None else value) for key, value in params.items()}
    
    try:
        return oraconn.execute_insert(query, params_cleared)
    except Exception as e:
        print(f"Ocorreu um erro ao executar o insert insert_oculos: {e}")
        return None

def salvar_liberar_oculos(nr_atendimento):
    query = """
        UPDATE 
            oft_oculos
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
        print(f"Ocorreu um erro ao executar o update salvar_liberar_oculos: {e}")
        return None