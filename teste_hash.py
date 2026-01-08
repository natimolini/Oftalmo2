from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

senha = "senhasenha"
senha_hashed = pwd_context.hash(senha)
print(senha_hashed)