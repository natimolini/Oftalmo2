import json
from fastapi import FastAPI, Request, HTTPException, Form, Depends, Query, Body
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse, StreamingResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from typing import Optional, List
import pdfkit
import locale
import time
import logging
from io import BytesIO
import traceback

# Imports específicos do projeto
from app.oracledb.get_dados.get_agenda import oraconn
from app.oracledb.get_dados.get_summary import PatientSummary
from app.oracledb.get_dados import (
    get_exams, get_medico, get_agenda, get_prontuario, get_status_consulta, 
    get_ultima_refracao, get_dt_consultas_anteriores, get_summary, get_evolucao, 
    get_diagnostico, get_cirurgia, get_lentes_contato, get_lentes, get_refracao,
    get_anamnese, get_acuidade_visual, get_pressao, get_conduta, 
    get_estatisticas, get_fim_consulta
)
from app.oracledb.get_dados.get_prontuario import get_consultas_antigas as get_consultas_antigas_prontuario, get_consultas_por_paciente
from app.oracledb.get_dados.get_prontuario import get_consultas_antigas_alergia

from app.oracledb.insert_update_dados import receita
from app.templates_impressao import impressao_dados_evolucao, impressao_dados_resumo
from app.oracledb.insert_update_dados import (
    anamnese, refracao, oculos, acuidade_visual, 
    pressao, diagnostico, conduta, receita, consulta
)
from app.auth import authenticate_user, get_db_connection
from app.oracledb.insert_update_dados import cirurgia
from app.oracledb.get_dados import get_cirurgias
from app.postgresql import prontuario_especial
from app.oracledb.oracle_connection import OracleConnection


logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "192.168.0.23"])
app.add_middleware(SessionMiddleware, secret_key="chave_secreta")

@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/")
async def root():
    return RedirectResponse(url="/login")

@app.post("/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
):
    user = await authenticate_user(username, password)
    if not user:
        return JSONResponse(
            content={"status": "error", "message": "Credenciais inválidas. Tente novamente."},
            status_code=400,
        )
    
    request.session["cd_pessoa_fisica"] = user["cd_pessoa_fisica"]
    request.session["cd_tipo_usuario"] = user["cd_tipo_usuario"]
    request.session["nm_usuario"] = user["usuario"]

    nm_guerra = get_medico.get_nm_guerra(user["cd_pessoa_fisica"])
    request.session["nm_guerra"] = nm_guerra

    return RedirectResponse("/agenda", status_code=302)

@app.get("/agenda")
async def agenda(request: Request):
    cd_pessoa_fisica = request.session.get("cd_pessoa_fisica")
    cd_tipo_usuario = request.session.get("cd_tipo_usuario")
    nm_guerra = request.session.get("nm_guerra")

    if not cd_pessoa_fisica or not cd_tipo_usuario:
        return RedirectResponse("/login", status_code=302)

    data_agenda = get_agenda.get_dados_agenda(cd_pessoa_fisica, datetime.now().strftime("%Y-%m-%d"))
    ds_aviso = get_agenda.get_aviso(cd_pessoa_fisica)

    return templates.TemplateResponse("agenda.html", {
        "request": request,
        "cd_pessoa_fisica": cd_pessoa_fisica,
        "cd_tipo_usuario": cd_tipo_usuario,
        "nm_guerra": nm_guerra,
        "data_agenda": data_agenda,
        "ds_aviso": ds_aviso
    })

@app.get("/get_agenda_data")
async def get_agenda_data_route(request: Request, data: str = Query(None)):
    cd_pessoa_fisica = request.session.get("cd_pessoa_fisica")
    if not cd_pessoa_fisica:
        return JSONResponse(content={"error": "Usuário não autenticado"}, status_code=401)

    if not data:
        data = datetime.now().strftime("%Y-%m-%d")

    resultados = get_agenda.get_dados_agenda(cd_pessoa_fisica, data)

    total_agendamentos = sum(1 for item in resultados if item[2] != "Livre")
    total_atendidos = sum(1 for item in resultados if item[2].strip() == "Atendido" or item[2].strip() == "Executada")

    return JSONResponse(content={
        "data": resultados,
        "total_agendamentos": total_agendamentos,
        "total_atendidos": total_atendidos
    })

#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/buscar_paciente")
async def buscar_paciente(search_term: str = Query(None)):
    if not search_term:
        return JSONResponse(content=[], status_code=200)
    
    query = """
    SELECT * FROM (
        SELECT DISTINCT
            pf.cd_pessoa_fisica,
            pf.nm_pessoa_fisica,
            ap.nr_atendimento,
            c.ds_convenio
        FROM pessoa_fisica pf
        INNER JOIN atendimento_paciente ap ON ap.cd_pessoa_fisica = pf.cd_pessoa_fisica
        INNER JOIN agenda_consulta ac ON ac.nr_atendimento = ap.nr_atendimento
        INNER JOIN agenda a ON a.cd_agenda = ac.cd_agenda
        LEFT JOIN convenio c ON c.cd_convenio = ac.cd_convenio
        WHERE UPPER(pf.nm_pessoa_fisica) LIKE UPPER(:search_term || '%')
        AND ap.nr_atendimento IS NOT NULL
        AND a.cd_especialidade = 18
        AND ac.nr_seq_oftalmo IS NOT NULL
        ORDER BY pf.nm_pessoa_fisica
    ) WHERE ROWNUM <= 15
    """

    results = oraconn.execute_select(query, {'search_term': search_term})
    return JSONResponse(content=results)


#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/queixas-principais")
async def get_queixas_principais(search: str = ""):
    try:
        conn = await get_db_connection()
        
        query = """
            SELECT cd_queixa_principal, ds_queixa_principal 
            FROM queixa_principal 
            WHERE ds_queixa_principal ILIKE $1
            ORDER BY ds_queixa_principal
        """
        
        results = await conn.fetch(query, f'%{search}%')
        await conn.close()
        
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Erro ao buscar queixas principais: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar queixas principais: {str(e)}")

@app.get("/api/observacao-oculos")
async def get_observacao_oculos(search: str = ""):
    try:
        conn = await get_db_connection()
        
        query = """
            SELECT cd_observacao, ds_observacao 
            FROM oculos_observacao 
            WHERE ds_observacao ILIKE $1
            ORDER BY ds_observacao
        """
        
        results = await conn.fetch(query, f'%{search}%')
        await conn.close()
        
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Erro ao buscar observações de óculos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/acuidade-templates")
async def get_acuidade_templates(search: str = ""):
    try:
        conn = await get_db_connection()
        
        query = """
            SELECT cd_acuidade_visual, ds_acuidade_visual 
            FROM av_od_oe 
            WHERE ds_acuidade_visual ILIKE $1
            ORDER BY ds_acuidade_visual
        """
        
        results = await conn.fetch(query, f'%{search}%')
        await conn.close()
        
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Erro ao buscar templates de acuidade: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/diagnostico-templates")
async def get_diagnostico_templates(search: str = ""):
    query = """
        SELECT cd_diagnosticos, ds_diagnosticos
        FROM diagnosticos 
        WHERE ds_diagnosticos ILIKE $1
        ORDER BY ds_diagnosticos
    """
    try:
        conn = await get_db_connection()
        
        results = await conn.fetch(query, f'%{search}%')
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Erro ao buscar diagnósticos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/cirurgias-templates")
async def get_cirurgias_templates(search: str = ""):
    try:
        conn = await get_db_connection()
        query = """
            SELECT cd_cirurgia, ds_cirurgia
            FROM cirurgia
            WHERE ds_cirurgia ILIKE $1
            ORDER BY ds_cirurgia
        """
        results = await conn.fetch(query, f'%{search}%')
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
    

#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/search-packages")
async def search_packages(term: str = Query(..., min_length=3)):
    try:
        conn = await get_db_connection()
        query = """
            SELECT cd_pacote, ds_pacote 
            FROM pacotes 
            WHERE cd_pacote IN ('116', '117', '119', '108', '106', '101') AND UPPER(cd_pacote) LIKE UPPER($1) 
            OR UPPER(ds_pacote) LIKE UPPER($1)
        """
        results = await conn.fetch(query, f'%{term}%')
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/package-exams/{package_code}")
async def get_package_exams(package_code: str):
    try:
        conn = await get_db_connection()
        query = """
            SELECT e.cd_exame, e.ds_exame
            FROM pacotes_exames pe
            JOIN exames e ON pe.cd_exame = e.cd_exame 
            WHERE pe.cd_pacote = $1
        """
        results = await conn.fetch(query, package_code)
        await conn.close()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/list-exams")
async def list_exams():
    try:
        conn = await get_db_connection()
        query = """
            SELECT cd_exame, ds_exame 
            FROM exames 
            ORDER BY ds_exame
        """
        results = await conn.fetch(query)
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.post("/transfer-exams")
async def transfer_exams(request: Request, exams: List[dict] = Body(...)):
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        nm_usuario = request.session.get("nm_usuario")
        
        formatted_exams = "\n".join([
            f"{exam['examCode']} - {exam['examName']} ({exam['quantity']}x)" 
            for exam in exams
        ])
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Exames transferidos com sucesso!",
                "formatted_exams": formatted_exams
            },
            status_code=200
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao transferir exames: {str(e)}"
        )

#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/search-medications")
async def search_medications(term: str = Query(..., min_length=3)):
    try:
        conn = await get_db_connection()
        query = """
            SELECT 
                cd_medicamento, 
                ds_medicamento, 
                ds_posologia
            FROM 
                receituario 
            WHERE 
                UPPER(ds_medicamento) LIKE UPPER($1) 
                OR UPPER(ds_posologia) LIKE UPPER($1)
            ORDER BY 
                ds_medicamento
        """
        results = await conn.fetch(query, f'%{term}%')
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

#TODO SEPARAR A QUERY DE ACORDO COM ORGANIZAÇÃO DO COD
@app.get("/api/medications")
async def get_all_medications():
    try:
        conn = await get_db_connection()
        query = """
            SELECT 
                r.cd_medicamento, 
                r.ds_medicamento, 
                r.ds_posologia,
                t.ds_uso_medicamento 
            FROM 
                receituario r
            LEFT JOIN 
                tipo_uso_medicamento t ON t.cd_uso_medicamento = r.cd_uso_medicamento
            ORDER BY 
                r.ds_medicamento;
        """
        results = await conn.fetch(query)
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Error fetching medications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/all-packages")
async def get_all_packages():
    try:
        conn = await get_db_connection()
        query = """
            SELECT cd_pacote, ds_pacote 
            FROM pacotes 
            ORDER BY ds_pacote
        """
        results = await conn.fetch(query)
        await conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/api/diagnosticos/{nr_atendimento}")
async def get_diagnosticos(nr_atendimento: int):
    try:
        ds_diagnosticos = get_diagnostico.get_all_ds_diagnostico(nr_atendimento)
        return JSONResponse(content={"ds_diagnosticos": ds_diagnosticos})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/prontuario/{nr_atendimento}/resumo")
