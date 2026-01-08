from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_nr_seq_consulta(nr_atendimento):
    query = "SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1"

    return oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})

def get_dados_paciente(nr_atendimento):
    query = """
    SELECT
        ac.nm_paciente AS nome,
        ac.qt_idade_pac AS idade,
        /*obter_cargo_PF(ac.cd_pessoa_fisica, 'D') AS profissao,*/
        (
            SELECT MAX(b.ds_cargo)
            FROM pessoa_fisica a
            JOIN cargo b ON a.cd_cargo = b.cd_cargo
            WHERE a.cd_pessoa_fisica = ac.cd_pessoa_fisica
        ) AS profissao,
        c.ds_convenio AS convenio,
        (
            SELECT TO_CHAR(MAX(dt_consulta), 'DD/MM/YYYY')
            FROM oft_consulta oc1
            WHERE oc1.cd_pessoa_fisica = ac.cd_pessoa_fisica
            AND oc1.dt_consulta < (
                SELECT MAX(oc2.dt_consulta)
                FROM oft_consulta oc2
                WHERE oc2.cd_pessoa_fisica = ac.cd_pessoa_fisica
            )
        ) AS ultima_consulta,
        (
            SELECT nr_sequencia
            FROM oft_consulta oc1
            WHERE oc1.cd_pessoa_fisica = ac.cd_pessoa_fisica
            AND oc1.dt_consulta = (
                SELECT MAX(oc2.dt_consulta)
                FROM oft_consulta oc2
                WHERE oc2.cd_pessoa_fisica = ac.cd_pessoa_fisica
                    AND oc2.dt_consulta < (
                        SELECT MAX(oc3.dt_consulta)
                        FROM oft_consulta oc3
                        WHERE oc3.cd_pessoa_fisica = ac.cd_pessoa_fisica
                    )
            )
        ) AS nr_sequencia_ultima_consulta,
        CASE
            WHEN p.ie_sexo = 'M' THEN 'Masculino'
            WHEN p.ie_sexo = 'F' THEN 'Feminino'
            ELSE 'Indefinido'
        END AS sexo,
        p.nr_cpf AS cpf,
        p.dt_nascimento AS nascimento,
        p.cd_pessoa_fisica AS cd_pessoa_fisica
    FROM
        agenda_consulta ac
    LEFT JOIN
        convenio c ON c.cd_convenio = ac.cd_convenio
    LEFT JOIN
        pessoa_fisica p ON p.cd_pessoa_fisica = ac.cd_pessoa_fisica
    WHERE
        ac.nr_atendimento = :nr_atendimento
    """

    results = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
    if not results:
        return None

    result = [["" if val is None else val for val in row] for row in results][0]

    nm_paciente = result[0]
    idade_paciente = result[1]
    profissao = result[2]
    convenio = result[3]
    ultima_consulta = result[4]
    nr_sequencia_ultima_consulta = result[5]
    sexo = result[6]
    cpf = result[7]
    nascimento = result[8]
    cd_pessoa_fisica = result[9]

    return nm_paciente, idade_paciente, profissao, convenio, ultima_consulta, sexo, nr_sequencia_ultima_consulta, cpf, nascimento, cd_pessoa_fisica

def get_conduta_por_seq_consulta(nr_seq_consulta):
    query = "SELECT ds_conduta FROM oft_conduta WHERE nr_seq_consulta = :nr_seq_consulta"

    result = oraconn.execute_select(query, {'nr_seq_consulta': nr_seq_consulta})

    return result[0][0] if result else ""

