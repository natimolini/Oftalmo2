from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')


def insert_refracao_oculos(cd_medico, nr_atendimento, tipo_refracao, **kwargs):
    if tipo_refracao == "dinamica":
        query = """
        INSERT INTO oft_refracao
        (
            nr_sequencia, 
            dt_atualizacao, 
            dt_liberacao,
            cd_profissional, 
            nr_seq_consulta,
            dt_exame, 
            nm_usuario,
            ie_situacao,
            vl_od_pl_ard_esf,
            vl_od_pl_ard_cil,
            vl_od_pl_ard_eixo,
            vl_oe_pl_ard_esf,
            vl_oe_pl_ard_cil,
            vl_oe_pl_ard_eixo,
            vl_adicao,
            ds_observacao,
            ie_receita_dinamica
        ) 
        VALUES 
        (
            oft_refracao_seq.NEXTVAL,
            SYSDATE,
            SYSDATE,
            :cd_medico,
            (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
            SYSDATE,
            'ghr.tech',
            'A',
            :vl_od_pl_ard_esf,
            :vl_od_pl_ard_cil,
            :vl_od_pl_ard_eixo,
            :vl_oe_pl_ard_esf,
            :vl_oe_pl_ard_cil,
            :vl_oe_pl_ard_eixo,
            :vl_adicao,
            :ds_observacao,
            'S'
        )
        """
        params = {
            'cd_medico': cd_medico,
            'nr_atendimento': nr_atendimento,
            'vl_od_pl_ard_esf': kwargs.get('vl_od_pl_ard_esf'),
            'vl_od_pl_ard_cil': kwargs.get('vl_od_pl_ard_cil'),
            'vl_od_pl_ard_eixo': kwargs.get('vl_od_pl_ard_eixo'),
            'vl_oe_pl_ard_esf': kwargs.get('vl_oe_pl_ard_esf'),
            'vl_oe_pl_ard_cil': kwargs.get('vl_oe_pl_ard_cil'),
            'vl_oe_pl_ard_eixo': kwargs.get('vl_oe_pl_ard_eixo'),
            'vl_adicao': kwargs.get('vl_adicao'),
            'ds_observacao': kwargs.get('ds_observacao'),
        }
    elif tipo_refracao == "estatica":
        query = """
        INSERT INTO oft_refracao
        (
            nr_sequencia, 
            dt_atualizacao, 
            dt_liberacao,
            cd_profissional, 
            nr_seq_consulta,
            dt_exame, 
            nm_usuario,
            ie_situacao,
            vl_od_pl_are_esf,
            vl_od_pl_are_cil,
            vl_od_pl_are_eixo,
            vl_oe_pl_are_esf,
            vl_oe_pl_are_cil,
            vl_oe_pl_are_eixo,
            ds_observacao,
            ie_receita_estatica
        ) 
        VALUES 
        (
            oft_refracao_seq.NEXTVAL,
            SYSDATE,
            SYSDATE,
            :cd_medico,
            (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
            SYSDATE,
            'ghr.tech',
            'A',
            :vl_od_pl_are_esf,
            :vl_od_pl_are_cil,
            :vl_od_pl_are_eixo,
            :vl_oe_pl_are_esf,
            :vl_oe_pl_are_cil,
            :vl_oe_pl_are_eixo,
            :ds_observacao,
            'S'
        )
        """
        params = {
            'cd_medico': cd_medico,
            'nr_atendimento': nr_atendimento,
            'vl_od_pl_are_esf': kwargs.get('vl_od_pl_are_esf'),
            'vl_od_pl_are_cil': kwargs.get('vl_od_pl_are_cil'),
            'vl_od_pl_are_eixo': kwargs.get('vl_od_pl_are_eixo'),
            'vl_oe_pl_are_esf': kwargs.get('vl_oe_pl_are_esf'),
            'vl_oe_pl_are_cil': kwargs.get('vl_oe_pl_are_cil'),
            'vl_oe_pl_are_eixo': kwargs.get('vl_oe_pl_are_eixo'),
            'ds_observacao': kwargs.get('ds_observacao'),
        }
    else:
        raise ValueError("Tipo de refração inválido")

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    return oraconn.execute_insert(query, params_cleared)