async def exibir_resumo(
    request: Request,
    nr_atendimento: int,
    cd_pessoa_fisica: str = Query(..., description="CD_PESSOA_FISICA do paciente")
):
    cd_medico = request.session.get("cd_pessoa_fisica")
    
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)

    if not cd_pessoa_fisica:
        return JSONResponse(content={"error": "cd_pessoa_fisica não fornecido"}, status_code=400)

    dados_paciente = get_prontuario.get_dados_paciente(nr_atendimento)
    if not dados_paciente:
        return JSONResponse(content={"error": "Dados do paciente não encontrados"}, status_code=404)

    nm_paciente, idade_paciente, profissao, convenio, ultima_consulta, sexo, nr_sequencia_ultima_consulta, cpf, nascimento, cd_pessoa_fisica = dados_paciente

    summary = PatientSummary()
    consultations = summary.get_consultation_history(cd_pessoa_fisica)

    return templates.TemplateResponse("resumo.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nr_atendimento": nr_atendimento,
        "nm_paciente": nm_paciente,
        "idade_paciente": idade_paciente,
        "sexo": sexo,
        "cpf": cpf,
        "nascimento":nascimento,
        "profissao": profissao,
        "convenio": convenio,
        "consultations": consultations,
        "section": "resumo" 
    })


@app.get("/api/evolucao/{nr_atendimento}")
async def get_evolucao_data_route(request: Request, nr_atendimento: int):
    # Check if user is authenticated
    cd_medico = request.session.get("cd_pessoa_fisica")
    if not cd_medico:
        return JSONResponse(
            content={"error": "Usuário não autenticado"},
            status_code=401
        )

    try:
        # Get evolution data for this appointment
        evolucao_data = get_evolucao.get_evolucao_data(nr_atendimento)
        
        if not evolucao_data:
            return JSONResponse(
                content={"error": "Dados não encontrados"},
                status_code=404
            )

        # Return the data as JSON
        return JSONResponse(content=evolucao_data)

    except Exception as e:
        logger.error(f"Error fetching evolution data: {str(e)}")
        return JSONResponse(
            content={"error": "Erro ao buscar dados da evolução"},
            status_code=500
        )

@app.get('/prontuario/{nr_atendimento}', response_class=HTMLResponse)
async def exibir_prontuario(nr_atendimento: int, request: Request):
    cd_medico = request.session.get("cd_pessoa_fisica")
    nm_guerra = request.session.get("nm_guerra")
    nm_usuario = request.session.get("nm_usuario")
    cd_pessoa_fisica = request.query_params.get('cd_pessoa_fisica')
    data_agenda = request.query_params.get('data_agenda')

    # Buscar a data do atendimento do banco se não vier na URL
    if not data_agenda:
        from app.oracledb.get_dados.get_agenda import oraconn
        query = """
            SELECT TO_CHAR(ac.dt_agenda, 'YYYY-MM-DD') as data_agenda
            FROM agenda_consulta ac
            WHERE ac.nr_atendimento = :nr_atendimento
        """
        result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
        if result and result[0][0]:
            data_agenda = result[0][0]

    formatted_date = ""
    if data_agenda:
        try:
            from datetime import datetime
            date_obj = datetime.strptime(data_agenda, "%Y-%m-%d")
            formatted_date = date_obj.strftime("%d/%m/%Y")
        except:
            formatted_date = ""

    if not cd_medico:
        return RedirectResponse("/login", status_code=302)
    
    if not cd_pessoa_fisica:
        return JSONResponse(content={"message": "cd_pessoa_fisica não fornecido"}, status_code=400)
    
    nr_seq_consulta = get_prontuario.get_dados_paciente(nr_atendimento)
    if not nr_seq_consulta:
        return JSONResponse(content={"message": "A recepção deve gerar OFTALMOLOGIA para esse horário"}, status_code=404)

    dados_paciente = get_prontuario.get_dados_paciente(nr_atendimento)
    if not dados_paciente:
        return JSONResponse(content={"message": "Dados do paciente não encontrados"}, status_code=404)
    
    nm_paciente, idade_paciente, profissao, convenio, ultima_consulta, sexo, nr_sequencia_ultima_consulta, cpf, nascimento, cd_pessoa_fisica = dados_paciente
    
    dt_fim_consulta = get_fim_consulta.get_dt_fim_consulta(nr_atendimento)
    fim_consulta = dt_fim_consulta.strftime("%d/%m/%Y %H:%M") if dt_fim_consulta else None

    section = "oculos"

    return templates.TemplateResponse("prontuario.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nm_guerra": nm_guerra,
        "data_agenda": formatted_date,  # Sempre terá um valor agora
        "nm_usuario": nm_usuario,
        "cd_pessoa_fisica": cd_pessoa_fisica,
        "nr_seq_consulta": nr_seq_consulta,
        "nr_atendimento": nr_atendimento,
        "nm_paciente": nm_paciente,
        "idade_paciente": idade_paciente,
        "profissao": profissao,
        "convenio": convenio,
        "sexo": sexo,
        "cpf": cpf,
        "nascimento": nascimento,
        "section": section,
        "fim_consulta": fim_consulta,
        "loading_secondary_data": True  # Nova flag para indicar carregamento assíncrono
    })


@app.get("/api/prontuario/dados-secundarios/{nr_atendimento}")
async def carregar_dados_secundarios(request: Request, nr_atendimento: int):
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        cd_pessoa_fisica = request.query_params.get('cd_pessoa_fisica')
        
        if not cd_medico or not cd_pessoa_fisica:
            return JSONResponse(
                content={"error": "Dados da sessão não encontrados"},
                status_code=401
            )
        
        # Carregar dados não essenciais de forma assíncrona
        resultados = get_dt_consultas_anteriores.get_dt_ultimas_consultas(cd_medico, cd_pessoa_fisica)
        
        # Função auxiliar para verificar se consulta tem dados
        def consulta_tem_dados(nr_atend):
            try:
                # Buscar dados da evolução
                evolucao = get_evolucao.get_evolucao_data(nr_atend)
                
                if not evolucao:
                    return False
                
                # Campos a verificar
                campos_verificar = [
                    evolucao.get('queixa', ''),
                    evolucao.get('refracao', ''),
                    evolucao.get('acuidade', ''),
                    evolucao.get('pressao', ''),
                    evolucao.get('diagnostico', ''),
                    evolucao.get('conduta', ''),
                    evolucao.get('exames', ''),
                    evolucao.get('ds_lentes_contato', '')
                ]
                
                # Verifica se pelo menos um campo tem conteúdo
                for campo in campos_verificar:
                    if campo and str(campo).strip() and str(campo).strip().upper() != 'N/A':
                        return True
                
                return False
                
            except Exception as e:
                print(f"Erro ao verificar dados da consulta {nr_atend}: {e}")
                return False
        
        # Filtrar apenas consultas com dados
        dt_consultas_anteriores = []
        nr_atendimento_consultas_anteriores = []
        cd_pessoa_fisica_consulta = []
        
        for row in resultados:
            dt = row[0]
            nr_atend = row[1]
            cd_pessoa = row[2];
            
            # Verificar se a data é válida e se a consulta tem dados
            if isinstance(dt, datetime) and consulta_tem_dados(nr_atend):
                dt_consultas_anteriores.append(dt.strftime("%d/%m/%Y"))
                nr_atendimento_consultas_anteriores.append(nr_atend)
                cd_pessoa_fisica_consulta.append(cd_pessoa)
        
        # Dados da evolução
        refracao = get_ultima_refracao.get_ultima_refracao(nr_atendimento)
        ds_anamnese = get_anamnese.get_ds_anamnese(nr_atendimento)
        ds_acuidade_visual = get_acuidade_visual.get_ds_acuidade_visual(nr_atendimento)
        ds_pressao = get_pressao.get_ds_pressao(nr_atendimento)
        ds_diagnostico = get_diagnostico.get_ds_diagnostico(nr_atendimento)
        ds_conduta = get_conduta.get_ds_conduta(nr_atendimento)
        ds_exames = get_exams.get_ds_exames(nr_atendimento)
        cirurgia = get_cirurgia.get_cirurgia(nr_atendimento)
        ds_oculos = get_refracao.get_ds_oculos(nr_atendimento)
        ds_lentes = get_lentes.get_ds_lentes(nr_atendimento)
        
        # Formatar dados de refração
        refraction_data = {}
        if refracao:
            (vl_od_pl_ard_esf, vl_od_pl_ard_cil, vl_od_pl_ard_eixo,
             vl_oe_pl_ard_esf, vl_oe_pl_ard_cil, vl_oe_pl_ard_eixo,
             vl_adicao, ds_observacao) = refracao
            
            refraction_data = {
                'vl_od_pl_ard_esf': vl_od_pl_ard_esf,
                'vl_od_pl_ard_cil': vl_od_pl_ard_cil,
                'vl_od_pl_ard_eixo': vl_od_pl_ard_eixo,
                'vl_oe_pl_ard_esf': vl_oe_pl_ard_esf, 
                'vl_oe_pl_ard_cil': vl_oe_pl_ard_cil,
                'vl_oe_pl_ard_eixo': vl_oe_pl_ard_eixo,
                'vl_adicao': vl_adicao,
                'ds_observacao': ds_observacao
            }
        
        # Preparar dados de consultas anteriores
        consultas_anteriores = []
        for i in range(len(dt_consultas_anteriores)):
            consultas_anteriores.append({
                "data": dt_consultas_anteriores[i],
                "nr_atendimento": nr_atendimento_consultas_anteriores[i],
                "cd_pessoa_fisica": cd_pessoa_fisica_consulta[i]
            })
        
        # Retornar todos os dados secundários
        dados = {
            "consultas_anteriores": consultas_anteriores,
            "refracao": refraction_data,
            "ds_anamnese": ds_anamnese,
            "ds_acuidade_visual": ds_acuidade_visual,
            "ds_pressao": ds_pressao,
            "ds_diagnostico": ds_diagnostico,
            "ds_conduta": ds_conduta,
            "ds_exames": ds_exames,
            "cirurgia": cirurgia,
            "ds_oculos": ds_oculos,
            "ds_lentes_contato": ds_lentes
        }
        return JSONResponse(content=dados)
        
    except Exception as e:
        logger.error(f"Erro ao carregar dados secundários: {str(e)}")
        return JSONResponse(
            content={"error": f"Erro ao carregar dados: {str(e)}"},
            status_code=500
        )



