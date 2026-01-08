from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_ultima_refracao(nr_atendimento):
    query = """
    SELECT
        oref.vl_od_pl_ard_esf,
        oref.vl_od_pl_ard_cil,
        oref.vl_od_pl_ard_eixo,
        oref.vl_oe_pl_ard_esf,
        oref.vl_oe_pl_ard_cil,
        oref.vl_oe_pl_ard_eixo,
        oref.vl_adicao,
        oref.ds_observacao
    FROM
        oft_refracao oref
    JOIN
        oft_consulta oc ON oc.nr_sequencia = oref.nr_seq_consulta 
    WHERE
        oc.cd_pessoa_fisica = (SELECT cd_pessoa_fisica FROM atendimento_paciente WHERE nr_atendimento = :nr_atendimento)
        AND oc.nr_atendimento = :nr_atendimento
        AND oref.dt_atualizacao_nrec IS NOT NULL
        AND (
            oref.vl_od_pl_ard_esf IS NOT NULL
            OR oref.vl_od_pl_ard_cil IS NOT NULL
            OR oref.vl_od_pl_ard_eixo IS NOT NULL
            OR oref.vl_oe_pl_ard_esf IS NOT NULL
            OR oref.vl_oe_pl_ard_cil IS NOT NULL
            OR oref.vl_oe_pl_ard_eixo IS NOT NULL
            OR oref.vl_adicao IS NOT NULL
            OR oref.ds_observacao IS NOT NULL
        )
    ORDER BY
        oref.dt_atualizacao_nrec DESC
    """
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})

    if not result:
        return None

    result = [["" if val is None else val for val in row] for row in result][0]

    vl_od_pl_ard_esf = result[0]
    vl_od_pl_ard_cil = result[1]
    vl_od_pl_ard_eixo = result[2]
    vl_oe_pl_ard_esf = result[3]
    vl_oe_pl_ard_cil = result[4]
    vl_oe_pl_ard_eixo = result[5]
    vl_adicao = result[6]
    ds_observacao = result[7]

    return vl_od_pl_ard_esf, vl_od_pl_ard_cil, vl_od_pl_ard_eixo, vl_oe_pl_ard_esf, vl_oe_pl_ard_cil, vl_oe_pl_ard_eixo, vl_adicao, ds_observacao
