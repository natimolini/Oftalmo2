# Prontuário OftalmoClinicas

## Requisitos

### Python 3.10.8
- Pode ser baixado para Windows em https://www.python.org/downloads/release/python-3108/
- Para Linux, recomenda-se instalar via compilação manual para evitar conflitos com o Python do sistema.  
  Utilize o comando `make altinstall` após compilar, assim o Python será instalado como `python3.10` e não substituirá o Python padrão do sistema.  
  Exemplo de instalação no Ubuntu:
  ```sh
  sudo apt update
  sudo apt install -y build-essential libssl-dev zlib1g-dev libncurses5-dev libncursesw5-dev libreadline-dev libsqlite3-dev libgdbm-dev libdb5.3-dev libbz2-dev libexpat1-dev liblzma-dev tk-dev wget
  wget https://www.python.org/ftp/python/3.10.8/Python-3.10.8.tgz
  tar -xf Python-3.10.8.tgz
  cd Python-3.10.8
  ./configure --enable-optimizations
  make -j$(nproc)
  sudo make altinstall
  python3.10 --version
  ```

### Banco de dados Oracle
- Endereço para baixar o "Oracle Instant Client": https://www.oracle.com/br/database/technologies/instant-client/downloads.html
- O "Oracle Instant Client" deve ser descompactado e colocado na pasta:
  - `C:\Oracle\` (Windows)
  - `/opt/oracle/` (Linux)
- O caminho para o "Oracle Instant Client" está configurado no arquivo `oracle_connection.py`, na função `_initialize_oracle_client`.

### PostgreSQL
- O arquivo `auth.py` contém as configurações para o banco de dados PostgreSQL. Atualize conforme necessário para uso local ou outras configurações.

## Instalação

1. **Clone o repositório:**
   ```sh
   git clone git@192.168.10.16:/usr/local/git/APIs/OftalmoClinicas/GA0082-ProntuarioOftalmoClinicas.git/
   cd GA0082-ProntuarioOftalmoClinicas
   ```

2. **Crie e ative um ambiente virtual (opcional):**
   ```sh
   python -m venv venv
   source venv/bin/activate   # Linux/Mac
   venv\Scripts\activate      # Windows
   ```

3. **Instale as dependências:**
   ```sh
   pip install -r requirements.txt
   ```

4. **Configuração do banco de dados:**
   - Configure as variáveis de ambiente ou arquivos de configuração para acesso ao Oracle/PostgreSQL conforme necessário.
   - Certifique-se de que o banco de dados está acessível e populado com as tabelas necessárias.

5. **Executando o sistema:**
   ```sh
   uvicorn app.main:app --reload
   ```
   - O sistema estará disponível em `http://localhost:8000`.

## Estrutura do projeto

- `app/` - Código principal da aplicação
  - `oracledb/` - Conexões e queries do Oracle
  - `postgresql/` - Conexões e queries do PostgreSQL
  - `static/` - Arquivos estáticos (JavaScript, CSS, imagens)
  - `templates/` - Templates HTML
  - `templates_impressao/` - Templates de impressão

## Solução de problemas comuns

-**Erro de conexão com Oracle no Linux (DPI-1047 / libaio.so.1)**
Em sistemas Linux recentes (como Ubuntu 24.04+), a configuração do Oracle Instant Client requer passos adicionais devido a mudanças em pacotes do sistema. Se encontrar o erro DPI-1047, especialmente mencionando libaio.so.1, siga estes passos:

1. Configure o Reconhecimento do Client pelo Sistema Crie um arquivo de configuração para que o sistema saiba onde encontrar as bibliotecas do Oracle. (Substitua instantclient_23_9 pelo nome da sua pasta).

Bash

echo '/opt/oracle/instantclient_23_9' | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
2. Instale a Dependência libaio Confirme que a biblioteca correta está instalada, conforme a seção de Requisitos.

Bash

# Para Ubuntu 24.04+
sudo apt install libaio1t64
3. Corrija a Incompatibilidade de Nomes (Passo Crucial) O pacote libaio1t64 instala a biblioteca como libaio.so.1t64, mas o Oracle Client procura pelo nome antigo libaio.so.1. Crie um "apelido" (link simbólico) para resolver isso:

Bash

# 1. Crie o link que aponta do nome antigo para o novo
sudo ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1

# 2. Atualize o cache do sistema para que ele reconheça o novo link
sudo ldconfig
Após esses passos, reinicie a aplicação.

- **Erro de conexão com Oracle**: Verifique se o Oracle Instant Client está corretamente instalado e configurado.
- **Problemas com versões do Python no Linux**: Sempre utilize `make altinstall` ao compilar manualmente para evitar conflitos com o Python do sistema.

## Observações

- Para desenvolvimento front-end, os arquivos estão em `app/static/` e `app/templates/`.

## Suporte

Em caso de dúvidas, consulte os desenvolvedores da GHR.
- E-mails:
  - Renan Leonardo das Neves <renanneves@ghr.com.br>
  - Natalia Molini Buffa <nataliamolini@ghr.com.br>



sudo apt-get update
sudo apt-get install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    python3-cffi \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info