@app.get("/prontuario/{nr_atendimento}/oculos", response_class=HTMLResponse)
async def exibir_receituario(nr_atendimento: int, request: Request):
    cd_medico = request.session.get("cd_pessoa_fisica")
    
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)
    
    refracao = get_ultima_refracao.get_ultima_refracao(nr_atendimento)

    if refracao:
        (vl_od_pl_ard_esf, vl_od_pl_ard_cil, vl_od_pl_ard_eixo,
         vl_oe_pl_ard_esf, vl_oe_pl_ard_cil, vl_oe_pl_ard_eixo,
         vl_adicao, ds_observacao) = refracao
    else:
        vl_od_pl_ard_esf = vl_od_pl_ard_cil = vl_od_pl_ard_eixo = ""
        vl_oe_pl_ard_esf = vl_oe_pl_ard_cil = vl_oe_pl_ard_eixo = ""
        vl_adicao = ""
        ds_observacao = ""

    return templates.TemplateResponse("oculos.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nr_atendimento": nr_atendimento,
        'vl_od_pl_ard_esf': vl_od_pl_ard_esf, 
        'vl_od_pl_ard_cil': vl_od_pl_ard_cil,
        'vl_od_pl_ard_eixo': vl_od_pl_ard_eixo, 
        'vl_oe_pl_ard_esf': vl_oe_pl_ard_esf, 
        'vl_oe_pl_ard_cil': vl_oe_pl_ard_cil,
        'vl_oe_pl_ard_eixo': vl_oe_pl_ard_eixo,
        'vl_adicao': vl_adicao, 
        'ds_observacao': ds_observacao,
    })

@app.get("/prontuario/{nr_atendimento}/receituario", response_class=HTMLResponse)
async def exibir_receituario(nr_atendimento: int, request: Request):
    cd_medico = request.session.get("cd_pessoa_fisica")
    
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)

    return templates.TemplateResponse("receituario.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nr_atendimento": nr_atendimento,
    })

@app.get("/prontuario/{nr_atendimento}/exames", response_class=HTMLResponse)
async def exibir_exames(nr_atendimento: int, request: Request):
    cd_medico = request.session.get("cd_pessoa_fisica")
    
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)

    #exames = get_prontuario.get_exames_do_paciente(nr_atendimento)

    return templates.TemplateResponse("exames.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nr_atendimento": nr_atendimento
        #"exames": exames
    })

@app.get("/prontuario/{nr_atendimento}/resumo", response_class=HTMLResponse)
async def exibir_exames(nr_atendimento: int, request: Request):
    cd_medico = request.session.get("cd_pessoa_fisica")
    
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)

    #exames = get_prontuario.get_exames_do_paciente(nr_atendimento)  # Aqui você pode incluir a lógica para buscar os exames

    return templates.TemplateResponse("resumo.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nr_atendimento": nr_atendimento
        #"exames": exames
    })


@app.post("/salvar_rascunho_prontuario/{nr_atendimento}")
async def salvar_rascunho_prontuario(
    request: Request,
    nr_atendimento: int,
    ds_anamnese: str = Form(None),
    ds_refracao: str = Form(None),
    tipo_refracao: str = Form(None),
    ds_observacao_refracao: str = Form(None),
    vl_od_pl_ard_esf: str = Form(None),
    vl_od_pl_ard_cil: str = Form(None),
    vl_od_pl_ard_eixo: str = Form(None),
    vl_oe_pl_ard_esf: str = Form(None),
    vl_oe_pl_ard_cil: str = Form(None),
    vl_oe_pl_ard_eixo: str = Form(None),
    vl_adicao: str = Form(None),
    vl_od_pl_are_esf: str = Form(None),
    vl_od_pl_are_cil: str = Form(None),
    vl_od_pl_are_eixo: str = Form(None),
    vl_oe_pl_are_esf: str = Form(None),
    vl_oe_pl_are_cil: str = Form(None),
    vl_oe_pl_are_eixo: str = Form(None),
    ds_acuidade: str = Form(None),
    ds_tonometria: str = Form(None),
    ds_diagnostico: str = Form(None),
    ds_conduta: str = Form(None),
    ds_receita: str = Form(None),
    ds_exames: str = Form(None),
    ds_lentes_contato: str = Form(None),
    codigosExame: List[str] = Form([]),
    nomesExame: List[str] = Form([]),
    qtdExame: List[str] = Form([]),
    ds_cirurgias: str = Form(None)
):
    # --- 1. CONFIGURAÇÕES INICIAIS E SEGURANÇA ---
    cd_medico = request.session.get("cd_pessoa_fisica")
    nm_usuario = request.session.get("nm_usuario")

    if not cd_medico:
        return RedirectResponse("/login", status_code=302)

    # Função interna para converter strings de formulário em float
    def converter_valor(valor: str):
        try:
            if valor and valor.strip():
                return float(valor.replace(',', '.'))
            return None
        except ValueError:
            return None

    # Verifica se a consulta já foi liberada/finalizada
    if get_status_consulta.get_status_consulta(nr_atendimento):
        return JSONResponse(
            content={"status": "error", "mensagem": "Ação não autorizada: consulta já liberada."},
            status_code=400
        )

    # Atualiza status para 'em consulta' se necessário
    if not get_status_consulta.get_dt_consulta(nr_atendimento):
        get_status_consulta.update_status_em_consulta(nr_atendimento)

    try:
        # --- 2. ANAMNESE ---
        if ds_anamnese:
            res = anamnese.select_nr_seq_anamnese(nr_atendimento)
            if res:
                anamnese.update_anamnese(res[0][0], ds_anamnese, nm_usuario)
            else:
                anamnese.insert_anamnese(cd_medico, nr_atendimento, ds_anamnese, nm_usuario)

        # --- 3. REFRAÇÃO E ÓCULOS ---
        if ds_refracao:
            res_refr = refracao.select_nr_seq_refracao(nr_atendimento)
            ds_oculos = ""
            
            # Lógica de processamento de valores (Dinamica ou Estatica)
            if tipo_refracao == 'dinamica':
                v_od_esf = converter_valor(vl_od_pl_ard_esf)
                v_od_cil = converter_valor(vl_od_pl_ard_cil)
                v_oe_esf = converter_valor(vl_oe_pl_ard_esf)
                v_oe_cil = converter_valor(vl_oe_pl_ard_cil)
                v_add = converter_valor(vl_adicao)
                
                if res_refr:
                    refracao.update_refracao(res_refr[0][0], cd_medico, nr_atendimento, 'dinamica', v_od_esf, v_od_cil, vl_od_pl_ard_eixo, v_oe_esf, v_oe_cil, vl_oe_pl_ard_eixo, v_add, ds_observacao_refracao, nm_usuario)
                else:
                    refracao.insert_refracao(cd_medico, nr_atendimento, 'dinamica', v_od_esf, v_od_cil, vl_od_pl_ard_eixo, v_oe_esf, v_oe_cil, vl_oe_pl_ard_eixo, v_add, ds_observacao_refracao, nm_usuario)
            
            elif tipo_refracao == 'estatica':
                v_od_esf = converter_valor(vl_od_pl_are_esf)
                v_od_cil = converter_valor(vl_od_pl_are_cil)
                v_oe_esf = converter_valor(vl_oe_pl_are_esf)
                v_oe_cil = converter_valor(vl_oe_pl_are_cil)
                
                if res_refr:
                    refracao.update_refracao(res_refr[0][0], cd_medico, nr_atendimento, 'estatica', v_od_esf, v_od_cil, vl_od_pl_are_eixo, v_oe_esf, v_oe_cil, vl_oe_pl_are_eixo, None, ds_observacao_refracao, nm_usuario)
                else:
                    refracao.insert_refracao(cd_medico, nr_atendimento, 'estatica', v_od_esf, v_od_cil, vl_od_pl_are_eixo, v_oe_esf, v_oe_cil, vl_oe_pl_are_eixo, None, ds_observacao_refracao, nm_usuario)

        # --- 4. ACUIDADE E TONOMETRIA ---
        if ds_acuidade:
            res_ac = acuidade_visual.select_nr_seq_acuidade(nr_atendimento)
            if res_ac: acuidade_visual.update_acuidade(res_ac[0][0], ds_acuidade, nm_usuario)
            else: acuidade_visual.insert_acuidade(cd_medico, nr_atendimento, ds_acuidade, nm_usuario)
            
        if ds_tonometria:
            res_to = pressao.select_nr_seq_tonometria(nr_atendimento)
            if res_to: pressao.update_tonometria(res_to[0][0], ds_tonometria, nm_usuario)
            else: pressao.insert_tonometria(cd_medico, nr_atendimento, ds_tonometria, nm_usuario)

        # --- 5. DIAGNÓSTICO (Lógica inteligente do Código 2) ---
        if ds_diagnostico:
            if diagnostico.verificar_diagnostico_existe(nr_atendimento):
                diagnostico.update_diagnostico_medico(nr_atendimento, ds_diagnostico, nm_usuario)
                diagnostico.update_diagnostico_oft(nr_atendimento, ds_diagnostico, nm_usuario)
            else:
                for diag in ds_diagnostico.split('\n'):
                    if diag.strip():
                        diagnostico.insert_diagnostico(cd_medico, nr_atendimento, diag.strip(), nm_usuario)
                        time.sleep(0.1)

        # --- 6. CONDUTA E RECEITA (Área de Foco) ---
        if ds_conduta:
            res_co = conduta.select_nr_seq_conduta(nr_atendimento)
            if res_co: conduta.update_conduta(res_co[0][0], ds_conduta, nm_usuario)
            else: conduta.insert_conduta(cd_medico, nr_atendimento, ds_conduta, nm_usuario)

        if ds_receita:
            res_re = get_receita.select_nr_seq_receita(nr_atendimento)
            if res_re: receita.update_receita(res_re[0][0], ds_receita, nm_usuario)
            else: receita.insert_receita(nm_usuario, cd_medico, ds_receita, nr_atendimento)

        # --- 7. EXAMES E REPLICAÇÃO EXTERNA ---
        if ds_exames:
            res_ex = get_exams.select_nr_seq_exame(nr_atendimento)
            if res_ex:
                nr_seq_exame = res_ex[0][0]
                get_exams.update_exam(nr_seq_exame, ds_exames, nm_usuario)
                get_exams.deletar_exames_anteriores(nr_seq_exame)
            else:
                get_exams.insert_exam(cd_medico, nr_atendimento, nm_usuario)
                nr_seq_exame = get_exams.select_nr_seq_exame(nr_atendimento)[0][0]
                get_exams.update_exam(nr_seq_exame, ds_exames, nm_usuario)

            # Inserção de itens de exame
            for cod, qtd in zip(codigosExame, qtdExame):
                clean_cod = cod.replace('.','').replace('-','')
                if get_exams.verifica_cd_exame(clean_cod):
                    get_exams.insert_exam_item(nr_seq_exame, clean_cod, qtd, nm_usuario)

            # Replicação segura para oft_exame_externo (Extraído do Código 2)
            try:
                # Aqui entraria a sua lógica de oraconn.execute_update/insert
                pass 
            except Exception as e_ext:
                print(f"Aviso: Falha na replicação externa: {e_ext}")

        # --- 8. LENTES DE CONTATO E CIRURGIAS ---
        if ds_lentes_contato:
            res_lc_cons = get_lentes_contato.select_nr_seq_consulta(nr_atendimento)
            if res_lc_cons:
                nr_seq_c = res_lc_cons[0][0]
                res_lc = get_lentes_contato.select_nr_seq_lentes_contato(nr_seq_c)
                if res_lc: get_lentes_contato.update_lentes_contato(res_lc[0][0], nm_usuario, ds_lentes_contato)
                else: get_lentes_contato.insert_lentes_contato(nr_seq_c, nm_usuario, ds_lentes_contato)

        if ds_cirurgias is not None:
            if cirurgia.existe_cirurgia_por_atendimento(nr_atendimento):
                cirurgia.update_cirurgia_observacao_por_atendimento(nr_atendimento, ds_cirurgias)
            else:
                cirurgia.insert_cirurgia(nr_atendimento, ds_cirurgias, nm_usuario)

        return JSONResponse(content={"status": "success", "mensagem": "Rascunho salvo com sucesso."}, status_code=200)

    except Exception as e:
        print(f"Erro Crítico: {str(e)}")
        return JSONResponse(content={"status": "error", "mensagem": f"Erro ao salvar: {str(e)}"}, status_code=500)

