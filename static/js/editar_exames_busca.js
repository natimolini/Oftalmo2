class EditarExamesBusca {
    constructor() {
        this.abaAtivaBusca = 'nome';
        this.abaAtivaEdicao = 'exames';
        this.examesOriginais = '';
        this.cirurgiasOriginais = '';
        this.prontuarioOriginal = '';
        this.nrAtendimentoAtual = null;
        this.dadosPacienteAtual = null;
        this.dadosEvolucaoAtual = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Abas de busca
        const tabsBusca = document.querySelectorAll('.busca-tab');
        tabsBusca.forEach(tab => {
            tab.addEventListener('click', () => this.trocarAbaBusca(tab.dataset.tab));
        });

        // Abas de edição
        const tabsEdicao = document.querySelectorAll('.tab-button');
        tabsEdicao.forEach(tab => {
            tab.addEventListener('click', () => this.trocarAbaEdicao(tab.dataset.tab));
        });

        // Botões de busca
        document.getElementById('busca-nome-btn').addEventListener('click', () => this.buscarPorNome());
        document.getElementById('busca-nascimento-btn').addEventListener('click', () => this.buscarPorNascimento());
        document.getElementById('busca-atendimento-btn').addEventListener('click', () => this.buscarPorAtendimento());

        // Enter nos inputs
        document.getElementById('busca-nome-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarPorNome();
        });

        document.getElementById('busca-nascimento-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarPorNascimento();
        });

        document.getElementById('busca-atendimento-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarPorAtendimento();
        });

        // Formatação de data
        const nascimentoInput = document.getElementById('busca-nascimento-input');
        nascimentoInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            if (value.length >= 5) {
                value = value.substring(0, 5) + '/' + value.substring(5, 9);
            }
            e.target.value = value;
        });

        // Popup de atendimentos
        const closeBtn = document.querySelector('#popup-atendimentos-editar .popup-atendimentos-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.fecharPopupAtendimentos());
        }

        document.getElementById('popup-atendimentos-editar').addEventListener('click', (e) => {
            if (e.target.id === 'popup-atendimentos-editar') {
                this.fecharPopupAtendimentos();
            }
        });

        // Botões de ação
        document.getElementById('btn-salvar').addEventListener('click', () => this.salvarDados());
        document.getElementById('btn-limpar').addEventListener('click', () => this.limparFormulario());
        document.getElementById('btn-imprimir-prontuario').addEventListener('click', () => this.imprimirProntuario());
        document.getElementById('btn-imprimir-resumo').addEventListener('click', () => this.imprimirResumo());

        // Detectar mudanças nos textareas
        const textareas = ['textarea-exames', 'textarea-cirurgias'];
        textareas.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                if (this.nrAtendimentoAtual) {
                    document.getElementById('btn-salvar').disabled = false;
                }
            });
        });
    }

    trocarAbaBusca(aba) {
        const tabs = document.querySelectorAll('.busca-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === aba);
        });

        const forms = document.querySelectorAll('.busca-form');
        forms.forEach(form => {
            form.classList.toggle('active', form.dataset.form === aba);
        });

        this.abaAtivaBusca = aba;
        this.limparResultados();
    }

    trocarAbaEdicao(aba) {
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === aba);
        });

        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${aba}`);
        });

        this.abaAtivaEdicao = aba;
    }

    async buscarPorNome() {
        const input = document.getElementById('busca-nome-input');
        const termo = input.value.trim();

        if (termo.length < 3) {
            this.exibirMensagem('Digite pelo menos 3 caracteres', 'error');
            return;
        }

        this.exibirCarregando();

        try {
            const response = await fetch(`/api/buscar-todos-pacientes?termo=${encodeURIComponent(termo)}`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar pacientes');
            }

            const pacientes = await response.json();
            this.exibirResultados(pacientes);
        } catch (error) {
            console.error('Erro:', error);
            this.exibirMensagem('Erro ao buscar pacientes', 'error');
        }
    }

    async buscarPorNascimento() {
        const input = document.getElementById('busca-nascimento-input');
        const data = input.value.trim();

        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(data)) {
            this.exibirMensagem('Digite uma data válida (DD/MM/AAAA)', 'error');
            return;
        }

        this.exibirCarregando();

        try {
            const response = await fetch(`/api/buscar-pacientes-nascimento?data=${encodeURIComponent(data)}`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar pacientes');
            }

            const pacientes = await response.json();
            this.exibirResultados(pacientes);
        } catch (error) {
            console.error('Erro:', error);
            this.exibirMensagem('Erro ao buscar pacientes', 'error');
        }
    }

    async buscarPorAtendimento() {
        const input = document.getElementById('busca-atendimento-input');
        const nrAtendimento = input.value.trim();

        if (!nrAtendimento) {
            this.exibirMensagem('Digite o número do atendimento', 'error');
            return;
        }

        try {
            await this.carregarDadosAtendimento(nrAtendimento);
            this.exibirMensagem('Dados carregados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro:', error);
            this.exibirMensagem('Erro ao buscar atendimento', 'error');
        }
    }

    exibirCarregando() {
        const container = document.getElementById('busca-resultados-container');
        const lista = document.getElementById('busca-lista');
        
        container.style.display = 'block';
        lista.innerHTML = '<div class="busca-loading">Buscando pacientes...</div>';
    }

    exibirResultados(pacientes) {
        const container = document.getElementById('busca-resultados-container');
        const lista = document.getElementById('busca-lista');

        container.style.display = 'block';

        if (pacientes.length === 0) {
            lista.innerHTML = '<div class="busca-vazio">Nenhum paciente encontrado</div>';
            return;
        }

        lista.innerHTML = '';

        pacientes.forEach(paciente => {
            const item = document.createElement('div');
            item.className = 'busca-item';
            
            item.innerHTML = `
                <div class="busca-item-info">
                    <div class="busca-item-nome">${paciente.nm_pessoa_fisica}</div>
                    <div class="busca-item-detalhes">
                        Nascimento: ${paciente.dt_nascimento || 'Não informado'} | 
                        CPF: ${paciente.nr_cpf || 'Não informado'}
                    </div>
                </div>
                <div class="busca-item-acoes">
                    <!-- Remover o botão Abrir Prontuário e o texto Sem atendimento -->
                    <button class="busca-item-btn btn-atendimentos" 
                            data-pessoa="${paciente.cd_pessoa_fisica}"
                            data-nome="${paciente.nm_pessoa_fisica}">
                        Todos Atendimentos
                    </button>
                    <button class="busca-item-btn btn-especial" 
                            data-pessoa="${paciente.cd_pessoa_fisica}"
                            data-nome="${paciente.nm_pessoa_fisica}">
                        Receita Especial
                    </button>
                </div>
            `;

            lista.appendChild(item);
        });

        // Bind eventos dos botões
        lista.querySelectorAll('.btn-prontuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nrAtendimento = e.target.dataset.atendimento;
                const cdPessoa = e.target.dataset.pessoa;
                this.abrirProntuario(nrAtendimento, cdPessoa);
            });
        });

        lista.querySelectorAll('.btn-atendimentos').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cdPessoa = e.target.dataset.pessoa;
                const nmPessoa = e.target.dataset.nome;
                this.abrirListaAtendimentos(cdPessoa, nmPessoa);
            });
        });

        lista.querySelectorAll('.btn-especial').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cdPessoa = e.target.dataset.pessoa;
                const nmPessoa = e.target.dataset.nome;
                this.abrirProntuarioEspecial(cdPessoa, nmPessoa);
            });
        });
    }

    async abrirListaAtendimentos(cdPessoa, nmPessoa) {
        const popup = document.getElementById('popup-atendimentos-editar');
        const lista = document.getElementById('popup-atendimentos-lista');
        const titulo = document.getElementById('popup-atendimentos-titulo');
        
        titulo.textContent = `Atendimentos - ${nmPessoa}`;
        popup.style.display = 'flex';
        lista.innerHTML = '<div class="atendimentos-loading">Carregando atendimentos...</div>';
        
        try {
            const response = await fetch(`/api/lista-atendimentos/${cdPessoa}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const atendimentos = await response.json();
            
            if (!atendimentos || atendimentos.length === 0) {
                lista.innerHTML = '<div class="atendimentos-vazio">Nenhum atendimento encontrado</div>';
                return;
            }
            
            lista.innerHTML = '';
            
            atendimentos.forEach(atendimento => {
                const item = document.createElement('div');
                item.className = 'atendimento-item';

                // Verifica se o atendimento está lançado
                const oftalmologiaGerada = !!atendimento.nr_atendimento;

                // Ícone e tooltip
                const statusIcon = document.createElement('span');
                statusIcon.className = 'atendimento-status-icon';
                statusIcon.style.marginRight = '8px';
                if (oftalmologiaGerada) {
                    statusIcon.innerHTML = '<img src="/static/img/status-consulta/aceitar1.png" title="Oftalmologia Gerada" style="width:20px;">';
                } else {
                    statusIcon.innerHTML = '<img src="/static/img/status-consulta/sinal-de-parada.png" title="Oftalmologia não gerada" style="width:20px;">';
                }

                // Monta o restante do item
                item.innerHTML = `
                    <div class="atendimento-info">
                        <div class="atendimento-data">${atendimento.data}</div>
                        <div class="atendimento-medico">Dr(a). ${atendimento.medico}</div>
                    </div>
                    <div class="atendimento-status ${atendimento.status === 'Atendido' ? 'status-atendido' : 'status-aguardando'}">
                        ${atendimento.status}
                    </div>
                    <div class="atendimento-acoes">
                        <button class="btn-editar-exam-cir" data-atendimento="${atendimento.nr_atendimento}">
                            Editar Exam/Cir
                        </button>
                        <button class="btn-abrir-prontuario" data-atendimento="${atendimento.nr_atendimento}">
                            Abrir Prontuário
                        </button>
                    </div>
                `;
                // Adiciona o ícone antes das informações
                item.querySelector('.atendimento-info').prepend(statusIcon);

                lista.appendChild(item);
            });

            // Bind eventos dos novos botões
            lista.querySelectorAll('.btn-editar-exam-cir').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const nrAtendimento = e.target.dataset.atendimento;
                    await this.carregarDadosAtendimento(nrAtendimento);
                    this.fecharPopupAtendimentos();
                    this.exibirMensagem('Dados carregados com sucesso!', 'success');
                });
            });

            lista.querySelectorAll('.btn-abrir-prontuario').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const nrAtendimento = e.target.dataset.atendimento;
                    const cdPessoa = e.target.dataset.pessoa;
                    this.abrirProntuario(nrAtendimento, cdPessoa);
                });
            });
            
        } catch (error) {
            console.error('Erro ao carregar atendimentos:', error);
            lista.innerHTML = '<div class="atendimentos-vazio">Erro ao carregar atendimentos: ' + error.message + '</div>';
        }
    }

    async carregarDadosAtendimento(nrAtendimento) {
        this.nrAtendimentoAtual = nrAtendimento;
        
        // Buscar dados do paciente e atendimento
        await this.carregarDadosPaciente(nrAtendimento);
        
        const textareaExames = document.getElementById('textarea-exames');
        const textareaCirurgias = document.getElementById('textarea-cirurgias');
        const textareaProntuario = document.getElementById('textarea-prontuario');

        // Buscar Exames
        const responseExames = await fetch(`/api/exames/${nrAtendimento}`);
        if (responseExames.ok) {
            const dataExames = await responseExames.json();
            textareaExames.value = dataExames.ds_exames || '';
            this.examesOriginais = dataExames.ds_exames || '';
        }

        // Buscar Cirurgias
        const responseCirurgias = await fetch(`/api/cirurgias/${nrAtendimento}`);
        if (responseCirurgias.ok) {
            const dataCirurgias = await responseCirurgias.json();
            textareaCirurgias.value = dataCirurgias.ds_cirurgias || '';
            this.cirurgiasOriginais = dataCirurgias.ds_cirurgias || '';
        }

        // Buscar Prontuário (Resumo)
        const responseProntuario = await fetch(`/api/prontuario-resumo/${nrAtendimento}`);
        if (responseProntuario.ok) {
            const dataProntuario = await responseProntuario.json();
            
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
            this.prontuarioOriginal = conteudoFormatado;
        }

        // Buscar dados de evolução para impressão
        await this.carregarDadosEvolucao(nrAtendimento);

        // Mostrar containers
        document.getElementById('dados-paciente-container').style.display = 'block';
        document.getElementById('tabs-edicao-container').style.display = 'block';
        document.getElementById('button-group-container').style.display = 'flex';
        document.getElementById('btn-salvar').disabled = false;
    }

    async carregarDadosPaciente(nrAtendimento) {
        try {
            const response = await fetch(`/api/dados-paciente-atendimento/${nrAtendimento}`);
            if (response.ok) {
                const dados = await response.json();
                this.dadosPacienteAtual = dados;
                
                document.getElementById('paciente-nome').textContent = dados.nm_pessoa_fisica || '-';
                document.getElementById('paciente-nascimento').textContent = dados.dt_nascimento || '-';
                document.getElementById('paciente-cpf').textContent = dados.nr_cpf || '-';
                document.getElementById('paciente-data-atendimento').textContent = dados.dt_atendimento || '-';
                document.getElementById('paciente-nr-atendimento').textContent = nrAtendimento;
            }
        } catch (error) {
            console.error('Erro ao carregar dados do paciente:', error);
        }
    }

    async carregarDadosEvolucao(nrAtendimento) {
        try {
            const response = await fetch(`/api/evolucao-completa/${nrAtendimento}`);
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de evolução');
            }
            
            const dados = await response.json();
            this.dadosEvolucaoAtual = dados;
            
            console.log('Dados de evolução carregados:', dados);
            return dados;
        } catch (error) {
            console.error('Erro ao carregar dados de evolução:', error);
            this.exibirMensagem('Erro ao carregar dados de evolução', 'error');
            return null;
        }
    }

    calcularIdade(dataNascimento) {
        if (!dataNascimento) return '-';
        
        const [dia, mes, ano] = dataNascimento.split('/');
        const nascimento = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = nascimento.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return `${idade} anos`;
    }

    async imprimirProntuario() {
        if (!this.nrAtendimentoAtual || !this.dadosPacienteAtual) {
            this.exibirMensagem('Nenhum atendimento selecionado', 'error');
            return;
        }

        try {
            // Carregar dados de evolução se ainda não foram carregados
            if (!this.dadosEvolucaoAtual) {
                await this.carregarDadosEvolucao(this.nrAtendimentoAtual);
            }

            // Preencher dados do cabeçalho
            document.getElementById('print-nr-atendimento').textContent = this.nrAtendimentoAtual || '-';
            document.getElementById('print-nome').textContent = this.dadosPacienteAtual.nm_pessoa_fisica || '-';
            document.getElementById('print-data-atendimento').textContent = this.dadosPacienteAtual.dt_atendimento || '-';
            
            const dataAtual = new Date();
            document.getElementById('print-data-documento').textContent = dataAtual.toLocaleDateString('pt-BR');
            document.getElementById('print-hora-documento').textContent = dataAtual.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            document.getElementById('print-nascimento').textContent = this.dadosPacienteAtual.dt_nascimento || '-';
            document.getElementById('print-idade').textContent = this.calcularIdade(this.dadosPacienteAtual.dt_nascimento);
            document.getElementById('print-sexo').textContent = this.dadosPacienteAtual.ie_sexo === 'M' ? 'Masculino' : 
                                                               this.dadosPacienteAtual.ie_sexo === 'F' ? 'Feminino' : '-';

            // Preencher seções - usando os nomes corretos dos campos
            document.getElementById('print-qp').textContent = this.dadosEvolucaoAtual.queixa_paciente || 'Não informado';
            document.getElementById('print-refracao').textContent = this.dadosEvolucaoAtual.refracao || 'Não informado';
            document.getElementById('print-acuidade').textContent = this.dadosEvolucaoAtual.acuidade_visual || 'Não informado';
            document.getElementById('print-diagnostico').textContent = this.dadosEvolucaoAtual.diagnostico || 'Não informado';
            document.getElementById('print-exames').textContent = this.dadosEvolucaoAtual.exames || 'Não informado';
            document.getElementById('print-conduta').textContent = this.dadosEvolucaoAtual.conduta || 'Não informado';
            document.getElementById('print-cirurgia').textContent = this.dadosEvolucaoAtual.cirurgias || 'Não informado';
            document.getElementById('print-lente').textContent = this.dadosEvolucaoAtual.lente_contato || 'Não informado';

            // IMPORTANTE: Remover outras classes antes de adicionar a nova
            document.body.classList.remove('imprimindo-resumo', 'imprimindo-agenda');
            document.body.classList.add('imprimindo-prontuario');
            
            // Imprimir
            window.print();
            
            // REMOVER a classe após a impressão
            setTimeout(() => {
                document.body.classList.remove('imprimindo-prontuario');
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao imprimir:', error);
            this.exibirMensagem('Erro ao preparar impressão', 'error');
            // Remover classe em caso de erro
            document.body.classList.remove('imprimindo-prontuario');
        }
    }

    async imprimirResumo() {
        if (!this.dadosPacienteAtual || !this.dadosPacienteAtual.cd_pessoa_fisica) {
            this.exibirMensagem('Nenhum paciente selecionado', 'error');
            return;
        }

        try {
            console.log('Buscando histórico do paciente:', this.dadosPacienteAtual.cd_pessoa_fisica);
            
            // Buscar histórico do paciente
            const response = await fetch(`/api/historico-paciente/${this.dadosPacienteAtual.cd_pessoa_fisica}`);
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar histórico: ${response.status} ${response.statusText}`);
            }

            const historico = await response.json();
            console.log('Histórico recebido:', historico);

            if (!historico || historico.length === 0) {
                this.exibirMensagem('Nenhum histórico encontrado para este paciente', 'error');
                return;
            }

            // Preencher dados do cabeçalho
            document.getElementById('print-resumo-nome').textContent = this.dadosPacienteAtual.nm_pessoa_fisica || '-';
            document.getElementById('print-resumo-nascimento').textContent = this.dadosPacienteAtual.dt_nascimento || '-';
            document.getElementById('print-resumo-cpf').textContent = this.dadosPacienteAtual.nr_cpf || '-';
            
            const dataAtual = new Date();
            document.getElementById('print-resumo-data-documento').textContent = dataAtual.toLocaleDateString('pt-BR');
            document.getElementById('print-resumo-hora-documento').textContent = dataAtual.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Montar conteúdo do histórico
            const conteudoResumo = document.getElementById('impressao-resumo-conteudo');
            conteudoResumo.innerHTML = '';

            historico.forEach((consulta, index) => {
                console.log(`Processando consulta ${index + 1}:`, consulta);
                
                const consultaDiv = document.createElement('div');
                consultaDiv.className = 'impressao-consulta';

                let consultaHTML = `
                    <div class="impressao-consulta-header">
                        <h3>Consulta - ${consulta.data_consulta || 'Data não informada'}</h3>
                        <span class="impressao-consulta-status">${consulta.tipo === 'normal' ? 'Consulta Normal' : 
                                                                   consulta.tipo === 'anterior' ? 'Registro Anterior' : 
                                                                   'Prontuário Especial'}</span>
                    </div>
                    <div class="impressao-consulta-info">
                        ${consulta.nr_atendimento ? `<strong>Nº Atendimento:</strong> ${consulta.nr_atendimento} | ` : ''}
                        ${consulta.medico ? `<strong>Médico:</strong> ${consulta.medico}` : ''}
                    </div>
                `;

                // Adicionar conteúdo formatado
                if (consulta.conteudo) {
                    // O conteúdo já vem formatado do backend
                    const conteudoFormatado = consulta.conteudo.replace(/\n/g, '<br>');
                    consultaHTML += `
                        <div class="impressao-consulta-campo">
                            ${conteudoFormatado}
                        </div>
                    `;
                }

                consultaDiv.innerHTML = consultaHTML;
                conteudoResumo.appendChild(consultaDiv);
            });

            console.log('Conteúdo de resumo montado, preparando para impressão');

            // IMPORTANTE: Remover outras classes antes de adicionar a nova
            document.body.classList.remove('imprimindo-prontuario', 'imprimindo-agenda');
            document.body.classList.add('imprimindo-resumo');
            
            // Imprimir
            window.print();
            
            // REMOVER a classe após a impressão
            setTimeout(() => {
                document.body.classList.remove('imprimindo-resumo');
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao imprimir resumo:', error);
            this.exibirMensagem('Erro ao preparar impressão do resumo: ' + error.message, 'error');
            // Remover classe em caso de erro
            document.body.classList.remove('imprimindo-resumo');
        }
    }

    async salvarDados() {
        const nrAtendimento = this.nrAtendimentoAtual;

        if (!nrAtendimento) {
            this.exibirMensagem('Número do atendimento não encontrado', 'error');
            return;
        }

        try {
            let successCount = 0;
            let errorMessages = [];

            const textareaExames = document.getElementById('textarea-exames');
            const textareaCirurgias = document.getElementById('textarea-cirurgias');

            // Salvar Exames se foi modificado
            if (textareaExames.value !== this.examesOriginais) {
                const responseExames = await fetch(`/api/exames/${nrAtendimento}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ds_exames: textareaExames.value.trim() })
                });

                if (responseExames.ok) {
                    this.examesOriginais = textareaExames.value;
                    successCount++;
                } else {
                    const error = await responseExames.json();
                    errorMessages.push(`Exames: ${error.detail}`);
                }
            }

            // Salvar Cirurgias se foi modificado
            if (textareaCirurgias.value !== this.cirurgiasOriginais) {
                const responseCirurgias = await fetch(`/api/cirurgias/${nrAtendimento}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ds_cirurgias: textareaCirurgias.value.trim() })
                });

                if (responseCirurgias.ok) {
                    this.cirurgiasOriginais = textareaCirurgias.value;
                    successCount++;
                } else {
                    const error = await responseCirurgias.json();
                    errorMessages.push(`Cirurgias: ${error.detail}`);
                }
            }

            if (errorMessages.length > 0) {
                this.exibirMensagem(`Erros: ${errorMessages.join(', ')}`, 'error');
            } else if (successCount > 0) {
                this.exibirMensagem('Dados salvos com sucesso!', 'success');
                document.getElementById('btn-salvar').disabled = true;
            } else {
                this.exibirMensagem('Nenhuma alteração foi feita', 'info');
            }

        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.exibirMensagem('Erro ao salvar dados. Tente novamente.', 'error');
        }
    }

    limparFormulario() {
        document.getElementById('busca-nome-input').value = '';
        document.getElementById('busca-nascimento-input').value = '';
        document.getElementById('busca-atendimento-input').value = '';
        document.getElementById('textarea-exames').value = '';
        document.getElementById('textarea-cirurgias').value = '';
        document.getElementById('textarea-prontuario').value = '';
        
        this.examesOriginais = '';
        this.cirurgiasOriginais = '';
        this.prontuarioOriginal = '';
        this.nrAtendimentoAtual = null;
        this.dadosPacienteAtual = null;
        this.dadosEvolucaoAtual = null;
        
        document.getElementById('dados-paciente-container').style.display = 'none';
        document.getElementById('tabs-edicao-container').style.display = 'none';
        document.getElementById('button-group-container').style.display = 'none';
        document.getElementById('btn-salvar').disabled = true;
        this.limparResultados();
    }

    limparResultados() {
        const container = document.getElementById('busca-resultados-container');
        const lista = document.getElementById('busca-lista');
        
        container.style.display = 'none';
        lista.innerHTML = '';
    }

    fecharPopupAtendimentos() {
        document.getElementById('popup-atendimentos-editar').style.display = 'none';
    }

    abrirProntuario(nrAtendimento, cdPessoa) {
        window.open(`/prontuario/${nrAtendimento}?cd_pessoa_fisica=${cdPessoa}`, '_blank');
    }

    abrirProntuarioEspecial(cdPessoa, nmPessoa) {
        sessionStorage.setItem('prontuario_especial', 'true');
        sessionStorage.setItem('cd_pessoa_fisica_especial', cdPessoa);
        sessionStorage.setItem('nm_pessoa_especial', nmPessoa);
        
        window.open(`/prontuario-especial?cd_pessoa_fisica=${cdPessoa}`, '_blank');
    }

    exibirMensagem(mensagem, tipo = 'success') {
        const flashMessageDiv = document.getElementById('flash-message');
        flashMessageDiv.textContent = mensagem;
        flashMessageDiv.className = `flash-message ${tipo}`;
        flashMessageDiv.style.display = 'block';

        setTimeout(() => {
            flashMessageDiv.style.opacity = '0';
            setTimeout(() => {
                flashMessageDiv.style.display = 'none';
                flashMessageDiv.style.opacity = '1';
            }, 300);
        }, 3000);
    }
}

// Função para formatar data por extenso
function dataPorExtenso(dataISO) {
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const [ano, mes, dia] = dataISO.split("-");
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${ano}`;
}

// Preencher campo de data com hoje
document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('data-impressao-agenda');
    if (inputData) {
        const hoje = new Date();
        inputData.value = hoje.toISOString().slice(0, 10);
    }
});

