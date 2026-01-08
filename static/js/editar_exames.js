/* filepath: /home/acesso/GHR-TECH/02_producao/GA0082-ProntuarioOftalmoClinicas/app/static/js/editar_exames.js */
document.addEventListener('DOMContentLoaded', () => {
    const nrAtendimentoInput = document.getElementById('nr_atendimento');
    const textareaExames = document.getElementById('textarea-exames');
    const textareaCirurgias = document.getElementById('textarea-cirurgias');
    const textareaProntuario = document.getElementById('textarea-prontuario');
    const btnBuscar = document.getElementById('btn-buscar');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnLimpar = document.getElementById('btn-limpar');
    const flashMessageDiv = document.getElementById('flash-message');

    let examesOriginais = '';
    let cirurgiasOriginais = '';
    let prontuarioOriginal = '';
    let abaAtiva = 'exames';

    // Gerenciamento de Abas
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Update active tab
            abaAtiva = tabId;
        });
    });

    // Função para exibir mensagens
    const exibirMensagem = (mensagem, tipo = "success") => {
        flashMessageDiv.textContent = mensagem;
        flashMessageDiv.className = `flash-message ${tipo}`;
        flashMessageDiv.style.display = "block";

        setTimeout(() => {
            flashMessageDiv.style.opacity = "0";
            setTimeout(() => {
                flashMessageDiv.style.display = "none";
                flashMessageDiv.style.opacity = "1";
            }, 300);
        }, 3000);
    };

    // Buscar dados
    btnBuscar.addEventListener('click', async () => {
        const nrAtendimento = nrAtendimentoInput.value.trim();

        if (!nrAtendimento) {
            exibirMensagem('Por favor, digite o número do atendimento', 'error');
            return;
        }

        try {
            // Buscar Exames
            const responseExames = await fetch(`/api/exames/${nrAtendimento}`);
            if (responseExames.ok) {
                const dataExames = await responseExames.json();
                textareaExames.value = dataExames.ds_exames || '';
                examesOriginais = dataExames.ds_exames || '';
            }

            // Buscar Cirurgias
            const responseCirurgias = await fetch(`/api/cirurgias/${nrAtendimento}`);
            if (responseCirurgias.ok) {
                const dataCirurgias = await responseCirurgias.json();
                textareaCirurgias.value = dataCirurgias.ds_cirurgias || '';
                cirurgiasOriginais = dataCirurgias.ds_cirurgias || '';
            }

            // Buscar Prontuário (Resumo)
            const responseProntuario = await fetch(`/api/prontuario-resumo/${nrAtendimento}`);
            if (responseProntuario.ok) {
                const dataProntuario = await responseProntuario.json();
                
                // Formatar o conteúdo do prontuário de forma legível
                let conteudoFormatado = '';
                
                if (dataProntuario.data_consulta) {
                    conteudoFormatado += `Data da Consulta: ${dataProntuario.data_consulta}\n`;
                }
                if (dataProntuario.medico) {
                    conteudoFormatado += `Médico: ${dataProntuario.medico}\n`;
                }
                conteudoFormatado += `\n${'-'.repeat(60)}\n\n`;
                conteudoFormatado += dataProntuario.conteudo || 'Nenhum dado encontrado';
                
                textareaProntuario.value = conteudoFormatado;
                prontuarioOriginal = conteudoFormatado;
            } else {
                textareaProntuario.value = 'Erro ao carregar dados do prontuário';
                prontuarioOriginal = '';
            }

            btnSalvar.disabled = false;
            exibirMensagem('Dados carregados com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            exibirMensagem('Erro ao buscar dados. Tente novamente.', 'error');
        }
    });

    // Salvar dados
    btnSalvar.addEventListener('click', async () => {
        const nrAtendimento = nrAtendimentoInput.value.trim();

        if (!nrAtendimento) {
            exibirMensagem('Número do atendimento não encontrado', 'error');
            return;
        }

        try {
            let successCount = 0;
            let errorMessages = [];

            // Salvar Exames se foi modificado
            if (textareaExames.value !== examesOriginais) {
                const responseExames = await fetch(`/api/exames/${nrAtendimento}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ds_exames: textareaExames.value.trim() })
                });

                if (responseExames.ok) {
                    examesOriginais = textareaExames.value;
                    successCount++;
                } else {
                    const error = await responseExames.json();
                    errorMessages.push(`Exames: ${error.detail}`);
                }
            }

            // Salvar Cirurgias se foi modificado
            if (textareaCirurgias.value !== cirurgiasOriginais) {
                const responseCirurgias = await fetch(`/api/cirurgias/${nrAtendimento}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ds_cirurgias: textareaCirurgias.value.trim() })
                });

                if (responseCirurgias.ok) {
                    cirurgiasOriginais = textareaCirurgias.value;
                    successCount++;
                } else {
                    const error = await responseCirurgias.json();
                    errorMessages.push(`Cirurgias: ${error.detail}`);
                }
            }

            if (errorMessages.length > 0) {
                exibirMensagem(`Erros: ${errorMessages.join(', ')}`, 'error');
            } else if (successCount > 0) {
                exibirMensagem('Dados salvos com sucesso!', 'success');
            } else {
                exibirMensagem('Nenhuma alteração foi feita', 'info');
            }

        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            exibirMensagem('Erro ao salvar dados. Tente novamente.', 'error');
        }
    });

    // Limpar formulário
    btnLimpar.addEventListener('click', () => {
        nrAtendimentoInput.value = '';
        textareaExames.value = '';
        textareaCirurgias.value = '';
        textareaProntuario.value = '';
        examesOriginais = '';
        cirurgiasOriginais = '';
        prontuarioOriginal = '';
        btnSalvar.disabled = true;
    });

    // Habilitar Enter para buscar
    nrAtendimentoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnBuscar.click();
        }
    });

    // Detectar mudanças nos textareas
    [textareaExames, textareaCirurgias, textareaProntuario].forEach(textarea => {
        textarea.addEventListener('input', () => {
            if (nrAtendimentoInput.value.trim()) {
                btnSalvar.disabled = false;
            }
        });
    });
});