@app.post("/salvar_liberar/{nr_atendimento}")
async def salvar_liberar(request: Request, nr_atendimento: int):

    cd_medico = request.session.get("cd_pessoa_fisica")

    if not cd_medico:
        logger.warning(f"Usuário não autenticado. Redirecionando para login. nr_atendimento={nr_atendimento}")
        return RedirectResponse("/login", status_code=302)
    
    consulta_finalizada = get_status_consulta.get_status_consulta(nr_atendimento)

    if consulta_finalizada:
        return JSONResponse(
            {"mensagem": "Ação não autorizada: não é permitido sobrescrever dados de consulta já liberada."},
            status_code=400
            )

    else:
        # Anamnese
        anamnese.salvar_liberar_anamnese(nr_atendimento)
        # Refracao
        refracao.salvar_liberar_refracao(nr_atendimento)
        # Oculos
        oculos.salvar_liberar_oculos(nr_atendimento)
        # Acuidade Visual
        acuidade_visual.salvar_liberar_acuidade_visual(nr_atendimento)
        # Tonometria
        pressao.salvar_liberar_tonometria(nr_atendimento)
        # Conduta
        conduta.salvar_liberar_conduta(nr_atendimento)
        # Exames - Updated to use new function
        get_exams.salvar_liberar_exame(nr_atendimento)

        # Finaliza a consulta e altera o status na agenda
        consulta.update_finalizar_consulta(nr_atendimento)

        return JSONResponse(
            {"mensagem": "Valores liberados com sucesso. Consulta encerrada."},
            status_code=200)
    

@app.post("/gerar-pdf-oculos")
async def gerar_pdf_oculos(request: Request):
    try:
        dados = await request.json()
        tipo = dados.get("tipo") 
        valores = dados.get("valores")  
        adicao = dados.get("adicao")
        observacao = dados.get("observacao")
        nm_paciente = dados.get("nmPessoaFisica")
        dt_nascimento = dados.get("dataNascimento")
        nr_cpf = dados.get("dataCpf")

        print("Debug - received values:", valores)  # Add debug print
        
        if tipo == 'estatica':
            vl_od_pl_ard_esf = valores.get('vl_od_pl_are_esf')
            vl_od_pl_ard_cil = valores.get('vl_od_pl_are_cil')
            vl_od_pl_ard_eixo = valores.get('vl_od_pl_are_eixo')
            vl_oe_pl_ard_esf = valores.get('vl_oe_pl_ard_esf')
            vl_oe_pl_ard_cil = valores.get('vl_oe_pl_ard_cil')
            vl_oe_pl_ard_eixo = valores.get('vl_oe_pl_ard_eixo')
        else:
            vl_od_pl_ard_esf = valores.get('vl_od_pl_ard_esf')
            vl_od_pl_ard_cil = valores.get('vl_od_pl_ard_cil')
            vl_od_pl_ard_eixo = valores.get('vl_od_pl_ard_eixo')
            vl_oe_pl_ard_esf = valores.get('vl_oe_pl_ard_esf')
            vl_oe_pl_ard_cil = valores.get('vl_oe_pl_ard_cil')
            vl_oe_pl_ard_eixo = valores.get('vl_oe_pl_ard_eixo')

        html_pdf = impressao_dados_evolucao.retornar_html_oculos(
            valores.get("nr_atendimento", "N/A"),
            vl_od_pl_ard_esf,
            vl_od_pl_ard_cil,
            vl_od_pl_ard_eixo,
            vl_oe_pl_ard_esf,
            vl_oe_pl_ard_cil,
            vl_oe_pl_ard_eixo,
            adicao,
            observacao,
            nm_paciente,
            dt_nascimento,
            nr_cpf,
            tipo=tipo
        )
            
        return HTMLResponse(content=html_pdf, status_code=200)

    except Exception as e:
        print("Error:", str(e))  # Add debug print
        return {"erro": f"Erro ao gerar o PDF: {str(e)}"}

@app.post("/gerar-pdf-receita")
async def gerar_pdf_receita(request: Request):
    try:
        dados = await request.json()
        receita = dados.get("receita")
        
        # Aceitar ambos os formatos de nome de campo
        nm_paciente = dados.get("nm_pessoa_fisica") or dados.get("nmPessoaFisica")
        dt_nascimento = dados.get("data_nascimento") or dados.get("dataNascimento")
        nr_cpf = dados.get("data_cpf") or dados.get("dataCpf")
        nr_copias = dados.get("nr_copias", 1)

        logger.info(f"Gerando receita: {nm_paciente}, {dt_nascimento}, {nr_cpf}, cópias: {nr_copias}")

        # Validar se os dados essenciais foram recebidos
        if not nm_paciente:
            raise HTTPException(status_code=400, detail="Nome do paciente não informado")
        if not dt_nascimento:
            raise HTTPException(status_code=400, detail="Data de nascimento não informada")
        if not nr_cpf:
            raise HTTPException(status_code=400, detail="CPF não informado")

        try:
            html_pdf = impressao_dados_evolucao.retornar_html_receita(
                receita, 
                nm_paciente, 
                dt_nascimento, 
                nr_cpf,
                nr_copias
            )

            return HTMLResponse(content=html_pdf, status_code=200)
        except Exception as e:
            logger.error(f'Erro ao tentar gerar arquivo PDF: {e}')
            raise HTTPException(status_code=500, detail=str(e))

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"Erro ao processar requisição: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar o PDF: {str(e)}")
    

@app.post("/gerar-pdf-exames")
async def gerar_pdf_exames(request: Request):
    try:
        dados = await request.json()
        exames = dados.get("exames")  
        nm_paciente = dados.get("nmPessoaFisica")
        convenio = dados.get("convenio")
        dt_nascimento = dados.get("dataNascimento")
        nr_cpf = dados.get("dataCpf")

        try:
            html_pdf = impressao_dados_evolucao.retornar_html_exames(exames, nm_paciente, convenio, dt_nascimento, nr_cpf)
            
            return HTMLResponse(content=html_pdf, status_code=200)
        except Exception as e:
            print(f'Erro ao tentar gerar arquivo PDF: {e}')

    except Exception as e:
        return {"erro": f"Erro ao gerar o PDF: {str(e)}"}
    
@app.get("/prontuario/api/novamacro/{nova_macro}/{tituloMacro}")
async def nova_macro(nova_macro: str, tituloMacro: str):

    if (nova_macro and tituloMacro):
        try:
            conn = await get_db_connection()
            query = None
            
            if tituloMacro == "Queixa Paciente":
                query = """
                   INSERT INTO queixa_principal(
                        ds_queixa_principal
                    )
                    VALUES(
                        $1
                    )
                """
            
            elif tituloMacro == "Acuidade Visual":
                query = """
                    INSERT INTO av_od_oe(
                        ds_acuidade_visual
                    )
                    VALUES(
                        $1
                    )
                """

            elif tituloMacro == "Diagnóstico":
                query = """
                   INSERT INTO diagnosticos(
                        ds_diagnosticos
                    )
                    VALUES(
                        $1
                    )
                """
            
            elif tituloMacro == "Cirurgias":
                query = """
                    INSERT INTO cirurgia(
                        ds_cirurgia
                    )
                    VALUES(
                        $1
                    )
                """
                    
            elif tituloMacro == "Oculos":
                query = """
                    INSERT INTO oculos_observacao(
                        ds_observacao
                    )
                    VALUES(
                        $1
                    )
                """
                    
            await conn.fetch(query, nova_macro)

            await conn.close()
            return JSONResponse(
            content={
                "status": "success",
                "message": "Nova macro adicionada com sucesso!"
            },
            status_code=201)

        except Exception as e:
            logger.error(f'Erro inesperado ao adicionar nova macro: {e}')
            return JSONResponse(
            content={
                "status": "error",
                "message": "Erro ao adicionar macro, tente novamente",
            },
            status_code=400)

@app.get("/prontuario/api/remover_macro/{title}/{value}")
async def remover_macro(title: str, value: str):
    if (value and title):
        try:
            conn = await get_db_connection()
            query = None
            
            if title == "Queixa Paciente":
                query = """
                    DELETE 
                        from queixa_principal
                    WHERE
                        ds_queixa_principal = $1
                """
            
            elif title == "Acuidade Visual":
                query = """
                    DELETE 
                        from av_od_oe
                    WHERE
                        ds_acuidade_visual = $1
                """

            elif title == "Diagnóstico":
                query = """
                    DELETE 
                        from diagnosticos
                    WHERE
                        ds_diagnosticos = $1
                """
            
            elif title == "Cirurgias":
                query = """
                    DELETE 
                        from cirurgia
                    WHERE
                        ds_cirurgia = $1
                """
                    
            elif title == "Oculos":
                query = """
                    DELETE 
                        from oculos_observacao
                    WHERE
                        ds_observacao = $1
                """
                    
            await conn.fetch(query, value)

            await conn.close()
            return JSONResponse(
            content={
                "status": "success",
                "message": "Macro removida com sucesso"
            },
            status_code=201)

        except Exception as e:
            logger.error(f'Erro inesperado ao remover macro: {e}')
            return JSONResponse(
            content={
                "status": "error",
                "message": "Erro ao remover macro, tente novamente",
            },
            status_code=204)


@app.post("/gerar-pdf-resumo")
async def gerar_pdf_resumo(request: Request):
    try:
        dados = await request.json()
        nr_atendimento = dados.get("nrAtendimento")

        dados_paciente = get_prontuario.get_dados_paciente(nr_atendimento)
        nm_paciente, idade_paciente, profissao, convenio, ultima_consulta, sexo, nr_sequencia_ultima_consulta, cpf, nascimento, cd_pessoa_fisica = dados_paciente

        summary = PatientSummary()
        consultas = summary.get_consultation_history(cd_pessoa_fisica)
        print(consultas)

        try:
            html_pdf = impressao_dados_resumo.retornar_html_resumo(nm_paciente, idade_paciente, profissao, convenio, sexo, cpf, nascimento, consultas)

            return HTMLResponse(content=html_pdf, status_code=200)
        except Exception as e:
            print(f'Erro ao tentar gerar arquivo PDF: {e}')

    except Exception as e:
        return {"erro": f"Erro ao gerar o PDF: {str(e)}"}

