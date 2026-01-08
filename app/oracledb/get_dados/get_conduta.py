from app.oracledb.oracle_connection import OracleConnection

#PRODUCAO
oraconn = OracleConnection('ghrprontuario', 'Xy7#kT2@', '10.250.250.2', '1521', 'dbprod.oftalmocuritiba.com.br')
#HOMOLOG
#oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br') 
#TESTEGHR
#oraconn = OracleConnection('demo', 'aloisktasy7818', '192.168.10.19', '1521', 'dbteste')

def get_ds_conduta(nr_atendimento):
    query = """
    SELECT ds_conduta FROM oft_conduta WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)
    """

    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})

    if not result:
        return ""
    
    ds_conduta = result[0][0]

    return ds_conduta

def get_ds_observacao(nr_atendimento):
    """Retorna apenas a primeira receita"""
    query = """
    SELECT ds_observacao FROM oft_conduta WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)
    """
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
    if not result or not result[0][0]:
        return ""
    
    conteudo_completo = result[0][0]
    separador = "###SEGUNDA_RECEITA###"
    
    # Se não tem o separador, retorna tudo
    if separador not in conteudo_completo:
        return conteudo_completo
    
    # Retorna apenas a primeira parte
    return conteudo_completo.split(separador)[0].strip()

def get_ds_observacao2(nr_atendimento):
    """Retorna apenas a segunda receita"""
    query = """
    SELECT ds_observacao FROM oft_conduta WHERE nr_seq_consulta = (SELECT nr_sequencia FROM oft_consulta WHERE nr_atendimento = :nr_atendimento AND ROWNUM = 1)
    """
    result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
    if not result or not result[0][0]:
        return ""
    
    conteudo_completo = result[0][0]
    separador = "###SEGUNDA_RECEITA###"
    
    # Se não tem o separador, não há segunda receita
    if separador not in conteudo_completo:
        return ""
    
    # Retorna apenas a segunda parte
    partes = conteudo_completo.split(separador)
    return partes[1].strip() if len(partes) > 1 else ""

def separar_receitas(conteudo_completo):
    """
    Função auxiliar para separar as duas receitas
    Retorna tupla (receita1, receita2)
    """
    separador = "###SEGUNDA_RECEITA###"
    
    if not conteudo_completo:
        return ("", "")
    
    if separador not in conteudo_completo:
        return (conteudo_completo, "")
    
    partes = conteudo_completo.split(separador)
    return (partes[0].strip(), partes[1].strip() if len(partes) > 1 else "")