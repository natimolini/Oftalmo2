import { exibirMensagem } from './flash_messages.js';
import { podeAbrirProntuario, registrarAberturaProntuario } from './prontuario-click-control.js';

// Função para formatar a data no formato "Dia da semana, DD de Mês de YYYY"
function formatarData(data) {
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
}

// Função auxiliar para criar uma data local a partir de uma string no formato YYYY-MM-DD
function criarDataLocal(dataString) {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia); // O mês no objeto Date é baseado em 0
}

// Sincronizar a data entre o calendário e o span
function sincronizarData(data) {
    const calendario = document.getElementById('calendario');
    const dataSelecionadaElemento = document.getElementById('dataSelecionada');

    // Atualiza o valor do calendário no formato YYYY-MM-DD
    calendario.value = data.toISOString().split('T')[0];
    // Atualiza o texto no span com a data formatada
    dataSelecionadaElemento.textContent = formatarData(data);
}

// Função para popular dados do prontuário
async function popularDadosProntuario(newWindow, nrAtendimento) {
    try {
        console.log('Fetching evolution data...');
        const response = await fetch(`/api/evolucao/${nrAtendimento}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const evolucaoData = await response.json();
        console.log('Retrieved evolution data:', evolucaoData);
        
        // Make sure we're using the correct window reference
        const targetDocument = newWindow.document;
        
        // Update form fields
        if (evolucaoData.queixa) {
            console.log('Updating anamnese:', evolucaoData.queixa);
            const anamneseTextarea = targetDocument.getElementById('text-area-anamnese');
            if (anamneseTextarea) {
                anamneseTextarea.value = evolucaoData.queixa;
                anamneseTextarea.dispatchEvent(new Event('input'));
            }
        }

        if (evolucaoData.refracao) {
            const refracaoTextarea = targetDocument.getElementById('textarea-refacao');
            if (refracaoTextarea) {
                refracaoTextarea.value = evolucaoData.refracao;
                refracaoTextarea.dispatchEvent(new Event('input'));
            }
        }
        
        if (evolucaoData.acuidade) {
            console.log('Updating acuidade:', evolucaoData.acuidade);
            const acuidadeTextarea = targetDocument.getElementById('textarea-acuidade');
            if (acuidadeTextarea) {
                acuidadeTextarea.value = evolucaoData.acuidade;
                acuidadeTextarea.dispatchEvent(new Event('input'));
            }
        }

        if (evolucaoData.pressao) {
            console.log('Updating pressao:', evolucaoData.pressao);
            const pressaoTextarea = targetDocument.getElementById('textarea-tonometria');
            if (pressaoTextarea) {
                pressaoTextarea.value = evolucaoData.pressao;
                pressaoTextarea.dispatchEvent(new Event('input'));
            }
        }

        if (evolucaoData.diagnostico) {
            console.log('Updating diagnostico:', evolucaoData.diagnostico);
            const diagnosticoTextarea = targetDocument.getElementById('text-area-diagnostico');
            if (diagnosticoTextarea) {
                diagnosticoTextarea.value = evolucaoData.diagnostico;
                diagnosticoTextarea.dispatchEvent(new Event('input'));
            }
        }

        if (evolucaoData.conduta) {
            console.log('Updating conduta:', evolucaoData.conduta);
            const condutaTextarea = targetDocument.getElementById('textarea-conduta');
            if (condutaTextarea) {
                condutaTextarea.value = evolucaoData.conduta;
                condutaTextarea.dispatchEvent(new Event('input'));
            }
        }

        if (evolucaoData.exames) {
            console.log('Updating exames:', evolucaoData.exames);
            const examesTextarea = targetDocument.getElementById('textarea-exames');
            if (examesTextarea) {
                examesTextarea.value = evolucaoData.exames;
                examesTextarea.dispatchEvent(new Event('input'));
            }
        }

        // Handle refraction fields
        if (evolucaoData.vl_od_pl_ard_esf !== undefined) {
            console.log('Updating refraction fields...');
            
            // Set dynamic refraction radio button
            const radioDinamica = targetDocument.querySelector('input[name="tipo_refracao"][value="dinamica"]');
            if (radioDinamica) {
                radioDinamica.checked = true;
                radioDinamica.dispatchEvent(new Event('change'));
            }

            // Update refraction values
            const refractionFields = {
                'vl_od_pl_ard_esf': evolucaoData.vl_od_pl_ard_esf,
                'vl_od_pl_ard_cil': evolucaoData.vl_od_pl_ard_cil,
                'vl_od_pl_ard_eixo': evolucaoData.vl_od_pl_ard_eixo,
                'vl_oe_pl_ard_esf': evolucaoData.vl_oe_pl_ard_esf,
                'vl_oe_pl_ard_cil': evolucaoData.vl_oe_pl_ard_cil,
                'vl_oe_pl_ard_eixo': evolucaoData.vl_oe_pl_ard_eixo,
                'vl_adicao': evolucaoData.vl_adicao
            };

            Object.entries(refractionFields).forEach(([fieldName, value]) => {
                if (value !== null && value !== undefined) {
                    console.log(`Setting ${fieldName} to ${value}`);
                    const input = targetDocument.querySelector(`input[name="${fieldName}"]`);
                    if (input) {
                        input.value = value;
                        input.dispatchEvent(new Event('input'));
                    }
                }
            });

            // Update refraction observation
            if (evolucaoData.obs_refracao) {
                const obsRefracaoTextarea = targetDocument.querySelector('textarea[name="ds_observacao_refracao"]');
                if (obsRefracaoTextarea) {
                    obsRefracaoTextarea.value = evolucaoData.obs_refracao;
                    obsRefracaoTextarea.dispatchEvent(new Event('input'));
                }
            }
        }

        console.log('Finished updating all fields');
        
    } catch (error) {
        console.error('Error fetching or updating evolution data:', error);
    }
}

// Função para atualizar a agenda
async function atualizarAgenda() {
    const dataSelecionada = document.getElementById('calendario').value;
    if (!dataSelecionada) return;

    // Criação do dicionário
    const imageDictionary = {
        "Consulta": new Image(),
        "Retorno": new Image(),
        "Retorno Cirurgia": new Image(),
        "Resultado de Exames": new Image(),
        "Consulta + Resultado": new Image(),
        "OPD": new Image(),
        "Teste de Lente": new Image(),
        "YAG": new Image(),
        "Avaliação Cirurgia": new Image(),
        "Emergência": new Image(),
        "Conversar": new Image(),
        "Refração": new Image(),
        "Telefone": new Image(),
        "Ver ficha": new Image(),
        "Ver Lente": new Image(),
        "Laudo": new Image(),
        "PRK": new Image(),
        "Em Consulta": new Image(),
        "Aguardando": new Image(),
        "Normal ": new Image(),
        "Cancelada": new Image(),
        "Falta não Justificada": new Image(),
        "Falta": new Image(),
        "Falta Justificada": new Image(),
        "Confirmada": new Image(),
        "Aguardando triagem": new Image(),
        "Em triagem": new Image(),
        "Atendido": new Image(),
        "Executada ": new Image()
    };

    // Carregando imagens para cada chave
    imageDictionary["Consulta"].src = "/static/img/estatisticas/adicionar.png";
    imageDictionary["Resultado de Exames"].src = "/static/img/estatisticas/documento.png";
    imageDictionary["Retorno"].src = "/static/img/estatisticas/seta-esquerda.png";
    imageDictionary["Aguardando triagem"].src = "/static/img/status-consulta/feito.png";
    imageDictionary["Aguardando"].src = "/static/img/status-consulta/feito.png";
    imageDictionary["Telefone"].src = "/static/img/chamada-telefonica.png";
    imageDictionary["Em Consulta"].src = "/static/img/status-consulta/ematendimento.png";
    imageDictionary["Atendido"].src = "/static/img/status-consulta/botao-ok.png";
    imageDictionary["Cancelada"].src = "/static/img/status-consulta/quadra.png";
    imageDictionary["Falta"].src = "/static/img/status-consulta/sinal-de-parada.png";
    imageDictionary["Falta não Justificada"].src = "/static/img/status-consulta/sinal-de-parada.png";
    imageDictionary["Falta Justificada"].src = "/static/img/status-consulta/sinal-de-parada.png";
    imageDictionary["Executada "].src = "/static/img/estatisticas/aceitar.png";
    imageDictionary["Ver Lente"].src = "/static/img/estatisticas-prod/qtd_ver_lente.png";
    imageDictionary["Confirmada"].src = "/static/img/agendar.png";
    imageDictionary["Retorno Cirurgia"].src = "/static/img/pessoas.png";
    imageDictionary["Consulta + Resultado"].src = "/static/img/estatisticas-prod/qtd_consulta_resultado.png";
    imageDictionary["OPD"].src = "/static/img/pessoas.png";
    imageDictionary["Teste de Lente"].src = "/static/img/estatisticas-prod/qtd_teste_de_lente.png";
    imageDictionary["YAG"].src = "/static/img/estatisticas-prod/qtd_yag.png";
    imageDictionary["Avaliação Cirurgia"].src = "/static/img/pessoas.png";
    imageDictionary["Emergência"].src = "/static/img/estatisticas-prod/qtd_emergencia.png";
    imageDictionary["Conversar"].src = "/static/img/estatisticas-prod/qtd_conversar.png";
    imageDictionary["Refração"].src = "/static/img/estatisticas-prod/qtd_refracao.png";
    imageDictionary["Ver ficha"].src = "/static/img/estatisticas-prod/qtd_ver_ficha.png";
    imageDictionary["Laudo"].src = "/static/img/estatisticas-prod/qtd_laudo.png";
    imageDictionary["PRK"].src = "/static/img/estatisticas-prod/qtd_prk.png";
    imageDictionary["Normal "].src = "/static/img/agendamento.png";
    imageDictionary["Em triagem"].src = "/static/img/estatisticas-prod/qtd_em_triagem.png";


    fetch(`/get_agenda_data?data=${dataSelecionada}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                exibirMensagem(data.error, "error");
            } else {
                // Initialize statistics counters
                const statistics = {
                    qtd_consultas: "",
                    qtd_retorno: "",
                    qtd_retornos_cirurgia: "",
                    qtd_resultado_exame: "",
                    qtd_consulta_resultado: "",
                    qtd_opd: "",
                    qtd_teste_lente: "",
                    qtd_yag: "",
                    qtd_ava_cirurgica: "",
                    qtd_emergencia: "",
                    qtd_conversar: "",
                    qtd_refracao: "",
                    qtd_telefone: "",
                    qtd_ver_ficha: "",
                    qtd_ver_lente: "",
                    qtd_laudo: "",
                    qtd_prk: "",
                    qtd_em_andamento: "",
                    qtd_marcada: "",
                    qtd_cancelada: "",
                    qtd_confirmada: "",
                    qtd_faltas: "",
                    qtd_aguardando: "",
                    qtd_em_triagem: "",
                    qtd_atendido: "",
                    qtd_executada: ""
                };

                
                const novaTabela = document.getElementById('novaTabela');
                novaTabela.innerHTML = '';

                data.data
                    .filter(linha => linha[2] !== "Cancelada")
                    .forEach(linha => {
                        console.log("Linha completa:", linha);
                        console.log(`Tipo (linha[1]): ${linha[1]}, Status (linha[2]): ${linha[2]}`);
                        
                        // Tipo (linha[1])
                        if (linha[1] === "Consulta") statistics.qtd_consultas++;
                        else if (linha[1] === "Retorno") statistics.qtd_retorno++;
                        else if (linha[1] === "Retorno Cirurgia") statistics.qtd_retornos_cirurgia++;
                        else if (linha[1] === "Resultado de Exames") statistics.qtd_resultado_exame++;
                        else if (linha[1] === "Consulta + Resultado") statistics.qtd_consulta_resultado++;
                        else if (linha[1] === "OPD") statistics.qtd_opd++;
                        else if (linha[1] === "Teste de Lente") statistics.qtd_teste_lente++;
                        else if (linha[1] === "YAG") statistics.qtd_yag++;
                        else if (linha[1] === "Avaliação Cirurgia") statistics.qtd_ava_cirurgica++;
                        else if (linha[1] === "Emergência") statistics.qtd_emergencia++;
                        else if (linha[1] === "Conversar") statistics.qtd_conversar++;
                        else if (linha[1] === "Refração") statistics.qtd_refracao++;
                        else if (linha[1] === "Telefone") statistics.qtd_telefone++;
                        else if (linha[1] === "Ver ficha") statistics.qtd_ver_ficha++;
                        else if (linha[1] === "Ver Lente") statistics.qtd_ver_lente++;
                        else if (linha[1] === "Laudo") statistics.qtd_laudo++;
                        else if (linha[1] === "PRK") statistics.qtd_prk++;

                        // Status (linha[2])
                        if (linha[2] === "Em Consulta") statistics.qtd_em_andamento++;
                        else if (linha[2] === "Normal ") statistics.qtd_marcada++;
                        else if (linha[2] === "Cancelada") statistics.qtd_cancelada++;
                        else if (linha[2] === "Confirmada") statistics.qtd_confirmada++;
                        else if (linha[2] === "Falta" || linha[2] === "Falta Justificada" || linha[2] === "Falta não Justificada") statistics.qtd_faltas++;
                        else if (linha[2] === "Aguardando" || linha[2] === "Aguardando triagem") statistics.qtd_aguardando++;
                        else if (linha[2] === "Em triagem") statistics.qtd_em_triagem++;
                        else if (linha[2] === "Atendido") statistics.qtd_atendido++;
                        else if (linha[2] === "Executada ") statistics.qtd_executada++;

                        const telefone = linha[8] || '';
                        const telefoneFiltrado = telefone.replace(/[^0-9()\-]/g, '');
                        
                        console.log('Estou criando a tabela de agenda')
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${linha[0]}</td>
                            <td>${linha[3]}</td>
                            <td>${linha[4]}</td>
                            <td title="${linha[5] || ''}">${linha[5] || ''}</td>
                            <td>${linha[6] ? linha[6] : ''} ${linha[12] ? " | "+linha[12] : ''}</td>
                            <td>${linha[7]}</td>
                            <td title="${telefoneFiltrado}">${telefoneFiltrado}</td>
                            <td title="${linha[9] || ''}">${linha[9] || ''}</td>
                            <td style="display: none;" data-nr-atendimento="${linha[10]}"></td>
                            <td style="display: none;" data-cd-pessoa-fisica="${linha[11]}"></td>
                        `;
                            
                        // Coluna Comp (Status) - apenas ícone
                        const imgCellComp = document.createElement('td');
                        let imgSrcComp = imageDictionary[linha[2]]?.src;
                        
                        // Remover a lógica especial para OPD, Retorno Cirurgia e Avaliação Cirurgia
                        // A coluna Comp agora sempre usa o ícone de status (linha[2])
                        
                        if (linha[2] === "Aguardando" || linha[2] === "Em Consulta" || linha[2] === "Em andamento") {
                            const btnComp = document.createElement('button');
                            btnComp.className = 'btn-comp-aguardando';
                            btnComp.style.background = 'none';
                            btnComp.style.border = 'none';
                            btnComp.style.cursor = 'pointer';
                            btnComp.title = 'Marcar como atendido';

                            const img = new Image();
                            img.src =
                                linha[2] === "Aguardando"
                                    ? "/static/img/status-consulta/feito.png"
                                    : "/static/img/status-consulta/ematendimento.png";
                            img.alt = linha[2];
                            img.style.maxWidth = "30px";
                            img.style.maxHeight = "30px";
                            btnComp.appendChild(img);

                            btnComp.onclick = async function (e) {
                                e.stopPropagation();
                                const nrAtendimento = linha[10];
                                try {
                                    const response = await fetch(`/api/agenda/executar/${nrAtendimento}`, { method: 'POST' });
                                    if (response.ok) {
                                        img.src = "/static/img/status-consulta/botao-ok.png";
                                        img.alt = "Atendido";
                                        btnComp.disabled = true;
                                        btnComp.title = "Atendido";
                                    } else {
                                        alert("Erro ao marcar como atendido.");
                                    }
                                } catch (e) {
                                    alert("Erro de conexão ao marcar como atendido.");
                                }
                            };

                            imgCellComp.appendChild(btnComp);
                        } else if (linha[2] === "Executada ") {
                            const btnComp = document.createElement('button');
                            btnComp.className = 'btn-comp-executada';
                            btnComp.style.background = 'none';
                            btnComp.style.border = 'none';
                            btnComp.style.cursor = 'pointer';
                            btnComp.title = 'Voltar para aguardando';

                            const img = new Image();
                            img.src = "/static/img/estatisticas/aceitar.png"; // ícone Executada
                            img.alt = "Executada";
                            img.style.maxWidth = "30px";
                            img.style.maxHeight = "30px";
                            btnComp.appendChild(img);

                            btnComp.onclick = async function (e) {
                                e.stopPropagation();
                                const nrAtendimento = linha[10];
                                try {
                                    const response = await fetch(`/api/agenda/em_andamento/${nrAtendimento}`, { method: 'POST' });
                                    if (response.ok) {
                                        img.src = "/static/img/status-consulta/feito.png"; // ícone Aguardando
                                        img.alt = "Aguardando";
                                        btnComp.title = "Marcar como atendido";
                                        // Opcional: atualizar status localmente
                                    } else {
                                        alert("Erro ao voltar para aguardando.");
                                    }
                                } catch (e) {
                                    alert("Erro de conexão ao voltar para aguardando.");
                                }
                            };

                            imgCellComp.appendChild(btnComp);
                        } else {
                            if (imgSrcComp) {
                                const imgCloneComp = new Image();
                                imgCloneComp.src = imgSrcComp;
                                imgCloneComp.style.maxWidth = "30px";
                                imgCloneComp.style.maxHeight = "30px";
                                imgCellComp.appendChild(imgCloneComp);
                            } else {
                                imgCellComp.textContent = '';
                            }
                        }
                        tr.insertBefore(imgCellComp, tr.children[1]);

                        // Coluna Tipo - ícone + texto (máximo 8 caracteres visíveis)
                        const imgCellTipo = document.createElement('td');
                        imgCellTipo.title = linha[1] || ''; // Tooltip com texto completo
                        
                        const imgElementTipo = imageDictionary[linha[1]];
                        
                        // Se for "Livre", deixar célula vazia sem estilos de flex
                        if (linha[1] === "Livre" || !linha[1]) {
                            imgCellTipo.textContent = '';
                            // Remova ou comente as linhas abaixo para permitir largura variável
                            // imgCellTipo.style.width = '77px';
                            // imgCellTipo.style.maxWidth = '77px';
                            // imgCellTipo.style.minWidth = '77px';
                        } else {
                            // Aplicar estilos flex apenas quando houver conteúdo
                            imgCellTipo.style.display = 'flex';
                            imgCellTipo.style.alignItems = 'center';
                            imgCellTipo.style.gap = '5px';
                            // Remova ou comente as linhas abaixo para permitir largura variável
                            // imgCellTipo.style.width = '77px';
                            // imgCellTipo.style.maxWidth = '77px';
                            // imgCellTipo.style.minWidth = '77px';
                            imgCellTipo.style.overflow = 'hidden';
                            
                            if (imgElementTipo) {
                                const imgCloneTipo = new Image();
                                imgCloneTipo.src = imgElementTipo.src;
                                imgCloneTipo.style.maxWidth = "30px";
                                imgCloneTipo.style.maxHeight = "30px";
                                imgCloneTipo.style.flexShrink = "0"; // Impede que o ícone encolha
                                imgCellTipo.appendChild(imgCloneTipo);
                            }
                            
                            // Adicionar o texto do tipo (truncado visualmente)
                            const textoTipo = document.createElement('span');
                            textoTipo.textContent = linha[1];
                            // Remova ou comente as linhas abaixo para permitir texto completo sem truncamento
                            // textoTipo.style.overflow = 'hidden';
                            // textoTipo.style.textOverflow = 'ellipsis';
                            // textoTipo.style.whiteSpace = 'nowrap';
                            // textoTipo.style.maxWidth = 'calc(100% - 35px)'; // Espaço restante após ícone e gap
                            imgCellTipo.appendChild(textoTipo);
                        }
                        
                        tr.insertBefore(imgCellTipo, tr.children[8]);

                        novaTabela.appendChild(tr);
                        
                        tr.addEventListener('click', async function(event) {
                            // Se o clique foi no botão de status, não abre o prontuário
                            if (event.target.closest('.btn-comp-aguardando') || 
                                event.target.closest('.btn-comp-executada')) {
                                return;
                            }

                            const nrAtendimento = this.querySelector('td[data-nr-atendimento]').getAttribute('data-nr-atendimento');
                            const cdPessoaFisica = this.querySelector('td[data-cd-pessoa-fisica]').getAttribute('data-cd-pessoa-fisica');
                        
                            if (!nrAtendimento || !cdPessoaFisica) {
                                exibirMensagem("A recepção deve gerar um ATENDIMENTO para esse horário", "error");
                                return;
                            }
                        
                            // Verificar se pode abrir prontuário
                            const verificacao = podeAbrirProntuario();
                            if (!verificacao.pode) {
                                exibirMensagem(
                                    `Aguarde ${verificacao.tempoRestante} segundos antes de abrir outro prontuário`, 
                                    "warning"
                                );
                                return;
                            }

                            // Registrar abertura ANTES de tentar abrir
                            registrarAberturaProntuario();
                            
                            exibirMensagem("Abrindo Prontuário... \n O Prontuario será aberto em uma nova Janela", "info");

                            try {
                                const resposta = await fetch(`/prontuario/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}`);
                                const contentType = resposta.headers.get('content-type');
                        
                                if (contentType && contentType.includes('application/json')) {
                                    const resultado = await resposta.json();
                                    exibirMensagem(resultado.message, 'error');
                                } else {
                                    console.log('Opening patient record:', { nrAtendimento, cdPessoaFisica });
                                    const dataSelecionada = document.getElementById('calendario').value;
                                    window.open(`/prontuario/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}&data_agenda=${dataSelecionada}`, '_blank');
                                }
                            } catch (error) {
                                console.error("Erro ao buscar prontuário:", error);
                                exibirMensagem("Erro ao abrir prontuário", "error");
                            }
                        });
                    });

                // Store statistics in global variable for use by the statistics popup
                window.currentStatistics = statistics;
                
                document.getElementById('totalAgendamentos').textContent = data.total_agendamentos;
                document.getElementById('totalAtendidos').textContent = data.total_atendidos;
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar a agenda:', error);
        });
}

// Função para ajustar o estilo da tabela
function ajustarEstiloTabela() {
    const tabela = document.getElementById('novaTabela');
    if (!tabela) return;
    
    // Ajustar células para economizar espaço
    const celulas = tabela.querySelectorAll('th, td');
    celulas.forEach(celula => {
        celula.style.padding = '3px 5px';
        celula.style.fontSize = '12px';
        celula.style.lineHeight = '1.2';
        celula.style.whiteSpace = 'nowrap';
        celula.style.overflow = 'hidden';
        celula.style.textOverflow = 'ellipsis';
    });
    
    // Melhorar a visualização com cores alternadas
    const linhasImpares = tabela.querySelectorAll('tr:nth-child(odd)');
    linhasImpares.forEach(linha => {
        linha.style.backgroundColor = '#f8f8f8';
    });
    
    // Configurar efeito hover
    const linhas = tabela.querySelectorAll('tr');
    linhas.forEach(linha => {
        linha.addEventListener('mouseenter', () => {
            linha.style.backgroundColor = '#e6f0fa';
        });
        linha.addEventListener('mouseleave', () => {
            if (linha.rowIndex % 2 === 0) {
                linha.style.backgroundColor = '';
            } else {
                linha.style.backgroundColor = '#f8f8f8';
            }
        });
    });
}

// Chamar esta função após atualizar a agenda
// Adicione esta linha ao final da função atualizarAgenda(), antes do último }):
ajustarEstiloTabela();

// Função para iniciar a atualização automática da tabela
function iniciarAtualizacaoAutomatica() {
    setInterval(() => {
        atualizarAgenda(); // Atualiza a tabela a cada 15 segundos
    }, 15000); // 15.000 ms = 15 segundos
}

// Quando a página for carregada, definir a data atual no calendário e no span
window.onload = function () {
    const hoje = new Date();
    sincronizarData(hoje); // Sincroniza o calendário e o span com a data atual
    atualizarAgenda(); // Carrega a agenda com a data atual
    iniciarAtualizacaoAutomatica(); // Inicia a atualização automática
};

// Função para navegar para o dia anterior
document.getElementById('botaoAnterior').addEventListener('click', function () {
    const calendario = document.getElementById('calendario');
    const dataAtual = criarDataLocal(calendario.value);
    dataAtual.setDate(dataAtual.getDate() - 1); // Vai para o dia anterior
    sincronizarData(dataAtual); // Sincroniza a data no calendário e no span
    atualizarAgenda(); // Atualiza a agenda
});

// Função para navegar para o próximo dia
document.getElementById('botaoProximo').addEventListener('click', function () {
    const calendario = document.getElementById('calendario');
    const dataAtual = criarDataLocal(calendario.value);
    dataAtual.setDate(dataAtual.getDate() + 1); // Vai para o próximo dia
    sincronizarData(dataAtual); // Sincroniza a data no calendário e no span
    atualizarAgenda(); // Atualiza a agenda
});

// Evento ao selecionar uma data no calendário
document.getElementById('calendario').addEventListener('change', function () {
    const dataSelecionada = criarDataLocal(this.value);
    sincronizarData(dataSelecionada);
    atualizarAgenda(); // Atualiza a agenda com a nova data
});