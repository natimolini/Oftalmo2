import asyncpg
from datetime import datetime
from typing import Optional, Dict, List

async def get_db_connection():
    """Obtém conexão com o PostgreSQL"""
    return await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='@GhrB$2024#',
        database='prontuario_oftalmo_prod'
    )

async def criar_prontuario_especial(
    cd_pessoa_fisica: int,
    nm_paciente: str,
    cd_medico: int,
    nm_medico: str,
    nm_usuario: str,
    ds_anamnese: Optional[str] = None,
    ds_conduta: Optional[str] = None,
    ds_observacao: Optional[str] = None,
    ds_observacao2: Optional[str] = None
) -> int:
    """
    Cria um novo prontuário especial e retorna o código gerado (agora é BIGINT)
    """
    conn = await get_db_connection()
    try:
        query = """
            INSERT INTO prontuario_especial (
                cd_pessoa_fisica,
                nm_paciente,
                cd_medico,
                nm_medico,
                ds_anamnese,
                ds_conduta,
                ds_observacao,
                ds_observacao2,
                nm_usuario_criacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING cd_prontuario_especial
        """
        
        cd_prontuario = await conn.fetchval(
            query,
            cd_pessoa_fisica,
            nm_paciente,
            cd_medico,
            nm_medico,
            ds_anamnese,
            ds_conduta,
            ds_observacao,
            ds_observacao2,
            nm_usuario
        )
        
        return cd_prontuario
    finally:
        await conn.close()

async def atualizar_prontuario_especial(
    cd_prontuario_especial: int,
    nm_usuario: str,
    ds_anamnese: Optional[str] = None,
    ds_conduta: Optional[str] = None,
    ds_observacao: Optional[str] = None,
    ds_observacao2: Optional[str] = None
) -> bool:
    """
    Atualiza um prontuário especial existente
    """
    conn = await get_db_connection()
    try:
        query = """
            UPDATE prontuario_especial
            SET ds_anamnese = $2,
                ds_conduta = $3,
                ds_observacao = $4,
                ds_observacao2 = $5,
                nm_usuario_atualizacao = $6
            WHERE cd_prontuario_especial = $1
        """
        
        result = await conn.execute(
            query,
            cd_prontuario_especial,
            ds_anamnese,
            ds_conduta,
            ds_observacao,
            ds_observacao2,
            nm_usuario
        )
        
        return result == "UPDATE 1"
    finally:
        await conn.close()

async def buscar_prontuario_especial(cd_prontuario_especial: int) -> Optional[Dict]:
    """
    Busca um prontuário especial pelo código
    """
    conn = await get_db_connection()
    try:
        query = """
            SELECT 
                cd_prontuario_especial,
                cd_pessoa_fisica,
                nm_paciente,
                cd_medico,
                nm_medico,
                ds_anamnese,
                ds_conduta,
                ds_observacao,
                ds_observacao2,
                TO_CHAR(dt_registro, 'DD/MM/YYYY HH24:MI') as dt_registro,
                nm_usuario_criacao,
                nm_usuario_atualizacao
            FROM prontuario_especial
            WHERE cd_prontuario_especial = $1
            AND ie_ativo = 'S'
        """
        
        row = await conn.fetchrow(query, cd_prontuario_especial)
        
        if row:
            return dict(row)
        return None
    finally:
        await conn.close()

async def listar_prontuarios_especiais_paciente(cd_pessoa_fisica: int) -> List[Dict]:
    """
    Lista todos os prontuários especiais de um paciente
    """
    conn = await get_db_connection()
    try:
        query = """
            SELECT 
                cd_prontuario_especial,
                TO_CHAR(dt_registro, 'DD/MM/YYYY') as data_consulta,
                TO_CHAR(dt_registro, 'DD/MM/YYYY HH24:MI') as data_completa,
                nm_medico,
                ds_anamnese,
                ds_conduta,
                ds_observacao,
                ds_observacao2
            FROM prontuario_especial
            WHERE cd_pessoa_fisica = $1
            AND ie_ativo = 'S'
            ORDER BY dt_registro DESC
        """
        
        rows = await conn.fetch(query, cd_pessoa_fisica)
        return [dict(row) for row in rows]
    finally:
        await conn.close()

