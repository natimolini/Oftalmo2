from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')


def update_finalizar_consulta(nr_atendimento):
    query = """
    BEGIN
        UPDATE oft_consulta
        SET dt_fim_consulta = SYSDATE
        WHERE nr_atendimento = :nr_atendimento;

        UPDATE agenda_consulta
        SET dt_atendido = SYSDATE,
            ie_status_agenda = 'E'
        WHERE nr_atendimento = :nr_atendimento;

        COMMIT;
    END;
    """
    params = {
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
        print(f"Ocorreu um erro ao executar o update update_finalizar_consulta: {e}")
        return None


def update_status_agenda_executada(nr_atendimento):
    query = """
    UPDATE agenda_consulta
    SET dt_atendido = SYSDATE,
        ie_status_agenda = 'E'
    WHERE nr_atendimento = :nr_atendimento
    """
    params = {'nr_atendimento': nr_atendimento}
    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Erro ao atualizar status agenda: {e}")
        return None


def update_status_agenda_em_andamento(nr_atendimento):
    query = """
    UPDATE agenda_consulta
    SET dt_atendido = SYSDATE,
        ie_status_agenda = 'O'
    WHERE nr_atendimento = :nr_atendimento
    """
    params = {'nr_atendimento': nr_atendimento}
    try:
        return oraconn.execute_update(query, params)
    except Exception as e:
        print(f"Erro ao atualizar status para Em andamento: {e}")
        return None
