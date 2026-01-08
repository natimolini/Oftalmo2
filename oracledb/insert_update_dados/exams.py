from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_exame(nr_atendimento):
    query = "SELECT nr_sequencia FROM pedido_exame_externo WHERE nr_atendimento = :nr_atendimento"
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_select(query, params)
    except Exception as e:
        print(f"Erro ao executar select_nr_seq_exame: {e}")
        return None

def update_exame(nr_seq_exame, ds_solicitacao, nm_usuario):
    query = """
        UPDATE 
            pedido_exame_externo
        SET
            ds_solicitacao = :ds_solicitacao,
            nm_usuario_nrec = :nm_usuario,
            dt_atualizacao_nrec = SYSDATE
        WHERE
            nr_sequencia = :nr_seq_exame
    """
    params = {
        'ds_solicitacao': ds_solicitacao,
        'nm_usuario': nm_usuario,
        'nr_seq_exame': nr_seq_exame
    }

    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Erro ao executar update_exame: {e}")
        return None

def insert_exame(cd_medico, nr_atendimento, ds_solicitacao, nm_usuario):
    query = """
        INSERT INTO pedido_exame_externo
        (
            nr_sequencia,
            nr_atendimento,
            cd_medico,
            dt_solicitacao,
            ds_solicitacao,
            nm_usuario,
            dt_atualizacao
        )
        VALUES
        (
            pedido_exame_externo_seq.NEXTVAL,
            :nr_atendimento,
            :cd_medico,
            SYSDATE,
            :ds_solicitacao,
            :nm_usuario,
            SYSDATE
        )
    """
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_solicitacao': ds_solicitacao,
        'nm_usuario': nm_usuario
    }

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    try:
        return oraconn.execute_insert(query, params_cleared)
    except Exception as e:
        print(f"Erro ao executar insert_exame: {e}")
        return None

def salvar_liberar_exame(nr_atendimento):
    query = """
        UPDATE 
            pedido_exame_externo
        SET
            dt_liberacao = SYSDATE
        WHERE
            nr_atendimento = :nr_atendimento
    """
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Erro ao executar salvar_liberar_exame: {e}")
        return None