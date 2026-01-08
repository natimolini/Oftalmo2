from datetime import datetime


def retornar_html_resumo(nm_paciente, idade_paciente, profissao, convenio, sexo, cpf, nascimento, consultas):

    dt_nascimento = formatar_data(nascimento)

    consultas_html = ""
    for consulta in consultas:
        consultas_html += f"""
        <div class="consultation">
            <div class="consultation-header">
                <h3>Consulta - {consulta.get('data_consulta', 'N/A')}</h3>
                <p><strong>Status:</strong> {consulta.get('status_consulta', 'N/A')}</p>
            </div>
            <div class="consultation-details">
                <div><strong>Número do Atendimento:</strong> {consulta.get('nr_atendimento', 'N/A')}</div>
                <div><strong>Médico:</strong> {consulta.get('medico', 'N/A')}</div>
                <div><strong>Queixa Principal:</strong> {consulta.get('queixa', 'N/A')}</div>
                <div><strong>Refracao:</strong> {consulta.get('refracao', 'N/A')}</div>
                <div><strong>Acuidade:</strong> {consulta.get('acuidade', 'N/A')}</div>
                <div><strong>Pressão:</strong> {consulta.get('pressao', 'N/A')}</div>
                <div><strong>Diagnóstico:</strong> {consulta.get('diagnostico', 'N/A')}</div>
                <div><strong>Conduta:</strong> {consulta.get('conduta', 'N/A')}</div>
                <div><strong>Exames:</strong> {consulta.get('exames', 'N/A')}</div>
                <div><strong>Óculos:</strong> {consulta.get('oculos', 'N/A')}</div>
            </div>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumo do Prontuário Eletrônico do Paciente</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                background-color: #f5f5f5;
            }}
            .container {{
                width: 800px;
                margin: 20px auto;
                padding: 20px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #007BFF;
            }}
            .header h1 {{
                margin: 0;
                font-size: 18px;
                color: #007BFF;
            }}
            .header h2 {{
                margin: 0;
                font-size: 16px;
                font-weight: normal;
                color: #555;
            }}
            .header .right {{
                text-align: right;
                font-size: 12px;
                color: #999;
            }}
            .info {{
                margin-bottom: 20px;
                font-size: 14px;
            }}
            .info .section {{
                margin-bottom: 10px;
                padding: 10px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 4px;
            }}
            .info .section h3 {{
                margin: 0;
                font-size: 16px;
                color: #007BFF;
                margin-bottom: 10px;
            }}
            .consultation {{
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
            }}
            .consultation-header {{
                margin-bottom: 10px;
                background: #007BFF;
                color: white;
                padding: 8px;
                border-radius: 4px;
            }}
            .consultation-header h3 {{
                margin: 0;
                font-size: 16px;
            }}
            .consultation-header p {{
                margin: 0;
                font-size: 14px;
                font-weight: bold;
            }}
            .consultation-details {{
                font-size: 14px;
                color: #333;
            }}
            .consultation-details div {{
                margin-bottom: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>OFTALMOCLINICA CURITIBA</h1>
                <h2>Resumo do Prontuário Eletrônico do Paciente</h2>
                <div class="right">CLIR034</div>
            </div>

            <div class="info">
                <div class="section">
                    <h3>Informações do Paciente</h3>
                    <div><strong>Paciente:</strong> {nm_paciente}</div>
                    <div><strong>Profissão:</strong> {profissao}</div>
                    <div><strong>Convênio:</strong> {convenio}</div>
                    <div><strong>Sexo:</strong> {sexo}</div>
                    <div><strong>Data de Nascimento:</strong> {dt_nascimento}</div>
                    <div><strong>Idade:</strong> {idade_paciente}</div>
                    <div><strong>CPF:</strong> {cpf}</div>
                </div>
            </div>

            <div id="consultations">
                {consultas_html}
            </div>
        </div>
    </body>
    </html>
    """



def formatar_data(data_iso):
    """Formata uma data para o formato brasileiro DD/MM/AAAA.

    Args:
        data_iso: A data no formato ISO 8601 (AAAA-MM-DD HH:MM:SS), datetime, ou DD/MM/YYYY

    Returns:
        Uma string com a data formatada para o Brasil.
    """
    if data_iso is None:
        return "Não informado"

    # Se já é um objeto datetime, apenas formata
    if isinstance(data_iso, datetime):
        data_formatada = data_iso.strftime('%d/%m/%Y')
        return data_formatada
    
    # Se for string, tentar diferentes formatos
    if isinstance(data_iso, str):
        # Se já está no formato DD/MM/YYYY, retornar direto
        if '/' in data_iso and len(data_iso) == 10:
            try:
                # Validar se é uma data válida
                datetime.strptime(data_iso, '%d/%m/%Y')
                return data_iso
            except ValueError:
                pass
        
        # Tentar formato completo: YYYY-MM-DD HH:MM:SS
        try:
            data = datetime.strptime(data_iso, '%Y-%m-%d %H:%M:%S')
            data_formatada = data.strftime('%d/%m/%Y')
            return data_formatada
        except ValueError:
            pass
        
        # Tentar formato simples: YYYY-MM-DD
        try:
            data = datetime.strptime(data_iso, '%Y-%m-%d')
            data_formatada = data.strftime('%d/%m/%Y')
            return data_formatada
        except ValueError:
            pass
    
    # Se nenhum formato funcionou, retornar a string original
    return str(data_iso)

