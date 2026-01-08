from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def select_nr_seq_refracao(nr_atendimento):
    query = "SELECT nr_sequencia FROM oft_refracao WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)"
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
        print(f"Ocorreu um erro ao executar a consulta select_nr_seq_refracao: {e}")
        return None

def update_refracao(nr_seq_refracao, tipo_refracao, **kwargs):
    if tipo_refracao == "dinamica":
        query = """
        UPDATE
            oft_refracao
        SET
            vl_od_pl_ard_esf = :vl_od_pl_ard_esf,
            vl_od_pl_ard_cil = :vl_od_pl_ard_cil,
            vl_od_pl_ard_eixo = :vl_od_pl_ard_eixo,
            vl_oe_pl_ard_esf = :vl_oe_pl_ard_esf,
            vl_oe_pl_ard_cil = :vl_oe_pl_ard_cil,
            vl_oe_pl_ard_eixo = :vl_oe_pl_ard_eixo,
            vl_adicao = :vl_adicao,
            vl_adicao_oe = :vl_adicao,
            ds_observacao = :ds_observacao,
            nm_usuario_nrec = :nm_usuario,
            dt_atualizacao_nrec = SYSDATE
        WHERE
            nr_sequencia = :nr_seq_refracao
        """
        params = {
            'vl_od_pl_ard_esf': kwargs.get('vl_od_pl_ard_esf'),
            'vl_od_pl_ard_cil': kwargs.get('vl_od_pl_ard_cil'),
            'vl_od_pl_ard_eixo': kwargs.get('vl_od_pl_ard_eixo'),
            'vl_oe_pl_ard_esf': kwargs.get('vl_oe_pl_ard_esf'),
            'vl_oe_pl_ard_cil': kwargs.get('vl_oe_pl_ard_cil'),
            'vl_oe_pl_ard_eixo': kwargs.get('vl_oe_pl_ard_eixo'),
            'vl_adicao': kwargs.get('vl_adicao'),
            'ds_observacao': kwargs.get('ds_observacao'),
            'nm_usuario': kwargs.get('nm_usuario'),
            'nr_seq_refracao': nr_seq_refracao
        }
    elif tipo_refracao == "estatica":
        query = """
        UPDATE
            oft_refracao
        SET
            vl_od_pl_are_esf = :vl_od_pl_are_esf,
            vl_od_pl_are_cil = :vl_od_pl_are_cil,
            vl_od_pl_are_eixo = :vl_od_pl_are_eixo,
            vl_oe_pl_are_esf = :vl_oe_pl_are_esf,
            vl_oe_pl_are_cil = :vl_oe_pl_are_cil,
            vl_oe_pl_are_eixo = :vl_oe_pl_are_eixo,
            ds_observacao = :ds_observacao,
            nm_usuario_nrec = :nm_usuario,
            dt_atualizacao_nrec = SYSDATE
        WHERE
            nr_sequencia = :nr_seq_refracao
        """
        params = {
            'vl_od_pl_are_esf': kwargs.get('vl_od_pl_are_esf'),
            'vl_od_pl_are_cil': kwargs.get('vl_od_pl_are_cil'),
            'vl_od_pl_are_eixo': kwargs.get('vl_od_pl_are_eixo'),
            'vl_oe_pl_are_esf': kwargs.get('vl_oe_pl_are_esf'),
            'vl_oe_pl_are_cil': kwargs.get('vl_oe_pl_are_cil'),
            'vl_oe_pl_are_eixo': kwargs.get('vl_oe_pl_are_eixo'),
            'ds_observacao': kwargs.get('ds_observacao'),
            'nm_usuario': kwargs.get('nm_usuario'),
            'nr_seq_refracao': nr_seq_refracao
        }
    else:
        raise ValueError("Tipo de refração inválido")

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    try:
        return oraconn.execute_update(query, params_cleared)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar o update update_refracao: {e}")
        return None

def insert_refracao(cd_medico, nr_atendimento, tipo_refracao, **kwargs):
    if tipo_refracao == "dinamica":
        query = """
        INSERT INTO oft_refracao
        (
            nr_sequencia, 
            dt_atualizacao, 
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
            vl_adicao_oe,
            ds_observacao,
            ie_receita_dinamica,
            nm_usuario_nrec,
            dt_atualizacao_nrec
        ) 
        VALUES 
        (
            oft_refracao_seq.NEXTVAL,
            SYSDATE,
            :cd_medico,
            (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
            SYSDATE,
            :nm_usuario,
            'A',
            :vl_od_pl_ard_esf,
            :vl_od_pl_ard_cil,
            :vl_od_pl_ard_eixo,
            :vl_oe_pl_ard_esf,
            :vl_oe_pl_ard_cil,
            :vl_oe_pl_ard_eixo,
            :vl_adicao,
            :vl_adicao,
            :ds_observacao,
            'S',
            :nm_usuario,
            SYSDATE
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
            'nm_usuario': kwargs.get('nm_usuario'),
        }
    elif tipo_refracao == "estatica":
        query = """
        INSERT INTO oft_refracao
        (
            nr_sequencia, 
            dt_atualizacao, 
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
            ie_receita_estatica,
            nm_usuario_nrec,
            dt_atualizacao_nrec
        ) 
        VALUES 
        (
            oft_refracao_seq.NEXTVAL,
            SYSDATE,
            :cd_medico,
            (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1),
            SYSDATE,
            :nm_usuario,
            'A',
            :vl_od_pl_are_esf,
            :vl_od_pl_are_cil,
            :vl_od_pl_are_eixo,
            :vl_oe_pl_are_esf,
            :vl_oe_pl_are_cil,
            :vl_oe_pl_are_eixo,
            :ds_observacao,
            'S',
            :nm_usuario,
            SYSDATE
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
            'nm_usuario': kwargs.get('nm_usuario'),
        }
    else:
        raise ValueError("Tipo de refração inválido")

    params_cleared = {key: (None if value is None else value) for key, value in params.items()}

    try:
        return oraconn.execute_insert(query, params_cleared)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar o insert insert_refracao: {e}")
        return None

def salvar_liberar_refracao(nr_atendimento):
    query = """
        UPDATE 
            oft_refracao
        SET
            dt_liberacao = SYSDATE
        WHERE
            nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)
    """
    params = {'nr_atendimento': nr_atendimento}

    try:
        return oraconn.execute_update(query, params)
    except ConnectionError as conn_err:
        print(f"Erro de conexão com o banco de dados: {conn_err}")
        return None
    except ValueError as val_err:
        print(f"Erro de valor: {val_err}")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao executar o update salvar_liberar_refracao: {e}")
        return None