@app.get("/get_estatisticas/{dataSelecionada}")
async def tabela_estatisticas(dataSelecionada: str, request: Request):

    try:
        estatisticas = get_estatisticas.get_all_counts(dataSelecionada)

        return JSONResponse(
            content={
                "status": "success",
                "estatisticas": estatisticas
            }
        )
    except Exception as e:

        print(f"Erro ao buscar estatísticas: {e}")

        return JSONResponse(
            content={
                "status": "error",
                "message": str(e)
            }
        )

@app.get("/api/exames/novo-pacote/{descricao}/{codigos}")
async def novo_pacote(descricao: str, codigos :str, request: Request):

    try:
        conn = await get_db_connection()
        query = None

        query = """
            INSERT INTO pacotes(ds_pacote)
            VALUES ($1)
            RETURNING cd_pacote
        """

        resultado = await conn.fetchrow(query, descricao)

        cd_pacote = resultado['cd_pacote']
        
        lista_codigos = codigos.split(',')
        
        for codigo in lista_codigos:
            query = """
                INSERT INTO pacotes_exames (cd_pacote, cd_exame)
                VALUES ($1, $2)
            """
            await conn.execute(query, cd_pacote, codigo.strip())

        return JSONResponse(
                content={
                    "status": "success",
                    "message": "Pacote criado com sucesso"
                }
            )
    except Exception:
        return JSONResponse(
                content={
                    "status": "error",
                    "message": "Erro ao criar novo pacote, tente novamente!"
                }
            )
    
    finally:
        await conn.close()

@app.get("/api/paciente-alergia/{cd_pessoa_fisica}")
async def get_paciente_alergia(cd_pessoa_fisica: str, request: Request):
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            return JSONResponse(
                content={"error": "Usuário não autenticado"},
                status_code=401
            )

        query = """
            SELECT ds_observacao 
            FROM paciente_alergia 
            WHERE cd_pessoa_fisica = :cd_pessoa_fisica
        """
        
        results = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
        
        if results and len(results) > 0:
            ds_observacao = results[0][0] if results[0][0] else ""
            return JSONResponse(content={"ds_observacao": ds_observacao})
        else:
            return JSONResponse(content={"ds_observacao": ""})

    except Exception as e:
        logger.error(f"Erro ao buscar dados de alergia: {str(e)}")
        return JSONResponse(
            content={"error": f"Erro ao buscar dados: {str(e)}"},
            status_code=500
        )

