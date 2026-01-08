from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_all_counts(dt_consulta, cd_agenda=None):
    if cd_agenda is None:
      cd_agenda = 44  # Mantém a compatibilidade com código anterior

    query = """
    SELECT
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda = 'N'  AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_consultas,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda = 'Pr' AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_retorno,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('R4') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_retornos_cirurgia,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda = 'R3' AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_resultado_exame,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda = 'N8' AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_consulta_resultado,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('N9') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_opd,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('N6') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_teste_lente,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('N10') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_yag,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('N15') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_ava_cirurgica,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('N1') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_emergencia,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('R24') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_conversar,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('C11') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_refracao,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('R28') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_telefone,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('R22') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_ver_ficha,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('R23') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_ver_lente,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('R26') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_laudo,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_classif_agenda IN ('N12') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_prk,
        (SELECT COUNT(*) FROM agenda_consulta
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda IN ('O') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_em_andamento,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda = 'N' AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_marcada,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda = 'C' AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_cancelada,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda = 'CN' AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_confirmada,
        (SELECT COUNT(*) FROM agenda_consulta  
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda IN ('F','I') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_faltas,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda IN ('A','AR') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_aguardando,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda IN ('ET') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_em_triagem,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda IN ('AD') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_atendido,
        (SELECT COUNT(*) FROM agenda_consulta 
         WHERE cd_agenda = :cd_agenda AND cd_pessoa_fisica IS NOT NULL 
           AND ie_status_agenda IN ('E') AND TRUNC(dt_agenda) = TO_DATE(:dt_consulta, 'DD-MM-YYYY')) AS qtd_executada
    FROM dual
    """
    params = {'dt_consulta': dt_consulta, 'cd_agenda': cd_agenda}
    result = oraconn.execute_select(query, params)
    print(result)

    if not result:
        return {}

    keys = [
        'qtd_consultas','qtd_retorno','qtd_retornos_cirurgia','qtd_resultado_exame','qtd_consulta_resultado',
        'qtd_opd','qtd_teste_lente','qtd_yag','qtd_ava_cirurgica','qtd_emergencia','qtd_conversar','qtd_refracao',
        'qtd_telefone','qtd_ver_ficha','qtd_ver_lente','qtd_laudo','qtd_prk','qtd_em_andamento','qtd_marcada',
        'qtd_cancelada','qtd_confirmada','qtd_faltas','qtd_aguardando','qtd_em_triagem','qtd_atendido','qtd_executada'
    ]
    return dict(zip(keys, result[0]))