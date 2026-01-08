from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_dt_ultimas_consultas(cd_medico, cd_pessoa_fisica):
    # First update records where the user is irineu.antunes to have the correct doctor code
    update_query = """
        UPDATE agenda_consulta
        SET cd_medico_req = 192
        WHERE nm_usuario = 'irineu.antunes'
    """
    
    try:
        oraconn.execute_update(update_query, {})
        print("Updated cd_medico_req to 192 for records with nm_usuario = 'irineu.antunes'")
    except Exception as e:
        print(f"Error updating cd_medico_req: {str(e)}")


    query_producao = """
        SELECT
        dt_agenda,
        nr_atendimento,
        cd_pessoa_fisica
        FROM
        agenda_consulta
        WHERE
        cd_pessoa_fisica = :cd_pessoa_fisica
        ORDER BY dt_agenda DESC
    """
    
    try:
        result = oraconn.execute_select(query_producao, {
            'cd_pessoa_fisica': cd_pessoa_fisica
        })
        print(f"MODO PRODUÇÃO: Encontradas {len(result) if result else 0} consultas para o paciente {cd_pessoa_fisica}")
        return result
    except Exception as e:
        print(f"Erro na query de produção: {e}")
        return None
