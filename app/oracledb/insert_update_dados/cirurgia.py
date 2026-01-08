from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_conduta_cirurgia(nr_atendimento):
    """Verifica se existe um registro de conduta para o atendimento"""
    query = "SELECT nr_sequencia FROM oft_conduta WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)"
    params = {'nr_atendimento': nr_atendimento}
    try:
        return oraconn.execute_select(query, params)
    except Exception as e:
        print(f"Erro ao executar select_nr_seq_conduta_cirurgia: {e}")
        return None

def existe_cirurgia_por_atendimento(nr_atendimento):
    """Verifica se existe informação cirúrgica para o atendimento na tabela oft_conduta"""
    query = """
    SELECT 1 
    FROM oft_conduta 
    WHERE nr_seq_consulta = (
        SELECT nr_sequencia 
        FROM oft_consulta 
        WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1
    )
    AND DS_INF_PRE_CIRURGICA IS NOT NULL
    AND ROWNUM = 1
    """
    params = {'nr_atendimento': nr_atendimento}
    result = oraconn.execute_select(query, params)
    return bool(result)

def update_cirurgia_observacao(nr_seq_conduta, ds_observacao, nm_usuario):
    """Atualiza o campo de cirurgia na tabela oft_conduta pelo nr_sequencia"""
    query = """
    UPDATE oft_conduta
    SET 
        DS_INF_PRE_CIRURGICA = :ds_observacao,
        nm_usuario_nrec = :nm_usuario,
        dt_atualizacao_nrec = SYSDATE,
        ie_situacao = 'A'
    WHERE nr_sequencia = :nr_seq_conduta
    """
    params = {
        'ds_observacao': ds_observacao,
        'nm_usuario': nm_usuario,
        'nr_seq_conduta': nr_seq_conduta
    }
    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Erro ao executar update_cirurgia_observacao: {e}")
        return None

def update_cirurgia_observacao_por_atendimento(nr_atendimento, ds_observacao):
    """Atualiza o campo de cirurgia na tabela oft_conduta pelo nr_atendimento"""
    query = """
    UPDATE oft_conduta
    SET 
        DS_INF_PRE_CIRURGICA = :ds_observacao,
        ie_situacao = 'A'
    WHERE nr_seq_consulta = (
        SELECT nr_sequencia 
        FROM oft_consulta 
        WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1
    )
    """
    params = {
        'ds_observacao': ds_observacao,
        'nr_atendimento': nr_atendimento
    }
    return oraconn.execute_update(query, params)

def insert_cirurgia(nr_atendimento, ds_observacao, nm_usuario):
    """Insere dados de cirurgia na tabela oft_conduta"""
    # Primeiro verificar se já existe conduta para este atendimento
    conduta_existente = select_nr_seq_conduta_cirurgia(nr_atendimento)
    
    if conduta_existente:
        # Se existe, apenas atualiza o campo de cirurgia
        nr_seq_conduta = conduta_existente[0][0]
        return update_cirurgia_observacao(nr_seq_conduta, ds_observacao, nm_usuario)
    else:
        # Se não existe, insere um novo registro
        query = """
        INSERT INTO oft_conduta 
        (
            dt_registro,
            cd_profissional,
            nr_seq_consulta,
            nr_sequencia,
            nm_usuario,
            dt_atualizacao,
            DS_INF_PRE_CIRURGICA,
            ie_situacao
        )
        VALUES
        (
            SYSDATE,
            (SELECT cd_medico_req FROM agenda_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
            (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
            oft_conduta_seq.NEXTVAL,
            :nm_usuario,
            SYSDATE,
            :ds_observacao,
            'A'
        )
        """
        params = {
            'nr_atendimento': nr_atendimento,
            'ds_observacao': ds_observacao,
            'nm_usuario': nm_usuario
        }
        return oraconn.execute_insert(query, params)