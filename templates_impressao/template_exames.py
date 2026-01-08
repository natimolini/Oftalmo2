from datetime import datetime

def gerar_header_exames(nm_paciente, ds_convenio, nr_cpf, dt_nascimento):
    """Gera o HTML do header para exames"""
    return f"""
    <div class="page-header">
        <h3 style="margin: 0 0 10px 0;">SOLICITAÇÃO EXAMES</h3>
        <p><span>Para:</span> <span class="patient-name"><strong>{nm_paciente}</strong></span></p>
        <p><strong>Convênio: {ds_convenio}</strong></p>
        <div class="patient-info">
            <span><strong>CPF: {nr_cpf}</strong></span>
            <span><strong>Data Nascimento: {dt_nascimento}</strong></span>
        </div>
        <h4 style="margin: 10px 0 5px 0;">EXAMES:</h4>
        <hr style="margin: 0; border: 0; border-top: 1px solid #C0C0C0;">
    </div>
    """

def gerar_footer_exames(data_formatada):
    """Gera o HTML do footer para exames"""
    return f"""
    <div class="page-footer">
        <p><strong>Curitiba, {data_formatada}</strong></p>
        <br>
        <p><strong>IRINEU ANTUNES NETO - CRM:5199 RQE:2694</strong></p>
    </div>
    """

def gerar_estrutura_pagina_exames(conteudo_exames, nm_paciente, ds_convenio, nr_cpf, dt_nascimento, data_formatada):
    """
    Gera a estrutura completa da página de exames
    """
    
    template = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: 15.5cm 21.5cm;
            margin: 1cm;
        }}
        
        /* Regras para evitar páginas extras */
        @media print {{
            body {{
                height: 19.5cm !important; /* Altura forçada menor que a página */
                max-height: 19.5cm !important;
                overflow: hidden !important;
            }}
        }}
        
        * {{
            box-sizing: border-box;
        }}
        
        body {{
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
            padding-top: 8%; /* Reduzido de 10% para 8% */
        }}

        table {{
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }}

        thead {{
            display: table-header-group;
        }}
        
        thead td {{
            padding-top: 0.5cm;
            padding-bottom: 0.3cm;
        }}

        tfoot {{
            display: table-footer-group;
        }}
        
        tfoot td {{
            padding-top: 0.5cm;
            padding-bottom: 0.3cm;
            vertical-align: bottom;
        }}

        tbody {{
            display: table-row-group;
        }}
        
        tbody td {{
            vertical-align: top;
            height: 100%;
        }}

        .page-header {{
            font-size: 13px;
            margin-top: 1.2em;
        }}
        
        .page-header h3 {{
            font-size: 15px;
            margin: 0 0 10px 0;
        }}
        
        .page-header h4 {{
            font-size: 14px;
            margin: 10px 0 5px 0;
        }}
        
        .patient-name {{
            font-size: 15px;
            font-weight: bold;
        }}
        
        .patient-info {{
            display: flex;
            gap: 20px;
            margin-top: 5px;
        }}
        
        .page-header p {{
            margin: 3px 0;
            line-height: 1.3;
        }}

        .page-footer {{
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 0.3cm;
            margin-bottom: 3%; /* Reduzido de 7% para 3% */
        }}
        
        .page-footer p {{
            margin: 5px 0;
        }}

        .exames-content {{
            font-size: 14px;
            line-height: 1.6;
            padding: 0.3cm 0;
            /* remover min-height: 12cm; */
        }}

        .exam-item {{
            margin-bottom: 0;
            page-break-inside: avoid;
        }}

        .page-header,
        .page-footer {{
            page-break-inside: avoid;
        }}
    </style>
</head>
<body>
    <table>
        <thead>
            <tr>
                <td>
                    {gerar_header_exames(nm_paciente, ds_convenio, nr_cpf, dt_nascimento)}
                </td>
            </tr>
        </thead>

        <tfoot>
            <tr>
                <td>
                    {gerar_footer_exames(data_formatada)}
                </td>
            </tr>
        </tfoot>

        <tbody>
            <tr>
                <td>
                    <div class="exames-content">
                        {conteudo_exames}
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
    """
    
    return template

def processar_lista_exames(exames_texto):
    """
    Processa a lista de exames e retorna HTML formatado
    """
    linhas = [linha.strip() for linha in exames_texto.split('\n') if linha.strip()]
    exames_processados = []
    for linha in linhas:
        if ' - ' in linha:
            partes = linha.split(' - ', 1)
            exames_processados.append(f'<div class="exam-item">- {partes[1].strip()}</div>')
        else:
            exames_processados.append(f'<div class="exam-item">- {linha}</div>')
    return "".join(exames_processados)