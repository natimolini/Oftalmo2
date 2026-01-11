from passlib.context import CryptContext
import asyncpg

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PG_CONFIG = {
    "user": "postgres",
    "password": "@GhrB$2024#",
    "database": "prontuario_oftalmo_prod",
    "host": "localhost",
    'port': 5432
}

async def get_db_connection():
    return await asyncpg.connect(**PG_CONFIG)

async def authenticate_user(usuario: str, senha: str):
    conn = await get_db_connection()
    try:
        query = "SELECT senha, cd_pessoa_fisica, cd_tipo_usuario FROM usuario WHERE usuario = $1"
        record = await conn.fetchrow(query, usuario)

        if not record:
            return None
        
        hashed_password = record["senha"]
        if not pwd_context.verify(senha, hashed_password):
            return None
        
        return {"usuario": usuario, "cd_pessoa_fisica": record["cd_pessoa_fisica"], "cd_tipo_usuario": record["cd_tipo_usuario"]}
    finally:
        await conn.close()
