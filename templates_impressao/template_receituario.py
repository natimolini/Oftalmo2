from datetime import datetime

def gerar_header(nm_paciente, nr_cpf, dt_nascimento):
    """Gera o HTML do header que será repetido em cada página"""
    return f"""
    <div class="page-header">
        <p><span>Para:</span> <span class="patient-name"><strong>{nm_paciente}</strong></span></p>
        <div class="patient-info">
            <span><strong>CPF: {nr_cpf}</strong></span>
            <span><strong>Data Nascimento: {dt_nascimento}</strong></span>
        </div>
    </div>
    """

def gerar_footer(data_formatada):
    """Gera o HTML do footer que será repetido em cada página"""
    return f"""
    <div class="page-footer">
        <p><strong>Curitiba, {data_formatada}</strong></p>
        <br>
        <p><strong>IRINEU ANTUNES NETO - CRM:5199 RQE:2694</strong></p>
    </div>
    """

def gerar_estrutura_pagina(conteudo_items, nm_paciente, nr_cpf, dt_nascimento, data_formatada):
    """
    Gera a estrutura completa da página com header e footer fixos
    usando a abordagem de table com thead/tfoot para repetição automática
    """
    
    template = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: 15.5cm 21.5cm;
            margin-top: 1.7cm;
            margin-right: 1cm;
            margin-bottom: 1.3cm; /* Aumentado de 1cm para 1.2cm (+0.2cm) */
            margin-left: 1cm;
        }}
        
        * {{
            box-sizing: border-box;
        }}
        
        body {{
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
            padding-top: 3%; /* Adiciona espaço de 3% no topo para descer o corpo */
        }}

        /* Estrutura da tabela para repetição automática */
        table {{
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }}

        /* Header - será repetido em cada página */
        thead {{
            display: table-header-group;
        }}
        
        thead td {{
            padding-top: 0.5cm;
            padding-bottom: 0.3cm;
        }}

        /* Footer - será repetido em cada página */
        tfoot {{
            display: table-footer-group;
        }}
        
        tfoot td {{
            padding-top: 0.5cm;
            padding-bottom: 0.3cm;
            vertical-align: bottom;
        }}

        /* Conteúdo principal */
        tbody {{
            display: table-row-group;
        }}
        
        tbody td {{
            vertical-align: top;
            height: 100%;
        }}

        /* Estilos do Header */
        .page-header {{
            font-size: 13px;
            padding: 0.3cm 0;
            border-bottom: 1px solid #ddd;
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

        /* Estilos do Footer */
        .page-footer {{
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 0.3cm;
        }}
        
        .page-footer p {{
            margin: 5px 0;
        }}

        /* Estilos do Conteúdo */
        .receita-content {{
            font-size: 14px;
            line-height: 1.5;
            padding: 0.3cm 0;
            min-height: 12cm;
        }}

        .med-item {{
            margin-bottom: 0.8em;
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
        }}
        
        .med-item .uso-linha {{
            display: inline;
            font-weight: bold;
        }}
        
        .med-item .medicamento-linha {{
            display: block;
            margin-top: 0;
        }}
        
        .med-item .instrucoes-linha {{
            display: block;
            margin-top: 0.2em;
        }}

        /* Evitar quebras indesejadas */
        .page-header,
        .page-footer {{
            page-break-inside: avoid;
        }}
    </style>
</head>
<body>
    <table>
        <!-- HEADER - Repetido automaticamente em cada página -->
        <thead>
            <tr>
                <td>
                    {gerar_header(nm_paciente, nr_cpf, dt_nascimento)}
                </td>
            </tr>
        </thead>

        <!-- FOOTER - Repetido automaticamente em cada página -->
        <tfoot>
            <tr>
                <td>
                    {gerar_footer(data_formatada)}
                </td>
            </tr>
        </tfoot>

        <!-- CONTEÚDO - Itens da receita -->
        <tbody>
            <tr>
                <td>
                    <div class="receita-content">
                        {conteudo_items}
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
    """
    
    return template

def processar_item_receita(item):
    """
    Processa um item individual da receita
    Retorna HTML formatado para o item
    """
    import re
    
    lines = item.split("\n")
    uso_line = ""
    medicamento_line = ""
    instrucoes_line = ""
    
    for line in lines:
        if line.startswith("USO:") or line.startswith("=> USO"):
            uso_line = line.replace("=> ", "").strip()  # Remove o "=>" se existir
        elif ":" in line and not line.startswith("USO:") and not line.startswith("=> USO"):
            parts = line.split(":", 1)
            if len(parts) == 2:
                medicamento_line = parts[0].strip() + ":"
                instrucoes_line = parts[1].strip()
        else:
            if instrucoes_line:
                instrucoes_line += " " + line.strip()
            else:
                instrucoes_line = line.strip()

    if instrucoes_line:
        instrucoes_line = instrucoes_line.replace("\n", " ").strip()
        quantidade_match = re.match(r"^([0-9]+[A-Za-z]*)\s+(.*)$", instrucoes_line)
        if quantidade_match and medicamento_line:
            quantidade = quantidade_match.group(1)
            restante = quantidade_match.group(2).strip()

            if quantidade.isdigit() and restante:
                partes_restante = restante.split(" ", 1)
                primeira_palavra = partes_restante[0]
                if primeira_palavra.isalpha() and primeira_palavra.isupper() and len(primeira_palavra) <= 4:
                    quantidade = f"{quantidade}{primeira_palavra}"
                    restante = partes_restante[1].strip() if len(partes_restante) > 1 else ""
            medicamento_line = f"{medicamento_line} {quantidade}".strip()
            instrucoes_line = restante

        sentences = [s.strip() for s in re.split(r"(?<=\.)\s*", instrucoes_line) if s.strip()]
        instrucoes_line = "<br>".join(sentences)
    
    # Montar o HTML do item com formatação corrigida
    html_parts = []
    
    if uso_line:
        # USO na mesma linha do hífen
        html_parts.append(f'<div class="med-item">- <span class="uso-linha">{uso_line}</span>')
    else:
        # Sem USO: não adiciona o hífen
        html_parts.append('<div class="med-item">')
    
    if medicamento_line:
        html_parts.append(f'<span class="medicamento-linha">{medicamento_line}</span>')
    
    if instrucoes_line:
        html_parts.append(f'<span class="instrucoes-linha">{instrucoes_line}</span>')
    
    html_parts.append('</div>')
    
    return "".join(html_parts)