async def inativar_prontuario_especial(
    cd_prontuario_especial: int,
    nm_usuario: str
) -> bool:
    """
    Inativa (soft delete) um prontuário especial
    """
    conn = await get_db_connection()
    try:
        query = """
            UPDATE prontuario_especial
            SET 
                ie_ativo = 'N',
                nm_usuario_atualizacao = $2
            WHERE cd_prontuario_especial = $1
            AND ie_ativo = 'S'
        """
        
        result = await conn.execute(query, cd_prontuario_especial, nm_usuario)
        return result == "UPDATE 1"
    finally:
        await conn.close()

async def buscar_todos_pacientes(termo_busca: str, limite: int = 50) -> List[Dict]:
    """
    Busca pacientes por nome (sem filtro de atendimento)
    Retorna até 'limite' resultados
    """
    from app.oracledb.oracle_connection import OracleConnection
    
    oraconn = OracleConnection(
        'ghrprontuario', 
        'Xy7#kT2@', 
        '10.250.250.2', 
        '1521', 
        'dbprod.oftalmocuritiba.com.br'
    )
    
    query = f"""
        SELECT * FROM (
            SELECT 
                pf.cd_pessoa_fisica,
                pf.nm_pessoa_fisica,
                TO_CHAR(pf.dt_nascimento, 'DD/MM/YYYY') as dt_nascimento,
                pf.nr_cpf,
                (SELECT MAX(nr_atendimento) 
                 FROM atendimento_paciente ap 
                 WHERE ap.cd_pessoa_fisica = pf.cd_pessoa_fisica) as ultimo_atendimento
            FROM pessoa_fisica pf
            WHERE UPPER(pf.nm_pessoa_fisica) LIKE UPPER(:termo_busca || '%')
        ) WHERE ROWNUM <= :limite
        ORDER BY nm_pessoa_fisica
    """
    
    results = oraconn.execute_select(query, {
        'termo_busca': termo_busca,
        'limite': limite
    })
    
    pacientes = []
    for row in results:
        pacientes.append({
            'cd_pessoa_fisica': row[0],
            'nm_pessoa_fisica': row[1],
            'dt_nascimento': row[2],
            'nr_cpf': row[3],
            'ultimo_atendimento': row[4]
        })
    
    return pacientes

async def buscar_pacientes_por_nascimento(data_nascimento: str, limite: int = 50) -> List[Dict]:
    """
    Busca pacientes por data de nascimento (DD/MM/YYYY)
    """
    from app.oracledb.oracle_connection import OracleConnection
    
    oraconn = OracleConnection(
        'ghrprontuario', 
        'Xy7#kT2@', 
        '10.250.250.2', 
        '1521', 
        'dbprod.oftalmocuritiba.com.br'
    )
    
    query = f"""
        SELECT * FROM (
            SELECT 
                pf.cd_pessoa_fisica,
                pf.nm_pessoa_fisica,
                TO_CHAR(pf.dt_nascimento, 'DD/MM/YYYY') as dt_nascimento,
                pf.nr_cpf,
                (SELECT MAX(nr_atendimento) 
                 FROM atendimento_paciente ap 
                 WHERE ap.cd_pessoa_fisica = pf.cd_pessoa_fisica) as ultimo_atendimento
            FROM pessoa_fisica pf
            WHERE TO_CHAR(pf.dt_nascimento, 'DD/MM/YYYY') = :data_nascimento
            ORDER BY pf.nm_pessoa_fisica
        ) WHERE ROWNUM <= :limite
    """
    
    results = oraconn.execute_select(query, {
        'data_nascimento': data_nascimento,
        'limite': limite
    })
    
    pacientes = []
    for row in results:
        pacientes.append({
            'cd_pessoa_fisica': row[0],
            'nm_pessoa_fisica': row[1],
            'dt_nascimento': row[2],
            'nr_cpf': row[3],
            'ultimo_atendimento': row[4]
        })
    
    return pacientes