def get_consultas_por_paciente(cd_pessoa_fisica):
    # 1. Query principal (mantida igual)
    query = """
    SELECT *
    FROM (
        SELECT
            oc.dt_consulta,
            oc.nr_atendimento,
            oc.nm_usuario,
            ana.DS_ANAMNESE           AS anamnese,
            oco.ds_orientacao         AS oculos,
            cor.ds_observacao         AS acuidade,
            ton.ds_observacao         AS pressao,
            LISTAGG(diag.ds_diagnostico, CHR(10)) 
                WITHIN GROUP (ORDER BY diag.DT_DIAGNOSTICO) AS diagnostico,
            con.DS_INF_PRE_CIRURGICA  AS cirurgia,
            len.ds_observacao         AS lentes_contato,
            oc.nr_sequencia           AS nr_seq_consulta,
            ROW_NUMBER() OVER (PARTITION BY oc.nr_atendimento ORDER BY oc.dt_consulta DESC) AS rn
        FROM oft_consulta oc
        LEFT JOIN oft_anamnese ana ON ana.nr_seq_consulta = oc.nr_sequencia
        LEFT JOIN oft_oculos oco ON oco.nr_seq_consulta = oc.nr_sequencia
        LEFT JOIN oft_correcao_atual cor ON cor.nr_seq_consulta = oc.nr_sequencia
        LEFT JOIN oft_tonometria ton ON ton.nr_seq_consulta = oc.nr_sequencia
        LEFT JOIN diagnostico_medico diag ON diag.nr_atendimento = oc.nr_atendimento
        LEFT JOIN oft_conduta con ON con.nr_seq_consulta = oc.nr_sequencia
        LEFT JOIN pedido_exame_externo ex ON ex.nr_atendimento = oc.nr_atendimento
        LEFT JOIN oft_consulta_lente len ON len.nr_seq_consulta = oc.nr_sequencia
        WHERE oc.cd_pessoa_fisica = :cd_pessoa_fisica
        GROUP BY
            oc.dt_consulta,
            oc.nr_atendimento,
            oc.nm_usuario,
            ana.DS_ANAMNESE,
            oco.ds_orientacao,
            cor.ds_observacao,
            ton.ds_observacao,
            con.DS_INF_PRE_CIRURGICA,
            len.ds_observacao,
            oc.nr_sequencia
    ) sub
    WHERE rn = 1
    ORDER BY dt_consulta ASC
    """
    results = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
    print(f"Consultas encontradas: {len(results)} - {results}")
    
    if not results:
        return []
        
    # Extrair listas de nr_seq_consulta e nr_atendimento para consultas em lote
    seq_consultas = []
    atendimentos = []
    for row in results:
        nr_seq_consulta = row[10]  # Último campo (nr_seq_consulta)
        nr_atendimento = row[1]    # Segundo campo (nr_atendimento)
        seq_consultas.append(str(nr_seq_consulta))
        atendimentos.append(str(nr_atendimento))
    
    # 2. Buscar todas as condutas de uma vez
    condutas = {}
    if seq_consultas:
        seq_list = ','.join(seq_consultas)
        conduta_query = f"SELECT nr_seq_consulta, ds_conduta FROM oft_conduta WHERE nr_seq_consulta IN ({seq_list})"
        conduta_results = oraconn.execute_select(conduta_query)
        for cond_row in conduta_results:
            condutas[cond_row[0]] = cond_row[1]
    
    # 3. Buscar todos os exames de uma vez
    exames = {}
    if atendimentos:
        atend_list = ','.join(atendimentos)
        exames_query = f"SELECT nr_atendimento, ds_solicitacao FROM pedido_exame_externo WHERE nr_atendimento IN ({atend_list})"
        exames_results = oraconn.execute_select(exames_query)
        for ex_row in exames_results:
            exames[ex_row[0]] = ex_row[1]
    
    # 4. Montar o resultado final usando os dicionários de condutas e exames
    consultas = []
    for row in results:
        dt_consulta, nr_atendimento, nm_usuario, ds_anamnese, ds_oculos, ds_acuidade, \
        ds_pressao, ds_diagnostico, ds_cirurgia, ds_lentes, nr_seq_consulta, rn = row
        
        consultas.append({
            "data_consulta": dt_consulta.strftime("%d/%m/%Y") if hasattr(dt_consulta, "strftime") else str(dt_consulta),
            "nr_atendimento": nr_atendimento,  # IMPORTANTE: Certificar que está aqui
            "medico": nm_usuario or "",
            "queixa": ds_anamnese,
            "refracao": ds_oculos,
            "acuidade": ds_acuidade,
            "pressao": ds_pressao,
            "diagnostico": ds_diagnostico,
            "conduta": condutas.get(nr_seq_consulta, ""),
            "exames": exames.get(nr_atendimento, ""),
            "cirurgia": ds_cirurgia,
            "lentes_contato": ds_lentes,
            "rn": rn
        })
    
    return consultas

def get_exames_por_atendimento(nr_atendimento):
    query = "SELECT ds_solicitacao FROM pedido_exame_externo WHERE nr_atendimento = :nr_atendimento"
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
    return result[0][0] if result else ""

def get_consultas_antigas(cd_pessoa_fisica):
    """
    Retorna uma lista de dicionários com as consultas antigas do paciente.
    """
    query = """
        SELECT TO_CHAR(dt_registro, 'DD/MM/YYYY') as data_consulta, ds_observacao
        FROM paciente_alergia
        WHERE cd_pessoa_fisica = :cd_pessoa_fisica
        AND dt_registro IS NOT NULL
        ORDER BY dt_registro ASC
    """
    results = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
    consultas_antigas = []
    if results:
        for row in results:
            consultas_antigas.append({
                "data_consulta": row[0],
                "ds_observacao": row[1]
            })
    return consultas_antigas

def get_consultas_antigas_alergia(cd_pessoa_fisica):
    """
    Retorna uma lista de dicionários com as consultas antigas do paciente.
    """
    query = """
        SELECT TO_CHAR(dt_registro, 'DD/MM/YYYY') as data_consulta, ds_observacao
        FROM paciente_alergia
        WHERE cd_pessoa_fisica = :cd_pessoa_fisica
        AND dt_registro IS NOT NULL
        ORDER BY dt_registro ASC
    """
    results = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
    consultas_antigas = []
    if results:
        for row in results:
            consultas_antigas.append({
                "data_consulta": row[0],
                "ds_observacao": row[1]
            })
    return consultas_antigas

if __name__ == '__main__':
    print(get_dados_paciente(1936))