// Evento do botão de imprimir agenda
document.getElementById('btn-imprimir-agenda').addEventListener('click', async () => {
    const data = document.getElementById('data-impressao-agenda').value;
    if (!data) return alert("Selecione uma data!");

    // Buscar agenda do backend
    const resp = await fetch(`/get_agenda_data?data=${data}`);
    if (!resp.ok) return alert("Erro ao buscar agenda!");

    const agenda = await resp.json();
    const tbody = document.getElementById('impressao-agenda-tbody');
    tbody.innerHTML = "";

    // agenda.data: array de arrays, colunas: [0]=hora, [5]=nome, [7]=convenio, [1]=tipo, [2]=comp
    agenda.data
        .filter(linha => linha[2] !== "Cancelada")
        .forEach(linha => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${linha[0] || ""}</td>
            <td>${linha[5] || ""}</td>
            <td>${linha[7] || ""}</td>
            <td>${linha[1] || ""}</td>
        `;
        tbody.appendChild(tr);
    });

    // Preencher header
    document.getElementById('agenda-data-extenso').textContent = dataPorExtenso(data);

    // IMPORTANTE: Remover outras classes antes de adicionar a nova
    document.body.classList.remove('imprimindo-prontuario', 'imprimindo-resumo');
    
    // Mostrar template de impressão
    document.getElementById('impressao-agenda-template').style.display = "block";
    document.body.classList.add('imprimindo-agenda');

    // Imprimir
    window.print();

    // Esconder template após impressão e remover classe
    setTimeout(() => {
        document.getElementById('impressao-agenda-template').style.display = "none";
        document.body.classList.remove('imprimindo-agenda');
    }, 1000);
});

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    new EditarExamesBusca();
});