@app.get("/api/consultas-antigas/{cd_pessoa_fisica}")
async def get_consultas_antigas(cd_pessoa_fisica: str, request: Request):
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            return JSONResponse(
                content={"error": "Usuário não autenticado"},
                status_code=401
            )

        from app.oracledb.get_dados.get_dt_consultas_anteriores import oraconn

        query = """
            SELECT DISTINCT
                TO_CHAR(dt_registro, 'DD/MM/YYYY') as data_formatada,
                dt_registro,
                cd_pessoa_fisica
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
                    'data_formatada': row[0],
                    'dt_registro': str(row[1]) if row[1] else None,
                    'cd_pessoa_fisica': str(row[2]) if row[2] else None
                })
        
        print(f"Consultas antigas encontradas: {len(consultas_antigas)} para paciente {cd_pessoa_fisica}")
        return JSONResponse(content={"consultas_antigas": consultas_antigas})

    except Exception as e:
        print(f"Erro ao buscar consultas antigas: {str(e)}")
        return JSONResponse(
            content={"error": f"Erro ao buscar consultas antigas: {str(e)}"},
            status_code=500
        )


def tratar_html_popup(texto):
    import re

    if not texto:
        return texto

    texto = texto.replace('\r\n', '\n').replace('\r', '\n')
    texto = texto.replace('<CRLF>', '<br>')
    texto = re.sub(r'\n+', '<br>', texto)
    texto = re.sub(r'(<br\s*/?>\s*){2,}', '<br>', texto)

    titulos_map = {
        'QP': 'QP',
        'REF': 'Ref',
        'AV': 'AV',
        'PIO': 'PIO',
        'DIAG': 'Diag',
        'EXAMES': 'Exames',
        'CONDUTA': 'Conduta',
        'CIRURGIA': 'Cirurgia',
        'LENTE': 'Lente',
    }
    titulos_chaves = set(titulos_map.keys())

    def normalizar_titulo(segmento):
        if not segmento:
            return None

        segmento_limpo = re.sub(r'</?b>', '', segmento, flags=re.IGNORECASE)
        segmento_limpo = re.sub(r'\s+', ' ', segmento_limpo).strip()
        segmento_limpo = re.sub(r'[:.\s]+$', '', segmento_limpo).strip()
        segmento_limpo = segmento_limpo.upper()

        return segmento_limpo if segmento_limpo in titulos_chaves else None

    partes = [p.strip() for p in re.split(r'(?i)<br\s*/?>', texto)]
    resultado = []
    i = 0

    while i < len(partes):
        linha = partes[i]
        if not linha:
            i += 1
            continue

        titulo_normalizado = normalizar_titulo(linha)
        if titulo_normalizado:
            conteudos = []
            j = i + 1
            while j < len(partes):
                proxima = partes[j]
                if not proxima:
                    j += 1
                    continue
                if normalizar_titulo(proxima):
                    break
                conteudos.append(proxima)
                j += 1

            if conteudos:
                titulo_formatado = f"<b>{titulos_map[titulo_normalizado]}:</b> {conteudos[0]}"
                resultado.append(titulo_formatado)
                for extra in conteudos[1:]:
                    resultado.append(extra)
            i = j
            continue

        resultado.append(linha)
        i += 1

    return '<br>'.join(resultado)

@app.get("/api/paciente-alergia-por-data/{cd_pessoa_fisica}")
async def get_paciente_alergia_por_data(cd_pessoa_fisica: str, request: Request, data_registro: str = Query(...)):
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            return JSONResponse(
                content={"error": "Usuário não autenticado"},
                status_code=401
            )

        from app.oracledb.get_dados.get_dt_consultas_anteriores import oraconn

        query = """
            SELECT ds_observacao 
            FROM paciente_alergia 
            WHERE cd_pessoa_fisica = :cd_pessoa_fisica
              AND TO_CHAR(dt_registro, 'DD/MM/YYYY') = :data_registro
        """
        
        results = oraconn.execute_select(query, {
            'cd_pessoa_fisica': cd_pessoa_fisica,
            'data_registro': data_registro
        })
        
        print(f"Buscando dados para paciente {cd_pessoa_fisica} na data {data_registro}")
        print(f"Resultados encontrados: {len(results) if results else 0}")
        
        if results and len(results) > 0:
            ds_observacao = results[0][0] if results[0][0] else ""
            ds_observacao = tratar_html_popup(ds_observacao)
            print(f"Observação encontrada: {len(ds_observacao)} caracteres")
            return JSONResponse(content={"ds_observacao": ds_observacao})
        else:
            print("Nenhum resultado encontrado")
            return JSONResponse(content={"ds_observacao": "Nenhum dado histórico encontrado para esta data."})

    except Exception as e:
        print(f"Erro ao buscar dados de alergia por data: {str(e)}")
       

        return JSONResponse(
            content={"error": f"Erro ao buscar dados: {str(e)}"},
            status_code=500
        )


@app.get("/api/debug-paciente-alergia/{cd_pessoa_fisica}")
async def debug_paciente_alergia_especifico(cd_pessoa_fisica: str, request: Request):
    try:
        from app.oracledb.get_dados.get_dt_consultas_anteriores import oraconn
        
        query = """
            SELECT 
                TO_CHAR(dt_registro, 'DD/MM/YYYY HH24:MI') as dt_registro_formatada,
                dt_registro,
                LENGTH(ds_observacao) as tamanho_observacao,
                SUBSTR(ds_observacao, 1, 100) as inicio_observacao,
                nr_atendimento,
                nm_usuario,
                dt_atualizacao
            FROM paciente_alergia 
            WHERE cd_pessoa_fisica = :cd_pessoa_fisica
            ORDER BY dt_registro ASC
        """
        
        results = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
        
        registros = []
        if results:
            for row in results:
                registros.append({
                    'dt_registro_formatada': row[0],
                    'dt_registro': str(row[1]),
                    'tamanho_observacao': row[2],
                    'inicio_observacao': row[3],
                    'nr_atendimento': row[4],
                    'nm_usuario': row[5],
                    'dt_atualizacao': str(row[6]) if row[6] else None
                })
        
        return JSONResponse(content={
            "cd_pessoa_fisica": cd_pessoa_fisica,
            "total_registros": len(registros),
            "registros": registros
        })
        
    except Exception as e:
        return JSONResponse(
            content={"error": f"Erro no debug: {str(e)}"},
            status_code=500
        )

from app.oracledb.insert_update_dados import conduta

@app.post("/api/receituario/salvar")
async def salvar_receituario(request: Request):
    dados = await request.json()
    nr_atendimento = dados.get("nr_atendimento")
    ds_conduta = dados.get("ds_conduta", "")
    ds_observacao = dados.get("ds_observacao", "")
    ds_observacao2 = dados.get("ds_observacao2", "")
    nm_usuario = request.session.get("nm_usuario")
    cd_medico = request.session.get("cd_pessoa_fisica")  

    if not nr_atendimento or not nm_usuario:
        return JSONResponse(content={"status": "error", "mensagem": "Dados obrigatórios não informados."}, status_code=400)

    select_nr_seq_conduta = conduta.select_nr_seq_conduta(nr_atendimento)
    if not select_nr_seq_conduta:
        conduta.insert_conduta(cd_medico, nr_atendimento, ds_conduta, nm_usuario)
        select_nr_seq_conduta = conduta.select_nr_seq_conduta(nr_atendimento)
        if not select_nr_seq_conduta:
            return JSONResponse(content={"status": "error", "mensagem": "Não foi possível criar a conduta."}, status_code=500)
    
    nr_seq_conduta = select_nr_seq_conduta[0][0]

    # Combinar as duas receitas em um único campo
    conteudo_combinado = conduta.combinar_receitas(ds_observacao, ds_observacao2)

    conduta.update_conduta(nr_seq_conduta, ds_conduta, nm_usuario)
    conduta.update_observacao_conduta(nr_seq_conduta, conteudo_combinado, nm_usuario)

    return JSONResponse(content={"status": "success", "mensagem": "Dados salvos com sucesso."}, status_code=200)

@app.get("/api/receituario/observacao/{nr_atendimento}")
async def get_receituario_observacao(nr_atendimento: str):
    ds_observacao = get_conduta.get_ds_observacao(nr_atendimento)
    return {"ds_observacao": ds_observacao or ""}

@app.get("/api/receituario/observacao2/{nr_atendimento}")
async def get_receituario_observacao2(nr_atendimento: str):
    ds_observacao2 = get_conduta.get_ds_observacao2(nr_atendimento)
    return {"ds_observacao2": ds_observacao2 or ""}

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

@app.get("/api/historico-paciente/{cd_pessoa_fisica}")
async def historico_paciente(cd_pessoa_fisica: str):
    try:
        logger.info(f"Buscando histórico para paciente: {cd_pessoa_fisica}")
        
        historico = []

        # 1. Consultas normais (oft_consulta)
        try:
            consultas = get_consultas_por_paciente(cd_pessoa_fisica)
            logger.info(f"Consultas normais encontradas: {len(consultas)}")
            
            for consulta in consultas:
                historico.append({
                    "data_consulta": consulta.get("data_consulta", ""),
                    "tipo": "normal",
                    "medico": formatar_nome_medico(consulta.get("medico", "")),
                    "conteudo": formatar_conteudo_consulta(consulta),
                    "nr_atendimento": consulta.get("nr_atendimento")
                })
        except Exception as e:
            logger.error(f"Erro ao buscar consultas normais: {str(e)}")

        # 2. Consultas antigas (paciente_alergia)
        try:
            consultas_antigas = get_consultas_antigas_alergia(cd_pessoa_fisica)
            logger.info(f"Consultas antigas encontradas: {len(consultas_antigas)}")
            
            for antiga in consultas_antigas:
                historico.append({
                    "data_consulta": antiga.get("data_consulta", ""),
                    "tipo": "anterior",
                    "medico": "",
                    "conteudo": tratar_html_popup(antiga.get("ds_observacao", "Sem informações"))
                })
        except Exception as e:
            logger.error(f"Erro ao buscar consultas antigas: {str(e)}")

        # 3. Prontuários especiais (PostgreSQL)
        try:
            prontuarios_especiais = await prontuario_especial.listar_prontuarios_especiais_paciente(int(cd_pessoa_fisica))
            logger.info(f"Prontuários especiais encontrados: {len(prontuarios_especiais)}")
            
            for especial in prontuarios_especiais:
                conteudo_especial = f"""
                    <strong>Queixa:</strong> {especial.get('ds_anamnese', 'Não informado')}<br>
                    <strong>Conduta:</strong> {especial.get('ds_conduta', 'Não informado')}<br>
                    <strong>Receita:</strong> {especial.get('ds_observacao', 'Não informado')}
                """
                
                historico.append({
                    "data_consulta": especial.get("data_consulta", ""),
                    "tipo": "especial",
                    "medico": especial.get("nm_medico", ""),
                    "cd_prontuario_especial": especial.get("cd_prontuario_especial"),
                    "conteudo": conteudo_especial
                })
        except Exception as e:
            logger.error(f"Erro ao buscar prontuários especiais: {str(e)}")

        # Ordenar por data
        def parse_data(data_str):
            try:
                return datetime.strptime(data_str, "%d/%m/%Y")
            except:
                return datetime.min
        
        historico.sort(key=lambda x: parse_data(x.get("data_consulta", "")), reverse=False)

        logger.info(f"Total de registros no histórico: {len(historico)}")
        return JSONResponse(content=historico)
        
    except Exception as e:
        logger.error(f"[ERRO] Exception no endpoint historico-paciente: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar histórico: {str(e)}")
		


def formatar_conteudo_consulta(consulta):
    """
    Junta os campos do prontuário em um bloco de texto formatado.
    Diagnósticos e outros campos multiline devem ser tratados.
    """
    partes = []
    if consulta.get("queixa"):
        partes.append(f"Queixa: {consulta['queixa']}")
    if consulta.get("refracao"):
        partes.append(f"Refração: {consulta['refracao']}")
    if consulta.get("acuidade"):
        partes.append(f"Acuidade: {consulta['acuidade']}")
    if consulta.get("pressao"):
        partes.append(f"Pressão: {consulta['pressao']}")
    if consulta.get("diagnostico"):
        diag = consulta["diagnostico"]
        if isinstance(diag, list):
            diag = "\n".join(diag)
        elif isinstance(diag, str) and "\n" in diag:
            diag = diag.strip()
        partes.append(f"Diagnóstico:\n{diag}")
    if consulta.get("conduta"):
        partes.append(f"Conduta: {consulta['conduta']}")
    if consulta.get("exames"):
        partes.append(f"Exames: {consulta['exames']}")
    if consulta.get("cirurgia"):
        partes.append(f"Cirurgia: {consulta['cirurgia']}")
    if consulta.get("lentes_contato"):
        partes.append(f"Lentes de Contato: {consulta['lentes_contato']}")
    texto = "\n\n".join(partes)
    texto = tratar_html_popup(texto)
    return texto

@app.post("/api/agenda/executar/{nr_atendimento}")
async def executar_agenda(request: Request, nr_atendimento: int):
    cd_medico = request.session.get("cd_pessoa_fisica")
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)
    try:
        resultado = consulta.update_status_agenda_executada(nr_atendimento)
        if resultado:
            return JSONResponse({"mensagem": "Status da agenda alterado para Executada."}, status_code=200)
        else:
            return JSONResponse({"mensagem": "Falha ao atualizar status."}, status_code=500)
    except Exception as e:
        return JSONResponse({"mensagem": f"Erro: {str(e)}"}, status_code=500)

@app.post("/api/agenda/em_andamento/{nr_atendimento}")
async def agenda_em_andamento(request: Request, nr_atendimento: int):
    cd_medico = request.session.get("cd_pessoa_fisica")
    if not cd_medico:
        return RedirectResponse("/login", status_code=302)
    try:
        resultado = consulta.update_status_agenda_em_andamento(nr_atendimento)
        if resultado:
            return JSONResponse({"mensagem": "Status alterado para Em andamento."}, status_code=200)
        else:
            return JSONResponse({"mensagem": "Falha ao atualizar status."}, status_code=500)
    except Exception as e:
        return JSONResponse({"mensagem": f"Erro: {str(e)}"}, status_code=500)

@app.get("/editar-exames", response_class=HTMLResponse)
async def editar_exames_page(request: Request):
    """Página para editar exames por atendimento"""
    return templates.TemplateResponse("editar_exames.html", {
        "request": request
    })

@app.get("/api/exames/{nr_atendimento}")
async def buscar_exames_por_atendimento(nr_atendimento: int):
    """Busca os exames de um atendimento específico"""
    try:
        ds_exames = get_exams.get_ds_exames(nr_atendimento)
        
        return {
            "nr_atendimento": nr_atendimento,
            "ds_exames": ds_exames
        }
    except Exception as e:
        print(f"Erro ao buscar exames: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar exames: {str(e)}")

@app.put("/api/exames/{nr_atendimento}")
async def atualizar_exames_atendimento(nr_atendimento: int, request: Request):
    """Atualiza os exames de um atendimento específico"""
    try:
        dados = await request.json()
        ds_exames = dados.get("ds_exames", "")
        
        # ========== INICIALIZAR VARIÁVEL ==========
        exames_nao_encontrados = []
        # ========== FIM DA INICIALIZAÇÃO ==========
        
        # Verificar se já existe um registro de exame
        select_nr_seq_exame = get_exams.select_nr_seq_exame(nr_atendimento)
        
        if select_nr_seq_exame:
            nr_seq_exame = select_nr_seq_exame[0][0]
            # Atualizar exame existente
            get_exams.update_exam(nr_seq_exame, ds_exames, "SISTEMA")
            
            # Processar códigos de exames se houver
            codigosExame = []
            qtdExame = []
            
            # Extrair códigos e quantidades do texto
            import re
            linhas = ds_exames.split('\n')
            for linha in linhas:
                # Padrão: CODIGO - DESCRICAO (QTDx) ou CODIGO - DESCRICAO
                match = re.match(r'^([0-9]+\.[0-9]+\.[0-9]+-[0-9]+)\s*-\s*.+?(?:\s*\((\d+)x\))?$', linha.strip())
                if match:
                    codigo = match.group(1).replace('.', '').replace('-', '')
                    quantidade = match.group(2) if match.group(2) else '1'
                    codigosExame.append(codigo)
                    qtdExame.append(quantidade)
            
            # Deletar itens anteriores e inserir novos
            if codigosExame:
                get_exams.deletar_exames_anteriores(nr_seq_exame)
                for codigo, qtd in zip(codigosExame, qtdExame):
                    codigo_verificado = get_exams.verifica_cd_exame(codigo)
                    if codigo_verificado:
                        get_exams.insert_exam_item(nr_seq_exame, codigo, qtd, "SISTEMA")
                    else:
                        exames_nao_encontrados.append(codigo)
            
            # ========== RETORNAR COM INFORMAÇÃO DE EXAMES NÃO ENCONTRADOS ==========
            mensagem = "Exames atualizados com sucesso"
            if exames_nao_encontrados:
                mensagem += f". Códigos não encontrados: {', '.join(exames_nao_encontrados)}"
            
            return {
                "message": mensagem,
                "nr_atendimento": nr_atendimento,
                "exames_nao_encontrados": exames_nao_encontrados
            }
            # ========== FIM DO RETORNO ==========
        else:
            raise HTTPException(
                status_code=404, 
                detail="Nenhum registro de exame encontrado para este atendimento"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar exames: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar exames: {str(e)}")

@app.get("/api/cirurgias/{nr_atendimento}")
async def buscar_cirurgias_por_atendimento(nr_atendimento: int):
    """Busca as cirurgias de um atendimento específico"""
    try:
        ds_cirurgias = get_cirurgias.get_ds_cirurgias(nr_atendimento)
        
        return {
            "nr_atendimento": nr_atendimento,
            "ds_cirurgias": ds_cirurgias
        }
    except Exception as e:
        print(f"Erro ao buscar cirurgias: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar cirurgias: {str(e)}")

@app.put("/api/cirurgias/{nr_atendimento}")
async def atualizar_cirurgias_atendimento(nr_atendimento: int, request: Request):
    """Atualiza as cirurgias de um atendimento específico"""
    try:
        dados = await request.json()
        ds_cirurgias = dados.get("ds_cirurgias", "")
        nm_usuario = request.session.get("nm_usuario", "SISTEMA")
        
        sucesso = get_cirurgias.update_cirurgias(nr_atendimento, ds_cirurgias, nm_usuario)
        
        if sucesso:
            return {
                "message": "Cirurgias atualizadas com sucesso",
                "nr_atendimento": nr_atendimento
            }
        else:
            raise HTTPException(status_code=404, detail="Prontuário não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar cirurgias: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar cirurgias: {str(e)}")

@app.get("/api/prontuario-resumo/{nr_atendimento}")
async def get_prontuario_resumo(nr_atendimento: int):
    """Busca o resumo do prontuário de um atendimento específico"""
    try:
        # Buscar dados do paciente
        dados_paciente = get_prontuario.get_dados_paciente(nr_atendimento)
        if not dados_paciente:
            return JSONResponse(
                content={"error": "Dados do paciente não encontrados"}, 
                status_code=404
            )
        
        nm_paciente, idade_paciente, profissao, convenio, ultima_consulta, sexo, \
        nr_sequencia_ultima_consulta, cpf, nascimento, cd_pessoa_fisica = dados_paciente
        
        # Buscar todas as consultas do paciente
        consultas = get_consultas_por_paciente(cd_pessoa_fisica)
        
        # Filtrar apenas a consulta do nr_atendimento específico
        consulta_especifica = None
        for consulta in consultas:
            consulta_nr_atend = consulta.get('nr_atendimento')
            
            if str(consulta_nr_atend) == str(nr_atendimento):
                consulta_especifica = consulta
                break
        
        if not consulta_especifica:
            return JSONResponse(
                content={
                    "nr_atendimento": nr_atendimento,
                    "conteudo": "Nenhum dado encontrado para este atendimento."
                },
                status_code=200
            )
        
        # Formatar o conteúdo da consulta usando a função que já existe
        conteudo_formatado = formatar_conteudo_consulta(consulta_especifica)
        
        return {
            "nr_atendimento": nr_atendimento,
            "nm_paciente": nm_paciente,
            "data_consulta": consulta_especifica.get("data_consulta", "N/A"),
            "medico": formatar_nome_medico(consulta_especifica.get("medico", "N/A")),  # ← APLICAR FORMATAÇÃO
            "conteudo": conteudo_formatado
        }
        
    except Exception as e:
        print(f"Erro ao buscar resumo do prontuário: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao buscar resumo do prontuário: {str(e)}"
        )

def formatar_nome_medico(nm_medico):
    """
    Formata o nome do médico para exibição
    """
    if not nm_medico:
        return ""
    
    # Se o médico for maria.solange, substituir pelo nome completo
    if nm_medico.lower() == "maria.solange" or nm_medico.lower() == "thayna.miranda":
        return "Irineu Antunes Neto"
    
    return nm_medico

@app.post("/api/prontuario-especial/criar")
async def criar_prontuario_especial_endpoint(request: Request):
    """
    Cria um novo prontuário especial (apenas receituário)
    """
    try:
        dados = await request.json()
        cd_medico = request.session.get("cd_pessoa_fisica")
        nm_medico = request.session.get("nm_guerra")
        nm_usuario = request.session.get("nm_usuario")
        
        if not cd_medico or not nm_usuario:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        cd_prontuario = await prontuario_especial.criar_prontuario_especial(
            cd_pessoa_fisica=dados['cd_pessoa_fisica'],
            nm_paciente=dados['nm_paciente'],
            cd_medico=cd_medico,
            nm_medico=nm_medico,
            nm_usuario=nm_usuario,
            ds_anamnese=dados.get('ds_anamnese'),
            ds_conduta=dados.get('ds_conduta', ''),  # Pode ser vazio
            ds_observacao=dados.get('ds_observacao'),
            ds_observacao2=dados.get('ds_observacao2')
        )
        
        return JSONResponse(content={
            "status": "success",
            "cd_prontuario_especial": cd_prontuario,
            "mensagem": "Prontuário especial criado com sucesso"
        })
    except Exception as e:
        logger.error(f"Erro ao criar prontuário especial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/prontuario-especial/atualizar/{cd_prontuario}")
async def atualizar_prontuario_especial_endpoint(
    cd_prontuario: int,
    request: Request
):
    """
    Atualiza um prontuário especial existente
    """
    try:
        dados = await request.json()
        nm_usuario = request.session.get("nm_usuario")
        
        if not nm_usuario:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        sucesso = await prontuario_especial.atualizar_prontuario_especial(
            cd_prontuario_especial=cd_prontuario,
            nm_usuario=nm_usuario,
            ds_anamnese=dados.get('ds_anamnese'),
            ds_conduta=dados.get('ds_conduta'),
            ds_observacao=dados.get('ds_observacao'),
            ds_observacao2=dados.get('ds_observacao2')
        )
        
        if sucesso:
            return JSONResponse(content={
                "status": "success",
                "mensagem": "Prontuário especial atualizado com sucesso"
            })
        else:
            raise HTTPException(status_code=404, detail="Prontuário não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar prontuário especial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prontuario-especial/{cd_prontuario}")
async def buscar_prontuario_especial_endpoint(
    cd_prontuario: int,
    request: Request
):
    """
    Busca um prontuário especial pelo código
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        prontuario = await prontuario_especial.buscar_prontuario_especial(cd_prontuario)
        
        if prontuario:
            return JSONResponse(content=prontuario)
        else:
            raise HTTPException(status_code=404, detail="Prontuário não encontrado")
    except Exception as e:
        logger.error(f"Erro ao buscar prontuário especial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/buscar-todos-pacientes")
