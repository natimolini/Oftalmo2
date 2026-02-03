from app.oracledb.oracle_connection import OracleConnection
from datetime import datetime


# PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
# HOMOLOG
# oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br')
# TESTEGHR
# oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')


def get_dados_agenda(cd_pessoa_fisica, data):
    query = """
        SELECT 
            TO_CHAR(ac.dt_agenda, 'HH24:MI') AS hora,                    -- [0]
            SUBSTR(ag.ds_classificacao, 1, 200) AS tipo,                 -- [1] ie_classif_agenda (desc)
            vd.ds_valor_dominio AS comp,                                 -- [2] ie_status_agenda (desc)
            TO_CHAR(ac.dt_aguardando, 'HH24:MI') AS chegada,             -- [3]
            CASE 
                WHEN ac.dt_aguardando IS NOT NULL THEN 
                    TO_CHAR(
                        COALESCE(
                            FLOOR( (COALESCE(ac.dt_consulta, ac.dt_atendido, SYSDATE) - ac.dt_aguardando) * 1440 ),
                            0
                        )
                    ) || ' min'
                ELSE NULL
            END AS t_espera,                                             -- [4]
            ac.nm_paciente AS nome,                                      -- [5]
            ac.qt_idade_pac AS idade,                                    -- [6]
            c.ds_convenio AS convenio,                                   -- [7]
            ac.nr_telefone AS fone_celular,                              -- [8]
            ac.ds_observacao AS observacao,                              -- [9]
            ac.nr_atendimento,                                           -- [10]
            ac.cd_pessoa_fisica,                                         -- [11]
            TO_CHAR(ac.dt_nascimento_pac, 'DD/MM/YYYY') AS nascimento    -- [12]
        FROM agenda_consulta ac
        LEFT JOIN agenda a               ON a.cd_agenda = ac.cd_agenda
        LEFT JOIN convenio c             ON c.cd_convenio = ac.cd_convenio
        LEFT JOIN agenda_classif ag      ON ag.cd_classificacao = ac.ie_classif_agenda
        LEFT JOIN valor_dominio vd       ON vd.cd_dominio = 83 AND vd.vl_dominio = ac.ie_status_agenda
        WHERE a.cd_pessoa_fisica = :cd_pessoa_fisica
          AND a.cd_especialidade = 18
          AND TRUNC(ac.dt_agenda) = TO_DATE(:data, 'YYYY-MM-DD')
        ORDER BY ac.dt_agenda
    """

    results = oraconn.execute_select(query, {
        'cd_pessoa_fisica': cd_pessoa_fisica,
        'data': data
    })

    lista_processada = []
    
    for row in results:
        linha = list(row)
        
        dt_nasc_str = linha[12]
        idade_calculada = ""
        
        if dt_nasc_str:
            try:
                nascimento = datetime.strptime(dt_nasc_str, '%d/%m/%Y')
                hoje = datetime.now()
                
                idade = hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
                idade_calculada = str(idade)
            except Exception:
                idade_calculada = linha[6]

        linha[6] = idade_calculada
        
        linha_limpa = ["" if val is None else val for val in linha]
        lista_processada.append(linha_limpa)

    return lista_processada

def get_aviso(cd_pessoa_fisica):
    query = """
        SELECT ds_aviso
        FROM agenda_aviso
        WHERE cd_agenda = (
            SELECT cd_agenda FROM agenda 
            WHERE cd_pessoa_fisica = :cd_pessoa_fisica AND cd_especialidade = 18
        )
        AND nr_sequencia = (SELECT MAX(nr_sequencia) FROM agenda_aviso)
    """
    result = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
    return "" if not result else result[0][0]
