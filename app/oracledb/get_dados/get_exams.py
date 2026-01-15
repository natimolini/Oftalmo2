from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_ds_exames(nr_atendimento):
    query = """
    SELECT ds_solicitacao FROM pedido_exame_externo WHERE nr_atendimento = :nr_atendimento
    """

    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})

    if not result:
        return ""
    
    ds_exames = result[0][0]

    return ds_exames

def verifica_cd_exame(cd_exame):
    query = """
    SELECT
        cd_procedimento
    FROM
        procedimento
    WHERE cd_procedimento = :cd_procedimento
    """

    try:
        result = oraconn.execute_select(query, {'cd_procedimento':cd_exame})
        return result
    except Exception as e:
        print(f'Erro ao verificar cd_exame no TASY: {e}')
        return None

def select_nr_seq_exame(nr_atendimento):
    """
    Check if an exam record already exists for this appointment
    """
    query = """
    SELECT nr_sequencia 
    FROM pedido_exame_externo 
    WHERE nr_atendimento = :nr_atendimento
    """
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_select(query, params)
    except Exception as e:
        print(f"Error in select_nr_seq_exame: {e}")
        return None

def insert_exam(cd_medico, nr_atendimento, nm_usuario):
    query = """
    INSERT INTO pedido_exame_externo (
        nr_sequencia,
        nr_atendimento,
        cd_pessoa_fisica,
        cd_profissional,
        dt_solicitacao,
        nm_usuario,
        dt_atualizacao,
        ie_ficha_unimed,
        ie_situacao          -- Added situacao field
    ) VALUES (
        pedido_exame_externo_seq.NEXTVAL,
        :nr_atendimento,
        (SELECT cd_pessoa_fisica FROM atendimento_paciente WHERE nr_atendimento = :nr_atendimento),
        :cd_profissional,
        SYSDATE,
        :nm_usuario,
        SYSDATE,
        'N',
        'A'                  -- Setting status as Active, like other tables
    )
    """
    
    print(f"Execute query: {query}")
    
    params = {
        'nr_atendimento': nr_atendimento,
        'cd_profissional': cd_medico,
        'nm_usuario': nm_usuario
    }
    
    print(f"Attempting to insert exam with params: {params}")
    
    try:
        result = oraconn.execute_insert(query, params)
        return result
    except Exception as e:
        error_msg = str(e)
        print(f"Error in insert_exam: {error_msg}")
        print(f"Full parameters: {params}")
        return None

def insert_exam_item(nr_seq_pedido, cd_exame, qtd_exame, nm_usuario):
    query = """
    INSERT INTO pedido_exame_externo_item (
        nr_sequencia,
        nr_seq_pedido,
        cd_procedimento,
        qt_exame,
        dt_atualizacao,
        nm_usuario,
        nr_seq_apresent
    ) VALUES (
        pedido_exame_externo_item_seq.NEXTVAL,
        :nr_seq_pedido,
        :cd_exame,
        :qtd_exame,
        SYSDATE,
        :nm_usuario,
        100
    )
    """
    
    print(f"Execute query: {query}")
    
    params = {
        'nr_seq_pedido': nr_seq_pedido,
        'cd_exame': cd_exame,
        'qtd_exame': qtd_exame,
        'nm_usuario': nm_usuario
    }
        
    try:
        result = oraconn.execute_insert(query, params)
        return result
    except Exception as e:
        error_msg = str(e)
        print(f"Error in insert_exam: {error_msg}")
        print(f"Full parameters: {params}")
        return None

def update_exam(nr_seq_exame, ds_solicitacao, nm_usuario):
    # Primeiro, verificar se o conteúdo atual é diferente
    query_check = """
    SELECT ds_solicitacao 
    FROM pedido_exame_externo 
    WHERE nr_sequencia = :nr_seq_exame
    """
    
    try:
        result = oraconn.execute_select(query_check, {'nr_seq_exame': nr_seq_exame})
        
        # Se não há resultado ou o conteúdo é o mesmo, não fazer nada
        if not result or result[0][0] == ds_solicitacao:
            return "NO_CHANGE"
            
        # Caso contrário, prosseguir com o update
        query = """
        UPDATE pedido_exame_externo
        SET
            ds_solicitacao = :ds_solicitacao,
            nm_usuario = :nm_usuario,
            dt_atualizacao = SYSDATE
        WHERE
            nr_sequencia = :nr_seq_exame
        """
        params = {
            'ds_solicitacao': ds_solicitacao,
            'nm_usuario': nm_usuario,
            'nr_seq_exame': nr_seq_exame
        }

        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Error in update_exam: {e}")
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
    
def deletar_exames_anteriores(nr_seq_pedido):
    query = """
        DELETE FROM pedido_exame_externo_item
        WHERE nr_seq_pedido = :nr_seq_pedido
    """
    params = {'nr_seq_pedido': nr_seq_pedido}

    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Erro ao deletar exames: {e}")
        return None