async def buscar_todos_pacientes_endpoint(
    termo: str = Query(..., min_length=3),
    request: Request = None
):
    """
    Busca pacientes por nome (todos, não apenas com atendimento)
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        pacientes = await prontuario_especial.buscar_todos_pacientes(termo)
        return JSONResponse(content=pacientes)
    except Exception as e:
        logger.error(f"Erro ao buscar pacientes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/buscar-pacientes-nascimento")
async def buscar_pacientes_nascimento_endpoint(
    data: str = Query(..., regex=r'^\d{2}/\d{2}/\d{4}$'),
    request: Request = None
):
    """
    Busca pacientes por data de nascimento (DD/MM/YYYY)
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        pacientes = await prontuario_especial.buscar_pacientes_por_nascimento(data)
        return JSONResponse(content=pacientes)
    except Exception as e:
        logger.error(f"Erro ao buscar pacientes por nascimento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prontuarios-especiais-paciente/{cd_pessoa_fisica}")
async def listar_prontuarios_especiais_endpoint(
    cd_pessoa_fisica: int,
    request: Request
):
    """
    Lista todos os prontuários especiais de um paciente
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        prontuarios = await prontuario_especial.listar_prontuarios_especiais_paciente(cd_pessoa_fisica)
        return JSONResponse(content=prontuarios)
    except Exception as e:
        logger.error(f"Erro ao listar prontuários especiais: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/prontuario-especial', response_class=HTMLResponse)
async def exibir_prontuario_especial(request: Request):
    """
    Exibe o prontuário especial (somente receituário)
    """
    cd_medico = request.session.get("cd_pessoa_fisica")
    nm_guerra = request.session.get("nm_guerra")
    nm_usuario = request.session.get("nm_usuario")
    cd_pessoa_fisica = request.query_params.get('cd_pessoa_fisica')
    cd_prontuario_especial = request.query_params.get('cd_prontuario')

    if not cd_medico:
        return RedirectResponse("/login", status_code=302)
    
    if not cd_pessoa_fisica:
        return JSONResponse(
            content={"message": "cd_pessoa_fisica não fornecido"}, 
            status_code=400
        )

    # Buscar dados do paciente no Oracle
    query = """
        SELECT 
            nm_pessoa_fisica,
            TO_CHAR(dt_nascimento, 'DD/MM/YYYY') as dt_nascimento,
            nr_cpf
        FROM pessoa_fisica
        WHERE cd_pessoa_fisica = :cd_pessoa_fisica
    """
    
    from app.oracledb.get_dados.get_agenda import oraconn
    result = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
    
    if not result:
        return JSONResponse(
            content={"message": "Paciente não encontrado"}, 
            status_code=404
        )
    
    nm_paciente = result[0][0]
    dt_nascimento = result[0][1]
    nr_cpf = result[0][2]

    # Se está editando um prontuário existente, buscar dados
    prontuario_existente = None
    if cd_prontuario_especial:
        prontuario_existente = await prontuario_especial.buscar_prontuario_especial(
            int(cd_prontuario_especial)
        )

    return templates.TemplateResponse("prontuario_especial.html", {
        "request": request,
        "cd_medico": cd_medico,
        "nm_guerra": nm_guerra,
        "nm_usuario": nm_usuario,
        "cd_pessoa_fisica": cd_pessoa_fisica,
        "nm_paciente": nm_paciente,
        "dt_nascimento": dt_nascimento,
        "nr_cpf": nr_cpf,
        "cd_prontuario_especial": cd_prontuario_especial,
        "prontuario": prontuario_existente,
        "section": "receituario"
    })



@app.get("/api/lista-atendimentos/{cd_pessoa_fisica}")
async def listar_atendimentos_paciente(cd_pessoa_fisica: str, request: Request):
    """
    Lista todos os atendimentos de um paciente com informações básicas
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        # Query corrigida: adiciona JOIN com agenda e ajusta filtro de especialidade
        query = """
            SELECT
                TO_CHAR(ac.dt_agenda, 'DD/MM/YYYY HH24:MI') as dt_agenda,
                ap.nr_atendimento,
                ac.cd_medico_req as cd_medico,
                CASE 
                    WHEN oft.dt_fim_consulta IS NOT NULL THEN 'Atendido'
                    ELSE 'Aguardando'
                END as status
            FROM atendimento_paciente ap
            INNER JOIN agenda_consulta ac ON ac.nr_atendimento = ap.nr_atendimento
            INNER JOIN agenda a ON a.cd_agenda = ac.cd_agenda  -- Adicionado JOIN com agenda
            LEFT JOIN oft_consulta oft ON oft.nr_atendimento = ap.nr_atendimento
            WHERE ap.cd_pessoa_fisica = :cd_pessoa_fisica
              AND a.cd_especialidade = 18  -- Corrigido: filtro na tabela agenda
              AND ac.nr_seq_oftalmo IS NOT NULL
              AND ac.dt_agenda IS NOT NULL
            ORDER BY ac.dt_agenda DESC
        """
        
        results = oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
        
        atendimentos = []
        for row in results:
            cd_medico_req = row[2]
            
            # Buscar nome do médico usando a função existente
            nm_medico = "Não informado"
            if cd_medico_req:
                try:
                    nm_medico_result = get_medico.get_nm_guerra(cd_medico_req)
                    if nm_medico_result:
                        nm_medico = nm_medico_result
                except Exception as e:
                    logger.error(f"Erro ao buscar nome do médico {cd_medico_req}: {str(e)}")
            
            atendimentos.append({
                'nr_atendimento': row[1],
                'data': row[0],
                'medico': nm_medico,
                'status': row[3]
            })
        
        logger.info(f"Encontrados {len(atendimentos)} atendimentos para paciente {cd_pessoa_fisica}")
        return JSONResponse(content=atendimentos)
        
    except Exception as e:
        logger.error(f"Erro ao listar atendimentos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/dados-paciente-atendimento/{nr_atendimento}")
