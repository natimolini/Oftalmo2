from app.oracledb.oracle_connection import OracleConnection
from datetime import datetime, timedelta

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_atend_diagnostico(nr_atendimento):
    query = "SELECT nr_atendimento FROM diagnostico_doenca WHERE nr_atendimento = :nr_atendimento"
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
        print(f"Ocorreu um erro ao executar o select select_nr_seq_diagnostico: {e}")
        return None

def update_diagnostico(nr_atendimento, ds_diagnostico):
    query = """
    UPDATE
        diagnostico_doenca
    SET
        ds_diagnostico = :ds_diagnostico
    WHERE
        nr_atendimento = :nr_atendimento
    """
    params = {
        'ds_diagnostico': ds_diagnostico,
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
        print(f"Ocorreu um erro ao executar o update update_diagnostico: {e}")
        return None
    
def insert_diagnostico(cd_medico, nr_atendimento, ds_diagnostico, nm_usuario):
    current_time = datetime.now()
    dt_diagnostico = current_time + timedelta(seconds=0)
    
    # NOVA VERIFICAÇÃO: Verifica se já existe o diagnóstico na tabela
    duplicate_check_query = """
    SELECT COUNT(*)
    FROM diagnostico_medico 
    WHERE nr_atendimento = :nr_atendimento 
      AND ds_diagnostico = :ds_diagnostico
    """
    
    duplicate_params = {
        'nr_atendimento': nr_atendimento,
        'ds_diagnostico': ds_diagnostico
    }
    
    try:
        dup_result = oraconn.execute_select(duplicate_check_query, duplicate_params)
        if dup_result and dup_result[0][0] > 0:
            print(f"[INFO] Diagnóstico já existe para este atendimento: {ds_diagnostico}")
            return "ALREADY_EXISTS"
    except Exception as e:
        print(f"[WARNING] Failed to check for duplicate diagnoses: {str(e)}. Continuing...")
    
    # Se chegou aqui, não encontrou duplicata - prossegue com a inserção
    query = """
    DECLARE  
        v_dt_diagnostico DATE := TO_DATE(:dt_diagnostico, 'YYYY-MM-DD HH24:MI:SS');
        v_nr_seq_consulta NUMBER;
        v_nr_seq_diagnostico NUMBER;
    BEGIN  
        -- Busca o nr_seq_consulta
        SELECT nr_sequencia INTO v_nr_seq_consulta
        FROM oft_consulta 
        WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1;
        
        -- Busca o próximo nr_sequencia para oft_diagnostico
        SELECT NVL(MAX(nr_sequencia), 0) + 1 INTO v_nr_seq_diagnostico
        FROM oft_diagnostico;
        
        -- Inserindo na tabela diagnostico_medico
        INSERT INTO diagnostico_medico (
            nr_atendimento,
            dt_diagnostico,
            ie_tipo_diagnostico,
            dt_atualizacao,
            nm_usuario,
            ds_diagnostico,
            cd_medico
        ) VALUES (
            :nr_atendimento,
            v_dt_diagnostico,
            2,
            SYSDATE,
            :nm_usuario,
            :ds_diagnostico,
            :cd_medico
        );
        
        -- Inserindo também na tabela oft_diagnostico para aparecer no resumo do TASY
        INSERT INTO oft_diagnostico (
            nr_sequencia,
            dt_atualizacao,
            nm_usuario,
            nr_seq_consulta,
            cd_profissional,
            dt_registro,
            ds_diagnostico,
            ie_situacao,
            dt_liberacao
        ) VALUES (
            v_nr_seq_diagnostico,
            SYSDATE,
            :nm_usuario,
            v_nr_seq_consulta,
            :cd_medico,
            SYSDATE,
            :ds_diagnostico,
            'A',
            SYSDATE
        );

        -- Confirma a transação  
        COMMIT;  
    END;
    """
    
    params = {
        'cd_medico': cd_medico,
        'nr_atendimento': nr_atendimento,
        'ds_diagnostico': ds_diagnostico,
        'nm_usuario': nm_usuario,
        'dt_diagnostico': dt_diagnostico.strftime('%Y-%m-%d %H:%M:%S')  
    }

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    try:
        result = oraconn.execute_insert(query, params_cleared)
        print(f"[INFO] Diagnóstico inserido em diagnostico_medico e oft_diagnostico: {ds_diagnostico}")
        return result
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Failed to insert: {error_msg}")
        return None

def update_diagnostico_oft(nr_atendimento, ds_diagnostico, nm_usuario):
    """Atualiza o diagnóstico na tabela oft_diagnostico"""
    query = """
    UPDATE oft_diagnostico
    SET ds_diagnostico = :ds_diagnostico,
        dt_atualizacao = SYSDATE,
        nm_usuario = :nm_usuario
    WHERE nr_seq_consulta = (
        SELECT nr_sequencia 
        FROM oft_consulta 
        WHERE nr_atendimento = :nr_atendimento 
        AND ROWNUM = 1
    )
    AND ROWNUM = 1
    """
    
    params = {
        'ds_diagnostico': ds_diagnostico,
        'nm_usuario': nm_usuario,
        'nr_atendimento': nr_atendimento
    }
    
    try:
        result = oraconn.execute_update(query, params)
        print(f"[INFO] Diagnóstico atualizado na oft_diagnostico: {ds_diagnostico}")
        return result
    except Exception as e:
        print(f"[ERROR] Erro ao atualizar oft_diagnostico: {str(e)}")
        return None

def update_diagnostico_medico(nr_atendimento, ds_diagnostico, nm_usuario):
    """Atualiza o diagnóstico na tabela diagnostico_medico"""
    query = """
    UPDATE diagnostico_medico
    SET ds_diagnostico = :ds_diagnostico,
        dt_atualizacao = SYSDATE,
        nm_usuario = :nm_usuario
    WHERE nr_atendimento = :nr_atendimento
    AND ROWNUM = 1
    """
    
    params = {
        'ds_diagnostico': ds_diagnostico,
        'nm_usuario': nm_usuario,
        'nr_atendimento': nr_atendimento
    }
    
    try:
        result = oraconn.execute_update(query, params)
        print(f"[INFO] Diagnóstico atualizado na diagnostico_medico: {ds_diagnostico}")
        return result
    except Exception as e:
        print(f"[ERROR] Erro ao atualizar diagnostico_medico: {str(e)}")
        return None

def verificar_diagnostico_existe(nr_atendimento):
    """Verifica se já existe diagnóstico para o atendimento"""
    query = """
    SELECT COUNT(*) 
    FROM diagnostico_medico 
    WHERE nr_atendimento = :nr_atendimento
    """
    
    try:
        result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
        return result and result[0][0] > 0
    except Exception as e:
        print(f"[ERROR] Erro ao verificar diagnóstico existente: {str(e)}")
        return False