async def get_dados_paciente_atendimento(nr_atendimento: int, request: Request):
    """
    Retorna dados do paciente e informações do atendimento
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        # Query para buscar dados do paciente e atendimento
        query = """
            SELECT 
                pf.nm_pessoa_fisica,
                TO_CHAR(pf.dt_nascimento, 'DD/MM/YYYY') as dt_nascimento,
                pf.nr_cpf,
                TO_CHAR(ac.dt_agenda, 'DD/MM/YYYY') as dt_atendimento,
                pf.cd_pessoa_fisica,
                ap.nr_atendimento
            FROM atendimento_paciente ap
            INNER JOIN pessoa_fisica pf ON pf.cd_pessoa_fisica = ap.cd_pessoa_fisica
            INNER JOIN agenda_consulta ac ON ac.nr_atendimento = ap.nr_atendimento
            WHERE ap.nr_atendimento = :nr_atendimento
        """
        
        result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
        
        if not result or len(result) == 0:
            raise HTTPException(
                status_code=404, 
                detail="Dados do paciente não encontrados para este atendimento"
            )
        
        row = result[0]
        dados_paciente = {
            "nm_pessoa_fisica": row[0] or "",
            "dt_nascimento": row[1] or "",
            "nr_cpf": row[2] or "",
            "dt_atendimento": row[3] or "",
            "cd_pessoa_fisica": str(row[4]) if row[4] else "",
            "nr_atendimento": str(row[5]) if row[5] else ""
        }
        
        return JSONResponse(content=dados_paciente)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar dados do paciente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados: {str(e)}")


@app.get("/api/evolucao-completa/{nr_atendimento}")
async def get_evolucao_completa(nr_atendimento: int, request: Request):
    """
    Retorna todos os dados de evolução para impressão
    Inclui refração dinâmica, estática e outros dados do prontuário
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        # Buscar dados de evolução completos
        evolucao_data = get_evolucao.get_evolucao_data(nr_atendimento)
        
        if not evolucao_data:
            return JSONResponse(content={
                "nr_atendimento": nr_atendimento,
                "message": "Nenhum dado de evolução encontrado"
            })
        
        # Buscar dados adicionais que podem não estar na evolução básica
        refracao_completa = get_ultima_refracao.get_ultima_refracao(nr_atendimento)
        
        # Buscar dados individuais (mesma forma que é feito ao carregar o prontuário)
        ds_anamnese = get_anamnese.get_ds_anamnese(nr_atendimento)
        ds_acuidade_visual = get_acuidade_visual.get_ds_acuidade_visual(nr_atendimento)
        ds_lentes = get_lentes.get_ds_lentes(nr_atendimento)
        
        # Formatar refração como string (mesmo formato usado no prontuário)
        refracao_formatada = ""
        if refracao_completa:
            (vl_od_pl_ard_esf, vl_od_pl_ard_cil, vl_od_pl_ard_eixo,
             vl_oe_pl_ard_esf, vl_oe_pl_ard_cil, vl_oe_pl_ard_eixo,
             vl_adicao, ds_observacao) = refracao_completa
            
            # Formatar refração dinâmica se houver dados
            if any([vl_od_pl_ard_esf, vl_od_pl_ard_cil, vl_od_pl_ard_eixo, vl_oe_pl_ard_esf, vl_oe_pl_ard_cil, vl_oe_pl_ard_eixo, vl_adicao, ds_observacao]):
                partes_refracao = ["Óculos:"]
                
                # OD (Olho Direito)
                if vl_od_pl_ard_esf or vl_od_pl_ard_cil or vl_od_pl_ard_eixo:
                    od_parts = []
                    if vl_od_pl_ard_esf:
                        od_parts.append(f"OD: {locale.format_string('%+0.2f', float(vl_od_pl_ard_esf))}")
                    if vl_od_pl_ard_cil:
                        od_parts.append(f" / {locale.format_string('%+0.2f', float(vl_od_pl_ard_cil))}")
                    if vl_od_pl_ard_eixo:
                        od_parts.append(f" x {vl_od_pl_ard_eixo}°")
                    partes_refracao.append("".join(od_parts))
                
                # OE (Olho Esquerdo)
                if vl_oe_pl_ard_esf or vl_oe_pl_ard_cil or vl_oe_pl_ard_eixo:
                    oe_parts = []
                    if vl_oe_pl_ard_esf:
                        oe_parts.append(f"OE: {locale.format_string('%+0.2f', float(vl_oe_pl_ard_esf))}")
                    if vl_oe_pl_ard_cil:
                        oe_parts.append(f" / {locale.format_string('%+0.2f', float(vl_oe_pl_ard_cil))}")
                    if vl_oe_pl_ard_eixo:
                        oe_parts.append(f" x {vl_oe_pl_ard_eixo}°")
                    partes_refracao.append("".join(oe_parts))
                
                # Adição
                if vl_adicao:
                    partes_refracao.append(f" A={locale.format_string('%+0.2f', float(vl_adicao))}")
                
                refracao_formatada = " ".join(partes_refracao)
                
                # Adicionar observação se houver
                if ds_observacao:
                    refracao_formatada += f"\nOBS: {ds_observacao}"
        
        # Verificar se há refração estática
        refracao_estatica = ""
        if evolucao_data.get('vl_od_pl_are_esf') or evolucao_data.get('vl_od_pl_are_cil') or \
           evolucao_data.get('vl_oe_pl_are_esf') or evolucao_data.get('vl_oe_pl_are_cil'):
            
            partes_estatica = ["Óculos:"]
            
            # OD Estática
            if evolucao_data.get('vl_od_pl_are_esf') or evolucao_data.get('vl_od_pl_are_cil') or \
               evolucao_data.get('vl_od_pl_are_eixo'):
                od_parts = []
                if evolucao_data.get('vl_od_pl_are_esf'):
                    od_parts.append(f"OD: {locale.format_string('%+0.2f', float(evolucao_data['vl_od_pl_are_esf']))}")
                if evolucao_data.get('vl_od_pl_are_cil'):
                    od_parts.append(f" / {locale.format_string('%+0.2f', float(evolucao_data['vl_od_pl_are_cil']))}")
                if evolucao_data.get('vl_od_pl_are_eixo'):
                    od_parts.append(f" x {evolucao_data['vl_od_pl_are_eixo']}°")
                partes_estatica.append("".join(od_parts))
            
            # OE Estática
            if evolucao_data.get('vl_oe_pl_are_esf') or evolucao_data.get('vl_oe_pl_are_cil') or \
               evolucao_data.get('vl_oe_pl_are_eixo'):
                oe_parts = []
                if evolucao_data.get('vl_oe_pl_are_esf'):
                    oe_parts.append(f"OE: {locale.format_string('%+0.2f', float(evolucao_data['vl_oe_pl_are_esf']))}")
                if evolucao_data.get('vl_oe_pl_are_cil'):
                    oe_parts.append(f" / {locale.format_string('%+0.2f', float(evolucao_data['vl_oe_pl_are_cil']))}")
                if evolucao_data.get('vl_oe_pl_are_eixo'):
                    oe_parts.append(f" x {evolucao_data['vl_oe_pl_are_eixo']}°")
                partes_estatica.append("".join(oe_parts))
            
            refracao_estatica = " ".join(partes_estatica)
            
            # Adicionar observação se houver
            if evolucao_data.get('obs_refracao'):
                refracao_estatica += f"\nOBS: {evolucao_data['obs_refracao']}"
        
        # Usar refração estática se existir, senão usar dinâmica
        refracao_final = refracao_estatica if refracao_estatica else refracao_formatada
        
        dados_completos = {
            "nr_atendimento": nr_atendimento,
            
            # Dados formatados para exibição (mesmos nomes que o frontend espera)
            "queixa_paciente": ds_anamnese or evolucao_data.get('queixa', ''),
            "refracao": refracao_final,
            "acuidade_visual": ds_acuidade_visual or evolucao_data.get('acuidade', ''),
            "pressao": evolucao_data.get('pressao', ''),
            "diagnostico": evolucao_data.get('diagnostico', ''),
            "conduta": evolucao_data.get('conduta', ''),
            "exames": evolucao_data.get('exames', ''),
            "lente_contato": ds_lentes or '',
            
            # Dados brutos de refração (para uso interno se necessário)
            "vl_od_pl_ard_esf": evolucao_data.get('vl_od_pl_ard_esf', ''),
            "vl_od_pl_ard_cil": evolucao_data.get('vl_od_pl_ard_cil', ''),
            "vl_od_pl_ard_eixo": evolucao_data.get('vl_od_pl_ard_eixo', ''),
            "vl_oe_pl_ard_esf": evolucao_data.get('vl_oe_pl_ard_esf', ''),
            "vl_oe_pl_ard_cil": evolucao_data.get('vl_oe_pl_ard_cil', ''),
            "vl_oe_pl_ard_eixo": evolucao_data.get('vl_oe_pl_ard_eixo', ''),
            "vl_adicao": evolucao_data.get('vl_adicao', ''),
            "vl_od_pl_are_esf": evolucao_data.get('vl_od_pl_are_esf', ''),
            "vl_od_pl_are_cil": evolucao_data.get('vl_od_pl_are_cil', ''),
            "vl_od_pl_are_eixo": evolucao_data.get('vl_od_pl_are_eixo', ''),
            "vl_oe_pl_are_esf": evolucao_data.get('vl_oe_pl_are_esf', ''),
            "vl_oe_pl_are_cil": evolucao_data.get('vl_oe_pl_are_cil', ''),
            "vl_oe_pl_are_eixo": evolucao_data.get('vl_oe_pl_are_eixo', ''),
            "obs_refracao": evolucao_data.get('obs_refracao', ''),
        }
        
        # Buscar cirurgias
        try:
            ds_cirurgias = get_cirurgias.get_ds_cirurgias(nr_atendimento)
            dados_completos["cirurgias"] = ds_cirurgias or ''
        except Exception as e:
            logger.warning(f"Erro ao buscar cirurgias: {str(e)}")
            dados_completos["cirurgias"] = ''
        
        return JSONResponse(content=dados_completos)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar evolução completa: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao buscar dados de evolução: {str(e)}"
        )

@app.get("/api/data-atendimento/{nr_atendimento}")
async def get_data_atendimento(nr_atendimento: int, request: Request):
    """
    Retorna a data de um atendimento específico
    """
    try:
        cd_medico = request.session.get("cd_pessoa_fisica")
        if not cd_medico:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        
        from app.oracledb.get_dados.get_agenda import oraconn
        
        query = """
            SELECT TO_CHAR(ac.dt_agenda, 'DD/MM/YYYY') as data_formatada
            FROM agenda_consulta ac
            WHERE ac.nr_atendimento = :nr_atendimento
        """
        
        result = oraconn.execute_select(query, {'nr_atendimento': nr_atendimento})
        
        if result and result[0][0]:
            return JSONResponse(content={
                "data_formatada": result[0][0]
            })
        else:
            return JSONResponse(content={
                "data_formatada": None,
                "message": "Data não encontrada"
            })
            
    except Exception as e:
        logger.error(f"Erro ao buscar data do atendimento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))